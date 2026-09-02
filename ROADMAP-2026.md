# قدراتي — Development Roadmap
### Written 2026-08-24. Supersedes `ROADMAP.md`.

Every claim below was verified against the code on the day of writing, not
recalled. Where a number is an estimate rather than a measurement it says so.

---

## 1. Where we actually are

The honest headline: **we have built an excellent half of a product.**

What exists is genuinely good. The learning loop is polished to a level most
apps never reach — a measured answer animation, a rank-up celebration, hearts,
a streak, gems, a league, a responsive shell that works from 375px to 2400px.
The question bank is better than the app around it.

But three things are true at the same time, and only the first one is
comfortable:

| | |
|---|---|
| ✅ | The quantitative learning loop is close to shippable-complete |
| ⚠️ | We cover **half the exam**. قدرات is لفظي + كمي. We have no verbal content at all. |
| 🔴 | There is **no backend**. Progress lives in one `localStorage` key. Clearing site data deletes everything, forever, with no recovery. |

### Measured facts (verified 2026-08-24)

**Content — strong, but half-scope**

| | |
|---|---|
| Questions | 720 |
| With step-by-step `.method` | 720 (100%) |
| With `.solution` | 720 (100%) |
| With a figure | 114 |
| Difficulty spread (1/2/3) | 180 / 355 / 185 |
| Formats | 475 MCQ + 245 comparison |
| Units / lessons | 4 / 30 |
| **Verbal (لفظي) questions** | **0** |

**Platform — near zero**

| | |
|---|---|
| Backend / API | none — the only `fetch()` in `app.js` loads a local Lottie file |
| Accounts | none. `S.user` is a local display name |
| Cross-device sync | none |
| Service worker / PWA | none — no `sw.js`, no `manifest.webmanifest`, no `register()` |
| Analytics | none |
| Notifications / reminders | none |
| Placement test | none |

**Screens that exist** — the router dispatches exactly six: `path`, `league`,
`mock`, `stats`, `settings`, `review`. Plus full-screen flows: session, lesson
intro, mock question, exam setup, login.

### Percentage complete

A single number is misleading, so here it is by layer. Weights reflect what it
takes to be a product students trust with their exam, not what it takes to
demo well.

| Layer | Weight | Done | Why |
|---|---|---|---|
| Learning loop & UI | 20% | **85%** | Polished. Four critical bugs open (below) |
| Content — quantitative | 20% | **90%** | 720 questions, fully explained. Needs volume for repeat users |
| Content — verbal | 20% | **0%** | Does not exist |
| Platform (accounts, sync, offline) | 20% | **5%** | localStorage only |
| Retention (streak, reminders, real league) | 10% | **35%** | Streak and league exist; league is fabricated, no reminders |
| Exam realism (mock, scoring, timing) | 10% | **45%** | Mock is quantitative-only, so it cannot predict a real GAT score |

**Weighted total: ≈ 48%.**

Read that as: *the half we built is 90% finished; the other half has not been
started.* Both statements are fair.

---

## 2. The four bugs in the core loop — fix these first

These are open right now and every student hits them on every lesson.

| | Bug | Fix |
|---|---|---|
| **C2** | **The progress bar lies.** `pct = SES.done / SES.total`, but `total` is frozen at lesson start while `SES.queue.push(q)` grows the queue on every wrong answer. A student on question 11 can see the bar at 50%. | Track the live queue length, or show retries separately |
| **C4** | **Completed lessons show a brown star.** `nodeIcon = done ? ico("star-done", 40)`, and `star-done.svg` is `#AA572A`. The reward for finishing a lesson is a mud-coloured star. | One word: `star-gold` (`#FFC800`) |
| **C1** | **No question counter.** No «سؤال ٣ من ٨». The student never knows how much is left. `SES.idx` and `SES.total` are both in scope. | Render them in `session-top` |
| **C3** | **The league is fabricated with zero disclosure.** Ghost names and scores are invented. A student who opens devtools loses all trust in the app. | Either label them as افتراضيون, or make the league real (Phase 3) |

