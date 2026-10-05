// Records the sign-up → agent → prompt → live-call walkthrough on app.voho.ai.
//
// Playwright drives Chromium with video recording on. The page gets three
// injections: a drawn cursor (Playwright's mouse is invisible), a fake
// microphone we can play clips into, and a tap on every AudioContext
// destination so the agent's voice is captured. Every step is timestamped
// into marks.json so captions can be timed against the video afterwards.

import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
/* Everything about the agent and the caller comes from the topic's topic.json (scripts/voho/new.mjs writes it):
     node scripts/voho/recorder/record.mjs <workspace>      → <workspace>/capture/{screen.webm, *.webm, marks.json}
   topic.json → agent: { name, instructions (Saudi Arabic, "one short sentence per reply"), greeting },
                caller: { voice (default omar), lines: [short Saudi Arabic lines, in order] } */
const WS = path.resolve(process.argv[2] ?? '.')
const TOPIC = JSON.parse(fs.readFileSync(path.join(WS, 'topic.json'), 'utf8'))
const OUT = path.join(WS, 'capture')
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const BASE = process.env.BASE ?? 'https://app.voho.ai'
const SLUG = String(TOPIC.slug || 'voho').replace(/[^a-z0-9]+/gi, '.').slice(0, 24).toLowerCase()
const EMAIL = process.env.EMAIL ?? `${SLUG}.demo+${Date.now().toString(36)}@vohoai.com`
// a throwaway password for the demo account, made fresh on every run (it lands only in the gitignored marks.json)
const LOGIN = !!process.env.LOGIN
const DEMO_PASS = process.env.PASSWORD ?? `Demo-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}` // ggignore
const DRY = process.argv.includes('--dry')

const AGENT_NAME = TOPIC.agent.name
const INSTRUCTIONS = TOPIC.agent.instructions
const GREETING = TOPIC.agent.greeting
const CALLER_LINES = TOPIC.caller.lines
const CALLER_VOICE = TOPIC.caller.voice || 'omar'
for (const [k, v] of Object.entries({ AGENT_NAME, INSTRUCTIONS, GREETING })) if (!v) throw new Error('topic.json is missing ' + k)
if (!CALLER_LINES?.length) throw new Error('topic.json has no caller lines')

// ------------------------------------------------------------- page injections

import { INIT } from './inject.mjs'

// --------------------------------------------------------------------- helpers

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const marks = []
let t0 = 0
const mark = (name, extra = {}) => {
  const m = { name, t: (Date.now() - t0) / 1000, ...extra }
  marks.push(m)
  console.log(`[${m.t.toFixed(2)}s] ${name}`, extra.text ? '' : '')
}

async function moveTo(page, locator, { pad = 0 } = {}) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('no box for ' + locator)
  const x = box.x + box.width / 2 + pad, y = box.y + box.height / 2
  await page.mouse.move(x, y, { steps: 28 })
  return { x, y }
}
async function click(page, locator, name) {
  await moveTo(page, locator)
  await sleep(280)
  if (name) mark(name)
  await locator.click()
}
async function typeSlow(page, text, delay) {
  await page.keyboard.type(text, { delay })
}

// ------------------------------------------------------------------------ run

const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--lang=en-US'],
})
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  locale: 'en-US',
  timezoneId: 'Asia/Riyadh',
  recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
})
await context.grantPermissions(['microphone'])
await context.addInitScript(INIT)

const chunks = new Map() // id -> { startMs, parts: [] }
await context.exposeFunction('__chunk', (id, seq, startMs, b64) => {
  if (!chunks.has(id)) chunks.set(id, { startMs, parts: [] })
  chunks.get(id).parts[seq] = Buffer.from(b64, 'base64')
})

const page = await context.newPage()
t0 = Date.now()
page.on('pageerror', (e) => console.log('pageerror', e.message))

