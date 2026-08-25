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
const LEVEL_HEARTS = 5;      /* Simulated over 200k sessions: at 70% first-try
                                accuracy, 3 hearts failed 53% of lessons and 5
                                fails 15%. A trainer whose whole premise is that
                                you do not know this material yet cannot fail
                                half its first sessions. */
const Q_SECS = 60;           // seconds per question — matches the real GAT pace
const REVIVE_COST = 50;      // gems to refill hearts and continue after failing a lesson
const BOOST_COST = 50;       // gems to double a lesson's rank XP (gems unaffected)
const CHEST_GEMS = 50;       // gems from the daily-quest chest
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

/* The authored key is badly lopsided — across the 475 MCQs, أ is correct
   40.4% of the time and د only 3.6%. Choices render in file order, so a
   student who plays enough learns "lean أ, never pick د", which is a habit
   that costs marks on the real exam where the key is balanced. Permuting per
   serve removes the tell. Comparison questions keep their fixed option set —
   that order is a convention of the format, not a key. */
function shuffleChoices(q) {
  if (!q || q.format !== "mcq" || !Array.isArray(q.choices)) return q;
  const order = shuffle(q.choices.map((_, i) => i));
  return Object.assign({}, q, {
    choices: order.map(i => q.choices[i]),
    answer: order.indexOf(q.answer),
  });
}
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

/* ---------------- state ---------------- */
const DEFAULT_STATE = { v: 1, disclaimer: false, user: null, track: "sci", sound: true, motion: "full", goal: 10, joined: null, days: {}, xp: 0, totalXp: 0, tierSeen: 0, streak: { count: 0, last: null }, lessons: {}, qstats: {}, exam: null, examAsked: false, daily: null, mocks: [], dailyQ: null, league: null, mistakes: {} };
const LEAGUE_NAMES = ["عبدالله", "محمد", "نورة", "سارة", "فهد", "ريم", "خالد", "لمى", "تركي", "جواهر", "عمر", "هند", "سلمان", "رنا", "بدر", "ليان", "ناصر", "شهد", "يزيد", "دانة", "مازن", "أصيل", "وليد", "غادة"];
/* Permanent rank tiers (badge art in assets/icons/ranks/). A user's tier is
   the highest threshold their LIFETIME total XP (S.totalXp) has crossed —
   it never drops, even when spending gems (S.xp) on hints. */
/* Rebased against what the content can actually yield. The old ceiling —
   playing all 30 lessons perfectly with the paid 2x boost on every one, plus
   56 daily questions — was 6,448, and Champion sat at 7,000. It could not be
   reached by finishing the product, only by grinding replays. An honest
   75%-first-try player who clears everything now lands in Champion in their
   final week, which is where that beat belongs. */
const LEAGUE_TIERS = [
  { key: "bronze", name: "البرونزي", min: 0 },
  { key: "silver", name: "الفضي", min: 300 },
  { key: "gold", name: "الذهبي", min: 900 },
  { key: "diamond", name: "الألماسي", min: 1800 },
  { key: "champion", name: "الأبطال", min: 3000 }
];
function tierIndexFor(xp) { let n = 0; for (let i = 0; i < LEAGUE_TIERS.length; i++) if (xp >= LEAGUE_TIERS[i].min) n = i; return n; }
function tierIndex() { return tierIndexFor(S.totalXp || 0); }
const rankImg = (key, size) => `<img class="rank-badge" src="assets/icons/ranks/rank-${key}.png" height="${size}" alt="">`;

/* Single funnel for earning XP: grows spendable gems (S.xp) AND the permanent
   lifetime total (S.totalXp). If the lifetime total crosses into a new tier,
   queue the rank-up celebration to play at the next safe moment. */
let pendingRankUp = null;
let pendingStreak = 0;   // streak count to celebrate after a win screen (0 = none)
/* Rank XP (S.totalXp) — lifetime, never decremented; drives tier + leaderboard.
   Separate from gems so spending never touches rank. */
function gainXP(n) {
  if (!n) return;
  const before = tierIndex();
  S.totalXp = (S.totalXp || 0) + n;
  const after = tierIndex();
  if (after > before) pendingRankUp = { from: before, to: after };
}
/* Gems (S.xp) — the spendable wallet (revive, 2× boost). Goes up and down. */
function gainGems(n) { if (n) S.xp += n; }
/* show the celebration if one is queued (and we're not mid-session) */
function flushRankUp() {
  /* derive from durable state: pendingRankUp dies with the page, and the
     celebration is one of only five an account ever gets */
  const cur = tierIndex();
  if (cur > (S.tierSeen || 0) && !document.querySelector(".rankup-veil")) pendingRankUp = { from: S.tierSeen || 0, to: cur };
  if (!pendingRankUp || document.querySelector(".rankup-veil")) return;
  const ru = pendingRankUp; pendingRankUp = null;
  S.tierSeen = ru.to; save();
  showRankUp(ru.to);
}
const DAILYQ_REWARD = 15;    // gems for the daily question (correct), 5 for a wrong attempt
let S;
try { S = Object.assign({}, DEFAULT_STATE, JSON.parse(localStorage.getItem("qudratState") || "{}")); }
catch (e) { S = Object.assign({}, DEFAULT_STATE); }
/* migrate pre-rank-system saves: seed lifetime XP from current gems, and mark
   the current tier as already-seen so we don't fire a celebration on load */
if (S.totalXp == null) S.totalXp = Math.max(0, S.xp || 0);
if (S.tierSeen == null) S.tierSeen = tierIndex();

/* A shallow Object.assign leaves a nested null as null, and one null here
   used to blank the whole app with no way back to Settings. Coerce the
   containers before anything reads them. */
(function repair() {
  const shape = { streak: { count: 0, last: null }, lessons: {}, qstats: {}, mistakes: {}, mocks: [], days: {} };
  for (const k in shape) {
    const want = shape[k], got = S[k];
    const ok = Array.isArray(want) ? Array.isArray(got) : (got && typeof got === "object");
    if (!ok) S[k] = Array.isArray(want) ? [] : Object.assign({}, want);
  }
  /* a streak whose last day is neither today nor yesterday is already broken;
     show 0 rather than a number that can never be extended */
  const t = todayKey(), d = new Date(Date.now() - 864e5);
  const y = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  if (S.streak.last !== t && S.streak.last !== y) S.streak.count = 0;
})();

/* --------------------------------------------------------------------------
   MOTION.
   This used to read prefers-reduced-motion inline, in JS and in two CSS
   media queries, and silently throw the animation away. Windows ships
   "Show animations in Windows" OFF far more often than phones do (and this
   machine has it off), so the jump, the bolts, the shine and the confetti
   were all dead on desktop while working fine on mobile - which is exactly
   trap 3 in INTEGRATION-BRIEF.md.

   The OS preference is now REPORTED, not silently obeyed. The app is a game;
   full motion is the default on every device, the choice is saved per user,
   and Settings says so when the system asks for less. Anyone who genuinely
   wants less motion has a switch that works on both platforms.
   -------------------------------------------------------------------------- */
function osPrefersReduce() {
  try { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  catch (e) { return false; }              // a throw here must never wedge the UI
}
function motionReduced() { return S.motion === "reduced"; }
function motionApply() {
  try { document.documentElement.setAttribute("data-motion", S.motion || "full"); } catch (e) {}
}
motionApply();

let storageWarned = false;
const save = () => {
  try { localStorage.setItem("qudratState", JSON.stringify(S)); }
  catch (e) {
    /* quota, private browsing, or blocked site data. Losing the write is
       survivable; throwing out of the caller is not - it used to strand the
       player mid-lesson with a dead متابعة button. */
    if (!storageWarned) { storageWarned = true; try { toast("تعذّر حفظ تقدمك على هذا المتصفح"); } catch (e2) {} }
  }
};

function bumpStreak() {
  const t = todayKey();
  if (S.streak.last === t) return false;   // already counted today
  const y = new Date(Date.now() - 864e5);
  const yk = y.getFullYear() + "-" + (y.getMonth() + 1) + "-" + y.getDate();
  S.streak.count = (S.streak.last === yk) ? S.streak.count + 1 : 1;
  S.streak.last = t;
  return true;                              // advanced to a new day → celebrate
}

/* ---------------- sounds (WebAudio synth) ---------------- */
let AC = null;
/* Browsers start an AudioContext suspended unless it is constructed during a
   user gesture, and this one is created lazily by whichever sound happens to
   fire first — which can be sndTick() from the countdown interval, i.e. no
   gesture at all. Nothing resumed it, so that one tick used to mute the rest
   of the session. Backgrounding the tab suspends it too. */
function audioCtx() {
  if (!AC) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    AC = new Ctor();
  }
  if (AC.state === "suspended" && AC.resume) { try { AC.resume(); } catch (e) {} }
  return AC;
}
/* and take the first real tap as permission, so the context is already
   running by the time anything wants to make a noise */
["pointerdown", "keydown"].forEach(evt =>
  document.addEventListener(evt, function unlock() {
    ["pointerdown", "keydown"].forEach(e2 => document.removeEventListener(e2, unlock));
    try { audioCtx(); } catch (e) {}
  }, { once: false, passive: true }));

function beep(seq) {
  if (!S.sound) return;
  try {
    AC = audioCtx();
    if (!AC) return;
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
const sndRankUp = () => beep([[523, .1], [659, .1], [784, .12], [1047, .12], [1319, .16], [1047, .1], [1568, .42]]); // rank-up fanfare

/* Correct-answer voice clip (real recorded chime). Preloaded once at boot
   and pooled (3 elements) so back-to-back correct answers can overlap
   without re-fetching — the 32KB file is fetched a single time and cached.
   Falls back to the synth chime if the file/codec is ever unavailable. */
const CORRECT_SRC = "assets/sounds/correct.mp3";
let correctPool = null, correctIdx = 0;
function initCorrectVoice() {
  if (correctPool) return;
  correctPool = [];
  try {
    for (let i = 0; i < 3; i++) {
      const a = new Audio(CORRECT_SRC);
      a.preload = "auto"; a.volume = 0.75;
      correctPool.push(a);
    }
  } catch (e) { /* Audio unavailable — playCorrect will fall back to beep */ }
}
function playCorrect() {
  if (!S.sound) return;
  if (!correctPool) initCorrectVoice();
  const a = correctPool[correctIdx];
  correctIdx = (correctIdx + 1) % (correctPool.length || 1);
  if (!a) { sndGood(); return; }            // no audio element → synth fallback
  try {
    a.currentTime = 0;
    const p = a.play();
    /* a blocked or failed play used to be swallowed silently; fall back to the
       synth so the correct answer still makes a sound */
    if (p && p.catch) p.catch(() => sndGood());
  } catch (e) { sndGood(); }
}

/* ---------------- data access ---------------- */
function domains() { return DOMAIN_ORDER.map(k => (window.QBANK || {})[k]).filter(Boolean); }
function allLessons() {
  const out = [];
  domains().forEach(d => d.lessons.forEach(l => out.push({ dom: d, les: l, key: d.key + "." + l.key })));
  return out;
}
function trackFilter(qs) { return S.track === "lit" ? qs.filter(q => q.track !== "sci") : qs; }
function lessonProg(key) { return S.lessons[key] || { stars: 0, plays: 0 }; }

/* ---------------- mistakes (مراجعة الأخطاء) ----------------
   Every wrong answer (lesson, timeout, mock, daily question) records the
   question id; answering it correctly anywhere clears it. The review
   screen lists what's left and can re-quiz only those. */
let QINDEX = null;
function questionById(id) {
  if (!QINDEX) {
    QINDEX = {};
    domains().forEach(d => d.lessons.forEach(l => l.questions.forEach(q => {
      QINDEX[q.id] = { q, domKey: d.key, lesKey: l.key, lesTitle: l.title, domTitle: d.title, color: d.color };
    })));
  }
  return QINDEX[id];
}
/* A mistake used to be cleared by one correct answer anywhere — including the
   retry that comes moments after the solution was on screen. It now needs two
   correct answers on two different days, which is the whole point of keeping
   a mistake list six weeks before an exam. */
function noteAnswer(q, correct) {
  S.mistakes = S.mistakes || {};
  const cur = S.mistakes[q.id];
  const rec = (cur && typeof cur === "object") ? cur : (cur ? { t: cur, ok: 0, day: null } : null);
  if (correct) {
    if (!rec) return;
    const today = todayKey();
    if (rec.day === today) return;                 // same-day retry does not count
    rec.ok = (rec.ok || 0) + 1; rec.day = today; rec.t = Date.now();
    if (rec.ok >= 2) delete S.mistakes[q.id];
    else S.mistakes[q.id] = rec;
    return;
  }
  S.mistakes[q.id] = { t: Date.now(), ok: 0, day: null };
}
/* mistakes that still exist in the bank and match the current track, newest first */
function mistakeList() {
  const m = S.mistakes || {};
  return Object.keys(m).map(id => {
    const v = m[id], t = (v && typeof v === "object") ? v.t : v;
    return { id, t, ok: (v && typeof v === "object" && v.ok) || 0, rec: questionById(id) };
  })
    .filter(x => x.rec && trackFilter([x.rec.q]).length)
    /* it used to be strictly newest-first and the drill took the top twelve,
       so the questions you kept missing pinned themselves to the head of the
       list and everything behind them was unreachable. Oldest-first surfaces
       what is actually going stale. */
    .sort((a, b) => a.t - b.t);
}

/* ---------------- exam countdown + readiness ---------------- */
function examDaysLeft() {
  if (!S.exam) return null;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(S.exam + "T00:00:00") - t) / 864e5);
}
/* 0–100: stars earned across all lessons (70%) + overall first-try accuracy (30%) */
/* It used to be 70% stars + 30% lifetime accuracy. Stars only come from a
   lesson's first session (eight of its twenty-four questions) and only ever
   ratchet up, so three stars on all thirty lessons plus a clean accuracy read
   100% having answered 240 of 720 questions and none of the hard third. It is
   capped by how much of the bank has actually been seen now, so the number
   cannot outrun the coverage behind it. */
function readiness() {
  const flat = allLessons();
  if (!flat.length) return 0;
  const bank = bankSize() || 1;
  const seen = Object.keys(S.qstats || {}).length;
  /* sqrt, not linear: a student who has aced 240 of 720 questions is
     genuinely more than a third ready, and a linear cap read 0% for
     someone who had just finished their first lesson. */
  const coverage = Math.sqrt(Math.min(1, seen / bank));
  let earned = 0;
  flat.forEach(x => earned += lessonProg(x.key).stars);
  const starPart = earned / (flat.length * 3);
  let r = 0, w = 0;
  Object.values(S.qstats).forEach(s => { r += s.r; w += s.w; });
  const acc = (r + w) ? r / (r + w) : 0;
  const skill = 0.45 * starPart + 0.55 * acc;
  return Math.round(100 * skill * coverage);
}
/* ---------------- daily quest (answer N questions → chest) ---------------- */
function dailyReset() {
  const t = todayKey();
  if (!S.daily || S.daily.day !== t) S.daily = { day: t, n: 0, claimed: false };
}
function dailyTick() {
  dailyReset();
  /* The week strip used to be inferred from streak.count, so a day practised
     on after the streak had already broken drew as empty: it showed what could
     be deduced, not what happened. Record the day itself. Trimmed to nine
     weeks; the strip only ever reads the last seven. */
  const t = todayKey();
  S.days = S.days || {};
  S.days[t] = (S.days[t] || 0) + 1;
  const keys = Object.keys(S.days);
  if (keys.length > 63) {
    keys.map(k => { const a = k.split("-"); return [k, new Date(+a[0], +a[1] - 1, +a[2]).getTime()]; })
        .sort((a, b) => a[1] - b[1]).slice(0, keys.length - 63)
        .forEach(pair => delete S.days[pair[0]]);
  }
  if (S.daily.n >= DAILY_GOAL) return;
  S.daily.n++;
  if (S.daily.n === DAILY_GOAL)
    setTimeout(() => toast(`🎁 اكتمل تمرين اليوم! صندوقك بانتظارك في الرئيسية`, "quest"), 1200);
}

/* Arabic counted nouns: 1 singular, 2 dual, 3-10 plural, 11+ singular accusative */
function arPlural(n, one, two, few, many) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n <= 10) return toAr(n) + " " + few;
  return toAr(n) + " " + many;
}
const qCount = n => arPlural(n, "سؤال واحد", "سؤالان", "أسئلة", "سؤالاً");
function dayPhrase(n) {
  if (n === 1) return "يوم واحد";
  if (n === 2) return "يومان";
  if (n <= 10) return toAr(n) + " أيام";
  return toAr(n) + " يوماً";
}
const fmtExamDate = d => { const x = new Date(d + "T00:00:00"); return toAr(x.getDate()) + " / " + toAr(x.getMonth() + 1) + " / " + toAr(x.getFullYear()); };

/* ---------------- سؤال اليوم (Question of the Day) ----------------
   One date-seeded mcq question everyone gets each day; changes daily;
   a reason to open the app + gives gems a purpose. */
function dailyQReset() {
  const t = todayKey();
  if (!S.dailyQ || S.dailyQ.day !== t) S.dailyQ = { day: t, done: false, correct: false };
}
let DQ_PICK = null, DQ_SEL = null;
function pickDailyQuestion() {
  const pool = [];
  domains().forEach(d => d.lessons.forEach(l => trackFilter(l.questions).forEach(q => {
    if (q.format === "mcq" && q.stem) pool.push(q);
  })));
  if (!pool.length) return null;
  const t = todayKey();
  let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) >>> 0;
  /* djb2 over consecutive date strings lands on consecutive indices, so the
     "daily" question walked one step through the bank and served the same
     lesson eight or nine days running. Avalanche it. */
  /* Every step has to stay UNSIGNED. `h ^= h >>> 13` is a signed-int32 XOR, so
     it went negative on roughly half of all dates, pool[negative] was
     undefined, and the daily question silently refused to open on those days —
     the button did nothing at all. */
  h ^= h >>> 15; h = Math.imul(h, 2246822507) >>> 0; h = (h ^ (h >>> 13)) >>> 0;
  const q = pool[h % pool.length];
  return q ? shuffleChoices(q) : null;
}

function dailyQuestionCard() {
  dailyQReset();
  if (S.dailyQ.done) {
    return `<div class="dq-card dq-claimed">
      <div class="dq-row">
        <span class="dq-badge ${S.dailyQ.correct ? "ok" : "miss"}">${S.dailyQ.correct ? CHECK_BADGE : "↻"}</span>
        <div class="dq-txt"><b>أجبت سؤال اليوم</b><span>${S.dailyQ.correct ? "إجابة صحيحة! عُد غداً لسؤال جديد" : "عُد غداً لسؤال جديد 🌙"}</span></div>
      </div></div>`;
  }
  return `<button class="dq-card dq-open" onclick="A.openDailyQ()">
    <span class="dq-glow"></span>
    <div class="dq-row">
      <span class="dq-icon">${ico("star-gold", 30)}</span>
      <div class="dq-txt"><b>سؤال اليوم</b><span>جاوب واكسب ${arPlural(DAILYQ_REWARD, "جوهرة", "جوهرتين", "جواهر", "جوهرة")} ${ico("gem", 13)}</span></div>
      <span class="dq-go">ابدأ</span>
    </div>
  </button>`;
}

A.openDailyQ = function () {
  dailyQReset();
  if (S.dailyQ.done) { toast("🌙 عُد غداً لسؤال جديد"); return; }
  DQ_PICK = pickDailyQuestion(); DQ_SEL = null;
  if (!DQ_PICK) return;
  const q = DQ_PICK;
  const veil = document.createElement("div");
  veil.className = "dq-veil";
  veil.innerHTML = `<div class="dq-sheet">
    <div class="ms-grip"></div>
    <button class="dq-x" onclick="A.closeDailyQ()" aria-label="إغلاق">${X_SVG}</button>
    <div class="dq-head"><span class="dq-hstar">${ico("star-gold", 26)}</span><h3>سؤال اليوم</h3></div>
    <div class="dq-note">يبقى متاحاً حتى منتصف الليل</div>
    <div class="dq-stem">${q.stem}</div>
    ${q.figure ? `<div class="q-figure">${q.figure}</div>` : ""}
    <div class="dq-choices">${q.choices.map((c, i) =>
      `<div class="slot"><span class="base" aria-hidden="true"></span>` +
      `<button class="choice" data-ci="${i}" style="--d:${0.05 + i * 0.06}s" onclick="A.pickDailyQ(${i})">` +
      `<span class="ch-shine" aria-hidden="true"></span>` +
      `<i class="ch-spk k1" aria-hidden="true"></i><i class="ch-spk k2" aria-hidden="true"></i><i class="ch-spk k3" aria-hidden="true"></i>` +
      `<span class="ch-letter">${LETTERS[i]}</span><span class="ch-txt">${c}</span></button></div>`).join("")}</div>
    <button class="btn dq-check" id="dqCheck" disabled onclick="A.checkDailyQ()">تحقق</button>
    <div class="dq-fb" id="dqFb"></div>
    <div class="storm" id="storm" aria-hidden="true">
      <svg viewBox="0 0 884 1920" preserveAspectRatio="xMidYMid slice">
        <polyline class="bolt" id="fxBoltA"/>
        <polyline class="bolt" id="fxBoltB"/>
      </svg>
    </div>
  </div>`;
  veil.onclick = e => { if (e.target === veil) A.closeDailyQ(); };
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));
};
A.pickDailyQ = function (i) {
  fxClear();
  DQ_SEL = i;
  document.querySelectorAll(".dq-choices .choice").forEach((b, j) => b.classList.toggle("sel", j === i));
  const c = document.getElementById("dqCheck"); if (c) c.disabled = false;
};
A.checkDailyQ = function () {
  if (DQ_SEL === null || !DQ_PICK) return;
  const q = DQ_PICK, correct = DQ_SEL === q.answer;
  document.querySelectorAll(".dq-choices .choice").forEach((b, j) => {
    b.disabled = true;
    if (j === q.answer) b.classList.add("correct");
    else if (j === DQ_SEL) b.classList.add("wrong");
    else b.classList.add("dim");
  });
  const reward = correct ? DAILYQ_REWARD : 5;       // gems: +15 correct / +5 wrong attempt
  S.dailyQ.done = true; S.dailyQ.correct = correct;
  gainGems(reward); gainXP(correct ? 8 : 2);        // wallet + rank XP
  bumpStreak();   // answering the daily question is showing up, so it counts
  const qs = S.qstats[q.id] = S.qstats[q.id] || { r: 0, w: 0 }; correct ? qs.r++ : qs.w++;
  noteAnswer(q, correct);
  save();
  if (correct) {
    playCorrect();
    S.dqRun = (S.dqRun || 0) + 1;      // the daily question keeps its own run
    answerFx(document.querySelector(`.dq-choices .choice[data-ci="${q.answer}"]`), S.dqRun);
  } else {
    sndBad();
    S.dqRun = 0;
    answerFxFail(document.querySelector(`.dq-choices .choice[data-ci="${DQ_SEL}"]`));
  }
  const chk = document.getElementById("dqCheck"); if (chk) chk.style.display = "none";
  const fb = document.getElementById("dqFb");
  fb.className = "dq-fb show " + (correct ? "good" : "bad");
  fb.innerHTML = `<div class="dq-reward"><b>+${toAr(reward)}</b>${ico("gem", 26)}</div>
    <div class="dq-msg">${correct ? "إجابة صحيحة! 🎉" : "إجابة غير صحيحة — الصحيحة: " + LETTERS[q.answer]}</div>
    <button class="dq-soltoggle" onclick="A.toggleEl('dqSol')">اعرض الحل</button>
    <div class="fb-solution dq-sol" id="dqSol" style="display:none">${formatExplain(q.solution)}</div>
    <button class="btn dq-cont" onclick="A.closeDailyQ()">متابعة</button>`;
};
A.closeDailyQ = function () {
  const v = document.querySelector(".dq-veil");
  if (v) { v.classList.remove("show"); setTimeout(() => { v.remove(); if (view === "path") render(); }, 320); }
};

