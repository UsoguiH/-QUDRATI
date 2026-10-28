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
        + t(146, 96, "٤ زوجية من ٨ — نص البطاقات", 12)),

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
    # ---- the geometry lessons -------------------------------------------
    # from frag_angles_triangle.py
        # ------------------------------------------------------------------ angles
        # rule 15 -- the side is extended so the exterior angle has somewhere to
        # come from: 55 and 45 sit on the triangle, 100 opens outside the vertex
        "geometry.angles:15": svg(260, 124,
            line(40, 94, 220, 94) + head(40, 94, -1, 0)
            + line(150, 94, 164, 14) + line(164, 14, 220, 94)
            + '<path d="M160.2 35.7 a22 22 0 0 0 16.4 -3.7"/>'
            + '<path d="M194 94 a26 26 0 0 1 11.1 -21.3"/>'
            + '<path d="M118 94 a32 32 0 0 1 37.5 -31.5"/>'
            + dot(150, 94, 4)
            + t(173.5, 57, "٤٥°", 11) + t(184.5, 75.5, "٥٥°", 11)
            + t(119.1, 57.2, "١٠٠°")
            + t(130, 118, "٥٥ + ٤٥ = ١٠٠ ← الخارجية", 11)),

        # rule 23 -- the nine-sided polygon fanned from one vertex: the seven
        # triangles are there to be counted, and 9 - 2 is why there are seven
        "geometry.angles:23": svg(260, 124,
            '<polygon points="139,56 149.8,26.4 177,10.7 208,16.2 228.2,40.3'
            ' 228.2,71.7 208,95.8 177,101.3 149.8,85.6"/>'
            + line(139, 56, 177, 10.7, GUIDE) + line(139, 56, 208, 16.2, GUIDE)
            + line(139, 56, 228.2, 40.3, GUIDE) + line(139, 56, 228.2, 71.7, GUIDE)
            + line(139, 56, 208, 95.8, GUIDE) + line(139, 56, 177, 101.3, GUIDE)
            + dot(139, 56, 4)
            + t(72, 60, "٩ أضلاع", 12)
            + t(130, 118, "٧ مثلثات × ١٨٠ = ١٢٦٠°", 11)),

        # rule 8 -- one arc, two angles: the centre sees it as 80 (the shaded
        # sector), the point on the circle sees the same arc as half of that
        "geometry.angles:8": svg(260, 124,
            '<path d="M150 56 L114.8 26.4 a46 46 0 0 0 0 59.2 Z" fill="%s" stroke="none"/>' % GREY
            + '<circle cx="150" cy="56" r="46"/>'
            + line(150, 56, 114.8, 26.4) + line(150, 56, 114.8, 85.6)
            + line(196, 56, 114.8, 26.4) + line(196, 56, 114.8, 85.6)
            + '<path d="M182.9 60.8 a14 14 0 0 1 0 -9.6"/>'
            + dot(114.8, 26.4, 3.5) + dot(114.8, 85.6, 3.5)
            + dot(196, 56, 4) + dot(150, 56, 3)
            + t(122, 60, "٨٠°") + t(166, 60, "٤٠°", 11)
            + t(52, 60, "على القوس نفسه", 11)
            + t(130, 118, "٨٠ ÷ ٢ = ٤٠°", 12)),

        # rule 18 -- the four corners sit on the circle: the 105 and the 75 face
        # each other across it, while the corner next door stays a question mark
        "geometry.angles:18": svg(260, 126,
            '<circle cx="155" cy="54" r="48"/>'
            + '<polygon points="188.9,87.9 127.5,93.3 127.5,14.7 198.5,33.7"/>'
            + '<path d="M167 89.9 a22 22 0 0 1 25.8 -23.6"/>'
            + '<path d="M127.5 36.7 a22 22 0 0 0 21.2 -16.3"/>'
            + '<path d="M127.5 77.3 a16 16 0 0 1 15.9 14.6"/>'
            + dot(188.9, 87.9, 3.5) + dot(127.5, 93.3, 3.5)
            + dot(127.5, 14.7, 3.5) + dot(198.5, 33.7, 3.5)
            + t(168.7, 65.8, "١٠٥°", 12) + t(145.7, 38.5, "٧٥°", 12)
            + t(143.7, 75.6, "؟", 12)
            + t(56, 58, "رباعي دائري", 12)
            + t(130, 120, "١٨٠ − ١٠٥ = ٧٥°", 12)),

        # rule 12 -- the bisector cut the base into 8 and 6, each part lying under
        # the side it belongs to: 12 over the 8, 9 over the 6, the two arcs equal
        "geometry.angles:12": svg(240, 102,
            line(132, 76, 216, 76) + line(132, 76, 160.5, 30.1)
            + line(160.5, 30.1, 216, 76) + line(160.5, 30.1, 168, 76)
            + '<path d="M166.3 51.4 a22 22 0 0 0 11.2 -7.3"/>'
            + '<path d="M148.9 48.8 a22 22 0 0 0 12.9 3.3"/>'
            + dot(168, 76, 4)
            + t(197.2, 42.3, "١٢", 12) + t(134.3, 45.6, "٩", 12)
            + t(192, 91, "٨", 12) + t(150, 91, "٦", 12)
            + t(60, 54, "٦ ÷ ٨ = ٩ ÷ ١٢", 12)),

        # ---------------------------------------------------------------- triangle
        # rule 1 -- the 3 and the 4 laid end to end over the 8: the dashed drop
        # shows where they stop, and the shaded strip is the piece they never reach
        "geometry.triangle:1": svg(250, 126,
            rect(44, 70, 22, 12, ' fill="%s"' % GREY)
            + line(44, 76, 220, 76) + line(44, 70, 44, 82) + line(220, 70, 220, 82)
            + line(66, 44, 220, 44) + line(66, 38, 66, 50) + line(220, 38, 220, 50)
            + dot(154, 44, 4.5)
            + line(220, 50, 220, 70, DASH) + line(66, 50, 66, 70, DASH)
            + t(187, 32, "٣") + t(110, 32, "٤")
            + t(132, 98, "٨")
            + t(130, 118, "٣ + ٤ = ٧ ← لا تصلح", 12)),

        # rule 2 -- the third side on a number line: 7 - 5 and 7 + 5 are hollow
        # because they are forbidden, and the nine whole numbers between are solid
        "geometry.triangle:2": svg(300, 126,
            line(16, 66, 284, 66) + head(284, 66, 1, 0) + head(16, 66, -1, 0)
            + '<path d="M62 58 L62 50 L238 50 L238 58"/>'
            + ring(40, 66) + ring(260, 66)
            + "".join(dot(62 + 22 * i, 66, 5) for i in range(9))
            + t(40, 92, "٢") + t(62, 92, "٣") + t(238, 92, "١١") + t(260, 92, "١٢")
            + t(40, 40, "٧ − ٥", 11) + t(150, 40, "الضلع الثالث", 12)
            + t(260, 40, "٧ + ٥", 11)
            + t(150, 116, "أصغره ٣ وأكبره ١١", 12)),

        # rule 4 -- the ladder: 25 leans on the wall, its foot 7 from it, and the
        # unknown is the wall side, so the square is subtracted and not added
        "geometry.triangle:4": svg(240, 126,
            line(200, 22, 200, 100) + line(146, 100, 216, 100)
            + line(179, 100, 200, 28)
            + '<path d="M190 100 L190 90 L200 90"/>'
            + t(174.1, 59.5, "٢٥", 12) + t(212, 64, "؟", 12)
            + t(189.5, 116, "٧", 12)
            + t(72, 58, "٦٢٥ − ٤٩ = ٥٧٦", 12) + t(72, 80, "الارتفاع ٢٤", 12)),

        # rule 7 -- the 16 and the 8 drawn to scale: the short side is the one
        # facing the 30, and it is visibly half the hypotenuse
        "geometry.triangle:7": svg(240, 110,
            line(120.7, 96, 190, 96) + line(190, 96, 190, 56)
            + line(190, 56, 120.7, 96)
            + '<path d="M180 96 L180 86 L190 86"/>'
            + '<path d="M136.3 87 a18 18 0 0 1 2.4 9"/>'
            + t(161.3, 85.1, "٣٠°", 11)
            + t(147.9, 63, "١٦", 12) + t(201, 78, "٨", 12)
            + t(56, 54, "المقابل لـ ٣٠", 11) + t(56, 76, "١٦ ÷ ٢ = ٨", 12)),

        # rule 19 -- both triangles stand between the same two parallels, so the
        # dashed heights are equal by construction and only 12 and 8 differ
        "geometry.triangle:19": svg(290, 122,
            '<polygon points="276,94 198,94 240,30" fill="%s"/>' % GREY
            + '<polygon points="182,94 130,94 156,30" fill="%s"/>' % GREY
            + line(118, 30, 286, 30) + line(118, 94, 286, 94)
            + line(240, 30, 240, 94, DASH) + line(156, 30, 156, 94, DASH)
            + '<path d="M240 88 L246 88 L246 94"/>'
            + '<path d="M156 88 L162 88 L162 94"/>'
            + '<path d="M186 26 L192 30 L186 34"/>'
            + '<path d="M186 90 L192 94 L186 98"/>'
            + t(237, 112, "١٢", 12) + t(156, 112, "٨", 12)
            + t(56, 52, "نسبة المساحتين", 11) + t(56, 76, "١٢ ÷ ٨ = ١٫٥", 12)),

    # from frag_rect_square.py
        # ---------------------------------------------------------------- rectangle
        # rule 3 -- half the perimeter as a bracket over two adjacent sides only:
        # the ticks say every side has a twin, so 48 folds to 24 = 15 + the unknown
        "geometry.rectangle:3": svg(296, 128,
            rect(132, 26, 120, 72)
            + '<path d="M132 26 V10 H268 V98 H252"%s/>' % GUIDE
            + dot(132, 26, 3.5) + dot(252, 98, 3.5)
            + line(186, 21, 186, 31) + line(198, 21, 198, 31)
            + line(186, 93, 186, 103) + line(198, 93, 198, 103)
            + line(127, 62, 137, 62) + line(247, 62, 257, 62)
            + t(282, 66, "٢٤", 12)
            + t(240, 66, "؟") + t(192, 118, "١٥")
            + t(64, 52, "المحيط ٤٨ ← نصفه ٢٤", 11)
            + t(64, 76, "٢٤ − ١٥ = ٩", 12)),

        # rule 4 -- the two diagonals of a 4:3 rectangle: four ticked halves of 5
        # meeting at one point, and a crossing that is plainly not a right angle
        "geometry.rectangle:4": svg(280, 124,
            rect(150, 22, 112, 84)
            + line(150, 22, 262, 106) + line(262, 22, 150, 106)
            + line(175, 47, 181, 39) + line(231, 89, 237, 81)
            + line(231, 39, 237, 47) + line(175, 81, 181, 89)
            + dot(206, 64, 3.5)
            + t(194, 40, "٥", 12) + t(218, 88, "٥", 12)
            + t(66, 52, "كل قطر ١٠ سم", 11)
            + t(66, 76, "غير متعامدين", 11)),

        # rule 5 -- the diagonal as the hypotenuse of the 9-12 right triangle the
        # rectangle already contains, drawn 12:9 so the 15 is the real length
        "geometry.rectangle:5": svg(280, 128,
            rect(140, 12, 120, 90)
            + line(140, 102, 260, 12)
            + '<path d="M250 102 V92 H260"%s/>' % GUIDE
            + t(272, 60, "٩") + t(200, 120, "١٢") + t(190, 44, "١٥")
            + t(66, 50, "٨١ + ١٤٤ = ٢٢٥", 11)
            + t(66, 76, "جذر ٢٢٥ = ١٥", 11)),

        # rule 10 -- the staircase inside the dashed 13 x 9 rectangle it fills: the
        # steps carry no length of their own, the box around them does
        "geometry.rectangle:10": svg(292, 128,
            rect(144, 10, 130, 90, DASH)
            + '<polygon points="144,10 274,10 274,32.5 241.5,32.5 241.5,55 209,55'
              ' 209,77.5 176.5,77.5 176.5,100 144,100"/>'
            + t(209, 118, "١٣", 12) + t(284, 57, "٩", 12)
            + t(66, 46, "محيطه = محيط المستطيل", 10)
            + t(66, 70, "٢ × (١٣ + ٩) = ٤٤ سم", 11)),

        # rule 11 -- the 16 x 6 rectangle with the triangle taken out of it: the
        # height is the width itself, so the two grey corners are the other half
        "geometry.rectangle:11": svg(292, 128,
            '<path d="M112 24 H192 L112 84 Z" fill="%s" stroke="none"/>' % GREY
            + '<path d="M192 24 H272 V84 Z" fill="%s" stroke="none"/>' % GREY
            + rect(112, 24, 160, 60)
            + line(112, 84, 192, 24) + line(192, 24, 272, 84)
            + line(192, 24, 192, 84, DASH)
            + '<path d="M192 74 h10 v10"%s/>' % GUIDE
            + t(140, 44, "المظلّل", 10) + t(166, 70, "٤٨", 12)
            + t(192, 102, "١٦") + t(284, 58, "٦", 12)
            + t(192, 122, "٩٦ − ٤٨ = ٤٨ سم²", 11)),

        # ------------------------------------------------------------------- square
        # rule 2 -- the square whose diagonal is 10 sitting in the 10 x 10 box its
        # diagonals cut: four triangles inside, four identical ones in the corners
        "geometry.square:2": svg(272, 116,
            rect(170, 20, 86, 86, DASH)
            + '<polygon points="213,20 256,63 213,106 170,63" fill="%s"/>' % GREY
            + line(170, 63, 256, 63, GUIDE) + line(213, 20, 213, 106, GUIDE)
            + t(213, 14, "١٠", 11) + t(226, 88, "١٠", 12)
            + t(72, 50, "١٠ × ١٠ = ١٠٠", 12)
            + t(72, 76, "١٠٠ ÷ ٢ = ٥٠ سم²", 11)),

        # rule 6 -- both diagonals drawn: the small square at the crossing says
        # perpendicular, and the corner they split shows 45 and 45, not 90
        "geometry.square:6": svg(250, 124,
            rect(130, 18, 96, 96)
            + line(130, 18, 226, 114) + line(226, 18, 130, 114)
            + '<path d="M169.5 57.5 L178 49 L186.5 57.5"%s/>' % GUIDE
            + dot(178, 66, 3.5)
            + '<path d="M200 114 A26 26 0 01 226 88"%s/>' % GUIDE
            + t(189, 101, "٤٥°", 10) + t(210, 80, "٤٥°", 10)
            + t(62, 66, "٩٠° ← ٤٥° + ٤٥°", 11)),

        # rule 8 -- the triangle on the side of the 8-square: the apex is drawn once
        # solid and once hollow, sliding along the opposite side, and nothing changes
        "geometry.square:8": svg(280, 128,
            rect(150, 14, 96, 96)
            + '<polygon points="150,110 246,110 210,14" fill="%s"/>' % GREY
            + line(168, 14, 150, 110, DASH) + line(168, 14, 246, 110, DASH)
            + line(158, 7, 238, 7, GUIDE) + head(238, 7, 1, 0) + head(158, 7, -1, 0)
            + dot(210, 14, 4) + ring(168, 14, 5)
            + t(258, 62, "٨", 12) + t(198, 124, "٨", 12)
            + t(66, 52, "٨ × ٨ = ٦٤", 12)
            + t(66, 78, "٦٤ ÷ ٢ = ٣٢ سم²", 11)),

        # rule 11 -- six squares in a row with the outside edges numbered: six along
        # the top, six under it, and one at each end -- the 2 in 2ن + 2 is countable
        "geometry.square:11": svg(290, 128,
            rect(90, 34, 180, 30)
            + "".join(line(x, 34, x, 64, GUIDE) for x in (120, 150, 180, 210, 240))
            + "".join(t(255 - 30 * i, 26, s, 11) for i, s in enumerate(
                ["١", "٢", "٣", "٤", "٥", "٦"]))
            + "".join(t(255 - 30 * i, 80, s, 11) for i, s in enumerate(
                ["١", "٢", "٣", "٤", "٥", "٦"]))
            + t(80, 53, "١", 11) + t(280, 53, "١", 11)
            + t(180, 104, "٢ × ٦ + ٢ = ١٤", 11)
            + t(180, 124, "٥٦ ÷ ١٤ = ٤ سم", 11)),

        # rule 13 -- the side goes from 10 to 15 and the grey L is everything the
        # area gained: 125 measured against 100, which is where the percent comes from
        "geometry.square:13": svg(282, 118,
            '<polygon points="176,16 266,16 266,106 236,106 236,46 176,46"'
            ' fill="%s" stroke="none"/>' % GREY
            + rect(176, 16, 90, 90) + rect(176, 46, 60, 60)
            + t(221, 10, "١٥", 11) + t(206, 60, "١٠", 11)
            + t(206, 88, "١٠٠", 12) + t(251, 33, "١٢٥", 12)
            + t(72, 52, "الزيادة ١٢٥", 11)
            + t(72, 76, "١٢٥ ÷ ١٠٠ = ١٢٥٪", 11)),

    # from frag_quads_shaded.py
        # ------------------------------------------------------------------- quads
        # rule 1 -- the rhombus of the example (diagonals 10 and 12) sitting inside
        # the dashed 12 x 10 rectangle its diagonals span: the four white corners
        # fold exactly onto the grey, so the "divide by 2" is seen and not asserted
        "geometry.quads:1": svg(262, 126,
            rect(138, 22, 96, 80, DASH)
            + '<polygon points="186,22 234,62 186,102 138,62" fill="%s" stroke="none"/>' % GREY
            + '<polygon points="186,22 234,62 186,102 138,62"/>'
            + line(138, 62, 234, 62) + line(186, 22, 186, 102)
            + '<path d="M186 52 h10 v10"%s/>' % GUIDE
            + t(186, 16, "١٢", 12) + t(246, 66, "١٠", 12)
            + arrow((132, 64), (104, 64))
            + t(62, 54, "المعين نصف", 11) + t(62, 74, "هذا المستطيل", 11)
            + t(150, 120, "١٠ × ١٢ ÷ ٢ = ٦٠", 12)),

        # rule 4 -- the rhombus with the diagonals 16 and 12 on their own extensions,
        # then the shaded quarter lifted out on the left at twice the scale: its legs
        # are the halves 8 and 6, and the rhombus side is the hypotenuse 10
        "geometry.quads:4": svg(286, 126,
            line(198, 58, 262, 58, DASH) + line(230, 34, 230, 82, DASH)
            + '<polygon points="230,58 230,34 262,58" fill="%s" stroke="none"/>' % GREY
            + '<polygon points="230,34 262,58 230,82 198,58"/>'
            + '<path d="M230 48 h10 v10"%s/>' % GUIDE
            + t(230, 26, "١٢", 12) + t(186, 62, "١٦", 12)
            + arrow((180, 72), (112, 72))
            + '<polygon points="48,88 48,58 88,88" fill="%s" stroke="none"/>' % GREY
            + '<polygon points="48,58 88,88 48,88"/>'
            + '<path d="M48 78 h10 v10"%s/>' % GUIDE
            + t(36, 76, "٦", 12) + t(68, 104, "٨", 12) + t(78, 60, "١٠", 12)
            + t(150, 118, "٦٤ + ٣٦ = ١٠٠ ← الضلع ١٠", 12)),

        # rule 7 -- base 9 and height 6: the height is the dashed perpendicular with
        # its right-angle square, drawn beside the slanted side so the two cannot be
        # confused, and the pair of chevrons says which sides are the parallel ones
        "geometry.quads:7": svg(260, 126,
            '<polygon points="108,92 198,92 238,32 148,32"/>'
            + line(148, 32, 148, 92, DASH)
            + '<path d="M148 82 h10 v10"%s/>' % GUIDE
            + '<path d="M174 87 L180 92 L174 97"/>'
            + '<path d="M194 27 L200 32 L194 37"/>'
            + t(138, 64, "٦", 12) + t(166, 84, "٩", 12)
            + t(52, 58, "الارتفاع عمودي", 11) + t(52, 78, "لا مائل", 11)
            + t(150, 118, "٩ × ٦ = ٥٤", 12)),

        # rule 10 -- the two parallel bases 11 and 7 carry matching chevrons, the
        # height 6 is the dashed perpendicular between them, and the average is
        # worked on the left: the slanted sides never enter the sum
        "geometry.quads:10": svg(254, 126,
            '<polygon points="140,92 228,92 212,44 156,44"/>'
            + line(170, 44, 170, 92, DASH)
            + '<path d="M170 82 h10 v10"%s/>' % GUIDE
            + '<path d="M188 87 L194 92 L188 97"/>'
            + '<path d="M188 39 L194 44 L188 49"/>'
            + t(160, 72, "٦", 12) + t(184, 110, "١١", 12) + t(184, 36, "٧", 12)
            + arrow((136, 68), (110, 68))
            + t(56, 56, "٧ + ١١ = ١٨", 11) + t(56, 76, "١٨ ÷ ٢ = ٩", 11)
            + t(56, 96, "٩ × ٦ = ٥٤", 11)),

        # rule 15 -- the same base 8 in both and, by the matching ticks, the same 5:
        # upright in the rectangle, leaning in the parallelogram, where the 5 is the
        # hypotenuse over a shorter height — so the rectangle wins on the same data
        "geometry.quads:15": svg(262, 126,
            rect(178, 26, 56, 35)
            + '<path d="M234 51 h-10 v10"%s/>' % GUIDE
            + line(231, 43.5, 237, 43.5, GUIDE)
            + '<polygon points="60,61 116,61 136.1,32.3 80.1,32.3"/>'
            + line(80.1, 32.3, 80.1, 61, GUIDE)
            + '<path d="M80.1 51 h10 v10"%s/>' % GUIDE
            + line(123.6, 44.9, 128.6, 48.3, GUIDE)
            + t(206, 78, "٨", 12) + t(246, 46, "٥", 12)
            + t(88, 78, "٨", 12) + t(138, 56, "٥", 12)
            + t(206, 96, "٨ × ٥ = ٤٠", 11) + t(88, 96, "أقل من ٤٠", 11)
            + t(140, 118, "الارتفاع ضلع قائمة والمائل وتر", 11)),

        # ------------------------------------------------------------------ shaded
        # rule 7 -- the hollowed square of the example: the 9-square shaded, the
        # 5-square left white inside it, and the two areas subtracted on the left
        "geometry.shaded:7": svg(250, 126,
            rect(150, 16, 81, 81, ' fill="%s" stroke="none"' % GREY)
            + rect(168, 34, 45, 45, ' fill="#FFFFFF" stroke="none"')
            + rect(150, 16, 81, 81) + rect(168, 34, 45, 45)
            + t(190, 30, "٥", 12) + t(190, 112, "٩", 12)
            + arrow((146, 86), (120, 86))
            + t(58, 44, "٩ × ٩ = ٨١", 11) + t(58, 64, "٥ × ٥ = ٢٥", 11)
            + t(58, 86, "٨١ − ٢٥ = ٥٦", 11)),

        # rule 4 -- the 12 x 8 rectangle shaded, the white triangle standing on the
        # whole base 12 with its height 5 dashed to a right-angle square: the two
        # grey pieces left over are the answer
        "geometry.shaded:4": svg(258, 112,
            rect(150, 22, 84, 56, ' fill="%s" stroke="none"' % GREY)
            + '<polygon points="150,78 234,78 192,43" fill="#FFFFFF" stroke="none"/>'
            + rect(150, 22, 84, 56)
            + '<polygon points="150,78 234,78 192,43"/>'
            + line(192, 43, 192, 78, DASH)
            + '<path d="M192 68 h10 v10"%s/>' % GUIDE
            + t(182, 68, "٥", 12) + t(192, 96, "١٢", 12) + t(246, 52, "٨", 12)
            + arrow((146, 80), (120, 80))
            + t(56, 40, "المستطيل ٩٦", 11) + t(56, 60, "المثلث الأبيض ٣٠", 11)
            + t(56, 80, "المظلل ٦٦", 11)),

        # rule 6 -- the same rectangle twice with the apex moved along the top side:
        # the height is the full side both times, so both shaded triangles are half.
        # The example carries no numbers, so neither does the drawing
        "geometry.shaded:6": svg(270, 126,
            '<polygon points="148,76 248,76 218,24" fill="%s" stroke="none"/>' % GREY
            + '<polygon points="28,76 128,76 78,24" fill="%s" stroke="none"/>' % GREY
            + rect(148, 24, 100, 52) + rect(28, 24, 100, 52)
            + '<polygon points="148,76 248,76 218,24"/>'
            + '<polygon points="28,76 128,76 78,24"/>'
            + line(218, 24, 218, 76, GUIDE) + line(78, 24, 78, 76, GUIDE)
            + '<path d="M218 66 h10 v10"%s/>' % GUIDE
            + '<path d="M78 66 h10 v10"%s/>' % GUIDE
            + dot(218, 24, 4) + dot(78, 24, 4)
            + t(198, 96, "المظلل نصف", 11) + t(78, 96, "المظلل نصف", 11)
            + t(138, 118, "موضع الرأس لا يغيّر المساحة", 11)),

        # rule 2 -- the 12-square with its midpoints ticked and the midpoint square
        # shaded; the two thin mid-lines cut the picture into eight identical
        # triangles, four of them grey, which is why the half is a half
        "geometry.shaded:2": svg(250, 126,
            '<polygon points="191,18 230,57 191,96 152,57" fill="%s" stroke="none"/>' % GREY
            + rect(152, 18, 78, 78)
            + '<polygon points="191,18 230,57 191,96 152,57"/>'
            + line(152, 57, 230, 57, GUIDE) + line(191, 18, 191, 96, GUIDE)
            + line(171.5, 15, 171.5, 21, GUIDE) + line(210.5, 15, 210.5, 21, GUIDE)
            + line(171.5, 93, 171.5, 99, GUIDE) + line(210.5, 93, 210.5, 99, GUIDE)
            + line(149, 37.5, 155, 37.5, GUIDE) + line(149, 76.5, 155, 76.5, GUIDE)
            + line(227, 37.5, 233, 37.5, GUIDE) + line(227, 76.5, 233, 76.5, GUIDE)
            + t(191, 114, "١٢", 12)
            + arrow((145, 86), (119, 86))
            + t(58, 44, "٨ مثلثات متطابقة", 11) + t(58, 64, "٤ منها مظللة", 11)
            + t(58, 86, "١٤٤ ÷ ٢ = ٧٢", 11)),

        # rule 3 -- the equilateral triangle cut by its three midlines into four
        # identical triangles, the middle one shaded: a quarter is countable here,
        # where the square of the previous rule was a half
        "geometry.shaded:3": svg(256, 114,
            '<polygon points="167,56.7 217,56.7 192,100" fill="%s" stroke="none"/>' % GREY
            + '<polygon points="192,13.4 242,100 142,100"/>'
            + line(167, 56.7, 217, 56.7) + line(167, 56.7, 192, 100)
            + line(217, 56.7, 192, 100)
            + line(167, 97, 167, 103, GUIDE) + line(217, 97, 217, 103, GUIDE)
            + line(176.9, 33.6, 182.1, 36.6, GUIDE)
            + line(151.9, 76.9, 157.1, 79.9, GUIDE)
            + line(201.9, 36.6, 207.1, 33.6, GUIDE)
            + line(226.9, 79.9, 232.1, 76.9, GUIDE)
            + t(192, 82, "١٢", 12)
            + arrow((138, 86), (112, 86))
            + t(56, 44, "٤ مثلثات متطابقة", 11) + t(56, 64, "الكبير ٤٨", 11)
            + t(56, 86, "٤٨ ÷ ٤ = ١٢", 11)),

    # from frag_circle_parallel_solids.py
        # ------------------------------------------------------------------ circle
        # rule 4 -- the triangle standing on the diameter: the square at the vertex
        # is the 90 the rule promises, and 6, 8, 10 sit on the sides that carry them
        "geometry.circle:4": svg(260, 110,
            '<circle cx="186" cy="58" r="44"/>'
            + line(142, 58, 230, 58)
            + line(142, 58, 198.32, 15.76) + line(198.32, 15.76, 230, 58)
            + '<path d="M191.12 21.16 L196.52 28.36 L203.72 22.96"/>'
            + dot(186, 58, 3.5)
            + t(162, 32, "٨") + t(223, 29, "٦") + t(186, 76, "القطر ١٠", 11)
            + arrow((138, 58), (110, 58))
            + t(60, 52, "٣٦ + ٦٤ = ١٠٠", 11) + t(60, 76, "المحيط ١٠ ط", 11)),

        # rule 5 -- the square's own diagonal is the circle's diameter: one line
        # drawn through the centre carries the 12, and the area follows from it
        "geometry.circle:5": svg(260, 106,
            '<circle cx="186" cy="52" r="42"/>'
            + rect(156.3, 22.3, 59.4, 59.4)
            + line(156.3, 22.3, 215.7, 81.7)
            + dot(186, 52, 3.5)
            + t(177.5, 64, "١٢", 11)
            + arrow((142, 52), (118, 52))
            + t(66, 44, "قطر المربع = قطر الدائرة", 10)
            + t(64, 72, "١٢ × ١٢ ÷ ٢ = ٧٢", 11)),

        # rule 8 -- the biggest circle in a square, so the side is the diameter and
        # the radius is half of it; the four grey corners are the shaded part
        "geometry.circle:8": svg(260, 118,
            rect(144, 8, 84, 84, ' fill="%s"' % GREY)
            + '<circle cx="186" cy="50" r="42" fill="#FFFFFF"/>'
            + line(186, 50, 228, 50) + dot(186, 50, 3.5)
            + t(208, 44, "٥", 11) + t(186, 108, "الضلع ١٠", 11)
            + arrow((140, 50), (112, 50))
            + t(62, 50, "المظلل = ١٠٠ − ٢٥ ط", 11)),

        # rule 10 -- the wheel cut into its six equal 60 slices, one of them shaded:
        # the sixth is counted off the picture instead of divided out of 360
        "geometry.circle:10": svg(250, 110,
            '<polygon points="180,54 ' + " ".join('%s,%s' % (n(p[0]), n(p[1])) for p in [
                polar(180, 54, 44, 6 * k) for k in range(11)])
            + '" fill="%s" stroke="none"/>' % GREY
            + '<circle cx="180" cy="54" r="44"/>'
            + "".join(line(180, 54, *polar(180, 54, 44, 60 * k)) for k in range(6))
            + dot(180, 54, 3.5)
            + t(195, 35, "٦٠°", 11) + t(172, 82, "٦", 11)
            + arrow((132, 54), (104, 54))
            + t(62, 44, "سدس الدائرة", 11) + t(62, 72, "٣٦ ط ÷ ٦ = ٦ ط", 11)),

        # rule 13 -- both radii drawn from the one centre, 7 out to the rim and 4 to
        # the inner circle, and the grey ring is what is left when the small one goes
        "geometry.circle:13": svg(250, 106,
            '<circle cx="184" cy="54" r="42" fill="%s"/>' % GREY
            + '<circle cx="184" cy="54" r="24" fill="#FFFFFF"/>'
            + line(184, 54, 142, 54) + line(184, 54, 208, 54) + dot(184, 54, 3.5)
            + t(151, 48, "٧", 11) + t(197, 48, "٤", 11) + t(184, 89, "الحلقة", 11)
            + arrow((138, 54), (112, 54))
            + t(64, 58, "٤٩ ط − ١٦ ط = ٣٣ ط", 11)),

        # ---------------------------------------------------------------- parallel
        # rule 1 -- the two alternate angles sit on opposite sides of the transversal
        # and trace the Z drawn in the margin, so 125 is carried across untouched
        "geometry.parallel:1": svg(280, 118,
            line(92, 26, 264, 26) + line(92, 78, 264, 78)
            + line(209, 8, 147, 96)
            + '<path d="M96 21 L102 26 L96 31"/>' + '<path d="M96 73 L102 78 L96 83"/>'
            + '<path d="M' + ' L'.join('%s %s' % (n(p[0]), n(p[1])) for p in [
                polar(196.32, 26, 16, 215.17 - 12.517 * k) for k in range(11)]) + '"/>'
            + '<path d="M' + ' L'.join('%s %s' % (n(p[0]), n(p[1])) for p in [
                polar(159.68, 78, 16, 35.17 - 12.517 * k) for k in range(11)]) + '"/>'
            + t(212, 56, "١٢٥°", 11) + t(142, 55, "س")
            + '<path d="M34 40 H66 L34 62 H66"/>' + t(50, 78, "تبادل", 11)
            + t(172, 110, "س = ١٢٥° مباشرة", 12)),

        # rule 2 -- a ladder of three parallels cut by one slant: the same corner is
        # arced at all three crossings, and it is 35 at every one of them
        "geometry.parallel:2": svg(280, 120,
            line(92, 24, 264, 24) + line(92, 58, 264, 58) + line(92, 92, 264, 92)
            + line(225, 14, 99, 102)
            + '<path d="M96 19 L102 24 L96 29"/>' + '<path d="M96 53 L102 58 L96 63"/>'
            + '<path d="M96 87 L102 92 L96 97"/>'
            + "".join('<path d="M' + ' L'.join('%s %s' % (n(p[0]), n(p[1])) for p in [
                polar(cx, cy, 18, 90 - 3.493 * k) for k in range(11)]) + '"/>'
                for cx, cy in ((210.68, 24), (162, 58), (113.32, 92)))
            + t(243, 18, "٣٥°", 11) + t(194, 52, "٣٥°", 11) + t(146, 86, "٣٥°", 11)
            + '<path d="M34 40 V70 M34 40 H62 M34 54 H54"/>' + t(48, 88, "تناظر", 11)
            + t(150, 112, "كل مناظرة = ٣٥°", 12)),

        # rule 3 -- the co-interior pair: both arcs on the same side of the transversal
        # and inside the U drawn in the margin, so they add to 180 instead of matching
        "geometry.parallel:3": svg(280, 120,
            line(92, 26, 264, 26) + line(92, 78, 264, 78)
            + line(197, 7, 164, 97)
            + '<path d="M96 21 L102 26 L96 31"/>' + '<path d="M96 73 L102 78 L96 83"/>'
            + '<path d="M' + ' L'.join('%s %s' % (n(p[0]), n(p[1])) for p in [
                polar(190, 26, 18, 90 + 11.01 * k) for k in range(11)]) + '"/>'
            + '<path d="M' + ' L'.join('%s %s' % (n(p[0]), n(p[1])) for p in [
                polar(171, 78, 18, 90 - 6.99 * k) for k in range(11)]) + '"/>'
            + t(213, 48, "١١٠°", 11) + t(200, 66, "٧٠°", 11)
            + '<path d="M34 40 V64 H62 V40"/>' + t(48, 82, "تحالف", 11)
            + t(150, 112, "١١٠ + ٧٠ = ١٨٠°", 12)),

        # rule 4 -- the transversal bent at one point between the parallels: the two
        # arcs on the lines, 40 and 55, are the two halves of the 95 at the bend
        "geometry.parallel:4": svg(280, 122,
            line(30, 24, 252, 24) + line(30, 88, 252, 88)
            + line(188, 24, 150, 56) + line(150, 56, 172.4, 88) + dot(150, 56, 3.5)
            + '<path d="M36 19 L42 24 L36 29"/>' + '<path d="M36 83 L42 88 L36 93"/>'
            + '<path d="M' + ' L'.join('%s %s' % (n(p[0]), n(p[1])) for p in [
                polar(188, 24, 16, -90 - 4.01 * k) for k in range(11)]) + '"/>'
            + '<path d="M' + ' L'.join('%s %s' % (n(p[0]), n(p[1])) for p in [
                polar(172.4, 88, 16, -35 - 5.5 * k) for k in range(11)]) + '"/>'
            + '<path d="M' + ' L'.join('%s %s' % (n(p[0]), n(p[1])) for p in [
                polar(150, 56, 20, 145 - 9.51 * k) for k in range(11)]) + '"/>'
            + t(156, 38, "٤٠°", 11) + t(141, 78, "٥٥°", 11) + t(187, 64, "٩٥°", 11)
            + t(140, 114, "٤٠ + ٥٥ = ٩٥°", 12)),

        # rule 10 -- the same bend, with the long way round the point arced as well:
        # 265 is the whole sweep outside the angle, and the small one is what is asked
        "geometry.parallel:10": svg(280, 122,
            line(30, 24, 252, 24) + line(30, 88, 252, 88)
            + line(188, 24, 150, 56) + line(150, 56, 172.4, 88) + dot(150, 56, 3.5)
            + '<path d="M36 19 L42 24 L36 29"/>' + '<path d="M36 83 L42 88 L36 93"/>'
            + '<path d="M' + ' L'.join('%s %s' % (n(p[0]), n(p[1])) for p in [
                polar(150, 56, 16, 145 - 9.51 * k) for k in range(11)]) + '"/>'
            + '<path d="M' + ' L'.join('%s %s' % (n(p[0]), n(p[1])) for p in [
                polar(150, 56, 24, 145 + 8.03 * k) for k in range(34)]) + '"/>'
            + t(198, 64, "المطلوب ٩٥°", 11) + t(106, 54, "٢٦٥°", 11)
            + t(140, 114, "٩٥ + ٢٦٥ = ٣٦٠°", 12)),

        # ------------------------------------------------------------------ solids
        # rule 2 -- the box in an oblique view, hidden edges dashed, so all three
        # dimensions are on it at once and 7, 4 and 3 are seen to be multiplied
        "geometry.solids:2": svg(250, 112,
            line(144, 34, 144, 67, DASH) + line(144, 67, 221, 67, DASH)
            + line(120, 85, 144, 67, DASH)
            + rect(120, 52, 77, 33)
            + line(144, 34, 221, 34) + line(221, 34, 221, 67)
            + line(120, 52, 144, 34) + line(197, 52, 221, 34) + line(197, 85, 221, 67)
            + t(158, 100, "٧", 11) + t(110, 72, "٣", 11) + t(201, 46, "٤", 11)
            + arrow((112, 56), (88, 56))
            + t(52, 62, "٧ × ٤ × ٣", 12) + t(52, 88, "٨٤ سم³", 12)),

        # rule 4 -- the box turned so all three different faces show at once, each
        # labelled with its own product: three to add, each with a twin behind it
        "geometry.solids:4": svg(270, 100,
            rect(132, 56, 70, 28)
            + line(162, 32, 232, 32) + line(232, 32, 232, 60)
            + line(132, 56, 162, 32) + line(202, 56, 232, 32) + line(202, 84, 232, 60)
            + t(167, 74, "٥×٢", 10) + t(182, 48, "٥×٤", 10) + t(217, 62, "٤×٢", 10)
            + arrow((124, 40), (96, 40))
            + t(60, 60, "٢٠ + ١٠ + ٨ = ٣٨", 11) + t(60, 86, "٢ × ٣٨ = ٧٦ م²", 11)),

        # rule 7 -- the cube opened flat: six squares to count, the grey one is the
        # face you actually work out, and the other five repeat its 25
        "geometry.solids:7": svg(250, 102,
            rect(148, 14, 26, 26, ' fill="%s"' % GREY)
            + rect(122, 40, 26, 26) + rect(148, 40, 26, 26)
            + rect(174, 40, 26, 26) + rect(200, 40, 26, 26)
            + rect(148, 66, 26, 26)
            + t(161, 31, "٢٥", 10) + t(135, 57, "٢٥", 10) + t(161, 57, "٢٥", 10)
            + t(187, 57, "٢٥", 10) + t(213, 57, "٢٥", 10) + t(161, 83, "٢٥", 10)
            + t(60, 44, "الحرف ٥ سم", 11) + t(60, 70, "٦ × ٢٥ = ١٥٠ سم²", 11)),

        # rule 12 -- the cylinder as two ellipses and two sides; only the base is
        # grey, because the rule measures that circle and then walks it up the 4
        "geometry.solids:12": svg(260, 120,
            '<ellipse cx="178" cy="30" rx="50" ry="18"/>'
            + line(128, 30, 128, 70) + line(228, 30, 228, 70)
            + '<ellipse cx="178" cy="70" rx="50" ry="18" fill="%s"/>' % GREY
            + line(178, 70, 228, 70) + dot(178, 70, 3)
            + t(203, 66, "٥", 11) + t(238, 52, "٤", 11)
            + line(100, 70, 124, 70, GUIDE) + t(80, 70, "القاعدة", 11)
            + t(130, 110, "ط × ٥ × ٥ × ٤ = ١٠٠ ط", 12)),

        # rule 13 -- the curved side unrolled to the left: the grey rectangle keeps
        # the cylinder's height 7 and its length is the base circumference 6 ط
        "geometry.solids:13": svg(280, 126,
            '<ellipse cx="220" cy="24" rx="24" ry="13"/>'
            + line(196, 24, 196, 80) + line(244, 24, 244, 80)
            + '<ellipse cx="220" cy="80" rx="24" ry="13"/>'
            + line(220, 80, 244, 80) + dot(220, 80, 3)
            + t(232, 89, "٣", 10) + t(256, 52, "٧", 11)
            + rect(44, 24, 96, 56, ' fill="%s"' % GREY)
            + t(34, 52, "٧", 11) + t(92, 96, "٦ ط", 11)
            + arrow((189, 52), (150, 52))
            + t(140, 118, "٢ ط × ٣ × ٧ = ٤٢ ط", 12)),

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
