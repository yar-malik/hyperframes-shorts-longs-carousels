/**
 * Adds one topic to the board, optionally with a piece already made.
 *
 *   node scripts/board/add-topic.mjs --title="..." --community=voho \
 *     --long=https://youtu.be/...            # say what it would add
 *   ... --write                               # add it
 *
 * --community is avc, ccm or voho. --long= and --short= take a YouTube link
 * and tick that piece as made, with the link where the topic's page plays
 * it. A topic whose title is already on the board is left alone, so running
 * it twice adds nothing the second time.
 *
 * Supabase is reachable only from voho-vm, so this runs there.
 */
import { readFileSync } from "node:fs";

for (const f of [".env.production.local", ".env.local", ".env"]) {
  try {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
const U = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !KEY) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."); process.exit(1); }
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || "").slice(k.length + 3).trim();
const WRITE = process.argv.includes("--write");
const title = arg("title"), community = arg("community").toLowerCase();
if (!title) { console.error("--title= is required"); process.exit(1); }
if (community && !["avc", "ccm", "voho"].includes(community)) { console.error("--community is avc, ccm or voho"); process.exit(1); }
const H = { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" };

const board = await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.default&select=rev,state`, { headers: H })).json();
if (!board || !board[0]) { console.error("no board document"); process.exit(1); }
const rev = board[0].rev;
const state = board[0].state || {};
const ideas = Array.isArray(state.ideas) ? state.ideas : [];
if (ideas.some((x) => String(x.section || "") === "topic" && String(x.title || "").trim().toLowerCase() === title.toLowerCase())) {
  console.log(`= already a topic: ${title}`);
  process.exit(0);
}

const now = new Date().toISOString();
const row = {
  id: "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
  section: "topic", platform: "", title, owner: "", status: "new",
  note: arg("note"), source: arg("source"), sourceUrl: "",
  made: {}, links: {}, addedAt: now,
};
if (community) row.community = community;
for (const k of ["long", "short"]) {
  const u = arg(k);
  if (!u) continue;
  if (!/^https?:\/\//.test(u)) { console.error(`--${k} must be a link`); process.exit(1); }
  row.made[k] = "done";
  row.links[k] = u;
  if (!row.sourceUrl) row.sourceUrl = u;
}
console.log(`+ ${community ? community.toUpperCase() + "  " : ""}${title}   made: ${Object.keys(row.made).join(", ") || "nothing yet"}`);
if (!WRITE) { console.log("\nDry run. Nothing written. Add --write."); process.exit(0); }

state.ideas = ideas.concat([row]);
state.rev = rev + 1;
state.savedBy = "add topic";
state.savedAt = now;
const res = await fetch(`${U}/rest/v1/content_automation_board?id=eq.default&rev=eq.${rev}`, {
  method: "PATCH",
  headers: { ...H, prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state, saved_by: "add topic", saved_at: now }),
});
if (!res.ok) { console.error(`write failed: ${res.status} ${await res.text()}`); process.exit(1); }
const back = await res.json();
if (!back.length) { console.error("somebody saved the board while this ran — run it again"); process.exit(1); }
console.log(`Done. Board now at rev ${back[0].rev}.`);
