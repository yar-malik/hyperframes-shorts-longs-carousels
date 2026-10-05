/* The stuck save bar, reproduced: a unit that says it is unsaved and builds
   no ops to send. Pulls the real machinery out of app.js so the test cannot
   drift from the code it is testing. */
import { readFileSync } from "fs";
const src = readFileSync(process.env.APPJS || "public/content-automation/app.js", "utf8");
const lines = src.split("\n");
function between(startRe, endRe) {
  const a = lines.findIndex((l) => startRe.test(l));
  if (a < 0) throw new Error("no start " + startRe);
  const b = lines.findIndex((l, i) => i > a && endRe.test(l));
  if (b < 0) throw new Error("no end " + endRe);
  return lines.slice(a, b).join("\n");
}

const slab = between(/^  \/\* ---------------- dirty tracking/, /^  \/\* Adopting what came back/);
const ideas = between(/^  function ideasAll\(\) \{/, /^  function ideaById|^  \/\*/);
const ideasD = between(/^  function ideasDirty\(\) \{/, /^  \}/) + "\n  }";
const taskT = between(/^  function taskTypes\(\) \{/, /^  \}/) + "\n  }";
const taskD = between(/^  function taskTypesDirty\(\) \{/, /^  \}/) + "\n  }";
const timeD = between(/^  \/\* No companion `set` op behind this one/, /^  \/\* The rate is stamped/);
const sheetD = between(/^  function sheetsDirty\(\) \{/, /^  \}/) + "\n  }";

const make = new Function(`
  var state = {}, baseline = {}, ui = { readOnly: false };
  var TASK_SEED = [];
  function cmpKey(u) { return String(u || "").toLowerCase(); }
  function competitorsDirty() { return false; }
  function videoById(id) { return (state.videos || []).filter(function (v) { return v.id === id; })[0] || null; }
  function timeLogs() { return Array.isArray(state.timeLogs) ? state.timeLogs : (state.timeLogs = []); }
${ideas}
${ideasD}
${taskT}
${taskD}
${timeD}
${sheetD}
${slab}
  return {
    set: function (s, b) { state = s; baseline = b; unitsChanged(); },
    dirtyUnits: function () { unitsChanged(); return dirtyUnits(); },
    ops: function (keys) { return opsForUnits(keys); },
    peopleDirty: peopleDirty, timeLogsDirty: timeLogsDirty, ideasDirty: ideasDirty
  };
`);
const api = make();

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  ok   " : "  FAIL ") + name + (ok ? "" : `\n         got ${JSON.stringify(got)} want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
}
/* the invariant the bug broke: nothing may claim to be unsaved unless a
   save would actually carry something for it */
function noStuckUnits(label) {
  const units = api.dirtyUnits();
  const stuck = units.filter((k) => api.ops([k]).ops.length === 0);
  check(label + " — no unit is dirty with nothing to send", stuck, []);
}

const person = (id, name, extra) => Object.assign({ id, name, email: name + "@x.com", whatsapp: "" }, extra || {});
const vids = [{ id: "v1", no: 1, title: "One", owner: "Asif", status: "Review" }];

console.log("\n1. the reported bug — roster in two orders, same people");
{
  const s = { videos: JSON.parse(JSON.stringify(vids)), people: [person("p_amina", "Amina"), person("p_yar", "Yar")] };
  /* what settle() leaves behind: the newly saved person appended, while
     migrate() keeps the on-screen list sorted by name */
  const b = { videos: JSON.parse(JSON.stringify(vids)), people: [person("p_yar", "Yar"), person("p_amina", "Amina")] };
  api.set(s, b);
  check("roster reordered is not an edit", api.peopleDirty(), false);
  check("nothing is unsaved", api.dirtyUnits(), []);
  noStuckUnits("roster reorder");
}