/* ---------------- screens / router ---------------- */
let view = "path";
function renderSidebar() {
  const el = document.getElementById("sidebar");
  if (!el) return;
  const NAV = [
    { k: "path",     icon: "nav-home",   label: "الدروس",          short: "الدروس" },
    { k: "league",   icon: "nav-league", label: "المجلس",          short: "المجلس" },
    { k: "mock",     icon: "nav-exam",   label: "اختبار تجريبي",   short: "تجريبي" },
    { k: "stats",    icon: "nav-stats",  label: "إحصائياتي",       short: "إحصائيات" },
    { k: "review",   icon: "target",     label: "مراجعة الأخطاء",  short: "الأخطاء" },
    { k: "profile",  icon: "nav-more",   label: "ملفي الشخصي",     short: "ملفي" },
    /* The two-way sheet is a phone affordance — it hangs off the bottom bar,
       and there is no bottom bar here. Desktop has room to list both. */
    { k: "settings", icon: "guide",      label: "الإعدادات",       short: "إعدادات" },
  ];
  el.innerHTML = `
    <div class="sb-logo">
      <svg width="34" height="34" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#58CC02"/><text x="50" y="68" font-size="54" text-anchor="middle">⭐</text></svg>
      <span>قدراتي</span>
    </div>
    <div class="sb-nav">
      ${NAV.map(n => `<button class="sb-item${view === n.k ? " active" : ""}" onclick="A.go('${n.k}')"
        title="${n.label}"${view === n.k ? ' aria-current="page"' : ""}>
        ${ico(n.icon, 26)}<span class="sb-label">${n.label}</span><span class="sb-short">${n.short}</span>
      </button>`).join("")}
    </div>
    <div class="sb-foot">
      <div class="sf-stat">${ico("streak", 22)}<b>${toAr(S.streak.count)}</b></div>
      <div class="sf-stat">${ico("gem", 20)}<b>${toAr(S.xp)}</b></div>
    </div>`;
}

/* Context column for wide screens (>= 1320px). Read-only summary of state
   the player otherwise has to leave the path to see. */
function renderAside() {
  const el = document.getElementById("aside");
  if (!el) return;
  const ti = tierIndex(), tier = LEAGUE_TIERS[ti], next = LEAGUE_TIERS[ti + 1];
  const flat = allLessons();
  const doneN = flat.filter(x => lessonProg(x.key).stars > 0).length;
  let r = 0, w = 0;
  Object.values(S.qstats).forEach(q => { r += q.r; w += q.w; });
  const acc = (r + w) ? Math.round(r / (r + w) * 100) : null;

  dailyReset();
  const goal = Math.min(S.daily.n, DAILY_GOAL);
  const questPct = Math.round(goal / DAILY_GOAL * 100);
  const questReady = S.daily.n >= DAILY_GOAL && !S.daily.claimed;
  const questSub = S.daily.claimed ? "استلمت صندوق اليوم — عُد غداً"
    : S.daily.n >= DAILY_GOAL ? "صندوقك جاهز — افتحه الآن!"
      : `باقي ${toAr(DAILY_GOAL - S.daily.n)} من الأسئلة`;

  const nextLine = next
    ? `اكسب ${toAr(next.min - (S.totalXp || 0))} خبرة للمستوى ${next.name}`
    : "أعلى مستوى — أنت من الأبطال!";

  el.innerHTML = `
    <div class="as-card">
      <h4>مستواك</h4>
      <button class="as-rank" onclick="A.go('league')">
        ${rankImg(tier.key, 46)}
        <span><b>المستوى ${tier.name}</b><span>${nextLine}</span></span>
        <span class="as-go">←</span>
      </button>
    </div>

    <div class="as-card">
      <h4>لمحة سريعة</h4>
      <div class="as-grid">
        <div class="as-stat">${ico("streak", 24)}<div><div class="as-v">${toAr(S.streak.count)}</div><div class="as-l">أيام متتالية</div></div></div>
        <div class="as-stat">${ico("gem", 24)}<div><div class="as-v">${toAr(S.xp)}</div><div class="as-l">جواهر</div></div></div>
        <div class="as-stat">${ico("nav-chest", 24)}<div><div class="as-v">${toAr(doneN)}/${toAr(flat.length)}</div><div class="as-l">دروس</div></div></div>
        <div class="as-stat">${ico("target", 24)}<div><div class="as-v">${acc === null ? "—" : toAr(acc) + "٪"}</div><div class="as-l">الدقة</div></div></div>
      </div>
    </div>

    <div class="as-card">
      <h4>مهمة اليوم</h4>
      <button class="as-quest${S.daily.claimed ? " quest-claimed" : ""}" onclick="A.chestTap()">
        <div class="as-quest-row">
          ${chestSVG("cf-chest" + (questReady ? " qc-bounce" : ""))}
          <b>${toAr(goal)} / ${toAr(DAILY_GOAL)} أسئلة</b>
        </div>
        <div class="duo-bar"><i style="width:${questPct}%;--bar-c:var(--gold);--bar-shine:var(--gold-soft)"></i></div>
        <div class="as-quest-sub">${questSub}</div>
      </button>
    </div>`;
}

function render() {
  ({ path: renderPath, league: renderLeague, mock: renderMockHome, stats: renderStats, settings: renderSettings, review: renderReview, profile: renderProfile })[view]();
  flushRankUp();
  renderSidebar();
  renderAside();
}
function go(v) { view = v; render(); window.scrollTo(0, 0); }

const ICO_FILE = { "nav-exam": "nav-exam-64.png" }; // raster icons (user-provided art)
const ico = (name, size) => `<img class="ic" src="assets/icons/${ICO_FILE[name] || name + ".svg"}" width="${size}" height="${size}" alt="">`;

function statbar() {
  const t = LEAGUE_TIERS[tierIndex()];
  return `<div class="statbar">
    <div class="stat stat-streak${S.streak.count ? "" : " zero"}" title="سلسلة الأيام" aria-label="سلسلة الأيام: ${toAr(S.streak.count)}">${ico("streak", 23)}${toAr(S.streak.count)}</div>
    <button class="stat stat-rank" onclick="A.go('league')" title="المستوى ${t.name}" aria-label="مستواك: ${t.name}">
      ${rankImg(t.key, 25)}<span>${t.name}</span>
    </button>
    <div class="stat stat-xp" title="جواهرك">${ico("gem", 22)}${toAr(S.xp)}</div>
  </div>`;
}
A.chestTap = function () {
  dailyReset();
  if (S.daily.claimed) { toast("🎁 عُد غداً لصندوق جديد"); return; }
  if (S.daily.n >= DAILY_GOAL) { A.openChest(); return; }
  toast(`باقي ${qCount(DAILY_GOAL - S.daily.n)} لفتح صندوق اليوم 🎁`);
};
function bottomnav(active) {
  /* the labels were the state keys — "path", "league" — read aloud in Arabic */
  const items = [["path", "nav-home", "الدروس"], ["league", "nav-league", "المجلس"],
    ["mock", "nav-exam", "اختبار تجريبي"], ["stats", "nav-stats", "إحصائياتي"], ["more", "nav-more", "المزيد"]];
  return `<nav class="bottomnav">` + items.map(([k, i, label]) => {
    /* the last slot is a menu, not a destination, so it lights up for the
       screens it can reach rather than for one of its own */
    const act = k === "more" ? (active === "profile" || active === "settings") : (active === k);
    const call = k === "more" ? "A.openMore()" : `A.go('${k}')`;
    return `<button class="navbtn ${act ? "active" : ""}" onclick="${call}" aria-label="${label}"${act ? ' aria-current="page"' : ""}>${ico(i, 30)}</button>`;
  }).join("") + `</nav>`;
}

