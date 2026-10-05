// cast.js: our own characters, one per product, painted with the same tools as Clawd so they share a film.
//
//   clappy(x, y, u, o)   AI Video Club (AVC). A yellow clapperboard. The striped clapper on top flaps open when Clappy
//                        bounces and snaps shut on the landing, so every hop is a little "clap".
//   bit(x, y, u, o)      Claude Codex Mastery (CCM). A navy retro terminal with a cream screen for a face, an orange
//                        cursor blinking on its antenna and orange sneakers.
//   hum(x, y, u, o)      Voho. A round green voice agent in a sand headset. When it talks, four voice bars (the Voho
//                        mark) dance out of its mic.
//
// They take the SAME options as clawd() (see clawd.js), so everything built for Clawd works on them unchanged:
//   hum(960, 860, 24, feel('happy', t))                     clappy(x, y, u, { ...move('hop', t), view: 'q' })
//   bit(x, y, u, { ...feel('thinking', t), ...turn(t, 2, 2.2, 0, .25) })
// For ACTED mood changes use act() instead of emotions(); it's the same thing, but the colour cross-fade starts from
// the character's own colours instead of Clawd's orange:
//   bit(x, y, u, act('bit', t, [[0, 'bored'], [1.2, 'surprised'], [1.7, 'excited']]))
//
// Extra options:  clappy: clap 0..1 (clapper open; defaults to following the bounce)
//                 bit:    blink false (stops the cursor blinking)
//                 hum:    talk 0..1 (the voice bars by the mic: 0 = quiet, 1 = talking hard)
//
// Body-local layout (front view, in u): all three put the eyes at (±2.5, -6) and the mouth near (0, -4.3), exactly
// like Clawd, so eyes(), mouth(), blush() and the emotions fit without changes. Arms pivot at (±armX, armY).
// Views are drawn key views (front, q, side, qback, back), never 3D: the body narrows and the face slides round.

const CAST = {
  clappy: { name: 'Clappy', product: 'AI Video Club', col: '#FBE70C', dk: '#D6B400', lt: '#FFF9B0', blush: .35, top: 10.4, hatY: -10.4, armX: 5, armY: -4.6, legs: [-2.6, 2.6] },
  bit:    { name: 'Bit', product: 'Claude Codex Mastery', col: '#3A4C80', dk: '#243158', lt: '#7488C4', blush: .3, top: 10.6, hatY: -8.9, armX: 5.1, armY: -4.8, legs: [-2.4, 2.4] },
  hum:    { name: 'Hum', product: 'Voho', col: '#2EC27E', dk: '#138451', lt: '#9BEBC4', blush: .35, top: 10.4, hatY: -9.4, armX: 5, armY: -4.4, legs: [-2.2, 2.2] },
};
const CAST_COL = {
  avcInk: '#171318', avcBlue: '#0C5CB6',
  ccmOrange: '#FE5D08', ccmScreen: '#FFF5E2', ccmBlue: '#1497FC',
  vohoSand: '#E6C98A', vohoDeep: '#016838', vohoCream: '#F0E9DD',
};

// Key views. w: body width scale. face: where the features go (as in clawd.js). arms: [dir, which, layer]
// (layer 0 = behind the body, 1 = in front, 2 = behind and in shadow; dir 0 = the side view's one near arm).
const CAST_VIEWS = {
  front: { w: 1,   face: { cx: 0, fw: 1, sides: [-1, 1], mx: 0 },    arms: [[-1, 'L', 0], [1, 'R', 0]] },
  q:     { w: .9,  face: { cx: 1.3, fw: .76, sides: [-1, 1], mx: .3 }, arms: [[1, 'R', 2], [-1, 'L', 1]], strip: -1 },
  side:  { w: .62, face: { cx: 1.75, fw: .5, sides: [1], mx: 1.3 },   arms: [[0, 'L', 1]] },
  qback: { w: .9,  face: null, back: true, arms: [[-1, 'R', 2], [1, 'L', 1]], strip: 1 },
  back:  { w: 1,   face: null, back: true, arms: [[-1, 'R', 0], [1, 'L', 0]] },
};

// act(): emotions() for a cast member, with its own colours as the base of every mood's colour cross-fade.
function act(who, t, keys, o = {}) {
  const c = CAST[who], base = { col: c.col, dk: c.dk, lt: c.lt };
  return emotions(t, keys.map(([t0, name, over]) => [t0, name, { ...base, ...(over || {}) }]), o);
}

