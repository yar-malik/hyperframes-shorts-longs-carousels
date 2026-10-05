/**
 * Rehman's September timesheet, onto the board.
 *
 *   node scripts/import-rehman-september.mjs           # show what it would do
 *   node scripts/import-rehman-september.mjs --write   # do it
 *
 * Two things, both idempotent:
 *
 *   1. The task list Rehman works to. `taskTypes` has never been written, so
 *      the board is still showing TASK_SEED — which means the first write has
 *      to carry the two seeded reviewing tasks as well, or Asif loses the
 *      only tasks he logs against.
 *   2. His September hours, from the timesheet CSV. Every row is `hourly`:
 *      minutes at his own rate rather than a figure agreed on the day.
 *
 * `rate` is stamped 0 on purpose. Rehman has no rate on his person row, so
 * the board prices him from the original seed; stamping a number now would
 * freeze that guess into rows that are still unpaid. 0 means "not priced
 * yet", and the board follows his current rate until somebody marks a row
 * paid — which is exactly what these are, since the CSV has them all at
 * Review rather than Approved.
 *
 * The year is not in the CSV. Every weekday name in it matches September
 * 2026 and none match 2025, so 2026 it is.
 */
import { readFileSync } from "node:fs";

for (const f of [".env.local", ".env.production.local"]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  } } catch {}
}
const U = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !K) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "content-type": "application/json" };
const write = process.argv.includes("--write");

const WHO = "Rehman";

/* What Rehman is asked to do, going forward. The two seeded reviewing tasks
   ride along because writing this field at all retires the seed. */
const TASKS = [
  { id: "t_seed_videos", kind: "Reviewing videos", pay: "hourly" },
  { id: "t_seed_reels", kind: "Reviewing reels", pay: "hourly" },
  { id: "t_skool_posts", kind: "Skool: 10 posts from 10 accounts on AVC — 3+ likes and 3+ comments each, plus messaging in AVC", pay: "hourly" },
  { id: "t_instagram", kind: "Instagram: lead magnet and messaging — AVC tutorial slides only", pay: "hourly" },
  { id: "t_twitter", kind: "Twitter: daily tutorial", pay: "hourly" },
  { id: "t_facebook", kind: "Facebook groups: lead generation and messaging", pay: "hourly" },
  { id: "t_linkedin", kind: "LinkedIn: lead magnet — the same one posted on Instagram — and messaging those people", pay: "hourly" },
  { id: "t_stats", kind: "Fill out the statistics sheet, screenshot into the Skool WhatsApp group", pay: "hourly" },
];

/* September only, straight off the timesheet. `kind` is what the CSV called
   the work, because a logged row records what was actually done rather than
   what the task list happens to be called today; `taskId` points at whichever
   current task it belongs to. `links` is how many pieces of work the row
   carried — the URLs stay in the timesheet, which is where they are checked. */
const ROWS = [
  ["2026-09-01", "t_skool_posts", "Skool Create 10 posts with 10 Accounts on AVC (5 likes, 3 comments) + messaging", 60, 5],
  ["2026-09-02", "t_skool_posts", "Skool Create 10 posts with 10 Accounts on AVC (5 likes, 3 comments) + messaging", 100, 8],
  ["2026-09-03", "t_skool_posts", "Skool Create 10 posts with 10 Accounts on AVC (5 likes, 3 comments) + messaging", 120, 10],
  ["2026-09-03", "t_facebook", "Facebook Groups: Lead Generation & Messaging People", 30, 1],
  ["2026-09-03", "t_instagram", "Instagram Posts: Lead Magnet & Messaging People. Only AVC tutorial Slides", 30, 1],
  ["2026-09-03", "t_linkedin", "Linkedin Posts: Lead Generation & Messaging People", 30, 1],
  ["2026-09-04", "t_skool_posts", "Skool Create 10 posts with 10 Accounts on AVC (5 likes, 3 comments) + messaging", 20, 2],
  ["2026-09-05", "t_skool_posts", "Skool Create 10 posts with 10 Accounts on AVC (3 likes, 3 comments) + messaging", 120, 10],
  ["2026-09-05", "t_linkedin", "Linkedin Posts: Lead Generation & Messaging People", 30, 1],
  ["2026-09-05", "t_instagram", "Instagram Posts: Lead Magnet & Messaging People. Only AVC tutorial Slides", 30, 1],
  ["2026-09-06", "t_skool_posts", "Skool Create 10 posts with 10 Accounts on AVC (5 likes, 3 comments) + messaging", 60, 5],
  ["2026-09-06", "t_stats", "Uploading stats and finding AVC in trending/tech", 10, 1],
  ["2026-09-08", "t_instagram", "Instagram Posts: Lead Magnet & Messaging People. Only AVC tutorial Slides", 30, 1],
  ["2026-09-08", "t_linkedin", "Linkedin Posts: Lead Generation & Messaging People", 30, 1],
  ["2026-09-08", "t_facebook", "Facebook Groups: Lead Generation & Messaging People", 30, 1],
  ["2026-09-08", "t_skool_posts", "Skool Create 10 posts with 10 Accounts on AVC (3 likes, 3 comments) + messaging", 120, 10],
  ["2026-09-09", "t_facebook", "Facebook Groups: Lead Generation & Messaging People", 30, 1],
  ["2026-09-09", "t_linkedin", "Linkedin Posts: Lead Generation & Messaging People", 30, 1],
  ["2026-09-09", "t_instagram", "Instagram Posts: Lead Magnet & Messaging People. Only AVC tutorial Slides", 30, 1],
  ["2026-09-09", "t_skool_posts", "Skool: Create 10 posts with 10 Accounts on AVC (5 likes, 3 comments) + messaging", 60, 5],
];

