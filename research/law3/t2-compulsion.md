# T2 — The mechanics of compulsive engagement, translated for a rule-review feed

Research track T2 for law3, 2026-10-28. Question: what makes TikTok, Duolingo and games hard to put down, how strong is the evidence for each piece, and which pieces can make a 10–15 s rule card pull a 16–18-year-old back every day *without* replacing the learning. Reads on top of `research/rule-memory.md` (the memory science) and the two persona studies (`rule-study.md`, `rule-study-2.md`: best come-back score 6.9/10; countdowns made anxious students quit).

Strength tags: **strong** = replicated or meta-analysed in the relevant setting; **moderate** = solid but in another setting, or one good study; **weak** = thin, contested, or correlational only; **hype** = repeated by practitioners, not shown. "Unverified" means I could not confirm the claim or number.

---

## (A) TL;DR

1. The pull of short video comes from three things together: no cost to get the next item, no natural place to stop, and an open question that each item closes. All three can live in a review feed. Only the first and third should.
2. A rule reel works if it is a *retrieval* reel: the student commits an answer before the trick appears. Curiosity before an answer improves memory for it (Kang 2009; Gruber 2014). That is the same moment that makes a reel watchable.
3. Surprise, not reward, drives the dopamine signal (Schultz 1997). A predictable "صح!" stops working. Make the beat scale with how unexpected the success is — e.g. a fading rule remembered.
4. The "slot machine" claim about apps is mostly hype. Random payouts are also the part regulators and app stores target. Vary the *card type*, never the payout.
5. Difficulty is the hidden engine. Aim each review session at about 80–85% right. A half-life scheduler that calls a rule "due" at 80% predicted recall already lands there.
6. End every session on a likely win and a short "what you kept" screen. The ending is what memory keeps (peak-end rule). This is the cheapest fix for the 6.9 come-back score.
7. The feed must be **finite**: today's due cards, a visible count, a real end. EU rules for minors want infinite scroll and autoplay off by default. Our own data says pressure makes anxious students leave.
8. Streaks work (Duolingo: 7-day streak → 3.6× course completion, correlational). Broken streaks make people quit (Silverman & Barasch 2023) unless they can be repaired. Count a review as a streak day, give earned freezes, allow repair.
9. Juice works up to a point: medium and high beat none and extreme (Kao 2020). Decoration near the content hurts learning (seductive details, g = −0.33). So juice goes on the *answer*, never on the problem while it is being read.
10. The reason to come back tomorrow should be visible: a personal rule collection whose cards visibly fade and get stronger. That is investment (Hooked) made honest — it shows a true memory state, not an invented one.

---

## (B) The mechanism table

Columns: mechanism | evidence and strength | how it appears on a 10–15 s card or in the feed | risk | cost (S/M/L).

### B1. Short-form video

