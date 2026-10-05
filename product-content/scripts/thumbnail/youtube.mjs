/**
 * A YouTube thumbnail (1280×720) in Yar's style (content/references/thumbnails/): Yar's real photo cut out on the
 * right, surprised and pointing, at one glowing object on the left (the real result: a screenshot, a logo, the
 * character), one or two huge words, and one pill that states the transformation. Warm or blue glow, no clutter.
 *
 *   node scripts/thumbnail/youtube.mjs <spec.json>        → the PNG and a JPG next to spec.out
 *
 * spec.json → {
 *   out: "videos/…/thumb-youtube.png",
 *   theme: "orange" | "blue",              orange = dark to orange (the "Beginner → Pro" one), blue = the "It's Free" one, green = Voho
 *   rtl: true,                             Arabic big words, right to left (IBM Plex Sans Arabic), green = Voho
 *   big: "Claude",                         the giant word behind Yar (1–2 words)
 *   bigStyle: "serif" | "sans",            serif = huge editorial word, sans = heavy white with a highlight box
 *   highlight: "Free",                     sans only: the word in the glowing box
 *   object: "videos/…/dashboard.png",      the glowing thing he points at: the real result, never a mock
 *   badge: "4 MIN",                        optional: a small stamp on the object
 *   pill: "MESSY SHEET → DASHBOARD",       the transformation, bottom left, ≤ 26 characters
 *   yar: "content/avatar/yar-point-cutout.png"   a real photo of Yar, cut out; never an AI-edited face
 * }
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const spec = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), 'utf8'))
const abs = (p) => path.isAbsolute(p) ? p : path.join(ROOT, p)
const data = (p) => `data:image/${p.endsWith('.png') ? 'png' : 'jpeg'};base64,` + fs.readFileSync(abs(p)).toString('base64')
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
const T = {
  orange: { bg: 'radial-gradient(120% 120% at 85% 40%, #FF8A3D 0%, #E0592A 30%, #4A2A2E 68%, #1C1F2E 100%)', glow: '#FF7A2F', pill: '#E8601F', box: '#FF7A2F', bigCol: 'rgba(255,255,255,.95)' },
  green: { bg: 'radial-gradient(120% 120% at 80% 40%, #3DDC84 0%, #16A05A 32%, #0B4A2E 72%, #06261A 100%)', glow: '#3DDC84', pill: '#12A058', box: '#16A05A', bigCol: '#FFFFFF' },
  blue: { bg: 'radial-gradient(120% 120% at 70% 45%, #1E6BFF 0%, #0E3B9E 38%, #0A1636 75%, #060B1C 100%)', glow: '#3D8BFF', pill: '#1E6BFF', box: '#2F7BFF', bigCol: '#FFFFFF' },
}[spec.theme || 'orange']
const yar = spec.yar || 'content/avatar/yar-point-cutout.png'
const serif = (spec.bigStyle || 'serif') === 'serif'
const rtl = !!spec.rtl   // Arabic words: right to left, in IBM Plex Sans Arabic
const bigHtml = serif
  ? `<div class="big serif">${esc(spec.big)}</div>`
  : `<div class="big sans${rtl ? ' rtl' : ''}">${esc(spec.big)} ${spec.highlight ? `<span class="hl">${esc(spec.highlight)}</span>` : ''}</div>`

const html = `<html><head><style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@800;900&family=Playfair+Display:wght@600&display=block');
  * { margin: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; overflow: hidden; background: ${T.bg}; font-family: Inter, sans-serif; position: relative; }
  .grain { position: absolute; inset: 0; background: radial-gradient(60% 60% at 30% 55%, ${T.glow}33, transparent 70%); }
  .big { position: absolute; left: 0; right: 0; white-space: nowrap; text-align: center; }
  .big.serif { top: -40px; font-family: 'Playfair Display', serif; font-weight: 600; font-size: 330px; letter-spacing: -.03em; color: ${T.bigCol}; opacity: .92; }
  .big.sans { top: 26px; left: 40px; right: auto; text-align: left; font-weight: 900; font-size: 150px; letter-spacing: -.045em; color: #fff; line-height: 1; text-shadow: 0 8px 30px rgba(0,0,0,.35); }
  @font-face { font-family: 'Plex Arabic'; font-weight: 700; src: url(data:font/woff2;base64,${fs.readFileSync(path.join(ROOT, 'videos/_voho-shared/fonts-ar/PlexArabic-700.woff2')).toString('base64')}) format('woff2'); }
  /* the sans words sit above the object's glow (it washed out the dots under Arabic letters) and below Yar */
  .big.sans { z-index: 2; } .object { z-index: 1; } .yar { z-index: 3; } .corner { z-index: 3; } .badge, .pill { z-index: 4; }
  .big.sans.rtl { direction: rtl; font-family: 'Plex Arabic', Inter, sans-serif; font-weight: 700; letter-spacing: 0; font-size: 150px; top: 2px; padding-bottom: 30px; }
  .big.sans.rtl .hl { padding: 0 26px 46px; vertical-align: top; }   /* room for the dots under Arabic letters */
  .hl { display: inline-block; padding: 0 22px 10px; border-radius: 22px; background: ${T.box}; box-shadow: 0 0 60px ${T.glow}, 0 0 0 4px rgba(255,255,255,.25) inset; }
  .object { position: absolute; left: 70px; top: 250px; width: 600px; transform: rotate(-4deg); border-radius: 22px; overflow: hidden;
    box-shadow: 0 0 0 5px rgba(255,255,255,.9), 0 0 90px 18px ${T.glow}, 0 30px 60px rgba(0,0,0,.45); background: #fff; }
  .object img { display: block; width: 100%; }
  .badge { position: absolute; left: 40px; top: 214px; transform: rotate(-9deg); padding: 12px 22px; border-radius: 16px; background: #fff; color: #111; font-weight: 900; font-size: 44px; letter-spacing: -.02em;
    box-shadow: 0 10px 26px rgba(0,0,0,.35); }
  .yar { position: absolute; right: -95px; bottom: -40px; height: 740px; filter: drop-shadow(0 20px 40px rgba(0,0,0,.45)); }
  /* a soft shadow in the bottom-right corner, over Yar's black top: hides where the cutout meets the frame */
  .corner { position: absolute; right: 0; bottom: 0; width: 420px; height: 300px; background: radial-gradient(90% 90% at 100% 100%, #121216 0%, #121216 45%, transparent 100%); }
  .pill { position: absolute; left: 60px; bottom: 44px; padding: 16px 30px 18px; border-radius: 18px; background: ${T.pill}; color: #fff; font-weight: 900; font-size: 50px; letter-spacing: -.01em;
    text-transform: uppercase; box-shadow: 0 0 0 4px rgba(255,255,255,.85), 0 12px 30px rgba(0,0,0,.35); white-space: nowrap; }
</style></head><body>
  <div class="grain"></div>
  ${bigHtml}
  <div class="object"><img src="${data(spec.object)}"></div>
  ${spec.badge ? `<div class="badge">${esc(spec.badge)}</div>` : ''}
  <img class="yar" src="${data(yar)}">
  <div class="corner"></div>
  <div class="pill">${esc(spec.pill)}</div>
</body></html>`

if (process.env.THUMB_HTML) fs.writeFileSync(process.env.THUMB_HTML, html)   // debugging: the page as rendered
const require = createRequire(path.join(ROOT, 'open-source/animation-base/package.json'))
const puppeteer = require('puppeteer-core')
const chrome = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', process.env.CHROME_PATH].find((p) => p && fs.existsSync(p))
const browser = await puppeteer.launch({ executablePath: chrome, headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 720 })
await page.setContent(html, { waitUntil: 'networkidle0' })
await page.evaluate(() => document.fonts.ready)
const out = abs(spec.out)
fs.mkdirSync(path.dirname(out), { recursive: true })
await page.screenshot({ path: out, type: 'png' })
await page.screenshot({ path: out.replace(/\.png$/, '.jpg'), type: 'jpeg', quality: 92 })
await browser.close()
console.log('wrote', path.relative(ROOT, out), 'and .jpg')

// The thumbnail this script makes is the one that's used (Yar, 2026-09-26). If Yar decides it isn't good enough, he
// remakes it by hand in the ChatGPT app, so next to it, write exactly what to upload and paste for that.
const refs = ['content/references/thumbnails/youtube-its-free-claude.png', 'content/references/thumbnails/youtube-claude-beginner-to-pro.png']
const words = (spec.bigStyle || 'serif') === 'serif' ? `the word "${spec.big}" huge in an elegant serif behind him` : `"${spec.big}" in heavy white letters with "${spec.highlight}" in a glowing ${spec.theme === 'blue' ? 'blue' : 'orange'} box`
const promptFile = out.replace(/\.png$/, '-chatgpt.txt')
fs.writeFileSync(promptFile, `Only if Yar wants to remake this thumbnail by hand in the ChatGPT app (never the API).

Upload these, in this order:
${[...refs, yar, spec.object, path.relative(ROOT, out)].map((f, i) => `  ${i + 1}. ${f}`).join('\n')}

Then paste this:

Make a 1280×720 YouTube thumbnail in exactly the style of the first two images (my own thumbnails). Use the man in
the third image: keep his face exactly as it is in that photo, only the pose, crop and lighting around him may change.
He's on the right, surprised, pointing at the fourth image, which glows on the left with a white edge and a strong
${spec.theme === 'blue' ? 'blue' : 'orange'} glow, tilted a few degrees. Put ${words}.${spec.badge ? ` A small white stamp on the object says "${spec.badge}".` : ''}
At the bottom left, an ${spec.theme === 'blue' ? 'blue' : 'orange'} pill says "${String(spec.pill).toUpperCase()}". Background: a ${spec.theme === 'blue' ? 'deep blue glow' : 'warm glow from dark on the left to orange on the right'}.
Nothing else on it: no extra text, no logos I didn't give you. The fifth image is a rough layout to follow.

Check the face looks exactly like him before using it. If it drifts, ask again or use the draft.
Save it as ${path.relative(ROOT, out).replace(/-v\d+\.png$|\.png$/, '')}-final.png and set it in YouTube Studio.
`)
console.log('wrote', path.relative(ROOT, promptFile), '(only for a ChatGPT remake, if Yar asks)')
