/**
 * Does the hook rubric actually separate the hooks we shipped from the ones
 * we threw out?
 *
 *   node scripts/board/calibrate-hooks.mjs            # score the set, print the table
 *   node scripts/board/calibrate-hooks.mjs --runs=3   # three runs, to see the spread
 *
 * A threshold is only worth having if it fails the right things. 17 is the
 * number the rubric came with, from a creator scoring Instagram carousel
 * covers, and nothing said it was the right line for spoken hooks on this
 * channel. This is the test that says whether it is.
 *
 * The set is the best evidence there is, because it is a controlled pair. On
 * 12 September the six house hooks in the writer's prompt were rewritten:
 * same six ideas, same six videos, said two ways. The old ones are the batch
 * Yar rejected on sight — "not proper spoken English, they're just like stop,
 * stop" — and the new ones are what replaced them and were accepted. Only the
 * construction differs, so anything that separates them is measuring voice
 * rather than topic.
 *
 * They are scored through lib/hook-rubric.mjs, which is the same criteria and
 * the same prompt the live endpoint uses. Interleaved rejected/accepted and
 * labelled only by number, so the model cannot read the answer off the order.
 *
 * Nothing here touches the board. It spends DeepSeek credit and prints, and
 * writes every number to hook-calibration.json beside it.
 *
 * ---- What the run on 23 September found ----
 *
 * Two runs, twelve hooks, means of both.
 *
 *   rejected batch   mean 11.8   worst 9.0    best 17.0
 *   accepted batch   mean 15.8   worst 11.5   best 18.5
 *
 * At the inherited threshold of 17, three of the six hooks Yar accepted were
 * blocked and one of the six he rejected got through. That is not a gate, it
 * is a coin toss with an authority problem.
 *
 * The total turned out to be a blunt instrument on this set: four points
 * between the batches, ranges overlapping. Nearly all the separation sits in
 * one criterion.
 *
 *   Spoken English   0.50 -> 1.83   (+1.33, the widest by far)
 *   Spoken length    1.17 -> 1.83   (+0.67, but see the confound below)
 *   Topic first      1.25 -> 1.83   (+0.58)
 *   Who it is for    1.25 -> 1.75   (+0.50)
 *   the other six    within +/-0.35, carrying no weight either way
 *
 * So the board ships on Spoken English at full marks AND a total of 15, which
 * on this set leaks nothing and blocks two of the accepted six.
 *
 * Three caveats worth keeping with the numbers:
 *
 * - The set is twelve hooks. It is a controlled pair, which is why it is
 *   worth anything at all, but it is not a sample.
 * - It is confounded on length. The rejected batch averages 23 words and the
 *   accepted 47, and the rubric's Spoken length criterion wants 25 to 50 — so
 *   that criterion separates them almost by definition. Do not read it as
 *   evidence that longer hooks are better.
 * - "Rejected" is a batch-level label. Two of the six rejected lines are
 *   complete sentences and the model scored them accordingly. Both of the
 *   remaining leaks are those two, which means the criterion is right and the
 *   label is rough, rather than the other way round.
 *
 * Re-run it after any change to the prompt or the criteria in
 * lib/hook-rubric.mjs. A rubric nobody re-measures is a rubric that drifts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CRITERIA, RUBRIC_MAX, systemPrompt } from "../../lib/hook-rubric.mjs";

const root = resolve(import.meta.dirname, "../..");
for (const f of [".env", ".env.local", ".env.production.local"]) {
  try {
    for (const line of readFileSync(resolve(root, f), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
const KEY = process.env.DEEPSEEK_API_KEY;
if (!KEY) { console.error("DEEPSEEK_API_KEY is not set."); process.exit(1); }

const RUNS = Number((process.argv.find((a) => a.startsWith("--runs=")) || "").slice(7)) || 1;
const SHIPS = 17;
const REWRITE = 14;

/* The pairs. `bad` is what the generator produced before 12 Sep and what was
   rejected; `good` is the rewrite of the same idea that was accepted. Both
   sets are lifted verbatim out of the two versions of HOUSE_HOOKS in
   app/api/content-automation/hooks/route.ts (commit e1ae57d and its parent).

   Deliberately NOT included: "It reads the wrong files. Misses the one you
   meant. Charges you for both." It is quoted inside the scoring prompt itself
   as the worked example of a nought, so scoring it would only prove the model
   can read. */