/* ---------------- exam countdown card (top of path) ---------------- */
function countdownCard() {
  const days = examDaysLeft();
  if (days === null) {
    return `<div class="exam-card exam-card-empty" onclick="A.examSetup()">
      <div class="ec-row"><span class="ec-clock">${TIMER_SVG}</span>
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
    <div class="ec-row"><span class="ec-clock">${TIMER_SVG}</span><div class="ec-head">${head}</div><span class="ec-edit" aria-hidden="true">✎</span></div>
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
  const gems = CHEST_GEMS; // flat 50
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
  gainGems(gems); S.daily.claimed = true; save();
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
  const offsets = [0, -46, -66, -46, 0, 46, 66, 46]; // winding path x-offsets
  ds.forEach((d, di) => {
    const u = UNIT_COLORS[d.color] || UNIT_COLORS.purple;
    const uDone = d.lessons.filter(l => lessonProg(d.key + "." + l.key).stars > 0).length;
    html += `<div class="unit-banner u-${d.color === "yellow" ? "gold" : d.color}" data-unit="${d.key}">
      <div class="u-txt"><div class="u-kicker">القسم ${toAr(1)}، الوحدة ${toAr(di + 1)}</div><h2>${d.title}</h2></div>
      <div class="u-side"><span class="u-divider"></span><span class="u-prog"><b>${toAr(uDone)}/${toAr(d.lessons.length)}</b><span>دروس</span></span></div>
    </div><div class="path">`;
    d.lessons.forEach((l, li) => {
      const key = d.key + "." + l.key, p = lessonProg(key);
      const done = p.stars > 0, open = gi <= firstOpenIdx, current = gi === firstOpenIdx;
      const cls = done ? "node-done" : open ? "" : "node-locked";
      const x = offsets[gi % offsets.length];
      // every node is a star: gold star-done when completed, the white star otherwise
      /* star-done.svg is #AA572A, and that is the point: the completed node's
         own face is gold (#FFC800 below), so the darker star is what reads
         against it. star-gold here put a gold star on a gold coin. */
      const nodeIcon = done ? ico("star-done", 40) : ico("star", 40);
      const ring = current ? `<svg class="node-ring" viewBox="0 0 89 84" fill="none">
          <ellipse cx="44.5" cy="42" rx="41.5" ry="39" stroke="#E5E5E5" stroke-width="6"/>
          <path d="M 44.5 3 A 41.5 39 0 0 1 81.5 25" stroke="${u.c}" stroke-width="6" stroke-linecap="round"/>
        </svg>` : "";
      // exact Figma "Level" colors per state: gold done / unit-color open / gray locked
      const nc = done ? ["#FFC800", "#E6A000", "#FFE700"] : open ? [u.c, u.s, u.h] : ["#D2D2D2", "#ADADAD", "transparent"];
      html += `<div class="path-row"><div class="node-col${current ? " bob" : ""}" style="right:${x}px">
        ${ring}
        <button class="node ${cls}" style="--node-c:${nc[0]};--node-s:${nc[1]};--node-h:${nc[2]};--d:${(gi % 10) * 0.06}s"
          aria-label="${l.title} — ${done ? "مكتمل، " + arPlural(p.stars, "نجمة واحدة", "نجمتان", "نجوم", "نجمة") : current ? "الدرس الحالي" : "مقفل"}"
          ${open ? `onclick="A.nodeTap(event,'${d.key}','${l.key}',${li})"` : "disabled"}>
          ${current ? `<span class="node-tip" style="color:${u.c}">ابدأ</span>` : ""}
          ${nodeIcon}
        </button>
        ${done ? '<span class="node-stars" aria-hidden="true">' + [1, 2, 3].map(sn =>
          '<i class="ns' + (sn <= p.stars ? ' on' : '') + '"></i>').join('') + '</span>' : ''}
        <span class="node-label${done ? ' nl-done' : open ? '' : ' nl-locked'}">${l.title}</span>
      </div></div>`;
      gi++;
    });
    html += `</div>`;
  });
  $app.innerHTML = statbar() + `<div class="screen">${countdownCard()}${dailyQuestionCard()}${html}<div style="height:20px"></div></div>` + floatingQuest() + bottomnav("path");
  requestAnimationFrame(() => {
    drawTrails();
    const cur = document.querySelector('.path-row .bob');
    if (!cur) return;
    /* Only chase the node when it is genuinely out of reach. Centring it
       unconditionally threw a new player past the countdown and the daily
       question, so they landed halfway down a page they had never seen. */
    const r = cur.getBoundingClientRect();
    if (r.top > window.innerHeight * 0.72 || r.bottom < 80)
      cur.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}


/* ---------------- LESSON SESSION ---------------- */
let SES = null; // current session

/* The winding path read as scattered dots because nothing joined them.
   Node positions come from CSS offsets, so the trail is measured from the
   rendered circles rather than recomputed - it stays correct at any width. */
function drawTrails() {
  const NS = "http://www.w3.org/2000/svg";
  document.querySelectorAll(".path").forEach(path => {
    const old = path.querySelector(".path-trail"); if (old) old.remove();
    const nodes = [].slice.call(path.querySelectorAll(".node"));
    if (nodes.length < 2) return;
    const pr = path.getBoundingClientRect();
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "path-trail");
    svg.setAttribute("viewBox", "0 0 " + Math.round(pr.width) + " " + Math.round(pr.height));
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    const mid = el => {
      const r = el.getBoundingClientRect();
      return [r.left - pr.left + r.width / 2, r.top - pr.top + r.height / 2];
    };
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = mid(nodes[i]), b = mid(nodes[i + 1]);
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", a[0].toFixed(1)); line.setAttribute("y1", a[1].toFixed(1));
      line.setAttribute("x2", b[0].toFixed(1)); line.setAttribute("y2", b[1].toFixed(1));
      line.setAttribute("class", nodes[i + 1].classList.contains("node-locked") ? "tl tl-locked" : "tl tl-open");
      svg.appendChild(line);
    }
    path.insertBefore(svg, path.firstChild);
  });
}
let trailT = null;
window.addEventListener("resize", () => {
  if (view !== "path" || SES) return;
  clearTimeout(trailT);
  trailT = setTimeout(drawTrails, 160);
});

function pickLessonQuestions(lesson, key) {
  const qs = trackFilter(lesson.questions);
  const stat = q => { const s = S.qstats[q.id] || { r: 0, w: 0 }; return s.r - s.w; };
  // least-mastered first, then keep official easy→hard ordering
  const chosen = qs.slice().sort((a, b) => stat(a) - stat(b) || a.difficulty - b.difficulty).slice(0, 8);
  return chosen.sort((a, b) => a.difficulty - b.difficulty).map(shuffleChoices);
}

A.go = function (v) { if (v === "review") reviewFrom = view; go(v); };

/* Lesson-start popup (Figma "Select Lesson" purple sheet) */
A.nodeTap = function (ev, domKey, lesKey, li) {
  const d = window.QBANK[domKey], l = d.lessons.find(x => x.key === lesKey);
  const u = UNIT_COLORS[d.color] || UNIT_COLORS.purple;
  const old = document.querySelector(".lesson-pop-veil"); if (old) old.remove();
  const btn = ev.currentTarget;
  const r = btn.getBoundingClientRect();
  const veil = document.createElement("div");
  veil.className = "lesson-pop-veil";
  const canBoost = S.xp >= BOOST_COST;
  veil.innerHTML = `<div class="lesson-pop" style="--pop-c:${u.c};top:${Math.min(r.bottom + 14, window.innerHeight - 190)}px">
    <h3>${l.title}</h3>
    <button class="lp-boost ${canBoost ? "" : "cant"}" id="lpBoost" aria-label="ضاعف خبرة هذا الدرس مقابل ${toAr(BOOST_COST)} جوهرة">
      <span class="lpb-ico"><img src="assets/icons/lightning.svg" width="20" height="20" alt=""></span>
      <span class="lpb-label">ضاعف الخبرة <span dir="ltr">×٢</span></span>
      <span class="lpb-cost">${ico("gem", 13)} ${toAr(BOOST_COST)}</span>
    </button>
    <button class="btn btn-white" style="color:${u.c};box-shadow:0 5px 0 ${u.pale}">ابدأ</button>
  </div>`;
  veil.onclick = e => { if (e.target === veil) veil.remove(); };
  let boost = false;
  const bb = veil.querySelector("#lpBoost");
  if (bb) bb.onclick = () => {
    if (S.xp < BOOST_COST) { toast("جواهرك لا تكفي للمضاعفة"); return; }
    boost = !boost;
    bb.classList.toggle("on", boost);
    const cost = bb.querySelector(".lpb-cost");
    if (cost) cost.innerHTML = boost ? `مفعّل ✓` : `${ico("gem", 13)} ${toAr(BOOST_COST)}`;
    if (boost) sndGood();
  };
  veil.querySelector(".btn-white").onclick = () => { veil.remove(); A.startLesson(domKey, lesKey, boost); };
  document.body.appendChild(veil);
  const pop = veil.querySelector(".lesson-pop");
  /* Anchor the bubble to the node WITHOUT measuring the bubble itself.
     Its rect is not reliable right after insertion (it can read back
     zero-width, which pinned the arrow to the popup edge), so the arrow is
     expressed in CSS instead: 50% resolves against the popup's real width at
     paint time, and clamp() keeps the arrow inside the rounded corners.
     dx is the node's offset from the path column centre, and the popup is
     centred on that same column, so -dx is exactly the shift the arrow needs. */
  const path = btn.closest(".path");
  const nr = btn.getBoundingClientRect();
  const pcr = (path || btn.parentElement).getBoundingClientRect();
  const dx = (nr.left + nr.width / 2) - (pcr.left + pcr.width / 2);
  pop.style.top = Math.max(8, Math.min(nr.bottom + 14, window.innerHeight - 200)) + "px";
  pop.style.setProperty("--arrow-x",
    "clamp(20px, calc(50% - " + dx.toFixed(1) + "px), calc(100% - 20px))");
};

A.startLesson = function (domKey, lesKey, boost) {
  const d = window.QBANK[domKey], l = d.lessons.find(x => x.key === lesKey);
  const key = domKey + "." + lesKey;
  const qs = pickLessonQuestions(l, key);
  if (!qs.length) { showModal("⭐", "لا توجد أسئلة", "لا توجد أسئلة متاحة لهذا الدرس في مسارك الحالي.", "حسناً"); return; }
  warmStreak();                                          // preload the fire-streak assets during the lesson
  const prev = S.lessons[key];
  const replay = !!(prev && prev.stars > 0);            // already cleared → farm mode (+2/+2)
  let xpBoost = false;
  if (boost && S.xp >= BOOST_COST) { S.xp -= BOOST_COST; xpBoost = true; save(); }  // pay for 2× rank XP up front
  SES = { mode: "lesson", domKey, lesKey, key, title: l.title, method: l.method || "", queue: qs.slice(), total: qs.length, idx: 0, done: 0, firstTry: {}, retried: {}, sel: null, locked: false, xp: 0, gems: 0, replay, xpBoost, hearts: LEVEL_HEARTS, left: Q_SECS, timer: null, tSpent: 0, tAnswered: 0 };
  /* Every lesson ships a written intro — the rule, the method, the common
     mistake — and none of it had ever rendered, because each question also
     carries its own method and "q.method || SES.method" always took the
     question's. Teach first on a lesson you have not cleared. */
  if (!replay && l.method) { renderLessonIntro(d, l); return; }
  renderSession();
};

/* Splits a lesson's method into numbered cards. The first clause of a step is
   the thing to remember, so it leads; the rest explains it. The 💡 line keeps
   the callout it already had. */
function introSteps(text) {
  let i = 0;
  return String(text).split("\n").map(line => {
    const t = line.trim();
    if (!t) return "";
    if (/^💡/.test(t)) return `<div class="ex-tip">${BULB_SVG}<span>${esc(t.replace(/^💡\s*/, ""))}</span></div>`;
    i++;
    const body = t.replace(/^[٠-٩0-9]+[\)\.\-–]\s*/, "");
    const cut = body.search(/[:：]|، /);
    const lead = cut > 0 ? body.slice(0, cut + (body[cut] === "،" ? 1 : 1)) : body;
    const rest = cut > 0 ? body.slice(lead.length).trim() : "";
    return `<div class="li-step" style="--d:${(i * 0.06).toFixed(2)}s">
      <span class="li-num">${toAr(i)}</span>
      <span class="li-txt">${rest
        ? `<b class="li-lead">${esc(lead)}</b><span class="li-rest">${esc(rest)}</span>`
        : `<span class="li-solo">${esc(lead)}</span>`}</span>
    </div>`;
  }).join("");
}

function renderLessonIntro(d, l) {
  const u = UNIT_COLORS[d.color] || UNIT_COLORS.purple;
  $app.innerHTML = `<div class="screen screen-full lesson-intro">
    <button class="x-btn li-x" onclick="A.cancelIntro()" aria-label="رجوع للمسار">${X_SVG}</button>
    <div class="li-head" style="background:${u.c};box-shadow:0 5px 0 ${u.s}">
      <div class="li-kicker">قبل ما نبدأ</div>
      <h1>${l.title}</h1>
    </div>
    <div class="li-body" style="--li-c:${u.c};--li-s:${u.s}">${introSteps(l.method)}</div>
    <div class="action-bar">
      <button class="btn" onclick="A.beginQuestions()">فهمت، ابدأ</button>
    </div>
  </div>`;
  window.scrollTo(0, 0);
}
A.beginQuestions = function () { if (SES) renderSession(); };
/* the intro must not be a room with no door - the daily-question sheet
   was exactly that until this pass */
A.cancelIntro = function () { if (SES && SES.xpBoost) gainGems(BOOST_COST); SES = null; save(); go("path"); };

/* Renders solution/method text (\n lines) as styled steps; lines with 💡 or
   warning words become a highlighted callout. Shared by the solution box
   and the method sheet. */
const BULB_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2Z"/></svg>`;
function formatExplain(text) {
  return String(text).split("\n").map(line => {
    const t = line.trim();
    if (!t) return "";
    const warn = /^💡|^الخطأ|^خطأ شائع|^انتبه|^ملاحظة|^تنبيه|^احذر|^تذكّر|الخطأ الشائع/.test(t);
    const body = esc(t.replace(/^💡\s*/, ""));
    if (warn) return `<div class="ex-tip">${BULB_SVG}<span>${body}</span></div>`;
    return `<div class="ex-step">${body}</div>`;
  }).join("");
}

function questionBody(q, selIdx, lockHandlers, pickFn, method) {
  const isCmp = q.format === "comparison";
  const choices = isCmp ? CMP_CHOICES : q.choices;
  let h = `<div class="q-top"><div class="q-kicker">${isCmp ? "قارن بين القيمتين ثم اختر:" : "اختر الإجابة الصحيحة:"}</div>${method ? `<button class="method-btn" onclick="A.showMethod()">${BULB_SVG} كيف أحلّها؟</button>` : ""}</div>`;
  // 104 comparison questions carry a stem that just restates the kicker above it
  const echoesKicker = isCmp && /^قارن\s+بين\s+القيمتين/.test(String(q.stem || "").trim());
  if (q.stem && !echoesKicker) h += `<div class="q-stem">${q.stem}</div>`;
  if (q.figure) h += `<div class="q-figure">${q.figure}</div>`;
  if (isCmp) h += `<div class="cmp-wrap">
      <div class="cmp-box"><div class="cmp-t">القيمة الأولى</div><div class="cmp-v">${q.value1}</div></div>
      <div class="cmp-box"><div class="cmp-t">القيمة الثانية</div><div class="cmp-v">${q.value2}</div></div></div>`;
  /* .slot + .base is the reference's structure: the grey base stays put so the
     card has something to hop off, which is what makes the jump read. */
  h += `<div class="choices">` + choices.map((c, i) =>
    `<div class="slot"><span class="base" aria-hidden="true"></span>
     <button class="choice ${selIdx === i ? "sel" : ""}" data-ci="${i}" style="--d:${0.05 + i * 0.07}s" ${lockHandlers ? "" : `onclick="${pickFn || "A.pick"}(${i})"`}>
       <span class="ch-shine" aria-hidden="true"></span>
       <i class="ch-spk k1" aria-hidden="true"></i><i class="ch-spk k2" aria-hidden="true"></i><i class="ch-spk k3" aria-hidden="true"></i>
       <span class="ch-letter">${LETTERS[i]}</span><span class="ch-txt">${c}</span><span class="ch-key" aria-hidden="true">${toAr(i + 1)}</span></button></div>`).join("") + `</div>`;
  return h;
}

/* ============================================================
   CORRECT-ANSWER MOTION — ported from NewAnswerAnimation.txt.

   THE JUMP — traced off the match-pairs recording, 60fps,
   transform-origin 50% 100%.  AMP scales it past the measured values.
       f0  y −15  sx .947  sy 1.056   launch, tall + narrow
       f6  y −24  sx 1     sy 1       apex
       f10 y −24                      apex hold ends
       f19 y  −6  sx .980  sy 1.070   falling, stretching
       f20 y  +1  sx 1.024 sy .926    impact, wide + short
       f26 y  −7  sx 1     sy 1       settles, still lifted off its base
   It plays on EVERY correct answer.

   THE STRIKE rides on top of the jump once the run is long enough, and
   the two themes are NOT one effect recoloured — every number differs:

              bolt colour  stroke   bar transition            A / B
     GOLD     #fae36a      34 / 20  #ffc800 → #ff9600,        +150 / +467
                                    EASED 350ms sine.inOut    hold 300/267
     BLUE     #9efefd      62       #ff9600 → cyan gradient,  +200 / +500
                                    HARD CUT in 50ms          hold 300/383

   Both bolts hold a dead-flat colour every frame they are lit, so the
   strikes are always hard cuts.

   Thresholds: gold from 3 correct in a row, blue from 5.
   ============================================================ */
const FX_AMP = 1.6;                                   // 60% past measured
const FXP = v => +(v * FX_AMP).toFixed(2);
const FXA = v => +(1 + (v - 1) * FX_AMP).toFixed(4);
const FX_JUMP = { launch: .033, rise: .067, hang: .067, fall: .133, impact: .033, settle: .100 };

const FX_THEMES = {
  gold: {
    ink: '#f39100',
    barFrom: '#ffc800', barTo: '#ff9600',
    barDur: .35, barEase: 'sine.inOut',
    bolt: '#fae36a', wA: 34, wB: 20,
    pA: '388,-40 512,315 430,540 614,790 610,1015 452,1310 528,1700',
    pB: '430,-40 546,300 452,560 640,806 634,1030 470,1330 556,1740',
    a: .15, aHold: .30, b: .467, bHold: .267,
    shard: '#fae36a'
  },
  blue: {
    ink: '#03b9ed',
    barFrom: '#ff9600', barTo: 'linear-gradient(90deg,#00fcfb,#0086ff)',
    barDur: .05, barEase: 'none',
    bolt: '#9efefd', wA: 62, wB: 62,
    pA: '400,-40 522,330 372,545 652,960 315,1370 430,1760',
    pB: '432,-40 348,352 533,494 224,726 218,900 646,1178 512,1600',
    a: .20, aHold: .30, b: .50, bHold: .383,
    shard: '#9efefd'
  },
  /* plain correct answer: the jump, the crest and the confetti — but no
     strike, no streak tag, and the bar just advances in its own colour
     instead of turning over to a new tier. */
  none: {
    ink: '#58a700',
    barFrom: '#ff9600', barTo: '#ff9600',
    barDur: .25, barEase: 'power2.out',
    bolts: false,
    shard: '#b8f36a'
  }
};
/* gold from three in a row, blue from five */
function fxThemeFor(run) { return run >= 5 ? FX_THEMES.blue : run >= 3 ? FX_THEMES.gold : FX_THEMES.none; }

/* --------------------------------------------------------------------------
   THE STREAK LADDER ON THE PROGRESS BAR.
   Yellow is the resting state, three in a row turns it orange, five turns it
   blue. The colours are the reference's own bar values — gold's barTo
   (#ff9600) and blue's barTo (the cyan gradient) — and each tier carries the
   matching tint for the shine line so the bar still reads as one object.

   This is state, not animation. The strike cross-fades BETWEEN tiers, but the
   tier itself is a property of the live run: it is repainted on every render,
   so it survives moving to the next question and only falls back to yellow
   when the run dies.
   -------------------------------------------------------------------------- */
const FX_BAR_TIERS = [
  { min: 0, fill: "var(--gold)",                            shine: "var(--gold-soft)" },  // #FFC800 yellow
  { min: 3, fill: "#ff9600",                                shine: "#ffc46b" },           // orange
  { min: 5, fill: "linear-gradient(90deg,#00fcfb,#0086ff)", shine: "#9efefd" }            // blue
];
function fxBarTier(run) {
  let t = FX_BAR_TIERS[0];
  for (const x of FX_BAR_TIERS) if ((run || 0) >= x.min) t = x;
  return t;
}
/* Paints bar + tag for a run, with no animation. renderSession() calls it, and
   so does the strike once its cross-fade lands. */
function fxPaintBar(run) {
  const bar = document.querySelector(".screen-session .progress");
  if (bar) {
    const t = fxBarTier(run);
    bar.style.setProperty("--bar-fill", t.fill);
    bar.style.setProperty("--bar-shine", t.shine);
  }
  const tag = document.getElementById("fxTag");
  if (tag) {
    const on = (run || 0) >= 3;
    tag.textContent = on ? toAr(run) + " على التوالي" : "";
    tag.classList.toggle("on", on);
    tag.style.color = fxThemeFor(run || 0).ink;
  }
}

/* ---------- crest ---------- */
const FX_W = 380, FX_BASE = 78;
const fxWave = { a: FX_BASE, b: FX_BASE, c: FX_BASE, d: FX_BASE, e: FX_BASE };
function fxDrawCrest() {
  const fill = document.querySelector(".fb-crest-fill"), line = document.querySelector(".fb-crest-line");
  if (!fill || !line) return;
  const s = FX_W / 4;
  const d = `M0,${fxWave.a}` +
    `C${s * .5},${fxWave.a} ${s * .5},${fxWave.b} ${s},${fxWave.b}` +
    `C${s * 1.5},${fxWave.b} ${s * 1.5},${fxWave.c} ${s * 2},${fxWave.c}` +
    `C${s * 2.5},${fxWave.c} ${s * 2.5},${fxWave.d} ${s * 3},${fxWave.d}` +
    `C${s * 3.5},${fxWave.d} ${s * 3.5},${fxWave.e} ${s * 4},${fxWave.e}`;
  line.setAttribute("d", d);
  fill.setAttribute("d", d + `L${FX_W},90 L0,90 Z`);
}

let fxTl = null, fxSparks = [];

/* Feature flag, so this can be switched off without a revert:
   localStorage.qudratiFx = "off". A.fxSlow(.35) is the dev slow-motion the
   brief insists on — none of this is verifiable at full speed. */
function fxOn() { try { return localStorage.getItem("qudratiFx") !== "off"; } catch (e) { return true; } }
A.fxToggle = function () {
  try { localStorage.setItem("qudratiFx", fxOn() ? "off" : "on"); } catch (e) {}
  return fxOn() ? "answer motion ON" : "answer motion OFF";
};
A.fxSlow = function (k) { if (window.gsap) gsap.globalTimeline.timeScale(k || 1); return "timeScale " + (k || 1); };
/* Fire the whole effect on demand, without having to build a streak first:
   A.fxDemo()        plain correct answer  (jump + crest + confetti)
   A.fxDemo("gold")  the 3-in-a-row strike
   A.fxDemo("blue")  the 5-in-a-row strike
   Runs on the currently highlighted answer card, or the first one. */
A.fxDemo = function (variant) {
  const card = document.querySelector(".choice.correct") ||
               document.querySelector(".choice.sel") ||
               document.querySelector(".screen-session .choice");
  if (!card) return "open a lesson first";
  if (!window.gsap) return "GSAP did not load — check assets/vendor/gsap.min.js";
  card.classList.add("correct");
  answerFx(card, variant === "blue" ? 5 : variant === "gold" ? 3 : 1);
  return "playing " + (variant || "none");
};

/* The saved preference, never the raw OS query - see motionApply() above. */
function fxReduced() { return motionReduced(); }

function fxClear() {
  if (fxTl) { fxTl.kill(); fxTl = null; }
  fxSparks.forEach(s => s.remove()); fxSparks = [];
  const st = document.getElementById("storm");
  if (st && window.gsap) gsap.set(st.querySelectorAll(".bolt"), { opacity: 0, x: 0, y: 0 });
  document.querySelectorAll(".fx-spark, .fx-bit").forEach(n => n.remove());
  /* give the sheet back to CSS and clear the inline transform GSAP left on it
     — otherwise a killed timeline strands it half way up the screen */
  const fb0 = document.getElementById("fb");
  if (fb0) {
    fb0.classList.remove("fx-anim", "up");
    if (window.gsap) gsap.set(fb0, { clearProps: "transform" });
  }
}

/* ---------- the jump ---------- */
function fxAddJump(tl, card, at) {
  tl.to(card, {
    keyframes: [
      { y: FXP(-15), scaleX: FXA(.947), scaleY: FXA(1.056), duration: FX_JUMP.launch, ease: 'power2.out' },
      { y: FXP(-24), scaleX: 1, scaleY: 1, duration: FX_JUMP.rise, ease: 'power2.out' },
      { y: FXP(-24), duration: FX_JUMP.hang },
      { y: FXP(-6), scaleX: FXA(.980), scaleY: FXA(1.070), duration: FX_JUMP.fall, ease: 'power2.in' },
      { y: FXP(1), scaleX: FXA(1.024), scaleY: FXA(.926), duration: FX_JUMP.impact, ease: 'power2.in' },
      { y: FXP(-7), scaleX: 1, scaleY: 1, duration: FX_JUMP.settle, ease: 'back.out(2.6)' }
    ]
  }, at);

  const air = FX_JUMP.launch + FX_JUMP.rise + FX_JUMP.hang + FX_JUMP.fall;
  const sh = card.querySelector(".ch-shine");
  if (sh) {
    tl.fromTo(sh, { left: '-32%', opacity: 0 },
      { left: '112%', opacity: 1, duration: air, ease: 'none' }, at)
      .to(sh, { opacity: 0, duration: .06 }, at + air - .06);
  }
  const spk = card.querySelectorAll(".ch-spk");
  if (spk.length) {
    tl.to(spk, {
      keyframes: [
        { opacity: 1, scale: 1, rotate: 12, duration: .10, ease: 'back.out(3)' },
        { opacity: 1, scale: .9, rotate: -6, duration: .12 },
        { opacity: 0, scale: .2, duration: .10, ease: 'power1.in' }
      ], stagger: .045
    }, at + .02);
  }
}

/* ---------- particles ---------- */
function fxSeedBits(host, TH) {
  const made = [];
  for (let i = 0; i < 28; i++) {
    const el = document.createElement("i"); el.className = "fx-bit";
    if (i % 3 === 0) {
      const w = 9 + Math.random() * 12;
      el.style.cssText += `width:${w}px;height:${w * .7}px;background:${TH.shard};
        clip-path:polygon(0% 40%,45% 0%,100% 25%,72% 100%,20% 78%);`;
    } else {
      const w = 7 + Math.random() * 8;
      const tone = ['#8ee000', '#58cc02', '#b8f36a'][i % 3];
      el.style.cssText += `width:${w}px;height:${w}px;border-radius:2px;background:${tone};`;
    }
    el.style.left = (Math.random() * 100) + '%';
    el.style.bottom = '200px';
    host.appendChild(el); made.push(el);
  }
  return made;
}
function fxSeedSparks(host, n, box, TH) {
  const made = [];
  for (let i = 0; i < n; i++) {
    const el = document.createElement("i"); el.className = "fx-spark";
    const s = 7 + Math.random() * 9;
    el.style.width = el.style.height = s + 'px';
    el.style.background = TH.bolt;
    el.style.left = (box.x + Math.random() * box.w) + '%';
    el.style.top = (box.y + Math.random() * box.h) + '%';
    host.appendChild(el); made.push(el);
  }
  return made;
}

/* --------------------------------------------------------------------------
   THE SHEET SLIDE.
   The reference's banner, driven off the same timeline as everything else.
   Win  — starts at +133ms, 200ms, power3.out.
   Miss — starts at +100ms, 160ms, power4.out, then one small recoil at +260ms.
   The asymmetry is the point: the error sheet arrives harder and blunter than
   the celebration. Only touches #fb, so the daily-question sheet (an inline
   block, not a bottom banner) keeps its own presentation.
   -------------------------------------------------------------------------- */
function fxSheetIn(tl, bad, at) {
  const fb = document.getElementById("fb");
  if (!fb || !fb.classList.contains("show")) return;
  fb.classList.add("fx-anim");            // CSS transition + entrance anims stand down
  gsap.set(fb, { yPercent: 100 });
  const t = at + (bad ? .10 : .133);
  tl.call(() => fb.classList.add("up"), null, t)      // only tappable once it lands
    .to(fb, bad
      ? { yPercent: 0, duration: .16, ease: 'power4.out' }
      : { yPercent: 0, duration: .20, ease: 'power3.out' }, t);
  if (bad) {
    tl.to(fb, { keyframes: [
      { yPercent: 1.5, duration: .06 },
      { yPercent: 0,   duration: .10, ease: 'power2.out' }
    ] }, at + .26);
  }
}

/* ---------- the strike ---------- */
function fxAddStrike(tl, TH, at, run) {
  const storm = document.getElementById("storm");
  if (!storm) return;
  /* particles belong to the column box too — appended to the page they would
     spread across the whole window on desktop */
  const host = storm;
  const boltA = storm.querySelector("#fxBoltA"), boltB = storm.querySelector("#fxBoltB");
  const warm = document.querySelector(".progress > i");
  const cool = document.querySelector(".progress > .prog-cool");
  const tag = document.getElementById("fxTag");

  if (TH.bolts !== false) {
    boltA.setAttribute("points", TH.pA); boltB.setAttribute("points", TH.pB);
    boltA.setAttribute("stroke", TH.bolt); boltB.setAttribute("stroke", TH.bolt);
    boltA.setAttribute("stroke-width", TH.wA); boltB.setAttribute("stroke-width", TH.wB);
    /* the layer we are turning over TO is the tier this run has just earned,
       not a bare colour - it needs the matching shine line too */
    const bar = document.querySelector(".screen-session .progress");
    const next = fxBarTier(run);
    if (bar) {
      bar.style.setProperty("--cool-fill", next.fill);
      bar.style.setProperty("--cool-shine", next.shine);
    }
    if (tag) tag.style.color = TH.ink;
  }

  const bitEls = fxSeedBits(host, TH);

  /* THE SHEET. Measured, not styled: 200ms power3.out starting 133ms after the
     jump, so it is already on its way while the card is still in the air. The
     CSS transition was .3s on a different curve and started on class-add,
     which put it ~133ms early and 100ms too slow. */
  fxSheetIn(tl, false, at);

  /* the bar always advances; only a strike turns it over to a new tier.
     per-theme: blue cuts in 50ms, gold eases over 350ms */
  if (TH.bolts !== false && warm && cool) {
    tl.to(warm, { opacity: 0, duration: TH.barDur, ease: TH.barEase }, at)
      .to(cool, {
        opacity: 1, duration: TH.barDur, ease: TH.barEase,
        /* Commit: the new tier becomes the bar itself, and the cool layer goes
           back to being spare. Without this the bar is only "turned over" for
           as long as the timeline lives, and the next question repainted it
           yellow again. */
        onComplete: () => {
          fxPaintBar(run);
          gsap.set(warm, { opacity: 1 });
          gsap.set(cool, { opacity: 0 });
        }
      }, at);
    if (tag) tl.to(tag, { opacity: 1, y: 0, scale: 1, duration: .24, ease: 'back.out(2.4)' }, at + TH.barDur * .3);
  }

  /* the liquid crest on the lip of the feedback sheet */
  Object.assign(fxWave, { a: FX_BASE, b: FX_BASE, c: FX_BASE, d: FX_BASE, e: FX_BASE });
  fxDrawCrest();
  tl.to(fxWave, {
    keyframes: [
      { a: 14, b: 56, c: 6, d: 44, e: 20, duration: .16, ease: 'power2.out' },
      { a: 52, b: 20, c: 48, d: 12, e: 56, duration: .20, ease: 'sine.inOut' },
      { a: 66, b: 58, c: 70, d: 60, e: 68, duration: .18, ease: 'sine.inOut' },
      { a: FX_BASE, b: FX_BASE, c: FX_BASE, d: FX_BASE, e: FX_BASE, duration: .24, ease: 'power2.out' }
    ], onUpdate: fxDrawCrest
  }, at + .153);

  bitEls.forEach(el => {
    const w = at + .173 + Math.random() * .16;
    tl.fromTo(el, { opacity: 1, y: 0, x: 0, rotate: 0, scale: .5 },
      {
        y: -(60 + Math.random() * 130), x: (Math.random() - .5) * 120,
        rotate: (Math.random() - .5) * 420, scale: 1,
        duration: .42 + Math.random() * .2, ease: 'power2.out'
      }, w)
      .to(el, { y: '+=170', opacity: 0, rotate: '+=140', duration: .55, ease: 'power1.in' }, w + .4);
  });

  if (TH.bolts === false) return;

  fxSparks = [...fxSeedSparks(host, 8, { x: 28, y: 8, w: 44, h: 16 }, TH),
              ...fxSeedSparks(host, 6, { x: 12, y: 26, w: 60, h: 22 }, TH)];

  [[boltA, TH.a, TH.aHold, -14, -10], [boltB, TH.b, TH.bHold, 12, -12]].forEach(([el, t0, hold, dx, dy]) => {
    tl.set(el, { opacity: 1 }, at + t0)
      .to(el, { x: dx, y: dy, duration: hold, ease: 'none' }, at + t0)
      .to(el, { opacity: 0, duration: .05, ease: 'power2.in' }, at + t0 + hold);
  });

  const twinkle = (arr, w) => arr.forEach((s, i) => {
    tl.fromTo(s, { opacity: 0, scale: 0, rotate: 0 },
      { opacity: 1, scale: 1, rotate: 22, duration: .12, ease: 'back.out(3)' }, w + i * .03)
      .to(s, { opacity: 0, scale: .2, duration: .16, ease: 'power1.in' }, w + i * .03 + .22);
  });
  twinkle(fxSparks.slice(0, 8), at + TH.a + .02);
  twinkle(fxSparks.slice(8), at + TH.b + .02);
}

/* The reference's press feedback: the card sinks into its base while held.
   GSAP owns the transform, so this has to go through GSAP too. */
function fxBindPress() {
  if (!window.gsap) return;
  document.querySelectorAll(".screen-session .choice").forEach(c => {
    gsap.set(c, { y: 0, scaleX: 1, scaleY: 1 });
    const dn = () => { if (!SES.locked) gsap.to(c, { y: 4, scaleY: .96, duration: .06, overwrite: "auto" }); };
    const up = () => { if (!SES.locked) gsap.to(c, { y: 0, scaleY: 1, duration: .09, ease: "power2.out", overwrite: "auto" }); };
    c.addEventListener("pointerdown", dn);
    c.addEventListener("pointerup", up);
    c.addEventListener("pointercancel", up);
    c.addEventListener("pointerleave", up);
  });
}

/* --------------------------------------------------------------------------
   THE MISS. Deliberately NOT the win sequence in red. The card sinks INTO its
   base instead of hopping off it — the exact inverse of the win: +y, squashed,
   no lift, no shine, no sparks — then shakes the impact off. No confetti, no
   bolts, no streak tag, and the progress bar does not advance. It lives in its
   own function so celebration bits cannot leak into a failure.
   -------------------------------------------------------------------------- */
function fxAddFail(tl, card, at) {
  tl.to(card, {
    keyframes: [
      { y: FXP(5), scaleX: FXA(1.02), scaleY: FXA(.95), duration: .07, ease: 'power2.in' },
      { y: FXP(2), scaleX: 1, scaleY: 1, duration: .10, ease: 'power2.out' },
      { y: FXP(2), duration: .10 }
    ]
  }, at)
    .to(card, {
      keyframes: [
        { x: -9, duration: .05 }, { x: 9, duration: .07 }, { x: -6, duration: .06 },
        { x: 4, duration: .06 }, { x: 0, duration: .06 }
      ]
    }, at + .02);

  /* quicker and blunter than the win's 200ms power3.out, plus the recoil */
  fxSheetIn(tl, true, at);

  /* and the cross snaps in */
  const x = document.querySelector("#fb .fb-x");
  if (x) {
    tl.fromTo(x, { scale: 0, rotate: -45 },
      { scale: 1, rotate: 0, duration: .28, ease: 'back.out(3.2)' }, at + .18);
  }
}

function answerFxFail(card) {
  if (!fxOn() || !window.gsap || !card) return;
  fxClear();
  if (fxReduced()) return;              // the miss is already stated in colour
  fxTl = gsap.timeline();
  fxAddFail(fxTl, card, 0);
}

/* Plays on every correct answer. `run` is the consecutive-correct count, and
   it alone decides whether a strike rides along. Falls back to doing nothing
   if GSAP is unavailable — the answer still resolves, it just does not hop. */
function answerFx(card, run) {
  if (!fxOn() || !window.gsap || !card) return;
  fxClear();
  /* Reduced motion gets a REDUCED VARIANT, not silence (brief trap 3): the
     card still acknowledges the answer and still settles lifted off its base,
     but there is no travel, no bolts and no confetti. */
  if (fxReduced()) {
    fxTl = gsap.timeline();
    fxTl.fromTo(card, { scale: .97 }, { scale: 1, y: FXP(-7), duration: .18, ease: 'power2.out' });
    return;
  }
  const TH = fxThemeFor(run);
  const tag = document.getElementById("fxTag");
  if (tag && TH.bolts !== false) {
    tag.textContent = toAr(run) + " على التوالي";
    gsap.set(tag, { opacity: 0, y: 6, scale: .8 });
  }
  fxTl = gsap.timeline();
  fxAddJump(fxTl, card, 0);
  fxAddStrike(fxTl, TH, 0, run);         // STRIKE = 0: fires with the jump
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
    <div class="screen screen-full screen-session">
      <div class="session-top">
        <button class="x-btn" onclick="A.quitSession()" aria-label="إنهاء الدرس">${X_SVG}</button>
        <div class="prog-wrap">
          <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="تقدمك في الدرس"><i style="width:${pct}%"></i><i class="prog-cool" style="width:${pct}%"></i></div>
          <div class="fx-tag" id="fxTag" aria-hidden="true"></div>
        </div>
        ${timerBar()}
        ${SES.mode === "review"
          ? `<span class="sess-hearts sess-review">${ico("target", 22)} ${toAr(SES.done)}/${toAr(SES.total)}</span>`
          : `<span class="sess-hearts" id="sesHearts" aria-label="القلوب المتبقية: ${toAr(SES.hearts)}">${ico("heart", 22)} ${toAr(SES.hearts)}</span>`}
      </div>
      <div class="q-area">${questionBody(q, SES.sel, false, null, q.method || SES.method)}</div>
      <div class="action-bar"><button class="btn" id="checkBtn" onclick="A.check()" ${SES.sel === null ? "disabled" : ""}>تحقق</button></div>
      <div class="feedback" id="fb" role="status" aria-live="assertive"></div>
      <div class="storm" id="storm" aria-hidden="true">
        <svg viewBox="0 0 884 1920" preserveAspectRatio="xMidYMid slice">
          <polyline class="bolt" id="fxBoltA"/>
          <polyline class="bolt" id="fxBoltB"/>
        </svg>
      </div>
    </div>`;
  fxBindPress();
  fxPaintBar(SES.run);       // carries the streak tier + tag into this question
  startQTimer();
}

/* 90-second countdown — horizontal capsule whose colored fill drains away */
/* The clock is a deadline, not a tick count. An interval stops firing when
   the tab is backgrounded or a modal blocks the loop, so counting ticks let
   a student pause the exam by locking their phone. */
function startQTimer(resume) {
  clearInterval(SES.timer);
  if (!resume) SES.left = Q_SECS;
  SES.endsAt = Date.now() + SES.left * 1000;
  const w0 = document.getElementById("qtWrap");
  if (w0) { w0.style.setProperty("--p", SES.left / Q_SECS * 100); w0.classList.remove("low", "crit", "paused"); }
  SES.timer = setInterval(qTick, 250);
}
function qTick() {
  if (!SES || !SES.timer) return;
  const left = Math.round((SES.endsAt - Date.now()) / 1000);
  if (left === SES.left) return;                       // nothing to repaint
  if (left < SES.left && left <= 5 && left > 0) sndTick();
  SES.left = left;
  const n = document.getElementById("qtNum"), w = document.getElementById("qtWrap");
  if (n) n.textContent = toAr(Math.max(0, left));
  if (w) w.style.setProperty("--p", Math.max(0, left) / Q_SECS * 100);
  if (w) { w.classList.toggle("low", left <= 15 && left > 5); w.classList.toggle("crit", left <= 5); }
  if (left <= 0) { clearInterval(SES.timer); SES.timer = null; timeUp(); }
}
function stopQTimer() {
  if (SES && SES.timer) {
    SES.left = Math.max(0, Math.round((SES.endsAt - Date.now()) / 1000));
    clearInterval(SES.timer); SES.timer = null;
  }
  const w = document.getElementById("qtWrap");
  if (w) w.classList.add("paused");
}

/* ---------------- question timer (Duolingo-style draining capsule) ---------------- */
const CLOCK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 1.8"/></svg>`;
function timerBar() {
  return `<span class="qtimer" id="qtWrap" style="--p:100" title="الوقت المتبقي" aria-label="الوقت المتبقي">
    <svg class="qt-ring" viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
      <circle class="qt-track" cx="22" cy="22" r="19"/>
      <circle class="qt-arc" cx="22" cy="22" r="19" pathLength="100"/>
    </svg>
    <b class="qt-num" id="qtNum">${toAr(Q_SECS)}</b>
  </span>`;
}

const CHECK_BADGE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 6.8"/></svg>`;

let toastT = null;
function toast(msg, kind) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div"); t.id = "toast";
    t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite");
    document.body.appendChild(t);
  }
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
  noteAnswer(q, false);
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
  fb.innerHTML = `<div class="fb-head"><span class="fb-x fb-clock">${TIMER_SVG}</span> انتهى الوقت!</div>
    <div class="fb-correct">الإجابة الصحيحة: ${correctTxt}</div>
    <button class="fb-solution-toggle" onclick="A.toggleSol()">اعرض الحل</button>
    <div class="fb-solution" id="sol" style="display:none">${formatExplain(q.solution)}</div>
    <button class="btn btn-red" onclick="A.next()">متابعة</button>`;
  clearFeedbackOverlap();
  save();
}

A.pick = function (i) {
  if (SES.locked) return;
  const btn = document.querySelector(`.choice[data-ci="${i}"]`);
  if (btn && btn.classList.contains("eliminated")) return; // can't pick a removed choice
  SES.sel = i;
  document.querySelectorAll(".choice").forEach((b, j) => b.classList.toggle("sel", j === i));
  const cb = document.getElementById("checkBtn"); if (cb) cb.disabled = false;
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
  noteAnswer(q, correct);
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
    playCorrect();                       // the recorded chime, unchanged
    SES.run = (SES.run || 0) + 1;        // consecutive correct: 3 lights gold, 5 lights blue
    SES.done++;
    // rank XP / gems. Replaying a finished lesson pays a flat +2/+2 (farmable,
    // unlimited); a fresh clear pays full first-try (10/5) or retry (5/2).
    /* The old rule was a per-lesson flag: once a lesson had a star, every
       question in it paid a flat 2/2 forever. Because selection serves easy
       first, that meant the 185 hardest questions in the bank were only ever
       reachable in a "replay" session and so were worth a sixth of the easy
       ones. Pay per question, by difficulty, and decay only what this player
       has personally already got right. */
    const seenBefore = (S.qstats[q.id] || {}).r > 0;
    if (seenBefore || SES.retried[q.id]) { SES.xp += 3; SES.gems += 2; }
    else { const d = q.difficulty || 2; SES.xp += [0, 6, 10, 16][d] || 10; SES.gems += [0, 3, 5, 8][d] || 5; }
    fb.className = "feedback good show has-crest";
    fb.innerHTML = `<svg class="fb-crest" viewBox="0 0 380 90" preserveAspectRatio="none" aria-hidden="true">
        <path class="fb-crest-fill"></path>
        <path class="fb-crest-line" fill="none" stroke-width="4" vector-effect="non-scaling-stroke" stroke-linecap="round"></path>
      </svg><div class="fb-head"><span class="fb-ok">${CHECK_BADGE}</span> أحسنت!</div>
      <button class="fb-solution-toggle" onclick="A.toggleSol()">لماذا؟ اعرض الحل</button>
      <div class="fb-solution" id="sol" style="display:none">${formatExplain(q.solution)}</div>
      <button class="btn" onclick="A.next()">متابعة</button>`;
    /* after the sheet exists, never before: the timeline slides the sheet and
       animates the crest inside it, so both have to be in the DOM when it is
       built. Same synchronous block, so nothing paints in between. */
    answerFx(document.querySelector(`.choice[data-ci="${q.answer}"]`), SES.run);
    clearFeedbackOverlap();
  } else {
    sndBad();
    SES.run = 0;                         // one miss and the run is gone
    SES.retried[q.id] = true;
    SES.queue.push(q); // Duolingo behavior: wrong question comes back at the end
    loseHeart();
    fb.className = "feedback bad show";
    /* the heart counter lives in the opposite corner from where the eye is, so
       the cost has to be stated here, and the last heart has to be a warning */
    const hLeft = SES.hearts;
    const heartLine = hLeft === 0
      ? `<div class="fb-hearts out">${ico("heart", 15)} لم يتبقَّ لك قلوب</div>`
      : hLeft === 1
        ? `<div class="fb-hearts warn">${ico("heart", 15)} باقٍ لك قلب واحد — ركّز</div>`
        : `<div class="fb-hearts">${ico("heart", 15)} باقٍ لك ${toAr(hLeft)} من القلوب</div>`;
    /* the solution used to be collapsed, under a full-width متابعة. The default
       path through a wrong answer taught the letter, not the maths. */
    fb.innerHTML = `<div class="fb-head"><span class="fb-x">✕</span> إجابة غير صحيحة</div>
      ${heartLine}
      <div class="fb-correct">الإجابة الصحيحة: ${correctTxt}</div>
      <div class="fb-solution" id="sol">${formatExplain(q.solution)}</div>
      <button class="btn btn-red" onclick="A.next()">${hLeft === 0 ? "شوف النتيجة" : "متابعة"}</button>`;
    /* after the sheet exists: the miss timeline slides it and snaps the cross */
    answerFxFail(document.querySelector(`.choice[data-ci="${SES.sel}"]`));
    clearFeedbackOverlap();
  }
  save();
};

