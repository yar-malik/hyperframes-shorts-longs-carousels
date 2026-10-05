// Generate index.html from audio_meta.json. Beat durations are the real voice
// durations; every word-cued move is an absolute time from the synthesizer's
// word alignment. Re-run after re-recording:
//
//   node scripts/build.mjs
//
// Five beats: app vs spreadsheet, three tutorial steps, the close. The shared
// frame (rail, pill, caption, bots, CTA) lives in frame.mjs; this is the card.
import { resolve } from "node:path";
import { build, bot, crowdHtml, CARD } from "./frame.mjs";

const root = resolve(import.meta.dirname, "..");

const pills = {
  1: ["Not another AI app", "Replace a spreadsheet"],
  2: ["Step 1 · Ask an owner", "The by-hand spreadsheet"],
  3: ["Step 2 · Claude Code", "Describe it in English"],
  4: ["Step 3 · Login + Stripe", "Charge for it tonight"],
  5: ["One owner", "Then the whole industry"],
};

// crowd rows per beat: [x, width, k, side]
const crowds = {
  1: [[40, 96, 0, "l"], [150, 118, 1, "l"], [700, 104, 3, "r"], [830, 122, 4, "r"]],
  2: [],
  3: [[880, 96, 11, "r"]],
  4: [[30, 108, 10, "l"], [880, 96, 7, "r"]],
  5: [],
};

// the spreadsheet: a header row and five rows the owner fills in by hand
const COLS = ["Client", "Job", "Due", "Paid"];
const ROWS = [["Baker & Co", "Rewire", "Mon", "yes"], ["M. Silva", "Boiler", "Tue", ""], ["Northside", "Quote", "Wed", "no"], ["J. Okafor", "Install", "Fri", ""], ["Greenway", "Repair", "Sat", "yes"]];
const sheetHtml = `
    <div class="sheet" id="sheet">
      <div class="sheet-bar"><i></i><b>jobs-2026.xlsx</b><span>edited by hand</span></div>
      <div class="sheet-grid">
        ${COLS.map((c) => `<div class="cell head">${c}</div>`).join("")}
        ${ROWS.map((r, i) => r.map((v, j) => `<div class="cell" id="cell-${i}-${j}"><span>${v}</span></div>`).join("")).join("")}
      </div>
      <div class="pen" id="pen" data-layout-allow-overlap>✍️</div>
    </div>`;