// The shared rig: shadow, smear, pose, legs, arms, body (spec.body), face, hat and emote.
function castMember(who, x, y, u, o, body) {
  const S = CAST[who], id = o.boilKey ?? ++CLAWD_N, rs = part => boilSeed(`${who} ${id} ${part}`);
  x += (o.dx || 0) * u;
  const V = CAST_VIEWS[o.view] || CAST_VIEWS.front;
  const dy = (o.dy || 0) * u, sq = (o.sq || 0) + (o.take || 0), sm = clamp(o.smear || 0);
  const sw = clamp(u / 15, .45, 2.4) * (o.swMul || 1), J = u * .07;
  const C = tintCols({ ...o, col: o.col || S.col, dk: o.dk || S.dk, lt: o.lt || S.lt });

  rs('shadow');
  if (!o.noShadow) {
    const f = 1 - Math.min(.5, Math.abs(o.dy || 0) * .06);
    paint(ellPts(x, y + u * .15, u * 5.2 * f * V.w, u * .9 * f, 22), { fill: PAL.ink, fillOp: 80, bleed: .25, tex: .3, border: .1, ink: null });
  }
  if (sm > .05) smearTrail(x, y + dy, u, { R: 5 * V.w }, sm, o.smearDir ?? (o.flip ? -1 : 1), C.col);

  push();
  translate(x, y + dy);
  if (o.rot) rotate(o.rot);
  scale((o.flip ? -1 : 1) * (o.sx ?? 1) * (1 + sq * .6) * (1 + sm * .35), (o.sy ?? 1) * (1 - sq));

  const arm = ([dir, which, layer]) => {
    rs('arm' + which);
    const a = which === 'L' ? (o.aL ?? .2) : (o.aR ?? .2), hook = which === 'L' ? o.armL : o.armR;
    const px = dir === 0 ? .6 * u : dir * (S.armX * V.w - .1) * u;
    const col = layer === 2 ? mixCol(C.col, C.dk, .4) : C.col;
    push(); translate(px + dir * .5 * u * clamp((Math.abs(a) - .7) / .9), S.armY * u);
    if (dir === 0) {
      translate(0, .3 * u); rotate(.7 - a);
      paint(rrPts(-.2 * u, -.45 * u, 2.3 * u, .9 * u, .42 * u, J * .5), { wash: col, washOp: 255, fill: C.dk, fillOp: 50, tex: .5, ink: PAL.ink, sw: sw * .8 });
      if (hook) { translate(2.1 * u, 0); hook(u, sw); }
    } else {
      rotate(dir < 0 ? a : -a);
      paint(rrPts(dir < 0 ? -2.2 * u : 0, -.48 * u, 2.2 * u, .96 * u, .45 * u, J * .5), { wash: col, washOp: 255, fill: C.dk, fillOp: 50, tex: .5, ink: PAL.ink, sw: sw * .8 });
      if (hook) { translate(dir * 2.2 * u, 0); if (dir < 0) scale(-1, 1); hook(u, sw); }
    }
    pop();
  };

  V.arms.filter(a => a[2] !== 1).forEach(arm);
  if (!o.noLegs) S.legs.forEach((lx, i) => {
    rs('leg' + i);
    let lift = 0;
    if (o.walk != null) { const ph = Math.sin((o.walk + (i % 2 ? .5 : 0)) * TAU); if (ph > 0) lift = ph * .8; }
    const far = V.strip && ((V.strip < 0) === (lx < 0));
    push(); translate(lx * V.w * u, 0);
    body.leg(u, sw, J, lift, far, C);
    pop();
  });

  rs('body');
  push(); scale(V.w, 1); body.body(u, sw, J, V, C, o); pop();
  if (o.gloom > .02) { rs('gloom'); push(); scale(V.w * .82, 1); gloom(u, sw, { L: -5, R: 5 }, o.gloom); pop(); }
  if (V.face) {
    const F = V.face;
    push(); translate(F.cx * u, 0); scale(F.fw, 1);
    const bl = Math.max(o.blush === true ? 1 : o.blush || 0, S.blush || 0);   // a soft resting blush: they're meant to be cute
    if (bl) blush(u, sw, { sides: F.sides, bx: 3.4 }, bl);
    rs('eyes'); eyes(u, o, sw, F.sides, sm);
    rs('mouth'); push(); translate(F.mx * u, 0); mouth(u, o.mouth, sw); pop();
    pop();
  }
  if (body.after) { rs('after-body'); body.after(u, sw, J, V, C, o); }
  rs('hat'); push(); translate((V.face ? V.face.cx * .4 : 0) * u, (S.hatY + 8) * u); scale(V.w, 1); hat(u, o.hat, sw); pop();
  V.arms.filter(a => a[2] === 1).forEach(arm);
  rs('draw'); if (o.draw) o.draw(u, sw);
  pop();

  rs('emote');
  if (o.emote) {
    const top = EMOTE_TOP.includes(o.emote), dir = o.flip ? -1 : 1;
    const ex = top ? x : x + dir * (5 * V.w + .4) * u, ey = y + dy + (top ? -(S.top + 1) : -(S.top - 1.2)) * u * (1 - sq);
    emote(o.emote, ex, ey, u * .9, o.emoteK ?? 1, o.emoteAge ?? T);
  }
  rs('after');
}

