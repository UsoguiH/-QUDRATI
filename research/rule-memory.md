# Rule memory: learn it in minutes, keep it for 90 days

Research brief for Qudrati, 2026-10-26. Goal: a student meets a rule such as «المجموع = العدد × عدد مرات تكراره» in a short lesson, can use it before the lesson ends, and can still use it on exam day about 90 days later.

---

## 1. What the evidence says, briefly

| Finding | What it means for a rule app | Source |
|---|---|---|
| **Retrieval beats re-reading.** Recalling from memory produces far better retention at one week than studying again, although re-reading *feels* better right away. The effect holds in real classrooms. | Every review must make the student *produce* the rule or use it. Showing the card again is not a review. | Roediger & Karpicke 2006; Agarwal, Nunes & Blunt 2021 (50 classroom experiments) |
| **Spacing has a ridgeline.** For a fixed test delay, retention first rises and then slowly falls as the gap between sessions grows. The best gap is about 20% of the delay for delays of a few weeks and about 5–10% at a year. Gaps that are too short cost more than gaps that are too long. | For a 90-day horizon the gap between late reviews should settle at **2–3 weeks**. Early reviews must come sooner, while the memory is still fragile. | Cepeda, Vul, Rohrer, Wixted & Pashler 2008 |
| **Expanding versus uniform gaps.** Across 29 studies, spaced retrieval beat massed retrieval (g = 0.74), and expanding gaps did not beat uniform ones overall (g = 0.03). Expanding gaps gained the more often an item was tested. | Spacing matters more than the exact shape. With 6–8 reviews per rule, mild expansion is justified, but drive it by **success**, not a fixed table. | Latimier, Peyre & Ramus 2021 |
| **Successive relearning.** Retrieve each item correctly once in each of 3 or more spaced sessions, relearning it inside the session whenever it is missed. This roughly doubled recall compared with three correct recalls in one session, and still left about 77% recalled weeks later. | A missed rule is re-asked later *in the same review* until it is right once, then rescheduled. | Rawson & Dunlosky 2011; Rawson, Dunlosky & Sciartelli 2013 |
| **The forgetting curve is steep, and sleep helps.** The replication found 47% savings at 20 minutes, 32% at one day and 4% at 31 days, with an upward bump at 24 hours that the authors link to sleep. Sleep after learning consolidates new memories. | The first review should come **the next day, after a night's sleep**. Never put the first review on the same evening. | Murre & Dros 2015; Diekelmann & Born 2010 |
| **Interleaving works best in maths.** Mixing problem types forces the student to *choose* the method. One study found d = 0.79 on a test 30 days later. A randomised trial in 54 classes found 61% vs 38% (d = 0.83). | Reviews and mixed sets should shuffle rules, especially rules that look alike. | Rohrer, Dedrick & Stershic 2015; Rohrer, Dedrick, Hartwig & Cheung 2020; Rohrer & Taylor 2007 |
| **Overlearning fades.** Extra repetitions in one sitting help for a week and are mostly gone within a few weeks. | Do not pad a lesson with ten more reps of the same rule. Spend those seconds on later reviews. | Rohrer, Taylor, Pashler, Wixted & Cepeda 2005 |
| **Pretesting and prediction.** A failed guess before instruction improves later learning. Errors made with high confidence are corrected best (hypercorrection), and curiosity raised before an answer improves memory for it. | Open with a guess. Surprise, the "wait, that's it?" moment, is the usable form of emotional arousal. | Richland, Kornell & Kao 2009; Kornell, Hays & Bjork 2009; Butterfield & Metcalfe 2001; Gruber, Gelman & Ranganath 2014; McGaugh 2004 |
| **The generation effect.** What you produce is remembered better than what you read (meta-analysis d ≈ 0.40). Comparing two worked examples helps learners pull out the rule. | Let the student complete or state the rule from examples before the app says it. | Slamecka & Graf 1978; Bertsch et al. 2007; Rittle-Johnson & Star 2007 |
| **Worked examples, fading and expertise reversal.** Novices learn more from studied examples than from solving problems. Fading the steps one at a time helps them hand over to solo solving. For learners who already know the material, the examples get in the way. | Use examples first, then fade them. Let a fast correct pretest skip the example screens. | Sweller & Cooper 1985; Renkl & Atkinson 2003; Kalyuga et al. 2003 |
| **Self-explanation and elaborative interrogation.** Asking "why is this true?" helps (meta g ≈ 0.55), and works best as a short prompt. | One tap: «ليش تشتغل؟». | Chi et al. 1989; Bisra et al. 2018; Dunlosky et al. 2013 |
| **Concreteness fading and dual coding.** Concrete picture → diagram → symbols beats starting with either the picture or the symbols alone. A picture plus words gives memory two codes. | Start with groups of objects, fade them to numbers, then to the rule, and keep a mini picture on the rule card as a cue. | Fyfe, McNeil, Son & Goldstone 2014; Paivio 1971/1991; Mayer 2009 |
| **Mnemonics.** The keyword method is rated low utility. It works for word pairs and fades over time, and rhymes help recall the *form* of a formula, not *when* to use it. | A hook is a **name and cue** for the rule, not the learning itself. | Dunlosky et al. 2013 |
| **Desirable difficulties.** Spacing, testing, interleaving and variation slow how fast a student *seems* to learn and improve how much they keep. Students rate them as worse. | Expect review to feel harder. Reward effort and do not let review feel like failing. | Bjork 1994; Bjork & Bjork 2011 |
| **Maths versus vocabulary.** Vocabulary is a paired association, so a flashcard is the right review. A maths rule is a *procedure plus a condition for using it*. Retrieval practice transfers to application only moderately unless practice itself involves applying the rule. | A rule review should mostly be **a fresh problem the rule solves**, plus naming the rule now and then. Reciting it is not enough. | Pan & Rickard 2018; Rohrer & Taylor 2006 |

