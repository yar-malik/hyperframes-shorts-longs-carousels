/**
 * Renames every video's status to the Hooks Recording → Published pipeline,
 * where it is stored.
 *
 * The page already maps old names on the way in, but a per-row save only
 * writes the fields somebody changed — so a row nobody touches keeps its old
 * name in the database forever. This writes them once.
 *
 * What it touches, per video, and nothing else:
 *   status        old name → new name (table below)
 *   statusLog     the same rename on each entry's from/to, so history reads
 *                 in the words the board uses now
 *   approvedAt    stamped on rows that were past review under the old order
 *                 (Add Hooks and the names it had before), dated from their
 *                 own history — without it they drop out of pay and the
 *                 leaderboard, because they now sit at Editing / Hyperframe
 *
 * No row is added, removed or reordered; every other field is left as stored.
 * A copy of the board as read is written before anything else happens.
 *
 *   node scripts/board/migrate-video-statuses.mjs            # dry run: report only
 *   node scripts/board/migrate-video-statuses.mjs --apply    # write it
 *
 * Run it on voho-vm — the laptop cannot reach the database. Deploy the page
 * first: an open tab on the old page would draw the new names as stage 1.
 */
import { readFileSync, writeFileSync } from "node:fs";

for (const file of [".env.production.local", ".env.local"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed");
const apply = process.argv.includes("--apply");
const headers = { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" };
const TABLE = "content_automation_board";
const ROW_ID = "default";

/* Kept in step with LEGACY_STATUS in public/content-automation/app.js. */
const LEGACY_STATUS = {
  Submitted: "Published",
  Done: "Review",
  "Get Feedback": "Review",
  "To be Started": "Hooks Recording",
  "Pre Recording": "Hooks Recording",
  "Working on it": "Screen Recording",
  "Creating Recording": "Screen Recording",
  "Changes requested": "Changes Requested",
  "Ready to be Published": "Editing / Hyperframe",
  "Ready to be Filmed": "Editing / Hyperframe",
  Filming: "Editing / Hyperframe",
};
const LEGACY_APPROVED = new Set(["Ready to be Published", "Ready to be Filmed", "Filming"]);
const CURRENT = new Set([
  "Hooks Recording", "Screen Recording", "Editing / Hyperframe", "Review", "Changes Requested",
  "Ready to Publish", "Published", "Blocked", "Won't Do",
]);
const rename = (s) => (Object.hasOwn(LEGACY_STATUS, s) ? LEGACY_STATUS[s] : s);

const res = await fetch(`${url}/rest/v1/${TABLE}?id=eq.${ROW_ID}&select=rev,state`, { headers });
if (!res.ok) throw new Error(`read failed: ${res.status} ${await res.text()}`);
const [row] = await res.json();
/* This ran once, in September 2026, against the board when every video was
   inside the document. They have their own rows now, so there is nothing here
   for it to read — and rather than migrate nothing and report success, it
   says so. Rewrite it against scripts/board/lib/board.mjs if it is ever
   needed again. */
if (!row?.state?.videos?.length) {
  throw new Error("The videos are in content_automation_videos now — this script reads the old shape and would migrate nothing.");
}

const backup = `/tmp/content-board-before-status-migration-rev${row.rev}-${Date.now()}.json`;
writeFileSync(backup, JSON.stringify(row));
console.log(`rev ${row.rev}, ${row.state.videos.length} videos. Backup: ${backup}`);

const before = JSON.stringify(row.state);
const state = JSON.parse(before);
const tally = {};
let touched = 0, stamped = 0, logs = 0;

for (const v of state.videos) {
  let changed = false;
  const from = v.status;
  if (LEGACY_APPROVED.has(from) && !v.approvedAt) {
    const hit = (v.statusLog || []).filter((s) => s && LEGACY_APPROVED.has(s.to) && s.at).pop();
    v.approvedAt = hit?.at || v.claimedAt || v.addedAt || "2026-09-17T00:00:00.000Z";
    stamped++;
    changed = true;
  }
  const to = rename(from);
  const k = `${from} → ${to}`;
  tally[k] = (tally[k] || 0) + 1;
  if (to !== from) { v.status = to; changed = true; }
  for (const s of v.statusLog || []) {
    if (!s) continue;
    for (const f of ["from", "to"]) {
      if (s[f] && rename(s[f]) !== s[f]) { s[f] = rename(s[f]); logs++; changed = true; }
    }
  }
  if (changed) touched++;
}

console.table(tally);
console.log(`${touched} videos change, ${stamped} stamped approvedAt, ${logs} history names renamed.`);

/* Nothing may come out of this but renames: same rows, same order, same
   fields plus approvedAt, and every status one the page knows. */
const was = JSON.parse(before);
if (was.videos.length !== state.videos.length) throw new Error("row count changed");
state.videos.forEach((v, i) => {
  const o = was.videos[i];
  if (o.id !== v.id) throw new Error(`row ${i} moved`);
  const extra = Object.keys(v).filter((k) => !(k in o));
  if (extra.some((k) => k !== "approvedAt")) throw new Error(`${v.id} gained ${extra}`);
  if (Object.keys(o).some((k) => !(k in v))) throw new Error(`${v.id} lost a field`);
  for (const k of Object.keys(o)) {
    if (k === "status" || k === "statusLog") continue;
    if (JSON.stringify(o[k]) !== JSON.stringify(v[k])) throw new Error(`${v.id}.${k} changed`);
  }
  if ((o.statusLog || []).length !== (v.statusLog || []).length) throw new Error(`${v.id} history length changed`);
  if (!CURRENT.has(v.status)) throw new Error(`${v.id} has unknown status "${v.status}"`);
});
for (const k of Object.keys(was)) {
  if (k !== "videos" && JSON.stringify(was[k]) !== JSON.stringify(state[k])) throw new Error(`board.${k} changed`);
}
console.log("Checks passed: only status, statusLog names and approvedAt differ.");

if (!apply) {
  console.log("Dry run. Nothing written — pass --apply to write.");
  process.exit(0);
}
if (!touched) {
  console.log("Already migrated. Nothing to write.");
  process.exit(0);
}

const rev = row.rev + 1;
const put = await fetch(`${url}/rest/v1/${TABLE}?id=eq.${ROW_ID}&rev=eq.${row.rev}`, {
  method: "PATCH",
  headers: { ...headers, prefer: "return=representation" },
  body: JSON.stringify({
    rev,
    state: { ...state, rev },
    saved_by: "Status migration",
    saved_at: new Date().toISOString(),
  }),
});
if (!put.ok) throw new Error(`write failed: ${put.status} ${await put.text()}`);
const wrote = await put.json();
if (!wrote.length) {
  console.log("Somebody saved in between — nothing written. Run it again.");
  process.exit(1);
}
console.log(`Written as rev ${rev}.`);
