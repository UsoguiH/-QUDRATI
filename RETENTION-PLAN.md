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
- [ ] Per-question difficulty authored in `qudrat-lessons-duolingo.md`, read by the importer,
      falling back to the lesson stars where absent so it can land lesson by lesson
- [ ] Lessons 1–3 rated first, then the rest
- [ ] A bridging step where the gap between a quick check and its first question is still too
      wide after reordering

### R3 — The unlosable opening
- [ ] The first lesson of a new save cannot be failed
- [ ] Time to the first celebration measured and cut

### R4 — Every beat answered
- [ ] The silent moments in the loop found and given their beat, within the no-confetti rule

### R5 — The comeback
- [ ] The student leaves session one knowing what is waiting tomorrow, and that it is small

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
