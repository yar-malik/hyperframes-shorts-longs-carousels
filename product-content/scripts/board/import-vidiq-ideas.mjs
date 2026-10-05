/**
 * Fills Content Ideas from what vidIQ found.
 *
 *   node scripts/board/import-vidiq-ideas.mjs --from=a.json,b.json            # judge, show
 *   node scripts/board/import-vidiq-ideas.mjs --from=a.json --write           # and add them
 *
 * The files are the ones scan-competitors.mjs reads — vidIQ's own outlier
 * output, or a plain list of {id, title, channel, views, publishedAt,
 * breakout, duration, subs}. Research is done from Claude with vidIQ's MCP
 * tools, because that server is OAuth; this is how the result lands on the
 * board.
 *
 * The bar is lower than the competitor scan's, and deliberately: Recording
 * Hooks is a commitment to make a video, an idea is a suggestion somebody
 * scrolls past. So it asks TypeSafe only whether the idea belongs on this
 * channel at all, and whether we have already made that exact video. It
 * does not ask how strong the idea is — that is the judgement being left
 * to the person reading the list, which is the point of the list.
 *
 * Each row keeps vidIQ's numbers: views, views per hour, the breakout
 * multiple, the channel and its size. They are what makes the page worth
 * looking at rather than a wall of titles, and they are also the evidence
 * for why the row is there at all.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { TypeSafeClient, noul } from "@typesafe-ai/sdk";

for (const f of [".env.production.local", ".env.local", ".env"]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  } } catch {}
}

const WRITE = process.argv.includes("--write");
const FROM = (process.argv.find((a) => a.startsWith("--from=")) || "").slice(7).split(",").filter(Boolean);
const MAX = Number((process.argv.find((a) => a.startsWith("--max=")) || "").slice(6)) || 200;
const MIN_FIT = 0.5;       // the competitor scan's floor, measured against the board's own titles
const MAX_COVERED = 0.6;   // looser than the scan's 0.5: an idea is not a commitment
if (!FROM.length) { console.error("--from=<file.json>[,<file.json>] is required."); process.exit(1); }
if (!process.env.TYPESAFE_API_KEY) { console.error("TYPESAFE_API_KEY must be set."); process.exit(1); }

const secret = process.env.CONTENT_AUTOMATION_SECRET || process.env.CA_SECRET || "";
if (!secret) { console.error("CONTENT_AUTOMATION_SECRET must be set."); process.exit(1); }
const payload = Buffer.from(JSON.stringify({ email: "board-scripts@yarmalik.com", name: "Yar", role: "admin", iat: Math.floor(Date.now() / 1000) })).toString("base64url");
const cookie = `content_automation_session=${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
const endpoint = process.env.BOARD_ENDPOINT || "https://content.yarmalik.com/api/content-automation";

const r = await fetch(endpoint, { headers: { accept: "application/json", cookie } });
if (!r.ok) throw new Error(`Board read failed: ${r.status}`);
const board = await r.json();
const ideas = board.ideas || [], videos = board.videos || [];
const longTitles = videos.filter((v) => (v.kind || "long") === "long").map((v) => String(v.title || "").trim()).filter(Boolean);

/* Every YouTube id the board already points at, from a video row or an idea,
   so the same video is never suggested twice. */
const known = new Set();
for (const s of [...videos.flatMap((v) => [v.ref, v.rec, v.site, v.title]), ...ideas.flatMap((x) => [x.sourceUrl, x.videoId])]) {
  for (const m of String(s || "").matchAll(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/g)) known.add(m[1]);
  if (/^[\w-]{11}$/.test(String(s || ""))) known.add(String(s));
}

function fromFile(path) {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const list = Array.isArray(raw) ? raw : raw.videos || raw.candidates || [];
  const source = raw.source || "vidIQ";
  return list.map((v) => {
    const published = v.publishedAt ?? v.videoPublishedAt;
    const t = typeof published === "number" ? published * (published < 1e12 ? 1000 : 1) : new Date(published).getTime();
    return {
      id: v.id || v.videoId, title: v.title || v.videoTitle, channel: v.channel || v.channelTitle || "",
      views: Number(v.views ?? v.viewCount ?? 0), published: new Date(t).toISOString(),
      breakout: Number(v.breakout ?? v.breakoutScore ?? 0) || null,
      duration: Number(v.duration ?? v.videoDuration ?? 0) || null,
      subs: Number(v.subs ?? v.subscriberCount ?? 0) || null,
      source,
    };
  }).filter((v) => v.id && v.title && !Number.isNaN(new Date(v.published).getTime()));
}

