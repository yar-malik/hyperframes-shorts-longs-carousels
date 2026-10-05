/**
 * Renders the painted half of a CCM or AVC long video: the Bit crew or the Clappy crew in yar-studio-story.js, the
 * same story, shots and timing as the Voho videos (scripts/voho/paint.mjs).
 *
 *   node scripts/long/paint.mjs <workspace> [--sheet]      → <workspace>/assets/painted.mp4, the corner-bubble loops, cover.png
 *
 * topic.json → product (ccm | avc), scene: { icons: [3 for the pin board], cardIcon, deskCrew: [4 names], floorCrew: [8 names],
 *              thumb: { crew, mood } }   (names and icons: see the top of yar-studio-story.js)
 * --sheet renders contact sheets instead, to look at before the full render.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const WS = path.resolve(process.argv[2] ?? '.')
const topic = JSON.parse(fs.readFileSync(path.join(WS, 'topic.json'), 'utf8'))
const AB = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../open-source/animation-base')
const cast = { ccm: 'bit', avc: 'clappy' }[topic.product]
if (!cast) throw new Error(`topic.product must be ccm or avc, not ${topic.product}`)
const page = `studio-${topic.product}-auto.html`
const base = fs.readFileSync(path.join(AB, 'studio-voho-property.html'), 'utf8')
fs.writeFileSync(path.join(AB, page), base
  .replace(/<script>const PROJECT = [^<]*<\/script>/, `<script>const PROJECT = { duration: 23.2, bpm: 116, offset: 0 };\nwindow.SCENE = ${JSON.stringify({ ...(topic.scene || {}), cast })};</script>`)
  .replace('src/scenes/yar-voho-property.js', 'src/scenes/yar-studio-story.js')
  .replace(/<title>[^<]*<\/title>/, `<title>${topic.slug} · ${cast} crew</title>`))

fs.mkdirSync(path.join(WS, 'assets'), { recursive: true })
const LOOPS = { pipTalk: 'pip-talk', pipListen: 'pip-listen', pipWork: 'pip-work', crewStrip: 'crew-strip' }
const run = (args) => execFileSync('node', ['render.mjs', `--page=${page}`, ...args], { cwd: AB, stdio: 'inherit' })
if (process.argv.includes('--sheet')) {
  run(['--sheet=0.8,2.1,3.6,5.9,7.4,9.9,13.4,15.5,17.8,21', '--cols=5', '--w=384', `--out=${path.join(WS, 'scene-sheet.jpg')}`])
  for (const name of Object.keys(LOOPS)) run([`--loop=${name}`, '--sheet=0.4,1.9,3.4', '--cols=3', '--w=320', `--out=${path.join(WS, `loop-${name}.jpg`)}`])
} else {
  if (!fs.existsSync(path.join(WS, 'assets/painted.mp4'))) run(['--clip', '--fps=30', `--out=${path.join(WS, 'assets/painted.mp4')}`])
  for (const [name, file] of Object.entries(LOOPS)) if (!fs.existsSync(path.join(WS, `assets/${file}.mp4`)))
    run([`--loop=${name}`, '--clip', '--fps=30', `--out=${path.join(WS, `assets/${file}.mp4`)}`])
  // a keyframe every second: HyperFrames seeks into these (the payoff starts mid-clip), and sparse keyframes freeze
  for (const f of ['painted', ...Object.values(LOOPS)]) {
    const src = path.join(WS, `assets/${f}.mp4`), tmp = path.join(WS, `assets/${f}.kf.mp4`)
    const kf = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-skip_frame', 'nokey', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', src]).toString().trim().split('\n').map(Number)
    if (kf.every((t, i) => i === 0 || t - kf[i - 1] <= 1.05)) continue
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-g', '30', '-keyint_min', '30', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', tmp])
    fs.renameSync(tmp, src)
  }
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '6.2', '-i', path.join(WS, 'assets/painted.mp4'), '-frames:v', '1', path.join(WS, 'assets/cover.png')])
  console.log('wrote assets/painted.mp4 and assets/cover.png')
}
