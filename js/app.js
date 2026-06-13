/* ============================================================
   قدراتي — Duolingo-style GAT quantitative trainer (Arabic, RTL)
   ============================================================ */
(function () {
"use strict";

/* ---------------- helpers ---------------- */
const $app = document.getElementById("app");
window.A = {}; // global handlers (filled in throughout the file)
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toAr = n => String(n).replace(/[0-9]/g, d => AR_DIGITS[d]);
const CMP_CHOICES = ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية"];
const LETTERS = ["أ", "ب", "جـ", "د"];
const DOMAIN_ORDER = ["skills", "numbers", "ratios", "geometry"];
/* Exact unit color sets from the Figma file: face, dark lip, dome shine, pale (white-button lip) */
const UNIT_COLORS = {
  green:  { c: "#58CC02", s: "#58A700", h: "#71DC1A", pale: "#CBE6B5" },
  blue:   { c: "#1CB0F6", s: "#1899D6", h: "#55C5F9", pale: "#BFE0F0" },
  purple: { c: "#CE82FF", s: "#A568CC", h: "#DAA0FF", pale: "#DBC3EB" },
  yellow: { c: "#FFC800", s: "#E6A000", h: "#FFE700", pale: "#EFE2BC" }
};
const LEVEL_HEARTS = 3;      // hearts per level — lose them all and you retry the level
const Q_SECS = 60;           // seconds per question — matches the real GAT pace
const FREEZE_COST = 10;      // blue gems to freeze the timer for the current question
const FIFTY_COST = 15;       // blue gems to remove two wrong choices (50/50)
const DAILY_GOAL = 10;       // questions to answer for today's quest chest
/* Real computerized GAT format (researched 2026): quant sections of 25
   min each, free navigation + flagging inside a section, sealed once
   ended. Official topic mix ≈ 40% arithmetic / 24% algebra /
   23% geometry / 13% statistics; lit track gets a lighter quant load. */
const MOCK_SECTION_PLAN = { sci: [6, 8, 4, 6], lit: [4, 5, 3, 3] }; // per-section counts in DOMAIN_ORDER [skills,numbers,ratios,geometry]
const MOCK_SECTIONS = 2;
const MOCK_SECS = 25 * 60;   // per section, like the real thing
const todayKey = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
const fmtTime = s => toAr(String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")) + ":" + toAr(String(Math.max(0, s) % 60).padStart(2, "0"));

function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

/* ---------------- state ---------------- */
const DEFAULT_STATE = { v: 1, disclaimer: false, user: null, track: "sci", sound: true, xp: 0, streak: { count: 0, last: null }, lessons: {}, qstats: {}, exam: null, examAsked: false, daily: null, mocks: [] };
let S;
try { S = Object.assign({}, DEFAULT_STATE, JSON.parse(localStorage.getItem("qudratState") || "{}")); }
catch (e) { S = Object.assign({}, DEFAULT_STATE); }
const save = () => localStorage.setItem("qudratState", JSON.stringify(S));

function bumpStreak() {
  const t = todayKey();
  if (S.streak.last === t) return;
  const y = new Date(Date.now() - 864e5);
  const yk = y.getFullYear() + "-" + (y.getMonth() + 1) + "-" + y.getDate();
  S.streak.count = (S.streak.last === yk) ? S.streak.count + 1 : 1;
  S.streak.last = t;
}

/* ---------------- sounds (WebAudio synth) ---------------- */
let AC = null;
function beep(seq) {
  if (!S.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    let t = AC.currentTime;
    seq.forEach(([f, dur]) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
      t += dur * 0.85;
    });
  } catch (e) { /* no audio */ }
}
const sndGood = () => beep([[660, .12], [880, .18]]);
const sndBad = () => beep([[330, .18], [262, .25]]);
const sndWin = () => beep([[523, .14], [659, .14], [784, .14], [1047, .3]]);
const sndLose = () => beep([[440, .16], [392, .16], [330, .18], [262, .42]]);
const sndTick = () => beep([[1080, .05]]);
const sndFreeze = () => beep([[1568, .07], [2093, .1], [1318, .18]]); // icy shimmer
const sndFifty = () => beep([[880, .06], [587, .14]]);                 // two-snip
const sndChest = () => beep([[392, .09], [523, .09], [659, .09], [784, .1], [1047, .14], [1568, .3]]); // treasure fanfare

/* ---------------- data access ---------------- */
function domains() { return DOMAIN_ORDER.map(k => (window.QBANK || {})[k]).filter(Boolean); }
function allLessons() {
  const out = [];
  domains().forEach(d => d.lessons.forEach(l => out.push({ dom: d, les: l, key: d.key + "." + l.key })));
  return out;
}
function trackFilter(qs) { return S.track === "lit" ? qs.filter(q => q.track !== "sci") : qs; }
function lessonProg(key) { return S.lessons[key] || { stars: 0, plays: 0 }; }

/* ---------------- exam countdown + readiness ---------------- */
function examDaysLeft() {
  if (!S.exam) return null;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(S.exam + "T00:00:00") - t) / 864e5);
}
/* 0–100: stars earned across all lessons (70%) + overall first-try accuracy (30%) */
function readiness() {
  const flat = allLessons();
  if (!flat.length) return 0;
  let earned = 0;
  flat.forEach(x => earned += lessonProg(x.key).stars);
  let r = 0, w = 0;
  Object.values(S.qstats).forEach(s => { r += s.r; w += s.w; });
  const acc = (r + w) ? r / (r + w) : 0;
  return Math.round(100 * (0.7 * earned / (flat.length * 3) + 0.3 * acc));
}
/* ---------------- daily quest (answer N questions → chest) ---------------- */
function dailyReset() {
  const t = todayKey();
  if (!S.daily || S.daily.day !== t) S.daily = { day: t, n: 0, claimed: false };
}
function dailyTick() {
  dailyReset();
  if (S.daily.n >= DAILY_GOAL) return;
  S.daily.n++;
  if (S.daily.n === DAILY_GOAL)
    setTimeout(() => toast(`🎁 اكتمل تمرين اليوم! صندوقك بانتظارك في الرئيسية`, "quest"), 1200);
}

function dayPhrase(n) {
  if (n === 1) return "يوم واحد";
  if (n === 2) return "يومان";
  if (n <= 10) return toAr(n) + " أيام";
  return toAr(n) + " يوماً";
}
const fmtExamDate = d => { const x = new Date(d + "T00:00:00"); return toAr(x.getDate()) + " / " + toAr(x.getMonth() + 1) + " / " + toAr(x.getFullYear()); };

/* ---------------- screens / router ---------------- */
let view = "path";
function render() { ({ path: renderPath, mock: renderMockHome, stats: renderStats, settings: renderSettings })[view](); }
function go(v) { view = v; render(); window.scrollTo(0, 0); }

const ICO_FILE = { "nav-exam": "nav-exam-64.png" }; // raster icons (user-provided art)
const ico = (name, size) => `<img class="ic" src="assets/icons/${ICO_FILE[name] || name + ".svg"}" width="${size}" height="${size}" alt="">`;

function statbar() {
  return `<div class="statbar">
    <div class="stat stat-streak">${ico("streak", 23)}${toAr(S.streak.count)}</div>
    <div class="stat stat-xp">${ico("gem", 22)}${toAr(S.xp)}</div>
  </div>`;
}
A.chestTap = function () {
  dailyReset();
  if (S.daily.claimed) { toast("🎁 عُد غداً لصندوق جديد"); return; }
  if (S.daily.n >= DAILY_GOAL) { A.openChest(); return; }
  toast(`باقي ${toAr(DAILY_GOAL - S.daily.n)} أسئلة لفتح صندوق اليوم 🎁`);
};
function bottomnav(active) {
  const items = [["path", "nav-home"], ["mock", "nav-exam"], ["stats", "nav-stats"], ["settings", "nav-more"]];
  return `<nav class="bottomnav">` + items.map(([k, i]) =>
    `<button class="navbtn ${active === k ? "active" : ""}" onclick="A.go('${k}')" aria-label="${k}">${ico(i, 30)}</button>`).join("") + `</nav>`;
}

/* ---------------- exam countdown card (top of path) ---------------- */
function countdownCard() {
  const days = examDaysLeft();
  if (days === null) {
    return `<div class="exam-card exam-card-empty" onclick="A.examSetup()">
      <div class="ec-row">${ico("timer", 28)}
        <div class="ec-txt"><b>متى اختبار قدراتك؟</b><span>حدد الموعد لنحسب لك العد التنازلي والجاهزية</span></div>
        <span class="ec-go">+</span>
      </div>
    </div>`;
  }
  const pct = readiness();
  const head = days > 0 ? `باقي <b class="ec-days">${dayPhrase(days)}</b> على الاختبار`
    : days === 0 ? `اختبارك <b class="ec-days">اليوم</b> — بالتوفيق! 💪`
      : `انتهى موعد اختبارك — حدّث الموعد`;
  return `<div class="exam-card" onclick="A.examSetup()">
    <div class="ec-row">${ico("timer", 28)}<div class="ec-head">${head}</div><span class="ec-edit" aria-hidden="true">✎</span></div>
    <div class="ec-ready">
      <span class="ec-label">جاهزيتك</span>
      <div class="ec-bar duo-bar"><i style="width:${pct}%;--bar-c:var(--gold);--bar-shine:var(--gold-soft);animation-delay:.35s"></i></div>
      <b class="ec-pct">${toAr(pct)}٪</b>
    </div>
  </div>`;
}

/* ---------------- daily quest card + chest ---------------- */
/* Duolingo-style chest, redrawn by hand from the design-system
   proportions: big rounded lid with a lighter inner panel hanging
   over a narrower base, gold strap + latch. Lid is its own group so
   the ceremony can swing it open. */
function chestSVG(cls) {
  return `<svg class="qc-chest ${cls || ""}" viewBox="0 0 56 52" fill="none" aria-hidden="true">
    <ellipse class="ch-glow" cx="28" cy="26" rx="17" ry="7" fill="#FFE700"/>
    <g class="ch-base">
      <path d="M9 26 H47 V42 Q47 48 41 48 H15 Q9 48 9 42 Z" fill="#AA572A"/>
      <path d="M9 40 H47 V42 Q47 48 41 48 H15 Q9 48 9 42 Z" fill="#90461F"/>
      <rect x="23" y="26" width="10" height="22" fill="#FFC800"/>
      <rect x="23" y="44" width="10" height="4" fill="#E6A000"/>
      <rect x="20" y="23" width="16" height="15" rx="4.5" fill="#FFC800"/>
      <rect x="20" y="32" width="16" height="6" rx="3" fill="#E6A000"/>
      <circle cx="28" cy="29" r="2.6" fill="#90461F"/>
      <rect x="26.7" y="29" width="2.6" height="5" rx="1.3" fill="#90461F"/>
    </g>
    <g class="ch-lid">
      <rect x="4" y="2" width="48" height="24" rx="10" fill="#C07F41"/>
      <rect x="10" y="8" width="36" height="13" rx="5.5" fill="#E5AE7C"/>
      <rect x="4" y="21" width="48" height="5" fill="#90461F"/>
      <rect x="23" y="2" width="10" height="24" fill="#FFC800"/>
      <rect x="23" y="2" width="10" height="4" fill="#FFE700"/>
      <rect x="23" y="21" width="10" height="5" fill="#E6A000"/>
    </g>
  </svg>`;
}

/* Floating daily chest (Duolingo style): fixed above the bottom nav
   on the path, stays put while scrolling. The pill under it shows
   the n/10 count, a pulsing "افتح!" when ready, or a green ✓. */
function floatingQuest() {
  dailyReset();
  const n = S.daily.n, ready = n >= DAILY_GOAL && !S.daily.claimed;
  return `<button class="chest-float ${ready ? "ready" : ""} ${S.daily.claimed ? "claimed" : ""}" onclick="A.chestTap()" aria-label="صندوق اليوم">
    ${chestSVG("cf-chest" + (ready ? " qc-bounce" : n >= DAILY_GOAL - 2 && !S.daily.claimed ? " qc-excited" : ""))}
    ${S.daily.claimed ? `<span class="sc-pill sc-done">${CHECK_BADGE}</span>`
      : ready ? `<span class="sc-pill sc-open">افتح!</span>`
        : `<span class="sc-pill sc-count">${toAr(n)}/${toAr(DAILY_GOAL)}</span>`}
  </button>`;
}

