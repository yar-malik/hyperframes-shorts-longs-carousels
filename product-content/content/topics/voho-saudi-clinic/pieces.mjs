// Topic (Voho): "Voho AI Call Center: sign up, write a Saudi Arabic prompt,
// take a live call". Long video https://youtu.be/c4h0otTvBcU.
//
// Everything below is off that recording: the account, the agent (Al Noor
// Clinics Reception, voice Layla on Sada, Arabic (Saudi Arabia)), the Arabic
// instructions, and the test call itself, which the console summarised as
// RESOLVED, 50s, $0.06. The English under the Arabic is our translation of
// what is on screen, not something the product produced.
import { shot, window, css as common, ctaSlide } from "../_voho-shots/common.mjs";

export { window };
export const css = common;
export const short = { url: "https://youtu.be/xDwl0UnZlJY", id: "xDwl0UnZlJY" };

const CALL = [
  ["ai", "Layla", "Welcome to Al Noor Medical Clinics, this is Layla. How can I help?"],
  ["you", "Caller", "I'd like to book with the dentist, tomorrow afternoon if possible."],
  ["ai", "Layla", "Of course. Can you give me the patient's name and mobile number?"],
  ["you", "Caller", "Mohammed Al-Otaibi, 0551234567."],
  ["ai", "Layla", "Done, Mohammed. Tomorrow afternoon, in the dental department. See you then."],
];

/* ─────────────────────────── Instagram ─────────────────────────── */
export const ig = [
  // 1 — cover
  ({ yar }) => `
    <div class="card" style="position:absolute; left:72px; top:70px; width:500px; padding:30px 32px; text-align:center">
      <div style="width:84px; height:84px; margin:0 auto; border-radius:50%; background:var(--accent); display:grid; place-items:center; color:#fff; font-size:40px">✆</div>
      <div style="margin-top:14px; font-size:30px; font-weight:800">Al Noor Clinics</div>
      <div dir="rtl" style="margin-top:12px; font-size:32px; font-weight:700">حيّاك الله في عيادات النور الطبية</div>
      <div style="margin-top:8px; font-size:22px; color:var(--soft); font-style:italic">"Welcome to Al Noor Clinics, this is Layla."</div>
    </div>
    ${yar({ h: 620, style: "right:-40px; top:60px" })}
    <div class="cv-badge" style="top:720px"><span class="pill">Built in under 2 minutes</span></div>
    <div class="cv-hook h1" style="top:790px">I built an AI receptionist<br>that speaks Saudi Arabic</div>
    <div class="cv-sub" style="top:980px">It booked a dentist on the very first call.</div>`,

  // 2 — why
  ({ fig }) => `
    <div class="hd"><div class="h2">A missed call is a<br>patient who rings the<br>next clinic.</div>
      <div class="body">And most AI receptionists sound like a translation the moment the caller speaks in dialect.</div></div>
    <div style="position:absolute; right:90px; top:760px; width:160px; height:230px">${fig({ w: 160, k: 4, mouth: "o", style: "left:0" })}</div>`,

  // 3 — step 1
  () => `
    <div class="hd"><span class="pill">Step 1</span><div class="h2" style="margin-top:26px">Sign up, create an agent.</div>
      <div class="body">app.voho.ai, an email and a password. Then Create an agent, start from scratch.</div></div>
    <img class="shot" src="${shot("topbar-tight")}" style="left:64px; top:460px; width:952px">
    <div class="body" style="position:absolute; left:72px; right:72px; top:640px">The whole agent is three things across the top: the model, the voice and the language.</div>`,

  // 4 — step 2, the voice
  () => `
    <div class="hd"><span class="pill">Step 2</span><div class="h2" style="margin-top:26px">Give it a Saudi voice.</div>
      <div class="body">Layla, on Sada, Voho's Saudi voice model. "Warm Najdi delivery", the console calls it.</div></div>
    <img class="shot" src="${shot("voices")}" style="left:64px; top:470px; width:952px">`,

  // 5 — step 3, the prompt
  () => `
    <div class="hd"><span class="pill">Step 3</span><div class="h2" style="margin-top:26px">Write it in Arabic.</div></div>
    <img class="shot" src="${shot("prompt")}" style="left:64px; top:250px; width:952px">
    <ul class="lst" style="position:absolute; left:72px; right:72px; top:900px">
      <li style="padding:14px 0"><b class="tick">✓</b><span>Books, changes and cancels appointments</span></li>
      <li style="padding:14px 0"><b class="tick">✓</b><span>Confirms the patient's name and mobile</span></li>
      <li style="padding:14px 0"><b class="x">✕</b><span>Never gives medical advice</span></li>
    </ul>`,

  // 6 — step 4, the call (interrupt)
  () => `
    <div class="hd"><span class="pill">Step 4</span><div class="h2" style="margin-top:26px">Press call.</div></div>
    <div style="position:absolute; left:64px; right:64px; top:260px; display:flex; flex-direction:column; gap:14px">
      ${CALL.map(([w, n, t]) => `<div class="bubble ${w}"><small>${n}</small>${t}</div>`).join("")}
    </div>
    <div style="position:absolute; left:72px; bottom:150px; font-size:22px; color:var(--soft)">Said in Arabic. Translated from the call transcript.</div>`,

  // 7 — the result
  () => `
    <div style="position:absolute; left:0; right:0; top:110px; text-align:center">
      <div class="label" style="color:var(--soft)">the whole call</div>
      <div class="big" style="margin-top:20px">50s</div>
      <div style="font-size:72px; font-weight:800; margin-top:14px">$0.06</div>
    </div>
    <div class="quote" style="top:640px">
      <div class="qh"><b>Al Noor Clinics Reception</b><span class="res">Resolved</span></div>
      <p>"The caller, Mohammed Al-Otaibi, called to book a dental appointment for tomorrow afternoon. The agent successfully booked the appointment."</p>
    </div>`,

  // 8 — make it real
  () => `
    <div class="hd"><div class="label">Then make it real</div><div class="h2">Give it a phone number.</div></div>
    <ul class="lst" style="position:absolute; left:72px; right:72px; top:230px">
      <li><b class="num">1</b><span><strong>Import a number</strong> from Twilio, or point your own SIP trunk at it. STC and Mobily trunks work.</span></li>
      <li><b class="num">2</b><span><strong>Put it on your site</strong> as a voice and chat widget, with one snippet.</span></li>
      <li><b class="num">3</b><span><strong>Read every call</strong> afterwards: the transcript, a summary and the outcome.</span></li>
    </ul>
    <img class="shot" src="${shot("embed")}" style="left:330px; top:715px; width:420px; height:auto">`,

  // 9 — CTA
  (h) => ctaSlide(h, "CLINIC", "and I'll send you the link."),
];

