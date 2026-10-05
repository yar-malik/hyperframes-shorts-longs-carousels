/**
 * What actually went out, and when — from Postiz onto the board.
 *
 *   node scripts/board/sync-published.mjs                       # look
 *   node scripts/board/sync-published.mjs --write               # write it
 *   node scripts/board/sync-published.mjs --from=2026-06-01 --write
 *
 * Postiz is the thing that presses publish, so its record is the only honest
 * one: a post the board thinks went out and Postiz never sent did not go out.
 * This reads it and writes one row per published post into `published`, which
 * the board draws as a calendar.
 *
 * Rows are keyed by the Postiz post id, so re-running updates rather than
 * doubles — a post that was still QUEUE last time and has since gone live
 * gets its link filled in on the next run rather than a second row.
 *
 * Nothing here ever publishes anything. It only reads Postiz and writes the
 * board's own record of what Postiz already did.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";

for (const f of [".env.production.local", ".env.local", ".env"]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  } } catch {}
}

const WRITE = process.argv.includes("--write");
const FROM = (process.argv.find((a) => a.startsWith("--from=")) || "").slice(7) || "2026-06-01";
const TO = (process.argv.find((a) => a.startsWith("--to=")) || "").slice(5) ||
  new Date(Date.now() + 864e5).toISOString().slice(0, 10);

const secret = process.env.CONTENT_AUTOMATION_SECRET || process.env.CA_SECRET || "";
if (!secret) { console.error("CONTENT_AUTOMATION_SECRET must be set."); process.exit(1); }
const payload = Buffer.from(JSON.stringify({
  email: "board-scripts@yarmalik.com", name: "Yar", role: "admin", iat: Math.floor(Date.now() / 1000),
})).toString("base64url");
const cookie = `content_automation_session=${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
const endpoint = process.env.BOARD_ENDPOINT || "https://content.yarmalik.com/api/content-automation";

/* ---------------- Postiz ---------------- */

