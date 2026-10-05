/**
 * The board is one page of work now — Videos — and the sections that used to
 * sit beside it are gone from the rail (19 Sep 2026). This removes what was
 * filed in them: Written Posts, Carousels and the Vault, every idea filed
 * under a platform other than YouTube, and the Shorts & Reels rows. A long
 * video is the topic; the short, the carousel and the post are made from it.
 *
 *   node scripts/board/drop-sections.mjs            # count, and snapshot
 *   node scripts/board/drop-sections.mjs --write    # delete, through the app
 *
 * Every run writes a snapshot of what it would remove to .board-backups/
 * before anything else, so a wrong afternoon is a restore, not a loss.
 * Deletes go through the app's own API as per-row ops, in batches, the way
 * recover-vault.mjs does — never a replaced array.
 */
import { createHmac } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

for (const f of [".env.production.local", ".env.local", ".env"]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  } } catch {}
}
const WRITE = process.argv.includes("--write");
const secret = process.env.CONTENT_AUTOMATION_SECRET || process.env.CA_SECRET || "";
if (!secret) { console.error("CONTENT_AUTOMATION_SECRET must be set."); process.exit(1); }
const body = { email: "board-scripts@yarmalik.com", name: "Yar", role: "admin", iat: Math.floor(Date.now() / 1000) };
const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
const cookie = `content_automation_session=${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
const endpoint = process.env.BOARD_ENDPOINT || "https://content.yarmalik.com/api/content-automation";

const r = await fetch(endpoint, { headers: { accept: "application/json", cookie } });
if (!r.ok) throw new Error(`Board read failed: ${r.status}`);
const board = await r.json();
const ideas = board.ideas || [], videos = board.videos || [];

/* What stays: ideas in the Ideas section filed for YouTube or for nowhere
   in particular (the tab's catch-all), and every long video. */
const dropIdeas = ideas.filter((x) => {
  const section = String(x.section || "ideas"), platform = String(x.platform || "");
  return section !== "ideas" || (platform && platform !== "youtube");
});
const dropVideos = videos.filter((v) => (v.kind || "long") === "reel");

const tally = {};
for (const x of dropIdeas) { const k = `${x.section || "ideas"}/${x.platform || "-"}`; tally[k] = (tally[k] || 0) + 1; }
console.log(`${ideas.length} ideas on the board, ${videos.length} videos · ${WRITE ? "WRITE" : "dry run"}\n`);
for (const [k, n] of Object.entries(tally).sort()) console.log(`  ${String(n).padStart(4)}  ideas in ${k}`);
console.log(`  ${String(dropVideos.length).padStart(4)}  reels`);
console.log(`\nWould remove ${dropIdeas.length} ideas and ${dropVideos.length} reels; ${ideas.length - dropIdeas.length} ideas and ${videos.length - dropVideos.length} long videos stay.`);

mkdirSync(".board-backups", { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = `.board-backups/${stamp}-sections.json`;
writeFileSync(file, JSON.stringify({ at: stamp, ideas: dropIdeas, videos: dropVideos }, null, 2));
console.log(`Snapshot: ${file}`);

if (!WRITE) { console.log("\nDry run — nothing removed. Add --write."); process.exit(0); }

const ops = [
  ...dropIdeas.map((x) => ({ t: "del", coll: "ideas", id: x.id })),
  ...dropVideos.map((v) => ({ t: "del", coll: "videos", id: v.id })),
];
/* Batches, because every delete rewrites the board document and a request
   of a thousand of them is one long lock on a board people are using. */
for (let i = 0; i < ops.length; i += 40) {
  const slice = ops.slice(i, i + 40);
  const w = await fetch(endpoint, { method: "PATCH", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ ops: slice }) });
  if (!w.ok) throw new Error(`Delete failed at ${i}: ${w.status} ${await w.text()}`);
  console.log(`  removed ${Math.min(i + 40, ops.length)}/${ops.length}`);
}
console.log("\nDone.");