### How Duolingo and others do it

- **Half-Life Regression** (Settles & Meeder 2016) models recall as *p = 2^(−Δ/h)*, where Δ is the days since the last practice and *h* is a half-life learned from right and wrong counts plus item difficulty. It cut recall-prediction error by more than 45% over baselines and raised daily engagement in an A/B test. It is Duolingo's oldest AI system (2013) and picks what goes into practice sessions. A 2026 paper revisits it for explainable, personalised scheduling.
- **Birdbrain** predicts whether a given learner will get a given exercise right. As reported, it serves items at roughly a 70% chance of success when the learner is doing well, and easier items when they are struggling (Duolingo blog; IEEE Spectrum).
- **The path (2022)** puts practice *inside* the path and orders lessons so concepts come back after growing gaps. Duolingo reports that learners on the path review more. **Legendary** is a harder replay with no hints, now per unit. **Practice Hub** rotates personalised reviews daily and keeps a Mistakes list (Duolingo blog: "new home screen design", "guide to Practice Hub", "spaced repetition for learning").
- **Duolingo Math** draws its visuals in code, so a skill can grow its number range (to 10, then 100, then 500) on new numbers each time. That is the same idea as Qudrati's generator items (Duolingo blog: "developing math"). No efficacy study of Duolingo Math was found.
- **Khan Academy Mastery Challenges** are 6 questions on 3 earlier skills, spaced and mixed, with at least 12 hours between them. A skill counts as "Mastered" only after it is answered right *in a mixed setting*.
- **Brilliant and Mathigon** put a problem first, reveal the explanation step by step, and use little text. That is generation plus concreteness.
- **Anki for maths:** experienced users make cards that ask for *use* ("compute 1+…+40") rather than recitation. FSRS (Ye et al. 2022) is the modern scheduler for the same job.

---

## 2. Recommendations, ordered by expected impact

### (b) First: a 90-day retention system for rules (highest impact)

Qudrati currently spaces **questions**. Rules are never scheduled, so a rule learned in week 1 is unpractised by week 8 unless a bank question happens to need it. Without reviews, most of it will be gone (Murre & Dros 2015). This is the largest gap.

**1. Track each rule, not just each question.** Store each rule in localStorage like this:

```js
S.rules["skills.bigsum:2"] = { h: 2.5, last: "2026-10-26", n: 0, lapse: 0, ok: 0 }
```

**2. A small HLR model that fits in a localStorage app.**

- Recall probability: `p = 2 ** (-daysSince(last) / h)`.
- A rule is **due** when `p < 0.8`, which is when `Δ ≥ 0.32·h`.
- Start: `h = 3` after the first lesson. With that, the first review lands next day, after sleep.
- After each review:
  - right, fast, no help: `h *= 2.5 · d_rule · s_student`
  - right but slow or with a hint: `h *= 1.5`
  - wrong: `h = max(2, h * 0.4)`, add 1 to `lapse`, and re-ask the rule later in the same session until it is right once (successive relearning). A lapse also lowers that rule's growth from then on.
- The two factors:
  - `d_rule` is an authored ease from 0.8 to 1.2. Order of operations is hard; repeated addition is easy.
  - `s_student` is `clamp(0.8, 1.2, ruleAccuracy / 0.85)`. It personalises the model the way HLR's features do, with no server needed.
