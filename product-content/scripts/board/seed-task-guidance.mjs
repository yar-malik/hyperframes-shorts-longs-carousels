/**
 * Fills in the part of a standard that was only ever said in WhatsApp: a short
 * tab name, how to do the job well, and prompts that do it.
 *
 *   node scripts/seed-task-guidance.mjs             # show what it would do
 *   node scripts/seed-task-guidance.mjs --write     # do it
 *
 * Everything here is from the team chat between 4 June and 31 August 2026 —
 * Yar's own corrections, and the things that were learned the expensive way
 * (accounts banned, posts rejected, a community that stopped being pushed
 * because it looked dead). Nothing is invented advice.
 *
 * Idempotent, and it never overwrites something already written on the board:
 * a standard whose `how` has been edited is left exactly as it is unless
 * --force is passed.
 */
import { readFileSync } from "node:fs";

for (const file of [".env.local", ".env.production.local"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
const U = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
const write = process.argv.includes("--write");
const force = process.argv.includes("--force");
if (!U || !K) { console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "content-type": "application/json" };

/* The rules that apply to everything, so they are not repeated seven times.
   Shown on every task under "Always". */
const ALWAYS = [
  "Post from your own real account. New accounts get banned — it happened to both of you, and the effort you put into keeping them alive is worth less than one week on your real one.",
  "Send people to the /about page of the community, never a bare link.",
  "Ask for a comment, not a DM. When we asked for DMs we got nothing; when we asked for comments we got fifty.",
  "Put the call to action inside the lead magnet — the PDF, the last slide — not in the post text. Group admins reject posts that carry links.",
  "Nothing that looks AI-generated. No stock-glamour faces, no AI-sounding copy.",
  "Space your posts out. Twenty posts in ten minutes is what gets an account flagged.",
  "Never over-promise. It is $9, not $900, and the refunds come from over-promising.",
];

/* owner, a regex that finds the standard, then what to fill in. */
const GUIDANCE = [
  /* ---------------- Skool ---------------- */
  [/skool/i, {
    link: 'https://www.skool.com/aivideo-1153/ai-ad-creativehomework',
    link2: '',
    label: "Skool posts",
    how: `This is the one that decides everything else. Skool ranks communities on member growth, engagement and retention, and it spends its own ad money pushing the ones that rank — that is where five or six of our members came from. A community with no engagement looks dead, stops being pushed, and we lose the ads.

Yar, 16 June: "You did not engage for 4-5 days and we got penalized." And: "Community looks dead to Skool when they see that there is 0 engagement."

What a good one looks like:
• A question or a challenge people can answer in one line. "What is the most frustrating part of X" beats a tutorial nobody replies to.
• Every post needs its likes and comments before you move on. A post with none is worse than no post — it is proof the room is empty.
• Homework posts work: give a task, ask people to drop what they made.
• Reply to every comment fast. Slow replies are how the leads went cold.

Do not: post the same thing in several communities, pitch inside somebody else's paid group, or write anything that reads as a sales message.`,
    prompts: [
      {
        title: "Ten engagement posts for the day",
        body: `You are writing posts for a Skool community about AI video creation (or Claude Code, if I say so).

Write 10 short posts. Each one must:
- Open on a specific obstacle the reader has hit, not a credential or a promise
- Be answerable in one sentence, so commenting is easy
- Sound like one person talking to another, with no marketing voice, no emoji clusters, no hashtags
- Be under 60 words
- End with a question

Vary the shape: some a small win, some a mistake I made, some a straight question, some a one-line challenge with "drop yours below".

Do not mention pricing, do not link anything, do not use the words "unlock", "game-changer", "dive in", or "in today's world".`,
      },
      {
        title: "A homework post",
        body: `Write one Skool homework post for an AI video community.

Give the reader a single concrete task they can finish in 15 minutes with free tools, then ask them to post what they made in the comments.

Rules: name the exact tool and the exact steps, keep it under 120 words, and make the result something they would actually want to show someone. No preamble about why it matters.`,
      },
      {
        title: "Replies to comments",
        body: `Here are comments on my Skool post: [paste]

Write a reply to each. Each reply must add one useful specific thing — a setting, a next step, a correction — and end in a way that invites another reply. Never thank-and-stop. Under 40 words each. Do not pitch anything.`,
      },
    ],
  }],

  /* ---------------- Instagram ---------------- */
  [/instagram/i, {
    link: 'https://www.instagram.com/p/DaTvDK2Fnw5/',
    link2: 'https://www.instagram.com/p/DcHRcfKln6e/',
    label: "Instagram",
    how: `Slides. The first one is the whole job — Yar, 31 August: "we are in the business of getting attention so its very important", and "first thing has to be catchy".

What a good one looks like:
• First slide is a hook that gives value, not one that teases it. A boring opener is the most common reason a set gets rejected.
• Bright. Not a dark background — "only devs like dark mode". Keep yellow consistent for AVC.
• A recognisable face or reference on the first slide earns attention: Elon, Altman, someone the reader knows on sight.
• The same slides go to Facebook and LinkedIn. Make them once, post them three times.
• Instagram takes at most 4 images in some placements — check before you build ten.

The call to action goes on the last slide, pointing at the /about page.`,
    prompts: [
      {
        title: "A carousel from one idea",
        body: `Turn this into an 8-slide carousel for Instagram: [paste the idea, video, or article]

Slide 1 is the hook: one line, under 9 words, that gives away the most useful thing in the whole set. It must be a claim or a number, never a tease like "you won't believe".
Slides 2-7: one idea each, under 20 words, written so a reader who only sees this slide still gets something.
Slide 8: the call to action, pointing to the community's /about page.

Also give me, for each slide: what the image should show, in one sentence. Bright backgrounds, high contrast, no dark themes.`,
      },
      {
        title: "Twenty hooks to pick from",
        body: `Give me 20 first-slide hooks for a post about: [topic]

Each under 9 words. Each must give away something concrete — a number, a result, a mistake, a specific tool. No curiosity-gap teases, no "here's why", no questions.

Then mark the three you would bet on and say why in one line each.`,
      },
    ],
  }],

  /* ---------------- Twitter ---------------- */
  [/twitter/i, {
    label: "Twitter",
    how: `A tutorial or a piece of news, daily, as text or a text image.

What a good one looks like:
• One thing, done completely. A thread that teaches one small task beats a list of ten tips.
• News works when it is same-day. A model launch posted two days later is worth nothing.
• Text images carry further than plain text — the same slide from the Instagram set usually works.

Keep it to our three categories: AI video, Claude Code, Codex.`,
    prompts: [
      {
        title: "A tutorial thread",
        body: `Write a Twitter thread teaching one specific thing: [topic]

Rules:
- Tweet 1 states the result the reader will have at the end, concretely. No "thread 🧵" and no throat-clearing.
- One step per tweet, each under 200 characters, each independently useful.
- Name exact tools, exact settings, exact prompts.
- Last tweet: what to do next. No hashtags anywhere.

6-9 tweets. If the topic needs more than that, cut the topic down instead.`,
      },
      {
        title: "Same-day news post",
        body: `Here is what was announced today: [paste]

Write one tweet and one optional follow-up that says what it actually changes for someone who builds with AI — not what was announced, what is now possible that was not yesterday. Concrete and specific. No hype words. Under 240 characters for the first one.`,
      },
    ],
  }],

  /* ---------------- Facebook ---------------- */
  [/facebook/i, {
    link: 'https://www.facebook.com/groups/claudeaicommunity/permalink/1255710183262813/',
    link2: '',
    label: "Facebook",
    how: `Groups, and messaging the people who engage. This is what actually worked — Rehman got 50 comments from group posts when cold DMs got nothing.

What a good one looks like:
• Post in groups that are alive. Check before you post; half of them are dead and cost you the slot.
• Ask for a comment. "Comment X and I'll send it" outperforms "DM me" by a long way, and it does not burn your daily DM limit.
• The lead magnet carries the link, not the post. Posts with links get held for a day or rejected outright.
• No hashtag stacks. Nine hashtags reads as spam and hurts reach.
• Your own account, always. The new ones got banned within days.

Then message everyone who commented. Start small — a question, not a pitch. Yar on the pitch-first message: "Nah. This is spammy. You have to start small."`,
    prompts: [
      {
        title: "A group post that gets comments",
        body: `Write a Facebook group post offering a free resource about: [topic]

Rules:
- Open on the obstacle, not on me or my credentials
- Say exactly what the resource is and what is in it — a number of items, a named outcome
- Ask for a one-word comment to receive it. No link anywhere in the post.
- Under 100 words, plain sentences, no emoji rows, no hashtags
- It must not read like an advertisement. It should read like someone sharing something that worked.`,
      },
      {
        title: "First message to someone who commented",
        body: `Someone commented "[word]" on my post about [topic]. Their profile says: [paste anything you know].

Write the first message. It must:
- Be under 35 words
- Ask one question about their situation before offering anything
- Not mention a community, a price, or a link

Then write the follow-up I would send after they reply, which hands over the resource and mentions the community's /about page once, casually.`,
      },
    ],
  }],

  /* ---------------- LinkedIn ---------------- */
  [/linkedin/i, {
    link: 'https://www.linkedin.com/posts/duncanrogoff_media-attachment-share-7480382344181317632-WSTY/',
    link2: '',
    label: "LinkedIn",
    how: `Same lead magnet as Instagram, posted here, and then message the people who engage.

Honest position as of late August: LinkedIn has produced replies and interest but no members yet — "they show interest but after going to page they mostly don't reply". Worth continuing, worth measuring, not worth more time than it has.

What a good one looks like:
• Post the same slides. Do not make new ones for this.
• Write for someone deciding whether you are worth following, not for a feed algorithm.
• Message people who react, not cold lists. Cold has not worked here.
• Aim at the US, UK and Australia — that is where the paying members come from.`,
    prompts: [
      {
        title: "A LinkedIn post from the carousel",
        body: `I am posting this carousel to LinkedIn: [paste the slide text]

Write the accompanying post. Rules:
- First line is the hook and must stand alone, because that is all anyone sees before "see more"
- Then 3-5 short paragraphs, one idea each, plain language
- No emoji, no hashtag block, no "Agree?" ending
- Close with a question that someone in the industry would actually answer
- Under 150 words`,
      },
      {
        title: "Message to someone who engaged",
        body: `This person reacted to my post about [topic]. Their headline: [paste].

Write a first message under 30 words that references something specific to them and asks one question. No pitch, no link, no mention of a community. The goal is a reply, nothing else.`,
      },
    ],
  }],

  /* ---------------- Statistics ---------------- */
  [/statistic|stats/i, {
    label: "Statistics",
    how: `The numbers that decide whether Skool pushes us. Fill the row for the day and put the screenshot on the row.

What to record: member count, 30-day visitors split into from-Skool and not-from-Skool, where we sit in Trending Overall and Trending Tech, and the rank.

Do not compute the growth columns — the board works those out from the row below. That is the one thing the spreadsheet got wrong: growth was typed by hand and drifted away from the numbers next to it.

Check the category while you are there. CCM sat in "Money" for weeks when it belonged in Tech, and that alone costs discovery.`,
    prompts: [
      {
        title: "Read the week's numbers",
        body: `Here are the last 14 days of community statistics: [paste the rows]

Tell me:
1. What moved and what did not, in plain numbers
2. Whether the from-Skool and not-from-Skool visitor lines are moving in the same direction, and what it means if they are not
3. Which single number I should be trying to change this week, and why that one
4. Anything that looks like an error rather than a real change

Be direct. Do not pad it with encouragement.`,
      },
    ],
  }],

  /* ---------------- Courses ---------------- */
  [/course/i, {
    label: "Courses",
    how: `Text, visuals and video for the classroom.

Read this before you write anything: in June we took two strikes from Skool for course structure that duplicated another creator's, and the communities were pulled from discovery. A lawyer was involved. Nothing here is worth a third strike.

So:
• Structure, titles and text must be ours. Not reworded — ours.
• Take source material from several places, never one creator.
• Transcripts of YouTube videos are good raw material. Somebody's course outline is not.
• Set the thumbnail first. A course without one is not presentable and reads as unfinished.
• Keep the classroom and the repo in the same state, so the current status can be seen without asking anyone.

Archive anything replaced. Never delete it — it is evidence.`,
    prompts: [
      {
        title: "An original course outline",
        body: `I am building a course on: [topic] for an audience of [who].

First, ask me what I already know about this topic and what I can demonstrate on screen. Wait for my answer.

Then build an outline that is structured around the order someone actually hits problems in, not around a topic list. For each module give me: the obstacle it removes, what the learner can do at the end, and the one thing they build.

Do not follow a conventional "beginner / intermediate / advanced" shape. Do not produce anything resembling a standard course template.`,
      },
      {
        title: "Lesson text from a transcript",
        body: `Here is a transcript of something I recorded: [paste]

Turn it into a written lesson in my voice. Keep my examples and my asides. Cut the repetition and the false starts. Add a short "what you should have now" at the end.

Do not add material I did not say. If something is missing, list it separately as a question for me rather than filling it in.`,
      },
    ],
  }],
];

/* ---------------- apply ---------------- */

const got = await (await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool&select=rev,state`, { headers: H })).json();
const cur = got[0]?.state;
const rev = got[0]?.rev ?? 0;
if (!cur) { console.error("no skool board yet — run seed-skool.mjs first"); process.exit(1); }

const standards = (cur.standards || []).map((s) => ({ ...s }));
let filled = 0, kept = 0, unmatched = [];

/* Most specific first. The task sentences cross-reference each other —
   Rehman's LinkedIn standard says "the same lead magnet you posted on
   Instagram", and both statistics standards say "send a screenshot into the
   Skool WhatsApp group" — so first-match-wins on a loose list picks wrong. */
const ORDER = [/statistic|stats/i, /course/i, /linkedin/i, /instagram/i, /twitter/i, /facebook/i, /skool/i];

for (const s of standards) {
  const re = ORDER.find((r) => r.test(s.task));
  const hit = re && GUIDANCE.find(([g]) => g.source === re.source);
  if (!hit) { unmatched.push(`${s.owner}: ${s.task.slice(0, 50)}`); continue; }
  const g = hit[1];
  if (s.how && !force) { kept++; continue; }
  s.label = s.label || g.label;
  /* The Standard column of the sheet held these and the first seed dropped
     them. Never overwrite one somebody has since put on the board. */
  if (!s.link && g.link) s.link = g.link;
  if (!s.link2 && g.link2) s.link2 = g.link2;
  s.how = g.how;
  s.prompts = g.prompts;
  s.always = ALWAYS;
  filled++;
}

console.log(`board rev ${rev} | standards ${standards.length}`);
console.log(`  filled ${filled}, left alone ${kept} (already written)`);
for (const u of unmatched) console.log(`  ! no guidance matched — ${u}`);
for (const s of standards) {
  console.log(`  ${String(s.owner).padEnd(7)} ${String(s.label || "—").padEnd(13)} how ${s.how ? String(s.how.length).padStart(4) + "ch" : "  —"}  prompts ${(s.prompts || []).length}`);
}

if (!write) { console.log("\nDry run. Add --write."); process.exit(0); }

const next = { ...cur, standards, rev: rev + 1, savedBy: "guidance", savedAt: new Date().toISOString() };
const put = await fetch(`${U}/rest/v1/content_automation_board?id=eq.skool`, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ rev: rev + 1, state: next, saved_by: "guidance", saved_at: new Date().toISOString() }),
});
if (!put.ok || !(await put.json()).length) { console.error("write failed:", put.status); process.exit(1); }
console.log(`\nwritten. board is now rev ${rev + 1}.`);
