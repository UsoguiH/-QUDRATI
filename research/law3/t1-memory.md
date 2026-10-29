# T1 — Memory science for a maths rule: learn in 90 seconds, keep for 90 days

Track 1 of the law3 round, 2026-10-28. It builds on `research/rule-memory.md` and does not repeat it.
Tags: **[strong]** meta-analysis or RCT · **[moderate]** several studies or one large field study · **[weak]** one small study · **[hype]** popular claim, poor evidence. **[model]** marks our own simulation, not data.

---

## (A) TL;DR — what is new compared with rule-memory.md

1. **Maths is a weaker case than vocabulary.** The first maths-only meta-analysis found spacing g = 0.28 and testing-vs-restudy g = 0.18, and the testing effect was not reliable (Murray et al. 2025). Expect smaller gains, and design every review as *application*.
2. **Procedures behave differently from facts.** Successive relearning gave only d = 0.28 for maths procedures (Rawson, Dunlosky & Janes 2020). To *acquire* a new procedure, studying worked examples beat being tested on it (Yeo & Fazio 2019; Huang et al. 2023). So: example first, retrieval only once the rule has been understood.
3. **Retrieval transfers to new problems at d = 0.40, and only under conditions.** Transfer is larger when practice answers look like the exam's (d = 0.58 vs 0.28), when first-try accuracy is high, and when practice is elaborated (Pan & Rickard 2018).
4. **Minimum dose.** Get 3 correct recalls in the first session, then 3 spaced relearning sessions (Rawson & Dunlosky 2011, 2022). Relearning wipes out most differences in first-session criterion (Vaughn et al. 2016). That is about **5 touches per rule plus one check before the exam**, not 6–8.
5. **Replace the homemade HLR with FSRS-6 on its default parameters.** On ~350 M reviews, FSRS-6 scores log loss 0.346 against HLR's 0.469 (srs-benchmark). It runs in plain JS, needs ~40 bytes per rule and no training.
6. **Target 0.85 retention between reviews**, cap gaps at 21 days, and force one check 4–10 days before the exam. In our simulation that costs about 5 reviews per rule **[model]**.
7. **Tiny sessions are fine.** What matters is how many spaced sessions there are and how far apart (Karpicke & Bauernschmidt 2011; Bahrick et al. 1993). The "microlearning +50%" claims are vendor numbers **[hype]**.
8. **Feedback timing barely matters** (ManyClasses: effect 0.002). **What the feedback says** matters a lot: an explanation gives 0.49, right/wrong alone gives 0.05 (Van der Kleij et al. 2015). Struggle-first helps understanding (g = 0.36) but not procedural fluency, and it hurts beginners (Sinha & Kapur 2021).
9. **Surprise and "aha" do help memory.** Insight solutions were recalled 64% vs 52% at two weeks (Danek et al. 2013), and teens are especially reward-sensitive (Davidow et al. 2016). Only *unexpected* reward carries a prediction error, though. Confetti on every answer does not. "Dopamine hit" gamification talk is **[hype]**.
10. **Spacing helps middle performers most.** Weak students need one correct encoding before spacing pays (Barzagar Nazari & Ebersbach 2019; Ruitenburg et al. 2025). Five-hour nights damage teens' encoding (Cousins et al. 2017). Retrieval practice protects recall under exam stress (Smith et al. 2016).

---

## (B) Findings

