// Generate index.html from audio_meta.json. Beat durations are the real voice
// durations; every word-cued move is an absolute time from the synthesizer's
// word alignment. Re-run after re-recording:
//
//   node scripts/build.mjs
//
// Five beats: the price gap, three tutorial steps, the close. The shared frame
// (rail, pill, caption, bots, CTA) lives in frame.mjs; this file is the card.
import { resolve } from "node:path";
import { build, bot, crowdHtml, CARD } from "./frame.mjs";

const root = resolve(import.meta.dirname, "..");

const pills = {
  1: ["$1 to make", "$300 to sell"],
  2: ["Step 1 · Screenshot", "Their best dish"],
  3: ["Step 2 · Seedance", "Slow push in · steam"],
  4: ["Step 3 · DM the owner", "Free · want 3 more?"],
  5: ["One yes", "Pays your month"],
};

// crowd rows per beat: [x, width, k, side]
const crowds = {
  1: [[40, 96, 0, "l"], [150, 118, 1, "l"], [700, 104, 3, "r"], [830, 122, 4, "r"]],
  2: [[40, 104, 6, "l"], [860, 100, 7, "r"]],
  3: [[30, 108, 10, "l"], [880, 96, 11, "r"]],
  4: [],
  5: [],
};

// the dish, drawn once and reused: the post, the generated clip, the DM thumb
const dish = (cls = "") => `<div class="dish ${cls}"><span class="dish-emoji">🍜</span></div>`;

const card = {
  // 1 — what it costs you against what they pay
  1: `
    <div class="b1-side b1-l" id="b1l"><div class="b1-num">$1</div><div class="b1-lab">to make</div><div class="b1-tag b1-tag-l">10s AI video</div></div>
    <div class="b1-arrow" id="b1arrow">→</div>
    <div class="b1-side b1-r" id="b1r"><div class="b1-num b1-num-big">$300</div><div class="b1-lab">they pay</div><div class="b1-tag b1-tag-r">the restaurant</div></div>
    ${crowdHtml(1, crowds[1])}
    ${bot({ id: "b1-yar", w: 150, x: 426, side: "c", yar: true, shirt: "#DC5A2B" })}`,
  // 2 — their own Instagram post, screenshotted
  2: `
    <div class="ig" id="ig">
      <div class="ig-head"><i class="ig-av"></i><b>thecornerbistro</b><span>· Follow</span></div>
      ${dish("ig-photo")}
      <div class="ig-foot"><span>♥ 212</span><span>💬 14</span><span>➤</span></div>
    </div>
    <div class="shot-corner tl" id="sc1"></div><div class="shot-corner tr" id="sc2"></div><div class="shot-corner bl" id="sc3"></div><div class="shot-corner br" id="sc4"></div>
    <div class="flash" id="flash"></div>
    <div class="chip chip-green b2-chip" id="b2chip">Their own photo</div>
    ${crowdHtml(2, crowds[2])}`,
  // 3 — the prompt, then the ten-second clip
  3: `
    <div class="sd" id="sd">
      <div class="sd-bar"><i></i><b>Seedance</b><span>image → video · 10s</span></div>
      <div class="sd-prompt"><span class="sd-typed" id="sdtyped"></span><i class="sd-caret"></i></div>
      <div class="sd-out" id="sdout">
        ${dish("sd-clip")}
        <div class="steam"><i></i><i></i><i></i></div>
        <div class="sd-ready" id="sdready" data-layout-allow-overlap>10s ad ready ✓</div>
      </div>
      <div class="sd-prog"><i id="sdprog"></i></div>
    </div>
    ${crowdHtml(3, crowds[3])}`,
  // 4 — the DM
  4: `
    <div class="dm" id="dm">
      <div class="dm-head"><i class="ig-av"></i><b>thecornerbistro</b></div>
      <div class="bub out" id="bub1">${dish("dm-thumb")}<span>Made this for you, on the house 🎬</span></div>
      <div class="bub out" id="bub2">Want three more?</div>
      <div class="bub in" id="bub3">YES 🙌 how much for 3?</div>
    </div>
    <div class="chip chip-orange b4-free" id="b4free">Free</div>
    ${bot({ id: "b4-yar", w: 130, x: 30, side: "l", yar: true, shirt: "#DC5A2B" })}
    ${bot({ id: "b4-owner", w: 130, x: 842, side: "r", k: 2, hat: "cap", mouth: "smile", cls: "no-walk" })}`,
  // 5 — ten owners, one yes
  5: `
    <div class="b5-line" id="b5line"><span class="b5-one">1 yes</span><span class="b5-eq">=</span><span class="b5-month">your month</span></div>
    <div class="chip chip-green b5-300" id="b5-300">$300</div>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((j) => bot({ id: `b5-own${j}`, w: 86, x: 150 + j * 106, side: j < 4 ? "l" : "r", k: 12 + j, cls: j === 3 ? "b5-yes" : "" })).join("")}
    ${bot({ id: "b5-yar", w: 130, x: 10, side: "c", yar: true, shirt: "#DC5A2B" })}`,
};

