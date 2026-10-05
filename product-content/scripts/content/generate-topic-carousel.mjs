// One carousel per topic, in the house carousel system: the same palette,
// frame, grain, pills and arrows as generate-ai-video-club-carousel.mjs, with
// the slides written per topic and the wordmark per community.
//
//   node scripts/content/generate-topic-carousel.mjs higgsfield-credits
//   node scripts/content/generate-topic-carousel.mjs claude-code-in-pro
//
// Writes content/instagram/<topic>/slide-NN.{svg,png} + carousel-preview.png.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const topic = process.argv[2];
if (!topic) { console.error('usage: node scripts/content/generate-topic-carousel.mjs <topic>'); process.exit(1); }

const root = process.cwd();
const srcDir = path.join(root, 'content/generated/ai-video-club-carousel');
const outDir = path.join(root, 'content/instagram', topic);
fs.mkdirSync(outDir, { recursive: true });
const stageUri = `data:image/png;base64,${fs.readFileSync(path.join(srcDir, 'yar-on-stage-eyes-corrected.png')).toString('base64')}`;

const W = 1080, H = 1350;
const C = { ink: '#101116', blue: '#183cff', pale: '#f6f5ed', yellow: '#f0f36b', ice: '#dfe7ff', cyan: '#49d8ff', gray: '#b9bdd0' };
const esc = (v) => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/* ---- the same vocabulary as the AVC realism carousel ---- */
const defs = () => `
  <defs>
    <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="7" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0" result="mono"/>
      <feComponentTransfer in="mono" result="faded"><feFuncA type="table" tableValues="0 0.16"/></feComponentTransfer>
      <feBlend in="SourceGraphic" in2="faded" mode="multiply"/>
    </filter>
    <filter id="rough" x="-8%" y="-8%" width="116%" height="116%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="19" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.blue}"/><stop offset="0.62" stop-color="#101941"/><stop offset="1" stop-color="${C.ink}"/>
    </linearGradient>
    <linearGradient id="coverShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#080a16" stop-opacity=".72"/>
      <stop offset=".72" stop-color="#080a16" stop-opacity=".38"/>
      <stop offset="1" stop-color="#080a16" stop-opacity="0"/>
    </linearGradient>
    <pattern id="dots" width="13" height="13" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="${C.pale}" opacity=".18"/></pattern>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="${C.ice}" stroke-width="1" opacity=".16"/></pattern>
  </defs>`;

