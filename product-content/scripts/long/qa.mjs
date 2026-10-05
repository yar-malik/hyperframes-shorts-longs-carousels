/**
 * The gate before a CCM or AVC long video is published (the Voho gate, scripts/voho/qa.mjs, minus the call checks).
 *
 *   node scripts/long/qa.mjs <workspace>      → prints each check, writes <workspace>/qa.json, exits 1 on a failure
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync, execFileSync } from 'node:child_process'

const WS = path.resolve(process.argv[2] ?? '.')
const topic = JSON.parse(fs.readFileSync(path.join(WS, 'topic.json'), 'utf8'))
const out = []
const check = (name, ok, detail = '') => { out.push({ name, ok, detail }); console.log(`${ok ? '  ok  ' : '  FAIL'} ${name}${detail ? ' — ' + detail : ''}`) }
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())
const f = path.join(WS, 'long/renders/long-web.mp4')

if (!fs.existsSync(f)) check('long: rendered', false, f)
else {
  const d = dur(f)
  check(`long: length ${d.toFixed(1)}s`, d >= 80 && d <= 130, 'expected 80-130s')
  check('long: under 60 MB', fs.statSync(f).size < 60e6, `${(fs.statSync(f).size / 1e6).toFixed(1)} MB`)
  const quiet = []
  for (let t = 0; t < Math.floor(d) - 1; t++) {
    const r = spawnSync('ffmpeg', ['-hide_banner', '-ss', String(t), '-t', '1', '-i', f, '-vn', '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' })
    const m = r.stderr.match(/mean_volume: (-?[0-9.]+) dB/)
    if (m && +m[1] < -34) quiet.push(`${t}s (${m[1]} dB)`)
  }
  check('long: never quiet (every second above -34 dB)', quiet.length === 0, quiet.slice(0, 6).join(', '))
}
check('v1 opens on the promise ("Today I\'ll show you how…")', /\b(show|teach) you\b/i.test(topic.vo?.v1 ?? ''), (topic.vo?.v1 ?? '').slice(0, 80))
check('the setup has its step pills', (topic.recording?.steps ?? []).filter((s) => s.text && s.at != null).length >= 3)
check('the result has at least 3 cuts', (topic.recording?.cuts ?? []).length >= 3, `${(topic.recording?.cuts ?? []).length} cut(s)`)
for (const k of ['youtubeTitle', 'youtubeDescription', 'linkedin']) check(`publish.${k} written`, !!topic.publish?.[k])
check('YouTube title ≤100 characters', (topic.publish?.youtubeTitle ?? '').length <= 100)
const ty = path.join(WS, 'thumb-youtube.jpg')
check('YouTube thumbnail made (1280×720, under 2 MB)', fs.existsSync(ty) && fs.statSync(ty).size < 2 * 1024 * 1024)
const pass = out.every((c) => c.ok)
fs.writeFileSync(path.join(WS, 'qa.json'), JSON.stringify({ pass, at: new Date().toISOString(), checks: out }, null, 1))
console.log(pass ? '\nQA PASSED' : '\nQA FAILED — nothing will be published')
process.exit(pass ? 0 : 1)
