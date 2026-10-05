/**
 * Sets up the Skool board: two people, their standards, and their sign-ins.
 *
 *   node scripts/seed-skool.mjs             # show what it would do
 *   node scripts/seed-skool.mjs --write     # do it
 *
 * The standards are transcribed from the two Google Sheets this board
 * replaces. Idempotent: a standard already on the board is left alone, and an
 * existing sign-in is never given a new password.
 */
import { readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";

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
const PASS = process.env.CONTENT_AUTOMATION_DEFAULT_PASSWORD;
const write = process.argv.includes("--write");
if (!U || !K) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "content-type": "application/json" };

const PEOPLE = [
  { id: "p_asif", name: "Asif", email: "asifzulfiqar43@gmail.com", whatsapp: "", rate: "", hours: "" },
  { id: "p_rehman", name: "Rehman", email: "muhammadabdullahhunter@gmail.com", whatsapp: "3094485854", rate: "", hours: "15:00 - 18:00 PKT" },
];

/* Straight off the two sheets. Times are the estimates already written there,
   in minutes rather than hh:mm:ss because nobody needs the seconds. */
const STANDARDS = [
  ["Rehman", 1, "Daily", "Skool: create 10 posts across 10 accounts on AVC. Each post needs at least 3 likes and 3 comments. Message people in AVC.", 120],
  ["Rehman", 2, "Daily", "Instagram posts: lead magnet, and message the people who engage. AVC tutorial slides only.", 30],
  ["Rehman", 3, "Daily", "Twitter daily tutorial.", 30],
  ["Rehman", 4, "Daily", "Facebook groups: lead generation, and message the people who engage.", 30],
  ["Rehman", 5, "Daily", "LinkedIn posts: the same lead magnet you posted on Instagram, and message those people.", 30],
  ["Rehman", 0, "Weekly", "Fill out the statistic sheet and send a screenshot into the Skool WhatsApp group. Once a week now.", 5],

  ["Asif", 1, "Daily", "Skool: create 5 posts across 5 accounts on CCM. Do 15+ activities from Yar's account in Skool. Each post needs at least 3 likes and 3 comments.", 60],
  ["Asif", 2, "Daily", "Instagram slide, daily.", 30],
  ["Asif", 3, "Daily", "Twitter daily tutorial — a text image tutorial, or news.", 30],
  ["Asif", 4, "Daily", "Facebook lead generation, and message people on the same topic.", 30],
  ["Asif", 5, "Daily", "LinkedIn lead generation, and message people on the same topic (Topic 1).", 20],
  ["Asif", 6, "Weekly", "Work on courses — text, visuals, video.", 30],
  ["Asif", 0, "Weekly", "Fill out the statistic sheet and send a screenshot into the Skool WhatsApp group.", 5],
];

const rows = await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool&select=rev,state`, { headers: H })).json();
const cur = rows[0]?.state || { rev: 0, standards: [], log: [], people: [] };
const rev = rows[0]?.rev ?? 0;

const board = {
  rev,
  saveToken: "",
  savedBy: "seed",
  savedAt: new Date().toISOString(),
  people: [...(cur.people || [])],
  standards: [...(cur.standards || [])],
  log: [...(cur.log || [])],
};
for (const p of PEOPLE) {
  if (!board.people.some((x) => String(x.name).toLowerCase() === p.name.toLowerCase())) board.people.push(p);
}
let added = 0;
for (const [owner, priority, cadence, task, estMins] of STANDARDS) {
  const there = board.standards.some((s) => s.owner === owner && s.task === task);
  if (there) continue;
  board.standards.push({
    id: `s_${owner.toLowerCase()}_${priority}_${Math.random().toString(36).slice(2, 6)}`,
    owner, task, priority, cadence, link: "", link2: "", estMins, note: "",
  });
  added++;
}
console.log(`board rev ${rev} | people ${board.people.length} | standards ${board.standards.length} (+${added}) | log rows ${board.log.length}`);
for (const p of board.people) console.log(`  ${p.name.padEnd(8)} ${p.email}`);

/* Sign-ins live in the shared user table, so one login reaches both boards. */
const hash = (plain) => {
  const N = 16384, salt = randomBytes(16).toString("hex");
  return `scrypt$${N}$${salt}$${scryptSync(plain, salt, 64, { N }).toString("hex")}`;
};
const existing = await (await fetch(`${U}/rest/v1/content_automation_user?select=email,name_key`, { headers: H })).json();
const haveMail = new Set(existing.map((u) => u.email));
const haveName = new Set(existing.map((u) => u.name_key));
const toCreate = PEOPLE.filter((p) => !haveMail.has(p.email) && !haveName.has(p.name.toLowerCase()));
console.log(`\nsign-ins to create: ${toCreate.length ? toCreate.map((p) => p.name).join(", ") : "none — both already exist"}`);
if (toCreate.length && !PASS) console.warn("! CONTENT_AUTOMATION_DEFAULT_PASSWORD is not set, so no sign-in can be created");

if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

const put = await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool`, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state: { ...board, rev: rev + 1 }, saved_by: "seed", saved_at: new Date().toISOString() }),
});
let ok = put.ok && (await put.json()).length;
if (!ok) {
  const post = await fetch(`${U}/rest/v1/content_automation_board`, {
    method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ id: "skool", rev: 1, state: { ...board, rev: 1 }, saved_by: "seed" }),
  });
  if (!post.ok) { console.error("board write failed:", post.status, await post.text()); process.exit(1); }
  ok = true;
}
console.log("board written.");

for (const p of toCreate) {
  if (!PASS) break;
  const r = await fetch(`${U}/rest/v1/content_automation_user`, {
    method: "POST", headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({
      email: p.email, name_key: p.name.toLowerCase(), name: p.name,
      pass: hash(PASS), role: "member", must_change: true,
    }),
  });
  console.log(r.ok ? `  sign-in created for ${p.name}` : `  ! ${p.name}: ${r.status} ${await r.text()}`);
}
