# The first five minutes

**The goal, in the owner's words:** «these exercise is very easy and then the question after
that is very hard» — and «we want the user enter the app excited. if he feels that the app is
too hard or he can't do it he will give up, so we want to give him the dopamine of TikTok that
lets him complete and don't give up. we want to add addict to study. the most important part is
the beginning — if we can make the student stay at the beginning then we earned the student.»

Branch: `NewFeature`, continuing from the completion sprint.

## What "the dopamine of TikTok" means for a study app

TikTok does not hold anyone with novelty alone. It holds them because the cost of the next unit
is near zero, the reward arrives before boredom does, and nothing ever asks you to be good at
something before it gives you anything. None of that requires a slot machine, and none of it
requires lying to a student about their progress.

Translated into this app, and in this order:

1. **Nothing may ask before something gives.** The student should have won something before the
   app asks them to commit, choose, or be measured.
2. **No cliff a student cannot climb.** Between two consecutive things a student meets, at most
   one new thing may be added: a bigger number, or one more operation, or a new notation. Never
   two at once. The shape we currently ship in places is *toy → exam*.
3. **The first session cannot be lost.** A student who fails before their first win screen does
   not come back, and there is nothing to learn from failing at minute three.
4. **Every beat is answered.** A correct answer, a run, a chunk finished, a lesson finished: each
   has its own sound and its own motion, and none of them is silent.
5. **The comeback is visible on day one.** They should leave knowing exactly what is waiting
   tomorrow and that it is small.

## What is already true

Worth stating so the work is not re-done. The loop already has: an honest progress bar that
counts retries, a question counter, praise that varies with the run and the halfway mark, stars
that pop on the win screen, a five-heart budget rather than three, a timer that holds when the
phone is put down, a mascot celebration with no confetti, a streak screen, a daily chest scaled
to a goal the student sets, spaced repetition, and a placement test so a strong student does not
grind lesson one.

The gap is not the reward machinery. It is **the difficulty curve and the opening sequence**.

## The finding that shapes the work

Every question carries `difficulty` equal to its **lesson's** star rating —
`tools/import_curriculum.py` assigns `les["stars"]` to all ten. So all ten questions of lesson one
read as difficulty 1, and the app cannot tell the gentlest from the hardest.

That matters more than it looks, because **the ramp machinery already exists and is running on
empty**:

- `pickLessonQuestions` already ends with `chosen.sort((a, b) => a.difficulty - b.difficulty)`.
  With one value per lesson that sort is a no-op.
- `teachArrange` then sorts the queue by chunk only, and `Array.prototype.sort` is stable, so a
  real per-question difficulty would order correctly *within* each chunk for free.

And `tools/validate.js` does **not** enforce non-decreasing difficulty — it computes an `ordered`
flag and prints it in the per-lesson summary. It never sets `failed`. So authoring difficulty per
question costs a markdown notation, an importer change, and the content work of rating — not a
validator fight.

## The waves

### R1 — Measure the cliff
- [ ] Reconstruct the exact item order a student meets, per lesson, including the interleaved
      teaching cards and quick checks
- [ ] Score every item for load: operations, operand size, notation introduced, rules to combine
- [ ] Rank every jump in the app, and name every cliff in lessons 1–3

### R2 — A ramp with no cliffs
- [x] Per-question difficulty authored in `qudrat-lessons-duolingo.md`, read by the importer,
      falling back to the lesson stars where absent so it can land lesson by lesson — a star
      marker between the number and the stem, `**٨)** ★★ …`
- [x] The ramp check moved to where it can be true: `tools/validate.js` was measuring file
      order, which is not the order the app serves; `tools/validate_teach.js` now knows the
      chunks and lists every step wider than one star as a cliff
- [x] Lesson one rated, and verified in a real browser: a new save's first question is now
      `٤٥ + ٤٥ + ٤٥ + ٤٥ + ٤٥ + ٤٥`, not `٨ + ٢ × (٧ − ٤)² ÷ ٦`
