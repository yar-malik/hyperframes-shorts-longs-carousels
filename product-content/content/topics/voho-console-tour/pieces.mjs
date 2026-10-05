// Topic (Voho): "Every setting in the Voho console: functions, knowledge
// base, phone numbers, outbound and more". Long video
// https://youtu.be/x9Njk5NqmFk.
//
// Every claim below is from that tour's own narration
// (voho-platform/tmp/demo-video/hyperframes-tour/vo-lines.json) or read off
// its screens: 21 voices, Sada, functions as one JSON endpoint, a knowledge
// base that quotes figures exactly, a public demo link with a budget, a
// webhook, a site widget, Twilio or SIP numbers (STC, Mobily), outbound with
// calling windows, a do-not-call list and an automatic stop, conversations
// with summaries and outcomes, and billing per minute and per character with
// no seats and no minimums.
import { shot, window, css as common, ctaSlide } from "../_voho-shots/common.mjs";

export { window };
export const css = common;
export const short = { url: "https://youtu.be/T-SR9qiBtDQ", id: "T-SR9qiBtDQ" };

/* ─────────────────────────── Instagram ─────────────────────────── */
export const ig = [
  // 1 — cover
  ({ yar }) => `
    <img class="shot" src="${shot("whole")}" style="left:64px; top:70px; width:700px; transform:rotate(-2deg)">
    ${yar({ h: 600, style: "right:-60px; top:90px" })}
    <div class="cv-badge" style="top:720px"><span class="pill">Arabic first</span></div>
    <div class="cv-hook h1" style="top:790px">Everything an AI call<br>centre needs, on<br>one screen</div>
    <div class="cv-sub" style="top:1070px">Every setting in Voho, one per slide.</div>`,

  // 2 — voices
  () => `
    <div class="hd"><div class="label">01 · Voices</div><div class="h2">21 Arabic voices.</div>
      <div class="body">On Sada, a Saudi voice model, so it sounds local rather than translated. Type a line, pick a voice, hear it.</div></div>
    <img class="shot" src="${shot("voices")}" style="left:64px; top:470px; width:952px">`,

  // 3 — writing it
  () => `
    <div class="hd"><div class="label">02 · Instructions</div><div class="h2">Two shortcuts.</div></div>
    <img class="shot" src="${shot("topbar")}" style="left:64px; top:250px; width:952px">
    <ul class="lst" style="position:absolute; left:72px; right:72px; top:420px">
      <li><b class="num">1</b><span><strong>Write it with AI</strong> drafts the whole agent from one sentence about the job, prompt and greeting together.</span></li>
      <li><b class="num">2</b><span><strong>Write it in Arabic</strong> rewrites your prompt in Arabic, keeping every instruction.</span></li>
      <li><b class="num">3</b><span><strong>Templates</strong> for reception, appointments, lead qualification and orders.</span></li>
    </ul>`,

  // 4 — functions
  () => `
    <div class="hd" style="right:480px"><div class="label">03 · Functions</div><div class="h2">It can check<br>your systems.</div>
      <div class="body">One endpoint. Voho posts the function name and arguments, you answer with JSON, and that's what the agent knows.</div></div>
    <img class="shot" src="${shot("functions")}" style="right:64px; top:70px; width:390px">`,

  // 5 — knowledge
  () => `
    <div class="hd"><div class="label">04 · Knowledge base</div><div class="h2">It quotes your prices.<br>Exactly.</div>
      <div class="body">Upload price lists, policies and product sheets: PDFs, images, even scans, in Arabic or English.</div></div>
    <div style="position:absolute; left:72px; right:72px; top:560px; display:flex; flex-direction:column; gap:18px">
      ${["Price list.pdf", "Insurance policy.pdf", "Menu scan.jpg"].map((f) => `<div class="card" style="padding:26px 30px; font-size:32px; font-weight:800; display:flex; align-items:center; gap:18px"><i style="width:30px; height:38px; border-radius:6px; background:#C63D2F; display:block"></i>${f}</div>`).join("")}
    </div>`,

  // 6 — where it lives
  () => `
    <div class="hd"><div class="label">05 · Where it lives</div><div class="h2">A link, a widget,<br>a webhook.</div></div>
    <ul class="lst" style="position:absolute; left:72px; right:560px; top:340px">
      <li><span><strong>Public demo:</strong> a link anyone can call, capped by a budget you set.</span></li>
      <li><span><strong>On a website:</strong> one snippet, voice or chat or both.</span></li>
      <li><span><strong>Webhook:</strong> every call's transcript and outcome, sent to your CRM.</span></li>
    </ul>
    <img class="shot" src="${shot("embed")}" style="right:64px; top:340px; width:440px">`,

  // 7 — phone lines
  () => `
    <div class="hd"><div class="label">06 · Phone lines</div><div class="h2">Inbound and outbound.</div></div>
    <ul class="lst" style="position:absolute; left:72px; right:72px; top:260px">
      <li><b class="num">↓</b><span><strong>Phone numbers.</strong> Import one from Twilio or connect your own SIP trunk. An STC or Mobily trunk points straight at Voho.</span></li>
      <li><b class="num">↑</b><span><strong>Outbound.</strong> Upload a list, pick the agent, set the calling window.</span></li>
      <li><b class="tick">✓</b><span>Never calls a number on your do-not-call list.</span></li>
      <li><b class="tick">✓</b><span>Stops the batch itself if calls start failing in a row.</span></li>
    </ul>`,

  // 8 — conversations (interrupt)
  () => `
    <div class="hd"><div class="label">07 · Conversations</div><div class="h2">Every call,<br>written up.</div></div>
    <div class="quote" style="top:340px">
      <div class="qh"><b>Al Noor Clinics Reception</b><span class="res">Resolved</span><span>50s · $0.06</span></div>
      <p>"The caller, Mohammed Al-Otaibi, called to book a dental appointment for tomorrow afternoon. The agent successfully booked the appointment for him in the dental department."</p>
    </div>
    <div class="body" style="position:absolute; left:72px; right:72px; top:790px">The summary and outcome are written from the transcript itself, so they say what happened, not what the agent was meant to do.</div>`,

  // 9 — billing
  () => `
    <div class="hd"><div class="label">08 · Billing</div><div class="h2">No seats.<br>No minimums.</div></div>
    <div style="position:absolute; left:64px; right:64px; top:360px; display:flex; gap:22px">
      <div class="card stat"><b style="color:var(--accent)">$0.07</b><span>per call minute</span></div>
      <div class="card stat"><b>$0.05</b><span>per 1K characters</span></div>
    </div>
    <img class="shot" src="${shot("billing")}" style="left:180px; top:600px; width:720px">`,

  // 10 — CTA
  (h) => ctaSlide(h, "VOHO", "and I'll send you the link."),
];