/* Chest-opening ceremony: veil → chest drops & lands with a squash →
   anticipation shakes → lid swings open with sunrays, flash, flying
   gems → reward pops in → claim */
A.openChest = function () {
  dailyReset();
  if (S.daily.n < DAILY_GOAL || S.daily.claimed) return;
  const gems = 12 + Math.floor(Math.random() * 7); // 12–18
  const veil = document.createElement("div");
  veil.className = "chest-veil";
  veil.innerHTML = `<div class="chest-scene">
    <span class="cs-rays"></span>
    <span class="cs-flash"></span>
    <div class="cs-chest">${chestSVG("qc-big")}</div>
    <div class="cs-burst"></div>
    <div class="cs-reward">${ico("gem", 36)}<b>+${toAr(gems)}</b></div>
    <h2 class="cs-title">صندوق اليوم!</h2>
    <button class="btn cs-btn" onclick="A.claimChest(${gems})">رائع!</button>
  </div>`;
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("drop"));
  setTimeout(() => veil.classList.add("shake"), 850);
  setTimeout(() => {
    veil.classList.add("open");
    sndChest();
    const burst = veil.querySelector(".cs-burst");
    for (let i = 0; i < 12; i++) {
      const dx = (Math.random() * 2 - 1) * 130;
      const up = -(70 + Math.random() * 120);
      const el = document.createElement("img");
      el.src = "assets/icons/gem.svg";
      el.className = "cs-gem";
      el.style.cssText = `--dx:${dx.toFixed(0)}px;--up:${up.toFixed(0)}px;--rot:${((Math.random() * 2 - 1) * 220).toFixed(0)}deg;animation-delay:${(i * 0.045).toFixed(2)}s;width:${(16 + Math.random() * 14).toFixed(0)}px`;
      burst.appendChild(el);
    }
  }, 1650);
  setTimeout(() => veil.classList.add("rewarded"), 2150);
};
A.claimChest = function (gems) {
  S.xp += gems; S.daily.claimed = true; save();
  const v = document.querySelector(".chest-veil");
  if (v) { v.classList.add("out"); setTimeout(() => { v.remove(); render(); }, 380); }
  else render();
};

/* ---------------- PATH (home) ---------------- */
function renderPath() {
  const ds = domains();
  if (!ds.length) {
    $app.innerHTML = statbar() + `<div class="screen"><div class="empty-note">⭐<br>بنك الأسئلة قيد التحميل…<br>تأكد من وجود ملفات js/data ثم حدّث الصفحة.</div></div>` + bottomnav("path");
    return;
  }
  const flat = allLessons();
  let firstOpenIdx = flat.findIndex(x => lessonProg(x.key).stars === 0);
  if (firstOpenIdx === -1) firstOpenIdx = flat.length;
  let gi = 0, html = "";
  const offsets = [0, -55, -80, -55, 0, 55, 80, 55]; // winding path x-offsets
  ds.forEach((d, di) => {
    const u = UNIT_COLORS[d.color] || UNIT_COLORS.purple;
    html += `<div class="unit-banner u-${d.color === "yellow" ? "gold" : d.color}">
      <div class="u-txt"><div class="u-kicker">القسم ${toAr(1)}، الوحدة ${toAr(di + 1)}</div><h2>${d.title}</h2></div>
      <div class="u-side"><span class="u-divider"></span>${ico("guide", 24)}</div>
    </div><div class="path">`;
    d.lessons.forEach((l, li) => {
      const key = d.key + "." + l.key, p = lessonProg(key);
      const done = p.stars > 0, open = gi <= firstOpenIdx, current = gi === firstOpenIdx;
      const cls = done ? "node-done" : open ? "" : "node-locked";
      const x = offsets[gi % offsets.length];
      // every node is a star: gold star-done when completed, the white star otherwise
      const nodeIcon = done ? ico("star-done", 40) : ico("star", 40);
      const ring = current ? `<svg class="node-ring" viewBox="0 0 89 84" fill="none">
          <ellipse cx="44.5" cy="42" rx="41.5" ry="39" stroke="#E5E5E5" stroke-width="6"/>
          <path d="M 44.5 3 A 41.5 39 0 0 1 81.5 25" stroke="${u.c}" stroke-width="6" stroke-linecap="round"/>
        </svg>` : "";
      // exact Figma "Level" colors per state: gold done / unit-color open / gray locked
      const nc = done ? ["#FFC800", "#E6A000", "#FFE700"] : open ? [u.c, u.s, u.h] : ["#E5E5E5", "#B7B7B7", "transparent"];
      html += `<div class="path-row"><div class="${current ? "bob" : ""}" style="position:relative;display:inline-block;right:${x}px">
        ${ring}
        <button class="node ${cls}" style="--node-c:${nc[0]};--node-s:${nc[1]};--node-h:${nc[2]};--d:${(gi % 10) * 0.06}s"
          ${open ? `onclick="A.nodeTap(event,'${d.key}','${l.key}',${li})"` : "disabled"}>
          ${current ? `<span class="node-tip" style="color:${u.c}">ابدأ</span>` : ""}
          ${nodeIcon}
        </button>
      </div></div>`;
      gi++;
    });
    html += `</div>`;
  });
  $app.innerHTML = statbar() + `<div class="screen">${countdownCard()}${html}<div style="height:20px"></div></div>` + floatingQuest() + bottomnav("path");
}


/* ---------------- LESSON SESSION ---------------- */
let SES = null; // current session

function pickLessonQuestions(lesson, key) {
  const qs = trackFilter(lesson.questions);
  const stat = q => { const s = S.qstats[q.id] || { r: 0, w: 0 }; return s.r - s.w; };
  // least-mastered first, then keep official easy→hard ordering
  const chosen = qs.slice().sort((a, b) => stat(a) - stat(b) || a.difficulty - b.difficulty).slice(0, 8);
  return chosen.sort((a, b) => a.difficulty - b.difficulty);
}

A.go = go;

/* Lesson-start popup (Figma "Select Lesson" purple sheet) */
A.nodeTap = function (ev, domKey, lesKey, li) {
  const d = window.QBANK[domKey], l = d.lessons.find(x => x.key === lesKey);
  const u = UNIT_COLORS[d.color] || UNIT_COLORS.purple;
  const old = document.querySelector(".lesson-pop-veil"); if (old) old.remove();
  const btn = ev.currentTarget;
  const r = btn.getBoundingClientRect();
  const veil = document.createElement("div");
  veil.className = "lesson-pop-veil";
  veil.innerHTML = `<div class="lesson-pop" style="--pop-c:${u.c};top:${Math.min(r.bottom + 14, window.innerHeight - 190)}px">
    <h3>${l.title}</h3>
    <div class="lp-sub">الدرس ${toAr(li + 1)} من ${toAr(d.lessons.length)}</div>
    <button class="btn btn-white" style="color:${u.c};box-shadow:0 5px 0 ${u.pale}">ابدأ</button>
  </div>`;
  veil.onclick = e => { if (e.target === veil) veil.remove(); };
  veil.querySelector(".btn").onclick = () => { veil.remove(); A.startLesson(domKey, lesKey); };
  document.body.appendChild(veil);
  const pop = veil.querySelector(".lesson-pop");
  const pr = pop.getBoundingClientRect();
  pop.style.setProperty("--arrow-x", Math.max(24, Math.min(pr.width - 24, pr.right - (r.left + r.width / 2))) + "px");
};

A.startLesson = function (domKey, lesKey) {
  const d = window.QBANK[domKey], l = d.lessons.find(x => x.key === lesKey);
  const key = domKey + "." + lesKey;
  const qs = pickLessonQuestions(l, key);
  if (!qs.length) { showModal("⭐", "لا توجد أسئلة", "لا توجد أسئلة متاحة لهذا الدرس في مسارك الحالي.", "حسناً"); return; }
  SES = { mode: "lesson", domKey, lesKey, key, title: l.title, method: l.method || "", queue: qs.slice(), total: qs.length, idx: 0, done: 0, firstTry: {}, retried: {}, sel: null, locked: false, xp: 0, hearts: LEVEL_HEARTS, left: Q_SECS, timer: null, tSpent: 0, tAnswered: 0, frozen: false, fiftyUsed: false };
  renderSession();
};

/* Renders solution/method text (\n lines) as styled steps; lines with 💡 or
   warning words become a highlighted callout. Shared by the solution box
   and the method sheet. */
const BULB_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2Z"/></svg>`;
function formatExplain(text) {
  return String(text).split("\n").map(line => {
    const t = line.trim();
    if (!t) return "";
    const warn = /^💡|^الخطأ|^انتبه|^ملاحظة|^تنبيه|الخطأ الشائع/.test(t);
    const body = esc(t.replace(/^💡\s*/, ""));
    if (warn) return `<div class="ex-tip">${BULB_SVG}<span>${body}</span></div>`;
    return `<div class="ex-step">${body}</div>`;
  }).join("");
}

function questionBody(q, selIdx, lockHandlers, pickFn, method) {
  const isCmp = q.format === "comparison";
  const choices = isCmp ? CMP_CHOICES : q.choices;
  let h = `<div class="q-top"><div class="q-kicker">${isCmp ? "قارن بين القيمتين ثم اختر:" : "اختر الإجابة الصحيحة:"}</div>${method ? `<button class="method-btn" onclick="A.showMethod()">${BULB_SVG} كيف أحلّها؟</button>` : ""}</div>`;
  if (q.stem) h += `<div class="q-stem">${q.stem}</div>`;
  if (q.figure) h += `<div class="q-figure">${q.figure}</div>`;
  if (isCmp) h += `<div class="cmp-wrap">
      <div class="cmp-box"><div class="cmp-t">القيمة الأولى</div><div class="cmp-v">${q.value1}</div></div>
      <div class="cmp-box"><div class="cmp-t">القيمة الثانية</div><div class="cmp-v">${q.value2}</div></div></div>`;
  h += `<div class="choices">` + choices.map((c, i) =>
    `<button class="choice ${selIdx === i ? "sel" : ""}" data-ci="${i}" style="--d:${0.05 + i * 0.07}s" ${lockHandlers ? "" : `onclick="${pickFn || "A.pick"}(${i})"`}>
       <span class="ch-letter">${LETTERS[i]}</span><span>${c}</span></button>`).join("") + `</div>`;
  return h;
}

const X_SVG = `<svg class="ic" width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 3L17 17M17 3L3 17" stroke="#AFAFAF" stroke-width="3" stroke-linecap="round"/></svg>`;

/* Exact Duolingo shapes from the Figma file (heart 8:550, timer 11:1884) */
const HEART_PATH = "M1.32941 2.77171C4.15094 -1.25905 9.22298 1.09223 11.4063 2.77171C13.4218 0.756343 17.9564 -1.76288 21.4833 1.76402C25.0102 5.29093 21.4833 10.3294 19.9718 11.8409C18.8677 12.945 14.5996 16.9331 12.0759 19.2802C11.6957 19.6338 11.1101 19.6392 10.722 19.2942L2.3371 11.8409C0.825562 10.4973 -1.49213 6.80248 1.32941 2.77171Z";
const TIMER_SVG = `<svg class="qt-svg" width="28" height="28" viewBox="0 0 22 22" fill="none">
  <circle class="qt-face" cx="11" cy="11" r="9.72" stroke="currentColor" stroke-width="2.5"/>
  <circle cx="11" cy="11.28" r="2.28" fill="currentColor" stroke="currentColor"/>
  <g class="qt-hand"><path d="M10.49 11.51L15.6 7.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></g>
</svg>`;

/* Big breaking-heart hero for the losing screen (heart split in two clipped halves)
   + shard burst at the crack moment + looping sonar ripples */
