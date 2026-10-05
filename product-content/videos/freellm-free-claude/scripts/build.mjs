// Generate index.html from audio_meta.json. Beat durations are the real voice
// durations; every word-cued move is an absolute time from the synthesizer's
// word alignment. Re-run after re-recording:
//
//   node scripts/build.mjs
//
// Five beats: the bill at zero, where the tokens come from, the name and the
// minute it takes, the swap that keeps it going, the close. The shared frame
// (rail, pill, caption, bots, CTA) lives in frame.mjs; this file is the card.
import { resolve } from "node:path";
import { build, bot, crowdHtml, CARD } from "./frame.mjs";

const root = resolve(import.meta.dirname, "..");

const pills = {
  1: ["My bill: $0", "And it is not a trial"],
  2: ["7 billion tokens", "Every month, free"],
  3: ["FreeLLM API", "About a minute to wire in"],
  4: ["Hit a limit?", "It swaps for you"],
  5: ["Claude Code", "Stops running out"],
};

// crowd rows per beat: [x, width, k, side]
const crowds = {
  1: [[40, 96, 0, "l"], [150, 118, 1, "l"], [700, 104, 3, "r"], [830, 122, 4, "r"]],
  2: [[30, 100, 6, "l"], [880, 96, 7, "r"]],
  3: [[40, 104, 10, "l"], [870, 100, 11, "r"]],
  4: [],
  5: [],
};

const MODELS = ["ChatGPT", "Gemini", "Kimi", "Grok", "Qwen", "Mistral", "Llama", "+600 more"];

const card = {
  // 1 — the bill, crossed out and replaced by nothing
  1: `
    <div class="b1-bill" id="b1bill">
      <div class="b1-bill-top">Claude Code · this month</div>
      <div class="b1-was" id="b1was">$317</div>
      <div class="b1-rule" id="b1rule"></div>
      <div class="b1-now" id="b1now">$0</div>
    </div>
    <div class="chip chip-green b1-tag" id="b1tag">Not a trial</div>
    ${crowdHtml(1, crowds[1])}
    ${bot({ id: "b1-yar", w: 150, x: 426, side: "c", yar: true, shirt: "#DC5A2B" })}`,
  // 2 — where it comes from: a counter, then the models it covers
  2: `
    <div class="b2-num" id="b2num"><span id="b2count">0</span><i>B</i></div>
    <div class="b2-cap" id="b2cap">free tokens a month</div>
    <div class="b2-chips" id="b2chips">
      ${MODELS.map((m, i) => `<span class="modelchip" id="b2m${i}">${m}</span>`).join("")}
    </div>
    ${crowdHtml(2, crowds[2])}`,
  // 3 — the name, and the one line that does it
  3: `
    <div class="b3-name" id="b3name">FreeLLM API</div>
    <div class="term" id="b3term">
      <div class="term-bar"><i></i><b>terminal</b></div>
      <div class="term-line" id="b3l1">$ npx freellm login</div>
      <div class="term-line" id="b3l2">$ claude --model free/auto</div>
      <div class="term-ok" id="b3ok">✓ 600 models connected</div>
    </div>
    <div class="chip chip-orange b3-min" id="b3min">About a minute</div>
    ${crowdHtml(3, crowds[3])}`,
  // 4 — the swap, with the context riding across
  4: `
    <div class="b4-pair">
      <div class="b4-model" id="b4a"><span class="b4-lab">Model A</span>
        <div class="b4-gauge"><i id="b4fill"></i></div>
        <span class="b4-state" id="b4afull">limit</span></div>
      <div class="b4-arrow" id="b4arrow">→</div>
      <div class="b4-model" id="b4b"><span class="b4-lab">Model B</span>
        <div class="b4-gauge"></div>
        <span class="b4-state ok" id="b4bon">running</span></div>
    </div>
    <div class="b4-ctx" id="b4ctx">your context</div>
    ${bot({ id: "b4-yar", w: 130, x: 30, side: "l", yar: true, shirt: "#DC5A2B" })}
    ${bot({ id: "b4-dev", w: 130, x: 842, side: "r", k: 3, hat: "phones", mouth: "smile", cls: "no-walk" })}`,
  // 5 — the close
  5: `
    <div class="b5-line" id="b5line"><span class="b5-a">It just</span><span class="b5-b">never stops</span></div>
    <div class="chip chip-green b5-tag" id="b5tag">$0 a month</div>
    ${[0, 1, 2, 3, 4, 5, 6].map((j) => bot({ id: `b5-b${j}`, w: 84, x: 150 + j * 108, side: j < 4 ? "l" : "r", k: 14 + j, cls: "no-walk b5-crowd" })).join("")}
    ${bot({ id: "b5-yar", w: 130, x: 10, side: "c", yar: true, shirt: "#DC5A2B" })}`,
};