A.toggleSol = function () {
  const s = document.getElementById("sol");
  s.style.display = s.style.display === "none" ? "block" : "none";
  clearFeedbackOverlap();
};

/* The feedback sheet is fixed to the bottom; without this it covers the very
   choices it is explaining. */
function clearFeedbackOverlap() {
  const fb = document.getElementById("fb"), qa = document.querySelector(".q-area");
  if (!fb || !qa || !fb.classList.contains("show")) return;
  requestAnimationFrame(() => {
    const h = fb.offsetHeight;
    qa.style.paddingBottom = (h + 24) + "px";
    const focus = document.querySelector(".choice.correct") || document.querySelector(".choice.wrong");
    if (!focus) return;
    const limit = window.innerHeight - h - 14;
    const bottom = focus.getBoundingClientRect().bottom;
    if (bottom > limit) window.scrollBy({ top: bottom - limit, behavior: "smooth" });
  });
}

/* Method sheet (كيف أحلّها؟): teacher walks through how to approach THIS
   specific question — its own numbers, its own steps — but stops short of the
   final answer so the student still solves it. Falls back to the lesson-level
   method only if a question has no per-question hint. Slides up Duolingo-style. */
A.showMethod = function () {
  if (!SES) return;
  stopQTimer();          // the sheet covers the clock; do not charge for reading
  const cur = SES.queue && SES.queue[SES.idx];
  const method = (cur && cur.method) || SES.method;
  if (!method) return;
  const old = document.querySelector(".method-veil"); if (old) old.remove();
  const veil = document.createElement("div");
  veil.className = "method-veil";
  veil.innerHTML = `<div class="method-sheet">
    <div class="ms-grip"></div>
    <div class="ms-head"><span class="ms-bulb">${BULB_SVG}</span><h3>كيف أحلّها؟</h3></div>
    <div class="ms-sub">⏸ الوقت متوقف — خذ راحتك. خطوات حلّ هذا السؤال بالذات 👇</div>
    <div class="ms-body">${formatExplain(method)}</div>
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
  if (SES && !SES.locked && SES.left > 0) startQTimer(true);   // resume, never reset
};

A.debugCurrent = function () { return SES && SES.queue[SES.idx]; }; // dev harness (preview.html) only
A.debugRun = function () { return SES ? (SES.run || 0) : 0; };                    // dev harness only
A.debugRankUp = function (i) { showRankUp(i); };                    // dev harness only
A.debugDaily = function () { return DQ_PICK; };                     // dev harness only
A.debugPool = function () {                                         // dev harness only
  const pool = [];
  domains().forEach(d => d.lessons.forEach(l => trackFilter(l.questions).forEach(q => {
    if (q.format === "mcq" && q.stem) pool.push(q);
  })));
  return { domains: domains().length, lessons: domains().reduce((a,d)=>a+d.lessons.length,0),
           pool: pool.length, track: S.track, dailyQ: JSON.stringify(S.dailyQ), pick: !!pickDailyQuestion() };
};
A.debugEarn = function (n) { gainXP(n); gainGems(n); save(); render(); };        // dev harness only
A.debugMock = function () { return MOCK && MOCK.sections[MOCK.si].items[MOCK.qi].q; }; // dev harness only

A.next = function () {
  if (SES.mode !== "review" && SES.hearts <= 0) { sessionFailed(); return; }
  SES.idx++; SES.sel = null; SES.locked = false;
  if (SES.done >= SES.total || SES.idx >= SES.queue.length) {
    SES.mode === "review" ? reviewComplete() : lessonComplete();
    return;
  }
  renderSession();
};

A.quitSession = function () {
  askConfirm("تبي توقف الدرس؟", "تقدمك في هذا الدرس ما راح ينحفظ.", "أكمل الدرس", "أوقف الدرس", () => {
    stopQTimer();
    if (SES && SES.xpBoost) { gainGems(BOOST_COST); save(); }   // the boost was never spent
    SES = null; go("path");
  });
};

A.retryLevel = function (domKey, lesKey) { A.startLesson(domKey, lesKey); };

function countUpTime(el, to) {
  const t0 = performance.now(), dur = 1200;
  (function f(t) {
    const p = Math.min(1, Math.max(0, (t - t0) / dur)), eased = 1 - Math.pow(1 - p, 3);
    const v = Math.round(to * eased);
    el.textContent = fmtTime(v);   // mm:ss, so it always reads as a clock
    if (p < 1) requestAnimationFrame(f);
  })(t0);
}

/* the encouragement has to match how far they actually got */
function failNote(done, total) {
  const p = total ? done / total : 0;
  if (p >= 0.75) return "كنت على وشك إنهائه!";
  if (p >= 0.4) return "قطعت نصف الطريق";
  return "خذها من البداية بهدوء";
}
function sessionFailed() {
  stopQTimer();
  /* the work was real even though the lesson was not cleared: banking it is
     what stops a first session ending in four minutes with nothing to show.
     Stars still require a clear, so this cannot be farmed. */
  gainXP(SES.xp); gainGems(SES.gems);
  if (SES.xpBoost) { gainGems(BOOST_COST); SES.xpBoost = false; }   // refund the unused boost
  bumpStreak(); save();
  const { domKey, lesKey, done, total, tSpent, tAnswered } = SES;
  const avgSecs = tAnswered ? Math.round(tSpent / tAnswered) : 0;
  sndLose();
  const canRevive = S.xp >= REVIVE_COST;
  $app.innerHTML = `<div class="screen screen-full"><div class="complete fail-scene" id="failComp">
    ${brokenHeartHero()}
    <h1 class="fail-title">نفدت القلوب!</h1>
    <p class="fail-sub">وصلت إلى ${toAr(done)} من ${toAr(total)} — ${failNote(done, total)}<br>${canRevive ? "استعد قلوبك بالجواهر وأكمل من حيث توقفت" : "أعد المستوى وحاول مجدداً"}</p>
    <div class="result-cards fail-cards">
      <div class="rcard rc-blue fail-time"><div class="rc-t">متوسط الوقت</div><div class="rc-v">${TIMER_SVG} <span id="cv-avg">${fmtTime(0)}</span></div></div>
      <div class="rcard rc-green"><div class="rc-t">التقدم</div><div class="rc-v">${ico("target", 22)} ${toAr(done)}/${toAr(total)}</div></div>
    </div>
    <div class="fail-actions">
      <button class="btn btn-revive" ${canRevive ? "" : "disabled"} onclick="A.reviveLesson()">${ico("gem", 20)} استعد قلوبك — ${toAr(REVIVE_COST)} جوهرة</button>
      ${canRevive ? "" : `<div class="fail-wallet">معك ${toAr(S.xp || 0)} جوهرة — اكسب المزيد من الدروس وصندوق اليوم</div>`}
      <button class="btn ${canRevive ? "btn-ghost" : ""}" onclick="A.retryLevel('${domKey}','${lesKey}')">إعادة المستوى</button>
      <button class="btn btn-ghost" onclick="A.quitFailed()">العودة للمسار</button>
    </div>
  </div></div>`;
  setTimeout(() => { const el = document.getElementById("cv-avg"); if (el) countUpTime(el, avgSecs); }, 2300);
  // NOTE: SES is kept alive so A.reviveLesson() can resume; the retry/quit buttons clear it.
}
/* Spend gems to refill all hearts and resume from where you failed. */
A.reviveLesson = function () {
  if (!SES || S.xp < REVIVE_COST) return;
  S.xp -= REVIVE_COST;
  /* A.next hands over to sessionFailed *before* advancing, so idx still points
     at the question that just ran the hearts out - and its correct answer is
     on screen behind the fail sheet. It is already re-queued at the tail, so
     step past it rather than handing it back as a free point. */
  SES.idx++;
  SES.hearts = LEVEL_HEARTS; SES.sel = null; SES.locked = false;
  save(); sndGood && sndGood();
  if (SES.idx >= SES.queue.length) { lessonComplete(); return; }
  renderSession();
};
A.quitFailed = function () { SES = null; A.go("path"); };

/* A true five-point star: sharp points, then a same-shape stroke on top to
   round every corner by half its width - the Duolingo star is chunky, not
   a blob. Drawn at 44x44 with room for the 5px rim. */
function lessonComplete() {
  stopQTimer();
  const ft = Object.values(SES.firstTry);
  const acc = ft.length ? Math.round(ft.filter(Boolean).length / ft.length * 100) : 0;
  const stars = acc === 100 ? 3 : acc >= 75 ? 2 : 1;
  const perfect = acc === 100;
  if (perfect && !SES.replay) { SES.xp += 20; SES.gems += 25; }   // perfect bonus only on a fresh clear
  const p = S.lessons[SES.key] = S.lessons[SES.key] || { stars: 0, plays: 0 };
  p.plays++; p.stars = Math.max(p.stars, stars);
  const rankGain = SES.xp * (SES.xpBoost ? 2 : 1);   // 2× boost doubles RANK XP only (gems unaffected)
  gainXP(rankGain); gainGems(SES.gems);
  const streakUp = bumpStreak(); save(); sndWin();
  pendingStreak = streakUp ? S.streak.count : 0;   // show the fire-streak celebration after this win screen
  const xpWon = rankGain, gemsWon = SES.gems, boosted = SES.xpBoost, tTot = SES.tSpent;
  const dayWord = S.streak.count === 1 ? "يوم واحد" : S.streak.count === 2 ? "يومان" : S.streak.count <= 10 ? toAr(S.streak.count) + " أيام" : toAr(S.streak.count) + " يوماً";
  $app.innerHTML = `<div class="screen screen-full"><div class="complete win-scene" id="comp">
    ${flameHero(115)}
    <h1 class="win-title">أكملت الدرس!</h1>
    <p class="win-sub">سلسلة ${dayWord}</p>
    <div class="win-gems">${ico("gem", 20)} +${toAr(gemsWon)} جوهرة${boosted ? ` · ⚡ الخبرة ×٢` : ""}</div>
    <div class="result-cards">
      <div class="rcard rc-gold"><div class="rc-t">الخبرة</div><div class="rc-v">${ico("lightning", 20)} <span id="cv-xp">٠</span></div></div>
      <div class="rcard rc-blue rc-time"><div class="rc-t">الوقت</div><div class="rc-v">${TIMER_SVG} <span id="cv-time">${fmtTime(0)}</span></div></div>
      <div class="rcard rc-green"><div class="rc-t">الدقة</div><div class="rc-v">${ico("target", 22)} <span id="cv-acc">٠</span></div></div>
    </div>
    <div class="action-bar win-action" style="position:relative;right:auto;transform:none;max-width:340px;padding:0;background:none">
      <button class="btn" onclick="A.winContinue()">متابعة</button>
    </div>
  </div></div>`;
  setTimeout(() => {
    const xpEl = document.getElementById("cv-xp"), accEl = document.getElementById("cv-acc"), tEl = document.getElementById("cv-time");
    if (xpEl) countUp(xpEl, xpWon); if (accEl) countUp(accEl, acc, "٪"); if (tEl) countUpTime(tEl, tTot);
  }, 700);
  SES = null;
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
      pools[k].slice(s * plan[i], (s + 1) * plan[i]).forEach(q => items.push({ q: shuffleChoices(q), dom: k }));
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
  /* a deadline, so backgrounding the tab cannot buy extra exam time */
  MOCK.sections[MOCK.si].endsAt = Date.now() + MOCK.sections[MOCK.si].left * 1000;
  MOCK.timer = setInterval(mockTick, 250);
}

function mockTick() {
  if (!MOCK || !MOCK.timer) return;
  const sec = MOCK.sections[MOCK.si];
  const left = Math.max(0, Math.round((sec.endsAt - Date.now()) / 1000));
  if (left === sec.left) return;
  sec.left = left;
  const n = document.getElementById("mkNum"), w = document.getElementById("mkWrap");
  if (n) n.textContent = fmtTime(left);
  if (w) { w.classList.toggle("low", left <= 120 && left > 30); w.classList.toggle("crit", left <= 30); }
  if (left <= 0) { toast("⏰ انتهى وقت القسم"); endMockSection(true); }
}

/* a backgrounded tab stops firing intervals; recompute the moment we return */
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  if (MOCK && MOCK.timer) mockTick();
  if (SES && SES.timer) qTick();
});

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
    <div class="screen screen-full screen-session">
      <div class="session-top">
        <button class="x-btn" onclick="A.quitMock()">${X_SVG}</button>
        <div class="mock-timer" id="mkWrap" aria-label="الوقت المتبقي في القسم">
          <span class="mk-clock">${CLOCK_SVG}</span>
          <b id="mkNum">${fmtTime(sec.left)}</b>
        </div>
        <span class="mock-count">القسم ${toAr(MOCK.si + 1)}/${toAr(MOCK.sections.length)}</span>
      </div>
      ${qnavStrip(sec)}
      <div class="q-area">${questionBody(q, sec.answers[MOCK.qi], false, "A.mockSelect")}</div>
      <div class="action-bar mock-bar">
        <button class="mk-flag ${sec.flags[MOCK.qi] ? "on" : ""}" onclick="A.mockFlag()" aria-label="علّم السؤال للمراجعة">⚑<span>${sec.flags[MOCK.qi] ? "معلّم" : "علّم"}</span></button>
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
  /* dailyTick used to fire here, so opening a mock, tapping ten answers and
     quitting paid out the 50-gem chest in about fifteen seconds. The quest
     counts sealed answers now - see endMockSection. */
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
  if (un) {
    askConfirm("إنهاء القسم؟", `لديك ${qCount(un)} بلا إجابة، وما تقدر ترجع للقسم بعد ما ينتهي.`,
      "راجع أسئلتي", "أنهِ القسم", () => endMockSection(false));
    return;
  }
  endMockSection(false);
};

/* seal the section into qstats — no going back, like the real exam */
function endMockSection(timedOut) {
  clearInterval(MOCK.timer);
  const sec = MOCK.sections[MOCK.si];
  sec.items.forEach((it, i) => {
    /* null means the student never reached it. Scoring that as wrong used to
       inject a whole timed-out section into the mistakes trainer and drag the
       mastery stats down for questions nobody had read. */
    if (sec.answers[i] === null) return;
    dailyTick();                       // counts toward today's quest, once sealed
    const qs = S.qstats[it.q.id] = S.qstats[it.q.id] || { r: 0, w: 0 };
    const ok = sec.answers[i] === it.q.answer;
    ok ? qs.r++ : qs.w++;
    noteAnswer(it.q, ok);
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
  askConfirm("تبي توقف المحاكاة؟", "النتيجة ما راح تُحسب.", "أكمل المحاكاة", "أوقف المحاكاة", () => {
    clearInterval(MOCK.timer); MOCK = null; go("mock");
  });
};

/* raw fraction -> standard score, piecewise through anchors that respect the
   25% guessing floor and the ~65 population mean */
function estScore(p) {
  const pts = [[0, 32], [0.25, 40], [0.5, 62], [0.65, 70], [0.75, 76], [0.85, 82], [0.92, 88], [1, 96]];
  for (let i = 1; i < pts.length; i++) {
    if (p <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      return y0 + (y1 - y0) * (p - x0) / (x1 - x0 || 1);
    }
  }
  return 96;
}

function finishMock(timedOut) {
  clearInterval(MOCK.timer);
  /* it used to award nothing at all, so two replay sessions in twelve minutes
     out-earned the single most exam-relevant thing in the product. Scaling
     with the score keeps it from being farmable by clicking through. */
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
  /* The old straight line put blind guessing at 51 and 75% raw at 84, which
     the band table then called "the top 5% of students". Anchored to the real
     distribution instead — mean ~65 — with a floor at the guessing rate. */
  const est = Math.round(estScore(score / (total || 1)));
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
  /* fifty minutes and forty-eight questions used to pay nothing at all, so
     two twelve-minute replay sessions out-earned the most exam-relevant
     thing in the app. Scaling with the score keeps it unfarmable. */
  gainXP(score * 6); gainGems(20 + score);
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
    <p class="win-sub">${unanswered ? `${qCount(unanswered)} بلا إجابة — ` : ""}السرعة والدقة معاً هما سر قدرات</p>
    <div class="result-cards">
      <div class="rcard rc-gold"><div class="rc-t">نتيجتك</div><div class="rc-v">${ico("star-gold", 20)} <span dir="ltr" class="frac"><span id="mv-score">٠</span>/${toAr(total)}</span></div></div>
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
    <div class="fb-solution" id="mdSol" style="display:none">${formatExplain(r.q.solution)}</div>
  </div>`;
};

/* ============================================================
   نظام المستويات (permanent rank system — no backend)
   A user's tier is the highest XP threshold their LIFETIME total
   (S.totalXp) has crossed; it never drops. The leaderboard shows a
   stable cohort of rivals within your tier ranked by total XP, with
   you placed by your own total. Crossing a threshold fires the
   full-screen rank-up celebration (showRankUp).
   ============================================================ */
