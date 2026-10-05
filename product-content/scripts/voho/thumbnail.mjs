/**
 * Thumbnails with the green character front and centre (Yar, 2026-09-25: "create thumbnails for all these… Instagram and
 * YouTube… add our green character").
 *
 *   node scripts/voho/thumbnail.mjs <dir>        reads <dir>/thumb.json, writes <dir>/thumb-youtube.jpg (1280×720)
 *                                               and <dir>/thumb-reel.png (1080×1920, the reel's opening frame = its
 *                                               Instagram cover; Socialit can't set a cover, Instagram uses frame 0)
 *
 * thumb.json → { headline: ["BUILD AN", "AI CLINIC RECEPTIONIST", "IN 60 SECONDS"] (kicker, the thing you build, the
 *                green box — Yar, 2026-09-25: "Build an AI clinic receptionist in Arabic in 60 seconds"; a 2-line
 *                headline [big, green] still works), tag: "small chip", arabic: "optional Arabic sticker",
 *                thumb: { hero: "Hum", crew: ["Nora", "Saad"], mood: "excited" } }
 * The art is painted by LOOPS.thumb (open-source/animation-base/src/scenes/yar-voho-extras.js); the words are set in a
 * browser on top, so they're crisp. Rules: 3–5 words that make the promise or name the pain; bright, never dark.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const DIR = path.resolve(process.argv[2] ?? '.')
const cfg = fs.existsSync(path.join(DIR, 'thumb.json')) ? JSON.parse(fs.readFileSync(path.join(DIR, 'thumb.json'), 'utf8'))
  : JSON.parse(fs.readFileSync(path.join(DIR, 'topic.json'), 'utf8')).thumbnail   // a topic workspace: topic.json → thumbnail
const AB = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../open-source/animation-base')

// 1. the painted art
const page = 'studio-voho-thumb.html'
const base = fs.readFileSync(path.join(AB, 'studio-voho-property.html'), 'utf8')
fs.writeFileSync(path.join(AB, page), base
  .replace(/<script>const PROJECT = [^<]*<\/script>/, `<script>const PROJECT = { duration: 1, bpm: 116, offset: 0 };\nwindow.SCENE = ${JSON.stringify({ thumb: cfg.thumb || {} })};</script>`)
  .replace('src/scenes/yar-voho-property.js', 'src/scenes/yar-voho-extras.js'))
const tmp = path.join(DIR, '.thumb-art'); fs.rmSync(tmp, { recursive: true, force: true })
execFileSync('node', ['render.mjs', `--page=${page}`, '--loop=thumb', '--stills=0.3', `--out=${tmp}`], { cwd: AB, stdio: 'ignore' })
const art = path.join(tmp, fs.readdirSync(tmp).find((f) => f.endsWith('.png')))
const artUrl = 'data:image/png;base64,' + fs.readFileSync(art).toString('base64')
const mark = fs.readFileSync(path.join(AB, '../../videos/_voho-shared/fonts/Geist-SemiBold.woff2')).toString('base64')

// 2. the words, set in a browser
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
const H = cfg.headline.length >= 3 ? cfg.headline : ['', ...cfg.headline]
const [KICK, BIG, HI] = H
// the big line wraps onto two lines at most; the longest word decides the size, so no word ever breaks
const lines = BIG.includes('|') ? BIG.split('|') : [BIG]
const longestWord = Math.max(...BIG.split(/[\s|]+/).map((w) => w.length))
const FIT = Math.round(Math.min(96, 96 * 11 / Math.max(longestWord, ...lines.map((l) => l.length / (lines.length > 1 ? 1 : 2)))))
// a | in the big line is where it breaks ("REAL ESTATE|CALL CENTER"), so it never splits mid-phrase
const title = `${KICK ? `<div class="kick">${esc(KICK)}</div>` : ''}<h1>${esc(BIG).split('|').join('<br>')}</h1><div class="hi">${esc(HI)}</div>`
const logo = `<svg viewBox="0 0 64 64" width="100%" height="100%"><rect width="64" height="64" rx="14" fill="#09090b"/><g fill="#f4f4f5"><rect x="10.5" y="25" width="7" height="14" rx="3.5"/><rect x="22.5" y="16" width="7" height="32" rx="3.5"/><rect x="34.5" y="21" width="7" height="22" rx="3.5"/><rect x="46.5" y="26" width="7" height="12" rx="3.5"/></g></svg>`
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Noto+Kufi+Arabic:wght@800&display=block');
  @font-face { font-family: Geist; src: url(data:font/woff2;base64,${mark}) format('woff2'); font-weight: 600; }
  * { margin: 0; box-sizing: border-box; }
  body { background: #FFF6E3; font-family: 'Bricolage Grotesque', sans-serif; color: #2B2233; overflow: hidden; }
  .art { position: absolute; background: url(${artUrl}) center / cover no-repeat; }
  .brand { display: flex; align-items: center; gap: .3em; font-family: Geist; font-weight: 600; letter-spacing: -0.03em; }
  .brand i { display: block; width: 1.25em; height: 1.25em; }
  h1 { font-weight: 800; line-height: .9; letter-spacing: -0.035em; text-transform: uppercase; }
  .kick { font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase; color: #016838; }
  .hi { font-weight: 800; letter-spacing: -0.035em; text-transform: uppercase; line-height: 1; display: inline-block; background: #2EC27E; color: #05231A; padding: .02em .16em .06em; border-radius: .14em;
    border: .06em solid #2B2233; box-shadow: .07em .09em 0 #2B2233; transform: rotate(-2deg); margin-top: .22em; }
  .tag { display: inline-block; background: #2B2233; color: #FFF6E3; font-family: Geist; font-weight: 600; border-radius: 999px; }
  .ar { position: absolute; font-family: 'Noto Kufi Arabic'; font-weight: 800; background: #FFD84D; border: 5px solid #2B2233;
    border-radius: 18px; box-shadow: 6px 7px 0 #2B2233; transform: rotate(4deg); direction: rtl; }`
const youtube = `<html><head><style>${css}
  body { width: 1280px; height: 720px; }
  .art { left: 0; top: 0; width: 1280px; height: 720px; }
  .left { position: absolute; left: 48px; top: 48px; width: 680px; }
  .brand { font-size: 32px; margin-bottom: 18px; }
  .kick { font-size: 46px; margin-bottom: 4px; }
  h1 { font-size: ${FIT}px; }
  .hi { font-size: 70px; }
  .tag { margin-top: 26px; font-size: 25px; padding: 11px 22px; }
  .ar { right: 36px; top: 30px; font-size: 40px; padding: 4px 20px 10px; transform: rotate(4deg); }
</style></head><body><div class="art"></div>
  <div class="left"><div class="brand"><i>${logo}</i>voho</div>
  ${title}${cfg.tag ? `<div class="tag">${esc(cfg.tag)}</div>` : ''}</div>
  ${cfg.arabic ? `<div class="ar">${esc(cfg.arabic)}</div>` : ''}</body></html>`
const reel = `<html><head><style>${css}
  body { width: 1080px; height: 1920px; }
  .top { position: absolute; left: 60px; right: 60px; top: 170px; text-align: center; }
  .brand { justify-content: center; font-size: 44px; margin-bottom: 26px; }
  .kick { font-size: 60px; margin-bottom: 6px; }
  h1 { font-size: ${Math.round(FIT * 1.2)}px; }
  .hi { font-size: 88px; }
  .art { left: -1188px; top: 760px; width: 2304px; height: 1296px;   /* Hum (x 1440 of 1920) centred */
    -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 140px); mask-image: linear-gradient(to bottom, transparent 0, #000 140px); }
  .tag { margin-top: 40px; font-size: 34px; padding: 14px 30px; }
  .ar { left: 70px; top: 860px; font-size: 56px; padding: 8px 28px 16px; transform: rotate(-5deg); z-index: 2; }
</style></head><body><div class="art"></div>
  <div class="top"><div class="brand"><i>${logo}</i>voho</div>
  ${title}${cfg.tag ? `<div class="tag">${esc(cfg.tag)}</div>` : ''}</div>
  ${cfg.arabic ? `<div class="ar">${esc(cfg.arabic)}</div>` : ''}</body></html>`

const require = createRequire(path.join(AB, 'package.json'))
const puppeteer = require('puppeteer-core')
const chrome = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', process.env.CHROME_PATH].find((p) => p && fs.existsSync(p))
const browser = await puppeteer.launch({ executablePath: chrome, headless: true })
for (const [html, w, h, out, type] of [[youtube, 1280, 720, 'thumb-youtube.jpg', 'jpeg'], [reel, 1080, 1920, 'thumb-reel.png', 'png']]) {
  const p = await browser.newPage()
  await p.setViewport({ width: w, height: h })
  await p.setContent(html, { waitUntil: 'networkidle0' })
  await p.evaluate(() => document.fonts.ready)
  await p.screenshot({ path: path.join(DIR, out), type, ...(type === 'jpeg' ? { quality: 92 } : {}) })
}
await browser.close()
fs.rmSync(tmp, { recursive: true, force: true })
if (fs.existsSync(path.join(DIR, 'assets'))) fs.copyFileSync(path.join(DIR, 'thumb-reel.png'), path.join(DIR, 'assets/thumb-reel.png'))   // the reel opens on it
console.log(`wrote ${path.join(DIR, 'thumb-youtube.jpg')} (${(fs.statSync(path.join(DIR, 'thumb-youtube.jpg')).size / 1024).toFixed(0)} KB) and thumb-reel.png`)
