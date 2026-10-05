#!/usr/bin/env python3
"""Publish a short to Yar's main YouTube channel, then put the link on the board.

    python3 scripts/publish-short.py --video-id v14 \
        --file shorts-hyperframes/codex-vs-claude-reel/renders/video.mp4 \
        --title "..." --description "..."

Three steps, in order, each one checked before the next runs:

  1. upload the mp4 to Postiz
  2. create a public YouTube post on Yar Malik (@YarMalikVibe), the main channel.
     --test instead posts it unlisted on Team Yar Malik, which is only for test
     videos shared with the team (Yar, 2026-09-26). Test uploads never count as
     published.
  3. poll until it publishes, then write the youtu.be link into the board row's
     `short` field — the Shorts column on Long Videos

The board write is the point. A short that exists but is not on the board is a
short nobody on the team can find, which is the same as not having made it.
"""
import argparse, json, os, re, subprocess, sys, time, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

POSTIZ = ["npx", "-y", "postiz@2.0.16"]
YOUTUBE_MAIN = "cmpzh3t3400ixqf0y1di49yqj"   # Yar Malik (@YarMalikVibe): every real post
YOUTUBE_TEAM = "cmtooktty11pulm0yvijnj8uz"   # Team Yar Malik: test videos for the team only


def run(args, timeout=900):
    p = subprocess.run(POSTIZ + args, capture_output=True, text=True, timeout=timeout)
    return re.sub(r"\x1b\[[0-9;]*[a-zA-Z]", "", p.stdout + p.stderr)


def env_from(path):
    """Last non-empty assignment wins — the file has historically held duplicates."""
    out = {}
    if not os.path.exists(path):
        return out
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        if v.strip():
            out[k.strip()] = v.strip()
    return out


def board_set_short(video_id, url, root):
    env = env_from(os.path.join(root, ".env.local"))
    base = (env.get("SUPABASE_URL") or env.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    H = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    # A video is its own row in content_automation_videos, with its own rev.
    # Dropping the short's link onto one is a write to that row and nothing
    # else — the board document is not read, let alone rewritten.
    req = urllib.request.Request(
        f"{base}/rest/v1/content_automation_videos"
        f"?id=eq.{urllib.parse.quote(video_id)}&select=id,rev,doc", headers=H)
    rows = json.load(urllib.request.urlopen(req, timeout=30))
    if not rows:
        raise SystemExit(f"no board row with id {video_id}")
    rev, doc = rows[0]["rev"], rows[0]["doc"]
    doc["short"] = url

    body = json.dumps({"rev": rev + 1, "doc": doc, "updated_by": "shorts pipeline",
                       "updated_at": datetime.now(timezone.utc).isoformat()}).encode()
    # Compare-and-set on that row: if somebody saved this video while the
    # upload ran, nothing is written and the pipeline says so.
    r = urllib.request.Request(
        f"{base}/rest/v1/content_automation_videos"
        f"?id=eq.{urllib.parse.quote(video_id)}&rev=eq.{rev}",
        data=body, headers={**H, "Prefer": "return=representation"}, method="PATCH")
    res = json.load(urllib.request.urlopen(r, timeout=60))
    if not res:
        raise SystemExit(f"{video_id} was saved by somebody else while this ran — run it again")
    return doc.get("title", ""), res[0]["rev"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video-id", required=True, help="board row id, e.g. v14")
    ap.add_argument("--file", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--description", default="")
    ap.add_argument("--root", default=os.getcwd())
    ap.add_argument("--poll-minutes", type=int, default=12)
    ap.add_argument("--test", action="store_true",
                    help="unlisted on Team Yar Malik, for the team to look at; never a real post")
    a = ap.parse_args()
    channel, privacy, label = ((YOUTUBE_TEAM, "unlisted", "unlisted on Team Yar Malik") if a.test
                               else (YOUTUBE_MAIN, "public", "public on Yar Malik"))

    if not os.path.exists(a.file):
        raise SystemExit(f"no such file: {a.file}")
    if len(a.title) > 100:
        raise SystemExit(f"title is {len(a.title)} chars; YouTube's limit via Postiz is 100")

    print(f"1/3 uploading {os.path.getsize(a.file)//1024} KB …")
    up = run(["upload", os.path.abspath(a.file)])
    m = re.search(r'"path":\s*"([^"]+)"', up)
    if not m:
        raise SystemExit("upload failed:\n" + up[-800:])
    media = m.group(1)
    print(f"    -> {media}")

    when = (datetime.now(timezone.utc) + timedelta(minutes=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
    settings = json.dumps({"title": a.title, "type": privacy,
                           "selfDeclaredMadeForKids": "no"})
    print(f"2/3 scheduling {label} for {when} …")
    made = run(["posts:create", "-c", a.description or a.title, "-m", media,
                "-i", channel, "-s", when, "-t", "schedule",
                "--settings", settings])
    pm = re.search(r'"postId":\s*"([^"]+)"', made)
    if not pm:
        raise SystemExit("post creation failed:\n" + made[-800:])
    post_id = pm.group(1)
    print(f"    -> post {post_id}")

    print("3/3 waiting for YouTube …")
    # posts:list returns JSON. Parse it and read THIS post's releaseURL — an
    # earlier version regexed the raw text after the id and picked up the next
    # post's link, which put another reel's URL on the board.
    url = None
    for i in range(a.poll_minutes * 2):
        listing = run(["posts:list"])
        try:
            doc = json.loads(listing[listing.index("{"):])
        except Exception:
            time.sleep(30); continue
        mine = next((p for p in doc.get("posts", []) if p.get("id") == post_id), None)
        if mine:
            state = str(mine.get("state", "")).upper()
            rel = mine.get("releaseURL") or ""
            if state == "PUBLISHED" and rel:
                vid = re.search(r"(?:v=|youtu\.be/)([\w-]{6,})", rel)
                url = f"https://youtu.be/{vid.group(1)}" if vid else rel
                break
            if state == "ERROR":
                raise SystemExit(f"post {post_id} failed in Postiz (state=ERROR)")
        time.sleep(30)
    if not url:
        raise SystemExit(f"post {post_id} did not report a YouTube link in "
                         f"{a.poll_minutes} min — check Postiz")
    print(f"    -> {url}")

    title, rev = board_set_short(a.video_id, url, a.root)
    print(f"\n✅ {url}\n   on board row {a.video_id} ({title[:52]}) · rev {rev}")


if __name__ == "__main__":
    main()
