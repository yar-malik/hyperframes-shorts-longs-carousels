import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("content/instagram/claude-review-loop-2026-09-09");
const outDir = path.join(root, "v2");
fs.mkdirSync(outDir, { recursive: true });

const W = 1080, H = 1350;
const navy = "#07111F", paper = "#F4F0E7", white = "#FFFDF8";
const orange = "#FF5A1F", blue = "#1877F2", cyan = "#62D6FF";
const grey = "#AAB6C5", charcoal = "#1A2432";
const avatar = fs.readFileSync(path.join(root, "assets/yar-avatar.jpg")).toString("base64");
const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const txt = (text, x, y, size, leading, fill = navy, weight = 900, anchor = "start", family = "Arial, Helvetica, sans-serif") =>
  text.split("\n").map((line, i) => `<text x="${x}" y="${y + i * leading}" fill="${fill}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${esc(line)}</text>`).join("");

function defs(dark = false) {
  return `<defs>
    <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="${dark ? "#1A2B3F" : "#D8D1C5"}" stroke-width="1" opacity=".58"/></pattern>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.7" fill="${dark ? "#243B55" : "#C7BFB3"}" opacity=".55"/></pattern>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="8" result="n"/><feColorMatrix in="n" type="saturate" values="0" result="g"/><feComponentTransfer in="g"><feFuncA type="table" tableValues="0 .09"/></feComponentTransfer></filter>
    <filter id="shadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".28"/></filter>
    <clipPath id="avatarCircle"><circle cx="260" cy="275" r="205"/></clipPath>
    <clipPath id="avatarTall"><rect x="0" y="0" width="430" height="475" rx="28"/></clipPath>
    <linearGradient id="blueGlow" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0A4DAA"/><stop offset="1" stop-color="#1296FF"/></linearGradient>
  </defs>`;
}

function bg(dark = false, mode = "grid") {
  return `<rect width="1080" height="1350" fill="${dark ? navy : paper}"/><rect width="1080" height="1350" fill="url(#${mode})"/><rect width="1080" height="1350" filter="url(#grain)" opacity=".45"/>`;
}

function mast(page, dark = false, label = "CCM FIELD NOTES") {
  const fg = dark ? white : navy;
  return `<g><rect x="50" y="42" width="52" height="32" rx="5" fill="${page % 2 ? orange : blue}"/><text x="76" y="65" fill="#fff" font-family="Arial" font-size="16" font-weight="900" text-anchor="middle">CCM</text><text x="119" y="65" fill="${fg}" font-family="Arial" font-size="15" font-weight="900" letter-spacing="2.4">${label}</text><text x="1030" y="65" fill="${dark ? grey : "#667487"}" font-family="Arial" font-size="15" font-weight="900" text-anchor="end" letter-spacing="2">${String(page).padStart(2,"0")} / 08</text></g>`;
}

function foot(dark = false, right = "SWIPE →") {
  return `<text x="50" y="1310" fill="${dark ? grey : "#627084"}" font-family="Arial" font-size="14" font-weight="900" letter-spacing="1.8">CLAUDECODEXMASTERY.SPACE</text><text x="1030" y="1310" fill="${dark ? white : navy}" font-family="Arial" font-size="17" font-weight="900" text-anchor="end">${right}</text>`;
}

const frame = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">${body}</svg>`;
const photo = (x, y, w, h, r = 26) => `<g transform="translate(${x} ${y})" filter="url(#shadow)"><clipPath id="photo-${x}-${y}"><rect width="${w}" height="${h}" rx="${r}"/></clipPath><image href="data:image/jpeg;base64,${avatar}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo-${x}-${y})"/><rect width="${w}" height="${h}" rx="${r}" fill="none" stroke="#fff" stroke-width="8"/></g>`;

