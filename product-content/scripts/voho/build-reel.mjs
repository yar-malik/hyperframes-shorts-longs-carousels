/**
 * The 9:16 reel for one topic: a designed cover frame (the thumbnail), the painted hook, the best turns of the real
 * call, the painted payoff and app.voho.ai. Headline above the card, captions below it.
 *
 *   node scripts/voho/build-reel.mjs <workspace>      → <workspace>/reel/index.html
 *
 * topic.json → reel: { headline: [line 1, line 2], tags: [hook, call, payoff], segments: [segment indices to keep] }
 * Generalized from videos/voho-property-hum-reel/build.mjs.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const WS = path.resolve(process.argv[2] ?? '.')
process.chdir(path.join(WS, 'reel'))
const topic = JSON.parse(fs.readFileSync('../topic.json', 'utf8'))
const SEG = JSON.parse(fs.readFileSync('../segments.json', 'utf8')).segments
const marks = JSON.parse(fs.readFileSync('assets/marks.json', 'utf8')).marks
const at = (name) => { const m = marks.find((x) => x.name === name); if (!m) throw new Error('no mark ' + name); return m.t }
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())
const r2 = (n) => Math.round(n * 100) / 100
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const clip = (start, len, track) => `data-start="${r2(start)}" data-duration="${r2(len)}" data-track-index="${track}"`

// ------------------------------------------------------------ the cut
/* Frame one is the thumbnail: Instagram and Facebook take the first frame as a reel's cover when it's posted
   through an API, so the reel opens on a designed still (Hum answering at 11pm, headline fully set) for COVER s. */
const COVER = 0.6
const A = { start: COVER, in: 0, len: 10.2 }                                           // painted: the 11pm call
/* The call, tightened: the agent's 1.5-2 s think before each reply is cut, and its first answer ("could you give
   me the name and number?") is dropped because the caller gives them straight after. Every word left is real.
   Speech ranges measured with silencedetect on the capture (-38 dB, 0.35 s). */
/* The call, cut tight: the turns topic.reel.segments names (every word in them is real). Keep it to about 15-20 s. */
const PICKED = (topic.reel?.segments ?? SEG.map((x) => x.i).slice(1, 5)).map((i) => SEG[i])
const calls = PICKED.map((c) => ({ in: c.in, out: c.out, who: c.who, i: c.i }))
let cur = A.start + A.len
for (const c of calls) { c.start = cur; c.len = c.out - c.in; cur += c.len }
const C = { start: cur, in: 12.4, len: 10.8 }                                         // painted: the stamp, every phone answered
const total = C.start + C.len
const tlOf = (src) => { const c = calls.find((x) => src >= x.in - 1e-6 && src <= x.out + 1e-6); if (!c) throw new Error('cut ' + src); return c.start + src - c.in }
const cT = (media) => C.start + media - C.in                                         // painted-render time → reel time

// ------------------------------------------------------------ voice, subtitles
// the promise, then the problem, over the painted hook; the payoff and sign-off at the end (Yar's order, 2026-09-25)
const V = { v1: { start: A.start + 0.1, len: dur('assets/vo/v1.wav') }, v2: { len: dur('assets/vo/v2.wav') }, v6: { start: C.start + 0.7, len: dur('assets/vo/v6.wav') } }
V.v2.start = V.v1.start + V.v1.len + 0.2
if (V.v6.start + V.v6.len > total - 0.4) console.warn('! v6 runs to the end')
const words = (id) => JSON.parse(fs.readFileSync(`assets/vo/${id}.words.json`, 'utf8')).transcription
  .map((w) => ({ text: w.text.trim(), t: w.offsets.from / 1000 })).filter((w) => w.text)
