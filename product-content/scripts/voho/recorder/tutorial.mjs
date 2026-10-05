// Records a Voho tutorial in one real take on app.voho.ai: sign up → create the agent (name, language, voice,
// instructions, welcome message, save) → a live call → functions, knowledge base, test chat, public demo, the
// website widget, phone numbers, the dashboard. Each step is narrated: it starts with a mark and then holds until its
// narration line (the workspace's assets/vo/<id>.wav) has had room to finish, plus a breath, so the tutorial never
// rushes (Yar, 2026-09-26: "you don't have to make it too fast").
//
//   node scripts/voho/recorder/tutorial.mjs <workspace>     → <workspace>/capture/{screen.webm, audio taps, marks.json}
//   node scripts/voho/recorder/mux.mjs <workspace>/capture  → walkthrough.mp4 with the call's sound
//
// topic.json → agent { name, instructions, greeting }, caller { voice, lines } (same shape as scripts/voho/new.mjs).
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { INIT } from './inject.mjs'

const WS = path.resolve(process.argv[2] ?? '.')
const TOPIC = JSON.parse(fs.readFileSync(path.join(WS, 'topic.json'), 'utf8'))
const OUT = path.join(WS, 'capture')
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
const BASE = process.env.BASE ?? 'https://app.voho.ai'
const EMAIL = `${String(TOPIC.slug).replace(/[^a-z0-9]+/gi, '.').slice(0, 20)}.demo+${Date.now().toString(36)}@vohoai.com`
// a throwaway password for the demo account, made fresh on every run (it lands only in the gitignored marks.json)
const DEMO_PASS = `Demo-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}` // ggignore
// what gets typed on the later screens (topic.tutorial.rec); the defaults are the dental tutorial's
const REC = { fnDesc: 'Use when the caller asks for a free slot on a given day.', chat: 'كم سعر تنظيف الأسنان؟', ...TOPIC.tutorial?.rec }
// topic.functions { url, desk, actions: [{ name, description, parameters }] }: the agent's functions point at a real
// system (the service desk at yarmalik.com/desk). They're typed into the Functions panel on camera (t09); the console
// has no box for parameters, so those are set through the same agent API the console saves to, and t17 shows the docs
// page that describes them. The desk is recorded in a second tab through the call (capture/desk.webm, mark desk_page:
// its first frame on this take's clock), then opened in this tab to walk the tickets (t22, t23).
const FN = TOPIC.functions
const DESK = !!(FN && TOPIC.tutorial?.desk)
// topic.tutorial.chat { site, origin, title, messages }: a chat agent instead of a call. After the functions, the agent
// gets a public link (the widget runs on it), the website panel is filled in (title, the site, chat only), the snippet
// copied, and then the site itself is opened with Voho's real widget on it and the messages typed into it, one narrated
// step each (t28, t29, …). Every chat lands in Conversations, which is the last step (t31).
const CHAT = TOPIC.tutorial?.chat
const PAD = 2200   // the breath after every narration line
const dur = (id) => { try { return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(WS, 'assets/vo', `${id}.wav`)]).toString()) } catch { return 0 } }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const marks = []
let t0 = 0
const mark = (name, extra = {}) => { marks.push({ name, t: (Date.now() - t0) / 1000, ...extra }); console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${name}`) }
async function moveTo(page, loc) { const b = await loc.boundingBox(); if (!b) throw new Error('no box'); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 26 }) }
async function hover(page, loc, ms = 1800) { await loc.scrollIntoViewIfNeeded(); await moveTo(page, loc); await sleep(ms) }
async function click(page, loc, name) { await loc.scrollIntoViewIfNeeded(); await moveTo(page, loc); await sleep(280); if (name) mark(name); await loc.click() }
const type = (page, text, delay = 32) => page.keyboard.type(text, { delay })
const nav = (page, name) => page.locator('aside, nav').getByRole('link', { name, exact: true }).first()
/** A narrated step: mark, run the actions, then hold until the line (plus a breath) has had room. Optional steps
    that fail are marked and skipped rather than ending the take. */
async function step(page, id, actions, { optional = false } = {}) {
  const start = Date.now()
  mark(`step_${id}`)
  try { await actions() } catch (e) { if (!optional) throw e; mark(`skip_${id}`, { message: e.message }) }
  const need = dur(id) * 1000 + PAD - (Date.now() - start)
  if (need > 0) await sleep(need)
  mark(`end_${id}`)
}

const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--lang=en-US'] })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'en-US', timezoneId: 'Asia/Riyadh', recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } } })
await context.grantPermissions(['microphone'])
await context.addInitScript(INIT)
const chunks = new Map()
await context.exposeFunction('__chunk', (id, seq, startMs, b64) => { if (!chunks.has(id)) chunks.set(id, { startMs, parts: [] }); chunks.get(id).parts[seq] = Buffer.from(b64, 'base64') })
const page = await context.newPage()
t0 = Date.now()
page.on('pageerror', (e) => console.log('pageerror', e.message))
let deskPage = null, deskUrl = null

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.mouse.move(1500, 700)
  await sleep(800)

  // t01 — sign up
  await step(page, 't01', async () => {
    await click(page, page.getByRole('button', { name: 'No account? Create one' }), 'toggle_signup')
    await sleep(700)
    await click(page, page.getByPlaceholder('you@company.com'), 'email_focus')
    await type(page, EMAIL, 40)
    await click(page, page.getByPlaceholder('Password (8+ characters)'))
    await type(page, DEMO_PASS, 36)
    await sleep(400)
    await click(page, page.getByRole('button', { name: 'Create account' }), 'create_account')
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 })
    await page.waitForLoadState('networkidle')
    const skip = page.getByRole('button', { name: 'Skip for now' })
    if (await skip.isVisible().catch(() => false)) { await sleep(900); await click(page, skip, 'skip_onboarding') }
  })

  // t02 — the console
  await step(page, 't02', async () => {
    await page.mouse.move(160, 300, { steps: 30 }); await sleep(900)
    await page.mouse.move(160, 620, { steps: 40 }); await sleep(700)
    await page.mouse.move(1300, 560, { steps: 30 })
  })

  // t03 — create an agent, from scratch
  await step(page, 't03', async () => {
    await click(page, page.getByRole('button', { name: 'Create an agent' }), 'create_agent')
    await sleep(1400)
    await click(page, page.getByRole('button', { name: 'Start from scratch' }), 'start_from_scratch')
    await page.waitForURL(/\/agents\/[0-9a-f-]{20,}/i, { timeout: 30000 })
    await page.waitForLoadState('networkidle')
    mark('studio_loaded')
  })

  // t04 — name and language
  await step(page, 't04', async () => {
    await click(page, page.getByLabel('Agent name'), 'name_focus')
    await page.keyboard.press('Meta+A')
    await type(page, TOPIC.agent.name, 55)
    await sleep(600)
    const lang = page.locator('select').filter({ has: page.locator('option[value="ar-SA"]') }).first()
    await moveTo(page, lang.locator('xpath=..')); await sleep(400)
    mark('language_pick')
    await lang.selectOption('ar-SA')
  })

  // t05 — model and voice
  await step(page, 't05', async () => {
    const pills = page.locator('label:has(select)')
    const n = Math.min(4, await pills.count())
    for (let i = 0; i < n; i++) await hover(page, pills.nth(i), 1300)
  }, { optional: true })

  // t06 — the instructions
  await step(page, 't06', async () => {
    await click(page, page.locator('textarea').first(), 'instructions_focus')
    const [first, ...rest] = TOPIC.agent.instructions.split('\n')
    await type(page, first, 30)
    await type(page, '\n' + rest.join('\n'), 7)
    mark('instructions_done')
  })

  // t07 — or let AI write it
  await step(page, 't07', async () => {
    await hover(page, page.getByRole('button', { name: 'Write it with AI' }), 1600)
  }, { optional: true })

  // t08 — welcome message and save
  await step(page, 't08', async () => {
    await click(page, page.locator('textarea').nth(1), 'greeting_focus')
    await type(page, TOPIC.agent.greeting, 34)
    mark('greeting_done')
    await sleep(500)
    await click(page, page.getByRole('button', { name: 'Save', exact: true }), 'save')
    await page.getByRole('button', { name: 'Saved' }).waitFor({ timeout: 20000 })
    mark('saved')
  })

  if (FN) {
    const agentId = page.url().match(/\/agents\/([0-9a-f-]{20,})/i)[1]
    // t09 — functions: the endpoint, then one row per function, then save
    await step(page, 't09', async () => {
      await click(page, page.getByRole('button', { name: /^Functions/ }).first(), 'functions')
      await sleep(900)
      await click(page, page.getByPlaceholder('https://your-system.example.com/voho/actions'), 'fn_url')
      await type(page, FN.url, 30)
      for (const a of FN.actions) {
        await click(page, page.getByRole('button', { name: 'Add function' }), 'add_function')
        await sleep(400)
        await click(page, page.getByPlaceholder('lookup_order').last())
        await type(page, a.name, 45)
        await click(page, page.getByPlaceholder('Use when the caller asks where their order is.').last())
        await type(page, a.description, 14)
      }
      mark('functions_done')
      await sleep(400)
      await click(page, page.getByRole('button', { name: 'Save', exact: true }), 'save_functions')
      await page.getByRole('button', { name: 'Saved' }).waitFor({ timeout: 20000 })
      mark('functions_saved')
    })
    // the parameters, through the agent API (after the last console save, which would send the list without them).
    // The endpoint goes with them: until voho-platform's fix-console-saves-actions-url is live, the console's Save
    // drops actions_url, and with no endpoint the functions aren't offered to the model at all.
    const res = await page.evaluate(async ({ id, actions, url }) => {
      const r = await fetch(`/api/agents/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actions, actions_url: url }) })
      return { status: r.status, body: (await r.text()).slice(0, 300) }
    }, { id: agentId, actions: FN.actions, url: FN.url })
    if (res.status !== 200) throw new Error(`setting the parameters failed: ${res.status} ${res.body}`)
    mark('params_set', { agentId })
    // t17 — the docs page that says how parameters are set
    const studio = page.url()
    await step(page, 't17', async () => {
      await page.goto('https://docs.voho.ai/actions', { waitUntil: 'networkidle' })
      mark('docs_open')
      await sleep(800)
      const ex = page.getByText('"parameters"').first()
      await ex.scrollIntoViewIfNeeded().catch(() => {})
      await page.mouse.wheel(0, 220); await sleep(500)
      await hover(page, ex, 1500).catch(() => {})
    })
    await page.goto(studio, { waitUntil: 'networkidle' })
    await sleep(1200)
    mark('studio_back')
    if (DESK) {
      // the desk in its own tab, filling in while the call runs
      deskUrl = `${FN.desk}?agent=${agentId}`
      deskPage = await context.newPage()
      mark('desk_page')
      await deskPage.goto(deskUrl, { waitUntil: 'networkidle' })
      await page.bringToFront()
    }
  }

  if (CHAT) {
    // t24 — a public link: the widget runs on it
    let slug = ''
    await step(page, 't24', async () => {
      await click(page, page.getByRole('button', { name: /^Public demo/ }).first(), 'public_demo')
      await sleep(1200)
      await click(page, page.getByRole('button', { name: /Share with a/ }), 'share_click')
      const link = page.locator('input[readonly][value*="/demo/"]')
      await link.waitFor({ timeout: 20000 })
      slug = (await link.inputValue()).split('/demo/')[1].replace(/[/?#].*$/, '')
      mark('slug', { slug })
    })
    // t25 — on a website: what it calls itself, the site, chat only
    await step(page, 't25', async () => {
      await click(page, page.getByRole('button', { name: /^On a website/ }).first(), 'embed')
      await sleep(1000)
      const title = page.getByPlaceholder(TOPIC.agent.name).last()
      await click(page, title, 'embed_title')
      await type(page, CHAT.title, 40)
      await page.keyboard.press('Enter')
      await sleep(800)
      await click(page, page.getByPlaceholder('https://theirsite.com'), 'origin_focus')
      await type(page, CHAT.origin, 40)
      await click(page, page.getByRole('button', { name: 'Add', exact: true }), 'origin_add')
      await page.waitForLoadState('networkidle'); await sleep(800)
      for (const [ch, want] of [['chat', true], ['voice', false]]) {
        const b = page.getByRole('button', { name: ch, exact: true }).last()
        const on = /border-ink/.test(await b.getAttribute('class') ?? '')
        if (on !== want) { await click(page, b, `channel_${ch}`); await page.waitForLoadState('networkidle'); await sleep(600) }
        else await hover(page, b, 700)
      }
      mark('embed_set')
    })
    // t26 — the snippet
    await step(page, 't26', async () => {
      const code = page.locator('code').filter({ hasText: 'embed.js' }).first()
      await hover(page, code, 1500)
      await click(page, page.getByRole('button', { name: /^Copy/ }).first(), 'copy_snippet')
    })
    // t27 — the site, with the widget on it
    const w = (sel) => page.locator(`[data-voho-widget] ${sel}`)
    await step(page, 't27', async () => {
      await page.goto(`${CHAT.site}?agent=${slug}`, { waitUntil: 'networkidle' })
      mark('site')
      await sleep(1500)
      await click(page, w('.launch'), 'widget_open')
      await w('.msg.them').first().waitFor({ timeout: 20000 })
      mark('widget_greeted')
    })
    // t28 … — one message per step, typed, sent, answered
    const replies = []
    for (let i = 0; i < CHAT.messages.length; i++) {
      await step(page, `t${28 + i}`, async () => {
        const before = await w('.msg.them').count()
        await click(page, w('textarea'), `chat_${i + 1}_focus`)
        await type(page, CHAT.messages[i], 55)
        mark(`chat_${i + 1}_typed`)
        await click(page, w('.send'), `chat_${i + 1}_send`)
        await page.waitForFunction((n) => document.querySelector('[data-voho-widget]').shadowRoot.querySelectorAll('.msg.them, .msg.err').length > n, before, { timeout: 45000 })
        const text = await w('.msg.them, .msg.err').last().textContent()
        replies.push(text); mark(`chat_${i + 1}_reply`, { text })
        await sleep(1200)
      })
    }
    // t31 — every chat is in Conversations
    await step(page, 't31', async () => {
      await page.goto(`${BASE}/conversations`, { waitUntil: 'networkidle' })
      mark('conversations')
      await sleep(1500)
      const row = page.getByText(new RegExp(CHAT.messages[0].slice(0, 12))).first()
      if (await row.isVisible().catch(() => false)) await click(page, row, 'open_conversation')
      else await click(page, page.locator('main a, main [role="row"], main li').first(), 'open_conversation').catch(() => {})
      await sleep(2500)
    }, { optional: true })
    mark('chat_done', { replies })
  }

  if (!CHAT) {

  // the call (no narration over it: the call speaks for itself)
  const callerAudio = []
  for (const text of TOPIC.caller.lines) {
    const b64 = await page.evaluate(async ({ text, voice }) => {
      const r = await fetch('/api/studio/speech', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice }) })
      if (!r.ok) throw new Error('speech ' + r.status)
      const buf = new Uint8Array(await r.arrayBuffer()); let s = ''
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000))
      return btoa(s)
    }, { text, voice: TOPIC.caller.voice || 'omar' })
    callerAudio.push(b64)
  }
  mark('caller_lines_ready')
  await moveTo(page, page.getByRole('button', { name: /Test audio/ })); await sleep(500)
  await click(page, page.getByRole('button', { name: /^Call \S+$/ }), 'call_start')
  const transcript = () => page.evaluate(() => [...document.querySelectorAll('div[dir="auto"].rounded-xl')].map((b) => ({ who: b.querySelector('.eyebrow')?.textContent?.trim(), text: b.textContent.replace(b.querySelector('.eyebrow')?.textContent ?? '', '').trim() })))
  const agentQuiet = async (timeoutMs = 45000) => {
    const start = Date.now(); let last = '', lastChange = Date.now()
    while (Date.now() - start < timeoutMs) {
      const t = await transcript(), snap = JSON.stringify(t)
      if (snap !== last) { last = snap; lastChange = Date.now() }
      const endsAt = await page.evaluate(() => window.__agentAudioEndsAt)
      const tail = t[t.length - 1]
      if (tail && tail.who !== 'You' && tail.text && Date.now() - lastChange > 1800 && Date.now() > endsAt + 900) return t
      await sleep(250)
    }
    return transcript()
  }
  await page.waitForFunction(() => document.body.innerText.includes('Listening') || document.querySelector('div[dir="auto"].rounded-xl'), null, { timeout: 30000 })
  mark('call_live')
  let t = await agentQuiet()
  mark('agent_greeted', { transcript: t })
  for (let i = 0; i < callerAudio.length; i++) {
    mark(`caller_${i + 1}_start`, { text: TOPIC.caller.lines[i] })
    const d = await page.evaluate((b64) => window.__say(b64), callerAudio[i])
    mark(`caller_${i + 1}_end`, { dur: d })
    await sleep(600)
    t = await agentQuiet()
    mark(`agent_reply_${i + 1}`, { transcript: t })
    await sleep(500)
  }
  await sleep(800)
  await click(page, page.getByRole('button', { name: 'End', exact: true }), 'call_end')
  await sleep(2500)
  mark('call_done', { transcript: await transcript() })

  if (DESK) {
    // t22 — the desk: both tickets, filled in during the call
    await step(page, 't22', async () => {
      await page.goto(deskUrl, { waitUntil: 'networkidle' })
      mark('desk')
      await sleep(1500)
      const rows = page.locator('tbody tr')
      for (let i = 0; i < 2; i++) await hover(page, rows.nth(i), 1600)
    })
    // t23 — open each ticket: what the agent sent
    await step(page, 't23', async () => {
      const rows = page.locator('tbody tr')
      await click(page, rows.nth(1), 'open_ticket')
      await sleep(2200)
      await click(page, rows.nth(0), 'open_ticket_2')
      await sleep(1000)
      await hover(page, page.locator('pre').first(), 2000).catch(() => {})
    })
  }

  }

  if (!DESK && !CHAT) {
  // t10 — functions
  await step(page, 't10', async () => {
    await click(page, page.getByRole('button', { name: /^Functions/ }), 'functions')
    await sleep(1200)
    await click(page, page.getByRole('button', { name: 'Add function' }))
    await sleep(400)
    await click(page, page.getByPlaceholder('lookup_order').last())
    await type(page, 'check_availability', 45)
    await click(page, page.getByPlaceholder('Use when the caller asks where their order is.').last())
    await type(page, REC.fnDesc, 24)
  }, { optional: true })

  // t11 — knowledge base
  await step(page, 't11', async () => {
    await click(page, page.getByRole('button', { name: /^Knowledge base/ }), 'knowledge')
    await sleep(1000)
    const up = page.getByRole('button', { name: /Upload|Add|document/i }).first()
    if (await up.isVisible().catch(() => false)) await hover(page, up, 1800)
  }, { optional: true })

  // t15 — test chat
  await step(page, 't15', async () => {
    await click(page, page.getByRole('button', { name: /^Test chat/ }), 'test_chat')
    await sleep(800)
    await click(page, page.getByPlaceholder('Write what a visitor would…'))
    await type(page, REC.chat, 45)
    await page.keyboard.press('Enter')
    mark('chat_sent')
    await sleep(6000)
  }, { optional: true })

  // t16 — public demo
  await step(page, 't16', async () => {
    await click(page, page.getByRole('button', { name: /^Public demo/ }), 'public_demo')
    await sleep(1500)
    const share = page.getByRole('button', { name: /Share with a/ })
    if (await share.isVisible().catch(() => false)) {
      await click(page, share, 'share_click')
      await page.locator('input[readonly][value*="/demo/"]').waitFor({ timeout: 20000 }).catch(() => {})
    }
  }, { optional: true })

  // t12 — on a website
  await step(page, 't12', async () => {
    await click(page, page.getByRole('button', { name: /^On a website/ }), 'embed')
    await sleep(1400)
    for (const txt of ['What it calls itself', 'Sites that may use it', 'What the widget offers']) {
      const el = page.getByText(txt, { exact: true }).first()
      if (await el.isVisible().catch(() => false)) await hover(page, el, 1400)
    }
  }, { optional: true })

  // t13 — phone numbers
  await step(page, 't13', async () => {
    await click(page, nav(page, 'Phone Numbers'), 'phone_numbers')
    await page.waitForLoadState('networkidle')
    await sleep(1200)
    await click(page, page.getByRole('button', { name: 'Import number' }).first())
    await sleep(1200)
    await hover(page, page.getByText('From Twilio').first(), 1500)
    await click(page, page.getByText('From SIP Trunk').first(), 'sip_form')
    await sleep(1000)
  }, { optional: true })

  // t14 — the dashboard
  await step(page, 't14', async () => {
    const esc = page.getByRole('button', { name: /Cancel|Close/ }).first()
    if (await esc.isVisible().catch(() => false)) await esc.click().catch(() => {})
    await click(page, nav(page, 'Dashboard'), 'dashboard')
    await page.waitForLoadState('networkidle')
    await page.mouse.move(1100, 600, { steps: 24 })
  }, { optional: true })
  }
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
  const dpath = await deskPage?.video()?.path().catch(() => null)
  if (dpath) fs.renameSync(dpath, path.join(OUT, 'desk.webm'))
  for (const [id, { startMs, parts }] of chunks) {
    fs.writeFileSync(path.join(OUT, `${id}.webm`), Buffer.concat(parts.filter(Boolean)))
    marks.push({ name: `audio_${id}`, t: (startMs - t0) / 1000, file: `${id}.webm` })
  }
  fs.writeFileSync(path.join(OUT, 'marks.json'), JSON.stringify({ email: EMAIL, password: DEMO_PASS, base: BASE, t0, marks }, null, 2))
  await browser.close()
  console.log('wrote', OUT)
}
