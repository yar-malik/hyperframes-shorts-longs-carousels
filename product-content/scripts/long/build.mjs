/**
 * The long (16:9) CCM or AVC video for one topic, made exactly like the Voho ones (scripts/voho/build-long.mjs):
 * painted crew → the real screen recording grown out of the painted monitor (the setup at 1.6x with step pills, then the
 * result cut per beat) → back into the monitor → painted payoff → end card. Bit's crew for CCM, Clappy's for AVC.
 *
 *   node scripts/long/build.mjs <workspace>      → <workspace>/long/index.html + compositions/
 *
 * Reads <workspace>/topic.json (product, vo lines, recording marks and cuts, end card) and assets/ (recording.mp4,
 * painted.mp4, the pip loops, vo/*.wav + *.words.json, sfx, bgm/bed.wav).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { BRAND } from './brand.mjs'
import { facecam } from '../avatar/facecam.mjs'

const WS = path.resolve(process.argv[2] ?? '.')
process.chdir(path.join(WS, 'long'))
const topic = JSON.parse(fs.readFileSync('../topic.json', 'utf8'))
const B = BRAND[topic.product]
if (!B) throw new Error(`topic.product must be ccm or avc, not ${topic.product}`)
const R = topic.recording
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())
const r2 = (n) => Math.round(n * 100) / 100
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const clipAttrs = (start, len, track) => `data-start="${r2(start)}" data-duration="${r2(len)}" data-track-index="${track}"`

// ------------------------------------------------------------ the painted render (yar-studio-story.js), as Voho's
const PAINT = { aEnd: 10.2, aHold: 9.5, len: dur('assets/painted.mp4') }
const MONITOR = { x: 560, y: 315, scale: 800 / 1920 }
const GROW = 0.7

// ------------------------------------------------------------ the recording: the setup, then one cut per result beat
const CUTS = R.cuts
if (!CUTS?.length) throw new Error('recording.cuts is empty: at least one result cut is needed')
const segs = [
  { id: 'studio', in: R.setup.in, out: R.setup.out, rate: R.setup.rate ?? 1 },   // real speed: at 1.6x the screen was too fast to follow (Yar, 2026-09-26)
  ...CUTS.map((c, i) => ({ id: 'cut' + i, in: c.in, out: c.out, rate: 1 })),
]
let cursor = PAINT.aEnd
for (const s of segs) { s.start = cursor; s.len = (s.out - s.in) / s.rate; cursor += s.len }
const recEnd = cursor
const seg = (id) => segs.find((s) => s.id === id)
const tl = (src) => {
  const s = segs.find((x) => src >= x.in - 1e-6 && src <= x.out + 1e-6)
  if (!s) throw new Error('source time ' + src + ' is cut')
  return s.start + (src - s.in) / s.rate
}
const cStart = recEnd - GROW
const C0 = recEnd - GROW + (PAINT.aEnd - PAINT.aHold)
const total = cStart + (PAINT.len - PAINT.aHold)

// ------------------------------------------------------------ narration: promise, problem, how, the turn, the result
const vo = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'].map((id) => ({ id, len: dur(`assets/vo/${id}.wav`) }))
const V = Object.fromEntries(vo.map((v) => [v.id, v]))
V.v1.start = 0.4
V.v2.start = V.v1.start + V.v1.len + 0.25
if (V.v2.start + V.v2.len > PAINT.aEnd + 0.3) console.warn('! v1 + v2 run past the painted open — shorten them')
V.v3.start = seg('studio').start + 0.4
V.v4.start = Math.max(V.v3.start + V.v3.len + 0.3, R.v4At != null ? tl(R.v4At) : 0)
V.v5.start = seg('cut0').start + 0.2
V.v6.start = C0 + 1.1
for (const v of vo) console.log(v.id.padEnd(3), r2(v.start), '→', r2(v.start + v.len))
// Yar on camera for v1, the promise (scripts/avatar): a few seconds, then the painted story carries on
const yar = facecam({ start: V.v1.start, len: V.v1.len, clipAttrs, r2 })
if (V.v4.start + V.v4.len > seg('cut0').start) console.warn('! v4 runs into the result — shorten v3/v4 or lengthen the setup')
if (V.v6.start + V.v6.len > total - 0.6) console.warn('! v6 runs to the end')

// ------------------------------------------------------------ captions
const studioEnd = seg('studio').start + seg('studio').len
const stepMarks = R.steps.filter((s) => s.text && s.at != null)
const steps = stepMarks.map((s, i) => ({ n: i + 1, text: s.text, from: i === 0 ? seg('studio').start + 0.6 : tl(s.at),
  to: i + 1 < stepMarks.length ? tl(stepMarks[i + 1].at) - 0.2 : studioEnd }))
steps.push({ n: steps.length + 1, text: R.resultStep || 'Run it', from: seg('cut0').start + 0.2, to: Math.min(seg('cut0').start + 3, seg('cut0').start + seg('cut0').len) })
const lines = CUTS.map((c, k) => ({ label: c.label, text: c.sub, from: seg('cut' + k).start + (k === 0 ? 3.1 : 0.05), to: seg('cut' + k).start + seg('cut' + k).len }))
  .filter((l) => l.text && l.to > l.from + 0.3)
const words = (id) => JSON.parse(fs.readFileSync(`assets/vo/${id}.words.json`, 'utf8')).transcription
  .map((w) => ({ text: w.text.trim(), t: w.offsets.from / 1000 })).filter((w) => w.text)
const voCaps = ['v1', 'v2', 'v6'].map((id) => ({ id, from: V[id].start - 0.1, to: V[id].start + V[id].len + 0.35, words: words(id) }))

// ------------------------------------------------------------ sound effects, on the painted action and every click
const sfx = []
const add = (src, at, vol) => sfx.push({ src, at, vol })
const alarm = topic.product === 'avc' ? ['ring.wav', 0.26] : ['ping.mp3', 0.3]   // clients ringing · errors flashing
add(alarm[0], 1.6, alarm[1])
for (let i = 0; i < 4; i++) { add(alarm[0], 1.5 + i * .35 + 1.4, alarm[1] * .9); add('pop.mp3', [4.5, 4.85, 5.2, 5.55][i], 0.5) }   // the crew pops up
for (const t of [1.4, 2.8, 4.4, 6.8, 8.1]) add('whoosh-short.mp3', t - 0.05, 0.22)
add('ding.wav', 6.9, 0.3)                                            // the crew gets on it
add('whoosh-short.mp3', PAINT.aEnd - 0.1, 0.4)
for (const t of R.clicks || []) add('tick.wav', tl(t), 0.45)
for (const [a, b] of R.typing || []) for (let t = tl(a) + .05; t < tl(b); t += 0.09 + 0.05 * Math.abs(Math.sin(t * 13))) add('tick.wav', t, 0.12)
if (R.done != null) add('ding.wav', tl(R.done), 0.4)
for (const st of steps) add('pop.mp3', st.from, 0.3)
add('whoosh-short.mp3', seg('cut0').start - 0.1, 0.35)
for (let i = 1; i < CUTS.length; i++) add('tick.wav', seg('cut' + i).start, 0.35)
const last = seg('cut' + (CUTS.length - 1))
add('ding.wav', last.start + last.len - 1.0, 0.55)                   // the result
add('whoosh-short.mp3', recEnd - GROW - 0.1, 0.4)
add('pop.mp3', C0 + 2.3, 0.45)
add('ping.mp3', C0 + 3.1, 0.55)
for (let i = 0; i < 8; i++) add('pop.mp3', C0 + 4.2 + (i % 4) * .12 + (i >= 4 ? .05 : 0), 0.3)
add('whoosh-short.mp3', C0 + 7.0, 0.22); add('whoosh-short.mp3', C0 + 8.4, 0.22)
if (yar) add('pop.mp3', V.v1.start - 0.05, 0.35)
const trackEnds = []
for (const e of sfx.sort((a, b) => a.at - b.at)) {
  e.len = e.len ?? Math.min(dur('assets/sfx/' + e.src), total - e.at)
  let k = trackEnds.findIndex((end) => end <= e.at + 1e-3)
  if (k < 0) { k = trackEnds.length; trackEnds.push(0) }
  trackEnds[k] = e.at + e.len; e.track = 13 + k
}

// ------------------------------------------------------------ html pieces
const FONTS = `
      @font-face { font-family: "Geist"; src: url("assets/fonts/Geist-Regular.woff2") format("woff2"); font-weight: 400; }
      @font-face { font-family: "Geist"; src: url("assets/fonts/Geist-Medium.woff2") format("woff2"); font-weight: 500; }
      @font-face { font-family: "Geist"; src: url("assets/fonts/Geist-SemiBold.woff2") format("woff2"); font-weight: 600; }`
const capClips = [
  ...steps.map((s, i) => ({ id: `step-${s.n}`, from: s.from, to: s.to, track: i % 2, cls: 'step',
    html: `<span class="inner"><b>${s.n}</b><span>${esc(s.text)}</span></span>` })),
  ...lines.map((l, i) => ({ id: `sub-${i}`, from: l.from, to: l.to, track: 2 + (i % 3), cls: 'sub',
    html: `<span class="inner">${l.label ? `<em>${esc(l.label)}</em>` : ''}${esc(l.text)}</span>` })),
  ...voCaps.map((c, i) => ({ id: `vo-${c.id}`, from: c.from, to: c.to, track: 5 + (i % 2), cls: 'lyric',
    html: `<span class="inner">${c.words.map((w, j) => `<span class="w" id="vo-${c.id}-w${j}">${esc(w.text)}</span>`).join(' ')}</span>` })),
]
const wordTweens = voCaps.flatMap((c) => c.words.map((w, j) =>
  `tl.to("#vo-${c.id}-w${j}", { color: "${B.word}", duration: 0.08 }, ${r2(V[c.id].start + w.t)});`))

fs.mkdirSync('compositions', { recursive: true })
fs.writeFileSync('compositions/captions.html', `<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <style>${FONTS}
      #root { position: absolute; inset: 0; overflow: hidden; font-family: "Geist", ui-sans-serif, system-ui, sans-serif; }
      .step, .sub, .lyric { position: absolute; left: 0; right: 0; bottom: 56px; display: flex; justify-content: center; }
      .step .inner { display: inline-flex; align-items: center; gap: 16px; padding: 14px 28px 14px 14px; border-radius: 999px;
        background: rgba(43,34,51,0.9); color: #FFF5E2; font-size: 32px; font-weight: 500; letter-spacing: -0.01em;
        box-shadow: 0 10px 30px rgba(43,34,51,0.25); }
      .step b { display: inline-flex; width: 46px; height: 46px; border-radius: 50%; align-items: center; justify-content: center;
        background: ${B.accent}; color: ${B.accentInk}; font-weight: 600; font-size: 25px; }
      .sub .inner { display: inline-block; max-width: 1280px; padding: 16px 30px; border-radius: 18px; background: rgba(43,34,51,0.9);
        color: #FFF5E2; font-size: 33px; line-height: 1.3; font-weight: 400; text-align: center; box-shadow: 0 10px 30px rgba(43,34,51,0.25); }
      .sub em { display: block; font-style: normal; font-size: 18px; letter-spacing: 0.12em; text-transform: uppercase; color: ${B.word}; margin-bottom: 4px; }
      .lyric .inner { display: inline-block; max-width: 1320px; padding: 16px 34px; border-radius: 20px; background: rgba(43,34,51,0.86);
        color: #FFF5E2; font-size: 40px; line-height: 1.28; font-weight: 500; letter-spacing: -0.01em; text-align: center;
        box-shadow: 0 10px 30px rgba(43,34,51,0.25); }
      </style>
      <div id="root" data-composition-id="captions" data-width="1920" data-height="1080">
${capClips.map((c) => `        <div class="clip ${c.cls}" id="${c.id}" ${clipAttrs(c.from, c.to - c.from, c.track)}>${c.html}</div>`).join('\n')}
      </div>
      <script>
        (() => {
          const tl = gsap.timeline({ paused: true });
${capClips.map((c) => `          tl.fromTo("#${c.id} .inner", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: "power3.out" }, ${r2(c.from)});`).join('\n')}
          ${wordTweens.join('\n          ')}
          window.__timelines["captions"] = tl;
          tl.seek(0);
        })();
      </script>
    </template>
  </body>
</html>
`)

const endStart = V.v6.start + 2.2, endLen = total - endStart
// the end card sends people to the Skool community: its real cover, the outcome, and the invitation (Yar, 2026-09-26)
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
fs.copyFileSync(path.join(ROOT, B.skool.cover), 'assets/skool-cover.png')
fs.writeFileSync('compositions/endcard.html', `<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <style>${FONTS}
      #root { position: absolute; inset: 0; overflow: hidden; font-family: "Geist", ui-sans-serif, system-ui, sans-serif; }
      #end-card { position: absolute; left: 1100px; top: 56px; width: 720px; padding: 26px 30px 30px;
        border-radius: 28px; background: #FFF9EE; border: 3px solid #2B2233; box-shadow: 0 16px 0 rgba(43,34,51,0.9);
        display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
      .brand { display: flex; align-items: center; gap: 14px; font-weight: 600; font-size: 36px; letter-spacing: -0.03em; color: #09090b; }
      #end-card h1 { font-weight: 600; font-size: 38px; line-height: 1.08; letter-spacing: -0.03em; color: #2B2233; }
      #end-card .cover { width: 100%; border-radius: 18px; display: block; box-shadow: 0 8px 20px rgba(43,34,51,.2); }
      #end-card .join { font-weight: 600; font-size: 30px; letter-spacing: -0.02em; color: #2B2233; }
      .url { display: inline-block; padding: 14px 30px; border-radius: 999px; background: ${B.pill}; color: #FFF5E2; font-weight: 500; font-size: 28px; }
      </style>
      <div id="root" data-composition-id="endcard" data-width="1920" data-height="1080">
        <div id="end-card">
          <div class="brand">${B.mark(52)}<span>${esc(B.name)}</span></div>
          <img class="cover" src="assets/skool-cover.png" alt="">
          <h1>${esc(topic.endcard ?? B.endcard)}</h1>
          <div class="join">${esc(B.cta)} on Skool</div>
          <span class="url">${esc(B.url)}</span>
        </div>
      </div>
      <script>
        (() => {
          const tl = gsap.timeline({ paused: true });
          tl.fromTo("#end-card", { y: -260, rotation: -3 }, { y: 0, rotation: 0, duration: 0.7, ease: "back.out(1.6)" }, 0);
          tl.fromTo("#end-card > *", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power3.out" }, 0.35);
          tl.to("#end-card", { rotation: 1, duration: ${r2(Math.max(0.5, endLen - 1))}, ease: "sine.inOut" }, 0.8);
          window.__timelines["endcard"] = tl;
          tl.seek(0);
        })();
      </script>
    </template>
  </body>
</html>
`)

// ------------------------------------------------------------ the camera on the recording
const pose = (fx, fy, sc) => {
  const x = Math.min(0, Math.max(1920 - 1920 * sc, 960 - fx * sc))
  const y = Math.min(0, Math.max(1080 - 1080 * sc, 540 - fy * sc))
  return { x: r2(x), y: r2(y), scale: sc }
}
const WIDE = pose(960, 540, 1)
const cam = [
  ...(R.focus || []).map((f) => ({ at: tl(f.at), to: f.wide ? WIDE : pose(f.x, f.y, f.scale ?? 1.35), d: 0.55 })),
  { at: Math.max(seg('studio').start, studioEnd - 0.6), to: WIDE, d: 0.5 },
  // a hard punch-in or -out on every cut of the result (Yar: more cuts)
  ...CUTS.map((c, k) => ({ at: seg('cut' + k).start, to: c.focus ? pose(...c.focus) : (k % 2 ? WIDE : pose(960, 540, 1.22)), d: 0 })),
  { at: recEnd - GROW - 0.7, to: WIDE, d: 0.6 },
].sort((a, b) => a.at - b.at)
const camTl = cam.map((c) => c.d === 0
  ? `tl.set("#cam", { x: ${c.to.x}, y: ${c.to.y}, scale: ${c.to.scale} }, ${r2(c.at)});`
  : `tl.to("#cam", { x: ${c.to.x}, y: ${c.to.y}, scale: ${c.to.scale}, duration: ${c.d}, ease: "power2.inOut" }, ${r2(c.at)});`).join('\n      ')

// ------------------------------------------------------------ the lead in its bubble, through the whole recording
const LOOPLEN = dur('assets/pip-talk.mp4')
const pipClips = []
const tile = (src, from, to) => { for (let t = from; t < to - 0.05; t += LOOPLEN) pipClips.push({ src, start: t, len: Math.min(LOOPLEN, to - t), media: 0 }) }
tile('pip-work', PAINT.aEnd + GROW, studioEnd)
CUTS.forEach((c, k) => { const sg = seg('cut' + k); tile(c.pip || (k === CUTS.length - 1 ? 'pip-talk' : 'pip-listen'), sg.start, sg.start + sg.len) })
const PIP = { from: PAINT.aEnd + GROW, to: recEnd - GROW }
// the corner bubble covered the recording (Yar, 2026-09-26): off unless topic.json asks for it with "pip": true
const SHOW_PIP = topic.pip === true
if (!SHOW_PIP) pipClips.length = 0

// ------------------------------------------------------------ audio
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', 'assets/bgm/bed.wav', '-af', `atrim=0:${r2(total)},afade=t=in:d=0.6,afade=t=out:st=${r2(total - 2.5)}:d=2.5`, '-ar', '48000', 'assets/bgm/bed-cut.wav'])

const cutSegs = segs.filter((x) => x.id.startsWith('cut'))
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #F6EEDD; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #F6EEDD; }
      .paint { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #rec { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; overflow: hidden; transform-origin: 0 0; will-change: transform; }
      #cam { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; transform-origin: 0 0; will-change: transform; }
      .shot { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #pip { position: absolute; left: 36px; top: 774px; width: 270px; height: 270px; border-radius: 50%; overflow: hidden;
        border: 6px solid #2B2233; box-shadow: 0 8px 0 rgba(43,34,51,0.9); background: #F7F0E2; transform-origin: 50% 100%; }
      .pipv { position: absolute; left: -105px; top: 0; width: 480px; height: 270px; object-fit: cover; }${yar ? yar.css : ''}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${r2(total)}" data-width="1920" data-height="1080">
      <video id="paint-a" class="clip paint" src="assets/painted.mp4" ${clipAttrs(0, PAINT.aEnd + GROW, 0)} data-media-start="0" muted playsinline></video>
      <video id="paint-c" class="clip paint" src="assets/painted.mp4" ${clipAttrs(cStart, total - cStart, 0)} data-media-start="${PAINT.aHold}" muted playsinline></video>
${yar ? yar.html : ''}
      <div id="rec">
        <div id="cam" data-layout-allow-overflow>
          <video id="shot-studio" class="clip shot" src="assets/recording.mp4" ${clipAttrs(seg('studio').start, seg('studio').len, 1)} data-media-start="${r2(seg('studio').in)}" data-playback-rate="${seg('studio').rate}" muted playsinline></video>
${cutSegs.map((c, i) => `          <video id="shot-${c.id}" class="clip shot" src="assets/recording.mp4" ${clipAttrs(c.start, c.len, 2 + (i % 2))} data-media-start="${r2(c.in)}" muted playsinline></video>`).join('\n')}
        </div>
      </div>
${SHOW_PIP ? `      <div id="pip" data-layout-allow-overflow>
${pipClips.map((c, i) => `        <video id="pip-${i}" class="clip pipv" src="assets/${c.src}.mp4" ${clipAttrs(c.start, c.len, 40 + (i % 2))} data-media-start="${r2(c.media)}" muted playsinline></video>`).join('\n')}
      </div>` : ''}
${R.audio ? cutSegs.map((c, i) => `      <audio id="audio-${c.id}" src="assets/recording.mp4" ${clipAttrs(c.start, c.len, 9 + (i % 2))} data-media-start="${r2(c.in)}" data-volume="1"></audio>`).join('\n') : ''}
${vo.map((v) => `      <audio id="vo-${v.id}" src="assets/vo/${v.id}.wav" ${clipAttrs(v.start, v.len, 11)} data-volume="1"></audio>`).join('\n')}
      <audio id="bed" src="assets/bgm/bed-cut.wav" ${clipAttrs(0, total, 12)} data-volume="0.45"></audio>
${sfx.map((s, i) => `      <audio id="sfx-${i}" src="assets/sfx/${s.src}" ${clipAttrs(s.at, s.len, s.track)} data-volume="${s.vol}"></audio>`).join('\n')}
      <div id="captions-host" data-composition-id="captions" data-composition-src="compositions/captions.html" ${clipAttrs(0, total, 20)} data-width="1920" data-height="1080" data-track-kind="captions"></div>
      <div id="endcard-host" data-composition-id="endcard" data-composition-src="compositions/endcard.html" ${clipAttrs(endStart, endLen, 30)} data-width="1920" data-height="1080"></div>
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      tl.set("#rec", { x: ${MONITOR.x}, y: ${MONITOR.y}, scale: ${r2(MONITOR.scale * 1e4) / 1e4} }, 0);
      tl.to("#rec", { x: 0, y: 0, scale: 1, duration: ${GROW}, ease: "power2.inOut" }, ${PAINT.aEnd});
      tl.to("#rec", { x: ${MONITOR.x}, y: ${MONITOR.y}, scale: ${r2(MONITOR.scale * 1e4) / 1e4}, duration: ${GROW}, ease: "power2.inOut" }, ${r2(recEnd - GROW)});
      tl.set("#cam", { x: 0, y: 0, scale: 1 }, 0);
      ${SHOW_PIP ? `tl.set("#pip", { scale: 0 }, 0);
      tl.to("#pip", { scale: 1, duration: 0.45, ease: "back.out(2)" }, ${r2(PIP.from)});
      tl.to("#pip", { scale: 0, duration: 0.3, ease: "back.in(2)" }, ${r2(PIP.to - 0.3)});` : ''}
      ${camTl}
      ${yar ? yar.tweens.join('\n      ') : ''}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`
fs.writeFileSync('index.html', html)
console.log('segments', segs.map((s) => `${s.id} ${r2(s.start)}→${r2(s.start + s.len)} (src ${r2(s.in)}→${r2(s.out)} @${s.rate}x)`).join(' | '))
console.log('painted C from', r2(cStart), '· shot C lt0 at', r2(C0), '· end card', r2(endStart), '· total', r2(total))
