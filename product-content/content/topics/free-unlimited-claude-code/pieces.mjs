// Topic: "Free unlimited Claude Code plus 600+ model swaps, one key"
// Board video 134, reference https://www.youtube.com/watch?v=PSNdJuaPWi8
//
// Every number here is off the project's own README, read 23 Sep 2026:
// github.com/tashfeenahmed/freellmapi — 28.3k stars, MIT, "7.4 billion
// tokens per month. 34 free LLM providers. 635 free model endpoints",
// 474 model families; install with the curl line; `npx freellmapi
// setup-claude --url http://localhost:3001 --api-key <unified-key>`;
// failover with cooldowns and key rotation; a conversation stays on one
// model for 30 minutes; "an optional compact handoff note keeps the thread
// coherent"; and its own caveats — no frontier models, variable latency, no
// SLA, weaker late in the day as top models hit daily caps, resets at UTC
// midnight, "for personal experimentation and learning, not production".
// Nothing below claims more than that.

export const window = {
  ig: ["freellmapi.workspace", "yar malik · 2026"],
  li: ["free-tier-routing.md", "yar malik · 2026"],
};

export const short = { url: "https://youtu.be/qI3QULp5naM", id: "qI3QULp5naM" };

export const css = `
.cv-badge { position:absolute; left:0; right:0; top:752px; text-align:center; }
.cv-hook { position:absolute; left:64px; right:64px; top:818px; text-align:center; }
.cv-sub { position:absolute; left:64px; right:64px; top:1000px; text-align:center; font-size:32px; color:var(--soft); font-weight:700; }
.hd { position:absolute; left:72px; right:72px; top:70px; }
.hd .label { color:var(--accent); margin-bottom:18px; }
.hd .body { margin-top:22px; max-width:900px; }
.big { font-size:300px; font-weight:800; letter-spacing:-.06em; line-height:.9; color:var(--accent); }
.stat { flex:1; padding:34px 20px 30px; text-align:center; }
.stat b { display:block; font-size:72px; font-weight:800; letter-spacing:-.04em; }
.stat span { display:block; margin-top:6px; font-size:24px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--soft); }
.row { display:flex; align-items:center; gap:22px; padding:17px 30px; border-bottom:1.5px solid #EFEAE0; font-size:30px; font-weight:700; }
.row:last-child { border-bottom:none; }
.row .dot { width:44px; height:44px; border-radius:12px; flex:none; }
.row .st { margin-left:auto; font-size:24px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; }
.gauge { height:30px; border-radius:15px; background:#EFE8DC; overflow:hidden; }
.gauge i { display:block; height:100%; border-radius:15px; }
.mdl { width:380px; padding:36px 34px; }
.mdl .nm { font-size:30px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; margin-bottom:22px; }
.mdl .st { margin-top:18px; font-size:24px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
.note { position:absolute; width:420px; padding:28px 30px; background:#FFF7D6; border-radius:6px; box-shadow:var(--lift); transform:rotate(-4deg); font:400 25px/1.45 'JetBrains Mono', monospace; color:#3A352D; }
.note b { display:block; font-family:Inter, sans-serif; font-size:20px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#8A6D12; margin-bottom:10px; }
.lst { list-style:none; }
.lst li { display:flex; gap:22px; align-items:flex-start; padding:34px 0; border-bottom:1.5px solid #E7E1D5; font-size:34px; line-height:1.3; color:var(--body); }
.lst li:last-child { border-bottom:none; }
.lst li > b:first-child { flex:none; width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:30px; }
.lst li .x { background:#FBE4E0; } .lst li .tick { background:#DDF1E4; } .lst li .num { background:#FBE3D8; color:var(--accent); font-weight:800; }
.lst li strong { color:var(--ink); font-weight:700; }
.cta { position:absolute; left:0; right:0; text-align:center; }
.kw { display:inline-block; padding:22px 52px; border-radius:999px; background:#fff; box-shadow:var(--lift); font-size:64px; font-weight:800; letter-spacing:-.02em; }
.divider { width:60px; height:4px; background:var(--ink); border-radius:2px; margin:34px auto; }
.cols { position:absolute; left:64px; right:64px; display:flex; gap:28px; }
.cols .card { flex:1; padding:34px 34px 20px; }
.cols .card h3 { font-size:30px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; margin-bottom:6px; }
.cols .card .lst li { font-size:28px; padding:18px 0; gap:16px; }
.cols .card .lst li > b:first-child { width:40px; height:40px; font-size:22px; border-radius:10px; }
.receipt { position:absolute; left:50%; width:620px; margin-left:-310px; padding:44px 50px 50px; }
.receipt .ln { display:flex; justify-content:space-between; font:400 28px/1.9 'JetBrains Mono', monospace; color:var(--body); border-bottom:2px dashed #E4DDD0; }
.receipt .tot { display:flex; justify-content:space-between; align-items:baseline; margin-top:22px; }
.receipt .tot span { font-size:26px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }
.receipt .tot b { font-size:120px; font-weight:800; letter-spacing:-.05em; color:var(--green); line-height:1; }
`;

