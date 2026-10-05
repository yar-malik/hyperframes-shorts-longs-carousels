/**
 * Puts the same topics on the Reel Board.
 *
 *   node scripts/seed-reels.mjs             # show what it would do
 *   node scripts/seed-reels.mjs --write     # do it
 *
 * A reel is a second run at a topic in a different shape, so the Reel Board
 * starts as the same list of topics: title and reference kept, everything
 * about the long video's own progress left behind. Unclaimed and unstarted,
 * because who records the reel is a separate decision from who recorded the
 * video.
 *
 * Idempotent — a topic already on the Reel Board is left alone, so this can
 * be re-run after new topics are added.
 */
import { readFileSync } from "node:fs";
for (const f of [".env.local", ".env.production.local"]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  } } catch {}
}
const U = process.env.SUPABASE_URL.replace(/\/+$/, "");
const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}`, "content-type": "application/json" };
import { readBoard, putVideos, lastOrd } from "./lib/board.mjs";
const write = process.argv.includes("--write");

/* One row per video now: this reads them all to see which reels already
   exist, and writes back only the ones it makes. */
const board = await readBoard();
const cur = board.state;
const rev = board.rev;
const videos = board.videos.map((v) => ({ ...v }));
const kindOf = (v) => (v.kind === "reel" ? "reel" : "long");
const longs = videos.filter((v) => kindOf(v) === "long");
const reels = videos.filter((v) => kindOf(v) === "reel");

/* Matched on the topic, not on the row, so re-running after somebody renames
   a reel does not make a second copy of it. */
const key = (v) => (String(v.ref || "").trim() || String(v.title || "").trim()).toLowerCase();
const have = new Set(reels.map(key));

let n = 0;
for (const v of videos) { const m = String(v.id || "").match(/^r(\d+)$/); if (m) n = Math.max(n, Number(m[1])); }

const made = [];
for (const v of longs) {
  if (have.has(key(v))) continue;
  n++;
  const row = {
    id: "r" + String(n).padStart(2, "0"),
    kind: "reel",
    ref: v.ref || "",
    title: v.title || "",
    date: "", owner: "", status: "To be Started",
    rec: "", site: "", transcript: "", refTranscript: "",
    description: "", thumb: "", summary: "", chapters: "", notes: [],
    addedAt: new Date().toISOString(),
  };
  videos.push(row);
  have.add(key(v));
  made.push(row);
}

console.log(`board rev ${rev}`);
console.log(`long videos ${longs.length} | reels before ${reels.length} | adding ${made.length}`);
for (const r of made.slice(0, 8)) console.log(`   ${r.id}  ${String(r.title).slice(0, 58)}`);
if (made.length > 8) console.log(`   … and ${made.length - 8} more`);
console.log(`rows on the board: ${videos.length - made.length} -> ${videos.length}`);

if (!made.length) { console.log("\nNothing to add."); process.exit(0); }
if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

let end = await lastOrd();
for (const r of made) r.__ord = ++end;
await putVideos(made, { by: "reels" });
console.log(`\nwritten. ${made.length} reel(s) added; nothing else was touched.`);
