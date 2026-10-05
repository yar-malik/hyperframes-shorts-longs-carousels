// Take two of a Voho tutorial: signed in as the account tutorial.mjs created, open Conversations and the real call
// it just made (transcript, summary, outcome). Holds for the t14 narration line.
//   node scripts/voho/recorder/tutorial-conversations.mjs <workspace>   → <workspace>/capture2/{screen.webm, marks.json}
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { INIT } from './inject.mjs'
const WS = path.resolve(process.argv[2] ?? '.')
const { email, password, base } = JSON.parse(fs.readFileSync(path.join(WS, 'capture/marks.json'), 'utf8'))
const OUT = path.join(WS, 'capture2'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true })
const dur = (id) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(WS, 'assets/vo', `${id}.wav`)]).toString())
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const marks = []; let t0 = 0
const mark = (name) => { marks.push({ name, t: (Date.now() - t0) / 1000 }); console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${name}`) }
async function moveTo(page, loc) { const b = await loc.boundingBox(); if (!b) throw new Error('no box'); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 26 }) }
async function click(page, loc, name) { await loc.scrollIntoViewIfNeeded(); await moveTo(page, loc); await sleep(280); if (name) mark(name); await loc.click() }
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
  await page.mouse.move(1300, 600)
  mark('signed_in')
  await sleep(1200)
  const start = Date.now()
  mark('step_t14')
  await click(page, page.locator('aside, nav').getByRole('link', { name: 'Conversations', exact: true }).first(), 'conversations')
  await page.waitForLoadState('networkidle')
  await sleep(1600)
  // the call's row carries an outcome (RESOLVED, ESCALATED when it handed over to a person, …); the chat's row doesn't.
  // Click that line to open the transcript and summary
  const row = page.getByText(/^(resolved|escalated|booked|unresolved|abandoned)$/i).first()
  await click(page, row, 'open_conversation')
  await sleep(2500)
  await page.mouse.move(1500, 700, { steps: 30 })
  await sleep(1500)
  await page.mouse.wheel(0, 250)
  const need = dur('t14') * 1000 + 3500 - (Date.now() - start)
  if (need > 0) await sleep(need)
  mark('end_t14')
} catch (e) { console.error('FAILED', e.message); mark('error') }
finally {
  const v = page.video(); await context.close(); const p = await v?.path(); if (p) fs.renameSync(p, path.join(OUT, 'screen.webm'))
  fs.writeFileSync(path.join(OUT, 'marks.json'), JSON.stringify({ marks }, null, 1)); await browser.close(); console.log('wrote', OUT)
}
