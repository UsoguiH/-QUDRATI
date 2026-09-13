# -*- coding: utf-8 -*-
"""Tiny SVG figures for the teaching cards in js/data/teach.js, keyed
"<lessonKey>:<rule n>". Same house style as tools/curriculum_figures.py:
grey 2px strokes, fill none, Arabic labels, explicit width, nothing outside
the viewBox, no CSS classes and no external fonts.

Every figure draws the numbers of its own rule's `example` -- five dots for
five people, six posts for the 100-metre road, sixteen dots for 1+3+5+7 --
so a student who cannot read the sentence can still count the picture.
Rules that are pure arithmetic carry no figure.
"""

import math

STYLE = 'stroke="#4B4B4B" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"'
TXT = 'font-size="13" font-weight="700" stroke="none" fill="#4B4B4B" text-anchor="middle"'
GREY = "#CFCFCF"
GUIDE = ' stroke-width="1.5"'
DASH = ' stroke-dasharray="4 3" stroke-width="1.5"'


def n(v):
    """1.0 -> 1 , 193.72 -> 193.7"""
    return ("%.1f" % float(v)).rstrip("0").rstrip(".")


def svg(w, h, body):
    return '<svg viewBox="0 0 %d %d" width="%d" %s>%s</svg>' % (w, h, w, STYLE, body)


def t(x, y, s, size=None):
    attrs = TXT if size is None else TXT.replace('font-size="13"', 'font-size="%s"' % size)
    return '<text x="%s" y="%s" %s>%s</text>' % (n(x), n(y), attrs, s)


def line(x1, y1, x2, y2, extra=""):
    return '<line x1="%s" y1="%s" x2="%s" y2="%s"%s/>' % (n(x1), n(y1), n(x2), n(y2), extra)


def dot(x, y, r=4.5):
    return '<circle cx="%s" cy="%s" r="%s" fill="#4B4B4B" stroke="none"/>' % (n(x), n(y), n(r))


def ring(x, y, r=6):
    return '<circle cx="%s" cy="%s" r="%s" fill="#FFFFFF"/>' % (n(x), n(y), n(r))


def rect(x, y, w, h, extra=""):
    return '<rect x="%s" y="%s" width="%s" height="%s"%s/>' % (n(x), n(y), n(w), n(h), extra)


def head(x, y, dx, dy, s=8, deg=26):
    """the two short strokes of an arrowhead sitting at (x,y), arriving along (dx,dy)"""
    L = math.hypot(dx, dy)
    bx, by = -dx / L * s, -dy / L * s
    a = math.radians(deg)
    c, si = math.cos(a), math.sin(a)
    return '<path d="M%s %s L%s %s L%s %s"/>' % (
        n(x + bx * c - by * si), n(y + bx * si + by * c), n(x), n(y),
        n(x + bx * c + by * si), n(y - bx * si + by * c))


def arrow(p, q, trim=8):
    dx, dy = q[0] - p[0], q[1] - p[1]
    L = math.hypot(dx, dy)
    ux, uy = dx / L, dy / L
    return (line(p[0] + ux * trim, p[1] + uy * trim, q[0] - ux * trim, q[1] - uy * trim)
            + head(q[0] - ux * trim, q[1] - uy * trim, ux, uy))


# four people on a square, shared by the handshake and the gift figures
QUAD = [(150 + 46 * math.sin(math.radians(90 * k + 45)), 60 - 46 * math.cos(math.radians(90 * k + 45)))
        for k in range(4)]


def shirt(cx, y):
    """a 28 x 24 t-shirt, collar and all, whose body is centred on cx"""
    x = cx - 14
    return ('<path d="M%s %s h16 l6 6 l-4 5 l-2 -2 v15 h-16 v-15 l-2 2 l-4 -5 z"/>'
            '<path d="M%s %s q4 5 8 0"/>' % (n(x + 6), n(y), n(x + 10), n(y)))


def pants(x, y):
    """a 26 x 26 pair of trousers, waistband included, left edge on x"""
    return ('<path d="M%s %s h26 v26 h-10 v-16 h-6 v16 h-10 z"/>'
            '<path d="M%s %s h26"/>' % (n(x), n(y), n(x), n(y + 5)))


