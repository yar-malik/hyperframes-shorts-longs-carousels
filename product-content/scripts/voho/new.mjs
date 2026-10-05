/**
 * Starts the workspace for one topic of the Voho plan (content/voho/voho-30-day-plan.json).
 *
 *   node scripts/voho/new.mjs next          # the first topic not yet published (content/voho/progress.json)
 *   node scripts/voho/new.mjs 7             # topic 7
 *
 * → videos/voho-<nn>-<slug>/ with topic.json (the plan entry plus blanks to write: see .claude/skills/voho-content/SKILL.md),
 *   assets/ (fonts, music bed, sound effects) and two HyperFrames projects, long/ and reel/, that share assets/.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/voho/voho-30-day-plan.json'), 'utf8'))
const progFile = path.join(ROOT, 'content/voho/progress.json')
const progress = fs.existsSync(progFile) ? JSON.parse(fs.readFileSync(progFile, 'utf8')) : {}
const arg = process.argv[2] ?? 'next'
const p = arg === 'next' ? plan.find((x) => progress[x.n]?.status !== 'published') : plan.find((x) => x.n === +arg)
if (!p) { console.log('nothing left in the plan'); process.exit(0) }

const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 6).join('-')
const WS = path.join(ROOT, 'videos', `voho-${String(p.n).padStart(2, '0')}-${slug}`)
if (fs.existsSync(path.join(WS, 'topic.json'))) { console.log(`already started: ${WS}`); process.exit(0) }

// The painted scene's look per industry: the window view, the three pictures on the wall, and the booking card's icon.
const LOOK = {
  'Banking': ['city', ['bank', 'card', 'doc'], 'bank'], 'Insurance': ['city', ['shield', 'car', 'doc'], 'shield'],
  'Oil & gas': ['refinery', ['drop', 'derrick', 'tank'], 'drop'], 'Telecom': ['city', ['tower', 'card', 'doc'], 'tower'],
  'Healthcare': ['city', ['cross', 'doc', 'people'], 'cross'], 'Airlines': ['airport', ['plane', 'doc', 'card'], 'plane'],
  'Hospitality': ['city', ['dish', 'house', 'doc'], 'dish'], 'Retail': ['city', ['cart', 'box', 'card'], 'cart'],
  'Logistics': ['city', ['box', 'car', 'doc'], 'box'], 'Utilities': ['city', ['bolt', 'doc', 'house'], 'bolt'],
  'Automotive': ['city', ['car', 'doc', 'card'], 'car'], 'Government': ['city', ['doc', 'people', 'bank'], 'doc'],
  'Real estate': ['city', ['house', 'house', 'house'], 'house'], 'Any business': ['city', ['people', 'doc', 'box'], 'people'],
}
const [view, icons, cardIcon] = LOOK[p.industry] ?? LOOK['Any business']
const CREW = ['Hum', 'Nora', 'Saad', 'Reem', 'Bader', 'Lulu', 'Zaid', 'Mona']
const rot = (k) => CREW.map((_, i) => CREW[(i + k) % CREW.length])
const r = rot(p.n % CREW.length)

const topic = {
  n: p.n, day: p.day, date: p.date, slug, title: p.title, industry: p.industry, template: p.template, scenario: p.scenario, hook: p.hook,
  agent: { name: '', greeting: '', instructions: '' },
  caller: { voice: 'omar', lines: [] },
  vo: { v1: '', v2: '', v3: '', v4: '', v5: '', v6: '' },
  scene: { view, icons, cardIcon, cardCol: p.n % 4, cardHour: 3 + (p.n % 6), deskCrew: [...r.slice(1, 4), 'Hum'].slice(0, 4), floorCrew: r },
  subtitles: [],
  long: { step3: '', segments: null },
  reel: { headline: ['', ''], tags: ['', 'A real call · in Saudi Arabic', ''], segments: null },
  endcard: 'Every call answered, in Saudi Arabic',
  // YouTube thumbnail + the reel's opening frame (its Instagram cover): what you'll build, and how fast (voho-content skill)
  thumbnail: { headline: [p.n % 2 ? 'BUILD A' : 'AUTOMATE', '', 'IN 60 SECONDS'], tag: 'Real call · Saudi Arabic', arabic: 'بالعربي', thumb: { hero: 'Hum', crew: r.slice(1, 3), mood: 'excited' } },
  publish: { youtubeTitle: '', youtubeDescription: '', reelCaption: '', linkedin: '', linkedinComment: 'Try it: https://app.voho.ai' },
}

// shared assets (fonts, music bed, sound effects) live once in videos/_voho-shared
const SHARED = path.join(ROOT, 'videos/_voho-shared')
if (!fs.existsSync(SHARED)) {
  const src = path.join(ROOT, 'videos/voho-property-hum/assets')
  fs.mkdirSync(SHARED, { recursive: true })
  for (const d of ['fonts', 'sfx', 'bgm']) execFileSync('cp', ['-R', path.join(src, d), path.join(SHARED, d)])
}
fs.mkdirSync(path.join(WS, 'assets/vo'), { recursive: true })
for (const d of ['fonts', 'sfx', 'bgm']) execFileSync('cp', ['-R', path.join(SHARED, d), path.join(WS, 'assets', d)])
// the music bed: modern tracks made for this (videos/_voho-shared/bgm/README.md), alternating so neighbours differ
fs.copyFileSync(path.join(SHARED, 'bgm', p.n % 2 ? 'bed-pop.wav' : 'bed-afro.wav'), path.join(WS, 'assets/bgm/bed.wav'))
fs.writeFileSync(path.join(WS, 'topic.json'), JSON.stringify(topic, null, 1))

for (const kind of ['long', 'reel']) {
  execFileSync('npx', ['-y', 'hyperframes@0.8.75', 'init', kind, '--non-interactive', '--example=blank', '--skill=general-video'], { cwd: WS, stdio: 'ignore' })
  fs.symlinkSync('../assets', path.join(WS, kind, 'assets'))
  fs.symlinkSync(path.join(ROOT, 'videos/freellm-free-claude/node_modules'), path.join(WS, kind, 'node_modules'))
}
console.log(`started topic ${p.n} (day ${p.day}, ${p.industry}): ${p.title}\n  ${WS}\n  next: fill in topic.json (.claude/skills/voho-content/SKILL.md), then node scripts/voho/produce.mjs ${path.relative(ROOT, WS)}`)
