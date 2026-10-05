// Reads a Skool classroom through the user's own signed-in Chrome tab
// (AppleScript → execute javascript). One tab, addressed by URL prefix.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
const [,, group, outDir] = process.argv;
const TAB = `https://www.skool.com/${group}/classroom`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const js = (code) => { for (let k = 0; k < 4; k++) { try { return execFileSync("osascript", ["scripts/content/skool-export/tab-js.applescript", TAB, code], { encoding: "utf8", maxBuffer: 1 << 24, stdio: ["ignore", "pipe", "pipe"] }).trim(); } catch (e) { execFileSync("sleep", ["1.5"]); } } return ""; };
const nav = (url) => execFileSync("osascript", ["scripts/content/skool-export/tab-nav.applescript", TAB, url], { encoding: "utf8" }).trim();
async function waitFor(pred, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (js(pred) === "true") return true; } catch {} await sleep(400); } return false; }

// 1. the course list
nav(TAB); await sleep(2500);
await waitFor(`String(document.body.innerText.includes('New course') || document.body.innerText.includes('1-'))`);
const listText = js("document.body.innerText");
// course cards: title lines like "1 · Start Here" followed by a blurb and "0%"
const lines = listText.split("\n").map((s) => s.trim());
const courses = [];
for (let i = 0; i < lines.length; i++) {
  if (/^\d+%$/.test(lines[i + 2] || "") && lines[i] && lines[i + 1]) { courses.push({ title: lines[i], blurb: lines[i + 1] }); i += 2; }
}
console.log("courses:", courses.map((c) => c.title));

const out = [];
for (const c of courses) {
  nav(TAB); await sleep(2000);
  const clicked = js(`(function(){var el=[...document.querySelectorAll('*')].find(e=>e.children.length===0&&e.innerText&&e.innerText.trim()===${JSON.stringify(c.title)}); if(!el) return 'no'; el.click(); return 'yes';})()`);
  if (clicked !== "yes") { console.log("  could not open", c.title); continue; }
  await waitFor(`String(location.href.includes('/classroom/') && location.href.includes('md='))`);
  await sleep(1200);
  const courseUrl = js("location.href").split("?")[0];
  const side = JSON.parse(js(`JSON.stringify((function(){var links=[...document.querySelectorAll('a[href*="?md="]')]; if(!links.length) return []; var box=links[0]; while(box && !links.every(function(a){return box.contains(a);})) box=box.parentElement; var order=[]; box.querySelectorAll('*').forEach(function(e){ if(e.children.length===0&&e.innerText&&e.innerText.trim()){ var a=e.closest('a[href*="?md="]'); order.push({t:e.innerText.trim(), md:a?a.getAttribute('href').split('md=')[1]:null}); } }); return order;})())`));
  // dedupe consecutive repeats, drop the course title / percent
  const items = []; for (const it of side) { if (/^\d+%$/.test(it.t) || it.t === c.title) continue; if (items.length && items[items.length - 1].t === it.t && items[items.length - 1].md === it.md) continue; items.push(it); }
  const lessons = [];
  let module = "";
  for (const it of items) {
    if (!it.md) { module = it.t; continue; }
    nav(`${courseUrl}?md=${it.md}`); await sleep(2500);
    await waitFor(`String(document.body.innerText.includes(${JSON.stringify(it.t + " - ")}))`, 6000);
    const EXTRACT = String.raw`(function(){var t=document.body.innerText; var title=TITLE; var idx=[]; var p=0; while((p=t.indexOf('\n'+title,p))>=0){idx.push(p);p++;} var c=idx.filter(function(i){return t.slice(i+1+title.length,i+1+title.length+3)!==' - ';}); var i=c.length?c[c.length-1]:-1; var rest=i<0?'':t.slice(i+1+title.length); var j=rest.lastIndexOf('\n'+title+' - '); if(j>=0) rest=rest.slice(0,j); var m=rest.match(/^\s*(\d+:\d\d(?::\d\d)?)/); var dur=m?m[1]:''; rest=rest.replace(/^\s*\d+:\d\d(?::\d\d)?\s*/,'').replace(/\u200c/g,'').trim(); return JSON.stringify({body:rest, video: dur || (document.querySelector('video')?'video':'')});})()`;
    let got = { body: "", video: "" }; try { got = JSON.parse(js(EXTRACT.replace("TITLE", JSON.stringify(it.t))) || "{}"); } catch {}
    const body = got.body || "";
    const video = got.video || "";
    lessons.push({ module, title: it.t, md: it.md, body, video });
    console.log(`  ${c.title} / ${module ? module + " / " : ""}${it.t} — ${body.length} chars${video ? " +video" : ""}`);
  }
  out.push({ ...c, url: courseUrl, lessons });
}
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outDir}/classroom.json`, JSON.stringify(out, null, 2));
console.log("wrote", `${outDir}/classroom.json`, out.reduce((n, c) => n + c.lessons.length, 0), "lessons");
