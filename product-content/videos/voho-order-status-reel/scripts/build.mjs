// Generate index.html from audio_meta.json. Beat durations are the real voice durations; every word-cued move is an
// absolute time from the synthesizer's word alignment. Re-run after re-recording:
//
//   node scripts/build.mjs
//
// Voho, all in Saudi Arabic (Yar, 2026-09-28): a customer asks "وين طلبي؟" and the agent answers. Every fact is from the
// real run in videos/voho-12-where-is-my-order-answered-without/: the agent "Al Waha Electronics Customer Care" (an
// invented store), its order list and rules as typed into app.voho.ai, and the live call (take-a.mp4): order 4521 was
// out with the courier and due before 9 PM, the caller moved it to tomorrow afternoon, and the console logged it
// RESOLVED, 1m 12s, $0.14.
// v4 frame (scripts/frame.mjs), right to left: Arabic captions, pills and cards in IBM Plex Sans Arabic. Videos can't
// sit inside a timed card, so Yar's cam, the painted Hum clips and the real call play in the overlay (card origin x 39, y 359).
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { build, bot, crowdHtml } from "./frame.mjs";

const root = resolve(import.meta.dirname, "..");
const CALL = JSON.parse(readFileSync(resolve(root, "call.json"), "utf8"));   // { src, crop: {x,y,w,h}, mediaStart }
const O = { x: 39, y: 359 };
const HUM = { x: 31, y: 40, w: 940, h: 560 };
const CAM = { x: 301, y: 650, w: 400, h: 480 };
const CALLBOX = { x: 31, y: 40, w: 940, h: 540 };
const CREW = { x: 31, y: 40, w: 940, h: 420 };

const pills = {
  1: ["مكالمة حقيقية · بالسعودي", "وين طلبي؟"],
  2: ["الخطوة 1 · فُوهو", "قائمة الطلبات"],
  3: ["الخطوة 2 · القواعد", "بدون بطاقة، بدون وعود"],
  4: ["الخطوة 3 · المكالمة", "تغيّر الموعد"],
  5: ["حتى بعد الدوام", "جربه على app.voho.ai"],
};

const crowds = {
  1: [[34, 150, 0, "l"], [818, 150, 3, "r"]],
  2: [[30, 140, 6, "l"], [832, 140, 7, "r"]],
  3: [[20, 150, 10, "l"], [832, 150, 12, "r"]],
  4: [[380, 120, 13, "l"], [500, 120, 2, "r"]],
};

