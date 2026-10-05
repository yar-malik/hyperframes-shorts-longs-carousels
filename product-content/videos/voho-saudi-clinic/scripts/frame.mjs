// The shared frame of the tutorial shorts: cream ground, progress rail, title
// pill, the card, karaoke caption, CTA chip and confetti, bots. A project's
// build.mjs supplies the per-beat card contents, cues, CSS and animation and
// calls build(); everything timed comes from audio_meta.json (the real voice).
//
// v3 of the nocodealex-style frame: any number of beats (the rail spaces its
// stops to fit), and Yar's avatar is his head as a free cutout standing on the
// bot's clothes — not a photo in a framed box.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

export const W = 1080, H = 1920;
export const CARD = { w: 1002, h: 784 }; // the card's content box (3px border)
export const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
export const clip = (id, start, dur, cls, inner, track = 1, extra = "") =>
  `<div id="${id}" class="clip ${cls}" data-start="${start}" data-duration="${+dur.toFixed(3)}" data-track-index="${track}"${extra}>${inner}</div>`;

// ── bots: blocky characters, nocodealex-style ────────────────────────────────
// A bot is a stack of divs sized in em (font-size = width/100) so one --w scales
// the whole figure. Variants are picked deterministically from the bot's index.
const SKINS = ["#F2A33A", "#F5C542", "#3FB8A5", "#4A8FE7", "#F07A6A", "#8E6BD9", "#6CBF5A", "#F28DB2", "#E8734A", "#5CC8E8"];
const SHIRTS = ["#2B4C9B", "#1B1815", "#DC5A2B", "#FFFDF9", "#2E9E5B", "#C63D2F", "#F5C542", "#6B4FBB"];
const HATS = ["", "cap", "hard", "phones", "", "beanie", ""];
const EYES = ["", "glasses", "", "shades", "", "glasses", ""];
const MOUTHS = ["smile", "", "smile", "o", "", "smile"];
const TIES = ["", "tie", "", "pocket", "bow", "", "badge"];
export function bot({ id, w = 120, x = 0, side = "l", k = 0, yar = false, skin, shirt, hat, eyes, mouth, tie, cls = "" }) {
  skin ??= SKINS[k % SKINS.length];
  shirt ??= SHIRTS[(k * 3 + 1) % SHIRTS.length];
  hat ??= HATS[k % HATS.length];
  eyes ??= EYES[(k + 2) % EYES.length];
  mouth ??= MOUTHS[k % MOUTHS.length];
  tie ??= TIES[(k + 1) % TIES.length];
  if (shirt === skin) shirt = "#1B1815";
  const head = yar
    ? `<div class="bot-head bot-head-yar"><img src="public/yar-head.png" alt="" /></div>`
    : `<div class="bot-head">
        ${hat === "cap" ? `<div class="bot-cap"></div><div class="bot-brim"></div>` : ""}
        ${hat === "hard" ? `<div class="bot-hard"></div>` : ""}
        ${hat === "beanie" ? `<div class="bot-beanie"></div>` : ""}
        ${hat === "phones" ? `<div class="bot-phones"></div>` : ""}
        <i class="bot-eye l"></i><i class="bot-eye r"></i>
        ${eyes === "glasses" ? `<div class="bot-glasses"><i></i><i></i></div>` : ""}
        ${eyes === "shades" ? `<div class="bot-shades"></div>` : ""}
        ${mouth ? `<i class="bot-mouth ${mouth}"></i>` : ""}
      </div>`;
  return `<div class="bot ${yar ? "bot-yar" : ""} ${cls}" id="${id}" data-side="${side}" style="--w:${w}px; --skin:${skin}; --shirt:${shirt}; left:${x}px">
    <div class="bot-rig">
      <div class="bot-body">${yar ? `<i class="bot-collar"></i>` : ""}${tie === "tie" ? `<i class="bot-tie"></i>` : ""}${tie === "bow" ? `<i class="bot-bow"></i>` : ""}${tie === "pocket" ? `<i class="bot-pocket"></i>` : ""}${tie === "badge" ? `<i class="bot-badge"></i>` : ""}</div>
      <div class="bot-arm l"></div><div class="bot-arm r"></div>
      <div class="bot-leg l"></div><div class="bot-leg r"></div>
      ${head}
    </div>
  </div>`;
}
export const crowdHtml = (i, rows) => rows.map(([x, w, k, side], j) => bot({ id: `b${i}-bot${j}`, w, x, k, side })).join("");

