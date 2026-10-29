# Law 3: the synthesis

*2026-10-28. Merges the four tracks in this folder:*
- *`t1-memory.md`: memory science beyond `research/rule-memory.md`;*
- *`t2-compulsion.md`: what makes feeds hard to put down;*
- *`t3-audience.md`: Saudi students aged 16–18;*
- *`t4-teardown.md`: Duolingo, Brilliant, Anki, maths shorts, feed apps.*

*It also builds on the two persona rounds (`research/rule-study.md`, `rule-study-2.md`). This page is the brief for `tools/law3.html`.*

---

## 1. Seven things all four tracks agree on

1. **A rule has two moments, and they need different designs.**
   - **The first meeting** (about 90 s) has one job: a single "aha", then three correct uses.
   - **The return** (10–15 s cards, over 90 days) is where both memory and the urge to come back live.
   - The persona rounds only polished the first meeting. That is why no lesson scored above 6.9/10 on "come back".
2. **The review must be an action, never a re-read.** Every product with evidence makes the student produce an answer (T4). For maths, the action must be a *fresh problem in exam format*, not reciting the formula:
   - retrieval carries over to new problems at d = 0.40, and 0.58 when practice looks like the test (T1);
   - in maths alone, testing versus restudy is only g = 0.18 (T1).
3. **Commit, then snap.** Each card locks until the student answers. Then the trick plays on *those* numbers in about a second. It is three things at once:
   - the reel's open loop (T2);
   - curiosity before the answer, which aids memory (Kang 2009; Gruber 2014);
   - elaborated feedback (g 0.49 vs 0.05 for right/wrong only, T1).
4. **Show the trick first, then hand it over.** For a new *procedure*, worked examples beat being tested cold (Yeo & Fazio 2019, T1). Struggling first helps understanding but hurts beginners' fluency.
   - So the guess at the start is a *hook*, not a test: no red, no penalty.
   - Then the trick plays on the numbers, and the student does one step of it.
5. **A finite stack, not an infinite feed.**
   - Zero friction to the next card, a visible count, a real end, extra rounds only by choice.
   - It feels like TikTok without breaking EU 2025 guidance for minors (T2), and it matches Wordle, Khan and Clash Royale (T4).
6. **Respect is the lever at 16–18** (T3: Yeager 2014/2018). That means:
   - prove-to-skip for students who already know a rule;
   - a diagnosis on a miss, not praise inflation;
   - a voice like a sharp older student: «صح — ٤ ثوانٍ»;
   - no countdown while learning;
   - gender-neutral wording.
7. **Celebrate surprise, not routine** (Schultz; Danek 2013, T1/T2).
   - A small beat for an expected right answer.
   - A big beat only for a fading rule recovered, or a real personal best.
   - Effects on the verdict only, never while a problem is being read.

## 2. The scheduler (from T1, replaces rule-memory.md §(b)2)

- **Model:** FSRS-6 with its published defaults, run in plain JS with about 50 bytes per rule.
- **Settings:** target recall 0.85; gap capped at 20% of the days left, at most 21 days; one forced check 4–10 days before the exam.
- **First review:** the next calendar day, after sleep.
- **Grading:** the app grades and the student never self-rates. Wrong = Again; right but slow or helped = Hard; right first try = Good.
- **When a rule enters the scheduler:** only after **3 correct unaided uses** in the first meeting. Otherwise it is re-taught tomorrow, because spacing a never-learned rule does nothing.
- **Expected cost:** about 7 reviews per rule over 90 days, about 5 minutes in total, after the correction below.
- **Correction measured while building (`node` simulation, all reviews Good):**
  - **T1's cap as written** (20% of the days *left*) shrinks as the exam nears. It gave **15 reviews** for a rule learned on day 0, not the ~5 T1 reported.
  - **Plain FSRS defaults** jump day 1 → day 15. That is too long for a fresh maths procedure, since the defaults were fitted on adults' flashcards.
  - **`tools/law3.html` uses an early ladder instead:** the gap is capped at 3, then 7, then 14 days for the first three reviews (the successive-relearning dose), then 21 days, plus the forced check a week before the exam.
  - **Result:** reviews on days 1, 4, 11, 25, 46, 67 and 83. That is 7 reviews, with predicted recall on exam day ≈ 0.99 under the defaults.
