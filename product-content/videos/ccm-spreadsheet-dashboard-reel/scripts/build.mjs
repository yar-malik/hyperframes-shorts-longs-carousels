// Generate index.html from audio_meta.json. Beat durations are the real voice
// durations; every word-cued move is an absolute time from the synthesizer's
// word alignment. Re-run after re-recording:
//
//   node scripts/build.mjs
//
// Five beats, all from one real Claude Code session (videos/ccm-turn-a-spreadsheet-into-a-dashboard):
// the hook (a messy sheet in, £2,955 owed found), the sheet, the prompt, the dashboard, the close.
// Yar is on camera for the first words of the hook (public/cam.mp4, scripts/avatar/say.mjs), in a face cam
// across the bottom. Frame 0 is the cover: the hook card, the pill and the face cam are all set at t = 0.
import { resolve } from "node:path";
import { build, bot, crowdHtml, CARD } from "./frame.mjs";

const root = resolve(import.meta.dirname, "..");
const CAM = { at: 0, len: 2.45 };   // "One messy spreadsheet and one prompt," — ends on the pause

const pills = {
  1: ["One messy spreadsheet", "£2,955 found"],
  2: ["Step 1 · The spreadsheet", "Messy dates and all"],
  3: ["Step 2 · Claude Code", "Ask in plain English"],
  4: ["Step 3 · One page", "Opens with a double-click"],
  5: ["A tool owners pay for", "Every month"],
};

const crowds = {
  1: [[40, 96, 0, "l"], [860, 104, 3, "r"]],
  3: [[880, 96, 11, "r"]],
  5: [],
};

// the real first rows of jobs-2026.csv; the messy cells are the ones Claude cleaned
const ROWS = [
  ["26 Jan 26", "The Mills", "157", "Y"],
  ["2 Jul 26", "Café Verde", "143", "Y"],
  ["10/08/2026", "Northside Gym", "70", "NO"],
  ["26/02/2026", "Flat 4B Rosewood", "73.00", "Y"],
  ["7 Jun 26", "Sunny Days Nursery", "64", "Y"],
  ["11/03/2026", "Ridgeway Vets", "171.00", "yes"],
];
const MESSY = { "0-0": 1, "2-0": 1, "3-2": 1, "5-2": 1, "2-3": 1, "5-3": 1, "3-0": 1 };
const sheet = (id, rows, small) => `
    <div class="sheet ${small ? "sheet-sm" : ""}" id="${id}">
      <div class="sheet-bar"><i></i><b>jobs-2026.csv</b><span>214 jobs</span></div>
      <div class="sheet-grid">
        ${["Date", "Client", "Price", "Paid?"].map((c) => `<div class="cell head">${c}</div>`).join("")}
        ${rows.map((r, i) => r.map((v, j) => `<div class="cell ${MESSY[`${i}-${j}`] ? "messy" : ""}" data-r="${i}"><span>${v}</span></div>`).join("")).join("")}
      </div>
    </div>`;

