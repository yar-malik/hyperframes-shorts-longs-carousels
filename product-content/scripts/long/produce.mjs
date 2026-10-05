/**
 * Makes one CCM or AVC long video from start to finish, the way scripts/voho/produce.mjs makes a Voho one:
 * recording → marks → voice → paint → thumbnails → build → check → render → QA → publish.
 *
 *   node scripts/long/produce.mjs <workspace>              # stops before publishing
 *   node scripts/long/produce.mjs <workspace> --publish    # publishes too, only if QA passes
 *
 * Resumable: every step whose output already exists is skipped. It stops (exit 2) where something needs writing or
 * looking at, and says exactly what: the screen recording, then the marks (after inspect.jpg is made), then the words.
 * See .claude/skills/ccm-content/SKILL.md or avc-content/SKILL.md.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const L = path.join(ROOT, 'scripts/long')
const WS = path.resolve(process.argv[2] ?? '.')
const PUBLISH = process.argv.includes('--publish')
const J = (f) => JSON.parse(fs.readFileSync(path.join(WS, f), 'utf8'))
const has = (f) => fs.existsSync(path.join(WS, f))
const run = (cmd, args, cwd = ROOT) => execFileSync(cmd, args, { cwd, stdio: 'inherit' })
const step = (name) => console.log(`\n── ${name}`)
const stop = (why) => { console.error(`\nSTOPPED: ${why}`); process.exit(2) }
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())
const topic = J('topic.json')

// 1. the screen recording, made 1920×1080 at 30 fps (fitted, cream bars if it's not 16:9)
step('recording')
if (!has('assets/recording.mp4')) {
  const src = ['recording.mp4', 'recording.mov', 'recording.webm'].map((f) => path.join(WS, 'capture', f)).find((f) => fs.existsSync(f))
  if (!src) stop('put the screen recording in capture/recording.mp4 (or .mov). Record at 1920×1080 if you can: the real screen, never a mock.')
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#F6EEDD,fps=30',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-g', '30', '-keyint_min', '30', '-pix_fmt', 'yuv420p',   // a keyframe every second, or cuts freeze on seek
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', path.join(WS, 'assets/recording.mp4')])
}

// 2. a timestamped contact sheet of the recording, to write the marks from
step('inspect')
if (!has('inspect.jpg')) {
  // (this ffmpeg has no drawtext, so the times are stamped on with sharp)
  const d = dur(path.join(WS, 'assets/recording.mp4')), every = Math.max(1, Math.round(d / 60))
  const tmp = fs.mkdtempSync(path.join(WS, '.inspect-'))
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(WS, 'assets/recording.mp4'), '-vf', `fps=1/${every},scale=480:270`, path.join(tmp, 'f%04d.jpg')])
  const { default: sharp } = await import('sharp')
  const frames = fs.readdirSync(tmp).filter((f) => f.endsWith('.jpg')).sort()
  const cols = 6, rows = Math.ceil(frames.length / cols)
  const hms = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')} (${t}s)`
  const tiles = await Promise.all(frames.map(async (f, i) => ({
    input: await sharp(path.join(tmp, f)).composite([{ input: Buffer.from(`<svg width="480" height="270"><rect x="6" y="6" width="150" height="30" rx="6" fill="black" fill-opacity="0.65"/><text x="14" y="28" font-family="Helvetica" font-size="20" fill="white">${hms(i * every)}</text></svg>`), top: 0, left: 0 }]).toBuffer(),
    left: (i % cols) * 480, top: Math.floor(i / cols) * 270,
  })))
  await sharp({ create: { width: cols * 480, height: rows * 270, channels: 3, background: '#F6EEDD' } }).composite(tiles).jpeg({ quality: 80 }).toFile(path.join(WS, 'inspect.jpg'))
  fs.rmSync(tmp, { recursive: true, force: true })
  console.log(`inspect.jpg: one frame every ${every}s. Read the times off it (and scrub assets/recording.mp4) to write recording.* in topic.json`)
}
const R = topic.recording || {}
const need = []
if (R.setup?.in == null || R.setup?.out == null) need.push('recording.setup.in / out')
if ((R.steps || []).filter((s) => s.text && s.at != null).length < 3) need.push('recording.steps (3-4 pills: text + source time)')
if (!(R.cuts?.length >= 3)) need.push('recording.cuts (the result, 3+ cuts: { in, out, sub?, label? })')
for (const k of ['v1', 'v2', 'v3', 'v4', 'v5', 'v6']) if (!topic.vo?.[k]) need.push(`vo.${k}`)
if (!topic.thumbnail?.headline?.[1]) need.push('thumbnail.headline[1] (the thing they build)')
if (need.length) stop(`fill in topic.json: ${need.join('; ')}`)

// 3. narration in Yar's voice, with word timings for the captions (scripts/voho/tts.mjs, the same recipe)
step('voice')
const voLines = JSON.stringify(['v1', 'v2', 'v3', 'v4', 'v5', 'v6'].map((id) => ({ id, text: topic.vo[id] })), null, 1)
if (has('vo-lines.json') && fs.readFileSync(path.join(WS, 'vo-lines.json'), 'utf8') !== voLines) {
  for (const f of fs.readdirSync(path.join(WS, 'assets/vo'))) if (/^v\d\./.test(f)) fs.rmSync(path.join(WS, 'assets/vo', f))
}
if (!has('assets/vo/v6.wav')) {
  fs.writeFileSync(path.join(WS, 'vo-lines.json'), voLines)
  run('node', [path.join(ROOT, 'scripts/voho/tts.mjs')], WS)
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

// 4. the painted crew
step('paint')
if (!has('assets/painted.mp4') || !has('assets/pip-talk.mp4') || !has('assets/pip-work.mp4') || !has('assets/pip-listen.mp4')) run('node', [path.join(L, 'paint.mjs'), WS])

// 5. thumbnails
step('thumbnails')
if (!has('thumb-youtube.jpg') || fs.statSync(path.join(WS, 'topic.json')).mtimeMs > fs.statSync(path.join(WS, 'thumb-youtube.jpg')).mtimeMs)
  run('node', [path.join(L, 'thumbnail.mjs'), WS])

// 6. build, carve the music under every voice, check
const CARVE = path.join(process.env.HOME, '.claude/skills/hyperframes-audio/scripts/carve.mjs')
const HF = ['-y', 'hyperframes@0.8.75']
step('build')
run('node', [path.join(L, 'build.mjs'), WS])
const voices = [...['v1', 'v2', 'v3', 'v4', 'v5', 'v6'].map((v) => `vo-${v}`), ...(R.audio ? R.cuts.map((_, i) => `audio-cut${i}`) : [])]
run('node', [CARVE, '--comp', 'index.html', '--bed', 'bed', '--strength', '0.6', ...voices.flatMap((v) => ['--voice', v])], path.join(WS, 'long'))
run('npx', [...HF, 'check'], path.join(WS, 'long'))

// 7. render and encode for upload
step('render')
const dir = path.join(WS, 'long', 'renders'), raw = path.join(dir, 'long.mp4'), web = path.join(dir, 'long-web.mp4')
run('npx', [...HF, 'render', '--output', raw], path.join(WS, 'long'))
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-maxrate', '3M', '-bufsize', '6M',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', web])

// 8. the gate
step('QA')
try { run('node', [path.join(L, 'qa.mjs'), WS]) } catch { stop('QA failed — fix what it lists, re-run (finished steps are skipped)') }

// 9. publish
if (!PUBLISH) { console.log(`\nready: ${web}\n  publish with: node scripts/long/produce.mjs ${path.relative(ROOT, WS)} --publish (only when Yar says so)`); process.exit(0) }
step('publish')
run('node', [path.join(L, 'publish.mjs'), WS])
