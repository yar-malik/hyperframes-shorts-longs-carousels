/**
 * Loads the three exported sheets in skool-team/ onto the board.
 *
 *   node scripts/import-skool-sheets.mjs             # show what it would do
 *   node scripts/import-skool-sheets.mjs --write     # do it
 *
 * The sheets are the record of work already done — Rehman's timesheet back to
 * 5 July, and the CCM statistics back to 12 June. Seeding the standards without
 * these left the board technically working and completely empty, which is the
 * same as broken to anyone who opens it.
 *
 * Idempotent. Row ids are derived from the owner, the date and the row's
 * position within that day, so a second run overwrites rather than duplicates.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

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

const DIR = "skool-team";

/* ---------------- csv ---------------- */

/** Quoted fields carry commas and newlines — the task column has both — so the
    split has to be a scan, not a `split(",")`. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  const s = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function records(text) {
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim()));
  const head = rows.shift().map((h) => h.replace(/\s+/g, " ").trim());
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

/* ---------------- the columns, as they were typed ---------------- */

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/** "Sunday, 5 July " -> "2026-07-05". The sheets carry no year; 2026 is the
    only one where every weekday named in all three files is correct. */
function isoDate(raw) {
  const m = String(raw).match(/(\d{1,2})\s+([A-Za-z]+)/);
  if (!m) return "";
  const mo = MONTHS[m[2].toLowerCase()];
  if (!mo) return "";
  return `2026-${String(mo).padStart(2, "0")}-${String(Number(m[1])).padStart(2, "0")}`;
}

/** "1h 56mins", "40mins", "10 mins", "01:00:00" -> minutes. */
function toMins(raw) {
  const s = String(raw).trim().toLowerCase();
  if (!s) return 0;
  const clock = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  let total = 0;
  const h = s.match(/(\d+)\s*h/); if (h) total += Number(h[1]) * 60;
  const mi = s.match(/(\d+)\s*m/); if (mi) total += Number(mi[1]);
  if (!total) { const bare = s.match(/^(\d+)$/); if (bare) total = Number(bare[1]); }
  return total;
}

/* The sheet's words for where a row stands, in the board's three. "Review"
   means handed in and waiting — that is the board's "done". "Approved" is the
   point Yar accepted it, which is what makes it payable. */
const STATUS = { approved: "reviewed", review: "done", "not approved": "redo" };

const num = (v) => { const n = Number(String(v).replace(/[,%\s]/g, "")); return v === "" || !isFinite(n) ? "" : n; };

/* ---------------- read the board ---------------- */

