import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const outDir = path.resolve("content/instagram/claude-review-loop-2026-09-09");
fs.mkdirSync(outDir, { recursive: true });

const W = 1080;
const H = 1350;
const ink = "#07111F";
const paper = "#F5F1E8";
const blue = "#1677FF";
const cyan = "#58D8FF";
const orange = "#FF6A2A";
const muted = "#8EA0B7";
const grid = "#D9D3C7";

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function lines(text, x, y, size, leading, opts = {}) {
  const { fill = ink, weight = 800, family = "Arial, Helvetica, sans-serif", anchor = "start", letterSpacing = 0 } = opts;
  return text.split("\n").map((line, i) => `<text x="${x}" y="${y + i * leading}" fill="${fill}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${letterSpacing}">${esc(line)}</text>`).join("\n");
}

function base({ dark = false, page = "01 / 08", eyebrow = "CCM FIELD NOTES", accent = blue } = {}) {
  const bg = dark ? ink : paper;
  const fg = dark ? paper : ink;
  const gridColor = dark ? "#14253A" : grid;
  return `<rect width="${W}" height="${H}" fill="${bg}"/>
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${gridColor}" stroke-width="1" opacity="${dark ? 0.35 : 0.55}"/>
      <circle cx="0" cy="0" r="1.8" fill="${gridColor}" opacity=".5"/>
    </pattern>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#000" flood-opacity=".28"/></filter>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${blue}"/><stop offset="1" stop-color="${cyan}"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect x="52" y="42" width="54" height="34" rx="7" fill="${accent}"/>
  <text x="79" y="67" fill="#fff" font-family="Arial" font-size="17" font-weight="900" text-anchor="middle">CCM</text>
  <text x="122" y="67" fill="${fg}" font-family="Arial" font-size="17" font-weight="800" letter-spacing="2.2">${eyebrow}</text>
  <text x="1028" y="67" fill="${dark ? muted : "#586579"}" font-family="Arial" font-size="17" font-weight="800" text-anchor="end" letter-spacing="2">${page}</text>
  <text x="54" y="1305" fill="${dark ? muted : "#586579"}" font-family="Arial" font-size="15" font-weight="800" letter-spacing="1.7">CLAUDECODEXMASTERY.SPACE</text>`;
}

