/**
 * Gives every task a worked example — the post itself, not a description of
 * one — so the Tasks page can show what good looks like instead of explaining
 * it in six paragraphs.
 *
 *   node scripts/seed-task-samples.mjs             # show what it would do
 *   node scripts/seed-task-samples.mjs --write     # do it
 *
 * The examples follow Yar's rules out of the team chat: open on the obstacle,
 * give the value away in the hook, one idea, ask for a comment, never a link
 * in the post, nothing that reads as an advertisement.
 *
 * Idempotent, and never overwrites a sample somebody has edited unless
 * --force is passed.
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
const force = process.argv.includes("--force");
if (!U || !K) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "content-type": "application/json" };

/* Matched most-specific first, the same order the guidance seeder uses. */
const ORDER = [/statistic|stats/i, /course/i, /claymation/i, /song ad/i, /linked/i, /instagram/i, /twitter/i, /facebook/i, /skool/i];

const SAMPLES = {
  "/skool/i": {
    platform: "skool",
    note: "One obstacle, one question, answerable in a line. The comments are the point — a post with none is proof the room is empty.",
    author: "Yar Malik",
    title: "What is the part of AI video that still wastes your time?",
    body: "I can get a decent 8-second clip in about a minute now. Stitching six of them into something that does not look stitched still takes me the rest of the afternoon.\n\nCurious where everyone else loses the time. One line is fine.",
    comments: [
      { by: "Marcus", text: "Lip sync. Everything else is fast, that one thing eats an hour." },
      { by: "Priya", text: "Keeping the same character across shots. She changes face every generation." },
      { by: "Dan", text: "Honestly just picking. Too many tools, I try four and ship none." },
    ],
  },
  "/instagram/i": {
    platform: "instagram",
    note: "Slide one is the whole job. It gives the number away rather than teasing it, and it works with the sound off.",
    slides: [
      "I made 30 ad videos in a day for $0",
      "Tool 1 — the script. One prompt, nine variations, pick the one that opens on a problem.",
      "Tool 2 — the voice. Eleven Labs, one clone, 40 seconds of audio is enough.",
      "Tool 3 — the shots. Same seed every time or your character changes face.",
      "The mistake: generating before writing. Write first, generate once.",
      "Full walkthrough is free in the community — link in bio, /about page.",
    ],
  },
  "/twitter/i": {
    platform: "twitter",
    note: "States the result in the first line. No thread emoji, no throat-clearing, no hashtags.",
    author: "Yar Malik",
    handle: "@yarmalikhere",
    body: "You can clone your voice well enough to narrate a whole video with 40 seconds of audio.\n\nNot 10 minutes. 40 seconds.\n\nHere is the exact setup I use:",
  },
  "/facebook/i": {
    platform: "facebook",
    note: "Opens on the obstacle, names what the resource actually is, asks for a comment. No link anywhere in the post — that is what gets it held for a day or rejected.",
    author: "Yar Malik",
    body: "Most people who quit AI video quit at the same place: the clips look fine on their own and terrible in a row.\n\nI wrote down the 12 prompts that fixed it for me — the ones that keep a character's face and a scene's light the same from shot to shot.\n\nComment PROMPTS and I will send it over.",
  },
  "/linked/i": {
    platform: "linkedin",
    note: "First line stands alone, because that is all anyone sees before “see more”. Ends on a question a peer would actually answer.",
    author: "Yar Malik",
    role: "Building AI video tools",
    body: "Every AI video demo you have seen was one good clip out of forty.\n\nThe demo is not the hard part. The hard part is the fortieth clip looking like the first — same face, same light, same voice.\n\nMost of the tooling being sold right now solves generation. Almost none of it solves consistency.\n\nWhat are you using to keep a character stable across shots?",
  },
  "/song ad/i": {
    platform: "video",
    note: "The song is the hook. First two seconds are music and motion, not a logo.",
    author: "Camilo Castañeda",
    body: "20 seconds. One benefit, sung twice, in words you can make out through a phone speaker.\n\nShot 1 opens mid-chorus — no title card, no logo, nothing to scroll past.",
  },
  "/claymation/i": {
    platform: "video",
    note: "The clay look is the reason it stops the scroll. Fingerprints and a slight wobble are what sell it — clean and smooth reads as CGI.",
    author: "Camilo Castañeda",
    body: "Same song rules, in clay. One or two characters, never a crowd.\n\nVisible tool marks, practical lighting, a built set rather than a photographic background.",
  },
  "/statistic|stats/i": {
    platform: "stats",
    note: "The row for the day. Growth is worked out from the row below — never typed, or it drifts from the numbers beside it.",
    fields: [
      ["Members", "422"],
      ["Visitors 30d", "394"],
      ["From Skool", "153"],
      ["Not from Skool", "241"],
      ["Trending (tech)", "18th page, last row"],
      ["Rank", "921"],
    ],
  },
  "/course/i": {
    platform: "course",
    note: "Structure and words have to be ours — two strikes came from duplicating another creator. Thumbnail set before anything else.",
    author: "",
    title: "Module 3 — Keeping one face across forty shots",
    body: "What you will be able to do: generate a character once and keep them recognisable through a whole video.\n\nWhat breaks it: changing the seed, changing the prompt order, describing the face again in every shot.",
  },
};

const got = await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool&select=rev,state`, { headers: H })).json();
const cur = got[0]?.state;
const rev = got[0]?.rev ?? 0;
if (!cur) { console.error("no skool board yet"); process.exit(1); }

const standards = (cur.standards || []).map((s) => ({ ...s }));
let filled = 0, kept = 0;
const missed = [];

for (const s of standards) {
  const re = ORDER.find((r) => r.test(s.task));
  const sample = re && SAMPLES[re.toString()];
  if (!sample) { missed.push(`${s.owner}: ${String(s.task).slice(0, 44)}`); continue; }
  if (s.sample && !force) { kept++; continue; }
  s.sample = sample;
  filled++;
}

console.log(`board rev ${rev} | standards ${standards.length}`);
console.log(`  samples set ${filled}, left alone ${kept}`);
for (const m of missed) console.log(`  ! no sample matched — ${m}`);
for (const s of standards) {
  console.log(`  ${String(s.owner).padEnd(7)} ${String(s.label || "—").padEnd(15)} ${s.sample ? s.sample.platform : "none"}`);
}

if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

const next = { ...cur, standards, rev: rev + 1, savedBy: "samples", savedAt: new Date().toISOString() };
const put = await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool`, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state: next, saved_by: "samples", saved_at: new Date().toISOString() }),
});
if (!put.ok || !(await put.json()).length) { console.error("write failed:", put.status); process.exit(1); }
console.log(`\nwritten. board is now rev ${rev + 1}.`);
