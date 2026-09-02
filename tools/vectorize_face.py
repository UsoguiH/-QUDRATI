# -*- coding: utf-8 -*-
"""Turn قدّور's face into an animatable SVG rig.

The drawing is flat vector art that was flattened to a raster, so the parts that need to
move -- brows, eyelids, eye whites, pupils, mouth -- are large regions of one flat colour
and trace back to clean paths. Everything else (hair, beard, glasses, nose, body) stays
raster: re-tracing it would only add error, and none of it moves.

Output, all under assets/mascot/lab/:
    face-base.png   the figure with the animatable parts erased and filled with the
                    colour that sits behind them
    face-rig.svg    <image> of face-base.png plus one <path> per moving part, each with
                    an id the stylesheet drives

Measured, not guessed: the glasses ring never overlaps the eye assembly (the eyes sit
inside the lens openings), so the vector eyes can be painted straight over the raster
without the ring ending up behind them.

    python tools/vectorize_face.py
"""
import io, os, importlib.util
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF  = os.path.join(ROOT, "assets", "mascot", "reference", "qaddour-reference.jpg")
OUT  = os.path.join(ROOT, "assets", "mascot", "lab")

_spec = importlib.util.spec_from_file_location("sm", os.path.join(ROOT, "tools", "slice_mascot.py"))
sm = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(sm)


# ---------------------------------------------------------------- figure

def figure():
    """The reference, cut out, with the baked contact shadow removed.

    The shadow has to go: welded to the figure it travels with every bob, and a contact
    shadow that never touches the ground is the loudest 'this is a sticker' tell there is.
    """
    im = Image.open(REF).convert("RGB")
    a  = np.asarray(im).astype(int)
    al = sm.alpha_from(im, sm.sample_background(a)).astype(int)
    rng = a.max(2) - a.min(2)
    grey = (rng <= 14) & (a.mean(2) > 198) & (a.mean(2) < 240) & (al > 128)
    rows = np.where(grey.sum(1) > 150)[0]
    keep = (al > 128) & ~(grey & np.isin(np.arange(a.shape[0]), rows)[:, None])
    ys, xs = np.where(keep)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    rgba = np.dstack([a, np.where(keep, 255, 0)]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA").crop(box)


# ---------------------------------------------------------------- masks

def largest_blob(pred, box):
    """Biggest 4-connected run of `pred` seeded inside `box`. No scipy in this project."""
    x0, y0, x1, y1 = box
    m = np.zeros(pred.shape, bool)
    m[y0:y1, x0:x1] = pred[y0:y1, x0:x1]
    seen = np.zeros_like(m); best = []
    for sy, sx in zip(*np.where(m)):
        if seen[sy, sx]:
            continue
        q = deque([(sy, sx)]); seen[sy, sx] = True; px = []
        while q:
            y, x = q.popleft(); px.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if m[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        if len(px) > len(best):
            best = px
    out = np.zeros_like(m)
    for y, x in best:
        out[y, x] = True
    return out


def fill_holes(mask):
    """Flood the outside; whatever stays unreached is an interior hole. Keeps the eye
    white solid where the pupil sits on top of it."""
    h, w = mask.shape
    out = np.ones((h + 2, w + 2), bool)
    out[1:-1, 1:-1] = ~mask
    q = deque([(0, 0)]); reach = np.zeros_like(out); reach[0, 0] = True
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < out.shape[0] and 0 <= nx < out.shape[1] and out[ny, nx] and not reach[ny, nx]:
                reach[ny, nx] = True; q.append((ny, nx))
    return ~reach[1:-1, 1:-1]


# ---------------------------------------------------------------- trace

def contour(mask):
    """Closed polygon along pixel edges.

    Every side of a set pixel whose clear neighbour is outside becomes one unit segment,
    emitted clockwise so the interior is always on the right. The segments are then chained
    end to end.

    The chaining has to be deliberate: where two pixels meet only at a corner, that vertex
    carries two outgoing edges and picking one at random closes the loop early -- the path
    comes back as a partial arc and fills with a hole in the middle. Preferring the
    sharpest right turn keeps the walk on the outer boundary.
    """
    seg = {}
    ys, xs = np.where(mask)
    H, W = mask.shape
    for y, x in zip(ys, xs):
        if y == 0     or not mask[y-1, x]: seg.setdefault((x, y),     []).append((x+1, y))
        if x+1 == W   or not mask[y, x+1]: seg.setdefault((x+1, y),   []).append((x+1, y+1))
        if y+1 == H   or not mask[y+1, x]: seg.setdefault((x+1, y+1), []).append((x, y+1))
        if x == 0     or not mask[y, x-1]: seg.setdefault((x, y+1),   []).append((x, y))

    start = min(seg)
    cur, came = start, (0, -1)
    loop = [start]
    for _ in range(sum(len(v) for v in seg.values()) + 4):
        outs = seg.get(cur)
        if not outs:
            break
        if len(outs) == 1:
            nxt = outs.pop()
        else:
            # right, straight, left, back -- relative to how we arrived
            rank = {(-came[1], came[0]): 0, came: 1, (came[1], -came[0]): 2, (-came[0], -came[1]): 3}
            nxt = min(outs, key=lambda q: rank.get((q[0]-cur[0], q[1]-cur[1]), 4))
            outs.remove(nxt)
        if not seg[cur]:
            del seg[cur]
        came = (nxt[0]-cur[0], nxt[1]-cur[1])
        cur = nxt
        if cur == start:
            break
        loop.append(cur)
    return loop


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    a, b = np.array(pts[0]), np.array(pts[-1])
    ab = b - a; n = np.hypot(*ab)
    p = np.array(pts)
    q = p - a
    d = np.abs(ab[0] * q[:, 1] - ab[1] * q[:, 0]) / n if n else np.hypot(q[:, 0], q[:, 1])
    i = int(np.argmax(d))
    if d[i] <= eps:
        return [pts[0], pts[-1]]
    return rdp(pts[:i+1], eps)[:-1] + rdp(pts[i:], eps)


def smooth(pts, tension=0.5):
    """Closed Catmull-Rom through the simplified points, emitted as cubic Beziers.

    The source shapes are smooth curves that pixelation turned into staircases; joining
    the simplified points with straight lines would keep the staircase. This puts the
    curve back."""
    n = len(pts)
    d = ["M %.2f %.2f" % pts[0]]
    for i in range(n):
        p0 = pts[(i - 1) % n]; p1 = pts[i]; p2 = pts[(i + 1) % n]; p3 = pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) * tension / 3, p1[1] + (p2[1] - p0[1]) * tension / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * tension / 3, p2[1] - (p3[1] - p1[1]) * tension / 3)
        d.append("C %.2f %.2f %.2f %.2f %.2f %.2f" % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]))
    return " ".join(d) + " Z"