// A darker side face on the far edge in the 3/4 views, like Clawd's strip.
function castStrip(u, V, C, x0, x1, y0, y1) {
  if (!V.strip) return;
  const [a, b] = V.strip < 0 ? [x0, x0 + (x1 - x0) * .2] : [x1 - (x1 - x0) * .2, x1];
  paint(rectPts(a * u, y0 * u, (b - a) * u, (y1 - y0) * u, u * .03), { fill: C.dk, fillOp: 150, bleed: .04, tex: .6, border: .4, ink: null });
}

// ---------- Clappy (AVC) ----------
const CLAPPY = {
  leg(u, sw, J, lift, far, C) {
    const col = far ? mixCol(CAST_COL.avcInk, PAL.paper, .25) : CAST_COL.avcInk;
    paint(rectPts(-.45 * u, -2.3 * u, .9 * u, (2.3 - lift) * u, J * .5), { wash: col, washOp: 255, ink: PAL.ink, sw: sw * .7 });
    paint(ellPts(.25 * u, -lift * u - .05 * u, .8 * u, .38 * u, 14), { wash: CAST_COL.avcBlue, ink: PAL.ink, sw: sw * .7 });
  },
  body(u, sw, J, V, C, o) {
    // the slate
    const slate = rrPts(-5 * u, -9 * u, 10 * u, 7 * u, .7 * u, J);
    paint(slate, { wash: C.col, washOp: 255, ink: null });
    paint(ellPts(-1.8 * u, -6.9 * u, 3 * u, 1.4 * u, 18, J * 2, -.08), { fill: C.lt, fillOp: V.back ? 70 : 130, bleed: .2, tex: .85, border: .8, ink: null });
    castStrip(u, V, C, -5, 5, -9, -2);
    if (!V.back) {   // the slate's blue lower band
      paint(rrPts(-4.5 * u, -3.2 * u, 9 * u, .8 * u, .3 * u, J * .5), { wash: CAST_COL.avcBlue, washOp: 230, ink: null });
      inkLine([[-4.4 * u, -3.25 * u], [4.4 * u, -3.25 * u]], sw * .45, PAL.ink, 'inkfine', 0);
    }
    paint(slate, { ink: PAL.ink, sw });
    // the fixed striped band on top of the slate
    stripes(u, sw, J, -5, -9, 10, 1.1, 0, C);
  },
  after(u, sw, J, V, C, o) {
    // the clapper stick, hinged at the back-left corner. It opens with the bounce and snaps shut on the landing.
    const open = o.clap ?? clamp(.06 + .28 * Math.max(0, -(o.dy || 0)) - .6 * (o.sq || 0), 0, .95);
    push(); scale(V.w, 1); translate(-5 * u, -9.1 * u); rotate(-open * .75); translate(5 * u, 9.1 * u);
    stripes(u, sw, J, -5, -10.35, 10, 1.15, 1, C);
    pop();
  },
};
function stripes(u, sw, J, x, y, w, h, flip, C) {
  const band = rectPts(x * u, y * u, w * u, h * u, J * .4);
  paint(band, { wash: C.col, washOp: 255, ink: null });
  for (let i = 0; i < 5; i++) {   // diagonal ink bars, slanting the other way on the stick, like a real clapper
    const sx = x + .5 + i * 2, d = flip ? -.9 : .9;
    paint([[sx * u, y * u], [(sx + 1) * u, y * u], [(sx + 1 + d) * u, (y + h) * u], [(sx + d) * u, (y + h) * u]].map(([a, b]) => [clamp(a, x * u, (x + w) * u), b]),
      { wash: CAST_COL.avcInk, washOp: 240, ink: null });
  }
  paint(band, { ink: PAL.ink, sw: sw * .85 });
}
function clappy(x, y, u, o = {}) { castMember('clappy', x, y, u, o, CLAPPY); }

