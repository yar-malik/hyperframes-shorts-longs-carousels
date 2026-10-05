/**
 * The gate before anything is published. Every check must pass, or publish.mjs refuses.
 *
 *   node scripts/voho/qa.mjs <workspace>      → prints each check, writes <workspace>/qa.json, exits 1 on a failure
 *
 * Yar's rules (2026-09-25, memory: video-and-reel-rules): never quiet, short voice-agent turns, a designed cover
 * frame, more cuts. Measured, not assumed.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync, execFileSync } from 'node:child_process'

const WS = path.resolve(process.argv[2] ?? '.')
const topic = JSON.parse(fs.readFileSync(path.join(WS, 'topic.json'), 'utf8'))
const SEG = JSON.parse(fs.readFileSync(path.join(WS, 'segments.json'), 'utf8')).segments
const out = []
const check = (name, ok, detail = '') => { out.push({ name, ok, detail }); console.log(`${ok ? '  ok  ' : '  FAIL'} ${name}${detail ? ' — ' + detail : ''}`) }
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())
const files = { long: path.join(WS, 'long/renders/long-web.mp4'), reel: path.join(WS, 'reel/renders/reel-web.mp4') }

for (const [k, f] of Object.entries(files)) {
  if (!fs.existsSync(f)) { check(`${k}: rendered`, false, f); continue }
  const d = dur(f), [lo, hi] = k === 'long' ? [55, 130] : [25, 60]
  check(`${k}: length ${d.toFixed(1)}s`, d >= lo && d <= hi, `expected ${lo}-${hi}s`)
  check(`${k}: under 60 MB for Socialit`, fs.statSync(f).size < 60e6, `${(fs.statSync(f).size / 1e6).toFixed(1)} MB`)
  // never quiet: mean volume of every whole second (the last one is the sign-off and may fade)
  const quiet = []
  for (let t = 0; t < Math.floor(d) - 1; t++) {
    const r = spawnSync('ffmpeg', ['-hide_banner', '-ss', String(t), '-t', '1', '-i', f, '-vn', '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' })
    const m = r.stderr.match(/mean_volume: (-?[0-9.]+) dB/)
    if (m && +m[1] < -34) quiet.push(`${t}s (${m[1]} dB)`)
  }
  check(`${k}: never quiet (every second above -34 dB)`, quiet.length === 0, quiet.slice(0, 6).join(', '))
}

// the reel's first frame is its thumbnail: it must be the designed cover, not a blank card
if (fs.existsSync(files.reel)) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', files.reel, '-frames:v', '1', '-vf', 'signalstats,metadata=print', '-f', 'null', '-'], { encoding: 'utf8' })
  const lo = +(r.stderr.match(/YMIN=(\d+)/) || [])[1], hi = +(r.stderr.match(/YMAX=(\d+)/) || [])[1]
  check('reel: frame 0 is a real cover (not blank)', hi - lo > 120, `luma range ${lo}-${hi}`)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', files.reel, '-frames:v', '1', '-vf', 'scale=540:-2', path.join(WS, 'reel-cover.jpg')])
}

// every call cut in the long video has its subtitle; voice turns stay short
const pick = topic.long?.segments ?? SEG.map((s) => s.i)
const missing = pick.filter((i) => !(typeof topic.subtitles?.[i] === 'string' ? topic.subtitles[i] : topic.subtitles?.[i]?.en))
check('every call cut has an English subtitle', missing.length === 0, missing.length ? `segments ${missing.join(', ')}` : '')
check('v1 opens on the promise ("Today I\'ll show you how…")', /\b(show|teach) you\b/i.test(topic.vo?.v1 ?? ''), (topic.vo?.v1 ?? '').slice(0, 80))
const longCaller = (topic.caller?.lines ?? []).filter((l) => l.split(/\s+/).length > 16)
check('caller lines are short (≤16 words)', longCaller.length === 0, longCaller.join(' | ').slice(0, 120))
const longAgent = SEG.filter((s) => s.who === 'agent' && s.i > 0 && s.len > 9)
check('agent turns are short (≤9 s)', longAgent.length === 0, longAgent.map((s) => `#${s.i} ${s.len}s`).join(', ') + (longAgent.length ? ' (trim them via long/reel.segments, or re-record)' : ''))
for (const k of ['youtubeTitle', 'youtubeDescription', 'reelCaption', 'linkedin']) check(`publish.${k} written`, !!topic.publish?.[k])
check('YouTube title ≤100 characters', (topic.publish?.youtubeTitle ?? '').length <= 100)

const ty = path.join(WS, 'thumb-youtube.jpg')
check('YouTube thumbnail made (1280×720, under 2 MB)', fs.existsSync(ty) && fs.statSync(ty).size < 2 * 1024 * 1024)
check('reel cover made (the reel opens on it)', fs.existsSync(path.join(WS, 'assets/thumb-reel.png')))
const pass = out.every((c) => c.ok)
fs.writeFileSync(path.join(WS, 'qa.json'), JSON.stringify({ pass, at: new Date().toISOString(), checks: out }, null, 1))
console.log(pass ? '\nQA PASSED' : '\nQA FAILED — nothing will be published')
process.exit(pass ? 0 : 1)
