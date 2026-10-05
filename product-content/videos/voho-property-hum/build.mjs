// Writes index.html + compositions/*.html for the Voho real estate video (the Hum crew; clinic video's build, re-cut). Every time here is derived from a file:
// the capture's marks.json, the narration's real lengths and word timings, and the painted render's shot times
// (open-source/animation-base/src/scenes/yar-voho-clinic.js). Re-run after changing any of them.
//
//   painted A (Hum, 11pm) → grows out of the painted monitor into → the studio (1.5x) → the live call (1x, real
//   audio) → shrinks back into the monitor → painted C (booked, every call answered) → end card.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const marks = JSON.parse(fs.readFileSync('assets/marks.json', 'utf8')).marks
const at = (name) => { const m = marks.find((x) => x.name === name); if (!m) throw new Error('no mark ' + name); return m.t }
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())
const r2 = (n) => Math.round(n * 100) / 100
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const clipAttrs = (start, len, track) => `data-start="${r2(start)}" data-duration="${r2(len)}" data-track-index="${track}"`

// ------------------------------------------------------------ the painted render (see yar-voho-clinic.js)
const PAINT = { aEnd: 10.2, aHold: 9.5, len: dur('assets/painted.mp4') }  // A holds on the monitor from 9.5 to 10.2
const MONITOR = { x: 560, y: 315, scale: 800 / 1920 }                      // the monitor's screen, in output px
const GROW = 0.7                                                            // recording grows out / shrinks back in

// ------------------------------------------------------------ the recording: two source ranges
/* More cuts (Yar, 2026-09-25): the studio at 1.6x, then the call as one cut per turn with the agent's think-time
   removed. Speech ranges measured with silencedetect (-38 dB, 0.4 s) on this capture; every word is kept. */
