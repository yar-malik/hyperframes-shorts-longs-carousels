/**
 * Holds every draft in docs/playbook/drafts against the house style in the product skills (.claude/skills/*-content).
 *
 *   node docs/playbook/check.mjs
 *
 * Two things are checked, and only one of them is taste.
 *
 * The first is mechanical and non-negotiable: a carousel is parsed by the
 * board before anybody reads it, so a stray asterisk or a `SLIDE 1 — hook`
 * that does not match `/^SLIDE\s*\d+\s*$/im` renders wrong and nothing warns
 * you. The parser is lifted out of app.js at run time rather than copied,
 * so this file cannot drift away from what the board actually does.
 *
 * The second is the measured house style — hashtag and emoji counts, opening
 * line length, post length — taken from the vault as it stood on 10 Sep 2026:
 * 0 hashtags in 71 posts, 6 emoji, LinkedIn median 553 chars, X median 167.
 * These are warnings, not errors. A rule counted from nine posts is a strong
 * hint, not a law, and a good post that breaks one on purpose is still good.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, "..", "..", "public", "content-automation", "app.js");
const DRAFTS = path.join(HERE, "drafts");

/* The board's own splitter, taken from the source at run time. */
const src = fs.readFileSync(APP, "utf8");
const lifted = src.match(/function slidesOf\(body\) \{[\s\S]*?\n {2}\}/);
if (!lifted) {
  console.error("! could not find slidesOf() in app.js — the parser moved; fix this before trusting the result");
  process.exit(2);
}
const slidesOf = eval("(" + lifted[0] + ")");

/* slideArt's line-claiming, in the same order it runs there. */
function claim(text) {
  let brow = "", head = "", pill = "", note = "";
  const body = [];
  String(text || "").split("\n").forEach((raw) => {
    const l = raw.trim();
    if (!l) return;
    if (!brow && l.charAt(0) === "^") { brow = l.slice(1).trim(); return; }
    if (!head) { head = l; return; }
    if (!pill && /^\[.+\]$/.test(l)) { pill = l.slice(1, -1); return; }
    if (!note && /^\(.+\)$/.test(l)) { note = l.slice(1, -1); return; }
    body.push(l);
  });
  return { brow, head, pill, note, body };
}

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}]/u;
let errors = 0, warnings = 0;
const err = (m) => { console.log("   ✗ " + m); errors++; };
const warn = (m) => { console.log("   ⚠ " + m); warnings++; };

for (const file of fs.readdirSync(DRAFTS).filter((f) => f.endsWith(".md"))) {
  console.log("\n" + "=".repeat(72) + "\n" + file);
  const md = fs.readFileSync(path.join(DRAFTS, file), "utf8");
  const blocks = [...md.matchAll(/```\n([\s\S]*?)```/g)].map((m) => m[1].trim());

  for (const b of blocks) {
    const isDeck = /^SLIDE\s*1\s*$/m.test(b);
    const isPost = !isDeck && b.length > 320;
    const label = isDeck ? "carousel" : isPost ? "long post" : "short post";
    console.log(`\n  ${label} — ${b.length} chars`);

    /* Mechanical: does it parse the way it is meant to. */
    if (isDeck) {
      const declared = [...b.matchAll(/^SLIDE\s*(\d+)\s*$/gm)].length;
      /* [^\S\n] not \s: \s eats the newline, so "SLIDE 1\n^EYEBROW" looked
         like a marker with text after it and every correct deck failed. */
      const looseMarkers = [...b.matchAll(/^SLIDE[^\S\n]*\d+[^\S\n]+\S.*$/gm)].length;
      if (looseMarkers) err(`${looseMarkers} SLIDE marker(s) have text on the same line — the deck will collapse`);
      const { slides, caption } = slidesOf(b);
      if (slides.length !== declared) err(`${declared} markers but ${slides.length} slides parsed`);
      if (!caption) err("no CAPTION parsed (must be alone on its line)");
      if (slides.length < 6 || slides.length > 9) warn(`${slides.length} slides — the vault sits at 7–8`);
      slides.forEach((s, i) => {
        const p = claim(s);
        const n = i + 1;
        if (!p.head) err(`slide ${n}: no headline`);
        const stray = p.body.join("\n").match(/\*[^*\n]+\*/g);
        if (stray) err(`slide ${n}: ${stray.join(" ")} is in the body — asterisks only accent the headline`);
        const acc = (p.head.match(/\*[^*\n]+\*/g) || []).length;
        if (acc > 1) warn(`slide ${n}: ${acc} accents in one headline — pick the turn`);
        if (p.body.length > 3) warn(`slide ${n}: ${p.body.length} body lines — that is two slides`);
      });
      console.log(`   ${slides.length} slides, caption ${caption.length} chars`);
    }

    /* Measured: the house style. */
    const hash = (b.match(/(^|\s)#\w+/g) || []).length;
    if (hash) err(`${hash} hashtag(s) — 0 of 71 vault posts used one`);
    const emo = (b.match(new RegExp(EMOJI, "gu")) || []).filter((c) => !"👇🔖".includes(c));
    if (emo.length) warn(`emoji beyond 👇/🔖: ${emo.join(" ")}`);

    if (!isDeck) {
      const first = b.split("\n")[0];
      if (first.length > 90) warn(`first line ${first.length} chars — vault median is ~60`);
      if (/^(let'?s|here (are|is)|in today'?s|ever wondered|what if)/i.test(first)) {
        err(`first line announces the post instead of being it: "${first.slice(0, 50)}…"`);
      }
      if (/\b(game.?chang|revolutionary|seamless|leverage|unlock|dive in|delve)/i.test(b)) {
        err("contains a banned word (game-changer / seamless / leverage / unlock / dive in / delve)");
      }
      if (/what do you think\?\s*$/i.test(b.trim())) err("ends on 'What do you think?'");
      if (!/\d/.test(b)) warn("no number anywhere — 7 of 9 vault LinkedIn posts carry one");
      if (isPost && b.length > 1300) warn(`${b.length} chars — over the vault's longest non-numeric post`);
      if (!isPost && b.length > 300) warn(`${b.length} chars for a tweet — the vault's top five are 77–302`);
    }
  }
}

console.log("\n" + "=".repeat(72));
console.log(errors ? `${errors} error(s), ${warnings} warning(s)` : `clean — ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
