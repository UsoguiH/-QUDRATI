# قدراتي — Development Roadmap

**Rewritten 21 August 2026.** Supersedes everything before it.
**Live:** [qudrati.xyz](https://qudrati.xyz/) · Vercel, auto-deploys from `main` · **Android:** sideloaded APK
**Target:** 10,000+ Saudi students preparing for اختبار القدرات العامة.

> This roadmap is built from two research passes — one on what Duolingo actually *is* as an
> engineering and product system, one on who the قدرات student actually *is* — and then from a
> line-by-line reading of what we have. Sources are in [Appendix C](#appendix-c--sources).
>
> `feat/complete-app` is not part of this plan — nothing here depends on it. The branch stays
> where it is; treat it as an archive to read, not a base to build on.

---

## Contents

- [Part 0 — The one thing that changes everything](#part-0--the-one-thing-that-changes-everything)
- [Part 1 — Research: what Duolingo actually is](#part-1--research-what-duolingo-actually-is)
- [Part 2 — Research: the قدرات student](#part-2--research-the-قدرات-student)
- [Part 3 — Where we actually are](#part-3--where-we-actually-are)
- [Part 4 — Target architecture](#part-4--target-architecture)
- [Part 5 — The build plan](#part-5--the-build-plan)
- [Part 6 — Metrics](#part-6--metrics)
- [Part 7 — Risks](#part-7--risks)
- [Part 8 — Decisions needed from you](#part-8--decisions-needed-from-you)

---

# Part 0 — The one thing that changes everything

Copying Duolingo's mechanics without understanding this will cost us the product.

**Duolingo's user has no deadline. Ours has one, and then leaves.**

Duolingo optimises for an infinite horizon. Their entire machine — a 400-day streak, ten league tiers
that take at least ten weeks to climb, a rolling subscription — assumes you might still be learning
Spanish in 2030. Their 28% monthly churn is a number they fight forever.

Our student books a test date, studies hard for six to twelve weeks, sits the exam, and is *done*.
For them, churning is success. A 400-day streak is not merely useless; it is faintly insulting.

Everything downstream changes:

| Duolingo | قدراتي |
|---|---|
| Streak = an infinite habit chain | Streak = commitment inside a **countdown to a fixed date** |
| Leagues = random 30-person cohorts | Leagues = **people sitting the same exam window as you** |
| Rolling monthly subscription | **"حتى يوم اختبارك"** pass, priced to the deadline |
| LTV over years | LTV over **one exam cycle** — so referrals, siblings and retakes carry the model |
| Smooth DAU | **Violent seasonality** around test windows; capacity and marketing must follow it |
| Success = you come back tomorrow | Success = **you score higher**, and tell your friends why |

The good news: a deadline is a *stronger* motivator than a streak. Duolingo has to manufacture
urgency. We are handed it. The design job is to point every mechanic at the date the student already
has circled — which is why the exam date is the second thing we ask, and why the marked day on that
screen is drawn as the last node on the path.

**The second thing that changes everything:** we have 720 questions. The market leader advertises
100,000. That gap does not close by hand-authoring. It closes with a **content engine** (§4.4).

---

# Part 1 — Research: what Duolingo actually is

## 1.1 The numbers, so we calibrate against reality

- **~47.7M daily active users**, ~128M monthly, **DAU/MAU ≈ 37%** — more than one in three monthly users show up daily
- **10.9M paid subscribers**; **8.9–9.2% MAU→paid conversion**, where 2% is industry average and 4% is considered elite
- Monthly churn fell from 47% (2020) to **28%** in Western markets by late 2025
- **1,200+ experiments per year**; hundreds of A/B tests live at any moment
- Super Duolingo ≈ **$12.99/mo, or ~$5/mo billed annually**; new users get **14 days of Super free up front** — the reverse of the usual freemium funnel

The 37% DAU/MAU is the number to internalise. It is not achieved by content quality. It is achieved
by four interlocking retention mechanics.

## 1.2 The retention machine

**Streak.** Loss aversion, deliberately engineered. The flame is front and centre; the longer the
chain, the more it costs to break. Critically they *moderate* the pressure with Streak Freeze — an
insurance item bought with in-app currency — because a streak that breaks permanently makes people
quit rather than restart. **Seven days is the threshold** at which a streak becomes worth protecting.

**Leagues.** Ten tiers (Bronze → Diamond), **cohorts of 30**, weekly promote/demote. The cold-start
trick is worth stealing outright: cohorts are assembled from users **who earned their first XP of the
week at a similar time**, and at a similar level. That one rule makes every cohort feel competitive
with no matchmaking service at all. Leagues drive a reported **+25% lesson completion**.

**Quests.** Daily and friend quests. Friend Quests are the sharpest idea in the system: they create a
reason to return that belongs to *the relationship*, not to the product. Someone who has stopped
caring about Spanish will still open the app rather than let a friend down.

**Notifications.** Where Duolingo is furthest ahead of everyone. Not "send at 7pm" — send-time is
modelled as a **sleeping recovering bandit with Thompson sampling**, and message copy is chosen by a
**bandit algorithm** over pre-written content sets that learns per user. Timing is a first-class
pipeline component, not a config value. Infrastructure: API Gateway → Python services on ECS → SQS,
reading users and devices from DynamoDB and S3. At the Super Bowl they pushed **4M notifications in
under 6 seconds** (95% within 3.9 s).

## 1.3 The learning engine

**Half-Life Regression (HLR).** Published at ACL 2016 (Settles & Meeder) and open-sourced. Estimates
the half-life of each item in a learner's memory from their recall history and schedules review at
the point of near-forgetting. The most-cited paper in educational AI.

**Birdbrain.** Launched 2020, now v2. After every exercise it updates **two** things at once: the
difficulty of that exercise, and the learner's proficiency at the underlying skill. It is a logistic
regression — P(correct) as a function of (ability − difficulty). Later versions absorbed the
spaced-repetition decay model into the same network.

**Session Generator.** The service that assembles your next lesson from those two models. Originally
Python; the latency of scoring millions of probabilities in real time forced a Scala rewrite, taking
lesson generation **from 750 ms to 14 ms**.

**The lesson worth taking:** the adaptive core is *a logistic model with two parameters per
observation*. It is not magic and it is not deep learning. We can build a defensible version in a
fortnight (§4.5).

## 1.4 The architecture

- **100+ microservices on AWS**, migrated from a monolith to Docker
- Backend mostly **Python**, hot paths in **Scala/JVM**
- **DynamoDB** heavily, plus **RDS** (MySQL and Postgres) where relational shape matters
- Course content is **compiled offline, serialised into files on S3**, then fetched and cached — content is *not* served from a live database
- Elastic Beanstalk for rolling deploys and autoscaling; **Jaeger** for request tracing
- Cut AWS compute cost **>60% in one quarter** by moving to spot capacity

**The lesson worth taking:** *content is a build artefact, not a database table.* Their courses are
compiled and shipped as static files on a CDN. That is exactly what we do today with
`js/data/*.js` — accidentally, but correctly. Formalise it rather than moving content into Postgres
when the backend arrives.

## 1.5 The experimentation culture

Every change — button colour, notification phrasing, notification timing — ships behind an
experiment. Cross-functional teams own a metric and iterate. 1,200 experiments a year is roughly
**one started every six working hours**.

We cannot run 1,200 experiments at 10k users; the statistics do not support it. But we can build the
*plumbing* — assignment, exposure logging, a metric pipeline — from the start, so that when the
traffic arrives we are not retrofitting. Retrofitting experimentation is one of the most expensive
things a product ever does.

## 1.6 What transfers and what does not

| Duolingo mechanic | Verdict for قدراتي |
|---|---|
| Streak + freeze | **Take**, reframed around the exam countdown |
| Hearts | **Take** — already have it. It paces, and it monetises honestly |
| Leagues, 30-person cohorts, weekly reset | **Take**, but cohort by **exam window**, not randomly |
| First-XP-of-week cohort assignment | **Take verbatim.** Solves cold-start matchmaking for free |
| Friend quests | **Take** — Saudi students study in groups; culturally strong here |
| Bandit-optimised notification timing | **Take later** (M7). Rules first; the bandit when data exists |
| Birdbrain-style ability/difficulty model | **Take** (M6). A logistic regression, not a moonshot |
| HLR review scheduling | **Take** (M6), simplified |
| Content compiled to static files on a CDN | **Take** — we already do it; formalise it |
| 14 days of premium free up front | **Test.** Fits a deadline product well: give them Pro during the panic week |
| Infinite streak as the hero metric | **Reject.** Countdown-to-exam is our hero metric |
| Rolling monthly subscription as the default | **Reject.** An exam-dated pass is the right shape |
| 100+ microservices | **Reject.** One Postgres and a handful of functions serves 10k users |

---

# Part 2 — Research: the قدرات student

## 2.1 Who they are

A 16–18-year-old Saudi student in their final years of secondary school. The GAT score is one of the
three numbers deciding which university — and therefore which career — is open to them. The weighted
admission formula at most universities is:

> **النسبة الموزونة = (الثانوية × 0.3) + (القدرات × 0.3) + (التحصيلي × 0.4)**

Two consequences we must design around:

1. **They are minors.** PDPL has specific child-data rules (§2.7). Not a footnote — it shapes onboarding, consent, defaults and retention.
2. **They already know their target.** Most can name the university and major they want. A student shown *"a 78 gets you into King Saud computer science; you are currently tracking 71"* is far more motivated than one shown an XP bar.

## 2.2 The exam, precisely

- **120 questions: 68 verbal (لفظي) + 52 quantitative (كمي)** on the scientific track. The literary track is weighted far more heavily toward verbal.
- **~2 hours**, in **4–5 sections of 25 minutes**, alternating verbal and quantitative. In the computerised form each section opens with quantitative, then verbal.
- **The computerised test is adaptive** — difficulty follows your answers.
- Scoring is **standardised, not raw**: answers convert to a standard score that accounts for the difficulty of the form you sat. The population **mean is ~65**.
- The computerised test runs **year-round**; the paper test has fixed windows (the second 2026 period ran roughly late January to early March, final sitting 21 June 2026).
- Attempts are limited but the best score counts, so **retakes are normal** — a retaking student is a returning customer.

**Verbal question types:** التناظر اللفظي · إكمال الجمل · الخطأ السياقي · المفردة الشاذة · استيعاب المقروء.

## 2.3 How they study today

**تجميعات** dominate. These are past exam questions reconstructed from memory by students leaving the
hall, accumulated over years into enormous shared files. Students treat them as treasure, for
entirely rational reasons:

- Qiyas draws from a slowly-refreshed bank, so patterns — and sometimes near-verbatim items — repeat
- They train the real *flavour*: the phrasing, the traps, the actual difficulty
- After ~200 items the repeating shapes become visible
- They are free

**This is our sharpest strategic problem.** We will not reproduce real exam questions — it breaks our
own rule, it is copyright infringement, and it puts us in ETEC's crosshairs. But "we have no تجميعات"
reads to a student as "this app is not serious".

**The answer is to beat تجميعات at their own job.** What a student actually gets from تجميعات is
*pattern exposure*. Every recurring pattern in the exam can be expressed as a **parameterised
template** that generates unlimited original items with the same shape, the same traps and the same
difficulty — plus two things تجميعات can never give: a worked method, and an answer that is correct
by construction rather than by crowd-guess. The tutors selling تجميعات admit the honest version
themselves: *التجميعات ثبّتت سرعتهم، لكن الفهم هو الذي رفع درجتهم.*

Position it explicitly: **"أنماط الاختبار — أصلية بالكامل، ومولّدة بلا حدود."**

## 2.4 The competition

| Platform | What they claim | Price signal |
|---|---|---|
| منصة اختبارات | **100,000+ questions**, AI study plan, "94% success rate" | from **199 SAR** |
| دال | 10,000+ questions, تجميعات, daily drills, exam simulator | subscription |
| نون أكاديمي | Live and recorded classes with named star teachers | subscription / per-course |
| منصة قدرات (qdrat.sa) | 16 years of courses + تجميعات | course pricing |
| المنصف · بازيد · أينشتاين · يزيد · المعاصر · هدفك · جهاد | Courses, PDFs, Telegram groups | varies |

**Read this honestly.** We have 720 questions — **0.7% of the leader's advertised bank**. On the axis
this market competes on, we are nowhere.

Now look at what none of them have:

- **Nobody has the game loop.** They are question banks, video courses or PDFs behind a login. Not one is a *game* a student opens because they want to.
- **Nobody has our method coverage.** All 720 of our items carry a step-by-step `solution` *and* a structured `method`. The big banks ship answer keys.
- **Nobody is beautiful.** With 17-year-olds this is a real moat.

So the strategy is not "catch up on volume". It is **"the only قدرات app you enjoy opening, with
enough volume that nobody can dismiss it"** — where "enough" is ~10,000 items, reached by engine
rather than by hand.

## 2.5 What they need that nobody gives them

The recurring advice in the tutoring content students actually read: have a phased plan; analyse your
mistakes instead of grinding volume; manage the clock, because most lost marks belong to students who
*knew* the material but ran out of time; and manage exam-day nerves.

Almost none of that is a question-bank feature. It maps to product:

1. **A day-by-day plan from today to your exam date** — التأسيس / التدريب المكثف / المحاكاة / المراجعة
2. **Mistake analysis, not mistake storage** — group errors by *cause*, not by topic
3. **Pace training** — most lost marks are time, not knowledge
4. **A weighted-percentage calculator** tied to their target university and major — the single most motivating screen we could build
5. **A predicted score with a confidence band**, from our ability model, calibrated to the ~65 mean
6. **Exam-week mode** — review only, no new material, sleep reminders, a what-to-bring checklist

## 2.6 Seasonality

The paper test has windows; the computerised test is year-round but clusters before admission.
Expect **3–5× traffic swings**, peaking in the weeks before each window and falling off a cliff after.

- Infrastructure must autoscale to near-zero in troughs — which alone argues against always-on servers
- Marketing spend follows the registration calendar, not a monthly plan
- The post-exam cliff is when we pitch **التحصيلي (SAAT)** — the *other* exam every Saudi student sits, worth 40% of the weighted percentage, and a pure content project on an engine that already exists

## 2.7 Hard constraints

**Devices.** Android holds roughly **three-quarters** of the Saudi market by revenue share; iOS is
the fastest-growing and dominates the premium end. Practical reading: **build Android-first, never let
iOS feel second-class** — the students most likely to pay skew iPhone. And a large share of the
Android base is sub-1,500-SAR hardware, exactly the CPU profile where our 782 KB of render-blocking
question data hurts (§3.1).

**Payments.** **Mada** is the national debit network and the default for essentially everyone.
**Apple Pay** sits at ~36% consumer adoption, **STC Pay** ~12%. A checkout without Mada does not work
here. In-app purchases on iOS/Android must use Apple/Google billing for digital goods — budget the
15–30% cut and price around it.

**PDPL, and the fact that our users are minors.** The Personal Data Protection Law has been fully
enforced since **14 September 2024**, and SDAIA's committees issued **48 enforcement decisions across
2025–2026**. Children's data carries extra obligations: **verified guardian consent, private accounts
by default, data minimisation, short retention, geolocation off by default, age-appropriate notices,
strong deletion, and registration on SDAIA's National Data Governance Platform.**

**Data residency is now solved.** The **AWS Riyadh region (`me-central-2`) reached general
availability in January 2026** with three availability zones, explicitly positioned for PDPL/NCA
localisation requirements. Google Cloud also has a Saudi region. There is no longer any excuse for
putting Saudi student data outside the Kingdom.

---

# Part 3 — Where we actually are

## 3.1 Frontend: assessment, not inventory

| | |
|---|---|
| `js/app.js` | **2,209 lines**, one IIFE, no modules |
| Rendering | **37 `innerHTML` assignments** of template strings |
| Event handling | **49 `A.*` handlers**, bound via inline `onclick="A.foo('...')"` |
| `css/style.css` | **2,598 lines**, one file |
| Routing | a module-scope `let view` and a `render()` switch. No URLs |
| State | one `S` object → `localStorage["qudratState"]`. **~20 KB for a heavy user** |
| Content loading | 4 render-blocking `<script>` tags, **782 KB uncompressed** |
| Tests | none. `tools/validate.js` covers the data only |
| Performance | live, throttled mobile: **317 KB transferred, FCP 2.6 s**. Unthrottled: **1.03 s** |

**What is genuinely good.** The zero-dependency, zero-build choice has been vindicated: JS churn has
cost this project nothing, deploys are a `git push`, and a new contributor is productive in ten
minutes. The design system is thorough. The session engine already does naive adaptive selection —
`pickLessonQuestions` sorts by `r − w` per question, which is a crude ability model already in
production.

**What will break, specifically.**

1. **`innerHTML` + inline handlers cannot survive server data.** Today every string in a template
   comes from our own files, so it is safe. The moment a leaderboard shows another student's name, a
   friend request shows a nickname, or a question report shows user text, `innerHTML` becomes an
   injection surface. And `esc()` is:
   ```js
   function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
   ```
   That escapes `&` and `<` only. It is **not attribute-safe** — no `"`, `'` or `>`. Every current use
   sits in a text context, so there is no live bug. But this function plus `onclick="A.x('${name}')"`
   is a stored-XSS hole waiting for the day names come from a database. **Fix before M4 ships
   accounts, not after.**

2. **`localStorage` will not hold the content plan.** ~5 MB cap, synchronous, string-only. With 2,220
   questions plus reading passages plus cached figures we need **IndexedDB**.

3. **No URLs means no sharing, no deep links, no analytics funnels and no back button.** Three of
   those are growth features.

4. **The 782 KB parse is the FCP problem.** Transfer is fine — Brotli takes it to ~139 KB. The 1.6 s
   gap between throttled and unthrottled FCP is almost entirely CPU. On the cheap Android hardware
   that is most of our market, the student watches a white screen while we parse a question bank they
   will not touch for twenty minutes.

5. **2,209 lines in one scope** is survivable for one person and fatal for two.

## 3.2 Content

| Unit | Lessons | Questions | With method | Figures | Comparison |
|---|---:|---:|---:|---:|---:|
| مهارات وقوانين القدرات | 9 | 216 | 216 | 27 | 81 |
| أساسيات الأعداد | 7 | 168 | 168 | 0 | 56 |
| النسب والنسبة المئوية | 4 | 96 | 96 | 0 | 33 |
| الهندسة | 10 | 240 | 240 | 80 | 75 |
| **Total** | **30** | **720** | **720 (100%)** | **107** | **245** |

Verbal: **zero**. That is 68 of the exam's 120 questions — **we cover 43% of the test.**

A lesson session serves 8 questions from a pool of 24, so a committed student exhausts a lesson in
three sittings and the whole quantitative bank in roughly ten weeks — exactly the length of their prep
window. **The bank is sized for precisely one user, once.**

## 3.3 Backend

None. No accounts, no sync, no analytics, no payments, no notifications, no admin. Progress lives in
one browser and dies with the cache.

## 3.4 The honest score

Scored against *a product 10,000 students rely on and pay for*:

| Layer | Weight | Done | Earned | Notes |
|---|---:|---:|---:|---|
| Quantitative content | 10 | 70% | 7.00 | Excellent quality, ~7% of expected volume |
| **Verbal content** | 12 | **0%** | 0.00 | The larger half of the exam |
| **Content engine** (generation + ops) | 7 | **0%** | 0.00 | The only way volume closes |
| Core game loop | 9 | 90% | 8.10 | Genuinely strong |
| Adaptive engine & score prediction | 6 | 10% | 0.60 | `r − w` sorting is a start |
| Exam-lifecycle product (plan, pace, weighted %) | 8 | 15% | 1.20 | Countdown + readiness exist |
| UI/UX & design system | 6 | 85% | 5.10 | Best-in-category already |
| Mascot & brand identity | 5 | 2% | 0.10 | No character; palette is Duolingo's |
| Frontend architecture (modules, router, IDB, security) | 5 | 25% | 1.25 | Works; will not survive accounts |
| **Backend**: auth, sync, entitlements | 10 | **0%** | 0.00 | |
| Analytics & experimentation | 5 | 0% | 0.00 | |
| Notifications & lifecycle messaging | 3 | 0% | 0.00 | |
| Monetization & payments | 5 | 0% | 0.00 | |
| Legal, PDPL, minors | 4 | 25% | 1.00 | ETEC disclaimer only |
| Distribution: PWA, stores, ASO | 3 | 15% | 0.45 | Sideloaded APK |
| QA, CI, observability | 2 | 15% | 0.30 | Data validator only |
| | **100** | | **25.10** | |

**Weighted total: 25%.**

Lower than the old roadmap's 42% because that document scored a smaller ambition. Against "a free
quantitative trainer" we are ~85% done. Against *this*, **25%**.

Read the zeros, not the total: **five whole layers are at zero** — verbal, content engine, backend,
analytics, monetization. Four of the five are not hard problems; they are simply unstarted.

---

# Part 4 — Target architecture

## 4.1 Principles

1. **Content is a build artefact.** Compiled, versioned, signed, on a CDN — never served from Postgres. What Duolingo does, and what we already accidentally do.
2. **Offline-first.** The student on a school bus with two bars must be able to do a lesson. The server is for sync, social and payments — never for answering a question.
3. **Zero build stays until it costs us.** Native ES modules give modularity with no toolchain. Revisit on a real constraint, not on fashion.
4. **The server never sees more than it needs.** Minors, PDPL. Minimise by default.
5. **One Postgres.** 10k DAU is small. 100 microservices is Duolingo's problem, not ours.

## 4.2 Frontend target

```
index.html
  └─ <script type="module" src="/js/main.js">
js/
  core/     state.js  store.js(IndexedDB)  sync.js  router.js  events.js  api.js
  ui/       render.js(escape + delegation)  components/  screens/
  domain/   session.js  mock.js  streak.js  league.js  ability.js  plan.js
  content/  loader.js (per-unit, lazy, cached, version-checked)
```

**The five changes that matter:**

- **A render layer that escapes by default.** One `html` tagged template that escapes every
  interpolation unless explicitly marked safe, plus **event delegation** instead of inline `onclick`.
  This deletes the XSS class permanently and is a two-day job now, versus a rewrite later.
- **IndexedDB** behind a repository interface. `localStorage` keeps a small session pointer only.
- **A router** with real URLs: `/#/path`, `/#/lesson/geometry.circles`, `/#/mock/3`.
- **Per-unit lazy content loading**, version-checked against a manifest. Kills the 782 KB parse.
- **ES modules** — ~15 files instead of one 2,209-line scope. No bundler.

## 4.3 Backend target

**Stack: Supabase (Postgres + Auth + Storage + Edge Functions), hosted in the AWS Riyadh region.**

Why, concretely: at 10k DAU with a read-heavy workload **Supabase runs ~$50–100/month against
Firebase's ~$500–1,500** — Firebase bills per operation, which compounds badly for an app writing an
event per answered question. Postgres gives **row-level security at the database layer**, real SQL
for the analytics we will live in, and — decisively for PDPL — the option to **self-host inside the
Kingdom** with no rewrite.

### Schema sketch

```sql
-- identity ---------------------------------------------------------------
users(id, phone_hash, auth_provider, created_at, deleted_at)
profiles(user_id PK, display_name, track, exam_date, target_university,
         target_major, birth_year, is_minor, locale, created_at)
consents(user_id, kind, granted_at, revoked_at, guardian_verified_at, policy_version)
devices(id, user_id, platform, push_token, last_seen_at, app_version)

-- progress ---------------------------------------------------------------
lesson_progress(user_id, lesson_key, stars, plays, best_accuracy, updated_at)
attempts(id, user_id, question_id, session_id, correct, ms_taken,
         chosen_index, first_try, created_at)          -- the gold. append-only
sessions(id, user_id, kind, lesson_key, started_at, ended_at, hearts_left, xp, gems)
mocks(id, user_id, form_version, started_at, ended_at, raw_score,
      predicted_scaled, per_section jsonb)
mistakes(user_id, question_id, cause_tag, added_at, cleared_at)

-- economy & habit --------------------------------------------------------
wallets(user_id, gems, updated_at)
streaks(user_id, count, last_day, freezes_owned, longest)
daily_quests(user_id, day, target, progress, claimed_at)

-- social -----------------------------------------------------------------
league_weeks(id, starts_on, ends_on)
league_cohorts(id, week_id, tier, exam_window, seed)    -- cohort by exam window
league_members(cohort_id, user_id, xp, final_rank, promoted)
friendships(a_user_id, b_user_id, status, created_at)
friend_quests(id, a_user_id, b_user_id, target, progress, expires_at)

-- ability & scheduling ---------------------------------------------------
skill_ability(user_id, skill_key, theta, sigma, updated_at)
item_params(question_id, difficulty_b, discrimination_a, n_attempts, updated_at)
review_queue(user_id, question_id, half_life_hours, due_at)

-- commerce ---------------------------------------------------------------
products(id, kind, sku, price_halalas, currency, duration_days, exam_dated)
subscriptions(id, user_id, product_id, status, started_at, expires_at, source)
payments(id, user_id, provider, provider_ref, amount_halalas, status, created_at)
entitlements(user_id, feature, granted_until)

-- content ops ------------------------------------------------------------
content_versions(id, semver, manifest_url, published_at, checksum)
question_reports(id, user_id, question_id, reason, note, status, resolved_at)

-- platform ---------------------------------------------------------------
events(id, user_id, name, props jsonb, session_id, client_ts, server_ts)
experiments(key, description, variants jsonb, started_at, stopped_at)
assignments(user_id, experiment_key, variant, assigned_at)
notifications(id, user_id, template_key, scheduled_for, sent_at, opened_at, variant)
```

**RLS from the first migration.** Every table gets `user_id = auth.uid()` policies before it holds a
single row. Retrofitting row-level security is how student data leaks.

### API surface

Mostly PostgREST straight out of Supabase, plus Edge Functions wherever logic must not be
client-trusted:

| Function | Why it cannot be client-side |
|---|---|
| `POST /session/complete` | XP, gems and streak are league currency — never trust the client |
| `POST /sync` | conflict resolution, monotonic clock, replay protection |
| `GET /league/me` | cohort assignment and standings |
| `POST /ability/update` | ability and difficulty updates feed everyone's item parameters |
| `GET /predict/score` | the scoring model stays server-side |
| `POST /payments/webhook` | entitlement grants |
| `POST /notifications/schedule` | send-time selection |
| `POST /report/question` | moderation queue |

### Sync design

State is **~20 KB for a heavy user** — small enough that we need nothing clever.

- Client keeps an **append-only outbox** of attempts and session results in IndexedDB
- On connectivity, flush the outbox; server replays idempotently by client-generated `attempt_id`
- Server returns an authoritative snapshot of derived state (XP, gems, streak, league, entitlements)
- Derived values are **always server-computed**; the client's copy is a cache it may display but never a source of truth
- Conflicts: attempts are additive and cannot conflict; profile fields are last-write-wins, with a visible prompt only for `exam_date`

### Infrastructure

- **AWS `me-central-2` (Riyadh)**, three AZs, GA since January 2026 — data residency solved
- Static app plus compiled content on a CDN; content immutable and versioned so the service worker can cache aggressively
- Autoscale to near-zero in the seasonal trough
- Error tracking, uptime checks, and a `p95` latency alert on `/session/complete` from day one

## 4.4 The content engine

**The most important thing in this document after Part 0.**

We need ~10,000 items. Hand-authoring at even 20 minutes each is 3,300 hours. That is not a plan.

**Parameterised templates.** A template is a small function plus a constraint set:

```js
{
  id: "pct-increase-decrease",
  skill: "ratios.updown",
  difficulty: 2,
  params: { base: [40, 400, 20], up: [10, 40, 5], down: [10, 40, 5] },
  constraints: p => p.up !== p.down &&
                    Number.isInteger(p.base * (1 + p.up/100) * (1 - p.down/100)),
  stem:   p => `سعر سلعة ${ar(p.base)} ريالاً، ارتفع ${ar(p.up)}٪ ثم انخفض ${ar(p.down)}٪. ما السعر النهائي؟`,
  answer: p => p.base * (1 + p.up/100) * (1 - p.down/100),
  // distractors are the mistakes students actually make, not random numbers
  distractors: p => [
    p.base * (1 + (p.up - p.down)/100),   // netting the percentages
    p.base * (1 + p.up/100),              // forgetting the decrease
    p.base * (1 - p.down/100)             // forgetting the increase
  ],
  method: p => `١) اضرب في (١ + ${ar(p.up)}٪)…`
}
```

One template with those ranges yields **hundreds of items**, each with:

- an answer **correct by construction**, not by review
- distractors that are the **named misconceptions**, which is what makes a question teach
- a method generated alongside it
- guaranteed originality — no copyright exposure, ever

**Target: 120 quantitative templates → 6,000+ items. 60 verbal templates plus curated word banks →
2,500 items.** The 720 hand-written items stay as the quality benchmark the generator is tuned against.

**Verbal needs a hybrid.** التناظر and المفردة الشاذة template well off a curated relation taxonomy
(part↔whole, tool↔user, cause↔effect, degree, genus↔species…) plus vetted word lists. إكمال الجمل and
الخطأ السياقي are partly templatable. **استيعاب المقروء must be hand-written** — budget ~35 passages
and accept that this is the slow part.

**Tooling to build alongside it:**

- `tools/generate.js` — expand templates to a candidate pool with a fixed seed, so output is reproducible
- `tools/validate.js` v2 — unique stems, distractor sanity, exactly one correct answer, difficulty calibration, Arabic-digit enforcement, RTL/bidi hazard checks
- `tools/compile.js` — emit versioned per-unit bundles plus a manifest with checksums
- A **review queue** — every generated item machine-checked, a sample human-reviewed before publication
- **Live calibration** — once telemetry exists, any item whose real first-try accuracy falls outside its predicted band is auto-flagged. With 10k items this is the only way quality survives

## 4.5 The adaptive engine

A tractable Birdbrain, in three layers.

**Layer 1 — Ability & difficulty (Elo/IRT-lite).**
`P(correct) = σ(θ_user,skill − b_item)`. After each attempt update both:
`θ += K·(observed − expected)` and `b -= K'·(observed − expected)`.
This is Birdbrain's core idea in roughly forty lines. Seed `b` from our existing `difficulty` 1–3
field and let telemetry refine it.

**Layer 2 — Review scheduling (HLR-lite).**
Estimate a per-item half-life from the student's recall history; surface an item when predicted
recall drops to ~0.6. Duolingo's HLR paper and reference implementation are both public.

**Layer 3 — Session assembly.**
Given a lesson, pick 8 items: ~60% at the edge of ability (P(correct) ≈ 0.75 — the productive
struggle zone), ~25% due for review, ~15% from the mistake queue. Server-side and cached, so it costs
one query.

**On top: the score predictor.** Map `θ` across skills, weighted by the exam's real topic mix, to a
predicted standard score against the **~65 population mean**. Show it with an honest confidence band
that narrows as attempts accumulate. Then build the screen every student actually wants:

> **"درجتك المتوقعة: ٧١ ± ٤ — تحتاج ٧٨ لتخصصك. أقرب مكسب: النسب المئوية (+٣ متوقعة)."**

Nothing else in this market does that.

## 4.6 Analytics: the event taxonomy

Define it once, before any code emits an event. Names are permanent.

```
app_open, app_background, install, first_open
onboarding_start, onboarding_track_set, onboarding_exam_date_set,
  onboarding_target_set, onboarding_complete, onboarding_abandon(step)
lesson_start(lesson,index), question_shown(qid,difficulty,theta_at_time),
  question_answered(qid,correct,ms,first_try), hint_used(kind),
  heart_lost(index), lesson_complete(stars,accuracy,ms), lesson_abandon(at_question)
mock_start(form), mock_section_complete(i,answered,flagged), mock_complete(score,ms),
  mock_abandon(section,question)
streak_extended(n), streak_broken(n), streak_freeze_used
league_joined(tier,cohort), league_week_end(rank,promoted)
quest_claimed(kind), chest_opened(gems)
paywall_shown(placement,variant), checkout_start(sku), purchase(sku,amount),
  purchase_failed(reason)
notification_sent(template,variant), notification_opened(template)
report_question(qid,reason)
error(kind,message)
```

Every event carries `user_id, session_id, app_version, content_version, experiment_assignments`.
Self-hosted or KSA/EU-hosted (Plausible/Umami/PostHog class) — **not** a US ad-tech SDK, given minors
and PDPL.

## 4.7 Cost at 10k DAU

| Line | Monthly |
|---|---|
| Supabase (Postgres, auth, storage) at 10k DAU | ~$75 |
| CDN / static hosting | ~$20 |
| Push notifications (FCM/APNs) | ~$0 |
| Error + uptime monitoring | ~$25 |
| Analytics (self-hosted) | ~$20 |
| SMS OTP (~2,000/mo) | ~$60 |
| Buffer | ~$50 |
| **Total** | **≈ $250/month** |

At even a 3% conversion on 10,000 students at 99 SAR, revenue is ~30,000 SAR (~$8,000) per exam
cycle. **Infrastructure is not the constraint. Content and distribution are.**

---

# Part 5 — The build plan

Ten milestones, each independently shippable, each ending on a checkable condition.
Effort is **weeks of focused work for one developer with AI assistance**.

---

## M0 — Clear the decks · 1 week · 25% → 28%

Cheap work that unblocks measurement and closes the licence exposure.

| # | Task | Done when |
|---|---|---|
| 0.1 | Branch hygiene: leave `feat/complete-app`, `UI/UX` and `responsive-web-layout` in place as archives; document in the README what each one holds | a reader can tell which branches are live and which are history |
| 0.2 | **Split the licence:** engine MIT, `js/data/**` proprietary | `LICENSE` + `js/data/LICENSE` in place, README states both |
| 0.3 | Fix README + `CLAUDE.md` (720 questions, 30 lessons, 60 s timer, real line counts) | numbers match `validate.js` |
| 0.4 | `robots.txt`, `sitemap.xml`, JSON-LD `EducationalApplication` | all three return 200 |
| 0.5 | GitHub Actions: `validate.js` + a headless smoke test on every push | CI green, required for merge |
| 0.6 | Client error reporting (`window.onerror` → endpoint, ~30 lines) | a thrown test error appears in the dashboard |
| 0.7 | Freeze the analytics event taxonomy (§4.6) — **document only, no code** | reviewed and agreed |

**On 0.2:** 720 original questions under MIT means a competitor may legally ship our bank as their
paid app. This is the cheapest, highest-value hour in the roadmap, and every week of delay locks more
forks into those rights permanently.

---

## M1 — Frontend foundation · 3 weeks · 28% → 33%

Nothing user-visible. Everything after this depends on it.

| # | Task | Detail |
|---|---|---|
| 1.1 | Split `app.js` into ES modules | `<script type="module">`, no bundler, ~15 files per §4.2 |
| 1.2 | **Escaping render layer** | one `html` tagged template escaping every interpolation; explicit `raw()` opt-out |
| 1.3 | **Event delegation** | delete all 49 inline `onclick=`; one document listener on `data-action` |
| 1.4 | Router with real URLs | `/#/path`, `/#/lesson/:key`, `/#/mock`; back button and deep links work |
| 1.5 | IndexedDB store behind a repository interface | one-time non-destructive migration from `localStorage` |
| 1.6 | Per-unit lazy content loading + manifest | first paint no longer waits on the bank |
| 1.7 | PWA: `manifest.webmanifest`, service worker, icon set | installable; a full lesson works offline |
| 1.8 | Screenshot regression harness | the existing CDP scripts promoted to `tools/`, 18 screens, run in CI |

**Done when:** FCP **< 1.5 s** throttled, zero inline handlers remain, a lesson completes with the
network off, and CI fails on a visual regression.

**Why 1.2 and 1.3 are not optional and not later:** `esc()` escapes `&` and `<` only, and every
handler is `onclick="A.x('${...}')"`. Safe *today* because every string is ours. M4 introduces other
people's names into those templates. Fixing it now is two days; fixing it after a breach is a
different kind of week.

---

## M2 — The exam-lifecycle product · 3 weeks · 33% → 41%

The first milestone a student *feels*, and the one nothing else in the market has.
Part 0 turned into screens.

| # | Feature | Detail |
|---|---|---|
| 2.1 | **Onboarding v2** | track → exam date → **target university & major** → 6-question placement → your plan. Every step an event |
| 2.2 | **The plan** | day-by-day to the exam: تأسيس / تدريب مكثف / محاكاة / مراجعة. Recomputes when they fall behind — never shows a red overdue list |
| 2.3 | **النسبة الموزونة calculator** | `(ثانوي × 0.3) + (قدرات × 0.3) + (تحصيلي × 0.4)` with real cut-offs for the top universities. Show the gap to their target |
| 2.4 | **Predicted score + band** | §4.5; honest confidence interval that narrows with data |
| 2.5 | **Pace trainer** | per-question pace vs. the pace needed to finish. Most lost marks are the clock |
| 2.6 | **Mistake analysis by cause** | tag every error: مفهوم / حساب / تسرّع / وقت / قراءة السؤال. Group by cause, not topic. This is what tutors charge for |
| 2.7 | **Streak, reframed** | headline is **الأيام المتبقية للاختبار**; the streak becomes أيام الالتزام beneath it. Freezes cost gems |
| 2.8 | **Exam-week mode** | auto-activates 7 days out: review only, no new material, pace drills, sleep reminders, a what-to-bring checklist |

**Done when:** a new student reaches a personalised plan in under 90 seconds, and the home screen
answers *"am I going to get the score I need?"* above the fold.

---

## M3 — Content engine + verbal I · 6 weeks · 41% → 59%

Runs **in parallel with M4** — different files, different skills.

| # | Task | Output |
|---|---|---|
| 3.1 | Template runtime + `tools/generate.js` | seeded, reproducible expansion |
| 3.2 | `validate.js` v2 | unique stems, distractor sanity, single correct answer, bidi and Arabic-digit checks, difficulty calibration |
| 3.3 | `tools/compile.js` + versioned manifest | per-unit bundles, checksums, immutable URLs |
| 3.4 | **120 quantitative templates** | → **6,000+ items**, distractors from named misconceptions |
| 3.5 | Verbal schema + UI for the four short types | reuses `questionBody()` |
| 3.6 | **المفردة الشاذة — 250 items** | cheapest type; ships first and proves the pipeline |
| 3.7 | **التناظر اللفظي — 400 items** | curated relation taxonomy + vetted word bank |
| 3.8 | **إكمال الجمل — 400 items** | one and two blanks |
| 3.9 | Human review pass | 100% of hand-written, ≥10% sample of generated |

**Done when:** the bank exceeds **7,000 items**, three verbal types are live on the path, and one
person can add a template and publish 200 verified questions in an afternoon.

---

## M4 — Backend, accounts & PDPL · 5 weeks · runs parallel to M3 · → 71%

Ships as one unit. Accounts without compliance is a liability; compliance without accounts is
paperwork for nothing.

| # | Task | Detail |
|---|---|---|
| 4.1 | Supabase project in **AWS `me-central-2` (Riyadh)** | data residency; three AZs |
| 4.2 | Schema + **RLS on every table from the first migration** | §4.3 |
| 4.3 | Auth: phone OTP, Apple, Google | **guest play must survive** — "بدون تسجيل" is our best conversion asset |
| 4.4 | **Minors flow** | birth year at signup; under-18 → guardian consent, private by default, minimal collection, geolocation off, short retention |
| 4.5 | Sync: outbox → idempotent replay → authoritative snapshot | §4.3 |
| 4.6 | Server-authoritative XP, gems, streak | league integrity depends on it |
| 4.7 | Arabic privacy policy + ToS; consent record; DSR path; 72-hour breach procedure; DPO; SDAIA registration | reviewed by Saudi counsel |
| 4.8 | Account deletion that actually deletes | verified against the database |

**Done when:** progress survives a factory reset, a deletion request removes every row inside the
stated window, an under-18 signup cannot proceed without guardian consent, and counsel has signed off.

**This ends "zero server, zero cost."** Budget ~$250/month and an on-call surface. Unavoidable — there
is no retention, no social and no revenue without identity.

---

## M5 — Verbal II + the full-length mock · 4 weeks · 71% → 76%

The two expensive verbal types, and the first time a student can sit a true full simulation.

| # | Task | Detail |
|---|---|---|
| 5.1 | **الخطأ السياقي — 300 items** | needs word-level markup in the schema: four underlined words, one wrong in context |
| 5.2 | **استيعاب المقروء — ~35 passages, 150 questions** | hand-written. The slow, unavoidable part |
| 5.3 | Reading-comprehension screen | split pane, passage scroll memory, "back to the passage", RTL, works at 280 px |
| 5.4 | **Full-length mock: 120 questions, 5 sections, mixed** | replaces today's 2 × 24 quantitative-only mock. Matches the real computerised format |
| 5.5 | Per-section score breakdown + predicted scaled score | feeds M6's predictor |
| 5.6 | Track weighting | أدبي gets the heavier verbal load, matching the real exam |

**Done when:** all five verbal types render correctly in RTL on a 280 px screen, and a student can
complete a 120-question mock end to end and see a per-section breakdown.

---

## M6 — Adaptive engine & analytics · 3 weeks · 76% → 86%

| # | Task |
|---|---|
| 6.1 | Attempt event pipeline → `attempts` table (the asset every later feature reads) |
| 6.2 | Ability/difficulty model (§4.5 layer 1); nightly recalibration of `item_params` |
| 6.3 | Review scheduling (layer 2) |
| 6.4 | Session assembly: 60% edge-of-ability / 25% review / 15% mistakes |
| 6.5 | Score predictor calibrated to the ~65 mean; back-tested against our own mock results |
| 6.6 | Dashboards: D1/D7/D30, funnel, per-lesson drop-off, mock completion |
| 6.7 | **Content-quality feed** — any item outside its predicted accuracy band is auto-flagged |
| 6.8 | Experiment plumbing: assignment, exposure logging, metric readout — **build it, run few** |

**Done when:** lesson selection demonstrably favours weak skills on a seeded account, the predicted
score back-tests within ±5 of actual mock results, and the drop-off curve is on a screen someone looks
at weekly.

---

## M7 — Retention: mascot, social, notifications · 5 weeks · 86% → 94%

| # | Feature | Detail |
|---|---|---|
| 7.1 | **Lead mascot + 4 unit companions** | Rive is already in the repo driving the streak flame — the runtime is paid for. ≤120 KB each, lazy, static SVG fallback for `prefers-reduced-motion` |
| 7.2 | Character beats across the loop | correct, wrong, heart lost, lesson complete, out of hearts, streak, path idle, chest, rank-up, mock intro |
| 7.3 | **Brand divergence** | off Duolingo's exact hex values; own wordmark, app icon and motion language. See R1 |
| 7.4 | **Leagues, real** | 10 tiers, 30-person cohorts, weekly promote/demote. **Cohort by exam window**, seeded by first-XP-of-week — Duolingo's cold-start trick, free |
| 7.5 | Friends + friend quests | Saudi students study in groups; the strongest social mechanic for this audience |
| 7.6 | Push notifications | rules first: streak rescue, plan-behind, exam countdown, weak-topic nudge |
| 7.7 | Anti-cheat | server-authoritative XP, rate limits, irregular-gain detection, quiet leaderboard removal |
| 7.8 | Referral | invite a friend, both get gems. How this category actually grows |

**Done when:** the mascot appears at ≥8 loop points, leagues run a full weekly cycle with real users
and correct promotions, and a lapsed student receives a notification that gets opened.

---

## M8 — Monetization · 3 weeks · 94% → 99%

| # | Task | Detail |
|---|---|---|
| 8.1 | **قدراتي بلس** | unlimited hearts, unlimited mocks, full explanations, personalised weak-area plan, offline pack, no ads |
| 8.2 | **Exam-dated pass as the default SKU** | "حتى يوم اختبارك" — we already ask for the date. Monthly exists but is not the hero |
| 8.3 | Payments | **Mada is mandatory**; Apple Pay (~36% adoption), STC Pay (~12%); Tabby/Tamara for the longer pass |
| 8.4 | Apple/Google in-app billing for store builds | budget the 15–30% and price around it |
| 8.5 | Entitlement sync + restore | cross-device, verified |
| 8.6 | **Pro-first trial, A/B tested** | Duolingo gives 14 days of Super *up front* rather than upselling later — a strong fit for a panic-driven audience. Test it, do not assume it |
| 8.7 | Free tier stays genuinely useful | word of mouth is the growth engine; a wall at lesson 3 kills it |

**Done when:** a real Mada card completes a purchase, entitlements survive a reinstall, and
cancellation and refund paths are tested end to end.

---

## M9 — Distribution & scale · 4 weeks · 99% → 100%

| # | Task |
|---|---|
| 9.1 | **Google Play** listing (Capacitor already wraps the build) — Android is ~75% of the market |
| 9.2 | **App Store** listing — the premium end, and disproportionately the paying end |
| 9.3 | Arabic ASO: قدرات · قياس · كمي · لفظي · تحصيلي · تجميعات; screenshots featuring the mascot |
| 9.4 | Self-host the font; drop the Google Fonts round-trip |
| 9.5 | Accessibility: fix sub-44px tap targets, Arabic screen-reader pass, contrast audit in both themes |
| 9.6 | Load test at 5× peak; verify autoscale-to-zero in the trough |
| 9.7 | Status page, on-call runbook, backup/restore drill |
| 9.8 | Post-exam retention: **التحصيلي (SAAT)** teaser — the other exam, 40% of the weighted percentage, a pure content project on an engine that already exists |

**Done when:** both stores are live, a 5× load test passes, and a restore drill completes from cold
backup.

---

## Timeline

```
week   1    4    7   10   13   16   19   22   25   28
       |    |    |    |    |    |    |    |    |    |
M0  ██                                                        clear the decks
M1   ██████                                                   frontend foundation
M2        ██████                                              exam-lifecycle product
M3              ████████████                                  content engine + verbal I
M4              ██████████                                    backend + PDPL      ∥ M3
M5                          ████████                          verbal II + full mock
M6                          ██████                            adaptive + analytics  ∥ M5
M7                                  ██████████                retention + mascot
M8                                            ██████          monetization
M9                                                  ████████  distribution & scale
```

**Critical path ≈ 29 weeks** (about seven months) with M3 ∥ M4 and M5 ∥ M6. Single developer, AI-assisted.

**Where a second person doubles output:** M3 is content, M4 is backend — different skills entirely.
If there is ever budget for one hire, it is a **content author for verbal**, not an engineer. The
engine work is what AI assistance accelerates most; Arabic verbal item-writing is what it accelerates
least.

**Time the launch to the exam calendar.** Shipping M8 two weeks after a registration window closes
wastes the year's best conversion moment. Work backwards from the next window.

---

# Part 6 — Metrics

**North star: predicted-score improvement per student per week.** Not DAU. If we are not moving the
number that decides their university, the streak is decoration.

| Metric | Today | M6 target | M9 target | Duolingo, for scale |
|---|---|---|---|---|
| D1 retention | unknown | 35% | 45% | — |
| D7 retention | unknown | 18% | 28% | — |
| D30 retention | unknown | 8% | 15% | — |
| DAU/MAU | unknown | 20% | 30% | **37%** |
| Median session | unknown | 6 min | 9 min | — |
| Lesson completion | unknown | 70% | 80% | — |
| Mock completion | unknown | 45% | 60% | — |
| Free → paid | n/a | — | **4–6%** | 8.9% (2% avg, 4% elite) |
| Predicted-score gain, 4 weeks | unknown | +5 | +8 | — |
| Exam coverage | **43%** | 100% | 100% | — |
| Bank size | **720** | 7,000 | **10,000+** | competitor claims 100,000 |
| FCP, throttled | 2.6 s | 1.5 s | **< 1.2 s** | — |

Ten of twelve are "unknown" today. That is the argument for M6, and why the event taxonomy is frozen
in M0 before any code emits an event.

---

# Part 7 — Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **Trade dress.** `CLAUDE.md` documents the design system as a *"pixel-perfect implementation of the Duolingo design system (colors/radii extracted from Figma)"*. Duolingo is a $15B public company and protects its brand | **Critical** | M7.3 divergence, before any paid marketing, press or store feature. The mascot is the vehicle — do not ship a green owl |
| R2 | **MIT-licensed question bank.** Our most valuable asset is currently free for anyone to sell | **Critical** | M0.2, this week. Relicensing never claws back existing copies |
| R3 | **Volume gap.** 720 vs a competitor's advertised 100,000 | **High** | M3 content engine — the entire reason it exists |
| R4 | **Verbal authoring stalls.** ~1,050 judgement-heavy Arabic items plus 35 passages | **High** | Ship type by type; each is independently releasable. Do not wait for all five |
| R5 | **PDPL, and our users are minors.** 48 SDAIA enforcement decisions in 2025–26 | **High** | M4 ships compliance with accounts. Riyadh region. Counsel review before launch |
| R6 | **تجميعات expectation.** Students may read "no تجميعات" as "not serious" | **Medium** | Position the generated pattern bank as the honest, unlimited version — and say so in the marketing copy |
| R7 | **ETEC objection** to a third-party trainer | **Medium** | Disclaimer stays prominent; every item provably original; never claim affiliation |
| R8 | **Seasonality** — 3–5× swings, revenue concentrated in weeks | **Medium** | Autoscale to near-zero; exam-dated pricing; التحصيلي as the counter-cyclical product |
| R9 | **Single-developer bus factor** | **Medium** | Docs current from M0; no build step keeps onboarding near-zero; CI from M0 |
| R10 | **XSS once server data lands** | **Medium** | M1.2 / M1.3, *before* M4. Non-negotiable ordering |
| R11 | **Store rejection** in the education/exam category | Low | Disclaimer in the listing, original content, no ETEC claim |
| R12 | **Generated items feel mechanical** | Low | Vary surface forms per template; keep the 720 hand-written items as the calibration benchmark; human-review a sample |

---

# Part 8 — Decisions needed from you

None of these block M0 or M1. All of them block something later.

1. **The licence.** Engine MIT + content proprietary is the standard split. **Decide this week** (R2).
2. **Mascot: species, name, personality.** Locking it early unblocks all of M7. My recommendation is a falcon — Saudi, a bird like Duo without *being* Duo, and built for expression.
3. **Pricing.** What does the exam-dated pass cost? منصة اختبارات anchors from 199 SAR. I would test **99 SAR "حتى يوم اختبارك"** against **19 SAR/month**.
4. **Free tier boundary.** Today's pitch is "مجاني بالكامل · بدون تسجيل". M8 changes that promise — decide before we advertise it harder.
5. **التحصيلي: same app or a second app?** One app covering both is the stronger product and doubles LTV per student. Recommendation: same app, second track.
6. **Does the APK stay in the repo** after Play Store launch? Recommendation: no — sideloading is a trust and security problem.
7. **Budget for one content author.** M3 is the critical path and the least AI-accelerable work in the plan.

---

## Appendix A — Reproducing every number here

```bash
node tools/validate.js                             # content inventory
node tools/audit.js                                # live perf + a11y, throttled mobile
node tools/audit.js https://qudrati.xyz/ --fast    # same, unthrottled

curl -so /dev/null -w "robots %{http_code}\n"   https://qudrati.xyz/robots.txt
curl -so /dev/null -w "sitemap %{http_code}\n"  https://qudrati.xyz/sitemap.xml
curl -so /dev/null -w "manifest %{http_code}\n" https://qudrati.xyz/manifest.webmanifest
```

## Appendix B — Milestone summary

| M | Name | Weeks | Δ | → | Blocks |
|---|---|---:|---:|---:|---|
| 0 | Clear the decks | 1 | +3 | 28% | measurement, licence exposure |
| 1 | Frontend foundation | 3 | +5 | 33% | everything; XSS before accounts |
| 2 | Exam-lifecycle product | 3 | +8 | 41% | the differentiator |
| 3 | Content engine + verbal I | 6 | +18 | 59% | credibility, exam coverage |
| 4 | Backend, accounts, PDPL | 5 ∥ | +12 | 71% | social, analytics, payments |
| 5 | Verbal II + full mock | 4 | +5 | 76% | 100% exam coverage |
| 6 | Adaptive + analytics | 3 ∥ | +10 | 86% | every product decision after it |
| 7 | Retention, mascot, social | 5 | +8 | 94% | DAU/MAU, brand safety |
| 8 | Monetization | 3 | +5 | 99% | revenue |
| 9 | Distribution & scale | 4 | +1 | 100% | reach |

`∥` = runs parallel to the milestone above it. **M9 moves the percentage least and matters most for
reach** — the score measures product completeness, not distribution.

## Appendix C — Sources

**Duolingo — product & business**
- [Deconstructor of Fun — how the $15B app uses gaming principles to supercharge DAU growth](https://www.deconstructoroffun.com/blog/2025/4/14/duolingo-how-the-15b-app-uses-gaming-principles-to-supercharge-dau-growth)
- [Trophy — Duolingo gamification strategy: a full case study](https://trophy.so/blog/duolingo-gamification-case-study)
- [Deconstructor of Fun — Leagues: how weekly leaderboards drive +25% lesson completion](https://duolingo.deconstructoroffun.com/mechanics/leagues)
- [duoplanet — Duolingo leagues & leaderboards, everything you need to know](https://duoplanet.com/duolingo-leagues-the-essential-guide-everything-you-need-to-know/)
- [Relaunch — Duolingo onboarding teardown: the A/B tests behind a 9% conversion rate](https://relaunch.ai/blog/duolingo-onboarding-teardown-7-b-tests-behind-their-9-conver.html)
- [First Round Review — the tenets of A/B testing from Duolingo's growth lead](https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/)
- [Quartr — keeping the streak alive: the story of Duolingo](https://quartr.com/insights/edge/keeping-the-streak-alive-the-story-of-duolingo)
- [Duolingo blog — the new home screen design (the 2022 path)](https://blog.duolingo.com/new-duolingo-home-screen-design)

**Duolingo — engineering**
- [Duolingo blog — rewriting Duolingo's engine in Scala (750 ms → 14 ms)](https://blog.duolingo.com/rewriting-duolingos-engine-in-scala/)
- [Settles & Meeder, ACL 2016 — a trainable spaced repetition model for language learning (HLR)](https://research.duolingo.com/papers/settles.acl16.pdf)
- [duolingo/halflife-regression on GitHub](https://github.com/duolingo/halflife-regression)
- [TechAhead — how Duolingo uses ML pipelines to personalise for 50M+ DAU](https://www.techaheadcorp.com/blog/how-duolingo-personalizes-learning/)
- [InfoQ — how we created a high-scale notification system at Duolingo](https://www.infoq.com/presentations/duolingo-high-scale-notification/)
- [InfoQ — QCon London: 4 million push notifications in 6 seconds](https://www.infoq.com/news/2024/04/qcon-london-duolingo-super-bowl/)
- [LikeMinds — the bandit algorithm behind Duolingo's notifications](https://www.likeminds.community/blog/bandit-algorithm-of-duolingos-notifications)
- [AWS — Duolingo reduces compute costs by over 60% in one quarter](https://d1.awsstatic.com/case-studies/partner-case-studies/Duolingo%20PDF.pdf)
- [Duolingo blog — improving the experience with request tracing](https://blog.duolingo.com/improving-the-duolingo-experience-with-request-tracing/)
- [Rive — Duolingo's AI video call brings Lily to life](https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life)

**The exam and the student**
- [ETEC — GAT General Aptitude Test (official)](https://beta.etec.gov.sa:2443/ar/MediaAssets/GAT%20General%20Aptitude%20Test.pdf?csf=1&e=am0axw)
- [Leverage Edu — GAT structure: 120 questions, 68 verbal / 52 quantitative](https://leverageedu.com/learn/what-is-gat/)
- [Keystone Tutors — General Aptitude Test guide (2 hours, 25-minute sections)](https://www.keystonetutors.com/news/general-aptitude-test-guide)
- [Qiyas (@EtecQiyas) — verbal question types](https://x.com/EtecQiyas/status/268664595030355968)
- [مبهر — القسم اللفظي: خمسة أنواع من الأسئلة](https://blog.mubhir.sa/%D8%A7%D8%AE%D8%AA%D8%A8%D8%A7%D8%B1-%D9%82%D9%8A%D8%A7%D8%B3-%D9%84%D9%81%D8%B8%D9%8A/)
- [تفوق — درجات القدرات: كيف يتم حسابها؟](https://tafawaq.sa/blog/%D8%AF%D8%B1%D8%AC%D8%A7%D8%AA-%D8%A7%D9%84%D9%82%D8%AF%D8%B1%D8%A7%D8%AA-%D9%83%D9%8A%D9%81-%D9%8A%D8%AA%D9%85-%D8%AD%D8%B3%D8%A7%D8%A8%D9%87%D8%A7%D8%9F/)
- [روت — حساب النسبة الموزونة والمركبة](https://routesa.app/%D8%AD%D8%B3%D8%A7%D8%A8-%D9%86%D8%B3%D8%A8%D8%A9-%D8%A7%D9%84%D9%82%D8%AF%D8%B1%D8%A7%D8%AA/)
- [مجرة أبدع — ما هي تجميعات القدرات؟ ولماذا يعتبرها الطلاب كنزاً](https://abdihqt.com/blog/what-are-tajmeeat)
- [مجرة أبدع — تجميعات القدرات المحوسب 2026](https://abdihqt.com/blog/tajmeeat-qudrat-mohawsab-2026)
- [مرتبة الشرف — أخطاء شائعة في اختبار القدرات](https://honorrank.sa/blogs/common-mistakes-in-qudrat-exam)
- [العراب — خطة مذاكرة القدرات في 30 يوم](https://el3rab.com/%D8%AE%D8%B7%D8%A9-%D9%85%D8%B0%D8%A7%D9%83%D8%B1%D8%A9-%D8%A7%D9%84%D9%82%D8%AF%D8%B1%D8%A7%D8%AA-%D9%81%D9%8A-30-%D9%8A%D9%88%D9%85-%D9%84%D8%AA%D8%AD%D9%82%D9%8A%D9%82-%D8%A3%D8%B9%D9%84%D9%89/)

**The market**
- [منصة اختبارات — 100,000+ questions, from 199 SAR](https://ekhtibarat.com/)
- [دال — 10,000+ قدرات questions](https://dalqdrat.com/)
- [نون أكاديمي](https://www.noonacademy.com/ar-sa)
- [منصة قدرات (qdrat.sa)](https://qdrat.sa/ar)
- [بازيد — أفضل 8 منصات دورات قدرات سعودية](https://bazaidacademy.net/en/8-%D9%85%D9%86%D8%B5%D8%A7%D8%AA-%D9%82%D8%AF%D8%B1%D8%A7%D8%AA/)

**Platform, payments, compliance**
- [AWS — infrastructure region in the Kingdom of Saudi Arabia](https://press.aboutamazon.com/2024/3/aws-to-launch-an-infrastructure-region-in-the-kingdom-of-saudi-arabia)
- [Vision2030.ai — Saudi cloud regions: AWS, Azure, Google, Oracle](https://vision2030.ai/sectors/technology/saudi-arabia-cloud-regions/)
- [PwC Middle East — KSA Personal Data Protection Law](https://www.pwc.com/m1/en/services/consulting/technology/cyber-security/navigating-data-privacy-regulations/ksa-data-protection-law.html)
- [Lexis Middle East — personal data processing rules for children and incapacitated individuals](https://www.lexismiddleeast.com/pn/SaudiArabia/Personal_Data_Processing_Rules_for_Children_and_Incapacitated_Individuals/en)
- [SGC — SDAIA and the Saudi PDPL: what organisations must know in 2026](https://www.sgc.consulting/sdaia-saudi-personal-data-protection-law-pdpl-compliance-guide/)
- [Giraffy — STC Pay vs Apple Pay vs Mada Pay in Saudi Arabia](https://giraffy.com/ksa/en/learn/banking-money/digital-wallets/stc-pay-vs-apple-pay-vs-mada-pay)
- [Statcounter — mobile OS market share, Saudi Arabia](https://gs.statcounter.com/os-market-share/mobile/saudi-arabia)
- [Tech Insider — Supabase vs Firebase 2026: the 3× cost gap, tested](https://tech-insider.org/supabase-vs-firebase-2026-2/)
- [UpCloud — Supabase vs Firebase: which backend makes the most sense in 2026](https://upcloud.com/global/blog/supabase-vs-firebase-which-backend-makes-the-most-sense-in-2026/)
