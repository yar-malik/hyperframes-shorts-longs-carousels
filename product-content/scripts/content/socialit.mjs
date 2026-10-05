/**
 * Socialit: posts to every account it can reach (Voho YouTube/Instagram/Facebook, the CCM Instagram, the CCM and
 * AVC Facebook Pages). Postiz is capped, so Socialit goes first wherever it can; LinkedIn and X stay on Postiz.
 *
 *   node scripts/content/socialit.mjs accounts          # the connected accounts and their ids
 *   node scripts/content/socialit.mjs get <path>        # any read-only GET, e.g. get posts
 *
 * The key is SOCIALIT_API_KEY in the repo's .env (gitignored). It is read here
 * and sent only to api.socialit.com; it is never printed, logged or echoed back.
 * Docs: https://socialit.com/docs/api-reference/
 */
import { readFileSync } from "node:fs";

for (const f of [".env.local", ".env"]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  } } catch {}
}
const KEY = process.env.SOCIALIT_API_KEY || "";
if (!KEY) { console.error("SOCIALIT_API_KEY is not set in .env"); process.exit(1); }
if (!/^sk_(live|test)_/.test(KEY)) console.warn("! SOCIALIT_API_KEY does not start with sk_live_ / sk_test_ — check it was pasted whole");

const BASE = "https://api.socialit.com/v1";
export async function api(method, path, body) {
  const r = await fetch(`${BASE}/${path.replace(/^\//, "")}`, {
    method,
    headers: { authorization: `Bearer ${KEY}`, accept: "application/json", ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${text.slice(0, 400)}`);
  return json ?? text;
}
/* Accounts by name (scripts/content/channels.mjs). Posting only ever targets one of these, so a Voho video cannot land
   on the CCM Instagram, which is connected to the same workspace. */
import { SOCIALIT as ACCOUNTS } from "./channels.mjs";

/*   node socialit.mjs post --to voho-youtube --file video.mp4 --text description.txt --title "…" [--privacy public|unlisted|private]
     node socialit.mjs post --to voho-instagram --file reel.mp4 --text caption.txt
     node socialit.mjs post --to voho-facebook --file video.mp4 --text post.txt
     node socialit.mjs post --to ccm-instagram --file ig-01.jpg --file ig-02.jpg … --text caption.txt   (a carousel)
     … --draft    saves it as a draft in Socialit instead of publishing (prints DRAFT <post id>)
   Uploads the file(s), publishes now, then waits for the platform and prints the live link.
   Per-platform settings live one level down, as Socialit's own app sends them (found in its app bundle and
   confirmed against the API, 2026-09-25): config_by_platform.youtube.youtube.{title, privacyStatus, madeForKids, tags}. */
async function post() {
  const opt = (k) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : undefined; };
  const files = process.argv.flatMap((a, i) => (a === "--file" ? [process.argv[i + 1]] : []));
  const draft = process.argv.includes("--draft");
  const acct = ACCOUNTS[opt("to")];
  if (!acct) throw new Error(`--to must be one of: ${Object.keys(ACCOUNTS).join(", ")}`);
  const textFile = opt("text");
  if (!files.length || !textFile) throw new Error("--file and --text are required");
  const content = readFileSync(textFile, "utf8").trim();
  const config = {};
  if (acct.platform === "youtube") {
    const title = opt("title");
    if (!title) throw new Error("YouTube needs --title");
    if (title.length > 100) throw new Error("YouTube titles are 100 characters at most");
    const privacyStatus = opt("privacy") || "public";
    if (!["public", "unlisted", "private"].includes(privacyStatus)) throw new Error("--privacy must be public, unlisted or private");
    config.youtube = { youtube: { title, privacyStatus, madeForKids: false } };
  }
  if (acct.platform === "instagram") config.instagram = { instagram: { shareToFeed: true } };

  const { basename } = await import("node:path");
  const TYPES = { mp4: "video/mp4", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
  const mediaIds = [];
  for (const file of files) {
    const buf = readFileSync(file);
    console.log(`uploading ${basename(file)} (${(buf.length / 1e6).toFixed(1)} MB) …`);
    const form = new FormData();
    form.append("file", new Blob([buf], { type: TYPES[file.split(".").pop().toLowerCase()] ?? "application/octet-stream" }), basename(file));
    const up = await fetch(`${BASE}/media/upload`, { method: "POST", headers: { authorization: `Bearer ${KEY}` }, body: form });
    const upText = await up.text();
    if (!up.ok) throw new Error(`upload → ${up.status} ${upText.slice(0, 400)}`);
    const media = JSON.parse(upText).media;
    console.log(`  media ${media.id}`);
    mediaIds.push(media.id);
  }

  const created = (await api("POST", "posts", {
    content, target_account_ids: [acct.id], media_ids: mediaIds, ...(draft ? {} : { publish: true }), strict: true, config_by_platform: config,
  })).post;
  console.log(`  post ${created.id} · ${created.status}`);
  if (draft) { console.log(`\nDRAFT ${created.id}`); return; }

  for (let i = 0; i < 90; i++) {                       // up to ~15 minutes: a long YouTube upload takes a while
    const p = (await api("GET", `posts/${created.id}`)).post;
    const t = (p.targets || [])[0] || {};
    if (p.status === "published" || t.status === "published") {
      console.log(`\nPUBLISHED ${await liveLink(created.id, t.external_url, acct)}`);
      if (!process.argv.includes("--no-sync")) await syncPublished();
      return;
    }
    if (p.status === "failed" || t.status === "failed") { console.log(`\nFAILED ${p.error || t.error || ""}`); process.exit(1); }
    await new Promise((r) => setTimeout(r, 10000));
  }
  console.log(`\nstill publishing — check: node scripts/content/socialit.mjs get posts/${created.id}`);
}

/* Everything posted shows on the board's Published calendar straight away (Yar, 2026-09-30: four posts sent with this
   script on the 29th never reached it, because only publish.mjs ran the sync). A failed sync never fails the post:
   it says so, and the next sync picks the post up. --no-sync skips it, for callers that sync once at the end. */
async function syncPublished() {
  const { execFileSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  try {
    console.log("updating the Published calendar …");
    const out = execFileSync("node", [fileURLToPath(new URL("../voho/board.mjs", import.meta.url)), "sync"], { encoding: "utf8", timeout: 900e3 });
    console.log(out.split("\n").filter((l) => /new,|wrote|Nothing/.test(l)).join("\n") || "  synced");
  } catch (e) {
    console.log(`  the calendar sync failed (${String(e.message).split("\n")[0]}); run: node scripts/voho/board.mjs sync`);
  }
}

/* The link a person can open. A post's own record gives Facebook as a bare id (facebook.com/<id>); the posting record
   has the real reel link. Instagram only ever comes back as the Graph media id (instagram.com/p/<17-digit id>/),
   which does not open, and no id→shortcode conversion exists for those — so the account's reels page stands in until
   the real link is looked up (vidIQ vidiq_ig_profile_reels, by caption). 2026-09-25. */
async function liveLink(postId, fallback, acct) {
  try {
    const sp = (await api("GET", "social-postings?limit=50")).social_postings || [];
    const hit = sp.find((x) => x.post_id === postId && x.social_account_id === acct.id);
    const url = String(hit?.external_url || fallback || "").replace(/^https:\/\/www\.facebook\.com\/(\d{12,})\/?$/, "https://www.facebook.com/reel/$1/");   // a bare id is the reel's id
    if (acct.platform === "instagram" && /instagram\.com\/p\/\d{12,}/.test(url)) return `https://www.instagram.com/${acct.handle}/reels/`;
    return url;
  } catch { return fallback || ""; }
}

const list = (x) => (Array.isArray(x) ? x : [x?.social_accounts, x?.posts, x?.data, x?.items].find(Array.isArray) ?? null);

const [cmd, arg] = process.argv.slice(2);
if (cmd === "accounts") {
  const res = await api("GET", "social-accounts");
  const rows = list(res);
  if (!rows) { console.log(JSON.stringify(res, null, 2)); process.exit(0); }
  console.log(`${rows.length} connected account(s)\n`);
  for (const a of rows) {
    const pick = (...ks) => ks.map((k) => a[k]).find((v) => v != null && v !== "");
    console.log(`  ${String(pick("id")).padEnd(24)} ${String(pick("platform", "provider", "network", "type")).padEnd(12)} ${pick("name", "display_name", "username", "handle") ?? ""}`);
  }
  if (process.argv.includes("--raw")) console.log("\n" + JSON.stringify(rows[0], null, 2));
} else if (cmd === "get" && arg) {
  console.log(JSON.stringify(await api("GET", arg), null, 2));
} else if (cmd === "post") {
  await post();
} else if (cmd === "call" && arg) {
  // node socialit.mjs call "POST posts" '{"content":…}'   — for probing drafts. Anything that would put a post
  // live (publish, scheduled_at, queue_id) is refused here; real posting goes through the `post` command.
  const [method, path] = arg.split(" ");
  const body = process.argv[4] ? JSON.parse(process.argv[4]) : undefined;
  if (body && (body.publish || body.scheduled_at || body.queue_id)) { console.error("call refuses to publish or schedule; use post"); process.exit(1); }
  try { console.log(JSON.stringify(await api(method, path, body), null, 2)); }
  catch (e) { console.log(e.message); process.exit(1); }
} else {
  console.log("usage: node scripts/content/socialit.mjs accounts [--raw] | get <path>");
  process.exit(1);
}