const css = `
      /* beat 1 — $1 against $300 */
      .b1-side { position: absolute; top: 120px; width: 400px; height: 340px; border-radius: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: #FFFDF9; border: 3px solid #E4DCCE; }
      .b1-l { left: 54px; } .b1-r { right: 54px; border-color: #DC5A2B; box-shadow: 0 0 0 6px rgba(220, 90, 43, .14); }
      .b1-num { font-weight: 900; font-size: 140px; line-height: 1; letter-spacing: -.05em; color: #1B1815; }
      .b1-num-big { color: #DC5A2B; font-size: 124px; }
      .b1-lab { font-weight: 800; font-size: 34px; text-transform: uppercase; letter-spacing: .1em; color: #6B6257; }
      .b1-tag { position: absolute; bottom: -22px; padding: 8px 18px; border-radius: 999px; font-weight: 800; font-size: 22px; text-transform: uppercase; letter-spacing: .04em; background: #1B1815; color: #fff; }
      .b1-tag-r { background: #DC5A2B; }
      .b1-arrow { position: absolute; left: 0; top: 240px; width: ${CARD.w}px; text-align: center; font-weight: 900; font-size: 120px; line-height: 1; color: #DC5A2B; }

      /* beat 2 — the Instagram post */
      .ig { position: absolute; left: 261px; top: 110px; width: 480px; border-radius: 26px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 14px 34px rgba(60, 40, 20, .12); overflow: hidden; }
      .ig-head, .dm-head { display: flex; align-items: center; gap: 12px; padding: 16px 20px; font-size: 24px; font-weight: 800; }
      .ig-head span { color: #3B82F6; font-weight: 700; }
      .ig-av { width: 40px; height: 40px; border-radius: 50%; background: conic-gradient(#F5C542, #DC5A2B, #F07A6A, #F5C542); flex: none; }
      .dish { display: grid; place-items: center; background: radial-gradient(circle at 50% 60%, #F7DFB8 0%, #E8B678 55%, #C98A4B 100%); }
      .dish-emoji { font-size: 220px; line-height: 1; filter: drop-shadow(0 12px 18px rgba(80, 40, 0, .3)); }
      .ig-photo { width: 474px; height: 340px; }
      .ig-foot { display: flex; gap: 22px; padding: 16px 20px; font-size: 24px; font-weight: 700; color: #1B1815; }
      .shot-corner { position: absolute; width: 60px; height: 60px; border: 8px solid #DC5A2B; }
      .shot-corner.tl { left: 236px; top: 86px; border-right: 0; border-bottom: 0; border-radius: 16px 0 0 0; }
      .shot-corner.tr { right: 236px; top: 86px; border-left: 0; border-bottom: 0; border-radius: 0 16px 0 0; }
      .shot-corner.bl { left: 236px; top: 540px; border-right: 0; border-top: 0; border-radius: 0 0 0 16px; }
      .shot-corner.br { right: 236px; top: 540px; border-left: 0; border-top: 0; border-radius: 0 0 16px 0; }
      .flash { position: absolute; inset: 0; background: #fff; opacity: 0; }
      .b2-chip { left: 50%; margin-left: -170px; bottom: 44px; width: 340px; text-align: center; }

      /* beat 3 — Seedance */
      .sd { position: absolute; left: 141px; top: 110px; width: 720px; height: 560px; border-radius: 26px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 14px 34px rgba(60, 40, 20, .12); overflow: hidden; }
      .sd-bar { display: flex; align-items: center; gap: 12px; padding: 14px 22px; font-size: 24px; font-weight: 900; border-bottom: 2px solid #EFE8DC; }
      .sd-bar i { width: 22px; height: 22px; border-radius: 6px; background: linear-gradient(135deg, #DC5A2B, #F5C542); }
      .sd-bar span { margin-left: auto; font-weight: 700; color: #8A8172; }
      .sd-prompt { margin: 20px 22px 0; min-height: 96px; padding: 16px 20px; border-radius: 16px; background: #F3EEE4; font-family: ui-monospace, Menlo, monospace; font-size: 30px; line-height: 1.35; color: #1B1815; }
      .sd-caret { display: inline-block; width: 4px; height: 32px; margin-left: 4px; vertical-align: -6px; background: #DC5A2B; }
      .sd-out { position: absolute; left: 22px; top: 190px; width: 670px; height: 290px; border-radius: 18px; overflow: hidden; }
      .sd-clip { position: absolute; inset: 0; transform-origin: 50% 60%; }
      .sd-clip .dish-emoji { font-size: 200px; }
      .steam { position: absolute; left: 50%; top: 20px; width: 0; height: 0; }
      .steam i { position: absolute; bottom: 0; width: 14px; height: 70px; border-radius: 10px; background: rgba(255,255,255,.75); filter: blur(4px); opacity: 0; }
      .steam i:nth-child(1) { left: -70px; } .steam i:nth-child(2) { left: -8px; } .steam i:nth-child(3) { left: 54px; }
      .sd-ready { position: absolute; left: 50%; bottom: 18px; margin-left: -150px; width: 300px; text-align: center; padding: 10px 0; border-radius: 999px; background: #2E9E5B; color: #fff; font-weight: 900; font-size: 26px; text-transform: uppercase; transform-origin: 50% 50%; }
      .sd-prog { position: absolute; left: 22px; bottom: 26px; width: 670px; height: 14px; border-radius: 7px; background: #EFE8DC; overflow: hidden; }
      .sd-prog i { display: block; width: 100%; height: 100%; background: #DC5A2B; transform-origin: 0 50%; }

      /* beat 4 — the DM */
      .dm { position: absolute; left: 191px; top: 110px; width: 620px; border-radius: 26px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 14px 34px rgba(60, 40, 20, .12); padding-bottom: 20px; }
      .dm-head { border-bottom: 2px solid #EFE8DC; margin-bottom: 14px; }
      .bub { margin: 12px 20px 0; max-width: 470px; padding: 16px 22px; border-radius: 24px; font-size: 28px; font-weight: 700; line-height: 1.25; transform-origin: 100% 100%; display: flex; flex-direction: column; gap: 10px; }
      .bub.out { margin-left: auto; background: #DC5A2B; color: #fff; border-bottom-right-radius: 6px; }
      .bub.in { background: #F3EEE4; color: #1B1815; border-bottom-left-radius: 6px; transform-origin: 0 100%; }
      .dm-thumb { width: 200px; height: 120px; border-radius: 14px; }
      .dm-thumb .dish-emoji { font-size: 80px; }
      .b4-free { left: 690px; top: 96px; width: 140px; text-align: center; z-index: 4; }

      /* beat 5 — ten owners, one yes */
      .b5-line { position: absolute; left: 0; top: 180px; width: ${CARD.w}px; text-align: center; display: flex; justify-content: center; align-items: baseline; gap: 22px; }
      .b5-one { font-weight: 900; font-size: 120px; letter-spacing: -.04em; color: #2E9E5B; line-height: 1; }
      .b5-eq { font-weight: 900; font-size: 90px; color: #1B1815; line-height: 1; }
      .b5-month { font-weight: 900; font-size: 92px; letter-spacing: -.03em; color: #DC5A2B; line-height: 1; }
      .b5-300 { left: 431px; top: 500px; width: 160px; text-align: center; font-size: 36px; }
      .b5 .bot { z-index: 2; }

      /* card grounds per beat */
      .b1 { background: radial-gradient(90% 70% at 50% 45%, #FBF8F2 0%, #F3EEE4 100%); }
      .b2 { background: #F3EEE4; }
      .b2::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(#D9D0BF 2.5px, transparent 2.5px); background-size: 44px 44px; opacity: .55; }
      .b3 { background: #FBFAF7; }
      .b4 { background: radial-gradient(90% 70% at 50% 45%, #FBF8F2 0%, #F3EEE4 100%); }
      .b5 { background: #FBFAF7; }
`;