- Caps:
  - The interval never goes past **21 days**, which is about 20% of 90, the ridgeline.
  - The interval never goes past `daysToExam − 3`, so every rule gets a final check before the exam.

**3. The resulting schedule.** For a student who answers every review right, the intervals come out at about **1 → 3 → 7 → 15 → 21 → 21 … days**, plus the exam window. That is 6–8 reviews per rule over 90 days, about **2 minutes per rule in total**.

**4. What a review item is.** It takes 10–20 seconds, and it is always retrieval. Rotate through these four shapes:

- **Apply with fresh numbers** (the default, about 60%). Reuse the learn.js generators. Example: «٩ + ٩ + ٩ + ٩ + ٩ + ٩ + ٩ = ؟» with a keypad answer, never multiple choice.
- **Name the rule from a problem** (about 20%; this is also the interleaving item). Example: «أسرع طريقة لحل ١ + ٢ + … + ٤٠؟» with three rule names to choose from.
- **Recall the rule itself** (about 10%). Example: «المجموع = ___ × ___». The tiles include terms from look-alike rules, or the student types and then checks themself.
- **Spot the error** (about 10%). Example: «أحمد كتب: ١+…+٢٠ = ٢٠ × ٢٠ ÷ ٢. وين الغلط؟»

Each review item works like this:

- It has no hearts and no timer at first. Once a rule's `h > 14`, add a soft 20-second pace, because the exam is timed.
- A wrong answer shows the `see` card's rows for 3 seconds (feedback after retrieval), and the rule comes back later in the same session.

**5. How rules are interleaved.**

- A review set draws from 3 or more lessons and never puts the same rule twice in a row.
- It deliberately pairs rules that look alike, for example:
  - «١ إلى ن» with «مجموع الفردية»;
  - «أ٪ من ب» with an ordinary percent calculation.
- Discriminating between similar rules is where interleaving pays off most (Rohrer 2012).

**6. Daily load and fitting it into the habit.**

- The load: about 150 rules × 7 reviews ÷ 90 days ≈ **12 reviews a day, about 3 minutes**.
- Cap it at **10–15 a day**. When more are due, serve the lowest-`p` rules first. Overflow rolls to the next day; it is never shown as a backlog number.
- Where the reviews go:
  - **The lesson warm-up:** the first 3–5 items of every lesson are due rules. This extends the existing `recall` item to all due rules.
  - **A review node on the path every 3 nodes,** the way Duolingo builds practice into its path.
  - **The `dueCard`:** «٨ قواعد تحتاج تذكير — دقيقتين».
- Reviews count toward the daily goal and the streak and earn XP, so they never compete with progress.
- Never show more than about 15 items in one sitting. That keeps reviews from burning students out, and Duolingo's short sessions are built on the same idea.
- The existing `stale` mark on a node can light up when its rules' average `p` drops below 0.6.

**7. The last 14 days before the exam** (Qudrati already stores `S.exam`):

- **Days −14 to −8:** a sweep. Every rule must be retrieved correctly at least once, lowest `p` first, which is one successive-relearning pass. Daily sets switch to interleaved, exam-format questions with the 60-second timer. Practise in the same format as the test (Morris, Bransford & Franks 1977).
- **Days −7 to −3:** a second sweep of only the rules missed or slow in the first one. Two mock exams. **No new lessons after day −5**, since a new rule then gets no spacing and crowds out the others.
- **Days −2 to −1:** a 10-minute light review of the 10 weakest rules, then stop. Show the message «نم ٨ ساعات — النوم يثبّت اللي راجعته» (Diekelmann & Born 2010).
- **No exam date set:** treat 90 days after the first lesson as the target.

### (a) How a rule is first met, to learn it in minutes

Here are six screen patterns, in lesson order, using «المجموع = العدد × عدد مرات تكراره» throughout.

**1. Guess before you know** (pretesting and surprise).

- The screen shows «٧ + ٧ + ٧ + ٧ + ٧ + ٧ = ؟» with a visible 5-second countdown and the line «خمّن بسرعة» (guess quickly).
- No wrong mark is shown. Then «٤٢» drops in with «في ثانيتين بدون جمع؟».
- The gap between the slow way and the fast answer creates the curiosity the rule then resolves.
- Sources: Richland et al. 2009; Gruber et al. 2014.

**2. Concrete, then fade it** (concreteness fading and dual coding).

