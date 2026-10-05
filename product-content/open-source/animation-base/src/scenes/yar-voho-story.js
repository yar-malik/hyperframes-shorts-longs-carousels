// yar-voho-story.js: the painted half of every Voho use-case video, for any industry (scripts/voho/paint.mjs).
// The page sets `const SCENE = { view, icons: [a, b, c], cardIcon, cardCol, cardHour, deskCrew, floorCrew }` before
// this file loads; everything else is the same story, built as quick hard cuts starring the Hum crew:
//   Shot A (0–10.2 s)  the view through the window → the empty chair with a phone ringing → every phone on the desk
//                      ringing → the crew pops up and answers → close on the second crew member → push into the
//                      monitor and HOLD (9.5–10.2), where HyperFrames grows the real recording out of the screen.
//   Shot C (10.2–23.2) out of the monitor → the booking card (the industry's icon, the day ringed, the hour) stamped →
//                      the whole crew celebrates on the floor → close on a crew member → the crew dances.
// Monitor screen at the end of A / start of C, in output pixels: [560, 315, 800, 450].
// Icons: house bank card car shield drop derrick tank plane cart box tower cross bolt dish doc people
// Views: city (Riyadh, Kingdom Tower) · refinery (tanks and a flare stack) · airport (a plane over the runway)
(() => {
  const C = {
    wall: '#F7F0E2', wainscot: '#E8DCC4', floor: '#E9D3A8', floorDk: '#D4B47A', sky: '#9ED3EE', skyLt: '#D7EEF8',
    desk: '#E6C98A', deskDk: '#C9A968', deskTop: '#138451', phone: '#FFF5E2', phoneDk: '#E6C98A',
    green: '#2EC27E', deep: '#016838', screen: '#FBFAF6', city: '#C9D6E3', cityDk: '#9FB2C6',
  };
  const SCREEN = { x: 1370, y: 435, w: 220, h: 123.75 };
  const MON = { cx: SCREEN.x + SCREEN.w / 2, cy: SCREEN.y + SCREEN.h / 2, zoom: 800 / SCREEN.w };
  const WIDE = [960, 500, 1.2];
  const HUM_Y = 604, U = 23;
  const S = Object.assign({ view: 'city', icons: ['house', 'house', 'house'], cardIcon: 'house', cardCol: 0, cardHour: 5,
    deskCrew: ['Nora', 'Saad', 'Bader', 'Hum'], floorCrew: ['Lulu', 'Reem', 'Zaid', 'Mona', 'Nora', 'Saad', 'Hum', 'Bader'] }, window.SCENE || {});
  const DESK_CREW = S.deskCrew.map((n, i) => [n, [420, 680, 930, 1180][i]]);
  const PHONES = [300 + 30, 560 + 20, 810 + 20, 1060 + 20].map((x, i) => ({ x: x + 10, key: 'p' + i }));

  // ---------- the office ----------
  function room(t) {
    boilSeed('p wall');
    paint(rectPts(-600, -500, W + 1200, 1260, 3), { wash: C.wall, ink: null });
    paint(rectPts(-600, 540, W + 1200, 230, 3), { wash: C.wainscot, fill: C.deskDk, fillOp: 30, bleed: .1, tex: .5, ink: null });
    inkLine([[-600, 540], [W / 2, 538], [W + 600, 541]], 1.2, mixCol(C.deskDk, PAL.ink, .3), 'inkfine', .3);
    boilSeed('p floor');
    paint(rectPts(-600, 760, W + 1200, 700, 3), { wash: C.floor, fill: C.floorDk, fillOp: 60, bleed: .15, tex: .7, ink: null });
    inkLine([[-600, 760], [W / 2, 762], [W + 600, 759]], 1.4, PAL.ink, 'ink', .3);
    windowView(t);
    board();
    // the agent's empty chair, jacket gone, by the door
    boilSeed('p chair');
    paint(rrPts(1690, 560, 130, 150, 22, 2), { wash: PAL.clay, fill: PAL.clayDk, fillOp: 50, tex: .5, ink: PAL.ink, sw: 1.3 });
    paint(rrPts(1680, 690, 150, 36, 12, 2), { wash: PAL.clayLt, ink: PAL.ink, sw: 1.2 });
    inkLine([[1755, 726], [1755, 800]], 3, PAL.ink, 'ink', 0);
    inkLine([[1710, 810], [1800, 810]], 3, PAL.ink, 'ink', .2);
    // the side table phone by the chair
    boilSeed('p sidetable');
    paint(rrPts(1690, 780, 120, 20, 8, 1.5), { wash: C.deskDk, ink: PAL.ink, sw: 1.2 });
    // a plant
    boilSeed('p plant');
    paint(rrPts(190, 690, 70, 72, 10, 2), { wash: PAL.clay, fill: PAL.clayDk, fillOp: 50, ink: PAL.ink, sw: 1.2 });
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * .38 + .04 * Math.sin(t * 1.6 + i);
      paint(ribbon([[225, 695], [225 + Math.cos(a) * 45, 695 + Math.sin(a) * 60], [225 + Math.cos(a) * 80, 695 + Math.sin(a) * 105]], 16, 2),
        { wash: PAL.sap, fill: mixCol(PAL.sap, PAL.ink, .2), fillOp: 50, ink: PAL.ink, sw: .8 });
    }
  }

  function windowView(t) {
    boilSeed('p window');
    const X = 1180, Y = 60, Wd = 560, Hd = 310;
    paint(rrPts(X, Y, Wd, Hd, 14, 2), { wash: C.sky, fill: C.skyLt, fillOp: 90, bleed: .25, tex: .5, ink: null });
    paint(ellPts(X + 90, Y + 70, 36, 36, 20, 1), { wash: '#FFE9A8', fill: PAL.ochre, fillOp: 50, ink: PAL.ink, sw: .8 });
    if (S.view === 'refinery') {                        // storage tanks, pipes and a flare stack with its flame
      boilSeed('refinery');
      paint(rectPts(X, Y + Hd - 40, Wd, 40, 1), { wash: '#D9C29A', ink: null });
      for (const [tx, r] of [[X + 90, 46], [X + 200, 38], [X + 300, 46]]) {
        paint(rectPts(tx - r, Y + Hd - 40 - r * 1.6, r * 2, r * 1.6, 1), { wash: '#E8EEF3', fill: '#B9C9DA', fillOp: 50, ink: PAL.ink, sw: .9 });
        paint(ellPts(tx, Y + Hd - 40 - r * 1.6, r, r * .3, 16), { wash: '#F4F7FA', ink: PAL.ink, sw: .8 });
      }
      inkLine([[X + 40, Y + Hd - 70], [X + 380, Y + Hd - 70]], 3, '#8FA5BC', 'ink', 0);
      const fx = X + 450;
      paint(rectPts(fx - 8, Y + 60, 16, Hd - 100, 1), { wash: '#9FB2C6', ink: PAL.ink, sw: .9 });
      const fl = 1 + .15 * Math.sin(t * 9);
      paint([[fx - 12, Y + 60], [fx, Y + 60 - 44 * fl], [fx + 12, Y + 60]], { wash: '#F0BE46', fill: PAL.clay, fillOp: 60, ink: PAL.ink, sw: .7 });
    } else if (S.view === 'airport') {                   // a runway and a plane climbing across the window
      boilSeed('airport');
      paint(rectPts(X, Y + Hd - 50, Wd, 50, 1), { wash: '#C9D1D9', ink: null });
      for (let i = 0; i < 6; i++) inkLine([[X + 30 + i * 90, Y + Hd - 25], [X + 70 + i * 90, Y + Hd - 25]], 3, PAL.cream, 'ink', 0);
      const px = X + 60 + ((t * 40) % (Wd - 100)), py = Y + 150 - ((t * 12) % 60);
      icon('plane', px, py, .9);
    } else {                                            // Riyadh: the skyline, with Kingdom Tower's arch
      for (let i = 0; i < 9; i++) {
        boilSeed('bld' + i);
        const bx = X + 20 + i * 60, bh = 60 + 70 * hash(i + 4);
        paint(rectPts(bx, Y + Hd - bh, 50, bh, 1), { wash: i % 2 ? C.city : C.cityDk, ink: PAL.ink, sw: .7 });
      }
      boilSeed('kingdom tower');
      const kx = X + 400, top = Y + 30, base = Y + Hd;
      paint([[kx - 42, base], [kx - 30, top + 70], [kx - 16, top], [kx + 16, top], [kx + 30, top + 70], [kx + 42, base]], { wash: '#B9C9DA', fill: '#8FA5BC', fillOp: 60, ink: PAL.ink, sw: 1 });
      paint(ellPts(kx, top + 40, 14, 34, 16), { wash: C.skyLt, ink: PAL.ink, sw: .8 });
    }
    boilSeed('p window frame');
    paint(rrPts(X, Y, Wd, Hd, 14, 2), { ink: PAL.ink, sw: 1.8 });
    inkLine([[X + Wd / 2, Y + 2], [X + Wd / 2, Y + Hd - 2]], 3.4, PAL.cream, 'ink', 0);
  }

  // The listings board: three house photos pinned up, and the green Voho-ish sign with a key.
  function board() {
    boilSeed('p board');
    paint(rrPts(260, 140, 640, 300, 16, 2), { wash: '#D9B98A', fill: '#B8925E', fillOp: 60, bleed: .1, tex: .8, ink: PAL.ink, sw: 1.6 });
    [[300, 175, '#F0BE46'], [500, 190, '#9ED3EE'], [700, 172, '#E27A92']].forEach(([x, y, c], i) => {
      boilSeed('photo' + i);
      paint(rectPts(x, y, 170, 140, 1), { wash: PAL.cream, ink: PAL.ink, sw: 1 });
      paint(rectPts(x + 10, y + 10, 150, 95, 0), { wash: c, fill: mixCol(c, '#FFFFFF', .3), fillOp: 60, ink: null });
      icon(S.icons[i % S.icons.length], x + 85, y + 92, .75);
      paint(ellPts(x + 85, y + 2, 7, 7, 10), { wash: '#D2453A', ink: PAL.ink, sw: .6 });
    });
  }
  function house(cx, by, s) {
    const P = (pts) => pts.map(([a, b]) => [cx + a * s, by + b * s]);
    paint(P([[-40, 0], [-40, -38], [0, -70], [40, -38], [40, 0]]), { wash: PAL.cream, ink: PAL.ink, sw: .9 });
    paint(P([[-8, 0], [-8, -24], [8, -24], [8, 0]]), { wash: C.deep, ink: PAL.ink, sw: .6 });
    paint(P([[16, -30], [30, -30], [30, -18], [16, -18]]), { wash: C.sky, ink: PAL.ink, sw: .5 });
  }

  // A small painted icon standing on baseline `by`, about 80 px wide at s = 1.
  function icon(kind, cx, by, s) {
    boilSeed('icon ' + kind + cx);
    const P = (pts) => pts.map(([a, b]) => [cx + a * s, by + b * s]);
    const cream = { wash: PAL.cream, ink: PAL.ink, sw: .9 }, green = { wash: C.green, ink: PAL.ink, sw: .8 }, deep = { wash: C.deep, ink: PAL.ink, sw: .6 };
    const E = (x, y, r, o) => paint(ellPts(cx + x * s, by + y * s, r * s, r * s, 16), o);
    const R = (x, y, w, h, o, rr = 3) => paint(rrPts(cx + x * s, by + y * s, w * s, h * s, rr * s), o);
    switch (kind) {
      case 'bank': paint(P([[-44, -48], [0, -72], [44, -48]]), cream); R(-40, -48, 80, 6, cream, 1);
        for (const x of [-32, -14, 4, 22]) R(x, -40, 10, 32, cream, 1); R(-44, -8, 88, 8, green, 1); break;
      case 'card': R(-42, -56, 84, 54, green, 8); R(-42, -46, 84, 9, deep, 0); R(-32, -28, 18, 12, { wash: '#F0BE46', ink: PAL.ink, sw: .5 }, 2); break;
      case 'car': R(-44, -34, 88, 24, { wash: '#E27A92', ink: PAL.ink, sw: .9 }, 8); paint(P([[-24, -34], [-14, -54], [18, -54], [28, -34]]), { wash: '#F2A283', ink: PAL.ink, sw: .8 });
        paint(P([[-16, -36], [-10, -50], [4, -50], [4, -36]]), { wash: C.sky, ink: PAL.ink, sw: .5 }); E(-24, -10, 9, { wash: PAL.ink, ink: null }); E(24, -10, 9, { wash: PAL.ink, ink: null }); break;
      case 'shield': paint(P([[0, -72], [34, -60], [30, -24], [0, 0], [-30, -24], [-34, -60]]), green);
        paint(P([[-14, -36], [-6, -44], [2, -34], [16, -54], [22, -48], [2, -24]]), { wash: PAL.cream, ink: PAL.ink, sw: .5 }); break;
      case 'drop': paint(P([[0, -72], [22, -36], [24, -20], [12, -4], [-12, -4], [-24, -20], [-22, -36]]), { wash: '#3B3446', ink: PAL.ink, sw: .9, curv: .4 });
        paint(P([[-8, -34], [-12, -22], [-6, -14]]), { wash: '#8C84A0', ink: null }); break;
      case 'derrick': paint(P([[-30, 0], [-8, -74], [8, -74], [30, 0]]), { ink: PAL.ink, sw: 1.3 });
        for (const y of [-58, -40, -22]) inkLine(P([[-25 + (74 + y) * .3, y], [25 - (74 + y) * .3, y]]), 1, PAL.ink, 'inkfine', 0);
        R(-38, -6, 76, 6, green, 1); break;
      case 'tank': R(-40, -52, 80, 50, { wash: '#E8EEF3', ink: PAL.ink, sw: .9 }, 4); paint(ellPts(cx, by - 52 * s, 40 * s, 10 * s, 16), cream); inkLine(P([[-40, -30], [40, -30]]), 1.4, C.green, 'ink', 0); break;
      case 'plane': paint(P([[-44, -30], [30, -34], [44, -28], [30, -24], [-44, -26]]), cream); paint(P([[-6, -30], [10, -56], [18, -56], [10, -30]]), green);
        paint(P([[-6, -28], [10, -6], [18, -6], [10, -28]]), green); paint(P([[-40, -28], [-34, -44], [-28, -44], [-30, -28]]), deep); break;
      case 'cart': inkLine(P([[-44, -60], [-32, -60], [-22, -20], [30, -20], [38, -48], [-28, -48]]), 2, PAL.ink, 'ink', 0);
        R(-24, -46, 58, 22, green, 2); E(-16, -8, 6, { wash: PAL.ink, ink: null }); E(24, -8, 6, { wash: PAL.ink, ink: null }); break;
      case 'box': R(-36, -58, 72, 56, { wash: '#D9B98A', ink: PAL.ink, sw: .9 }, 2); R(-6, -58, 12, 56, { wash: '#F0BE46', ink: null }, 0); inkLine(P([[-36, -58], [36, -58]]), 1, PAL.ink, 'ink', 0); break;
      case 'tower': inkLine(P([[-18, 0], [0, -64], [18, 0]]), 1.6, PAL.ink, 'ink', 0); inkLine(P([[-10, -30], [10, -30]]), 1, PAL.ink, 'inkfine', 0);
        E(0, -66, 6, green); for (const r of [16, 28]) { inkLine(P([[-r * .8, -66 - r * .6], [-r, -66], [-r * .8, -66 + r * .6]]), 1.2, C.deep, 'ink', .5); inkLine(P([[r * .8, -66 - r * .6], [r, -66], [r * .8, -66 + r * .6]]), 1.2, C.deep, 'ink', .5); } break;
      case 'cross': E(0, -36, 34, { wash: PAL.cream, ink: PAL.ink, sw: .9 }); R(-8, -58, 16, 44, { wash: '#D2453A', ink: null }, 1); R(-22, -44, 44, 16, { wash: '#D2453A', ink: null }, 1); break;
      case 'bolt': paint(P([[6, -74], [-22, -30], [-2, -30], [-10, 0], [22, -44], [2, -44]]), { wash: '#F0BE46', ink: PAL.ink, sw: .9 }); break;
      case 'dish': paint(ellPts(cx, by - 20 * s, 42 * s, 14 * s, 18), cream); paint(P([[-32, -24], [-26, -48], [26, -48], [32, -24]]), { wash: '#E0E6EC', ink: PAL.ink, sw: .8, curv: .5 }); E(0, -52, 5, deep); break;
      case 'doc': R(-28, -70, 56, 68, cream, 3); for (let i = 0; i < 4; i++) inkLine(P([[-18, -56 + i * 12], [18 - (i % 2) * 10, -56 + i * 12]]), 1.2, '#B8A98A', 'inkfine', 0); E(14, -14, 9, green); break;
      case 'people': E(-14, -52, 11, green); E(14, -52, 11, { wash: '#E27A92', ink: PAL.ink, sw: .8 });
        paint(ellPts(cx - 14 * s, by - 18 * s, 18 * s, 18 * s, 16), green); paint(ellPts(cx + 14 * s, by - 18 * s, 18 * s, 18 * s, 16), { wash: '#E27A92', ink: PAL.ink, sw: .8 }); break;
      default: house(cx, by, s);
    }
  }

  function phone(x, y, ring, t, key, sc = 1.35) {
    boilSeed('phone ' + key);
    const sh = ring * Math.sin(t * TAU * 11), hop = ring * Math.abs(Math.sin(t * TAU * 5.5)) * 9;
    push(); translate(x, y); scale(sc); rotate(sh * .07);
    paint(rrPts(-46, -34, 92, 38, 12, 1.2), { wash: C.phone, fill: C.phoneDk, fillOp: 60, bleed: .1, ink: PAL.ink, sw: 1.3 });
    paint(ellPts(0, -18, 14, 9, 12), { wash: C.phoneDk, ink: PAL.ink, sw: .8 });
    push(); translate(0, -40 - hop); rotate(-sh * .12);
    paint(ribbon([[-44, 4], [-30, -8], [0, -12], [30, -8], [44, 4]], 17, 17), { wash: C.deep, fill: C.green, fillOp: 90, ink: PAL.ink, sw: 1.2 });
    pop(); pop();
    if (ring > .05) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
      const r = (58 + k * 18) * sc, a0 = s < 0 ? Math.PI - .5 : -.5, a1 = s < 0 ? Math.PI + .5 : .5, pts = [];
      for (let i = 0; i <= 6; i++) { const a = lerp(a0, a1, i / 6); pts.push([x + Math.cos(a) * r, y - 30 * sc + Math.sin(a) * r * .8]); }
      inkLine(pts, (2.4 - k * .6) * ring * (.7 + .3 * Math.abs(Math.sin(t * TAU * 5.5 + k))), PAL.ink, 'ink', .5);
    }
  }
  function monitor() {
    boilSeed('p monitor');
    paint(rrPts(MON.cx - 60, 586, 120, 16, 6, 1), { wash: PAL.ink, fill: '#4A4458', fillOp: 90, ink: null });
    paint(rectPts(MON.cx - 12, 560, 24, 30, 1), { wash: '#4A4458', ink: PAL.ink, sw: 1 });
    paint(rrPts(SCREEN.x - 12, SCREEN.y - 12, SCREEN.w + 24, SCREEN.h + 24, 9, .6), { wash: '#3A3446', ink: PAL.ink, sw: 1.6 });
    paint(rectPts(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, 0), { wash: C.screen, ink: null });
  }
  function desk() {
    boilSeed('p desk');
    paint(rectPts(290, 612, 1360, 250, 2), { wash: C.desk, fill: C.deskDk, fillOp: 80, bleed: .1, tex: .7, ink: PAL.ink, sw: 1.8 });
    for (const x of [560, 830, 1100, 1370]) inkLine([[x, 640], [x + 2, 846]], 1, mixCol(C.deskDk, PAL.ink, .3), 'inkfine', .2);
    paint(rrPts(270, 596, 1400, 24, 8, 1.5), { wash: C.deskTop, fill: C.deep, fillOp: 70, ink: PAL.ink, sw: 1.6 });
  }

  // The viewing card: a house, the calendar with Sunday ringed, a clock at five.
  function card(x, y, k, stampK, t) {
    if (k <= .01) return;
    boilSeed('p card');
    push(); translate(x, y); scale(1.25 * backOut(k)); rotate(-.04 + .02 * Math.sin(t * 1.3));
    paint(rrPts(-175, -125, 350, 250, 18, 1.5), { wash: PAL.cream, fill: C.phoneDk, fillOp: 25, bleed: .1, tex: .4, ink: PAL.ink, sw: 1.6 });
    paint(rrPts(-175, -125, 350, 46, 16, 1), { wash: C.green, fill: C.deep, fillOp: 40, ink: null });
    paint(rrPts(-175, -125, 350, 250, 18, 1.5), { ink: PAL.ink, sw: 1.6 });
    icon(S.cardIcon, -110, 12, .8);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const gx = -40 + c * 38, gy = -52 + r * 36;
      paint(rrPts(gx, gy, 28, 26, 5, .6), { wash: r === 1 && c === S.cardCol ? C.green : '#EFE6D2', ink: PAL.ink, sw: .7 });
    }
    const ring = ellPts(-26 + S.cardCol * 38, -3, 25, 23, 18); inkLine(ring.concat([ring[0]]), 2.2, C.deep, 'ink', .5);   // the day
    paint(ellPts(-110, 70, 26, 26, 18), { wash: PAL.cream, ink: PAL.ink, sw: 1 });
    inkLine([[-110, 70], [-110 + Math.cos(S.cardHour / 12 * TAU - Math.PI / 2) * 15, 70 + Math.sin(S.cardHour / 12 * TAU - Math.PI / 2) * 15]], 2, PAL.ink, 'ink', 0);
    inkLine([[-110, 70], [-110, 50]], 1.6, PAL.ink, 'ink', 0);
    for (let i = 0; i < 3; i++) inkLine([[-60, 58 + i * 16], [40 - i * 30, 58 + i * 16]], 3, '#CDBF9F', 'inkfine', 0);
    if (stampK > .01) {
      const sk = stampK < 1 ? lerp(2.2, 1, easeIn(stampK)) : 1;
      push(); translate(118, 70); scale(sk); rotate(-.18);
      paint(ellPts(0, 0, 50, 50, 26, 1.5), { wash: C.green, washOp: 235, fill: C.deep, fillOp: 60, bleed: .1, ink: C.deep, sw: 2 });
      paint([[-26, 0], [-18, -8], [-6, 6], [20, -24], [28, -16], [-6, 22]], { wash: PAL.cream, washOp: 255, ink: C.deep, sw: .8 });
      pop();
    }
    pop();
  }

  const popDy = (lt, at) => lt < at ? 10 : lt < at + .35 ? lerp(10, -1.2, easeOut(seg(lt, at, at + .35))) : -1.2 * Math.exp(-7 * (lt - at - .35)) * Math.cos(12 * (lt - at - .35));
  const cam = (c) => camBegin(c[0], c[1], c[2]);

  // ---------- Shot A ----------
  function shotA(t, lt) {
    // hard cuts between framings (Yar: more cuts), each with a slow drift so no frame is dead
    const drift = (a) => [a[0] + 8 * Math.sin(lt * .6), a[1], a[2] * (1 + .01 * (lt % 2))];
    const F = lt < 1.4 ? [1470, 220, 2.7]            // the skyline with Kingdom Tower
      : lt < 2.8 ? [1755, 690, 2.6]                  // the empty chair, a phone ringing beside it
      : lt < 4.4 ? WIDE                              // every phone on the desk ringing, nobody there
      : lt < 6.8 ? [860, 480, 1.45]                  // the crew pops up
      : lt < 8.1 ? [680, 470, 2.4]                   // Saad takes a call
      : kf(lt, [[8.1, [1180, 470, 1.9]], [9.5, [MON.cx, MON.cy, MON.zoom]]], ease);   // Hum, then into the monitor
    cam(lt >= 8.1 ? F : drift(F));
    room(t);
    const pops = [4.5, 4.85, 5.2, 5.55];
    const moods = [['surprised', 'happy'], ['surprised', 'cool'], ['surprised', 'excited'], ['surprised', 'determined']];
    DESK_CREW.forEach(([name, x], i) => {
      const at = pops[i], m = moods[i];
      crew(name, x, HUM_Y, U, { ...act('hum', lt, [[0, 'neutral'], [at, m[0]], [at + .5, m[1]]]), dy: popDy(lt, at) + 0, noShadow: true,
        talk: lt > at + .6 ? .5 + .4 * Math.abs(Math.sin(lt * 3 + i)) : 0, lookX: lt < at + .4 ? -.5 : 0 });
    });
    desk();
    monitor();
    const ring = (on, off) => seg(lt, on, on + .15) * (1 - seg(lt, off, off + .2));
    PHONES.forEach((p, i) => phone(p.x, 598, ring(1.5 + i * .35, pops[i] + .5), t, p.key));
    phone(1750, 782, ring(1.6, 4.9), t, 'side', 1.1);
    camEnd();
    if (lt < .4) iris(960, 540, lerp(0, 1200, easeOut(lt / .4)), C.wall);
  }

  // ---------- Shot C ----------
  // two rows on the floor: the back row stands between the front row's shoulders
  const FLOOR_SPOTS = [[540, 870, 25], [960, 870, 25], [1390, 870, 25], [130, 870, 25], [330, 1010, 30], [760, 1010, 30], [1180, 1010, 30], [1600, 1010, 30]];
  const FLOOR_CREW = S.floorCrew.slice(0, 8).map((n, i) => [n, ...FLOOR_SPOTS[i]]);
  function shotC(t, lt) {
    const F = lt < 1.0 ? [MON.cx, MON.cy, MON.zoom]
      : lt < 2.2 ? kf(lt, [[1.0, [MON.cx, MON.cy, MON.zoom]], [2.0, [1100, 440, 1.7]]], ease)
      : lt < 4.2 ? [640, 330, 1.75]                 // the viewing card, stamped
      : lt < 7.0 ? [960, 700, 1.0]                  // the whole crew celebrates
      : lt < 8.4 ? [1560, 900, 1.9]                 // Bader waves
      : [960, 700, 1.0 + .012 * (lt - 8.4)];        // the crew dances
    cam(F);
    room(t);
    if (lt < 4.2) {                                  // the desk, Hum finishing the call
      DESK_CREW.forEach(([name, x], i) => crew(name, x, HUM_Y, U, { ...act('hum', lt, [[0, 'happy'], [3.2, i % 2 ? 'excited' : 'proud']]), noShadow: true, talk: lt < 1.8 && name === 'Hum' ? .6 : 0 }));
      desk();
    } else {                                         // everyone out on the floor
      desk();
      FLOOR_CREW.forEach(([name, x, fy, fu], i) => {
        const pop = popDy(lt, 4.2 + (i % 4) * .12);
        const style = lt < 8.4 ? ['bounce', 'hop', 'roof', 'bounce'][i % 4] : ['roof', 'hop', 'sway', 'bounce'][(i + Math.floor(lt)) % 4];
        const moodK = [['love', 'excited', 'starstruck', 'happy', 'laugh', 'proud', 'cool', 'playful'][i]];
        const base = act('hum', lt, [[0, 'happy'], [4.3, moodK[0]]]);
        const mv = move(style, t, i);
        crew(name, x, fy, fu, { ...base, ...mv, dy: (mv.dy || 0) + (lt < 4.9 ? pop * .35 : 0), boilKey: 'floor ' + name,
          ...(i === 7 && lt > 7 && lt < 8.4 ? move('wave', t) : {}) });
      });
    }
    monitor();
    card(620, 300, seg(lt, 2.3, 2.7), seg(lt, 3.0, 3.2), t);   // over everything: it's the payoff
    camEnd();
    if (lt > 4.2) for (let i = 0; i < 14; i++) {     // confetti hearts and keys drifting down in the celebration
      const a = (lt - 4.2) * (60 + 30 * hash(i)) + hash(i + 3) * 1080, x = (hash(i + 9) * 1920 + 40 * Math.sin(lt * 2 + i)) % 1920, y = (a % 1200) - 100;
      emote(i % 3 ? 'heart' : 'spark', x, y, 16 + 8 * hash(i), 1, lt);
    }
  }

  shots([[0, shotA], [10.2, shotC]]);
})();