/* ─────────────────────────── LinkedIn ─────────────────────────── */
export const li = [
  ({ yar }) => `
    ${yar({ h: 560, style: "right:-30px; top:70px" })}
    <div style="position:absolute; left:72px; top:110px; width:600px">
      <span class="pill">Product tour · 4 min</span>
      <div class="h1" style="margin-top:26px">What an AI<br>call centre<br>actually needs.</div>
    </div>
    <img class="shot" src="${shot("whole")}" style="left:72px; top:700px; width:620px">`,
  () => `
    <div class="hd"><div class="label">The short version</div><div class="h2">Eight things, one console.</div></div>
    <ul class="lst" style="position:absolute; left:72px; right:72px; top:250px">
      ${[["Voices", "21 Arabic voices on Sada, a Saudi model"], ["Instructions", "Write it with AI, or in Arabic"], ["Functions", "one JSON endpoint into your systems"], ["Knowledge", "price lists quoted exactly"], ["Channels", "phone, website widget, public link"], ["Outbound", "calling windows and a do-not-call list"], ["Conversations", "transcript, summary, outcome"], ["Billing", "per minute, no seats"]]
        .map(([a, b], i) => `<li style="padding:16px 0; font-size:30px"><b class="num">${i + 1}</b><span><strong>${a}:</strong> ${b}</span></li>`).join("")}
    </ul>`,
  () => `
    <div class="hd" style="right:480px"><div class="label">The part most skip</div><div class="h2">Connecting it<br>to your systems.</div>
      <div class="body">A function is one endpoint: the agent posts a name and arguments, you answer with JSON. No endpoint, and the function isn't offered at all, so the agent never promises a lookup it can't do.</div></div>
    <img class="shot" src="${shot("functions")}" style="right:64px; top:70px; width:390px">`,
  () => `
    <div class="hd"><div class="label">Operations</div><div class="h2">Built for a real line.</div></div>
    <ul class="lst" style="position:absolute; left:72px; right:72px; top:260px">
      <li><b class="tick">✓</b><span>Numbers from Twilio, or your own SIP trunk. STC and Mobily work.</span></li>
      <li><b class="tick">✓</b><span>Outbound only inside the window you set.</span></li>
      <li><b class="tick">✓</b><span>Never to a number on your do-not-call list.</span></li>
      <li><b class="tick">✓</b><span>Stops itself when calls start failing in a row.</span></li>
      <li><b class="tick">✓</b><span>A webhook to your CRM at the end of every call.</span></li>
    </ul>`,
  () => `
    <div class="hd"><div class="label">After the call</div><div class="h2">It writes up<br>what happened.</div></div>
    <div class="quote" style="top:360px">
      <div class="qh"><b>Al Noor Clinics Reception</b><span class="res">Resolved</span><span>50s · $0.06</span></div>
      <p>"…called to book a dental appointment for tomorrow afternoon. The agent successfully booked the appointment for him… The exact time of the appointment was not specified in the call."</p>
    </div>
    <div class="body" style="position:absolute; left:72px; right:72px; top:800px">The last line is the point. The outcome records what was actually said, not what the agent was supposed to achieve.</div>`,
  () => `
    <div class="hd"><div class="label">Pricing</div><div class="h2">Pay for what's used.</div></div>
    <div style="position:absolute; left:64px; right:64px; top:300px; display:flex; gap:22px">
      <div class="card stat"><b style="color:var(--accent)">$0.07</b><span>per call minute</span></div>
      <div class="card stat"><b>$0.05</b><span>per 1K characters</span></div>
      <div class="card stat"><b>0</b><span>seats or minimums</span></div>
    </div>
    <img class="shot" src="${shot("billing")}" style="left:180px; top:560px; width:720px">`,
  (h) => ctaSlide(h, "VOHO", "and I'll send the link.", "Follow Yar Malik"),
];

