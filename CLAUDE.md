# قدراتي — QUDRATI

**This is a real, published project. It is live at [qudrati.xyz](https://qudrati.xyz/) and available on Android as `Qudrati.apk`. Treat all changes as production code.**

## What it is

A Duolingo-style Arabic web game for practicing the Quantitative section of the Saudi General Aptitude Test (GAT / Qiyas). Fully RTL, Arabic-first, zero dependencies, zero build toolchain, works offline. Open `index.html` and play.

## Tech stack

- **Pure HTML/CSS/JS** — no npm, no bundler, no framework
- **State**: single `S` object in `localStorage["qudratState"]`
- **CSS**: pixel-perfect implementation of the Duolingo design system (colors/radii extracted from Figma file `sCGqaL307LkNrY35xnV66O`)
- **Font**: Baloo Bhaijaan 2 (Arabic rounded equivalent of Duolingo's DIN 2014 Rounded VF)
- **PWA**: `manifest.webmanifest` + `sw.js` — the shell, all questions and the reference are precached, so the app runs with no network
- **Android**: Capacitor wrapper → `Qudrati.apk`

## File map

```
index.html              — app shell (sidebar + #app + aside), theme bootstrap, SW registration
preview.html            — dev harness: bypasses disclaimer, seeds state, jumps to any screen via #hash
manifest.webmanifest    — PWA metadata: icons, shortcuts, standalone display
sw.js                   — service worker; bump CACHE when a shipped asset changes
css/style.css           — full design system + responsive tiers + dark theme
js/app.js               — ALL game logic (single IIFE, no imports)
js/data/skills.js       — Unit 1 questions: مهارات وقوانين القدرات  (9 lessons)
js/data/numbers.js      — Unit 2 questions: أساسيات الأعداد         (7 lessons)
js/data/ratios.js       — Unit 3 questions: النسب والنسبة المئوية   (4 lessons)
js/data/geometry.js     — Unit 4 questions: الهندسة                 (10 lessons)
js/data/guide.js        — المرجع: rules + worked example + pitfall, keyed "<domain>.<lesson>"
tools/validate.js       — Node.js validator for question-bank structure
tools/make-icons.js     — regenerates assets/icons/app/*.png (hand-rolled PNG encoder, no npm)
tools/figma-dump.js     — Figma API dump helper
tools/figma-export.js   — icon export from Figma
tools/methods/          — audit scripts for question method coverage
assets/icons/           — SVG icons + rank badge PNGs + app/ (PWA icons)
assets/streak/          — Rive animations (flame.riv, big.riv) + Lottie (daycheck.json)
assets/sounds/          — correct.mp3
```

The question bank holds **720 questions across 30 lessons** (24 per lesson: 6 easy / 12 medium / 6 hard), every one with a `method`. The reference holds **140 rules**.

## Screens

`path` · `practice` · `guide` · `achievements` · `league` · `mock` · `stats` · `review` · `settings`

Each is a top-level view with its own URL hash, so browser Back walks through the app. `VIEWS` in `app.js` is the whitelist; anything not in it is ignored by the hash router.

## Game systems

- **Structure**: 4 units, 30 lessons total, unlocked sequentially — or skipped per unit via a **unit test** (8 questions, 2 mistakes allowed; passing opens every lesson in the unit at 1 star)
- **Questions**: 720 original questions — MCQ (`format:"mcq"`) and comparison (`format:"comparison"`)
- **Tracks**: `"sci"` (scientific) and `"lit"` (literary — lighter quant load, excludes `track:"sci"` questions)
- **Hearts**: 3 per level; losing all resets the level. Practice and review are no-fail; a unit test has 2
- **Timer**: 60 seconds per question (matches the real GAT pace); optional in free practice
- **Gems** (`S.xp`): spendable currency — hint power-ups, revive (50), 2× boost (50)
- **Rank XP** (`S.totalXp`): lifetime total, never decremented; drives the 5 rank tiers (bronze → silver → gold → diamond → champion)
- **Streak**: daily streak with Rive flame animation
- **Stars**: 1–3 per lesson
- **Wrong-answer queue**: incorrect questions are replayed at session end (except in a unit test, which is fixed-length)
- **Free practice** (`تدريب حر`): the whole bank on demand — weakest questions, never-seen questions, or a chosen unit/lesson/difficulty/count
- **Reference** (`المرجع`): per-lesson rules, one worked example, and the common mistake. Reachable from the sidebar, a unit banner, the lesson popup and the in-lesson method sheet
- **Achievements**: 22 badges derived from existing state, so old progress counts retroactively
- **Daily quest**: 10 questions → chest reward (50 gems)
- **League**: ghost leaderboard opponents
- **Mock exam**: 2 sections × 25 min, free navigation + flagging (mirrors real GAT computerized format); wrong answers feed the mistakes list
- **Power-ups**: freeze timer (ice), 50/50 choice elimination — gooey FAB animation

## Session modes

`SES.mode` is one of `lesson` · `practice` · `review` · `skip`. It decides hearts, rewards, the header counter, whether wrong answers requeue, and which completion screen runs (`lessonComplete` / `practiceComplete` / `reviewComplete` / `skipComplete`).

## State object (`S`)

Key fields in `DEFAULT_STATE`:

| Field | Purpose |
|-------|---------|
| `track` | `"sci"` or `"lit"` |
| `theme` | `"auto"` \| `"light"` \| `"dark"` |
| `xp` | spendable gems |
| `totalXp` | lifetime rank XP |
| `tierSeen` | highest rank tier already celebrated |
| `streak` | `{ count, last }` |
| `lessons` | `{ "domain.lessonKey": { stars, plays } }` |
| `qstats` | `{ "question-id": { r, w } }` (right/wrong counts) |
| `mistakes` | `{ "question-id": timestamp }` |
| `exam` | scheduled exam date string or null |
| `mocks` | array of completed mock exam results |
| `daily` | `{ day, n, claimed }` quest progress |
| `league` | `{ week, base, ghosts }` |
| `practice` | remembered free-practice settings `{ unit, lesson, diff, count, timed }` |
| `badges` | `{ achievementId: timestamp }` — `null` means "not seeded yet" |
| `chests` | lifetime daily chests opened |
| `guideSeen` | `{ "domain.lesson": 1 }` reference cards opened |
| `activity` | `{ "YYYY-M-D": answeredCount }` — drives the stats grid, trimmed to ~140 days |
| `tsecs` / `tans` | total seconds and answers, for average time per question |

Progress is exportable from Settings as a `QDR1.<base64>` code (see `exportCode` / `parseCode`).

## Question schema

```js
{
  id: "unique-id",           // e.g. "oo-01" — must be globally unique
  format: "mcq",             // or "comparison"
  difficulty: 2,             // 1=easy, 2=medium, 3=hard
  track: "both",             // "both" | "sci" | "lit"
  stem: "نص السؤال…",
  choices: ["أ","ب","جـ","د"], // mcq only — 4 items, no letter prefix
  // value1: "…", value2: "…", // comparison only
  answer: 0,                 // 0-indexed correct choice
  solution: "الحل خطوة…",   // step-by-step, \n between steps (≥10 chars)
  method: "١) …\n٢) …\n💡 …", // structured method steps (optional but preferred)
  figure: null               // or inline SVG / HTML table string
}
```

Comparison answers must use the fixed 4-choice set defined in `CMP_CHOICES` (app.js line ~12):
`["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية"]`

Figures hardcode `#4B4B4B` strokes, so in dark mode `.q-figure` is given a white sheet rather than rewriting 107 diagrams. Keep that convention for new figures.

## Reference schema (`js/data/guide.js`)

```js
"domain.lesson": {
  rules: [{ h: "اسم القاعدة", t: "نصها" }],   // 3-6 per lesson
  ex:    { q: "سؤال المثال", s: ["خطوة", "خطوة", "الناتج"] },
  tip:   "الخطأ الشائع في هذا الدرس",
}
```

Every lesson in `QBANK` should have a matching `QGUIDE` entry — the guide screen skips lessons without one.

## Validating the question bank

```bash
node tools/validate.js
```

Checks: unique IDs, valid format/difficulty/track/answer, solution length, figure tag, duplicate choices, difficulty ordering within lessons, comparison answer distribution.

## Development preview

Open `preview.html#<screen>` to jump directly to any screen (bypasses disclaimer, seeds realistic state):

| Hash | Screen |
|------|--------|
| `#path` | lesson path (default) |
| `#lesson` | active lesson |
| `#pop` | lesson start popup |
| `#fb` | feedback sheet |
| `#done` | lesson complete |
| `#fail` | lose screen |
| `#practice` | free-practice setup |
| `#practicedo` / `#practicedone` | a practice run / its result |
| `#guide` | reference (unit picker) |
| `#achievements` | badge grid |
| `#skiptest` / `#skipdone` / `#skipfail` | unit test, passed, failed |
| `#stats` | stats page |
| `#settings` | settings page |
| `#mock` | mock exam |
| `#mocktest` | start mock exam immediately |
| `#mockdone` | completed mock |
| `#league` | league screen |
| `#review` | mistakes review |
| `#chest` | open daily chest |
| `#rankup` | rank-up celebration |

Serve over HTTP (not `file:`) when testing the service worker. `preview.html` deliberately does not register it.

## Key constants (app.js)

```js
const LEVEL_HEARTS   = 3;
const Q_SECS         = 60;   // seconds per question
const REVIVE_COST    = 50;   // gems to revive after fail
const BOOST_COST     = 50;   // gems for 2× XP boost
const CHEST_GEMS     = 50;   // gems from daily chest
const DAILY_GOAL     = 10;   // questions for daily quest
const MOCK_SECS      = 25*60; // 25 min per mock section
const MOCK_SECTIONS  = 2;
const PRACTICE_XP    = 3;    // rank XP per first-try correct in free practice
const SKIP_LEN       = 8;    // questions in a unit test
const SKIP_HEARTS    = 2;    // mistakes allowed in a unit test
```

## Adding features

- All rendering is done by functions in `js/app.js` that return HTML strings and set `$app.innerHTML`.
- Navigation: call `A.go(screenName)` — the `A` object exposes all public handlers.
- New screens follow the pattern: render function → attach to `A` → add to the `render()` map, `VIEWS`, and `NAV_LABEL`.
- CSS variables are at the top of `style.css` under `:root`. Always use them — never hardcode colors.
- Surfaces use `var(--surface)` / `var(--surface-2)` / `var(--page-bg)` so the dark theme works. `color: #fff` on a coloured button is fine; `background: #fff` is not.
- Arabic digits: use `toAr(n)` to render numbers in Eastern Arabic (`٠١٢٣٤٥٦٧٨٩`). Use Latin digits only in code/IDs.
- Counted nouns: use `arPlural(n, one, two, few, many)` — Arabic needs four forms, not two.
- A fraction like `١٠/٣٠` must have **no spaces** around the slash, or bidi splits it into two runs and reverses them on screen.
- After changing a shipped asset, bump `CACHE` in `sw.js` and the `?v=` query in `index.html` together.

## What NOT to do

- Do not introduce any npm packages, bundlers, or build steps — the project ships as static files.
- Do not add `//`-commented-out code blocks or TODO comments in production code.
- Do not use Latin digits in user-visible text (question stems, solutions, UI).
- Do not copy or reproduce real Qiyas/ETEC exam questions — all questions must be original.
- Do not break the RTL layout — test all UI changes with `dir="rtl"`.
- Do not assume a colour is theme-safe — check any new screen in both light and dark.

## Deployment

Static hosting, no server required. The app is live at **qudrati.xyz**. The Android APK (`Qudrati.apk`) is a Capacitor wrapper over the same static files.
