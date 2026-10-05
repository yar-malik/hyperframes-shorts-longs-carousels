/**
 * Moves the videos out of the board document and into their own rows.
 *
 * In stages, because the board is live and each stage has to be safe to stop
 * at. Nothing here ever removes a video: the document keeps its copy until
 * --finish, and --rollback puts everything back from the table.
 *
 *   node scripts/board/split-videos.mjs                 # what it would do
 *   node scripts/board/split-videos.mjs --write         # 1. copy into the table
 *   node scripts/board/split-videos.mjs --check         # 2. compare the two copies
 *   node scripts/board/split-videos.mjs --finish        # 3. empty the document's array
 *   node scripts/board/split-videos.mjs --rollback      # undo: table -> document
 *
 * The order that keeps the board up:
 *
 *   1. run db/content-automation-videos.sql              (creates the table)
 *   2. --write         — the table now has every video; nothing reads it yet
 *   3. deploy the code — the table becomes the one that counts, the copies in
 *                        the document are ignored as duplicates
 *   4. --check         — anything saved in the gap between 2 and 3 shows up
 *                        here as a difference, and can be copied across
 *   5. --finish        — the document stops carrying 872KB it does not use
 *
 * Stop after any stage and the board still works: until 5 the document holds
 * a complete copy, and until 3 it is the copy being read.
 */
import { readFileSync, writeFileSync } from "node:fs";

for (const f of [".env.local", ".env.production.local"]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  } } catch {}
}

const U = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !K) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed."); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "content-type": "application/json" };

const arg = (f) => process.argv.includes(f);
const write = arg("--write"), check = arg("--check"), finish = arg("--finish"), rollback = arg("--rollback");
const BOARD = `${U}/rest/v1/content_automation_board`;
const VIDEOS = `${U}/rest/v1/content_automation_videos`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function get(url) {
  const r = await fetch(url, { headers: H });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

const [row] = await get(`${BOARD}?id=eq.default&select=rev,state,saved_by,saved_at`);
if (!row) { console.error("No board row."); process.exit(1); }
const state = row.state;
const inDoc = state.videos || [];
const table = await get(`${VIDEOS}?select=id,ord,rev,doc&order=ord.asc`);
const held = new Map(table.map((r) => [r.id, { ...r.doc, id: r.id }]));

console.log(`board rev ${row.rev}, last saved by ${row.saved_by || "?"} at ${row.saved_at}`);
console.log(`${inDoc.length} video(s) in the document, ${table.length} in the table\n`);

/* ---------------- undo ---------------- */
if (rollback) {
  if (!table.length) { console.error("The table is empty — nothing to put back."); process.exit(1); }
  const videos = table.map((r) => ({ ...r.doc, id: r.id }));
  console.log(`Would write ${videos.length} video(s) from the table back into the document.`);
  if (!arg("--yes")) { console.log("\nAdd --yes to do it."); process.exit(0); }
  const r = await fetch(`${BOARD}?id=eq.default&rev=eq.${row.rev}`, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({
      rev: row.rev + 1,
      state: { ...state, videos, rev: row.rev + 1 },
      saved_by: "rollback",
      saved_at: new Date().toISOString(),
    }),
  });
  const back = await r.json();
  if (!r.ok || !back.length) { console.error("Somebody saved first — run it again."); process.exit(1); }
  console.log(`Put ${videos.length} video(s) back into the document, now rev ${back[0].rev}.`);
  console.log("Revert the code too: it reads the table, and the table is now the stale copy.");
  process.exit(0);
}

/* ---------------- 2. compare the two copies ---------------- */
if (check) {
  if (!inDoc.length) { console.log("The document carries no videos, so there is nothing to compare."); process.exit(0); }
  let missing = 0, differs = 0;
  for (const v of inDoc) {
    if (!held.has(v.id)) { console.log(`  MISSING from the table: ${v.id} — ${String(v.title).slice(0, 50)}`); missing++; continue; }
    if (!same(held.get(v.id), v)) {
      differs++;
      const a = JSON.stringify(held.get(v.id)), b = JSON.stringify(v);
      console.log(`  differs: ${v.id} — ${String(v.title).slice(0, 44)} (table ${a.length}b, document ${b.length}b)`);
    }
  }
  const extra = table.filter((r) => !inDoc.some((v) => v.id === r.id));
  if (extra.length) console.log(`  ${extra.length} in the table only (added since the copy) — expected`);
  console.log(`\n${inDoc.length} checked: ${missing} missing, ${differs} different.`);
  if (missing) console.log("Missing rows: run --write again.");
  if (differs) {
    console.log("A difference means the two copies moved apart. Whichever is newer is the one to keep:");
    console.log("the table is what the board now reads, so a difference usually means an edit that");
    console.log("landed in the document after the copy. Look at it before --finish.");
  }
  process.exit(missing || differs ? 1 : 0);
}