function brokenHeartHero() {
  const shards = [0, 1, 2, 3, 4, 5, 6, 7].map(i =>
    `<i class="bh-shard" style="--ang:${i * 45 + 12}deg;--dist:${72 + (i % 3) * 18}px;background:${i % 2 ? "#FF4B4B" : "#FFB2B2"}"></i>`).join("");
  return `<div class="fail-hero">
    ${shards}
    <svg class="bh-svg" viewBox="-3 -3 29 27">
      <defs>
        <clipPath id="bhL"><polygon points="-3,-3 12,-3 9.8,4.5 13,9 10,13.5 12.4,17.5 11.2,23 -3,23"/></clipPath>
        <clipPath id="bhR"><polygon points="12,-3 26,-3 26,23 11.2,23 12.4,17.5 10,13.5 13,9 9.8,4.5"/></clipPath>
      </defs>
      <g class="bh-half bh-l" clip-path="url(#bhL)"><path d="${HEART_PATH}" fill="#FF4B4B"/><circle cx="6.37" cy="7.31" r="3.02" fill="#FFB2B2"/></g>
      <g class="bh-half bh-r" clip-path="url(#bhR)"><path d="${HEART_PATH}" fill="#FF4B4B"/></g>
      <polyline class="bh-crack" points="11.4,0.6 9.8,4.5 13,9 10,13.5 12.4,17.5 11.4,19.4" fill="none" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/>
    </svg>
  </div>`;
}

function renderSession() {
  const q = SES.queue[SES.idx];
  const pct = Math.round(SES.done / SES.total * 100);
  $app.innerHTML = `
    <div class="screen screen-full">
      <div class="session-top">
        <button class="x-btn" onclick="A.quitSession()">${X_SVG}</button>
        <div class="progress"><i style="width:${pct}%"></i></div>
        <span class="sess-hearts" id="sesHearts">${ico("heart", 22)} ${toAr(SES.hearts)}</span>
      </div>
      ${timerBar()}
      <div class="q-area">${questionBody(q, SES.sel, false, null, SES.method)}</div>
      <div class="action-bar has-fab"><button class="btn" id="checkBtn" onclick="A.check()" ${SES.sel === null ? "disabled" : ""}>تحقق</button>${hintFab()}</div>
      <div class="feedback" id="fb"></div>
    </div>`;
  startQTimer();
}

/* 90-second countdown — horizontal capsule whose colored fill drains away */
function startQTimer() {
  clearInterval(SES.timer);
  SES.left = Q_SECS;
  // kick the fill so it starts gliding down over the first second
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const f = document.getElementById("qtFill");
    if (f && SES && !SES.frozen) f.style.width = ((Q_SECS - 1) / Q_SECS * 100) + "%";
  }));
  SES.timer = setInterval(() => {
    SES.left--;
    const f = document.getElementById("qtFill"), n = document.getElementById("qtNum"), w = document.getElementById("qtWrap");
    if (n) n.textContent = toAr(Math.max(0, SES.left));
    if (f) f.style.width = (Math.max(0, SES.left - 1) / Q_SECS * 100) + "%";
    if (w) { w.classList.toggle("low", SES.left <= 15 && SES.left > 5); w.classList.toggle("crit", SES.left <= 5); }
    if (SES.left <= 5 && SES.left > 0) sndTick();
    if (SES.left <= 0) { clearInterval(SES.timer); timeUp(); }
  }, 1000);
}
function stopQTimer() {
  if (SES && SES.timer) { clearInterval(SES.timer); SES.timer = null; }
  const w = document.getElementById("qtWrap");
  if (w) w.classList.add("paused");
}

/* ---------------- question timer (Duolingo-style draining capsule) ---------------- */
const CLOCK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 1.8"/></svg>`;
function timerBar() {
  return `<div class="qtimer" id="qtWrap" title="الوقت المتبقي">
    <span class="qt-ico">${CLOCK_SVG}</span>
    <div class="qt-track"><i class="qt-fill" id="qtFill"></i></div>
    <b class="qt-num" id="qtNum">${toAr(Q_SECS)}</b>
  </div>`;
}

/* ---------------- in-level hints (paid with blue gems = S.xp) ---------------- */
const SNOWFLAKE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
  <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/>
  <path d="M12 6l-2.4-2.4M12 6l2.4-2.4M12 18l-2.4 2.4M12 18l2.4 2.4M6 12l-2.4-2.4M6 12l-2.4 2.4M18 12l2.4-2.4M18 12l2.4 2.4"/></svg>`;
const SCISSORS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.6 8.6L21 21M8.6 15.4L21 3M12 12l3 3"/></svg>`;

const CHECK_BADGE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 6.8"/></svg>`;
const PLUS_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;

/* Floating "+" in the action bar; tapping it gooey-blooms the two
   power-up bubbles out of it (SVG #goo filter does the liquid merge) */
function hintFab() {
  const freezeOk = !SES.frozen && S.xp >= FREEZE_COST;
  const fiftyOk = !SES.fiftyUsed && S.xp >= FIFTY_COST;
  return `<div class="hint-fab" id="hintFab">
    <svg class="goo-defs" width="0" height="0" aria-hidden="true"><defs><filter id="goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b"/>
      <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11" result="g"/>
      <feComposite in="SourceGraphic" in2="g" operator="atop"/>
    </filter></defs></svg>
    <div class="fab-goo">
      <button class="fab-bubble fab-fifty fifty-btn ${SES.fiftyUsed ? "used" : ""}" onclick="A.useFifty()" ${fiftyOk ? "" : "disabled"}>${SES.fiftyUsed ? CHECK_BADGE : SCISSORS}</button>
      <button class="fab-bubble fab-freeze freeze-btn ${SES.frozen ? "used" : ""}" onclick="A.useFreeze()" ${freezeOk ? "" : "disabled"}>${SES.frozen ? CHECK_BADGE : SNOWFLAKE}</button>
      <button class="fab-main" onclick="A.toggleHints()" aria-label="المساعدات" title="المساعدات">${PLUS_SVG}</button>
    </div>
    <span class="fab-chip chip-freeze">${SES.frozen ? "تم التجميد" : `تجميد الوقت ${ico("gem", 14)} ${toAr(FREEZE_COST)}`}</span>
    <span class="fab-chip chip-fifty">${SES.fiftyUsed ? "تم الحذف" : `حذف إجابتين ${ico("gem", 14)} ${toAr(FIFTY_COST)}`}</span>
    <span class="fab-chip chip-bal hint-bal" title="رصيدك من الجواهر">${ico("gem", 16)} ${toAr(S.xp)}</span>
  </div>`;
}
A.toggleHints = function () {
  const f = document.getElementById("hintFab");
  if (!f) return;
  if (f.classList.toggle("open"))
    setTimeout(() => document.addEventListener("click", closeFabOutside), 0);
};
function closeFabOutside(e) {
  const f = document.getElementById("hintFab");
  if (f && f.classList.contains("open") && f.contains(e.target)) return;
  if (f) f.classList.remove("open");
  document.removeEventListener("click", closeFabOutside);
}
/* Update hints in place (no DOM nuke) so the press/use animation actually plays */
function setHintBalance() {
  const b = document.querySelector(".hint-bal");
  if (b) b.innerHTML = `${ico("gem", 16)} ${toAr(S.xp)}`;
}
function syncHintAffordability() {
  const fr = document.querySelector(".freeze-btn"), fi = document.querySelector(".fifty-btn");
  if (fr && !fr.classList.contains("used")) fr.disabled = SES.frozen || S.xp < FREEZE_COST;
  if (fi && !fi.classList.contains("used")) fi.disabled = SES.fiftyUsed || S.xp < FIFTY_COST;
}
function markHintUsed(which) {
  const btn = document.querySelector(which === "freeze" ? ".freeze-btn" : ".fifty-btn");
  if (btn) {
    btn.disabled = true;
    btn.classList.add("used", "just-used");
    btn.innerHTML = CHECK_BADGE;
    setTimeout(() => btn.classList.remove("just-used"), 650);
  }
  const chip = document.querySelector(which === "freeze" ? ".chip-freeze" : ".chip-fifty");
  if (chip) chip.textContent = which === "freeze" ? "تم التجميد" : "تم الحذف";
  setHintBalance();
  syncHintAffordability();
  // let the checkmark breathe, then tuck the menu back into the +
  setTimeout(() => { const f = document.getElementById("hintFab"); if (f) f.classList.remove("open"); }, 1100);
}
let toastT = null;
function toast(msg, kind) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.className = "toast " + (kind || "") + " show";
  t.innerHTML = msg;
  clearTimeout(toastT);
  toastT = setTimeout(() => { t.classList.remove("show"); }, 1900);
}

function loseHeart() {
  SES.hearts = Math.max(0, SES.hearts - 1);
  const el = document.getElementById("sesHearts");
  if (el) {
    el.innerHTML = `${ico("heart", 22)} ${toAr(SES.hearts)}`;
    el.classList.remove("hurt"); void el.offsetWidth; el.classList.add("hurt");
    if (SES.hearts === 0) el.classList.add("dead");
  }
}

function timeUp() {
  if (!SES || SES.locked) return;
  SES.locked = true;
  SES.tSpent += Q_SECS; SES.tAnswered++;
  const q = SES.queue[SES.idx];
  const qs = S.qstats[q.id] = S.qstats[q.id] || { r: 0, w: 0 };
  qs.w++;
  if (!(q.id in SES.firstTry)) SES.firstTry[q.id] = false;
  SES.retried[q.id] = true;
  SES.queue.push(q);
  loseHeart();
  document.querySelectorAll(".choice").forEach((b, j) => {
    b.disabled = true;
    if (j === q.answer) b.classList.add("correct"); else b.classList.add("dim");
  });
  dailyTick();
  const isCmp = q.format === "comparison";
  const correctTxt = LETTERS[q.answer] + " — " + (isCmp ? CMP_CHOICES[q.answer] : q.choices[q.answer]);
  sndBad();
  const fb = document.getElementById("fb");
  fb.className = "feedback bad show";
  fb.innerHTML = `<div class="fb-head"><span class="fb-x">⏰</span> انتهى الوقت!</div>
    <div class="fb-correct">الإجابة الصحيحة: ${correctTxt}</div>
    <button class="fb-solution-toggle" onclick="A.toggleSol()">اعرض الحل</button>
    <div class="fb-solution" id="sol" style="display:none">${esc(q.solution)}</div>
    <button class="btn btn-red" onclick="A.next()">متابعة</button>`;
  save();
}

A.pick = function (i) {
  if (SES.locked) return;
  const btn = document.querySelector(`.choice[data-ci="${i}"]`);
  if (btn && btn.classList.contains("eliminated")) return; // can't pick a removed choice
  SES.sel = i;
  document.querySelectorAll(".choice").forEach((b, j) => b.classList.toggle("sel", j === i));
  document.getElementById("checkBtn").disabled = false;
};

/* Freeze the countdown for the current question (Duolingo-style ice on the ring) */
A.useFreeze = function () {
  if (!SES || SES.locked || SES.frozen || S.xp < FREEZE_COST) return;
  S.xp -= FREEZE_COST; SES.frozen = true; save();
  if (SES.timer) { clearInterval(SES.timer); SES.timer = null; } // stop the drain
  const w = document.getElementById("qtWrap");
  if (w) {
    w.classList.remove("low", "crit");
    w.classList.add("frozen");
    const tr = w.querySelector(".qt-track");
    if (tr && !tr.querySelector(".qt-ice")) tr.insertAdjacentHTML("beforeend", `<span class="qt-ice"></span>`);
    const n = document.getElementById("qtNum");
    if (n) { n.innerHTML = SNOWFLAKE; n.classList.add("qt-num-frozen"); }
  }
  sndFreeze();
  toast(`${SNOWFLAKE} تم تجميد الوقت`, "ice");
  markHintUsed("freeze");
};

