# T4: How the best products teach a rule, and how they bring it back

*Research track T4 for «law3», 2026-10-28. The question: how should a student meet a maths rule in about 90 seconds and still own it about 90 days later, with a pull like TikTok or Duolingo? The working idea is «the review is the reel». Sources are in (D). "Unverified" means I could not confirm it from a primary source.*

---

## (A) TL;DR

1. Nobody we studied ships "rule reels" for maths with published retention data. Swipe-feed learning apps (Imprint, Nibble, ScrollEd, Studii, Coursera's 2026 feed) publish downloads, not learning.
2. The products with real evidence behind them share one move: **the review asks the student to do something, never only to watch.** Duolingo's practice, Khan's Mastery Challenges, Brilliant's practice sets and Anki's "use" cards all make the student produce an answer.
3. Duolingo's review machinery is quiet and invisible. A model (Half-Life Regression) picks what returns. Mistakes come back at the lesson's end, in a daily practice session and in a "Mistakes" set of 10. It is labelled ("previous mistake"), never a separate guilt list.
4. Brilliant's loop is **problem first, then a tiny reveal, then practice with the scaffolding removed**. It now adds a tutor (Koji, May 2026) that "asks instead of tells".
5. Viral maths shorts use a hook in the first seconds ("you're doing this the slow way"), a live demo on real numbers, a one-line reveal and a loop back to the start. That shape fits a **first meeting**. Watching alone does not make a review.
6. Evidence on short video is mixed. Shorter videos hold attention better (Guo 2014). One 2025 study found split-up short clips gave *worse* recall than one matched long video. TikTok-style switching hurt prospective memory (Chiossi 2023). A reel feed needs a question inside every card.
7. Games that teach fast (DragonBox) can fail to transfer. Long & Aleven found DragonBox did not improve standard equation solving. **Every review card must use the exam's own notation and format.**
8. Wordle, Candy Crush and Clash Royale point the same way: a **small, finished daily set** beats an endless feed for coming back. Wardle: "three minutes a day. And that's it."
9. Our best existing asset is what students loved in mint: the tap-to-pair "why ÷ 2". Keep it as the 90-second first meeting. Reviews become 10–15 s *do-it* cards: fresh numbers, which-rule-fits, spot-the-error and backwards problems.
10. Recommendation: build "the review is the reel" as **a short daily stack (5–8 cards, ends)**, not an infinite feed. Swipe only after answering. Every card is an exam-format micro-problem. A wrong card shows the reveal for 3 s and comes back later in the stack with new numbers.

---

## (B) Product teardowns

### 1. Duolingo (language, Math, practice, Legendary, Explain My Answer, Score)

**The loop**
- A lesson is about 15 exercises. Birdbrain predicts the chance of a right answer and aims for about 70% when you are doing well, easier items when you struggle (Duolingo blog; IEEE Spectrum).
- Mistakes return **at the end of the same lesson**. The blog calls this "a little spaced repetition".
- Since the 2022 path, practice sits inside the path, and lessons are ordered so concepts return after gaps. The blog's line: "Practice is also forward progress."
- **Practice Hub** (barbell tab): a personalised session refreshes daily, picked by "spaced repetition (along with accuracy)". **Mistakes** reviews "10 mistakes" per set. Words, Listen, Speak and Stories are on demand.
- **Legendary** is a harder replay of a unit. It is per unit since the path. Third-party reports say it is mostly typed translation and allows about two mistakes, sometimes costing gems (unverified, secondary sources).
- **Explain My Answer** is a button after an exercise that explains why your answer was right or wrong, tailored to the error. It became free for all learners in January 2026. **Video Call** (Lily) is an AI conversation about what you just studied (Max, expanding to Super in 2026).
- **Duolingo Score** (0–160) is a single growing number tied to CEFR. It rises as you finish lessons.

**From our decompiled-app notes** (`F:\Claude ( New Start )\Duolingo Study\notes\`)
- `design/02-components.md`: in-lesson exercise labels `HARD_EXERCISE`, `PREVIOUS_MISTAKE`, `NEW_WORD`, `COMBO`. A returning mistake is tagged on screen.
- `design/03-motion-patterns.md`: a "previous mistakes" segment opens with its own primer sound (`lesson_segment_primer_sfx.mp3`, 2.06 s) and three soft haptic swells. The wrong-answer title becomes "Common mistake!" when a smart tip shows.
- `duolingo-lesson-complete-spec.md`: the session-end queue includes `LEGENDARY_SESSION_COMPLETE` and `MATCH_MADNESS`. A "MistakeEraser" headline fires when 3 or more mistakes were fixed in the lesson.
- `duolingo-home-path-spec.md`: path items include `TROPHY_LEGENDARY` and a unit-review trophy, with sparkles over legendary nodes.
- The notes have no Practice Hub screen spec. That part comes from the blog only.

**Data**
- Half-Life Regression cut recall-prediction error by more than 45% against baselines. It raised daily engagement by 12% in a live test (Settles & Meeder 2016).
- Duolingo reports that five course sections taught as much reading and listening as five university semesters (company-run studies; sample sizes not given on the blog).
- **No efficacy study of Duolingo Math was found.** The Math team says numbers are "drawn dynamically in code", so no two lessons repeat.

**Steal**
- The review is invisible plumbing. Mistakes come back inside normal play, tagged, with a primer sound.
- A "you fixed N mistakes" headline turns review into a win.
- Fresh numbers every time, as Duolingo Math does. We already have learn.js generators.
- A one-tap "why?" after an answer, like Explain My Answer.

**Avoid**
- Legendary behind gems. It reads as a paywall on mastery.
- Endless practice with no end. Duolingo's sets are short and finish.

### 2. Brilliant.org

**The loop**
- "Brilliant often asks a question before presenting a procedure. That first attempt gives the explanation a purpose" (Brilliant, *How Brilliant teaches math*).
- Each screen is a short prompt plus an interactive. A wrong answer gets a hint, not the answer. Text is a few sentences at most.
- In practice "scaffolding" is removed so "the learner must retrieve and apply the idea independently". Brilliant says it returns to ideas across sessions and mixes problem types "so the learner must decide which strategy applies".
- Game layer: XP, weekly **leagues of 30** learners across 10 tiers (Hydrogen to Einsteinium), a daily streak with up to two **Streak Charges** (help centre). Its sound panel (our `tools/brilliant-sounds/`) also names `streak-inlesson`, `level-mastered`, `skill-check-failed` and `diagnostic-complete`. That suggests in-lesson combos, level mastery and skill checks (inferred from file names only).
- **Koji** (May 2026): a tutor that "can see what's on your screen", points and sketches on it, and "never, ever just hands you the answer".

**Data**: Brilliant cites the literature it builds on (Freeman 2014, Roediger & Karpicke 2006, Rohrer & Taylor 2007). It publishes no outcome data of its own that I found. Its "6× more effective than video" claim has no source I could trace (unverified).

**Steal**: the problem comes before the rule. A wrong answer gets a nudge, not the answer. Practice removes the scaffolding. Mix rules so the student must choose one.
**Avoid**: long lessons. Brilliant's lessons run about 15 minutes, which is our mint problem again.

### 3. Quizlet (Learn, Q-Chat)

**The loop**
- **Learn** (2017) is adaptive rounds. It moves from recognition (multiple choice) to production (written). Cards you miss return more often within the session, "only as often as needed" (THE Journal, 2017).
- Learn mostly schedules **within** a session. A separate paid "long-term learning" mode spreads reviews across days (secondary source; unverified detail).
- **Q-Chat** was an AI tutor launched in 2023 on OpenAI's API. It was discontinued after **30 June 2025**. Quizlet gave no public reason.

**Steal**: escalate the answer format, from tap, to fill a tile, to type.
**Avoid**: term–definition cards for maths. A rule is a procedure plus when to use it, not a word pair (Pan & Rickard 2018, in `research/rule-memory.md`). The Q-Chat shutdown is a warning that chat tutors are costly and optional.

### 4. Anki, and how experienced users card maths (RemNote and Mochi are similar SRS tools; not studied in depth)

**The loop**: you see a prompt, recall, reveal and grade yourself (Again, Hard, Good, Easy). The scheduler (now FSRS) sets the next date.

**What expert users say**
- Michael Nielsen breaks a theorem into "atomic" cards, each "a single idea", with several restatements from different angles. He then makes "variations, pushing the boundaries". He warns that "much of the value is in the process of constructing the cards".
- Andy Matuschak's rules for good prompts: focused, precise, consistent, tractable ("you can almost always answer correctly"), effortful (real retrieval, no giveaway). For concepts, he says to ask from several angles: attributes, similarities and differences, causes, significance.
- Maths users favour cards that make you **apply** the rule to a case over cards that make you recite it (community advice; see `rule-memory.md`).

**Steal**: one idea per card. The same rule asked from 3–4 angles (apply, name, why, spot-the-error) is the "consistent but varied" balance. The interval grows with success.
**Avoid**: self-grading. Teenagers over-rate themselves. Our cards should be auto-graded. Avoid bare formula recitation too.

### 5. Short-form maths creators (TikTok, Reels, Shorts)

**The typical structure** (a pattern observed across the genre; not a measured study)
- **0–2 s, the hook.** A claim or a challenge on screen: "Multiply 47 × 83 in 3 seconds", "You've been doing this wrong". Marketing guides call this a curiosity gap or pattern interrupt (opus.pro and others; practitioner advice, not research).
- **2–10 s, the slow way, or a dare.** Sometimes the creator shows the long method, or invites viewers to pause and try.
- **10–30 s, the demo on real numbers.** Handwriting or a whiteboard, the trick done live, often coloured digits.
- **The reveal line.** One sentence that names the trick.
- **The loop.** The last frame matches the first, or ends on "try this one" with a new problem. That invites a rewatch or a comment answer.
- **Arabic and Saudi Qudrat content.** TikTok has Arabic discover pages for Qudrat topics, such as «شرح قدرات في الشكل المجاور مستطيل اوجد مساحة الشكل المظلل» and «حيل قدرات كمي». The common format seems to be a teacher solving one exam-style question with a pen, voice over the screen. I could not load the pages to verify creators, view counts or a typical length. Treat this as unverified.

**Research on short video**
- Guo, Kim & Rubin (2014), 6.9 million edX sessions: engagement drops sharply after 6 minutes. Informal and hand-drawn videos are more engaging.
- Szpunar, Khan & Schacter (2013): quizzes inside a 21-minute lecture halved mind-wandering (about 40% to 20%) and improved later recall.
- Chiossi et al. (CHI 2023, N = 60): TikTok-style use between tasks degraded prospective memory. Twitter and YouTube did not.
- npj Science of Learning (2025, N = 57): several short clips gave poorer recall than one matched long video (from the abstract summary; I did not read it in full).

**Steal**: the hook, the live demo on the exam's own numbers, and the one-line reveal. That is our see card, made faster.
**Avoid**: a review that is only a clip. Watching feels like learning and is not retrieval. Avoid "you're doing it wrong" said *to* the student. Aim it at "the slow way".

### 6. Swipe-feed learning apps

| App | Format | What they report |
|---|---|---|
| Imprint | Visual story cards, chapters of "two minutes or less", a daily quiz | "Over 4 million learners" (store copy). No retention data. A rival's review: skimmed cards "rarely stick" without a recall system |
| Nibble | Bite-size lessons on 30+ topics, daily quiz | 43k US ratings, 4.3 stars (secondary). No learning data |
| ScrollEd (2026) | Turns PDFs into a vertical feed of AI video, audio and quizzes. Swipe up for the next topic, sideways for depth | Press coverage only |
| Studii | "Brainrot Mode" vs "Study Mode" feed | Store copy only |
| Doomersion (YC W2026) | Language video feed. Tap a word to make a flashcard | "15,000 downloads in two weeks" (secondary; unverified) |
| Coursera feed (June 2026) | AI-curated short clips | No metrics |
| Duolingo, Khan, Quizlet | No public vertical-feed experiment found | — |

**Steal**: the swipe gesture is learned. Students already know it, so it needs no teaching. A sideways swipe for "why" is a good idea (ScrollEd).
**Avoid**: an endless feed. None of these apps publish learning outcomes. The ones with evidence (Duolingo, Khan, Anki) use finite, scheduled sets.

### 7. Games that teach a rule fast

- **DragonBox Algebra.** Equations are hidden as cards and monsters, and algebra symbols fade in over time. In the 2013 Washington Algebra Challenge, 92.9% of students who played 1.5 hours reached the game's mastery (University of Washington / DragonBox). **But** Long & Aleven (CMU) found it "ineffective … as measured by a typical test of equation solving". "The learning … does not transfer out of the game." Lesson: concreteness must fade all the way to exam notation (Fyfe et al. 2014).
- **Prodigy.** A fantasy RPG where battles are maths questions. Its efficacy reports are company-commissioned and correlational (for example, Texas schools with 40+ teacher assignments: +13.8 scaled-score points). Treat these as marketing.
- **Brain Out and other trick puzzles.** Each level breaks the obvious answer, so the "aha" is the reward. Steal the surprise. Avoid trick-for-trick's-sake: exam questions reward the rule, not lateral jokes (general description; unverified details).
- **Wordle.** One puzzle a day, the same for everyone, plus a spoiler-free share grid. Wardle: "It doesn't want any more of your time than that."
- **Candy Crush.** Five lives, one back every 30 minutes, which caps the session. **Clash Royale (2016 design).** Chests take 3–8 hours to unlock. Four slots stop progress after a few wins, and a notification brings you back to a "very positive return session" (Deconstructor of Fun). Supercell has since changed chests; details unverified.

**Steal**: a finished daily set. A return that opens with a win. The same daily challenge for everyone in a league.
**Avoid**: timers that block learning. The exam needs volume. Lives on reviews would punish exactly the forgetting we want to surface.

### 8. Exam-prep apps

- **Magoosh GMAT Math Flashcards**: 425 cards with questions, solutions and "common mistakes". Cards you miss return more often; known cards stop. A "mastered" count rises.
- **Khan Academy Mastery Challenges**: 3 earlier skills, 2 questions each, shuffled. 2 of 2 right levels a skill up, 0 of 2 levels it down. Skills are chosen by time since last review and mastery level. Once started, a challenge must be finished within 12 hours. (Correction to `research/rule-memory.md`, which says "at least 12 hours between them". The help article says 12 hours to *finish*.)
- **UWorld (SAT and others)**: flashcards made from missed bank questions and their explanations, then scheduled by spaced repetition. A "My Notebook" collects notes.
- **Saudi Qudrat apps** («تدريب قياس القدرات العامة», «قدرات», «تفوق», «١٠ في ١٠ للقدرات»): store pages describe question banks, mock tests, explanation videos and "quick solving methods". I found no spaced review or rule-level tracking described. Their mechanics are unverified beyond the store copy.

**Steal**: Khan's level-up and level-down from 2 questions. UWorld's "your missed question becomes a card". Magoosh's mastered count.
**Avoid**: a bank-only review. Saudi apps compete on bank size. A rule scheduler is our gap to own.

---

## (C) Pattern library

First meeting = **F**. Review card = **R**. Times are targets.

| # | Pattern | Student sees / does (one line) | Used by | Why it works | Risk |
|---|---|---|---|---|---|
| 1 | **Guess first** (F, 5 s) | A question sized to look slow; they guess before any rule | Brilliant, our «جرّب», TikTok dares | Pretesting and curiosity aid later memory (Richland 2009; Kornell 2009; Gruber 2014) | A guess that feels like a test. Say «خمّن»; no red |
| 2 | **Slow way vs fast way** (F, 5 s) | Two lanes: long working ticks along while the trick lands in one line | TikTok "you've been doing it wrong" | Contrast makes the gain visible; surprise aids memory | Condescension. Blame "the slow way", never the student |
| 3 | **Trick on the numbers** (F, 10 s) | The rule happens *on* the problem's own digits, step by step | TikTok demos, our `tasteSwap`, see cards | Dual coding (Mayer 2009); worked examples for novices (Sweller) | Passive. Keep each beat under 3 s, then hand over |
| 4 | **Tap to discover** (F, 20 s) | They make the step that reveals the rule (pair the ends, count the pairs) | Brilliant interactives, mint's «ليش ÷ ٢» | Generation effect (Bertsch 2007); mint's most-loved screen | Length. One interaction, not three |
| 5 | **One-line rule with lit terms** (F, 5 s) | The rule appears as one line; its terms light as chips | Our rule card, Magoosh formula cards | A name and cue for retrieval; dual code | Reciting without using. Always follow with an apply |
| 6 | **Fresh numbers** (R, 10 s) | A new exam-style problem the rule solves; answer on the keypad | Duolingo Math, Anki "use" cards, Khan | Retrieval that transfers needs application (Pan & Rickard 2018) | Generator makes trivial or repeated cases |
| 7 | **Which rule fits?** (R, 8 s) | A problem plus 3 rule names; tap the one that solves it | Brilliant mixed practice, Khan shuffled challenges | Interleaving: choosing the method (Rohrer 2015, 2020) | Needs 3+ learned rules; look-alikes must be real |
| 8 | **Spot the error** (R, 12 s) | «أحمد كتب …» with one step wrong; tap the wrong step | Duolingo "Common mistake!", Magoosh "common mistakes" | Erroneous examples aid algebra learning (Booth et al. 2013) | Priming the wrong form. Show the fix at once |
| 9 | **Backwards problem** (R, 15 s) | The answer is given; find the input (٩١ كرسي — كم صف؟) | mint's last round, Nielsen's "variations" | Flexible use; strong students loved it | Too hard for weak students. Use as a bonus card |
| 10 | **Comes back with new numbers** (F+R) | A missed card returns later in the same stack, new digits, tagged «رجعت لك» | Duolingo end-of-lesson mistakes, Quizlet Learn | Successive relearning (Rawson & Dunlosky 2011) | Same numbers feel cheap (mint complaint) |
| 11 | **Tagged return** (R, 1 s) | A small label: «غلطت فيها قبل» / «صعبة» / «جديدة» | Duolingo `PREVIOUS_MISTAKE`, `HARD_EXERCISE` + primer sound | Signals why this card is here | Shame. Word it as a second chance |
| 12 | **Finite daily stack** (R, 60–90 s) | «مراجعة اليوم: ٦ بطاقات», a bar, then done | Wordle, Khan's 6 questions, Duolingo's daily practice | Scarcity and a clean finish bring people back; spacing needs the gap | Strong students want more. Offer «زيدني» after the end |
| 13 | **Swipe after answering** (R) | The card locks until answered; then swipe up for the next | Feed apps (gesture), Szpunar's interpolated tests | No passive scrolling; testing stops mind-wandering (Szpunar 2013) | Users try to swipe past. Make the lock obvious and kind |
| 14 | **Sideways swipe = why** (F+R, 5 s) | Swipe left on any card to replay the 3 s reveal or the «ليش؟» pairing | ScrollEd, Explain My Answer, Koji | Self-explanation (Bisra 2018); on demand, so no wall of text | Becomes a crutch. Hide it until after the answer |
| 15 | **Show the reveal after a miss** (R, 3 s) | Wrong: the trick's rows replay for 3 s; the card comes back later | Duolingo, Brilliant hints | Feedback after retrieval (Hattie & Timperley 2007) | Giving the answer too early. Replay the rule, not the result |
| 16 | **Rule strength you can see** (R) | Each rule in the deck has a meter that fades with time and refills on a review | Quizlet memory score, Magoosh mastered count, Duolingo's old cracked skills (unverified) | Makes forgetting visible; gives a reason to open | Guilt. One review must refill it fast |
| 17 | **Level up / down from 2 answers** (R) | Two cards per rule in a stack: 2 right moves it up a level, 0 right moves it down | Khan Mastery Challenges | A simple, honest scheduler students can read | Noisy with two items. Pair it with HLR |
| 18 | **Speed round on old rules** (R, opt-in) | 5 known rules, a soft pace, «كم ثانية تاخذ؟» | Duolingo Match Madness, Legendary | The exam is timed; fluency is the late goal | Anxious students quit at timers (mint data). Only when h > 14 days |
| 19 | **Unit boss without help** (R, 2 min) | All unit rules mixed, no hints, two slips allowed | Duolingo Legendary | A capstone gives a goal and status | Gems or a paywall feel. Make it free |
| 20 | **Return that opens with a win** | The stack starts with the strongest rule, then the due ones | Clash Royale chest return, Duolingo's ~70% target | Early success keeps momentum (Birdbrain target) | Too easy is boring. Keep one easy card only |

**How the patterns fit together** (a proposal for the other tracks to test)
- **First meeting, about 90 s**: 1 → 2/3 → 4 → 5 → 6 once.
- **Each later review, 10–15 s a card**: mostly 6, plus 7 and 8, sometimes 9, with 10, 11, 13, 14 and 15 around them.
- **The daily stack**: pattern 12, started with pattern 20.
- **The deck screen**: patterns 16 and 17. Patterns 18 and 19 come later in the 90 days.

---

## (D) Sources

**Duolingo**
- Settles & Meeder (2016), *A Trainable Spaced Repetition Model for Language Learning*, ACL. https://aclanthology.org/P16-1174
- Birdbrain: https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain · https://spectrum.ieee.org/duolingo
- Spaced repetition: https://blog.duolingo.com/spaced-repetition-for-learning
- Path redesign: https://blog.duolingo.com/new-duolingo-home-screen-design/
- Practice Hub: https://blog.duolingo.com/guide-to-duolingo-practice-hub/
- Explain My Answer free: https://blog.duolingo.com/explain-my-answer-now-free · Max: https://blog.duolingo.com/duolingo-max
- Developing Math: https://blog.duolingo.com/developing-math
- Score: https://blog.duolingo.com/duolingo-score/
- Efficacy: https://blog.duolingo.com/results-duolingo-efficacy-studies
- Legendary (secondary): https://duolingo.fandom.com/wiki/Gem
- Our notes: `Duolingo Study/notes/design/02-components.md`, `design/03-motion-patterns.md`, `duolingo-lesson-complete-spec.md`, `duolingo-home-path-spec.md`

**Brilliant**
- How Brilliant teaches math: https://brilliant.org/resources/choosing-brilliant/how-brilliant-teaches-math/
- Koji: https://blog.brilliant.org/a-world-class-tutor-in-every-home/ · https://brilliant.org/help/features/how-does-koji-work/
- Leagues: https://brilliant.org/help/features/what-are-leagues-and-leaderboards · Streaks: https://brilliant.org/help/using-brilliant/what-is-a-streak-charge
- App Store listing: https://apps.apple.com/app/brilliant-learn-by-doing/id913335252

**Quizlet, Anki**
- Quizlet Learn (2017): https://thejournal.com/articles/2017/03/09/quizlet-debuts-study-feature-that-helps-students-study-efficiently.aspx
- Q-Chat discontinued (secondary): https://quizgecko.com/blog/best-q-chat-alternative
- Nielsen, *Using spaced repetition systems to see through a piece of mathematics*: https://cognitivemedium.com/srs-mathematics
- Matuschak, *How to write good prompts*: https://andymatuschak.org/prompts/

**Short video and attention**
- Guo, Kim & Rubin (2014), L@S: https://up.csail.mit.edu/other-pubs/las2014-pguo-engagement.pdf
- Szpunar, Khan & Schacter (2013), PNAS: https://pmc.ncbi.nlm.nih.gov/articles/PMC3631699/
- Chiossi et al. (2023), CHI: https://arxiv.org/abs/2302.03714
- Fragmented learning from short videos (2025), npj Science of Learning: https://www.nature.com/articles/s41539-025-00399-y
- Hook advice (practitioner): https://www.opus.pro/blog/tiktok-hook-formulas
- TikTok Qudrat discover pages (not loadable): https://www.tiktok.com/discover/ (search «حيل قدرات كمي»)

**Feed apps**
- ScrollEd: https://www.tubefilter.com/2026/09/21/scrolled-turns-textbooks-into-tiktok-feeds-new-app/
- Studii: https://apps.apple.com/ca/app/studii-doomscroll-learn/id6755154363
- Imprint: https://apps.apple.com/app/id1482780647 · Nibble vs Imprint: https://nibble-app.com/blog/nibble-vs-imprint
- Doomersion (secondary): https://www.startuphub.ai/ai-news/claudes-corner/2026/claudes-corner-doomersion-yc-w2026.md
- Coursera feed: https://www.digitaltrends.com/cool-tech/coursera-wants-users-to-learn-through-shorter-faster-content/

**Games**
- DragonBox Algebra Challenge: https://dragonbox.com/about/algebra-challenge · Long & Aleven via EdSurge: https://edsurge.com/news/2016-03-13-enter-the-dragonbox-can-a-game-really-teach-third-graders-algebra
- Prodigy reports: https://www.prodigygame.com/research
- Wordle: https://news.northeastern.edu/2022/01/21/what-makes-wordle-so-g-r-e-a-t/
- Candy Crush lives: https://candycrush.fandom.com/wiki/Lives
- Clash Royale: https://mobilefreetoplay.com/deconstructing-clash-royale/

**Exam prep**
- Magoosh GMAT Math Flashcards: https://apps.apple.com/us/app/-/id834715454
- Khan Mastery Challenges: https://support.khanacademy.org/hc/en-us/articles/360037494231
- UWorld flashcards: https://collegeprep.uworld.com/flashcards/
- Saudi apps: https://apps.apple.com/sa/app/id1535318056 · https://apps.apple.com/us/app/id6720723334 · https://apps.apple.com/us/app/id6654904663

**Learning science cited in (C)**: Booth, Lange, Koedinger & Newton (2013), *Learning and Instruction* (erroneous examples). The rest are as in `research/rule-memory.md`.
