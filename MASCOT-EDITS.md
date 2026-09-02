# قدّور — the edits

The drawing is the mascot. Nothing regenerates him. What GPT Image 2 does here is
**repaint one arm** on the original, through its *edit* mode, so that face, hair, vest
and book stay pixel-identical in every pose — which is what lets one face rig sit on
top of all of them.

**Click-to-copy version, with the repaint zone shown:** http://localhost:8080/mascot-edits.html

---

## How an edit works

An edit takes three things: the picture, a **mask** saying which pixels may change, and
a prompt for what goes there. Everything outside the mask is preserved byte-for-byte.
The mask has to cover **where the arm is now and where it is going** — the model can only
paint inside the hole, so a hole that stops at the old arm hands you back the old arm.

Files are in `assets/mascot/edits/` (made by `python tools/mascot_masks.py`):

| File | What it is |
|---|---|
| `qaddour-base.png` | the drawing, as PNG at its own 1361×1156 |
| `mask-<pose>.png` | transparent = repaint, opaque = keep |
| `preview-<pose>.png` | the drawing with the repaint zone tinted red — look at this first |

**Route A — scripted (preferred).** With an OpenAI API key in `.env`
(`OPENAI_API_KEY=…`, gitignored; a ChatGPT subscription is not one — it's a separate
pay-as-you-go key from platform.openai.com, cents per edit):

    python tools/mascot_edit.py down
    python tools/mascot_edit.py up

The script sends the exact mask, then **composites only the hole back onto the
untouched original** — so outside the mask the result is byte-identical by
construction, and it lands on the drawing's own 1361×1156. It prints the proof
(max diff outside mask = 0) and writes `compare-<pose>.png`: original | raw answer |
composite. Judge the arm and the seam there.

**Route B — by hand in ChatGPT.** Upload `qaddour-base.png` → *Edit* → brush over the
red zone in the matching preview → paste the prompt. The model re-renders the whole
picture, so pixels outside your brush come back *close*, not identical, and at whatever
size the tool likes. Save what it gives you, then let the same compositor fix both:

    python tools/mascot_edit.py down --from ~/Downloads/whatever-it-saved.png

It scales the file back to 1361×1156, keeps only the hole, and prints a drift number —
low means the framing survived, high means the tool cropped and the edit needs redoing.

The book stays as drawn — `EGYPT / عربي`. If that ever changes, `mask-book.png`
covers just the lettering (and steps around the thumb), so a retitle to قدرات is one
more edit of the same kind, not a new drawing.

---

## Only two edits, and the drawing is the third pose

| Body | How | Used for |
|---|---|---|
| `ref` — as drawn, stick up | nothing to do | point · teach · cheer · timeup · oops |
| `down` — arm relaxed, stick down | edit 1 | stand · calm · sleep · proud · concerned · think · crown |
| `up` — stick raised overhead | edit 2 | celebrate · strong · wave |

Every expression on top of those comes from the face rig, not from art.

---

## 1 — `down`

Save as **qaddour-down.png**

Mask: `mask-down.png` · preview: `preview-down.png`

```
Repaint ONLY the masked area. This is the same flat vector cartoon illustration — match
its style, line weight, colours and the flat cream background exactly.

In the masked area, draw his arm on the VIEWER'S LEFT hanging relaxed at his side:
white shirt sleeve rolled to just below the elbow, then forearm and hand in his tan
skin, the hand at hip height beside the vest. The hand loosely holds the same thin dark
pointer stick, pointing straight DOWN beside his leg, its tip just above the ground.
The arm is complete — shoulder to hand as one unbroken shape — and joins the body at
the shoulder where the old sleeve was.

Everything else inside the masked area is the flat cream background. Nothing outside
the mask changes. No new objects, no text, no shadow on the wall.
```

**Check:** stick points down · the arm meets the shoulder, no gap · the cream fill matches the rest of the background with no seam.

---

## 2 — `up`

Save as **qaddour-up.png**

Mask: `mask-up.png` · preview: `preview-up.png`

```
Repaint ONLY the masked area. This is the same flat vector cartoon illustration — match
its style, line weight, colours and the flat cream background exactly.

In the masked area, draw his arm on the VIEWER'S LEFT raised straight up overhead in
celebration: white shirt sleeve rolled to just below the elbow, then forearm and hand in
his tan skin, the hand above the level of his hair, holding the same thin dark pointer
stick pointing straight UP. The arm is complete — shoulder to hand as one unbroken
shape — and joins the body at the shoulder where the old sleeve was.

Everything else inside the masked area is the flat cream background. Nothing outside
the mask changes. No new objects, no text, no shadow on the wall.
```

**Check:** hand higher than the hair · stick points up · shoulder joins cleanly · no second stick left behind.

---

## When both are in

Open all three (`qaddour-base.png`, `qaddour-down.png`, `qaddour-up.png`) and flick
between them. The head, vest, book and trousers must not move by a single pixel — if
they do, the tool resized or cropped, and the edit has to be redone at 1361×1156.

Then: `python tools/vectorize_face.py` already knows how to erase the face for the rig;
the wiring step extends it to all three bodies with one fixed crop.
