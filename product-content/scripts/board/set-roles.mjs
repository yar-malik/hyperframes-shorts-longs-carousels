/**
 * Gives somebody a role, on both boards.
 *
 *   node scripts/set-roles.mjs Asif skool,video           # show what it would do
 *   node scripts/set-roles.mjs Asif skool,video --write   # do it
 *
 * The same two things the toggle on the Team page does: write the roles onto
 * every record that person has, and make a record on a board they are joining
 * — being on a team with no row there is a role that cannot be given any
 * work. Idempotent.
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
const [name, rolesArg] = process.argv.slice(2).filter((a) => a !== "--write");
if (!name || !rolesArg) { console.error("usage: set-roles.mjs <name> <video,skool> [--write]"); process.exit(1); }
const roles = rolesArg.split(",").map((r) => r.trim()).filter((r) => r === "video" || r === "skool");
if (!roles.length) { console.error("roles must be video and/or skool"); process.exit(1); }

const key = name.trim().toLowerCase();
const get = async (id) => (await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.${id}&select=rev,state`, { headers: H })).json())[0];
const sk = await get("skool");
const ca = await get("default");

const find = (state) => (state.people || []).find((p) => String(p.name).trim().toLowerCase() === key);
const before = { skool: find(sk.state), video: find(ca.state) };
console.log(`${name} — roles to set: ${roles.join(", ")}`);
console.log(`   on the Skool board: ${before.skool ? "yes, teams " + JSON.stringify(before.skool.teams ?? null) : "no record"}`);
console.log(`   on the video board: ${before.video ? "yes, teams " + JSON.stringify(before.video.teams ?? null) : "no record"}`);

const source = before.skool || before.video;
if (!source) { console.error(`\n! nobody called "${name}" on either board`); process.exit(1); }

/* A record on each board they are joining, so there is something to assign
   work to and something to pay. */
if (roles.includes("skool") && !before.skool) {
  (sk.state.people = sk.state.people || []).push({
    id: "p_" + key.replace(/[^a-z0-9]+/g, ""), name: source.name,
    email: source.email || "", whatsapp: source.whatsapp || "", rate: "", hours: "", teams: roles,
  });
  console.log("   -> making a record on the Skool board");
}
if (roles.includes("video") && !before.video) {
  (ca.state.people = ca.state.people || []).push({
    id: "p_" + key.replace(/[^a-z0-9]+/g, ""), name: source.name,
    email: source.email || "", whatsapp: source.whatsapp || "", teams: roles,
  });
  console.log("   -> making a record on the video board");
}
for (const st of [sk.state, ca.state]) {
  const p = find(st);
  if (p) p.teams = roles.slice();
}
console.log(`\nafter: skool ${JSON.stringify(find(sk.state)?.teams ?? null)} | video ${JSON.stringify(find(ca.state)?.teams ?? null)}`);
console.log(`people: skool ${(sk.state.people || []).length}, video ${(ca.state.people || []).length}`);
/* The videos are a table of their own and this script does not go near it;
   counted from there so the line means something. */
const vidCount = (await (await fetch(`${U}/rest/v1/content_automation_videos?select=id`, { headers: H })).json()).length;
console.log(`untouched: ${(sk.state.log || []).length} log rows, ${vidCount} videos`);

if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }
const now = new Date().toISOString();
for (const [id, row] of [["skool", sk], ["default", ca]]) {
  const next = { ...row.state, rev: row.rev + 1, savedBy: "roles", savedAt: now };
  const r = await fetch(`${U}/rest/v1/content_automation_board?id=eq.${id}`, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ rev: row.rev + 1, state: next, saved_by: "roles", saved_at: now }),
  });
  if (!r.ok || !(await r.json()).length) { console.error(`write failed for ${id}:`, r.status); process.exit(1); }
  console.log(`${id} -> rev ${row.rev + 1}`);
}
console.log("\ndone.");
