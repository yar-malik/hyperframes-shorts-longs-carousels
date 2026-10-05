/**
 * Cuts the recorded call into one segment per turn, with the dead air between turns removed.
 *
 *   node scripts/voho/segments.mjs <workspace>      → <workspace>/segments.json
 *
 * Speech is found with silencedetect (-38 dB, 0.4 s) on the capture's audio; each stretch is the caller's if it
 * overlaps one of the recorder's caller_N_start..end marks, otherwise the agent's. Neighbouring stretches of the same
 * speaker merge. The first segment starts at the dial so "Call" is on screen. Every word said is kept; only the
 * silence goes (Yar, 2026-09-25: voice agents must not take long, and cuts make it better).
 * The final transcript (Arabic, as the console shows it) is written alongside, for the English subtitles.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const WS = path.resolve(process.argv[2] ?? '.')
const cap = path.join(WS, 'capture')
const { marks } = JSON.parse(fs.readFileSync(path.join(cap, 'marks.json'), 'utf8'))
const at = (n) => marks.find((m) => m.name === n)?.t
const video = path.join(cap, 'walkthrough.mp4')
const from = at('call_live') - 0.5, to = at('call_end') ?? at('done')
if (from == null || to == null) throw new Error('the capture has no call (call_live / call_end marks missing)')

const r = spawnSync('ffmpeg', ['-hide_banner', '-ss', String(from), '-to', String(to), '-i', video, '-af', 'silencedetect=noise=-38dB:d=0.4', '-f', 'null', '-'], { encoding: 'utf8' })
const ev = [...r.stderr.matchAll(/silence_(start|end): ([0-9.]+)/g)].map((m) => ({ k: m[1], t: +m[2] + from }))
// speech = the gaps between silences
let speech = [], cur = from
for (const e of ev) { if (e.k === 'start') { if (e.t - cur > 0.25) speech.push([cur, e.t]); } else cur = e.t }
if (to - cur > 0.25 && !(ev.length && ev[ev.length - 1].k === 'start')) speech.push([cur, to])

const callers = marks.filter((m) => /^caller_\d+_start$/.test(m.name)).map((m) => {
  const n = m.name.split('_')[1]; return [m.t - 0.2, at(`caller_${n}_end`) + 0.3]
})
const who = ([a, b]) => callers.some(([c, d]) => a < d && b > c) ? 'caller' : 'agent'
let segs = []
for (const s of speech) {
  const w = who(s), last = segs[segs.length - 1]
  if (last && last.who === w && s[0] - last.out < 1.0) last.out = s[1]
  else segs.push({ who: w, in: s[0], out: s[1] })
}
segs = segs.filter((s) => s.out - s.in > 0.5)
segs.forEach((s) => { s.speechIn = s.in; s.in = Math.max(from, s.in - 0.15); s.out = Math.min(to, s.out + 0.15) })
if (segs.length && segs[0].who === 'agent') segs[0].in = Math.max(0, at('call_start') - 0.6)   // open on the Call button
segs = segs.map((s, i) => ({ i, who: s.who, in: +s.in.toFixed(2), out: +s.out.toFixed(2), len: +(s.out - s.in).toFixed(2), speechIn: +s.speechIn.toFixed(2) }))   // speechIn: where the words start

const lastReply = marks.filter((m) => /^agent_reply_\d+$/.test(m.name)).pop()
const transcript = lastReply?.transcript ?? []
fs.writeFileSync(path.join(WS, 'segments.json'), JSON.stringify({ segments: segs, transcript }, null, 1))
for (const s of segs) console.log(`${String(s.i).padStart(2)} ${s.who.padEnd(6)} ${s.in.toFixed(2)}→${s.out.toFixed(2)} (${s.len}s)`)
console.log(`\n${segs.length} segments, ${segs.reduce((a, s) => a + s.len, 0).toFixed(1)}s of call (was ${(to - from).toFixed(1)}s)`)
console.log('transcript:'); for (const b of transcript) console.log(`  ${b.who}: ${b.text}`)
