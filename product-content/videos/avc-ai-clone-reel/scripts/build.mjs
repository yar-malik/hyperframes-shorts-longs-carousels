// Generate index.html from audio_meta.json. Beat durations are the real voice durations; every word-cued move is an
// absolute time from the synthesizer's word alignment. Re-run after re-recording:
//
//   node scripts/build.mjs
//
// AVC: "This isn't me talking. It's my AI clone." Every fact is real: the clone is Yar's HeyGen avatar
// (scripts/avatar/say.mjs) saying the hook in his ElevenLabs voice, trained on 61 s of 4K footage
// (content/avatar/avatar-training-video.mp4), and that 5.2 s line took 49 s to render.
// v4 frame (scripts/frame.mjs): the card fills the screen, 1002×1174. Videos can't sit inside a timed card, so the
// two clone clips play in the overlay, placed over the card (card content origin: page x 39, y 359).
import { resolve } from "node:path";
import { build, bot, crowdHtml, CARD } from "./frame.mjs";

const root = resolve(import.meta.dirname, "..");
const O = { x: 39, y: 359 };                      // card content box, in page px
const HOOK = { x: 31, y: 40, w: 940, h: 640 };    // the clone saying the hook, card px
const REPLAY = { x: 51, y: 400, w: 900, h: 506 }; // the clone again in beat 4

const pills = {
  1: ["This isn't me", "It's my AI clone"],
  2: ["Step 1 · Film yourself", "One minute, good light"],
  3: ["Step 2 · HeyGen", "It learns how you move"],
  4: ["Step 3 · ElevenLabs", "Type it, your clone says it"],
  5: ["Step-by-step guide", "Join my Skool community"],
};

const crowds = {
  1: [[40, 140, 0, "l"], [822, 144, 3, "r"]],
  2: [[830, 150, 6, "r"]],
  3: [[30, 130, 10, "l"], [842, 130, 7, "r"]],
  4: [[40, 130, 12, "l"], [832, 130, 13, "r"]],
};

const card = {
  // 1 — the cover: the clone (overlay) with its badge, and the two real numbers under it. Set at t = 0.
  1: `
    <div class="frame-hook" id="b1frame"></div>
    <div class="tiles" id="b1tiles">
      <div class="tile"><b>61 s</b><span>of real footage</span></div>
      <div class="tile hot"><b>49 s</b><span>to make this clip</span></div>
    </div>
    ${crowdHtml(1, crowds[1])}
    ${bot({ id: "b1-yar", w: 190, x: 406, side: "c", yar: true, shirt: "#DC5A2B" })}`,
  // 2 — the real training footage, on a camera screen with a timer
  2: `
    <div class="cam-ui" id="cam-ui">
      <img src="public/broll/training.jpg" alt="">
      <div class="rec"><i></i><span id="rec-t">00:00</span></div>
      <div class="cam-meta">4K · 30 fps</div>
    </div>
    <div class="chip chip-orange b2-chip" id="b2chip">1 minute · good light</div>
    <div class="note" id="b2note">talk straight to the lens, like a video call</div>
    ${crowdHtml(2, crowds[2])}
    ${bot({ id: "b2-yar", w: 170, x: 30, side: "l", yar: true, shirt: "#DC5A2B" })}`,
  // 3 — HeyGen builds the avatar
  3: `
    <div class="app" id="hg">
      <div class="app-bar"><b>HeyGen</b><span>Instant Avatar</span></div>
      <div class="hg-body">
        <div class="hg-file"><i class="hg-play"></i><div><b>yar-talking.mp4</b><span>1:01 · 4K</span></div></div>
        <div class="bar"><i id="hg-bar"></i></div>
        <div class="hg-status" id="hg-status"><span id="hg-status-t">Training your avatar…</span></div>
        <div class="hg-out" id="hg-out"><img src="public/broll/clone-still.jpg" alt=""><div class="ok">Avatar ready ✓</div></div>
      </div>
    </div>
    <div class="chip chip-green b3-chip" id="b3chip">Moves like you</div>
    ${crowdHtml(3, crowds[3])}`,
  // 4 — ElevenLabs: a typed line becomes the clone talking (the clip itself plays in the overlay)
  4: `
    <div class="app" id="el">
      <div class="app-bar"><b>ElevenLabs</b><span>Your voice clone</span></div>
      <div class="el-body">
        <div class="el-text" id="el-text"><span id="el-typed"></span><i class="caret"></i></div>
        <div class="wave" id="wave">${Array.from({ length: 34 }, (_, i) => `<i style="--h:${18 + ((i * 37) % 70)}px"></i>`).join("")}</div>
      </div>
    </div>
    <div class="replay-slot" id="replay-slot"></div>
    <div class="chip chip-green b4-chip" id="b4chip">Rendered in 49 s</div>
    ${crowdHtml(4, crowds[4])}`,
  // 5 — the real AI Video Club page on Skool, and the crowd
  5: `
    <div class="skool" id="skool"><img src="public/broll/skool-cover.png" alt=""></div>
    <div class="tiles tiles5" id="b5tiles">
      <div class="tile"><b>101</b><span>creators inside</span></div>
      <div class="tile hot"><b>Step by step</b><span>the full clone guide</span></div>
    </div>
    <div class="join" id="join"><span>Clone yourself, step by step</span><b>Join · link in bio →</b></div>
    ${[0, 1, 2, 3].map((j) => bot({ id: `b5-l${j}`, w: 104, x: 160 + j * 100, side: "l", k: 20 + j, cls: "no-walk b5-crowd" })).join("")}
    ${[0, 1, 2, 3].map((j) => bot({ id: `b5-r${j}`, w: 104, x: 560 + j * 100, side: "r", k: 24 + j, cls: "no-walk b5-crowd" })).join("")}
    ${bot({ id: "b5-yar", w: 150, x: 6, side: "c", yar: true, shirt: "#DC5A2B" })}`,
};