const got = await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool&select=rev,state`, { headers: H })).json();
const cur = got[0]?.state || {};
const rev = got[0]?.rev ?? 0;
const standards = cur.standards || [];

/** The log row names the job in free text; the standards name it too, in
    slightly different words. Match on the distinctive part so a row can carry
    a link to what good looks like. An unmatched row is fine — it just has no
    standard beside it. */
function standardFor(owner, task) {
  const t = task.toLowerCase();
  const mine = standards.filter((s) => String(s.owner).toLowerCase() === owner.toLowerCase());
  const keys = [
    [/skool.*(post|account|engagement|homework)/, /skool/],
    /* Asif writes "Linked Lead Gen", not LinkedIn. */
    [/linked/, /linkedin/],
    [/facebook/, /facebook/],
    [/instagram/, /instagram/],
    [/twitter|^x /, /twitter/],
    [/stat/, /statistic/],
    [/course/, /course/],
  ];
  for (const [rowRe, stdRe] of keys) {
    if (!rowRe.test(t)) continue;
    const hit = mine.find((s) => stdRe.test(String(s.task).toLowerCase()));
    if (hit) return hit.id;
  }
  return "";
}

/* ---------------- the timesheets ---------------- */

/* Any "<Name> Time Sheet …csv" in the folder. The two people export
   differently — Rehman's has Est. Hours and ten link columns, Asif's has
   Total Time and three — so the columns are looked up by what they mean
   rather than by an exact name, and a new export shape costs one entry in
   the lists below instead of a second copy of this loop. */
const TIME_COLS = ["Est. Hours", "Total Time", "Time", "Hours"];
const COMMENT_COLS = ["Yar comments", "Comment", "Comments"];
const INSPIRATION_COLS = ["Inpsiration from", "Inspiration from"];

const pick = (rec, names) => {
  for (const n of names) if (rec[n] != null && String(rec[n]).trim()) return String(rec[n]).trim();
  return "";
};

/* One cell can hold several links. Asif pastes a day's five Skool posts into
   Link 1 separated by commas, which is a perfectly reasonable thing to do to
   a spreadsheet and nonsense to a parser that assumes one URL per column. */
function urlsIn(cell) {
  return String(cell || "")
    .split(/[\s,;]+/)
    .map((u) => u.trim().replace(/[.,)]+$/, ""))
    .filter((u) => /^https?:\/\//i.test(u));
}

function timesheets() {
  return readdirSync(DIR)
    .filter((f) => /time\s*sheet/i.test(f) && f.toLowerCase().endsWith(".csv"))
    .map((f) => ({ file: f, owner: (f.split(/\s+/)[0] || "").trim() }))
    .filter((x) => x.owner);
}

const log = [];
const skipped = [];
for (const { file, owner } of timesheets()) {
  const recs = records(readFileSync(join(DIR, file), "utf8"));
  if (!recs.length) { skipped.push(`${file}: empty`); continue; }
  /* A sheet with no Date column is a list of standards, not a log. Asif's
     "Asif Tasks" export is exactly that, and its standards are already on the
     board from seed-skool.mjs. */
  if (!("Date" in recs[0])) { skipped.push(`${file}: standards sheet, no daily rows`); continue; }

  const linkCols = Object.keys(recs[0]).filter((k) => /^link\s*\d+/i.test(k));
  const perDay = {};
  let rows = 0;

  for (const r of recs) {
    const date = isoDate(r.Date);
    /* A few task cells were typed with their own quote marks inside the
       sheet's quoting, so they arrive wrapped in a stray " that is not part
       of the name of the job. */
    const task = String(r.Task || "").replace(/\s*\n\s*/g, " ").replace(/^"+|"+$/g, "").trim();
    if (!date || !task) continue;
    perDay[date] = (perDay[date] || 0) + 1;
    rows++;

    const links = [];
    for (const c of linkCols) for (const u of urlsIn(r[c])) if (links.indexOf(u) === -1) links.push(u);

    log.push({
      id: `l_${owner.toLowerCase()}_${date}_${perDay[date]}`,
      owner,
      date,
      task,
      standardId: standardFor(owner, task),
      mins: toMins(pick(r, TIME_COLS)),
      /* A blank status is work handed in and not yet looked at, which is what
         "done" means here. */
      status: STATUS[String(r.Status || "").trim().toLowerCase()] || "done",
      links: links.slice(0, 10),
      comment: pick(r, COMMENT_COLS),
      inspiration: pick(r, INSPIRATION_COLS),
    });
  }
  console.log(`  read ${file} -> ${owner}: ${rows} rows, ${linkCols.length} link columns`);
}

/* ---------------- the statistics sheet ---------------- */

const stats = [];
for (const f of readdirSync(DIR)) {
  const m = f.match(/^Skool Master - (\w+) Statistics\.csv$/i);
  if (!m) continue;
  const community = m[1].toLowerCase();
  for (const r of records(readFileSync(join(DIR, f), "utf8"))) {
    const date = isoDate(r.Date);
    if (!date) continue;
    const members = num(r[Object.keys(r).find((k) => /member count/i.test(k))]);
    const total = num(r[Object.keys(r).find((k) => /^total visitors/i.test(k))]);
    const skool = num(r[Object.keys(r).find((k) => /^skool visitors/i.test(k))]);
    const non = num(r[Object.keys(r).find((k) => /^non-skool/i.test(k))]);
    /* A row with a date and nothing else is the blank the sheet ends on. */
    if (members === "" && total === "" && skool === "" && non === "") continue;
    stats.push({
      id: `st_${community}_${date}`,
      community, date,
      members, visitors30: total, skoolVisitors30: skool, nonSkoolVisitors30: non,
      trendingOverall: String(r["Trending Overall"] || "").trim(),
      trendingTech: String(r["Trending Tech"] || "").trim(),
      rank: num(r["CCM Rank"] ?? r.Rank ?? ""),
      by: "sheet",
    });
  }
}

/* ---------------- merge ---------------- */

/* Imported rows win over an earlier import of the same row, and anything typed
   on the board that the sheets know nothing about is left where it is. */
const byId = new Map((cur.log || []).map((r) => [r.id, r]));
let replaced = 0;
for (const r of log) { if (byId.has(r.id)) replaced++; byId.set(r.id, { ...byId.get(r.id), ...r }); }
const statsById = new Map((cur.stats || []).map((s) => [s.id, s]));
for (const s of stats) statsById.set(s.id, { ...statsById.get(s.id), ...s });

const board = {
  ...cur,
  rev,
  savedBy: "import",
  savedAt: new Date().toISOString(),
  people: cur.people || [],
  standards,
  log: [...byId.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
  stats: [...statsById.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
};

const days = new Set(log.map((r) => r.date));
const owners = {};
for (const r of log) owners[r.owner] = (owners[r.owner] || 0) + 1;
const statusCount = {};
for (const r of log) statusCount[r.status] = (statusCount[r.status] || 0) + 1;

console.log(`board rev ${rev}`);
console.log(`log rows   ${log.length} parsed (${replaced} already there) -> ${board.log.length} on the board`);
console.log(`  by owner  ${Object.entries(owners).map(([k, v]) => `${k} ${v}`).join(", ")}`);
console.log(`  by status ${Object.entries(statusCount).map(([k, v]) => `${k} ${v}`).join(", ")}`);
console.log(`  days      ${days.size}, ${[...days].sort()[0]} .. ${[...days].sort().pop()}`);
console.log(`  linked    ${log.filter((r) => r.links.length).length} rows carry at least one link, ${log.reduce((n, r) => n + r.links.length, 0)} links total`);
console.log(`  standard  ${log.filter((r) => r.standardId).length} matched to a standard`);
console.log(`stat rows  ${stats.length} parsed -> ${board.stats.length} on the board`);
for (const s of skipped) console.log(`  note: ${s}`);

if (!write) {
  console.log("\nSample:");
  for (const r of board.log.slice(0, 3)) console.log(`  ${r.date} ${r.owner.padEnd(7)} ${String(r.mins).padStart(3)}m ${r.status.padEnd(8)} ${r.links.length} links  ${r.task.slice(0, 58)}`);
  for (const s of board.stats.slice(0, 2)) console.log(`  ${s.date} ${s.community} members ${s.members} visitors ${s.visitors30} rank ${s.rank}`);
  console.log("\nDry run. Add --write.");
  process.exit(0);
}

const put = await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool`, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state: { ...board, rev: rev + 1 }, saved_by: "import", saved_at: new Date().toISOString() }),
});
if (!put.ok || !(await put.json()).length) { console.error("write failed:", put.status); process.exit(1); }
console.log(`\nwritten. board is now rev ${rev + 1}.`);
