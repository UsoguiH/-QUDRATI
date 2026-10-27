# Rule study, round two: gold, then mint

*2026-10-27. Follow-up to `research/rule-study.md`. That round ranked five prototypes for teaching the same two rules, «المجموع = العدد × عدد مرات تكراره» and «من ١ إلى أي عدد: آخر عدد × (آخر عدد + ١) ÷ ٢». The top three were sun, rose and sand. This round tests the design that report recommended, then a refinement of it:*

| Code | File | What it is |
|---|---|---|
| **gold** | `tools/rulestudy/gold.html` | The round-one recommendation built as one lesson. It has sun's structure (teach fast, then sort, then exam-style problems), sand's tap-to-pair arcs for *why*, rose's staircase only when a student forgets ÷ ٢, a collectible rule card whose terms light parts of a live picture, no countdown anywhere, diagnostic sheets («نسيت ÷ ٢» / «نسيت + ١»), and missed items that come back once. |
| **mint** | `tools/rulestudy/mint.html` | gold reworked from round 1's feedback. «ليش ÷ ٢؟» is split into a tap-driven bridge («كم زوج طلع؟» then «كل زوج ١١ — كم المجموع؟») and a separate rule-card screen. ÷ is drawn as a bar with two dots. The opener is now «٩ + ٩ + ٩ + ٩ + ٩ + ٩ = ؟» with a diagnostic line for each wrong choice. A missed sort card comes back with really new numbers, and 20 and 40 are gone from the pools. The fake «بعد ٣ أيام…» screen became a «جولة أخيرة» of three questions that ends on a backwards problem (مدرّج، ٩١ كرسي — كم صف؟). |
| **sun** | `tools/rulestudy/sun.html` | Round one's winner, played **unchanged** as the control. Its known bugs are still in it: the 6-second guess, «الحيلة ما تنفع» for sums that don't start at 1, and the streak wipe. |
| **rose** | `tools/rulestudy/rose.html` | Round one's runner-up, played unchanged, in this round's first wave only. |

Nine new blind AI personas took part (i = 15–23): five played gold, sun and rose, then four more played mint, gold and sun. Each student played in a shuffled order and saw colour codes only.

---

## 1. The tallies, and what they honestly say

Borda scoring is 2 points for 1st, 1 for 2nd and 0 for 3rd. The maximum is 10 in wave 1 and 8 in wave 2. Ratings are averages out of 10. "Would quit" counts students who named a screen where they would have closed the app. "Felt long" counts students who said «a bit long» or longer. Every student finished every lesson.

### Wave 1: gold vs rose vs sun (5 students)

| Rank | Lesson | Borda | 1st | Last | Fun | Clarity | Remember | Come back | Would quit | Felt long |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **gold** | **9 / 10** | **4** | 0 | **7.6** | **8.8** | **8.0** | **6.8** | **1** | 2 |
| 2 | rose | 4 | 1 | 2 | 7.0 | 7.8 | 7.0 | 6.0 | 4 | 4 |
| 3 | sun | 2 | 0 | 3 | 6.4 | 6.8 | 5.6 | 6.2 | 3 | 2 |

### Wave 2: mint vs gold vs sun (4 students)

| Rank | Lesson | Borda | 1st | Last | Fun | Clarity | Remember | Come back | Would quit | Felt long |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **mint** | **7 / 8** | **3** | 0 | **7.5** | **9.0** | **8.0** | 6.5 | 1 | **3** |
| 2 | gold | 3 | 1 | 2 | 6.5 | 8.0 | 6.75 | 5.75 | **0** | **0** |
| 3 | sun | 2 | 0 | 2 | 6.75 | 6.25 | 5.75 | **7.25** | 2 | 2 |

### Head to head (how many students put one lesson above the other)

