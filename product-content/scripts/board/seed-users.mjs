/**
 * Creates a sign-in for everyone on the board.
 *
 *   node scripts/seed-users.mjs                  # seed, skip anyone who exists
 *   node scripts/seed-users.mjs --reset-password # also reset existing users
 *
 * Reads the People list off the live board so the roster is never a second
 * copy to keep in step. The default password comes from CONTENT_AUTOMATION_DEFAULT_PASSWORD;
 * it is deliberately not written down in this repository.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";

for (const file of [".env.local", ".env.production.local"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const URL_ = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_PASSWORD = process.env.CONTENT_AUTOMATION_DEFAULT_PASSWORD;
const ADMINS = String(process.env.CONTENT_AUTOMATION_ADMINS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const BOARD = process.env.CONTENT_AUTOMATION_BOARD_URL || "https://yarmalik.com/api/content-automation";
const reset = process.argv.includes("--reset-password");

if (!URL_ || !KEY) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"); process.exit(1); }
if (!DEFAULT_PASSWORD) { console.error("CONTENT_AUTOMATION_DEFAULT_PASSWORD is required (not stored in the repo)"); process.exit(1); }
if (!ADMINS.length) console.warn("! CONTENT_AUTOMATION_ADMINS is empty — nobody will be an admin");

const hash = (plain) => {
  const N = 16384, salt = randomBytes(16).toString("hex");
  return `scrypt$${N}$${salt}$${scryptSync(plain, salt, 64, { N }).toString("hex")}`;
};
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const board = await (await fetch(BOARD)).json();
const people = board.people ?? [];
if (!people.length) { console.error("the board has no people"); process.exit(1); }

const existing = await (await fetch(`${URL_}/rest/v1/content_automation_user?select=email,name_key`, { headers: H })).json();
const haveMail = new Set(existing.map((u) => u.email));
const haveName = new Set(existing.map((u) => u.name_key));

let made = 0, updated = 0, skipped = 0;
for (const p of people) {
  const name = String(p.name || "").trim();
  if (!name) continue;
  const nameKey = name.toLowerCase();
  /* Nobody has to have an address to sign in, so stand in a local one that
     cannot receive mail rather than inventing a deliverable address. */
  const email = String(p.email || "").trim().toLowerCase() || `${nameKey.replace(/[^a-z0-9]+/g, ".")}@no-email.local`;
  const role = ADMINS.includes(nameKey) || ADMINS.includes(email) ? "admin" : "member";

  if (haveMail.has(email) || haveName.has(nameKey)) {
    if (!reset) { skipped++; continue; }
    const r = await fetch(`${URL_}/rest/v1/content_automation_user?name_key=eq.${encodeURIComponent(nameKey)}`, {
      method: "PATCH", headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ pass: hash(DEFAULT_PASSWORD), must_change: true, role }),
    });
    if (!r.ok) { console.error(`  ! ${name}: ${r.status} ${await r.text()}`); continue; }
    updated++; console.log(`  reset  ${name.padEnd(16)} ${role}`);
    continue;
  }

  const r = await fetch(`${URL_}/rest/v1/content_automation_user`, {
    method: "POST", headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ email, name_key: nameKey, name, pass: hash(DEFAULT_PASSWORD), role, must_change: true }),
  });
  if (!r.ok) { console.error(`  ! ${name}: ${r.status} ${await r.text()}`); continue; }
  made++; console.log(`  create ${name.padEnd(16)} ${role.padEnd(6)} ${email}`);
}

console.log(`\n${made} created, ${updated} reset, ${skipped} left alone.`);