- **The flaw:** FSRS defaults were fitted to adults' flashcards, so real teen recall will run lower. That is why we measure.

## 3. The flow being tested

**First meeting, 6 screens, target 90–120 s:**

| # | Screen | Pattern (T4) | Why |
|---|---|---|---|
| 1 | **The hook.** A product that looks slow; a guess from 4 choices; no clock, no red. Then two lanes: the slow way ticks along while the trick lands in one line | Guess first + slow vs fast | Curiosity and a visible gain. A right guess unlocks «أعرفها — نتخطى» (prove-to-skip) |
| 2 | **Find the middle.** Tap the middle on a number line; tap the distance; the trick builds on those numbers | Tap to discover | Generation, but one interaction, not three (mint's length lesson) |
| 3 | **Why.** Tap once and the extra strip of the rectangle moves round into a square with one small corner missing | Visual why | The «÷ ٢ staircase» lesson from round 1: a picture beats a formula |
| 4 | **The rule in one line**, its terms lit, with a name | One-line rule | The name is the cue on every later card |
| 5 | **Three uses, faded:** exam comparison (4 fixed choices), a when-to-use trap, then a typed product on the keypad | Fresh numbers + trap | Criterion 3. The trap teaches *when*, which is what the exam tests |
| 6 | **What you kept.** The rule enters «دفتر قواعدي» with its strength and the next check | Peak-end + visible strength | The reason to come back (T2 bet 8) |

**The return: a stack of 4 cards, about 45 s:**
- **Card 1 is the measurement:** a cold, fresh-number problem, timed silently.
- **Cards 2–3 rotate:** comparison, spot the error, backwards, when-to-use.
- **Card 4 is an easy win**, to end on a high.
- **On a miss:** the trick replays on those numbers for 3 s, and the card returns later in the stack with new numbers, tagged «رجعت لك».
- **The ending:** the strength meter refills, with a big beat only if the rule had been fading.

## 4. The rule

**«حيلة النص»: two numbers the same distance from one middle.**
- The product = the middle² − the distance².
- Example: ٤٧ × ٥٣ = ٥٠² − ٣² = ٢٥٠٠ − ٩ = ٢٤٩١.

**Why this rule:**
- **It is a real Qudrat skill.** Comparisons such as ٤٩ × ٥١ against ٥٠², and mental products such as ٩٨ × ١٠٢.
- **It has a visual why:** a rectangle becomes a square with its corner missing.
- **It has a real when-to-use trap:** ٤٦ × ٥٣ is not symmetric.
- **It gives a strong hook:** «٤٧ × ٥٣ بدون ورقة؟».
- **Most students never learned it as a mental-maths trick**, even those who know a² − b² from algebra.

**Guard:** at the end of the first meeting, the prototype asks whether the trick was new. A "no" marks the run as contaminated in the data.

## 5. How the user tests it (n = 1, real data)

- **Recording:** state lives in the browser's `localStorage`. Every card records the day, the item type, right or wrong, and the seconds taken.
- **The curve:** recall plots against real elapsed days, beside the FSRS prediction.
- **Practice:** «جرّب شكل المراجعة» runs a stack that is *not* recorded, so the feel can be judged today without spoiling tomorrow's measurement.
- **Simulation:** `?sim` uses separate storage, with a +1 / +3 / +7 day jump to preview the whole 90-day loop.
- **Export:** «نسخ النتائج» copies a code to paste back here.

**Limits:**
- One tester, who is also the designer and not 16–18.
- It measures *recall*; it cannot measure *teen appeal*. Persona rounds stay the tool for "is this cringe".

## 6. Lines not to cross (T2 §D, kept)

- No infinite feed and no autoplay into extra cards.
- No countdown in learning or review.
- No random payouts.
- No guilt copy.
- One notification at most, at a time the student chose.
- Stopping is one tap, with progress kept.
- The league's simulated rivals deserve a findable disclosure again. That is a separate decision for the owner.
