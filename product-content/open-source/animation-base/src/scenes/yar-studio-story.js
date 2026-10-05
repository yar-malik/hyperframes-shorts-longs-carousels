// yar-studio-story.js: the painted half of every CCM and AVC long video (scripts/long/paint.mjs). It is the Voho story
// (yar-voho-story.js) shot for shot, with Bit's crew (CCM) or Clappy's crew (AVC) in place of the Hum crew, so the long
// videos of all three products cut the same way. The page sets
//   window.SCENE = { cast: 'bit' | 'clappy', icons: [a, b, c], cardIcon, deskCrew: [4 names], floorCrew: [8 names] }
// before this file loads.
//   Shot A (0–10.2 s)  the skyline → the empty chair → the desk's alarms going off with nobody there (CCM: laptops
//                      flashing errors beside piles of by-hand paperwork · AVC: clients' phones ringing, the camera
//                      standing idle) → the crew pops up and gets on it → close on the second member → push into the
//                      monitor and HOLD (9.5–10.2), where HyperFrames grows the real recording out of the screen.
//   Shot C (10.2–23.2) out of the monitor → the result card (CCM: a terminal with its checks · AVC: a film frame with a
//                      play button) stamped → the whole crew celebrates on the floor → close on one → the crew dances.
// Monitor screen at the end of A / start of C, in output pixels: [560, 315, 800, 450]. Same as the Voho story: the
// builder (scripts/long/build.mjs) depends on it.
// Icons: term sheet doc film cam play card box people spark
(() => {
  const S = Object.assign({ cast: 'bit', icons: null, cardIcon: null, deskCrew: null, floorCrew: null }, window.SCENE || {});
  const K = S.cast === 'clappy' ? 'clappy' : 'bit';

  // ---------- each product's look ----------
  const LOOK = {
    bit: {
      deskTop: '#3A4C80', deep: '#243158', accent: '#FE5D08', icons: ['term', 'sheet', 'doc'], cardIcon: 'term', chair: 'office', props: 'laptops',
      deskCrew: ['Byte', 'Pixel', 'Dash', 'Bit'], floorCrew: ['Nano', 'Loop', 'Cache', 'Kilo', 'Byte', 'Pixel', 'Bit', 'Dash'],
    },
    clappy: {
      deskTop: '#2B2233', deep: '#171318', accent: '#FBE70C', icons: ['film', 'cam', 'play'], cardIcon: 'film', chair: 'director', props: 'phones',
      deskCrew: ['Take', 'Reel', 'Cue', 'Clappy'], floorCrew: ['Roll', 'Cut', 'Scene', 'Frame', 'Take', 'Reel', 'Clappy', 'Cue'],
    },
  }[K];
  const icons = S.icons || LOOK.icons, cardIcon = S.cardIcon || LOOK.cardIcon;
  const C = {
    wall: '#F7F0E2', wainscot: '#E8DCC4', floor: '#E9D3A8', floorDk: '#D4B47A', sky: '#9ED3EE', skyLt: '#D7EEF8',
    desk: '#E6C98A', deskDk: '#C9A968', deskTop: LOOK.deskTop, deep: LOOK.deep, accent: LOOK.accent,
    green: '#2EC27E', greenDk: '#016838', red: '#D2453A', screen: '#FBFAF6', city: '#C9D6E3', cityDk: '#9FB2C6', paper: '#FFFDF6',
  };

  // ---------- the crew: the product's character in different colours and hats ----------
  const CREWS = {
    bit: {
      Bit: {}, Byte: { col: '#2D6F7E', dk: '#1C4A55', lt: '#7FC1CF', hat: 'beanie' }, Pixel: { col: '#5A3E80', dk: '#3B2856', lt: '#A48CCB', hat: 'band' },
      Dash: { col: '#4A5A6E', dk: '#303C4B', lt: '#95A6BB', hat: 'fedora' }, Nano: { col: '#2E5E9E', dk: '#1D3D69', lt: '#86ABDD', hat: 'hard' },
      Loop: { col: '#3F6B4E', dk: '#284633', lt: '#8FC0A0', hat: 'top' }, Cache: { col: '#7A3E5A', dk: '#52283C', lt: '#C98BA8', hat: 'party' },
      Kilo: { col: '#35507A', dk: '#223452', lt: '#8199C0', hat: 'crown' },
    },
    clappy: {
      Clappy: {}, Take: { col: '#FFD23F', dk: '#D9A800', lt: '#FFF0A8', hat: 'beanie' }, Reel: { col: '#FFB84D', dk: '#D98C1F', lt: '#FFE1B0', hat: 'fedora' },
      Cue: { col: '#F9E26B', dk: '#CDB53A', lt: '#FFF6C4', hat: 'band' }, Roll: { col: '#FFC94A', dk: '#D69E1C', lt: '#FFE8AE', hat: 'top' },
      Cut: { col: '#FBE70C', dk: '#D6B400', lt: '#FFF9B0', hat: 'party' }, Scene: { col: '#F5D547', dk: '#C9A91F', lt: '#FDF0AE', hat: 'hard' },
      Frame: { col: '#FFDD55', dk: '#D8B120', lt: '#FFF3B8', hat: 'crown' },
    },
  }[K];
  const drawCast = K === 'clappy' ? clappy : bit;
  const base = (name) => { const v = CREWS[name] || {}; const c = CAST[K]; return { col: v.col || c.col, dk: v.dk || c.dk, lt: v.lt || c.lt }; };
  // act() for one crew member: moods cross-fade from its own colours, and it keeps its hat
  const actAs = (name, t, keys, o = {}) => ({ hat: (CREWS[name] || {}).hat, ...emotions(t, keys.map(([t0, n, over]) => [t0, n, { ...base(name), ...(over || {}) }]), o) });
  const feelAs = (name, mood, t) => ({ hat: (CREWS[name] || {}).hat, ...feel(mood, t, base(name)) });
  const member = (name, x, y, u, o = {}) => {
    const talk = o.talk || 0;
    drawCast(x, y, u, { ...base(name), ...o, ...(talk > .05 ? { mouth: Math.sin(T * 17 + x) > 0 ? 'open' : 'smile' } : {}), boilKey: o.boilKey ?? K + ' crew ' + name });
  };

  const SCREEN = { x: 1370, y: 435, w: 220, h: 123.75 };
  const MON = { cx: SCREEN.x + SCREEN.w / 2, cy: SCREEN.y + SCREEN.h / 2, zoom: 800 / SCREEN.w };
  const WIDE = [960, 500, 1.2];
  const CREW_Y = 604, U = 23;
  const DESK_CREW = (S.deskCrew || LOOK.deskCrew).map((n, i) => [n, [420, 680, 930, 1180][i]]);
  const PROPS = [330, 580, 830, 1080].map((x, i) => ({ x: x + 10, key: 'prop' + i }));

  // ---------- the office ----------
  function room(t) {
    boilSeed('s wall');
    paint(rectPts(-600, -500, W + 1200, 1260, 3), { wash: C.wall, ink: null });
    paint(rectPts(-600, 540, W + 1200, 230, 3), { wash: C.wainscot, fill: C.deskDk, fillOp: 30, bleed: .1, tex: .5, ink: null });
    inkLine([[-600, 540], [W / 2, 538], [W + 600, 541]], 1.2, mixCol(C.deskDk, PAL.ink, .3), 'inkfine', .3);
    boilSeed('s floor');
    paint(rectPts(-600, 760, W + 1200, 700, 3), { wash: C.floor, fill: C.floorDk, fillOp: 60, bleed: .15, tex: .7, ink: null });
    inkLine([[-600, 760], [W / 2, 762], [W + 600, 759]], 1.4, PAL.ink, 'ink', .3);
    windowView(t);
    board();
    clock(1000, 150, t);
    if (LOOK.chair === 'director') directorChair(); else officeChair();
    // a plant
    boilSeed('s plant');
    paint(rrPts(190, 690, 70, 72, 10, 2), { wash: PAL.clay, fill: PAL.clayDk, fillOp: 50, ink: PAL.ink, sw: 1.2 });
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * .38 + .04 * Math.sin(t * 1.6 + i);
      paint(ribbon([[225, 695], [225 + Math.cos(a) * 45, 695 + Math.sin(a) * 60], [225 + Math.cos(a) * 80, 695 + Math.sin(a) * 105]], 16, 2),
        { wash: PAL.sap, fill: mixCol(PAL.sap, PAL.ink, .2), fillOp: 50, ink: PAL.ink, sw: .8 });
    }
  }
  function officeChair() {
    boilSeed('s chair');
    paint(rrPts(1690, 560, 130, 150, 22, 2), { wash: PAL.clay, fill: PAL.clayDk, fillOp: 50, tex: .5, ink: PAL.ink, sw: 1.3 });
    paint(rrPts(1680, 690, 150, 36, 12, 2), { wash: PAL.clayLt, ink: PAL.ink, sw: 1.2 });
    inkLine([[1755, 726], [1755, 800]], 3, PAL.ink, 'ink', 0);
    inkLine([[1710, 810], [1800, 810]], 3, PAL.ink, 'ink', .2);
  }
  // AVC: the director's chair, empty, with the camera standing idle beside it
  function directorChair() {
    boilSeed('s dchair');
    inkLine([[1695, 820], [1815, 640]], 4, PAL.ink, 'ink', 0); inkLine([[1815, 820], [1695, 640]], 4, PAL.ink, 'ink', 0);
    paint(rectPts(1690, 575, 130, 44, 1), { wash: C.deep, ink: PAL.ink, sw: 1.2 });
    paint(rectPts(1690, 690, 130, 22, 1), { wash: C.deep, ink: PAL.ink, sw: 1.2 });
    inkLine([[1690, 560], [1690, 720]], 3, '#8A6D3B', 'ink', 0); inkLine([[1820, 560], [1820, 720]], 3, '#8A6D3B', 'ink', 0);
    for (let i = 0; i < 5; i++) inkLine([[1712 + i * 20, 588], [1722 + i * 20, 604]], 2, C.accent, 'inkfine', 0);
    boilSeed('s tripod');
    inkLine([[1560, 830], [1600, 620]], 2.6, PAL.ink, 'ink', 0); inkLine([[1640, 830], [1600, 620]], 2.6, PAL.ink, 'ink', 0); inkLine([[1600, 835], [1600, 620]], 2.6, PAL.ink, 'ink', 0);
    paint(rrPts(1560, 560, 90, 60, 8, 1), { wash: '#3A3446', ink: PAL.ink, sw: 1.2 });
    paint(ellPts(1545, 590, 20, 20, 16), { wash: '#6E6880', ink: PAL.ink, sw: 1 });
    paint(ellPts(1590, 548, 16, 16, 14), { wash: '#3A3446', ink: PAL.ink, sw: .9 }); paint(ellPts(1626, 548, 16, 16, 14), { wash: '#3A3446', ink: PAL.ink, sw: .9 });
  }
  // a wall clock that runs late: it's after hours and the work is still here
  function clock(x, y, t) {
    boilSeed('s clock');
    paint(ellPts(x, y, 46, 46, 24, 1), { wash: PAL.cream, ink: PAL.ink, sw: 1.6 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; inkLine([[x + Math.cos(a) * 36, y + Math.sin(a) * 36], [x + Math.cos(a) * 41, y + Math.sin(a) * 41]], 1.2, PAL.ink, 'inkfine', 0); }
    const m = (t * .9) % TAU, h = -Math.PI / 2 + 10.9 / 12 * TAU;
    inkLine([[x, y], [x + Math.cos(h) * 22, y + Math.sin(h) * 22]], 3, PAL.ink, 'ink', 0);
    inkLine([[x, y], [x + Math.cos(m - Math.PI / 2) * 33, y + Math.sin(m - Math.PI / 2) * 33]], 2, C.red, 'ink', 0);
  }

  function windowView(t) {
    boilSeed('s window');
    const X = 1180, Y = 60, Wd = 560, Hd = 310;
    paint(rrPts(X, Y, Wd, Hd, 14, 2), { wash: C.sky, fill: C.skyLt, fillOp: 90, bleed: .25, tex: .5, ink: null });
    paint(ellPts(X + 90, Y + 70, 36, 36, 20, 1), { wash: '#FFE9A8', fill: PAL.ochre, fillOp: 50, ink: PAL.ink, sw: .8 });
    for (let i = 0; i < 9; i++) {
      boilSeed('sbld' + i);
      const bx = X + 20 + i * 60, bh = 60 + 70 * hash(i + 4);
      paint(rectPts(bx, Y + Hd - bh, 50, bh, 1), { wash: i % 2 ? C.city : C.cityDk, ink: PAL.ink, sw: .7 });
      for (let w = 0; w < 3; w++) if (hash(i * 7 + w) > .4) paint(rectPts(bx + 10 + (w % 2) * 18, Y + Hd - bh + 12 + w * 18, 10, 9, 0), { wash: '#FFE9A8', ink: null });
    }
    boilSeed('s window frame');
    paint(rrPts(X, Y, Wd, Hd, 14, 2), { ink: PAL.ink, sw: 1.8 });
    inkLine([[X + Wd / 2, Y + 2], [X + Wd / 2, Y + Hd - 2]], 3.4, PAL.cream, 'ink', 0);
  }

  // the pin board: three cards with the product's icons
  function board() {
    boilSeed('s board');
    paint(rrPts(260, 140, 640, 300, 16, 2), { wash: '#D9B98A', fill: '#B8925E', fillOp: 60, bleed: .1, tex: .8, ink: PAL.ink, sw: 1.6 });
    [[300, 175, '#F0BE46'], [500, 190, '#9ED3EE'], [700, 172, '#E27A92']].forEach(([x, y, c], i) => {
      boilSeed('sphoto' + i);
      paint(rectPts(x, y, 170, 140, 1), { wash: PAL.cream, ink: PAL.ink, sw: 1 });
      paint(rectPts(x + 10, y + 10, 150, 95, 0), { wash: c, fill: mixCol(c, '#FFFFFF', .3), fillOp: 60, ink: null });
      icon(icons[i % icons.length], x + 85, y + 92, .75);
      paint(ellPts(x + 85, y + 2, 7, 7, 10), { wash: C.red, ink: PAL.ink, sw: .6 });
    });
  }

  // A small painted icon standing on baseline `by`, about 80 px wide at s = 1.
  function icon(kind, cx, by, s) {
    boilSeed('sicon ' + kind + cx);
    const P = (pts) => pts.map(([a, b]) => [cx + a * s, by + b * s]);
    const cream = { wash: PAL.cream, ink: PAL.ink, sw: .9 }, dark = { wash: '#2B2233', ink: PAL.ink, sw: .9 }, green = { wash: C.green, ink: PAL.ink, sw: .8 };
    const E = (x, y, r, o) => paint(ellPts(cx + x * s, by + y * s, r * s, r * s, 16), o);
    const R = (x, y, w, h, o, rr = 3) => paint(rrPts(cx + x * s, by + y * s, w * s, h * s, rr * s), o);
    const L = (pts, w, c) => inkLine(P(pts), w, c, 'ink', 0);
    switch (kind) {
      case 'term': R(-44, -66, 88, 62, dark, 6); R(-44, -66, 88, 12, { wash: '#4A4458', ink: PAL.ink, sw: .8 }, 5);
        for (const [x, c] of [[-36, C.red], [-28, '#F0BE46'], [-20, C.green]]) E(x, -60, 2.6, { wash: c, ink: null });
        L([[-34, -40], [-26, -34], [-34, -28]], 2, C.accent); L([[-20, -26], [8, -26]], 2, PAL.cream); L([[-34, -16], [20, -16]], 1.4, '#8C84A0'); break;
      case 'sheet': R(-40, -66, 80, 64, cream, 3); R(-40, -66, 80, 12, green, 2);
        for (let r = 0; r < 4; r++) L([[-40, -44 + r * 11], [40, -44 + r * 11]], .9, '#B8A98A');
        for (const x of [-14, 12]) L([[x, -54], [x, -2]], .9, '#B8A98A'); break;
      case 'doc': R(-28, -70, 56, 68, cream, 3); for (let i = 0; i < 4; i++) L([[-18, -56 + i * 12], [18 - (i % 2) * 10, -56 + i * 12]], 1.2, '#B8A98A'); E(14, -14, 9, green); break;
      case 'film': R(-44, -62, 88, 58, dark, 4); for (let i = 0; i < 6; i++) { R(-40 + i * 14, -59, 8, 6, cream, 1); R(-40 + i * 14, -13, 8, 6, cream, 1); }
        R(-32, -50, 64, 34, { wash: C.sky, ink: PAL.ink, sw: .6 }, 2); break;
      case 'cam': R(-40, -52, 60, 44, dark, 6); paint(P([[20, -40], [42, -52], [42, -8], [20, -20]]), dark); E(-10, -30, 12, { wash: '#6E6880', ink: PAL.ink, sw: .8 });
        E(-28, -60, 10, dark); E(-4, -60, 10, dark); break;
      case 'play': E(0, -36, 34, { wash: C.accent, ink: PAL.ink, sw: .9 }); paint(P([[-10, -54], [18, -36], [-10, -18]]), { wash: '#2B2233', ink: null }); break;
      case 'card': R(-42, -56, 84, 54, green, 8); R(-42, -46, 84, 9, { wash: C.greenDk, ink: null }, 0); break;
      case 'box': R(-36, -58, 72, 56, { wash: '#D9B98A', ink: PAL.ink, sw: .9 }, 2); R(-6, -58, 12, 56, { wash: '#F0BE46', ink: null }, 0); break;
      case 'people': E(-14, -52, 11, green); E(14, -52, 11, { wash: '#E27A92', ink: PAL.ink, sw: .8 });
        paint(ellPts(cx - 14 * s, by - 18 * s, 18 * s, 18 * s, 16), green); paint(ellPts(cx + 14 * s, by - 18 * s, 18 * s, 18 * s, 16), { wash: '#E27A92', ink: PAL.ink, sw: .8 }); break;
      default: paint(starPts(cx, by - 36 * s, 30 * s, .45, 5), { wash: '#F0BE46', ink: PAL.ink, sw: .9 });
    }
  }

  // ---------- the desk's alarms ----------
  const buzz = (ring, t) => ({ sh: ring * Math.sin(t * TAU * 11), hop: ring * Math.abs(Math.sin(t * TAU * 5.5)) * 9 });
  function rings(x, y, ring, t, sc) {
    if (ring > .05) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
      const r = (58 + k * 18) * sc, a0 = s < 0 ? Math.PI - .5 : -.5, a1 = s < 0 ? Math.PI + .5 : .5, pts = [];
      for (let i = 0; i <= 6; i++) { const a = lerp(a0, a1, i / 6); pts.push([x + Math.cos(a) * r, y - 30 * sc + Math.sin(a) * r * .8]); }
      inkLine(pts, (2.4 - k * .6) * ring * (.7 + .3 * Math.abs(Math.sin(t * TAU * 5.5 + k))), PAL.ink, 'ink', .5);
    }
  }
  // AVC: a client's phone ringing
  function phone(x, y, ring, t, key, sc = 1.35) {
    boilSeed('sphone ' + key);
    const { sh, hop } = buzz(ring, t);
    push(); translate(x, y); scale(sc); rotate(sh * .07);
    paint(rrPts(-46, -34, 92, 38, 12, 1.2), { wash: '#FFF5E2', fill: C.desk, fillOp: 60, bleed: .1, ink: PAL.ink, sw: 1.3 });
    push(); translate(0, -40 - hop); rotate(-sh * .12);
    paint(ribbon([[-44, 4], [-30, -8], [0, -12], [30, -8], [44, 4]], 17, 17), { wash: C.deep, fill: C.accent, fillOp: 90, ink: PAL.ink, sw: 1.2 });
    pop(); pop();
    rings(x, y, ring, t, sc);
  }
  // CCM: a laptop whose screen flashes red with an error, and the pile of by-hand paperwork beside it
  function laptop(x, y, ring, t, key, sc = 1.35) {
    boilSeed('slaptop ' + key);
    const { sh } = buzz(ring, t), flash = ring * (Math.sin(t * TAU * 3) > 0 ? 1 : .4);
    push(); translate(x, y); scale(sc); rotate(sh * .04);
    paint([[-50, 0], [50, 0], [44, -8], [-44, -8]], { wash: '#C9CED6', ink: PAL.ink, sw: 1.1 });
    paint(rrPts(-40, -62, 80, 54, 5, 1), { wash: '#3A3446', ink: PAL.ink, sw: 1.2 });
    paint(rectPts(-34, -56, 68, 42, 0), { wash: mixCol('#E3F4FF', C.red, flash * .85), ink: null });
    if (ring > .05) { inkLine([[-8, -44], [8, -26]], 3, PAL.cream, 'ink', 0); inkLine([[8, -44], [-8, -26]], 3, PAL.cream, 'ink', 0); }
    else for (let i = 0; i < 3; i++) inkLine([[-26, -48 + i * 10], [16 - i * 8, -48 + i * 10]], 1.4, '#8C84A0', 'inkfine', 0);
    pop();
    // the paperwork, taller with every alarm
    boilSeed('spile ' + key);
    const n = 3 + Math.round(ring * 4);
    for (let i = 0; i < n; i++) paint(rectPts(x + 52 * sc, y - 8 - i * 7, 44, 6, 0), { wash: i % 2 ? C.paper : '#F1E9D6', ink: PAL.ink, sw: .6 });
    if (ring > .05) emote('!', x, y - 110 * sc, 22, 1, t);
  }
  const alarm = LOOK.props === 'laptops' ? laptop : phone;

  function monitor() {
    boilSeed('s monitor');
    paint(rrPts(MON.cx - 60, 586, 120, 16, 6, 1), { wash: PAL.ink, fill: '#4A4458', fillOp: 90, ink: null });
    paint(rectPts(MON.cx - 12, 560, 24, 30, 1), { wash: '#4A4458', ink: PAL.ink, sw: 1 });
    paint(rrPts(SCREEN.x - 12, SCREEN.y - 12, SCREEN.w + 24, SCREEN.h + 24, 9, .6), { wash: '#3A3446', ink: PAL.ink, sw: 1.6 });
    paint(rectPts(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, 0), { wash: C.screen, ink: null });
  }
  function desk() {
    boilSeed('s desk');
    paint(rectPts(290, 612, 1360, 250, 2), { wash: C.desk, fill: C.deskDk, fillOp: 80, bleed: .1, tex: .7, ink: PAL.ink, sw: 1.8 });
    for (const x of [560, 830, 1100, 1370]) inkLine([[x, 640], [x + 2, 846]], 1, mixCol(C.deskDk, PAL.ink, .3), 'inkfine', .2);
    paint(rrPts(270, 596, 1400, 24, 8, 1.5), { wash: C.deskTop, fill: C.deep, fillOp: 70, ink: PAL.ink, sw: 1.6 });
  }

  // The result card: the product's icon, three ticked lines, and the stamp.
  function card(x, y, k, stampK, t) {
    if (k <= .01) return;
    boilSeed('s card');
    push(); translate(x, y); scale(1.25 * backOut(k)); rotate(-.04 + .02 * Math.sin(t * 1.3));
    paint(rrPts(-175, -125, 350, 250, 18, 1.5), { wash: PAL.cream, fill: C.desk, fillOp: 25, bleed: .1, tex: .4, ink: PAL.ink, sw: 1.6 });
    paint(rrPts(-175, -125, 350, 46, 16, 1), { wash: C.deskTop, fill: C.deep, fillOp: 40, ink: null });
    for (const [dx, c] of [[-150, C.red], [-130, '#F0BE46'], [-110, C.green]]) paint(ellPts(dx, -102, 6, 6, 10), { wash: c, ink: null });
    paint(rrPts(-175, -125, 350, 250, 18, 1.5), { ink: PAL.ink, sw: 1.6 });
    icon(cardIcon, -110, 40, .95);
    for (let i = 0; i < 3; i++) {
      const ly = -50 + i * 40, on = seg(t, 0, 1) >= 0;   // three done lines, each with its tick
      paint(rrPts(-40, ly, 24, 24, 6, .6), { wash: C.green, ink: PAL.ink, sw: .7 });
      inkLine([[-34, ly + 12], [-29, ly + 18], [-20, ly + 6]], 2, PAL.cream, 'ink', 0);
      inkLine([[-4, ly + 12], [110 - i * 30, ly + 12]], 4, '#CDBF9F', 'inkfine', 0);
    }
    if (stampK > .01) {
      const sk = stampK < 1 ? lerp(2.2, 1, easeIn(stampK)) : 1;
      push(); translate(118, 70); scale(sk); rotate(-.18);
      paint(ellPts(0, 0, 50, 50, 26, 1.5), { wash: C.green, washOp: 235, fill: C.greenDk, fillOp: 60, bleed: .1, ink: C.greenDk, sw: 2 });
      paint([[-26, 0], [-18, -8], [-6, 6], [20, -24], [28, -16], [-6, 22]], { wash: PAL.cream, washOp: 255, ink: C.greenDk, sw: .8 });
      pop();
    }
    pop();
  }

  const popDy = (lt, at) => lt < at ? 10 : lt < at + .35 ? lerp(10, -1.2, easeOut(seg(lt, at, at + .35))) : -1.2 * Math.exp(-7 * (lt - at - .35)) * Math.cos(12 * (lt - at - .35));
  const cam = (c) => camBegin(c[0], c[1], c[2]);

  // ---------- Shot A ----------
  function shotA(t, lt) {
    const drift = (a) => [a[0] + 8 * Math.sin(lt * .6), a[1], a[2] * (1 + .01 * (lt % 2))];
    const F = lt < 1.4 ? [1470, 220, 2.7]            // the skyline, lights still on
      : lt < 2.8 ? (K === 'clappy' ? [1660, 680, 2.1] : [1740, 690, 2.5])   // the empty chair (AVC: and the idle camera)
      : lt < 4.4 ? WIDE                              // every alarm on the desk going off, nobody there
      : lt < 6.8 ? [860, 480, 1.45]                  // the crew pops up
      : lt < 8.1 ? [680, 470, 2.4]                   // the second member gets on it
      : kf(lt, [[8.1, [1180, 470, 1.9]], [9.5, [MON.cx, MON.cy, MON.zoom]]], ease);   // the lead, then into the monitor
    cam(lt >= 8.1 ? F : drift(F));
    room(t);
    const pops = [4.5, 4.85, 5.2, 5.55];
    const moods = [['surprised', 'happy'], ['surprised', 'cool'], ['surprised', 'excited'], ['surprised', 'determined']];
    DESK_CREW.forEach(([name, x], i) => {
      const at = pops[i], m = moods[i];
      member(name, x, CREW_Y, U, { ...actAs(name, lt, [[0, 'neutral'], [at, m[0]], [at + .5, m[1]]]), dy: popDy(lt, at), noShadow: true,
        talk: lt > at + .6 ? .5 + .4 * Math.abs(Math.sin(lt * 3 + i)) : 0, lookX: lt < at + .4 ? -.5 : 0 });
    });
    desk();
    monitor();
    const ring = (on, off) => seg(lt, on, on + .15) * (1 - seg(lt, off, off + .2));
    PROPS.forEach((p, i) => alarm(p.x, 598, ring(1.5 + i * .35, pops[i] + .5), t, p.key));
    camEnd();
    if (lt < .4) iris(960, 540, lerp(0, 1200, easeOut(lt / .4)), C.wall);
  }

  // ---------- Shot C ----------
  const FLOOR_SPOTS = [[540, 870, 25], [960, 870, 25], [1390, 870, 25], [130, 870, 25], [330, 1010, 30], [760, 1010, 30], [1180, 1010, 30], [1600, 1010, 30]];
  const FLOOR_CREW = (S.floorCrew || LOOK.floorCrew).slice(0, 8).map((n, i) => [n, ...FLOOR_SPOTS[i]]);
  function shotC(t, lt) {
    const F = lt < 1.0 ? [MON.cx, MON.cy, MON.zoom]
      : lt < 2.2 ? kf(lt, [[1.0, [MON.cx, MON.cy, MON.zoom]], [2.0, [1100, 440, 1.7]]], ease)
      : lt < 4.2 ? [640, 330, 1.75]                 // the result card, stamped
      : lt < 7.0 ? [960, 700, 1.0]                  // the whole crew celebrates
      : lt < 8.4 ? [1560, 900, 1.9]                 // one waves
      : [960, 700, 1.0 + .012 * (lt - 8.4)];        // the crew dances
    cam(F);
    room(t);
    if (lt < 4.2) {
      DESK_CREW.forEach(([name, x], i) => member(name, x, CREW_Y, U, { ...actAs(name, lt, [[0, 'happy'], [3.2, i % 2 ? 'excited' : 'proud']]), noShadow: true, talk: lt < 1.8 && i === 3 ? .6 : 0 }));
      desk();
      PROPS.forEach((p) => alarm(p.x, 598, 0, t, p.key));
    } else {
      desk();
      FLOOR_CREW.forEach(([name, x, fy, fu], i) => {
        const pop = popDy(lt, 4.2 + (i % 4) * .12);
        const style = lt < 8.4 ? ['bounce', 'hop', 'roof', 'bounce'][i % 4] : ['roof', 'hop', 'sway', 'bounce'][(i + Math.floor(lt)) % 4];
        const mood = ['love', 'excited', 'starstruck', 'happy', 'laugh', 'proud', 'cool', 'playful'][i];
        const mv = move(style, t, i);
        member(name, x, fy, fu, { ...actAs(name, lt, [[0, 'happy'], [4.3, mood]]), ...mv, dy: (mv.dy || 0) + (lt < 4.9 ? pop * .35 : 0), boilKey: 'floor ' + name,
          ...(i === 7 && lt > 7 && lt < 8.4 ? move('wave', t) : {}) });
      });
    }
    monitor();
    card(620, 300, seg(lt, 2.3, 2.7), seg(lt, 3.0, 3.2), t);
    camEnd();
    if (lt > 4.2) for (let i = 0; i < 14; i++) {
      const a = (lt - 4.2) * (60 + 30 * hash(i)) + hash(i + 3) * 1080, x = (hash(i + 9) * 1920 + 40 * Math.sin(lt * 2 + i)) % 1920, y = (a % 1200) - 100;
      emote(i % 3 ? 'heart' : 'spark', x, y, 16 + 8 * hash(i), 1, lt);
    }
  }

  shots([[0, shotA], [10.2, shotC]]);

  // ---------- the loops that keep the lead on screen through the recording (as yar-voho-extras.js) ----------
  // pipTalk (over narration), pipListen (over someone else's turn), pipWork (over the setup), crewStrip, thumb.
  const lead = K === 'clappy' ? 'Clappy' : 'Bit';
  const BEATS = (n) => n * 60 / PROJECT.bpm;
  const bubble = (col) => {
    boilSeed('spip bg');
    paint(rectPts(-100, -100, W + 200, H + 200, 2), { wash: '#F7F0E2', ink: null });
    paint(ellPts(960, 560, 520, 520, 40, 8), { wash: col, fill: mixCol(col, '#FFFFFF', .35), fillOp: 80, bleed: .2, tex: .5, ink: null });
  };
  const tone = K === 'clappy' ? ['#FFF1B8', '#FFF7D6', '#F3EACB'] : ['#D6DEF3', '#E6ECF8', '#F3EACB'];
  const pipLead = (o) => member(lead, 960, 900, 62, { noShadow: true, boilKey: 'spip', ...o });
  LOOPS.pipTalk = (t) => { bubble(tone[0]); const b = pulse(t); pipLead({ ...feelAs(lead, 'happy', t), talk: 1, dy: -.25 * b }); };
  LOOPS.pipTalk.len = BEATS(12);
  LOOPS.pipListen = (t) => {
    bubble(tone[1]); const nod = Math.max(0, Math.sin(t * TAU / BEATS(2))) * .35;
    pipLead({ ...feelAs(lead, 'neutral', t), lookX: -.6, lookY: .15 + nod * .4, dy: nod, sq: nod * .08, emote: 'dots', emoteK: 1 });
  };
  LOOPS.pipListen.len = BEATS(12);
  LOOPS.pipWork = (t) => {
    bubble(tone[2]); const k = Math.sin(t * TAU * 3.2);
    pipLead({ ...feelAs(lead, 'determined', t), aL: .3 + .35 * k, aR: .3 - .35 * k, lookY: .5, emote: t % BEATS(8) > BEATS(6) ? 'bulb' : undefined, emoteK: 1 });
  };
  LOOPS.pipWork.len = BEATS(12);
  LOOPS.crewStrip = (t) => {
    boilSeed('sstrip bg');
    paint(rectPts(-100, -100, W + 200, H + 200, 2), { wash: '#F6EEDD', ink: null });
    paint(rectPts(-100, 790, W + 200, 400, 2), { wash: '#E9D3A8', fill: '#D4B47A', fillOp: 50, bleed: .1, tex: .6, ink: null });
    const styles = ['bounce', 'hop', 'roof', 'sway', 'bounce', 'hop', 'roof', 'shimmy'];
    FLOOR_CREW.forEach(([name], i) => member(name, 120 + i * 240, 800, 27, { ...feelAs(name, ['happy', 'excited', 'love', 'cool', 'laugh', 'playful', 'starstruck', 'proud'][i], t), ...move(styles[i], t, i), boilKey: 'sstrip ' + name }));
  };
  LOOPS.crewStrip.len = BEATS(8);
  // The thumbnail art (scripts/long/thumbnail.mjs): the lead big and delighted on the right, the product's icons as
  // stickers, crew peeking in. The left ~55% is kept clear for the headline, set in HTML on top.
  // SCENE.thumb = { crew: [names peeking], mood }
  LOOPS.thumb = (t) => {
    const T0 = Object.assign({ crew: FLOOR_CREW.slice(0, 2).map((c) => c[0]), mood: 'excited' }, S.thumb || {});
    boilSeed('sthumb bg');
    paint(rectPts(-100, -100, W + 200, H + 200, 2), { wash: '#FFF6E3', ink: null });
    paint(ellPts(1440, 560, 560, 520, 44, 10), { wash: tone[0], fill: mixCol(tone[0], PAL.ink, .08), fillOp: 70, bleed: .2, tex: .5, ink: null });
    T0.crew.slice(0, 3).forEach((name, i) => {
      const x = [1010, 1850, 1210][i], y = [1060, 1000, 1150][i];
      member(name, x, y, 30, { ...feelAs(name, ['love', 'starstruck', 'laugh'][i], t + i), boilKey: 'sthumb crew ' + i, noShadow: true });
    });
    member(T0.hero || lead, 1440, 1000, 56, { ...feelAs(T0.hero || lead, T0.mood, t), talk: .9, dy: -.2, boilKey: 'sthumb hero', noShadow: true, aL: 1.2, aR: .9 });
    icon(icons[0], 1130, 260, 1.6); icon(icons[1], 1790, 300, 1.4);
    emote('spark', 1250, 330, 40, 1, t); emote('hearts', 1830, 880, 34, 1, t); emote('!', 1600, 130, 44, 1, t);
  };
  LOOPS.thumb.len = 1;
})();
