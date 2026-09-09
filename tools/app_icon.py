"""The web app icon — قدّور on his purple tile — in every size the web needs.

    python tools/app_icon.py                 # rebuild every size from the master
    python tools/app_icon.py render.png      # cut a new master out of a raw render first

A raw render is the mascot tile on a plain black background (the way the
illustration tool exports it). The master is that tile alone: a 1024×1024
rounded square whose corners are transparent. Everything else is derived from
the master, so the master is the only file worth editing by hand.

Outputs (assets/app-icon/ unless noted):
    icon-1024.png            master — rounded tile, transparent corners
    icon-512.png             manifest icon  (purpose "any")
    icon-192.png             manifest icon  (purpose "any")
    maskable-512.png         manifest icon  (purpose "maskable") — full bleed
    apple-touch-icon.png     180×180, full bleed (iOS rounds it itself)
    favicon-96.png           Google's search-result favicon (multiple of 48)
    favicon-32.png / favicon-16.png
    ../../favicon.ico        16 + 32 + 48, at the site root for old browsers

Needs Pillow and numpy (both already used by the figure tools).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "app-icon"
MASTER = OUT / "icon-1024.png"
SIZE = 1024
CORNER = 0.25          # corner radius as a fraction of the side — measured off the render
EDGE_INSET = 4         # px trimmed inside the render's soft edge so no black bleeds in


def rounded_mask(size, radius, inset=0):
    """Anti-aliased rounded-square alpha, drawn at 4× and downsampled."""
    s4 = size * 4
    m = Image.new("L", (s4, s4), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        (inset * 4, inset * 4, s4 - 1 - inset * 4, s4 - 1 - inset * 4),
        radius=(radius - inset) * 4, fill=255)
    return m.resize((size, size), Image.LANCZOS)


def tile_bounds(rgb):
    """Bounding box of the tile inside a black render."""
    lum = np.asarray(rgb).astype(int).sum(2)
    rows = np.where((lum > 40).any(1))[0]
    cols = np.where((lum > 40).any(0))[0]
    return cols.min(), rows.min(), cols.max() + 1, rows.max() + 1


def build_master(render_path):
    src = Image.open(render_path).convert("RGB")
    src = src.crop(tile_bounds(src)).resize((SIZE, SIZE), Image.LANCZOS)
    mask = rounded_mask(SIZE, int(CORNER * SIZE), EDGE_INSET)
    tile = src.copy()
    tile.putalpha(mask)
    # drop the inset margin so the tile fills the canvas edge to edge
    tile = tile.crop((EDGE_INSET, EDGE_INSET, SIZE - EDGE_INSET, SIZE - EDGE_INSET))
    tile = tile.resize((SIZE, SIZE), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    tile.save(MASTER, optimize=True)
    print("master  ", MASTER.relative_to(ROOT), tile.size)


def full_bleed(tile):
    """Paint the transparent corners with the tile's own edge colour so iOS and
    maskable launchers, which cut their own shape, never see black corners.
    Each corner pixel takes the colour of the point on the corner arc nearest
    to it, so the purple gradient simply continues outward."""
    a = np.asarray(tile).astype(float)
    size = a.shape[0]
    r = int(CORNER * size)
    out = a.copy()
    for cy, cx in ((r, r), (r, size - 1 - r), (size - 1 - r, r), (size - 1 - r, size - 1 - r)):
        y0, y1 = (0, r) if cy == r else (size - r, size)
        x0, x1 = (0, r) if cx == r else (size - r, size)
        yy, xx = np.mgrid[y0:y1, x0:x1]
        dy, dx = yy - cy, xx - cx
        dist = np.hypot(dy, dx)
        dist[dist == 0] = 1
        sy = np.clip(np.round(cy + dy / dist * (r - 3)), 0, size - 1).astype(int)
        sx = np.clip(np.round(cx + dx / dist * (r - 3)), 0, size - 1).astype(int)
        fill = a[sy, sx, :3]
        alpha = (a[y0:y1, x0:x1, 3:4] / 255.0)
        out[y0:y1, x0:x1, :3] = a[y0:y1, x0:x1, :3] * alpha + fill * (1 - alpha)
        out[y0:y1, x0:x1, 3] = 255
    return Image.fromarray(out.round().astype(np.uint8)).convert("RGB")


def build_set():
    tile = Image.open(MASTER).convert("RGBA")
    bleed = full_bleed(tile)

    def save(img, name, size, where=OUT):
        img.resize((size, size), Image.LANCZOS).save(where / name, optimize=True)
        print(f"{size:>4}px  ", (where / name).relative_to(ROOT))

    save(tile, "icon-512.png", 512)
    save(tile, "icon-192.png", 192)
    save(tile, "favicon-96.png", 96)
    save(tile, "favicon-32.png", 32)
    save(tile, "favicon-16.png", 16)
    save(bleed, "maskable-512.png", 512)
    save(bleed, "apple-touch-icon.png", 180)
    ico = tile.resize((48, 48), Image.LANCZOS)
    ico.save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print(" ico   ", "favicon.ico (16, 32, 48)")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        build_master(sys.argv[1])
    elif not MASTER.exists():
        sys.exit("no master yet — pass a raw render: python tools/app_icon.py render.png")
    build_set()