// ---------- Bit (CCM) ----------
const BIT = {
  leg(u, sw, J, lift, far, C) {
    const col = far ? mixCol(C.dk, PAL.ink, .3) : C.dk;
    paint(rectPts(-.4 * u, -2.2 * u, .8 * u, (2 - lift) * u, J * .5), { wash: col, washOp: 255, ink: PAL.ink, sw: sw * .7 });
    const shoe = rrPts(-.75 * u, -lift * u - .75 * u, 1.9 * u, .85 * u, .4 * u, J * .4);   // orange sneaker, toe forward
    paint(shoe, { wash: far ? mixCol(CAST_COL.ccmOrange, PAL.ink, .2) : CAST_COL.ccmOrange, ink: PAL.ink, sw: sw * .7 });
    inkLine([[-.6 * u, -lift * u - .2 * u], [1 * u, -lift * u - .2 * u]], sw * .4, PAL.cream, 'inkfine', 0);
  },
  body(u, sw, J, V, C, o) {
    // antenna first, so the body covers its root
    const blinkOn = o.blink === false || Math.floor(T * 2.2 + .3) % 2 === 0;
    inkLine([[.2 * u, -8.8 * u], [.35 * u, -9.6 * u], [.7 * u, -10.3 * u]], sw * .8, PAL.ink, 'ink', .5);
    const cur = rectPts(.3 * u, -11.7 * u, 1 * u, 1.4 * u, u * .03);
    if (blinkOn) paint(cur, { wash: CAST_COL.ccmOrange, ink: PAL.ink, sw: sw * .6 });
    else paint(cur, { ink: mixCol(CAST_COL.ccmOrange, PAL.ink, .3), sw: sw * .5 });
    // the monitor
    const shell = rrPts(-5.1 * u, -8.9 * u, 10.2 * u, 6.9 * u, 1.1 * u, J);
    paint(shell, { wash: C.col, washOp: 255, ink: null });
    paint(ellPts(-2.6 * u, -8.1 * u, 2.4 * u, .55 * u, 14, J), { fill: C.lt, fillOp: 150, bleed: .2, tex: .8, border: .8, ink: null });
    castStrip(u, V, C, -5.1, 5.1, -8.9, -2);
    if (V.back) {   // vents
      for (let i = 0; i < 4; i++) inkLine([[-2.5 * u, (-7.2 + i * .9) * u], [2.5 * u, (-7.2 + i * .9) * u]], sw * .6, C.dk, 'ink', 0);
    } else {
      const scr = rrPts(-4.1 * u, -7.8 * u, 8.2 * u, 4.9 * u, .8 * u, J * .6);
      paint(scr, { wash: CAST_COL.ccmScreen, washOp: 255, fill: '#E3F4FF', fillOp: 90, bleed: .15, tex: .6, border: .6, ink: PAL.ink, sw: sw * .7 });
      for (let i = 0; i < 3; i++) inkLine([[-3.4 * u, (-6.9 + i * 1.6) * u], [3.4 * u, (-6.9 + i * 1.6) * u]], sw * .25, mixCol(CAST_COL.ccmScreen, CAST_COL.ccmBlue, .35), 'inkfine', 0);
      // power light
      paint(ellPts(3.9 * u, -2.5 * u, .22 * u, .22 * u, 10), { wash: CAST_COL.ccmOrange, ink: null });
    }
    paint(shell, { ink: PAL.ink, sw });
  },
  after(u, sw, J, V, C, o) {
    if (V.face && !V.back) glow(V.face.cx * .2 * u, -5.3 * u, 5.5 * u, '#FFE3C8', .12);
  },
};
function bit(x, y, u, o = {}) { castMember('bit', x, y, u, o, BIT); }