| Pair | Wave 1 | Wave 2 |
|---|---|---|
| gold vs sun | gold **5–0** | 2–2 |
| gold vs rose | gold **4–1** | — |
| rose vs sun | rose 3–2 | — |
| mint vs sun | — | mint **4–0** |
| mint vs gold | — | mint **3–1** |

### What it means

- **The round-one synthesis worked.** gold beat its parent sun 5–0 and the runner-up rose 4–1. It also had the fewest would-quit moments of the three (1 in 5). In round one sun took 75% of the available Borda points. Beside gold it took 20%, and beside mint 25%. Combining sun's structure with sand's arcs and a no-countdown rule beat each source on its own.
- **The iteration improved the lesson.** mint beat gold 3–1 head to head and swept sun. Its clarity rating (9.0) is the highest of any lesson in either round. The specific complaints mint was built to fix also disappeared:
  - **The passive, crowded «ليش ÷ ٢؟» screen.** Seven of the nine gold players criticised it. No mint player did, and all four named mint's bridge, or the pairing that leads into it, as a best moment.
  - **«÷» reading as «+».** Two gold players reported it. No mint player did.
  - **Repeated numbers** (١ … ٢٠ three times, ١ … ٤٠ memorised, ٧٨ in every lesson). There were no complaints in mint.
  - **«رجعت لك بأرقام جديدة» showing the same numbers.** Tala saw a missed trap come back as the same type with new numbers.
- **The iteration did not shorten anything; mint is longer.** Three of the four mint players said it felt long, against 2 of 5 for gold in wave 1 and 0 of 4 for gold in wave 2. mint's one would-quit was وليد at «جولة أخيرة», around his seventh minute. An all-right run is now about 16 screens. Round one's target was 11. The added screens are:
  - the bridge's second question;
  - the rule-2 card on its own screen;
  - the final-round title screen;
  - two of the three final-round items.

  mint fixed the *quality* complaints and paid for it in *length*, the complaint that hurt rose most in round one.
- **The higher ratings do not prove an absolute gain.** gold is the same file in both waves, yet its ratings fell between them:

  | gold's rating | Wave 1 | Wave 2 |
  |---|---|---|
  | Fun | 7.6 | 6.5 |
  | Remember | 8.0 | 6.75 |
  | Come back | 6.8 | 5.75 |

  In wave 2 it sat beside mint, which does the same thing more actively, so it looked "cold" (مازن: «الدرس نظيف بس بارد»). sun's clarity also fell from 8.0 in the original study to 6.25–6.8 here, beside lessons that explain ÷ ٢. Ratings are anchored to whatever a lesson is compared with. mint's absolute ratings (7.5 / 9.0 / 8.0 / 6.5) are about the same as gold's in wave 1. The evidence that mint is better is the 3–1 head-to-head and the missing complaints, not a jump in the numbers.
- **Nothing pulls students back yet.** The best come-back score in wave 2 belongs to sun (7.25), and the reason is its chest, gems, streak and «١٥ ورا بعض! +٥ XP». mint scores 6.5. Both strong students (مازن, لجين) put sun *above* gold for this reason. This was also round one's finding: the pull back has to come from the game layer, not from teaching quality. The app already has that layer on its win screen (XP, the league climb, the chest, gems, the streak), and a standalone prototype cannot show it.
- **Order effects, checked.** In wave 1, two of gold's four first places came from students who played it last, and both said so (محمد: «لعبت gold آخر واحد، فكنت أعرف الأجوبة»; منيرة: «جاء آخر شي وكنت حافظة القاعدة»). gold still beat sun in all five rankings either way. In wave 2, mint was played first by two students and ranked first by both, so carry-over cannot explain its result. gold's only wave-2 first place came from وليد, who played it last and is the student most sensitive to length.

### Splits (direction only; each group has 2–3 students)

