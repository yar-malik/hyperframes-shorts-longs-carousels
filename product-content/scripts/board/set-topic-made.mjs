/**
 * Marks one of a topic's five things as made, and puts the link on it.
 *
 *   node scripts/board/set-topic-made.mjs --topic="<title or id>" \
 *        --what=short --state=done --url=https://youtu.be/xxxx [--video=134]
 *
 * This is what a publish run calls once the thing is live, so the Topics page
 * says so without anybody re-typing it. `--video` also writes the link onto
 * that long video's own `short` field, which is where the video board keeps
 * the vertical cut.
 *
 * Supabase is reachable only from voho-vm, so this runs there.
 */
import { readFileSync } from "node:fs";
for (const f of [".env.production.local", ".env.local", ".env"]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  } } catch {}
}
const U = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !KEY) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."); process.exit(1); }
const H = { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" };
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const TOPIC = arg("topic", ""), WHAT = arg("what", "short"), STATE = arg("state", "done");
const URL_ = arg("url", ""), VIDEO = arg("video", "");
if (!TOPIC) { console.error("--topic is required"); process.exit(1); }

const board = await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.default&select=rev,state`, { headers: H })).json();
const rev = board[0].rev, state = board[0].state || {};
const ideas = Array.isArray(state.ideas) ? state.ideas : [];
const key = TOPIC.trim().toLowerCase();
const t = ideas.find((x) => String(x.section || "") === "topic" &&
  (String(x.id) === TOPIC || String(x.title || "").trim().toLowerCase() === key ||
   String(x.title || "").toLowerCase().includes(key)));
if (!t) { console.error(`no topic matching "${TOPIC}"`); process.exit(1); }

t.made = t.made && typeof t.made === "object" ? t.made : {};
if (STATE) t.made[WHAT] = STATE; else delete t.made[WHAT];
if (URL_) { t.links = t.links && typeof t.links === "object" ? t.links : {}; t.links[WHAT] = URL_; }
console.log(`${t.title}\n  ${WHAT} -> ${STATE || "not started"}${URL_ ? "  " + URL_ : ""}`);

const now = new Date().toISOString();
state.rev = rev + 1; state.savedBy = "publish"; state.savedAt = now;
const res = await fetch(`${U}/rest/v1/content_automation_board?id=eq.default&rev=eq.${rev}`, {
  method: "PATCH", headers: { ...H, prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state, saved_by: "publish", saved_at: now }),
});
if (!res.ok) { console.error(`board write failed: ${res.status} ${await res.text()}`); process.exit(1); }
if (!(await res.json()).length) { console.error("somebody saved the board while this ran — run it again"); process.exit(1); }
console.log("  topic written");

/* The long video keeps its own copy: the video board's Shorts column is
   where somebody working that row looks for the vertical cut. */
if (VIDEO && URL_) {
  const rows = await (await fetch(`${U}/rest/v1/content_automation_videos?select=id,rev,doc`, { headers: H })).json();
  const row = rows.find((r) => String(r.doc?.no) === String(VIDEO));
  if (!row) { console.error(`  no video numbered ${VIDEO}`); process.exit(0); }
  row.doc.short = URL_;
  const vr = await fetch(`${U}/rest/v1/content_automation_videos?id=eq.${row.id}&rev=eq.${row.rev}`, {
    method: "PATCH", headers: { ...H, prefer: "return=representation" },
    body: JSON.stringify({ rev: row.rev + 1, doc: row.doc, updated_by: "publish", updated_at: now }),
  });
  console.log(vr.ok ? `  video ${VIDEO} short link written` : `  video write failed: ${vr.status}`);
}
