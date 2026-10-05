/**
 * Incident recovery helper for the Content Automation vault.
 *
 * The script authenticates against the public app with the same signed session
 * format as the board, takes a local snapshot before any write, and only ever
 * restores ideas with per-row `add` operations. It never replaces `ideas`.
 *
 *   node scripts/recover-vault.mjs snapshot
 *   node scripts/recover-vault.mjs audit
 *   node scripts/recover-vault.mjs restore /tmp/pre-cami.json /tmp/vault-dump.json
 */
import { createHmac } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

for (const file of [".env.local", ".env.production.local"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {}
}

const secret = process.env.CONTENT_AUTOMATION_SECRET || process.env.CA_SECRET || "";
if (!secret) throw new Error("CONTENT_AUTOMATION_SECRET is not configured");

const body = {
  email: "vault-recovery@yarmalik.com",
  name: "Yar",
  role: "admin",
  iat: Math.floor(Date.now() / 1000),
};
const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
const signature = createHmac("sha256", secret).update(payload).digest("base64url");
const cookie = `content_automation_session=${payload}.${signature}`;
const endpoint = "https://content.yarmalik.com/api/content-automation";

async function getBoard() {
  const response = await fetch(endpoint, { headers: { accept: "application/json", cookie } });
  if (!response.ok) throw new Error(`Board read failed: ${response.status}`);
  return response.json();
}

async function addIdeas(rows) {
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ ops: rows.map((row) => ({ t: "add", coll: "ideas", row })) }),
  });
  if (!response.ok) throw new Error(`Idea restore failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function deleteIdeas(ids) {
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ ops: ids.map((id) => ({ t: "del", coll: "ideas", id })) }),
  });
  if (!response.ok) throw new Error(`Duplicate cleanup failed: ${response.status} ${await response.text()}`);
  return response.json();
}

function rowKey(row) {
  const sourceUrl = String(row.sourceUrl || "").trim().replace(/\/$/, "").toLowerCase();
  const lane = `${String(row.section || "").toLowerCase()}:${String(row.platform || "").toLowerCase()}`;
  return sourceUrl ? `${lane}:url:${sourceUrl}` : `${lane}:id:${String(row.id || "").trim().toLowerCase()}`;
}

function recoveredId(row) {
  const url = String(row.sourceUrl || "");
  const last = url.match(/(?:status\/|activity:)(\d+)/)?.[1];
  if (last) return `${row.platform === "twitter" ? "tw" : "recovered"}-${last}`;
  const safe = String(row.title || "idea").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `recovered-${row.platform || "idea"}-${safe}`;
}

const INCIDENT_ADDITIONS = [
  ["twitter", "https://x.com/ZentrixHQ/status/2097579544366534955", "Zentrix — GPT-6 Astra solves three decades-old medical-student problems in one tool (348K views, 2K likes, 1.3K bookmarks)"],
  ["twitter", "https://x.com/VladAladin/status/2097773051006099552", "Vladimir Aladinskiy — used Astra on 660K DNA variants, then built an interactive body atlas in 40 minutes (28K views, 450 likes, 307 bookmarks)"],
  ["twitter", "https://x.com/DouglasYaoDY/status/2070904914050797582", "Douglas Yao — garage-built Alzheimer’s drug origin story and technical thread (1.7M views, 9.5K likes, 4.7K bookmarks)"],
  ["twitter", "https://x.com/TheBasharAlhajj/status/2070605247517536658", "Bashar Alhajj — $100M DTC brands using AI singing animation ads (37K views, 225 bookmarks)"],
  ["linkedin", "https://www.linkedin.com/feed/update/urn:li:activity:7503097897199083520/", "Nick Saraev — free $25K/month automation roadmap lead magnet (152 reactions, 508 comments)"],
  ["linkedin", "https://www.linkedin.com/feed/update/urn:li:activity:7502010220617969664/", "Nick Saraev — the ROI math behind spending $50 on one AI prompt (74 reactions, 16 comments)"],
  ["linkedin", "https://www.linkedin.com/feed/update/urn:li:activity:7503508752969637889/", "Nate Herk — 1 million subscribers milestone story from a $30 webcam (2,895 reactions, 440 comments)"],
  ["linkedin", "https://www.linkedin.com/feed/update/urn:li:activity:7503215012866347009/", "Nate Herk — GPT-6 Astra AI video-editing workflow guide (425 reactions, 62 comments, 30 reposts)"],
  ["sh-hooks", "https://www.instagram.com/rourke/reel/DXbeNZ-DN-L/", "Rourke — “full UGC ad without filming anything” result hook + comment CTA (8,223 likes, shared in AVC)"],
  ["sh-hooks", "https://www.instagram.com/kallawaymarketing/reel/DdEPZQSOsx2/", "Kallaway Marketing — “new content type crushing on social” curiosity hook; Application Content framework (6,523+ likes, active comment CTA, shared in AVC)"],
  ["skool", "https://www.skool.com/skoolers/my-5-biggest-lessons-from-getting-my-for-hitting-3k-mrr", "Ryan Musselman — five lessons from reaching $3K MRR; specific packaging and bio templates (437 likes, 252 comments)"],
  ["skool", "https://www.skool.com/skoolers/i-deleted-my-4k-free-members-and-turned-my-community-into-a-paid-group", "Judy Lee — contrarian case study on deleting 4K free members and switching to paid (302 likes, 135 comments)"],
  ["skool", "https://www.skool.com/skoolers/world-tour-round-2", "Goose Dunlavey — community mission and free 50-state world tour launch (940 likes, 341 comments)"],
].map(([platform, sourceUrl, title]) => ({
  id: recoveredId({ platform, sourceUrl, title }), section: "vault", platform,
  title, owner: "", status: "Idea", note: title, sourceUrl,
  addedAt: "2026-09-10T08:43:00.000Z",
}));

function counts(board) {
  return (board.ideas || [])
    .filter((idea) => idea.section === "vault")
    .reduce((all, idea) => {
      const key = idea.platform || "unknown";
      all[key] = (all[key] || 0) + 1;
      return all;
    }, {});
}

const mode = process.argv[2] || "audit";
const board = await getBoard();

if (mode === "snapshot") {
  const file = join(process.cwd(), "content", "vault", "recovery", `board-${new Date().toISOString().replaceAll(":", "-")}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(board, null, 2)}\n`);
  console.log(file);
  console.log(JSON.stringify({ rev: board.rev, savedAt: board.savedAt, savedBy: board.savedBy, ideas: board.ideas?.length || 0, vault: counts(board) }, null, 2));
} else if (mode === "audit") {
  console.log(JSON.stringify({ rev: board.rev, savedAt: board.savedAt, savedBy: board.savedBy, ideas: board.ideas?.length || 0, vault: counts(board), dropped: board.ideasDropped?.length || 0 }, null, 2));
} else if (mode === "restore") {
  const snapshotPath = process.argv[3];
  const dumpPath = process.argv[4];
  if (!snapshotPath || !dumpPath) throw new Error("restore needs the pre-incident snapshot and vault dump paths");

  const snapshotRaw = JSON.parse(readFileSync(snapshotPath, "utf8"));
  const snapshotBoard = snapshotRaw.state || snapshotRaw;
  const dump = JSON.parse(readFileSync(dumpPath, "utf8"));
  const skoolText = readFileSync(join(process.cwd(), "public", "content-automation", "skool-vault-seeds.js"), "utf8");
  const skoolSeeds = JSON.parse(skoolText.slice(skoolText.indexOf("["), skoolText.lastIndexOf("]") + 1));

  const desired = new Map();
  for (const row of snapshotBoard.ideas || []) desired.set(rowKey(row), row);
  for (const exported of dump.vault || []) {
    if (exported.platform !== "twitter") continue;
    const recovered = {
      ...exported,
      id: recoveredId(exported),
      section: "vault",
      owner: "",
      status: "Idea",
      addedAt: "2026-09-09T04:42:00.000Z",
    };
    const key = rowKey(recovered);
    if (desired.has(key)) continue;
    desired.set(key, recovered);
  }
  for (const row of skoolSeeds) desired.set(rowKey(row), row);
  for (const row of INCIDENT_ADDITIONS) desired.set(rowKey(row), row);

  const have = new Set((board.ideas || []).map(rowKey));
  const missing = [...desired.values()].filter((row) => !have.has(rowKey(row)));
  console.log(JSON.stringify({ current: board.ideas?.length || 0, desiredSources: desired.size, missing: missing.length }, null, 2));
  for (let at = 0; at < missing.length; at += 100) {
    const chunk = missing.slice(at, at + 100);
    await addIdeas(chunk);
    console.log(`restored ${Math.min(at + chunk.length, missing.length)} / ${missing.length}`);
  }
  const after = await getBoard();
  console.log(JSON.stringify({ rev: after.rev, ideas: after.ideas?.length || 0, vault: counts(after) }, null, 2));
} else if (mode === "cleanup") {
  const duplicateIds = [
    "recovered-li-carousels-jack-roberts-get-ridiculously-good-at-prompting-in-7-steps",
    "recovered-li-carousels-nick-saraev-why-your-loom-outreach-gets-zero-replies",
    "recovered-li-carousels-5-mcps-for-claude-that-are-actually-useful",
    "recovered-linkedin-claude-code-for-growth-marketing-four-workflows",
  ];
  const present = new Set((board.ideas || []).map((row) => row.id));
  const remove = duplicateIds.filter((id) => present.has(id));
  if (remove.length) await deleteIdeas(remove);
  const after = await getBoard();
  console.log(JSON.stringify({ removed: remove, rev: after.rev, ideas: after.ideas?.length || 0, vault: counts(after) }, null, 2));
} else {
  throw new Error(`Unknown mode: ${mode}`);
}