/* ─────────────────────────── LinkedIn ─────────────────────────── */
export const li = [
  ({ yar }) => `
    ${yar({ h: 560, style: "right:-30px; top:70px" })}
    <div style="position:absolute; left:72px; top:110px; width:560px">
      <span class="pill">Saudi Arabic · live demo</span>
      <div class="h1" style="margin-top:26px">An Arabic<br>receptionist,<br>in two<br>minutes.</div>
    </div>
    <div class="cv-sub" style="top:780px; text-align:left; left:72px">Sign-up to a booked appointment, recorded in one take.</div>`,
  () => `
    <div class="hd"><div class="label">The problem</div><div class="h2">Clinics lose patients<br>on the phone.</div>
      <div class="body" style="margin-top:40px">Calls land at lunch, after hours and all at once. The ones nobody picks up book somewhere else.</div>
      <div class="body" style="margin-top:30px">Voice AI can take those calls now. In the Gulf it only works if it sounds like the caller, not like a translation.</div></div>
    <div style="position:absolute; left:64px; right:64px; top:760px; display:flex; gap:22px">
      <div class="card stat"><b style="font-size:48px">12:30</b><span>lunch rush</span></div>
      <div class="card stat"><b style="font-size:48px">22:00</b><span>after hours</span></div>
      <div class="card stat"><b style="font-size:48px">×3</b><span>at once</span></div>
    </div>`,
  () => `
    <div class="hd"><div class="label">The build</div><div class="h2">Three decisions.</div></div>
    <img class="shot" src="${shot("topbar-tight")}" style="left:64px; top:270px; width:952px">
    <ul class="lst" style="position:absolute; left:72px; right:72px; top:420px">
      <li><b class="num">1</b><span><strong>Voice:</strong> Layla, a Najdi voice on Sada, Voho's Saudi model.</span></li>
      <li><b class="num">2</b><span><strong>Language:</strong> Arabic (Saudi Arabia).</span></li>
      <li><b class="num">3</b><span><strong>Instructions:</strong> written in Saudi Arabic, not translated into it.</span></li>
    </ul>`,
  () => `
    <div class="hd"><div class="label">The instructions</div><div class="h2">What it's told to do.</div></div>
    <img class="shot" src="${shot("prompt")}" style="left:64px; top:250px; width:952px">
    <ul class="lst" style="position:absolute; left:72px; right:72px; top:900px">
      <li style="padding:12px 0"><b class="tick">✓</b><span>Book, change and cancel across four departments</span></li>
      <li style="padding:12px 0"><b class="x">✕</b><span>No diagnosis, no medication advice. Emergencies go to 997.</span></li>
    </ul>`,
  () => `
    <div class="hd"><div class="label">The test call</div><div class="h2">It booked the dentist.</div></div>
    <div style="position:absolute; left:64px; right:64px; top:260px; display:flex; flex-direction:column; gap:14px">
      ${CALL.map(([w, n, t]) => `<div class="bubble ${w}"><small>${n}</small>${t}</div>`).join("")}
    </div>
    <div style="position:absolute; left:72px; bottom:150px; font-size:22px; color:var(--soft)">Said in Arabic. Translated from the call transcript.</div>`,
  () => `
    <div class="hd"><div class="label">What it cost</div><div class="h2">50 seconds. Six cents.</div></div>
    <div style="position:absolute; left:64px; right:64px; top:300px; display:flex; gap:22px">
      <div class="card stat"><b style="color:var(--accent)">50s</b><span>the call</span></div>
      <div class="card stat"><b>$0.06</b><span>what it cost</span></div>
      <div class="card stat"><b>0</b><span>seats to buy</span></div>
    </div>
    <div class="quote" style="top:560px">
      <div class="qh"><b>Written by the console, after the call</b><span class="res">Resolved</span></div>
      <p>"The agent successfully booked the appointment for him in the dental department for tomorrow afternoon."</p>
    </div>`,
  (h) => ctaSlide(h, "CLINIC", "and I'll send the link.", "Follow Yar Malik"),
];

