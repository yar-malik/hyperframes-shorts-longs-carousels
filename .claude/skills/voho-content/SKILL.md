---
name: voho-content
description: Everything about Voho content in one file, end to end, for a topic of the Voho plan. That's the 9:16 reel, the 16:9 long video, the LinkedIn and Instagram carousels, the LinkedIn post, the tweet and the X article, recorded, QA'd and published, with the house writing style, voice, sound and channels. Use whenever Yar asks for Voho content, a Voho reel, video, carousel or post, or "the next Voho topic".
---

# Voho content: the one file

This file is everything an agent needs to make and post Voho content. Yar changes it here. If anything else in the
repo (AGENTS.md, a doc, a memory note, an old script's comment) disagrees, **this file wins**.

The sections between `<!-- shared:… -->` markers are the same in all three product skills (CCM, AVC, Voho). Edit
them in any one of the three, then run `node scripts/content/sync-skills.mjs --from voho` to copy them to the other
two. Everything outside the markers is Voho's own.

## The product

**Voho** is Yar's voice-agent product. You sign up at app.voho.ai, create an agent in Saudi Arabic, and it answers
calls. Every piece shows a **real** agent set up on the **real** console, taking a **real** call. The audience is Gulf
business owners whose phones go unanswered: clinics, banks, property, and the rest of the 60-topic plan.

- **CTA:** "Try it at app.voho.ai" (spoken "app dot voho dot A I"). On reels and decks it's a comment keyword per
  industry (CLINIC, PROPERTY, LOAN…), and the reply sends app.voho.ai.
- **Character:** Hum and the Hum crew (`crew()` in `open-source/animation-base/src/cast.js`): Minion-style Hums in
  different hair, glasses and outfits, dressed per industry.
- **Accent:** green `#2E9E5B` on the shared cream frame.
- **Business names** in demos are believable and invented ("Al Waha Bank Loans Desk"), never a real company.

Make it on the laptop in VS Code. It needs `.env` (ElevenLabs, Socialit), the Postiz sign-in, Chrome, ffmpeg,
`whisper-cli`, and gcloud for the board.

## Headlines: loud launch news

Yar, 2026-10-04: "I want really really crazy headlines." Every Voho headline reads like breaking launch news, never
like a how-to. His own two examples of the sound:

> Voho launches world's first Saudi model for STT
> Unbelievable! Voho launches world's first open source way to create AI voice agents for dentistry in Saudi Arabic.

**The shape:** a shout (`Unbelievable!` · `Finally:` · `It's here:` · `Nobody saw this coming:`), then **"Voho
launches"** or "Voho just launched", then the thing at the biggest size the truth allows, then who it's for and
"in Saudi Arabic". One sentence, no warm-up, nothing before it.

**Where it goes:** the YouTube title, the reel's frame-0 headline card, the deck cover, the first line of the tweet,
and **the first line of the LinkedIn post**. Yar: "with the LinkedIn post, write direct". So the post opens on the
launch headline itself, then goes straight into what it does. No scene-setting, no "a clinic's phone is where…".

**How loud is allowed.** The loudness is the style. The facts inside it are still facts:
- What the recording showed can always be shouted: "Voho just launched an AI claims desk that logs a car accident in
  Saudi Arabic in 68 seconds."
- What voho.ai says about itself can be shouted (read 2026-10-04; re-read it before quoting): its own models
  **Fahm-1** ("streaming recognition tuned for Saudi dialects and telephony"), **Sada-1** (Arabic speech) and
  **Aql-1** (reasoning); six Arabic dialects with voices built around Najdi; a median response under 420 ms; 18
  open-source repositories.
- **"World's first", "best", "only" and "open source" are claims about Voho, so they come from Yar, not from the
  writer.** A competitor or a customer can check them. Use one when Yar has confirmed it for that exact thing, and
  list it here once he has: *(none confirmed yet)*. Until then, write the loudest true version and tell Yar which
  word you left out and why, so he can say "yes, it's true, put it in".
- Never "open source" for something a viewer can't actually download.

**Examples that pass today:**
1. "Unbelievable! Voho just launched an AI claims desk that speaks Saudi Arabic. I set it up in under a minute."
2. "It's here: Voho launches Fahm-1, speech recognition built for Saudi dialects and phone calls."
3. "Finally: an AI receptionist for Saudi dental clinics that books the appointment itself. Voho just launched it."

## Hooks and CTAs

**Yar keeps these lists.** They're ranked, best first. Reorder them, strike what you don't like, and add a line once
it's posted and done well. Anything in `<angle brackets>` is filled from the real run (the recording, the console, the
tool's own page, or Yar); if you don't have the number, change the sentence. How they're built, and where the shapes
came from, is under "What makes a hook and a CTA work" just below.

**CTAs**
1. "Try it at app dot voho dot A I, and set up your own agent tonight." (spoken; caption and end card: app.voho.ai)
2. "Comment <CLINIC> and I'll send you the link, and you can set one up for your <clinic> in two minutes."
   (reels; one keyword per industry)
3. Long video: "Everything I did here, you can do at app dot voho dot A I."

**Hooks**
0. The launch headline (see "Headlines: loud launch news" above), spoken: "Unbelievable. Voho just launched an AI
   <claims desk> that <logs a car accident> in Saudi Arabic, and I set it up in under a minute." (Yar's default from 2026-10-04)
1. "I built an AI receptionist that answers the phone in Saudi Arabic, and it took me less than 2 minutes." (posted)
2. "This isn't a person answering the phone. It's an AI agent, and it just booked a <dentist appointment> in Saudi
   Arabic." (reveal)
3. "Your <clinic> misses calls after hours, and every one of them books somewhere else. This agent picks up every
   one." (the problem, then the fix)
4. "Watch me set up an AI agent for a <bank> from zero, and then call it." (watch me)
5. "A <business> with <N> staff still answers every call by hand, and here's what one agent takes off their plate."
   (the case study: only with a real business's numbers)
6. "This call took <50> seconds and cost <six> cents, and the caller never knew it wasn't a person." (numbers from
   the console only)

<!-- shared:hook-shapes -->
## What makes a hook and a CTA work

Taken from the vault (`content/vault/07 Shorts Hooks`, `08 Shorts Script`, `research/competitor-batch-2026-09-10.json`)
and from the hooks Yar accepted and rejected on the board (`scripts/board/hook-calibration.json`).

**A hook is the result and the proof in one breath, in full spoken sentences.** Yar rejected the staccato version
and accepted the spoken one, every time:

> ❌ "I made Claude mark its own homework. It failed itself twice, then fixed both. You'll have this running by the end of the video."
> ✅ "I let Claude mark its own homework, and it failed itself twice before going back and fixing both problems without me saying anything. I'm going to show you exactly how that's wired up, so you'll have the same thing running by the end of this video."

**The shapes that pulled views** (use the shape, never the words, and only with a true claim):

| Shape | The original | Why it works |
| --- | --- | --- |
| **Built it, with proof** | "I built an AI receptionist that speaks Saudi Arabic, and it took me less than 2 minutes." (ours) | A result you can see, and a number that proves it. |
| **The reveal** | "This isn't me talking. It's my AI clone." (ours) | The first second contradicts what you're looking at. |
| **Value gap** | "The Viral $1 Website Effect That Looks Like $10K" (Nick Saraev, 27.8K) | Cheap input, premium output: a formula you can reuse. |
| **Free window** | "You can now use Claude Code completely free for the next week." (nocodealex, 116K) | Free plus a deadline. Only when it's really free and really ending. |
| **Zero-dollar ownership** | "You can own a full AI agency right now for exactly zero dollars." (nocodealex, 67.5K, 4K comments) | Turns a repo into an identity ("you just became an agency owner"). |
| **The admission** | "The rumors are true, Claude is secretly skipping your tasks and lying to you about it. And Anthropic even admitted it." (nocodealex, 58.5K) | Confirms a suspicion the viewer already has; needs a real source. |
| **You're wasting it** | "Everyone uploading PDFs to Claude is basically wasting all their tokens, and Microsoft has a free fix." (nocodealex, 54.2K) | Names a habit the viewer has, then hands over the fix. |
| **Don't until** | "Don't use Claude Code until you've installed these five plugins." (Chris Pathway, 80K) | A warning, then a list; the CTA hands over the exact list. |
| **Experience at scale** | "I've built 500 AI workflows, this is what businesses want in 2026." (Nate Herk, 260K) | Proof by volume, then the boring truth people pay for. |
| **Skin in the game** | "I spent $400 benching Opus-5, here's what it can do." (Nick Saraev, 64.6K) | Money spent on original testing, not recycled news. |
| **Ranked** | "I ranked every AI offer from worst to best." (Corey Ganim) | Everyone watches to the end for number one. |
| **Watch me** | "Watch me close my first AI agency client from scratch." (Corey Ganim) | Unscripted proof of the whole path. |
| **The monthly list** | "Every AI tool you need to be using in August 2026." (Alex Finn) | A series that renews itself every month. |
| **Outcomes, not AI** | "Business owners do not care about AI. They care about outcomes." (Corey Ganim, LinkedIn) | Contrarian, then a framework they can reuse. |

**A CTA offers exactly what the hook made them want, then says where it is.** The best ones in the vault are a
matched lead magnet ("Comment 'LETTER' for the exact motivation letter that got me into Oxford", Chris Pathway,
136K; "Comment GITHUB and I'll send you all five repos", 119K). Ours always end on the community: the step-by-step
version of *this* video is inside it, and the link is in the bio. Say the community's name, show its real Skool
cover and member count, and keep the spoken CTA one or two sentences. Never "follow for more" on its own, never a
question, never a price unless Yar gives today's.
<!-- /shared:hook-shapes -->

## What one topic makes

| Piece | Size | Made by | Goes to |
| --- | --- | --- | --- |
| Reel | 9:16, 30–40 s | the v4 frame from `videos/avc-ai-clone-reel/`, Voho beats from `videos/voho-saudi-clinic/` | Voho Instagram, Voho Facebook Page |
| Long video | 16:9, 80–130 s | `scripts/voho/produce.mjs` | Voho YouTube, Voho LinkedIn Page |
| Instagram deck | 1080×1350, 7–8 slides | `content/topics/<slug>/pieces.mjs` → render | Voho Instagram |
| LinkedIn deck | 1080×1350, 7–8 slides | same | Voho LinkedIn Page |
| LinkedIn post | text + 1080×1350 image | same | Voho LinkedIn Page |
| Tweet | text + the post's image | same | Yar Malik on X |
| X article | title, body, 1500×600 cover | same | Yar Malik on X |

<!-- shared:house-style -->
## House style: every word we publish

Measured from the vault (`content/vault/`: 9 LinkedIn posts, 6 LinkedIn carousels, 56 tweets, counted 2026-09-10).
Where it says "always", it held in every single one.

1. **No hashtags. Ever.** 0 of 71 posts used one. A hashtag is the fastest tell that something was generated.
2. **Almost no emoji.** 6 of 71. Only when it does a job: `👇` pointing at a link in the comments, `🔖` on a
   save-this. Never decoration, never one per bullet.
3. **A number, early, that could only come from having done the thing.** Never round: `$2,600`, `52,700 stars`,
   `50 seconds, $0.06`. `$2,500` and `over 50,000` read as estimates. The precise figure is the proof you were there.
4. **The first line is a complete sentence that makes a claim**, about 60 characters. It doesn't announce the post.
   ✅ "I cloned a $3 billion app with Codex, and now it's free for me forever." ❌ "Here are 5 things I learned about
   AI agents this week."

**Spoken lines** (reels, long videos) are proper spoken English: full sentences with a subject and a verb, joined on
*but* and *because*, lengths varied. Yar rejected a batch on 2026-09-12 for staccato fragments ("Stop. Misses the
one you meant. Charges you for both."). A hook gives the value, it doesn't tease it.

**Strike on sight** (each appears zero times in the vault): "In today's fast-paced world", "Let's dive in",
"game-changer", "revolutionary", "seamless", "leverage", "unlock", "It's not just X, it's Y", a rhetorical question
as the opener, em-dash-heavy hedging, ending on "What do you think?", bullets all the same length and shape, and any
sentence you could paste under a different product.

**The thing that decides it:** one detail that cost somebody something, usually the unflattering one (what broke,
what it costs, what it can't do). A draft with no cost, no friction and no catch isn't finished.

**Never invent.** Every number, result and quote comes from the source: the recording, the tool's own README or docs,
the console, or Yar. If you don't have the number, change the sentence. Don't put a price or member count on screen
unless Yar gives you today's number. Never over-promise.
<!-- /shared:house-style -->

## The plan and the daily run

`content/voho/voho-30-day-plan.json`: 60 topics, two a day (2026-09-26 → 10-25), all on the Voho Topics page.
`content/voho/progress.json` (written by `publish.mjs`) records what's out. One topic:

```bash
node scripts/voho/new.mjs next                              # → videos/voho-NN-slug/
# write topic.json (below)
node scripts/voho/produce.mjs videos/voho-NN-slug           # records, stops for the subtitles
# write topic.subtitles + reel.segments
# build the reel (below) → videos/voho-NN-slug/reel/renders/reel-web.mp4
node scripts/voho/produce.mjs videos/voho-NN-slug --publish # the rest; posts only if QA passes
# then the decks, post, tweet and article (below)
```

`produce.mjs` is resumable, so after any fix you re-run the same command. It exits 2 at the two points that need
writing. The daily run isn't scheduled yet. Yar decides the trigger.

**What the 2026-10-04 run (topic 2) found, so you don't find it again:**
- **A new account can't make a call.** Since early October app.voho.ai gives the $5 trial credit only after the email
  is confirmed ("Confirm your email to unlock your $5 trial credit", Credit $0.00), and nobody reads the throwaway
  `…demo+<ts>@vohoai.com` inbox. The recording then dies at the caller's voice with `speech 402 insufficient_credit`.
  Record on a demo account that already has credit instead: `LOGIN=1 EMAIL=… PASSWORD=… node scripts/voho/produce.mjs
  <workspace>` (the logins are in older workspaces' `capture/marks.json`; each still had about $4.80 on 2026-10-04).
  The video then shows a sign-in, so v3 says "Open Voho, create an agent…", not "Sign up".
- **The console's own meter is the source for the numbers.** The Test audio panel shows `m:ss · $cost` during the
  call; read the last frame before `call_end` (topic 2: 1:08, $0.14). The setup time is `create_agent` → `saved`
  in `capture/marks.json`.
- **`produce.mjs` rebuilds and re-renders the painted reel on every run**, which overwrites a v4 reel already placed
  at `reel/renders/reel-web.mp4`. Once the long video is right, don't run `produce.mjs --publish`: encode the v4 reel
  into place, then run `node scripts/voho/qa.mjs <workspace>` and `node scripts/voho/publish.mjs <workspace>`
  yourself. `SKIP=facebook` (or `linkedin`) leaves out a channel Yar didn't ask for.
- **Don't name the YouTube thumbnail spec `thumb.json` in a topic workspace.** `scripts/voho/thumbnail.mjs` reads
  that name for the cartoon one and crashes on it. Use `thumb-yar.json`, and run `scripts/thumbnail/youtube.mjs` on it
  again after the last `produce.mjs` run, because produce writes the cartoon over `thumb-youtube.jpg`.
- **No bed means the narration has to cover the setup.** `build-long.mjs` leaves the music out now (`"bed": true`
  brings it back), so v3 and v4 are written long enough to talk through the ~25 s of setup (topic 2: 7 s and 14 s),
  and the builder turns the typing and click sounds up. If QA still names a quiet second, lengthen the line that
  sits next to it before adding a sound.


### topic.json

`new.mjs` fills in the plan (title, industry, scenario, hook) and the painted scene's look. You write the rest.

**Before the recording**

- `agent.name`: a believable, invented business in the industry.
- `agent.instructions`: Saudi Arabic, shaped like the ones in `videos/voho-property-hum/capture/record.mjs` (the
  role, the tasks, the facts it may quote, the rules).
  - It **must** include `وبجملة واحدة قصيرة فقط في كل رد` (one short sentence per reply).
  - Banking and insurance: it never asks for a PIN, password, OTP or full card number.
  - Healthcare: it never gives medical advice.
- `agent.greeting`: one Saudi Arabic sentence with the business name and "how can I help".
- `caller.lines`: 3–5 short Saudi Arabic lines, ≤16 words each: the ask, the details, then name and mobile, then
  goodbye. Give facts the agent can use.
- `vo.v1`–`v6`, in the long-video order below. For Voho:
  - `v1`, said by Yar on camera, 4 s at most: "Today I'll show you how to automate your calls with AI."
  - `v2` the problem, ≤3.5 s. (The setup is ~23 s from "Create an agent" to "Saved", so "under 30 seconds" is a true
    claim for v3 or the reel.) `v3` "Sign up on Voho, create an agent, and set it to Saudi Arabic." `v4` what you told
    it, including the one-short-sentence rule. `v5` "Now call it." `v6` the result the call actually showed, then
    "Try it at app dot voho dot A I."
- `long.step3`: the step pill over the instructions, e.g. "Loan products, documents, one short sentence per reply".
- `reel.headline`: the launch headline, ≤28 chars a line, e.g. `["Voho just launched an AI", "claims desk in Saudi Arabic."]`.
- `reel.tags`: `[hook tag, "A real call · in Saudi Arabic", payoff tag]`.
- `endcard`: one line, e.g. "Every loan enquiry answered, in Saudi Arabic".
- `thumbnail.headline`: alternate "BUILD A…" and "AUTOMATE…" across topics, e.g. `["AUTOMATE", "YOUR BANK'S|CALLS",
  "IN 60 SECONDS"]`. "60 seconds" is true: sign-up to a saved agent is 45–51 s in the recordings. `thumb.crew` names
  who peeks in beside Hum. Makes `thumb-youtube.jpg` (1280×720) and `assets/thumb-reel.png`.
  That cartoon `thumb-youtube.jpg` is only a placeholder now: the YouTube thumbnail is made in Yar's style with
  `scripts/thumbnail/youtube.mjs` (see "Thumbnail first" below), pointing at the real console or the booked call.
- `publish.youtubeTitle` (≤100 chars, the launch headline, and it still says what it is), `youtubeDescription` (what happens, and that it's a real
  console and a real call), `reelCaption` (2 short paragraphs, then "Try it at app.voho.ai"), `linkedin` (the LinkedIn
  post shape below, **opening on the launch headline**, ending "Link to try it is in the comments 👇"), `linkedinComment`.
- `scene`: preset by industry. Change `view` (city | refinery | airport), `icons` or `cardIcon` only if it fits better.

**After the recording** (produce.mjs prints the segments and the Arabic transcript)

- `subtitles`: one English line per segment, **faithful to what was said**. The agent's words are the model's own.
  Translate them, don't improve them.
- `reel.segments`: the best 4–5 turns (the ask, the key answer, the booking).
- `long.segments` (optional): drop a trailing goodbye or a turn that runs long.
- An agent turn over 9 s fails QA. Leave it out, or tighten the instructions and re-record (delete `capture/` and
  `segments.json`).

## The reel: Voho's reference, beat by beat

**Build it on the v4 full-screen frame from `videos/avc-ai-clone-reel/`** (see Reels below); the beats come from
`videos/voho-saudi-clinic/` (published as https://youtube.com/shorts/xDwl0UnZlJY, 35 s, older v3 layout). Change the script,
the five scenes and the call clip. Every number is from this topic's own recording (call length, cost, what got
booked). If the console didn't show a cost, don't say one.

| Time | Voice | Screen |
| --- | --- | --- |
| 0–6 s | **Hook, a built-claim with proof**: "I built an AI receptionist that answers the phone in Saudi Arabic, and it took me less than 2 minutes." Then **the agent's real greeting** from the call audio. | Pill `AI RECEPTIONIST / SPEAKS SAUDI ARABIC`. A card with the business name and a green phone icon, the Arabic greeting with its English line under it, and `UNDER 2 MINUTES` popping at 4 s. |
| 6–12 s | **Step 1**: "You sign up on Voho, create an agent, and give it Layla, a warm Najdi voice that sounds like a local." | `STEP 1 / PICK A SAUDI VOICE`. The console panel (`Voice: Layla`, `Language: Arabic (Saudi Arabia)`), a "Layla · Warm Najdi delivery" card, a green `SOUNDS LOCAL` badge. |
| 12–20 s | **Step 2**: "Then you write its instructions in Saudi Arabic: book the appointment, take the patient's name and number, and never give medical advice." | `STEP 2 / WRITE IT IN ARABIC`. The Arabic instructions card, then three pills: green "Books the appointment", green "Name + mobile", red "No medical advice". |
| 20–27 s | **Step 3**: "I pressed call and asked for a dentist tomorrow afternoon, and it booked me in. Fifty seconds, six cents." | `STEP 3 / TAKE A REAL CALL`. The Arabic transcript on the left, metric cards on the right: `Booked / DENTIST, TOMORROW`, `50s / THE WHOLE CALL`, `$0.06 / WHAT IT COST`. |
| 27–35 s | **Payoff + CTA**: "That's a receptionist that picks up every call. Comment CLINIC and I will send you the link." | `EVERY CALL ANSWERED`, the full Hum crew lined up with Yar's bot, confetti, and `▶ COMMENT CLINIC for the link`. |

- **No music bed** (Yar, 2026-10-01: "no more that music at back, it's very loud and distracting"). This overrides
  the shared sound section below for Voho: no bed under a reel or a long video. The sound effects stay, and so does
  the voice. With no bed, quiet stretches show up as dead air, so cut the waiting out of the recording instead of
  filling it (tutorials: `"noBed": true` in topic.tutorial; `build-tutorial.mjs` then leaves the bed out).
- A reel cut from a tutorial follows this same table: the live call is the step 3 beat (a few seconds of the real
  call in the overlay, punched in), with the Hum crew around it. Never the call alone in a box for the whole reel.
- Encode to `<workspace>/reel/renders/reel-web.mp4`, where QA and `publish.mjs` read it. `produce.mjs` renders a
  painted Hum reel to that path first, and this step-style reel replaces it.
- Caption: two short paragraphs, then "Try it at app.voho.ai".

<!-- shared:reel -->
## Reels: how every reel is made

1080×1920, 30 fps, 20–40 s (the product's range is above). Shorter is better when the five beats still land.

**Copy the reference project, never rebuild it.** The frame engine all three products use is **v4**,
`videos/avc-ai-clone-reel/scripts/frame.mjs`: copy that project (it has the full-screen layout and the overlay slot
for videos and Yar's face cam), then change the script and the five scenes. Copying keeps the fonts, the bots, the
tracker and the timing as good as they already are. Don't use `scripts/content/build-reel.py` or `docs/specs/*.json`: that's the older
faceless-explainer cut, not this style. Reels are made on Yar's laptop in VS Code, where `.env`, `videos/`,
`content/avatar/` and Chrome all are. Never in a cloud session.

**Never a static reel** (Yar, 2026-09-27, on the Voho tutorial reel: "very static… why does it have no characters,
why doesn't it have the vibe and movement of avc-ai-clone-reel"). That reel was a screen recording cropped into a box
with subtitles under it for 57 s (https://www.facebook.com/reel/2205196497545714/): no bots, no crew, no tracker, no card changing, no punch-ins. It's the thing not to
make. Every reel, **including one cut from a long video or tutorial**, is the v4 frame with all of it:
- **Characters on screen in every beat**: the blocky bots and Yar's bot along the bottom, plus the product's crew
  (the Hum crew for Voho, Bit for CCM, Clappy for AVC), reacting to the beat and gathering on the payoff.
- **Something moves every second**: the card morphs, badges and stamps spring in, the marker hops, the crew bobs.
  If a frame could be a screenshot for 2 s, it's too static.
- **Five beats, 20–40 s, a new card each beat.** A real recording (the call, the console) is **one beat's visual**
  in the overlay, a few seconds long with a punch-in, never the whole reel. The rest is the painted/mock cards.
- Never write a new reel builder for a special case. Copy `videos/avc-ai-clone-reel/` and fill its five scenes.

**The script is five spoken lines:** the hook (the result and the proof in one breath), step 1, step 2, step 3
(things the viewer does, in order, naming the real tool), then the payoff and CTA. Each line is a full spoken
sentence, 6–20 words.

**Yar on camera for the first ~2 s** (see "Yar on camera" below).

**Fill the whole 9:16 screen** (Yar, 2026-09-26: the old frame used 40% of it and left the top and bottom empty).
The v4 layout: the progress rail at y 150, the header pill at y 196, the card from y 356 to 1536 (content box
1002×1174), the captions at y 1566, the CTA chip at y 1726, `@yarmalikhere` at y 1858. **Every beat fills the card
top to bottom**: a big visual 600–650 px tall at the top (the real output, a video, a screenshot, a mock UI), then
tiles, a chip or a note under it, and the bots standing big (130–190 px wide) along the bottom. If a beat has a
band of empty card, make the visual taller or the bots bigger until it doesn't. Videos (the real output, Yar's cam)
can't sit inside a timed card, so they go in the `overlay`, placed over the card (card content origin: page x 39,
y 359).

**The frame (don't redesign it):**
- Warm cream paper `#F5F3EE`, white rounded cards with a soft lift shadow, ink `#1F1D1A`. Terracotta `#DC5A2B`
  accent, green `#2E9E5B` for done/yes/money, red `#C63D2F` for no. Never dark.
- Top: a 5-step progress tracker ending in a star. Yar's head is the marker and hops one step per beat; finished
  steps turn into green checks.
- Header pill under it: an icon, a small-caps kicker (`STEP 2 · CLAUDE CODE`), and the claim (`DESCRIBE IT IN ENGLISH`).
- Centre: one card that acts out the line as a mock UI of the real tool (a terminal typing, a sheet filling in, a DM
  thread, a console panel). It morphs in place between beats and is never a slide of bullets. If the tool makes a
  video, the card plays the real output.
- Bottom: the blocky bots and Yar's own bot (his real head from `content/avatar/`, on a bot body, never in a box).
  They flank the card and multiply or gather on the payoff. The product's character can join them.
- Captions: lower third, an editorial serif, word by word, the spoken word in terracotta and the rest muted.
- Footer: `@yarmalikhere`, centred, always on. Fonts: Inter (UI), JetBrains Mono (terminals), the serif (captions).

**Motion:** spring pops on every card and badge, stamps for ✗/✓, typing you can hear, the marker hopping. **A
punch-in or punch-out on every cut**, and more cuts than you think. But a cut must never hide what happened on a
real screen.

**Frame 0 is the thumbnail.** Platforms take the first frame as the cover when posting through an API, so the first
~0.6 s is the finished hook card with the headline set, with no fade-in. Check it: `ffmpeg -y -i reel.mp4 -frames:v 1 cover.jpg`.

**The CTA sends people to the product's home.** For CCM and AVC that's the Skool community (Yar, 2026-09-26: "my goal
in the end is to push people to join"): the last beat shows the community's real Skool cover
(`content/skool/<ccm|avc>-cover.png`), its member count, and a big dark button "Join <Community> · link in bio →",
and the spoken CTA says the whole setup is inside the community and the link is in the bio. The chip at y 1726 says
the same, with confetti and a party horn. For Voho it's app.voho.ai. A comment keyword can still sit in the caption,
but the video's last words always point at the community.
<!-- /shared:reel -->

## The long video: what's Voho's

`produce.mjs` builds it with `scripts/voho/build-long.mjs`; the reference is `videos/voho-property-hum/`. No music
bed (see the reel section). A chat-agent tutorial (the website widget, no call) is `topic.tutorial.chat`: the reference
is `videos/voho-chat-agent-saudi-store/`, on the demo store at yarmalik.com/shop.

1. **Painted open** (`yar-voho-story.js`, the crew dressed per industry): phones ring on an empty desk, the crew pops
   up, and one picks up with the agent's **real** greeting.
2. **The setup**, recorded by `scripts/voho/recorder/` on app.voho.ai: step pills `1 Create an agent` · `2 Name it,
   set Saudi Arabic` · `3 <long.step3>` · `4 Welcome message, then Save`.
3. **The call**: pill `5 Call your agent`, one cut per turn with think-time removed, English subtitles. No corner
   bubble over the console (it covered the screen).
4. **Payoff**: a calendar card with a ✓ stamp, the crew celebrating. End card: `Voho | <endcard> | app.voho.ai`.

<!-- shared:long-video -->
## Long videos: how every long video is made

1920×1080, **about 5 minutes by default** (Yar, 2026-09-26: "just make five-minute videos, we'll see and improve").
The short cut (80–130 s, the reference is `voho-property-hum`, https://youtu.be/XhTD9bhyz1c, 1:28) is for a single
result; anything that teaches is the **tutorial** below. All three products cut the same way: CCM and AVC with
`scripts/long/`, Voho with `scripts/voho/`.

**The tutorial (the 5-minute default).** Yar walks through every step at a pace you can follow along. The reference
is `videos/voho-tutorial-build-an-ai-phone-agent/` (https://www.youtube.com/watch?v=NNtL7QAAlEo, 4:12):
- **Record real takes of the whole flow**, one step at a time, holding each screen for its narration plus ~2 s
  (`scripts/voho/recorder/tutorial.mjs`; extra takes for screens the first take couldn't reach:
  `tutorial-conversations.mjs`, `tutorial-extras.mjs`). A step that stalls because the UI changed is cut in the edit,
  never faked.
- **Chapters**: `topic.tutorial.parts` gives chapter cards between parts and a numbered pill per step
  (`tutorial.steps`, with `focus` for the punch-in on what's being clicked). One narration line per step, said at a
  normal speaking pace.
- **Yar's face cam 4 or more times, 2–3 s each**: the promise at the open, a line on each chapter card, and the CTA
  before the end card (see Yar on camera).
- **All in Saudi Arabic** when asked (Yar, 2026-09-28): `tutorial.lang: "ar"` makes the pills, cards, subtitles,
  captions and end card Arabic and right to left (IBM Plex Sans Arabic in `assets/fonts/`); Yar's narration and face
  cam speak Saudi Arabic in his cloned voice. Write the brand as `فُوهو` (plain `فوهو` slurs), check every line by
  transcribing it back with Whisper large-v3 (`-l ar`), and say "Saudi Arabic" in the title. The reference is
  `videos/voho-12-where-is-my-order-answered-without/` (https://www.youtube.com/watch?v=HICerx3boUM) and its reel
  `videos/voho-order-status-reel/`.
- The same painted open and payoff as the short cut. Build with `scripts/voho/build-tutorial.mjs <dir>`. Its reel is
  a normal v4 reel (see Reels: never a static reel), with the tutorial's best real moment, e.g. the live call, as one
  beat in the overlay. Not `build-tutorial-reel.mjs`: that makes the static cropped-box reel Yar rejected.

**Four parts:**
1. **Painted open, 0–10.2 s.** The product's crew acts out the problem in the animation base (hard cuts: the
   skyline, the empty chair, the desk's alarms, the crew popping up, a close-up), then the camera pushes into the
   monitor and holds.
2. **The real recording grows out of the monitor (0.7 s).** A real screen recording, never a mock, **at real speed**
   (1×; Yar, 2026-09-26: at 1.6× it moved too fast to follow). Numbered step pills bottom-centre, a tick on every
   click, ticks while typing, and a ding when it's done.
3. **The result, one cut per beat**, with the waiting cut out and a punch-in or -out on every cut. **Hold each cut at
   least 4 s** so it can be read, and keep punch-ins inside the text (never crop the start of a line). Subtitles in
   dark rounded boxes when someone speaks, or to quote the one line that matters. **No corner bubble** over the
   recording (Yar, 2026-09-26: it covered the screen); `"pip": true` in topic.json brings it back.
4. **Painted payoff, the last ~14 s.** Back into the monitor, a result card stamped ✓, the crew celebrating, and the
   end card top right. For CCM and AVC it carries the community's real Skool cover, the outcome, "Join <N> … on
   Skool" and the link (built in: `scripts/long/brand.mjs` holds the cover and today's member count; refresh the count
   when Yar gives a new one). For Voho: `Voho | <outcome> | app.voho.ai`.

**Narration: Yar's order is promise, problem, how.**

| Line | Job | Rule |
| --- | --- | --- |
| v1 | **The promise**, said by Yar on camera | "Today I'll show you how to…", **4 s at most** (about 10 words). QA checks for "show you" or "teach you". Any time it promises, the recording proves. |
| v2 | **The problem** | ≤3.5 s, so v1 + v2 fit the 10 s open. |
| v3 | How, part 1, over the setup | the first steps, naming the tool |
| v4 | How, part 2 | what you told it or typed |
| v5 | The turn, ≤2 s | "Now run it." / "Now generate it." / "Now call it." |
| v6 | **The result the recording actually showed**, then the CTA | Checked against the recording. If it didn't happen on screen, it isn't said. |

**Thumbnail first, in Yar's style.** A long video without its thumbnail isn't presentable, so it's made before the
edit. The references are `content/references/thumbnails/youtube-its-free-claude.png` and
`youtube-claude-beginner-to-pro.png` (Yar's own, 2026-09-26). Every YouTube thumbnail has exactly these parts:
- **Yar, real, on the right**, cut out: surprised, pointing at the object (`content/avatar/yar-point-cutout.png`, cut
  from his Skool cover shoot). A real photo only, never an AI-edited face.
- **One glowing object on the left** that he points at: the real result (a screenshot of the dashboard, the clone
  on screen, the app), the product's logo or character. White edge, a big coloured glow, tilted a few degrees.
- **One or two huge words**: a giant serif word behind him ("Claude"), or heavy white words with one word in a
  glowing box ("It's [Free]"). Never a sentence.
- **One pill** at the bottom left with the transformation, uppercase, ≤ 26 characters ("BEGINNER → PRO",
  "MESSY SHEET → DASHBOARD"). An optional small white stamp with the true number ("4 MIN").
- **Warm dark-to-orange glow** (`theme: "orange"`), **deep blue glow** (`theme: "blue"`) or **Voho green**
  (`theme: "green"`). Nothing else on it. Make each new one look different from the last few on the channel (another
  theme, another object), so a viewer sees at a glance that it's a new video.
- **Every long video gets one by default** (Yar, 2026-09-28: "by default add a great thumbnail"), made before it's
  posted, not after. For an Arabic video the huge words are Arabic (`"rtl": true`), e.g. the viewer's own question
  ("وين [طلبي؟]"), and the pill says it's in Saudi Arabic. Check the Arabic dots survive (they hang below the line).

**Make it here, with the script; that's the thumbnail** (Yar, 2026-09-26: "generate always with yourself here"). Write
the spec and run `node scripts/thumbnail/youtube.mjs <spec.json>` (the fields are at the top of that file). Look at it
and fix it until it's right (Yar fully visible, the point landing on the object, nothing clipped, no leftover edges),
then set it in YouTube Studio (Postiz and Socialit can't set a thumbnail). Don't use ChatGPT or an OpenAI key for it.

**ChatGPT is the fallback, and Yar decides.** If he feels the generated one isn't good enough, he remakes it by hand in
the ChatGPT app: the script also writes `<out>-chatgpt.txt`, the files to upload in order (the two references, his real
photo, the object, the draft) and the prompt to paste. Hand him that only when he asks.

The reference build is
`videos/ccm-turn-a-spreadsheet-into-a-dashboard/thumb.json` → `thumb-youtube-v2.jpg`. The words must be true: the
time on the stamp is the recording's time.

### Making a CCM or AVC long video

```bash
node scripts/long/new.mjs ccm "Replace a spreadsheet with Claude Code"   # → videos/ccm-<slug>/
# put the real screen recording in videos/ccm-<slug>/capture/recording.mp4 (1920×1080 if you can)
node scripts/long/produce.mjs videos/ccm-<slug>        # normalizes it, makes inspect.jpg, stops for the marks
# write topic.json (below), re-run: voice → paint → thumbnails → build → render → QA, stops before posting
node scripts/long/produce.mjs videos/ccm-<slug> --publish   # only when Yar says so
```

It's resumable: fix what it says and re-run the same command. Look at `inspect.jpg` (one timestamped frame every
few seconds) and scrub `assets/recording.mp4` to find the source times. `topic.json`:

- `vo.v1`–`v6`: the narration above.
- `recording.setup`: `{ in, out, rate: 1 }`, the source range of the setup, at real speed.
- `recording.steps`: 3–4 `{ text, at }` pills, each shown from its source time to the next.
- `recording.clicks` (a tick each), `recording.typing` (`[[from, to]]`), `recording.done` (the ding),
  `recording.focus` (optional camera moves `{ at, x, y, scale }` or `{ at, wide: true }`), `recording.v4At`.
- `recording.resultStep`: pill 5's text. `recording.cuts`: 3+ result cuts `{ in, out, sub?, label?, focus? }`.
  `recording.audio: true` keeps the recording's own sound on the cuts.
- `scene`: optional painted overrides (icons on the pin board, crew names), see `yar-studio-story.js`.
- `endcard`, `thumbnail.headline`, and `publish.youtubeTitle` (≤100 chars), `youtubeDescription`, `linkedin`
  (the LinkedIn post shape below, ending "Link is in the comments 👇"), `linkedinComment`.

Check the painted scene before a full render with `node scripts/long/paint.mjs <workspace> --sheet`.
<!-- /shared:long-video -->

<!-- shared:on-camera -->
## Yar on camera

Every video shows Yar himself for a few seconds, to make it personal: **at most 4 s in a long video, about 2 s in a
reel**, at the start. It's his HeyGen avatar, trained on his real footage (the blazer, the painting, the plant), lip-synced
to the same ElevenLabs line as the narration: `node scripts/avatar/say.mjs <line.wav> <out.mp4> [--from s --to s]`.
The goal is that nobody can tell it's an avatar, so:

- **Tutorial (5 min):** the same face cam, **4 or more times, 2–3 s each** (open, each chapter card, the CTA), each
  on its own short line and cut on a word boundary. Never longer than 3 s at a time, however long the video.
- **Long video:** Yar says v1, the promise, in a rounded face cam on the right of the painted open (408×560, soft
  shadow, a small "Yar Malik" name tag), like `content/references/presenter-cam-beside-whiteboard.png`. It pops in
  with v1 and out on its last word. `produce.mjs` makes it (`assets/cam.mp4`) and stops if v1 runs over 4 s; the
  builders place it (`scripts/avatar/facecam.mjs`). `"cam": false` in topic.json leaves it out.
- **Reel:** Yar says the first words of the hook in a big face cam in the lower half of the card, where the bots
  stand, for about 2 s, like `content/references/short-face-cam-bottom-half.png`. Cut on a word boundary (the hook's
  `.words.json`) and trim the line with `--from/--to`. The hook card is fully set on frame 0, so the cover shows both
  the headline and his face. Then the bots take the bottom back. It goes in the `overlay` (see the v4 frame above).
- **When the video is about the clone** (AVC's "this isn't me talking" reel, `videos/avc-ai-clone-reel/`), the clone
  is the subject, so it says the whole hook, labelled `AI CLONE` on screen. Never let a clone pass as Yar without
  saying so in a video about clones.
- Keep it small, short and in his real room. Never enlarge it to full screen, never loop it, never put a filter or an
  AI face edit on it, and never let it run past the end of a sentence. The cam's own audio stays muted: the voice is
  the narration track.
<!-- /shared:on-camera -->

<!-- shared:production -->
## Voice, sound and look (reels and long videos)

**Voice:** Yar's ElevenLabs clone, `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` from `.env` (default
`vfHjAzBDDjup1YnV36Y1`). `scripts/voho/tts.mjs` is the recipe for all three products: `eleven_multilingual_v2` (v3
drifts the accent), a pinned seed, `stability 0.45, similarity_boost 0.8, style 0.15, speaker_boost`, `pcm_44100`,
then one gain across all lines to about **-15 LUFS**. Word timestamps come from `whisper-cli` for the captions.

**Voice agents on screen** speak one short sentence per turn. In the edit, cut their think-time and any turn the next
one implies; every remaining word stays real, and subtitles translate faithfully, never improve.

**Never quiet.** A sound on every beat: ticks on clicks and typing, pops on reveals and step pills, stamps on ✗/✓,
whooshes on cuts, send/receive tones on chat, a chime on money, a ding on the result, a party horn on the payoff. The
music bed sits around 0.2 and is carved under the voice (`carve.mjs`, strength 0.6) so it comes back between lines.
Beds are in `videos/_voho-shared/bgm/`. Measure, don't guess: `ffmpeg -ss T -t D -i file.mp4 -af volumedetect -f null -`.
Voice sits at -16 to -19 dB mean; a music-only stretch near -30 dB needs a sound; the gate is **every whole second
above -34 dB**. Don't trust ebur128's short-term reading for this, it lags about 3 s.

**Look:** no dark backgrounds, bright and cream. Nothing that reads as AI-generated: no glossy AI faces, no
stock-glam avatars. Yar appears as his real photo (`content/avatar/avatar-two.png`, `yar-bust.png`), head cut out on
a bot body, never boxed, never AI-edited. Don't over-edit: a cut that hides the real screen is worse than leaving it.

**Encoding:** x264 CRF 22, maxrate 3M, `+faststart`, AAC 160k, under 60 MB (Socialit times out above that):
`ffmpeg -i in.mp4 -c:v libx264 -crf 22 -maxrate 3M -bufsize 6M -preset slow -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart out.mp4`
<!-- /shared:production -->

## The decks, post, tweet and article: what's Voho's

Copy `content/topics/voho-saudi-clinic/pieces.mjs`, which imports the shared console screenshots and `ctaSlide` from
`content/topics/_voho-shots/common.mjs`. Everything comes off this topic's recording: the agent, its voice, the
Arabic instructions, the call, and the console's summary (outcome, duration, cost). The English under Arabic is our
translation, and the source comment says so.

- **Decks:** the plan shape. Cover with the built-claim, then the voice, the instructions, the call turn by turn, the
  metrics, and `ctaSlide(h, "<KEYWORD>", "and I'll send the link.", "Follow Yar Malik")`.
- **LinkedIn post:** write direct. Line 1 is the launch headline ("Unbelievable! Voho just launched…"), then what it
  does in one or two lines, the three steps, the real call's numbers, the honest part, and the keyword or the link.
- **Tweet:** the launch headline, the one rule that matters in that industry, the first call's result with its numbers,
  "Built on Voho."
- **Article:** "I built a <thing> in <time>. Here's the whole thing.": the setup, the instructions, the call, what it
  didn't do.

<!-- shared:pieces -->
## Carousels, LinkedIn post, tweet, X article: how they're made

Every topic gets an Instagram deck, a LinkedIn deck, a LinkedIn post, a tweet and an X article, rendered from one file:

1. **Write `content/topics/<slug>/pieces.mjs`**, copied from the product's reference. It exports `window` (the fake
   window titles), `short` (`{ url, id }`), `css`, `ig` and `li` (arrays of slide functions returning HTML, given
   helpers like `yar`, `fig`, `folder`), `liPost` (`{ image, text }`), `captions` (`{ ig, li }`), `tweet`, `article`
   (`{ title, body }` in markdown) and `articleCover`. Open it with a comment saying where every number came from and
   when you read it; nothing in the pieces claims more than that.
2. **Render:** `node scripts/content/render-topic-pieces.mjs <slug>` → `public/content-automation/made/<slug>/`
   (`ig-01.jpg…`, `li-01.jpg…` + `li.pdf`, `lipost.jpg`, `article.jpg`, `pieces.json`). Look at every image.
3. **Board:** on the VM (Supabase is only reachable there), after a deploy so the images exist on the box:
   `node scripts/board/set-topic-pieces.mjs --slug=<slug> --topic="<start of title>"`, then again with `--write`.
4. **Post:** `node scripts/content/post-topic.mjs <slug> --product <ccm|avc|voho>` makes **drafts** in Postiz and
   Socialit for Yar to look at; `--publish` posts them for real, only when Yar says so; `--clean` deletes the drafts;
   `--only tweet,liPost` picks pieces. It records everything in `posted.json`, so nothing posts twice.

The design is the same for every deck: a macOS window on cream, two-layer shadows, one accent per slide, one idea per
slide, and the bots (Yar's real head on the bot's clothes) as the recurring figure. The renderer reads the bots' CSS
out of `videos/avc-dollar-video/scripts/frame.mjs` (the `/* bots */` block from line 215), so keep that block where
it is. Never dark.

### LinkedIn deck (document post)

**7–8 slides** (all five Saraev decks in the vault were 7 or 8). **Slide 1 is the whole promise**: an eyebrow naming
the category, a headline with one accented phrase, the number in a pill. **Slides 2 to n−1 are one idea each**: a
headline and at most two supporting lines; three lines means two slides. **The last slide states the thesis in a form
the reader can repeat.** Accent the *turn*, not the subject ("AI consulting is *90% consulting.*"); never the whole
headline. Two shapes work: the **framework deck** (the idea, its numbered parts, the thesis) and the **plan deck**
(a step or a day per slide, verb first). For "N tools/repos" use the **roundup** (one named thing per slide, its
number in the pill). The caption is 1–2 sentences, the reason to open the deck, never a restatement of slide 1.

### Board drafts (plain text)

The board also takes a deck as plain text, for drafts pasted into it; `node docs/playbook/check.mjs` checks
the drafts in `docs/playbook/drafts/` with the board's own parser. The grammar, from `slidesOf()` in `app.js`:

```
SLIDE 1
^EYEBROW
The headline with *one accented phrase*
[the number that buys belief]
(the aside, in a handwritten face)
Body line.

CAPTION
The words above the deck in the feed.
```

It breaks silently four ways: `SLIDE n` not alone on its line (`SLIDE 1 — hook` collapses the deck into one slide),
`CAPTION` not alone on its line, a `[…]` or `(…)` that doesn't fill its whole line (it becomes body text), and
`*asterisks*` outside the headline (they print literally).

### Instagram deck

Same writing, different reader. Slide 1 is a **cover that stops a thumb**: the number in the pill and the promise in
under ten words. One nameable thing per slide. The last slide gives **a reason to save** ("Save this so you can find
the commands"), not "Save for later!". 7–8 slides unless it's a real list of 12 (median on the shelf is 8). The
caption is one or two sentences repeating the promise for anyone who didn't swipe, then the keyword line.

### LinkedIn post

```
Line 1     one claim, ~60 characters, a complete sentence (something at stake: a reputation, a bill, a position you're reversing)
2–3 lines  the situation, or the number that makes it real
the mechanism as a list, → arrows or 1. 2. 3. — each item a step or a part, never a benefit
the honest part: what it cost, what broke, what you'd redo
the reframe, or the link ("Link to the full video is in the comments 👇")
```

**460–1,900 characters, median 553.** Median 5 blocks, none over three lines. If you're at 1,200 characters with no
table of figures, you're padding. Nobody ends on a question. The checklist: first line under ~70 characters and a
claim; an unrounded number in the first three blocks; the mechanism is steps or parts; one paragraph that costs you
something; zero hashtags; nothing that would survive being pasted under a different product.

### Tweet

**Median 167 characters, 2 blocks, first line ~60.** The top five on the shelf were 77–302 characters; the long ones
didn't do numbers. One concrete artefact you can picture, one oddly specific number (`2,234 pieces`, `3 minutes`), and
a flat, lowercase-friendly register: the claim is big, the delivery is plain ("So uh," "Btw" and fragments are fine
here, unlike LinkedIn). **The media carries it:** post-topic.mjs attaches the LinkedIn post's picture; use
`--tweet-text-only` only when the claim is the whole post. If there's an image, the text never describes it. The one
reliable variant is the save-me post: what it is + how long it takes + "Save this before you lose it 🔖".

### X article

The long read behind the tweet: the story of doing it, with the honest part. A headline that says what happened
("I built a Saudi Arabic AI receptionist in two minutes. Here's the whole thing."), `##` sections, 600–1,200 words,
the setup as numbered steps with the real commands or settings, then **what you don't get**. Links are stripped from
X articles, so don't rely on them. It posts as an X article through Postiz (a draft on X unless `--publish`).
<!-- /shared:pieces -->

## QA and publishing the videos

`scripts/voho/qa.mjs` gates the videos before anything posts, on the checklist below plus: long 55–130 s, reel
25–60 s, caller lines ≤16 words, agent turns ≤9 s, a subtitle on every call cut, and all publish text written. It
leaves `qa.json` and `reel-cover.jpg` in the workspace. Look at the cover.

`scripts/voho/publish.mjs` posts the long video to Voho YouTube (Socialit) and the Voho LinkedIn Page (Postiz, link as
the first comment), and the reel to Voho Instagram and Facebook (Socialit). Then it writes `published.json` and
`progress.json`, marks the topic made with its links (`scripts/voho/board.mjs mark`), and syncs the Published
calendar. Re-running never posts to a platform twice.

The one step it can't do is the **YouTube thumbnail**. Set `thumb-youtube.jpg` with vidIQ's
`vidiq_update_video_thumbnail` (channel `UCppKjCMekLofvk-VgsqJgrQ`) or in YouTube Studio. `published.json` keeps it
`pending` until then.

## Posting: Voho's channels

| Piece | Channel | Tool | Id / name |
| --- | --- | --- | --- |
| Long video | Voho YouTube (@voho-ai) | Socialit | `voho-youtube` |
| Reel, Instagram deck | Voho Instagram (@vohoaicalling) | Socialit | `voho-instagram` |
| Reel | Voho Facebook Page | Socialit | `voho-facebook` |
| Long video, LinkedIn deck, LinkedIn post | Voho LinkedIn Page | Postiz | `cmuh0a87o035ppr0yvt9yqpy9` |
| Tweet, X article | Yar Malik on X (@yarmalikAI) | Postiz | `cmpzh6pah00jmob0ymx88rpe5` |

**A LinkedIn article (long-form) can't go through Postiz.** Its LinkedIn Page integration only takes posts and
carousels. Publish it in Chrome instead: Voho Page admin → Create → Publish an article. Then, in the author menu, switch
"Publish to" from **Spotlight** (the Page's newsletter, which is the default) to **Individual article**, unless Yar
asks for a newsletter edition. The first one, from 2026-10-04, is kept with its source in `content/voho/articles/saudi-stt-small/`.

Never point a Voho post at the CCM Instagram, which is connected to the same Socialit workspace; the named targets
in `channels.mjs` prevent it.

<!-- shared:posting -->
## Posting rules (all products)

- **Post only when Yar says to.** Drafts first (post-topic.mjs does drafts by default).
- **Socialit before Postiz wherever Socialit can reach the channel**, because Postiz is capped on Yar's plan. LinkedIn
  and X only exist on Postiz. Every id lives in `scripts/content/channels.mjs`, which the scripts read.
- **YouTube: the main channel, Yar Malik (@YarMalikVibe), for every real post.** Team Yar Malik is only for test
  videos shared with the team (`publish-short.py --test`, unlisted).
- **Facebook gets reels only**, never the 16:9 video. Long videos go to YouTube and LinkedIn; reels go to YouTube
  Shorts, Instagram and Facebook.
- **Only public posts count.** Unlisted or private uploads are tests: never on the Published calendar, never in a
  posting count.
- **Prove every link.** Read the live URL from the post with the exact id you created (never the next row of a list),
  then check YouTube links with oEmbed and compare the title and channel.
- On a LinkedIn video post, the link goes in the **first comment**, not the body.
- Re-encode to under 60 MB before uploading.
<!-- /shared:posting -->

<!-- shared:checklist -->
## Before anything posts

- [ ] Every claim is true and shown. No invented numbers, results or quotes. Generated output on screen is real output from the named tool.
- [ ] The first line of every post is a claim; no hashtags; at most one working emoji.
- [ ] Reel frame 0 is the finished hook card; the long video has its thumbnail.
- [ ] A punch on every cut, a sound on every beat, every whole second above -34 dB.
- [ ] Lengths in range; encoded as above, under 60 MB; YouTube title under 100 characters and says what it is.
- [ ] The last beat and the end card point at the product's home: the Skool community for CCM and AVC (its real cover,
      member count and "link in bio"), app.voho.ai for Voho. The link is in the caption and the bio.
- [ ] Reels are the v4 frame with characters in every beat and movement every second, five beats, 20–40 s; never a
      recording in a box for the whole reel. Scrub it next to `avc-ai-clone-reel`: if it looks stiller, it isn't done.
- [ ] Reels fill the whole screen (no empty band in the card); long videos play the recording at real speed, hold
      each cut 4 s or more, and have no corner bubble.
- [ ] Drafts looked at, and Yar has said to post.
<!-- /shared:checklist -->

## Where things live

| | |
| --- | --- |
| recorder | `scripts/voho/recorder/` (Playwright: signs up a demo account on app.voho.ai and places a live call) |
| call cutter | `scripts/voho/segments.mjs` |
| painted scene | `open-source/animation-base/src/scenes/yar-voho-story.js` + `yar-voho-extras.js` (the Hum crew) |
| thumbnails | `scripts/voho/thumbnail.mjs` |
| builders | `scripts/voho/build-long.mjs` (long), `videos/voho-claims-reel/` (the latest v4 Voho reel, no bed: copy it) + `frame.mjs`, `scripts/content/render-topic-pieces.mjs` (decks) |
| gate, publish, board | `scripts/voho/qa.mjs`, `publish.mjs`, `board.mjs` (+ `scripts/board/mark-voho-topic.mjs` on the box) |
| topic pieces | `content/topics/<slug>/pieces.mjs` → render → `scripts/content/post-topic.mjs --product voho` |
| channels | `scripts/content/channels.mjs`, `scripts/content/socialit.mjs` |