def clock_ticks(cx, cy, r_in, r_out):
    return "".join(line(cx + r_in * math.sin(math.radians(30 * k)),
                        cy - r_in * math.cos(math.radians(30 * k)),
                        cx + r_out * math.sin(math.radians(30 * k)),
                        cy - r_out * math.cos(math.radians(30 * k)), GUIDE)
                   for k in range(12))


def polar(cx, cy, r, deg):
    a = math.radians(deg)
    return (cx + r * math.sin(a), cy - r * math.cos(a))


TEACH_FIGURES = {

    # ------------------------------------------------------------------ bigsum
    # rule 3 -- the two pairs that make 100 joined by an arc each, 90+10 above
    # and 45+55 below, so the round hundreds are seen and not looked for
    "skills.bigsum:3": svg(300, 112,
        t(262, 60, "٩٠") + t(232, 60, "+") + t(202, 60, "٤٥") + t(172, 60, "+")
        + t(142, 60, "١٠") + t(112, 60, "+") + t(82, 60, "٥٥") + t(52, 60, "=")
        + t(22, 60, "٢٠٠")
        + '<path d="M262 46 Q202 14 142 46"/>'
        + '<path d="M202 72 Q142 104 82 72"/>'
        + t(202, 27, "١٠٠", 12) + t(142, 101, "١٠٠", 12)),

    # rule 5 -- 1..10 in a row, the ends paired inwards: five arcs, each pair 11
    "skills.bigsum:5": svg(300, 126,
        "".join(t(268 - 26 * i, 96, s) for i, s in enumerate(
            ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "١٠"]))
        + "".join('<path d="M%d 80 Q151 %d %d 80"/>'
                  % (268 - 26 * k, 2 * (22 + 12 * k) - 80, 34 + 26 * k) for k in range(5))
        + t(151, 17, "١١", 11)
        + t(150, 120, "٥ أزواج × ١١ = ٥٥", 12)),

    # rule 7 -- 1+3+5+7 as the four L-shaped shells of a 4 x 4 square of dots;
    # the shells alternate filled and hollow so 1, 3, 5 and 7 can be counted
    "skills.bigsum:7": svg(210, 122,
        t(190, 22, "١") + t(166, 22, "٣") + t(142, 22, "٥") + t(118, 22, "٧")
        + '<path d="M178 26 V46 H104"%s/>' % DASH
        + '<path d="M154 26 V70 H104"%s/>' % DASH
        + '<path d="M130 26 V94 H104"%s/>' % DASH
        + "".join((dot if max(r, c) % 2 == 0 else ring)(190 - 24 * c, 34 + 24 * r, 5)
                  for r in range(4) for c in range(4))
        + t(52, 76, "٤ × ٤ = ١٦")),

    # rule 13 -- both products as areas over the same 20 x 30 block: the first
    # gains a strip 30 long, the second a strip only 20 long
    "skills.bigsum:13": svg(240, 130,
        rect(140, 30, 9, 60, ' fill="%s"' % GREY) + rect(149, 30, 40, 60)
        + rect(50, 21, 40, 9, ' fill="%s"' % GREY) + rect(50, 30, 40, 60)
        + t(144, 25, "٣٠", 11) + t(70, 16, "٢٠", 11)
        + t(169, 64, "٢٠×٣٠", 10) + t(70, 64, "٢٠×٣٠", 10)
        + t(164, 108, "٢١ × ٣٠") + t(70, 108, "٢٠ × ٣١")
        + t(115, 64, "مقابل", 12)
        + t(120, 125, "الزيادة ٣٠ أكبر ← الأول أكبر", 11)),

    # ----------------------------------------------------------------- keylaws
    # rule 1 -- «بين ٤ و ١٠»: the ends are hollow, only the five inside count
    "skills.keylaws:1": svg(300, 100,
        line(16, 60, 284, 60) + head(284, 60, 1, 0) + head(16, 60, -1, 0)
        + '<path d="M94 40 V32 H202 V40"/>'
        + ring(40, 60) + ring(256, 60)
        + "".join(dot(40 + 54 * i, 60, 5) for i in range(1, 4))
        + "".join(t(40 + 54 * i, 86, s) for i, s in enumerate(
            ["٣", "٤", "٥", "٦", "٧"]))
        + t(148, 24, "٣ أعداد", 12)),

    # rule 2 -- «من ٤ إلى ١٠»: the same line, both ends filled, seven counted
    "skills.keylaws:2": svg(300, 100,
        line(16, 60, 284, 60) + head(284, 60, 1, 0) + head(16, 60, -1, 0)
        + '<path d="M40 40 V32 H256 V40"/>'
        + "".join(dot(40 + 54 * i, 60, 5) for i in range(5))
        + "".join(t(40 + 54 * i, 86, s) for i, s in enumerate(
            ["٣", "٤", "٥", "٦", "٧"]))
        + t(148, 24, "٥ أعداد", 12)),

    # rule 9 -- four people, every pair joined once: six lines to count
    "skills.keylaws:9": svg(230, 112,
        "".join(line(*(QUAD[i] + QUAD[j])) for i in range(4) for j in range(i + 1, 4))
        + "".join(dot(p[0], p[1]) for p in QUAD)
        + t(52, 54, "٤ أشخاص", 12) + t(52, 78, "٦ مصافحات", 12)),

    # rule 8 -- the same four people, but a gift is directed: one person alone
    # sends three, and every one of the four does the same -> 12
    "skills.keylaws:8": svg(230, 112,
        "".join(arrow(QUAD[0], QUAD[k]) for k in range(1, 4))
        + "".join(dot(p[0], p[1]) for p in QUAD)
        + t(52, 54, "كل شخص يعطي ٣", 11) + t(52, 78, "٤ × ٣ = ١٢ هدية", 11)),

    # rule 12 -- three lines leaving one vertex; the triangles they cut are
    # the three pairs of lines: the two small ones and the big one
    "skills.keylaws:12": svg(260, 126,
        line(25, 96, 235, 96)
        + "".join(line(130, 20, x, 96) for x in (25, 130, 235))
        + dot(130, 20) + "".join(dot(x, 96, 3.5) for x in (25, 130, 235))
        + t(130, 118, "٣ خطوط ← ٣ مثلثات", 12)),

    # rule 14 -- 100 m of road, a mark every 20 m: five gaps but six posts,
    # and the ringed ١ at the start is the «+ ١» everybody forgets
    "skills.keylaws:14": svg(300, 126,
        line(16, 70, 284, 70)
        + "".join(line(270 - 48 * i, 70, 270 - 48 * i, 52) for i in range(6))
        + "".join(t(270 - 48 * i, 44, s, 12) for i, s in enumerate(
            ["١", "٢", "٣", "٤", "٥", "٦"]))
        + '<circle cx="270" cy="40" r="11"%s/>' % GUIDE
        + "".join(t(x, 88, "٢٠ م", 11) for x in (246, 198, 150, 102, 54))
        + '<path d="M270 96 V104 M30 96 V104 M270 100 H30"%s/>' % GUIDE
        + t(150, 120, "١٠٠ متر", 12)),

    # rule 13 -- the tank cut into 6 parts: tap أ lays 2 parts an hour, tap ب
    # lays 1, so each hour covers 3 parts and two hours fill it
    "skills.keylaws:13": svg(280, 126,
        rect(62, 48, 156, 44)
        + "".join(line(x, 48, x, 92) for x in (88, 114, 140, 166, 192))
        + "".join(t(x, 76, ch, 12) for x, ch in (
            (205, "أ"), (179, "أ"), (153, "ب"), (127, "أ"), (101, "أ"), (75, "ب")))
        + line(179, 28, 179, 44) + head(179, 46, 0, 1)
        + line(75, 28, 75, 44) + head(75, 46, 0, 1)
        + t(179, 22, "أ تملأ في ٣ ساعات", 11) + t(75, 22, "ب تملأ في ٦ ساعات", 11)
        + '<path d="M218 96 V102 H140 V96"%s/>' % GUIDE
        + '<path d="M140 96 V102 H62 V96"%s/>' % GUIDE
        + t(179, 116, "الساعة الأولى", 11) + t(101, 116, "الساعة الثانية", 11)),

    # rule 16 -- 3:20 drawn true: the hour hand a third past ٣, the minute hand
    # on ٤, and the thin wedge between them shaded
    "skills.keylaws:16": svg(230, 118,
        '<circle cx="120" cy="58" r="50"/>'
        + clock_ticks(120, 58, 44, 50)
        + '<path d="M120 58 L%s %s A26 26 0 0 1 %s %s Z" fill="%s" stroke="none"/>' % (
            n(polar(120, 58, 26, 100)[0]), n(polar(120, 58, 26, 100)[1]),
            n(polar(120, 58, 26, 120)[0]), n(polar(120, 58, 26, 120)[1]), GREY)
        + t(120, 24, "١٢", 11) + t(158, 62, "٣", 11) + t(120, 100, "٦", 11) + t(82, 62, "٩", 11)
        + line(120, 58, *polar(120, 58, 28, 100))
        + line(120, 58, *polar(120, 58, 44, 120))
        + dot(120, 58, 3)
        + line(166, 76, 146, 68, GUIDE)
        + t(182, 80, "٢٠°", 12)
        + t(36, 62, "الساعة ٣:٢٠", 12)),

    # --------------------------------------------------------------- probstats
    # rule 3 -- eight cards, the four even ones shaded: the fraction is a
    # picture before it is a division
    "skills.probstats:3": svg(292, 104,
        "".join(rect(244 - 32 * i, 30, 28, 38,
                     ' rx="4" fill="%s"' % GREY if (i + 1) % 2 == 0 else ' rx="4"')
                for i in range(8))
        + "".join(t(258 - 32 * i, 54, s) for i, s in enumerate(
            ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨"]))
        + t(146, 96, "٤ زوجية من ٨ ← ٤/٨ = ١/٢", 12)),

    # rule 7 -- three shirts across, two trousers down, one dot per outfit: six
    "skills.probstats:7": svg(260, 130,
        shirt(200, 6) + shirt(150, 6) + shirt(100, 6)
        + pants(228, 42) + pants(228, 76)
        + rect(76, 38, 148, 68, GUIDE)
        + line(125.3, 38, 125.3, 106, GUIDE) + line(174.7, 38, 174.7, 106, GUIDE)
        + line(76, 72, 224, 72, GUIDE)
        + "".join(dot(cx, cy, 5) for cy in (55, 89) for cx in (199.7, 150, 100.3))
        + t(150, 126, "٣ × ٢ = ٦ إطلالات", 12)),

    # rule 11 -- 9,2,5 sorted into a staircase; the middle bar is the median,
    # which is only in the middle after the sorting
    "skills.probstats:11": svg(250, 120,
        t(210, 32, "قبل الترتيب", 11) + t(210, 54, "٩ ، ٢ ، ٥", 12)
        + line(182, 48, 160, 48) + head(160, 48, -1, 0)
        + line(36, 96, 158, 96)
        + rect(124, 82, 26, 14) + rect(84, 61, 26, 35, ' fill="%s"' % GREY)
        + rect(44, 33, 26, 63)
        + t(137, 114, "٢") + t(97, 114, "٥") + t(57, 114, "٩")
        + t(107, 52, "الوسيط ٥", 11)),

    # rule 13 -- 4,9,2,11 as bars; the range is the measured gap between the
    # top of the shortest and the top of the tallest
    "skills.probstats:13": svg(250, 120,
        line(78, 96, 234, 96)
        + rect(200, 68, 26, 28) + rect(162, 33, 26, 63)
        + rect(124, 82, 26, 14) + rect(86, 19, 26, 77)
        + t(213, 114, "٤") + t(175, 114, "٩") + t(137, 114, "٢") + t(99, 114, "١١")
        + line(86, 19, 56, 19, DASH) + line(124, 82, 56, 82, DASH)
        + line(68, 19, 68, 82) + head(68, 19, 0, -1) + head(68, 82, 0, 1)
        + t(34, 54, "المدى ٩", 11)),
}


def write_js(path):
    """emit js/data/teach-figures.js: one JSON string per figure, keyed like the cards"""
    import io, json, os
    lines = ['/* Mini figures for the teaching cards, keyed "domain.lesson:rule n".',
             '   Generated from tools/teach_figures.py — do not hand-edit. */',
             'window.QTEACH_FIG = window.QTEACH_FIG || {};',
             'Object.assign(window.QTEACH_FIG, {']
    keys = list(TEACH_FIGURES.keys())
    for i, k in enumerate(keys):
        lines.append('  %s: %s%s' % (json.dumps(k, ensure_ascii=False),
                                     json.dumps(TEACH_FIGURES[k], ensure_ascii=False),
                                     "," if i < len(keys) - 1 else ""))
    lines.append('});')
    io.open(path, "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")
    print("wrote %s (%d figures)" % (os.path.relpath(path), len(keys)))


if __name__ == "__main__":
    import os
    write_js(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "js", "data", "teach-figures.js"))