// ---------- Hum (Voho) ----------
const HUM = {
  leg(u, sw, J, lift, far, C) {
    const col = far ? mixCol(C.dk, PAL.ink, .25) : C.dk;
    paint(ellPts(.15 * u, -lift * u - .45 * u, 1.05 * u, .6 * u, 14, J * .4), { wash: col, washOp: 255, ink: PAL.ink, sw: sw * .7 });
  },
  body(u, sw, J, V, C, o) {
    // the round body
    const blob = ellPts(0, -5.3 * u, 5.2 * u, 4.2 * u, 36, J);
    paint(blob, { wash: C.col, washOp: 255, ink: null });
    paint(ellPts(-1.9 * u, -7.4 * u, 2.3 * u, 1.1 * u, 18, J * 2, -.3), { fill: C.lt, fillOp: V.back ? 70 : 140, bleed: .2, tex: .85, border: .8, ink: null });
    paint(ellPts(0, -2.3 * u, 4 * u, 1.1 * u, 20, J), { fill: C.dk, fillOp: 100, bleed: .05, tex: .7, border: .5, ink: null });
    if (V.strip) paint(ellPts(V.strip * 3.4 * u, -5.3 * u, 1.1 * u, 3.8 * u, 18, J), { fill: C.dk, fillOp: 90, bleed: 0, tex: .6, border: .5, ink: null });
    paint(blob, { ink: PAL.ink, sw });
    if (o.outfit) humOutfit(u, sw, J, V, o);
    if (o.hair) humHair(u, sw, J, V, o);
  },
  after(u, sw, J, V, C, o) {
    if (o.glasses && V.face) humGlasses(u, sw, V.face, o.glasses);
    // headset: a band over the top of the head, ear cups, and a mic boom that swings round toward the mouth
    const band = V === CAST_VIEWS.side ? [[-.9, -6.4], [-.3, -9.6], [.6, -9.4]] : [[-5.05, -6.6], [-3.4, -9.3], [0, -9.95], [3.4, -9.3], [5.05, -6.6]];
    push(); scale(V.w, 1);
    inkLine(band.map(([a, b]) => [a * u, b * u]), sw * 3.2, PAL.ink, 'ink', .6);
    inkLine(band.map(([a, b]) => [a * u, b * u]), sw * 2.2, CAST_COL.vohoSand, 'ink', .6);
    pop();
    const cups = V === CAST_VIEWS.side ? [-.2] : V.back ? [-5.1, 5.1] : V.strip ? [-4.3, 4.9] : [-5.1, 5.1];
    for (const cx of cups) {
      paint(rrPts((cx * V.w - .75) * u, -7 * u, 1.5 * u, 2.4 * u, .7 * u, J * .4), { wash: CAST_COL.vohoSand, fill: mixCol(CAST_COL.vohoSand, '#A8894A', .5), fillOp: 90, bleed: .1, ink: PAL.ink, sw: sw * .8 });
    }
    if (V.face) {
      const F = V.face, ex = (cups[cups.length - 1] * V.w) * u, mx = (F.cx + (F.mx + 1.3) * F.fw) * u;
      inkLine([[ex, -5.2 * u], [ex - .2 * u, -3.6 * u], [lerp(ex, mx, .6), -3.1 * u], [mx, -3.4 * u]], sw * 1.1, PAL.ink, 'ink', .6);
      paint(ellPts(mx, -3.4 * u, .42 * u, .42 * u, 12), { wash: CAST_COL.vohoDeep, ink: PAL.ink, sw: sw * .6 });
    }
    // voice bars (the Voho mark) float out from the mic while Hum talks, and dance with it
    const talk = o.talk ?? 0;
    if (V.face && talk > .05) {
      const F = V.face, bx0 = (cups[cups.length - 1] * V.w + 1.3) * u, base = [.9, 1.9, 1.4, .8];
      for (let i = 0; i < 4; i++) {
        const k = .5 + .5 * Math.abs(Math.sin(T * (6.1 + i * 1.9) + i * 1.7)), h = base[i] * talk * k * u + .35 * u;
        paint(rrPts(bx0 + i * .85 * u, -7.2 * u - h / 2, .55 * u, h, .27 * u), { wash: CAST_COL.vohoDeep, washOp: 255 * clamp(talk * 2), ink: null });
      }
    }
  },
};
function hum(x, y, u, o = {}) { castMember('hum', x, y, u, o, HUM); }

// ---------- the Hum crew: same Hum, different hair, glasses, clothes and green (think Minions) ----------
//   hum(x, y, u, { ...feel('happy', t), hair: 'bun', glasses: 'round', outfit: 'dress' })
//   crew('Nora', x, y, u, { ...feel('happy', t) })       a named preset from CREW
// hair:    strands | spiky | curly | bun | bob | mohawk | sprout          (hairCol: any colour)
// glasses: round | square | goggles                                          (goggles: big Minion rims + strap)
// outfit:  overalls | suit | hoodie | labcoat | dress | vest                (outfitCol: any colour)
const HUM_GREENS = {
  classic: { col: '#2EC27E', dk: '#138451', lt: '#9BEBC4' },
  mint:    { col: '#5FD49C', dk: '#2C9E69', lt: '#C2F2D9' },
  teal:    { col: '#2DB5A3', dk: '#1B7F72', lt: '#A9EAE0' },
  forest:  { col: '#1FA366', dk: '#11703F', lt: '#8BDDB3' },
  lime:    { col: '#86CC5C', dk: '#4F8E34', lt: '#D2F0BC' },
};
const CREW = {
  Hum:   {},
  Nora:  { green: 'mint', hair: 'bun', hairCol: '#5B3A29', glasses: 'round', outfit: 'dress', outfitCol: '#E27A92' },
  Saad:  { green: 'forest', hair: 'spiky', outfit: 'suit', glasses: 'square' },
  Reem:  { green: 'teal', hair: 'bob', hairCol: '#3B2A22', outfit: 'labcoat' },
  Bader: { green: 'classic', hair: 'strands', glasses: 'goggles', outfit: 'overalls' },
  Lulu:  { green: 'lime', hair: 'curly', hairCol: '#7A4A2A', outfit: 'hoodie', outfitCol: '#F0BE46' },
  Zaid:  { green: 'mint', hair: 'mohawk', hairCol: '#E8AA38', glasses: 'goggles', outfit: 'vest' },
  Mona:  { green: 'teal', hair: 'sprout', glasses: 'round', outfit: 'overalls', outfitCol: '#7B5CA8' },
};
function crew(name, x, y, u, o = {}) {
  const p = CREW[name] || {}, g = HUM_GREENS[p.green || 'classic'];
  // mood colour shifts (tint) still apply on top of each one's own green
  hum(x, y, u, { ...p, ...g, ...o, boilKey: o.boilKey ?? 'crew ' + name });
}

