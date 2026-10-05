/**
 * Who may approve a video to publish, and see the money.
 *
 *   node scripts/board/set-admins.mjs                     # show every sign-in and what it is
 *   node scripts/board/set-admins.mjs --write a@b.c …     # make those addresses admins
 *   node scripts/board/set-admins.mjs --write --demote …  # and make everyone else a member
 *
 * There is one team on this board now: everybody signed in can open every
 * page. Admin is the line that is left — the finances, everyone's details,
 * and approving a video for publishing — so who holds it is worth being able
 * to see and set in one place rather than clicking down a list.
 *
 * Addresses are matched exactly, lower-cased. A name is matched too, for the
 * sake of typing `asif` rather than looking his address up first; an
 * ambiguous name stops rather than guessing which person was meant.
 *
 * Reads .env.local / .env.production.local for SUPABASE_URL and the service
 * key, the same way the other scripts here do. Supabase is reachable only
 * from the VM, so this runs there over SSH, not on a laptop.
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

const argv = process.argv.slice(2);
const write = argv.includes("--write");
const demote = argv.includes("--demote");
const wanted = argv.filter((a) => !a.startsWith("--")).map((a) => a.trim().toLowerCase());

const res = await fetch(`${U}/rest/v1/${TABLE}?select=email,name,role,last_seen&order=email.asc`, { headers: H });
if (!res.ok) { console.error(`could not read ${TABLE}: ${res.status}`); process.exit(1); }
const rows = await res.json();

const show = (r) => `${String(r.role).padEnd(6)} ${String(r.name || "—").padEnd(22)} ${r.email}` +
  (r.last_seen ? `   last seen ${String(r.last_seen).slice(0, 10)}` : "   never signed in");

if (!wanted.length) {
  console.log(`${rows.length} sign-in(s):\n`);
  for (const r of rows) console.log("  " + show(r));
  console.log("\nPass addresses (or names) with --write to make them admins.");
  process.exit(0);
}

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

/* A super admin passed here would be quietly demoted to plain admin, losing
   the team and the money. That is never what `set-admins asif yar` meant. */
const supers = [...picked.values()].filter((r) => r.role === "super_admin");
for (const r of supers) console.log(`  (leaving ${r.email} as super_admin — use set-role.mjs to change that)`);
const promote = [...picked.values()].filter((r) => r.role !== "admin" && r.role !== "super_admin");
const strip = demote ? rows.filter((r) => r.role === "admin" && !picked.has(String(r.email).toLowerCase())) : [];

console.log("admins after this:\n");
for (const r of rows) {
  const willBe = picked.has(String(r.email).toLowerCase()) ? "admin"
    : strip.some((s) => s.email === r.email) ? "member" : r.role;
  const mark = willBe !== r.role ? `  <- ${r.role} → ${willBe}` : "";
  if (willBe === "admin" || mark) console.log("  " + show(r) + mark);
}

if (!promote.length && !strip.length) { console.log("\nNothing to change."); process.exit(0); }
if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

async function setRole(email, role) {
  const r = await fetch(`${U}/rest/v1/${TABLE}?email=eq.${encodeURIComponent(email)}`, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ role }),
  });
  if (!r.ok || !(await r.json()).length) { console.error(`  ! ${email}: ${r.status}`); return false; }
  console.log(`  ${email} -> ${role}`);
  return true;
}

console.log("");
for (const r of promote) await setRole(String(r.email).toLowerCase(), "admin");
for (const r of strip) await setRole(String(r.email).toLowerCase(), "member");
console.log("\ndone.");
