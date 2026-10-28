# What is still open

Decisions that wait on you, and work put off until later. Newest first.

## Waiting on you

- **The home screen's top** (`tools/home-top.html`, 2026-10-28, round 4): فهيم alone, one row in place of the exam card and the review card — ١ he peeks and talks, ٢ a toy with seven moves to collect, ٣ an endless mental-maths challenge. Pick one; any of them puts فهيم on the path for the first time.
- **Two sounds that are neither Brilliant nor Duolingo:**
  - the chest's hop while it waits for a tap;
  - the rising ticks on the goal screen's tiles.

  Each one needs a Brilliant pick. (The stat cards' copy now plays Duolingo's own stat sounds.)
- **The sign-up screen as a big illustrated hero** (your picture of the cartoon students). It needs our own artwork of فهيم with students.

- **«كيف أحلّها؟» — a new help experience.** The help button was removed from every question on 2026-10-27 («we will do another UX later»). The sheet behind it (`A.showMethod`: the four steps, the tip, and «دفتر القوانين» for the lesson) is still in the code, ready to be reached a new way. While the button is gone, a lesson's rules book can only be opened from the unit banner («القوانين»).
- **The student experiment (round 2).** Finished. The full report is in `research/rule-study-2.md`, and the winning lesson is playable at `tools/rulestudy/mint.html`. In short:
  - «mint» beat «gold» 3–1 and «sun» 4–0, and had the clearest score so far.
  - It is long (about 16 screens).
  - The recommendation: split it across node 1's short lessons and cut its last round.
  - Two calls are yours: whether to build that, and whether mint's opener «٩ + ٩ + ٩ + ٩ + ٩ + ٩» replaces «٧ + ٧ + ٧».
  - You said this comes after the sounds.
- **Rule lab** (`tools/law.html`): seven versions now, A to G (F «علّم خويك», a friend in a chat; G «وازن الميزان», a balance). None has been picked.
- **Rule lab 2** (`tools/law2.html`): five ways to learn a rule fast and keep it for 90 days (research in `research/rule-memory.md`). None has been picked.
- **Rule lab 3** (`tools/law3.html`, 2026-10-28): one new rule, «حيلة النص» (٤٧ × ٥٣ = ٥٠² − ٣²).
  - **What it is:** a first meeting of about 90 seconds; a finite stack of four "reel" cards on scheduled days, each answered before the trick snaps in; FSRS-6 with an early ladder; and a recall chart.
  - **The test:** the user is the one tester, with real days, and sends results back as a «نسخ النتائج» code. `?sim` is a separate time-machine copy for previewing.
  - **The research:** four tracks and a synthesis in `research/law3/`.
  - **Still open:** nothing goes into the app until the user has lived with it.
  - **Separate decision:** T2 recommends putting back a findable note that the league rivals are simulated.
- **Rule lab 4** (`tools/law4.html`, 2026-10-28). The user found law3 «تووو long, any student will leave», so law4 is the same engine cut to the reel.
  - **First meeting:** 4 reels, about 30 seconds and 5 taps. Reel 1 is the hook plus the trick on the price plus the rule as its caption. Then three tap-only uses, and one end screen.
  - **Reviews:** 3 cards.
  - **The rule:** a new one so it tests clean, «الطلعة والنزلة»: up a% then down a% loses a × a ÷ 100 percent.
- **The reel lab** (`tools/reel-lab.html`, 2026-10-28): law4's first reel seven ways (the combination from `tools/reel-pick.html`, then the guess-and-shock cut, the morphing numbers, the growing square, the finger as playhead, the pen, the coin stacks), each in its own phone with «عجبتني / عادي / لا». None has been picked.
- **The rule card** (`tools/rule-card.html`, 2026-10-28; the user: «change the UI, coloring and animation … 7 versions … don't change the idea»): the see card's rule seven ways — purple slab, highlighter under a gold band, coloured tiles with gold coins, Duolingo night, a tilted sticker, coloured underlines, an orange strip — on four real rules at a 390px phone, each with the app's bulb, «القاعدة», ↻, word-by-word entrance, terms lit in turn on `assessment-click-option-1` and the settle on `hint`. Nothing changes in the app until one is picked.
- **The replay button** (`tools/replay.html`): five designs for «say the rule again». None has been picked.
- **The two write-the-rule screens** («كمّل القاعدة» / «كمّل الخطوة») run only in node 1's first seven lessons (`RF_LESSONS`), and are switched off on the teaching cards (`RF_TEACH`). Do they go everywhere?
- **The win screen's sparkles.** Duolingo's lesson-complete file brings its own sparkles and yellow squares. They are kept as an exception to «no particles». Keep them or remove them?

## Still to do

- **Ship the 2026-10-28 audit fixes** (`tools/fixes.html`): they are not committed, and `sw.js` VERSION is still 89. Bump it (and every `?v=` in index.html, the data files' included) when they ship, or installed students keep the old shell.
- **Rebuild `Qudrati.apk`.** It still carries the June app and curriculum. The Capacitor project is not in this repo; add `@capacitor/app`'s back button when rebuilding (the web back-button handling already works inside the web view).
- **Dev preview hashes that no longer open their screen:** `#teach`, `#teachrule`, `#teachcheck`, `#fail`, `#warm` (the audit, 2026-10-28; students are not affected).

- **The ÷ sign reads as + in the bold font.** The students in the experiment misread «÷ ٢» as «+ ٢». Every bold ÷ in the app needs checking.
- **Google sign-in** needs an OAuth Web client ID in `GOOGLE_CLIENT_ID`, with `https://qudrati.xyz` as an authorised origin. Until then the button says «قريباً».
- **Account deletion and the App Store.**
  - «حذف الحساب» deletes everything on the phone.
  - If a server or real accounts are added later, deletion must remove the server copy too.
  - The store listing then needs a deletion link.
- **Licences for the sound and animation files.** The app now ships Brilliant's sound effects and Duolingo's sounds and animation files. Check that you have the right to use them before a store release.
- **Release.** `sw.js` is at 89 and not deployed yet.
