// Take three of a Voho tutorial: signed in as the account tutorial.mjs created, walk the webhook, outbound calls,
// Generate Speech and billing, each held for its narration line (t20, t19, t18, t21 in <workspace>/assets/vo).
//   node scripts/voho/recorder/tutorial-extras.mjs <workspace>   → <workspace>/capture3/{screen.webm, marks.json}
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { INIT } from './inject.mjs'
const WS = path.resolve(process.argv[2] ?? '.')
const { email, password, base } = JSON.parse(fs.readFileSync(path.join(WS, 'capture/marks.json'), 'utf8'))
const TOPIC = JSON.parse(fs.readFileSync(path.join(WS, 'topic.json'), 'utf8'))
// what gets typed (topic.tutorial.rec); the defaults are the dental tutorial's
const REC = { webhook: 'https://crm.alrawda-dental.example/voho/calls', campaign: 'Cleaning reminders', speech: 'أهلاً وسهلاً في عيادة الروضة لطب الأسنان، معك ليلى.', ...TOPIC.tutorial?.rec }
const OUT = path.join(WS, 'capture3'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true })
const dur = (id) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(WS, 'assets/vo', `${id}.wav`)]).toString())
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const marks = []; let t0 = 0
const mark = (name, extra = {}) => { marks.push({ name, t: (Date.now() - t0) / 1000, ...extra }); console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${name}`) }
async function moveTo(page, loc) { const b = await loc.boundingBox(); if (!b) throw new Error('no box'); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 26 }) }
async function hover(page, loc, ms = 1800) { await loc.scrollIntoViewIfNeeded({ timeout: 8000 }); await moveTo(page, loc); await sleep(ms) }
async function click(page, loc, name) { await loc.scrollIntoViewIfNeeded({ timeout: 8000 }); await moveTo(page, loc); await sleep(280); if (name) mark(name); await loc.click({ timeout: 8000 }) }
const nav = (page, name) => page.locator('aside, nav').getByRole('link', { name, exact: true }).first()
async function step(page, id, actions) {
  const start = Date.now(); mark(`step_${id}`)
  try { await actions() } catch (e) { mark(`skip_${id}`, { message: e.message.slice(0, 200) }) }
  const need = dur(id) * 1000 + 2200 - (Date.now() - start); if (need > 0) await sleep(need)
  mark(`end_${id}`)
}
const browser = await chromium.launch({ headless: true, args: ['--lang=en-US'] })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'en-US', timezoneId: 'Asia/Riyadh', recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } } })
await context.addInitScript(INIT)
const page = await context.newPage()
t0 = Date.now()
try {
  await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
  await page.getByPlaceholder('you@company.com').fill(email)
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 })
  await page.waitForLoadState('networkidle')
  await page.getByText(TOPIC.agent.name).first().click()
  await page.waitForURL(/\/agents\/[0-9a-f-]{20,}/i, { timeout: 30000 })
  await page.waitForLoadState('networkidle')
  await page.mouse.move(1300, 600)
  await sleep(1500)
  mark('ready')
  await step(page, 't20', async () => {
    await click(page, page.getByRole('button', { name: /^Webhook/ }), 'webhook')
    await sleep(800)
    await click(page, page.getByPlaceholder('https://your-system.example.com/voho/calls'))
    await page.keyboard.type(REC.webhook, { delay: 34 })
  })
  await step(page, 't19', async () => {
    await click(page, nav(page, 'Outbound'), 'outbound')
    await page.waitForLoadState('networkidle')
    await sleep(1500)
    const dnc = page.getByText('Do-not-call list').first()
    if (await dnc.isVisible().catch(() => false)) await hover(page, dnc, 1500)
    const create = page.getByRole('button', { name: 'Create a batch call' }).first()
    if (await create.isEnabled().catch(() => false)) {
      await click(page, create, 'new_batch'); await sleep(1300)
      const name = page.getByPlaceholder('September renewals')
      if (await name.isVisible().catch(() => false)) { await click(page, name); await page.keyboard.type(REC.campaign, { delay: 40 }) }
    } else if (await create.isVisible().catch(() => false)) await hover(page, create, 1800)
  })
  await step(page, 't18', async () => {
    const esc = page.getByRole('button', { name: /^Cancel$|^Close$/ }).first()
    if (await esc.isVisible().catch(() => false)) await esc.click().catch(() => {})
    await page.keyboard.press('Escape').catch(() => {})
    await click(page, nav(page, 'Generate Speech'), 'generate')
    await page.waitForLoadState('networkidle')
    await sleep(1100)
    const ta = page.locator('textarea').first()
    await click(page, ta); await page.keyboard.press('Meta+A')
    await page.keyboard.type(REC.speech, { delay: 36 })
    const layla = page.getByText('Layla', { exact: true }).first()
    if (await layla.isVisible().catch(() => false)) await click(page, layla)
    await sleep(500)
    const play = page.getByRole('button', { name: /Play sample|Generate/ }).first()
    if (await play.isVisible().catch(() => false)) await hover(page, play, 1500)
  })
  await step(page, 't21', async () => {
    await click(page, nav(page, 'Billing'), 'billing')
    await page.waitForLoadState('networkidle')
    await sleep(1800)
    const usage = page.getByRole('link', { name: 'Usage' }).or(page.getByRole('button', { name: 'Usage' })).first()
    if (await usage.isVisible().catch(() => false)) { await click(page, usage, 'usage'); await sleep(1500) }
  })
  await sleep(1200); mark('done')
} catch (e) { console.error('FAILED', e.message); mark('error', { message: e.message }) }
finally {
  const v = page.video(); await context.close(); const p = await v?.path(); if (p) fs.renameSync(p, path.join(OUT, 'screen.webm'))
  fs.writeFileSync(path.join(OUT, 'marks.json'), JSON.stringify({ marks }, null, 1)); await browser.close(); console.log('wrote', OUT)
}
