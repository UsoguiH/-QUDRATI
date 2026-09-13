# قدراتي — the completion plan (branch `NewFeature`)

Written 2026-09-13, from four audits of the tree at `ca45580` (the merge of `main` into
this branch). `ROADMAP-2026.md` is superseded where the two disagree: it counted 720
questions and 30 lessons, which the curriculum import replaced with 255 questions in 26
lessons written from المعاصر ١٠.

**The brief.** Take the app from a very good half to a whole: the full flow, the full
knowledge, the full learning guide — and make it something a student enjoys, not a
worksheet. Nothing here needs a server, a package or a build step; the app still ships as
static files.

## What was actually true at the start

| | |
|---|---|
| Learning loop | polished, but the progress bar never moves on a correct answer and there is no question counter |
| Teaching cards | **3 of 26 lessons**. From lesson 4 on, the student meets up to 28 rules on one scroll |
| Questions | 255, every one with a worked solution; every lesson is single-difficulty, so no lesson ramps |
| Offline | none — no service worker, and `index.html` actively suppressed the install prompt |
| Progress safety | one `localStorage` key, no export, no schema migration — and `preview.html` shipped to production, overwriting that key on load |
| Mock exam | a reload loses the whole 50 minutes; the home tile and the result screen predicted two different scores |
| Review | manual only, hard-capped at 12, no schedule |
| Retention | streak + a fixed daily quest; `S.goal` and `S.days` were recorded and read by nobody |

## The waves

Each wave ends with a commit and a browser check (`tools/drive.js` in the session
scratchpad drives a real Chrome and reports console errors).

### W1 — Truth and trust ✅
- [x] `preview.html` must never seed state on a real host — it silently wiped progress for
      anyone who opened `qudrati.xyz/preview.html`
- [x] Progress backup: copy a code out, paste a code in, from Settings
- [x] `S.v` schema migration hook, so a future change cannot orphan a save
- [x] A mock exam survives a reload and offers to resume
- [x] One Qiyas prediction per mock, everywhere
- [x] Say plainly that the league rivals are pace-setters, not people
- [x] «خبرة» instead of the bare `XP` token; `A.debug*` only on the dev harnesses

### W2 — The loop feels alive ✅
- [x] The progress bar fills on every correct answer and gives ground on a miss, and its
      denominator counts the retries it is hiding
- [x] «سؤال ٣ من ٨» in the session
- [x] Praise that varies: the run, the halfway mark, the last question
- [x] The stars you just earned, on the win screen, popping in
- [x] The clock pauses when the phone is put down instead of costing a heart
- [x] A missed question cannot loop forever in review
- [x] One tap from the win screen into the questions you got wrong

### W3 — The full learning guide ✅
- [x] Teaching cards for the remaining 23 lessons, validated — **26 of 26 lessons now teach**:
      120 chunks, 273 rules on cards, 120 checks, and the other 130 rules routed to the guidebook
- [x] Teaching figures where a lesson is visual: 61 figures, every rule that a
      student's pen would answer with a drawing — the nine geometry lessons and
      the three that already had them
- [x] Every lesson's untaught rules routed to the guidebook

### W4 — Learn smart ✅
- [x] Spaced repetition: a due date per missed question, and «مراجعة اليوم» on the path
- [x] Review without the cap of 12, ordered by what is due and how often it was missed
- [x] Skill decay: a lesson last practised weeks ago says so on the path
- [x] A placement test at the start, so a strong student does not grind lesson 1
- [x] A daily mix drawn from the domains the student is weakest in

### W5 — Pacing and retention ✅
- [x] Choose علمي or أدبي on the first run instead of defaulting silently
- [x] The daily goal the student sets (`S.goal`), driving the quest — ٥، ١٠، ٢٠ in Settings, and
      the chest pays in proportion, pile and all
- [x] A study plan off the exam date, and a weekly summary from `S.days`
- [x] The streak-at-risk nudge when the day is nearly over
- [x] «أبلغ عن السؤال» — kept in the save, listed in Settings, copyable; it never claims to
      have reached a server, because there is none

### W6 — Offline and installable ✅
- [x] `sw.js`: precaches the shell under a VERSION-named cache; navigations go to the
      network first, and a dev harness is never served from a cache
- [x] Registered from the app's own page; the install prompt is kept and offered in Settings
- [x] Tell the student when they are offline — a note that says what still works

### W7 — Delight ✅
- [x] The motion pass: the path reveals node by node as you scroll; a press answers on
      the mock chips, the solution link and the settings rows; a mouse gets hover where
      there was none; the power-up FAB, the ring, the glow and the four twinkles are gone
      with the ninety lines of stylesheet behind them, and `flakeSpin` — used, never
      written — went with them
- [x] Empty states: stats says «لا أرقام بعد» and points at the first lesson instead of
      drawing four bars at «—», and it no longer congratulates a student for having no
      mistakes before they have answered anything
