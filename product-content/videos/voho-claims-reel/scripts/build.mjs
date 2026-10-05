// Generate index.html from audio_meta.json. Beat durations are the real voice durations; every word-cued move is an
// absolute time from the synthesizer's word alignment. Re-run after re-recording:
//
//   node scripts/build.mjs
//
// Voho, plan topic 2: an AI claims desk in Saudi Arabic. Every fact is from the real run in
// videos/voho-02-a-car-accident-claim-logged-in/ (2026-10-04): the agent "Rukn Al Aman Motor Claims" (an invented
// insurer) built on app.voho.ai, 24 s from "Create an agent" to "Saved"; the live call, where the agent asked first
// whether anyone was hurt, took policy 7741, King Fahd Road in Riyadh, Najm report 359, the caller's name and mobile,
// and said a claims officer would call within one working day. The call ran 69 s and the console's meter read $0.14.
// The hook is the launch headline (the skill's "Headlines: loud launch news"). No music bed (Voho, 2026-10-01).
// v4 frame (scripts/frame.mjs). Videos can't sit inside a timed card, so Yar's cam, the painted Hum clips and the
// console's live transcript play in the overlay (card origin x 39, y 359).
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { build, bot, crowdHtml } from "./frame.mjs";

const root = resolve(import.meta.dirname, "..");
const CALL = JSON.parse(readFileSync(resolve(root, "call.json"), "utf8"));   // { src, crop: {x,y,w,h}, landA, landB: when "7741" and the "claim logged" bubble appear in src }
const O = { x: 39, y: 359 };
const HUM = { x: 31, y: 40, w: 940, h: 560 };
const CAM = { x: 301, y: 650, w: 400, h: 480 };
const CALLBOX = { x: 31, y: 40, w: 470, h: 876 };   // the console's transcript panel is tall, so it takes the left half
const CREW = { x: 31, y: 40, w: 940, h: 420 };

const pills = {
  1: ["Unbelievable! Voho launched", "AI claims desk in Saudi Arabic"],
  2: ["Step 1 · Voho", "Set up in 24 seconds"],
  3: ["Step 2 · The rules", "Injuries first, no inventing"],
  4: ["Step 3 · A real call", "Claim logged in 69 seconds"],
  5: ["Every accident call answered", "Try it at app.voho.ai"],
};

const crowds = {
  1: [[34, 150, 0, "l"], [818, 150, 3, "r"]],
  2: [[30, 140, 6, "l"], [832, 140, 7, "r"]],
  3: [[20, 150, 10, "l"], [832, 150, 12, "r"]],
  4: [[590, 130, 13, "l"], [780, 130, 2, "r"]],
};

