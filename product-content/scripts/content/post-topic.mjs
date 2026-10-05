/**
 * Posts one topic's written pieces: the Instagram deck, the LinkedIn deck, the LinkedIn post, the tweet and the X
 * article, to the product's channels (scripts/content/channels.mjs). Videos go out through their own pipelines.
 *
 *   node scripts/content/post-topic.mjs <slug> --product ccm|avc|voho                 # drafts only (the default)
 *   node scripts/content/post-topic.mjs <slug> --product ccm --only tweet,liPost      # some of the pieces
 *   node scripts/content/post-topic.mjs <slug> --product ccm --publish               # live, when Yar says so
 *   node scripts/content/post-topic.mjs <slug> --product ccm --clean                 # delete the drafts it made
 *   … --tweet-text-only   the tweet goes out without the picture (when the claim is the whole post)
 *
 * Reads public/content-automation/made/<slug>/pieces.json (scripts/content/render-topic-pieces.mjs writes it) and
 * records what it did in posted.json beside it, so a re-run never posts a piece twice. Drafts land in Postiz or
 * Socialit where Yar can look at them before anything goes out. --publish posts for real, checks each post by its
 * exact id, and prints the live links.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { POSTIZ, SOCIALIT, ROUTES } from './channels.mjs'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const arg = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : undefined }
const slug = process.argv[2], product = arg('product')
const PUBLISH = process.argv.includes('--publish'), CLEAN = process.argv.includes('--clean')
if (!slug || !ROUTES[product]) { console.error('usage: post-topic.mjs <slug> --product ccm|avc|voho [--only a,b] [--publish | --clean]'); process.exit(1) }
const PIECES = ['igDeck', 'liDeck', 'liPost', 'tweet', 'article']
const only = arg('only') ? arg('only').split(',') : PIECES
for (const p of only) if (!PIECES.includes(p)) { console.error(`unknown piece ${p}; pieces are ${PIECES.join(', ')}`); process.exit(1) }

const MADE = path.join(ROOT, 'public/content-automation/made', slug)
const P = JSON.parse(fs.readFileSync(path.join(MADE, 'pieces.json'), 'utf8'))
const local = (url) => path.join(ROOT, 'public', url)
const logFile = path.join(MADE, 'posted.json')
const log = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf8')) : {}
const save = () => fs.writeFileSync(logFile, JSON.stringify(log, null, 1))
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'post-topic-'))

// ------------------------------------------------------------ Postiz
const PZ = ['-y', 'postiz@2.0.16']
const pz = (args) => execFileSync('npx', [...PZ, ...args], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64e6, timeout: 600e3 })
const json = (out) => JSON.parse(out.slice(out.indexOf('{')))
const uploads = {}
const upload = (url) => (uploads[url] ??= json(pz(['upload', local(url)])))
const IDENT = { youtubeMain: 'youtube', youtubeTeam: 'youtube', x: 'x', igYarmalikhere: 'instagram-standalone', igCcm: 'instagram-standalone', liVoho: 'linkedin-page', liAvc: 'linkedin-page', liCcm: 'linkedin-page' }

function postiz(to, text, media, settings) {
  const when = new Date(Date.now() + (PUBLISH ? 120e3 : 7 * 864e5)).toISOString().replace(/\.\d+Z$/, 'Z')
  const args = ['posts:create', '-c', text, '-i', POSTIZ[to], '-s', when, '-t', PUBLISH ? 'schedule' : 'draft',
    '--settings', JSON.stringify({ __type: IDENT[to], ...settings })]
  if (media.length) args.splice(3, 0, '-m', media.map((u) => upload(u).path).join(','))
  const out = pz(args)
  const id = (out.match(/"postId":\s*"([^"]+)"/) || [])[1]
  if (!id) throw new Error(`Postiz ${to}: ${out.slice(-400)}`)
  return id
}
function postizLive(id) {                          // by the exact post id, never by reading the list as text
  for (let i = 0; i < 45; i++) {
    execFileSync('sleep', ['20'])
    const p = (json(pz(['posts:list'])).posts || []).find((x) => x.id === id)
    if (p?.state === 'ERROR') throw new Error(`Postiz post ${id} failed: ${p.error || ''}`)
    if (p?.state === 'PUBLISHED') return p.releaseURL || '(published; no link returned)'
  }
  throw new Error(`Postiz post ${id} still queued after 15 min; re-run to pick it up`)
}

// ------------------------------------------------------------ Socialit
function socialit(to, text, media) {
  const tf = path.join(TMP, 'text.txt'); fs.writeFileSync(tf, text)
  const out = execFileSync('node', ['scripts/content/socialit.mjs', 'post', '--to', to, ...media.flatMap((u) => ['--file', local(u)]),
    '--text', tf, ...(PUBLISH ? ['--no-sync'] : ['--draft'])], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64e6, timeout: 1200e3 })
  const m = out.match(/(DRAFT|PUBLISHED) (\S+)/)
  if (!m) throw new Error(`Socialit ${to}: ${out.slice(-400)}`)
  return m[2]
}

// ------------------------------------------------------------ the X article: its markdown as the HTML X keeps
function articleHtml(md) {
  const inline = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  const out = []
  for (const block of md.split(/\n\s*\n/)) {
    const lines = block.split('\n').filter(Boolean)
    if (!lines.length) continue
    if (/^#{1,3} /.test(lines[0])) { const n = lines[0].match(/^#+/)[0].length; out.push(`<h${n + 1 > 3 ? 3 : n + 1}>${inline(lines[0].replace(/^#+ /, ''))}</h${n + 1 > 3 ? 3 : n + 1}>`); lines.shift(); if (!lines.length) continue }
    if (lines.every((l) => /^\d+\. /.test(l))) out.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`)
    else if (lines.every((l) => /^[-*] /.test(l))) out.push(`<ul>${lines.map((l) => `<li>${inline(l.replace(/^[-*] /, ''))}</li>`).join('')}</ul>`)
    else out.push(`<p>${inline(lines.join(' '))}</p>`)
  }
  return out.join('')
}

// ------------------------------------------------------------ what each piece is
const PIECE = {
  igDeck:  () => P.ig && { text: P.ig.caption, media: P.ig.slides, settings: { post_type: 'post' } },
  liDeck:  () => P.li && { text: P.li.caption, media: P.li.slides, settings: { post_as_images_carousel: true, carousel_name: P.article?.title?.slice(0, 80) || slug } },
  liPost:  () => P.lipost && { text: P.lipost.text, media: P.lipost.image ? [P.lipost.image] : [], settings: { post_as_images_carousel: false } },
  // a tweet is a caption to something you can see: it carries the LinkedIn post's picture unless --tweet-text-only
  tweet:   () => P.tweet && { text: P.tweet.text, media: P.lipost?.image && !process.argv.includes('--tweet-text-only') ? [P.lipost.image] : [], settings: { who_can_reply_post: 'everyone', post_type: 'post' } },
  article: () => P.article && {
    text: articleHtml(P.article.body), media: [],
    settings: () => ({ post_type: 'article', article_title: P.article.title, article_status: PUBLISH ? 'published' : 'draft',
      ...(P.article.cover ? { article_cover: (({ id, path: p }) => ({ id, path: p }))(upload(P.article.cover)) } : {}) }),
  },
}

// ------------------------------------------------------------ clean: delete the drafts this made
if (CLEAN) {
  for (const [key, rec] of Object.entries(log)) {
    if (rec.state !== 'draft') continue
    try {
      if (rec.via === 'postiz') pz(['posts:delete', rec.id])
      else execFileSync('node', ['scripts/content/socialit.mjs', 'call', `DELETE posts/${rec.id}`], { cwd: ROOT, encoding: 'utf8' })
      delete log[key]; save(); console.log('deleted draft', key)
    } catch (e) { console.log('! could not delete', key, e.message.slice(0, 200)) }
  }
  process.exit(0)
}

// ------------------------------------------------------------ post
for (const piece of only) {
  const made = PIECE[piece]()
  if (!made) { console.log(`- ${piece}: not in pieces.json, skipped`); continue }
  for (const r of ROUTES[product][piece]) {
    const key = `${piece}:${r.to}`
    const had = log[key]
    if (had?.state === 'live') { console.log(`= ${key} already live: ${had.url}`); continue }
    if (had?.state === 'draft' && !PUBLISH) { console.log(`= ${key} already a draft (${had.id})`); continue }
    if (had?.state === 'draft' && PUBLISH) {                      // replace the draft with the real post
      try { r.via === 'postiz' ? pz(['posts:delete', had.id]) : execFileSync('node', ['scripts/content/socialit.mjs', 'call', `DELETE posts/${had.id}`], { cwd: ROOT }) } catch {}
    }
    const settings = typeof made.settings === 'function' ? made.settings() : made.settings
    if (r.via === 'postiz') {
      const id = postiz(r.to, made.text, made.media, settings)
      log[key] = { via: 'postiz', id, state: PUBLISH ? 'queued' : 'draft', at: new Date().toISOString() }; save()
      if (PUBLISH) { log[key] = { ...log[key], state: 'live', url: postizLive(id) }; save() }
    } else {
      if (!SOCIALIT[r.to]) throw new Error(`no Socialit account named ${r.to}`)
      const res = socialit(r.to, made.text, made.media)
      log[key] = PUBLISH ? { via: 'socialit', state: 'live', url: res, at: new Date().toISOString() } : { via: 'socialit', id: res, state: 'draft', at: new Date().toISOString() }
      save()
    }
    console.log(`${PUBLISH ? '✓ live ' : '✓ draft'} ${key} ${log[key].url || log[key].id}`)
  }
}
fs.rmSync(TMP, { recursive: true, force: true })
// what went live shows on the Published calendar now, not at the next manual sync (Yar, 2026-09-30)
if (PUBLISH) {
  try { console.log(execFileSync('node', ['scripts/voho/board.mjs', 'sync'], { cwd: ROOT, encoding: 'utf8', timeout: 900e3 }).split('\n').filter((l) => /new,|wrote|Nothing/.test(l)).join('\n')) }
  catch (e) { console.log(`the Published calendar sync failed (${String(e.message).split('\n')[0]}); run: node scripts/voho/board.mjs sync`) }
}
if (!PUBLISH) console.log(`\nDrafts only. Look at them in Postiz and Socialit, then post for real with --publish (only when Yar says to),\nor remove them with --clean.`)
