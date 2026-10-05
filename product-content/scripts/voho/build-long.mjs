/**
 * The long (16:9) Voho video for one topic: painted Hum crew → the real app.voho.ai recording grown out of the painted
 * monitor (the studio at 1.6x, then the call cut per turn) → back into the monitor → painted payoff → end card.
 *
 *   node scripts/voho/build-long.mjs <workspace>      → <workspace>/long/index.html + compositions/
 *
 * Reads <workspace>/topic.json (vo lines, subtitles, step 3 label, end card) and segments.json (scripts/voho/segments.mjs).
 * Generalized from videos/voho-property-hum/build.mjs.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { facecam } from '../avatar/facecam.mjs'

const WS = path.resolve(process.argv[2] ?? '.')
process.chdir(path.join(WS, 'long'))
const topic = JSON.parse(fs.readFileSync('../topic.json', 'utf8'))
const SEG = JSON.parse(fs.readFileSync('../segments.json', 'utf8')).segments
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
/* More cuts (Yar, 2026-09-25): the studio at real speed, then the call as one cut per turn with the think-time removed
   (segments.json). topic.long.segments picks which turns to keep; the default is all of them. */
const PICK = topic.long?.segments ?? SEG.map((x) => x.i)
const CALL = PICK.map((i) => SEG[i])
const segs = [
  { id: 'studio', in: at('create_agent') - 0.6, out: at('saved') + 1.0, rate: topic.long?.rate ?? 1 },   // real speed (Yar, 2026-09-26: 1.6x was too fast)
  ...CALL.map((c, i) => ({ id: 'call' + i, in: c.in, out: c.out, rate: 1 })),
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
// No music bed under a Voho video (Yar, 2026-10-01: "very loud and distracting"). "bed": true in topic.json brings it back.
// Without it nothing covers a gap, so the narration starts a beat earlier and every event on screen gets a sound.
const BED = topic.bed === true
const V = Object.fromEntries(vo.map((v) => [v.id, v]))
/* Yar's order (2026-09-25): the promise first ("Today I'll show you how to set up an AI agent in under 30 seconds…"),
   then the problem, then how — v1 + v2 over the painted open, v3 + v4 over the setup, v5 at the call, v6 the payoff. */
V.v1.start = 0.4
V.v2.start = V.v1.start + V.v1.len + 0.25
if (V.v2.start + V.v2.len > PAINT.aEnd + 0.3) console.warn('! v1 + v2 run past the painted open — shorten them')
V.v3.start = seg('studio').start + 0.4
V.v4.start = Math.max(V.v3.start + V.v3.len + 0.3, T('instructions_focus') - (BED ? 0 : 1.2))
V.v5.start = seg('call0').start + 0.2
V.v6.start = C0 + 1.1
for (const v of vo) console.log(v.id.padEnd(3), r2(v.start), '→', r2(v.start + v.len))
// Yar on camera for v1, the promise (scripts/avatar): a few seconds, then the painted story carries on
const yar = facecam({ start: V.v1.start, len: V.v1.len, clipAttrs, r2 })
if (V.v4.start + V.v4.len > seg('call0').start) console.warn('! v4 runs into the call')
const GREET = CALL[0].speechIn ?? CALL[0].in
if (V.v5.start + V.v5.len > tl(GREET)) console.warn('! v5 runs into the agent greeting')
if (V.v6.start + V.v6.len > total - 0.6) console.warn('! v6 runs to the end')

// ------------------------------------------------------------ captions
const steps = [
  { n: 1, text: 'Create an agent', from: seg('studio').start + 0.6, to: T('studio_loaded', -0.2) },
  { n: 2, text: 'Name it, set Saudi Arabic', from: T('studio_loaded'), to: T('instructions_focus', -0.2) },
  { n: 3, text: topic.long?.step3 ?? 'Write the instructions in Saudi Arabic', from: T('instructions_focus'), to: T('greeting_focus', -0.2) },
  { n: 4, text: 'Welcome message, then Save', from: T('greeting_focus'), to: seg('studio').start + seg('studio').len },
  { n: 5, text: 'Call your agent', from: seg('call0').start + 0.2, to: tl(GREET) - 0.1 },
]
// English subtitles of the real call: topic.subtitles[i] is segment i's line (the agent's words are the model's own,
// translated from the console transcript in segments.json — never paraphrased into something it didn't say)
const subOf = (i) => { const x = topic.subtitles?.[i]; return typeof x === 'string' ? x : x?.en ?? '' }
const lines = CALL.map((c, k) => {
  const sg = seg('call' + k), from = k === 0 ? tl(GREET) : sg.start + 0.05
  return { who: c.who, text: subOf(c.i), from, to: sg.start + sg.len }
}).filter((l) => l.text)
if (lines.length < CALL.length) console.warn(`! ${CALL.length - lines.length} call segment(s) have no subtitle in topic.json`)

// Narration captions over the painted scenes, word by word (the P(doom) video's lyric pill).
const words = (id) => JSON.parse(fs.readFileSync(`assets/vo/${id}.words.json`, 'utf8')).transcription
  .map((w) => ({ text: w.text.trim(), t: w.offsets.from / 1000 })).filter((w) => w.text)
const voCaps = ['v1', 'v2', 'v6'].map((id) => ({ id, from: V[id].start - 0.1, to: V[id].start + V[id].len + 0.35, words: words(id) }))

// ------------------------------------------------------------ sound effects, placed on the painted action
const sfx = []
const add = (src, at, vol) => sfx.push({ src, at, vol })
add('ring.wav', 1.6, 0.3)                                            // the empty chair
for (let i = 0; i < 4; i++) { add('ring.wav', 1.5 + i * .35 + 1.4, 0.26); add('pop.mp3', [4.5, 4.85, 5.2, 5.55][i], 0.5) }  // the crew pops up
for (const t of [1.4, 2.8, 4.4, 6.8, 8.1]) add('whoosh-short.mp3', t - 0.05, 0.22)                                          // the hard cuts
add('whoosh-short.mp3', PAINT.aEnd - 0.1, 0.4)                       // into the monitor
sfx.push({ src: '../walkthrough.mp4', at: 6.9, vol: 0.85, mediaStart: GREET, len: Math.min(3, CALL[0].out - GREET) })   // the crew picks up: Layla's real greeting
for (const m of ['create_agent', 'start_from_scratch', 'name_focus', 'language_pick', 'instructions_focus', 'greeting_focus', 'save']) add('tick.wav', T(m), 0.45)   // every click in the studio
for (let t = T('instructions_focus') + .3; t < T('instructions_done'); t += 0.09 + 0.05 * Math.abs(Math.sin(t * 13))) add('tick.wav', t, 0.12)   // typing
for (let t = T('greeting_focus') + .3; t < T('greeting_done'); t += 0.11) add('tick.wav', t, 0.12)
add('ding.wav', T('saved'), 0.4)
for (let t = T('name_focus') + .3; t < T('language_pick'); t += 0.1) add('tick.wav', t, 0.14)              // typing the agent's name
for (const st of steps) add('pop.mp3', st.from, 0.3)                                                        // every step pill
add('whoosh-short.mp3', seg('call0').start - 0.1, 0.35); add('ring.wav', seg('call0').start - 1.0, 0.22)   // the outgoing call
for (let i = 1; i < CALL.length; i++) add('tick.wav', seg('call' + i).start, 0.35)                                          // every cut in the call
add('ding.wav', seg('call' + (CALL.length - 1)).start + seg('call' + (CALL.length - 1)).len - 1.0, 0.55)   // booked
add('whoosh-short.mp3', recEnd - GROW - 0.1, 0.4)                    // back out of it
add('pop.mp3', C0 + 2.3, 0.45)                                       // the card
add('ping.mp3', C0 + 3.1, 0.55)                                      // the stamp
for (let i = 0; i < 8; i++) add('pop.mp3', C0 + 4.2 + (i % 4) * .12 + (i >= 4 ? .05 : 0), 0.3)                             // the crew bursts out
add('whoosh-short.mp3', C0 + 7.0, 0.22); add('whoosh-short.mp3', C0 + 8.4, 0.22)

if (!BED) {
  // Typing and clicks have to be heard on their own now. Levels measured against QA's floor (every second above
  // -34 dB mean): a 30 ms tick or a lone ping at the old volumes read around -40.
  for (const e of sfx) if (e.src === 'tick.wav') e.vol = e.vol < 0.2 ? 0.75 : 0.8
  add('pop.mp3', T('studio_loaded'), 0.7)
  add('ping.mp3', T('name_focus') + 0.9, 0.85); add('pop.mp3', T('language_pick') - 0.35, 0.85)   // the name is in
  add('ping.mp3', T('language_pick') + 0.5, 0.8)                     // Saudi Arabic picked
  add('pop.mp3', T('instructions_done') + 0.1, 0.7)
  add('ping.mp3', T('greeting_done') + 0.1, 0.85)
  add('pop.mp3', T('save') - 0.6, 0.8)
  add('pop.mp3', T('save') + 0.2, 0.9)
  for (const e of sfx) if (e.src === 'ding.wav' && Math.abs(e.at - T('saved')) < 0.01) e.vol = 0.9
  add('ding.wav', C0 + 0.05, 0.9)                                    // back in the painted room
  add('ding.wav', total - 3.4, 1); add('pop.mp3', total - 2.85, 0.85); add('ping.mp3', total - 2.3, 0.9); add('ding.wav', total - 1.25, 0.9)   // the end card lands
}

// Each effect takes the first SFX track that is free for its whole length (tracks 13+), so none layer on one track.
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
          <h1>${esc(topic.endcard ?? 'Every call answered, in Saudi Arabic')}</h1>
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

// ------------------------------------------------------------ the Hum bubble (Yar: show the characters a lot)
/* Through the whole recording, Hum sits in a painted bubble in the corner: busy during the setup, talking over Layla's
   turns, nodding along to the caller. Each loop is 12 beats; clips tile it so it never visibly restarts. */
const LOOPLEN = dur('assets/pip-talk.mp4')
const pipClips = []
const tile = (src, from, to) => { for (let t = from; t < to - 0.05; t += LOOPLEN) pipClips.push({ src, start: t, len: Math.min(LOOPLEN, to - t), media: 0 }) }
tile('pip-work', PAINT.aEnd + GROW, seg('studio').start + seg('studio').len)
CALL.forEach((c, k) => { const sg = seg('call' + k); tile(c.who === 'agent' ? 'pip-talk' : 'pip-listen', sg.start, sg.start + sg.len) })
const PIP = { from: PAINT.aEnd + GROW, to: recEnd - GROW }
// the corner bubble covered the recording (Yar, 2026-09-26): off unless topic.json asks for it with "pip": true
const SHOW_PIP = topic.pip === true
if (!SHOW_PIP) pipClips.length = 0

// ------------------------------------------------------------ audio
if (BED) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', 'assets/bgm/bed.wav', '-af', `atrim=0:${r2(total)},afade=t=in:d=0.6,afade=t=out:st=${r2(total - 2.5)}:d=2.5`, '-ar', '48000', 'assets/bgm/bed-cut.wav'])

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
          <video id="shot-studio" class="clip shot" src="assets/walkthrough.mp4" ${clipAttrs(seg('studio').start, seg('studio').len, 1)} data-media-start="${r2(seg('studio').in)}" data-playback-rate="${seg('studio').rate}" muted playsinline></video>
${callSegs.map((c, i) => `          <video id="shot-${c.id}" class="clip shot" src="assets/walkthrough.mp4" ${clipAttrs(c.start, c.len, 2 + (i % 2))} data-media-start="${r2(c.in)}" muted playsinline></video>`).join('\n')}
        </div>
      </div>
${SHOW_PIP ? `      <div id="pip" data-layout-allow-overflow>
${pipClips.map((c, i) => `        <video id="pip-${i}" class="clip pipv" src="assets/${c.src}.mp4" ${clipAttrs(c.start, c.len, 40 + (i % 2))} data-media-start="${r2(c.media)}" muted playsinline></video>`).join('\n')}
      </div>` : ''}
${callSegs.map((c, i) => `      <audio id="audio-${c.id}" src="assets/walkthrough.mp4" ${clipAttrs(c.start, c.len, 9 + (i % 2))} data-media-start="${r2(c.in)}" data-volume="1"></audio>`).join('\n')}
${vo.map((v) => `      <audio id="vo-${v.id}" src="assets/vo/${v.id}.wav" ${clipAttrs(v.start, v.len, 11)} data-volume="1"></audio>`).join('\n')}
${BED ? `      <audio id="bed" src="assets/bgm/bed-cut.wav" ${clipAttrs(0, total, 12)} data-volume="0.45"></audio>
` : ''}${sfx.map((s, i) => `      <audio id="sfx-${i}" src="assets/sfx/${s.src}" ${clipAttrs(s.at, s.len, s.track)}${s.mediaStart != null ? ` data-media-start="${s.mediaStart}"` : ''} data-volume="${s.vol}"></audio>`).join('\n')}
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
      // the Hum bubble pops in once the recording is full screen, and out as it shrinks back into the monitor
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