const card = {
  // 1 — the cover: a messy sheet in, the real "still owed" card out. Everything here is set at t = 0.
  1: `
    ${sheet("b1sheet", ROWS.slice(0, 4), true)}
    <div class="b1-arrow" id="b1arrow">→</div>
    <div class="b1-owed" id="b1owed"><img src="public/broll/owed-card.png" alt=""></div>
    <div class="chip chip-orange b1-prompt" id="b1prompt">1 prompt</div>
    ${crowdHtml(1, crowds[1])}
    ${bot({ id: "b1-yar", w: 140, x: 431, side: "c", yar: true, shirt: "#DC5A2B" })}`,
  // 2 — the sheet as it really is
  2: `
    ${sheet("b2sheet", ROWS)}
    <div class="chip chip-red b2-chip" id="b2chip">3 date formats</div>
    ${bot({ id: "b2-owner", w: 124, x: 850, side: "r", k: 5, hat: "hard", mouth: "o", cls: "no-walk" })}`,
  // 3 — the real prompt, typed into Claude Code
  3: `
    <div class="term" id="term">
      <div class="term-bar"><i class="term-glyph"></i><b>Claude Code</b><span>~/jobs-app</span></div>
      <div class="term-line prompt" id="tl1"><b>›</b> Turn my job log into a one-page</div>
      <div class="term-line" id="tl2">dashboard: money in by month,</div>
      <div class="term-line" id="tl3">who still owes me and how much,</div>
      <div class="term-line" id="tl4">and which cleaners are busiest.</div>
      <div class="term-line ok" id="tl5">✔ Wrote 737 lines to index.html</div>
    </div>
    <div class="chip chip-orange b3-chip" id="b3chip">Plain English</div>
    ${bot({ id: "b3-yar", w: 124, x: 30, side: "l", yar: true, shirt: "#DC5A2B" })}
    ${crowdHtml(3, crowds[3])}`,
  // 4 — the real dashboard
  4: `
    <div class="browser" id="browser">
      <div class="browser-bar"><i></i><i></i><i></i><span>index.html</span></div>
      <img src="public/broll/dashboard.png" alt="">
    </div>
    <div class="chip chip-green b4-time" id="b4time">Built in 3m 45s</div>
    <div class="chip chip-orange b4-click" id="b4click">Double-click to open</div>`,
  // 5 — what it found, then the crowd
  5: `
    <div class="b5-stats" id="b5stats">
      <div class="st"><b>£26,188</b><span>collected</span></div>
      <div class="st owed"><b>£2,955</b><span>still owed</span></div>
      <div class="st"><b>214</b><span>jobs cleaned</span></div>
    </div>
    <div class="b5-line" id="b5line"><span class="b5-one">1 sheet</span><span class="b5-arrow">→</span><span class="b5-all">paid monthly</span></div>
    ${bot({ id: "b5-first", w: 118, x: 441, side: "c", k: 5, hat: "hard", mouth: "smile", cls: "no-walk" })}
    ${[0, 1, 2, 3].map((j) => bot({ id: `b5-l${j}`, w: 72, x: 140 + j * 78, side: "l", k: 20 + j, cls: "no-walk b5-crowd" })).join("")}
    ${[0, 1, 2, 3].map((j) => bot({ id: `b5-r${j}`, w: 72, x: 578 + j * 78, side: "r", k: 24 + j, cls: "no-walk b5-crowd" })).join("")}
    ${bot({ id: "b5-yar", w: 118, x: 10, side: "c", yar: true, shirt: "#DC5A2B" })}`,
};

// Yar on camera, across the bottom, for the first words (content/references/short-face-cam-bottom-half.png)
const overlay = `
      <div class="cam" id="cam" data-layout-allow-overflow>
        <video class="clip" id="cam-video" src="public/cam.mp4" data-start="${CAM.at}" data-duration="${CAM.len + 0.3}" data-track-index="8" data-media-start="0" muted playsinline></video>
        <div class="cam-name">Yar Malik</div>
      </div>`;