function svg(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${content}</svg>`;
}

const slides = [
  svg(`${base({ dark: true, page: "01 / 08", eyebrow: "THE REVIEW LOOP", accent: orange })}
    <rect x="54" y="142" width="314" height="44" rx="22" fill="#11253C" stroke="${orange}" stroke-width="2"/>
    ${lines("STOP THE SILENT QUALITY CEILING", 75, 171, 18, 22, { fill: orange, weight: 900, letterSpacing: 1.2 })}
    ${lines("Claude shouldn’t\ngrade its own\nwork.", 54, 300, 98, 106, { fill: paper, weight: 900 })}
    ${lines("Build with one agent. Review with three fresh critics.\nShip only what survives the loop.", 58, 665, 29, 42, { fill: "#B8C6D8", weight: 600 })}
    <g transform="translate(80 830)" filter="url(#shadow)">
      <rect width="920" height="320" rx="34" fill="#0D1B2D" stroke="#27405E" stroke-width="2"/>
      <path d="M195 160 H375" stroke="${blue}" stroke-width="12" stroke-linecap="round"/><path d="M545 160 H725" stroke="${orange}" stroke-width="12" stroke-linecap="round"/>
      <path d="M350 135 l30 25 -30 25" fill="none" stroke="${blue}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M700 135 l30 25 -30 25" fill="none" stroke="${orange}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="145" cy="160" r="76" fill="#102A46" stroke="${blue}" stroke-width="5"/>
      <circle cx="460" cy="160" r="76" fill="#172132" stroke="${paper}" stroke-width="5"/>
      <circle cx="775" cy="160" r="76" fill="#352013" stroke="${orange}" stroke-width="5"/>
      <text x="145" y="151" text-anchor="middle" fill="${paper}" font-family="Arial" font-size="28" font-weight="900">BUILD</text><text x="145" y="184" text-anchor="middle" fill="${cyan}" font-family="Arial" font-size="18" font-weight="800">01</text>
      <text x="460" y="151" text-anchor="middle" fill="${paper}" font-family="Arial" font-size="28" font-weight="900">REVIEW</text><text x="460" y="184" text-anchor="middle" fill="#B8C6D8" font-family="Arial" font-size="18" font-weight="800">×3</text>
      <text x="775" y="151" text-anchor="middle" fill="${paper}" font-family="Arial" font-size="28" font-weight="900">SHIP</text><text x="775" y="184" text-anchor="middle" fill="${orange}" font-family="Arial" font-size="18" font-weight="800">PASS</text>
    </g>
    <text x="1020" y="1307" fill="${paper}" font-family="Arial" font-size="20" font-weight="900" text-anchor="end">SWIPE →</text>`),

  svg(`${base({ dark: false, page: "02 / 08", eyebrow: "THE FAILURE MODE", accent: blue })}
    ${lines("One model.\nOne blind spot.", 54, 250, 105, 110, { fill: ink, weight: 900 })}
    ${lines("The same context that created the work also explains away\nits mistakes. That’s not review. That’s self-defense.", 58, 510, 29, 42, { fill: "#425066", weight: 600 })}
    <g transform="translate(54 680)">
      <rect width="972" height="440" rx="30" fill="#fff" stroke="#CFC8BC" stroke-width="2"/>
      <rect x="38" y="40" width="420" height="340" rx="26" fill="#EAF2FF" stroke="${blue}" stroke-width="3"/>
      <rect x="514" y="40" width="420" height="340" rx="26" fill="#FFF0E8" stroke="${orange}" stroke-width="3"/>
      <text x="70" y="95" fill="${blue}" font-family="Arial" font-size="21" font-weight="900" letter-spacing="2">CREATOR</text>
      <text x="546" y="95" fill="${orange}" font-family="Arial" font-size="21" font-weight="900" letter-spacing="2">SAME-THREAD CRITIC</text>
      ${lines("“I followed the\nplan. Looks done.”", 70, 175, 42, 55, { fill: ink, weight: 900 })}
      ${lines("“Agreed.\nLooks done.”", 546, 175, 42, 55, { fill: ink, weight: 900 })}
      <path d="M238 334 C390 415 585 415 724 334" fill="none" stroke="#9BA9BA" stroke-width="7" stroke-dasharray="15 14"/>
      <text x="486" y="410" text-anchor="middle" fill="#68788E" font-family="Arial" font-size="19" font-weight="800">SHARED ASSUMPTIONS</text>
    </g>`),

  svg(`${base({ dark: true, page: "03 / 08", eyebrow: "CRITIC 01 — BRIEF", accent: blue })}
    <text x="54" y="240" fill="${blue}" font-family="Arial" font-size="82" font-weight="900">01</text>
    ${lines("Did it follow\nthe actual brief?", 176, 240, 82, 90, { fill: paper, weight: 900 })}
    ${lines("Turn every requirement into a pass / fail checklist.\nNo taste. No vibes. Just coverage.", 58, 470, 29, 42, { fill: "#B8C6D8", weight: 600 })}
    <g transform="translate(54 650)">
      <rect width="972" height="460" rx="32" fill="#0E1D30" stroke="#29425F" stroke-width="2"/>
      ${[
        ["Hero says the core promise", true],
        ["Primary CTA appears once", true],
        ["Mobile layout was specified", false],
        ["Every requested section exists", true]
      ].map((d, i) => `<g transform="translate(40 ${45 + i * 98})"><rect width="64" height="64" rx="14" fill="${d[1] ? blue : "#3A1F1A"}" stroke="${d[1] ? cyan : orange}" stroke-width="2"/><path d="${d[1] ? "M17 34 l12 12 22 -28" : "M18 18 l28 28 M46 18 L18 46"}" fill="none" stroke="${d[1] ? "#fff" : orange}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><text x="92" y="43" fill="${paper}" font-family="Arial" font-size="28" font-weight="800">${d[0]}</text><text x="900" y="43" fill="${d[1] ? cyan : orange}" font-family="Arial" font-size="20" font-weight="900" text-anchor="end">${d[1] ? "PASS" : "MISSING"}</text></g>`).join("")}
    </g>
    <rect x="54" y="1152" width="972" height="84" rx="22" fill="${blue}"/>
    <text x="92" y="1205" fill="#fff" font-family="Arial" font-size="25" font-weight="900">OUTPUT: the exact gaps — not a rewrite.</text>`),

  svg(`${base({ dark: false, page: "04 / 08", eyebrow: "CRITIC 02 — SYSTEM", accent: orange })}
    <text x="54" y="240" fill="${orange}" font-family="Arial" font-size="82" font-weight="900">02</text>
    ${lines("Does it obey\nyour design system?", 176, 240, 78, 88, { fill: ink, weight: 900 })}
    ${lines("Compare the output against tokens: colour, type, spacing,\nradius and component rules. Your brand wins.", 58, 470, 29, 42, { fill: "#425066", weight: 600 })}
    <g transform="translate(54 650)">
      <rect width="972" height="470" rx="32" fill="#fff" stroke="#CFC8BC" stroke-width="2"/>
      <text x="42" y="66" fill="#607086" font-family="Arial" font-size="18" font-weight="900" letter-spacing="2">TOKEN AUDIT</text>
      <g transform="translate(42 105)">
        <circle cx="42" cy="42" r="42" fill="${ink}"/><circle cx="142" cy="42" r="42" fill="${blue}"/><circle cx="242" cy="42" r="42" fill="${orange}"/><circle cx="342" cy="42" r="42" fill="${paper}" stroke="#CFC8BC" stroke-width="2"/>
        <text x="440" y="34" fill="${ink}" font-family="Arial" font-size="27" font-weight="900">COLOUR</text><text x="440" y="66" fill="#607086" font-family="Arial" font-size="20" font-weight="700">4 approved roles</text>
      </g>
      <line x1="42" y1="220" x2="930" y2="220" stroke="#D9D3C7" stroke-width="2"/>
      <g transform="translate(42 260)">
        <text x="0" y="56" fill="${ink}" font-family="Arial" font-size="56" font-weight="900">Aa</text><text x="120" y="40" fill="${ink}" font-family="Arial" font-size="27" font-weight="900">TYPE</text><text x="120" y="70" fill="#607086" font-family="Arial" font-size="20" font-weight="700">2 families · 5 sizes</text>
        <text x="500" y="40" fill="${ink}" font-family="Arial" font-size="27" font-weight="900">SPACING</text><text x="500" y="70" fill="#607086" font-family="Arial" font-size="20" font-weight="700">8px base grid</text>
        ${[0,1,2,3].map(i => `<rect x="500" y="${100+i*28}" width="${110+i*60}" height="12" rx="6" fill="${i===3 ? orange : blue}" opacity="${.45+i*.17}"/>`).join("")}
      </g>
    </g>
    <rect x="54" y="1152" width="972" height="84" rx="22" fill="${orange}"/>
    <text x="92" y="1205" fill="#fff" font-family="Arial" font-size="25" font-weight="900">OUTPUT: every token violation, with the fix.</text>`),

  svg(`${base({ dark: true, page: "05 / 08", eyebrow: "CRITIC 03 — RENDER", accent: cyan })}
    <text x="54" y="240" fill="${cyan}" font-family="Arial" font-size="82" font-weight="900">03</text>
    ${lines("Does the render\nactually work?", 176, 240, 82, 90, { fill: paper, weight: 900 })}
    ${lines("Review the pixels, not the code. Hierarchy, contrast,\nwrapping and collisions only show up in the image.", 58, 470, 29, 42, { fill: "#B8C6D8", weight: 600 })}
    <g transform="translate(104 630)">
      <rect x="0" y="0" width="500" height="500" rx="36" fill="#111F31" stroke="#31506F" stroke-width="3"/>
      <rect x="42" y="48" width="416" height="82" rx="16" fill="${blue}"/><rect x="42" y="160" width="252" height="28" rx="8" fill="#51657C"/><rect x="42" y="205" width="370" height="28" rx="8" fill="#31475F"/>
      <rect x="42" y="274" width="196" height="158" rx="22" fill="#182C43"/><rect x="262" y="274" width="196" height="158" rx="22" fill="#182C43"/>
      <rect x="262" y="382" width="196" height="50" rx="14" fill="${orange}"/>
      <circle cx="410" cy="178" r="70" fill="none" stroke="${orange}" stroke-width="8"/>
      <line x1="462" y1="230" x2="535" y2="303" stroke="${orange}" stroke-width="14" stroke-linecap="round"/>
    </g>
    <g transform="translate(670 680)">
      ${[["CONTRAST","FAIL",orange],["TYPE SIZE","PASS",cyan],["COLLISION","FAIL",orange],["HIERARCHY","PASS",cyan]].map((d,i)=>`<g transform="translate(0 ${i*105})"><text x="0" y="30" fill="${paper}" font-family="Arial" font-size="24" font-weight="900">${d[0]}</text><rect x="0" y="48" width="300" height="12" rx="6" fill="#24384F"/><rect x="0" y="48" width="${d[1]==="PASS"?260:130}" height="12" rx="6" fill="${d[2]}"/><text x="300" y="30" fill="${d[2]}" font-family="Arial" font-size="19" font-weight="900" text-anchor="end">${d[1]}</text></g>`).join("")}
    </g>`),

  svg(`${base({ dark: false, page: "06 / 08", eyebrow: "CONTEXT HYGIENE", accent: blue })}
    ${lines("Fresh context.\nHonest feedback.", 54, 250, 96, 103, { fill: ink, weight: 900 })}
    ${lines("Each critic gets only the brief, the rules and the output.\nNo build transcript. No excuses. No inherited assumptions.", 58, 500, 29, 42, { fill: "#425066", weight: 600 })}
    <g transform="translate(54 670)">
      <rect width="972" height="390" rx="32" fill="#fff" stroke="#CFC8BC" stroke-width="2"/>
      <g transform="translate(42 50)">
        <rect width="248" height="260" rx="24" fill="#EFF5FF" stroke="${blue}" stroke-width="3"/>
        <text x="124" y="62" text-anchor="middle" fill="${blue}" font-family="Arial" font-size="20" font-weight="900" letter-spacing="2">INPUT</text>
        <text x="124" y="125" text-anchor="middle" fill="${ink}" font-family="Arial" font-size="27" font-weight="900">BRIEF</text><text x="124" y="166" text-anchor="middle" fill="${ink}" font-family="Arial" font-size="27" font-weight="900">RULES</text><text x="124" y="207" text-anchor="middle" fill="${ink}" font-family="Arial" font-size="27" font-weight="900">OUTPUT</text>
      </g>
      <path d="M325 180 H468" stroke="${blue}" stroke-width="10" stroke-linecap="round"/><path d="M450 160 l24 20 -24 20" fill="none" stroke="${blue}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <g transform="translate(500 50)">
        <rect width="430" height="260" rx="24" fill="${ink}"/>
        <text x="34" y="62" fill="${cyan}" font-family="Arial" font-size="20" font-weight="900" letter-spacing="2">CLEAN REVIEW WINDOW</text>
        ${lines("“Find what’s wrong.\nDo not defend it.”", 34, 132, 38, 52, { fill: paper, weight: 900 })}
      </g>
    </g>
    <path d="M250 1150 H830" stroke="#A9B4C1" stroke-width="8" stroke-dasharray="18 16"/>
    <circle cx="250" cy="1150" r="18" fill="${blue}"/><circle cx="540" cy="1150" r="18" fill="${blue}"/><circle cx="830" cy="1150" r="18" fill="${blue}"/>
    <text x="540" y="1210" text-anchor="middle" fill="${ink}" font-family="Arial" font-size="24" font-weight="900">ONE FRESH WINDOW PER CRITIC</text>`),

  svg(`${base({ dark: true, page: "07 / 08", eyebrow: "THE OPERATING LOOP", accent: orange })}
    ${lines("Build. Score.\nPatch. Repeat.", 54, 250, 96, 103, { fill: paper, weight: 900 })}
    ${lines("Set a pass threshold before the work starts.\nOnly failed checks go back for revision.", 58, 500, 29, 42, { fill: "#B8C6D8", weight: 600 })}
    <g transform="translate(80 670)">
      ${[[110,120,"BUILD",blue],[460,120,"REVIEW",paper],[810,120,"PATCH",orange],[460,390,"PASS?",cyan]].map((d)=>`<g><circle cx="${d[0]}" cy="${d[1]}" r="92" fill="#102238" stroke="${d[3]}" stroke-width="5"/><text x="${d[0]}" y="${d[1]+9}" text-anchor="middle" fill="${paper}" font-family="Arial" font-size="27" font-weight="900">${d[2]}</text></g>`).join("")}
      <path d="M205 120 H355 M555 120 H705 M810 215 C810 390 680 390 560 390 M360 390 C220 390 110 320 110 215" fill="none" stroke="#45617F" stroke-width="9" stroke-linecap="round"/>
      <path d="M332 98 l28 22 -28 22 M682 98 l28 22 -28 22 M585 370 l-28 20 28 20 M88 240 l22 -28 22 28" fill="none" stroke="#6783A2" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="600" y="326" width="220" height="54" rx="27" fill="#163C31"/><text x="710" y="362" text-anchor="middle" fill="#75F0BD" font-family="Arial" font-size="20" font-weight="900">YES → SHIP</text>
    </g>
    <rect x="54" y="1160" width="972" height="76" rx="20" fill="#17273B" stroke="#314962" stroke-width="2"/>
    <text x="90" y="1208" fill="${orange}" font-family="Arial" font-size="23" font-weight="900">STOP RULE:</text><text x="250" y="1208" fill="${paper}" font-family="Arial" font-size="23" font-weight="800">all critical checks pass — or max 3 rounds.</text>`),

  svg(`${base({ dark: false, page: "08 / 08", eyebrow: "USE THE LOOP WISELY", accent: orange })}
    ${lines("Spend the extra\ntokens where quality\ncompounds.", 54, 240, 84, 92, { fill: ink, weight: 900 })}
    <g transform="translate(54 590)">
      <rect width="972" height="410" rx="32" fill="#fff" stroke="#CFC8BC" stroke-width="2"/>
      <g transform="translate(40 42)">
        <text x="0" y="30" fill="${blue}" font-family="Arial" font-size="19" font-weight="900" letter-spacing="2">RUN THE LOOP</text>
        ${["Reusable templates","Landing pages","Client deliverables","Design systems"].map((t,i)=>`<g transform="translate(0 ${65+i*72})"><circle cx="18" cy="18" r="18" fill="${blue}"/><path d="M9 18 l7 7 13 -16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><text x="52" y="27" fill="${ink}" font-family="Arial" font-size="26" font-weight="800">${t}</text></g>`).join("")}
      </g>
      <line x1="490" y1="42" x2="490" y2="368" stroke="#D9D3C7" stroke-width="2"/>
      <g transform="translate(535 42)">
        <text x="0" y="30" fill="${orange}" font-family="Arial" font-size="19" font-weight="900" letter-spacing="2">SKIP THE LOOP</text>
        ${["Throwaway drafts","Tiny copy edits","Low-risk experiments","One-off notes"].map((t,i)=>`<g transform="translate(0 ${65+i*72})"><circle cx="18" cy="18" r="18" fill="#FFF0E8" stroke="${orange}" stroke-width="2"/><path d="M10 10 l16 16 M26 10 L10 26" fill="none" stroke="${orange}" stroke-width="5" stroke-linecap="round"/><text x="52" y="27" fill="${ink}" font-family="Arial" font-size="26" font-weight="800">${t}</text></g>`).join("")}
      </g>
    </g>
    <rect x="54" y="1052" width="972" height="150" rx="28" fill="${ink}"/>
    <text x="90" y="1110" fill="${cyan}" font-family="Arial" font-size="19" font-weight="900" letter-spacing="2">SAVE THIS WORKFLOW</text>
    <text x="90" y="1164" fill="${paper}" font-family="Arial" font-size="31" font-weight="900">Which critic would catch your biggest mistake?</text>
    <text x="1020" y="1307" fill="${ink}" font-family="Arial" font-size="20" font-weight="900" text-anchor="end">FOLLOW @YAR.CLAUDECODEX.MASTERY</text>`)
];

slides.forEach((contents, index) => {
  const file = path.join(outDir, `slide-${String(index + 1).padStart(2, "0")}.svg`);
  fs.writeFileSync(file, contents);
});

await Promise.all(slides.map((contents, index) =>
  sharp(Buffer.from(contents))
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, `slide-${String(index + 1).padStart(2, "0")}.png`))
));

const thumbs = await Promise.all(slides.map((contents) =>
  sharp(Buffer.from(contents)).resize(432, 540).png().toBuffer()
));
await sharp({ create: { width: 1728, height: 1080, channels: 4, background: "#CCD3DC" } })
  .composite(thumbs.map((input, i) => ({ input, left: (i % 4) * 432, top: Math.floor(i / 4) * 540 })))
  .png()
  .toFile(path.join(outDir, "carousel-preview.png"));

const caption = `Your AI keeps saying “done” because you asked the same mind to build the work and approve it.\n\nFix the quality ceiling with a three-critic loop:\n\n1. Brief critic — checks every requirement.\n2. System critic — checks your colours, type, spacing and component rules.\n3. Render critic — checks the actual pixels for hierarchy, contrast, wrapping and collisions.\n\nGive each critic a fresh context. Send only the brief, the rules and the output. Then patch the failed checks and run the loop again.\n\nIt costs more tokens, so use it where quality compounds: templates, landing pages, design systems and important client work.\n\nSave this workflow. Which critic would catch the most mistakes in your work?\n\n#ClaudeCode #OpenAICodex #AIAgents #AIAutomation #PromptEngineering #VibeCoding #WebDesign #BuildInPublic`;
fs.writeFileSync(path.join(outDir, "caption.txt"), caption);
console.log(`Created ${slides.length} SVG and PNG slides in ${outDir}`);
