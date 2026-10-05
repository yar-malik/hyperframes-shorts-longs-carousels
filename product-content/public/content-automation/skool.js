/**
 * The Skool pages, inside the video board.
 *
 * Two sheets became two pages. "Standards" is the definition of each job —
 * what it is, how often, how long it should take, and a link to one done
 * properly. "Today" is the doing: one row per task per day, with the time it
 * took and links to the work. Payments reads the reviewed rows and multiplies
 * hours by a rate.
 *
 * These used to be a second website on a second URL with a second rail, and
 * people were being asked to know which of two addresses their work lived at.
 * They are now a section of the one board, and this file renders panes into
 * it rather than owning a page: the shell, the rail, the page header and the
 * routing all belong to app.js, and everything here is confined to
 * #skool-root so forty-four shared class names cannot collide.
 *
 * The two still keep their own documents on the server. A task has a cadence
 * and a standard; a video has a transcript and a score, and one 600KB record
 * holding both would make every tick of a checkbox rewrite the transcripts.
 */
window.Skool = (function () {
  "use strict";
  var CFG = window.SKOOL_CONFIG || {};
  var API = CFG.api || "/api/skool-team";
  var BASE = CFG.base || "/content-automation/skool";
  var AUTH = "/api/content-automation/auth";
  /* The video board's image store, reused rather than rebuilt: same bucket,
     same five-megabyte ceiling, same signed-in check, and both boards share
     the sign-in already. */
  var API_UPLOAD = "/api/content-automation/upload";
  var API_IMG = "/api/content-automation/image?p=";

  var state = { rev: 0, standards: [], log: [], people: [], stats: [] };
  var baseline = JSON.parse(JSON.stringify(state));
  var who = { signedIn: false, name: "", email: "", role: "member" };
  var loaded = false;

  var ui = {
    tab: "tasks",
    task: "",          /* which task tab is open */
    editStd: false,    /* admin editing the open task's standard, in place */
    submit: null,      /* {standardId,mins,links[]} while a task is being logged */
    shotUp: false,     /* a screenshot is on its way up */
    shotErr: "",
    openHow: "",       /* the task whose full note is unfolded */
    openPrompts: "",
    openAlways: false,
    fbWho: "",         /* Feedback filtered to one person */
    showUnex: false,   /* the sent-back rows with no reason on them */
    fbDraft: null,     /* the note being written */
    fbWhy: "",         /* the sent-back row having its reason typed */
    finMonth: "",      /* which month's wages the Finances page is costing */
    finEdit: false,
    date: todayISO(),
    person: "",        /* whose board is being looked at; admins can switch */
    /* The log is 168 rows over 53 days. A page that shows one day at a time
       hides all of it, so the board shows everything by default and the day
       is a filter you reach for, not a wall you start behind. */
    scope: "all",      /* all | week | day */
    q: "",
    status: [],        /* status ids that are on; empty means every one */
    open: "",          /* the one row expanded for editing */
    saving: false,
    readOnly: false,
    notice: null,
    toast: null,
    err: "",
    payAmt: {},
  };

  /* One path for every way a screenshot arrives — the picker and a paste.
     `onto` says where the returned path is written; `after` redraws. */
  function uploadShot(file, ownerId, onto) {
    if (!file) return;
    if (!/^image\//.test(file.type || "")) { ui.shotErr = "That is not an image."; paint(); return; }
    var ext = (String(file.type).split("/")[1] || "png").replace("jpeg", "jpg");
    var fd = new FormData();
    fd.append("file", file, file.name || "pasted-" + Date.now() + "." + ext);
    /* newPath() sanitises this into the storage path, so a row id is fine. */
    fd.append("videoId", String(ownerId || "skool"));
    ui.shotUp = true; ui.shotErr = ""; paint();
    /* A rejected upload does not always come back as JSON — when the file is
       too big the proxy answers first with an HTML page, and r.json() throws.
       That used to land in the catch and blame the connection. */
    fetch(API_UPLOAD, { method: "POST", credentials: "same-origin", body: fd })
      .then(function (r) {
        return r.text().then(function (t) {
          var d = null;
          try { d = JSON.parse(t); } catch (e) { d = null; }
          return { ok: r.ok, status: r.status, d: d };
        });
      })
      .then(function (res) {
        ui.shotUp = false;
        if (res.ok && res.d && res.d.path) onto(res.d.path);
        else if (res.status === 413) ui.shotErr = "That file is too big. Keep it under 5MB.";
        else ui.shotErr = (res.d && res.d.error) || "That did not upload.";
        paint();
      })
      .catch(function () {
        ui.shotUp = false;
        ui.shotErr = "That did not upload. Check your connection and try again.";
        paint();
      });
  }

  /* A grid of screenshots with a way to add one. Used by the submit form and
     by a row that is already logged. */
  function shotsHtml(imgs, addAct, delAct, ro, delPrefix) {
    imgs = imgs || [];
    return '<div class="shots">' +
      imgs.map(function (p, i) {
        return '<div class="shot"><a href="' + API_IMG + encodeURIComponent(p) + '" target="_blank" rel="noopener">' +
          '<img src="' + API_IMG + encodeURIComponent(p) + '" alt="Screenshot ' + (i + 1) + '" loading="lazy"></a>' +
          (ro ? "" : '<button class="shot-x" data-act="' + delAct + '" data-v="' +
            esc(delPrefix ? delPrefix + "|" + i : String(i)) + '" aria-label="Remove">&times;</button>') +
        "</div>";
      }).join("") +
      (ro ? "" :
        '<label class="shotadd' + (ui.shotUp ? " busy" : "") + '">' +
          '<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-shot="' + addAct + '"' +
            (ui.shotUp ? " disabled" : "") + ">" +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L5 20"/></svg>' +
          "<span>" + (ui.shotUp ? "Uploading…" : "Add") + "</span>" +
        "</label>") +
    "</div>" +
    (ui.shotErr ? '<span class="perr">' + esc(ui.shotErr) + "</span>" : "");
  }

  /* ---------------- small helpers ---------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function longDate(iso) {
    var p = String(iso || "").split("-");
    if (p.length !== 3) return iso || "";
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    if (isNaN(d)) return iso;
    return DAYS[d.getDay()] + ", " + d.getDate() + " " + MONTHS[d.getMonth()];
  }
  /* "5 Jul" — for a table where the weekday is noise and the column is narrow. */
  function shortDate(iso) {
    var p = String(iso || "").split("-");
    if (p.length !== 3) return iso || "";
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    if (isNaN(d)) return iso;
    return d.getDate() + " " + MONTHS[d.getMonth()].slice(0, 3);
  }
  function shiftDate(iso, by) {
    var p = String(iso).split("-");
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]) + by);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function newId(p) { return p + "_" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); }
  /* Admin or above: runs the board. Super admin: also sees the team and the
     money. The server enforces both — these two only decide what to draw. */
  function isAdmin() { return who.role === "super_admin" || who.role === "admin"; }
  function isSuper() { return who.role === "super_admin"; }
  function pkr(n) { return Number(n || 0).toLocaleString() + " PKR"; }
  /* Minutes read the way somebody says them out loud. */
  function mins(n) {
    n = Math.max(0, Math.round(Number(n) || 0));
    if (!n) return "—";
    var h = Math.floor(n / 60), m = n % 60;
    return h ? (m ? h + "h " + m + "m" : h + "h") : m + "m";
  }
  function hue(name) {
    var t = String(name || ""), h = 0;
    for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 360;
    return h;
  }
  function initials(name) {
    var parts = String(name || "?").trim().split(/\s+/);
    return ((parts[0] || "?")[0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }
  function toast(msg) {
    ui.toast = msg; paint();
    setTimeout(function () { ui.toast = null; paint(); }, 2200);
  }
  function personByName(name) {
    var k = String(name || "").trim().toLowerCase();
    return (state.people || []).filter(function (p) { return String(p.name).trim().toLowerCase() === k; })[0] || null;
  }
  function myName() { return who.name || ""; }
  /* Admins look at whoever is selected; everybody else looks at themselves,
     and no control is drawn that would suggest otherwise. */
  function viewing() {
    if (!isAdmin()) return myName();
    return ui.person || (state.people[0] && state.people[0].name) || myName();
  }
  function people() { return state.people || []; }

  /* ---------------- dirty tracking and saving ---------------- */
  /* Compare everything except the bookkeeping the server owns, rather than
     listing the fields that count. The list version has now failed three
     times — statistics, then the finance figures, then feedback — each time
     silently: the edit lands in memory, Save never lights up, save() returns
     early because nothing looks dirty, and the work is lost on reload with no
     error anywhere. A new field should not have to remember to be saved. */
  var VOLATILE = { rev: 1, saveToken: 1, savedBy: 1, savedAt: 1 };
  function comparable(b) {
    var out = {};
    Object.keys(b || {}).sort().forEach(function (k) { if (!VOLATILE[k]) out[k] = b[k]; });
    return JSON.stringify(out);
  }
  function dirty() { return comparable(state) !== comparable(baseline); }

  /* ---------------- one save, one thing ----------------

     The same model as the video board, because moving between the two and
     finding they behave differently is itself a reason people stopped
     trusting either.

     A unit is a section of this board that can be saved on its own: the day's
     log, the standards, the roster, the statistics, the finance figures. What
     goes over the wire is the individual rows inside it that changed — the
     server merges them into the board it has just read and retries onto
     whoever won, so two people logging their own day both save and neither is
     shown a conflict about the other's rows. */

  var UNITS = ["log", "standards", "people", "stats", "feedback", "finance"];
  var unitUi = {};        /* key -> { st: "saving"|"saved"|"error", msg } */
  var unitFlash = {};     /* key -> when "Saved" stops being shown */

  function unitOf(key) { return key; }
  function listOf(b, key) { return (b && b[key]) || []; }

  function unitDirty(key) {
    if (key === "finance") {
      return JSON.stringify(state.finance || null) !== JSON.stringify(baseline.finance || null);
    }
    return JSON.stringify(listOf(state, key)) !== JSON.stringify(listOf(baseline, key));
  }
  function dirtyUnits() { return UNITS.filter(unitDirty); }
  function unitSaving(key) { return Boolean(unitUi[key] && unitUi[key].st === "saving"); }

  /* Rows in a collection that differ, by id — the whole of what a save sends
     for that unit. Compared over the union of keys on either side rather than
     a list kept by hand, for the reason at the top of this file: a field that
     has to remember to be saveable is a field that will one day not be. */
  function rowOps(key) {
    var idk = "id";
    var bm = {}, cm = {}, ops = [], count = 0;
    listOf(baseline, key).forEach(function (r) { bm[String(r[idk])] = r; });
    listOf(state, key).forEach(function (r) { cm[String(r[idk])] = r; });
    listOf(state, key).forEach(function (r) {
      var b = bm[String(r[idk])];
      if (!b) { ops.push({ t: "add", coll: key, row: JSON.parse(JSON.stringify(r)) }); count++; return; }
      var f = {}, n = 0, keys = {};
      Object.keys(r).forEach(function (k) { keys[k] = 1; });
      Object.keys(b).forEach(function (k) { keys[k] = 1; });
      delete keys[idk];
      Object.keys(keys).forEach(function (k) {
        if (JSON.stringify(r[k] == null ? "" : r[k]) !== JSON.stringify(b[k] == null ? "" : b[k])) {
          /* null, never undefined — JSON.stringify drops undefined, and a
             dropped field is a save that succeeds and writes nothing. */
          f[k] = r[k] === undefined ? null : r[k]; n++;
        }
      });
      if (n) { ops.push({ t: "row", coll: key, id: String(r[idk]), f: f }); count += n; }
    });
    listOf(baseline, key).forEach(function (r) {
      if (!cm[String(r[idk])]) { ops.push({ t: "del", coll: key, id: String(r[idk]) }); count++; }
    });
    return { ops: ops, count: count };
  }

  function unitCount(key) {
    if (!unitDirty(key)) return 0;
    if (key === "finance") return 1;
    return rowOps(key).count;
  }

  function unitName(key) {
    return key === "log" ? "the day's work"
         : key === "standards" ? "the standards"
         : key === "people" ? "the team's details"
         : key === "stats" ? "the statistics"
         : key === "feedback" ? "the comments"
         : "the finance figures";
  }

  /* What the control says, given nothing but the unit. One place, so no two
     of them can disagree. */
  function unitView(key, label) {
    var u = unitUi[key] || {};
    if (u.st === "saving") return { tone: "busy", btn: "Saving…", say: "", off: true };
    if (u.st === "error") return { tone: "bad", btn: "Try again", say: u.msg || "Not saved", off: false };
    if (unitDirty(key)) {
      var n = unitCount(key);
      return { tone: "pending", btn: label || "Save",
               say: n === 1 ? "1 unsaved change" : n + " unsaved changes", off: false };
    }
    if (Date.now() < (unitFlash[key] || 0)) return { tone: "done", btn: "✓ Saved", say: "", off: true };
    return { tone: "clean", btn: "Saved", say: "", off: true };
  }

  /* The same control as the video board's, drawn from the same three states,
     so the two boards cannot look like they mean different things. */
  function saveButton(key, label) {
    if (!key || ui.readOnly) return "";
    var v = unitView(key, label);
    return '<div class="saveunit ' + v.tone + '" data-unit="' + esc(key) + '"' +
      (label ? ' data-label="' + esc(label) + '"' : "") + ">" +
      '<span class="savesay">' + esc(v.say) + "</span>" +
      '<button type="button" class="btn savebtn" data-act="unitsave" data-unit="' + esc(key) + '"' +
        (v.off ? " disabled" : "") + ">" + esc(v.btn) + "</button>" +
    "</div>";
  }

  /* Repaints every Save without a paint(), which would rebuild the field
     somebody is typing into and take the caret with it. */
  function paintSave() {
    var boxes = document.querySelectorAll("#skool-root .saveunit[data-unit]");
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      var v = unitView(box.getAttribute("data-unit"), box.getAttribute("data-label") || "");
      box.className = "saveunit " + v.tone;
      var say = box.querySelector(".savesay");
      if (say) say.textContent = v.say;
      var btn = box.querySelector(".savebtn");
      if (btn) { btn.textContent = v.btn; btn.disabled = v.off; }
    }
    /* The header speaks for both boards, so it hears about this one too. */
    if (window.saveAtRefresh) window.saveAtRefresh();
  }

  /* Put the caret back in the box that was just typed into, after a repaint
     rebuilt it.

     setSelectionRange is not called on a number input. Browsers throw
     InvalidStateError for it — number, email and a few other types do not
     support selection at all — and the throw came out of the middle of the
     input handler, so everything after it in that handler was skipped. It had
     been doing that on the allocation box since it was written. Focus is all
     a number box needs; the caret lands at the end on its own. */
  function refocus(sel) {
    var el = document.querySelector(sel);
    if (!el) return;
    el.focus();
    var type = String(el.type || "").toLowerCase();
    if (type === "number" || type === "email" || type === "date" || type === "url") return;
    try { var n = el.value.length; el.setSelectionRange(n, n); } catch (e) {}
  }

  function inAField() {
    var el = document.activeElement;
    return Boolean(el && (/^(input|textarea)$/i.test(el.tagName || "") || el.isContentEditable));
  }

  /**
   * Save these units and nothing else.
   */
  function saveUnits(keys, opts) {
    opts = opts || {};
    if (ui.readOnly) return;
    keys = (keys || []).filter(function (k, i, all) {
      return all.indexOf(k) === i && unitDirty(k) && !unitSaving(k);
    });
    if (!keys.length) return;

    var ops = [], sent = {};
    keys.forEach(function (k) {
      if (k === "finance") {
        var fin = JSON.parse(JSON.stringify(state.finance || {}));
        ops.push({ t: "set", path: "finance", v: fin });
        sent[k] = { path: "finance", v: fin };
        return;
      }
      var built = rowOps(k);
      built.ops.forEach(function (o) { ops.push(o); });
      sent[k] = { coll: k, ops: JSON.parse(JSON.stringify(built.ops)) };
    });
    if (!ops.length) return;

    keys.forEach(function (k) { unitUi[k] = { st: "saving" }; });
    paintSave();

    fetch(API, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ops: ops }),
      keepalive: opts.leaving === true
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        return { ok: r.ok, status: r.status, d: d };
      });
    }).then(function (res) {
      if (!res.ok) {
        var msg = (res.d && res.d.error) || "";
        throw { kind: res.status === 401 ? "auth" : res.status === 403 ? "denied" : "http", msg: msg };
      }
      var rows = (res.d && res.d.rows) || {};
      keys.forEach(function (k) {
        var sentRow = sent[k];
        if (!sentRow) return;
        if (sentRow.path) {
          baseline.finance = JSON.parse(JSON.stringify(sentRow.v));
        } else {
          sentRow.ops.forEach(function (o) { settle(k, o, rows[k + ":" + (o.t === "add" ? o.row.id : o.id)]); });
        }
        unitUi[k] = { st: "saved" };
        unitFlash[k] = Date.now() + 2600;
      });
      if (res.d && res.d.rev) { state.rev = res.d.rev; baseline.rev = res.d.rev; }
      if (res.d && res.d.savedAt) { state.savedAt = res.d.savedAt; state.savedBy = res.d.savedBy || ""; }
      /* Wages are worked out on the way out from rates a member cannot see,
         so this is the one figure that changes under somebody else's save. */
      if (res.d && res.d.finance && state.finance) {
        state.finance.wagesPkrByMonth = res.d.finance.wagesPkrByMonth;
        if (baseline.finance) baseline.finance.wagesPkrByMonth = res.d.finance.wagesPkrByMonth;
      }
      ui.notice = null;
      if (window.savedJustNow) window.savedJustNow();
      if (inAField()) paintSave(); else paint();
      window.setTimeout(paintSave, 2700);
    }).catch(function (err) {
      var kind = (err && err.kind) || "http";
      keys.forEach(function (k) {
        unitUi[k] = {
          st: "error",
          msg: kind === "auth" ? "Sign in again to save this"
             : kind === "denied" ? ((err && err.msg) || "You are not allowed to change this")
             : "Not saved — press to try again"
        };
      });
      ui.notice = {
        kind: kind === "denied" ? "bad" : "bad",
        text: kind === "auth"
          ? "You have been signed out. Nothing was lost — sign in again and press Save."
          : kind === "denied"
            ? ((err && err.msg) || "That change was not allowed.")
            : "Could not save " + unitName(keys[0]) + ". Nothing was lost — it is still on this screen. " +
              (navigator.onLine === false ? "You are offline; press Save when you are back."
                                          : "Press Save again in a moment.")
      };
      if (inAField()) paintSave(); else paint();
    });
  }

  /* Adopting what came back without stepping on what is still being typed: a
     field takes the server's version only while it still holds exactly what
     was sent. Anything newer stands, stays dirty, and goes with the next
     save. Either way the baseline moves, which is what makes the unit stop
     claiming to be unsaved. */
  function settle(coll, op, serverRow) {
    var baseList = (baseline[coll] = baseline[coll] || []);
    var find = function (list, id) {
      for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(id)) return list[i];
      return null;
    };
    if (op.t === "del") {
      for (var i = 0; i < baseList.length; i++) {
        if (String(baseList[i].id) === String(op.id)) { baseList.splice(i, 1); break; }
      }
      return;
    }
    var id = op.t === "add" ? op.row.id : op.id;
    var cur = find(state[coll] || [], id);
    if (!cur) return;
    var base = find(baseList, id);
    if (!base) { base = { id: id }; baseList.push(base); }
    var fields = op.t === "add" ? op.row : op.f;
    Object.keys(fields).forEach(function (k) {
      var stillAsSent = JSON.stringify(cur[k] == null ? "" : cur[k]) ===
                        JSON.stringify(fields[k] == null ? "" : fields[k]);
      var truth = serverRow && Object.prototype.hasOwnProperty.call(serverRow, k) ? serverRow[k] : fields[k];
      if (stillAsSent) cur[k] = JSON.parse(JSON.stringify(truth == null ? cur[k] : truth));
      base[k] = JSON.parse(JSON.stringify(stillAsSent ? cur[k] : fields[k]));
    });
  }

  function saveEverything(opts) { saveUnits(dirtyUnits(), opts); }

  /* ---------------- what saves itself, and what waits ----------------

     Identical to the video board, deliberately. Pressing something is a
     decision and saves itself; typing waits for the button. The rule lives in
     one place rather than in each of the thirty handlers that change
     something. */
  function unitSig(key) {
    return key === "finance" ? JSON.stringify(state.finance || null) : JSON.stringify(listOf(state, key));
  }
  function dirtySigs() {
    var out = {};
    dirtyUnits().forEach(function (k) { out[k] = unitSig(k); });
    return out;
  }
  function afterPress(before) {
    window.setTimeout(function () {
      var touched = dirtyUnits().filter(function (k) {
        return before[k] === undefined || before[k] !== unitSig(k);
      });
      if (touched.length) saveUnits(touched);
      else paintSave();
    }, 0);
  }

  document.addEventListener("click", function (e) {
    if (ui.readOnly || !loaded) return;
    var t = e.target && e.target.closest ? e.target.closest("#skool-root button,#skool-root select,#skool-root a,#skool-root [data-act]") : null;
    if (!t) return;
    var act = t.getAttribute && t.getAttribute("data-act");
    if (act === "unitsave" || act === "saveall" || act === "save") return;
    afterPress(dirtySigs());
  }, true);

  document.addEventListener("change", function (e) {
    if (ui.readOnly || !loaded) return;
    var el = e.target;
    if (!el || !el.tagName || !el.closest || !el.closest("#skool-root")) return;
    var kind = String(el.tagName).toLowerCase();
    var type = String(el.type || "").toLowerCase();
    if (kind !== "select" && type !== "checkbox" && type !== "radio" && type !== "date") return;
    afterPress(dirtySigs());
  }, true);

  /* ---------------- the safety net ----------------
     Typing waits for the button, which is the point — but a tab closed on an
     unsaved paragraph must not cost somebody their evening. `keepalive` is
     what lets the request outlive the page. */
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden" && !ui.readOnly && dirtyUnits().length) {
      saveEverything({ leaving: true });
    }
  });
  window.addEventListener("pagehide", function () {
    if (!ui.readOnly && dirtyUnits().length) saveEverything({ leaving: true });
  });

  /* Called by thirty handlers after changing something. It repaints and
     nothing else: which of those changes was a press and which was a
     keystroke is decided by the click rule above, in one place. */
  function refreshSave() { paintSave(); }

  /* Opening on today is right for somebody logging their day and wrong for
     everybody else: nothing is logged before the day is worked, and an admin
     landing on his own name sees an empty board because he is not one of the
     people who fill it in. So on the first load, land on the most recent day
     that actually has work, for somebody who actually did it. Once anyone has
     picked a date or a person, their choice stands. */
  var landed = false, authDone = false;
  function landOnWork() {
    /* Only who, never when. The date is today and stays today: this page is
       opened in the morning to do the day's work, and a board that quietly
       moves you to last Thursday because today is still empty is showing you
       the wrong day at exactly the moment the right one matters. Every day
       starts empty; that is not a problem to route around.

       (It used to jump to the last day with rows. That was written when the
       board had nothing on it at all and looked broken. It has rows now.) */
    if (landed || !loaded || !authDone) return;
    var log = state.log || [];
    if (!log.length) { landed = true; return; }

    /* An admin whose own name has no rows is looking at the wrong person's
       board — Yar does not log against these standards, Asif and Rehman do. */
    if (!logFor(viewing()).length) {
      var owners = {};
      log.forEach(function (r) {
        var o = String(r.owner || "").trim();
        if (o && (!owners[o] || r.date > owners[o])) owners[o] = r.date;
      });
      var best = Object.keys(owners).sort(function (a, b) {
        return owners[a] < owners[b] ? 1 : owners[a] > owners[b] ? -1 : 0;
      })[0];
      if (best) ui.person = best;
    }
    landed = true;
  }

  function load() {
    fetch(API, { credentials: "same-origin", headers: { accept: "application/json" } })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        loaded = true;
        if (!res.ok) { ui.err = (res.d && res.d.error) || "Could not load the board"; paint(); return; }
        state = normalise(res.d);
        baseline = JSON.parse(JSON.stringify(state));
        landOnWork();
        paint();
        /* Roles live on the people records, half of which are on this board,
           so nothing that depends on them can be decided until this has
           arrived. The shell asked to be told. */
        if (typeof window.onSkoolLoaded === "function") window.onSkoolLoaded();
      })
      .catch(function () { loaded = true; ui.err = "Could not reach the server"; paint(); });
  }
  /* The board is saved whole, so a key this function drops is not merely
     missing from the page — it is written away on the next ordinary save.
     That has now happened twice: to the statistics, and to the finance
     figures, both wiped by a save from a page whose normalise() predated
     them.

     So it keeps every key it is handed and only coerces the ones it knows
     about. A field this build has never heard of survives untouched, which is
     what a whole-document save needs. */
  function normalise(b) {
    var o = b && typeof b === "object" ? b : {};
    var out = {};
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = o[k];
    out.rev = o.rev || 0;
    out.standards = Array.isArray(o.standards) ? o.standards : [];
    out.log = Array.isArray(o.log) ? o.log : [];
    out.people = Array.isArray(o.people) ? o.people : [];
    out.stats = Array.isArray(o.stats) ? o.stats : [];
    return out;
  }

  /**
   * "Save whatever is outstanding."
   *
   * What the shell's Save all reaches, and what the handful of handlers that
   * must not leave something in the browser call. It is the per-item path:
   * only the units that are dirty, only the rows inside them that changed.
   *
   * The whole-document PUT this used to be is still on the server and still
   * works; nothing here asks for it any more. It sent two hundred log rows
   * and every standard to record a tick, and the revision it was checked
   * against was the whole board's — so two people logging their own days
   * collided, and the one who lost was told to enter their row again.
   */
  function save() { saveEverything(); }

  /* ---------------- standards ---------------- */
  /* ---------------- which section a task belongs to ----------------

     The work split into three kinds and one list could not say which was
     which: LinkedIn, Twitter and Facebook are written posts, Instagram is a
     carousel, and Skool posts are Skool. They are all still one collection
     with one set of log rows and one pay history — a task keeps its id and
     everything hanging off it — and this only says where it is shown.

     Stored on the standard, so the same platform can appear in two sections:
     LinkedIn as a written post and LinkedIn as a carousel are two tasks with
     two prices and two sets of rows, which is what they are.

     Falls back to the name for rows written before the field existed, so
     nothing had to be migrated for the split to appear. */
  var SECTION_BY_NAME = {
    "skool posts": "skool",
    "courses": "skool",
    "statistics": "skool",
    "twitter": "written",
    "x": "written",
    "facebook": "written",
    "linkedin": "written",
    "instagram": "carousel"
  };
  var SECTIONS = { skool: 1, written: 1, carousel: 1 };

  function sectionOf(s) {
    var set = s && String(s.section || "");
    if (SECTIONS[set]) return set;
    var byName = SECTION_BY_NAME[String((s && (s.label || s.task)) || "").trim().toLowerCase()];
    return byName || "skool";
  }

  /* Which section the page being looked at is showing. The shell sets it when
     it opens Written Posts or Carousels; Skool Tasks is the default. */
  ui.section = "skool";

  function standardsFor(name, section) {
    var k = String(name || "").trim().toLowerCase();
    var want = section === undefined ? ui.section : section;
    return (state.standards || [])
      .filter(function (s) {
        if (String(s.owner || "").trim().toLowerCase() !== k) return false;
        return !want || sectionOf(s) === want;
      })
      .sort(function (a, b) { return (Number(a.priority) || 99) - (Number(b.priority) || 99); });
  }

  /* Everybody with work in a section, for the row of faces at the top of it. */
  function ownersIn(section) {
    var seen = {}, out = [];
    (state.standards || []).forEach(function (s) {
      if (section && sectionOf(s) !== section) return;
      var n = String(s.owner || "").trim();
      var k = n.toLowerCase();
      if (!n || seen[k]) return;
      seen[k] = 1; out.push(n);
    });
    return out.sort();
  }

  /* ---------------- the log ---------------- */
  function logFor(name, date) {
    var k = String(name || "").trim().toLowerCase();
    return (state.log || []).filter(function (r) {
      return String(r.owner || "").trim().toLowerCase() === k && (!date || r.date === date);
    });
  }
  function logIndex(id) {
    for (var i = 0; i < state.log.length; i++) if (state.log[i].id === id) return i;
    return -1;
  }
  function rowById(id) { var i = logIndex(id); return i < 0 ? null : state.log[i]; }

  /* Everything on today's list that has not been started yet. This is the
     button that replaces retyping the same five rows every morning. */
  function missingToday(name, date) {
    var have = {};
    logFor(name, date).forEach(function (r) { if (r.standardId) have[r.standardId] = 1; });
    return standardsFor(name).filter(function (s) {
      return isDaily(s) && !have[s.id];
    });
  }

  var STATUS = [
    /* `short` is what fits in a table cell; `label` is what reads in a
       sentence. The select had been showing "Done · waiting on rev…". */
    { id: "done", label: "Done · waiting on review", short: "Waiting on review" },
    { id: "reviewed", label: "Reviewed", short: "Reviewed" },
    { id: "redo", label: "Needs redoing", short: "Needs redoing" },
  ];
  function statusShort(id) {
    for (var i = 0; i < STATUS.length; i++) if (STATUS[i].id === id) return STATUS[i].short;
    return id;
  }
  function statusLabel(id) {
    for (var i = 0; i < STATUS.length; i++) if (STATUS[i].id === id) return STATUS[i].label;
    return id;
  }

  /* ---------------- tasks ----------------
     One tab per standard the person is responsible for, because that is the
     shape of their morning: six or seven jobs, done in order, every day. The
     tab opens the job — what it is, how to do it well, the prompts that do
     it, and the example of one done properly on the right — and carries the
     one button that matters, which marks it done for the day.

     The log is still underneath all of this; it is just no longer the first
     thing anyone has to read. */

  function taskTabs(name) { return standardsFor(name); }

  /* A bonus is paid when the result happens — somebody joins and stays — not
     for turning up. It is never on the day's to-do count and never in what a
     day is worth, because nobody can promise one a day. */
  function isPerResult(s) { return Boolean(s) && s.cadence === "Per result"; }
  function isDaily(s) { return Boolean(s) && s.cadence !== "Weekly" && !isPerResult(s); }
  function cadenceLabel(s) {
    return isPerResult(s) ? "Per person" : s.cadence === "Weekly" ? "Once a week" : "Every day";
  }
  /* What a task pays, said the way the person doing it would say it. */
  function payLine(s) {
    if (ownerHourly(s.owner) && !isPerResult(s)) return "Paid through your hours";
    if (isHourly(s)) {
      var r = rateOf(s.owner);
      return r == null ? "Paid by the hour" : pkr(r) + " an hour";
    }
    var p = payOf(s);
    if (p == null) return "";
    return isPerResult(s) ? pkr(p) + " per person" : "Pays " + pkr(p);
  }

  /* The row that says this standard was done on this day, if there is one. */
  function doneRow(name, date, stdId) {
    return logFor(name, date).filter(function (r) { return r.standardId === stdId; })[0] || null;
  }
  function currentStd(name) {
    var list = taskTabs(name);
    if (!list.length) return null;
    for (var i = 0; i < list.length; i++) if (list[i].id === ui.task) return list[i];
    return list[0];
  }
  function labelFor(s) {
    if (s.label) return s.label;
    /* Falls back to the first few words rather than the whole sentence — a
       tab strip cannot carry "Skool: create 10 posts across 10 accounts…". */
    var w = String(s.task || "Task").split(/\s+/).slice(0, 3).join(" ");
    return w.replace(/[:,.]$/, "");
  }

  function tasksPane() {
    var name = viewing();
    if (!name) return '<p class="lede">There is no profile on this board under your name yet. Ask Yar to add one.</p>';
    var list = taskTabs(name);
    if (!list.length) {
      return '<p class="lede">No standards on <b>' + esc(name) + "</b>’s list yet. " +
        (isAdmin() ? "Add them on the Standards page." : "Ask Yar to add them.") + "</p>";
    }
    var s = currentStd(name);
    var todayRows = logFor(name, ui.date);
    var doneIds = {};
    todayRows.forEach(function (r) { if (r.standardId) doneIds[r.standardId] = r; });
    var daily = list.filter(isDaily);
    var dailyDone = daily.filter(function (x) { return doneIds[x.id]; }).length;

    return (
      '<div class="dayhead">' +
        /* Two people and one date. Both were a bare dropdown and a bare date
           input, which is the least legible way to present a choice between
           two names and the difference between today and yesterday. */
        (isAdmin() ? '<div class="whopick" role="group" aria-label="Whose board">' +
          people().map(function (p) {
            var on = String(p.name).toLowerCase() === String(name).toLowerCase();
            return '<button class="whobtn' + (on ? " on" : "") + '" data-act="who" data-v="' + esc(p.name) + '"' +
              ' aria-pressed="' + on + '">' +
              '<i class="avatar tiny" style="background:hsl(' + hue(p.name) + ' 42% 46%)">' + esc(initials(p.name)) + "</i>" +
              esc(p.name) + "</button>";
          }).join("") + "</div>" : "") +

        /* The date is the thing people look at first every morning, so it is
           the biggest thing here: the weekday spelt out, the number large, and
           a colour that says at a glance whether you are on today or not. */
        '<div class="datepick' + (ui.date === todayISO() ? " istoday" : "") + '">' +
          '<button class="stepbtn" data-act="day" data-v="-1" aria-label="Previous day">‹</button>' +
          '<button class="datebtn" data-act="pickdate" title="Pick a date">' +
            '<span class="dnum">' + esc(String(Number(ui.date.split("-")[2]))) + "</span>" +
            '<span class="dstack">' +
              '<b>' + esc(DAYS[new Date(ui.date + "T00:00:00").getDay()]) + "</b>" +
              "<small>" + esc(MONTHS[Number(ui.date.split("-")[1]) - 1]) + " " +
                esc(ui.date.split("-")[0]) + "</small>" +
            "</span>" +
            '<span class="dtag">' + (ui.date === todayISO() ? "today"
              : ui.date === shiftDate(todayISO(), -1) ? "yesterday"
              : ui.date === shiftDate(todayISO(), 1) ? "tomorrow"
              : ui.date > todayISO() ? "ahead" : "past") + "</span>" +
          "</button>" +
          '<input class="dayhidden" type="date" id="daypick" value="' + esc(ui.date) + '" aria-label="Date" tabindex="-1">' +
          '<button class="stepbtn" data-act="day" data-v="1" aria-label="Next day">›</button>' +
        "</div>" +
        (ui.date === todayISO() ? "" : '<button class="chip backtoday" data-act="today">↩ Today</button>') +

        '<div class="dayhead-r">' +
          '<span class="progress' + (dailyDone >= daily.length && daily.length ? " all" : "") + '">' +
            '<span class="pbar"><i style="width:' +
              (daily.length ? Math.round((dailyDone / daily.length) * 100) : 0) + '%"></i></span>' +
            "<b>" + dailyDone + "</b> of " + daily.length + " done today</span>" +
          saveButton("log", "Save today's work") +
        "</div>" +
      "</div>" +

      '<div class="tasktabs" role="tablist">' + list.map(function (t) {
        var done = Boolean(doneIds[t.id]);
        var on = s && t.id === s.id;
        return '<button class="tasktab' + (on ? " on" : "") + (done ? " done" : "") + '" role="tab" ' +
          'aria-selected="' + on + '" data-act="task" data-v="' + esc(t.id) + '">' +
          '<i class="tickbox">' + (done ? "✓" : "") + "</i>" +
          '<span class="tl">' + esc(labelFor(t)) + "</span>" +
          (t.cadence === "Weekly" ? '<span class="wk">weekly</span>' : isPerResult(t) ? '<span class="wk">bonus</span>' : "") +
        "</button>";
      }).join("") +
        (isAdmin() && !ui.readOnly
          ? '<button class="tasktab addtab" data-act="addstd" title="Add a task to this list">+</button>'
          : "") +
      "</div>" +

      taskDetail(name, s, doneIds[s.id] || null)
    );
  }

  /* Marking a task done takes two things with it: how long it took, and a
     link or a screenshot of the work. Without the minutes nobody can be paid;
     without proof Yar cannot see what was done, which has been the standing
     complaint since June. Asking at the moment the box is ticked is the only
     time the person still has both to hand.

     A dialog rather than a panel in the page: it is a short, finishable job
     with its own Cancel, and inline it pushed the whole task down and left
     people unsure whether anything had been recorded. */
  function submitModalHtml() {
    var d = ui.submit;
    if (!d) return "";
    var s = (state.standards || []).filter(function (x) { return x.id === d.standardId; })[0];
    if (!s) return "";
    var links = d.links && d.links.length ? d.links : [""];
    var imgs = d.imgs || [];
    /* A link or a screenshot. Plenty of this work — a DM thread, a comment
       reply — has no link to give, and refusing it would only teach people to
       paste something meaningless. */
    /* Proof is the only thing asked for now. Time is not logged any more —
       a task is allocated its minutes and pays them, so asking somebody to
       also stopwatch the job was work that changed nothing and that nobody
       enjoyed doing honestly. */
    var ready = links.some(function (u) { return String(u).trim(); }) || imgs.length > 0;

    return '<div class="modal-back" data-act="subback">' +
      '<div class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="subtitle" data-stop="1">' +
        '<div class="modal-head"><div>' +
          '<h2 id="subtitle">' + esc(labelFor(s)) + " — done today</h2>" +
          '<p class="modal-sub">' + esc(longDate(ui.date)) + ". Show the work and it is done." + "</p>" +
        "</div>" +
        '<button class="xbtn" data-act="subcancel" aria-label="Close">&times;</button></div>' +

        '<div class="modal-body">' +
          '<p class="subworth">' +
            (ownerHourly(s.owner) && !isPerResult(s)
              ? "You are paid by the hour, so this is paid through the time you log on your profile"
              : isHourly(s)
              ? "This one is paid by the hour" +
                (rateOf(viewing()) == null ? "" : " at <b>" + pkr(rateOf(viewing())) + " an hour</b>") +
                ", so put down the time you actually spent"
              : isPerResult(s)
                ? "This pays <b>" + (payOf(s) == null ? "\u2014" : pkr(payOf(s))) + " for each person</b>" +
                  ". Link every person\u2019s Skool profile \u2014 if more than one joined, add them all and each one is paid"
                : "This one pays <b>" + (payOf(s) == null ? "\u2014" : pkr(payOf(s))) + "</b>" +
                  ", the same to whoever does it") +
            ". Show what you did and it is logged.</p>" +

          '<div class="subfield"><span class="dk">Links to what you did</span>' +
            '<span class="fieldhint">Every post, every message thread. One link a box.</span>' +
            '<div class="sublinks">' + links.map(function (u, i) {
              return '<input class="linkin" type="url" data-sublink="' + i + '" value="' + esc(u) +
                '" placeholder="' + (i ? "Another link" : "Paste the first link") + '">';
            }).join("") + "</div>" +
            '<button class="btn btn-sm" data-act="sublink">+ Another link</button>' +
          "</div>" +

          '<div class="subfield"><span class="dk">…or a screenshot</span>' +
            '<span class="fieldhint">For the work that leaves no link — DM threads, comment replies. ' +
              "Paste one straight in with Cmd+V.</span>" +
            shotsHtml(imgs, "subshot", "subshotdel", false) +
          "</div>" +
        "</div>" +

        '<div class="modal-foot">' +
          '<span class="subwhy">' + (ready ? "" : "Add a link or a screenshot first.") + "</span>" +
          '<button class="btn" data-act="subcancel">Cancel</button>' +
          '<button class="btn btn-primary" data-act="subsave"' + (ready ? "" : " disabled") + ">✓ Mark it complete</button>" +
        "</div>" +
      "</div></div>";
  }

  function taskDetail(name, s, row) {
    var done = Boolean(row);
    var recent = logFor(name).filter(function (r) { return r.standardId === s.id; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 5);
    var rules = rulesOf(s.how);

    return '<div class="taskgrid">' +

      /* ---- the doing ---- */
      '<section class="taskmain">' +

        '<header class="taskhead">' +
          '<div class="taskheadrow">' +
            "<h2>" + esc(labelFor(s)) + "</h2>" +
            '<div class="taskmeta">' +
              '<span class="tmeta">' + esc(cadenceLabel(s)) + "</span>" +
              (isPerResult(s) ? "" : '<span class="tmeta">about ' + mins(s.estMins) + "</span>") +
              (payLine(s) ? '<span class="tmeta"><b>' + esc(payLine(s)) + "</b></span>" : "") +
            "</div>" +
            (isAdmin() && !ui.readOnly
              ? '<button class="btn btn-sm" data-act="editstd">' + (ui.editStd ? "Done" : "Edit") + "</button>"
              : "") +
          "</div>" +
          (s.short ? '<p class="tasklede">' + esc(s.short) + "</p>" : "") +
        "</header>" +

        (ui.editStd && isAdmin() && !ui.readOnly ? stdEditor(s) : "") +

        /* The job as numbers. This is the sentence somebody used to have to
           read twice, laid out so it does not have to be read at all. */
        ((s.targets || []).length
          ? '<div class="targets">' + s.targets.map(function (t) {
              return '<div class="target"><b>' + esc(t.n) + "</b>" +
                "<span>" + esc(t.unit) + "</span>" +
                '<small>' + esc(t.sub || "") + "</small></div>";
            }).join("") + "</div>"
          : "") +

        '<div class="markbar' + (done ? " is-done" : "") + '">' +
          (done
            ? '<div class="markdone"><i>✓</i><span>Done today · ' + mins(payMinsOf(row)) + "</span></div>" +
              (ui.readOnly ? "" :
                '<button class="btn btn-sm undo" data-act="undone" data-v="' + esc(row.id) + '">Not done after all</button>')
            : '<div class="marktodo"><span>Not done yet today</span></div>' +
                (ui.readOnly ? "" :
                  '<button class="btn btn-primary" data-act="markopen" data-v="' + esc(s.id) + '">✓ Mark as complete</button>')) +
        "</div>" +

        (done && !ui.readOnly
          ? '<div class="proofbox">' +
              '<span class="dk">Links</span>' +
              '<div class="loglinks">' +
                (Array.isArray(row.links) ? row.links : []).concat([""]).slice(0, 10).map(function (u, i) {
                  return '<input class="linkin" type="url" data-link="' + esc(row.id) + ':' + i + '" value="' + esc(u) +
                    '" placeholder="Link ' + (i + 1) + '" aria-label="Link ' + (i + 1) + '">';
                }).join("") +
              "</div>" +
              '<span class="dk">Screenshots</span>' +
              shotsHtml(row.imgs, row.id, "rowshotdel", ui.readOnly, row.id) +
              (!(row.links || []).filter(Boolean).length && !(row.imgs || []).length
                ? '<p class="proofwarn">No proof on this one yet — a link or a screenshot.</p>'
                : "") +
              '<textarea class="tinput" rows="2" data-comment="' + esc(row.id) +
                '" placeholder="Anything worth saying about this one">' + esc(row.comment || "") + "</textarea>" +
            "</div>"
          : "") +

        previewHtml(s) +

        (s.how
          ? '<section class="block fold' + (ui.openHow === s.id ? " on" : "") + '">' +
            '<button class="foldbtn" data-act="how" data-v="' + esc(s.id) + '">Why this one matters' +
              '<span class="foldarrow">' + (ui.openHow === s.id ? "▲" : "▼") + "</span></button>" +
            (ui.openHow === s.id ? '<div class="foldbody">' + richText(s.how) + "</div>" : "") +
            "</section>"
          : "") +

        ((s.prompts || []).length
          ? '<section class="block fold' + (ui.openPrompts === s.id ? " on" : "") + '">' +
            '<button class="foldbtn" data-act="prompts" data-v="' + esc(s.id) + '">' +
              (s.prompts || []).length + " prompts that do this job" +
              '<span class="foldarrow">' + (ui.openPrompts === s.id ? "▲" : "▼") + "</span></button>" +
            (ui.openPrompts !== s.id ? "" :
            (s.prompts || []).map(function (p, i) {
              return '<div class="prompt"><div class="prompthead"><b>' + esc(p.title) + "</b>" +
                '<button class="btn btn-sm" data-act="copyprompt" data-v="' + esc(s.id) + ':' + i + '">Copy</button></div>' +
                '<pre class="promptbody">' + esc(p.body) + "</pre></div>";
            }).join("")) + "</section>"
          : "") +
      "</section>" +

      /* ---- the reference ---- */
      '<aside class="taskside">' +

        (rules.length
          ? '<div class="sidecard"><span class="sidekey">Get these right</span>' +
            '<ul class="sidelist">' + rules.map(function (r) {
              return "<li>" + esc(r) + "</li>";
            }).join("") + "</ul></div>"
          : "") +

        '<div class="sidecard">' +
          '<span class="sidekey">Copy this shape</span>' +
          (s.link || s.link2
            ? [s.link, s.link2].filter(Boolean).map(function (u, i) {
                return '<a class="exlink" href="' + esc(u) + '" target="_blank" rel="noopener">' +
                  '<span class="exn">' + (i + 1) + "</span>" +
                  '<span class="ex"><b>' + (i ? "Another" : "One done properly") + "</b><small>" + esc(shortUrl(u)) + "</small></span>" +
                  '<span class="exgo">↗</span></a>';
              }).join("")
            : '<p class="sideempty">No example on this one yet.' +
              (isAdmin() ? " Add one — a job with nothing to look at is not a standard." : "") + "</p>") +
        "</div>" +

        ((s.always || []).length
          ? '<div class="sidecard"><span class="sidekey">Always, on everything</span>' +
            '<ul class="sidelist tight">' + (s.always || []).slice(0, ui.openAlways ? 99 : 3).map(function (a) {
              return "<li>" + esc(a) + "</li>";
            }).join("") + "</ul>" +
            ((s.always || []).length > 3
              ? '<button class="morebtn" data-act="always">' +
                (ui.openAlways ? "Fewer" : "All " + (s.always || []).length) + "</button>"
              : "") +
            "</div>"
          : "") +

        '<div class="sidecard">' +
          '<span class="sidekey">Last few times</span>' +
          (recent.length
            ? '<ul class="recent">' + recent.map(function (r) {
                var n = (r.links || []).filter(Boolean).length + (r.imgs || []).length;
                return '<li><button class="recentgo" data-act="goday" data-v="' + esc(r.date) + '">' +
                  '<span class="rd">' + esc(shortDate(r.date)) + "</span>" +
                  '<span class="rm">' + mins(r.mins) + "</span>" +
                  '<span class="rl' + (n ? "" : " none") + '">' + (n ? n + (n === 1 ? " proof" : " proofs") : "none") + "</span>" +
                "</button></li>";
              }).join("") + "</ul>"
            : '<p class="sideempty">Not done yet.</p>') +
        "</div>" +
      "</aside>" +
    "</div>";
  }

  /* ---------------- what a good one looks like ----------------
     The guidance used to be six paragraphs of prose above the fold. Nobody
     reads six paragraphs before doing a job they do every morning. This shows
     the post instead: rendered the way it will look on the platform it is
     going to, so the shape of a good one is obvious at a glance and the words
     are there to be copied. The prose is still underneath, folded away. */

  function previewHtml(s) {
    var m = s.sample;
    if (!m) return "";
    var body =
      m.platform === "skool" ? skoolPreview(m) :
      m.platform === "instagram" ? igPreview(m) :
      m.platform === "twitter" ? tweetPreview(m) :
      m.platform === "facebook" || m.platform === "linkedin" ? feedPreview(m) :
      m.platform === "stats" ? statsPreview(m) :
      plainPreview(m);
    return '<section class="pv">' +
      '<div class="pvhead"><h3>What a good one looks like</h3>' +
        (m.note ? '<p class="pvnote">' + esc(m.note) + "</p>" : "") + "</div>" +
      '<div class="pvbody pv-' + esc(m.platform) + '">' + body + "</div>" +
    "</section>";
  }

  function avatarFor(name) {
    return '<i class="pvav" style="background:hsl(' + hue(name || "?") + ' 42% 46%)">' +
      esc(initials(name || "?")) + "</i>";
  }
  function paras(t) {
    return String(t || "").split(/\n{2,}/).map(function (p) {
      return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }

  function skoolPreview(m) {
    return '<article class="pvcard">' +
      '<div class="pvtop">' + avatarFor(m.author) +
        "<div><b>" + esc(m.author || "You") + "</b><small>just now</small></div></div>" +
      (m.title ? '<h4 class="pvtitle">' + esc(m.title) + "</h4>" : "") +
      '<div class="pvtext">' + paras(m.body) + "</div>" +
      '<div class="pvbar"><span>♡ 12</span><span>💬 ' + (m.comments || []).length + "</span></div>" +
      ((m.comments || []).length
        ? '<div class="pvcomments">' + m.comments.map(function (c) {
            return '<div class="pvcomment">' + avatarFor(c.by) +
              "<div><b>" + esc(c.by) + "</b><span>" + esc(c.text) + "</span></div></div>";
          }).join("") + "</div>"
        : "") +
    "</article>";
  }

  function igPreview(m) {
    var slides = m.slides || [];
    return '<div class="pvig">' +
      '<div class="pvslide first"><span class="pvsn">1</span><p>' + esc(slides[0] || "") + "</p></div>" +
      '<div class="pvrest">' + slides.slice(1).map(function (t, i) {
        return '<div class="pvslide"><span class="pvsn">' + (i + 2) + "</span><p>" + esc(t) + "</p></div>";
      }).join("") + "</div>" +
    "</div>";
  }

  function tweetPreview(m) {
    return '<article class="pvcard pvtweet">' +
      '<div class="pvtop">' + avatarFor(m.author) +
        "<div><b>" + esc(m.author || "You") + "</b><small>" + esc(m.handle || "") + "</small></div></div>" +
      '<div class="pvtext">' + paras(m.body) + "</div>" +
    "</article>";
  }

  function feedPreview(m) {
    return '<article class="pvcard">' +
      '<div class="pvtop">' + avatarFor(m.author) +
        "<div><b>" + esc(m.author || "You") + "</b><small>" +
        esc(m.role || (m.platform === "facebook" ? "in a group" : "")) + "</small></div></div>" +
      '<div class="pvtext">' + paras(m.body) + "</div>" +
    "</article>";
  }

  function statsPreview(m) {
    return '<div class="pvstats">' + (m.fields || []).map(function (f) {
      return '<div class="pvstat"><span>' + esc(f[0]) + "</span><b>" + esc(f[1]) + "</b></div>";
    }).join("") + "</div>";
  }

  function plainPreview(m) {
    return '<article class="pvcard">' +
      (m.author ? '<div class="pvtop">' + avatarFor(m.author) + "<div><b>" + esc(m.author) + "</b></div></div>" : "") +
      (m.title ? '<h4 class="pvtitle">' + esc(m.title) + "</h4>" : "") +
      '<div class="pvtext">' + paras(m.body) + "</div>" +
    "</article>";
  }

  /* The rules, pulled out of the prose. Bullets are the part worth keeping
     above the fold; the paragraphs around them are the part that made the
     page long. */
  function rulesOf(how) {
    return String(how || "").split("\n")
      .filter(function (l) { return /^\s*[•\-]\s+/.test(l); })
      .map(function (l) { return l.replace(/^\s*[•\-]\s+/, "").trim(); });
  }

  /* Paragraphs and bullets out of the plain text the guidance is written in.
     Not markdown — just blank lines and leading bullets, which is all it uses. */
  function richText(t) {
    return String(t || "").split(/\n{2,}/).map(function (para) {
      var lines = para.split("\n");
      if (lines.every(function (l) { return /^\s*[•\-]\s+/.test(l) || !l.trim(); })) {
        return "<ul>" + lines.filter(function (l) { return l.trim(); })
          .map(function (l) { return "<li>" + esc(l.replace(/^\s*[•\-]\s+/, "")) + "</li>"; }).join("") + "</ul>";
      }
      return "<p>" + esc(para).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }

  function shortUrl(u) {
    return String(u || "").replace(/^https?:\/\//, "").replace(/^www\./, "").slice(0, 44);
  }

  /* Where a link goes, said in a word. "1 2 3" told you a row had three links
     and nothing else; "skool · facebook" says what was actually done. */
  var HOSTS = [
    [/skool\.com/i, "skool"],
    [/(facebook|fb)\.com/i, "facebook"],
    [/instagram\.com/i, "instagram"],
    [/linkedin\.com/i, "linkedin"],
    [/(twitter|x)\.com/i, "x"],
    [/youtube\.com|youtu\.be/i, "youtube"],
    [/tiktok\.com/i, "tiktok"],
    [/docs\.google\.com/i, "doc"],
    [/drive\.google\.com/i, "drive"],
  ];
  function linkWhere(u) {
    for (var i = 0; i < HOSTS.length; i++) if (HOSTS[i][0].test(String(u))) return HOSTS[i][1];
    var m = String(u || "").match(/^https?:\/\/(?:www\.)?([^\/]+)/i);
    return m ? m[1].split(".")[0].slice(0, 10) : "link";
  }

  /* ---------------- the log ----------------
     Built like the video board, because that is the one people can read: tiles
     that say where the work stands, chips that narrow it, a search box, and
     one dense table. The old page showed a single day as a stack of tall cards
     with every input open at once, which made 168 rows invisible and adding
     one a chore. */

  function inScope(r) {
    if (ui.scope === "day") return r.date === ui.date;
    if (ui.scope === "week") {
      var from = shiftDate(ui.date, -6);
      return r.date >= from && r.date <= ui.date;
    }
    return true;
  }
  function matches(r) {
    var q = ui.q.trim().toLowerCase();
    if (!q) return true;
    return (String(r.task) + " " + String(r.comment || "") + " " + String(r.inspiration || "") + " " +
            (r.links || []).join(" ")).toLowerCase().indexOf(q) !== -1;
  }
  function noProof(r) {
    return !(r.links || []).filter(Boolean).length && !(r.imgs || []).length;
  }

  /* Every row for the person being looked at, before the chips and the search
     — the tiles count against this, so pressing a chip never changes them. */
  function scopedRows() {
    return logFor(viewing()).filter(inScope);
  }
  function visibleRows() {
    return scopedRows().filter(function (r) {
      if (ui.status.length && ui.status.indexOf(r.status) === -1) return false;
      if (ui.status.indexOf("__noproof") !== -1 && !noProof(r)) return false;
      return matches(r);
    }).sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return String(a.id).localeCompare(String(b.id));
    });
  }
  function filtering() { return ui.status.length > 0 || ui.q.trim() !== ""; }

  function todayPane() {
    var name = viewing();
    if (!name) {
      return '<p class="lede">There is no profile on this board under your name yet. Ask Yar to add one.</p>';
    }
    var all = scopedRows();
    var rows = visibleRows();
    var todo = missingToday(name, ui.date);

    var n = { done: 0, reviewed: 0, redo: 0, noproof: 0, mins: 0 };
    all.forEach(function (r) {
      n[r.status] = (n[r.status] || 0) + 1;
      n.mins += payMinsOf(r);
      if (noProof(r)) n.noproof++;
    });
    var days = {};
    all.forEach(function (r) { days[r.date] = 1; });

    return (
      '<div class="stats">' +
        tile("Logged", all.length, Object.keys(days).length + (Object.keys(days).length === 1 ? " day" : " days") + " · " + mins(n.mins), "var(--accent)", "") +
        tile("Waiting on review", n.done, n.done ? "handed in, not looked at" : "nothing pending", "var(--warn-dot)", "done") +
        tile("Reviewed", n.reviewed, "accepted — what pays", "var(--ok)", "reviewed") +
        tile("Needs redoing", n.redo, n.redo ? "came back" : "none came back", "var(--bad)", "redo") +
        tile("No proof", n.noproof, "no link on the row", "var(--line-strong)", "__noproof") +
      "</div>" +

      '<div class="filters"><div class="filterrow">' +
        '<label class="search"><svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">' +
          '<circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".5"/>' +
          '<path d="M11 11l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".5"/></svg>' +
          '<input id="q" value="' + esc(ui.q) + '" placeholder="Search tasks, comments, links" aria-label="Search"></label>' +
        /* No free-form add. A row is created by marking a task complete, so
           every row carries a task, an estimate to be judged against and a
           standard — a hand-typed row has none of those and is what made the
           spreadsheet unauditable. */
        '<a class="btn btn-primary" href="' + BASE + '" data-tab="tasks">Log work on Tasks</a>' +
        (todo.length && !ui.readOnly
          ? '<button class="btn" data-act="fillday" title="Adds a row for each daily standard that has none on ' +
            esc(longDate(ui.date)) + '">+ Add ' + todo.length + " standard" + (todo.length === 1 ? "" : "s") + "</button>"
          : "") +
        (isAdmin() ? personPicker() : "") +
      "</div>" +

      '<div class="chiprow"><span class="chipkey">Show</span><div class="chips">' +
        [["all", "Everything"], ["week", "Last 7 days"], ["day", "One day"]].map(function (s) {
          return '<button class="chip" data-act="scope" data-v="' + s[0] + '" aria-pressed="' +
            (ui.scope === s[0]) + '">' + s[1] + "</button>";
        }).join("") +
        (ui.scope === "all" ? "" :
          '<span class="daypick">' +
            '<button class="chip" data-act="day" data-v="-1" title="Previous day">←</button>' +
            '<input class="dayin" type="date" id="daypick" value="' + esc(ui.date) + '" aria-label="Date">' +
            '<button class="chip" data-act="day" data-v="1" title="Next day">→</button>' +
            '<button class="chip" data-act="today">Today</button>' +
          "</span>") +
      "</div></div>" +

      (filtering()
        ? '<div class="chiprow sumrow"><span class="chipkey">Showing</span><div class="chips">' +
            '<span class="sumtext"><b>' + rows.length + "</b> of " + all.length + "</span>" +
            '<button class="chip clearchip" data-act="fclear">Clear filters</button>' +
          "</div></div>"
        : "") +
      "</div>" +

      (all.length
        ? '<div class="tablewrap"><table class="board logboard"><thead><tr>' +
            "<th></th><th>Date</th><th>Task</th><th>Time</th><th>Status</th><th>Work</th><th></th>" +
          "</tr></thead><tbody>" +
            (rows.length
              ? rows.map(logRowHtml).join("")
              : '<tr><td colspan="7" class="emptyrow">Nothing matches this filter.</td></tr>') +
          "</tbody></table></div>"
        : emptyDayHtml(name))
    );
  }

  function tile(k, v, hint, bar, filter) {
    var on = filter && ui.status.indexOf(filter) !== -1;
    return '<button class="stat' + (on ? " on" : "") + '" style="--bar:' + bar + '"' +
      (filter ? ' data-act="fstatus" data-v="' + esc(filter) + '" aria-pressed="' + on + '"' : "") + ">" +
      '<div class="k">' + esc(k) + '</div><div class="v">' + v + '</div><div class="h">' + esc(hint) + "</div></button>";
  }

  /* An empty day is normal; an empty day that looks like an empty board is
     not. Say which it is, and offer the way back to the work. */
  function emptyDayHtml(name) {
    var all = logFor(name);
    if (!all.length) {
      var others = (state.log || []).length;
      return '<p class="lede">Nothing logged under <b>' + esc(name) + "</b> on any day." +
        (others ? " There are <b>" + others + "</b> rows on this board under other names — " +
          "use the picker above." : " Press <b>+ Log a task</b> to start one.") + "</p>";
    }
    var last = all.map(function (r) { return r.date; }).sort().pop();
    return '<p class="lede">Nothing in this range. ' +
      esc(name) + " last logged on <b>" + esc(longDate(last)) + "</b>" +
      ' — <button class="btn btn-sm" data-act="goday" data-v="' + esc(last) + '">go there</button>' +
      ', or press <b>Everything</b> above.</p>';
  }

  function personPicker() {
    return '<select class="sel personpick" id="personpick" aria-label="Whose board">' +
      people().map(function (p) {
        return '<option value="' + esc(p.name) + '"' + (p.name === viewing() ? " selected" : "") + ">" + esc(p.name) + "</option>";
      }).join("") + "</select>";
  }

  /* One line per row, and the detail only for the row you opened. Ten link
     boxes on every row at once was the thing that made this page unreadable. */
  function logRowHtml(r) {
    var std = (state.standards || []).filter(function (s) { return s.id === r.standardId; })[0];
    var links = (Array.isArray(r.links) ? r.links : []).filter(Boolean);
    var ro = ui.readOnly;
    var open = ui.open === r.id;

    var head = '<tr class="logtr logs-' + esc(r.status) + (open ? " is-open" : "") + '" data-i="' + esc(r.id) + '">' +
      /* An SVG chevron rather than a ▸ glyph: the character is not in every
         system font and was falling back to a full stop. */
      '<td class="rownum"><button class="disc" data-act="open" data-v="' + esc(r.id) + '" aria-expanded="' + open +
        '" title="' + (open ? "Close" : "Open to edit links and comments") + '">' +
        '<svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true">' +
          '<path d="M3 1.5L6.5 5L3 8.5" fill="none" stroke="currentColor" stroke-width="1.6" ' +
          'stroke-linecap="round" stroke-linejoin="round"/></svg></button></td>' +
      '<td class="datecell"><span class="dcell">' + esc(shortDate(r.date)) + "</span></td>" +
      '<td class="titlecell"><div class="titlerow">' +
        (ro || !open
          ? '<span class="t" title="' + esc(r.task) + '">' + esc(r.task || "Untitled task") + "</span>"
          : '<div class="tin" contenteditable="plaintext-only" data-task="' + esc(r.id) +
            '" role="textbox" aria-label="Task">' + esc(r.task) + "</div>") +
        (std && std.link
          ? '<a class="refmark" href="' + esc(std.link) + '" target="_blank" rel="noopener" title="What this looks like done properly">★</a>'
          : "") +
      "</div></td>" +
      /* The allocation on the task, not a stopwatch reading. Nobody logs time
         any more, so there is nothing here to type over. */
      '<td class="minscell">' + mins(payMinsOf(r)) + "</td>" +
      '<td class="statuscell">' +
        (ro ? '<span class="vchip st-' + esc(r.status) + '">' + esc(statusShort(r.status)) + "</span>"
            : '<select class="sel status-select st-' + esc(r.status) + '" data-status="' + esc(r.id) + '" aria-label="Status">' +
              STATUS.map(function (s) {
                var block = s.id === "reviewed" && !isAdmin() && r.status !== "reviewed";
                return block ? "" : '<option value="' + s.id + '"' + (s.id === r.status ? " selected" : "") + ">" + esc(s.short) + "</option>";
              }).join("") + "</select>") +
      "</td>" +
      '<td class="workcell">' +
        (links.length
          ? (function () {
              /* Group by where they went, so five Skool posts read as one
                 "skool ×5" rather than five identical numbered chips. */
              var seen = [], byWhere = {};
              links.forEach(function (u) {
                var w = linkWhere(u);
                if (!byWhere[w]) { byWhere[w] = { n: 0, first: u }; seen.push(w); }
                byWhere[w].n++;
              });
              return seen.slice(0, 3).map(function (w) {
                var g = byWhere[w];
                return '<a class="wlink" href="' + esc(g.first) + '" target="_blank" rel="noopener" title="' +
                  esc(g.first) + '">' + esc(w) + (g.n > 1 ? '<b>×' + g.n + "</b>" : "") + "</a>";
              }).join("") + (seen.length > 3 ? '<span class="morelinks">+' + (seen.length - 3) + "</span>" : "");
            })()
          : (r.imgs || []).length ? ""
          : '<span class="noproof" title="No link and no screenshot — Yar cannot see what was worked on">no proof</span>') +
        ((r.imgs || []).length
          ? '<span class="hasshot" title="' + (r.imgs || []).length + ' screenshot' +
            ((r.imgs || []).length === 1 ? "" : "s") + '">▣ ' + (r.imgs || []).length + "</span>"
          : "") +
        (r.comment ? '<span class="hascomment" title="' + esc(r.comment) + '">💬</span>' : "") +
      "</td>" +
      '<td class="rowtools">' + (ro ? "" :
        '<button class="hookdel" data-act="delrow" data-v="' + esc(r.id) + '" title="Remove this row">×</button>') + "</td>" +
    "</tr>";

    if (!open) return head;

    /* The spare box grows as it is filled, so nobody is shown ten empty
       slots and nobody is capped at three. */
    var boxes = ro ? links : (Array.isArray(r.links) ? r.links : []).concat([""]).slice(0, 10);
    return head +
      '<tr class="logdetail"><td></td><td colspan="6"><div class="detailbox">' +
        '<div class="dfield"><span class="dk">Links to the work</span>' +
          '<div class="loglinks">' + (boxes.length ? boxes.map(function (u, i) {
            if (ro) {
              return '<a class="chip-link" href="' + esc(u) + '" target="_blank" rel="noopener">' +
                '<span class="chip-txt">Link ' + (i + 1) + '</span><span class="chip-go">↗</span></a>';
            }
            return '<input class="linkin" type="url" data-link="' + esc(r.id) + ':' + i + '" value="' + esc(u) +
              '" placeholder="Link ' + (i + 1) + '" aria-label="Link ' + (i + 1) + '">';
          }).join("") : '<span class="note">No links on this row.</span>') + "</div>" +
        "</div>" +
        '<div class="dfield"><span class="dk">Inspiration from</span>' +
          (ro ? '<span class="dv">' + (esc(r.inspiration || "") || "—") + "</span>"
              : '<input class="tinput" type="text" data-insp="' + esc(r.id) + '" value="' + esc(r.inspiration || "") +
                '" placeholder="Where the idea came from">') +
        "</div>" +
        '<div class="dfield"><span class="dk">Comment</span>' +
          (ro ? '<span class="dv">' + (esc(r.comment || "") || "—") + "</span>"
              : '<textarea class="tinput" rows="2" data-comment="' + esc(r.id) +
                '" placeholder="Anything worth saying about this one">' + esc(r.comment || "") + "</textarea>") +
        "</div>" +
      "</div></td></tr>";
  }

  /* ---------------- finances ----------------
     Revenue is dollars off the two Skool dashboards; wages are rupees an hour
     against hours actually logged on this board. So every total depends on an
     exchange rate, and that rate is shown and editable rather than buried in
     the arithmetic — it is the number most likely to be wrong.

     Nothing here is estimated. A person with no logged hours is reported as
     having none, not filled in with a guess: a made-up cost reads as a fact
     and is worse than a hole. */

  function fin() {
    var f = state.finance || {};
    return {
      fx: Number(f.fx) || 0,
      asOf: f.asOf || "",
      communities: f.communities || [],
      costs: f.costs || [],
    };
  }
  /* A cost is billed in one currency and shown in both. Whichever field is
     set is the real number; the other is worked out from the rate. */
  function costUsd(c, fx) {
    if (c.usd !== "" && c.usd != null && isFinite(Number(c.usd))) return Number(c.usd);
    if (fx && c.pkr !== "" && c.pkr != null && isFinite(Number(c.pkr))) return Number(c.pkr) / fx;
    return 0;
  }
  function costPkr(c, fx) {
    if (c.pkr !== "" && c.pkr != null && isFinite(Number(c.pkr))) return Number(c.pkr);
    return costUsd(c, fx) * (fx || 0);
  }
  function costIn(c) {
    return c.pkr !== "" && c.pkr != null && isFinite(Number(c.pkr)) ? "pkr" : "usd";
  }

  function usd(n) {
    var v = Number(n) || 0;
    return "$" + Math.round(v).toLocaleString();
  }
  function usd2(n) {
    var v = Number(n) || 0;
    return "$" + (Math.abs(v) < 100 ? v.toFixed(2) : Math.round(v).toLocaleString());
  }

  /* Months that have any logged work, newest first. */
  function loggedMonths() {
    var m = {};
    (state.log || []).forEach(function (r) { if (r.date) m[String(r.date).slice(0, 7)] = 1; });
    return Object.keys(m).sort().reverse();
  }
  function monthLabel(ym) {
    var p = String(ym).split("-");
    return MONTHS[Number(p[1]) - 1] + " " + p[0];
  }
  function currentMonth() {
    var ms = loggedMonths();
    if (ui.finMonth && ms.indexOf(ui.finMonth) !== -1) return ui.finMonth;
    return ms[0] || todayISO().slice(0, 7);
  }

  /* The wage total for a month. An admin adds it up from the rates in front
     of them; a member is sent the sum by the API, because their copy of the
     board has had everybody else's rate stripped out of it. */
  function wagesPkr(ym) {
    if (isSuper()) return labourFor(ym).reduce(function (n, x) { return n + x.pkr; }, 0);
    var m = (state.finance || {}).wagesPkrByMonth || {};
    return Number(m[ym]) || 0;
  }

  /* What each person's reviewed tasks paid in the month — the same amounts
     the Payments page owes them. */
  function labourFor(ym) {
    var f = fin();
    return people().map(function (p) {
      var tasks = 0, days = {}, pkr = 0;
      (state.log || []).forEach(function (r) {
        if (String(r.owner || "").trim().toLowerCase() !== String(p.name).trim().toLowerCase()) return;
        if (String(r.date || "").slice(0, 7) !== ym || r.status !== "reviewed") return;
        tasks++;
        days[r.date] = 1;
        pkr += amountFor(r);
      });
      return { name: p.name, tasks: tasks, days: Object.keys(days).length, pkr: pkr, usd: f.fx ? pkr / f.fx : 0 };
    });
  }

  function financePane() {
    var f = fin();
    var ym = currentMonth();
    var months = loggedMonths();
    var labour = labourFor(ym);

    var revenue = f.communities.reduce(function (n, c) { return n + (Number(c.mrr) || 0); }, 0);
    var newMrr = f.communities.reduce(function (n, c) { return n + (Number(c.newMrr30) || 0); }, 0);
    var membersAll = f.communities.reduce(function (n, c) { return n + (Number(c.members) || 0); }, 0);
    var signups = f.communities.reduce(function (n, c) { return n + (Number(c.signups30) || 0); }, 0);
    var wagePkrTotal = wagesPkr(ym);
    var wages = f.fx ? wagePkrTotal / f.fx : 0;
    var fixed = f.costs.reduce(function (n, c) { return n + costUsd(c, f.fx); }, 0);
    var cost = wages + fixed;
    var profit = revenue - cost;
    var margin = revenue ? (profit / revenue) * 100 : 0;


    return (
      '<div class="finhead">' +
        '<div class="finmonths">' +
          '<span class="chipkey">Wages for</span>' +
          months.slice(0, 4).map(function (m) {
            return '<button class="chip" data-act="finmonth" data-v="' + esc(m) + '" aria-pressed="' +
              (m === ym) + '">' + esc(monthLabel(m)) + "</button>";
          }).join("") +
        "</div>" +
        '<div class="finasof">Skool figures as of <b>' + esc(f.asOf ? longDate(f.asOf) : "—") + "</b>" +
          (ui.readOnly || !isSuper() ? "" : ' · <button class="chip" data-act="finedit">' +
            (ui.finEdit ? "Done editing" : "Edit the numbers") + "</button>") + "</div>" +
      "</div>" +

      '<div class="stats fintiles">' +
        finTile("Revenue", usd(revenue), "a month, both communities", "var(--ok)") +
        finTile("Cost", usd(cost), "wages " + usd(wages) + " + fixed " + usd(fixed), "var(--warn-dot)") +
        finTile(profit >= 0 ? "Profit" : "Loss", usd(Math.abs(profit)), "a month" + (revenue ? " · " + margin.toFixed(0) + "% margin" : ""),
          profit >= 0 ? "var(--accent)" : "var(--bad)") +
        finTile("Members", membersAll.toLocaleString(), usd2(membersAll ? revenue / membersAll : 0) + " each a month", "var(--line-strong)") +
      "</div>" +

      (f.fx
        ? ""
        : '<div class="banner warn"><span>No exchange rate is set, so wages in rupees cannot be turned into ' +
          "dollars and every total below is wrong. Set it under Edit the numbers.</span></div>") +

      /* ---- revenue ---- */
      '<section class="finblock"><h3>Where the money comes from</h3>' +
        '<div class="tablewrap"><table class="board fintable"><thead><tr>' +
          "<th>Community</th><th>Members</th><th>MRR</th><th>Per member</th>" +
          "<th>Visitors 30d</th><th>Signups</th><th>Conversion</th><th>New MRR</th>" +
        "</tr></thead><tbody>" +
        f.communities.map(function (c, i) {
          var mem = Number(c.members) || 0, mrr = Number(c.mrr) || 0;
          var vis = Number(c.visitors30) || 0, sig = Number(c.signups30) || 0;
          return "<tr>" +
            "<td><b>" + esc(c.name || c.code) + "</b></td>" +
            "<td>" + mem.toLocaleString() + "</td>" +
            "<td>" + (ui.finEdit && !ui.readOnly && isSuper()
              ? '<input class="finin" type="number" min="0" step="1" data-fin="c:' + i + ':mrr" value="' + esc(String(c.mrr)) + '">'
              : "<b>" + usd(mrr) + "</b>") + "</td>" +
            "<td>" + usd2(mem ? mrr / mem : 0) + "</td>" +
            "<td>" + vis.toLocaleString() + "</td>" +
            "<td>" + sig + "</td>" +
            "<td>" + (vis ? ((sig / vis) * 100).toFixed(1) + "%" : "—") + "</td>" +
            "<td>" + usd(c.newMrr30) + "</td>" +
          "</tr>";
        }).join("") +
        '<tr class="fintotal"><td><b>Total</b></td><td>' + membersAll.toLocaleString() + "</td>" +
          "<td><b>" + usd(revenue) + "</b></td><td>" + usd2(membersAll ? revenue / membersAll : 0) + "</td>" +
          "<td>" + f.communities.reduce(function (n, c) { return n + (Number(c.visitors30) || 0); }, 0).toLocaleString() + "</td>" +
          "<td>" + signups + "</td><td></td><td>" + usd(newMrr) + "</td></tr>" +
        "</tbody></table></div>" +
      "</section>" +

      /* ---- cost ---- */
      '<section class="finblock"><h3>What it costs</h3>' +
        '<p class="blocknote">Wages are the tasks reviewed on this board in ' + esc(monthLabel(ym)) +
          ", at what each task pays" + (f.fx ? ", converted at " + f.fx + " PKR to the dollar" : "") + ".</p>" +
        '<div class="tablewrap"><table class="board fintable"><thead><tr>' +
          "<th>Who or what</th><th>Tasks</th><th>Days</th><th>PKR</th><th>USD</th>" +
        "</tr></thead><tbody>" +
        (isSuper() ? labour.map(function (p) {
          return "<tr" + (!p.tasks ? ' class="dim"' : "") + ">" +
            "<td><b>" + esc(p.name) + "</b></td>" +
            "<td>" + (p.tasks || '<span class="noproof">nothing reviewed</span>') + "</td>" +
            "<td>" + (p.days || "—") + "</td>" +
            "<td>" + Math.round(p.pkr).toLocaleString() + "</td>" +
            "<td>" + usd(p.usd) + "</td>" +
          "</tr>";
        }).join("")
          /* A member sees what the team costs, not what each person on it
             earns. The board has always kept a rate between its owner and the
             admin; showing the business its own position is not a reason to
             stop. The figure comes from the API, which can add up rates this
             browser was never sent. */
          : '<tr><td><b>The team</b></td><td colspan="2"><span class="note">' +
            "Everyone’s reviewed tasks at what each pays. What each person earns stays private." +
            "</span></td><td>" + Math.round(wagePkrTotal).toLocaleString() + "</td>" +
            "<td>" + usd(wages) + "</td></tr>") +
        f.costs.map(function (c, i) {
          var inCur = costIn(c);
          var edit = ui.finEdit && !ui.readOnly && isSuper();
          /* The box is on the side the bill is actually in, so nobody edits a
             derived number and wonders why it moves when the rate does. */
          return "<tr><td>" + esc(c.label) +
              '<span class="billedin">billed in ' + (inCur === "pkr" ? "PKR" : "USD") + "</span></td>" +
            '<td colspan="2"></td>' +
            "<td>" + (edit && inCur === "pkr"
              ? '<input class="finin" type="number" min="0" step="50" data-fin="k:' + i + ':pkr" value="' + esc(String(c.pkr)) + '">'
              : Math.round(costPkr(c, f.fx)).toLocaleString()) + "</td>" +
            "<td>" + (edit && inCur === "usd"
              ? '<input class="finin" type="number" min="0" step="1" data-fin="k:' + i + ':usd" value="' + esc(String(c.usd)) + '">'
              : usd(costUsd(c, f.fx))) + "</td></tr>";
        }).join("") +
        '<tr class="fintotal"><td><b>Total</b></td><td colspan="2"></td>' +
          "<td><b>" + Math.round(wagePkrTotal + fixed * (f.fx || 0)).toLocaleString() + "</b></td>" +
          "<td><b>" + usd(cost) + "</b></td></tr>" +
        "</tbody></table></div>" +
        (ui.finEdit && !ui.readOnly && isSuper()
          ? '<button class="btn btn-sm" data-act="addcost">+ Add a cost</button>' : "") +
      "</section>" +

      /* ---- the bottom line ---- */
      '<section class="finblock"><h3>What is left</h3>' +
        '<div class="pnl">' +
          pnlRow("Revenue", usd(revenue), "ok") +
          pnlRow("Wages", "− " + usd(wages), "") +
          pnlRow("Fixed costs", "− " + usd(fixed), "") +
          pnlRow(profit >= 0 ? "Profit" : "Loss", usd(Math.abs(profit)), profit >= 0 ? "big ok" : "big bad") +
        "</div>" +
        '<p class="blocknote">' +
          (signups ? "Each of the " + signups + " signups in the last 30 days cost " +
            usd2(signups ? cost / signups : 0) + " in running the operation. " : "") +
          (profit < 0 && membersAll
            ? "Breaking even needs about " + Math.ceil((cost - revenue) / (revenue / membersAll)) +
              " more members at the current revenue per member."
            : profit >= 0 ? "The operation pays for itself at this size." : "") +
        "</p>" +
      "</section>" +

      (ui.finEdit && !ui.readOnly && isSuper()
        ? '<section class="finblock"><h3>The numbers behind this</h3>' +
          '<div class="stdedit">' +
            '<div class="stdgrid">' +
              fieldWrap("PKR to the dollar",
                '<input class="tinput" type="number" min="0" step="1" data-fin="fx" value="' + esc(String(f.fx)) + '">',
                "Wages are rupees, revenue is dollars. Everything hangs on this.") +
              fieldWrap("Skool figures read on",
                '<input class="tinput" type="date" data-fin="asOf" value="' + esc(f.asOf) + '">',
                "So nobody has to guess how old they are.") +
            "</div>" +
            f.communities.map(function (c, i) {
              return '<div class="fieldwrap"><span class="dk">' + esc(c.name) + "</span>" +
                '<div class="stdgrid">' +
                  ["members", "mrr", "visitors30", "signups30", "newMrr30"].map(function (k) {
                    return '<label class="finlab"><span>' + esc(k) + "</span>" +
                      '<input class="tinput" type="number" min="0" step="1" data-fin="c:' + i + ":" + k + '" value="' +
                      esc(String(c[k])) + '"></label>';
                  }).join("") +
                "</div></div>";
            }).join("") +
            '<div class="stdeditfoot">' + saveButton("finance", "Save figures") + "</div>" +
          "</div></section>"
        : "")
    );
  }

  function finTile(k, v, hint, bar) {
    return '<div class="stat" style="--bar:' + bar + '">' +
      '<div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + '</div>' +
      '<div class="h">' + esc(hint) + "</div></div>";
  }
  function pnlRow(k, v, cls) {
    return '<div class="pnlrow ' + cls + '"><span>' + esc(k) + "</span><b>" + esc(v) + "</b></div>";
  }

  /* ---------------- feedback ----------------
     Everything Yar has told the team, in one place, because until now it was
     in WhatsApp and gone by the next morning.

     Three kinds sit here together, because to the person reading it they are
     the same thing — being told something:

       written   a note Yar wrote, to somebody or to everyone, dated
       sent back a row he refused, which is feedback whether or not a reason
                 was typed with it
       said      a comment left on the row itself when the day was logged

     The standing version — what good looks like, every day — is not repeated
     here. It lives on the task it belongs to, which is where somebody about
     to do that task will actually read it, and is linked from the bottom. */

  function feedbackList() { return state.feedback || []; }

  function stdById(id) {
    return (state.standards || []).filter(function (s) { return s.id === id; })[0] || null;
  }
  function stdLabel(id) {
    var s = stdById(id);
    return s ? labelFor(s) : "";
  }

  /* Everything, as one dated list. */
  function allFeedback() {
    var out = [];

    feedbackList().forEach(function (f) {
      out.push({
        kind: "written", id: f.id, at: f.at, date: String(f.at || "").slice(0, 10),
        to: f.to || "", by: f.by || "Yar", text: f.text || "",
        standardId: f.standardId || "",
      });
    });

    (state.log || []).forEach(function (r) {
      if (r.status === "redo") {
        out.push({
          kind: "redo", id: "redo_" + r.id, at: r.date, date: r.date,
          to: r.owner, by: "Yar", text: String(r.comment || "").trim(),
          standardId: r.standardId || "", rowId: r.id, task: r.task,
        });
      } else if (String(r.comment || "").trim()) {
        out.push({
          kind: "said", id: "note_" + r.id, at: r.date, date: r.date,
          to: r.owner, by: "", text: String(r.comment).trim(),
          standardId: r.standardId || "", rowId: r.id, task: r.task,
        });
      }
    });

    /* Only things somebody actually wrote. A row sent back with nothing typed
       on it is an absence, not feedback — it belongs in the count at the top,
       where it can be dealt with, rather than as an entry in a list of things
       that were said. */
    return out
      .filter(function (f) { return String(f.text || "").trim(); })
      .sort(function (a, b) { return a.at < b.at ? 1 : a.at > b.at ? -1 : 0; });
  }

  function feedbackPane() {
    var mineOnly = !isAdmin();
    var meName = String(myName()).trim().toLowerCase();
    var all = allFeedback().filter(function (f) {
      if (!mineOnly) return true;
      /* Addressed to you, or to everybody. */
      return !f.to || String(f.to).trim().toLowerCase() === meName;
    });

    var who = ui.fbWho || "";
    var rows = all.filter(function (f) {
      if (!who) return true;
      return String(f.to).trim().toLowerCase() === who.toLowerCase();
    });

    /* Counted off the log rather than off the list above, which no longer
       carries them. */
    var unexplained = (state.log || []).filter(function (r) {
      if (r.status !== "redo" || String(r.comment || "").trim()) return false;
      return !mineOnly || String(r.owner || "").trim().toLowerCase() === meName;
    });

    return (
      fbToolsPane() +

      (isAdmin() && people().length > 1
        ? '<div class="chiprow"><span class="chipkey">For</span><div class="chips">' +
            '<button class="chip" data-act="fbwho" data-v="" aria-pressed="' + (!who) + '">Everyone</button>' +
            people().map(function (p) {
              return '<button class="chip" data-act="fbwho" data-v="' + esc(p.name) + '" aria-pressed="' +
                (who.toLowerCase() === String(p.name).toLowerCase()) + '">' + esc(p.name) + "</button>";
            }).join("") +
          "</div></div>"
        : "") +

      (rows.length
        ? '<div class="fblist">' + rows.map(fbItemHtml).join("") + "</div>"
        : '<p class="lede">' +
          (mineOnly ? "Nothing has been written to you yet."
                    : "No comments yet. What you write here is the first thing they see.") + "</p>") +

      '<section class="finblock"><h3>What holds every day</h3>' +
        '<p class="blocknote">The standing version is on the task it belongs to, under ' +
          "<b>How to do it well</b> — where somebody about to do that job will read it.</p>" +
        '<div class="fbstd">' + standardsFor(viewing(), null).map(function (s) {
          return '<button class="fbstdbtn" data-act="fbtask" data-v="' + esc(s.id) + '">' +
            esc(labelFor(s)) + "</button>";
        }).join("") + "</div>" +
      "</section>"
    );
  }

  /* The two things on this page that are not simply a list of what was said:
     the box Yar writes feedback in, and the rows that were sent back without
     a reason. Both live behind their own handlers, so they stay inside
     #skool-root even when the list itself is rendered by the video board. */
  function fbToolsPane() {
    /* These were worked out in feedbackPane, which no longer draws this page.
       A row sent back with nothing typed on it is the one kind of feedback
       nobody can act on, so it is counted here and chased here. */
    var mineOnly = !isAdmin();
    var meName = String(myName()).trim().toLowerCase();
    var unexplained = (state.log || []).filter(function (r) {
      if (r.status !== "redo" || String(r.comment || "").trim()) return false;
      return !mineOnly || String(r.owner || "").trim().toLowerCase() === meName;
    });
    return (
      /* The composer is gone from the Feedback page. Feedback belongs on the
         thing it is about — the task row, or the video — and a note written
         against nothing in particular was the weakest feedback on the board. */

      (unexplained.length
        ? '<div class="banner warn"><span><b>' + unexplained.length +
          (unexplained.length === 1 ? " row was" : " rows were") +
          "</b> sent back with no reason written on " +
          (unexplained.length === 1 ? "it" : "them") + ". Being told to redo something " +
          "without being told what was wrong is the one kind of comment nobody can act on." +
          (isAdmin() && !ui.readOnly
            ? ' <button class="chip" data-act="unex">' +
              (ui.showUnex ? "Hide them" : "Write the reasons") + "</button>"
            : "") +
          "</span></div>" +
          (ui.showUnex && isAdmin() && !ui.readOnly
            ? '<div class="fblist unex">' + unexplained.map(function (r) {
                return '<article class="fbitem k-redo">' +
                  '<div class="fbtop">' +
                    '<i class="avatar tiny" style="background:hsl(' + hue(r.owner) + ' 42% 46%)">' +
                      esc(initials(r.owner)) + "</i>" +
                    "<b>" + esc(r.owner) + "</b>" +
                    (r.standardId ? '<span class="fbtag">' + esc(stdLabel(r.standardId)) + "</span>" : "") +
                    '<span class="fbwhen">' + esc(longDate(r.date)) + "</span>" +
                  "</div>" +
                  '<p class="fbmissing">' + esc(String(r.task).slice(0, 70)) +
                    ' <button class="btn btn-sm" data-act="fbwhy" data-v="' + esc(r.id) + '">Say why</button></p>' +
                  (ui.fbWhy === r.id
                    ? '<div class="fbwhybox">' +
                        '<textarea class="tinput" id="fb-why" rows="2" placeholder="What was wrong with it?"></textarea>' +
                        '<button class="btn btn-sm btn-primary" data-act="fbwhysave" data-v="' + esc(r.id) + '">Save</button>' +
                      "</div>"
                    : "") +
                "</article>";
              }).join("") + "</div>"
            : "")
        : "")
    );
  }

  function fbComposer() {
    var d = ui.fbDraft || { to: "", standardId: "", text: "" };
    return '<div class="fbnew">' +
      '<div class="fbnewhead"><span class="dk">Write a comment</span></div>' +
      '<div class="fbnewrow">' +
        '<select class="sel" id="fb-to" aria-label="Who it is for">' +
          '<option value=""' + (d.to ? "" : " selected") + ">Everyone</option>" +
          people().map(function (p) {
            return '<option value="' + esc(p.name) + '"' + (d.to === p.name ? " selected" : "") + ">" + esc(p.name) + "</option>";
          }).join("") +
        "</select>" +
        '<select class="sel" id="fb-std" aria-label="Which task">' +
          '<option value=""' + (d.standardId ? "" : " selected") + ">Not about one task</option>" +
          standardsFor(d.to || viewing(), null).map(function (s) {
            return '<option value="' + esc(s.id) + '"' + (d.standardId === s.id ? " selected" : "") + ">" + esc(labelFor(s)) + "</option>";
          }).join("") +
        "</select>" +
      "</div>" +
      '<textarea class="tinput" id="fb-text" rows="3" placeholder="Say the thing that would change what they do tomorrow. Specific beats general.">' +
        esc(d.text || "") + "</textarea>" +
      '<div class="fbnewfoot">' +
        '<span class="note">Goes on their Comments page, and stays there.</span>' +
        '<button class="btn btn-primary" data-act="fbsave"' + (String(d.text || "").trim() ? "" : " disabled") + ">Send it</button>" +
      "</div>" +
    "</div>";
  }

  function fbItemHtml(f) {
    var std = f.standardId ? stdLabel(f.standardId) : "";
    var kind = f.kind === "redo" ? "sent back" : f.kind === "said" ? "noted on the day" : "";
    return '<article class="fbitem k-' + esc(f.kind) + '">' +
      '<div class="fbtop">' +
        '<i class="avatar tiny" style="background:hsl(' + hue(f.to || "team") + ' 42% 46%)">' +
          esc(f.to ? initials(f.to) : "ALL") + "</i>" +
        '<b>' + esc(f.to || "Everyone") + "</b>" +
        (std ? '<button class="fbtag" data-act="fbtask" data-v="' + esc(f.standardId) + '">' + esc(std) + "</button>" : "") +
        (kind ? '<span class="fbkind">' + esc(kind) + "</span>" : "") +
        '<span class="fbwhen">' + esc(longDate(f.date)) + "</span>" +
        (f.kind === "written" && isAdmin() && !ui.readOnly
          ? '<button class="hookdel" data-act="fbdel" data-v="' + esc(f.id) + '" title="Remove this">&times;</button>' : "") +
      "</div>" +
      '<p class="fbtext">' + esc(f.text) + "</p>" +
    "</article>";
  }

  /* ---------------- payments ----------------
     Hourly, from the rows Yar has actually reviewed. Reviewed rather than
     merely handed in, for the same reason a video becomes payable at Ready to
     be Published: somebody decided it was usable. */
  /* ---------------- what a task is worth ----------------

     Every task carries its own price and pays that to whoever does it. It
     used to be allocated-minutes times the person's hourly rate, which meant
     the same job paid Asif 550 and Rehman 430, and every rate change quietly
     repriced somebody's whole month. Nobody has time to keep recalculating
     that, and nobody should have to.

     A few jobs genuinely cannot be priced in advance — reviewing whatever
     videos turned up that day is however many there were — so a task can be
     marked hourly instead, and those pay the person's rate for the minutes
     they actually logged. That is the exception, and it looks like one. */

  /* The starting price for each task, in rupees, shared by everyone who has
     it on their list.
   *
   * Seeded rather than migrated: it is worked out here on load, so it is the
   * same number every time and nothing has to be written to the board for the
   * figures to appear. The moment an admin types over one and saves, the
   * stored number wins and this is never consulted for that task again.
   *
   * The numbers are the higher of what the two of them were being paid for
   * the same job, rounded up to the nearest 25 — so one price per task and
   * nobody's pay went down on the day this changed. They are all editable on
   * the "What each task is worth" table. */
  var TASK_PAY = {
    "skool posts": 550,
    "instagram": 275,
    "twitter": 275,
    "facebook": 325,
    "linkedin": 325,
    "courses": 825
  };
  /* Anything not on the list. A task nobody has priced yet is worth saying
     so about, not worth guessing at. */
  var TASK_PAY_DEFAULT = 300;

  function payKey(s) {
    return String((s && (s.label || s.task)) || "").trim().toLowerCase();
  }

  /* The stored price if there is one, otherwise the seed. Empty string is a
     real answer — it means somebody cleared it — so only absence falls
     through to the seed. */
  function payOf(s) {
    if (!s) return null;
    if (s.pay != null && s.pay !== "" && isFinite(Number(s.pay))) return Number(s.pay);
    if (s.pay === "") return null;
    var seed = TASK_PAY[payKey(s)];
    return seed == null ? TASK_PAY_DEFAULT : seed;
  }

  /* Nobody is paid by the hour any more: every task is a fixed price. */
  function isHourly() { return false; }
  /* Paid by the hour as a person — set on Members. Their tasks are still
     ticked off, but the hours they log are what pays, so a task row is worth
     nothing on its own and is never paid twice. */
  function ownerHourly(name) {
    var p = personByName(name);
    return Boolean(p && String(p.payKind || "").toLowerCase() === "hourly");
  }

  function rateOf(name) {
    var p = personByName(name);
    var r = p && p.rate;
    return r === "" || r == null ? null : Number(r);
  }
  function payable() {
    return (state.log || []).filter(function (r) { return r.status === "reviewed"; })
      .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }
  /* What a row is worth: the allocation on the task, not the minutes typed
     on the day.
     
     Paying for whatever somebody wrote in the box made every month an
     argument and a spreadsheet — the same job could be 15 minutes one day and
     179 the next, and there was no way to tell effort from typing. A job
     allocated 35 minutes is worth 35 minutes, whoever does it and however
     long it took them.
     
     The minutes stay on the row as the record of what actually happened; they
     are what the allocations were set from, and what they will be reset from
     when the work changes. A row with no task behind it falls back to its own
     minutes, because there is nothing else to price it by. */
  function allocOf(r) {
    var s = (state.standards || []).filter(function (x) { return x.id === r.standardId; })[0];
    var a = s ? Number(s.estMins) : NaN;
    return isFinite(a) && a > 0 ? a : null;
  }
  function payMinsOf(r) {
    var a = allocOf(r);
    return a == null ? (Number(r.mins) || 0) : a;
  }
  function standardOf(r) {
    return (state.standards || []).concat(state.retiredStandards || [])
      .filter(function (x) { return x.id === r.standardId; })[0] || null;
  }
  /* What this row is worth.
   *
   * A fixed task is worth its price, whoever did it and however long it took.
   * An hourly one is worth the rate for the minutes actually logged — the
   * allocation is not used, because the whole reason a task is hourly is that
   * nobody knew in advance how much of it there would be.
   *
   * A row with no task behind it any more falls back to hourly on its own
   * minutes, because there is nothing else left to price it by. */
  function recommended(r) {
    if (ownerHourly(r.owner)) return 0;
    var s = standardOf(r);
    if (s && !isHourly(s)) return payOf(s);
    var rate = rateOf(r.owner);
    if (rate == null) return null;
    var mins0 = s ? (Number(r.mins) || 0) : payMinsOf(r);
    return Math.round((mins0 / 60) * rate);
  }
  function amountFor(r) {
    var set = r.payAmount;
    if (set !== "" && set != null && isFinite(Number(set))) return Number(set);
    if (r.paidAt && isFinite(Number(r.paidAmount))) return Number(r.paidAmount);
    var rec = recommended(r);
    return rec == null ? 0 : rec;
  }

  function paymentsPane() {
    if (!who.signedIn) return '<p class="lede">Sign in to see your payments.</p>';
    var mineOnly = !isAdmin();
    var me = String(myName()).trim().toLowerCase();
    var rows = payable().filter(function (r) {
      return !mineOnly || String(r.owner || "").trim().toLowerCase() === me;
    });

    if (!rows.length) {
      /* The prices still come with it. This page is where a task's price is
         set, and hiding that behind "somebody has been paid something" meant
         a board with nothing settled yet had nowhere to set what anything was
         worth — which is exactly the state a new task, or a new person, is
         in. Nothing owed is not the same as nothing to say. */
      return '<div class="paneintro"><h2>Nothing owed yet</h2>' +
        '<p class="lede">A row becomes payable once it has been <b>reviewed</b> — the point somebody ' +
        "decided the work was good. " + (mineOnly ? "None of yours has got there yet." : "Nothing has got there yet.") +
        (mineOnly ? "" : " What each task pays is below, and can be set now.") +
        "</p></div>" +
        (mineOnly
          ? allocTableHtml(myName())
          : people().map(function (p) { return allocTableHtml(p.name); }).join(""));
    }

    var byOwner = {}, order = [];
    rows.forEach(function (r) {
      if (!byOwner[r.owner]) { byOwner[r.owner] = []; order.push(r.owner); }
      byOwner[r.owner].push(r);
    });

    var owed = 0, paid = 0;
    rows.forEach(function (r) { if (r.paidAt) paid += amountFor(r); else owed += amountFor(r); });

  /* A rate is only needed by somebody who has an hourly task on their list.
     Warning about a missing rate for a person paid entirely per task was the
     board complaining about a number it no longer uses. */
    var hasHourly = function (name) {
      return standardsFor(name, null).some(isHourly) ||
        (state.log || []).some(function (r) {
          return String(r.owner || "").trim().toLowerCase() === String(name || "").trim().toLowerCase() &&
                 isHourly(standardOf(r));
        });
    };
    var noRate = order.filter(function (o) { return rateOf(o) == null && hasHourly(o); });

    /* Everybody the board knows about, not only those with something payable.
       Somebody missing from this page with no explanation reads as a bug —
       it was the first question asked about it. */
    var waiting = (state.log || []).filter(function (r) {
      return r.status === "done" && (!mineOnly || String(r.owner || "").trim().toLowerCase() === me);
    });
    /* Priced the same way it will be when it is reviewed, rather than by a
       second formula that can drift from the first. */
    var waitingPkr = waiting.reduce(function (n, r) { return n + (recommended(r) || 0); }, 0);
    var idle = people().filter(function (p) {
      if (mineOnly && String(p.name).trim().toLowerCase() !== me) return false;
      return order.indexOf(p.name) === -1;
    });

    return (
      '<div class="paneintro"><h2>' +
        (mineOnly ? "What you are owed" : "What is owed") + "</h2>" +
      '<p class="lede">Every task that has been accepted, at what that task pays. ' +
        "A task is worth the same to whoever does it. " +
        (mineOnly ? "Yar can pay more than the price says, so treat it as the floor."
                  : "Type over any amount and press Save — it sticks, and it can be changed after the row is paid.") +
      "</p></div>" +


      '<div class="paytotals">' +
        '<div class="paytotal owed"><span class="k">' + (mineOnly ? "Owed to you" : "Outstanding") + "</span><b>" + pkr(owed) + "</b>" +
          '<span class="h">' + rows.filter(function (r) { return !r.paidAt; }).length + " rows not yet paid</span></div>" +
        '<div class="paytotal"><span class="k">Paid so far</span><b>' + pkr(paid) + "</b>" +
          '<span class="h">' + rows.filter(function (r) { return r.paidAt; }).length + " rows settled</span></div>" +
      "</div>" +

      (mineOnly
        ? allocTableHtml(myName())
        : people().map(function (p) { return allocTableHtml(p.name); }).join("")) +

      (waiting.length
        ? '<div class="banner info"><span><b>' + waiting.length +
          (waiting.length === 1 ? " row is" : " rows are") + "</b> handed in and waiting on review — " +
          mins(waiting.reduce(function (n, r) { return n + (Number(r.mins) || 0); }, 0)) +
          (waitingPkr ? ", about " + pkr(Math.round(waitingPkr)) : "") +
          ". Nothing becomes payable until it is reviewed, so none of it is in the total above." +
          "</span></div>"
        : "") +

      order.map(function (o) {
        var list = byOwner[o];
        var sum = 0, minutes = 0;
        list.forEach(function (r) { if (!r.paidAt) { sum += amountFor(r); minutes += Number(r.mins) || 0; } });
        var rate = rateOf(o);
        return '<section class="paygroup">' +
          '<div class="paygroup-head">' +
            '<i class="avatar" style="background:hsl(' + hue(o) + ' 42% 46%)">' + esc(initials(o)) + "</i>" +
            "<b>" + esc(o) + "</b>" +
            /* mins() renders nothing as an em dash, which read as "— unpaid"
               once a month was settled. */
            '<span class="paygroup-n">' + (minutes ? mins(minutes) + " unpaid" : "nothing unpaid") +
              "</span>" +
            '<span class="paygroup-owed">' +
              (sum ? pkr(sum) + " owed"
                   : list.some(function (r) { return !r.paidAt; }) ? "nothing owed yet"
                   : "all settled") + "</span>" +
          "</div>" +
          (function () {
            /* Settled for the work before September: folded away. */
            var old = list.filter(function (r) { return r.paidAt && String(r.paidAt).slice(0, 10) <= "2026-09-04"; });
            var recent = list.filter(function (r) { return old.indexOf(r) < 0; });
            return (recent.length ? '<div class="payrows">' + recent.map(payRowHtml).join("") + "</div>" : "") +
              (old.length
                ? '<details class="payold"><summary>' + old.length + (old.length === 1 ? " row" : " rows") +
                    " paid before September · " + pkr(old.reduce(function (n, r) { return n + amountFor(r); }, 0)) +
                  "</summary>" + '<div class="payrows">' + old.map(payRowHtml).join("") + "</div></details>"
                : "");
          })() +
        "</section>";
      }).join("") +
      /* A person with nothing payable still belongs on the page, saying why
         they have nothing rather than being silently absent. */
      idle.map(function (p) {
        var theirs = logFor(p.name);
        var pending = theirs.filter(function (r) { return r.status === "done"; }).length;
        return '<section class="paygroup idle">' +
          '<div class="paygroup-head">' +
            '<i class="avatar" style="background:hsl(' + hue(p.name) + ' 42% 46%)">' + esc(initials(p.name)) + "</i>" +
            "<b>" + esc(p.name) + "</b>" +
            '<span class="paygroup-n">' +
              (!theirs.length ? "has not logged anything on this board yet"
                : pending ? pending + (pending === 1 ? " row" : " rows") + " logged, none reviewed yet"
                : "nothing payable") +
            "</span>" +
            '<span class="paygroup-owed">nothing owed</span>' +
          "</div></section>";
      }).join("") +

      (isAdmin() ? '<div class="daynav">' + saveButton("log", "Save payments") + "</div>" : "")
    );
  }

  /* What each task is worth, per person. The whole point of allocating time
     is that this table exists and nobody has to work a month out from a list
     of rows. */
  function allocTableHtml(who) {
    /* Every section. Payments is the one page that has to add up to what
       a person is actually owed. */
    var list = standardsFor(who, null);
    if (!list.length) return "";
    var rate = rateOf(who);
    var canEdit = isAdmin() && !ui.readOnly;

    var daily = list.filter(isDaily);
    var weekly = list.filter(function (s) { return s.cadence === "Weekly"; });
    var bonuses = list.filter(isPerResult);

    /* Only the fixed ones can be added up. An hourly task is worth whatever
       the day turns out to hold, and putting a guess in the total would make
       the one honest number on this page a made-up one. */
    var sumFixed = function (rows) {
      return rows.reduce(function (n, s) {
        return n + (isHourly(s) ? 0 : (payOf(s) || 0));
      }, 0);
    };
    var perDay = sumFixed(daily);
    var perMonth = perDay * 26 + sumFixed(weekly) * 4;
    var hourlyCount = list.filter(isHourly).length;

    return '<section class="allocblock">' +
      '<div class="section-head"><div><h2>What each task is worth</h2>' +
        '<span class="note">' + esc(who) + " · a task pays a fixed amount, the same to " +
          "whoever does it." +
          (hourlyCount
            ? " The hourly ones pay " + (rate == null ? "their rate" : pkr(rate) + " an hour") +
              " for the time actually logged."
            : "") +
          (canEdit ? " Change any of them here." : "") + "</span></div>" +
        (isAdmin() ? saveButton("standards", "Save prices") : "") + "</div>" +

      '<div class="tablewrap"><table class="board alloctable"><thead><tr>' +
        "<th>Task</th><th>How often</th><th>Pays</th><th>Done in " +
        esc(monthLabel(currentMonth())) + "</th><th>Earned</th>" +
      "</tr></thead><tbody>" +

      list.map(function (s) {
        var hourly = isHourly(s);
        var each = payOf(s);
        var rows = logFor(who).filter(function (r) {
          return r.standardId === s.id && String(r.date).slice(0, 7) === currentMonth();
        });
        var n = rows.length;
        /* Earned is what was actually earned, so it is added up from the rows
           rather than multiplied out — for an hourly task those two are not
           the same number, and the rows are the true one. */
        var earned = rows.reduce(function (t, r) { return t + (recommended(r) || 0); }, 0);

        return "<tr" + (hourly ? ' class="hourlyrow"' : "") + ">" +
          "<td><b>" + esc(labelFor(s)) + "</b>" +
            '<span class="allocmins">' + mins(Number(s.estMins) || 0) + " allowed</span></td>" +
          "<td>" + esc(isPerResult(s) ? "Per person" : (s.cadence || "—")) + "</td>" +
          "<td>" + (hourly
            ? '<b class="payhourly">' + (rate == null ? "no rate set" : pkr(rate) + " / hr") + "</b>"
            : (canEdit
                ? '<span class="allocin"><i class="pkrmark">PKR</i>' +
                  '<input class="finin" type="number" min="0" step="25" data-pay="' + esc(s.id) +
                  '" value="' + esc(each == null ? "" : String(each)) + '" placeholder="—"></span>'
                : "<b>" + (each == null ? "—" : pkr(each)) + "</b>")) + "</td>" +
          "<td>" + (n || "—") + "</td>" +
          "<td>" + (n ? pkr(earned) : "0 PKR") + "</td>" +
        "</tr>";
      }).join("") +

      '<tr class="fintotal"><td><b>A full day</b>' +
          '<span class="allocmins">' + daily.length + " daily</span></td>" +
        "<td>" + weekly.length + " weekly</td>" +
        "" +
        "<td><b>" + pkr(perDay) + "</b></td>" +
        '<td colspan="2">about ' + pkr(perMonth) + " a month at 26 days, with the weekly ones" +
          (hourlyCount
            ? ", plus whatever the " + hourlyCount + " hourly " +
              (hourlyCount === 1 ? "task comes to" : "tasks come to")
            : "") +
          bonuses.map(function (b) {
            return ", plus " + pkr(payOf(b) || 0) + " for every " + labelFor(b).toLowerCase().replace(/\s*bonus$/, "");
          }).join("") + "</td></tr>" +
      "</tbody></table></div>" +
    "</section>";
  }

  function payRowHtml(r) {
    var rec = recommended(r);
    var amount = amountFor(r);
    var paid = Boolean(r.paidAt);
    return '<div class="payrow' + (paid ? " paid" : "") + '">' +
      '<span class="payvid"><span class="vno">' + esc(String(r.date || "").slice(5)) + "</span>" + esc(r.task || "Task") + "</span>" +
      '<span class="paywhy"><b class="score none">' +
        (isHourly(standardOf(r)) ? mins(Number(r.mins) || 0) : "fixed") + "</b></span>" +
      '<span class="payrec">' + (rec == null ? "no rate" : pkr(rec)) + "</span>" +
      (ui.readOnly || !isAdmin()
        ? '<span class="payin ro">' + pkr(amount) + "</span>"
        : '<input class="payin" type="number" min="0" step="50" data-payamt="' + esc(r.id) + '" value="' +
          esc(String(amount)) + '" aria-label="Amount to pay">') +
      (paid
        ? '<span class="paidwhen">paid</span>' +
          (isAdmin() && !ui.readOnly ? '<button class="btn btn-sm" data-act="unpay" data-v="' + esc(r.id) + '">Undo</button>' : "")
        : (isAdmin() && !ui.readOnly
            ? '<button class="btn btn-primary btn-sm" data-act="pay" data-v="' + esc(r.id) + '">Mark paid</button>'
            : '<span class="paidwhen waiting">not paid yet</span>')) +
    "</div>";
  }

  /* ---------------- team and profile ---------------- */
  function teamPane() {
    if (!isAdmin()) return '<p class="lede">The team list carries other people’s details, so it is kept to admins.</p>';
    return '<div class="section-head hookhead"><div><h2>Team</h2>' +
        '<span class="note">Who is on this board, how to reach them, and their rate for the few tasks paid by the hour</span></div>' +
        saveButton("people", "Save team") + "</div>" +
      '<div class="people">' + people().map(function (p, i) { return personCard(p, i, false); }).join("") + "</div>";
  }
  function profilePane() {
    if (!who.signedIn) return '<p class="lede">Sign in to see your profile.</p>';
    var pr = personByName(myName());
    if (!pr) return '<p class="lede">There is no profile on this board under your name yet. Ask Yar to add one.</p>';
    return '<div class="section-head hookhead"><div><h2>Your details</h2>' +
        '<span class="note">Only Yar sees these</span></div>' + saveButton("people", "Save my details") + "</div>" +
      '<div class="people">' + personCard(pr, people().indexOf(pr), true) + "</div>";
  }

  function personCard(p, i, own) {
    var ro = ui.readOnly || (!isAdmin() && !own);
    var rate = p.rate === "" || p.rate == null ? "" : String(p.rate);
    return '<div class="person">' +
      '<div class="person-top">' +
        '<div class="avatar" style="background:hsl(' + hue(p.name) + ' 42% 46%)">' + esc(initials(p.name)) + "</div>" +
        '<div class="person-id"><span class="pname-static">' + esc(p.name) + "</span>" +
          "</div>" +
      "</div>" +
      field(i, "email", "Email", p.email, "name@gmail.com", ro) +
      field(i, "whatsapp", "WhatsApp", p.whatsapp, "300 1234567", ro) +
      field(i, "accountName", "Account name", p.accountName, "Exactly as the bank has it", ro) +
      field(i, "iban", "IBAN", p.iban, "PK00 ABCD 0000 0000 0000 0000", ro) +
      field(i, "hours", "Working hours", p.hours, "15:00 - 18:00 PKT", ro) +
    "</div>";
  }
  function field(i, key, label, val, ph, ro) {
    return '<label class="pfield"><span>' + esc(label) + "</span>" +
      (ro ? '<div class="ro">' + (esc(val) || "—") + "</div>"
          : '<input data-person="' + i + ":" + key + '" value="' + esc(val || "") +
            '" placeholder="' + esc(ph) + '" aria-label="' + esc(label) + '">') +
    "</label>";
  }

  /* ---------------- shell ---------------- */
  var TABS = [
    { id: "tasks", label: "My Tasks", slug: "" },
    { id: "feedback", label: "Comments", slug: "feedback" },
    { id: "today", label: "Log", slug: "log" },
    { id: "stats", label: "Statistics", slug: "stats" },
    /* Money and people are settings — looked at now and then, not worked in.
       They sit under their own heading at the foot of the rail so the four
       pages somebody opens every morning are the four at the top. */
    { id: "payments", label: "Payments", slug: "payments", group: "admin" },
    { id: "finance", label: "Finances", slug: "finance", group: "admin" },
    { id: "team", label: "Team", slug: "team", admin: true, group: "admin" },
    { id: "profile", label: "Your details", slug: "profile", hidden: true },
  ];
  function slugFor(id) {
    for (var i = 0; i < TABS.length; i++) if (TABS[i].id === id) return TABS[i].slug;
    return "";
  }
  function urlForTab(id) { var s = slugFor(id); return s ? BASE + "/" + s : BASE; }
  function tabFromPath() {
    var p = location.pathname.replace(BASE, "").replace(/^\/+|\/+$/g, "");
    for (var i = 0; i < TABS.length; i++) if (TABS[i].slug === p) return TABS[i].id;
    return "tasks";
  }
  function subtitle(t) {
    return {
      tasks: "One tab per job. Tick it off with the links to what you did — that is what gets it paid.",
      feedback: "Everything you have been told, in one place.",
      today: "Every task ever logged, newest first — the whole record, searchable.",
      stats: "Members, visitors and rank — the numbers Skool ranks us on.",
      finance: "What the two communities earn, what the work costs, and what is left.",
      payments: "Tasks accepted, turned into money.",
      team: "Who is on this board and what they are paid.",
      profile: "How we reach you, and how you get paid.",
    }[t] || "";
  }
  function titleFor(t) {
    for (var i = 0; i < TABS.length; i++) if (TABS[i].id === t) return TABS[i].label;
    return "Skool Team";
  }

  /* ---------------- statistics ---------------- */

  /* Growth is computed against the previous row rather than stored. The sheet
     kept it in a typed column, which is how it came to disagree with the
     numbers beside it. */
  function growth(now, was) {
    if (now === "" || was === "" || now == null || was == null) return null;
    var a = Number(now), b = Number(was);
    if (!isFinite(a) || !isFinite(b) || !b) return null;
    return ((a - b) / b) * 100;
  }
  function pct(v) {
    if (v == null) return '<span class="g flat">–</span>';
    var cls = v > 0.005 ? "up" : v < -0.005 ? "down" : "flat";
    var sign = v > 0.005 ? "+" : "";
    return '<span class="g ' + cls + '">' + sign + v.toFixed(2) + "%</span>";
  }
  function statsFor(community) {
    return (state.stats || [])
      .filter(function (s) { return String(s.community).toLowerCase() === community; })
      .sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }

  function statsPane() {
    var all = state.stats || [];
    if (!all.length) {
      return '<div class="paneintro"><h2>Nothing recorded yet</h2>' +
        '<p class="lede">This is the sheet that is itself one of the recurring tasks — one row a day, ' +
        "per community.</p></div>";
    }
    var communities = [];
    all.forEach(function (s) {
      var c = String(s.community).toLowerCase();
      if (c && communities.indexOf(c) < 0) communities.push(c);
    });
    communities.sort();

    return (
      '<div class="statsavehead">' + saveButton("stats", "Save statistics") + "</div>" +
      '<div class="paneintro"><h2>What Skool sees</h2>' +
        '<p class="lede">Skool ranks communities on member growth, engagement and retention, and pushes ' +
        "ads at the ones that rank. Growth is worked out from the row below rather than typed, so it " +
        "cannot drift from the numbers beside it.</p></div>" +

      communities.map(function (c) {
        var rows = statsFor(c);
        var latest = rows[0] || {};
        var prev = rows[1] || {};
        return '<section class="statgroup">' +
          '<div class="section-head"><div><h2>' + esc(c.toUpperCase()) + "</h2>" +
            '<span class="note">' + rows.length + " days · latest " + esc(longDate(latest.date || "")) + "</span></div></div>" +

          '<div class="statcards">' +
            statCard("Members", latest.members, growth(latest.members, prev.members)) +
            statCard("Visitors 30d", latest.visitors30, growth(latest.visitors30, prev.visitors30)) +
            statCard("From Skool", latest.skoolVisitors30, growth(latest.skoolVisitors30, prev.skoolVisitors30)) +
            statCard("Not from Skool", latest.nonSkoolVisitors30, growth(latest.nonSkoolVisitors30, prev.nonSkoolVisitors30)) +
            statCard("Rank", latest.rank, null) +
          "</div>" +

          '<div class="tablewrap"><table class="stattable">' +
            "<thead><tr><th>Date</th><th>Members</th><th></th><th>Visitors 30d</th>" +
            "<th>From Skool</th><th>Not from Skool</th><th></th><th>Rank</th><th>Trending (tech)</th></tr></thead><tbody>" +
            rows.map(function (s, i) {
              var was = rows[i + 1] || {};
              return "<tr>" +
                "<td>" + esc(shortDate(s.date)) + "</td>" +
                "<td><b>" + esc(String(s.members === "" ? "–" : s.members)) + "</b></td>" +
                "<td>" + pct(growth(s.members, was.members)) + "</td>" +
                "<td>" + esc(String(s.visitors30 === "" ? "–" : s.visitors30)) + "</td>" +
                "<td>" + esc(String(s.skoolVisitors30 === "" ? "–" : s.skoolVisitors30)) + "</td>" +
                "<td>" + esc(String(s.nonSkoolVisitors30 === "" ? "–" : s.nonSkoolVisitors30)) + "</td>" +
                "<td>" + pct(growth(s.nonSkoolVisitors30, was.nonSkoolVisitors30)) + "</td>" +
                "<td>" + esc(String(s.rank === "" ? "–" : s.rank)) + "</td>" +
                '<td class="trend">' + esc(s.trendingTech || "—") + "</td>" +
              "</tr>";
            }).join("") +
          "</tbody></table></div>" +
        "</section>";
      }).join("")
    );
  }

  function statCard(label, value, g) {
    return '<div class="statcard"><span class="k">' + esc(label) + "</span>" +
      "<b>" + esc(value === "" || value == null ? "–" : String(value)) + "</b>" +
      (g == null ? "" : '<span class="h">' + pct(g) + " on the day before</span>") +
    "</div>";
  }

  function paneFor(t) {
    if (t === "tasks") return tasksPane();
    /* Just the tools. The list of what was said is rendered by the video
       board now, as one list covering both kinds of work. */
    if (t === "fbtools") return fbToolsPane();
    if (t === "feedback") return feedbackPane();
    if (t === "stats") return statsPane();
    if (t === "finance") return financePane();
    if (t === "payments") return paymentsPane();
    if (t === "team") return teamPane();
    if (t === "profile") return profilePane();
    return todayPane();
  }

  /* Paints the pane and nothing else. The shell, the rail and the page header
     belong to app.js — this used to draw all three, and two render loops both
     believing they owned #root is the way that ends badly. */
  function paint() {
    /* No save is started from here. A repaint is not evidence that anybody
       did anything — the click rule decides what saves and when. */
    var root = document.getElementById("skool-root");
    if (!root) return;                 /* the shell is showing some other tab */
    if (!loaded) { root.innerHTML = '<p class="lede">Loading\u2026</p>'; return; }

    root.innerHTML =
      (ui.err ? '<div class="banner bad"><span>' + esc(ui.err) + "</span></div>" : "") +
      (ui.notice ? '<div class="banner ' + ui.notice.kind + '"><span>' + esc(ui.notice.text) + "</span></div>" : "") +
      paneFor(ui.tab) +
      submitModalHtml() +
      (ui.toast ? '<div class="toast">' + esc(ui.toast) + "</div>" : "");

    /* This pane was just rebuilt, so the field the Save button was sitting
       beside is a new element. It finds it again by the field's attributes. */
    if (window.saveAtRefresh) window.saveAtRefresh();
  }

  /* ---------------- events ---------------- */
  document.addEventListener("click", function (e) {
    /* Both boards delegate from the document, so every click on the page runs
       both sets of handlers. This one stands down unless the event started
       inside a Skool pane. */
    if (!e.target || !e.target.closest || !e.target.closest("#skool-root")) return;
    /* A link to another Skool page is left to the shell — it owns the rail,
       the address bar and which pane is showing, and a pane quietly changing
       two of those behind its back is how the rail ends up highlighting one
       page while another is on screen. */
    if (e.target.closest && e.target.closest("[data-tab]")) return;
    var btn = e.target.closest && e.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    var v = btn.getAttribute("data-v");

    /* The button that saves the thing it sits in. Ahead of everything else,
       and it never repaints the pane: a repaint would rebuild the field
       somebody has just finished typing into. */
    if (act === "unitsave") {
      var uk = btn.getAttribute("data-unit");
      if (unitUi[uk] && unitUi[uk].st === "error") delete unitUi[uk];
      saveUnits([uk]);
      return;
    }
    /* The old whole-board button, for anything still drawn with one. */
    if (act === "save") { save(); return; }
    /* Fixed price or by the hour. A press, so it saves itself. */
    if (act === "paymode") {
      if (!isAdmin() || ui.readOnly) return;
      var stm = (state.standards || []).filter(function (x) { return x.id === v; })[0];
      if (stm) { stm.payMode = isHourly(stm) ? "task" : "hourly"; paint(); }
      return;
    }
    if (act === "day") { ui.date = shiftDate(ui.date, Number(v)); paint(); return; }
    if (act === "today") { ui.date = todayISO(); paint(); return; }
    if (act === "goday") {
      ui.date = v || ui.date;
      ui.scope = "day";
      window.scrollTo(0, 0);
      paint(); return;
    }
    if (act === "scope") { ui.scope = v; paint(); return; }
    if (act === "task") { ui.task = v; ui.editStd = false; window.scrollTo(0, 0); paint(); return; }
    if (act === "editstd") { ui.editStd = !ui.editStd; paint(); return; }
    if (act === "fbwho") { ui.fbWho = v || ""; paint(); return; }
    if (act === "unex") { ui.showUnex = !ui.showUnex; ui.fbWhy = ""; paint(); return; }
    if (act === "fbtask") {
      /* Feedback about a task is only useful next to the task. */
      var fs = (state.standards || []).filter(function (x) { return x.id === v; })[0];
      if (!fs) return;
      ui.tab = "tasks"; ui.task = v; ui.editStd = false;
      if (isAdmin()) ui.person = fs.owner;
      try { history.pushState({ tab: "tasks" }, "", urlForTab("tasks")); } catch (err) {}
      window.scrollTo(0, 0);
      paint(); return;
    }
    if (act === "fbsave") {
      var d = ui.fbDraft || {};
      var body = String(d.text || "").trim();
      if (!body || !isAdmin()) return;
      if (!Array.isArray(state.feedback)) state.feedback = [];
      state.feedback.push({
        id: newId("f"), at: new Date().toISOString(), by: myName() || "Yar",
        to: d.to || "", standardId: d.standardId || "", text: body,
      });
      ui.fbDraft = null;
      paint(); save(); return;
    }
    if (act === "fbdel") {
      if (!isAdmin()) return;
      state.feedback = (state.feedback || []).filter(function (f) { return f.id !== v; });
      paint(); save(); return;
    }
    if (act === "fbwhy") { ui.fbWhy = ui.fbWhy === v ? "" : v; paint(); return; }
    if (act === "fbwhysave") {
      var wr = rowById(v);
      var box = document.getElementById("fb-why");
      var why2 = box ? String(box.value || "").trim() : "";
      if (!wr || !why2 || !isAdmin()) return;
      wr.comment = why2;
      ui.fbWhy = "";
      paint(); save(); return;
    }
    if (act === "finmonth") { ui.finMonth = v; paint(); return; }
    if (act === "finedit") { ui.finEdit = !ui.finEdit; paint(); return; }
    if (act === "addcost") {
      if (!state.finance) state.finance = { fx: 280, asOf: "", communities: [], costs: [] };
      state.finance.costs = (state.finance.costs || []).concat([{ label: "", usd: 0 }]);
      paint(); return;
    }
    if (act === "who") { ui.person = v; ui.task = ""; ui.editStd = false; paint(); return; }
    if (act === "pickdate") {
      var dp2 = document.getElementById("daypick");
      if (!dp2) return;
      /* showPicker is the only way to open the native calendar from a button;
         where it is missing, fall back to focusing the input itself. */
      try { dp2.showPicker(); } catch (err) { dp2.focus(); dp2.click(); }
      return;
    }
    if (act === "addprompt") {
      var ap = (state.standards || []).filter(function (x) { return x.id === v; })[0];
      if (ap) { ap.prompts = (ap.prompts || []).concat([{ title: "", body: "" }]); paint(); }
      return;
    }
    if (act === "delprompt") {
      var dp = String(v).split(":");
      var ds = (state.standards || []).filter(function (x) { return x.id === dp[0]; })[0];
      if (ds && ds.prompts) { ds.prompts.splice(Number(dp[1]), 1); paint(); }
      return;
    }

    if (act === "how") { ui.openHow = ui.openHow === v ? "" : v; paint(); return; }
    if (act === "prompts") { ui.openPrompts = ui.openPrompts === v ? "" : v; paint(); return; }
    if (act === "always") { ui.openAlways = !ui.openAlways; paint(); return; }
    if (act === "markopen") {
      var std0 = (state.standards || []).filter(function (x) { return x.id === v; })[0];
      if (!std0) return;
      ui.submit = { standardId: std0.id, links: [""] };
      paint();
      var lbox = document.querySelector('[data-sublink="0"]');
      if (lbox) lbox.focus();
      return;
    }
    if (act === "subcancel") { ui.submit = null; ui.shotErr = ""; paint(); return; }
    /* Only when the backdrop itself was clicked. Every click inside the
       dialog bubbles up to it, and closing on those would throw away what
       somebody had just typed. */
    if (act === "subback") {
      if (btn.classList.contains("modal-back") && e.target === btn) {
        ui.submit = null; ui.shotErr = ""; paint();
      }
      return;
    }
    if (act === "subshotdel") {
      if (ui.submit && ui.submit.imgs) { ui.submit.imgs.splice(Number(v), 1); paint(); }
      return;
    }
    if (act === "rowshotdel") {
      var parts0 = String(v).split("|");
      var rr = rowById(parts0[0]);
      if (rr && rr.imgs) { rr.imgs.splice(Number(parts0[1]), 1); paint(); save(); }
      return;
    }
    if (act === "sublink") {
      if (!ui.submit) return;
      ui.submit.links = (ui.submit.links || [""]).concat([""]);
      paint();
      var boxes = document.querySelectorAll("[data-sublink]");
      if (boxes.length) boxes[boxes.length - 1].focus();
      return;
    }
    /* The row is written from the standard plus what was just typed, so the
       task name always matches the job it was logged against. */
    if (act === "subsave") {
      var d0 = ui.submit;
      if (!d0) return;
      var std1 = (state.standards || []).filter(function (x) { return x.id === d0.standardId; })[0];
      if (!std1) return;
      var owner = viewing();
      if (doneRow(owner, ui.date, std1.id)) { ui.submit = null; paint(); return; }
      /* The allocation goes on the row so every total still adds up without
         anybody being asked for a number. */
      var mins0 = Math.max(0, Math.round(Number(std1.estMins) || 0));
      var links0 = (d0.links || []).map(function (u) { return String(u).trim(); }).filter(Boolean);
      if (!links0.length && !(d0.imgs || []).length) return;
      state.log.push({
        id: newId("l"), owner: owner, date: ui.date, task: std1.task, standardId: std1.id,
        mins: mins0, status: "done", links: links0.slice(0, 10),
        imgs: (d0.imgs || []).slice(0, 10), comment: "",
      });
      ui.submit = null;
      paint(); save(); return;
    }
    if (act === "undone") {
      var ui2 = logIndex(v);
      if (ui2 >= 0) { state.log.splice(ui2, 1); paint(); save(); }
      return;
    }
    if (act === "copyprompt") {
      var pp = String(v).split(":");
      var ps = (state.standards || []).filter(function (x) { return x.id === pp[0]; })[0];
      var pb = ps && (ps.prompts || [])[Number(pp[1])];
      if (pb) {
        try {
          navigator.clipboard.writeText(pb.body);
          toast("Prompt copied");
        } catch (err) { toast("Could not copy — select it and copy by hand"); }
      }
      return;
    }
    if (act === "open") { ui.open = ui.open === v ? "" : v; paint(); return; }
    if (act === "fstatus") {
      var at = ui.status.indexOf(v);
      if (at === -1) ui.status.push(v); else ui.status.splice(at, 1);
      paint(); return;
    }
    if (act === "fclear") { ui.status = []; ui.q = ""; paint(); return; }

    if (act === "fillday") {
      var name = viewing();
      missingToday(name, ui.date).forEach(function (s) {
        state.log.push({
          id: newId("l"), owner: name, date: ui.date, task: s.task, standardId: s.id,
          mins: 0, status: "done", links: [], comment: "",
        });
      });
      /* The standards are added against the day being looked at, so show it. */
      ui.scope = "day"; ui.open = "";
      paint(); return;
    }
    if (act === "delrow") {
      var di = logIndex(v);
      if (di >= 0) { state.log.splice(di, 1); paint(); }
      return;
    }
    if (act === "addstd") {
      var owner = viewing();
      var fresh = {
        id: newId("s"), owner: owner, task: "", section: ui.section,
        priority: (standardsFor(owner, null).length + 1),
        cadence: "Daily", link: "", link2: "", estMins: 30, note: "",
        label: "", how: "", prompts: [],
      };
      state.standards.push(fresh);
      /* Open it and drop straight into editing — a blank task with no way in
         is the same as no task. */
      ui.task = fresh.id;
      ui.editStd = true;
      paint();
      var box = document.querySelector('[data-std="' + fresh.id + ':label"]');
      if (box) box.focus();
      return;
    }
    if (act === "delstd") {
      var di2 = -1;
      for (var q = 0; q < state.standards.length; q++) if (state.standards[q].id === v) di2 = q;
      if (di2 < 0) return;
      /* The rows already logged against it stay: deleting the definition of a
         job does not mean it was never done, and those rows are what pays. */
      var used = (state.log || []).filter(function (r) { return r.standardId === v; }).length;
      if (used && !window.confirm(used + " logged " + (used === 1 ? "row refers" : "rows refer") +
          " to this task. They stay on the Log either way. Delete the task itself?")) return;
      state.standards.splice(di2, 1);
      ui.task = ""; ui.editStd = false;
      paint(); return;
    }

    if (act === "pay") {
      var pr = rowById(v);
      if (!pr || !isAdmin()) return;
      pr.paidAmount = amountFor(pr);
      pr.paidAt = new Date().toISOString();
      paint(); save(); return;
    }
    if (act === "unpay") {
      var ur = rowById(v);
      if (!ur || !isAdmin()) return;
      delete ur.paidAt; delete ur.paidAmount;
      paint(); save(); return;
    }
  });

  /* Typing never re-renders: it would take the caret with it. */
  document.addEventListener("input", function (e) {
    /* Both boards delegate from the document, so every click on the page runs
       both sets of handlers. This one stands down unless the event started
       inside a Skool pane. */
    if (!e.target || !e.target.closest || !e.target.closest("#skool-root")) return;
    var el = e.target;
    var get = function (n) { return el.getAttribute && el.getAttribute(n); };

    var lk = get("data-link");
    if (lk) {
      var partsL = lk.split(":"), r2 = rowById(partsL[0]);
      if (r2) {
        var at = Number(partsL[1]);
        if (!Array.isArray(r2.links)) r2.links = [];
        while (r2.links.length <= at) r2.links.push("");
        r2.links[at] = el.value;
        /* Drop the empties off the end so a row that was filled and cleared
           does not keep carrying blanks, and typing in the spare box grows a
           new one on the next render. */
        while (r2.links.length && !r2.links[r2.links.length - 1]) r2.links.pop();
        refreshSave();
        /* Grow the row by hand rather than re-rendering: a render here would
           take the caret out of the box being typed in. */
        if (el.value && at === r2.links.length - 1 && at < 9 && !el.nextElementSibling) {
          var spare = el.cloneNode(false);
          spare.value = "";
          spare.setAttribute("data-link", partsL[0] + ":" + (at + 1));
          spare.setAttribute("placeholder", "Link " + (at + 2) + " to your work");
          spare.setAttribute("aria-label", "Link " + (at + 2));
          el.parentNode.appendChild(spare);
        }
      }
      return;
    }
    var cm = get("data-comment");
    if (cm) { var r3 = rowById(cm); if (r3) { r3.comment = el.value; refreshSave(); } return; }

    var ins = get("data-insp");
    if (ins) { var r4 = rowById(ins); if (r4) { r4.inspiration = el.value; refreshSave(); } return; }

    /* The task is a contenteditable so it can wrap to the column width; the
       long ones on this board are whole sentences. */
    var tk = get("data-task");
    if (tk) { var r5 = rowById(tk); if (r5) { r5.task = el.textContent; refreshSave(); } return; }

    /* Search does re-render — the box is not redrawn by it, so the caret
       stays where it is, and the table under it has to follow the typing. */
    if (el.id === "q") { ui.q = el.value; paint(); var qb = document.getElementById("q"); if (qb) { qb.focus(); qb.setSelectionRange(qb.value.length, qb.value.length); } return; }

    var sl = get("data-sublink");
    if (sl !== null && sl !== undefined && ui.submit) {
      var at0 = Number(sl);
      var had0 = (ui.submit.links || []).some(function (u) { return String(u).trim(); });
      ui.submit.links[at0] = el.value;
      var now0 = ui.submit.links.some(function (u) { return String(u).trim(); });
      if (had0 !== now0) {
        paint();
        /* type="url", which is one of the inputs that has no selection to
           set — the same throw as the number boxes above. */
        refocus('[data-sublink="' + at0 + '"]');
      }
      return;
    }

    if (el.id === "fb-text") {
      if (!ui.fbDraft) ui.fbDraft = { to: "", standardId: "", text: "" };
      var had = Boolean(String(ui.fbDraft.text || "").trim());
      ui.fbDraft.text = el.value;
      /* Only when Send it has to change state, or the caret leaves the box. */
      if (had !== Boolean(el.value.trim())) {
        paint();
        var back = document.getElementById("fb-text");
        if (back) { back.focus(); var n3 = back.value.length; back.setSelectionRange(n3, n3); }
      }
      return;
    }

    var fk = get("data-fin");
    if (fk) {
      if (!state.finance) state.finance = { fx: 280, asOf: "", communities: [], costs: [] };
      var F = state.finance, pf = fk.split(":");
      var numeric = function (x) { return x === "" ? "" : Math.max(0, Number(x) || 0); };
      if (pf.length === 1) F[pf[0]] = pf[0] === "fx" ? numeric(el.value) : el.value;
      else if (pf[0] === "c") { var cc = (F.communities || [])[Number(pf[1])]; if (cc) cc[pf[2]] = numeric(el.value); }
      else if (pf[0] === "k") {
        var kk = (F.costs || [])[Number(pf[1])];
        if (kk) kk[pf[2]] = (pf[2] === "usd" || pf[2] === "pkr") ? numeric(el.value) : el.value;
      }
      refreshSave();
      return;
    }

    var pm = get("data-prompt");
    if (pm) {
      var pp2 = pm.split(":");
      var ps2 = (state.standards || []).filter(function (x) { return x.id === pp2[0]; })[0];
      var pe = ps2 && (ps2.prompts || [])[Number(pp2[1])];
      if (pe) { pe[pp2[2]] = el.value; refreshSave(); }
      return;
    }

    /* Typing a price. It repaints rather than waiting for a save, because
       the Earned column beside it is worked out from this number and a table
       that disagrees with the box you are typing in is worse than no table. */
    var pv = get("data-pay");
    if (pv) {
      if (!isAdmin()) return;
      var stp = (state.standards || []).filter(function (x) { return x.id === pv; })[0];
      if (stp) {
        var raw = String(el.value).trim();
        stp.pay = raw === "" ? "" : Math.max(0, Math.round(Number(raw) || 0));
        paint();
        refocus('[data-pay="' + pv + '"]');
      }
      return;
    }

    var al = get("data-alloc");
    if (al) {
      if (!isAdmin()) return;
      var st0 = (state.standards || []).filter(function (x) { return x.id === al; })[0];
      if (st0) {
        st0.estMins = Math.max(0, Math.round(Number(el.value) || 0));
        /* The row beside it prices off this number, so the table has to
           follow the typing rather than wait for a save. */
        paint();
        refocus('[data-alloc="' + al + '"]');
      }
      return;
    }

    var sd = get("data-std");
    if (sd) {
      var partsS = sd.split(":"), key = partsS[1];
      var st = (state.standards || []).filter(function (x) { return x.id === partsS[0]; })[0];
      if (st) {
        st[key] = key === "estMins" || key === "priority" ? Math.max(0, Math.round(Number(el.value) || 0)) : el.value;
        refreshSave();
      }
      return;
    }
    var pf = get("data-person");
    if (pf) {
      var partsP = pf.split(":"), p = people()[Number(partsP[0])];
      if (p) {
        var pk = partsP[1];
        p[pk] = pk === "rate" ? (String(el.value).trim() === "" ? "" : Math.max(0, Math.round(Number(el.value) || 0))) : el.value;
        refreshSave();
      }
      return;
    }
    var pa = get("data-payamt");
    if (pa) {
      var r4 = rowById(pa);
      if (r4) {
        var raw = String(el.value).trim();
        r4.payAmount = raw === "" ? "" : Math.max(0, Math.round(Number(raw)));
        if (r4.paidAt) r4.paidAmount = amountFor(r4);
        refreshSave();
      }
      return;
    }
  });

  /* Selects and the date box change the shape of the page, so they redraw. */
  document.addEventListener("change", function (e) {
    /* Both boards delegate from the document, so every click on the page runs
       both sets of handlers. This one stands down unless the event started
       inside a Skool pane. */
    if (!e.target || !e.target.closest || !e.target.closest("#skool-root")) return;
    var el = e.target;
    if (el.id === "daypick") { ui.date = el.value || todayISO(); paint(); return; }
    if (el.id === "personpick") { ui.person = el.value; paint(); return; }
    var shotTo = el.getAttribute && el.getAttribute("data-shot");
    if (shotTo) {
      var f0 = el.files && el.files[0];
      el.value = "";
      if (shotTo === "subshot") {
        if (!ui.submit) return;
        uploadShot(f0, ui.submit.standardId, function (path) {
          ui.submit.imgs = (ui.submit.imgs || []).concat([path]);
        });
      } else {
        var rowFor = rowById(shotTo);
        if (!rowFor) return;
        uploadShot(f0, rowFor.id, function (path) {
          rowFor.imgs = (rowFor.imgs || []).concat([path]);
          save();
        });
      }
      return;
    }
    if (el.id === "fb-to" || el.id === "fb-std") {
      if (!ui.fbDraft) ui.fbDraft = { to: "", standardId: "", text: "" };
      if (el.id === "fb-to") { ui.fbDraft.to = el.value; ui.fbDraft.standardId = ""; }
      else ui.fbDraft.standardId = el.value;
      paint(); return;
    }
    var st = el.getAttribute && el.getAttribute("data-status");
    if (st) { var r = rowById(st); if (r) { r.status = el.value; paint(); } return; }
    if (el.getAttribute && el.getAttribute("data-std")) { paint(); return; }
    if (el.getAttribute && el.getAttribute("data-person")) { paint(); return; }
  });

  /* Paste a screenshot straight into the open submit form. Not bound to the
     little Add box, because the caret is in the minutes or a link field when
     somebody hits Cmd+V, and making them click the box first is the failure. */
  document.addEventListener("paste", function (e) {
    /* Both boards delegate from the document, so every click on the page runs
       both sets of handlers. This one stands down unless the event started
       inside a Skool pane. */
    if (!e.target || !e.target.closest || !e.target.closest("#skool-root")) return;
    if (!ui.submit || ui.shotUp) return;
    var items = (e.clipboardData && e.clipboardData.items) || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind !== "file" || !/^image\//.test(items[i].type || "")) continue;
      var f = items[i].getAsFile();
      if (!f) continue;
      /* Only now, so pasting a link into a link box still works. */
      e.preventDefault();
      uploadShot(f, ui.submit.standardId, function (path) {
        ui.submit.imgs = (ui.submit.imgs || []).concat([path]);
      });
      return;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && ui.submit) { ui.submit = null; ui.shotErr = ""; paint(); }
  });

  /* ---------------- what the shell talks to ---------------- */

  var mounted = false;
  return {
    /* Called once, the first time a Skool page is opened. Everything is
       fetched then rather than on page load, so somebody who only ever looks
       at videos never pays for this board at all. */
    mount: function () {
      if (mounted) return;
      mounted = true;
      load();
    },
    /* Told separately from mount, and told again whenever it changes. The
       shell asks who you are over the network, so the first paint happens
       before the answer arrives — and a board that decided you were nobody
       at that moment, and never asked again, shows an admin the "you are not
       on this board" page for the rest of the session. */
    session: function (s, resolved) {
      if (!resolved) return;                  /* still waiting on the answer */
      if (authDone && who.name === (s && s.name)) return;
      authDone = true;
      if (!s || !s.signedIn) { landOnWork(); paint(); return; }
      who = { signedIn: true, name: s.name || "", email: s.email || "", role: s.role || "member" };
      if (!ui.person && logFor(who.name).length) ui.person = who.name;
      landOnWork();
      paint();
    },
    /* The shell has just rebuilt #root, so the container this draws into is a
       new empty div. Fill it again. */
    paint: paint,
    setTab: function (t) { ui.tab = t || "tasks"; paint(); },
    /* Written Posts and Carousels are the same tasks page over a different
       slice of the same list. */
    setSection: function (sec) {
      var next = sec === "" ? "" : (SECTIONS[sec] ? sec : "skool");
      if (ui.section === next) return;
      ui.section = next;
      ui.task = "";          /* the open task belongs to the old section */
      paint();
    },
    section: function () { return ui.section; },
    ownersIn: function (sec) { return loaded ? ownersIn(sec) : []; },
    tabs: function () { return TABS; },
    title: function (t) { return titleFor(t); },
    subtitle: function (t) { return subtitle(t); },
    /* The shell asks before it lets somebody close the window. */
    dirty: function () { return loaded && dirtyUnits().length > 0; },
    save: function () { if (loaded) saveEverything(); },
    /* True while a Skool pane is the one on screen, so the shell's own
       delegated handlers can stand back. */
    owns: function (node) { return !!(node && node.closest && node.closest("#skool-root")); },

    /* ---- what the one roster needs ----

       People are the thing the two boards genuinely share: the same nine
       names, one set of bank details, one place to look somebody up. The
       Team page reads both boards through here and shows one list. */
    people: function () { return (state.people || []).slice(); },
    /* How much of this board's work a person has actually done, so the roster
       can say something true about a Skool person rather than leaving the
       video columns blank next to their name. */
    /* Everything this person has earned on the Skool board, priced the same
       way the Payments page prices it — reviewed rows only, because that is
       the point at which work becomes payable. The shell puts these beside
       the video rows so one person's arrears is one list. */
    earnings: function (name) {
      if (!loaded) return [];
      var key = String(name || "").trim().toLowerCase();
      return (state.log || [])
        .filter(function (r) {
          return String(r.owner || "").trim().toLowerCase() === key && r.status === "reviewed";
        })
        .map(function (r) {
          return {
            id: r.id, date: r.date || "", what: r.task || "Skool task",
            where: "Skool", amount: amountFor(r), paidAt: r.paidAt || ""
          };
        });
    },
    /* What somebody has done that is waiting on a review.
     *
     * Priced exactly like earnings() — same amountFor — but kept apart from
     * it, because a row nobody has looked at yet is not money owed and must
     * never be added into what the board says it owes. It is shown to the
     * person as what their week is worth so far, and to an admin as the
     * queue to get through. Rehman logged nine days running in September and
     * his total never moved, because every one of them was still sitting
     * here and nothing on the board said so.
     *
     * "redo" is deliberately not in here: it has been looked at, and the
     * answer was no. */
    pending: function (name) {
      if (!loaded) return [];
      var key = String(name || "").trim().toLowerCase();
      return (state.log || [])
        .filter(function (r) {
          return String(r.owner || "").trim().toLowerCase() === key && r.status === "done";
        })
        .map(function (r) {
          return {
            id: r.id, date: r.date || "", what: r.task || "Skool task",
            where: "Skool", amount: amountFor(r)
          };
        })
        .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    },
    /* How somebody is paid on this board, task by task, for the profile's
       "How you get paid" section. Priced by the same payOf/isHourly the
       Payments page uses, so the two can never disagree. */
    payPlan: function (name) {
      if (!loaded) return null;
      var month = currentMonth();
      return {
        canEdit: isAdmin() && !ui.readOnly,
        /* Your own bonus is yours to log; an admin can log anybody's. */
        canLog: !ui.readOnly && (isAdmin() ||
          String(name || "").trim().toLowerCase() === String(who.name || "").trim().toLowerCase()),
        rate: rateOf(name),
        tasks: standardsFor(name, null).map(function (s) {
          var rows = logFor(name).filter(function (r) {
            return r.standardId === s.id && String(r.date).slice(0, 7) === month;
          });
          return {
            id: s.id,
            label: labelFor(s),
            kind: isHourly(s) ? "hourly" : isPerResult(s) ? "bonus" : "task",
            cadence: s.cadence || "",
            pay: isHourly(s) ? null : payOf(s),
            detail: s.short || s.task || "",
            doneThisMonth: rows.length,
            earnedThisMonth: rows.reduce(function (t, r) { return t + (recommended(r) || 0); }, 0)
          };
        })
      };
    },
    /* Editing somebody's jobs from their profile. Admin only, and saved the
       moment it changes — the same per-row save every other edit here uses. */
    editTask: function (id, field, value) {
      if (!loaded || !isAdmin() || ui.readOnly) return false;
      var t = (state.standards || []).filter(function (x) { return x.id === id; })[0];
      if (!t) return false;
      if (field === "pay") t.pay = String(value).trim() === "" ? "" : Math.max(0, Math.round(Number(value) || 0));
      else if (field === "label") t.label = String(value).trim();
      else if (field === "detail") { t.short = String(value).trim(); if (!String(t.task || "").trim()) t.task = t.short; }
      else if (field === "cadence") t.cadence = ["Daily", "Weekly", "Per result"].indexOf(value) >= 0 ? value : "Daily";
      else return false;
      t.payMode = "task";
      saveUnits(["standards"]); paint();
      return true;
    },
    /* Taking a job off a list. What was already logged against it keeps the
       price it had, written onto the row, so removing a task never changes
       what somebody is owed for having done it. */
    removeTask: function (id) {
      if (!loaded || !isAdmin() || ui.readOnly) return false;
      var at = -1;
      (state.standards || []).forEach(function (x, k) { if (x.id === id) at = k; });
      if (at < 0) return false;
      (state.log || []).forEach(function (r) {
        if (r.standardId !== id || r.paidAt) return;
        if (r.payAmount === "" || r.payAmount == null) r.payAmount = amountFor(r);
      });
      state.standards.splice(at, 1);
      saveUnits(["standards", "log"]); paint();
      return true;
    },
    /* Somebody joined because of this person. Logged as a row against their
       bonus, waiting on review like any other task: Yar checks the member
       stayed past the trial, marks it reviewed, and then it is owed. */
    /* Today's row for one task, for the profile: is it done, and with what. */
    todayRow: function (name, id, date) {
      if (!loaded) return null;
      var r = doneRow(name, date || todayISO(), id);
      return r ? { id: r.id, links: (r.links || []).filter(Boolean), status: r.status } : null;
    },
    /* Ticking a task off from the profile, with the links to the work. The
       same row the Tasks page writes — one entry per task per day — so it
       lands on the log and on Payments exactly as before. */
    logTask: function (id, links, date) {
      var day = /^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) && String(date) <= todayISO() ? String(date) : todayISO();
      if (!loaded || ui.readOnly) return false;
      var t = (state.standards || []).filter(function (x) { return x.id === id; })[0];
      if (!t) return false;
      var owner = String(t.owner || "").trim();
      if (!isAdmin() && owner.toLowerCase() !== String(who.name || "").trim().toLowerCase()) return false;
      var clean = (links || []).map(function (u) { return String(u || "").trim(); }).filter(Boolean).slice(0, 10);
      if (!clean.length) return false;
      var r = doneRow(owner, day, t.id);
      if (r) {
        r.links = clean;
        if (r.status === "redo") r.status = "done";
      } else {
        state.log.push({
          id: newId("l"), owner: owner, date: day, task: labelFor(t), standardId: t.id,
          mins: 0, status: "done", links: clean, comment: ""
        });
      }
      saveUnits(["log"]); paint();
      return true;
    },
    /* The last few weeks of somebody's rows, for the Tasks tab's history. */
    recentLog: function (name, days) {
      if (!loaded) return [];
      var since = shiftDate(todayISO(), -(days || 14));
      return logFor(name).filter(function (r) { return r.date >= since; }).map(function (r) {
        return { date: r.date, standardId: r.standardId, task: r.task, status: r.status,
                 links: (r.links || []).filter(Boolean), imgs: (r.imgs || []).length };
      });
    },
    logResult: function (id, link) {
      if (!loaded || ui.readOnly) return false;
      var t = (state.standards || []).filter(function (x) { return x.id === id; })[0];
      if (!t || !isPerResult(t)) return false;
      var owner = String(t.owner || "").trim();
      if (!isAdmin() && owner.toLowerCase() !== String(who.name || "").trim().toLowerCase()) return false;
      state.log.push({
        id: newId("l"), owner: owner, date: todayISO(), task: labelFor(t), standardId: t.id,
        mins: 0, status: "done", links: [String(link || "").trim()].filter(Boolean), comment: ""
      });
      saveUnits(["log"]); paint();
      return true;
    },
    addTask: function (owner, kind) {
      if (!loaded || !isAdmin() || ui.readOnly) return false;
      var bonus = kind === "bonus";
      state.standards.push({
        id: newId("s"), owner: owner, section: "skool",
        label: bonus ? "New bonus" : "New task", task: "", short: "",
        priority: standardsFor(owner, null).length + 1,
        cadence: bonus ? "Per result" : "Daily", link: "", link2: "",
        estMins: bonus ? 0 : 30, note: "", how: "", prompts: [],
        pay: bonus ? 1000 : 100, payMode: "task"
      });
      saveUnits(["standards"]); paint();
      return true;
    },
    workFor: function (name) {
      var key = String(name || "").trim().toLowerCase();
      var rows = (state.log || []).filter(function (r) {
        return String(r.owner || "").trim().toLowerCase() === key;
      });
      var last = "";
      rows.forEach(function (r) { if (r.date > last) last = r.date; });
      return {
        rows: rows.length,
        done: rows.filter(function (r) { return r.status === "done" || r.status === "reviewed"; }).length,
        reviewed: rows.filter(function (r) { return r.status === "reviewed"; }).length,
        redo: rows.filter(function (r) { return r.status === "redo"; }).length,
        last: last
      };
    },
    /* Written back to the Skool document and saved on its own queue. The two
       boards are separate records on the server, so a change to Asif's IBAN
       must not go out inside a save of the video board. */
    patchPerson: function (idOrName, field, value) {
      var key = String(idOrName || "").trim().toLowerCase();
      var list = state.people || [];
      var p = list.filter(function (x) { return String(x.id || "").toLowerCase() === key; })[0];
      if (!p) p = list.filter(function (x) {
        return String(x.name || "").trim().toLowerCase() === key;
      })[0];
      if (!p || p[field] === value) return false;
      p[field] = value;
      /* Written from the other board, so there is no press here to hang it
         off and nobody watching a button on this one. It goes now. */
      saveUnits(["people"]);
      return true;
    },
    /* True while any one unit is in flight, not while "the board" is —
       there is no such thing as the board saving any more. */
    saving: function () {
      var busy = false;
      Object.keys(unitUi).forEach(function (k) { if (unitUi[k].st === "saving") busy = true; });
      return busy;
    },

    /* Everything that has been said about the Skool work, flattened for the
       one feedback list. Filtered the same way this board filters it: you see
       what was addressed to you, or to everybody. */
    feedback: function () {
      var mineOnly = !isAdmin();
      var meName = String(myName()).trim().toLowerCase();
      return allFeedback()
        .filter(function (f) {
          if (!mineOnly) return true;
          return !f.to || String(f.to).trim().toLowerCase() === meName;
        })
        .map(function (f) {
          return {
            id: f.id,
            at: f.at,
            to: f.to || "",
            by: f.by || "",
            text: f.text || "",
            kind: f.kind,
            task: f.task || "",
            about: f.standardId ? stdLabel(f.standardId) : ""
          };
        });
    },
    /* Somebody assigned to the Skool team needs a record on this board, or
       there is nothing to give them a task against and nothing to pay. */
    ensurePerson: function (name, email) {
      var key = String(name || "").trim().toLowerCase();
      if (!key) return false;
      var list = state.people || (state.people = []);
      for (var i = 0; i < list.length; i++) {
        if (String(list[i].name || "").trim().toLowerCase() === key) return false;
      }
      list.push({
        id: "p_" + key.replace(/[^a-z0-9]+/g, "") + "_" + Date.now().toString(36),
        name: String(name).trim(), email: String(email || ""), whatsapp: "",
        rate: "", hours: "", teams: ["skool"]
      });
      saveUnits(["people"]);
      return true;
    },
    /* Whether the people on this board are known yet. */
    ready: function () { return loaded; },
    hasPerson: function (name) {
      var key = String(name || "").trim().toLowerCase();
      return (state.people || []).some(function (p) {
        return String(p.name || "").trim().toLowerCase() === key;
      });
    }
  };
})();
