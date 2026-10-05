// Generate index.html from audio_meta.json. Re-run after re-recording:
//
//   node scripts/build.mjs
//
// Five beats: the claim, the voice, the Arabic instructions, the real call,
// the close. Every screen in the card is a crop of the real sign-up demo
// (voho-platform/tmp/demo-video, 22 Sep) — nothing here is a mockup.
import { resolve } from "node:path";
import { build, bot, crowdHtml, CARD } from "./frame.mjs";

const root = resolve(import.meta.dirname, "..");

const pills = {
  1: ["AI receptionist", "Speaks Saudi Arabic"],
  2: ["Step 1", "Pick a Saudi voice"],
  3: ["Step 2", "Write it in Arabic"],
  4: ["Step 3", "Take a real call"],
  5: ["Every call", "Answered"],
};

const crowds = {
  1: [[40, 96, 0, "l"], [150, 110, 1, "l"], [720, 100, 3, "r"], [840, 116, 4, "r"]],
  2: [], 3: [], 4: [], 5: [],
};

const card = {
  // 1 — a phone ringing, answered in Arabic
  1: `
    <div class="b1-phone" id="b1phone">
      <div class="b1-ring" id="b1ring"><i class="b1-ico"></i></div>
      <div class="b1-who">Al Noor Clinics</div>
      <div class="b1-say" id="b1say" dir="rtl">حيّاك الله في عيادات النور الطبية</div>
      <div class="b1-en" id="b1en">"Welcome to Al Noor Clinics, this is Layla."</div>
    </div>
    <div class="chip chip-orange b1-tag" id="b1tag">Under 2 minutes</div>
    ${crowdHtml(1, crowds[1])}
    ${bot({ id: "b1-yar", w: 150, x: 426, side: "c", yar: true, shirt: "#2B4C9B" })}`,
  // 2 — the real top bar: Sada, Layla, Arabic (Saudi Arabia)
  2: `
    <img class="shot b2-bar" id="b2bar" src="public/shots/topbar.png" alt="" />
    <div class="b2-voice" id="b2voice"><b>Layla</b><span>Warm Najdi delivery</span></div>
    <div class="chip chip-green b2-tag" id="b2tag">Sounds local</div>
    ${bot({ id: "b2-yar", w: 130, x: 40, side: "l", yar: true, shirt: "#2B4C9B" })}`,
  // 3 — the real Arabic prompt, and what it says
  3: `
    <img class="shot b3-prompt" id="b3prompt" src="public/shots/prompt.png" alt="" />
    <div class="b3-rules">
      <span class="rule" id="b3r1">Books the appointment</span>
      <span class="rule" id="b3r2">Name + mobile</span>
      <span class="rule no" id="b3r3">No medical advice</span>
    </div>`,
  // 4 — the real call transcript
  4: `
    <img class="shot b4-call" id="b4call" src="public/shots/transcript.png" alt="" />
    <div class="b4-stats">
      <div class="b4-stat" id="b4s1"><b>Booked</b><span>dentist, tomorrow</span></div>
      <div class="b4-stat" id="b4s2"><b>50s</b><span>the whole call</span></div>
      <div class="b4-stat" id="b4s3"><b>$0.06</b><span>what it cost</span></div>
    </div>`,
  // 5 — the close
  5: `
    <div class="b5-line" id="b5line"><span class="b5-a">Every call,</span><span class="b5-b">answered</span></div>
    <div class="chip chip-green b5-tag" id="b5tag">In Saudi Arabic</div>
    ${[0, 1, 2, 3, 4, 5, 6].map((j) => bot({ id: `b5-b${j}`, w: 84, x: 150 + j * 108, side: j < 4 ? "l" : "r", k: 14 + j, cls: "no-walk b5-crowd" })).join("")}
    ${bot({ id: "b5-yar", w: 130, x: 10, side: "c", yar: true, shirt: "#2B4C9B" })}`,
};

