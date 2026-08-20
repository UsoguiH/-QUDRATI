# قدراتي — Product Roadmap

**Status date:** 21 August 2026 · **Live:** [qudrati.xyz](https://qudrati.xyz/) (Vercel, auto-deploys from `main`) · **Android:** `Qudrati.apk` (sideloaded)

> This is a working document for a **live product with real users**, not a wishlist.
> Every number below was measured against the current `main` branch or the live site.
> The commands that produce them are in [Appendix A](#appendix-a--how-to-recompute-every-number-here), so this file can be re-scored instead of re-argued.

---

## 0. Start here

If you only do three things this week:

1. **Decide the licence** (§9.6). The 720-question bank is MIT — anyone may sell it. Every day this waits, more forks lock in those rights permanently. It costs an afternoon to change and nothing to decide.
2. **Merge or delete `feat/complete-app`.** ~6 points of finished work — offline play, progress backup, dark mode, practice mode — has been sitting on a branch since the first build sprint.
3. **Add error reporting.** Right now a JavaScript exception on a student's phone is invisible to us. Thirty lines fixes that.

Then run Phase 0, which takes a week and makes everything after it measurable.

---

## 1. Where we are: **42%**

That number needs a definition, because there are two honest readings and they are far apart.

| Reading | Score | What it means |
|---|---|---|
| **"A free quantitative trainer"** — exactly what the README promises today | **~85%** | The thing we said we'd build is nearly built. |
| **"A GAT prep product students rely on and pay for"** — what a deployed, retained, monetized product must be | **42%** | The thing we actually need. |

**42% is the number we plan against.** The gap between 85% and 42% is not sloppiness in what exists — the existing quantitative game is genuinely strong. The gap is that a real product needs a second exam section, an identity, an account, a business model, and a legal posture, and we have none of those.

### 1.1 The scorecard

Weights reflect value to a deployed product, not effort spent.

#### A. Learner-facing product — 67 points, **57% complete**

| Area | Weight | Done | Earned | Evidence |
|---|---:|---:|---:|---|
| Quantitative content (كمي) | 18 | 85% | 15.3 | 720 questions, 30 lessons, 100% method coverage, 107 figures |
| **Verbal content (لفظي)** | 16 | **0%** | 0.0 | Nothing exists. This is 68 of the exam's 120 questions. |
| Game loop & progression | 13 | 95% | 12.4 | Hearts, timer, gems, streak, stars, mistake queue, daily quest, chest, league, 5 rank tiers, power-ups, mock exam |
| UI/UX & design system | 10 | 88% | 8.8 | Full RTL design system, 2,597 lines of CSS, 18 harness screens |
| **Mascot & character system** | 8 | **3%** | 0.2 | One flame, one broken heart, one owl emoji. No character. |
| Accessibility & performance | 2 | 60% | 1.2 | `lang`/`dir`/ARIA correct; FCP 2.6 s throttled; 2 tap targets under 44 px |
| | **67** | | **37.9** | |

#### B. Production & business readiness — 33 points, **13% complete**

| Area | Weight | Done | Earned | Evidence |
|---|---:|---:|---:|---|
| Accounts, sync, backup | 8 | 5% | 0.4 | `localStorage` only. Name is cosmetic. Clear the browser → progress gone forever. |
| PWA / offline / native distribution | 6 | 25% | 1.5 | APK exists but is sideloaded; `manifest.webmanifest` and `sw.js` both **404** on production |
| Analytics & experimentation | 5 | 0% | 0.0 | Zero telemetry. We cannot see a single thing users do. |
| Monetization | 5 | 0% | 0.0 | No pricing, no payments, no plan |
| Legal & compliance | 4 | 30% | 1.2 | ETEC disclaimer ✓. No privacy policy, no ToS, no PDPL posture. |
| Growth: SEO / ASO / referral | 3 | 25% | 0.8 | OG + Twitter cards ✓. `robots.txt` and `sitemap.xml` both **404**. |
| QA, CI, observability | 2 | 20% | 0.4 | `validate.js` covers the data only. No CI, no UI tests, no error tracking. |
| | **33** | | **4.3** | |

**Total: 37.9 + 4.3 = 42.2 → 42%**

### 1.2 The phases at a glance

| # | Phase | Weeks | Moves us to | Blocks |
|---|---|---:|---:|---|
| 0 | Foundation & truth | 1 | 44% | everything measurable |
| 1 | Land the unmerged branch | 1 | 50% | offline, backup |
| 2 | **Mascots & characters** | 4 | 58% | brand, store screenshots |
| 3 | **The verbal section** | 10 | 74% | being a real prep product |
| 4 | Accounts + PDPL | 4 | 83% | analytics identity, payments |
| 5 | Analytics + adaptive | 3 | 91% | every pricing decision |
| 6 | Monetization | 3 | 96% | revenue |
| 7 | Stores, ASO, polish | 4 | 100% | distribution at scale |

Critical path ≈ **26 weeks**, with Phase 2 running alongside Phase 3.

### 1.3 Burn-up: how each phase moves the number

```
P0  Foundation & truth        +2   ▓▓                                    44%
P1  Land the unmerged branch  +6   ▓▓▓▓▓▓                                50%
P2  Mascots & characters      +8   ▓▓▓▓▓▓▓▓                              58%
P3  The verbal section        +16  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                      74%
P4  Accounts + PDPL           +9   ▓▓▓▓▓▓▓▓▓                             83%
P5  Analytics + adaptive      +8   ▓▓▓▓▓▓▓▓                              91%
P6  Monetization              +5   ▓▓▓▓▓                                 96%
P7  Stores, ASO, polish       +4   ▓▓▓▓                                 100%
```

---

## 2. What is actually built (verified inventory)

Not from memory — this is what the code contains today.

### 2.1 Content

| Unit | Lessons | Questions | With method | Figures | Comparison |
|---|---:|---:|---:|---:|---:|
| مهارات وقوانين القدرات (skills) | 9 | 216 | 216 | 27 | 81 |
| أساسيات الأعداد (numbers) | 7 | 168 | 168 | 0 | 56 |
| النسب والنسبة المئوية (ratios) | 4 | 96 | 96 | 0 | 33 |
| الهندسة (geometry) | 10 | 240 | 240 | 80 | 75 |
| **Total** | **30** | **720** | **720 (100%)** | **107** | **245 (34%)** |

Every question carries a step-by-step `solution` **and** a structured `method`. That is unusually complete for a bank this size and is the product's strongest asset.

### 2.2 Systems shipped

Hearts (3/level) · 60 s question timer · gems + spendable economy · lifetime rank XP · 5 rank tiers · daily streak with Rive flame · 1–3 stars per lesson · wrong-answer retry queue · daily quest → chest · daily question card · ghost league · full mock exam (2 × 25 min, free navigation, flagging, sealed sections) · freeze + 50/50 power-ups · two tracks (علمي / أدبي) · exam-date countdown with readiness % · mistakes review · keyboard play · ETEC disclaimer gate.

### 2.3 Measured performance

`node tools/audit.js https://qudrati.xyz/` — throttled mobile profile (~1.6 Mbps, 150 ms RTT, 4× CPU):

```
transfer        317 KB over the wire (Brotli)   11 requests
FCP             2,592 – 2,752 ms   (two runs)
DOMContentLoaded  ~1,950 ms        load  ~2,800 ms
a11y            lang=ar dir=rtl ✓   0 unlabeled controls   0 missing alt
tap targets     2 under 44×44 (login buttons, 340×43)
```

Same site, `--fast` (no throttling): **FCP 1,028 ms**. The 1.6 s difference between the two is almost entirely CPU, not network — which points at exactly one thing.

Transfer is fine. The cost is **parse and execute**: four question-bank files totalling 782 KB of uncompressed JSON-in-JS are render-blocking `<script>` tags, so a low-end phone parses the entire bank before the first pixel. Splitting them behind the unit the student is actually on is the single biggest perf win available.

### 2.4 Built but not shipped — branch `feat/complete-app`

Four commits, 2,159 insertions, sitting unmerged on GitHub since the first build sprint:

practice mode · `js/data/guide.js` (140 rules reference) · achievements · rebuilt stats screen · **PWA: `sw.js` + `manifest.webmanifest` + generated icon set** · progress backup/restore · dark mode · hash routing (real URLs) · unit skip test.

This is finished, working code worth ~6 points. Leaving it on a branch is the cheapest waste in the project. **Phase 1 is entirely about landing it.**

---

## 3. Six hard truths

**1. We cover 43% of the exam and call ourselves a GAT trainer.**
The GAT is 120 questions: **68 verbal, 52 quantitative** ([ETEC](https://beta.etec.gov.sa:2443/ar/MediaAssets/GAT%20General%20Aptitude%20Test.pdf), [Leverage Edu](https://leverageedu.com/learn/what-is-gat/)). We have built the smaller half. For the أدبي track the imbalance is worse — verbal is ~91 of their 120. A student cannot prepare for their exam with us; they can only warm up. This is the largest single gap in the product and it is why Phase 3 carries 16 of the remaining 58 points.

**2. Progress dies with the browser cache.**
Everything lives in one `localStorage` key. A student who builds a 60-day streak, clears their browser, and loses it will not come back — and will tell their friends. We have no way to even know it happened.

**3. We are flying blind.**
No analytics. We cannot answer: how many people play? Where do they quit? Which lesson has a broken question? Does the mock exam get finished? Every product decision after this point is a guess until telemetry exists.

**4. The app has no face.**
`CLAUDE.md` states plainly that the design system is a *"pixel-perfect implementation of the Duolingo design system (colors/radii extracted from Figma)."* That was a fine way to build fast. It is not a fine way to **launch and monetize**. Duolingo's palette, radii, button physics and mascot are protected trade dress, and the more successful we become the more that matters. Phase 2 is not decoration — it is the phase where the product stops being a Duolingo clone and becomes قدراتي.

**5. PDPL is not optional.**
Saudi Arabia's Personal Data Protection Law has been **fully enforced since 14 September 2024** ([SDAIA guidance summary](https://www.pwc.com/m1/en/services/consulting/technology/cyber-security/navigating-data-privacy-regulations/ksa-data-protection-law.html)). It applies to any service processing Saudi residents' data, requires a privacy notice, a lawful basis, data-residency care, breach notification within 72 hours, and — for many operators — SDAIA registration and a named DPO. Today we store nothing on a server, so we are incidentally clean. **The moment Phase 4 ships accounts, we are in scope.** Compliance must land *with* accounts, not after.

**6. Our public documentation is wrong.**
The README advertises *"216 original questions"* (we have 720), *"4 units × 18 lessons"* (we have 30 lessons), and a *"90-second timer"* (it is 60). `CLAUDE.md` repeats the 72-lesson figure and quotes stale line counts. For a live product these are not typos — they are the first thing a contributor, a journalist, or a partner reads. Fixing them is an hour of work and it is in Phase 0.

---

## 4. The phases

Each phase is sized in **weeks of focused work** for one developer with AI assistance, and ends on a stated, checkable condition.

---

### Phase 0 — Foundation & truth · **1 week** · +2 → 44%

Cheap, unglamorous, unblocks measurement.

**Deliverables**
- Correct README + `CLAUDE.md`: 720 questions, 30 lessons, 60 s timer, real line counts, current file map.
- `robots.txt` + `sitemap.xml` + JSON-LD (`EducationalApplication`) — currently 404.
- GitHub Actions CI: run `node tools/validate.js` on every push; block merge on failure.
- Client error reporting (Sentry free tier or a 30-line `window.onerror` → endpoint). Zero-dependency constraint respected: a script tag, not a package.
- Decide the fate of `feat/complete-app` — merge (Phase 1) or delete. No third option.
- `ROADMAP.md` (this file) linked from the README.

**Done when:** README numbers match `validate.js` output, CI is green on `main`, and a deliberately thrown error appears in the error dashboard.

---

### Phase 1 — Land what is already built · **1 week** · +6 → 50%

Merge `feat/complete-app` into `main`, screen by screen, re-verifying each against the current UI (the branch predates the whole UI/UX pass, so expect conflicts in `style.css` and `app.js`).

**Deliverables**
- **PWA**: `manifest.webmanifest`, `sw.js`, icon set → installable, works offline. This matters more in KSA than it sounds: offline play on a commute is a real use case, and "add to home screen" is our only distribution channel until Phase 7.
- **Backup / restore**: export progress as a file, import it back. A stopgap for Truth #2 that costs days instead of the weeks Phase 4 costs.
- Practice mode (free play, no hearts) · rules reference (`guide.js`, 140 rules) · achievements · rebuilt stats · dark mode · hash routing (`/#/path`, `/#/mock` — also fixes deep-linking and browser back) · unit skip test.
- Cache-bust strategy that survives a service worker (today's `?v=6` will fight `sw.js` — the last SW rollout served stale files for hours; see the git history).

**Done when:** Lighthouse reports the site installable, the app loads with the network off, an exported file restores on a second device, and no screen regressed against the 18-screen harness sweep.

---

### Phase 2 — Mascots & characters · **4 weeks** · +8 → 58%

> Flagged as a top priority. Treated as one.

This phase does two jobs at once: it gives the app the emotional hook that makes Duolingo sticky, **and** it is the vehicle for moving off Duolingo's trade dress (Truth #4).

#### 2.1 Why it moves the needle

Duo works because the character is wired into the *loop*, not pasted onto a splash screen: it cheers a correct answer, mourns a wrong one, guards the streak, and shows up in the notification that pulls you back. Duolingo animate their cast with **Rive state machines** driven by live app inputs ([Rive case study](https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life)) — 10 world characters, each with expression and mouth-shape sets.

**We already ship that exact runtime.** `assets/streak/rive.js` + `rive.wasm` + two `.riv` files are in the repo and lazily warmed by `warmStreak()` for the streak flame. The mascot phase reuses a pipeline that is already integrated and already paid for in bytes. This is the cheapest big win left on the board.

#### 2.2 The cast

A one-week design sprint locks this. Recommendation to start from:

**Lead — شاهين, a peregrine falcon.**
- Instantly Saudi, and a bird like Duo without *being* Duo — the silhouette, palette and personality must diverge deliberately.
- Anatomy built for expression: crest feathers (mood), heavy brow (concentration/doubt), beak, wings for gesture.
- Semantically on-theme for قدرات: sharp sight, precision, speed.
- Personality: **encouraging but exacting.** Proud of you, not impressed easily. Never cutesy — our users are 17-year-olds sitting the exam that decides their university, and a saccharine mascot reads as condescending. Warmth through competence.

**Four unit companions**, each in that unit's existing colour token — so the cast is generated by the design system rather than bolted onto it:

| Unit | Colour | Character | Hook |
|---|---|---|---|
| مهارات وقوانين | `#58CC02` green | فَنَك — a fennec fox | Enormous ears; hears the pattern before you do |
| أساسيات الأعداد | `#1CB0F6` blue | قنفود — a hedgehog | Counts on his spines; tallies everything |
| النسب والنسبة المئوية | `#CE82FF` purple | مِيزَة — a cat | Always balancing; lands the ratio every time |
| الهندسة | `#FFC800` yellow | مَهاة — an oryx | Perfectly straight horns; the built-in ruler |

Alternates for the lead if the sprint rejects the falcon: نَجم (a star — continuous with the existing star iconography and the favicon), or a صقر with a different name. **Do not ship a green owl.**

#### 2.3 Integration points — the whole loop, not a splash screen

Every one of these is an existing function in `js/app.js`, so the work is scoped, not speculative:

| # | Where | Function / selector | Character beat |
|---|---|---|---|
| 1 | Welcome / login | `welcomeHero()` | شاهين introduces himself; first impression |
| 2 | Lesson start popup | `.lesson-pop` | The unit's companion peeks in |
| 3 | Correct answer | `.feedback.good` | Quick celebratory beat, ≤600 ms — never blocks the next tap |
| 4 | Wrong answer | `.feedback.bad` | Sympathetic, not scolding; points at the method |
| 5 | Losing a heart | `loseHeart()` | Wince. Third heart = real concern |
| 6 | Lesson complete | `lessonComplete()` | Replaces or joins `flameHero()` |
| 7 | Out of hearts | `sessionFailed()` | Currently a broken heart; give it a face |
| 8 | Streak celebration | `showStreakCelebration()` | Already Rive — the natural first character to rig |
| 9 | On the path | `renderPath()` | Idle companions standing beside nodes, blinking. Duolingo's highest-value ambient use |
| 10 | Chest opening | `A.openChest()` | Reaction to the reward |
| 11 | Rank-up | `showRankUp()` | Ceremony |
| 12 | Empty mistakes list | `renderReview()` | Proud — "قائمتك نظيفة" already says it, give it a face |
| 13 | Mock exam intro | `renderMockHome()` | Serious mode; the cast steps back — the exam is not a game |
| 14 | Push notifications (P7) | — | The streak-rescue message that actually gets opened |

#### 2.4 Technical spec

- **Format:** Rive `.riv`, one file per character, state machine driven by named inputs (`mood`, `intensity`, `trigger`). Same loader as `loadStreakLibs()`.
- **Budget:** ≤ 120 KB per character, lazy-loaded per screen, never on the critical path. The WASM (1.4 MB) is already warmed on lesson start — characters ride that warm-up for free.
- **Fallback:** every character needs a static SVG for reduced-motion, load failure, and the APK's WebView. `prefers-reduced-motion` must fully bypass Rive.
- **Expression set (v1):** idle-blink, happy, sad, worried, celebrate, think, wave. Seven states, not twenty — ship a small set well.
- **Design tokens:** characters use only `:root` variables. No new hardcoded colours.

#### 2.5 Brand divergence (rides along with this phase)

- Shift the palette off Duolingo's exact hex values while keeping the contrast relationships (`#58CC02` → a distinct green anchored to the falcon).
- Own the motion language: our own easing curves and button physics.
- Own the wordmark and app icon; retire the placeholder emoji favicon.
- Re-word `CLAUDE.md` §Tech stack once the design system is genuinely ours.

#### 2.6 The one thing that may need outside help

Everything else in this project has been buildable in-house. Character art is the exception: five rigged Rive characters with a coherent style is illustration work, and a mascot that looks amateur is worse than no mascot at all — it undercuts the trust a student places in an exam-prep tool. Budget for an illustrator for the lead character at minimum, then derive the companions from that style guide.

The four weeks assume the design sprint runs in week 1 and rigging overlaps integration. If the art has to be commissioned, the calendar stretches but the engineering does not — every integration point can be built against an SVG placeholder and swapped to `.riv` when the art lands.

**Done when:** شاهين appears at ≥ 8 of the 14 integration points, all four companions exist, `prefers-reduced-motion` degrades cleanly to SVG, FCP has not regressed, and a stranger shown the app next to Duolingo names them as different products.

---

### Phase 3 — The verbal section (القسم اللفظي) · **10 weeks** · +16 → 74%

The biggest phase in the roadmap, and the one that turns a warm-up into a prep product.

#### 3.1 Scope

Five official question types ([Qiyas](https://x.com/EtecQiyas/status/268664595030355968)):

| Type | Target items | Notes |
|---|---:|---|
| التناظر اللفظي (analogy) | 400 | Relationship pairs; needs a curated relation taxonomy |
| إكمال الجمل (sentence completion) | 400 | One and two blanks |
| الخطأ السياقي (contextual error) | 300 | Four underlined words, one wrong in context |
| المفردة الشاذة (odd one out) | 250 | Cheapest to author; good starting point |
| استيعاب المقروء (reading comprehension) | 150 across ~35 passages | Most expensive; new UI (passage + question pane) |
| **Total** | **~1,500** | vs. 720 quantitative today |

#### 3.2 Why it is 10 weeks and not 3

- **Volume.** Verbal needs roughly double the item count, because vocabulary breadth cannot be drilled with 24 items per lesson.
- **Authoring is genuinely harder.** A quantitative item is verifiable — the arithmetic is right or wrong. A verbal item is a *judgement*: is this analogy relation unambiguous? Is exactly one distractor defensible? Arabic's morphological richness makes near-synonym distractors treacherous. Every item needs a second pair of eyes.
- **Reading comprehension needs new UI.** A scrolling passage pinned beside a question, on a 390 px screen, in RTL, with the question navigator — that is a screen we have never built.
- **The schema must extend.** `question.stem/choices/answer/solution/method` covers analogy, completion and odd-one-out. Contextual error needs word-level markup. Reading comprehension needs a `passage` entity that several questions share.

#### 3.3 Work breakdown

1. **Schema + validator** (1 wk) — extend `tools/validate.js`: no duplicate stems, distractor sanity, passage↔question integrity, per-type difficulty ordering.
2. **UI: the four short types** (1 wk) — mostly reuse `questionBody()`.
3. **UI: reading comprehension** (1.5 wk) — split-pane, passage scroll memory, "back to passage" affordance.
4. **Authoring: 1,500 items** (5 wk) — batched by type, `validate.js` gate on every batch, a human review pass on 100% of items.
5. **Integration** (1 wk) — verbal units on the path, track weighting (أدبي gets the heavier verbal load), verbal in the mistakes queue and daily question.
6. **Full-length mock** (0.5 wk) — replace the 2 × 24 quantitative mock with a true **120-question, 5-section, mixed** simulation matching the real computerized format.

**Done when:** 1,500 verbal items pass `validate.js`, all five types render correctly in RTL on a 280 px screen, and a full 120-question mock completes end to end with a per-section score breakdown.

---

### Phase 4 — Accounts, sync & PDPL · **4 weeks** · +9 → 83%

These ship **together**. Accounts without compliance is a legal liability; compliance without accounts is paperwork for nothing.

**Deliverables**
- Auth: phone/OTP (the Saudi default) or Apple/Google sign-in. Guest play must survive — "بدون تسجيل" is currently a headline feature and forcing signup at the door will cost more users than sync gains.
- Sync: the `S` object to a server, last-write-wins with a conflict prompt, offline-first (the PWA already queues).
- **Data residency:** host the user database **inside KSA** unless SDAIA-adequacy is established for the chosen region. Static-file hosting is a separate question from where personal data lives — our test requests were served from Vercel's `bom1` (Mumbai) PoP, but the PoP follows the requester, so verify the real edge latency from inside KSA before assuming the CDN side is fine, and do not inherit the static host's region for the database.
- Arabic privacy policy + terms of service, in-app and linked from the store listings.
- Lawful basis + consent record, data-subject request path (access / delete / export), 72-hour breach procedure, named DPO, SDAIA registration if required at our scale.
- Account deletion that actually deletes.

**Risk:** this is the phase that ends "zero server, zero dependencies." It is unavoidable — you cannot have retention or payments without identity — but it changes the project's operating cost from £0 to a monthly bill, and adds an on-call surface. Budget for that honestly before starting.

**Done when:** progress survives a factory-reset phone, a deletion request removes every row within the stated window, and the privacy notice is reviewed by someone qualified in Saudi data law.

---

### Phase 5 — Analytics & the adaptive engine · **3 weeks** · +8 → 91%

**Analytics (2 wk)** — privacy-respecting, PDPL-clean, self-hosted or EU/KSA-hosted (Plausible/Umami class, not a US ad-tech SDK).
Events that answer real questions: lesson start/complete/abandon · per-question first-try accuracy and time · heart-loss position · mock completion rate · streak survival curve · D1/D7/D30 retention · funnel from landing → first lesson → second session.
Plus a **content-quality feed**: any question with first-try accuracy < 15% or > 95%, or an abnormal time-to-answer, gets flagged for review. With 2,220 items after Phase 3, this is the only way to find the broken ones.

**Adaptive difficulty (1 wk)** — the real GAT is adaptive; ours is not. Use `S.qstats` (already recorded) to weight selection toward a student's weak areas, and toward items at the edge of their ability. Closes the last 15% of the quantitative content score.

**Done when:** a dashboard shows D7 retention and a per-lesson drop-off curve, and lesson selection demonstrably favours weak topics on a seeded test account.

---

### Phase 6 — Monetization · **3 weeks** · +5 → 96%

Free tier must stay genuinely useful — the market is students, word of mouth is the growth engine, and a paywall at lesson 3 kills it.

**Model to test:** free = full quantitative + verbal, hearts, one mock per week. **قدراتي بلس** = unlimited hearts, unlimited mocks, full explanations library, personalised weak-area plan, no ads, offline pack.
**Pricing:** monthly, plus a "until my exam date" plan — we already ask for the exam date at onboarding (`renderExamSetup`), which is a genuinely better fit for this audience than a rolling subscription.
**Payments:** Mada is mandatory for Saudi cards; add Apple Pay and STC Pay. Tabby/Tamara instalments are normal here and reduce friction on an annual plan.
**In-app purchase rules:** Apple and Google will require their billing for digital goods in their apps — budget the 15–30% and design the pricing around it.

**Done when:** a real card completes a purchase, entitlements sync across devices, and cancellation/refund paths are tested.

---

### Phase 7 — Stores, ASO & final polish · **4 weeks** · +4 → 100%

- **Google Play + App Store.** Today the APK is a raw file in a git repo; asking students to sideload is a trust and security problem, and it forfeits the largest discovery channel we have. Capacitor already wraps the static build.
- **ASO in Arabic:** the search terms are قدرات, قياس, تحصيلي, كمي, لفظي. Screenshots featuring شاهين (now that he exists) do the conversion work.
- **Performance:** split the question bank per unit and load on demand — kills the render-blocking 782 KB parse. Self-host the font (removes the Google Fonts round-trip and a third-party dependency). Target FCP < 1.8 s on the throttled profile.
- **Accessibility:** fix the sub-44 px tap targets, run a screen-reader pass in Arabic, verify contrast across both themes.
- **Referral loop:** invite a friend, both get gems. Cheap, and it is how this category grows.
- **Push notifications:** streak rescue, exam countdown, "your weak topic is waiting". This is where شاهين earns his keep — a notification with a face gets opened. Needs accounts (P4) and a native shell, so it lands here.

**Done when:** both stores are live, FCP < 1.8 s throttled, and an Arabic screen-reader pass completes a lesson start to finish.

---

## 5. The full backlog — everything we still need to add

The phases above are the shape of the work. This is the flat list, so nothing is only implied. Phase column shows where each item lands.

### Content

| Item | Phase | Note |
|---|---|---|
| التناظر اللفظي — 400 items | 3 | |
| إكمال الجمل — 400 items | 3 | |
| الخطأ السياقي — 300 items | 3 | Needs word-level markup in the schema |
| المفردة الشاذة — 250 items | 3 | Cheapest to author — start here |
| استيعاب المقروء — ~35 passages, 150 questions | 3 | Needs a new split-pane screen |
| Full-length 120-question mixed mock | 3 | Replaces today's 2 × 24 quantitative-only mock |
| Rules & formulas reference (`guide.js`, 140 rules) | 1 | Already written, unmerged |
| **"Report this question"** button | 5 | With 2,220 items, user reports are how broken ones get found |
| Adaptive item selection from `S.qstats` | 5 | The real exam is adaptive; ours is not |
| Content-quality dashboard (accuracy outliers) | 5 | |
| More quantitative items to outpace heavy users | ongoing | 720 items = ~72 days at 10/day |

### Learner features

| Item | Phase | Note |
|---|---|---|
| Practice mode (free play, no hearts) | 1 | Already written, unmerged |
| Achievements | 1 | Already written, unmerged |
| Rebuilt stats screen | 1 | Already written, unmerged |
| Dark mode | 1 | Already written, unmerged |
| Unit skip test (placement) | 1 | Already written, unmerged |
| Real URLs / hash routing / browser back | 1 | Already written, unmerged |
| Progress export & import | 1 | Stopgap until accounts exist |
| Offline play (PWA) | 1 | Already written, unmerged |
| Bookmark / save a question for later | 5 | |
| Timed drill mode (exam-pace pressure without a full mock) | 5 | |
| Personalised weak-area study plan | 5 | Feeds the paid tier |
| Progress report a parent or teacher can read | 6 | Frequently the person paying |
| Real leaderboards (people, not ghosts) | post-1.0 | Needs accounts |
| Friends / study groups | post-1.0 | Needs accounts |
| Referral: invite a friend, both get gems | 7 | How this category actually grows |
| Push notifications (streak rescue, exam countdown) | 7 | Needs accounts + native shell |
| Home-screen streak widget | post-1.0 | |

### Brand & characters

| Item | Phase |
|---|---|
| Lead mascot: design, name, expression sheet | 2 |
| Four unit companions | 2 |
| Rive rigs + state machines for all five | 2 |
| Static SVG fallbacks (`prefers-reduced-motion`, APK WebView) | 2 |
| Character beats at the 14 loop integration points | 2 |
| Palette divergence from Duolingo's exact tokens | 2 |
| Own wordmark, app icon, favicon (retire the emoji placeholder) | 2 |
| Own motion language (easing, button physics) | 2 |
| Store screenshots and marketing art featuring the cast | 7 |

### Platform & business

| Item | Phase |
|---|---|
| `robots.txt`, `sitemap.xml`, JSON-LD | 0 |
| CI running `validate.js` on every push | 0 |
| Client error reporting | 0 |
| Accurate README / `CLAUDE.md` | 0 |
| Licence split: engine MIT, content proprietary | 0 |
| Auth (phone/OTP or Apple/Google), guest play preserved | 4 |
| Cloud sync of the `S` object, offline-first | 4 |
| KSA-region data hosting | 4 |
| Arabic privacy policy + terms of service | 4 |
| PDPL: consent record, DSR path, breach procedure, DPO, SDAIA registration | 4 |
| Account deletion that actually deletes | 4 |
| Privacy-respecting analytics (self- or EU/KSA-hosted) | 5 |
| Retention & funnel dashboard | 5 |
| Subscription tiers + entitlement sync | 6 |
| Mada, Apple Pay, STC Pay; Tabby/Tamara instalments | 6 |
| Apple / Google in-app billing for the store builds | 6 |
| Google Play listing | 7 |
| App Store listing | 7 |
| Arabic ASO (قدرات · قياس · كمي · لفظي · تحصيلي) | 7 |
| Per-unit question-bank code splitting | 7 |
| Self-hosted font (drop the Google Fonts round-trip) | 7 |
| Fix sub-44 px tap targets | 7 |
| Arabic screen-reader pass | 7 |

---

### 5.1 Beyond 1.0 — the next horizon

These are deliberately outside the 100%. They are worth building, but only once there are enough real users for them to mean anything — a leaderboard with four people on it is worse than a ghost leaderboard.

- **Real leaderboards.** Replace the ghost opponents in  with actual weekly cohorts.
- **Friends and study groups.** Streak-keeping is far stickier when someone else can see it.
- **التحصيلي (SAAT).** The other exam every Saudi student sits. The engine already handles units, lessons, banks and mocks — it is a content project, not an engineering one.
- **Teacher / school accounts.** Assign lessons, watch a class. This is where institutional revenue lives.
- **Home-screen streak widget** on both platforms.
- **Voice explanations.** The method text already exists for all 720 items; narration makes it usable on a commute.

---

## 6. Sequencing

```
                  ┌─ P2  mascots ────────────────────────┐
                  │                                      │
P0 ──── P1 ───────┼─ P3  verbal ─────────────────────────┼──► P7
                  │                                      │
                  └─ P4  accounts+PDPL ─► P5 ─► P6 ──────┘
```

- **P2 and P3 are independent** — mascot design and verbal authoring do not touch the same files. Run them in parallel if there are two workstreams.
- **P4 gates P5 and P6.** No accounts → no cross-device analytics identity, no entitlements.
- **P5 should gate P6.** Pricing without retention data is a guess.
- **P7 is last** because store screenshots need the mascot, and the listing needs the price.

**Critical path:** P0 → P1 → P3 → P4 → P5 → P6 → P7 ≈ **26 weeks**, with P2 running alongside P3.

---

## 7. Metrics that decide whether this worked

| Metric | Today | Target |
|---|---|---|
| D1 retention | unknown | 40% |
| D7 retention | unknown | 20% |
| D30 retention | unknown | 10% |
| Median session length | unknown | 8 min |
| Lesson completion rate | unknown | 75% |
| Mock exam completion rate | unknown | 50% |
| Free → paid conversion | n/a | 3–5% |
| FCP (throttled mobile) | 2.6 s | < 1.8 s |
| Exam-section coverage | 43% | 100% |

Seven of nine are "unknown" — which is the entire argument for Phase 5.

---

## 8. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| **Trade-dress exposure** — the design system is an acknowledged Duolingo copy | **High** | Phase 2 divergence. Do this before any paid marketing or press, not after. |
| **The question bank is MIT-licensed** — 720 original items, our single most valuable asset, are currently free for anyone to take, rebrand and sell | **High** | Decide before Phase 6. Split the licence: keep the engine MIT, move `js/data/**` to a proprietary or CC BY-NC-ND licence. Retroactive relicensing does not claw back existing copies — the longer this waits, the less it is worth doing. |
| **Verbal authoring stalls** — 1,500 judgement-heavy Arabic items is the largest task here | **High** | Ship type by type; each type is independently releasable. Do not wait for all five. |
| ETEC objection to a third-party trainer | Medium | Disclaimer already prominent. Never reproduce real items. Keep every question original and provable. |
| PDPL non-compliance once accounts exist | Medium | Phase 4 ships them together. Legal review before launch, not after. |
| Store rejection (education/exam category scrutiny) | Medium | Disclaimer in the listing; original content; no claim of ETEC affiliation. |
| Single-developer bus factor | Medium | Docs stay current (Phase 0); no build step keeps onboarding near-zero. |
| Rive assets bloat the critical path | Low | Hard per-character budget, lazy load, SVG fallback. |
| Question bank exhaustion for heavy users | Low | Adaptive re-surfacing (P5) + steady content ops. |

---

## 9. Open decisions

These need an answer from you, not from the code. None of them block Phase 0 or Phase 1.

1. **Mascot species and name.** Falcon/شاهين is the recommendation. Locking this early unblocks all of Phase 2.
2. **Does the free tier stay this generous?** Current pitch is "مجاني بالكامل · بدون تسجيل". Phase 6 changes that promise. Decide before we advertise it further.
3. **Verbal in this app, or a second app?** One app covering the whole exam is the stronger product. A separate قدراتي لفظي is a faster launch. Recommendation: one app.
4. **Backend host.** Data residency (Phase 4) constrains this. KSA-region hosting is the safe default.
5. **`feat/complete-app`** — merge or delete. Phase 0 forces the choice.
6. **The licence.** The whole repo is MIT, including all 720 questions. If قدراتي is ever going to charge money, the bank is the moat and MIT gives it away — a competitor can legally ship our content as their paid app tomorrow. The usual split is engine MIT / content proprietary. This decision gets more expensive every week it waits, because every fork made under MIT keeps those rights permanently. **This is the one open decision worth making this week.**

---

## Appendix A — How to recompute every number here

```bash
# content inventory (lessons, questions, method coverage, figures, comparison)
node tools/validate.js

# production audit: transfer, FCP, a11y, tap targets — throttled mobile profile
node tools/audit.js                              # live site
node tools/audit.js https://qudrati.xyz/ --fast  # same, unthrottled
node tools/serve.js                              # then, in a second shell:
node tools/audit.js http://localhost:8080/index.html

# what production is actually missing
curl -so /dev/null -w "robots %{http_code}\n"   https://qudrati.xyz/robots.txt
curl -so /dev/null -w "sitemap %{http_code}\n"  https://qudrati.xyz/sitemap.xml
curl -so /dev/null -w "manifest %{http_code}\n" https://qudrati.xyz/manifest.webmanifest
curl -so /dev/null -w "sw %{http_code}\n"       https://qudrati.xyz/sw.js

# real compressed transfer size per file
curl -s -H "Accept-Encoding: br" -o /dev/null -w "%{size_download}\n" \
  https://qudrati.xyz/js/data/geometry.js

# the unmerged branch
git diff --stat main...feat/complete-app
```

---

## Appendix B — Sources

- [ETEC — GAT General Aptitude Test (official PDF)](https://beta.etec.gov.sa:2443/ar/MediaAssets/GAT%20General%20Aptitude%20Test.pdf?csf=1&e=am0axw)
- [Leverage Edu — GAT structure: 120 questions, 68 verbal / 52 quantitative](https://leverageedu.com/learn/what-is-gat/)
- [Keystone Tutors — General Aptitude Test guide (2 hours, 25-minute sections)](https://www.keystonetutors.com/news/general-aptitude-test-guide)
- [Qiyas (@EtecQiyas) — verbal question types](https://x.com/EtecQiyas/status/268664595030355968)
- [مبهر — القسم اللفظي: خمسة أنواع من الأسئلة](https://blog.mubhir.sa/%D8%A7%D8%AE%D8%AA%D8%A8%D8%A7%D8%B1-%D9%82%D9%8A%D8%A7%D8%B3-%D9%84%D9%81%D8%B8%D9%8A/)
- [PwC Middle East — KSA Personal Data Protection Law](https://www.pwc.com/m1/en/services/consulting/technology/cyber-security/navigating-data-privacy-regulations/ksa-data-protection-law.html)
- [Clyde & Co — countdown to PDPL compliance](https://www.clydeco.com/en/insights/2024/01/countdown-to-compliance-with-saudi-arabia-pdpl)
- [Rive — how Duolingo animates its characters with state machines](https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life)
- [Elisa Wicki — how exactly Duolingo uses Rive for character animation](https://elisawicki.blog/p/how-exactly-is-duolingo-using-rive)
