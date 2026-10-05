/**
 * What a script needs to read and write the board, now that it is two things.
 *
 * The videos are one row each in `content_automation_videos`; everything else
 * — people, ideas, competitors, sheets, time logs — is still the one
 * `content_automation_board` document. A script that reads `state.videos`
 * straight off the document now reads an empty array, which is how a guard
 * ("does this person still own any videos?") quietly stops guarding. So there
 * is one place that knows the shape, and scripts use it.
 *
 *   import { env, readBoard, putVideos, writeDoc } from "./lib/board.mjs";
 *   const b = await readBoard();          // b.videos is every video
 *   await putVideos([oneChangedVideo]);   // writes those rows, nothing else
 *   await writeDoc(b.rev, b.state);       // the document, compare-and-set
 */
import { readFileSync } from "node:fs";

let U = "";
let H = null;

/** Reads .env.local the way every script here already does. */
export function env() {
  if (H) return { U, H };
  for (const f of [".env.local", ".env.production.local"]) {
    try { for (const l of readFileSync(f, "utf8").split("\n")) {
      const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    } } catch {}
  }
  U = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!U || !K) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed");
  H = { apikey: K, Authorization: `Bearer ${K}`, "content-type": "application/json" };
  return { U, H };
}

async function get(path) {
  const { U, H } = env();
  const r = await fetch(`${U}/rest/v1/${path}`, { headers: H });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

/**
 * The whole board: the document, plus every video in board order.
 *
 * `state` is the document as stored (its `videos` is the empty array it now
 * keeps); `videos` is the real list. A video still sitting in the document —
 * left by a script written before the split — is included, once, and the
 * table's copy wins for an id that is in both.
 */
export async function readBoard() {
  const [rows, vids] = await Promise.all([
    get("content_automation_board?id=eq.default&select=rev,state,saved_by,saved_at"),
    get("content_automation_videos?select=id,ord,rev,doc&order=ord.asc,id.asc"),
  ]);
  const row = rows[0];
  if (!row) throw new Error("no board row");
  const videos = vids.map((r) => ({ ...r.doc, id: r.id }));
  const held = new Set(videos.map((v) => v.id));
  const strays = (row.state.videos || []).filter((v) => v && v.id && !held.has(v.id));
  if (strays.length) console.warn(`  ! ${strays.length} video(s) still in the board document`);
  return {
    rev: row.rev,
    state: row.state,
    savedBy: row.saved_by,
    savedAt: row.saved_at,
    videos: videos.concat(strays),
    revs: new Map(vids.map((r) => [r.id, r.rev])),
    ord: new Map(vids.map((r) => [r.id, r.ord])),
  };
}

/**
 * Write these videos, and only these.
 *
 * `ord` decides board order; left out, an existing row keeps the place it
 * has and a new one goes to the end. Upserts, so running a script twice
 * writes the same thing twice rather than failing the second time.
 */
export async function putVideos(videos, opts = {}) {
  if (!videos.length) return 0;
  const { U, H } = env();
  const by = opts.by || "script";
  const end = opts.appendFrom ?? null;
  const rows = videos.map((v, i) => ({
    id: v.id,
    doc: v,
    ...(v.__ord != null ? { ord: v.__ord } : end != null ? { ord: end + i } : {}),
    updated_by: by,
    updated_at: new Date().toISOString(),
  }));
  for (const r of rows) delete r.doc.__ord;
  const res = await fetch(`${U}/rest/v1/content_automation_videos`, {
    method: "POST",
    headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`video write failed: ${res.status} ${await res.text()}`);
  return rows.length;
}

/** The highest `ord` in the table, so a new video can go after it. */
export async function lastOrd() {
  const rows = await get("content_automation_videos?select=ord&order=ord.desc&limit=1");
  return rows.length ? rows[0].ord : -1;
}

/**
 * Write the document, compare-and-set on the revision it was read at.
 * Returns the new revision, or null when somebody saved first.
 */
export async function writeDoc(rev, state, by = "script") {
  const { U, H } = env();
  const next = { ...state, videos: [], rev: rev + 1 };
  const res = await fetch(`${U}/rest/v1/content_automation_board?id=eq.default&rev=eq.${rev}`, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ rev: rev + 1, state: next, saved_by: by, saved_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`board write failed: ${res.status} ${await res.text()}`);
  const back = await res.json();
  return back.length ? back[0].rev : null;
}