const POSTIZ = ["-y", "postiz@2.0.16"];
function postiz(args) {
  const out = execFileSync("npx", [...POSTIZ, ...args], { encoding: "utf8", timeout: 900000, maxBuffer: 64 * 1024 * 1024 });
  return out.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

/* Postiz signs in per person, in ~/.postiz — so the machine that can read it
   is a laptop, and the machine that holds the board's secret is the VM. One
   of the two has to hand the other a file:
     laptop:  node scripts/board/sync-published.mjs --dump=posts.json
     vm:      node scripts/board/sync-published.mjs --posts=posts.json --write
   Run with neither and it does both itself, which works wherever both the
   Postiz session and CONTENT_AUTOMATION_SECRET happen to live. */
const DUMP = (process.argv.find((a) => a.startsWith("--dump=")) || "").slice(7);
const POSTS_FILE = (process.argv.find((a) => a.startsWith("--posts=")) || "").slice(8);

/* Socialit is the other thing that presses publish: the Voho accounts (YouTube
   for long videos, Instagram for shorts) post from there, not from Postiz. Its
   key sits in the laptop's .env, so like Postiz it is read on the laptop and
   travels to the box inside the dump. */
async function socialitPosts() {
  const key = process.env.SOCIALIT_API_KEY;
  if (!key) { console.log("  (no SOCIALIT_API_KEY here — Socialit skipped)"); return []; }
  const out = [];
  let cursor = "";
  for (let page = 0; page < 20; page++) {
    const r = await fetch(`https://api.socialit.com/v1/posts?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
      { headers: { authorization: `Bearer ${key}`, accept: "application/json" } });
    if (!r.ok) throw new Error(`Socialit read failed: ${r.status}`);
    const j = await r.json();
    out.push(...(j.posts || []));
    cursor = j.next_cursor || j.cursor || "";
    if (!cursor || !(j.posts || []).length) break;
  }
  /* The list leaves out each target's live link; only a single post carries
     it. So the ones that will count are read again one by one. */
  for (let i = 0; i < out.length; i++) {
    const p = out[i];
    if (p.status !== "published" || !p.published_at || String(p.published_at).slice(0, 10) < FROM) continue;
    if (Date.parse(p.published_at) < Date.parse(p.created_at) - 60e3) continue;
    const r = await fetch(`https://api.socialit.com/v1/posts/${p.id}`, { headers: { authorization: `Bearer ${key}`, accept: "application/json" } });
    if (r.ok) out[i] = (await r.json()).post || p;
  }
  /* The posting records carry the link a person can actually open: Facebook as /reel/<id>/ rather than a bare id.
     Instagram only ever comes back as the Graph media id (/p/<17 digits>/), which does not open, so its account's
     reels page stands in for it (2026-09-25; the real link needs vidIQ's reel lookup). */
  const sp = await fetch("https://api.socialit.com/v1/social-postings?limit=100", { headers: { authorization: `Bearer ${key}`, accept: "application/json" } });
  const byPost = new Map(((sp.ok ? await sp.json() : {}).social_postings || []).map((x) => [x.post_id + "|" + x.social_account_id, x.external_url]));
  const IG_HANDLE = { sa_4JorlI0pcGxUZCnDXVctRLaBzwv: "vohoaicalling", sa_4JorGV7srrKCuwjXjyH3OLuMRDd: "yar.claudecodex.mastery" };
  for (const p of out) for (const t of p.targets || []) {
    const better = byPost.get(p.id + "|" + t.account_id);
    if (better) t.external_url = better;
    // a bare Facebook id is the reel's own id
    t.external_url = String(t.external_url || "").replace(/^https:\/\/www\.facebook\.com\/(\d{12,})\/?$/, "https://www.facebook.com/reel/$1/");
    if (t.platform === "instagram" && /instagram\.com\/p\/\d{12,}/.test(String(t.external_url || "")) && IG_HANDLE[t.account_id])
      t.external_url = `https://www.instagram.com/${IG_HANDLE[t.account_id]}/reels/`;
  }
  return out;
}

let posts, sposts = [];
if (POSTS_FILE) {
  const j = JSON.parse(readFileSync(POSTS_FILE, "utf8"));
  posts = Array.isArray(j) ? j : j.postiz;        // an older dump is Postiz alone
  sposts = Array.isArray(j) ? [] : j.socialit || [];
  console.log(`Read ${posts.length} Postiz + ${sposts.length} Socialit posts from ${POSTS_FILE}`);
} else {
  console.log(`Reading Postiz ${FROM} → ${TO} …`);
  const raw = postiz(["posts:list", "--startDate", `${FROM}T00:00:00Z`, "--endDate", `${TO}T23:59:59Z`]);
  posts = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1));
  console.log("Reading Socialit …");
  sposts = await socialitPosts();
}
if (DUMP) {
  writeFileSync(DUMP, JSON.stringify({ postiz: posts, socialit: sposts }, null, 2));
  console.log(`Wrote ${posts.length} Postiz + ${sposts.length} Socialit posts to ${DUMP}. Copy it to the box and re-run with --posts=<file> --write.`);
  process.exit(0);
}

/* A post counts as published when Postiz says so. Everything else — drafts,
   queued, errors — is not a record of anything having gone out, and the
   calendar is a record of what went out. */
const live = posts.filter((p) => String(p.state).toUpperCase() === "PUBLISHED");

/* Published is not the same as live. A YouTube video Postiz uploaded unlisted
   is PUBLISHED as far as Postiz is concerned, but nobody can find it: it is a
   test, or a cut for someone to check. Those rows are still written, marked
   `unlisted`, and the board files them under Internal, out of the calendar
   and out of every number. The privacy setting is the one Postiz was told to
   post with; if a video is later made public in the studio, the channel feed
   below (public videos only) brings it back in as live. */