const card = {
  // 1 — the thing nobody buys against the thing they will pay to lose
  1: `
    <div class="b1-side b1-l" id="b1l"><div class="b1-ico">📱</div><div class="b1-lab">another AI app</div><div class="b1-x" id="b1x">✕</div></div>
    <div class="b1-side b1-r" id="b1r"><div class="b1-ico">📊</div><div class="b1-lab">their spreadsheet</div><div class="b1-ok" id="b1ok">✓</div></div>
    <div class="chip chip-green b1-pay" id="b1pay">They will pay for this</div>
    ${crowdHtml(1, crowds[1])}
    ${bot({ id: "b1-yar", w: 150, x: 426, side: "c", yar: true, shirt: "#DC5A2B" })}`,
  // 2 — the spreadsheet, filled in by hand
  2: `
    ${sheetHtml}
    <div class="chip chip-red b2-chip" id="b2chip">By hand · every week</div>
    ${bot({ id: "b2-owner", w: 130, x: 842, side: "r", k: 5, hat: "hard", mouth: "o", cls: "no-walk" })}`,
  // 3 — Claude Code, in plain English
  3: `
    <div class="term" id="term">
      <div class="term-bar"><i class="term-glyph"></i><b>Claude Code</b><span>~/jobs-app</span></div>
      <div class="term-line prompt" id="tl1"><b>›</b> Replace this spreadsheet with an app.</div>
      <div class="term-line" id="tl2">Columns: client, job, due date, paid.</div>
      <div class="term-line" id="tl3">The owner adds a job from his phone.</div>
      <div class="term-line" id="tl4">Text him when a job is overdue.</div>
      <div class="term-line ok" id="tl5">✔ Building… 14 files</div>
    </div>
    <div class="chip chip-orange b3-chip" id="b3chip">Plain English</div>
    ${bot({ id: "b3-yar", w: 130, x: 30, side: "l", yar: true, shirt: "#DC5A2B" })}
    ${crowdHtml(3, crowds[3])}`,
  // 4 — login and a checkout
  4: `
    <div class="pay" id="pay">
      <div class="pay-title">jobs-app.com</div>
      <div class="pay-row" id="pay-login"><span class="pay-lab">Email</span><span class="pay-field">owner@bakerandco.com</span></div>
      <div class="pay-row" id="pay-pass"><span class="pay-lab">Password</span><span class="pay-field">••••••••••</span></div>
      <div class="pay-price" id="pay-price">$49 <small>/ month</small></div>
      <div class="pay-btn" id="pay-btn"><span id="pay-btn-text">Pay with Stripe</span></div>
    </div>
    <div class="chip chip-green b4-chip" id="b4chip">Tonight</div>
    ${crowdHtml(4, crowds[4])}`,
  // 5 — one owner, then the whole industry
  5: `
    <div class="b5-line" id="b5line"><span class="b5-one">1 owner</span><span class="b5-arrow">→</span><span class="b5-all">the industry</span></div>
    ${bot({ id: "b5-first", w: 120, x: 441, side: "c", k: 5, hat: "hard", mouth: "smile", cls: "no-walk" })}
    ${[0, 1, 2, 3].map((j) => bot({ id: `b5-l${j}`, w: 74, x: 140 + j * 78, side: "l", k: 20 + j, cls: "no-walk b5-crowd" })).join("")}
    ${[0, 1, 2, 3].map((j) => bot({ id: `b5-r${j}`, w: 74, x: 578 + j * 78, side: "r", k: 24 + j, cls: "no-walk b5-crowd" })).join("")}
    ${bot({ id: "b5-yar", w: 120, x: 10, side: "c", yar: true, shirt: "#DC5A2B" })}`,
};