const slides = [
  frame(`${defs(false)}${bg(false,"dots")}${mast(1,false,"MATT SHUMER’S REVIEW LOOP")}
    <rect x="50" y="116" width="344" height="42" rx="21" fill="none" stroke="${orange}" stroke-width="2"/><text x="72" y="144" fill="${orange}" font-family="Arial" font-size="17" font-weight="900" letter-spacing="1.5">A BETTER WAY TO BUILD WITH AI</text>
    ${txt("Steal the loop that",50,248,80,86)}${txt("10×’d",50,334,88,92,orange)}${txt("my Claude output.",286,334,80,86)}
    ${txt("Three independent critics tear the work apart",53,455,27,38,"#45546A",700)}${txt("before I ever call it finished.",53,493,27,38,"#45546A",700)}
    <g transform="translate(48 575) rotate(-1)"><rect width="984" height="575" rx="34" fill="${navy}" filter="url(#shadow)"/><rect x="22" y="22" width="940" height="531" rx="23" fill="none" stroke="#243D5C" stroke-width="2"/>
      <text x="46" y="74" fill="${cyan}" font-family="Arial" font-size="18" font-weight="900" letter-spacing="2">THE THREE-CRITIC LOOP</text>
      ${txt("BUILD",55,166,45,50,white)}${txt("→",220,166,48,50,blue)}${txt("REVIEW ×3",300,166,45,50,white)}${txt("→",575,166,48,50,orange)}${txt("SHIP",655,166,45,50,white)}
      <path d="M80 244 C265 340 500 342 660 250" fill="none" stroke="#4A6686" stroke-width="7" stroke-dasharray="14 14"/>
      <text x="75" y="408" fill="#8EA3BA" font-family="Arial" font-size="21" font-weight="800">01  BRIEF</text><text x="75" y="448" fill="#8EA3BA" font-family="Arial" font-size="21" font-weight="800">02  SYSTEM</text><text x="75" y="488" fill="#8EA3BA" font-family="Arial" font-size="21" font-weight="800">03  RENDER</text>
      ${photo(530,190,405,335,24)}
      <circle cx="855" cy="454" r="56" fill="${orange}"/><text x="855" y="464" fill="#fff" font-family="Arial" font-size="24" font-weight="900" text-anchor="middle">PASS?</text>
    </g>${foot(false)}`),

  frame(`${defs(true)}${bg(true,"dots")}${mast(2,true,"THE FAILURE MODE")}
    ${txt("Claude marks its",50,225,86,94,white)}${txt("own homework.",50,319,86,94,orange)}
    ${txt("And the answer is nearly always:",53,420,28,38,grey,700)}
    <g transform="translate(50 490)"><rect width="980" height="600" rx="34" fill="#0C192A" stroke="#29425F" stroke-width="2"/>
      ${photo(35,40,430,475,24)}
      <rect x="450" y="74" width="490" height="132" rx="22" fill="${white}"/><path d="M470 205 l-22 48 65-48" fill="${white}"/>
      ${txt("“Looks good.",500,130,45,50,navy)}${txt("Ship it.”",500,181,45,50,navy)}
      <text x="500" y="274" fill="${orange}" font-family="Arial" font-size="19" font-weight="900" letter-spacing="2">THE PROBLEM</text>
      ${txt("The builder remembers",500,330,32,42,white)}${txt("every shortcut it took.",500,372,32,42,white)}
      <line x1="500" y1="426" x2="903" y2="426" stroke="#304A66" stroke-width="2"/>
      ${txt("Same context.",500,476,25,34,grey,800)}${txt("Same assumptions.",500,512,25,34,grey,800)}${txt("Same blind spots.",500,548,25,34,grey,800)}
    </g>
    <path d="M615 1134 C790 1090 900 1120 974 1188" fill="none" stroke="${orange}" stroke-width="8"/><path d="M958 1163 l20 29 -34 4" fill="none" stroke="${orange}" stroke-width="8" stroke-linecap="round"/><text x="590" y="1200" fill="${white}" font-family="Arial" font-size="25" font-weight="900">Separate the builder from the judge.</text>${foot(true)}`),

  frame(`${defs(false)}${bg(false,"grid")}${mast(3,false,"CRITIC ONE — THE BRIEF")}
    <text x="50" y="222" fill="${blue}" font-family="Arial" font-size="106" font-weight="900">01</text>${txt("Read the brief",210,211,76,84)}${txt("back to me.",210,295,76,84)}
    ${txt("No design opinions yet. Check whether every",54,398,28,38,"#45546A",700)}${txt("requested outcome made it into the work.",54,436,28,38,"#45546A",700)}
    <g transform="translate(90 525) rotate(1.2)" filter="url(#shadow)"><rect width="900" height="630" rx="8" fill="#FFFDF8"/><rect x="300" y="-22" width="300" height="55" rx="7" fill="#D9D1C3" opacity=".9"/>
      <text x="60" y="90" fill="#728095" font-family="Arial" font-size="18" font-weight="900" letter-spacing="2">BRIEF COVERAGE CHECK</text>
      ${[["Core promise appears above the fold",true],["One clear primary action",true],["Mobile state included",false],["Every requested section exists",true]].map((d,i)=>`<g transform="translate(60 ${132+i*103})"><rect width="54" height="54" fill="none" stroke="${d[1]?blue:orange}" stroke-width="4"/>${d[1]?`<path d="M10 28 l12 12 25-30" fill="none" stroke="${blue}" stroke-width="7" stroke-linecap="round"/>`:`<path d="M9 9 l36 36 M45 9 L9 45" fill="none" stroke="${orange}" stroke-width="7" stroke-linecap="round"/>`}<text x="83" y="39" fill="${navy}" font-family="Arial" font-size="28" font-weight="800">${d[0]}</text><text x="775" y="39" text-anchor="end" fill="${d[1]?blue:orange}" font-family="Arial" font-size="18" font-weight="900">${d[1]?"PASS":"MISSING"}</text></g>`).join("")}
      <path d="M390 330 C610 290 825 315 808 395 C785 474 555 475 390 430" fill="none" stroke="${orange}" stroke-width="10" stroke-linecap="round" opacity=".9"/>
      <text x="61" y="578" fill="${orange}" font-family="Arial" font-size="24" font-weight="900">RETURN THE GAPS — NOT A NEW DRAFT.</text>
    </g>${foot(false)}`),

  frame(`${defs(true)}${bg(true,"grid")}${mast(4,true,"CRITIC TWO — THE SYSTEM")}
    <text x="50" y="220" fill="${orange}" font-family="Arial" font-size="106" font-weight="900">02</text>${txt("Guard the system.",210,211,76,84,white)}
    ${txt("The model’s taste does not outrank the brand.",54,330,29,40,grey,700)}
    <g transform="translate(50 430)"><text x="0" y="35" fill="${cyan}" font-family="Arial" font-size="19" font-weight="900" letter-spacing="2">COLOUR</text>
      <rect x="0" y="65" width="980" height="180" rx="24" fill="#0E1E31"/>
      ${[[55,navy,"INK"],[205,blue,"ACTION"],[355,orange,"ALERT"],[505,paper,"PAPER"]].map(d=>`<g><circle cx="${d[0]}" cy="135" r="42" fill="${d[1]}" stroke="#7E90A5" stroke-width="${d[1]===navy?2:0}"/><text x="${d[0]}" y="210" text-anchor="middle" fill="${grey}" font-family="Arial" font-size="15" font-weight="900">${d[2]}</text></g>`).join("")}
      <path d="M680 155 H925" stroke="#314D6B" stroke-width="16" stroke-linecap="round"/><path d="M680 155 H820" stroke="${orange}" stroke-width="16" stroke-linecap="round"/><text x="680" y="115" fill="${white}" font-family="Arial" font-size="24" font-weight="900">CONTRAST  4.8:1</text>
      <text x="0" y="315" fill="${cyan}" font-family="Arial" font-size="19" font-weight="900" letter-spacing="2">TYPE + SPACING</text>
      <rect x="0" y="345" width="980" height="385" rx="24" fill="#0E1E31"/>
      ${txt("Aa",45,465,112,118,white)}${txt("HEADLINE / 88",200,425,28,36,white)}${txt("BODY / 28",200,478,28,36,grey)}
      <line x1="530" y1="402" x2="530" y2="675" stroke="#29425F" stroke-width="2"/>
      ${[0,1,2,3,4].map(i=>`<rect x="595" y="${405+i*58}" width="${95+i*54}" height="14" rx="7" fill="${i===4?orange:blue}" opacity="${.45+i*.13}"/>`).join("")}
      <text x="595" y="655" fill="${grey}" font-family="Arial" font-size="18" font-weight="900">8PX BASE GRID</text>
    </g>
    <rect x="50" y="1192" width="980" height="62" fill="${orange}"/><text x="76" y="1233" fill="#fff" font-family="Arial" font-size="22" font-weight="900">FLAG EVERY TOKEN VIOLATION. NAME THE CORRECTION.</text>${foot(true,"NEXT →")}`),

  frame(`${defs(false)}${bg(false,"dots")}${mast(5,false,"CRITIC THREE — THE RENDER")}
    <text x="50" y="220" fill="${orange}" font-family="Arial" font-size="106" font-weight="900">03</text>${txt("Look at the picture.",210,211,72,80)}
    ${txt("Not the code. Not the component tree. The pixels.",54,328,29,40,"#45546A",700)}
    <g transform="translate(50 430)"><rect width="980" height="665" rx="30" fill="${navy}" filter="url(#shadow)"/>
      <text x="38" y="62" fill="${cyan}" font-family="Arial" font-size="18" font-weight="900" letter-spacing="2">VISUAL QA / 1440PX RENDER</text>
      <rect x="38" y="95" width="560" height="500" rx="20" fill="#10233A"/>
      <rect x="72" y="130" width="490" height="86" rx="12" fill="${blue}"/><rect x="72" y="248" width="315" height="28" rx="7" fill="#6B7C92"/><rect x="72" y="296" width="440" height="28" rx="7" fill="#334A64"/>
      <rect x="72" y="370" width="218" height="175" rx="18" fill="#172F4A"/><rect x="315" y="370" width="247" height="175" rx="18" fill="#172F4A"/><rect x="342" y="492" width="220" height="53" rx="14" fill="${orange}"/>
      <circle cx="515" cy="268" r="77" fill="none" stroke="${orange}" stroke-width="9"/><line x1="568" y1="324" x2="645" y2="401" stroke="${orange}" stroke-width="15" stroke-linecap="round"/>
      ${[["HIERARCHY","PASS",cyan],["CONTRAST","FAIL",orange],["WRAPPING","FAIL",orange],["COLLISIONS","PASS",cyan]].map((d,i)=>`<g transform="translate(665 ${120+i*112})"><text x="0" y="28" fill="${white}" font-family="Arial" font-size="24" font-weight="900">${d[0]}</text><text x="270" y="28" text-anchor="end" fill="${d[2]}" font-family="Arial" font-size="17" font-weight="900">${d[1]}</text><line x1="0" y1="54" x2="270" y2="54" stroke="#29425F" stroke-width="10" stroke-linecap="round"/><line x1="0" y1="54" x2="${d[1]==="PASS"?235:115}" y2="54" stroke="${d[2]}" stroke-width="10" stroke-linecap="round"/></g>`).join("")}
    </g>
    <text x="50" y="1180" fill="${orange}" font-family="Arial" font-size="22" font-weight="900">THE RENDER TELLS THE TRUTH THE CODE HIDES.</text>${foot(false)}`),

  frame(`${defs(false)}${bg(false,"grid")}${mast(6,false,"WHY FRESH CONTEXT MATTERS")}
    ${txt("Fresh window.",50,225,88,94)}${txt("No excuses.",50,319,88,94,orange)}
    ${txt("Each critic sees only the brief, the rules and the output.",54,416,28,40,"#45546A",700)}
    <g transform="translate(55 535)">
      ${[[0,"01","BRIEF","Did we build every\nthing requested?"],[315,"02","SYSTEM","Did we follow every\nbrand rule?"],[630,"03","RENDER","Does the final image\nactually work?"]].map((d,i)=>`<g transform="translate(${d[0]} ${i%2?26:0}) rotate(${i===0?-2:i===2?2:0})" filter="url(#shadow)"><rect width="290" height="470" rx="8" fill="#FFFDF8"/><rect width="290" height="76" fill="${i===1?orange:navy}"/><text x="26" y="51" fill="#fff" font-family="Arial" font-size="28" font-weight="900">${d[1]}</text><text x="26" y="135" fill="${i===1?orange:blue}" font-family="Arial" font-size="18" font-weight="900" letter-spacing="2">${d[2]}</text>${txt(d[3],26,205,26,38,navy,800)}<line x1="26" y1="330" x2="264" y2="330" stroke="#D8D1C5" stroke-width="2"/><text x="26" y="382" fill="#69778A" font-family="Arial" font-size="17" font-weight="900">CLEAN CONTEXT</text><text x="26" y="420" fill="${orange}" font-family="Arial" font-size="17" font-weight="900">NO BUILD TRANSCRIPT</text></g>`).join("")}
    </g>
    <path d="M110 1078 C345 1145 705 1145 960 1078" fill="none" stroke="${blue}" stroke-width="7" stroke-dasharray="14 15"/><text x="535" y="1175" fill="${navy}" font-family="Arial" font-size="25" font-weight="900" text-anchor="middle">THREE REVIEWS. THREE INDEPENDENT JUDGMENTS.</text>${foot(false)}`),

  frame(`${defs(true)}${bg(true,"grid")}${mast(7,true,"THE OPERATING LOOP")}
    ${txt("Build → score →",50,225,82,90,white)}${txt("patch → repeat.",50,315,82,90,orange)}
    ${txt("Set the pass rule before you start.",54,408,28,40,grey,700)}
    <g transform="translate(50 505)"><rect width="980" height="610" rx="30" fill="#0D1D30" stroke="#28425F" stroke-width="2"/>
      ${[[155,160,"BUILD",blue],[490,160,"REVIEW",white],[825,160,"PATCH",orange],[490,445,"PASS?",cyan]].map(d=>`<g><circle cx="${d[0]}" cy="${d[1]}" r="94" fill="#10253E" stroke="${d[3]}" stroke-width="6"/><text x="${d[0]}" y="${d[1]+9}" fill="${white}" font-family="Arial" font-size="27" font-weight="900" text-anchor="middle">${d[2]}</text></g>`).join("")}
      <path d="M254 160H386 M594 160H721 M825 260 C825 445 690 445 590 445 M390 445 C260 445 155 350 155 260" fill="none" stroke="#5B7695" stroke-width="9" stroke-linecap="round"/>
      <path d="M365 138 l28 22 -28 22 M700 138 l28 22 -28 22 M618 422 l-28 23 28 22 M133 282 l22-28 22 28" fill="none" stroke="#8DA2B9" stroke-width="9" stroke-linecap="round"/>
      <rect x="620" y="397" width="194" height="50" rx="25" fill="#124837"/><text x="717" y="429" text-anchor="middle" fill="#7FF1BD" font-family="Arial" font-size="17" font-weight="900">YES → SHIP</text>
    </g>
    <rect x="50" y="1160" width="980" height="92" rx="16" fill="${orange}"/><text x="78" y="1200" fill="#fff" font-family="Arial" font-size="18" font-weight="900" letter-spacing="1.5">MY STOP RULE</text><text x="78" y="1230" fill="#fff" font-family="Arial" font-size="22" font-weight="900">All critical checks pass — or max 3 rounds.</text>${foot(true)}`),

  frame(`${defs(false)}${bg(false,"dots")}${mast(8,false,"THE TAKEAWAY")}
    ${txt("Don’t ship the",50,225,84,91)}${txt("first draft",50,316,92,98,orange)}${txt("your AI praises.",50,414,84,91)}
    <g transform="translate(50 520)"><circle cx="260" cy="275" r="220" fill="${blue}"/><image href="data:image/jpeg;base64,${avatar}" x="55" y="70" width="410" height="410" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarCircle)"/>
      <circle cx="260" cy="275" r="220" fill="none" stroke="${navy}" stroke-width="12"/>
      <g transform="translate(510 40)"><text x="0" y="35" fill="${blue}" font-family="Arial" font-size="18" font-weight="900" letter-spacing="2">MY 3 CHECKS</text>
        ${[["01","BRIEF"],["02","SYSTEM"],["03","RENDER"]].map((d,i)=>`<g transform="translate(0 ${85+i*105})"><text x="0" y="40" fill="${orange}" font-family="Arial" font-size="44" font-weight="900">${d[0]}</text><text x="86" y="38" fill="${navy}" font-family="Arial" font-size="31" font-weight="900">${d[1]}</text><line x1="86" y1="58" x2="410" y2="58" stroke="#CFC8BC" stroke-width="3"/></g>`).join("")}
      </g>
    </g>
    <rect x="50" y="1050" width="980" height="155" rx="26" fill="${navy}"/><text x="82" y="1104" fill="${cyan}" font-family="Arial" font-size="18" font-weight="900" letter-spacing="2">SAVE THIS BEFORE YOUR NEXT BUILD</text><text x="82" y="1162" fill="${white}" font-family="Arial" font-size="31" font-weight="900">Which critic would catch your biggest mistake?</text>
    ${foot(false,"FOLLOW @YAR.CLAUDECODEX.MASTERY")}`)
];

