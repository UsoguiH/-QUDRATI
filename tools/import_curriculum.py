# -*- coding: utf-8 -*-
"""Import qudrat-lessons-duolingo.md into js/data/{skills,numbers,ratios,geometry}.js

Strict on purpose: every line inside the four sections must be consumed by the
grammar below, and every count is reconciled against the file's own map before
a single byte is written. Any deviation stops the run with the line number.

    python tools/import_curriculum.py            # parse + reconcile + write
    python tools/import_curriculum.py --check    # parse + reconcile, write nothing

Figures the book draws (ASCII sketches in the markdown, or stems that say
"في الشكل") come from tools/curriculum_figures.py, keyed "L25-Q02" per question
and "L25-rules" per lesson. A question that needs one and has none fails the run.
"""
import io, json, os, re, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "qudrat-lessons-duolingo.md")
OUT = os.path.join(ROOT, "js", "data")
REPORT = os.path.join(ROOT, "tools", "import_report.md")
sys.path.insert(0, os.path.join(ROOT, "tools"))
from curriculum_figures import FIGURES

AR = "٠١٢٣٤٥٦٧٨٩"
def ar_int(s): return int("".join(str(AR.index(c)) if c in AR else c for c in s))
def to_ar(n): return "".join(AR[int(c)] for c in str(n))

DOMAINS = {"🟢": ("skills", "green"), "🔵": ("numbers", "blue"), "🟣": ("ratios", "purple"), "🟡": ("geometry", "yellow")}
LESSON_KEYS = ["bigsum", "keylaws", "probstats", "fastest", "cycles", "simplify", "equations", "lcmgcd",
               "decimals", "fractions", "roots", "powers", "speed",
               "percent", "profit", "proportion", "mean",
               "angles", "triangle", "rectangle", "square", "quads", "shaded", "circle", "parallel", "solids"]
LETTER = {"أ": 0, "ب": 1, "ج": 2, "جـ": 2, "د": 3}
# the app's fixed comparison set (CMP_CHOICES in app.js); the file writes the 4th one two ways
CMP_APP = ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية"]
CMP_ALT = ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعلومات غير كافية"]
NEEDS_FIGURE = re.compile("في الشكل|الشكل المجاور|الشكل التالي|كما في الشكل|كما في الرسم")

R = {
    "sec": re.compile(r"^# (🟢|🔵|🟣|🟡) القسم ([٠-٩]+) · (.+?) — (.+)$"),
    "secmeta": re.compile(r"^> \*\*([٠-٩]+) دروس\*\* · صفحات الكتاب ([٠-٩]+)–([٠-٩]+) · \*\*([٠-٩]+) قانوناً\*\* · \*\*([٠-٩]+) سؤالاً\*\*$"),
    "lesson": re.compile(r"^### (🟢|🔵|🟣|🟡) الدرس ([٠-٩]+) — (.+)$"),
    "lesmeta": re.compile(r"^> \*\*الوحدة:\*\* U(\d) · \*\*التصنيف:\*\* (.+?) · \*\*الصعوبة:\*\* (★+)(☆*) · \*\*XP:\*\* (\d+) · \*\*صفحات الكتاب:\*\* (\d+)(?:–(\d+))?$"),
    "goal": re.compile(r"^\*\*🎯 الهدف:\*\* (.+)$"),
    "q": re.compile(r"^\*\*([٠-٩]+)\)\*\*\s*(?:(★{1,3})\s+)?(.*)$"),
    "choices": re.compile(r"^- \*\*أ\)\*\*\s+(.+?)\s{2,}\*\*ب\)\*\*\s+(.+?)\s{2,}\*\*ج\)\*\*\s+(.+?)\s{2,}\*\*د\)\*\*\s+(.+)$"),
    "answer": re.compile(r"^\*\*الإجابة: (أ|ب|جـ|ج|د)\*\*$"),
    "cmpline": re.compile(r"^القيمة الأولى: (.+?)\s+\|\s+القيمة الثانية: (.+)$"),
    "bullet": re.compile(r"^- (.+)$"),
    "notehead": re.compile(r"^\*\*(.+?):\*\*$"),
    "maprow": re.compile(r"^\| (🟢|🔵|🟣|🟡) \*\*([٠-٩]+)\*\* \| (.+?) \| ([٠-٩]+) \| ([٠-٩]+) \| ([٠-٩]+) \| ([٠-٩]+)–([٠-٩]+) \|$"),
    "totals": re.compile(r"^> \*\*([٠-٩]+) أقسام · ([٠-٩]+) درساً · ([٠-٩]+) قانوناً · ([٠-٩]+) سؤالاً\*\*"),
}
DET_OPEN, DET_CLOSE = "<details><summary>💡 الحل</summary>", "</details>"
H_RULES, H_Q, H_TRICK = "#### 📐 القوانين", "#### ✏️ الأسئلة", "#### ⚡ خدعة الاختبار"
TBL_HEAD, TBL_SEP = "| # | القانون | الصيغة | متى تستخدمه |", "|---|---|---|---|"
CMP_TBL_HEAD, CMP_TBL_SEP = "| القيمة الأولى | القيمة الثانية |", "|---|---|"
APPENDIX = "# 📎 ملحق"


