# قدراتي — QUDRATI

**This is a real, published project. It is live at [qudrati.xyz](https://qudrati.xyz/) and available on Android as `Qudrati.apk`. Treat all changes as production code.**

## What it is

A Duolingo-style Arabic web game for practicing the Quantitative section of the Saudi General Aptitude Test (GAT / Qiyas). Fully RTL, Arabic-first, zero dependencies, zero server, zero build toolchain. Open `index.html` and play.

## Tech stack

- **Pure HTML/CSS/JS** — no npm, no bundler, no framework
- **State**: single `S` object in `localStorage["qudratState"]`
- **CSS**: pixel-perfect implementation of the Duolingo design system (colors/radii extracted from Figma file `sCGqaL307LkNrY35xnV66O`)
- **Font**: Baloo Bhaijaan 2 (Arabic rounded equivalent of Duolingo's DIN 2014 Rounded VF)
- **Android**: Capacitor wrapper → `Qudrati.apk`

## File map

```
index.html              — app shell (single <div id="app">)
preview.html            — dev harness: bypasses disclaimer, seeds state, jumps to any screen via #hash
mobile.html             — device-frame preview of the app, auto-reloads when style.css or app.js changes
css/style.css           — full design system (2059 lines, Figma-exact values)
js/app.js               — ALL game logic (~1939 lines, single IIFE, no imports)
js/data/skills.js       — Unit 1 questions: مهارات وقوانين القدرات  (3548 lines)
js/data/numbers.js      — Unit 2 questions: أساسيات الأعداد         (2816 lines)
js/data/ratios.js       — Unit 3 questions: النسب والاحتمالات       (1580 lines)
js/data/geometry.js     — Unit 4 questions: الهندسة والإحصاء        (4012 lines)
tools/serve.js          — zero-dep dev server; sends Last-Modified so mobile.html can auto-reload
tools/validate.js       — Node.js validator for question-bank structure
tools/figma-dump.js     — Figma API dump helper
tools/figma-export.js   — icon export from Figma
tools/methods/          — audit scripts for question method coverage
assets/icons/           — SVG icons + rank badge PNGs
assets/streak/          — Rive animations (flame.riv, big.riv) + Lottie (daycheck.json)
assets/sounds/          — correct.mp3
```

## Game systems

- **Structure**: 4 units × ~18 lessons = ~72 lessons, unlocked sequentially
- **Questions**: 216+ original questions — MCQ (`format:"mcq"`) and comparison (`format:"comparison"`)
- **Tracks**: `"sci"` (scientific) and `"lit"` (literary — lighter quant load, excludes `track:"sci"` questions)
- **Hearts**: 3 per level; losing all resets the level
- **Timer**: 60 seconds per question (matches real GAT pace)
- **Gems** (`S.xp`): spendable currency — hint power-ups, revive (50), 2× boost (50)
- **Rank XP** (`S.totalXp`): lifetime total, never decremented; drives the 5 rank tiers (bronze → silver → gold → diamond → champion)
- **Streak**: daily streak with Rive flame animation
- **Stars**: 1–3 per lesson
- **Wrong-answer queue**: incorrect questions are replayed at session end
- **Daily quest**: 10 questions → chest reward (50 gems)
- **League**: ghost leaderboard opponents
- **Mock exam**: 2 sections × 25 min, free navigation + flagging (mirrors real GAT computerized format)
- **Power-ups**: freeze timer (ice), 50/50 choice elimination — gooey FAB animation

## State object (`S`)

Key fields in `DEFAULT_STATE`:

| Field | Purpose |
|-------|---------|
| `track` | `"sci"` or `"lit"` |
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

## Validating the question bank

```bash
node tools/validate.js
```

Checks: unique IDs, valid format/difficulty/track/answer, solution length, figure tag, duplicate choices, difficulty ordering within lessons, comparison answer distribution.

## Development preview

```bash
node tools/serve.js          # http://localhost:8080
```

Then open **`/mobile.html`** for mobile work: it frames the app at a real device
size, and because the iframe is the exact device width the CSS behaves as it does
on the phone. It reloads itself whenever `style.css` or `app.js` changes. Hover
effects still apply there (the host has a mouse) — use DevTools device mode when
touch behaviour matters, or the LAN address the server prints to open it on a real
phone.

Open `preview.html#<screen>` to jump directly to any screen (bypasses disclaimer, seeds realistic state):

| Hash | Screen |
|------|--------|
| `#path` | lesson path (default) |
| `#lesson` | active lesson |
| `#pop` | lesson start popup |
| `#fb` | feedback sheet |
| `#done` | lesson complete |
| `#fail` | lose screen |
| `#stats` | stats page |
| `#settings` | settings page |
| `#mock` | mock exam |
| `#mocktest` | start mock exam immediately |
| `#mockdone` | completed mock |
| `#league` | league screen |
| `#review` | mistakes review |
| `#chest` | open daily chest |
| `#rankup` | rank-up celebration |

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
```

## Adding features

- All rendering is done by functions in `js/app.js` that return HTML strings and set `$app.innerHTML`.
- Navigation: call `A.go(screenName)` — the `A` object exposes all public handlers.
- New screens follow the pattern: render function → attach to `A` → add nav target to `A.go()`.
- CSS variables are at the top of `style.css` under `:root`. Always use them — never hardcode colors.
- Arabic digits: use `toAr(n)` to render numbers in Eastern Arabic (`٠١٢٣٤٥٦٧٨٩`). Use Latin digits only in code/IDs.

## What NOT to do

- Do not introduce any npm packages, bundlers, or build steps — the project ships as static files.
- Do not add `//`-commented-out code blocks or TODO comments in production code.
- Do not use Latin digits in user-visible text (question stems, solutions, UI).
- Do not copy or reproduce real Qiyas/ETEC exam questions — all questions must be original.
- Do not break the RTL layout — test all UI changes with `dir="rtl"`.

## Deployment

Static hosting, no server required. The app is live at **qudrati.xyz**. The Android APK (`Qudrati.apk`) is a Capacitor wrapper over the same static files.
