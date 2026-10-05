/**
 * A long, calm tutorial (~5 min) built from real takes on app.voho.ai, the way Yar asked for on 2026-09-26: "a long,
 * five-minute tutorial where I'm going through steps. You don't have to make it too fast", with Yar on camera "more
 * than two-three times, but only two-three seconds" each.
 *
 *   node scripts/voho/build-tutorial.mjs <workspace>     → <workspace>/long/index.html + compositions/
 *
 * Structure: painted open (the Hum crew, Yar's face cam says cam1, then p2) → the takes, one after another, at real
 * speed, grown out of the painted monitor, with a numbered chapter pill for every narrated step and the narration
 * placed on each step's mark → chapter cards where Yar says cam2 / cam3 in a face cam → the live call cut per turn
 * with English subtitles → back into the monitor → painted payoff, Yar's face cam says cam4, the app.voho.ai end card.
 *
 * Reads topic.json → tutorial { parts, steps, focus, endcard } and subtitles; assets/: take-a.mp4 (the main take,
 * with the call's sound), take-b.mp4, take-c.mp4, painted.mp4, cam1–cam4.mp4, vo/*.wav (+ .words.json for the lines
 * captioned over the painted scenes and cards), sfx, bgm/bed.wav. Take marks: capture/, capture2/, capture3/.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const WS = path.resolve(process.argv[2] ?? '.')
process.chdir(path.join(WS, 'long'))
const topic = JSON.parse(fs.readFileSync('../topic.json', 'utf8'))
const TU = topic.tutorial
// tutorial.lang "ar": the whole video in Saudi Arabic (Yar, 2026-09-28): Arabic font, right-to-left pills, subtitles and
// captions, no letter-spacing (it breaks the joined letters), Arabic labels. assets/fonts/PlexArabic-{500,700}.woff2.
const AR = TU.lang === 'ar'
const LABEL = { ...(AR ? { agent: 'ليلى · موظفة الاستقبال الذكية', caller: 'المتصل' } : { agent: 'Layla · AI receptionist', caller: 'Caller' }), ...TU.labels }
const CTA = TU.cta ?? (AR ? 'ابنِ وكيلك على app.voho.ai' : 'Build yours at app.voho.ai')
// a chat tutorial has no call, so no segments.json
const SEG = fs.existsSync('../segments.json') ? JSON.parse(fs.readFileSync('../segments.json', 'utf8')).segments : []
// takes b and c are optional extra takes; d is a second tab recorded alongside take a (the service desk), on a's clock
const marksOf = (dir) => fs.existsSync(`../${dir}/marks.json`) ? JSON.parse(fs.readFileSync(`../${dir}/marks.json`, 'utf8')).marks : []
const MARKS = { a: marksOf('capture'), b: marksOf('capture2'), c: marksOf('capture3') }
MARKS.d = MARKS.a
const at = (take, name) => { const m = MARKS[take].find((x) => x.name === name); return m ? m.t : null }
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())
const r2 = (n) => Math.round(n * 100) / 100
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const clipAttrs = (start, len, track) => `data-start="${r2(start)}" data-duration="${r2(len)}" data-track-index="${track}"`
const vlen = (id) => dur(`assets/vo/${id}.wav`)

// ------------------------------------------------------------ the painted render (yar-voho-story.js)
const PAINT = { aEnd: 10.2, aHold: 9.5, len: dur('assets/painted.mp4') }
const MONITOR = { x: 560, y: 315, scale: 800 / 1920 }
const GROW = 0.7

// ------------------------------------------------------------ the timeline: parts in order after the painted open
let cursor = PAINT.aEnd
const segs = [], cards = []
for (const p of TU.parts) {
  if (p.type === 'card') { cards.push({ ...p, start: cursor }); cursor += p.len; continue }
  // a call turn is its segment index, or { i, take, focus } to show another take (the desk filling in) under the call's sound
  // a still holds one real frame of a take (a reply that came in just before the recording moved on): { type: 'still', take, at, len }
  if (p.type === 'still') {
    const img = `assets/still-${p.take}-${String(p.at).replace('.', '_')}.png`
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(p.at), '-i', `assets/take-${p.take}.mp4`, '-frames:v', '1', img])
    segs.push({ take: p.take, in: p.at, out: p.at + p.len, still: img, keepCam: true, start: cursor, len: p.len, id: 's' + segs.length }); cursor += p.len; continue
  }
  const ranges = p.type === 'call' ? p.segs.map((x) => { const i = typeof x === 'object' ? x.i : x; return { in: SEG[i].in, out: SEG[i].out, call: i, view: x.take, focus: x.focus } }) : [{ in: p.in, out: p.out, keepCam: p.keepCam }]
  for (const { view, ...r } of ranges) { segs.push({ take: view ?? p.take, ...r, start: cursor, len: r.out - r.in, id: 's' + segs.length }); cursor += r.out - r.in }
}
const recEnd = cursor
// a mark a hair before a cut's in point (the take's own clock) belongs to that cut, not the end of the one before
const segOf = (take, src) => segs.find((x) => x.take === take && src >= x.in - 0.3 && src <= x.out - 0.05) || segs.find((x) => x.take === take && src >= x.in - 1e-6 && src <= x.out + 1e-6)
const tl = (take, src) => { const s = segOf(take, src); return s ? s.start + Math.max(0, src - s.in) : null }
const cStart = recEnd - GROW
const C0 = recEnd - GROW + (PAINT.aEnd - PAINT.aHold)
const total = cStart + (PAINT.len - PAINT.aHold)
const callSegs = segs.filter((s) => s.call != null)

// ------------------------------------------------------------ narration
const vo = []
vo.push({ id: 'cam1', start: 0.45 })
vo.push({ id: 'p2', start: 0.45 + vlen('cam1') + 0.35 })
if (vo[1].start + vlen('p2') > PAINT.aEnd + 0.3) console.warn('! cam1 + p2 run past the painted open')
// a step is [take, id, pill text, anchor mark?]: the anchor places the line when the step's own start was cut (a page loading)
for (const [take, id, , anchor] of TU.steps) {
  const m = at(take, anchor ?? `step_${id}`); const t = m != null ? tl(take, m) : null
  if (t == null) { console.warn(`! step ${id} (${take}) isn't in the cut; its narration is left out`); continue }
  vo.push({ id, start: t + 0.35 })
}
for (const c of cards) vo.push({ id: c.cam, start: c.start + 0.3 })
vo.push({ id: 'cam4', start: C0 + 1.1 })
for (const v of vo) v.len = vlen(v.id)
vo.sort((a, b) => a.start - b.start)
for (let i = 1; i < vo.length; i++) if (vo[i - 1].start + vo[i - 1].len > vo[i].start + 0.05) console.warn(`! ${vo[i - 1].id} runs into ${vo[i].id}`)
const V = Object.fromEntries(vo.map((v) => [v.id, v]))

// ------------------------------------------------------------ chapter pills: one per narrated step, numbered in order
const pills = []
let n = 0
const stepsInCut = TU.steps.map(([take, id, text, anchor]) => ({ take, id, text, s: at(take, anchor ?? `step_${id}`), e: at(take, `end_${id}`) }))
const callAfter = stepsInCut.findIndex((x) => x.id === (TU.callAfter ?? 't08'))
stepsInCut.forEach((x, k) => {
  const from = x.s != null ? tl(x.take, x.s) : null
  if (from == null) return
  const sg = segOf(x.take, x.s)
  let to = x.e != null && sg ? tl(x.take, Math.min(x.e, sg.out - 0.06)) : null
  if (to == null) to = from + vlen(x.id) + 1.5
  pills.push({ n: ++n, text: x.text, from: from + 0.1, to: to - 0.15 })
  if (k === callAfter && callSegs.length) pills.push({ n: ++n, text: AR ? 'اتصل على وكيلك' : 'Call your agent', from: callSegs[0].start + 0.2, to: callSegs[0].start + 3.2 })
})

// call subtitles
const subOf = (i) => topic.subtitles?.[i] ?? ''
// captions for a recording's foreign-language text, e.g. a chat in Arabic: TU.captions [{ take, mark, len, who, text }]
const extraLines = (TU.captions ?? []).map((c) => { const t = tl(c.take, at(c.take, c.mark)); return t == null ? null : { who: c.who, text: c.text, side: !!c.side, from: t + (c.delay ?? 0.1), to: t + (c.delay ?? 0.1) + (c.len ?? 4) } }).filter(Boolean)
const lines = callSegs.map((s, k) => ({ who: SEG[s.call].who, text: subOf(s.call), from: s.start + (k === 0 ? 3.3 : 0.05), to: s.start + s.len }))
  .filter((l) => l.text && l.to > l.from + 0.3).concat(extraLines)

// narration captions over the painted scenes and the cards (the lyric pill)
const words = (id) => { try { return JSON.parse(fs.readFileSync(`assets/vo/${id}.words.json`, 'utf8')).transcription.map((w) => ({ text: w.text.trim(), t: w.offsets.from / 1000 })).filter((w) => w.text) } catch { return null } }
const voCaps = ['cam1', 'p2', ...cards.map((c) => c.cam), 'cam4'].filter((id) => V[id] && words(id)).map((id) => ({ id, from: V[id].start - 0.1, to: V[id].start + V[id].len + 0.35, words: words(id) }))

// ------------------------------------------------------------ sound: every click, every pill, every cut
const sfx = []
const add = (src, t, vol) => { if (t != null && t >= 0 && t < total) sfx.push({ src, at: t, vol }) }
add('ring.wav', 1.6, 0.3)
for (let i = 0; i < 4; i++) { add('ring.wav', 1.5 + i * .35 + 1.4, 0.24); add('pop.mp3', [4.5, 4.85, 5.2, 5.55][i], 0.45) }
for (const t of [1.4, 2.8, 4.4, 6.8, 8.1]) add('whoosh-short.mp3', t - 0.05, 0.2)
add('whoosh-short.mp3', PAINT.aEnd - 0.1, 0.4)
const CLICKS = ['toggle_signup', 'email_focus', 'create_account', 'skip_onboarding', 'create_agent', 'start_from_scratch', 'name_focus', 'language_pick', 'instructions_focus', 'greeting_focus', 'save', 'functions', 'knowledge', 'test_chat', 'chat_sent', 'public_demo', 'share_click', 'embed', 'phone_numbers', 'webhook', 'outbound', 'generate', 'billing', 'usage', 'conversations', 'open_conversation', 'fn_url', 'add_function', 'save_functions', 'desk', 'open_ticket', 'open_ticket_2', 'embed_title', 'origin_focus', 'origin_add', 'channel_chat', 'channel_voice', 'copy_snippet', 'widget_open']
for (const take of ['a', 'b', 'c']) for (const m of MARKS[take]) if (CLICKS.includes(m.name)) add('tick.wav', tl(take, m.t), 0.42)
const typing = (take, a, b, step) => { const ta = tl(take, at(take, a)), tb = tl(take, at(take, b)); if (ta != null && tb != null) for (let t = ta + .3; t < tb; t += step + 0.04 * Math.abs(Math.sin(t * 13))) add('tick.wav', t, 0.11) }
typing('a', 'email_focus', 'create_account', 0.1); typing('a', 'name_focus', 'language_pick', 0.1)
typing('a', 'instructions_focus', 'instructions_done', 0.09); typing('a', 'greeting_focus', 'greeting_done', 0.1)
add('ding.wav', tl('a', at('a', 'saved')), 0.4)
typing('a', 'fn_url', 'functions_done', 0.1); add('ding.wav', tl('a', at('a', 'functions_saved')), 0.4)
for (const s of segs) if (s.call != null && s.take !== 'a') add('ding.wav', s.start + 0.5, 0.45)   // the desk: a ticket lands
for (const p of pills) add('pop.mp3', p.from, 0.28)
for (const c of cards) { add('whoosh-short.mp3', c.start - 0.05, 0.35); add('pop.mp3', c.start + 0.25, 0.4) }
for (let i = 1; i < callSegs.length; i++) add('tick.wav', callSegs[i].start, 0.32)
if (callSegs.length > 1) add('ding.wav', callSegs[callSegs.length - 2].start + callSegs[callSegs.length - 2].len - 0.6, 0.5)   // booked
// a chat: ticks while each message is typed, a pop as it's sent, a ding when the reply lands
for (const m of MARKS.a) {
  const n = (m.name.match(/^chat_(\d+)_focus$/) || [])[1]
  if (n) { typing('a', `chat_${n}_focus`, `chat_${n}_typed`, 0.1); add('pop.mp3', tl('a', at('a', `chat_${n}_send`)), 0.35); add('ding.wav', tl('a', at('a', `chat_${n}_reply`)), 0.4) }
}
add('whoosh-short.mp3', recEnd - GROW - 0.1, 0.4)
add('pop.mp3', C0 + 2.3, 0.45); add('ping.mp3', C0 + 3.1, 0.55)
for (let i = 0; i < 8; i++) add('pop.mp3', C0 + 4.2 + (i % 4) * .12 + (i >= 4 ? .05 : 0), 0.3)
add('whoosh-short.mp3', C0 + 7.0, 0.22); add('whoosh-short.mp3', C0 + 8.4, 0.22)
// the end card is music-only, so it gets its own beats: in with a whoosh and a pop, a ding on the URL, pops after
const END0 = V.cam4.start + V.cam4.len + 0.5
add('whoosh-short.mp3', END0 - 0.1, 0.35); add('pop.mp3', END0 + 0.3, 0.45); add('ding.wav', END0 + 1.2, 0.45)
for (let t = END0 + 2.6; t < total - 1.2; t += 1.4) add('pop.mp3', t, 0.22)
const trackEnds = []
for (const e of sfx.sort((a, b) => a.at - b.at)) {
  e.len = Math.min(dur('assets/sfx/' + e.src), total - e.at)
  let k = trackEnds.findIndex((end) => end <= e.at + 1e-3); if (k < 0) { k = trackEnds.length; trackEnds.push(0) }
  trackEnds[k] = e.at + e.len; e.track = 60 + k
}

// ------------------------------------------------------------ the camera on the recording
const pose = (fx, fy, sc) => ({ x: r2(Math.min(0, Math.max(1920 - 1920 * sc, 960 - fx * sc))), y: r2(Math.min(0, Math.max(1080 - 1080 * sc, 540 - fy * sc))), scale: sc })
const WIDE = pose(960, 540, 1)
const PANEL_A = pose(1560, 480, 1.45), PANEL_B = pose(1650, 520, 1.95)
const cam = []
for (const [take, mk, f, d] of TU.focus) { const t = tl(take, at(take, mk)); if (t != null) cam.push({ at: t - 0.2, to: f ? pose(...f) : WIDE, d }) }
for (const s of segs) if (s.call == null && !s.keepCam) cam.push({ at: s.start, to: WIDE, d: 0 })   // every take cut starts wide, unless it continues the shot before (keepCam)
callSegs.forEach((s, k) => cam.push({ at: s.start, to: s.focus ? pose(...s.focus) : k === 0 ? WIDE : (k % 2 ? PANEL_A : PANEL_B), d: 0 }))
if (callSegs.length) cam.push({ at: callSegs[0].start + 1.4, to: PANEL_A, d: 0.9 })
cam.push({ at: recEnd - GROW - 0.7, to: WIDE, d: 0.6 })
cam.sort((a, b) => a.at - b.at)
const camTl = cam.map((c) => c.d === 0 ? `tl.set("#cam", { x: ${c.to.x}, y: ${c.to.y}, scale: ${c.to.scale} }, ${r2(c.at)});`
  : `tl.to("#cam", { x: ${c.to.x}, y: ${c.to.y}, scale: ${c.to.scale}, duration: ${c.d}, ease: "power2.inOut" }, ${r2(c.at)});`).join('\n      ')

// ------------------------------------------------------------ Yar's face cams: cam1 over the open, cam2/cam3 on cards, cam4 over the payoff
const faces = [
  { id: 'cam1', start: V.cam1.start, len: V.cam1.len, box: [1452, 200, 408, 560] },
  ...cards.map((c) => ({ id: c.cam, start: V[c.cam].start, len: V[c.cam].len, box: [1180, 250, 450, 600] })),
  { id: 'cam4', start: V.cam4.start, len: V.cam4.len, box: [1452, 200, 408, 560] },
]
for (const f of faces) if (f.len > 3.05) console.warn(`! ${f.id} is ${r2(f.len)} s on camera; keep it to 2–3 s`)
const faceHtml = faces.map((f) => `
      <div class="face" id="face-${f.id}" style="left:${f.box[0]}px; top:${f.box[1]}px; width:${f.box[2]}px; height:${f.box[3]}px">
        <video class="clip" id="fv-${f.id}" src="assets/${f.id}.mp4" ${clipAttrs(f.start, f.len + 0.35, 45)} data-media-start="0" muted playsinline></video>
        <div class="face-name">Yar Malik</div>
      </div>`).join('')
const faceTl = faces.map((f) => [
  `tl.set("#face-${f.id}", { opacity: 0, scale: 0.9, y: 24 }, 0);`,
  `tl.to("#face-${f.id}", { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(1.7)" }, ${r2(f.start - 0.05)});`,
  `tl.to("#face-${f.id}", { opacity: 0, scale: 0.92, y: 18, duration: 0.25, ease: "power2.in" }, ${r2(f.start + f.len + 0.1)});`].join('\n      ')).join('\n      ')

// chapter cards (cream, the step and its title on the left, Yar's cam on the right)
const cardHtml = cards.map((c, i) => `
      <div class="clip card" id="card-${i}" ${clipAttrs(c.start, c.len, 30)}>
        <div class="card-kicker">${esc(c.kicker)}</div>
        <div class="card-title">${esc(c.title)}</div>
        <div class="card-brand">voho</div>
      </div>`).join('')

// ------------------------------------------------------------ captions and end card (sub-compositions)
const FONTS = `
      @font-face { font-family: "Geist"; src: url("assets/fonts/Geist-Regular.woff2") format("woff2"); font-weight: 400; }
      @font-face { font-family: "Geist"; src: url("assets/fonts/Geist-Medium.woff2") format("woff2"); font-weight: 500; }
      @font-face { font-family: "Geist"; src: url("assets/fonts/Geist-SemiBold.woff2") format("woff2"); font-weight: 600; }${AR ? `
      @font-face { font-family: "Plex Arabic"; src: url("assets/fonts/PlexArabic-500.woff2") format("woff2"); font-weight: 400 500; }
      @font-face { font-family: "Plex Arabic"; src: url("assets/fonts/PlexArabic-700.woff2") format("woff2"); font-weight: 600 700; }` : ''}`
const FAMILY = AR ? `"Plex Arabic", "Geist", ui-sans-serif, system-ui, sans-serif` : `"Geist", ui-sans-serif, system-ui, sans-serif`
const RTL = AR ? `
  .step .inner, .sub .inner, .lyric .inner { direction: rtl; }
  .step .inner { padding: 14px 14px 14px 28px; }
  .sub em { letter-spacing: 0; text-transform: none; font-size: 20px; }
  .card-kicker, .card-title { direction: rtl; text-align: right; letter-spacing: 0; text-transform: none; }
  #end-card h1, .card-title { letter-spacing: 0; line-height: 1.25; direction: rtl; }` : ''
const capClips = [
  ...pills.map((s, i) => ({ id: `step-${s.n}`, from: s.from, to: s.to, track: i % 2, cls: 'step', html: `<span class="inner"><b>${s.n}</b><span>${esc(s.text)}</span></span>` })),
  ...lines.map((l, i) => ({ id: `sub-${i}`, from: l.from, to: l.to, track: 2 + (i % 3), cls: `sub ${l.who}${l.side ? ' side' : ''}`, html: `<span class="inner"><em>${l.who === 'agent' ? LABEL.agent : LABEL.caller}</em>${esc(l.text)}</span>` })),
  ...voCaps.map((c, i) => ({ id: `vo-${c.id}`, from: c.from, to: c.to, track: 5 + (i % 2), cls: 'lyric', html: `<span class="inner">${c.words.map((w, j) => `<span class="w" id="vo-${c.id}-w${j}">${esc(w.text)}</span>`).join(' ')}</span>` })),
]
const wordTweens = voCaps.flatMap((c) => c.words.map((w, j) => `tl.to("#vo-${c.id}-w${j}", { color: "#8FF0BE", duration: 0.08 }, ${r2(V[c.id].start + w.t)});`))
fs.mkdirSync('compositions', { recursive: true })
fs.writeFileSync('compositions/captions.html', `<!doctype html>
<html><head><meta charset="UTF-8" /></head><body><template>
  <style>${FONTS}
  #root { position: absolute; inset: 0; overflow: hidden; font-family: ${FAMILY}; }
  .step, .sub, .lyric { position: absolute; left: 0; right: 0; bottom: 56px; display: flex; justify-content: center; }
  .step .inner { display: inline-flex; align-items: center; gap: 16px; padding: 14px 28px 14px 14px; border-radius: 999px; background: rgba(43,34,51,0.9); color: #FFF5E2; font-size: 32px; font-weight: 500; box-shadow: 0 10px 30px rgba(43,34,51,0.25); }
  .step b { display: inline-flex; min-width: 46px; height: 46px; padding: 0 10px; border-radius: 23px; align-items: center; justify-content: center; background: #2EC27E; color: #05231a; font-weight: 600; font-size: 25px; }
  .sub .inner { display: inline-block; max-width: 1280px; padding: 16px 30px; border-radius: 18px; background: rgba(43,34,51,0.9); color: #FFF5E2; font-size: 33px; line-height: 1.3; text-align: center; box-shadow: 0 10px 30px rgba(43,34,51,0.25); }
  .sub em { display: block; font-style: normal; font-size: 18px; letter-spacing: 0.12em; text-transform: uppercase; color: #C6BCAB; margin-bottom: 4px; }
  .sub.agent em { color: #57D79B; }
  .sub.side { left: auto; right: 70px; bottom: 330px; justify-content: flex-end; }
  .sub.side .inner { max-width: 760px; text-align: left; }
  .lyric .inner { display: inline-block; max-width: 1320px; padding: 16px 34px; border-radius: 20px; background: rgba(43,34,51,0.86); color: #FFF5E2; font-size: 40px; line-height: 1.28; font-weight: 500; text-align: center; box-shadow: 0 10px 30px rgba(43,34,51,0.25); }${RTL}
  </style>
  <div id="root" data-composition-id="captions" data-width="1920" data-height="1080">
${capClips.map((c) => `    <div class="clip ${c.cls}" id="${c.id}" ${clipAttrs(c.from, c.to - c.from, c.track)}>${c.html}</div>`).join('\n')}
  </div>
  <script>(() => { const tl = gsap.timeline({ paused: true });
${capClips.map((c) => `    tl.fromTo("#${c.id} .inner", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: "power3.out" }, ${r2(c.from)});`).join('\n')}
    ${wordTweens.join('\n    ')}
    window.__timelines["captions"] = tl; tl.seek(0); })();</script>
</template></body></html>
`)
const mark = (size) => `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#09090b"/><g fill="#f4f4f5"><rect x="10.5" y="25" width="7" height="14" rx="3.5"/><rect x="22.5" y="16" width="7" height="32" rx="3.5"/><rect x="34.5" y="21" width="7" height="22" rx="3.5"/><rect x="46.5" y="26" width="7" height="12" rx="3.5"/></g></svg>`
const endStart = V.cam4.start + V.cam4.len + 0.5, endLen = total - endStart
fs.writeFileSync('compositions/endcard.html', `<!doctype html>
<html><head><meta charset="UTF-8" /></head><body><template>
  <style>${FONTS}
  #root { position: absolute; inset: 0; overflow: hidden; font-family: ${FAMILY}; }
  #end-card { position: absolute; left: 1060px; top: 70px; width: 720px; padding: 30px 40px 34px; border-radius: 28px; background: #FFF9EE; border: 3px solid #2B2233; box-shadow: 0 16px 0 rgba(43,34,51,0.9); display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
  .brand { display: flex; align-items: center; gap: 14px; font-weight: 600; font-size: 40px; letter-spacing: -0.03em; color: #09090b; }
  #end-card h1 { font-weight: 600; font-size: 46px; line-height: 1.08; letter-spacing: -0.03em; color: #2B2233; }
  .url { display: inline-block; padding: 14px 34px; border-radius: 999px; background: #016838; color: #FFF5E2; font-weight: 500; font-size: 34px; }${RTL}
  </style>
  <div id="root" data-composition-id="endcard" data-width="1920" data-height="1080">
    <div id="end-card"><div class="brand">${mark(52)}<span>voho</span></div><h1>${esc(TU.endcard)}</h1><span class="url" dir="auto">${esc(CTA)}</span></div>
  </div>
  <script>(() => { const tl = gsap.timeline({ paused: true });
    tl.fromTo("#end-card", { y: -260, rotation: -3 }, { y: 0, rotation: 0, duration: 0.7, ease: "back.out(1.6)" }, 0);
    tl.fromTo("#end-card > *", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power3.out" }, 0.35);
    tl.to("#end-card", { rotation: 1, duration: ${r2(Math.max(0.5, endLen - 1))}, ease: "sine.inOut" }, 0.8);
    window.__timelines["endcard"] = tl; tl.seek(0); })();</script>
</template></body></html>
`)

// ------------------------------------------------------------ audio bed
// TU.noBed: no music under the narration (Yar, 2026-10-01: "very loud and distracting")
if (!TU.noBed) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', 'assets/bgm/bed.wav', '-af', `silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,${TU.bedCut ? `atrim=start=${TU.bedCut},asetpts=N/SR/TB,` : ''}areverse,aloop=loop=-1:size=2e9,atrim=0:${r2(total)},asetpts=N/SR/TB,volume=eval=frame:volume='1+1.6*clip((t-${r2(END0)})/0.8,0,1)',afade=t=in:d=0.6,afade=t=out:st=${r2(total - 2.5)}:d=2.5`, '-ar', '48000', 'assets/bgm/bed-cut.wav'])

// ------------------------------------------------------------ the page
const html = `<!doctype html>
<html lang="${AR ? 'ar' : 'en'}"><head><meta charset="UTF-8" /><meta name="viewport" content="width=1920, height=1080" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>${FONTS}
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1920px; height: 1080px; overflow: hidden; background: #F6EEDD; }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #F6EEDD; font-family: ${FAMILY}; }
  .paint { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  #rec { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; overflow: hidden; transform-origin: 0 0; }
  #cam { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; transform-origin: 0 0; }
  .shot { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .card { position: absolute; inset: 0; background: radial-gradient(90% 90% at 30% 40%, #FFF9EE 0%, #F6EEDD 70%); }
  .card-kicker { position: absolute; left: 150px; top: 390px; font-weight: 600; font-size: 34px; letter-spacing: .08em; text-transform: uppercase; color: #016838; }
  .card-title { position: absolute; left: 150px; top: 440px; width: 950px; font-weight: 600; font-size: 96px; line-height: 1.02; letter-spacing: -0.035em; color: #2B2233; }
  .card-brand { position: absolute; left: 150px; bottom: 90px; font-weight: 600; font-size: 34px; color: #8A8172; }
  .face { position: absolute; border-radius: 30px; overflow: hidden; background: #111; z-index: 20; box-shadow: 0 22px 60px rgba(17,17,22,.28), 0 6px 16px rgba(17,17,22,.3); }
  .face video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 47% 34%; transform: scale(1.18); transform-origin: 47% 34%; }
  .face-name { position: absolute; left: 16px; bottom: 16px; padding: 7px 14px 8px; border-radius: 999px; background: rgba(17,17,22,.62); color: #fff; font-weight: 600; font-size: 20px; }${RTL}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${r2(total)}" data-width="1920" data-height="1080">
  <video id="paint-a" class="clip paint" src="assets/painted.mp4" ${clipAttrs(0, PAINT.aEnd + GROW, 0)} data-media-start="0" muted playsinline></video>
  <video id="paint-c" class="clip paint" src="assets/painted.mp4" ${clipAttrs(cStart, total - cStart, 0)} data-media-start="${PAINT.aHold}" muted playsinline></video>
  <div id="rec"><div id="cam" data-layout-allow-overflow>
${segs.map((s, i) => s.still ? `    <img id="shot-${s.id}" class="clip shot" src="${s.still}" ${clipAttrs(s.start, s.len, 1 + (i % 2))} />`
  : `    <video id="shot-${s.id}" class="clip shot" src="assets/take-${s.take}.mp4" ${clipAttrs(s.start, s.len, 1 + (i % 2))} data-media-start="${r2(s.in)}" muted playsinline></video>`).join('\n')}
  </div></div>
${cardHtml}
${faceHtml}
${callSegs.map((s, i) => `  <audio id="audio-${s.id}" src="assets/take-a.mp4" ${clipAttrs(s.start, s.len, 9 + (i % 2))} data-media-start="${r2(s.in)}" data-volume="1"></audio>`).join('\n')}
${vo.map((v) => `  <audio id="vo-${v.id}" src="assets/vo/${v.id}.wav" ${clipAttrs(v.start, v.len, 11)} data-volume="1"></audio>`).join('\n')}
${TU.noBed ? '' : `  <audio id="bed" src="assets/bgm/bed-cut.wav" ${clipAttrs(0, total, 12)} data-volume="${TU.bedVolume ?? 0.45}"></audio>`}
${sfx.map((s, i) => `  <audio id="sfx-${i}" src="assets/sfx/${s.src}" ${clipAttrs(s.at, s.len, s.track)} data-volume="${s.vol}"></audio>`).join('\n')}
  <div id="captions-host" data-composition-id="captions" data-composition-src="compositions/captions.html" ${clipAttrs(0, total, 20)} data-width="1920" data-height="1080" data-track-kind="captions"></div>
  <div id="endcard-host" data-composition-id="endcard" data-composition-src="compositions/endcard.html" ${clipAttrs(endStart, endLen, 30)} data-width="1920" data-height="1080"></div>
</div>
<script>
  const tl = gsap.timeline({ paused: true });
  tl.set("#rec", { x: ${MONITOR.x}, y: ${MONITOR.y}, scale: ${r2(MONITOR.scale * 1e4) / 1e4} }, 0);
  tl.to("#rec", { x: 0, y: 0, scale: 1, duration: ${GROW}, ease: "power2.inOut" }, ${PAINT.aEnd});
  tl.to("#rec", { x: ${MONITOR.x}, y: ${MONITOR.y}, scale: ${r2(MONITOR.scale * 1e4) / 1e4}, duration: ${GROW}, ease: "power2.inOut" }, ${r2(recEnd - GROW)});
  tl.set("#cam", { x: 0, y: 0, scale: 1 }, 0);
  ${cards.map((c, i) => `tl.fromTo("#card-${i} .card-title, #card-${i} .card-kicker", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.08, ease: "power3.out" }, ${r2(c.start + 0.05)});`).join('\n  ')}
  ${camTl}
  ${faceTl}
  window.__timelines["main"] = tl; tl.seek(0);
</script></body></html>
`
fs.writeFileSync('index.html', html)
console.log(`total ${r2(total)} s (${Math.floor(total / 60)}:${String(Math.round(total % 60)).padStart(2, '0')}) · ${segs.length} cuts · ${pills.length} chapters · ${cards.length} cards · faces at ${faces.map((f) => r2(f.start)).join(', ')}`)
