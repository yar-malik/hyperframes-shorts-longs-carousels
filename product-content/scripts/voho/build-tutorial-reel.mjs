/**
 * DON'T USE for new reels (Yar, 2026-09-27: too static, no characters, no movement). Reels are made on the v4 frame:
 * copy videos/avc-ai-clone-reel/ (see .claude/skills/voho-content/SKILL.md, "Never a static reel"). Kept only because
 * it built the reel posted on 2026-09-26.
 *
 * The 9:16 reel cut from a Voho tutorial, for Instagram and the Facebook Page (Facebook gets reels only): the real
 * call, cropped onto the console's live transcript and scaled up so the Arabic reads on a phone, with the English under
 * it. The full screen is used top to bottom (Yar, 2026-09-26).
 *
 *   node scripts/voho/build-tutorial-reel.mjs <workspace>     → <workspace>/reel/index.html
 *
 * 0 s: the headline is fully set on frame 0 (the cover), and r1 says what this is · the call, one cut per turn with the
 * think-time removed, the English under each line · Yar's face cam says cam3 · r2 sends people to the full tutorial
 * and app.voho.ai. Reads the same workspace as build-tutorial.mjs (take-a.mp4, segments.json, subtitles, vo/).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const WS = path.resolve(process.argv[2] ?? '.')
process.chdir(path.join(WS, 'reel'))
const topic = JSON.parse(fs.readFileSync('../topic.json', 'utf8'))
const SEG = JSON.parse(fs.readFileSync('../segments.json', 'utf8')).segments
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())
const r2 = (n) => Math.round(n * 100) / 100
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const clip = (start, len, track) => `data-start="${r2(start)}" data-duration="${r2(len)}" data-track-index="${track}"`
const vlen = (id) => dur(`assets/vo/${id}.wav`)

// the crop: the Test audio panel, where each turn appears as it's spoken (source px in the 1920×1080 take)
const CROP = { x: 1490, y: 470, w: 400, h: 400 }   // the top of the transcript: it fills from here during the call
const BOX = { x: 40, y: 560, w: 1000, h: 1000 * CROP.h / CROP.w }
const SCALE = BOX.w / CROP.w

const turns = (topic.reel?.turns ?? [0, 1, 2, 3, 4, 5, 6, 7, 8])
let t = vlen('r1') + 0.35
const cuts = turns.map((i) => { const c = { i, in: SEG[i].in, out: SEG[i].out, start: t, len: SEG[i].out - SEG[i].in, who: SEG[i].who, sub: topic.subtitles?.[i] ?? '' }; t += c.len; return c })
const cam3 = { start: t + 0.25, len: vlen('cam3') }
const r2line = { start: cam3.start + cam3.len + 0.3, len: vlen('r2') }
const total = r2line.start + r2line.len + 1.2

const words = (id) => JSON.parse(fs.readFileSync(`assets/vo/${id}.words.json`, 'utf8')).transcription.map((w) => ({ text: w.text.trim(), t: w.offsets.from / 1000 })).filter((w) => w.text)
const caps = [{ id: 'r1', start: 0, words: words('r1') }, { id: 'cam3', start: cam3.start, words: words('cam3') }, { id: 'r2', start: r2line.start, words: words('r2') }]

const sfx = []
const add = (src, at, vol) => sfx.push({ src, at, vol, len: Math.min(dur('assets/sfx/' + src), total - at) })
add('whoosh-short.mp3', cuts[0].start - 0.1, 0.35)
cuts.forEach((c, k) => { if (k) add('tick.wav', c.start, 0.35); add('pop.mp3', c.start + 0.05, 0.22) })
add('ding.wav', cuts[cuts.length - 1].start + cuts[cuts.length - 1].len - 0.8, 0.5)
add('pop.mp3', cam3.start - 0.05, 0.4); add('ping.mp3', r2line.start + 0.1, 0.45)
const ends = []
sfx.sort((a, b) => a.at - b.at).forEach((e) => { let k = ends.findIndex((x) => x <= e.at + 1e-3); if (k < 0) { k = ends.length; ends.push(0) } ends[k] = e.at + e.len; e.track = 30 + k })

execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', 'assets/bgm/bed.wav', '-af', `atrim=0:${r2(total)},afade=t=in:d=0.4,afade=t=out:st=${r2(total - 1.5)}:d=1.5`, '-ar', '48000', 'assets/bgm/bed-reel-cut.wav'])

// The cover: while r1 plays, the box shows the finished transcript (a still from the end of the real call), so frame 0
// already shows the booked call instead of an empty chat
const last = cuts[cuts.length - 1]
execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(r2(last.out - 0.2)), '-i', 'assets/take-a.mp4', '-frames:v', '1', 'assets/reel-cover.png'])
const vidStyle = `left:${-CROP.x * SCALE}px; top:${-CROP.y * SCALE}px; width:${1920 * SCALE}px; height:${1080 * SCALE}px`
const html = `<!doctype html>
<html><head><meta charset="UTF-8" /><meta name="viewport" content="width=1080, height=1920" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
  @font-face { font-family: "Geist"; src: url("assets/fonts/Geist-SemiBold.woff2") format("woff2"); font-weight: 600; }
  @font-face { font-family: "Geist"; src: url("assets/fonts/Geist-Regular.woff2") format("woff2"); font-weight: 400; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1080px; height: 1920px; overflow: hidden; background: #F6EEDD; }
  #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; font-family: "Geist", ui-sans-serif, system-ui, sans-serif;
    background: radial-gradient(120% 80% at 50% 25%, #FFF9EE 0%, #F6EEDD 60%, #EFE4CE 100%); }
  .brand { position: absolute; left: 0; right: 0; top: 70px; text-align: center; font-weight: 600; font-size: 34px; color: #2B2233; letter-spacing: -0.02em; }
  .pill { position: absolute; left: 50%; top: 140px; transform: translateX(-50%); white-space: nowrap; padding: 12px 26px; border-radius: 999px; background: #016838; color: #FFF5E2; font-weight: 600; font-size: 28px; letter-spacing: .06em; }
  .title { position: absolute; left: 60px; right: 60px; top: 230px; text-align: center; font-weight: 600; font-size: 76px; line-height: 1.04; letter-spacing: -0.04em; color: #2B2233; }
  .title em { font-style: normal; color: #016838; }
  #box { position: absolute; left: ${BOX.x}px; top: ${BOX.y}px; width: ${BOX.w}px; height: ${r2(BOX.h)}px; border-radius: 34px; overflow: hidden; background: #fff;
    border: 4px solid #2B2233; box-shadow: 0 18px 0 rgba(43,34,51,.9); }
  #box video, #box img { position: absolute; ${vidStyle}; }
  #box #cover, #box .cover { z-index: 2; top: ${r2(-(CROP.y + 140) * SCALE)}px; }   /* the cover shows the last lines: the booking */
  .sub { position: absolute; left: 50px; right: 50px; top: ${r2(BOX.y + BOX.h + 40)}px; text-align: center; }
  .sub .who { display: block; font-size: 24px; letter-spacing: .14em; text-transform: uppercase; color: #8A8172; margin-bottom: 8px; }
  .sub.agent .who { color: #016838; }
  .sub .en { font-weight: 600; font-size: 44px; line-height: 1.18; color: #2B2233; letter-spacing: -0.02em; }
  .cap { position: absolute; left: 60px; right: 60px; top: ${r2(BOX.y + BOX.h + 40)}px; text-align: center; font-weight: 600; font-size: 50px; line-height: 1.16; color: #C7BBA8; letter-spacing: -0.02em; }
  .cap .w.on { color: #2B2233; }
  #face { position: absolute; left: 290px; top: 780px; width: 500px; height: 600px; border-radius: 34px; overflow: hidden; background: #111; box-shadow: 0 20px 60px rgba(17,17,22,.35); }
  #face video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 47% 34%; transform: scale(1.18); transform-origin: 47% 34%; }
  #face .nm { position: absolute; left: 18px; bottom: 18px; padding: 8px 16px; border-radius: 999px; background: rgba(17,17,22,.6); color: #fff; font-weight: 600; font-size: 24px; }
  .cta { position: absolute; left: 50%; bottom: 96px; transform: translateX(-50%); white-space: nowrap; padding: 20px 36px; border-radius: 999px; background: #2B2233; color: #fff; font-weight: 600; font-size: 38px; }
  .cta b { color: #8FF0BE; font-weight: 600; }
  .handle { position: absolute; left: 0; right: 0; bottom: 50px; text-align: center; font-weight: 600; font-size: 26px; color: #8A8172; }
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${r2(total)}" data-width="1080" data-height="1920">
  <div class="brand">voho</div>
  <div class="pill">A REAL CALL · IN SAUDI ARABIC</div>
  <div class="title">My AI receptionist just booked <em>a dentist appointment</em></div>
  <div id="box">
    <img class="clip" id="cover" src="assets/reel-cover.png" ${clip(0, cuts[0].start, 6)}>
    <img class="clip cover" id="cover-end" src="assets/reel-cover.png" ${clip(cam3.start, total - cam3.start, 7)}>
${cuts.map((c, k) => `    <video class="clip" id="cut-${k}" src="assets/take-a.mp4" ${clip(k === 0 ? 0 : c.start, k === 0 ? c.start + c.len : c.len, 1 + (k % 2))} data-media-start="${r2(k === 0 ? c.in - c.start : c.in)}" muted playsinline></video>`).join('\n')}
  </div>
${cuts.map((c, k) => `  <div class="clip sub ${c.who}" id="sub-${k}" ${clip(c.start + 0.05, c.len - 0.05, 3 + (k % 2))}><span class="who">${c.who === 'agent' ? 'Layla · AI receptionist' : 'Caller'}</span><span class="en">${esc(c.sub)}</span></div>`).join('\n')}
${caps.map((c) => `  <div class="clip cap" id="cap-${c.id}" ${clip(c.start, vlen(c.id) + 0.3, 5)}>${c.words.map((w, j) => `<span class="w" id="w-${c.id}-${j}">${esc(w.text)}</span>`).join(' ')}</div>`).join('\n')}
  <div id="face"><video class="clip" id="face-v" src="assets/cam3.mp4" ${clip(cam3.start, cam3.len + 0.3, 8)} data-media-start="0" muted playsinline></video><div class="nm">Yar Malik</div></div>
  <div class="clip cta" id="cta" ${clip(r2line.start, total - r2line.start, 9)}>Build yours at <b>app.voho.ai</b></div>
  <div class="handle">@yarmalikhere</div>
${cuts.map((c, k) => `  <audio id="call-${k}" src="assets/take-a.mp4" ${clip(c.start, c.len, 10 + (k % 2))} data-media-start="${r2(c.in)}" data-volume="1"></audio>`).join('\n')}
  <audio id="vo-r1" src="assets/vo/r1.wav" ${clip(0, vlen('r1'), 12)} data-volume="1"></audio>
  <audio id="vo-cam3" src="assets/vo/cam3.wav" ${clip(cam3.start, cam3.len, 12)} data-volume="1"></audio>
  <audio id="vo-r2" src="assets/vo/r2.wav" ${clip(r2line.start, r2line.len, 12)} data-volume="1"></audio>
  <audio id="bed" src="assets/bgm/bed-reel-cut.wav" ${clip(0, total, 13)} data-volume="0.45"></audio>
${sfx.map((s, i) => `  <audio id="sfx-${i}" src="assets/sfx/${s.src}" ${clip(s.at, s.len, s.track)} data-volume="${s.vol}"></audio>`).join('\n')}
</div>
<script>
  const tl = gsap.timeline({ paused: true });
  tl.set("#face", { opacity: 0, scale: 0.9 }, 0);
  tl.to("#face", { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.7)" }, ${r2(cam3.start - 0.05)});
  tl.to("#face", { opacity: 0, scale: 0.92, duration: 0.25 }, ${r2(cam3.start + cam3.len + 0.1)});
  tl.fromTo("#box", { scale: 1 }, { scale: 1.015, duration: ${r2(total)}, ease: "none" }, 0);
  ${cuts.map((c, k) => `tl.fromTo("#sub-${k}", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power3.out" }, ${r2(c.start + 0.05)});`).join('\n  ')}
  ${caps.flatMap((c) => c.words.map((w, j) => `tl.set("#w-${c.id}-${j}", { className: "w on" }, ${r2(c.start + w.t)});`)).join('\n  ')}
  tl.fromTo("#cta", { y: 30, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }, ${r2(r2line.start)});
  window.__timelines = window.__timelines || {}; window.__timelines["main"] = tl; tl.seek(0);
</script></body></html>
`
fs.writeFileSync('index.html', html)
console.log(`reel ${r2(total)} s · ${cuts.length} turns · face at ${r2(cam3.start)}`)
