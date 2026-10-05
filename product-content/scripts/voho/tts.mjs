// Records the narration in Yar's own ElevenLabs voice, replacing the HeyGen
// lines in assets/vo/. Same recipe as yarmalik.com's video scripts:
// eleven_multilingual_v2 (v3 drifts the accent), lossless pcm_44100, a pinned
// seed so a re-render reads the same, and one gain measured across all lines.
//
//   node tts.mjs            # reads ELEVENLABS_API_KEY from yarmalik.com/.env
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

for (const file of ['/Users/yar/IdeaProjects/yarmalik.com/.env']) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {}
}
const key = process.env.ELEVENLABS_API_KEY
const voice = process.env.ELEVENLABS_VOICE_ID || 'vfHjAzBDDjup1YnV36Y1' // Yar (High Energy Voice)
if (!key) throw new Error('ELEVENLABS_API_KEY missing')

const LINES = JSON.parse(readFileSync('vo-lines.json', 'utf8'))
const outDir = resolve('assets/vo')
const rawDir = resolve(outDir, 'raw')
mkdirSync(rawDir, { recursive: true })

const SEED = Number(process.env.TTS_SEED ?? 12345)
// The call audio sits near -16 LUFS; the narration should match it, not shout over it.
const TARGET_LUFS = -15
const TRUE_PEAK = -1.5
const TONE = 'highpass=f=75,equalizer=f=300:t=q:w=1.0:g=-1.5,equalizer=f=4200:t=q:w=1.2:g=2.5'
const COMP = 'acompressor=threshold=-20dB:ratio=3:attack=5:release=120'
const master = (gain) => `${TONE},${COMP},volume=${gain.toFixed(2)}dB,aresample=176400,alimiter=limit=${TRUE_PEAK}dB:level=disabled,aresample=48000`

const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args])
const durationOf = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())
function measure(file, filters) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', `${filters},loudnorm=print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' })
  const m = r.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/)
  if (!m) throw new Error('could not measure ' + file)
  return JSON.parse(m[0])
}

const takes = []
for (let i = 0; i < LINES.length; i++) {
  const { id, text } = LINES[i]
  const body = {
    text,
    model_id: 'eleven_multilingual_v2',
    seed: SEED,
    previous_text: LINES[i - 1]?.text,
    next_text: LINES[i + 1]?.text,
    voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
  }
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=pcm_44100`, {
    method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`${id}: ${r.status} ${await r.text()}`)
  const pcm = resolve(rawDir, `${id}.pcm`)
  const raw = resolve(rawDir, `${id}.wav`)
  writeFileSync(pcm, Buffer.from(await r.arrayBuffer()))
  ff(['-f', 's16le', '-ar', '44100', '-ac', '1', '-i', pcm, raw])
  rmSync(pcm)
  takes.push({ id, raw })
  console.log(id, 'recorded', durationOf(raw).toFixed(2) + 's')
}

const listFile = resolve(rawDir, 'all.txt')
writeFileSync(listFile, takes.map((t) => `file '${t.raw}'`).join('\n'))
const combined = resolve(rawDir, 'all.wav')
ff(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', combined])
console.log('before:', measure(combined, 'anull').input_i, 'LUFS')
let gain = TARGET_LUFS - parseFloat(measure(combined, `${TONE},${COMP}`).input_i)
for (let i = 0; i < 5; i++) {
  const probe = resolve(rawDir, 'probe.wav')
  ff(['-i', combined, '-af', master(gain), '-ar', '48000', '-ac', '1', probe])
  const got = parseFloat(measure(probe, 'anull').input_i)
  rmSync(probe)
  if (Math.abs(got - TARGET_LUFS) < 0.15) break
  gain += TARGET_LUFS - got
}
console.log('gain:', gain.toFixed(2), 'dB')
for (const t of takes) {
  const wav = resolve(outDir, `${t.id}.wav`)
  ff(['-i', t.raw, '-af', master(gain), '-ar', '48000', '-ac', '1', wav])
  console.log(t.id, durationOf(wav).toFixed(2) + 's')
}