- **Strong at maths** (مازن, لجين in wave 2): both ranked mint > sun > gold. They want the reasoning *and* a challenge or a reward. gold gave them neither.
- **Anxious under time pressure** (محمد in wave 1, تالا in wave 2): both put the no-countdown lesson first and sun last. Both named sun's 6-second guess as where they would quit.
- **Weak at maths, short attention span** (وليد): gold first, for being short. mint's explanation was «أوضح شي», but it ran too long for him.
- **Gamer who skips text** (أثير, wave 1): the only student who put rose first. She wanted XP, cards and a combo counter, and found gold's «ليش ÷ ٢؟» screen «زحمة».

---

## 2. Each lesson

### mint (4 plays; 1st in wave 2)

**What they loved.**
- **Working out ÷ ٢ themselves (4 of 4).** First they pair the ends, then «كم زوج طلع؟», then «كل زوج ١١ — كم المجموع؟».
- **The backwards problem** «٩١ كرسي — كم صف؟» (2: مازن, لجين).
- **The missing-number trap** in the sort round (لجين).
- **A missed trap coming back with new numbers** (تالا).
- **«بدون وقت ولا عدّاد — على راحتك»** (تالا).

**Where they would quit (1).** وليد, at «جولة أخيرة — ٣ أسئلة وآخرها تحدّي», around minute 7: «قلت خلاص فهمت وطلعت سناب».

**Worst moments.**
- **Length and the final round** (وليد, تالا, لجين).
- **Rule 1 still feels like primary school** (مازن: «٩×٦ أسهل من اللازم»; لجين: «شاشة كاملة تشرح لي إن الضرب هو تكرار»).
- **The backwards problem was too hard for a weak student**, who guessed it (وليد).

**Wishes, clustered.**
| Wish | Count |
|---|---|
| Shorter: cut the final round, or make it optional | **3** |
| More backwards challenges like the مدرّج | 2 |
| Rule 1 on one quick screen | 2 |
| A streak, gems, or a leaderboard to compare times | 1 (مازن; وليد asked the same of gold) |
| Keep the pairing and «ليش ÷ ٢» exactly as they are | 1 (تالا) |

**Bugs and friction reported.**
- **«The streak didn't reset after a miss» (مازن).** This is the one-miss shield working as designed (`ST.shield` in mint.html: the first miss is absorbed, and later misses halve the run). He missed the «الدرع حمى سلسلتك» toast. A shield that nobody notices reads as a bug.
- **The end screen contradicts the start.** It shows the lesson time and «حليت الجولة الأخيرة في ٥٤ ثانية», after the start promised «بدون وقت».
- **Choices behave inconsistently between lessons.** mint needs «تحقق» after a pick, while gold and sun submit on the tap.
- **A dead button.** «زوّج كل الأطراف» is shown disabled while the student pairs, and looks broken (وليد; gold has the same button).

**Quotes.**
- مازن: «والله الدرس الأخضر (mint) فهّمني ليش ÷٢ صدق مو حفظ، بس لو يحطون فيه سلسلة وجواهر زي الثالث كان ما طلعت من التطبيق»
- وليد: «طوله. فرز وصيد غلط ورجعت لك وبعدها جولة أخيرة وتحدّي ٩١ كرسي. الدرس كله ٨ دقايق، وتحدّي «بالعكس» ما عرفته وخمّنت»

### gold (9 plays; 1st in wave 1, 2nd in wave 2)

**What they loved.**
- **Pairing ١ with ١٠ and ٢ with ٩ themselves**, with the coloured arcs and «طلّعتها بنفسك!» (7 of 9). Munira compared it to a teacher at the board.
- **No countdown** (محمد, منيرة).
- **The diagnostic miss sheet** «نسيت ÷ ٢» with the staircase, or «١٢×١٣ = ١٥٦، هذا ضعف الجواب» (أثير, تالا).
- **The ٧ + ٧ + ٨ + ٧ trap** (بندر, لجين). Two others fell into it and felt tricked (أثير, شهد).
- **The tins-pyramid word problem** (محمد, منيرة).