function isPublic(p) {
  let s = {};
  try { s = typeof p.settings === "string" ? JSON.parse(p.settings || "{}") : (p.settings || {}); } catch {}
  const plat = String((p.integration || {}).providerIdentifier || "");
  if (plat === "youtube") return String(s.type || "public").toLowerCase() === "public";
  if (plat.startsWith("tiktok")) return !s.privacy_level || s.privacy_level === "PUBLIC_TO_EVERYONE";
  return true;
}

/* The first line of the post is what a calendar chip can show. Hashtags and
   blank lines make a useless one, so it takes the first line with words in it. */
function plainOf(content) {
  /* Article-format posts (LinkedIn, an X long-form) carry HTML, which read as
     "<p>I was spending $300…" on the calendar. Tags out, entities back. */
  return String(content || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function chipTitle(content) {
  const plain = plainOf(content);
  const lines = plain.split("\n").map((l) => l.trim());
  const first = lines.find((l) => l && !/^#/.test(l)) || lines.find(Boolean) || "";
  return first.replace(/\s+/g, " ").slice(0, 120);
}
/* The post itself, for the calendar's popover: the words as they went out (up to 500 characters) and a picture of it. */
const postText = (content) => plainOf(content).split("\n").map((l) => l.trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 500);
const ytThumb = (url) => { const m = String(url || "").match(/[?&]v=([\w-]{11})|youtu\.be\/([\w-]{11})|shorts\/([\w-]{11})/); return m ? `https://i.ytimg.com/vi/${m[1] || m[2] || m[3]}/mqdefault.jpg` : ""; };
const imgOf = (p) => (Array.isArray(p.image) ? p.image : []).map((m) => String(m?.path || m || "")).find((u) => /\.(png|jpe?g|gif|webp)(\?|$)/i.test(u)) || "";

/* What the row is, for the icon: a video, a picture, or words. Postiz does not
   say, so it is read off the attachment it carried. */
function kindOf(p) {
  const media = Array.isArray(p.image) ? p.image : [];
  const any = media.map((m) => String(m?.path || m || "")).join(" ");
  if (/\.(mp4|mov|webm|m4v)/i.test(any)) return "video";
  if (/\.(png|jpe?g|gif|webp)/i.test(any)) return "image";
  /* Postiz's listing does not always carry the media back, so the post itself
     is the fallback: a YouTube or TikTok post is a video by definition, and a
     /reel/ link is one whatever platform it sits on. Without this every
     historical reel was filed as text. */
  const plat = String((p.integration || {}).providerIdentifier || "");
  if (plat === "youtube" || plat.startsWith("tiktok")) return "video";
  if (/\/reel(s)?\//.test(String(p.releaseURL || ""))) return "video";
  return "text";
}

let rows = live.map((p) => {
  const ig = p.integration || {};
  return {
    id: p.id,
    at: p.publishDate,
    platform: String(ig.providerIdentifier || "unknown"),
    account: String(ig.profile || ig.name || ""),
    title: chipTitle(p.content),
    url: p.releaseURL || "",
    kind: kindOf(p),
    text: postText(p.content),
    thumb: ytThumb(p.releaseURL) || imgOf(p),
    ...(isPublic(p) ? {} : { unlisted: true }),
  };
});

/* One row per account a Socialit post went out on. Instagram has no unlisted,
   so a published target there is live; a YouTube one is checked against the
   channel feed below, the same test Postiz uploads get. */
for (const p of sposts) {
  if (!p.published_at || String(p.published_at).slice(0, 10) < FROM) continue;
  /* Connecting an account imports its history: those rows were created after
     they were published, and they belong to whatever really sent them (mostly
     Postiz, already counted above). Only what Socialit itself published counts. */
  if (Date.parse(p.published_at) < Date.parse(p.created_at) - 60e3) continue;
  for (const t of p.targets || []) {
    if (t.status !== "published") continue;
    const video = (p.media || []).some((m) => m.type === "video") || t.platform === "youtube" || /\/reel(s)?\//.test(String(t.external_url || ""));
    rows.push({
      id: `si:${t.id}`, at: p.published_at, platform: t.platform === "meta" ? "facebook" : String(t.platform || "unknown"),   // Socialit calls a Facebook Page "meta"
      account: String(t.account_name || "").trim(), title: chipTitle(p.content), url: t.external_url || "",
      kind: video ? "video" : (p.media || []).length ? "image" : "text", via: "socialit",
      text: postText(p.content),
      thumb: ytThumb(t.external_url) || ((p.media || [])[0] || {}).thumbnail_url || (((p.media || [])[0] || {}).type === "image" ? p.media[0].public_url : "") || "",
    });
  }
}
rows.sort((a, b) => String(a.at).localeCompare(String(b.at)));

/* ---------------- YouTube, straight from the channel ----------------

   Postiz only knows what Postiz sent. A video uploaded in the YouTube studio
   — which is most of them — never appears in its listing, so the calendar was
   missing the channel's actual output. The upload feed is keyless, has no
   quota and needs no session, which is what makes this runnable anywhere.
   It carries the last 15 uploads per channel: enough to keep current, and the
   deeper history is backfilled once with --youtube=<file>. */

const CHANNELS = [
  { id: "UChM8m2oQQrBaQi6KcpCmGHg", handle: "@yarmalikvibe" },
  { id: "UCY5dML2xeMQA0ynWZFTChKQ", handle: "@teamyarmalik" },
  { id: "UCppKjCMekLofvk-VgsqJgrQ", handle: "@voho-ai" },        // Voho, posted through Socialit
];
/* What each channel's feed covered: it lists public uploads only, the latest
   15, so "not in a feed that loaded and reaches back past it" means not public. */
const FEED = {};
const UA = { "user-agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const unesc = (v) => String(v).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

async function youtubeRows() {
  const out = [];
  for (const c of CHANNELS) {
    let xml = "", ok = false;
    try {
      const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${c.id}`, { headers: UA });
      xml = await r.text();
      ok = r.ok && xml.includes("<feed");
    } catch (e) { console.log(`  ! ${c.handle}: ${e.message}`); continue; }
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1]);
    const dates = entries.map((e) => (e.match(/<published>([^<]+)/) || [])[1]).filter(Boolean).sort();
    FEED[c.handle] = { ok, full: entries.length >= 15, oldest: dates[0] || null };
    for (const e of entries) {
      const id = (e.match(/<yt:videoId>([^<]+)/) || [])[1];
      const title = unesc((e.match(/<title>([^<]*)/) || [])[1] || "");
      const at = (e.match(/<published>([^<]+)/) || [])[1];
      const desc = unesc((e.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1] || "");
      if (!id || !at) continue;
      out.push({
        id: `yt:${id}`, at, platform: "youtube", account: c.handle,
        title: title.slice(0, 120), url: `https://www.youtube.com/watch?v=${id}`, kind: "video",
        text: [title, desc.trim()].filter(Boolean).join("\n\n").slice(0, 500), thumb: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      });
    }
    console.log(`  ${c.handle.padEnd(16)} ${entries.length} in feed`);
  }
  return out;
}

/* A deeper YouTube history, dumped once from vidIQ (which sees further back
   than the feed does) and merged the same way. */
const YT_FILE = (process.argv.find((a) => a.startsWith("--youtube=")) || "").slice(10);

console.log("\nYouTube channels:");
const ytLive = await youtubeRows();
const ytExtra = YT_FILE ? JSON.parse(readFileSync(YT_FILE, "utf8")).map((v) => ({
  id: `yt:${v.videoId}`, at: v.publishedAt, platform: "youtube", account: v.account || "@yarmalikvibe",
  title: String(v.title || "").slice(0, 120), url: `https://www.youtube.com/watch?v=${v.videoId}`, kind: "video",
  text: String(v.title || "").slice(0, 500), thumb: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
})) : [];

/* One row per video. A video Postiz posted and the feed also lists is the
   same video: the Postiz row is dropped in favour of the YouTube one, which
   carries the real title rather than the description's first line. */
const ytById = new Map();
for (const y of [...ytExtra, ...ytLive]) ytById.set(y.id, y);
const ytIds = new Set([...ytById.keys()].map((k) => k.slice(3)));
const superseded = [];
const deduped = rows.filter((x) => {
  if (x.platform !== "youtube") return true;
  const m = String(x.url || "").match(/[?&]v=([\w-]{11})|youtu\.be\/([\w-]{11})/);
  const vid = m && (m[1] || m[2]);
  if (vid && ytIds.has(vid)) { superseded.push(x.id); return false; }
  return true;
});
rows = [...deduped, ...ytById.values()].sort((a, b) => String(a.at).localeCompare(String(b.at)));

/* A Socialit YouTube upload the Voho feed does not list is not public — as
   long as the feed loaded and reaches back to it (a short feed reaches back
   to the channel's start). Those go to Internal, like unlisted Postiz uploads. */
const voho = FEED["@voho-ai"];
for (const x of rows) {
  if (x.via !== "socialit" || x.platform !== "youtube" || !voho || !voho.ok) continue;
  if (!voho.full || !voho.oldest || String(x.at) >= voho.oldest) x.unlisted = true;
}

/* ---------------- the board ---------------- */

const r = await fetch(endpoint, { headers: { accept: "application/json", cookie } });
if (!r.ok) throw new Error(`Board read failed: ${r.status}`);
const board = await r.json();
const have = new Map((board.published || []).map((x) => [x.id, x]));

const add = rows.filter((x) => !have.has(x.id));
/* Compared field by field: the board hands rows back with their keys in its
   own order, and a plain stringify called all of them changed every run. */
const sameRow = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]));
const change = rows.filter((x) => {
  const was = have.get(x.id);
  return was && !sameRow(was, x);
});
/* A Postiz row the feed has since superseded — typically an unlisted upload
   that was later made public — comes off, or the video would be on the board
   twice: once as the old test upload, once as the live one. */
