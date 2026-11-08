"""Draws «قدراتي» for the loading screen, in whichever look is chosen.

The loading screen shows before any font has arrived, so the name is not text
but a font's letters as paths: the body of the word in one path (twice — the
second is the 3D lip a look may show under it), and each of its six dots on
its own, so the dots can hop and, on the welcome screen, fly off as its three
coins (ق's pair the green coin, ت's the gold, ي's the blue). The letters are
shaped by HarfBuzz, so any Arabic font joins as it would on screen.

A look is a font plus its own colours: tools/splash/<look>.css. The script
writes tools/splash/<look>.html (the look's style and markup, which the lab
loads into index.html with ?dev=1&splashv=<look>), and with --ship writes the
same into index.html between its splash-css and splash-word markers.

    python tools/splash_word.py                 every look into tools/splash/
    python tools/splash_word.py --ship fahim    that look into index.html too

Fonts other than the app's own are read from --fonts (default: tools/splash/fonts),
fetched from github.com/google/fonts (ofl/<family>/...). Needs fonttools and uharfbuzz.
"""
import argparse
import re
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
LOOKS_DIR = ROOT / "tools" / "splash"
PAGE = ROOT / "index.html"
WORD = "قدراتي"
COINS = "gob"                             # the dotted letters right to left — ق ت ي — and the coin each pair becomes

LOOKS = {
    "base":     ("baloo-bhaijaan-2.ttf", {"wght": 800}),
    "fahim":    ("Marhey.ttf",           {"wght": 700}),
    "notebook": ("Changa.ttf",           {"wght": 800}),
    "night":    ("ReadexPro.ttf",        {"wght": 700, "HEXP": 0}),
    "duo":      ("Lemonada.ttf",         {"wght": 700}),
    "brilliant": ("Rubik.ttf",           {"wght": 900}),
    # the user's own «قدراتي» (2026-10-29), traced from their picture: tools/splash/qudrati-mark.svg
    "mark":      ("qudrati-mark.svg", None),
    "markmono":  ("qudrati-mark.svg", None),
    "markgreen": ("qudrati-mark.svg", None),
    "markcoins": ("qudrati-mark.svg", None),
    "markdark":  ("qudrati-mark.svg", None),
    # the same, refined (heavier, outer corners rounded) and rounded (every corner soft, round dots)
    "markref":        ("qudrati-mark-refined.svg", None),
    "markrefplain":   ("qudrati-mark-refined.svg", None),
    "markround":      ("qudrati-mark-round.svg", None),
    "markroundplain": ("qudrati-mark-round.svg", None),
    # 2026-10-29, round 3: three more fonts, each dot drawn as a small coin so the idea reads at a glance
    "alexandria": ("Alexandria.ttf",     {"wght": 900}, {"dots": "coin"}),
    "kufi":       ("NotoKufiArabic.ttf", {"wght": 900}, {"dots": "coin"}),
    "almarai":    ("Almarai.ttf",        {"wght": 800}, {"dots": "coin"}),
    # 2026-10-29, round 4 («3 versions better than all the previous»): ink and gold, the green that becomes the
    # start button, and the exam's answer sheet whose bubbles are the dots
    "gold":       ("Cairo.ttf",          {"wght": 1000}),
    "green":      ("Zain-Black.ttf",     {}, {"lift": .07, "gap": .07}),
    "sheet":      ("Beiruti.ttf",        {"wght": 900}, {"dots": "coin", "grow": .82, "spread": 1.16, "lift": .075}),
    # 2026-10-29, round 6 («change the colours of the dots … 5 versions»): markmono's name and motion, the dots coloured
    "dotsunset":  ("qudrati-mark.svg", None),
    "dotduo":     ("qudrati-mark.svg", None),
    "dotjewel":   ("qudrati-mark.svg", None),
    "dotshift":   ("qudrati-mark.svg", None),
    "dotmint":    ("qudrati-mark.svg", None),
}


