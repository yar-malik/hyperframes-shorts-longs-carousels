/**
 * Puts one topic on the video board.
 *
 *   node scripts/add-one-topic.mjs             # show what it would do
 *   node scripts/add-one-topic.mjs --write     # do it
 *
 * Unclaimed and unstarted, the same as anything else waiting to be picked up.
 * Idempotent by reference URL, so running it twice adds nothing the second
 * time.
 */
import { readBoard, putVideos, lastOrd } from "./lib/board.mjs";
const write = process.argv.includes("--write");

const TOPIC = {
  title: "GPT-6 Astra Launch",
  ref: "https://x.com/OpenAI/status/2095595741528125780",
  /* Not a YouTube link, so there is no reference transcript to pull and no
     reference thumbnail. Said here rather than left as an empty box somebody
     has to work out. */
  notes: [{
    by: "Yar", at: new Date().toISOString(),
    text: "Source is the OpenAI announcement on X, not a YouTube video — so there is no reference transcript or thumbnail to compare against on this one. Watch the launch material yourself and write the script from it.",
  }],
};

/* A video is its own row now, so this adds one row rather than rewriting the
   board. The list is still read whole, because the two things it has to know
   — is this topic already here, and what is the next free id — are questions
   about all of them. */
const board = await readBoard();
const cur = board.state;
const rev = board.rev;
const videos = board.videos.map((v) => ({ ...v }));
if (videos.some((v) => String(v.ref || "") === TOPIC.ref)) {
  console.log("Already on the board. Nothing to do.");
  process.exit(0);
}
let n = 0;
for (const v of videos) { const m = String(v.id || "").match(/^v(\d+)$/); if (m) n = Math.max(n, Number(m[1])); }
const id = "v" + String(n + 1).padStart(2, "0");

const row = {
  id, ref: TOPIC.ref, title: TOPIC.title, date: "", owner: "", status: "To be Started",
  rec: "", site: "", transcript: "", refTranscript: "", description: "", thumb: "",
  summary: "", chapters: "", notes: TOPIC.notes, addedAt: new Date().toISOString(),
};
videos.push(row);

console.log(`board rev ${rev}`);
console.log(`adding ${id}  ${TOPIC.title}`);
console.log(`   ${TOPIC.ref}`);
console.log(`videos on the board: ${videos.length - 1} -> ${videos.length}`);
console.log(`unclaimed after this: ${videos.filter((v) => !String(v.owner || "").trim()).length}`);

if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }
await putVideos([{ ...row, __ord: (await lastOrd()) + 1 }], { by: "topic" });
console.log(`\nwritten. ${id} is on the board; nothing else was touched.`);