console.log("\n2. a real roster edit still saves");
{
  const s = { videos: JSON.parse(JSON.stringify(vids)), people: [person("p_amina", "Amina", { whatsapp: "3001234567" })] };
  const b = { videos: JSON.parse(JSON.stringify(vids)), people: [person("p_amina", "Amina")] };
  api.set(s, b);
  check("a changed number is unsaved", api.dirtyUnits(), ["people"]);
  check("and it builds an op", api.ops(["people"]).ops.length, 1);
  noStuckUnits("roster edit");
}
{
  const s = { videos: JSON.parse(JSON.stringify(vids)), people: [person("p_a", "A"), person("p_b", "B")] };
  const b = { videos: JSON.parse(JSON.stringify(vids)), people: [person("p_a", "A")] };
  api.set(s, b);
  check("a new person is unsaved", api.dirtyUnits(), ["people"]);
  noStuckUnits("new person");
}
{
  const s = { videos: JSON.parse(JSON.stringify(vids)), people: [person("p_a", "A")] };
  const b = { videos: JSON.parse(JSON.stringify(vids)), people: [person("p_a", "A"), person("p_b", "B")] };
  api.set(s, b);
  check("a removed person is unsaved", api.dirtyUnits(), ["people"]);
  noStuckUnits("removed person");
}

console.log("\n3. time logs — an hour of somebody's pay");
{
  const log = (id, mins) => ({ id, who: "Asif", date: "2026-09-19", mins, note: "" });
  const s = { videos: JSON.parse(JSON.stringify(vids)), timeLogs: [log("t1", 30), log("t2", 60)] };
  const b = { videos: JSON.parse(JSON.stringify(vids)), timeLogs: [log("t2", 60), log("t1", 30)] };
  api.set(s, b);
  check("reordered logs are not an edit", api.timeLogsDirty(), false);
  noStuckUnits("log reorder");

  const s2 = { videos: JSON.parse(JSON.stringify(vids)), timeLogs: [log("t1", 45)] };
  const b2 = { videos: JSON.parse(JSON.stringify(vids)), timeLogs: [log("t1", 30)] };
  api.set(s2, b2);
  check("a changed log is unsaved", api.dirtyUnits(), ["timeLogs"]);
  check("and it builds an op", api.ops(["timeLogs"]).ops.length, 1);
  noStuckUnits("log edit");
}

console.log("\n4. ideas");
{
  const idea = (id, t) => ({ id, title: t });
  const s = { videos: JSON.parse(JSON.stringify(vids)), ideas: [idea("i1", "A"), idea("i2", "B")] };
  const b = { videos: JSON.parse(JSON.stringify(vids)), ideas: [idea("i2", "B"), idea("i1", "A")] };
  api.set(s, b);
  check("reordered ideas are not an edit", api.ideasDirty(), false);
  noStuckUnits("idea reorder");

  const s2 = { videos: JSON.parse(JSON.stringify(vids)), ideas: [idea("i1", "A2")] };
  const b2 = { videos: JSON.parse(JSON.stringify(vids)), ideas: [idea("i1", "A")] };
  api.set(s2, b2);
  check("an edited idea is unsaved", api.dirtyUnits(), ["ideas"]);
  noStuckUnits("idea edit");
}

console.log("\n5. a video, the ordinary case");
{
  const s = { videos: [{ id: "v1", no: 1, title: "One", notes: [{ id: "n1", text: "hi" }] }], people: [] };
  const b = { videos: [{ id: "v1", no: 1, title: "One" }], people: [] };
  api.set(s, b);
  check("a posted comment is unsaved", api.dirtyUnits(), ["video:v1"]);
  check("and it builds an op", api.ops(["video:v1"]).ops.length, 1);
  noStuckUnits("comment");
}
{
  const same = () => ({ videos: [{ id: "v1", no: 1, title: "One" }], people: [] });
  api.set(same(), same());
  check("an untouched board is clean", api.dirtyUnits(), []);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
