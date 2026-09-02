# Integration brief — answer-feedback animation

You are adding this animation to an **existing application**. You are not
building a new screen and you are not starting from scratch.

Attached: `quiz-two-bolts.html` — a standalone reference. Open it, watch it,
use it to check your work. **Do not copy it into the project.** It is a
demo harness: its colours, fonts, copy, layout and fake phone chrome are
throwaway. The only thing of value in it is the motion.

Every number in this document was measured frame-by-frame off 60fps screen
recordings. **Treat them as data, not as style choices.** Do not round them,
do not retune the easing to taste. If a value looks wrong to you, ask.

---

## Step 0 — survey before you touch anything

Do this first and report back before writing code:

1. What framework and version? React / Vue / Svelte / vanilla?
2. Where is the question-answer screen, and where is the "check answer"
   handler that decides correct vs incorrect? **You are hooking into that
   existing logic, not replacing it.**
3. How are answer options currently rendered — what element, what CSS?
4. Is there an existing animation library? If the project already uses Framer
   Motion or Motion One, say so and stop. The numbers port fine, the API
   doesn't, and I don't want two animation libraries in one bundle.
5. Are there design tokens / a theme file? The animation must use the app's
   existing success and error colours, not the ones in the reference.
6. Is there an existing correct/incorrect feedback UI (banner, toast, modal)?
   If so, we drive that — we don't add a second one.

Tell me what you found and how you plan to wire it in. Then wait.

---

## What you are taking, and what you are leaving

**Take:** the jump keyframes, the strike timings, the miss routine, the
structural requirements in section 3, and the trap list in section 7.

**Leave behind:** all colours, all fonts, all Arabic copy, the phone frame,
the progress bar styling, the demo's autoplay loop and its dev toolbar.

The animation must inherit the host app's look. If the app's "correct" green
is different from the reference's, use the app's.

---

## 1. Dependency

`npm i gsap` — **core only, v3.12.5+**. No plugins, nothing from Club GSAP.

For the wavy banner crest, do **not** reach for MorphSVGPlugin (paid). The
reference tweens a plain object of five control-point heights and rebuilds the
SVG path `d` string in `onUpdate`. Keep that technique.

---

## 2. The jump — correct answer

```js
const AMP = 1.6;                                  // 1.0 = raw measurement
const P = v => +(v * AMP).toFixed(2);             // px displacement
const A = v => +(1 + (v - 1) * AMP).toFixed(4);   // scale, deviation from 1

gsap.to(card, { keyframes: [
  { y:P(-15), scaleX:A(.947), scaleY:A(1.056), duration:.033, ease:'power2.out'    },
  { y:P(-24), scaleX:1,       scaleY:1,        duration:.067, ease:'power2.out'    },
  { y:P(-24),                                  duration:.067                       },
  { y:P(-6),  scaleX:A(.980), scaleY:A(1.070), duration:.133, ease:'power2.in'     },
  { y:P( 1),  scaleX:A(1.024),scaleY:A(.926),  duration:.033, ease:'power2.in'     },
  { y:P(-7),  scaleX:1,       scaleY:1,        duration:.100, ease:'back.out(2.6)' }
]});
```

launch → apex → hold → fall → impact → settle. Total 433ms.

**Three things you must not change:**

1. **`transform-origin: 50% 100%` on the card.** The single most important
   line. With the default centre origin the impact squash lands ~8px wrong
   and the whole thing reads as floaty.
2. **The rise/fall asymmetry** — rise 100ms, fall 166ms. Do not "tidy" these
   into matching values. The weight comes from the asymmetry.
3. **Don't round the scales.** `.947` is measured; `0.95` is a different
   animation.

Expose `AMP` as a config constant. Don't bake it into the keyframes.

Same card, same time:
- **Shine** — a `skewX(-25deg)` gradient band, 23% of card width, `left`
  animating `-32%` → `112%` across the 300ms airtime, `ease:'none'`.
- **Sparks** — 3 four-point stars (CSS `clip-path`), keyframe pop,
  `stagger: .045`.

---

## 3. Structural requirements on the host markup

The animation will not work correctly unless the app's answer option satisfies
these. Adapt the app's existing components — don't wrap them in extra divs
unless you have to.

1. **Each option needs a base layer.** The card must sit absolutely positioned
   over a same-size rounded element in the app's neutral border colour. The
   jump reveals that base underneath — that is the entire illusion. Without
   it the card just slides around on the page background.

2. **The card settles at `y = -7 * AMP`, not 0.** It stays lifted off its base
   after landing. Don't reset it.

3. **The card needs `overflow: hidden`** so the shine sweep clips to its
   rounded corners, and `will-change: transform`.

4. **The bolts need a full-screen overlay** — an SVG with
   `viewBox="0 0 884 1920"` and `preserveAspectRatio="xMidYMid slice"`,
   `position:absolute; inset:0; pointer-events:none`, above the content.
   Check it doesn't land above any existing modal/nav layer in the app's
   z-index scale — fit it into that scale rather than using `z-index: 9999`.

---

## 4. The strike

Fires on the **same frame** as the jump. Two variants, both measured. These are
**not one effect recoloured** — every value differs. Ship both behind a prop
so the app can choose per-context.