| # | Finding | Evidence + strength | What it means for a rule screen or review card |
|---|---|---|---|
| 1 | Spacing works in maths, but the effect is smaller than in other domains: g = 0.28 overall, 0.43 in isolated studies, 0.24 inside real courses. Testing vs restudy in maths was g = 0.18, with a CI crossing zero (7 studies). | Murray, Horner & Göbel 2025, *Educ Psychol Rev* 37 **[strong, but few maths testing studies]** | Spacing is the safe bet. Do not assume flashcard-style recall of the formula will carry over. Reviews must be problems. |
| 2 | In real classrooms, distributed practice beat massed practice at d = 0.54 (22 reports, N > 3,000). Effects were larger with longer retention intervals and fewer re-exposures. | Mawson & Kang 2025, *Behav Sci* 15 **[strong]** | A 90-day horizon is where spacing pays most. Few, well-spaced reviews beat many close ones. |
| 3 | Successive relearning of **maths procedures** (probability problems, 431 students) beat single-session practice by only d = 0.28 on new problems one week later. | Rawson, Dunlosky & Janes 2020, *Educ Psychol Rev* 32 **[moderate]** | Relearning alone is not enough for procedures. Each relearning session should use **new numbers and a new surface**, so the student re-selects and re-runs the procedure rather than recalling an answer. |
| 4 | Recall of a worked example, or of a procedure on *identical* problems, favoured testing. Learning a procedure for *non-identical* problems favoured repeated study of examples. | Yeo & Fazio 2019, *J Educ Psychol* 111 **[moderate]**. Same direction in Huang, Zheng, Yu & Chen 2023, *Front Psychol* 14 (no retrieval benefit for word-problem skill) **[weak]** | In the first 90 seconds, show the worked trick (the `see` rows) before asking for any recall. Retrieval belongs *after* the procedure has been seen working twice. |
| 5 | Testing transfers to new questions at d = 0.40 overall. Transfer is d = 0.58 when practice and final answers overlap and 0.28 when they do not. Each +1 point of initial accuracy adds about 0.006 to d. Elaborated retrieval practice adds about 0.23. | Pan & Rickard 2018, *Psychol Bull* 144 **[strong]** | Review items in the **exam's own format** (MCQ, or comparison with `CMP_CHOICES`), tuned for **≥ 80% first-try success**, with the worked step shown after every answer. |
| 6 | The testing effect is larger with feedback, and larger when initial test performance is high. | Rowland 2014, *Psychol Bull* 140 **[strong]** | A review the student mostly fails teaches little. If a rule's success rate drops below ~60%, re-teach it (show the `see` card again) instead of testing it again. |
| 7 | Classroom quizzing raises achievement at g = 0.50 (222 studies). Corrective feedback, format match and repeated tests all moderate it. | Yang, Luo, Vadillo, Yu & Shanks 2021, *Psychol Bull* **[strong]** | This supports building the review into the daily habit rather than leaving it optional. |
| 8 | **Criterion and dose:** practise to 3 correct recalls first, then relearn 3 times at wide spacing, re-studying any miss until it is right once. Relearning sharply reduced the effect of the first-session criterion. | Rawson & Dunlosky 2011, *JEP:General* 140; Rawson & Dunlosky 2022, *Curr Dir Psychol Sci* 31; Vaughn, Dunlosky & Rawson 2016, *Mem Cogn* 44 **[strong for facts, moderate for procedures]** | Lesson: 3 correct uses of the rule, at least one after 3+ other items. After that, about 4 spaced successes before exam day. More reps in the first lesson are wasted seconds. |
| 9 | Absolute spacing matters, relative shape does not. Long gaps gave ~200% better retention than no gaps, and expanding, equal and contracting schedules did not differ. | Karpicke & Bauernschmidt 2011, *JEP:LMC* 37 **[moderate]** | Do not over-engineer expansion. Any scheduler that keeps gaps long and keeps the number of sessions up is near-optimal. |
| 10 | 13 sessions 56 days apart matched 26 sessions 14 days apart for retention over years. | Bahrick, Bahrick, Bahrick & Bahrick 1993, *Psychol Sci* 4 **[moderate]** | Wider gaps buy the same memory with half the sessions. That is the case for a 21-day cap rather than 7. |
| 11 | Personalised, model-driven review beat massed study by 16.5% and one-size-fits-all spacing by 10% on a cumulative exam a month after term (middle-school Spanish). | Lindsey, Shroyer, Pashler & Mozer 2014, *Psychol Sci* 25 **[moderate, field RCT]** | A per-rule memory model is worth building, but most of the gain over massing comes from spacing at all. |
| 12 | FSRS-6 (21 parameters) has log loss 0.346 / AUC 0.703. HLR (Duolingo's) has 0.469 / 0.637. FSRS-7 with default parameters, no per-user training, gets 0.362. A zero-parameter moving average of the user's recent success gets 0.337 log loss, but its AUC is 0.700. | open-spaced-repetition srs-benchmark, 9,999 Anki collections, 349.9 M reviews (README, accessed 2026-10-28) **[strong for flashcards; untested on maths procedures]** | Use FSRS's model. Log loss is dominated by each user's base rate, so add a cheap per-student calibration (spec C6). Do not trust absolute R values for maths items without checking them. |
| 13 | FSRS's optimiser needs "a few hundred" reviews before it helps. Anki's default target is 90%; "above 90% the workload increases very quickly". Below a personal minimum, forgetting makes the workload rise again. | Anki manual, deck options; fsrs4anki wiki "The optimal retention" **[moderate, practitioner docs]** | A student produces under ~1,000 rule reviews before the exam, so ship the default parameters and do not train per student. |
| 14 | MEMORIZE: if the goal is recall at a cost per review, the optimal review rate is proportional to the forgetting probability (Duolingo data). | Tabibian et al. 2019, *PNAS* 116 **[moderate]** | "Review the lowest-R rules first" under a daily cap is principled, not just convenient. |
| 15 | Short daily email questions (spaced education) beat a one-off bolus 2 years later (70.2% vs 66.8%, effect size 0.35). | Kerfoot 2009, *J Urol* 181, PubMed 19375095 **[moderate, RCT]** | 2–3 minutes a day of 10–20 s items is a proven delivery shape. "Microlearning" meta-analyses are small and mostly about video lengths **[weak]**. Vendor claims such as "+50% job behaviour" are **[hype]**. |
| 16 | One big spaced stack beat several small massed stacks for 90% of learners, yet 72% believed massing worked better. | Kornell 2009, *Appl Cogn Psychol* 23 **[moderate]** | Expect students to feel that reviews "aren't working". Show progress in rules kept, not in how easy the review felt. |
| 17 | In real maths classes, spacing raised scores after a month and removed overconfidence (Year 7). In calculus it lowered quiz scores during practice and raised the end-of-term test. Across nine STEM courses, the spacing effect was clear only in calculus and one chemistry course. | Emeny, Hartwig & Rohrer 2021, *Appl Cogn Psychol* 35; Lyle et al. 2022, *Educ Psychol Rev* 34; Bego et al. 2024, *Int J STEM Educ* 11 **[moderate]** | Spacing will lower in-review accuracy. That is expected, not a bug. Do not raise the target retention to "fix" it. |
| 18 | Spacing helped Grade 7 at 1 and 6 weeks but Grade 3 only at 1 week. It helped mainly **medium** performers. A 2025 replication found the benefit only for students with medium initial practice performance. | Barzagar Nazari & Ebersbach 2019, *Appl Cogn Psychol* 33 and *Trends Neurosci Educ* 17; Ruitenburg et al. 2025, *Appl Cogn Psychol* 39 **[weak–moderate]** | A student who never got the rule right in the lesson gains nothing from spacing. Gate scheduling on a first correct, unaided use. Below that, re-teach. |
| 19 | Interleaving for maths tasks: g = 0.34 (heterogeneous). It is stronger when categories are *similar between* and *varied within*. Blocking wins for word-like material. | Brunmair & Richter 2019, *Psychol Bull* 145 **[strong]** | Interleave look-alike rules only after each one is known. Vary the surface within one rule (numbers, wording, figure). |
| 20 | Problem solving before instruction: g = 0.36 overall, 0.37–0.58 with high fidelity. Learners in grades 2–5 and domain-general skills favoured instruction first. The benefit is for conceptual knowledge and transfer, not procedural fluency. | Sinha & Kapur 2021, *Rev Educ Res* 91 **[strong]**; Loibl, Roll & Rummel 2017, *Educ Psychol Rev* 29 **[moderate]** | Keep the opening guess (pretest) short and cheap. A rule like «أ٪ من ب = ب٪ من أ» is a shortcut, so a long struggle phase does not pay. One guess, then the reveal. |
| 21 | Pretesting helps if correct answers are studied right after. Mechanisms include attention to what was asked. The evidence is mostly text and facts; maths procedures are less tested. | Pan & Carpenter 2023, *Educ Psychol Rev* 35 **[moderate]** | Every guess screen must be followed at once by the answer and the trick. Never leave a guess unresolved. |
| 22 | Feedback timing: across 38 college classes, immediate vs delayed had no effect (0.002, HDI ±0.05). In an engineering course, delaying feedback by a week helped exam transfer. | Fyfe et al. 2021, *AMPPS* 4 **[strong]**; Mullet et al. 2014, *JARMAC* 3 **[moderate]** | Keep immediate feedback; it costs nothing and keeps the session moving. Spend the effort on *what* the feedback shows. |
| 23 | Computer feedback: an explanation gives 0.49, the correct answer 0.32, right/wrong alone 0.05. Maths showed larger effects. | Van der Kleij, Feskens & Eggen 2015, *Rev Educ Res* 85 **[strong]** | A wrong review answer should show **the trick applied to these numbers** (2–3 rows), not only the right choice. |
| 24 | Bare right/wrong feedback helped children with no correct strategy but **hurt** children who had one (in person). On a computer it helped. | Fyfe & Rittle-Johnson 2016, *J Educ Psychol* 108 **[moderate]** | For a student who knows the rule (stability > 14 days), skip the step-by-step after a correct answer: a tick and move on. |
| 25 | Confident errors are corrected best (hypercorrection), provided feedback is given. | Metcalfe 2017, *Annu Rev Psychol* 68 **[strong]** | The first-run "taste" item (a confident wrong guess) is a good encoding moment. Always show the correct swap after it. |
| 26 | Curiosity before an answer improves memory for it, through dopaminergic circuits. The effect persists a day later but is not boosted by sleep. | Gruber, Gelman & Ranganath 2014, *Neuron* 84; Stare et al. 2018, *Learn Mem* **[moderate]** | Pose the "how is that possible?" question before the trick. Keep the gap short (seconds). |
| 27 | Reward anticipation and **signed reward prediction errors** boost hippocampal encoding. Money boosted memory only after a delay, and only for boring items. | Adcock et al. 2006 and Wittmann et al. 2005, *Neuron*; Ergo, De Loof & Verguts 2020, *TICS* 24; Murayama & Kuhbandner 2011, *Cognition* 119 **[moderate; lab tasks, adults]** | Reward helps most where interest is low, such as dull formula reviews. It must be **unexpected** to carry a prediction error: a rare bonus gem on a hard review, not a fixed celebration. |
| 28 | Adolescents show stronger prediction-error signals in the hippocampus and better memory for rewarded outcomes than adults. | Davidow, Foerde, Galván & Shohamy 2016, *Neuron* 92 **[weak–moderate]** | At 16–18 the surprise lever is stronger than for adults. Use it on rule moments, not on navigation. |
| 29 | Insight ("aha") solutions were recalled 64.4% vs 52.4% after 14 days. The advantage comes from being correct, feeling certain and feeling pleasure together. | Danek et al. 2013, *Psychol Res* 77; Danek & Wiley 2020, *Cognition* 205 **[moderate]** | The reveal should land as the student's *own* realisation that it is right: let them predict, then confirm. A wrong "aha" (false certainty) is also sticky, so the reveal must be checked at once. |
| 30 | Sleep after study, then a morning relearning session, halved relearning effort and improved retention at 6 months. Studying shortly before sleep beat morning study at 24 h. | Mazza et al. 2016, *Psychol Sci* 27; Payne et al. 2012, *PLoS ONE* 7 **[moderate]** | First review: the **next calendar day** after a night's sleep. An evening lesson is fine, even good. |
| 31 | Teens on 5 h a night for 5 nights encoded new material worse, and vigilance did not explain it. Cramming on short sleep impaired vocabulary learning. Naps after learning held up at one week, cramming did not. | Cousins, Sasmita & Chee 2017, *J Sleep Res* 27; Huang et al. 2016, *Sleep* 39; Cousins et al. 2018, *Sleep* 42 **[moderate]** | Lessons after midnight learn less. A soft note is reasonable: «الحين وقت نوم — كمّل بكرة، القاعدة تثبت وأنت نايم». |
| 32 | Late chronotypes score worse on morning tests. The effect vanishes in the afternoon. | van der Vinne et al. 2015, *J Biol Rhythms* 30 **[moderate]** | Do not push morning review notifications. Let the student pick the time. |
| 33 | Retrieval practice protected recall from acute stress. Restudy did not. | Smith, Floerke & Thomas 2016, *Science* 354 **[weak–moderate, single study]** | This is a real reason to keep the last-14-day sweep retrieval-based. Exam stress hits restudied material harder. |

---

## (C) Recommended client-side scheduler (replaces section (b)2 of rule-memory.md)

**C1. Model.** Use FSRS-6 with its **published default parameters** and no per-student training.
- Recall probability: `R(t,S) = (1 + F·t/S)^(−w20)`, with `F = 0.9^(−1/w20) − 1`.
- Interval for target `r`: `I = S/F · (r^(−1/w20) − 1)`.
- Defaults: `w = [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542]`.
- Update rules, verbatim from the FSRS wiki and py-fsrs:
  - `S0(G) = w[G−1]`.
  - `D0(G) = w4 − e^(w5·(G−1)) + 1`.
  - `D' = w7·D0(4) + (1−w7)·(D + (−w6·(G−3))·(10−D)/9)`, clamped to 1..10.
  - After a success: `S' = S·(1 + e^w8·(11−D)·S^−w9·(e^(w10·(1−R))−1)·[w15 if Hard])`.
  - After a lapse: `S' = min(w11·D^−w12·((S+1)^w13 − 1)·e^(w14·(1−R)), S / e^(w17·w18))`.
  - Same day: `S' = S·e^(w17·(G−3+w18))·S^−w19`, floored at ×1 on success.
- Why not HLR: it is 0.12 worse in log loss on the public benchmark, and Qudrati has no server to train it.

**C2. Data per rule** (about 40–60 bytes; 273 rules ≈ 15 KB in `qudratState`):
```js
S.rules["skills.bigsum:2"] = { s: 2.31, d: 2.1, last: "2026-10-28", due: "2026-10-29",
                               reps: 1, lapse: 0, h: "3" }  // h: last ≤ 8 grades, for export/debug
S.rcal = { n: 0, pred: 0, ok: 0 }  // per-student calibration (C6)
```

**C3. What counts as a review and how it is graded.** The app grades. The student never self-rates.
- **Again (1):** wrong; «ما أعرف»; or the answer had to be shown.
- **Hard (2):** right but on a second try inside the item, after a hint, or slower than 2× that item type's median (cap 45 s).
- **Good (3):** right, first try, unaided, normal time.
- **Easy (4):** not used. It multiplies S by w16 = 1.87 and invites noise.
- **Which item shapes count:**
  - **Apply with fresh numbers** and **spot the error** count fully.
  - **Name the rule from a problem** counts as Good only if followed by an apply item; alone it caps at Hard.
  - **Recite the rule** (tiles) caps at Hard. It is recognition, and Pan & Rickard's transfer depends on application.
- **A bank question counts for its rule** when it is answered inside a review or the mix. That stays honest because those questions are new surfaces.

**C4. First session (the 90-second lesson).**
- The rule enters the scheduler only after **3 correct unaided uses**, at least one coming after ≥ 3 other items (Rawson & Dunlosky criterion 3). The current short lesson (see → fill → reps → write-the-rule) already gives this.
- If the student never reached one correct unaided use, the rule is not scheduled. It is flagged `reteach` and returns as a mini `see` card plus one apply item at the start of the next session (Rowland 2014; Ruitenburg et al. 2025).
- Initial state: `s = S0(3) = 2.31`, `d = D0(3)`, plus an authored ease offset of −1..+1 (order of operations +1, repeated addition −1).
- **The first due date is forced to the next calendar day**, whatever `I` says (sleep: Mazza 2016; Payne 2012). FSRS then absorbs the early review through its R term.

**C5. After each review.**
- Apply the FSRS update for the grade.
- **On Again:**
  - re-ask the rule later in the **same** session with new numbers until it is right once (successive relearning);
  - apply the same-day formula for that success;
  - `lapse += 1`;
  - at `lapse ≥ 3` set `reteach`: show the worked trick before the next attempt.
- **Next due date:** `due = last + clamp(round(I(r,S)), 1, cap)`, where:
  - `r = 0.85` by default;
  - `cap = clamp(round(0.2 · daysToExam), 2, 21)`, the ridgeline: about 20% of the horizon, never more than 3 weeks.
- **Exam clamp:** if `last < exam − 10` and `due > exam − 4`, set `due` to a day in `[exam − 10, exam − 5]` (spread by rule id). Every rule gets one retrieval in the final fortnight.
- **Late starter** (`daysToExam < 30`): use `r = 0.9`. With little time left, every lapse is costly.
- **No exam date:** `exam = first lesson + 90 days`.

**C6. Per-student calibration**, in place of an optimiser.
- Each graded review adds the predicted `R` to `S.rcal.pred` and the outcome to `S.rcal.ok`. Keep it as an exponential moving average over about the last 100 reviews.
- After `n ≥ 40`, compute `gap = ok/n − pred/n`:
  - `gap < −0.05` (forgetting faster than the model says): multiply every interval by 0.8.
  - `gap > +0.05`: multiply by 1.15.
  - Clamp the multiplier to 0.6–1.3.
- This mirrors the benchmark's finding that a user's base rate carries much of the predictive power (MOVING-AVG), and costs two numbers.

**C7. Daily load.**
- At most **12 rule items a day**, about 3 minutes at 15 s each. Maths items may need 20–40 s, so measure and lower to 8 if needed.
- Serve the lowest `R` first (Tabibian et al. 2019). Overflow rolls over silently. Never show a backlog count.
- Never put the same rule twice in a row. Pair look-alike rules in one set (Brunmair & Richter 2019).
- In-lesson massing of a new rule does not move `due` beyond 7 days until the rule has one Good **in a mixed set** (the Khan-style "mastered in a mix" gate).

**C8. What the model predicts** **[model]**: rules learned over the first 60 days, exam at day 90, FSRS-6 defaults, simulated in `node`.

| Target r | 21-day cap + exam clamp | Reviews per rule | Mean R on exam day |
|---|---|---|---|
| 0.80 | yes | 4.7 | 0.98 |
| **0.85** | **yes** | **5.2** | **0.98** |
| 0.90 | yes | 5.7 | 0.99 |
| 0.85 | no cap, no clamp | 3.0 | 0.91 |

- Making forgetting much steeper (decay 0.5, S0 halved) adds about 0.5 reviews per rule and changes nothing else.
- **Caveat:** FSRS defaults were fitted to adult Anki flashcards. Absolute R values for teen maths procedures will be lower than this. The robust lessons are relative: the **exam clamp and the cap matter more than the target**, and 0.85 saves about 10% of reviews against 0.9.
- 5 reviews per rule matches the empirical recipe: criterion 3, then 3–4 relearning sessions.

**C9. Sketch (plain JS, no deps):**
```js
const W=[0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542];
const DEC=-W[20], FAC=Math.pow(0.9,1/DEC)-1, cl=(a,b,x)=>Math.min(b,Math.max(a,x));
const R=(t,s)=>Math.pow(1+FAC*t/s,DEC), IV=(r,s)=>s/FAC*(Math.pow(r,1/DEC)-1);
const D0=g=>cl(1,10,W[4]-Math.exp(W[5]*(g-1))+1);
function grade(c,g,today){ // c = S.rules[id], g = 1|2|3
  const t=Math.max(0,daysBetween(c.last,today)), r=R(t,c.s);  // stability uses the OLD d (as py-fsrs)
  c.s = t===0 ? c.s*Math.max(g>1?1:0,Math.exp(W[17]*(g-3+W[18]))*Math.pow(c.s,-W[19]))
       : g>1 ? c.s*(1+Math.exp(W[8])*(11-c.d)*Math.pow(c.s,-W[9])*(Math.exp(W[10]*(1-r))-1)*(g===2?W[15]:1))
       : Math.min(W[11]*Math.pow(c.d,-W[12])*(Math.pow(c.s+1,W[13])-1)*Math.exp(W[14]*(1-r)), c.s/Math.exp(W[17]*W[18]));
  c.d=cl(1,10,W[7]*D0(4)+(1-W[7])*(c.d-W[6]*(g-3)*(10-c.d)/9));
  c.last=today; c.reps++; if(g===1) c.lapse++;
  c.due=addDays(today, cl(1, capDays(), Math.round(IV(target(), c.s)*S.rmul)));  // then apply the exam clamp (C5)
}
```

---

## (D) Open questions

1. **Are FSRS defaults valid here?** They come from adult flashcard users. We cannot fit our own without a server. Could an opt-in anonymous export (part of the backup code) give a one-off fit later?
2. **Is a rule one item, or are its generated variants?** We treat the rule as the item and the numbers as surface. If students learn the generator's pattern rather than the rule, R will be overstated. Check with occasional bank questions.
3. **How long does a maths review item really take?** Kerfoot's 2–3 items a day were MCQs. Measure the median time per shape before fixing the daily cap.
4. **When do look-alike pairs get interleaved?** Our reading: after each rule has one Good. There is no direct evidence on the timing for 16–18 year-olds.
5. **Does the 90-second "aha" survive the mandatory worked example?** Insight memory needs the student to *find* the answer. Worked examples (Yeo & Fazio) say *show* it. The compromise is predict → show → confirm. It needs an in-app A/B test with a next-day recall measure.
6. **Rare bonus rewards on reviews:** where is the line between a helpful prediction error and gambling-like mechanics for teens? This is a design and ethics call for T2 (compulsion).
7. **Evening lessons:** should the app nudge toward sleep after a late lesson? There is good evidence on sleep and none on whether in-app nudges change teen bedtimes.
8. **Pretesting for maths procedures** is thinly tested (Pan & Carpenter 2023). The first-run «جرّب» evidence comes from facts and texts.

---

## (E) Sources

- Adcock, Thangavel, Whitfield-Gabrieli, Knutson & Gabrieli (2006). Reward-motivated learning: mesolimbic activation precedes memory formation. *Neuron* 50. doi:10.1016/j.neuron.2006.03.036
- Anki manual, Deck options — FSRS, desired retention. https://docs.ankiweb.net/deck-options.html
- Bahrick, Bahrick, Bahrick & Bahrick (1993). Maintenance of foreign language vocabulary and the spacing effect. *Psychol Sci* 4. doi:10.1111/j.1467-9280.1993.tb00571.x
- Barzagar Nazari & Ebersbach (2019). Distributing mathematical practice of third and seventh graders. *Appl Cogn Psychol* 33(2), 288–298. Also: Nazari & Ebersbach (2019). Distributed practice in mathematics: recommendable especially for students on a medium performance level? *Trends Neurosci Educ* 17. doi:10.1016/j.tine.2019.100122
- Bego, Lyle, Ralston, Immekus et al. (2024). Single-paper meta-analyses of the effects of spaced retrieval practice in nine introductory STEM courses. *Int J STEM Educ* 11. doi:10.1186/s40594-024-00468-5
- Brunmair & Richter (2019). Similarity matters: a meta-analysis of interleaved learning and its moderators. *Psychol Bull* 145. doi:10.1037/bul0000209
- Cousins, Sasmita & Chee (2017). Memory encoding is impaired after multiple nights of partial sleep restriction. *J Sleep Res* 27. doi:10.1111/jsr.12578
- Cousins, Wong, Raghunath, Look & Chee (2018). The long-term memory benefits of a daytime nap compared with cramming. *Sleep* 42. doi:10.1093/sleep/zsy207
- Danek, Fraps, von Müller, Grothe & Öllinger (2013). Aha! experiences leave a mark: facilitated recall of insight solutions. *Psychol Res* 77. doi:10.1007/s00426-012-0454-8
- Danek & Wiley (2020). What causes the insight memory advantage? *Cognition* 205. doi:10.1016/j.cognition.2020.104411
- Davidow, Foerde, Galván & Shohamy (2016). An upside to reward sensitivity: the hippocampus supports enhanced reinforcement learning in adolescence. *Neuron* 92. doi:10.1016/j.neuron.2016.08.031
- Emeny, Hartwig & Rohrer (2021). Spaced mathematics practice improves test scores and reduces overconfidence. *Appl Cogn Psychol* 35. doi:10.1002/acp.3814
- Ergo, De Loof & Verguts (2020). Reward prediction error and declarative memory. *Trends Cogn Sci* 24. doi:10.1016/j.tics.2020.02.009
- FSRS algorithm wiki (FSRS-4.5 to FSRS-6 formulas and default parameters). https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm ; py-fsrs `scheduler.py`. https://github.com/open-spaced-repetition/py-fsrs ; "The optimal retention". https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-optimal-retention
- Fyfe & Rittle-Johnson (2016). Feedback both helps and hinders learning: the causal role of prior knowledge. *J Educ Psychol* 108. doi:10.1037/edu0000053
- Fyfe, de Leeuw, Carvalho, Goldstone, … Motz (2021). ManyClasses 1: immediate vs delayed feedback across many college classes. *AMPPS* 4. doi:10.1177/25152459211027575
- Gruber, Gelman & Ranganath (2014). States of curiosity modulate hippocampus-dependent learning via the dopaminergic circuit. *Neuron* 84. doi:10.1016/j.neuron.2014.08.060
- Huang, Deshpande, Yeo, Lo, Chee & Gooley (2016). Sleep restriction impairs vocabulary learning when adolescents cram for exams: the Need for Sleep study. *Sleep* 39. doi:10.5665/sleep.6092
- Huang, Zheng, Yu & Chen (2023). Retrieval practice may not benefit mathematical word-problem solving. *Front Psychol* 14. doi:10.3389/fpsyg.2023.1093653
- Karpicke & Bauernschmidt (2011). Spaced retrieval: absolute spacing enhances learning regardless of relative spacing. *JEP:LMC* 37. doi:10.1037/a0023436
- Kerfoot (2009). Learning benefits of on-line spaced education persist for 2 years. *J Urol* 181. https://pubmed.ncbi.nlm.nih.gov/19375095/
- Kornell (2009). Optimising learning using flashcards: spacing is more effective than cramming. *Appl Cogn Psychol* 23. doi:10.1002/acp.1537
- Lindsey, Shroyer, Pashler & Mozer (2014). Improving students' long-term knowledge retention through personalized review. *Psychol Sci* 25. doi:10.1177/0956797613504302
- Loibl, Roll & Rummel (2017). Towards a theory of when and how problem solving followed by instruction supports learning. *Educ Psychol Rev* 29. doi:10.1007/s10648-016-9379-x
- Lyle, Bego, Ralston & Immekus (2022). Spaced retrieval practice imposes desirable difficulty in calculus learning. *Educ Psychol Rev* 34. doi:10.1007/s10648-022-09677-2
- Mawson & Kang (2025). The distributed practice effect on classroom learning: a meta-analytic review of applied research. *Behav Sci* 15. doi:10.3390/bs15060771
- Mazza, Gerbier, Gustin, Kasikci, Koenig, Toppino & Magnin (2016). Relearn faster and retain longer. *Psychol Sci* 27. doi:10.1177/0956797616659930
- Metcalfe (2017). Learning from errors. *Annu Rev Psychol* 68. doi:10.1146/annurev-psych-010416-044022
- Mullet, Butler, Verdin, von Borries & Marsh (2014). Delaying feedback promotes transfer of knowledge despite student preferences to receive feedback immediately. *JARMAC* 3. doi:10.1016/j.jarmac.2014.05.001
- Murayama & Kuhbandner (2011). Money enhances memory consolidation — but only for boring material. *Cognition* 119, 120–124.
- Murray, Horner & Göbel (2025). A meta-analytic review of the effectiveness of spacing and retrieval practice for mathematics learning. *Educ Psychol Rev* 37. doi:10.1007/s10648-025-10035-1 ; https://eprints.whiterose.ac.uk/id/eprint/229807
- open-spaced-repetition, srs-benchmark README (results table, 9,999 collections). https://github.com/open-spaced-repetition/srs-benchmark
- Pan & Carpenter (2023). Prequestioning and pretesting effects: a review. *Educ Psychol Rev* 35. doi:10.1007/s10648-023-09814-5
- Pan & Rickard (2018). Transfer of test-enhanced learning: meta-analytic review and synthesis. *Psychol Bull* 144(7), 710–756.
- Payne, Tucker, Ellenbogen, Wamsley, Walker, Schacter & Stickgold (2012). Memory for semantically related and unrelated declarative information: the benefit of sleep, the cost of wake. *PLoS ONE* 7. doi:10.1371/journal.pone.0033079
- Rawson & Dunlosky (2011). Optimizing schedules of retrieval practice for durable and efficient learning: how much is enough? *JEP:General* 140. doi:10.1037/a0023956
- Rawson & Dunlosky (2022). Successive relearning: an underexplored but potent technique. *Curr Dir Psychol Sci* 31. doi:10.1177/09637214221100484
- Rawson, Dunlosky & Janes (2020). All good things must come to an end: a potential boundary condition on the potency of successive relearning. *Educ Psychol Rev* 32. doi:10.1007/s10648-020-09528-y
- Rowland (2014). The effect of testing versus restudy on retention: a meta-analytic review. *Psychol Bull* 140. doi:10.1037/a0037559
- Ruitenburg, Guldemont, Kirschner, Jarodzka & Camp (2025). Initial practice performance moderates the distributed practice effect in complex procedural knowledge. *Appl Cogn Psychol* 39(1).
- Sinha & Kapur (2021). When problem solving followed by instruction works: evidence for productive failure. *Rev Educ Res* 91. doi:10.3102/00346543211019105
- Smith, Floerke & Thomas (2016). Retrieval practice protects memory against acute stress. *Science* 354. doi:10.1126/science.aah5067
- Stare, Gruber, Nadel, Ranganath & Gómez (2018). Curiosity-driven memory enhancement persists over time but does not benefit from post-learning sleep. *Learn Mem* (Cardiff ORCA 114430).
- Tabibian, Upadhyay, De, Zarezade, Schölkopf & Gomez-Rodriguez (2019). Enhancing human learning via spaced repetition optimization. *PNAS* 116. doi:10.1073/pnas.1815156116
- van der Vinne, Zerbini, Siersema, … Roenneberg & Kantermann (2015). Timing of examinations affects school performance differently in early and late chronotypes. *J Biol Rhythms* 30. doi:10.1177/0748730414564786
- Van der Kleij, Feskens & Eggen (2015). Effects of feedback in a computer-based learning environment on students' learning outcomes: a meta-analysis. *Rev Educ Res* 85. doi:10.3102/0034654314564881
- Vaughn, Dunlosky & Rawson (2016). Effects of successive relearning on recall: does relearning override the effects of initial learning criterion? *Mem Cogn* 44. doi:10.3758/s13421-016-0606-y
- Wittmann, Schott, Guderian, Frey, Heinze & Düzel (2005). Reward-related fMRI activation of dopaminergic midbrain is associated with enhanced hippocampus-dependent long-term memory formation. *Neuron* 45. doi:10.1016/j.neuron.2005.01.010
- Yang, Luo, Vadillo, Yu & Shanks (2021). Testing (quizzing) boosts classroom learning: a systematic and meta-analytic review. *Psychol Bull*. https://scholars.hkbu.edu.hk/en/publications/testing-quizzing-boosts-classroom-learning-a-systematic-and-meta-/
- Yeo & Fazio (2019). The optimal learning strategy depends on learning goals and processes: retrieval practice versus worked examples. *J Educ Psychol* 111(1), 73–90.

Not verified, so not used: exact recall percentages from Rawson & Dunlosky 2011; an SM-2 row in the current benchmark table (none is listed); effect sizes from microlearning meta-analyses.
