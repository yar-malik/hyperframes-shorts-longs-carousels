/**
 * Puts the topics found in the vidIQ research onto the Topics page.
 *
 *   node scripts/board/seed-topics.mjs            # say what it would add
 *   node scripts/board/seed-topics.mjs --write    # add them
 *
 * A topic is an ordinary idea with section "topic", so this writes into the
 * board document's `ideas` list like anything else on that page. Rows are
 * matched on title before anything is added, so running it twice adds
 * nothing the second time.
 *
 * Where these came from: vidIQ outlier searches on 23 Sep 2026, filtered to
 * the two communities' niches — Claude Code for CCM, AI video for AVC — and
 * to shorts published in the fortnight to 23 Sep. The numbers on each row are
 * the ones the search returned: how far the video beat its own channel's
 * average, and what it had done by the time we looked.
 *
 * Five of them are already long videos on the board (rows 134-138, added by
 * scan-competitors the same day). Those are linked to their video rather than
 * duplicated: a topic that came out of a long video is exactly the case the
 * Topics page was built for.
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
const H = { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" };

async function j(path, init) {
  const r = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init?.headers || {}) } });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

/* The finds. `video` names the long video this came out of, by the board
   number scan-competitors gave it; everything else stands on its own. */
const TOPICS = [
  /* ---- CCM: Claude Code. The five that are already long videos ---- */
  { t: "Free unlimited Claude Code plus 600+ model swaps, one key", src: "Jordan Blake", no: 134,
    note: "vidIQ 23 Sep: 5.4× its channel's average, 22.6k views in the week to 22 Sep. The free/unlimited angle, which four of the five best CCM finds this fortnight were some version of." },
  { t: "Run a complete dev team in Claude without paying", src: "Build With Alan", no: 135,
    note: "vidIQ 23 Sep: 9.3× its channel's average, 18.3k views. A 4.3k-subscriber channel — the topic is not the moat, being early is." },
  { t: "Run Claude Code on any model with this open-source alternative", src: "Valeri Sabev", no: 136,
    note: "vidIQ 23 Sep: 6.3× its channel's average, 37.2k views off 2.4k subscribers." },
  { t: "Claude Fable 5 turns page scrolls into movie shots", src: "Vlad @Joinee", no: 137,
    note: "vidIQ 23 Sep: 7.6× its channel's average, 77.5k views. The one find that is as much AVC as CCM." },
  { t: "Claude Code plugins that cut token burn and speed up builds", src: "Andrey Synth", no: 138,
    note: "vidIQ 23 Sep: 5.0× its channel's average, 16.6k views off 2.7k subscribers." },

  /* ---- CCM: strong on the numbers, not made into long videos ---- */
  { t: "POV: what tech workers looked like before Claude", src: "Rho",
    note: "vidIQ 23 Sep: 127× its channel's average, 778k views off 30k subscribers — the biggest CCM breakout of the fortnight by a distance. A comedy POV rather than a tutorial, so it is a format to borrow, not a script." },
  { t: "The Claude Code commands nobody tells you about", src: "Marcus Chen",
    note: "vidIQ 23 Sep: 9.0× its channel's average, 52k views. TypeSafe scored it 43% fit, just under the line for a long video — it may still be a short." },
  { t: "What is actually inside Claude Code's system prompt", src: "TheVibeFounder",
    note: "vidIQ 23 Sep: 7.1× its channel's average, 32k views. 38% fit, under the long-video line." },
  { t: "Unity shipped 29 official Claude skills for game devs", src: "Sunny Valley Studio",
    note: "vidIQ 23 Sep: 6.4× its channel's average, 39k views. 40% fit — a named company shipping Claude skills is the interesting part, not Unity." },

  /* ---- AVC: AI video. None of these fit the coding channel, which is why
         they have nowhere else to live ---- */
  { t: "Turn a painting into a cinematic AI video with Seedance", src: "Tech Minds Ai",
    note: "vidIQ 23 Sep: 648× its channel's average, 234k views off 2.9k subscribers — the single biggest breakout in either niche this fortnight. One input image, one named tool, one cinematic output." },
  { t: "The Dreamina template: one object, one impossible process", src: "Dreamina (four channels)",
    note: "vidIQ 23 Sep: the same template run by four different channels — octopus car wash 234k, fruit processing 127k, skateboard 36k, driving robot 117k, all off channels under 15k. One template, repeatable weekly." },
  { t: "An AI short film made entirely with Sora", src: "TerracottaCandle",
    note: "vidIQ 23 Sep: 164× its channel's average, 49k views. A showcase rather than a tutorial." },
  { t: "Pixar artists meet Seedance 2.5", src: "Join AI Lab",
    note: "vidIQ 23 Sep: 58× its channel's average, 33k views. The comparison framing does the work." },
  { t: "The 80s photo prompt everybody is running right now", src: "Tech Wala Bhaiya",
    note: "vidIQ 23 Sep: 44× its channel's average, 349k views off 6.2k subscribers, and a second channel did 283k with the same idea. Photo rather than video, and the prompt is the product." },
  { t: "Trend-jacking a viral AI video style the day it lands", src: "Suraj Space",
    note: "vidIQ 23 Sep: 46× its channel's average, 65k views. The specific trend was regional; the move — make the tutorial for whatever AI video style is trending that week — is not." },
];

