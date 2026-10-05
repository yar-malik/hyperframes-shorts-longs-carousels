/**
 * Yar on camera for a few seconds: his HeyGen avatar (trained on his real footage) lip-synced to a line already
 * recorded in his ElevenLabs voice, so the on-camera part sounds exactly like the narration around it.
 *
 *   node scripts/avatar/say.mjs <line.wav> <out.mp4> [--from 0 --to 2.1]     → a 1920×1080 clip of Yar saying it (face at ~47% across)
 *
 * --from/--to trim the line first (cut on a word boundary: use the line's .words.json). Keep it short: at most 4 s in
 * a long video and about 2 s in a reel (the product skills). Needs HEYGEN_API_KEY and HEYGEN_AVATAR_ID in .env.
 * The clip keeps the avatar's real room (the painting, the plant); the video crops it into a face cam.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
for (const f of ['.env.local', '.env']) {
  try { for (const l of fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  } } catch {}
}
const KEY = process.env.HEYGEN_API_KEY, AVATAR = process.env.HEYGEN_AVATAR_ID
if (!KEY || !AVATAR) { console.error('HEYGEN_API_KEY and HEYGEN_AVATAR_ID are needed in .env'); process.exit(1) }
const [src, out] = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && !(all[i - 1] || '').startsWith('--'))
if (!src || !out) { console.error('usage: node scripts/avatar/say.mjs <line.wav> <out.mp4> [--from s --to s]'); process.exit(1) }
const opt = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : undefined }

// 1. the line, trimmed, as an mp3 HeyGen takes
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'avatar-'))
const mp3 = path.join(tmp, 'line.mp3')
execFileSync('ffmpeg', ['-v', 'error', '-y', ...(opt('from') ? ['-ss', opt('from')] : []), ...(opt('to') ? ['-to', opt('to')] : []), '-i', src,
  '-af', 'apad=pad_dur=0.25', '-ar', '44100', '-ac', '1', '-b:a', '192k', mp3])

// 2. upload it
const up = await fetch('https://upload.heygen.com/v1/asset', { method: 'POST', headers: { 'X-Api-Key': KEY, 'Content-Type': 'audio/mpeg' }, body: fs.readFileSync(mp3) })
const upJson = await up.json().catch(() => ({}))
const asset = upJson.data
if (!up.ok || !asset?.id) throw new Error(`HeyGen upload failed: ${up.status} ${JSON.stringify(upJson).slice(0, 300)}`)

// 3. the avatar says it
const gen = await fetch('https://api.heygen.com/v2/video/generate', {
  method: 'POST', headers: { 'X-Api-Key': KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    video_inputs: [{ character: { type: 'avatar', avatar_id: AVATAR, avatar_style: 'normal' }, voice: { type: 'audio', audio_asset_id: asset.id } }],
    dimension: { width: 1920, height: 1080 },   // the avatar is landscape footage; portrait comes back letterboxed, so the video crops it
  }),
})
const genJson = await gen.json().catch(() => ({}))
const id = genJson.data?.video_id
if (!gen.ok || !id) throw new Error(`HeyGen generate failed: ${gen.status} ${JSON.stringify(genJson).slice(0, 300)}`)
console.log('HeyGen video', id, '…')

// 4. wait for it, then download
for (let i = 0; i < 120; i++) {
  await new Promise((r) => setTimeout(r, 10000))
  const s = (await (await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${id}`, { headers: { 'X-Api-Key': KEY } })).json()).data || {}
  if (s.status === 'failed') throw new Error('HeyGen render failed: ' + JSON.stringify(s.error))
  if (s.status === 'completed' && s.video_url) {
    const buf = Buffer.from(await (await fetch(s.video_url)).arrayBuffer())
    const raw = path.join(tmp, 'raw.mp4'); fs.writeFileSync(raw, buf)
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true })
    // a keyframe every second, so HyperFrames can seek into it cleanly
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-c:v', 'libx264', '-crf', '18', '-g', '30', '-keyint_min', '30', '-r', '30', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', path.resolve(out)])
    fs.rmSync(tmp, { recursive: true, force: true })
    console.log('wrote', out)
    process.exit(0)
  }
}
throw new Error('HeyGen still rendering after 20 min: video ' + id)