def from_svg(path):
    """the wordmark drawn as paths already: its letters, then its six dots"""
    text = path.read_text(encoding="utf-8")
    body = re.search(r'data-part="body"[^>]*\sd="([^"]+)"', text).group(1)
    dots = []
    for d in re.findall(r'data-part="dot"[^>]*\sd="([^"]+)"', text):
        x, y, w = (float(v) for v in re.match(r"M(-?[\d.]+) (-?[\d.]+)h(-?[\d.]+)", d).groups())
        dots.append({"cx": x + w / 2, "cy": y + w / 2, "d": d, "b": (x, y, x + w, y + w)})
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', text).group(1).split()]
    return body, dots, (vb[0], vb[1], vb[0] + vb[2], vb[1] + vb[3])


def signed_area(cmds):
    pts = [p for _, args in cmds for p in args if isinstance(p, tuple)]
    return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1])) / 2


def draw(font_path, axes):
    font = TTFont(font_path)
    if "fvar" in font:
        have = {a.axisTag for a in font["fvar"].axes}
        font = instantiateVariableFont(font, {k: v for k, v in axes.items() if k in have})
    upm = font["head"].unitsPerEm
    gs = font.getGlyphSet()
    order = font.getGlyphOrder()
    # shape with HarfBuzz at the same instance
    blob = hb.Blob.from_file_path(str(font_path))
    hbf = hb.Font(hb.Face(blob))
    hbf.set_variations({k: float(v) for k, v in axes.items()})
    buf = hb.Buffer()
    buf.add_str(WORD)
    buf.guess_segment_properties()
    hb.shape(hbf, buf, {"kern": True, "liga": True})
    pen_x = 0
    body = DecomposingRecordingPen(gs)
    dots = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        dx, dy = pen_x + pos.x_offset, pos.y_offset
        pen_x += pos.x_advance
        raw = DecomposingRecordingPen(gs)
        gs[name].draw(raw)
        placed = DecomposingRecordingPen(gs)
        raw.replay(TransformPen(placed, (1, 0, 0, -1, dx, -dy)))
        contours, cur = [], []
        for op, args in placed.value:
            cur.append((op, args))
            if op in ("closePath", "endPath"):
                contours.append(cur)
                cur = []
        if not contours:
            continue
        outer = max(contours, key=lambda c: abs(signed_area(c)))
        # a glyph that is only dots (a mark the font places over its letter) has no body to keep out
        if abs(signed_area(outer)) < 0.06 * upm * upm:
            outer = None
        sign = 1 if signed_area(outer if outer else contours[0]) > 0 else -1
        for c in contours:
            bp = BoundsPen(None)
            for op, args in c:
                getattr(bp, op)(*args)
            x0, y0, x1, y1 = bp.bounds
            area = signed_area(c)
            w, h = x1 - x0, y1 - y0
            small = (abs(area) < 0.06 * upm * upm and max(w, h) < 0.34 * upm
                     and min(w, h) > 0.07 * upm and max(w, h) / min(w, h) < 2.6
                     and (y1 < -0.3 * upm or y0 > 0.12 * upm))          # above the letters or under the line, never on it
            if small and (area > 0) == (sign > 0) and c is not outer:
                sp = SVGPathPen(None)
                for op, args in c:
                    getattr(sp, op)(*args)
                dots.append({"cx": (x0 + x1) / 2, "cy": (y0 + y1) / 2, "d": sp.getCommands(), "b": (x0, y0, x1, y1)})
            else:
                for op, args in c:
                    getattr(body, op)(*args)
    bp = BoundsPen(None)
    body.replay(bp)
    xs = [bp.bounds] + [d["b"] for d in dots]
    box = (min(b[0] for b in xs), min(b[1] for b in xs), max(b[2] for b in xs), max(b[3] for b in xs))
    sp = SVGPathPen(None)
    body.replay(sp)
    dots.sort(key=lambda d: -d["cx"])     # the wave runs the way the word reads, right to left
    # ي's pair is the one under the line; above it, ق's and ت's sit apart at the widest gap
    above = [d for d in dots if d["b"][3] < 0]
    cut = max(range(1, len(above)), key=lambda i: above[i - 1]["cx"] - above[i]["cx"]) if len(above) > 1 else 1
    for i, d in enumerate(above):
        d["coin"] = COINS[0] if i < cut else COINS[1]
    for d in dots:
        d.setdefault("coin", COINS[2])
    return sp.getCommands(), dots, box, upm