const PAIRS = [
  {
    topic: "Claude's default design system",
    bad: "Purple gradient. Rounded cards. Grey text you can't read. That's every AI site ever made, and in six minutes it's dead.",
    good: "Every site Claude builds comes out looking the same, with the purple gradient and the rounded cards and the grey text nobody can read, and that's because it's working from the same system every time. In this video I'll show you how to replace that system so what comes out actually looks like yours.",
  },
  {
    topic: "Claude marking its own work",
    bad: "I made Claude mark its own homework. It failed itself twice, then fixed both. You'll have this running by the end of the video.",
    good: "I let Claude mark its own homework, and it failed itself twice before going back and fixing both problems without me saying anything. I'm going to show you exactly how that's wired up, so you'll have the same thing running by the end of this video.",
  },
  {
    topic: "Token cost",
    bad: "You're paying twenty times too much. Not twenty percent. Twenty times. My own bill's on screen and the fix takes a minute.",
    good: "You might be paying twenty times more for your Claude tokens than you need to and not even know it, because the thing that fixes it isn't a setting anybody tells you about. My own bill is on screen, and sorting it out takes about a minute.",
  },
  {
    topic: "An agent that bills you to think",
    bad: "Your agent charges you to think. Then charges you to check its thinking. This one runs on your laptop, offline, for nothing.",
    good: "Your agent charges you to think and then charges you again to check its own thinking, which is why the bill never quite makes sense at the end of the month. This one runs on your laptop instead, completely offline, and it doesn't cost you anything at all.",
  },
  {
    topic: "An agent that recovered on its own",
    bad: "It broke, fixed itself, and kept going. I never touched the keyboard. By the end of this you'll have the same thing running free.",
    good: "It broke about halfway through, fixed itself, and carried on without me touching the keyboard once. And in this video I'll walk you through how it's set up, so you can get the same thing running for free.",
  },
  {
    topic: "Two models in one folder",
    bad: "Two rival AIs. One folder. No supervision. Claude on the interface, Codex on the logic, patching each other. Eight minutes to a working app.",
    good: "I put two rival AIs in one folder with no supervision, Claude on the interface and Codex on the logic, and let them patch each other's work while I watched. Eight minutes later there was an app that ran, and I'll show you exactly how it was wired.",
  },
];

/* Interleaved, so neither set sits together in the list. */
const SET = [];
PAIRS.forEach((p, i) => {
  SET.push({ verdict: "rejected", topic: p.topic, text: p.bad, pair: i });
  SET.push({ verdict: "accepted", topic: p.topic, text: p.good, pair: i });
});

/* Two at a time, three calls in flight.
 *
 * Measured rather than guessed: scoring costs about 4,000 completion tokens
 * per hook here, because these are twelve unrelated topics and the model
 * reasons from scratch on every one. Twelve in one call truncated, six
 * truncated, four truncated; two spends 8,702 of a 16,000 ceiling and
 * finishes. The live endpoint is cheaper per hook — six hooks on one video
 * shared one context and spent 6,536 — which is why this ratio is a property
 * of the calibration set and not of production.
 *
 * Sequentially that is twelve calls at about 150 seconds each. Three at a
 * time brings it under ten minutes and stays well inside DeepSeek's rate. */
const BATCH = 2;
const POOL = 3;

async function scoreBatch(items, offset) {
  const user =
    `These are opening lines from ${items.length} different videos on the channel. Score every one.\n\n` +
    items.map((h, i) => `${i}. [topic: ${h.topic}]\n${h.text}`).join("\n\n");

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-v4-pro",
      max_tokens: 16000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const data = await res.json();
  const choice = data.choices?.[0];
  if (choice?.finish_reason === "length") throw new Error("ran out of tokens");
  const parsed = JSON.parse(String(choice?.message?.content || ""));
  const out = {};
  for (const row of parsed.scores || []) {
    const i = Number(row.i);
    if (!Number.isFinite(i) || i < 0 || i >= items.length) continue;
    const c = (Array.isArray(row.c) ? row.c : []).slice(0, CRITERIA.length)
      .map((n) => Math.max(0, Math.min(2, Math.round(Number(n) || 0))));
    while (c.length < CRITERIA.length) c.push(0);
    out[offset + i] = { c, total: c.reduce((a, b) => a + b, 0), weakest: String(row.weakest || "") };
  }
  return { out, usage: data.usage };
}

async function scoreOnce() {
  const out = new Array(SET.length).fill(null);
  let completion = 0;
  const starts = [];
  for (let s0 = 0; s0 < SET.length; s0 += BATCH) starts.push(s0);

  let next = 0;
  async function worker() {
    while (next < starts.length) {
      const start = starts[next++];
      const got = await scoreBatch(SET.slice(start, start + BATCH), start);
      Object.keys(got.out).forEach(function (k) { out[Number(k)] = got.out[k]; });
      completion += got.usage?.completion_tokens || 0;
      process.stdout.write(".");
    }
  }
  await Promise.all(Array.from({ length: POOL }, worker));
  return { out, usage: { completion_tokens: completion } };
}

