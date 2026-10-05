// Muxes the Playwright screen capture with the audio taps, each delayed to
// the wall-clock offset it was recorded at, into one H.264/AAC MP4.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
const OUT = path.resolve(process.argv[2] ?? 'out')
const m = JSON.parse(fs.readFileSync(path.join(OUT, 'marks.json')))
const audio = m.marks.filter((x) => x.file)
const args = ['-y', '-i', path.join(OUT, 'screen.webm')]
for (const a of audio) args.push('-i', path.join(OUT, a.file))
const fc = []
audio.forEach((a, i) => {
  const ms = Math.max(0, Math.round(a.t * 1000))
  fc.push(`[${i + 1}:a]aresample=48000:async=1:min_hard_comp=0.05:first_pts=0,adelay=${ms}|${ms}[a${i}]`)
})
const mix = audio.length ? `${audio.map((_, i) => `[a${i}]`).join('')}amix=inputs=${audio.length}:normalize=0[a]` : ''
if (mix) fc.push(mix)
args.push('-filter_complex', fc.join(';'), '-map', '0:v', '-map', '[a]',
  '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', '30',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', path.join(OUT, 'walkthrough.mp4'))
execFileSync('ffmpeg', args, { stdio: 'inherit' })
