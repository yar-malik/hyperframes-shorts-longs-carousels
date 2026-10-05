/**
 * Puts the drafts in playbook/drafts into the Repurpose lanes on the board.
 *
 *   node scripts/load-repurpose-drafts.mjs           # show what it would do
 *   node scripts/load-repurpose-drafts.mjs --write   # do it
 *
 * A repurposed post is not a special kind of record. It is an ordinary idea
 * row in an ordinary lane, and `videoId` is the only thing that makes it
 * repurposed — that is the thread back to the video's own page and to the
 * marks in the board's Cut down column. So this writes exactly the row
 * `repCreate()` writes when somebody presses "+ Write one", with the words
 * already in it.
 *
 * Idempotent on (videoId, section, platform, first line of the post), so a
 * second run adds nothing and a re-run after a partial write finishes the job.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

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

/* The four lanes, copied from REPURPOSE in app.js. A row is filed by where
   it is going, never by where it came from. */
const LANES = {
  "LinkedIn post":       { section: "written",  platform: "linkedin" },
  "LinkedIn carousel":   { section: "carousel", platform: "linkedin" },
  "Instagram carousel":  { section: "carousel", platform: "instagram" },
  "X / Twitter":         { section: "written",  platform: "twitter" },
};

/* Which video each draft file was cut from. */
const VIDEOS = {
  "claude-memory-2.md":      "v1a04d9ab92304",
  "free-claude-code.md":     "v15",
  "fable-5-design-skill.md": "v07",
};

/* Pull the fenced blocks out of a draft, tagged with the lane whose heading
   they sit under, and — for the tweets, where there are three under one
   heading — the label above each block, so three rows in the Tweets lane are
   telling apart without opening them. */
function cutsFrom(md) {
  const out = [];
  let lane = null, label = "";
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^##\s+(.+?)\s*$/);
    if (h) { lane = LANES[h[1]] ? h[1] : null; label = ""; continue; }
    const lab = lines[i].match(/^\*\*\d+\s+—\s+(.+?)\*\*\s*$/);
    /* The label becomes part of a row title, so trim it to the angle itself:
       drop any parenthetical, then keep only up to the first comma. */
    if (lab) {
      label = lab[1].replace(/\s*\(.*\)\s*$/, "").split(",")[0].trim();
      continue;
    }
    if (lane && lines[i].trim() === "```") {
      const body = [];
      for (i++; i < lines.length && lines[i].trim() !== "```"; i++) body.push(lines[i]);
      const text = body.join("\n").trim();
      if (text) out.push({ lane, label, text });
      label = "";
    }
  }
  return out;
}

const j = async (p, init) => {
  const r = await fetch(`${U}/rest/v1/${p}`, { headers: H, ...init });
  const t = await r.text();
  if (!r.ok) { console.error(`! ${r.status} on ${p}: ${t.slice(0, 300)}`); process.exit(1); }
  return t ? JSON.parse(t) : null;
};

const [board] = await j("content_automation_board?id=eq.default&select=rev,state");
const state = board.state;
const ideas = Array.isArray(state.ideas) ? state.ideas : [];
/* From the videos table, not the document — the ideas this loads are filed
   against a video, and a lookup into an empty array files them nowhere. */
const videos = (await j("content_automation_videos?select=id,doc")).map((r) => ({ ...r.doc, id: r.id }));
console.log(`board rev ${board.rev} — ${ideas.length} ideas, ${videos.length} videos\n`);

const key = (r) => [r.videoId, r.section, r.platform, String(r.post || "").split("\n")[0].trim()].join("|");
const seen = new Set(ideas.filter((x) => x.videoId).map(key));

const DRAFTS = path.join("docs", "playbook", "drafts");
const add = [];
/* ._ files are macOS AppleDouble sidecars, not drafts. */
for (const file of readdirSync(DRAFTS).filter((f) => f.endsWith(".md") && !f.startsWith("._"))) {
  const videoId = VIDEOS[file];
  if (!videoId) { console.log(`  ${file}: no video mapped, skipped`); continue; }
  const v = videos.find((x) => x.id === videoId);
  if (!v) { console.error(`! ${file}: video ${videoId} is not on the board`); process.exit(1); }
  const cuts = cutsFrom(readFileSync(path.join(DRAFTS, file), "utf8"));
  console.log(`${file}  ->  ${v.title.slice(0, 54)}  (${cuts.length} cuts)`);
  for (const c of cuts) {
    const lane = LANES[c.lane];
    const row = {
      id: "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      section: lane.section,
      platform: lane.platform,
      /* repCreate titles a row with the video. Three tweets off one video
         would then be three identical rows in the same lane, so where the
         draft labelled the angle, that goes on the end. */
      title: (String(v.title || "").trim() || "Untitled") + (c.label ? ` — ${c.label}` : ""),
      owner: "",
      status: "new",
      note: "",
      post: c.text,
      videoId: v.id,
      addedAt: new Date().toISOString(),
    };
    if (seen.has(key(row))) { console.log(`   = already there: ${c.lane}${c.label ? " / " + c.label : ""}`); continue; }
    seen.add(key(row));
    add.push(row);
    console.log(`   + ${c.lane.padEnd(19)}${(c.label || "").padEnd(16)} ${String(c.text.length).padStart(5)} chars`);
  }
}

console.log(`\n${add.length} row(s) to add`);
if (!add.length) { console.log("Nothing to do."); process.exit(0); }
if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

const now = new Date().toISOString();
const next = { ...state, ideas: [...ideas, ...add], rev: board.rev + 1, savedBy: "repurpose", savedAt: now };
/* Only if nobody saved in between. */
const done = await j(`content_automation_board?id=eq.default&rev=eq.${board.rev}`, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ rev: board.rev + 1, state: next, saved_by: "repurpose", saved_at: now }),
});
if (!done?.length) {
  console.error(`! the board moved on from rev ${board.rev} while this ran — nothing written. Run it again.`);
  process.exit(1);
}
console.log(`\ndone — rev ${board.rev} -> ${board.rev + 1}`);