/* ---------------- 3. empty the document's array ---------------- */
if (finish) {
  if (!table.length) { console.error("The table is empty — refusing to empty the document."); process.exit(1); }
  const absent = inDoc.filter((v) => !held.has(v.id));
  if (absent.length) {
    console.error(`${absent.length} video(s) in the document are not in the table: ${absent.map((v) => v.id).join(", ")}`);
    console.error("Run --write, then --check, before this.");
    process.exit(1);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `/tmp/board-before-finish-${stamp}.json`;
  writeFileSync(backup, JSON.stringify({ rev: row.rev, saved_at: row.saved_at, state }, null, 2));
  console.log(`Document backed up to ${backup}`);
  const r = await fetch(`${BOARD}?id=eq.default&rev=eq.${row.rev}`, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({
      rev: row.rev + 1,
      state: { ...state, videos: [], rev: row.rev + 1 },
      saved_by: "split",
      saved_at: new Date().toISOString(),
    }),
  });
  const back = await r.json();
  if (!r.ok || !back.length) { console.error("Somebody saved while this ran — run it again."); process.exit(1); }
  const was = JSON.stringify(state).length, now = JSON.stringify(back[0].state).length;
  console.log(`Document: ${(was / 1024) | 0}KB → ${(now / 1024) | 0}KB, now rev ${back[0].rev}.`);
  process.exit(0);
}

/* ---------------- 1. copy into the table ---------------- */
const toWrite = [];
let already = 0;
for (let i = 0; i < inDoc.length; i++) {
  const v = inDoc[i];
  if (!v || !v.id) { console.error(`The video at position ${i} has no id — stopping rather than guessing.`); process.exit(1); }
  /* A row the table already holds is left exactly as it is. Once the code is
     live the table is the copy that counts, and overwriting it from the
     document would undo whatever has been saved since. */
  if (held.has(v.id)) { already++; continue; }
  toWrite.push({ id: v.id, ord: i, rev: 1, doc: v, updated_by: "split", updated_at: new Date().toISOString() });
}

console.log(`${toWrite.length} to copy across, ${already} already in the table (left alone)`);
if (!toWrite.length) { console.log("\nNothing to copy."); process.exit(0); }
for (const r of toWrite.slice(0, 5)) console.log(`   ${r.id}  ${String(r.doc.title).slice(0, 56)}`);
if (toWrite.length > 5) console.log(`   … and ${toWrite.length - 5} more`);

if (!write) { console.log("\nDry run. Add --write to copy them across."); process.exit(0); }

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `/tmp/board-before-split-${stamp}.json`;
writeFileSync(backup, JSON.stringify({ rev: row.rev, saved_at: row.saved_at, state }, null, 2));
console.log(`\nDocument backed up to ${backup} (${(JSON.stringify(state).length / 1024) | 0}KB)`);

for (let i = 0; i < toWrite.length; i += 10) {
  const batch = toWrite.slice(i, i + 10);
  const r = await fetch(VIDEOS, {
    method: "POST",
    headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(batch),
  });
  if (!r.ok) { console.error(`Write failed at ${i}: ${r.status} ${await r.text()}`); process.exit(1); }
  console.log(`  wrote ${Math.min(i + batch.length, toWrite.length)}/${toWrite.length}`);
}

/* Read them back and compare, field for field, before saying it worked. */
const after = await get(`${VIDEOS}?select=id,ord,rev,doc&order=ord.asc`);
const got = new Map(after.map((r) => [r.id, { ...r.doc, id: r.id }]));
let bad = 0;
for (const r of toWrite) {
  if (!got.has(r.id)) { console.error(`  MISSING after write: ${r.id}`); bad++; continue; }
  if (!same(got.get(r.id), r.doc)) { console.error(`  DIFFERENT after write: ${r.id}`); bad++; }
}
if (bad) { console.error(`\n${bad} row(s) did not arrive intact. The document is untouched.`); process.exit(1); }

console.log(`\nAll ${toWrite.length} copied and verified, field for field. ${after.length} video(s) in the table.`);
console.log("The document still holds its copy — deploy the code, then --check, then --finish.");
