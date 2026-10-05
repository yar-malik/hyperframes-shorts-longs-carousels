/**
 * Thanks the applicants who sent a test video and asks them to reply if they
 * still want to start.
 *
 *   node scripts/board/start-with-applicants.mjs            # dry run: print who and what
 *   node scripts/board/start-with-applicants.mjs --send     # actually send
 *   node scripts/board/start-with-applicants.mjs --send --again   # re-send to people already mailed
 *
 * The mirror of chase-test-video.mjs: that one nudges the people who never
 * sent a video, this one writes to the people who did. It reads the live
 * table and folds it on the email exactly as the Applicants page does, so a
 * person who applied twice gets one email.
 *
 * Sending is behind a flag because the recipients are strangers and an email
 * cannot be recalled. The default run tells you what it would do and stops.
 * Already-mailed addresses are skipped by reading the mail log (kind "start"),
 * so running it twice does not mail anybody twice. --again overrides that.
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

const URL_ = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND = process.env.RESEND_API_KEY;
const FROM = process.env.HIRING_MAIL_FROM || process.env.SPONSOR_LEADS_FROM || process.env.CONTENT_AUTOMATION_MAIL_FROM;
const REPLY_TO = process.env.HIRING_REPLY_TO || "malikasfandyarashraf@gmail.com";

const send = process.argv.includes("--send");
const again = process.argv.includes("--again");

if (!URL_ || !KEY) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"); process.exit(1); }
if (send && (!RESEND || !FROM)) {
  console.error("RESEND_API_KEY and a sender are required to send. Both live in .env.production.local on voho-vm; run this there.");
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

/* ---- who sent a video, folded on the email like the Applicants page ---- */
const res = await fetch(`${URL_}/rest/v1/content_automation_application?select=*&order=created_at.desc`, { headers: H });
if (!res.ok) { console.error(`could not read the applications: ${res.status}`); process.exit(1); }
const rows = await res.json();

const order = [], by = {};
for (const a of rows.slice().sort((x, y) => String(x.created_at).localeCompare(String(y.created_at)))) {
  const key = String(a.email || "").trim().toLowerCase() || `#${a.id}`;
  const got = by[key];
  if (!got) { by[key] = { ...a, first_at: a.created_at }; order.push(key); continue; }
  Object.assign(got, { id: a.id, status: a.status, note: a.note, created_at: a.created_at });
  for (const f of ["name", "willing", "availability", "experience", "tools", "has_examples", "example_url_1", "example_url_2", "test_url"]) {
    if (String(a[f] || "").trim()) got[f] = a[f];
  }
}

const withVideo = order.map((k) => by[k]).filter((a) => {
  if (!String(a.test_url || "").trim()) return false;
  /* Someone already turned down does not get an invitation to start. */
  if (a.status === "no") { console.log(`  - ${a.email}: passed on, not mailing`); return false; }
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(a.email || "").trim());
});

/* ---- and who has already had this email ---- */
let mailed = new Set();
if (!again) {
  try {
    const log = await fetch(`${URL_}/storage/v1/object/content-automation-logs/mail-log.json`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: "no-store" });
    if (log.ok) {
      const entries = await log.json();
      if (Array.isArray(entries)) {
        mailed = new Set(entries.filter((m) => m.kind === "start" && m.ok)
          .map((m) => String(m.to || "").trim().toLowerCase()));
      }
    }
  } catch { /* no log yet is not a reason to refuse to send */ }
}

/* ---- the email ---- */
const firstName = (name) => {
  const first = String(name || "").trim().split(/\s+/)[0] || "there";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
};

const SUBJECT = "Your test video — shall we get started?";

function body(a) {
  return [
    `Hi ${firstName(a.name)},`,
    "",
    "Thank you for applying for the Technical Tutorial Creator role, and for taking the time to record and send your test video. We would love to start the process with you.",
    "",
    "If you are still interested, just reply to this email and we will get started immediately.",
    "",
    "If your situation has changed and it is no longer a fit, a one-line reply saying so is completely fine, and we will not chase you again.",
    "",
    "Looking forward to hearing from you.",
    "",
    "Thanks,",
    "Asfandyar",
  ].join("\n");
}

/* ---- go ---- */
const todo = withVideo.filter((a) => !mailed.has(String(a.email).trim().toLowerCase()));
const skipped = withVideo.length - todo.length;

console.log(`${rows.length} rows, ${order.length} people, ${withVideo.length} sent a test video.`);
if (skipped) console.log(`${skipped} already mailed (--again to mail them anyway).`);
console.log(`${todo.length} to email.`);
console.log(`from: ${FROM || "(no sender configured)"}   reply-to: ${REPLY_TO}\n`);

if (!send) {
  for (const a of todo) console.log(`  ${String(a.name || "").padEnd(26)} ${a.email.padEnd(36)} ${a.status}  ${a.test_url}`);
  console.log(`\n--- the email each of them gets ---\n\nSubject: ${SUBJECT}\n\n${todo.length ? body(todo[0]) : "(nobody to mail)"}`);
  console.log("\nDry run. Nothing was sent. Add --send to send it.");
  process.exit(0);
}

const log = [];
let sent = 0, failed = 0;
for (const a of todo) {
  const text = body(a);
  const line = { at: new Date().toISOString(), to: a.email, subject: SUBJECT, kind: "start", body: text };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: a.email, cc: ["amalik@vohoai.com"], reply_to: REPLY_TO, subject: SUBJECT, text }),
    });
    if (r.ok) { sent++; log.push({ ...line, ok: true }); console.log(`  sent   ${a.email}`); }
    else {
      failed++;
      const why = await r.text();
      log.push({ ...line, ok: false, error: `${r.status} ${why}`.slice(0, 300) });
      console.error(`  ! ${a.email}: ${r.status} ${why}`);
    }
  } catch (error) {
    failed++;
    log.push({ ...line, ok: false, error: String(error).slice(0, 300) });
    console.error(`  ! ${a.email}: ${error}`);
  }
  /* Resend allows two a second; stay well under it. */
  await new Promise((r) => setTimeout(r, 600));
}

/* Every other email this board sends lands in the log, and this one should
   too: it is the only record afterwards of what went out and to whom. */
if (log.length) {
  try {
    const prev = await fetch(`${URL_}/storage/v1/object/content-automation-logs/mail-log.json`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: "no-store" });
    const before = prev.ok ? await prev.json() : [];
    const now = [...(Array.isArray(before) ? before : []), ...log].slice(-400);
    const put = await fetch(`${URL_}/storage/v1/object/content-automation-logs/mail-log.json`, {
      method: "PUT",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "x-upsert": "true" },
      body: JSON.stringify(now),
    });
    if (!put.ok) console.error(`! mail log not written: ${put.status} ${await put.text()}`);
  } catch (error) { console.error("! mail log not written:", error); }
}

console.log(`\n${sent} sent, ${failed} failed.`);
