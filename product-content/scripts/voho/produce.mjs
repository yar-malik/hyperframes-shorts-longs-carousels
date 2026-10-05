/**
 * Makes one Voho topic from start to finish: record → cut → voice → paint → build → check → render → QA → publish.
 *
 *   node scripts/voho/produce.mjs <workspace>              # stops before publishing
 *   node scripts/voho/produce.mjs <workspace> --publish    # publishes too, only if QA passes
 *
 * Resumable: every step whose output already exists is skipped, so re-running after a fix picks up where it stopped.
 * It stops (exit 2) at the two points that need writing — topic.json before the recording, and the English subtitles
 * after it — and says exactly what's missing. See .claude/skills/voho-content/SKILL.md.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const V = path.join(ROOT, 'scripts/voho')
const WS = path.resolve(process.argv[2] ?? '.')
const PUBLISH = process.argv.includes('--publish')
const J = (f) => JSON.parse(fs.readFileSync(path.join(WS, f), 'utf8'))
const has = (f) => fs.existsSync(path.join(WS, f))
const run = (cmd, args, cwd = ROOT) => execFileSync(cmd, args, { cwd, stdio: 'inherit' })
const step = (name) => console.log(`\n── ${name}`)
const stop = (why) => { console.error(`\nSTOPPED: ${why}`); process.exit(2) }
let topic = J('topic.json')

// 0. the written parts that must exist before a recording is worth making
step('topic.json')
const need = []
if (!topic.agent?.name || !topic.agent?.instructions || !topic.agent?.greeting) need.push('agent.name / instructions / greeting')
if (!(topic.caller?.lines?.length >= 3)) need.push('caller.lines (3-5 short Saudi Arabic lines)')
for (const k of ['v1', 'v2', 'v3', 'v4', 'v5', 'v6']) if (!topic.vo?.[k]) need.push(`vo.${k}`)
if (!topic.reel?.headline?.[0] || !topic.reel?.headline?.[1] || !topic.reel?.tags?.[0] || !topic.reel?.tags?.[2]) need.push('reel.headline[0], reel.tags[0], reel.tags[2]')
if (!topic.long?.step3) need.push('long.step3')
if (!topic.thumbnail?.headline?.[1]) need.push('thumbnail.headline[1] (the thing they build, e.g. "AI CLINIC|RECEPTIONIST")')
if (need.length) stop(`fill in topic.json first: ${need.join('; ')}`)
if (!/جملة واحدة قصيرة|جملة قصيرة/.test(topic.agent.instructions)) console.warn('! the instructions should say "one short sentence per reply" (بجملة واحدة قصيرة)')

// 1. the real recording on app.voho.ai
step('record')
if (!has('capture/walkthrough.mp4')) {
  run('node', [path.join(V, 'recorder/record.mjs'), WS])
  const m = J('capture/marks.json').marks
  if (m.some((x) => x.name === 'error')) stop('the recording failed — see capture/error.png, fix, and re-run')
  run('node', [path.join(V, 'recorder/mux.mjs'), path.join(WS, 'capture')])
}
for (const f of ['walkthrough.mp4', 'marks.json']) fs.copyFileSync(path.join(WS, 'capture', f), path.join(WS, 'assets', f))

// 2. cut the call per turn
step('segments')
if (!has('segments.json')) run('node', [path.join(V, 'segments.mjs'), WS])
const SEG = J('segments.json').segments
topic = J('topic.json')
if (!topic.subtitles?.length || topic.subtitles.length < SEG.length || !topic.reel?.segments) {
  const tr = J('segments.json').transcript
  console.log('\nsegments:'); for (const s of SEG) console.log(`  ${s.i} ${s.who} ${s.len}s`)
  console.log('transcript (Arabic, from the console):'); for (const b of tr) console.log(`  ${b.who}: ${b.text}`)
  stop(`write topic.subtitles (${SEG.length} English lines, one per segment, faithful to what was said) and reel.segments (the best 4-5 turns, ~15-20 s), then re-run`)
}

// 3. narration in Yar's voice, with word timings for the captions
step('voice')
const voLines = JSON.stringify(['v1', 'v2', 'v3', 'v4', 'v5', 'v6'].map((id) => ({ id, text: topic.vo[id] })), null, 1)
if (has('vo-lines.json') && fs.readFileSync(path.join(WS, 'vo-lines.json'), 'utf8') !== voLines) {   // the lines changed: record again
  for (const f of fs.readdirSync(path.join(WS, 'assets/vo'))) if (/^v\d\./.test(f)) fs.rmSync(path.join(WS, 'assets/vo', f))
}
if (!has('assets/vo/v6.wav')) {
  fs.writeFileSync(path.join(WS, 'vo-lines.json'), voLines)
  run('node', [path.join(V, 'tts.mjs')], WS)
}
for (const id of ['v1', 'v2', 'v3', 'v4', 'v5', 'v6']) {
  const w = path.join(WS, `assets/vo/${id}.words`)
  if (fs.existsSync(w + '.json')) continue
  const tmp = path.join(WS, `assets/vo/${id}.16k.wav`)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(WS, `assets/vo/${id}.wav`), '-ar', '16000', '-ac', '1', tmp])
  execFileSync('whisper-cli', ['-m', path.join(process.env.HOME, '.cache/hyperframes/whisper/models/ggml-small.en.bin'), '-f', tmp, '-ml', '1', '-sow', '-oj', '-of', w, '-np'], { stdio: 'ignore' })
  fs.rmSync(tmp)
}

// Yar on camera: v1 (the promise) spoken by his avatar in a face cam, 4 s at most (scripts/avatar/say.mjs)
step('on camera')
if (topic.cam !== false) {
  const v1 = path.join(WS, 'assets/vo/v1.wav'), cam = path.join(WS, 'assets/cam.mp4')
  const v1len = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v1]).toString())
  if (v1len > 4.2) stop(`v1 is ${v1len.toFixed(1)}s and it's said on camera: keep it to 4 s (about 10 words), e.g. "Today I'll show you how to <do the thing>."`)
  if (!fs.existsSync(cam) || fs.statSync(cam).mtimeMs < fs.statSync(v1).mtimeMs) run('node', [path.join(ROOT, 'scripts/avatar/say.mjs'), v1, cam])
}

// 4. the painted Hum crew, dressed for the industry
step('paint')
if (!has('assets/painted.mp4') || !has('assets/crew-strip.mp4') || !has('assets/pip-talk.mp4')) run('node', [path.join(V, 'paint.mjs'), WS])

// 4b. thumbnails: YouTube (1280×720) and the reel's opening frame, which Instagram uses as its cover
step('thumbnails')
if (!has('thumb-youtube.jpg') || !has('assets/thumb-reel.png') || fs.statSync(path.join(WS, 'topic.json')).mtimeMs > fs.statSync(path.join(WS, 'thumb-youtube.jpg')).mtimeMs)
  run('node', [path.join(V, 'thumbnail.mjs'), WS])

// 5. build, carve the music under every voice, check
const CARVE = path.join(process.env.HOME, '.claude/skills/hyperframes-audio/scripts/carve.mjs')
const HF = ['-y', 'hyperframes@0.8.75']
for (const kind of ['long', 'reel']) {
  step(`build ${kind}`)
  run('node', [path.join(V, `build-${kind}.mjs`), WS])
  const n = kind === 'long' ? (topic.long?.segments ?? SEG).length : topic.reel.segments.length
  const voices = kind === 'long'
    ? [...['v1', 'v2', 'v3', 'v4', 'v5', 'v6'].map((v) => `vo-${v}`), ...Array.from({ length: n }, (_, i) => `audio-call${i}`)]
    : ['vo-v1', 'vo-v2', 'vo-v6', ...Array.from({ length: n }, (_, i) => `call-audio-${i}`)]
  // strength 0.6, not the default 0.8: the deeper duck recovers too slowly and left the gaps between lines quiet
  // no bed, nothing to carve (the long video has none since 2026-10-01)
  if (fs.readFileSync(path.join(WS, kind, 'index.html'), 'utf8').includes('id="bed"')) run('node', [CARVE, '--comp', 'index.html', '--bed', 'bed', '--strength', '0.6', ...voices.flatMap((v) => ['--voice', v])], path.join(WS, kind))
  run('npx', [...HF, 'check'], path.join(WS, kind))
}

// 6. render and encode for upload
for (const kind of ['long', 'reel']) {
  step(`render ${kind}`)
  const dir = path.join(WS, kind, 'renders'), raw = path.join(dir, `${kind}.mp4`), web = path.join(dir, `${kind}-web.mp4`)
  run('npx', [...HF, 'render', '--output', raw], path.join(WS, kind))
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-maxrate', '3M', '-bufsize', '6M',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', web])
}

// 7. the gate
step('QA')
try { run('node', [path.join(V, 'qa.mjs'), WS]) } catch { stop('QA failed — fix what it lists, re-run (finished steps are skipped)') }

// 8. publish
if (!PUBLISH) { console.log(`\nready: ${WS}\n  publish with: node scripts/voho/produce.mjs ${path.relative(ROOT, WS)} --publish`); process.exit(0) }
step('publish')
run('node', [path.join(V, 'publish.mjs'), WS])