/* 50/50 — remove two wrong choices for the current question */
A.useFifty = function () {
  if (!SES || SES.locked || SES.fiftyUsed || S.xp < FIFTY_COST) return;
  const q = SES.queue[SES.idx];
  const n = (q.format === "comparison" ? CMP_CHOICES : q.choices).length;
  const wrong = [];
  for (let i = 0; i < n; i++) if (i !== q.answer) wrong.push(i);
  if (wrong.length < 2) return;
  const hide = shuffle(wrong).slice(0, 2);
  S.xp -= FIFTY_COST; SES.fiftyUsed = true; save();
  document.querySelectorAll(".choice").forEach(b => {
    if (hide.indexOf(+b.dataset.ci) === -1) return;
    b.classList.add("eliminated");
    b.classList.remove("sel");
    b.disabled = true;
    if (SES.sel === +b.dataset.ci) { SES.sel = null; const c = document.getElementById("checkBtn"); if (c) c.disabled = true; }
  });
  sndFifty();
  toast(`${SCISSORS} حُذفت إجابتان خاطئتان`, "snip");
  markHintUsed("fifty");
};

A.check = function () {
  if (SES.sel === null || SES.locked) return;
  SES.locked = true;
  stopQTimer();
  SES.tSpent += Q_SECS - SES.left; SES.tAnswered++;
  const q = SES.queue[SES.idx];
  const correct = SES.sel === q.answer;
  const qs = S.qstats[q.id] = S.qstats[q.id] || { r: 0, w: 0 };
  correct ? qs.r++ : qs.w++;
  if (!(q.id in SES.firstTry)) SES.firstTry[q.id] = correct;
  dailyTick();

  document.querySelectorAll(".choice").forEach((b, j) => {
    b.disabled = true;
    if (j === q.answer) b.classList.add("correct");
    else if (j === SES.sel) b.classList.add(correct ? "correct" : "wrong");
    else b.classList.add("dim");
  });

  const isCmp = q.format === "comparison";
  const correctTxt = LETTERS[q.answer] + " — " + (isCmp ? CMP_CHOICES[q.answer] : q.choices[q.answer]);
  const fb = document.getElementById("fb");
  if (correct) {
    sndGood();
    SES.done++;
    SES.xp += SES.retried[q.id] ? 5 : 10;
    fb.className = "feedback good show";
    fb.innerHTML = `<div class="fb-head"><span class="fb-ok">${CHECK_BADGE}</span> أحسنت!</div>
      <button class="fb-solution-toggle" onclick="A.toggleSol()">لماذا؟ اعرض الحل</button>
      <div class="fb-solution" id="sol" style="display:none">${esc(q.solution)}</div>
      <button class="btn" onclick="A.next()">متابعة</button>`;
  } else {
    sndBad();
    SES.retried[q.id] = true;
    SES.queue.push(q); // Duolingo behavior: wrong question comes back at the end
    loseHeart();
    fb.className = "feedback bad show";
    fb.innerHTML = `<div class="fb-head"><span class="fb-x">✕</span> إجابة غير صحيحة</div>
      <div class="fb-correct">الإجابة الصحيحة: ${correctTxt}</div>
      <button class="fb-solution-toggle" onclick="A.toggleSol()">اعرض الحل</button>
      <div class="fb-solution" id="sol" style="display:none">${esc(q.solution)}</div>
      <button class="btn btn-red" onclick="A.next()">متابعة</button>`;
  }
  save();
};

A.toggleSol = function () { const s = document.getElementById("sol"); s.style.display = s.style.display === "none" ? "block" : "none"; };

/* Method sheet (كيف أحلّها؟): teacher explains the approach for this
   question TYPE — no answer. Slides up from the bottom, Duolingo-style. */
A.showMethod = function () {
  if (!SES || !SES.method) return;
  const old = document.querySelector(".method-veil"); if (old) old.remove();
  const veil = document.createElement("div");
  veil.className = "method-veil";
  veil.innerHTML = `<div class="method-sheet">
    <div class="ms-grip"></div>
    <div class="ms-head"><span class="ms-bulb">${BULB_SVG}</span><h3>طريقة الحل</h3></div>
    <div class="ms-sub">هذي الطريقة العامة لهذا النوع — جرّب تطبّقها بنفسك 👇</div>
    <div class="ms-body">${formatExplain(SES.method)}</div>
    <button class="btn ms-close" onclick="A.closeMethod()">فهمت، بحاول</button>
  </div>`;
  veil.onclick = e => { if (e.target === veil) A.closeMethod(); };
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));
};
A.closeMethod = function () {
  const v = document.querySelector(".method-veil");
  if (!v) return;
  v.classList.remove("show");
  setTimeout(() => v.remove(), 280);
};

A.debugCurrent = function () { return SES && SES.queue[SES.idx]; }; // dev harness (preview.html) only
A.debugMock = function () { return MOCK && MOCK.sections[MOCK.si].items[MOCK.qi].q; }; // dev harness only

A.next = function () {
  if (SES.hearts <= 0) { sessionFailed(); return; }
  SES.idx++; SES.sel = null; SES.locked = false; SES.frozen = false; SES.fiftyUsed = false;
  if (SES.done >= SES.total || SES.idx >= SES.queue.length) { lessonComplete(); return; }
  renderSession();
};

A.quitSession = function () {
  if (confirm("هل تريد إنهاء الجلسة؟ سيضيع تقدمك في هذا الدرس.")) { stopQTimer(); SES = null; go("path"); }
};

A.retryLevel = function (domKey, lesKey) { A.startLesson(domKey, lesKey); };

function countUpTime(el, to) {
  const t0 = performance.now(), dur = 1200;
  (function f(t) {
    const p = Math.min(1, Math.max(0, (t - t0) / dur)), eased = 1 - Math.pow(1 - p, 3);
    const v = Math.round(to * eased);
    el.textContent = toAr(Math.floor(v / 60)) + ":" + toAr(String(v % 60).padStart(2, "0"));
    if (p < 1) requestAnimationFrame(f);
  })(t0);
}

function sessionFailed() {
  stopQTimer();
  const { domKey, lesKey, done, total, tSpent, tAnswered } = SES;
  const avgSecs = tAnswered ? Math.round(tSpent / tAnswered) : 0;
  sndLose();
  $app.innerHTML = `<div class="screen screen-full"><div class="complete fail-scene" id="failComp">
    ${brokenHeartHero()}
    <h1 class="fail-title">نفدت القلوب!</h1>
    <p class="fail-sub">وصلت إلى ${toAr(done)} من ${toAr(total)} — كنت قريباً!<br>أعد المستوى من البداية وحاول مجدداً</p>
    <div class="result-cards fail-cards">
      <div class="rcard rc-green fail-time"><div class="rc-t">متوسط الوقت</div><div class="rc-v">${TIMER_SVG} <span id="cv-avg">${toAr(0)}:${toAr("00")}</span></div></div>
      <div class="rcard rc-blue"><div class="rc-t">التقدم</div><div class="rc-v">${ico("target", 22)} ${toAr(done)}/${toAr(total)}</div></div>
    </div>
    <div class="fail-actions">
      <button class="btn" onclick="A.retryLevel('${domKey}','${lesKey}')">إعادة المستوى</button>
      <button class="btn btn-ghost" onclick="A.go('path')">العودة للمسار</button>
    </div>
  </div></div>`;
  setTimeout(() => { const el = document.getElementById("cv-avg"); if (el) countUpTime(el, avgSecs); }, 2300);
  SES = null;
}

function lessonComplete() {
  stopQTimer();
  const ft = Object.values(SES.firstTry);
  const acc = ft.length ? Math.round(ft.filter(Boolean).length / ft.length * 100) : 0;
  const stars = acc === 100 ? 3 : acc >= 75 ? 2 : 1;
  const perfect = acc === 100;
  if (perfect) SES.xp += 20;
  const p = S.lessons[SES.key] = S.lessons[SES.key] || { stars: 0, plays: 0 };
  p.plays++; p.stars = Math.max(p.stars, stars);
  S.xp += SES.xp;
  bumpStreak(); save(); sndWin();
  const xpWon = SES.xp, tTot = SES.tSpent;
  const dayWord = S.streak.count === 1 ? "يوم واحد" : S.streak.count === 2 ? "يومان" : S.streak.count <= 10 ? toAr(S.streak.count) + " أيام" : toAr(S.streak.count) + " يوماً";
  $app.innerHTML = `<div class="screen screen-full"><div class="complete win-scene" id="comp">
    ${flameHero(160)}
    <h1 class="win-title">أكملت الدرس!</h1>
    <p class="win-sub">${perfect ? "درس مثالي بلا أي خطأ!" : "أحسنت، واصل التقدم!"} سلسلتك مشتعلة منذ ${dayWord}</p>
    <div class="result-cards">
      <div class="rcard rc-gold"><div class="rc-t">الخبرة</div><div class="rc-v">${ico("lightning", 20)} <span id="cv-xp">٠</span></div></div>
      <div class="rcard rc-blue rc-time"><div class="rc-t">الوقت</div><div class="rc-v">${TIMER_SVG} <span id="cv-time">${toAr(0)}:${toAr("00")}</span></div></div>
      <div class="rcard rc-green"><div class="rc-t">الدقة</div><div class="rc-v">${ico("target", 22)} <span id="cv-acc">٠</span></div></div>
    </div>
    <div class="action-bar win-action" style="position:relative;right:auto;transform:none;max-width:340px;padding:0;background:none">
      <button class="btn" onclick="A.go('path')">متابعة</button>
    </div>
  </div></div>`;
  setTimeout(() => {
    const xpEl = document.getElementById("cv-xp"), accEl = document.getElementById("cv-acc"), tEl = document.getElementById("cv-time");
    if (xpEl) countUp(xpEl, xpWon); if (accEl) countUp(accEl, acc, "٪"); if (tEl) countUpTime(tEl, tTot);
  }, 700);
  SES = null;
}

/* SVG star (exact path from the design's Level Icon) used in animated heroes */
const STAR_PATH = "M18.2665 6.04527C19.33 3.69332 22.67 3.69333 23.7335 6.04527L25.9554 10.959C26.4018 11.9462 27.3458 12.616 28.425 12.7114L33.7515 13.1819C36.4147 13.4171 37.4631 16.7555 35.4126 18.4711L31.6082 21.6541C30.7372 22.3828 30.3524 23.5408 30.6139 24.6459L31.7621 29.4978C32.3649 32.045 29.6444 34.0885 27.3659 32.8L22.4767 30.0351C21.5604 29.5169 20.4396 29.5169 19.5233 30.0351L14.6341 32.8C12.3556 34.0885 9.63514 32.045 10.2379 29.4978L11.3861 24.6459C11.6476 23.5408 11.2628 22.3828 10.3918 21.6541L6.58741 18.4711C4.53685 16.7555 5.58529 13.4171 8.2485 13.1819L13.575 12.7114C14.6542 12.616 15.5982 11.9462 16.0446 10.959L18.2665 6.04527Z";
function starHero(size) {
  return `<div class="win-hero" style="--wh:${size}px">
    <span class="wh-glow"></span>
    <span class="wh-ring"></span>
    <svg class="wh-star" viewBox="3 2 36 33"><path d="${STAR_PATH}" fill="#FFC800" stroke="#E6A000" stroke-width="1.5"/></svg>
    <span class="wh-spark s1">✦</span><span class="wh-spark s2">✦</span>
    <span class="wh-spark s3">✦</span><span class="wh-spark s4">✦</span>
  </div>`;
}

/* Win-screen hero: the streak flame (exact paths from the Figma streak icon,
   assets/icons/streak.svg) drops in over rotating sunrays, then burns:
   body flickers, inner flame dances, embers rise, shards burst on impact */
