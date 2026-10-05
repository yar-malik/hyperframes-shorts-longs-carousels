/**
 * Sets the two hourly rates and the commercial figures read off Skool.
 *
 *   node scripts/seed-finance.mjs             # show what it would do
 *   node scripts/seed-finance.mjs --write     # do it
 *
 * The community figures are from the Skool dashboards on 31 August 2026. They
 * are typed in because Skool gives no API for them; the board records the date
 * they were read so nobody has to guess how old they are.
 *
 * The exchange rate is a guess and is marked as one. It is the single number
 * that turns a rupee wage into a dollar cost, so it is worth correcting on the
 * Finances page before believing any total.
 */
import { readFileSync } from "node:fs";

for (const file of [".env.local", ".env.production.local"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
const U = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
const write = process.argv.includes("--write");
if (!U || !K) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "content-type": "application/json" };

const RATES = { rehman: 430, asif: 550 };

const FINANCE = {
  fx: 280,
  asOf: "2026-08-31",
  communities: [
    { code: "avc", name: "AI Video Club",       members: 108, mrr: 321, visitors30: 1072, signups30: 13, newMrr30: 36, engagement: 51, retention: 83 },
    { code: "ccm", name: "Claude Codex Mastery", members: 425, mrr: 123, visitors30: 392,  signups30: 17, newMrr30: 35, engagement: 17, retention: 86 },
  ],
  /* Skool bills per community. Everything else is left for Yar to add — a
     guessed cost is worse than a missing one, because it looks like a fact. */
  costs: [
    { label: "Skool — AI Video Club", usd: 99 },
    { label: "Skool — Claude Codex Mastery", usd: 99 },
  ],
};

const got = await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool&select=rev,state`, { headers: H })).json();
const cur = got[0]?.state;
const rev = got[0]?.rev ?? 0;
if (!cur) { console.error("no skool board yet"); process.exit(1); }

const people = (cur.people || []).map((p) => {
  const r = RATES[String(p.name).trim().toLowerCase()];
  return r == null ? p : { ...p, rate: r };
});

/* Never clobber figures somebody has since corrected on the page. */
const finance = cur.finance ? { ...FINANCE, ...cur.finance } : FINANCE;

console.log(`board rev ${rev}`);
for (const p of people) console.log(`  ${String(p.name).padEnd(8)} ${p.rate ? p.rate + " PKR/hour" : "no rate"}`);
console.log(`  fx ${finance.fx} PKR/USD (a guess — check it)`);
for (const c of finance.communities) {
  console.log(`  ${c.code.toUpperCase().padEnd(4)} ${String(c.members).padStart(4)} members  $${String(c.mrr).padStart(4)}/mo  ${c.signups30} signups/30d`);
}
const mrr = finance.communities.reduce((n, c) => n + (Number(c.mrr) || 0), 0);
const fixed = finance.costs.reduce((n, c) => n + (Number(c.usd) || 0), 0);
console.log(`  revenue $${mrr}/mo | fixed costs $${fixed}/mo`);

if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

const next = { ...cur, people, finance, rev: rev + 1, savedBy: "finance", savedAt: new Date().toISOString() };
const put = await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool`, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state: next, saved_by: "finance", saved_at: new Date().toISOString() }),
});
if (!put.ok || !(await put.json()).length) { console.error("write failed:", put.status); process.exit(1); }
console.log(`\nwritten. board is now rev ${rev + 1}.`);