def presmooth(pts, k=2):
    """Circular moving average over the boundary.

    The traced boundary runs along pixel edges, so a diagonal arrives as a staircase.
    Simplifying it directly keeps the steps -- RDP treats each 1px riser as a real corner.
    Averaging first turns the staircase back into the line it was drawn as."""
    n = len(pts)
    if n < 2 * k + 3:
        return pts
    a = np.array(pts, float)
    w = 2 * k + 1
    out = sum(np.roll(a, i, axis=0) for i in range(-k, k + 1)) / w
    return [tuple(v) for v in out]


def path_of(mask, eps=1.3, k=2):
    return smooth(rdp(presmooth(contour(mask), k), eps))


def med_colour(rgb, mask):
    return "#%02X%02X%02X" % tuple(int(v) for v in np.median(rgb[mask], 0))


def centre(mask):
    ys, xs = np.where(mask)
    return (xs.min() + xs.max() + 1) / 2, (ys.min() + ys.max() + 1) / 2


def erode(mask, r=1):
    m = Image.fromarray((mask * 255).astype(np.uint8), "L").filter(ImageFilter.MinFilter(2 * r + 1))
    return np.asarray(m) > 127


def dilate(mask, r=2):
    m = Image.fromarray((mask * 255).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(2 * r + 1))
    return np.asarray(m) > 127


# ---------------------------------------------------------------- build

