// Second pass: re-read every lesson whose body came back empty, waiting for
// the window to be visible first (Chrome does not render an occluded window).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
const [,, group, file] = process.argv;
const TAB = `https://www.skool.com/${group}/classroom`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const js = (code) => { for (let k = 0; k < 4; k++) { try { return execFileSync("osascript", ["scripts/content/skool-export/tab-js.applescript", TAB, code], { encoding: "utf8", maxBuffer: 1 << 24, stdio: ["ignore", "pipe", "pipe"] }).trim(); } catch { execFileSync("sleep", ["1.5"]); } } return ""; };
const nav = (url) => execFileSync("osascript", ["scripts/content/skool-export/tab-nav.applescript", TAB, url], { encoding: "utf8" }).trim();
const EXTRACT = String.raw`(function(){var t=document.body.innerText; var title=TITLE; var idx=[]; var p=0; while((p=t.indexOf('\n'+title,p))>=0){idx.push(p);p++;} var c=idx.filter(function(i){return t.slice(i+1+title.length,i+1+title.length+3)!==' - ';}); var i=c.length?c[c.length-1]:-1; var rest=i<0?'':t.slice(i+1+title.length); var j=rest.lastIndexOf('\n'+title+' - '); if(j>=0) rest=rest.slice(0,j); var m=rest.match(/^\s*(\d+:\d\d(?::\d\d)?)/); var dur=m?m[1]:''; rest=rest.replace(/^\s*\d+:\d\d(?::\d\d)?\s*/,'').replace(/‌/g,'').trim(); return JSON.stringify({body:rest, video: dur || (document.querySelector('video')?'video':''), vis: document.visibilityState});})()`;
const data = JSON.parse(fs.readFileSync(file, "utf8"));
let todo = 0, filled = 0, stillEmpty = 0, waited = 0;
for (const c of data) for (const l of c.lessons) if (!l.body) todo++;
console.log("to fill:", todo);
for (const c of data) {
  for (const l of c.lessons) {
    if (l.body) continue;
    nav(`${c.url}?md=${l.md}`);
    // wait for visibility, then for the text to settle
    let vis = "hidden", tries = 0;
    while (vis !== "visible" && tries < 600) { vis = js("document.visibilityState"); if (vis !== "visible") { await sleep(1000); waited++; if (waited % 30 === 0) console.log("  window hidden — waiting for it to be uncovered"); } tries++; }
    await sleep(2500);
    let got = {}; let best = { body: "", video: "" };
    for (let k = 0; k < 4; k++) {
      try { got = JSON.parse(js(EXTRACT.replace("TITLE", JSON.stringify(l.title))) || "{}"); } catch { got = {}; }
      if ((got.body || "").length > best.body.length) best = { body: got.body, video: got.video || "" };
      if (best.body) break;
      await sleep(1500);
    }
    if (best.body) { l.body = best.body; if (best.video && best.video !== "video") l.video = best.video; filled++; }
    else { stillEmpty++; if (best.video && best.video !== "video") l.video = best.video; }
    console.log(`  ${c.title} / ${l.title.slice(0, 40)} — ${best.body.length} chars${l.video ? " +" + l.video : ""}`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }
}
console.log(`filled ${filled}, still empty ${stillEmpty} (video-only lessons have no text)`);
