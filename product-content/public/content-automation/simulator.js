/**
 * The Skool simulator: a community feed that is not real.
 *
 * Two rooms, CCM and AVC, drawn the way Skool draws them — the top bar, the
 * tabs, the write-something box, the category pills, the post cards with
 * their level badges and comment stacks, the room card and the leaderboard on
 * the right, and a post opened into Skool's modal with its comments. Nothing
 * on it is a real member or a real post: every name, title, body, comment
 * and count is generated here, from a seed, so a feed can be reproduced by
 * typing the seed back in, and a new one is one press away.
 *
 * Two ways to fill it. Shuffle is offline: slots, sentence pools and
 * per-author habits (lowercase typists, emoji people, one-liners), instant,
 * and the same for a given seed. Generate is the real one: the server reads
 * this week's news and the room's classroom, and the model writes posts a
 * member would write today — reacting to a launch, asking for feedback on
 * their own work, stuck on lesson 2.3 — with the comments to match. The
 * headlines it was built from are listed under the controls, with links.
 * Lives entirely in #sim-root; app.js owns the shell and the route.
 */
window.SkoolSim = (function () {
  "use strict";

  /* ---------------- the rooms ---------------- */

  var ROOMS = {
    ccm: {
      id: "ccm",
      name: "Claude Codex Mastery",
      handle: "yar-ai-automation-school-9911",
      mark: "CC",
      cover: "linear-gradient(135deg,#1c1b1a 0%,#2b2622 45%,#d97757 100%)",
      coverImage: "/content-automation/assets/simulator/ccm-cover.webp",
      media: [
        "/content-automation/assets/simulator/ccm-workstation.webp",
        "/content-automation/assets/simulator/ccm-automation.webp"
      ],
      markBg: "#d97757",
      tagline: "Learn Claude Code, Codex and Cursor by building real things. Only $9.",
      about: "Build real software with Claude Code, Codex and Cursor. Live builds, prompts, skills and the exact workflows — no theory, no slop.",
      members: 424, admins: 3, online: [4, 21],
      categories: [
        "💬 General discussion", "🏆 Wins", "❓ Questions", "🛠️ Show your build",
        "🧠 Prompts & Skills", "📚 Resources", "👋 Introduce yourself"
      ],
      weights: [30, 14, 22, 15, 8, 6, 5],
      attach: { "🛠️ Show your build": 0.7, "🏆 Wins": 0.35, "📚 Resources": 0.4 },
      pinned: [
        { title: "Start here 👋 — how this community works",
          body: ["Welcome to Claude Codex Mastery. Quick rules so this stays useful:",
                 "- Post what you built, not what you read. Screenshots or a Loom beat a paragraph.",
                 "- Questions go in ❓ Questions with the exact error and what you already tried.",
                 "- Wins go in 🏆 Wins. Small counts. First deployed app, first paying client, first script that saved you an hour.",
                 "- No affiliate links, no DMs pitching services. One warning, then removed.",
                 "The Classroom has the full Claude Code and Codex courses. Start with module 1 even if you think you know it."] },
        { title: "This week's build challenge: ship one thing with Codex by Sunday",
          body: ["Pick one small project — a script, a page, an automation — and build it entirely with Codex (or Claude Code if you prefer, but try the other one).",
                 "Post it in 🛠️ Show your build with what broke. The broken parts are the useful parts.",
                 "Best one gets pinned next week."] }
      ]
    },
    avc: {
      id: "avc",
      name: "AI Video Club",
      handle: "aivideo-1153",
      mark: "AV",
      cover: "linear-gradient(135deg,#111 0%,#1d1d1d 40%,#f5c518 100%)",
      coverImage: "/content-automation/assets/simulator/avc-cover.webp",
      media: [
        "/content-automation/assets/simulator/avc-skincare.webp",
        "/content-automation/assets/simulator/avc-automotive.webp",
        "/content-automation/assets/simulator/avc-coffee.webp"
      ],
      markBg: "#f5c518",
      tagline: "Learn AI Videos + AI Ads + all my resources. Only $9.",
      about: "Make ads, shorts and cinematic clips with Veo, Kling, Runway and friends. Prompts, workflows and client work — shared daily.",
      members: 102, admins: 2, online: [2, 9],
      categories: [
        "💬 General discussion", "🏆 Wins", "🎬 Showcase", "❓ Questions",
        "🧰 Tools & Workflows", "🧠 Prompts", "👋 Introduce yourself"
      ],
      weights: [26, 12, 24, 18, 9, 6, 5],
      attach: { "🎬 Showcase": 0.92, "🏆 Wins": 0.45, "🧰 Tools & Workflows": 0.3 },
      pinned: [
        { title: "Start here 🎬 — read before you post",
          body: ["Welcome to AI Video Club. Three things:",
                 "- Post the video, not a description of the video. Upload it or drop the link.",
                 "- Say what you used. Model, prompt, how many generations it took. That's the whole point of the club.",
                 "- Client work is welcome in 🏆 Wins — blur the brand if you have to.",
                 "The Classroom has every prompt pack and the ad workflow. Start with 'Your first ad in 40 minutes'."] },
        { title: "Weekly prompt drop: 12 product-shot prompts for Veo 3.1",
          body: ["New pack is in the Classroom under Prompts → Week 36.",
                 "12 prompts for product shots on white, on marble, in-hand, and the slow orbit that everybody keeps asking about. Tested on Veo 3.1 and Kling 2.5.",
                 "Post your results in 🎬 Showcase — I'll pick three for the next video."] }
      ]
    }
  };

  /* ---------------- randomness ---------------- */

  /* mulberry32: small, good enough, and the same on every browser, which is
     what makes a seed reproducible. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var R = rng(1);
  function rand() { return R(); }
  function int(a, b) { return a + Math.floor(rand() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
  function chance(p) { return rand() < p; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function weighted(items, weights) {
    var total = 0, i;
    for (i = 0; i < weights.length; i++) total += weights[i];
    var r = rand() * total;
    for (i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  }
  /* Exponential: most things recent, a long tail of old. */
  function expo(mean) { return -Math.log(1 - rand()) * mean; }
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /* ---------------- people ---------------- */

  var FIRST = ["Daniel", "Priya", "Tom", "Ahmed", "Sofia", "Jake", "Chinedu", "Lena", "Marcus", "Ayesha",
    "Ravi", "Ben", "Olivia", "Hassan", "Kenji", "Maria", "Noah", "Elena", "Samuel", "Farhan", "Grace",
    "Luis", "Zara", "Ethan", "Ivan", "Nadia", "Tyler", "Amara", "Jonas", "Meera", "Chris", "Fatima",
    "Ryan", "Aditya", "Hannah", "Omar", "Leo", "Sana", "Derek", "Isabella", "Kwame", "Jack", "Yusuf",
    "Chloe", "Arjun", "Mike", "Layla", "Victor", "Emily", "Bilal", "Nina", "Carlos", "Rohan", "Sarah",
    "David", "Tariq", "Anna", "Pedro", "Jasmine", "Sean", "Ibrahim", "Rachel", "Daniyal", "Mateo",
    "Kate", "Vikram", "Adam", "Hira", "Lucas", "Simon", "Noor", "Andre", "Zain", "Julia", "Kofi",
    "Max", "Amina", "Owen", "Dev", "Lisa", "Rafael", "Hamza", "Georgia", "Alex", "Ali", "Nate",
    "Josh", "Aisha", "Felix", "Tobias", "Mo", "Kai", "Dan", "Sam", "Abdul", "Wale", "Ruben", "Tim"];
  var LAST = ["Reyes", "Nair", "Hartley", "Raza", "Marin", "Whitfield", "Okafor", "Fischer", "Bell", "Khan",
    "Menon", "Carter", "Grant", "Ali", "Sato", "Lopez", "Brooks", "Petrova", "Adeyemi", "Siddiqui", "Chen",
    "Ortega", "Malik", "Cole", "Kovac", "Hussain", "Marsh", "Obi", "Berg", "Iyer", "Dalton", "Zahra",
    "Kessler", "Sharma", "Wolfe", "Farouk", "Marchetti", "Qureshi", "Huang", "Rossi", "Mensah", "Reilly",
    "Demir", "Bennett", "Patel", "Sorensen", "Haddad", "Nguyen", "Stone", "Ahmed", "Larsen", "Mendes",
    "Das", "Kim", "Osei", "Jamil", "Schulz", "Alves", "Wu", "Murphy", "Yilmaz", "Adler", "Shah", "Cruz",
    "Morrison", "Rao", "Foster", "Baig", "Weber", "Blake", "Silva", "Abbas", "Novak", "Boateng", "Turner",
    "Yusuf", "Price", "Kapoor", "Hoffman", "Torres", "Butt", "Lane", "Rivera", "Hamza", "Kowalski",
    "Oduya", "Lindqvist", "Brennan", "Castillo", "Mahmood", "Varga", "Duarte", "Okoye", "Sheikh", "Byrne"];
  var TINTS = ["#e8a33d", "#3d7be8", "#8a4fe8", "#e84f6a", "#2fae7a", "#e86b2f", "#2f9fb8", "#b83d8a", "#6f8f2f", "#4f5be8"];

  function makePeople(room) {
    var firsts = shuffle(FIRST), lasts = shuffle(LAST);
    var people = [];
    /* One admin, always: pins the rules, answers in the comments. */
    people.push({ name: "Yar Malik", level: 9, admin: true, tint: "#111", photo: 0, style: { lower: false, emoji: 0.5, brief: false } });
    for (var i = 0; i < 64; i++) {
      var name = firsts[i % firsts.length] + " " + lasts[i % lasts.length];
      /* Most members are level 1–3; Skool levels are hard to climb. */
      var level = weighted([1, 2, 3, 4, 5, 6, 7, 8], [34, 26, 16, 10, 6, 4, 3, 1]);
      people.push({
        name: name,
        level: level,
        admin: false,
        tint: TINTS[hashStr(name) % TINTS.length],
        /* Two in three have a photo; the rest are an initial on a colour. */
        photo: chance(0.66) ? 1 + (hashStr(name + room.id) % 70) : 0,
        style: {
          lower: chance(0.22),      /* types in lowercase */
          emoji: chance(0.35) ? rand() : 0, /* how much they reach for one */
          brief: chance(0.28)       /* one-liners */
        },
        /* How much they post: a few regulars carry every feed. */
        weight: i < 12 ? 6 : i < 30 ? 2 : 1
      });
    }
    people[0].weight = 4;
    return people;
  }

  function pickAuthor(people) {
    var w = people.map(function (p) { return p.weight || 1; });
    return weighted(people, w);
  }

  /* ---------------- slots ---------------- */

  var SLOTS = {
    ccm: {
      tool: ["Claude Code", "Codex", "Cursor", "Claude Code", "Codex", "Claude Desktop", "Opus 5", "Sonnet 5", "GPT-5.2 Codex", "Claude Code"],
      tool2: ["Cursor", "Codex", "Claude Code", "Copilot", "Windsurf", "Lovable", "Bolt", "v0"],
      feature: ["subagents", "hooks", "skills", "CLAUDE.md", "plan mode", "worktrees", "MCP servers", "the Agent SDK", "slash commands", "compaction", "the /loop command", "custom agents"],
      project: ["a Shopify app", "an internal CRM", "a Chrome extension", "a scraping pipeline", "a Stripe billing flow", "a Telegram bot", "a Next.js dashboard", "a WhatsApp automation", "an invoice parser", "a landing page", "a Supabase backend", "a Notion sync", "a lead-scoring agent", "a RAG chatbot for our docs", "a booking system for a clinic", "a Discord bot", "a PDF-to-JSON pipeline", "an inventory tracker", "a SaaS MVP", "a portfolio site"],
      stack: ["Next.js + Supabase", "FastAPI", "Django", "Laravel", "Rails", "Express + Postgres", "SvelteKit", "Flutter", "React Native", "Go", "n8n + Claude", "Python + Playwright"],
      n: ["2", "3", "4", "5", "6", "8", "10", "12", "14"],
      big: ["40", "60", "80", "120", "200", "300", "500"],
      money: ["20", "40", "60", "100", "150", "200", "300"],
      sub: ["20", "40", "60", "100", "150"],
      dur: ["20 minutes", "an hour", "two hours", "one evening", "a weekend", "3 days", "a week"],
      err: ["ENOENT", "module not found", "hydration mismatch", "CORS", "a 429 from the API", "a type error it refuses to fix", "an infinite loop in the agent", "context window exceeded", "a merge conflict it created itself"],
      client: ["a dentist", "a local gym", "a real estate agent", "an e-commerce store", "a law firm", "a logistics company", "a restaurant chain", "a marketing agency", "a school", "a recruiter"]
    },
    avc: {
      tool: ["Veo 3.1", "Kling 2.5", "Runway Gen-4", "Sora 2", "Midjourney V7", "Higgsfield", "ElevenLabs", "HeyGen", "Nano Banana", "Flux Kontext", "Luma Ray 3", "Hailuo 02", "Veo 3.1", "Kling 2.5"],
      tool2: ["Kling", "Runway", "Sora", "Pika", "Veo", "Hailuo", "Luma", "Wan 2.2"],
      edit: ["CapCut", "Premiere", "DaVinci", "Final Cut", "CapCut", "HyperFrames"],
      video: ["a product ad", "a UGC-style ad", "a faceless short", "a cinematic trailer", "a talking-head clone", "a 15s TikTok", "a music video", "a real estate walkthrough", "a car commercial", "a perfume ad", "a food B-roll sequence", "an explainer for a SaaS client", "a sneaker drop teaser", "a skincare ad", "a travel reel", "a kids' story video", "a podcast clip with a clone", "a coffee brand ad"],
      client: ["a dental clinic", "a Shopify store", "a gym", "a real estate agent", "a local restaurant", "a skincare brand", "a SaaS founder", "a car dealership", "a coffee brand", "a wedding planner", "a jewellery brand", "a dropshipper"],
      n: ["2", "3", "4", "5", "6", "8", "10", "12", "15", "20"],
      big: ["40k", "80k", "120k", "250k", "400k", "1.2M", "2M"],
      money: ["150", "250", "400", "500", "800", "1,200", "2,000"],
      sub: ["20", "30", "60", "95", "120"],
      dur: ["20 minutes", "an hour", "two hours", "one evening", "an afternoon", "3 days"],
      issue: ["hands", "text on the packaging", "lip sync", "the second character's face changing", "the camera drifting", "the logo warping", "flicker between shots", "the product label", "morphing in the last second", "the voice sounding flat"],
      shot: ["slow orbit", "macro pour", "dolly-in", "top-down flat lay", "handheld walk", "crash zoom", "rack focus", "drone reveal", "over-the-shoulder", "whip pan"]
    }
  };

  /* Fill {slots}; the same slot in one post is the same word every time, so a
     title about Codex has a body about Codex. */
  function filler(room) {
    var memo = {};
    return function (s) {
      return s.replace(/\{(\w+)\}/g, function (_, k) {
        if (!memo[k]) memo[k] = pick(SLOTS[room.id][k] || ["…"]);
        return memo[k];
      });
    };
  }

  /* ---------------- what people write ---------------- */

  /* Per room, per category: title templates and paragraph pools. A post is
     opener + one to three from the middle + maybe a list + a closer. */
  var TEXT = {
    ccm: {
      "💬 General discussion": {
        titles: ["Anyone else moved fully from {tool2} to {tool}?", "{tool} vs {tool2} for {project} — honest take after {n} weeks",
          "How are you handling context limits in {tool}?", "Is it just me or did {tool} get slower this week",
          "Unpopular opinion: {tool} is overkill for small projects", "What's your daily setup? {tool} + what else",
          "Token costs. How are you keeping it under ${sub}/mo", "The one CLAUDE.md rule that changed everything for me",
          "Do you still write any code by hand?", "Fastest way to actually learn {feature}?",
          "Clients don't care which model I use. Do yours?", "Plan mode first, always. Change my mind",
          "Stop letting the agent run the tests for you", "{feature} finally clicked for me", "Why does {tool} keep rewriting files it didn't need to touch",
          "Are you guys committing the agent's work without reading it?", "What did {tool} break for you this week"],
        open: ["Been using {tool} daily for about {n} weeks now on {project}.", "Quick one for the people who have been here longer than me.",
          "I keep going back and forth on this so I'm asking here.", "Had a long day with {tool} and need to vent a bit.",
          "Genuine question, not trying to start a fight.", "Something I noticed after building {project} with {tool}:",
          "So I tried {feature} properly for the first time this weekend."],
        mid: ["The thing nobody tells you is that most of the time goes into reading what it did, not asking for it.",
          "It gets {project} 80% right in {dur} and then the last 20% takes longer than writing it myself would have.",
          "Since I started putting the constraints at the top of CLAUDE.md instead of in the prompt, the output has been noticeably more consistent.",
          "I hit {err} three times in a row and it kept apologising and doing the same thing.",
          "What actually worked was breaking it into smaller tasks and running each in its own worktree.",
          "{tool2} felt faster for edits but {tool} understands the repo way better once it's read it.",
          "I'm spending about ${sub} a month on tokens now and I'm not sure that's the tool or me.",
          "Plan mode is the difference between a clean diff and a mess I have to revert.",
          "My rule now: it writes the test first, I read the test, then it writes the code.",
          "Half my prompts are just 'no, look at the file first'.",
          "The agent was confidently wrong about {stack} for two hours and I only caught it because the build failed.",
          "The moment I gave it a real example of what good looks like, the quality doubled.",
          "Honestly the biggest gain wasn't speed, it was that I don't dread starting anymore."],
        list: [["Read the diff before you accept it", "One task per session", "Commit before every big change", "Tell it what NOT to touch"],
          ["Plan mode → review → execute", "Tests before features", "CLAUDE.md under 60 lines", "Clear the context when it starts looping"]],
        close: ["What's everyone else doing?", "Curious if it's the same for you.", "Would love to hear how you handle this.", "Am I doing this wrong?", "Anyone got a better way?", ""]
      },
      "🏆 Wins": {
        titles: ["First paying client — ${money}/mo for {project} 🎉", "Shipped {project} in {dur}. Two months ago I couldn't code",
          "Just got my first {big} users on a thing I built with {tool}", "Landed {client} as a client from a demo I built in {dur}",
          "Replaced a ${money}/mo SaaS with a script {tool} wrote", "Quit the agency. Going full-time on my own builds",
          "{project} is live. Small win but I'm buzzing", "Sold my first automation to {client}", "Passed the technical interview thanks to what I learned here",
          "From zero to a deployed {stack} app in {n} days"],
        open: ["Small win but I need to tell someone who'll get it.", "This community is the reason this happened so posting it here first.",
          "Okay this is a bigger one.", "Three weeks ago I posted asking how to even start. Update:", "I honestly didn't think this would work."],
        mid: ["Built {project} for {client} with {tool}, took about {dur} of real work.", "They paid ${money} up front and asked what else I can build. That's the part I didn't expect.",
          "Stack is {stack}, nothing fancy, and it's been running for {n} days without me touching it.",
          "Most of it was the Classroom module on {feature}. I just did what it said.",
          "The demo was ugly. Didn't matter. It solved their exact problem in front of them.",
          "I used {tool} for the whole thing and {tool2} to fix the bits it got wrong.",
          "Was terrified on the call. Turned out they just wanted someone who'd actually done it.",
          "Biggest lesson: charge for the outcome, not the hours. Took me {n} months to get that."],
        list: [["Found the pain on a call", "Built the demo in {dur}", "Showed it working on their data", "Invoiced before they could think about it"]],
        close: ["Next stop: ${money}/mo recurring.", "Thanks Yar and everyone who answered my dumb questions.", "Onwards 🚀", "If I can do this anyone here can.", "Happy to share the prompt if anyone wants it."]
      },
      "❓ Questions": {
        titles: ["{tool} keeps hitting {err} — what am I missing?", "How do you structure CLAUDE.md for {project}?", "Best way to give {tool} access to a database safely?",
          "{feature}: worth setting up or overkill?", "How do I stop it from touching files outside the task?", "Deploying {project} — where? Cheapest option that isn't a nightmare",
          "Is ${sub}/month on tokens normal?", "How do you test something the agent wrote when you can't read the language well?",
          "{tool} or {tool2} for a beginner?", "How do you handle secrets with {feature}?", "Anyone got a working setup for {stack} + {tool}?",
          "Context gets huge on {project}. Do I just start a new session?", "What's the actual difference between {feature} and just prompting?"],
        open: ["Probably a dumb question but here goes.", "Stuck on this for {dur} and getting nowhere.", "Beginner here, be gentle.",
          "Following the Classroom lesson on {feature} and hit a wall.", "Need a sanity check."],
        mid: ["I'm building {project} on {stack} and every time I ask for a small change it rewrites half the project.",
          "Getting {err} every time it runs the build. I've pasted the error back in {n} times.",
          "I tried {feature} the way the lesson shows but the agent ignores it completely.",
          "It works on my machine and breaks on deploy, which I know is a meme but here we are.",
          "I don't want it to have my production DB creds but I also can't test without data. How do people do this?",
          "The context is at 90% after {n} messages and it starts forgetting what we agreed.",
          "Do I put this in CLAUDE.md, a skill, or a hook? I genuinely can't tell which is which yet.",
          "Screenshot of the error is attached, the relevant part is the last three lines."],
        list: [["Cleared context", "Restarted the session", "Pasted the full error", "Asked it to read the file first"]],
        close: ["Any pointers appreciated.", "What would you do?", "Thanks in advance 🙏", "Is there a lesson on this I missed?", ""]
      },
      "🛠️ Show your build": {
        titles: ["Built {project} with {tool} — {n} hours, here's what broke", "{project} for {client}, live and taking orders", "My {feature} setup, screenshots inside",
          "Rebuilt my whole workflow around {feature}. Walkthrough", "{project}: from prompt to deployed in {dur}", "Weekend build: {project} on {stack}",
          "Turned a Loom from {client} into a working {project}", "Open-sourced my CLAUDE.md for {stack} projects", "Small tool I use daily now: {project}"],
        open: ["Sharing this because someone here asked for it last week.", "Weekend project, done, warts and all.", "Built for {client}, they let me post it.",
          "This started as a test of {feature} and turned into something I actually use."],
        mid: ["It's {project} on {stack}. {tool} did roughly 90% of it; I did the schema by hand because it kept making it weird.",
          "The hard part wasn't the code, it was getting {feature} to behave. Took me {dur} to realise the fix was one line in CLAUDE.md.",
          "Screenshots attached. The UI is basic on purpose, {client} wanted something their staff could use on a phone.",
          "Total cost in tokens: about ${money}. Total time: {dur}. I'd have quoted {n} days for this a year ago.",
          "Things that broke: {err}, then {err} again after I fixed the first one.",
          "I recorded the whole session, will post the Loom if people want it.",
          "The bit I'm proud of is the agent writing its own integration tests from the spec doc."],
        list: [["{stack}", "{tool} for the build, {tool2} for review", "Deployed on a $5 VPS", "Repo link in the comments"]],
        close: ["Roast it.", "What would you have done differently?", "Happy to answer anything.", "Repo in the comments if anyone wants to poke at it."]
      },
      "🧠 Prompts & Skills": {
        titles: ["The prompt I use to start every {tool} session", "A skill that stops {tool} from touching migrations", "My CLAUDE.md for {stack} (steal it)",
          "Prompt that made {feature} finally work for me", "One-line hook that saved me from {err} forever", "How I get {tool} to review its own PRs",
          "Copy-paste: the review checklist I make the agent run", "Skill for {project}-type builds — feedback wanted"],
        open: ["Sharing because this took me {dur} to get right and it's now the first thing I set up.", "Small one but it's saved me hours.",
          "Stealing is encouraged."],
        mid: ["Put this at the top of CLAUDE.md: 'Read the file before you edit it. Show me the plan. Do not run destructive commands.' That's it, that's the whole trick.",
          "The skill is about 40 lines. It makes the agent write a failing test, show it, then implement. No more 'done!' with nothing working.",
          "The hook runs lint on every save and blocks the commit if it fails. {tool} learns fast when its commits bounce.",
          "The key line is telling it what good looks like with one real example from the repo, not a description.",
          "I keep prompts in a prompts/ folder in the repo and reference them with slash commands. Version-controlled, shared with the team.",
          "Works in {tool}, mostly works in {tool2}."],
        list: [["Read before write", "Plan before code", "Tests before features", "Ask when unsure, never guess"]],
        close: ["Full text in the comments.", "Tell me what you'd add.", "If it breaks for you let me know which model you're on."]
      },
      "📚 Resources": {
        titles: ["Best free resource on {feature} I've found", "The {tool} docs page everyone skips", "Free {stack} boilerplate that works with {tool} out of the box",
          "A YouTube channel that actually explains {feature}", "List of MCP servers I actually use", "Cheat sheet for {tool} commands (pdf)"],
        open: ["Bookmark this.", "Found this while debugging {err} and it's better than the official docs.", "Yar mentioned this in the last call, posting so it doesn't get lost."],
        mid: ["It covers {feature} with real examples instead of hello-world, which is what I needed.",
          "Free, no signup. Link in the post.", "It's the thing that made {feature} make sense for me.",
          "Read the section on {feature} twice. The first pass won't land."],
        list: [["Official docs (yes, actually)", "The Classroom module 4", "This one blog post", "The community search bar"]],
        close: ["Add yours below.", "What else should be on this list?"]
      },
      "👋 Introduce yourself": {
        titles: ["Hey from {client} land — new here", "New member, {n} years in {stack}, zero with AI", "Hi all 👋 building {project} as my first thing",
          "Joined from Yar's YouTube. What should I do first?", "Non-technical founder trying to build {project}", "Intro: switching from {tool2} to {tool}"],
        open: ["Hi everyone!", "Hey 👋", "New here, joined yesterday.", "Been lurking for a week, finally posting."],
        mid: ["I'm a {stack} dev by day, trying to get faster with {tool} so I can take on side projects.",
          "Not a developer at all. I run a small business and want to build {project} without hiring anyone.",
          "Found Yar through the video on {feature} and it was the first thing that made sense.",
          "Goal for the next {n} weeks: ship {project} and get one paying user.",
          "Currently using {tool2} but everyone here seems to be on {tool}, so switching.",
          "Based in Lahore / Dubai / London depending on the month."],
        list: [],
        close: ["Where should I start?", "Excited to be here.", "Say hi if you're building something similar.", "Any tips welcome."]
      }
    },
    avc: {
      "💬 General discussion": {
        titles: ["Is {tool} actually better than {tool2} for {video} right now?", "How many generations do you burn per usable clip?", "Are clients paying for AI video yet or is it still a novelty",
          "{tool} pricing just changed. Worth it?", "Anyone else's {tool} outputs looking worse this week", "Faceless channels: still working in 2026?",
          "What's your stack for {video}? Mine's {tool} + {edit}", "Do you tell clients it's AI?", "Realism vs style — what sells?",
          "The prompt structure that finally stopped {issue}", "Stop making cinematic trailers nobody asked for", "TikTok is flagging my AI videos. Anyone else?",
          "What are you charging for {video}?", "How long do you spend on one 30s ad, honestly"],
        open: ["Been making {video} clips for a few weeks now and I want a sanity check.", "Question for the people actually getting paid for this.",
          "Honest question.", "Might be a hot take.", "Spent the evening on {tool} again and noticed something."],
        mid: ["I'm at maybe 1 usable clip in {n} on {tool}. Is that normal or is my prompting bad?",
          "{tool} nails the {shot} but {issue} ruins every third generation.",
          "Clients don't care how it was made. They care if it looks like the product.",
          "Switched from {tool2} to {tool} last month and the consistency is the difference, not the quality.",
          "I've started doing the first frame in Nano Banana and animating from that. Way fewer wasted generations.",
          "The cost per finished ad for me is about ${money} in credits once you count the failures.",
          "I sold {video} to {client} for ${money} and they thought it was a real shoot.",
          "The trick that helped most: shorter prompts. One subject, one motion, one camera move.",
          "Mixing two tools in one edit is where it starts looking real. All one model looks like that model.",
          "The audio is doing more work than the visuals. Took me way too long to learn that."],
        list: [["First frame in an image model", "Animate in {tool}", "Voice in ElevenLabs", "Cut in {edit}"],
          ["One subject", "One camera move", "One light source", "Under 12 words"]],
        close: ["What's your ratio?", "Curious what everyone else is seeing.", "Am I overthinking this?", "Let me know if I'm wrong.", ""]
      },
      "🏆 Wins": {
        titles: ["First paid ad — ${money} from {client} 🎉", "{video} hit {big} views on TikTok", "Client renewed for ${money}/mo after one video",
          "Went from 0 to {n} clients in {n} weeks with AI ads", "Made {video} in {dur}, sold it the same day", "My {tool} reel got picked up by a brand page",
          "Landed {client} off a cold DM with a 15s sample", "First {big}-view short. Faceless, all AI", "Quit editing weddings. AI ads full time now"],
        open: ["Had to share this here first.", "Update on the post from last week:", "This one's small but it's the first.", "Okay this is a big one for me."],
        mid: ["Made {video} for {client} with {tool}, first frame in Nano Banana, voice in ElevenLabs, cut in {edit}.",
          "Took {n} generations to get {issue} right. Then it just worked.",
          "They paid ${money} and want {n} more this month.",
          "Posted it as a test on TikTok at midnight, woke up to {big} views.",
          "The pitch was literally the Classroom template. Changed two words.",
          "What sold it was showing the ad next to their current one. Theirs looked like a flyer.",
          "The whole thing cost me about ${money} in credits and {dur} of my time."],
        list: [["Sample made in {dur}", "Sent as a Loom", "Call the next day", "Invoice paid before the call ended"]],
        close: ["Video attached (blurred the brand).", "Thanks Yar 🙏", "More coming.", "If you're on the fence about DMing people: do it.", "Prompt in the comments if anyone wants it."]
      },
      "🎬 Showcase": {
        titles: ["{video} — {tool}, {n} generations, {dur}", "Tried the {shot} from the weekly drop. Result:", "{video} for {client}. Feedback?",
          "Made this with {tool} + {edit} in {dur}", "{tool} vs {tool2} same prompt side by side", "First fully AI {video}. Be honest",
          "The {shot} finally worked", "Nano Banana → {tool} pipeline test", "{video}, one prompt, no edits", "Attempt {n} at {video}. Getting closer"],
        open: ["Sharing straight from the timeline, no polish.", "Prompt and settings below.", "Took me {dur}, most of it fighting {issue}.",
          "Trying the workflow from module 3.", "Rate this 1–10 and don't be nice."],
        mid: ["{tool} for the video, first frame from Nano Banana, {n} generations to get a clean one.",
          "The {shot} is the thing I wanted to nail. Everything else is filler.",
          "Sound is ElevenLabs plus a stock track, mixed in {edit}.",
          "Still not happy with {issue} at the end but the client won't notice.",
          "Prompt was under 15 words. Longer prompts kept adding stuff I didn't ask for.",
          "Same prompt in {tool2} looked plasticky. {tool} got the lighting.",
          "Made for {client}, they've approved it, posting with permission."],
        list: [["Model: {tool}", "Aspect: 9:16", "Generations: {n}", "Edit: {edit}"]],
        close: ["What would you change?", "Prompt in the comments.", "Be brutal.", "Next one will be better.", ""]
      },
      "❓ Questions": {
        titles: ["How do you fix {issue} in {tool}?", "{tool} keeps changing the product between shots — help", "Best tool for {video} right now?",
          "How do I keep the same character across {n} clips?", "Is {tool} worth ${sub}/mo over the free tier?", "Which voice in ElevenLabs for {video}?",
          "Where are you getting music that won't get flagged?", "How do you get the text on the label to stay readable?", "Cheapest way to do {video} for a client test?",
          "{tool} says content policy on a totally normal prompt?", "Lip sync tool that actually works?", "Is CapCut enough or do I need a real editor?"],
        open: ["Stuck on this.", "Beginner question.", "Probably missing something obvious.", "Followed the lesson and it's not doing what the lesson does."],
        mid: ["Every generation of {video} on {tool} has {issue}. I've tried {n} prompts.",
          "The product looks perfect in the first frame and then turns into something else by second 4.",
          "I need {n} clips with the same person and every one is a different person.",
          "The client wants the label readable and it turns to soup every time.",
          "Spent ${money} in credits already and I have nothing usable.",
          "Is there a setting for this or is it just luck?",
          "Screenshot attached of what I'm getting vs what I want."],
        list: [["Shorter prompt", "Reference image", "Lower motion", "Different seed"]],
        close: ["Any ideas?", "Thanks in advance.", "What would you try?", "Is there a lesson on this?"]
      },
      "🧰 Tools & Workflows": {
        titles: ["My full {video} workflow, start to finish", "{tool} + {edit} in {dur}: the exact steps", "How I batch {n} ads a day",
          "The first-frame trick that fixed {issue} for me", "{tool} settings I use for everything now", "Consistent characters: the workflow that works",
          "Free tools only: {video} for $0", "Stop generating, start compositing"],
        open: ["Someone asked in the last call, writing it up properly.", "This is the workflow I use for every client now.", "Sharing because it took me {dur} to figure out."],
        mid: ["Step one is always the still. Nano Banana or Midjourney, get the frame perfect before you animate anything.",
          "Then {tool} with a short prompt describing only the motion. The image already has the look.",
          "Voice last, and match the cut to the voice, not the other way round.",
          "I keep every prompt in a Notion table with the generation count so I stop repeating mistakes.",
          "Batching: {n} first frames in the morning, animate at lunch, edit in the evening. {n} ads a day is doable.",
          "For {issue}, the fix was a reference image and lower motion strength. Nothing else worked.",
          "{edit} for the final cut. Templates for captions and end cards so it's ten minutes, not an hour."],
        list: [["Still → {tool}", "Voice → ElevenLabs", "Music → Suno", "Cut → {edit}", "Export 9:16 and 1:1"]],
        close: ["Ask anything.", "What's yours look like?", "Will do a Loom if enough people want one."]
      },
      "🧠 Prompts": {
        titles: ["Prompt that nails the {shot} every time", "12 words. That's the whole prompt", "My {tool} prompt template for {video}",
          "Prompt for {client}-style product ads (tested {n}x)", "Negative prompts that actually work in {tool}", "The lighting words that changed everything"],
        open: ["Steal this.", "From the weekly drop, adapted for {tool}.", "Tested this {n} times, works {n} out of {n}."],
        mid: ["'{shot}, [product] on marble, soft window light, shallow depth, 4s' — that's it.",
          "Say the camera move first, then the subject, then the light. Order matters in {tool} more than the words.",
          "Anything past 15 words and {issue} starts showing up.",
          "For people: 'same person, same outfit' in every prompt plus a reference frame. Nothing else keeps them consistent.",
          "Drop the word 'cinematic'. It adds lens flares and a colour grade you didn't ask for."],
        list: [["Camera move", "Subject", "Surface", "Light", "Duration"]],
        close: ["Post what you get.", "Add yours below.", "Works in {tool2} too with small changes."]
      },
      "👋 Introduce yourself": {
        titles: ["Hi from a wedding videographer going AI", "New here — run a small agency, want to add {video}", "Joined from the YouTube video on {tool}",
          "Intro: {n} years in motion design, zero in AI", "Hey 👋 dropshipper trying to make my own ads", "New member, no editing experience at all"],
        open: ["Hey everyone!", "Hi all 👋", "Just joined.", "Lurked for a bit, saying hi properly."],
        mid: ["I shoot real video for {client}s and want to add AI for the stuff they can't afford to shoot.",
          "Never edited anything. Want to make {video} for my own store and stop paying ${money} per ad.",
          "Saw Yar's video on {tool} and it was the first one that showed the failures too.",
          "Goal: one paid {video} in the next {n} weeks.",
          "Based in Karachi / Manchester / Toronto, happy to collab with anyone nearby."],
        list: [],
        close: ["Where do I start?", "Excited to be here.", "Any tips for a total beginner?", ""]
      }
    }
  };

  /* Comments, by mood; a thread mixes them. */
  var COMMENTS = {
    ccm: {
      generic: ["This is exactly what I needed today.", "Saving this.", "Following, same issue.", "Great write-up 🔥", "Bookmarked", "Underrated point.",
        "Can you share the prompt?", "Which model were you on?", "Did you try plan mode first?", "Same here honestly", "This should be in the Classroom.",
        "Congrats man 🎉", "Huge. Well done.", "Love this", "W", "How long did it take end to end?", "What did it cost you in tokens?",
        "Have you tried putting that in CLAUDE.md instead of the prompt?", "The reading-the-diff part is everything.", "Stack?", "Repo link?"],
      answer: ["Clear the context and give it the file path explicitly. It's guessing.", "Put it in a hook, not the prompt. Prompts get forgotten, hooks don't.",
        "That error is almost always a path issue. Check the working directory the agent thinks it's in.", "Use a worktree per task. Solved 90% of this for me.",
        "I had the exact same thing. Fix was telling it to run the tests before saying it's done.", "Split it into two sessions. One plans, one executes.",
        "Rate limits — add a retry with backoff, the agent won't do it unless you say so.", "The Classroom module on {feature} covers this, about halfway through.",
        "Try {tool2} for that one bit. It's weirdly better at it.", "Don't fight it, just revert and ask again with the constraint up front."],
      admin: ["Great post. Pinning the workflow part for the week.", "This is the way. Read the diff, every time.", "Come to Thursday's call and show this, people will want to see it.",
        "Put this in 🛠️ Show your build with the screenshots — it deserves it.", "Answered in the Classroom, module 5, but short version: hook, not prompt.", "🔥🔥🔥"],
      author: ["Thanks!", "Appreciate it 🙏", "Will do", "Yes, on Opus. Sonnet did the same though.", "Posting the prompt below.", "Good call, trying that now.", "That fixed it. Thank you!",
        "Haha yeah, learned that the hard way", "Repo's in the post now", "About {dur} all in", "Around ${money} for the whole build"]
    },
    avc: {
      generic: ["This looks real. Genuinely.", "Prompt?", "Which model?", "The lighting 👌", "Saving this", "How many generations?", "Clean.", "Insane",
        "Following, same problem with {issue}", "Congrats 🎉", "W", "The audio makes it.", "Love the {shot}", "What's the voice?", "Client should be happy with that",
        "Slightly off at the end but nobody's going to notice", "This is better than most real ads I see", "🔥🔥", "Post the before/after?", "How long did it take?"],
      answer: ["Reference image + lower motion. Only thing that fixes {issue}.", "Do the first frame in Nano Banana, then animate. Stop generating from text.",
        "Shorter prompt. Under 12 words. Trust me.", "Use {tool} for that shot, {tool2} for the wide. Mixing is the secret.", "Lock the seed and change one word at a time.",
        "Voice first, then cut to it. You're doing it backwards.", "Drop 'cinematic' from the prompt, that's what's adding the grade.", "Module 3 covers exactly this."],
      admin: ["This is the standard. Pinning for the week.", "Show this on Thursday's call.", "The {shot} is exactly right. Now do it in 9:16.", "Great — put the prompt in the comments so people can copy it.",
        "Told you the first-frame workflow works 😄", "🔥"],
      author: ["Thanks!", "Prompt's below 👇", "{n} generations, about {dur}", "{tool}, default settings", "ElevenLabs, the 'Adam' voice slowed 5%", "Yeah the last second bugs me too",
        "Appreciate it 🙏", "Will try that, thank you", "Client loved it", "Haha thanks man"]
    }
  };

  /* ---------------- building a feed ---------------- */

  function applyStyle(s, style) {
    var out = s;
    if (style.lower) out = out.toLowerCase().replace(/claude code/g, "claude code").replace(/\bi\b/g, "i");
    if (style.emoji > 0.6 && !/[\u{1F300}-\u{1FAFF}]/u.test(out) && chance(0.5)) out += " " + pick(["🔥", "🙌", "💯", "🚀", "😅", "👀"]);
    return out;
  }

  function buildBody(spec, fill, style) {
    var paras = [];
    paras.push(fill(pick(spec.open)));
    var meat = shuffle(spec.mid).slice(0, style.brief ? 1 : int(1, 3));
    for (var i = 0; i < meat.length; i++) paras.push(fill(meat[i]));
    if (!style.brief && spec.list && spec.list.length && chance(0.3)) {
      var l = pick(spec.list);
      paras.push(l.map(function (x) { return "- " + fill(x); }).join("\n"));
    }
    var c = fill(pick(spec.close));
    if (c) paras.push(c);
    return paras.map(function (p) { return applyStyle(p, style); });
  }

  function makePost(room, people, i) {
    var cat = weighted(room.categories, room.weights);
    var spec = TEXT[room.id][cat];
    var author = pickAuthor(people);
    /* Intros come from newcomers, never regulars. */
    if (cat.indexOf("Introduce") >= 0) author = people[int(31, people.length - 1)];
    var fill = filler(room);
    var ageH = Math.max(0.1, Math.min(24 * 28, expo(60)));
    var scale = room.members / 250 + 0.4;
    var heat = (cat.indexOf("Wins") >= 0 ? 1.8 : cat.indexOf("Show") >= 0 ? 1.4 : cat.indexOf("Introduce") >= 0 ? 0.9 : 1) * (author.admin ? 1.6 : 1);
    var mature = Math.min(1, ageH / 36);
    var likes = Math.round(expo(6 * scale * heat) * (0.3 + mature));
    var comments = Math.round(expo(4 * scale * heat) * (0.3 + mature));
    if (cat.indexOf("Questions") >= 0) { comments = Math.round(comments * 1.5); likes = Math.round(likes * 0.5); }
    var title = applyStyle(fill(pick(spec.titles)), author.style);
    var body = buildBody(spec, fill, author.style);
    var attach = null;
    var pa = room.attach[cat] || 0.12;
    if (chance(pa)) {
      attach = room.id === "avc" && cat.indexOf("Showcase") >= 0 ? "video"
        : room.id === "avc" ? (chance(0.7) ? "video" : "image")
        : chance(0.75) ? "image" : "link";
    }
    var poll = null;
    if (!attach && cat.indexOf("General") >= 0 && chance(0.12)) {
      poll = room.id === "ccm"
        ? pick([["Claude Code", "Codex", "Cursor", "Something else"], ["Read every diff", "Skim it", "Trust and run tests", "Yolo"], ["Under $50/mo", "$50–150", "$150–300", "More, don't ask"]])
        : pick([["Veo", "Kling", "Runway", "Sora"], ["Under 5", "5–10", "10–20", "I stopped counting"], ["Yes, always", "Only if asked", "Never", "Depends on the client"]]);
    }
    var lastC = comments ? Math.max(0.05, ageH * rand() * 0.9) : null;
    return {
      id: "p" + i, cat: cat, author: author, ageH: ageH, likes: likes, comments: comments,
      lastCommentH: lastC, title: title, body: body, attach: attach, poll: poll, pinned: false,
      roomId: room.id
    };
  }

  function makeThread(room, post, people) {
    var C = COMMENTS[room.id];
    var fill = filler(room);
    var out = [];
    var n = Math.min(post.comments, 40);
    var commenters = shuffle(people.filter(function (p) { return p !== post.author; }));
    var t = post.lastCommentH != null ? post.ageH : post.ageH;
    for (var i = 0; i < n; i++) {
      var who = commenters[i % commenters.length];
      var isQ = post.cat.indexOf("Questions") >= 0;
      var text = who.admin ? pick(C.admin) : isQ && chance(0.6) ? pick(C.answer) : chance(0.25) ? pick(C.answer) : pick(C.generic);
      t = Math.max(post.lastCommentH || 0.05, t * (0.55 + rand() * 0.4));
      var c = { who: who, text: applyStyle(fill(text), who.style), ageH: t, likes: Math.round(expo(who.admin ? 4 : 1.2)), replies: [] };
      if (chance(0.35)) {
        c.replies.push({ who: post.author, text: applyStyle(fill(pick(C.author)), post.author.style), ageH: Math.max(0.03, t * 0.7), likes: Math.round(expo(0.8)) });
        if (chance(0.3)) c.replies.push({ who: who, text: pick(["👍", "Thanks!", "Perfect, will try", "Makes sense", "🙏"]), ageH: Math.max(0.02, t * 0.5), likes: 0 });
      }
      out.push(c);
    }
    return out;
  }

  function makeFeed(roomId, seed, count) {
    R = rng(seed);
    var room = ROOMS[roomId];
    var people = makePeople(room);
    var posts = [];
    for (var i = 0; i < count; i++) posts.push(makePost(room, people, i));
    /* Skool's default order: most recent activity first. */
    posts.sort(function (a, b) {
      var ka = Math.min(a.ageH, a.lastCommentH == null ? a.ageH : a.lastCommentH);
      var kb = Math.min(b.ageH, b.lastCommentH == null ? b.ageH : b.lastCommentH);
      return ka - kb;
    });
    /* One or two pinned from the admin, on top like Skool puts them. */
    var pins = shuffle(room.pinned).slice(0, int(1, 2)).map(function (p, k) {
      return { id: "pin" + k, cat: room.categories[0], author: people[0], ageH: int(3, 20) * 24, likes: int(20, 90) * (room.members > 200 ? 1 : 0.4) | 0,
        comments: int(6, 40), lastCommentH: int(2, 40), title: p.title, body: p.body, attach: null, poll: null, pinned: true };
    });
    posts = pins.concat(posts);
    var lb = shuffle(people.slice(1)).slice(0, 10).map(function (p, k) { return { who: p, pts: Math.round(60 * Math.exp(-k * 0.45) + int(0, 6)) }; });
    lb.sort(function (a, b) { return b.pts - a.pts; });
    return { room: room, seed: seed, people: people, posts: posts, online: int(room.online[0], room.online[1]), leaderboard: lb, threads: {} };
  }

  /* ---------------- drawing it ---------------- */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function ago(h) {
    if (h < 1) return Math.max(1, Math.round(h * 60)) + "m ago";
    if (h < 24) return Math.round(h) + "h ago";
    if (h < 24 * 7) return Math.round(h / 24) + "d ago";
    if (h < 24 * 30) return Math.round(h / 24 / 7) + "w ago";
    return Math.round(h / 24 / 30) + "mo ago";
  }
  function kfmt(n) { return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n); }
  function catLabel(c) { return c.replace(/^\S+\s/, ""); }
  function catEmoji(c) { return c.split(" ")[0]; }

  function avatar(p, size, badge) {
    var s = size || 40;
    var inner = p.photo
      ? '<img src="https://i.pravatar.cc/' + (s * 2) + '?img=' + p.photo + '" alt="" loading="lazy" onerror="this.parentNode.classList.add(\'sim-av-fb\');this.remove()">'
      : "";
    return '<span class="sim-av' + (p.photo ? "" : " sim-av-fb") + '" style="--s:' + s + 'px;--tint:' + p.tint + '" data-i="' + esc(p.name.charAt(0)) + '">' +
      inner + (badge === false ? "" : '<b class="sim-lvl">' + p.level + "</b>") + "</span>";
  }

  function thumb(post) {
    if (!post.attach) return "";
    var hue = hashStr(post.title) % 360;
    var bg = "linear-gradient(135deg,hsl(" + hue + " 45% 30%),hsl(" + ((hue + 60) % 360) + " 55% 55%))";
    var room = ROOMS[post.roomId] || ROOMS.avc;
    var media = room.media[hashStr(post.title) % room.media.length];
    var picture = '<img class="sim-media" src="' + media + '" alt="" loading="lazy">';
    if (post.attach === "video") {
      return '<div class="sim-thumb sim-thumb-v" style="background:' + bg + '">' + picture + '<span class="sim-play">▶</span><span class="sim-dur">0:' + String(int(8, 59)).padStart(2, "0") + "</span></div>";
    }
    if (post.attach === "link") {
      var dom = post.linkLabel || pick(["github.com", "docs.anthropic.com", "vercel.app", "supabase.com", "youtube.com"]);
      return '<div class="sim-thumb sim-thumb-l"><span>🔗</span><small>' + esc(dom) + "</small></div>";
    }
    return '<div class="sim-thumb" style="background:' + bg + '">' + picture + '</div>';
  }

  function pollHtml(post, full) {
    if (!post.poll) return "";
    var votes = post.poll.map(function () { return int(3, 60); });
    var total = votes.reduce(function (a, b) { return a + b; }, 0);
    var top = Math.max.apply(null, votes);
    var rows = post.poll.map(function (o, i) {
      var pc = Math.round(votes[i] / total * 100);
      return '<div class="sim-poll-row' + (votes[i] === top ? " top" : "") + '"><span class="sim-poll-bar" style="width:' + pc + '%"></span>' +
        "<span>" + esc(o) + "</span><b>" + pc + "%</b></div>";
    }).join("");
    return '<div class="sim-poll">' + rows + '<div class="sim-poll-n">' + total + " votes</div></div>";
  }

  function card(post, feed) {
    var a = post.author;
    /* Skool's preview is the text run together; a list reads as one line. */
    var body = post.body.map(function (p) { return p.replace(/^- /, "").replace(/\n- /g, " · "); }).join(" ");
    var stack = "";
    if (post.comments) {
      var cs = shuffle(feed.people).slice(0, Math.min(3, post.comments));
      stack = '<span class="sim-stack">' + cs.map(function (p) { return avatar(p, 22, false); }).join("") + "</span>" +
        '<span class="sim-newc">New comment ' + ago(post.lastCommentH) + "</span>";
    }
    return '<article class="sim-card" data-post="' + post.id + '">' +
      (post.pinned ? '<div class="sim-pin">📌 Pinned</div>' : "") +
      '<div class="sim-head">' + avatar(a, 40) +
        '<div><div class="sim-name">' + esc(a.name) + (a.admin ? ' <span class="sim-adm">Admin</span>' : "") + "</div>" +
        '<div class="sim-meta">' + ago(post.ageH) + ' <span>•</span> ' + esc(catLabel(post.cat)) + "</div></div></div>" +
      '<div class="sim-body' + (post.attach ? " has-thumb" : "") + '"><div>' +
        '<h3 class="sim-title">' + esc(post.title) + "</h3>" +
        '<p class="sim-text">' + esc(body) + "</p>" +
        pollHtml(post) +
      "</div>" + thumb(post) + "</div>" +
      '<div class="sim-foot"><span class="sim-act"><i>👍</i>' + post.likes + '</span><span class="sim-act"><i>💬</i>' + post.comments + "</span>" +
        '<span class="sim-sp"></span>' + stack + "</div>" +
    "</article>";
  }

  function sidebar(feed) {
    var r = feed.room;
    var lb = feed.leaderboard.slice(0, 5).map(function (row, i) {
      return '<div class="sim-lb-row"><b class="sim-lb-n">' + (i + 1) + "</b>" + avatar(row.who, 28, false) +
        '<span class="sim-lb-name">' + esc(row.who.name) + '</span><span class="sim-lb-pts">+' + row.pts + "</span></div>";
    }).join("");
    return '<aside class="sim-side">' +
      '<div class="sim-room"><div class="sim-cover" style="background:' + r.cover + '"><img src="' + r.coverImage + '" alt="" loading="lazy"><span></span><b>' + esc(r.name) + "</b></div>" +
        '<div class="sim-room-b"><div class="sim-room-name">' + esc(r.name) + "</div>" +
        '<div class="sim-room-url">skool.com/' + esc(r.handle) + "</div>" +
        '<p class="sim-room-about">' + esc(r.about) + "</p>" +
        '<div class="sim-stats"><div><b>' + kfmt(r.members) + "</b><span>Members</span></div><div><b>" + feed.online + "</b><span>Online</span></div><div><b>" + r.admins + "</b><span>Admins</span></div></div>" +
        '<button class="sim-btn-y">INVITE PEOPLE</button></div></div>' +
      '<div class="sim-lb"><div class="sim-lb-h">Leaderboard <span>(30-day)</span></div>' + lb +
        '<a class="sim-lb-all">See all leaderboards</a></div>' +
      '<div class="sim-powered">powered by <b>skool</b></div>' +
    "</aside>";
  }

  function frame(feed, ui) {
    var r = feed.room;
    var cats = ['<button class="sim-pill' + (ui.cat ? "" : " on") + '" data-cat="">All</button>'].concat(r.categories.map(function (c) {
      return '<button class="sim-pill' + (ui.cat === c ? " on" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
    })).join("");
    var posts = feed.posts.filter(function (p) { return !ui.cat || p.cat === ui.cat; });
    return '<div class="sim-skool">' +
      '<div class="sim-top"><div class="sim-top-in">' +
        '<span class="sim-logo">skool</span>' +
        '<span class="sim-group"><span class="sim-gmark" style="background:' + r.markBg + '">' + r.mark + "</span>" + esc(r.name) + ' <i>⌄</i></span>' +
        '<span class="sim-sp"></span>' +
        '<span class="sim-search">🔍 <span>Search</span></span>' +
        '<span class="sim-ico">🔔</span><span class="sim-ico">💬</span>' + avatar(feed.people[0], 32, false) +
      "</div></div>" +
      '<div class="sim-tabs"><div class="sim-top-in">' +
        ["Community", "Classroom", "Calendar", "Members", "Map", "Leaderboards", "About"].map(function (t, i) {
          return '<span class="sim-tab' + (i === 0 ? " on" : "") + '">' + t + "</span>";
        }).join("") +
      "</div></div>" +
      '<div class="sim-cols">' +
        '<div class="sim-feed">' +
          '<div class="sim-write">' + avatar(feed.people[0], 36, false) + "<span>Write something</span></div>" +
          '<div class="sim-pills">' + cats + "</div>" +
          (posts.length ? posts.map(function (p) { return card(p, feed); }).join("") : '<div class="sim-empty">No posts in this category yet.</div>') +
        "</div>" +
        sidebar(feed) +
      "</div>" +
    "</div>";
  }

  function modal(post, feed) {
    if (!post) return "";
    var thread = feed.threads[post.id] || (feed.threads[post.id] = makeThread(feed.room, post, feed.people));
    var a = post.author;
    var body = post.body.map(function (p) {
      if (p.indexOf("- ") === 0) return "<ul>" + p.split("\n").map(function (l) { return "<li>" + esc(l.replace(/^- /, "")) + "</li>"; }).join("") + "</ul>";
      return "<p>" + esc(p) + "</p>";
    }).join("");
    function cm(c, reply) {
      return '<div class="sim-c' + (reply ? " sim-c-r" : "") + '">' + avatar(c.who, reply ? 28 : 36) +
        '<div class="sim-c-b"><div class="sim-c-h"><b>' + esc(c.who.name) + "</b>" + (c.who.admin ? ' <span class="sim-adm">Admin</span>' : "") +
        '<span class="sim-c-t">' + ago(c.ageH) + "</span></div>" +
        '<div class="sim-c-x">' + esc(c.text) + "</div>" +
        '<div class="sim-c-a"><span>👍' + (c.likes ? " " + c.likes : "") + "</span><span>Reply</span></div>" +
        (c.replies && c.replies.length ? c.replies.map(function (r) { return cm(r, true); }).join("") : "") +
      "</div></div>";
    }
    return '<div class="sim-ov" data-close="1"><div class="sim-modal">' +
      '<button class="sim-x" data-close="1">✕</button>' +
      '<div class="sim-head">' + avatar(a, 44) +
        '<div><div class="sim-name">' + esc(a.name) + (a.admin ? ' <span class="sim-adm">Admin</span>' : "") + "</div>" +
        '<div class="sim-meta">' + ago(post.ageH) + " <span>•</span> " + esc(catLabel(post.cat)) + "</div></div></div>" +
      '<h2 class="sim-mtitle">' + esc(post.title) + "</h2>" +
      '<div class="sim-mbody">' + body + "</div>" +
      (post.attach === "link" && post.link
        ? '<a class="sim-linkcard" href="' + esc(post.link) + '" target="_blank" rel="noreferrer"><b>' + esc(post.linkTitle || post.link) + "</b><small>" + esc(post.linkLabel || "") + "</small></a>"
        : post.attach ? '<div class="sim-mattach">' + thumb(post) + "</div>" : "") +
      pollHtml(post, true) +
      '<div class="sim-foot sim-mfoot"><span class="sim-act"><i>👍</i>' + post.likes + '</span><span class="sim-act"><i>💬</i>' + post.comments + " comments</span></div>" +
      '<div class="sim-write sim-mwrite">' + avatar(feed.people[0], 36, false) + "<span>Your comment</span></div>" +
      '<div class="sim-thread">' + thread.map(function (c) { return cm(c); }).join("") + "</div>" +
    "</div></div>";
  }

  function controls(feed, ui) {
    return '<div class="sim-ctl">' +
      '<div class="sim-seg">' +
        '<button class="' + (feed.room.id === "ccm" ? "on" : "") + '" data-room="ccm">CCM</button>' +
        '<button class="' + (feed.room.id === "avc" ? "on" : "") + '" data-room="avc">AVC</button></div>' +
      '<label>Posts <select data-count>' + [20, 40, 80, 150].map(function (n) {
        return '<option value="' + n + '"' + (n === ui.count ? " selected" : "") + ">" + n + "</option>";
      }).join("") + "</select></label>" +
      '<label>Seed <input data-seed type="number" value="' + feed.seed + '"></label>' +
      '<button data-new title="Offline: the same sentence pools, a new draw">Shuffle</button>' +
      '<button class="btn btn-primary" data-live' + (ui.busy ? " disabled" : "") + ' title="Reads this week\'s news and the classroom, then writes the feed">' +
        (ui.busy ? "Reading the news\u2026 writing " + ui.count + " posts" : "Generate from this week\'s news") + "</button>" +
      (ui.err ? '<span class="sim-err">' + esc(ui.err) + "</span>" : "") +
      '<span class="sim-sp"></span>' +
      '<button data-present>' + (ui.present ? "Exit presentation" : "Presentation") + "</button>" +
    "</div>" + sources();
  }

  /* What the feed was built from, so a post about a launch can be checked
     against the launch. Only there after Generate; Shuffle has no sources. */
  function sources() {
    if (!feed.news || !feed.news.length) return "";
    return '<details class="sim-src"><summary>Built from ' + feed.news.length + " headlines this week" +
      (feed.builtAt ? " · " + esc(feed.builtAt) : "") + "</summary><ol>" +
      feed.news.map(function (x) {
        return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noreferrer">' + esc(x.title) + "</a> <span>" + esc(x.source) + "</span></li>";
      }).join("") + "</ol></details>";
  }

  /* ---------------- the live feed ---------------- */

  var API = "/api/content-automation/skool-simulator";
  var BATCH = 14;

  /* One model batch, turned into feed posts. Authors come from the same
     pool as the offline feed, with the habits the model asked for; the
     thread is the model's, not the pools'. */
  function fromLive(room, people, items, news) {
    var out = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i] || {};
      var author = pickAuthor(people.slice(1));
      var st = it.style || {};
      author = { name: author.name, level: author.level, admin: false, tint: author.tint, photo: author.photo,
        style: { lower: !!st.lower, emoji: st.emoji ? 0.8 : 0, brief: false }, weight: 1 };
      var cat = room.categories.indexOf(it.category) >= 0 ? it.category
        : room.categories.filter(function (c) { return catLabel(c).toLowerCase() === String(it.category || "").toLowerCase().replace(/^\S+\s/, ""); })[0]
        || room.categories[0];
      var ageH = Math.max(0.1, Math.min(24 * 7, expo(30)));
      var body = Array.isArray(it.body) ? it.body.map(String).filter(Boolean) : [String(it.body || "")];
      var comments = Array.isArray(it.comments) ? it.comments : [];
      var item = it.news != null && news[it.news - 1] ? news[it.news - 1] : null;
      var attach = it.attachment === "image" || it.attachment === "video" || it.attachment === "link" ? it.attachment : (item && chance(0.5) ? "link" : null);
      var scale = room.members / 250 + 0.4;
      var likes = Math.round(expo(5 * scale) * (0.4 + Math.min(1, ageH / 24))) + (comments.length ? 1 : 0);
      var post = {
        id: "live" + i + "_" + Math.floor(rand() * 1e6), cat: cat, author: author, ageH: ageH, likes: likes,
        comments: comments.reduce(function (n, c) { return n + 1 + (c && c.reply ? 1 : 0); }, 0),
        lastCommentH: comments.length ? Math.max(0.05, ageH * (0.2 + rand() * 0.6)) : null,
        title: String(it.title || "").slice(0, 160), body: body, attach: attach, roomId: room.id,
        link: item ? item.url : null, linkLabel: item ? item.source : null, linkTitle: item ? item.title : null,
        poll: Array.isArray(it.poll) && it.poll.length >= 2 ? it.poll.map(String).slice(0, 5) : null,
        pinned: false, kind: it.kind || "general", live: true
      };
      /* The thread, built now from what the model wrote. */
      var others = shuffle(people.filter(function (p) { return !p.admin && p.name !== author.name; }));
      var t = ageH;
      var thread = [];
      for (var k = 0; k < comments.length; k++) {
        var c = comments[k] || {};
        var who = c.admin ? people[0] : others[k % others.length];
        t = Math.max(post.lastCommentH || 0.05, t * (0.5 + rand() * 0.4));
        var row = { who: who, text: String(c.text || ""), ageH: t, likes: Math.round(expo(who.admin ? 4 : 1.2)), replies: [] };
        if (c.reply) row.replies.push({ who: author, text: String(c.reply), ageH: Math.max(0.03, t * 0.7), likes: Math.round(expo(0.8)) });
        thread.push(row);
      }
      post.thread = thread;
      out.push(post);
    }
    return out;
  }

  function generateLive() {
    if (ui.busy) return;
    ui.busy = true; ui.err = ""; draw();
    var want = ui.count;
    var calls = Math.min(3, Math.ceil(want / BATCH));
    var reqs = [];
    for (var i = 0; i < calls; i++) {
      reqs.push(fetch(API, {
        method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ room: ui.room, count: Math.min(BATCH, want - i * BATCH) })
      }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || ("HTTP " + r.status)); return j; }); }));
    }
    Promise.all(reqs).then(function (batches) {
      var news = batches[0].news || [];
      var items = [];
      batches.forEach(function (b) { items = items.concat(b.posts || []); });
      if (!items.length) throw new Error("The model wrote nothing. Try again.");
      /* A fresh room around the model's posts: new people, new leaderboard,
         the pins on top like Skool keeps them. */
      ui.seed = newSeed();
      var base = makeFeed(ui.room, ui.seed, 0);
      var live = fromLive(base.room, base.people, items, news);
      live.sort(function (a, b) {
        var ka = Math.min(a.ageH, a.lastCommentH == null ? a.ageH : a.lastCommentH);
        var kb = Math.min(b.ageH, b.lastCommentH == null ? b.ageH : b.lastCommentH);
        return ka - kb;
      });
      base.posts = base.posts.filter(function (p) { return p.pinned; }).concat(live);
      live.forEach(function (p) { base.threads[p.id] = p.thread; });
      base.news = news;
      base.builtAt = new Date().toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" });
      feed = base; ui.cat = ""; ui.open = null;
    }).catch(function (e) {
      ui.err = e && e.message ? e.message : "Could not generate.";
    }).then(function () { ui.busy = false; draw(); });
  }

  /* ---------------- state and wiring ---------------- */

  var ui = { room: "ccm", seed: 0, count: 40, cat: "", open: null, present: false, busy: false, err: "" };
  var feed = null;
  var root = null;

  function newSeed() { return Math.floor(Math.random() * 900000) + 100000; }

  function build() {
    feed = makeFeed(ui.room, ui.seed, ui.count);
    ui.cat = ""; ui.open = null;
  }

  function draw() {
    if (!root) return;
    root.innerHTML = controls(feed, ui) + frame(feed, ui) + modal(ui.open, feed);
    document.documentElement.classList.toggle("sim-present", ui.present);
  }

  function onClick(e) {
    var t = e.target;
    var room = t.closest("[data-room]");
    if (room) { ui.room = room.getAttribute("data-room"); build(); draw(); return; }
    if (t.closest("[data-new]")) { ui.seed = newSeed(); build(); draw(); return; }
    if (t.closest("[data-live]")) { generateLive(); return; }
    if (t.closest(".sim-src")) return;
    if (t.closest("[data-present]")) { ui.present = !ui.present; draw(); return; }
    var pill = t.closest("[data-cat]");
    if (pill) { ui.cat = pill.getAttribute("data-cat"); draw(); return; }
    if (t.closest("[data-close]") && t.closest("[data-close]") === t) { ui.open = null; draw(); return; }
    if (t.closest(".sim-modal")) return;
    var c = t.closest("[data-post]");
    if (c) {
      var id = c.getAttribute("data-post");
      ui.open = feed.posts.filter(function (p) { return p.id === id; })[0] || null;
      draw();
    }
  }
  function onChange(e) {
    var t = e.target;
    if (t.hasAttribute("data-count")) { ui.count = Number(t.value) || 40; build(); draw(); }
    if (t.hasAttribute("data-seed")) { ui.seed = Number(t.value) || newSeed(); build(); draw(); }
  }
  function onKey(e) {
    if (e.key !== "Escape") return;
    if (ui.open) { ui.open = null; draw(); }
    else if (ui.present) { ui.present = false; draw(); }
  }

  /* app.js hands over a fresh #sim-root on every render; the feed itself
     survives between renders so a re-render is not a new set of posts. */
  function mount(el) {
    if (!el) return;
    if (root) { root.removeEventListener("click", onClick); root.removeEventListener("change", onChange); }
    root = el;
    root.addEventListener("click", onClick);
    root.addEventListener("change", onChange);
    document.removeEventListener("keydown", onKey);
    document.addEventListener("keydown", onKey);
    if (!ui.seed) ui.seed = newSeed();
    if (!feed) build();
    draw();
  }
  function unmount() {
    document.documentElement.classList.remove("sim-present");
    ui.present = false;
  }

  return { mount: mount, unmount: unmount, makeFeed: makeFeed };
})();