function leagueStandings() {
  const ti = tierIndex();
  const tier = LEAGUE_TIERS[ti], next = LEAGUE_TIERS[ti + 1];
  const lo = tier.min, hi = next ? next.min : tier.min + 6000;
  let seed = (ti * 2654435761 + 999983) >>> 0; // stable cohort per tier
  const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
  const pool = LEAGUE_NAMES.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const list = pool.slice(0, 13).map(n => ({ name: n, xp: Math.round(lo + rnd() * (hi - lo) * 0.96), you: false }));
  list.push({ name: (S.user && S.user.name) || "أنت", xp: S.totalXp || 0, you: true });
  list.sort((a, b) => b.xp - a.xp || (a.you ? 1 : -1));
  return list;
}
const AVATAR_COLORS = ["#58CC02", "#1CB0F6", "#CE82FF", "#FF9600", "#FF4B4B", "#2BB0A6", "#A560E8"];
function avatarFor(name, you) {
  const c = you ? "#58CC02" : AVATAR_COLORS[(name.charCodeAt(0) + name.length) % AVATAR_COLORS.length];
  return `<span class="lb-av" style="background:${c}">${esc((name.trim()[0]) || "؟")}</span>`;
}
/* Podium medals for the top-3 leaderboard ranks (ribbon + gold/silver/bronze
   disc). The rank numeral is an inline <text> so it inherits the page's Baloo
   font and renders Arabic-Indic digits ١٢٣ (an <img>-loaded SVG can't reach the
   web font). Mirror copies live in assets/icons/ranks/medal-{1,2,3}.svg. */
const MEDAL_SVGS = [
  `<svg viewBox="0 0 41 42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.31177 18.4663H31.876V38.4086C31.876 39.844 30.4566 40.8481 29.1031 40.3701L20.0939 37.1888L11.0847 40.3701C9.73119 40.8481 8.31177 39.844 8.31177 38.4086V18.4663Z" fill="#FFC800"/><circle cx="20.0943" cy="20.0941" r="14.4004" transform="rotate(35.6401 20.0943 20.0941)" fill="#FFD900"/><path d="M11.7032 31.7972C18.1667 36.4314 27.1631 34.9486 31.7973 28.4851L8.39111 11.7031C3.75689 18.1666 5.23977 27.163 11.7032 31.7972Z" fill="#FEEA66"/><text x="20.0943" y="20.6" text-anchor="middle" dominant-baseline="central" font-size="18" fill="#FF9600">١</text><circle cx="20.0943" cy="20.0941" r="12.9004" transform="rotate(35.6401 20.0943 20.0941)" stroke="#FFC800" stroke-width="3"/></svg>`,
  `<svg viewBox="0 0 41 42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.31201 18.4663H31.8763V38.4086C31.8763 39.844 30.4569 40.8481 29.1033 40.3701L20.0941 37.1888L11.085 40.3701C9.73144 40.8481 8.31201 39.844 8.31201 38.4086V18.4663Z" fill="#AAC1D4"/><circle cx="20.0943" cy="20.0941" r="14.4004" transform="rotate(35.6401 20.0943 20.0941)" fill="#C2D1DD"/><path d="M11.7032 31.7972C18.1667 36.4314 27.1631 34.9486 31.7973 28.4851L8.39111 11.7031C3.75689 18.1666 5.23977 27.163 11.7032 31.7972Z" fill="#D6E4EF"/><text x="20.0943" y="20.6" text-anchor="middle" dominant-baseline="central" font-size="18" fill="#849FB5">٢</text><circle cx="20.0946" cy="20.0941" r="12.9004" transform="rotate(35.6401 20.0946 20.0941)" stroke="#AAC1D4" stroke-width="3"/></svg>`,
  `<svg viewBox="0 0 41 42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.31152 19.4663H31.8758V38.4086C31.8758 39.844 30.4564 40.8481 29.1029 40.3701L20.0937 37.1888L11.0845 40.3701C9.73095 40.8481 8.31152 39.844 8.31152 38.4086V19.4663Z" fill="#D7975D"/><circle cx="20.0941" cy="20.0941" r="14.4004" transform="rotate(35.6401 20.0941 20.0941)" fill="#E5AE7C"/><path d="M11.703 31.7972C18.1664 36.4314 27.1628 34.9486 31.7971 28.4851L8.39087 11.7031C3.75665 18.1666 5.23953 27.163 11.703 31.7972Z" fill="#F7BE8B"/><text x="20.0941" y="20.6" text-anchor="middle" dominant-baseline="central" font-size="18" fill="#CD7900">٣</text><circle cx="20.0941" cy="20.0941" r="12.9004" transform="rotate(35.6401 20.0941 20.0941)" stroke="#D7975D" stroke-width="3"/></svg>`
];
const MEDAL = i => `<span class="lb-medal">${MEDAL_SVGS[i - 1]}</span>`;
/* padlock for the locked tiers — colors stay visible behind a soft scrim */
const LOCK_SVG = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><rect x="4.7" y="10" width="14.6" height="11" rx="3.4" fill="#fff"/><circle cx="12" cy="14.7" r="1.7" fill="#4B4B4B"/><rect x="11" y="15.4" width="2" height="3.4" rx="1" fill="#4B4B4B"/></svg>`;

function renderLeague() {
  const ti = tierIndex(), tier = LEAGUE_TIERS[ti], next = LEAGUE_TIERS[ti + 1];
  const entries = leagueStandings();
  const myRank = entries.findIndex(e => e.you) + 1;
  const rows = entries.map((e, i) => {
    const rank = i + 1;
    const rankCell = rank <= 3 ? MEDAL(rank) : `<span class="lb-rank">${toAr(rank)}</span>`;
    return `<div class="lb-row ${e.you ? "me" : ""}">
      ${rankCell}${avatarFor(e.name, e.you)}
      <span class="lb-name">${esc(e.name)}${e.you ? " <b>(أنت)</b>" : ""}</span>
      <span class="lb-xp">${toAr(e.xp)} <i>XP</i></span>
    </div>`;
  }).join("");
  const ladder = LEAGUE_TIERS.map((t, i) => {
    const cls = i < ti ? "done" : i === ti ? "cur" : "locked";
    return `<div class="lb-tier ${cls} lb-tier-${t.key}">
      <div class="lb-tier-badge">${rankImg(t.key, 58)}${i > ti ? `<span class="lb-lock">${LOCK_SVG}</span>` : ""}${i === ti ? `<span class="lb-tier-glow"></span>` : ""}</div>
      <span>${t.name}</span>
    </div>`;
  }).join("");
  let prog;
  if (next) {
    const span = next.min - tier.min, into = Math.max(0, (S.totalXp || 0) - tier.min);
    const pct = Math.max(4, Math.min(100, Math.round(into / span * 100)));
    prog = `<div class="lb-prog">
      <div class="lb-prog-head"><span>${toAr(S.totalXp || 0)} / ${toAr(next.min)} خبرة</span><span class="lb-prog-next">${rankImg(next.key, 20)} المستوى ${next.name}</span></div>
      <div class="duo-bar"><i style="width:${pct}%;--bar-c:var(--gold);--bar-shine:var(--gold-shine);animation-delay:.3s"></i></div>
      <div class="lb-prog-sub">اكسب <b>${toAr(next.min - (S.totalXp || 0))}</b> خبرة للوصول إلى المستوى ${next.name}</div>
    </div>`;
  } else {
    prog = `<div class="lb-prog lb-prog-max">👑 وصلت إلى أعلى مستوى — أنت من الأبطال!</div>`;
  }
  $app.innerHTML = statbar() + `<div class="screen"><div class="page lb-page">
    <div class="lb-ladder">${ladder}</div>
    <div class="lb-hero">
      <h1 class="lb-title lb-title-${tier.key}">المستوى ${tier.name}</h1>
      <div class="lb-sub">مستواك دائم — تكسبه بالخبرة ولا ينخفض أبداً</div>
    </div>
    ${prog}
    <div class="lb-listhead">${ico("guide", 18)} المتصدّرون في مستواك</div>
    <div class="lb-list">${rows}</div>
    <div class="lb-foot">ترتيبك: <b>${toAr(myRank)}</b> من ${toAr(entries.length)} — ${myRank === 1 ? "أنت المتصدّر! 🏆" : "اكسب الخبرة لتتصدّر"}</div>
  </div></div>` + bottomnav("league");
}

/* ============================================================
   RANK-UP CELEBRATION — simulated, on a canvas.

   This screen used to be CSS @keyframes on a pile of divs. That is why it
   read as dated: a keyframe is a curve someone typed, every element runs on
   one shared clock, and alpha-blended divs stacked over each other go grey
   instead of getting brighter. None of it responds to anything.

   It is a simulation now, on the same principles the streak screen gets from
   its Rive runtime:

     · The shield ARRIVES BALLISTICALLY — real gravity, so it accelerates
       into frame and carries weight, instead of easing along a bezier.
     · IMPACT IS DETECTED, NOT SCHEDULED. The burst fires on the frame the
       shield touches down, and its strength comes from the actual landing
       speed. Nothing is timed to a magic millisecond, so it stays in sync
       at any refresh rate.
     · SQUASH COMES OUT OF THE VELOCITY, then springs back — the badge
       deforms because it is moving fast, which is the whole basis of
       character animation. It bounces once, small, and settles.
     · CONFETTI IS A PARTICLE SYSTEM: per-piece mass, air drag, gravity,
       three-axis tumble drawn with foreshortening so pieces turn edge-on
       and flash, plus a flutter force so they sway on the way down.
     · LIGHT IS ADDITIVE. Rays, bloom, flash and sparks composite with
       'lighter', so overlapping light adds the way light does. That single
       change is most of the difference between "glow" and "grey box".
     · Sparks are drawn as velocity streaks — real motion blur.

   Everything is delta-timed, so 60Hz and 120Hz look identical. The text and
   the button stay in the DOM: crisp, selectable, focusable.
   ============================================================ */

/* Neutral light for every tier — the overlay and its glow carry no hue, so
   nothing on this screen reads brown or orange but the badge art itself. */
const RU_PAL = {
  bronze:   { lite: [255, 255, 255], ray: [255, 255, 255], spark: [255, 255, 255] },
  silver:   { lite: [255, 255, 255], ray: [255, 255, 255], spark: [255, 255, 255] },
  gold:     { lite: [255, 255, 255], ray: [255, 255, 255], spark: [255, 255, 255] },
  diamond:  { lite: [255, 255, 255], ray: [255, 255, 255], spark: [255, 255, 255] },
  champion: { lite: [255, 255, 255], ray: [255, 255, 255], spark: [255, 255, 255] }
};
const RU_CONFETTI = ["#FFC800", "#1CB0F6", "#58CC02", "#FF4B4B", "#CE82FF", "#FF9600", "#FFFFFF"];

function ruScene(canvas, img, pal, reduced) {
  const ctx = canvas.getContext("2d");
  const S = {
    dpr: 1, w: 0, h: 0, cx: 0, cy: 0, bw: 0, bh: 0,
    t: 0, raf: 0, last: 0, dead: false,
    y: 0, vy: 0, scale: 0, sq: 0, sqv: 0, rot: 0, rotv: 0,
    landed: false, bounces: 0, energy: 0, shake: 0, flash: 0,
    burst: 0, rayA: 0, rayRot: 0, idle: 0,
    conf: [], sparks: [], rings: [],
    /* the shine pass and the company it keeps:
       shine   -1 = waiting, 0..1 = a band crossing the badge
       twk     twinkling stars that keep the badge alive once it has settled
       glints  big 4-point flares, fired by the impact and by each shine pass
       fall    speed lines, only while the badge is still coming down */
    shine: -1, shineWait: 0, twk: [], twkT: 0, glints: [], fall: [], fallT: 0,
    onBurst: null
  };

  const G = 3750;          // px/s^2 — tuned so the drop reads ~0.4s at phone height
  const rand = (a, b) => a + Math.random() * (b - a);

  /* Sized from the canvas's own box rather than the window. In the app the two
     are the same — the canvas is inset:0 inside a fixed, full-screen veil — but
     measuring the element keeps the scene correct anywhere it is mounted, and
     lets the exact same code run inside a framed preview. */
  S.measure = stageRect => {
    const dpr = S.dpr = Math.min(2, window.devicePixelRatio || 1);
    const box = canvas.getBoundingClientRect();
    const w = S.w = box.width, h = S.h = box.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S.cx = stageRect.left - box.left + stageRect.width / 2;
    S.cy = stageRect.top - box.top + stageRect.height / 2;
    S.bh = Math.min(stageRect.height, h * 0.26);
    S.bw = img.naturalWidth ? S.bh * (img.naturalWidth / img.naturalHeight) : S.bh * 0.92;
    /* The badge is composited through its own buffer so the shine band can be
       clipped to the artwork's alpha with source-atop. Done on the main canvas
       it would smear across the bloom and the rays behind it too. */
    if (!S.buf) S.buf = document.createElement("canvas");
    S.buf.width = Math.max(1, Math.round(S.bw * dpr));
    S.buf.height = Math.max(1, Math.round(S.bh * dpr));
  };

  /* --- the burst: everything that happens because the shield landed ----- */
  function burst(power) {
    S.burst = 1; S.flash = 1;
    S.shake = Math.min(26, power * 0.011);
    S.rings.push({ r: S.bh * .40, r0: S.bh * .40, rmax: S.bh * 1.75, v: 2000, wd: 9, a: 1 });
    S.rings.push({ r: S.bh * .26, r0: S.bh * .26, rmax: S.bh * 1.35, v: 1400, wd: 5, a: .7 });
    S.rings.push({ r: S.bh * .55, r0: S.bh * .55, rmax: S.bh * 2.45, v: 2600, wd: 3, a: .5 });

    /* the lens flare on the hit, then three thrown clear of it */
    S.glints.push({ x: S.cx, y: S.cy, r: S.bh * 1.05, life: 0, max: .52, rot: .0 });
    for (let i = 0; i < 3; i++) {
      const a = rand(0, 6.2832), rr = S.bh * rand(.7, 1.25);
      S.glints.push({
        x: S.cx + Math.cos(a) * rr, y: S.cy + Math.sin(a) * rr * .8,
        r: S.bh * rand(.16, .28), life: -rand(.05, .20), max: .52, rot: rand(0, 1.57)
      });
    }
    S.shine = -1; S.shineWait = .34;        // first pass lands just after the dust

    for (let i = 0; i < 30; i++) {                       // light streaks
      const a = (i / 30) * Math.PI * 2 + rand(-.08, .08), sp = rand(900, 1850);
      S.sparks.push({ x: S.cx, y: S.cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rand(.26, .42) });
    }
    for (let i = 0; i < 96; i++) {                       // confetti
      const a = (i / 96) * Math.PI * 2 + rand(-.12, .12), sp = rand(430, 1180);
      S.conf.push({
        x: S.cx + Math.cos(a) * S.bh * 0.6, y: S.cy + Math.sin(a) * S.bh * 0.6,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(60, 320),
        w: rand(7, 14), h: rand(10, 19), col: RU_CONFETTI[i % RU_CONFETTI.length],
        spin: rand(0, 6.28), spinV: rand(-13, 13),       // tumble about its own axis
        rot: rand(0, 6.28), rotV: rand(-7, 7),
        drag: rand(.78, .93), flut: rand(50, 190), life: 0, max: rand(2.4, 4.2)
      });
    }
    if (S.onBurst) S.onBurst();
  }

  function step(dt) {
    S.t += dt;

    if (!S.landed) {
      S.vy += G * dt;
      S.y += S.vy * dt;
      const p = Math.min(1, Math.max(0, 1 - (-S.y) / (S.h * 0.52)));
      S.scale = 0.26 + (1.14 - 0.26) * (p * p * (3 - 2 * p));     // approaches the camera
      S.rot = -0.34 * (1 - p);
      if (S.y >= 0) {                                             // TOUCHDOWN
        S.y = 0; S.landed = true; S.bounces = 1;
        S.energy = S.vy;
        S.sq = Math.min(.30, S.vy * 0.00013);                     // squash from real speed
        S.vy = -S.vy * 0.30;
        S.rotv = 2.2;
        burst(S.energy);
      }
    } else {
      // one small hop, then rest
      if (S.bounces < 4) {
        S.vy += G * 0.55 * dt;
        S.y += S.vy * dt;
        if (S.y >= 0) {
          S.y = 0; S.bounces++;
          S.sq = Math.min(.16, Math.abs(S.vy) * 0.00010);
          S.vy = -Math.abs(S.vy) * 0.26;
          if (Math.abs(S.vy) < 90) { S.vy = 0; S.bounces = 9; }
        }
      } else {
        S.idle += dt;                                             // settled: breathe
        S.y = Math.sin(S.idle * 1.5) * 5;
      }
      // squash springs back to zero and rings a couple of times
      const k = 520, c = 26;
      S.sqv += (-S.sq * k - S.sqv * c) * dt;
      S.sq += S.sqv * dt;
      S.scale += (1 - S.scale) * Math.min(1, dt * 16);
      S.rotv += (-S.rot * 150 - S.rotv * 15) * dt;
      S.rot += S.rotv * dt;
    }

    /* --- speed lines, only on the way down ----------------------------- */
    if (!S.landed) {
      S.fallT -= dt;
      if (S.fallT <= 0) {
        S.fallT = .016;
        S.fall.push({
          x: S.cx + rand(-S.bw * 1.15, S.bw * 1.15),
          y: S.cy + S.y - rand(0, S.h * .10),
          len: rand(38, 150), w: rand(.8, 2.6), life: 0, max: rand(.16, .34)
        });
      }
    }
    for (let i = S.fall.length - 1; i >= 0; i--) {
      const f = S.fall[i]; f.life += dt;
      if (f.life >= f.max) S.fall.splice(i, 1);
    }

    /* --- the shine pass, and the twinkles that keep it alive ------------- */
    if (S.landed) {
      if (S.shine >= 0) {
        const was = S.shine;
        S.shine += dt / .62;                         // one crossing, 620ms
        if (was < .5 && S.shine >= .5) {             // a small catch on the leading edge
          S.glints.push({
            x: S.cx + S.bw * .20, y: S.cy - S.bh * .26,
            r: S.bh * .20, life: 0, max: .40, rot: .5
          });
        }
        if (S.shine > 1) { S.shine = -1; S.shineWait = 2.1; }
      } else if ((S.shineWait -= dt) <= 0) {
        S.shine = 0;
      }

      S.twkT -= dt;
      if (S.twkT <= 0) {
        S.twkT = rand(.09, .25);
        const a = rand(0, 6.2832), rr = S.bh * rand(.52, 1.22);
        S.twk.push({
          x: S.cx + Math.cos(a) * rr, y: S.cy + Math.sin(a) * rr * .82,
          r: rand(3.5, 11), life: 0, max: rand(.5, 1.0), rot: rand(0, 1.57)
        });
      }
    }
    for (let i = S.twk.length - 1; i >= 0; i--) {
      const w = S.twk[i]; w.life += dt;
      if (w.life >= w.max) S.twk.splice(i, 1);
    }
    for (let i = S.glints.length - 1; i >= 0; i--) {
      const g = S.glints[i]; g.life += dt;
      if (g.life >= g.max) S.glints.splice(i, 1);
    }

    S.burst += (0 - S.burst) * Math.min(1, dt * 1.6);
    S.rayA += ((S.landed ? 1 : 0) - S.rayA) * Math.min(1, dt * 5);
    S.rayRot += dt * 0.09;
    S.flash = Math.max(0, S.flash - dt * 5.2);
    S.shake = Math.max(0, S.shake - dt * 62);

    for (let i = S.rings.length - 1; i >= 0; i--) {
      const r = S.rings[i];
      r.r += r.v * dt; r.v *= Math.pow(.12, dt);
      const k = (r.r - r.r0) / (r.rmax - r.r0);
      r.a = Math.max(0, 1 - k) ** 1.6;
      r.wd *= Math.pow(.2, dt);
      if (k >= 1) S.rings.splice(i, 1);
    }
    for (let i = S.sparks.length - 1; i >= 0; i--) {
      const s = S.sparks[i];
      s.life += dt;
      const d = Math.pow(.03, dt); s.vx *= d; s.vy *= d;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.life >= s.max) S.sparks.splice(i, 1);
    }
    for (let i = S.conf.length - 1; i >= 0; i--) {
      const p = S.conf[i];
      p.life += dt;
      const d = Math.pow(p.drag, dt);
      p.vx *= d; p.vy *= d;
      p.vy += 1450 * dt;                                          // gravity
      p.spin += p.spinV * dt;
      p.vx += Math.sin(p.spin) * p.flut * dt;                     // flutter as it tumbles
      p.rot += p.rotV * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life >= p.max || p.y > S.h + 60) S.conf.splice(i, 1);
    }
  }

  /* A concave four-point star. Two crossed quadratics per arm give the pinch
     at the waist that makes it read as light rather than as a plus sign. */
  function sparkle(c, x, y, r, a, rot) {
    if (a <= .004 || r <= .2) return;
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    const t = r * .15;
    c.beginPath();
    c.moveTo(0, -r);
    c.quadraticCurveTo(t, -t, r, 0);
    c.quadraticCurveTo(t, t, 0, r);
    c.quadraticCurveTo(-t, t, -r, 0);
    c.quadraticCurveTo(-t, -t, 0, -r);
    c.closePath();
    c.fillStyle = `rgba(255,255,255,${a})`;
    c.fill();
    c.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, S.w, S.h);
    const shx = S.shake ? (Math.random() - .5) * S.shake : 0;
    const shy = S.shake ? (Math.random() - .5) * S.shake : 0;
    ctx.save();
    ctx.translate(shx, shy);

    const L = pal.lite, R = pal.ray, K = pal.spark;
    ctx.globalCompositeOperation = "lighter";

    // sunburst — one path of wedges, one radial gradient, added not stacked
    if (S.rayA > .01) {
      // a halo hugging the shield that flares on impact, not a wallpaper.
      // constant angular width, so the wedges taper inward like light does.
      const r0 = S.bh * .34, r1 = S.bh * (1.05 + S.burst * .55), n = 22, hw = .030;
      const al = S.rayA * (.17 + S.burst * .25);
      const g = ctx.createRadialGradient(S.cx, S.cy, r0, S.cx, S.cy, r1);
      g.addColorStop(0, `rgba(${R[0]},${R[1]},${R[2]},0)`);
      g.addColorStop(.34, `rgba(${R[0]},${R[1]},${R[2]},${al})`);
      g.addColorStop(1, `rgba(${R[0]},${R[1]},${R[2]},0)`);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = S.rayRot + (i / n) * Math.PI * 2;
        ctx.moveTo(S.cx + Math.cos(a - hw) * r0, S.cy + Math.sin(a - hw) * r0);
        ctx.lineTo(S.cx + Math.cos(a - hw) * r1, S.cy + Math.sin(a - hw) * r1);
        ctx.lineTo(S.cx + Math.cos(a + hw) * r1, S.cy + Math.sin(a + hw) * r1);
        ctx.lineTo(S.cx + Math.cos(a + hw) * r0, S.cy + Math.sin(a + hw) * r0);
        ctx.closePath();
      }
      ctx.fillStyle = g; ctx.fill();
    }

    // bloom behind the shield, brighter for a moment right after impact
    const br = S.bh * (1.05 + S.burst * .5), ba = (.34 + S.burst * .5) * S.rayA;
    if (ba > .01) {
      const g = ctx.createRadialGradient(S.cx, S.cy, 0, S.cx, S.cy, br);
      g.addColorStop(0, `rgba(${L[0]},${L[1]},${L[2]},${ba})`);
      g.addColorStop(.5, `rgba(${L[0]},${L[1]},${L[2]},${ba * .28})`);
      g.addColorStop(1, `rgba(${L[0]},${L[1]},${L[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(S.cx, S.cy, br, 0, 6.2832); ctx.fill();
    }

    // shockwaves
    for (const r of S.rings) {
      ctx.beginPath(); ctx.arc(S.cx, S.cy, r.r, 0, 6.2832);
      ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, r.a) * .75})`;
      ctx.lineWidth = Math.max(.5, r.wd); ctx.stroke();
    }

    // white flash
    if (S.flash > .01) {
      const fr = S.bh * (1 + (1 - S.flash) * 2.6);
      const g = ctx.createRadialGradient(S.cx, S.cy, 0, S.cx, S.cy, fr);
      g.addColorStop(0, `rgba(255,255,255,${S.flash * .8})`);
      g.addColorStop(.45, `rgba(${L[0]},${L[1]},${L[2]},${S.flash * .35})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(S.cx, S.cy, fr, 0, 6.2832); ctx.fill();
    }

    // speed lines: the badge is falling past them, so they sell the drop
    for (const f of S.fall) {
      const k = 1 - f.life / f.max;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y); ctx.lineTo(f.x, f.y - f.len);
      ctx.strokeStyle = `rgba(255,255,255,${k * .30})`;
      ctx.lineWidth = f.w; ctx.stroke();
    }

    // spark streaks — drawn along the velocity vector, which IS motion blur
    ctx.lineCap = "round";
    for (const s of S.sparks) {
      const k = 1 - s.life / s.max;
      ctx.beginPath();
      ctx.moveTo(s.x - s.vx * .022, s.y - s.vy * .022);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = `rgba(${K[0]},${K[1]},${K[2]},${k * .9})`;
      ctx.lineWidth = 1 + k * 4.5; ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";

    // the shield, composited through its own buffer so the shine can clip to it
    if (img.complete && img.naturalWidth && S.buf) {
      const b = S.buf, bc = b.getContext("2d");
      bc.setTransform(1, 0, 0, 1, 0, 0);
      bc.clearRect(0, 0, b.width, b.height);
      bc.drawImage(img, 0, 0, b.width, b.height);
      if (S.shine >= 0) {
        /* a diagonal band travelling across the artwork. source-atop keeps it
           inside the badge's own alpha, so it lights the metal and not the
           empty corners of its box. */
        const p = S.shine, span = b.width * 2.1;
        const x0 = -b.width * .55 + p * span;
        const g = bc.createLinearGradient(x0, 0, x0 + b.width * .42, b.height);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(.42, "rgba(255,255,255,.10)");
        g.addColorStop(.5, `rgba(255,255,255,${.72 * Math.sin(Math.PI * Math.min(1, p))})`);
        g.addColorStop(.58, "rgba(255,255,255,.10)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        bc.globalCompositeOperation = "source-atop";
        bc.fillStyle = g; bc.fillRect(0, 0, b.width, b.height);
        bc.globalCompositeOperation = "source-over";
      }
      const sx = (1 + S.sq) * S.scale, sy = (1 - S.sq * .85) * S.scale;
      ctx.save();
      ctx.translate(S.cx, S.cy + S.y + S.bh * .5 * (1 - sy));   // squash from the feet
      ctx.rotate(S.rot); ctx.scale(sx, sy);
      ctx.shadowColor = "rgba(0,0,0,.42)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 18;
      ctx.drawImage(b, -S.bw / 2, -S.bh / 2, S.bw, S.bh);
      ctx.restore();
    }

    // twinkles and flares ride ON TOP of the badge, so they read as light on it
    ctx.globalCompositeOperation = "lighter";
    for (const w of S.twk) {
      const k = Math.sin(Math.PI * (w.life / w.max));          // in and back out
      sparkle(ctx, w.x, w.y, w.r * (.45 + k * .55), k * .85, w.rot);
    }
    for (const g of S.glints) {
      if (g.life < 0) continue;                                // still on its delay
      const k = 1 - g.life / g.max, e = k * k;
      sparkle(ctx, g.x, g.y, g.r * (.5 + (1 - k) * .9), e * .9, g.rot);
      sparkle(ctx, g.x, g.y, g.r * (.28 + (1 - k) * .5), e * .8, (g.rot || 0) + .785);
    }
    ctx.globalCompositeOperation = "source-over";

    // confetti — foreshortened as it tumbles, so pieces turn edge-on and flash
    for (const p of S.conf) {
      const face = Math.cos(p.spin), fade = Math.min(1, (p.max - p.life) / .6);
      const w = p.w * Math.abs(face);
      if (w < .35) continue;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = fade * (face < 0 ? .62 : 1);            // back face reads darker
      ctx.fillStyle = p.col;
      ctx.fillRect(-w / 2, -p.h / 2, w, p.h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  S.redraw = draw;
  S.frame = now => {
    if (S.dead) return;
    const dt = Math.min(.05, (now - S.last) / 1000 || 0);
    S.last = now;
    step(dt); draw();
    S.raf = requestAnimationFrame(S.frame);
  };
  S.start = () => {
    S.y = -S.h * .52; S.vy = 300; S.last = performance.now();
    if (reduced) {                                   // no simulation: compose the rest pose
      S.y = 0; S.vy = 0; S.scale = 1; S.landed = true; S.bounces = 9;
      S.rayA = 1; S.burst = 0; S.flash = 0; S.still = true;
      S.shine = .5;                    // one frame, caught at the top of the pass
      if (S.onBurst) S.onBurst();
      draw();
      return;
    }
    S.raf = requestAnimationFrame(S.frame);
  };
  S.stop = () => { S.dead = true; cancelAnimationFrame(S.raf); };
  return S;
}

function showRankUp(tierIdx) {
  const tier = LEAGUE_TIERS[tierIdx];
  if (!tier) return;
  const reduced = motionReduced();
  const veil = document.createElement("div");
  veil.className = `rankup-veil ru-${tier.key}`;
  veil.innerHTML = `
    <canvas class="ru-canvas" aria-hidden="true"></canvas>
    <div class="ru-main">
      <div class="ru-stage" aria-hidden="true"></div>
      <div class="ru-kicker">ترقّيت إلى مستوى جديد</div>
      <h1 class="ru-title">المستوى ${tier.name}</h1>
      <p class="ru-sub">واصل التدريب — كل سؤال يقرّبك من القمة 💪</p>
    </div>
    <div class="ru-foot"><button class="btn" onclick="A.closeRankUp()">رائع، أكمل!</button></div>`;
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));

  const img = new Image();
  img.src = `assets/icons/ranks/rank-${tier.key}.png`;
  const scene = ruScene(veil.querySelector(".ru-canvas"), img, RU_PAL[tier.key] || RU_PAL.gold, reduced);
  veil._ruScene = scene;

  /* the copy is revealed by the landing, not by a timer that hopes to agree
     with one — the same event that fires the burst releases the text */
  scene.onBurst = () => { sndRankUp(); veil.classList.add("told"); };

  const fit = () => {
    scene.measure(veil.querySelector(".ru-stage").getBoundingClientRect());
    if (scene.still) scene.redraw();      // reduced motion draws once — repaint it
  };
  scene.onResize = fit;
  window.addEventListener("resize", fit);
  veil._ruFit = fit;

  const go = () => { fit(); scene.start(); };
  if (img.complete && img.naturalWidth) go();
  else { img.onload = go; img.onerror = go; }
}
A.closeRankUp = function () {
  const v = document.querySelector(".rankup-veil");
  if (!v) return;
  if (v._ruScene) v._ruScene.stop();
  if (v._ruFit) window.removeEventListener("resize", v._ruFit);
  v.classList.add("out");
  setTimeout(() => { v.remove(); render(); }, 360);
};

/* ============================================================
   FIRE-STREAK CELEBRATION — Duolingo's real shipped Rive flame + rolling
   odometer + Lottie day-check pops (assets in assets/streak/). Plays once
   when the daily streak advances (first lesson of a new day), then the user
   taps متابعة. Runtimes are lazy-loaded only when this first plays.
   Asset contracts per duolingo-fire-streak/HANDOFF.md.
   ============================================================ */
const STREAK_WK = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];   // Sun..Sat (getDay index)
let streakLibsP = null, streakInst = { flame: null, num: null, checks: [], onDone: null };

