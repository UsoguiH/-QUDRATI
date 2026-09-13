# -*- coding: utf-8 -*-
"""Hand-drawn SVG figures for the imported curriculum, keyed per question ("L25-Q02")
or per lesson ("L25-rules"). tools/import_curriculum.py fails on a missing or unused key.

Each drawing follows the numbers in its own stem (a 9-12-15 triangle is drawn 9:12,
the 125° transversal really crosses at 125°), in the same style as the figures the
question bank already ships: grey 2px strokes, Arabic labels, no fill except shading.
"""

STYLE = 'stroke="#4B4B4B" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"'
TXT = 'font-size="13" font-weight="700" stroke="none" fill="#4B4B4B" text-anchor="middle"'

def svg(w, h, body):
    return f'<svg viewBox="0 0 {w} {h}" width="{w}" {STYLE}>{body}</svg>'

def t(x, y, s, size=None):
    attrs = TXT if size is None else TXT.replace('font-size="13"', 'font-size="%s"' % size)
    return '<text x="%s" y="%s" %s>%s</text>' % (x, y, attrs, s)

FIGURES = {
    # lesson 2 q7 — a triangle with 6 segments meeting at the apex (2 sides + 4 inside)
    "L02-Q07": svg(200, 130,
        '<polygon points="100,15 20,115 180,115"/>'
        '<line x1="100" y1="15" x2="52" y2="115"/><line x1="100" y1="15" x2="84" y2="115"/>'
        '<line x1="100" y1="15" x2="116" y2="115"/><line x1="100" y1="15" x2="148" y2="115"/>'),

    # lesson 18 q5 — triangle أ ب جـ with ب جـ extended to د; angles 55° at أ, 45° at ب,
    # so the vertex sits where those two angles put it (80° inside at جـ)
    "L18-Q05": svg(220, 145,
        '<polygon points="132,18 30,120 150,120"/>'
        '<line x1="150" y1="120" x2="205" y2="120"/>'
        '<path d="M166 120 A16 16 0 0 0 147.2 104.2"/>'
        + t(132, 12, "أ") + t(30, 138, "ب") + t(150, 138, "جـ") + t(205, 138, "د")
        + t(132, 44, "٥٥°", 12) + t(56, 114, "٤٥°", 12) + t(178, 108, "؟", 13)),

    # lesson 19 q2 — right angle at ب, أ ب = 9 up, ب جـ = 12 across (drawn 9:12)
    "L19-Q02": svg(170, 140,
        '<polygon points="40,44 40,116 136,116"/>'
        '<path d="M40 106 h10 v10"/>'
        + t(40, 36, "أ") + t(36, 132, "ب") + t(136, 132, "جـ")
        + t(26, 84, "٩") + t(88, 132, "١٢") + t(100, 72, "؟")),

    # lesson 20 q7 — the staircase, all corners square, inside a 13 × 9 rectangle (dashed)
    "L20-Q07": svg(200, 150,
        '<rect x="12" y="22" width="156" height="108" stroke-dasharray="5 4" stroke-width="1.5"/>'
        '<polygon points="12,22 168,22 168,49 129,49 129,76 90,76 90,103 51,103 51,130 12,130"/>'
        + t(90, 15, "١٣ سم") + t(184, 80, "٩ سم", 12)),

    # lesson 21 q3 — six identical squares in one row
    "L21-Q03": svg(176, 46,
        '<rect x="10" y="10" width="156" height="26"/>'
        '<line x1="36" y1="10" x2="36" y2="36"/><line x1="62" y1="10" x2="62" y2="36"/>'
        '<line x1="88" y1="10" x2="88" y2="36"/><line x1="114" y1="10" x2="114" y2="36"/>'
        '<line x1="140" y1="10" x2="140" y2="36"/>'),

    # lesson 22 q6 — rhombus, side 13, diagonals 10 and 24 (drawn 5:12, so the side is 13)
    "L22-Q06": svg(180, 100,
        '<polygon points="90,20 162,50 90,80 18,50"/>'
        '<line x1="18" y1="50" x2="162" y2="50" stroke-dasharray="4 3" stroke-width="1.5"/>'
        '<line x1="90" y1="20" x2="90" y2="80" stroke-dasharray="4 3" stroke-width="1.5"/>'
        '<path d="M90 42 h8 v8" stroke-width="1.5"/>'
        + t(138, 28, "١٣") + t(104, 74, "١٠") + t(52, 44, "؟")),

    # lesson 24 q6 — four equal circles touching, the region trapped between them shaded
    "L24-Q06": svg(140, 140,
        '<path d="M70 40 A30 30 0 0 0 100 70 A30 30 0 0 0 70 100 A30 30 0 0 0 40 70 A30 30 0 0 0 70 40 Z" fill="#CFCFCF" stroke="none"/>'
        '<circle cx="40" cy="40" r="30"/><circle cx="100" cy="40" r="30"/>'
        '<circle cx="40" cy="100" r="30"/><circle cx="100" cy="100" r="30"/>'
        '<line x1="40" y1="40" x2="40" y2="10" stroke-width="1.5"/>'
        + t(48, 28, "٣", 12)),

    # lesson 24 q9 — أ ب a diameter, جـ on the circle, أ جـ = 6 and ب جـ = 8 (drawn 3:4)
    "L24-Q09": svg(180, 145,
        '<circle cx="90" cy="78" r="60"/>'
        '<polygon points="30,78 73.2,20.4 150,78"/>'
        '<circle cx="90" cy="78" r="2.5" fill="#4B4B4B" stroke="none"/>'
        + t(18, 83, "أ") + t(162, 83, "ب") + t(70, 14, "جـ") + t(96, 94, "م", 12)
        + t(40, 46, "٦") + t(124, 46, "٨")),

    # lesson 25 — the book's numbering of the eight angles: ٢|١ above ل١ and ٣|٤ below it,
    # ٦|٥ above ل٢ and ٧|٨ below it, transversal upright, exactly as the source draws it
    "L25-rules": svg(190, 150,
        '<line x1="20" y1="40" x2="160" y2="40"/><line x1="20" y1="110" x2="160" y2="110"/>'
        '<line x1="90" y1="10" x2="90" y2="140"/>'
        + t(172, 44, "ل١", 12) + t(172, 114, "ل٢", 12)
        + t(78, 33, "٢") + t(102, 33, "١") + t(78, 55, "٣") + t(102, 55, "٤")
        + t(78, 103, "٦") + t(102, 103, "٥") + t(78, 125, "٧") + t(102, 125, "٨")),

    # lesson 25 q2 — parallels cut at 125°; س is the alternate angle of the 125° one
    "L25-Q02": svg(190, 155,
        '<line x1="15" y1="45" x2="170" y2="45"/><line x1="15" y1="115" x2="170" y2="115"/>'
        '<line x1="136" y1="15" x2="48.5" y2="140"/>'
        '<path d="M131 45 A16 16 0 0 1 105.8 58.1"/><path d="M50 115 A16 16 0 0 1 75.2 101.9"/>'
        + t(182, 49, "ل١", 12) + t(182, 119, "ل٢", 12)
        + t(136, 68, "١٢٥°", 12) + t(48, 106, "س")),

    # lesson 25 q4 — the broken transversal (حرف M): 40° with ل١, 55° with ل٢, س at the bend
    "L25-Q04": svg(190, 150,
        '<line x1="15" y1="35" x2="175" y2="35"/><line x1="15" y1="125" x2="175" y2="125"/>'
        '<polyline points="66.4,35 120,80 88.5,125"/>'
        '<circle cx="120" cy="80" r="2.5" fill="#4B4B4B" stroke="none"/>'
        '<path d="M80.4 35 A14 14 0 0 1 77.1 44"/><path d="M96.5 113.5 A14 14 0 0 1 102.5 125"/>'
        '<path d="M113.1 89.8 A12 12 0 0 1 110.8 72.3"/>'
        + t(182, 39, "ل١", 12) + t(182, 129, "ل٢", 12)
        + t(100, 52, "٤٠°", 12) + t(114, 112, "٥٥°", 12) + t(134, 84, "س")),

    # lesson 25 q9 — س and ص co-interior (same side of the transversal, between the lines)
    "L25-Q09": svg(190, 155,
        '<line x1="15" y1="45" x2="170" y2="45"/><line x1="15" y1="115" x2="170" y2="115"/>'
        '<line x1="136" y1="15" x2="48.5" y2="140"/>'
        '<path d="M131 45 A16 16 0 0 1 105.8 58.1"/><path d="M75.2 101.9 A16 16 0 0 1 82 115"/>'
        + t(182, 49, "ل١", 12) + t(182, 119, "ل٢", 12)
        + t(132, 68, "س") + t(88, 104, "ص")),

    # lesson 25 q10 — س and ص corresponding (same corner at both crossings)
    "L25-Q10": svg(190, 155,
        '<line x1="15" y1="45" x2="170" y2="45"/><line x1="15" y1="115" x2="170" y2="115"/>'
        '<line x1="136" y1="15" x2="48.5" y2="140"/>'
        '<path d="M131 45 A16 16 0 0 1 105.8 58.1"/><path d="M82 115 A16 16 0 0 1 56.8 128.1"/>'
        + t(182, 49, "ل١", 12) + t(182, 119, "ل٢", 12)
        + t(132, 68, "س") + t(84, 136, "ص")),
}
