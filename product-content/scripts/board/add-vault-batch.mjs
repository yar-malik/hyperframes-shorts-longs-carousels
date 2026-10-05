/**
 * Additive-only Content Automation vault importer.
 *
 * Usage: node scripts/add-vault-batch.mjs /tmp/competitor-batch.json
 *
 * Reads the live board first, skips duplicate source URLs, then writes only
 * per-row `add` operations. It never replaces the ideas collection.
 */
import { createHash, createHmac } from "node:crypto";
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

const secret = process.env.CONTENT_AUTOMATION_SECRET || process.env.CA_SECRET || "";
if (!secret) throw new Error("CONTENT_AUTOMATION_SECRET is not configured");

const session = {
  email: "vault-research@yarmalik.com",
  name: "Yar",
  role: "admin",
  iat: Math.floor(Date.now() / 1000),
};
const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
const signature = createHmac("sha256", secret).update(payload).digest("base64url");
const cookie = `content_automation_session=${payload}.${signature}`;
const endpoint = "https://content.yarmalik.com/api/content-automation";

async function getBoard() {
  const response = await fetch(endpoint, { headers: { accept: "application/json", cookie } });
  if (!response.ok) throw new Error(`Board read failed: ${response.status}`);
  return response.json();
}

async function addRows(rows) {
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ ops: rows.map((row) => ({ t: "add", coll: "ideas", row })) }),
  });
  if (!response.ok) throw new Error(`Vault add failed: ${response.status} ${await response.text()}`);
  return response.json();
}

function normalizedUrl(value) {
  const raw = String(value || "").trim();
  try {
    const url = new URL(raw);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_") || ["si", "feature", "ref", "src"].includes(key)) url.searchParams.delete(key);
    }
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return raw.replace(/#.*$/, "").replace(/\/$/, "").toLowerCase();
  }
}

function stableId(row) {
  const digest = createHash("sha256").update(`${row.platform}:${normalizedUrl(row.sourceUrl)}`).digest("hex").slice(0, 14);
  return `research-${row.platform}-${digest}`;
}

function vaultCounts(board) {
  return (board.ideas || []).filter((row) => row.section === "vault").reduce((all, row) => {
    all[row.platform] = (all[row.platform] || 0) + 1;
    return all;
  }, {});
}

const file = process.argv[2];
if (!file) throw new Error("Provide a competitor batch JSON file");
const input = JSON.parse(readFileSync(file, "utf8"));
if (!Array.isArray(input)) throw new Error("Batch file must contain a JSON array");

const before = await getBoard();
const existing = new Set((before.ideas || []).map((row) => normalizedUrl(row.sourceUrl)).filter(Boolean));
const seen = new Set();
const addedAt = new Date().toISOString();
const rows = input
  .filter((row) => row?.sourceUrl && !existing.has(normalizedUrl(row.sourceUrl)) && !seen.has(normalizedUrl(row.sourceUrl)))
  .map((row) => {
    seen.add(normalizedUrl(row.sourceUrl));
    return {
      id: stableId(row),
      section: "vault",
      platform: row.platform,
      title: row.title,
      author: row.author || "",
      handle: row.handle || "",
      source: row.source || "",
      sourceUrl: row.sourceUrl,
      post: row.post || "",
      note: row.note || "",
      likes: row.likes ?? undefined,
      replies: row.replies ?? undefined,
      owner: "",
      status: "Idea",
      addedAt,
    };
  });

console.log(JSON.stringify({ rev: before.rev, before: vaultCounts(before), requested: input.length, newRows: rows.length, skipped: input.length - rows.length }, null, 2));
for (let index = 0; index < rows.length; index += 100) {
  await addRows(rows.slice(index, index + 100));
  console.log(`added ${Math.min(index + 100, rows.length)} / ${rows.length}`);
}
const after = await getBoard();
console.log(JSON.stringify({ rev: after.rev, ideas: after.ideas?.length || 0, after: vaultCounts(after) }, null, 2));