def shift_path(d, dx, dy):
    """the same absolute path (as SVGPathPen writes it) moved by dx, dy"""
    out, cmd, i = [], "", 0
    for tok in re.findall(r"[MLQCTSHVZ]|-?[\d.]+", d):
        if tok.isalpha():
            cmd, i = tok, 0
            out.append(tok)
            continue
        v = float(tok)
        if cmd == "H": v += dx
        elif cmd == "V": v += dy
        else: v += dx if i % 2 == 0 else dy
        i += 1
        out.append(f"{v:g}" if out[-1].isalpha() else f" {v:g}")
    return "".join(out)


def svg_for(font_path, axes, opts=None):
    opts = opts or {}
    if axes is None:
        body, dots, (x0, y0, x1, y1) = from_svg(font_path)
        upm = 1000
        mid = (y0 + y1) / 2                   # the traced mark has no baseline: ي's pair is the lowest
        for d in dots:
            d["b"] = (d["b"][0], d["b"][1] - mid, d["b"][2], d["b"][3] - mid)
        dots.sort(key=lambda d: -d["cx"])
        above = [d for d in dots if d["b"][3] < 0]
        cut = max(range(1, len(above)), key=lambda i: above[i - 1]["cx"] - above[i]["cx"])
        for i, d in enumerate(above):
            d["coin"] = COINS[0] if i < cut else COINS[1]
        for d in dots:
            d.setdefault("coin", COINS[2])
        rule = ' fill-rule="evenodd"'
    else:
        body, dots, (x0, y0, x1, y1), upm = draw(font_path, axes)
        rule = ""
    lift = opts.get("lift", 0) * upm
    if lift:
        # a font that sets its dots almost on the letter: lift those above the line, and lower those under it, clear of it
        for d in dots:
            dy = -lift if d["b"][3] < 0 else lift * .6
            d["d"], d["cy"] = shift_path(d["d"], 0, dy), d["cy"] + dy
            d["b"] = (d["b"][0], d["b"][1] + dy, d["b"][2], d["b"][3] + dy)
        y0, y1 = min(y0, min(d["b"][1] for d in dots)), max(y1, max(d["b"][3] for d in dots))
    gap = opts.get("gap", 0) * upm
    if gap and opts.get("dots") != "coin":
        # a font whose pairs nearly touch: open each pair to at least this gap between its two dots
        for c in "gob":
            pair = sorted((d for d in dots if d["coin"] == c), key=lambda d: d["cx"])
            if len(pair) != 2:
                continue
            a, b = pair
            want = (a["b"][2] - a["b"][0] + b["b"][2] - b["b"][0]) / 2 + gap
            push = max(0, want - (b["cx"] - a["cx"])) / 2
            for d, dx in ((a, -push), (b, push)):
                d["d"], d["cx"] = shift_path(d["d"], dx, 0), d["cx"] + dx
                d["b"] = (d["b"][0] + dx, d["b"][1], d["b"][2] + dx, d["b"][3])
        x0, x1 = min(x0, min(d["b"][0] for d in dots)), max(x1, max(d["b"][2] for d in dots))
    per = {c: sum(1 for d in dots if d["coin"] == c) for c in "gob"}
    if any(n == 0 for n in per.values()):
        sys.exit(f"{font_path.name}: dots per letter {per}")
    coin_r = None
    if opts.get("dots") == "coin":
        # each dot drawn as a small coin: as big as the pair allows without touching
        size = max(max(d["b"][2] - d["b"][0], d["b"][3] - d["b"][1]) for d in dots)
        gap = min(abs(a["cx"] - b["cx"]) for a in dots for b in dots if a is not b and a["coin"] == b["coin"])
        coin_r = min(size * opts.get("grow", .66), gap / 2 - 0.03 * upm)
        if opts.get("spread"):
            # each pair set apart round its middle, so the coins can be as big as asked
            coin_r = size * opts.get("grow", .66)
            for c in "gob":
                pair = [d for d in dots if d["coin"] == c]
                mid = sum(d["cx"] for d in pair) / len(pair)
                for d, side in zip(sorted(pair, key=lambda d: -d["cx"]), (1, -1)):
                    d["cx"] = mid + side * coin_r * opts["spread"]
            x0, x1 = min(x0, min(d["cx"] - coin_r for d in dots)), max(x1, max(d["cx"] + coin_r for d in dots))
            y0, y1 = min(y0, min(d["cy"] - coin_r for d in dots)), max(y1, max(d["cy"] + coin_r for d in dots))
    pad = round(0.06 * upm)
    vb = f"{x0 - pad:.0f} {y0 - pad:.0f} {x1 - x0 + 2 * pad:.0f} {y1 - y0 + 2 * pad:.0f}"
    # a marker's stroke across the word, under it, for a look that shows one (.qs-u)
    hx0, hx1, hy0, hy1 = x0 - 0.04 * upm, x1 + 0.04 * upm, -0.34 * upm, 0.06 * upm
    mark = (f"M{hx0:.0f} {hy0 + 20:.0f}Q{(hx0 + hx1) / 2:.0f} {hy0 - 30:.0f} {hx1:.0f} {hy0:.0f}"
            f"L{hx1 - 20:.0f} {hy1:.0f}Q{(hx0 + hx1) / 2:.0f} {hy1 + 30:.0f} {hx0 + 14:.0f} {hy1 + 8:.0f}Z")
    out = [f'<svg class="qs-word" viewBox="{vb}" aria-hidden="true">', f'<path class="qs-u" d="{mark}"/>',
           f'<path class="qs-x"{rule} d="{body}"/>', f'<path class="qs-l"{rule} d="{body}"/>']
    for i, d in enumerate(dots):
        if coin_r:
            cx, cy, rr = d["cx"], d["cy"], coin_r
            out.append(f'<g class="qs-d qs-{d["coin"]}" style="--i:{i}"><circle class="qs-lip" cx="{cx:.0f}" cy="{cy:.0f}" r="{rr:.0f}"/>'
                       f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{rr:.0f}"/>'
                       f'<circle class="qs-ring" cx="{cx:.0f}" cy="{cy:.0f}" r="{rr * .64:.0f}" stroke-width="{rr * .2:.0f}"/></g>')
        else:
            out.append(f'<g class="qs-d qs-{d["coin"]}" style="--i:{i}"><path class="qs-lip" d="{d["d"]}"/><path d="{d["d"]}"/></g>')
    out.append("</svg>")
    return "\n".join(out), per


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fonts", default=str(LOOKS_DIR / "fonts"))
    ap.add_argument("--ship")
    a = ap.parse_args()
    fonts = Path(a.fonts)
    built = {}
    for look, (fname, axes, *more) in LOOKS.items():
        opts = more[0] if more else {}
        path = (ROOT / "assets" / "fonts" / fname if fname == "baloo-bhaijaan-2.ttf"
                else LOOKS_DIR / fname if fname.endswith(".svg") else fonts / fname)
        css_path = LOOKS_DIR / f"{look}.css"
        if not path.exists() or not css_path.exists():
            print(f"{look}: skipped ({'no font ' + fname if not path.exists() else 'no ' + css_path.name})")
            continue
        svg, per = svg_for(path, axes, opts)
        css = css_path.read_text(encoding="utf-8").strip()
        built[look] = (css, svg)
        (LOOKS_DIR / f"{look}.html").write_text(f"<style>\n{css}\n</style>\n<div class=\"qs-bg\"></div>\n{svg}\n", encoding="utf-8", newline="")
        print(f"{look}: {fname}, dots {per}")
    if a.ship:
        if a.ship not in built:
            sys.exit(f"cannot ship {a.ship}")
        css, svg = built[a.ship]
        page = PAGE.read_text(encoding="utf-8")
        for start, end, text in (("/* splash-css:start */", "/* splash-css:end */", css),
                                 ("<!-- splash-word:start -->", "<!-- splash-word:end -->", '<div class="qs-bg"></div>\n' + svg)):
            if start not in page:
                sys.exit(f"index.html has no {start}")
            page = re.sub(re.escape(start) + r".*?" + re.escape(end), lambda m: f"{start}\n{text}\n{end}", page, flags=re.S)
        PAGE.write_text(page, encoding="utf-8", newline="")
        print(f"index.html: {a.ship}")


if __name__ == "__main__":
    main()
