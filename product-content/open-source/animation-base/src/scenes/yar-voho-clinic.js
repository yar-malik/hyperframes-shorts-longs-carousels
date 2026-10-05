// yar-voho-clinic.js: the painted half of the Voho clinic video (videos/voho-clinic-hum). Render with
//   node render.mjs --page=studio-voho-clinic.html --clip --fps=30 --out=out/voho-clinic.mp4
// Two shots, cut apart in HyperFrames with the real app.voho.ai recording between them:
//   Shot A (0–9.6 s)     "The 11pm call". Close on the clock at eleven, pull back to an empty reception desk. One phone
//                        rings, then all three. Hum pops up behind the desk in its headset and picks up; the phones
//                        settle. The camera pushes into the desk monitor and HOLDS on its blank screen: HyperFrames
//                        grows the real recording out of that exact rectangle (MONITOR_OUT).
//   Shot C (9.6–24.3 s)  "Booked". Opens on the same monitor framing (the recording shrinks back into it), pulls back
//                        to Hum finishing the call. An appointment card pops up and a green check stamps it. Then the
//                        phones ring again and Hum answers them one after another, and ends happy, on the beat.
// Screen rect of the monitor at the end of A / start of C, in output pixels: [560, 315, 800, 450].
(() => {
  const C = {
    wall: '#F6EEDD', wainscot: '#D5EBDD', rail: '#9BCDB2', floor: '#EBD7AE', floorDk: '#D9BD85',
    desk: '#E6C98A', deskDk: '#C9A968', deskTop: '#138451', window: '#3B4B8C', frame: '#FFF5E2',
    phone: '#FFF5E2', phoneDk: '#E6C98A', green: '#2EC27E', deep: '#016838', screen: '#FBFAF6',
  };
  const SCREEN = { x: 1160, y: 435, w: 220, h: 123.75 };            // the monitor's screen, in world px (16:9)
  const MON = { cx: SCREEN.x + SCREEN.w / 2, cy: SCREEN.y + SCREEN.h / 2, zoom: 800 / SCREEN.w };
  const WIDE = [960, 470, 1.28];
  const HUM_Y = 604, HUM_U = 24;                                   // Hum stands on a stool behind the desk
  const PHONES = [{ x: 640, key: 'p1' }, { x: 790, key: 'p2' }, { x: 1470, key: 'p3', y: 700 }];

  // ---------- the room ----------
  function room(t) {
    boilSeed('room wall');
    paint(rectPts(-600, -500, W + 1200, 1260, 3), { wash: C.wall, ink: null });
    paint(rectPts(-600, 520, W + 1200, 250, 3), { wash: C.wainscot, fill: C.rail, fillOp: 40, bleed: .1, tex: .5, ink: null });
    inkLine([[-600, 520], [W / 2, 518], [W + 600, 521]], 1.2, mixCol(C.rail, PAL.ink, .3), 'inkfine', .3);
    boilSeed('room floor');
    paint(rectPts(-600, 760, W + 1200, 700, 3), { wash: C.floor, fill: C.floorDk, fillOp: 70, bleed: .15, tex: .7, ink: null });
    inkLine([[-600, 760], [W / 2, 762], [W + 600, 759]], 1.4, PAL.ink, 'ink', .3);
    // the window: night outside, the room is lit
    boilSeed('room window');
    paint(rrPts(120, 150, 290, 300, 14, 2), { wash: C.window, fill: PAL.indigo, fillOp: 90, bleed: .2, tex: .5, ink: null });
    paint(ellPts(330, 225, 34, 34, 20, 1), { wash: PAL.cream, fill: PAL.ochre, fillOp: 40, ink: PAL.ink, sw: .8 });
    for (let i = 0; i < 9; i++) {
      boilSeed('star' + i);
      const tw = .6 + .4 * Math.sin(t * (2 + hash(i) * 2) + i);
      paint(starPts(140 + hash(i + 3) * 240, 170 + hash(i + 9) * 250, (3 + 3 * hash(i + 5)) * tw, .35, 4), { wash: PAL.cream, ink: null });
    }
    boilSeed('room window frame');
    paint(rrPts(120, 150, 290, 300, 14, 2), { ink: PAL.ink, sw: 1.6 });
    inkLine([[265, 152], [265, 448]], 3, C.frame, 'ink', 0);
    inkLine([[122, 300], [408, 300]], 3, C.frame, 'ink', 0);
    // the clinic's sign: a tooth on a green plaque (it's a dental clinic, no lettering needed)
    boilSeed('room sign');
    paint(rrPts(880, 120, 160, 130, 22, 2), { wash: C.green, fill: C.deep, fillOp: 60, bleed: .1, tex: .5, ink: PAL.ink, sw: 1.4 });
    tooth(960, 186, 1.1);
    // waiting chairs and the side table with the third phone
    boilSeed('room chairs');
    for (const [x, k] of [[1660, 0], [1800, 1]]) {
      paint(rrPts(x - 55, 600, 110, 110, 18, 2), { wash: PAL.teal, fill: mixCol(PAL.teal, PAL.ink, .2), fillOp: 60, tex: .5, ink: PAL.ink, sw: 1.2 });
      paint(rrPts(x - 60, 690, 120, 40, 12, 2), { wash: mixCol(PAL.teal, '#FFFFFF', .2), ink: PAL.ink, sw: 1.2 });
      for (const lx of [-42, 42]) inkLine([[x + lx, 730], [x + lx, 762]], 2.4, PAL.ink, 'ink', 0);
    }
    boilSeed('room table');
    paint(rrPts(1400, 700, 150, 22, 8, 1.5), { wash: C.deskDk, ink: PAL.ink, sw: 1.2 });
    inkLine([[1475, 722], [1475, 762]], 3, PAL.ink, 'ink', 0);
    // a plant by the desk
    boilSeed('room plant');
    paint(rrPts(452, 690, 70, 72, 10, 2), { wash: PAL.clay, fill: PAL.clayDk, fillOp: 50, ink: PAL.ink, sw: 1.2 });
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * .38 + .04 * Math.sin(t * 1.6 + i);
      paint(ribbon([[487, 695], [487 + Math.cos(a) * 45, 695 + Math.sin(a) * 60], [487 + Math.cos(a) * 80, 695 + Math.sin(a) * 105]], 16, 2),
        { wash: PAL.sap, fill: mixCol(PAL.sap, PAL.ink, .2), fillOp: 50, ink: PAL.ink, sw: .8 });
    }
    clock(575, 250, t);
  }

  function tooth(cx, cy, s) {
    const P = [[-26, -24], [-10, -30], [0, -24], [10, -30], [26, -24], [28, -4], [20, 12], [14, 32], [6, 34], [2, 16], [-2, 16], [-6, 34], [-14, 32], [-20, 12], [-28, -4]]
      .map(([a, b]) => [cx + a * s, cy + b * s]);
    paint(P, { wash: PAL.cream, ink: PAL.ink, sw: 1.1, curv: .5 });
  }

  // The wall clock, at eleven o'clock. The second hand ticks, so the room is never still.
  function clock(cx, cy, t) {
    boilSeed('clock');
    paint(ellPts(cx, cy, 92, 92, 32, 1.5), { wash: PAL.cream, fill: C.phoneDk, fillOp: 50, bleed: .1, ink: PAL.ink, sw: 2.2 });
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU - Math.PI / 2, r = i % 3 ? 74 : 70;
      paint(ellPts(cx + Math.cos(a) * r, cy + Math.sin(a) * r, i % 3 ? 3 : 5.5, i % 3 ? 3 : 5.5, 8), { wash: PAL.ink, ink: null });
    }
    const hand = (a, len, w) => inkLine([[cx, cy], [cx + Math.cos(a) * len * .5, cy + Math.sin(a) * len * .5], [cx + Math.cos(a) * len, cy + Math.sin(a) * len]], w, PAL.ink, 'ink', 0);
    hand(11 / 12 * TAU - Math.PI / 2, 44, 5);                   // hour: eleven
    hand(-Math.PI / 2 + .02, 64, 3.5);                           // minute: on the hour
    const s = Math.floor(t) / 60 * TAU - Math.PI / 2;            // second hand, one tick a second
    inkLine([[cx, cy], [cx + Math.cos(s) * 70, cy + Math.sin(s) * 70]], 1.2, PAL.clayDk, 'inkfine', 0);
    paint(ellPts(cx, cy, 6, 6, 10), { wash: PAL.ink, ink: null });
  }

  // ---------- props ----------
  // A desk phone. ring 0..1 shakes it, hops the handset and throws ring marks off both sides.
  function phone(x, y, ring, t, key, sc = 1.4) {
    boilSeed('phone ' + key);
    const sh = ring * Math.sin(t * TAU * 11), hop = ring * Math.abs(Math.sin(t * TAU * 5.5)) * 9;
    push(); translate(x, y); scale(sc); rotate(sh * .07);
    paint(rrPts(-46, -34, 92, 38, 12, 1.2), { wash: C.phone, fill: C.phoneDk, fillOp: 60, bleed: .1, ink: PAL.ink, sw: 1.3 });
    paint(ellPts(0, -18, 14, 9, 12), { wash: C.phoneDk, ink: PAL.ink, sw: .8 });
    push(); translate(0, -40 - hop); rotate(-sh * .12);
    paint(ribbon([[-44, 4], [-30, -8], [0, -12], [30, -8], [44, 4]], 17, 17), { wash: C.deep, fill: C.green, fillOp: 90, ink: PAL.ink, sw: 1.2 });
    pop();
    pop();
    if (ring > .05) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
      const r = (58 + k * 18) * sc, a0 = s < 0 ? Math.PI - .5 : -.5, a1 = s < 0 ? Math.PI + .5 : .5, pts = [];
      for (let i = 0; i <= 6; i++) { const a = lerp(a0, a1, i / 6); pts.push([x + Math.cos(a) * r, y - 30 * sc + Math.sin(a) * r * .8]); }
      inkLine(pts, (2.4 - k * .6) * ring * (.7 + .3 * Math.abs(Math.sin(t * TAU * 5.5 + k))), PAL.ink, 'ink', .5);
    }
  }

  function monitor(t) {
    boilSeed('monitor');
    paint(rrPts(MON.cx - 60, 586, 120, 16, 6, 1), { wash: PAL.ink, fill: '#4A4458', fillOp: 90, ink: null });
    paint(rectPts(MON.cx - 12, 560, 24, 30, 1), { wash: '#4A4458', ink: PAL.ink, sw: 1 });
    paint(rrPts(SCREEN.x - 12, SCREEN.y - 12, SCREEN.w + 24, SCREEN.h + 24, 9, .6), { wash: '#3A3446', ink: PAL.ink, sw: 1.6 });
    // the screen: lit and blank, like the console before it loads (HyperFrames puts the real recording here)
    paint(rectPts(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, 0), { wash: C.screen, ink: null });
  }

  function desk() {
    boilSeed('desk front');
    paint(rectPts(540, 612, 880, 250, 2), { wash: C.desk, fill: C.deskDk, fillOp: 80, bleed: .1, tex: .7, ink: PAL.ink, sw: 1.8 });
    for (const x of [760, 980, 1200]) inkLine([[x, 640], [x + 2, 846]], 1, mixCol(C.deskDk, PAL.ink, .3), 'inkfine', .2);
    paint(rrPts(520, 596, 920, 24, 8, 1.5), { wash: C.deskTop, fill: C.deep, fillOp: 70, ink: PAL.ink, sw: 1.6 });
  }

  // The appointment card: a tooth (the dental clinic), a calendar with tomorrow ringed, a clock at four (afternoon).
  function card(x, y, k, stampK, t) {
    if (k <= .01) return;
    boilSeed('card');
    push(); translate(x, y); scale(1.15 * backOut(k)); rotate(-.04 + .02 * Math.sin(t * 1.3));
    paint(rrPts(-175, -125, 350, 250, 18, 1.5), { wash: PAL.cream, fill: C.phoneDk, fillOp: 25, bleed: .1, tex: .4, ink: PAL.ink, sw: 1.6 });
    paint(rrPts(-175, -125, 350, 46, 16, 1), { wash: C.green, fill: C.deep, fillOp: 40, ink: null });
    paint(rrPts(-175, -125, 350, 250, 18, 1.5), { ink: PAL.ink, sw: 1.6 });
    tooth(-110, -12, .9);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const gx = -40 + c * 38, gy = -52 + r * 36;
      paint(rrPts(gx, gy, 28, 26, 5, .6), { wash: r === 1 && c === 2 ? C.green : '#EFE6D2', ink: PAL.ink, sw: .7 });
    }
    inkLine(ellPts(50, -3, 25, 23, 18).concat([ellPts(50, -3, 25, 23, 18)[0]]), 2.2, C.deep, 'ink', .5);   // tomorrow, ringed
    // the clock: four o'clock
    paint(ellPts(-110, 70, 26, 26, 18), { wash: PAL.cream, ink: PAL.ink, sw: 1 });
    inkLine([[-110, 70], [-110 + Math.cos(4 / 12 * TAU - Math.PI / 2) * 15, 70 + Math.sin(4 / 12 * TAU - Math.PI / 2) * 15]], 2, PAL.ink, 'ink', 0);
    inkLine([[-110, 70], [-110, 50]], 1.6, PAL.ink, 'ink', 0);
    for (let i = 0; i < 3; i++) inkLine([[-60, 58 + i * 16], [40 - i * 30, 58 + i * 16]], 3, '#CDBF9F', 'inkfine', 0);   // lines of detail
    // the stamp: a green check that slams down
    if (stampK > .01) {
      const sk = stampK < 1 ? lerp(2.2, 1, easeIn(stampK)) : 1;
      push(); translate(118, 70); scale(sk); rotate(-.18);
      paint(ellPts(0, 0, 50, 50, 26, 1.5), { wash: C.green, washOp: 235, fill: C.deep, fillOp: 60, bleed: .1, ink: C.deep, sw: 2 });
      paint([[-26, 0], [-18, -8], [-6, 6], [20, -24], [28, -16], [-6, 22]], { wash: PAL.cream, washOp: 255, ink: C.deep, sw: .8 });   // the check, as a shape
      pop();
    }
    pop();
  }

  const humAt = (t, keys, extra = {}) => hum(extra.x ?? 880, HUM_Y, HUM_U, { ...act('hum', t, keys), boilKey: extra.key || 'hum', ...extra.o });

  // ---------- Shot A: the 11pm call ----------
  function shotA(t, lt, dur) {
    const cam = kf(lt, [[0, [380, 290, 2.1]], [1.5, [400, 290, 2.1]], [2.9, WIDE], [7.2, WIDE], [8.9, [MON.cx, MON.cy, MON.zoom]]], ease);
    camBegin(cam[0] + 6 * Math.sin(lt * .5), cam[1], cam[2] * (1 + .006 * lt));
    room(t);
    // Hum: hidden behind the desk, then pops up at 5.2 and picks up
    const pop = lt < 5.1 ? 10 : lt < 5.55 ? lerp(10, -1.2, easeOut(seg(lt, 5.1, 5.55))) : -1.2 * Math.exp(-7 * (lt - 5.55)) * Math.cos(12 * (lt - 5.55));
    const talk = seg(lt, 6.5, 6.9) * (1 - seg(lt, 8.6, 9.2));
    humAt(lt, [[0, 'neutral'], [5.3, 'surprised'], [6.0, 'determined'], [6.7, 'happy']], { o: { dy: pop, talk: talk * (.6 + .4 * Math.abs(Math.sin(lt * 3))), noShadow: true, lookX: lt < 6 ? -.6 : 0 } });
    desk();
    monitor(t);
    const ring = (on, off) => seg(lt, on, on + .15) * (1 - seg(lt, off, off + .25));
    phone(PHONES[0].x, 598, ring(1.6, 6.3), t, 'p1');
    phone(PHONES[1].x, 598, ring(3.7, 6.5), t, 'p2');
    phone(PHONES[2].x, 700, ring(4.3, 6.7), t, 'p3');
    camEnd();
    if (lt < .5) iris(960, 540, lerp(0, 1200, easeOut(lt / .5)), C.wall);
  }

  // ---------- Shot C: booked, and every call answered ----------
  function shotC(t, lt, dur) {
    const cam = kf(lt, [[0, [MON.cx, MON.cy, MON.zoom]], [1.0, [MON.cx, MON.cy, MON.zoom]], [2.1, [770, 390, 1.7]], [6.2, [770, 390, 1.7]], [7.4, WIDE]], ease);
    camBegin(cam[0] + 5 * Math.sin(lt * .5), cam[1], cam[2] * (1 + .004 * lt));
    room(t);
    card(535, 335, seg(lt, 2.4, 2.9), seg(lt, 3.3, 3.5), t);
    // phones ring again at 7.4; Hum turns to each and they go quiet one after another
    const ans = [8.2, 9.0, 9.8];
    const facing = lt < 7.9 ? 0 : lt < ans[0] + .2 ? -.12 : lt < ans[1] + .2 ? -.06 : lt < ans[2] + .2 ? .12 : 0;
    const keys = [[0, 'happy'], [2.2, 'proud'], [3.4, 'excited'], [5.0, 'happy'], [7.5, 'surprised'], [7.9, 'determined'], [10.4, 'love'], [11.6, 'happy']];
    const talk = (lt < 2 ? .7 : 0) + (lt > 7.9 && lt < 10.3 ? .8 : 0);
    const hopTake = take(lt, 3.5, .8);
    humAt(lt, keys, { o: { noShadow: true, talk: talk * (.6 + .4 * Math.abs(Math.sin(lt * 3))), ...(facing ? spinView(facing) : {}), lookX: facing * 6,
      dy: hopTake.dy + (lt > 10.4 ? jump(lt % .9, .2, .6, 1.4).dy : 0), sq: hopTake.sq } });
    desk();
    monitor(t);
    const ring = (on, off) => seg(lt, on, on + .15) * (1 - seg(lt, off, off + .2));
    phone(PHONES[0].x, 598, ring(7.4, ans[0]), t, 'p1');
    phone(PHONES[1].x, 598, ring(7.6, ans[1]), t, 'p2');
    phone(PHONES[2].x, 700, ring(7.5, ans[2]), t, 'p3');
    // each answered phone gets a heart
    PHONES.forEach((p, i) => { const a = lt - ans[i]; if (a > 0 && a < 1.6) emote('heart', p.x, (p.y || 598) - 100 - a * 30, 14, seg(a, 0, .25), a); });
    camEnd();
  }

  shots([[0, shotA], [9.6, shotC]]);
})();
