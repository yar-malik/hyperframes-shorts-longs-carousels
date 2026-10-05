/**
 * Sets how long each task is allocated, from what it has actually taken.
 *
 *   node scripts/set-task-allocations.mjs             # show the evidence
 *   node scripts/set-task-allocations.mjs --write     # set them
 *
 * A task's allocation is what it pays. Paying for whatever minutes somebody
 * typed made every month an argument and a spreadsheet; a job worth 35
 * minutes is worth 35 minutes whoever does it and however long it took them
 * on the day.
 *
 * The number is the median of what has been logged against that task, rounded
 * to five minutes — the median rather than the mean because one 179-minute
 * outlier should not set the price of a job that normally takes an hour.
 * Fewer than four rows is not evidence, so those keep the estimate that was
 * transcribed from the sheet, and the run says so.
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

/* Set by Yar, and they win over the evidence.
 *
 * The median is a description of what has been happening, not a decision
 * about what a job is worth. Where he has decided, that is the number — and
 * it has to live here rather than be typed onto the board, or the next run of
 * this script would quietly hand it back to the median. */
const OVERRIDES = [
  /* Most specific first. The statistics task says "send a screenshot into the
     Skool WhatsApp group", so a loose /skool/ above it would claim it — which
     it did, and handed statistics an hour. */
  { match: /statistic|stats/i, mins: 30, why: "half an hour, weekly" },
  { match: /skool/i, mins: 60, why: "an hour is the cap, both of them" },
];

const MIN_ROWS = 4;
const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);
const median = (a) => {
  const b = a.slice().sort((x, y) => x - y);
  const n = b.length;
  return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2;
};

const got = await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool&select=rev,state`, { headers: H })).json();
const cur = got[0]?.state;
const rev = got[0]?.rev ?? 0;
if (!cur) { console.error("no skool board yet"); process.exit(1); }

const standards = (cur.standards || []).map((s) => ({ ...s }));
const rate = new Map((cur.people || []).map((p) => [String(p.name).trim().toLowerCase(), Number(p.rate) || 0]));

/* Only rows that were logged against this standard, and only ones with a time
   on them — a zero is somebody who never filled it in, not a job that took no
   time, and averaging it in drags the allocation down. */
const samples = {};
for (const r of cur.log || []) {
  if (!r.standardId || !(Number(r.mins) > 0)) continue;
  (samples[r.standardId] = samples[r.standardId] || []).push(Number(r.mins));
}

console.log(`board rev ${rev}\n`);
console.log("owner   task             rows  median   was  ->  allocated   pays");
let changed = 0;
for (const s of standards) {
  const a = samples[s.id] || [];
  const perHour = rate.get(String(s.owner).trim().toLowerCase()) || 0;
  const was = Number(s.estMins) || 0;
  let alloc = was, why = "kept — not enough history";
  if (a.length >= MIN_ROWS) {
    alloc = round5(median(a));
    why = "from " + a.length + " rows";
  }
  const ov = OVERRIDES.find((o) => o.match.test(s.task));
  if (ov) {
    alloc = ov.mins;
    why = "set by Yar — " + ov.why;
  }
  if (alloc !== was) changed++;
  s.estMins = alloc;
  const pays = Math.round((alloc / 60) * perHour);
  console.log(
    String(s.owner).padEnd(7) +
    String(s.label || "?").padEnd(16) +
    String(a.length).padStart(4) +
    String(a.length ? Math.round(median(a)) : "–").padStart(8) +
    String(was).padStart(6) + "  ->" +
    String(alloc).padStart(10) + "m" +
    String(pays.toLocaleString() + " PKR").padStart(12) +
    "   " + why
  );
}

/* What a full day of the daily tasks is worth, which is the number that
   actually decides whether this is affordable. */
console.log("");
for (const p of cur.people || []) {
  const mine = standards.filter((s) => String(s.owner).toLowerCase() === String(p.name).toLowerCase());
  const daily = mine.filter((s) => s.cadence !== "Weekly");
  const weekly = mine.filter((s) => s.cadence === "Weekly");
  const perHour = Number(p.rate) || 0;
  const dMins = daily.reduce((n, s) => n + (Number(s.estMins) || 0), 0);
  const wMins = weekly.reduce((n, s) => n + (Number(s.estMins) || 0), 0);
  const perDay = Math.round((dMins / 60) * perHour);
  const perMonth = Math.round(perDay * 26 + (wMins / 60) * perHour * 4);
  console.log(
    `${String(p.name).padEnd(8)} ${daily.length} daily = ${(dMins / 60).toFixed(1)}h = ${perDay.toLocaleString()} PKR a day` +
    ` | ${weekly.length} weekly = ${wMins}m` +
    ` | about ${perMonth.toLocaleString()} PKR a month at 26 days`
  );
}

if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

const next = { ...cur, standards, rev: rev + 1, savedBy: "allocations", savedAt: new Date().toISOString() };
const put = await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool`, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state: next, saved_by: "allocations", saved_at: new Date().toISOString() }),
});
if (!put.ok || !(await put.json()).length) { console.error("write failed:", put.status); process.exit(1); }
console.log(`\nwritten. board is now rev ${rev + 1}. ${changed} allocations changed.`);
