// Renders one topic's carousels, and the article's header, from HTML.
//
//   node scripts/content/render-topic-pieces.mjs free-unlimited-claude-code
//
// Reads content/topics/<slug>/pieces.mjs, which exports the slides as HTML
// strings plus the words (captions, tweet, article). Writes to
// public/content-automation/made/<slug>/:
//
//   ig-01.jpg …   the Instagram deck, 1080 x 1350
//   li-01.jpg …   the LinkedIn deck, same size, and li.pdf — LinkedIn takes a
//                 document, not a stack of images
//   lipost.jpg    the LinkedIn post's picture, 1080 x 1350
//   article.jpg   the X article's header, 1500 x 600
//   pieces.json   everything the board shows, for set-topic-pieces.mjs
//
// The design rules are the leadgenman-os carousel system, with our own
// character instead of theirs: a macOS window on cream, two-layer shadows,
// one accent per slide, one idea per slide, and the short's bots — Yar's
// head on the bot's clothes — as the recurring figure and the page marker.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const slug = process.argv[2];
if (!slug) { console.error("usage: node scripts/content/render-topic-pieces.mjs <slug>"); process.exit(1); }
const root = process.cwd();
const src = path.join(root, "content/topics", slug);
const out = path.join(root, "public/content-automation/made", slug);
fs.mkdirSync(out, { recursive: true });

const puppeteer = (await import(pathToFileURL(path.join(root, "videos/avc-dollar-video/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js")).href)).default;
const P = await import(pathToFileURL(path.join(src, "pieces.mjs")).href);

/* The bots' CSS, taken from the shorts' frame so a deck's figure is the same
   figure the short had, not a redrawing of it. */
const botCss = fs.readFileSync(path.join(root, "videos/avc-dollar-video/scripts/frame.mjs"), "utf8")
  .split("\n").slice(214, 247).join("\n"); // the "/* bots */" block, whole rules
