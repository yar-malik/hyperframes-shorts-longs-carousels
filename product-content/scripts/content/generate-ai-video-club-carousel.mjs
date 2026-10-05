import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceDir = path.join(root, 'content/generated/ai-video-club-carousel');
const outDir = process.env.CAROUSEL_OUT_DIR || sourceDir;
const facePath = process.env.CAROUSEL_FACE_PATH || path.join(sourceDir, 'yar-cutout-v2.png');
const stagePath = process.env.CAROUSEL_STAGE_PATH || path.join(sourceDir, 'yar-on-stage-eyes-corrected.png');
fs.mkdirSync(outDir, { recursive: true });

const face = fs.readFileSync(facePath).toString('base64');
const faceUri = `data:image/png;base64,${face}`;
const stage = fs.readFileSync(stagePath).toString('base64');
const stageUri = `data:image/png;base64,${stage}`;

const W = 1080;
const H = 1350;
const C = {
  ink: '#101116',
  blue: '#183cff',
  pale: '#f6f5ed',
  yellow: '#f0f36b',
  ice: '#dfe7ff',
  cyan: '#49d8ff',
  gray: '#b9bdd0',
};

const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

function defs() {
  return `
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
      <pattern id="dots" width="13" height="13" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill="${C.pale}" opacity=".18"/>
      </pattern>
      <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
        <path d="M44 0H0V44" fill="none" stroke="${C.ice}" stroke-width="1" opacity=".16"/>
      </pattern>
      <clipPath id="portraitClip"><path d="M30,95 Q55,20 165,24 H760 Q878,32 900,125 V855 H24 Z"/></clipPath>
    </defs>`;
}

function base({ bg = C.ink, page = 1, total = 8, light = false }) {
  const fg = light ? C.ink : C.pale;
  return `
    <rect width="${W}" height="${H}" fill="${bg}"/>
    <rect width="${W}" height="${H}" fill="url(#dots)" opacity="${light ? '.22' : '.42'}"/>
    <rect x="34" y="34" width="1012" height="1282" rx="26" fill="none" stroke="${fg}" stroke-width="2" opacity=".45"/>
    <text x="72" y="92" fill="${fg}" font-family="Courier New, monospace" font-size="24" font-weight="700" letter-spacing="2">AI VIDEO CLUB</text>
    <text x="1008" y="92" text-anchor="end" fill="${fg}" font-family="Courier New, monospace" font-size="22">${String(page).padStart(2, '0')} / ${String(total).padStart(2, '0')}</text>`;
}

function footer(text = 'MAKE AI ADS PEOPLE BELIEVE') {
  return `<text x="72" y="1280" fill="${C.gray}" font-family="Courier New, monospace" font-size="19" letter-spacing="1.8">${esc(text)}</text>`;
}

function pill(x, y, text, fill = C.yellow, color = C.ink, width) {
  const w = width || Math.max(150, text.length * 15 + 52);
  return `<g transform="translate(${x} ${y}) rotate(-1)"><rect width="${w}" height="50" rx="4" fill="${fill}"/><text x="22" y="34" fill="${color}" font-family="Courier New, monospace" font-size="23" font-weight="700">${esc(text)}</text></g>`;
}

function arrow(x, y, color = C.yellow) {
  return `<path d="M${x} ${y}h95m-26-25 27 25-27 25" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter"/>`;
}

