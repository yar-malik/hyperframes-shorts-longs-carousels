/**
 * Marks everything logged before a cut-off as reviewed and paid.
 *
 *   node scripts/settle-log.mjs --before 2026-08-01            # show what it would do
 *   node scripts/settle-log.mjs --before 2026-08-01 --write    # do it
 *
 * Two fields, not one. Payments only lists rows that are *reviewed* — that is
 * the point work becomes payable — so a row marked paid while still sitting at
 * "done" would be settled and invisible, and would go on being counted in the
 * review backlog as though nobody had looked at it. Paying for work says it was
 * accepted, so both are set together.
 *
 * A row that came back to be redone is never settled: it is not finished, and
 * paying for it would say it was.
 *
 * Idempotent. A row already carrying paidAt is left exactly as it is, so this
 * can be re-run after a later month without touching what it settled before.
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

/* --approve marks work accepted without paying for it. Approving and paying
   are different acts: August's work is done and accepted, and not yet paid. */
const approveOnly = process.argv.includes("--approve");
const at = process.argv.indexOf("--before");
const CUTOFF = at === -1 ? "" : String(process.argv[at + 1] || "");
if (!/^\d{4}-\d{2}-\d{2}$/.test(CUTOFF)) {
  console.error("--before needs a date, e.g. --before 2026-08-01");
  process.exit(1);
}

const got = await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool&select=rev,state`, { headers: H })).json();
const cur = got[0]?.state;
const rev = got[0]?.rev ?? 0;
if (!cur) { console.error("no skool board yet"); process.exit(1); }

const rate = new Map((cur.people || []).map((p) => [String(p.name).trim().toLowerCase(), Number(p.rate) || 0]));
const now = new Date().toISOString();

const log = (cur.log || []).map((r) => ({ ...r }));
const touched = [];
const skippedRedo = [];
let alreadyPaid = 0;

for (const r of log) {
  if (!r.date || r.date >= CUTOFF) continue;
  if (approveOnly && r.status === "reviewed") { alreadyPaid++; continue; }
  if (!approveOnly && r.paidAt) { alreadyPaid++; continue; }
  if (r.status === "redo") { skippedRedo.push(r); continue; }

  const perHour = rate.get(String(r.owner || "").trim().toLowerCase()) || 0;
  /* The same arithmetic the Payments page does: an amount typed by hand wins
     over the hours, because somebody decided it. */
  const amount = r.payAmount !== "" && r.payAmount != null && isFinite(Number(r.payAmount))
    ? Number(r.payAmount)
    : Math.round(((Number(r.mins) || 0) / 60) * perHour);

  r.status = "reviewed";
  if (!approveOnly) {
    r.paidAmount = amount;
    r.paidAt = now;
  }
  touched.push(r);
}

const byOwner = {};
for (const r of touched) {
  const o = r.owner || "(nobody)";
  byOwner[o] = byOwner[o] || { rows: 0, mins: 0, pkr: 0 };
  byOwner[o].rows++;
  byOwner[o].mins += Number(r.mins) || 0;
  byOwner[o].pkr += Number(r.paidAmount) || 0;
}

const verb = approveOnly ? "approving" : "settling";
console.log(`board rev ${rev} | ${verb} everything dated before ${CUTOFF}`);
console.log(`  ${touched.length} rows to ${approveOnly ? "approve" : "settle"}` +
  (alreadyPaid ? `, ${alreadyPaid} already ${approveOnly ? "approved" : "paid"} and left alone` : ""));
for (const [o, b] of Object.entries(byOwner)) {
  console.log(`    ${o.padEnd(8)} ${String(b.rows).padStart(3)} rows  ${(b.mins / 60).toFixed(1).padStart(6)}h  ${b.pkr.toLocaleString().padStart(8)} PKR`);
}
if (skippedRedo.length) {
  console.log(`  ${skippedRedo.length} left alone because they came back to be redone:`);
  for (const r of skippedRedo) console.log(`    ${r.date} ${r.owner} — ${String(r.task).slice(0, 46)}`);
}
const after = log.filter((r) => !r.paidAt);
console.log(`  left unpaid afterwards: ${after.length} rows, ${(after.reduce((n, r) => n + (Number(r.mins) || 0), 0) / 60).toFixed(1)}h`);

if (!touched.length) { console.log("\nNothing to do."); process.exit(0); }
if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

const next = { ...cur, log, rev: rev + 1, savedBy: "settle", savedAt: now };
const put = await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool`, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state: next, saved_by: "settle", saved_at: now }),
});
if (!put.ok || !(await put.json()).length) { console.error("write failed:", put.status); process.exit(1); }
console.log(`\nwritten. board is now rev ${rev + 1}.`);