let BRAND = 'AI VIDEO CLUB';
const base = ({ bg = C.ink, page = 1, total = 8, light = false }) => {
  const fg = light ? C.ink : C.pale;
  return `
    <rect width="${W}" height="${H}" fill="${bg}"/>
    <rect width="${W}" height="${H}" fill="url(#dots)" opacity="${light ? '.22' : '.42'}"/>
    <rect x="34" y="34" width="1012" height="1282" rx="26" fill="none" stroke="${fg}" stroke-width="2" opacity=".45"/>
    <text x="72" y="92" fill="${fg}" font-family="Courier New, monospace" font-size="24" font-weight="700" letter-spacing="2">${esc(BRAND)}</text>
    <text x="1008" y="92" text-anchor="end" fill="${fg}" font-family="Courier New, monospace" font-size="22">${String(page).padStart(2, '0')} / ${String(total).padStart(2, '0')}</text>`;
};
const footer = (text) => `<text x="72" y="1280" fill="${C.gray}" font-family="Courier New, monospace" font-size="19" letter-spacing="1.8">${esc(text)}</text>`;
const pill = (x, y, text, fill = C.yellow, color = C.ink, width) => {
  const w = width || Math.max(150, text.length * 15 + 52);
  return `<g transform="translate(${x} ${y}) rotate(-1)"><rect width="${w}" height="50" rx="4" fill="${fill}"/><text x="22" y="34" fill="${color}" font-family="Courier New, monospace" font-size="23" font-weight="700">${esc(text)}</text></g>`;
};
const arrow = (x, y, color = C.yellow) => `<path d="M${x} ${y}h95m-26-25 27 25-27 25" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter"/>`;
const svg = (content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs()}${content}<rect width="${W}" height="${H}" fill="none" filter="url(#grain)"/></svg>`;

const IMPACT = 'Impact, Arial Black, sans-serif', SERIF = 'Georgia, serif', MONO = 'Courier New, monospace', SANS = 'Arial, sans-serif';

/* cover: stage photo, three-line headline, pale box, pill, arrow */
const FACE_X = 440; // where he starts, at headline height, on the stage photo
// Per-face widths measured off the shipped realism cover: "YOUR AI ADS" at 88px
// Impact runs ~320px (0.34em a character), "the $100 plan." at 108px Georgia
// italic ran ~640px (0.42em) — which is how it ended up across his face.
const estWidth = (text, size, family) => text.length * size * (family === IMPACT ? 0.34 : 0.42);
// Line 1 (baseline 190) clears his head entirely. Line 2 (baseline 280) grazes
// the top of it, line 3 (baseline 372) is level with his face: those two must
// end before he begins.
function guardHeadline(lines) {
  for (const [text, size, family, limit] of lines) {
    if (!limit) continue;
    const w = 72 + estWidth(text, size, family);
    if (w > limit) throw new Error(`cover line "${text}" would run to x≈${Math.round(w)} and print across the subject (limit ${limit}). Shorten it.`);
  }
}
const cover = ({ l1, l2, l3, boxTop, boxBig, pillText }) => (guardHeadline([[l1, 88, IMPACT, 0], [l2, 94, IMPACT, 470], [l3, 108, SERIF, FACE_X]]), svg(`
  <image href="${stageUri}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1080" height="610" fill="url(#coverShade)"/>
  <rect y="1010" width="1080" height="340" fill="#080a12" opacity=".47"/>
  <rect width="1080" height="1350" fill="url(#grid)" opacity=".45"/>
  <rect x="34" y="34" width="1012" height="1282" rx="26" fill="none" stroke="${C.pale}" stroke-width="2" opacity=".55"/>
  <text x="72" y="92" fill="${C.pale}" font-family="${MONO}" font-size="24" font-weight="700" letter-spacing="2">${esc(BRAND)}</text>
  <text x="1008" y="92" text-anchor="end" fill="${C.pale}" font-family="${MONO}" font-size="22">01 / 08</text>
  <text x="72" y="190" fill="${C.yellow}" font-family="${IMPACT}" font-size="88" letter-spacing="-1">${esc(l1)}</text>
  <text x="72" y="280" fill="${C.yellow}" font-family="${IMPACT}" font-size="94" letter-spacing="-2">${esc(l2)}</text>
  <text x="72" y="372" fill="${C.pale}" font-family="${SERIF}" font-size="108" font-style="italic">${esc(l3)}</text>
  <g transform="translate(70 1085) rotate(-1)">
    <rect width="820" height="145" fill="${C.pale}" opacity=".97"/>
    <text x="38" y="56" fill="${C.blue}" font-family="${SERIF}" font-size="39">${esc(boxTop)}</text>
    <text x="38" y="116" fill="${C.ink}" font-family="${IMPACT}" font-size="55" letter-spacing="1">${esc(boxBig)}</text>
  </g>
  ${pill(72, 1244, pillText, C.blue, C.pale, 470)}
  ${arrow(895, 1268, C.yellow)}`));

/* a numbered plan slide: big number, tier name, price, and what it buys */
const plan = ({ page, n, tier, price, sub, lines, badge, foot, dark = false, big, bigLabel }) => svg(`
  ${base({ bg: dark ? C.ink : C.pale, page, light: !dark })}
  <text x="72" y="240" fill="${C.yellow}" font-family="${IMPACT}" font-size="164">${n}</text>
  <text x="300" y="212" fill="${dark ? C.pale : C.ink}" font-family="${SERIF}" font-size="63">${esc(tier)}</text>
  <text x="300" y="279" fill="${dark ? C.cyan : C.blue}" font-family="${IMPACT}" font-size="73">${esc(price)}</text>
  <text x="72" y="360" fill="${dark ? C.gray : '#5b5e70'}" font-family="${MONO}" font-size="27">${esc(sub)}</text>
  <rect x="72" y="405" width="936" height="${lines.length * 74 + 60}" rx="8" fill="${dark ? C.ice : C.ink}"/>
  <g transform="translate(112 470)" font-family="${SANS}" font-size="40" font-weight="700" fill="${dark ? C.ink : C.pale}">
    ${lines.map((l, i) => `<text y="${i * 74}">${esc(l)}</text>`).join('')}
  </g>
  ${big ? `
  <g transform="translate(65 ${405 + lines.length * 74 + 110}) rotate(-1)" filter="url(#rough)">
    <rect width="950" height="300" fill="${dark ? C.pale : C.ink}"/>
    <text x="54" y="72" fill="${dark ? C.blue : C.yellow}" font-family="${SANS}" font-size="34" font-weight="700">${esc(bigLabel)}</text>
    <text x="54" y="232" fill="${dark ? C.ink : C.pale}" font-family="${IMPACT}" font-size="170" letter-spacing="-3">${esc(big)}</text>
  </g>` : ''}
  ${badge ? pill(72, 405 + lines.length * 74 + (big ? 440 : 100), badge, dark ? C.yellow : C.blue, dark ? C.ink : C.pale) : ''}
  ${footer(foot)}`);

/* a light "shift" slide: pill, two-line headline, rule, body, rough dark box */
const shift = ({ page, kicker, h1, h2, body, boxTop, boxBig, boxSmall, foot }) => svg(`
  ${base({ bg: C.pale, page, light: true })}
  ${pill(72, 145, kicker, C.blue, C.pale, Math.max(240, kicker.length * 15 + 52))}
  <text x="72" y="300" fill="${C.ink}" font-family="${IMPACT}" font-size="112">${esc(h1)}</text>
  <text x="72" y="405" fill="${C.blue}" font-family="${SERIF}" font-size="100" font-style="italic">${esc(h2)}</text>
  <path d="M72 458 H1005" stroke="${C.ink}" stroke-width="5"/>
  <g transform="translate(72 560)" font-family="${SANS}" font-size="44" font-weight="700" fill="${C.ink}">
    ${body.map((l, i) => `<text y="${i * 62}">${esc(l)}</text>`).join('')}
  </g>
  <g transform="translate(65 ${560 + body.length * 62 + 40}) rotate(-1)" filter="url(#rough)">
    <rect width="950" height="330" fill="${C.ink}"/>
    <text x="54" y="91" fill="${C.yellow}" font-family="${SANS}" font-size="44" font-weight="700">${esc(boxTop)}</text>
    <text x="54" y="174" fill="${C.pale}" font-family="${SERIF}" font-size="72" font-style="italic">${esc(boxBig)}</text>
    ${boxSmall.map((l, i) => `<text x="54" y="${252 + i * 39}" fill="${C.gray}" font-family="${MONO}" font-size="25">${esc(l)}</text>`).join('')}
  </g>
  ${footer(foot)}`);

/* the twist: three bars */
const bars = ({ page, h1, h2, items, note, foot }) => {
  const max = Math.max(...items.map((i) => i.v));
  return svg(`
    ${base({ bg: C.ink, page })}
    <text x="72" y="215" fill="${C.yellow}" font-family="${IMPACT}" font-size="96">${esc(h1)}</text>
    <text x="72" y="312" fill="${C.pale}" font-family="${SERIF}" font-size="92" font-style="italic">${esc(h2)}</text>
    <rect x="72" y="380" width="936" height="620" rx="8" fill="${C.pale}"/>
    ${items.map((it, i) => {
      const x = 130 + i * 300, h = Math.round(380 * (it.v / max)), y = 900 - h;
      return `<rect x="${x}" y="${y}" width="200" height="${h}" fill="${[C.blue, C.cyan, C.yellow][i]}"/>
        <text x="${x + 100}" y="${y - 22}" text-anchor="middle" fill="${C.ink}" font-family="${IMPACT}" font-size="54">${esc(it.label)}</text>
        <text x="${x + 100}" y="${960}" text-anchor="middle" fill="${C.ink}" font-family="${MONO}" font-size="27" font-weight="700">${esc(it.name)}</text>`;
    }).join('')}
    <g transform="translate(72 1060) rotate(-1)"><rect width="936" height="92" fill="${C.blue}"/><text x="35" y="60" fill="${C.pale}" font-family="${SANS}" font-size="34" font-weight="700">${esc(note)}</text></g>
    ${footer(foot)}`);
};

/* what to do: numbered list on pale */
const steps = ({ page, h1, h2, lines, note, foot }) => svg(`
  ${base({ bg: C.pale, page, light: true })}
  <text x="72" y="240" fill="${C.ink}" font-family="${IMPACT}" font-size="100">${esc(h1)}</text>
  <text x="72" y="336" fill="${C.blue}" font-family="${SERIF}" font-size="90" font-style="italic">${esc(h2)}</text>
  <path d="M72 390 H1005" stroke="${C.ink}" stroke-width="5"/>
  <g transform="translate(72 490)" font-family="${MONO}" font-size="30" fill="${C.ink}">
    ${lines.map((l, i) => `<text y="${i * 78}">${esc(l)}</text>`).join('')}
  </g>
  <g transform="translate(72 ${490 + lines.length * 78 + 30}) rotate(-1)"><rect width="900" height="92" fill="${C.ink}"/><text x="35" y="60" fill="${C.yellow}" font-family="${SANS}" font-size="34" font-weight="700">${esc(note)}</text></g>
  ${footer(foot)}`);

/* the close: checklist, stage photo, save line */
const close = ({ h1, h2, checks, verdict, save1, save2, save3, foot }) => svg(`
  ${base({ bg: 'url(#glow)', page: 8 })}
  <text x="72" y="220" fill="${C.yellow}" font-family="${IMPACT}" font-size="91">${esc(h1)}</text>
  <text x="72" y="313" fill="${C.pale}" font-family="${SERIF}" font-size="92" font-style="italic">${esc(h2)}</text>
  <g transform="translate(65 375) rotate(-1)">
    <rect width="950" height="${checks.length * 70 + 170}" fill="${C.pale}"/>
    <g font-family="${MONO}" font-size="27" fill="${C.ink}" font-weight="700">
      ${checks.map((c, i) => `<text x="48" y="${70 + i * 70}">□ ${esc(c)}</text>`).join('')}
    </g>
    <path d="M47 ${checks.length * 70 + 46}H902" stroke="${C.blue}" stroke-width="6"/>
    <text x="48" y="${checks.length * 70 + 104}" fill="${C.blue}" font-family="${IMPACT}" font-size="47">${esc(verdict)}</text>
  </g>
  <g transform="translate(620 874) rotate(1)">
    <rect x="-10" y="-10" width="468" height="362" fill="${C.yellow}"/>
    <svg x="0" y="0" width="448" height="342" viewBox="170 170 780 750" preserveAspectRatio="xMidYMid slice"><image href="${stageUri}" x="0" y="0" width="1122" height="1402"/></svg>
  </g>
  <text x="72" y="1040" fill="${C.yellow}" font-family="${SERIF}" font-size="48" font-style="italic">${esc(save1)}</text>
  <text x="72" y="1100" fill="${C.pale}" font-family="${SANS}" font-size="38" font-weight="700">${esc(save2)}</text>
  <text x="72" y="1150" fill="${C.pale}" font-family="${SANS}" font-size="38" font-weight="700">${esc(save3)}</text>
  ${footer(foot)}`);

/* ---- the two topics ---- */
const TOPICS = {
  'higgsfield-credits': {
    brand: 'AI VIDEO CLUB',
    slides: () => [
      cover({ l1: 'HIGGSFIELD SELLS', l2: 'CREDITS. NOT', l3: 'videos.', boxTop: 'The $1.40 vs 75¢', boxBig: 'VIDEO MATH', pillText: 'SWIPE FOR THE MATH' }),
      shift({ page: 2, kicker: 'THE CATCH', h1: 'THE PRICE', h2: "isn't the price.", body: ['You buy credits.', 'A video costs credits.', 'Nobody converts the two.'],
        boxTop: '200 credits is not', boxBig: '200 videos.', boxSmall: ['A Seedance 2.0 Fast video eats about 18.', 'Seedance 2.5 costs more, and Starter has none.'], foot: 'COUNT THE VIDEOS, NOT THE DOLLARS' }),
      plan({ page: 3, n: '01', tier: 'Starter', price: '$15 / MO', sub: '200 credits a month', lines: ['≈ 11 Seedance 2.0 Fast videos', '$1.36 per video', 'No Seedance 2.5 at all'], big: '$1.36', bigLabel: 'What one video actually costs you', badge: 'CHEAPEST PLAN. PRICIEST VIDEO.', foot: 'HIGGSFIELD.AI/PRICING · ANNUAL' }),
      plan({ page: 4, n: '02', tier: 'Plus', price: '$39 / MO', sub: '1,000 credits a month · $59 if monthly', lines: ['≈ 44 Seedance 2.0 videos', '89¢ per video', 'Seedance 2.5 starts here, 1080p'], big: '89¢', bigLabel: 'What one video actually costs you', badge: 'FIRST PLAN WITH SEEDANCE 2.5', foot: 'HIGGSFIELD.AI/PRICING · ANNUAL', dark: true }),
      plan({ page: 5, n: '03', tier: 'Ultra', price: '$99 / MO', sub: '3,000 credits a month · $129 if monthly', lines: ['≈ 133 Seedance 2.0 videos', '74¢ per video', 'Seedance 2.0 at 4K, full access'], big: '74¢', bigLabel: 'What one video actually costs you', badge: 'MOST VIDEO PER DOLLAR', foot: 'HIGGSFIELD.AI/PRICING · ANNUAL' }),
      bars({ page: 6, h1: 'THE EXPENSIVE PLAN', h2: 'is the cheap one.', items: [{ name: 'STARTER', label: '$1.36', v: 136 }, { name: 'PLUS', label: '89¢', v: 89 }, { name: 'ULTRA', label: '74¢', v: 74 }], note: 'Per video, Ultra costs about half of Starter.', foot: 'PRICE PER SEEDANCE VIDEO' }),
      steps({ page: 7, h1: 'PICK A PLAN', h2: 'in 3 lines.', lines: ['01  Count the videos you will actually make this month', '02  Multiply by ~18 credits (2.0 Fast) or more (2.5)', '03  Buy the plan that covers it — not the cheapest one'], note: 'Need Seedance 2.5? Starter is not an option.', foot: 'ONE MINUTE OF MATH SAVES A MONTH OF CREDITS' }),
      close({ h1: 'DO THE', h2: 'math first.', checks: ['I know how many videos I need', 'I know what one video costs in credits', 'I know which plan actually has my model', 'I compared price per video, not per month'], verdict: '4/4? BUY THE PLAN.', save1: 'Save this.', save2: 'Pick your plan.', save3: 'Share what you made in AI Video Club.', foot: 'CREDITS ARE THE PRICE. VIDEOS ARE THE PRODUCT.' }),
    ],
  },
  'claude-code-in-pro': {
    brand: 'CLAUDE CODEX MASTERY',
    slides: () => [
      cover({ l1: 'CLAUDE CODE', l2: 'IS ON PRO,', l3: 'not Max.', boxTop: 'Not the $100 plan.', boxBig: '$17 A MONTH', pillText: 'SWIPE FOR THE PROOF' }),
      shift({ page: 2, kicker: 'THE MYTH', h1: 'MAX', h2: "isn't required.", body: ['People assume Claude Code', 'is a Max feature.', 'The pricing page says otherwise.'],
        boxTop: "It's listed under", boxBig: 'Pro.', boxSmall: ['Right next to Design, Slides, Docs and Projects.', 'claude.com/pricing — the middle column.'], foot: 'READ THE MIDDLE COLUMN' }),
      plan({ page: 3, n: '01', tier: 'Free', price: '$0', sub: 'Free for everyone', lines: ['Chat on web, desktop, mobile', 'Search, files, memory, artifacts', 'No Claude Code'], big: '$0', bigLabel: 'Per month — and no Claude Code', badge: 'GOOD FOR CHAT. NOT FOR BUILDING.', foot: 'CLAUDE.COM/PRICING' }),
      plan({ page: 4, n: '02', tier: 'Pro', price: '$17 / MO', sub: 'Billed annually · $20 if monthly', lines: ['Claude Code ✓', 'Design, Slides, Docs ✓', 'Projects + more models ✓'], big: '$17', bigLabel: 'Per month, and Claude Code is in', badge: 'THIS IS THE PLAN', foot: 'CLAUDE.COM/PRICING', dark: true }),
      plan({ page: 5, n: '03', tier: 'Max', price: 'FROM $100', sub: 'Per month', lines: ['Everything in Pro', 'Same models. Same Claude Code.', '5× or 20× the usage of Pro'], big: '5× / 20×', bigLabel: 'More usage. Same Claude Code.', badge: 'HEADROOM, NOT FEATURES', foot: 'CLAUDE.COM/PRICING' }),
      bars({ page: 6, h1: 'MAX BUYS', h2: 'headroom.', items: [{ name: 'PRO', label: '1×', v: 1 }, { name: 'MAX 5×', label: '5×', v: 5 }, { name: 'MAX 20×', label: '20×', v: 20 }], note: 'Same models. You pay for the ceiling, and most never hit it.', foot: 'USAGE, NOT CAPABILITY' }),
      steps({ page: 7, h1: 'START ON', h2: 'Pro.', lines: ['01  Get Pro. $17 annual, $20 monthly', '02  Build until Claude Code says you hit a limit', '03  Upgrade that week — not before'], note: 'If you never see the limit, you never needed Max.', foot: 'UPGRADE ON EVIDENCE, NOT ON FEAR' }),
      close({ h1: 'SHIP ON', h2: 'seventeen dollars.', checks: ['I am on Pro, not Max', 'Claude Code is installed and running', 'I have shipped one real thing with it', 'I have hit a limit — or I have not'], verdict: 'HIT THE LIMIT? NOW UPGRADE.', save1: 'Save this.', save2: 'Build one thing.', save3: 'Share it in Claude Codex Mastery.', foot: 'THE $100 PLAN IS FOR AFTER YOU NEED IT' }),
    ],
  },
};

const spec = TOPICS[topic];
if (!spec) { console.error(`unknown topic: ${topic}`); process.exit(1); }
BRAND = spec.brand;
const slides = spec.slides();

for (let i = 0; i < slides.length; i += 1) {
  const index = String(i + 1).padStart(2, '0');
  fs.writeFileSync(path.join(outDir, `slide-${index}.svg`), slides[i]);
  await sharp(Buffer.from(slides[i])).png({ quality: 100, compressionLevel: 9 }).toFile(path.join(outDir, `slide-${index}.png`));
}
const thumbW = 270, thumbH = 338, gutter = 20;
const composites = [];
for (let i = 0; i < slides.length; i += 1) {
  const input = await sharp(path.join(outDir, `slide-${String(i + 1).padStart(2, '0')}.png`)).resize(thumbW, thumbH).toBuffer();
  composites.push({ input, left: gutter + (i % 4) * (thumbW + gutter), top: gutter + Math.floor(i / 4) * (thumbH + gutter) });
}
await sharp({ create: { width: thumbW * 4 + gutter * 5, height: thumbH * 2 + gutter * 3, channels: 3, background: '#e7e7e2' } })
  .composite(composites).png().toFile(path.join(outDir, 'carousel-preview.png'));
console.log(`Generated ${slides.length} slides in ${outDir}`);