- Six rows of seven dots appear. A bracket labels them «٦ مرات» and «٧ في كل مرة».
- The dots then collapse into «٦ × ٧».
- Keep a 40-pixel thumbnail of the dot rows on the rule card from then on, as the picture code and the review cue.
- Sources: Fyfe et al. 2014; Paivio.

**3. Two examples, then the student states the rule** (comparison and generation).

- Show «٥ + ٥ + ٥ + ٥ = ٤ × ٥» and «١٢ + ١٢ + ١٢ = ٣ × ١٢» side by side.
- Ask «وش المشترك؟», then the student builds «المجموع = ___ × ___» from 4 tiles: العدد / عدد مرات تكراره / آخر عدد / ٢.
- Only then does the yellow rule card confirm it, lighting the student's own words.
- Sources: Rittle-Johnson & Star 2007; Bertsch et al. 2007.

**4. Faded examples** (Renkl & Atkinson).

- Card A: «٨+٨+٨+٨+٨» → «٥ × ٨» → «٤٠», fully worked.
- Card B: «٩+٩+٩+٩» → «__ × ٩» → «__».
- Card C: «١١+١١+١١+١١+١١+١١» → solved alone on the keypad.
- If the guess in pattern 1 was right in under 3 seconds, skip straight to card C (expertise reversal).

**5. One-tap "why?"** (self-explanation).

- Ask «ليش ٦ × ٧ تساوي ٧+٧+٧+٧+٧+٧؟» with three choices:
  - «لأن الضرب يعني جمع العدد نفسه عدة مرات» (correct);
  - «لأن ٦ و ٧ متتاليين»;
  - «صدفة».
- Keep it to one screen. Explanations the student picks or builds themself beat explanations they are given.
- Sources: Chi 1989; Bisra 2018.

**6. A vivid hook as the rule's name, then a delayed check before leaving.**

- Give the rule a 2–3-word name in the student's dialect, for example «العدد × مرّاته». It becomes the cue on every later review card.
- The lesson ends with a **delayed recall**: after 3–4 other items, ask «اكتب القاعدة» from a blank, not from tiles, then one fresh-number problem.
- The first retrieval after a short delay is the one that sets up later retention (Karpicke & Roediger 2007). The real lock-in is tomorrow's review, after sleep.

The current lesson flow (`free` → `see` → `fill` → reps → write-the-rule) already covers patterns 1 and 3. The main changes:

- move the student's *own building of the rule* before the reveal (pattern 3);
- add the concrete fade (pattern 2);
- add the step-fade (pattern 4);
- end on blank recall rather than tiles (pattern 6).

### (c) Pitfalls to avoid

1. **Recognition passing as recall.** If the tiles in «عبّ القاعدة» are few and only the right ones fit, it tests recognition. Fade the scaffolds across reviews: tiles with look-alike decoys → initial letters only → typed answer or "say it, then check".
2. **Re-reading as review.** Reopening a rule book or a `see` card feels productive and does little (Roediger & Karpicke 2006). The guidebook can stay, but it must never count as a review.
3. **Massing inside the lesson.** Ten reps of one rule is overlearning that fades within weeks. Three to four varied items is enough; the rest belongs to spaced reviews.
4. **Fixed numbers.** Reviewing the same bank question teaches its *answer*, not the rule. Use generators for reviews and keep bank questions for transfer.
5. **Blocked-only practice.** If every item in a set uses the same rule, the student never practises *choosing* the rule, and choosing is what the exam tests.
6. **Same-day "spacing".** A second review on the same evening does not count as spaced. The minimum gap is one night.
7. **Reviews that punish.** Hearts and a fail screen on reviews make students avoid them. Keep reviews safe and short, and reward them with XP and the streak.
8. **Mnemonic as the method.** A rhyme without the dot picture and a "why" gives a student who can recite «آخر عدد × (آخر عدد + ١) ÷ ٢» but not tell when to use it.
9. **Backlog guilt.** Never show "47 reviews overdue". Cap the daily count and quietly re-prioritise by `p`.
10. **New content in the last 5 days.** It gets no spacing and competes with consolidation.

---

## Sources