const FLAME_OUTER = "M0 15.4517V5.69495C0 3.64091 1.54054 3.64089 2.56757 4.1544L4.62162 5.18143C5.47748 3.98323 7.39459 1.38144 8.21622 0.559817C9.24324 -0.46721 10.2703 0.0463035 11.2973 1.07333C12.3243 2.10036 15.4054 6.20847 16.9459 8.26252C18.4865 10.3166 19 12.3706 19 15.4517C19 18.5328 15.4054 23.6679 9.24324 23.6679C3.08108 23.6679 0 18.0193 0 15.4517Z";
const FLAME_INNER = "M6.16212 13.9112C6.98374 12.6787 8.21617 11.0013 8.72969 10.3166C8.90087 9.97423 9.44865 9.49495 10.2703 10.3166C11.2973 11.3436 12.3243 13.3977 12.8378 13.9112C13.3514 14.4247 13.8649 16.4787 12.8378 18.0193C11.8108 19.5598 10.2703 20.0733 9.24324 20.0733C8.21622 20.0733 6.67563 19.0463 6.16212 18.0193C5.64861 16.9922 5.13509 15.4517 6.16212 13.9112Z";
function flameHero(size) {
  const embers = Array.from({ length: 8 }, (_, i) =>
    `<i class="fh-ember" style="right:${18 + i * 8}%;--dx:${(i % 3 - 1) * 26}px;width:${4 + i % 4 * 2}px;height:${4 + i % 4 * 2}px;background:${["#FFC800", "#FF9600", "#FFE700"][i % 3]};animation-delay:${1.1 + i * .4}s;animation-duration:${1.5 + i % 4 * .4}s"></i>`).join("");
  const licks = [0, 1, 2, 3].map(i =>
    `<svg class="fh-lick fl${i + 1}" viewBox="0 0 19 24"><path d="${FLAME_OUTER}" fill="${i % 2 ? "#FFC800" : "#FF9600"}"/></svg>`).join("");
  return `<div class="win-hero win-hero-big flame-hero" style="--wh:${size}px">
    ${embers}${licks}
    <div class="fh-wrap">
      <svg class="fh-flame" viewBox="-2.5 -3 24 29.5">
        <path class="fh-outer" d="${FLAME_OUTER}" fill="#FF9600"/>
        <path class="fh-inner" d="${FLAME_INNER}" fill="#FFC800"/>
      </svg>
    </div>
    <span class="wh-spark s1">✦</span><span class="wh-spark s2">✦</span>
    <span class="wh-spark s3">✦</span><span class="wh-spark s4">✦</span>
  </div>`;
}
function countUp(el, to, suffix) {
  const t0 = performance.now(), dur = 900;
  (function f(t) {
    const p = Math.min(1, Math.max(0, (t - t0) / dur)), eased = 1 - Math.pow(1 - p, 3);
    el.textContent = toAr(Math.round(to * eased)) + (suffix || "");
    if (p < 1) requestAnimationFrame(f);
  })(t0);
}

/* ============================================================
   MOCK EXAM (محاكاة الاختبار) — one timed section like the real
   GAT: 20 mixed questions, 25 minutes, no hints, no feedback
   until the end. Result: predicted score + per-domain breakdown
   + mistakes review.
   ============================================================ */
let MOCK = null;
let MOCK_REVIEW = []; // last finished mock, for the result answer grid

function renderMockHome() {
  const mocks = S.mocks || [];
  const best = mocks.reduce((b, m) => Math.max(b, Math.round(m.score / m.total * 100)), 0);
  const last = mocks[mocks.length - 1];
  const estOf = m => Math.round(35 + 65 * m.score / m.total);
  $app.innerHTML = statbar() + `<div class="screen"><div class="page">
    <h1>محاكاة الاختبار</h1><div class="sub">جرّب جو الاختبار الحقيقي وقس مستواك</div>
    <div class="mock-hero-card">
      <div class="mh-trophy"><img class="ic" src="assets/icons/nav-exam-192.png" width="84" height="84" alt=""></div>
      <div class="mh-rules">
        <div class="mh-rule">${ico("guide", 20)} قسمان كمّيان × ${toAr(S.track === "lit" ? 15 : 24)} سؤالاً — بالتوزيع الرسمي للمواضيع</div>
        <div class="mh-rule">${ico("timer", 20)} ${toAr(25)} دقيقة لكل قسم بمؤقّت مستقل</div>
        <div class="mh-rule">${ico("target", 20)} تنقّل وعلّم الأسئلة داخل القسم — ولا رجوع بعد إنهائه</div>
        <div class="mh-rule"><span class="mh-x">✕</span> بدون حاسبة وبدون مساعدات — مثل المحوسب تماماً</div>
      </div>
      <button class="btn" onclick="A.startMock()">ابدأ المحاكاة</button>
    </div>
    ${mocks.length ? `<div class="tiles">
      <div class="tile">${ico("star-gold", 26)}<div><div class="t-v">${toAr(best)}٪</div><div class="t-l">أفضل نتيجة</div></div></div>
      <div class="tile">${ico("target", 26)}<div><div class="t-v">~${toAr(estOf(last))}</div><div class="t-l">آخر تقدير (من ١٠٠)</div></div></div>
    </div>` : `<div class="card mock-first-note">أول محاكاة لك ستحدد خط البداية — لا تقلق من النتيجة، المهم أن تعرف أين أنت الآن 💪</div>`}
  </div></div>` + bottomnav("mock");
}

A.startMock = function () {
  const plan = MOCK_SECTION_PLAN[S.track === "lit" ? "lit" : "sci"];
  const pools = {};
  DOMAIN_ORDER.forEach(k => {
    const d = (window.QBANK || {})[k];
    let pool = [];
    if (d) d.lessons.forEach(l => pool.push(...trackFilter(l.questions)));
    pools[k] = shuffle(pool);
  });
  const sections = [];
  for (let s = 0; s < MOCK_SECTIONS; s++) {
    const items = [];
    DOMAIN_ORDER.forEach((k, i) => {
      pools[k].slice(s * plan[i], (s + 1) * plan[i]).forEach(q => items.push({ q, dom: k }));
    });
    sections.push({
      items: shuffle(items),
      answers: new Array(items.length).fill(null),
      flags: new Array(items.length).fill(false),
      left: MOCK_SECS
    });
  }
  if (!sections[0].items.length) { showModal("⭐", "لا توجد أسئلة", "بنك الأسئلة غير متاح.", "حسناً"); return; }
  MOCK = { sections, si: 0, qi: 0, timer: null };
  startMockSection();
};

/* each section runs on its own 25-minute clock, like the computerized exam */
function startMockSection() {
  MOCK.qi = 0;
  renderMockQ();
  clearInterval(MOCK.timer);
  MOCK.timer = setInterval(() => {
    const sec = MOCK.sections[MOCK.si];
    sec.left--;
    const n = document.getElementById("mkNum"), f = document.getElementById("mkFill"), w = document.getElementById("mkWrap");
    if (n) n.textContent = fmtTime(sec.left);
    if (f) f.style.width = (sec.left / MOCK_SECS * 100) + "%";
    if (w) { w.classList.toggle("low", sec.left <= 120 && sec.left > 30); w.classList.toggle("crit", sec.left <= 30); }
    if (sec.left <= 0) { toast("⏰ انتهى وقت القسم"); endMockSection(true); }
  }, 1000);
}

/* numbered navigator: answered / flagged / current — jump anywhere inside the section */
function qnavStrip(sec) {
  return `<div class="qnav">` + sec.items.map((_, i) =>
    `<button class="qn-chip ${i === MOCK.qi ? "cur" : ""} ${sec.answers[i] !== null ? "done" : ""} ${sec.flags[i] ? "flagged" : ""}" onclick="A.mockGo(${i})">${toAr(i + 1)}</button>`
  ).join("") + `</div>`;
}

function renderMockQ() {
  const sec = MOCK.sections[MOCK.si];
  const { q } = sec.items[MOCK.qi];
  $app.innerHTML = `
    <div class="screen screen-full">
      <div class="session-top">
        <button class="x-btn" onclick="A.quitMock()">${X_SVG}</button>
        <div class="qtimer mock-timer" id="mkWrap">
          <span class="qt-ico">${CLOCK_SVG}</span>
          <div class="qt-track"><i class="qt-fill" id="mkFill" style="width:${sec.left / MOCK_SECS * 100}%"></i></div>
          <b class="qt-num" id="mkNum">${fmtTime(sec.left)}</b>
        </div>
        <span class="mock-count">القسم ${toAr(MOCK.si + 1)}/${toAr(MOCK.sections.length)}</span>
      </div>
      ${qnavStrip(sec)}
      <div class="q-area">${questionBody(q, sec.answers[MOCK.qi], false, "A.mockSelect")}</div>
      <div class="action-bar mock-bar">
        <button class="mk-flag ${sec.flags[MOCK.qi] ? "on" : ""}" onclick="A.mockFlag()" aria-label="علّم السؤال للمراجعة">⚑</button>
        <button class="btn btn-ghost mk-side" onclick="A.mockGo(${MOCK.qi - 1})" ${MOCK.qi === 0 ? "disabled" : ""}>السابق</button>
        ${MOCK.qi === sec.items.length - 1
          ? `<button class="btn" onclick="A.mockEndSection()">إنهاء القسم</button>`
          : `<button class="btn" onclick="A.mockGo(${MOCK.qi + 1})">التالي</button>`}
      </div>
    </div>`;
}

A.mockSelect = function (i) {
  if (!MOCK) return;
  const sec = MOCK.sections[MOCK.si];
  if (sec.answers[MOCK.qi] === null) dailyTick(); // each question counts once for the daily quest
  sec.answers[MOCK.qi] = i;
  document.querySelectorAll(".choice").forEach((b, j) => b.classList.toggle("sel", j === i));
  const chip = document.querySelectorAll(".qn-chip")[MOCK.qi];
  if (chip) chip.classList.add("done");
  save();
};

A.mockGo = function (i) {
  if (!MOCK) return;
  const sec = MOCK.sections[MOCK.si];
  if (i < 0 || i >= sec.items.length) return;
  MOCK.qi = i;
  renderMockQ();
};

A.mockFlag = function () {
  const sec = MOCK.sections[MOCK.si];
  sec.flags[MOCK.qi] = !sec.flags[MOCK.qi];
  renderMockQ();
};

A.mockEndSection = function () {
  const sec = MOCK.sections[MOCK.si];
  const un = sec.answers.filter(a => a === null).length;
  if (un && !confirm(`لديك ${toAr(un)} أسئلة بلا إجابة — لا يمكن الرجوع للقسم بعد إنهائه. متابعة؟`)) return;
  endMockSection(false);
};

/* seal the section into qstats — no going back, like the real exam */
function endMockSection(timedOut) {
  clearInterval(MOCK.timer);
  const sec = MOCK.sections[MOCK.si];
  sec.items.forEach((it, i) => {
    const qs = S.qstats[it.q.id] = S.qstats[it.q.id] || { r: 0, w: 0 };
    sec.answers[i] === it.q.answer ? qs.r++ : qs.w++;
  });
  save();
  if (MOCK.si < MOCK.sections.length - 1) {
    MOCK.si++;
    $app.innerHTML = `<div class="screen screen-full exam-setup">
      <div class="es-hero"><img class="ic" src="assets/icons/nav-exam-192.png" width="96" height="96" alt=""></div>
      <h1 class="login-title">انتهى القسم ${toAr(MOCK.si)}</h1>
      <p class="login-sub">خذ نفساً عميقاً — القسم ${toAr(MOCK.si + 1)} مدته ${toAr(25)} دقيقة ويبدأ عندما تضغط</p>
      <div class="login-form"><button class="btn" onclick="A.mockNextSection()">ابدأ القسم ${toAr(MOCK.si + 1)}</button></div>
    </div>`;
    window.scrollTo(0, 0);
  } else {
    finishMock(timedOut);
  }
}
A.mockNextSection = function () { startMockSection(); };

A.quitMock = function () {
  if (confirm("هل تريد إنهاء المحاكاة؟ لن تُحسب نتيجتها.")) {
    clearInterval(MOCK.timer); MOCK = null; go("mock");
  }
};

