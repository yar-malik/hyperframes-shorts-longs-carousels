/**
 * Fills the Topics page in from what has already gone out.
 *
 *   node scripts/board/backfill-topics.mjs            # say what it would add
 *   node scripts/board/backfill-topics.mjs --write    # add them
 *   node scripts/board/backfill-topics.mjs --all      # include the singles too
 *
 * The Published record is the only honest account of what was made: it comes
 * from Postiz, which is the thing that pressed publish. This reads it, works
 * out which posts were the same topic said on different platforms, and writes
 * one topic per group with the cells already ticked.
 *
 * Grouping is the whole difficulty. The same topic goes out with different
 * copy on each platform — the X version is rewritten to fit, the TikTok
 * caption is a hashtag line, and the reel opens on the comment keyword rather
 * than on the subject. So posts are matched on the words they share rather
 * than on the caption, within three days of each other, after the "Comment
 * WORD and I'll send it" opener is cut off the front.
 *
 * It is not perfect and it is not trying to be: two pieces of one topic
 * written completely differently stay apart, and the answer to that is to
 * merge them by hand on the page, which takes a second. Nothing here deletes
 * or edits an existing topic — a title already on the page is skipped — so
 * running it again after a hand merge does not undo the merge.
 *
 * What is left out by default, and why:
 *
 * - The day-numbered livestreams. "Day 24 - Vibecoding my product to $1M" is
 *   a series, not a topic anybody is going to cut a carousel from.
 * - Topics with exactly one published piece and nothing ticked. Most of those
 *   are long videos that are already rows on Long Videos, and a topic row per
 *   old upload would bury the ones being worked on. --all includes them, for
 *   when the backlog itself is what you want to look at.
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
const WRITE = process.argv.includes("--write");
const ALL = process.argv.includes("--all");
const H = { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" };

async function j(path, init) {
  const r = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init?.headers || {}) } });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

/* What a published row actually is, read off its own address. The record
   stores "video" or "text", which does not separate a reel from a long
   upload, nor a carousel from a plain post. The URL does. */
function shapeOf(p) {
  const u = String(p.url || "");
  if (/\/reel\//.test(u)) return "reel";
  if (/instagram\.com\/p\//.test(u)) return "carousel";
  if (/youtube\.com\/watch|youtu\.be/.test(u)) return "youtube";
  if (/tiktok\.com/.test(u)) return "tiktok";
  if (/twitter\.com|x\.com/.test(u)) return "x";
  return "facebook";
}
const LABEL = { reel: "Reel", carousel: "Carousel", youtube: "YouTube", tiktok: "TikTok", x: "X", facebook: "Facebook" };

const STOP = new Set(("a an the and or but if is are was were be been to of in on for with you your my me i it its that " +
  "this these those just now get got can could will would not no nor so at as by from about into out up down over " +
  "under then than them they we our us he she his her").split(" "));
const words = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9$ ]+/g, " ").split(/\s+/)
  .filter((w) => w && w.length > 2 && !STOP.has(w));
/* "Comment CREDITS and I'll send you the full breakdown." is the mechanic,
   not the subject, and it is the first line of every reel caption. */