**Where they would quit (1).** شهد, at «ليش ÷ ٢؟», because it plays by itself with no button: «قعدت أنتظر ويدي على السناب».

**Worst moments.**
- **«ليش ÷ ٢؟»** (7 of 9). In wave 1 it was crowded: three lines, a rule card, numbers and arcs all at once. In wave 2 it was passive: «عرضها لي وأنا أتفرج بس». Its content worked (محمد and منيرة named it a best moment); its form did not.
- **An opening that is too easy** (بندر, منيرة, لجين).
- **A fake «بعد ٣ أيام…» screen** straight after finishing (بندر, تالا, مازن).
- **«÷» drawn like «+»** in the bold font (شهد, وليد).
- **The same numbers again:** ٧ + ٧ + ٨ + ٧ came back unchanged (شهد), ١ … ٢٠ = ٢١٠ came up three times (محمد), and ٧٨ appears in every lesson (منيرة).

**Wishes, clustered.**
| Wish | Count |
|---|---|
| Make «ليش ÷ ٢» step by step and tapped, not watched (or lighter) | **6** |
| A real challenge or harder, exam-style problems at the end | **5** |
| Rewards: XP, gems, a chest, "something exciting at the end" | 3 |
| Shorter, especially the first two screens | 2 |
| Missed items that really come back with new numbers | 2 |

**Quotes.**
- منيرة: «والله الذهبي كأنه أستاذة تشرح لك ليش، بس الثلاثة سهلين زيادة على وحدة تبي ٨٥ عشان طب»
- لجين: «شاشة «ليش ÷٢» تطلع لحالها وأنا أطالع بس، بدون شي أضغطه. وفيها أرقام كثير مزحومة.»

### sun (9 plays; the unchanged control; last in both waves)

**What they loved.**
- **The reward loop** (4: أثير, مازن, لجين, وليد): «صندوق المراجعة +٢٠ جوهرة», the day streak, «١٥ ورا بعض!».
- **«أحمد غلط — وين؟»** (محمد, شهد, وليد).
- **«نسيت ÷ ٢» feedback** (وليد).
- **The ٧ + ٨ + ٧ + ٧ trap** (منيرة).
- **Feeling like the trick videos** students watch (بندر).
- **Typing the answer on a keypad** like the real exam (لجين, تالا).

**Where they would quit (5 of 9).**
- **4: the 6-second «خمّن بسرعة» guess** (محمد, منيرة, وليد, تالا).
- **1: a 15-streak wiped** on a «ولا وحدة» choice that had never been taught (أثير).

All nine students complained about the timer. Every one of them also reported tapping ٥٠٥٠ and being told «خلص الوقت!». Part of that is the scripted phone's tap delay, but real anxious or slow students hit the same wall.

**Worst moments.**
- **It never explains *why* ÷ ٢** (7). It shows «وهكذا… ٥٠ زوج», then the formula. وليد: «قلت ليش ١٠٠ مو ٥٠؟».
- **«الحيلة ما تنفع» for ٢ + … + ١٢ or ٣ + … + ٢٠** (5). It is still wrong, and still confusing to the students who understood pairing best.
- **An ambiguous «صيد الغلط»** (٩ × ١٠ ÷ ٢, ٣٠ × ٣٠) (3).
- **One miss wipes the in-lesson streak** (3).

**Wishes, clustered.**
| Wish | Count |
|---|---|
| Show or let me build *why* ÷ ٢, not a formula to memorise | **7** |
| Remove the timer, or lengthen it | **5** |
| Keep the chest, the gems and the streak | 2 |
| Real traps in the sort round, in no predictable order | 2 |
| Don't wipe the whole streak on one slip | 2 |

**Quotes.**
- محمد: «أما اللي فيه ٦ ثواني فخلاني أحس إني غبي من أول سؤال»
- مازن: «هذا كلاش رويال بالضبط، أبي أرجع بكرة عشان ما تنقطع السلسلة»