// the clone clips, over the card (videos can't sit inside a timed card)
const at = (r) => `left:${O.x + r.x}px; top:${O.y + r.y}px; width:${r.w}px; height:${r.h}px`;
const overlayFor = (B) => `
      <div class="vid" id="hook-vid" style="${at(HOOK)}">
        <video class="clip" id="hook-video" src="public/cam.mp4" data-start="0" data-duration="${B[1].dur}" data-track-index="8" data-media-start="0" muted playsinline></video>
        <div class="badge-ai" id="badge-ai">AI CLONE</div>
      </div>
      <div class="vid" id="replay-vid" style="${at(REPLAY)}">
        <video class="clip" id="replay-video" src="public/cam.mp4" data-start="${B[4].start + 2.2}" data-duration="${Math.max(0.5, B[4].dur - 2.2)}" data-track-index="9" data-media-start="0" muted playsinline></video>
      </div>`;

const css = `
      .vid { position: absolute; border-radius: 26px; overflow: hidden; background: #111; z-index: 7; box-shadow: 0 18px 44px rgba(40, 25, 10, .24); }
      .vid video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 47% 38%; }

      /* beat 1 */
      .frame-hook { position: absolute; left: ${HOOK.x - 8}px; top: ${HOOK.y - 8}px; width: ${HOOK.w + 16}px; height: ${HOOK.h + 16}px; border-radius: 32px; border: 4px solid #DC5A2B; box-shadow: 0 0 0 10px rgba(220, 90, 43, .14); }
      .badge-ai { position: absolute; right: 22px; top: 22px; z-index: 2; padding: 12px 22px; border-radius: 999px; background: #C63D2F; color: #fff; font-weight: 900; font-size: 30px; letter-spacing: .06em; }
      .tiles { position: absolute; left: 31px; top: 718px; width: 940px; display: flex; gap: 20px; }
      .tile { flex: 1; padding: 26px 16px 22px; border-radius: 24px; background: #FFFDF9; border: 3px solid #E4DCCE; text-align: center; }
      .tile b { display: block; font-weight: 900; font-size: 76px; letter-spacing: -.04em; line-height: 1; color: #1B1815; }
      .tile span { display: block; margin-top: 10px; font-weight: 800; font-size: 24px; text-transform: uppercase; letter-spacing: .07em; color: #8A8172; }
      .tile.hot { border-color: #DC5A2B; } .tile.hot b { color: #DC5A2B; }

      /* beat 2 — the camera */
      .cam-ui { position: absolute; left: 31px; top: 40px; width: 940px; height: 640px; border-radius: 26px; overflow: hidden; border: 6px solid #1B1815; box-shadow: 0 18px 44px rgba(40, 25, 10, .22); }
      .cam-ui img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .rec { position: absolute; left: 24px; top: 22px; display: flex; align-items: center; gap: 12px; padding: 10px 18px; border-radius: 999px; background: rgba(17,17,22,.62); color: #fff; font-weight: 800; font-size: 30px; font-family: ui-monospace, Menlo, monospace; }
      .rec i { width: 18px; height: 18px; border-radius: 50%; background: #FF3B30; }
      .cam-meta { position: absolute; right: 24px; top: 22px; padding: 10px 18px; border-radius: 999px; background: rgba(17,17,22,.62); color: #fff; font-weight: 800; font-size: 24px; }
      .b2-chip { left: 50%; margin-left: -250px; top: 716px; width: 500px; text-align: center; font-size: 34px; }
      .note { position: absolute; left: 190px; top: 812px; width: 620px; padding: 22px 26px; background: #FFF7D6; border-radius: 8px; transform: rotate(-2deg); box-shadow: 0 10px 24px rgba(60,40,20,.16);
        font: 400 30px/1.4 ui-monospace, Menlo, monospace; color: #3A352D; text-align: center; }

      /* app cards (beats 3 and 4) */
      .app { position: absolute; left: 51px; top: 50px; width: 900px; border-radius: 26px; background: #FFFDF9; border: 3px solid #E4DCCE; box-shadow: 0 16px 38px rgba(60, 40, 20, .14); overflow: hidden; }
      .app-bar { display: flex; align-items: center; gap: 14px; padding: 18px 26px; border-bottom: 2px solid #EFE8DC; font-size: 32px; }
      .app-bar b { font-weight: 900; } .app-bar span { margin-left: auto; font-weight: 700; color: #8A8172; font-size: 26px; }
      .hg-body { padding: 26px; display: flex; flex-direction: column; gap: 22px; }
      .hg-file { display: flex; align-items: center; gap: 18px; padding: 18px; border-radius: 18px; background: #F3EEE4; }
      .hg-file div b { display: block; font-size: 30px; font-weight: 800; font-family: ui-monospace, Menlo, monospace; } .hg-file div span { font-size: 24px; color: #8A8172; font-weight: 700; }
      .hg-play { width: 64px; height: 64px; border-radius: 16px; background: #DC5A2B; flex: none; }
      .bar { height: 26px; border-radius: 13px; background: #EFE8DC; overflow: hidden; } .bar i { display: block; height: 100%; width: 100%; background: #2E9E5B; transform-origin: 0 50%; }
      .hg-status { font-size: 30px; font-weight: 800; color: #6B6257; text-align: center; }
      .hg-out { position: relative; border-radius: 20px; overflow: hidden; height: 560px; }
      .hg-out img { width: 100%; height: 100%; object-fit: cover; object-position: 47% 35%; display: block; }
      .hg-out .ok { position: absolute; left: 50%; bottom: 22px; transform: translateX(-50%); padding: 14px 28px; border-radius: 999px; background: #2E9E5B; color: #fff; font-weight: 900; font-size: 32px; white-space: nowrap; }
      .b3-chip { right: 70px; top: 1010px; width: 330px; text-align: center; }
      .el-body { padding: 26px; display: flex; flex-direction: column; gap: 22px; }
      .el-text { min-height: 120px; padding: 22px 24px; border-radius: 18px; background: #F3EEE4; font-size: 36px; font-weight: 700; line-height: 1.3; }
      .caret { display: inline-block; width: 3px; height: 38px; background: #DC5A2B; vertical-align: -6px; margin-left: 3px; }
      .wave { height: 110px; display: flex; align-items: center; justify-content: center; gap: 8px; }
      .wave i { width: 14px; height: var(--h); border-radius: 7px; background: #DC5A2B; transform-origin: 50% 50%; }
      .replay-slot { position: absolute; left: ${REPLAY.x - 8}px; top: ${REPLAY.y - 8}px; width: ${REPLAY.w + 16}px; height: ${REPLAY.h + 16}px; border-radius: 32px; border: 4px solid #2E9E5B; }
      .b4-chip { left: 50%; margin-left: -190px; top: 936px; width: 380px; text-align: center; font-size: 34px; }

      /* beat 5 — the real Skool page */
      .skool { position: absolute; left: 31px; top: 40px; width: 940px; border-radius: 26px; overflow: hidden; border: 4px solid #1B1815; box-shadow: 0 18px 44px rgba(40, 25, 10, .24); }
      .skool img { display: block; width: 100%; }
      .tiles5 { top: 600px; }
      .join { position: absolute; left: 81px; top: 790px; width: 840px; padding: 26px 34px; border-radius: 28px; background: #1B1815; color: #fff; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 16px 34px rgba(30,20,10,.3); }
      .join span { font-weight: 900; font-size: 36px; letter-spacing: -.02em; white-space: nowrap; } .join b { font-weight: 900; font-size: 30px; color: #FBE70C; white-space: nowrap; }
      .tiles5 .tile b { font-size: 60px; }

      .b1, .b4 { background: radial-gradient(90% 70% at 50% 40%, #FBF8F2 0%, #F3EEE4 100%); }
      .b2 { background: #F3EEE4; }
      .b2::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(#D9D0BF 2.5px, transparent 2.5px); background-size: 44px 44px; opacity: .55; }
      .b3, .b5 { background: #FBFAF7; }
`;

