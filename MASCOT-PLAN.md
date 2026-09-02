# قدّور — placement map

Where he appears, which state, and what makes it change.
Verified against `js/app.js` (4,348 lines) on 2026-09-02.

---

## What Duolingo actually does — the six rules we're copying

Watched against Duolingo's own screens, not from memory:

1. **On the path he does nothing.** Duo stands there, idle, as scenery the student
   walks past. He is not performing. That is why the path pose is `stand`, not `point`.
2. **He shows up at the peaks, never the flat parts.** Duo is absent from the boring
   middle of a session and present at start, finish, streak, and reward.
3. **Never twice on one screen.** One قدّور per view, always.
4. **Urgency is tempo, not new art.** Duolingo speeds Duo up rather than drawing an
   panicked Duo. We do the same with `bob` → `bob-fast`. This is why 17 states is
   enough and 40 would not be better.
5. **Empty states are his best home.** A blank screen is the one place a character
   earns its pixels outright.
6. **He is the voice of the notification.** This is where mascot love actually forms
   — and it is the one Duolingo advantage we cannot copy until reminders exist.

**And the one thing Duolingo can't do:** Duo teaches a language with no deadline.
قدّور has an exam date. The countdown card is the placement that is ours alone, and
it should be the one that changes the most.

---

## TIER A — he is seen every single session

| # | Where | Code | State | Motion | Changes when |
|---|---|---|---|---|---|
| 1 | **Beside the lesson path** | `renderPath()` `app.js:892`, `PATH_MASCOT_AT = 5` | `stand` | `bob` | `concerned` + `bob-fast` — streak at risk (below)<br>`strong` — exam ≤ 7 days |
| 2 | **Lesson intro «قبل ما نبدأ»** | `renderLessonIntro()` `app.js:1064` | `teach` | `pop` | never |
| 3 | **Lesson complete (win)** | `lessonComplete()` `app.js:1972` | `cheer` | `pop` | `proud` — 3 stars / 100% first-try accuracy |
| 4 | **Any modal** | `showModal()` `app.js:3357` — called at `:1026`, `:2094`, `:3366` | `point` | `pop` | never |

Placement 1 should be the most-seen image in the app — every session begins and ends
on the path. Two things are wrong with it today:

- **It renders `point`**, a performing pose in an idle slot.
- **He is at a fixed row and the path scrolls past him.** `PATH_MASCOT_AT = 5` is a
  global index, so he lives at row 6 of unit 1 — and `app.js:918` scrolls the current
  node to centre on every render. A student anywhere past unit 1 never sees him.
  The fix keeps the constraint the code's own comment explains (he needs a row whose
  node swings LEFT, i.e. `gi % 8` in `{5, 6, 7}`) but picks the one nearest the
  current lesson instead of the first one in the file:

  ```js
  const near = [];
  for (let g = 0; g < flat.length; g++) if ([5, 6, 7].includes(g % 8)) near.push(g);
  const PATH_MASCOT_AT = near.reduce((b, g) =>
    Math.abs(g - firstOpenIdx) < Math.abs(b - firstOpenIdx) ? g : b, near[0]);
  ```

  Tested across all 30 lessons: within three rows of the current lesson for every
  student past lesson 5, and at most five for a brand-new one — which is still on the
  first screen.

**Streak at risk**, exactly as the state already records it:

```js
const atRisk = S.streak.count > 0 && S.streak.last !== todayKey() && new Date().getHours() >= 18;
```

`S.streak.last` is the last day a lesson was cleared (`bumpStreak()` `app.js:184`), and
`app.js:146` has already zeroed the count if that day was not yesterday — so
`count > 0 && last !== today` is precisely "alive, and today is not banked yet." The
evening gate is deliberate: a worried face at 8 a.m. on a day the student was always
going to play is a nag, not a nudge. Duolingo warns at night for the same reason.

---

## TIER B — daily and weekly rhythm

| # | Where | Code | State | Motion | Changes when |
|---|---|---|---|---|---|
| 5 | **Exam countdown card** | `countdownCard()` `app.js:706` | tone-driven | see below | `far` → `calm`<br>`soon` ≤30d → `point`<br>`near` ≤14d → `encourage`<br>`urgent` ≤7d, readiness < 70% → `concerned` + `bob-fast`<br>`urgent` ≤7d, readiness ≥ 70% → `strong`<br>day 0 → `strong`, always |
| 6 | **Streak celebration** | `showStreakCelebration()` `app.js:3091` | `celebrate` | `pop` | `crown` at 7 / 30 / 100 days |
| 7 | **Daily chest ceremony** | `A.openChest()` `app.js:810` | `cheer` | `pop` | never |

