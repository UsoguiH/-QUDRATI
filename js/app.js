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
const DAILY_GOAL = 10;       // the default daily quest; S.goal is the student's own
const GOALS = [5, 10, 20];   // هادئ · معتاد · جدّي
/* A goal someone else picked is a target; a goal you picked is a promise. The chest
   scales with it, so choosing the calm goal is a lighter day rather than the same
   reward for half the work. */
function dailyGoal() {
  const g = +S.goal;
  return GOALS.indexOf(g) >= 0 ? g : DAILY_GOAL;
}
function chestGems() { return Math.round(CHEST_GEMS * dailyGoal() / DAILY_GOAL); }
/* Real computerized GAT format (researched 2026): quant sections of 25
   min each, free navigation + flagging inside a section, sealed once
   ended. Official topic mix ≈ 40% arithmetic / 24% algebra /
   23% geometry / 13% statistics; lit track gets a lighter quant load. */
const MOCK_SECTION_PLAN = { sci: [6, 8, 4, 6], lit: [4, 5, 3, 3] }; // per-section counts in DOMAIN_ORDER [skills,numbers,ratios,geometry]
const MOCK_SECTIONS = 2;
const MOCK_SECS = 25 * 60;   // per section, like the real thing
const todayKey = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
const fmtTime = s => toAr(String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")) + ":" + toAr(String(Math.max(0, s) % 60).padStart(2, "0"));
/* the question pill reads like Duolingo's timed challenge: m:ss, no leading zero on the minute */
const fmtClock = s => toAr(Math.floor(Math.max(0, s) / 60)) + ":" + toAr(String(Math.max(0, s) % 60).padStart(2, "0"));

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
/* a fraction as the exam prints it, the top number over a bar over the bottom
   one, not «١/٢» on the line (the user, 2026-10-28: «this is not like qudrati
   كسور … make it like qudrati exam كسور»). Only text between tags is touched,
   never the inside of an <svg>; «٢٠٢٦/١٠/٢٨» and other runs of slashes stay.
   A screen reader hears «١ على ٢». */
const FRAC_RE = /(^|[^٠-٩/])([٠-٩]+)\/([٠-٩]+)(?![٠-٩/])/g;
function fracs(html) {
  let svg = 0;
  return String(html == null ? "" : html).split(/(<[^>]*>)/).map(p => {
    if (p[0] === "<") { if (/^<svg[\s>]/i.test(p)) svg++; else if (/^<\/svg/i.test(p)) svg = Math.max(0, svg - 1); return p; }
    return svg ? p : p.replace(FRAC_RE, (m, b, n, d) =>
      `${b}<span class="fr"><span class="fr-n">${n}</span><span class="fr-sr"> على </span><span class="fr-d">${d}</span></span>`);
  }).join("");
}
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }   // quotes too: a name with «"» was cut at it inside value="…" (the audit, 2026-10-28)

/* ---------------- state ---------------- */
const DEFAULT_STATE = { v: 1, disclaimer: false, introSeen: false, trackAsked: false, placeAsked: false, profileAsked: false, placed: null, user: null, track: "sci", sound: true, motion: "full", goal: 10, joined: null, days: {}, xp: 0, totalXp: 0, tierSeen: 0, streak: { count: 0, last: null }, lessons: {}, qstats: {}, exam: null, examAsked: false, daily: null, mocks: [], league: null, mistakes: {}, teach: {}, learn: {}, reports: {} };
/* The rivals. A student who suspects the board is padded looks at the names
   first, and a column of two dozen tidy Arabic first names is the one
   arrangement that never occurs on a real sign-up sheet. These are drawn in
   the proportions a Saudi one actually has: bare first names, full names,
   Latin handles with a birth year in them, initials, kunyas, and the handful
   of people who sign up as a slogan. */
const LEAGUE_NAMES = [
  "عبدالله", "محمد", "نورة", "سارة", "فهد", "ريم", "خالد", "لمى", "تركي", "جواهر",
  "عمر", "هند", "سلمان", "رنا", "بدر", "ليان", "ناصر", "شهد", "يزيد", "دانة",
  "مازن", "أصيل", "وليد", "غادة", "رغد", "ماجد", "أسامة", "جنى", "مشاري", "ريماس",
  "عبدالله الشمري", "نورة القحطاني", "محمد العتيبي", "سارة الدوسري",
  "فهد الحربي", "ريم الغامدي", "خالد الزهراني", "لمى المطيري",
  "تركي السبيعي", "دانة العنزي", "بدر الرشيدي", "شهد البقمي",
  "سلطان المالكي", "جوري الأحمدي", "فيصل القرني", "أروى الشهراني",
  "م. العتيبي", "ع. الحربي", "ن. القحطاني", "س. الدوسري", "أ.م",
  "Fahad_99", "sara.m", "Nouf2006", "khaled_alq", "Turki7", "rimaz", "abdullah.s",
  "MshariX", "lulu_04", "3bdulaziz", "Reem.A", "y.alsubaie", "Noura___", "dana2007",
  "Bader_88", "s7r", "aljoharah", "nayef.k", "ManarQ", "wjdan_", "Ali__2005", "Hessa.z",
  "أبو فهد", "أم يزيد", "أبو ناصر", "أم ريم",
  "طموح", "الفارس", "بنت الرياض", "مستعد", "قدرات ٩٩", "هدفي ١٠٠",
  "الصقر", "نجم القياس", "لا مستحيل", "مجتهد", "ابن القصيم",
  "ريما", "نايف", "جود", "سلطان", "أروى", "راكان"
];
const LEAGUE_SIZE = 29;   /* + you = 30, the size a real weekly league runs at */
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
/* The save's schema version. `S.v` was written from the first day and never read,
   so a breaking change had no way to fix old saves in place. Every step that has
   to reshape a save adds a case here and bumps SCHEMA; migrate() also runs on an
   imported backup, so a code from an older build is upgraded rather than refused. */
const SCHEMA = 2;
function migrate(s) {
  const from = +s.v || 1;
  if (from >= SCHEMA) { s.v = SCHEMA; return s; }
  /* v1 -> v2: the daily goal became the student's own (it shipped as dead state
     fixed at ten), and `league` held a cache of fabricated rivals that is now
     rebuilt from the week number on every draw. */
  if (from < 2) {
    if (typeof s.goal !== "number" || s.goal < 1) s.goal = 10;
    delete s.league;
    /* a save from before the track and the placement were asked for has already
       been playing on the default track: treat both as answered rather than
       interrupting a student mid-course with an onboarding screen */
    if (Object.keys(s.lessons || {}).length || s.examAsked) { s.trackAsked = true; s.placeAsked = true; }
  }
  s.v = SCHEMA;
  return s;
}
let S;
try { S = migrate(Object.assign({}, DEFAULT_STATE, JSON.parse(localStorage.getItem("qudratState") || "{}"))); }
catch (e) {
  S = Object.assign({}, DEFAULT_STATE);
  /* a save that no longer reads used to be replaced, silently, by a new
     student's on the first save (the audit, 2026-10-28): it is kept aside
     first, and the student is told */
  try {
    const raw = localStorage.getItem("qudratState");
    if (raw) {
      localStorage.setItem("qudratState.unread", raw);
      setTimeout(() => toast("تعذّرت قراءة تقدّمك المحفوظ فبدأنا من جديد — النسخة القديمة باقية في جهازك"), 1200);
    }
  } catch (e2) {}
}
/* migrate pre-rank-system saves: seed lifetime XP from current gems, and mark
   the current tier as already-seen so we don't fire a celebration on load */
if (S.totalXp == null) S.totalXp = Math.max(0, S.xp || 0);
if (S.tierSeen == null) S.tierSeen = tierIndex();

/* A shallow Object.assign leaves a nested null as null, and one null here
   used to blank the whole app with no way back to Settings. Coerce the
   containers before anything reads them. */
(function repair() {
  const shape = { streak: { count: 0, last: null }, lessons: {}, qstats: {}, mistakes: {}, mocks: [], days: {}, reports: {}, learn: {} };
  for (const k in shape) {
    const want = shape[k], got = S[k];
    const ok = Array.isArray(want) ? Array.isArray(got) : (got && typeof got === "object");
    if (!ok) S[k] = Array.isArray(want) ? [] : Object.assign({}, want);
  }
  /* and the entries inside them: one null answer record threw on every tab,
     Settings included, so neither restore nor delete could be reached */
  ["qstats", "lessons", "learn", "teach"].forEach(k => {
    const o = S[k];
    if (o && typeof o === "object" && !Array.isArray(o)) for (const id in o) if (!o[id] || typeof o[id] !== "object") delete o[id];
  });
  for (const id in S.qstats) { const q = S.qstats[id]; q.r = +q.r || 0; q.w = +q.w || 0; }
  /* a streak whose last day is neither today nor yesterday is already broken;
     show 0 rather than a number that can never be extended */
  const t = todayKey(), d = new Date(Date.now() - 864e5);
  const y = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  /* a last day later than today is not broken: it was counted in a time zone
     further east (a student who flew west kept a streak of ٥ and was shown ٠) */
  const lt = dayKeyTime(S.streak.last);
  if (!lt || lt < dayKeyTime(y)) S.streak.count = 0;
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
  if (dayKeyTime(S.streak.last) > dayKeyTime(t)) return false;   // counted on a later date in a time zone further east: today is already in it
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
["pointerdown", "keydown", "touchend", "click"].forEach(evt =>
  document.addEventListener(evt, function unlock() {
    try { audioCtx(); loadCorrectBuffer(); } catch (e) {}
    if (AC && AC.state === "running") ["pointerdown", "keydown", "touchend", "click"].forEach(e2 => document.removeEventListener(e2, unlock));
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
/* the rank-up is heard in Duolingo's own files (the user, 2026-10-26: «take the
   sound of rank up from Duolingo itself»). Duolingo's promotion screen plays no
   sound of its own (leaderboard_refresh_result.riv carries none; it only buzzes,
   a faint two seconds and a 100ms pulse on the landing), so its league sounds
   play on our beats: card_unlock as the padlock springs, the gold lock-in on
   the burst, with that landing pulse */
const sndRankUp = () => { sfxPlay("lbGold", 1, () => beep([[659, .09], [784, .09], [1047, .1], [1319, .26]])); buzz(100); };
const sndRankUnlock = () => sfxPlay("lbUnlock", 1, () => beep([[392, .06], [523, .08]]));

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
/* The clip decoded into an AudioBuffer, so the first correct answer plays it
   from memory instead of spinning up a media element: on Android that spin-up
   was a visible hitch right under the jump. Decoded after the first tap (the
   context is unlocked by then); the element pool below stays as the fallback. */
let correctBuf = null, correctBufP = null;
function loadCorrectBuffer() {
  if (correctBufP || !window.fetch) return;
  const ac = audioCtx();
  if (!ac) return;
  correctBufP = fetch(CORRECT_SRC).then(r => r.arrayBuffer())
    .then(ab => new Promise((res, rej) => ac.decodeAudioData(ab, res, rej)))
    .then(b => { correctBuf = b; })
    .catch(() => { correctBufP = null; });
}
function playCorrect() {
  if (!S.sound) return;
  if (correctBuf && AC) {
    try {
      const src = AC.createBufferSource(), g = AC.createGain();
      src.buffer = correctBuf; g.gain.value = 0.75;
      src.connect(g); g.connect(AC.destination); src.start();
      return;
    } catch (e) { /* fall through to the element pool */ }
  }
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
/* ---- when should this come back? ------------------------------------------
   The list knew what a student had missed and never when to show it again, so
   review only happened if they went looking. A missed question is due at once;
   getting it right once pushes it two days out, because the gap is the part
   that makes it stick; the second correct answer on a later day retires it.
   `due` is a day key, so it survives a timezone move and reads plainly in a
   backup. A record from before this existed has no `due` and counts as due. */
const SRS_GAP = 2;                                  // days between the first and second correct answer
function dayKeyAdd(days) {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days);
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}
function dayKeyTime(k) {
  const a = String(k || "").split("-");
  if (a.length !== 3) return 0;
  return new Date(+a[0], +a[1] - 1, +a[2]).setHours(0, 0, 0, 0);
}
function daysSinceKey(k) {
  const t = dayKeyTime(k);
  if (!t) return null;
  return Math.round((dayKeyTime(todayKey()) - t) / 864e5);
}
function isDue(rec) {
  if (!rec || typeof rec !== "object" || !rec.due) return true;
  return dayKeyTime(rec.due) <= dayKeyTime(todayKey());
}
function dueCount() { return mistakeList().filter(x => x.due).length; }

function noteAnswer(q, correct) {
  S.mistakes = S.mistakes || {};
  S.teach = S.teach || {};
  const cur = S.mistakes[q.id];
  const rec = (cur && typeof cur === "object") ? cur : (cur ? { t: cur, ok: 0, day: null } : null);
  if (correct) {
    if (!rec) return;
    const today = todayKey();
    if (rec.day === today) return;                 // same-day retry does not count
    rec.ok = (rec.ok || 0) + 1; rec.day = today; rec.t = Date.now();
    rec.due = dayKeyAdd(SRS_GAP);
    if (rec.ok >= 2) delete S.mistakes[q.id];
    else S.mistakes[q.id] = rec;
    return;
  }
  S.mistakes[q.id] = { t: Date.now(), ok: 0, day: null, due: todayKey(), n: ((rec && rec.n) || 0) + 1 };
}
/* mistakes that still exist in the bank and match the current track, newest first */
function mistakeList() {
  const m = S.mistakes || {};
  return Object.keys(m).map(id => {
    const v = m[id], o = (v && typeof v === "object") ? v : { t: v, ok: 0 };
    return { id, t: o.t, ok: o.ok || 0, n: o.n || 1, due: isDue(o), dueKey: o.due || todayKey(), rec: questionById(id) };
  })
    .filter(x => x.rec && trackFilter([x.rec.q]).length)
    /* Due first — that is the whole point of a schedule — then the ones missed
       most often, then the oldest. It used to be strictly oldest-first with the
       drill taking the top twelve, so everything behind them was unreachable. */
    .sort((a, b) => (b.due - a.due) || (dayKeyTime(a.dueKey) - dayKeyTime(b.dueKey)) || (b.n - a.n) || (a.t - b.t));
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
  questBump();
}
function questBump() {
  if (S.daily.n >= dailyGoal()) return;
  S.daily.n++;
  if (SES) SES.qd = (SES.qd || 0) + 1;   // the progress screen fills the day's bar from where this lesson found it
  if (S.daily.n === dailyGoal()) { clearTimeout(QB_T); QB_T = setTimeout(A.questBanner, 1200); }
}
/* A quick check is a question the student answered, and counting it is what
   puts the chest inside the first session at all: the goal is ten and a lesson
   serves eight, so a student who cleared lesson one perfectly ended the day on
   ٨/١٠ and never saw the ceremony — while a student who got everything wrong
   reached ten through the retries and did. */
function questTick() { dailyReset(); questBump(); }

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

/* ---------------- screens / router ---------------- */
let view = "path";
function renderSidebar() {
  const el = document.getElementById("sidebar");
  if (!el) return;
  const NAV = [
    { k: "path",     icon: "nav-home",   label: "الدروس",          short: "الدروس" },
    { k: "league",   icon: "nav-league", label: "الدوري",           short: "الدوري" },
    { k: "mock",     icon: "nav-exam",   label: "اختبار تجريبي",   short: "تجريبي" },
    { k: "stats",    icon: "nav-stats",  label: "إحصائياتي",       short: "إحصائيات" },
    { k: "review",   icon: "target",     label: "مراجعة الأخطاء",  short: "الأخطاء" },
    { k: "settings", icon: "nav-more",   label: "الإعدادات",       short: "إعدادات" },
  ];
  el.innerHTML = `
    <div class="sb-logo">
      <img src="assets/app-icon/favicon-96.png" width="34" height="34" alt="" aria-hidden="true">
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
  const goal = Math.min(S.daily.n, dailyGoal());
  const questPct = Math.round(goal / dailyGoal() * 100);
  const questReady = S.daily.n >= dailyGoal() && !S.daily.claimed;
  const questSub = S.daily.claimed ? "استلمت صندوق اليوم — عُد غداً"
    : S.daily.n >= dailyGoal() ? "صندوقك جاهز — افتحه الآن!"
      : `باقي ${toAr(dailyGoal() - S.daily.n)} من الأسئلة`;

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
          <b>${toAr(goal)} / ${toAr(dailyGoal())} أسئلة</b>
        </div>
        <div class="duo-bar"><i style="width:${questPct}%;--bar-c:var(--gold);--bar-shine:var(--gold-soft)"></i></div>
        <div class="as-quest-sub">${questSub}</div>
      </button>
    </div>`;
}

function render() {
  ({ path: renderPath, league: renderLeague, mock: renderMockHome, stats: renderStats, settings: renderSettings, review: renderReview })[view]();
  flushRankUp();
  renderSidebar();
  renderAside();
}
function go(v) { sfxHush(); sayStop(); view = v; render(); window.scrollTo(0, 0); }

const ICO_FILE = { "nav-exam": "nav-exam-64.png" }; // raster icons (user-provided art)
/* exam day: the target drawn, not the emoji it was (the audit, 2026-10-28;
   the user, 2026-10-27: no emoji a student sees) */
const TARGET_IC = '<img class="ic-target" src="assets/icons/target.svg" width="30" height="28" alt="">';
const ico = (name, size) => `<img class="ic" src="assets/icons/${ICO_FILE[name] || name + ".svg"}" width="${size}" height="${size}" alt="">`;

/* ---------------- فهيم (the mascot) ----------------
   One flat PNG per emotional state. Only the states whose art actually exists
   are listed: a name that is not here renders nothing at all rather than a
   broken-image icon on a live site. Add a key the same day you add its file.

   `cls` carries the motion (pop / bob / bob-fast / shake) and the placement
   class. He is decorative in every placement — the screen always states its
   own meaning in text — so alt is empty and he is hidden from assistive tech. */
const MASCOT_STATES = { celebrate: 1, strong: 1, point: 1, wave: 1, encourage: 1, cheer: 1, teach: 1 };
function mascot(state, cls) {
  if (!MASCOT_STATES[state]) return "";
  return `<img class="mascot ${cls || ""}" src="assets/mascot/qaddour-${state}.png" alt="" aria-hidden="true">`;
}

/* The win-screen hero. Nothing behind him: the character is the celebration.
   One jump only, and it is the entrance: he drops in from above under gravity, lands
   hard with a squash as the title pops, springs back, and then stands there, alive
   but still — a slow sway, never another hop. The grammar is the card's jump
   (fxAddJump): stretch on the fall, squash on impact, a back-out settle — driven by
   GSAP so every beat has its own ease. A live shadow under him grows as he comes down
   and spreads on impact; the painted one was cut off the PNG for exactly this. */
function winHero(size) {
  return `<div class="win-hero qd-hero" style="--wh:${size || 236}px">
    <span class="qd-shadow"></span>
    ${mascot("celebrate", "qd-mascot")}
  </div>`;
}
let qdTl = null;
function winHeroStop() { if (qdTl) { qdTl.kill(); qdTl = null; } if (wnTl) { wnTl.kill(); wnTl = null; } }
function winHeroPlay() {
  winHeroStop();
  const el = document.querySelector(".qd-mascot"), sh = document.querySelector(".qd-shadow");
  if (!el || !sh || !window.gsap) return;
  if (motionReduced()) { gsap.set(el, { opacity: 1 }); gsap.set(sh, { opacity: 1 }); return; }
  const H = el.getBoundingClientRect().height || 236;
  const P = v => +(v * H / 236).toFixed(1);          // travel scales with the hero's size
  gsap.set(el, { transformOrigin: "50% 100%", opacity: 0 });
  gsap.set(sh, { transformOrigin: "50% 50%", opacity: 0, scaleX: .4 });

  const tl = qdTl = gsap.timeline();
  /* the drop: gravity in, a hard squash, a springy settle */
  tl.fromTo(el, { y: P(-320), scaleX: .95, scaleY: 1.1, opacity: 1 },
               { y: 0, duration: .5, ease: "power2.in" }, .12)
    .to(el, { y: P(4), scaleX: 1.14, scaleY: .84, duration: .08, ease: "power1.in" })
    .to(el, { y: 0, scaleX: 1, scaleY: 1, duration: .34, ease: "back.out(2.4)" });
  tl.to(sh, { opacity: 1, scaleX: 1, duration: .5, ease: "power2.in" }, .12)
    .to(sh, { scaleX: 1.28, opacity: .5, duration: .08 })
    .to(sh, { scaleX: 1, opacity: 1, duration: .34, ease: "back.out(2)" });

  /* then he stays down: a slow sway so he is alive, no more air */
  const idle = gsap.timeline({ repeat: -1, yoyo: true });
  idle.to(el, { rotation: 2.5, duration: 1.6, ease: "sine.inOut" })
      .to(el, { rotation: -2.5, duration: 1.6, ease: "sine.inOut" });
  tl.add(idle, 1.1);
}

/* the exam's days, at the right of the bar once a date is set (the user,
   2026-10-28: «my date of exam will be top right»): the card that held them
   gave its place to فهيم's challenge. A tap opens the date picker, as the card did. */
const CAL_SVG = `<svg class="cal-ic" viewBox="0 0 24 24" aria-hidden="true"><rect class="ci-b" x="2.5" y="4.5" width="19" height="17" rx="4.5"/><path class="ci-h" d="M2.5 9.6V9a4.5 4.5 0 0 1 4.5-4.5h10A4.5 4.5 0 0 1 21.5 9v.6z"/><path class="ci-r" d="M8 2.6v4M16 2.6v4"/></svg>`;
function statExam() {
  const days = examDaysLeft();
  if (days === null || days < 0) return "";
  return `<button class="stat stat-exam ec2-${examTone(days)}" onclick="A.examSetup()" aria-label="${days ? "باقي على اختبارك " + dayPhrase(days) : "اختبارك اليوم"}">${CAL_SVG}<span>${days ? toAr(days) : "اليوم"}</span></button>`;
}
function statbar() {
  const t = LEAGUE_TIERS[tierIndex()];
  return `<div class="statbar">
    ${statExam()}
    <div class="stat stat-streak${S.streak.count ? "" : " zero"}" title="سلسلة الأيام" aria-label="سلسلة الأيام: ${toAr(S.streak.count)}">${ico("streak", 23)}${toAr(S.streak.count)}</div>
    <button class="stat stat-rank" onclick="A.go('league')" title="المستوى ${t.name}" aria-label="مستواك: ${t.name}">
      ${rankImg(t.key, 25)}<span>${t.name}</span>
    </button>
    <div class="stat stat-xp" title="جواهرك">${ico("gem", 22)}${toAr(S.xp)}</div>
  </div>`;
}
A.chestTap = function () {
  dailyReset();
  if (S.daily.claimed) { chestTip("عُد غداً لصندوق جديد"); return; }
  if (S.daily.n >= dailyGoal()) { A.openChest(); return; }
  chestTip(`باقي <b>${qCount(dailyGoal() - S.daily.n)}</b> لفتح صندوق اليوم`);
};
/* the chest answers in a speech bubble over itself, the path's white node tip with its tail on the
   chest; it pops in, floats, and leaves after a moment. Off the path there is no chest to point at. */
/* the tenth answer of the day: a white quest card drops in from the top of the lesson — the chest, the
   title, and the day's bar filling its last step as the count turns over — then lifts away. */
let questBannerT = 0;
A.questBanner = function () {
  document.querySelectorAll(".quest-banner").forEach(e => e.remove());
  if (document.querySelector(".wn, .wp")) return;   // the lesson already ended: its progress screen tells it
  const el = document.createElement("div"); el.className = "quest-banner"; el.setAttribute("role", "status");
  el.innerHTML = `<div class="qb-card">
    ${chestSVG("qb-chest")}
    <div class="qb-txt"><b>اكتمل تمرين اليوم!</b><span>صندوقك بانتظارك في الرئيسية</span>
      <div class="qb-bar"><div class="duo-bar"><i style="width:${Math.round((dailyGoal() - 1) / dailyGoal() * 100)}%;--bar-c:var(--gold);--bar-shine:var(--gold-soft)"></i></div><em>${toAr(dailyGoal() - 1)}/${toAr(dailyGoal())}</em></div>
    </div></div>`;
  document.body.appendChild(el); snd("quest-banner");
  const fill = () => { el.querySelector(".duo-bar > i").style.width = "100%"; el.querySelector(".qb-bar em").textContent = `${toAr(dailyGoal())}/${toAr(dailyGoal())}`; el.classList.add("full"); };
  if (motionReduced()) fill(); else setTimeout(fill, 650);
  clearTimeout(questBannerT);
  questBannerT = setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 420); }, 3600);
};
let chestTipT = 0;
function chestTip(msg) {
  snd("chest-tip");
  const host = document.querySelector(".chest-float");
  if (!host) { toast(msg.replace(/<[^>]+>/g, "")); return; }
  host.querySelectorAll(".chest-tip").forEach(e => e.remove());
  const tip = document.createElement("span"); tip.className = "chest-tip"; tip.setAttribute("role", "status");
  tip.innerHTML = msg + '<svg class="ct-tail" viewBox="0 0 32 19" aria-hidden="true"><path d="M1 0H31C25 2.5 20.5 8 17.6 15.2 16.8 17.2 15.2 17.2 14.4 15.2 11.5 8 7 2.5 1 0Z" fill="#fff"/><path d="M1 0C7 2.5 11.5 8 14.4 15.2 15.2 17.2 16.8 17.2 17.6 15.2 20.5 8 25 2.5 31 0" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  host.appendChild(tip);
  clearTimeout(chestTipT);
  chestTipT = setTimeout(() => { tip.classList.add("out"); setTimeout(() => tip.remove(), 240); }, 2600);
}
function bottomnav(active) {
  /* the labels were the state keys — "path", "league" — read aloud in Arabic */
  const items = [["path", "nav-home", "الدروس"], ["league", "nav-league", "الدوري"],
    ["mock", "nav-exam", "اختبار تجريبي"], ["stats", "nav-stats", "إحصائياتي"], ["settings", "nav-more", "الإعدادات"]];
  return `<nav class="bottomnav">` + items.map(([k, i, label]) => {
    const act = active === k;
    return `<button class="navbtn ${act ? "active" : ""}" onclick="A.go('${k}')" aria-label="${label}"${act ? ' aria-current="page"' : ""}>${ico(i, 30)}</button>`;
  }).join("") + `</nav>`;
}

/* ---------------- exam countdown card (top of path) ---------------- */
/* ============================================================
   EXAM COUNTDOWN
   ------------------------------------------------------------
   The old card buried the only number that matters inside a
   sentence, drew readiness as a continuous bar that looks broken
   at 3%, and looked identical at thirty days and at three. On a
   screen of solid green banners and big round nodes it read as a
   settings row.

   Now: the day count is the object, sized and coloured to be read
   first. The colour escalates as the date closes, so the card
   changes character on its own. Readiness is ten segments rather
   than one bar — a sliver of a bar reads as broken, one lit
   segment out of ten reads as started.
   ============================================================ */
/* Duolingo's chevron: a stroked path with round caps and joins, not a glyph.
   A text ← renders at the mercy of whatever font is loaded and sits on the
   text baseline; this one is centred and scales with the box. */
const REFRESH_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true">
  <path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 3.5V8h-4.5"/></svg>`;
const CHEV_SVG = `<svg class="ec2-chev" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5 8 12 15 19" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function examTone(days) {
  if (days === 0) return "today";
  if (days <= 7) return "urgent";
  if (days <= 14) return "near";
  if (days <= 30) return "soon";
  return "far";
}

/* One row above the path, and only when it has something to say: what the schedule
   says is ripe, or — once a student has enough history to aim at — practice drawn from
   the domains they are weakest in. A beginner sees neither and just walks the path. */
function dueCard() {
  /* Before anything else: a streak about to be lost without the student being
     told. repair() has already zeroed any streak older than yesterday, so a
     count that survives here means they practised yesterday and not yet today. */
  const st = S.streak || { count: 0, last: null };
  if (st.count > 0 && st.last !== todayKey() && new Date().getHours() >= 17)
    return `<button type="button" class="due-card due-risk" onclick="A.startStreakSave()">
      <span class="due-ico">${ico("streak", 22)}</span>
      <span class="due-tx"><b>سلسلتك في خطر</b><span>${dayPhrase(st.count)} — درس واحد اليوم يحفظها</span></span>
      <span class="due-go">أكمل</span>
    </button>`;
  const n = dueCount();
  if (n) return `<button type="button" class="due-card" onclick="A.startReview()">
    <span class="due-ico">${ico("target", 22)}</span>
    <span class="due-tx"><b>مراجعة اليوم</b><span>${qCount(n)} بانتظار المراجعة</span></span>
    <span class="due-go">راجع</span>
  </button>`;
  if (Object.keys(S.qstats || {}).length < 16) return "";
  const w = weakestDomain();
  if (!w) return "";
  return `<button type="button" class="due-card due-mix" onclick="A.startMix()">
    <span class="due-ico">${ico("lightning", 22)}</span>
    <span class="due-tx"><b>تدريب مخصص</b><span>${toAr(MIX_N)} أسئلة، أكثرها من ${esc(w.title)}</span></span>
    <span class="due-go">ابدأ</span>
  </button>`;
}

/* «فهيم يتحدّاك» (the user, 2026-10-28, picked from tools/home-top.html round 4
   and asked for it in the app, which puts فهيم on the path for the first time):
   one quick mental-maths question of the exam's kind in his bubble, two answers,
   endless, with a run of right answers in a row. Nothing is saved and nothing is
   paid — it is a warm-up the student plays with, not a lesson. Every question's
   numbers keep the answer whole and the wrong choice positive and different. */
const FQ = { run: 0, Q: null, busy: false, last: "" };
function fqMake() {
  const r = n => Math.floor(Math.random() * n);
  for (let tries = 0; tries < 8; tries++) {
    const k = r(5);
    let q, a, w;
    if (k === 0) { const x = 3 + r(7), y = 3 + r(7); q = `${toAr(x)} × ${toAr(y)}`; a = x * y; w = a + (r(2) ? x : -y); }
    else if (k === 1) { const y = [4, 8, 12, 16, 24][r(5)]; q = `${toAr(25)} × ${toAr(y)}`; a = 25 * y; w = a + (r(2) ? 25 : -25); }
    else if (k === 2) { const p = [10, 20, 25, 50][r(4)], b = [40, 60, 80, 120, 200][r(5)]; q = `${toAr(p)}٪ من ${toAr(b)}`; a = p * b / 100; w = a * 2; }
    else if (k === 3) { const x = 12 + r(30), y = 9 + r(20); q = `${toAr(x)} + ${toAr(y)}`; a = x + y; w = a + (r(2) ? 10 : -10); }
    else { const y = 3 + r(6), a0 = 4 + r(8); q = `${toAr(a0 * y)} ÷ ${toAr(y)}`; a = a0; w = a0 + (r(2) ? 1 : -1) * (1 + r(2)); }
    if (q === FQ.last) continue;
    FQ.last = q;
    return { q, a, ch: r(2) ? [a, w] : [w, a] };
  }
  return { q: `${toAr(25)} × ${toAr(4)}`, a: 100, ch: [100, 75] };
}
/* his words a word at a time, as he speaks in the first run; *…* in blue */
function fqSay(t) {
  let blue = false;
  return String(t).split(" ").filter(Boolean).map((w, i) => {
    const open = w.startsWith("*"), close = w.replace(/[!.،؟:]+$/, "").endsWith("*");
    if (open) blue = true;
    const txt = esc(w.replace(/\*/g, "")), on = blue;
    if (close) blue = false;
    return `<span class="fq-w" style="--i:${i}">${on ? `<em>${txt}</em>` : txt}</span>`;
  }).join(" ");
}
function fqBub(first) {
  return `<div class="fq-top"><span class="fq-q">${FQ.Q.q} = ؟</span><span class="fq-run${FQ.run > 1 ? " on" : ""}" aria-label="${toAr(FQ.run)} ورا بعض">${ico("streak", 16)}<b>${toAr(FQ.run)}</b></span></div>
    <div class="fq-ch">${FQ.Q.ch.map((c, i) => `<button type="button" class="fq-b" onclick="A.fqPick(${i})">${toAr(c)}</button>`).join("")}</div>
    <div class="fq-say" aria-live="polite">${first ? fqSay("حلّها بدون ورقة!") : ""}</div>`;
}
function fqCard() {
  if (!FQ.Q) FQ.Q = fqMake();
  sndWarm(["incorrect", "toggle-on", "streak-celebration"]);
  return `<section class="fq" aria-label="فهيم يتحدّاك">
    <button type="button" class="fq-guy" onclick="A.fqPoke()" aria-label="فهيم">${mascot("teach")}</button>
    <div class="fq-bub">${fqBub(!FQ.busy)}</div>
  </section>`;
}
function fqHop(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function fqPose(state) { const img = document.querySelector(".fq-guy img"); if (img && MASCOT_STATES[state]) img.src = `assets/mascot/qaddour-${state}.png`; }
A.fqPick = function (i) {
  if (FQ.busy || !FQ.Q) return;
  const bub = document.querySelector(".fq-bub"); if (!bub) return;
  FQ.busy = true;
  const btns = Array.from(bub.querySelectorAll(".fq-b")), b = btns[i], right = FQ.Q.ch[i] === FQ.Q.a;
  const ok = btns[FQ.Q.ch.indexOf(FQ.Q.a)], say = bub.querySelector(".fq-say"), run = bub.querySelector(".fq-run");
  const guy = document.querySelector(".fq-guy");
  if (right) {
    FQ.run++;
    const five = FQ.run % 5 === 0;
    b.classList.add("ok"); btns.forEach(x => x !== b && x.classList.add("dim"));
    obJump(b);
    fqPose(five ? "celebrate" : "cheer"); fqHop(guy, "hop");
    say.innerHTML = fqSay(five ? `*${toAr(FQ.run)}* ورا بعض! أسطورة` : ["صح!", "كفو!", "سريع!", "ما شاء الله!", "عليك نور!"][FQ.run % 5]);
    run.querySelector("b").textContent = toAr(FQ.run);
    if (FQ.run > 1) { run.classList.add("on"); fqHop(run, "bump"); }
    playCorrect(); buzz(10);
    if (five) setTimeout(() => snd("fq-five"), 300);
  } else {
    FQ.run = 0;
    b.classList.add("bad"); setTimeout(() => { if (ok) { ok.classList.add("ok"); obJump(ok); } }, 380);
    fqPose("encourage"); fqHop(guy, "sad");
    say.innerHTML = fqSay(`الجواب *${toAr(FQ.Q.a)}*، الجاية لك!`);
    run.classList.remove("on");
    snd("fq-wrong", () => sndBad()); buzz([12, 40, 12]);
  }
  setTimeout(() => {
    FQ.Q = fqMake(); FQ.busy = false;
    const host = document.querySelector(".fq-bub");
    if (!host) return;
    host.innerHTML = fqBub(false); host.firstElementChild.classList.add("fq-in");
    fqPose("teach");
  }, right ? 1100 : 1700);
};
A.fqPoke = function () {
  const say = document.querySelector(".fq-say");
  fqHop(document.querySelector(".fq-guy"), "hop"); snd("fq-poke"); buzz(6);
  if (say && !FQ.busy) say.innerHTML = fqSay("ركّز! جاوب أول");
};

/* ---- practice aimed where it is needed ------------------------------------
   Every lesson is a single difficulty, so there is nothing to adapt *inside* one.
   What can adapt is which questions a student meets: first-try accuracy per domain
   is already in qstats, so the mix leans on the domain they are weakest in, tops up
   with anything they have never seen, and keeps a slot or two for what is due. */
const MIX_N = 10;
const FIRST_CHUNKS = 2;   // teaching chunks the very first lesson ever played serves
function domAccuracy() {
  const out = {};
  domains().forEach(d => {
    let r = 0, w = 0, seen = 0, total = 0, open = 0;
    d.lessons.forEach(l => {
      if (lessonProg(d.key + "." + l.key).stars) open++;
      trackFilter(l.questions).forEach(q => {
        total++;
        const s = S.qstats[q.id];
        if (s) { seen++; r += s.r || 0; w += s.w || 0; }
      });
    });
    out[d.key] = { key: d.key, title: d.title, seen, total, open, acc: (r + w) ? r / (r + w) : null };
  });
  return out;
}
/* Only a domain the student has actually opened can be practised, so only those are
   candidates — naming الهندسة as the weak spot while the mix cannot draw a single
   geometry question from it would be a lie the student can check. */
function weakestDomain() {
  const a = Object.values(domAccuracy()).filter(x => x.total && x.open);
  if (!a.length) return null;
  a.sort((x, y) => (x.acc === null ? -1 : y.acc === null ? 1 : x.acc - y.acc) || (x.seen / x.total - y.seen / y.total));
  return a[0];
}
/* The nudge has to land them in something finishable tonight: what is due if
   anything is, the next lesson if the path has one, else the mix. */
A.startStreakSave = function () {
  if (dueCount()) { A.startReview(); return; }
  const next = allLessons().find(x => !lessonProg(x.key).stars);
  if (next) { A.startLesson(next.dom.key, next.les.key); return; }
  A.startMix();
};

A.startMix = function () {
  snd("start-lesson");
  const acc = domAccuracy();
  const weights = {};
  Object.values(acc).forEach(x => { weights[x.key] = x.acc === null ? 1 : Math.max(0.12, 1 - x.acc); });
  const pool = [];
  domains().forEach(d => d.lessons.forEach(l => {
    if (!lessonProg(d.key + "." + l.key).stars) return;       // only what has been unlocked by playing
    trackFilter(l.questions).forEach(q => pool.push({ q, dom: d.key }));
  }));
  if (pool.length < 4) { toast("أكمل درساً أو درسين ثم جرّب التدريب المخصص"); return; }
  const score = x => {
    const s = S.qstats[x.q.id] || { r: 0, w: 0 };
    const unseen = !(s.r || s.w) ? 0.6 : 0;                   // never met beats met-and-passed
    const missed = Math.min(0.5, (s.w || 0) * 0.25);
    return weights[x.dom] + unseen + missed + Math.random() * 0.25;
  };
  const chosen = pool.sort((a, b) => score(b) - score(a)).slice(0, MIX_N * 3);
  const seen = {}, take = [];
  shuffle(chosen).forEach(x => {                              // no two questions from one lesson in a row
    if (take.length >= MIX_N) return;
    take.push(x.q); seen[x.q.id] = 1;
  });
  const due = mistakeList().filter(x => x.due && !seen[x.id]).slice(0, 3).map(x => x.rec.q);
  const qs = due.concat(take).slice(0, MIX_N).sort((a, b) => (a.difficulty || 2) - (b.difficulty || 2)).map(shuffleChoices);
  SES = { mode: "mix", domKey: null, lesKey: null, key: null, title: "تدريب مخصص", method: "",
    queue: qs.slice(), total: qs.length, idx: 0, done: 0, firstTry: {}, retried: {}, sel: null,
    locked: false, xp: 0, gems: 0, replay: true, xpBoost: false, hearts: LEVEL_HEARTS, notime: true, left: Q_SECS, timer: null, tSpent: 0, tAnswered: 0 };
  renderSession();
};

/* ---- the level test ---------------------------------------------------------
   A student three weeks from the exam who already knows the basics should not
   have to grind them. The old test could not be trusted to tell: it asked one
   random question per probed lesson (so the difficulty was luck), it stopped at
   the first unit missed (so a student weak in unit 1 and strong in geometry was
   never asked about geometry), and a pure guesser skipped lessons 30% of the time.

   Now every unit is asked, and placed on its own. Each unit is cut in two
   blocks of consecutive lessons — A, its lower half, and B, its harder upper
   half — and each block has two fixed slots (which lessons, which format), so
   every student meets the same test at the same difficulty, and the full run
   mirrors the exam's quantitative section: about two thirds arithmetic, a
   quarter geometry, one algebra item, and three comparisons (ETEC's own share).
   B is skipped only when both A answers of that unit were wrong — the unit
   stops, never the test. 8 to 16 questions, no hearts, no clock, no verdict.

   A unit is skipped whole at 3 of 4 right; its block A alone at both A right
   and both B wrong. Placements count only when the run is at least half right
   overall, or the unit was 4 of 4 — the guesser now skips anything 4% of the
   time, and a student strong in one domain alone still gets it.
   «ما أعرف» counts as a miss here and writes nothing to the stats. */
const PLACE_BLUEPRINT = {
  skills:   { a: 4, slots: [{ b: "A", ls: ["bigsum"] }, { b: "A", ls: ["probstats", "keylaws"] },
                            { b: "B", ls: ["equations"], cmp: 1, cat: "alg" }, { b: "B", ls: ["cycles", "simplify", "lcmgcd"] }],
              /* the theoretical exam has no algebra: its comparison comes from block A instead */
              lit:   [{ b: "A", ls: ["bigsum"] }, { b: "A", ls: ["fastest"], cmp: 1 },
                      { b: "B", ls: ["cycles", "simplify"] }, { b: "B", ls: ["lcmgcd", "simplify", "cycles"] }] },
  numbers:  { a: 2, slots: [{ b: "A", ls: ["fractions"] }, { b: "A", ls: ["fractions", "decimals"], cmp: 1 },
                            { b: "B", ls: ["roots", "powers"] }, { b: "B", ls: ["speed"] }] },
  ratios:   { a: 2, slots: [{ b: "A", ls: ["percent"] }, { b: "A", ls: ["profit"] },
                            { b: "B", ls: ["proportion"] }, { b: "B", ls: ["mean"] }] },
  geometry: { a: 4, slots: [{ b: "A", ls: ["angles", "triangle"] }, { b: "A", ls: ["rectangle", "square"] },
                            { b: "B", ls: ["quads", "shaded", "circle", "solids"], cmp: 1 }, { b: "B", ls: ["circle", "shaded", "solids"] }] }
};
const PLACE_GATE = .5;
/* one question for a slot: its format, a lesson this unit has not used yet,
   medium-or-harder where the lesson has it, and never seen before if possible */
function placePick(d, slot, used) {
  const seen = id => { const s = S.qstats[id]; return s ? (s.r || 0) + (s.w || 0) : 0; };
  const fmt = q => slot.cmp ? q.format === "comparison" : q.format !== "comparison";
  let pool = [];
  slot.ls.forEach(k => {
    const l = d.lessons.find(x => x.key === k);
    if (l && !used[k]) trackFilter(l.questions).filter(fmt).forEach(q => pool.push({ q, k }));
  });
  if (!pool.length) slot.ls.forEach(k => { const l = d.lessons.find(x => x.key === k); if (l) l.questions.forEach(q => pool.push({ q, k })); });
  if (!pool.length) return null;
  const hard = pool.filter(x => (x.q.difficulty || 2) >= 2);
  if (hard.length) pool = hard;
  /* a slot that spans lessons of different ratings takes the lowest one, so its
     difficulty is the slot's and not the luck of which lesson came up */
  const lo = Math.min(...pool.map(x => x.q.difficulty || 2));
  pool = pool.filter(x => (x.q.difficulty || 2) === lo);
  const least = Math.min(...pool.map(x => seen(x.q.id)));
  const pick = shuffle(pool.filter(x => seen(x.q.id) === least))[0];
  used[pick.k] = 1;
  return pick;
}
A.startPlacement = function () {
  const items = [];
  domains().forEach(d => {
    const bp = PLACE_BLUEPRINT[d.key]; if (!bp) return;
    const used = {};
    (S.track === "lit" && bp.lit ? bp.lit : bp.slots).forEach(slot => {
      const p = placePick(d, slot, used);
      if (p) items.push({ q: p.q.format === "comparison" ? p.q : shuffleChoices(p.q), dom: d.key, b: slot.b, les: p.k,
        cat: slot.cat || (d.key === "geometry" ? "geo" : "ar") });
    });
  });
  if (items.length < 4) { toast("بنك الأسئلة غير متاح"); return; }
  SES = { mode: "place", domKey: null, lesKey: null, key: null, title: "تحديد المستوى", method: "",
    queue: items.map(x => x.q), place: items, plLog: {}, total: items.length, idx: 0, done: 0,
    firstTry: {}, retried: {}, sel: null, locked: false, xp: 0, gems: 0, replay: true, xpBoost: false,
    hearts: 999, notime: true, left: Q_SECS, timer: null, tSpent: 0, tAnswered: 0 };
  renderSession();
};
const PLACE_CAT = { ar: "حساب", geo: "هندسة", alg: "جبر" };
/* the four units, with how far into each the test has got */
function placeUnits() {
  return domains().filter(d => SES.place.some(x => x.dom === d.key)).map(d => {
    const mine = SES.place.filter(x => x.dom === d.key);
    return { d, n: mine.length, ans: mine.filter(x => SES.plLog[x.q.id]).length };
  });
}
function renderPlace() {
  const it = SES.place[SES.idx];
  const units = placeUnits(), cur = units.findIndex(u => u.d.key === it.dom);
  /* four segments, one per unit, never «سؤال ٣ من ١٦»: the count is not known in
     advance, and a unit whose upper half is skipped simply fills */
  const segs = units.map((u, k) => {
    const w = k < cur ? 100 : k === cur ? Math.round(u.ans / u.n * 100) : 0;
    return `<span class="pl-seg${k < cur ? " done" : ""}"><i data-w="${w}" style="width:${k === cur ? SES.plFill || 0 : w}%"></i></span>`;
  }).join("");
  $app.innerHTML = `<div class="screen screen-full screen-session screen-place">
      <div class="session-top">
        <button class="x-btn" onclick="A.plQuit()" aria-label="إيقاف الاختبار">${X_SVG}</button>
        <div class="pl-segs" role="progressbar" aria-label="الوحدة ${toAr(cur + 1)} من ${toAr(units.length)}">${segs}</div>
      </div>
      <div class="pl-unit"><span class="pl-tag pl-${it.cat}">${PLACE_CAT[it.cat]}</span><b>الوحدة ${toAr(cur + 1)}</b><span>${esc(units[cur].d.title)}</span></div>
      <div class="q-area pl-q">${questionBody(it.q, SES.sel, false, null, null)}</div>
      <div class="action-bar pl-actions">
        <button class="btn btn-ghost" onclick="A.plSkip()">ما أعرف</button>
        <button class="btn" id="checkBtn" onclick="A.check()" ${SES.sel === null ? "disabled" : ""}>التالي</button>
      </div>
      <div class="storm" id="storm" aria-hidden="true"></div>
    </div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const seg = document.querySelectorAll(".pl-seg > i")[cur]; if (seg) seg.style.width = seg.dataset.w + "%";
    if (SES && SES.mode === "place") SES.plFill = +(seg && seg.dataset.w || 0);
  }));
  fxBindPress();
  SES.qStart = Date.now();
}
function plAnswer(skip, instant) {
  if (!SES || SES.mode !== "place" || SES.locked || (!skip && SES.sel === null)) return;
  SES.locked = true;
  const it = SES.place[SES.idx], q = it.q, ok = !skip && SES.sel === q.answer;
  SES.firstTry[q.id] = ok;
  SES.plLog[q.id] = { ok, skip: !!skip, t: Math.min(180, Math.round((Date.now() - (SES.qStart || Date.now())) / 1000)) };
  /* a «ما أعرف» is not an answer: it places nothing and teaches the stats nothing */
  if (!skip) { const qs = S.qstats[q.id] = S.qstats[q.id] || { r: 0, w: 0 }; ok ? qs.r++ : qs.w++; }
  SES.done++;
  const blockA = SES.place.filter(x => x.dom === it.dom && x.b === "A");
  if (it.b === "A" && blockA.every(x => SES.plLog[x.q.id] && !SES.plLog[x.q.id].ok))
    SES.place = SES.place.filter((x, j) => j <= SES.idx || x.dom !== it.dom);
  SES.queue = SES.place.map(x => x.q); SES.total = SES.place.length;
  save();
  const go = () => {
    if (!SES || SES.mode !== "place") return;
    SES.idx++; SES.sel = null; SES.locked = false;
    if (SES.idx < SES.place.length && SES.place[SES.idx].dom !== it.dom) SES.plFill = 0;
    SES.idx >= SES.place.length ? placementComplete() : renderPlace();
  };
  if (instant) { go(); return; }
  snd(skip ? "placement-dont-know" : "placement-answer", () => sndTap());
  document.querySelectorAll(".screen-place .choice, .pl-actions .btn").forEach(b => { b.disabled = true; });
  /* every answer lands with the lesson's jump — here on whatever was picked, so
     it says «taken», never «right» (the test gives no verdict) */
  const card = document.querySelector(".screen-place .choice.sel");
  let wait = skip ? 140 : 340;
  if (card && window.gsap && !fxReduced()) {
    const J = FX_JUMP;
    fxAddJump(gsap.timeline(), card, 0);
    wait = Math.round((J.launch + J.rise + J.hang + J.fall + J.impact + J.settle) * 1000) + 80;
  }
  setTimeout(go, wait);
}
A.plSkip = function () { plAnswer(true); };
A.plQuit = function () {
  askConfirm("توقف الاختبار؟", "نحسب لك اللي جاوبته — والباقي تبدأه من أوله.", "أكمل الاختبار", "أوقف وشوف نتيجتي", () => {
    if (!SES || SES.mode !== "place") { go("path"); return; }
    SES.place = SES.place.filter(x => SES.plLog[x.q.id]);
    placementComplete();
  });
};
A.debugPlace = function (i) { if (!SES || SES.mode !== "place") return "none"; SES.sel = i; plAnswer(false, true); return "ok"; };

/* A level a student can read — never a predicted exam score, which sixteen
   questions cannot honestly give. It counts the lessons the test let them skip. */
const PLACE_LEVELS = [
  { name: "مبتدئ", line: "نبني الأساس معك خطوة خطوة — وبتشوف الفرق بسرعة" },
  { name: "أساسي", line: "عندك أساس — تخطّينا اللي تعرفه" },
  { name: "متوسط", line: "مستواك طيب — نكمّل من حيث تحتاج" },
  { name: "متقدم", line: "قوي! باقي لك القليل" },
  { name: "ممتاز", line: "أتقنت كل الوحدات — المحاكاة خطوتك الجاية" }
];
const placeLevel = n => n >= 24 ? 4 : n >= 16 ? 3 : n >= 8 ? 2 : n >= 1 ? 1 : 0;
/* The five levels as a gauge: the needle swings further and the arc fills
   greener at each one, so the scale reads at a glance. (The user turned down
   signal bars — they read as wifi — and then a growing plant as unclear.) */
const LV_FILL = [.1, .3, .5, .72, 1];
const LV_TONE = ["red", "orange", "gold", "lime", "green"];      // red to green, a step apart each
function levelIcon(i, size) {
  i = Math.max(0, Math.min(4, i));
  const f = LV_FILL[i];
  return `<svg class="lv" viewBox="0 0 48 34" width="${size || 46}" height="${Math.round((size || 46) * 34 / 48)}" aria-hidden="true" style="--f:${(f * 100).toFixed(0)};--a:${Math.round(f * 180)}deg;--tone:var(--${LV_TONE[i]})">
    <path class="lv-track" d="M6 28A18 18 0 0 1 42 28"/>
    <path class="lv-arc" d="M6 28A18 18 0 0 1 42 28" pathLength="100"/>
    <line class="lv-needle" x1="24" y1="28" x2="10" y2="28"/>
    <circle class="lv-hub" cx="24" cy="28" r="4"/>
  </svg>`;
}
function placementComplete() {
  snd("placement-complete");
  const log = SES.plLog, items = SES.place;
  const asked = items.filter(x => log[x.q.id]);
  const right = asked.filter(x => log[x.q.id].ok).length;
  const gate = asked.length && right / asked.length >= PLACE_GATE;
  const place = (d, l) => {
    const key = d.key + "." + l.key, p = S.lessons[key] = S.lessons[key] || { stars: 0, plays: 0 };
    if (!p.stars) { p.stars = 1; p.placed = true; }
  };
  const units = domains().map(d => {
    const bp = PLACE_BLUEPRINT[d.key] || { a: 0 };
    const mine = items.filter(x => x.dom === d.key);
    const A = mine.filter(x => x.b === "A" && log[x.q.id] && log[x.q.id].ok).length;
    const B = mine.filter(x => x.b === "B" && log[x.q.id] && log[x.q.id].ok).length;
    let res = A + B >= 3 ? "full" : A === 2 ? "half" : "none";
    if (!gate && A + B < 4) res = "none";
    if (res === "full") d.lessons.forEach(l => place(d, l));
    if (res === "half") d.lessons.slice(0, bp.a).forEach(l => place(d, l));
    return { d, res, a: bp.a, dots: mine.map(x => log[x.q.id] ? (log[x.q.id].ok ? "ok" : "no") : "off") };
  });
  /* the path starts at the first lesson without a star, wherever the test left gaps */
  const flat = allLessons(), start = flat.find(x => !lessonProg(x.key).stars);
  const nPlaced = flat.filter(x => lessonProg(x.key).placed && !lessonProg(x.key).plays).length;
  const before = start ? flat.slice(0, flat.indexOf(start)).some(x => lessonProg(x.key).placed && !lessonProg(x.key).plays) : false;
  const cats = {};
  asked.forEach(x => { const c = cats[x.cat] = cats[x.cat] || { r: 0, n: 0 }; c.n++; if (log[x.q.id].ok) c.r++; });
  const times = asked.filter(x => log[x.q.id].ok).map(x => log[x.q.id].t).sort((a, b) => a - b);
  const med = times.length ? times[Math.floor(times.length / 2)] : 0;
  S.placed = todayKey();
  S.placeAsked = true;
  S.placeLog = { at: todayKey(), right, n: asked.length, med, units: units.map(u => ({ dom: u.d.key, res: u.res })) };
  save();
  const lvI = placeLevel(flat.filter(x => lessonProg(x.key).stars).length), lv = PLACE_LEVELS[lvI];
  const behind = start ? flat.indexOf(start) : flat.length;
  const uNo = start ? domains().findIndex(d => d.key === start.dom.key) + 1 : 0;
  /* Duolingo announces the placement in the character's bubble — «you should
     start with Section 3!» — and so does he */
  const say = !start ? "أتقنت *كل الوحدات*! المحاكاة خطوتك الجاية."
    : nPlaced && start.dom.lessons.indexOf(start.les) === 0 && uNo > 1 ? `بتبدأ من *الوحدة ${toAr(uNo)}*! تخطّينا ${qLessons(nPlaced)} تعرفها.`
    : nPlaced ? `تخطّينا ${qLessons(nPlaced)}، وبتبدأ من *«${start.les.title}»*!`
    : behind ? `تكمل من *«${start.les.title}»*!`
    : "نبدأ من *أول درس* — أفضل مكان لك، وبنمشي بسرعة.";
  PLACE_START = start ? { key: start.key, nudge: before } : null;
  const pace = !med || right < 2 ? "" : med <= 62 ? `وقتك قرابة ${toAr(med)} ثانية للسؤال — وفي الاختبار عندك دقيقة تقريباً. ممتاز!`
    : med <= 90 ? `وقتك قرابة ${toAr(med)} ثانية للسؤال — والاختبار يعطيك دقيقة. الحيل بتسرّعك.`
    : "الدقة أولاً — والسرعة نبنيها بالتدريب والحيل.";
  const catLine = ["ar", "geo", "alg"].filter(c => cats[c]).map(c => `${PLACE_CAT[c]} ${toAr(cats[c].r)} من ${toAr(cats[c].n)}`).join("، ");
  $app.innerHTML = `<div class="screen screen-full"><div class="complete win-scene place-scene" id="comp">
    <h1 class="obt-bubble ob-say pl-say">${sayHtml(say)}</h1>
    ${winHero(138)}
    <div class="pl-badge">${levelIcon(lvI, 30)}<span>مستواك: <b>${lv.name}</b></span></div>
    <div class="pl-units">
      ${units.map((u, k) => {
        const here = start && start.dom.key === u.d.key;
        const all = u.d.lessons.every(l => lessonProg(u.d.key + "." + l.key).stars);
        const st = u.res === "full" || all ? "ok" : here ? "here" : u.res === "half" ? "part" : "later";
        const sub = u.res === "full" ? "تخطّيتها كلها" : all ? "مكتملة"
          : u.res === "half" ? (here ? `تخطّيت أول ${qLessons(u.a)} — تكمل من «${esc(start.les.title)}»` : `تخطّيت أول ${qLessons(u.a)}`)
          : here ? `تبدأ من «${esc(start.les.title)}»` : "من أولها";
        return `<div class="pl-urow ${st}" style="--d:${(0.55 + k * 0.1).toFixed(2)}s">
          <span class="pl-uic">${st === "ok" ? CHECK_BADGE : toAr(k + 1)}</span>
          <span class="pl-utx"><b>${esc(u.d.title)}</b><span>${sub}</span></span>
          <span class="pl-dots" aria-label="${toAr(u.dots.filter(x => x === "ok").length)} صح">${u.dots.map(x => `<i class="${x}"></i>`).join("")}</span>
        </div>`;
      }).join("")}
    </div>
    <div class="pl-facts">
      <p>${right ? `<b>${catLine}</b>` : "ولا يهمك — الدروس تبدأ معك من الصفر، خطوة خطوة."}</p>
      ${pace ? `<p>${pace}</p>` : ""}
      <p class="pl-honest">اختبار قصير يحدّد من وين تبدأ — ما يتنبأ بدرجتك في القدرات.</p>
    </div>
    <div class="action-bar win-action pl-cta">
      <button class="btn" onclick="${start ? "A.placeGoLesson()" : "A.go('mock')"}">${start ? "يلا نبدأ" : "إلى المحاكاة"}</button>
    </div>
  </div></div>`;
  winHeroPlay();
  sayPlay(650);
  SES = null;
}
let PLACE_START = null;
A.placeGoLesson = function () {
  if (!PLACE_START) { go("path"); return; }
  S.placeNudge = PLACE_START.nudge ? { key: PLACE_START.key } : null;
  save();
  const [d, l] = PLACE_START.key.split(".");
  PLACE_START = null;
  snd("start-lesson"); A.startLesson(d, l);
};

/* Duolingo's exit ramp, read from its «Is this lesson too hard?» sheet: a
   student the test placed past lessons, who then struggles in the first one,
   is offered a step back — one block at a time, never all the way at once.
   Asked once per lesson: after four graded answers under half right, or when
   they reach for the X. */
function placeNudgeDue() {
  const n = S.placeNudge;
  if (!n || !SES || SES.nudged || SES.key !== n.key) return false;
  const ft = Object.values(SES.firstTry || {});
  return ft.length >= 4 && ft.filter(Boolean).length / ft.length < .5;
}
function placeNudge() {
  SES.nudged = true; snd("place-nudge");
  askConfirm("الدرس صعب عليك؟", "نقدر ننقلك لدرس أقرب لمستواك — وترجع لهنا بعدين.", "أكمل الدرس", "جرّب درس أسهل", placeStepDown);
}
/* The test can leave gaps, so «one step back» is by path order: the block of
   placed, never-played lessons nearest before the lesson they are stuck in. */
function placeStepDown() {
  const key = S.placeNudge && S.placeNudge.key; if (!key) return;
  const flat = allLessons(), at = flat.findIndex(x => x.key === key);
  const fresh = x => { const p = S.lessons[x.key]; return p && p.placed && !p.plays; };
  const prev = flat.slice(0, Math.max(0, at)).reverse().find(fresh);
  if (prev) {
    const d = prev.dom, a = (PLACE_BLUEPRINT[d.key] || { a: 0 }).a, inA = d.lessons.indexOf(prev.les) < a;
    d.lessons.forEach((l, i) => {
      const k = d.key + "." + l.key, p = S.lessons[k];
      if (p && p.placed && !p.plays && (inA ? i < a : i >= a)) delete S.lessons[k];
    });
  }
  const start = flat.find(x => !lessonProg(x.key).stars) || flat[0];
  S.placeNudge = flat.slice(0, flat.indexOf(start)).some(fresh) ? { key: start.key } : null;
  save();
  stopQTimer(); SES = null;
  OB = null;
  obFrame(obTop("teach", `تمام! نجرّب شي أسهل: *«${start.les.title}»*.`),
    `<button class="btn" onclick="A.startLesson('${start.dom.key}','${start.les.key}')">يلا نبدأ</button>`, 100, "A.go('path')", "ob-splash", false);
}

/* What the date actually asks of them, in one clause: the lessons still unopened
   spread over the weeks that are left. When the date is too close for that to mean
   anything, it says what the last week before an exam is really for. */
function planChip(days) {
  const left = allLessons().filter(x => !lessonProg(x.key).stars).length;
  if (!left) return `<span class="ec2-plan">المنهج مكتمل — راجع وجرّب المحاكاة</span>`;
  if (days <= 7) return `<span class="ec2-plan">الوقت قريب — ركّز على المحاكاة والمراجعة</span>`;
  const weeks = Math.max(1, Math.round(days / 7));
  const per = Math.ceil(left / weeks);
  if (per > 12) return `<span class="ec2-plan">الوقت ضيّق — ابدأ بأضعف مجالاتك</span>`;
  return `<span class="ec2-plan">${qLessons(per)} أسبوعياً تكفي لإنهاء المنهج</span>`;
}

function countdownCard() {
  const days = examDaysLeft();

  if (days === null) {
    return `<button class="ec2 ec2-empty" onclick="A.examSetup()">
      <span class="ec2-num"><i class="ec2-plus">+</i></span>
      <span class="ec2-body">
        <b>\u0645\u062a\u0649 \u0627\u062e\u062a\u0628\u0627\u0631 \u0642\u062f\u0631\u0627\u062a\u0643\u061f</b>
        <span class="ec2-sub">\u062d\u062f\u0651\u062f \u0627\u0644\u0645\u0648\u0639\u062f \u0648\u0646\u062d\u0633\u0628 \u0644\u0643 \u0627\u0644\u0639\u062f \u0627\u0644\u062a\u0646\u0627\u0632\u0644\u064a \u0648\u062c\u0627\u0647\u0632\u064a\u062a\u0643</span>
      </span>
      <span class="ec2-go">${CHEV_SVG}</span>
    </button>`;
  }

  if (days < 0) {
    return `<button class="ec2 ec2-past" onclick="A.examSetup()">
      <span class="ec2-num"><b>\u2014</b></span>
      <span class="ec2-body">
        <b>\u0627\u0646\u062a\u0647\u0649 \u0645\u0648\u0639\u062f \u0627\u062e\u062a\u0628\u0627\u0631\u0643</b>
        <span class="ec2-sub">\u062d\u062f\u0651\u062b \u0627\u0644\u0645\u0648\u0639\u062f \u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0639\u062f \u0627\u0644\u062a\u0646\u0627\u0632\u0644\u064a</span>
      </span>
      <span class="ec2-go">${CHEV_SVG}</span>
    </button>`;
  }

  const pct = readiness();
  /* ceil, so any real progress lights a segment: a student one lesson in has
     started, and rounding them down to an empty meter says the opposite */
  const lit = pct > 0 ? Math.max(1, Math.min(10, Math.ceil(pct / 10))) : 0;
  const tone = examTone(days);
  const when = new Date(S.exam + "T00:00:00");
  const dateTxt = EP_DAYNAMES[when.getDay()] + " " + toAr(when.getDate()) + " " + AR_MONTHS[when.getMonth()];

  const numBlock = days === 0
    ? `<span class="ec2-num"><b class="ec2-today-ic">${TARGET_IC}</b></span>`
    : `<span class="ec2-num"><b>${toAr(days)}</b><i>${days === 1 ? "\u064a\u0648\u0645" : days === 2 ? "\u064a\u0648\u0645\u0627\u0646" : "\u064a\u0648\u0645\u0627\u064b"}</i></span>`;

  const headline = days === 0
    ? "\u0627\u062e\u062a\u0628\u0627\u0631\u0643 \u0627\u0644\u064a\u0648\u0645 \u2014 \u0628\u0627\u0644\u062a\u0648\u0641\u064a\u0642"
    : "\u0628\u0627\u0642\u064d \u0639\u0644\u0649 \u0627\u062e\u062a\u0628\u0627\u0631\u0643";

  return `<button class="ec2 ec2-${tone}" onclick="A.examSetup()"
      aria-label="${headline} \u2014 ${days === 0 ? "" : dayPhrase(days)}\u060c \u062c\u0627\u0647\u0632\u064a\u062a\u0643 ${toAr(pct)}\u066a">
    ${numBlock}
    <span class="ec2-body">
      <b>${headline}</b>
      <span class="ec2-sub">${dateTxt}</span>
      <span class="ec2-ready">
        <span class="ec2-pips" aria-hidden="true">` +
          Array.from({ length: 10 }, (_, i) =>
            `<i class="${i < lit ? "on" : ""}" style="--p:${i}"></i>`).join("") + `</span>
        <span class="ec2-pct">\u062c\u0627\u0647\u0632\u064a\u062a\u0643 ${toAr(pct)}\u066a</span>
      </span>
      ${planChip(days)}
    </span>
    <span class="ec2-go">${CHEV_SVG}</span>
  </button>`;
}

/* ---------------- daily quest card + chest ---------------- */
/* The daily chest, ported from chest-animation.html: the Duolingo
   monthly-challenge chest measured frame-by-frame off "chest animation.mp4",
   wearing colourway ١٢ of that file — a navy body with gold straps and a
   gold latch. The same art draws the small chest on the path (chestSVG) and
   the big one in the ceremony; the open state is a second drawing with the
   lid lifted, swapped in at the pop, exactly as the video does it. */
const CHEST_PAINT = { body: "#1E3A8A", bodyDk: "#172C6B", trim: "#FFC800", trimDk: "#E6A800", latch: "#FFF1B8", lidIn: "#2A4AA6", lidInDk: "#1E3A8A", intA: "#B8C2E0", intB: "#EEF1FA", title: "#1E3A8A", dot: "#FFE9A8" };
function chestArt(c) {
  return {
    closed: `<svg class="closed" viewBox="0 0 260 290" aria-hidden="true">
      <g class="ch-base">
        <rect x="24" y="180" width="41" height="87" rx="10" fill="${c.trimDk}"/><rect x="195" y="180" width="41" height="87" rx="10" fill="${c.trimDk}"/>
        <rect x="65" y="180" width="130" height="87" fill="${c.body}"/><rect x="65" y="245" width="130" height="4" fill="${c.bodyDk}"/>
      </g>
      <g class="ch-lid">
        <rect x="24" y="75" width="41" height="112" rx="10" fill="${c.trim}"/><rect x="195" y="75" width="41" height="112" rx="10" fill="${c.trim}"/>
        <rect x="65" y="82" width="130" height="100" fill="${c.body}"/><rect x="65" y="123" width="130" height="4" fill="${c.bodyDk}"/>
        <circle cx="130" cy="192" r="30" fill="${c.trim}"/>
        <rect x="12" y="167" width="236" height="58" rx="8" fill="${c.trim}"/>
        <rect x="12" y="213" width="236" height="12" rx="4" fill="${c.trimDk}"/>
        <circle cx="130" cy="212" r="22" fill="${c.latch}"/>
      </g>
    </svg>`,
    open: `<svg class="open" viewBox="0 0 260 290" aria-hidden="true">
      <defs>
        <linearGradient id="cvInt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.intA}"/><stop offset="1" stop-color="${c.intB}"/></linearGradient>
        <radialGradient id="cvBleach" cx="130" cy="120" r="150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".55" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      </defs>
      <rect x="24" y="42" width="41" height="64" rx="10" fill="${c.trim}"/><rect x="195" y="42" width="41" height="64" rx="10" fill="${c.trim}"/>
      <rect x="65" y="48" width="130" height="58" fill="${c.lidIn}"/><rect x="65" y="74" width="130" height="4" fill="${c.lidInDk}"/>
      <rect x="34" y="150" width="192" height="66" fill="url(#cvInt)"/>
      <rect x="24" y="150" width="41" height="117" rx="10" fill="${c.trimDk}"/><rect x="195" y="150" width="41" height="117" rx="10" fill="${c.trimDk}"/>
      <rect x="65" y="227" width="130" height="40" fill="${c.body}"/>
      <rect x="65" y="212" width="130" height="15" fill="${c.trim}"/>
      <rect x="12" y="92" width="236" height="58" rx="8" fill="${c.trim}"/>
      <rect x="12" y="92" width="236" height="10" rx="4" fill="${c.trimDk}"/>
      <circle cx="130" cy="118" r="22" fill="#FFFFFF"/>
      <rect x="0" y="30" width="260" height="200" fill="url(#cvBleach)"/>
    </svg>`
  };
}
function chestSVG(cls) { return chestArt(CHEST_PAINT).closed.replace('class="closed"', `class="qc-chest ${cls || ""}"`); }

/* Floating daily chest (Duolingo style): fixed above the bottom nav
   on the path, stays put while scrolling. The pill under it shows
   the n/10 count, or a green ✓; when ready, Duolingo's «افتح» bubble over it. */
function floatingQuest() {
  dailyReset();
  const n = S.daily.n, ready = n >= dailyGoal() && !S.daily.claimed;
  /* Ready, it knocks to be opened (2026-10-26: «creative … anyone see it
     immediately»): every 2.6s it crouches and jumps, its lid pops open a crack
     in the air with the gold light inside, two of our gems jump out and fall
     back in, and it lands with a squash; a red «١» sits on its corner the way a
     phone marks something waiting, and a gold «افتح!» button under it beats on
     the landing. One CSS cycle (cfHop) keeps every part on the same beat. */
  if (ready) return `<button class="chest-float ready" onclick="A.chestTap()" aria-label="صندوق اليوم — افتحه">
    <span class="cf-box">
      <i class="cf-gem cf-g1" aria-hidden="true">${CV_GEM}</i><i class="cf-gem cf-g2" aria-hidden="true">${CV_GEM}</i>
      ${chestSVG("cf-chest cf-hop").replace('<g class="ch-lid">', '<ellipse class="cf-light" cx="130" cy="184" rx="88" ry="15"/><g class="ch-lid">')}
      <span class="cf-badge" aria-hidden="true">١</span>
    </span>
    <span class="cf-open" aria-hidden="true">افتح!</span>
  </button>`;
  return `<button class="chest-float ${S.daily.claimed ? "claimed" : ""}" onclick="A.chestTap()" aria-label="صندوق اليوم">
    ${chestSVG("cf-chest" + (n >= dailyGoal() - 2 && !S.daily.claimed ? " qc-excited" : ""))}
    ${S.daily.claimed ? `<span class="sc-pill sc-done">${CHECK_BADGE}</span>`
        : `<span class="sc-pill sc-count">${toAr(n)}/${toAr(dailyGoal())}</span>`}
  </button>`;
}

/* ---- the ceremony: a 480×1044 stage scaled to the viewport, so every measured
   coordinate (hop heights, the comet's ellipse, the sparkle ring) lands the same
   on every phone. Three taps, each with a leap and a comet; the title fades on
   press and the chest opens on release; lift, burst, rising motes, the light cone,
   the drop, the white wash; then the pile of gems and the counter ticking up. ---- */
const CV_STAR = '<svg viewBox="0 0 24 24"><path d="M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z" fill="currentColor"/></svg>';
const CV_MOTE = '<svg viewBox="0 0 10 26"><path d="M5 0C7.5 8 9.5 11 10 13 9.5 15 7.5 18 5 26 2.5 18 .5 15 0 13 .5 11 2.5 8 5 0Z" fill="#fff"/></svg>';
const CV_ARROW = '<svg viewBox="0 0 24 24"><path d="M12 19.5V5.5M5.5 12l6.5-6.5 6.5 6.5" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/* the app's own gem (assets/icons/gem.svg), inlined so the pile can pop and jiggle it; the back rows are a shade darker */
const CV_GEM = `<svg viewBox="0 0 17 22" aria-hidden="true">
  <path d="M0 15.4119V6.14389C0 5.43516 0.375083 4.77936 0.98596 4.42002L7.48596 0.596494C8.11186 0.228319 8.88814 0.228319 9.51404 0.596494L16.014 4.42002C16.6249 4.77936 17 5.43516 17 6.14389V15.4119C17 16.0904 16.6561 16.7225 16.0865 17.0911L9.5865 21.297C8.92534 21.7248 8.07466 21.7248 7.4135 21.297L0.913497 17.0911C0.343916 16.7225 0 16.0904 0 15.4119Z" fill="#1CB0F6"/>
  <path d="M6.93347 2.57699L2.15482 5.86231C1.47453 6.33001 1.62193 7.37398 2.40512 7.63504L4.57583 8.35861C4.84574 8.44858 5.14118 8.41932 5.3882 8.27817L7.99614 6.78792C8.30771 6.60988 8.5 6.27853 8.5 5.91968V3.40103C8.5 2.59585 7.59697 2.12083 6.93347 2.57699Z" fill="#DDF4FF"/>
</svg>`;
const CV_GEM_DARK = CV_GEM.replace("#1CB0F6", "#1899D6").replace("#DDF4FF", "#B6E2F8");
const CV_CAPS = ["اضغط للحصول على فرصة لترقيته!", "اضغط! اضغط!", "باقي فرصة واحدة فحسب!", "اضغط لفتحه!"];
/* hop choreography, measured off the video at 60 fps: [t, y, lean°, scaleY] */
const CV_IDLE_HOP = [
  [0.00, 0, 0, 1.00], [0.15, 0, 0, 0.90], [0.25, 0, 0, 0.90],
  [0.29, -10, -8, 1.07], [0.35, -24, -4, 1.03], [0.43, -32, -1, 1.00], [0.55, -33, 0, 1.00],
  [0.62, -28, 2, 1.00], [0.70, -16, 5, 1.00], [0.76, -4, 8, 1.00], [0.79, 2, 6, 0.96],
  [0.83, -4, 0, 1.00], [0.88, -10, -4, 1.00], [0.95, -10, -2, 1.00], [1.10, -10, 0, 1.00], [1.17, -6, 0, 1.00], [1.22, 0, 0, 1.00]];
const CV_TAP_HOP = [
  [0.00, 0, 0, 1.00], [0.03, -4, 8, 1.10], [0.05, -8, 12, 1.10], [0.08, -22, 8, 1.06], [0.12, -32, 2, 1.03],
  [0.17, -42, -2, 1.00], [0.22, -47, -4, 1.00], [0.27, -50, -1, 1.00], [0.37, -50, 0, 1.00],
  [0.43, -44, -3, 1.00], [0.48, -34, -6, 1.00], [0.52, -20, -9, 1.00], [0.55, -4, -10, 1.00], [0.58, 3, -3, 0.96],
  [0.62, -4, 3, 1.00], [0.66, -10, 4, 1.00], [0.72, -16, 2, 1.00], [0.80, -18, 0, 1.00], [0.88, -18, 0, 1.00], [0.93, -10, 0, 1.00], [0.98, 0, 0, 1.00]];
const CV_SPARKS = [[175, 316, 22], [433, 475, 16], [46, 495, 14], [335, 286, 10], [410, 395, 8], [150, 590, 10], [330, 600, 14], [395, 565, 8], [95, 430, 8], [280, 240, 8], [70, 560, 10], [420, 330, 6], [120, 640, 8]];
/* the comet's path: a tilted ellipse around the chest */
const CV_ORBIT = { cx: 232, cy: 412, rx: 146, ry: 110, phi: -18 * Math.PI / 180, th0: 18 * Math.PI / 180, sweep: 270 * Math.PI / 180 };
/* the reward pile: rows counted from the floor, top rows drawn first so the front row overlaps them */
function cvPile(rows, gs) {
  const out = [], dx = gs * .64, dy = gs * .5;
  rows.forEach((n, r) => {
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * dx + ((i * 7 + r * 3) % 7 - 3) * 2.2, y = -r * dy - gs * .28 + ((i * 5 + r * 11) % 5 - 2) * 2;
      out.push([x, y, (i * 7 + r * 5) % 13 - 6, r < rows.length - 1 && (i + r) % 3 === 1 ? 1 : 0, r]);
    }
  });
  return out.sort((a, b) => b[4] - a[4]);
}
/* A fifty-gem pyramid over a twenty-five-gem reward is the kind of small lie a
   student notices once and then stops believing the rest of the screen. The pile
   is built from the count the counter is about to tick to: fifty keeps the rows
   measured off the video frame by frame, and any other count builds the same
   shape with a smaller gem so a hundred still stands on the stage. */
function cvRowsFor(n) {
  if (n === CHEST_GEMS) return [10, 9, 8, 7, 6, 5, 3, 2];
  const rows = [];
  let left = n, w = Math.max(2, Math.round(Math.sqrt(n * 2)));
  while (left > 0) { const t = Math.min(w, left); rows.push(t); left -= t; w = Math.max(1, w - 1); }
  return rows;
}
const cvGemSize = n => n > 60 ? 44 : 56;
const cvPileFor = n => cvPile(cvRowsFor(n), cvGemSize(n));

/* synthesized cues, on the app's audio context and gated by the sound setting */
function cvTone(f0, f1, dur, type, gain, at) {
  if (!S.sound) return;
  try {
    const ac = audioCtx(); if (!ac) return;
    const t = ac.currentTime + (at || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * .6);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + .015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + .05);
  } catch (e) { /* no audio */ }
}
function cvHiss(dur, gain, at, f0, f1) {
  if (!S.sound) return;
  try {
    const ac = audioCtx(); if (!ac) return;
    const t = ac.currentTime + (at || 0), n = ac.sampleRate * dur, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf;
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + .03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(ac.destination); src.start(t);
  } catch (e) { /* no audio */ }
}
const cvSnd = {
  hop() { cvTone(300, 620, .22, "sine", .16); cvTone(140, 90, .1, "sine", .12); },
  tap() { cvTone(360, 760, .22, "sine", .18); cvTone(150, 95, .1, "sine", .12); cvHiss(.28, .07, .02, 900, 3200); },
  open() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => cvTone(f, 0, .9, "triangle", .11, i * .06));
    cvHiss(.9, .05, 0, 5000, 2000);
    for (let i = 0; i < 9; i++) cvTone(2000 + Math.random() * 3200, 0, .08, "sine", .05, .1 + i * .075);
  },
  gems() { [1319, 1568, 1976, 2637].forEach((f, i) => cvTone(f, 0, .28, "sine", .1, i * .05)); },
  tick() { cvTone(1900, 1500, .06, "triangle", .05); }
};

let CV = null;   /* the live ceremony, one at a time */
const cvNow = () => performance.now() / 1000;
const cvLerp = (a, b, t) => a + (b - a) * t;
const cvClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const cvEaseOut = (t, p) => 1 - Math.pow(1 - cvClamp(t, 0, 1), p || 2.3);
function cvTrack(tr, t) {
  if (t <= 0) return tr[0].slice(1);
  for (let i = 1; i < tr.length; i++) if (t <= tr[i][0]) {
    const a = tr[i - 1], b = tr[i], u = (t - a[0]) / (b[0] - a[0]), s = u * u * (3 - 2 * u);
    return [cvLerp(a[1], b[1], s), cvLerp(a[2], b[2], s), cvLerp(a[3], b[3], s)];
  }
  return null;
}

A.openChest = function () {
  dailyReset();
  if (S.daily.n < dailyGoal() || S.daily.claimed) return;
  if (CV) return;
  sndWarm(SND_CHEST);
  const art = chestArt(CHEST_PAINT), gems = chestGems();
  const veil = document.createElement("div");
  veil.className = "chest-veil";
  veil.innerHTML = `<div class="cv-stage">
    <section class="cv-scr cv-chest on" role="button" tabindex="0"
      aria-label="صندوق اليوم — اضغط ثلاث مرات لفتحه">
      <h2 class="cv-ttl">صندوق اليوم</h2>
      <div class="cv-sparks"></div>
      <div class="cv-wrap">
        <div class="cv-body"><div class="cv-cone"></div><div class="cv-plate"></div><div class="cv-box">${art.closed}${art.open}</div><div class="cv-glow"></div></div>
        <div class="cv-fx"></div>
      </div>
      <canvas class="cv-arc" width="960" height="2088" aria-hidden="true"></canvas>
      <div class="cv-dots">${[0, 1, 2].map(i => `<div class="cv-dot${i === 0 ? " active" : ""}"><i>${CV_ARROW}</i><b class="sh"></b></div>`).join("")}</div>
      <div class="cv-cap"><span class="a">${CV_CAPS[0]}</span><span class="b hide"></span></div>
      <div class="cv-wash"></div>
    </section>
    <section class="cv-scr cv-reward">
      <div class="cv-counter">${CV_GEM}<b class="num">${toAr(S.xp)}</b></div>
      <h2 class="cv-rtitle">+${toAr(gems)} جوهرة</h2>
      <div class="cv-pile"><div class="cv-pshadow"></div></div>
      <div class="cv-foot"><button class="btn cv-btn" onclick="A.claimChest(${gems})">المتابعة</button></div>
    </section>
  </div>`;
  document.body.appendChild(veil);
  const $c = s => veil.querySelector(s);
  const stage = $c(".cv-stage"), chest = $c(".cv-chest"), body = $c(".cv-body"), box = $c(".cv-box"), fx = $c(".cv-fx"),
        ttl = $c(".cv-ttl"), capA = $c(".cv-cap .a"), capB = $c(".cv-cap .b"), dots = Array.from(veil.querySelectorAll(".cv-dot")),
        dotsRow = $c(".cv-dots"), wash = $c(".cv-wash"), arc = $c(".cv-arc"), actx = arc.getContext("2d");
  actx.scale(2, 2);
  const fit = () => { stage.style.transform = `scale(${Math.min(innerWidth / 480, innerHeight / 1044)})`; };
  fit(); addEventListener("resize", fit);
  CV = { veil, fit, gems, taps: 0, open: false, hop: null, pose: [0, 0, 1], dir: 1, idleAt: cvNow() + 0.78, arc: null, openT0: 0, running: true, nextMote: 0, capOnB: false, pressed: false, m: {} };

  const sparks = $c(".cv-sparks");
  sparks.style.color = "#F8EC98";
  CV_SPARKS.forEach(([x, y, s], i) => {
    const e = document.createElement("span"); e.className = "cv-sp";
    e.style.cssText = `left:${x}px;top:${y}px;--s:${s}px;--d:${(1.5 + (i * .37) % 1.1).toFixed(2)}s;--o:${(-(i * .53) % 2).toFixed(2)}s`;
    e.innerHTML = CV_STAR; sparks.appendChild(e);
  });

  if (motionReduced()) { snd("chest-open"); cvReward(true); return; }

  const setCap = text => {
    const hide = CV.capOnB ? capB : capA, show = CV.capOnB ? capA : capB;
    show.textContent = text; show.classList.remove("hide"); hide.classList.add("hide"); CV.capOnB = !CV.capOnB;
  };
  const startHop = track => { CV.hop = { track, t0: cvNow(), from: CV.pose.slice(), dir: CV.dir }; CV.dir = -CV.dir; };
  const orbitPt = th => {
    const c = Math.cos(th), s = Math.sin(th), cp = Math.cos(CV_ORBIT.phi), sp = Math.sin(CV_ORBIT.phi);
    return [CV_ORBIT.cx + CV_ORBIT.rx * c * cp - CV_ORBIT.ry * s * sp, CV_ORBIT.cy + CV_ORBIT.rx * c * sp + CV_ORBIT.ry * s * cp];
  };
  const drawArc = t => {
    actx.clearRect(0, 0, 480, 1044);
    if (t > 0.33) { CV.arc = null; return; }
    const head = CV_ORBIT.th0 - CV_ORBIT.sweep * cvEaseOut(t / 0.24, 2.3), tail = CV_ORBIT.th0 - CV_ORBIT.sweep * cvEaseOut((t - 0.075) / 0.22, 2.3);
    if (tail - head < 0.02) return;
    const N = 44, pts = [];
    for (let i = 0; i <= N; i++) pts.push(orbitPt(cvLerp(tail, head, i / N)));
    actx.strokeStyle = "#F8E46C"; actx.lineCap = "round"; actx.lineJoin = "round";
    actx.globalAlpha = t > 0.27 ? 1 - (t - 0.27) / 0.06 : 1;
    for (let i = 0; i < N; i++) {
      actx.lineWidth = 1 + 14 * Math.pow((i + 1) / N, 0.85);
      actx.beginPath(); actx.moveTo(pts[i][0], pts[i][1]); actx.lineTo(pts[i + 1][0], pts[i + 1][1]); actx.stroke();
    }
    actx.globalAlpha = 1;
  };
  const at = (dt, t, name, fn) => { if (dt >= t && !CV.m[name]) { CV.m[name] = true; fn(); } };
  const openStep = dt => {
    const lift = -48 * cvEaseOut(dt / 0.1, 3);
    const ft = Math.max(0, dt - 0.13), fall = 1200 * ft * ft;
    body.style.transform = `translateY(${fall.toFixed(1)}px)`;
    box.style.transform = `translateY(${lift.toFixed(1)}px)`;
    while (CV.nextMote <= dt && dt < 0.72) {
      const e = document.createElement("span"); e.className = "cv-mote";
      e.style.cssText = `left:${(130 + (Math.random() * 128 - 64)).toFixed(0)}px;top:${(150 + fall + lift).toFixed(0)}px;--dy:${(-(240 + Math.random() * 320)).toFixed(0)}px;--d:${(.9 + Math.random() * .45).toFixed(2)}s`;
      e.innerHTML = CV_MOTE; fx.appendChild(e);
      CV.nextMote += 0.07;
    }
    at(dt, 0.5, "wash", () => wash.classList.add("go"));
    at(dt, 1.25, "done", () => { CV.running = false; cvReward(false); });
  };
  const loop = () => {
    if (!CV || !CV.running) return;
    const t = cvNow();
    if (!CV.open) {
      /* the idle hop keeps a strict 2 s rhythm; a slot that lands mid-hop is skipped, never stacked */
      if (t >= CV.idleAt) { if (!CV.hop) { startHop(CV_IDLE_HOP); cvSnd.hop(); } CV.idleAt += 2.0; }
      let pose = [0, 0, 1];
      if (CV.hop) {
        const dt = t - CV.hop.t0, v = cvTrack(CV.hop.track, dt);
        if (!v) CV.hop = null;
        else { const b = cvClamp(dt / 0.07, 0, 1); pose = [cvLerp(CV.hop.from[0], v[0], b), cvLerp(CV.hop.from[1], v[1] * CV.hop.dir, b), cvLerp(CV.hop.from[2], v[2], b)]; }
      }
      CV.pose = pose;
      body.style.transform = `translateY(${pose[0].toFixed(2)}px) rotate(${pose[1].toFixed(2)}deg) scaleY(${pose[2].toFixed(3)})`;
    } else openStep(t - CV.openT0);
    if (CV.arc) drawArc(t - CV.arc.t0);
    requestAnimationFrame(loop);
  };
  const tap = () => {
    if (CV.open || CV.taps >= 3) return;
    CV.taps++;
    dots[CV.taps - 1].classList.remove("active"); dots[CV.taps - 1].classList.add("used");
    if (CV.taps < 3) dots[CV.taps].classList.add("active", "pop");
    setCap(CV_CAPS[CV.taps]);
    CV.arc = { t0: cvNow() }; startHop(CV_TAP_HOP); snd("chest-tap", () => cvSnd.tap(), "assessment-click-option-1", [1, 1.12, 1.26][CV.taps - 1]);   // three hits, one short click a step higher each (the user, 2026-10-28: «make the three click sounds better and simpler»; the tallies rang for 1.6s and ran into each other)
    if (CV.taps === 3) setTimeout(() => { if (CV && CV.taps === 3 && !CV.open) { dotsRow.classList.add("hide"); setCap(CV_CAPS[3]); } }, 250);
  };
  const openChest = () => {
    CV.open = true; CV.openT0 = cvNow(); CV.hop = null; CV.arc = null; actx.clearRect(0, 0, 480, 1044);
    chest.classList.add("opened"); ttl.classList.add("hide"); capA.classList.add("hide"); capB.classList.add("hide");
    body.style.transform = ""; snd("chest-open", () => cvSnd.open());
    [[-62, -40], [-22, -84], [30, -66], [72, -34], [4, -22]].forEach((p, i) => {
      const e = document.createElement("span"); e.className = "cv-burst"; e.style.cssText = `left:130px;top:150px;--dx:${p[0]}px;--dy:${p[1]}px;--o:${i * .04}s;color:#fff`;
      e.innerHTML = CV_STAR; fx.appendChild(e);
    });
  };
  /* the video fades the title on press and opens on release */
  chest.addEventListener("pointerdown", () => {
    if (!CV || CV.open) return;
    if (CV.taps < 3) { tap(); return; }
    CV.pressed = true; ttl.classList.add("hide");
  });
  const release = () => { if (CV && CV.pressed && !CV.open) { CV.pressed = false; openChest(); } };
  chest.addEventListener("pointerup", release);
  chest.addEventListener("pointercancel", release);
  chest.addEventListener("pointerleave", release);
  /* The ceremony was three taps on a <section> and nothing else could reach it:
     a student on a keyboard could open the chest screen and had no way to open
     the chest. Enter or Space is a tap, and the third one opens it. Escape is
     deliberately not a way out — the reward is claimed by the button, so the
     trap holds until «المتابعة». */
  chest.addEventListener("keydown", ev => {
    if (ev.key !== "Enter" && ev.key !== " " && ev.key !== "Spacebar") return;
    ev.preventDefault();
    if (!CV || CV.open) return;
    if (CV.taps < 3) { tap(); return; }
    ttl.classList.add("hide");
    openChest();
  });
  CV.untrap = trapOverlay(veil, () => {}, { noEsc: 1, label: "صندوق اليوم", focus: ".cv-chest" });
  requestAnimationFrame(loop);
};

/* the reward screen: the pile pops in gem by gem, then the counter climbs in ticks with the title and the button fading in */
function cvReward(instant) {
  const veil = CV.veil, reward = veil.querySelector(".cv-reward"), pile = veil.querySelector(".cv-pile"), num = veil.querySelector(".cv-counter .num"), counter = veil.querySelector(".cv-counter");
  const from = S.xp, n = CV.gems, stagger = 0.02, art = cvPileFor(n);
  pile.style.setProperty("--gs", cvGemSize(n) + "px");
  art.forEach(([x, y, rot, dark], i) => {
    const g = document.createElement("span"); g.className = "cv-gem pop";
    g.style.cssText = `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;--r:${rot}deg;--o:${(0.05 + i * stagger).toFixed(3)}s`; g.innerHTML = dark ? CV_GEM_DARK : CV_GEM; pile.appendChild(g);
  });
  veil.querySelector(".cv-chest").classList.remove("on"); reward.classList.add("on");
  /* the chest section is gone from the screen; the claim button is the dialog now */
  const go = veil.querySelector(".cv-btn");
  if (go) setTimeout(() => { try { go.focus(); } catch (e) { } }, 400);
  if (instant) { reward.classList.add("piled", "told"); num.textContent = toAr(from + n); return; }
  setTimeout(() => reward.classList.add("piled"), 60);
  const last = 0.05 + (art.length - 1) * stagger + 0.3;
  setTimeout(() => {
    if (!CV) return;
    reward.classList.add("told"); snd("chest-gems-reveal", () => cvSnd.gems());
    const t0 = cvNow(), steps = 12; let shown = from;
    (function step() {
      if (!CV) return;
      const u = cvClamp((cvNow() - t0) / 0.8, 0, 1), v = from + Math.round(Math.floor(u * steps + 1e-6) * n / steps);
      if (v !== shown) { shown = v; num.textContent = toAr(v); counter.classList.remove("bump"); void counter.offsetWidth; counter.classList.add("bump"); snd("chest-gems-tick", () => cvSnd.tick()); }
      if (u < 1) requestAnimationFrame(step); else num.textContent = toAr(from + n);
    })();
  }, (last + 0.2) * 1000);
  setTimeout(() => { if (CV) Array.from(pile.querySelectorAll(".cv-gem")).forEach((g, i) => { g.classList.remove("pop"); g.style.transform = "scale(1) rotate(var(--r))"; g.style.setProperty("--o", (i * .02).toFixed(2) + "s"); g.classList.add("jig"); }); }, (last + 0.35) * 1000);
}
A.claimChest = function (gems) {
  /* One payout, however many times the button is hit. «المتابعة» stays on
     screen for the 380ms the veil takes to fade, and a double tap in that window
     used to pay the chest twice — found by pressing Enter on it with a keyboard. */
  if (!S.daily || S.daily.claimed) return;
  snd("continue"); gainGems(gems); S.daily.claimed = true; save();
  const v = document.querySelector(".chest-veil");
  if (CV) { CV.running = false; removeEventListener("resize", CV.fit); if (CV.untrap) CV.untrap(); CV = null; }
  if (v) { v.classList.add("out"); setTimeout(() => { v.remove(); render(); }, 380); }
  else render();
};

/* ---------------- PATH (home) ---------------- */
/* A finished lesson is paid out on the path, not only on the win screen
   (2026-10-23, the user: «every time he finishes a single lesson»): set in
   lessonComplete, played once by pathPay when the path is next drawn */
/* kept for the tab too, so a reload on the win screen still fills the node's
   ring on the path (the audit, 2026-10-28: the reload skipped it) */
let PATH_PAY = (() => { try { return JSON.parse(sessionStorage.getItem("qPathPay")); } catch (e) { return null; } })();
/* «الدرس التالي» goes by the path: the node's ring fills there first, then
   this lesson starts on its own (2026-10-27: the user never saw the beat,
   because the button skipped the path) */
let PATH_NEXT = null;
function pathNext(ms) {
  const nx = PATH_NEXT; PATH_NEXT = null;
  if (!nx) return;
  setTimeout(() => { if (view === "path" && !SES && !document.querySelector(".lesson-pop, .streak-veil, .chest-veil")) { snd("start-lesson"); A.startLearn(nx.domKey, nx.lesKey, nx.next); } }, ms);
}
/* Every lesson has its own sign in its node, where the path used to draw the
   same star 26 times (2026-10-23: «change stars to something else, and each
   level something different»). Drawn on a 40-unit square in the star's own
   weight: round caps, round joins, one colour (currentColor) — white on an
   open node, the star-done brown on a finished one. .s strokes, .f fills. */
const LESSON_ICON = {
  /* مهارات وقوانين */
  bigsum: `<path class="s" d="M12 6v12M6 12h12M24 12h11M24 27l10 10M34 27l-10 10M6 32h12"/><circle class="f" cx="12" cy="26.5" r="2.4"/><circle class="f" cx="12" cy="37.5" r="2.4"/>`,
  keylaws: `<circle class="s" cx="13" cy="20" r="7"/><path class="s" d="M20 20h16M30 20v7M35 20v5"/>`,
  probstats: `<rect class="s" x="6" y="6" width="28" height="28" rx="7"/><circle class="f" cx="14" cy="14" r="3"/><circle class="f" cx="20" cy="20" r="3"/><circle class="f" cx="26" cy="26" r="3"/>`,
  fastest: `<path class="f j" d="M23 3 8 23h11l-3 14 16-21H21z"/>`,
  cycles: `<path class="s" d="M32 18a12 12 0 0 0-22-5M8 22a12 12 0 0 0 22 5"/><path class="s" d="M9 5v8h8M31 35v-8h-8"/>`,
  simplify: `<circle class="s" cx="11" cy="29" r="5"/><circle class="s" cx="29" cy="29" r="5"/><path class="s" d="M14.5 25 30 5M25.5 25 10 5"/>`,
  equations: `<path class="s" d="M20 6v28M12 34h16M7 11h26"/><path class="s j" d="M7 11 3 22h8zM33 11l-4 11h8z"/>`,
  lcmgcd: `<circle class="s" cx="15" cy="20" r="10"/><circle class="s" cx="25" cy="20" r="10"/>`,
  /* أساسيات */
  decimals: `<rect class="s" x="4" y="10" width="13" height="20" rx="4"/><rect class="s" x="23" y="10" width="13" height="20" rx="4"/><circle class="f" cx="20" cy="31" r="2.8"/>`,
  fractions: `<circle class="s" cx="20" cy="20" r="15"/><path class="f" d="M20 20V5a15 15 0 0 1 15 15z"/><path class="s" d="M20 5v30M5 20h30"/>`,
  roots: `<path class="s" d="M3 22h5l6 12L22 6h15"/>`,
  powers: `<rect class="s" x="5" y="15" width="20" height="20" rx="4"/><rect class="f" x="26" y="4" width="10" height="10" rx="3"/>`,
  speed: `<circle class="s" cx="20" cy="23" r="13"/><path class="s" d="M20 23v-7M16 4h8M20 4v6"/>`,
  /* النسب */
  percent: `<circle class="s" cx="11" cy="11" r="5"/><circle class="s" cx="29" cy="29" r="5"/><path class="s" d="M31 7 9 33"/>`,
  profit: `<path class="s j" d="M21 5h12a2 2 0 0 1 2 2v12L18 36 4 22z"/><circle class="f" cx="28" cy="12" r="3"/>`,
  proportion: `<path class="s" d="M12 34V8M5 15l7-7 7 7M28 6v26M21 25l7 7 7-7"/>`,
  mean: `<path class="s" d="M8 34V22M16 34V12M24 34V18M32 34V8M4 20h32"/>`,
  /* الهندسة */
  angles: `<path class="s" d="M6 33h29M6 33 30 9"/><path class="s" d="M19 33a13 13 0 0 0-4-9"/>`,
  triangle: `<path class="s j" d="M20 6 35 33H5z"/>`,
  rectangle: `<rect class="s" x="3" y="10" width="34" height="20" rx="3"/>`,
  square: `<rect class="s" x="7" y="7" width="26" height="26" rx="3"/><path class="s" d="M7 26h7v7"/>`,
  quads: `<path class="s j" d="M13 9h23l-9 22H4z"/>`,
  shaded: `<rect class="s" x="5" y="5" width="30" height="30" rx="4"/><circle class="f" cx="20" cy="20" r="9"/>`,
  circle: `<circle class="s" cx="20" cy="20" r="15"/><path class="s" d="M20 20l10.6-10.6"/><circle class="f" cx="20" cy="20" r="3.2"/>`,
  parallel: `<path class="s" d="M7 33 19 7M21 33 33 7"/>`,
  solids: `<path class="s j" d="M20 4 35 12v16L20 36 5 28V12z"/><path class="s j" d="M5 12l15 8 15-8M20 20v16"/>`
};
const LESSON_ICON_STAR = `<path class="f" d="M18.27 6.05c1.06-2.36 4.4-2.36 5.47 0l2.22 4.91c.44.99 1.39 1.66 2.47 1.75l5.33.47c2.66.24 3.71 3.57 1.66 5.29l-3.8 3.18a3.2 3.2 0 0 0-1 2.99l1.15 4.85c.6 2.55-2.12 4.59-4.4 3.3l-4.89-2.76a3.2 3.2 0 0 0-2.95 0l-4.89 2.76c-2.28 1.29-5-.75-4.4-3.3l1.15-4.85a3.2 3.2 0 0 0-1-2.99l-3.8-3.18c-2.05-1.72-1-5.05 1.66-5.29l5.33-.47a3.2 3.2 0 0 0 2.47-1.75z"/>`;
/* The path node is a hexagon (2026-10-26, the user: «دوائر الlevel تصير مضلع
   … it must have the same animation as the circle exactly»). A hexagon is the
   flat-top kind, so 71 × 58 is all but regular and it sits on the path like a
   tile on the ground; its lip is the same hexagon 7px lower, its shine a
   smaller one at the top, the way the coin's dome was. Everything that moved
   the coin moves the button as before: only the shape and the colours it
   paints changed, from the button's own background and shadow to the paths. */
function roundPoly(pts, r, start) {           // start sits on the edge from the last point to the first
  const n = pts.length, at = (p, q, d) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); return [p[0] + dx / l * d, p[1] + dy / l * d]; };
  const f = p => p[0].toFixed(2) + " " + p[1].toFixed(2);
  let d = "M" + f(start);
  for (let k = 0; k < n; k++) {
    const P = pts[k], A = pts[(k + n - 1) % n], B = pts[(k + 1) % n];
    d += " L" + f(at(P, A, r)) + " Q" + f(P) + " " + f(at(P, B, r));
  }
  return d + " Z";
}
const hexPts = (x, y, w, h) => [[x + w * .25, y], [x, y + h / 2], [x + w * .25, y + h], [x + w * .75, y + h], [x + w, y + h / 2], [x + w * .75, y]];
const NODE_HEX = roundPoly(hexPts(0, 0, 71, 58), 10, [35.5, 0]);
const NODE_HEX_HI = roundPoly(hexPts(9, 4, 53, 40), 8, [35.5, 4]);
const NODE_SHAPE = `<svg class="node-sh" viewBox="0 0 71 58" aria-hidden="true"><path class="nd-lip" d="${NODE_HEX}"/><path class="nd-face" d="${NODE_HEX}"/><path class="nd-hi" d="${NODE_HEX_HI}"/></svg>`;
/* a finished lesson is our hexagon in the gold of Duolingo's finished node
   (the user, 2026-10-27, with Duolingo's coin: «make the level i finished like
   this», then «it must be the same shape not circle … like this but for our
   shape»): the gold face on its darker lip, two bands of light across it rising
   to the right, and the star in brown-gold instead of the lesson's sign. The
   bands are clipped to the face by one shared clipPath (NODE_GOLD_DEFS, once on
   the path) */
const goldBand = (cx, w) => {
  const ux = .5, uy = -.866, nx = .866, ny = .5, L = 44, f = n => n.toFixed(2);
  const p = (t, o) => f(cx + ux * t + nx * o) + " " + f(29 + uy * t + ny * o);
  return `M${p(-L, -w / 2)} L${p(L, -w / 2)} L${p(L, w / 2)} L${p(-L, w / 2)} Z`;
};
const NODE_GOLD = `<svg class="node-sh nd-gold" viewBox="0 0 71 58" aria-hidden="true"><path class="nd-lip" d="${NODE_HEX}"/><path class="nd-face" d="${NODE_HEX}"/><g class="nd-hi" clip-path="url(#ndGold)"><path d="${goldBand(20, 11)}"/><path d="${goldBand(47, 6)}"/></g></svg>`;
const NODE_GOLD_DEFS = `<svg class="nd-defs" width="0" height="0" aria-hidden="true"><clipPath id="ndGold"><path d="${NODE_HEX}"/></clipPath></svg>`;
const NODE_DONE_IC = `<svg class="node-ic" viewBox="0 0 40 40" aria-hidden="true">${LESSON_ICON_STAR}</svg>`;
function lessonIcon(lesKey) {
  return `<svg class="node-ic" viewBox="0 0 40 40" aria-hidden="true">${LESSON_ICON[lesKey] || LESSON_ICON_STAR}</svg>`;
}
function renderPath() {
  const ds = domains();
  if (!ds.length) {
    $app.innerHTML = statbar() + `<div class="screen"><div class="empty-note">بنك الأسئلة قيد التحميل…<br>تأكد من وجود ملفات js/data ثم حدّث الصفحة.</div></div>` + bottomnav("path");
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
    /* each unit is its own block so its sticky banner is pushed away by the
       next one, instead of every banner stacking at the top as you scroll */
    /* the live site's banner (asked back on 2026-10-23): the unit's count on
       the far side of a divider; the whole banner opens the unit's rules */
    html += `<section class="unit-block"><button class="unit-banner u-${d.color === "yellow" ? "gold" : d.color}" data-unit="${d.key}" onclick="A.openUnitBook('${d.key}')" aria-label="${esc(d.title)} — قوانين الوحدة">
      <span class="u-txt"><span class="u-kicker">القسم ${toAr(1)}، الوحدة ${toAr(di + 1)}</span><h2>${d.title}</h2></span>
      <span class="u-side"><span class="u-divider"></span><span class="u-prog"><b>${toAr(uDone)}/${toAr(d.lessons.length)}</b><span>دروس</span></span></span>
    </button><div class="path">`;
    d.lessons.forEach((l, li) => {
      const key = d.key + "." + l.key, p = lessonProg(key);
      const done = p.stars > 0, open = gi <= firstOpenIdx, current = gi === firstOpenIdx;
      /* A lesson passed six weeks ago used to look exactly like one passed this
         morning. If it has not been practised in a fortnight it says so, quietly:
         its stars dim and it wears a refresh mark. Saves from before this shipped
         carry no date, so they stay unmarked until their next play. */
      const ago = done && p.last ? daysSinceKey(p.last) : null;
      const stale = ago !== null && ago >= 14 && !current;
      const cls = done ? "node-done" : open ? "" : "node-locked";
      const x = offsets[gi % offsets.length];
      /* the lesson's own sign (LESSON_ICON): white on its face, the star-done
         brown on a gold node so it reads against the gold */
      const nodeIcon = done ? NODE_DONE_IC : lessonIcon(l.key);
      /* a node taught in short lessons fills its ring one lesson at a time */
      const LS = current && learnSet(key);
      const frac = LS ? learnRec(key).done.length / LS.lessons.length : 0;
      const ring = current ? ringSvg(LS ? LS.lessons.length : 1, LS ? learnRec(key).done.length : 0, u.c) : "";
      // gold done / unit-color open / locked in Duolingo's own (LevelOval.Locked:
      // face Swan, the Rive file's #AFAFAF lip, the icon Hare in CSS)
      const nc = done ? ["#FFC800", "#E6A000", "#FFE700"] : open ? [u.c, u.s, u.h] : ["#E5E5E5", "#AFAFAF", "transparent"];
      /* the title stands beside the node, on the side towards the middle of the
         path (2026-10-26: «make it left or right based on the location of the
         level»); a node in the middle takes the side the path is not heading to */
      const side = x > 0 ? "r" : x < 0 ? "l" : gi % offsets.length === 0 ? "l" : "r";
      html += `<div class="path-row"><div class="node-col lbl-${side}${current ? " bob" : ""}${stale ? " stale" : ""}" style="right:${x}px;--ax:${Math.abs(x)}" data-key="${key}"${LS ? ` data-n="${LS.lessons.length}"` : ""}>
        ${ring}
        ${stale ? `<span class="node-refresh" title="حان وقت المراجعة" aria-hidden="true">${REFRESH_SVG}</span>` : ""}
        <button class="node ${cls}" style="--node-c:${nc[0]};--node-s:${nc[1]};--node-h:${nc[2]};--d:${(gi % 10) * 0.06}s" data-open="${u.c}|${u.s}|${u.h}"
          aria-label="${l.title} — ${done ? "مكتمل، " + arPlural(p.stars, "نجمة واحدة", "نجمتان", "نجوم", "نجمة") : current ? "الدرس الحالي" : "مقفل"}"
          ${open ? `onpointerdown="A.nodePress()" onclick="A.nodeTap(event,'${d.key}','${l.key}',${li})"` : "disabled"}>
          ${done ? NODE_GOLD : NODE_SHAPE}
          ${nodeIcon}
        </button>
        ${done ? '<span class="node-stars" aria-hidden="true">' + [1, 2, 3].map(sn =>
          '<svg class="ns' + (sn <= p.stars ? ' on' : '') + '" viewBox="5 4 30 30">' + LESSON_ICON_STAR + '</svg>').join('') + '</span>' : ''}
        <span class="node-label${done ? ' nl-done' : open ? '' : ' nl-locked'}">${l.title}</span>
      </div></div>`;
      gi++;
    });
    html += `</div></section>`;
  });
  $app.innerHTML = statbar() + `<div class="screen">${NODE_GOLD_DEFS}${examDaysLeft() !== null && examDaysLeft() >= 0 ? fqCard() : countdownCard()}${dueCard()}${html}<div class="path-tail"></div></div>` + floatingQuest() + PATH_FAB + bottomnav("path");
  requestAnimationFrame(() => {
    pathReveal();
    /* a rank-up on top would hide the beat: it waits, and plays when the rank-up closes and repaints the path */
    if (PATH_PAY && !document.querySelector(".rankup-veil")) pathPay(); else nodeFlipLoop();
    const cur = document.querySelector('.path-row .bob');
    pathFabCheck();
    if (!cur) return;
    /* Only chase the node when it is genuinely out of reach. Centring it
       unconditionally threw a new player past the countdown and the daily
       question, so they landed halfway down a page they had never seen. */
    const r = cur.getBoundingClientRect();
    if (r.top > window.innerHeight * 0.72 || r.bottom < 80)
      cur.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

/* Duolingo's «back to my lesson» button (fragment_path.xml autoscrollFab,
   ArrowView, PathFragment; the user, 2026-10-26: «add a button for going up to
   my level when i get very down — exactly from Duolingo»): a 52px white card
   with a 2px grey rim and its 4px lip, radius 14, 16px off the screen's edge
   above the tab bar, a blue arrow (4px round stroke on 20 × 24) pointing to the
   current node. It shows the moment no part of the node is on screen — at once,
   no animation — and when the node comes back it shrinks to nothing in 200ms.
   A tap smooth-scrolls the node to the middle of the screen. Duolingo puts it on
   the end side; ours stands on the other, because the chest floats there. */
const PATH_FAB = `<button class="path-fab" id="pathFab" onclick="A.pathFab()" aria-label="ارجع لدرسك" tabindex="-1"><svg viewBox="0 0 20 24" aria-hidden="true"><path d="M10 4 L10 20 M16 9.6 L10 4 L4 9.6"/></svg></button>`;
let pathFabRaf = 0;
function pathFabCheck() {
  const fab = document.getElementById("pathFab"), cur = document.querySelector(".path-row .bob .node");
  if (!fab) return;
  if (!cur) { fab.classList.remove("on"); return; }
  const r = cur.getBoundingClientRect(), bar = document.querySelector(".statbar");
  const top = bar ? bar.getBoundingClientRect().bottom : 0, bottom = innerHeight - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 80);
  const above = r.bottom <= top, below = r.top >= bottom;
  fab.classList.toggle("on", above || below);
  fab.classList.toggle("down", below);
  fab.tabIndex = above || below ? 0 : -1;
}
window.addEventListener("scroll", () => {
  if (pathFabRaf) return;
  pathFabRaf = requestAnimationFrame(() => { pathFabRaf = 0; pathFabCheck(); });
}, { passive: true });
window.addEventListener("resize", () => pathFabCheck());
A.pathFab = function () {
  const cur = document.querySelector(".path-row .bob");
  if (!cur) return;
  buzz(8);
  cur.scrollIntoView({ behavior: motionReduced() ? "auto" : "smooth", block: "center" });
};

/* A node the student has not scrolled to yet rises in when they reach it. Once
   each, never the bobbing one (it owns its own animation), and not at all when
   motion is reduced or the browser has no observer to hang it on. */
function pathReveal() {
  if (motionReduced() || !("IntersectionObserver" in window)) return;
  const below = Array.from(document.querySelectorAll(".node-col"))
    .filter(c => !c.classList.contains("bob") && c.getBoundingClientRect().top > innerHeight * 0.9);
  if (!below.length) return;
  const io = new IntersectionObserver((ents, obs) => {
    ents.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.remove("veil");
      e.target.classList.add("rise");
      obs.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -6% 0px" });
  below.forEach(c => { c.classList.add("veil"); io.observe(c); });
}

/* Duolingo's three node beats, timed frame by frame from its node_and_ring_119.riv
   (tools/pills.html plays the originals). */
/* «a lesson done» is Duolingo's node_complete, copied off its file at a tenth
   of the speed, one row per 17ms frame where anything changes. Units are
   Duolingo's own pixels (its coin is 148 wide, a 120 face on a 16 lip, at rest
   with its face's top at 163), scaled onto ours when played:
   [ms, face top, face height, lip (below the face; above it when negative),
     width, paint] — paint 0 is the colours it took off with, 1 the coin seen
   from underneath, edge-on, in its new colours, 2 the new colours */
const PAY_COIN = [
  [0, 163, 120, 16, 148, 0], [17, 167, 115, 15, 150, 0], [51, 169, 113, 15, 150, 0], [102, 169, 113, 15, 150, 0],
  [119, 167, 115, 15, 150, 0], [136, 134, 144, 19, 148, 0], [153, 120, 135, 18, 130, 0], [170, 119, 136, 18, 134, 0],
  [187, 119, 136, 18, 132, 0], [204, 121, 132, 18, 136, 0], [221, 123, 129, 17, 143, 0], [238, 125, 126, 17, 146, 0],
  [255, 126, 124, 16, 148, 0], [408, 126, 123, 16, 148, 0], [442, 127, 122, 16, 148, 0], [476, 128, 121, 14, 148, 0],
  [493, 128, 123, 8, 148, 0], [510, 130, 124, 3, 148, 0], [527, 131, 124, 1, 148, 0], [561, 135, 124, 0, 148, 0],
  [578, 141, 118, -3, 148, 0], [595, 152, 108, -8, 148, 0], [612, 165, 93, -12, 148, 0], [629, 198, 47, -18, 148, 0],
  [646, 193, 76, -3, 148, 0], [662, 193, 76, -3, 148, 0],
  [663, 205, 48, -18, 148, 1], [688, 205, 48, -18, 148, 1],
  [689, 158, 70, 16, 148, 2], [697, 149, 82, 16, 148, 2], [714, 137, 99, 16, 148, 2], [731, 133, 105, 16, 148, 2],
  [748, 131, 108, 16, 148, 2], [765, 130, 110, 16, 148, 2], [799, 128, 113, 16, 148, 2], [833, 127, 114, 16, 148, 2],
  [867, 125, 116, 16, 148, 2], [901, 124, 117, 16, 148, 2], [935, 123, 118, 16, 148, 2], [986, 122, 118, 16, 148, 2],
  [1037, 121, 119, 16, 148, 2], [1088, 120, 120, 16, 148, 2], [1207, 119, 121, 16, 148, 2], [1224, 119, 122, 16, 146, 2],
  [1241, 119, 124, 16, 144, 2], [1258, 118, 132, 16, 136, 2], [1275, 125, 137, 16, 130, 2], [1292, 169, 114, 15, 148, 2],
  [1462, 170, 114, 15, 148, 2], [1479, 168, 116, 15, 148, 2], [1496, 162, 121, 16, 148, 2], [1547, 162, 121, 16, 148, 2],
  [1564, 163, 120, 16, 148, 2]
];
const PAY_MS = 1564;
/* the icon comes back out of the flip small and grows into the face */
const PAY_ICON = [[0, 1, 1], [662, 1, 1], [663, 0, 1], [688, 0, 1], [689, 1, .6], [714, 1, .6], [731, 1, .62], [748, 1, .8],
  [765, 1, .87], [782, 1, .9], [799, 1, .94], [833, 1, .96], [867, 1, .98], [901, 1, 1], [PAY_MS, 1, 1]];
/* the shadow it leaves on the path: its own lower ellipse, shrinking as it rises */
const PAY_GHOST = [[0, 1], [136, 1], [153, .97], [170, .93], [187, .9], [204, .88], [221, .85], [238, .83], [255, .82],
  [289, .8], [323, .78], [425, .77], [561, .75], [595, .73], [629, .72], [646, .7], [663, .67], [680, .7], [714, .72],
  [731, .73], [765, .75], [867, .77], [1156, .78], [1224, .8], [1258, .82], [1275, .85], [1292, 1], [PAY_MS, 1]];
/* its three diamonds: they slide out from behind it, change colour with it in
   the flip and shrink away — [ms, x, y, across] in Duolingo's pixels; the
   first is the pale one */
const PAY_DIAS = [
  { pale: true, aspect: .85, path: [[0, -40, 175, 0], [170, -62, 150, 22], [221, -74, 139, 24], [272, -80, 132, 25], [340, -84, 127, 26], [408, -86, 125, 26],
    [510, -87, 123, 25], [595, -87, 123, 22], [663, -87, 123, 21], [731, -87, 123, 19], [782, -86, 123, 18], [816, -86, 122, 16], [850, -86, 122, 15],
    [867, -86, 122, 14], [901, -86, 122, 12], [935, -86, 122, 10], [969, -86, 122, 8], [1003, -86, 122, 6], [1020, -86, 122, 4], [1054, -86, 122, 0]] },
  { path: [[0, 40, 190, 0], [153, 62, 168, 15], [204, 76, 157, 15], [255, 83, 147, 15], [289, 85, 144, 15], [340, 88, 141, 15], [408, 90, 138, 15],
    [442, 91, 137, 15], [493, 91, 137, 13], [510, 92, 137, 13], [561, 92, 136, 12], [612, 92, 136, 11], [663, 92, 136, 10], [714, 92, 136, 9],
    [765, 92, 135, 8], [799, 93, 136, 7], [833, 92, 135, 6], [867, 93, 136, 5], [901, 92, 135, 4], [918, 93, 136, 3], [952, 92, 135, 2], [969, 92, 135, 0]] },
  { path: [[0, -40, 195, 0], [170, -66, 182, 15], [238, -82, 171, 15], [255, -85, 169, 15], [289, -90, 164, 15], [340, -95, 161, 15], [408, -98, 158, 15],
    [442, -99, 157, 15], [459, -100, 156, 14], [510, -100, 156, 13], [612, -102, 155, 13], [629, -102, 155, 12], [680, -102, 154, 12], [697, -102, 154, 11],
    [748, -102, 154, 10], [765, -102, 154, 9], [816, -102, 154, 9], [833, -103, 154, 8], [867, -102, 154, 7], [884, -102, 154, 7], [901, -103, 154, 6],
    [935, -102, 154, 5], [969, -103, 154, 4], [1003, -102, 154, 3], [1020, -103, 154, 2], [1037, -103, 154, 0]] }
];
const DIA_SVG = `<svg viewBox="-12 -12 24 24"><path d="M0-9.5L9.5 0 0 9.5-9.5 0Z" fill="currentColor" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/></svg>`;
/* Duolingo's own path sounds, each decoded once into a buffer the way the
   correct-answer clip is, so a press is heard on the frame it lands: the
   press and release of a node, the card closing, and node_complete (it starts
   on the take-off, swells through the flip and lands with the coin). The
   clicks are WAV: an mp3 frame is longer than the click itself */
const SFX_SRC = { right: "assets/sounds/right-answer.mp3",
  lcDone: "assets/sounds/lesson-complete.mp3", lcPerfect: "assets/sounds/lesson-perfect.mp3",
  stat1: "assets/sounds/stat-1.mp3", stat2: "assets/sounds/stat-2.mp3", stat3: "assets/sounds/stat-3.mp3" };
/* Duolingo's quest-bar sounds (daily_quest_bar_*): by how far the bar jumps, and whether it fills */
[25, 50, 75, 100].forEach(n => { SFX_SRC["barP" + n] = `assets/sounds/bar-partial-${n}.mp3`; SFX_SRC["barC" + n] = `assets/sounds/bar-complete-${n}.mp3`; });
/* Duolingo's leaderboard sounds (leaderboard_*): the lift, the move up, the lock-in, and fifteen tick-ups */
Object.assign(SFX_SRC, { lbUnlock: "assets/sounds/lb-unlock.mp3", lbMove: "assets/sounds/lb-moveup.mp3",
  lbGold: "assets/sounds/lb-lockin-gold.mp3", lbGrey: "assets/sounds/lb-lockin-grey.mp3" });
for (let k = 1; k <= 15; k++) SFX_SRC["lbTick" + k] = `assets/sounds/lb-tick-${String(k).padStart(2, "0")}.mp3`;
const SFX_BUF = {}, SFX_P = {}, SFX_RAW = {};
/* a file's bytes, fetched once; fetching needs no AudioContext, so the first
   sounds can be on the phone before the first tap, which then only decodes */
function sfxFetch(k) {
  return SFX_RAW[k] || (SFX_RAW[k] = fetch(SFX_SRC[k]).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .catch(e => { delete SFX_RAW[k]; throw e; }));
}
function sfxLoad(k) {
  if (SFX_P[k] || !window.fetch) return;
  const ac = audioCtx();
  if (!ac) return;
  SFX_P[k] = sfxFetch(k)
    .then(ab => new Promise((res, rej) => ac.decodeAudioData(ab.slice(0), res, rej)))
    .then(b => { SFX_BUF[k] = b; })
    .catch(() => { delete SFX_P[k]; delete SFX_RAW[k]; });
}
/* the long sounds still ringing (a chest opening, the streak's celebration):
   leaving the screen fades them out in a quarter second rather than letting
   four seconds of them play over the next one (the audit, 2026-10-28). One
   started in the last .6s belongs to the screen being opened and plays on. */
var SFX_LIVE = [];   // var: go() may run before this line is reached
function sfxHush() {
  if (!AC || !SFX_LIVE.length) return;
  const t = AC.currentTime;
  SFX_LIVE.slice().forEach(e => {
    if (t - e.at < .6) return;
    try { e.g.gain.cancelScheduledValues(t); e.g.gain.setValueAtTime(e.g.gain.value, t); e.g.gain.linearRampToValueAtTime(0, t + .25); e.src.stop(t + .26); } catch (x) {}
    SFX_LIVE.splice(SFX_LIVE.indexOf(e), 1);
  });
}
var SFX_HOLD = false;   // set while a skipped timeline jumps to its end
function sfxPlay(k, gain, fallback, rate, end) {
  if (!S.sound || SFX_HOLD) return;
  const ac = audioCtx();
  if (SFX_BUF[k] && ac) {
    try {
      const src = ac.createBufferSource(), g = ac.createGain();
      src.buffer = SFX_BUF[k]; g.gain.value = gain || 1;
      if (rate) src.playbackRate.value = rate;
      src.connect(g); g.connect(ac.destination); src.start();
      if (src.buffer.duration > 1.5) {
        const e = { src, g, at: ac.currentTime };
        SFX_LIVE.push(e);
        src.onended = () => { const i = SFX_LIVE.indexOf(e); if (i >= 0) SFX_LIVE.splice(i, 1); };
      }
      if (end) { const t = ac.currentTime + end; g.gain.setValueAtTime(gain || 1, t - .12); g.gain.linearRampToValueAtTime(0, t); src.stop(t); }
      return;
    } catch (e) { /* the fallback below */ }
  }
  sfxLoad(k);
  if (fallback) fallback();
}
/* Brilliant's sound effects (the user, 2026-10-27, after hearing every one in
   tools/brilliant-sounds: «I love it all … for everything we will use
   Brilliant voice effects»). Each moment that makes a sound names itself —
   snd("pair-pick", ourOldSound) — and plays the Brilliant file SND_MAP gives
   it from assets/sounds/bri/; a call site may hand its own file (a choice's
   pitch, a tally a step higher) or "" for silence. Our correct-answer sound
   and Duolingo's files are not in the map and never pass through here; a
   moment without a Brilliant sound, or whose file is not decoded yet, plays
   what it played before. The files come in three bites, so a first visit on
   mobile data does not pay for all of them at once: the small everyday ones
   on the first touch, the rest when a lesson starts (warmStreak), the chest's
   own when it opens. */
const SND_MAP = {
  "choice-select": "assessment-click-option-1",
  "wrong-answer": "incorrect",
  "teach-check-wrong": "incorrect",
  "time-up": "incorrect",
  "timer-tick": "tutor-xp-countup-stop",
  "answer-run": "streak-inlesson",
  "continue": "continue",
  "teach-chunk-done": "continue",
  "help-open": "hint",
  "lesson-failed": "lesson-failed",
  "revive": "streak-charge",
  "practice-complete": "lesson-complete",
  "report-sent": "assessment-submit",
  "tile-place": "lightweight-choice",
  "tile-remove": "toggle-off",
  "keypad-key": "assessment-click-option-1",
  "pair-pick": "lightweight-choice",
  "pair-match": "diagnostic-answer",
  "pair-miss": "incorrect",
  "fq-wrong": "incorrect",                           // فهيم's challenge: a wrong answer
  "fq-five": "streak-celebration",                   // every fifth right answer in a row
  "fq-poke": "toggle-on",                            // tapping فهيم
  "rule-terms-light": "assessment-click-option-1",
  "rule-said": "hint",
  "rule-fill-miss": "incorrect",
  "boost-toggle": "toggle-on",
  "start-lesson": "start-lesson",
  "ring-segment-pay": "toggle-on",
  "node-flip-up": "lightweight-choice",
  "node-flip-turn": "hint",
  "node-gold-turn": "level-passed",
  "node-gold-land": "highlight-node",
  "say-word": "lightweight-choice",
  "first-lesson-enter": "welcome-to-leagues",
  "chest-tip": "lightweight-choice",
  "quest-banner": "endstate",
  "chest-tap": "assessment-click-option-1",
  "chest-open": "level-mastered",
  "chest-gems-reveal": "",                       // silent, as the gems on «تقدّمك اليوم»: the user, 2026-10-28, still heard «the last part … at opening the chest»
  "chest-gems-tick": "",
  "climb-xp-count": "tutor-xp-countup-start",
  "climb-pass-note": "xp-tally-1",
  "streak-open": "streak-celebration",
  "streak-coin": "streak-charge",
  "placement-answer": "diagnostic-answer",
  "placement-dont-know": "assessment-dont-know",
  "placement-complete": "diagnostic-complete",
  "place-nudge": "router-koji-recommendation",
  "mock-select": "assessment-click-option-1",
  "mock-flag": "toggle-on",
  "mock-end-section": "assessment-submit",
  "mock-pass": "level-passed",
  "mock-fail": "level-failed",
  "ob-continue": "continue",
  "ob-pick": "lightweight-choice",
  "ob-goal-pick": "lightweight-choice",
  "taste-tap": "assessment-click-option-1",
  "taste-swap-lift": "drag-started",
  "taste-swap-land": "drag-released",
  "taste-equals": "highlight-node",
  "exam-saved": "assessment-submit",
  "signin-step": "continue",
  "signin-later": "skip",
  "signin-done": "diagnostic-complete",
  "settings-toggle": "toggle-on",
  "settings-segment": "lightweight-choice",
  "settings-name-saved": "assessment-submit"
};
const SND_FILES = ["assessment-click-option-1","assessment-click-option-2","assessment-click-option-3","assessment-click-option-4","assessment-dont-know","assessment-submit","continue","diagnostic-answer","diagnostic-complete","drag-released","drag-started","endstate","highlight-node","hint","incorrect","lesson-complete","lesson-failed","level-failed","level-mastered","level-passed","lightweight-choice","router-koji-recommendation","skip","start-lesson","streak-celebration","streak-charge","streak-inlesson","toggle-off","toggle-on","tutor-xp-countup-start","tutor-xp-countup-stop","welcome-to-leagues","xp-tally-1","xp-tally-2","xp-tally-3","xp-tally-4","xp-tally-5","xp-tally-final"];
const SND_ONCE = { "chest-gems-tick": 1500 };      // a counted-up number calls on every step; Brilliant's count-up is one sound
const SND_DELAY = { "answer-run": 260 };           // the streak sting lands just after the correct sound
const SND_END = { "node-gold-turn": 1.25,            // level-passed keeps only its first hit, stopping before the second (1.28s): the user, 2026-10-28, «remove the last part of the sound», twice
  "chest-open": 2.4 };                                // level-mastered stops before its last hit (2.42s): the user, 2026-10-28, «the last part in voice at opening the chest»
/* files Brilliant made much quieter or louder than its clicks, brought to the
   clicks' level (about −19 dBFS as played; the audit, 2026-10-28): the clock's
   last five seconds and the level test's «taken» were 20 dB under it and never
   heard, the taste's swap 6–14 dB under; the chest's opening was the loudest
   sound in the app and sat 8 LU over a right answer */
const SND_LEVEL = { "timer-tick": 10, "placement-answer": 6, "taste-swap-lift": 3.4, "taste-swap-land": 2, "taste-equals": 2.4, "chest-open": .5 };
const SND_GAIN = Object.assign({ "say-word": .31 }, SND_LEVEL);              // فهيم's typing (the user's pick, 2026-10-28, option ٢ on tools/brilliant-sounds/type.html, no bell at the end) at −22 dB, a little under the app's other clicks: the file peaks at −11.9
const sndLast = {};
SND_FILES.forEach(f => { SFX_SRC["b:" + f] = "assets/sounds/bri/" + f + ".mp3"; });
function snd(id, fn, file, rate) {
  const f = file === undefined ? SND_MAP[id] : file;
  if (f === undefined) { if (fn) fn(); return; }
  if (!f || !S.sound) return;
  if (SND_ONCE[id]) { const t = performance.now(); if (t - (sndLast[id] || -1e9) < SND_ONCE[id]) return; sndLast[id] = t; }
  const go = () => sfxPlay("b:" + f, SND_GAIN[id] || .9, fn, rate, SND_END[id]);
  if (SND_DELAY[id]) setTimeout(go, SND_DELAY[id]); else go();
}
const SND_FIRST = ["continue", "lightweight-choice", "assessment-click-option-1", "assessment-click-option-2", "assessment-click-option-3",
  "assessment-click-option-4", "toggle-on", "toggle-off", "start-lesson", "skip", "drag-started", "drag-released", "highlight-node",
  "incorrect", "streak-inlesson", "tutor-xp-countup-stop", "xp-tally-1", "diagnostic-answer"];
const SND_CHEST = ["assessment-click-option-1", "level-mastered", "continue"];
function sndWarm(list) { (Array.isArray(list) ? list : SND_FILES).forEach(f => sfxLoad("b:" + f)); }
const sndFirst = () => sndWarm(SND_FIRST);
addEventListener("pointerdown", sndFirst, { once: true, capture: true });
addEventListener("keydown", sndFirst, { once: true, capture: true });
/* the first run's sounds are fetched as the app opens (about 70 KB), so a new
   student's first taps and فهيم's first words are not silent on mobile data;
   a sound still missing later loads on its own, never all of them at once
   (the audit, 2026-10-28: the first tap used to pull all 2.8 MB) */
if (window.fetch && S.sound) setTimeout(() => { SND_FIRST.concat(["welcome-to-leagues"]).forEach(f => sfxFetch("b:" + f).catch(() => {})); sfxFetch("right").catch(() => {}); }, 0);
/* any CSS colour as [r, g, b] */
function rgbOf(c) {
  const x = (rgbOf.ctx = rgbOf.ctx || document.createElement("canvas").getContext("2d"));
  x.fillStyle = "#000"; x.fillStyle = c;
  const h = x.fillStyle;
  if (h[0] === "#") return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  return (h.match(/\d+(\.\d+)?/g) || [0, 0, 0]).slice(0, 3).map(Number);
}
const toWhite = (c, f) => "rgb(" + rgbOf(c).map(v => Math.round(v + (255 - v) * f)).join(",") + ")";
/* node_complete on the coin (Duolingo's, copied frame by frame): it squats,
   springs off its own shadow tall and narrow, hangs among three diamonds, tips
   over towards you until you see it edge-on from underneath, comes back up the
   right way — gold, if that was the node's last lesson — and drops onto its
   shadow. It plays when a node is finished */
function coinPay(col, btn, pay, keep, end) {
  const ic = btn.querySelector(".node-ic"), face = btn.querySelector(".nd-face"), lipEl = btn.querySelector(".nd-lip"), hi = btn.querySelector(".nd-hi");
  const root = getComputedStyle(document.documentElement);
  const c0 = getComputedStyle(face).fill, s0 = getComputedStyle(lipEl).fill;
  const c1 = pay.gold ? root.getPropertyValue("--gold").trim() : c0, s1 = pay.gold ? root.getPropertyValue("--gold-dk").trim() : s0;
  const k = 58 / 120, kx = 71 / 148, top0 = btn.offsetTop, at = t => t / PAY_MS, lin = { easing: "linear" };
  const ghost = document.createElement("span");
  ghost.className = "node-ghost";
  ghost.style.top = top0 + 7 + "px";
  col.insertBefore(ghost, btn);
  const dias = PAY_DIAS.map(d => {
    const el = document.createElement("span"), big = Math.max(...d.path.map(p => p[3])) * k;
    el.className = "node-dia";
    el.style.cssText = `width:${(big * (d.aspect || 1)).toFixed(1)}px;height:${big.toFixed(1)}px;margin:${(-big / 2).toFixed(1)}px 0 0 ${(-big * (d.aspect || 1) / 2).toFixed(1)}px`;
    el.innerHTML = DIA_SVG;
    col.insertBefore(el, btn);
    const tint = c => d.pale ? toWhite(c, .5) : c;
    el.animate(d.path.map(([t, x, y, s]) => ({ offset: at(t), ...lin,
      transform: `translate(${(x * kx).toFixed(2)}px,${((y - 163) * k + top0).toFixed(2)}px) scale(${(s / Math.max(...d.path.map(p => p[3]))).toFixed(3)})`,
      color: tint(t < 663 ? c0 : c1) })), { duration: PAY_MS, fill: "forwards" });
    return el;
  });
  btn.style.transformOrigin = "50% 0";
  btn.animate(PAY_COIN.map(([t, top, h, lip, w, p]) => ({ offset: at(t), ...lin,
    transform: `translateY(${((top - 163) * k).toFixed(2)}px) scale(${(w / 148).toFixed(3)},${(h / 120).toFixed(3)})` })), { duration: PAY_MS });
  /* the face's paint and the lip's paint and drop, frame for frame with it */
  face.animate(PAY_COIN.map(([t, , , , , p]) => ({ offset: at(t), ...lin, fill: p === 1 ? s1 : p ? c1 : c0 })), { duration: PAY_MS });
  lipEl.animate(PAY_COIN.map(([t, , h, lip, , p]) => ({ offset: at(t), ...lin,
    fill: p === 1 ? toWhite(c1, .15) : p ? s1 : s0, transform: `translateY(${(lip * 7 / 16 / (h / 120)).toFixed(2)}px)` })), { duration: PAY_MS });
  if (ic) ic.animate(PAY_ICON.map(([t, o, s]) => ({ offset: at(t), ...lin, opacity: o, transform: `scale(${s})` })), { duration: PAY_MS });
  if (hi) hi.animate([{ opacity: 1 }, { opacity: 1, offset: at(662) }, { opacity: 0, offset: at(663) }, { opacity: 0, offset: at(688) }, { opacity: 1, offset: at(689) }, { opacity: 1 }],
    { duration: PAY_MS });
  ghost.animate(PAY_GHOST.map(([t, s]) => ({ offset: at(t), ...lin, transform: `scale(${s})` })), { duration: PAY_MS });
  /* the user's picks (2026-10-27, tools/brilliant-sounds/flip.html): a light tap
     as it takes off and a shine as it turns over (option ٦); on the node's
     last lesson option ٥, «لمعة وحدة» (asked for again on 2026-10-28): the
     chime as it comes back gold, cut to its first hit, and the shine as it
     lands; the ring is silent */
  if (pay.gold) setTimeout(() => snd("node-gold-land", () => beep([[784, .08], [1047, .1], [1319, .22]])), 1460), setTimeout(() => snd("node-gold-turn"), 663);
  else { setTimeout(() => snd("node-flip-up", () => beep([[784, .08], [1047, .16]])), 136); setTimeout(() => snd("node-flip-turn"), 600); }
  setTimeout(() => {
    if (!pay.gold) return;
    btn.querySelector(".node-sh").outerHTML = NODE_GOLD;
    if (ic) ic.innerHTML = LESSON_ICON_STAR;
  }, 670);
  setTimeout(() => { if (pay.gold) { btn.setAttribute("style", keep); btn.style.transformOrigin = "50% 0"; btn.classList.add("node-done"); } }, 688);
  setTimeout(() => {
    ghost.remove(); dias.forEach(x => x.remove());
    btn.style.transformOrigin = "";
    end();
  }, PAY_MS);
}
/* Duolingo's ring round the current node: one segment per short lesson with a
   twentieth of the way round left between them, done ones in the unit's
   colour and the rest grey, drawn from the top and round to the left, as
   Duolingo's is mirrored on an Arabic phone. A node without short lessons
   wears the whole ring, grey */
/* the ring is the node's hexagon drawn round it, from the top centre */
const RING_D = roundPoly(hexPts(3.5, 3.5, 82, 77), 12, [44.5, 3.5]);
function ringSeg(n, i) { const g = n > 1 ? 2.5 : 0; return [i * 100 / n + g, 100 / n - 2 * g]; }
function ringSvg(n, done, c) {
  n = Math.max(1, n);
  return `<svg class="node-ring" viewBox="0 0 89 84" fill="none" aria-hidden="true">${Array.from({ length: n }, (x, i) => {
    const [a, len] = ringSeg(n, i);
    return `<path class="ring-seg ${i < done ? "ring-arc" : "ring-track"}" d="${RING_D}" pathLength="100"${i < done ? ` style="stroke:${c}"` : ""} stroke-dasharray="${len.toFixed(2)} ${(100 - len).toFixed(2)}" stroke-dashoffset="${(-a).toFixed(2)}"/>`;
  }).join("")}</svg>`;
}
/* «a lesson done», Duolingo's (ring_return_to_path + ring_lesson_complete,
   measured off its file at a tenth of the speed): the ring comes back from
   .74 of its size with its segments fading in; half a second on, the
   segment just earned lets its grey go, the colour runs along it from its
   start to its end in 135ms, three diamonds pop off its end and drift out as
   they fade. Then the coin plays node_complete (coinPay) — every lesson done,
   not only the last (the user, 2026-10-27, on Duolingo's «done» beat: «I want
   the level to flip like this»); on the node's last lesson the ring lets go
   first and the coin comes back gold */
const RING_MAX = "scale(1.131,1.121)";                // Duolingo's 1.02, against our coin
const RING_SPARKS = [[5.9, -2.9, 9.2, 480], [4.2, 6.7, 4.6, 220], [8.4, 2.5, 3, 300]];   // out, along, size, fade
function ringPay(col, svg, seg, n, i, c, exit, coin) {
  const segs = [...svg.querySelectorAll(".ring-seg")], at = (ms, f) => setTimeout(f, ms);
  [svg, ...segs].forEach(x => { x.style.animation = "none"; });
  svg.animate([{ transform: "scale(.82,.791)" }, { transform: RING_MAX }], { duration: 750, easing: "cubic-bezier(.55,.21,.07,1)", fill: "forwards" });
  segs.forEach(x => x.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 }));
  const [a, len] = ringSeg(n, i);
  at(500, () => seg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, fill: "forwards" }));
  const fill = document.createElementNS("http://www.w3.org/2000/svg", "path");
  fill.setAttribute("d", RING_D); fill.setAttribute("pathLength", "100"); fill.setAttribute("class", "ring-seg ring-arc");
  fill.setAttribute("stroke-dashoffset", (-a).toFixed(2)); fill.setAttribute("stroke-dasharray", "0 100");
  fill.style.stroke = c; fill.style.animation = "none"; fill.style.opacity = 0;
  svg.appendChild(fill);
  at(880, () => {
    fill.style.opacity = "";
    fill.animate([{ strokeDasharray: "0 100" }, { strokeDasharray: `${len.toFixed(2)} ${(100 - len).toFixed(2)}` }], { duration: 135, easing: "linear", fill: "forwards" });
  });
  at(1015, () => {
    fill.setAttribute("stroke-dasharray", `${len.toFixed(2)} ${(100 - len).toFixed(2)}`);
    seg.remove();
    /* where the segment ends, on the hexagon, and which way is out from there */
    const pt = fill.getPointAtLength(fill.getTotalLength() * (a + len) / 100);
    const dx = pt.x - 44.5, dy = pt.y - 42, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
    const ex = dx * 1.131, ey = 42 + dy * 1.121;
    RING_SPARKS.forEach(([o, t, z, ms]) => {
      const el = document.createElement("span");
      el.className = "node-dia";
      el.style.cssText = `width:${z}px;height:${z}px;margin:${-z / 2}px 0 0 ${-z / 2}px;color:${c}`;
      el.innerHTML = DIA_SVG;
      col.appendChild(el);
      const x = ex + ux * o + uy * t, y = ey + uy * o - ux * t;
      el.animate([{ transform: `translate(${x}px,${y}px) scale(.3)`, opacity: 1 }, { transform: `translate(${x}px,${y}px) scale(1)`, opacity: 1, offset: .12 },
        { transform: `translate(${x + ux * 1.7}px,${y + uy * 1.7}px) scale(1)`, opacity: 0 }], { duration: ms, fill: "forwards" })
        .onfinish = () => el.remove();
    });
    snd("ring-segment-pay", () => beep([[784, .07], [1047, .14]]), exit ? "" : undefined);
    buzz(10);
  });
  if (exit) {
    at(1100, () => svg.animate([{ transform: RING_MAX, opacity: 1 }, { transform: "scale(1.3)", opacity: 0 }], { duration: 300, easing: "ease-in", fill: "forwards" }));
    return;
  }
  if (!coin) at(1240, () => { const ic = col.querySelector(".node-ic"); if (ic) nodeFlip(ic); });
  at(1800, () => [svg, ...svg.querySelectorAll(".ring-seg")].forEach(x => {
    x.getAnimations().forEach(an => { if (!an.animationName) an.cancel(); });
    x.style.animation = ""; x.style.animationDelay = "0s";    // breathing again, from its widest
  }));
}
function pathPay() {
  const pay = PATH_PAY; PATH_PAY = null;
  try { sessionStorage.removeItem("qPathPay"); } catch (e) {}
  const col = document.querySelector('.node-col[data-key="' + pay.key + '"]');
  if (!col || motionReduced()) { if (col) snd(pay.gold ? "node-gold-turn" : "ring-segment-pay"); nodeFlipLoop(); pathNext(700); return; }
  const btn = col.querySelector(".node"), LS = learnSet(pay.key), n = LS ? LS.lessons.length : 0;
  const c = (btn.dataset.open || "").split("|")[0];
  clearTimeout(flipT); payRun = true;                // no star flip mid-beat, whoever asks for one
  sndWarm(["toggle-on", "lightweight-choice", "hint", "highlight-node", "level-passed"]);
  let svg = col.querySelector(".node-ring");
  if (!svg && n && pay.gold) {                       // a finished node has no ring left: lend it one to finish
    col.insertAdjacentHTML("afterbegin", ringSvg(n, n, c));
    svg = col.querySelector(".node-ring");
  }
  const seg = svg && n ? svg.querySelectorAll(".ring-seg")[pay.was] : null;
  if (seg) { seg.classList.replace("ring-arc", "ring-track"); seg.style.stroke = ""; }
  if (svg && n) svg.style.transform = "scale(.82,.791)";
  const keep = btn.getAttribute("style");
  const stars = pay.gold && col.querySelector(".node-stars");
  if (stars) stars.style.opacity = 0;                // earned on the landing, not before
  if (pay.gold) {
    const [cc, sh, h] = (btn.dataset.open || "").split("|");
    btn.classList.remove("node-done");
    btn.querySelector(".node-sh").outerHTML = NODE_SHAPE;     // it was a hexagon until this lesson: the flip makes it the coin
    btn.querySelector(".node-ic").outerHTML = lessonIcon(pay.key.split(".")[1]);
    btn.style.setProperty("--node-c", cc); btn.style.setProperty("--node-s", sh); btn.style.setProperty("--node-h", h);
  }
  const r = col.getBoundingClientRect();
  if (r.top < 90 || r.bottom > innerHeight - 110) col.scrollIntoView({ block: "center", behavior: "smooth" });
  const end = () => {
    if (stars) { stars.style.opacity = ""; [...stars.children].forEach((x, i) => x.animate([{ transform: "scale(0)" }, { transform: "scale(1.3)", offset: .6 }, { transform: "none" }], { duration: 380, delay: i * 90, easing: "ease-out", fill: "backwards" })); }
    payRun = false;
    nodeFlipLoop(2400);
    pathNext(1000);
  };
  setTimeout(() => {
    if (svg) svg.style.transform = "";
    if (seg) ringPay(col, svg, seg, n, pay.was, c, pay.gold, true);
    setTimeout(() => { if (seg && pay.gold) svg.remove(); coinPay(col, btn, pay, keep, end); }, seg ? (pay.gold ? 1500 : 1240) : 0);
  }, 650);
}
/* press & open (Duolingo's node press and node select, measured off its file
   at a tenth of the speed). The face drops the whole lip in one frame on the
   press (.node:active) and comes back on the release with a two-step settle,
   a third of a pixel up and a sixth down. Its ring breathes on a two-second
   loop (ringIdle); opening the card pulls it in behind the coin and fades it,
   then lets it out a little to wait there; closing the card picks the
   breathing up from that same pulled-in size. The ring's sizes are Duolingo's
   measured against its coin, so ours keep the same relation to ours */
const RING_SEL = [[0, null], [22, 1.115, 1.104], [55, 1.044, 1.024], [89, .973, .945], [124, .929, .899], [157, .907, .865],
  [192, .896, .854], [227, .885, .842], [259, .885, .848], [294, .896, .854], [329, .907, .865], [395, .929, .888],
  [464, .94, .91], [532, .956, .927], [600, .962, .933], [667, .967, .939], [702, .973, .945]];
/* a node press is felt, not heard (the user, 2026-10-26: «remove the sound of clicking level») */
A.nodePress = function () { buzz(8); };
function nodeRelease(btn) {
  if (motionReduced()) return;
  btn.animate([{ transform: "translateY(-.29px)" }, { transform: "translateY(-.29px)", offset: .37 },
    { transform: "translateY(.14px)", offset: .371 }, { transform: "translateY(.14px)", offset: .99 }, { transform: "none" }], { duration: 133 });
}
function ringSelect(col) {
  const ring = col.querySelector(".node-ring");
  col.classList.add("sel");
  if (!ring || motionReduced()) return;
  const from = getComputedStyle(ring).transform, ms = 702;
  const parts = [...ring.querySelectorAll(".ring-track, .ring-arc")].map(x => [x, getComputedStyle(x).opacity]);
  ring.style.animation = "none";
  ring.animate(RING_SEL.map(([t, w, h]) => ({ offset: t / ms, transform: w ? `scale(${w},${h})` : from === "none" ? "none" : from })), { duration: ms, easing: "linear", fill: "forwards" });
  parts.forEach(([x, o]) => {
    x.style.animation = "none";
    const low = x.classList.contains("ring-track") ? .73 : .6;
    x.animate([{ opacity: o }, { opacity: x.classList.contains("ring-track") ? low : .57, offset: .27 }, { opacity: low }], { duration: ms, easing: "ease-out", fill: "forwards" });
  });
}
function ringResume(col) {
  col.classList.remove("sel");
  const ring = col.querySelector(".node-ring");
  if (!ring) return;
  [ring, ...ring.querySelectorAll(".ring-track, .ring-arc")].forEach(x => {
    x.getAnimations().forEach(an => { if (!an.animationName) an.cancel(); });
    x.style.animation = "";
    x.style.animationDelay = "-1s";                  // the breathing picks up pulled in
  });
}
/* the star flip — Duolingo's star_flip_anim, measured off node_and_ring_119.riv
   frame by frame (the user, 2026-10-27: «study pixel by pixel and in code
   Duolingo's version … every 2 second the animation must work»). Rows every
   17ms: [ms, rise in Duolingo's node units (− is up), scaleX, scaleY, turn in
   degrees, shadow shown, shadow scale]. It squats on its base, springs up
   7.3 units thin, hangs while it turns flat in the face, drops, lands in a
   squash and stretches back: 1267ms. Its shadow — the sign's own shape in the
   lip's colour, 2 units under its place — shows only while it is off the face.
   Duolingo's star turns 70.2° and lands as the same star, a five-point star
   repeating every 72°; our signs are not symmetric, so the same curve is
   carried to a whole turn and every sign lands upright. The face and the ring
   do nothing extra: the ring keeps breathing, and the flip starts on its
   ring_extended_event, 1500ms into each two-second breath */
const STAR_FLIP = [
  [0,0,1,1,0,0,1], [17,0,1,1,0,0,1], [33,0,1,1,0,0,1], [50,0,1,1,0,0,1], [67,0,1,1,0,0,1], [83,0,1,1,0,0,1],
  [100,0,1,1,0,0,1], [117,0,1,1,0,0,1], [133,0,1,1,0,0,1], [150,0,1,1,0,0,1], [167,0,1,1,0,0,1],
  [183,0,1.001,.999,0,0,1], [200,0,1.004,.996,0,0,1], [217,0,1.011,.991,0,0,1], [233,0,1.022,.983,0,0,1],
  [250,0,1.036,.974,0,0,1], [267,0,1.048,.964,0,0,1], [283,0,1.057,.956,0,0,1], [300,0,1.063,.95,0,0,1],
  [317,0,1.067,.945,0,0,1], [333,0,1.068,.942,0,0,1], [350,0,1.066,.941,0,0,1], [367,0,1.061,.941,0,0,1],
  [383,0,1.053,.946,0,0,1], [400,-.44,1.04,.959,0,0,1], [417,-1.16,1.022,.98,0,1,1], [433,-1.95,.999,.996,0,1,1],
  [450,-2.76,.968,1,0,1,1], [467,-3.55,.969,1,9,1,.98], [483,-4.3,.97,1,15.5,1,.96], [500,-5,.974,1,20.6,1,.94],
  [517,-5.64,.98,1,25,1,.92], [533,-6.19,.989,1,28.8,1,.9], [550,-6.64,.999,1,32.2,1,.9],
  [567,-6.96,1.008,1,35.3,1,.9], [583,-7.12,1.014,1,38.1,1,.9], [600,-7.18,1.018,1,40.7,1,.9],
  [617,-7.23,1.02,1,43,1,.9], [633,-7.27,1.02,1,45.3,1,.9], [650,-7.29,1.02,1,47.4,1,.9], [667,-7.31,1.02,1,49.3,1,.9],
  [683,-7.3,1.02,1,51.2,1,.9], [700,-7.28,1.02,1,52.9,1,.9], [717,-7.24,1.019,1,54.6,1,.9],
  [733,-7.19,1.018,1,56.1,1,.9], [750,-7.11,1.017,1,57.6,1,.9], [767,-7.01,1.016,1,59.1,1,.9],
  [783,-6.88,1.014,1,60.4,1,.9], [800,-6.73,1.012,1,61.7,1,.9], [817,-6.54,1.009,1,63,1,.91],
  [833,-6.31,1.006,1,64.2,1,.92], [850,-6.04,1.003,1,65.4,1,.93], [867,-5.71,1,1,66.6,1,.94],
  [883,-5.31,1,1,67.7,1,.95], [900,-4.82,1,1,68.9,1,.96], [917,-4.2,1,1,70.3,1,.97], [933,-3.4,1,1,70.3,1,.98],
  [950,-2.26,1,1,70.3,1,.99], [967,0,1.04,.943,.1,0,1], [983,0,1.038,.94,.1,0,1], [1000,0,1.029,.942,.1,0,1],
  [1017,0,1.007,.953,.1,0,1], [1033,0,.98,.989,.1,0,1], [1050,0,.967,1.035,.1,0,1], [1067,0,.962,1.052,.1,0,1],
  [1083,0,.96,1.058,.1,0,1], [1100,0,.961,1.06,.1,0,1], [1117,0,.963,1.058,.1,0,1], [1133,0,.969,1.05,.1,0,1],
  [1150,0,.982,1.028,.1,0,1], [1167,0,.99,1.016,.1,0,1], [1183,0,.994,1.009,.1,0,1], [1200,0,.997,1.005,.1,0,1],
  [1217,0,.998,1.002,.1,0,1], [1233,0,.999,1.001,.1,0,1], [1250,0,1,1,.1,0,1], [1267,0,1,1,.1,0,1]
];
const STAR_MS = 1267, STAR_TURN = 360 / 70.2, STAR_UNIT = 58 / 56.75, STAR_BASE = 13;
/* Duolingo swaps in an unturned star as it lands (967ms); carried to a whole turn that is 360°, held */
const starTurn = (t, r) => (t >= 967 ? 70.2 : r) * STAR_TURN;
let flipT = 0, payRun = false;
function nodeFlip(ic) {
  const btn = ic.closest(".node"), lip = btn && btn.querySelector(".nd-lip");
  if (!btn) return;
  const sh = ic.cloneNode(true);
  sh.classList.add("node-ic-sh");
  sh.style.color = lip ? getComputedStyle(lip).fill : "rgba(0,0,0,.2)";
  ic.before(sh);
  const at = t => t / STAR_MS, B = STAR_BASE;
  /* the squash is about the sign's base, the turn about its middle */
  ic.animate(STAR_FLIP.map(([t, dy, sx, sy, r]) => ({ offset: at(t), easing: "linear",
    transform: `translateY(${(dy * STAR_UNIT).toFixed(2)}px) rotate(${starTurn(t, r).toFixed(1)}deg) translateY(${B}px) scale(${sx},${sy}) translateY(${-B}px)` })),
    { duration: STAR_MS });
  sh.animate(STAR_FLIP.map(([t, , , , r, on, ss]) => ({ offset: at(t), easing: "linear",
    opacity: on, transform: `translateY(${(2 * STAR_UNIT).toFixed(2)}px) rotate(${starTurn(t, r).toFixed(1)}deg) scale(${ss})` })),
    { duration: STAR_MS }).onfinish = () => sh.remove();
}
/* one flip every two seconds, on the ring's breath: the next time its
   two-second loop reaches 1500ms (never sooner than min) */
function nodeFlipLoop(min) {
  clearTimeout(flipT);
  if (motionReduced() || payRun) return;           // pathPay restarts it when it lands
  const next = () => {
    const ring = document.querySelector(".path-row .bob .node-ring");
    const an = ring && ring.getAnimations().find(x => x.animationName === "ringIdle");
    if (!an || an.currentTime == null) return 2000;
    return (1500 - an.currentTime % 2000 + 4000) % 2000 || 2000;
  };
  let wait = next();
  while (wait < (min || 0)) wait += 2000;
  flipT = setTimeout(function go() {
    const ic = document.querySelector(".path-row .bob .node-ic");
    if (!ic) return;                                   // off the path: the loop ends
    if (!document.querySelector(".lesson-pop-veil")) nodeFlip(ic);
    let w = next(); if (w < 1000) w += 2000;
    flipT = setTimeout(go, w);
  }, wait);
}
A.debugClimb = function (n) {                        // dev harness only: a lesson that lifts you n places
  const at = Date.now(), lb = leagueStandings(at), from = lb.findIndex(e => e.you) + 1, ti = tierIndex();
  for (let k = Math.min(n || 5, from - 1); k > 0; k--) {
    const gain = lb[from - 1 - k].xp - (S.totalXp || 0) + 5, after = (S.totalXp || 0) + gain;
    if (tierIndexFor(after) !== ti) continue;
    S.totalXp = after;
    climbSfxLoad();
    WIN = { climb: { from, to: leagueStandings(at).findIndex(e => e.you) + 1, list: lb, xp1: after }, goal: dailyGoal(), qd0: 3, qd1: 6, gems: 0 };
    A.winClimb();
    return;
  }
};
A.debugPathPay = function (gold) {
  const key = "skills.bigsum", L = learnSet(key), rec = S.learn[key] = learnRec(key);
  S.lessons = {};                                    // the node it plays on is the first: nothing done after it
  if (gold) {
    rec.done = L.lessons.map(x => x.id);
    S.lessons[key] = { stars: 2, plays: L.lessons.length, last: todayKey() };
    PATH_PAY = { key, was: L.lessons.length - 1, gold: true };
  } else {
    rec.done = L.lessons.slice(0, 3).map(x => x.id);
    S.lessons[key] = { stars: 0, plays: 3 };
    PATH_PAY = { key, was: 2, gold: false };
  }
  A.go("path");
};

/* ---------------- LESSON SESSION ---------------- */
let SES = null; // current session

function pickLessonQuestions(lesson, key, first) {
  const qs = trackFilter(lesson.questions);
  const stat = q => { const s = S.qstats[q.id] || { r: 0, w: 0 }; return s.r - s.w; };
  // least-mastered first; in a taught lesson whole chunks come before half
  // chunks (so a first play never teaches two rules for one question); then
  // keep official easy→hard ordering
  const T = window.QTEACH && window.QTEACH[key], chunkOf = {};
  if (T) T.chunks.forEach((c, i) => c.q.forEach(id => { chunkOf[id] = i; }));
  const at = q => chunkOf[q.id] === undefined ? 99 : chunkOf[q.id];
  const chosen = qs.slice().sort((a, b) => stat(a) - stat(b) || at(a) - at(b) || a.difficulty - b.difficulty).slice(0, 8);
  /* The first lesson anyone plays stops after two chunks: two rules, two
     questions, a win in about three minutes. Eight questions drag eight rules
     behind them, four of them formulas to memorise, and that is a wall to meet
     before you have won anything. The rest of the lesson is served on the next
     play — the sort above puts what has not been answered first, so it comes
     back in order and nothing is skipped.
     It takes the two GENTLEST chunks, not the first two. Lesson order is the
     curriculum's order, not a ramp: skills.bigsum opens on repeated addition
     (★) and its second chunk is ٨ + ٢ × (٧ − ٤)² ÷ ٦ (★★), brackets and an
     exponent and a division in the first three minutes anyone spends here.
     Ranking the chunks by their hardest question puts that one back where it
     belongs — the second play, once there is a win behind it. */
  let opening = [];
  if (first) {
    const hardest = {};
    chosen.forEach(q => { const c = at(q); if (c !== 99) hardest[c] = Math.max(hardest[c] || 0, q.difficulty); });
    const gentlest = Object.keys(hardest).map(Number)
      .sort((a, b) => hardest[a] - hardest[b] || a - b)
      .slice(0, FIRST_CHUNKS);
    opening = chosen.filter(q => gentlest.indexOf(at(q)) >= 0);
  }
  const served = opening.length ? opening : chosen;
  return served.sort((a, b) => a.difficulty - b.difficulty).map(shuffleChoices);
}

A.go = function (v) { if (v === "review") reviewFrom = view; if (v === "settings") SET_PAGE = null; go(v); };

/* Lesson-start popup (Figma "Select Lesson" purple sheet) */
A.nodeTap = function (ev, domKey, lesKey, li) {
  const d = window.QBANK[domKey], l = d.lessons.find(x => x.key === lesKey);
  const u = UNIT_COLORS[d.color] || UNIT_COLORS.purple;
  const old = document.querySelector(".lesson-pop-veil"); if (old) old.remove();
  document.querySelectorAll(".node-col.sel").forEach(ringResume);
  const btn = ev.currentTarget;
  nodeRelease(btn);
  const r = btn.getBoundingClientRect();
  const veil = document.createElement("div");
  veil.className = "lesson-pop-veil";
  const canBoost = S.xp >= BOOST_COST;
  /* a node in short lessons says which one is next and how far along the node is */
  const LS = learnSet(domKey + "." + lesKey), done = lessonProg(domKey + "." + lesKey).stars > 0;
  const at = LS && !done ? Math.max(0, learnAt(domKey + "." + lesKey)) : -1;
  veil.innerHTML = `<div class="lesson-pop" style="--pop-c:${u.c};top:${Math.min(r.bottom + 14, window.innerHeight - 190)}px">
    <h3>${l.title}</h3>
    ${at >= 0 ? `<div class="lp-sub">الدرس ${toAr(at + 1)} من ${toAr(LS.lessons.length)}، ${esc(LS.lessons[at].title)}</div>` : LS ? `<div class="lp-sub">تدريب بوقت — مثل الاختبار</div>` : ""}
    <button class="lp-boost ${canBoost ? "" : "cant"}" id="lpBoost" aria-label="ضاعف خبرة هذا الدرس مقابل ${toAr(BOOST_COST)} جوهرة">
      <span class="lpb-ico"><img src="assets/icons/lightning.svg" width="20" height="20" alt=""></span>
      <span class="lpb-label">ضاعف الخبرة <span dir="ltr">×٢</span></span>
      <span class="lpb-cost">${ico("gem", 13)} ${toAr(BOOST_COST)}</span>
    </button>
    <button class="btn btn-white" style="color:${u.c};box-shadow:0 5px 0 ${u.pale}">${at > 0 ? "كمّل" : LS && done ? "تدرّب" : "ابدأ"}</button>
  </div>`;
  let untrapPop = null;
  const selCol = btn.closest(".node-col");
  if (selCol) ringSelect(selCol);
  const popClose = start => {
    if (untrapPop) { untrapPop(); untrapPop = null; }
    veil.remove();
    if (selCol) ringResume(selCol);
  };
  /* the node still shows through the veil: pressing it again presses it — the
     face drops and settles back — and closes the card, as Duolingo's does */
  const onNode = e => { const b = btn.getBoundingClientRect(); return e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom + 7; };
  let downOn = false;
  veil.addEventListener("pointerdown", e => { if (e.target === veil && onNode(e)) { downOn = true; btn.classList.add("down"); A.nodePress(); } });
  veil.addEventListener("pointercancel", () => { downOn = false; btn.classList.remove("down"); });
  veil.onclick = e => {
    if (e.target !== veil) return;
    if (downOn) { downOn = false; btn.classList.remove("down"); nodeRelease(btn); }
    popClose();
  };
  let boost = false;
  const bb = veil.querySelector("#lpBoost");
  if (bb) bb.onclick = () => {
    if (S.xp < BOOST_COST) { toast("جواهرك لا تكفي للمضاعفة"); return; }
    boost = !boost;
    bb.classList.toggle("on", boost);
    const cost = bb.querySelector(".lpb-cost");
    if (cost) cost.innerHTML = boost ? `مفعّل ✓` : `${ico("gem", 13)} ${toAr(BOOST_COST)}`;
    if (boost) snd("boost-toggle", () => sndGood());
  };
  veil.querySelector(".btn-white").onclick = () => { snd("start-lesson"); popClose(true); A.startLesson(domKey, lesKey, boost); };
  document.body.appendChild(veil);
  untrapPop = trapOverlay(veil, popClose, { label: l.title, focus: ".btn-white" });
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
  pop.style.setProperty("--arrow-x",
    "clamp(20px, calc(50% - " + dx.toFixed(1) + "px), calc(100% - 20px))");
  /* Make room the way Duolingo does. The bubble used to be clamped to the
     viewport, which parked it ON TOP of the node it was pointing at whenever
     that node sat in the lower part of the screen. Now: if the bubble would
     run under the tab bar, scroll the node up by exactly that much, open the
     bubble where the node is going to be, and let it spring in once the
     scroll lands. offsetHeight is used because it ignores the spring-in
     transform — getBoundingClientRect() read back zero mid-spring. */
  const gap = 14, popH = pop.offsetHeight;
  const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 0;
  const floor = window.innerHeight - navH - 10;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight - window.scrollY);
  let dy = Math.min(maxScroll, Math.max(0, nr.bottom + gap + popH - floor));
  if (nr.top - dy < 64) dy = Math.max(0, nr.top - 64);           // never under the stat bar
  pop.style.top = Math.max(8, nr.bottom - dy + gap) + "px";
  if (dy > 0) {
    pop.classList.add("pending");
    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      window.removeEventListener("scrollend", land);
      pop.classList.remove("pending");
    };
    window.addEventListener("scrollend", land);
    setTimeout(land, 450);                                      // browsers without scrollend
    window.scrollBy({ top: dy, behavior: "smooth" });
  }
};

A.startLesson = function (domKey, lesKey, boost) {
  sayStop(); sfxHush();
  sndWarm();   // every Brilliant sound as the lesson opens, not after its first answer
  const d = window.QBANK[domKey], l = d.lessons.find(x => x.key === lesKey);
  const key = domKey + "." + lesKey;
  if (learnSet(key) && !lessonProg(key).stars) { A.startLearn(domKey, lesKey, null, boost); return; }
  /* decided before the questions are picked: the first lesson anyone ever plays
     is both shorter and unloseable */
  const safe = !Object.values(S.lessons).some(p => p.plays > 0);
  const qs = pickLessonQuestions(l, key, safe);
  if (!qs.length) { showModal("", "لا توجد أسئلة", "لا توجد أسئلة متاحة لهذا الدرس في مسارك الحالي.", "حسناً"); return; }
  const prev = S.lessons[key];
  const replay = !!(prev && prev.stars > 0);            // already cleared → farm mode (+2/+2)
  /* A student who loses their first lesson does not come back, and there is
     nothing to learn from running out of hearts three minutes in. The first
     lesson anyone ever plays runs without them: no hearts in the header, no
     heart lost on a wrong answer, no fail screen. Hearts arrive in lesson two,
     once there is a win behind them. A unit unlocked by the placement test has
     plays 0 too, so a strong student gets the same gentle first play. */
  let xpBoost = false;
  if (boost && S.xp >= BOOST_COST) { S.xp -= BOOST_COST; xpBoost = true; save(); }  // pay for 2× rank XP up front
  SES = { mode: "lesson", domKey, lesKey, key, title: l.title, method: l.method || "", queue: qs.slice(), total: qs.length, idx: 0, done: 0, firstTry: {}, retried: {}, sel: null, locked: false, xp: 0, gems: 0, replay, xpBoost, safe, notime: safe, hearts: LEVEL_HEARTS, left: Q_SECS, timer: null, tSpent: 0, tAnswered: 0 };
  /* Every lesson ships a written intro — the rule, the method, the common
     mistake — and none of it had ever rendered, because each question also
     carries its own method and "q.method || SES.method" always took the
     question's. Teach first on a lesson you have not cleared. */
  const T = window.QTEACH && window.QTEACH[key];
  /* a node taught by short lessons replays as timed exam practice: the
     teaching already happened, and cards would only teach it twice */
  if (learnSet(key)) { SES.safe = false; SES.notime = false; renderSession(); return; }
  if (T) { teachArrange(T); renderSession(); return; }              // cards for any chunk not yet taught, then its questions
  if (!replay && l.method) { renderLessonIntro(d, l); return; }     // lessons without cards yet
  renderSession();
};
/* «قانونان» / «٣ قوانين» / «١١ قانوناً» — a count with the noun in the form Arabic wants for it */
function countAr(n, f) { return n === 1 ? f.one : n === 2 ? f.two : n <= 10 ? `${toAr(n)} ${f.few}` : `${toAr(n)} ${f.many}`; }
const N_RULES = { one: "قانون واحد", two: "قانونان", few: "قوانين", many: "قانوناً" };
const N_QS = { one: "سؤال واحد", two: "سؤالان", few: "أسئلة", many: "سؤالاً" };

/* Teaching cards live INSIDE the lesson (js/data/teach.js). A chunk is two or
   three rules and one quick check, and it is shown right before the first
   question that needs it, so nobody reads twenty rules to answer eight
   questions, and nobody meets a formula they will not use in the next minute.
   The queue is regrouped by chunk first; a chunk none of the session's
   questions need is not taught this time (it waits in the guidebook). */
function teachArrange(T) {
  const chunkOf = {};
  T.chunks.forEach((c, i) => c.q.forEach(id => { chunkOf[id] = i; }));
  const at = q => chunkOf[q.id] === undefined ? 99 : chunkOf[q.id];
  SES.queue.sort((a, b) => at(a) - at(b));
  const rec = S.teach[SES.key] || { taught: [] };
  SES.teach = { T, chunkOf, shown: {}, cur: null, first: !rec.taught.length, steps: 0, seen: 0 };
  /* The bar's denominator has to know about the cards before the first one is
     drawn, so the same gate decision is made here in advance: a chunk is taught
     when one of this session's questions needs it and one of its rules is new.
     Over- or under-counting would only make the bar cautious, but this is
     exact — it is the condition teachGate() applies, read from the same rec. */
  const need = [];
  SES.queue.forEach(q => { const ci = chunkOf[q.id]; if (ci !== undefined && need.indexOf(ci) < 0) need.push(ci); });
  const live = need.filter(ci => T.chunks[ci].steps.some(s => s.type === "rule" && !rec.taught.includes(s.n)));
  SES.teach.steps = live.reduce((n, ci) => n + teachSteps(T.chunks[ci]).length, 0)
    + (SES.teach.first && live.length ? 1 : 0);     // the one-off lead card: «قبل ما نبدأ», or the warm-up on a first lesson
}
function teachGate() {
  const t = SES.teach;
  if (t.cur) return true;
  const q = SES.queue[SES.idx];
  const ci = q && t.chunkOf[q.id];
  if (ci === undefined || t.shown[ci]) return false;
  t.shown[ci] = true;
  const rec = S.teach[SES.key] || { taught: [] };   // a chunk taught on an earlier play is not taught again
  if (!t.T.chunks[ci].steps.some(s => s.type === "rule" && !rec.taught.includes(s.n))) return false;
  /* The lead card, one either way, so the bar's count below stays exact. The
     first lesson anyone plays leads with the warm-up question instead of the
     plan: a new student's first act in the app should be answering something,
     not reading what they are about to be taught. */
  const lead = !t.first ? []
    : SES.safe && t.T.open ? [Object.assign({ type: "warm" }, t.T.open)]
    : [{ type: "title" }];
  const steps = lead.concat(teachSteps(t.T.chunks[ci]));
  t.cur = { ci, steps, i: 0, picked: null, revealed: false };
  return true;
}
const TEACH_COACH = {
  title: "نتعلّم شوي ونحلّ شوي — ما نحفظ كل شيء مرة وحدة.",
  warm: "براسك، بدون ورقة. ما فيه قلوب ولا وقت هنا.",
  warmGood: "هذي نقطة البداية — والباقي كله اختصارات لها.",
  warmBad: "ولا يهمك، هذا سؤال قبل الشرح مو بعده.",
  rule: ["اقرأ المثال مرة بصوتك — يثبت أسرع.", "غطِّ الصيغة بإصبعك وحاول تتذكرها قبل ما تكمل."],
  check: "جرّب قبل ما تشوف الحل — الغلط هنا مجاني.",
  rfill: "قلها بصوتك وأنت ترتّبها — تنحفظ أسرع.",
  rnum: "كل رقم مكانه كلمة من القاعدة.",
  good: "تذكّرته بنفسك، فراح يثبت أطول.",
  bad: "طبيعي. الغلط الآن أرخص من الغلط في الاختبار.",
  book: "دفترك كامل هنا. لا تحفظه — ارجع له وقت الحاجة.",
  win: "راجعها بكرة خمس دقائق — أفضل من ساعة اليوم."
};
function renderTeach() {
  const t = SES.teach, cur = t.cur, chunk = t.T.chunks[cur.ci], step = cur.steps[cur.i];
  const d = window.QBANK[SES.domKey], l = d.lessons.find(x => x.key === SES.lesKey);
  const u = UNIT_COLORS[d.color] || UNIT_COLORS.purple;
  const n = cur.steps.length, last = cur.i === n - 1, pct = sesPct();
  const rules = chunk.steps.filter(s => s.type === "rule");
  const nq = chunk.q.filter(id => SES.queue.some(q => q.id === id)).length;
  const goLabel = last ? "يلا نحلّ" : "التالي";
  let body = "", coach = "", btn = "";
  if (step.type === "title") {
    body = `<div class="teach-card tc-hero">
      <div class="tc-kicker">قبل ما نبدأ</div>
      <h1 class="tc-chunk-title">${esc(l.title)}</h1>
      <p class="tc-chunk-goal">${esc(l.goal || "")}</p>
      <div class="tc-plan">${countAr(rules.length, N_RULES)} ← تمرين سريع ← ${countAr(nq, N_QS)}</div>
    </div>`;
    coach = TEACH_COACH.title;
    btn = `<button class="btn" onclick="A.teachNext()">${goLabel}</button>`;
  } else if (step.type === "rule") {
    const k = rules.indexOf(step) + 1;
    /* the chip shows the rule in words when the card has them (`plain`); the
       book's letter formula stays exact in the guidebook, where it is reference */
    const fig = window.QTEACH_FIG && window.QTEACH_FIG[SES.key + ":" + step.n];
    body = `<div class="teach-card">
      <div class="tc-kicker">${esc(chunk.title)}، قانون ${toAr(k)} من ${toAr(rules.length)}</div>
      <div class="tc-head"><span class="li-num">${toAr(k)}</span><h2 class="tc-title">${esc(step.title)}</h2></div>
      <p class="tc-say">${fracs(esc(step.say))}</p>
      ${fig ? `<div class="tc-fig">${fig}</div>` : ""}
      <div class="tc-formula">${fracs(esc(step.plain || step.formula))}</div>
      <div class="tc-eg"><span class="tc-eg-l">مثال</span>${fracs(esc(step.example))}</div>
      ${step.hook ? `<div class="tc-hook"><span class="tc-eg-l">تذكّر</span>${fracs(esc(step.hook))}</div>` : ""}
    </div>`;
    coach = TEACH_COACH.rule[(k - 1) % 2];
    btn = `<button class="btn" onclick="A.teachNext()">${goLabel}</button>`;
  } else if (step.type === "rfill" || step.type === "rnum") {
    const c = tcCloze(cur, step), z = cur.cz;
    body = `<div class="tc-rf">${rfBody(c, z.checked, "A.tcUnfill", "A.tcTile")}
      ${z.checked ? `<div class="tc-why ${z.ok ? "good" : "bad"}">${z.ok ? "✓ بالضبط — " : "الصحيح: "}${esc(c.eq.split("_").map((p, j, all) => j === all.length - 1 ? p : p + c.a[j]).join("").replace(/\n/g, " ، "))}</div>` : ""}</div>`;
    coach = step.type === "rfill" ? TEACH_COACH.rfill : TEACH_COACH.rnum;
    btn = z.checked ? `<button class="btn" onclick="A.teachNext()">${goLabel}</button>`
      : `<button class="btn" id="checkBtn" onclick="A.tcCheck()"${z.ui.slots.filter(k => k !== undefined).length === c.a.length ? "" : " disabled"}>تحقق</button>`;
  } else {
    /* The warm-up and the quick check are the same card underneath — a question
       with no hearts and no clock. The warm-up only wears a different hat: it
       comes before any teaching, so it says so, and its verdict is written for
       a student who has not been told anything yet. */
    const warm = step.type === "warm";
    const p = cur.picked, ok = p === step.answer;
    const cls = i => p === null ? "" : i === step.answer ? (cur.revealed ? "correct" : "") : i === p ? "wrong" : "dim";
    const verdict = warm ? (ok ? step.good : step.bad) : step.why;
    body = `${warm
      ? `<div class="tc-warm-lead"><div class="tc-kicker">أول سؤال</div><h1 class="tc-warm-h">جاوب قبل أي شرح</h1></div>`
      : `<div class="tc-practice">تمرين سريع — بدون قلوب ولا وقت</div>`}
      <div class="tc-q${warm ? " tc-q-warm" : ""}">${fracs(esc(step.q))}</div>
      <div class="choices tc-choices${p === null ? "" : " answered"}">${step.choices.map((c, i) =>
        `<div class="slot"><span class="base" aria-hidden="true"></span><button class="choice ${cls(i)}" data-ci="${i}" style="--d:${0.05 + i * 0.07}s" onclick="A.teachPick(${i})" ${p === null ? "" : "disabled"}><span class="ch-shine" aria-hidden="true"></span><i class="ch-spk k1" aria-hidden="true"></i><i class="ch-spk k2" aria-hidden="true"></i><i class="ch-spk k3" aria-hidden="true"></i><span class="ch-letter">${LETTERS[i]}</span><span class="ch-txt">${fracs(esc(c))}</span></button></div>`).join("")}</div>
      ${p === null ? "" : `<div class="tc-why ${ok ? "good" : "bad"}">${ok ? (warm ? "✓ صح — " : "✓ بالضبط — ") : ""}${fracs(esc(verdict))}</div>`}`;
    coach = warm ? (p === null ? TEACH_COACH.warm : ok ? TEACH_COACH.warmGood : TEACH_COACH.warmBad)
          : p === null ? TEACH_COACH.check : ok ? TEACH_COACH.good : TEACH_COACH.bad;
    const label = warm ? "وريني الأسرع" : goLabel;
    btn = p === null ? `<button class="btn" disabled>${label}</button>` : `<button class="btn" onclick="A.teachNext()">${label}</button>`;
  }
  const canBack = cur.i > 0;
  $app.innerHTML = `<div class="screen screen-full screen-teach" style="--li-c:${u.c};--li-s:${u.s};--li-h:${u.h}">
    <div class="session-top teach-top">
      <button class="x-btn" onclick="A.teachExit()" aria-label="خروج">${X_SVG}</button>
      <div class="progress teach-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="تقدمك في الدرس"><i style="width:${pct}%"></i></div>
      <span class="tc-back-ph" aria-hidden="true"></span>
    </div>
    <div class="teach-body">${body}<div class="tc-coach">${BULB_SVG}<span>${coach}</span></div></div>
    <div class="action-bar mock-bar"><button class="btn btn-ghost mk-side" onclick="A.teachBack()" ${canBack ? "" : "disabled"}>السابق</button>${btn}</div>
  </div>`;
  window.scrollTo(0, 0);
}
/* the card's own state for the two screens after a rule: which tile sits in
   which blank, and whether it was checked */
function tcCloze(cur, step) {
  if (!cur.cz || cur.cz.i !== cur.i) cur.cz = { i: cur.i, ui: { slots: [] }, _tiles: shuffle(step.tiles.map((x, k) => k)), checked: false, ok: false };
  return Object.assign({}, step, { ui: cur.cz.ui, _tiles: cur.cz._tiles });
}
function tcPaint() {
  const cur = SES.teach.cur, c = tcCloze(cur, cur.steps[cur.i]);
  const eq = document.getElementById("lnEq"); if (eq) eq.innerHTML = learnFillEq(c, false, "A.tcUnfill");
  document.querySelectorAll("#lnTiles .ln-tile").forEach(b => b.classList.toggle("used", c.ui.slots.indexOf(+b.dataset.k) >= 0));
  const cb = document.getElementById("checkBtn");
  if (cb) cb.disabled = c.ui.slots.filter(k => k !== undefined).length !== c.a.length;
}
A.tcTile = function (k) {
  const cur = SES && SES.teach && SES.teach.cur; if (!cur || !cur.cz || cur.cz.checked) return;
  const step = cur.steps[cur.i], sl = cur.cz.ui.slots;
  if (sl.indexOf(k) >= 0) return;
  let j = 0; while (sl[j] !== undefined) j++;
  if (j >= step.a.length) return;
  sl[j] = k; stampTile(cur.cz.ui, k);
  snd("tile-place", () => sndTap());
  tcPaint();
};
A.tcUnfill = function (j) {
  const cur = SES && SES.teach && SES.teach.cur; if (!cur || !cur.cz || cur.cz.checked) return;
  cur.cz.ui.slots[j] = undefined;
  snd("tile-remove"); tcPaint();
};
/* a miss here is a miss on the rule: the guidebook floats it up, as a check's does */
A.tcCheck = function () {
  const cur = SES && SES.teach && SES.teach.cur; if (!cur || !cur.cz || cur.cz.checked) return;
  const step = cur.steps[cur.i], c = tcCloze(cur, step);
  const want = learnFillWant(c);
  cur.cz.ok = want.every((x, j) => c.tiles[c.ui.slots[j]] === x);
  cur.cz.checked = true;
  const rec = teachRecord(), n = step.of && step.of.n;
  if (n != null) { if (cur.cz.ok) rec.missed = rec.missed.filter(x => x !== n); else if (!rec.missed.includes(n)) rec.missed.push(n); }
  if (cur.cz.ok) playCorrect(); else snd("wrong-answer", () => sndBad());
  save();
  /* drawn in place, so the card jumps where it stands instead of springing in again */
  const eq = document.getElementById("lnEq");
  if (eq) eq.innerHTML = learnFillEq(c, true, "A.tcUnfill");
  document.querySelectorAll("#lnTiles .ln-tile").forEach(b => { b.disabled = true; });
  const box = document.querySelector(".tc-rf");
  if (box) box.insertAdjacentHTML("beforeend", `<div class="tc-why ${cur.cz.ok ? "good" : "bad"}">${cur.cz.ok ? "✓ بالضبط — " : "الصحيح: "}${esc(c.eq.split("_").map((p, j, all) => j === all.length - 1 ? p : p + c.a[j]).join("").replace(/\n/g, " ، "))}</div>`);
  const cb = document.getElementById("checkBtn");
  if (cb) cb.outerHTML = `<button class="btn" onclick="A.teachNext()">${cur.i === cur.steps.length - 1 ? "يلا نحلّ" : "التالي"}</button>`;
  if (cur.cz.ok && eq) adWave(byPlaced(cur.cz.ui, eq.querySelectorAll(".ln-blank")));
  else teachFx(eq, cur.cz.ok);
};
function teachRecord() { return S.teach[SES.key] = S.teach[SES.key] || { taught: [], missed: [] }; }
/* A practice tap: no hearts, no timer, no XP, no qstats (qstats orders the
   real queue, and a practice miss must not poison it). The miss is remembered
   per rule so the guidebook can float it to the top. */
A.teachPick = function (i) {
  const cur = SES && SES.teach && SES.teach.cur; if (!cur) return;
  const step = cur.steps[cur.i];
  if ((step.type !== "check" && step.type !== "warm") || cur.picked !== null) return;
  cur.picked = i; cur.revealed = i === step.answer;
  /* The warm-up is asked before the rules exist, so missing it says nothing
     about them — only a check writes the per-rule miss the guidebook reads. */
  if (step.type === "check") {
    const rec = teachRecord(), ns = SES.teach.T.chunks[cur.ci].steps.filter(s => s.type === "rule").map(s => s.n);
    if (cur.revealed) rec.missed = rec.missed.filter(n => !ns.includes(n));
    else ns.forEach(n => { if (!rec.missed.includes(n)) rec.missed.push(n); });
  }
  if (cur.revealed) playCorrect(); else snd("teach-check-wrong");
  /* once per check: back and forward again let one check count three times toward the day (the audit, 2026-10-28) */
  const tk = cur.ci + ":" + cur.i; SES.teachTicked = SES.teachTicked || {};
  if (!SES.teachTicked[tk]) { SES.teachTicked[tk] = 1; questTick(); }
  save();
  renderTeach();
  teachFx(document.querySelector(`.tc-choices .choice[data-ci="${i}"]`), cur.revealed);
  if (!cur.revealed) setTimeout(() => {   // the right answer shows a beat later, so the eye follows the correction
    cur.revealed = true;
    const el = document.querySelector(`.tc-choices .choice[data-ci="${step.answer}"]`);
    if (el) el.classList.add("correct");
  }, motionReduced() ? 0 : 380);
};
/* The check answers with the lesson's own motion: the GSAP jump on a right
   pick, the drop-and-shake on a wrong one. No strike, no confetti, no streak
   tag — a practice tap is not a run. */
function teachFx(card, ok) {
  ansBuzz(ok);
  if (!fxOn() || !window.gsap || !card) return;
  fxClear();
  fxTl = gsap.timeline();
  if (fxReduced()) {                     // the reduced variant: settle lifted, no travel
    if (ok) fxTl.fromTo(card, { scale: .97 }, { scale: 1, y: FXP(-7), duration: .18, ease: 'power2.out' });
    return;
  }
  if (ok) fxAddJump(fxTl, card, 0); else fxAddFail(fxTl, card, 0);
}
A.teachNext = function () {
  const t = SES && SES.teach, cur = t && t.cur; if (!cur) return;
  if (cur.i < cur.steps.length - 1) { snd("continue"); cur.i++; cur.picked = null; cur.revealed = false; renderTeach(); return; }
  const rec = teachRecord();
  t.T.chunks[cur.ci].steps.forEach(s => { if (s.type === "rule" && !rec.taught.includes(s.n)) rec.taught.push(s.n); });
  save();
  t.seen += cur.steps.length;           // banked, so the bar does not step back
  t.first = false; t.cur = null;
  snd("teach-chunk-done", () => sndGood());                            // the chunk is finished; it was silent
  renderSession();
};
A.teachBack = function () {
  const cur = SES && SES.teach && SES.teach.cur; if (!cur || cur.i === 0) return;
  cur.i--; cur.picked = null; cur.revealed = false; renderTeach();
};
/* Leaving before the first question costs nothing, so no confirm; after that
   it is the session's own quit, which asks. */
A.teachExit = function () {
  if (!SES) return;
  if (SES.done === 0 && SES.idx === 0) { if (SES.xpBoost) gainGems(BOOST_COST); SES = null; save(); go("path"); return; }
  A.quitSession();
};
function teachRulesHtml(chunk) {
  return chunk.steps.filter(s => s.type === "rule").map(s => `<div class="tc-mini"><b>${esc(s.title)}</b><div class="tc-formula">${fracs(esc(s.plain || s.formula))}</div><div class="tc-eg"><span class="tc-eg-l">مثال</span>${fracs(esc(s.example))}</div>${s.hook ? `<div class="tc-hook"><span class="tc-eg-l">تذكّر</span>${fracs(esc(s.hook))}</div>` : ""}</div>`).join("");
}
/* «دفتر القوانين»: every rule of the lesson, on demand. Rules the student
   missed in a check come first, taught ones next with a tick, the rest under
   a divider; the book's notes and exam tricks close it. */
A.openBook = function (domKey, lesKey) {
  const d = window.QBANK[domKey], l = d && d.lessons.find(x => x.key === lesKey);
  if (!l || !l.rules) return;
  const u = UNIT_COLORS[d.color] || UNIT_COLORS.purple;
  const rec = (S.teach || {})[domKey + "." + lesKey] || { taught: [], missed: [] };
  const status = r => rec.missed.includes(r.n) ? "miss" : rec.taught.includes(r.n) ? "done" : "";
  const rank = { miss: 0, done: 1, "": 2 };
  const rules = l.rules.slice().sort((a, b) => rank[status(a)] - rank[status(b)] || a.n - b.n);
  const anyTaught = rules.some(r => status(r));
  const firstOpen = !S.bookSeen; S.bookSeen = true; save();
  let rows = "", divided = false;
  rules.forEach(r => {
    const st = status(r);
    if (anyTaught && !st && !divided) { divided = true; rows += `<div class="bk-sep">باقي القوانين</div>`; }
    rows += bookRow(r, st);
  });
  const tips = (l.notes || []).concat(l.tricks || []).map(x => `<div class="ex-tip">${BULB_SVG}<span>${fracs(esc(x))}</span></div>`).join("");
  const old = document.querySelector(".book-veil"); if (old) old.remove();
  const veil = document.createElement("div");
  veil.className = "method-veil book-veil";
  veil.innerHTML = `<div class="method-sheet book-sheet" style="--li-c:${u.c};--li-s:${u.s}">
    <div class="ms-grip"></div>
    <div class="ms-head"><span class="ms-bulb bk-bulb"><img src="assets/icons/book.svg" width="22" height="22" alt=""></span><h3>دفتر القوانين</h3></div>
    <div class="ms-sub">${esc(l.title)}، ${countAr(l.rules.length, N_RULES)}</div>
    ${firstOpen ? `<div class="tc-coach bk-coach">${BULB_SVG}<span>${TEACH_COACH.book}</span></div>` : ""}
    ${l.figure ? `<div class="li-fig">${l.figure}</div>` : ""}
    <div class="ms-body bk-body">${rows}${tips}</div>
    <button class="btn ms-close" onclick="A.closeBook()">رجوع</button>
  </div>`;
  veil.onclick = e => { if (e.target === veil) A.closeBook(); };
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));
  BK_UNTRAP = trapOverlay(veil, () => A.closeBook(), { label: "دفتر القوانين", focus: ".ms-close" });
};
let BK_UNTRAP = null;
A.closeBook = function () {
  if (BK_UNTRAP) { BK_UNTRAP(); BK_UNTRAP = null; }
  const v = document.querySelector(".book-veil"); if (!v) return;
  v.classList.remove("show"); setTimeout(() => v.remove(), 320);
};
function bookRow(r, st) {
  return `<div class="li-step bk-row ${st}"><span class="li-num">${st === "done" ? "✓" : st === "miss" ? "!" : toAr(r.n)}</span><span class="li-txt"><b class="li-lead">${esc(r.name)}</b><span class="li-formula">${fracs(esc(r.formula))}</span><span class="li-when">${fracs(esc(r.when))}</span></span></div>`;
}
/* «القوانين»: the whole unit in one book, from the banner. Every lesson in
   order with its rules, each marked as the lesson book marks it, so the
   student can look a law up without knowing which lesson it lives in. */
A.openUnitBook = function (domKey) {
  const d = window.QBANK[domKey]; if (!d) return;
  const u = UNIT_COLORS[d.color] || UNIT_COLORS.purple;
  const firstOpen = !S.bookSeen; S.bookSeen = true; save();
  let rows = "", total = 0;
  d.lessons.forEach((l, li) => {
    if (!l.rules) return;
    const rec = (S.teach || {})[domKey + "." + l.key] || { taught: [], missed: [] };
    total += l.rules.length;
    rows += `<div class="bk-les"><span>الدرس ${toAr(li + 1)}، ${esc(l.title)}</span><span class="bk-les-c">${countAr(l.rules.length, N_RULES)}</span></div>`;
    l.rules.forEach(r => rows += bookRow(r, rec.missed.includes(r.n) ? "miss" : rec.taught.includes(r.n) ? "done" : ""));
  });
  const old = document.querySelector(".book-veil"); if (old) old.remove();
  const veil = document.createElement("div");
  veil.className = "method-veil book-veil";
  veil.innerHTML = `<div class="method-sheet book-sheet" style="--li-c:${u.c};--li-s:${u.s}">
    <div class="ms-grip"></div>
    <div class="ms-head"><span class="ms-bulb bk-bulb"><img src="assets/icons/book.svg" width="22" height="22" alt=""></span><h3>القوانين</h3></div>
    <div class="ms-sub">${esc(d.title)}، ${countAr(total, N_RULES)} في ${toAr(d.lessons.length)} دروس</div>
    ${firstOpen ? `<div class="tc-coach bk-coach">${BULB_SVG}<span>${TEACH_COACH.book}</span></div>` : ""}
    <div class="ms-body bk-body">${rows}</div>
    <button class="btn ms-close" onclick="A.closeBook()">رجوع</button>
  </div>`;
  veil.onclick = e => { if (e.target === veil) A.closeBook(); };
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));
  BK_UNTRAP = trapOverlay(veil, () => A.closeBook(), { label: "دفتر القوانين", focus: ".ms-close" });
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
      ${l.goal ? `<p class="li-goal">${esc(l.goal)}</p>` : ""}
    </div>
    <div class="li-body" style="--li-c:${u.c};--li-s:${u.s}">${l.rules ? introRules(l) : introSteps(l.method)}</div>
    <div class="action-bar">
      <button class="btn" onclick="A.beginQuestions()">فهمت، ابدأ</button>
    </div>
  </div>`;
  window.scrollTo(0, 0);
}
/* The curriculum ships every rule as name / formula / when-to-use, with the
   book's notes and exam tricks after them. Those are three columns, not one
   sentence, so they get their own rows; `method` stays the flat fallback. */
function introRules(l) {
  let h = l.figure ? `<div class="li-fig">${l.figure}</div>` : "";
  h += l.rules.map((r, i) => `<div class="li-step" style="--d:${(i * 0.06).toFixed(2)}s">
      <span class="li-num">${toAr(i + 1)}</span>
      <span class="li-txt"><b class="li-lead">${esc(r.name)}</b><span class="li-formula">${fracs(esc(r.formula))}</span><span class="li-when">${fracs(esc(r.when))}</span></span>
    </div>`).join("");
  return h + (l.notes || []).concat(l.tricks || []).map(t => `<div class="ex-tip">${BULB_SVG}<span>${esc(t)}</span></div>`).join("");
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
    const body = fracs(esc(t.replace(/^💡\s*/, "")));
    if (warn) return `<div class="ex-tip">${BULB_SVG}<span>${body}</span></div>`;
    return `<div class="ex-step">${body}</div>`;
  }).join("");
}

function questionBody(q, selIdx, lockHandlers, pickFn, method) {
  const isCmp = q.format === "comparison";
  const choices = isCmp ? CMP_CHOICES : q.choices;
  let h = `<div class="q-top"><div class="q-kicker">${isCmp ? "قارن بين القيمتين ثم اختر:" : "اختر الإجابة الصحيحة:"}</div></div>`;
  // 104 comparison questions carry a stem that just restates the kicker above it
  const echoesKicker = isCmp && /^قارن\s+بين\s+القيمتين/.test(String(q.stem || "").trim());
  if (q.stem && !echoesKicker) h += `<div class="q-stem">${fracs(q.stem)}</div>`;
  if (q.figure) h += `<div class="q-figure">${q.figure}</div>`;
  if (isCmp) h += `<div class="cmp-wrap">
      <div class="cmp-box"><div class="cmp-t">القيمة الأولى</div><div class="cmp-v">${fracs(q.value1)}</div></div>
      <div class="cmp-box"><div class="cmp-t">القيمة الثانية</div><div class="cmp-v">${fracs(q.value2)}</div></div></div>`;
  /* .slot + .base is the reference's structure: the grey base stays put so the
     card has something to hop off, which is what makes the jump read. */
  /* A radio group, not four unrelated buttons: a screen reader is told these are
     one choice with four options and which one is taken, the group is a single
     stop in the tab order, and the arrows move between them. */
  h += `<div class="choices" role="radiogroup" aria-label="${isCmp ? "قارن بين القيمتين ثم اختر" : "اختر الإجابة الصحيحة"}">` + choices.map((c, i) =>
    `<div class="slot"><span class="base" aria-hidden="true"></span>
     <button class="choice ${selIdx === i ? "sel" : ""}" data-ci="${i}" role="radio"
       aria-checked="${selIdx === i}" tabindex="${(selIdx === null || selIdx === undefined) ? (i === 0 ? 0 : -1) : (selIdx === i ? 0 : -1)}"
       style="--d:${0.05 + i * 0.07}s" ${lockHandlers ? "" : `onclick="${pickFn || "A.pick"}(${i})"`}>
       <span class="ch-shine" aria-hidden="true"></span>
       <i class="ch-spk k1" aria-hidden="true"></i><i class="ch-spk k2" aria-hidden="true"></i><i class="ch-spk k3" aria-hidden="true"></i>
       <span class="ch-letter">${LETTERS[i]}</span><span class="ch-txt">${fracs(c)}</span><span class="ch-key" aria-hidden="true">${toAr(i + 1)}</span></button></div>`).join("") + `</div>`;
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

let fxTl = null;

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
  fxFrames = null; fxParts = []; fxBolts = [];
  fxDraw();                              // an empty draw is a clear
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
  /* the sweep rides on xPercent (its own width is 23% of the card, so -140 → 490
     is the old -32% → 112%): a transform, not `left`, so it never asks for layout
     mid-jump. Skipped outright on a weak phone. */
  if (sh && !fxLite()) {
    tl.fromTo(sh, { xPercent: -140, opacity: 0 },
      { xPercent: 490, opacity: 1, duration: air, ease: 'none' }, at)
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

/* --------------------------------------------------------------------------
   ONE CANVAS FOR EVERYTHING THAT FLIES.
   The bolts, the sparks and the confetti used to be 44 DOM nodes plus an SVG
   the size of the column, and GSAP promoted every one of them to its own
   compositor layer the moment it touched them — ten of the confetti bits
   carried a clip-path mask on top. Allocating those layers is where the FIRST
   correct answer stuttered, and repainting a full-column SVG polyline at 60fps
   is where a weak phone kept stuttering. They are now shapes drawn into one
   canvas that the same GSAP timeline drives through plain objects: one layer,
   one paint per frame, nothing to promote, nothing to allocate on the next run.
   -------------------------------------------------------------------------- */
let fxCv = null, fxGeo = null, fxParts = [], fxBolts = [], fxFrames = null;
const FX_STAR  = [[.5, 0], [.61, .39], [1, .5], [.61, .61], [.5, 1], [.39, .61], [0, .5], [.39, .39]];
const FX_SHARD = [[0, .4], [.45, 0], [1, .25], [.72, 1], [.2, .78]];

/* Weak-phone mode: fewer particles and no shine sweep. Decided up front from
   the device, and then for good from the first full run — if a quarter of its
   frames came in slower than 28ms, the next one is lite and stays lite. */
const FX_LITE_KEY = "qudratiFxLite";
function fxLite() {
  try { if (localStorage.getItem(FX_LITE_KEY) === "1") return true; } catch (e) {}
  const mem = navigator.deviceMemory, cores = navigator.hardwareConcurrency;
  return (mem && mem <= 3) || (cores && cores <= 2);
}
function fxSetLite() { try { localStorage.setItem(FX_LITE_KEY, "1"); } catch (e) {} }

function fxCanvas() {
  const storm = document.getElementById("storm");
  if (!storm) return null;
  let cv = storm.querySelector("canvas");
  if (!cv) { cv = document.createElement("canvas"); storm.appendChild(cv); }
  const r = storm.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, fxLite() ? 1 : 2);   // lite: half the pixels to fill
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  /* the bolt paths were authored in the old SVG's 884x1920 box with
     preserveAspectRatio "slice": scale to cover, centred */
  const sc = Math.max(w / 884, h / 1920);
  fxGeo = { w, h, sc, ox: (w - 884 * sc) / 2, oy: (h - 1920 * sc) / 2 };
  fxCv = { cv, ctx };
  return fxCv;
}
function fxPoly(ctx, pts, w, h) {
  ctx.beginPath();
  pts.forEach(([u, v], i) => { const X = (u - .5) * w, Y = (v - .5) * h; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.closePath(); ctx.fill();
}
function fxDraw() {
  if (!fxCv || !fxGeo || !fxCv.cv.isConnected) return;
  const { ctx } = fxCv, { w, h, sc, ox, oy } = fxGeo;
  ctx.clearRect(0, 0, w, h);
  for (const b of fxBolts) {
    if (b.o <= 0) continue;
    ctx.globalAlpha = b.o;
    ctx.strokeStyle = b.color; ctx.lineWidth = b.w * sc; ctx.lineCap = ctx.lineJoin = "round";
    ctx.beginPath();
    b.pts.forEach(([x, y], i) => { const X = x * sc + ox + b.dx, Y = y * sc + oy + b.dy; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.stroke();
  }
  for (const p of fxParts) {
    if (p.o <= 0) continue;
    ctx.globalAlpha = p.o; ctx.fillStyle = p.color;
    ctx.save();
    ctx.translate(p.x0 + p.x, p.y0 + p.y); ctx.rotate(p.r * Math.PI / 180); ctx.scale(p.s, p.s);
    if (p.kind === "star") fxPoly(ctx, FX_STAR, p.size, p.size);
    else if (p.kind === "shard") fxPoly(ctx, FX_SHARD, p.size, p.size * .7);
    else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
/* one tick per frame for the whole timeline: draw, and time the frame */
function fxTick() {
  if (fxFrames) { const t = performance.now(); fxFrames.gaps.push(t - fxFrames.last); fxFrames.last = t; }
  fxDraw();
}
function fxDone() {
  if (fxFrames && fxFrames.gaps.length > 12) {
    const g = fxFrames.gaps.slice(2).sort((a, b) => a - b);
    if (g[Math.floor(g.length * .75)] > 28) fxSetLite();
  }
  fxFrames = null;
  fxParts = []; fxBolts = [];
  fxDraw();                              // clears
}

function fxSeedBits(TH, n) {
  const { w, h } = fxGeo, made = [];
  for (let i = 0; i < n; i++) {
    const shard = i % 3 === 0;
    made.push({
      kind: shard ? "shard" : "bit",
      size: shard ? 9 + Math.random() * 12 : 7 + Math.random() * 8,
      color: shard ? TH.shard : ['#8ee000', '#58cc02', '#b8f36a'][i % 3],
      x0: Math.random() * w, y0: h - 200, x: 0, y: 0, r: 0, s: .5, o: 0
    });
  }
  fxParts.push(...made);
  return made;
}
function fxSeedSparks(n, box, TH) {
  const { w, h } = fxGeo, made = [];
  for (let i = 0; i < n; i++) {
    made.push({
      kind: "star", size: 7 + Math.random() * 9, color: TH.bolt,
      x0: (box.x + Math.random() * box.w) / 100 * w, y0: (box.y + Math.random() * box.h) / 100 * h,
      x: 0, y: 0, r: 0, s: 0, o: 0
    });
  }
  fxParts.push(...made);
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
  if (!fxGeo) return;
  const lite = fxLite();
  const warm = document.querySelector(".progress > i");
  const cool = document.querySelector(".progress > .prog-cool");
  const tag = document.getElementById("fxTag");

  if (TH.bolts !== false) {
    const pts = str => str.split(" ").map(p => p.split(",").map(Number));
    fxBolts = [
      { pts: pts(TH.pA), w: TH.wA, color: TH.bolt, o: 0, dx: 0, dy: 0 },
      { pts: pts(TH.pB), w: TH.wB, color: TH.bolt, o: 0, dx: 0, dy: 0 }
    ];
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

  const bitEls = fxSeedBits(TH, lite ? 12 : 28);

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

  /* confetti: same launch window, a shorter flight — the tail used to outlive
     the sheet by a third of a second, which read as the screen still "doing
     something" after the answer had already landed */
  bitEls.forEach(el => {
    const w = at + .173 + Math.random() * .16;
    tl.fromTo(el, { o: 1, y: 0, x: 0, r: 0, s: .5 },
      {
        y: -(60 + Math.random() * 130), x: (Math.random() - .5) * 120,
        r: (Math.random() - .5) * 420, s: 1,
        duration: .34 + Math.random() * .14, ease: 'power2.out'
      }, w)
      .to(el, { y: '+=170', o: 0, r: '+=140', duration: .40, ease: 'power1.in' }, w + .32);
  });

  if (TH.bolts === false) return;

  const sparks = [...fxSeedSparks(lite ? 4 : 8, { x: 28, y: 8, w: 44, h: 16 }, TH),
                  ...fxSeedSparks(lite ? 3 : 6, { x: 12, y: 26, w: 60, h: 22 }, TH)];

  [[fxBolts[0], TH.a, TH.aHold, -14, -10], [fxBolts[1], TH.b, TH.bHold, 12, -12]].forEach(([b, t0, hold, dx, dy]) => {
    tl.set(b, { o: 1 }, at + t0)
      .to(b, { dx, dy, duration: hold, ease: 'none' }, at + t0)
      .to(b, { o: 0, duration: .05, ease: 'power2.in' }, at + t0 + hold);
  });

  const twinkle = (arr, w) => arr.forEach((p, i) => {
    tl.fromTo(p, { o: 0, s: 0, r: 0 },
      { o: 1, s: 1, r: 22, duration: .12, ease: 'back.out(3)' }, w + i * .03)
      .to(p, { o: 0, s: .2, duration: .16, ease: 'power1.in' }, w + i * .03 + .22);
  });
  const nA = lite ? 4 : 8;
  twinkle(sparks.slice(0, nA), at + TH.a + .02);
  twinkle(sparks.slice(nA), at + TH.b + .02);
}

/* The reference's press feedback: the card sinks into its base while held.
   GSAP owns the transform, so this has to go through GSAP too. */
function fxBindPress() {
  if (!window.gsap) return;
  document.querySelectorAll(".screen-session .choice, .screen-learn .ln-pr, .screen-learn .ln-tile, .screen-learn .ln-key").forEach(c => {
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

/* the vibration setting promises «نبضة خفيفة مع كل إجابة», and no answer ever
   vibrated (the audit, 2026-10-28): a right answer taps once, a miss twice */
const ansBuzz = ok => buzz(ok ? 14 : [24, 60, 24]);
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
  if (run >= 3) snd("answer-run");             // every answer that lights the bar (the user: «make it for every lighting»)
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
  fxCanvas();                            // sized to the column before anything is seeded
  fxFrames = fxLite() ? null : { last: performance.now(), gaps: [] };
  fxTl = gsap.timeline({ onUpdate: fxTick, onComplete: fxDone });
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

/* How full is the bar? The old answer was correct-answers over a total frozen at
   the start, while a miss quietly pushed the question to the back of the queue —
   so at seven of eight the bar claimed 88% with three retries still hidden behind
   it. The queue is the honest denominator: a correct answer fills the bar, a miss
   lengthens the queue and the bar gives a little ground, and it reaches the end
   exactly when the student does.

   The teaching cards are on the same track. They used to carry a bar of their
   own, scaled to the chunk, which filled to 100% on the quick check and then
   dropped back to nothing as the first question arrived — four times over in a
   lesson with four chunks. The single loudest reward in the loop cannot also be
   the thing that takes progress away, so the cards count as steps toward the one
   denominator: the bar crosses the boundary without a seam. */
function sesPct(resolved) {
  /* a short lesson's bar counts the lesson as it was dealt: a miss queues the
     item again at the end, but the bar holds its ground instead of dropping */
  if (SES.mode === "learn") {
    const at = Math.min(SES.base, SES.got + (resolved === undefined ? 0 : resolved - SES.idx));
    return Math.round(Math.min(1, at / Math.max(1, SES.base)) * 100);
  }
  const t = SES.teach;
  const at = (t ? t.seen + (t.cur ? t.cur.i + 1 : 0) : 0)
    + (resolved === undefined ? SES.idx : resolved);
  const n = Math.max(1, (t ? t.steps : 0) + SES.queue.length);
  return Math.round(Math.min(1, at / n) * 100);
}
/* The bar moved only on the next render, so the single loudest reward in the loop —
   your answer pushing the bar forward — never happened. Paint it the moment the
   answer lands, and let the CSS transition carry it. */
function paintProg(resolved) {
  const pct = sesPct(resolved);
  document.querySelectorAll(".screen-session .progress > i").forEach(i => { i.style.width = pct + "%"; });
  const bar = document.querySelector(".screen-session .progress");
  if (bar) bar.setAttribute("aria-valuenow", pct);
  const c = document.getElementById("sesCount");
  if (c) c.textContent = sesCountLine(resolved);
}
function sesCountLine(resolved) {
  const at = Math.min((resolved === undefined ? SES.idx : resolved) + 1, SES.queue.length);
  return "سؤال " + toAr(at) + " من " + toAr(SES.queue.length);
}

/* ============================================================
   SHORT LESSONS — js/data/learn.js
   ------------------------------------------------------------
   A path node used to be a whole chapter of the book: thirteen
   rules read off cards, then eight timed exam questions, about
   fifteen minutes before anything was won. Where a node has a
   learn set it is four to six short lessons instead, about three
   minutes each, one idea each, taught by doing:
     اكتشف — a guess, then the trick unfolding in big numbers
     جرّب  — the trick's one step, filled in from tiles
     ثبّت  — quick reps in several shapes, new numbers every play
     تحدَّ — one real question from the bank
   Nothing is timed while learning; a finished node replays as
   timed exam practice. An item may be a function of LRNG, so a
   replay — or a missed item coming back at the end — arrives
   with new numbers instead of an answer to remember.
   ============================================================ */
function learnSet(key) { return window.QLEARN && window.QLEARN[key]; }
function learnRec(key) {
  const r = (S.learn || {})[key];
  return r && Array.isArray(r.done) ? r : { done: [], acc: {} };
}
/* the first short lesson of the node not finished yet, or -1 once all are */
function learnAt(key) {
  const L = learnSet(key); if (!L) return -1;
  const done = learnRec(key).done;
  return L.lessons.findIndex(x => done.indexOf(x.id) < 0);
}
const arN = n => (n < 0 ? "−" : "") + toAr(String(Math.abs(n)).replace(".", "٫"));
/* what a generator item is handed: integers, picks, Arabic numerals, and
   choices built from an answer and its likely wrong neighbours */
const LRNG = {
  int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  pick: a => a[Math.floor(Math.random() * a.length)],
  shuffle: a => shuffle(a),
  ar: arN,
  opts(ans, wrong, n) {
    const fmt = v => typeof v === "number" ? arN(v) : String(v);
    const out = [fmt(ans)];
    wrong.map(fmt).forEach(w => { if (out.indexOf(w) < 0 && out.length < (n || 3)) out.push(w); });
    return out;
  }
};
function learnGraded(it) { return it.t !== "see" && !it.free; }
function learnMake(src, tag) {
  const it = Object.assign({}, typeof src === "function" ? src(LRNG) : src);
  it.src = src; it.ui = {};
  if (tag) it.tag = tag;
  if (it.t === "bank") { const hit = questionById(it.id); it.q = hit ? shuffleChoices(hit.q) : null; }
  if (it.t === "pick") it._ch = it.keep ? it.ch.slice() : shuffle(it.ch);
  if (it.t === "fill") { it._tiles = shuffle(it.tiles.map((x, i) => i)); it.ui.slots = []; }
  if (it.t === "order") {
    let o = shuffle(it.tiles.map((x, i) => i));
    for (let n = 0; n < 6 && o.every((k, j) => it.tiles[k] === it.tiles[j]); n++) o = shuffle(o);
    it._tiles = o; it.ui.seq = [];
  }
  if (it.t === "pairs") {
    it._r = shuffle(it.p.map((x, i) => i)); it._l = shuffle(it.p.map((x, i) => i));
    it.ui.matched = []; it.ui.pick = null; it.ui.miss = 0;
  }
  if (it.t === "type") it.ui.val = "";
  return it;
}
/* a long line steps its type down instead of wrapping mid-expression */
function learnFs(s) { const n = String(s || "").replace(/\*/g, "").length; return n > 30 ? " fs-s" : n > 21 ? " fs-m" : ""; }
/* *x* marks the one number or word the eye should land on */
/* the rule card says its rule a word at a time, as فهيم's bubble does; then
   the things the rule is about (the *…* in learn.js: «العدد», «آخر عدد»,
   «الزيادة الأكبر») light up blue one after another, each on a note a step
   higher, and the card settles with a chime: the student reads the rule at the
   pace it is written, then sees what it is made of. ↻ in its corner says it
   again. The signs (= × ÷ + − ←) land a size up so the formula's shape shows. */
const RULE_OP = /^[=×÷+−←]$/, RULE_STEP = 110, RULE_LIT = 240;
const RULE_AGAIN_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/></svg>`;
/* The rule is one row of tokens on one line (the user, 2026-10-26: «it must
   be one line not 2 line»): a marked term is one chip however many words it
   has, every other word, sign and bracket its own token, so the brackets face
   the right way. An aside in brackets with no term in it — «(بالترتيب من
   اليمين)» — leaves the line for a small note under it (ruleSplit). ruleFit
   shrinks the row to the card; only a rule too long to read on one line wraps. */
function ruleSplit(text) {
  const notes = [];
  const main = String(text).replace(/\s*\(([^()*٠-٩]+)\)/g, (m, a) => { notes.push(a.trim()); return ""; }).replace(/\s+/g, " ").trim();
  return { main, note: notes.join(" — ") };
}
function ruleWords(text) {
  let out = "", i = 0, t = 0;
  String(text).split("*").forEach((p, k) => {
    if (k % 2) { if (p) out += `<span class="rw rk" style="--i:${i++};--t:${t++}" aria-hidden="true">${esc(p)}</span>`; return; }
    rfTokens(p).forEach(w => {
      out += `<span class="rw${RULE_OP.test(w) ? " op" : /^[()]$/.test(w) ? " par" : ""}" style="--i:${i++}" aria-hidden="true">${esc(w)}</span>`;
    });
  });
  return out;
}
let ruleT = [];
function rulePlay(again) {
  ruleT.forEach(clearTimeout); ruleT = [];
  const card = document.getElementById("lnRule");
  if (!card || fxReduced()) { if (card) card.classList.add("said"); return; }
  const ws = card.querySelectorAll(".rw"), n = ws.length;
  const terms = card.querySelectorAll(".rk").length;
  if (again) {
    card.style.setProperty("--d", "-.45s");
    card.classList.remove("said");
    const moving = card.querySelectorAll(".rw, .ln-rule-ic, .ln-rule-ic path");
    moving.forEach(x => { x.style.animation = "none"; });
    void card.offsetWidth;
    moving.forEach(x => { x.style.animation = ""; });
    card.animate([{ transform: "scale(1)" }, { transform: "scale(.97)", offset: .4 }, { transform: "scale(1)" }], { duration: 300, easing: "ease-out" });
  }
  const d = parseFloat(card.style.getPropertyValue("--d")) * 1000 || 0;
  const said = d + 450 + n * RULE_STEP + 150;
  ruleT.push(setTimeout(() => card.classList.add("said"), said));
  for (let k = 0; k < terms; k++) ruleT.push(setTimeout(() => { snd("rule-terms-light", () => beep([[587 * Math.pow(2, Math.min(k, 7) * 2 / 12), .06]])); buzz(5); }, said + k * RULE_LIT + 60));
  ruleT.push(setTimeout(() => {
    card.animate([{ transform: "scale(1)" }, { transform: "scale(1.035,.965)", offset: .35 }, { transform: "scale(.99,1.01)", offset: .7 }, { transform: "scale(1)" }],
      { duration: 360, easing: "ease-out" });
    snd("rule-said", () => beep([[784, .07], [1175, .16]]));
    buzz(10);
  }, said + terms * RULE_LIT + 200));
}
A.ruleAgain = function () { buzz(6); rulePlay(true); };
function learnFmt(s) {
  return fracs(esc(s == null ? "" : s).replace(/\*([^*]+)\*/g, '<b class="ln-hl">$1</b>')
    .replace(/[٠-٩]+(?:[.,٫/][٠-٩]+)?(?: ?[+\-−×÷=] ?[٠-٩]+(?:[.,٫/][٠-٩]+)?){1,3}/g, m => `<span class="nw">${m}</span>`));   // a short sum keeps its line (the audit, 2026-10-28), a fraction in it too
}

/* After every rule, two screens (2026-10-26, the user: «لازم بعد كل قانون تجي
   شاشه فيه القانون بس انا اعبيه القانون نفسه عشان تساعد بالحفظ وشاشه بعدها
   فيها مثال حرفي واعبي القانون بس هالمره ارقام»): the rule itself with its
   words taken out, filled back in from tiles, then a worked example where the
   same rule is filled in with numbers, each number captioned with the word of
   the rule it stands for. In a short lesson the words are the rule's *terms*
   and the numbers its `num` (learn.js); on a teaching card both are cut from
   the card's own `plain` and `example`. */
const RF_STOP = new Set(["من", "إلى", "في", "على", "عن", "مع", "ثم", "أو", "و", "إذا", "لو", "هو", "هي", "كل", "بين", "بعد", "قبل", "اللي", "التي", "الذي", "أي", "لا", "ما", "عند", "حتى", "فقط"]);
const RF_SWAP = { "أكبر": "أصغر", "أصغر": "أكبر", "الأكبر": "الأصغر", "الأصغر": "الأكبر", "الكبير": "الصغير", "الصغير": "الكبير",
  "نصف": "ضعف", "ضعف": "نصف", "زوجي": "فردي", "فردي": "زوجي", "الزوجية": "الفردية", "الفردية": "الزوجية", "الأول": "الأخير", "الأخير": "الأول",
  "المسافة": "الزمن", "الزمن": "المسافة", "السرعة": "المسافة", "الطول": "العرض", "العرض": "الطول", "البسط": "المقام", "المقام": "البسط",
  "الربح": "الخسارة", "الخسارة": "الربح", "المحيط": "المساحة", "المساحة": "المحيط", "الضرب": "الجمع", "الجمع": "الضرب" };
const RF_NUM = /[−-]?[٠-٩]+(?:[٫/،][٠-٩]+)*[٪°]?/g;
const rfDigits = s => /[٠-٩]/.test(s);
function rfTerms(rule) { return String(rule).split("*").filter((p, i) => i % 2 && p); }
/* wrong numbers that look right: a step off, double, half, ten more */
function rfNear(ans, n) {
  const out = [], have = new Set(ans);
  const add = x => { if (!have.has(x) && out.indexOf(x) < 0) out.push(x); };
  ans.forEach(a => {
    const f = /^([٠-٩]+)\/([٠-٩]+)$/.exec(a);
    if (f) { add(f[2] + "/" + f[1]); add(arN(arabicToNum(f[1]) + 1) + "/" + f[2]); return; }
    const m = /^([−-]?)([٠-٩]+(?:٫[٠-٩]+)?)(.*)$/.exec(a);
    if (!m) return;
    const v = arabicToNum(m[2]) * (m[1] ? -1 : 1), sfx = m[3], big = Math.abs(v) >= 20 && Number.isInteger(v);
    (big ? [v + 10, v - 10, v * 2, v / 2] : [v + 1, v - 1, v * 2, v + 2]).forEach(w => {
      if (w === v || (w < 0 && v >= 0) || !Number.isFinite(w) || (big && !Number.isInteger(w))) return;
      add(arN(Math.round(w * 1000) / 1000) + sfx);
    });
  });
  return shuffle(out).slice(0, n);
}
function arabicToNum(s) { return +String(s).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace("٫", "."); }
/* The rule screens run in node 1's first seven short lessons while the user
   judges them (2026-10-26: «lets say just the first 7 lesson only then i will
   decide»); the teaching cards keep their old flow until then. A wrong answer
   is tried again on the spot until it is right, with more help each time and
   never the answer itself (rfHelp). */
const RF_LESSONS = { "skills.bigsum": 7 }, RF_TEACH = false;
/* a cloze: eq with _ for each blank, the answers in order, the tiles shuffled */
function rfCloze(o) {
  const tiles = o.a.concat(o.more || []);
  return Object.assign({ tiles, lab: null }, o);
}
/* the wrong tiles: other rules' short terms, about as long as the shortest
   right one, so no long phrase makes the line small for everyone (rfFit sizes
   it for the widest tiles that could go in its blanks), shortest first when
   there are not enough */
/* a wrong tile must not be a right answer said another way: in a run of odd
   numbers «آخر عدد» is «آخر فردي», and «رقم» is what most people call a
   number (the audit, 2026-10-28: «آخر عدد» was offered, and marked wrong, on
   «عددها = (آخر فردي + ١) ÷ ٢»). A term lists the tiles never offered with it. */
const RF_NOT = { "آخر فردي": ["آخر عدد", "آخر رقم"], "آخر عدد": ["آخر رقم"], "عدد مرات تكراره": ["عددها"] };
function rfDecoys(pool, terms, n) {
  pool = pool.filter(t => !terms.some(u => (RF_NOT[u] || []).indexOf(t) >= 0));
  const max = Math.min(...terms.map(t => t.length)) + 3;
  const fit = shuffle(pool.filter(t => t.length <= max)), rest = pool.filter(t => t.length > max).sort((x, y) => x.length - y.length);
  return fit.concat(rest).slice(0, n);
}
/* the short lesson's two screens, built from a `see` item that has a rule */
function learnRuleWords(see, node) {
  const terms = rfTerms(see.rule);
  if (!terms.length) return null;
  const pool = [];
  node.lessons.forEach(L => L.items.forEach(x => { if (x && x.t === "see" && x.rule && x !== see) rfTerms(x.rule).forEach(t => { if (terms.indexOf(t) < 0 && pool.indexOf(t) < 0) pool.push(t); }); }));
  /* the trick the card just showed, for the help after a miss */
  const trick = (see.rows || []).map(r => String(r).replace(/^[~·!]\s*/, "")).filter(Boolean);
  return rfCloze({ t: "fill", rf: "words", q: "عبّ القاعدة بكلماتها:", rule: see.rule, trick,
    eq: String(see.rule).split("*").map((p, i) => i % 2 ? (p ? "_" : "") : p).join("").replace(/\s*\([^)_]*\)/g, "").replace(/\s+/g, " ").trim(),
    a: terms, more: rfDecoys(pool, terms, terms.length > 2 ? 2 : 3 - terms.length + 1),
    why: "القاعدة كاملة: " + see.rule.replace(/\*/g, ""), ok: "حفظتها بكلماتها" });
}
function learnRuleNums(see) {
  const n = see.num;
  if (!n) return null;
  const a = [];
  const eq = String(n.eq).replace(/\{([^}]+)\}/g, (m, v) => { a.push(v); return "_"; });
  const terms = rfTerms(see.rule);
  const lab = n.lab === false ? null : n.lab || (terms.length >= a.length ? terms.slice(0, a.length) : null);
  return rfCloze({ t: "fill", rf: "nums", q: n.q, rule: see.rule, eq, a, lab, anyOrder: n.any || 0,
    more: n.more || rfNear(a, 2), why: "القاعدة بالأرقام: " + n.eq.replace(/[{}]/g, "").replace(/\n/g, " ، "), ok: "طبّقت القاعدة بالأرقام" });
}
/* the teaching card's two screens, cut from its `plain` and `example` */
function rfPhrases(plain) {
  const parts = String(plain).split(/(\s*[=×÷+−←،()]\s*)/);
  const cand = parts.map((p, i) => ({ p: p.trim(), i })).filter(x => x.p && /[ء-ي]/.test(x.p) && !rfDigits(x.p) && !RF_STOP.has(x.p) && x.p.split(/\s+/).length <= 4);
  return { parts, cand };
}
function teachRuleWords(step, lesson) {
  const plain = step.plain || "";
  if (!plain) return null;
  let { parts, cand } = rfPhrases(plain);
  let eq, a;
  if (/=/.test(plain) && cand.length) {
    cand = cand.slice(0, 4);
    const at = new Set(cand.map(x => x.i));
    a = cand.map(x => x.p);
    eq = parts.map((p, i) => at.has(i) ? p.replace(p.trim(), "_") : p).join("");
  } else {
    /* a rule in a sentence: its two weightiest words go */
    const ws = plain.split(/(\s+)/);
    const pick = ws.map((w, i) => ({ w, i })).filter(x => /^[ء-ي]{4,}$/.test(x.w) && !RF_STOP.has(x.w))
      .sort((x, y) => y.w.length - x.w.length || x.i - y.i).slice(0, 2).sort((x, y) => x.i - y.i);
    if (!pick.length) return null;
    const at = new Set(pick.map(x => x.i));
    a = pick.map(x => x.w);
    eq = ws.map((w, i) => at.has(i) ? "_" : w).join("");
  }
  const pool = [];
  /* the same phrase with one word turned round (أكبر ↔ أصغر) is the likeliest slip */
  a.forEach(w => { const ws = w.split(" "); ws.forEach((x, i) => { if (RF_SWAP[x]) { const s = ws.map((y, j) => j === i ? RF_SWAP[x] : y).join(" "); if (a.indexOf(s) < 0 && pool.indexOf(s) < 0) pool.push(s); } }); });
  (lesson.steps || []).forEach(s => { if (s !== step && s.type === "rule") rfPhrases(s.plain || "").cand.forEach(x => { if (a.indexOf(x.p) < 0 && pool.indexOf(x.p) < 0) pool.push(x.p); }); });
  return rfCloze({ type: "rfill", of: step, q: "عبّ القاعدة بكلماتها:", eq, a, more: pool.slice(0, 2), why: plain });
}
function teachRuleNums(step) {
  const ex = String(step.example || ""), plain = String(step.plain || "");
  const segs = ex.split(/\s*(?:←|:)\s*/);
  const nums = s => s.match(RF_NUM) || [];
  let k = -1;
  for (let i = segs.length - 1; i >= 0; i--) if (/=/.test(segs[i]) && nums(segs[i]).length >= 2) { k = i; break; }
  if (k < 0) for (let i = segs.length - 1; i >= 0; i--) if (nums(segs[i]).length) { k = i; break; }
  if (k < 0) return null;
  /* the comma that closes a sentence stays out of the line */
  const parts = segs[k].split(/\s+،\s+/);
  let seg = parts.filter(x => /=/.test(x) && nums(x).length >= 2).pop() || parts.filter(x => nums(x).length).pop() || segs[k];
  const consts = new Set(nums(plain));
  const all = [];
  seg.replace(RF_NUM, (m, off) => { all.push({ m, off }); return m; });
  let blanks = all.filter(x => !consts.has(x.m));
  if (!blanks.length) blanks = all.slice(-1);
  blanks = blanks.slice(-4);
  const at = new Set(blanks.map(x => x.off));
  let eq = "", last = 0;
  all.forEach(x => { eq += seg.slice(last, x.off) + (at.has(x.off) ? "_" : x.m); last = x.off + x.m.length; });
  eq += seg.slice(last);
  const a = blanks.map(x => x.m);
  /* «الناتج = أ × ب» against «٣ × ٤ = ١٢»: the same signs in the same order
     caption each number with its word */
  let lab = null;
  const ops = s => (s.match(/[×÷+−]/g) || []).join("");
  const pe = plain.split("="), se = seg.split("=");
  if (pe.length === 2 && se.length === 2 && ops(pe[1]) === ops(se[0])) {
    const words = rfPhrases(pe[1]).cand.map(x => x.p), lhs = (se[0].match(RF_NUM) || []);
    if (words.length === lhs.length && blanks.length === lhs.length + 1 && blanks[blanks.length - 1].off >= seg.indexOf("=")) lab = words.concat(pe[0].trim());
  }
  const before = ex.slice(0, ex.indexOf(segs[k])).replace(/[\s←:،]+$/, "");
  const rest = ex.replace(seg, "…").trim();
  return rfCloze({ type: "rnum", of: step, q: before.length > 2 ? before : rest.length > 2 ? rest : "", eq, a, lab, more: rfNear(a, 2), why: seg });
}
/* a chunk's steps with the two screens after each rule, built once */
function teachSteps(chunk) {
  if (!RF_TEACH) return chunk.steps;
  if (chunk._rf) return chunk._rf;
  return chunk._rf = chunk.steps.reduce((out, s) => {
    out.push(s);
    if (s.type === "rule") [teachRuleWords(s, chunk), teachRuleNums(s)].forEach(x => { if (x) out.push(x); });
    return out;
  }, []);
}

let LAST_LEARN = null;
A.startLearn = function (domKey, lesKey, li, boost) {
  sayStop(); sfxHush();
  sndWarm();   // every Brilliant sound as the lesson opens: a «وصّل» before the first answer played the old beeps (the user, 2026-10-28: «it's the old sound»)
  const key = domKey + "." + lesKey, L = learnSet(key);
  if (!L) { A.startLesson(domKey, lesKey, boost); return; }
  if (li === undefined || li === null || li < 0 || li >= L.lessons.length) li = Math.max(0, learnAt(key));
  const les = L.lessons[li];
  const queue = [];
  les.items.forEach(src => {
    queue.push(learnMake(src));
    if (src && src.t === "see" && src.rule && li < (RF_LESSONS[key] || 0)) [learnRuleWords(src, L), learnRuleNums(src)].forEach(x => { if (x) queue.push(learnMake(x)); });
  });
  /* One item from the lesson before opens this one: recalling it a day — or
     ten minutes — later is what makes it stay, and it is a free first win. */
  const prev = li > 0 ? L.lessons[li - 1] : null;
  if (prev) {
    const pool = prev.items.map(src => learnMake(src, "تذكّر من الدرس السابق"))
      .filter(it => learnGraded(it) && it.t !== "bank" && it.t !== "pairs");
    const rc = pool.filter(it => it.recall);
    const pickOne = (rc.length ? rc : pool)[Math.floor(Math.random() * (rc.length || pool.length))];
    if (pickOne) queue.unshift(pickOne);
  }
  queue.forEach((it, i) => { it.uid = "i" + i; });
  let xpBoost = false;
  if (boost && S.xp >= BOOST_COST) { S.xp -= BOOST_COST; xpBoost = true; save(); }
  /* nothing is lost until the first node is finished: a new student meets the
     stakes once they have won something, not in their first fifteen minutes */
  const safe = !Object.values(S.lessons).some(p => p.stars > 0);
  SES = { mode: "learn", domKey, lesKey, key, li, lid: les.id, title: les.title, method: "",
    queue, total: queue.filter(learnGraded).length, idx: 0, done: 0, firstTry: {}, retried: {},
    sel: null, locked: false, xp: 0, gems: 0, replay: learnRec(key).done.indexOf(les.id) >= 0,
    xpBoost, safe, notime: true, hearts: LEVEL_HEARTS, left: Q_SECS, timer: null, tSpent: 0, tAnswered: 0, run: 0,
    base: queue.length, got: 0 };
  renderSession();
};

function learnReady(it) {
  if (it.t === "fill") return it.ui.slots.length === it.a.length && it.ui.slots.every(k => k !== undefined);
  if (it.t === "order") return it.ui.seq.length === it.tiles.length;
  if (it.t === "type") return it.ui.val.length > 0;
  if (it.t === "pick" || it.t === "tf" || it.t === "bank") return SES.sel !== null;
  return false;
}
function learnTag(it) {
  const tag = it.again ? "خطأ سابق — جرّبه مرة ثانية" : it.tag
    || (it.t === "bank" ? "سؤال قدرات" : it.free ? "خمّن بسرعة" : "");
  if (!tag) return "";
  const cls = it.again ? " again" : it.t === "bank" ? " exam" : it.tag ? " recall" : "";
  return `<div class="ln-tag${cls}">${it.t === "bank" ? ico("star", 14) : ""}${esc(tag)}</div>`;
}
function learnChoices(items, cls) {
  return `<div class="choices ln-choices${cls}" role="radiogroup" aria-label="اختر الإجابة">` + items.map((c, i) =>
    `<div class="slot"><span class="base" aria-hidden="true"></span>
     <button class="choice" data-ci="${i}" role="radio" aria-checked="false" tabindex="${i ? -1 : 0}"
       style="--d:${0.05 + i * 0.07}s" onclick="A.pick(${i})">
       <span class="ch-shine" aria-hidden="true"></span>
       <i class="ch-spk k1" aria-hidden="true"></i><i class="ch-spk k2" aria-hidden="true"></i><i class="ch-spk k3" aria-hidden="true"></i>
       ${c}</button></div>`).join("") + `</div>`;
}
/* A chain of steps (a = b = c, or a ← b ← c) wraps mid-step on a phone and the
   right-to-left run scrambles it, so a long chain stacks one step a line, the
   way a worked solution is written. Blanks are numbered across the lines. */
function learnSteps(src) {
  const parts = String(src).split(/ (?=[=←] )/);
  return parts.length > 1 && String(src).replace(/\*/g, "").length > 22 ? parts : [src];
}
/* What each blank should hold. A fill with anyOrder: k takes its first k
   answers in any order (٦ × ٥ × ٤ is ٤ × ٥ × ٦), so those blanks are matched
   against what the student placed before the leftovers are handed out. */
function learnFillWant(it) {
  const k = it.anyOrder || 0, want = it.a.slice();
  const free = (s, e) => {
    const pool = want.slice(s, e + 1), got = [];
    for (let j = s; j <= e; j++) {
      const v = it.tiles[it.ui.slots[j]], at = pool.indexOf(v);
      if (at >= 0) { got[j] = v; pool.splice(at, 1); }
    }
    for (let j = s; j <= e; j++) want[j] = got[j] !== undefined ? got[j] : pool.shift();
  };
  if (k) free(0, k - 1);
  if (it.rf || it.type === "rfill" || it.type === "rnum") rfSwapRuns(it.eq).forEach(([s, e]) => free(s, e));
  return want;
}
/* On a rule screen the sides of a «×» or a «+» may go in either order (the
   user, 2026-10-27, after writing «المجموع = عدد مرات تكراره × العدد» and
   being marked wrong: «I replaced the left with the right, but that's okay
   because that's multiply»). A run is blanks that stand alone as the factors
   of one product or the terms of one sum — "_ × _", "_ + _ + _" — and is
   left out wherever the swap would change the value: a «÷» before a product,
   a «−», «×» or «÷» before a sum or a «×» or «÷» after it, or anything glued
   to a blank (a power, «٪»). Returns [first, last] blank numbers per run. */
function rfSwapRuns(eq) {
  const parts = String(eq || "").split("_"), runs = [], n = parts.length - 1;
  const last = s => s.trim().split(/\s+/).pop() || "", first = s => s.trim().split(/\s+/)[0] || "";
  const link = s => /^ +[×+] +$/.test(s);
  for (let j = 0; j + 1 < n; ) {
    if (!link(parts[j + 1])) { j++; continue; }
    const op = parts[j + 1].trim();
    let e = j + 1;
    while (e + 1 < n && link(parts[e + 1]) && parts[e + 1].trim() === op) e++;
    const pre = parts[j], post = parts[e + 1], b = last(pre), a = first(post);
    const edge = (pre === "" || /[\s(]$/.test(pre)) && (post === "" || /^[\s)]/.test(post));
    const safe = op === "×" ? b !== "÷" && b !== "/" : !/^[−\-×÷/]$/.test(b) && !/^[×÷/]/.test(a);
    if (edge && safe) runs.push([j, e]);
    j = e + 1;
  }
  return runs;
}
/* A rule screen's line is a row of tokens — words, numbers, signs and each
   bracket on its own, so Arabic brackets face the right way — that never
   wraps (the user: «it must be one line not 2 line»): rfFit shrinks the whole
   line, blanks and captions with it, until it fits the card. */
function rfTokens(s) { return String(s).replace(/([()])/g, " $1 ").split(/\s+/).filter(Boolean); }
/* On the numbers screen a chain of two or more «=» steps is written the way
   a worked solution is, one step under the other, each new line opening on
   its «=» (the user, 2026-10-27: «don't make it right to left … make it up and
   down like this, just for this type of questions»); a line with one «=», or
   one that names its steps in words, stays a line */
function rfRows(eq, words) {
  return String(eq).split("\n").flatMap(line => {
    if (words || (line.match(/ = /g) || []).length < 2 || /[ء-ي]/.test(line)) return [line];
    return line.split(/ (?== )/).map(x => x.trim()).filter(Boolean);
  });
}
function rfEqHtml(it, verdict, unfill) {
  let k = 0;
  const want = verdict ? learnFillWant(it) : null;
  const blank = () => {
    const j = k++, tile = it.ui.slots[j], lab = it.lab && it.lab[j];
    const st = verdict ? (it.tiles[tile] === want[j] ? " right" : " wrong") : "";
    const b = tile === undefined
      ? `<button class="ln-blank" aria-label="فراغ${lab ? ": " + esc(lab) : ""}"></button>`
      : `<button class="ln-blank filled${st}" onclick="${unfill || "A.lUnfill"}(${j})">${esc(it.tiles[tile])}</button>`;
    return b;
  };
  const tok = s => rfTokens(s).map(t => `<span class="rf-t${RULE_OP.test(t) ? " op" : /^[()]$/.test(t) ? " par" : ""}">${esc(t)}</span>`).join("");
  const words = (it.rf || (it.type === "rfill" ? "words" : "nums")) === "words";
  return rfRows(it.eq, words).map(line =>
    `<div class="rf-line">${line.split("_").map((part, i, all) => tok(part) + (i < all.length - 1 ? blank() : "")).join("")}</div>`).join("");
}
/* a row's natural width from its tokens' layout widths: a token still
   scaled down by its entrance animation must not read as narrow */
function rowOver(row) {
  const kids = Array.from(row.children);
  if (!kids.length) return false;
  const cs = getComputedStyle(row), gap = parseFloat(cs.columnGap) || 0;
  const need = kids.reduce((s, k) => s + k.offsetWidth, 0) + gap * (kids.length - 1);
  return need > row.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0) + 1;
}
/* The row's size never depends on what is in its blanks (the user,
   2026-10-27: «why when I put it it shrink», then «fix this problem for
   good»): it is measured with the widest tiles on offer in every blank —
   the most any choice of tiles can take — so the size it gets on arrival
   holds whatever the student places, right or wrong, and every repaint
   measures the same thing and lands on the same size. */
function rfFit(root, it) {
  if (!root) return;
  const lines = Array.from(root.querySelectorAll(".rf-line"));
  if (!lines.length) return;
  lines.forEach(l => { l.style.fontSize = ""; });
  const blanks = Array.from(root.querySelectorAll(".ln-blank")), kept = blanks.map(b => [b.textContent, b.className]);
  const texts = Array.from(new Set(((it && it.tiles) || []).concat((it && it.a) || []).map(String)));
  if (blanks.length && texts.length) {
    const g = blanks[0];
    g.className = "ln-blank filled";
    const wide = texts.map(t => { g.textContent = t; return [t, g.offsetWidth]; }).sort((x, y) => y[1] - x[1]).map(x => x[0]);
    lines.forEach(l => Array.from(l.querySelectorAll(".ln-blank")).forEach((b, i) => { b.className = "ln-blank filled"; b.textContent = wide[Math.min(i, wide.length - 1)]; }));
  }
  let fs = parseFloat(getComputedStyle(lines[0]).fontSize);
  const over = () => lines.some(rowOver);
  for (let n = 0; n < 30 && fs > 12 && over(); n++) { fs -= 1; lines.forEach(l => { l.style.fontSize = fs + "px"; }); }
  blanks.forEach((b, i) => { b.textContent = kept[i][0]; b.className = kept[i][1]; });
}
/* the see card's rule on one line when it fits at two thirds of its size or more, else balanced lines */
function ruleFit(el) {
  if (!el) return;
  el.classList.remove("two"); el.style.fontSize = "";
  el.querySelectorAll(".rw-br").forEach(x => x.remove());
  let fs = parseFloat(getComputedStyle(el).fontSize);
  const over = () => rowOver(el);
  for (let n = 0; n < 30 && fs > 14 && over(); n++) { fs -= 1; el.style.fontSize = fs + "px"; }
  if (!over()) return;
  /* too long for one line: two lines, broken after the «=», «:», «،» or «←»
     nearest the middle, so a bracket or a term is never cut in two */
  el.style.fontSize = "";
  const kids = Array.from(el.children), w = kids.map(k => k.offsetWidth), half = w.reduce((a, b) => a + b, 0) / 2;
  let at = -1, best = Infinity, run = 0;
  kids.forEach((k, i) => {
    run += w[i];
    const t = k.textContent.trim();
    if (i < kids.length - 1 && !k.classList.contains("rk") && (/^[=←]$/.test(t) || /[:،]$/.test(t)) && Math.abs(run - half) < best) { best = Math.abs(run - half); at = i; }
  });
  el.classList.add("two");
  if (at >= 0) kids[at].insertAdjacentHTML("afterend", '<i class="rw-br" aria-hidden="true"></i>');
  fs = parseFloat(getComputedStyle(el).fontSize);
  const lineOver = () => kids.some(k => k.offsetTop !== kids[0].offsetTop) && el.scrollWidth > el.clientWidth + 1;
  for (let n = 0; n < 12 && fs > 14 && lineOver(); n++) { fs -= 1; el.style.fontSize = fs + "px"; }
}
function learnFillEq(it, verdict, unfill) {
  if (it.rf || it.type) return rfEqHtml(it, verdict, unfill);
  let k = 0;
  const want = verdict ? learnFillWant(it) : null;
  const blank = () => {
    const j = k++, tile = it.ui.slots[j];
    const st = verdict ? (it.tiles[tile] === want[j] ? " right" : " wrong") : "";
    const b = tile === undefined
      ? `<button class="ln-blank" aria-label="فراغ${it.lab && it.lab[j] ? ": " + esc(it.lab[j]) : ""}"></button>`
      : `<button class="ln-blank filled${st}" onclick="${unfill || "A.lUnfill"}(${j})">${esc(it.tiles[tile])}</button>`;
    /* a number in the rule-with-numbers screen wears the word it stands for */
    return it.lab && it.lab[j] ? `<span class="ln-bw">${b}<small>${esc(it.lab[j])}</small></span>` : b;
  };
  const rows = it.rf || it.type ? String(it.eq).split("\n") : learnSteps(it.eq);
  const lines = rows.map(line => learnFmt(line).split("_").map((part, i, all) => i === all.length - 1 ? part : part + blank()).join(""));
  return lines.length > 1 ? lines.map(l => `<div class="ln-step">${l}</div>`).join("") : lines[0];
}
/* the two screens after a rule, drawn the way a fill is (the user,
   2026-10-26, pointing at «كمّل الخطوة:»: «what i meant … is something like
   this exactly»): the ask, the line in a white box with grey blanks that turn
   blue, white tiles under it — the rule with its words taken out on the first,
   the same rule worked on the example's numbers on the second */
function rfBody(c, verdict, unfill, tile) {
  const words = (c.rf || (c.type === "rfill" ? "words" : "nums")) === "words";
  const tiles = `<div class="ln-tiles rf-tiles" id="lnTiles">${c._tiles.map(k =>
    `<button class="ln-tile${c.ui.slots.indexOf(k) >= 0 ? " used" : ""}${c._out && c._out.indexOf(k) >= 0 ? " out" : ""}" data-k="${k}" onclick="${tile}(${k})"${verdict || (c._out && c._out.indexOf(k) >= 0) ? " disabled" : ""}>${esc(c.tiles[k])}</button>`).join("")}</div>`;
  const hint = c._hint ? `<div class="rf-hint help" id="rfHint">${c._hint}</div>` : `<div class="rf-hint" id="rfHint"></div>`;
  const ex = !words && c.q ? `<div class="ln-step rf-ex">${learnFmt(c.q)}</div>` : "";
  return `<div class="ln-q rf-q">${words ? "كمّل القاعدة:" : "كمّل الخطوة:"}</div>
    <div class="ln-eq rf-box${words ? " rf-words" : " rf-num"}">${ex}<div class="rf-lines" id="lnEq">${learnFillEq(c, verdict, unfill)}</div></div>
    ${hint}${tiles}`;
}
function learnBody(it) {
  const q = it.q && it.t !== "bank" ? `<div class="ln-q">${learnFmt(it.q)}</div>` : "";
  const big = it.cmp ? `<div class="cmp-wrap">
      <div class="cmp-box"><div class="cmp-t">القيمة الأولى</div><div class="cmp-v">${learnFmt(it.cmp[0])}</div></div>
      <div class="cmp-box"><div class="cmp-t">القيمة الثانية</div><div class="cmp-v">${learnFmt(it.cmp[1])}</div></div></div>`
    : it.big ? `<div class="ln-big${learnFs(it.big)}">${learnFmt(it.big)}</div>` : "";
  /* "@skills.keylaws:9" borrows a card figure from teach-figures.js */
  const svgFig = it.fig && it.fig[0] === "@" ? (window.QTEACH_FIG || {})[it.fig.slice(1)] : it.fig;
  const fig = svgFig ? `<div class="q-figure ln-fig">${svgFig}</div>` : "";
  switch (it.t) {
    case "see": {
      const rows = (it.rows || []).map((r, i) => {
        const m = /^([~!·])\s*/.exec(r), kind = m ? { "~": "slow", "!": "win", "·": "note" }[m[1]] : "";
        return `<div class="ln-row ${kind}${kind === "note" ? "" : learnFs(r)}" style="--d:${(0.2 + i * 0.5).toFixed(2)}s">${learnFmt(m ? r.slice(m[0].length) : r)}</div>`;
      }).join("");
      const n = (it.rows || []).length;
      return `<div class="ln-see">
        <div class="ln-kick">${esc(it.kick || "الفكرة")}</div>
        ${it.h ? `<h1 class="ln-h">${learnFmt(it.h)}</h1>` : ""}
        ${fig}<div class="ln-rows">${rows}</div>
        ${it.rule ? (() => { const rs = ruleSplit(it.rule); return `<div class="ln-rule ln-rule-see" id="lnRule" style="--d:${(0.3 + n * 0.5).toFixed(2)}s">
          <span class="rf-head"><span class="ln-rule-ic">${BULB_SVG}</span><span class="ln-rule-tag">القاعدة</span><button class="ln-rule-again" onclick="A.ruleAgain()" aria-label="أعد القاعدة">${RULE_AGAIN_SVG}</button></span>
          <span class="ln-rule-tx" aria-label="${esc(it.rule.replace(/\*/g, ""))}">${ruleWords(rs.main)}</span>${rs.note ? `<span class="ln-rule-note">${esc(rs.note)}</span>` : ""}</div>`; })() : ""}
      </div>`;
    }
    case "pick": {
      const short = it._ch.every(c => String(c).length <= 7);
      const cls = short ? ` ch-grid n${it._ch.length}` : "";
      return q + big + fig + learnChoices(it._ch.map(c => `<span class="ch-txt">${learnFmt(c)}</span>`), cls);
    }
    case "tf":
      return q.replace("ln-q", "ln-q ln-q-tf") + big + fig + learnChoices([
        `<span class="tf-ico ok">✓</span><span class="ch-txt">صح</span>`,
        `<span class="tf-ico no">✕</span><span class="ch-txt">خطأ</span>`], " ch-grid n2 ln-tf");
    case "fill":
      if (it.rf) return rfBody(it, false, "A.lUnfill", "A.lTile");
      return q + fig + `<div class="ln-eq${learnSteps(it.eq).length > 1 ? " stacked" : learnFs(it.eq) + (it.eq.split("_").length > 4 ? " tight" : "")}" id="lnEq">${learnFillEq(it)}</div>
        <div class="ln-tiles" id="lnTiles">${it._tiles.map(k =>
          `<button class="ln-tile" data-k="${k}" onclick="A.lTile(${k})">${esc(it.tiles[k])}</button>`).join("")}</div>`;
    case "order":
      return q + big + fig + `<div class="ln-line" id="lnLine"></div>
        <div class="ln-tiles" id="lnTiles">${it._tiles.map(k =>
          `<button class="ln-tile" data-k="${k}" onclick="A.lTile(${k})">${learnFmt(it.tiles[k])}</button>`).join("")}</div>`;
    case "type": {
      const keys = ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", (it.keys || [])[0] || "", "٠", "⌫"];
      return q + big + fig + `<div class="ln-input" id="lnIn" dir="ltr" aria-live="polite"><span class="ln-caret"></span></div>
        ${it.unit ? `<div class="ln-unit">${esc(it.unit)}</div>` : ""}
        <div class="ln-pad" dir="ltr">${keys.map(k => k
          ? `<button class="ln-key${k === "⌫" ? " del" : ""}" onclick="A.lKey('${k}')" aria-label="${k === "⌫" ? "امسح" : k}">${k}</button>`
          : `<span></span>`).join("")}</div>`;
    }
    case "pairs": {
      const col = (side, order) => order.map(k =>
        `<button class="ln-pr${learnFs(it.p[k][side === "a" ? 0 : 1]).replace("fs-m", "fs-s")}" data-side="${side}" data-k="${k}" onclick="A.lPair('${side}',${k})">${learnFmt(it.p[k][side === "a" ? 0 : 1])}</button>`).join("");
      return q + `<div class="ln-pairs"><div class="ln-col">${col("a", it._r)}</div><div class="ln-col">${col("b", it._l)}</div></div>`;
    }
    case "bank":
      return it.q ? questionBody(it.q, SES.sel, false, null, null) : `<div class="ln-q">هذا السؤال غير متاح.</div>`;
  }
  return "";
}
function renderLearn() {
  const it = SES.queue[SES.idx];
  const d = window.QBANK[SES.domKey], u = UNIT_COLORS[d.color] || UNIT_COLORS.purple;
  const pct = sesPct();
  const btn = it.t === "see"
    ? `<button class="btn" onclick="A.next()">${esc(it.go || "فهمت")}</button>`
    : `<button class="btn" id="checkBtn" onclick="A.check()" ${learnReady(it) ? "" : "disabled"}>تحقق</button>`;
  $app.innerHTML = `
    <div class="screen screen-full screen-session screen-learn" style="--li-c:${u.c};--li-s:${u.s};--li-h:${u.h}">
      <div class="session-top">
        <button class="x-btn" onclick="A.quitSession()" aria-label="إنهاء الدرس">${X_SVG}</button>
        <div class="prog-wrap">
          <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="تقدمك في الدرس"><i style="width:${pct}%"></i><i class="prog-cool" style="width:${pct}%"></i></div>
          <div class="fx-tag" id="fxTag" aria-hidden="true"></div>
        </div>
        ${SES.safe
          ? `<span class="sess-hearts sess-review" aria-label="بدون قلوب">${ico("heart", 22)} ∞</span>`
          : `<span class="sess-hearts" id="sesHearts" aria-label="القلوب المتبقية: ${toAr(SES.hearts)}">${ico("heart", 22)} ${toAr(SES.hearts)}</span>`}
      </div>
      <div class="q-area ln-area lt-${it.t}">${learnTag(it)}${learnBody(it)}</div>
      <div class="action-bar">${it.t === "pairs" ? `<button class="btn" disabled>وصّل الأزواج</button>` : btn}</div>
      <div class="feedback" id="fb" role="status" aria-live="assertive"></div>
      <div class="storm" id="storm" aria-hidden="true"></div>
    </div>`;
  fxBindPress();
  fxPaintBar(SES.run);
  if (it.t === "see" && it.rule) rulePlay(); else { ruleT.forEach(clearTimeout); ruleT = []; }
  const fit = () => {
    if (!SES || SES.queue[SES.idx] !== it) return;
    if (it.rf) rfFit(document.getElementById("lnEq"), it);
    if (it.t === "see" && it.rule) ruleFit(document.querySelector("#lnRule .ln-rule-tx"));
  };
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  SES.qStart = Date.now();
}
function learnPaint() {
  const it = SES.queue[SES.idx];
  if (it.t === "fill") {
    const eq = document.getElementById("lnEq"); if (eq) { eq.innerHTML = learnFillEq(it); if (it.rf) rfFit(eq, it); }
    document.querySelectorAll("#lnTiles .ln-tile").forEach(b => b.classList.toggle("used", it.ui.slots.indexOf(+b.dataset.k) >= 0));
  }
  if (it.t === "order") {
    const line = document.getElementById("lnLine");
    if (line) line.innerHTML = it.ui.seq.map((k, j) => `<button class="ln-tile in" onclick="A.lUnfill(${j})">${learnFmt(it.tiles[k])}</button>`).join("");
    document.querySelectorAll("#lnTiles .ln-tile").forEach(b => b.classList.toggle("used", it.ui.seq.indexOf(+b.dataset.k) >= 0));
  }
  if (it.t === "type") {
    const box = document.getElementById("lnIn");
    if (box) box.innerHTML = it.ui.val ? esc(it.ui.val) : `<span class="ln-caret"></span>`;
  }
  const cb = document.getElementById("checkBtn"); if (cb) cb.disabled = !learnReady(it);
}
A.lTile = function (k) {
  const it = SES && SES.queue[SES.idx]; if (!it || SES.locked) return;
  if (it.t === "fill") {
    if (it.ui.slots.indexOf(k) >= 0) return;
    let j = 0; while (it.ui.slots[j] !== undefined) j++;
    if (j >= it.a.length) return;
    it.ui.slots[j] = k; stampTile(it.ui, k);
  } else if (it.t === "order") {
    if (it.ui.seq.indexOf(k) >= 0) return;
    it.ui.seq.push(k);
  } else return;
  snd("tile-place", () => sndTap());
  learnPaint();
};
A.lUnfill = function (j) {
  const it = SES && SES.queue[SES.idx]; if (!it || SES.locked) return;
  if (it.t === "fill") it.ui.slots[j] = undefined;
  else if (it.t === "order") it.ui.seq.splice(j, 1);
  snd("tile-remove"); learnPaint();
};
A.lKey = function (k) {
  const it = SES && SES.queue[SES.idx]; if (!it || it.t !== "type" || SES.locked) return;
  if (k === "⌫") it.ui.val = it.ui.val.slice(0, -1);
  else if (it.ui.val.length < 9) it.ui.val += k;
  snd("keypad-key", () => sndTap());
  learnPaint();
};
/* Match pairs answers itself: a right pair locks green and goes quiet, a wrong
   one flashes red and lets go. The item is right first time only if nothing
   was mismatched — a mismatch costs no heart, it only costs the clean run.

   Both tiles of a right pair take the answer card's own jump (fxAddJump: the
   stretch, the hang, the squash, the back-out settle), land back on their base
   and grey out where they stand, the way Duolingo's board does. The LAST pair
   stays lit and the full win — strike, tag and all — plays on it. A wrong pair
   sinks into its base and shakes, the miss grammar of fxAddFail without its
   sheet. */
/* fxAddJump's beats at a third of its height: the answer card is the width of
   the column, a pair tile is half that and sits two pixels from its neighbour,
   and the full jump landed it on the tile above */
/* a wrong pair sinks and shakes */
function pairMiss(els) {
  if (!fxOn() || !window.gsap || fxReduced()) return;
  const tl = gsap.timeline();
  els.forEach(el => {
    tl.to(el, { keyframes: [
      { y: FXP(5), scaleX: FXA(1.02), scaleY: FXA(.95), duration: .07, ease: "power2.in" },
      { y: 0, scaleX: 1, scaleY: 1, duration: .10, ease: "power2.out" }] }, 0)
      .to(el, { keyframes: [{ x: -8, duration: .05 }, { x: 8, duration: .07 }, { x: -5, duration: .06 },
        { x: 3, duration: .06 }, { x: 0, duration: .06 }] }, .02);
  });
}
A.lPair = function (side, k) {
  const it = SES && SES.queue[SES.idx]; if (!it || it.t !== "pairs" || SES.locked) return;
  if (it.ui.matched.indexOf(k + side) >= 0) return;
  const el = s => document.querySelector(`.ln-pr[data-side="${s.side}"][data-k="${s.k}"]`);
  const p = it.ui.pick;
  if (!p || p.side === side) {
    if (p) el(p).classList.remove("sel");
    it.ui.pick = { side, k };
    el(it.ui.pick).classList.add("sel");
    snd("pair-pick", () => sndTap());
    return;
  }
  const a = side === "a" ? k : p.k, b = side === "b" ? k : p.k;
  const A1 = el({ side: "a", k: a }), B1 = el({ side: "b", k: b });
  it.ui.pick = null;
  [A1, B1].forEach(x => x.classList.remove("sel"));
  if (it.p[a][1] === it.p[b][1]) {
    it.ui.matched.push(a + "a", b + "b");
    [A1, B1].forEach(x => { x.classList.add("ok"); x.disabled = true; });
    /* a matched pair plays Duolingo's right-answer wave, as the fill's chips do
       (the user, 2026-10-27: «I don't see the animation … like law fill blank»):
       the tile picked first jumps first, both green with their band and
       sparkles, then they grey out */
    const pair = p.side === "a" ? [A1, B1] : [B1, A1];
    adWave(pair);
    /* every pair greys out after its wave, the last one too — left green it
       read as stuck (the user, 2026-10-27) */
    setTimeout(() => [A1, B1].forEach(x => { x.classList.remove("ad-ok"); x.classList.add("gone"); }), 900);
    snd("pair-match", () => sndGood(), "xp-tally-" + Math.min(it.ui.matched.length / 2, 5));   // each pair a tally higher, the last one too, then the correct sound (the user, 2026-10-28: «we want 4 voices and then» the correct one)
    if (it.ui.matched.length === it.p.length * 2) {
      SES.locked = true;
      /* the last pair's wave, then the whole board takes the win jump (and the strike rides on it) */
      setTimeout(() => learnResolve(it, it.ui.miss === 0, "", document.querySelector(".ln-pairs") || B1, true), 520);
    }
  } else {
    it.ui.miss++;
    snd("pair-miss", () => sndBad());
    [A1, B1].forEach(x => { x.classList.remove("bad"); void x.offsetWidth; x.classList.add("bad"); });
    pairMiss([A1, B1]);
    setTimeout(() => [A1, B1].forEach(x => x.classList.remove("bad")), 520);
  }
};
const sndTap = () => beep([[520, .04]]);

/* A rule screen is answered until it is right (the user, 2026-10-26: «if i'm
   wrong i want you to try help me but not giving me the answer»): a miss turns
   the wrong chips red and shakes them, then sends them back to the tiles with
   the right ones left in place, and the help under the rule grows with each
   miss — never the answer itself (rfHelp):
   1. the words screen brings back the trick the card just showed; the numbers
      screen points at the word under the first wrong blank, in the example
      and in the rule above it;
   2. the tiles that belong nowhere in the rule go (rfSpare), so what is left
      is all the rule's own;
   3. after that, how many are still out of place, to swap round.
   A right answer makes every chip in the rule jump in turn, as a right answer
   card does. A miss counts against the first try; it costs no heart. */
function rfShown(it) { return it.eq.split("_").map((part, j, all) => j === all.length - 1 ? part : part + it.a[j]).join("").replace(/\n/g, " ، "); }
/* Duolingo's right answer on a tap-the-words challenge, copied from its files
   (the user, 2026-10-26: «any question similar to this … the animation of
   Duolingo itself, they jump after each other … green»): Compose TapInput's
   AtomicDelightAnimation — r32 (jump, squash), s32 (the ground shadow), u32
   (colour), gs0 / ys20 (shine, sparkles), all in dp, taken here as px. Each
   chip starts 50ms after the one before it, in reading order:
   - it crouches 7.3, springs to 23.6 over its place, lands 4.4 past it and
     rebounds 7.3 before it settles (650ms), squashing and stretching on the
     same beats (550ms; width and height in dp per side, AD_SQ);
   - 100ms in it turns Duolingo's correct green at once (seaSponge face,
     turtle lip, treeFrog text — .ad-ok) and a grey slab (swan) shows under it
     where it stood, shrinking and spreading with its height (AD_SLAB, as
     insets: sides k, top l + m, bottom l − m);
   - at 105ms a pale band crosses its face, leaning back by half its height
     (350ms), and two four-point sparkles, 12 top-left and 8 bottom-right, grow
     to 1.15, turn 39° and go (400ms).
   Under reduced motion the chips only turn green. */
const AD_JUMP = [[0, 0, "cubic-bezier(.01,0,0,1)"], [.1277, 7.3, "linear"], [.1538, -12.7, "cubic-bezier(.1,.53,0,.92)"],
  [.3585, -23.6, "cubic-bezier(1,-.05,.95,.65)"], [.6923, 4.4, "cubic-bezier(.09,.75,.4,.95)"], [.8723, -7.3, "cubic-bezier(.89,-.08,.95,.79)"], [1, 0]];
const AD_SQ = [[0, 0, 0, "cubic-bezier(.01,0,0,1)"], [.1509, 2.9, -5.8, "linear"], [.1818, -5.7, 2.53, "cubic-bezier(.01,0,.15,1)"],
  [.4236, 0, 0, "cubic-bezier(.85,0,.94,.72)"], [.7873, 0, 2.53, "linear"], [.8182, 1.96, -2.9, "cubic-bezier(.1,.47,.01,1)"], [1, 0, 0]];
const AD_SLAB = { at: [0, .2418, .6364, .8491, 1], k: [5.9, 7.1, 1.27, 4.72, 3.64], l: [4.78, 6.36, 4.78, 5.45, 3.64], m: [4.5, 5, 4.3, 4.57, 3.64],
  ease: ["cubic-bezier(.1,.53,0,.92)", "cubic-bezier(1,-.03,.95,.65)", "cubic-bezier(.09,.75,.4,.95)", "cubic-bezier(.89,-.08,.95,.79)"] };
const AD_STAR = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C12.9 7.2 16.8 11.1 24 12 16.8 12.9 12.9 16.8 12 24 11.1 16.8 7.2 12.9 0 12 7.2 11.1 11.1 7.2 12 0Z"/></svg>`;
function adWave(chips) {
  chips = Array.from(chips || []).filter(Boolean);
  if (!chips.length) return;
  const still = !fxOn() || fxReduced() || !Element.prototype.animate;
  chips.forEach((c, i) => {
    c.classList.remove("right");
    if (still) { c.classList.add("ad-ok"); return; }
    const D = i * 50, W = c.offsetWidth || 1, H = c.offsetHeight || 1, par = c.parentElement;
    const ease = e => (e ? { easing: e } : {});
    if (getComputedStyle(par).position === "static") par.style.position = "relative";
    c.classList.add("ad-go");
    c.animate(AD_JUMP.map(([o, y, e]) => Object.assign({ offset: o, translate: `0 ${y}px` }, ease(e))), { duration: 650, delay: D });
    c.animate(AD_SQ.map(([o, w, h, e]) => Object.assign({ offset: o, scale: `${(1 + 2 * w / W).toFixed(4)} ${(1 + 2 * h / H).toFixed(4)}` }, ease(e))), { duration: 550, delay: D });
    const slab = document.createElement("i");
    slab.className = "ad-slab";
    Object.assign(slab.style, { left: c.offsetLeft + "px", top: c.offsetTop + "px", width: W + "px", height: H + "px", borderRadius: getComputedStyle(c).borderRadius });
    par.insertBefore(slab, c);
    slab.animate(AD_SLAB.at.map((o, j) => Object.assign({ offset: o, opacity: 1,
      clipPath: `inset(${(AD_SLAB.l[j] + AD_SLAB.m[j]).toFixed(2)}px ${AD_SLAB.k[j]}px ${(AD_SLAB.l[j] - AD_SLAB.m[j]).toFixed(2)}px ${AD_SLAB.k[j]}px round ${getComputedStyle(c).borderRadius})` }, ease(AD_SLAB.ease[j]))),
      { duration: 550, delay: D + 100 });
    const sh = document.createElement("i");
    sh.className = "ad-sh";
    sh.innerHTML = "<b></b>";
    c.appendChild(sh);
    const band = sh.firstChild, bw = 38;
    band.style.transform = `skewX(${(-Math.atan(.5) * 180 / Math.PI).toFixed(2)}deg)`;
    const x = p => `${(-bw + (W + bw + H / 2) * p).toFixed(1)}px 0`;
    band.animate([{ offset: 0, translate: x(0), easing: "linear" }, { offset: .0486, translate: x(.24), easing: "cubic-bezier(.17,.17,.32,.73)" },
      { offset: .4286, translate: x(.47), easing: "cubic-bezier(.63,.17,.83,.83)" }, { offset: 1, translate: x(1) }], { duration: 350, delay: D + 105, fill: "backwards" });
    [["ad-sp a", 12], ["ad-sp b", 8]].forEach(([cls, s]) => {
      const sp = document.createElement("i");
      sp.className = cls;
      sp.style.width = sp.style.height = s + "px";
      sp.innerHTML = AD_STAR;
      c.appendChild(sp);
      sp.animate([{ offset: 0, scale: 0, easing: "cubic-bezier(.17,.17,0,.89)" }, { offset: .5, scale: 1.1535, easing: "cubic-bezier(.8,-.09,.83,.83)" }, { offset: 1, scale: 0 }],
        { duration: 400, delay: D + 100, fill: "both" });
      sp.animate([{ rotate: "0deg" }, { rotate: "39.05deg" }], { duration: 400, delay: D + 100 });
    });
    setTimeout(() => c.classList.add("ad-ok"), D + 100);
    setTimeout(() => { slab.remove(); sh.remove(); c.querySelectorAll(".ad-sp").forEach(x => x.remove()); c.classList.remove("ad-go"); }, D + 700);
  });
}
/* a right rule screen: its chips play Duolingo's wave */
function rfHop(eq, it) {
  if (eq) adWave(byPlaced(it.ui, eq.querySelectorAll(".ln-blank")));
}
/* the wave runs in the order the chips were placed — the one picked first
   jumps first, wherever it sits (the user, 2026-10-26: «the thing he choose
   first if left then left if right then right»); a blank with no stamp keeps
   its place in the line */
function stampTile(ui, k) { ui.at = ui.at || {}; ui.at[k] = ui.n = (ui.n || 0) + 1; }
function byPlaced(ui, chips) {
  const at = (ui && ui.at) || {};
  return Array.from(chips || []).map((c, j) => [c, at[ui.slots[j]] != null ? at[ui.slots[j]] : 1e6 + j])
    .sort((a, b) => a[1] - b[1]).map(x => x[0]);
}
function rfSpare(it) {
  const need = {};
  learnFillWant(it).forEach(v => { need[v] = (need[v] || 0) + 1; });
  const keep = new Set(it.ui.slots.filter(k => k !== undefined));
  keep.forEach(k => { need[it.tiles[k]]--; });
  return it.tiles.map((t, k) => k).filter(k => {
    if (keep.has(k)) return false;
    if (need[it.tiles[k]] > 0) { need[it.tiles[k]]--; return false; }
    return true;
  });
}
function rfHelp(it, bad) {
  const ic = `<span class="rf-help-ic">${BULB_SVG}</span>`;
  if (it._tries === 1) {
    if (it.rf === "words" && it.trick && it.trick.length)
      return `${ic}<span class="rf-help-tx"><b>تذكّر الحيلة:</b>${it.trick.map(r => `<span class="rf-tr">${learnFmt(r)}</span>`).join("")}</span>`;
    const lab = it.lab && it.lab[bad[0]], rule = it.rule ? ruleSplit(it.rule).main : "";
    const said = rule ? `<b>تذكّر القاعدة:</b><span class="rf-tr">${String(rule).split("*").map((p, k) => k % 2 ? (p ? `<b class="ln-hl">${esc(p)}</b>` : "") : esc(p)).join("")}</span>` : "";
    if (lab) return `${ic}<span class="rf-help-tx">${said}<span>دوّر <b class="ln-hl">${esc(lab)}</b> في المثال — وحطّه مكانه</span></span>`;
    return `${ic}<span class="rf-help-tx">${said || `<span>وش يجي قبل «=» ووش يجي بعده؟</span>`}</span>`;
  }
  if (it._tries === 2) return `${ic}<span class="rf-help-tx"><span>شلت لك الخيارات الزايدة — كل اللي باقي من القاعدة، بس رتّبه</span></span>`;
  return `${ic}<span class="rf-help-tx"><span>${bad.length === 1 ? "باقي فراغ واحد — جرّب الخيار الثاني" : `باقي ${toAr(bad.length)} مو في مكانها — بدّلها بين بعض`}</span></span>`;
}
/* the pointer: on the first miss the first blank still to fill pulses */
function rfPoint(it, bad) {
  if (it._tries !== 1) return;
  const b = document.querySelectorAll("#lnEq .ln-blank")[bad[0]];
  if (b) b.classList.add("pt");
}
function rfCheck(it) {
  SES.locked = true;
  const want = learnFillWant(it), bad = [];
  it.ui.slots.forEach((k, j) => { if (it.tiles[k] !== want[j]) bad.push(j); });
  const eq = document.getElementById("lnEq"), hint = document.getElementById("rfHint");
  const lock = () => document.querySelectorAll(".ln-tile, .ln-blank").forEach(x => { x.disabled = true; });
  if (!bad.length) {
    eq.innerHTML = learnFillEq(it, true); rfFit(eq, it); lock();
    learnResolve(it, true, rfShown(it), null, false, it.why);
    rfHop(eq, it);
    return;
  }
  it._tries = (it._tries || 0) + 1;
  if (learnGraded(it) && !(it.uid in SES.firstTry)) SES.firstTry[it.uid] = false;
  SES.run = 0; fxPaintBar(0);
  eq.innerHTML = learnFillEq(it, true); rfFit(eq, it); lock();
  const chips = eq.querySelectorAll(".ln-blank"), wrong = bad.map(j => chips[j]).filter(Boolean);
  if (window.gsap && !fxReduced()) gsap.fromTo(wrong, { x: 0 }, { keyframes: [{ x: -8, duration: .06 }, { x: 7, duration: .07 }, { x: -5, duration: .07 }, { x: 3, duration: .06 }, { x: 0, duration: .06 }] });
  snd("rule-fill-miss", () => sndBad()); buzz([30, 40, 30]);
  it._hint = rfHelp(it, bad);
  if (hint) { hint.innerHTML = it._hint; hint.className = "rf-hint help"; void hint.offsetWidth; hint.classList.add("go"); }
  setTimeout(() => {
    if (!SES || SES.queue[SES.idx] !== it) return;
    bad.forEach(j => { it.ui.slots[j] = undefined; });
    if (it._tries >= 2) it._out = rfSpare(it);
    SES.locked = false;
    document.querySelectorAll("#lnTiles .ln-tile").forEach(x => {
      const out = !!it._out && it._out.indexOf(+x.dataset.k) >= 0;
      x.disabled = out; x.classList.toggle("out", out);
    });
    learnPaint();
    rfPoint(it, bad);
    const tl = document.getElementById("lnTiles");
    if (tl) tl.scrollIntoView({ block: "nearest", behavior: fxReduced() ? "auto" : "smooth" });
  }, 950);
}
function learnCheck() {
  const it = SES.queue[SES.idx];
  if (SES.locked || !learnReady(it)) return;
  if (it.rf) { rfCheck(it); return; }
  SES.locked = true;
  const choices = Array.from(document.querySelectorAll(".ln-area .choice"));
  let ok = false, shown = "", card = null, why = it.why, wave = null;
  if (it.t === "pick" || it.t === "tf" || it.t === "bank") {
    const right = it.t === "pick" ? it._ch.indexOf(it.a) : it.t === "tf" ? (it.a ? 0 : 1) : it.q.answer;
    ok = SES.sel === right;
    shown = it.t === "pick" ? it.a : it.t === "tf" ? (it.a ? "صح" : "خطأ")
      : LETTERS[right] + " — " + (it.q.format === "comparison" ? CMP_CHOICES[right] : it.q.choices[right]);
    if (it.t === "pick" && why && typeof why === "object") why = why[it._ch[SES.sel]] || why._ || "";
    choices.forEach((b, j) => {
      b.disabled = true;
      b.classList.remove("sel");
      if (j === right) b.classList.add("correct");
      else if (j === SES.sel) b.classList.add("wrong");
      else b.classList.add("dim");
    });
    card = choices[ok ? right : SES.sel];
  } else if (it.t === "fill") {
    ok = learnFillWant(it).every((x, j) => it.tiles[it.ui.slots[j]] === x);
    const eq = document.getElementById("lnEq");
    eq.innerHTML = learnFillEq(it, true);
    shown = it.eq.replace(/\*/g, "").split("_").map((part, j, all) => j === all.length - 1 ? part : part + it.a[j]).join("").replace(/\n/g, " ، ");
    card = eq;
    if (ok) { wave = byPlaced(it.ui, eq.querySelectorAll(".ln-blank")); card = null; }
  } else if (it.t === "type") {
    const want = [].concat(it.a);
    ok = want.indexOf(it.ui.val) >= 0;
    shown = want[0] + (it.unit ? " " + it.unit : "");
    card = document.getElementById("lnIn");
    card.classList.add(ok ? "right" : "wrong");
  } else if (it.t === "order") {
    ok = it.ui.seq.every((k, j) => it.tiles[k] === it.tiles[j]);
    shown = it.tiles.join(" ← ").replace(/\*/g, "");
    card = document.getElementById("lnLine");
    if (ok) { wave = card.querySelectorAll(".ln-tile"); card = null; } else card.classList.add("wrong");
  }
  document.querySelectorAll(".ln-tile, .ln-key, .ln-blank").forEach(b => { b.disabled = true; });
  learnResolve(it, ok, shown, card, false, why);
  if (wave) adWave(wave);
}
function learnRequeue(it) {
  SES.retried[it.uid] = (SES.retried[it.uid] || 0) + 1;
  if (SES.retried[it.uid] >= 3) { SES.got++; return; }     // let go of for this lesson, so the bar can still fill
  /* «بيرجع لك آخر الدرس بأرقام جديدة» is a promise: a generator with few
     values gave the same numbers back one time in four (the audit, 2026-10-28),
     so it is asked again until they differ — the order of the choices aside */
  const sig = x => JSON.stringify(x, (k, v) => k && (k[0] === "_" || ["ui", "uid", "tiles", "again"].indexOf(k) >= 0) ? undefined : v);
  let again = learnMake(it.src, it.tag);
  for (let n = 0; typeof it.src === "function" && n < 12 && sig(again) === sig(it); n++) again = learnMake(it.src, it.tag);
  again.uid = it.uid; again.again = true;
  SES.queue.push(again);
}
function learnResolve(it, ok, shown, card, pairs, why) {
  SES.locked = true;
  SES.tSpent += Math.min(120, Math.round((Date.now() - (SES.qStart || Date.now())) / 1000));
  const graded = learnGraded(it);
  if (graded) { SES.tAnswered++; dailyTick(); }
  const first = graded && !(it.uid in SES.firstTry);
  if (first) SES.firstTry[it.uid] = ok;
  if (it.t === "bank" && it.q) {
    const qs = S.qstats[it.q.id] = S.qstats[it.q.id] || { r: 0, w: 0 };
    ok ? qs.r++ : qs.w++;
    noteAnswer(it.q, ok);
  }
  const fb = document.getElementById("fb");
  SES.lastOk = !!(ok || pairs);
  if (ok || pairs) {
    playCorrect();
    let gain = 0;
    if (graded) {
      SES.run = first && !(pairs && !ok) ? (SES.run || 0) + 1 : 0; SES.done++;
      const d = it.t === "bank" ? (it.q.difficulty || 2) : 0;
      gain = !first || SES.replay ? 1 : d ? [0, 3, 5, 8][d] : 2;
      SES.gems += gain;
      SES.xp += !first || SES.replay ? 2 : d ? [0, 6, 10, 16][d] : 5;
    }
    paintProg(SES.idx + 1);
    const head = pairs ? (ok ? "وصّلتها كلها!" : "وصّلتها — في المرة الجاية بدون غلط") : it.free ? (it.head || "صح!") : praiseFor(graded ? first : undefined);
    fb.className = "feedback good show has-crest";
    fb.innerHTML = `<svg class="fb-crest" viewBox="0 0 380 90" preserveAspectRatio="none" aria-hidden="true">
        <path class="fb-crest-fill"></path>
        <path class="fb-crest-line" fill="none" stroke-width="4" vector-effect="non-scaling-stroke" stroke-linecap="round"></path>
      </svg><div class="fb-row"><div class="fb-head"><span class="fb-ok">${CHECK_BADGE}</span> ${head}</div>
        ${gain ? `<span class="fb-gain">${ico("gem", 15)} +${toAr(gain)}</span>` : ""}</div>
      ${it.ok ? `<div class="ln-fb-note">${learnFmt(it.ok)}</div>` : ""}
      <button class="btn" onclick="A.next()">متابعة</button>`;
    answerFx(card, SES.run); ansBuzz(true);
  } else {
    snd("wrong-answer", () => sndBad());
    if (graded) { SES.run = 0; fxPaintBar(0); learnRequeue(it); paintProg(); loseHeart(); }
    const hLeft = SES.hearts;
    const heartLine = !graded || SES.safe ? ""
      : hLeft === 0 ? `<div class="fb-hearts out">${ico("heart", 15)} لم يتبقَّ لك قلوب</div>`
      : hLeft === 1 ? `<div class="fb-hearts warn">${ico("heart", 15)} باقٍ لك قلب واحد — ركّز</div>` : "";
    const sol = it.t === "bank" && it.q ? `<div class="fb-solution" id="sol">${formatExplain(it.q.solution)}</div>` : "";
    fb.className = "feedback bad show";
    fb.innerHTML = `<div class="fb-head"><span class="fb-x">✕</span> ${it.free ? "الغلط هنا مجاني" : "ليست صحيحة"}</div>
      ${heartLine}
      <div class="fb-correct">الصحيح: <b>${learnFmt(shown)}</b></div>
      ${why ? `<div class="ln-why">${learnFmt(why)}</div>` : ""}
      ${sol}
      ${graded && !it.again && SES.retried[it.uid] < 3 ? `<div class="ln-back">${typeof it.src === "function" ? "بيرجع لك آخر الدرس بأرقام جديدة" : "بيرجع لك آخر الدرس"}</div>` : ""}
      <button class="btn btn-red" onclick="A.next()">${graded && hLeft === 0 && !SES.safe ? "شوف النتيجة" : "فهمت"}</button>`;
    answerFxFail(card); ansBuzz(false);
  }
  setTimeout(() => (window.requestIdleCallback || (f => f()))(warmStreak), 1400);
  save();
}

/* Recording a finished short lesson. The node only earns its stars — which is
   what opens the next node on the path — once every short lesson in it is done;
   until then its ring fills one lesson at a time. */
function learnFinish(acc) {
  const L = learnSet(SES.key);
  const rec = S.learn[SES.key] = learnRec(SES.key);
  rec.acc = rec.acc || {};
  if (rec.done.indexOf(SES.lid) < 0) rec.done.push(SES.lid);
  rec.acc[SES.lid] = Math.max(rec.acc[SES.lid] || 0, acc);
  const n = L.lessons.length, k = L.lessons.findIndex(x => x.id === SES.lid);
  const nodeDone = L.lessons.every(x => rec.done.indexOf(x.id) >= 0);
  const next = learnAt(SES.key);
  let nodeStars = 0;
  if (nodeDone) {
    const avg = L.lessons.reduce((s, x) => s + (rec.acc[x.id] || 0), 0) / n;
    nodeStars = avg >= 95 ? 3 : avg >= 75 ? 2 : 1;
  }
  LAST_LEARN = { domKey: SES.domKey, lesKey: SES.lesKey, next: nodeDone ? -1 : next,
    nextTitle: nodeDone || next < 0 ? "" : L.lessons[next].title,
    /* about twenty seconds an item, a real question counted twice, plus the recall */
    mins: nodeDone || next < 0 ? 0 : Math.max(2, Math.round(L.lessons[next].items.reduce((n, x) => n + (x.t === "bank" ? 2 : 1), 1) * 20 / 60)) };
  return { n, k, nodeDone, nodeStars, done: rec.done.length };
}
/* «الدرس التالي» from the win screen: the same hand-offs متابعة makes (the
   streak flame first), then straight into the next three minutes */
A.winNext = function () {
  snd("continue");   // the start sound waits for the lesson itself (pathNext): here it played over the streak's celebration, twelve seconds before anything started (the audit, 2026-10-28)
  wstStop(); wvStop();
  winHeroStop(); WIN = null;
  const L = LAST_LEARN;
  const go = () => signGate(() => {
    if (!(L && L.next >= 0)) { A.go("path"); return; }
    if (!PATH_PAY) { A.startLearn(L.domKey, L.lesKey, L.next); return; }
    PATH_NEXT = { domKey: L.domKey, lesKey: L.lesKey, next: L.next };
    A.go("path");
  });
  if (pendingStreak > 0) { const c = pendingStreak; pendingStreak = 0; showStreakCelebration(c, go); }
  else go();
};

function renderSession() {
  if (SES.mode === "learn") { renderLearn(); return; }
  if (SES.mode === "place") { renderPlace(); return; }
  if (SES.teach && teachGate()) { renderTeach(); return; }
  const q = SES.queue[SES.idx];
  const pct = sesPct();
  $app.innerHTML = `
    <div class="screen screen-full screen-session">
      <div class="session-top">
        <button class="x-btn" onclick="A.quitSession()" aria-label="إنهاء الدرس">${X_SVG}</button>
        <div class="prog-wrap">
          <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="تقدمك في الدرس"><i style="width:${pct}%"></i><i class="prog-cool" style="width:${pct}%"></i></div>
          <div class="fx-tag" id="fxTag" aria-hidden="true"></div>
        </div>
        ${SES.notime ? "" : timerBar()}
        ${NO_FAIL[SES.mode] || SES.safe
          ? `<span class="sess-hearts sess-review">${ico("target", 22)} ${toAr(SES.done)}/${toAr(SES.total)}</span>`
          : `<span class="sess-hearts" id="sesHearts" aria-label="القلوب المتبقية: ${toAr(SES.hearts)}">${ico("heart", 22)} ${toAr(SES.hearts)}</span>`}
      </div>
      <div class="q-area">${SES.mode === "review" ? "" : `<div class="q-count" id="sesCount">${sesCountLine()}</div>`}${questionBody(q, SES.sel, false, null, q.method || SES.method)}</div>
      <div class="action-bar"><button class="btn" id="checkBtn" onclick="A.check()" ${SES.sel === null ? "disabled" : ""}>تحقق</button></div>
      <div class="feedback" id="fb" role="status" aria-live="assertive"></div>
      <div class="storm" id="storm" aria-hidden="true"></div>
    </div>`;
  fxBindPress();
  fxPaintBar(SES.run);       // carries the streak tier + tag into this question
  startQTimer();
}

/* The clock is a deadline, not a tick count. An interval stops firing when
   the tab is backgrounded or a modal blocks the loop, so counting ticks let
   a student pause the exam by locking their phone. */
function startQTimer(resume) {
  clearInterval(SES.timer);
  if (!resume) SES.qStart = Date.now();
  if (SES.notime) { SES.timer = null; return; }        // placement is untimed on purpose
  if (!resume) SES.left = Q_SECS;
  SES.endsAt = Date.now() + SES.left * 1000;
  const w0 = document.getElementById("qtWrap");
  if (w0) w0.classList.remove("low", "crit", "paused");
  SES.timer = setInterval(qTick, 250);
}
function qTick() {
  if (!SES || !SES.timer) return;
  const left = Math.round((SES.endsAt - Date.now()) / 1000);
  if (left === SES.left) return;                       // nothing to repaint
  if (left < SES.left && left <= 5 && left > 0) snd("timer-tick", () => sndTick());
  SES.left = left;
  const n = document.getElementById("qtNum"), w = document.getElementById("qtWrap");
  if (n) n.textContent = fmtClock(left);
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

/* ---------------- question timer — Duolingo's timed-challenge pill ---------------- */
const CLOCK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 1.8"/></svg>`;
/* The clock on the pill is TIMER_SVG, the same Figma clock the timed-out
   sheet and the result cards show, hand spinning (.qt-hand). */
function timerBar() {
  return `<span class="qtimer" id="qtWrap" title="الوقت المتبقي" aria-label="الوقت المتبقي">
    ${TIMER_SVG}
    <b class="qt-num" id="qtNum">${fmtClock(Q_SECS)}</b>
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
  if (SES.safe) return;                  // the first lesson ever played costs nothing
  SES.hearts = Math.max(0, SES.hearts - 1);
  const el = document.getElementById("sesHearts");
  if (el) {
    el.innerHTML = `${ico("heart", 22)} ${toAr(SES.hearts)}`;
    el.classList.remove("hurt"); void el.offsetWidth; el.classList.add("hurt");
    if (SES.hearts === 0) el.classList.add("dead");
  }
}

/* A missed question comes back at the end, the way Duolingo does it. In a lesson three
   hearts bound how often that can happen; review runs on 999 hearts, so a question the
   student simply cannot get right used to re-queue itself forever with no way out but
   quitting. Park it after two attempts and let the session end. */
function requeue(q) {
  SES.retried[q.id] = (SES.retried[q.id] || 0) + 1;
  /* placement is an assessment, not practice: one pass, twelve questions, no
     second chances — re-queueing turned it into a loop that could not end */
  if (SES.mode === "place") return;
  if (SES.retried[q.id] < (SES.mode === "review" ? 2 : 3)) SES.queue.push(q);
}

function timeUp() {
  if (!SES || SES.locked) return;
  /* an answer picked but not yet checked when the clock runs out is graded, as
     the real exam grades it — it used to be thrown away and cost a heart even
     when it was right (the audit, 2026-10-28) */
  if (SES.sel !== null && SES.sel !== undefined && SES.mode !== "learn" && SES.mode !== "place") { A.check(); return; }
  SES.locked = true;
  SES.tSpent += Q_SECS; SES.tAnswered++;
  const q = SES.queue[SES.idx];
  const qs = S.qstats[q.id] = S.qstats[q.id] || { r: 0, w: 0 };
  qs.w++;
  noteAnswer(q, false);
  if (!(q.id in SES.firstTry)) SES.firstTry[q.id] = false;
  requeue(q);
  paintProg();
  loseHeart();
  document.querySelectorAll(".choice").forEach((b, j) => {
    b.disabled = true;
    if (j === q.answer) b.classList.add("correct"); else b.classList.add("dim");
  });
  dailyTick();
  const isCmp = q.format === "comparison";
  const correctTxt = LETTERS[q.answer] + " — " + (isCmp ? CMP_CHOICES[q.answer] : q.choices[q.answer]);
  snd("time-up", () => sndBad());
  const fb = document.getElementById("fb");
  fb.className = "feedback bad show";
  fb.innerHTML = `<div class="fb-head"><span class="fb-x fb-clock">${TIMER_SVG}</span> انتهى الوقت!</div>
    <div class="fb-correct">الإجابة الصحيحة: ${fracs(correctTxt)}</div>
    <div class="fb-solution" id="sol">${formatExplain(q.solution)}</div>
    <button class="btn btn-red" onclick="A.next()">متابعة</button>`;
  save();
}

/* one checked radio, one tab stop — both live on the element the student picked */
function paintRadios(i) {
  document.querySelectorAll(".q-area .choices .choice").forEach((b, j) => {
    b.setAttribute("aria-checked", j === i);
    b.tabIndex = j === i ? 0 : -1;
  });
}
A.pick = function (i) {
  if (SES.locked) return;
  const btn = document.querySelector(`.choice[data-ci="${i}"]`);
  SES.sel = i; snd("choice-select", null, "assessment-click-option-" + (Math.min(i, 3) + 1));
  document.querySelectorAll(".choice").forEach((b, j) => b.classList.toggle("sel", j === i));
  paintRadios(i);
  const cb = document.getElementById("checkBtn"); if (cb) cb.disabled = false;
};

/* Eight identical «أحسنت!» in a row is wallpaper. The same beat can carry where the
   student is instead: the halfway mark, a run that is getting away from them, the last
   question. The run count itself is already on the bar's tag, so the run line here says
   something else. */
function praiseFor(first) {
  const n = SES.queue.length, at = SES.idx + 1;
  if (first === false) return ["صحّحتها!", "كذا تمام!", "هذي هي!"][at % 3];   // right after a miss: no «أول وحدة صح» or «على التوالي»
  /* the first question anyone ever gets right deserves better than the fifth
     entry in a rotation */
  if (SES.safe && SES.done === 1 && !SES.li) return "أول وحدة صح — يلا\u00a0كمّل!";
  if (at >= n && SES.done >= SES.total) return "أنهيتها!";
  if (SES.run >= 5) return "لا شيء يوقفك!";
  if (SES.run === 3) return "ثلاث على التوالي!";
  if (n >= 4 && at === Math.ceil(n / 2)) return "نصف الطريق!";
  if (at === n - 1) return "بقي سؤال واحد!";
  return ["أحسنت!", "ممتاز!", "تمام!", "صحيح!", "أجدت!"][at % 5];
}

A.check = function () {
  if (SES && SES.mode === "learn") { learnCheck(); return; }
  if (SES && SES.mode === "place") { plAnswer(false); return; }
  if (!SES || SES.sel === null || SES.locked) return;
  SES.locked = true;
  stopQTimer();
  SES.tSpent += SES.notime
    ? Math.min(Q_SECS, Math.round((Date.now() - (SES.qStart || Date.now())) / 1000))
    : Q_SECS - SES.left;
  SES.tAnswered++;
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
    const d = q.difficulty || 2;
    const gemGain = seenBefore || SES.retried[q.id] ? 2 : ([0, 3, 5, 8][d] || 5);
    SES.xp += seenBefore || SES.retried[q.id] ? 3 : ([0, 6, 10, 16][d] || 10);
    SES.gems += gemGain;
    paintProg(SES.idx + 1);              // the bar moves with the answer, not with the next screen
    fb.className = "feedback good show has-crest";
    fb.innerHTML = `<svg class="fb-crest" viewBox="0 0 380 90" preserveAspectRatio="none" aria-hidden="true">
        <path class="fb-crest-fill"></path>
        <path class="fb-crest-line" fill="none" stroke-width="4" vector-effect="non-scaling-stroke" stroke-linecap="round"></path>
      </svg><div class="fb-row"><div class="fb-head"><span class="fb-ok">${CHECK_BADGE}</span> ${praiseFor()}</div>
        <span class="fb-gain">${ico("gem", 15)} +${toAr(gemGain)}</span>
        <button class="fb-solution-toggle" onclick="A.toggleSol()">اعرض الحل</button></div>
      <div class="fb-solution" id="sol" style="display:none">${formatExplain(q.solution)}</div>
      <button class="btn" onclick="A.next()">متابعة</button>`;
    /* after the sheet exists, never before: the timeline slides the sheet and
       animates the crest inside it, so both have to be in the DOM when it is
       built. Same synchronous block, so nothing paints in between. */
    answerFx(document.querySelector(`.choice[data-ci="${q.answer}"]`), SES.run); ansBuzz(true);
  } else {
    snd("wrong-answer", () => sndBad());
    SES.run = 0;                         // one miss and the run is gone
    requeue(q);
    paintProg();                         // the queue just grew, so the bar gives ground
    loseHeart();
    fb.className = "feedback bad show";
    /* the heart counter lives in the opposite corner from where the eye is, so
       the cost has to be stated here, and the last heart has to be a warning */
    const hLeft = SES.hearts;
    const noFailLine = { place: "تحديد المستوى", review: "مراجعة", mix: "تدريب" }[SES.mode];
    const heartLine = SES.safe
      ? `<div class="fb-hearts">${ico("target", 15)} درسك الأول — جرّب براحتك، ما فيه خسارة</div>`
      : noFailLine
      ? `<div class="fb-hearts">${ico("target", 15)} ${noFailLine} — ما فيه قلوب ولا خسارة</div>`
      : hLeft === 0
      ? `<div class="fb-hearts out">${ico("heart", 15)} لم يتبقَّ لك قلوب</div>`
      : hLeft === 1
        ? `<div class="fb-hearts warn">${ico("heart", 15)} باقٍ لك قلب واحد — ركّز</div>`
        : `<div class="fb-hearts">${ico("heart", 15)} باقٍ لك ${toAr(hLeft)} من القلوب</div>`;
    /* the solution used to be collapsed, under a full-width متابعة. The default
       path through a wrong answer taught the letter, not the maths. */
    fb.innerHTML = `<div class="fb-head"><span class="fb-x">✕</span> إجابة غير صحيحة</div>
      ${heartLine}
      <div class="fb-correct">الإجابة الصحيحة: ${fracs(correctTxt)}</div>
      <div class="fb-solution" id="sol">${formatExplain(q.solution)}</div>
      <button type="button" class="fb-report" onclick="A.reportQ('${q.id}')">${(S.reports || {})[q.id] ? "وصلتنا ملاحظتك على هذا السؤال ✓" : "أبلغ عن هذا السؤال"}</button>
      <button class="btn btn-red" onclick="A.next()">${hLeft === 0 ? "شوف النتيجة" : "متابعة"}</button>`;
    /* after the sheet exists: the miss timeline slides it and snaps the cross */
    answerFxFail(document.querySelector(`.choice[data-ci="${SES.sel}"]`)); ansBuzz(false);
  }
  /* The fire-streak runtimes (two libraries and a 1.3MB wasm) used to start
     loading the moment a lesson began, which on a slow phone put their parse
     and compile right under the first correct answer. Warm them while the
     student is reading the sheet instead: the celebration is a whole lesson
     away, and the main thread is idle here. */
  setTimeout(() => (window.requestIdleCallback || (f => f()))(warmStreak), 1400);
  save();
};

A.toggleSol = function () {
  const s = document.getElementById("sol");
  if (s.style.display === "none") snd("help-open");
  s.style.display = s.style.display === "none" ? "block" : "none";
};

/* Nothing moves when the sheet comes up. The question block is anchored to
   the BOTTOM of .q-area (`.q-area > :first-child { margin-top: auto }`), so the
   old habit of growing the area's padding to "clear" the sheet shoved the
   choices upward by exactly the sheet's height, mid-jump — and a window scroll
   on top of that. The sheet is an overlay that states the answer itself, as
   Duolingo's does; the reserve under the choices already fits the correct
   sheet, and the wrong sheet is allowed to cover what it explains. */

/* Method sheet (كيف أحلّها؟): teacher walks through how to approach THIS
   specific question — its own numbers, its own steps — but stops short of the
   final answer so the student still solves it. Falls back to the lesson-level
   method only if a question has no per-question hint. Slides up Duolingo-style. */
A.showMethod = function () {
  if (!SES) return;
  snd("help-open");
  stopQTimer();          // the sheet covers the clock; do not charge for reading
  const cur = SES.queue && SES.queue[SES.idx];
  const method = (cur && cur.method) || SES.method;
  const ci = SES.teach && cur ? SES.teach.chunkOf[cur.id] : undefined;
  const chunk = ci === undefined ? null : SES.teach.T.chunks[ci];
  const les = SES.domKey && window.QBANK[SES.domKey].lessons.find(x => x.key === SES.lesKey);
  if (!method && !chunk) return;
  const old = document.querySelector(".method-veil"); if (old) old.remove();
  const veil = document.createElement("div");
  veil.className = "method-veil";
  veil.innerHTML = `<div class="method-sheet">
    <div class="ms-grip"></div>
    <div class="ms-head"><span class="ms-bulb">${BULB_SVG}</span><h3>كيف أحلّها؟</h3></div>
    <div class="ms-sub">الوقت متوقف — خذ راحتك. ${cur && cur.method ? "خطوات حلّ هذا السؤال بالذات" : chunk ? "القوانين اللي يحتاجها هذا السؤال" : "قوانين هذا الدرس وخدع الاختبار"}</div>
    <div class="ms-body">${(cur && cur.method) || !chunk ? formatExplain(method) : teachRulesHtml(chunk)}</div>
    ${les && les.rules ? `<button class="btn btn-ghost ms-link" onclick="A.openBook('${SES.domKey}','${SES.lesKey}')">افتح دفتر القوانين كاملاً</button>` : ""}
    <button class="btn ms-close" onclick="A.closeMethod()">فهمت، بحاول</button>
  </div>`;
  veil.onclick = e => { if (e.target === veil) A.closeMethod(); };
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));
  MS_UNTRAP = trapOverlay(veil, () => A.closeMethod(), { label: "كيف أحلّها؟", focus: ".ms-close" });
};
let MS_UNTRAP = null;
A.closeMethod = function () {
  const v = document.querySelector(".method-veil:not(.book-veil)");
  if (!v) return;
  if (MS_UNTRAP) { MS_UNTRAP(); MS_UNTRAP = null; }
  v.classList.remove("show");
  setTimeout(() => v.remove(), 280);
  if (SES && !SES.locked && SES.left > 0) startQTimer(true);   // resume, never reset
};

A.debugCurrent = function () { return SES && SES.queue[SES.idx]; }; // dev harness (preview.html) only
/* dev harness only: answer the short lesson's current item, right or wrong, the way a tap would */
A.debugLearnAnswer = function (right) {
  const it = SES && SES.queue[SES.idx]; if (!it) return "none";
  if (it.t === "see") { A.next(); return "see"; }
  if (it.t === "pairs") {
    if (!right) { A.lPair("a", 0); A.lPair("b", it.p.length > 1 ? 1 : 0); }
    it.p.forEach((x, k) => { A.lPair("a", k); A.lPair("b", k); });
    return "pairs";
  }
  if (it.t === "pick") A.pick(right ? it._ch.indexOf(it.a) : (it._ch.indexOf(it.a) + 1) % it._ch.length);
  if (it.t === "tf") A.pick(it.a === right ? 0 : 1);
  if (it.t === "bank") A.pick(right ? it.q.answer : (it.q.answer + 1) % (it.q.format === "comparison" ? 4 : it.q.choices.length));
  if (it.t === "fill") {
    it.a.forEach(x => {
      const k = it.tiles.findIndex((t, i) => (right ? t === x : t !== x) && it.ui.slots.indexOf(i) < 0);
      A.lTile(k >= 0 ? k : it.tiles.findIndex((t, i) => it.ui.slots.indexOf(i) < 0));
    });
  }
  if (it.t === "order") { const seq = it.tiles.map((x, j) => j); if (!right) seq.reverse(); seq.forEach(k => A.lTile(k)); }
  if (it.t === "type") Array.from(right ? [].concat(it.a)[0] : "٩٩٩").forEach(c => A.lKey(c));
  A.check();
  return it.t;
};
A.debugLearnFinish = function (miss) {
  let n = 0, m = miss || 0;
  if (SES) SES.tSpent = 154;   // a real lesson's time, so the preview's time card reads like one
  while (SES && SES.mode === "learn" && n++ < 80) {
    const it = SES.queue[SES.idx];
    if (it.t === "pairs") learnResolve(it, true, "", null, true);
    else if (it.t !== "see") A.debugLearnAnswer(!(it.t !== "free" && m > 0 && m--));
    A.next();
  }
};
A.debugLearnGo = function (pred) {                                  // dev harness only: jump to the first item that matches
  const i = SES ? SES.queue.findIndex(pred) : -1;
  if (i < 0) return "none";
  SES.idx = i; SES.locked = false; SES.sel = null; renderSession(); return i;
};
A.debugRun = function () { return SES ? (SES.run || 0) : 0; };                    // dev harness only
A.debugRankUp = function (i) { showRankUp(i); };                    // dev harness only
A.debugPool = function () {                                         // dev harness only
  const pool = [];
  domains().forEach(d => d.lessons.forEach(l => trackFilter(l.questions).forEach(q => {
    if (q.format === "mcq" && q.stem) pool.push(q);
  })));
  return { domains: domains().length, lessons: domains().reduce((a,d)=>a+d.lessons.length,0),
           pool: pool.length, track: S.track };
};
A.debugEarn = function (n) { gainXP(n); gainGems(n); save(); render(); };        // dev harness only
A.debugMock = function () { return MOCK && MOCK.sections[MOCK.si].items[MOCK.qi].q; }; // dev harness only
A.debugLeague = function (n) { return leagueStandings(n); };       // dev harness only
A.debugWeek   = function (n) { return leagueWeek(n || Date.now()); }; // dev harness only
A.debugTiers  = function () { return LEAGUE_TIERS; };              // dev harness only
A.debugTick   = function () { lbTick(); return LB_TIMER; };        // dev harness only
A.debugSetXp  = function (n) { S.totalXp = n; save(); };            // dev harness only
/* Every lesson teaches cards now, so renderSession() opens one instead of a
   question and preview.html#fb could not reach the feedback sheet at all.
   Mark a lesson's rules taught so the harness lands on the questions. */
A.debugTeachAll = function (key) {                                  // dev harness only
  const T = window.QTEACH && window.QTEACH[key]; if (!T) return;
  S.teach = S.teach || {};
  const rec = S.teach[key] = S.teach[key] || { missed: [], taught: [] };
  T.chunks.forEach(c => c.steps.forEach(st => {
    if (st.type === "rule" && !rec.taught.includes(st.n)) rec.taught.push(st.n);
  }));
  save();
};

const NO_FAIL = { review: 1, place: 1, mix: 1 };  // 999 hearts: there is nothing to fail
A.next = function () {
  if (!SES) return;                    // a stray Enter after the win screen
  if (!NO_FAIL[SES.mode] && !SES.safe && SES.hearts <= 0) { sessionFailed(); return; }
  snd("continue");
  if (placeNudgeDue()) placeNudge();   // offered over the next question, never in its way
  if (SES.mode === "learn") {
    const was = SES.queue[SES.idx];
    if (was && (was.t === "see" || was.free || SES.lastOk)) SES.got++;
    SES.lastOk = false;
  }
  SES.idx++; SES.sel = null; SES.locked = false;
  if (SES.mode === "learn") { SES.idx >= SES.queue.length ? lessonComplete() : renderSession(); return; }
  if (SES.done >= SES.total || SES.idx >= SES.queue.length) {
    SES.mode === "place" ? placementComplete()
      : SES.mode === "review" ? reviewComplete()
      : SES.mode === "mix" ? mixComplete()
      : lessonComplete();
    return;
  }
  renderSession();
};

/* the mix is practice, so it pays like a replay and ends on what it found */
function mixComplete() {
  stopQTimer();
  const ft = Object.values(SES.firstTry), right = ft.filter(Boolean).length;
  const acc = ft.length ? Math.round(right / ft.length * 100) : 0;
  const xpWon = SES.xp;
  gainXP(xpWon); gainGems(SES.gems); bumpStreak(); save(); snd("practice-complete", () => sndWin());
  LAST_MISSES = Object.keys(SES.firstTry).filter(k => SES.firstTry[k] === false);
  $app.innerHTML = `<div class="screen screen-full"><div class="complete win-scene" id="comp">
    ${winHero()}
    <h1 class="win-title">تدريب مكتمل!</h1>
    <p class="win-sub">${toAr(right)} من ${toAr(ft.length)} من أول محاولة</p>
    <div class="result-cards">
      <div class="rcard rc-gold"><div class="rc-t">الخبرة</div><div class="rc-v">${ico("lightning", 20)} <span id="cv-xp">٠</span></div></div>
      <div class="rcard rc-green"><div class="rc-t">الدقة</div><div class="rc-v">${ico("target", 22)} ${toAr(acc)}٪</div></div>
    </div>
    <div class="action-bar win-action" style="position:relative;right:auto;transform:none;max-width:340px;padding:0;background:none">
      <button class="btn" onclick="A.go('path')">متابعة</button>
      ${LAST_MISSES.length ? `<button class="btn btn-white win-again" onclick="A.reviewMissed()">راجع أخطاء التدريب</button>` : ""}
    </div>
  </div></div>`;
  winHeroPlay();
  setTimeout(() => { const x = document.getElementById("cv-xp"); if (x) countUp(x, xpWon); }, 700);
  SES = null;
}

A.quitSession = function () {
  if (S.placeNudge && SES && SES.key === S.placeNudge.key && !SES.nudged) { placeNudge(); return; }
  askConfirm("تبي توقف الدرس؟", "تقدمك في هذا الدرس ما راح ينحفظ.", "أكمل الدرس", "أوقف الدرس", () => {
    stopQTimer();
    if (SES && SES.xpBoost) { gainGems(BOOST_COST); save(); }   // the boost was never spent
    SES = null; go("path");
  });
};

A.retryLevel = function (domKey, lesKey) { A.startLesson(domKey, lesKey); };

function countUpTime(el, to, ms) {
  const t0 = performance.now(), dur = ms || 1200;
  (function f(t) {
    const p = Math.min(1, Math.max(0, (t - t0) / dur)), eased = 1 - Math.pow(1 - p, 3);
    const v = Math.round(to * eased);
    el.textContent = fmtClock(v);   // m:ss — «٠٠:٠٠» read as a row of dots, the Arabic zero is one
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
  snd("lesson-failed", () => sndLose());
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
  save(); snd("revive", () => { sndGood && sndGood(); });
  if (SES.idx >= SES.queue.length) { lessonComplete(); return; }
  renderSession();
};
A.quitFailed = function () { SES = null; A.go("path"); };

/* A true five-point star: sharp points, then a same-shape stroke on top to
   round every corner by half its width - the Duolingo star is chunky, not
   a blob. Drawn at 44x44 with room for the 5px rim. */
/* the day's goal met on a lesson's last answer: the banner timed for 1.2s
   later landed on the win screen, over the first victory (the audit,
   2026-10-28) — the win screen takes it off and tells the goal itself */
var QB_T = null;
function questBannerOff() { clearTimeout(QB_T); document.querySelectorAll(".quest-banner").forEach(e => e.remove()); }
function lessonComplete() {
  questBannerOff();
  if (S.placeNudge && SES && SES.key === S.placeNudge.key) S.placeNudge = null;   // they got through it
  stopQTimer();
  const ft = Object.values(SES.firstTry);
  const acc = ft.length ? Math.round(ft.filter(Boolean).length / ft.length * 100) : 0;
  const stars = acc === 100 ? 3 : acc >= 75 ? 2 : 1;
  const perfect = acc === 100;
  const wasDone = SES.mode === "learn" ? learnRec(SES.key).done.length : 0, wasStars = (S.lessons[SES.key] || {}).stars || 0;
  const learn = SES.mode === "learn" ? learnFinish(acc) : null;
  /* a short lesson is a third of the old one, and so is its bonus; finishing a
     whole node is the moment that pays */
  if (perfect && !SES.replay) { SES.xp += learn ? 10 : 20; SES.gems += learn ? 10 : 25; }   // perfect bonus only on a fresh clear
  if (learn && learn.nodeDone && !SES.replay) { SES.xp += 20; SES.gems += 20; }
  const p = S.lessons[SES.key] = S.lessons[SES.key] || { stars: 0, plays: 0 };
  p.plays++;
  if (!learn) p.stars = Math.max(p.stars, stars);
  else if (learn.nodeDone) p.stars = Math.max(p.stars, learn.nodeStars);
  p.last = todayKey();               // so the path can say when a lesson is going stale
  PATH_PAY = SES.replay || (learn && learn.done === wasDone) ? null : { key: SES.key, was: wasDone, gold: !wasStars && p.stars > 0 };
  try { PATH_PAY ? sessionStorage.setItem("qPathPay", JSON.stringify(PATH_PAY)) : sessionStorage.removeItem("qPathPay"); } catch (e) {}
  const rankGain = SES.xp * (SES.xpBoost ? 2 : 1);   // 2× boost doubles RANK XP only (gems unaffected)
  const lbAt = Date.now(), lb0 = leagueStandings(lbAt), ti0 = tierIndex();
  gainXP(rankGain); gainGems(SES.gems);
  /* the same rivals at the same instant, after: a move up plays the climb
     (a new tier is the rank-up's moment instead, and a new cohort) */
  const r0 = lb0.findIndex(e => e.you) + 1, r1 = leagueStandings(lbAt).findIndex(e => e.you) + 1;
  const climb = tierIndex() === ti0 && r1 < r0 ? { from: r0, to: r1, list: lb0, xp1: S.totalXp } : null;
  if (climb) climbSfxLoad();                         // decoded while the win screen plays
  const streakUp = bumpStreak(); save();
  pendingStreak = streakUp ? S.streak.count : 0;   // show the fire-streak celebration after this win screen
  const xpWon = rankGain, gemsWon = SES.gems, boosted = SES.xpBoost, tTot = SES.tSpent;
  LAST_MISSES = learn
    ? SES.queue.filter(it => it.t === "bank" && it.q && SES.firstTry[it.uid] === false).map(it => it.q.id).filter((id, i, a) => a.indexOf(id) === i)
    : Object.keys(SES.firstTry).filter(k => SES.firstTry[k] === false);
  const missCount = LAST_MISSES.length;
  /* The first lesson cannot be failed, which means it can no longer tell a
     struggling student the truth by ending the session. So the win screen says
     it instead: the star and فهيم stay, because the student really did answer
     every question, but the line stops calling it a clean finish and the review
     button becomes the thing to do next rather than an afterthought. */
  const struggled = SES.safe && acc < 50 && missCount && !(learn && learn.k > 0);
  const hardLearn = learn && learn.k > 0 && acc < 50;
  /* Duolingo's lesson-complete grammar, read from its own files: a headline
     that names what the run was — the first lesson makes you «a learner», a
     clean run is «perfect», a quick one «fast» — drawn from small pools so it
     does not repeat, the character's line under it, and stat labels that only
     ever flatter: a poor result falls back to the plain word. */
  const firstEver = Object.values(S.lessons).reduce((n, x) => n + (x.plays || 0), 0) === 1;
  const pickOne = a => a[Math.floor(Math.random() * a.length)];
  const mins = Math.max(1, Math.ceil(tTot / 60));
  const [head, say] = learn && learn.nodeDone ? ["ختمت المرحلة!", `«${SES.title}» آخر درس فيها — والمرحلة التالية *انفتحت*!`]
    : struggled ? ["خلّصت درسك الأول", "الأول دايماً أصعب — راجع اللي فاتك وارجع له، بيصير أسهل."]
    : hardLearn ? ["أكملت الدرس!", "هذا كان أصعب — أول سؤال في الدرس الجاي بيرجّعك له."]
    : firstEver ? ["أنت متعلّم حقيقي!", "أول درس وخلّصته — *بداية قوية*!"]
    : perfect ? pickOne([["درس بلا أخطاء!", "خذ تحيّة — ولا *غلطة وحدة*!"], ["ولا غلطة!", "صفر أخطاء؟ لو أنت *آلة حاسبة* اعترف!"],
        ["كامل!", "هالعقل لازم *يندرس*!"]])
    : tTot > 0 && tTot < 120 ? pickOne([["سريع جداً!", `أقل من *${toAr(mins)} ${mins === 1 ? "دقيقة" : mins === 2 ? "دقيقتين" : "دقائق"}*؟ تسافر عبر الزمن؟`],
        ["خلّصت؟!", "بهالسرعة؟ *هذا المستوى*!"]])
    : [pickOne(["أحسنت!", "تقدّم ممتاز!", "سوّيتها!", "شغل نظيف!"]),
       pickOne(["مهاراتك في الكمي *تتحسّن*.", "كل درس يقرّبك من *هدفك*.", "التقدّم *لابق* عليك."])];
  const lcTitle = head.replace(/\*/g, ""), lcSub = String(say).replace(/\*/g, "");
  const accTag = acc === 100 ? "مذهل" : acc >= 90 ? "رائع" : acc >= 60 ? "جيد" : "الدقة";
  const timeTag = tTot < 90 ? "خاطف" : tTot < 180 ? "سريع" : tTot < 300 ? "منجز" : "ملتزم";
  const goal = dailyGoal(), qd1 = Math.min(goal, (S.daily && S.daily.n) || 0), qd0 = Math.max(0, qd1 - (SES.qd || 0));
  WIN = { learn, title: SES.title, lesKey: SES.lesKey, uc: (UNIT_COLORS[(window.QBANK[SES.domKey] || {}).color] || UNIT_COLORS.purple), gems: gemsWon, boosted, goal, qd0, qd1, struggled, missCount, climb,
    nxt: learn && LAST_LEARN.next >= 0 ? { t: LAST_LEARN.nextTitle, m: LAST_LEARN.mins } : null };
  const stat = (c, label, icon, id, extra) => `<div class="wst wst-${c}${extra || ""}">
      <div class="wst-pop">
        <span class="wst-bg"></span><span class="wst-t"><span>${label}</span></span>
        <span class="wst-v"><span class="wst-in">${icon}<b id="${id}">٠</b></span></span>
        <span class="wst-shine"><i></i></span>
      </div>
      ${[1, 2, 3].map(i => `<i class="wst-gl wst-g${i}">${WST_GLINT}</i>`).join("")}
    </div>`;
  $app.innerHTML = `<div class="screen screen-full"><div class="complete win-scene wn" id="comp">
    <div class="wv-lc">
      <canvas id="wvRive" class="wv-rive" aria-hidden="true"></canvas>
      <div class="wv-fh" aria-hidden="true"><div class="wv-fh-in">${mascot("celebrate", "wv-qd")}</div></div>
      <h1 class="wn-title wv-title">${esc(lcTitle)}</h1>
      <p class="wv-sub">${esc(lcSub)}</p>
    </div>
    <div class="wst-wrap">
    <canvas id="wstRive" class="wst-rive" width="750" height="268" aria-hidden="true"></canvas>
    <div class="wst-row">
      ${stat(xpWon ? "gold" : "gray", "مجموع الخبرة", ico("lightning", 22), "cv-xp")}
      ${stat("green", accTag, ico("target", 22), "cv-acc", perfect ? " hi" : "")}
      ${stat("blue", timeTag, TIMER_SVG, "cv-time", tTot > 0 && tTot < 120 ? " hi" : "")}
    </div></div>
    <div class="action-bar win-action wn-cta">
      ${struggled
        ? `<button class="btn" onclick="A.reviewMissed()">راجع أخطاء الدرس</button>
           <button class="btn btn-white win-again" onclick="A.winOn()">متابعة</button>`
        : `<button class="btn" onclick="A.winOn()">متابعة</button>
           ${missCount ? `<button class="btn btn-white win-again" onclick="A.reviewMissed()">راجع أخطاء الدرس</button>` : ""}`}
    </div>
  </div></div>`;
  wstLoad({ xp: xpWon, acc, t: tTot, perfect, accTag, timeTag });
  winPlay({ xp: xpWon, acc, t: tTot, perfect, head: head.replace(/\*/g, ""), title: lcTitle, sub: lcSub });
  SES = null;
}

/* The win screen, fifth version (2026-10-27: «change the winning screen to
   something like Duolingo style, exactly the same victory but for our
   characters, use their files»). Duolingo's own lesson-complete file plays
   everything but its character: lesson_complete_main_29.riv
   (assets/fx/lesson-complete.riv, Rive 2.47.1), view model lesson_complete_vm,
   set up the way its app sets it (vi00 / zi00): the phase-one headline, the
   title under the hero and the subtitle in Arabic, right to left, beats and
   background 0 — or 2 on a perfect run — then start_db_trig. Duo is switched
   off (nested_char_vm.is_character_db_bool) and فهيم flies where Duo flies:
   Duo's box measured off the file every 50ms (WV_PATH, artboard units — in
   from the lower left held at 1.05, the dip, the shrink to .65 over
   800–1150ms and the rise), then Duo's two-second hover. The file draws the
   green band, the headline, the title, the subtitle and the sparkles on its
   own clock, and its stats_db_trig starts the stat cards. Duolingo's
   lesson_complete sound (its perfect-lesson one on a clean run) plays at the
   start, its stats haptic on the cards. The artboard is laid out as Duolingo
   lays it: 1.625 × min(2.2 W, 1.1 H) wide, centred, 32 up (li00). Without the
   file (offline, reduced motion) فهيم stands at Duo's last place over the
   HTML title. A tap anywhere jumps to the end. */
const WV_PATH = [[40, 357, 705, 378], [100, 559, 611, 378], [150, 610, 607, 380], [200, 634, 604, 380], [250, 649, 599, 378],
  [300, 658, 597, 380], [350, 664, 596, 380], [400, 668, 592, 380], [450, 671, 592, 378], [500, 674, 593, 380],
  [550, 677, 590, 378], [600, 680, 589, 380], [650, 683, 590, 378], [700, 685, 589, 378], [750, 688, 589, 380],
  [800, 691, 586, 378], [850, 693, 589, 378], [900, 696, 591, 376], [950, 696, 594, 368], [1000, 693, 600, 346],
  [1050, 688, 605, 260], [1100, 686, 587, 240], [1150, 686, 579, 236], [1200, 685, 576, 234], [1250, 685, 569, 234],
  [1350, 685, 565, 234], [1450, 685, 562, 234], [1550, 685, 561, 234]];
/* a perfect run: the same flight, then the deeper shrink (.60 by 1183), the
   dip to −71 at 1383 and the settle by 2217–2417 */
const WV_PATH_PERFECT = WV_PATH.slice(0, 19).concat([[1000, 693, 598, 330], [1050, 690, 590, 280], [1100, 688, 575, 240],
  [1183, 686, 560, 216], [1383, 685, 531, 216], [1800, 685, 552, 224], [2217, 685, 561, 230], [2417, 685, 561, 234]]);
const WV_STATS = { normal: 1550, perfect: 2267 };
/* Duolingo's haptics (.hla, on / off alternating from on): the stats start, and the perfect lesson's own */
const WV_BUZZ = [30, 50, 250, 171, 30, 70, 30, 67, 30, 37, 30, 6, 30, 34, 30, 38, 30, 134, 442, 60, 30, 141, 430, 60, 30];
const WV_BUZZ_PERFECT = [200, 25, 300, 504, 267, 15, 20, 15, 20, 15, 60];
const WV_BOX = 330;                         // فهيم's square in artboard units at Duo's flight scale
let wvRv = null, wvFontBytes = null, wvRun = null;
function wvGeo(host) {
  const W = host.clientWidth, H = host.clientHeight, s = 1.625 * Math.min(2.2 * W, 1.1 * H) / 1366;
  const minX = 683 - W / (2 * s), minY = 688 - (H / 2 - 32) / s;
  return { W, H, s, minX, minY, x: u => (u - minX) * s, y: v => (v - minY) * s, h: Math.round((787 - minY) * s) };
}
function wvFontLoad() {
  return (wvFontBytes ? Promise.resolve(wvFontBytes) : fetch("assets/fonts/baloo-bhaijaan-2.ttf").then(r => r.arrayBuffer()).then(b => (wvFontBytes = new Uint8Array(b))))
    .then(b => rive.decodeFont(b));
}
/* the file, set up and waiting for start_db_trig; resolves false when it cannot play */
function wvLoad(cv, g, txt, perfect) {
  return loadStreakLibs().then(wvFontLoad).then(font => new Promise(done => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(g.W * dpr); cv.height = Math.round(g.H * dpr);
    const k = g.s * dpr;
    const rv = wvRv = new rive.Rive({
      src: "assets/fx/lesson-complete.riv", canvas: cv, autoplay: true, autoBind: true,
      artboard: "interstitial_main_artboard", stateMachines: "interstitial_main_statemachine",
      layout: new rive.Layout({ fit: rive.Fit.Fill, minX: -g.minX * k, minY: -g.minY * k, maxX: (1366 - g.minX) * k, maxY: (1376 - g.minY) * k }),
      assetLoader: asset => { if (!asset.isFont) return false; asset.setFont(font); if (font.unref) font.unref(); return true; },
      onLoad: () => {
        if (wvRv !== rv) return done(false);
        try {
          const vm = rv.viewModelInstance;
          const str = (n, v) => { vm.string(n).value = v; }, bool = (n, v) => { try { vm.boolean(n).value = v; } catch (e) {} },
                num = (n, v) => { try { vm.number(n).value = v; } catch (e) {} };
          str("interstitial_db_str", txt.head); str("top_flavor_text_db_str", txt.title); str("bot_flavor_text_db_str", txt.sub);
          bool("right_to_left_db_bool", true); bool("dark_mode_db_bool", false); bool("static_db_bool", false); bool("skip_anim_db_bool", false);
          bool("perfect_lesson_db_bool", perfect); bool("combo_run_db_bool", perfect); bool("sparkles_on_db_bool", true); bool("char_hover_db_bool", true);
          num("bg_color_db_num", perfect ? 2 : 0); num("beats_db_num", perfect ? 2 : 0);
          vm.viewModel("nested_char_vm").boolean("is_character_db_bool").value = false;
          rv.vm = vm;
          done(true);
        } catch (e) { done(false); }
      },
      onLoadError: () => done(false)
    });
  })).catch(() => false);
}
function wvStop() {
  if (wvRun) { wvRun.timers.forEach(clearTimeout); wvRun.anims.forEach(a => { try { a.cancel(); } catch (e) {} }); wvRun = null; }
  if (wvRv) { try { wvRv.cleanup(); } catch (e) {} wvRv = null; }
  if (wgRv) { try { wgRv.cleanup(); } catch (e) {} wgRv = null; }
}
/* «تقدّمك اليوم»'s gems are Duolingo's gem reveal (gems_reveal_v14.riv,
   assets/fx/gems.riv): a pile drops onto the card, cracks the floor and spills
   two stones — small, medium or large by what the lesson paid. It is loaded as
   the screen opens and fired by wpPlay; the gem glyph stays for reduced motion
   and until the file is ready. */
let wgRv = null;
function wgLoad() {
  const c = document.getElementById("wpGemRv");
  if (!c || fxReduced()) return;
  loadStreakLibs().then(() => {
    if (!document.getElementById("wpGemRv") || wgRv) return;
    const rv = wgRv = new rive.Rive({ src: "assets/fx/gems.riv", canvas: c, artboard: "gems_artboard", stateMachines: "gems", autoplay: true,
      onLoad: () => { if (wgRv === rv) rv.ready = true; } });
  }).catch(() => {});
}
/* true when the pile will play: the caller then counts on the landing */
function wgFire(n) {
  if (!wgRv || !wgRv.ready) return false;
  const ins = wgRv.stateMachineInputs("gems") || [], t = ins.find(x => x.name === (n >= 30 ? "lg" : n >= 15 ? "med" : "sm") + "_anim_trig");
  if (!t) return false;
  document.getElementById("wpGemRv").parentElement.classList.add("rv");
  t.fire();
  return true;
}
/* Duolingo's four-point glint */
const WST_GLINT = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0c.9 5.4 4.6 9.1 10 10-5.4.9-9.1 4.6-10 10-.9-5.4-4.6-9.1-10-10 5.4-.9 9.1-4.6 10-10z"/></svg>`;
let WIN = null, wnTl = null, wpTl = null;
/* the reward plays in full, but a tap on the screen jumps it to its end — by
   the thirtieth lesson nobody should have to wait eight seconds for a button */
function winSkippable(tl) {
  const host = document.getElementById("comp");
  if (!host || !tl) return;
  host.addEventListener("pointerdown", e => {
    if (e.target.closest("button")) return;
    /* a skip runs every beat at once: their sounds are held, or both bars and
       the tally played in the same millisecond (the audit, 2026-10-28) */
    if (tl.progress() < 1) { SFX_HOLD = true; try { tl.progress(1); } finally { SFX_HOLD = false; } }
  });
}
/* Duolingo's stat cards are played from Duolingo's own file (2026-10-21: the
   user asked for its animation 100%, not a copy of it): stat_component_72_lc_
   refresh.riv, the compiled artboard its lesson-complete screen fires with
   flurry_start_trig, set up the way its app sets it (rk00 / tk00): right_left
   for RTL, XP in A, accuracy in B with the percent sign first (symbol 3, what
   an Arabic phone gets), time in C as minutes and seconds, shine on a perfect
   run and on a fast one, the labels through the file's own view model. The
   file names its font without carrying it, so it is handed ours
   (assets/fonts/stat-font.ttf: Baloo Bhaijaan 2 at 800, cut to Arabic, its
   0–9 and % drawn as ٠–٩ and ٪ so the file's own digit ticker rolls in Eastern
   Arabic). Nested events do not reach the page, so the hit on each card is
   played on the file's own beats: cards at 0 / .6 / 1.267s, each popping in
   .54s into its beat, so its hit starts at +.48s and peaks on the pop (it was
   at +.167s, a third of a second early, and the first one drowned in the win
   jingle — the user, 2026-10-28: «not synchronised … I just hear 2»). The
   HTML cards (statCardIn) stay underneath for screen readers, and play
   instead whenever the file is not ready — offline, or reduced motion. */
let wstRv = null;
const WST_AT = [0, .6, 1.267];
const WST_HIT = .48;                 // into each card's beat: the hit's peak (60ms in) lands on the card's pop
const WST_GAIN = [.6, .9, .65];      // each card's hit at the same loudness (stat-2 peaks 4 dB under the others)
function wstStop() {
  if (wstRv) { try { wstRv.cleanup(); } catch (e) {} wstRv = null; }
}
function wstLoad(v) {
  wstStop();
  if (motionReduced() || !document.getElementById("wstRive")) return;
  loadStreakLibs().then(() => {
    const cv = document.getElementById("wstRive");
    if (!cv || wstRv) return;
    const rv = wstRv = new rive.Rive({
      src: "assets/streak/stats.riv", canvas: cv, autoplay: true, autoBind: true,
      artboard: "lesson_stats_compiled_artboard", stateMachines: "stat_compile_statemachine",
      layout: new rive.Layout({ fit: rive.Fit.Contain }),
      assetLoader: asset => {
        if (!asset.isFont) return false;
        fetch("assets/fonts/stat-font.ttf").then(r => r.arrayBuffer()).then(b => rive.decodeFont(new Uint8Array(b)))
          .then(f => { asset.setFont(f); if (f.unref) f.unref(); rv.fontOk = true; }).catch(() => {});
        return true;
      },
      onLoad: () => {
        if (wstRv !== rv) return;
        try {
          rv.resizeDrawingSurfaceToCanvas();
          const vm = rv.viewModelInstance, label = { A: "مجموع الخبرة", B: v.accTag, C: v.timeTag };
          "ABC".split("").forEach(k => { const s = vm.viewModel("stats_component_" + k + "_db_vm").string("run_main_db_str"); s.value = label[k]; });
          const ins = rv.stateMachineInputs("stat_compile_statemachine"), set = (n, x) => { const i = ins.find(j => j.name === n); if (i) i.value = x; };
          set("right_left_bool", true); set("buckets_num", 3); set("dark_mode_bool", false);
          const t = Math.max(0, Math.round(v.t || 0));
          /* each card defaults to Duolingo's combo border (a light running round
             the edge); off a combo session it reads as a break in the border */
          ["A", "B", "C"].forEach(k => rv.setBooleanStateAtPath("combo_animated_gradient_bool", false, k + "_stat_box"));
          rv.setNumberStateAtPath("main_num", v.xp, "A_stat_box");
          rv.setNumberStateAtPath("main_num", v.acc, "B_stat_box");
          rv.setNumberStateAtPath("symbol_type_num", 3, "B_stat_box");
          rv.setBooleanStateAtPath("shine_bool", !!v.perfect, "B_stat_box");
          rv.setNumberStateAtPath("main_num", Math.floor(t / 60), "C_stat_box");
          rv.setNumberStateAtPath("sec_num", t % 60, "C_stat_box");
          rv.setBooleanStateAtPath("shine_bool", t > 0 && t < 120, "C_stat_box");
          rv.ins = ins; rv.ready = true;
        } catch (e) { wstStop(); }
      }
    });
  }).catch(() => {});
}
/* fire the file's cards; false when it is not ready and the HTML cards must play */
function wstFire(skip) {
  const rv = wstRv;
  if (!rv || !rv.ready || !rv.fontOk) return false;
  const wrap = document.querySelector(".wst-wrap");
  if (wrap) wrap.classList.add("rive-on");
  const i = n => rv.ins.find(j => j.name === n);
  if (skip && i("anim_off_bool")) i("anim_off_bool").value = true;
  if (!rv.fired) { rv.fired = true; i("flurry_start_trig").fire(); }
  if (!skip) {
    const hz = [196, 247, 294];
    WST_AT.forEach((a, k) => setTimeout(() => {
      if (wstRv !== rv) return;
      sfxPlay("stat" + (k + 1), WST_GAIN[k], () => { cvTone(hz[k], hz[k] * .55, .16, "triangle", .22); cvHiss(.08, .05, 0, 3000, 1200); }); buzz(18);
      setTimeout(() => buzz([10, 50, 10, 50, 10, 50, 10]), 250);
    }, (a + WST_HIT) * 1000));
  }
  return true;
}
/* one of Duolingo's stat cards, on the timeline at t0 (bucket_animation_3) */
function statCardIn(tl, c, t0, k, count) {
  const pop = c.querySelector(".wst-pop"), body = c.querySelector(".wst-v"), inner = c.querySelector(".wst-in"),
        bg = c.querySelector(".wst-bg"), lab = c.querySelector(".wst-t > span"), gl = Array.from(c.querySelectorAll(".wst-gl"));
  const hitHz = [196, 247, 294][k] || 247;
  gsap.set(pop, { scale: .8, "--hb": 0 });
  gsap.set(body, { width: "64%", height: 40, "--ha": 0 });
  gsap.set(inner, { scale: .75 });
  gsap.set(bg, { opacity: 0, y: 26, scaleX: .7 });
  gsap.set(lab, { opacity: 0, scaleX: .86 });
  gsap.set(gl, { opacity: 0, scale: .2, x: 0, y: 0 });
  /* where each glint flies to: off the top corner (two) and the bottom one */
  const out = [{ x: 16, y: -16 }, { x: 22, y: 2 }, { x: -16, y: 16 }];
  tl.set(c, { opacity: 1 }, t0)
    .to(pop, { keyframes: [
      { scale: 1.156, duration: .033, ease: "none" },
      { scale: 1.25, duration: .084, ease: "power2.in" },
      { scale: .97, duration: .2, ease: "power2.out" },
      { scale: 1, duration: .05, ease: "none" }] }, t0)
    .to(body, { width: "calc(100% - 4px)", height: 66, duration: .35, ease: "expo.out" }, t0)
    .to(body, { "--ha": 1, duration: .12, ease: "power1.out" }, t0 + .05)
    .to(inner, { keyframes: [{ scale: 1.25, duration: .117, ease: "power3.out" }, { scale: 1, duration: .2, ease: "power2.inOut" }] }, t0)
    .call(() => { sfxPlay("stat" + (k + 1), WST_GAIN[k] || .6, () => { cvTone(hitHz, hitHz * .55, .16, "triangle", .22); cvHiss(.08, .05, 0, 3000, 1200); }); buzz(18); }, null, t0 + .06)   // the copy pops at once: its hit peaks on the pop's top (.117s)
    /* the card opens: the strip rises from behind the body inside the halo */
    .to(bg, { opacity: 1, y: 0, scaleX: 1, duration: .266, ease: "expo.out" }, t0 + .317)
    .to(body, { "--ha": 0, duration: .2, ease: "power1.out" }, t0 + .317)
    .to(pop, { "--hb": 1, duration: .2, ease: "power1.out" }, t0 + .317)
    .to(pop, { "--hb": 0, duration: .4, ease: "power1.in" }, t0 + .75)
    .to(lab, { keyframes: [{ opacity: 1, scaleX: 1.08, duration: .1, ease: "power2.out" }, { scaleX: .98, duration: .07 }, { scaleX: 1, duration: .07 }] }, t0 + .317)
    .call(() => count(), null, t0 + (c.classList.contains("wst-green") ? .9 : .417));
  gl.forEach((g, i) => {
    tl.to(g, { opacity: 1, scale: .8 + (i === 0 ? .25 : 0), x: out[i].x, y: out[i].y, rotation: 90, duration: .55, ease: "back.out(2.4)" }, t0 + .317 + i * .04)
      .to(g, { scale: .5, opacity: 0, duration: .18, ease: "power1.in" }, t0 + .82 + i * .04);
  });
  if (c.classList.contains("hi")) tl.fromTo(c.querySelector(".wst-shine i"), { x: 0, xPercent: -140 }, { x: 0, xPercent: 140, duration: 1.1, ease: "power2.inOut" }, t0 + 1);
}
function winPlay(v) {
  wvStop();
  if (wnTl) { wnTl.kill(); wnTl = null; }
  const q = c => document.querySelector(c), qa = c => Array.from(document.querySelectorAll(c));
  const host = q("#comp"), box = q(".wv-lc"), cv = q("#wvRive"), fh = q(".wv-fh"), inner = q(".wv-fh-in"),
        title = q(".wv-title"), sub = q(".wv-sub"), cards = qa(".wst"), cta = q(".wn-cta");
  if (!host || !box) { sndWin(); return; }
  const g = wvGeo(host), B = WV_BOX * g.s, P = v.perfect ? WV_PATH_PERFECT : WV_PATH, END = P[P.length - 1][0], last = P[P.length - 1];
  box.style.height = g.h + "px"; cv.style.height = g.H + "px";
  fh.style.width = fh.style.height = B.toFixed(1) + "px";
  title.style.top = g.y(721).toFixed(1) + "px"; title.style.fontSize = Math.max(24, 30 * g.s).toFixed(1) + "px";
  sub.style.top = g.y(764).toFixed(1) + "px"; sub.style.fontSize = Math.max(16, 20 * g.s).toFixed(1) + "px";
  const place = (u, y, w) => `translate(${(g.x(u) - B / 2).toFixed(1)}px, ${(g.y(y) - B / 2).toFixed(1)}px) scale(${(w / 378).toFixed(3)})`;
  const counts = () => {
    const x = document.getElementById("cv-xp"), a = document.getElementById("cv-acc"), t = document.getElementById("cv-time");
    return [() => x && countUp(x, v.xp, "", 450), () => a && countUp(a, v.acc, "٪", 450), () => t && countUpTime(t, v.t, 450)];
  };
  const showCta = ms => {
    cta.style.pointerEvents = "auto";
    cta.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, fill: "forwards" });
  };
  /* without the file: فهيم at Duo's last place over the HTML title and subtitle */
  const lcSound = () => sfxPlay(v.perfect ? "lcPerfect" : "lcDone", v.perfect ? 1 : .5, sndWin);   // Duolingo's win sound, ours when it is not loaded
  const still = () => {
    lcSound();
    host.classList.remove("rv-wait", "rv-on");
    fh.style.transform = place(last[1], last[2], last[3]); fh.style.opacity = 1;
    counts().forEach(f => f()); cards.forEach(c => { c.style.opacity = ""; });
    showCta(0);
  };
  fh.style.transform = place(P[0][1], P[0][2], P[0][3]);
  if (motionReduced()) { still(); return; }
  fh.style.opacity = 0; cta.style.opacity = 0; cta.style.pointerEvents = "none";
  cards.forEach(c => { c.style.opacity = 0; });
  host.classList.add("rv-wait");
  const run = wvRun = { timers: [], anims: [], started: false, skipped: false, stats: false };
  const later = (ms, f) => run.timers.push(setTimeout(() => { if (wvRun === run) f(); }, ms));
  later(2500, () => { if (!run.started) { run.started = true; still(); } });   // the file never came: play nothing, lose nothing
  const hover = () => {
    run.anims.push(inner.animate([{ transform: "none" }, { transform: `translateY(${(10 * g.s).toFixed(1)}px)` }],
      { duration: 1000, easing: "ease-in-out", direction: "alternate", iterations: Infinity }));
  };
  /* the stat cards on the file's stats_db_trig (Duolingo's own file when it is ready, else the HTML copy) */
  const stats = skip => {
    if (wvRun !== run || run.stats) return;
    run.stats = true;
    if (!skip) buzz(WV_BUZZ);
    const fill = counts();
    cards.forEach(c => { c.style.opacity = ""; });
    if (wstFire(skip)) fill.forEach(f => f());
    else if (window.gsap) {
      const ft = gsap.timeline();
      cards.forEach((c, k) => statCardIn(ft, c, WST_AT[k], k, () => { fill[k](); buzz([10, 50, 10, 50, 10, 50, 10]); }));
      if (skip) ft.progress(1);
    } else fill.forEach(f => f());
    if (skip) showCta(0);
    else later((WST_AT[WST_AT.length - 1] + 1) * 1000, () => showCta(500));
  };
  const skip = () => {
    if (wvRun !== run || run.skipped || !run.started) return;
    run.skipped = true;
    try { wvRv.vm.boolean("skip_anim_db_bool").value = true; } catch (e) {}
    run.anims.forEach(a => { try { a.finish(); } catch (e) {} });
    fh.style.transform = place(last[1], last[2], last[3]); fh.style.opacity = 1;
    hover();
    stats(true);
  };
  host.addEventListener("pointerdown", e => { if (!e.target.closest("button")) skip(); });
  const go = () => {
    host.classList.remove("rv-wait"); host.classList.add("rv-on");
    try { wvRv.vm.trigger("stats_db_trig").on(() => { if (wvRun === run) stats(run.skipped); }); } catch (e) {}
    wvRv.vm.trigger("start_db_trig").trigger();
    lcSound();
    if (v.perfect) buzz(WV_BUZZ_PERFECT);
    run.anims.push(fh.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 60, delay: 40, fill: "both" }));
    const fly = fh.animate(P.map(([t, u, y, w]) => ({ offset: t / END, transform: place(u, y, w) })), { duration: END, easing: "linear", fill: "both" });
    run.anims.push(fly);
    fly.onfinish = () => { if (wvRun === run && !run.skipped) { fh.style.transform = place(last[1], last[2], last[3]); hover(); } };
    later((v.perfect ? WV_STATS.perfect : WV_STATS.normal) + 250, () => stats(run.skipped));
  };
  wvLoad(cv, g, { head: v.head, title: v.title, sub: v.sub }, !!v.perfect).then(ok => {
    if (wvRun !== run || run.started) return;
    run.started = true;
    if (ok) go(); else still();
  });
}

/* Duolingo's second screen after a lesson is the quests: what the lesson did to
   the day. Ours has up to three cards — the lesson ticked off in its stage, the
   day's goal filling, the gems — each landing on its own beat: a wait, a
   swell to 1.06 while it lights up, and a settle. A bar's fill takes longer the
   further it has to go, so a big jump reads as big. */
/* The league climb (Brilliant's: a lesson that lifts you past rivals plays the
   overtaking itself; asked back exactly on 2026-10-26 after a Duolingo-style
   rebuild, «just the movement of me to be better»). lessonComplete ranks you
   against the same rivals at the same instant before and after the lesson's
   XP; when you moved up, this screen sits between the win and «تقدّمك اليوم».
   The league on top, then «مركزك» — the number, or the medal in the top three
   — then the board in a window that follows your row. Your XP counts up, the
   row crouches and lifts off the board, then glides up past each rival (slow
   off the mark, quick in the middle) and floats a little past its place before
   it drops in with a squash; its shadow deepens with its speed. Each rival
   drops a place under it with a dim, your number ticks over on Duolingo's
   tick-ups, and the window follows you. Then the headline. XP wears the
   league tab's gold «XP» tag (the user, 2026-10-26: «not the lightning»).
   Weight and light only — no confetti. A tap anywhere jumps to the end.
   «مركزك» is a medal (2026-10-26: «like first place, second place and third
   place svg but make it for 4+», then «less good than bronze silver gold»):
   the podium medals' own disc, and from fourth down a plain grey one with no
   ribbon and no shine, its number rolling over inside the disc at every rival passed
   while the medal pops; it turns over into bronze, silver and gold as you
   enter the top three, and on the landing it jumps and a light crosses it.
   Every rank number on the board rolls the same way — yours up, theirs down. */
const CLIMB_ROW = 62, CLIMB_PAD = 16;
const rankCell = r => r <= 3 ? MEDAL(r) : `<span class="lb-rank">${toAr(r)}</span>`;
/* ribbon, disc, the disc's light side, the number, the ring — the podium
   medals' own colours (MEDAL_SVGS), and under them a plain grey disc with no
   ribbon, so fourth never looks as good as a medal */
const CL_PAINT = [["#FFC800", "#FFD900", "#FEEA66", "#FF9600", "#FFC800"], ["#AAC1D4", "#C2D1DD", "#D6E4EF", "#849FB5", "#AAC1D4"],
  ["#D7975D", "#E5AE7C", "#F7BE8B", "#CD7900", "#D7975D"], ["transparent", "#F2F2F2", "#F2F2F2", "#8A8A8A", "#DCDCDC"]];
const clPaint = r => CL_PAINT[Math.min(r, 4) - 1];
function clMedal(r) {
  const [rb, disc, hi, ink, ring] = clPaint(r);
  return `<div class="cl-medal${r > 3 ? " plain" : ""}" id="clMedal" style="--mi:${ink}" role="img" aria-label="مركزك ${toAr(r)}">
    <svg viewBox="0 0 41 42" aria-hidden="true"><path class="m-rb" d="M8.31 18.47H31.88V38.41C31.88 39.84 30.46 40.85 29.1 40.37L20.09 37.19 11.08 40.37C9.73 40.85 8.31 39.84 8.31 38.41Z" fill="${rb}"/><circle class="m-disc" cx="20.09" cy="20.09" r="14.4" fill="${disc}"/><path class="m-hi" d="M11.7 31.8C18.17 36.43 27.16 34.95 31.8 28.49L8.39 11.7C3.76 18.17 5.24 27.16 11.7 31.8Z" fill="${hi}"/><circle class="m-ring" cx="20.09" cy="20.09" r="12.9" fill="none" stroke="${ring}" stroke-width="3"/></svg>
    <span class="cl-mn"><b id="clRank">${toAr(r)}</b><i class="cl-msh"></i></span></div>`;
}
/* a number rolls over in its cell: the old one slides out, the new one in
   (up when you climb, down for the rival you passed) */
function clRoll(el, html, up) {
  if (!el) return;
  el._v = html;
  const old = el._shown != null ? el._shown : el.innerHTML;
  el._shown = html;
  if (motionReduced() || !Element.prototype.animate) { el.innerHTML = html; return; }
  el.innerHTML = `<span class="cl-roll"><span>${old}</span><span>${html}</span></span>`;
  const [o, n] = el.firstChild.children, d = up ? -1 : 1;
  o.animate([{ transform: "none", opacity: 1 }, { transform: `translateY(${d * 110}%)`, opacity: 0 }], { duration: 220, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" });
  n.animate([{ transform: `translateY(${-d * 110}%)`, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 300, easing: "cubic-bezier(.3,1.6,.5,1)", fill: "backwards" });
  setTimeout(() => { if (el._v === html && el.firstChild && el.firstChild.classList && el.firstChild.classList.contains("cl-roll")) el.innerHTML = html; }, 320);
}
const CL_SFX = ["lbUnlock", "lbMove", "lbGold", "lbGrey"];
function climbSfxLoad() {
  CL_SFX.forEach(sfxLoad);
  for (let k = 1; k <= 15; k++) sfxLoad("lbTick" + k);
}
let climbRaf = 0, climbT = [];
function climbStop() { cancelAnimationFrame(climbRaf); climbT.forEach(clearTimeout); climbT = []; }
A.climbOn = function () { snd("continue"); A.winMore(); };   // the climb's «متابعة» was the only silent one (the audit, 2026-10-28)
A.winOn = function () { snd("continue"); if (WIN && WIN.climb) A.winClimb(); else A.winMore(); };
A.winClimb = function () {
  wstStop(); wvStop(); winHeroStop(); climbStop();
  const C = WIN && WIN.climb;
  if (!C) { A.winMore(); return; }
  WIN.climb = null;                                  // once per win
  climbSfxLoad();
  const tier = LEAGUE_TIERS[tierIndex()], n = C.from - C.to;
  const head = C.to === 1 ? "تصدّرت الدوري!" : `تقدّمت ${arPlural(n, "مركزاً واحداً", "مركزين", "مراكز", "مركزاً")}!`;
  $app.innerHTML = `<div class="screen screen-full"><div class="complete cl" id="comp">
    <div class="cl-kick">${rankImg(tier.key, 30)}<span>الدوري — المستوى ${tier.name}</span></div>
    <div class="cl-rank"><span>مركزك</span>${clMedal(C.from)}</div>
    <h1 class="cl-title" id="clHead">${head}</h1>
    <div class="cl-win" id="clWin"><div class="cl-list" id="clList">${C.list.map((e, i) => `<div class="lb-row cl-row${e.you ? " me" : ""}" style="top:${i * CLIMB_ROW}px">
        <span class="cl-rk">${rankCell(i + 1)}</span>${avatarFor(e.name, e.you)}
        <span class="lb-name">${esc(e.name)}${e.you && e.named ? " <b>(أنت)</b>" : ""}</span>
        <span class="lb-xp"><b${e.you ? ` id="clXp"` : ""}>${toAr(e.xp)}</b><i>XP</i></span>
        ${e.you ? `<span class="cl-shine"><i></i></span>` : ""}
      </div>`).join("")}</div></div>
    <div class="action-bar win-action wn-cta cl-cta" id="clCta"><button class="btn" onclick="A.climbOn()">متابعة</button></div>
  </div></div>`;
  climbPlay(C);
};
function climbPlay(C) {
  const win = document.getElementById("clWin"), box = document.getElementById("clList");
  if (!win || !box) return;
  const rows = [...box.children], me = rows[C.from - 1], H = CLIMB_ROW, n = C.from - C.to;
  /* the board sits CLIMB_PAD inside the window, so your row's lift and its
     float past the top place are never cut; each edge fades only while there
     are rows beyond it (the user, 2026-10-26: at the top the fade sat on your
     own row and your name could not be read) */
  const winH = win.clientHeight, floor = Math.min(0, winH - rows.length * H - 2 * CLIMB_PAD);
  const follow = y => {
    const t = Math.max(floor, Math.min(0, winH / 2 - H / 2 - y - CLIMB_PAD));
    box.style.transform = `translateY(${t.toFixed(1)}px)`;
    win.style.setProperty("--ft", Math.min(40, -t).toFixed(1) + "px");
    win.style.setProperty("--fb", Math.min(40, t - floor).toFixed(1) + "px");
  };
  const rankOf = (row, r, up) => { const c = row.querySelector(".cl-rk"); if (done) { c._shown = null; c.innerHTML = rankCell(r); } else clRoll(c, rankCell(r), up); };
  const xpEl = document.getElementById("clXp"), big = document.getElementById("clRank"), medal = document.getElementById("clMedal");
  /* the medal: its number rolls up inside the disc and it pops; crossing into
     a new colour it turns over edge-on and comes back in the new one */
  let paint = clPaint(C.from);
  const repaint = p => {
    if (!medal) return;
    const [rb, disc, hi, ink, ring] = p;
    medal.querySelector(".m-rb").setAttribute("fill", rb); medal.querySelector(".m-disc").setAttribute("fill", disc);
    medal.querySelector(".m-hi").setAttribute("fill", hi); medal.querySelector(".m-ring").setAttribute("stroke", ring);
    medal.style.setProperty("--mi", ink);
    medal.classList.toggle("plain", p === CL_PAINT[3]);
  };
  const bigTo = r => {
    if (!big) return;
    if (medal) medal.setAttribute("aria-label", "مركزك " + toAr(r));
    const p = clPaint(r), turn = p !== paint;
    paint = p;
    if (done) { big._shown = null; big.textContent = toAr(r); repaint(p); return; }
    clRoll(big, toAr(r), true);
    if (!medal) return;
    if (turn) {
      medal.animate([{ transform: "none" }, { transform: "perspective(400px) rotateY(90deg) scale(1.1)" }], { duration: 140, easing: "ease-in" })
        .onfinish = () => { repaint(p); medal.animate([{ transform: "perspective(400px) rotateY(-90deg) scale(1.1)" }, { transform: "scale(1.18)", offset: .6 }, { transform: "none" }], { duration: 380, easing: "cubic-bezier(.3,1.5,.5,1)" }); };
      sfxPlay("lbUnlock", .7);
    } else medal.animate([{ transform: "scale(1)" }, { transform: "scale(1.13, 1.09) translateY(-3px)", offset: .35 }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(.3,1.6,.5,1)" });
  };
  follow((C.from - 1) * H);
  /* the rows nearest you come in first, the rest are already there */
  rows.forEach((r, i) => { const d = Math.abs(i - (C.from - 1)); r.style.animationDelay = (d < 4 ? d * .06 : 0) + "s"; });
  let done = false;
  const passed = new Set();
  const pass = j => {                                  // you overtake the rival in before-place j (0-based)
    if (passed.has(j)) return;
    passed.add(j);
    rows[j].style.top = (j + 1) * H + "px";
    rankOf(rows[j], j + 2, false);
    rankOf(me, j + 1, true);
    bigTo(j + 1);
    if (!done) {
      rows[j].animate([{ opacity: 1 }, { opacity: .4, offset: .3 }, { opacity: 1 }], { duration: 480 });
      const k = passed.size;
      if (k <= 5) snd("climb-pass-note", () => beep([[523 * Math.pow(2, Math.min(k, 12) / 12) * 1.5, .07]]), "xp-tally-" + k);   // past the fifth, the 2.7s tallies piled into a roar (11 at once on #climbtop): the ticks carry on alone
      sfxPlay("lbTick" + Math.min(k, 15), .9);
      buzz(6);
      me.querySelector(".cl-rk").animate([{ transform: "scale(1.45)" }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(.3,1.6,.5,1)" });
    }
  };
  const land = () => {
    me.style.top = (C.to - 1) * H + "px";
    me.style.boxShadow = "";
    me.classList.remove("up");
    for (let j = C.from - 2; j >= C.to - 1; j--) pass(j);   // bottom up, as the climb passes them, so your number ends on your place
    rankOf(me, C.to, true); bigTo(C.to);
    follow((C.to - 1) * H);
    if (xpEl) xpEl.textContent = toAr(C.xp1);
    document.getElementById("clHead").classList.add("go");
    document.getElementById("clCta").classList.add("go");
  };
  /* the landing: the medal crouches, jumps, lands with a squash, and a light
     crosses its disc */
  const medalLand = () => {
    if (!medal || motionReduced()) return;
    medal.animate([{ transform: "none" }, { transform: "translateY(4px) scale(1.12, .86)", offset: .16 }, { transform: "translateY(-22px) scale(.94, 1.08)", offset: .45 },
      { transform: "translateY(0) scale(1.14, .84)", offset: .72 }, { transform: "translateY(-3px) scale(.98, 1.03)", offset: .86 }, { transform: "none" }],
      { duration: 640, easing: "ease-out" });
    if (C.to <= 3) { medal.classList.remove("shine"); void medal.offsetWidth; medal.classList.add("shine"); }
  };
  const end = () => { if (done) return; done = true; climbStop(); me.getAnimations().forEach(x => x.cancel()); land(); };
  const host = document.getElementById("comp");
  host.addEventListener("pointerdown", e => { if (!e.target.closest("button")) end(); });
  if (motionReduced()) { end(); sfxPlay(C.to <= 3 ? "lbGold" : "lbGrey", .9); return; }
  const at = (ms, f) => climbT.push(setTimeout(f, ms));
  /* 1. your XP climbs on your row */
  at(450, () => {
    if (!done) snd("climb-xp-count");
    const x0 = C.list[C.from - 1].xp, t0 = performance.now(), tag = xpEl && xpEl.nextElementSibling;
    let shown = x0;
    (function tick(now) {
      if (done || !xpEl) return;
      const p = Math.min(1, (now - t0) / 650), v = Math.round(x0 + (C.xp1 - x0) * (1 - Math.pow(1 - p, 3)));
      if (v !== shown) {
        shown = v; xpEl.textContent = toAr(v);
        xpEl.animate([{ transform: "translateY(-5px) scale(1.15)" }, { transform: "none" }], { duration: 140, easing: "ease-out" });
      }
      if (p < 1) { requestAnimationFrame(tick); return; }
      if (tag) tag.animate([{ transform: "scale(1)" }, { transform: "scale(1.35) rotate(-6deg)", offset: .4 }, { transform: "scale(1)" }], { duration: 420, easing: "cubic-bezier(.3,1.6,.5,1)" });
      buzz(10);
    })(t0);
  });
  /* 2. the row crouches, then lifts off the board: it grows, rounds its
     corners and takes its shadow */
  at(1150, () => {
    if (done) return;
    me.classList.add("up");
    me.animate([{ transform: "scale(1)" }, { transform: "translateY(3px) scale(1.02, .9)", offset: .3 }, { transform: "translateY(-3px) scale(1.07)", offset: .72 }, { transform: "scale(1.06)" }],
      { duration: 340, easing: "ease-out", fill: "forwards" });
    sfxPlay("lbUnlock", .9, () => beep([[392, .06], [523, .08]]));
    buzz([20, 0, 197]);
  });
  /* 3. it moves off slowly and gathers speed as it goes (the user, 2026-10-26:
     «move slow at first then fast»), arrives fast, floats a third of a row
     past its place and drops back; its shadow deepens with its speed */
  const T = Math.max(1100, Math.min(2800, 800 + n * 240)), OV = .3, y0 = (C.from - 1) * H, y1 = (C.to - 1) * H;
  const glide = p => p < .85 ? Math.pow(p / .85, 3) * .9 : .9 + .1 * (1 - Math.pow(1 - (p - .85) / .15, 4.8));   // the brake matches the speed it arrives with
  const shadow = (v, a) => `inset 0 0 0 2px var(--gold), 0 3px 0 var(--gold), 0 ${(10 + 10 * v).toFixed(1)}px ${(22 + 18 * v).toFixed(1)}px rgba(170, 120, 0, ${(a == null ? .2 + .14 * v : a).toFixed(3)})`;
  at(1550, () => {
    if (done) return;
    if (n > 1) sfxPlay("lbMove", .9);
    const t0 = performance.now(), dist = y0 - y1 + OV * H;
    let last = y0;
    (function step(now) {
      if (done) return;
      const p = Math.min(1, (now - t0) / T), y = y0 - dist * glide(p);
      const v = Math.min(1, Math.abs(last - y) / 9);
      last = y;
      me.style.top = y.toFixed(1) + "px";
      me.style.boxShadow = shadow(v);
      follow(Math.max(y, y1));
      const pos = y / H;
      for (let j = C.from - 2; j >= C.to - 1; j--) if (pos < j + .5) pass(j);
      if (p < 1) { climbRaf = requestAnimationFrame(step); return; }
      settle(performance.now());
    })(t0);
  });
  /* 4. it drops back into its place with a squash, the lock-in and a shine */
  function settle(t0) {
    sfxPlay(C.to <= 3 ? "lbGold" : "lbGrey", .9, () => beep(C.to <= 3 ? [[659, .09], [784, .09], [1047, .1], [1319, .26]] : [[784, .09], [1047, .2]]));
    buzz([30, 20, 150, 38, 30, 60, 30, 74, 30]);
    me.getAnimations().forEach(x => x.cancel());
    me.animate([{ transform: "scale(1.06)" }, { transform: "scale(1.09, .86)", offset: .34 }, { transform: "scale(.98, 1.04)", offset: .66 }, { transform: "scale(1)" }],
      { duration: 460, easing: "ease-out" });
    me.classList.add("shine");
    const from = y1 - OV * H;
    (function drop(now) {
      if (done) return;
      const p = Math.min(1, (now - t0) / 300), e = 1 - Math.pow(1 - p, 3);
      me.style.top = (from + (y1 - from) * e).toFixed(1) + "px";
      me.style.boxShadow = shadow(0, .2 * (1 - e));
      if (p < 1) { climbRaf = requestAnimationFrame(drop); return; }
      done = true;
      land();
      medalLand();
    })(t0);
  }
}
/* «تقدّمك اليوم»'s bars are Duolingo's quest bar (ChallengeProgressBarView,
   view_challenge_progress_bar.xml; 2026-10-26: «البار زينه ويصير مثل ديلانجو
   انميشن بالضبط»): the app's bar (.duo-bar) at Duolingo's 20, the count
   «٧ / ١٠» centred inside it — juicyHare grey over the track and the fill's
   own text colour over the fill, cut exactly at the fill's edge — and the
   chest overlapping its far end. It fills (cpbFill) from where the lesson
   found it in 283 / 367 / 450 / 533ms by how far it jumps, on Duolingo's
   PathInterpolator(.74,.17,.69,.77), the count running with it, plays
   Duolingo's bar sound for that jump, then Duolingo's yellow particle at the
   fill's end — or, when it fills, the sparkles over the whole bar. */
function cpbHtml(id, n0, n1, max, c, shine, ink, end, label) {
  const p0 = Math.round(Math.min(1, n0 / max) * 100), tx = `${toAr(n0)} / ${toAr(max)}`;
  return `<div class="cpb" id="${id}" data-n0="${n0}" data-n1="${n1}" data-max="${max}" style="--bar-c:${c};--bar-shine:${shine};--cpb-ink:${ink}" role="img" aria-label="${esc(label)}">
    <span class="cpb-track"><span class="duo-bar cpb-bar"><i style="width:${p0}%"></i>
      <span class="cpb-tx" aria-hidden="true">${tx}</span>
      <span class="cpb-tx on" aria-hidden="true" style="clip-path:inset(0 0 0 ${100 - p0}%)">${tx}</span></span>
      <span class="cpb-fx" aria-hidden="true" style="right:${p0}%"></span></span>
    <span class="cpb-end" aria-hidden="true">${end}</span>
  </div>`;
}
/* cubic-bezier(x1, y1, x2, y2) as a function of time, for GSAP */
function bezEase(x1, y1, x2, y2) {
  const B = (a, b, t) => 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t;
  return x => {
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 24; i++) { t = (lo + hi) / 2; if (B(x1, x2, t) < x) lo = t; else hi = t; }
    return B(y1, y2, t);
  };
}
const CPB_EASE = bezEase(.74, .17, .69, .77);
let cpbLottie = [];
function cpbStop() { cpbLottie.forEach(a => { try { a.destroy(); } catch (e) {} }); cpbLottie = []; }
/* Duolingo's particle and sparkles are drawn yellow and recoloured to the bar
   at runtime (setSparklesAnimationColors); the same is done to the file here */
const cpbFiles = {};
function cpbFile(name, rgb) {
  const k = name + rgb.join(",");
  if (!cpbFiles[k]) cpbFiles[k] = fetch("assets/fx/" + name).then(r => r.json()).then(j => {
    const c = rgb.map(v => v / 255).concat(1);
    const drop = l => l.nm === "outline 2" || l.nm === "Shape Layer 1";
    j.layers = j.layers.filter(l => !drop(l));
    (j.assets || []).forEach(a => { if (a.layers) a.layers = a.layers.filter(l => !drop(l)); });
    (function walk(o) {
      if (Array.isArray(o)) return o.forEach(walk);
      if (!o || typeof o !== "object") return;
      if ((o.ty === "fl" || o.ty === "st") && o.c) o.c = { a: 0, k: c };
      Object.keys(o).forEach(key => walk(o[key]));
    })(j);
    return j;
  });
  return cpbFiles[k];
}
function cpbFx(box, full, c) {
  if (fxReduced() || !box) return;
  const rgb = rgbOf(c);
  loadStreakLibs().then(() => cpbFile(full ? "bar-sparkles.json" : "bar-particle.json", rgb)).then(data => {
    const host = document.createElement("span");
    host.className = full ? "cpb-spark" : "cpb-part";
    if (full) {
      /* the file is 884 × 392 with the bar's centre at y 183: as wide as the bar + 24 */
      const w = box.clientWidth + 24, h = w * 392 / 884;
      host.style.height = h.toFixed(1) + "px";
      host.style.marginTop = (-h * 183 / 392).toFixed(1) + "px";
    }
    box.appendChild(host);
    const a = lottie.loadAnimation({ container: host, renderer: "svg", loop: false, autoplay: true, animationData: data,
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" } });
    cpbLottie.push(a);
    a.addEventListener("complete", () => { host.remove(); });
  }).catch(() => {});
}
function cpbFill(el, tl, at) {
  if (!el) return 0;
  const n0 = +el.dataset.n0, n1 = +el.dataset.n1, max = +el.dataset.max;
  const f0 = Math.min(1, n0 / max), f1 = Math.min(1, n1 / max), jump = f1 - f0;
  const fill = el.querySelector(".cpb-bar > i"), txs = el.querySelectorAll(".cpb-tx"), on = el.querySelector(".cpb-tx.on");
  const fx = el.querySelector(".cpb-fx"), c = getComputedStyle(fill).backgroundColor;
  const dur = jump < .25 ? .283 : jump < .5 ? .367 : jump < .75 ? .45 : .533;
  const st = { f: f0 };
  const paint = () => {
    fill.style.width = (st.f * 100).toFixed(2) + "%";
    on.style.clipPath = `inset(0 0 0 ${(100 - st.f * 100).toFixed(2)}%)`;
    fx.style.right = (st.f * 100).toFixed(2) + "%";
    const n = Math.round(n0 + (n1 - n0) * (f1 > f0 ? (st.f - f0) / (f1 - f0) : 1));
    txs.forEach(t => { t.textContent = `${toAr(Math.min(n, n1))} / ${toAr(max)}`; });
  };
  if (!tl) { st.f = f1; paint(); return 0; }
  tl.call(() => {
    const big = jump >= .75 ? 100 : jump >= .5 ? 75 : jump >= .25 ? 50 : 25;
    sfxPlay((f1 >= 1 ? "barC" : "barP") + big, .9, () => beep([[660, .05], [880, .08]]));
    buzz(f1 >= 1 ? [20, 40, 30] : f1 >= .6 ? 18 : 10);
  }, null, at);
  tl.to(st, { f: f1, duration: dur, ease: CPB_EASE, onUpdate: paint }, at);
  tl.call(() => cpbFx(f1 >= 1 ? el.querySelector(".cpb-track") : fx, f1 >= 1, c), null, at + dur);
  return dur;
}
A.winMore = function () {
  climbStop();
  wstStop(); wvStop();
  winHeroStop();
  const W = WIN; if (!W) { A.winContinue(); return; }
  const L = W.learn, done = W.qd1 >= W.goal, justDone = done && W.qd0 < W.goal;
  const pct = n => Math.round(n / W.goal * 100);
  const nxt = W.nxt ? `التالي: «${esc(W.nxt.t)}» — ${W.nxt.m <= 2 ? "دقيقتين" : `${toAr(W.nxt.m)} دقائق`}` : "";
  $app.innerHTML = `<div class="screen screen-full"><div class="complete wp" id="comp">
    <h1 class="wp-title">تقدّمك اليوم</h1>
    <div class="wp-list">
      ${L ? `<div class="wp-card wn-task${L.nodeDone ? " all" : ""}">
        <span class="wn-check" aria-hidden="true"><svg viewBox="0 0 32 32"><circle class="wn-ring" cx="16" cy="16" r="14"/><path class="wn-tick" d="M9.5 16.5l4.5 4.5 8.5-9"/></svg></span>
        <span class="wn-tx">
          <b><span class="wn-name">${esc(W.title)}</span><span class="wn-count"><span id="wnN">${toAr(L.done - 1)}</span>/${toAr(L.n)}</span></b>
          <span class="wn-bar" role="img" aria-label="أنهيت ${toAr(L.done)} من ${toAr(L.n)} دروس في هذه المرحلة">${Array.from({ length: L.n }, (x, i) =>
            `<i class="${i < L.done && i !== L.k ? "on" : ""}${i === L.k ? " now" : ""}"><u></u></i>`).join("")}<span class="wn-fx" aria-hidden="true"></span></span>
          <span class="wn-next">${nxt || (L.nodeDone ? "المرحلة التالية انفتحت لك" : "")}</span>
        </span>
      </div>` : ""}
      <div class="wp-card wp-quest${done && !justDone ? " full" : ""}">
        <b class="wq-h" id="wpQt">${done && !justDone ? "اكتمل هدف اليوم" : `حلّ ${qCount(W.goal)}`}</b>
        ${cpbHtml("wpBar", W.qd0, W.qd1, W.goal, "var(--gold)", "#FFE7A0", "#CD7900", chestSVG("wp-chest").replace('viewBox="0 0 260 290"', 'viewBox="12 75 236 192"'), `حللت ${toAr(W.qd1)} من ${toAr(W.goal)} أسئلة اليوم`)}
      </div>
      ${W.gems ? `<div class="wp-card wp-gems">
        <span class="wp-gem">${ico("gem", 34)}<canvas class="wp-gem-rv" id="wpGemRv" width="240" height="240" aria-hidden="true"></canvas></span>
        <span class="wn-tx"><b><span>+<span id="wpG">٠</span> جوهرة</span></b><span class="wn-next">رصيدك ${toAr(S.xp)} جوهرة${W.boosted ? " — الخبرة ×٢" : ""}</span></span>
      </div>` : ""}
    </div>
    <div class="action-bar win-action wn-cta">
      ${W.nxt ? `<button class="btn" onclick="A.winNext()">الدرس التالي</button>
                 <button class="btn btn-white win-again" onclick="A.winContinue()">المسار</button>`
              : `<button class="btn" onclick="A.winContinue()">متابعة</button>`}
    </div>
  </div></div>`;
  window.scrollTo(0, 0);
  wgLoad();
  Object.keys(SFX_SRC).filter(k => k.indexOf("bar") === 0).forEach(sfxLoad);
  wpPlay(W, justDone);
};
function wpPlay(W, justDone) {
  const q = c => document.querySelector(c), cards = Array.from(document.querySelectorAll(".wp-card"));
  const cta = q(".wp .wn-cta"), gEl = document.getElementById("wpG");
  const task = q(".wp .wn-task"), quest = q(".wp .wp-quest");
  const questWords = () => {
    const t = document.getElementById("wpQt");
    if (justDone && t) { t.textContent = "اكتمل هدف اليوم!"; quest.classList.add("full"); }
  };
  cpbStop();
  if (!window.gsap || motionReduced()) {
    sfxPlay(justDone ? "barC100" : "barP50", .9);
    cpbFill(document.getElementById("wpBar"));
    if (task) { task.classList.add("done"); if (task.classList.contains("all")) task.classList.add("full"); const n = document.getElementById("wnN"); if (n) n.textContent = toAr(W.learn.done); }
    questWords(); if (gEl) gEl.textContent = toAr(W.gems);
    return;
  }
  gsap.set(cards, { opacity: 0, y: 26 });
  gsap.set(cta, { opacity: 0, y: 12, pointerEvents: "none" });
  if (wpTl) wpTl.kill();
  const tl = wpTl = gsap.timeline({ delay: .25 });
  winSkippable(tl);
  tl.to(q(".wp-title"), { keyframes: [{ scale: 1.15, duration: .15, ease: "power2.out" }, { scale: 1, duration: .3, ease: "back.out(3)" }] }, 0);
  let t = .3;
  cards.forEach(c => {
    tl.to(c, { opacity: 1, y: 0, duration: .35, ease: "back.out(1.8)" }, t);
    /* Duolingo's card: it waits 517ms, swells to 1.06 and 1.05 while its
       highlight face flashes, and settles back over 400ms */
    const at = t + .517;
    tl.to(c, { keyframes: [{ scale: 1.06, duration: .2, ease: "power2.out" }, { scale: 1.05, duration: .2 }, { scale: 1, duration: .4, ease: "power2.inOut" }] }, at)
      .call(() => { c.classList.add("lit"); }, null, at)
      .call(() => { c.classList.remove("lit"); }, null, at + .4);
    let dur = 0;
    if (c === task) {
      /* the lesson ticked off: the ring fills and its check draws, then this
         lesson's segment fills on the quest bar's curve and sound, with its
         particle at the segment's end, and the count turns over */
      const seg = c.querySelector(".wn-bar i.now u"), tick = c.querySelector(".wn-tick"), n = document.getElementById("wnN");
      const len = tick.getTotalLength ? tick.getTotalLength() : 24, segDur = .45;
      gsap.set(tick, { strokeDasharray: len, strokeDashoffset: len });
      if (seg) gsap.set(seg, { scaleX: 0 });
      tl.call(() => { c.classList.add("done"); buzz(20); }, null, at)
        .fromTo(c.querySelector(".wn-check"), { scale: .4 }, { scale: 1, duration: .5, ease: "elastic.out(1.2, .45)" }, at)
        .to(tick, { strokeDashoffset: 0, duration: .26, ease: "power2.out" }, at + .07);
      if (seg) {
        const full = W.learn.done >= W.learn.n;
        tl.call(() => sfxPlay(full ? "barC100" : "barP25", .9, () => cvSnd.tick()), null, at + .17)
          .to(seg, { scaleX: 1, duration: segDur, ease: CPB_EASE }, at + .17)
          .call(() => {
            const fx = c.querySelector(".wn-fx"), cell = seg.parentNode;
            if (fx && cell) { fx.style.left = cell.offsetLeft + "px"; cpbFx(fx, false, getComputedStyle(seg).backgroundColor); }
          }, null, at + .17 + segDur);
      }
      tl.call(() => { if (n) { n.textContent = toAr(W.learn.done); gsap.fromTo(n.parentNode, { scale: 1.45 }, { scale: 1, duration: .45, ease: "back.out(3)" }); } }, null, at + .17 + segDur);
      if (c.classList.contains("all")) tl.call(() => c.classList.add("full"), null, at + .3 + segDur);
      dur = .3 + segDur;
    } else if (c === quest) {
      dur = cpbFill(document.getElementById("wpBar"), tl, at);
      tl.call(() => {
        questWords();
        if (justDone) gsap.fromTo(c.querySelector(".wp-chest"), { y: 0 }, { keyframes: [{ y: -14, scaleY: 1.08, duration: .16, ease: "power2.out" }, { y: 0, scaleY: .9, duration: .14, ease: "power2.in" }, { scaleY: 1, duration: .3, ease: "back.out(3)" }] });
      }, null, at + dur);
    } else if (gEl) {
      /* the pile is fired as the card arrives and lands about a second later
         (Duolingo's file: shadow at .4s, the drop at .6s, the hit at 1s);
         silent — the user, 2026-10-28: «gem sounds remove it» */
      const pay = () => { countUp(gEl, W.gems, "", 500); buzz([10, 50, 10, 50, 10]); };
      tl.call(() => {
        if (wgFire(W.gems)) gsap.delayedCall(1, () => { if (document.getElementById("wpGemRv")) pay(); });
        else {
          pay();
          gsap.fromTo(c.querySelector(".wp-gem"), { rotation: 0 }, { keyframes: [{ rotation: -14, scale: 1.25, duration: .15 }, { rotation: 8, scale: .95, duration: .15 }, { rotation: 0, scale: 1, duration: .3, ease: "back.out(3)" }] });
        }
      }, null, at - .45);
    }
    t = at + Math.max(.55, dur + .25);
  });
  tl.to(cta, { opacity: 1, y: 0, duration: .5, ease: "power2.out" }, t + .1)
    .set(cta, { pointerEvents: "auto" }, t + .2);
}

/* Straight from the win screen into the questions that beat you, while they are still
   fresh. The ids are held here because SES is torn down as the screen is built. */
let LAST_MISSES = [];
A.reviewMissed = function () {
  wstStop(); wvStop();
  winHeroStop();
  const qs = LAST_MISSES.map(id => questionById(id)).filter(Boolean).map(x => shuffleChoices(x.q));
  if (!qs.length) { A.winContinue(); return; }
  SES = { mode: "review", domKey: null, lesKey: null, key: null, title: "مراجعة الدرس", method: "",
    queue: qs.slice(), total: qs.length, idx: 0, done: 0, firstTry: {}, retried: {}, sel: null,
    locked: false, xp: 0, gems: 0, replay: false, xpBoost: false, hearts: 999, notime: true, left: Q_SECS, timer: null, tSpent: 0, tAnswered: 0, fromWin: !!WIN };
  renderSession();
};

const arNum = t => +String(t).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

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
  </div>`;
}
function countUp(el, to, suffix, ms) {
  const t0 = performance.now(), dur = ms || 900;
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

/* A mock is fifty minutes of a student's evening. It used to live only in memory,
   so a pulled-down notification shade, an OS update or a stray refresh threw the
   whole attempt away. Every answer, flag and section boundary is written to its own
   key — the exam is not progress, so it stays out of qudratState — and the home
   screen offers it back. The clock is stored as the seconds that were left, not as
   a deadline: a crash should not also cost the student time. */
const MOCK_KEY = "qudratMock";
function mockLeft(sec) { return sec.endsAt ? Math.max(0, Math.round((sec.endsAt - Date.now()) / 1000)) : sec.left; }
function mockSave() {
  if (!MOCK) return;
  try {
    localStorage.setItem(MOCK_KEY, JSON.stringify({
      v: 1, at: Date.now(), track: S.track, si: MOCK.si, qi: MOCK.qi,
      sections: MOCK.sections.map((sec, i) => ({
        items: sec.items, answers: sec.answers, flags: sec.flags,
        left: i === MOCK.si ? mockLeft(sec) : sec.left
      }))
    }));
  } catch (e) { /* a full or blocked store must not break the exam */ }
}
function mockClear() { try { localStorage.removeItem(MOCK_KEY); } catch (e) { } }
function mockSaved() {
  try {
    const o = JSON.parse(localStorage.getItem(MOCK_KEY) || "null");
    if (!o || o.v !== 1 || !Array.isArray(o.sections) || !o.sections.length) return null;
    if (Date.now() - (o.at || 0) > 864e5) { mockClear(); return null; }   // a day old is abandoned
    if (o.track !== S.track) { mockClear(); return null; }                // the track changed under it
    const sec = o.sections[o.si];
    if (!sec || !Array.isArray(sec.items) || !sec.items.length) { mockClear(); return null; }
    if (o.sections.every((x, i) => i < o.si) && o.si >= o.sections.length) { mockClear(); return null; }
    return o;
  } catch (e) { return null; }
}
A.mockResume = function () {
  const o = mockSaved();
  if (!o) { render(); return; }
  MOCK = { sections: o.sections, si: o.si, qi: Math.max(0, Math.min(o.qi || 0, o.sections[o.si].items.length - 1)), timer: null };
  MOCK.sections.forEach(sec => { sec.endsAt = 0; });
  startMockSection(true);
};

function renderMockHome() {
  const mocks = S.mocks || [];
  const best = mocks.reduce((b, m) => Math.max(b, Math.round(m.score / m.total * 100)), 0);
  const last = mocks[mocks.length - 1];
  /* One prediction, one formula. This tile used to recompute its own linear guess,
     so the same attempt read as two different scores here and on the result screen. */
  const estOf = m => Math.round(m.est != null ? m.est : estScore(m.score / m.total));
  const held = mockSaved();
  $app.innerHTML = statbar() + `<div class="screen"><div class="page">
    <h1>محاكاة الاختبار</h1><div class="sub">جرّب جو الاختبار الحقيقي وقس مستواك</div>
    ${held ? `<button type="button" class="mock-resume" onclick="A.mockResume()">
      <span class="mr-tx"><b>لديك اختبار لم يكتمل</b>
        <span>القسم ${toAr(held.si + 1)} — باقٍ ${fmtClock(held.sections[held.si].left)} — أكمل من حيث توقفت</span></span>
      <span class="mr-go" aria-hidden="true">${CHEV_SVG}</span>
    </button>` : ""}
    <div class="mock-hero-card">
      <div class="mh-hero"><span class="mh-spot"></span>${mascot("strong", "mh-mascot")}</div>
      <div class="mh-rules">
        <div class="mh-rule">${ico("guide", 20)} قسمان كمّيان × ${toAr(S.track === "lit" ? 15 : 24)} سؤالاً — بالتوزيع الرسمي للمواضيع</div>
        <div class="mh-rule">${ico("timer", 20)} ${toAr(25)} دقيقة لكل قسم بمؤقّت مستقل</div>
        <div class="mh-rule">${ico("target", 20)} تنقّل وعلّم الأسئلة داخل القسم — ولا رجوع بعد إنهائه</div>
        <div class="mh-rule"><span class="mh-x">✕</span> بدون حاسبة وبدون مساعدات — مثل المحوسب تماماً</div>
      </div>
      <button class="btn" onclick="A.startMock()">${held ? "ابدأ محاكاة جديدة" : "ابدأ المحاكاة"}</button>
    </div>
    ${mocks.length ? `<div class="tiles">
      <div class="tile">${ico("star-gold", 26)}<div><div class="t-v">${toAr(best)}٪</div><div class="t-l">أفضل نتيجة</div></div></div>
      <div class="tile">${ico("target", 26)}<div><div class="t-v">~${toAr(estOf(last))}</div><div class="t-l">آخر تقدير (من ١٠٠)</div></div></div>
    </div>` : `<div class="card mock-first-note">أول محاكاة لك ستحدد خط البداية — لا تقلق من النتيجة، المهم أن تعرف أين أنت الآن</div>`}
  </div></div>` + bottomnav("mock");
}

A.startMock = function (replace) {
  snd("start-lesson");
  /* A held attempt is twenty minutes of somebody's exam, and mockClear() below
     takes it without a word — from a button that sits directly under a card
     saying the attempt is still waiting. Ask first, with the safe answer
     focused; the card itself is still the way back into it. */
  const held = replace ? null : mockSaved();
  if (held) {
    askConfirm("نبدأ محاكاة جديدة؟",
      `عندك محاكاة ما كملت — القسم ${toAr(held.si + 1)} وباقٍ ${fmtClock(held.sections[held.si].left)}. الجديدة تمسحها وما فيه رجعة.`,
      "لا، أرجع", "ابدأ جديدة", () => A.startMock(true));
    return;
  }
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
  if (!sections[0].items.length) { showModal("", "لا توجد أسئلة", "بنك الأسئلة غير متاح.", "حسناً"); return; }
  mockClear();                       // a new attempt replaces any held one
  MOCK = { sections, si: 0, qi: 0, timer: null };
  startMockSection();
};

/* each section runs on its own 25-minute clock, like the computerized exam */
function startMockSection(resuming) {
  if (!resuming) MOCK.qi = 0;
  renderMockQ();
  clearInterval(MOCK.timer);
  /* a deadline, so backgrounding the tab cannot buy extra exam time */
  MOCK.sections[MOCK.si].endsAt = Date.now() + MOCK.sections[MOCK.si].left * 1000;
  MOCK.timer = setInterval(mockTick, 250);
  mockSave();
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
  if (left <= 0) { toast("انتهى وقت القسم"); endMockSection(true); }
}

/* a backgrounded tab stops firing intervals; recompute the moment we return */
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    /* A lesson is practice. A phone put down mid-question used to come back to a
       question already marked wrong and a heart gone, because the clock is a deadline
       and the deadline had passed. Hold it instead — the timer pill shows it paused.
       The mock keeps its deadline: there, the clock is the point. */
    if (SES && SES.timer && !SES.locked) { SES.paused = true; stopQTimer(); }
    return;
  }
  if (MOCK && MOCK.timer) mockTick();
  if (SES && SES.paused) { SES.paused = false; startQTimer(true); }
  else if (SES && SES.timer) qTick();
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
        <button class="mk-flag ${sec.flags[MOCK.qi] ? "on" : ""}" onclick="A.mockFlag()" aria-label="علّم السؤال للمراجعة"><svg class="mk-flag-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 21V4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M6.5 4.5h11l-2.4 4.2 2.4 4.3h-11z" fill="currentColor"/></svg><span>${sec.flags[MOCK.qi] ? "معلّم" : "علّم"}</span></button>
        <button class="btn btn-ghost mk-side" onclick="A.mockGo(${MOCK.qi - 1})" ${MOCK.qi === 0 ? "disabled" : ""}>السابق</button>
        ${MOCK.qi === sec.items.length - 1
          ? `<button class="btn" onclick="A.mockEndSection()">إنهاء القسم</button>`
          : `<button class="btn" onclick="A.mockGo(${MOCK.qi + 1})">التالي</button>`}
      </div>
    </div>`;
  /* on a short phone the numbers are one row that scrolls sideways: keep the current one in view */
  const cur = document.querySelector(".qnav .qn-chip.cur");
  if (cur && cur.parentNode.scrollWidth > cur.parentNode.clientWidth) cur.scrollIntoView({ inline: "center", block: "nearest" });
}

A.mockSelect = function (i) {
  if (!MOCK) return;
  const sec = MOCK.sections[MOCK.si];
  /* dailyTick used to fire here, so opening a mock, tapping ten answers and
     quitting paid out the 50-gem chest in about fifteen seconds. The quest
     counts sealed answers now - see endMockSection. */
  sec.answers[MOCK.qi] = i;
  snd("mock-select", null, "assessment-click-option-" + (Math.min(i, 3) + 1));
  document.querySelectorAll(".choice").forEach((b, j) => b.classList.toggle("sel", j === i));
  paintRadios(i);
  /* every answer jumps — here it says «taken», as in the level test: a mock gives no verdict */
  const picked = document.querySelectorAll(".choice")[i];
  if (picked && window.gsap && !fxReduced()) {
    document.querySelectorAll(".choice").forEach(b => { if (b !== picked) gsap.to(b, { y: 0, scaleX: 1, scaleY: 1, duration: .2, ease: "power2.out", overwrite: true }); });
    fxAddJump(gsap.timeline(), picked, 0);
  }
  const chip = document.querySelectorAll(".qn-chip")[MOCK.qi];
  if (chip) chip.classList.add("done");
  mockSave();
};

A.mockGo = function (i) {
  if (!MOCK) return;
  const sec = MOCK.sections[MOCK.si];
  if (i < 0 || i >= sec.items.length) return;
  MOCK.qi = i;
  renderMockQ();
  mockSave();
};

A.mockFlag = function () {
  const sec = MOCK.sections[MOCK.si];
  sec.flags[MOCK.qi] = !sec.flags[MOCK.qi];
  snd("mock-flag", null, sec.flags[MOCK.qi] ? "toggle-on" : "toggle-off");
  renderMockQ();
  mockSave();
};

A.mockEndSection = function () {
  snd("mock-end-section");
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
    MOCK.qi = 0; mockSave();
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
    clearInterval(MOCK.timer); MOCK = null; mockClear(); go("mock");
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
  mockClear();
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
  const band = est >= 90 ? "ضمن النخبة — أعلى ٠.٥٪ من الطلاب"
    : est >= 85 ? "ضمن أفضل ٢.٥٪ من الطلاب"
      : est >= 81 ? "ضمن أفضل ٥٪ من الطلاب"
        : est >= 75 ? "أعلى من ٨٤٪ من الطلاب"
          : est >= 70 ? "فوق المتوسط"
            : est >= 65 ? "حول متوسط الطلاب"
              : "تحت المتوسط حالياً — التمرين اليومي يرفعك بسرعة";
  const mins = Math.round(secsUsed / 60);
  S.mocks = (S.mocks || []).concat([{ d: todayKey(), score, total, est }]).slice(-10);
  /* fifty minutes and forty-eight questions used to pay nothing at all, so
     two twelve-minute replay sessions out-earned the most exam-relevant
     thing in the app. Scaling with the score keeps it unfarmable. */
  gainXP(score * 6); gainGems(20 + score);
  bumpStreak(); save();
  score / total >= 0.5 ? snd("mock-pass", () => sndWin()) : snd("mock-fail", () => sndLose());

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
    <div class="ri-q">${toAr(i + 1)}. ${fracs(r.q.stem || "قارن بين القيمتين")}</div>
    ${isCmp && r.q.value1 ? `<div class="ri-row" style="color:var(--gray)">القيمة الأولى: ${fracs(r.q.value1)} — القيمة الثانية: ${fracs(r.q.value2)}</div>` : ""}
    ${ok ? `<div class="ri-row" style="color:var(--green-dk)">✓ إجابتك صحيحة: ${fracs(ch[r.picked])}</div>`
      : `<div class="ri-row" style="color:var(--red)">✕ إجابتك: ${r.picked === null ? "لم تُجب" : fracs(ch[r.picked])}</div>
         <div class="ri-row" style="color:var(--green-dk)">✓ الصحيحة: ${fracs(ch[r.q.answer])}</div>`}
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
function lcg(seed) {
  let s = seed >>> 0;
  return function () { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; };
}

/* Monday 00:00 local, and how many Mondays have passed since the epoch. The
   cohort is keyed on that number, so the board turns over once a week the way
   a real league does — which is also the honest-looking reason the names are
   different on Monday from what they were on Sunday. */
function leagueWeek(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const start = d.getTime() - ((d.getDay() + 6) % 7) * 864e5;
  return { start: start, idx: Math.round(start / 6048e5) };
}

/* A rival's score is not stored anywhere — it is rebuilt from their habits
   and the clock every time the board is drawn. That buys three things at once:
   it climbs while the app is shut, it is the same number on two devices at the
   same instant, and it never needs a server to keep it moving. */
function ghostXp(g, hoursIn) {
  const rnd = lcg(g.seed);
  const spd = g.grind > 0.88 ? 3 : g.grind > 0.5 ? 2 : 1;
  let active = 0;
  for (let d = 0; d < 7 && d <= g.quit; d++) if (!(g.off & (1 << d))) active++;
  const per = g.budget / Math.max(1, active * spd);

  let xp = g.base;
  for (let d = 0; d < 7; d++) {
    if (hoursIn <= d * 24) break;
    if (d > g.quit) break;                       /* they stopped showing up */
    for (let s = 0; s < spd; s++) {
      /* Both draws happen before either test, so the stream advances the same
         way no matter which sessions have landed yet. Skip a draw and every
         later score changes the moment the clock ticks past it. */
      const at = d * 24 + g.h0 + s * (3 + rnd() * 5);
      const chunk = Math.max(5, Math.round(per * (0.7 + rnd() * 0.6) / 5) * 5);
      if (g.off & (1 << d)) continue;            /* a day they didn't study */
      if (hoursIn <= at) continue;               /* hasn't happened yet */
      xp += chunk;
    }
  }
  return xp;
}

function leagueStandings(now) {
  now = now || Date.now();
  const ti = tierIndex();
  const tier = LEAGUE_TIERS[ti], next = LEAGUE_TIERS[ti + 1];
  const lo = tier.min, span = (next ? next.min : tier.min + 4000) - lo;
  const wk = leagueWeek(now);
  const rnd = lcg(ti * 2654435761 + wk.idx * 40503 + 999983);

  const pool = LEAGUE_NAMES.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const k = Math.floor(rnd() * (i + 1)), t = pool[i]; pool[i] = pool[k]; pool[k] = t;
  }

  const hoursIn = (now - wk.start) / 36e5;
  const list = [];
  for (let i = 0; i < LEAGUE_SIZE; i++) {
    const grind = rnd();
    /* Most of a cohort sits near the floor of its band and two or three run
       away with it. A flat draw put the median rival mid-band, which parked
       every newcomer in last place for their entire first week. */
    const base = Math.round((lo + span * Math.pow(rnd(), 3.2) * 0.62) / 5) * 5;
    let off = 0;
    for (let d = 0; d < 7; d++) if (rnd() < 0.22) off |= (1 << d);
    const g = {
      name: pool[i % pool.length],
      base: base,
      grind: grind,
      off: off,
      /* roughly one in five drifts away partway through the week */
      quit: rnd() < 0.2 ? 1 + Math.floor(rnd() * 5) : 9,
      /* the week's whole gain, kept proportional to the band so nobody climbs
         out of the tier they are supposed to be competing in */
      budget: span * (0.05 + grind * grind * 0.28),
      h0: 7 + rnd() * 9,                          /* when they tend to start */
      seed: Math.floor(rnd() * 4294967296) >>> 0
    };
    g.xp = ghostXp(g, hoursIn);
    list.push(g);
  }
  const me = ((S.user && S.user.name) || "").trim();
  /* `named` so the row can tell a real name from the fallback: appending the
     «(أنت)» marker to a row whose name IS «أنت» read as «أنت (أنت)». */
  list.push({ name: me || "أنت", named: !!me, xp: S.totalXp || 0, you: true });
  list.sort(function (a, b) { return b.xp - a.xp || (a.you ? 1 : -1); });
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

/* Last drawn score per rival, so a redraw can tell who moved and say so. */
let LB_PREV = null;
let LB_TIMER = 0;

function lbRows(entries) {
  const prev = LB_PREV;
  const now = {};
  const html = entries.map(function (e, i) {
    now[e.name] = e.xp;
    const rank = i + 1;
    const cell = rank <= 3 ? MEDAL(rank) : `<span class="lb-rank">${toAr(rank)}</span>`;
    const gain = prev && !e.you && prev[e.name] != null ? e.xp - prev[e.name] : 0;
    return `<div class="lb-row ${e.you ? "me" : ""} ${gain > 0 ? "gained" : ""}">
      ${cell}${avatarFor(e.name, e.you)}
      <span class="lb-name">${esc(e.name)}${e.you && e.named ? " <b>(أنت)</b>" : ""}</span>
      ${gain > 0 ? `<span class="lb-gain">+${toAr(gain)}</span>` : ""}
      <span class="lb-xp"><b>${toAr(e.xp)}</b><i>XP</i></span>
    </div>`;
  }).join("");
  LB_PREV = now;
  return html;
}

/* Redraw on a slow beat while the board is open. Most ticks change nothing —
   thirty people studying a couple of times a day is about three events an hour
   between them — but the one that does land, with the row lifting past its
   neighbour and a +١٥ floating off it, is worth more than any amount of copy. */
function lbTick() {
  if (view !== "league") { clearInterval(LB_TIMER); LB_TIMER = 0; return; }
  const list = document.querySelector(".lb-list");
  if (!list) { clearInterval(LB_TIMER); LB_TIMER = 0; return; }
  const entries = leagueStandings();
  list.classList.add("settled");
  list.innerHTML = lbRows(entries);
}

function renderLeague() {
  const ti = tierIndex(), tier = LEAGUE_TIERS[ti], next = LEAGUE_TIERS[ti + 1];
  LB_PREV = null;
  const entries = leagueStandings();
  const rows = lbRows(entries);
  const ladder = LEAGUE_TIERS.map((t, i) => {
    const cls = i < ti ? "done" : i === ti ? "cur" : "locked";
    return `<div class="lb-tier ${cls} lb-tier-${t.key}">
      <div class="lb-tier-badge">${rankImg(t.key, 58)}${i > ti ? `<span class="lb-lock">${LOCK_SVG}</span>` : ""}${i === ti ? `<span class="lb-tier-glow"></span>${lbShine(t.key)}` : ""}</div>
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
    prog = `<div class="lb-prog lb-prog-max">وصلت إلى أعلى مستوى — أنت من الأبطال!</div>`;
  }
  $app.innerHTML = statbar() + `<div class="screen"><div class="page lb-page">
    <div class="lb-ladder">${ladder}</div>
    <div class="lb-hero">
      <h1 class="lb-banner lbb-${tier.key}"><i class="lbb-tail l" aria-hidden="true"></i><i class="lbb-tail r" aria-hidden="true"></i><i class="lbb-fold l" aria-hidden="true"></i><i class="lbb-fold r" aria-hidden="true"></i><span class="lbb-band"><span class="lbb-tx">المستوى ${tier.name}</span><i class="lbb-sh" aria-hidden="true"></i></span></h1>
    </div>
    ${prog}
    <div class="lb-listhead">
      ${ico("guide", 18)} المتصدّرون في مستواك
    </div>
    <div class="lb-list">${rows}</div>
  </div></div>` + bottomnav("league");
  clearInterval(LB_TIMER);
  LB_TIMER = setInterval(lbTick, 22000);
}
/* Your tier's badge shines: a band of light crosses it inside its own outline
   (the PNG is its own mask), then two four-point glints twinkle where the light
   left it, the way Duolingo's league trophy glints. CSS only; still under
   reduced motion. */
function lbShine(key) {
  /* a full address: a url() carried in a custom property resolves against the
     stylesheet that uses it, so a relative one asked for css/assets/… (a 404,
     and a mask that fails to load hides the shine) — the audit, 2026-10-28 */
  return `<span class="lb-shine" style="--src:url(&quot;${new URL("assets/icons/ranks/rank-" + key + ".png", document.baseURI).href}&quot;)" aria-hidden="true"></span><i class="lb-glint" aria-hidden="true">${WST_GLINT}</i><i class="lb-glint lb-glint2" aria-hidden="true">${WST_GLINT}</i>`;
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

/* The rank-up (2026-10-26: «انميشن الranks غيره there is a league-animation.zip
   use it»): the league row from league-animation.zip, played as it ships in
   assets/league/ — the badges zoom and pan to the locked league, it rattles,
   loses its padlock, charges and bursts open, and the league's name slams in.
   It runs in its own frame (its stage is a fixed 884 × 1520 canvas) and says
   when it is ready and when its «المتابعة» is tapped. Reduced motion, a
   frame that never loads (offline before it was ever fetched), or bronze
   (nothing to promote from) get the drawn screen below instead. */
function showRankUp(tierIdx) {
  const tier = LEAGUE_TIERS[tierIdx];
  if (!tier) return;
  sfxLoad("lbUnlock"); sfxLoad("lbGold");
  if (tierIdx >= 1 && !motionReduced()) { rankUpLeague(tierIdx); return; }
  rankUpDrawn(tierIdx);
}
function rankUpLeague(tierIdx) {
  const veil = document.createElement("div");
  veil.className = "rankup-veil ru-league";
  veil.innerHTML = `<iframe class="ru-frame" title="ترقيت إلى المستوى ${esc(LEAGUE_TIERS[tierIdx].name)}"
    src="assets/league/index.html?embed&tier=${tierIdx}&xp=${S.totalXp || 0}${setHapticOn() ? "" : "&haptic=0"}"></iframe>`;
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));
  const frame = veil.querySelector("iframe");
  let started = false;
  const timers = [];
  const onMsg = e => {
    if (e.source !== frame.contentWindow || !e.data) return;
    if (e.data.league === "ready" && !started) {
      started = true;
      frame.contentWindow.postMessage({ league: "play" }, "*");
      /* its own beats (60 fps): the padlock springs at frame 146, the burst at 192, the name at 220 */
      timers.push(setTimeout(() => { sndRankUnlock(); buzz(15); }, 2417));
      timers.push(setTimeout(() => sndRankUp(), 3183));
    }
    if (e.data.league === "tap" && e.data.done) A.closeRankUp();
  };
  window.addEventListener("message", onMsg);
  veil._ruOff = () => { window.removeEventListener("message", onMsg); timers.forEach(clearTimeout); };
  timers.push(setTimeout(() => {                     // never came up: the drawn screen instead
    if (started || !veil.isConnected) return;
    veil._ruOff(); veil.remove();
    rankUpDrawn(tierIdx);
  }, 4000));
}
function rankUpDrawn(tierIdx) {
  const tier = LEAGUE_TIERS[tierIdx];
  const reduced = motionReduced();
  const veil = document.createElement("div");
  veil.className = `rankup-veil ru-${tier.key}`;
  veil.innerHTML = `
    <canvas class="ru-canvas" aria-hidden="true"></canvas>
    <div class="ru-main">
      <div class="ru-stage" aria-hidden="true"></div>
      <div class="ru-kicker">ترقّيت إلى مستوى جديد</div>
      <h1 class="ru-title">المستوى ${tier.name}</h1>
      <p class="ru-sub">واصل التدريب — كل سؤال يقرّبك من القمة</p>
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
  snd("continue");
  if (v._ruScene) v._ruScene.stop();
  if (v._ruOff) v._ruOff();
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
    const done = () => {
      if (--need) return;
      try { rive.RuntimeLoader.setWasmUrl("assets/streak/rive.wasm"); } catch (e) {}
      /* the 2.47 runtime warns about the inputs and the stateMachines list our older files are driven by; they still work */
      try { rive.Rive.suppressDeprecationWarnings = ["state-machines-param", "state-machine-inputs"]; } catch (e) {}
      resolve();
    };
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
  sndWarm();                                          // every Brilliant sound, decoded while the lesson plays
  if (streakWarmed) return;
  streakWarmed = true;
  loadStreakLibs().then(() => {
    try {
      if (rive.RuntimeLoader.awaitInstance) rive.RuntimeLoader.awaitInstance();        // compile WASM ahead of time
      else if (rive.RuntimeLoader.getInstance) rive.RuntimeLoader.getInstance(() => {});
    } catch (e) {}
  }).catch(() => { streakWarmed = false; });
  ["lcDone", "lcPerfect", "stat1", "stat2", "stat3"].forEach(sfxLoad);   // the win screen's sounds, so the first win is not silent
  ["assets/streak/rive.wasm", "assets/streak/big.riv", "assets/streak/daycheck.json", "assets/fx/lesson-complete.riv", "assets/fonts/baloo-bhaijaan-2.ttf"]
    .forEach(u => { try { fetch(u).catch(() => {}); } catch (e) {} });   // warm the HTTP cache (wasm is the big one)
}
function streakDayLabel(c) {
  const word = c === 1 ? "يوم واحد" : c === 2 ? "يومان" : c <= 10 ? toAr(c) + " أيام" : toAr(c) + " يوماً";
  return word + " من الحماس";
}
A.winContinue = function () {
  snd("continue");
  wstStop(); wvStop();
  winHeroStop(); WIN = null;
  const next = () => signGate(() => {
    if (!S.placeAsked && Object.values(S.lessons || {}).filter(p => p.stars > 0).length === 1) { renderPlaceOffer(); return; }
    A.go("path");
  });
  if (pendingStreak > 0) { const c = pendingStreak; pendingStreak = 0; showStreakCelebration(c, next); }
  else next();
};
function showStreakCelebration(count, onDone) {
  const todayIdx = new Date().getDay();
  const days = STREAK_WK.map((lbl, d) => {
    const checked = d <= todayIdx && (todayIdx - d) < count;     // today + prior streak days within this week
    const today = d === todayIdx;
    return `<div class="day"><span class="lbl">${lbl}</span><div class="dot ${checked ? "live" : ""}">${checked ? `<div class="check" data-check${today ? " data-today" : ""}></div>` : ""}${today && checked ? `<canvas class="sk-coin" id="skCoin" width="336" height="336" aria-hidden="true"></canvas>` : ""}</div></div>`;
  }).join("");
  const veil = document.createElement("div");
  veil.className = "streak-veil";
  veil.innerHTML = `<div class="streak-scene">
    <div class="sk-flame"><canvas id="skFlame" width="400" height="400"></canvas></div>
    <div class="sk-num" aria-hidden="true"><div class="skn-roll" id="sknRoll"><b>${toAr(Math.max(0, count - 1))}</b><b>${toAr(count)}</b></div></div>
    <div class="sk-sub" id="skSub">${streakDayLabel(count)}</div>
    <div class="sk-cal" id="skCal"><div class="sk-days">${days}</div></div>
    <div class="sk-foot" id="skFoot">${count === 1 ? `<div class="sk-next">ارجع بكرة وتصير سلسلتك يومين — درس واحد يكفي</div>` : ""}<button class="btn sk-btn" onclick="A.closeStreak()">متابعة</button></div>
  </div>`;
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));
  const sub = veil.querySelector("#skSub"), cal = veil.querySelector("#skCal"), foot = veil.querySelector("#skFoot");
  streakInst = { flame: null, checks: [], flameIns: null, onDone, ran: false };
  snd("streak-open", () => { sndWin && sndWin(); });
  /* whatever the runtimes do, the way out must appear: if the flame has not fired
     within a few seconds, show the copy, the tracker and the button as they are */
  /* The count used to be drawn by flame.riv's odometer artboard, whose digit
     glyphs are Latin — a «1» on the one screen every student reaches on their
     first day, in an app that reads every other number in Arabic. The roll is
     two numbers stacked in a window one number tall, sliding up by exactly one
     row: the streak the student had, then the streak they have. */
  const roll = () => {
    const r = veil.querySelector("#sknRoll"); if (!r) return;
    if (motionReduced()) { r.classList.add("go", "still"); return; }
    requestAnimationFrame(() => r.classList.add("go"));
  };
  const showAll = () => { roll(); sub.classList.add("show"); cal.classList.add("show"); foot.classList.add("show"); };
  setTimeout(() => { if (!streakInst.ran) showAll(); }, 4500);

  function tryRun() {
    if (streakInst.ran || !streakInst.flameIns) return;
    streakInst.ran = true;
    const fireI = (ins, n) => { const i = ins.find(x => x.name === n); if (i) i.fire(); };
    fireI(streakInst.flameIns, "play_trig");                          // flame ignites
    roll();                                                           // number rolls up to the streak
    /* Duolingo's order, after the flame and the number: the label slides up, then the
       tracker slides up with its grey dots, and only once it has SETTLED do the checks
       pop in one after another — a pop under a half-faded row is a pop nobody sees,
       which is what used to happen. The button comes last. */
    setTimeout(() => {
      sub.classList.add("show");
      setTimeout(() => cal.classList.add("show"), 180);
      const n = streakInst.checks.length, ti = [...veil.querySelectorAll("[data-check]")].findIndex(el => el.hasAttribute("data-today"));
      streakInst.checks.forEach((a, i) => setTimeout(() => {
        if (i === ti && skCoinFlip(veil)) return;
        a.goToAndPlay(0, true);
      }, 760 + i * 170));
      setTimeout(() => foot.classList.add("show"), 760 + Math.max(0, n - 1) * 170 + 520);
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
    const coin = veil.querySelector("#skCoin");
    if (coin && !motionReduced()) streakInst.coin = new rive.Rive({ src: "assets/fx/coin.riv", canvas: coin, artboard: "Coin", stateMachines: "coin_state_machine", autoplay: true,
      onLoad: () => {
        const ins = streakInst.coin && streakInst.coin.stateMachineInputs("coin_state_machine");
        if (!ins) return;
        const g = n => ins.find(i => i.name === n);
        if (g("color_num")) g("color_num").value = 0;
        if (g("icon_num")) g("icon_num").value = 0;
        if (g("dark_mode_bool")) g("dark_mode_bool").value = false;
        streakInst.coinIns = ins;
      } });
    fetch("assets/streak/daycheck.json").then(r => r.json()).then(data => {
      streakInst.checks = [...veil.querySelectorAll("[data-check]")].map(el => lottie.loadAnimation({
        container: el, renderer: "svg", loop: false, autoplay: false,
        animationData: JSON.parse(JSON.stringify(data)), rendererSettings: { preserveAspectRatio: "xMidYMid meet" }
      }));
    }).catch(() => {});
  }).catch(showAll);   /* runtime failed to load — the static text, days and button */
}
/* Today's day is Duolingo's calendar coin (calendar_streak_coinflip_012.riv,
   assets/fx/coin.riv): instead of the check popping in, the day is tossed like
   a coin, flips over and lands as the orange check. The days before it keep
   their checks. False when the coin is not ready, and the check plays. */
function skCoinFlip(veil) {
  const ins = streakInst.coinIns, c = veil.querySelector("#skCoin");
  const t = ins && ins.find(i => i.name === "flip_trig");
  if (!t || !c) return false;
  c.parentElement.classList.add("coin");
  t.fire();
  snd("streak-coin", () => { cvTone(660, 0, .12, "triangle", .08); cvTone(990, 0, .2, "triangle", .07, .55); cvTone(1320, 0, .3, "sine", .06, .62); });
  setTimeout(() => buzz(20), 600);
  return true;
}
A.closeStreak = function () {
  snd("continue");
  const v = document.querySelector(".streak-veil"), done = streakInst.onDone;
  try {
    streakInst.flame && streakInst.flame.cleanup();
    streakInst.coin && streakInst.coin.cleanup();
    streakInst.checks.forEach(a => a.destroy());
  } catch (e) {}
  streakInst = { flame: null, checks: [], onDone: null };
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
A.startReview = function (allOfThem) {
  const list = mistakeList();
  if (!list.length) { toast("لا توجد أخطاء للمراجعة"); return; }
  snd("start-lesson");
  /* the drill leads with what the schedule says is due; if nothing is, it takes
     the head of the list so a student who wants to practise early still can */
  const due = list.filter(x => x.due);
  const pick = allOfThem ? list : (due.length ? due : list);
  const qs = pick.slice(0, 15).map(x => shuffleChoices(x.rec.q));
  SES = { mode: "review", domKey: null, lesKey: null, key: null, title: "مراجعة الأخطاء", method: "",
    queue: qs.slice(), total: qs.length, idx: 0, done: 0, firstTry: {}, retried: {}, sel: null,
    locked: false, xp: 0, gems: 0, replay: false, xpBoost: false, hearts: 999, notime: true, left: Q_SECS, timer: null, tSpent: 0, tAnswered: 0 };
  renderSession();
};

function reviewComplete() {
  stopQTimer();
  const solved = SES.done, xpWon = SES.xp, fromWin = SES.fromWin && WIN;
  gainXP(xpWon); gainGems(SES.gems); bumpStreak(); save(); snd("practice-complete", () => sndWin());
  /* only what is due counts as waiting: a mistake just fixed is pushed out by
     SRS_GAP, and counting it again sent the student round in a loop */
  const remaining = mistakeList().filter(x => x.due).length;
  $app.innerHTML = `<div class="screen screen-full"><div class="complete win-scene" id="comp">
    ${flameHero(160)}
    <h1 class="win-title">أحسنت!</h1>
    <p class="win-sub">${remaining ? `صحّحت ${arPlural(solved, "خطأً واحداً", "خطأين", "أخطاء", "خطأً")} — باقٍ ${toAr(remaining)} للمراجعة` : "راجعت كل أخطائك — قائمتك نظيفة!"}</p>
    <div class="result-cards">
      <div class="rcard rc-gold"><div class="rc-t">الخبرة</div><div class="rc-v">${ico("lightning", 20)} <span id="cv-xp">٠</span></div></div>
      <div class="rcard rc-green"><div class="rc-t">صُحّحت</div><div class="rc-v">${ico("target", 22)} ${toAr(solved)}</div></div>
    </div>
    <div class="action-bar win-action" style="position:relative;right:auto;transform:none;max-width:340px;padding:0;background:none">
      ${fromWin ? `<button class="btn" onclick="A.winOn()">متابعة</button>`
        : remaining ? `<button class="btn" onclick="A.startReview()">واصل المراجعة</button>
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
      <div class="ri-tag" style="color:${u.s}">${esc(x.rec.domTitle)}، ${esc(x.rec.lesTitle)}</div>
      <div class="ri-q">${fracs(q.stem || "قارن بين القيمتين")}</div>
      ${isCmp && q.value1 ? `<div class="ri-row" style="color:var(--gray)">القيمة الأولى: ${fracs(q.value1)} — القيمة الثانية: ${fracs(q.value2)}</div>` : ""}
      <div class="ri-acts">
        <button class="fb-solution-toggle" onclick="A.toggleEl('rvAns${i}')">أظهر الإجابة</button>
        <button class="fb-solution-toggle" onclick="A.toggleEl('rvSol${i}')">اعرض الحل</button>
      </div>
      <div class="ri-row" id="rvAns${i}" style="display:none;color:var(--green-dk)">✓ الإجابة الصحيحة: ${fracs(ch[q.answer])}</div>
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
/* Four bars at «—» and a week with no days in it is a broken dashboard, not a
   stats page. Until the first question is answered, the page says so and points
   at the one thing worth doing. */
function statsEmpty() {
  return `<div class="card stats-empty">
    <span class="se-ico">${ico("target", 30)}</span>
    <b>لا أرقام بعد</b>
    <p>أجب عن أول سؤال، وستجد هنا دقتك في كل مجال وأسبوعك كاملاً.</p>
    <button class="btn" onclick="A.go('path')">ابدأ أول درس</button>
  </div>`;
}

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
      <div class="mc-txt"><b>مراجعة الأخطاء</b><span>${mc ? qCount(mc) + " بحاجة لمراجعة" : (r + w) ? "لا أخطاء — أحسنت!" : "ستظهر أخطاؤك هنا لتراجعها"}</span></div>
      <span class="mc-go">${mc ? "راجع ←" : "عرض ←"}</span>
    </button>`; })()}
    ${weekCard()}
    ${(r + w) ? `<div class="card"><h3>الدقة حسب المجال</h3>${domBars}</div>` : statsEmpty()}
  </div></div>` + bottomnav("stats");
}

/* dailyTick has counted every answered question by day since it was written and
   nothing has ever read it back. Seven bars, this week against last, and the
   honest sentence for what they add up to. */
function weekCard() {
  const days = S.days || {};
  const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
  const keyOf = d => d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  const back = n => { const d = new Date(midnight); d.setDate(d.getDate() - n); return d; };
  const sum = off => { let t = 0; for (let i = 0; i < 7; i++) t += days[keyOf(back(i + off))] || 0; return t; };
  const week = [];
  for (let i = 6; i >= 0; i--) { const d = back(i); week.push({ d: d, n: days[keyOf(d)] || 0 }); }
  const now = sum(0), prev = sum(7);
  if (!now && !prev) return "";
  const top = Math.max(4, ...week.map(x => x.n));
  const delta = now - prev;
  const line = !prev ? `${qCount(now)} هذا الأسبوع — بداية طيبة`
    : delta > 0 ? `${qCount(now)} هذا الأسبوع، أكثر من الأسبوع الماضي بـ${qCount(delta)}`
    : delta < 0 ? `${qCount(now)} هذا الأسبوع، أقل من الأسبوع الماضي بـ${qCount(-delta)}`
    : `${qCount(now)} هذا الأسبوع — نفس إيقاع الأسبوع الماضي`;
  return `<div class="card week-card">
    <h3>هذا الأسبوع</h3>
    <div class="wk-bars">${week.map((x, i) => `<div class="wk-col">
      <div class="wk-track"><i style="height:${Math.round(x.n / top * 100)}%;--d:${(i * .05).toFixed(2)}s"></i></div>
      <span class="wk-day${i === 6 ? " on" : ""}">${STREAK_WK[x.d.getDay()]}</span>
    </div>`).join("")}</div>
    <p class="wk-line">${line}</p>
  </div>`;
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
/* Deleting the account (App Store 5.1.1(v): an app that lets you make an
   account lets you delete it from inside the app, and easy to find): one red
   row at the foot of the settings hub, on the account page and on «بياناتك»,
   a sheet that says exactly what goes, and everything the app keeps on the
   phone removed — the save, a mock in progress, the effect switches. There is
   no server copy to delete; a Google sign-in kept no email and no token, and
   the sheet says where to remove the app from the Google account too. */
const ACCOUNT_KEYS = ["qudratState", MOCK_KEY, "qudratiFx", FX_LITE_KEY];
const DELETED_FLAG = "qudratDeleted";
A.deleteAccount = function () {
  const guest = !S.user || S.user.guest, g = !guest && S.user.google;
  askConfirm(guest ? "تحذف بياناتك؟" : "تحذف حسابك؟",
    `راح ينحذف نهائياً من هذا الجهاز: ${guest ? "" : "اسمك وملفك، "}دروسك وتقدّمك كله، الجواهر والسلسلة ومركزك في الدوري، وأي اختبار تجريبي ما كمّلته.<br><br>ما عندنا سيرفر ولا نحتفظ بأي نسخة، فما فيه رجعة إلا من نسخة احتياطية أخذتها أنت.${g ? "<br><br>ولو تبي تشيل قدراتي من حساب Google نفسه: myaccount.google.com/permissions" : ""}`,
    "لا، خلّه", guest ? "احذف بياناتي" : "احذف حسابي", () => {
      ACCOUNT_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
      try { sessionStorage.setItem(DELETED_FLAG, guest ? "data" : "account"); } catch (e) {}
      location.reload();
    });
};

/* Ask before something irreversible, in the app's own voice. The primary
   button is always the safe one — a native confirm() binds Enter to OK, which
   here was always the button that destroyed the lesson. */
/* ---------------- a backup a student can carry -------------------------------
   There is no server and there will not be one, so the honest answer to "what
   happens when I clear my browser or change my phone" is a code the student
   keeps. It is the whole save, versioned, base64 of UTF-8 so it survives being
   pasted through any chat app, with a short tag so a wrong paste is refused
   instead of half-applied. */
const BACKUP_TAG = "QUDRATI";
function b64enc(str) {
  const b = new TextEncoder().encode(str);
  let out = "";
  for (let i = 0; i < b.length; i += 0x8000) out += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(out);
}
function b64dec(s) {
  const bin = atob(s), b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(b);
}
function backupCode() {
  return BACKUP_TAG + "-" + SCHEMA + "." + b64enc(JSON.stringify({ t: BACKUP_TAG, v: SCHEMA, at: Date.now(), s: S })).replace(/=+$/, "");
}
function backupRead(code) {
  const raw = String(code || "").replace(/\s+/g, "");
  const dot = raw.indexOf(".");
  if (dot < 0 || raw.slice(0, dot).indexOf(BACKUP_TAG) !== 0) return null;
  try {
    let body = raw.slice(dot + 1);
    while (body.length % 4) body += "=";
    const o = JSON.parse(b64dec(body));
    if (!o || o.t !== BACKUP_TAG || !o.s || typeof o.s !== "object" || Array.isArray(o.s)) return null;
    return o;
  } catch (e) { return null; }
}
/* what the student is about to overwrite their progress with, in their own terms */
function backupSummary(s) {
  const lessons = Object.keys(s.lessons || {}).length;
  const stars = Object.values(s.lessons || {}).reduce((a, l) => a + (l.stars || 0), 0);
  const day = s.streak && s.streak.count || 0;
  return [
    qLessons(lessons),
    arPlural(stars, "نجمة واحدة", "نجمتان", "نجوم", "نجمة"),
    toAr(s.xp || 0) + " جوهرة",
    day ? "سلسلة " + arPlural(day, "يوم واحد", "يومان", "أيام", "يوماً") : "بلا سلسلة",
    (s.mocks || []).length ? toAr((s.mocks || []).length) + " محاكاة" : "بلا محاكاة"
  ].join("، ");
}
const qLessons = n => arPlural(n, "درس واحد", "درسان", "دروس", "درساً");

/* ---- overlays a keyboard can get into and out of --------------------------
   Every sheet in this app is a div appended to the body. They announced
   themselves to a screen reader (role=dialog, aria-modal) but nothing else was
   true: Escape did nothing, Tab walked straight out of the sheet into the page
   behind it, and when the sheet closed the focus was left on a node that had
   been removed — which drops a keyboard user back at the top of the document.

   One helper owns all of it now. It moves focus in, keeps Tab inside, closes on
   Escape unless the overlay says otherwise (the chest ceremony holds a reward:
   there is one way out of it and it is the button), and puts the focus back
   where it was. When two sheets are open — the method sheet can open the
   guidebook on top of itself — only the topmost one answers a key. */
const OVERLAY_SEL = ".ask-veil, .method-veil, .chest-veil, .streak-veil, .lesson-pop-veil, .modal-veil, .rankup-veil";
const FOCUS_SEL = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
function trapOverlay(veil, close, opts) {
  const o = opts || {};
  const was = document.activeElement;
  const box = veil.querySelector("[role=dialog]") || veil.firstElementChild;
  if (box) {
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    if (o.label && !box.getAttribute("aria-label")) box.setAttribute("aria-label", o.label);
    if (!box.hasAttribute("tabindex")) box.setAttribute("tabindex", "-1");
  }
  const stops = () => Array.from(veil.querySelectorAll(FOCUS_SEL)).filter(el => el.offsetParent !== null);
  const topmost = () => {
    const all = Array.from(document.querySelectorAll(OVERLAY_SEL));
    return !all.length || all[all.length - 1] === veil;
  };
  requestAnimationFrame(() => {
    const want = (o.focus && veil.querySelector(o.focus)) || stops()[0] || box || veil;
    try { want.focus(); } catch (e) { }
  });
  const onKey = e => {
    if (!topmost()) return;
    if (e.key === "Escape" && !o.noEsc) { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key !== "Tab") return;
    const f = stops();
    if (!f.length) { e.preventDefault(); return; }
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    else if (i < 0) { e.preventDefault(); f[0].focus(); }
  };
  document.addEventListener("keydown", onKey, true);
  return function untrap() {
    document.removeEventListener("keydown", onKey, true);
    if (was && was.isConnected && was.focus) { try { was.focus(); } catch (e) { } }
  };
}

function backupSheet(html, label) {
  const old = document.querySelector(".ask-veil"); if (old) old.remove();
  const veil = document.createElement("div");
  veil.className = "ask-veil";
  veil.innerHTML = `<div class="ask-sheet bk-sheet" role="dialog" aria-modal="true" aria-label="${label}">${html}</div>`;
  const close = () => { untrap(); veil.classList.remove("show"); setTimeout(() => veil.remove(), 240); };
  veil.onclick = e => { if (e.target === veil) close(); };
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));
  const untrap = trapOverlay(veil, close, { label: label });
  return { veil, close };
}
A.backupShow = function () {
  const code = backupCode();
  const { veil, close } = backupSheet(`<h2>نسخة من تقدّمك</h2>
    <p>احفظ هذا الرمز في ملاحظاتك أو أرسله لنفسك. يعيد تقدّمك كما هو على أي جهاز.</p>
    <textarea class="bk-code" id="bkCode" readonly rows="4" spellcheck="false" dir="ltr"></textarea>
    <div class="bk-sum">${backupSummary(S)}</div>
    <button class="btn" id="bkCopy">انسخ الرمز</button>
    <button class="ask-go" id="bkClose">إغلاق</button>`, "نسخة من تقدّمك");
  const ta = veil.querySelector("#bkCode");
  ta.value = code;
  veil.querySelector("#bkClose").onclick = close;
  veil.querySelector("#bkCopy").onclick = function () {
    const done = () => { this.textContent = "تم النسخ ✓"; this.classList.add("bk-done"); };
    /* the clipboard API is blocked on a plain http:// page and inside some webviews,
       so fall back to selecting the field and letting the student copy it */
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done, () => { ta.select(); this.textContent = "انسخ يدوياً من الحقل"; });
    } else { ta.select(); try { document.execCommand("copy"); done(); } catch (e) { this.textContent = "انسخ يدوياً من الحقل"; } }
  };
};
A.restoreShow = function () {
  const { veil, close } = backupSheet(`<h2>استعادة التقدّم</h2>
    <p>الصق الرمز الذي حفظته. سيحلّ محل تقدّمك على هذا الجهاز.</p>
    <textarea class="bk-code" id="bkIn" rows="4" spellcheck="false" dir="ltr" placeholder="QUDRATI-…"></textarea>
    <div class="bk-msg" id="bkMsg" role="status"></div>
    <button class="btn" id="bkGo">استعد</button>
    <button class="ask-go" id="bkCancel">إلغاء</button>`, "استعادة التقدّم");
  veil.querySelector("#bkCancel").onclick = close;
  veil.querySelector("#bkGo").onclick = () => {
    const msg = veil.querySelector("#bkMsg");
    const o = backupRead(veil.querySelector("#bkIn").value);
    if (!o) { msg.className = "bk-msg bad"; msg.textContent = "هذا الرمز غير صالح — تأكد أنك نسخته كاملاً"; return; }
    const s = migrate(Object.assign({}, DEFAULT_STATE, o.s));
    msg.className = "bk-msg ok";
    msg.textContent = backupSummary(s);
    close();
    askConfirm("نستعيد هذه النسخة؟", backupSummary(s) + " — تقدّمك الحالي على هذا الجهاز سيُستبدل.",
      "لا، رجوع", "نعم، استعد", () => {
        try { localStorage.setItem("qudratState", JSON.stringify(s)); }
        catch (e) { toast("تعذّر حفظ النسخة على هذا الجهاز — مساحة المتصفح ممتلئة أو الحفظ معطّل"); return; }   // it used to reload the old progress as if it had worked (the audit, 2026-10-28)
        mockClear();
        location.reload();
      });
  };
};

/* ---- reporting a question ---------------------------------------------------
   Two hundred and fifty-five original questions written without a formal review
   pass will contain mistakes, and a student who finds one and cannot say so stops
   trusting the other two hundred and fifty-four. There is no server to send it
   to, so the note is kept in the save - which means it travels inside a backup
   code - and Settings lists them with the text ready to copy. Claiming it was
   received would be a lie, so the sheet says where it actually is. */
const REPORT_WHY = [
  "الإجابة المعتمدة خطأ",
  "السؤال غير مفهوم",
  "خطأ في خطوات الحل",
  "الشكل أو الأرقام غير واضحة",
  "شيء آخر"
];
A.reportQ = function (id) {
  const rec = questionById(id);
  if (!rec) return;
  const old = (S.reports || {})[id];
  const sheet = backupSheet(`<h2>أبلغ عن السؤال</h2>
    <p>${esc(rec.lesTitle)}</p>
    <div class="rp-list">${REPORT_WHY.map((w, i) =>
      `<button type="button" class="rp-opt${old && old.w === i ? " on" : ""}" data-i="${i}">${w}</button>`).join("")}</div>
    <p class="rp-note">تُحفظ ملاحظتك على جهازك مع تقدّمك، وتجدها في الإعدادات لتنسخها وترسلها لنا.</p>
    <button class="ask-go" id="bkClose">إغلاق</button>`, "أبلغ عن السؤال");
  sheet.veil.querySelector("#bkClose").onclick = sheet.close;
  sheet.veil.querySelectorAll(".rp-opt").forEach(b => b.onclick = () => {
    S.reports = S.reports || {};
    S.reports[id] = { w: +b.dataset.i, at: todayKey(), les: rec.lesTitle };
    save(); snd("report-sent", () => sndGood()); sheet.close();
    const btn = document.querySelector(".fb-report");
    if (btn) btn.textContent = "وصلتنا ملاحظتك على هذا السؤال ✓";
    toast("سجّلنا ملاحظتك ✓");
  });
};
A.reportsShow = function () {
  const r = S.reports || {}, ids = Object.keys(r);
  if (!ids.length) return;
  const text = ids.map(id => (r[id].les || "") + " — " + (REPORT_WHY[r[id].w] || "") + " (" + id + ")").join("\n");
  const sheet = backupSheet(`<h2>ملاحظاتك على الأسئلة</h2>
    <p>انسخ النص وأرسله لنا — كل ملاحظة تصلنا تُصلِح السؤال للجميع.</p>
    <textarea class="bk-code bk-ar" id="bkCode" readonly rows="5" spellcheck="false" dir="rtl"></textarea>
    <button class="btn" id="bkCopy">انسخ الملاحظات</button>
    <button class="ask-go" id="bkClose">إغلاق</button>
    <button type="button" class="rp-clear" id="bkClear">امسح ملاحظاتي</button>`, "ملاحظاتك على الأسئلة");
  const ta = sheet.veil.querySelector("#bkCode");
  ta.value = text;
  sheet.veil.querySelector("#bkCopy").onclick = function () {
    const done = () => { this.textContent = "تم النسخ ✓"; this.classList.add("bk-done"); };
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(text).then(done, () => { ta.select(); this.textContent = "انسخ يدوياً من الحقل"; });
    else { ta.select(); try { document.execCommand("copy"); done(); } catch (e) { this.textContent = "انسخ يدوياً من الحقل"; } }
  };
  sheet.veil.querySelector("#bkClose").onclick = sheet.close;
  /* the wipe sits one tap from the copy button, so it asks first */
  sheet.veil.querySelector("#bkClear").onclick = () => askConfirm(
    "نمسح ملاحظاتك؟",
    "تُمسح من جهازك نهائياً. انسخها أولاً إن كنت تريد إرسالها لنا.",
    "لا، رجوع", "امسح", () => { S.reports = {}; save(); render(); });
};

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
  const close = () => { untrap(); veil.classList.remove("show"); setTimeout(() => veil.remove(), 240); };
  veil.onclick = e => { if (e.target === veil) close(); };
  document.body.appendChild(veil);
  requestAnimationFrame(() => veil.classList.add("show"));
  veil.querySelector("#askStay").onclick = close;
  veil.querySelector("#askGo").onclick = () => { close(); onGo(); };
  /* the safe answer takes the focus: Enter on a confirmation must not be the
     destructive one */
  const untrap = trapOverlay(veil, close, { label: title, focus: "#askStay" });
}

/* `hero` is raw HTML, not text: the slot has always been injected unescaped, and it
   now carries فهيم rather than the ⭐ every caller used to pass. */
function showModal(hero, title, bodyHtml, btnText, onclose) {
  const veil = document.createElement("div");
  veil.className = "modal-veil";
  veil.innerHTML = `<div class="modal">${hero ? `<div class="m-owl">${hero}</div>` : ""}<h2>${title}</h2><p>${bodyHtml}</p>
    <button class="btn" id="mOk">${btnText}</button></div>`;
  document.body.appendChild(veil);
  veil.querySelector("#mOk").onclick = () => { veil.remove(); if (onclose) onclose(); };
}

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

let EP = { sel: null, view: null, first: false, shown: 0, raf: 0, timer: 0, enter: false, from: "path", saved: null };

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
  EP.shown = 0; EP.saved = null;

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

    <div class="ep-foot">
      <button class="btn" id="epSave" type="button" onclick="A.saveExam()" disabled>\u062d\u0641\u0638 \u0627\u0644\u0645\u0648\u0639\u062f</button>
      <button class="ep-ghost" type="button" onclick="${first ? "A.skipExam()" : "A.backFromExam()"}">${
        first ? "\u0644\u0645 \u0623\u062d\u062c\u0632 \u0645\u0648\u0639\u062f\u0627\u064b \u0628\u0639\u062f \u2014 \u0644\u0627\u062d\u0642\u0627\u064b" : "\u0631\u062c\u0648\u0639"}</button>
    </div>
  </div></div>`;

  /* Only the first paint cascades. Leaving the class on would re-run the
     whole entrance every time a month is flipped, which would fight the
     slide and feel broken. */
  EP.enter = !motionReduced();
  epMonth(0, false);
  epCount();
  epBindSwipe();

  if (EP.enter) {
    const wrap = document.querySelector(".exam-pick");
    if (wrap) {
      wrap.classList.add("ep-enter");
      const cells = wrap.querySelectorAll(".ep-day").length;
      clearTimeout(EP.enterT);
      EP.enterT = setTimeout(() => {
        wrap.classList.remove("ep-enter");
        EP.enter = false;
      }, 300 + cells * 13 + 460);        // last cell's delay + its duration
    }
  }
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

/* The footer follows one rule: the green «تم حفظ الموعد!» shows exactly while
   the selected day is the one that was saved. A tap on the saved day keeps
   it, a tap on another day asks to save again, a tap back restores it. It
   used to be flipped on by the save and off by any tap on the calendar,
   which left the button reading «متابعة» — with the leave-handler on it —
   over an unsaved day, so the save looked lost and the next press walked
   out without saving. */
function epFootState() {
  const foot = document.getElementById("epFoot"), btn = document.getElementById("epSave");
  if (!foot || !btn) return;
  const done = !!EP.sel && EP.saved === epKey(EP.sel);
  foot.classList.toggle("done", done);
  btn.textContent = done ? "متابعة" : "حفظ الموعد";
  btn.onclick = done ? () => { EP.first ? go("path") : A.backFromExam(); } : () => A.saveExam();
}

function epCount() {
  const today = epDay0(new Date());
  const card = document.getElementById("epCount");
  const save = document.getElementById("epSave");
  if (!card) return;
  epFootState();
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
  if (n === 0) { epSetBadge(""); document.getElementById("epBadge").innerHTML = TARGET_IC; unit.textContent = "\u0627\u062e\u062a\u0628\u0627\u0631\u0643 \u0627\u0644\u064a\u0648\u0645 \u2014 \u0628\u0627\u0644\u062a\u0648\u0641\u064a\u0642"; }
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
  if (!cal || !back || !front) return;   /* the screen moved on before this frame */
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
  let cellIdx = 0;                      // grid position, pads included, for the cascade
  for (let i = 0; i < firstDay; i++) {
    const s = document.createElement("div"); s.className = "ep-day pad"; grid.appendChild(s);
    cellIdx++;
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
    if (EP.enter) b.style.setProperty("--d", cellIdx);
    cellIdx++;
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

A.examSetup = function () {
  /* The picker opens from the countdown card, the profile and settings.
     backFromExam used to go("settings") unconditionally, so picking a date
     from the path screen dumped the student in settings. Remember the origin. */
  EP.from = view || "path";
  renderExamSetup(false);
};
A.saveExam = function () {
  if (!EP.sel) return;
  const d = EP.sel;
  S.exam = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  S.examAsked = true; save(); snd("exam-saved", () => sndGood());

  /* confirm in place rather than snapping away: the count-up and the landing
     have just finished selling the date, and cutting the screen at that exact
     moment throws the payoff away */
  const n = epDiff(epDay0(new Date()), d);
  const sub = document.getElementById("epDoneSub");
  if (sub) {
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
    EP.saved = epKey(d);
    epFootState();
    return;
  }
  EP.first ? afterLogin() : A.backFromExam();
};

A.skipExam = function () { S.examAsked = true; save(); afterLogin(); };
/* "رجوع" from Settings used to call skipExam, which lands on the path — the
   one place the student was not coming back from */
A.backFromExam = function () { go(EP.from || "path"); };

/* ---------------- the first run ----------------
   Duolingo's shape, because it works on people who have not decided to stay
   yet: a welcome that asks for nothing, then one question a screen under a
   progress bar with a way back, then the fork — from the first lesson, or the
   level test. Every answer is used: the level picks the recommended start, the
   goal sets the daily quest, the name greets them. The name is asked fourth,
   not first; asking who someone is before they have seen anything was the old
   screen's mistake. */
function bankSize() {
  let n = 0;
  DOMAIN_ORDER.forEach(k => { const d = (window.QBANK || {})[k]; if (d) d.lessons.forEach(l => n += l.questions.length); });
  return n;
}
const BACK_SVG = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
function renderWelcome() {
  $app.innerHTML = `<div class="screen screen-full wl-screen">
    <div class="wl-body">
      ${welcomeHero()}
      <h1 class="wl-title">قدراتي</h1>
      <p class="wl-sub">تدرّب على القسم الكمي — درساً بعد درس</p>
      <div class="login-badges wl-badges"><span>${toAr(bankSize())} سؤال أصلي</span><span>مجاني بالكامل</span><span>بدون حساب</span></div>
    </div>
    <div class="wl-cta">
      <button class="btn" onclick="A.obStart()">ابدأ الآن</button>
    </div>
  </div>`;
  window.scrollTo(0, 0);
}
function renderLogin() { renderWelcome(); }
A.login = function () { A.obStart(); };
A.loginGuest = function () { S.user = { name: "ضيف", guest: true }; save(); afterLogin(); };

/* "إليك ما ستحصل عليه". Duolingo can afford one vague line here because
   everyone already knows what Duolingo is; nobody knows us. So this screen says
   plainly what the app is — the whole quantitative curriculum, a mock in the
   exam's own format, a habit — with the real counts, and under it the promises
   a student would otherwise have to take on faith, each of them true. */
const INTRO_VALUE = [
  { ic: "book",   c: "purple", t: () => `المنهج الكمي كامل في ${toAr(allLessons().length)} درساً`,
    s: () => `${toAr(bankSize())} سؤالاً بحلولها` },
  { ic: "target", c: "blue",   t: () => "اختبار تجريبي على نمط الاختبار الحقيقي",
    s: () => "تعرف مستواك قبل يوم الاختبار" },
  { ic: "streak", c: "gold",   t: () => "عادة يومية تمشي معك",
    s: () => "هدف يومي وسلسلة أيام" }
];
const INTRO_PROMISE = ["مجاني بالكامل", "بدون حساب ولا إيميل", "تقدّمك محفوظ في جهازك"];
/* Each answer carries فهيم's reaction to it, the way Duolingo's onboarding
   answers do ("Okay, we'll start fresh!") — the bubble that asked the question
   says it the moment the answer is picked. */
const OB_LEVELS = [
  { k: "new",   t: "جديد عليّ تماماً",          say: "تمام، نبدأ معك من الصفر!" },
  { k: "basic", t: "أعرف شوية أساسيات",        say: "حلو! نبني على اللي تعرفه." },
  { k: "some",  t: "أحل الأسئلة السهلة",        say: "ممتاز، عندك أساس طيب!" },
  { k: "mid",   t: "أحل أغلب الأسئلة المتوسطة", say: "واو، مستواك حلو!" },
  { k: "good",  t: "أحل حتى الصعبة",            say: "قوي! خلّنا نشوف وش تعرف." }
];
/* a short lesson grades about eight answers, so the goal reads in lessons.
   فهيم answers a pick with encouragement only — never what it pays (the user,
   2026-10-22: no chest or gem talk on this screen) */
const OB_GOALS = {
  5:  ["هادئ", "قرابة نص درس", "بداية حلوة! *خطوة صغيرة* كل يوم تفرق."],
  10: ["معتاد", "قرابة درس كامل", "اختيار ذكي! *درس كل يوم* ويثبت معك."],
  20: ["جدّي", "درسين كل يوم", "حماس! هذا *الجدّ* — درسين وتحس بالفرق!"]
};
const goalSay = g => OB_GOALS[g][2];
/* the bigger the goal, the bigger the answer: one note, two, three rising, a
   longer buzz, and the row's question tiles ripple, one after another, each
   with its own rising tick (glWave) */
function obGoalFx(v) {
  const i = GOALS.indexOf(+v);
  snd("ob-goal-pick", () => [523, 659, 784].slice(0, i + 1).forEach((f, k) => cvTone(f, 0, .28, "triangle", .1, k * .08)));
  buzz([[14], [14, 40, 14], [14, 40, 14, 40, 28]][i] || 12);
  glWave(v);
}
/* «كم سؤال تبي تحل يومياً؟» (2026-10-22: the user turned down the button on
   fire and the yellow behind it — «don't follow our design or fire»): every
   row draws its goal as what it is, a grid of questions, one tile each, so 20
   looks like four times 5 without a word. Picking a row runs a wave across its
   tiles, each hopping in turn on a note a step higher; the other rows go
   quiet. */
function glTiles(g) {
  return `<span class="gl-grid gl-g${g}" aria-hidden="true">${Array.from({ length: g }, (x, k) => `<i style="--k:${k}"></i>`).join("")}</span>`;
}
let glT = [];
function glWave(v) {
  glT.forEach(clearTimeout); glT = [];
  const tiles = Array.from(document.querySelectorAll(`.gl-list .ob-opt[data-v="${v}"] .gl-grid i`));
  if (!tiles.length || fxReduced()) return;
  const step = tiles.length > 10 ? 26 : 40;
  tiles.forEach((t, k) => {
    glT.push(setTimeout(() => {
      t.classList.remove("hop"); void t.offsetWidth; t.classList.add("hop");
      if (k % (tiles.length > 10 ? 2 : 1) === 0) cvTone(660 + k * 28, 0, .06, "sine", .035);
    }, 120 + k * step));
  });
}
const OB_FORK_SAY = { scratch: "نبدأ من أول درس — وأول فوز خلال *٣ دقائق*!", find: "تمام! أسئلة قليلة ونعرف مكانك بالضبط." };
/* Duolingo's onboarding has two layouts, and they mean different things. When
   the character TALKS and there is nothing to pick (the hello, the journey line,
   the lesson splash) he stands big in the middle under his bubble. When he ASKS,
   he steps to the side, small, the question in his bubble and the answers below
   it. «ask» marks the second kind; the journey line counts them. */
const OB_STEPS = ["hello", "taste", "value", "journey", "level", "goal", "start"];
const OB_ASKS = { level: 1, goal: 1, start: 1 };
let OB = null;
A.obStart = function () {
  snd("ob-continue");
  const known = !!S.user;          // a save that already has a name resumes at the questions
  OB = { steps: OB_STEPS.filter(k => !(known && (k === "hello" || k === "taste" || k === "journey")) && !(k === "value" && S.introSeen)),
    i: 0, dir: 1, pct: 0, level: S.level || null, goal: S.goal || DAILY_GOAL, name: "", start: null, taste: null };
  renderOb();
};
function obRecommend() { return OB.level === "new" || OB.level === "basic" ? "scratch" : "find"; }

/* The bubble's words appear one at a time after a beat, as Duolingo types its
   bubbles out. Word by word, never letter by letter: an Arabic letter changes
   shape as its neighbour arrives, and a half-typed word flickers. Every word is
   in the layout from the start, so the bubble does not grow while he talks.
   *…* marks the words he leans on. */
function sayHtml(text) {
  let bold = false;
  text = String(text).replace(/ —/g, "\u00a0—").replace(/(^|\s)(\*?[٠-٩]+) (?=\S)/g, "$1$2\u00a0");
  return text.split(" ").map(w => {
    /* the closing mark may sit before the punctuation: «*الوحدة ٣*!» */
    const open = w.startsWith("*");
    if (open) { bold = true; w = w.slice(1); }
    const close = /\*[!.،؟:]*$/.test(w);
    if (close) w = w.replace(/\*([!.،؟:]*)$/, "$1");
    /* a word glued to what follows it («*فهيم*» + « —») closes mid-token:
       only the part before the mark is blue */
    const mid = bold && !close ? w.indexOf("*") : -1;
    if (mid >= 0) { bold = false; return `<span class="w hl-w"><span class="hl">${esc(w.slice(0, mid))}</span>${esc(w.slice(mid + 1))}</span>`; }
    const h =`<span class="w${bold ? " hl" : ""}">${esc(w)}</span>`;
    if (close) bold = false;
    return h;
  }).join(" ");
}
var SAY_T = null, SAY_D = null;   // var: go() may run before this line is reached
/* فهيم stops typing when his screen goes: a tap on «يلا نبدأ» mid-sentence
   left six more clicks playing into the first lesson (the audit, 2026-10-28) */
function sayStop() { clearTimeout(SAY_D); clearInterval(SAY_T); }
const SAY_AT = 550, SAY_STEP = 75;   // the first word lands with the bubble; then one every 75ms
function sayPlay(delay) {
  clearTimeout(SAY_D); clearInterval(SAY_T);
  const ws = Array.from(document.querySelectorAll(".ob-say .w"));
  if (fxReduced()) { ws.forEach(w => w.classList.add("on")); return; }
  let k = 0;
  SAY_D = setTimeout(() => {
    SAY_T = setInterval(() => {
      if (k >= ws.length) { clearInterval(SAY_T); return; }
      const w = ws[k++];
      w.classList.add("on");
      snd("say-word", null, undefined, (w.classList.contains("hl") || w.classList.contains("hl-w") ? 1.16 : 1) * (.92 + Math.random() * .16));
    }, SAY_STEP);
  }, delay == null ? SAY_AT : delay);
}
const buzz = ms => { try { if (navigator.vibrate && (S.haptic === undefined ? S.sound !== false : S.haptic)) navigator.vibrate(ms); } catch (e) { } };
/* he answers the pick: the bubble says his reaction and he gives a small hop —
   Duolingo's Duo "writes down" the answer at this beat */
function obReact(text) {
  const say = document.querySelector(".ob-say");
  if (say) { say.innerHTML = sayHtml(text); sayPlay(40); }
  const duo = document.querySelector(".obs-duo");
  if (duo && window.gsap && !fxReduced()) {
    gsap.fromTo(duo, { y: 0, scaleX: 1, scaleY: 1 }, { keyframes: [
      { y: -12, scaleX: .97, scaleY: 1.04, duration: .13, ease: "power2.out" },
      { y: 0, scaleX: 1.04, scaleY: .95, duration: .12, ease: "power2.in" },
      { scaleX: 1, scaleY: 1, duration: .2, ease: "back.out(3)" }] });
  }
}
const obTop = (pose, text, more) => `<div class="obt">
    <h1 class="obt-bubble ob-say">${sayHtml(text)}</h1>
    ${mascot(pose, "obt-duo")}
    ${more || ""}
  </div>`;
const obSide = (pose, text, sub) => `<div class="obs">
    <div class="obs-say"><h1 class="obs-bubble ob-say">${sayHtml(text)}</h1>${sub ? `<p class="obs-sub">${sub}</p>` : ""}</div>
    ${mascot(pose, "obs-duo")}
  </div>`;
function obOpt(field, v, inner, i) {
  const on = String(OB[field]) === String(v);
  return `<button class="ob-opt${on ? " sel" : ""}" role="radio" aria-checked="${on}" data-v="${v}" style="--d:calc(var(--se, .25s) + ${(i * 0.07).toFixed(2)}s)" onclick="A.obPick('${field}','${v}')">${inner}</button>`;
}
const obCta = v => `<button class="btn" id="obGo" onclick="A.obNext()" ${v == null ? "disabled" : ""}>المتابعة</button>`;
const OB_GO = `<button class="btn" onclick="A.obNext()">المتابعة</button>`;
const OB_VIEW = {
  hello: () => ({ top: true, cta: OB_GO,
    html: obTop("wave", "أهلاً! أنا *فهيم* — بعلّمك القسم الكمي بحيل تختصر عليك الوقت.") }),
  journey: () => {
    const n = OB.steps.filter(k => OB_ASKS[k]).length;
    return { top: true, cta: OB_GO, html: obTop("cheer", `بس *${qCount(n)} سريعة* ونبدأ!`) };
  },
  value: () => ({ cta: OB_GO,
    html: `<div class="iv-body">
      <div class="iv-top"><h1 class="iv-bubble">وش هو قدراتي؟ إليك ما ستحصل عليه!</h1>${mascot("point", "iv-mascot pop")}</div>
      <div class="iv-rows">${INTRO_VALUE.map((r, i) => `
        <div class="iv-row iv-${r.c}" style="--d:${(0.18 + i * 0.12).toFixed(2)}s">
          <span class="iv-ic">${ico(r.ic, 26)}</span>
          <span class="iv-tx"><b>${r.t()}</b><span>${r.s()}</span></span>
        </div>`).join("")}</div>
      <div class="iv-promise">${INTRO_PROMISE.map((t, i) => `<span style="--d:${(0.6 + i * 0.1).toFixed(2)}s">${CHECK_BADGE}${t}</span>`).join("")}</div></div>` }),
  /* «جرّب»: an app nobody has heard of has to show what it gives before it asks
     for anything. One item in the exam's own comparison format, sized to look
     like long multiplication — then the swap rule (lesson 14, rule 7) collapses
     it with no arithmetic at all. Nothing here is written to the save. */
  taste: () => {
    const done = OB.taste != null;
    sfxLoad("right");
    return { cta: done ? tasteSheet(true) : `<button class="btn" id="obGo" disabled>اختر إجابة</button>`,
      html: `${obSide(done ? "cheer" : "encourage", done ? tasteSay() : "سؤال بأسلوب *القدرات* — خمّن بدون ما تحسب:")}
      <div class="ts${done ? " shown" : ""}">
        <div class="ts-cmp">
          <div class="cmp-box ts-box"><div class="cmp-t">القيمة الأولى</div><div class="cmp-v"><span class="ts-n">${toAr(done ? TASTE.b : TASTE.a)}</span><span class="ts-p">٪</span> من <span class="ts-n">${toAr(done ? TASTE.a : TASTE.b)}</span></div></div>
          <span class="ts-eq" aria-hidden="true"><i class="ts-q">؟</i><i class="ts-bar"></i><i class="ts-bar"></i></span>
          <div class="cmp-box ts-box"><div class="cmp-t">القيمة الثانية</div><div class="cmp-v">${toAr(TASTE.b)}٪ من ${toAr(TASTE.a)}</div></div>
        </div>
        <div class="ts-opts" role="radiogroup" aria-label="الإجابة">${CMP_CHOICES.map((c, i) =>
          `<button class="ob-opt ts-opt${done && i === 2 ? " ok" : done && i === OB.taste ? " dim" : ""}" data-v="${i}" style="--d:calc(var(--se, .3s) + ${(i * 0.07).toFixed(2)}s)" ${done ? "disabled" : `onclick="A.obTaste(${i})"`}>${c}</button>`).join("")}</div>
        <div class="ts-rule" aria-live="polite"><b>أ٪ من ب = ب٪ من أ</b><span>اقلب الرقمين — والقيمة نفسها بالضبط</span></div>
        <p class="ts-more">ومثلها <b>حيل كثير</b> تختصر عليك الوقت — كلها هنا</p>
      </div>` };
  },
  level: () => ({ cta: obCta(OB.level),
    html: `${obSide("encourage", "كم تعرف عن القسم الكمي؟")}
      <div class="ob-list" role="radiogroup" aria-label="مستواك">${OB_LEVELS.map((o, i) =>
        obOpt("level", o.k, `${levelIcon(i)}<b class="ob-t">${o.t}</b>`, i)).join("")}</div>` }),
  /* Duolingo's goal rows, kept plain (2026-10-21: the user found the gem boxes
     and pace bars too busy): each draws its goal as a grid of question tiles
     (glTiles), the tag as a chip, and the middle one carries «الأكثر اختياراً» (the user's
     wording, 2026-10-22). A
     bigger pick sounds and feels bigger (obGoalFx); فهيم answers with
     encouragement only (goalSay). */
  goal: () => ({ cta: obCta(OB.goal),
    html: `${obSide("encourage", "كم سؤال تبي تحل يومياً؟")}
      <div class="ob-list gl-list" role="radiogroup" aria-label="هدفك اليومي">${GOALS.map((g, i) =>
        obOpt("goal", g, `${g === DAILY_GOAL ? `<span class="gl-badge">الأكثر اختياراً</span>` : ""}
          ${glTiles(g)}
          <span class="ob-tx"><b>${qCount(g)} يومياً</b><span>${OB_GOALS[g][1]}</span></span>
          <span class="gl-tag">${OB_GOALS[g][0]}</span>`, i)).join("")}</div>
      <p class="ob-note">تقدر تغيّره من الإعدادات وقت ما تبي</p>` }),
  start: () => {
    const rec = obRecommend();
    if (!OB.start) OB.start = rec;
    const fork = (k, ic, c, t, sub, i) => {
      const on = OB.start === k;
      return `<button class="ob-fork${on ? " sel" : ""}" role="radio" aria-checked="${on}" data-v="${k}" style="--d:calc(var(--se, .3s) + ${(i * 0.1).toFixed(2)}s)" onclick="A.obPick('start','${k}')">
        ${rec === k ? `<span class="ob-rec">مقترح لك</span>` : ""}
        <span class="ob-art ob-${c}">${ico(ic, 46)}</span>
        <span class="ob-tx"><b>${t}</b><span>${sub}</span></span>
      </button>`;
    };
    return { cta: obCta(OB.start),
      html: `${obSide("cheer", "يلا نلقى أفضل مكان تبدأ منه! وتقدر تغيّره بعدين.")}
        <div class="ob-forks" role="radiogroup" aria-label="من وين تبدأ">
          ${fork("scratch", "book", "purple", "ابدأ من الصفر", "أول درس في المنهج — وأول فوز خلال ٣ دقائق", 0)}
          ${fork("find", "target", "blue", "حدّد مستواي", "أسئلة من الوحدات الأربع — نتخطّى اللي تعرفه، وين ما كان", 1)}
        </div>` };
  }
};
/* the bar is hidden while he only talks, as Duolingo's is on its intro screens */
/* a screen of the first run or the sign-in takes no tap for its first .42s,
   while it slides in: a double tap on «المتابعة» used to land the second tap
   on the next screen's button and skip it whole — the goal question, «وش هو
   قدراتي؟», the splash (the audit, 2026-10-28) */
var obLockUntil = 0;
const obLocked = () => performance.now() < obLockUntil;
function obFrame(html, cta, pct, back, cls, bar) {
  obLockUntil = performance.now() + 420;
  const from = OB ? OB.pct : 0;
  $app.innerHTML = `<div class="screen screen-full ob-screen ${cls}">
    <div class="ob-top">
      <button class="ob-back${back ? "" : " off"}" onclick="${back || ""}" aria-label="رجوع" ${back ? "" : 'tabindex="-1"'}>${BACK_SVG}</button>
      <div class="progress ob-prog${bar === false ? " off" : ""}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="خطوات البداية"><i style="width:${from}%"></i></div>
    </div>
    <div class="ob-stage${OB && OB.dir < 0 ? " rev" : ""}">${html}</div>
    <div class="ob-cta">${cta}</div>
  </div>`;
  if (OB && bar !== false) OB.pct = pct;
  requestAnimationFrame(() => requestAnimationFrame(() => { const i = document.querySelector(".ob-prog > i"); if (i) i.style.width = pct + "%"; }));
  window.scrollTo(0, 0);
  /* Duolingo holds the answers until the character has finished talking, so the
     question is read before anything can be tapped: the bubble pops at .3s, his
     words start as it lands and run one every 75ms, and the answers follow. */
  const words = document.querySelectorAll(".ob-say .w").length;
  const stage = document.querySelector(".ob-stage");
  if (stage && !fxReduced()) stage.style.setProperty("--se", (SAY_AT + words * SAY_STEP + 150) / 1000 + "s");
  sayPlay();
}
/* haptics only when something arrives, never on a tap — Duolingo's own rule:
   his hello, the journey line, the splash before the first lesson (a drum-roll) */
const OB_BUZZ = { hello: [30, 140, 70], journey: [40, 200, 90], splash: [20, 40, 20, 40, 20, 40, 90] };
function renderOb() {
  const step = OB.steps[OB.i];
  glT.forEach(clearTimeout); glT = [];
  const v = OB_VIEW[step]();
  /* the bar never fills on the last question: the student is not in yet */
  const pct = Math.round((OB.i + 1) / (OB.steps.length + 1) * 100);
  /* a run that began at hello can always step back to the welcome screen, even
     once the splash has made them a guest (it lost its arrow, the audit, 2026-10-28) */
  obFrame(v.html, v.cta, pct, OB.i > 0 || !S.user || OB.steps[0] === "hello" ? "A.obBack()" : "", "ob-" + step, !v.top);
  if (OB_BUZZ[step]) setTimeout(() => buzz(OB_BUZZ[step]), 250);
  if (step === "goal" && OB.goal != null) setTimeout(() => glWave(OB.goal), 700);
  if (step === "taste" && OB.taste != null) { document.querySelector(".ob-cta").classList.add("ts-up"); fxDrawCrest(); }
}
/* An answer to a question in the first run (the taste item) lands with the
   lesson's own jump (fxAddJump) — the same launch, hang, fall, squash and
   settle a right answer gets. Choices that are not answers (level, goal, the
   fork) do not jump: they select, as Duolingo's do (the user, 2026-10-22). */
let obJumpTl = null;
function obJump(card) {
  if (!card || !window.gsap) return;
  if (obJumpTl) obJumpTl.progress(1).kill();
  document.querySelectorAll(".ob-opt, .ob-fork").forEach(b => { if (b !== card) gsap.to(b, { y: 0, scaleX: 1, scaleY: 1, duration: .2, ease: "power2.out" }); });
  const tl = obJumpTl = gsap.timeline();
  if (fxReduced()) { tl.fromTo(card, { scale: .97 }, { scale: 1, y: FXP(-7), duration: .18, ease: "power2.out" }); return; }
  fxAddJump(tl, card, 0);
}
A.obPick = function (field, v) {
  OB[field] = field === "goal" ? +v : v;
  if (field === "goal") obGoalFx(v); else { snd("ob-pick", () => sndTap()); buzz(12); }
  document.querySelectorAll(".ob-opt, .ob-fork").forEach(b => {
    const on = b.dataset.v === String(v);
    b.classList.toggle("sel", on); b.setAttribute("aria-checked", on);
  });
  obReact(field === "level" ? OB_LEVELS.find(o => o.k === v).say : field === "goal" ? goalSay(+v) : OB_FORK_SAY[v]);
  const go = document.getElementById("obGo"); if (go) go.disabled = false;
};
const TASTE = { a: 47, b: 83 };
function ruleCount() {
  let n = 0;
  domains().forEach(d => d.lessons.forEach(l => { n += (l.rules || []).length; }));
  return n;
}
const tasteSay = () => OB.taste === 2 ? "صح! وبدون ولا عملية حسابية — هذي حيلة *التبديل*."
  : "هذي تطيّح ناس كثير! السر إنك *تقلب الرقمين* — نفس القيمة بالضبط.";
/* The answer is taken, and then the trick is shown rather than told: the two
   numbers of the first value lift, cross over each other and land swapped, the
   first value now reads exactly as the second, an «=» slams down between them
   and both jump together. Right or wrong, nobody is marked red here.
   The tap itself only selects — no jump (the user, 2026-10-26: the one
   exception to «every answer jumps»); the jump, Duolingo's own right-answer
   sound and the green sheet come with the answer, the sheet a short one that
   only takes the foot of the screen. */
const tasteSheet = still => `<div class="feedback good show has-crest ts-fb${still ? " still" : ""}" id="fb" role="status" aria-live="polite">
    <svg class="fb-crest" viewBox="0 0 380 90" preserveAspectRatio="none" aria-hidden="true">
      <path class="fb-crest-fill"></path>
      <path class="fb-crest-line" fill="none" stroke-width="4" vector-effect="non-scaling-stroke" stroke-linecap="round"></path>
    </svg><div class="fb-head"><span class="fb-ok">${CHECK_BADGE}</span> ${OB.taste === 2 ? "صح!" : "الجواب: القيمتان متساويتان"}</div>
    <button class="btn" onclick="A.obNext()">المتابعة</button>
  </div><div class="storm" id="storm" aria-hidden="true"></div>`;
A.obTaste = function (i) {
  if (!OB || OB.taste != null || !document.querySelector(".ts")) return;
  OB.taste = i;
  snd("taste-tap", () => sndTap()); buzz(12); sfxLoad("right");
  const go = document.getElementById("obGo"); if (go) go.style.visibility = "hidden";   // «اختر إجابة» read wrong for the 1.5s swap after an answer was picked (the audit, 2026-10-28)
  const opts = document.querySelectorAll(".ts-opt");
  opts.forEach(b => { b.disabled = true; b.classList.toggle("sel", +b.dataset.v === i); });
  const ns = Array.from(document.querySelectorAll(".ts-n")), boxes = document.querySelectorAll(".ts-box"),
        eq = document.querySelector(".ts-eq"), wrap = document.querySelector(".ts"), cta = document.querySelector(".ob-cta");
  const finish = () => {
    if (!wrap.isConnected) return;   // left with the back arrow mid-swap: its reaction used to land in the hello bubble (the audit, 2026-10-28)
    opts.forEach(b => { const v = +b.dataset.v; b.classList.remove("sel"); b.classList.toggle("ok", v === 2); b.classList.toggle("dim", v === i && v !== 2); });
    wrap.classList.add("shown");
    obReact(tasteSay());
    const duo = document.querySelector(".obs-duo"); if (duo) duo.src = "assets/mascot/qaddour-cheer.png";
    sfxPlay("right", 1, playCorrect); buzz(20);
    if (cta) {
      cta.classList.add("ts-up"); cta.innerHTML = tasteSheet(false); fxDrawCrest();
      /* a short phone (320×568) had the sheet and its «المتابعة» below the fold with no cue: bring it up */
      requestAnimationFrame(() => { if (cta.getBoundingClientRect().bottom > innerHeight + 2) cta.scrollIntoView({ block: "end", behavior: fxReduced() ? "auto" : "smooth" }); });
    }
    const ok = Array.from(opts).find(b => +b.dataset.v === 2);
    if (window.gsap && fxOn()) answerFx(ok, 1);
  };
  if (fxReduced() || ns.length < 2) {
    if (ns.length === 2) { ns[0].textContent = toAr(TASTE.b); ns[1].textContent = toAr(TASTE.a); }
    finish(); return;
  }
  tasteSwap(ns, boxes, eq, finish);
};
/* the swap, in the star flip's grammar (the user, 2026-10-27: «make the
   animation … better and more amazing like what you did with star flipping …
   the same level, and replace the = with better UI not this 3D»). The two
   numbers of the first value trade places on STAR_FLIP's own beats: each squats
   on its base, springs off thin, flies to the other's place — one over the top,
   one underneath, leaning as it goes — while a pale copy of it waits where it
   will land, and lands in Duolingo's squash and stretch. Then the grey «؟»
   between the values pops out and a flat «=» draws itself in, bar by bar, the
   values turn green and hop. */
function tasteSwap(ns, boxes, eq, finish) {
  /* the two numbers are not the same width in this font: hold both at the wider so «٪» and «من» never move */
  const wd = Math.max(...ns.map(n => n.getBoundingClientRect().width));
  ns.forEach(n => { n.style.width = wd.toFixed(1) + "px"; n.style.textAlign = "center"; });
  const r0 = ns.map(n => n.getBoundingClientRect());
  ns[0].textContent = toAr(TASTE.b); ns[1].textContent = toAr(TASTE.a);
  const r1 = ns.map(n => n.getBoundingClientRect());
  const T0 = 350, at = t => t / STAR_MS, io = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const fly = p => io(Math.min(1, Math.max(0, (p - 383) / (967 - 383))));
  ns.forEach((n, k) => {
    const dx = (r0[1 - k].left - r1[k].left) / fitZ(n), H = k ? -2.3 : 4, lean = k ? 11 : -11;
    /* the copy that marks where it will land */
    const g = n.cloneNode(true);
    g.className = "ts-ghost";
    g.style.left = n.offsetLeft + "px"; g.style.top = n.offsetTop + "px";
    n.parentNode.insertBefore(g, n);
    n.style.transformOrigin = "50% 100%";
    n.animate(STAR_FLIP.map(([t, dy, sx, sy, r]) => ({ offset: at(t), easing: "linear",
      transform: `translate(${(dx * (1 - fly(t))).toFixed(2)}px,${(dy * H).toFixed(2)}px) rotate(${(lean * Math.sin(Math.PI * Math.min(r, 70.2) / 70.2)).toFixed(2)}deg) scale(${sx},${sy})` })),
      { duration: STAR_MS, delay: T0, fill: "backwards" });
    g.animate(STAR_FLIP.map(([t, , , , , on, ss]) => ({ offset: at(t), easing: "linear", opacity: on * .9, transform: `scale(${ss})` })),
      { duration: STAR_MS, delay: T0 }).onfinish = () => g.remove();
  });
  const q = eq.querySelector(".ts-q"), bars = eq.querySelectorAll(".ts-bar"), T = ms => setTimeout(ms[1], T0 + ms[0]);
  T([383, () => snd("taste-swap-lift", () => cvHiss(.3, .05, 0, 1200, 3800))]);
  T([967, () => { snd("taste-swap-land", () => cvSnd.tick()); buzz(10); }]);
  T([1000, () => boxes.forEach(b => b.classList.add("same"))]);
  /* «؟» out, «=» in: each bar grows from the middle and overshoots */
  q.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.25) rotate(-8deg)", opacity: 1, offset: .35 }, { transform: "scale(0) rotate(20deg)", opacity: 0 }],
    { duration: 220, delay: T0 + 1010, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" });
  bars.forEach((bar, k) => bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1.25)", offset: .6 }, { transform: "scaleX(.94)", offset: .82 }, { transform: "scaleX(1)" }],
    { duration: 300, delay: T0 + 1150 + k * 70, easing: "cubic-bezier(.2,.8,.3,1)", fill: "both" }));
  T([1150, () => { snd("taste-equals", () => cvTone(520, 780, .07, "triangle", .07)); buzz(14); }]);
  T([1220, () => { snd("taste-equals", () => cvTone(780, 1170, .09, "triangle", .07), ""); buzz(20); }]);
  /* both values hop on the «=», on the star flip's landing */
  boxes.forEach((bx, k) => bx.animate([
      { transform: "none" }, { transform: "translateY(3px) scale(1.04,.94)", offset: .12 },
      { transform: "translateY(-14px) scale(.97,1.04)", offset: .4 }, { transform: "none", offset: .66 },
      { transform: "scale(1.03,.96)", offset: .76 }, { transform: "none" }],
    { duration: 620, delay: T0 + 1260 + k * 60, easing: "ease-out" }));
  T([1660, () => { ns.forEach(n => { n.style.width = ""; n.style.textAlign = ""; }); finish(); }]);
}
A.obNext = function () {
  if (obLocked()) return;
  const step = OB.steps[OB.i];
  if (step === "level" && !OB.level) return;
  if (step === "start") { if (OB.start) obFinish(); return; }
  if (step === "value") S.introSeen = true;
  if (step === "level") S.level = OB.level;
  if (step === "goal") S.goal = OB.goal;
  S.joined = S.joined || todayKey();
  save(); buzz(8); snd("ob-continue");
  OB.i++; OB.dir = 1; renderOb();
};

/* Signing in (2026-10-23: the user removed the name screen and asked for «a
   screen for sign in with Google or putting your name … like a real app … the
   sign in and the flow to it very nice, like Duolingo and Brilliant»). Duolingo
   asks once the first lesson is behind them, with Duo and «Don't lose your
   progress! Let's create a profile.» and two buttons; Brilliant then lays the
   ways in as big buttons under a title. So: the win screen's exits pass through
   signGate once, for whoever has no name yet (S.profileAsked), and the flow is
     wall — فهيم among Brilliant's flat shapes: «لا تضيّع تقدّمك!», what the
            first win earned (streak, XP, league), «سوّ ملفي» / «لاحقاً»;
     how  — «سوّ ملفك»: «المتابعة مع Google» and «أكمل باسمي» as Duolingo's
            white 3D buttons, and what happens to their data;
     name — Duolingo's own name step: «وش اسمك؟», one big field;
     done — their avatar (the name's first letter, a colour from the name)
            pops in among the shapes, a gold ring draws round it, a blue tick
            lands, «أهلاً يا …!», and on to where the win was going.
   Settings opens it at «how» for a guest. «لاحقاً» keeps them a guest and is
   never asked again. The name stays on the phone.

   Google gives a first name only: Google Identity Services' token client, then
   Google's userinfo for given_name, all in the browser; the email is not kept.
   It needs an OAuth client ID for this origin in GOOGLE_CLIENT_ID. Without one,
   offline, or inside the Android app (Google refuses embedded web views) its
   button says «قريباً» and does nothing. */
const GOOGLE_CLIENT_ID = "";
const siGoogleOk = () => !!GOOGLE_CLIENT_ID && navigator.onLine !== false && !window.Capacitor;
const PV_PAINT = [["green", "green-lip", "green-bg"], ["blue", "blue-dk", "blue-light"], ["purple", "purple-dk", "purple-tint"],
  ["orange", "orange-dk", "orange-bg"], ["red", "red-dk2", "red-bg"], ["gold", "gold-dk", "gold-bg"]];
function pvPaint(nm) {
  let h = 0; for (const ch of nm) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  const [c, dk, bg] = PV_PAINT[h % PV_PAINT.length];
  return `--pv:var(--${c});--pv-dk:var(--${dk});--pv-bg:var(--${bg})`;
}
/* Brilliant's flat geometry in the unit colours */
const SI_SHAPES = [
  ["blue", `<path d="M20 6 35 32H5Z" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>`],
  ["gold", `<circle cx="20" cy="20" r="14"/>`],
  ["green", `<rect x="7" y="7" width="26" height="26" rx="6" transform="rotate(14 20 20)"/>`],
  ["purple", `<path d="M15 5h10v10h10v10H25v10H15V25H5V15h10Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`],
  ["orange", `<path d="M5 29a15 15 0 0 1 30 0Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`],
  ["red", `<path d="M20 4 36 20 20 36 4 20Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`]
];
const siShapes = () => `<span class="si-shapes" aria-hidden="true">${SI_SHAPES.map(([c, d], i) =>
  `<span class="si-sh si-sh${i}" style="color:var(--${c})"><svg viewBox="0 0 40 40" fill="currentColor">${d}</svg></span>`).join("")}</span>`;
const SI_TICK = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12.5l4 4 8-9"/></svg>`;
const SI_G = `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.9-6.2C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.2-13.5-10l-7.9 6.2C6.6 42.6 14.6 48 24 48z"/></svg>`;
const SI_ME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/></svg>`;
const SI_LOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>`;
let SI = null, siT = [];
function siStop() { siT.forEach(clearTimeout); siT = []; }
function signGate(then) {
  if ((S.user && !S.user.guest) || S.profileAsked) { then(); return; }
  signOpen("wall", then);
}
function signOpen(step, then, from) {
  SI = { si: true, step, then, from: from || "win", name: "", pct: 0, dir: 1 };
  OB = SI;   // obFrame reads its slide direction from here
  renderSign();
}
A.signIn = function () { signOpen("how", () => A.go("settings"), "settings"); };
const SI_ORDER = ["wall", "how", "name", "done"];
function siGo(step) {
  SI.dir = SI_ORDER.indexOf(step) < SI_ORDER.indexOf(SI.step) ? -1 : 1;
  SI.step = step;
  renderSign();
}
A.siTo = function (step) { if (obLocked()) return; snd("signin-step", () => sndTap()); buzz(8); siGo(step); };
A.siBack = function () {
  if (SI.step === "name") { siGo("how"); return; }
  if (SI.step === "how" && SI.from !== "settings") { siGo("wall"); return; }
  A.siLater(true);
};
function renderSign() {
  siStop();
  const step = SI.step, tier = LEAGUE_TIERS[tierIndex()], st = (S.streak && S.streak.count) || 0;
  if (step === "wall") {
    obFrame(`<div class="si si-wall">
        <h1 class="obt-bubble ob-say si-say">${sayHtml("لا تضيّع تقدّمك! خلّنا نسوّي لك *ملف*.")}</h1>
        <div class="si-hero">${siShapes()}${mascot("cheer", "si-duo")}</div>
        <div class="si-earn">
          <span style="--k:0">${ico("streak", 22)}<b>${toAr(Math.max(1, st))}</b> ${Math.max(1, st) === 1 ? "يوم حماس" : "أيام حماس"}</span>
          <span style="--k:1">${ico("lightning", 22)}<b>${toAr(S.totalXp || 0)}</b> XP</span>
          <span style="--k:2">${rankImg(tier.key, 22)}<b>${tier.name}</b></span>
        </div>
      </div>`,
      `<button class="btn" onclick="A.siTo('how')">سوّ ملفي</button><button class="login-skip" onclick="A.siLater()">لاحقاً</button>`,
      0, "", "si-screen si-s-wall", false);
    setTimeout(() => buzz([20, 60, 40]), 340);
    return;
  }
  if (step === "how") {
    const g = siGoogleOk();
    obFrame(`<div class="si si-how">
        <div class="si-art">${siShapes()}<span class="si-art-av">${SI_ME}</span></div>
        <h1 class="si-title">سوّ ملفك</h1>
        <p class="si-sub">احفظ تقدّمك باسمك — مجاناً، وفي ثوانٍ.</p>
        <div class="si-ways">
          <button class="si-way si-google${g ? "" : " soon"}" onclick="A.siGoogle()" ${g ? "" : 'aria-disabled="true"'}>${SI_G}<span>المتابعة مع Google</span>${g ? "" : `<i class="si-soon">قريباً</i>`}</button>
          <button class="si-way si-named" onclick="A.siTo('name')">${SI_ME}<span>أكمل باسمي</span></button>
        </div>
        <p class="si-note">${SI_LOCK}<span>تقدّمك يبقى في جهازك — ما نحفظ إيميلك ولا نرسل بياناتك لأي مكان.</span></p>
      </div>`,
      `<button class="login-skip" onclick="A.siLater()">لاحقاً</button>`, 0, "A.siBack()", "si-screen si-s-how", false);
    if (g) siGsiLoad();
    return;
  }
  if (step === "name") {
    obFrame(`<div class="si si-name">
        <h1 class="si-title">وش اسمك؟</h1>
        <p class="si-sub">يظهر على ملفك وفي الدوري — ويبقى في جهازك بس.</p>
        <input id="siName" class="login-input si-input" type="text" maxlength="30" placeholder="الاسم" autocomplete="given-name" enterkeyhint="done"
          value="${esc(SI.name)}" oninput="A.siName(this.value)" onkeydown="if(event.key==='Enter')A.siSave()">
      </div>`,
      `<button class="btn" id="siGo" onclick="A.siSave()" ${SI.name.trim() ? "" : "disabled"}>المتابعة</button>`, 0, "A.siBack()", "si-screen si-s-name", false);
    setTimeout(() => { const n = document.getElementById("siName"); if (n) n.focus(); }, 380);
    return;
  }
  /* done: their avatar arrives among the shapes and is sealed */
  const nm = SI.name.trim();
  obFrame(`<div class="si si-done" style="${pvPaint(nm)}">
      <div class="si-art si-art-done">${siShapes()}
        <span class="si-av-wrap"><svg class="si-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" pathLength="100"/></svg>
          <span class="si-av"><span>${esc(Array.from(nm)[0] || "")}</span></span><span class="si-tick" aria-hidden="true">${SI_TICK}</span></span>
      </div>
      <h1 class="si-title si-hi">أهلاً يا ${esc(String(nm).trim().split(/\s+/)[0])}!</h1>
      <p class="si-sub">ملفك جاهز${S.user && S.user.google ? " — دخلت بحساب Google" : ""}. تقدّمك محفوظ باسمك.</p>
    </div>`,
    `<button class="btn" onclick="A.siDone()">يلا نكمل</button>`, 0, "", "si-screen si-s-done", false);
  if (fxReduced()) { document.querySelector(".si-done").classList.add("sealed"); return; }
  const at = (ms, f) => siT.push(setTimeout(f, ms));
  at(700, () => {
    const av = document.querySelector(".si-av-wrap");
    if (av) av.animate([{ transform: "scale(1)" }, { transform: "scale(1.12,.86)", offset: .25 }, { transform: "scale(.94,1.08)", offset: .55 }, { transform: "scale(1)" }], { duration: 520, easing: "ease-out" });
    const d = document.querySelector(".si-done"); if (d) d.classList.add("sealed");
    snd("signin-done", () => { cvTone(784, 0, .5, "triangle", .12); cvTone(1175, 0, .4, "sine", .06, .06); }); buzz(28);
  });
}
A.siName = function (v) {
  SI.name = String(v).replace(/[*<>]/g, "");
  const go = document.getElementById("siGo"); if (go) go.disabled = !SI.name.trim();
};
function siKeep(name, google) {
  const n = String(name || "").replace(/[*<>]/g, "").trim().slice(0, 30);
  if (!n) return false;
  SI.name = n;
  S.user = { name: n, guest: false }; if (google) S.user.google = true;
  S.profileAsked = true; S.joined = S.joined || todayKey();
  save();
  return true;
}
A.siSave = function () {
  if (!SI || SI.step !== "name" || obLocked()) return;
  if (!siKeep(SI.name)) { const n = document.getElementById("siName"); if (n) { n.classList.remove("err"); void n.offsetWidth; n.classList.add("err"); } return; }
  snd("signin-step", () => sndTap()); siGo("done");
};
A.siLater = function (back) {
  if (obLocked()) return;
  if (SI && SI.from !== "settings") { S.user = S.user || { name: "ضيف", guest: true }; S.profileAsked = true; save(); }
  if (!back) snd("signin-later", () => sndTap());
  A.siDone();
};
A.siDone = function () {
  siStop();
  const then = SI && SI.then; SI = null; OB = null;
  if (then) then(); else A.go("path");
};
/* Google: the script is fetched as «how» opens, so the tap itself opens
   Google's window (a pop-up must come straight from a tap) */
let siGsi = null;
function siGsiLoad() {
  if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
  if (!siGsi) siGsi = new Promise((ok, no) => {
    const sc = document.createElement("script");
    sc.src = "https://accounts.google.com/gsi/client"; sc.async = true;
    sc.onload = ok; sc.onerror = () => { siGsi = null; no(); };
    document.head.appendChild(sc);
  });
  return siGsi;
}
A.siGoogle = function () {
  const b = document.querySelector(".si-google");
  if (!siGoogleOk() || !(window.google && google.accounts && google.accounts.oauth2)) {
    if (b && !fxReduced()) b.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-3px)" }, { transform: "none" }], { duration: 320 });
    buzz(12);
    return;
  }
  snd("signin-step", () => sndTap());
  google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID, scope: "openid profile",
    callback: r => {
      if (!r || !r.access_token || !SI) return;
      fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: "Bearer " + r.access_token } })
        .then(x => x.json()).then(p => { if (SI && siKeep(p.given_name || p.name, true)) siGo("done"); }).catch(() => {});
    }
  }).requestAccessToken();
};
/* dev harness: the flow on any step (preview.html#signin, #signin-how, #signin-name, #signin-done) */
A.debugSignIn = function (step) {
  S.profileAsked = false;
  signOpen(step === "done" || step === "name" ? "how" : step || "wall", () => A.go("path"));
  if (step === "name") siGo("name");
  if (step === "done") { siKeep("سارة"); siGo("done"); }
};
A.obBack = function () {
  if (obLocked()) return;
  if (!OB || OB.i === 0) { OB = null; renderWelcome(); return; }
  OB.i--; OB.dir = -1;
  renderOb();
};
function obFirstLesson() {
  const first = allLessons()[0];
  OB = null;
  A.startLesson(first.dom.key, first.les.key);
}
function obFinish() {
  if (!S.user) S.user = { name: "ضيف", guest: true };
  S.placeAsked = true;
  save();
  renderObSplash(OB.start);
}
/* the splash before the first thing they play: he stands big and says what
   comes next — Duolingo's «Okay! Here's your first 2 minute lesson.» */
function renderObSplash(kind) {
  if (OB) OB.dir = 1;
  const back = OB ? "A.placeIntroBack()" : "A.go('path')";
  if (kind === "find") {
    obFrame(obTop("teach", "خلّنا نشوف وين مستواك!", `<div class="obt-chips"><span>كل الوحدات الأربع</span><span>قرابة ١٠ دقائق</span><span>بدون قلوب ولا وقت</span><span>«ما أعرف» أصدق من التخمين</span></div>`),
      `<button class="btn" onclick="A.placeBegin()">ابدأ الاختبار</button><button class="login-skip" onclick="A.placeScratch()">ابدأ من الصفر بدالها</button>`,
      100, back, "ob-splash", false);
    return;
  }
  obFrame(obTop("teach", "تمام! هذا أول درس لك — *٣ دقائق* بس."),
    `<button class="btn" onclick="A.placeScratch()">يلا نبدأ</button>`, 100, back, "ob-splash", false);
  setTimeout(() => buzz(OB_BUZZ.splash), 300);
  sndWarm(["welcome-to-leagues"]);
}
function renderPlaceIntro() { renderObSplash("find"); }
A.placeIntroBack = function () { if (!OB) { go("path"); return; } OB.dir = -1; renderOb(); };
A.placeBegin = function () { if (obLocked()) return; snd("start-lesson"); OB = null; S.placeAsked = true; save(); A.startPlacement(); };
/* entering the very first lesson has a sound no other moment uses: Brilliant's
   «welcome» opening (the user's pick, 2026-10-28, option ٤ on
   tools/brilliant-sounds/enter.html); every later lesson start plays start-lesson */
A.placeScratch = function () { if (obLocked()) return; snd("first-lesson-enter"); S.placeAsked = true; save(); obFirstLesson(); };

function afterLogin() {
  S.joined = S.joined || todayKey();
  if (!S.placeAsked && !Object.keys(S.lessons || {}).length) { A.obStart(); return; }
  save(); render();
}
/* dev harness: open the first run on one step (preview.html#ob-goal …) */
A.obReplay = function (step) {
  A.obStart();
  OB.steps = OB_STEPS.slice();
  if (step === "splash" || step === "pintro") { OB.i = OB.steps.indexOf("start"); OB.start = step === "pintro" ? "find" : "scratch"; renderObSplash(OB.start); return; }
  OB.i = Math.max(0, OB.steps.indexOf(step || "level"));
  renderOb();
};
A.introReplay = function () { A.obReplay("value"); };
A.levelReplay = function () { A.obReplay("level"); };
A.welcomeReplay = function () { OB = null; renderWelcome(); };
A.placeIntroReplay = function () { A.obReplay("pintro"); };

/* A strong student three weeks from the exam should not have to grind lesson one.
   Offered once, and never nagged: either answer is remembered.

   فهيم is not here: he talks in the first run and the level test, celebrates
   wins and stands on the mock home, and anywhere else he is decoration. */
function renderPlaceOffer() {
  $app.innerHTML = `<div class="screen screen-full tp-screen">
    <span class="po-badge pop">${ico("target", 54)}</span>
    <h1 class="login-title">تبي نتخطّى اللي تعرفه؟</h1>
    <p class="login-sub">من ٨ إلى ١٦ سؤالاً بدون قلوب ولا وقت — كل وحدة تتقنها نفتحها لك، وتبدأ من حيث تحتاج فعلاً</p>
    <div class="login-form">
      <button class="btn" onclick="A.placeSkip()">أكمل بالترتيب</button>
      <button class="login-skip" onclick="A.placeGo()">حدّد مستواي</button>
    </div>
  </div>`;
  window.scrollTo(0, 0);
}
A.placeGo = function () { S.placeAsked = true; save(); A.startPlacement(); };
A.placeSkip = function () { S.placeAsked = true; save(); render(); };

/* ---------------- keyboard (web) ----------------
   A lesson is answerable without a mouse: 1-4 picks a choice,
   Enter checks it and then advances, Esc leaves the session. */
function keyboardBlocked() {
  const t = document.activeElement;
  if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return true;
  return !!document.querySelector(
    ".modal-veil, .chest-veil, .rankup-veil, .streak-veil, .lesson-pop-veil, .method-veil.show");
}

/* A radiogroup that does not answer its arrows is a lie told to a screen
   reader. This one listener serves the lesson and the mock both, and routes
   through the click the screen already wired — so the lesson records a pick and
   the mock saves an answer, without either rule being written twice. */
document.addEventListener("keydown", e => {
  if (!/^Arrow(Up|Down|Left|Right)$/.test(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
  const group = document.querySelector(".q-area .choices[role=radiogroup]");
  if (!group || keyboardBlocked()) return;
  if (SES && SES.locked) return;
  const fb = document.getElementById("fb");
  if (fb && fb.classList.contains("show")) return;
  const opts = Array.from(group.querySelectorAll(".choice")).filter(b => !b.disabled);
  if (!opts.length) return;
  e.preventDefault();
  const at = opts.findIndex(b => b.getAttribute("aria-checked") === "true");
  const fwd = e.key === "ArrowDown" || e.key === "ArrowLeft";   // RTL: left is forward
  const to = at < 0 ? (fwd ? 0 : opts.length - 1) : (at + (fwd ? 1 : -1) + opts.length) % opts.length;
  opts[to].focus();
  opts[to].click();
});

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
    else if (SES.mode === "learn" && !SES.locked) SES.queue[SES.idx].t === "see" ? A.next() : A.check();
    else if (SES.sel !== null && !SES.locked) A.check();
    return;
  }
  /* the keypad answers the keyboard too, in either set of digits */
  const lit = SES.mode === "learn" && SES.queue[SES.idx];
  if (lit && lit.t === "type" && !answered && !SES.locked) {
    const dg = "0123456789".indexOf(e.key) >= 0 ? AR_DIGITS["0123456789".indexOf(e.key)] : AR_DIGITS.indexOf(e.key) >= 0 ? e.key : null;
    if (dg) { e.preventDefault(); A.lKey(dg); return; }
    if (e.key === "Backspace") { e.preventDefault(); A.lKey("⌫"); return; }
  }

  if (answered || SES.locked || e.key.length !== 1) return;
  const n = "١٢٣٤".indexOf(e.key) + 1 || parseInt(e.key, 10);
  if (n >= 1 && n <= 4) {
    const btn = document.querySelector(`.choice[data-ci="${n - 1}"]`);
    if (btn && !btn.disabled) { e.preventDefault(); A.pick(n - 1); }
  }
});

/* ============================================================
   SETTINGS — the fifth tab
   ------------------------------------------------------------
   The fifth tab: a hub of short pages (below). Only what the game
   actually reads is here.
   ============================================================ */
let SET_EDIT = false;

/* The settings hub (the user, 2026-10-27: «fix our settings screen it feels
   like a demo app, make it like real settings … if you want to add more tabs
   add»). The main page reads like a phone's own settings: your card on top,
   then rows with a coloured icon, each opening its own page — الحساب، التدريب،
   الصوت والحركة، بياناتك، عن قدراتي — with a back arrow. Every row still does
   something the game reads; nothing here is decoration. */
let SET_PAGE = null, SET_DIR = 0;
const SET_TITLES = { profile: "الحساب", train: "التدريب", prefs: "الصوت والحركة", data: "بياناتك", about: "عن قدراتي" };
const SET_IC = {
  user: `<circle cx="12" cy="8.5" r="3.6"/><path d="M5 19.5c1.2-3.6 3.8-5.4 7-5.4s5.8 1.8 7 5.4"/>`,
  target: `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".9" class="f"/>`,
  sound: `<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z" class="f"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>`,
  data: `<path d="M12 4v10m-4-4 4 4 4-4"/><path d="M5 15v3.5h14V15"/>`,
  info: `<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="1.1" class="f"/>`,
  cal: `<rect x="4.5" y="6" width="15" height="13.5" rx="2.5"/><path d="M4.5 10.5h15M9 4v4M15 4v4"/>`,
  gauge: `<path d="M5 16.5a7 7 0 1 1 14 0"/><path d="M12 16.5 15.5 11"/>`,
  track: `<path d="M5 18.5V12M10 18.5V8M15 18.5V10.5M20 18.5V5.5"/>`,
  buzz: `<rect x="8" y="4.5" width="8" height="15" rx="2"/><path d="M4.5 9v6M19.5 9v6"/>`,
  motion: `<path d="M4 15c2.5 0 2.5-6 5-6s2.5 6 5 6 2.5-6 5-6"/>`,
  restore: `<path d="M5.5 12a6.5 6.5 0 1 0 2-4.7"/><path d="M5 4.5v3.8h3.8"/>`,
  flag: `<path d="M6.5 20V4.5"/><path d="M6.5 5h10.5l-2.2 3.8L17 12.5H6.5" class="f"/>`,
  share: `<path d="M12 14.5V4m-4 4 4-4 4 4"/><path d="M6 12v6.5h12V12"/>`,
  phone: `<rect x="7" y="3.5" width="10" height="17" rx="2.4"/><path d="M12 8v6m-2.5-2.5L12 14l2.5-2.5"/>`,
  lock: `<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.4"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>`,
  trash: `<path d="M5 7.5h14M9.5 7.5V5h5v2.5M7 7.5l.8 12h8.4l.8-12"/>`
};
const SET_LIP = { gray: "gray-shadow", red: "red-dk2" };
const setIc = (k, c) => `<span class="set-ic" style="--ic:var(--${c});--ic-dk:var(--${SET_LIP[c] || c + "-dk"})" aria-hidden="true"><svg viewBox="0 0 24 24">${SET_IC[k]}</svg></span>`;
const setChev = () => `<span class="set-chev" aria-hidden="true">${CHEV_SVG}</span>`;
function setRow(o) {
  const tag = o.on ? "button" : "div";
  return `<${tag}${o.on ? ` type="button" onclick="${o.on}"` : ""} class="set-item${o.on ? " set-link" : ""}${o.cls ? " " + o.cls : ""}">
    ${o.ic ? setIc(o.ic, o.c || "blue") : ""}
    <span class="set-item-tx"><b>${o.t}</b>${o.s ? `<small>${o.s}</small>` : ""}</span>
    ${o.v ? `<span class="set-val">${o.v}</span>` : ""}${o.end || ""}${o.on && !o.noChev ? setChev() : ""}
  </${tag}>`;
}
const setDeleteRow = guest => setRow({ ic: "trash", c: "red", t: guest ? "حذف بياناتي" : "حذف الحساب", s: guest ? "يحذف كل تقدّمك من هذا الجهاز نهائياً" : "يحذف ملفك وكل تقدّمك نهائياً", on: "A.deleteAccount()", cls: "set-danger" });
const setToggle = (on, call, lab) => `<button type="button" class="toggle ${on ? "on" : ""}" role="switch" aria-checked="${!!on}" aria-label="${lab}" onclick="${call}"></button>`;

/* todayKey() emits an unpadded y-m-d, which fmtExamDate cannot parse. */
function fmtDayKey(k) {
  const a = String(k || "").split("-");
  return a.length === 3 ? toAr(+a[2]) + " / " + toAr(+a[1]) + " / " + toAr(+a[0]) : "";
}
function setExamVal() {
  const days = examDaysLeft();
  return days === null ? "غير محدّد" : days < 0 ? "انتهى" : days === 0 ? "اليوم"
    : days === 1 ? "غداً" : "باقٍ " + toAr(days) + (days <= 10 ? " أيام" : " يوماً");
}
const setHapticOn = () => S.haptic === undefined ? S.sound !== false : !!S.haptic;
const setCanBuzz = () => !!(navigator && navigator.vibrate);
const setVersion = () => {
  const s = document.querySelector('script[src*="js/app.js"]'), m = s && /[?&]v=(\d+)/.exec(s.getAttribute("src"));
  return m ? toAr(m[1]) : "";
};
function setAvatar(name, cls) {
  const nm = name || "قدراتي";
  return `<span class="set-av${cls ? " " + cls : ""}" style="${pvPaint(nm)}" aria-hidden="true"><span>${esc((name || "").trim().charAt(0) || "ق")}</span></span>`;
}

function setMain(guest, name) {
  const done = Object.values(S.lessons || {}).filter(l => l && l.stars > 0).length;
  const tier = LEAGUE_TIERS[tierIndex()];
  return `
    <h1>الإعدادات</h1>
    <button type="button" class="set-me" onclick="A.setPage('profile')">
      ${setAvatar(name)}
      <span class="set-me-tx">
        <b>${guest ? "ضيف" : esc(name)}</b>
        <small>${guest ? "سوّ ملفك واحفظ تقدّمك باسمك" : (S.joined ? "بدأ معنا " + fmtDayKey(S.joined) : "عضو جديد")}</small>
        <span class="set-me-stats">
          <i class="sm-fire">${toAr((S.streak && S.streak.count) || 0)} يوم</i>
          <i class="sm-xp">${toAr(S.totalXp || 0)} XP</i>
          <i class="sm-tier">${rankImg(tier.key, 16)}${tier.name}</i>
        </span>
      </span>
      ${setChev()}
    </button>

    <div class="set-lab">التدريب</div>
    <div class="set-list">
      ${setRow({ ic: "target", c: "green", t: "التدريب", s: `${qCount(dailyGoal())} يومياً — ${S.track === "lit" ? "أدبي / نظري" : "علمي"}`, on: "A.setPage('train')" })}
      ${setRow({ ic: "cal", c: "blue", t: "موعد الاختبار", v: setExamVal(), on: "A.examSetup()" })}
      ${setRow({ ic: "gauge", c: "orange", t: "تحديد المستوى", v: S.placed ? fmtDayKey(S.placed) : "لم يُجرَ", on: "A.placeAgain()" })}
    </div>

    <div class="set-lab">التطبيق</div>
    <div class="set-list">
      ${setRow({ ic: "sound", c: "purple", t: "الصوت والحركة", v: S.sound ? "الأصوات تعمل" : "صامت", on: "A.setPage('prefs')" })}
      ${setRow({ ic: "data", c: "gold", t: "بياناتك", s: `${toAr(done)} درس مكتمل — محفوظ على جهازك`, on: "A.setPage('data')" })}
      ${window.__qInstall ? setRow({ ic: "phone", c: "green", t: "ثبّت التطبيق", v: "يعمل بلا اتصال", on: "A.installApp()" }) : ""}
    </div>

    <div class="set-lab">قدراتي</div>
    <div class="set-list">
      ${setRow({ ic: "share", c: "blue", t: "شارك قدراتي مع صاحبك", on: "A.shareApp()" })}
      ${setRow({ ic: "info", c: "gray", t: "عن قدراتي", v: setVersion() ? "الإصدار " + setVersion() : "", on: "A.setPage('about')" })}
    </div>

    <div class="set-list">${setDeleteRow(guest)}</div>
    <p class="set-foot">قدراتي أداة تدريب مستقلة، غير تابعة لهيئة تقويم التعليم والتدريب (قياس)</p>`;
}

function setProfile(guest, name) {
  const answered = Object.values(S.qstats || {}).reduce((n, q) => n + (q.r || 0) + (q.w || 0), 0);
  const done = Object.values(S.lessons || {}).filter(l => l && l.stars > 0).length;
  const tier = LEAGUE_TIERS[tierIndex()];
  const stat = (v, l, c) => `<div class="set-stat" style="--st:var(--${c})"><b>${v}</b><small>${l}</small></div>`;
  return `
    <div class="set-hero">
      ${setAvatar(name, "big")}
      ${SET_EDIT ? `
      <div class="set-me-edit">
        <input id="setName" class="login-input" type="text" maxlength="30" placeholder="وش اسمك؟" autocomplete="off" value="${esc(name)}"
          onkeydown="if(event.key==='Enter')A.setSaveName();if(event.key==='Escape')A.setEditName(false)">
        <div class="set-me-btns">
          <button type="button" class="btn" onclick="A.setSaveName()">حفظ</button>
          <button type="button" class="btn btn-ghost" onclick="A.setEditName(false)">إلغاء</button>
        </div>
      </div>` : `
      <b class="set-hero-name">${guest ? "ضيف" : esc(name)}</b>
      <small class="set-hero-sub">${guest ? "تقدّمك محفوظ على جهازك، بدون اسم" : (S.joined ? "بدأ معنا " + fmtDayKey(S.joined) : "عضو جديد")}</small>
      <button type="button" class="btn ${guest ? "" : "btn-ghost "}set-hero-btn" onclick="${guest ? "A.signIn()" : "A.setEditName(true)"}">${guest ? "سوّ ملفك" : "عدّل اسمك"}</button>`}
    </div>
    <div class="set-stats">
      ${stat(toAr((S.streak && S.streak.count) || 0), "أيام متتالية", "orange")}
      ${stat(toAr(S.totalXp || 0), "XP", "gold")}
      ${stat(toAr(done), "دروس مكتملة", "green")}
      ${stat(toAr(answered), "سؤال حلّيته", "blue")}
    </div>
    <div class="set-list">
      ${setRow({ ic: "track", c: "purple", t: "الدوري", v: tier.name, end: rankImg(tier.key, 26) })}
      ${!guest ? setRow({ ic: "lock", c: "gray", t: S.user && S.user.google ? "مربوط بحساب Google" : "حساب باسمك", s: "ما نحفظ إيميلك ولا نرسل بياناتك لأي مكان" }) : ""}
    </div>
    <div class="set-list">${setDeleteRow(guest)}</div>`;
}

function setTrain() {
  const goal = dailyGoal();
  const tag = { 5: "هادئ", 10: "معتاد", 20: "جدّي" };
  return `
    <div class="set-lab">هدفك اليومي</div>
    <div class="set-goals" role="radiogroup" aria-label="الهدف اليومي">
      ${GOALS.map(g => `<button type="button" class="set-goal${goal === g ? " on" : ""}" role="radio" aria-checked="${goal === g}" onclick="A.setGoal(${g})">
        <span class="set-goal-tx"><b>${qCount(g)} يومياً</b><small>${tag[g] || ""} — صندوق ${toAr(Math.round(CHEST_GEMS * g / DAILY_GOAL))} جوهرة</small></span>
        ${glTiles(g)}
      </button>`).join("")}
    </div>
    <div class="set-lab">المسار</div>
    <div class="set-tracks" role="radiogroup" aria-label="المسار">
      ${[["sci", "علمي", "لطلاب المسار العلمي"], ["lit", "أدبي / نظري", "لطلاب المسار النظري"]].map(([k, l, s]) => `
        <button type="button" class="set-track${S.track === k ? " on" : ""}" role="radio" aria-checked="${S.track === k}" onclick="A.setTrackM('${k}')"><b>${l}</b><small>${s}</small></button>`).join("")}
    </div>
    <div class="set-list">
      ${setRow({ ic: "cal", c: "blue", t: "موعد الاختبار", v: setExamVal(), on: "A.examSetup()" })}
      ${setRow({ ic: "gauge", c: "orange", t: "تحديد المستوى", s: "من ٨ إلى ١٦ سؤالاً — يفتح لك ما تتقنه", v: S.placed ? fmtDayKey(S.placed) : "", on: "A.placeAgain()" })}
    </div>`;
}

function setPrefs() {
  return `
    <div class="set-list">
      ${setRow({ ic: "sound", c: "purple", t: "الأصوات", s: "صوت الإجابة الصحيحة والمؤثرات", end: setToggle(S.sound, "A.setSound(this)", "الأصوات") })}
      ${setCanBuzz() ? setRow({ ic: "buzz", c: "blue", t: "الاهتزاز", s: "نبضة خفيفة مع كل إجابة", end: setToggle(setHapticOn(), "A.setHaptic(this)", "الاهتزاز") }) : ""}
      ${setRow({ ic: "motion", c: "green", t: "الحركات", s: "القفزات والاحتفالات", end: setToggle(!motionReduced(), "A.setMotion(this)", "الحركات") })}
    </div>
    ${osPrefersReduce() && !motionReduced()
      ? `<p class="set-hint">نظامك يطلب تقليل الحركة، واللعبة ما زالت بحركتها الكاملة — أوقفها من هنا إن أردت.</p>` : ""}`;
}

function setData() {
  const reps = Object.keys(S.reports || {}).length;
  return `
    <div class="set-note">${setIc("lock", "green")}<span><b>تقدّمك على هذا الجهاز</b><small>ما فيه سيرفر ولا حساب — لو بتغيّر جوالك، خذ نسخة احتياطية قبل.</small></span></div>
    <div class="set-list">
      ${setRow({ ic: "data", c: "gold", t: "نسخة احتياطية", s: "رمز واحد فيه كل تقدّمك", on: "A.backupShow()" })}
      ${setRow({ ic: "restore", c: "blue", t: "استعادة من رمز", s: "رجّع تقدّمك على جهاز جديد", on: "A.restoreShow()" })}
      ${reps ? setRow({ ic: "flag", c: "orange", t: "ملاحظاتك على الأسئلة", v: toAr(reps), on: "A.reportsShow()" }) : ""}
    </div>
    <div class="set-lab set-lab-danger">منطقة الخطر</div>
    <div class="set-list">${setDeleteRow(!S.user || S.user.guest)}</div>`;
}

function setAbout() {
  const v = setVersion();
  return `
    <div class="set-app">
      <img src="assets/app-icon/icon-192.png" width="84" height="84" alt="" onerror="this.style.display='none'">
      <b>قدراتي</b>
      <small>${v ? "الإصدار " + v : ""}</small>
    </div>
    <div class="set-list">
      ${setRow({ ic: "lock", c: "green", t: "خصوصيتك", s: "تقدّمك محفوظ في جهازك فقط. لا إعلانات، لا تتبّع، ولا نطلب إيميلك." })}
      ${setRow({ ic: "share", c: "blue", t: "شارك قدراتي مع صاحبك", on: "A.shareApp()" })}
    </div>
    <p class="set-foot">قدراتي أداة تدريب مستقلة، غير تابعة لهيئة تقويم التعليم والتدريب (قياس). كل الأسئلة مؤلَّفة للتدريب وليست من اختبارات حقيقية.</p>`;
}

function renderSettings() {
  const guest = !S.user || S.user.guest;
  const name = guest ? "" : ((S.user && S.user.name) || "");
  if (SET_PAGE && !SET_TITLES[SET_PAGE]) SET_PAGE = null;
  const body = !SET_PAGE ? setMain(guest, name)
    : SET_PAGE === "profile" ? setProfile(guest, name)
    : SET_PAGE === "train" ? setTrain()
    : SET_PAGE === "prefs" ? setPrefs()
    : SET_PAGE === "data" ? setData() : setAbout();
  const head = SET_PAGE ? `<div class="set-head"><button type="button" class="set-back" onclick="A.setPage(null)" aria-label="رجوع">${BACK_SVG}</button><h1>${SET_TITLES[SET_PAGE]}</h1></div>` : "";
  $app.innerHTML = statbar() + `<div class="screen"><div class="page set-page${SET_DIR ? (SET_DIR > 0 ? " set-in-fwd" : " set-in-back") : ""}">${head}${body}</div></div>` + bottomnav("settings");
  SET_DIR = 0;
  if (SET_EDIT) { const i = document.getElementById("setName"); if (i) { i.focus(); i.select(); } }
}
A.setPage = function (p) {
  SET_DIR = p ? 1 : -1; SET_PAGE = p || null; SET_EDIT = false;
  render();
  const sc = document.querySelector(".screen"); if (sc) sc.scrollTop = 0;
};

/* Re-running it can only place lessons the student has not already cleared — it
   never takes a star away — so the confirmation says exactly that. */
A.placeAgain = function () {
  askConfirm("نحدّد مستواك؟", "من ٨ إلى ١٦ سؤالاً بدون قلوب ولا وقت. ما أتقنته يُفتح لك، ولا يتغيّر شيء مما أنجزته.",
    "لا، رجوع", "ابدأ", () => A.startPlacement());
};

A.setEditName = function (on) { SET_EDIT = !!on; render(); };
A.setSaveName = function () {
  const inp = document.getElementById("setName");
  const name = (inp.value || "").replace(/[*<>]/g, "").trim();
  if (!name) { inp.classList.remove("err"); void inp.offsetWidth; inp.classList.add("err"); inp.focus(); return; }
  S.user = Object.assign({}, S.user, { name: name.slice(0, 30), guest: false });
  SET_EDIT = false; save(); snd("settings-name-saved", () => sndGood()); toast("تم حفظ اسمك ✓");
  render();
};
/* The chest scales with the goal, so the confirmation says what changed rather
   than letting a student discover a smaller chest on their own. */
A.setGoal = function (g) {
  if (GOALS.indexOf(g) < 0 || S.goal === g) return;
  S.goal = g; save(); snd("settings-segment", () => sndTap()); buzz(8);
  render();
  toast(`${qCount(g)} يومياً، صندوق ${toAr(chestGems())} جوهرة`);
};
A.setTrackM = function (t) {
  if (S.track === t) return;
  S.track = t; save(); snd("settings-segment", () => sndTap()); buzz(8);
  render();
};
A.setSound = function (btn) {
  if (S.haptic === undefined) S.haptic = setHapticOn();   // pinned first: turning sounds off silently stopped the vibration while its switch still read on (the audit, 2026-10-28)
  if (S.sound) snd("settings-toggle", null, "toggle-off");
  S.sound = !S.sound; save();
  btn.classList.toggle("on", S.sound); btn.setAttribute("aria-checked", S.sound);
  if (S.sound) snd("settings-toggle", () => sndTap(), "toggle-on");
};
A.setHaptic = function (btn) {
  S.haptic = !setHapticOn(); save();
  btn.classList.toggle("on", S.haptic); btn.setAttribute("aria-checked", S.haptic);
  if (S.haptic) buzz(20);
};
A.setMotion = function (btn) {
  S.motion = motionReduced() ? "full" : "reduced";
  motionApply(); save(); snd("settings-toggle", null, motionReduced() ? "toggle-off" : "toggle-on");
  btn.classList.toggle("on", !motionReduced()); btn.setAttribute("aria-checked", !motionReduced());
};
/* the phone's own share sheet, or the link copied where there is none */
A.shareApp = function () {
  const data = { title: "قدراتي", text: "تدرّب على القسم الكمي في القدرات — درس بعد درس، مجاناً:", url: "https://qudrati.xyz/" };
  try {
    if (navigator.share) { navigator.share(data).catch(() => {}); return; }
  } catch (e) {}
  const done = () => toast("نسخت الرابط ✓");
  try { navigator.clipboard.writeText(data.url).then(done, () => toast("qudrati.xyz")); } catch (e) { toast("qudrati.xyz"); }
};

/* ---------------- installing, and losing the network ----------------
   Everything this app needs is a static file and progress lives in
   localStorage, so offline costs a student almost nothing — but a screen that
   says only "no connection" makes it feel as though everything stopped. Say
   what still works instead, and say it once. */
function netBar() {
  const el = document.querySelector(".net-bar");
  if (navigator.onLine) {
    if (el) { el.classList.remove("show"); setTimeout(() => el.remove(), 320); }
    return;
  }
  if (el) return;
  const bar = document.createElement("div");
  bar.className = "net-bar"; bar.setAttribute("role", "status");
  bar.innerHTML = `<b>أنت بلا اتصال</b><span>التمرين يكمل معك، وتقدّمك محفوظ على جهازك</span>`;
  document.body.appendChild(bar);
  requestAnimationFrame(() => bar.classList.add("show"));
}
addEventListener("online", netBar);
addEventListener("offline", netBar);
addEventListener("qinstall", () => { if (view === "settings") render(); });

A.installApp = function () {
  const p = window.__qInstall;
  if (!p) return;
  window.__qInstall = null;
  try {
    p.prompt();
    if (p.userChoice && p.userChoice.then)
      p.userChoice.then(r => { if (r && r.outcome === "accepted") toast("تمّ التثبيت ✓"); render(); }, () => render());
    else render();
  } catch (e) { render(); }
};

/* ---------------- boot ---------------- */
function boot() {
  initCorrectVoice(); // preload the correct-answer clip so the first play is instant
  if (!S.user) renderWelcome();
  else afterLogin();
  let gone = null;
  try { gone = sessionStorage.getItem(DELETED_FLAG); sessionStorage.removeItem(DELETED_FLAG); } catch (e) {}
  if (gone) toast(gone === "account" ? "انحذف حسابك وكل بياناتك" : "انحذفت كل بياناتك");
}
/* The dev harnesses drive the app through A.debug* and A.fxDemo. On the live
   page they are a console cheat menu — free gems, a forced rank-up — so they
   only exist where development happens. */
const DEV = /(^|\/)(preview|mobile|chest-animation|chest-animation-tiers|chest-animation-clashroyale|mascot-lab|exam-date-picker|quiz-two-bolts)\.html$/.test(location.pathname)
  || /[?&]dev=1(&|$)/.test(location.search);
if (!DEV) for (const k of Object.keys(A)) if (k.indexOf("debug") === 0 || k === "fxDemo") delete A[k];

/* The worker caches the shell so a lesson survives a tunnel. It is registered
   only from the app's own page, only where a worker is allowed at all, and never
   on a dev harness — those exist to show the file on disk right now. */
if ("serviceWorker" in navigator && !DEV
    && (location.protocol === "https:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname))
    && /(^|\/)(index\.html)?$/.test(location.pathname)) {
  /* not on load alone: one slow font request keeps that event waiting, and the
     worker is the thing a student on a bad connection needs most */
  let swDone = false;
  const swGo = () => {
    if (swDone) return; swDone = true;
    try { navigator.serviceWorker.register("sw.js"); } catch (e) { }
  };
  if (document.readyState === "complete") swGo();
  else { addEventListener("load", swGo); setTimeout(swGo, 4000); }
}

/* The phone's back button (the audit, 2026-10-28: the app kept no history,
   so back left the site — or closed the installed app — even mid-lesson, and
   the lesson was lost). One entry is kept above the page; back spends it, the
   app takes one step back itself and keeps a new one. The step is what Escape
   already does, then what is on screen: an overlay closes (a held one, the
   chest's reward, stays), a question asks «تبي توقف الدرس؟», a back arrow or a
   ✕ is pressed, a celebration or a running mock stays put, another tab goes
   to the path. Only the path with nothing open lets the phone leave. The
   entry is kept after a tap, so the browser never treats it as one the page
   added on its own. Off on the dev harnesses, which steer by the hash. */
var BACK_ARMED = false;
function backArm() {
  if (BACK_ARMED) return;
  try { history.pushState({ qb: 1 }, ""); BACK_ARMED = true; } catch (e) {}
}
function backStep() {
  const ov = Array.from(document.querySelectorAll(OVERLAY_SEL));
  if (ov.length) { ov[ov.length - 1].dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); return true; }
  if (SES && document.querySelector(".q-area")) { A.quitSession(); return true; }
  if (MOCK && document.querySelector(".qnav")) return true;                 // a timed exam: back does not walk out of it
  if (document.getElementById("comp")) return true;                         // a win, a result: its own button moves on
  const b = Array.from(document.querySelectorAll(".ob-back:not(.off), .set-back, .rv-back, .x-btn")).find(x => x.offsetParent !== null);
  if (b) { b.click(); return true; }
  if (!SES && !OB && view !== "path") { go("path"); return true; }
  return false;
}
if (!DEV || /[?&]backtest=1(&|$)/.test(location.search)) {
  addEventListener("popstate", () => {
    if (!BACK_ARMED) return;
    BACK_ARMED = false;
    let stay = false;
    try { stay = backStep(); } catch (e) { stay = true; }
    if (stay) backArm(); else history.back();
  });
  addEventListener("pointerdown", backArm, { capture: true, passive: true });
  addEventListener("keydown", backArm, { capture: true, passive: true });
}

/* ---------------- no step scrolls ----------------
   The user, 2026-10-29: «no scrolling at all, I don't want any screen to have
   me able to scroll it». Every step — the first run, a question, a teaching
   card, a win, a result — fits the phone it is on; the tab pages (the path, the
   league, stats, settings) are lists and keep scrolling. A step taller than the
   phone has its body zoomed down until it fits (never under FIT_MIN): a
   question's body inside its frame, anything else as a page. The fit is made
   before the first paint of a screen; a change while it is up (an answer's
   sheet, a hint card, a late font, a turn of the phone) glides to the new size.
   Code that turns a measured distance into a transform inside a zoomed body
   divides it by fitZ(el). */
const FIT_MIN = .6;
let fitScr = null, fitRO = null;
function fitZ(el) {
  let z = 1;
  for (let n = el; n && n !== document.body; n = n.parentElement) { const v = parseFloat(n.style.zoom); if (v) z *= v; }
  return z;
}
function fitTarget(scr) {
  const qa = scr.querySelector(".q-area");
  if (qa) {
    return { els: Array.from(qa.children).filter(e => getComputedStyle(e).position !== "absolute" && getComputedStyle(e).position !== "fixed"),
      over: () => qa.scrollHeight - qa.clientHeight };
  }
  const body = scr.querySelector(".ob-stage, .wl-body, .teach-body, .complete, .exam-pick") || scr;
  return { els: [body], page: true, over: () => document.scrollingElement.scrollHeight - innerHeight };
}
/* measure the screen as it will stand: an entrance still sliding up, a card
   mid-jump or a sheet still rising would count as height it does not have.
   Every finite animation in it is seeked to its end and every transform a
   script set (GSAP's jumps) is lifted for the measurement, and both are put
   back in the same task, so nothing paints, finishes or fires in between. */
function fitSettled(scr, f) {
  const all = scr.getAnimations ? scr.getAnimations({ subtree: true }) : [];
  const isTr = a => window.CSSTransition && a instanceof CSSTransition;
  /* a running transition is never touched: it is short, and seeking or holding it off would break it */
  const busy = new Set(all.filter(isTr).map(a => a.effect && a.effect.target));
  const as = all.filter(a => !isTr(a) && a.id !== "fit" && a.currentTime !== null && a.effect && isFinite(a.effect.getComputedTiming().endTime));
  const was = as.map(a => a.currentTime);
  as.forEach(a => { try { a.currentTime = a.effect.getComputedTiming().endTime; } catch (e) {} });
  /* a transform transition is held off while the transform comes and goes, or the lift itself would start one */
  const tf = Array.from(scr.querySelectorAll('[style*="transform"], [style*="translate"], [style*="scale"]')).filter(e => !busy.has(e)).map(e => {
    const cs = getComputedStyle(e), hold = /all|transform|translate|scale/.test(cs.transitionProperty) && parseFloat(cs.transitionDuration) > 0;
    return [e, e.style.transform, e.style.translate, e.style.scale, hold ? e.style.transition : null];
  });
  tf.forEach(([e, , , , tn]) => { if (tn !== null) e.style.transition = "none"; e.style.transform = e.style.translate = e.style.scale = ""; });
  try { return f(); } finally {
    tf.forEach(([e, t, tr, sc]) => { e.style.transform = t; e.style.translate = tr; e.style.scale = sc; });
    if (tf.some(x => x[4] !== null)) { void scr.offsetWidth; tf.forEach(([e, , , , tn]) => { if (tn !== null) e.style.transition = tn; }); }
    as.forEach((a, i) => { try { if (a.playState !== "idle") a.currentTime = was[i]; } catch (e) {} });
  }
}
function fitNow(glide) {
  const scr = $app.querySelector(":scope > .screen");
  if (!scr || $app.querySelector(":scope > .bottomnav") || scr.querySelector(".wl-in:not(.wl-landed)") || scr.matches(".wl-in:not(.wl-landed)")) return;
  fitSettled(scr, () => { fitScreen(scr, glide); fitSheet(scr); });
}
/* an answer's sheet shows its whole solution, never a box to scroll: a long one is zoomed
   down until the sheet leaves the lesson's top bar in sight */
function fitSheet(scr) {
  const fb = scr.querySelector(".feedback.show"), sol = fb && fb.querySelector(".fb-solution");
  if (!sol || getComputedStyle(sol).display === "none") return;
  const over = () => fb.getBoundingClientRect().height - (innerHeight - 64);
  sol.style.zoom = "";
  if (over() <= .5) return;
  let lo = FIT_MIN, hi = 1, z = lo;
  sol.style.zoom = z;
  if (over() <= .5) { for (let i = 0; i < 8; i++) { z = (lo + hi) / 2; sol.style.zoom = z; if (over() <= .5) lo = z; else hi = z; } z = lo; }
  sol.style.zoom = z.toFixed(4);
}
function fitScreen(scr, glide) {
  const t = fitTarget(scr);
  if (!t.els.length) return;
  const z0 = parseFloat(t.els[0].style.zoom) || 1;
  let o = t.over();
  if (o <= .5 && (z0 >= 1 || o > -24)) return;
  t.els.forEach(e => { e.getAnimations().forEach(a => { if (a.id === "fit") a.cancel(); }); e.style.zoom = ""; if (t.page) e.style.minHeight = ""; });
  let z = 1;
  o = t.over();
  /* a body as tall as the phone (min-height 100dvh) would come out short once zoomed: keep it the phone's height */
  const tall = t.page && parseFloat(getComputedStyle(t.els[0]).minHeight) >= innerHeight - 2;
  const set = () => t.els.forEach(e => { e.style.zoom = z.toFixed(4); if (tall) e.style.minHeight = (innerHeight / z).toFixed(1) + "px"; });
  /* the largest zoom that fits: a body does not shrink in proportion (text re-wraps, a flex body
     stretches), so it is searched for, not computed */
  if (o > .5) {
    let lo = FIT_MIN, hi = 1;
    z = lo; set();
    const oMin = t.over();
    if (oMin <= .5) {
      for (let i = 0; i < 8; i++) { z = (lo + hi) / 2; set(); if (t.over() <= .5) lo = z; else hi = z; }
      z = lo; set();
    } else if (oMin > o - 1) { z = 1; set(); }   /* what overflows is not this body: shrinking it would only cost size */
  }
  if (glide && Math.abs(z - z0) > .004 && !fxReduced())
    t.els.forEach(e => { if (e.animate) e.animate([{ zoom: z0 }, { zoom: z }], { id: "fit", duration: 260, easing: "cubic-bezier(.3,.7,.4,1)" }); });
}
function fitWire() {
  const scr = $app.querySelector(":scope > .screen");
  if (scr === fitScr) return false;
  fitScr = scr;
  if (fitRO) fitRO.disconnect();
  if (scr && window.ResizeObserver) {
    /* a frame later, never inside the observer: a zoom set there would resize what it watches ("ResizeObserver loop") */
    let raf = 0;
    fitRO = new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; fitNow(true); }); });
    fitRO.observe(scr);
    fitTarget(scr).els.forEach(e => { fitRO.observe(e); Array.from(e.children).forEach(k => fitRO.observe(k)); });
    const fb = scr.querySelector("#fb"); if (fb) fitRO.observe(fb);
  }
  return true;
}
new MutationObserver(() => { const fresh = fitWire(); fitNow(!fresh); }).observe($app, { childList: true, subtree: true });
addEventListener("resize", () => fitNow(true));
if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", () => fitNow(true));

boot();
netBar();
})();