const css = `
      .shot { position: absolute; display: block; border-radius: 18px; border: 3px solid #1B1815; box-shadow: 0 16px 36px rgba(60,40,20,.18); background: #fff; }
      /* beat 1 — the phone */
      .b1-phone { position: absolute; left: 221px; top: 60px; width: 560px; padding: 34px 30px 36px; border-radius: 36px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 14px 34px rgba(60,40,20,.12); text-align: center; }
      .b1-ring { width: 120px; height: 120px; margin: 0 auto; border-radius: 50%; background: #2E9E5B; display: grid; place-items: center; }
      .b1-ico { width: 60px; height: 60px; background: #fff; -webkit-mask: url("public/logos/phone.svg") center/contain no-repeat; mask: url("public/logos/phone.svg") center/contain no-repeat; }
      .b1-who { margin-top: 18px; font-weight: 900; font-size: 40px; color: #1B1815; }
      .b1-say { margin-top: 18px; font-size: 40px; font-weight: 700; color: #1B1815; line-height: 1.35; }
      .b1-en { margin-top: 10px; font-size: 26px; font-weight: 600; color: #6B6257; font-style: italic; }
      .b1-tag { left: 50%; margin-left: -170px; top: 470px; width: 340px; text-align: center; }
      /* beat 2 — the bar and the voice */
      .b2-bar { left: 40px; top: 140px; width: 922px; }
      .b2-voice { position: absolute; left: 320px; top: 360px; width: 600px; padding: 30px 36px; border-radius: 28px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 14px 34px rgba(60,40,20,.12); }
      .b2-voice b { display: block; font-weight: 900; font-size: 72px; color: #1B1815; letter-spacing: -.02em; }
      .b2-voice span { display: block; margin-top: 6px; font-weight: 700; font-size: 30px; color: #6B6257; }
      .b2-tag { left: 480px; top: 600px; }
      /* beat 3 — the prompt */
      .b3-prompt { left: 121px; top: 125px; width: 760px; }
      .b3-rules { position: absolute; left: 40px; right: 40px; top: 668px; display: flex; gap: 14px; justify-content: center; }
      .rule { padding: 14px 24px; border-radius: 999px; background: #2E9E5B; color: #fff; font-weight: 900; font-size: 28px; white-space: nowrap; }
      .rule.no { background: #C63D2F; }
      /* beat 4 — the call */
      .b4-call { left: 60px; top: 125px; height: 640px; }
      .b4-stats { position: absolute; left: 440px; top: 190px; width: 480px; display: flex; flex-direction: column; gap: 22px; }
      .b4-stat { padding: 24px 30px; border-radius: 24px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 12px 28px rgba(60,40,20,.12); opacity: 0; }
      .b4-stat b { display: block; font-weight: 900; font-size: 64px; color: #2E9E5B; letter-spacing: -.02em; line-height: 1; }
      .b4-stat span { display: block; margin-top: 8px; font-weight: 700; font-size: 26px; color: #6B6257; text-transform: uppercase; letter-spacing: .06em; }
      /* beat 5 — the close */
      .b5-line { position: absolute; left: 0; top: 170px; width: ${CARD.w}px; text-align: center; display: flex; flex-direction: column; gap: 6px; }
      .b5-a { font-weight: 900; font-size: 92px; letter-spacing: -.03em; color: #1B1815; line-height: 1.05; }
      .b5-b { font-weight: 900; font-size: 110px; letter-spacing: -.03em; color: #2E9E5B; line-height: 1.05; }
      .b5-tag { left: 50%; margin-left: -185px; top: 470px; width: 370px; text-align: center; font-size: 34px; }
      .b1 { background: radial-gradient(90% 70% at 50% 45%, #FBF8F2 0%, #F3EEE4 100%); }
      .b2 { background: #F3EEE4; }
      .b3 { background: #FBFAF7; }
      .b4 { background: radial-gradient(90% 70% at 50% 45%, #FBF8F2 0%, #F3EEE4 100%); }
      .b5 { background: #FBFAF7; }
`;

const cues = (B, at) => ({
  b1_arabic: at(B[1], "arabic"), b1_two: at(B[1], "two"),
  b2_agent: at(B[2], "agent"), b2_layla: at(B[2], "layla"), b2_local: at(B[2], "local"),
  b3_book: at(B[3], "book"), b3_name: at(B[3], "name"), b3_never: at(B[3], "never"),
  b4_call: at(B[4], "call"), b4_booked: at(B[4], "booked"), b4_fifty: at(B[4], "fifty"), b4_six: at(B[4], "six"),
  b5_every: at(B[5], "every"),
  cta: +(at(B[5], "comment") - 0.1).toFixed(3),
});