const CHANNEL_IS =
  "A YouTube channel about the new AI models and tools as they land — Claude, Codex, Claude Code, " +
  "GPT-6 Astra, DeepSeek, Hermes, Grok, Gemini, Kimi — and what you can do with them: use them free " +
  "or cheaper, build and automate with them, make websites, designs, motion graphics and videos, " +
  "compare them, and make money with them. Practical and hands-on; explains a launch through what it " +
  "lets you do. The list in videos_on_the_board is what it actually makes.";

const ts = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });
async function judge(c) {
  const { answers } = await ts.systemOne({
    state: { channel_is: CHANNEL_IS, candidate: { title: c.title, by: c.channel }, videos_on_the_board: longTitles.slice(-60) },
    questions: {
      fits: noul("Would the candidate sit naturally among videos_on_the_board, as one more video this channel would make?"),
      covered: noul("Is there a video on the board that is the same video as the candidate — the same specific tool or feature AND the same claim about it — such that making the candidate would be making that video again?"),
    },
  });
  return { fit: answers.fits.noul, covered: answers.covered.noul };
}

/* Gather, de-duplicate across files, drop what the board already has. */
const seen = new Set();
const candidates = [];
for (const path of FROM) {
  let items;
  try { items = fromFile(path); } catch (e) { console.log(`  ! ${path}: ${e.message}`); continue; }
  let fresh = 0;
  for (const v of items) {
    if (known.has(v.id) || seen.has(v.id)) continue;
    seen.add(v.id); fresh++;
    candidates.push(v);
  }
  console.log(`  ${path}: ${items.length} videos, ${fresh} new`);
}
console.log(`\n${candidates.length} to judge · ${WRITE ? "WRITE" : "dry run"}\n`);

const uid = () => "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const kept = [];
for (const c of candidates) {
  let verdict;
  try { verdict = await judge(c); } catch (e) { console.log(`  ? ${c.title.slice(0, 60)} — ${e.message}`); continue; }
  const why = verdict.fit < MIN_FIT ? `does not fit (${Math.round(verdict.fit * 100)}%)`
    : verdict.covered > MAX_COVERED ? `already covered (${Math.round(verdict.covered * 100)}%)` : "";
  if (why) { console.log(`  – ${c.title.slice(0, 62).padEnd(64)} ${why}`); continue; }
  console.log(`  ✓ ${c.title.slice(0, 62).padEnd(64)} fit ${Math.round(verdict.fit * 100)}%`);
  kept.push({ ...c, fit: verdict.fit });
}

/* Best first, by how far the video beat its own channel — that is the part
   vidIQ knows and a view count does not: 100k from a 400k channel is a
   Tuesday, 100k from a 20k channel is the idea working. */
kept.sort((a, b) => (b.breakout || 0) * b.fit - (a.breakout || 0) * a.fit);
const chosen = kept.slice(0, MAX);
console.log(`\n${kept.length} worth keeping · adding ${chosen.length}\n`);

if (!WRITE) { console.log("Dry run — nothing written. Add --write."); process.exit(0); }

const now = new Date().toISOString();
const rows = chosen.map((c) => {
  const hours = Math.max(1, (Date.now() - new Date(c.published).getTime()) / 36e5);
  return {
    id: uid(), section: "ideas", platform: "youtube", status: "new", owner: "", note: "",
    title: c.title, source: c.channel || "YouTube", sourceUrl: `https://www.youtube.com/watch?v=${c.id}`,
    videoId: c.id, addedAt: now,
    /* vidIQ's numbers, kept on the row: the list is worth reading because of
       them, and they are the reason the row is here. */
    stats: {
      views: c.views, vph: Math.round((c.views / hours) * 10) / 10, breakout: c.breakout,
      subs: c.subs, publishedAt: c.published, duration: c.duration,
      fit: Math.round(c.fit * 100), source: c.source, at: now,
    },
  };
});
for (let i = 0; i < rows.length; i += 25) {
  const slice = rows.slice(i, i + 25);
  const w = await fetch(endpoint, {
    method: "PATCH", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ ops: slice.map((row) => ({ t: "add", coll: "ideas", row })) }),
  });
  if (!w.ok) throw new Error(`Add failed at ${i}: ${w.status} ${await w.text()}`);
  console.log(`  added ${Math.min(i + 25, rows.length)}/${rows.length}`);
}
mkdirSync(".board-backups", { recursive: true });
writeFileSync(`.board-backups/${now.replace(/[:.]/g, "-")}-vidiq-ideas.json`, JSON.stringify(rows, null, 2));
console.log("\nDone.");
