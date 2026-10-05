// Records a tour of every setting in the console, signed in as the account
// the walkthrough created. Each step holds the screen at least as long as
// its narration line (durations from the tour project's assets/vo), so the
// cut needs no trimming: one continuous take, narration placed at each mark.
//
//   EMAIL=... PASSWORD=... node tour.mjs
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { INIT } from './inject.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(here, 'tour-out')
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const BASE = 'https://app.voho.ai'
const { EMAIL, PASSWORD } = process.env
if (!EMAIL || !PASSWORD) throw new Error('EMAIL and PASSWORD required')
const VO = path.resolve(here, '../videos/voho-console-tour/assets/vo')
const dur = (id) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(VO, `${id}.wav`)]).toString())

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const marks = []
let t0 = 0
const mark = (name, extra = {}) => { marks.push({ name, t: (Date.now() - t0) / 1000, ...extra }); console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${name}`) }

async function moveTo(page, locator) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('no box')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 26 })
}
async function hover(page, locator, ms = 1800) { await locator.scrollIntoViewIfNeeded(); await moveTo(page, locator); await sleep(ms) }
async function click(page, locator, name) { await locator.scrollIntoViewIfNeeded(); await moveTo(page, locator); await sleep(260); if (name) mark(name); await locator.click(); }
async function type(page, text, delay = 30) { await page.keyboard.type(text, { delay }) }

/** A narrated step: mark, run the actions, then hold until the line has room to finish. */
async function step(page, id, actions) {
  const start = Date.now()
  mark(id)
  await actions()
  const need = dur(id) * 1000 + 1400 - (Date.now() - start)
  if (need > 0) await sleep(need)
}
const nav = (page, name) => page.locator('aside, nav').getByRole('link', { name, exact: true }).first()

const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--lang=en-US'] })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'en-US', timezoneId: 'Asia/Riyadh', recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } } })
await context.grantPermissions(['microphone'])
await context.addInitScript(INIT)
const chunks = new Map()
await context.exposeFunction('__chunk', (id, seq, startMs, b64) => { if (!chunks.has(id)) chunks.set(id, { startMs, parts: [] }); chunks.get(id).parts[seq] = Buffer.from(b64, 'base64') })
const page = await context.newPage()
t0 = Date.now()
page.on('pageerror', (e) => console.log('pageerror', e.message))

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.getByPlaceholder('you@company.com').fill(EMAIL)
  await page.getByPlaceholder('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 })
  await page.waitForLoadState('networkidle')
  await page.mouse.move(1300, 700)
  await sleep(600)
  mark('console_loaded')

  // t01 — the agent list, open our agent
  await step(page, 't01', async () => {
    await sleep(2600)
    await click(page, page.getByText('Al Noor Clinics Reception').first(), 'open_agent')
    await page.waitForURL(/\/agents\/[0-9a-f-]{20,}/i, { timeout: 30000 })
    await page.waitForLoadState('networkidle')
    await page.mouse.move(1200, 640, { steps: 20 })
  })

  // t02 — the pills
  await step(page, 't02', async () => {
    const pills = page.locator('label:has(select)')
    for (let i = 0; i < 4; i++) await hover(page, pills.nth(i), 2600)
  })

  // t03 — the two AI shortcuts
  await step(page, 't03', async () => {
    await click(page, page.getByRole('button', { name: 'Write it with AI' }), 'draft_open')
    await sleep(3200)
    await hover(page, page.getByPlaceholder(/dental clinic in Riyadh/).first(), 1200)
    await click(page, page.getByRole('button', { name: 'Cancel' }))
    await sleep(500)
    await hover(page, page.getByRole('button', { name: 'Write it in Arabic' }), 2200)
  })

  // t04 — Functions
  await step(page, 't04', async () => {
    await click(page, page.getByRole('button', { name: /^Functions/ }), 'functions')
    await sleep(1400)
    await hover(page, page.getByPlaceholder('https://your-system.example.com/voho/actions'), 1600)
    if (await page.getByPlaceholder('lookup_order').count() === 0) {
      await click(page, page.getByRole('button', { name: 'Add function' }))
      await sleep(400)
      await click(page, page.getByPlaceholder('lookup_order').last())
      await type(page, 'check_availability', 40)
      await click(page, page.getByPlaceholder('Use when the caller asks where their order is.').last())
      await type(page, 'Use when the caller asks for a free slot in a department on a given day.', 22)
      await sleep(400)
      await click(page, page.getByRole('button', { name: 'Save', exact: true }), 'save_function')
      await page.getByRole('button', { name: 'Saved' }).waitFor({ timeout: 20000 })
    } else {
      await hover(page, page.getByPlaceholder('lookup_order').first(), 2200)
      await hover(page, page.getByPlaceholder('Use when the caller asks where their order is.').first(), 2200)
    }
  })

  // t05 — Knowledge base
  await step(page, 't05', async () => {
    await click(page, page.getByRole('button', { name: /^Knowledge base/ }), 'knowledge')
    await sleep(1000)
    const up = page.getByRole('button', { name: /Upload|Add|document/i }).first()
    if (await up.isVisible().catch(() => false)) await hover(page, up, 2000)
  })

  // t06 — Dynamic variables
  await step(page, 't06', async () => {
    await click(page, page.getByRole('button', { name: /^Dynamic variables/ }), 'variables')
    await sleep(1200)
  })

  // t07 — Public demo
  await step(page, 't07', async () => {
    await click(page, page.getByRole('button', { name: /^Public demo/ }), 'public_demo')
    await sleep(1800)
    const share = page.getByRole('button', { name: /Share with a/ })
    if (await share.isVisible().catch(() => false)) {
      await click(page, share, 'share_click')
      await page.locator('input[readonly][value*="/demo/"]').waitFor({ timeout: 20000 }).catch(() => {})
    }
    await sleep(1500)
  })

  // t08 — Webhook
  await step(page, 't08', async () => {
    await click(page, page.getByRole('button', { name: /^Webhook/ }), 'webhook')
    await sleep(800)
    await click(page, page.getByPlaceholder('https://your-system.example.com/voho/calls'))
    await type(page, 'https://crm.alnoor-clinics.example/voho/calls', 32)
  })

  // t09 — On a website
  await step(page, 't09', async () => {
    await click(page, page.getByRole('button', { name: /^On a website/ }), 'embed')
    await sleep(1600)
    for (const t of ['What it calls itself', 'Sites that may use it', 'What the widget offers', 'Chat budget']) {
      const el = page.getByText(t, { exact: true }).first()
      if (await el.isVisible().catch(() => false)) await hover(page, el, 1900)
    }
  })

  // t10 — Test chat
  await step(page, 't10', async () => {
    await click(page, page.getByRole('button', { name: /^Test chat/ }), 'test_chat')
    await sleep(900)
    await click(page, page.getByPlaceholder('Write what a visitor would…'))
    await type(page, 'كم ساعات العمل عندكم؟', 45)
    await page.keyboard.press('Enter')
    mark('chat_sent')
    await sleep(6500)
  })

  // t11 — Dashboard
  await step(page, 't11', async () => {
    await click(page, nav(page, 'Dashboard'), 'dashboard')
    await page.waitForLoadState('networkidle')
    await page.mouse.move(1100, 600, { steps: 20 })
  })

  // t12 — Generate Speech
  await step(page, 't12', async () => {
    await click(page, nav(page, 'Generate Speech'), 'generate')
    await page.waitForLoadState('networkidle')
    await sleep(1200)
    await hover(page, page.locator('textarea').first(), 1600)
    const layla = page.getByText('Layla', { exact: true }).first()
    if (await layla.isVisible().catch(() => false)) await click(page, layla)
    await sleep(600)
    await hover(page, page.getByRole('button', { name: 'Play sample' }), 1800)
  })

  // t13 — Phone numbers
  await step(page, 't13', async () => {
    await click(page, nav(page, 'Phone Numbers'), 'phone_numbers')
    await page.waitForLoadState('networkidle')
    await sleep(1500)
    await click(page, page.getByRole('button', { name: 'Import number' }).first())
    await sleep(1400)
    await hover(page, page.getByText('From Twilio').first(), 1300)
    await click(page, page.getByText('From SIP Trunk').first(), 'sip_form')
    await sleep(1200)
    const host = page.getByPlaceholder('sip.yourcarrier.sa:5060')
    if (await host.isVisible().catch(() => false)) await hover(page, host, 1800)
  })

  // t14 — Outbound
  await step(page, 't14', async () => {
    await click(page, nav(page, 'Outbound'), 'outbound')
    await page.waitForLoadState('networkidle')
    await sleep(1800)
    await hover(page, page.getByText('Do-not-call list').first(), 2000)
    const create = page.getByRole('button', { name: 'Create a batch call' }).first()
    if (await create.isEnabled().catch(() => false)) {
      await click(page, create, 'new_batch')
      await sleep(1400)
      const name = page.getByPlaceholder('September renewals')
      if (await name.isVisible().catch(() => false)) { await click(page, name); await type(page, 'October recalls', 40) }
    } else {
      await hover(page, create, 2200)
    }
  })

  // t15 — Conversations
  await step(page, 't15', async () => {
    await click(page, nav(page, 'Conversations'), 'conversations')
    await page.waitForLoadState('networkidle')
    await sleep(1800)
    const row = page.getByRole('button').filter({ hasText: 'RESOLVED' }).first()
    if (await row.isVisible().catch(() => false)) await click(page, row, 'open_conversation')
    await sleep(800)
  })

  // t16 — Billing
  await step(page, 't16', async () => {
    await click(page, nav(page, 'Billing'), 'billing')
    await page.waitForLoadState('networkidle')
    await sleep(2200)
    for (const t of ['Payment info', 'History', 'Usage']) {
      const tab = page.getByRole('link', { name: t }).or(page.getByRole('button', { name: t })).first()
      if (await tab.isVisible().catch(() => false)) { await click(page, tab); await sleep(2200) }
    }
  })

  // t17 — API tokens
  await step(page, 't17', async () => {
    await click(page, nav(page, 'API Tokens'), 'tokens')
    await page.waitForLoadState('networkidle')
    await sleep(800)
    await hover(page, page.getByPlaceholder('Production server'), 1500)
  })

  // t18 — API explorer
  await step(page, 't18', async () => {
    await click(page, nav(page, 'API Explorer'), 'api_explorer')
    await page.waitForLoadState('networkidle')
    await page.mouse.move(1100, 600, { steps: 20 })
  })

  // t19 — Team, Account
  await step(page, 't19', async () => {
    await click(page, nav(page, 'Team'), 'team')
    await page.waitForLoadState('networkidle')
    await sleep(3200)
    await click(page, page.locator('a[href="/account"]').first(), 'account')
    await page.waitForLoadState('networkidle')
  })

  // t20 — back to the agents
  await step(page, 't20', async () => {
    await click(page, nav(page, 'Agents'), 'agents_again')
    await page.waitForLoadState('networkidle')
    await page.mouse.move(1300, 700, { steps: 20 })
  })
  await sleep(1500)
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
  fs.writeFileSync(path.join(OUT, 'marks.json'), JSON.stringify({ email: EMAIL, base: BASE, t0, marks }, null, 2))
  await browser.close()
  console.log('wrote', OUT)
}