// The garment covers the lower third of the round body, like Minions' overalls: an arc of the body's own outline
// with a straight top edge, so it always fits the silhouette.
function humOutfit(u, sw, J, V, o) {
  const top = -3.45, cy = -5.3, rx = 5.2, ry = 4.2;
  const s0 = Math.asin(clamp((top - cy) / ry, -1, 1)), pts = [];
  for (let i = 0; i <= 18; i++) { const a = lerp(s0, Math.PI - s0, i / 18); pts.push([Math.cos(a) * rx * u, (cy + Math.sin(a) * ry) * u]); }
  const colOf = { overalls: '#4E6FB5', suit: '#2F2A3A', hoodie: '#E8AA38', labcoat: '#FBF7EE', dress: '#E27A92', vest: '#C9A968' };
  const col = o.outfitCol || colOf[o.outfit] || '#4E6FB5';
  paint(pts, { wash: col, washOp: 255, fill: mixCol(col, PAL.ink, .25), fillOp: 50, bleed: .05, tex: .5, ink: PAL.ink, sw: sw * .9 });
  const L = (P, w = .7, c = PAL.ink) => inkLine(P.map(([a, b]) => [a * u, b * u]), sw * w, c, 'ink', .4);
  const dot = (x, y, r, c) => paint(ellPts(x * u, y * u, r * u, r * u, 10), { wash: c, ink: PAL.ink, sw: sw * .4 });
  if (V.back) return;
  switch (o.outfit) {
    case 'overalls':            // straps up over the shoulders, buttons, a front pocket
      L([[-2.6, -3.45], [-3.1, -5.2]], 2.2, col); L([[2.6, -3.45], [3.1, -5.2]], 2.2, col);
      dot(-2.6, -3.1, .28, '#F0BE46'); dot(2.6, -3.1, .28, '#F0BE46');
      paint(rrPts(-1.2 * u, -2.9 * u, 2.4 * u, 1.3 * u, .3 * u), { wash: mixCol(col, '#FFFFFF', .15), ink: PAL.ink, sw: sw * .5 });
      break;
    case 'suit':                // white shirt V and a red tie
      paint([[-1.1 * u, -3.45 * u], [1.1 * u, -3.45 * u], [0, -1.9 * u]], { wash: PAL.cream, ink: PAL.ink, sw: sw * .5 });
      paint([[-.35 * u, -3.4 * u], [.35 * u, -3.4 * u], [.45 * u, -2.2 * u], [0, -1.7 * u], [-.45 * u, -2.2 * u]], { wash: '#D2453A', ink: PAL.ink, sw: sw * .5 });
      break;
    case 'hoodie':              // drawstrings and a pouch pocket
      L([[-.9, -3.4], [-1, -2.3]], .6, PAL.cream); L([[.9, -3.4], [1, -2.3]], .6, PAL.cream);
      paint(rrPts(-2 * u, -2.6 * u, 4 * u, 1.2 * u, .5 * u), { wash: mixCol(col, PAL.ink, .12), ink: PAL.ink, sw: sw * .5 });
      break;
    case 'labcoat':             // lapels, a pocket with a pen
      L([[-.2, -3.45], [-1.4, -1.6]], .6); L([[.2, -3.45], [1.4, -1.6]], .6);
      paint(rrPts(2 * u, -3 * u, 1.2 * u, .9 * u, .15 * u), { ink: PAL.ink, sw: sw * .5 });
      L([[2.4, -3.3], [2.4, -2.7]], .9, '#4E6FB5');
      break;
    case 'dress':               // polka dots and a bow
      for (const [x, y] of [[-2.6, -2.6], [-.8, -2], [1, -2.7], [2.8, -2.2], [0, -3], [-1.8, -1.6], [1.9, -1.5]]) dot(x, y, .22, PAL.cream);
      paint([[-1 * u, -3.8 * u], [0, -3.45 * u], [-1 * u, -3.1 * u]], { wash: '#F2A283', ink: PAL.ink, sw: sw * .4 });
      paint([[1 * u, -3.8 * u], [0, -3.45 * u], [1 * u, -3.1 * u]], { wash: '#F2A283', ink: PAL.ink, sw: sw * .4 });
      break;
    case 'vest':                // open vest over the green, three buttons
      paint([[-1 * u, -3.45 * u], [1 * u, -3.45 * u], [0, -1.5 * u]], { wash: mixCol('#2EC27E', '#FFFFFF', .1), ink: PAL.ink, sw: sw * .5 });
      for (const y of [-3.0, -2.4, -1.8]) dot(1.25, y, .16, '#6B4A2B');
      break;
  }
}