const stripCta = (s) => String(s || "")
  .replace(/^comment\s+["'“‘]?[^"'”’\n]{1,24}["'”’]?\s*(and\s+)?(i['’]?ll|i will)?[^.\n]*[.\n]?\s*/i, "")
  .trim();
const isSeries = (p) => /^day\s*\d+\b/i.test(String(p.title || "").trim());
/* Containment rather than Jaccard: the X version of a topic is a third the
   length of the Facebook one, and union-based similarity buries that. */
const overlap = (a, b) => {
  const A = new Set(a), B = new Set(b);
  let hit = 0;
  for (const w of A) if (B.has(w)) hit++;
  return hit / Math.max(1, Math.min(A.size, B.size));
};
const dayOf = (s) => Math.floor(new Date(s).getTime() / 86400000);

const board = await j("content_automation_board?id=eq.default&select=rev,state");
if (!board || !board[0]) { console.error("no board document"); process.exit(1); }
const rev = board[0].rev;
const state = board[0].state || {};
const pub = Array.isArray(state.published) ? state.published : [];
const ideas = Array.isArray(state.ideas) ? state.ideas : [];
if (!pub.length) { console.error("nothing in the published record yet — run sync-published first"); process.exit(1); }

let clusters = pub.filter((p) => !isSeries(p)).map((p) => ({
  rows: [{ ...p, shape: shapeOf(p) }],
  w: words(stripCta(p.title)).slice(0, 12),
  d: dayOf(p.at),
}));
let merging = true;
while (merging) {
  merging = false;
  outer:
  for (let i = 0; i < clusters.length; i++) {
    for (let k = i + 1; k < clusters.length; k++) {
      const near = Math.abs(clusters[i].d - clusters[k].d) <= 3;
      const sim = overlap(clusters[i].w, clusters[k].w);
      if ((near && sim >= 0.45) || sim >= 0.8) {
        clusters[i].rows.push(...clusters[k].rows);
        clusters[i].w = words(stripCta(clusters[i].rows[0].title)).slice(0, 12);
        clusters[i].d = Math.min(clusters[i].d, clusters[k].d);
        clusters.splice(k, 1);
        merging = true;
        break outer;
      }
    }
  }
}

/* A caption the record truncated at the CTA carries no subject at all —
   "Comment VIDEO and I'll send you the exact prompt." says nothing about what
   the video was. Those rows cannot name a topic, so they are attached to a
   cluster from the same day if there is one, and dropped if there is not.
   Titling a topic with its own call to action is worse than not having it. */
const subject = (t) => stripCta(t).replace(/\s*#\w+/g, "").trim();
const ctaOnly = (c) => !c.rows.some((r) => subject(String(r.title || "")).length > 12);
{
  const orphans = clusters.filter(ctaOnly);
  for (const o of orphans) {
    const host = clusters.find((c) => c !== o && !ctaOnly(c) && Math.abs(c.d - o.d) <= 1);
    if (host) host.rows.push(...o.rows);
    clusters = clusters.filter((c) => c !== o);
    if (!host) console.log(`  - no subject, dropped: ${String(o.rows[0].title || "").slice(0, 52)}`);
  }
}

const topics = clusters.map((c) => {
  c.rows.sort((x, y) => String(x.at).localeCompare(String(y.at)));
  const shapes = new Set(c.rows.map((r) => r.shape));
  /* The YouTube title is a title; a caption is the first line of a post. The
     best name for the group is the longest one that still says something
     after the call to action is cut off the front. */
  const yt = c.rows.find((r) => r.shape === "youtube" && subject(String(r.title || "")).length > 12);
  const best = yt || c.rows.slice().sort((a, b) =>
    subject(String(b.title || "")).length - subject(String(a.title || "")).length)[0];
  const raw = String(best.title || "").replace(/\s+/g, " ").trim();
  const title = (subject(raw) || raw).slice(0, 110);
  return {
    title,
    at: c.rows[0].at,
    rows: c.rows,
    made: {
      short: shapes.has("reel") || shapes.has("tiktok") ? "done" : "",
      carousel: shapes.has("carousel") ? "done" : "",
      tweet: shapes.has("x") ? "done" : "",
      article: "",
    },
  };
}).filter((t) => t.title);

const worth = (t) => t.rows.length > 1 || t.made.short || t.made.carousel || t.made.tweet;
const chosen = (ALL ? topics : topics.filter(worth))
  .sort((a, b) => String(b.at).localeCompare(String(a.at)));

const have = new Set(ideas.filter((x) => String(x?.section || "") === "topic")
  .map((x) => String(x?.title || "").trim().toLowerCase()));

let n = 0;
const added = [];
for (const t of chosen) {
  if (have.has(t.title.trim().toLowerCase())) { console.log(`  = already a topic: ${t.title.slice(0, 60)}`); continue; }
  const made = Object.keys(t.made).filter((k) => t.made[k]).length;
  const note = "Already published. " + t.rows.map((r) =>
    `${LABEL[r.shape] || r.shape} ${String(r.at).slice(0, 10)}${r.url ? " " + r.url : ""}`).join(" · ");
  added.push({
    id: "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) + (n++),
    section: "topic", platform: "",
    title: t.title, owner: "", status: "new",
    note,
    source: t.rows[0].account || "",
    sourceUrl: t.rows[0].url || "",
    made: t.made,
    /* The date it went out, not the date this script ran: the Added column is
       then a publishing history rather than a record of one afternoon. */
    addedAt: t.at,
  });
  console.log(`  + ${String(t.at).slice(0, 10)}  ${made}/4  ${t.title.slice(0, 62)}`);
}

console.log(`\n${pub.length} published rows -> ${topics.length} topics, ${chosen.length} worth adding${ALL ? " (--all)" : ""}.`);
console.log(`${added.length} new, ${chosen.length - added.length} already on the page.`);
if (!added.length) { console.log("Nothing to do."); process.exit(0); }
if (!WRITE) { console.log("\nDry run. Nothing written. Add --write."); process.exit(0); }

const now = new Date().toISOString();
state.ideas = ideas.concat(added);
state.rev = rev + 1;
state.savedBy = "topics backfill";
state.savedAt = now;
const res = await fetch(`${U}/rest/v1/content_automation_board?id=eq.default&rev=eq.${rev}`, {
  method: "PATCH",
  headers: { ...H, prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state, saved_by: "topics backfill", saved_at: now }),
});
if (!res.ok) { console.error(`write failed: ${res.status} ${await res.text()}`); process.exit(1); }
const back = await res.json();
if (!back.length) { console.error("somebody saved the board while this ran — run it again"); process.exit(1); }
console.log(`\nDone. ${added.length} topics added; board now at rev ${back[0].rev}.`);
