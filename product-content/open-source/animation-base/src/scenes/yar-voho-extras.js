// yar-voho-extras.js: painted loops that keep the Hum crew on screen through the real recording (Yar, 2026-09-25:
// "show these characters a lot"). Rendered by scripts/voho/paint.mjs with --loop=<name>; each loop is a whole number
// of beats at 116 BPM, so it tiles seamlessly.
//   pipTalk    Hum close up, talking: the voice bars dance (over Layla's turns)
//   pipListen  Hum close up, listening: nods, looks toward the call (over the caller's turns)
//   pipWork    Hum close up, busy setting up: quick arms, determined (over the console setup)
//   crewStrip  the whole crew in a row, dancing on the beat (a strip under the reel's card)
(() => {
  const S = Object.assign({ floorCrew: ['Lulu', 'Reem', 'Zaid', 'Mona', 'Nora', 'Saad', 'Hum', 'Bader'], pip: 'Hum' }, window.SCENE || {});
  const BEATS = (n) => n * 60 / PROJECT.bpm;
  const bubble = (col) => {
    boilSeed('pip bg');
    paint(rectPts(-100, -100, W + 200, H + 200, 2), { wash: '#F7F0E2', ink: null });
    paint(ellPts(960, 560, 520, 520, 40, 8), { wash: col, fill: mixCol(col, '#FFFFFF', .35), fillOp: 80, bleed: .2, tex: .5, ink: null });
  };
  const pipHum = (t, o) => crew(S.pip, 960, 900, 62, { noShadow: true, boilKey: 'pip', ...o });

  LOOPS.pipTalk = (t) => {
    bubble('#CFEFDF');
    const b = pulse(t);
    pipHum(t, { ...feel('happy', t), talk: .55 + .4 * Math.abs(Math.sin(t * 7.3)) * (.6 + .4 * b), dy: -.25 * b, mouth: Math.sin(t * 17) > 0 ? 'open' : 'smile' });
  };
  LOOPS.pipTalk.len = BEATS(12);

  LOOPS.pipListen = (t) => {
    bubble('#E7F3EC');
    const nod = Math.max(0, Math.sin(t * TAU / BEATS(2))) * .35;
    pipHum(t, { ...feel('neutral', t), lookX: -.6, lookY: .15 + nod * .4, dy: nod, sq: nod * .08, emote: 'dots', emoteK: 1 });
  };
  LOOPS.pipListen.len = BEATS(12);

  LOOPS.pipWork = (t) => {
    bubble('#F3EACB');
    const k = Math.sin(t * TAU * 3.2);
    pipHum(t, { ...feel('determined', t), aL: .3 + .35 * k, aR: .3 - .35 * k, lookY: .5, emote: t % BEATS(8) > BEATS(6) ? 'bulb' : undefined, emoteK: 1 });
  };
  LOOPS.pipWork.len = BEATS(12);

  LOOPS.crewStrip = (t) => {
    boilSeed('strip bg');
    paint(rectPts(-100, -100, W + 200, H + 200, 2), { wash: '#F6EEDD', ink: null });
    paint(rectPts(-100, 790, W + 200, 400, 2), { wash: '#E9D3A8', fill: '#D4B47A', fillOp: 50, bleed: .1, tex: .6, ink: null });
    inkLine([[-100, 790], [W / 2, 792], [W + 100, 789]], 1.4, PAL.ink, 'ink', .3);
    const styles = ['bounce', 'hop', 'roof', 'sway', 'bounce', 'hop', 'roof', 'shimmy'];
    S.floorCrew.slice(0, 8).forEach((name, i) => {
      const x = 120 + i * 240;
      crew(name, x, 800, 27, { ...feel(['happy', 'excited', 'love', 'cool', 'laugh', 'playful', 'starstruck', 'proud'][i], t), ...move(styles[i], t, i), boilKey: 'strip ' + name });
    });
  };
  LOOPS.crewStrip.len = BEATS(8);

  // The thumbnail art (scripts/voho/thumbnail.mjs): Hum big and delighted on the right, voice bars going, phones ringing
  // around it, the industry's icon as a sticker, crew members peeking in from behind. The left ~55% is kept clear for
  // the headline, which is set in HTML on top. SCENE.thumb = { icon, crew: [names peeking], mood }
  LOOPS.thumb = (t) => {
    const T0 = Object.assign({ icon: 'house', crew: [], mood: 'excited' }, S.thumb || {});
    boilSeed('thumb bg');
    paint(rectPts(-100, -100, W + 200, H + 200, 2), { wash: '#FFF6E3', ink: null });
    paint(ellPts(1440, 560, 560, 520, 44, 10), { wash: '#BDEBD2', fill: '#8FDDB6', fillOp: 70, bleed: .2, tex: .5, ink: null });
    // crew peeking in behind Hum
    T0.crew.slice(0, 3).forEach((name, i) => {
      const x = [1010, 1850, 1210][i], y = [1060, 1000, 1150][i];   // left of Hum, far right, low in front
      crew(name, x, y, 30, { ...feel(['love', 'starstruck', 'laugh'][i], t + i), boilKey: 'thumb crew ' + i, noShadow: true });
    });
    crew(T0.hero || 'Hum', 1440, 1000, 56, { ...feel(T0.mood, t), talk: .9, dy: -.2, boilKey: 'thumb hero', noShadow: true, aL: 1.2, aR: .9 });
    // two ringing phones and the industry sticker
    for (const [x, y, k] of [[1110, 180, 'a'], [1780, 250, 'b']]) {   // kept right of the headline column
      boilSeed('thumb phone ' + k);
      push(); translate(x, y); rotate(k === 'a' ? -.18 : .2); scale(1.3);
      paint(rrPts(-46, -34, 92, 38, 12, 1.2), { wash: '#FFF5E2', fill: '#E6C98A', fillOp: 60, ink: PAL.ink, sw: 1.3 });
      paint(ribbon([[-44, -36], [-30, -48], [0, -52], [30, -48], [44, -36]], 17, 17), { wash: '#016838', fill: '#2EC27E', fillOp: 90, ink: PAL.ink, sw: 1.2 });
      pop();
      for (const s of [-1, 1]) for (let q = 0; q < 2; q++) {
        const r = 78 + q * 22, pts = [];
        for (let i = 0; i <= 6; i++) { const a = (s < 0 ? Math.PI : 0) + lerp(-.5, .5, i / 6); pts.push([x + Math.cos(a) * r, y - 40 + Math.sin(a) * r * .8]); }
        inkLine(pts, 3 - q, PAL.ink, 'ink', .5);
      }
    }
    emote('spark', 1250, 330, 40, 1, t); emote('hearts', 1830, 880, 34, 1, t); emote('!', 1600, 130, 44, 1, t);
  };
  LOOPS.thumb.len = 1;
})();