/* ─────────────────────────── the words ─────────────────────────── */
export const captions = {
  ig: `Everything an AI call centre needs, Arabic first, on one screen.

Save this one. It's every setting in Voho, one per slide:

01 21 Arabic voices on Sada, a Saudi voice model
02 Write it with AI, or Write it in Arabic
03 Functions: one JSON endpoint into your systems
04 A knowledge base that quotes your prices exactly
05 A public demo link, a website widget and a webhook
06 Phone numbers (Twilio or your own SIP trunk) and outbound calling
07 Every call written up: transcript, summary, outcome
08 Per minute, no seats, no minimums

Comment VOHO and I'll send you the link.

#ai #voiceai #callcenter #saudiarabia #automation`,
  li: `What does an AI call centre actually need to run on a real phone line?

I recorded a four-minute tour of every setting in Voho to answer that, and the list is longer than the demos suggest:

1. Voices that sound local. 21 Arabic voices on Sada, a Saudi voice model.
2. Instructions you can write fast. Write it with AI from one sentence, or Write it in Arabic.
3. Functions. One endpoint, JSON in and out. With no endpoint the function isn't offered, so the agent never promises a lookup it can't do.
4. A knowledge base that quotes your price list exactly.
5. Channels: a phone number (Twilio, or your own SIP trunk from STC or Mobily), a website widget, a public link.
6. Outbound with guardrails: calling windows, a do-not-call list, and a batch that stops itself when calls start failing.
7. A write-up of every call, with the outcome taken from what was actually said.
8. Billing per minute. No seats, no minimums.

The deck has the screens. Comment VOHO and I'll send you the link.`,
};

export const tweet = `Everything an AI call centre needs, Arabic first:

• 21 Arabic voices on a Saudi voice model
• functions: one JSON endpoint into your systems
• a knowledge base that quotes prices exactly
• phone, website widget, public link
• every call summarised

No seats. Pay by the minute.`;