const cues = (B, at) => ({
  b1_clone: at(B[1], "clone"), b1_one: at(B[1], "one"), b1_minute: at(B[1], "minute"),
  b2_film: at(B[2], "film"), b2_minute: at(B[2], "minute"), b2_light: at(B[2], "light"),
  b3_upload: at(B[3], "upload"), b3_builds: at(B[3], "builds"), b3_moves: at(B[3], "moves"),
  b4_clone: at(B[4], "clone"), b4_type: at(B[4], "type"), b4_says: at(B[4], "says"),
  b5_post: at(B[5], "post"), b5_inside: at(B[5], "learn"), b5_club: at(B[5], "join"),
  cta: +(at(B[5], "skool") - 0.1).toFixed(3),
});

const anim = `
      // ── the clone clips: the hook is on from frame 0; the replay pops in during beat 4 ──
      tl.set("#hook-vid", { opacity: 1 }, 0);
      tl.to("#hook-vid", { opacity: 0, scale: 0.95, duration: 0.25, ease: "power2.in" }, D.beats[0].end - 0.25);
      tl.set("#replay-vid", { opacity: 0, scale: 0.9 }, 0);
      tl.to("#replay-vid", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)" }, b4 + 2.2);
      tl.to("#replay-vid", { opacity: 0, duration: 0.25 }, D.beats[3].end - 0.25);

      // ── beat 1: set at t = 0; the numbers move on the words ──
      tl.fromTo("#b1tiles .tile.hot", { scale: 1 }, { scale: 1.08, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }, C.b1_clone);
      tl.fromTo("#b1tiles .tile:first-child", { scale: 1 }, { scale: 1.08, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }, C.b1_minute);
      tl.fromTo("#badge-ai", { scale: 1 }, { scale: 1.2, duration: 0.18, yoyo: true, repeat: 1 }, C.b1_clone);
      crowd(1).forEach((id, j) => jump(id, C.b1_clone + 0.1 + j * 0.07, 80));
      jump("b1-yar", C.b1_minute, 110);

      // ── beat 2: the camera records, the timer runs to a minute ──
      tl.fromTo("#cam-ui", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b2 + 0.05);
      tl.fromTo("#cam-ui img", { scale: 1.06 }, { scale: 1, duration: dur(2), ease: "none" }, b2);
      { const o = { v: 0 }; tl.to(o, { v: 61, duration: dur(2) - 0.4, ease: "power1.in", onUpdate: () => { const e = document.getElementById("rec-t"); if (e) { const s = Math.round(o.v); e.textContent = "0" + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); } } }, b2 + 0.2); }
      tl.fromTo(".rec i", { opacity: 1 }, { opacity: 0.2, duration: 0.4, yoyo: true, repeat: reps(dur(2), 0.4) }, b2);
      pop("#b2chip", C.b2_minute, 0.45); wiggle("#b2chip", C.b2_minute + 0.45);
      tl.fromTo("#b2note", { opacity: 0, y: 20, rotation: -6 }, { opacity: 1, y: 0, rotation: -2, duration: 0.4, ease: "back.out(1.6)" }, C.b2_light - 0.2);
      walkIn("b2-yar", b2, dur(2), { from: 0.5, delay: 0.1 });
      crowd(2).forEach((id, j) => jump(id, C.b2_light + j * 0.07, 70));

      // ── beat 3: upload, the bar fills, the avatar is ready ──
      tl.fromTo("#hg", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b3 + 0.05);
      tl.fromTo("#hg-bar", { scaleX: 0 }, { scaleX: 1, duration: C.b3_moves - C.b3_upload, ease: "power1.inOut" }, C.b3_upload);
      tl.set("#hg-out", { opacity: 0.35, scale: 0.97 }, b3);
      tl.set("#hg-out .ok", { opacity: 0 }, b3);
      tl.to("#hg-out", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, C.b3_builds);
      tl.to("#hg-out .ok", { opacity: 1, duration: 0.25 }, C.b3_builds + 0.2);
      { const o = { v: 0 }; tl.to(o, { v: 1, duration: 0.01, onUpdate: () => { const e = document.getElementById("hg-status-t"); if (e) e.textContent = o.v > 0.5 ? "Done: it learned how you move" : "Training your avatar…"; } }, C.b3_builds); }
      pop("#b3chip", C.b3_moves, 0.45, { rotation: 6 });
      crowd(3).forEach((id, j) => jump(id, C.b3_moves + 0.2 + j * 0.07, 80));

      // ── beat 4: a line is typed, the wave plays, the clone says it ──
      tl.fromTo("#el", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, b4 + 0.05);
      { const line = "This isn't me talking.", t0 = C.b4_type - 0.1; const o = { n: 0 };
        tl.to(o, { n: line.length, duration: 1.1, ease: "none", onUpdate: () => { const e = document.getElementById("el-typed"); if (e) e.textContent = line.slice(0, Math.round(o.n)); } }, t0); }
      Array.from(document.querySelectorAll("#wave i")).forEach((w, k) =>
        tl.fromTo(w, { scaleY: 0.25 }, { scaleY: 1, duration: 0.18, yoyo: true, repeat: reps(dur(4) - 1.2, 0.18), ease: "sine.inOut" }, b4 + 0.6 + (k % 6) * 0.03));
      tl.set("#replay-slot", { opacity: 0 }, b4); tl.to("#replay-slot", { opacity: 1, duration: 0.3 }, b4 + 2.1);
      pop("#b4chip", C.b4_says, 0.45); wiggle("#b4chip", C.b4_says + 0.45);
      crowd(4).forEach((id, j) => jump(id, C.b4_says + 0.2 + j * 0.07, 80));

      // ── beat 5: the real Skool page, then everyone joins ──
      tl.fromTo("#skool", { y: 60, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }, b5 + 0.05);
      tl.fromTo("#skool img", { scale: 1 }, { scale: 1.05, duration: dur(5), ease: "none" }, b5);
      tl.fromTo("#join", { y: 40, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)" }, C.b5_club - 0.2);
      tl.fromTo("#join", { scale: 1 }, { scale: 1.05, duration: 0.35, yoyo: true, repeat: 3, ease: "sine.inOut" }, C.cta);
      Array.from(document.querySelectorAll("#b5tiles .tile")).forEach((s, j) => tl.fromTo(s, { y: 30, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }, b5 + 0.5 + j * 0.15));
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) => walkIn(e.id, C.b5_club - 0.6, D.beats[4].end - (C.b5_club - 0.6), { from: 0.6 + (j % 3) * 0.12, delay: (j % 4) * 0.08 }));
      Array.from(document.querySelectorAll("#beat-5 .b5-crowd")).forEach((e, j) => jump(e.id, C.cta + 0.2 + j * 0.05, 60));
      tl.fromTo("#b5-yar", { scale: 0, y: 40 }, { scale: 1, y: 0, duration: 0.5, ease: "power3.out" }, b5 + 0.1);
      jump("b5-yar", C.b5_club, 100);
`;

const meta = JSON.parse((await import("node:fs")).readFileSync(resolve(root, "audio_meta.json"), "utf8"));
const Bm = {}; let t = 0; [...meta.voices].sort((a, b) => a.id.localeCompare(b.id)).forEach((v, i) => { Bm[i + 1] = { start: t, dur: v.duration_s }; t += v.duration_s; });

build(root, {
  pills, card, css, cues, anim, overlay: overlayFor(Bm),
  logo: "clapper.svg", logo2: "camera.svg",
  sfx: ["pop", "click", "ping", "pop", "impact-bass-1"],
  ctaHtml: `Join my <em>Skool community</em> · link in bio`,
  handle: "@yarmalikhere",
  hold: 1.2,
});