C2 and C4 are under an hour together. Do them before anything on this roadmap.

---

## 3. What Duolingo has that we don't

Filtered to things that would genuinely help a قدرات student — achievements,
subscriptions and cosmetics are deliberately excluded.

### 🔴 Tier 1 — the app is fragile without these

**1. Accounts and cloud sync**
Duolingo: log in on any device, progress follows you.
Us: one `localStorage` key. A student who clears their browser, switches
phones, or uses Safari private mode loses 30 lessons of work with no recovery.
For an app people use daily for months before a life-affecting exam, this is
the single largest risk we carry. It is also the prerequisite for real
leaderboards, reminders and analytics.

**2. Reminders**
Duolingo's notification is the most effective retention mechanism in consumer
education, full stop. Our streak counter punishes a missed day but nothing
ever tells the student a day is at risk. We have a countdown to their actual
exam date — that is a stronger reminder hook than Duolingo has ever had, and
we are not using it.

**3. A placement test**
Duolingo lets you test out of what you already know.
Us: everyone starts at lesson 1 of unit 1. A strong student three weeks from
their exam has to grind through content they mastered years ago, or quit. This
is likely our biggest silent drop-off.

### 🟠 Tier 2 — real learning-science gaps

**4. Spaced repetition with scheduling**
Duolingo resurfaces material as it decays. We have `S.mistakes` and a review
screen, but nothing *schedules* anything — review only happens if the student
chooses to go looking for it. Our `noteAnswer()` already tracks correct-streaks
per question; it is most of an SRS already, missing the "when to show this
again" half.

**5. Adaptive difficulty**
Duolingo adapts to you. We serve easy-first in a fixed order. We have
`q.difficulty` on all 720 questions and per-question stats in `S.qstats` — the
data for adaptivity is sitting there, unused.

**6. Skill decay / strength**
Duolingo cracks a skill you haven't practised. Our path nodes are binary:
done or not-done. A lesson passed six weeks ago looks identical to one passed
this morning.

### 🟡 Tier 3 — worth doing, not urgent

**7. Real leaderboards** — ours are fake (see C3). Needs accounts first.
**8. Offline** — Duolingo works on the bus. We have no service worker, so we
need a live connection for an app whose entire premise is daily short sessions.
**9. A daily goal the student sets** — we have a fixed daily quest; Duolingo
asks you to commit to a target, which is what makes it binding.

---

## 4. What *we* need that Duolingo doesn't have

Duolingo teaches a language with no deadline. We prepare a specific exam on a
specific date. That difference should produce screens Duolingo would never
build.

**1. The verbal section (لفظي)** — *the single most important item on this
roadmap.* قدرات is verbal + quantitative. For علمي students verbal is roughly
half the exam; for أدبي students it is the majority. Right now an أدبي student
gets an app that addresses a minority of what they will be tested on. Every
other item here is polish next to this.
*(Exact section weights should be confirmed against the current Qiyas spec
before we plan content volume.)*

**2. A formula & rules reference (قوانين)** — a student mid-question wants to
look something up without abandoning the question. There is no reference screen
in the app at all. This was apparently planned once and never shipped.

**3. Timed drill mode** — the GAT is brutally time-pressured. We have a
90-second per-question timer in lessons, but no mode that trains *speed*
specifically: 20 questions, 10 minutes, no explanations, just pace.

**4. A calibrated score predictor** — students care about one number: their
predicted score on the Qiyas scale. Our mock gives a percentage. Turning that
into a predicted score is the single most shareable thing this app could
produce — and the biggest reason someone tells a friend about it.

**5. "Report this question"** — 720 original questions written without a
formal review pass will contain errors. One wrong answer key that a student
finds and cannot report costs more trust than ten polish bugs. This is cheap
and protects everything else.

**6. Exam-day readiness, honestly computed** — the exam card shows «جاهزيتك ٣٪»
today. Once verbal exists and the mock is real, this becomes the app's
headline: *are you ready, and for which section are you not?*