const css = `
      /* beat 1 — the bill */
      .b1-bill { position: absolute; left: 231px; top: 96px; width: 540px; border-radius: 28px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 14px 34px rgba(60,40,20,.12); padding: 30px 34px 34px; text-align: center; }
      .b1-bill-top { font-weight: 800; font-size: 24px; letter-spacing: .06em; text-transform: uppercase; color: #8A8172; }
      .b1-was { font-weight: 900; font-size: 96px; line-height: 1.1; color: #6B6257; margin-top: 10px; }
      /* Through the old number, not above the new one. The card's own box:
         30 padding + 29 of label + 10 margin puts $317 at 69..174, so the
         strike sits on its middle. */
      .b1-rule { position: absolute; left: 162px; top: 117px; width: 216px; height: 9px; border-radius: 5px; background: #C63D2F; transform-origin: 0 50%; }
      .b1-now { font-weight: 900; font-size: 190px; line-height: 1; letter-spacing: -.05em; color: #2E9E5B; margin-top: 4px; }
      /* In the gap between the bill and the bots. Under the card it landed in
         the row they walk along; on the card's corner the card clipped it,
         because the card hides its own overflow. The bill ends about 494 and
         Yar's head starts about 571, so it goes between them. */
      .b1-tag { left: 50%; margin-left: -170px; top: 508px; width: 340px; text-align: center; }

      /* beat 2 — the counter and the models */
      .b2-num { position: absolute; left: 0; top: 96px; width: ${CARD.w}px; text-align: center; font-weight: 900; font-size: 210px; line-height: 1; letter-spacing: -.05em; color: #DC5A2B; }
      .b2-num i { font-style: normal; font-size: 110px; }
      .b2-cap { position: absolute; left: 0; top: 330px; width: ${CARD.w}px; text-align: center; font-weight: 800; font-size: 34px; letter-spacing: .08em; text-transform: uppercase; color: #6B6257; }
      .b2-chips { position: absolute; left: 60px; top: 410px; width: 882px; display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; }
      .modelchip { padding: 13px 24px; border-radius: 999px; background: #FFFDF9; border: 3px solid #E4DCCE; font-weight: 800; font-size: 28px; color: #1B1815; opacity: 0; }

      /* beat 3 — the name and the terminal */
      .b3-name { position: absolute; left: 0; top: 86px; width: ${CARD.w}px; text-align: center; font-weight: 900; font-size: 76px; letter-spacing: -.03em; color: #1B1815; }
      .term { position: absolute; left: 130px; top: 210px; width: 742px; border-radius: 22px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 14px 34px rgba(60,40,20,.12); padding-bottom: 20px; font-family: ui-monospace, Menlo, monospace; }
      .term-bar { display: flex; align-items: center; gap: 12px; padding: 14px 22px; font-family: "Inter", sans-serif; font-size: 24px; font-weight: 900; border-bottom: 2px solid #EFE8DC; margin-bottom: 14px; }
      .term-bar i { width: 22px; height: 22px; border-radius: 6px; background: #DC5A2B; }
      .term-line { padding: 8px 24px; font-size: 30px; color: #1B1815; white-space: nowrap; opacity: 0; }
      .term-ok { padding: 10px 24px 0; font-size: 30px; font-weight: 700; color: #2E9E5B; opacity: 0; }
      .b3-min { left: 50%; margin-left: -150px; bottom: 44px; width: 300px; text-align: center; }

      /* beat 4 — the swap */
      .b4-pair { position: absolute; left: 60px; top: 150px; width: 882px; display: flex; align-items: center; justify-content: space-between; }
      .b4-model { width: 340px; height: 300px; border-radius: 26px; background: #FFFDF9; border: 3px solid #E4DCCE; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; }
      .b4-lab { font-weight: 900; font-size: 34px; letter-spacing: .04em; text-transform: uppercase; color: #1B1815; }
      .b4-gauge { width: 200px; height: 30px; border-radius: 15px; background: #EFE8DC; overflow: hidden; }
      .b4-gauge i { display: block; width: 0%; height: 100%; background: #C63D2F; }
      .b4-state { font-weight: 800; font-size: 26px; text-transform: uppercase; letter-spacing: .08em; color: #C63D2F; opacity: 0; }
      .b4-state.ok { color: #2E9E5B; }
      .b4-arrow { font-weight: 900; font-size: 84px; color: #DC5A2B; opacity: 0; }
      .b4-ctx { position: absolute; left: 180px; top: 500px; padding: 14px 30px; border-radius: 999px; background: #2E9E5B; color: #fff; font-weight: 900; font-size: 30px; text-transform: uppercase; letter-spacing: .04em; opacity: 0; }

      /* beat 5 — the close */
      .b5-line { position: absolute; left: 0; top: 180px; width: ${CARD.w}px; text-align: center; display: flex; flex-direction: column; gap: 6px; }
      .b5-a { font-weight: 900; font-size: 92px; letter-spacing: -.03em; color: #1B1815; line-height: 1.05; }
      .b5-b { font-weight: 900; font-size: 100px; letter-spacing: -.03em; color: #DC5A2B; line-height: 1.05; }
      .b5-tag { left: 50%; margin-left: -120px; top: 476px; width: 240px; text-align: center; font-size: 34px; }

      /* card grounds per beat */
      .b1 { background: radial-gradient(90% 70% at 50% 45%, #FBF8F2 0%, #F3EEE4 100%); }
      .b2 { background: #F3EEE4; }
      .b2::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(#D9D0BF 2.5px, transparent 2.5px); background-size: 44px 44px; opacity: .55; }
      .b3 { background: #FBFAF7; }
      .b4 { background: radial-gradient(90% 70% at 50% 45%, #FBF8F2 0%, #F3EEE4 100%); }
      .b5 { background: #FBFAF7; }
`;