const F = [
  ["Groq/", "#818CF8", "#6366F1"], ["Gemini/", "#F5A623", "#CC8A10"], ["OpenRouter/", "#F43F5E", "#D1293F"],
  ["Mistral/", "#FF8F6B", "#D96E4A"], ["Cerebras/", "#5CC93E", "#44A82B"], ["NVIDIA/", "#38C9BE", "#2AA89E"],
];

const term = (title, lines) =>
  `<div class="term"><div class="tb"><i></i><i></i><i></i><b>${title}</b></div><div class="tx">${lines}</div></div>`;

/* ─────────────────────────── Instagram ─────────────────────────── */
export const ig = [
  // 1 — cover: Yar in the middle, the providers around him
  ({ yar, folder }) => `
    ${folder(...F[0], 96, 70)} ${folder(...F[1], 784, 50)} ${folder(...F[2], 60, 380)}
    ${folder(...F[3], 820, 360)}
    ${yar({ h: 600, style: "left:50%; top:120px; transform:translateX(-50%)" })}
    <div class="cv-badge"><span class="pill">Open source · 28.3k ★ on GitHub</span></div>
    <div class="cv-hook h1">Claude Code on 635<br>free AI models</div>
    <div class="cv-sub">One key. 7.4 billion tokens a month.</div>`,

  // 2 — the problem
  ({ fig }) => `
    <div class="hd"><div class="h2">You're mid-build and<br>Claude cuts you off.</div>
      <div class="body">The limit doesn't care that you were one prompt away from done.</div></div>
    <div style="position:absolute; left:64px; right:64px; top:420px">${term("claude — ~/shop", `
      <div><span class="p">&gt;</span> refactor the checkout flow</div>
      <div class="c">⎿ Reading 4 files…</div>
      <div class="c">⎿ Updating cart.ts, pay.ts…</div>
      <div style="margin-top:14px" class="bad">✕ Usage limit reached · resets 4pm</div>
      <div class="c" style="margin-top:14px">&gt; _</div>`)}</div>
    <div style="position:absolute; right:84px; top:900px; width:150px; height:220px">${fig({ w: 150, k: 4, mouth: "o", style: "left:0" })}</div>`,

  // 3 — the number (interrupt)
  () => `
    <div style="position:absolute; left:0; right:0; top:120px; text-align:center">
      <div class="label" style="color:var(--soft)">free tokens, every month</div>
      <div class="big" style="margin-top:30px">7.4B</div>
    </div>
    <div style="position:absolute; left:64px; right:64px; top:640px; display:flex; gap:24px">
      <div class="card stat"><b>34</b><span>providers</span></div>
      <div class="card stat"><b>635</b><span>endpoints</span></div>
      <div class="card stat"><b>474</b><span>model families</span></div>
    </div>
    <div class="body" style="position:absolute; left:100px; right:100px; top:900px; text-align:center">All of it behind one endpoint on your own machine.</div>`,

  // 4 — what it is
  ({ folder }) => `
    <div class="hd"><div class="label">What it is</div><div class="h2">One /v1 endpoint in<br>front of all of them.</div></div>
    <div class="card" style="position:absolute; left:250px; width:580px; top:350px; padding:30px 36px; text-align:center">
      <div class="label" style="color:var(--soft)">you</div><div style="font-size:44px; font-weight:800; margin-top:6px">Claude Code</div></div>
    <div style="position:absolute; left:0; right:0; top:500px; text-align:center; font-size:60px; color:var(--accent); font-weight:800">↓</div>
    <div class="card" style="position:absolute; left:250px; width:580px; top:590px; padding:30px 36px; text-align:center; outline:4px solid var(--accent)">
      <div style="font-size:44px; font-weight:800">FreeLLMAPI</div><div class="mono" style="font-size:26px; color:var(--soft); margin-top:6px">localhost:3001/v1</div></div>
    <div style="position:absolute; left:0; right:0; top:750px; text-align:center; font-size:60px; color:var(--accent); font-weight:800">↓</div>
    ${folder(...F[0], 60, 850)} ${folder(...F[1], 300, 850)} ${folder(...F[2], 540, 850)} ${folder(...F[4], 780, 850)}`,

  // 5 — step 1
  ({ fig }) => `
    <div class="hd"><span class="pill">Step 1</span><div class="h2" style="margin-top:26px">Install it. One line.</div>
      <div class="body">It runs on your machine. Nothing hosted, nothing to pay for.</div></div>
    <div style="position:absolute; left:64px; right:64px; top:520px">${term("terminal", `
      <div><span class="p">$</span> curl -fsSL https://freellmapi<br>&nbsp;&nbsp;.co/install.sh | bash</div>
      <div class="c" style="margin-top:18px"># then open the dashboard:</div>
      <div class="ok">http://localhost:3001</div>`)}</div>
    <div style="position:absolute; left:50%; margin-left:-75px; top:850px; width:150px; height:220px">${fig({ w: 150, k: 6, style: "left:0" })}</div>`,

  // 6 — step 2
  () => `
    <div class="hd"><span class="pill">Step 2</span><div class="h2" style="margin-top:26px">Add your free<br>provider keys.</div>
      <div class="body">Each one is a free signup. More keys means more room to route.</div></div>
    <div class="card" style="position:absolute; left:64px; right:64px; top:490px; overflow:hidden">
      <div class="mono" style="padding:20px 30px; background:#FAF8F4; border-bottom:1.5px solid #ECE7DD; font-size:22px; color:var(--soft)">localhost:3001 · providers</div>
      ${[["Groq", "#818CF8"], ["Google Gemini", "#F5A623"], ["OpenRouter", "#F43F5E"], ["Mistral", "#FF8F6B"], ["Cerebras", "#5CC93E"]]
        .map(([n, c]) => `<div class="row"><i class="dot" style="background:${c}"></i>${n}<span class="st tick">✓ key added</span></div>`).join("")}
      <div class="row" style="color:var(--soft)"><i class="dot" style="background:#E4DFD4"></i>+ 29 more providers</div>
    </div>`,

  // 7 — step 3
  ({ fig }) => `
    <div class="hd"><span class="pill">Step 3</span><div class="h2" style="margin-top:26px">Point Claude Code at it.</div>
      <div class="body">Your unified key is on the dashboard. That's the whole setup.</div></div>
    <div style="position:absolute; left:64px; right:64px; top:500px">${term("terminal", `
      <div><span class="p">$</span> npx freellmapi setup-claude \\</div>
      <div>&nbsp;&nbsp;--url http://localhost:3001 \\</div>
      <div>&nbsp;&nbsp;--api-key &lt;your-unified-key&gt;</div>
      <div style="margin-top:18px"><span class="p">$</span> claude</div>`)}</div>
    <div style="position:absolute; right:90px; top:900px; width:140px; height:200px">${fig({ w: 140, k: 2, hat: "phones", style: "left:0" })}</div>`,

  // 8 — the switch (interrupt)
  () => `
    <div class="hd"><div class="h2">Hit a limit?<br>It moves you on.</div></div>
    <div style="position:absolute; left:64px; right:64px; top:330px; display:flex; justify-content:space-between; align-items:center">
      <div class="card mdl"><div class="nm">Model A</div><div class="gauge"><i style="width:100%; background:var(--red)"></i></div><div class="st x">Capped</div></div>
      <div style="font-size:80px; font-weight:800; color:var(--accent)">→</div>
      <div class="card mdl"><div class="nm">Model B</div><div class="gauge"><i style="width:22%; background:var(--green)"></i></div><div class="st tick">Running</div></div>
    </div>
    <div class="note" style="left:300px; top:660px"><b>handoff note</b>refactoring checkout. cart.ts done, pay.ts half done. next: tests.</div>
    <div class="body" style="position:absolute; left:72px; right:72px; top:940px">It fails over to the next ranked model and leaves a short note, so the new one knows where you were.</div>`,

  // 9 — the honest part
  ({ fig }) => `
    <div class="hd"><div class="label">Read this first</div><div class="h2">What it won't do.</div></div>
    <ul class="lst" style="position:absolute; left:72px; right:72px; top:290px">
      <li><b class="x">✕</b><span><strong>No frontier models.</strong> Nobody's giving away the top ones for free.</span></li>
      <li><b class="x">✕</b><span><strong>No speed promises.</strong> It's as fast as whichever free tier answers.</span></li>
      <li><b class="x">✕</b><span><strong>Weaker late in the day,</strong> as the best models hit daily caps. Resets at UTC midnight.</span></li>
      <li><b class="x">✕</b><span><strong>Not for production.</strong> The README says so: it's for experiments.</span></li>
    </ul>
    <div style="position:absolute; right:84px; top:40px; width:130px; height:190px">${fig({ w: 130, k: 5, eyes: "glasses", mouth: "", style: "left:0" })}</div>`,

  // 10 — CTA
  ({ yar }) => `
    ${yar({ h: 500, style: "left:50%; top:40px; transform:translateX(-50%)" })}
    <div class="cta" style="top:560px">
      <div class="h1">follow for more.</div>
      <div class="divider"></div>
      <div style="font-size:32px; color:var(--soft); font-weight:700; margin-bottom:26px">comment</div>
      <div class="kw">“FREE”</div>
      <div style="font-size:32px; color:var(--soft); font-weight:700; margin-top:30px">and I'll send you the repo and the setup.</div>
      <div style="font-size:28px; font-weight:800; margin-top:40px">@yarmalikhere</div>
    </div>`,
];

/* ─────────────────────────── LinkedIn ─────────────────────────── */
export const li = [
  // 1 — cover
  ({ yar }) => `
    <div class="card receipt" style="top:90px">
      <div class="label" style="color:var(--soft); margin-bottom:18px">AI coding spend · prototyping</div>
      <div class="ln"><span>drafts &amp; spikes</span><span>$0.00</span></div>
      <div class="ln"><span>refactors</span><span>$0.00</span></div>
      <div class="ln"><span>throwaway tests</span><span>$0.00</span></div>
      <div class="tot"><span>Total</span><b>$0</b></div>
    </div>
    ${yar({ h: 330, style: "right:40px; top:420px" })}
    <div class="cv-badge" style="top:780px"><span class="pill">Open source · MIT · 28.3k ★</span></div>
    <div class="cv-hook h1" style="top:850px">Prototype on free tokens.<br>Ship on paid ones.</div>`,

  // 2 — the cost nobody budgets
  () => `
    <div class="hd"><div class="label">The problem</div><div class="h2">Exploration is the<br>cost nobody budgets for.</div>
      <div class="body" style="margin-top:40px">Most of what a coding agent writes in the first week of a project gets thrown away. Spikes, dead ends, three versions of the same component.</div>
      <div class="body" style="margin-top:30px">Paying frontier rates for that, or stopping when a usage limit lands mid-task, is a choice. There's now a free one.</div></div>
    <div style="position:absolute; left:72px; right:72px; top:760px; display:flex; gap:24px">
      ${[["Checkout.tsx", "v1", "x", "✕ thrown away"], ["Checkout.tsx", "v2", "x", "✕ thrown away"], ["Checkout.tsx", "v3", "tick", "✓ shipped"]]
        .map(([f, v, c, t]) => `<div class="card" style="flex:1; padding:28px 26px"><div class="mono" style="font-size:24px; color:var(--soft)">${v}</div>
          <div class="mono" style="font-size:26px; font-weight:700; margin-top:6px">${f}</div><div class="${c}" style="margin-top:22px; font-size:24px; letter-spacing:.06em; text-transform:uppercase">${t}</div></div>`).join("")}
    </div>`,

  // 3 — what it is
  ({ folder }) => `
    <div class="hd"><div class="label">The tool</div><div class="h2">FreeLLMAPI</div>
      <div class="body">An open-source router you run locally. It puts every free LLM tier behind one /v1 endpoint that speaks both OpenAI and Anthropic.</div></div>
    <div style="position:absolute; left:64px; right:64px; top:560px; display:flex; gap:22px">
      <div class="card stat"><b style="color:var(--accent)">7.4B</b><span>tokens / month</span></div>
      <div class="card stat"><b>34</b><span>providers</span></div>
      <div class="card stat"><b>635</b><span>endpoints</span></div>
    </div>
    <div class="body" style="position:absolute; left:72px; right:72px; top:800px; color:var(--soft)">github.com/tashfeenahmed/freellmapi</div>
    ${folder(...F[0], 60, 920)} ${folder(...F[1], 300, 920)} ${folder(...F[3], 540, 920)} ${folder(...F[5], 780, 920)}`,

  // 4 — how routing works
  () => `
    <div class="hd"><div class="label">How it routes</div><div class="h2">Four rules, doing<br>the work for you.</div></div>
    <ul class="lst" style="position:absolute; left:72px; right:72px; top:330px">
      <li><b class="num">1</b><span><strong>Ranks.</strong> Every model gets a live score for speed, capability and reliability.</span></li>
      <li><b class="num">2</b><span><strong>Fails over.</strong> A rate limit sends the call to the next model, with cooldowns and key rotation.</span></li>
      <li><b class="num">3</b><span><strong>Stays put.</strong> A conversation keeps one model for 30 minutes, so it isn't hopping every turn.</span></li>
      <li><b class="num">4</b><span><strong>Hands off.</strong> When it does switch, a compact note carries the thread across.</span></li>
    </ul>`,

  // 5 — setup
  () => `
    <div class="hd"><div class="label">Setup</div><div class="h2">Three commands.</div></div>
    <div style="position:absolute; left:64px; right:64px; top:300px">${term("terminal", `
      <div class="c"># 1. install, then open localhost:3001</div>
      <div><span class="p">$</span> curl -fsSL https://freellmapi<br>&nbsp;&nbsp;.co/install.sh | bash</div>
      <div class="c" style="margin-top:18px"># 2. add your free provider keys</div>
      <div class="c">#    in the dashboard</div>
      <div class="c" style="margin-top:18px"># 3. point Claude Code at it</div>
      <div><span class="p">$</span> npx freellmapi setup-claude \\</div>
      <div>&nbsp;&nbsp;--url http://localhost:3001 \\</div>
      <div>&nbsp;&nbsp;--api-key &lt;unified-key&gt;</div>`)}</div>`,

  // 6 — where it fits
  () => `
    <div class="hd"><div class="label">Where it fits</div><div class="h2">Good for this.<br>Not for that.</div></div>
    <div class="cols" style="top:330px">
      <div class="card"><h3 class="tick">Use it for</h3><ul class="lst">
        <li><b class="tick">✓</b><span>Prototypes and spikes</span></li>
        <li><b class="tick">✓</b><span>Side projects</span></li>
        <li><b class="tick">✓</b><span>Learning an agent workflow</span></li>
        <li><b class="tick">✓</b><span>Bulk drafts you'll rewrite</span></li></ul></div>
      <div class="card"><h3 class="x">Not for</h3><ul class="lst">
        <li><b class="x">✕</b><span>Production</span></li>
        <li><b class="x">✕</b><span>Client or private data: calls go to the free providers</span></li>
        <li><b class="x">✕</b><span>Work that needs a frontier model</span></li></ul></div>
    </div>
    <div class="body" style="position:absolute; left:72px; right:72px; top:960px; color:var(--soft); font-size:28px">Its own README: no frontier models, variable latency, no SLA, and weaker late in the day until the caps reset at UTC midnight.</div>`,

  // 7 — the rule
  ({ fig }) => `
    <div style="position:absolute; left:72px; right:72px; top:170px">
      <div class="label" style="color:var(--accent)">The rule worth keeping</div>
      <div style="font-size:96px; font-weight:800; letter-spacing:-.045em; line-height:1.02; margin-top:30px">Free for exploring.<br>Paid for shipping.</div>
      <div class="body" style="margin-top:50px; max-width:820px">Send the throwaway work to free tiers. Keep the paid model for the final pass and for anything a customer will touch.</div>
    </div>
    <div style="position:absolute; right:90px; top:840px; width:150px; height:220px">${fig({ w: 150, k: 1, eyes: "glasses", style: "left:0" })}</div>`,

  // 8 — CTA
  ({ yar }) => `
    ${yar({ h: 500, style: "left:50%; top:40px; transform:translateX(-50%)" })}
    <div class="cta" style="top:560px">
      <div class="h1">Follow Yar Malik</div>
      <div style="font-size:32px; color:var(--soft); font-weight:700; margin-top:18px">for Claude Code setups that actually hold up.</div>
      <div class="divider"></div>
      <div style="font-size:32px; color:var(--soft); font-weight:700; margin-bottom:26px">comment</div>
      <div class="kw">“FREE”</div>
      <div style="font-size:32px; color:var(--soft); font-weight:700; margin-top:30px">and I'll send the repo and the setup.</div>
    </div>`,
];

/* ─────────────────────────── X article header ─────────────────────────── */
export const articleCover = ({ yar }) => `
  <div class="win" style="border-radius:0">
    <div style="position:absolute; left:80px; top:110px; width:820px">
      <span class="pill">Open source · 28.3k ★</span>
      <div class="h1" style="margin-top:28px; font-size:78px">Free Claude Code:<br>what you actually get</div>
      <div style="display:flex; gap:12px; margin-top:34px">
        ${["Groq", "Gemini", "OpenRouter", "Mistral", "Cerebras", "+29"].map((n) => `<span class="pill ghost" style="letter-spacing:.02em; text-transform:none; font-size:22px">${n}</span>`).join("")}
      </div>
    </div>
    ${yar({ h: 560, fade: false, style: "left:1190px; bottom:0; transform:translateX(-50%)" })}
  </div>`;

/* ─────────────────────────── LinkedIn post ─────────────────────────── */
export const liPost = {
  image: ({ yar }) => `
    <div class="win" style="border-radius:0">
      <div style="position:absolute; left:72px; top:80px; right:72px">
        <span class="pill">Open source · MIT · 28.3k ★</span>
        <div style="font-size:92px; font-weight:800; letter-spacing:-.045em; line-height:1.02; margin-top:30px">Claude Code,<br>on <span style="color:var(--accent)">635</span> free<br>AI models.</div>
      </div>
      <div style="position:absolute; left:72px; top:560px; width:520px; display:flex; flex-direction:column; gap:18px">
        <div class="card" style="padding:24px 28px"><b style="display:block; font-size:56px; line-height:1.05; font-weight:800; letter-spacing:-.03em">7.4B</b><div class="label" style="color:var(--soft); margin-top:4px">free tokens a month</div></div>
        <div class="card" style="padding:24px 28px"><b style="display:block; font-size:56px; line-height:1.05; font-weight:800; letter-spacing:-.03em">34</b><div class="label" style="color:var(--soft); margin-top:4px">providers, one endpoint</div></div>
        <div class="card" style="padding:24px 28px"><b style="display:block; font-size:56px; line-height:1.05; font-weight:800; letter-spacing:-.03em; color:var(--green)">Auto</b><div class="label" style="color:var(--soft); margin-top:4px">failover at the limit</div></div>
      </div>
      <div class="note" style="left:72px; top:1130px; width:440px; transform:rotate(-2deg)"><b>the catch</b>no frontier models. free for exploring, paid for shipping.</div>
      ${yar({ h: 700, fade: false, style: "right:-150px; bottom:0" })}
    </div>`,
  text: `You can now run Claude Code on free models, and it's not a hack.

FreeLLMAPI is an open-source router (MIT, 28.3k stars on GitHub). You run it on your own machine, add free keys from providers like Groq, Gemini, OpenRouter and Mistral, and it puts all of them behind one endpoint. That's 34 providers, 635 model endpoints and about 7.4 billion tokens a month.

Claude Code points at it with one command. When a model hits its rate limit, the router moves you to the next one and passes a short handoff note so the work carries on.

The catch, from its own README: no frontier models, variable speed, and it gets weaker late in the day as the best free tiers hit their caps.

So I wouldn't swap a paid plan for it. I'd put it underneath one. Send the throwaway work, the spikes and first drafts, to free tiers, and keep the paid model for whatever ships.

Free for exploring. Paid for shipping.

Comment FREE and I'll send you the setup.`,
};

