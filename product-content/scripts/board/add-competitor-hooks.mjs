/**
 * Add a small, attributed starter set to Vault -> YouTube Hooks.
 *
 *   node scripts/add-competitor-hooks.mjs          # preview
 *   node scripts/add-competitor-hooks.mjs --write  # save
 *
 * Idempotent by YouTube URL. Existing rows keep their id and created date,
 * while the title, attribution, and short opening excerpt are refreshed.
 *
 * The opening line goes in `post` as well as `note`, because that is the field
 * the hook writer reads off the Vault when it collects worked examples. Put it
 * only in `note` and the model is shown our attribution labels instead of the
 * hooks themselves.
 */
import { readFileSync } from "node:fs";

for (const file of [".env.local", ".env.production.local"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {}
}

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!url || !key) {
  console.error("Supabase is not configured.");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "content-type": "application/json",
};
const write = process.argv.includes("--write");

const HOOKS = [
  {
    sourceUrl: "https://www.youtube.com/watch?v=0zlwXSVmoeg",
    title: "Nick Saraev — cheapness + visual proof: $1 cinematic websites",
    note: "Kimi K3 can design absolutely gorgeous, beautiful websites just like these for literally just a dollar or two.",
  },
  {
    sourceUrl: "https://www.youtube.com/watch?v=eCx3SSCcISo",
    title: "Nick Saraev — contrarian verdict: a second brain that is not hot air",
    note: "This company just built a knowledge base that I think is not total hot air. And that’s hard for me to say.",
  },
  {
    sourceUrl: "https://www.youtube.com/watch?v=_AyXuJKm8iw",
    title: "The AI Advantage — category expansion: Astra can do entirely new work",
    note: "As you might have heard, GPT-6 Astra is here, and it’s not just better at doing typical tasks.",
  },
  {
    sourceUrl: "https://www.youtube.com/watch?v=yshSzI1rAMs",
    title: "The AI Advantage — news sweep: every major AI player shipped",
    note: "We just got a wave of new releases from all the big players: ChatGPT, Claude, and Grok.",
  },
  {
    sourceUrl: "https://www.youtube.com/watch?v=rKo9iLGjUbs",
    title: "Matt Wolfe — personal obsession: the one AI use worth caring about",
    note: "There’s really only one thing that’s been getting me pretty fired up lately about AI, and that’s building.",
  },
];

const endpoint = `${url}/rest/v1/content_automation_board?id=eq.default&select=rev,state`;
const response = await fetch(endpoint, { headers });
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

for (const hook of HOOKS) {
  const index = byUrl.get(hook.sourceUrl);
  if (index !== undefined) {
    ideas[index] = {
      ...ideas[index],
      section: "vault",
      platform: "yt-hooks",
      title: hook.title,
      source: "YouTube",
      sourceUrl: hook.sourceUrl,
      post: hook.note,
      note: hook.note,
    };
    refreshed++;
    continue;
  }

  const id = `hook-${new URL(hook.sourceUrl).searchParams.get("v")}`;
  ideas.push({
    id,
    section: "vault",
    platform: "yt-hooks",
    title: hook.title,
    owner: "",
    status: "Idea",
    post: hook.note,
    note: hook.note,
    source: "YouTube",
    sourceUrl: hook.sourceUrl,
    addedAt: now,
  });
  byUrl.set(hook.sourceUrl, ideas.length - 1);
  added++;
}

console.log(`Board revision ${rev}`);
console.log(`YouTube hooks: ${HOOKS.length} (${added} new, ${refreshed} refreshed)`);
for (const hook of HOOKS) console.log(`- ${hook.title}`);

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