/* ─────────────────────────── the words ─────────────────────────── */
export const captions = {
  ig: `I built an AI receptionist that speaks Saudi Arabic, and it took under two minutes.

Sign up on Voho, create an agent, give it Layla (a warm Najdi voice on Sada, Voho's Saudi voice model), and write the instructions in Saudi Arabic: book appointments, confirm the patient's name and mobile, never give medical advice.

Then press call. It booked a dentist for tomorrow afternoon on the first try. 50 seconds, 6 cents.

Comment CLINIC and I'll send you the link.

#ai #voiceai #saudiarabia #riyadh #clinic #automation`,
  li: `A clinic's phone is where patients are won and lost.

The calls come at lunch, after hours and all at once, and the ones nobody answers book somewhere else. Voice AI can take those calls now, but in the Gulf it only works if it sounds like the caller rather than like a translation.

So here's a Saudi Arabic receptionist, built on Voho, from sign-up to a booked appointment in one take:

1. Create an agent and give it Layla, a Najdi voice on Sada, Voho's Saudi model.
2. Write the instructions in Saudi Arabic. Book, change and cancel across four departments, confirm the patient's name and mobile, never give medical advice, send emergencies to 997.
3. Press call and talk to it like a patient would.

It booked the dentist. The call took 50 seconds and cost $0.06, and the console wrote up the summary and outcome on its own.

The deck has the prompt and the full call. Comment CLINIC and I'll send you the link.`,
};

export const tweet = `I built an AI receptionist that speaks Saudi Arabic in under 2 minutes.

Najdi voice, instructions written in Arabic, one rule: never give medical advice.

First test call: booked a dentist for tomorrow afternoon. 50 seconds, $0.06.

Built on Voho.`;