/* ─────────────────────────── the words ─────────────────────────── */
export const captions = {
  ig: `Claude Code on 635 free AI models, from one key.

FreeLLMAPI is open source (28.3k stars on GitHub). It runs on your machine and puts 34 free providers behind one endpoint: Groq, Gemini, OpenRouter, Mistral, Cerebras, NVIDIA and more. That's about 7.4 billion free tokens a month.

When one model hits its limit, it moves you to the next one and leaves a short handoff note so you don't lose the thread.

Read slide 9 before you switch, though. There are no frontier models in there, and the README itself says it's for experiments, not production.

Comment FREE and I'll send you the repo and the setup.

#claudecode #ai #opensource #coding #aitools`,
  li: `Most of what a coding agent writes in week one gets thrown away.

Spikes, dead ends, three versions of the same component. Paying frontier rates for that is a choice, and so is stopping when a usage limit lands mid-task.

FreeLLMAPI is an open-source router (MIT, 28.3k stars) that you run locally. It puts 34 free LLM providers and 635 endpoints behind a single /v1 endpoint, roughly 7.4B tokens a month, and Claude Code can point straight at it.

It ranks models live, fails over when one is rate-limited, keeps a conversation on one model for 30 minutes, and passes a short handoff note when it has to switch.

The catch is in its own README: no frontier models, variable latency, no SLA, and it gets weaker late in the day until the caps reset. So it doesn't replace your paid model. It replaces the part of your spend that was never worth it.

Free for exploring. Paid for shipping.

Setup is three commands, and they're in the deck. Comment FREE and I'll send you the link.`,
};

