/**
 * Starts the workspace for one CCM or AVC long video.
 *
 *   node scripts/long/new.mjs ccm "Replace a spreadsheet with Claude Code"
 *   node scripts/long/new.mjs avc "A $1 AI ad for a restaurant"
 *
 * → videos/<product>-<slug>/ with topic.json (blanks to write: see the product's skill), capture/ (put the screen
 *   recording here), assets/ (fonts, music bed, sound effects) and a HyperFrames project, long/, that shares assets/.
 * Same layout as the Voho workspaces (scripts/voho/new.mjs), so the same tools work on both.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { BRAND } from './brand.mjs'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const [product, title] = process.argv.slice(2)
if (!BRAND[product] || !title) { console.error('usage: node scripts/long/new.mjs ccm|avc "<title>"'); process.exit(1) }
const B = BRAND[product]
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 6).join('-')
const WS = path.join(ROOT, 'videos', `${product}-${slug}`)
if (fs.existsSync(path.join(WS, 'topic.json'))) { console.log(`already started: ${WS}`); process.exit(0) }

const topic = {
  product, slug, title,
  // Yar's order: v1 the promise, v2 the problem (both over the painted open, ~10 s), v3 + v4 how (over the setup),
  // v5 the turn ("Now run it."), v6 what the recording actually showed, then the CTA.
  vo: { v1: '', v2: '', v3: '', v4: '', v5: '', v6: '' },
  // Source times in the screen recording (seconds). Write them after looking at inspect.jpg (produce.mjs makes it).
  recording: {
    setup: { in: null, out: null, rate: 1 },     // the setup, at real speed (1.6x was too fast to follow)
    steps: [ // 4 pills over the setup, each from its source time to the next one
      { text: '', at: null }, { text: '', at: null }, { text: '', at: null }, { text: '', at: null },
    ],
    clicks: [],        // a tick on each
    typing: [],        // [[from, to]] ticks while typing
    done: null,        // a ding: the moment the setup finishes
    focus: [],         // optional camera moves during the setup: { at, x, y, scale } or { at, wide: true }
    v4At: null,        // optional: where v4 starts (default: straight after v3)
    resultStep: product === 'avc' ? 'Generate it' : 'Run it',   // pill 5, over the first result cut
    cuts: [],          // the result, one cut per beat: { in, out, sub?, label?, focus?: [x, y, scale] }
    audio: false,      // true: keep the recording's own sound in the result cuts
  },
  scene: {},            // painted look overrides: see the top of open-source/animation-base/src/scenes/yar-studio-story.js
  endcard: B.endcard,
  thumbnail: { headline: ['BUILD A', '', 'IN 60 SECONDS'], tag: '', thumb: { mood: 'excited' } },
  publish: { youtubeTitle: '', youtubeDescription: '', linkedin: '', linkedinComment: `Join us: ${B.link}` },
}

const SHARED = path.join(ROOT, 'videos/_voho-shared')
if (!fs.existsSync(SHARED)) throw new Error('videos/_voho-shared is missing (fonts, sfx, music beds)')
fs.mkdirSync(path.join(WS, 'assets/vo'), { recursive: true })
fs.mkdirSync(path.join(WS, 'capture'), { recursive: true })
for (const d of ['fonts', 'sfx', 'bgm']) execFileSync('cp', ['-R', path.join(SHARED, d), path.join(WS, 'assets', d)])
fs.copyFileSync(path.join(SHARED, 'bgm', product === 'avc' ? 'bed-afro.wav' : 'bed-pop.wav'), path.join(WS, 'assets/bgm/bed.wav'))
fs.writeFileSync(path.join(WS, 'topic.json'), JSON.stringify(topic, null, 1))
execFileSync('npx', ['-y', 'hyperframes@0.8.75', 'init', 'long', '--non-interactive', '--example=blank', '--skill=general-video'], { cwd: WS, stdio: 'ignore' })
fs.symlinkSync('../assets', path.join(WS, 'long', 'assets'))
const NM = path.join(ROOT, 'videos/freellm-free-claude/node_modules')
if (fs.existsSync(NM)) fs.symlinkSync(NM, path.join(WS, 'long', 'node_modules'))
console.log(`started ${product}: ${title}\n  ${WS}\n  next: put the screen recording in capture/ (recording.mp4 or .mov), then node scripts/long/produce.mjs ${path.relative(ROOT, WS)}`)