### rose (5 plays, wave 1 only; 2nd)

**What they loved.** The staircase that tops up into a rectangle, «الأزرق نص المستطيل» (5 of 5). أثير also liked «كرت جديد!», the XP and the combo counter.

**Where they would quit (4 of 5).**
- **«بعد ٣ أيام… رجّعها — ٣٠ ثانية»**, after the promised three minutes had long passed (شهد, بندر).
- **The tap-tap ٨ + ٨ + ٨ + ٨ opening** (منيرة).
- **Being sent back to «وش اسم كل رقم» after a miss** (محمد).

**Wishes, clustered.**
| Wish | Count |
|---|---|
| Shorter, and honest about it («٣ دقايق» took 6–7) | **4** |
| Less typing on the keypad | 3 |
| Say what I got wrong («نسيت ÷ ٢»), not just the answer | 2 |
| Name the rule after its picture (the staircase has no "ends") | 2 |
| New numbers when a missed item returns | 1 |

**Quotes.**
- أثير: «والله الدرس الوردي حسيته لعبة مو مذاكرة، فهمت القسمة على ٢ من صورة الدرج بس، والذهبي زين بس طويل شوي، والأصفر يعطيك جواهر بس ما يفهّمك»
- منيرة: «قلت وش هذا؟ أنا ثالث ثانوي مو ابتدائي»

---

## 3. What is still not right, and the next changes

In order of how much they cost us:

1. **Length (3 of 4 on mint; the only mint quit).** mint is about 16 screens and roughly 4–5 human minutes (QA's estimate; students' 5–8 minutes include tool latency). The app promises «٣ دقائق بس». Next:
   - **Make the final round a one-item, optional «تحدّي؟»** offered from the end screen, or move it into the next lesson's `recall` and tomorrow's review. That is where the 1 → 3 → 7-day schedule in `research/rule-memory.md` wants it anyway.
   - **Put the rule-1 card on the rule-1 question screen:** the sum folds and the card lands in place, with no extra screen.
   - **Keep the bridge's two questions** (they are what students praised), but **keep rule 2's card on its own screen short:** one flip, then the terms light up, then «المتابعة». No waiting.
   - **Time the run with a stopwatch** before any duration is printed.
