/**
 * File every competitor on the board under the community it competes with.
 *
 *   node scripts/tag-competitors.mjs          # preview
 *   node scripts/tag-competitors.mjs --write  # save
 *
 *   ccm = Claude Codex Mastery  (Claude Code, Codex, agents, automation, vibe coding)
 *   avc = AI Video Club         (AI ads, AI video, AI films, creative AI)
 *
 * Keyed by row id, so it can be re-run: a row that already carries the tag
 * listed here is left alone, and a row somebody re-filed by hand on the page
 * is reported but not overwritten unless --force is given. Rows not named
 * here are listed at the end so nothing is silently left unfiled.
 */
import { readFileSync } from "node:fs";

for (const file of [".env.local", ".env.production.local", ".env"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {}
}

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!url || !key) {
  console.error("Supabase is not configured.");
  process.exit(1);
}
const headers = { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json" };
const write = process.argv.includes("--write");
const force = process.argv.includes("--force");

/* Why each one is where it is, in a word, so the next person to disagree
   can see what was being weighed. */
const TAGS = {
  /* Our own three. */
  "skool-own-ai-university": ["ccm", "Claude Codex Zero — free CCM funnel"],
  "skool-own-claude-codex-mastery": ["ccm", "Claude Codex Mastery"],
  "skool-own-aivideo-club": ["avc", "AI Video Club"],

  /* YouTube. */
  c_seed_0: ["ccm", "Nick Saraev — AI automation"],
  c_seed_1: ["ccm", "Jack Roberts — Claude Code / automation"],
  c_seed_2: ["ccm", "Nate Herk — AI automation agency"],
  c_seed_3: ["ccm", "Chase AI — Claude/Codex agency"],
  c_seed_4: ["ccm", "The AI Advantage — AI tools news"],
  c_seed_5: ["ccm", "Riley Brown — vibe coding"],
  c_seed_6: ["ccm", "Duncan Rogoff — Claude Code Club"],
  c_seed_7: ["ccm", "Mehul Mohan — developer"],
  c_seed_8: ["ccm", "AI Automation Station"],
  c_seed_9: ["ccm", "Matt Wolfe — AI tools"],
  c_seed_10: ["ccm", "Alex Finn — vibe coding"],
  c_mtqswfe1: ["ccm", "WorldofAI — AI tools / coding"],
  c_req_20260907_aicodeking: ["ccm", "AI Code King — coding with AI"],
  c_mtvgetlf: ["ccm", "Corey Ganim — AI services"],

  /* LinkedIn / X. */
  c_seed_11: ["ccm", "Matt Wolfe"],
  c_seed_12: ["ccm", "Matt Wolfe"],
  c_seed_13: ["ccm", "Matt Wolfe"],
  c_seed_14: ["ccm", "Riley Brown"],
  c_seed_15: ["ccm", "Nate Herk"],
  c_seed_16: ["ccm", "Nate Herk"],
  c_seed_17: ["ccm", "Nick Saraev"],
  c_seed_18: ["ccm", "Nick Saraev"],
  c_seed_19: ["ccm", "Alex Finn"],
  c_seed_20: ["ccm", "Alex Finn"],
  c_req_20260907_stasbel_want_to_build_ai_agents_in_2026_start_here_share_7502678288838860800_ndmk: ["ccm", "Stas Bel — AI agents"],
  c_req_20260907_leadgenmanthan: ["ccm", "Lead Gen Manthan — lead-gen automation"],
  "cmp-adswithcami": ["avc", "Camilo Castañeda — AI ads"],
  c_mtva0t1m: ["ccm", "Levelsio — indie hacking / vibe coding"],
  c_mtva0tjk: ["ccm", "Marc Lou — indie hacking / shipping"],
  c_mtvgex7n: ["ccm", "Corey Ganim"],
  c_mtvgf0po: ["ccm", "Corey Ganim"],

  /* Instagram. */
  c_mtpiogbh: ["ccm", "Soft Girl No Code — no-code building"],
  c_req_20260907_noevarner_ai: ["ccm", "Noe Varner — AI systems for coaches/agencies"],
  c_req_20260907_mr_paidsocial: ["avc", "Mr. Paid Social — ads, AI, automation ($150M ad spend)"],
  c_req_20260907_albert_olgaard: ["ccm", "Albert Olgaard — AI agents for businesses"],
  c_req_20260907_wassimyounes_: ["ccm", "Wassim Younes — Claude Code packs"],
  c_req_20260907_nikitaxsapunov: ["avc", "Nikita Sapunov — Meta/Instagram ads agency"],
  c_req_20260907_chase_h_ai: ["ccm", "Chase H AI"],
  c_req_20260907_leadgenman: ["ccm", "Lead Gen Man"],
  c_req_20260907_tysn_dev: ["ccm", "Tysn.dev — developer"],
  c_req_20260907_chrispathway: ["ccm", "Chris Pathway — coding / AI / ML"],
  c_req_20260907_duncanrogoff: ["ccm", "Duncan Rogoff"],
  c_req_20260907_julian_goldie_: ["ccm", "Julian Goldie — AI profit / automation"],
  c_req_20260907_mavgpt: ["ccm", "MavGPT — ChatGPT/Claude prompts"],
  c_mtvgf48h: ["ccm", "Corey Ganim"],

  /* Skool. */
  c_skool_nick_saraev: ["ccm", "Maker School — AI automation"],
  c_skool_nate_herk: ["ccm", "AI Automation Society Plus"],
  c_skool_jack_roberts: ["ccm", "AI Automations by Jack"],
  c_skool_daniel_riley: ["avc", "AI Video Bootcamp — AI UGC, influencers, brand ads"],
  c_skool_julian_goldie: ["ccm", "AI Profit Boardroom — automation"],
  c_skool_camilo_casta_eda: ["avc", "Ad Creators Lab — AI ad creative"],
  c_skool_jay_e: ["ccm", "RoboNuggets — agentic AI"],
  c_skool_chase_hannegan: ["ccm", "Chase AI+ — Claude/Codex"],
  c_skool_rourke_sefton_minns: ["avc", "GenHQ — creative AI education, ads, storytelling"],
  c_skool_alex_finn: ["ccm", "Vibe Coding Academy"],
  c_skool_mark_kashef: ["ccm", "Early AI-dopters — Claude Code, n8n"],
  c_skool_mike_futia: ["avc", "SCALE — AI ad creative for DTC & agencies"],
  c_skool_simon_scrapes: ["ccm", "Agentic Academy — Claude Code systems"],
  c_skool_duncan_rogoff: ["ccm", "Claude Code Club"],
  c_skool_noe_varner: ["ccm", "NoeAI Automator"],
  c_skool_corey_ganim: ["ccm", "AI Operator Academy"],
  c_skool_samin_yasar: ["ccm", "Claude Club"],
  c_skool_jason_cooperson: ["ccm", "AI Leverage Lab — AI content systems, automation"],
};

const endpoint = `${url}/rest/v1/content_automation_board?id=eq.default&select=rev,state`;
const response = await fetch(endpoint, { headers });
if (!response.ok) {
  console.error(`Read failed: ${response.status}`);
  process.exit(1);
}
const rows = await response.json();
const current = rows[0]?.state;
const rev = rows[0]?.rev ?? 0;
if (!current) {
  console.error("No content automation board found.");
  process.exit(1);
}

const competitors = JSON.parse(JSON.stringify(current.competitors ?? []));
let changed = 0, kept = 0, disagreed = 0;
const unfiled = [];
for (const c of competitors) {
  const want = TAGS[c.id];
  if (!want) {
    if (c.n || c.u) unfiled.push(c);
    continue;
  }
  const [tag, why] = want;
  if (c.tag === tag) { kept++; continue; }
  if (c.tag && c.tag !== tag && !force) {
    disagreed++;
    console.log(`  keep  ${String(c.tag).toUpperCase()}  ${c.n} — filed by hand, wanted ${tag.toUpperCase()} (${why}); --force to override`);
    continue;
  }
  c.tag = tag;
  changed++;
  console.log(`  ${tag.toUpperCase()}  ${c.n || c.u} — ${why}`);
}

console.log(`\nBoard revision ${rev}`);
console.log(`${competitors.length} competitors: ${changed} to tag, ${kept} already right, ${disagreed} filed differently by hand.`);
if (unfiled.length) {
  console.log(`\nNot in this script, still unfiled:`);
  for (const c of unfiled) console.log(`  - ${c.id}  ${c.n}  ${c.u}`);
}

if (!write) {
  console.log("\nPreview only. Add --write to save.");
  process.exit(0);
}
if (!changed) {
  console.log("\nNothing to save.");
  process.exit(0);
}

const savedAt = new Date().toISOString();
const next = { ...current, competitors, rev: rev + 1, savedBy: "Yar", savedAt };
const save = await fetch(`${url}/rest/v1/content_automation_board?id=eq.default&rev=eq.${rev}`, {
  method: "PATCH",
  headers: { ...headers, Prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state: next, saved_by: "Yar", saved_at: savedAt }),
});
const savedRows = save.ok ? await save.json() : [];
if (!save.ok || !savedRows.length) {
  console.error(`Save failed${save.ok ? " because the board changed; run again" : `: ${save.status}`}.`);
  process.exit(1);
}
console.log(`\nSaved. Board is now revision ${rev + 1}.`);
