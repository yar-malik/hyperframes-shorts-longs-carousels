/**
 * Is TypeSafe wired up, and what does it say?
 *
 *   node scripts/content/typesafe-check.mjs
 *   node scripts/content/typesafe-check.mjs "Your hook line here"
 *
 * Runs one real request through the SDK — not curl — so a failure here is a
 * failure of the thing the app would use. Reads TYPESAFE_API_KEY from
 * .env.local the way the board's scripts read their keys.
 */
import { readFileSync } from "node:fs";
import { TypeSafeClient, noul, score } from "@typesafe-ai/sdk";

for (const f of [".env.local", ".env", ".env.production.local"]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  } } catch {}
}
const key = String(process.env.TYPESAFE_API_KEY || "").trim();
if (!key) { console.error("TYPESAFE_API_KEY is not set (.env.local)"); process.exit(1); }

const hook = process.argv[2] ||
  "Stop. You are using Claude Code completely wrong, and it is costing you hours every single week.";

const client = new TypeSafeClient({ apiKey: key });
const { answers, usage, model } = await client.systemOne({
  state: { hook },
  questions: {
    stops_scroll: noul("Would this stop a scroll in the first two seconds?"),
    sounds_ai: noul("Does this read as AI-generated or generic?"),
    strength: score("Rate the hook", ["weak", "average", "strong", "exceptional"]),
  },
});

console.log(`model: ${model}\nhook:  ${hook}\n`);
console.log(`  stops a scroll   ${(answers.stops_scroll.noul * 100).toFixed(0)}%`);
console.log(`  sounds AI        ${(answers.sounds_ai.noul * 100).toFixed(0)}%`);
console.log(`  strength         ${answers.strength.score.toFixed(2)} / 3  ` +
  `(${answers.strength.legend[Math.round(answers.strength.score)]}, ` +
  `confidence ${(answers.strength.confidence * 100).toFixed(0)}%)`);
console.log(`\ntokens: ${usage.input_tokens} in, ${usage.output_tokens} out`);