const card = {
  // 1 — the cover, set at t = 0: Hum on the line (overlay), the real greeting and its translation, Yar's cam
  1: `
    <div class="frame-hum" id="b1frame"></div>
    <div class="ask" id="b1ask">Car accident</div>
    <div class="closed" id="b1real">REAL CALL</div>
    <div class="greet" id="b1greet"><b class="ar">حيّاك الله في ركن الأمان للتأمين، معك سارة. كيف أقدر أخدمك؟</b><span>"Welcome to Rukn Al Aman Insurance, this is Sara. How can I help you?"</span></div>
    <div class="tiles" id="b1tiles">
      <div class="tile"><b>24 sec</b><span>to set it up</span></div>
      <div class="tile hot"><b>69 sec</b><span>claim logged</span></div>
    </div>
    ${crowdHtml(1, crowds[1])}`,
  // 2 — the console, then what a claim needs, then "saved"
  2: `
    <div class="app" id="con">
      <div class="app-bar"><i class="dot"></i><b>Voho</b><span>New agent</span></div>
      <div class="con-body">
        <div class="field"><small>Agent name</small><b>Rukn Al Aman Motor Claims</b></div>
        <div class="field"><small>Language</small><b>Arabic (Saudi Arabia)</b><em class="ok" id="b2lang">✓</em></div>
      </div>
    </div>
    <div class="qs" id="b2qs">
      <div class="q" id="q1"><i>1</i><div><b>Is anyone hurt?</b><span>asked first, on every call</span></div></div>
      <div class="q" id="q2"><i>2</i><div><b>Policy · place · Najm report</b><span>then the name and mobile</span></div></div>
      <div class="q saved" id="q3"><i>24s</i><div><b>Saved</b><span>from "Create an agent" to "Saved"</span></div></div>
    </div>
    ${crowdHtml(2, crowds[2])}`,
  // 3 — the rules, stamped, and the line as typed
  3: `
    <div class="app" id="rules">
      <div class="app-bar"><i class="dot"></i><b>Instructions</b><span>The rules</span></div>
      <div class="rule good" id="r1"><div><b>Injuries first</b><span>anyone hurt? call 997 now</span></div><em class="stamp yes" id="r1s">✓</em></div>
      <div class="rule" id="r2"><div><b>Fault · payout</b><span>never decides them</span></div><em class="stamp no" id="r2s">✗</em></div>
      <div class="rule" id="r3"><div><b>Claim number</b><span>never invents one</span></div><em class="stamp no" id="r3s">✗</em></div>
    </div>
    <div class="note" id="b3note"><b class="ar">لا تعطين رقم مطالبة من عندك</b><span>"don't give a claim number of your own", as typed</span></div>
    ${crowdHtml(3, crowds[3])}`,
  // 4 — the console's live transcript during the call (overlay), and what it took down
  4: `
    <div class="call-slot" id="call-slot"></div>
    <div class="lead" id="lead">
      <div class="lrow" id="l1"><small>Policy number</small><b>7741</b></div>
      <div class="lrow" id="l2"><small>Where</small><b>King Fahd Rd</b></div>
      <div class="lrow" id="l3"><small>Najm report</small><b>359</b></div>
      <div class="lrow booked" id="l4"><small>69 sec · $0.14</small><b>Claim logged ✓</b></div>
    </div>
    ${crowdHtml(4, crowds[4])}`,
  // 5 — the Hum crew (overlay), the claim logged, everyone gathers
  5: `
    <div class="crew-slot" id="crew-slot"></div>
    <div class="ready" id="ready"><em>✓</em><div><b>Claim logged in 69 seconds</b><span>policy 7741 · Najm 359 · a callback within a working day</span></div></div>
    <div class="join" id="join"><span>Build yours tonight</span><b>app.voho.ai →</b></div>
    ${[0, 1, 2, 3].map((j) => bot({ id: `b5-l${j}`, w: 104, x: 160 + j * 100, side: "l", k: 20 + j, cls: "no-walk b5-crowd" })).join("")}
    ${[0, 1, 2, 3].map((j) => bot({ id: `b5-r${j}`, w: 104, x: 560 + j * 100, side: "r", k: 24 + j, cls: "no-walk b5-crowd" })).join("")}
    ${bot({ id: "b5-yar", w: 150, x: 6, side: "c", yar: true, shirt: "#2E9E5B" })}`,
};

const at = (r) => `left:${O.x + r.x}px; top:${O.y + r.y}px; width:${r.w}px; height:${r.h}px`;
const mediaDur = (f) => +parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", resolve(root, f)]).toString()).toFixed(3);
const CAM_LEN = mediaDur("public/cam.mp4");
const CAM_OUT = Math.min(CAM_LEN, 2.4);
// the call clip, twice: "7741" lands on "policy", then a cut and the "claim logged" bubble lands on "logged"
let DESK;
const overlayFor = (B) => {
  const sc = CALLBOX.w / CALL.crop.w;
  const callStyle = `left:${-CALL.crop.x * sc}px; top:${-CALL.crop.y * sc}px; width:${1920 * sc}px; height:${1080 * sc}px`;
  return `
      <div class="vid" id="hum-vid" style="${at(HUM)}">
        <video class="clip" id="hum-video" src="public/broll/pip-talk-loop.mp4" data-start="0" data-duration="${B[1].dur}" data-track-index="7" data-media-start="0" muted playsinline></video>
      </div>
      <div class="vid face" id="cam-vid" style="${at(CAM)}">
        <video class="clip" id="cam-video" src="public/cam.mp4" data-start="0" data-duration="${CAM_LEN}" data-track-index="8" data-media-start="0" muted playsinline></video>
        <div class="nm">Yar Malik</div>
      </div>
      <div class="vid callv" id="call-vid" style="${at(CALLBOX)}">
        <video class="clip deskv" id="call-video" src="${CALL.src}" data-start="${B[4].start}" data-duration="${DESK.cut - B[4].start}" data-track-index="9" data-media-start="${DESK.a}" muted playsinline style="${callStyle}"></video>
        <video class="clip deskv" id="call-video-2" src="${CALL.src}" data-start="${DESK.cut}" data-duration="${B[4].start + B[4].dur - DESK.cut}" data-track-index="10" data-media-start="${DESK.b}" muted playsinline style="${callStyle}"></video>
        <div class="live" id="b4live"><i></i>LIVE · VOHO CONSOLE</div>
      </div>
      <div class="vid" id="crew-vid" style="${at(CREW)}">
        <video class="clip" id="crew-video" src="public/broll/crew-strip-loop.mp4" data-start="${B[5].start}" data-duration="${B[5].dur + 1.2}" data-track-index="9" data-media-start="0" muted playsinline></video>
      </div>`;
};