// Hair sits on the crown, under the headset band (the band is drawn after it).
function humHair(u, sw, J, V, o) {
  const c = o.hairCol || PAL.ink, P = (pts) => pts.map(([a, b]) => [a * u, b * u]);
  switch (o.hair) {
    case 'strands':             // a few single hairs, Minion style
      for (const [x, lean] of [[-.8, -.5], [0, .1], [.8, .6]]) inkLine(P([[x, -9.4], [x + lean * .6, -10.6], [x + lean, -11.3]]), sw * .9, c, 'ink', .6);
      break;
    case 'spiky':
      for (let i = 0; i < 5; i++) { const x = -2 + i; paint(P([[x - .6, -9.1], [x + .2 * (i - 2), -10.9 - (i % 2) * .4], [x + .6, -9.1]]), { wash: c, ink: PAL.ink, sw: sw * .5 }); }
      break;
    case 'curly':
      for (const [x, y, r] of [[-2.6, -8.9, .9], [-1.3, -9.5, 1], [0, -9.8, 1.05], [1.3, -9.5, 1], [2.6, -8.9, .9]]) paint(ellPts(x * u, y * u, r * u, r * u, 14, u * .04), { wash: c, fill: mixCol(c, '#FFFFFF', .25), fillOp: 60, ink: PAL.ink, sw: sw * .5 });
      break;
    case 'bun':
      paint(P([[-3.6, -8.2], [-2.4, -9.3], [0, -9.7], [2.4, -9.3], [3.6, -8.2], [2, -8.8], [0, -9.1], [-2, -8.8]]), { wash: c, ink: PAL.ink, sw: sw * .5, curv: .4 });
      paint(ellPts(0, -10.6 * u, 1.25 * u, 1.05 * u, 16), { wash: c, fill: mixCol(c, '#FFFFFF', .2), fillOp: 60, ink: PAL.ink, sw: sw * .6 });
      break;
    case 'bob':                 // a cap of hair with a fringe that stops above the eyes
      paint(P([[-5, -6.4], [-4.6, -8.3], [-2.8, -9.4], [0, -9.8], [2.8, -9.4], [4.6, -8.3], [5, -6.4], [3.9, -7.6], [2, -7.95], [.8, -7.6], [-.6, -7.95], [-2.2, -7.6], [-3.9, -7.7]]),
        { wash: c, fill: mixCol(c, '#FFFFFF', .2), fillOp: 50, ink: PAL.ink, sw: sw * .6, curv: .35 });
      break;
    case 'mohawk':
      for (let i = 0; i < 5; i++) { const x = -1.2 + i * .6; paint(P([[x - .4, -9.4], [x, -11.4 + Math.abs(i - 2) * .35], [x + .4, -9.4]]), { wash: c, ink: PAL.ink, sw: sw * .4 }); }
      break;
    case 'sprout':              // one little leaf on a stem
      inkLine(P([[0, -9.4], [.1, -10.4], [.5, -11]]), sw * 1.1, PAL.sap, 'ink', .5);
      paint(P([[.5, -11], [1.6, -11.7], [2.1, -10.9], [1.2, -10.5]]), { wash: PAL.sap, ink: PAL.ink, sw: sw * .5, curv: .5 });
      break;
  }
}

// Glasses frame the eyes (±2.5u, -6u) in face space; the eyes stay visible through them.
function humGlasses(u, sw, F, kind) {
  push(); translate(F.cx * u, 0); scale(F.fw, 1);
  const rim = kind === 'goggles' ? '#8E97A3' : PAL.ink, r = kind === 'goggles' ? 1.75 : 1.4;
  if (kind === 'goggles' && F.sides.length > 1) inkLine([[-5.1 * u, -6.1 * u], [-4.2 * u, -6.05 * u]], sw * 3, '#4A4458', 'ink', 0);
  if (kind === 'goggles' && F.sides.length > 1) inkLine([[4.2 * u, -6.05 * u], [5.1 * u, -6.1 * u]], sw * 3, '#4A4458', 'ink', 0);
  for (const s of F.sides) {
    const cx = s * 2.5 * u, cy = -6 * u;
    const pts = kind === 'square' ? rrPts(cx - 1.45 * u, cy - 1.15 * u, 2.9 * u, 2.3 * u, .45 * u) : ellPts(cx, cy, r * u, r * u, 22);
    paint(pts, { ink: rim, sw: sw * (kind === 'goggles' ? 2.4 : 1.2) });   // clear glass: rims only, so the eyes read
    inkLine([[cx - .7 * u, cy - .5 * u], [cx - .3 * u, cy - .85 * u]], sw * .5, PAL.cream, 'inkfine', 0);   // glint
  }
  if (F.sides.length > 1) inkLine([[-(2.5 - r) * u, -6.1 * u], [0, -6.35 * u], [(2.5 - r) * u, -6.1 * u]], sw * (kind === 'goggles' ? 2 : 1), rim, 'ink', .5);
  pop();
}

