/**
 * Puts the Voho content plan on the Voho Topics page.
 *
 *   node scripts/board/add-voho-plan.mjs            # say what it would add
 *   node scripts/board/add-voho-plan.mjs --write    # add them
 *
 * Reads content/voho/voho-30-day-plan.json (60 topics, two a day, each a long
 * video and a reel) and adds one Voho topic per entry, plus the videos already
 * made, with their published links. A title already on the page is skipped, so
 * running it again adds only what's new. Needs CONTENT_AUTOMATION_SECRET, so it
 * runs on the box.
 */
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";

for (const f of [".env.production.local", ".env.local", ".env"]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  } } catch {}
}
const WRITE = process.argv.includes("--write");
const secret = process.env.CONTENT_AUTOMATION_SECRET || "";
if (!secret) { console.error("CONTENT_AUTOMATION_SECRET must be set."); process.exit(1); }
const payload = Buffer.from(JSON.stringify({ email: "board-scripts@yarmalik.com", name: "Yar", role: "admin", iat: Math.floor(Date.now() / 1000) })).toString("base64url");
const cookie = `content_automation_session=${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
const endpoint = process.env.BOARD_ENDPOINT || "https://content.yarmalik.com/api/content-automation";

const plan = JSON.parse(readFileSync("content/voho/voho-30-day-plan.json", "utf8"));
const dow = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/* The two made before the plan, already out everywhere. */
const MADE = [
  {
    title: "An AI receptionist that answers your clinic's phone in Saudi Arabic",
    note: "Made 25 Sep, hand-painted Hum + the real app.voho.ai recording. Clinic at 11pm; Layla books a dentist. " +
      "YouTube (long) + Instagram & Facebook (reel). Facebook: https://www.facebook.com/1087170174019698",
    links: { long: "https://www.youtube.com/watch?v=jAfCPJNcix0", short: "https://www.instagram.com/p/18103676258205638/" },
  },
  {
    title: "An AI receptionist that books property viewings in Saudi Arabic",
    note: "Made 25 Sep, the Hum crew + a real app.voho.ai recording. Riyadh agency, agent out on a viewing; Layla offers the Al Narjis flat and books Sunday at five. " +
      "YouTube (long) + LinkedIn (long) + Instagram & Facebook (reel). Facebook: https://www.facebook.com/1751748205881069 · " +
      "LinkedIn: https://www.linkedin.com/feed/update/urn:li:ugcPost:7509255463373451264",
    links: { long: "https://www.youtube.com/watch?v=XhTD9bhyz1c", short: "https://www.instagram.com/p/18393942682201685/" },
  },
];

const r = await fetch(endpoint, { headers: { accept: "application/json", cookie } });
if (!r.ok) throw new Error(`Board read failed: ${r.status}`);
const board = await r.json();
const have = new Set((board.ideas || []).filter((x) => x?.section === "topic").map((x) => String(x.title || "").trim().toLowerCase()));

let seq = 0;
const now = Date.now();
const idOf = () => "im" + (now + seq++).toString(36) + "v" + seq.toString(36);
const row = (title, note, made, links, addedAt) => ({
  id: idOf(), title, note, made, links, owner: "", source: "Voho plan", status: "new", addedAt,
  section: "topic", platform: "", community: "voho", sourceUrl: links.long || "",
});

const rows = [];
for (const m of MADE) rows.push(row(m.title, m.note, { long: "done", short: "done" }, m.links, new Date(now).toISOString()));
for (const p of plan) {
  const note = `Day ${p.day} · ${dow(p.date)} · ${p.slot === "A" ? "1st" : "2nd"} of the day · ${p.industry} · console template: ${p.template}. ` +
    `${p.scenario} Hook: "${p.hook}" Pieces: a long video (YouTube + LinkedIn) and a reel (Instagram + Facebook).`;
  // later days sort further down: addedAt steps back a minute per topic from now
  rows.push(row(p.title, note, {}, {}, new Date(now - (p.n) * 60e3).toISOString()));
}
const add = rows.filter((x) => !have.has(x.title.trim().toLowerCase()));
console.log(`${rows.length} topics in the plan · ${rows.length - add.length} already on the page · ${add.length} to add${WRITE ? "" : " — dry run"}`);
for (const x of add.slice(0, 5)) console.log(`  + ${x.title}`);
if (add.length > 5) console.log(`  … and ${add.length - 5} more`);
if (!WRITE || !add.length) process.exit(0);

const ops = add.map((row) => ({ t: "add", coll: "ideas", row }));
for (let i = 0; i < ops.length; i += 25) {
  const w = await fetch(endpoint, { method: "PATCH", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ ops: ops.slice(i, i + 25) }) });
  if (!w.ok) throw new Error(`Write failed at ${i}: ${w.status} ${await w.text()}`);
  console.log(`  wrote ${Math.min(i + 25, ops.length)}/${ops.length}`);
}
console.log("Done.");