const css = `
      /* beat 1 — app vs spreadsheet */
      .b1-side { position: absolute; top: 116px; width: 400px; height: 316px; border-radius: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: #FFFDF9; border: 3px solid #E4DCCE; }
      .b1-l { left: 54px; } .b1-r { right: 54px; border-color: #2E9E5B; box-shadow: 0 0 0 6px rgba(46, 158, 91, .14); }
      .b1-ico { font-size: 140px; line-height: 1; }
      .b1-lab { font-weight: 900; font-size: 34px; text-transform: uppercase; letter-spacing: .03em; color: #1B1815; text-align: center; }
      .b1-x, .b1-ok { position: absolute; top: -26px; right: -26px; width: 84px; height: 84px; border-radius: 50%; display: grid; place-items: center; font-weight: 900; font-size: 50px; color: #fff; }
      .b1-x { background: #C63D2F; } .b1-ok { background: #2E9E5B; }
      .b1-pay { left: 50%; margin-left: -230px; top: 448px; width: 460px; text-align: center; }

      /* beat 2 — the spreadsheet */
      .sheet { position: absolute; left: 60px; top: 110px; width: 740px; border-radius: 22px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 14px 34px rgba(60, 40, 20, .12); overflow: hidden; }
      .sheet-bar { display: flex; align-items: center; gap: 12px; padding: 14px 20px; font-size: 24px; font-weight: 900; border-bottom: 2px solid #EFE8DC; }
      .sheet-bar i { width: 22px; height: 22px; border-radius: 5px; background: #2E9E5B; }
      .sheet-bar span { margin-left: auto; font-weight: 700; color: #8A8172; }
      .sheet-grid { display: grid; grid-template-columns: 1.4fr 1.1fr .8fr .8fr; }
      .cell { height: 66px; padding: 0 18px; display: flex; align-items: center; font-size: 26px; font-weight: 700; color: #1B1815; border-right: 1px solid #EFE8DC; border-bottom: 1px solid #EFE8DC; overflow: hidden; white-space: nowrap; }
      .cell.head { background: #E6F2EA; color: #1F6B3E; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; font-size: 22px; }
      .cell span { opacity: 0; display: inline-block; }
      .pen { position: absolute; left: 30px; top: 96px; font-size: 54px; line-height: 1; filter: drop-shadow(0 6px 8px rgba(60,40,20,.3)); z-index: 3; }
      .b2-chip { left: 60px; top: 560px; width: 420px; text-align: center; }

      /* beat 3 — Claude Code */
      .term { position: absolute; left: 180px; top: 110px; width: 690px; border-radius: 22px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 14px 34px rgba(60, 40, 20, .12); padding-bottom: 18px; font-family: ui-monospace, Menlo, monospace; }
      .term-bar { display: flex; align-items: center; gap: 12px; padding: 14px 20px; font-family: "Inter", sans-serif; font-size: 24px; font-weight: 900; border-bottom: 2px solid #EFE8DC; margin-bottom: 12px; }
      .term-glyph { width: 26px; height: 26px; background: #DC5A2B; -webkit-mask: url("public/logos/claude.svg") center/contain no-repeat; mask: url("public/logos/claude.svg") center/contain no-repeat; }
      .term-bar span { margin-left: auto; font-weight: 700; color: #8A8172; font-family: ui-monospace, Menlo, monospace; }
      .term-line { padding: 8px 22px; font-size: 24px; line-height: 1.3; color: #1B1815; white-space: nowrap; overflow: hidden; }
      .term-line.prompt { font-weight: 700; } .term-line.prompt b { color: #DC5A2B; margin-right: 8px; }
      .term-line.ok { color: #2E9E5B; font-weight: 700; margin-top: 6px; }
      .b3-chip { left: 560px; top: 500px; width: 300px; text-align: center; }

      /* beat 4 — login + Stripe */
      .pay { position: absolute; left: 221px; top: 110px; width: 560px; border-radius: 26px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 14px 34px rgba(60, 40, 20, .12); padding: 22px 26px 26px; }
      .pay-title { font-weight: 900; font-size: 26px; letter-spacing: .04em; text-transform: uppercase; color: #8A8172; margin-bottom: 14px; }
      .pay-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; transform-origin: 0 50%; }
      .pay-lab { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: #6B6257; }
      .pay-field { padding: 12px 18px; border-radius: 12px; background: #F3EEE4; border: 2px solid #E4DCCE; font-size: 26px; font-weight: 700; color: #1B1815; }
      .pay-price { font-weight: 900; font-size: 64px; letter-spacing: -.03em; color: #1B1815; margin: 6px 0 12px; line-height: 1; }
      .pay-price small { font-size: 26px; font-weight: 800; color: #6B6257; letter-spacing: 0; }
      .pay-btn { height: 82px; border-radius: 16px; background: #635BFF; color: #fff; display: grid; place-items: center; font-weight: 900; font-size: 32px; transform-origin: 50% 50%; }
      .b4-chip { left: 50%; margin-left: -130px; top: 600px; width: 260px; text-align: center; }

      /* beat 5 — one owner, then the industry */
      .b5-line { position: absolute; left: 0; top: 180px; width: ${CARD.w}px; display: flex; justify-content: center; align-items: baseline; gap: 22px; white-space: nowrap; }
      .b5-one { font-weight: 900; font-size: 80px; letter-spacing: -.04em; color: #2E9E5B; line-height: 1; }
      .b5-arrow { font-weight: 900; font-size: 60px; color: #1B1815; line-height: 1; }
      .b5-all { font-weight: 900; font-size: 76px; letter-spacing: -.03em; color: #DC5A2B; line-height: 1; }

      /* card grounds per beat */
      .b1 { background: radial-gradient(90% 70% at 50% 45%, #FBF8F2 0%, #F3EEE4 100%); }
      .b2 { background: #F3EEE4; }
      .b2::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(#D9D0BF 2.5px, transparent 2.5px); background-size: 44px 44px; opacity: .55; }
      .b3 { background: #FBFAF7; }
      .b4 { background: radial-gradient(90% 70% at 50% 45%, #FBF8F2 0%, #F3EEE4 100%); }
      .b5 { background: #FBFAF7; }
`;

