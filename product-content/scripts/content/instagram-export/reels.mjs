// Top reels of a profile → info (via the signed-in tab), mp4, whisper transcript.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
const [,, handle, listFile, outDir, topN] = process.argv;
const TAB = `https://www.instagram.com/${handle}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const js = (code) => { for (let k = 0; k < 4; k++) { try { return execFileSync("osascript", ["scripts/content/skool-export/tab-js.applescript", TAB, code], { encoding: "utf8", maxBuffer: 1 << 24, stdio: ["ignore", "pipe", "pipe"] }).trim(); } catch { execFileSync("sleep", ["1.5"]); } } return ""; };
const nav = (url) => execFileSync("osascript", ["scripts/content/skool-export/tab-nav.applescript", TAB, url], { encoding: "utf8" }).trim();
const INFO = fs.readFileSync("scripts/content/instagram-export/media-info.js", "utf8");
const num = (s) => { s = String(s).replace(/,/g, "").toUpperCase(); return s.endsWith("M") ? parseFloat(s) * 1e6 : s.endsWith("K") ? parseFloat(s) * 1e3 : parseFloat(s) || 0; };
const list = JSON.parse(fs.readFileSync(listFile, "utf8")).map(([h, v]) => ({ href: h, views: v, n: num(v) })).sort((a, b) => b.n - a.n).slice(0, Number(topN) || 8);
fs.mkdirSync(outDir, { recursive: true });
const out = [];
for (const r of list) {
  const code = r.href.split("/reel/")[1].replace("/", "");
  nav(`https://www.instagram.com${r.href}`); await sleep(5000);
  js(INFO);
  let info = null;
  for (let k = 0; k < 20; k++) { const v = js("window.__ig"); if (v && v !== "pending") { try { info = JSON.parse(v); } catch { info = { err: v }; } break; } await sleep(700); }
  if (!info || !info.url) { console.log("  no info for", code, info && info.err); continue; }
  const mp4 = `${outDir}/${code}.mp4`;
  if (!fs.existsSync(mp4)) execFileSync("curl", ["-sL", "-o", mp4, info.url]);
  const wav = `${outDir}/${code}.wav`;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp4, "-ar", "16000", "-ac", "1", wav]);
  let transcript = "";
  try {
    transcript = execFileSync("whisper-cli", ["-m", "/Users/yar/.cache/hyperframes/whisper/models/ggml-small.en.bin", "-f", wav, "-nt", "-np"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).replace(/\s+/g, " ").trim();
  } catch (e) { transcript = ""; }
  out.push({ code, url: `https://www.instagram.com/${handle}/reel/${code}/`, views: r.views, likes: info.likes, comments: info.comments, plays: info.plays, seconds: info.dur, taken: info.taken, caption: info.caption, transcript });
  console.log(`  ${code} ${r.views} views · ${info.likes} likes · ${info.comments} comments · ${Math.round(info.dur)}s · ${transcript.length} chars`);
  fs.writeFileSync(`${outDir}/reels.json`, JSON.stringify(out, null, 2));
}
console.log("done", out.length);