function finishMock(timedOut) {
  clearInterval(MOCK.timer);
  let total = 0, score = 0, unanswered = 0, secsUsed = 0;
  const perDom = {};
  DOMAIN_ORDER.forEach(k => perDom[k] = { r: 0, n: 0 });
  MOCK.sections.forEach(sec => {
    secsUsed += MOCK_SECS - Math.max(0, sec.left);
    sec.items.forEach((it, i) => {
      total++; perDom[it.dom].n++;
      const a = sec.answers[i];
      if (a === it.q.answer) { score++; perDom[it.dom].r++; }
      else if (a === null) unanswered++;
    });
  });
  const est = Math.round(35 + 65 * score / total);
  /* researched national bands: 81+ = top 5%, 85 ≈ top 2.5%, 90 = elite, 65 = mean */
  const band = est >= 90 ? "ضمن النخبة — أعلى ٠.٥٪ من الطلاب 🏆"
    : est >= 85 ? "ضمن أفضل ٢.٥٪ من الطلاب 🔥"
      : est >= 81 ? "ضمن أفضل ٥٪ من الطلاب 🔥"
        : est >= 75 ? "أعلى من ٨٤٪ من الطلاب 👏"
          : est >= 70 ? "فوق المتوسط 👍"
            : est >= 65 ? "حول متوسط الطلاب"
              : "تحت المتوسط حالياً — التمرين اليومي يرفعك بسرعة";
  const mins = Math.round(secsUsed / 60);
  S.mocks = (S.mocks || []).concat([{ d: todayKey(), score, total, est }]).slice(-10);
  bumpStreak(); save();
  score / total >= 0.5 ? sndWin() : sndLose();

  const domRows = DOMAIN_ORDER.map((k, i) => {
    const d = window.QBANK[k]; if (!d || !perDom[k].n) return "";
    const u = UNIT_COLORS[d.color] || UNIT_COLORS.green;
    const p = Math.round(perDom[k].r / perDom[k].n * 100);
    return `<div class="dom-stat"><div class="ds-head"><span>${d.title}</span><span>${toAr(perDom[k].r)}/${toAr(perDom[k].n)}</span></div>
      <div class="duo-bar"><i style="width:${p}%;--bar-c:${u.c};--bar-shine:${u.h};animation-delay:${(0.9 + i * 0.13).toFixed(2)}s"></i></div></div>`;
  }).join("");

  /* numbered answer grid: green = right, red = wrong; tap a number for the full review */
  MOCK_REVIEW = [];
  MOCK.sections.forEach(sec => sec.items.forEach((it, i) => MOCK_REVIEW.push({ q: it.q, picked: sec.answers[i] })));
  const gridCells = MOCK_REVIEW.map((r, i) =>
    `<button class="mg-cell ${r.picked === r.q.answer ? "ok" : "bad"}" style="--d:${(0.6 + i * 0.035).toFixed(2)}s" onclick="A.mockDetail(${i})">${toAr(i + 1)}</button>`
  ).join("");
  const answersCard = `<div class="card" style="text-align:right;width:100%"><h3>إجاباتك — اضغط أي رقم للمراجعة</h3>
    <div class="mock-grid">${gridCells}</div>
    <div id="mockDetail"></div>
  </div>`;

  MOCK = null;
  $app.innerHTML = `<div class="screen"><div class="complete win-scene mock-result" style="min-height:auto;padding-top:26px">
    ${flameHero(160)}
    <h1 class="win-title">${timedOut ? "انتهى الوقت!" : "انتهت المحاكاة!"}</h1>
    <p class="win-sub">${unanswered ? `${toAr(unanswered)} أسئلة بلا إجابة — ` : ""}السرعة والدقة معاً هما سر قدرات</p>
    <div class="result-cards">
      <div class="rcard rc-gold"><div class="rc-t">نتيجتك</div><div class="rc-v">${ico("star-gold", 20)} <span id="mv-score">٠</span>/${toAr(total)}</div></div>
      <div class="rcard rc-blue"><div class="rc-t">تقديرك التقريبي</div><div class="rc-v">${ico("target", 20)} ~<span id="mv-est">٠</span></div></div>
      <div class="rcard rc-green"><div class="rc-t">الوقت</div><div class="rc-v">${TIMER_SVG} ${toAr(mins)} د</div></div>
    </div>
    <div class="mock-band">${band}</div>
    <div class="mock-note">تقدير تقريبي لأغراض التدريب — النتيجة الرسمية تُحسب بمعادلة قياس المعيارية</div>
    <div class="card" style="text-align:right;width:100%"><h3>أداؤك حسب القسم</h3>${domRows}</div>
    ${answersCard}
    <div class="fail-actions" style="width:100%">
      <button class="btn" onclick="A.startMock()">محاكاة جديدة</button>
      <button class="btn btn-ghost" onclick="A.go('mock')">رجوع</button>
    </div>
  </div></div>`;
  window.scrollTo(0, 0);
  setTimeout(() => {
    const s = document.getElementById("mv-score"), e = document.getElementById("mv-est");
    if (s) countUp(s, score); if (e) countUp(e, est);
  }, 600);
}
A.toggleEl = function (id) { const el = document.getElementById(id); el.style.display = el.style.display === "none" ? "block" : "none"; };

/* tap a grid number → expand that question's review under the grid */
A.mockDetail = function (i) {
  const r = MOCK_REVIEW[i];
  const box = document.getElementById("mockDetail");
  if (!r || !box) return;
  const cells = document.querySelectorAll(".mg-cell");
  const wasOpen = cells[i] && cells[i].classList.contains("sel");
  cells.forEach(c => c.classList.remove("sel"));
  if (wasOpen) { box.innerHTML = ""; return; }
  cells[i].classList.add("sel");
  const isCmp = r.q.format === "comparison";
  const ch = isCmp ? CMP_CHOICES : r.q.choices;
  const ok = r.picked === r.q.answer;
  box.innerHTML = `<div class="review-item mock-detail">
    <div class="ri-q">${toAr(i + 1)}. ${r.q.stem || "قارن بين القيمتين"}</div>
    ${isCmp && r.q.value1 ? `<div class="ri-row" style="color:var(--gray)">القيمة الأولى: ${r.q.value1} — القيمة الثانية: ${r.q.value2}</div>` : ""}
    ${ok ? `<div class="ri-row" style="color:var(--green-dk)">✓ إجابتك صحيحة: ${ch[r.picked]}</div>`
      : `<div class="ri-row" style="color:var(--red)">✕ إجابتك: ${r.picked === null ? "لم تُجب" : ch[r.picked]}</div>
         <div class="ri-row" style="color:var(--green-dk)">✓ الصحيحة: ${ch[r.q.answer]}</div>`}
    <button class="fb-solution-toggle" onclick="A.toggleEl('mdSol')">اعرض الحل</button>
    <div class="fb-solution" id="mdSol" style="display:none">${esc(r.q.solution)}</div>
  </div>`;
};

/* ---------------- STATS ---------------- */
function renderStats() {
  const flat = allLessons();
  const doneN = flat.filter(x => lessonProg(x.key).stars > 0).length;
  let r = 0, w = 0;
  Object.values(S.qstats).forEach(s => { r += s.r; w += s.w; });
  const acc = (r + w) ? Math.round(r / (r + w) * 100) : 0;
  const domBars = domains().map((d, i) => {
    let dr = 0, dw = 0;
    d.lessons.forEach(l => l.questions.forEach(q => { const s = S.qstats[q.id]; if (s) { dr += s.r; dw += s.w; } }));
    const p = (dr + dw) ? Math.round(dr / (dr + dw) * 100) : 0;
    const u = UNIT_COLORS[d.color] || UNIT_COLORS.green;
    return `<div class="dom-stat"><div class="ds-head"><span>${d.title}</span><span>${(dr + dw) ? toAr(p) + "٪" : "—"}</span></div>
      <div class="duo-bar"><i style="width:${p}%;--bar-c:${u.c};--bar-shine:${u.h};animation-delay:${(0.25 + i * 0.13).toFixed(2)}s"></i></div></div>`;
  }).join("");
  $app.innerHTML = statbar() + `<div class="screen"><div class="page">
    <h1>إحصائياتي</h1><div class="sub">تابع تقدمك نحو درجة أعلى</div>
    <div class="tiles">
      <div class="tile">${ico("streak", 26)}<div><div class="t-v">${toAr(S.streak.count)}</div><div class="t-l">أيام متتالية</div></div></div>
      <div class="tile">${ico("gem", 26)}<div><div class="t-v">${toAr(S.xp)}</div><div class="t-l">نقاط الخبرة</div></div></div>
      <div class="tile">${ico("nav-chest", 26)}<div><div class="t-v">${toAr(doneN)}/${toAr(flat.length)}</div><div class="t-l">دروس مكتملة</div></div></div>
      <div class="tile">${ico("target", 26)}<div><div class="t-v">${(r + w) ? toAr(acc) + "٪" : "—"}</div><div class="t-l">الدقة الكلية</div></div></div>
    </div>
    <div class="card"><h3>الدقة حسب المجال</h3>${domBars}</div>
  </div></div>` + bottomnav("stats");
}

/* ---------------- SETTINGS / ABOUT ---------------- */
function renderSettings() {
  const uname = (S.user && S.user.name) || "ضيف";
  $app.innerHTML = statbar() + `<div class="screen"><div class="page">
    <h1>الإعدادات</h1><div class="sub">خصّص تجربة التدريب</div>
    <div class="card">
      <div class="row">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="avatar">${esc(uname.trim().charAt(0) || "؟")}</span>
          <div><div class="r-label">${esc(uname)}</div><div class="r-sub">${S.user && S.user.guest ? "وضع الضيف" : "طالب قدرات"}</div></div>
        </div>
        <button class="btn btn-ghost" style="width:auto;padding:8px 18px 6px" onclick="A.logout()">تبديل</button>
      </div>
    </div>
    <div class="card"><h3>المسار</h3>
      <div class="seg">
        <button class="${S.track === "sci" ? "on" : ""}" onclick="A.setTrack('sci')">علمي 🔬</button>
        <button class="${S.track === "lit" ? "on" : ""}" onclick="A.setTrack('lit')">أدبي / نظري 📖</button>
      </div>
      <div class="r-sub" style="margin-top:8px">المسار الأدبي يركز على الحساب ويخفف الجبر والهندسة المتقدمة.</div>
    </div>
    <div class="card">
      <div class="row"><div><div class="r-label">موعد الاختبار</div><div class="r-sub">${S.exam ? fmtExamDate(S.exam) : "غير محدد — حدده لمتابعة جاهزيتك"}</div></div>
        <button class="btn btn-ghost" style="width:auto;padding:8px 18px 6px" onclick="A.examSetup()">${S.exam ? "تغيير" : "تحديد"}</button></div>
    </div>
    <div class="card">
      <div class="row"><div><div class="r-label">الأصوات</div><div class="r-sub">مؤثرات صوتية عند الإجابة</div></div>
        <button class="toggle ${S.sound ? "on" : ""}" onclick="A.toggleSound()"></button></div>
    </div>
    <div class="card">
      <div class="row"><div class="r-label">حول التطبيق</div><button class="btn btn-ghost" style="width:auto;padding:8px 18px 6px" onclick="A.showAbout()">عرض</button></div>
      <div class="row"><div class="r-label">منصة قياس الرسمية</div><a class="btn btn-blue" style="width:auto;padding:8px 18px 6px;text-decoration:none;text-align:center" href="https://etec.gov.sa" target="_blank" rel="noopener">زيارة ↗</a></div>
    </div>
    <div class="card">
      <div class="row"><div><div class="r-label">إعادة تعيين التقدم</div><div class="r-sub">حذف كل النقاط والإنجازات</div></div>
        <button class="btn btn-red" style="width:auto;padding:8px 18px 6px" onclick="A.resetAll()">حذف</button></div>
    </div>
  </div></div>` + bottomnav("settings");
}
A.setTrack = function (t) { S.track = t; save(); render(); };
A.toggleSound = function () { S.sound = !S.sound; save(); render(); };
A.resetAll = function () {
  if (confirm("هل أنت متأكد؟ سيُحذف كل تقدمك نهائياً.")) { localStorage.removeItem("qudratState"); location.reload(); }
};

const DISCLAIMER_HTML = `تطبيق «قدراتي» أداة تدريب <b>مستقلة</b> وغير تابعة لهيئة تقويم التعليم والتدريب (قياس) وغير معتمدة منها.<br><br>
جميع الأسئلة في التطبيق أسئلة تدريبية <b>أصلية</b> أُلِّفت بأسلوب الاختبار الرسمي ومستوياته، ولا تمثل أسئلة الاختبار الفعلية.<br><br>
للتسجيل في الاختبار الرسمي والاطلاع على النماذج الرسمية، تفضل بزيارة موقع الهيئة.`;

