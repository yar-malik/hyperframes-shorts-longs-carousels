/**
 * Who is a super admin, an admin, or a user.
 *
 *   node scripts/board/set-role.mjs                                   # show everyone
 *   node scripts/board/set-role.mjs --write super_admin a@b.c         # set one
 *   node scripts/board/set-role.mjs --write admin asif usman          # set several
 *
 * There are three roles. `member` is a user: their own work, their own pay.
 * `admin` runs the board — standards, approvals, email, applicants, import.
 * `super_admin` also holds the team and the money: invites, role changes, the
 * activity list, every rate and the finances.
 *
 * set-admins.mjs still exists and still moves people between admin and member;
 * this is the one that knows about super_admin.
 *
 * Addresses are matched exactly, lower-cased. A name is matched too, so that
 * `asif` works without looking his address up first; an ambiguous name stops
 * rather than guessing which person was meant.
 *
 * Reads .env.local / .env.production.local for SUPABASE_URL and the service
 * key. Supabase is not reachable from a laptop — run this on the VM:
 *
 *   gcloud compute ssh voho-vm --zone europe-west2-a \
 *     --project callsupport-ai-439923 --tunnel-through-iap \
 *     --command='cd /var/www/yarmalik.com && node scripts/board/set-role.mjs …' 
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
if (!U || !K) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "content-type": "application/json" };
const TABLE = "content_automation_user";
const ROLES = ["super_admin", "admin", "member"];

const argv = process.argv.slice(2);
const write = argv.includes("--write");
const rest = argv.filter((a) => !a.startsWith("--"));
const role = rest[0];
const wanted = rest.slice(1).map((a) => a.trim().toLowerCase());

/* A laptop cannot reach Supabase, so this is a connection error rather than
   an HTTP one, and the raw undici trace says nothing useful. */
let rows;
try {
  const res = await fetch(`${U}/rest/v1/${TABLE}?select=email,name,role,last_seen&order=role.asc,email.asc`, { headers: H });
  if (!res.ok) { console.error(`could not read ${TABLE}: ${res.status}`); process.exit(1); }
  rows = await res.json();
} catch {
  console.error(`could not reach ${U}\n\nRun this on the VM — see docs/DEPLOYMENT.md, "Running SQL against it".`);
  process.exit(1);
}

const show = (r) => `${String(r.role).padEnd(12)} ${String(r.name || "—").padEnd(22)} ${r.email}` +
  (r.last_seen ? `   last seen ${String(r.last_seen).slice(0, 10)}` : "   never signed in");

if (!role) {
  console.log(`${rows.length} sign-in(s):\n`);
  for (const r of rows) console.log("  " + show(r));
  console.log(`\nUsage: --write <${ROLES.join("|")}> <address or name> …`);
  process.exit(0);
}
if (!ROLES.includes(role)) {
  console.error(`! "${role}" is not a role. One of: ${ROLES.join(", ")}`);
  process.exit(1);
}
if (!wanted.length) { console.error("! name at least one person"); process.exit(1); }

/* Resolve each argument to exactly one row, or stop. */
const picked = new Map();
for (const q of wanted) {
  const byMail = rows.filter((r) => String(r.email || "").trim().toLowerCase() === q);
  const byName = rows.filter((r) => {
    const n = String(r.name || "").trim().toLowerCase();
    return n === q || n.split(/\s+/)[0] === q;
  });
  const hit = byMail.length ? byMail : byName;
  if (!hit.length) { console.error(`! nobody signs in as "${q}" — invite them first, or check the spelling`); process.exit(1); }
  if (hit.length > 1) {
    console.error(`! "${q}" matches ${hit.length} people: ${hit.map((h) => h.email).join(", ")} — name the address`);
    process.exit(1);
  }
  picked.set(String(hit[0].email).toLowerCase(), hit[0]);
}

const changing = [...picked.values()].filter((r) => r.role !== role);
/* Losing the last super admin means nobody can invite, promote or see the
   finances again without a script. Worth refusing rather than reporting. */
const supersNow = rows.filter((r) => r.role === "super_admin").length;
const supersAfter = rows.filter((r) =>
  picked.has(String(r.email).toLowerCase()) ? role === "super_admin" : r.role === "super_admin").length;
if (supersNow && !supersAfter) {
  console.error("! that would leave no super admin — promote somebody else first");
  process.exit(1);
}

console.log(`${changing.length} change(s):\n`);
for (const r of changing) console.log("  " + show(r) + `  <- ${r.role} → ${role}`);
if (!changing.length) { console.log("  nothing to do"); process.exit(0); }
if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

let failed = 0;
for (const r of changing) {
  const res = await fetch(`${U}/rest/v1/${TABLE}?email=eq.${encodeURIComponent(String(r.email).toLowerCase())}`, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ role }),
  });
  const ok = res.ok && (await res.json()).length;
  console.log(`  ${ok ? "✓" : "!"} ${r.email} → ${role}${ok ? "" : ` (${res.status})`}`);
  if (!ok) failed++;
}
/* A role lives in the session cookie, so it does not change under somebody
   who is already signed in. */
console.log(failed ? `\n${failed} failed.` : "\nDone. Anyone affected must sign out and back in.");
process.exit(failed ? 1 : 0);