const cues = (B, at) => ({
  b1_zero: at(B[1], "zero"), b1_trial: at(B[1], "trial"),
  b2_seven: at(B[2], "seven"), b2_chatgpt: at(B[2], "chatgpt"), b2_six: at(B[2], "six"),
  b3_called: at(B[3], "called"), b3_minute: at(B[3], "minute"),
  b4_limit: at(B[4], "limit"), b4_swaps: at(B[4], "swaps"), b4_carries: at(B[4], "carries"),
  b5_stops: at(B[5], "stops"),
  cta: +(at(B[5], "comment") - 0.1).toFixed(3),
});

const anim = `
      // ── beat 1: the old number gets struck through, zero lands ──
      tl.fromTo("#b1bill", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: "power3.out" }, b1 + .05);
      tl.fromTo("#b1rule", { scaleX: 0 }, { scaleX: 1, duration: .35, ease: "power2.out" }, C.b1_zero - .5);
      tl.fromTo("#b1now", { scale: .4, opacity: 0 }, { scale: 1, opacity: 1, duration: .5, ease: "back.out(2)" }, C.b1_zero - .1);
      tl.fromTo("#b1was", { opacity: 1 }, { opacity: .45, duration: .3 }, C.b1_zero - .1);
      pop("#b1tag", C.b1_trial - .1, .45, { rotation: -22 });
      tl.to("#b1tag", { rotation: -6, duration: .25, ease: "power2.out" }, C.b1_trial + .35);
      crowd(1).forEach((id, j) => jump(id, C.b1_zero + .1 + j * .07, 74));
      walkIn("b1-yar", b1, dur(1), { from: .5, delay: .25 });
      jump("b1-yar", C.b1_trial, 110);

      // ── beat 2: seven billion counts up, then the models land ──
      { const o = { v: 0 };
        tl.fromTo("#b2num", { scale: .8, opacity: 0 }, { scale: 1, opacity: 1, duration: .4, ease: "back.out(1.6)" }, C.b2_seven - .3);
        tl.to(o, { v: 7, duration: .9, ease: "power2.out",
          onUpdate: () => { const e = document.getElementById("b2count"); if (e) e.textContent = String(Math.round(o.v)); } }, C.b2_seven - .25);
        tl.fromTo("#b2cap", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .3 }, C.b2_seven + .5); }
      ${MODELS.map((_, i) => `tl.fromTo("#b2m${i}", { y: 26, opacity: 0, scale: .9 }, { y: 0, opacity: 1, scale: 1, duration: .3, ease: "back.out(1.7)" }, C.b2_chatgpt - .1 + ${(i * 0.13).toFixed(2)});`).join("\n      ")}
      tl.fromTo("#b2m${MODELS.length - 1}", { rotation: -4 }, { rotation: 4, duration: .16, yoyo: true, repeat: 3, ease: "sine.inOut" }, C.b2_six + .2);
      crowd(2).forEach((id, j) => jump(id, C.b2_six + .1 + j * .08, 70));

      // ── beat 3: the name, then the two lines that do it ──
      tl.fromTo("#b3name", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: "power3.out" }, C.b3_called - .15);
      tl.fromTo("#b3term", { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: "power3.out" }, C.b3_called + .15);
      tl.fromTo("#b3l1", { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: .28, ease: "power3.out" }, C.b3_called + .5);
      tl.fromTo("#b3l2", { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: .28, ease: "power3.out" }, C.b3_called + .9);
      tl.fromTo("#b3ok", { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: .32, ease: "back.out(1.8)" }, C.b3_minute - .2);
      pop("#b3min", C.b3_minute, .45); wiggle("#b3min", C.b3_minute + .45);
      crowd(3).forEach((id, j) => jump(id, C.b3_minute + .15 + j * .08, 70));

      // ── beat 4: one fills up, the other takes it, the context rides over ──
      tl.fromTo("#b4a", { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: .4, ease: "power3.out" }, b4 + .05);
      tl.fromTo("#b4b", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: .4, ease: "power3.out" }, b4 + .15);
      tl.to("#b4fill", { width: "100%", duration: 1.1, ease: "power1.in" }, b4 + .4);
      tl.to("#b4afull", { opacity: 1, duration: .25 }, C.b4_limit);
      tl.fromTo("#b4a", { rotation: 0 }, { rotation: 1.5, duration: .1, yoyo: true, repeat: 3, ease: "sine.inOut" }, C.b4_limit);
      pop("#b4arrow", C.b4_swaps - .1, .4);
      tl.to("#b4bon", { opacity: 1, duration: .25 }, C.b4_swaps + .25);
      tl.fromTo("#b4ctx", { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: .3, ease: "back.out(2)" }, C.b4_carries - .2);
      tl.to("#b4ctx", { x: 560, duration: .8, ease: "power2.inOut" }, C.b4_carries + .1);
      walkIn("b4-yar", b4, dur(4), { from: .5, delay: .1 });
      walkIn("b4-dev", b4, dur(4), { from: .5, delay: .2 });
      jump("b4-dev", C.b4_carries + .6, 90);

      // ── beat 5: the line, the tag, and everybody jumps on the CTA ──
      tl.fromTo("#b5line .b5-a", { y: -18, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: "power3.out" }, b5 + .1);
      tl.fromTo("#b5line .b5-b", { scale: .7, opacity: 0 }, { scale: 1, opacity: 1, duration: .5, ease: "back.out(1.8)" }, C.b5_stops - .15);
      pop("#b5tag", C.b5_stops + .35, .45); wiggle("#b5tag", C.b5_stops + .8);
      tl.fromTo("#b5-yar", { scale: 0, y: 40 }, { scale: 1, y: 0, duration: .5, ease: "power3.out" }, b5 + .1);
      jump("b5-yar", C.cta, 100);
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) =>
        walkIn(e.id, b5 + .2, dur(5) - .2, { from: .55 + (j % 3) * .1, delay: (j % 4) * .07 }));
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) => jump(e.id, C.cta + .15 + j * .05, 64));
`;

build(root, {
  pills, card, css, cues, anim,
  logo: "claude.svg", logo2: "dollar.svg",
  sfx: ["pop", "impact-bass-1", "click", "ping", "pop"],
  ctaHtml: `Comment <em>FREE</em> for the setup`,
  handle: "@yarmalikhere",
  hold: 1.0,
});
