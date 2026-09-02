# قدّور — mascot art drop-in spec

One flat image per emotional state. Drop the finished files here using the exact
filenames below; the CSS motion layer at the end of `css/style.css` is already in place.

## Filenames (Tier 1 — required before any placement is wired)

    qaddour-wave.png        warm hello              login / welcome hero
    qaddour-point.png       explaining, hero pose   generic modal, exam setup, disclaimer
    qaddour-cheer.png       delighted               correct answer, lesson complete
    qaddour-encourage.png   gentle reassurance      wrong answer  ← most-used state
    qaddour-proud.png       quiet approval          three stars, "no mistakes left"
    qaddour-concerned.png   worried FOR the student fail screen, streak at risk
    qaddour-think.png       considering             loading
    qaddour-teach.png       step-by-step            method sheet
    qaddour-timeup.png      time has run out        time-up feedback
    qaddour-celebrate.png   biggest moment          rank-up ceremony

## Filenames (Tier 2)

    qaddour-sleep.png  qaddour-stop.png  qaddour-calm.png
    qaddour-strong.png qaddour-crown.png qaddour-oops.png

## Derived

    qaddour-head.png    tight bust crop of qaddour-point.png — crop it, do not
                        generate it. Used at 28px in toasts and 44px as the avatar.

## Format

- PNG, transparent background, ~512px tall (2x the largest on-screen use).
- Cropped to content with even margins on all four sides.
- **≤45 KB each.** That is the existing tolerance benchmark in this repo —
  `assets/icons/ranks/rank-*.png` ship at 42–45 KB.
- No build step exists in this project, so files must be committed pre-optimized.

## Before committing a state

1. Flatten to black at 96px — it must still read as this character.
2. Hair volume, glasses shape, the silver streak in the beard, vest colour and
   the book must match the reference exactly. Drift means the anchor didn't hold.
3. The book must read `EGYPT` + `عربي`, spelled correctly, not mirrored, not
   duplicated. Arabic text is the most common image-model failure — check every time.
4. Background transparent, or a single flat `#F5E9DA` with no gradient.
5. Show it to someone with no context and ask what he is feeling. `encourage` must
   not read as angry; `concerned` must not read as disappointed in you.
6. No two states may look near-identical.