const j = async (path, init) => {
  const r = await fetch(`${U}/rest/v1/${path}`, { headers: H, ...init });
  const t = await r.text();
  if (!r.ok) { console.error(`! ${r.status} on ${path}: ${t.slice(0, 300)}`); process.exit(1); }
  return t ? JSON.parse(t) : null;
};

const [board] = await j("content_automation_board?id=eq.default&select=rev,state");
const state = board.state;
const haveTasks = Array.isArray(state.taskTypes) ? state.taskTypes : null;
const logs = Array.isArray(state.timeLogs) ? state.timeLogs : [];

console.log(`board rev ${board.rev}`);
console.log(`taskTypes: ${haveTasks ? haveTasks.length + " stored" : "not stored yet (showing the seed)"}`);
console.log(`timeLogs:  ${logs.length} already on the board`);
console.log();

/* Tasks: add what is missing, leave what is there. Matched on id so renaming
   one by hand on the board does not make this re-add it. */
const taskIds = new Set((haveTasks ?? []).map((t) => t.id));
const addTasks = TASKS.filter((t) => !taskIds.has(t.id));
const nextTasks = [...(haveTasks ?? []), ...addTasks];
console.log(`tasks to add: ${addTasks.length}`);
for (const t of addTasks) console.log(`   + ${t.kind}`);

/* Hours: a row is the same row if it is the same person, day, task and
   length. Re-running after a partial write adds nothing twice. */
const seen = new Set(logs.map((t) =>
  [String(t.who).trim().toLowerCase(), t.date, t.taskId, t.mins].join("|")));
const addLogs = [];
for (const [date, taskId, kind, mins, links] of ROWS) {
  const key = [WHO.toLowerCase(), date, taskId, mins].join("|");
  if (seen.has(key)) continue;
  seen.add(key);
  addLogs.push({
    id: "t_reh_" + date.replace(/-/g, "") + "_" + taskId.replace(/^t_/, ""),
    who: WHO, date, mins,
    taskId, kind, pay: "hourly",
    rate: 0,
    amount: 0,
    note: links ? `${links} ${links === 1 ? "link" : "links"} on the timesheet` : "",
    paidAt: "",
  });
}

console.log();
console.log(`hours to add: ${addLogs.length} of ${ROWS.length} rows`);
const byDay = new Map();
for (const r of addLogs) byDay.set(r.date, (byDay.get(r.date) ?? 0) + r.mins);
for (const [d, m] of [...byDay].sort()) {
  console.log(`   ${d}  ${String(m).padStart(3)} min  (${(m / 60).toFixed(2)} h)`);
}
const total = addLogs.reduce((a, r) => a + r.mins, 0);
console.log(`   ${"".padEnd(10)} ${String(total).padStart(3)} min = ${Math.floor(total / 60)}h ${total % 60}m`);

if (!addTasks.length && !addLogs.length) { console.log("\nNothing to do."); process.exit(0); }
if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

const now = new Date().toISOString();
const next = { ...state, taskTypes: nextTasks, timeLogs: [...logs, ...addLogs], rev: board.rev + 1,
               savedBy: "timesheet", savedAt: now };
/* Only if nobody saved in between — the board is in use while this runs. */
const done = await j(`content_automation_board?id=eq.default&rev=eq.${board.rev}`, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ rev: board.rev + 1, state: next, saved_by: "timesheet", saved_at: now }),
});
if (!done?.length) {
  console.error(`! the board moved on from rev ${board.rev} while this ran — nothing written. Run it again.`);
  process.exit(1);
}
console.log(`\ndone — rev ${board.rev} -> ${board.rev + 1}`);