def main():
    os.makedirs(OUT, exist_ok=True)
    fig = figure()
    a = np.asarray(fig).astype(int)
    rgb = a[..., :3]
    H, W = rgb.shape[:2]

    WHITE = rgb.min(2) > 232
    DARK  = rgb.max(2) < 70
    LID   = np.abs(rgb - np.array([181, 109, 59])).max(2) < 40
    MAROON = (np.abs(rgb - np.array([126, 3, 8])).max(2) < 48)
    TONGUE = (rgb[..., 0] > 180) & (rgb[..., 1] < 90) & (rgb[..., 2] < 95)

    # boxes measured off the cut-out, not guessed
    F = {
        "browL":  largest_blob(DARK,  (346, 206, 442, 247)),
        "browR":  largest_blob(DARK,  (465, 219, 557, 267)),
        "lidL":   largest_blob(LID,   (340, 244, 425, 296)),
        "lidR":   largest_blob(LID,   (464, 262, 556, 316)),
        "whiteL": largest_blob(WHITE, (340, 278, 412, 342)),
        "whiteR": largest_blob(WHITE, (462, 295, 556, 360)),
        "pupilL": largest_blob(DARK,  (374, 283, 423, 324)),
        "pupilR": largest_blob(DARK,  (478, 297, 527, 340)),
        "mouth":  largest_blob(MAROON,(395, 390, 484, 441)),
        "teeth":  largest_blob(WHITE, (404, 390, 471, 408)),
        "tongue": largest_blob(TONGUE,(422, 411, 479, 442)),
    }
    F["mouth"] = fill_holes(F["mouth"])
    # colours come from the pixels a part actually covers in the drawing; the eye oval
    # below is a construction, so its fill is sampled from the sclera it replaces
    CSRC = {}

    # The eye is one oval built from three colours: brown lid on top, white below, pupil
    # riding on the white. Lid and white do not actually touch -- an antialiased row sits
    # between them -- so a hole filled from (lid | white) alone leaks out through that gap
    # and the pupil area never closes. Dilating first bridges it.
    for side in ("L", "R"):
        eye = F["lid" + side] | F["white" + side] | F["pupil" + side]
        F["eye" + side] = erode(fill_holes(dilate(eye, 1)), 1)
        # paint the whole oval white and let the lid cover the top, rather than tracing the
        # white's bitten-out shape: the pupil then always has solid white behind it
        CSRC["white" + side] = F["white" + side]
        F["white" + side] = F["eye" + side]
        # The oval reaches a pixel or two past the brown dome at the top, so the white
        # underneath it shows as a bright arc. Grow the lid up and sideways -- never down,
        # which would move the lid/white line and make him look sleepier -- and let the
        # clip stop it at the oval edge.
        lid = F["lid" + side]
        grown = lid.copy()
        for d in range(1, 4):
            grown |= np.roll(lid, -d, axis=0)
            grown |= np.roll(lid,  d, axis=1)
            grown |= np.roll(lid, -d, axis=1)
        F["lid" + side] = grown & F["eye" + side]

    col = {k: med_colour(rgb, CSRC.get(k, m)) for k, m in F.items()}
    for k in F:
        print("  %-7s %5d px  %s" % (k, F[k].sum(), col[k]))

    # ---- base raster: erase what moves, fill with what is behind it
    base = a.copy()
    skin = np.array([252, 178, 120])
    ring = dilate(F["mouth"] | F["teeth"] | F["tongue"], 6) & ~(F["mouth"] | F["teeth"] | F["tongue"])
    dark_fill = np.median(rgb[ring & (rgb.max(2) < 110)], 0) if (ring & (rgb.max(2) < 110)).any() else np.array([40, 40, 40])
    for k in ("browL", "browR", "pupilL", "pupilR"):
        base[dilate(F[k], 2), :3] = skin
    for k in ("eyeL", "eyeR"):
        base[dilate(F[k], 1), :3] = skin
    for k in ("mouth", "teeth", "tongue"):
        base[dilate(F[k], 2), :3] = dark_fill
    Image.fromarray(base.astype(np.uint8), "RGBA").save(os.path.join(OUT, "face-base.png"), optimize=True)

    # ---- svg
    p = {k: path_of(m) for k, m in F.items()}
    p["clipL"], p["clipR"] = p["eyeL"], p["eyeR"]

    def g(name, body, ox, oy):
        return ('<g id="%s" style="transform-origin:%.1fpx %.1fpx">%s</g>' % (name, ox, oy, body))

    s = io.StringIO()
    s.write('<svg id="qaddour" xmlns="http://www.w3.org/2000/svg" '
            'xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 %d %d" '
            'width="%d" height="%d">\n' % (W, H, W, H))
    s.write('<defs>\n<clipPath id="clipL"><path d="%s"/></clipPath>\n'
            '<clipPath id="clipR"><path d="%s"/></clipPath>\n</defs>\n' % (p["clipL"], p["clipR"]))
    s.write('<image x="0" y="0" width="%d" height="%d" xlink:href="face-base.png"/>\n' % (W, H))

    # mouth: pivot at the top lip so opening drops the jaw instead of growing both ways
    mx, my = centre(F["mouth"]); mtop = np.where(F["mouth"].any(1))[0].min()
    s.write(g("mouth", ''.join([
        '<path d="%s" fill="%s"/>' % (p["mouth"],  col["mouth"]),
        '<path d="%s" fill="%s"/>' % (p["teeth"],  col["teeth"]),
        '<path d="%s" fill="%s"/>' % (p["tongue"], col["tongue"]),
    ]), mx, mtop) + "\n")

    for side in ("L", "R"):
        bx, by = centre(F["brow" + side])
        s.write(g("brow" + side, '<path d="%s" fill="%s"/>' % (p["brow"+side], col["brow"+side]), bx, by) + "\n")

    for side, clip in (("L", "clipL"), ("R", "clipR")):
        lid = F["lid" + side]
        ltop = np.where(lid.any(1))[0].min()
        lx, _ = centre(lid)
        px_, py_ = centre(F["pupil" + side])
        s.write('<g clip-path="url(#%s)">' % clip)
        s.write('<path d="%s" fill="%s"/>' % (p["white"+side], col["white"+side]))
        s.write(g("pupil" + side, '<path d="%s" fill="%s"/>' % (p["pupil"+side], col["pupil"+side]), px_, py_))
        # the lid scales DOWN from its own top edge, so a blink sweeps the lid over the
        # eye the way the drawing already builds it -- no second drawing needed
        s.write(g("lid" + side, '<path d="%s" fill="%s"/>' % (p["lid"+side], col["lid"+side]), lx, ltop))
        s.write('</g>\n')

    s.write('</svg>\n')
    with open(os.path.join(OUT, "face-rig.svg"), "w", encoding="utf-8") as f:
        f.write(s.getvalue())
    print("\nwrote face-base.png and face-rig.svg  (%dx%d)" % (W, H))


if __name__ == "__main__":
    main()
