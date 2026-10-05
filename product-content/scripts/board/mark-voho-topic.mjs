/**
 * Marks a Voho topic made and published, with its links.
 *
 *   node scripts/board/mark-voho-topic.mjs <base64 JSON: { title, links: { youtube, instagram, facebook, linkedin } }>
 *
 * Called by scripts/voho/board.mjs from the laptop, over the tunnel, after publish.mjs. Finds the Voho topic by its
 * title; long = the YouTube video, short = the Instagram reel, and the Facebook and LinkedIn links go in the note.
 */
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";

for (const f of [".env.production.local", ".env.local", ".env"]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  } } catch {}
}
const arg = JSON.parse(Buffer.from(process.argv[2] || "", "base64").toString("utf8"));
const secret = process.env.CONTENT_AUTOMATION_SECRET;
const payload = Buffer.from(JSON.stringify({ email: "board-scripts@yarmalik.com", name: "Yar", role: "admin", iat: Math.floor(Date.now() / 1000) })).toString("base64url");
const cookie = `content_automation_session=${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
const endpoint = process.env.BOARD_ENDPOINT || "https://content.yarmalik.com/api/content-automation";

const board = await (await fetch(endpoint, { headers: { accept: "application/json", cookie } })).json();
const t = (board.ideas || []).find((x) => x.section === "topic" && x.community === "voho" &&
  String(x.title || "").trim().toLowerCase() === String(arg.title).trim().toLowerCase());
if (!t) { console.error(`no Voho topic titled "${arg.title}"`); process.exit(1); }
const L = arg.links || {};
const f = {
  made: { ...(t.made || {}), long: "done", short: "done" },
  links: { ...(t.links || {}), ...(L.youtube ? { long: L.youtube } : {}), ...(L.instagram ? { short: L.instagram } : {}) },
  note: `${t.note || ""} · Published ${new Date().toISOString().slice(0, 10)}: YouTube ${L.youtube || "-"} · Instagram ${L.instagram || "-"} · Facebook ${L.facebook || "-"} · LinkedIn ${L.linkedin || "-"}`,
  sourceUrl: L.youtube || t.sourceUrl || "",
};
const w = await fetch(endpoint, { method: "PATCH", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ ops: [{ t: "row", coll: "ideas", id: t.id, f }] }) });
if (!w.ok) { console.error(`write failed: ${w.status} ${await w.text()}`); process.exit(1); }
console.log(`marked "${t.title}" made and published`);