export const article = {
  title: "I built a Saudi Arabic AI receptionist in two minutes. Here's the whole thing.",
  body: `Most AI receptionists fall apart the moment a caller in Riyadh speaks the way people in Riyadh actually speak. They answer in formal Arabic, or worse, in something that sounds translated. So I wanted to see how fast I could build one that doesn't, from a blank account to a booked appointment, and record it in one take.

It took under two minutes. Here's everything I did.

## The setup

I built it on Voho (app.voho.ai), which is ours. Sign up with an email and a password and you land in the console. Click Create an agent, and start from scratch.

An agent is three decisions, and they sit across the top of the screen:

- The model: Sada, Voho's Saudi voice model.
- The voice: Layla. The console describes her as "warm Najdi delivery, the default for inbound reception and appointment setting."
- The language: Arabic (Saudi Arabia).

## The instructions

This is the part that decides whether it sounds local. I wrote the instructions in Saudi Arabic rather than writing them in English and hoping. There's a "Write it in Arabic" button that rewrites an English prompt for you, but for a demo I wanted to show it done properly.

In English, the prompt says roughly this. You are Layla, the voice receptionist at Al Noor Medical Clinics in Riyadh. Answer in a warm, polite Saudi dialect, in short clear sentences. Book, change and cancel appointments for dentistry, dermatology, paediatrics and internal medicine. Confirm the patient's name and mobile number before confirming anything. Give the opening hours and the location, and say which insurers the clinic accepts.

And the rules. Never give a diagnosis or medication advice; if someone describes symptoms, offer them an appointment with the right doctor. If it's an emergency, tell them to call 997 now. If they ask for a person, transfer them politely. End every call by repeating the appointment back.

Then a welcome message, which the agent speaks first, and Save.

## The call

I pressed Call and talked to it like a patient would. Translated from the transcript, it went like this:

- Layla: Welcome to Al Noor Medical Clinics, this is Layla. How can I help?
- Me: I'd like to book with the dentist, tomorrow afternoon if possible.
- Layla: Of course. Can you give me the patient's name and mobile number?
- Me: Mohammed Al-Otaibi, 0551234567.
- Layla: Done, Mohammed. Tomorrow afternoon, in the dental department. See you then.

The console marked it resolved. The call took 50 seconds and cost six cents.

## What happens after the call

This is the bit I like most. Every call shows up under Conversations with the transcript, a summary and an outcome, and the summary is written from what was actually said. This one read: "The caller, Mohammed Al-Otaibi, called to book a dental appointment for tomorrow afternoon. The agent successfully booked the appointment for him in the dental department for tomorrow afternoon. The exact time of the appointment was not specified in the call."

That last sentence is the honest part. Layla asked what time suited him and I hung up without answering, so the summary says so. It records what happened on the call, not what the agent was meant to do.

## Making it real

A test call in the browser is a demo. To put it on a real line, you import a number from Twilio or point your own SIP trunk at Voho (an STC or Mobily trunk works), and route that number to the agent. The same agent can also sit on your website as a voice and chat widget, with one snippet pasted before the closing body tag.

If a clinic is losing patients to unanswered calls, this is a two-minute experiment. Comment CLINIC and I'll send you the link.`,
};

/* ─────────────────────────── X article header ─────────────────────────── */
export const articleCover = ({ yar }) => `
  <div class="win" style="border-radius:0">
    <div style="position:absolute; left:80px; top:110px; width:820px">
      <span class="pill">Saudi Arabic · live demo</span>
      <div class="h1" style="margin-top:28px; font-size:74px">An AI receptionist<br>in two minutes</div>
      <div style="display:flex; gap:12px; margin-top:34px">
        ${["Najdi voice", "Arabic prompt", "50s call", "$0.06"].map((n) => `<span class="chip2">${n}</span>`).join("")}
      </div>
    </div>
    ${yar({ h: 560, fade: false, style: "left:1190px; bottom:0; transform:translateX(-50%)" })}
  </div>`;

/* ─────────────────────────── LinkedIn post ─────────────────────────── */
export const liPost = {
  image: ({ yar }) => `
    <div class="win" style="border-radius:0">
      <div style="position:absolute; left:72px; top:80px; right:72px">
        <span class="pill">Built in under 2 minutes</span>
        <div style="font-size:88px; font-weight:800; letter-spacing:-.045em; line-height:1.02; margin-top:30px">An AI receptionist<br>that speaks<br><span style="color:var(--accent)">Saudi Arabic.</span></div>
      </div>
      <div style="position:absolute; left:72px; top:560px; width:520px; display:flex; flex-direction:column; gap:14px">
        ${CALL.slice(0, 4).map(([w, n, t]) => `<div class="bubble ${w}" style="font-size:22px; max-width:470px; ${w === "you" ? "margin-left:40px" : ""}"><small>${n}</small>${t}</div>`).join("")}
      </div>
      <div class="quote" style="left:72px; right:auto; width:520px; top:1150px; padding:22px 28px"><div class="qh"><span class="res">Resolved</span><b>50s · $0.06</b></div></div>
      ${yar({ h: 660, fade: false, style: "right:-190px; bottom:0" })}
    </div>`,
  text: `I built an AI receptionist that speaks Saudi Arabic, and it took under two minutes from sign-up.

The build is three decisions: a Najdi voice (Layla, on Sada, Voho's Saudi model), the language set to Arabic (Saudi Arabia), and instructions written in Saudi Arabic rather than translated into it. Book appointments, confirm the patient's name and mobile, never give medical advice.

Then one test call. It booked a dentist for tomorrow afternoon. 50 seconds, six cents, and the console wrote the summary on its own.

In the Gulf, dialect isn't a nice-to-have. An agent that sounds translated has lost the caller by its second sentence, so the voice and the language are the product.

Comment CLINIC and I'll send you the link.`,
};