---

## 5. The roadmap

Ordered by dependency and by risk to the student, not by how interesting the
work is.

### Phase 0 — Stop the bleeding *(days)*
- Fix **C2** (lying progress bar) and **C4** (brown star)
- Fix **C1** (question counter)
- Resolve **C3**: disclose the fake league, or hide it until Phase 3
- **Add "report this question"** — writes to `localStorage` now, to the API later
- **Ship a service worker + manifest** — offline, installable, and it makes the
  daily-habit premise actually work on a commute

*Exit criterion: nothing in the core loop tells the student something false.*

### Phase 1 — Don't lose the student's work *(1–2 weeks)*
- **Backend + accounts.** Email or phone sign-in, one `progress` blob per user
  to start — the state is already a single serialisable object, so v1 sync is
  genuinely small.
- **Migration path**: an existing local player must be able to claim their
  progress without losing it. Guest-first, sign-in optional, prompt after the
  first completed lesson.
- **Analytics** — where students drop off. Right now we are flying blind, and
  every prioritisation decision after this phase is a guess without it.

*Exit criterion: a student can change phones and keep their streak.*

### Phase 2 — The other half of the exam *(the big one, 1–3 months)*
- **Verbal content**: التناظر اللفظي، إكمال الجمل، استيعاب المقروء، الخطأ السياقي
- New question formats and renderers (reading passages need a different layout
  from a maths stem — this is real UI work, not just data entry)
- Extend `S.track` so علمي and أدبي get correctly weighted paths
- **Rebuild the mock as a true GAT simulation** — both sections, real timing,
  real proportions
- **Calibrated score prediction** on the Qiyas scale

*Exit criterion: we can honestly call this a قدرات app rather than a كمي app.*

### Phase 3 — Make it adaptive *(3–4 weeks)*
- **Placement test** — skip what you already know
- **Spaced repetition**: schedule reviews off `S.mistakes` + `S.qstats`, which
  already hold the data
- **Adaptive difficulty** using `q.difficulty` and per-question history
- **Skill decay** on path nodes so old lessons visibly need refreshing
- **Real leaderboards** (now that accounts exist), retiring the ghosts

*Exit criterion: two students with different strengths get different apps.*

### Phase 4 — Retention *(2–3 weeks)*
- **Push / email reminders**, anchored to their exam countdown
- **Student-set daily goal**
- **Weekly progress summary** — "your accuracy in الهندسة rose 12% this week"
- **Formula reference (قوانين)**, openable mid-question
- **Timed drill mode**

### Phase 5 — Scale the content *(ongoing)*
- Grow the bank well past 720 — a committed student will exhaust it
- Formal answer-key review pass, driven by Phase 0's report button
- More figures, more comparison items

---

## 6. Definition of done

We can call this complete when a student can:

1. Sign up, and never lose progress across devices or browsers ▸ *Phase 1*
2. Take a placement test and start where they actually are ▸ *Phase 3*
3. Practise **both** verbal and quantitative ▸ *Phase 2*
4. Sit a full mock that mirrors the real GAT and get a predicted score ▸ *Phase 2*
5. Be told what to review, and when, without deciding for themselves ▸ *Phase 3*
6. Be reminded before the streak breaks ▸ *Phase 4*
7. Look up a rule without leaving the question ▸ *Phase 4*
8. Report a bad question and see it fixed ▸ *Phase 0*
9. Use it offline ▸ *Phase 0*
10. Open it on exam morning and know whether they are ready ▸ *all of the above*

---

## 7. If we only do three things

1. **Fix C2 and C4.** Hours of work. The app is currently lying to every
   student on every lesson and rewarding them with a brown star.
2. **Build the backend.** Every day we wait, more students accumulate progress
   that one cleared cache will erase, and every retention feature stays blocked
   behind it.
3. **Build the verbal section.** Until then we are a كمي app calling itself a
   قدرات app, and half of every أدبي student's exam is someone else's problem.

Everything else on this document is optimisation. These three are the product.
