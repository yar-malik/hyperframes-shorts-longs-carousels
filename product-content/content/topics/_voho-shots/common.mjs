// What the two Voho topics' decks share: the screenshots, Voho's green in
// place of the house orange, and the pieces of layout both use.
//
// Every screenshot here is a crop of the real demo recordings in
// voho-platform/tmp/demo-video (22 Sep 2026): the sign-up walkthrough and the
// console tour. Nothing is a mockup, and the numbers quoted come off the same
// screens: Test audio $0.07/min, the call RESOLVED in 50s for $0.06, Starter
// at $0.05 per 1K characters (Sada; Nabra $0.02) with no seats and no
// minimums, and "Showing 21 of 21 voices".

export const shot = (name) => new URL(`./${name}.png`, import.meta.url).href;

export const window = {
  ig: ["voho.console", "yar malik · 2026"],
  li: ["ai-call-centre.md", "yar malik · 2026"],
};

export const css = `
:root { --accent:#1E8A55; }
.cv-badge { position:absolute; left:0; right:0; text-align:center; }
.cv-hook { position:absolute; left:64px; right:64px; text-align:center; }
.cv-sub { position:absolute; left:64px; right:64px; text-align:center; font-size:32px; color:var(--soft); font-weight:700; }
.hd { position:absolute; left:72px; right:72px; top:70px; }
.hd .label { color:var(--accent); margin-bottom:18px; }
.hd .body { margin-top:22px; max-width:900px; }
.shot { position:absolute; display:block; border-radius:18px; outline:1.5px solid #1F1D1A; box-shadow:0 6px 18px rgba(0,0,0,.25); background:#fff; }
.big { font-size:250px; font-weight:800; letter-spacing:-.06em; line-height:.9; color:var(--accent); }
.stat { flex:1; padding:30px 20px 26px; text-align:center; }
.stat b { display:block; font-size:64px; font-weight:800; letter-spacing:-.04em; }
.stat span { display:block; margin-top:6px; font-size:22px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--soft); }
.lst { list-style:none; }
.lst li { display:flex; gap:22px; align-items:flex-start; padding:24px 0; border-bottom:1.5px solid #E7E1D5; font-size:32px; line-height:1.3; color:var(--body); }
.lst li:last-child { border-bottom:none; }
.lst li > b:first-child { flex:none; width:50px; height:50px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:28px; }
.lst li .x { background:#FBE4E0; } .lst li .tick { background:#DDF1E4; } .lst li .num { background:#DDF1E4; color:var(--accent); font-weight:800; }
.lst li strong { color:var(--ink); font-weight:700; }
.bubble { padding:16px 22px; border-radius:18px; font-size:26px; line-height:1.35; max-width:620px; }
.bubble small { display:block; font-size:16px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; margin-bottom:4px; }
.bubble.ai { background:#FFFFFF; box-shadow:var(--lift); color:var(--ink); }
.bubble.ai small { color:var(--accent); }
.bubble.you { background:#E4F2EA; color:var(--ink); margin-left:auto; }
.bubble.you small { color:#5B6B61; }
.chip2 { display:inline-block; padding:12px 22px; border-radius:999px; background:#fff; box-shadow:var(--lift); font-size:26px; font-weight:800; color:var(--ink); }
.cta { position:absolute; left:0; right:0; text-align:center; }
.kw { display:inline-block; padding:22px 52px; border-radius:999px; background:#fff; box-shadow:var(--lift); font-size:64px; font-weight:800; letter-spacing:-.02em; }
.divider { width:60px; height:4px; background:var(--ink); border-radius:2px; margin:34px auto; }
.quote { position:absolute; left:64px; right:64px; padding:34px 40px; background:#fff; border-radius:28px; box-shadow:var(--lift); }
.quote .qh { display:flex; align-items:center; gap:14px; font-size:24px; font-weight:700; color:var(--soft); }
.quote .qh b { color:var(--ink); font-size:28px; font-weight:800; }
.quote .res { padding:4px 12px; border-radius:8px; background:#DDF1E4; color:var(--green); font-weight:800; font-size:18px; letter-spacing:.1em; text-transform:uppercase; }
.quote p { margin-top:18px; font-size:34px; line-height:1.35; color:var(--ink); }
`;

/* The CTA slide, one shape for both. */
export const ctaSlide = ({ yar }, keyword, what, follow = "follow for more.") => `
  ${yar({ h: 500, style: "left:50%; top:40px; transform:translateX(-50%)" })}
  <div class="cta" style="top:560px">
    <div class="h1">${follow}</div>
    <div class="divider"></div>
    <div style="font-size:32px; color:var(--soft); font-weight:700; margin-bottom:26px">comment</div>
    <div class="kw">“${keyword}”</div>
    <div style="font-size:32px; color:var(--soft); font-weight:700; margin-top:30px">${what}</div>
    <div style="font-size:28px; font-weight:800; margin-top:40px">@yarmalikhere</div>
  </div>`;