function loadStreakLibs() {
  if (streakLibsP) return streakLibsP;
  streakLibsP = new Promise((resolve, reject) => {
    let need = 2;
    const done = () => { if (--need === 0) { try { rive.RuntimeLoader.setWasmUrl("assets/streak/rive.wasm"); } catch (e) {} resolve(); } };
    const add = src => { const s = document.createElement("script"); s.src = src; s.onload = done; s.onerror = () => reject(new Error("load " + src)); document.head.appendChild(s); };
    add("assets/streak/rive.js"); add("assets/streak/lottie.min.js");
  });
  return streakLibsP;
}
/* Pre-warm the streak runtimes + assets in the background (called when a lesson
   starts) so the celebration appears instantly at lesson end instead of waiting
   ~2s for the Rive WASM to fetch + compile. Idempotent and non-blocking. */
let streakWarmed = false;
function warmStreak() {
  if (streakWarmed) return;
  streakWarmed = true;
  loadStreakLibs().then(() => {
    try {
      if (rive.RuntimeLoader.awaitInstance) rive.RuntimeLoader.awaitInstance();        // compile WASM ahead of time
      else if (rive.RuntimeLoader.getInstance) rive.RuntimeLoader.getInstance(() => {});
    } catch (e) {}
  }).catch(() => { streakWarmed = false; });
  ["assets/streak/rive.wasm", "assets/streak/big.riv", "assets/streak/flame.riv", "assets/streak/daycheck.json"]
    .forEach(u => { try { fetch(u).catch(() => {}); } catch (e) {} });   // warm the HTTP cache (wasm is the big one)
}
function setOdo(g, prefix, value) {            // drive the odometer digits (pos1 = rightmost)
  const s = String(Math.max(0, value)), d = s.length;
  for (let p = 1; p <= 4; p++) { const i = g(prefix + "_pos" + p + "_num"); if (i) i.value = p <= d ? +s[d - p] : 0; }
  const da = g(prefix + "_digitamount_num"); if (da) da.value = d;
}
function streakDayLabel(c) {
  const word = c === 1 ? "يوم واحد" : c === 2 ? "يومان" : c <= 10 ? toAr(c) + " أيام" : toAr(c) + " يوماً";
  return word + " من الحماس";
}
A.winContinue = function () {
  if (pendingStreak > 0) { const c = pendingStreak; pendingStreak = 0; showStreakCelebration(c, () => A.go("path")); }
  else A.go("path");
};
function showStreakCelebration(count, onDone) {
  const todayIdx = new Date().getDay();
  const days = STREAK_WK.map((lbl, d) => {
    const checked = d <= todayIdx && (todayIdx - d) < count;     // today + prior streak days within this week
    return `<div class="day"><span class="lbl">${lbl}</span><div class="dot ${checked ? "live" : ""}">${checked ? `<div class="check" data-check></div>` : ""}</div></div>`;
  }).join("");
  const veil = document.createElement("div");
  veil.className = "streak-veil";
  veil.innerHTML = `<div class="streak-scene">
    <div class="sk-flame"><canvas id="skFlame" width="400" height="400"></canvas></div>
    <div class="sk-num"><canvas id="skNum" width="300" height="260"></canvas></div>
    <div class="sk-sub" id="skSub">${streakDayLabel(count)}</div>
    <div class="sk-cal" id="skCal"><div class="sk-days">${days}</div></div>
    <button class="btn sk-btn" onclick="A.closeStreak()">متابعة</button>
  </div>`;
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));
  const sub = veil.querySelector("#skSub"), cal = veil.querySelector("#skCal");
  streakInst = { flame: null, num: null, checks: [], flameIns: null, numIns: null, onDone, ran: false };
  sndWin && sndWin();

  function tryRun() {
    if (streakInst.ran || !streakInst.flameIns || !streakInst.numIns) return;
    streakInst.ran = true;
    const fireI = (ins, n) => { const i = ins.find(x => x.name === n); if (i) i.fire(); };
    fireI(streakInst.flameIns, "play_trig");                          // flame ignites
    const g = n => streakInst.numIns.find(i => i.name === n);
    setOdo(g, "old", Math.max(0, count - 1)); setOdo(g, "new", count);
    fireI(streakInst.numIns, "play_trig");                            // number rolls up to the streak
    setTimeout(() => {
      sub.classList.add("show"); cal.classList.add("show");
      streakInst.checks.forEach((a, i) => setTimeout(() => a.goToAndPlay(0, true), 280 + i * 150));
    }, 1300);
  }

  loadStreakLibs().then(() => {
    streakInst.flame = new rive.Rive({
      src: "assets/streak/big.riv", canvas: veil.querySelector("#skFlame"),
      artboard: "IDLE", stateMachines: "State Machine", autoplay: true,
      onLoad: () => {
        streakInst.flame.resizeDrawingSurfaceToCanvas();
        const ins = streakInst.flame.stateMachineInputs("State Machine"), g = n => ins.find(i => i.name === n);
        g("darkmode_bool").value = false; g("streakselect_num").value = 0;   // light UI
        streakInst.flameIns = ins; tryRun();
      }
    });
    streakInst.num = new rive.Rive({
      src: "assets/streak/flame.riv", canvas: veil.querySelector("#skNum"),
      artboard: "Main", stateMachines: "odometer_state_machine", autoplay: true,
      onLoad: () => {
        streakInst.num.resizeDrawingSurfaceToCanvas();
        const ins = streakInst.num.stateMachineInputs("odometer_state_machine"), g = n => ins.find(i => i.name === n);
        g("dark_bool").value = false; g("perfect_bool").value = false; g("blue_bool").value = false;   // light UI
        setOdo(g, "new", count); setOdo(g, "old", Math.max(0, count - 1));
        streakInst.numIns = ins; tryRun();
      }
    });
    fetch("assets/streak/daycheck.json").then(r => r.json()).then(data => {
      streakInst.checks = [...veil.querySelectorAll("[data-check]")].map(el => lottie.loadAnimation({
        container: el, renderer: "svg", loop: false, autoplay: false,
        animationData: JSON.parse(JSON.stringify(data)), rendererSettings: { preserveAspectRatio: "xMidYMid meet" }
      }));
    }).catch(() => {});
  }).catch(() => { /* runtime failed to load — leave the static text/days visible */
    sub.classList.add("show"); cal.classList.add("show");
  });
}
A.closeStreak = function () {
  const v = document.querySelector(".streak-veil"), done = streakInst.onDone;
  try {
    streakInst.flame && streakInst.flame.cleanup();
    streakInst.num && streakInst.num.cleanup();
    streakInst.checks.forEach(a => a.destroy());
  } catch (e) {}
  streakInst = { flame: null, num: null, checks: [], onDone: null };
  // Render the destination (the path) UNDERNEATH the overlay first, then fade the
  // overlay out — so it reveals the path, never the lesson-complete screen behind it.
  (done || render)();
  if (v) { v.classList.add("out"); setTimeout(() => v.remove(), 320); }
};
A.debugStreak = function (c) { showStreakCelebration(c || S.streak.count || 7, () => A.go("path")); };   // dev harness only

/* ============================================================
   مراجعة الأخطاء (review your mistakes) — lists every question you
   got wrong and still hasn't re-mastered, and can re-quiz only those.
   Getting one right (anywhere) clears it from the list.
   ============================================================ */
A.startReview = function () {
  const list = mistakeList();
  if (!list.length) { toast("✨ لا توجد أخطاء للمراجعة"); return; }
  const qs = list.slice(0, 12).map(x => shuffleChoices(x.rec.q));
  SES = { mode: "review", domKey: null, lesKey: null, key: null, title: "مراجعة الأخطاء", method: "",
    queue: qs.slice(), total: qs.length, idx: 0, done: 0, firstTry: {}, retried: {}, sel: null,
    locked: false, xp: 0, gems: 0, replay: false, xpBoost: false, hearts: 999, left: Q_SECS, timer: null, tSpent: 0, tAnswered: 0 };
  renderSession();
};

function reviewComplete() {
  stopQTimer();
  const solved = SES.done, xpWon = SES.xp;
  gainXP(xpWon); gainGems(SES.gems); bumpStreak(); save(); sndWin();
  const remaining = mistakeList().length;
  $app.innerHTML = `<div class="screen screen-full"><div class="complete win-scene" id="comp">
    ${flameHero(160)}
    <h1 class="win-title">أحسنت!</h1>
    <p class="win-sub">${remaining ? `صحّحت ${arPlural(solved, "خطأً واحداً", "خطأين", "أخطاء", "خطأً")} — باقٍ ${toAr(remaining)} للمراجعة` : "راجعت كل أخطائك — قائمتك نظيفة! 🎉"}</p>
    <div class="result-cards">
      <div class="rcard rc-gold"><div class="rc-t">الخبرة</div><div class="rc-v">${ico("lightning", 20)} <span id="cv-xp">٠</span></div></div>
      <div class="rcard rc-green"><div class="rc-t">صُحّحت</div><div class="rc-v">${ico("target", 22)} ${toAr(solved)}</div></div>
    </div>
    <div class="action-bar win-action" style="position:relative;right:auto;transform:none;max-width:340px;padding:0;background:none">
      ${remaining ? `<button class="btn" onclick="A.startReview()">واصل المراجعة</button>
      <button class="btn btn-ghost" onclick="A.go('review')">رجوع</button>`
        : `<button class="btn" onclick="A.go('path')">متابعة</button>`}
    </div>
  </div></div>`;
  setTimeout(() => { const x = document.getElementById("cv-xp"); if (x) countUp(x, xpWon); }, 700);
  SES = null;
}

/* the arrow used to always land on stats even when you arrived from the path */
let reviewFrom = "path";
function renderReview() {
  const list = mistakeList();
  if (!list.length) {
    $app.innerHTML = statbar() + `<div class="screen"><div class="page">
      <div class="rv-top"><button class="rv-back" onclick="A.go(reviewFrom)" aria-label="رجوع">→</button><h1>مراجعة الأخطاء</h1></div>
      <div class="rv-empty">
        <div class="rv-checkhero"><span class="rvc-glow"></span><span class="rvc-disc">${CHECK_BADGE}</span></div>
        <h2>لا أخطاء للمراجعة</h2>
        <p>كل أسئلتك صحيحة حتى الآن — واصل التدريب وستظهر هنا أي أسئلة تخطئ فيها لتراجعها.</p>
        <button class="btn" onclick="A.go('path')">ابدأ درساً</button>
      </div>
    </div></div>` + bottomnav("review");
    return;
  }
  const items = list.map((x, i) => {
    const q = x.rec.q, isCmp = q.format === "comparison";
    const ch = isCmp ? CMP_CHOICES : q.choices;
    const u = UNIT_COLORS[x.rec.color] || UNIT_COLORS.purple;
    return `<div class="review-item" style="--d:${(0.05 + i * 0.04).toFixed(2)}s">
      <div class="ri-tag" style="color:${u.s}">${esc(x.rec.domTitle)} · ${esc(x.rec.lesTitle)}</div>
      <div class="ri-q">${q.stem || "قارن بين القيمتين"}</div>
      ${isCmp && q.value1 ? `<div class="ri-row" style="color:var(--gray)">القيمة الأولى: ${q.value1} — القيمة الثانية: ${q.value2}</div>` : ""}
      <button class="fb-solution-toggle" onclick="A.toggleEl('rvAns${i}')">أظهر الإجابة</button>
      <div class="ri-row" id="rvAns${i}" style="display:none;color:var(--green-dk)">✓ الإجابة الصحيحة: ${ch[q.answer]}</div>
      <button class="fb-solution-toggle" onclick="A.toggleEl('rvSol${i}')">اعرض الحل</button>
      <div class="fb-solution" id="rvSol${i}" style="display:none">${formatExplain(q.solution)}</div>
    </div>`;
  }).join("");
  $app.innerHTML = statbar() + `<div class="screen"><div class="page">
    <div class="rv-top"><button class="rv-back" onclick="A.go(reviewFrom)" aria-label="رجوع">→</button><h1>مراجعة الأخطاء</h1></div>
    <div class="sub">${qCount(list.length)} بحاجة لمراجعة — تدرّب عليها حتى تتقنها</div>
    <button class="btn rv-practice" onclick="A.startReview()">${ico("target", 22)} تدرّب على أخطائك${list.length > 12 ? ` (${toAr(12)})` : ""}</button>
    <div class="rv-list">${items}</div>
  </div></div>` + bottomnav("review");
}

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
    return `<button class="dom-stat" onclick="A.goUnit('${d.key}')" aria-label="اذهب إلى ${d.title}">
      <div class="ds-head"><span>${d.title}</span><span>${(dr + dw) ? toAr(p) + "٪" : "—"}</span></div>
      <div class="duo-bar"><i style="width:${p}%;--bar-c:${u.c};--bar-shine:${u.h};animation-delay:${(0.25 + i * 0.13).toFixed(2)}s"></i></div></button>`;
  }).join("");
  $app.innerHTML = statbar() + `<div class="screen"><div class="page">
    <h1>إحصائياتي</h1><div class="sub">تابع تقدمك نحو درجة أعلى</div>
    <div class="tiles">
      <div class="tile">${ico("streak", 26)}<div><div class="t-v">${toAr(S.streak.count)}</div><div class="t-l">أيام متتالية</div></div></div>
      <div class="tile">${ico("gem", 26)}<div><div class="t-v">${toAr(S.xp)}</div><div class="t-l">جواهر</div></div></div>
      <div class="tile">${ico("nav-chest", 26)}<div><div class="t-v">${toAr(doneN)}/${toAr(flat.length)}</div><div class="t-l">دروس مكتملة</div></div></div>
      <div class="tile">${ico("target", 26)}<div><div class="t-v">${(r + w) ? toAr(acc) + "٪" : "—"}</div><div class="t-l">الدقة الكلية</div></div></div>
    </div>
    ${(() => { const ti = tierIndex(), t = LEAGUE_TIERS[ti]; return `<button class="card rank-card lb-tier-${t.key}" onclick="A.go('league')">
      <span class="rank-card-badge">${rankImg(t.key, 48)}</span>
      <div class="rank-card-info"><b>المستوى ${t.name}</b><span>${ico("lightning", 15)} ${toAr(S.totalXp || 0)} نقطة خبرة</span></div>
      <span class="mc-go">عرض ←</span>
    </button>`; })()}
    ${(() => { const mc = mistakeList().length; return `<button class="card mistakes-card ${mc ? "" : "clean"}" onclick="A.go('review')">
      <span class="mc-ico">${mc ? "✕" : CHECK_BADGE}</span>
      <div class="mc-txt"><b>مراجعة الأخطاء</b><span>${mc ? qCount(mc) + " بحاجة لمراجعة" : "لا أخطاء — أحسنت!"}</span></div>
      <span class="mc-go">${mc ? "راجع ←" : "✓"}</span>
    </button>`; })()}
    <div class="card"><h3>الدقة حسب المجال</h3>${domBars}</div>
  </div></div>` + bottomnav("stats");
}