function svg(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs()}${content}<rect width="${W}" height="${H}" fill="none" filter="url(#grain)"/></svg>`;
}

const slides = [
  svg(`
    <image href="${stageUri}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>
    <rect width="1080" height="610" fill="url(#coverShade)"/>
    <rect y="1010" width="1080" height="340" fill="#080a12" opacity=".47"/>
    <rect width="1080" height="1350" fill="url(#grid)" opacity=".45"/>
    <rect x="34" y="34" width="1012" height="1282" rx="26" fill="none" stroke="${C.pale}" stroke-width="2" opacity=".55"/>
    <text x="72" y="92" fill="${C.pale}" font-family="Courier New, monospace" font-size="24" font-weight="700" letter-spacing="2">AI VIDEO CLUB</text>
    <text x="1008" y="92" text-anchor="end" fill="${C.pale}" font-family="Courier New, monospace" font-size="22">01 / 08</text>
    <text x="72" y="190" fill="${C.yellow}" font-family="Impact, Arial Black, sans-serif" font-size="88" letter-spacing="-1">YOUR AI ADS</text>
    <text x="72" y="280" fill="${C.yellow}" font-family="Impact, Arial Black, sans-serif" font-size="94" letter-spacing="-2">STILL LOOK</text>
    <text x="72" y="372" fill="${C.pale}" font-family="Georgia, serif" font-size="108" font-style="italic">fake.</text>
    <g transform="translate(70 1085) rotate(-1)">
      <rect width="820" height="145" fill="${C.pale}" opacity=".97"/>
      <text x="38" y="56" fill="${C.blue}" font-family="Georgia, serif" font-size="39">The 6-Layer</text>
      <text x="38" y="116" fill="${C.ink}" font-family="Impact, Arial Black, sans-serif" font-size="55" letter-spacing="1">REALISM STACK</text>
    </g>
    ${pill(72, 1244, 'SWIPE FOR THE SYSTEM', C.blue, C.pale, 470)}
    ${arrow(895, 1268, C.yellow)}
  `),

  svg(`
    ${base({ bg: C.pale, page: 2, light: true })}
    ${pill(72, 145, 'THE BIG SHIFT', C.blue, C.pale, 280)}
    <text x="72" y="300" fill="${C.ink}" font-family="Impact, Arial Black, sans-serif" font-size="112">REALISM</text>
    <text x="72" y="405" fill="${C.blue}" font-family="Georgia, serif" font-size="105" font-style="italic">isn't 8K.</text>
    <path d="M72 458 H1005" stroke="${C.ink}" stroke-width="5"/>
    <text x="72" y="570" fill="${C.ink}" font-family="Arial, sans-serif" font-size="54" font-weight="700">People forgive:</text>
    <g font-family="Courier New, monospace" font-size="33" fill="${C.ink}">
      <text x="102" y="645">✓ noise</text><text x="388" y="645">✓ shaky footage</text>
      <text x="102" y="710">✓ bad lighting</text><text x="388" y="710">✓ phone audio</text>
    </g>
    <g transform="translate(65 770) rotate(-1)" filter="url(#rough)">
      <rect width="950" height="340" fill="${C.ink}"/>
      <text x="54" y="91" fill="${C.yellow}" font-family="Arial, sans-serif" font-size="44" font-weight="700">They notice broken</text>
      <text x="54" y="174" fill="${C.pale}" font-family="Georgia, serif" font-size="72" font-style="italic">cause + effect.</text>
      <text x="54" y="252" fill="${C.gray}" font-family="Courier New, monospace" font-size="25">A floating product. A changing face.</text>
      <text x="54" y="291" fill="${C.gray}" font-family="Courier New, monospace" font-size="25">A shadow that ignores the light.</text>
    </g>
    ${footer('REALISM = COHERENCE, NOT POLISH')}
  `),

  svg(`
    ${base({ bg: C.ink, page: 3 })}
    <text x="72" y="240" fill="${C.yellow}" font-family="Impact, Arial Black, sans-serif" font-size="164">01</text>
    <text x="280" y="212" fill="${C.pale}" font-family="Georgia, serif" font-size="63">Reference</text>
    <text x="280" y="279" fill="${C.cyan}" font-family="Impact, Arial Black, sans-serif" font-size="73">TRUTH</text>
    <rect x="72" y="352" width="936" height="420" rx="8" fill="${C.ice}"/>
    <g transform="translate(105 390)">
      <rect x="0" y="0" width="340" height="310" fill="${C.blue}"/>
      <circle cx="95" cy="95" r="43" fill="${C.yellow}"/>
      <path d="M48 250 C80 168 135 152 175 184 C220 115 286 128 313 250Z" fill="${C.ink}"/>
      <path d="M32 276H308" stroke="${C.pale}" stroke-width="7"/>
      <text x="385" y="58" fill="${C.ink}" font-family="Arial, sans-serif" font-size="38" font-weight="700">Stop prompting</text>
      <text x="385" y="103" fill="${C.ink}" font-family="Arial, sans-serif" font-size="38" font-weight="700">from memory.</text>
      <text x="385" y="178" fill="${C.ink}" font-family="Courier New, monospace" font-size="25">Pull one real frame.</text>
      <text x="385" y="222" fill="${C.ink}" font-family="Courier New, monospace" font-size="25">Match lens, light, set,</text>
      <text x="385" y="261" fill="${C.ink}" font-family="Courier New, monospace" font-size="25">wardrobe + framing.</text>
    </g>
    <text x="72" y="880" fill="${C.pale}" font-family="Georgia, serif" font-size="61">One specific reference</text>
    <text x="72" y="950" fill="${C.yellow}" font-family="Impact, Arial Black, sans-serif" font-size="74">BEATS 100 ADJECTIVES.</text>
    ${pill(72, 1040, 'PROMPT LESS. OBSERVE MORE.', C.blue, C.pale, 515)}
    ${footer()}
  `),

  svg(`
    ${base({ bg: C.blue, page: 4 })}
    <text x="72" y="245" fill="${C.yellow}" font-family="Impact, Arial Black, sans-serif" font-size="164">02</text>
    <text x="280" y="210" fill="${C.pale}" font-family="Georgia, serif" font-size="59">Physical</text>
    <text x="280" y="281" fill="${C.ink}" font-family="Impact, Arial Black, sans-serif" font-size="69">IMPERFECTION</text>
    <g transform="translate(70 355) rotate(-1)">
      <rect width="940" height="530" fill="${C.pale}"/>
      <text x="48" y="88" fill="${C.ink}" font-family="Arial, sans-serif" font-size="42" font-weight="700">Add what real shoots can't hide:</text>
      <g font-family="Impact, Arial Black, sans-serif" font-size="55" fill="${C.ink}">
        <text x="56" y="185">01  WRINKLES</text>
        <text x="520" y="185">02  DUST</text>
        <text x="56" y="280">03  ASYMMETRY</text>
        <text x="520" y="280">04  GRAIN</text>
        <text x="56" y="375">05  SOFT FOCUS</text>
        <text x="520" y="375">06  SMEARS</text>
      </g>
      <path d="M49 430H882" stroke="${C.blue}" stroke-width="7"/>
      <text x="50" y="485" fill="${C.blue}" font-family="Courier New, monospace" font-size="27" font-weight="700">Perfect surfaces scream “generated.”</text>
    </g>
    <text x="72" y="1006" fill="${C.pale}" font-family="Georgia, serif" font-size="58" font-style="italic">Use imperfection with intent.</text>
    <text x="72" y="1082" fill="${C.yellow}" font-family="Impact, Arial Black, sans-serif" font-size="68">DON'T ADD RANDOM DAMAGE.</text>
    ${footer()}
  `),

  svg(`
    ${base({ bg: C.pale, page: 5, light: true })}
    <text x="72" y="245" fill="${C.blue}" font-family="Impact, Arial Black, sans-serif" font-size="164">03</text>
    <text x="280" y="210" fill="${C.ink}" font-family="Georgia, serif" font-size="59">Camera</text>
    <text x="280" y="281" fill="${C.blue}" font-family="Impact, Arial Black, sans-serif" font-size="75">BEHAVIOR</text>
    <g transform="translate(72 345)">
      <rect width="936" height="205" fill="${C.ink}"/>
      <text x="50" y="78" fill="${C.yellow}" font-family="Arial, sans-serif" font-size="41" font-weight="700">Pick ONE camera language.</text>
      <text x="50" y="136" fill="${C.pale}" font-family="Courier New, monospace" font-size="25">Then make lens, motion and focus obey it.</text>
    </g>
    <g transform="translate(72 600)" font-family="Courier New, monospace">
      <g><rect width="290" height="410" fill="${C.blue}"/><text x="28" y="64" fill="${C.yellow}" font-size="26" font-weight="700">PHONE UGC</text><path d="M110 112h72v154h-72z" fill="none" stroke="${C.pale}" stroke-width="7"/><circle cx="146" cy="246" r="5" fill="${C.pale}"/><text x="28" y="329" fill="${C.pale}" font-size="22">wide lens</text><text x="28" y="364" fill="${C.pale}" font-size="22">hand drift</text></g>
      <g transform="translate(323)"><rect width="290" height="410" fill="${C.ice}"/><text x="28" y="64" fill="${C.ink}" font-size="26" font-weight="700">DOCUMENTARY</text><path d="M70 190l62-48 89 18v94l-89 18-62-48z" fill="none" stroke="${C.ink}" stroke-width="7"/><text x="28" y="329" fill="${C.ink}" font-size="22">shoulder cam</text><text x="28" y="364" fill="${C.ink}" font-size="22">focus hunts</text></g>
      <g transform="translate(646)"><rect width="290" height="410" fill="${C.yellow}"/><text x="28" y="64" fill="${C.ink}" font-size="26" font-weight="700">PRODUCT MACRO</text><circle cx="145" cy="190" r="72" fill="none" stroke="${C.ink}" stroke-width="8"/><circle cx="145" cy="190" r="26" fill="${C.blue}"/><text x="28" y="329" fill="${C.ink}" font-size="22">locked frame</text><text x="28" y="364" fill="${C.ink}" font-size="22">shallow DOF</text></g>
    </g>
    ${footer('IF THE CAMERA LIES, THE WHOLE SHOT LIES')}
  `),

  svg(`
    ${base({ bg: C.ink, page: 6 })}
    <text x="72" y="245" fill="${C.yellow}" font-family="Impact, Arial Black, sans-serif" font-size="164">04</text>
    <text x="280" y="210" fill="${C.pale}" font-family="Georgia, serif" font-size="59">Continuity</text>
    <text x="280" y="281" fill="${C.cyan}" font-family="Impact, Arial Black, sans-serif" font-size="72">CONTROL</text>
    <text x="72" y="395" fill="${C.pale}" font-family="Arial, sans-serif" font-size="43" font-weight="700">Realism dies between frames.</text>
    <g transform="translate(72 455)">
      <rect width="936" height="350" fill="${C.ice}"/>
      <g fill="none" stroke="${C.blue}" stroke-width="9"><circle cx="155" cy="124" r="55"/><circle cx="468" cy="124" r="55"/><circle cx="781" cy="124" r="55"/><path d="M210 124H410M523 124H723"/></g>
      <g fill="${C.ink}" font-family="Courier New, monospace" font-weight="700" font-size="22" text-anchor="middle">
        <text x="155" y="223">WARDROBE</text><text x="468" y="223">PRODUCT</text><text x="781" y="223">LIGHT</text>
      </g>
      <text x="468" y="301" text-anchor="middle" fill="${C.ink}" font-family="Georgia, serif" font-size="35" font-style="italic">Same world. Every shot.</text>
    </g>
    <g font-family="Arial, sans-serif" font-size="37" fill="${C.pale}">
      <text x="88" y="916"><tspan fill="${C.yellow}" font-weight="700">→</tspan> Generate short shots.</text>
      <text x="88" y="984"><tspan fill="${C.yellow}" font-weight="700">→</tspan> Lock hero assets.</text>
      <text x="88" y="1052"><tspan fill="${C.yellow}" font-weight="700">→</tspan> Bridge changes with inserts.</text>
    </g>
    ${pill(72, 1124, 'CUT AROUND THE ARTIFACT', C.blue, C.pale, 490)}
    ${footer()}
  `),

  svg(`
    ${base({ bg: C.yellow, page: 7, light: true })}
    <text x="72" y="236" fill="${C.blue}" font-family="Impact, Arial Black, sans-serif" font-size="116">05/06</text>
    <text x="410" y="210" fill="${C.ink}" font-family="Georgia, serif" font-size="56">Sound +</text>
    <text x="410" y="279" fill="${C.blue}" font-family="Impact, Arial Black, sans-serif" font-size="71">THE EDIT</text>
    <g transform="translate(70 350)">
      <rect width="940" height="180" fill="${C.ink}"/>
      <path d="M46 94 h35 l18-38 27 77 30-59 25 45 24-25 h33 l17-42 29 82 27-63 29 50 25-27 h34 l20-40 27 78 30-65 27 54 25-27 h44 l18-36 27 70 28-49 26 28 24-12 h78" fill="none" stroke="${C.cyan}" stroke-width="7"/>
    </g>
    <text x="72" y="642" fill="${C.ink}" font-family="Georgia, serif" font-size="64" font-style="italic">Real audio sells</text>
    <text x="72" y="716" fill="${C.blue}" font-family="Impact, Arial Black, sans-serif" font-size="77">REAL VIDEO.</text>
    <g transform="translate(72 785)" font-family="Courier New, monospace" font-size="28" fill="${C.ink}">
      <text y="0">01  room tone + breaths</text>
      <text y="62">02  J-cuts into the next shot</text>
      <text y="124">03  music that doesn't over-polish</text>
      <text y="186">04  cut BEFORE the artifact appears</text>
    </g>
    <g transform="translate(72 1065) rotate(-1)"><rect width="850" height="92" fill="${C.blue}"/><text x="35" y="60" fill="${C.pale}" font-family="Arial, sans-serif" font-size="34" font-weight="700">If it feels one beat too long—cut it.</text></g>
    ${footer('AUDIO IS HALF THE ILLUSION')}
  `),

  svg(`
    ${base({ bg: 'url(#glow)', page: 8 })}
    <text x="72" y="220" fill="${C.yellow}" font-family="Impact, Arial Black, sans-serif" font-size="91">PASS THE</text>
    <text x="72" y="313" fill="${C.pale}" font-family="Georgia, serif" font-size="92" font-style="italic">realism test.</text>
    <g transform="translate(65 375) rotate(-1)">
      <rect width="950" height="570" fill="${C.pale}"/>
      <g font-family="Courier New, monospace" font-size="27" fill="${C.ink}" font-weight="700">
        <text x="48" y="70">□ One real reference frame</text>
        <text x="48" y="140">□ Imperfection that fits the scene</text>
        <text x="48" y="210">□ One consistent camera language</text>
        <text x="48" y="280">□ Face, product, light stay locked</text>
        <text x="48" y="350">□ Room tone + natural timing</text>
        <text x="48" y="420">□ Every artifact hidden by the edit</text>
      </g>
      <path d="M47 466H902" stroke="${C.blue}" stroke-width="6"/>
      <text x="48" y="524" fill="${C.blue}" font-family="Impact, Arial Black, sans-serif" font-size="47">6/6? SHIP THE AD.</text>
    </g>
    <g transform="translate(620 874) rotate(1)">
      <rect x="-10" y="-10" width="468" height="362" fill="${C.yellow}"/>
      <svg x="0" y="0" width="448" height="342" viewBox="170 170 780 750" preserveAspectRatio="xMidYMid slice">
        <image href="${stageUri}" x="0" y="0" width="1122" height="1402"/>
      </svg>
    </g>
    <text x="72" y="1040" fill="${C.yellow}" font-family="Georgia, serif" font-size="48" font-style="italic">Save this.</text>
    <text x="72" y="1100" fill="${C.pale}" font-family="Arial, sans-serif" font-size="38" font-weight="700">Build one ad.</text>
    <text x="72" y="1150" fill="${C.pale}" font-family="Arial, sans-serif" font-size="38" font-weight="700">Share it in AI Video Club.</text>
    ${footer('REALISTIC AI ADS ARE DIRECTED, NOT GENERATED')}
  `),
];

for (let i = 0; i < slides.length; i += 1) {
  const index = String(i + 1).padStart(2, '0');
  const svgPath = path.join(outDir, `slide-${index}.svg`);
  const pngPath = path.join(outDir, `slide-${index}.png`);
  fs.writeFileSync(svgPath, slides[i]);
  await sharp(Buffer.from(slides[i])).png({ quality: 100, compressionLevel: 9 }).toFile(pngPath);
}

const thumbW = 270;
const thumbH = 338;
const gutter = 20;
const sheet = sharp({
  create: {
    width: thumbW * 4 + gutter * 5,
    height: thumbH * 2 + gutter * 3,
    channels: 3,
    background: '#e7e7e2',
  },
});
const composites = [];
for (let i = 0; i < 8; i += 1) {
  const input = await sharp(path.join(outDir, `slide-${String(i + 1).padStart(2, '0')}.png`))
    .resize(thumbW, thumbH)
    .toBuffer();
  composites.push({
    input,
    left: gutter + (i % 4) * (thumbW + gutter),
    top: gutter + Math.floor(i / 4) * (thumbH + gutter),
  });
}
await sheet.composite(composites).png().toFile(path.join(outDir, 'carousel-preview.png'));

console.log(`Generated ${slides.length} slides in ${outDir}`);
