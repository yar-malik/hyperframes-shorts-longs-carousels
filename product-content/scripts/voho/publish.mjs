/**
 * Publishes one topic everywhere, once QA has passed, and records it on the board.
 *
 *   node scripts/voho/publish.mjs <workspace>
 *   SKIP=facebook node scripts/voho/publish.mjs <workspace>     # leave a channel out (facebook, linkedin)
 *
 *   long → Voho YouTube (Socialit, public) · Voho LinkedIn Page (Postiz, link as the first comment)
 *   reel → Voho Instagram · Voho Facebook Page (Socialit; Facebook gets reels only — Yar, 2026-09-25)
 * Then: <workspace>/published.json, content/voho/progress.json, the Voho topic marked done with its links, and the
 * Published calendar synced. Resumable: a platform already in published.json is not posted twice.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const WS = path.resolve(process.argv[2] ?? '.')
const topic = JSON.parse(fs.readFileSync(path.join(WS, 'topic.json'), 'utf8'))
const qa = fs.existsSync(path.join(WS, 'qa.json')) ? JSON.parse(fs.readFileSync(path.join(WS, 'qa.json'), 'utf8')) : null
if (!qa?.pass) { console.error('QA has not passed (node scripts/voho/qa.mjs) — refusing to publish'); process.exit(1) }

const pubFile = path.join(WS, 'published.json')
const pub = fs.existsSync(pubFile) ? JSON.parse(fs.readFileSync(pubFile, 'utf8')) : {}
const save = () => fs.writeFileSync(pubFile, JSON.stringify(pub, null, 1))
const long = path.join(WS, 'long/renders/long-web.mp4'), reel = path.join(WS, 'reel/renders/reel-web.mp4')
const P = topic.publish
const txt = (name, body) => { const f = path.join(WS, name); fs.writeFileSync(f, body.trim() + '\n'); return f }
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64e6, timeout: 1800e3, ...opts })
const socialit = (to, file, text, extra = []) => {
  const o = sh('node', ['scripts/content/socialit.mjs', 'post', '--to', to, '--file', file, '--text', text, '--no-sync', ...extra])
  const m = o.match(/PUBLISHED (\S+)/); if (!m) throw new Error(`${to}: ${o.slice(-400)}`)
  return m[1]
}

if (!pub.youtube) {
  pub.youtube = socialit('voho-youtube', long, txt('youtube-description.txt', P.youtubeDescription), ['--title', P.youtubeTitle, '--privacy', 'public'])
  // the link must be this video: check its title with YouTube itself (2026-09-24: a list read once handed over the wrong one)
  const o = JSON.parse(sh('curl', ['-s', `https://www.youtube.com/oembed?url=${encodeURIComponent(pub.youtube)}&format=json`]))
  if (o.title !== P.youtubeTitle) throw new Error(`YouTube link ${pub.youtube} is "${o.title}", not "${P.youtubeTitle}"`)
  pub.youtubeThumbnail = { file: path.join(WS, 'thumb-youtube.jpg'), status: 'pending' }   // Socialit can't set it: vidIQ or Studio (voho-content skill)
  save(); console.log('youtube  ', pub.youtube, '\n  thumbnail pending: set it with vidIQ (vidiq_update_video_thumbnail) or YouTube Studio')
}
const caption = txt('reel-caption.txt', P.reelCaption)
if (!pub.instagram) { pub.instagram = socialit('voho-instagram', reel, caption); save(); console.log('instagram', pub.instagram) }
// SKIP=facebook,linkedin leaves a channel out when Yar asked for only some of them; it's recorded, not posted later by accident
const SKIP = (process.env.SKIP || '').split(',').filter(Boolean)
for (const k of SKIP) { pub.skipped = { ...pub.skipped, [k]: `not asked for (${new Date().toISOString().slice(0, 10)})` }; save() }
if (!pub.facebook && !pub.skipped?.facebook) { pub.facebook = socialit('voho-facebook', reel, caption); save(); console.log('facebook ', pub.facebook) }

if (!pub.linkedin && !pub.skipped?.linkedin) {
  const POSTIZ = ['-y', 'postiz@2.0.16'], VOHO_LI = 'cmuh0a87o035ppr0yvt9yqpy9'
  const up = sh('npx', [...POSTIZ, 'upload', long]); const url = (up.match(/"path": "([^"]+)"/) || [])[1]
  if (!url) throw new Error('Postiz upload failed: ' + up.slice(-300))
  const when = new Date(Date.now() + 120e3).toISOString().replace(/\.\d+Z$/, 'Z')
  const made = sh('npx', [...POSTIZ, 'posts:create', '-c', P.linkedin, '-m', url, '-c', P.linkedinComment, '-i', VOHO_LI, '-s', when,
    '--settings', JSON.stringify({ __type: 'linkedin-page', post_as_images_carousel: false })])
  const id = (made.match(/"postId": "([^"]+)"/) || [])[1]
  if (!id) throw new Error('Postiz post not created: ' + made.slice(-300))
  pub.linkedinPostId = id; save()
  for (let i = 0; i < 60 && !pub.linkedin; i++) {           // by the exact post id, never by reading the list as text
    execFileSync('sleep', ['20'])
    const raw = sh('npx', [...POSTIZ, 'posts:list']); const d = JSON.parse(raw.slice(raw.indexOf('{')))
    const p = (d.posts || []).find((x) => x.id === id)
    if (p?.state === 'PUBLISHED' && p.releaseURL) pub.linkedin = p.releaseURL
    if (p?.state === 'ERROR') throw new Error('LinkedIn post failed: ' + (p.error || ''))
  }
  if (!pub.linkedin) throw new Error('LinkedIn still queued after 20 min — re-run publish.mjs to resume')
  save(); console.log('linkedin ', pub.linkedin)
}

// progress, then the board: the topic marked done with its links, and the Published calendar synced
const progFile = path.join(ROOT, 'content/voho/progress.json')
const progress = fs.existsSync(progFile) ? JSON.parse(fs.readFileSync(progFile, 'utf8')) : {}
progress[topic.n] = { status: 'published', at: new Date().toISOString(), workspace: path.relative(ROOT, WS), ...pub }
fs.writeFileSync(progFile, JSON.stringify(progress, null, 1))
sh('node', ['scripts/voho/board.mjs', 'mark', WS], { stdio: 'inherit' })
sh('node', ['scripts/voho/board.mjs', 'sync'], { stdio: 'inherit' })
console.log(`\npublished topic ${topic.n}: ${topic.title}`)