/* ---------------- SETTINGS / ABOUT ---------------- */
/* jump to a unit's stretch of the path from anywhere that names it */
A.goUnit = function (domKey) {
  go("path");
  requestAnimationFrame(() => {
    const el = document.querySelector('.unit-banner[data-unit="' + domKey + '"]');
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
};

A.setTrack = function (t) { S.track = t; save(); render(); };
A.toggleSound = function () { S.sound = !S.sound; save(); render(); };
A.toggleMotion = function () {
  S.motion = motionReduced() ? "full" : "reduced";
  motionApply(); save(); render();
};
A.resetAll = function () {
  askConfirm("تحذف كل تقدمك؟", "الدروس والجواهر والسلسلة كلها راح تروح، وما فيه رجعة.",
    "خلّه مثل ما هو", "احذف كل شيء", () => { localStorage.removeItem("qudratState"); location.reload(); });
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

/* Ask before something irreversible, in the app's own voice. The primary
   button is always the safe one — a native confirm() binds Enter to OK, which
   here was always the button that destroyed the lesson. */
function askConfirm(title, body, stayText, goText, onGo) {
  const old = document.querySelector(".ask-veil"); if (old) old.remove();
  const veil = document.createElement("div");
  veil.className = "ask-veil";
  veil.innerHTML = `<div class="ask-sheet" role="dialog" aria-modal="true" aria-label="${title}">
    <h2>${title}</h2>
    <p>${body}</p>
    <button class="btn" id="askStay">${stayText}</button>
    <button class="ask-go" id="askGo">${goText}</button>
  </div>`;
  const close = () => { veil.classList.remove("show"); setTimeout(() => veil.remove(), 240); };
  veil.onclick = e => { if (e.target === veil) close(); };
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));
  veil.querySelector("#askStay").onclick = close;
  veil.querySelector("#askGo").onclick = () => { close(); onGo(); };
  veil.querySelector("#askStay").focus();
}

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
/* The star from assets/icons/star.svg, so the marked day is drawn in
   exactly the same language as a lesson node on the path. */
const NODE_STAR = "M18.2665 6.04527C19.33 3.69332 22.67 3.69333 23.7335 6.04527L25.9554 10.959C26.4018 11.9462 27.3458 12.616 28.425 12.7114L33.7515 13.1819C36.4147 13.4171 37.4631 16.7555 35.4126 18.4711L31.6082 21.6541C30.7372 22.3828 30.3524 23.5408 30.6139 24.6459L31.7621 29.4978C32.3649 32.045 29.6444 34.0885 27.3659 32.8L22.4767 30.0351C21.5604 29.5169 20.4396 29.5169 19.5233 30.0351L14.6341 32.8C12.3556 34.0885 9.63514 32.045 10.2379 29.4978L11.3861 24.6459C11.6476 23.5408 11.2628 22.3828 10.3918 21.6541L6.58741 18.4711C4.53685 16.7555 5.58529 13.4171 8.2485 13.1819L13.575 12.7114C14.6542 12.616 15.5982 11.9462 16.0446 10.959L18.2665 6.04527Z";
const SPARK_PATH = "M0-7Q1.2-1.2 7 0 1.2 1.2 0 7-1.2 1.2-7 0-1.2-1.2 0-7Z";

/* ============================================================
   EXAM DATE — calendar picker
   ------------------------------------------------------------
   Was three dropdowns. A date three months out took nine taps and
   told the student nothing; the calendar shows the shape of the
   time they have left, shades the run of study days between now
   and the exam, and lands the chosen day with a bounce.

   Adapted from exam-date-picker.html. Dropped on the way in: its
   private copy of the Duolingo palette (the app already owns
   those tokens), the replay/slow dev controls, and the
   reduced-motion banner — motion here follows S.motion like
   everything else.
   ============================================================ */
const EP_DAYNAMES = ["\u0627\u0644\u0623\u062d\u062f", "\u0627\u0644\u0625\u062b\u0646\u064a\u0646", "\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621", "\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621", "\u0627\u0644\u062e\u0645\u064a\u0633", "\u0627\u0644\u062c\u0645\u0639\u0629", "\u0627\u0644\u0633\u0628\u062a"];
const EP_DOW = ["\u0623\u062d\u062f", "\u0625\u062b\u0646\u064a\u0646", "\u062b\u0644\u0627\u062b\u0627\u0621", "\u0623\u0631\u0628\u0639\u0627\u0621", "\u062e\u0645\u064a\u0633", "\u062c\u0645\u0639\u0629", "\u0633\u0628\u062a"];
const EP_SPARKS = [[-34,-16],[-22,-32],[-6,-38],[10,-36],[24,-28],[36,-12]];
const EP_SPARK_C = ["#58CC02","#FFC800","#1CB0F6","#58CC02","#FFC800","#84D8FF"];

/* the epJump keyframes again, for when the CSS animation does not start */
const EP_JUMP = [
  [0,0,1,1,"cubic-bezier(.34,.1,.64,1)"], [.08,3,1.22,.76,"cubic-bezier(.05,.7,.1,1)"],
  [.12,-12,.82,1.32,"cubic-bezier(.1,.6,.35,1)"], [.21,-34,.9,1.16,"cubic-bezier(.25,.55,.45,1)"],
  [.32,-48,.98,1.04,"cubic-bezier(.3,.5,.5,1)"], [.38,-52,1,1,"cubic-bezier(.55,.05,.85,.3)"],
  [.47,-35,.94,1.1,"linear"], [.54,-7,.86,1.22,"cubic-bezier(.4,0,.2,1)"],
  [.58,0,1.3,.7,"cubic-bezier(.1,.7,.3,1)"], [.64,-16,.92,1.11,"cubic-bezier(.5,.05,.8,.4)"],
  [.71,0,1.16,.86,"cubic-bezier(.1,.8,.3,1)"], [.77,-5,.97,1.05,"cubic-bezier(.5,.05,.8,.4)"],
  [.82,0,1.08,.93,"linear"], [.89,-1.5,.99,1.01,"linear"], [.95,0,1.02,.98,"linear"], [1,0,1,1,"linear"]
];

let EP = { sel: null, view: null, first: false, shown: 0, raf: 0, timer: 0 };

const epDay0  = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const epKey   = d => d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
const epAdd   = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const epDiff  = (a, b) => Math.round((epDay0(b) - epDay0(a)) / 864e5);
function epHijri(date) {
  try { return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura",
    { day: "numeric", month: "long", year: "numeric" }).format(date); }
  catch (e) { return ""; }
}

function renderExamSetup(first) {
  const today = epDay0(new Date());
  EP.first = !!first;
  EP.sel = S.exam ? epDay0(new Date(S.exam + "T00:00:00")) : null;
  if (EP.sel && EP.sel < today) EP.sel = null;
  EP.view = new Date((EP.sel || today).getFullYear(), (EP.sel || today).getMonth(), 1);
  EP.shown = 0;

  $app.innerHTML = `<div class="screen screen-full"><div class="exam-pick">
    <h1>\u0645\u062a\u0649 \u0627\u062e\u062a\u0628\u0627\u0631\u0643\u061f</h1>

    <section class="ep-count empty" id="epCount" aria-live="polite">
      <div class="ep-badge" id="epBadge">\u061f</div>
      <div class="ep-meta">
        <div class="ep-unit" id="epUnit">\u0627\u062e\u062a\u0631 \u064a\u0648\u0645 \u0627\u062e\u062a\u0628\u0627\u0631\u0643</div>
        <div class="ep-when" id="epWhen">\u0627\u0636\u063a\u0637 \u0639\u0644\u0649 \u0623\u064a \u064a\u0648\u0645 \u0641\u064a \u0627\u0644\u062a\u0642\u0648\u064a\u0645</div>
        <div class="ep-hijri" id="epHijri"></div>
      </div>
    </section>

    <section class="ep-cal">
      <div class="ep-fx ep-fx-back" id="epFxBack" aria-hidden="true"></div>
      <div class="ep-top">
        <div class="ep-month" id="epMonth"></div>
        <div class="ep-nav">
          <button id="epPrev" type="button" aria-label="\u0627\u0644\u0634\u0647\u0631 \u0627\u0644\u0633\u0627\u0628\u0642"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true"><path d="M9 5 16 12 9 19" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button id="epNext" type="button" aria-label="\u0627\u0644\u0634\u0647\u0631 \u0627\u0644\u062a\u0627\u0644\u064a"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true"><path d="M15 5 8 12 15 19" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      <div class="ep-dow" aria-hidden="true">` +
        EP_DOW.map((d, i) => `<span class="${i >= 5 ? "we" : ""}">${d}</span>`).join("") + `</div>
      <div class="ep-grid" id="epGrid" role="grid" aria-label="\u0627\u062e\u062a\u0631 \u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631"></div>
      <div class="ep-fx ep-fx-front" id="epFxFront" aria-hidden="true"></div>
      <div class="ep-legend">
        <span><i class="l1"></i>\u064a\u0648\u0645 \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631</span>
        <span><i class="l2"></i>\u0623\u064a\u0627\u0645 \u0627\u0644\u0645\u0630\u0627\u0643\u0631\u0629</span>
        <span><i class="l3"></i>\u0627\u0644\u064a\u0648\u0645</span>
      </div>
    </section>

    <div class="ep-foot" id="epFoot">
      <div class="ep-done">
        <div class="tick">\u2713</div>
        <div class="txt"><b>\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0645\u0648\u0639\u062f!</b><span id="epDoneSub"></span></div>
      </div>
      <button class="btn" id="epSave" type="button" onclick="A.saveExam()" disabled>\u062d\u0641\u0638 \u0627\u0644\u0645\u0648\u0639\u062f</button>
      <button class="ep-ghost" type="button" onclick="${first ? "A.skipExam()" : "A.backFromExam()"}">${
        first ? "\u0644\u0645 \u0623\u062d\u062c\u0632 \u0645\u0648\u0639\u062f\u0627\u064b \u0628\u0639\u062f \u2014 \u0644\u0627\u062d\u0642\u0627\u064b" : "\u0631\u062c\u0648\u0639"}</button>
    </div>
  </div></div>`;

  epMonth(0, false);
  epCount();
  epBindSwipe();
}

function epSetBadge(txt) {
  const b = document.getElementById("epBadge"); if (!b) return;
  b.textContent = txt;
  const len = String(txt).length;
  b.style.fontSize = len >= 3 ? "22px" : len === 2 ? "27px" : "30px";
}

/* rolls up to the target, starting on the frame the tile lands */
function epCountTo(target) {
  cancelAnimationFrame(EP.raf); clearTimeout(EP.timer);
  const from = EP.shown || 0;
  EP.shown = target;
  if (motionReduced() || from === target) { epSetBadge(toAr(target)); return; }
  epSetBadge(toAr(from));
  const dur = Math.min(320 + Math.abs(target - from) * 14, 900);
  EP.timer = setTimeout(() => {
    const t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      epSetBadge(toAr(Math.round(from + (target - from) * eased)));
      if (p < 1) EP.raf = requestAnimationFrame(step);
    };
    EP.raf = requestAnimationFrame(step);
  }, 580);                                   // 580ms is the impact frame
}

function epCount() {
  const today = epDay0(new Date());
  const card = document.getElementById("epCount"), foot = document.getElementById("epFoot");
  const save = document.getElementById("epSave");
  if (!card) return;
  foot.classList.remove("done");
  if (!EP.sel) {
    card.classList.add("empty");
    cancelAnimationFrame(EP.raf); clearTimeout(EP.timer); EP.shown = 0;
    epSetBadge("\u061f");
    document.getElementById("epUnit").textContent = "\u0627\u062e\u062a\u0631 \u064a\u0648\u0645 \u0627\u062e\u062a\u0628\u0627\u0631\u0643";
    document.getElementById("epWhen").textContent = "\u0627\u0636\u063a\u0637 \u0639\u0644\u0649 \u0623\u064a \u064a\u0648\u0645 \u0641\u064a \u0627\u0644\u062a\u0642\u0648\u064a\u0645";
    document.getElementById("epHijri").textContent = "";
    save.disabled = true;
    return;
  }
  const n = epDiff(today, EP.sel);
  card.classList.remove("empty");
  save.disabled = false;
  const unit = document.getElementById("epUnit");
  if (n === 0) { epSetBadge("\ud83c\udfaf"); unit.textContent = "\u0627\u062e\u062a\u0628\u0627\u0631\u0643 \u0627\u0644\u064a\u0648\u0645 \u2014 \u0628\u0627\u0644\u062a\u0648\u0641\u064a\u0642"; }
  else if (n === 1) { epCountTo(1); unit.textContent = "\u063a\u062f\u0627\u064b \u0627\u062e\u062a\u0628\u0627\u0631\u0643"; }
  else {
    epCountTo(n);
    unit.textContent = n === 2 ? "\u064a\u0648\u0645\u0627\u0646 \u062d\u062a\u0649 \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631"
      : n <= 10 ? "\u0623\u064a\u0627\u0645 \u062d\u062a\u0649 \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631" : "\u064a\u0648\u0645\u0627\u064b \u062d\u062a\u0649 \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631";
  }
  document.getElementById("epWhen").textContent =
    EP_DAYNAMES[EP.sel.getDay()] + " " + toAr(EP.sel.getDate()) + " " +
    AR_MONTHS[EP.sel.getMonth()] + " " + toAr(EP.sel.getFullYear());
  document.getElementById("epHijri").textContent = epHijri(EP.sel);
  const badge = document.getElementById("epBadge"), meta = card.querySelector(".ep-meta");
  badge.classList.remove("flash"); meta.classList.remove("flash");
  void badge.offsetWidth;
  badge.classList.add("flash"); meta.classList.add("flash");
}

function epJumpWAAPI(b) {
  if (!b.animate) return;
  b.style.transformOrigin = "bottom center";
  b.animate(EP_JUMP.map(([o, y, sx, sy, e]) =>
    ({ offset: o, transform: "translateY(" + y + "px) scale(" + sx + "," + sy + ")", easing: e })),
    { duration: 1000, fill: "both" });
}

function epLand(b) {
  const cal = document.querySelector(".ep-cal");
  const back = document.getElementById("epFxBack"), front = document.getElementById("epFxFront");
  back.innerHTML = ""; front.innerHTML = "";
  const cr = cal.getBoundingClientRect(), br = b.getBoundingClientRect();
  if (!br.width) { b.classList.add("jump"); requestAnimationFrame(() => epJumpWAAPI(b)); return; }
  const x = br.left - cr.left, y = br.top - cr.top, w = br.width, h = br.height;
  const cx = x + w / 2, groundY = y + h;

  const shade = document.createElement("span");
  shade.className = "shade";
  shade.style.width = (w * .72) + "px"; shade.style.height = "7px";
  shade.style.left = (cx - w * .36) + "px"; shade.style.top = (groundY + 3) + "px";
  back.appendChild(shade);

  EP_SPARKS.forEach((p, i) => {
    const sp = document.createElement("span"), size = i % 2 ? 5 : 7;
    sp.className = "spark";
    sp.style.width = sp.style.height = size + "px";
    sp.style.left = (cx - size / 2) + "px"; sp.style.top = (groundY - 9) + "px";
    sp.style.background = EP_SPARK_C[i];
    sp.style.setProperty("--tx", p[0] + "px");
    sp.style.setProperty("--ty", p[1] + "px");
    sp.style.animationDelay = (580 + i * 14) + "ms";
    front.appendChild(sp);
  });

  b.classList.add("jump");
  cal.classList.remove("thud"); void cal.offsetWidth; cal.classList.add("thud");
  /* if the CSS animation never started, drive it directly */
  requestAnimationFrame(() => {
    const live = b.getAnimations ? b.getAnimations() : [];
    if (!live.some(an => an.animationName === "epJump" || an.playState === "running")) epJumpWAAPI(b);
  });
  b.addEventListener("animationend", e => {
    if (e.animationName !== "epJump") return;
    back.innerHTML = ""; front.innerHTML = "";
  });
}

function epMonth(dir, animate) {
  const today = epDay0(new Date());
  const maxDate = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
  const grid = document.getElementById("epGrid");
  if (!grid) return;
  const y = EP.view.getFullYear(), m = EP.view.getMonth();
  document.getElementById("epMonth").textContent = AR_MONTHS[m] + " " + toAr(y);
  grid.classList.remove("slide-r", "slide-l");
  if (dir) { void grid.offsetWidth; grid.classList.add(dir > 0 ? "slide-r" : "slide-l"); }
  grid.innerHTML = "";
  let jumpBtn = null;

  const firstDay = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) {
    const s = document.createElement("div"); s.className = "ep-day pad"; grid.appendChild(s);
  }
  for (let d = 1; d <= total; d++) {
    const date = new Date(y, m, d);
    const b = document.createElement("button");
    b.type = "button"; b.className = "ep-day"; b.textContent = toAr(d);
    b.setAttribute("aria-label", EP_DAYNAMES[date.getDay()] + " " + toAr(d) + " " + AR_MONTHS[m] + " " + toAr(y));
    if (date < today || date > maxDate) b.disabled = true;
    if (epKey(date) === epKey(today)) b.classList.add("today");
    if (EP.sel) {
      const back = epDiff(date, EP.sel);
      if (date > today && date < EP.sel) {
        b.classList.add("run");
        if (date.getDay() === 0 || d === 1) b.classList.add("run-start");
        if (date.getDay() === 6 || d === total || epKey(epAdd(date, 1)) === epKey(EP.sel)) b.classList.add("run-end");
        if (animate && !motionReduced()) {
          b.classList.add("anim");
          b.style.animationDelay = (580 + Math.min(back * 15, 540)) + "ms";
        }
      }
      if (epKey(date) === epKey(EP.sel)) {
        b.classList.remove("today");
        b.classList.add("selected");
        b.setAttribute("aria-current", "date");
        if (animate && !motionReduced()) jumpBtn = b;
      }
    }
    b.addEventListener("click", () => { EP.sel = date; epMonth(0, true); epCount(); });
    grid.appendChild(b);
  }
  if (jumpBtn) requestAnimationFrame(() => epLand(jumpBtn));
  document.getElementById("epPrev").disabled = (y === today.getFullYear() && m === today.getMonth());
  document.getElementById("epNext").disabled = (y === maxDate.getFullYear() && m === maxDate.getMonth());
  document.getElementById("epPrev").onclick = () => A.epShift(-1);
  document.getElementById("epNext").onclick = () => A.epShift(1);
}

A.epShift = function (step) {
  EP.view = new Date(EP.view.getFullYear(), EP.view.getMonth() + step, 1);
  epMonth(step, false);
};

function epBindSwipe() {
  const grid = document.getElementById("epGrid");
  if (!grid) return;
  let x0 = null;
  grid.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  grid.addEventListener("touchend", e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 55) {
      const prev = document.getElementById("epPrev"), next = document.getElementById("epNext");
      if (dx > 0 && next && !next.disabled) A.epShift(1);
      if (dx < 0 && prev && !prev.disabled) A.epShift(-1);
    }
    x0 = null;
  });
}

A.examSetup = function () { renderExamSetup(false); };
A.saveExam = function () {
  if (!EP.sel) return;
  const d = EP.sel;
  S.exam = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  S.examAsked = true; save(); sndGood();

  /* confirm in place rather than snapping away: the count-up and the landing
     have just finished selling the date, and cutting the screen at that exact
     moment throws the payoff away */
  const n = epDiff(epDay0(new Date()), d);
  const foot = document.getElementById("epFoot"), sub = document.getElementById("epDoneSub");
  const btn = document.getElementById("epSave");
  if (foot && sub && btn) {
    /* arPlural() RETURNS THE COUNT for 3 and up \u2014 "toAr(n) + ' ' + few" \u2014 so
       prefixing it with toAr() again printed "\u0644\u0640 \u0664 \u0664 \u0623\u0633\u0627\u0628\u064a\u0639". It yields the
       bare word for 1 and 2, which take their own forms and attach the lam
       directly. Under a week the weeks figure is a rounding artefact, so that
       range counts days instead. */
    const weeks = Math.round(n / 7);
    sub.textContent =
      n <= 0 ? "\u0628\u0627\u0644\u062a\u0648\u0641\u064a\u0642 \u0627\u0644\u064a\u0648\u0645"
      : n === 1 ? "\u062e\u0637\u0629 \u0645\u0630\u0627\u0643\u0631\u062a\u0643 \u062c\u0627\u0647\u0632\u0629 \u0644\u064a\u0648\u0645 \u0648\u0627\u062d\u062f"
      : n === 2 ? "\u062e\u0637\u0629 \u0645\u0630\u0627\u0643\u0631\u062a\u0643 \u062c\u0627\u0647\u0632\u0629 \u0644\u064a\u0648\u0645\u064a\u0646"
      : n < 7 ? "\u062e\u0637\u0629 \u0645\u0630\u0627\u0643\u0631\u062a\u0643 \u062c\u0627\u0647\u0632\u0629 \u0644\u0640 " + toAr(n) + " \u0623\u064a\u0627\u0645"
      : weeks === 1 ? "\u062e\u0637\u0629 \u0645\u0630\u0627\u0643\u0631\u062a\u0643 \u062c\u0627\u0647\u0632\u0629 \u0644\u0623\u0633\u0628\u0648\u0639 \u0648\u0627\u062d\u062f"
      : weeks === 2 ? "\u062e\u0637\u0629 \u0645\u0630\u0627\u0643\u0631\u062a\u0643 \u062c\u0627\u0647\u0632\u0629 \u0644\u0623\u0633\u0628\u0648\u0639\u064a\u0646"
      : "\u062e\u0637\u0629 \u0645\u0630\u0627\u0643\u0631\u062a\u0643 \u062c\u0627\u0647\u0632\u0629 \u0644\u0640 " +
        arPlural(weeks, "\u0623\u0633\u0628\u0648\u0639", "\u0623\u0633\u0628\u0648\u0639\u064a\u0646", "\u0623\u0633\u0627\u0628\u064a\u0639", "\u0623\u0633\u0628\u0648\u0639\u0627\u064b");
    foot.classList.add("done");
    btn.textContent = "\u0645\u062a\u0627\u0628\u0639\u0629";
    btn.onclick = () => { EP.first ? go("path") : A.backFromExam(); };
    return;
  }
  EP.first ? go("path") : A.backFromExam();
};

A.skipExam = function () { S.examAsked = true; save(); go("path"); };
/* "رجوع" from Settings used to call skipExam, which lands on the path — the
   one place the student was not coming back from */
A.backFromExam = function () { go("settings"); };