const now = new Date().toISOString();
const rows = await j("content_automation_videos?select=id,doc");
const byNo = {};
for (const r of rows || []) {
  const no = Number(r.doc?.no);
  if (Number.isFinite(no)) byNo[no] = r.id;
}

const board = await j(`content_automation_board?id=eq.default&select=rev,state`);
if (!board || !board[0]) { console.error("no board document"); process.exit(1); }
const rev = board[0].rev;
const state = board[0].state || {};
const ideas = Array.isArray(state.ideas) ? state.ideas : [];

const have = new Set(ideas.filter((x) => String(x?.section || "") === "topic")
  .map((x) => String(x?.title || "").trim().toLowerCase()));

let n = 0;
const added = [];
for (const t of TOPICS) {
  if (have.has(t.t.trim().toLowerCase())) { console.log(`  = already there: ${t.t}`); continue; }
  const row = {
    id: "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) + (n++),
    section: "topic",
    platform: "",
    title: t.t,
    owner: "",
    status: "new",
    note: t.note,
    source: t.src,
    sourceUrl: "",
    made: {},
    addedAt: now,
  };
  const vid = t.no ? byNo[t.no] : null;
  if (t.no && !vid) console.log(`  ! no video numbered ${t.no} on the board — adding "${t.t}" without the link`);
  if (vid) row.videoId = vid;
  added.push(row);
  console.log(`  + ${t.t}${vid ? `  (from video ${t.no})` : ""}`);
}

console.log(`\n${ideas.filter((x) => String(x?.section || "") === "topic").length} topics on the board, ${added.length} to add.`);
if (!added.length) { console.log("Nothing to do."); process.exit(0); }
if (!WRITE) { console.log("\nDry run. Nothing written. Add --write."); process.exit(0); }

state.ideas = ideas.concat(added);
/* The document carries its own rev and stamp as well as the row's, and the
   page reads those. Both move together or the board shows a stale header. */
state.rev = rev + 1;
state.savedBy = "topics seed";
state.savedAt = now;
const res = await fetch(`${U}/rest/v1/content_automation_board?id=eq.default&rev=eq.${rev}`, {
  method: "PATCH",
  headers: { ...H, prefer: "return=representation" },
  /* saved_by / saved_at, not updated_*: the videos table uses one pair of
     names and the board document the other, and the wrong pair comes back as
     a schema-cache 400 rather than as anything about the column. */
  body: JSON.stringify({ rev: rev + 1, state, saved_by: "topics seed", saved_at: now }),
});
if (!res.ok) { console.error(`write failed: ${res.status} ${await res.text()}`); process.exit(1); }
const back = await res.json();
if (!back.length) { console.error("somebody saved the board while this ran — run it again"); process.exit(1); }
console.log(`\nDone. ${added.length} topics added; board now at rev ${back[0].rev}.`);
