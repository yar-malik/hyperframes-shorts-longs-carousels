/**
 * Publishes a CCM or AVC long video once QA has passed: Yar's main YouTube channel (public) and the product's LinkedIn
 * Page (the link as the first comment), through Postiz (scripts/content/channels.mjs). Resumable.
 *
 *   node scripts/long/publish.mjs <workspace>
 *
 * Writes <workspace>/published.json. The YouTube thumbnail is the one step it can't do: set thumb-youtube.jpg in
 * YouTube Studio (published.json keeps it `pending`).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { POSTIZ, ROUTES } from '../content/channels.mjs'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const WS = path.resolve(process.argv[2] ?? '.')
const topic = JSON.parse(fs.readFileSync(path.join(WS, 'topic.json'), 'utf8'))
const qa = fs.existsSync(path.join(WS, 'qa.json')) ? JSON.parse(fs.readFileSync(path.join(WS, 'qa.json'), 'utf8')) : null
if (!qa?.pass) { console.error('QA has not passed (node scripts/long/qa.mjs) — refusing to publish'); process.exit(1) }
const routes = ROUTES[topic.product]?.long
if (!routes) throw new Error(`no routes for ${topic.product}`)

const pubFile = path.join(WS, 'published.json')
const pub = fs.existsSync(pubFile) ? JSON.parse(fs.readFileSync(pubFile, 'utf8')) : {}
const save = () => fs.writeFileSync(pubFile, JSON.stringify(pub, null, 1))
const long = path.join(WS, 'long/renders/long-web.mp4'), P = topic.publish
const PZ = ['-y', 'postiz@2.0.16']
const pz = (args) => execFileSync('npx', [...PZ, ...args], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64e6, timeout: 1800e3 })
const json = (out) => JSON.parse(out.slice(out.indexOf('{')))
let media
const upload = () => (media ??= json(pz(['upload', long])).path)
const when = () => new Date(Date.now() + 120e3).toISOString().replace(/\.\d+Z$/, 'Z')
function live(id, what) {                          // by the exact post id, never by reading the list as text
  for (let i = 0; i < 60; i++) {
    execFileSync('sleep', ['20'])
    const p = (json(pz(['posts:list'])).posts || []).find((x) => x.id === id)
    if (p?.state === 'ERROR') throw new Error(`${what} failed: ${p.error || ''}`)
    if (p?.state === 'PUBLISHED' && p.releaseURL) return p.releaseURL
  }
  throw new Error(`${what} still queued after 20 min — re-run publish.mjs to resume`)
}

for (const r of routes) {
  if (pub[r.to]) { console.log('=', r.to, pub[r.to]); continue }
  if (r.via !== 'postiz') throw new Error(`${r.to}: only Postiz routes are wired for long videos`)
  if (r.to.startsWith('youtube')) {
    const made = pz(['posts:create', '-c', P.youtubeDescription, '-m', upload(), '-i', POSTIZ[r.to], '-s', when(), '-t', 'schedule',
      '--settings', JSON.stringify({ __type: 'youtube', title: P.youtubeTitle, type: 'public', selfDeclaredMadeForKids: 'no' })])
    const id = (made.match(/"postId":\s*"([^"]+)"/) || [])[1]
    if (!id) throw new Error('YouTube post not created: ' + made.slice(-300))
    const url = live(id, 'YouTube')
    // the link must be this video: check its title with YouTube itself
    const o = JSON.parse(execFileSync('curl', ['-s', `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`], { encoding: 'utf8' }))
    if (o.title !== P.youtubeTitle) throw new Error(`YouTube link ${url} is "${o.title}", not "${P.youtubeTitle}"`)
    pub[r.to] = url; pub.youtubeThumbnail = { file: path.join(WS, 'thumb-youtube.jpg'), status: 'pending' }
  } else {
    const made = pz(['posts:create', '-c', P.linkedin, '-m', upload(), '-c', P.linkedinComment, '-i', POSTIZ[r.to], '-s', when(), '-t', 'schedule',
      '--settings', JSON.stringify({ __type: 'linkedin-page', post_as_images_carousel: false })])
    const id = (made.match(/"postId":\s*"([^"]+)"/) || [])[1]
    if (!id) throw new Error('LinkedIn post not created: ' + made.slice(-300))
    pub[r.to] = live(id, 'LinkedIn')
  }
  save(); console.log('✓', r.to, pub[r.to])
}
console.log(`\npublished: ${topic.title}\n  set the YouTube thumbnail (thumb-youtube.jpg) in YouTube Studio`)