- Agarwal, Nunes & Blunt (2021). Retrieval practice consistently benefits student learning. *Educ. Psychol. Rev.*
- Bertsch, Pesta, Wiscott & McDaniel (2007). The generation effect: a meta-analytic review. *Memory & Cognition* 35.
- Bisra, Liu, Nesbit, Salimi & Winne (2018). Inducing self-explanation: a meta-analysis. *Educ. Psychol. Rev.* 30.
- Bjork (1994); Bjork & Bjork (2011). Desirable difficulties.
- Butterfield & Metcalfe (2001). Errors committed with high confidence are hypercorrected. *JEP:LMC*.
- Cepeda, Vul, Rohrer, Wixted & Pashler (2008). Spacing effects in learning: a temporal ridgeline of optimal retention. *Psychol. Sci.* 19. https://www.evullab.org/pdf/CepedaVulRohrerWixtedPashler-PS-2008.pdf
- Chi, Bassok, Lewis, Reimann & Glaser (1989). Self-explanations. *Cognitive Science* 13.
- Diekelmann & Born (2010). The memory function of sleep. *Nat. Rev. Neurosci.* 11.
- Dunlosky, Rawson, Marsh, Nathan & Willingham (2013). Improving students' learning with effective learning techniques. *PSPI* 14.
- Fyfe, McNeil, Son & Goldstone (2014). Concreteness fading in mathematics and science instruction. *Educ. Psychol. Rev.* 26.
- Gruber, Gelman & Ranganath (2014). States of curiosity modulate hippocampus-dependent learning. *Neuron* 84.
- Kalyuga, Ayres, Chandler & Sweller (2003). The expertise reversal effect. *Educ. Psychologist* 38.
- Karpicke & Roediger (2007). Expanding retrieval practice promotes short-term retention, but equally spaced retrieval enhances long-term retention. *JEP:LMC* 33.
- Kornell, Hays & Bjork (2009). Unsuccessful retrieval attempts enhance subsequent learning. *JEP:LMC* 35.
- Latimier, Peyre & Ramus (2021). A meta-analytic review of the benefit of spacing out retrieval practice episodes. *Educ. Psychol. Rev.* 33.
- McGaugh (2004). The amygdala modulates the consolidation of memories of emotionally arousing experiences. *Annu. Rev. Neurosci.*
- Morris, Bransford & Franks (1977). Levels of processing versus transfer-appropriate processing. *JVLVB* 16.
- Murre & Dros (2015). Replication and analysis of Ebbinghaus' forgetting curve. *PLOS ONE* 10(7).
- Paivio (1971/1991). Dual coding theory. Mayer (2009). *Multimedia Learning*.
- Pan & Rickard (2018). Transfer of test-enhanced learning. *Psychol. Bull.* 144(7).
- Rawson & Dunlosky (2011), *JEP:General* 140; Rawson, Dunlosky & Sciartelli (2013), *Educ. Psychol. Rev.* 25. Successive relearning.
- Renkl & Atkinson (2003). Structuring the transition from example study to problem solving. *Educ. Psychologist* 38.
- Richland, Kornell & Kao (2009). The pretesting effect. *JEP:Applied* 15.
- Rittle-Johnson & Star (2007). Does comparing solution methods facilitate learning? *J. Educ. Psychol.* 99.
- Roediger & Karpicke (2006). Test-enhanced learning. *Psychol. Sci.* 17.
- Rohrer & Taylor (2006, 2007). Overlearning and spacing in maths; the shuffling of mathematics problems. *Appl. Cogn. Psychol.*; *Instr. Sci.* 35. Rohrer, Taylor, Pashler, Wixted & Cepeda (2005). Overlearning. *Appl. Cogn. Psychol.* 19.
- Rohrer, Dedrick & Stershic (2015). Interleaved practice improves mathematics learning. *J. Educ. Psychol.* 107. Rohrer, Dedrick, Hartwig & Cheung (2020). A randomized controlled trial of interleaved mathematics practice. *J. Educ. Psychol.* 112.
- Settles & Meeder (2016). A trainable spaced repetition model for language learning. *ACL*. https://aclanthology.org/P16-1174/
- Slamecka & Graf (1978). The generation effect. *JEP:HLM* 4.
- Sweller & Cooper (1985). Worked examples in learning algebra. *Cognition & Instruction* 2.
- Ye, Su & Cao (2022). A stochastic shortest path algorithm for optimizing spaced repetition scheduling (FSRS). *KDD*.
- Duolingo blog: Birdbrain (https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain); new path design (https://blog.duolingo.com/new-duolingo-home-screen-design); Practice Hub (https://blog.duolingo.com/guide-to-duolingo-practice-hub/); spaced repetition (https://blog.duolingo.com/spaced-repetition-for-learning); Duolingo Math (https://blog.duolingo.com/developing-math). IEEE Spectrum, "How Duolingo's AI learns what you need to learn" (https://spectrum.ieee.org/duolingo).
- Khan Academy, Mastery Challenges and mastery levels (https://support.khanacademy.org/hc/en-us/articles/360037494231).
