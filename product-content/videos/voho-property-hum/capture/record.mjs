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
const OUT = path.join(here, 'out')
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const BASE = process.env.BASE ?? 'https://app.voho.ai'
const EMAIL = process.env.EMAIL ?? `riyadh.homes.demo+${Date.now().toString(36)}@vohoai.com`
const PASSWORD = process.env.PASSWORD ?? `Demo-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
const DRY = process.argv.includes('--dry')

const AGENT_NAME = 'Dar Riyadh Properties'

// One short sentence per reply: Yar's rule for voice agents (2026-09-25), so the call moves.
const INSTRUCTIONS = `أنت "ليلى"، موظفة الاستقبال الصوتية في دار الرياض العقارية.

مهمتك:
- الرد بلهجة سعودية ودودة، وبجملة واحدة قصيرة فقط في كل رد.
- مساعدة المتصل في الشقق والفلل المتاحة في شمال الرياض.
- اسألي عن عدد الغرف والميزانية، ثم اقترحي عقاراً واحداً مناسباً.
- احجزي موعد معاينة، وخذي الاسم ورقم الجوال قبل التأكيد.

المتاح حالياً:
- شقة ثلاث غرف في حي النرجس، إيجار سنوي ٧٠ ألف ريال.
- شقة ثلاث غرف في حي الملقا، إيجار سنوي ٨٥ ألف ريال.
- فيلا خمس غرف في حي الياسمين، للبيع بمليونين وأربعمئة ألف ريال.

قواعد:
- لا تذكرين أسعاراً غير المكتوبة هنا.
- المعاينات من الأحد إلى الخميس، من الرابعة عصراً إلى التاسعة مساءً.
- اختمي بتلخيص الموعد في جملة واحدة: العقار، اليوم، الوقت.`

const GREETING = 'حيّاك الله في دار الرياض العقارية، معك ليلى. كيف أقدر أخدمك؟'

// What the caller says, short lines in order. Synthesised in Omar's voice (young Najdi male).
const CALLER_LINES = [
  'السلام عليكم، أدور شقة ثلاث غرف للإيجار في شمال الرياض.',
  'ميزانيتي حول سبعين ألف في السنة.',
  'ممتاز، أبغى أعاينها يوم الأحد الساعة خمس العصر.',
  'اسمي فهد القحطاني، وجوالي صفر خمسة خمسة، سبعة ستة خمسة، أربعة ثلاثة اثنين واحد.',
  'الله يعطيك العافية، مع السلامة.',
]
const CALLER_VOICE = 'omar'

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

  await click(page, page.getByRole('button', { name: 'No account? Create one' }), 'toggle_signup')
  await sleep(900)

  const email = page.getByPlaceholder('you@company.com')
  await click(page, email, 'email_focus')
  await typeSlow(page, EMAIL, 42)
  await sleep(400)
  const pw = page.getByPlaceholder('Password (8+ characters)')
  await click(page, pw)
  await typeSlow(page, PASSWORD, 38)
  await sleep(500)

  await click(page, page.getByRole('button', { name: 'Create account' }), 'create_account')
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
  fs.writeFileSync(path.join(OUT, 'marks.json'), JSON.stringify({ email: EMAIL, password: PASSWORD, base: BASE, t0, marks }, null, 2))
  await browser.close()
  console.log('wrote', OUT)
}