export const article = {
  title: "Every setting an AI call centre needs, explained in one tour",
  body: `Most AI call centre demos show you one thing: a nice voice answering a call. That's the easy part. The hard part is everything around it, the stuff that decides whether it survives a real phone line with real customers. So I recorded a tour of every setting in the Voho console, and this is the written version.

Voho is ours, and it's built Arabic first. That shapes most of what follows.

## Voices

There are 21 Arabic voices, running on Sada, a Saudi voice model. In the Gulf this is the whole game: an agent that sounds translated loses the caller in the first sentence. Generate Speech lets you type a line, pick a voice and hear it before you build anything.

## Writing the agent

An agent is instructions, a voice and a greeting. Two shortcuts help. Write it with AI drafts the whole agent, prompt and greeting together, from one sentence about the job. Write it in Arabic rewrites your prompt in Arabic and keeps every instruction. There are also templates for reception, appointments, lead qualification and orders.

## Functions

This is how the agent reaches your systems, and it's deliberately simple. There's one endpoint. Voho posts the function name and the arguments, you answer with JSON, and whatever you send back is what the agent knows. You add a function by name and tell the agent when to use it.

One detail I like: if there's no endpoint, the functions aren't offered to the agent at all. An agent told it can look something up, with nowhere to look, promises the caller something it can't do. So it simply can't.

## Knowledge base

Upload price lists, policies and product sheets, as PDFs, images or even scans, in Arabic or English. The agent answers from them and quotes the figures exactly, without you pasting them into the prompt.

## Dynamic variables

Anything in double curly braces in the prompt or the greeting becomes a variable. You set a test value; a real call passes its own. That's how one agent greets every customer by name.

## Where the agent lives

- Public demo: one click gives the agent a link anyone can call, with no account and no install. Calls come out of your balance up to a budget you set.
- On a website: paste one snippet before the closing body tag and it's a voice and chat widget. You choose which sites may use it and give chat its own budget.
- Webhook: when a call ends, the transcript, summary, outcome and actions are posted to your URL, so your CRM hears about every call.

## Phone lines

Import a number from Twilio or connect your own SIP trunk. An STC or Mobily trunk points straight at Voho. Route each number to an agent and it's live on the phone.

Outbound is batch calling: upload a list, choose the agent, set the calling window. Calls only go out inside that window, never to a number on your do-not-call list, and the batch stops itself if calls start failing in a row. That last one matters more than it sounds. A broken batch that keeps dialling is how you burn a list.

## Conversations

Every call and every chat, with a summary and an outcome written from the transcript itself. The outcome says what happened, not what the agent was supposed to make happen. On the demo call, the summary noted that the exact appointment time "was not specified in the call", because it wasn't.

## Billing

You pay for what you use: per minute of call and per character of speech. No seats, no minimums. Test calls in the console run at $0.07 a minute, and speech on Sada is $0.05 per thousand characters. The demo call, 50 seconds, cost six cents.

## And an API

Create a key, and everything above is available to your own code. The API Explorer sends a real request to the same endpoint, with the same authentication.

That's the whole console. If you run a clinic, a shop or a sales team in the Gulf and your phone is where customers slip away, comment VOHO and I'll send you the link.`,
};

/* ─────────────────────────── X article header ─────────────────────────── */
export const articleCover = ({ yar }) => `
  <div class="win" style="border-radius:0">
    <div style="position:absolute; left:80px; top:110px; width:820px">
      <span class="pill">Product tour · Arabic first</span>
      <div class="h1" style="margin-top:28px; font-size:74px">Every setting an AI<br>call centre needs</div>
      <div style="display:flex; gap:12px; margin-top:34px; flex-wrap:wrap">
        ${["21 voices", "Functions", "Knowledge", "Outbound", "No seats"].map((n) => `<span class="chip2">${n}</span>`).join("")}
      </div>
    </div>
    ${yar({ h: 560, fade: false, style: "left:1190px; bottom:0; transform:translateX(-50%)" })}
  </div>`;

/* ─────────────────────────── LinkedIn post ─────────────────────────── */
export const liPost = {
  image: ({ yar }) => `
    <div class="win" style="border-radius:0">
      <div style="position:absolute; left:72px; top:80px; right:72px">
        <span class="pill">Arabic first</span>
        <div style="font-size:84px; font-weight:800; letter-spacing:-.045em; line-height:1.02; margin-top:30px">An AI call centre<br>needs more than<br><span style="color:var(--accent)">a nice voice.</span></div>
      </div>
      <ul class="lst" style="position:absolute; left:72px; top:520px; width:560px">
        ${["21 Arabic voices", "Functions into your systems", "Prices quoted exactly", "Outbound with guardrails", "Every call written up", "No seats, per minute"]
          .map((t) => `<li style="padding:16px 0; font-size:30px"><b class="tick">✓</b><span>${t}</span></li>`).join("")}
      </ul>
      ${yar({ h: 660, fade: false, style: "right:-190px; bottom:0" })}
    </div>`,
  text: `An AI call centre needs a lot more than a nice voice.

The voice is the part every demo shows. What decides whether it survives a real phone line is everything around it:

• Can it check your systems, or does it just promise to?
• Does it quote your actual prices?
• Will outbound stop on its own when something breaks?
• Does anyone find out what happened on the call?

I recorded a tour of every setting in Voho that answers those, one by one. 21 Arabic voices on a Saudi model, functions over one JSON endpoint, a knowledge base, a site widget, Twilio or your own SIP trunk, outbound with calling windows and a do-not-call list, and a write-up of every call. Per minute, no seats.

Comment VOHO and I'll send you the link.`,
};