const CALL = [
  [56.4, 64.35, 'dial + greeting'], [65.45, 69.6, 'caller 1'], [71.0, 77.9, 'agent 1'], [79.5, 82.05, 'caller 2'],
  [83.55, 90.0, 'agent 2'], [91.7, 95.2, 'caller 3'], [96.55, 101.4, 'agent 3'], [103.15, 111.8, 'caller 4'], [113.6, 117.85, 'agent 4'],
]
const segs = [
  { id: 'studio', in: at('create_agent') - 0.6, out: at('saved') + 1.0, rate: 1.6 },
  ...CALL.map(([a, b], i) => ({ id: 'call' + i, in: a, out: b, rate: 1 })),
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
const T = (name, d = 0) => tl(at(name) + d)

// painted C picks up under the shrink, from A's monitor hold, and runs to the end of the render
const cStart = recEnd - GROW                       // painted clip 2 starts here, at media time PAINT.aHold
const C0 = recEnd - GROW + (PAINT.aEnd - PAINT.aHold)   // timeline time of shot C's lt = 0
const total = cStart + (PAINT.len - PAINT.aHold)

// ------------------------------------------------------------ narration
const vo = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'].map((id) => ({ id, len: dur(`assets/vo/${id}.wav`) }))
const V = Object.fromEntries(vo.map((v) => [v.id, v]))
V.v1.start = 0.5
V.v2.start = seg('studio').start + 0.5
V.v3.start = Math.max(V.v2.start + V.v2.len + 0.3, T('instructions_focus'))
V.v4.start = seg('call0').start + 0.2
V.v5.start = C0 + 1.1
V.v6.start = V.v5.start + V.v5.len + 0.35
for (const v of vo) console.log(v.id.padEnd(3), r2(v.start), '→', r2(v.start + v.len))
if (V.v3.start + V.v3.len > seg('call0').start) console.warn('! v3 runs into the call')
if (V.v4.start + V.v4.len > tl(59.9)) console.warn('! v4 runs into the agent greeting')
if (V.v6.start + V.v6.len > total - 0.6) console.warn('! v6 runs to the end')

// ------------------------------------------------------------ captions
const steps = [
  { n: 1, text: 'Create an agent', from: seg('studio').start + 0.6, to: T('studio_loaded', -0.2) },
  { n: 2, text: 'Name it, set Saudi Arabic', from: T('studio_loaded'), to: T('instructions_focus', -0.2) },
  { n: 3, text: 'Listings, rents, and: one short sentence per reply', from: T('instructions_focus'), to: T('greeting_focus', -0.2) },
  { n: 4, text: 'Welcome message, then Save', from: T('greeting_focus'), to: seg('studio').start + seg('studio').len },
  { n: 5, text: 'Call your agent', from: seg('call0').start + 0.2, to: tl(59.8) },
]
// English subtitles of the real call (Layla's replies are the model's own, from the console transcript)
const SUBS = [
  ['agent', 'Welcome to Dar Riyadh Properties, this is Layla. How can I help you?'],
  ['caller', "Peace be upon you. I'm looking for a three-bedroom flat to rent in north Riyadh."],
  ['agent', "Sure, we have a three-bedroom in Al Narjis and one in Al Malqa. What's your budget, roughly?"],
  ['caller', 'My budget is around seventy thousand a year.'],
  ['agent', "Great, there's a three-bedroom in Al Narjis at 70,000 riyals a year. Would you like to book a viewing?"],
  ['caller', "Great, I'd like to see it on Sunday at five in the afternoon."],
  ['agent', 'Sure, Sunday at five. Could I have your name and mobile number?'],
  ['caller', 'My name is Fahad Al-Qahtani, and my mobile is 055 765 4321.'],
  ['agent', 'Your viewing of the Al Narjis flat is confirmed for Sunday at five. Thank you.'],
]
const lines = SUBS.map(([who, text], i) => {
  const sg = seg('call' + i), from = i === 0 ? tl(59.9) : sg.start + 0.05
  return { who, text, from, to: sg.start + sg.len }
})

// Narration captions over the painted scenes, word by word (the P(doom) video's lyric pill).
const words = (id) => JSON.parse(fs.readFileSync(`assets/vo/${id}.words.json`, 'utf8')).transcription
  .map((w) => ({ text: w.text.trim(), t: w.offsets.from / 1000 })).filter((w) => w.text)
const voCaps = ['v1', 'v5', 'v6'].map((id) => ({ id, from: V[id].start - 0.1, to: V[id].start + V[id].len + 0.35, words: words(id) }))

// ------------------------------------------------------------ sound effects, placed on the painted action
const sfx = []
const add = (src, at, vol) => sfx.push({ src, at, vol })
add('ring.wav', 1.6, 0.3)                                            // the empty chair
for (let i = 0; i < 4; i++) { add('ring.wav', 1.5 + i * .35 + 1.4, 0.26); add('pop.mp3', [4.5, 4.85, 5.2, 5.55][i], 0.5) }  // the crew pops up
for (const t of [1.4, 2.8, 4.4, 6.8, 8.1]) add('whoosh-short.mp3', t - 0.05, 0.22)                                          // the hard cuts
add('whoosh-short.mp3', PAINT.aEnd - 0.1, 0.4)                       // into the monitor
sfx.push({ src: '../walkthrough.mp4', at: 6.9, vol: 0.85, mediaStart: 59.93, len: 2.95 })   // Saad picks up: Layla's real greeting
for (const m of ['create_agent', 'start_from_scratch', 'name_focus', 'language_pick', 'instructions_focus', 'greeting_focus', 'save']) add('tick.wav', T(m), 0.45)   // every click in the studio
for (let t = T('instructions_focus') + .3; t < T('instructions_done'); t += 0.09 + 0.05 * Math.abs(Math.sin(t * 13))) add('tick.wav', t, 0.12)   // typing
for (let t = T('greeting_focus') + .3; t < T('greeting_done'); t += 0.11) add('tick.wav', t, 0.12)
add('ding.wav', T('saved'), 0.4)
add('whoosh-short.mp3', seg('call0').start - 0.1, 0.35); add('ring.wav', seg('call0').start - 1.0, 0.22)   // the outgoing call
for (let i = 1; i < CALL.length; i++) add('tick.wav', seg('call' + i).start, 0.35)                                          // every cut in the call
add('ding.wav', seg('call8').start + seg('call8').len - 1.0, 0.55)   // booked
add('whoosh-short.mp3', recEnd - GROW - 0.1, 0.4)                    // back out of it
add('pop.mp3', C0 + 2.3, 0.45)                                       // the card
add('ping.mp3', C0 + 3.1, 0.55)                                      // the stamp
for (let i = 0; i < 8; i++) add('pop.mp3', C0 + 4.2 + (i % 4) * .12 + (i >= 4 ? .05 : 0), 0.3)                             // the crew bursts out
add('whoosh-short.mp3', C0 + 7.0, 0.22); add('whoosh-short.mp3', C0 + 8.4, 0.22)

// Each effect takes the first SFX track that is free for its whole length (tracks 13+), so none layer on one track.
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
const mark = (size) => `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#09090b"/><g fill="#f4f4f5"><rect x="10.5" y="25" width="7" height="14" rx="3.5"/><rect x="22.5" y="16" width="7" height="32" rx="3.5"/><rect x="34.5" y="21" width="7" height="22" rx="3.5"/><rect x="46.5" y="26" width="7" height="12" rx="3.5"/></g></svg>`

// Captions: step pills and call subtitles over the recording, the word-by-word pill over the painted scenes.
// None of them overlap in time, so they share the bottom of the frame.
const capClips = [
  ...steps.map((s, i) => ({ id: `step-${s.n}`, from: s.from, to: s.to, track: i % 2, cls: 'step',
    html: `<span class="inner"><b>${s.n}</b><span>${esc(s.text)}</span></span>` })),
  ...lines.map((l, i) => ({ id: `sub-${i}`, from: l.from, to: l.to, track: 2 + (i % 3), cls: `sub ${l.who}`,
    html: `<span class="inner"><em>${l.who === 'agent' ? 'Layla · AI receptionist' : 'Caller'}</em>${esc(l.text)}</span>` })),
  ...voCaps.map((c, i) => ({ id: `vo-${c.id}`, from: c.from, to: c.to, track: 5 + (i % 2), cls: 'lyric',
    html: `<span class="inner">${c.words.map((w, j) => `<span class="w" id="vo-${c.id}-w${j}">${esc(w.text)}</span>`).join(' ')}</span>` })),
]
const wordTweens = voCaps.flatMap((c) => c.words.map((w, j) =>
  `tl.to("#vo-${c.id}-w${j}", { color: "#8FF0BE", duration: 0.08 }, ${r2(V[c.id].start + w.t)});`))

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
        background: #2EC27E; color: #05231a; font-weight: 600; font-size: 25px; }
      .sub .inner { display: inline-block; max-width: 1280px; padding: 16px 30px; border-radius: 18px; background: rgba(43,34,51,0.9);
        color: #FFF5E2; font-size: 33px; line-height: 1.3; font-weight: 400; text-align: center; box-shadow: 0 10px 30px rgba(43,34,51,0.25); }
      .sub em { display: block; font-style: normal; font-size: 18px; letter-spacing: 0.12em; text-transform: uppercase; color: #C6BCAB; margin-bottom: 4px; }
      .sub.agent em { color: #57D79B; }
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

// End card: the brand and the address, floating over the painted room while Hum celebrates.
const endStart = V.v6.start + 2.2, endLen = total - endStart
fs.writeFileSync('compositions/endcard.html', `<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <style>${FONTS}
      #root { position: absolute; inset: 0; overflow: hidden; font-family: "Geist", ui-sans-serif, system-ui, sans-serif; }
      #end-card { position: absolute; left: 1060px; top: 70px; width: 720px; padding: 30px 40px 34px;
        border-radius: 28px; background: #FFF9EE; border: 3px solid #2B2233; box-shadow: 0 16px 0 rgba(43,34,51,0.9);
        display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
      .brand { display: flex; align-items: center; gap: 14px; font-weight: 600; font-size: 40px; letter-spacing: -0.03em; color: #09090b; }
      #end-card h1 { font-weight: 600; font-size: 50px; line-height: 1.05; letter-spacing: -0.03em; color: #2B2233; }
      .url { display: inline-block; padding: 14px 34px; border-radius: 999px; background: #016838; color: #FFF5E2; font-weight: 500; font-size: 34px; }
      </style>
      <div id="root" data-composition-id="endcard" data-width="1920" data-height="1080">
        <div id="end-card">
          <div class="brand">${mark(52)}<span>voho</span></div>
          <h1>Every buyer answered, in Saudi Arabic</h1>
          <span class="url">app.voho.ai</span>
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
const PANEL_A = pose(1560, 480, 1.45), PANEL_B = pose(1650, 520, 1.95)
const cam = [
  { at: T('studio_loaded', 0.2), to: pose(700, 470, 1.35), d: 0.6 },
  { at: T('greeting_focus', -0.5), to: pose(700, 640, 1.35), d: 0.5 },
  { at: T('save', -0.6), to: WIDE, d: 0.5 },
  { at: seg('call0').start, to: WIDE, d: 0 },
  { at: seg('call0').start + 1.2, to: PANEL_A, d: 0.9 },
  // a hard punch-in or -out on every cut of the call
  ...CALL.slice(1).map((_, k) => ({ at: seg('call' + (k + 1)).start, to: k % 2 ? PANEL_A : PANEL_B, d: 0 })),
  { at: recEnd - GROW - 0.7, to: WIDE, d: 0.6 },
]
const camTl = cam.map((c) => c.d === 0
  ? `tl.set("#cam", { x: ${c.to.x}, y: ${c.to.y}, scale: ${c.to.scale} }, ${r2(c.at)});`
  : `tl.to("#cam", { x: ${c.to.x}, y: ${c.to.y}, scale: ${c.to.scale}, duration: ${c.d}, ease: "power2.inOut" }, ${r2(c.at)});`).join('\n      ')

// ------------------------------------------------------------ audio
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', 'assets/bgm/bed.wav', '-af', `atrim=0:${r2(total)},afade=t=in:d=0.6,afade=t=out:st=${r2(total - 2.5)}:d=2.5`, '-ar', '48000', 'assets/bgm/bed-cut.wav'])

const callSegs = segs.filter((x) => x.id.startsWith('call'))
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
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${r2(total)}" data-width="1920" data-height="1080">
      <video id="paint-a" class="clip paint" src="assets/painted.mp4" ${clipAttrs(0, PAINT.aEnd + GROW, 0)} data-media-start="0" muted playsinline></video>
      <video id="paint-c" class="clip paint" src="assets/painted.mp4" ${clipAttrs(cStart, total - cStart, 0)} data-media-start="${PAINT.aHold}" muted playsinline></video>
      <div id="rec">
        <div id="cam" data-layout-allow-overflow>
          <video id="shot-studio" class="clip shot" src="assets/walkthrough.mp4" ${clipAttrs(seg('studio').start, seg('studio').len, 1)} data-media-start="${r2(seg('studio').in)}" data-playback-rate="1.5" muted playsinline></video>
${callSegs.map((c, i) => `          <video id="shot-${c.id}" class="clip shot" src="assets/walkthrough.mp4" ${clipAttrs(c.start, c.len, 2 + (i % 2))} data-media-start="${r2(c.in)}" muted playsinline></video>`).join('\n')}
        </div>
      </div>
${callSegs.map((c, i) => `      <audio id="audio-${c.id}" src="assets/walkthrough.mp4" ${clipAttrs(c.start, c.len, 9 + (i % 2))} data-media-start="${r2(c.in)}" data-volume="1"></audio>`).join('\n')}
${vo.map((v) => `      <audio id="vo-${v.id}" src="assets/vo/${v.id}.wav" ${clipAttrs(v.start, v.len, 11)} data-volume="1"></audio>`).join('\n')}
      <audio id="bed" src="assets/bgm/bed-cut.wav" ${clipAttrs(0, total, 12)} data-volume="0.28"></audio>
${sfx.map((s, i) => `      <audio id="sfx-${i}" src="assets/sfx/${s.src}" ${clipAttrs(s.at, s.len, s.track)}${s.mediaStart != null ? ` data-media-start="${s.mediaStart}"` : ''} data-volume="${s.vol}"></audio>`).join('\n')}
      <div id="captions-host" data-composition-id="captions" data-composition-src="compositions/captions.html" ${clipAttrs(0, total, 20)} data-width="1920" data-height="1080" data-track-kind="captions"></div>
      <div id="endcard-host" data-composition-id="endcard" data-composition-src="compositions/endcard.html" ${clipAttrs(endStart, endLen, 30)} data-width="1920" data-height="1080"></div>
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      // the recording grows out of the painted monitor, and later shrinks back into it
      tl.set("#rec", { x: ${MONITOR.x}, y: ${MONITOR.y}, scale: ${r2(MONITOR.scale * 1e4) / 1e4} }, 0);
      tl.to("#rec", { x: 0, y: 0, scale: 1, duration: ${GROW}, ease: "power2.inOut" }, ${PAINT.aEnd});
      tl.to("#rec", { x: ${MONITOR.x}, y: ${MONITOR.y}, scale: ${r2(MONITOR.scale * 1e4) / 1e4}, duration: ${GROW}, ease: "power2.inOut" }, ${r2(recEnd - GROW)});
      tl.set("#cam", { x: 0, y: 0, scale: 1 }, 0);
      ${camTl}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`
fs.writeFileSync('index.html', html)
console.log('segments', segs.map((s) => `${s.id} ${r2(s.start)}→${r2(s.start + s.len)} (src ${r2(s.in)}→${r2(s.out)} @${s.rate}x)`).join(' | '))
console.log('painted C from', r2(cStart), '· shot C lt0 at', r2(C0), '· end card', r2(endStart), '· total', r2(total))
