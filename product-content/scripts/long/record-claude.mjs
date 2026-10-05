/**
 * Records a real Claude Code session for a CCM long video: a real terminal (ttyd) in a headless browser at 1920×1080
 * on a cream theme, a real prompt typed into a real `claude`, the real work, then the real result opened in the
 * browser. Nothing is mocked. Writes capture/recording.webm and capture/marks.json (the moments the long video cuts
 * on), like the Voho recorder does for app.voho.ai.
 *
 *   node scripts/long/record-claude.mjs <workspace>
 *
 * Reads topic.json → demo: {
 *   dir: "demo/jobs-app",                     the folder Claude works in (relative to the workspace)
 *   show: ["head -8 jobs-2026.csv"],           commands run first, to show what we start from
 *   prompt: "…",                               what Yar types into Claude Code, in plain English
 *   result: "index.html",                      the file Claude makes; opened in the browser when it's done
 *   tour: [{ mark: "revenue", scroll: 0 }, …]  where to look in the result: scroll positions (px), each marked
 * }
 * Claude Code runs with edits allowed and Bash off, so it can only write files in that folder.
 *
 * Claude Code takes its colours from the global theme, and a dark theme is unreadable on the cream terminal. So the
 * theme in ~/.claude.json is set to "light" while the recorded session starts, and put back straight after (and again
 * at the end, in case the session saved its own copy).
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const require = createRequire(path.join(ROOT, 'scripts/voho/recorder/package.json'))
const { chromium } = require('playwright')
const WS = path.resolve(process.argv[2] ?? '.')
const topic = JSON.parse(fs.readFileSync(path.join(WS, 'topic.json'), 'utf8'))
const D = topic.demo
if (!D?.dir || !D?.prompt) { console.error('topic.json needs demo.dir and demo.prompt'); process.exit(1) }
// Claude runs in a clean folder in the home directory, outside this repo, so it doesn't pick up the repo's AGENTS.md
// and the path on screen is just ~/<name>. The demo files are copied there fresh, and the result is copied back.
const SRC = path.join(WS, D.dir), DIR = path.join(os.homedir(), path.basename(SRC)), CAP = path.join(WS, 'capture')
if (fs.existsSync(DIR)) fs.rmSync(DIR, { recursive: true, force: true })
fs.cpSync(SRC, DIR, { recursive: true, filter: (f) => !f.endsWith(D.result || 'index.html') })
fs.mkdirSync(CAP, { recursive: true })

// ------------------------------------------------------------ the theme dance
const CFG = path.join(os.homedir(), '.claude.json')
const origTheme = JSON.parse(fs.readFileSync(CFG, 'utf8')).theme
const setTheme = (t) => { const c = JSON.parse(fs.readFileSync(CFG, 'utf8')); if (c.theme !== t) { c.theme = t; fs.writeFileSync(CFG, JSON.stringify(c, null, 2)) } }
const restore = () => { try { if (origTheme) setTheme(origTheme) } catch {} }
process.on('exit', restore)

// ------------------------------------------------------------ a real terminal
const THEME = { background: '#FBF8F2', foreground: '#1F1D1A', cursor: '#DC5A2B', selectionBackground: '#E4DFD4',
  black: '#1F1D1A', red: '#C63D2F', green: '#2E9E5B', yellow: '#A87B00', blue: '#2F5FA8', magenta: '#8B3FA8', cyan: '#1F7A8C', white: '#6B665E',
  brightBlack: '#8A847A', brightRed: '#DC5A2B', brightGreen: '#3DAA6A', brightYellow: '#B8920F', brightBlue: '#3F72C0', brightMagenta: '#A052C0', brightCyan: '#2C8FA3', brightWhite: '#1F1D1A' }
const PORT = 7690 + Math.floor(Math.random() * 200)
const rc = path.join(CAP, '.zshrc-demo')
fs.mkdirSync(path.dirname(rc), { recursive: true })
fs.writeFileSync(rc, `PROMPT='%F{202}~/${path.basename(DIR)}%f %F{240}❯%f '\nunsetopt PROMPT_SP\n`)
const zdot = fs.mkdtempSync(path.join(os.tmpdir(), 'zdot-')); fs.copyFileSync(rc, path.join(zdot, '.zshrc'))
const ttyd = spawn('ttyd', ['-p', String(PORT), '-W', '-t', 'fontSize=30', '-t', 'fontFamily=Menlo, monospace', '-t', 'lineHeight=1.25',
  '-t', 'disableLeaveAlert=true', '-t', 'disableResizeOverlay=true', '-t', `theme=${JSON.stringify(THEME)}`, 'zsh'],
  { cwd: DIR, env: { ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^CLAUDE_?CODE|^CLAUDECODE/.test(k))), ZDOTDIR: zdot, TERM: 'xterm-256color' }, stdio: 'ignore' })   // not a child of this session
await new Promise((r) => setTimeout(r, 1200))

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: CAP, size: { width: 1920, height: 1080 } } })
const page = await ctx.newPage()
const t0 = Date.now()
const marks = []
const mark = (name) => { const t = (Date.now() - t0) / 1000; marks.push({ name, t: Math.round(t * 100) / 100 }); console.log(name.padEnd(18), t.toFixed(2)) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const screen = () => page.evaluate(() => { const b = window.term?.buffer?.active; if (!b) return ''; let s = ''; for (let i = 0; i < b.length; i++) s += (b.getLine(i)?.translateToString(true) ?? '') + '\n'; return s })
const waitFor = async (re, ms) => { const end = Date.now() + ms; while (Date.now() < end) { if (re.test(await screen())) return true; await sleep(400) } return false }
const type = async (text, delay = 38) => { for (const ch of text) { await page.keyboard.type(ch); await sleep(delay * (ch === ' ' ? 1.6 : 0.7 + Math.random() * 0.6)) } }

try {
  await page.goto(`http://127.0.0.1:${PORT}/`)
  await page.waitForFunction(() => !!window.term, null, { timeout: 15000 })
  await page.evaluate(() => window.term.options.cursorBlink = false)
  await page.click('body')
  await page.keyboard.type('clear'); await page.keyboard.press('Enter'); await sleep(900)
  mark('start')

  // 1. what we start from
  for (const cmd of D.show || []) { await type(cmd, 45); await page.keyboard.press('Enter'); mark('shown'); await sleep(3200) }

  // 2. Claude Code, in the light theme
  setTheme('light')
  mark('claude_launch')
  await type('claude --permission-mode acceptEdits --disallowedTools Bash', 32); await page.keyboard.press('Enter')
  // a fresh folder asks whether to trust it, and the default answer is "No, exit"
  if (await waitFor(/trust this folder|trust the files|Do you trust|Yes, proceed/i, 9000)) {
    await sleep(900)
    if (/❯\s*No, exit/.test(await screen())) { await page.keyboard.press('ArrowDown'); await sleep(400) }
    await page.keyboard.press('Enter')
  }
  await waitFor(/for shortcuts|\? for|Try "|>\s*$/m, 20000)
  await sleep(1500); restore()
  mark('claude_ready')

  // 3. the prompt, typed like a person
  mark('typing_start')
  await type(D.prompt, 30)
  mark('typing_end'); await sleep(500)
  await page.keyboard.press('Enter'); mark('sent')
  if (!(await waitFor(/esc to interrupt|Thinking|Reading|Writing|Searched|Skill\(|…\s*\(/i, 90000))) throw new Error('Claude never started working after the prompt: see capture/last-screen.txt')

  // 4. the work: done when the result exists and Claude has been idle for 6 s
  const result = path.join(DIR, D.result || 'index.html')
  let working = false, idleSince = 0
  for (const end = Date.now() + 15 * 60e3; Date.now() < end;) {
    const s = await screen(), busy = /esc to interrupt|Thinking|Writing|Creating|…\s*\(/i.test(s)
    if (busy && !working) { working = true; mark('working') }
    if (!busy && fs.existsSync(result)) { idleSince ||= Date.now(); if (Date.now() - idleSince > 6000) break } else idleSince = 0
    await sleep(1000)
  }
  if (!fs.existsSync(result)) throw new Error(`Claude didn't write ${D.result}; see the recording`)
  mark('done'); await sleep(2500)

  // 5. the result, in the browser
  await page.goto('file://' + result); await page.waitForLoadState('networkidle').catch(() => {})
  await page.evaluate(() => { document.documentElement.style.zoom = '1.3' }); await sleep(600)   // readable at 1920 wide
  mark('result_open')
  for (const stop of D.tour || [{ mark: 'result_top', scroll: 0 }]) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), stop.scroll ?? 0); await sleep(900)
    mark(stop.mark); await sleep(stop.hold ?? 3000)
  }
  mark('end')
} finally {
  try { fs.writeFileSync(path.join(CAP, 'last-screen.txt'), await screen()) } catch {}
  const video = page.video()
  await ctx.close(); await browser.close(); ttyd.kill()
  restore()
  const src = await video?.path()
  if (src) fs.renameSync(src, path.join(CAP, 'recording.webm'))
  fs.writeFileSync(path.join(CAP, 'marks.json'), JSON.stringify({ marks }, null, 1))
  fs.rmSync(zdot, { recursive: true, force: true })
  const made = path.join(DIR, D.result || 'index.html')
  if (fs.existsSync(made)) fs.copyFileSync(made, path.join(SRC, D.result || 'index.html'))
  console.log('wrote capture/recording.webm and capture/marks.json · theme back to', JSON.parse(fs.readFileSync(CFG, 'utf8')).theme)
}