const css = `
      /* Yar's face cam: his real room, 16:9, across the bottom under the caption */
      .cam { position: absolute; left: 140px; top: 1336px; width: 800px; height: 450px; border-radius: 34px; overflow: hidden; background: #111;
        box-shadow: 0 22px 60px rgba(40, 25, 10, .26), 0 6px 16px rgba(40, 25, 10, .3); z-index: 8; }
      .cam video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 47% 40%; }
      .cam-name { position: absolute; left: 20px; bottom: 18px; padding: 8px 16px 9px; border-radius: 999px; background: rgba(17,17,22,.6); color: #fff; font-weight: 800; font-size: 24px; }

      /* the sheet (beats 1 and 2) */
      .sheet { position: absolute; left: 60px; top: 110px; width: 740px; border-radius: 22px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 14px 34px rgba(60, 40, 20, .12); overflow: hidden; }
      .sheet-bar { display: flex; align-items: center; gap: 12px; padding: 14px 20px; font-size: 24px; font-weight: 900; border-bottom: 2px solid #EFE8DC; }
      .sheet-bar i { width: 22px; height: 22px; border-radius: 5px; background: #2E9E5B; }
      .sheet-bar span { margin-left: auto; font-weight: 700; color: #8A8172; }
      .sheet-grid { display: grid; grid-template-columns: 1.15fr 1.55fr .75fr .6fr; }
      .cell { height: 62px; padding: 0 16px; display: flex; align-items: center; font-size: 25px; font-weight: 700; color: #1B1815; border-right: 1px solid #EFE8DC; border-bottom: 1px solid #EFE8DC; overflow: hidden; white-space: nowrap; font-family: ui-monospace, Menlo, monospace; }
      .cell.head { background: #E6F2EA; color: #1F6B3E; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; font-size: 20px; font-family: "Inter", sans-serif; }
      .cell.messy span { color: #C63D2F; }
      .sheet-sm { left: 40px; top: 120px; width: 470px; transform-origin: 0 0; }
      .sheet-sm .cell { height: 52px; font-size: 19px; padding: 0 10px; }
      .sheet-sm .sheet-bar { font-size: 20px; padding: 10px 14px; }
      .sheet-sm .sheet-grid { grid-template-columns: 1.2fr 1.5fr .7fr .8fr; } .sheet-sm .cell.head { font-size: 15px; letter-spacing: .04em; }

      /* beat 1 — the cover */
      .b1-arrow { position: absolute; left: 520px; top: 250px; font-weight: 900; font-size: 84px; color: #DC5A2B; line-height: 1; }
      .b1-owed { position: absolute; left: 604px; top: 150px; width: 370px; border-radius: 22px; overflow: hidden; border: 4px solid #DC5A2B; box-shadow: 0 0 0 8px rgba(220, 90, 43, .14), 0 16px 36px rgba(60, 40, 20, .16); transform-origin: 50% 50%; }
      .b1-owed img { display: block; width: 100%; }
      .b1-prompt { left: 50%; margin-left: -120px; top: 470px; width: 240px; text-align: center; }

      /* beat 2 */
      .b2-chip { left: 60px; top: 580px; width: 380px; text-align: center; }

      /* beat 3 — Claude Code */
      .term { position: absolute; left: 170px; top: 104px; width: 720px; border-radius: 22px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 14px 34px rgba(60, 40, 20, .12); padding-bottom: 18px; font-family: ui-monospace, Menlo, monospace; }
      .term-bar { display: flex; align-items: center; gap: 12px; padding: 14px 20px; font-family: "Inter", sans-serif; font-size: 24px; font-weight: 900; border-bottom: 2px solid #EFE8DC; margin-bottom: 12px; }
      .term-glyph { width: 26px; height: 26px; background: #DC5A2B; -webkit-mask: url("public/logos/claude.svg") center/contain no-repeat; mask: url("public/logos/claude.svg") center/contain no-repeat; }
      .term-bar span { margin-left: auto; font-weight: 700; color: #8A8172; font-family: ui-monospace, Menlo, monospace; }
      .term-line { padding: 8px 22px; font-size: 25px; line-height: 1.3; color: #1B1815; white-space: nowrap; overflow: hidden; }
      .term-line.prompt { font-weight: 700; } .term-line.prompt b { color: #DC5A2B; margin-right: 8px; }
      .term-line.ok { color: #2E9E5B; font-weight: 700; margin-top: 6px; }
      .b3-chip { left: 560px; top: 520px; width: 300px; text-align: center; }

      /* beat 4 — the real dashboard */
      .browser { position: absolute; left: 51px; top: 96px; width: 900px; border-radius: 20px; overflow: hidden; background: #fff; border: 3px solid #E4DCCE; box-shadow: 0 16px 38px rgba(60, 40, 20, .16); }
      .browser-bar { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #F3EEE4; border-bottom: 2px solid #E4DCCE; font-size: 20px; font-weight: 800; color: #6B6257; }
      .browser-bar i { width: 14px; height: 14px; border-radius: 50%; background: #E0D6C6; }
      .browser-bar span { margin-left: 14px; font-family: ui-monospace, Menlo, monospace; }
      .browser img { display: block; width: 100%; }
      .b4-time { left: 60px; top: 640px; width: 330px; text-align: center; }
      .b4-click { right: 60px; top: 640px; width: 380px; text-align: center; }

      /* beat 5 */
      .b5-stats { position: absolute; left: 50px; top: 100px; width: 902px; display: flex; gap: 18px; }
      .b5-stats .st { flex: 1; padding: 22px 10px 18px; border-radius: 22px; background: #FFFDF9; border: 3px solid #E4DCCE; text-align: center; }
      .b5-stats .st b { display: block; font-weight: 900; font-size: 58px; letter-spacing: -.03em; color: #1B1815; line-height: 1; }
      .b5-stats .st span { display: block; margin-top: 8px; font-weight: 800; font-size: 20px; text-transform: uppercase; letter-spacing: .07em; color: #8A8172; }
      .b5-stats .st.owed { border-color: #DC5A2B; } .b5-stats .st.owed b { color: #DC5A2B; }
      .b5-line { position: absolute; left: 0; top: 330px; width: ${CARD.w}px; display: flex; justify-content: center; align-items: baseline; gap: 22px; white-space: nowrap; }
      .b5-one { font-weight: 900; font-size: 72px; letter-spacing: -.04em; color: #2E9E5B; line-height: 1; }
      .b5-arrow { font-weight: 900; font-size: 56px; color: #1B1815; line-height: 1; }
      .b5-all { font-weight: 900; font-size: 72px; letter-spacing: -.03em; color: #DC5A2B; line-height: 1; }

      .b1 { background: radial-gradient(90% 70% at 50% 45%, #FBF8F2 0%, #F3EEE4 100%); }
      .b2 { background: #F3EEE4; }
      .b2::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(#D9D0BF 2.5px, transparent 2.5px); background-size: 44px 44px; opacity: .55; }
      .b3 { background: #FBFAF7; }
      .b4 { background: radial-gradient(90% 70% at 50% 45%, #FBF8F2 0%, #F3EEE4 100%); }
      .b5 { background: #FBFAF7; }
`;

