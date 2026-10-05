#!/usr/bin/env python3
"""Build one 40s vertical short from a spec, end to end.

    python3 scripts/content/build-reel.py docs/specs/v06.json

Six of these get made from the same six frame archetypes, so the series looks
like a series. The spec carries only what differs: the spoken lines and each
frame's content. Everything mechanical — narration in Yar's ElevenLabs voice,
frame durations pinned to the real audio, assembly, check, render — happens here.

Archetypes:
  list    eyebrow + headline + swatch rows + note
  stat    eyebrow + headline + one or two big number cards + note
  compare eyebrow + headline + two labelled media cards (the before/after)
  media   eyebrow + headline + one media card + note
  cmd     eyebrow + headline + a command bar + optional media + note
  payoff  two full-width lines + note   (held; no media)
"""
import json, os, re, subprocess, sys, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKILL = "/Users/yar/.claude/skills/faceless-explainer/scripts"
MEDIA = "/Users/yar/.claude/skills/media-use/audio/scripts"
VENV = os.path.expanduser("~/.hyperframes-venv/bin")


def env():
    e = dict(os.environ)
    e["PATH"] = VENV + ":" + e["PATH"]
    for line in open(os.path.join(ROOT, ".env"), encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            if v.strip():
                e[k.strip()] = v.strip()
    return e


def sh(args, cwd, e=None, quiet=False):
    p = subprocess.run(args, cwd=cwd, env=e or env(), capture_output=True, text=True)
    out = re.sub(r"\x1b\[[0-9;]*[a-zA-Z]", "", p.stdout + p.stderr)
    if not quiet:
        print("\n".join(out.strip().split("\n")[-6:]))
    return out


CSS = """
    #root{position:absolute;inset:0;width:1080px;height:1920px;container-type:size;overflow:hidden;
      font-family:"JetBrains Mono",monospace;color:#0f0f0f;-webkit-font-smoothing:antialiased}
    .clip{position:absolute;inset:0}
    .ground{background:#efe9d9}
    .stage{position:absolute;inset:0}
    .brow{position:absolute;left:76px;top:150px;font-size:30px;letter-spacing:.2em;
      text-transform:uppercase;color:#dc551d;font-weight:600}
    .h{position:absolute;left:72px;right:72px;top:214px;font-family:"Archivo Black",sans-serif;
      font-weight:400;font-size:96px;line-height:1.04;text-transform:uppercase;letter-spacing:-.015em}
    .h em{font-style:normal;color:#dc551d}
    .h .g{color:#1f8a4c}
    .row{position:absolute;left:76px;right:76px;display:flex;align-items:center;gap:22px;
      font-size:40px;line-height:1.2}
    .sw{width:38px;height:38px;flex:none;border:4px solid #0f0f0f}
    .card{position:absolute;left:40px;width:1000px;border:5px solid #0f0f0f;
      box-shadow:16px 16px 0 #0f0f0f;overflow:hidden;background:#000}
    .card img,.card video{width:100%;height:100%;object-fit:cover;display:block}
    .lab{position:absolute;left:40px;font-size:27px;letter-spacing:.14em;text-transform:uppercase;
      font-weight:600;color:#efe9d9;background:#0f0f0f;padding:10px 20px}
    .lab.ok{background:#1f8a4c}
    .note{position:absolute;left:44px;right:76px;font-size:32px;line-height:1.45;color:#2a2a2a}
    .stat{position:absolute;left:40px;width:1000px;border:5px solid #0f0f0f;background:#efe9d9;
      box-shadow:14px 14px 0 #0f0f0f;padding:26px 30px}
    .stat b{display:block;font-family:"Archivo Black",sans-serif;font-weight:400;font-size:132px;
      line-height:1;color:#dc551d}
    .stat.g b{color:#1f8a4c}
    .stat span{display:block;font-size:31px;margin-top:12px;color:#2a2a2a}
    .cmd{position:absolute;left:40px;width:1000px;background:#0f0f0f;color:#efe9d9;
      box-shadow:14px 14px 0 rgba(15,15,15,.28);padding:28px 30px;font-size:38px}
    .cmd i{font-style:normal;color:#1f8a4c}
    .foot{position:absolute;left:0;right:0;bottom:0;height:120px;background:#0f0f0f;color:#efe9d9;
      display:flex;align-items:center;justify-content:space-between;padding:0 60px;
      font-size:27px;letter-spacing:.12em;text-transform:uppercase}
"""

SLAM = 'tl.fromTo("#{i}",{{y:46,opacity:0}},{{y:0,opacity:1,duration:.45,ease:"power3.out"}},{t});'
STEP = 'tl.fromTo("#{i}",{{y:26,opacity:0}},{{y:0,opacity:1,duration:.24,ease:"steps(3)"}},{t});'
SLIDE = 'tl.fromTo("#{i}",{{x:-28,opacity:0}},{{x:0,opacity:1,duration:.2,ease:"steps(3)"}},{t});'
FADE = 'tl.fromTo("#{i}",{{opacity:0}},{{opacity:1,duration:.22,ease:"steps(2)"}},{t});'


def frame_html(f, dur, handle):
    """Compose one frame from its archetype. Reveals are spread across the
    duration rather than dumped at t=0 — the anti-slideshow rule."""
    body, tl, n = [], [], 0
    def add(html, anim, t):
        nonlocal n
        n += 1
        i = f"e{n}"
        body.append(html.replace("<<ID>>", i))
        tl.append(anim.format(i=i, t=round(t, 2)))
        return i

    add(f'<div id="<<ID>>" class="brow">{f["brow"]}</div>', STEP, 0.05)
    add(f'<div id="<<ID>>" class="h">{f["head"]}</div>', SLAM, 0.24)
    k = f["kind"]
    # everything after the headline is paced into the back two thirds
    def at(idx, total):
        lo, hi = dur * 0.32, dur * 0.90
        return lo + (hi - lo) * (idx / max(total, 1))

    if k == "list":
        items = f["items"]
        for j, it in enumerate(items):
            add(f'<div id="<<ID>>" class="row" style="top:{900 + j*152}px">'
                f'<i class="sw" style="background:{it["c"]}"></i><span>{it["t"]}</span></div>',
                SLIDE, at(j, len(items) + 1))
    elif k == "stat":
        for j, s in enumerate(f["stats"]):
            g = " g" if s.get("green") else ""
            add(f'<div id="<<ID>>" class="stat{g}" style="top:{800 + j*350}px">'
                f'<b>{s["n"]}</b><span>{s["t"]}</span></div>', STEP, at(j, len(f["stats"]) + 1))
    elif k == "compare":
        a, b = f["a"], f["b"]
        add(f'<div id="<<ID>>" class="lab" style="top:620px">{a["lab"]}</div>', SLIDE, at(0, 4))
        add(f'<div id="<<ID>>" class="card" style="top:680px;height:400px">'
            f'<img src="{a["src"]}" alt=""></div>', STEP, at(0.4, 4))
        add(f'<div id="<<ID>>" class="lab ok" style="top:1140px">{b["lab"]}</div>', SLIDE, at(1.6, 4))
        add(f'<div id="<<ID>>" class="card" style="top:1200px;height:400px">'
            f'<img src="{b["src"]}" alt=""></div>', STEP, at(2.0, 4))
    elif k == "media":
        m = f["media"]
        tag = (f'<video id="vid-{f["id"]}" src="{m["src"]}" muted playsinline '
               f'data-start="0" data-duration="{m.get("dur", dur)}" data-track-index="1"></video>'
               if m["src"].endswith(".mp4") else f'<img src="{m["src"]}" alt="">')
        add(f'<div id="<<ID>>" class="card" style="top:{m.get("top",720)}px;'
            f'height:{m.get("h",562)}px">{tag}</div>', STEP, at(0.6, 3))
    elif k == "cmd":
        add(f'<div id="<<ID>>" class="cmd" style="top:600px">{f["cmd"]}</div>', SLIDE, at(0.3, 3))
        if f.get("media"):
            m = f["media"]
            tag = (f'<video id="vid-{f["id"]}" src="{m["src"]}" muted playsinline '
                   f'data-start="0" data-duration="{m.get("dur", dur)}" data-track-index="1"></video>'
                   if m["src"].endswith(".mp4") else f'<img src="{m["src"]}" alt="">')
            add(f'<div id="<<ID>>" class="card" style="top:800px;height:{m.get("h",562)}px">{tag}</div>',
                STEP, at(1.2, 3))
    elif k == "payoff":
        body.append(f'<div id="p1" class="h" style="top:420px;font-size:104px">{f["l1"]}</div>')
        tl.append(SLAM.format(i="p1", t=0.05))
        body.append(f'<div id="p2" class="h" style="top:900px;font-size:104px">{f["l2"]}</div>')
        tl.append(SLAM.format(i="p2", t=round(dur * 0.30, 2)))
        body = body[:2] + body[2:]  # brow/head unused on payoff
        body = [b for b in body if 'class="brow"' not in b and ('class="h"' not in b or 'id="p' in b)]
        tl = [t for t in tl if '"#e1"' not in t and '"#e2"' not in t]

    if f.get("note"):
        add(f'<div id="<<ID>>" class="note" style="top:{f.get("note_top",1500)}px">{f["note"]}</div>',
            FADE, dur * 0.80)
    body.append(f'<div id="ft" class="foot"><span>@{handle}</span><span>{f["cta"]}</span></div>')
    tl.append(f'tl.fromTo("#ft",{{y:120}},{{y:0,duration:.3,ease:"steps(4)"}},{round(dur*0.14,2)});')
    tl.append(f'tl.to({{}},{{duration:.4}},{round(dur-0.5,2)});')

    return f"""<template>
  <style>{CSS}  </style>
  <div id="root" data-composition-id="{f['id']}" data-width="1080" data-height="1920">
    <div class="clip ground" data-start="0" data-duration="{dur}" data-track-index="0"></div>
    <div class="stage">
{chr(10).join('      ' + b for b in body)}
    </div>
  </div>
  <script>
    window.__timelines = window.__timelines || {{}};
    (function(){{
      var tl = gsap.timeline({{ paused: true }});
      {chr(10).join('      ' + t for t in tl)}
      window.__timelines["{f['id']}"] = tl;
    }})();
  </script>
</template>
"""


def main():
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    proj = os.path.join(ROOT, "shorts-hyperframes", spec["project"])
    e = env()

    if not os.path.isdir(proj):
        subprocess.run(["npx", "-y", "hyperframes@latest", "init", spec["project"],
                        "--non-interactive", "--example=blank", "--skill=faceless-explainer"],
                       cwd=os.path.join(ROOT, "shorts-hyperframes"), capture_output=True, text=True)
        subprocess.run(["npm", "install", "--silent", "hyperframes@0.8.29"],
                       cwd=proj, capture_output=True, text=True)
    sh(["node", f"{SKILL}/build-frame.mjs", "--preset", "creative-mode", "--hyperframes", "."],
       proj, e, quiet=True)

    # ── narration, in Yar's own voice ──
    req = {"provider": "elevenlabs", "lang": "en", "speed": 1.0,
           "lines": [{"id": f"{i+1:02d}", "text": l["text"], "sfx": l.get("sfx", [])}
                     for i, l in enumerate(spec["lines"])],
           "bgm": {"mode": "none"}}
    json.dump(req, open(os.path.join(proj, "audio_request.json"), "w"), indent=2)
    print("· narration")
    sh(["node", f"{MEDIA}/audio.mjs", "--request", "./audio_request.json", "--hyperframes", ".",
        "--out", "./audio_meta.json", "--provider", "elevenlabs",
        "--voice", e["ELEVENLABS_VOICE_ID"]], proj, e)

    meta = json.load(open(os.path.join(proj, "audio_meta.json")))
    if len(meta.get("voices", [])) != len(spec["lines"]):
        raise SystemExit("narration incomplete — refusing to build on partial audio")
    for v in meta["voices"]:
        v["frame"] = int(v["id"])
        v.setdefault("path", v.get("file"))
    for s in meta.get("sfx", []):
        s["frame"] = int(s["id"])
    json.dump(meta, open(os.path.join(proj, "audio_meta.json"), "w"), indent=2)
    durs = [round(v["duration_s"], 3) for v in sorted(meta["voices"], key=lambda x: x["id"])]
    print("  durations:", durs, "total", round(sum(durs), 2))

    # ── frames ──
    fd = os.path.join(proj, "compositions", "frames")
    os.makedirs(fd, exist_ok=True)
    sb = [f"---\nformat: 1080x1920\nduration: {round(sum(durs))}s\n"
          f"message: \"{spec['message']}\"\nmode: autonomous\nmusic: none\n---\n"]
    for i, f in enumerate(spec["frames"]):
        f["cta"] = spec.get("cta", "Full video on the channel")
        open(os.path.join(fd, f["id"] + ".html"), "w").write(
            frame_html(f, durs[i], spec.get("handle", "yarmalik")))
        sb.append(f"## Frame {i+1} — {f['id']}\n\n- duration: {durs[i]}s\n- status: animated\n"
                  f"- transition_in: cut\n- voiceover: \"{spec['lines'][i]['text']}\"\n"
                  f"- src: compositions/frames/{f['id']}.html\n")
    open(os.path.join(proj, "STORYBOARD.md"), "w").write("\n".join(sb))

    sh(["node", f"{SKILL}/assemble-index.mjs", "--storyboard", "./STORYBOARD.md",
        "--hyperframes", "."], proj, e)
    out = sh(["npx", "hyperframes", "check"], proj, e, quiet=True)
    print("  check:", [l for l in out.split("\n") if "Check" in l][-1:] or "?")
    if "Check failed" in out:
        print("\n".join(l for l in out.split("\n") if "✗" in l))
        raise SystemExit("check failed — not rendering")
    sh(["npx", "hyperframes", "render", "--skill=faceless-explainer", "--quality", "high",
        "--output", "renders/video.mp4"], proj, e)
    print(f"\n✅ {proj}/renders/video.mp4")


if __name__ == "__main__":
    main()