class Fail(Exception):
    pass


# ---------------------------------------------------------------- text helpers
def _inline(s):
    if "&nbsp;" in s: s = s.replace("&nbsp;", " ")
    if re.search(r"&[a-z#0-9]+;", s): raise Fail(f"unexpected HTML entity in: {s}")
    return s

def _emphasis(s, bold_open, bold_close):
    s = re.sub(r"\*\*(.+?)\*\*", lambda m: bold_open + m.group(1) + bold_close, s)
    s = re.sub(r"\*([^*]+?)\*", r"\1", s)          # italic — only *(مُستنتَج)* / *(تحقّق …)* use it
    s = s.replace("`", "")
    if "*" in s: raise Fail(f"stray * left in: {s}")
    return re.sub(r"[ \t]+", " ", s).strip()

def plain(s):
    """Markdown → plain text, for fields the app escapes (solution, method, rules)."""
    return _emphasis(_inline(s), "", "")

def html(s):
    """Markdown → safe inline HTML, for fields the app injects raw (stem, choices, values)."""
    s = _inline(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return _emphasis(s, "<b>", "</b>")

def cells(line):
    parts = re.split(r"(?<!\\)\|", line)          # `\|` is an absolute-value bar, not a column
    if parts[0].strip() or parts[-1].strip(): raise Fail(f"table row does not start/end with |: {line}")
    return [p.strip().replace("\\|", "|") for p in parts[1:-1]]


# ---------------------------------------------------------------------- parser
class Parser:
    def __init__(self, text):
        self.L = text.replace("\r\n", "\n").split("\n")
        self.i = 0
        self.map_rows, self.totals, self.domains = [], None, []
        self.warnings = []

    def err(self, msg):
        n = self.i + 1
        src = self.L[self.i] if self.i < len(self.L) else "<EOF>"
        raise Fail(f"line {n}: {msg}\n    | {src}")

    def line(self):
        return self.L[self.i] if self.i < len(self.L) else None

    def skip_blank(self):
        while self.i < len(self.L) and not self.L[self.i].strip(): self.i += 1

    def take(self, text):
        self.skip_blank()
        if self.line() != text: self.err(f"expected {text!r}")
        self.i += 1

    def fence(self):
        """At an opening ``` — return the lines inside, consume the closing one."""
        assert self.line() == "```"
        start = self.i; self.i += 1; body = []
        while self.line() is not None and self.line() != "```":
            body.append(self.L[self.i]); self.i += 1
        if self.line() != "```": self.i = start; self.err("unclosed code fence")
        self.i += 1
        return body

    # -- front matter: only the map table and the totals line matter ---------
    def run(self):
        while self.line() is not None and not R["sec"].match(self.line()):
            m = R["maprow"].match(self.line())
            if m: self.map_rows.append(m.groups())
            m = R["totals"].match(self.line())
            if m: self.totals = tuple(ar_int(x) for x in m.groups())
            self.i += 1
        if self.totals is None: raise Fail("totals line (٤ أقسام · …) not found")
        if len(self.map_rows) != 4: raise Fail(f"map table has {len(self.map_rows)} rows, expected 4")
        while self.line() is not None and not self.line().startswith(APPENDIX):
            self.skip_blank()
            l = self.line()
            if l is None or l.startswith(APPENDIX): break
            if R["sec"].match(l): self.section()
            else: self.err("expected a section header")
        if self.line() is None or not self.line().startswith(APPENDIX):
            self.err("expected the appendix header after the last section")
        return self

    def section(self):
        m = R["sec"].match(self.line()); self.i += 1
        emoji, n, book, title = m.group(1), ar_int(m.group(2)), m.group(3), m.group(4)
        if n != len(self.domains) + 1: self.err(f"section {n} out of order")
        key, color = DOMAINS[emoji]
        self.skip_blank()
        mm = R["secmeta"].match(self.line() or "")
        if not mm: self.err("expected the section meta line (> **N دروس** · …)")
        self.i += 1
        d = {"key": key, "title": title, "color": color, "book": book, "emoji": emoji, "n": n,
             "declared": {"lessons": ar_int(mm.group(1)), "pages": (ar_int(mm.group(2)), ar_int(mm.group(3))),
                          "rules": ar_int(mm.group(4)), "questions": ar_int(mm.group(5))},
             "lessons": []}
        self.domains.append(d)
        while True:
            self.skip_blank()
            l = self.line()
            if l is None or l.startswith(APPENDIX) or R["sec"].match(l): return
            if l == "---": self.i += 1; continue
            if R["lesson"].match(l): self.lesson(d); continue
            self.err("unexpected line inside a section")

    def lesson(self, d):
        m = R["lesson"].match(self.line()); self.i += 1
        emoji, n, title = m.group(1), ar_int(m.group(2)), m.group(3).strip()
        expected = sum(len(x["lessons"]) for x in self.domains) + 1
        if n != expected: self.err(f"lesson {n} out of order (expected {expected})")
        if emoji != d["emoji"]: self.err("lesson emoji does not match its section")
        self.skip_blank()
        mm = R["lesmeta"].match(self.line() or "")
        if not mm: self.err("expected the lesson meta line (> **الوحدة:** …)")
        self.i += 1
        les = {"n": n, "key": LESSON_KEYS[n - 1], "title": title, "unit": int(mm.group(1)), "category": mm.group(2).strip(),
               "stars": len(mm.group(3)), "xp": int(mm.group(5)), "pages": (int(mm.group(6)), int(mm.group(7) or mm.group(6))),
               "goal": None, "sourceNotes": [], "rules": [], "notesTitle": None, "notes": [], "diagram": None,
               "tricks": [], "questions": [], "line": self.i}
        if len(mm.group(3)) + len(mm.group(4)) != 3:
            self.warnings.append(f"lesson {n} ({title}): difficulty written as {mm.group(3)}{mm.group(4)} — read as {len(mm.group(3))} stars")
        if les["unit"] != d["n"]: self.err(f"lesson says U{les['unit']} but sits in section {d['n']}")
        self.skip_blank()
        g = R["goal"].match(self.line() or "")
        if not g: self.err("expected the goal line (**🎯 الهدف:** …)")
        les["goal"] = g.group(1).strip(); self.i += 1
        while True:
            self.skip_blank()
            l = self.line()
            if l == H_RULES: break
            if l is not None and l.startswith("> "): les["sourceNotes"].append(l[2:].strip()); self.i += 1; continue
            self.err("expected the rules heading or a > note")
        self.rules(les)
        self.questions(les)
        self.tricks(les)
        d["lessons"].append(les)

    def rules(self, les):
        self.take(H_RULES); self.take(TBL_HEAD); self.take(TBL_SEP)
        while self.line() is not None and self.line().startswith("|"):
            try: c = cells(self.line())
            except Fail as e: self.err(str(e))
            if len(c) != 4: self.err(f"rule row has {len(c)} cells, expected 4")
            if not re.fullmatch(r"[٠-٩]+", c[0]): self.err("rule number is not Arabic digits")
            k = ar_int(c[0])
            if k != len(les["rules"]) + 1: self.err(f"rule {k} out of order")
            inferred = "مُستنتَج" in c[1]
            name = re.sub(r"\s*\*\(مُستنتَج\)\*\s*", " ", c[1]).strip()
            les["rules"].append({"n": k, "name": name, "formula": c[2], "when": c[3], "inferred": inferred})
            self.i += 1
        if not les["rules"]: self.err("rules table is empty")
        while True:
            self.skip_blank()
            l = self.line()
            if l == H_Q: return
            if l is None: self.err("file ended inside the rules block")
            h = R["notehead"].match(l)
            if h and les["notesTitle"] is None: les["notesTitle"] = h.group(1).strip(); self.i += 1; continue
            b = R["bullet"].match(l)
            if b and les["notesTitle"] is not None: les["notes"].append(b.group(1).strip()); self.i += 1; continue
            if l == "```" and les["notesTitle"] is not None and les["diagram"] is None:
                les["diagram"] = self.fence(); continue
            self.err("unexpected line after the rules table")

    def questions(self, les):
        self.take(H_Q)
        while True:
            self.skip_blank()
            l = self.line()
            if l == H_TRICK: return
            if l is None: self.err("file ended inside the questions block")
            if R["q"].match(l): self.question(les); continue
            self.err("expected a question (**N)** …)")

    def question(self, les):
        m = R["q"].match(self.line()); qline = self.i; self.i += 1
        n = ar_int(m.group(1))
        if n != len(les["questions"]) + 1: self.err(f"question {n} out of order")
        q = {"n": n, "line": qline + 1, "stem": [m.group(3).strip()] if m.group(3).strip() else [],
             "stars": len(m.group(2)) if m.group(2) else None,
             "fence": None, "table": None, "choices": None, "answer": None, "solution": [], "solFence": []}
        while True:
            l = self.line()
            if l is None: self.err("file ended inside a question")
            if not l.strip(): self.i += 1; continue
            if l == "```":
                if q["fence"] is not None: self.err("second code fence in one stem")
                q["fence"] = self.fence(); continue
            if l.startswith("|"):
                if q["table"] is not None: self.err("second table in one stem")
                rows = []
                while self.line() is not None and self.line().startswith("|"): rows.append(self.L[self.i]); self.i += 1
                q["table"] = rows; continue
            c = R["choices"].match(l)
            if c: q["choices"] = [x.strip() for x in c.groups()]; self.i += 1; break
            if l.startswith("- **"): self.err("choice line does not match the أ/ب/ج/د pattern")
            if R["q"].match(l) or l.startswith("<details") or l.startswith("####"): self.err(f"question {n} has no choice line")
            q["stem"].append(l.strip()); self.i += 1
        self.take(DET_OPEN)
        self.skip_blank()
        a = R["answer"].match(self.line() or "")
        if not a: self.err("expected **الإجابة: X**")
        q["answer"] = LETTER[a.group(1)]; self.i += 1
        while True:
            l = self.line()
            if l is None: self.err("file ended inside a solution")
            if l == DET_CLOSE: self.i += 1; break
            if not l.strip(): self.i += 1; continue
            if l == "```": q["solFence"].append(self.fence()); continue
            if l.startswith("|"):
                # the solution box renders one text line per step, so a table becomes one
                # "header value · header value" line per row
                rows = []
                while self.line() is not None and self.line().startswith("|"): rows.append(self.L[self.i]); self.i += 1
                if len(rows) < 3 or not re.fullmatch(r"\|(?:\s*:?-+:?\s*\|)+", rows[1]): self.err("solution table has no header separator")
                head = cells(rows[0])
                for r in rows[2:]:
                    c = cells(r)
                    if len(c) != len(head): self.err("ragged solution table")
                    q["solution"].append(" · ".join(f"{h} {v}" for h, v in zip(head, c)))
                continue
            if R["q"].match(l): self.err("solution never closed")
            q["solution"].append(l.strip()); self.i += 1
        if not q["solution"]: self.err(f"question {n} has an empty solution")
        les["questions"].append(q)

    def tricks(self, les):
        self.take(H_TRICK)
        while True:
            self.skip_blank()
            l = self.line()
            if l is None or l == "---" or l.startswith("### ") or l.startswith("# "): break
            b = R["bullet"].match(l)
            if not b: self.err("expected a trick bullet")
            les["tricks"].append(b.group(1).strip()); self.i += 1
        if not les["tricks"]: self.err("lesson has no tricks")


# ------------------------------------------------------------------- transform
def where(les, q=None):
    return f"lesson {les['n']} ({les['title']})" + (f" question {q['n']} (line {q['line']})" if q else "")

def figure_key(les, q=None):
    return f"L{les['n']:02d}-" + (f"Q{q['n']:02d}" if q else "rules")

def build_question(les, q, used_figures, stats):
    tag = where(les, q)
    choices = [plain(c) for c in q["choices"]]
    is_cmp = choices in (CMP_APP, CMP_ALT)
    stem_lines = list(q["stem"])
    out = {"id": f"{les['key']}-{q['n']:02d}", "format": "comparison" if is_cmp else "mcq",
           "difficulty": q["stars"] or les["stars"], "track": "both"}
    figure = FIGURES.get(figure_key(les, q))
    if is_cmp:
        v1 = v2 = None
        if q["table"] is not None:
            rows = q["table"]
            if len(rows) != 3 or rows[0] != CMP_TBL_HEAD or rows[1] != CMP_TBL_SEP:
                raise Fail(f"{tag}: comparison table is not the two-column value table")
            c = cells(rows[2])
            if len(c) != 2: raise Fail(f"{tag}: comparison table row must have two cells")
            v1, v2 = c
        else:
            # values are written either on one line "القيمة الأولى: X | القيمة الثانية: Y" or on two lines
            for k, l in enumerate(stem_lines):
                l = _inline(l)
                m = R["cmpline"].match(l)
                m1 = re.match(r"^القيمة الأولى:\s*(.+)$", l)
                m2 = re.match(r"^القيمة الثانية:\s*(.+)$", l)
                if m:
                    if v1 is not None or v2 is not None: raise Fail(f"{tag}: two value lines")
                    v1, v2 = m.group(1), m.group(2); stem_lines[k] = None
                elif m1:
                    if v1 is not None: raise Fail(f"{tag}: two first values")
                    v1 = m1.group(1); stem_lines[k] = None
                elif m2:
                    if v2 is not None: raise Fail(f"{tag}: two second values")
                    v2 = m2.group(1); stem_lines[k] = None
            stem_lines = [l for l in stem_lines if l is not None]
        if (v1 is None) != (v2 is None): raise Fail(f"{tag}: only one of the two values found")
        if v1 is None: raise Fail(f"{tag}: comparison question without its two values")
        stem = html(" ".join(stem_lines))
        if not stem.endswith("قارن بين:") and "قارن" not in stem: raise Fail(f"{tag}: comparison stem does not ask to compare: {stem}")
        if stem == "قارن بين:": stem = "قارن بين القيمتين:"   # the app hides this line behind its own kicker
        out.update({"stem": stem, "value1": html(v1), "value2": html(v2)})
        stats["cmp"] += 1
    else:
        if q["table"] is not None:
            if figure: raise Fail(f"{tag}: both a table and a drawn figure")
            figure = table_html(q["table"], tag)
        if any(R["cmpline"].match(_inline(l)) for l in stem_lines): raise Fail(f"{tag}: MCQ carries a comparison value line")
        out["stem"] = html(" ".join(stem_lines))
        out["choices"] = [html(c) for c in q["choices"]]
        if len(set(out["choices"])) != 4: raise Fail(f"{tag}: duplicate choices")
    out["answer"] = q["answer"]
    sol = []
    for l in q["solution"]:
        l = re.sub(r"^[-*] ", "", l)
        sol.append(plain(l))
    out["solution"] = "\n".join(sol)
    if len(out["solution"]) < 10: raise Fail(f"{tag}: solution shorter than 10 chars")
    needs = bool(q["fence"]) or bool(q["solFence"]) or bool(NEEDS_FIGURE.search(plain(" ".join(q["stem"]))))
    if needs and not figure: stats["missing"].append(f"{figure_key(les, q)} — {tag}")
    if figure and not needs and q["table"] is None: raise Fail(f"{tag}: FIGURES[{figure_key(les, q)!r}] exists but nothing asks for it")
    if figure: used_figures.add(figure_key(les, q)); stats["figures"] += 1
    if q["fence"]: stats["stemSketch"].append((figure_key(les, q), tag))
    if q["solFence"]: stats["solSketch"].append((figure_key(les, q), tag))
    out["figure"] = figure
    for raw in [out["stem"], out.get("value1"), out.get("value2")] + out.get("choices", []):
        if raw and re.search(r"[*`]", raw): raise Fail(f"{tag}: markdown left in a raw field: {raw}")
    stats["answers"][q["answer"]] += 1
    if q["stars"]: stats["rated"] += 1
    return out

def table_html(rows, tag):
    if len(rows) < 3 or not re.fullmatch(r"\|(?:\s*:?-+:?\s*\|)+", rows[1]): raise Fail(f"{tag}: stem table has no header separator")
    head = [html(c) for c in cells(rows[0])]
    body = [[html(c) for c in cells(r)] for r in rows[2:]]
    for r in body:
        if len(r) != len(head): raise Fail(f"{tag}: ragged stem table")
    h = "<table class=\"q-table\"><thead><tr>" + "".join(f"<th>{c}</th>" for c in head) + "</tr></thead><tbody>"
    h += "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in body)
    return h + "</tbody></table>"

def build_lesson(les, used_figures, stats):
    rules = [{"n": r["n"], "name": plain(r["name"]), "formula": plain(r["formula"]), "when": plain(r["when"]),
              **({"inferred": True} if r["inferred"] else {})} for r in les["rules"]]
    notes = [plain(x) for x in les["notes"]]
    tricks = [plain(x) for x in les["tricks"]]
    method = [f"{to_ar(r['n'])}) {r['name']}: {r['formula']} — متى تستخدمه: {r['when']}" for r in rules]
    method += [f"💡 {x}" for x in notes] + [f"💡 {x}" for x in tricks]
    figure = FIGURES.get(figure_key(les))
    if les["diagram"] and not figure: stats["missing"].append(f"{figure_key(les)} — {where(les)} rules diagram")
    if figure and not les["diagram"]: raise Fail(f"{where(les)}: FIGURES[{figure_key(les)!r}] exists but the lesson draws nothing")
    if figure: used_figures.add(figure_key(les))
    out = {"key": les["key"], "title": plain(les["title"]), "stars": les["stars"], "xp": les["xp"],
           "pages": list(les["pages"]), "category": plain(les["category"]), "goal": plain(les["goal"])}
    if les["sourceNotes"]: out["sourceNotes"] = [plain(x) for x in les["sourceNotes"]]
    out["rules"] = rules
    if notes: out["notesTitle"] = plain(les["notesTitle"]); out["notes"] = notes
    if figure: out["figure"] = figure
    out["tricks"] = tricks
    out["method"] = "\n".join(method)
    out["questions"] = [build_question(les, q, used_figures, stats) for q in les["questions"]]
    if les["xp"] != 10 * les["stars"]: stats["warn"].append(f"{where(les)}: XP {les['xp']} does not match {'★' * les['stars']}")
    return out


def main():
    check_only = "--check" in sys.argv
    with open(SRC, encoding="utf-8") as f: text = f.read()
    p = Parser(text).run()
    stats = {"cmp": 0, "figures": 0, "answers": [0, 0, 0, 0], "stemSketch": [], "solSketch": [], "warn": list(p.warnings), "missing": [], "rated": 0}
    used = set()
    domains, report = [], []
    for d in p.domains:
        dom = {"key": d["key"], "title": plain(d["title"]), "color": d["color"], "book": plain(d["book"]),
               "pages": list(d["declared"]["pages"]), "lessons": [build_lesson(l, used, stats) for l in d["lessons"]]}
        domains.append(dom)
        nl, nr, nq = len(d["lessons"]), sum(len(l["rules"]) for l in d["lessons"]), sum(len(l["questions"]) for l in d["lessons"])
        dec = d["declared"]
        row = p.map_rows[d["n"] - 1]
        mp = (ar_int(row[3]), ar_int(row[4]), ar_int(row[5]))
        for label, got, want, mapv in (("lessons", nl, dec["lessons"], mp[0]), ("rules", nr, dec["rules"], mp[1]), ("questions", nq, dec["questions"], mp[2])):
            if got != want or got != mapv:
                msg = f"section {d['n']} {label}: tables hold {got}, section header says {want}, map says {mapv}"
                if label == "rules": stats["warn"].append(msg)
                else: raise Fail(msg)
        for l in d["lessons"]:
            if not (dec["pages"][0] <= l["pages"][0] <= l["pages"][1] <= dec["pages"][1]):
                stats["warn"].append(f"{where(l)}: pages {l['pages']} outside section range {dec['pages']}")
        report.append((d, nl, nr, nq))
    if stats["missing"]: raise Fail("figures needed:\n  " + "\n  ".join(stats["missing"]))
    stale = set(FIGURES) - used
    if stale: raise Fail(f"unused figures: {sorted(stale)}")
    tot = (len(domains), sum(r[1] for r in report), sum(r[2] for r in report), sum(r[3] for r in report))
    if tot[0] != p.totals[0] or tot[1] != p.totals[1] or tot[3] != p.totals[3]:
        raise Fail(f"totals mismatch: parsed {tot}, file header says {p.totals}")
    if tot[2] != p.totals[2]: stats["warn"].append(f"rules: tables hold {tot[2]}, file header says {p.totals[2]}")

    lines = ["# Curriculum import report", "", f"Source: `qudrat-lessons-duolingo.md` → `js/data/*.js` (generated by `tools/import_curriculum.py`).", "",
             f"**{tot[0]} sections · {tot[1]} lessons · {tot[2]} rules · {tot[3]} questions** "
             f"(file header: {p.totals[0]} · {p.totals[1]} · {p.totals[2]} · {p.totals[3]})", "",
             "| # | Domain | Lessons | Rules | Questions |", "|---|---|---|---|---|"]
    for d, nl, nr, nq in report:
        lines.append(f"| {d['n']} | `{d['key']}` — {d['title']} | {nl} | {nr} | {nq} |")
    lines += ["", "| Lesson | Key | ★ | XP | Rules | Questions | Comparison | Figures |", "|---|---|---|---|---|---|---|---|"]
    for dom in domains:
        for l in dom["lessons"]:
            qs = l["questions"]
            lines.append(f"| {l['title']} | `{l['key']}` | {l['stars']} | {l['xp']} | {len(l['rules'])} | {len(qs)} | "
                         f"{sum(q['format'] == 'comparison' for q in qs)} | {sum(1 for q in qs if q['figure'])} |")
    a = stats["answers"]
    lines += ["", f"Answers: أ {a[0]} · ب {a[1]} · ج {a[2]} · د {a[3]} — comparison questions: {stats['cmp']} — figures: {stats['figures']} — questions rated individually: {stats['rated']}", ""]
    if stats["stemSketch"]:
        lines += ["Stems that carried an ASCII sketch in the file (drawn as SVG):", ""] + [f"- `{k}` — {t}" for k, t in stats["stemSketch"]] + [""]
    if stats["solSketch"]:
        lines += ["Solutions that carried an ASCII sketch (moved to the question's figure, since the app renders solutions as text):", ""] + [f"- `{k}` — {t}" for k, t in stats["solSketch"]] + [""]
    if stats["warn"]:
        lines += ["Reconciliation notes (the file disagrees with itself; the tables were taken as truth):", ""] + [f"- {w}" for w in stats["warn"]] + [""]
    print("\n".join(lines))
    if check_only:
        print("\n--check: nothing written"); return
    for dom in domains:
        src = "window.QBANK = window.QBANK || {};\nwindow.QBANK." + dom["key"] + " = " + json.dumps(dom, ensure_ascii=False, indent=2) + ";\n"
        with open(os.path.join(OUT, dom["key"] + ".js"), "w", encoding="utf-8", newline="\n") as f: f.write(src)
    with open(REPORT, "w", encoding="utf-8", newline="\n") as f: f.write("\n".join(lines) + "\n")
    print(f"\nwrote {len(domains)} data files + tools/import_report.md")


if __name__ == "__main__":
    try: main()
    except Fail as e:
        print("IMPORT FAILED — " + str(e)); sys.exit(1)