const cues = (B, at) => ({
  b1_app: at(B[1], "app"), b1_owner: at(B[1], "owner"), b1_pay: at(B[1], "pay"), b1_spreadsheet: at(B[1], "spreadsheet"),
  b2_ask: at(B[2], "ask"), b2_spreadsheet: at(B[2], "spreadsheet"), b2_fill: at(B[2], "fill"), b2_hand: at(B[2], "hand"),
  b3_open: at(B[3], "open"), b3_describe: at(B[3], "describe"), b3_plain: at(B[3], "plain"),
  b4_login: at(B[4], "login"), b4_stripe: at(B[4], "stripe"), b4_charge: at(B[4], "charge"), b4_tonight: at(B[4], "tonight"),
  b5_sell: at(B[5], "sell"), b5_owner: at(B[5], "owner"), b5_industry: at(B[5], "industry"),
  cta: +(at(B[5], "comment") - 0.1).toFixed(3),
});

const anim = `
      // ── beat 1: the app gets crossed, the spreadsheet gets ticked ──
      tl.fromTo("#b1l", { x: -520, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, b1 + 0.1);
      tl.fromTo("#b1x", { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.4, ease: "back.out(2)" }, C.b1_app + 0.1);
      tl.fromTo("#b1r", { x: 520, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, C.b1_owner);
      pop("#b1pay", C.b1_pay, 0.45); wiggle("#b1pay", C.b1_pay + 0.45);
      tl.fromTo("#b1ok", { scale: 0, rotation: 90 }, { scale: 1, rotation: 0, duration: 0.4, ease: "back.out(2)" }, C.b1_spreadsheet + 0.1);
      tl.fromTo("#b1r .b1-ico", { scale: 1 }, { scale: 1.15, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }, C.b1_spreadsheet + 0.1);
      crowd(1).forEach((id, j) => jump(id, C.b1_spreadsheet + 0.2 + j * 0.07, 70));
      walkIn("b1-yar", b1, dur(1), { from: 0.5, delay: 0.3 });
      jump("b1-yar", C.b1_pay, 110);

      // ── beat 2: the cells fill in one by one under the pen ──
      tl.fromTo("#sheet", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b2 + 0.05);
      {
        const cells = Array.from(document.querySelectorAll("#beat-2 .cell:not(.head)"));
        const t0 = C.b2_spreadsheet - 0.1, t1 = D.beats[1].end - 0.4;
        const step = (t1 - t0) / cells.length;
        cells.forEach((c, k) => {
          const t = t0 + k * step;
          tl.fromTo(c.querySelector("span"), { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.15, ease: "power2.out" }, t);
          // the pen sits over the cell being written; the grid is static, so its
          // geometry is known: four fr columns over 734px, 66px rows under a 59px bar
          const col = k % 4, row = Math.floor(k / 4);
          const colX = [0, 250.6, 447.5, 590.7][col];
          tl.to("#pen", { x: colX + 40, y: 59 + 66 * (row + 1) + 4 - 96, duration: Math.max(0.08, step * 0.8), ease: "power2.inOut" }, t - step * 0.4);
          tl.fromTo("#pen", { rotation: -8 }, { rotation: 8, duration: 0.08, yoyo: true, repeat: 1 }, t);
        });
      }
      pop("#b2chip", C.b2_hand, 0.45); wiggle("#b2chip", C.b2_hand + 0.45);
      walkIn("b2-owner", b2, dur(2), { from: 0.5, delay: 0.1 });
      slump("b2-owner", C.b2_hand + 0.1);

      // ── beat 3: the lines waterfall in, plain English ──
      tl.fromTo("#term", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, C.b3_open - 0.05);
      ["#tl1", "#tl2", "#tl3", "#tl4"].forEach((s, j) => tl.fromTo(s, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, C.b3_describe - 0.1 + j * 0.28));
      tl.fromTo("#tl5", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, Math.min(C.b3_describe + 1.3, D.beats[2].end - 0.9));
      pop("#b3chip", C.b3_plain, 0.45, { rotation: 8 }); tl.to("#b3chip", { rotation: 6, duration: 0.2 }, C.b3_plain + 0.45);
      walkIn("b3-yar", b3, dur(3), { from: 0.5, delay: 0.1 });
      pointUp("b3-yar", C.b3_describe, "r");
      crowd(3).forEach((id, j) => jump(id, C.b3_plain + 0.2 + j * 0.07, 70));

      // ── beat 4: login rows, then the Stripe button, then it is paid ──
      tl.fromTo("#pay", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b4 + 0.05);
      tl.set("#pay-login, #pay-pass, #pay-btn, #pay-price", { opacity: 0 }, b4);
      tl.fromTo("#pay-login", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, C.b4_login);
      tl.fromTo("#pay-pass", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, C.b4_login + 0.15);
      tl.fromTo("#pay-price", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, C.b4_stripe - 0.1);
      tl.fromTo("#pay-btn", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.8)" }, C.b4_stripe);
      tl.to("#pay-btn", { backgroundColor: "#2E9E5B", duration: 0.25 }, C.b4_charge + 0.1);
      tl.fromTo("#pay-btn", { scale: 1 }, { scale: 1.08, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" }, C.b4_charge + 0.1);
      { const o = { v: 0 }; tl.to(o, { v: 1, duration: 0.01, onUpdate: () => { const e = document.getElementById("pay-btn-text"); if (e) e.textContent = o.v > 0.5 ? "Paid ✓" : "Pay with Stripe"; } }, C.b4_charge + 0.15); }
      pop("#b4chip", C.b4_tonight, 0.45); wiggle("#b4chip", C.b4_tonight + 0.45);
      crowd(4).forEach((id, j) => jump(id, C.b4_charge + 0.2 + j * 0.07, 80));

      // ── beat 5: one owner, then the crowd walks in around him ──
      tl.fromTo("#b5line .b5-one", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.8)" }, C.b5_owner - 0.1);
      tl.fromTo("#b5line .b5-arrow", { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, C.b5_industry - 0.45);
      tl.fromTo("#b5line .b5-all", { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, C.b5_industry - 0.15);
      tl.fromTo("#b5-first", { scale: 0, y: 40 }, { scale: 1, y: 0, duration: 0.5, ease: "power3.out" }, C.b5_sell);
      tl.to("#b5-first .bot-head", { backgroundColor: "#2E9E5B", duration: 0.2 }, C.b5_owner);
      tl.to("#b5-first .bot-body", { backgroundColor: "#2E9E5B", duration: 0.2 }, C.b5_owner);
      jump("b5-first", C.b5_owner, 100);
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) => walkIn(e.id, C.b5_industry - 0.5, D.beats[4].end - (C.b5_industry - 0.5), { from: 0.6 + (j % 3) * 0.12, delay: (j % 4) * 0.08 }));
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) => jump(e.id, C.cta + 0.2 + j * 0.05, 60));
      tl.fromTo("#b5-yar", { scale: 0, y: 40 }, { scale: 1, y: 0, duration: 0.5, ease: "power3.out" }, b5 + 0.1);
      jump("b5-yar", C.b5_industry, 100);
`;

build(root, {
  pills, card, css, cues, anim,
  logo: "claude.svg", logo2: "sheet.svg",
  sfx: ["pop", "impact-bass-1", "ping", "pop", "click"],
  ctaHtml: `Comment <em>TOOL</em> for the prompt`,
  handle: "@yarmalikhere",
  hold: 1.0,
});
