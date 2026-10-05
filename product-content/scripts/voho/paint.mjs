/**
 * Renders the painted half of a topic's video: the Hum crew story (yar-voho-story.js) dressed for the industry.
 *
 *   node scripts/voho/paint.mjs <workspace> [--sheet]      → <workspace>/assets/painted.mp4 + cover.png
 *
 * topic.json → scene: { view: city|refinery|airport, icons: [3 for the wall], cardIcon, cardCol (0-3: the day ringed),
 *                       cardHour (1-12), deskCrew: [4 names], floorCrew: [8 names] }   (crew names: see cast.js CREW)
 * --sheet renders a contact sheet instead (for checking a new scene before the full render).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const WS = path.resolve(process.argv[2] ?? '.')
const topic = JSON.parse(fs.readFileSync(path.join(WS, 'topic.json'), 'utf8'))
const AB = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../open-source/animation-base')
const page = 'studio-voho-auto.html'
const base = fs.readFileSync(path.join(AB, 'studio-voho-property.html'), 'utf8')
fs.writeFileSync(path.join(AB, page), base
  .replace(/<script>const PROJECT = [^<]*<\/script>/, `<script>const PROJECT = { duration: 23.2, bpm: 116, offset: 0 };\nwindow.SCENE = ${JSON.stringify(topic.scene || {})};</script>`)
  .replace('src/scenes/yar-voho-property.js', 'src/scenes/yar-voho-story.js"></script>\n<script src="src/scenes/yar-voho-extras.js')
  .replace(/<title>[^<]*<\/title>/, `<title>${topic.slug} · Hum crew</title>`))

fs.mkdirSync(path.join(WS, 'assets'), { recursive: true })
const LOOPS = { pipTalk: 'pip-talk', pipListen: 'pip-listen', pipWork: 'pip-work', crewStrip: 'crew-strip' }   // yar-voho-extras.js
const run = (args) => execFileSync('node', ['render.mjs', `--page=${page}`, ...args], { cwd: AB, stdio: 'inherit' })
if (process.argv.includes('--sheet')) {
  run(['--sheet=0.8,2.1,3.6,5.9,7.4,9.9,13.4,15.5,17.8,21', '--cols=5', '--w=384', `--out=${path.join(WS, 'scene-sheet.jpg')}`])
  for (const name of Object.keys(LOOPS)) run([`--loop=${name}`, '--sheet=0.4,1.9,3.4', '--cols=3', '--w=320', `--out=${path.join(WS, `loop-${name}.jpg`)}`])
} else {
  if (!fs.existsSync(path.join(WS, 'assets/painted.mp4'))) run(['--clip', '--fps=30', `--out=${path.join(WS, 'assets/painted.mp4')}`])
  // the loops that keep the crew on screen through the recording (the corner bubble, the reel's dancing strip)
  for (const [name, file] of Object.entries(LOOPS)) if (!fs.existsSync(path.join(WS, `assets/${file}.mp4`)))
    run([`--loop=${name}`, '--clip', '--fps=30', `--out=${path.join(WS, `assets/${file}.mp4`)}`])
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '6.2', '-i', path.join(WS, 'assets/painted.mp4'), '-frames:v', '1', path.join(WS, 'assets/cover.png')])
  console.log('wrote assets/painted.mp4 and assets/cover.png')
}