const css = `
      @font-face { font-family: "Plex Arabic"; src: url("public/fonts/PlexArabic-500.woff2") format("woff2"); font-weight: 400 500; }
      @font-face { font-family: "Plex Arabic"; src: url("public/fonts/PlexArabic-700.woff2") format("woff2"); font-weight: 600 900; }
      .ar { font-family: "Plex Arabic", sans-serif; direction: rtl; }

      .vid { position: absolute; border-radius: 26px; overflow: hidden; background: #F3EEE4; z-index: 7; }
      .vid video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #hum-vid video { object-position: 50% 50%; transform: scale(1.25); }
      #crew-vid video { object-position: 50% 58%; transform: scale(1.18); }
      .vid.face { background: #111; box-shadow: 0 20px 50px rgba(40, 25, 10, .3); }
      .vid.face video { object-position: 47% 34%; transform: scale(1.15); transform-origin: 47% 34%; }
      .vid.face .nm { position: absolute; left: 16px; bottom: 16px; padding: 8px 16px; border-radius: 999px; background: rgba(17,17,22,.6); color: #fff; font-weight: 800; font-size: 24px; z-index: 2; font-family: Inter, sans-serif; }
      .vid.callv { background: #fff; border: 4px solid #1B1815; box-shadow: 0 18px 44px rgba(40, 25, 10, .24); }
      .vid.callv video { inset: auto; width: auto; height: auto; object-fit: fill; }

      /* beat 1 */
      .frame-hum { position: absolute; left: ${HUM.x - 8}px; top: ${HUM.y - 8}px; width: ${HUM.w + 16}px; height: ${HUM.h + 16}px; border-radius: 32px; border: 4px solid #2E9E5B; box-shadow: 0 0 0 10px rgba(46, 158, 91, .14); }
      .ask { position: absolute; right: 60px; top: 66px; z-index: 8; padding: 12px 26px; border-radius: 999px; background: #1B1815; color: #fff; font-weight: 700; font-size: 44px; }
      .closed { position: absolute; left: 60px; top: 74px; z-index: 8; padding: 12px 22px; border-radius: 999px; background: #C63D2F; color: #fff; font-weight: 700; font-size: 30px; }
      .greet { position: absolute; left: 51px; top: 520px; width: 900px; z-index: 8; padding: 20px 26px; border-radius: 24px; background: #FFFDF9; border: 3px solid #2E9E5B; box-shadow: 0 12px 30px rgba(60,40,20,.16); text-align: center; }
      .greet b { display: block; font-size: 40px; font-weight: 700; line-height: 1.4; color: #1B1815; }
      .greet span { display: block; margin-top: 4px; font-size: 24px; font-weight: 500; color: #6B6257; }
      .tiles { position: absolute; left: 191px; top: 770px; width: 620px; display: flex; gap: 20px; }
      .tile { flex: 1; padding: 24px 16px 20px; border-radius: 24px; background: #FFFDF9; border: 3px solid #E4DCCE; text-align: center; }
      .tile b { display: block; font-weight: 700; font-size: 54px; line-height: 1.1; color: #1B1815; }
      .tile span { display: block; margin-top: 8px; font-weight: 500; font-size: 26px; color: #8A8172; }
      .tile.hot { border-color: #2E9E5B; } .tile.hot b { color: #2E9E5B; }

      /* app cards */
      .app { position: absolute; left: 51px; top: 44px; width: 900px; border-radius: 26px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 16px 38px rgba(60, 40, 20, .14); overflow: hidden; }
      .app-bar { display: flex; align-items: center; gap: 14px; padding: 18px 26px; border-bottom: 2px solid #EFE8DC; font-size: 32px; }
      .app-bar .dot { width: 22px; height: 22px; border-radius: 50%; background: #2E9E5B; }
      .app-bar b { font-weight: 700; } .app-bar span { margin-left: auto; font-weight: 500; color: #8A8172; font-size: 28px; }
      .con-body { padding: 24px 26px 28px; display: flex; flex-direction: column; gap: 18px; }
      .field { position: relative; padding: 16px 22px; border-radius: 18px; background: #F3EEE4; }
      .field small { display: block; font-size: 24px; font-weight: 500; color: #8A8172; }
      .field b { display: block; margin-top: 2px; font-size: 36px; font-weight: 700; text-align: left; }
      .ok { position: absolute; right: 22px; top: 50%; margin-top: -30px; width: 60px; height: 60px; border-radius: 50%; background: #2E9E5B; color: #fff; font-style: normal; font-weight: 900; font-size: 36px; display: grid; place-items: center; }
      .qs { position: absolute; left: 51px; top: 440px; width: 900px; display: flex; flex-direction: column; gap: 18px; }
      .q { display: flex; align-items: center; gap: 22px; padding: 18px 24px; border-radius: 22px; background: #FFFDF9; border: 3px solid #2E9E5B; box-shadow: 0 10px 24px rgba(60,40,20,.12); }
      .q i { flex: none; min-width: 120px; height: 70px; padding: 0 14px; border-radius: 18px; background: #2E9E5B; color: #fff; font-style: normal; font-weight: 800; font-size: 36px; display: grid; place-items: center; font-family: Inter, sans-serif; }
      .q b { display: block; font-size: 38px; font-weight: 700; }
      .q span { display: block; font-size: 28px; font-weight: 500; color: #6B6257; }
      .q.saved { background: #2E9E5B; } .q.saved i { background: #fff; color: #2E9E5B; } .q.saved b { color: #fff; } .q.saved span { color: #D8F0E2; }

      /* beat 3 */
      #rules { top: 60px; }
      .rule { position: relative; margin: 24px 26px; padding: 34px 120px 34px 32px; border-radius: 22px; background: #FBEDEA; border: 3px solid #EBC3BC; }
      .rule.good { background: #E9F5EE; border-color: #B9DFC8; }
      .rule b { display: block; font-size: 48px; font-weight: 700; }
      .rule span { display: block; margin-top: 2px; font-size: 30px; font-weight: 500; color: #6B6257; }
      .stamp { position: absolute; right: 22px; top: 50%; margin-top: -40px; width: 80px; height: 80px; border-radius: 50%; color: #fff; font-style: normal; font-weight: 900; font-size: 50px; display: grid; place-items: center; }
      .stamp.no { background: #C63D2F; } .stamp.yes { background: #2E9E5B; }
      .note { position: absolute; left: 195px; top: 800px; width: 612px; padding: 22px 26px; background: #FFF7D6; border-radius: 8px; transform: rotate(2deg); box-shadow: 0 10px 24px rgba(60,40,20,.16); text-align: center; }
      .note b { display: block; font-size: 36px; font-weight: 700; line-height: 1.45; color: #3A352D; }
      .note span { display: block; margin-top: 6px; font: 400 22px/1.3 ui-monospace, Menlo, monospace; color: #6B6257; direction: ltr; }

      /* beat 4: the tall transcript on the left, what it took down on the right */
      .call-slot { position: absolute; left: ${CALLBOX.x - 8}px; top: ${CALLBOX.y - 8}px; width: ${CALLBOX.w + 16}px; height: ${CALLBOX.h + 16}px; border-radius: 32px; border: 4px solid #2E9E5B; }
      .live { position: absolute; left: 14px; bottom: 14px; z-index: 9; display: flex; align-items: center; gap: 10px; padding: 8px 18px; border-radius: 999px; background: #C63D2F; color: #fff; font-weight: 700; font-size: 24px; }
      .live i { width: 14px; height: 14px; border-radius: 50%; background: #fff; }
      .lead { position: absolute; left: 531px; top: 36px; width: 440px; display: flex; flex-direction: column; gap: 18px; }
      .lrow { padding: 26px 26px 28px; border-radius: 22px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 10px 24px rgba(60,40,20,.1); }
      .lrow small { display: block; font-size: 28px; font-weight: 500; color: #8A8172; }
      .lrow b { display: block; margin-top: 4px; font-size: 62px; font-weight: 700; line-height: 1.15; white-space: nowrap; }
      .lrow.booked { background: #2E9E5B; border-color: #2E9E5B; } .lrow.booked small { color: #D8F0E2; } .lrow.booked b { color: #fff; font-size: 52px; }

      /* beat 5 */
      .crew-slot { position: absolute; left: ${CREW.x - 8}px; top: ${CREW.y - 8}px; width: ${CREW.w + 16}px; height: ${CREW.h + 16}px; border-radius: 32px; border: 4px solid #2E9E5B; }
      .ready { position: absolute; left: 51px; top: 500px; width: 900px; display: flex; align-items: center; gap: 22px; padding: 22px 28px; border-radius: 26px; background: #FFFDF9; border: 3px solid #2E9E5B; box-shadow: 0 12px 30px rgba(60,40,20,.14); }
      .ready em { flex: none; width: 76px; height: 76px; border-radius: 50%; background: #2E9E5B; color: #fff; font-style: normal; font-weight: 900; font-size: 44px; display: grid; place-items: center; }
      .ready b { display: block; font-size: 42px; font-weight: 700; }
      .ready span { display: block; margin-top: 2px; font-size: 26px; font-weight: 500; color: #6B6257; }
      .join { position: absolute; left: 81px; top: 700px; width: 840px; padding: 24px 34px; border-radius: 28px; background: #1B1815; color: #fff; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 16px 34px rgba(30,20,10,.3); }
      .join span { font-weight: 700; font-size: 38px; white-space: nowrap; } .join b { font-weight: 800; font-size: 34px; color: #8FF0BE; white-space: nowrap; font-family: Inter, sans-serif; }

      .b1, .b4 { background: radial-gradient(90% 70% at 50% 40%, #FBF8F2 0%, #F3EEE4 100%); }
      .b2 { background: #F3EEE4; }
      .b2::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(#D9D0BF 2.5px, transparent 2.5px); background-size: 44px 44px; opacity: .55; }
      .b3, .b5 { background: #FBFAF7; }
      .cta-chip em { color: #8FF0BE !important; font-family: Inter, sans-serif; }
`;