if (!/^\s*\.bot \{/.test(botCss.split("\n")[0])) throw new Error("frame.mjs moved: the bots block no longer starts at line 215");
/* Yar, off content/avatar/avatar-two.png (Yar's pick, 23 Sep): the head for
   the small bots, and the whole bust — him in the blazer — wherever he is the
   figure on a slide. */
const head = pathToFileURL(path.join(root, "content/avatar/yar-head-two.png")).href;
const bust = pathToFileURL(path.join(root, "content/avatar/yar-bust.png")).href;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=block');
:root { --cream:#F5F3EE; --ink:#1F1D1A; --body:#333333; --soft:#666666; --line:#E4DFD4; --accent:#DC5A2B; --green:#2E9E5B; --red:#C63D2F;
  --lift: 0 20px 54px rgba(17,17,22,.15), 0 8px 18px rgba(17,17,22,.26); }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:#E6E1D6; }
body { font-family:Inter, -apple-system, sans-serif; color:var(--ink); -webkit-font-smoothing:antialiased; }
.slide { position:relative; width:1080px; height:1350px; overflow:hidden; background:#E6E1D6; page-break-after:always; }
.win { position:absolute; inset:0; border-radius:40px; background:var(--cream); overflow:hidden; }
.bar { height:96px; background:#FFFFFF; border-bottom:3px solid var(--accent); display:flex; align-items:center; padding:0 36px; gap:14px; }
.bar i { width:22px; height:22px; border-radius:50%; display:block; }
.bar i:nth-child(1){background:#FF5F57} .bar i:nth-child(2){background:#FEBC2E} .bar i:nth-child(3){background:#28C840}
.bar .t { margin-left:18px; display:flex; flex-direction:column; }
.bar .t b { font-size:24px; font-weight:800; letter-spacing:-.01em; }
.bar .t span { font-size:18px; color:var(--soft); font-weight:700; margin-top:2px; }
.bar .n { margin-left:auto; font:700 20px 'JetBrains Mono', monospace; color:var(--soft); }
.stage { position:absolute; left:0; right:0; top:96px; bottom:0; }
.marker { position:absolute; left:0; right:0; bottom:44px; display:flex; justify-content:center; align-items:flex-end; gap:10px; height:70px; }
.marker .m { position:relative; width:40px; height:57px; filter:grayscale(1); opacity:.28; }
.marker .m.on { width:56px; height:80px; filter:none; opacity:1; }
.marker .bot { left:0 !important; bottom:0; }
.h1 { font-size:72px; font-weight:800; letter-spacing:-.035em; line-height:1.04; }
.h2 { font-size:60px; font-weight:800; letter-spacing:-.03em; line-height:1.06; }
.body { font-size:34px; font-weight:400; line-height:1.3; color:var(--body); }
.label { display:inline-block; font-size:20px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }
.pill { display:inline-block; padding:12px 24px; border-radius:999px; font-size:20px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; background:var(--accent); color:#fff; }
.pill.ghost { background:#fff; color:var(--ink); box-shadow:var(--lift); }
.card { background:#FFFFFF; border-radius:28px; box-shadow:var(--lift); }
.mono { font-family:'JetBrains Mono', Menlo, monospace; }
.term { background:#FFFFFF; border-radius:24px; box-shadow:0 6px 18px rgba(0,0,0,.25); outline:1.5px solid #1F1D1A; overflow:hidden; }
.term .tb { height:58px; display:flex; align-items:center; gap:10px; padding:0 22px; border-bottom:1.5px solid #ECE7DD; background:#FAF8F4; }
.term .tb i { width:15px; height:15px; border-radius:50%; background:#DDD6C9; display:block; }
.term .tb b { margin-left:12px; font-size:20px; font-weight:700; color:var(--soft); }
.term .tx { padding:26px 30px 30px; font:400 32px/1.6 'JetBrains Mono', Menlo, monospace; color:var(--ink); }
.term .p { color:var(--accent); font-weight:700; }
.term .c { color:#8A8378; }
.term .ok { color:var(--green); font-weight:700; }
.term .bad { color:var(--red); font-weight:700; }
.folder { position:absolute; width:200px; }
.folder .fb { position:relative; height:132px; }
.folder .tab { position:absolute; left:0; top:0; width:84px; height:34px; border-radius:14px 14px 0 0; background:var(--d); }
.folder .body2 { position:absolute; left:0; right:0; top:18px; bottom:0; border-radius:16px; background:var(--f); box-shadow:inset 0 1px 0 rgba(255,255,255,.7), inset 0 -8px 0 var(--d), var(--lift); }
.folder .face { position:absolute; left:50%; top:52%; width:64px; height:52px; margin-left:-32px; margin-top:-22px; border-radius:10px; background:#FFFDF9; }
.folder .face::before, .folder .face::after { content:""; position:absolute; top:17px; width:9px; height:10px; border-radius:2px; background:#1F1D1A; }
.folder .face::before { left:17px; } .folder .face::after { left:38px; }
.folder .nm { margin-top:14px; text-align:center; font-size:26px; font-weight:700; color:var(--ink); }
.x { color:var(--red); font-weight:800; }
.yar-bust { position:absolute; display:block; width:auto; filter:drop-shadow(0 18px 30px rgba(60,40,20,.18)); }
.tick { color:var(--green); font-weight:800; }
${botCss}
.bot { bottom:0; }
`;

/* A figure, placed. The shorts' bot() needs the frame's head path; this is
   the same markup with ours. */
const SK = ["#F2A33A", "#F5C542", "#3FB8A5", "#4A8FE7", "#F07A6A", "#8E6BD9", "#6CBF5A", "#F28DB2"];
function fig({ w = 200, yar = false, k = 0, shirt, eyes = "", mouth = "smile", hat = "", style = "" }) {
  const skin = SK[k % SK.length];
  shirt ??= yar ? "#DC5A2B" : ["#2B4C9B", "#1B1815", "#2E9E5B", "#6B4FBB"][k % 4];
  const h = yar
    ? `<div class="bot-head bot-head-yar"><img src="${head}" alt=""/></div>`
    : `<div class="bot-head">${hat === "phones" ? '<div class="bot-phones"></div>' : ""}<i class="bot-eye l"></i><i class="bot-eye r"></i>` +
      `${eyes === "glasses" ? '<div class="bot-glasses"><i></i><i></i></div>' : ""}${eyes === "shades" ? '<div class="bot-shades"></div>' : ""}` +
      `${mouth ? `<i class="bot-mouth ${mouth}"></i>` : ""}</div>`;
  return `<div class="bot ${yar ? "bot-yar" : ""}" style="--w:${w}px; --skin:${skin}; --shirt:${shirt}; ${style}"><div class="bot-rig">` +
    `<div class="bot-body">${yar ? '<i class="bot-collar"></i>' : ""}</div><div class="bot-arm l"></div><div class="bot-arm r"></div>` +
    `<div class="bot-leg l"></div><div class="bot-leg r"></div>${h}</div></div>`;
}
/* The bust fades out at the bottom unless it stands on an edge of the
   picture, where a straight cut reads as the frame rather than as scissors. */
/* `look` picks which real photo: "blazer" (avatar-two, the default) or
   "turtleneck" (avatar-three — black double-breasted jacket over a black
   turtleneck, the outfit Yar calls how he loves his clothes to be). */
const LOOKS = {
  blazer: bust,
  turtleneck: pathToFileURL(path.join(root, "content/avatar/yar-bust-turtleneck.png")).href,
};
const yar = ({ h = 500, fade = true, style = "", look = "blazer" } = {}) =>
  `<img class="yar-bust" src="${LOOKS[look] || bust}" alt="" style="height:${h}px; ${fade ? "-webkit-mask-image:linear-gradient(to bottom,#000 78%,transparent 100%);" : ""} ${style}">`;
const folder = (name, f, d, x, y) =>
  `<div class="folder" style="left:${x}px; top:${y}px; --f:${f}; --d:${d}"><div class="fb"><div class="tab"></div><div class="body2"><div class="face"></div></div></div><div class="nm">${name}</div></div>`;

function frame(inner, i, n, title, sub) {
  const marks = Array.from({ length: n }, (_, j) =>
    `<div class="m${j === i ? " on" : ""}">${fig({ w: j === i ? 56 : 40, yar: j === i, k: j })}</div>`).join("");
  return `<section class="slide"><div class="win"><div class="bar"><i></i><i></i><i></i>` +
    `<div class="t"><b>${title}</b><span>${sub}</span></div><div class="n">${String(i + 1).padStart(2, "0")}/${String(n).padStart(2, "0")}</div></div>` +
    `<div class="stage">${inner}</div><div class="marker">${marks}</div></div></section>`;
}

const H = { fig, folder, yar };
const doc = (body, w, h) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
@page { size:${w}px ${h}px; margin:0; } ${P.css || ""}</style></head><body>${body}</body></html>`;

const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--allow-file-access-from-files"] });
const tmp = path.join(out, ".render.html");

async function deck(name, slides, title, sub, pdf) {
  const html = doc(slides.map((s, i) => frame(s(H), i, slides.length, title, sub)).join(""), 1080, 1350);
  fs.writeFileSync(tmp, html);
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  const els = await page.$$(".slide");
  const files = [];
  for (let i = 0; i < els.length; i++) {
    const png = await els[i].screenshot({ type: "png" });
    const f = `${name}-${String(i + 1).padStart(2, "0")}.jpg`;
    await sharp(png).resize(1080, 1350).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(out, f));
    files.push(f);
  }
  if (pdf) await page.pdf({ path: path.join(out, `${name}.pdf`), width: "1080px", height: "1350px", printBackground: true, pageRanges: "" });
  await page.close();
  console.log(`${name}: ${files.length} slides${pdf ? " + pdf" : ""}`);
  return files;
}

const ig = await deck("ig", P.ig, P.window.ig[0], P.window.ig[1], false);
const li = await deck("li", P.li, P.window.li[0], P.window.li[1], true);

let cover = "";
if (P.articleCover) {
  fs.writeFileSync(tmp, doc(`<section class="slide" style="width:1500px;height:600px">${P.articleCover(H)}</section>`, 1500, 600));
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 600, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  const png = await (await page.$(".slide")).screenshot({ type: "png" });
  await sharp(png).resize(1500, 600).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(out, "article.jpg"));
  cover = "article.jpg";
  await page.close();
  console.log("article cover");
}
let lipost = "";
if (P.liPost) {
  fs.writeFileSync(tmp, doc(`<section class="slide">${P.liPost.image(H)}</section>`, 1080, 1350));
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  const png = await (await page.$(".slide")).screenshot({ type: "png" });
  await sharp(png).resize(1080, 1350).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(out, "lipost.jpg"));
  lipost = "lipost.jpg";
  await page.close();
  console.log("linkedin post image");
}
await browser.close();
fs.rmSync(tmp, { force: true });

const base = `/content-automation/made/${slug}/`;
const pieces = {
  short: P.short || null,
  ig: { slides: ig.map((f) => base + f), caption: P.captions.ig },
  li: { slides: li.map((f) => base + f), pdf: base + "li.pdf", caption: P.captions.li },
  lipost: lipost ? { image: base + lipost, text: P.liPost.text } : null,
  tweet: { text: P.tweet },
  article: { title: P.article.title, body: P.article.body, cover: cover ? base + cover : "" },
};
fs.writeFileSync(path.join(out, "pieces.json"), JSON.stringify(pieces, null, 2));
console.log(`wrote ${path.relative(root, out)}/pieces.json`);