/* ---------------- login (local profile, no server) ---------------- */
function bankSize() {
  let n = 0;
  DOMAIN_ORDER.forEach(k => { const d = (window.QBANK || {})[k]; if (d) d.lessons.forEach(l => n += l.questions.length); });
  return n;
}
function renderLogin() {
  $app.innerHTML = `<div class="screen screen-full login-screen">
    ${welcomeHero()}
    <h1 class="login-title">قدراتي</h1>
    <p class="login-sub">تدرّب على القسم الكمي — درساً بعد درس</p>
    <div class="login-badges">
      <span>${toAr(bankSize())} سؤال أصلي</span>
      <span>مجاني بالكامل</span>
      <span>بدون حساب</span>
    </div>
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

/* No longer gates anything — kept because A.showAbout reuses DISCLAIMER_HTML. */
function showDisclaimerSheet(onAccept) {
  const veil = document.createElement("div");
  veil.className = "disc-veil";
  veil.innerHTML = `<div class="disc-sheet">
    <div class="ms-grip"></div>
    <div class="ds-icon">${DISCLAIMER_ICON}</div>
    <h2 class="ds-title">إخلاء مسؤولية</h2>
    <div class="ds-body">${DISCLAIMER_HTML}</div>
    <button class="btn ds-btn" id="discOk">فهمت، لنبدأ!</button>
  </div>`;
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));
  veil.querySelector("#discOk").onclick = () => {
    veil.classList.remove("show");
    setTimeout(() => { veil.remove(); onAccept(); }, 320);
  };
}

/* The disclaimer used to be a non-dismissible sheet between the login screen
   and the first lesson — a wall in front of someone who had not yet seen
   anything worth agreeing to. The notice still ships; it lives in Settings
   → حول التطبيق, where it can be read instead of dismissed. */
function afterLogin() {
  S.joined = S.joined || todayKey();
  if (!S.examAsked && !S.exam) { renderExamSetup(true); return; }
  save(); render();
}

/* ---------------- keyboard (web) ----------------
   A lesson is answerable without a mouse: 1-4 picks a choice,
   Enter checks it and then advances, Esc leaves the session. */
function keyboardBlocked() {
  const t = document.activeElement;
  if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return true;
  return !!document.querySelector(
    ".modal-veil, .chest-veil, .rankup-veil, .streak-veil, .dq-veil, .lesson-pop-veil, .method-veil.show");
}

document.addEventListener("keydown", e => {
  // only while a question is actually on screen (not the win/fail cards)
  if (!SES || !document.querySelector(".q-area")) return;
  if (e.ctrlKey || e.metaKey || e.altKey || e.key.length === 0 || keyboardBlocked()) return;
  const fb = document.getElementById("fb");
  const answered = !!(fb && fb.classList.contains("show"));

  if (e.key === "Escape") { e.preventDefault(); A.quitSession(); return; }

  if (e.key === "Enter" || e.key === " ") {
    // a focused button handles its own activation - do not fight it
    if (document.activeElement && document.activeElement.tagName === "BUTTON") return;
    e.preventDefault();
    if (answered) { const b = fb.querySelector(".btn"); if (b) b.click(); }
    else if (SES.sel !== null && !SES.locked) A.check();
    return;
  }

  if (answered || SES.locked || e.key.length !== 1) return;
  const n = "١٢٣٤".indexOf(e.key) + 1 || parseInt(e.key, 10);
  if (n >= 1 && n <= 4) {
    const btn = document.querySelector(`.choice[data-ci="${n - 1}"]`);
    if (btn && !btn.disabled && !btn.classList.contains("eliminated")) { e.preventDefault(); A.pick(n - 1); }
  }
});


/* ============================================================
   PROFILE
   ------------------------------------------------------------
   Not a settings list with a name on top. This is the screen a
   student opens to answer one question: am I on track? Who they
   are, how long the streak is, what this week looked like, how
   far each unit has come, how many days are left.

   Settings is a pop-up launched from here, not a sibling screen,
   because settings is something you dip into and leave — the
   profile is somewhere you stay.
   ============================================================ */
const PROF_WK = ["\u062d", "\u0646", "\u062b", "\u0631", "\u062e", "\u062c", "\u0633"];

/* todayKey() emits an unpadded y-m-d, which fmtExamDate cannot parse. */
function fmtDayKey(k) {
  const a = String(k || "").split("-");
  return a.length === 3 ? toAr(+a[2]) + " / " + toAr(+a[1]) + " / " + toAr(+a[0]) : "";
}

function unitMastery() {
  return domains().map(d => {
    let done = 0;
    d.lessons.forEach(l => { if (lessonProg(d.key + "." + l.key).stars > 0) done++; });
    return { title: d.title, color: d.color, done, total: d.lessons.length,
             pct: d.lessons.length ? Math.round(done / d.lessons.length * 100) : 0 };
  });
}

function overallAccuracy() {
  let r = 0, w = 0;
  for (const k in S.qstats) { r += S.qstats[k].r || 0; w += S.qstats[k].w || 0; }
  return (r + w) ? Math.round(r / (r + w) * 100) : null;
}

/* The last seven days, oldest first — so in RTL the week reads from the right
   and today lands at the left, where the eye finishes. Reads S.days — the days
   actually practised — rather than deducing them from the streak, because a
   day you practised on after the streak broke is still a day you practised. */
function streakWeek() {
  const out = [], today = new Date(); today.setHours(0, 0, 0, 0);
  const days = S.days || {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 864e5);
    const key = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    out.push({ dow: PROF_WK[d.getDay()], n: days[key] || 0, on: !!days[key], today: i === 0 });
  }
  return out;
}

/* The three lessons the student is measurably worst at, each one tappable.
   The profile was otherwise a wall of numbers with no next move on it: you
   could read "\u0627\u0644\u062f\u0642\u0629 \u0666\u0667\u066a" and have nowhere to go with it. Hidden until
   there is enough history to rank honestly. */
function weakCard() {
  const weak = weakLessons(3);
  if (!weak.length) return "";
  return `<div class="pf-card">
    <div class="pf-head"><h3>\u0623\u0636\u0639\u0641 \u0645\u0648\u0627\u0636\u064a\u0639\u0643</h3>
      <span class="pf-goal pf-static">\u0627\u0628\u062f\u0623 \u0645\u0646 \u0647\u0646\u0627</span></div>
    <div class="pf-weak">` + weak.map(l => `
      <button class="pf-w" onclick="A.startLesson('${l.dom}','${l.key}')">
        <span class="pf-w-acc pm-${l.color === "yellow" ? "gold" : l.color}">${toAr(l.acc)}\u066a</span>
        <span class="pf-w-tx">${l.title}</span>
        <span class="pf-w-go">\u062a\u062f\u0631\u0651\u0628</span>
      </button>`).join("") + `</div>
  </div>`;
}

function renderProfile() {
  const t = LEAGUE_TIERS[tierIndex()];
  const name = (S.user && S.user.name) || "\u0636\u064a\u0641";
  const guest = !S.user || S.user.guest;
  const flat = allLessons();
  let doneN = 0; flat.forEach(x => { if (lessonProg(x.key).stars > 0) doneN++; });
  const acc = overallAccuracy(), days = examDaysLeft();
  const nextT = LEAGUE_TIERS[tierIndex() + 1];
  const tierPct = nextT
    ? Math.max(0, Math.min(100, Math.round((S.totalXp - t.min) / (nextT.min - t.min) * 100))) : 100;

  $app.innerHTML = statbar() + `<div class="screen"><div class="page pf">

    <div class="pf-hero">
      <div class="pf-av"><span>${esc(name.trim().charAt(0) || "\u0642")}</span></div>
      <div class="pf-id">
        <h1>${esc(name)}</h1>
        <p>${S.joined ? "\u0628\u062f\u0623 \u0645\u0639\u0646\u0627 " + fmtDayKey(S.joined) : "\u0639\u0636\u0648 \u062c\u062f\u064a\u062f"}</p>
      </div>
      <button class="pf-gear" onclick="A.gotoSettings()" aria-label="\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a">${GEAR_SVG}</button>
    </div>

    ${guest ? `<button class="pf-claim" onclick="A.gotoSettings('name')">
      <span class="pf-cl-ic">${ico("guide", 20)}</span>
      <span class="pf-cl-tx"><b>\u0627\u062d\u0641\u0638 \u062a\u0642\u062f\u0651\u0645\u0643</b><span>\u0623\u0636\u0641 \u0627\u0633\u0645\u0643 \u0639\u0634\u0627\u0646 \u0645\u0627 \u062a\u0636\u064a\u0639 \u062f\u0631\u0648\u0633\u0643</span></span>
      <span class="pf-go">\u2190</span></button>` : ""}

    <button class="pf-rank" onclick="A.go('league')">
      ${rankImg(t.key, 54)}
      <span class="pf-rank-tx">
        <b>\u0627\u0644\u0645\u0633\u062a\u0648\u0649 ${t.name}</b>
        <span class="pf-rank-bar"><i style="width:${tierPct}%"></i></span>
        <small>${nextT ? toAr(Math.max(0, nextT.min - S.totalXp)) + " \u0646\u0642\u0637\u0629 \u0644\u0644\u0645\u0633\u062a\u0648\u0649 " + nextT.name : "\u0623\u0639\u0644\u0649 \u0645\u0633\u062a\u0648\u0649 \u2014 \u0623\u062d\u0633\u0646\u062a"}</small>
      </span>
      <span class="pf-go">\u2190</span>
    </button>

    <div class="pf-grid">
      <div class="pf-tile"><span class="pf-t-ic">${ico("streak", 26)}</span><b>${toAr(S.streak.count)}</b><span>\u064a\u0648\u0645 \u0645\u062a\u062a\u0627\u0644\u064d</span></div>
      <div class="pf-tile"><span class="pf-t-ic">${ico("gem", 26)}</span><b>${toAr(S.xp)}</b><span>\u062c\u0648\u0647\u0631\u0629</span></div>
      <div class="pf-tile"><span class="pf-t-ic">${ico("star-gold", 26)}</span><b>${toAr(doneN)}</b><span>\u062f\u0631\u0633\u0627\u064b \u0645\u0643\u062a\u0645\u0644\u0627\u064b</span></div>
      <div class="pf-tile"><span class="pf-t-ic">${ico("target", 26)}</span><b>${acc === null ? "\u2014" : toAr(acc) + "\u066a"}</b><span>\u0627\u0644\u062f\u0642\u0629</span></div>
    </div>

    <div class="pf-card">
      <div class="pf-head"><h3>\u0623\u0633\u0628\u0648\u0639\u0643</h3>
        <button class="pf-goal" onclick="A.gotoSettings('goal')">${ico("target", 15)} \u0647\u062f\u0641\u0643 ${toAr(S.goal)} \u064a\u0648\u0645\u064a\u0627\u064b</button></div>
      <div class="pf-week">` + streakWeek().map(d => `
        <div class="pf-day${d.on ? " on" : ""}${d.today ? " now" : ""}">
          <span class="pf-dot">${d.on ? CHECK_BADGE : ""}</span><span class="pf-dow">${d.dow}</span>
        </div>`).join("") + `</div>
      <p class="pf-wk-note">${(() => {
        const act = streakWeek().filter(x => x.on).length;
        return act
          ? "\u062f\u0631\u0651\u0628\u062a " + arPlural(act, "\u064a\u0648\u0645\u0627\u064b \u0648\u0627\u062d\u062f\u0627\u064b", "\u064a\u0648\u0645\u064a\u0646", "\u0623\u064a\u0627\u0645", "\u064a\u0648\u0645\u0627\u064b") + " \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639"
          : "\u0645\u0627 \u062f\u0631\u0651\u0628\u062a \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u2014 \u0627\u0628\u062f\u0623 \u0627\u0644\u064a\u0648\u0645";
      })()}</p>
    </div>

    ${days !== null ? `<button class="pf-exam" onclick="A.examSetup()">
      <span class="pf-ex-n">${toAr(days)}</span>
      <span class="pf-ex-t"><b>\u064a\u0648\u0645\u0627\u064b \u0639\u0644\u0649 \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631</b><span>${fmtExamDate(S.exam)}</span></span>
      <span class="pf-go">\u2190</span></button>`
      : `<button class="pf-exam pf-exam-empty" onclick="A.examSetup()">
      <span class="pf-ex-t"><b>\u062d\u062f\u0651\u062f \u0645\u0648\u0639\u062f \u0627\u062e\u062a\u0628\u0627\u0631\u0643</b><span>\u0639\u0634\u0627\u0646 \u0646\u062a\u0627\u0628\u0639 \u062c\u0627\u0647\u0632\u064a\u062a\u0643</span></span>
      <span class="pf-go">\u2190</span></button>`}

    ${weakCard()}

    <div class="pf-card">
      <div class="pf-head"><h3>\u0625\u062a\u0642\u0627\u0646\u0643 \u062d\u0633\u0628 \u0627\u0644\u0648\u062d\u062f\u0629</h3></div>
      <div class="pf-mast">` + unitMastery().map(m => `
        <div>
          <div class="pf-m-top"><span>${m.title}</span><b>${toAr(m.done)}/${toAr(m.total)}</b></div>
          <div class="pf-m-bar pm-${m.color === "yellow" ? "gold" : m.color}"><i style="width:${m.pct}%"></i></div>
        </div>`).join("") + `</div>
    </div>

    <button class="pf-line" onclick="A.go('review')"><span>${ico("target", 18)} \u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0623\u062e\u0637\u0627\u0621</span><span class="pf-go">\u2190</span></button>
    <button class="pf-line" onclick="A.gotoSettings()"><span>${GEAR_SVG} \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a</span><span class="pf-go">\u2190</span></button>

  </div></div>` + bottomnav("profile");
}

const GEAR_SVG = `<svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z" stroke="currentColor" stroke-width="2"/>
  <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.84 2.84l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.11A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.84-2.84l.06-.06A1.7 1.7 0 0 0 4.52 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.11A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.84-2.84l.06.06A1.7 1.7 0 0 0 9 4.52a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.11A1.7 1.7 0 0 0 15 4.7a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.84 2.84l-.06.06A1.7 1.7 0 0 0 19.4 9v.03a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.11a1.7 1.7 0 0 0-1.49 1.03Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/* ============================================================
   SETTINGS — a pop-up, the way Duolingo does it
   ------------------------------------------------------------
   Blur the app behind it, spring the card in, and put things a
   student can actually use on it: the daily goal, the exam date,
   the track, and their name — not just two toggles and a reset.
   `focus` scrolls one group into view and flashes it, so the
   profile can deep-link straight at the row it is talking about.
   ============================================================ */
const SET_GOALS = [5, 10, 15, 20];

/* ============================================================
   SETTINGS — a screen, not a sheet
   ------------------------------------------------------------
   It was a pop-up for a while. Wrong shape: this is nine controls
   deep, it is somewhere you stop and read, and a sheet that tall
   ends up scrolling inside a scrolling page. The two-way menu is
   the sheet; what it opens is a destination.

   SET_FOCUS lets the profile deep-link at one group — tapping
   "\u0647\u062f\u0641\u0643 \u0661\u0660 \u064a\u0648\u0645\u064a\u0627\u064b" should land on the goal, not on the top
   of a list with the goal somewhere in it.
   ============================================================ */
let SET_FOCUS = null;
A.gotoSettings = function (focus) { SET_FOCUS = focus || null; go("settings"); };

function renderSettings() {
  const guest = !S.user || S.user.guest;
  const days = examDaysLeft();

  $app.innerHTML = statbar() + `<div class="screen"><div class="page set-page">
    <h1>\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a</h1>
    <div class="sub">\u062e\u0635\u0651\u0635 \u062a\u062c\u0631\u0628\u0629 \u062a\u062f\u0631\u064a\u0628\u0643</div>

    <div class="set-grp" data-g="name">
      <div class="set-lab">\u0627\u0633\u0645\u0643</div>
      <div class="set-name">
        <input id="setName" class="login-input" type="text" maxlength="20"
          placeholder="\u0645\u0627 \u0627\u0633\u0645\u0643\u061f" autocomplete="off"
          value="${guest ? "" : esc((S.user && S.user.name) || "")}"
          onkeydown="if(event.key==='Enter')A.setSaveName()">
        <button class="btn set-save" onclick="A.setSaveName()">\u062d\u0641\u0638</button>
      </div>
      ${guest ? `<p class="set-hint">\u062a\u0642\u062f\u0651\u0645\u0643 \u0645\u062d\u0641\u0648\u0638 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u0641\u0642\u0637.</p>` : ""}
    </div>

    <div class="set-grp" data-g="goal">
      <div class="set-lab">\u0627\u0644\u0647\u062f\u0641 \u0627\u0644\u064a\u0648\u0645\u064a</div>
      <div class="set-seg">` + SET_GOALS.map(g =>
        `<button class="${S.goal === g ? "on" : ""}" onclick="A.setGoal(${g})">${toAr(g)}</button>`).join("") + `</div>
      <p class="set-hint">\u0639\u062f\u062f \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0644\u064a \u062a\u0628\u064a \u062a\u062d\u0644\u0651\u0647\u0627 \u0643\u0644 \u064a\u0648\u0645.</p>
    </div>

    <div class="set-grp" data-g="track">
      <div class="set-lab">\u0645\u0633\u0627\u0631\u0643</div>
      <div class="set-seg set-seg2">
        <button class="${S.track === "sci" ? "on" : ""}" onclick="A.setTrackM('sci')">\u0639\u0644\u0645\u064a</button>
        <button class="${S.track === "lit" ? "on" : ""}" onclick="A.setTrackM('lit')">\u0623\u062f\u0628\u064a / \u0646\u0638\u0631\u064a</button>
      </div>
    </div>

    <div class="set-grp" data-g="exam">
      <div class="set-lab">\u0645\u0648\u0639\u062f \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631</div>
      <button class="set-row" onclick="A.examSetup()">
        <span class="set-row-ic">${ico("timer", 20)}</span>
        <span class="set-row-tx"><b>${days !== null ? "\u0628\u0627\u0642\u064d " + toAr(days) + " \u064a\u0648\u0645\u0627\u064b" : "\u063a\u064a\u0631 \u0645\u062d\u062f\u0651\u062f \u0628\u0639\u062f"}</b>
          <span>${S.exam ? fmtExamDate(S.exam) : "\u0627\u062e\u062a\u0631 \u064a\u0648\u0645 \u0627\u062e\u062a\u0628\u0627\u0631\u0643 \u0645\u0646 \u0627\u0644\u062a\u0642\u0648\u064a\u0645"}</span></span>
        <span class="pf-go">\u2190</span>
      </button>
    </div>

    <div class="set-grp">
      <div class="set-tog">
        <span><b>\u0627\u0644\u0623\u0635\u0648\u0627\u062a</b><span>\u0645\u0624\u062b\u0631\u0627\u062a \u0639\u0646\u062f \u0627\u0644\u0625\u062c\u0627\u0628\u0629</span></span>
        <button class="toggle ${S.sound ? "on" : ""}" onclick="A.setSound(this)" aria-label="\u0627\u0644\u0623\u0635\u0648\u0627\u062a"></button>
      </div>
      <div class="set-tog">
        <span><b>\u0627\u0644\u062d\u0631\u0643\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629</b><span>${
          motionReduced() ? "\u0645\u062e\u0641\u0651\u0641\u0629 \u2014 \u0628\u062f\u0648\u0646 \u0642\u0641\u0632\u0629 \u0648\u0644\u0627 \u0628\u0631\u0642"
            : (osPrefersReduce() ? "\u0646\u0638\u0627\u0645\u0643 \u064a\u0642\u0644\u0651\u0644 \u0627\u0644\u062d\u0631\u0643\u0629 \u2014 \u0644\u0643\u0646\u0651\u0647\u0627 \u0645\u0641\u0639\u0651\u0644\u0629 \u0647\u0646\u0627"
              : "\u0642\u0641\u0632\u0629 \u0627\u0644\u0625\u062c\u0627\u0628\u0629 \u0648\u0627\u0644\u0628\u0631\u0642")}</span></span>
        <button class="toggle ${motionReduced() ? "" : "on"}" onclick="A.setMotion(this)" aria-label="\u0627\u0644\u062d\u0631\u0643\u0629"></button>
      </div>
    </div>

    <div class="set-grp">
      <button class="set-row" onclick="A.showAbout()">
        <span class="set-row-ic">${ico("book", 20)}</span>
        <span class="set-row-tx"><b>\u062d\u0648\u0644 \u0627\u0644\u062a\u0637\u0628\u064a\u0642</b><span>\u0625\u062e\u0644\u0627\u0621 \u0645\u0633\u0624\u0648\u0644\u064a\u0629 \u0648\u0645\u0639\u0644\u0648\u0645\u0627\u062a</span></span>
        <span class="pf-go">\u2190</span>
      </button>
      <a class="set-row" href="https://etec.gov.sa" target="_blank" rel="noopener">
        <span class="set-row-ic">${ico("guide", 20)}</span>
        <span class="set-row-tx"><b>\u0645\u0646\u0635\u0629 \u0642\u064a\u0627\u0633 \u0627\u0644\u0631\u0633\u0645\u064a\u0629</b><span>etec.gov.sa</span></span>
        <span class="pf-go">\u2197</span>
      </a>
    </div>

    <div class="set-grp set-danger">
      ${guest ? "" : `<button class="set-row" onclick="A.logout()">
        <span class="set-row-tx"><b>\u062a\u0628\u062f\u064a\u0644 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645</b></span><span class="pf-go">\u2190</span></button>`}
      <button class="set-row set-red" onclick="A.resetAll()">
        <span class="set-row-tx"><b>\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0627\u0644\u062a\u0642\u062f\u0651\u0645</b><span>\u062d\u0630\u0641 \u0643\u0644 \u0627\u0644\u0646\u0642\u0627\u0637 \u0648\u0627\u0644\u0625\u0646\u062c\u0627\u0632\u0627\u062a</span></span>
        <span class="pf-go">\u2190</span></button>
    </div>

  </div></div>` + bottomnav("settings");

  if (SET_FOCUS) {
    const g = document.querySelector('[data-g="' + SET_FOCUS + '"]');
    const want = SET_FOCUS; SET_FOCUS = null;
    if (g) requestAnimationFrame(() => {
      g.scrollIntoView({ block: "center", behavior: "smooth" });
      g.classList.add("flash");
      if (want === "name") { const i = document.getElementById("setName"); if (i) i.focus(); }
    });
  }
}

A.setGoal = function (g) {
  S.goal = g; save();
  document.querySelectorAll('[data-g="goal"] .set-seg button').forEach((b, i) =>
    b.classList.toggle("on", SET_GOALS[i] === g));
};
A.setTrackM = function (t) {
  S.track = t; save();
  document.querySelectorAll('[data-g="track"] .set-seg button').forEach((b, i) =>
    b.classList.toggle("on", (i === 0 ? "sci" : "lit") === t));
};
A.setSound = function (btn) { S.sound = !S.sound; save(); btn.classList.toggle("on", S.sound); };
A.setMotion = function (btn) {
  S.motion = motionReduced() ? "full" : "reduced";
  motionApply(); save();
  btn.classList.toggle("on", !motionReduced());
  render();                               // the hint line under it has to follow
};
A.setSaveName = function () {
  const inp = document.getElementById("setName");
  const name = (inp.value || "").trim();
  if (!name) { inp.classList.remove("err"); void inp.offsetWidth; inp.classList.add("err"); inp.focus(); return; }
  S.user = { name: name.slice(0, 20), guest: false };
  save(); sndGood(); toast("\u062a\u0645 \u062d\u0641\u0638 \u0627\u0633\u0645\u0643 \u2713");
  render();
};


/* ============================================================
   THE MORE MENU
   ------------------------------------------------------------
   The last nav slot used to jump straight to the profile, which
   left settings a level further in. It offers the choice instead:
   two destinations, the app blurred behind them, the card rising
   from the bar it was launched from.
   ============================================================ */
A.openMore = function () {
  if (document.querySelector(".more-veil")) return;
  const veil = document.createElement("div");
  veil.className = "more-veil";
  veil.innerHTML = '<div class="more-card" role="dialog" aria-modal="true" aria-label="\u0627\u0644\u0645\u0632\u064a\u062f">' +
    '<div class="more-grip" aria-hidden="true"></div>' +
    '<button class="more-pick" onclick="A.moreGo(\'profile\')">' +
      '<span class="more-ic mi-green">' + ico("nav-stats", 26) + '</span>' +
      '<span class="more-tx"><b>\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a</b>' +
      '<span>\u062a\u0642\u062f\u0651\u0645\u0643\u060c \u0633\u0644\u0633\u0644\u062a\u0643\u060c \u0648\u0625\u062a\u0642\u0627\u0646\u0643</span></span>' +
      '<span class="pf-go">\u2190</span></button>' +
    '<button class="more-pick" onclick="A.moreGo(\'settings\')">' +
      '<span class="more-ic mi-blue">' + GEAR_SVG + '</span>' +
      '<span class="more-tx"><b>\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a</b>' +
      '<span>\u0627\u0644\u0647\u062f\u0641\u060c \u0627\u0644\u0645\u0633\u0627\u0631\u060c \u0648\u0645\u0648\u0639\u062f \u0627\u062e\u062a\u0628\u0627\u0631\u0643</span></span>' +
      '<span class="pf-go">\u2190</span></button>' +
  '</div>';
  veil.onclick = e => { if (e.target === veil) A.closeMore(); };
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));
};
A.closeMore = function (then) {
  const v = document.querySelector(".more-veil");
  if (!v) { if (then) then(); return; }
  v.classList.remove("show");
  setTimeout(() => { v.remove(); if (then) then(); }, 220);
};
A.moreGo = function (what) {
  A.closeMore(() => {
    if (what !== "settings") { go("profile"); return; }
    go("settings");
  });
};

/* Weakest lessons by the student's own accuracy. Four attempts is the floor:
   below that a single slip reads as 0% and the list becomes noise, not advice. */
function weakLessons(n) {
  const out = [];
  domains().forEach(d => d.lessons.forEach(l => {
    let r = 0, w = 0;
    l.questions.forEach(q => { const st = S.qstats[q.id]; if (st) { r += st.r || 0; w += st.w || 0; } });
    if (r + w >= 4) out.push({ dom: d.key, key: l.key, title: l.title,
                               color: d.color, acc: Math.round(r / (r + w) * 100) });
  }));
  return out.sort((a, b) => a.acc - b.acc).slice(0, n);
}

/* ---------------- boot ---------------- */
function boot() {
  initCorrectVoice(); // preload the correct-answer clip so the first play is instant
  if (!S.user) renderLogin();
  else afterLogin();
}
boot();
})();