const cues = (B, at) => ({
  b1_prompt: at(B[1], "prompt"), b1_found: at(B[1], "found"), b1_three: at(B[1], "three"),
  b2_folder: at(B[2], "folder"), b2_messy: at(B[2], "messy"), b2_dates: at(B[2], "dates"),
  b3_open: at(B[3], "open"), b3_ask: at(B[3], "ask"), b3_plain: at(B[3], "plain"),
  b4_cleans: at(B[4], "cleans"), b4_writes: at(B[4], "writes"), b4_double: at(B[4], "double"),
  b5_tool: at(B[5], "tool"), b5_month: at(B[5], "month"),
  cta: +(at(B[5], "comment") - 0.1).toFixed(3),
});

const anim = `
      // ── Yar's face cam: already there on frame 0, pops out on the pause after "prompt," ──
      tl.set("#cam", { opacity: 1, scale: 1 }, 0);
      tl.to("#cam", { opacity: 0, scale: 0.92, y: 30, duration: 0.25, ease: "power2.in" }, ${CAM.len});

      // ── beat 1: the cover is set at t = 0; then it moves on the words ──
      tl.set("#b1prompt", { opacity: 0, scale: 0.6 }, 0);
      pop("#b1prompt", C.b1_prompt, 0.4); wiggle("#b1prompt", C.b1_prompt + 0.4);
      tl.fromTo("#b1arrow", { x: 0 }, { x: 16, duration: 0.25, yoyo: true, repeat: 3, ease: "sine.inOut" }, C.b1_found - 0.2);
      tl.fromTo("#b1owed", { scale: 1 }, { scale: 1.12, duration: 0.22, yoyo: true, repeat: 1, ease: "power2.out" }, C.b1_three);
      crowd(1).forEach((id, j) => jump(id, C.b1_three + 0.15 + j * 0.07, 70));
      jump("b1-yar", C.b1_found, 110);

      // ── beat 2: the real rows, the messy cells blink red ──
      tl.fromTo("#b2sheet", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b2 + 0.05);
      Array.from(document.querySelectorAll("#b2sheet .cell:not(.head) span")).forEach((s, k) =>
        tl.fromTo(s, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.14, ease: "power2.out" }, b2 + 0.15 + k * 0.04));
      Array.from(document.querySelectorAll("#b2sheet .cell.messy")).forEach((c, k) =>
        tl.fromTo(c, { backgroundColor: "rgba(198,61,47,0)" }, { backgroundColor: "rgba(198,61,47,.14)", duration: 0.2, yoyo: true, repeat: 1 }, C.b2_messy + k * 0.08));
      pop("#b2chip", C.b2_dates, 0.45); wiggle("#b2chip", C.b2_dates + 0.45);
      walkIn("b2-owner", b2, dur(2), { from: 0.5, delay: 0.1 });
      slump("b2-owner", C.b2_messy + 0.1);

      // ── beat 3: the prompt types in, then the file is written ──
      tl.fromTo("#term", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b3 + 0.05);
      ["#tl1", "#tl2", "#tl3", "#tl4"].forEach((s, j) => tl.fromTo(s, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, C.b3_ask - 0.1 + j * 0.28));
      tl.fromTo("#tl5", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, Math.min(C.b3_ask + 1.4, D.beats[2].end - 0.7));
      pop("#b3chip", C.b3_plain, 0.45, { rotation: 8 }); tl.to("#b3chip", { rotation: 6, duration: 0.2 }, C.b3_plain + 0.45);
      walkIn("b3-yar", b3, dur(3), { from: 0.5, delay: 0.1 });
      pointUp("b3-yar", C.b3_ask, "r");
      crowd(3).forEach((id, j) => jump(id, C.b3_plain + 0.2 + j * 0.07, 70));

      // ── beat 4: the real dashboard rises in, a slow push while it's read ──
      tl.fromTo("#browser", { y: 60, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }, b4 + 0.05);
      tl.fromTo("#browser img", { scale: 1 }, { scale: 1.06, duration: dur(4), ease: "none", transformOrigin: "30% 10%" }, b4 + 0.05);
      pop("#b4time", C.b4_writes, 0.45); wiggle("#b4time", C.b4_writes + 0.45);
      pop("#b4click", C.b4_double, 0.45);

      // ── beat 5: what it found, then the crowd ──
      Array.from(document.querySelectorAll("#b5stats .st")).forEach((s, j) => tl.fromTo(s, { y: 30, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }, b5 + 0.1 + j * 0.14));
      tl.fromTo("#b5line .b5-one", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.8)" }, C.b5_tool - 0.1);
      tl.fromTo("#b5line .b5-arrow", { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, C.b5_month - 0.5);
      tl.fromTo("#b5line .b5-all", { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, C.b5_month - 0.2);
      tl.fromTo("#b5-first", { scale: 0, y: 40 }, { scale: 1, y: 0, duration: 0.5, ease: "power3.out" }, b5 + 0.2);
      tl.to("#b5-first .bot-head", { backgroundColor: "#2E9E5B", duration: 0.2 }, C.b5_month);
      tl.to("#b5-first .bot-body", { backgroundColor: "#2E9E5B", duration: 0.2 }, C.b5_month);
      jump("b5-first", C.b5_month, 100);
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) => walkIn(e.id, C.b5_month - 0.4, D.beats[4].end - (C.b5_month - 0.4), { from: 0.6 + (j % 3) * 0.12, delay: (j % 4) * 0.08 }));
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) => jump(e.id, C.cta + 0.2 + j * 0.05, 60));
      tl.fromTo("#b5-yar", { scale: 0, y: 40 }, { scale: 1, y: 0, duration: 0.5, ease: "power3.out" }, b5 + 0.1);
      jump("b5-yar", C.b5_month, 100);
`;

build(root, {
  pills, card, css, cues, anim, overlay,
  logo: "claude.svg", logo2: "sheet.svg",
  sfx: ["pop", "click", "ping", "pop", "impact-bass-1"],
  ctaHtml: `Comment <em>DASHBOARD</em> for the prompt`,
  handle: "@yarmalikhere",
  hold: 1.0,
});