export const tweet = `Claude Code can run on free models now.

FreeLLMAPI (28k★, open source) puts 34 free providers and 635 endpoints behind one local /v1 endpoint. ~7.4B tokens a month.

Hit a limit and it fails over, with a handoff note so the context survives.

Catch: no frontier models.`;

export const article = {
  title: "Free Claude Code: what you actually get, and what you don't",
  body: `There's a clip doing the rounds that says you can run Claude Code for free with almost unlimited usage. It's mostly true. The "mostly" is the interesting part, so here's what's actually in the box.

## What it is

The project is FreeLLMAPI (github.com/tashfeenahmed/freellmapi). It's open source under MIT and sitting at about 28,000 stars. It's a router you run on your own machine: every free tier it knows about, behind one /v1 endpoint that speaks both the OpenAI and the Anthropic formats.

The numbers on the README: 34 free providers, 635 model endpoints, 474 model families, and roughly 7.4 billion tokens a month if you connect all of them. Groq, Google's Gemini, OpenRouter, Mistral, Cerebras, NVIDIA and Cohere are all in there.

Because it speaks Anthropic's format, Claude Code doesn't know the difference. It thinks it's talking to Anthropic. It's talking to whatever free model the router picked.

## Setting it up

Three steps, and none of them take long.

1. Install it: curl -fsSL https://freellmapi.co/install.sh | bash. That opens a dashboard on localhost:3001.
2. Add your provider keys in the dashboard. Each provider is its own free signup, so this is the slow bit, and it's worth doing properly. The more keys you add, the more room the router has when one of them runs dry.
3. Point Claude Code at it: npx freellmapi setup-claude --url http://localhost:3001 --api-key <your unified key>. The unified key is on the dashboard.

Then run claude as normal.

## The clever part

Stacking free tiers isn't new. What makes this one usable is how it behaves when a tier runs out, which with free tiers is constantly.

It keeps a live score for every model on speed, capability and reliability, and routes to the best one available. When a call gets rate-limited it fails over to the next, with cooldowns and key rotation so it isn't hammering a provider that just said no. A conversation stays on one model for 30 minutes, so you're not getting a different brain every turn. And when it does have to switch mid-task, it can leave a compact handoff note, so the next model picks up the thread instead of starting cold.

That last bit is what the viral clip means by "it keeps your context." It's a summary, not a transplant. It's good, but it isn't magic.

## What you don't get

This is the bit the clip skips, and the README is refreshingly blunt about it.

- No frontier models. Nobody is giving away their best model on a free tier, so you are not getting Opus-level reasoning here.
- No speed promises. You're as fast as whichever free provider answered.
- It gets weaker as the day goes on. The best free models hit their daily caps and the router falls back to what's left. It resets at UTC midnight.
- No SLA. The author says it's for personal experimentation and learning, not production.

And one the README implies but doesn't shout: your prompts go to the upstream providers you connect. Don't point it at client code or anything private.

## Where it actually fits

I wouldn't replace a paid Claude plan with this. I'd put it underneath one.

Most of what a coding agent writes early in a project gets thrown away: spikes, experiments, three attempts at the same component. That work doesn't need the best model in the world, and it's exactly where usage limits bite. Route that to free tiers. Keep the paid model for the final pass and for anything a customer will touch.

Free for exploring, paid for shipping. That's the whole trick, and it's a good one.`,
};
