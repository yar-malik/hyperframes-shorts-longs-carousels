# HyperFrames video and social-content examples

Three complete production examples.
Use this team repository as the reference for how a short, a long-video hook, and an Instagram carousel are structured, reviewed, rendered, and published.

| Example | Format | Watch | What it teaches |
| --- | --- | --- | --- |
| [Google Flow Short](#google-flow-short) | 1080×1920 | [YouTube Short](https://www.youtube.com/shorts/_YGFZe2RKVo) | A complete vertical short with six illustrated beats, voice timing, music, and captions. |
| [GPT-6 Astra long-video hook](#gpt-6-astra-long-video-hook) | 1920×1080 | [Before (raw)](https://drive.google.com/file/d/1C4yEdXUr6sSTA79I0i7gM4Sp5X937NXD/view?usp=sharing) → [After (edit)](https://youtu.be/6h9WkGRd9SU) | A raw talking-head hook that starts full-screen, then shrinks the presenter into a floating side card next to an animated visual canvas. |
| [DeepSeek Instagram carousel](#deepseek-instagram-carousel) | 1080×1350 × 6 | [Published post](https://www.instagram.com/p/DdL814LjkIE/?img_index=1) | A high-impact, portrait-led editorial carousel with finished exports, a visual breakdown, rights guidance, and a reusable reconstruction prompt. |

Making real content for one of our products? Start with [Product content skills (CCM, AVC, Voho)](#product-content-skills-ccm-avc-voho).

## Product content skills (CCM, AVC, Voho)

Every reel, long video, carousel, LinkedIn post, tweet and X article for our three products is made from one skill file per product. Each file is the whole playbook for that product: hooks, script style, voice, sound, layout, QA checklist, and which channel each piece posts to.

| Product | Skill | Use it for |
| --- | --- | --- |
| Claude Codex Mastery (CCM) | `ccm-content` | Claude Code / Codex tutorials and news for the CCM channels. |
| AI Video Club (AVC) | `avc-content` | AI video tools and workflows for the AVC channels. |
| Voho | `voho-content` | Voho AI phone-agent demos and tutorials, one topic of the Voho plan at a time. |

The three skills are in [`.claude/skills/`](.claude/skills/): [`ccm-content`](.claude/skills/ccm-content/SKILL.md), [`avc-content`](.claude/skills/avc-content/SKILL.md) and [`voho-content`](.claude/skills/voho-content/SKILL.md). Everything they refer to (scripts, reference video projects, avatar and thumbnail images) is in [`product-content/`](product-content/). The finished renders are on YouTube, [linked below](#reference-videos).

### Setup (once)

```bash
# from the root of this repo
cd product-content && npm install           # dependencies for the production scripts
```

### What isn't here

This repo is public, so a few things stay on Yar's machine: `.env` files and API keys, the content vault and downloaded reference videos (other creators' work), the avatar training footage, and the demo-account passwords in `marks.json` (the emails are kept, the passwords are blank). Ask Yar if a step needs one of them.

### How to use them

1. Open this repo in Claude Code. The three skills load automatically from `.claude/skills/`.
2. Ask for what you need in plain words, naming the product, for example *"make a CCM reel about Claude Code hooks"*, *"next Voho topic"* or *"AVC carousel from this script"*. Claude picks the matching skill and follows it end to end.
3. Read the skill yourself before your first piece (`.claude/skills/<product>-content/SKILL.md`). It's long, but it's the single source of truth: if anything else disagrees with it, **the skill wins**.

### Where the referenced files live

`product-content/` has the same folder layout as Yar's original repo. So when a skill says `scripts/voho/produce.mjs` or `videos/avc-ai-clone-reel/`, look in `product-content/scripts/voho/produce.mjs` or `product-content/videos/avc-ai-clone-reel/`, and run the skill's commands from inside `product-content/`.

| Folder | What it is |
| --- | --- |
| `scripts/content`, `scripts/long`, `scripts/voho`, `scripts/avatar`, `scripts/board`, `scripts/thumbnail` | The production pipeline: TTS, long-video builder, reel builder, thumbnails, posting. |
| `videos/` | Past projects the skills use as reference builds (sources, recordings, b-roll), plus shared Voho music in `_voho-shared/bgm/`. Their finished renders are on YouTube, below. |
| `content/references/`, `content/avatar/`, `content/skool/` | Layout reference stills, thumbnail references, presenter cutouts and community covers. |
| `content/topics/` | Per-topic piece definitions (`pieces.mjs`). |
| `open-source/animation-base/` | The animated presenter / studio scenes used in long videos. |
| `docs/specs/`, `docs/playbook/` | Thumbnail specs and the writing checker (`node docs/playbook/check.mjs`). |

### Reference videos

Finished renders of the past projects, unlisted on the **Team Yar Malik** YouTube channel. Anyone with the link can watch; don't share the links outside the team. The source files for each are in `product-content/` at the path shown.

| Product | Video | Watch | Source in `product-content/` |
| --- | --- | --- | --- |
| AVC | AI clone reel | [YouTube](https://youtu.be/JupDQ8a7GlQ) | `videos/avc-ai-clone-reel/` |
| AVC | Dollar video | [YouTube](https://youtu.be/klj7SXxtjf8) | `videos/avc-dollar-video/` |
| CCM | Spreadsheet to dashboard reel | [YouTube](https://youtu.be/B-c73ldsfiY) | `videos/ccm-spreadsheet-dashboard-reel/` |
| CCM | Spreadsheet tool | [YouTube](https://youtu.be/5Ru270TsY9g) | `videos/ccm-spreadsheet-tool/` |
| CCM | Turn a spreadsheet into a dashboard, long | [YouTube](https://youtu.be/IHHbOqhizLg) | `videos/ccm-turn-a-spreadsheet-into-a-dashboard/` |
| CCM | FreeLLM free Claude | [YouTube](https://youtu.be/lq2G9Bzr8U0) | `videos/freellm-free-claude/` |
| Voho | Where is my order, long | [YouTube](https://youtu.be/DA70if8JFFM) | `videos/voho-12-where-is-my-order-answered-without/` |
| Voho | Order status reel | [YouTube](https://youtu.be/3QfbVnGpRFQ) | `videos/voho-order-status-reel/` |
| Voho | Property hum | [YouTube](https://youtu.be/8oGgHbrCeAE) | `videos/voho-property-hum/` |
| Voho | Saudi clinic | [YouTube](https://youtu.be/CZKaH_fJN3g) | `videos/voho-saudi-clinic/` |
| Voho | Build an AI phone agent, long tutorial | [YouTube](https://youtu.be/tJm5CGuypoY) | `videos/voho-tutorial-build-an-ai-phone-agent/` |
| Voho | Build an AI phone agent, reel | [YouTube](https://youtu.be/eCECf-1qbUw) | `videos/voho-tutorial-build-an-ai-phone-agent/` |
| Voho | Claims reel (latest v4 Voho reel, no music bed) | — | `videos/voho-claims-reel/` |
| Voho | Chat agent for a Saudi store, long | — | `videos/voho-chat-agent-saudi-store/` |
| Animation base | Presenter cast demo | [YouTube](https://youtu.be/QGkrViwXMNI) | `open-source/animation-base/` |

### Keys you need

Put these in `product-content/.env` (it's never committed; ask Yar for values). You only need the ones for the step you're running:

- **Voiceover:** `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- **Avatar / talking head:** `HEYGEN_API_KEY`, `HEYGEN_AVATAR_ID`
- **Posting to socials:** `SOCIALIT_API_KEY`
- **Content board:** `BOARD_ENDPOINT`, `CONTENT_AUTOMATION_SECRET`

### Where the originals live

The master copies are in Yar's `yarmalik.com` repo. **Edit the skills there (or tell Yar), not here**, or the next refresh overwrites your change. Yar refreshes this repo with:

```bash
scripts/content/pull-product-content.sh     # copies the skills and references from ../yarmalik.com
git add -A && git commit -m "Refresh product content from yarmalik.com" && git push
```

## DeepSeek Instagram carousel

![DeepSeek agent-harness carousel contact sheet](examples/carousel-vault/deepseek-agent-harness/carousel-preview.png)

The [`DeepSeek agent-harness carousel`](examples/carousel-vault/deepseek-agent-harness/) is the featured carousel example for `@yar.claudecodex.mastery`. Its six slides use an editorial field-guide system: oversized serif headlines, electric-blue stage lighting, black-and-white portrait cutouts, technical diagrams, tactile grain, and a consistent action rail.

Start with:

- [Published Instagram post](https://www.instagram.com/p/DdL814LjkIE/?img_index=1) — view the live swipe sequence.
- [`README.md`](examples/carousel-vault/deepseek-agent-harness/README.md) — visual breakdown, adaptation guidance, reconstructed creation prompt, and rights notes.
- [`carousel-preview.png`](examples/carousel-vault/deepseek-agent-harness/carousel-preview.png) — the complete six-slide sequence at a glance.
- [`01-deepseek-agent-loop.png`](examples/carousel-vault/deepseek-agent-harness/01-deepseek-agent-loop.png) through [`06-takeaway.png`](examples/carousel-vault/deepseek-agent-harness/06-takeaway.png) — upload-ready 1080×1350 reference exports.
- [`carousel prompt pack`](examples/instagram-carousel/PROMPTS.md) — reusable creation prompt plus brief, design-system, and rendered-pixel review prompts.

## Google Flow Short

![Composition contact sheet](docs/contact-sheet.jpg)

## Watch and study the example

- **Published Short:** [The secret to creating AI movies in minutes](https://www.youtube.com/shorts/_YGFZe2RKVo)
- **Local preview:** [`demo/google-flow-short-preview.mp4`](demo/google-flow-short-preview.mp4)
- **Editing inspiration:** [Alex / nocodealex — “Own a full AI agency for $0”](https://www.instagram.com/nocodealex/reel/Dc4cu6cySSA/)
- **Style notes:** [`EDITING_REFERENCE.md`](EDITING_REFERENCE.md) explains which editing patterns informed this example.

The Instagram reel is an editing reference only. It inspired the layout, pacing, progress rail, headline card, rounded visual stage, and word-by-word captions. It is not the factual source for the Google Flow script.

## Start here

Requirements: Node.js 22+, npm, FFmpeg, and Chrome.

```bash
git clone https://github.com/yar-malik/hyperframes-shorts-longs.git
cd hyperframes-shorts-longs
npm install
npm run check
npm run dev
```

The Studio preview opens the composition with a seekable timeline. Stop it with `Ctrl+C` when finished.

To open the long-video hook instead:

```bash
npm run check:hook
npm run dev:hook
```

The root commands target both examples where useful:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Open the vertical Google Flow short in Studio. |
| `npm run dev:hook` | Open the landscape long-video hook in Studio. |
| `npm run check` | Validate both compositions. |
| `npm run check:short` | Validate only the vertical short. |
| `npm run check:hook` | Validate only the long-video hook. |
| `npm run render` | Render the vertical short. |
| `npm run render:hook` | Render the long-video hook. |
| `npm run build:carousel` | Rebuild the carousel PNGs, editable SVGs, caption, and contact sheet. |

Rendered files and Studio-generated thumbnails are intentionally ignored. Commit the editable source and reference assets, not generated output.

## What to edit

- `script.json` — the six spoken lines, project message, published link, and editing reference.
- `index.html` — the complete 1080×1920 composition: layout, styling, clips, captions, and GSAP timelines.
- `public/broll/` — screenshots shown inside the animated cards.
- `public/sfx/` and `public/bgm.wav` — sound effects and music.
- `.media/audio/voice/` — one voiceover file per beat.
- `audio_meta.json` — word-level voice timing used for karaoke captions and animation cues.
- `scripts/build.mjs` — rebuilds `index.html` from the script and timing files. It overwrites `index.html`, so commit first.

The six numbered beats in `scripts/build.mjs` are the easiest map of the video. Each beat defines its duration, headline pill, visual card, animation, voice track, and caption timing.

## GPT-6 Astra long-video hook

The landscape example lives in [`examples/long-video-hook/`](examples/long-video-hook/). It turns a 17.94-second talking-head recording into a 16.25-second opening: Yar stays full-screen for the first three seconds, then shrinks into a floating picture-in-picture card on the right while a rounded animated canvas illustrates the spoken beats.

![Long-video hook contact sheet](examples/long-video-hook/docs/contact-sheet.jpg)

### Watch the before → after

| Version | Link | What to notice |
| --- | --- | --- |
| Before — raw talking-head hook | [Open the source recording in Google Drive](https://drive.google.com/file/d/1C4yEdXUr6sSTA79I0i7gM4Sp5X937NXD/view?usp=sharing) (also in the repo: [`source/gpt-6-astra-raw-hook.mp4`](examples/long-video-hook/source/gpt-6-astra-raw-hook.mp4)) | Original framing, pacing, voice, and trailing pause. |
| After — HyperFrames edit | [Watch the unlisted YouTube video](https://youtu.be/6h9WkGRd9SU) | Full-screen open, floating presenter card, animated canvas, designed captions, visual beat changes, and tightened ending. |

Open the two links side by side when teaching the edit. The voice performance and source footage stay intact; the transformation comes from layout, timing, typography, captions, and motion design.

Start with these files:

- [`examples/long-video-hook/README.md`](examples/long-video-hook/README.md) — purpose, source, and quick-start notes.
- [`examples/long-video-hook/DESIGN.md`](examples/long-video-hook/DESIGN.md) — layout, palette, typography, and motion direction.
- [`examples/long-video-hook/EDIT_WALKTHROUGH.md`](examples/long-video-hook/EDIT_WALKTHROUGH.md) — beat-by-beat explanation and adaptation guide.
- [`examples/long-video-hook/index.html`](examples/long-video-hook/index.html) — the complete editable composition.
- [`examples/long-video-hook/index.motion.json`](examples/long-video-hook/index.motion.json) — automated motion expectations checked by HyperFrames.
- [`examples/long-video-hook/transcript.json`](examples/long-video-hook/transcript.json) — word-level timings for captions.
- [`examples/long-video-hook/source/gpt-6-astra-raw-hook.mp4`](examples/long-video-hook/source/gpt-6-astra-raw-hook.mp4) — untouched source recording.

To adapt the hook, replace the source video, update the transcript and four beat ranges, then redesign the left-side scenes around the new narration. Keep the visual video muted and use the separate audio element so HyperFrames owns synchronization. Run `npm run check:hook`, inspect the full timeline with `npm run dev:hook`, and render only after that review.

## Safe editing loop

```bash
# 1. Edit the composition or replace media.

# 2. Run the full HyperFrames gate.
npm run check

# 3. Review the seekable timeline.
npm run dev

# 4. Render after the preview looks right.
npm run render -- --quality high --output renders/my-short.mp4
```

Always fix check errors before rendering. Review warnings instead of ignoring them automatically.

The included composition currently passes the full HyperFrames check with zero errors. It retains a few reviewed warnings from the original production project: the deliberately cropped screenshots, repeated portrait asset, dense single-file timeline, direct voiceover carve list, and a 13 ms overlap between two adjacent voice files. They do not block rendering, but they are useful refactoring exercises when learning the project.

## Re-record the script (optional)

The repository already includes the finished voice tracks, so this is only needed after changing the spoken copy.

1. Copy `.env.example` to `.env.local` and add your ElevenLabs key and voice ID.
2. Edit `script.json`.
3. Run:

```bash
node scripts/tts.mjs
node scripts/build.mjs
npm run check
```

The TTS script writes new audio and word timings. The build script then regenerates the composition and captions from those timings.

## Project anatomy

```text
.
├── index.html                 # main HyperFrames composition
├── script.json               # spoken copy
├── audio_meta.json           # word timings for captions/cues
├── hyperframes.json          # HyperFrames project config
├── scripts/
│   ├── build.mjs             # regenerates index.html
│   └── tts.mjs               # optional ElevenLabs voice generation
├── public/                    # B-roll, portrait, music, SFX, font, logo
├── .media/audio/voice/       # rendered voice beats
├── demo/                     # small finished reference render
├── docs/contact-sheet.jpg    # visual overview of the beats
├── examples/long-video-hook/ # landscape talking-head hook example
│   ├── index.html            # hook composition
│   ├── index.motion.json     # motion assertions
│   ├── transcript.json       # word-level source transcript
│   ├── source/               # original talking-head footage
│   ├── docs/contact-sheet.jpg
│   ├── DESIGN.md             # visual direction
│   └── EDIT_WALKTHROUGH.md   # team adaptation guide
├── examples/instagram-carousel/ # editable carousel, outputs, and prompt pack
├── examples/carousel-vault/  # authorized finished references to study
├── .claude/skills/           # links to the CCM, AVC and Voho skills in product-content/
├── product-content/          # private repo, cloned separately (see Product content skills)
└── EDITING_REFERENCE.md      # original editing inspiration and style notes
```

## Media and reuse

The code is available under the MIT License. The included presenter footage, portrait, and voice remain © Yar Malik and are included as teaching material; see [`MEDIA_LICENSE.md`](MEDIA_LICENSE.md). Replace personal footage, branded screenshots, music, and sound effects with assets you have permission to publish before releasing a derivative video.
