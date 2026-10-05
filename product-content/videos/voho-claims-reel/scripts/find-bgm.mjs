// Search the HeyGen music library for a bed long enough to cover the cut, and
// download the best one. The engine's retrieve takes the top hit blindly, and
// for this query the top hits are 8–13s stings; we want ≥ 40s.
//
//   node scripts/find-bgm.mjs
import { searchSounds, heygenAuthHeaders, downloadTo } from "/Users/yar/.claude/skills/media-use/audio/scripts/lib/heygen.mjs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const headers = heygenAuthHeaders();
const queries = [
  "upbeat playful pop background music, bouncy, energetic, positive",
  "fun quirky upbeat background music for a vlog, light drums, happy",
  "energetic pop rock background music, bright, driving, youtube intro",
  "playful 8-bit chiptune game music, upbeat, loop",
];
const seen = new Map();
for (const q of queries) {
  const results = await searchSounds(q, "music", headers, { limit: 20 });
  for (const r of results) {
    const d = typeof r.duration === "number" ? r.duration : 0;
    if (!seen.has(r.audio_url)) seen.set(r.audio_url, { ...r, q });
  }
}
const long = [...seen.values()].filter((r) => (r.duration ?? 0) >= 40).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
console.log("candidates ≥40s:", long.length, "of", seen.size);
for (const r of long.slice(0, 8)) console.log(`${(r.duration ?? 0).toFixed(0)}s  score=${(r.score ?? 0).toFixed(2)}  ${r.title || r.name || r.id || ""}  [${r.q.slice(0, 30)}]`);
const pick = long[0];
if (!pick) throw new Error("no long track");
await downloadTo(pick.audio_url, resolve(root, "assets/bgm/track.mp3"));
console.log("downloaded:", pick.title || pick.name || pick.id, (pick.duration ?? 0).toFixed(0) + "s");