/* document/clipboard icon for the disclaimer modal (provided artwork) */
const DISCLAIMER_ICON = `<svg class="disc-icon" width="66" height="66" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_9001_129)">
<path d="M23.1994 32.4619H16.8005C16.2799 32.4619 15.8579 32.8839 15.8579 33.4045V35.3427C15.8579 35.8633 16.2799 36.2853 16.8005 36.2853H23.1994C23.7199 36.2853 24.1419 35.8633 24.1419 35.3427V33.4045C24.1419 32.8839 23.7199 32.4619 23.1994 32.4619Z" fill="#9069CD"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M1.88509 3.78711H38.1149C39.156 3.78711 40 4.63109 40 5.6722V33.4449C40 34.486 39.156 35.33 38.1149 35.33H1.88509C0.843984 35.33 0 34.486 0 33.4449V5.6722C0 4.63109 0.843984 3.78711 1.88509 3.78711Z" fill="#9069CD"/>
<path d="M22.4895 30.3115H17.5107C16.9901 30.3115 16.5681 30.7335 16.5681 31.2541V32.4755C16.5681 32.996 16.9901 33.418 17.5107 33.418H22.4895C23.01 33.418 23.432 32.996 23.432 32.4755V31.2541C23.432 30.7335 23.01 30.3115 22.4895 30.3115Z" fill="#D2E4E8"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M2.60352 26.0107H37.6331V31.2812C37.6331 31.8017 37.2111 32.2237 36.6906 32.2237H20.1188H14.6741H3.54606C3.02551 32.2237 2.60352 31.8017 2.60352 31.2812V26.0107Z" fill="#D2E4E8"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M37.6331 28.8776H23.4172C21.5953 28.8776 20.1183 30.3545 20.1183 32.1765C20.1183 30.3545 18.6413 28.8776 16.8194 28.8776H2.60352V5.92399C2.60352 5.40343 3.02551 4.98145 3.54606 4.98145H16.8194C18.6413 4.98145 20.1183 6.45841 20.1183 8.28034C20.1183 6.45841 21.5953 4.98145 23.4172 4.98145H36.6906C37.2111 4.98145 37.6331 5.40343 37.6331 5.92399V28.8776Z" fill="white"/>
<path d="M17.0446 7.37134H5.20398C4.81356 7.37134 4.49707 7.68783 4.49707 8.07825V8.81508C4.49707 9.20549 4.81356 9.52199 5.20398 9.52199H17.0446C17.435 9.52199 17.7515 9.20549 17.7515 8.81508V8.07825C17.7515 7.68783 17.435 7.37134 17.0446 7.37134Z" fill="#D2E4E8"/>
<path d="M17.0446 17.1689H5.20398C4.81356 17.1689 4.49707 17.4854 4.49707 17.8759V18.6127C4.49707 19.0031 4.81356 19.3196 5.20398 19.3196H17.0446C17.435 19.3196 17.7515 19.0031 17.7515 18.6127V17.8759C17.7515 17.4854 17.435 17.1689 17.0446 17.1689Z" fill="#D2E4E8"/>
<path d="M14.441 12.3894H5.20398C4.81356 12.3894 4.49707 12.7059 4.49707 13.0963V13.8331C4.49707 14.2236 4.81356 14.5401 5.20398 14.5401H14.441C14.8315 14.5401 15.148 14.2236 15.148 13.8331V13.0963C15.148 12.7059 14.8315 12.3894 14.441 12.3894Z" fill="#D2E4E8"/>
<path d="M14.441 21.9482H5.20398C4.81356 21.9482 4.49707 22.2647 4.49707 22.6552V23.392C4.49707 23.7824 4.81356 24.0989 5.20398 24.0989H14.441C14.8315 24.0989 15.148 23.7824 15.148 23.392V22.6552C15.148 22.2647 14.8315 21.9482 14.441 21.9482Z" fill="#D2E4E8"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.28088 2.83105H13.731C14.1214 2.83105 14.4379 3.14755 14.4379 3.53796V20.7491C14.4379 21.1395 14.1214 21.456 13.731 21.456C13.6018 21.456 13.4752 21.4206 13.3647 21.3537L11.2672 20.0832C11.0353 19.9428 10.7436 19.9473 10.5162 20.0948L8.66566 21.2955C8.33814 21.508 7.90036 21.4147 7.68786 21.0872C7.61353 20.9727 7.57397 20.839 7.57397 20.7025V3.53796C7.57397 3.14755 7.89047 2.83105 8.28088 2.83105Z" fill="#FF4B4B"/>
<path d="M35.2695 7.37134H23.4288C23.0384 7.37134 22.7219 7.68783 22.7219 8.07825V8.81508C22.7219 9.20549 23.0384 9.52199 23.4288 9.52199H35.2695C35.6599 9.52199 35.9764 9.20549 35.9764 8.81508V8.07825C35.9764 7.68783 35.6599 7.37134 35.2695 7.37134Z" fill="#D2E4E8"/>
<path d="M35.2695 17.1689H23.4288C23.0384 17.1689 22.7219 17.4854 22.7219 17.8759V18.6127C22.7219 19.0031 23.0384 19.3196 23.4288 19.3196H35.2695C35.6599 19.3196 35.9764 19.0031 35.9764 18.6127V17.8759C35.9764 17.4854 35.6599 17.1689 35.2695 17.1689Z" fill="#D2E4E8"/>
<path d="M32.6659 12.3894H23.4288C23.0384 12.3894 22.7219 12.7059 22.7219 13.0963V13.8331C22.7219 14.2236 23.0384 14.5401 23.4288 14.5401H32.6659C33.0563 14.5401 33.3728 14.2236 33.3728 13.8331V13.0963C33.3728 12.7059 33.0563 12.3894 32.6659 12.3894Z" fill="#D2E4E8"/>
<path d="M32.6659 21.9482H23.4288C23.0384 21.9482 22.7219 22.2647 22.7219 22.6552V23.392C22.7219 23.7824 23.0384 24.0989 23.4288 24.0989H32.6659C33.0563 24.0989 33.3728 23.7824 33.3728 23.392V22.6552C33.3728 22.2647 33.0563 21.9482 32.6659 21.9482Z" fill="#D2E4E8"/>
</g>
<defs><clipPath id="clip0_9001_129"><rect width="40" height="40" fill="white"/></clipPath></defs>
</svg>`;

function showModal(emoji, title, bodyHtml, btnText, onclose) {
  const veil = document.createElement("div");
  veil.className = "modal-veil";
  veil.innerHTML = `<div class="modal"><div class="m-owl">${emoji}</div><h2>${title}</h2><p>${bodyHtml}</p>
    <button class="btn" id="mOk">${btnText}</button></div>`;
  document.body.appendChild(veil);
  veil.querySelector("#mOk").onclick = () => { veil.remove(); if (onclose) onclose(); };
}
A.showAbout = function () {
  showModal("⭐", "حول تطبيق قدراتي", DISCLAIMER_HTML + `<br><a class="linkout" href="https://etec.gov.sa" target="_blank" rel="noopener">↗ الموقع الرسمي لهيئة تقويم التعليم والتدريب</a>`, "حسناً");
};

/* Start-screen hero: XP-coins trio (recreated from the Duolingo UI-kit
   frame: blue & green coins behind a big gold lightning coin, floating
   diamond sparks) using the design system's exact palette */
function coinsHero() {
  const coinBody = (face, dark) => `
    <circle cx="50" cy="55.5" r="42" fill="${dark}"/>
    <circle cx="50" cy="50" r="42" fill="${face}"/>`;
  const shine = `<path d="M20.3 79.7 A42 42 0 0 1 79.7 20.3 Z" fill="#FFFFFF" opacity=".16"/>`;
  const bolt = "M54 22 L35 52 L47.5 55 L43 78 L65 47 L52.5 44 Z";
  const diamonds = [
    ["cd1", "#FFD333", 13, "10%", "4%"], ["cd2", "#84D8FF", 10, "26%", "86%"],
    ["cd3", "#A5ED6E", 11, "78%", "78%"], ["cd4", "#FFB020", 8, "86%", "16%"]
  ].map(([c, col, s, top, lft]) =>
    `<i class="co-diamond ${c}" style="background:${col};width:${s}px;height:${s}px;top:${top};left:${lft}"></i>`).join("");
  return `<div class="coins-hero">
    <span class="co-glow"></span>
    ${diamonds}
    <svg class="coin coin-blue" viewBox="0 0 100 106">${coinBody("#1CB0F6", "#1899D6")}${shine}</svg>
    <svg class="coin coin-green" viewBox="0 0 100 106">${coinBody("#58CC02", "#58A700")}${shine}</svg>
    <svg class="coin coin-gold" viewBox="0 0 100 106">
      ${coinBody("#FFC800", "#E6A000")}
      <circle cx="50" cy="50" r="33.5" fill="#FFD333"/>
      ${shine}
      <g transform="rotate(-12 50 50)"><g class="co-bolt">
        <path d="${bolt}" fill="#E07D00" stroke="#E07D00" stroke-width="8" stroke-linejoin="round" transform="translate(0 3.5)"/>
        <path d="${bolt}" fill="#FF9600" stroke="#FF9600" stroke-width="8" stroke-linejoin="round"/>
      </g></g>
      <rect class="co-spark" x="71" y="13" width="11" height="11" rx="3.5" fill="#FFFFFF" transform="rotate(45 76.5 18.5)"/>
    </svg>
  </div>`;
}

