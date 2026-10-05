/**
 * Turns each task's sentence into the numbers it actually asks for.
 *
 *   node scripts/seed-task-targets.mjs             # show what it would do
 *   node scripts/seed-task-targets.mjs --write     # do it
 *
 * "Skool: create 5 posts across 5 accounts on CCM. Do 15+ activities from
 * Yar's account. Each post needs at least 3 likes and 3 comments" is three
 * requirements hiding in a paragraph. As three boxes it is the job, at a
 * glance, before a word is read.
 *
 * Idempotent; --force to overwrite targets already on the board.
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

/* One line each. Short enough to read without stopping. */
const SHORT = {
  skoolAsif: "Five posts on CCM, from five different accounts, each one with people talking under it.",
  skoolRehman: "Ten posts on AVC, from ten different accounts, each one with people talking under it.",
  instagram: "One carousel. Slide one does the work.",
  twitter: "One thread that teaches one thing.",
  facebook: "One post in a live group, then message everyone who comments.",
  linkedin: "The same slides, posted here, then message everyone who reacts.",
  courses: "Write and build course material — ours, not anyone else's.",
  stats: "Fill in today's row and screenshot it.",
  song: "One song ad. The music is the hook.",
  clay: "One claymation song ad. The clay is why it stops the scroll.",
};

function pick(s) {
  const t = String(s.task).toLowerCase();
  const owner = String(s.owner).toLowerCase();
  if (/statistic|stats/.test(t)) return {
    short: SHORT.stats,
    targets: [
      { n: "1", unit: "row", sub: "today's numbers" },
      { n: "6", unit: "fields", sub: "members, visitors, trending, rank" },
      { n: "1", unit: "screenshot", sub: "as the proof" },
    ],
  };
  if (/course/.test(t)) return {
    short: SHORT.courses,
    targets: [
      { n: "0", unit: "copied structure", sub: "two strikes came from this" },
      { n: "1", unit: "thumbnail", sub: "set it first, not last" },
      { n: "3+", unit: "sources", sub: "never one creator" },
    ],
  };
  if (/claymation/.test(t)) return {
    short: SHORT.clay,
    targets: [
      { n: "1", unit: "video", sub: "once a week" },
      { n: "1–2", unit: "characters", sub: "clay crowds turn to mush" },
      { n: "20s", unit: "long", sub: "the loop matters more" },
    ],
  };
  if (/song ad/.test(t)) return {
    short: SHORT.song,
    targets: [
      { n: "1", unit: "video", sub: "every day" },
      { n: "2s", unit: "to hook", sub: "music first, no logo" },
      { n: "1", unit: "idea", sub: "one benefit, sung twice" },
    ],
  };
  if (/linked/.test(t)) return {
    short: SHORT.linkedin,
    targets: [
      { n: "1", unit: "post", sub: "the same slides as Instagram" },
      { n: "all", unit: "who react", sub: "message them, never cold lists" },
      { n: "1", unit: "question", sub: "to close on" },
    ],
  };
  if (/instagram/.test(t)) return {
    short: SHORT.instagram,
    targets: [
      { n: "1", unit: "carousel", sub: "every day" },
      { n: "6–8", unit: "slides", sub: "one idea each" },
      { n: "9", unit: "words max", sub: "on slide one" },
    ],
  };
  if (/twitter/.test(t)) return {
    short: SHORT.twitter,
    targets: [
      { n: "1", unit: "thread", sub: "every day" },
      { n: "6–9", unit: "tweets", sub: "one step each" },
      { n: "0", unit: "hashtags", sub: "they read as spam" },
    ],
  };
  if (/facebook/.test(t)) return {
    short: SHORT.facebook,
    targets: [
      { n: "1", unit: "post", sub: "in a group that is alive" },
      { n: "0", unit: "links in it", sub: "admins reject those" },
      { n: "all", unit: "who comment", sub: "message them the same day" },
    ],
  };
  if (/skool/.test(t)) {
    const ten = /10 posts|10 accounts/.test(t);
    return {
      short: ten ? SHORT.skoolRehman : SHORT.skoolAsif,
      targets: ten
        ? [
            { n: "10", unit: "posts", sub: "from 10 accounts, on AVC" },
            { n: "3+3", unit: "likes & comments", sub: "on every single one" },
            { n: "all", unit: "replies", sub: "answer them fast" },
          ]
        : [
            { n: "5", unit: "posts", sub: "from 5 accounts, on CCM" },
            { n: "15+", unit: "activities", sub: "from Yar's account" },
            { n: "3+3", unit: "likes & comments", sub: "on every single one" },
          ],
    };
  }
  return null;
}

const got = await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool&select=rev,state`, { headers: H })).json();
const cur = got[0]?.state;
const rev = got[0]?.rev ?? 0;
if (!cur) { console.error("no skool board yet"); process.exit(1); }

const standards = (cur.standards || []).map((s) => ({ ...s }));
let filled = 0, kept = 0;
for (const s of standards) {
  const got2 = pick(s);
  if (!got2) { console.log(`  ! no targets for ${s.owner}: ${String(s.task).slice(0, 40)}`); continue; }
  if (s.targets && !force) { kept++; continue; }
  s.short = got2.short;
  s.targets = got2.targets;
  filled++;
}

console.log(`board rev ${rev} | targets set ${filled}, left alone ${kept}`);
for (const s of standards) {
  console.log(`  ${String(s.owner).padEnd(7)} ${String(s.label || "—").padEnd(15)} ` +
    (s.targets || []).map((t) => `${t.n} ${t.unit}`).join(" · "));
}

if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

const next = { ...cur, standards, rev: rev + 1, savedBy: "targets", savedAt: new Date().toISOString() };
const put = await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool`, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state: next, saved_by: "targets", saved_at: new Date().toISOString() }),
});
if (!put.ok || !(await put.json()).length) { console.error("write failed:", put.status); process.exit(1); }
console.log(`\nwritten. board is now rev ${rev + 1}.`);