const card = {
  // 1 — the cover, set at t = 0: Hum on the line (overlay), the caller's question and the real greeting, Yar's cam
  1: `
    <div class="frame-hum" id="b1frame"></div>
    <div class="ask" id="b1ask">📦 وين طلبي؟</div>
    <div class="closed" id="b1real">مكالمة حقيقية</div>
    <div class="greet" id="b1greet"><b>حيّاك الله في متجر الواحة، معاك ليلى. كيف أقدر أخدمك؟</b><span>ترحيب الوكيل، كما كتبته في فُوهو</span></div>
    <div class="tiles" id="b1tiles">
      <div class="tile"><b>وين طلبي؟</b><span>سؤال العميل</span></div>
      <div class="tile hot"><b>تجاوب</b><span>بدون موظف</span></div>
    </div>
    ${crowdHtml(1, crowds[1])}`,
  // 2 — the console, then the order list from the instructions pops in
  2: `
    <div class="app" id="con">
      <div class="app-bar"><i class="dot"></i><b>Voho</b><span>وكيل جديد</span></div>
      <div class="con-body">
        <div class="field"><small>اسم الوكيل</small><b dir="ltr">Al Waha Electronics Customer Care</b></div>
        <div class="field"><small>اللغة</small><b dir="ltr">Arabic (Saudi Arabia)</b><em class="ok" id="b2lang">✓</em></div>
      </div>
    </div>
    <div class="qs" id="b2qs">
      <div class="q" id="q1"><i>4521</i><div><b>سماعات لاسلكية</b><span>مع المندوب، يوصل الليلة</span></div></div>
      <div class="q" id="q2"><i>4533</i><div><b>شاحن جوال</b><span>في المستودع، يطلع بكرة</span></div></div>
      <div class="q" id="q3"><i>4540</i><div><b>ساعة ذكية</b><span>تم التسليم أمس</span></div></div>
    </div>
    ${crowdHtml(2, crowds[2])}`,
  // 3 — the rules, stamped, and the line as typed
  3: `
    <div class="app" id="rules">
      <div class="app-bar"><i class="dot"></i><b>التعليمات</b><span>القواعد</span></div>
      <div class="rule" id="r1"><div><b>رقم البطاقة · رمز التحقق</b><span>ما يطلبها أبداً</span></div><em class="stamp no" id="r1s">✗</em></div>
      <div class="rule" id="r2"><div><b>وعود بالاسترجاع</b><span>ما يوعد بشيء</span></div><em class="stamp no" id="r2s">✗</em></div>
      <div class="rule good" id="r3"><div><b>الفريق يقرر</b><span>الاسترجاع والتعويض</span></div><em class="stamp yes" id="r3s">✓</em></div>
    </div>
    <div class="note" id="b3note"><b>لا تطلبين أبداً رقم البطاقة أو رمز التحقق أو كلمة المرور</b><span>the rule, as typed</span></div>
    ${crowdHtml(3, crowds[3])}`,
  // 4 — the real call (overlay) and the order filling in on the words
  4: `
    <div class="call-slot" id="call-slot"></div>
    <div class="lead" id="lead">
      <div class="lrow" id="l1"><small>رقم الطلب</small><b>4521</b></div>
      <div class="lrow" id="l2"><small>الحالة</small><b>مع المندوب</b></div>
      <div class="lrow" id="l3"><small>يوصل</small><b>قبل 9 بالليل</b></div>
      <div class="lrow booked" id="l4"><small>الموعد الجديد</small><b>بكرة العصر ✓</b></div>
    </div>
    ${crowdHtml(4, crowds[4])}`,
  // 5 — the Hum crew (overlay), the change done, everyone gathers
  5: `
    <div class="crew-slot" id="crew-slot"></div>
    <div class="ready" id="ready"><em>✓</em><div><b>تم تغيير موعد التوصيل</b><span>طلب 4521 · بكرة العصر · مكالمة 1:12 · 0.14$</span></div></div>
    <div class="join" id="join"><span>ابنِ وكيلك الليلة</span><b dir="ltr">app.voho.ai →</b></div>
    ${[0, 1, 2, 3].map((j) => bot({ id: `b5-l${j}`, w: 104, x: 160 + j * 100, side: "l", k: 20 + j, cls: "no-walk b5-crowd" })).join("")}
    ${[0, 1, 2, 3].map((j) => bot({ id: `b5-r${j}`, w: 104, x: 560 + j * 100, side: "r", k: 24 + j, cls: "no-walk b5-crowd" })).join("")}
    ${bot({ id: "b5-yar", w: 150, x: 6, side: "c", yar: true, shirt: "#2E9E5B" })}`,
};