// ---------- model sheets (labels are fine here: these are reference, not a video) ----------
// studio.html?loop=cast       the three of them together, acting (render: --loop=cast --clip)
// studio.html?loop=castSheet  each one's key views and a row of emotions
(() => {
  const DRAW = { clappy, bit, hum }, WHO = ['clappy', 'bit', 'hum'];
  const label = (txt, x, y, size = 20, a = .8) => letter(txt, x, y, size, PAL.ink, { ink: false, alpha: a });
  const floor = (y, x0 = 0, x1 = W) => inkLine([[x0 + 40, y + 6], [(x0 + x1) / 2, y + 4], [x1 - 40, y + 7]], .6, mixCol(PAL.paper, PAL.ink, .35), 'inkfine', .5);
  const room = () => {
    boilSeed('cast room');
    paint(ellPts(960, 470, 900, 360, 36, 14), { fill: '#FFF3BA', fillOp: 70, bleed: .3, tex: .5, ink: null });
    paint(ellPts(960, 1010, 1300, 230, 36, 10), { fill: mixCol(PAL.paper, PAL.ochre, .25), fillOp: 110, bleed: .15, tex: .6, ink: null });
  };

  // The three together. Each one acts through its own little story, on the shared beat.
  const PLAYS = {
    clappy: [[0, 'happy'], [1.6, 'excited'], [3.4, 'starstruck'], [5.2, 'proud'], [6.8, 'happy']],
    bit:    [[0, 'thinking'], [1.9, 'idea'], [3.6, 'determined'], [5.4, 'cool'], [7, 'thinking']],
    hum:    [[0, 'neutral'], [1.3, 'happy'], [3.1, 'love'], [4.9, 'laugh'], [6.6, 'neutral']],
  };
  LOOPS.cast = t => {
    room();
    const X = { clappy: 470, bit: 960, hum: 1450 };
    WHO.forEach((w, i) => {
      const k = act(w, t, PLAYS[w]);
      DRAW[w](X[w], 800, 30, { ...k, seed: i, boilKey: w, talk: w === 'hum' ? .35 + .45 * Math.abs(Math.sin(t * 1.3)) : undefined });
      label(CAST[w].name, X[w], 880, 40, .9);
      label(CAST[w].product, X[w], 925, 22, .6);
    });
    floor(800, 180, 1740);
  };
  LOOPS.cast.len = 8;

  const VIEWS5 = ['front', 'q', 'side', 'qback', 'back'], MOODS = ['happy', 'excited', 'surprised', 'love', 'angry', 'sad', 'cool', 'sleepy'];
  LOOPS.castSheet = t => {
    WHO.forEach((w, r) => {
      const gy = 250 + r * 330, u = 10.5;
      letter(`${CAST[w].name} · ${CAST[w].product}`, 40, gy - 205, 26, PAL.ink, { ink: false, alpha: .9, align: 'left' });
      VIEWS5.forEach((v, i) => { const x = 105 + i * 180; DRAW[w](x, gy, u, { ...feel('neutral', t, { seed: i }), view: v, boilKey: `${w}v${i}` }); label(v, x, gy + 34, 18); });
      MOODS.forEach((m, i) => { const x = 1020 + i * 118; DRAW[w](x, gy, 9, { ...feel(m, t, { seed: i }), boilKey: `${w}m${i}` }); label(m, x, gy + 30, 16); });
      floor(gy, 20, 900); floor(gy, 960, 1900);
    });
  };
  LOOPS.castSheet.len = 4;

  // The Hum crew: every preset, acting. studio.html?loop=crew
  LOOPS.crew = t => {
    boilSeed('crew room');
    paint(ellPts(960, 600, 980, 420, 36, 14), { fill: '#D5EBDD', fillOp: 90, bleed: .3, tex: .5, ink: null });
    const names = Object.keys(CREW), moods = ['happy', 'excited', 'love', 'cool', 'proud', 'playful', 'starstruck', 'laugh'];
    names.forEach((n, i) => {
      const x = 150 + (i % 4) * 540 * .75 + (i >= 4 ? 200 : 0), y = i < 4 ? 470 : 930;
      crew(n, x, y, 20, { ...feel(moods[i % moods.length], t + i * .37, { seed: i }), talk: i % 3 === 0 ? .6 : 0 });
      label(n, x, y + 44, 26, .8);
    });
    floor(470, 40, 1880); floor(930, 40, 1880);
  };
  LOOPS.crew.len = 4;
})();