- [x] Desktop: the teaching card centres in the space it has — it was sitting under the
      header with five hundred pixels of nothing below it. The question, the mock and the
      celebrations were already centred; measured, not assumed
- Not done, deliberately: **directional screen transitions** (the six views are tabs, and
  tabs crossfade — the one real hierarchy, path → lesson, already animates) and the
  **nine-step type scale** (retrofitting every `font-size` in 3,900 lines changes nothing
  a student sees and risks everything they read)

### W8 — Reachable by everyone ✅
- [x] Answer choices are a radio group — one tab stop, `aria-checked` where the pick is,
      and the arrows move it, in the lesson and the mock both
- [x] Every sheet is a dialog that works: focus moves in, Tab stays in, Escape closes,
      focus goes back where it was, and with two sheets open only the top one answers
- [x] The chest ceremony is completable from the keyboard — which is how the double
      payout on «المتابعة» was found
- Resolved, not done: the OS reduced-motion setting stays **reported, not obeyed** — that
  decision is written into app.js and has bitten this project twice (Windows reports
  «reduce» far more often than anyone means it). What was missing was the sentence:
  Settings now says the system is asking for less motion, and where the switch is

## Data defects found while writing the cards

Writing a card means reading a lesson's rules and its ten solutions next to each other,
which is the first time anything in this project has done that. Six things came out of it.
Two were real and are fixed. Two turned out to be deliberate and are staying. Two are open,
for reasons given below.

The four question files are generated, so a fix goes into `qudrat-lessons-duolingo.md` and
is re-imported with `python tools/import_curriculum.py`, never typed into `js/data/`.

**Fixed** (commit «Fix two curriculum defects the teaching cards exposed»)

| Where | What was wrong |
|---|---|
| `proportion-07` | The printed solution crossed the rows: `٨ × س × ٩ = ٥ × ٢٤٠ × ٦` gives ١٠٠, not the ٢٢٥ the same solution then states. Work is proportional to workers × days, so those two go on one side: `٨ × ٦ × س = ٥ × ٩ × ٢٤٠` ⟵ ٢٢٥, which is the key. A rate check follows it. |
| `ratios.mean` rule 6 | One sign for two opposite cases. A value that left the group is added back; a value that joined is taken off. As printed the rule contradicted `mean-08`'s own solution and the card's own plain-words chip. Both signs are now spelled out, in the source and in the card. |

**Deliberate, not defects**

| Where | Why it stays |
|---|---|
| `geometry.parallel` rule 4, «القاطع المكسور (التوازي بحرف M)» | The Latin letter is the shape, not text: the broken transversal draws an M between the parallels, and that is the name the textbook and every teacher use. The house rule bans Latin **digits** in what a student reads, so that a number is never read in two scripts. A shape called by its shape breaks nothing, and renaming it would leave a student unable to match the lesson to the name they were taught. |
| «تساوي البسطين/المقامين», declared in three lessons (`skills.fastest` rule 5, `skills.equations` rule 4, `skills.keylaws` rule 15) | Lessons are entered independently and a rule is only useful where it is needed. Declaring it once and cross-referencing would make two of the three lessons depend on a lesson the student may not have played. The repetition is the curriculum's, and it is the right call. |

**Open**

| Where | Why it is still open |
|---|---|
| `equations-10`, `simplify-05`, `angles-10`, `square-09`, `shaded-05` | Each is solved by a move its lesson never declares, or its stem describes a figure that is not drawn. All five have correct keys and correct arithmetic, so nothing is wrong on screen; what is missing is a rule or a picture. Fixing one means either writing a new rule into the lesson (which changes the rule count the importer reconciles, and the card grouping built on it) or drawing a figure for a question that never had one. Both are curriculum edits, not app work, and each needs its own check against the source book. Left for a content pass. |
| Every lesson: one difficulty | `difficulty` always equals the lesson's own ★ rating, so no session can ramp easy-to-hard inside a lesson, and only two of the twenty-six lessons are easy. Ramping would mean re-rating all ٢٥٥ questions one at a time — a judgement call per question, not a transformation — and `tools/validate.js` enforces difficulty ordering within a lesson, so a partial pass fails the validator. It is real, it is worth doing, and it is a pass of its own rather than a line in this one. |
## Rules this work keeps

- No npm, no bundler, no build step, no server. Static files only.
- Eastern Arabic digits in everything a student reads.
- RTL is the layout, not a skin.
- No confetti, no particle sprays, no rings, no sunburst behind the chest: celebrations are
  an elastic pop with squash and stretch. قدّور appears on the win screen, the mock home and
  the first-run value screen — nowhere else.
- Every generated file stays generated: the four question files come from
  `qudrat-lessons-duolingo.md` through `tools/import_curriculum.py`.
- `node tools/validate.js` and `node tools/validate_teach.js` pass before every commit.