`examTone()` at `app.js:698` already returns `far / soon / near / urgent`, and
`readiness()` is computed two lines into `countdownCard()` — the whole map is a lookup
on values the card already has. The readiness split matters: `concerned` means "worried
FOR you", and a student at 90% readiness a week out has nothing to be worried about.
Showing him a worried face there would be the one thing the register forbids.

---

## TIER C — milestones, empty states, one-offs

| # | Where | Code | State | Motion | Changes when |
|---|---|---|---|---|---|
| 8 | **Rank-up ceremony** | `showRankUp()` `app.js:2994` | `celebrate` | `pop` | `crown` at champion tier |
| 9 | **Review empty «لا أخطاء للمراجعة»** | `renderReview()` `app.js:3218` | `proud` | `pop` | never |
| 10 | **Mock exam home** | `renderMockHome()` `app.js:2048` | `strong` | `bob` | never — steady before a hard thing |
| 11 | **Mock result** | mock done screen | score-driven | `pop` | ≥70% → `proud`<br>40–69% → `encourage`<br><40% → `concerned` |
| 12 | **First-run value screen** | `renderIntroValue()` `app.js:3923` | `wave` | `pop` | never — currently `point`, should be a hello |
| 13 | **Exam date picker** | `renderExamSetup()` `app.js:3538` | `point` | `pop` | never |
| 14 | **Question bank loading** | `renderPath()` `app.js:855` | `think` | `bob` | never |
| 15 | **League ladder** | `renderLeague()` `app.js:2540` | `stand` | `bob` | `crown` at max tier (`lb-prog-max`) |
| 16 | **Toasts / profile avatar** | derived `qaddour-head.png` | — | — | crop of `point`, never generated |

---

## Where he deliberately does NOT go

- **Feedback sheets (correct / wrong)** — rejected. The sheet already carries the
  verdict; a face on top of it reads as judgement.
- **Fail screen «نفدت القلوب»** — rejected. `brokenHeartHero()` owns that moment.
- **On the question screen itself** — competes with the timer for the student's eye.
  The **method sheet** (`A.showMethod()` `app.js:1838`) is the exception: it calls
  `stopQTimer()` before it opens, so `teach` there is reading time, not clock time.

---

## Wiring

`MASCOT_STATES` at `app.js:642` is the gate — a state not listed there renders nothing
rather than a broken image. Add each key **the same day its PNG lands**, never before.

```js
const MASCOT_STATES = { stand: 1, point: 1, cheer: 1, concerned: 1, teach: 1 };
```

Motion classes already exist at `css/style.css:3845` — `pop`, `bob`, `bob-fast`, `shake`.
`:root[data-motion="reduced"]` kills all of them at `:3868`, so nothing extra is needed
for accessibility.

**He can never be mirrored.** `transform: scaleX(-1)` reverses the قدرات on the book.
He points toward the viewer's left, so he belongs at the RIGHT edge of an RTL column —
which is what `inset-inline-start` gives in `.path-mascot` (`style.css:3875`).

---

## How the states are built — body × face, not 17 drawings

A state is **one body pose plus one face mood**. The drawing is never regenerated:
the face rig in `assets/mascot/lab/` (`face-rig.svg` over `face-base.png`, driven in
`mascot-lab.html` §4) owns brows, lids, pupils and mouth as SVG, so every expression
is six numbers, not a picture. Bodies are the drawing plus **masked edits** of one arm
(`MASCOT-EDITS.md`), so head, vest and book stay pixel-identical across all of them.

Three bodies cover every state in this document:

| Body | Made by | States it carries (face mood in brackets) |
|---|---|---|
| `ref` — as drawn | nothing | `point` (talking) · `teach` (talking) · `cheer` (happy) · `timeup` (surprised) · `oops` (surprised) |
| `down` — arm at side | edit 1 | `stand` (idle) · `calm` (idle, lids low) · `sleep` (lids shut) · `proud` (happy, lids low) · `concerned` (worried) · `think` (thinking) · `crown` (happy + crown overlay) |
| `up` — stick overhead | edit 2 | `celebrate` (happy, wide) · `strong` (idle, brows down) · `wave` (happy) |

`worried` is the one mood the lab does not have yet — inner brow ends **up**, lids at
rest, mouth small and closed. The lab's `sad` has the same brows with a drooping
mouth; `worried` is that with the mouth flat. Six numbers, no art.

**Alignment rule for wiring:** every body must be cut with the **same fixed crop** as
`face-base.png`, never a per-image bounding box — `slice_mascot.py`'s `to_canvas()`
normalises on content height, which would shrink `up` (taller bbox) and slide the face
out from under the rig.

Edits and copy buttons: **`mascot-edits.html`**, prompts in `MASCOT-EDITS.md`.