| | Blue | Gold |
|---|---|---|
| Bolt colour | `#9efefd` | `#fae36a` |
| Stroke width | 62 | 34 (A) / 20 (B) |
| Bar transition | orange → cyan gradient | gold → orange |
| Bar timing | **hard cut, 50ms** | **eased, 350ms `sine.inOut`** |
| Bolt A | +200ms, holds 300ms | +150ms, holds 300ms |
| Bolt B | +500ms, holds 383ms | +467ms, holds 267ms |

Bolt polyline points, in the 884×1920 viewBox, round caps and joins:

```
blue A  400,-40 522,330 372,545 652,960 315,1370 430,1760
blue B  432,-40 348,352 533,494 224,726 218,900 646,1178 512,1600
gold A  388,-40 512,315 430,540 614,790 610,1015 452,1310 528,1700
gold B  430,-40 546,300 452,560 640,806 634,1030 470,1330 556,1740
```

**The bolts never fade in.** I sampled the same pixel every frame in both
recordings — the colour is dead flat the whole time a bolt is lit. Opacity
goes 0 → 1 instantly, holds, then cuts out over 50ms. Any ease-in on opacity
kills the effect. Each bolt drifts ~13px while lit; that's the only movement.

The "bar transition" rows apply only if the app has a streak/progress bar. If
it doesn't, skip that part — don't invent one.

**Third state — no strike.** Same jump, same banner, same confetti, but no
bolts, no sparks, no streak tag, and the progress bar just advances normally.
This should be the **default** for ordinary correct answers; the strikes are
for milestones. Make it a prop: `variant: 'none' | 'blue' | 'gold'`.

---

## 5. The miss — never the win sequence in red

- Card **sinks into its base** (`+y`, squashed) — the inverse of the hop. No
  lift, no shine, no sparks.
- Then a horizontal shake.
- **No confetti, no bolts, no streak tag.**
- **The progress bar does not advance at all.**
- The app's error banner comes up faster and blunter than the success one:
  160ms `power4.out` vs 200ms `power3.out`, plus one small recoil on landing.

Keep the win path and the miss path in **separate functions** so celebration
bits can't leak into a failure.

---

## 6. Framework wiring

**React** — never animate through state. Use refs and scope everything:

```js
const scope = useRef(null);
useLayoutEffect(() => {
  const ctx = gsap.context(() => { /* timelines here */ }, scope);
  return () => ctx.revert();          // mandatory: kills tweens + restores inline styles
}, []);
```

Trigger from the app's existing answer-check result. Keep a ref to the timeline
so you can `.kill()` it if the user advances mid-animation — otherwise a
half-finished transform sticks to a recycled DOM node.

**Vue** — `onMounted` / `onBeforeUnmount`, same cleanup discipline.

**Vanilla** — kill the previous timeline before building a new one.

In all cases: if the question list virtualises or recycles nodes, `gsap.set`
the card back to `{clearProps:'transform'}` when it leaves.

---

## 7. Traps already hit — don't repeat them

These cost real debugging time and are all fixed in the reference.

1. **The success banner will cover the submit button.** It's tall and anchored
   to the bottom — exactly where the CTA lives. Give the parked banner
   `pointer-events:none` and only switch it to `auto` once it has slid in.

2. **Dedupe taps by gesture, not by element.** If you add any tap handling,
   bind `pointerup` + `touchend` + `click` (some in-app webviews swallow the
   synthetic click) and allow one action per gesture, counted from
   `pointerdown`. Keying on the element breaks: pressing "continue" fires
   `pointerup` on it, the handler drops the banner, and the `click` of that
   same tap re-hit-tests onto the button underneath — a different element, so
   it slips through and fires a second action.

3. **Don't gate on `prefers-reduced-motion` silently.** Desktop OSes ship that
   setting enabled far more often than phones. Reading it inline made the
   entire strike vanish on desktop while working fine on mobile. Respect it —
   but respect it *visibly*, with a reduced variant, not by discarding the
   animation. Follow whatever the app already does for reduced motion.

4. **Never size containers with `vh` / `svh` / `position:fixed`** if this ends
   up in a webview. `100vh` is the *large* viewport on mobile, so footers land
   under the browser UI.

5. **CSS variables don't resolve in SVG presentation attributes.**
   `stroke="var(--x)"` renders black. Use literal values or set them from JS.

6. **Guard `matchMedia` in try/catch** if you call it after setting a `locked`
   flag, or a throw wedges the UI with no way out.

---

## 8. Done means

- [ ] Existing answer-check logic still works; nothing about scoring changed.
- [ ] Animation uses the app's tokens — zero hardcoded colours from the reference.
- [ ] Tap the text *inside* an option — still selects.
- [ ] Select and submit with no pause — both register.
- [ ] Submit with nothing selected — a nudge, never a dead tap.
- [ ] Advance to the next question mid-animation — no stuck transforms.
- [ ] OS "reduce motion" on — app behaves per its own accessibility policy,
      and does not silently render nothing.
- [ ] Wrong answer — no confetti, no bolts, progress bar doesn't move.
- [ ] Bundle size delta reported (GSAP core is ~23kb gzipped).
- [ ] Works on a real phone, not just a desktop responsive preview.

Build a slow-motion toggle early — `gsap.globalTimeline.timeScale(0.35)` — and
keep it behind a dev flag. You cannot verify any of the above at full speed.

Put it behind a feature flag so it can be switched off without a revert.
