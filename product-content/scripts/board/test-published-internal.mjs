/* The team channel is unlisted cuts for the team, not publishing. It must be
   out of the record and out of every number — and the main channel, which
   Postiz files under the bare name "Yar Malik", must survive that exactly. */
import { readFileSync } from "fs";
const src = readFileSync(process.env.APPJS || "public/content-automation/app.js", "utf8");
const start = src.indexOf("  /* ---------------- published ----------------");
const endMark = "pubStatsPane(scope);";
const tail = src.indexOf("\n  }\n", src.indexOf(endMark));
const block = src.slice(start, tail + 4);

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const fmtWhen = (at) => String(at);

/* the accounts the live board actually holds, in the live proportions */
const LIVE = [
  ["facebook", "AI Video Club", 2],
  ["facebook", "Claude Code & Codex Mastery", 27],
  ["instagram-standalone", "Yar Malik", 6],
  ["instagram-standalone", "Yar Malik | Claude Codex Mastery", 7],
  ["tiktok-business", "Yar Malik | AI", 2],
  ["x", "Yar Malik", 3],
  ["youtube", "@yarmalikvibe", 49],
  ["youtube", "Team Yar Malik", 11],
  ["youtube", "Yar Malik", 2]
];
const published = [];
let n = 0;
for (const [platform, account, count] of LIVE) {
  for (let i = 0; i < count; i++) {
    const d = new Date("2026-09-19T10:00:00Z");
    d.setDate(d.getDate() - (n % 28));
    published.push({ id: "p" + n++, at: d.toISOString(), platform, account,
      title: account + " " + i, url: "https://x.test/" + n });
  }
}
const state = { published };
const ui = { pubView: "month", pubAt: "", pubPlat: "all", pubRange: "30d" };
const api = new Function("state", "ui", "esc", "fmtWhen",
  block + "\n return { pane: publishedPane, pubAll: pubAll, pubPublic: pubPublic, pubInternal: pubInternal, isInternal: isInternal, INTERNAL_KEY: INTERNAL_KEY };")(state, ui, esc, fmtWhen);

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  ok   " : "  FAIL ") + name + (ok ? "" : `\n         got ${JSON.stringify(got)} want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

console.log("\nthe split");
check("the board holds everything", api.pubAll().length, 109);
check("11 are internal", api.pubInternal().length, 11);
check("98 went out", api.pubPublic().length, 98);
check('"Team Yar Malik" is internal', api.isInternal({ account: "Team Yar Malik" }), true);
check('"@teamyarmalik" is internal too', api.isInternal({ account: "@teamyarmalik" }), true);
check("case and padding do not matter", api.isInternal({ account: "  team yar malik " }), true);

console.log("\nthe main channel is not caught by it");
check('"Yar Malik" is NOT internal', api.isInternal({ account: "Yar Malik" }), false);
check('"@yarmalikvibe" is NOT internal', api.isInternal({ account: "@yarmalikvibe" }), false);
check('"Yar Malik | AI" is NOT internal', api.isInternal({ account: "Yar Malik | AI" }), false);
check("a row with no account is NOT internal", api.isInternal({}), false);

console.log("\nwhat the page says");
ui.pubPlat = "all";
let html = api.pane();
check("Everything counts 98, not 109", /Everything<i>98<\/i>/.test(html), true);
check("109 appears nowhere as a total", /Everything<i>109<\/i>/.test(html), false);
check("the Internal chip offers the other 11", /Internal<i>11<\/i>/.test(html), true);
check("no internal post is drawn", html.includes("Team Yar Malik 0"), false);
check("the analytics say unlisted and the team channel are out", html.includes("Unlisted uploads and the team channel are not in here"), true);

const yt = (html.match(/YouTube<i>(\d+)<\/i>/) || [])[1];
check("YouTube counts 51 — 49 vibe + 2 main, no team", yt, "51");

console.log("\nthe Internal chip, when somebody asks for it");
ui.pubPlat = api.INTERNAL_KEY;
html = api.pane();
check("it says what these are", html.includes("not published"), true);
check("and the numbers follow it", html.includes("Internal uploads only"), true);
ui.pubPlat = "all";

console.log("\nan unlisted upload on the MAIN channel is not live either");
/* 2026-09-24: "Meet the Cast" went up unlisted on the main channel as a test.
   Postiz calls that PUBLISHED; Yar: "only when things go and are live". */
const today = new Date().toISOString();
state.published.push({ id: "unl", at: today, platform: "youtube", account: "Yar Malik",
  title: "Meet the Cast test upload", url: "https://x.test/unl", unlisted: true });
check("an unlisted row is internal", api.isInternal({ account: "Yar Malik", unlisted: true }), true);
check("Everything still counts 98", api.pubPublic().length, 98);
check("Internal now has 12", api.pubInternal().length, 12);
ui.pubPlat = "all"; ui.pubView = "month"; ui.pubAt = today.slice(0, 10);
html = api.pane();
check("it is not drawn on the calendar", html.includes("Meet the Cast test upload"), false);
check("YouTube still counts 51", (html.match(/YouTube<i>(\d+)<\/i>/) || [])[1], "51");
ui.pubPlat = api.INTERNAL_KEY;
check("the Internal chip shows it", api.pane().includes("Meet the Cast test upload"), true);
ui.pubPlat = "all"; ui.pubAt = "";

console.log("\nnothing else broke");
for (const range of ["30d", "90d", "12m", "all"]) {
  for (const view of ["month", "week", "day"]) {
    ui.pubRange = range; ui.pubView = view;
    const h = api.pane();
    check(`${range}/${view} renders cleanly`, /undefined|NaN|\[object/.test(h), false);
  }
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