const cues = (B, at) => ({
  b1_dollar: at(B[1], "dollar"), b1_restaurant: at(B[1], "restaurant"), b1_three: at(B[1], "three"), b1_hundred: at(B[1], "hundred"),
  b2_screenshot: at(B[2], "screenshot"), b2_dish: at(B[2], "dish"), b2_own: at(B[2], "own"),
  b3_seedance: at(B[3], "seedance"), b3_slow: at(B[3], "slow"), b3_steam: at(B[3], "steam"), b3_rising: at(B[3], "rising"),
  b4_send: at(B[4], "send"), b4_free: at(B[4], "free"), b4_three: at(B[4], "three"), b4_more: at(B[4], "more"),
  b5_yes: at(B[5], "yes"), b5_pays: at(B[5], "pays"), b5_month: at(B[5], "month"),
  cta: +(at(B[5], "comment") - 0.1).toFixed(3),
});

const anim = `
      // ── beat 1: the dollar lands, then the three hundred, bigger ──
      tl.fromTo("#b1l", { x: -520, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, C.b1_dollar - 0.2);
      tl.fromTo("#b1l .b1-num", { scale: 0.6 }, { scale: 1, duration: 0.4, ease: "back.out(2)" }, C.b1_dollar);
      pop("#b1arrow", C.b1_restaurant, 0.4);
      tl.fromTo("#b1r", { x: 520, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, C.b1_three - 0.25);
      tl.fromTo("#b1r .b1-num", { scale: 0.5 }, { scale: 1.12, duration: 0.45, ease: "back.out(2.5)" }, C.b1_three);
      tl.to("#b1r .b1-num", { scale: 1, duration: 0.3, ease: "power2.out" }, C.b1_hundred + 0.3);
      tl.fromTo("#b1r", { rotation: 0 }, { rotation: 2, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" }, C.b1_hundred);
      crowd(1).forEach((id, j) => jump(id, C.b1_hundred + 0.05 + j * 0.07, 70));
      walkIn("b1-yar", b1, dur(1), { from: 0.5, delay: 0.3 });
      jump("b1-yar", C.b1_three, 110);

      // ── beat 2: the post is there, then the screenshot flash and crop corners ──
      tl.fromTo("#ig", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b2 + 0.05);
      tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.9, duration: 0.08, yoyo: true, repeat: 1, ease: "none" }, C.b2_screenshot + 0.15);
      ["#sc1", "#sc2", "#sc3", "#sc4"].forEach((s, j) => tl.fromTo(s, { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "power3.out" }, C.b2_screenshot + 0.2 + j * 0.03));
      tl.fromTo("#ig .dish-emoji", { scale: 1 }, { scale: 1.12, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" }, C.b2_dish);
      pop("#b2chip", C.b2_own, 0.45); wiggle("#b2chip", C.b2_own + 0.45);
      crowd(2).forEach((id, j) => jump(id, C.b2_own + 0.1 + j * 0.08, 70));

      // ── beat 3: the prompt types itself, the clip pushes in, steam rises ──
      tl.fromTo("#sd", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b3 + 0.05);
      tl.fromTo("#sd .sd-caret", { opacity: 1 }, { opacity: 0, duration: 0.4, yoyo: true, repeat: reps(dur(3), 0.4), ease: "steps(1)" }, b3);
      type("#sdtyped", "slow push in, steam rising", C.b3_slow - 0.1, Math.max(0.8, C.b3_rising - C.b3_slow + 0.3));
      tl.fromTo("#sdout", { opacity: 0 }, { opacity: 1, duration: 0.3 }, C.b3_seedance);
      tl.fromTo("#sd .sd-clip", { scale: 1 }, { scale: 1.28, duration: dur(3) - (C.b3_slow - b3), ease: "none" }, C.b3_slow);
      tl.fromTo("#sdprog", { scaleX: 0 }, { scaleX: 1, duration: C.b3_rising - C.b3_seedance + 0.6, ease: "power1.inOut" }, C.b3_seedance);
      document.querySelectorAll("#sd .steam i").forEach((s, j) => {
        const t0 = C.b3_steam + j * 0.18, cyc = 1.1, span = D.beats[2].end - t0;
        tl.fromTo(s, { y: 40, opacity: 0, scaleX: 1 }, { y: -120, opacity: 0.9, scaleX: 1.6, duration: cyc, ease: "sine.out", repeat: reps(span, cyc) }, t0);
      });
      const readyAt = Math.min(C.b3_rising + 0.3, D.beats[2].end - 1.0);
      pop("#sdready", readyAt, 0.45); wiggle("#sdready", readyAt + 0.45);
      crowd(3).forEach((id, j) => jump(id, readyAt + j * 0.08, 70));

      // ── beat 4: two bubbles out, the FREE stamp, one bubble back ──
      tl.fromTo("#dm", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b4 + 0.05);
      tl.set("#bub1, #bub2, #bub3", { scale: 0 }, b4);
      pop("#bub1", C.b4_send + 0.1, 0.45);
      pop("#b4free", C.b4_free, 0.4, { rotation: -12 }); tl.to("#b4free", { rotation: -12, duration: 0.2 }, C.b4_free + 0.4);
      pop("#bub2", C.b4_three - 0.1, 0.45);
      pop("#bub3", Math.min(C.b4_three + 0.4, D.beats[3].end - 0.9), 0.5);
      walkIn("b4-yar", b4, dur(4), { from: 0.5, delay: 0.1 });
      pointUp("b4-yar", C.b4_send + 0.1, "r");
      walkIn("b4-owner", b4, dur(4), { from: 0.5, delay: 0.2 });
      jump("b4-owner", Math.min(C.b4_three + 0.5, D.beats[3].end - 0.8), 100);
      jump("b4-yar", Math.min(C.b4_three + 0.65, D.beats[3].end - 0.7), 90);

      // ── beat 5: nine owners on the floor, one says yes, the line lands ──
      tl.fromTo("#b5line .b5-one", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.8)" }, C.b5_yes - 0.05);
      tl.fromTo("#b5line .b5-eq", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, C.b5_pays);
      tl.fromTo("#b5line .b5-month", { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, C.b5_month - 0.1);
      const yesBot = document.querySelector("#beat-5 .b5-yes");
      tl.to(yesBot.querySelector(".bot-head"), { backgroundColor: "#2E9E5B", duration: 0.2 }, C.b5_yes);
      tl.to(yesBot.querySelector(".bot-body"), { backgroundColor: "#2E9E5B", duration: 0.2 }, C.b5_yes);
      jump(yesBot.id, C.b5_yes, 120);
      pop("#b5-300", C.b5_yes + 0.2, 0.45); wiggle("#b5-300", C.b5_yes + 0.65);
      tl.fromTo("#b5-yar", { scale: 0, y: 40 }, { scale: 1, y: 0, duration: 0.5, ease: "power3.out" }, b5 + 0.1);
      jump("b5-yar", C.b5_month, 100);
      crowd(5).forEach((id, j) => { if (id !== yesBot.id) jump(id, C.cta + 0.2 + j * 0.05, 60); });
`;

build(root, {
  pills, card, css, cues, anim,
  logo: "play.svg", logo2: "dollar.svg",
  sfx: ["pop", "impact-bass-1", "ping", "pop", "click"],
  ctaHtml: `Comment <em>VIDEO</em> for the prompt`,
  handle: "@yarmalikhere",
  hold: 1.0,
});