const subOf = (i) => { const x = topic.subtitles?.[i]; return typeof x === 'string' ? x : x?.en ?? '' }
const lines = calls.map((c) => ({ who: c.who, text: subOf(c.i), from: c.start + 0.05, to: c.start + (c.out - c.in) })).filter((l) => l.text)
const caps = [
  { id: 'cap-v1', from: V.v1.start - 0.05, to: V.v2.start - 0.05, kind: 'vo', words: words('v1'), t0: V.v1.start },
  { id: 'cap-v2', from: V.v2.start - 0.05, to: A.start + A.len, kind: 'vo', words: words('v2'), t0: V.v2.start },
  ...lines.map((l, i) => ({ id: `cap-call-${i}`, from: l.from, to: l.to, kind: `call ${l.who}`, text: l.text, who: l.who })),
  { id: 'cap-v6', from: V.v6.start - 0.1, to: total, kind: 'vo', words: words('v6'), t0: V.v6.start },
]
const [TAG1, TAG2, TAG3] = topic.reel?.tags ?? ['Every phone ringing', 'A real call · in Saudi Arabic', 'Booked · nobody at the desk']
const tags = [
  { id: 'tag-1', text: TAG1, from: 0, to: A.start + A.len },
  { id: 'tag-2', text: TAG2, from: A.start + A.len, to: C.start },
  { id: 'tag-3', text: TAG3, from: C.start, to: total },
]

// ------------------------------------------------------------ sound effects
const sfx = []
const add = (src, t, vol) => sfx.push({ src, at: t, vol })
const a = (t) => A.start + t                                                            // painted-A time → reel time
add('ring.wav', a(1.6), 0.3)
for (let i = 0; i < 4; i++) { add('ring.wav', a(2.9 + i * .35), 0.26); add('pop.mp3', a([4.5, 4.85, 5.2, 5.55][i]), 0.5) }
for (const t of [1.4, 2.8, 4.4, 6.8, 8.1]) add('whoosh-short.mp3', a(t) - 0.05, 0.22)                       // every hard cut
add('whoosh-short.mp3', a(A.len) - 0.15, 0.4)
const GREET = SEG[0].speechIn ?? SEG[0].in
sfx.push({ src: '../walkthrough.mp4', at: a(6.9), vol: 0.85, mediaStart: GREET, len: Math.min(3, SEG[0].out - GREET) })   // the crew picks up: Layla's real greeting
add('pop.mp3', V.v6.start + 4.4, 0.45)                                                         // the app.voho.ai button
add('ding.wav', total - 1.5, 0.4)
add('pop.mp3', 0.02, 0.45); add('ring.wav', 0.05, 0.32)                                                      // the cover opens on the phones ringing, not silence
add('whoosh-short.mp3', V.v6.start + V.v6.len + 0.1, 0.3); add('pop.mp3', V.v6.start + V.v6.len + 0.8, 0.35)  // no gap after the last line                                                                // sign-off
for (let i = 1; i < calls.length; i++) add('tick.wav', calls[i].start, 0.4)                                // the jump cuts in the call
add('ding.wav', calls[calls.length - 1].start + calls[calls.length - 1].len - 0.9, 0.55)                     // booked
add('pop.mp3', C.start + 0.05, 0.3)
add('ping.mp3', cT(13.3), 0.55)                                                                             // the stamp
for (let i = 0; i < 8; i++) add('pop.mp3', cT(14.4 + (i % 4) * .12 + (i >= 4 ? .05 : 0)), 0.3)            // the crew bursts out
add('whoosh-short.mp3', cT(17.2), 0.22); add('whoosh-short.mp3', cT(18.6), 0.22)
const ends = []
for (const e of sfx.sort((a, b) => a.at - b.at)) {
  e.len = e.len ?? Math.min(dur('assets/sfx/' + e.src), total - e.at)
  let k = ends.findIndex((x) => x <= e.at + 1e-3); if (k < 0) { k = ends.length; ends.push(0) }
  ends[k] = e.at + e.len; e.track = 13 + k
}

execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', 'assets/bgm/bed.wav', '-af', `atrim=0:${r2(total)},afade=t=in:d=0.02,afade=t=out:st=${r2(total - 0.3)}:d=0.3`, '-ar', '48000', 'assets/bgm/bed-reel.wav'])

// ------------------------------------------------------------ layout: 1080x1920
const CARD = { x: 40, y: 640, w: 1000 }; CARD.s = (CARD.w - 10) / 1920; CARD.h = 1080 * CARD.s + 10
const pose = (fx, fy, sc) => ({ x: r2(Math.min(0, Math.max(1920 - 1920 * sc, 960 - fx * sc))), y: r2(Math.min(0, Math.max(1080 - 1080 * sc, 540 - fy * sc))), scale: sc })
const PANEL = pose(1640, 480, 1.9), PANEL2 = pose(1600, 430, 1.5)   // alternate on every cut            // the console's test panel: the live transcript of the call

// the crew on screen the whole time (Yar: "show these characters a lot"): Hum's bubble on the card's corner during
// the call, and the whole crew dancing in a strip under everything, tiled from 8-beat loops
const LOOPLEN = dur('assets/pip-talk.mp4'), STRIPLEN = dur('assets/crew-strip.mp4')
const pipClips = []
calls.forEach((c) => { for (let t = c.start; t < c.start + c.len - 0.05; t += LOOPLEN) pipClips.push({ src: c.who === 'agent' ? 'pip-talk' : 'pip-listen', start: t, len: Math.min(LOOPLEN, c.start + c.len - t) }) })
const stripClips = []
for (let t = 0; t < total - 0.05; t += STRIPLEN) stripClips.push({ start: t, len: Math.min(STRIPLEN, total - t) })
const PIPR = { x: CARD.x + CARD.w - 200, y: CARD.y + Math.round(CARD.h) - 210, d: 240 }

