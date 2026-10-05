# Animation Base

Our copy of John Heibel's [ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase)
(MIT, upstream commit `0ac8bf2`, copied 24 September 2026). It's a starter kit for
hand-painted cartoon animation in p5.js + p5.brush: a character (Clawd, the little
orange block), 31 acted emotions, drawn turnarounds, brush-wipe transitions, and a
headless renderer that writes an MP4.

Why it's here: it looks handmade. Boiling ink lines, watercolour, paper grain. That's the
opposite of the glossy AI look we keep trying to avoid, and it's just code, so Claude
can write the whole thing and check its own work. To see the style at full stretch,
watch `content/references/pdoom-music-video-clawd-version.mp4`: "I'm Upping My
P(doom)", the music video this kit came out of.

When someone says **"animation base"**, this folder is what they mean.

## Make one

Open this folder in Claude Code and ask:

> Read ANIMATION_GUIDE.md, then make a 15-second video of Clawd trying to catch a butterfly.

The model storyboards first, builds shot by shot, renders contact sheets to review
its own frames, and writes `out/video.mp4`. [ANIMATION_GUIDE.md](ANIMATION_GUIDE.md) is
the rulebook (no text on screen, something happens every shot, timing for the
viewer, transitions on every seam). Don't skip it. It's the whole reason the output
is good.

To run it by hand:

```bash
cd open-source/animation-base
npm install
node render.mjs --clip --out=out/video.mp4      # the 11 s demo → MP4
open studio.html                                # scrub it in Chrome (?loop=emotions, ?loop=views)
```

Needs Node, Google Chrome and ffmpeg. All three are on the laptop, and a still renders
in about a third of a second on the M4 Pro.

## Our characters

One per product, in [src/cast.js](src/cast.js). They're built on the same rig as Clawd,
so every emotion, dance, turn and jump in the guide works on them without changes.

| Character | Product | What they are |
| --- | --- | --- |
| **Clappy** `clappy()` | AI Video Club | A yellow clapperboard in AVC's yellow, black and blue. The clapper flaps open when Clappy bounces and snaps shut on the landing. |
| **Bit** `bit()` | Claude Codex Mastery | A navy retro terminal in CCM's navy and orange. The cream screen is the face, and there's an orange cursor blinking on the antenna. |
| **Hum** `hum()` | Voho | A round green voice agent in Voho's green and sand, wearing a headset. Pass `talk: 0..1` and the four voice bars (the Voho mark) dance out of the mic. |

```js
clappy(480, 800, 30, feel('excited', t));
bit(960, 800, 30, { ...feel('thinking', t), view: 'q' });
hum(1440, 800, 30, { ...act('hum', t, [[0, 'neutral'], [1.3, 'happy']]), talk: .6 });
```

Use `act(who, t, keys)` in place of `emotions(t, keys)` for acted mood changes. Plain
`emotions()` works too, but it cross-fades through Clawd's orange for a split second.

Model sheets: [docs/cast.jpg](docs/cast.jpg) (the three together) and
[docs/cast-sheet.jpg](docs/cast-sheet.jpg) (every view plus eight emotions each). You can
scrub them live at `studio.html?loop=cast` and `?loop=castSheet`. The 8-second intro
video is `videos/meet-the-cast/meet-the-cast.mp4` at the repo root; re-render it with
`node render.mjs --loop=cast --clip --out=out/cast.mp4`.

The names are placeholders. Rename them in `CAST` at the top of cast.js.

### The Hum crew

Hum comes in a whole crew, like Minions: the same round green body and headset, with different hair, glasses,
clothes and greens.

```js
hum(x, y, u, { ...feel('happy', t), hair: 'bun', glasses: 'round', outfit: 'dress' });
crew('Bader', x, y, u, feel('excited', t));   // presets: Hum, Nora, Saad, Reem, Bader, Lulu, Zaid, Mona
```

- **hair:** strands, spiky, curly, bun, bob, mohawk, sprout (plus `hairCol`)
- **glasses:** round, square, goggles
- **outfit:** overalls, suit, hoodie, labcoat, dress, vest (plus `outfitCol`)

See them all at `studio.html?loop=crew`.

## Our own animations

Each video is one scene file in [src/scenes/](src/scenes/). [demo.js](src/scenes/demo.js)
is upstream's example; leave it alone and don't copy its story.

- Name ours `src/scenes/yar-<what-it-is>.js` so they're easy to tell apart from upstream's.
- Point the `<script>` tag in [studio.html](studio.html) at the one you're working on
  (the page renders one video at a time), and set `duration`/`bpm` in
  [src/config.js](src/config.js).
- New characters, props, emotions or outfits are fine. The guide says so outright. Paint
  them with the same `paint()`/`inkLine()` tools so they match.
- Add a row below when one's finished.

| Scene file | What it is | Made |
| --- | --- | --- |
| [src/cast.js](src/cast.js) `?loop=cast` | Meet the cast: Clappy, Bit and Hum acting side by side, 8 s | 24 Sep 2026 |
| [yar-voho-clinic.js](src/scenes/yar-voho-clinic.js) (`--page=studio-voho-clinic.html`) | Voho clinic: 11pm, Hum picks up; the painted half of videos/voho-clinic-hum | 25 Sep 2026 |
| [yar-voho-property.js](src/scenes/yar-voho-property.js) (`--page=studio-voho-property.html`) | Voho real estate: the Hum crew answers every phone; the painted half of videos/voho-property-hum | 25 Sep 2026 |

## Things to know

- **Our standards still apply.** The demo is a night sky, and Yar doesn't want dark
  backgrounds, so go daylight/paper-toned unless there's a reason not to.
- **It's not HyperFrames.** It's a separate engine. If an animation needs to live
  inside a HyperFrames video, render it to MP4 here and drop it in as footage.
- `out/` and `node_modules/` are gitignored. Renders don't get committed.
- The animated `docs/emotions.webp` (6.7 MB) was left out, so the upstream README's
  first image is broken here. [docs/emotions.jpg](docs/emotions.jpg) is the same sheet
  as a still, and it's the one the guide uses.
- To pull upstream changes, clone the repo again and diff it against this folder.
  There's no submodule.
