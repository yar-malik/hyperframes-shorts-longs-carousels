/**
 * Adds reference videos to the board as topics, and estimates the length of
 * anything already on it that has a transcript but no length.
 *
 *   node scripts/add-topics.mjs             # show what it would do
 *   node scripts/add-topics.mjs --write     # do it
 *
 * The length estimate is words ÷ 150. That is a talking pace, not a
 * measurement, so every row it fills in is marked as an estimate — a guessed
 * number that looks like a read one is worse than an empty field, and this
 * number now moves what a video pays.
 *
 * Idempotent: a video already on the board by YouTube id is left alone, and a
 * length already recorded is never overwritten.
 */
import { readFileSync } from "node:fs";

for (const file of [".env.local", ".env.production.local"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
const U = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
const write = process.argv.includes("--write");
if (!U || !K) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "content-type": "application/json" };
import { readBoard, putVideos, lastOrd } from "./lib/board.mjs";

/* Words a minute. Tutorial narration sits around here; the exact figure
   matters less than everybody using the same one. */
const WPM = 150;

const TOPICS = [
  ["w3Lb7N3MxIg", "How to use Claude Code For Free in 2026"],
  ["slePq-H-TMA", "Fable 5.1 Watermarks EVERYTHING, Here's How To Remove It"],
  ["-E2emAQOX1E", "Claude Fable 5.1 + Claude Design = INSANE Instagram Carousels!"],
  ["Qb7A0a9xFzY", "This NEW Google AI Image Tool is WILD!"],
  ["rBPw8XDuXs0", "NEW Hermes Agent Update Changes Everything!"],
  ["DdV0f8eu6XI", "5 Skills That Make ChatGPT & Claude Better at Everything"],
  ["yUYrhSvuXWE", "MCP vs SDK Explained: When to Use Each (for beginners)"],
];

const ytId = (u) => {
  const m = String(u || "").match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : "";
};

/* Videos are one row each now — read them all (this needs to know which
   references are already on the board), change the ones it touches, and write
   only those back. */
const board = await readBoard();
const cur = board.state;
const rev = board.rev;
const before = new Map(board.videos.map((v) => [v.id, JSON.stringify(v)]));
const videos = board.videos.map((v) => ({ ...v }));

/* ---------------- estimate the missing lengths ---------------- */
let estimated = 0;
const estRows = [];
for (const v of videos) {
  if (Number(v.mins) > 0) continue;
  const t = String(v.transcript || "").trim();
  if (!t) continue;
  const words = t.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / WPM));
  v.mins = mins;
  v.minsEstimated = true;
  estimated++;
  estRows.push(`${String(v.id).padEnd(5)} ${String(words).padStart(5)} words -> ${String(mins).padStart(3)} min   ${String(v.title || "").slice(0, 44)}`);
}

/* ---------------- add the topics ---------------- */
const have = new Set(videos.map((v) => ytId(v.ref)).filter(Boolean));
const nextNo = () => {
  let n = 0;
  for (const v of videos) {
    const m = String(v.id || "").match(/^v(\d+)$/);
    if (m) n = Math.max(n, Number(m[1]));
  }
  return n + 1;
};
let added = 0;
for (const [id, title] of TOPICS) {
  if (have.has(id)) { console.log(`  already on the board: ${title.slice(0, 50)}`); continue; }
  const no = nextNo();
  videos.push({
    id: "v" + String(no).padStart(2, "0"),
    ref: `https://www.youtube.com/watch?v=${id}`,
    title,
    date: "",
    owner: "",
    status: "To be Started",
    rec: "", site: "", transcript: "", refTranscript: "",
    description: "", thumb: "", notes: [],
    addedAt: new Date().toISOString(),
  });
  have.add(id);
  added++;
}

console.log(`board rev ${rev}`);
console.log(`\nlengths estimated from the transcript (${WPM} words a minute): ${estimated}`);
for (const r of estRows) console.log("   " + r);
console.log(`\ntopics added: ${added}`);
for (const v of videos.slice(-added || videos.length)) {
  if (added && v.status === "To be Started" && !v.owner) console.log(`   ${v.id}  ${String(v.title).slice(0, 58)}`);
}
const noLen = videos.filter((v) => !(Number(v.mins) > 0)).length;
console.log(`\nstill with no length: ${noLen} (no transcript to estimate from)`);
console.log(`videos on the board: ${before.size} -> ${videos.length}`);

if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

/* Only what actually changed. A run that adds three videos and fills in two
   lengths writes five rows, not the whole board. */
let end = await lastOrd();
const changed = videos.filter((v) => before.get(v.id) !== JSON.stringify(v));
for (const v of changed) if (!before.has(v.id)) v.__ord = ++end;
await putVideos(changed, { by: "topics" });
console.log(`\nwritten. ${changed.length} row(s) changed; the rest of the board was not touched.`);
process.exit(0);