await Promise.all(slides.map(async (contents, i) => {
  const stem = `slide-${String(i + 1).padStart(2, "0")}`;
  fs.writeFileSync(path.join(outDir, `${stem}.svg`), contents);
  await sharp(Buffer.from(contents)).png({ compressionLevel: 9 }).toFile(path.join(outDir, `${stem}.png`));
}));

const thumbs = await Promise.all(slides.map(s => sharp(Buffer.from(s)).resize(432,540).png().toBuffer()));
await sharp({create:{width:1728,height:1080,channels:4,background:"#B8C0CB"}}).composite(thumbs.map((input,i)=>({input,left:(i%4)*432,top:Math.floor(i/4)*540}))).png().toFile(path.join(outDir,"carousel-preview.png"));

const caption = `I stopped letting Claude approve the work it just made.\n\nThe same context that creates an output also remembers every shortcut, assumption and compromise behind it. So of course it says “looks good.”\n\nMy fix is a three-critic loop:\n\n1. BRIEF CRITIC — checks every requested outcome.\n2. SYSTEM CRITIC — checks colour, type, spacing and component rules.\n3. RENDER CRITIC — checks the actual pixels for hierarchy, contrast, wrapping and collisions.\n\nEach critic gets a fresh window with only the brief, the rules and the output. Then I patch the failed checks and run it again.\n\nIt costs more tokens, so I save it for work where quality compounds: templates, landing pages, design systems and client deliverables.\n\nSave this before your next build. Which critic would catch your biggest mistake?\n\n#ClaudeCode #OpenAICodex #AIAgents #AIAutomation #PromptEngineering #VibeCoding #WebDesign #BuildInPublic`;
fs.writeFileSync(path.join(outDir,"caption.txt"), caption);
console.log(`Created ${slides.length} personalized carousel slides in ${outDir}`);
