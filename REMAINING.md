# What is still open

Decisions that wait on you, and work put off until later. Newest first.

## Waiting on you

- **Three sounds that are neither Brilliant nor Duolingo:**
  - the chest's hop while it waits for a tap;
  - the rising ticks on the goal screen's tiles;
  - the stat cards' thump when Duolingo's file is not ready.

  Each one needs a Brilliant pick.
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
- **The replay button** (`tools/replay.html`): five designs for «say the rule again». None has been picked.
- **The two write-the-rule screens** («كمّل القاعدة» / «كمّل الخطوة») run only in node 1's first seven lessons (`RF_LESSONS`), and are switched off on the teaching cards (`RF_TEACH`). Do they go everywhere?
- **The win screen's sparkles.** Duolingo's lesson-complete file brings its own sparkles and yellow squares. They are kept as an exception to «no particles». Keep them or remove them?
- **«ابدأ» over a new node.** «كمّل» was removed. Should «ابدأ» go too?

## Still to do

- **The ÷ sign reads as + in the bold font.** The students in the experiment misread «÷ ٢» as «+ ٢». Every bold ÷ in the app needs checking.
- **Google sign-in** needs an OAuth Web client ID in `GOOGLE_CLIENT_ID`, with `https://qudrati.xyz` as an authorised origin. Until then the button says «قريباً».
- **Account deletion and the App Store.**
  - «حذف الحساب» deletes everything on the phone.
  - If a server or real accounts are added later, deletion must remove the server copy too.
  - The store listing then needs a deletion link.
- **Licences for the sound and animation files.** The app now ships Brilliant's sound effects and Duolingo's sounds and animation files. Check that you have the right to use them before a store release.
- **Release.** `sw.js` is at 89 and not deployed yet.
