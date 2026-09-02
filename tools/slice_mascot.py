"""Slice قدّور model sheets into per-state PNGs for assets/mascot/.

Whatever the generator produces, this script does everything after generation:
cell split -> cutout -> alpha -> uniform canvas -> size budget.

Two input shapes, because the prompt library changed shape twice:
  - GRID sheets (v1/v2): several poses in one image, split on the real gutters. `--check`
    reports; a sheet number processes just that one.
  - Single figures (v3): one pose per image, no split at all. `--single`.

Both land in the same place and matter for the same reason: every state must sit on the
same canvas at the same visual height, or one CSS `height` renders them at different
sizes. The grid is data-driven (see GRID), so a sheet can move between 4-up, 2-up and a
lone figure by editing SHEETS alone.

Descended from ClaudeBot/tools/{slice,normalize}_mascots.py, with three corrections
that copy would have gotten wrong here:

  1. Background detection is SAMPLED, not hardcoded to near-white. The spec's cream
     #F5E9DA has saturation 27, so ClaudeBot's `sat < 20` paper test scored the whole
     background as character and cut nothing.
  2. Un-compositing divides out the SAMPLED background, not 255. Feathered edges
     un-premultiplied against white go pale against a cream sheet.
  3. The "cut at a 12-row empty band" rule is OFF by default. It existed to drop a
     text label under each shape; our sheets have no labels, and confetti or a raised
     pointer stick floating clear of the body is exactly that pattern -- it would
     guillotine `celebrate` and `point`.

usage:
    python tools/slice_mascot.py                 # every sheet present
    python tools/slice_mascot.py 1               # just sheet 1
    python tools/slice_mascot.py --check         # report only, write nothing
    python tools/slice_mascot.py --single        # v3: one figure per image, no grid
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import sys, os, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET_DIR = os.path.join(ROOT, "assets", "mascot", "sheets")
OUT_DIR = os.path.join(ROOT, "assets", "mascot")

# Cells in visual order. Keep in step with Mascotprompt.md -- the prompt names the
# same positions, so a mislabelled cell here silently swaps two emotional states in the app.
#
# Two per sheet, not four: the first 4-up attempt came back with amputated arms and a
# duplicated book because the layout ate the model's budget. Two figures in a square image
# also gives each a portrait-shaped cell, which suits a full-body figure far better.
SHEETS = {
    1: ["encourage", "cheer", "point", "concerned"],   # the core loop
    2: ["wave", "proud", "celebrate", "teach"],        # welcome + wins
    3: ["think", "timeup", "strong", "calm"],          # completes Tier 1
    4: ["sleep", "stop", "crown", "oops"],             # Tier 2
}
# Layout is inferred from how many states a sheet declares, so a sheet can go back to 4-up
# (or down to a single figure) by editing SHEETS alone.
GRID = {1: (1, 1), 2: (1, 2), 4: (2, 2)}
CELL_NAME = {
    (1, 1): ["centre"],
    (1, 2): ["left", "right"],
    (2, 2): ["top-left", "top-right", "bottom-left", "bottom-right"],
}

CANVAS = 512                      # ~2x the largest on-screen use (200px hero)
TARGET_H = int(CANVAS * 0.94)     # one content height for every state, so a CSS
MAX_W = int(CANVAS * 0.96)        # height: Npx renders them all at the same size
SIZE_LIMIT = 45 * 1024            # the repo's benchmark: rank-*.png ship at 42-45 KB
# Small on purpose. The pad is only there to give the feathered edge somewhere to live,
# and it is measured in SOURCE pixels -- so it scales differently for a compact pose than
# for a tall one, and a large pad reintroduces exactly the uneven visual height that
# to_canvas() exists to remove. 3px covers a 0.7px blur with room to spare.
PAD = 3


def sample_background(a):
    """Median of the four corner patches. The sheet background is required to be one
    flat colour, so the corners are it -- and sampling survives the model shifting
    the cream a few points, which a hardcoded constant does not."""
    h, w = a.shape[:2]
    k = max(6, min(h, w) // 40)
    patches = [a[:k, :k], a[:k, -k:], a[-k:, :k], a[-k:, -k:]]
    return np.median(np.concatenate([p.reshape(-1, 3) for p in patches]), axis=0)


def paper_mask(a, bg, tol=18):
    """Pixels within tol of the background colour, per channel.

    tol=18 is chosen against the palette, not by eye: the nearest character colour to
    cream #F5E9DA is the white shirt, which differs by 22 in green -- so 18 clears it
    with margin, while warm tan skin (48 in green) is never close."""
    return np.all(np.abs(a - bg) <= tol, axis=2)


def alpha_from(cell_rgb, bg):
    """Flood the background in from the crop border.

    A plain colour test would also erase his eye whites, the shirt and the book's
    lettering. Filling only from the border means enclosed regions of the same colour
    stay opaque -- they are not reachable from outside the silhouette."""
    a = np.asarray(cell_rgb).astype(int)
    paper = paper_mask(a, bg)
    # .copy() is load-bearing: an image built by fromarray wraps the numpy buffer, and
    # floodfill's writes through it are silently dropped -- alpha comes back all-255 and
    # every state ships as an uncut square. Do not remove it.
    flood = Image.fromarray(np.where(paper, 0, 255).astype(np.uint8), "L").copy()
    w, h = flood.size
    seeds = [(x, y) for x in range(0, w, 3) for y in (0, h - 1)] \
          + [(x, y) for y in range(0, h, 3) for x in (0, w - 1)]
    for s in seeds:
        if flood.getpixel(s) == 0:
            ImageDraw.floodfill(flood, s, 128, thresh=0)
    return np.where(np.array(flood) == 128, 0, 255).astype(np.uint8)


def ink_projection(ink, axis):
    """Per-row (axis=1) or per-column (axis=0) count of figure pixels."""
    return ink.sum(axis=axis)


def find_splits(counts, n):
    """Where to cut a strip of n figures, by locating the EMPTY bands between them
    rather than dividing the span by n.

    A fixed n-way split assumes the generator centred every figure in its cell. It does
    not: on the first real sheet the two bottom figures began 1px above the geometric
    midline, so an H/2 cut shaved the top off both and the clip detector fired. Cutting
    down the middle of the actual gutter is exact, and it degrades gracefully -- if no
    clean gutter exists (figures touching) it falls back to the even division and the
    clip warning still tells you."""
    if n == 1:
        return []
    span = len(counts)
    empty = np.where(counts == 0)[0]
    if not len(empty):
        return [round(span * k / n) for k in range(1, n)]

    # group consecutive empty indices into bands
    bands, start, prev = [], empty[0], empty[0]
    for i in empty[1:]:
        if i != prev + 1:
            bands.append((start, prev))
            start = i
        prev = i
    bands.append((start, prev))
    # ignore the leading/trailing margins -- they are not gutters between figures
    inner = [b for b in bands if b[0] > 0 and b[1] < span - 1]

    splits = []
    for k in range(1, n):
        want = span * k / n
        near = [b for b in inner if b[1] - b[0] >= 2]
        if not near:
            splits.append(round(want))
            continue
        # the gutter whose centre is closest to where an even split would land
        b = min(near, key=lambda b: abs((b[0] + b[1]) / 2 - want))
        splits.append(int(round((b[0] + b[1]) / 2)))
    return splits


def cut_cell(cell_rgb, bg):
    """One quadrant -> tight RGBA cutout, plus the bbox so the caller can tell whether
    the pose ran into the quadrant edge."""
    al = alpha_from(cell_rgb, bg).astype(float)
    ys, xs = np.nonzero(al > 127)
    if not len(ys):
        return None, None
    y0, y1 = max(ys.min() - PAD, 0), min(ys.max() + PAD, al.shape[0] - 1)
    x0, x1 = max(xs.min() - PAD, 0), min(xs.max() + PAD, al.shape[1] - 1)

    sub = cell_rgb.crop((x0, y0, x1 + 1, y1 + 1))
    sub_a = al[y0:y1 + 1, x0:x1 + 1]
    # feather, then divide the background back out of the feathered ring, or every
    # edge pixel keeps a cream halo that shows against the app's white cards
    soft = np.asarray(Image.fromarray(sub_a.astype(np.uint8), "L")
                      .filter(ImageFilter.GaussianBlur(0.7))).astype(float)
    af = np.clip(soft / 255.0, 0, 1)[:, :, None]
    rgb = np.asarray(sub).astype(float)
    fg = np.where(af > 0.03, (rgb - bg * (1 - af)) / np.maximum(af, 0.03), rgb)
    out = Image.fromarray(
        np.dstack([np.clip(fg, 0, 255), np.clip(soft, 0, 255)]).astype(np.uint8), "RGBA")
    return out, (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))


def to_canvas(img):
    """Uniform visual height on a square canvas. Without this the natural bounding
    boxes differ per pose, so `celebrate` (arms up, tall) renders small and `calm`
    (compact) renders large at the same CSS height."""
    w, h = img.size
    scale = TARGET_H / h
    if w * scale > MAX_W:
        scale = MAX_W / w
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    shape = img.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(shape, ((CANVAS - nw) // 2, (CANVAS - nh) // 2), shape)
    return canvas, nw, nh


def save_budgeted(img, path):
    """Write under SIZE_LIMIT. Flat vector art usually clears it as full RGBA; the
    quantize ladder is there so a noisy generation still ships rather than blocking."""
    img.save(path, "PNG", optimize=True)
    size = os.path.getsize(path)
    if size <= SIZE_LIMIT:
        return size, "rgba"
    for colors in (256, 192, 128, 96, 64):
        q = img.quantize(colors=colors, method=Image.FASTOCTREE)
        q.save(path, "PNG", optimize=True)
        size = os.path.getsize(path)
        if size <= SIZE_LIMIT:
            return size, f"p{colors}"
    return size, f"p64 OVER"


def process(n, check_only=False):
    src = None
    for ext in (".png", ".webp", ".jpg", ".jpeg"):
        p = os.path.join(SHEET_DIR, f"sheet-{n}{ext}")
        if os.path.exists(p):
            src = p
            break
    if not src:
        print(f"sheet {n}: not found in assets/mascot/sheets/ -- skipped")
        return {}

    im = Image.open(src)
    has_alpha = im.mode in ("RGBA", "LA") and np.asarray(im.convert("RGBA"))[:, :, 3].min() < 250
    im = im.convert("RGBA") if has_alpha else im.convert("RGB")
    W, H = im.size
    print(f"\nsheet {n}  {os.path.basename(src)}  {W}x{H}  "
          f"{'already transparent' if has_alpha else 'flat background -> cutting'}")

    if has_alpha:
        bg = None
    else:
        bg = sample_background(np.asarray(im).astype(int))
        print(f"  background sampled: #{int(bg[0]):02x}{int(bg[1]):02x}{int(bg[2]):02x}")

    meta = {}
    states = SHEETS[n]
    if len(states) not in GRID:
        print(f"  sheet {n} declares {len(states)} states; expected one of {sorted(GRID)}")
        return {}
    rows, cols = GRID[len(states)]
    names = CELL_NAME[(rows, cols)]

    # Cut on the real gutters, not on W/n. Row bands come from the whole image; the
    # column gutter is then found WITHIN each row band, because the figure in the
    # top-left and the one in the bottom-left need not occupy the same x range.
    if has_alpha:
        ink = np.asarray(im)[:, :, 3] > 127
    else:
        ink = ~paper_mask(np.asarray(im).astype(int), bg)
    ybounds = [0] + find_splits(ink_projection(ink, 1), rows) + [H]
    xbounds_by_row = []
    for r in range(rows):
        band = ink[ybounds[r]:ybounds[r + 1]]
        xbounds_by_row.append([0] + find_splits(ink_projection(band, 0), cols) + [W])
    if rows > 1 or cols > 1:
        print(f"  gutters: y={ybounds[1:-1] or '-'}  x={[b[1:-1] for b in xbounds_by_row]}")

    for i, name in enumerate(states):
        r, c = divmod(i, cols)
        xs_ = xbounds_by_row[r]
        box = (xs_[c], ybounds[r], xs_[c + 1], ybounds[r + 1])
        region = im.crop(box)

        if has_alpha:
            arr = np.asarray(region)
            ys, xs = np.nonzero(arr[:, :, 3] > 127)
            if not len(ys):
                print(f"  {names[i]:<12} {name:<10} EMPTY -- nothing found")
                continue
            cut = region.crop((max(xs.min() - PAD, 0), max(ys.min() - PAD, 0),
                               min(xs.max() + PAD, region.width - 1) + 1,
                               min(ys.max() + PAD, region.height - 1) + 1))
            bbox = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
        else:
            cut, bbox = cut_cell(region.convert("RGB"), bg)
            if cut is None:
                print(f"  {names[i]:<12} {name:<10} EMPTY -- nothing found")
                continue

        # A pose touching its quadrant edge means the model ignored the grid and the
        # figure is clipped. Louder than a size warning: the art is wrong, not heavy.
        touch = []
        if bbox[0] <= 1: touch.append("left")
        if bbox[1] <= 1: touch.append("top")
        if bbox[2] >= region.width - 2: touch.append("right")
        if bbox[3] >= region.height - 2: touch.append("bottom")

        canvas, nw, nh = to_canvas(cut)
        flag = f"  !! CLIPPED at {'/'.join(touch)} -- regenerate this sheet" if touch else ""
        if check_only:
            print(f"  {names[i]:<12} {name:<10} content {nw}x{nh}{flag}")
            continue

        out = os.path.join(OUT_DIR, f"qaddour-{name}.png")
        size, mode = save_budgeted(canvas, out)
        over = "  !! OVER 45 KB" if size > SIZE_LIMIT else ""
        print(f"  {names[i]:<12} {name:<10} -> qaddour-{name}.png  "
              f"{size/1024:5.1f} KB  {mode}{over}{flag}")
        meta[name] = {"w": CANVAS, "h": CANVAS, "renderedW": nw, "renderedH": nh,
                      "bytes": size, "sheet": n}
    return meta


def process_single(check_only=False):
    """v3 generates ONE figure per image, so there is no grid to cut -- but everything
    after the cut still matters: the background still has to come off, and every state
    still has to land on the same canvas at the same visual height, or they render at
    different sizes for one CSS `height`. Same pipeline, minus the split."""
    src_dir = os.path.join(SHEET_DIR, "single")
    if not os.path.isdir(src_dir):
        print("no assets/mascot/sheets/single/ -- put one image per state there,"
              " named qaddour-<state>.png")
        return {}
    meta = {}
    for f in sorted(os.listdir(src_dir)):
        stem, ext = os.path.splitext(f)
        if ext.lower() not in (".png", ".webp", ".jpg", ".jpeg"):
            continue
        name = stem[8:] if stem.startswith("qaddour-") else stem
        im = Image.open(os.path.join(src_dir, f))
        has_alpha = im.mode in ("RGBA", "LA") and np.asarray(im.convert("RGBA"))[:, :, 3].min() < 250
        im = im.convert("RGBA") if has_alpha else im.convert("RGB")

        if has_alpha:
            arr = np.asarray(im)
            ys, xs = np.nonzero(arr[:, :, 3] > 127)
            if not len(ys):
                print(f"  {name:<12} EMPTY -- nothing found")
                continue
            cut = im.crop((max(xs.min() - PAD, 0), max(ys.min() - PAD, 0),
                           min(xs.max() + PAD, im.width - 1) + 1,
                           min(ys.max() + PAD, im.height - 1) + 1))
        else:
            cut, _ = cut_cell(im, sample_background(np.asarray(im).astype(int)))
            if cut is None:
                print(f"  {name:<12} EMPTY -- nothing found")
                continue

        canvas, nw, nh = to_canvas(cut)
        if check_only:
            print(f"  {name:<12} content {nw}x{nh}   ({'transparent' if has_alpha else 'cut'})")
            continue
        out = os.path.join(OUT_DIR, f"qaddour-{name}.png")
        size, mode = save_budgeted(canvas, out)
        over = "  !! OVER 45 KB" if size > SIZE_LIMIT else ""
        print(f"  {name:<12} -> qaddour-{name}.png  {size/1024:5.1f} KB  {mode}{over}")
        meta[name] = {"w": CANVAS, "h": CANVAS, "renderedW": nw, "renderedH": nh,
                      "bytes": size, "sheet": "single"}
    return meta


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a not in ("--check", "--single")]
    check = "--check" in sys.argv
    single = "--single" in sys.argv

    os.makedirs(SHEET_DIR, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    meta = {}
    if single:
        meta.update(process_single(check))
    else:
        for n in ([int(a) for a in args] if args else sorted(SHEETS)):
            meta.update(process(n, check))

    if check:
        print("\nCheck only -- nothing written.")
    elif meta:
        mp = os.path.join(OUT_DIR, "mascot.json")
        old = json.load(open(mp)) if os.path.exists(mp) else {}
        old.update(meta)
        json.dump(old, open(mp, "w"), indent=1)
        print(f"\n{len(meta)} state(s) written. Manifest: assets/mascot/mascot.json")
        print("Next: eyeball each against the QA gate in Mascotprompt.md.")
    else:
        print("\nNothing processed."
              "\n  sheets (v2): assets/mascot/sheets/sheet-1.png ... sheet-4.png"
              "\n  singles (v3): assets/mascot/sheets/single/qaddour-<state>.png, cut with --single")
