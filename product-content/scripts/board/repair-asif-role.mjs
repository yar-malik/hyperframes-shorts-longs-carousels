/**
 * Undoes a role toggle that a browser test wrote to the live boards.
 *
 *   node scripts/repair-asif-role.mjs             # show what it would do
 *   node scripts/repair-asif-role.mjs --write     # do it
 *
 * Two things to put back. Asif was given the Content Automation role on the
 * Skool board, and a second person record for him was created on the video
 * board to go with it. He does Skool work; neither should be there.
 *
 * Only touches those two things, and only if they look exactly as expected —
 * a duplicate record with no videos against it, and a teams array containing
 * "video". Anything else and it stops rather than guessing.
 *
 * SPENT, as of 18 Sep 2026. Asif is on the video board on purpose now: a
 * video needs an approval before it goes up — the Approve to publish column
 * on the long board — and he is one of the people giving them, which needs
 * him to be able to open it. Running this again would take the
 * role back off him and undo that; it is kept only as the record of what the
 * browser test wrote and how it was put back.
 */
import { readFileSync } from "node:fs";
for (const f of [".env.local", ".env.production.local"]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  } } catch {}
}
const U = process.env.SUPABASE_URL.replace(/\/+$/, "");
const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}`, "content-type": "application/json" };
const write = process.argv.includes("--write");

const get = async (id) => (await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.${id}&select=rev,state`, { headers: H })).json())[0];

const sk = await get("skool");
const ca = await get("default");
let touched = 0;

/* ---- the Skool board: Asif is on the Skool team, and only that ---- */
const asif = (sk.state.people || []).find((p) => String(p.name).trim().toLowerCase() === "asif");
if (asif && Array.isArray(asif.teams) && asif.teams.includes("video")) {
  console.log(`skool  Asif teams ${JSON.stringify(asif.teams)} -> ["skool"]`);
  asif.teams = ["skool"];
  touched++;
} else {
  console.log(`skool  Asif teams ${JSON.stringify(asif?.teams ?? null)} — nothing to undo`);
}

/* ---- the video board: the record made for him should not be there ---- */
const dupes = (ca.state.people || []).filter((p) => String(p.name).trim().toLowerCase() === "asif");
/* Videos are their own rows now. Read them from there: this count is the
   guard that stops a record being removed from under somebody's work, and a
   guard that reads an empty array is not guarding anything. */
const allVideos = await (await fetch(`${U}/rest/v1/content_automation_videos?select=doc`, { headers: H })).json();
const owns = (name) => allVideos.filter((r) => String(r.doc?.owner || "").trim().toLowerCase() === String(name).trim().toLowerCase()).length;
if (dupes.length) {
  const vids = owns("Asif");
  console.log(`video  ${dupes.length} record(s) for Asif, ${vids} video(s) claimed by him`);
  if (vids > 0) { console.error("  ! he has videos against him — stopping rather than removing a record with work on it"); process.exit(1); }
  ca.state.people = (ca.state.people || []).filter((p) => String(p.name).trim().toLowerCase() !== "asif");
  console.log(`video  removing ${dupes.map((d) => d.id).join(", ")}`);
  touched++;
} else {
  console.log("video  no Asif record — nothing to undo");
}

console.log(`\nskool  rev ${sk.rev}: ${(sk.state.log || []).length} log rows, ${(sk.state.standards || []).length} standards, ${(sk.state.people || []).length} people`);
console.log(`video  rev ${ca.rev}: ${allVideos.length} videos, ${(ca.state.people || []).length} people after this`);

if (!touched) { console.log("\nNothing to do."); process.exit(0); }
if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

const now = new Date().toISOString();
for (const [id, row] of [["skool", sk], ["default", ca]]) {
  const next = { ...row.state, rev: row.rev + 1, savedBy: "repair", savedAt: now };
  const r = await fetch(`${U}/rest/v1/content_automation_board?id=eq.${id}`, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ rev: row.rev + 1, state: next, saved_by: "repair", saved_at: now }),
  });
  if (!r.ok || !(await r.json()).length) { console.error(`write failed for ${id}:`, r.status); process.exit(1); }
  console.log(`${id} -> rev ${row.rev + 1}`);
}
console.log("\ndone.");