| Mechanism | Evidence [strength] | On a Qudrati rule card / feed | Risk | Cost |
|---|---|---|---|---|
| **Zero-friction next.** The next item arrives with no choice: autoplay or one swipe. | Hiniker et al. CHI 2018: auto "post-play" in a kids' video app extended viewing, cut self-regulation, raised parent intervention [moderate, 24 homes]. Lukoff et al. CHI 2021: autoplay and recommendations reduce sense of agency [moderate, survey n=120]. | After the trick snaps in, one swipe up (or tap anywhere) brings the next card, already loaded. No menu, no "continue" screen between cards. Never auto-advance before the student has answered. | Autopilot tapping; less effort per card. Auto-advance into *extra* content is the dark version. | S |
| **No stopping cue / infinite feed.** Nothing marks an end, so stopping needs a decision. | Wansink's bottomless soup bowl (2005) is the classic, but its author has 13+ retractions and the data are questioned [weak]. Rixen et al. 2023: most reasons people leave a feed are outside the app [moderate, n=46, field]. Kentucky AG filing (2024) quotes TikTok's own research: a habit forms after about 260 videos [moderate as industry knowledge, unverified in public data]. | Do **not** copy. The feed is a stack of today's due cards with a visible count («٦ من ٨»). After the last card there is a real end screen. More is opt-in («جولة زيادة؟»), never automatic. | Overuse; EU DSA guidance for minors says infinite scroll off by default. Extra reps beyond "due" barely help (overlearning fades, rule-memory.md). | S |
| **The 1–3 s hook.** The first frame must make you stay. | TikTok says it weights watching to the end (newsroom 2020) [moderate]. The "3-second" figure is practitioner lore [hype]. | The first frame is the problem itself, in huge numbers, no title: «٩٩ × ٧ = ؟» or «٤٧٪ من ٨٣ ☐ ٨٣٪ من ٤٧». It must look slow by hand and be fast with the rule. No rule name on screen yet (naming it gives the answer away). | Clickbait if the trick then does not apply. | S |
| **Open loop, payoff at the end.** A question opens; the end closes it. | Loewenstein 1994 information-gap theory [moderate]. Kang et al. 2009: curiosity tracks reward areas and predicts recall of surprising answers 1–2 weeks later [moderate]. Gruber et al. 2014: memory better for answers you were curious about, and for unrelated items seen while curious, at 1 day [moderate-strong]. | Card = ask → commit → snap. The student types or taps before anything is shown. The trick then plays on *their* numbers (as the taste screen's swap does). The rule line lands last. | None if the payoff is real. Showing the answer without a commit kills the benefit. | M |
| **Loopable ending.** The end flows into the start so people rewatch. | Practitioner claim [hype]. | Skip as a loop. Keep ↻ «قلها مرة ثانية» on the rule line (exists as `A.ruleAgain`). | Wasted seconds. | S |
| **Personalisation.** The feed learns what you will stay for. | TikTok describes ranking on watch time, completion, replays (newsroom 2020) [moderate]. For learning, the right target is recall, not watch time: spacing and HLR (Settles & Meeder 2016) [strong]. | The scheduler picks the cards: due rules first, then one rule that looks like a due one (interleaving), then at most one new item. Personalised by memory state, not by what the student enjoys. | Optimising for "enjoy" would serve easy cards forever. | M |
| **Completion rate as the core metric.** | TikTok newsroom 2020: finishing a video is a strong signal [moderate]. | Track per card on-device: answered vs abandoned mid-card, and seconds to answer. Use it to find dead cards in tests (no server, so via test panels or opt-in export). The north-star metric stays *recall at the next review*. | Completion is easy to game with easy cards. | S |
| **Variable content quality.** Some reels are great, most are fine: the feed acts like a variable schedule. | Lindström et al. 2021: Instagram posting follows reward-learning models [moderate for social reward]. Calling feeds "slot machines" [hype as stated]. | Vary the *format* card to card: pick, type the answer, true/false, "which rule fits?", "spot the trap", fix-the-mistake. The student never knows which shape is next. Every card is still a real retrieval. | Novelty for its own sake; the persona study disliked one puzzle shape repeated 3–4 times, so variety is also a fix. | M |

### B2. Reward science

| Mechanism | Evidence [strength] | On a Qudrati rule card / feed | Risk | Cost |
|---|---|---|---|---|
| **Reward-prediction error.** Dopamine neurons fire to *better than expected*, go quiet to as-expected, dip to worse. | Schultz, Dayan & Montague 1997, Science [strong in animals, well supported in humans]. | Scale the celebration to surprise. A routine right answer gets a small beat. A rule that was fading (low predicted recall) and is now right gets the big one: «رجعت لك!» plus the rule card flipping to a stronger colour. A personal best time shows only when it is true. | A constant big celebration flattens to nothing; the user already bans confetti. | S |
| **Variable-ratio rewards.** Unpredictable payouts sustain responding. | Skinner-era lab work [strong in animals]. "Apps are slot machines" [hype]. Howard-Jones & Demetriou 2009: 10–11-year-olds chose a coin-toss for points over a sure point in a maths quiz, and the preference grew [moderate]. | Do not randomise payouts. Allowed variety: which card comes next, and occasional true surprises (a rule reaching "gold" at its 90-day mark). | Gambling-like design for minors; loot-box rules (Apple 3.1.1, Google Play require odds if bought). | — |
| **Anticipation over receipt ("wanting" vs "liking").** The pull is strongest just before the outcome. | Knutson et al. 2001: nucleus accumbens rises with *anticipated* gain [strong]. Berridge & Robinson 1998 wanting/liking [strong in animals]. | A 300–500 ms build after the student commits and before the verdict: the chosen chip lifts, a soft rising tick, then the snap. The same grammar as the coin's squat before the jump. | Too long a delay feels like lag. Keep it under half a second. | S |
| **Curiosity helps memory.** Being curious opens a window for learning. | Gruber 2014; Kang 2009 (above) [moderate-strong]. Pretesting even with errors helps later learning (Richland, Kornell & Kao 2009; in rule-memory.md) [strong]. | The guess comes *before* the rule on every new card and on every review. A wrong guess is never punished: no heart, «خمّنت؟ تمام، شوف». | Guessing must not cost XP, or students stop guessing. | S |
| **Open loops between sessions (Zeigarnik).** Unfinished tasks stick in memory. | Ghibellini & Meier 2025 meta-analysis: no recall advantage for unfinished tasks (ratio 0.99) [weak for Zeigarnik]. The urge to *resume* an interrupted task is real (Ovsiankina, ~67% resume) [moderate]. | Do not build "teasers" on Zeigarnik. Do use Ovsiankina: a session left mid-stack resumes exactly where it stopped, with the count showing what is left. | Cliffhanger notifications feel manipulative. | S |

### B3. Challenge calibration and feel

| Mechanism | Evidence [strength] | On a Qudrati rule card / feed | Risk | Cost |
|---|---|---|---|---|
| **The 85% rule.** Learning is fastest when about 15% of trials are errors. | Wilson et al. 2019, Nature Communications: derived for gradient-descent learners, shown in models [moderate as theory; not tested on students learning maths]. Duolingo Birdbrain is reported to target about 70% right (IEEE Spectrum, Duolingo blog) [moderate, company claim]. | A rule is due when HLR predicts recall < 0.8, so a session of due cards already runs near 80%. Add one "stretch" card (a lookalike rule, or a harder number range) per session. If a session drops below about 65%, the next card is easier. | Too easy is boring; too hard drives anxious students away. | M |
| **Flow.** Clear goal, quick feedback, challenge matched to skill. | Fong, Zaleski & Leach 2015 meta-analysis (28 studies): challenge–skill balance relates moderately to flow, less in education [moderate]. | One clear goal per session («٨ قواعد»), feedback in under a second, no screens between cards, no timer. | Timers break flow for the anxious (our persona data). | S |
| **Near-miss.** Almost winning raises the urge to go again. | Clark et al. 2009 Neuron: near-misses recruit win circuitry and raise desire to play [strong, gambling]. Larche, Musielak & Dixon 2017: Candy Crush near-misses raise frustration and urge to continue [moderate]. | Only *honest* near-misses: when a typed answer is off by one known step («قريب! نسيت ÷ ٢»), say so and serve the same card at once with new numbers. That is successive relearning, which rule-memory.md already wants. | Engineered near-misses (fake "so close") are a gambling dark pattern. Never. | S |
| **Combo / in-session streak.** A run of rights builds a visible meter. | Common in Duolingo and match-3 games; no learning evidence found [weak/unverified]. | Already in the app (answer-run sting at 3+). In the feed: a quiet counter that lights; a miss dims it, never a harsh reset sound. | Rewards speed and safe answers; can stop guessing. | S |
| **Juice.** Squash, sound, shake: "maximum output for minimum input". | Jonasson & Purho 2012 talk [practitioner]. Kao 2020: medium and high juice beat none and extreme on experience, motivation, play time and performance [moderate, one game]. Seductive details meta-analysis, g = −0.33 for decoration that competes with content (Sundararajan & Adesope 2020) [strong]. | Juice on the *verdict* only: the chip wave (`adWave`), a pitch-stepped sound, a buzz. Nothing moves while the problem is on screen. Reduced-motion turns it to colour only. | Extreme juice reads childish and distracts. | S |

### B4. Loop mechanics in Duolingo, Brilliant, Clash Royale, Candy Crush

| Mechanism | Evidence [strength] | On a Qudrati rule card / feed | Risk | Cost |
|---|---|---|---|---|
| **Streak.** A count of consecutive days. | Duolingo blog: 7-day streak → 3.6× more likely to finish the course; 2.4× more likely to return next day [weak: correlational]. Letting one lesson extend the streak (split from the goal): +3.3% day-14 retention, +1% daily learners [moderate, A/B]. Duolingo Q2 2024 letter: 1 in 5 DAUs has a 365+ day streak. | A day counts if the student clears the due stack, or does one lesson. On review days the streak flame lights at the last card, not the first. | Guilt; a streak kept by one token card. | S |
| **Streak freeze and repair.** | Duolingo blog: allowing two freezes → +0.38% daily active learners [moderate, A/B]. Silverman & Barasch 2023 (JCR): highlighting a *broken* streak lowers further use; letting people repair it softens that [moderate]. | Earn a freeze by clearing a week. A broken streak can be repaired by clearing two due stacks the next day. Never show "you lost your streak" alone: show the repair. | Shame framing; paying to restore. | S |
| **Loss aversion.** Losses weigh more than gains. | Kahneman & Tversky 1979 [strong as a pattern; size contested, Gal & Rucker 2018]. | The true loss is memory: «٣ قواعد بدأت تبهت» on the path's top card, with a one-tap review. Framed as keeping, not as failing. | Anxiety and nagging if overused. Once a day, max. | S |
| **Leagues.** Weekly ranked groups. | Duolingo blog: leaderboards gave +17% learning time and 3× highly engaged learners [moderate, company claim]. Hanus & Fox 2015: badges + leaderboard in a 16-week course lowered intrinsic motivation and exam scores [moderate]. Mekler et al. 2017: points/leaderboards raised output without hurting intrinsic motivation [moderate]. | Reviews earn the same XP as lessons, so the league rewards reviewing. A fading rule recovered is worth a little more. | Weak students compare badly. Our rivals are simulated and the app no longer says so (see D). | S |
| **Chests and variable rewards.** | Clash Royale's ladder chests were long a *fixed* 240-chest cycle (community-documented) [moderate]: they felt random but were scheduled. Now "Lucky Chests" with guarantees (Supercell, Oct 2025). | Keep the daily chest deterministic (pays by goal, as now). Clearing the due stack can fill the day's chest. | Random paid rewards = loot box. | S |
| **Daily quests.** Small goals with a reward. | Duolingo uses them; no public effect size found [unverified]. | One quest a day can be a review quest: «ثبّت ٣ قواعد تبهت». | Quest spam. One a day. | S |
| **Perfect lesson / end on a high.** | Peak-end rule: Kahneman et al. 1993 (cold water: people chose to repeat the longer trial with a milder end) [strong]. Redelmeier, Katz & Kahneman 2003: a gentler end to colonoscopy → more people came back for the next one [moderate]. | The scheduler puts a card the student will very likely get right last. Then a 3-second "what you kept" screen: the rules cleared, one that got stronger, tomorrow's count. No "perfect" banner for routine runs. | Ending on a miss; ending on a sales pitch. | S |
| **XP boosts and timed challenges.** | Duolingo uses them; effect data not public [unverified]. Timed play hurt our anxious personas [persona data only]. | No timed boosts in review. Optional «اكسر رقمك» per rule once it is solid (half-life > 14 days), as rule-study.md proposed. | Speed over accuracy; anxiety. | S |
| **Brilliant's loop.** Problem first, short steps, streaks, leagues of 30, widgets. | Brilliant help pages (features exist) [feature fact]; no public outcome data found [unverified]. | Problem-first is already the card. The widget/notification is a Capacitor job, not web. | — | M |

### B5. Hooked model

| Mechanism | Evidence [strength] | On a Qudrati rule card / feed | Risk | Cost |
|---|---|---|---|---|
| **Trigger → action → variable reward → investment** (Eyal 2014). | A practitioner framework, not tested as a whole [weak/hype]. Critics: Hari (*Stolen Focus*) on manipulation; utilities like search win by *less* variable reward. | **Trigger:** one daily reminder at a time the student picks («وقت مراجعتك»), Android only; on the web, the path's top card. **Action:** one tap opens the stack. **Reward:** the snap + surprise scaling (B2). **Investment:** see next row. | Turning anxiety about the exam into the internal trigger. | M |
| **Investment / stored value.** What you put in makes leaving cost more. | Nunes & Drèze 2006 "endowed progress": a loyalty card with 2 of 10 stamps pre-filled was completed far more often than a blank 8-stamp card [moderate]. | «دفتر قواعدي»: every learned rule is a card in the student's collection, with a true strength (from its half-life): fading, holding, solid, gold at 90 days. The exam countdown becomes "N rules ready". | Fake progress; collecting replaces using. | M |
| **Notifications.** | Duolingo optimises reminder timing with a bandit (Yancey & Settles 2020, KDD) [moderate, company paper]. EU DSA minors guidance: no notifications artificially timed to regain attention; off in sleep hours [regulatory]. | One reminder, at the student's chosen time, never at night, easy to turn off. No passive-aggressive mascot copy. | Guilt; DSA. | M |

---

## (C) The 8 mechanisms I would bet on, ranked

1. **Commit, then snap.** Every card asks before it shows, and the trick plays on the student's own answer. It is the reel's open loop and the strongest memory tool at once (curiosity, retrieval, prediction error).
2. **A finite, frictionless stack.** One swipe to the next card, preloaded, no screens between, a visible count and a real end. Zero friction gives the TikTok feel; finiteness keeps it legal and kind.
3. **Calibrate to about 80–85% right.** Due-at-0.8 recall plus one stretch card and a softer card after a bad run. Difficulty, not decoration, is what keeps a strong student from boredom and a weak one from quitting.
4. **End on a high.** The last card is a likely win, followed by "what you kept". Peak-end is cheap and directly targets the 6.9 come-back score.
5. **Surprise-scaled celebration.** Small beat for routine, big beat for a fading rule recovered or a true personal best. Prediction error says flat rewards fade.
6. **Honest near-miss → instant retry with new numbers.** Name the one missing step and re-serve the card. It turns the urge to retry into successive relearning.
7. **A forgiving streak that counts reviews.** Clearing the due stack lights the day; earned freezes; repair after a break. Duolingo's A/B data and Silverman & Barasch both point here.
8. **A rule collection with true strength.** The student sees each rule fade and firm up toward the 90-day mark. It is the honest "investment", and the reason to come back tomorrow that the lessons alone did not create.

Juice belongs in all eight, at medium level, on the verdict only.

---

## (D) Lines not to cross

- **No infinite feed and no autoplay into extra cards.** Extra rounds are always a choice. (EU DSA Art. 28 guidelines, July 2025; Hiniker 2018.)
- **No countdown during learning or default review.** Speed only as an opt-in record on solid rules. (Persona studies; the app's own "no timer while learning".)
- **No random payouts, paid or free, and no "double or nothing" with gems.** Odds-based rewards for minors are the loot-box line (Apple 3.1.1, Google Play payments policy).
- **No engineered near-misses.** "So close" only when it is true.
- **No guilt or shame copy**, no crying mascot, no "you lost everything". A broken streak always shows its repair.
- **Notifications:** one, at a time the student chose, never during sleep hours, never timed to win attention back, off with one tap.
- **No fake social proof.** The league rivals are simulated; the app removed the note that said so (CLAUDE.md, 2026-10-26). For a product used by minors, put a plain disclosure back somewhere findable (settings or the league help). Never imply real people.
- **Time-on-app is never the goal metric.** Recall at the next review is. Do not reward reviewing rules that are not due (overlearning fades).
- **Nothing moving while a problem is being read**, and every effect obeys reduced motion and the sound/vibration switches.
- **Stopping is always one tap**, mid-card included, with progress kept. Leaving is never harder than staying (UK Children's Code, standard 13, on nudges).
- **No dark nudges about data** (sign-in, sharing). Same standard 13.

---

## (E) Sources

- Wilson, Shenhav, Straccia & Cohen (2019). The Eighty Five Percent Rule for optimal learning. *Nature Communications* 10, 4646. https://pmc.ncbi.nlm.nih.gov/articles/PMC6831579
- Schultz, Dayan & Montague (1997). A neural substrate of prediction and reward. *Science* 275, 1593–1599. https://www.gatsby.ucl.ac.uk/~dayan/papers/sdm97.html
- Knutson, Adams, Fong & Hommer (2001). Anticipation of increasing monetary reward selectively recruits nucleus accumbens. *J. Neurosci.* https://web.stanford.edu/group/spanlab/Publications/bk01jn.pdf
- Loewenstein (1994). The psychology of curiosity: a review and reinterpretation. *Psychological Bulletin* 116(1), 75–98.
- Kang, Hsu, Krajbich, Loewenstein et al. (2009). The wick in the candle of learning. *Psychological Science*. https://pubmed.ncbi.nlm.nih.gov/19619181/
- Gruber, Gelman & Ranganath (2014). States of curiosity modulate hippocampus-dependent learning via the dopaminergic circuit. *Neuron*. https://pmc.ncbi.nlm.nih.gov/articles/PMC4252494/
- Ghibellini & Meier (2025). Meta-analysis of the Zeigarnik and Ovsiankina effects. *Humanities and Social Sciences Communications*. https://ideas.repec.org/a/pal/palcom/v12y2025i1d10.1057_s41599-025-05000-w.html
- Clark, Lawrence, Astley-Jones & Gray (2009). Gambling near-misses enhance motivation to gamble and recruit win-related brain circuitry. *Neuron*. https://pmc.ncbi.nlm.nih.gov/articles/PMC2658737/
- Larche, Musielak & Dixon (2017). The Candy Crush sweet tooth: near-misses increase frustration and the urge to continue. *J. Gambling Studies*. https://link.springer.com/article/10.1007/s10899-016-9633-7
- Fong, Zaleski & Leach (2015). The challenge–skill balance and antecedents of flow: a meta-analytic investigation. *J. Positive Psychology* 10(5).
- Kao (2020). The effects of juiciness in an action RPG. *Entertainment Computing*. Summary: https://arxiv.org/pdf/2011.09201 (survey citing it)
- Jonasson & Purho (2012). "Juice it or lose it", Nordic Game Jam / GDC Europe. https://gdconf.com/news/gdc_europe_2012_details_the_to
- Sundararajan & Adesope (2020). Keep it coherent: a meta-analysis of the seductive details effect. *Educational Psychology Review* 32, 707–734. https://news.wsu.edu/2020/03/19/seductive-details-inhibit-learning/
- Campos (2025). Juicy or dry? Engagement and retention in interactive infographics. https://arxiv.org/abs/2506.17011v1 [weak, mixed results]
- Hiniker, Heung, Hong & Kientz (2018). Coco's Videos: video-player design features and children's media take-downs. CHI. https://faculty.washington.edu/alexisr/CocosVideos.pdf
- Lukoff et al. (2021). How the design of YouTube influences user sense of agency. CHI. https://ar5iv.labs.arxiv.org/html/2101.11778
- Rixen et al. (2023). The loop and reasons to break it: infinite scrolling and reasons to stop. https://www.uni-ulm.de/fileadmin/website_uni_ulm/iui.inst.100/1-hci/hci-paper/2023/4-TheLoopAndHowToBreakIT.pdf
- Chiossi et al. (2023). Short-form videos degrade our capacity to retain intentions. CHI. https://ar5iv.labs.arxiv.org/html/2302.03714 (TikTok, not Twitter/YouTube, hurt prospective memory; a reason the reel should not be an endless context-switcher)
- Wansink, Painter & North (2005). Bottomless bowls. Doubts: https://statmodeling.stat.columbia.edu/2019/08/20/did-that-bottomless-soup-bowl-experiment-ever-happen/
- NPR (2024-10-11). Lawsuit documents reveal what TikTok executives know (Kentucky AG, 260 videos). https://www.kunc.org/2024-10-11/lawsuit-documents-reveal-what-tiktok-executives-know-about-apps-effect-on-teenagers
- TikTok Newsroom (2020-06-18). How TikTok recommends videos #ForYou. https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en
- Lindström et al. (2021). A computational reward learning account of social media engagement. *Nature Communications*. https://pmc.ncbi.nlm.nih.gov/articles/PMC7966765
- Howard-Jones & Demetriou (2009). Uncertainty and engagement with learning games. *Instructional Science*. https://www.mrcbndu.ox.ac.uk/sites/default/files/pdf_files/Toward%20a%20Science%20of%20Learning%20Games.pdf
- Duolingo blog: How the streak builds habit (3.6×, +1.7%, +0.38%). https://blog.duolingo.com/how-duolingo-streak-builds-habit
- Duolingo blog: Improving the streak (+3.3% D14, +1% DAU). https://blog.duolingo.com/improving-the-streak
- Duolingo blog: Leagues and leaderboards (+17% learning time). https://blog.duolingo.com/duolingo-leagues-leaderboards/
- Duolingo blog: Introducing Birdbrain; IEEE Spectrum on ~70% target. https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain , https://spectrum.ieee.org/duolingo
- Duolingo investor releases 2024 (51% DAU growth; Q2 letter: 1 in 5 DAUs on a 365+ day streak). https://investors.duolingo.com/news-releases/news-release-details/duolingo-finishes-2024-51-daus-growth-more-40-million-daus-and
- Settles & Meeder (2016). A trainable spaced repetition model for language learning (HLR). ACL. Yancey & Settles (2020), recurring-notification bandit, KDD [cited from memory; not re-checked this round].
- Silverman & Barasch (2023). On or off track: how (broken) streaks affect consumer decisions. *J. Consumer Research*. https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions
- Kahneman, Fredrickson, Schreiber & Redelmeier (1993). When more pain is preferred to less. *Psychological Science*. Redelmeier, Katz & Kahneman (2003), *Pain*. https://en.wikipedia.org/wiki/Peak%E2%80%93end_rule
- Hanus & Fox (2015). Assessing the effects of gamification in the classroom. *Computers & Education* 80.
- Mekler, Brühlmann, Tuch & Opwis (2017). Effects of individual gamification elements on intrinsic motivation and performance. *Computers in Human Behavior* 71.
- Sailer & Homner (2020). The gamification of learning: a meta-analysis (g = .49 cognitive, .36 motivational, .25 behavioural). *Educational Psychology Review* 32. https://link.springer.com/article/10.1007/S10648-019-09498-W
- Nunes & Drèze (2006). The endowed progress effect. *J. Consumer Research* [cited from memory].
- Clash Royale chest cycle (community docs) https://www.wepc.com/gaming/clash-royale-chest-cycle-upcoming-chests/ ; Supercell October 2025 update https://supercell.com/en/games/clashroyale/blog/release-notes/october-update-2025
- King / Candy Crush level 65 churn (press report) https://www.techtarget.com/searchbusinessanalytics/feature/Customer-analysis-a-winning-play-for-Candy-Crush-Saga-maker
- Brilliant help: leagues and streak charge. https://brilliant.org/help/features/what-are-leagues-and-leaderboards
- Eyal (2014). *Hooked*. Critiques: https://www.thebehavioralscientist.com/?p=2407 ; Hari (2022) *Stolen Focus*.
- European Commission (2025-07-14). Guidelines on the protection of minors under DSA Art. 28. https://www.hunton.com/privacy-and-cybersecurity-law-blog/european-commission-issues-guidelines-on-the-protection-of-minors
- UK ICO Children's Code, standard 13: nudge techniques. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/13-nudge-techniques/
- Apple App Review Guidelines 3.1.1 (loot-box odds) and Google Play payments policy (randomised items odds) [known policy text; not re-fetched this round].
