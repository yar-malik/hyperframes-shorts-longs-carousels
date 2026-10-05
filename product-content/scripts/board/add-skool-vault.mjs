/**
 * Put the researched Skool examples in Vault -> Skool Posts.
 *
 *   node scripts/add-skool-vault.mjs          # preview
 *   node scripts/add-skool-vault.mjs --write  # save
 *
 * The filesystem copy is the source of truth. Re-running refreshes a row by
 * its direct Skool URL, so corrected wording never creates a duplicate card.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

for (const file of [".env.local", ".env.production.local"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!url || !key) {
  console.error("Supabase is not configured.");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json" };
const write = process.argv.includes("--write");
const root = join(process.cwd(), "content", "vault", "09 Skool Posts");

function field(markdown, name) {
  return markdown.match(new RegExp(`^- ${name}: (.+)$`, "mi"))?.[1]?.trim() || "";
}

function bodyOf(markdown) {
  const lines = markdown.split("\n");
  let at = 1;
  while (at < lines.length && (!lines[at].trim() || lines[at].startsWith("- "))) at++;
  return lines.slice(at).join("\n").trim();
}

function numberBefore(text, word) {
  const match = text.match(new RegExp(`([\\d,.]+)\\s+${word}`));
  return match ? Number(match[1].replaceAll(",", "")) : 0;
}

const examples = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const dir = join(root, entry.name);
    const markdown = readFileSync(join(dir, "post.md"), "utf8");
    const sourceUrl = readFileSync(join(dir, "source.txt"), "utf8").trim();
    const comments = readFileSync(join(dir, "comments.md"), "utf8")
      .replace(/^# .*\n+/, "")
      .trim();
    const engagement = field(markdown, "Engagement captured");
    const community = field(markdown, "Community");
    return {
      id: `skool-vault-${new URL(sourceUrl).pathname.split("/").filter(Boolean).pop()}`,
      section: "vault",
      platform: "skool",
      status: "Idea",
      title: markdown.match(/^# (.+)$/m)?.[1]?.trim() || entry.name,
      post: bodyOf(markdown),
      note: `Selected from ${community} for strong engagement and a useful comment discussion.`,
      source: community,
      sourceUrl,
      author: field(markdown, "Author"),
      category: field(markdown, "Category"),
      when: field(markdown, "Posted"),
      likes: numberBefore(engagement, "likes"),
      commentCount: numberBefore(engagement, "comments"),
      poll: numberBefore(engagement, "poll votes"),
      comments,
    };
  });

const response = await fetch(`${url}/rest/v1/content_automation_board?id=eq.default&select=rev,state`, { headers });
if (!response.ok) {
  console.error(`Read failed: ${response.status}`);
  process.exit(1);
}
const rows = await response.json();
const current = rows[0]?.state;
const rev = rows[0]?.rev ?? 0;
if (!current) {
  console.error("No content automation board found.");
  process.exit(1);
}

const ideas = Array.isArray(current.ideas) ? current.ideas.map((idea) => ({ ...idea })) : [];
const byUrl = new Map(ideas.map((idea, index) => [String(idea.sourceUrl || "").trim(), index]));
const now = new Date().toISOString();
let added = 0;
let refreshed = 0;

for (const example of examples) {
  const index = byUrl.get(example.sourceUrl);
  if (index === undefined) {
    ideas.push({ ...example, owner: "", addedAt: now });
    byUrl.set(example.sourceUrl, ideas.length - 1);
    added++;
  } else {
    ideas[index] = { ...ideas[index], ...example };
    refreshed++;
  }
}

console.log(`Board revision ${rev}`);
console.log(`Skool examples: ${examples.length} (${added} new, ${refreshed} refreshed)`);
for (const example of examples) console.log(`- ${example.source}: ${example.title}`);

if (!write) {
  console.log("\nPreview only. Add --write to save.");
  process.exit(0);
}

const savedAt = new Date().toISOString();
const next = { ...current, ideas, rev: rev + 1, savedBy: "Yar", savedAt };
const save = await fetch(`${url}/rest/v1/content_automation_board?id=eq.default&rev=eq.${rev}`, {
  method: "PATCH",
  headers: { ...headers, Prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state: next, saved_by: "Yar", saved_at: savedAt }),
});
const savedRows = save.ok ? await save.json() : [];
if (!save.ok || !savedRows.length) {
  console.error(`Save failed${save.ok ? " because the board changed; run again" : `: ${save.status}`}.`);
  process.exit(1);
}
console.log(`\nSaved. Board is now revision ${rev + 1}.`);