const runs = [];
for (let r = 0; r < RUNS; r++) {
  process.stdout.write(`run ${r + 1}/${RUNS} … `);
  const t0 = Date.now();
  const { out, usage } = await scoreOnce();
  console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s, ${usage?.completion_tokens} out`);
  runs.push(out);
}

/* Every number, written down. Scoring this set costs about ten minutes and
   real credit, and the question you want to ask next — does gating on one
   criterion separate them better than the total? — should not need another
   run to answer. */
writeFileSync(resolve(root, "scripts/board/hook-calibration.json"), JSON.stringify({
  at: new Date().toISOString(), runs: RUNS, criteria: CRITERIA.map((c) => c.id),
  set: SET.map((h, i) => ({ verdict: h.verdict, topic: h.topic, text: h.text,
    runs: runs.map((r) => (r[i] ? { c: r[i].c, total: r[i].total, weakest: r[i].weakest } : null)) })),
}, null, 2));

/* One score per hook: the mean across runs, so a single generous run does not
   decide a threshold. */
const mean = (ns) => ns.reduce((a, b) => a + b, 0) / ns.length;
const scored = SET.map((h, i) => {
  const totals = runs.map((r) => (r[i] ? r[i].total : null)).filter((n) => n != null);
  const per = CRITERIA.map((c, ci) =>
    mean(runs.map((r) => (r[i] ? r[i].c[ci] : 0))));
  return { ...h, total: totals.length ? mean(totals) : null, spread: totals.length > 1 ? Math.max(...totals) - Math.min(...totals) : 0, per };
});

const fmt = (n) => (n == null ? " -- " : n.toFixed(RUNS > 1 ? 1 : 0).padStart(4));
console.log(`\n${RUNS > 1 ? "Mean of " + RUNS + " runs" : "One run"}. ${SHIPS}+ ships, under ${REWRITE} is binned.\n`);
console.log("  score  verdict   spread  topic");
for (const h of scored.slice().sort((a, b) => (b.total ?? 0) - (a.total ?? 0))) {
  const band = h.total >= SHIPS ? "ships " : h.total >= REWRITE ? "rewrite" : "bin   ";
  const flag = (h.verdict === "rejected" && h.total >= SHIPS) ? "  <-- REJECTED BUT PASSES"
             : (h.verdict === "accepted" && h.total < SHIPS) ? "  <-- ACCEPTED BUT FAILS" : "";
  console.log(`  ${fmt(h.total)}  ${band}  ${String(h.spread.toFixed(1)).padStart(4)}   ${h.verdict.padEnd(8)} ${h.topic}${flag}`);
}

const rej = scored.filter((h) => h.verdict === "rejected").map((h) => h.total);
const acc = scored.filter((h) => h.verdict === "accepted").map((h) => h.total);
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`\n  rejected batch: mean ${avg(rej).toFixed(1)}, worst ${Math.min(...rej).toFixed(1)}, best ${Math.max(...rej).toFixed(1)}`);
console.log(`  accepted batch: mean ${avg(acc).toFixed(1)}, worst ${Math.min(...acc).toFixed(1)}, best ${Math.max(...acc).toFixed(1)}`);
console.log(`  gap between the two means: ${(avg(acc) - avg(rej)).toFixed(1)} points`);

/* The number that decides whether this rubric is worth gating on: at the
   current threshold, how many of each batch land on the right side. */
const falsePass = scored.filter((h) => h.verdict === "rejected" && h.total >= SHIPS).length;
const falseFail = scored.filter((h) => h.verdict === "accepted" && h.total < SHIPS).length;
console.log(`\n  At ${SHIPS}: ${falsePass} of ${rej.length} rejected hooks would ship, ${falseFail} of ${acc.length} accepted hooks would be blocked.`);

/* And where the line would have to sit to separate them cleanly. */
let best = null;
for (let t = 0; t <= RUBRIC_MAX; t += 0.5) {
  const fp = scored.filter((h) => h.verdict === "rejected" && h.total >= t).length;
  const ff = scored.filter((h) => h.verdict === "accepted" && h.total < t).length;
  if (!best || fp + ff < best.wrong) best = { t, wrong: fp + ff, fp, ff };
}
console.log(`  Cleanest threshold on this set: ${best.t} (${best.wrong} wrong: ${best.fp} passing that should not, ${best.ff} blocked that should not be).`);

/* The total is one possible gate. A single criterion is another, and on a set
   where most criteria score the same for both batches the total is mostly
   noise with a little signal in it. Both are tried here rather than assumed. */
console.log("\n  Gating on one criterion instead of the total:");
CRITERIA.forEach((c, ci) => {
  [1, 2].forEach((floor) => {
    const fp = scored.filter((h) => h.verdict === "rejected" && h.per[ci] >= floor).length;
    const ff = scored.filter((h) => h.verdict === "accepted" && h.per[ci] < floor).length;
    if (fp + ff <= 2) {
      console.log(`    ${c.label} >= ${floor}: ${fp + ff} wrong (${fp} rejected passing, ${ff} accepted blocked)`);
    }
  });
});

/* Which criteria actually did the separating. A criterion that scores the
   same on both batches is carrying no weight in the decision. */
console.log("\n  Per criterion, mean rejected vs accepted:");
CRITERIA.forEach((c, ci) => {
  const r = avg(scored.filter((h) => h.verdict === "rejected").map((h) => h.per[ci]));
  const a = avg(scored.filter((h) => h.verdict === "accepted").map((h) => h.per[ci]));
  const bar = (a - r) >= 0.5 ? " <- separates" : (a - r) <= -0.5 ? " <- backwards" : "";
  console.log(`    ${c.label.padEnd(26)} ${r.toFixed(2)}  ->  ${a.toFixed(2)}   ${(a - r >= 0 ? "+" : "") + (a - r).toFixed(2)}${bar}`);
});