// ── caption chunks: sentences first, then balanced ≤ MAX-char pieces ─────────
function chunk(b) {
  const MAX = 26;
  const len = (ws) => ws.map((w) => w.text).join(" ").length;
  const sentences = [];
  let cur = [];
  for (const w of b.words) {
    cur.push(w);
    if (/[.,]$/.test(w.text)) { sentences.push(cur); cur = []; }
  }
  if (cur.length) sentences.push(cur);
  const pieces = [];
  for (const sent of sentences) {
    const total = len(sent);
    const n = Math.max(1, Math.ceil(total / MAX));
    let piece = [], made = 0, cum = 0;
    for (const w of sent) {
      piece.push(w);
      cum += w.text.length + 1;
      if (made < n - 1 && cum >= (total / n) * (made + 1)) { pieces.push(piece); piece = []; made++; }
    }
    if (piece.length) pieces.push(piece);
  }
  return pieces.map((ws) => ({ start: +(b.start + ws[0].start).toFixed(3), words: ws.map((w) => ({ text: w.text, at: +(b.start + w.start).toFixed(3) })) }));
}

export function build(root, spec) {
  const mediaDur = (f) => +parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", resolve(root, f)]).toString()).toFixed(3);
  const meta = JSON.parse(readFileSync(resolve(root, "audio_meta.json"), "utf8"));
  const voices = [...meta.voices].sort((a, b) => a.id.localeCompare(b.id));
  const HOLD = spec.hold ?? 1.0; // after the last line: CTA + confetti
  const N = voices.length;

  // beats: start times from the real audio
  let t = 0;
  const beats = voices.map((v, i) => {
    const b = { i: i + 1, start: +t.toFixed(3), dur: v.duration_s, words: v.words, text: v.text };
    t += v.duration_s;
    return b;
  });
  const TOTAL = +(t + HOLD).toFixed(3);
  const B = Object.fromEntries(beats.map((b) => [b.i, b]));
  const beatEnd = (b) => (b.i === N ? TOTAL : B[b.i + 1].start);
  const at = (b, wordText, nth = 0) => {
    const hits = b.words.filter((w) => w.text.toLowerCase().replace(/[^a-z0-9$×]/g, "").startsWith(wordText.toLowerCase()));
    if (!hits[nth]) throw new Error(`beat ${b.i}: word "${wordText}" #${nth} not found in "${b.text}"`);
    return +(b.start + hits[nth].start).toFixed(3);
  };
  const chunks = beats.flatMap(chunk);
  chunks.forEach((c, i) => { c.end = i + 1 < chunks.length ? chunks[i + 1].start : TOTAL; });

  // rail geometry: N stops spread between the first stop and the flag
  const RAIL = { y: 292, x0: 80, x1: 1000 };
  const STOP0 = 110, STOPN = 860;
  const stopX = (i) => Math.round(STOP0 + ((i - 1) * (STOPN - STOP0)) / (N - 1));
  const FLAG_X = RAIL.x1;

  const cues = spec.cues(B, at);
  const CTA_AT = cues.cta;

  const stopsHtml = beats.map((b) => `
      <div class="stop" data-layout-allow-occlusion style="left:${stopX(b.i) - 22}px">
        <span class="stop-num">${b.i}</span>
        <svg class="stop-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>`).join("");

  const pillsHtml = beats.map((b) => clip(`pill-${b.i}`, b.start, beatEnd(b) - b.start, "pill-slot", `
      <div class="pill" id="pill-in-${b.i}">
        <div class="pill-logo"><div class="pill-glyph"></div></div>
        <div class="pill-text"><div class="pill-l1">${esc(spec.pills[b.i][0])}</div><div class="pill-l2">${esc(spec.pills[b.i][1])}</div></div>
      </div>`, 2)).join("");

  const cardsHtml = beats.map((b) => clip(`beat-${b.i}`, b.start, beatEnd(b) - b.start, `card-beat b${b.i}`, `<div class="beat-inner" id="inner-${b.i}">${spec.card[b.i]}</div>`)).join("");

  const capsHtml = chunks.map((c, i) => clip(`cap-${i}`, c.start, c.end - c.start, "cap",
    `<div class="cap-ghost" data-layout-ignore>${c.words.map((w) => `<span class="w">${esc(w.text)}</span>`).join(" ")}</div>` +
    `<div class="cap-live">${c.words.map((w, j) => `<span class="w" id="cap-${i}-${j}">${esc(w.text)}</span>`).join(" ")}</div>`, 3)).join("");

  const confettiHtml = Array.from({ length: 34 }, (_, i) => `<span class="cf" style="--c:${["#DC5A2B", "#F5C542", "#2E9E5B", "#4A8FE7", "#F07A6A", "#8E6BD9"][i % 6]}"></span>`).join("");

  const bgmDur = mediaDur("public/bgm.wav");
  const audioHtml = beats.map((b) => `
    <audio id="vo-${b.i}" src=".media/audio/voice/${String(b.i).padStart(2, "0")}.wav" data-start="${b.start}" data-duration="${b.dur}" data-track-index="10" data-volume="1"></audio>`).join("") +
    spec.sfx.map((n, j) => `
    <audio id="sfx-${j + 1}" src="public/sfx/${n}.mp3" data-start="${B[j + 1].start}" data-duration="${mediaDur(`public/sfx/${n}.mp3`)}" data-track-index="11" data-volume="0.35"></audio>`).join("") +
    `
    <audio id="sfx-cta" src="public/sfx/whoosh-short.mp3" data-start="${CTA_AT}" data-duration="${mediaDur("public/sfx/whoosh-short.mp3")}" data-track-index="11" data-volume="0.4"></audio>
    <audio id="bgm" src="public/bgm.wav" data-start="0" data-duration="${Math.min(bgmDur, TOTAL)}" data-track-index="12" data-volume="0.55"></audio>`;

  const data = {
    total: TOTAL,
    beats: beats.map((b) => ({ i: b.i, start: b.start, dur: b.dur, end: beatEnd(b) })),
    stops: beats.map((b) => stopX(b.i)),
    rail: RAIL, flagX: FLAG_X,
    caps: chunks.map((c, i) => c.words.map((w, j) => ({ id: `cap-${i}-${j}`, at: w.at }))).flat(),
    cues,
  };

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Fraunces"; font-weight: 800; font-style: normal; src: url("public/fonts/fraunces-800.woff2") format("woff2"); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #ECE7DE; }
      body { font-family: "Inter", sans-serif; color: #1B1815; -webkit-font-smoothing: antialiased; }
      #root { position: absolute; inset: 0; width: ${W}px; height: ${H}px; overflow: hidden;
        background: radial-gradient(120% 80% at 50% 30%, #F3EFE7 0%, #ECE7DE 60%, #E4DED2 100%); }
      .clip { position: absolute; }
      .ghost { position: absolute; right: -140px; bottom: 60px; width: 620px; height: 620px; opacity: .07; background: #DC5A2B;
        -webkit-mask: url("public/logos/${spec.logo}") center/contain no-repeat; mask: url("public/logos/${spec.logo}") center/contain no-repeat; }
      .ghost2 { position: absolute; left: -180px; top: 560px; width: 420px; height: 420px; opacity: .05; background: #1B1815;
        -webkit-mask: url("public/logos/${spec.logo2}") center/contain no-repeat; mask: url("public/logos/${spec.logo2}") center/contain no-repeat; }

      /* rail */
      .rail { position: absolute; left: 0; top: 0; width: ${W}px; height: 400px; z-index: 6; }
      .rail-track { position: absolute; left: ${RAIL.x0}px; top: ${RAIL.y - 5}px; width: ${RAIL.x1 - RAIL.x0}px; height: 10px; border-radius: 5px; background: #D9D2C4; }
      .rail-fill { position: absolute; left: ${RAIL.x0}px; top: ${RAIL.y - 5}px; width: ${RAIL.x1 - RAIL.x0}px; height: 10px; border-radius: 5px; background: #DC5A2B; transform-origin: 0 50%; }
      .stop { position: absolute; top: ${RAIL.y - 22}px; width: 44px; height: 44px; border-radius: 50%; background: #F7F3EA; border: 3px solid #D9D2C4;
        display: grid; place-items: center; font-weight: 700; font-size: 22px; color: #8A8172; }
      .stop-num { grid-area: 1/1; }
      .stop-check { grid-area: 1/1; width: 26px; height: 26px; opacity: 0; }
      .marker { position: absolute; left: ${stopX(1) - 40}px; top: ${RAIL.y - 100}px; width: 80px; height: 124px; }
      .marker .bot { left: 6px; bottom: 0; }
      .marker-ring { position: absolute; left: 12px; bottom: 6px; width: 56px; height: 18px; border-radius: 50%; background: rgba(220, 90, 43, .28); }
      .flag { position: absolute; left: ${FLAG_X - 26}px; top: ${RAIL.y - 26}px; width: 52px; height: 52px; border-radius: 14px; background: #F7F3EA; border: 3px solid #D9D2C4; display: grid; place-items: center; }
      .flag svg { width: 28px; height: 28px; }

      /* pill */
      .pill-slot { left: 0; top: 330px; width: ${W}px; height: 160px; display: flex; justify-content: center; align-items: flex-start; z-index: 5; }
      .pill { display: flex; align-items: center; gap: 22px; padding: 16px 44px 16px 16px; background: #FFFDF9; border-radius: 34px;
        box-shadow: 0 14px 34px rgba(60, 40, 20, .16), 0 2px 0 rgba(255,255,255,.8) inset; border: 2px solid #EFE8DC; }
      .pill-logo { width: 112px; height: 112px; border-radius: 26px; background: #F5E6D6; display: grid; place-items: center; flex: none; }
      .pill-glyph { width: 62px; height: 62px; background: #DC5A2B; -webkit-mask: url("public/logos/${spec.logo}") center/contain no-repeat; mask: url("public/logos/${spec.logo}") center/contain no-repeat; }
      .pill-text { font-weight: 900; font-size: 46px; line-height: 1.06; text-transform: uppercase; letter-spacing: -.012em; white-space: nowrap; }
      .pill-l1 { color: #1B1815; }
      .pill-l2 { color: #DC5A2B; }

      /* card */
      .card { position: absolute; left: 36px; top: 380px; width: 1008px; height: 790px; border-radius: 38px; background: #F8F5EF; border: 3px solid #E4DCCE;
        box-shadow: 0 24px 60px rgba(60, 40, 20, .14); overflow: hidden; }
      .card-beat { left: 0; top: 0; width: ${CARD.w}px; height: ${CARD.h}px; overflow: hidden; }
      .beat-inner { position: absolute; inset: 0; }
      .floor { position: absolute; left: 0; bottom: 0; width: ${CARD.w}px; height: 26px; background: linear-gradient(180deg, rgba(60,40,20,.06), rgba(60,40,20,.14)); }
      .chip { position: absolute; transform-origin: 50% 50%; padding: 14px 26px; border-radius: 999px; font-weight: 900; font-size: 30px; letter-spacing: .01em; text-transform: uppercase; white-space: nowrap;
        box-shadow: 0 8px 20px rgba(60, 40, 20, .18); z-index: 3; }
      .chip-orange { background: #DC5A2B; color: #fff; }
      .chip-ink { background: #1B1815; color: #fff; }
      .chip-green { background: #2E9E5B; color: #fff; }
      .chip-red { background: #C63D2F; color: #fff; }
      .chip-muted { background: #FFFDF9; color: #6E6558; border: 2px solid #E4DCCE; box-shadow: none; font-weight: 700; text-transform: none; font-size: 24px; padding: 10px 20px; }

      /* bots */
      .bot { position: absolute; bottom: 10px; width: var(--w); height: calc(var(--w) * 1.42); font-size: calc(var(--w) / 100); z-index: 2; }
      .bot-rig { position: absolute; inset: 0; transform-origin: 50% 100%; }
      .bot-head { position: absolute; left: 8em; top: 0; width: 84em; height: 70em; border-radius: 12em; background: var(--skin);
        box-shadow: inset -11em 0 0 rgba(0,0,0,.14), inset 0 7em 0 rgba(255,255,255,.22); transform-origin: 50% 100%; }
      /* Yar: the head is his own cutout, no frame, standing on the shirt */
      .bot-head-yar { left: -8em; top: -18em; width: 116em; height: 96em; border-radius: 0; background: none; box-shadow: none; overflow: visible; transform-origin: 50% 90%; }
      .bot-head-yar img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: contain; object-position: 50% 100%; display: block;
        filter: drop-shadow(0 3em 5em rgba(60,40,20,.22)); }
      .bot-eye { position: absolute; top: 30em; width: 10em; height: 11em; background: #1B1815; border-radius: 2em; }
      .bot-eye.l { left: 22em; } .bot-eye.r { left: 52em; }
      .bot-mouth { position: absolute; left: 34em; top: 50em; width: 16em; height: 5em; background: #1B1815; border-radius: 0 0 6em 6em; }
      .bot-mouth.o { left: 37em; width: 10em; height: 9em; border-radius: 50%; }
      .bot-glasses { position: absolute; left: 14em; top: 24em; width: 56em; height: 22em; display: flex; justify-content: space-between; }
      .bot-glasses i { width: 24em; height: 22em; border: 3.5em solid #1B1815; border-radius: 6em; background: rgba(255,255,255,.35); }
      .bot-shades { position: absolute; left: 16em; top: 26em; width: 52em; height: 18em; background: #1B1815; border-radius: 4em; }
      .bot-cap { position: absolute; left: -2em; top: -10em; width: 88em; height: 20em; background: var(--shirt); border-radius: 10em 10em 3em 3em; box-shadow: inset -8em 0 0 rgba(0,0,0,.14); }
      .bot-brim { position: absolute; left: 60em; top: 4em; width: 34em; height: 8em; background: var(--shirt); border-radius: 0 4em 4em 0; }
      .bot-hard { position: absolute; left: -4em; top: -14em; width: 92em; height: 26em; background: #F5C542; border-radius: 40em 40em 4em 4em; box-shadow: inset -10em 0 0 rgba(0,0,0,.12); }
      .bot-beanie { position: absolute; left: -2em; top: -12em; width: 88em; height: 22em; background: #C63D2F; border-radius: 30em 30em 4em 4em; box-shadow: inset 0 -6em 0 rgba(255,255,255,.25); }
      .bot-phones { position: absolute; left: -8em; top: 18em; width: 100em; height: 30em; border: 6em solid #1B1815; border-bottom: none; border-radius: 40em 40em 0 0; }
      .bot-body { position: absolute; left: 18em; top: 66em; width: 64em; height: 46em; border-radius: 8em; background: var(--shirt); box-shadow: inset -9em 0 0 rgba(0,0,0,.14); }
      .bot-yar .bot-body { left: 14em; top: 64em; width: 72em; height: 48em; border-radius: 14em 14em 8em 8em; }
      .bot-collar { position: absolute; left: 22em; top: 0; width: 28em; height: 10em; background: #FFFDF9; border-radius: 0 0 14em 14em; opacity: .9; }
      .bot-tie { position: absolute; left: 27em; top: 2em; width: 10em; height: 26em; background: #C63D2F; clip-path: polygon(0 0, 100% 0, 80% 100%, 20% 100%); }
      .bot-bow { position: absolute; left: 20em; top: 4em; width: 24em; height: 10em; background: #C63D2F; clip-path: polygon(0 0, 50% 40%, 100% 0, 100% 100%, 50% 60%, 0 100%); }
      .bot-pocket { position: absolute; left: 10em; top: 10em; width: 14em; height: 12em; background: rgba(255,255,255,.35); border-radius: 2em; }
      .bot-badge { position: absolute; left: 40em; top: 10em; width: 12em; height: 12em; background: #F5C542; border-radius: 50%; }
      .bot-arm { position: absolute; top: 70em; width: 13em; height: 30em; border-radius: 5em; background: var(--skin); transform-origin: 50% 10%; box-shadow: inset -4em 0 0 rgba(0,0,0,.12); }
      .bot-arm.l { left: 4em; } .bot-arm.r { left: 83em; }
      .bot-leg { position: absolute; top: 108em; width: 22em; height: 34em; border-radius: 4em 4em 6em 6em; background: var(--skin); transform-origin: 50% 0; box-shadow: inset 0 -9em 0 #1B1815, inset -5em 0 0 rgba(0,0,0,.12); }
      .bot-leg.l { left: 24em; } .bot-leg.r { left: 54em; }
      .bot-yar .bot-leg, .bot-yar .bot-arm { background: #2B4C9B; }
      .bot-yar .bot-arm { top: 72em; }

      /* caption — the serif line under the card, spoken words in orange, the rest ghosted */
      .cap { left: 70px; top: 1235px; width: 940px; font-family: "Fraunces", "Playfair Display", serif; font-weight: 800; font-size: 62px; line-height: 1.22; }
      .cap-ghost, .cap-live { position: absolute; left: 0; top: 0; width: 940px; text-align: center; }
      .cap-ghost { color: #E4D3C2; }
      .cap-live { color: #DC5A2B; }
      .cap-live .w { opacity: 0; display: inline-block; transform-origin: 50% 80%; }

      /* cta + confetti + handle */
      .cta { left: 0; top: 1455px; width: ${W}px; display: flex; justify-content: center; }
      .cta-chip { display: inline-flex; align-items: center; gap: 18px; padding: 18px 34px; border-radius: 999px; background: #1B1815; color: #fff; font-weight: 800; font-size: 32px; box-shadow: 0 12px 30px rgba(30, 20, 10, .25); }
      .cta-chip .tri { width: 0; height: 0; border-left: 22px solid #DC5A2B; border-top: 13px solid transparent; border-bottom: 13px solid transparent; }
      .cta-chip em { font-style: normal; color: #E8B79E; font-weight: 700; }
      .confetti { left: 0; top: 1200px; width: ${W}px; height: 700px; pointer-events: none; }
      .cf { position: absolute; left: 540px; top: 300px; width: 14px; height: 22px; border-radius: 3px; background: var(--c); opacity: 0; }
      .handle { position: absolute; left: 0; top: 1790px; width: ${W}px; text-align: center; font-weight: 700; font-size: 28px; letter-spacing: .04em; color: #7A7164; }

${spec.css}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="${W}" data-height="${H}">
      <div class="ghost" id="ghost"></div>
      <div class="ghost2" id="ghost2"></div>

      <div class="rail">
        <div class="rail-track"></div>
        <div class="rail-fill" id="rail-fill"></div>${stopsHtml}
        <div class="flag" id="flag"><svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" fill="#DC5A2B"/></svg></div>
        <div class="marker" id="marker"><div class="marker-ring"></div>${bot({ id: "marker-bot", w: 68, x: 0, side: "c", yar: true, shirt: "#DC5A2B" })}</div>
      </div>

      ${pillsHtml}

      <div class="card">
        ${cardsHtml}
        <div class="floor"></div>
      </div>

      ${capsHtml}

      ${clip("cta", CTA_AT, TOTAL - CTA_AT, "cta", `<div class="cta-chip" id="cta-chip"><span class="tri"></span>${spec.ctaHtml}</div>`, 2)}
      ${clip("confetti", CTA_AT, TOTAL - CTA_AT, "confetti", confettiHtml, 2, " data-layout-ignore")}
      <div class="handle">${esc(spec.handle)}</div>
      ${audioHtml}
    </div>

    <script id="data" type="application/json">${JSON.stringify(data)}</script>
    <script>
      const D = JSON.parse(document.getElementById("data").textContent);
      const tl = gsap.timeline({ paused: true });
      const C = D.cues;
      const N = D.beats.length;
      const reps = (span, cycle) => Math.max(0, Math.floor(span / cycle) - 1);
      const pop = (sel, t, dur = 0.5, from = {}) =>
        tl.fromTo(sel, { scale: 0, ...from }, { scale: 1, x: 0, duration: dur, ease: "power3.out" }, t);
      // a chip that has landed keeps a little life: a short rock, then still
      const wiggle = (sel, t) => tl.fromTo(sel, { rotation: -3 }, { rotation: 3, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 3 }, t);
      // seek-safe typewriter: the visible prefix is a function of time
      const type = (sel, text, t, dur) => {
        const o = { n: 0 };
        tl.to(o, { n: text.length, duration: dur, ease: "none", onUpdate: () => { const e = document.querySelector(sel); if (e) e.textContent = text.slice(0, Math.round(o.n)); } }, t);
      };

      // ── bots ──────────────────────────────────────────────────────────────
      // walk-in from the bot's side, legs and arms swinging, then an idle bob for
      // the rest of the beat. Everything finite and seek-safe.
      function walkIn(id, t, span, { from = 0.9, delay = 0 } = {}) {
        const el = document.getElementById(id);
        if (!el) return;
        const side = el.dataset.side;
        const dx = side === "l" ? -720 : side === "r" ? 720 : 0;
        const t0 = t + delay;
        const steps = Math.max(1, Math.round(from / 0.14) - 1);
        if (dx) {
          tl.fromTo(el, { x: dx }, { x: 0, duration: from, ease: "power2.out" }, t0);
          tl.fromTo(el.querySelector(".bot-leg.l"), { rotation: -22 }, { rotation: 22, duration: 0.14, yoyo: true, repeat: steps, ease: "sine.inOut" }, t0);
          tl.fromTo(el.querySelector(".bot-leg.r"), { rotation: 22 }, { rotation: -22, duration: 0.14, yoyo: true, repeat: steps, ease: "sine.inOut" }, t0);
          tl.fromTo(el.querySelector(".bot-arm.l"), { rotation: 18 }, { rotation: -18, duration: 0.14, yoyo: true, repeat: steps, ease: "sine.inOut" }, t0);
          tl.fromTo(el.querySelector(".bot-arm.r"), { rotation: -18 }, { rotation: 18, duration: 0.14, yoyo: true, repeat: steps, ease: "sine.inOut" }, t0);
          tl.fromTo(el.querySelector(".bot-rig"), { y: 0 }, { y: -6, duration: 0.14, yoyo: true, repeat: steps, ease: "sine.inOut" }, t0);
        } else {
          tl.fromTo(el, { scale: 0, y: 40 }, { scale: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0);
        }
        // idle: breathe + head tilt, offset by the bot's own x so they never sync
        const seed = (parseFloat(el.style.left) || 0) / 1000;
        const idleStart = t0 + from + 0.05;
        const left = span - (idleStart - t);
        if (left > 1.2) {
          tl.fromTo(el.querySelector(".bot-rig"), { scaleY: 1 }, { scaleY: 1.04, duration: 0.55 + seed * 0.3, yoyo: true, repeat: reps(left, 0.55 + seed * 0.3), ease: "sine.inOut" }, idleStart);
          tl.fromTo(el.querySelector(".bot-head"), { rotation: -3 + seed * 4 }, { rotation: 3 - seed * 4, duration: 0.9 + seed, yoyo: true, repeat: reps(left, 0.9 + seed), ease: "sine.inOut" }, idleStart);
        }
      }
      function jump(id, t, h = 90) {
        const el = document.getElementById(id);
        if (!el) return;
        tl.fromTo(el.querySelector(".bot-rig"), { y: 0 }, { y: -h, duration: 0.28, ease: "power2.out", yoyo: true, repeat: 1 }, t);
        tl.fromTo(el.querySelector(".bot-arm.l"), { rotation: 0 }, { rotation: 150, duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 }, t);
        tl.fromTo(el.querySelector(".bot-arm.r"), { rotation: 0 }, { rotation: -150, duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 }, t);
      }
      function pointUp(id, t, arm = "r") {
        const el = document.getElementById(id);
        if (!el) return;
        tl.to(el.querySelector(".bot-arm." + arm), { rotation: arm === "r" ? -160 : 160, duration: 0.35, ease: "back.out(1.4)" }, t);
      }
      function slump(id, t) {
        const el = document.getElementById(id);
        if (!el) return;
        tl.to(el.querySelector(".bot-head"), { rotation: 14, y: 6, duration: 0.4, ease: "power2.out" }, t);
        tl.to(el.querySelector(".bot-rig"), { scaleY: 0.94, duration: 0.4, ease: "power2.out" }, t);
      }
      const crowd = (i) => Array.from(document.querySelectorAll("#beat-" + i + " .bot:not(.bot-yar):not(.no-walk)")).map((e) => e.id);
      D.beats.forEach((b) => {
        crowd(b.i).forEach((id, j) => walkIn(id, b.start, b.end - b.start, { from: 0.8 + (j % 3) * 0.18, delay: 0.05 + j * 0.09 }));
      });

      // ── ambient: ghosts turn, pill breathes, marker bobs ──
      tl.fromTo("#ghost", { rotation: 0 }, { rotation: 90, duration: D.total, ease: "none" }, 0);
      tl.fromTo("#ghost2", { rotation: 0 }, { rotation: -60, duration: D.total, ease: "none" }, 0);
      tl.fromTo("#marker-bot .bot-rig", { scaleY: 1 }, { scaleY: 1.05, duration: 0.5, yoyo: true, repeat: reps(D.total, 0.5), ease: "sine.inOut" }, 0);
      tl.fromTo("#marker-bot .bot-head", { rotation: -4 }, { rotation: 4, duration: 1.1, yoyo: true, repeat: reps(D.total, 1.1), ease: "sine.inOut" }, 0);

      // ── rail: fill + marker hop at each beat, previous stop turns green ──
      const railW = D.rail.x1 - D.rail.x0;
      tl.set("#rail-fill", { scaleX: (D.stops[0] - D.rail.x0) / railW }, 0);
      const hopTo = (x, t) => {
        tl.to("#marker", { x, duration: 0.55, ease: "power2.inOut" }, t);
        tl.to("#marker", { y: -46, duration: 0.27, ease: "power2.out", yoyo: true, repeat: 1 }, t);
        tl.fromTo("#marker-bot .bot-leg.l", { rotation: 0 }, { rotation: -35, duration: 0.27, yoyo: true, repeat: 1, ease: "power2.out" }, t);
        tl.fromTo("#marker-bot .bot-leg.r", { rotation: 0 }, { rotation: 35, duration: 0.27, yoyo: true, repeat: 1, ease: "power2.out" }, t);
      };
      const stops = document.querySelectorAll(".stop");
      const tick = (stop, t) => {
        tl.to(stop, { backgroundColor: "#2E9E5B", borderColor: "#2E9E5B", duration: 0.25 }, t);
        tl.to(stop.querySelector(".stop-num"), { opacity: 0, duration: 0.15 }, t);
        tl.to(stop.querySelector(".stop-check"), { opacity: 1, duration: 0.2 }, t + 0.1);
        tl.fromTo(stop, { scale: 1 }, { scale: 1.3, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" }, t);
      };
      D.beats.forEach((b, i) => {
        if (i === 0) return;
        tl.to("#rail-fill", { scaleX: (D.stops[i] - D.rail.x0) / railW, duration: 0.55, ease: "power3.inOut" }, b.start);
        hopTo(D.stops[i] - D.stops[0], b.start);
        tick(stops[i - 1], b.start + 0.1);
      });
      const last = D.beats[N - 1], lastEnd = last.start + last.dur;
      tl.to("#rail-fill", { scaleX: 1, duration: 0.55, ease: "power3.inOut" }, lastEnd - 0.4);
      hopTo(D.flagX - D.stops[0], lastEnd - 0.4);
      tick(stops[N - 1], lastEnd - 0.3);
      tl.fromTo("#flag", { scale: 1, rotation: 0 }, { scale: 1.4, rotation: 20, duration: 0.25, ease: "power2.out" }, lastEnd + 0.1);
      tl.to("#flag", { scale: 1, rotation: 0, duration: 0.4, ease: "power3.out" }, lastEnd + 0.35);

      // ── pill text swaps (spring-pop-entrance) + a breath while it holds ──
      D.beats.forEach((b) => {
        tl.fromTo("#pill-in-" + b.i, { scale: b.i === 1 ? 0.96 : 0.8, opacity: b.i === 1 ? 1 : 0, y: b.i === 1 ? 0 : 18, rotation: b.i === 1 ? 0 : (b.i % 2 ? -3 : 3) },
          { scale: 1, opacity: 1, y: 0, rotation: 0, duration: 0.45, ease: "power3.out" }, b.start);
        const hold = b.end - b.start - 0.5;
        tl.fromTo("#pill-in-" + b.i, { y: 0 }, { y: -6, duration: 0.7, yoyo: true, repeat: reps(hold, 0.7), ease: "sine.inOut" }, b.start + 0.5);
      });

      // ── beat transitions: each card scene slides in from the right and leaves left ──
      D.beats.forEach((b) => {
        if (b.i > 1) tl.fromTo("#inner-" + b.i, { x: 260, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, b.start);
        if (b.i < N) tl.to("#inner-" + b.i, { x: -200, opacity: 0, duration: 0.3, ease: "power2.in" }, b.end - 0.3);
      });

      // ── captions: each word pops on at its own time ──
      D.caps.forEach((w) => tl.fromTo("#" + w.id, { opacity: 0, scale: 1.35, y: 6 }, { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: "power3.out" }, w.at));

      // each beat's start, as a number, so cues can be written relative to it
      const [b1, b2, b3, b4, b5, b6] = D.beats.map((b) => b.start);
      const dur = (i) => D.beats[i - 1].dur;

${spec.anim}

      // ── close: CTA chip + confetti ──
      tl.fromTo("#cta-chip", { scale: 0.7, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, C.cta);
      tl.fromTo("#cta-chip", { y: 0 }, { y: -6, duration: 0.5, yoyo: true, repeat: reps(D.total - C.cta - 0.5, 0.5), ease: "sine.inOut" }, C.cta + 0.5);
      // confetti: seeded by index, gravity via a second tween
      const cf = gsap.utils.toArray(".cf");
      cf.forEach((p, i) => {
        const a = (i * 0.83) % (Math.PI * 2), r = 260 + (i * 37) % 220;
        tl.fromTo(p, { x: 0, y: 0, opacity: 0, rotation: 0, scale: 0.6 }, { x: Math.cos(a) * r, y: -Math.abs(Math.sin(a)) * r - 120, opacity: 1, rotation: 180 + i * 37, scale: 1, duration: 0.6, ease: "power2.out" }, C.cta + 0.15 + (i % 5) * 0.02);
        tl.to(p, { y: "+=420", rotation: "+=180", duration: 1.4, ease: "power1.in" }, C.cta + 0.75 + (i % 5) * 0.02);
        tl.to(p, { opacity: 0, duration: 0.4 }, C.cta + 1.75);
      });
      tl.to({}, { duration: 0.01 }, D.total - 0.01);

      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
  writeFileSync(resolve(root, "index.html"), html);
  console.log(`index.html: ${beats.length} beats, ${chunks.length} caption chunks, ${TOTAL}s, bgm ${bgmDur}s, cta at ${CTA_AT}s`);
  return { beats, TOTAL, chunks };
}