// word cues, matched after dropping punctuation
const meta = JSON.parse(readFileSync(resolve(root, "audio_meta.json"), "utf8"));
const norm = (s) => s.replace(/[.,،؟:!«»"]/g, "").toLowerCase();
const Bm = {}; let t0 = 0; [...meta.voices].sort((a, b) => a.id.localeCompare(b.id)).forEach((v, i) => { Bm[i + 1] = { start: t0, dur: v.duration_s, words: v.words }; t0 += v.duration_s; });
const W = (i, word, nth = 0) => {
  const hits = Bm[i].words.filter((w) => norm(w.text).startsWith(norm(word)));
  if (!hits[nth]) throw new Error(`beat ${i}: "${word}" #${nth} not found`);
  return +(Bm[i].start + hits[nth].start).toFixed(3);
};
const cues = () => ({
  b1_ask: W(1, "claims"), b1_agent: W(1, "accident"), b1_two: W(1, "sixty"), b1_line: W(1, "Arabic"),
  b2_voho: W(2, "Voho"), b2_saudi: W(2, "Arabic"), b2_list: W(2, "claim"), b2_saved: W(2, "saved"),
  b3_rules: W(3, "rules"), b3_one: W(3, "injuries"), b3_fault: W(3, "fault"), b3_invent: W(3, "invents"),
  b4_policy: W(4, "policy"), b4_road: W(4, "road"), b4_najm: W(4, "Najm"), b4_logged: W(4, "logged"), b4_cents: W(4, "fourteen"),
  b5_answer: W(5, "answered"), b5_after: W(5, "logged"), b5_try: W(5, "Try"),
  cta: +(W(5, "Try") - 0.1).toFixed(3),
});

const anim = `
      tl.set("#hum-vid", { opacity: 1 }, 0);
      tl.fromTo("#hum-vid video", { scale: 1.25 }, { scale: 1.4, duration: dur(1), ease: "none" }, 0);
      tl.to("#hum-vid", { opacity: 0, scale: 0.95, duration: 0.25, ease: "power2.in" }, D.beats[0].end - 0.25);
      tl.set("#cam-vid", { opacity: 1 }, 0);
      tl.to("#cam-vid", { opacity: 0, scale: 0.9, y: 30, duration: 0.25, ease: "power2.in" }, CAM_OUT - 0.25);
      tl.set("#call-vid", { opacity: 0, scale: 0.9 }, 0);
      tl.to("#call-vid", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)" }, b4 + 0.1);
      tl.to("#call-vid", { scale: 1.03, duration: CUT - b4 - 0.5, ease: "none" }, b4 + 0.5);
      tl.fromTo("#call-vid", { scale: 1.08 }, { scale: 1, duration: 0.35, ease: "power3.out" }, CUT);
      tl.to("#call-vid", { opacity: 0, duration: 0.25 }, D.beats[3].end - 0.25);
      tl.set("#crew-vid", { opacity: 0, y: 40 }, 0);
      tl.to("#crew-vid", { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.5)" }, b5 + 0.1);

      // ── beat 1 ──
      tl.fromTo("#b1ask", { scale: 1 }, { scale: 1.15, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }, C.b1_ask);
      tl.fromTo("#b1real", { scale: 1, rotation: 0 }, { scale: 1.12, rotation: 4, duration: 0.2, yoyo: true, repeat: 1 }, C.b1_agent);
      tl.set("#b1tiles", { opacity: 0 }, 0);
      tl.fromTo("#b1tiles", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.6)" }, CAM_OUT);
      tl.fromTo("#b1tiles .tile.hot", { scale: 1 }, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }, C.b1_two);
      tl.fromTo("#b1greet", { scale: 1 }, { scale: 1.04, duration: 0.25, yoyo: true, repeat: 1 }, C.b1_line);
      crowd(1).forEach((id, j) => jump(id, C.b1_two + 0.1 + j * 0.07, 80));

      // ── beat 2 ──
      tl.fromTo("#con", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b2 + 0.05);
      tl.fromTo("#b2lang", { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(2.5)" }, C.b2_saudi);
      [["#q1", C.b2_list - 0.5], ["#q2", C.b2_list], ["#q3", C.b2_saved]].forEach(([q, t]) => tl.fromTo(q, { x: -120, opacity: 0, scale: 0.9 }, { x: 0, opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.7)" }, t));
      wiggle("#q3", C.b2_saved + 0.5);
      crowd(2).forEach((id, j) => jump(id, C.b2_saved + 0.2 + j * 0.07, 70));

      // ── beat 3 ──
      tl.fromTo("#rules", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b3 + 0.05);
      [["#r1", C.b3_rules + 0.5], ["#r2", C.b3_fault - 1.2], ["#r3", C.b3_invent - 0.4]].forEach(([r, t]) => tl.fromTo(r, { x: -90, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power3.out" }, t));
      [["#r1s", C.b3_one + 0.3], ["#r2s", C.b3_fault + 0.1], ["#r3s", C.b3_invent + 0.3]].forEach(([s, t]) => tl.fromTo(s, { scale: 2.4, opacity: 0, rotation: -25 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.25, ease: "power4.in" }, t));
      tl.fromTo("#b3note", { opacity: 0, y: 20, rotation: 6 }, { opacity: 1, y: 0, rotation: 2, duration: 0.4, ease: "back.out(1.6)" }, C.b3_invent + 0.6);
      crowd(3).forEach((id, j) => jump(id, C.b3_one + 0.3 + j * 0.07, 80));
      crowd(3).forEach((id) => slump(id, C.b3_invent + 0.3));

      // ── beat 4 ──
      tl.fromTo("#call-slot", { opacity: 0 }, { opacity: 1, duration: 0.3 }, b4 + 0.1);
      tl.fromTo("#b4live i", { opacity: 1 }, { opacity: 0.2, duration: 0.4, yoyo: true, repeat: reps(dur(4), 0.4) }, b4);
      tl.fromTo("#lead", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, b4 + 0.2);
      [["#l1", C.b4_policy + 0.2], ["#l2", C.b4_road], ["#l3", C.b4_najm + 0.1], ["#l4", C.b4_logged + 0.1]].forEach(([r, t]) => {
        tl.fromTo(r, { opacity: 0.15, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, t);
      });
      wiggle("#l4", C.b4_cents);
      crowd(4).forEach((id, j) => jump(id, C.b4_policy + 0.3 + j * 0.07, 80));
      crowd(4).forEach((id, j) => jump(id, C.b4_logged + 0.2 + j * 0.07, 80));

      // ── beat 5 ──
      tl.fromTo("#ready", { y: 40, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)" }, b5 + 0.3);
      tl.fromTo("#ready em", { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(2.5)" }, C.b5_answer + 0.2);
      tl.fromTo("#join", { y: 40, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)" }, C.b5_try - 0.3);
      tl.fromTo("#join", { scale: 1 }, { scale: 1.05, duration: 0.35, yoyo: true, repeat: 3, ease: "sine.inOut" }, C.cta + 0.4);
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) => walkIn(e.id, C.b5_after - 0.6, D.beats[4].end - (C.b5_after - 0.6), { from: 0.6 + (j % 3) * 0.12, delay: (j % 4) * 0.08 }));
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) => jump(e.id, C.cta + 0.3 + j * 0.05, 60));
      tl.fromTo("#b5-yar", { scale: 0, y: 40 }, { scale: 1, y: 0, duration: 0.5, ease: "power3.out" }, b5 + 0.1);
      jump("b5-yar", C.b5_answer, 100);
`;

// sounds on the beats of motion (the frame plays one per beat). No bed, so these carry the gaps.
const C = cues();
const CUT = +(C.b4_logged - 0.7).toFixed(3);
DESK = { cut: CUT, a: +(CALL.landA - (C.b4_policy + 0.2 - Bm[4].start)).toFixed(3), b: +(CALL.landB - (C.b4_logged - CUT)).toFixed(3) };
const sdur = (f) => mediaDur("public/sfx/" + f);
const END = +(Bm[5].start + Bm[5].dur).toFixed(3);
const extra = [
  ["pop.mp3", C.b1_ask, 0.4], ["ping.mp3", C.b1_two, 0.35], ["pop.mp3", CAM_OUT, 0.3],
  ["click.mp3", C.b2_saudi, 0.4], ["pop.mp3", +(C.b2_list - 0.5).toFixed(3), 0.38], ["pop.mp3", C.b2_list, 0.38], ["ding.wav", C.b2_saved, 0.45],
  ["ding.wav", +(C.b3_one + 0.3).toFixed(3), 0.4], ["impact-bass-1.mp3", +(C.b3_fault + 0.1).toFixed(3), 0.45], ["impact-bass-1.mp3", +(C.b3_invent + 0.3).toFixed(3), 0.5],
  ["tick.wav", +(C.b4_policy + 0.2).toFixed(3), 0.5], ["tick.wav", C.b4_road, 0.5], ["tick.wav", +(C.b4_najm + 0.1).toFixed(3), 0.5], ["whoosh-short.mp3", +(CUT - 0.05).toFixed(3), 0.35], ["ding.wav", +(C.b4_logged + 0.1).toFixed(3), 0.5],
  ["ping.mp3", C.b5_answer, 0.4], ["pop.mp3", C.b5_after, 0.35],
  // the hold after the last word would be silent without a bed
  ["ding.wav", +(END + 0.05).toFixed(3), 0.45], ["pop.mp3", +(END + 0.55).toFixed(3), 0.4],
];
const extraHtml = extra.map(([f, t, v], k) => `
      <audio id="sx-${k}" src="public/sfx/${f}" data-start="${t}" data-duration="${sdur(f)}" data-track-index="${13 + (k % 3)}" data-volume="${v}"></audio>`).join("");

build(root, {
  pills, card, css, cues, overlay: overlayFor(Bm) + extraHtml,
  anim: `const CAM_OUT = ${CAM_OUT}; const CUT = ${CUT};\n` + anim,
  logo: "voho.svg", logo2: "sheet.svg",
  sfx: ["pop", "click", "impact-bass-1", "ping", "ping"],
  ctaHtml: `Try it at <em>app.voho.ai</em>`,
  handle: "@yarmalikhere",
  hold: 1.2,
  bed: false,
});