const at = (r) => `left:${O.x + r.x}px; top:${O.y + r.y}px; width:${r.w}px; height:${r.h}px`;
const mediaDur = (f) => +parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", resolve(root, f)]).toString()).toFixed(3);
const CAM_LEN = mediaDur("public/cam.mp4");
const CAM_OUT = Math.min(CAM_LEN, 2.2);
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
        <video class="clip" id="call-video" src="${CALL.src}" data-start="${B[4].start}" data-duration="${B[4].dur}" data-track-index="9" data-media-start="${CALL.mediaStart}" muted playsinline style="${callStyle}"></video>
        <div class="live" id="b4live"><i></i>مكالمة مباشرة</div>
      </div>
      <div class="vid" id="crew-vid" style="${at(CREW)}">
        <video class="clip" id="crew-video" src="public/broll/crew-strip-loop.mp4" data-start="${B[5].start}" data-duration="${B[5].dur + 1.2}" data-track-index="9" data-media-start="0" muted playsinline></video>
      </div>`;
};

const css = `
      @font-face { font-family: "Plex Arabic"; src: url("public/fonts/PlexArabic-500.woff2") format("woff2"); font-weight: 400 500; }
      @font-face { font-family: "Plex Arabic"; src: url("public/fonts/PlexArabic-700.woff2") format("woff2"); font-weight: 600 900; }
      body, .pill-text, .chip, .cta-chip, .card, .vid { font-family: "Plex Arabic", "Inter", sans-serif; }
      .pill-text { letter-spacing: 0; direction: rtl; font-weight: 700; line-height: 1.2; }
      .pill { flex-direction: row-reverse; padding: 16px 16px 16px 44px; }
      .cap { font-family: "Plex Arabic", serif; font-weight: 700; font-size: 64px; line-height: 1.35; }
      .cap-ghost, .cap-live { direction: rtl; }
      .chip { letter-spacing: 0; }
      .beat-inner { direction: rtl; }
      .cta-chip { direction: rtl; }
      .cta-chip .tri { transform: scaleX(-1); }

      .vid { position: absolute; border-radius: 26px; overflow: hidden; background: #F3EEE4; z-index: 7; }
      .vid video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #hum-vid video { object-position: 50% 50%; transform: scale(1.25); }
      #crew-vid video { object-position: 50% 58%; transform: scale(1.18); }
      .vid.face { background: #111; box-shadow: 0 20px 50px rgba(40, 25, 10, .3); }
      .vid.face video { object-position: 47% 34%; transform: scale(1.15); transform-origin: 47% 34%; }
      .vid.face .nm { position: absolute; left: 16px; bottom: 16px; padding: 8px 16px; border-radius: 999px; background: rgba(17,17,22,.6); color: #fff; font-weight: 800; font-size: 24px; z-index: 2; font-family: Inter, sans-serif; }
      .vid.callv { background: #fff; border: 4px solid #1B1815; box-shadow: 0 18px 44px rgba(40, 25, 10, .24); }
      .vid.callv video { inset: auto; width: auto; height: auto; object-fit: fill; transform-origin: 50% 0%; }

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
      .app-bar b { font-weight: 700; } .app-bar span { margin-right: auto; font-weight: 500; color: #8A8172; font-size: 28px; }
      .con-body { padding: 24px 26px 28px; display: flex; flex-direction: column; gap: 18px; }
      .field { position: relative; padding: 16px 22px; border-radius: 18px; background: #F3EEE4; }
      .field small { display: block; font-size: 24px; font-weight: 500; color: #8A8172; }
      .field b { display: block; margin-top: 2px; font-size: 36px; font-weight: 700; text-align: right; font-family: Inter, sans-serif; }
      .ok { position: absolute; left: 22px; top: 50%; margin-top: -30px; width: 60px; height: 60px; border-radius: 50%; background: #2E9E5B; color: #fff; font-style: normal; font-weight: 900; font-size: 36px; display: grid; place-items: center; }
      .qs { position: absolute; left: 51px; top: 440px; width: 900px; display: flex; flex-direction: column; gap: 18px; }
      .q { display: flex; align-items: center; gap: 22px; padding: 18px 24px; border-radius: 22px; background: #FFFDF9; border: 3px solid #2E9E5B; box-shadow: 0 10px 24px rgba(60,40,20,.12); }
      .q i { flex: none; min-width: 120px; height: 70px; padding: 0 14px; border-radius: 18px; background: #2E9E5B; color: #fff; font-style: normal; font-weight: 800; font-size: 36px; display: grid; place-items: center; font-family: Inter, sans-serif; }
      .q b { display: block; font-size: 38px; font-weight: 700; }
      .q span { display: block; font-size: 28px; font-weight: 500; color: #6B6257; }

      /* beat 3 */
      #rules { top: 60px; }
      .rule { position: relative; margin: 24px 26px; padding: 34px 32px 34px 120px; border-radius: 22px; background: #FBEDEA; border: 3px solid #EBC3BC; }
      .rule.good { background: #E9F5EE; border-color: #B9DFC8; }
      .rule b { display: block; font-size: 48px; font-weight: 700; }
      .rule span { display: block; margin-top: 2px; font-size: 30px; font-weight: 500; color: #6B6257; }
      .stamp { position: absolute; left: 22px; top: 50%; margin-top: -40px; width: 80px; height: 80px; border-radius: 50%; color: #fff; font-style: normal; font-weight: 900; font-size: 50px; display: grid; place-items: center; }
      .stamp.no { background: #C63D2F; } .stamp.yes { background: #2E9E5B; }
      .note { position: absolute; left: 195px; top: 800px; width: 612px; padding: 22px 26px; background: #FFF7D6; border-radius: 8px; transform: rotate(2deg); box-shadow: 0 10px 24px rgba(60,40,20,.16); text-align: center; }
      .note b { display: block; font-size: 32px; font-weight: 700; line-height: 1.45; color: #3A352D; }
      .note span { display: block; margin-top: 6px; font: 400 22px/1.3 ui-monospace, Menlo, monospace; color: #6B6257; direction: ltr; }

      /* beat 4 */
      .call-slot { position: absolute; left: ${CALLBOX.x - 8}px; top: ${CALLBOX.y - 8}px; width: ${CALLBOX.w + 16}px; height: ${CALLBOX.h + 16}px; border-radius: 32px; border: 4px solid #2E9E5B; }
      .live { position: absolute; right: 18px; top: 16px; z-index: 9; display: flex; align-items: center; gap: 10px; padding: 8px 20px; border-radius: 999px; background: #C63D2F; color: #fff; font-weight: 700; font-size: 26px; direction: rtl; }
      .live i { width: 14px; height: 14px; border-radius: 50%; background: #fff; }
      .lead { position: absolute; left: 31px; top: 620px; width: 940px; display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
      .lrow { padding: 18px 24px; border-radius: 22px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 10px 24px rgba(60,40,20,.1); }
      .lrow small { display: block; font-size: 26px; font-weight: 500; color: #8A8172; }
      .lrow b { display: block; font-size: 50px; font-weight: 700; line-height: 1.2; }
      .lrow.booked { background: #2E9E5B; border-color: #2E9E5B; } .lrow.booked small { color: #D8F0E2; } .lrow.booked b { color: #fff; }

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

// word cues: Arabic words matched after dropping punctuation and diacritics (the frame's own matcher is Latin-only)
const meta = JSON.parse(readFileSync(resolve(root, "audio_meta.json"), "utf8"));
const norm = (s) => s.replace(/[ً-ْـ]/g, "").replace(/[.,،؟:!«»"]/g, "");
const Bm = {}; let t0 = 0; [...meta.voices].sort((a, b) => a.id.localeCompare(b.id)).forEach((v, i) => { Bm[i + 1] = { start: t0, dur: v.duration_s, words: v.words }; t0 += v.duration_s; });
const W = (i, word, nth = 0) => {
  const hits = Bm[i].words.filter((w) => norm(w.text).startsWith(norm(word)));
  if (!hits[nth]) throw new Error(`beat ${i}: "${word}" #${nth} not found`);
  return +(Bm[i].start + hits[nth].start).toFixed(3);
};
const cues = () => ({
  b1_ask: W(1, "وين"), b1_agent: W(1, "ووكيل"), b1_saudi: W(1, "بالسعودي"), b1_change: W(1, "وغي"),
  b2_voho: W(2, "فوهو"), b2_saudi: W(2, "السعودي"), b2_list: W(2, "قائمة"), b2_status: W(2, "وحالة"),
  b3_rules: W(3, "القواعد"), b3_card: W(3, "البطاقة"), b3_refund: W(3, "باسترجاع"), b3_team: W(3, "الفريق"),
  b4_order: W(4, "رقم"), b4_tonight: W(4, "الليلة"), b4_nine: W(4, "تسعة"), b4_move: W(4, "لبكرة"),
  b5_answer: W(5, "يتجاوب"), b5_after: W(5, "الدوام"), b5_try: W(5, "جربه"),
  cta: +(W(5, "جربه") - 0.1).toFixed(3),
});

const anim = `
      tl.set("#hum-vid", { opacity: 1 }, 0);
      tl.fromTo("#hum-vid video", { scale: 1.25 }, { scale: 1.4, duration: dur(1), ease: "none" }, 0);
      tl.to("#hum-vid", { opacity: 0, scale: 0.95, duration: 0.25, ease: "power2.in" }, D.beats[0].end - 0.25);
      tl.set("#cam-vid", { opacity: 1 }, 0);
      tl.to("#cam-vid", { opacity: 0, scale: 0.9, y: 30, duration: 0.25, ease: "power2.in" }, CAM_OUT - 0.25);
      tl.set("#call-vid", { opacity: 0, scale: 0.9 }, 0);
      tl.to("#call-vid", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)" }, b4 + 0.1);
      tl.fromTo("#call-video", { scale: 1 }, { scale: 1.12, duration: dur(4), ease: "none" }, b4);
      tl.to("#call-vid", { opacity: 0, duration: 0.25 }, D.beats[3].end - 0.25);
      tl.set("#crew-vid", { opacity: 0, y: 40 }, 0);
      tl.to("#crew-vid", { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.5)" }, b5 + 0.1);

      // ── beat 1 ──
      tl.fromTo("#b1ask", { scale: 1 }, { scale: 1.15, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }, C.b1_ask);
      tl.fromTo("#b1real", { scale: 1, rotation: 0 }, { scale: 1.12, rotation: 4, duration: 0.2, yoyo: true, repeat: 1 }, C.b1_agent);
      tl.set("#b1tiles", { opacity: 0 }, 0);
      tl.fromTo("#b1tiles", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.6)" }, CAM_OUT);
      tl.fromTo("#b1tiles .tile.hot", { scale: 1 }, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }, C.b1_change);
      tl.fromTo("#b1greet", { scale: 1 }, { scale: 1.04, duration: 0.25, yoyo: true, repeat: 1 }, C.b1_saudi);
      crowd(1).forEach((id, j) => jump(id, C.b1_change + 0.1 + j * 0.07, 80));

      // ── beat 2 ──
      tl.fromTo("#con", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b2 + 0.05);
      tl.fromTo("#b2lang", { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(2.5)" }, C.b2_saudi);
      ["#q1", "#q2", "#q3"].forEach((q, j) => tl.fromTo(q, { x: -120, opacity: 0, scale: 0.9 }, { x: 0, opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.7)" }, C.b2_list + j * 0.28));
      wiggle("#q1", C.b2_status + 0.3);
      crowd(2).forEach((id, j) => jump(id, C.b2_status + 0.2 + j * 0.07, 70));

      // ── beat 3 ──
      tl.fromTo("#rules", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b3 + 0.05);
      [["#r1", C.b3_rules], ["#r2", C.b3_card + 0.8], ["#r3", C.b3_refund + 0.5]].forEach(([r, t]) => tl.fromTo(r, { x: -90, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power3.out" }, t));
      [["#r1s", C.b3_card + 0.3], ["#r2s", C.b3_refund], ["#r3s", C.b3_team]].forEach(([s, t]) => tl.fromTo(s, { scale: 2.4, opacity: 0, rotation: -25 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.25, ease: "power4.in" }, t));
      tl.fromTo("#b3note", { opacity: 0, y: 20, rotation: 6 }, { opacity: 1, y: 0, rotation: 2, duration: 0.4, ease: "back.out(1.6)" }, C.b3_card + 0.5);
      crowd(3).forEach((id) => slump(id, C.b3_card + 0.4));
      crowd(3).forEach((id, j) => jump(id, C.b3_team + 0.3 + j * 0.07, 80));

      // ── beat 4 ──
      tl.fromTo("#call-slot", { opacity: 0 }, { opacity: 1, duration: 0.3 }, b4 + 0.1);
      tl.fromTo("#b4live i", { opacity: 1 }, { opacity: 0.2, duration: 0.4, yoyo: true, repeat: reps(dur(4), 0.4) }, b4);
      tl.fromTo("#lead", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, b4 + 0.2);
      [["#l1", C.b4_order], ["#l2", C.b4_tonight - 0.3], ["#l3", C.b4_nine], ["#l4", C.b4_move]].forEach(([r, t]) => {
        tl.fromTo(r, { opacity: 0.15, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, t);
      });
      wiggle("#l4", C.b4_move + 0.35);
      crowd(4).forEach((id, j) => jump(id, C.b4_move + 0.2 + j * 0.07, 80));

      // ── beat 5 ──
      tl.fromTo("#ready", { y: 40, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)" }, C.b5_answer - 0.2);
      tl.fromTo("#ready em", { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(2.5)" }, C.b5_answer + 0.2);
      tl.fromTo("#join", { y: 40, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)" }, C.b5_try - 0.3);
      tl.fromTo("#join", { scale: 1 }, { scale: 1.05, duration: 0.35, yoyo: true, repeat: 3, ease: "sine.inOut" }, C.cta + 0.4);
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) => walkIn(e.id, C.b5_after - 0.6, D.beats[4].end - (C.b5_after - 0.6), { from: 0.6 + (j % 3) * 0.12, delay: (j % 4) * 0.08 }));
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) => jump(e.id, C.cta + 0.3 + j * 0.05, 60));
      tl.fromTo("#b5-yar", { scale: 0, y: 40 }, { scale: 1, y: 0, duration: 0.5, ease: "power3.out" }, b5 + 0.1);
      jump("b5-yar", C.b5_answer, 100);
`;

// sounds on the beats of motion (the frame plays one per beat)
const C = cues();
const sdur = (f) => mediaDur("public/sfx/" + f);
const extra = [
  ["pop.mp3", C.b1_ask, 0.4], ["ping.mp3", C.b1_change, 0.35], ["pop.mp3", CAM_OUT, 0.3],
  ["click.mp3", C.b2_saudi, 0.4], ...[0, 1, 2].map((j) => ["pop.mp3", +(C.b2_list + j * 0.28).toFixed(3), 0.38]),
  ["impact-bass-1.mp3", +(C.b3_card + 0.3).toFixed(3), 0.5], ["impact-bass-1.mp3", C.b3_refund, 0.5], ["ding.wav", C.b3_team, 0.4],
  ["tick.wav", C.b4_order, 0.5], ["tick.wav", +(C.b4_tonight - 0.3).toFixed(3), 0.5], ["tick.wav", C.b4_nine, 0.5], ["ding.wav", C.b4_move, 0.5],
  ["ping.mp3", C.b5_answer, 0.4], ["pop.mp3", C.b5_after, 0.35],
];
const extraHtml = extra.map(([f, t, v], k) => `
      <audio id="sx-${k}" src="public/sfx/${f}" data-start="${t}" data-duration="${sdur(f)}" data-track-index="${13 + (k % 3)}" data-volume="${v}"></audio>`).join("");

build(root, {
  pills, card, css, cues, overlay: overlayFor(Bm) + extraHtml,
  anim: `const CAM_OUT = ${CAM_OUT};\n` + anim,
  logo: "voho.svg", logo2: "bank.svg",
  sfx: ["pop", "click", "impact-bass-1", "ping", "ping"],
  ctaHtml: `جربه على <em>app.voho.ai</em>`,
  handle: "@yarmalikhere",
  hold: 1.2,
});
