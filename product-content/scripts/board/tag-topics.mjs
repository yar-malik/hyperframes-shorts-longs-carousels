/**
 * Two one-off jobs on the topics, done together because both rewrite the
 * same rows.
 *
 *   node scripts/board/tag-topics.mjs            # say what it would change
 *   node scripts/board/tag-topics.mjs --write    # change it
 *
 * 1. The carousel column became two, Instagram and LinkedIn. Every carousel
 *    on the board until now was an Instagram one — that is what the Published
 *    record says every single time — so `made.carousel` becomes `made.ig`.
 *    The page reads the old key as the Instagram one anyway, so nothing is
 *    broken without this; it is here so the stored row says one thing rather
 *    than two.
 *
 * 2. Every topic gets AVC or CCM where it can be worked out. The tag decides
 *    which room a topic is for, and a page of untagged rows is a filter
 *    nobody can use.
 *
 * How a topic is tagged, in order, first match wins:
 *
 *   - the account it was published from, which is the only hard evidence:
 *     AI Video Club is AVC, Claude Code & Codex Mastery is CCM.
 *   - the words in the title and note. AI video tools on one side, Claude
 *     and the coding tools on the other.
 *   - nothing, which stays untagged rather than guessed. An untagged row is
 *     honest; a wrongly tagged one is invisible to the person who owns it.
 *
 * Supabase is reachable only from voho-vm, so this runs there.
 */
import { readFileSync } from "node:fs";

for (const f of [".env.production.local", ".env.local", ".env"]) {
  try {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
const U = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !KEY) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."); process.exit(1); }
const WRITE = process.argv.includes("--write");
const H = { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" };

/* The accounts, which are not a guess. */
const ACCOUNT = [
  [/ai video club/i, "avc"],
  [/claude code & codex mastery|claude codex mastery|claudecodex/i, "ccm"],
];
/* The words. AVC is the AI video room: the tools that make video, and the
   people who sell that. CCM is the coding room. Deliberately narrow — a word
   that appears in both rooms is not in either list. */
const AVC_WORDS = /\b(seedance|dreamina|sora|higgsfield|veo|runway|kling|midjourney|ai video|ai videos|short film|cinematic|b-?roll|thumbnail|reel|footage|film|painting|photo editing|image to video|text to video|faceless)\b/i;
const CCM_WORDS = /\b(claude|codex|anthropic|mcp|github|repo|skill|subagent|agent|cli|terminal|token|prompt engineering|vs ?code|cursor|deepseek|kimi|opus|sonnet|plugin|commit|api|coding|developer|dev team|spreadsheet|stripe)\b/i;

function tagOf(x) {
  const acct = String(x.source || "") + " " + String(x.note || "");
  for (const [re, who] of ACCOUNT) if (re.test(acct)) return { who, why: "the account it went out from" };
  const text = String(x.title || "") + " " + String(x.note || "");
  const avc = AVC_WORDS.test(text), ccm = CCM_WORDS.test(text);
  /* Both, or neither, is not an answer — leave it for a person. */
  if (avc && !ccm) return { who: "avc", why: "what it is about" };
  if (ccm && !avc) return { who: "ccm", why: "what it is about" };
  return { who: "", why: avc && ccm ? "reads as both" : "nothing to go on" };
}

const board = await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.default&select=rev,state`, { headers: H })).json();
if (!board || !board[0]) { console.error("no board document"); process.exit(1); }
const rev = board[0].rev;
const state = board[0].state || {};
const ideas = Array.isArray(state.ideas) ? state.ideas : [];

let moved = 0, tagged = 0, left = 0;
const notes = [];
for (const x of ideas) {
  if (String(x.section || "") !== "topic") continue;
  if (x.made && typeof x.made === "object" && x.made.carousel && !x.made.ig) {
    x.made.ig = x.made.carousel;
    delete x.made.carousel;
    moved++;
  } else if (x.made && typeof x.made === "object" && x.made.carousel) {
    delete x.made.carousel;
  }
  if (!x.community) {
    const t = tagOf(x);
    if (t.who) { x.community = t.who; tagged++; notes.push(`  ${t.who.toUpperCase()}  ${String(x.title).slice(0, 58)}   (${t.why})`); }
    else { left++; notes.push(`  --   ${String(x.title).slice(0, 58)}   (${t.why})`); }
  }
}
notes.forEach((l) => console.log(l));
const topics = ideas.filter((x) => String(x.section || "") === "topic");
console.log(`\n${topics.length} topics · ${moved} carousels moved to the Instagram column · ${tagged} tagged · ${left} left for a person`);
console.log(`AVC ${topics.filter((x) => x.community === "avc").length} · CCM ${topics.filter((x) => x.community === "ccm").length} · untagged ${topics.filter((x) => !x.community).length}`);
if (!moved && !tagged) { console.log("Nothing to change."); process.exit(0); }
if (!WRITE) { console.log("\nDry run. Nothing written. Add --write."); process.exit(0); }

const now = new Date().toISOString();
state.ideas = ideas;
state.rev = rev + 1;
state.savedBy = "topic tags";
state.savedAt = now;
const res = await fetch(`${U}/rest/v1/content_automation_board?id=eq.default&rev=eq.${rev}`, {
  method: "PATCH",
  headers: { ...H, prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state, saved_by: "topic tags", saved_at: now }),
});
if (!res.ok) { console.error(`write failed: ${res.status} ${await res.text()}`); process.exit(1); }
const back = await res.json();
if (!back.length) { console.error("somebody saved the board while this ran — run it again"); process.exit(1); }
console.log(`\nDone. Board now at rev ${back[0].rev}.`);
