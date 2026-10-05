/**
 * Puts a topic's finished pieces on its row, so the Topics page can show
 * them: the short, both decks, the LinkedIn post, the tweet and the article.
 *
 *   node scripts/board/set-topic-pieces.mjs --slug=free-unlimited-claude-code \
 *     --topic="Free unlimited Claude Code"            # say what it would do
 *   ... --write                                        # do it
 *
 * Reads public/content-automation/made/<slug>/pieces.json, which
 * scripts/content/render-topic-pieces.mjs writes. The topic is found by the
 * start of its title, and it must match exactly one row. Every piece that is
 * in the file is ticked as made; the short's YouTube link goes in `links`,
 * where the row's ↗ already looks for it.
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
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || "").slice(k.length + 3);
const WRITE = process.argv.includes("--write");
const slug = arg("slug"), want = arg("topic").trim().toLowerCase();
if (!slug || !want) { console.error("--slug= and --topic= are required"); process.exit(1); }
const H = { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" };

const pieces = JSON.parse(readFileSync(`public/content-automation/made/${slug}/pieces.json`, "utf8"));

const board = await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.default&select=rev,state`, { headers: H })).json();
if (!board || !board[0]) { console.error("no board document"); process.exit(1); }
const rev = board[0].rev;
const state = board[0].state || {};
const ideas = Array.isArray(state.ideas) ? state.ideas : [];
const hits = ideas.filter((x) => String(x.section || "") === "topic" && String(x.title || "").trim().toLowerCase().startsWith(want));
if (hits.length !== 1) {
  console.error(`"${want}" matches ${hits.length} topics${hits.length ? ": " + hits.map((x) => x.title).join(" | ") : ""}`);
  process.exit(1);
}
const x = hits[0];

const stored = {};
const made = [];
if (pieces.short && pieces.short.url) { stored.short = pieces.short; made.push("short"); }
if (pieces.ig && pieces.ig.slides && pieces.ig.slides.length) { stored.ig = pieces.ig; made.push("ig"); }
if (pieces.li && pieces.li.slides && pieces.li.slides.length) { stored.li = pieces.li; made.push("li"); }
if (pieces.lipost && pieces.lipost.text) { stored.lipost = pieces.lipost; made.push("lipost"); }
if (pieces.tweet && pieces.tweet.text) { stored.tweet = pieces.tweet; made.push("tweet"); }
if (pieces.article && pieces.article.body) { stored.article = pieces.article; made.push("article"); }

console.log(`topic: ${x.title}`);
console.log(`pieces: ${made.join(", ")}`);
if (!WRITE) { console.log("\nDry run. Nothing written. Add --write."); process.exit(0); }

x.pieces = stored;
x.made = x.made && typeof x.made === "object" ? x.made : {};
for (const k of made) x.made[k] = "done";
delete x.made.carousel;
x.links = x.links && typeof x.links === "object" ? x.links : {};
if (stored.short) x.links.short = stored.short.url;

const now = new Date().toISOString();
state.ideas = ideas;
state.rev = rev + 1;
state.savedBy = "topic pieces";
state.savedAt = now;
const res = await fetch(`${U}/rest/v1/content_automation_board?id=eq.default&rev=eq.${rev}`, {
  method: "PATCH",
  headers: { ...H, prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state, saved_by: "topic pieces", saved_at: now }),
});
if (!res.ok) { console.error(`write failed: ${res.status} ${await res.text()}`); process.exit(1); }
const back = await res.json();
if (!back.length) { console.error("somebody saved the board while this ran — run it again"); process.exit(1); }
console.log(`\nDone. Board now at rev ${back[0].rev}.`);