try {
  // ---------------------------------------------------------------- sign up
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.mouse.move(1500, 700)
  mark('login_page')
  await sleep(1800)

  // LOGIN=1 with EMAIL and PASSWORD signs in to an account that already exists. Since 2026-10-04 a new account has
  // no credit until its email is confirmed, and nobody can read the throwaway inbox, so a fresh sign-up can't call.
  if (!LOGIN) {
    await click(page, page.getByRole('button', { name: 'No account? Create one' }), 'toggle_signup')
    await sleep(900)
  }

  const email = page.getByPlaceholder('you@company.com')
  await click(page, email, 'email_focus')
  await typeSlow(page, EMAIL, 42)
  await sleep(400)
  const pw = page.locator('input[type=password]')
  await click(page, pw)
  await typeSlow(page, DEMO_PASS, 38)
  await sleep(500)

  await click(page, page.getByRole('button', { name: LOGIN ? 'Sign in' : 'Create account', exact: true }), LOGIN ? 'sign_in' : 'create_account')
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 })
  await page.waitForLoadState('networkidle')
  mark('console_loaded', { url: page.url() })
  await sleep(1600)
  const skip = page.getByRole('button', { name: 'Skip for now' })
  if (await skip.isVisible().catch(() => false)) {
    await click(page, skip, 'skip_onboarding')
    await sleep(900)
  }
  await page.mouse.move(1400, 600, { steps: 20 })
  await sleep(1600)

  // ------------------------------------------------------------ new agent
  await click(page, page.getByRole('button', { name: 'Create an agent' }), 'create_agent')
  await sleep(1600)
  await click(page, page.getByRole('button', { name: 'Start from scratch' }), 'start_from_scratch')
  await page.waitForURL(/\/agents\/[0-9a-f-]{20,}/i, { timeout: 30000 })
  await page.waitForLoadState('networkidle')
  mark('studio_loaded', { url: page.url() })
  await sleep(1500)

  // ------------------------------------------------------------ name
  const name = page.getByLabel('Agent name')
  await click(page, name, 'name_focus')
  await page.keyboard.press('Meta+A')
  await typeSlow(page, AGENT_NAME, 45)
  await sleep(600)

  // ------------------------------------------------------------ language
  const langSelect = page.locator('select').filter({ has: page.locator('option[value="ar-SA"]') }).first()
  const langPill = langSelect.locator('xpath=..')
  await moveTo(page, langPill)
  await sleep(300)
  mark('language_pick')
  await langSelect.selectOption('ar-SA')
  await sleep(1000)

  // ------------------------------------------------------------ instructions
  const instr = page.locator('textarea').first()
  await click(page, instr, 'instructions_focus')
  await sleep(300)
  // The first line at a human pace, the body faster so the video stays short.
  const [first, ...rest] = INSTRUCTIONS.split('\n')
  await typeSlow(page, first, 28)
  await typeSlow(page, '\n' + rest.join('\n'), 6)
  mark('instructions_done')
  await sleep(900)

  const greet = page.locator('textarea').nth(1)
  await click(page, greet, 'greeting_focus')
  await typeSlow(page, GREETING, 30)
  mark('greeting_done')
  await sleep(700)

  // ------------------------------------------------------------ save
  await click(page, page.getByRole('button', { name: 'Save', exact: true }), 'save')
  await page.getByRole('button', { name: 'Saved' }).waitFor({ timeout: 20000 })
  mark('saved')
  await sleep(1400)

  if (DRY) throw new Error('dry run done')

  // ------------------------------------------------------------ caller lines
  // Synthesised now, after sign-in, through the same studio route the console uses.
  const callerAudio = []
  for (const text of CALLER_LINES) {
    const b64 = await page.evaluate(async ({ text, voice }) => {
      const r = await fetch('/api/studio/speech', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      })
      if (!r.ok) throw new Error('speech ' + r.status + ' ' + (await r.text()))
      const buf = new Uint8Array(await r.arrayBuffer())
      let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000))
      return btoa(s)
    }, { text, voice: CALLER_VOICE })
    callerAudio.push(b64)
    fs.writeFileSync(path.join(OUT, `caller-${callerAudio.length}.bin`), Buffer.from(b64, 'base64'))
  }
  mark('caller_lines_ready')

  // ------------------------------------------------------------ the call
  const testAudio = page.getByRole('button', { name: /Test audio/ })
  await moveTo(page, testAudio)
  await sleep(500)
  const callBtn = page.getByRole('button', { name: /^Call \S+$/ })   // "Call Layla", not the newer "Call new leads instantly"
  await click(page, callBtn, 'call_start')

  const transcript = async () => page.evaluate(() => {
    const bubbles = [...document.querySelectorAll('div[dir="auto"].rounded-xl')]
    return bubbles.map((b) => ({ who: b.querySelector('.eyebrow')?.textContent?.trim(), text: b.textContent.replace(b.querySelector('.eyebrow')?.textContent ?? '', '').trim() }))
  })
  const agentQuiet = async (timeoutMs = 45000) => {
    const start = Date.now()
    let last = '', lastChange = Date.now()
    while (Date.now() - start < timeoutMs) {
      const t = await transcript()
      const snap = JSON.stringify(t)
      if (snap !== last) { last = snap; lastChange = Date.now() }
      const endsAt = await page.evaluate(() => window.__agentAudioEndsAt)
      const tail = t[t.length - 1]
      const spoke = tail && tail.who !== 'You' && tail.text.length > 0
      if (spoke && Date.now() - lastChange > 1800 && Date.now() > endsAt + 900) return t
      await sleep(250)
    }
    return transcript()
  }

  await page.waitForFunction(() => document.body.innerText.includes('Listening') || document.querySelector('div[dir="auto"].rounded-xl'), null, { timeout: 30000 })
  mark('call_live')
  let t = await agentQuiet()
  mark('agent_greeted', { transcript: t })

  for (let i = 0; i < callerAudio.length; i++) {
    mark(`caller_${i + 1}_start`, { text: CALLER_LINES[i] })
    const dur = await page.evaluate((b64) => window.__say(b64), callerAudio[i])
    mark(`caller_${i + 1}_end`, { dur })
    await sleep(600)
    t = await agentQuiet()
    mark(`agent_reply_${i + 1}`, { transcript: t })
    await sleep(500)
  }

  await sleep(800)
  await click(page, page.getByRole('button', { name: 'End', exact: true }), 'call_end')
  await sleep(2500)
  mark('done')
} catch (e) {
  console.error('FAILED:', e.message)
  mark('error', { message: e.message })
  await page.screenshot({ path: path.join(OUT, 'error.png') }).catch(() => {})
} finally {
  await page.evaluate(() => window.__flushAudio?.()).catch(() => {})
  await sleep(500)
  const video = page.video()
  await context.close()
  const vpath = await video?.path()
  if (vpath) fs.renameSync(vpath, path.join(OUT, 'screen.webm'))
  for (const [id, { startMs, parts }] of chunks) {
    fs.writeFileSync(path.join(OUT, `${id}.webm`), Buffer.concat(parts.filter(Boolean)))
    marks.push({ name: `audio_${id}`, t: (startMs - t0) / 1000, file: `${id}.webm` })
  }
  fs.writeFileSync(path.join(OUT, 'marks.json'), JSON.stringify({ email: EMAIL, password: DEMO_PASS, base: BASE, t0, marks }, null, 2))
  await browser.close()
  console.log('wrote', OUT)
}
