/* dev harness only, never shipped: the sound dock phone.html adds when it is
   opened on its own (on a phone) instead of inside live.html. The whole app
   plays as usual; a tab on the left edge opens a sheet that switches every
   routed sound between today's and Brilliant's on the spot, lists the sounds
   just heard with a keep / Brilliant pick for each (the same "soundPicks" as
   compare.html, screens.html and live.html), and jumps to any screen. A small
   note at the top names each sound as it plays. Our correct-answer sound and
   Duolingo's files are never routed, so they play the same in both modes. */
(function () {
  const KEY = "soundPicks";
  const SCREENS = [
    ["Path", [["Path", "path"], ["Lesson card", "pop"], ["Ring fills", "pathpay"], ["Node done", "pathgold"], ["Chest ready", "chestready"]]],
    ["Short lesson", [["Lesson 1", "learn"], ["Lesson 3", "learn3"], ["Fill tiles", "learn", "fill"], ["Match pairs", "learn", "pairs"], ["Keypad", "learn", "type"], ["Order", "learn3", "order"], ["Write the rule", "rulewords"], ["Rule in numbers", "rulenums"]]],
    ["Lesson", [["Lesson", "lesson"], ["Right answer", "fbgood"], ["Wrong answer", "fb"], ["Lesson lost", "fail"], ["Quick check", "teachcheck"], ["Review", "reviewdo"]]],
    ["Rewards", [["Win screen", "learnwin"], ["Today's progress", "learnmore"], ["League climb", "climb"], ["Chest open", "chest"], ["Streak", "streak7"], ["Rank-up", "rankup"], ["Quest banner", "questbanner"]]],
    ["First run", [["Hello", "ob-hello"], ["Taste", "ob-taste"], ["Level", "ob-level"], ["Goal", "ob-goal"]]],
    ["Tests and more", [["Level test", "place"], ["Mock exam", "mocktest"], ["Settings", "settings"], ["Sign-in", "signin"]]]
  ];
  let picks = {};
  const load = () => { try { picks = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { picks = {}; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(picks)); } catch (e) {} };
  load();
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  let M = {};
  fetch("tools/brilliant-sounds/moments.json?t=" + Date.now()).then(r => r.json()).then(a => { (Array.isArray(a) ? a : a.moments).forEach(m => { M[m.id] = m; }); paint(); }).catch(() => {});
  const name = id => { const m = M[id]; if (!m) return id; const s = m.moment.split(/[:(;]| — /)[0].trim(); return s.length > 60 ? s.slice(0, 58) + "…" : s; };
  const swappable = id => { const m = M[id]; return m && m.brilliant && m.brilliant !== "keep" && m.brilliant !== "none"; };
  const mode = () => window.__SMODE === "bri" ? "bri" : "now";

  const css = `
#sdk, #sdk * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; letter-spacing: 0; }
#sdk-tab { position: fixed; left: 0; top: 72px; z-index: 2147483600; width: 40px; height: 54px; border: 0; border-radius: 0 16px 16px 0; padding: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; color: #fff; font-size: 11px; font-weight: 800;
  box-shadow: 0 4px 14px rgba(0,0,0,.22); cursor: pointer; touch-action: manipulation; }
#sdk-tab svg { width: 20px; height: 20px; }
#sdk-tab.now { background: #58CC02; } #sdk-tab.bri { background: #8E5CF6; }
#sdk-note { position: fixed; left: 50%; top: 10px; z-index: 2147483600; translate: -50% 0; max-width: calc(100% - 24px); pointer-events: none;
  padding: 6px 12px; border-radius: 99px; font-size: 13px; font-weight: 700; color: #fff; background: rgba(32,32,32,.86);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0; transition: opacity .2s; }
#sdk-note.on { opacity: 1; }
#sdk-note b { color: #C9F27B; } #sdk-note b.bri { color: #D7C2FF; }
#sdk-veil { position: fixed; inset: 0; z-index: 2147483601; background: rgba(0,0,0,.35); display: none; }
#sdk-veil.on { display: block; }
#sdk-sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 2147483602; max-height: 82vh; overflow: auto; background: #fff; color: #3C3C3C;
  border-radius: 20px 20px 0 0; padding: 14px 16px calc(18px + env(safe-area-inset-bottom)); translate: 0 105%; transition: translate .25s ease; direction: ltr; text-align: left; }
#sdk-sheet.on { translate: 0 0; }
#sdk-sheet h3 { margin: 4px 0 8px; font-size: 13px; font-weight: 800; color: #777; text-transform: uppercase; letter-spacing: .04em; }
#sdk-sheet .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
#sdk-sheet .top b { font-size: 19px; }
#sdk-sheet .x { border: 0; background: #F0F0F0; width: 34px; height: 34px; border-radius: 50%; font-size: 18px; font-weight: 800; color: #777; cursor: pointer; }
#sdk-sheet .seg { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px; }
#sdk-sheet .seg button { border: 2px solid #E5E5E5; border-bottom-width: 4px; background: #fff; border-radius: 14px; padding: 10px 6px; font-size: 15px; font-weight: 800; color: #3C3C3C; cursor: pointer; }
#sdk-sheet .seg button.on.now { background: #D7FFB8; border-color: #58CC02; color: #478700; }
#sdk-sheet .seg button.on.bri { background: #EDE3FF; border-color: #8E5CF6; color: #6A3CC9; }
#sdk-sheet .tip { font-size: 13px; color: #777; margin: 0 0 14px; }
#sdk-sheet .heard { display: grid; gap: 8px; margin-bottom: 16px; }
#sdk-sheet .row { display: block; margin: 0; border: 2px solid #E5E5E5; border-radius: 14px; padding: 8px 10px; }
#sdk-sheet .row .nm { display: block; font-size: 14px; font-weight: 800; }
#sdk-sheet .row .w { display: block; font-size: 12px; color: #777; margin-top: 1px; }
#sdk-sheet .row .pk { display: flex; gap: 6px; margin-top: 7px; }
#sdk-sheet .row .pk button { flex: 1; border: 2px solid #E5E5E5; border-bottom-width: 3px; background: #fff; border-radius: 10px; padding: 6px; font-size: 13px; font-weight: 800; color: #3C3C3C; cursor: pointer; }
#sdk-sheet .row .pk button.on.k { background: #D7FFB8; border-color: #58CC02; color: #478700; }
#sdk-sheet .row .pk button.on.b { background: #EDE3FF; border-color: #8E5CF6; color: #6A3CC9; }
#sdk-sheet .row .stay { margin-top: 5px; font-size: 12px; font-weight: 700; color: #1899D6; }
#sdk-sheet .none { font-size: 13px; color: #999; padding: 6px 0 12px; }
#sdk-sheet .grp { margin-bottom: 10px; }
#sdk-sheet .grp em { display: block; font-style: normal; font-size: 12px; font-weight: 800; color: #AFAFAF; margin: 0 0 5px; }
#sdk-sheet .scr { display: flex; flex-wrap: wrap; gap: 6px; }
#sdk-sheet .scr button { border: 2px solid #E5E5E5; border-bottom-width: 3px; background: #fff; border-radius: 12px; padding: 6px 10px; font-size: 13px; font-weight: 700; color: #3C3C3C; cursor: pointer; }
#sdk-sheet .foot { margin-top: 12px; font-size: 13px; color: #777; }
#sdk-sheet .foot a { color: #1899D6; font-weight: 800; }`;
  const root = document.createElement("div");
  root.id = "sdk";
  root.innerHTML = `<style>${css}</style>
    <button id="sdk-tab" aria-label="Sounds"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19.5 6a8.5 8.5 0 0 1 0 12"/></svg><span id="sdk-lab"></span></button>
    <div id="sdk-note"></div>
    <div id="sdk-veil"></div>
    <div id="sdk-sheet" role="dialog" aria-label="Sounds"></div>`;
  document.body.appendChild(root);
  const tab = root.querySelector("#sdk-tab"), note = root.querySelector("#sdk-note"), veil = root.querySelector("#sdk-veil"), sheet = root.querySelector("#sdk-sheet");
  /* the sheet and the tab never pass a tap on to the app underneath */
  ["pointerdown", "click", "touchstart"].forEach(t => root.addEventListener(t, e => e.stopPropagation()));

  const heard = [];
  let noteT = 0;
  window.__SON = e => {
    const played = e.act === "app" || (e.act.indexOf("bri:") === 0 && ["silent", "muted", "once", "no-tap-yet"].indexOf(e.act.slice(4)) < 0);
    const at = heard.findIndex(h => h.id === e.id);
    if (at >= 0) heard.splice(at, 1);
    heard.unshift({ id: e.id, act: e.act });
    if (heard.length > 12) heard.pop();
    if (played) {
      const bri = e.act.indexOf("bri:") === 0;
      note.innerHTML = `<b class="${bri ? "bri" : ""}">${bri ? "Brilliant" : "Ours"}</b> — ${esc(name(e.id))}`;
      note.classList.add("on");
      clearTimeout(noteT); noteT = setTimeout(() => note.classList.remove("on"), 1600);
    }
    if (sheet.classList.contains("on")) paint();
  };
  const setMode = m => {
    window.__SMODE = m;
    try { const u = new URL(location.href); u.searchParams.set("snd", m); history.replaceState(null, "", u); } catch (e) {}
    paintTab(); paint();
  };
  const paintTab = () => { const m = mode(); tab.className = m; root.querySelector("#sdk-lab").textContent = m === "bri" ? "Bri" : "Now"; };
  const go = (hash, after) => {
    const u = new URL(location.href);
    u.searchParams.set("snd", mode()); u.searchParams.set("dev", "1"); u.searchParams.set("r", Date.now());
    if (after) u.searchParams.set("after", after); else u.searchParams.delete("after");
    u.hash = hash;
    location.href = u.toString();
  };
  function paint() {
    load();
    const m = mode();
    const rows = heard.map(h => {
      const id = h.id, sw = swappable(id), bri = M[id] && M[id].brilliant;
      const what = h.act === "app" ? "played ours" : h.act === "silent" ? "silent now" : h.act.indexOf("bri:") === 0 ? (h.act.slice(4) === "no-tap-yet" ? "tap once first" : h.act.slice(4) === "muted" ? "sound is off in the app" : "played Brilliant's " + h.act.slice(4)) : h.act;
      const pk = sw ? `<div class="pk" data-id="${esc(id)}"><button class="k${picks[id] === "k" ? " on" : ""}">Keep ours</button><button class="b${picks[id] === "b" ? " on" : ""}">Brilliant</button></div>`
        : `<div class="stay">${bri === "keep" ? "Stays as it is in both" : "No Brilliant sound for this one"}</div>`;
      return `<div class="row"><div class="nm">${esc(name(id))}</div><div class="w">${esc(what)}</div>${pk}</div>`;
    }).join("");
    const ids = Object.keys(M).filter(swappable), chosen = ids.filter(id => picks[id] === "k" || picks[id] === "b").length;
    sheet.innerHTML = `<div class="top"><b>Sounds</b><button class="x" aria-label="Close">×</button></div>
      <div class="seg"><button class="now${m === "now" ? " on" : ""}" data-m="now">Today's sounds</button><button class="bri${m === "bri" ? " on" : ""}" data-m="bri">Brilliant's sounds</button></div>
      <p class="tip">Switch any time and play the same thing again. Our correct-answer sound and Duolingo's sounds stay the same in both.</p>
      <h3>Just heard</h3>
      ${rows ? `<div class="heard">${rows}</div>` : `<div class="none">Nothing yet — play the app and the sounds show up here.</div>`}
      <h3>Go to a screen</h3>
      ${SCREENS.map(([g, list]) => `<div class="grp"><em>${esc(g)}</em><div class="scr">${list.map(([l, h, a]) => `<button data-h="${esc(h)}" data-a="${esc(a || "")}">${esc(l)}</button>`).join("")}</div></div>`).join("")}
      <div class="foot">${chosen} of ${ids.length} sounds picked — the same picks as the <a href="/tools/brilliant-sounds/compare.html">full list</a>.</div>`;
    sheet.querySelector(".x").onclick = close;
    sheet.querySelectorAll(".seg button").forEach(b => { b.onclick = () => setMode(b.dataset.m); });
    sheet.querySelectorAll(".pk").forEach(p => {
      const id = p.dataset.id;
      p.querySelector(".k").onclick = () => { load(); picks[id] = "k"; save(); paint(); };
      p.querySelector(".b").onclick = () => { load(); picks[id] = "b"; save(); paint(); };
    });
    sheet.querySelectorAll(".scr button").forEach(b => { b.onclick = () => go(b.dataset.h, b.dataset.a); });
  }
  const open = () => { paint(); veil.classList.add("on"); sheet.classList.add("on"); };
  function close() { veil.classList.remove("on"); sheet.classList.remove("on"); }
  tab.onclick = () => (sheet.classList.contains("on") ? close() : open());
  veil.onclick = close;
  paintTab();
})();