const mark = (size) => `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#09090b"/><g fill="#f4f4f5"><rect x="10.5" y="25" width="7" height="14" rx="3.5"/><rect x="22.5" y="16" width="7" height="32" rx="3.5"/><rect x="34.5" y="21" width="7" height="22" rx="3.5"/><rect x="46.5" y="26" width="7" height="12" rx="3.5"/></g></svg>`
const capHtml = (c) => c.words
  ? `<span class="inner">${c.words.map((w, j) => `<span class="w" id="${c.id}-w${j}">${esc(w.text)}</span>`).join(' ')}</span>`
  : `<span class="inner"><em>${c.who === 'agent' ? 'Layla · AI receptionist' : 'Caller'}</em>${esc(c.text)}</span>`

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Geist"; src: url("assets/fonts/Geist-Medium.woff2") format("woff2"); font-weight: 500; }
      @font-face { font-family: "Geist"; src: url("assets/fonts/Geist-SemiBold.woff2") format("woff2"); font-weight: 600; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: #F6EEDD; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #F6EEDD; font-family: "Geist", ui-sans-serif, system-ui, sans-serif; color: #2B2233; }
      #head { position: absolute; left: 60px; right: 60px; top: 180px; display: flex; flex-direction: column; align-items: center; gap: 22px; text-align: center; }
      .brand { display: flex; align-items: center; gap: 14px; font-weight: 600; font-size: 40px; letter-spacing: -0.03em; color: #09090b; }
      h1 { font-weight: 600; font-size: 74px; line-height: 1.02; letter-spacing: -0.035em; }
      h1 span { color: #016838; }
      #card { position: absolute; left: ${CARD.x}px; top: ${CARD.y}px; width: ${CARD.w}px; height: ${r2(CARD.h)}px; border-radius: 30px; overflow: hidden;
        border: 5px solid #2B2233; box-shadow: 0 14px 0 rgba(43,34,51,0.92); background: #F6EEDD; }
      #stage { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; transform: scale(${r2(CARD.s * 1e4) / 1e4}); transform-origin: 0 0; }
      .paint, .shot { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #cam { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; transform-origin: 0 0; }
      .tag { position: absolute; left: 0; right: 0; top: ${CARD.y - 34}px; display: flex; justify-content: center; }
      .tag .inner { display: inline-block; padding: 10px 26px; border-radius: 999px; background: #2EC27E; color: #05231a; font-weight: 600; font-size: 30px;
        border: 4px solid #2B2233; }
      .cap { position: absolute; left: 60px; right: 60px; top: ${CARD.y + Math.round(CARD.h) + 64}px; display: flex; justify-content: center; text-align: center; }
      .cap.vo .inner { font-weight: 600; font-size: 54px; line-height: 1.16; letter-spacing: -0.02em; color: #2B2233; }
      .cap.vo .w { color: rgba(43,34,51,0.58); }
      .cap.call .inner { display: inline-block; padding: 20px 30px; border-radius: 24px; background: #2B2233; color: #FFF5E2; font-weight: 500; font-size: 42px; line-height: 1.22; }
      .cap.call em { display: block; font-style: normal; font-size: 24px; letter-spacing: 0.12em; text-transform: uppercase; color: #C6BCAB; margin-bottom: 8px; }
      .cap.call.agent em { color: #57D79B; }
      #rpip { position: absolute; left: ${PIPR.x}px; top: ${PIPR.y}px; width: ${PIPR.d}px; height: ${PIPR.d}px; border-radius: 50%; overflow: hidden;
        border: 5px solid #2B2233; box-shadow: 0 8px 0 rgba(43,34,51,0.9); background: #F7F0E2; transform-origin: 50% 50%; }
      .pipv { position: absolute; left: ${-Math.round((PIPR.d * 16 / 9 - PIPR.d) / 2)}px; top: 0; width: ${Math.round(PIPR.d * 16 / 9)}px; height: ${PIPR.d}px; object-fit: cover; }
      #strip { position: absolute; left: 0; top: 1640px; width: 1080px; height: 280px; overflow: hidden; }
      .stripv { position: absolute; left: 0; top: -290px; width: 1080px; height: 608px; object-fit: cover; }
      #cta { position: absolute; left: 0; right: 0; top: ${CARD.y + Math.round(CARD.h) + 330}px; display: flex; justify-content: center; }
      #cta .inner { display: inline-block; padding: 18px 42px; border-radius: 999px; background: #016838; color: #FFF5E2; font-weight: 600; font-size: 44px; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${r2(total)}" data-width="1080" data-height="1920">
      <div id="head">
        <div class="brand">${mark(56)}<span>voho</span></div>
        <h1>${esc((topic.reel?.headline ?? [topic.title, 'AI answers in Saudi Arabic.'])[0])}<br /><span>${esc((topic.reel?.headline ?? ['', 'AI answers in Saudi Arabic.'])[1])}</span></h1>
      </div>
      <div id="card">
        <div id="stage">
          <img id="cover" class="clip paint" src="assets/cover.png" ${clip(0, COVER, 0)} alt="" />
          <video id="paint-a" class="clip paint" src="assets/painted.mp4" ${clip(A.start, A.len, 0)} data-media-start="${A.in}" muted playsinline></video>
          <div id="cam" data-layout-allow-overflow>
${calls.map((c, i) => `            <video id="call-${i}" class="clip shot" src="assets/walkthrough.mp4" ${clip(c.start, c.len, 1)} data-media-start="${r2(c.in)}" muted playsinline></video>`).join('\n')}
          </div>
          <video id="paint-c" class="clip paint" src="assets/painted.mp4" ${clip(C.start, C.len, 2)} data-media-start="${C.in}" muted playsinline></video>
        </div>
      </div>
${tags.map((t, i) => `      <div class="clip tag" id="${t.id}" ${clip(t.from, t.to - t.from, 3 + (i % 2))}><span class="inner">${esc(t.text)}</span></div>`).join('\n')}
${caps.map((c, i) => `      <div class="clip cap ${c.kind}" id="${c.id}" ${clip(c.from, c.to - c.from, 5 + (i % 2))}>${capHtml(c)}</div>`).join('\n')}
      <div id="strip" data-layout-allow-overflow>
${stripClips.map((c, i) => `        <video id="strip-${i}" class="clip stripv" src="assets/crew-strip.mp4" ${clip(c.start, c.len, 30 + (i % 2))} data-media-start="0" muted playsinline></video>`).join('\n')}
      </div>
      <div id="rpip" data-layout-allow-overflow>
${pipClips.map((c, i) => `        <video id="rpip-${i}" class="clip pipv" src="assets/${c.src}.mp4" ${clip(c.start, c.len, 32 + (i % 2))} data-media-start="0" muted playsinline></video>`).join('\n')}
      </div>
      <img id="cover-full" class="clip" src="assets/thumb-reel.png" ${clip(0, COVER, 60)} alt="" style="position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:50" />
      <div class="clip" id="cta" ${clip(V.v6.start + 4.4, total - V.v6.start - 4.4, 7)}><span class="inner">app.voho.ai</span></div>
${calls.map((c, i) => `      <audio id="call-audio-${i}" src="assets/walkthrough.mp4" ${clip(c.start, c.len, 10)} data-media-start="${r2(c.in)}" data-volume="1"></audio>`).join('\n')}
${Object.entries(V).map(([id, v]) => `      <audio id="vo-${id}" src="assets/vo/${id}.wav" ${clip(v.start, v.len, 11)} data-volume="1"></audio>`).join('\n')}
      <audio id="bed" src="assets/bgm/bed-reel.wav" ${clip(0, total, 12)} data-volume="0.34"></audio>
${sfx.map((s, i) => `      <audio id="sfx-${i}" src="assets/sfx/${s.src}" ${clip(s.at, s.len, s.track)}${s.mediaStart != null ? ` data-media-start="${s.mediaStart}"` : ''} data-volume="${s.vol}"></audio>`).join('\n')}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      tl.fromTo("#head h1", { scale: 1 }, { scale: 1.04, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }, ${r2(COVER)});   // set from frame one: it's the cover
      tl.set("#cam", { x: ${PANEL.x}, y: ${PANEL.y}, scale: ${PANEL.scale} }, 0);
      tl.set("#rpip", { scale: 0 }, 0);
      tl.to("#rpip", { scale: 1, duration: 0.4, ease: "back.out(2)" }, ${r2(calls[0].start)});
      tl.to("#rpip", { scale: 0, duration: 0.25, ease: "back.in(2)" }, ${r2(C.start - 0.25)});
${calls.map((c, i) => { const P = i % 2 ? PANEL2 : PANEL; return `      tl.set("#cam", { x: ${P.x}, y: ${P.y}, scale: ${P.scale} }, ${r2(c.start)});` }).join('\n')}
${tags.filter((t) => t.from > 0).map((t) => `      tl.fromTo("#${t.id} .inner", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }, ${r2(t.from)});`).join('\n')}
${caps.map((c) => `      tl.fromTo("#${c.id} .inner", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power3.out" }, ${r2(c.from)});`).join('\n')}
${caps.filter((c) => c.words).flatMap((c) => c.words.map((w, j) => `      tl.to("#${c.id}-w${j}", { color: "#2B2233", duration: 0.08 }, ${r2(c.t0 + w.t)});`)).join('\n')}
      tl.fromTo("#cta .inner", { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.2)" }, ${r2(V.v6.start + 4.4)});
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`
fs.writeFileSync('index.html', html)
console.log('A 0→9.6 | calls', calls.map((c) => `${r2(c.start)}→${r2(c.start + c.len)}`).join(', '), '| C', r2(C.start), '→', r2(total), '| v6', r2(V.v6.start), '→', r2(V.v6.start + V.v6.len))
