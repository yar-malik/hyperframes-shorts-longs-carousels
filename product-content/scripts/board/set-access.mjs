/**
 * Who is on the roster, and who may see everything.
 *
 *   node scripts/set-access.mjs             # show what it would do
 *   node scripts/set-access.mjs --write     # do it
 *
 * Two separate things live under the word "role" here, and this sets both so
 * they cannot drift:
 *
 *   - the board's `people` list, which is the roster the Team page draws and
 *     the thing work and pay hang off. Yar was never on it — he owns the
 *     board but had no row on it, so he was absent from Team, from the rates
 *     table and from anywhere else the roster is read.
 *   - `content_automation_user.role`, which is `admin` or `member` and is
 *     what actually decides what a signed-in person can open.
 *
 * ADMINS below is the whole list, not an addition to one: anybody named gets
 * `admin`, everybody else is put back to `member`. That way this file is a
 * statement of who has access rather than a patch to it, and running it twice
 * changes nothing the second time.
 *
 * An admin sees the whole board: every rate, every logged hour, the
 * financials, and the bank details on the Team page — everyone's IBAN,
 * account name and date of birth. That is the point of the role, and it is
 * the reason the list is written down here rather than toggled in passing.
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

/* Everybody who may see everything, by name_key (the lowercased name). */
const ADMINS = ["yar", "asif"];

/* Somebody who should be on the roster but is not. Matched to their sign-in
   by email, so the avatar, the mail and the row are the same person. */
const ROSTER = [
  { board: "default", id: "p_yar", name: "Yar", email: "amalik@vohoai.com", whatsapp: "" },
];

const j = async (path, init) => {
  const r = await fetch(`${U}/rest/v1/${path}`, { headers: H, ...init });
  const text = await r.text();
  if (!r.ok) { console.error(`! ${r.status} on ${path}: ${text.slice(0, 300)}`); process.exit(1); }
  return text ? JSON.parse(text) : null;
};

/* ---------------- the roster ---------------- */

let rosterWork = [];
for (const want of ROSTER) {
  const [row] = await j(`content_automation_board?id=eq.${want.board}&select=rev,state`);
  const people = row.state.people || [];
  const key = want.name.trim().toLowerCase();
  const has = people.some((p) => String(p.name || "").trim().toLowerCase() === key);
  console.log(`board ${want.board} rev ${row.rev}: ${people.length} people, ${want.name} ${has ? "already there" : "MISSING"}`);
  if (!has) rosterWork.push({ want, row, people });
}

/* ---------------- who may see everything ---------------- */

const users = await j("content_automation_user?select=name_key,name,email,role&order=name_key");
const roleWork = [];
for (const u of users) {
  const should = ADMINS.includes(String(u.name_key || "").trim().toLowerCase()) ? "admin" : "member";
  const mark = u.role === should ? "  " : "->";
  console.log(`user  ${mark} ${String(u.name_key).padEnd(15)} ${String(u.role).padEnd(6)} ${u.role === should ? "" : "becomes " + should}`);
  if (u.role !== should) roleWork.push({ ...u, should });
}
for (const name of ADMINS) {
  if (!users.some((u) => String(u.name_key || "").trim().toLowerCase() === name)) {
    console.error(`\n! "${name}" is in ADMINS but has no sign-in — nothing to make an admin.`);
    process.exit(1);
  }
}

if (!rosterWork.length && !roleWork.length) { console.log("\nNothing to do."); process.exit(0); }
if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

/* ---------------- writing ---------------- */

const now = new Date().toISOString();

for (const { want, row, people } of rosterWork) {
  const { board, ...person } = want;
  const next = { ...row.state, people: [...people, person], rev: row.rev + 1, savedBy: "access", savedAt: now };
  /* Only if nobody saved in between. The board is in use while this runs, and
     a blind write of the whole document would silently drop whatever landed
     between the read above and this line. */
  const done = await j(
    `content_automation_board?id=eq.${board}&rev=eq.${row.rev}`,
    { method: "PATCH", headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify({ rev: row.rev + 1, state: next, saved_by: "access", saved_at: now }) },
  );
  if (!done?.length) {
    console.error(`! ${board} moved on from rev ${row.rev} while this ran — nothing written. Run it again.`);
    process.exit(1);
  }
  console.log(`board ${board} -> rev ${row.rev + 1}, ${want.name} added`);
}

for (const u of roleWork) {
  const done = await j(
    `content_automation_user?name_key=eq.${encodeURIComponent(u.name_key)}`,
    { method: "PATCH", headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify({ role: u.should }) },
  );
  if (!done?.length) { console.error(`! no row updated for ${u.name_key}`); process.exit(1); }
  console.log(`user  ${u.name_key} -> ${u.should}`);
}

console.log("\ndone.");
