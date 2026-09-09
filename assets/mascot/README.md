# قدّور — the mascot files

Two states ship. The character sheets in `sheets/` carry fourteen poses;
`python tools/slice_mascot.py` cuts them all, reports them with `--check`, and writes only
the ones in its `SHIP` set. Do not hand-edit the state files.

| File | Where | How it moves |
|---|---|---|
| `qaddour-celebrate.png` | the win screen, in place of the streak flame (`winHero()` in app.js) | drops in and lands hard, then hop, hop, sway, again — anticipation, stretch, hang, squash, settle, over a live shadow (`winHeroPlay()` in app.js, GSAP). Nothing behind him, no confetti, no particles: Duolingo's grammar only. The painted floor shadow is cut off this PNG by the slicer (`LIVE_SHADOW`) so the live one can move |
| `qaddour-strong.png` | the mock exam home card (`renderMockHome()`) | rises into the card and plants the stick, then breathes (`.mh-*`) |

**Nothing else.** On 2026-09-09 the user cut every other placement — the path, the hello
screen, the teaching cards, the quit dialog, the review, the countdown card, the league,
the chest, the rank-up, the streak, the modals and the value screen. Do not put him back.

`mascot.json` is the slicer's manifest for the shipped states.

## Sheets

| Sheet | Cells (row by row) | Prompts |
|---|---|---|
| `sheet-1.png` | encourage, cheer / point, concerned | `Mascotprompt.md` (historical) |
| `sheet-2.png` | stand, wave, **celebrate** / proud, **strong** | `5 prompts.md` |
| `sheet-3.png` | teach, wait, read / sleep, crown | `5 prompts 2.md` |

To attach as the reference for a new sheet: `MASCOTS.PNG` in the repo root (sheet 1, the
«قدرات» book). Never the old `reference/qaddour-reference.jpg`, whose book reads EGYPT.

## Format

- Cut from a flat cream sheet (`#F5E9DA` or close; never dark — the slicer flood-fills
  from the border and his hair, shoes and stick are near-black).
- 512×512 canvas, feet on a shared baseline, one character scale per sheet set by a
  standing anchor pose (`ANCHOR` in the slicer).
- ≤45 KB each, committed pre-optimised. No build step exists.
- He is never mirrored in CSS.