- [x] The cliff in `skills.bigsum` bridged — and the audit found it was not only a size jump:
      the chunk rehearsed one rule and graded another. Chunks now teach a rule, rehearse it,
      teach the next and rehearse that
- [x] The same mismatch fixed in lessons 2 and 3, and lesson 3's counting chunk split so the
      combinations rule has its own rehearsal
- [x] The comparison format rehearsed before it is graded. It is 35 of 255 questions, reaches
      a student as question four of lesson three, and had no rehearsal anywhere — its fourth
      option «المعطيات غير كافية» appeared nowhere in the teaching layer at all
- [x] The cliff check now fails the build rather than listing, so a future rating that
      introduces a cliff has to be bridged before it ships
- [ ] Lessons 4–26 rated (245 questions). Rate against the app's whole scale, not the lesson's:
      `difficulty` also drives the XP and gem payout per question (`[0,6,10,16]` / `[0,3,5,8]`),
      so rating a lesson's hardest question ★★★ inside a ★ lesson inflates what it pays

### R3 — The unlosable opening
- [x] The first lesson of a new save cannot be failed — no hearts in the header, no heart lost,
      no fail screen; verified by answering twenty questions wrong on a fresh save. It is
      untimed too, so a slow reader is no longer scored wrong on a question they never answered
- [x] Because it cannot end honestly by failing, the win screen does it: under 50% it reads
      «خلّصت درسك الأول» and «راجع أخطاء الدرس» becomes the green button
- [x] Time to the first celebration measured and cut. Eleven screens and about 2:23, four of
      them asking and none giving; now disclaimer, name, value screen, path. The placement
      test — twelve questions from the medium-and-hard end of all four units with no teaching
      card behind any of them — moved from screen five to after the first win, and its green
      button became the gentle answer

### R4 — Every beat answered
- [x] The gems a lesson banks are visible as they are earned, not only on the win screen
- [x] Finishing a chunk makes a sound; it was silent
- [x] The chest is reachable in session one. The goal is ten and a lesson serves eight, so a
      perfect first lesson ended on ٨/١٠ and never saw the ceremony — while a student who got
      everything wrong reached ten through the retries and did. Quick checks now count
- [x] The first correct answer ever has its own line rather than the fifth of a rotation

### R5 — The comeback
- [x] On day one the streak screen says «ارجع بكرة وتصير سلسلتك يومين — درس واحد يكفي», and
      the chest they can now reach is waiting on the path behind it

## Defects found on the way, and fixed

- The daily mix could fail: five hearts, a mode missing from `NO_FAIL`, and `sessionFailed`
  reading a `domKey` that is null there — it threw on the retry button
- «باقٍ لك ٩٩٨ من القلوب» in every heartless mode
- Review and the daily mix ran a countdown, which `CLAUDE.md` has always said they do not
- A timeout hid the solution behind a toggle while a wrong guess showed it open
- The «ابدأ» bubble sat on top of the finished lesson's title on the path
- `preview.html#fb` and `#fbgood` could not open at all: every lesson teaches cards now, so
  `renderSession()` opened one instead of a question

## Still open

- 245 questions to rate. Rate against the app's whole scale, not the lesson's: `difficulty`
  also drives the XP and gem payout per question
- The track is still a no-op — all 255 questions are `track:"both"`. Either tag them, or the
  literary track stays a Settings row that changes nothing

## Rules this work keeps

Everything the completion sprint kept still holds: no npm, no bundler, no build step; Eastern
Arabic digits in everything a student reads; RTL is the layout; no confetti, particle sprays or
rings; قدّور on exactly three screens; the four question files stay generated from the markdown;
`node tools/validate.js` and `node tools/validate_teach.js` pass before every commit.

One more, specific to this work: **the material may not get easier than the exam.** Scaffolding,
ordering and bridging are in scope. Making the questions weaker is not. The goal is a student who
can pass, not a student who feels good and fails.

## The agent

`.claude/agents/onboarding-designer.md` is the specialist this work is run through: it judges
every change against the first five minutes, measures before it claims, and knows the product's
constraints so it cannot recommend a fourth mascot placement or a confetti burst.
