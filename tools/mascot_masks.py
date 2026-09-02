# -*- coding: utf-8 -*-
"""Edit masks for قدّور's body poses.

The face never gets regenerated -- the SVG rig in assets/mascot/lab/ owns every
expression. What GPT Image 2 is asked for is a new ARM position on the original
drawing, through its edit endpoint: transparent pixels in the mask are the only ones
it may repaint, everything opaque is preserved byte-for-byte. That is what keeps the
face, hair, vest and book identical across every pose, and what lets one rig sit on
top of all of them.

Every hole covers BOTH where the arm is now AND where it is going: an inpainter can
only paint inside the hole, so a hole that stops at the old arm gives back the old arm.

The hole's edge beside the head is not a guessed number. It is read off the drawing
per row: the first non-background pixel right of the arm, minus a margin. A guessed
edge clipped the cheek by eight pixels on the first attempt (the face's leftmost
point is x≈528 at y≈390, behind the raised hand, where a left-to-right scan never
sees it).

Output, all under assets/mascot/edits/:
    qaddour-base.png         the reference as PNG (edit endpoints want PNG + same size)
    mask-<pose>.png          RGBA: transparent = repaint, opaque = keep
    preview-<pose>.png       the drawing with the repaint zone tinted, for checking

    python tools/mascot_masks.py
"""
import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF  = os.path.join(ROOT, "assets", "mascot", "reference", "qaddour-reference.jpg")
OUT  = os.path.join(ROOT, "assets", "mascot", "edits")

BG      = np.array([251, 238, 221])   # the drawing's flat cream, sampled at (60,60)
MARGIN  = 10                          # hole stops this far short of the head
ARM_END = 480                         # the raised arm never reaches this x above y=540

# Below the head the body's own left silhouette (white shoulder, then vest, trousers,
# shoe) runs x≈545-592; these caps sit just short of it so the hole holds background
# and the arm only. Measured row by row on 2026-09-02.
#   name: (x_left, y_top, y_bottom_of_head_zone, head_zone_cap, [(y0, y1, x_cap), ...])
POSES = {
    # stick arm hanging at his side, stick pointing down beside the leg
    "down": (220, 280, 600, 536, [(600, 700, 576), (700, 990, 568), (990, 1052, 560)]),
    # stick arm raised straight overhead, beside the hair
    "up":   (200, 30, 600, 532, [(600, 700, 576)]),
}
# OPTIONAL: just the book-cover lettering, if the title is ever changed to قدرات
BOOK = (748, 686, 878, 792)   # right edge stops on the cover, short of the sleeve

def main():
    os.makedirs(OUT, exist_ok=True)
    ref = Image.open(REF).convert("RGBA")
    ref.save(os.path.join(OUT, "qaddour-base.png"))
    rgb = np.asarray(ref.convert("RGB")).astype(int)
    H, W = rgb.shape[:2]
    nonbg = (np.abs(rgb - BG) > 14).any(axis=2)

    def head_left(y):
        """Leftmost head pixel in row y, ignoring the arm; W if the row is clear."""
        row = np.nonzero(nonbg[y, ARM_END:])[0]
        return ARM_END + row[0] if row.size else W

    print("head edge per row (x):", {y: head_left(y) for y in (150, 250, 350, 390, 420, 480, 530)})

    for name, (x0, y_top, y_head, cap, bands) in POSES.items():
        hole = np.zeros((H, W), bool)
        for y in range(y_top, y_head):
            hole[y, x0:min(cap, head_left(y) - MARGIN)] = True
        for (a, b, xc) in bands:
            hole[a:b, x0:xc] = True
        write(name, ref, hole)

        # by construction nothing head-shaped can be inside: prove it
        probe = np.zeros_like(hole); probe[:540, ARM_END:] = True; probe[540:600, 540:] = True
        bad = int((hole & nonbg & probe).sum())
        print(f"  {name}: head pixels inside hole = {bad}" + ("" if bad == 0 else "  <-- FIX"))

    # the thumb holding the book overlaps the cover's bottom-right corner, so the
    # lettering hole is the rectangle minus the hand, grown by a few pixels
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    skin = (r > 220) & (g > 140) & (g < 205) & (b > 80) & (b < 160)
    skin = np.asarray(Image.fromarray(skin.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(13))) > 0
    hole = np.zeros((H, W), bool); hole[BOOK[1]:BOOK[3], BOOK[0]:BOOK[2]] = True
    hole &= ~skin
    write("book", ref, hole)
    purple_or_white = ((b > r + 10) & (b > g + 30)) | (rgb.min(axis=2) > 200)
    bad = hole & ~purple_or_white
    sleeve = hole & (rgb.min(axis=2) > 200); sleeve[:, :866] = False   # white right of the T is shirt
    print(f"  book: sleeve pixels inside hole = {int(sleeve.sum())}")
    print(f"  book: non-cover pixels inside hole = {int(bad.sum())}"
          + ("" if not bad.any() else f"  bbox x{np.nonzero(bad)[1].min()}-{np.nonzero(bad)[1].max()} y{np.nonzero(bad)[0].min()}-{np.nonzero(bad)[0].max()}"))

def write(name, ref, hole):
    alpha = np.where(hole, 0, 255).astype(np.uint8)
    mask = Image.fromarray(np.dstack([np.zeros_like(alpha)] * 3 + [alpha]), "RGBA")
    mask.save(os.path.join(OUT, f"mask-{name}.png"))
    tint = np.zeros(hole.shape + (4,), np.uint8); tint[hole] = (255, 40, 40, 110)
    prev = Image.alpha_composite(ref, Image.fromarray(tint, "RGBA")).convert("RGB")
    prev.thumbnail((900, 900)); prev.save(os.path.join(OUT, f"preview-{name}.png"))
    print(f"wrote mask-{name}.png + preview-{name}.png")

if __name__ == "__main__":
    main()