2. **Rule 1 is still too easy for strong students** (مازن, لجين; بندر and منيرة in wave 1). The Qudrat skill is not computing ٩ × ٦. It is *noticing* that a sum is a repeat (the ٧ + ٧ + ٨ + ٧ trap is what students called useful). Next: after a first-try right answer, land the card and move straight on. Spend rule 1's remaining time in the sort round, where the traps live.
3. **«÷» drawn like «+».** This is the most important finding for the app, not just the prototype. gold and mint use the app's own font (Baloo Bhaijaan 2, `--font` in both files). Students read gold's «ليش ÷ ٢؟» and «÷ ٢» as «+ ٢», and mint fixed it only by drawing the sign. Next: check every ÷ the app shows at bold weight (learn.js rows and rules, the yellow rule card's `.rw.op`, question stems), and draw it the way mint does if it fails.
4. **One answer convention.** Students noticed that some screens submit on the tap and others need «تحقق» (مازن, لجين, تالا, بندر). Next: follow the app's own convention everywhere, except the free guess, which reveals on the tap.
5. **The end screen's clock against «بدون وقت».** Next: say «بدون عدّاد — على راحتك» at the start, which is true, and show speed only as praise afterwards. The app's win screen already shows time as a flattering stat card.
6. **The invisible shield.** If an in-lesson run counter is ported at all, a miss the shield absorbs needs a visible beat on the counter itself, not only a toast. Otherwise drop the counter and rely on the app's own win-screen stats.
7. **A dead button while pairing.** Replace the disabled «زوّج كل الأطراف» with an instruction line that turns into the button once the pairs are done.
8. **The backwards problem for weak students.** mint already shows the check for the chosen answer on a miss (e.g. «١٤ × ١٥ ÷ ٢ = ١٠٥»). Keep that, and keep the problem optional (point 1) so a weak student is never ended on a guess.
9. **Gendered praise** (منيرة, on rose and sun). The app has no gender field, so use neutral forms in new copy.
10. **The "not from 1" case.** mint simply leaves it out (its traps are a missing number or an odd one out), and no student complained. Keep it out of this lesson, and never label such a sum «ما تنفع».

---

## 4. Recommendation for node 1

**Bring mint in, split across two of node 1's short lessons instead of shipping it as one lesson, and cut its final round on the way in.**

### Where it lands today

Node 1 (`skills.bigsum` in `js/data/learn.js`) already teaches these two rules:
- **Lesson 1 «العدد المكرر»** opens on a free ٧ + ٧ + ٧ guess, then a `see` card.
- **Lesson 4 «من ١ إلى أي عدد»** opens on a free «١ + … + ١٠» guess, then a `see` card that *tells* the pairing in text rows: «(١ + ١٠) ، (٢ + ٩) …», «كل زوج = ١١ ، و ٥ أزواج (نص العشرة)». That is the "pairs as text" explanation round one's students turned down (10 of 15 asked for a picture), and the step gold's passive screen and sun's «وهكذا… ٥٠ زوج» were criticised for.
- **Lesson 4's diagnostic `why`s** («نسيت القسمة على ٢») are already the right kind.
- **Lesson 4 also carries a second idea**, «حيلة إضافية» (take out the common factor).

### The options

| Option | What ships | For | Against |
|---|---|---|---|
| **A. mint as one lesson** | Replace lesson 1 with all of mint; lesson 4 loses its rule | Closest to what was tested and won | ~16 screens and 4–5 min breaks the app's «٣ دقائق» promise. Length was mint's one real weakness. It also teaches two ideas in one short lesson, against the format's own rule |
| **B. mint split (recommended)** | Lesson 1 gets mint's rule-1 opener and card. Lesson 4 gets mint's rule-2 path. The sort round and «أحمد غلط» close lesson 4, or become their own short lesson right after it | Each lesson stays near 3 minutes. The discrimination round interleaves lesson 1's rule days later, which is good spacing. It keeps the node's shape | It no longer matches the tested artefact exactly, so the split itself needs one more check. It also needs new item types (below) |
| **C. gold's shorter shape** | As B, but with gold's single «ليش ÷ ٢» screen made lighter | Shortest, and وليد's choice | gold lost to mint 3–1, and its «ليش ÷ ٢» was the most criticised screen of the round |

### What B means, screen by screen

- **Lesson 1 «العدد المكرر»:**
  - Open on mint's «٩ + ٩ + ٩ + ٩ + ٩ + ٩ = ؟», with a `why` for each wrong choice. It is a decision for you whether this replaces the free ٧ + ٧ + ٧ guess, which is your own design.
  - A right answer folds the sum into ٩ × ٦ and lands the rule card in place, its terms lighting the dot grid. On a miss, the grid builds itself in about 2 s, then the same question comes back with new numbers.
  - Keep the existing reps, trimmed: strong students found more than a couple of reps on this rule childish.
- **Lesson 4 «من ١ إلى أي عدد»:**
  1. The free «١ + … + ١٠٠» guess: any tap reveals ٥٠٥٠, and nothing is marked wrong.
  2. Tap-to-pair ١ … ١٠ with the arcs.
  3. The bridge: «كم زوج طلع؟», then «كل زوج ١١ — كم المجموع؟».
  4. The rule card, its terms lighting the last tile, the ١١ arcs and the pair badges.
  5. One «١ + … + ن» pick. «نسيت ÷ ٢» plays the staircase («أخذت المستطيل كله»), then new numbers.
  6. The existing reps and `bank` question.
- **Then the discrimination round:**
  - «فرّزها» with the missing-number and odd-one-out traps;
  - one word problem: pick the rule, then the answer;
  - «أحمد غلط — وين؟» with exactly one wrong token.

  Either it ends lesson 4, or it becomes a new short lesson right after it, «أيّ قاعدة؟», which keeps each lesson short. The مدرّج backwards problem can be that lesson's تحدَّ, optional for anyone who wants it.
- **«حيلة إضافية»** (the common factor) moves out of lesson 4 into its own short lesson, or follows the discrimination round. Leaving it in would rebuild mint's length problem inside lesson 4.

### What has to be built in the app

- **New item types:**
  - tap-to-pair arcs;
  - a two-step question over one figure (the bridge);
  - a sort round with two rule buttons (and «ولا وحدة» only where a sum truly fits neither);
  - tap-the-wrong-token;
  - a `see` card whose terms light parts of a picture;
  - a `why` that plays the staircase.
- **Every one of these that takes an answer has to jump** (the project rule: `fxAddJump` / `adWave`).
- **Bank questions are redistributed** so each is still served exactly once (`node tools/validate_learn.js`).
- **The write-the-rule screens.** If a lesson is inserted, `RF_LESSONS` (`{ "skills.bigsum": 7 }`) shifts by one, so decide whether the write-the-rule screens follow the new lessons. The study gives one data point here, and it is untested in the app's form: the single combined «كمّل القاعدتين» build in gold and mint drew no complaints, and round one argued against stacking several builds per rule. Whether node 1 keeps two write-the-rule screens after every rule is your call, already pending from 2026-10-26. This study does not settle it.

### Leave out on the way in

- The in-lesson gems and chest that sun's fans asked for. The app's win screen already pays XP, the league climb, gems and the chest.
- Any «بعد ٣ أيام…» simulation.
- Any countdown before the student understands the rule.
- Any printed duration that has not been timed.

---

## 5. Caveats

- **AI personas, not students.** All nine are simulated, probably by the same model family that built and QA'd the prototypes. They write articulately and share blind spots, and they may reward what a model finds "clever" or "exam-like". Treat the result as a strong hypothesis, then test node 1 with a handful of real Saudi students before and after the change.
- **Small samples.** 5 students in wave 1 and 4 in wave 2, different people in each. Each segment split rests on 1–3 students. mint's win is 3 of 4 head-to-head, which is a direction, not a measurement.
- **Ratings are relative.** The same gold file scored lower in wave 2 beside mint, and the same sun file scored lower here than in round one. Absolute scores cannot be compared across rounds; only head-to-head results within a wave can.
- **The control is easy to beat.** sun was played with its round-one bugs still in it (the 6-second guess, «ما تنفع», the streak wipe). Beating it shows that the bugs and the missing *why* matter. It does not show that sun's structure is weak: gold and mint *are* sun's structure.
- **No sound.** The lessons were played through a scripted phone with no audio or haptics. The app's correct-answer wave, chimes and buzzes, a large part of its feel, were not judged.
- **No real delay.** "Remember in 3 months" is each persona's prediction. Nothing here measures whether a rule survives 90 days. gold's «بعد ٣ أيام…» was a staged screen, and students called it fake.
- **Tool artefacts.** The scripted input is slow. It inflates every reported duration (students reported 3.5–8 minutes, against QA's 4–5 for mint) and caused some of sun's «خلص الوقت!» complaints. Some chip mis-taps came from text-matched taps rather than anything a finger would do.
- **Order and carry-over.** Every student played the same two rules three times. Later lessons felt easier and staler (two wave-1 students said so about gold, and وليد said so about gold and mint). The order was shuffled, and mint won when played first, which limits the problem, but cannot remove it.
- **"Would quit" is stated, not observed.** Every student finished every lesson.
