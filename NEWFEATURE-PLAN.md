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

### W2 — The loop feels alive
- [ ] The progress bar fills on every correct answer and gives ground on a miss, and its
      denominator counts the retries it is hiding
- [ ] «سؤال ٣ من ٨» in the session
- [ ] Praise that varies: the run, the halfway mark, the last question
- [ ] The stars you just earned, on the win screen, popping in
- [ ] The clock pauses when the phone is put down instead of costing a heart
- [ ] A missed question cannot loop forever in review
- [ ] One tap from the win screen into the questions you got wrong

### W3 — The full learning guide
- [ ] Teaching cards for the remaining 23 lessons, validated
- [ ] Teaching figures where a lesson is visual (geometry first)
- [ ] Every lesson's untaught rules routed to the guidebook

### W4 — Learn smart
- [ ] Spaced repetition: a due date per missed question, and «مراجعة اليوم» on the path
- [ ] Review without the cap of 12, ordered by what is due and how often it was missed
- [ ] Skill decay: a lesson last practised weeks ago says so on the path
- [ ] A placement test at the start, so a strong student does not grind lesson 1
- [ ] A daily mix drawn from the domains the student is weakest in

### W5 — Pacing and retention
- [ ] Choose علمي or أدبي on the first run instead of defaulting silently
- [ ] The daily goal the student sets (`S.goal`), driving the quest
- [ ] A study plan off the exam date, and a weekly summary from `S.days`
- [ ] The streak-at-risk nudge when the day is nearly over
- [ ] «أبلغ عن السؤال» — a student can report a bad key and see it acknowledged

### W6 — Offline and installable
- [ ] `sw.js`: precache the shell, the four data files and the teaching data; cache-first
      with a version bump
- [ ] Register it, and stop suppressing the install prompt
- [ ] Tell the student when they are offline instead of failing silently

### W7 — Delight
- [ ] The motion pass from the design audit, screen by screen
- [ ] Empty states everywhere one is missing
- [ ] Desktop layouts for the session, the mock and the celebrations

### W8 — Reachable by everyone
- [ ] Answer choices as a real radio group
- [ ] Overlays as dialogs: focus moves in, Escape closes, focus returns
- [ ] The chest ceremony reachable from the keyboard
- [ ] Honour the OS reduced-motion setting, not only the app's own switch

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