const drop = superseded.filter((id) => have.has(id));

const byPlat = {};
for (const x of rows) byPlat[x.platform] = (byPlat[x.platform] || 0) + 1;
console.log(`\n${live.length} published in Postiz · board already has ${have.size}`);
for (const [k, n] of Object.entries(byPlat).sort()) console.log(`  ${String(n).padStart(3)}  ${k}`);
const nUnl = rows.filter((x) => x.unlisted).length;
console.log(`  ${String(nUnl).padStart(3)}  of those unlisted or private → Internal, not on the calendar`);
console.log(`\n${add.length} new, ${change.length} changed, ${drop.length} superseded${WRITE ? "" : " — dry run"}`);
for (const x of change.filter((c) => c.unlisted && !have.get(c.id).unlisted)) console.log(`  ~ ${x.at.slice(0, 16)}  now unlisted: ${x.title.slice(0, 54)}`);
for (const id of drop) console.log(`  - ${id}  superseded by the channel feed`);
for (const x of add.slice(-8)) console.log(`  + ${x.at.slice(0, 16)}  ${x.platform.padEnd(20)} ${x.title.slice(0, 54)}`);
if (add.length > 8) console.log(`  … and ${add.length - 8} more`);

if (!WRITE) { console.log("\nNothing written. Add --write."); process.exit(0); }
if (!add.length && !change.length && !drop.length) { console.log("\nNothing to do."); process.exit(0); }

const ops = [...add, ...change].map((row) => ({ t: "add", coll: "published", row }))
  .concat(drop.map((id) => ({ t: "del", coll: "published", id })));
for (let i = 0; i < ops.length; i += 40) {
  const slice = ops.slice(i, i + 40);
  const w = await fetch(endpoint, {
    method: "PATCH", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ ops: slice }),
  });
  if (!w.ok) throw new Error(`Write failed at ${i}: ${w.status} ${await w.text()}`);
  console.log(`  wrote ${Math.min(i + 40, ops.length)}/${ops.length}`);
}
console.log("\nDone.");