/* Start-screen welcome graphic (Duolingo-style badge trio from WelcomeSVG) */
function welcomeHero() {
  return `<div class="welcome-hero">
<svg class="welcome-svg" width="198" height="124" viewBox="0 0 198 124" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_8_2800)">
<path d="M159 111.624C179.987 111.624 197 94.6108 197 73.624C197 52.6371 179.987 35.624 159 35.624C138.013 35.624 121 52.6371 121 73.624C121 94.6108 138.013 111.624 159 111.624Z" fill="#1CB0F6"/>
</g>
<path d="M159.002 107.572C177.751 107.572 192.95 92.3732 192.95 73.6244C192.95 54.8756 177.751 39.6767 159.002 39.6767C140.254 39.6767 125.055 54.8756 125.055 73.6244C125.055 92.3732 140.254 107.572 159.002 107.572Z" stroke="#46C4FF" stroke-width="8.10468"/>
<path opacity="0.2" d="M197.003 73.624C197.003 52.6372 179.99 35.624 159.003 35.624C148.51 35.624 139.01 39.8773 132.133 46.7539L185.873 100.494C189.583 97.2175 197.003 87.2564 197.003 73.624Z" fill="white"/>
<g filter="url(#filter1_d_8_2800)">
<path d="M158.924 112.574C180.173 112.574 197.399 95.3481 197.399 74.099C197.399 52.8498 180.173 35.624 158.924 35.624C137.675 35.624 120.449 52.8498 120.449 74.099C120.449 95.3481 137.675 112.574 158.924 112.574Z" fill="#78C900"/>
</g>
<g filter="url(#filter2_d_8_2800)">
<path d="M158.924 112.574C180.173 112.574 197.399 95.3481 197.399 74.099C197.399 52.8498 180.173 35.624 158.924 35.624C137.675 35.624 120.449 52.8498 120.449 74.099C120.449 95.3481 137.675 112.574 158.924 112.574Z" fill="#78C900"/>
</g>
<path d="M158.926 108.642C178.003 108.642 193.469 93.1762 193.469 74.0986C193.469 55.021 178.003 39.5556 158.926 39.5556C139.848 39.5556 124.383 55.021 124.383 74.0986C124.383 93.1762 139.848 108.642 158.926 108.642Z" stroke="#87E003" stroke-width="7.86408"/>
<path opacity="0.15" d="M197.402 74.099C197.402 52.8498 180.176 35.624 158.927 35.624C148.303 35.624 138.684 39.9305 131.721 46.8931L186.133 101.305C189.889 97.9875 197.402 87.9018 197.402 74.099Z" fill="white"/>
<g filter="url(#filter3_d_8_2800)">
<path d="M38 111.624C58.9868 111.624 76 94.6108 76 73.624C76 52.6371 58.9868 35.624 38 35.624C17.0132 35.624 0 52.6371 0 73.624C0 94.6108 17.0132 111.624 38 111.624Z" fill="#1CB0F6"/>
</g>
<path d="M38.0043 107.572C56.7531 107.572 71.952 92.3732 71.952 73.6244C71.952 54.8756 56.7531 39.6767 38.0043 39.6767C19.2555 39.6767 4.05664 54.8756 4.05664 73.6244C4.05664 92.3732 19.2555 107.572 38.0043 107.572Z" stroke="#46C4FF" stroke-width="8.10468"/>
<path opacity="0.2" d="M76.0028 73.624C76.0028 52.6372 58.9897 35.624 38.0028 35.624C27.5094 35.624 18.0094 39.8773 11.1328 46.7539L64.8729 100.494C68.5829 97.2175 76.0028 87.2564 76.0028 73.624Z" fill="white"/>
<path opacity="0.3" d="M60.887 0.97329L56.5294 5.33086C55.2317 6.62859 55.2317 8.73262 56.5294 10.0303L60.887 14.3879C62.1847 15.6856 64.2887 15.6856 65.5865 14.3879L69.944 10.0303C71.2418 8.73261 71.2418 6.62859 69.944 5.33087L65.5865 0.973292C64.2887 -0.324432 62.1847 -0.324433 60.887 0.97329Z" fill="#FBE56D"/>
<path opacity="0.3" d="M43.0121 16.0572L40.565 18.5042C39.5917 19.4775 39.5917 21.0555 40.565 22.0288L43.0121 24.4759C43.9853 25.4492 45.5634 25.4492 46.5367 24.4759L48.9837 22.0288C49.957 21.0555 49.957 19.4775 48.9837 18.5042L46.5367 16.0572C45.5634 15.0839 43.9853 15.0839 43.0121 16.0572Z" fill="#84D8FF"/>
<mask id="mask0_8_2800" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="45" y="18" width="106" height="106">
<path d="M150.5 18.624H45.5V123.624H150.5V18.624Z" fill="white"/>
</mask>
<g mask="url(#mask0_8_2800)">
<g filter="url(#filter4_d_8_2800)">
<path d="M97.9994 118.624C125.613 118.624 147.999 96.2382 147.999 68.6243C147.999 41.0104 125.613 18.6249 97.9994 18.6249C70.3855 18.6249 48 41.0104 48 68.6243C48 96.2382 70.3855 118.624 97.9994 118.624Z" fill="#FFC800"/>
</g>
<path d="M98.0048 113.376C122.72 113.376 142.756 93.3401 142.756 68.6249C142.756 43.9096 122.72 23.874 98.0048 23.874C73.2896 23.874 53.2539 43.9096 53.2539 68.6249C53.2539 93.3401 73.2896 113.376 98.0048 113.376Z" stroke="#FEE333" stroke-width="10.497"/>
<path opacity="0.2" d="M148.002 68.6234C148.002 41.0095 125.617 18.624 98.0032 18.624C84.1962 18.624 71.6963 24.2204 62.6482 33.2685L133.358 103.978C138.239 99.667 148.002 86.5606 148.002 68.6234Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M103.759 43.8745C103.364 39.993 98.3799 38.6577 96.0973 41.8218L77.3104 67.864C75.5729 70.2725 76.7842 73.6749 79.6528 74.4436L90.3401 77.3072L91.9189 92.8314C92.3136 96.7129 97.2971 98.0482 99.5797 94.8841L118.366 68.8419C120.104 66.4334 118.893 63.031 116.025 62.2623L105.336 59.3987L103.759 43.8745Z" fill="#F89701"/>
<path d="M80.9972 71.3072C80.0253 71.0449 79.9315 69.7029 80.8574 69.3079L88.285 66.1387C88.9557 65.8525 89.7084 66.3128 89.7592 67.0402L90.128 72.314C90.1789 73.0413 89.4976 73.6019 88.7936 73.4119L80.9972 71.3072Z" fill="#E27800"/>
<path d="M115.038 64.8783C116.01 65.1406 116.104 66.4826 115.178 66.8776L107.75 70.0467C107.079 70.3329 106.327 69.8727 106.276 69.1453L105.907 63.8715C105.856 63.1442 106.538 62.5836 107.241 62.7737L115.038 64.8783Z" fill="#FFC700"/>
<path d="M124.321 36.1968L119.082 41.436C118.358 42.1594 118.358 43.3322 119.082 44.0556L124.321 49.2949C125.044 50.0183 126.217 50.0183 126.941 49.2949L132.18 44.0556C132.903 43.3322 132.903 42.1594 132.18 41.436L126.941 36.1968C126.217 35.4734 125.044 35.4734 124.321 36.1968Z" fill="#FFF8D2"/>
</g>
<defs>
<filter id="filter0_d_8_2800" x="121" y="35.624" width="76" height="80" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.121569 0 0 0 0 0.615686 0 0 0 0 0.827451 0 0 0 1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8_2800"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8_2800" result="shape"/>
</filter>
<filter id="filter1_d_8_2800" x="120.449" y="35.624" width="76.95" height="81" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4.05"/>
<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8_2800"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8_2800" result="shape"/>
</filter>
<filter id="filter2_d_8_2800" x="120.449" y="35.624" width="76.95" height="81.6685" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4.71845"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.458824 0 0 0 0 0.694118 0 0 0 0 0.121569 0 0 0 1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8_2800"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8_2800" result="shape"/>
</filter>
<filter id="filter3_d_8_2800" x="0" y="35.624" width="76" height="80" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.121569 0 0 0 0 0.615686 0 0 0 0 0.827451 0 0 0 1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8_2800"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8_2800" result="shape"/>
</filter>
<filter id="filter4_d_8_2800" x="48" y="18.6249" width="99.9988" height="105.262" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="5.26316"/>
<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.756863 0 0 0 0 0 0 0 0 1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8_2800"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8_2800" result="shape"/>
</filter>
</defs>
</svg>
  </div>`;
}

/* ---------------- exam date setup ---------------- */
const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

/* Duolingo-style calendar hero: orange header + rings, dot grid,
   one gold starred date with a soft pulsing halo (opacity-only —
   safe on every mobile browser) */
function examCalendarSVG() {
  const dots = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
    if (r === 1 && c === 2) continue; // the starred cell
    dots.push(`<circle cx="${30 + c * 15}" cy="${62 + r * 16}" r="4" fill="#E5E5E5"/>`);
  }
  return `<svg class="es-cal" viewBox="0 0 120 116" fill="none" aria-hidden="true">
    <rect x="6" y="18" width="108" height="94" rx="18" fill="#CD7900"/>
    <rect x="6" y="14" width="108" height="94" rx="18" fill="#FFFFFF"/>
    <path d="M6 32 Q6 14 24 14 H96 Q114 14 114 32 V46 H6 Z" fill="#FF9600"/>
    <rect x="28" y="4" width="11" height="20" rx="5.5" fill="#CD7900"/>
    <rect x="81" y="4" width="11" height="20" rx="5.5" fill="#CD7900"/>
    <circle cx="33.5" cy="10" r="2.6" fill="#FFB020"/>
    <circle cx="86.5" cy="10" r="2.6" fill="#FFB020"/>
    <rect x="26" y="26" width="26" height="8" rx="4" fill="#FFFFFF" opacity=".55"/>
    ${dots.join("")}
    <circle class="es-halo" cx="60" cy="78" r="15" fill="none" stroke="#FFC800" stroke-width="3"/>
    <circle cx="60" cy="78" r="11.5" fill="#FFC800"/>
    <path d="M60 71.2l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="#FFFFFF"/>
  </svg>`;
}

function renderExamSetup(first) {
  const base = S.exam ? new Date(S.exam + "T00:00:00") : new Date(Date.now() + 45 * 864e5);
  const yNow = new Date().getFullYear();
  const opt = (v, label, sel) => `<option value="${v}" ${sel ? "selected" : ""}>${label}</option>`;
  const days = Array.from({ length: 31 }, (_, i) => opt(i + 1, toAr(i + 1), base.getDate() === i + 1)).join("");
  const months = AR_MONTHS.map((m, i) => opt(i + 1, m, base.getMonth() === i)).join("");
  const years = [yNow, yNow + 1].map(y => opt(y, toAr(y), base.getFullYear() === y)).join("");
  $app.innerHTML = `<div class="screen screen-full exam-setup">
    <div class="es-hero">${examCalendarSVG()}</div>
    <h1 class="login-title">متى اختبارك؟</h1>
    <p class="login-sub">سنحسب لك العد التنازلي ونتابع جاهزيتك يوماً بيوم حتى موعد الاختبار</p>
    <div class="login-form">
      <div class="date-trio" id="examTrio">
        <label class="dt-box"><span class="dt-cap">اليوم</span><select id="exDay" class="dt-sel">${days}</select></label>
        <label class="dt-box dt-month"><span class="dt-cap">الشهر</span><select id="exMonth" class="dt-sel">${months}</select></label>
        <label class="dt-box"><span class="dt-cap">السنة</span><select id="exYear" class="dt-sel">${years}</select></label>
      </div>
      <button class="btn" onclick="A.saveExam()">حفظ الموعد</button>
      <button class="login-skip" onclick="A.skipExam()">${first ? "لم أحجز موعداً بعد — لاحقاً" : "رجوع"}</button>
    </div>
  </div>`;
}
A.examSetup = function () { renderExamSetup(false); };
A.saveExam = function () {
  const d = +document.getElementById("exDay").value,
    m = +document.getElementById("exMonth").value,
    y = +document.getElementById("exYear").value;
  const date = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const trio = document.getElementById("examTrio");
  // reject impossible dates (e.g. 31 February) and past dates
  if (date.getMonth() !== m - 1 || date < today) {
    trio.classList.remove("err"); void trio.offsetWidth; trio.classList.add("err");
    toast(date.getMonth() !== m - 1 ? "هذا التاريخ غير موجود في التقويم!" : "اختر تاريخاً قادماً 😅");
    return;
  }
  S.exam = y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  S.examAsked = true; save(); sndGood(); go("path");
};
A.skipExam = function () { S.examAsked = true; save(); go("path"); };

/* ---------------- login (local profile, no server) ---------------- */
function renderLogin() {
  $app.innerHTML = `<div class="screen screen-full login-screen">
    ${welcomeHero()}
    <h1 class="login-title">قدراتي</h1>
    <p class="login-sub">تدرّب على القسم الكمي بأسلوب ممتع — درساً بعد درس</p>
    <div class="login-form">
      <input id="loginName" class="login-input" type="text" maxlength="20" placeholder="ما اسمك؟"
        autocomplete="off" onkeydown="if(event.key==='Enter')A.login()">
      <button class="btn" onclick="A.login()">ابدأ التعلّم</button>
      <button class="login-skip" onclick="A.loginGuest()">المتابعة كضيف</button>
    </div>
  </div>`;
  setTimeout(() => { const i = document.getElementById("loginName"); if (i) i.focus(); }, 450);
}
A.login = function () {
  const inp = document.getElementById("loginName");
  const name = (inp.value || "").trim();
  if (!name) { inp.classList.remove("err"); void inp.offsetWidth; inp.classList.add("err"); inp.focus(); return; }
  S.user = { name: name.slice(0, 20), guest: false }; save(); sndGood();
  afterLogin();
};
A.loginGuest = function () { S.user = { name: "ضيف", guest: true }; save(); afterLogin(); };
A.logout = function () { S.user = null; save(); renderLogin(); };

function afterLogin() {
  if (!S.disclaimer) {
    $app.innerHTML = "";
    showModal(DISCLAIMER_ICON, "إخلاء مسؤولية", DISCLAIMER_HTML, "فهمت، لنبدأ!", () => { S.disclaimer = true; save(); S.examAsked || S.exam ? render() : renderExamSetup(true); });
  } else if (!S.examAsked && !S.exam) {
    renderExamSetup(true);
  } else {
    render();
  }
}

/* ---------------- boot ---------------- */
function boot() {
  if (!S.user) renderLogin();
  else afterLogin();
}
boot();
})();
