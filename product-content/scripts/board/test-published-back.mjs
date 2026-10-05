/* Opening a day from the month grid has to have a way back out that is not
   "work out that Month happens to be where you were". Drives the real
   handlers out of app.js — the action names and the ui slots they touch are
   the thing under test, so a rename that forgets one fails here. */
import { readFileSync } from "fs";
const src = readFileSync(process.env.APPJS || "public/content-automation/app.js", "utf8");

const start = src.indexOf("  /* ---------------- published ----------------");
const tail = src.indexOf("\n  }\n", src.indexOf("pubStatsPane(scope);"));
const block = src.slice(start, tail + 4);

/* the four handlers, lifted verbatim */
function handler(act) {
  const i = src.indexOf(`act === "${act}"`);
  if (i < 0) throw new Error("no handler for " + act);
  const open = src.indexOf("{", i);
  let depth = 0, j = open;
  for (; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (!depth) break; }
  }
  return src.slice(open + 1, j);
}
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const fmtWhen = (a) => String(a);

const published = [];
for (let d = 0; d < 40; d++) {
  const at = new Date("2026-09-19T10:00:00Z");
  at.setDate(at.getDate() - d);
  published.push({ id: "p" + d, at: at.toISOString(), platform: "youtube",
    account: "@yarmalikvibe", title: "Post " + d, url: "https://x.test/" + d });
}
const state = { published };
const ui = { pubView: "month", pubAt: "2026-09-19", pubPlat: "all", pubRange: "30d", pubBack: null };

const api = new Function("state", "ui", "esc", "fmtWhen", `
${block}
  var rendered = 0;
  function render() { rendered++; }
  function press(act, v) {
    var btn = { getAttribute: function () { return v; } };
    ${["pub-day", "pub-back", "pub-view", "pub-step"].map((a) =>
      `if (act === ${JSON.stringify(a)}) { ${handler(a)} return; }`).join("\n    ")}
    throw new Error("unknown act " + act);
  }
  return { press: press, pane: publishedPane };
`)(state, ui, esc, fmtWhen);

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  ok   " : "  FAIL ") + name + (ok ? "" : `\n         got ${JSON.stringify(got)} want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const hasBack = () => /data-act="pub-back"/.test(api.pane());
const backLabel = () => (api.pane().match(/data-act="pub-back">([^<]*)</) || [])[1];

console.log("\nopening a day from the month");
check("the month offers no way back", hasBack(), false);
api.press("pub-day", "2026-09-12");
check("clicking a day opens it", [ui.pubView, ui.pubAt], ["day", "2026-09-12"]);
check("and now there is a way back", hasBack(), true);
check("named after where it goes", backLabel(), "← September");

console.log("\ntaking it");
api.press("pub-back");
check("back returns to the month", ui.pubView, "month");
check("and to the month it came from", ui.pubAt, "2026-09-19");
check("and is then spent", hasBack(), false);

console.log("\nstepping around inside the day keeps the way out");
api.press("pub-day", "2026-09-12");
api.press("pub-step", "1");
check("a step moves the day", ui.pubAt, "2026-09-13");
check("the way back survives it", hasBack(), true);
api.press("pub-back");
check("and still lands on the month", [ui.pubView, ui.pubAt], ["month", "2026-09-19"]);

console.log("\nchoosing a view by hand is not a trip");
api.press("pub-day", "2026-09-12");
api.press("pub-view", "week");
check("picking Week clears it", ui.pubBack, null);
check("so no back button lingers", hasBack(), false);

console.log("\nit never offers to take you where you already are");
ui.pubView = "month"; ui.pubAt = "2026-09-19"; ui.pubBack = { view: "month", at: "2026-09-19" };
check("back to the view you are on is not offered", hasBack(), false);

console.log("\ncrossing a month still points home");
ui.pubBack = null; ui.pubView = "month"; ui.pubAt = "2026-09-19";
api.press("pub-day", "2026-09-30");
for (let i = 0; i < 5; i++) api.press("pub-step", "1");
check("five days later it is October", ui.pubAt, "2026-10-05");
check("and the way back still says September", backLabel(), "← September");
api.press("pub-back");
check("which is where it lands", [ui.pubView, ui.pubAt], ["month", "2026-09-19"]);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
