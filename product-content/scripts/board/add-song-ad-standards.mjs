/**
 * Two more standards for Rehman, and the tool subscriptions on the cost side.
 *
 *   node scripts/add-song-ad-standards.mjs             # show what it would do
 *   node scripts/add-song-ad-standards.mjs --write     # do it
 *
 * The two examples are Camilo Castañeda's — @adswithcami, the account Yar told
 * Rehman to study back in August ("take a lot of inspiration from camilo, how
 * he posts and stuff"). Both are song-ad videos: one straight, one claymation.
 * They are the standard, not the instruction — the point is to open them.
 *
 * Idempotent: a standard with the same example link is left alone, and a cost
 * with the same label is not added twice.
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

const SONG_AD = `A short video ad carried by a song rather than a voiceover. The music is the hook; the product is what the song happens to be about.

Why this one: it is the format Camilo is winning with, and it travels — the same clip works on Instagram, TikTok, Facebook and X without being recut for each.

What a good one looks like:
• The first two seconds are the song, not a logo and not a title card. If the sound is off it should still be worth watching.
• One idea per ad. A song about one benefit beats a jingle listing five.
• Short. Fifteen to thirty seconds; the loop matters more than the length.
• The words have to be intelligible. A clever lyric nobody can make out is a wasted ad.
• Watch the example before you start and copy its structure, not its content.

Do not put our link in the video. It goes in the caption and on the /about page, the same as everything else.`;

const NEW = [
  {
    match: /song ad/i,
    std: {
      label: "Song ads",
      task: "Make one AI song ad video and post it. Take the format from Camilo — the music carries the ad.",
      priority: 6,
      cadence: "Daily",
      estMins: 45,
      link: "https://x.com/adswithcami/status/2091168247814951352",
      link2: "",
      note: 'Camilo, 22 Aug: "Who’s producing song ads like this??" — 149 likes on the format alone.',
      how: SONG_AD,
      prompts: [
        {
          title: "Lyrics for a song ad",
          body: `Write lyrics for a 20-second song ad about: [product or idea]

Rules:
- One benefit only, named plainly in the first line
- Simple, singable, no internal rhyme gymnastics — it has to be intelligible on one listen through a phone speaker
- A hook line that repeats twice and could be stuck in someone's head
- No brand name more than once
- No "revolutionary", "unleash", "transform"

Give me three completely different versions: one funny, one deadpan, one earnest. Then say which you would run and why, in one line.`,
        },
        {
          title: "Shot list for the video",
          body: `Here are the lyrics: [paste]

Give me a shot list, one line per shot, timed to the lyric it sits under. For each: what is on screen, and what the camera is doing.

Constraints: it must be makeable with AI video tools and stock footage, no actors, no dialogue. Bright, high contrast, no dark backgrounds. The first shot has to work with the sound off.`,
        },
      ],
    },
  },
  {
    match: /claymation/i,
    std: {
      label: "Claymation ads",
      task: "Make one claymation-style song ad. Same format as the song ads, in clay.",
      priority: 7,
      cadence: "Weekly",
      estMins: 60,
      link: "https://x.com/adswithcami/status/2094462248156614781",
      link2: "https://x.com/adswithcami/status/2091168247814951352",
      note: "Camilo, 31 Aug: “Claymation + Song Ads =”. The newer of the two formats.",
      how: `The song ad, in clay. Everything on the Song ads task holds — this is a look, not a different job.

Why it is worth its own slot: the clay look stops the scroll on its own, and it reads as made rather than generated, which is the whole complaint about our other output. Yar's standing note is that nothing should look AI-generated; claymation is the one style where the artificial look is the point.

What a good one looks like:
• Commit to the material. Fingerprints, seams and slightly wrong proportions are what sell it. Clean and smooth reads as CGI and loses the effect.
• Keep the cast to one or two characters. Clay crowds turn to mush at small sizes.
• Same song rules as the other task: audible words, one idea, a hook that repeats.
• It is weekly, not daily. One good one beats five rough ones.`,
      prompts: [
        {
          title: "Claymation prompt for an image or video model",
          body: `I am making a claymation-style song ad about: [idea]

Write the image/video prompt. It must specify: stop-motion claymation, visible fingerprints and tool marks in the clay, slight frame-to-frame wobble, practical studio lighting, shallow depth of field, matte surfaces, a simple built set rather than a photographic background.

Give me one prompt per shot for [n] shots, each self-contained so the look stays consistent when they are generated separately. Name the same colour palette in every one.`,
        },
      ],
    },
  },
];

const COSTS = [
  { label: "CapCut", usd: 11 },
  { label: "Claude Code", usd: 20 },
];

const got = await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool&select=rev,state`, { headers: H })).json();
const cur = got[0]?.state;
const rev = got[0]?.rev ?? 0;
if (!cur) { console.error("no skool board yet"); process.exit(1); }

const standards = (cur.standards || []).map((s) => ({ ...s }));
const always = standards.find((s) => (s.always || []).length)?.always || [];
let added = 0;

for (const { match, std } of NEW) {
  const there = standards.some((s) =>
    String(s.owner).toLowerCase() === "rehman" && (match.test(s.task || "") || s.link === std.link));
  if (there) { console.log(`  already there: ${std.label}`); continue; }
  standards.push({
    id: `s_rehman_${std.label.toLowerCase().replace(/\W+/g, "")}_${Math.random().toString(36).slice(2, 6)}`,
    owner: "Rehman",
    always,
    ...std,
  });
  added++;
}

const finance = cur.finance ? { ...cur.finance } : null;
let costsAdded = 0;
if (finance) {
  finance.costs = (finance.costs || []).slice();
  for (const c of COSTS) {
    if (finance.costs.some((x) => String(x.label).toLowerCase() === c.label.toLowerCase())) continue;
    finance.costs.push(c);
    costsAdded++;
  }
}

console.log(`board rev ${rev}`);
console.log(`  standards ${(cur.standards || []).length} -> ${standards.length} (+${added})`);
for (const s of standards.filter((x) => String(x.owner).toLowerCase() === "rehman")) {
  console.log(`    ${String(s.priority).padStart(2)} ${String(s.label || "—").padEnd(15)} ${s.cadence.padEnd(7)} ${s.estMins}m  ${s.link ? "has an example" : "NO EXAMPLE"}`);
}
if (finance) {
  console.log(`  costs (+${costsAdded}):`);
  for (const c of finance.costs) console.log(`    $${String(c.usd).padStart(3)}  ${c.label}`);
  console.log(`  fixed total $${finance.costs.reduce((n, c) => n + (Number(c.usd) || 0), 0)}/mo`);
} else {
  console.log("  ! no finance object on the board, so the costs were not added");
}

if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

const next = { ...cur, standards, finance, rev: rev + 1, savedBy: "seed", savedAt: new Date().toISOString() };
const put = await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool`, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state: next, saved_by: "seed", saved_at: new Date().toISOString() }),
});
if (!put.ok || !(await put.json()).length) { console.error("write failed:", put.status); process.exit(1); }
console.log(`\nwritten. board is now rev ${rev + 1}.`);
