/**
 * Invite somebody to the board from a terminal.
 *
 *   node scripts/board/invite.mjs --name "Ashir" --email ashir@example.com [--role admin] [--teams video,skool]
 *   node scripts/board/invite.mjs --email ashir@example.com --resend      # the email again
 *
 * The same three steps the Admin → Team → "Invite & access" tab does — a
 * sign-in row, a row on the roster, an email saying how to get in — for when
 * nobody is at the board. Meant to be run on the VM, which is where the
 * Resend key lives; from a laptop without one it makes the account and the
 * roster row and says plainly that no email went.
 *
 * Kept in step with lib/content-automation-invite.ts by hand: the text below
 * is a copy of `inviteText` there. If you change one, change both.
 */
import { randomBytes, scryptSync } from "node:crypto";
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

const arg = (k, d = "") => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? String(process.argv[i + 1] || "") : d; };
const name = arg("name").trim().replace(/\s+/g, " ");
const email = arg("email").trim().toLowerCase();
const role = arg("role", "member") === "admin" ? "admin" : "member";
const teams = arg("teams", "video").split(",").map((s) => s.trim()).filter((t) => t === "video" || t === "skool");
const from = arg("from", "Yar");
const resend = process.argv.includes("--resend");

if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { console.error("--email is required"); process.exit(1); }
if (!resend && !name) { console.error("--name is required"); process.exit(1); }

const j = async (path, init) => {
  const r = await fetch(`${U}/rest/v1/${path}`, { headers: H, ...init });
  const text = await r.text();
  return { ok: r.ok, status: r.status, body: text ? JSON.parse(text) : null };
};

/* ---------------- the sign-in ---------------- */

let user = (await j(`content_automation_user?email=eq.${encodeURIComponent(email)}&select=email,name,role`)).body?.[0] || null;

if (resend) {
  if (!user) { console.error(`! nobody signs in as ${email}`); process.exit(1); }
  console.log(`user  ${user.name} <${user.email}> ${user.role} — sending the invite again`);
} else if (user) {
  console.log(`user  ${user.name} <${user.email}> already exists (${user.role}) — left alone; add --resend to email them again`);
} else {
  const hash = (plain) => {
    const N = 16384, salt = randomBytes(16).toString("hex");
    return `scrypt$${N}$${salt}$${scryptSync(plain, salt, 64, { N }).toString("hex")}`;
  };
  /* A random password nobody is told. They sign in with a code. */
  const r = await j("content_automation_user", {
    method: "POST", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ email, name, name_key: name.toLowerCase(), role, pass: hash(randomBytes(32).toString("hex")), must_change: false }),
  });
  if (!r.ok) { console.error(`! ${r.status} making the user: ${JSON.stringify(r.body).slice(0, 300)}`); process.exit(1); }
  user = r.body[0];
  console.log(`user  created ${name} <${email}> as ${role}`);
}

/* ---------------- the roster ---------------- */

if (!resend) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const [row] = (await j("content_automation_board?id=eq.default&select=rev,state")).body;
    const people = row.state.people || [];
    const have = people.find((p) =>
      String(p.email || "").trim().toLowerCase() === email ||
      String(p.name || "").trim().toLowerCase() === name.toLowerCase());
    if (have) { console.log(`board ${have.name} already on the roster (${have.id})`); break; }
    const person = { id: "p_" + Date.now().toString(36), name, email, whatsapp: "", ...(teams.length ? { teams } : {}) };
    const now = new Date().toISOString();
    const next = { ...row.state, people: [...people, person], rev: row.rev + 1, savedBy: from, savedAt: now };
    /* Only if nobody saved in between — the board is in use while this runs. */
    const done = await j(`content_automation_board?id=eq.default&rev=eq.${row.rev}`, {
      method: "PATCH", headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify({ rev: row.rev + 1, state: next, saved_by: from, saved_at: now }),
    });
    if (done.ok && done.body?.length) { console.log(`board rev ${row.rev} -> ${row.rev + 1}, ${name} added (${teams.join("+") || "no team"})`); break; }
    if (attempt === 4) { console.error("! the board kept moving; roster row not written. Add them on the Team page."); }
  }
}

/* ---------------- the email ---------------- */

const BOARD_URL = "https://content.yarmalik.com";
const first = String(user.name || name).split(/\s+/)[0] || "there";
const text = [
  `Hi ${first},`,
  "",
  `${from} has added you to Yar Content OS — the place the team's videos,`,
  "Skool work and pay are tracked.",
  "",
  `Sign in here: ${BOARD_URL}/login`,
  "",
  "Type this email address in, press “Email me a code”, and put in the",
  "code that arrives. There is no password to remember; a code is sent",
  "each time you sign in, and it works once.",
  "",
  "Once you are in, open your profile and fill in how we reach you and",
  "how you are paid.",
  "",
  `— ${from}`,
].join("\n");
const subject = "You have been added to Yar Content OS";

if (!process.env.RESEND_API_KEY || !process.env.CONTENT_AUTOMATION_MAIL_FROM) {
  console.log("mail  NOT sent — RESEND_API_KEY / CONTENT_AUTOMATION_MAIL_FROM are not set here. Run this on the VM, or press “Send again” on the board.");
  process.exit(0);
}

const ALWAYS_CC = "amalik@vohoai.com";
let ok = false, error = "";
try {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTENT_AUTOMATION_MAIL_FROM, to: user.email,
      cc: user.email === ALWAYS_CC ? [] : [ALWAYS_CC], subject, text,
    }),
  });
  ok = r.ok;
  if (!ok) error = `Resend answered ${r.status}: ${(await r.text()).slice(0, 200)}`;
} catch (e) { error = e.message; }

/* The mail log, so the board's Email-sent page shows this went. */
try {
  const logUrl = `${U}/storage/v1/object/content-automation-logs/mail-log.json`;
  const cur = await fetch(logUrl, { headers: { apikey: K, Authorization: `Bearer ${K}` } });
  const log = cur.ok ? await cur.json() : [];
  const entry = { at: new Date().toISOString(), to: user.email, subject, kind: "invite", body: text, ok, ...(error ? { error } : {}) };
  await fetch(logUrl, {
    method: "PUT", headers: { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json", "x-upsert": "true" },
    body: JSON.stringify([...(Array.isArray(log) ? log : []), entry].slice(-400)),
  });
} catch {}

console.log(ok ? `mail  sent to ${user.email}` : `! mail failed: ${error}`);
process.exit(ok ? 0 : 1);