const anim = `
      // ── beat 1: it rings, it answers in Arabic ──
      tl.fromTo("#b1phone", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: "power3.out" }, b1 + .05);
      tl.fromTo("#b1ring", { scale: 1 }, { scale: 1.12, duration: .18, yoyo: true, repeat: 5, ease: "sine.inOut" }, b1 + .3);
      tl.fromTo("#b1say", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .35 }, C.b1_arabic - .2);
      tl.fromTo("#b1en", { opacity: 0 }, { opacity: 1, duration: .3 }, C.b1_arabic + .2);
      pop("#b1tag", C.b1_two - .1, .45, { rotation: -18 });
      tl.to("#b1tag", { rotation: -5, duration: .25, ease: "power2.out" }, C.b1_two + .35);
      crowd(1).forEach((id, j) => jump(id, C.b1_two + .1 + j * .07, 74));
      walkIn("b1-yar", b1, dur(1), { from: .5, delay: .25 });

      // ── beat 2: the real bar, then the voice ──
      tl.fromTo("#b2bar", { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: "power3.out" }, C.b2_agent - .3);
      tl.fromTo("#b2voice", { scale: .8, opacity: 0 }, { scale: 1, opacity: 1, duration: .45, ease: "back.out(1.7)" }, C.b2_layla - .15);
      pop("#b2tag", C.b2_local - .1, .45); wiggle("#b2tag", C.b2_local + .4);
      walkIn("b2-yar", b2, dur(2), { from: .5, delay: .1 });
      jump("b2-yar", C.b2_layla + .2, 90);

      // ── beat 3: the Arabic prompt, and the three things it says ──
      tl.fromTo("#b3prompt", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: "power3.out" }, b3 + .05);
      tl.fromTo("#b3prompt", { scale: 1 }, { scale: 1.03, duration: 3, ease: "none" }, b3 + .5);
      pop("#b3r1", C.b3_book - .1, .4);
      pop("#b3r2", C.b3_name - .1, .4);
      pop("#b3r3", C.b3_never - .1, .4); wiggle("#b3r3", C.b3_never + .4);

      // ── beat 4: the real call, then what it came to ──
      tl.fromTo("#b4call", { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: .5, ease: "power3.out" }, C.b4_call - .2);
      tl.fromTo("#b4s1", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: .4, ease: "back.out(1.6)" }, C.b4_booked - .1);
      tl.fromTo("#b4s2", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: .4, ease: "back.out(1.6)" }, C.b4_fifty - .1);
      tl.fromTo("#b4s3", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: .4, ease: "back.out(1.6)" }, C.b4_six - .1);
      wiggle("#b4s3", C.b4_six + .4);

      // ── beat 5: the line, the tag, everybody jumps on the CTA ──
      tl.fromTo("#b5line .b5-a", { y: -18, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: "power3.out" }, b5 + .1);
      tl.fromTo("#b5line .b5-b", { scale: .7, opacity: 0 }, { scale: 1, opacity: 1, duration: .5, ease: "back.out(1.8)" }, C.b5_every + .2);
      pop("#b5tag", C.b5_every + .7, .45); wiggle("#b5tag", C.b5_every + 1.1);
      tl.fromTo("#b5-yar", { scale: 0, y: 40 }, { scale: 1, y: 0, duration: .5, ease: "power3.out" }, b5 + .1);
      jump("b5-yar", C.cta, 100);
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) =>
        walkIn(e.id, b5 + .2, dur(5) - .2, { from: .55 + (j % 3) * .1, delay: (j % 4) * .07 }));
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) => jump(e.id, C.cta + .15 + j * .05, 64));
`;

build(root, {
  pills, card, css, cues, anim,
  logo: "voho.svg", logo2: "phone.svg",
  sfx: ["pop", "click", "pop", "ping", "pop"],
  ctaHtml: `Comment <em>CLINIC</em> for the link`,
  handle: "@yarmalikhere",
  hold: 1.0,
});
