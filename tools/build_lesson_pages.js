#!/usr/bin/env node
/* The content pages — one crawlable page per lesson, generated from the app's own data.

       node tools/build_lesson_pages.js           # writes every page below
       node tools/build_lesson_pages.js --check   # writes nothing; exits 1 if a page is out of date
       node tools/build_lesson_pages.js --images  # also redraws the pages' share images (needs Chrome)
       node tools/build_lesson_pages.js --help

   It writes:
     qudrat/<slug>.html       one page per lesson (26): every rule of the lesson under its own
                              heading — the ones taught in js/data/teach.js with their words,
                              figure, example and memory line, the others with their formula and
                              when to use them — the traps the cards name, the tables to memorise,
                              the tricks, three original questions from the bank with their
                              solutions, a visible FAQ on the rules students search for
     qudrat/index.html        the hub: every unit and lesson
     qudrat/laws.html         «قوانين القدرات كمي»: the rules students search for most, the official
                              domains beside our lessons, every rule of every lesson, an FAQ
     qudrat/comparisons.html  the comparison format, from the official guide, with solved examples
     qudrat-methods.html      «أسئلة قدرات كمي مع طريقة الحل»: each lesson's tricks and two solved
                              questions (tools/build_methods_page.js runs the same build)
     qudrat/img/<name>-16x9.png, -4x3.png, -1x1.png   with --images: each page's share image,
                              drawn from the page's own title and first rule; manifest.json keeps
                              what each was drawn from, so a normal build knows when one is stale

   Then run `node tools/build_sitemap.js`: it lists these pages in /sitemap.xml with their
   dateModified, and in llms.txt, llms-full.txt and the home's list of pages.

   Sources, read-only: js/data/{skills,numbers,ratios,geometry}.js (lessons, rules, questions),
   js/data/teach.js (the cards), js/data/teach-figures.js (the cards' figures),
   js/data/learn.js (the short lessons' titles and their fixed true / false traps),
   js/app.js (CMP_CHOICES, read as text), qudrat-mock-test.html (the questions it shows, read
   so this build never shows them again).

   What the pages say beyond the data is listed in two tables and checked: EX (worked examples
   for searched rules that have none, each recomputed by the build), EXCEPT (the case that
   changes a rule's answer, said beside it) and DATA_FIX (corrections of the data's own lines,
   which stop the build once the source is fixed). No Quiz markup: it matches no current
   Google feature (see where the JSON-LD is built).

   Every bank question shown is shown on one page only. Dates: a page keeps the
   datePublished / dateModified it already carries while its content is unchanged, and
   takes today's date as dateModified the day its content changes; the visible
   «آخر تحديث», the JSON-LD and the sitemap's lastmod are the same date.

   Each rule's anchor is a name, never its number in the curriculum: a slug from RULE_IDS for
   the rules students search for (#handshakes), else «r-» and six hex characters of a hash of
   the rule's name. A build that would drop an anchor the page already has stops, so a link
   from elsewhere never lands on a different rule; pass --allow-id-change once the change is
   meant.

   Run it after any change to the data, then commit the output. Never hand-edit the output. */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SITE = "https://qudrati.xyz";
const ORDER = ["skills", "numbers", "ratios", "geometry"];
const ARGS = process.argv.slice(2);
const FLAGS = ["--check", "--images", "--allow-id-change"];

/* ------------------------------------------------------------------ data */
function loadData() {
  global.window = global;
  /* fresh objects each time: applyFixes() edits them in memory, and a run may build twice */
  const load = f => { const p = path.join(ROOT, "js", "data", f); delete require.cache[require.resolve(p)]; require(p); };
  for (const k of ORDER) load(k + ".js");
  for (const f of ["teach.js", "teach-figures.js", "learn.js"]) load(f);
  const app = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");
  const m = app.match(/const CMP_CHOICES = (\[[^\]]*\]);/);
  if (!m) throw new Error("CMP_CHOICES not found in js/app.js");
  /* the mock-test page shows some bank questions of its own; never show them twice */
  let mockIds = [];
  try { mockIds = [...fs.readFileSync(path.join(ROOT, "qudrat-mock-test.html"), "utf8").matchAll(/id="q-([a-z0-9-]+)"/g)].map(x => x[1]); } catch {}
  return { BANK: global.QBANK, TEACH: global.QTEACH, FIG: global.QTEACH_FIG || {}, LEARN: global.QLEARN || {}, CMP: JSON.parse(m[1]), mockIds };
}

/* Each lesson's page: a stable URL slug, the topic as students search it (the keyword study
   of 2026-10-31: autocomplete has «الاحصاء قدرات», «قانون الربح قدرات», «قابلية القسمة», not
   the book's chapter titles), the short topic, the official domain it belongs to (the guide,
   p. 6) and `faq`: the rules students search for, each [rule name as in the data, the
   question as it is searched, its anchor]. The first is the lesson's headline: the lead
   sentence and the description open on it. A new lesson in the data with no row here stops
   the build. Never change a slug or an anchor once it is published. */
const META = {
  bigsum:     { slug: "big-numbers", d: "حساب", h: "جمع وطرح وضرب الأعداد الكبيرة في القدرات", t: "جمع الأعداد الكبيرة وضربها",
    faq: [["جمع الأعداد المتتالية من ١ إلى س", "ما قانون جمع الأعداد من ١ إلى ن في القدرات؟", "sum-1-to-n"],
          ["ترتيب العمليات الحسابية", "ما ترتيب العمليات الحسابية في القدرات؟", "order-of-operations"],
          ["جمع الأعداد الفردية ابتداءً من ١", "ما قانون مجموع الأعداد الفردية في القدرات؟", "sum-of-odds"]] },
  keylaws:    { slug: "key-laws", d: "حساب", h: "قوانين هامة في القدرات: المصافحات والمباريات وزاوية الساعة", t: "العد والمصافحات وزاوية الساعة",
    faq: [["عدد المصافحات", "ما قانون عدد المصافحات في القدرات؟", "handshakes"],
          ["الزاوية بين عقربَي الساعة", "كيف أحسب الزاوية بين عقربي الساعة في القدرات؟", "clock-angle"],
          ["عدد المباريات", "ما قانون عدد المباريات في القدرات؟", "matches"],
          ["زمن العمل المشترك", "ما قانون العمل المشترك في القدرات؟", "joint-work"],
          ["عدد الأعداد المحصورة بين س و ص", "ما قانون الأعداد المحصورة بين عددين في القدرات؟", "numbers-between"],
          ["عدد المربعات في شكل", "كيف أعرف كم عدد المربعات في الشكل في القدرات؟", "count-squares"],
          ["عدد المستطيلات في شكل", "كيف أعرف كم عدد المستطيلات في الشكل في القدرات؟", "count-rectangles"]] },
  probstats:  { slug: "probability-statistics", d: "حساب", h: "الإحصاء والاحتمالات في القدرات", t: "الإحصاء والاحتمالات",
    faq: [["الاحتمال", "ما قانون الاحتمالات في القدرات؟", "probability"],
          ["مبدأ العد", "ما مبدأ العد في القدرات؟", "counting-principle"],
          ["التوافيق", "ما قانون التوافيق في القدرات؟", "combinations"]] },
  fastest:    { slug: "fastest-methods", d: "حساب وجبر", h: "أسرع طرق حل أسئلة القدرات الكمي", t: "تجربة الخيارات والتعويض",
    /* «متى تكون المعطيات غير كافية» is the comparisons page's query: the rule's card links there */
    open1: { name: "تجربة الخيارات", law: "طريقة تجربة الخيارات" },
    faq: [["تجربة الخيارات — النوع الأول", "كيف أحل سؤال القدرات بتجربة الخيارات؟", "try-the-choices"],
          ["استبدال المتغيرات بأرقام", "ما طريقة التعويض بالأرقام في القدرات؟", "plug-in-numbers"]] },
  cycles:     { slug: "patterns-cycles", d: "حساب", h: "الدوريات والأنماط والمتتابعات في القدرات", t: "الدوريات والأنماط",
    faq: [["دوري الأيام", "كيف أعرف اليوم بعد عدد من الأيام في القدرات؟", "day-cycle"],
          ["آحاد الأسس", "كيف أجد رقم الآحاد لعدد مرفوع لأس في القدرات؟", "units-digit-powers"],
          ["المتتابعة الحسابية", "ما قانون الحد في المتتابعة الحسابية في القدرات؟", "arithmetic-sequence"]] },
  simplify:   { slug: "divisibility-simplify", d: "حساب", h: "قابلية القسمة والتبسيط في القدرات", t: "قابلية القسمة والتبسيط",
    faq: [["قابلية القسمة على ٣", "ما قاعدة قابلية القسمة على ٣ في القدرات؟", "divisible-by-3"],
          ["قابلية القسمة على ٧", "ما قاعدة قابلية القسمة على ٧ في القدرات؟", "divisible-by-7"],
          ["باقي القسمة", "كيف أجد العدد من ناتج القسمة والباقي في القدرات؟", "remainder"]] },
  equations:  { slug: "equations-squares", d: "جبر", h: "المعادلات والمربع الكامل والفرق بين مربعين في القدرات", t: "المعادلات والمربع الكامل",
    faq: [["الفرق بين مربعين", "ما قانون الفرق بين مربعين في القدرات؟", "difference-of-squares"],
          ["مربع مجموع", "ما قانون مربع مجموع حدين في القدرات؟", "square-of-sum"],
          ["الميل بنقطتين", "كيف أحسب ميل المستقيم من نقطتين في القدرات؟", "slope-two-points"]] },
  lcmgcd:     { slug: "lcm-gcd", d: "حساب", h: "المضاعف المشترك الأصغر والقاسم المشترك الأكبر في القدرات", t: "المضاعف والقاسم",
    faq: [["تعيين م.م.أ", "كيف أجد المضاعف المشترك الأصغر في القدرات؟", "lcm"],
          ["تعيين ق.م.أ", "كيف أجد القاسم المشترك الأكبر في القدرات؟", "gcd"],
          ["عدد مرات الالتقاء", "كم مرة يلتقي حدثان متكرران في مدة معيّنة في القدرات؟", "meeting-times"]] },
  decimals:   { slug: "decimals", d: "حساب", h: "الأعداد العشرية في القدرات", t: "الأعداد العشرية",
    faq: [["ضرب الأعداد العشرية", "كيف أضرب الأعداد العشرية في القدرات؟", "multiply-decimals"],
          ["قسمة الأعداد العشرية", "كيف أقسم الأعداد العشرية في القدرات؟", "divide-decimals"],
          ["المقارنة بين عددين عشريين", "كيف أقارن بين عددين عشريين في القدرات؟", "compare-decimals"]] },
  fractions:  { slug: "fractions", d: "حساب", h: "الكسور في القدرات", t: "الكسور",
    faq: [["المقارنة بين كسرين (المقص)", "كيف أقارن بين كسرين في القدرات؟", "compare-fractions"],
          ["جمع/طرح كسور مختلفة المقامات", "كيف أجمع كسوراً مختلفة المقامات في القدرات؟", "add-fractions"],
          ["قسمة الكسور", "كيف أقسم الكسور في القدرات؟", "divide-fractions"]] },
  roots:      { slug: "square-roots", d: "حساب", h: "الجذور في القدرات وجدول الجذور المشهورة", t: "الجذور",
    /* searched for its values («قيم الجذور المشهورة»): open on the table's last rows */
    open1: { line: r => r.formula.split(/\s*،\s*/).slice(-4).map(x => x.replace(/\s*=\s*/, " = ")).join("، "), ex: false },
    faq: [["الجذور التربيعية المشهورة", "ما الجذور التربيعية المشهورة في القدرات؟", "square-roots-table"],
          ["تبسيط الجذر", "كيف أبسّط الجذر في القدرات؟", "simplify-root"],
          ["قاعدة المقارنة بين الجذور", "كيف أقارن بين الجذور في القدرات؟", "compare-roots"]] },
  powers:     { slug: "exponents", d: "حساب", h: "الأسس في القدرات وجدول الأسس المشهورة", t: "الأسس",
    faq: [["فيتامينات الأسس (حفظ)", "ما الأسس المشهورة التي تُحفظ للقدرات؟", "powers-table"],
          ["ضرب الأساسات المتشابهة", "ما قانون ضرب الأسس في القدرات؟", "multiply-powers"],
          ["الأس السالب", "كيف أتعامل مع الأس السالب في القدرات؟", "negative-exponent"]] },
  speed:      { slug: "speed-distance-time", d: "حساب", h: "قانون السرعة والمسافة والزمن في القدرات", t: "السرعة والمسافة والزمن",
    faq: [["مثلث «فَزَع»", "ما قانون السرعة والمسافة والزمن في القدرات؟", "distance-speed-time"],
          ["زمن الالحاق (١)", "ما قانون زمن اللحاق في القدرات؟", "catch-up-time"],
          ["اتجاهان متعاكسان", "ما قانون الالتقاء والتباعد في اتجاهين متعاكسين في القدرات؟", "opposite-directions"],
          ["السرعة المتوسطة (٢)", "كيف أحسب السرعة المتوسطة للذهاب والعودة في القدرات؟", "average-speed-round-trip"],
          ["زمن الالحاق (٢)", "كيف أحسب زمن اللحاق من المسافة بين جسمين في القدرات؟", "catch-up-distance"],
          ["السرعة المتوسطة (١)", "ما قانون السرعة المتوسطة في القدرات؟", "average-speed"]] },
  percent:    { slug: "percent", d: "حساب", h: "النسبة والنسبة المئوية في القدرات", t: "النسبة المئوية",
    faq: [["الجزء من الكل", "كيف أحسب النسبة المئوية من عدد في القدرات؟", "percent-of"],
          ["الكل من الجزء", "كيف أجد العدد الكلي من نسبته المئوية في القدرات؟", "whole-from-part"],
          ["النسب المئوية المشهورة", "ما النسب المئوية المشهورة في القدرات؟", "percent-table"]] },
  profit:     { slug: "profit-loss", d: "حساب", h: "قانون الربح والخسارة والخصم في القدرات", t: "الربح والخسارة",
    faq: [["النسبة المئوية للزيادة", "ما قانون نسبة الزيادة في القدرات؟", "percent-increase"],
          ["الربح المركب (زيادتان)", "ما قانون الربح المركب في القدرات؟", "compound-increase"],
          ["زيادة ثم نقص (أو العكس)", "ما قانون الزيادة ثم الخصم في القدرات؟", "increase-then-decrease"],
          ["السعر الأصلي عند البيع بمكسب", "كيف أجد سعر الشراء من سعر البيع والربح في القدرات؟", "original-price"]] },
  proportion: { slug: "proportion", d: "حساب", h: "التناسب الطردي والعكسي في القدرات", t: "التناسب الطردي والعكسي",
    faq: [["التناسب الطردي", "ما قانون التناسب الطردي في القدرات؟", "direct-proportion"],
          ["التناسب العكسي", "ما قانون التناسب العكسي في القدرات؟", "inverse-proportion"],
          ["أجزاء النسب — الخطوة الأولى", "كيف أوزّع مقداراً بنسبة معيّنة في القدرات؟", "ratio-parts"]] },
  mean:       { slug: "arithmetic-mean", d: "حساب", h: "قانون الوسط الحسابي في القدرات", t: "الوسط الحسابي",
    faq: [["الوسط الحسابي", "ما قانون الوسط الحسابي في القدرات؟", "mean"],
          ["القيمة المحذوفة أو المضافة", "كيف أجد العدد المضاف أو المحذوف من الوسط الحسابي في القدرات؟", "added-removed-value"],
          ["تغيّر العدد والمجموع معاً (الأخطر)", "ماذا يحدث للوسط الحسابي إذا خرج عدد وتغيّر العدد والمجموع معاً؟", "count-and-sum-change"]] },
  angles:     { slug: "angles-polygons", d: "هندسة", h: "الزوايا والمضلعات في القدرات", t: "الزوايا والمضلعات",
    faq: [["مجموع زوايا المضلّع الداخلية", "ما قانون مجموع زوايا المضلع في القدرات؟", "polygon-angle-sum"],
          ["زاوية المضلّع المنتظم الخارجية", "كيف أحسب الزاوية الخارجية للمضلع المنتظم في القدرات؟", "regular-polygon-exterior"],
          ["الزاوية الخارجية عن المثلث", "ما قانون الزاوية الخارجة عن المثلث في القدرات؟", "triangle-exterior-angle"]] },
  triangle:   { slug: "triangle", d: "هندسة", h: "قوانين المثلث في القدرات ومثلثات فيثاغورس", t: "المثلث",
    faq: [["فيثاغورث — إيجاد الوتر", "ما قانون فيثاغورس في القدرات؟", "pythagoras"],
          ["مثلثات فيثاغورث المشهورة", "ما مثلثات فيثاغورس المشهورة في القدرات؟", "pythagorean-triples"],
          ["مساحة المثلث", "ما قانون مساحة المثلث في القدرات؟", "triangle-area"],
          ["المثلث ٣٠–٦٠ — المقابل لـ ٣٠", "ما خاصية المثلث الثلاثيني الستيني في القدرات؟", "triangle-30-60"]] },
  rectangle:  { slug: "rectangle", d: "هندسة", h: "قوانين المستطيل في القدرات: المساحة والمحيط والقطر", t: "المستطيل",
    faq: [["مساحة المستطيل", "ما قانون مساحة المستطيل في القدرات؟", "rectangle-area"],
          ["محيط المستطيل", "ما قانون محيط المستطيل في القدرات؟", "rectangle-perimeter"],
          ["طول القطر", "كيف أحسب قطر المستطيل في القدرات؟", "rectangle-diagonal"]] },
  square:     { slug: "square", d: "هندسة", h: "قوانين المربع في القدرات", t: "المربع",
    faq: [["مساحة المربع بالقطر", "كيف أحسب مساحة المربع من قطره في القدرات؟", "square-area-diagonal"],
          ["قطر المربع", "ما قانون قطر المربع في القدرات؟", "square-diagonal"],
          ["محيط المربع", "ما قانون محيط المربع في القدرات؟", "square-perimeter"]] },
  quads:      { slug: "quadrilaterals", d: "هندسة", h: "المعين ومتوازي الأضلاع وشبه المنحرف في القدرات", t: "المعين ومتوازي الأضلاع وشبه المنحرف",
    faq: [["مساحة شبه المنحرف", "ما قانون مساحة شبه المنحرف في القدرات؟", "trapezoid-area"],
          ["محيط شبه المنحرف", "كيف أوجد محيط شبه المنحرف في القدرات؟", "trapezoid-perimeter"],
          ["مساحة المعين", "ما قانون مساحة المعين في القدرات؟", "rhombus-area"],
          ["مساحة متوازي الأضلاع", "ما قانون مساحة متوازي الأضلاع في القدرات؟", "parallelogram-area"]] },
  shaded:     { slug: "shaded-areas", d: "هندسة", h: "المساحات المظللة في القدرات", t: "المساحات المظللة",
    /* searched as «المساحات المظللة قدرات», never «المبدأ العام»: the rule's own formula */
    open1: { line: r => plain(r.formula) },
    faq: [["المبدأ العام", "كيف أحسب المساحة المظللة في القدرات؟", "shaded-area"],
          ["مربع المنتصفات", "كم مساحة المربع المرسوم من منتصفات أضلاع مربع في القدرات؟", "midpoint-square"]] },
  circle:     { slug: "circle", d: "هندسة", h: "قوانين الدائرة في القدرات", t: "الدائرة",
    faq: [["مساحة الدائرة", "ما قانون مساحة الدائرة في القدرات؟", "circle-area"],
          ["محيط الدائرة", "ما قانون محيط الدائرة في القدرات؟", "circumference"],
          ["طول القوس", "ما قانون طول القوس في القدرات؟", "arc-length"],
          ["مساحة القطاع", "ما قانون مساحة القطاع الدائري في القدرات؟", "sector-area"]] },
  parallel:   { slug: "parallel-lines", d: "هندسة", descNames: true, h: "المستقيمات المتوازية والزوايا في القدرات", t: "التوازي",
    faq: [["الزوايا في وضع التبادل", "ما الزوايا المتبادلة في المستقيمات المتوازية في القدرات؟", "alternate-angles"],
          ["الزوايا في وضع التحالف", "ما الزوايا المتحالفة في المستقيمات المتوازية في القدرات؟", "co-interior-angles"],
          ["القاطع المكسور (التوازي بحرف M)", "كيف أحسب زاوية القاطع المكسور بين مستقيمين متوازيين في القدرات؟", "bent-transversal"]] },
  solids:     { slug: "solids", d: "هندسة", h: "حجم المكعب والمجسمات في القدرات", t: "المجسمات",
    faq: [["حجم المكعب", "ما قانون حجم المكعب في القدرات؟", "cube-volume"],
          ["حجم الأسطوانة", "ما قانون حجم الأسطوانة في القدرات؟", "cylinder-volume"],
          ["مساحة سطح المكعب (الكلية)", "ما قانون مساحة سطح المكعب في القدرات؟", "cube-surface"],
          ["حجم متوازي المستطيلات", "ما قانون حجم متوازي المستطيلات في القدرات؟", "cuboid-volume"]] },
};

/* More anchors by name, for rules that are searched but are no lesson's FAQ. */
const RULE_IDS = {
  "skills.keylaws|عدد الهدايا": "gifts",
  "skills.keylaws|عدد المثلثات المشتركة في رأس واحدة": "count-triangles",
  "skills.keylaws|عدد الأعداد من س إلى ص": "numbers-from-to",
  "skills.keylaws|الزاوية الصغرى": "smaller-clock-angle",
  "numbers.roots|الجذور التكعيبية المشهورة": "cube-roots-table",
  "skills.simplify|حقائق ضرب يجب حفظها": "multiplication-facts",
  "skills.probstats|فضاءات العينة الشهيرة": "sample-spaces",
  "geometry.circle|كسور القطاع الشهيرة": "sector-fractions",
  "geometry.angles|طول القوس": "arc-length",
  "skills.fastest|خواص الأسس الزوجية": "even-powers",
  "skills.fastest|اختيار الأرقام الذكية": "smart-numbers",
  "skills.fastest|حكم «المعلومات غير كافية»": "insufficient-data",
};

/* A rule another page answers for in full: its card links there («الشرح الكامل»). */
const SEE_PAGE = {
  "skills.fastest|حكم «المعلومات غير كافية»": ["/qudrat/comparisons.html#insufficient", "أسئلة المقارنة في القدرات: متى تكون المعطيات غير كافية؟"],
};

/* The rules a student searches for most, shown first on the laws page (the keyword study's
   clusters, tools/seo/ai-queries.json): [lesson key, rule name]. */
const LAWS_TOP = [
  ["keylaws", "عدد المصافحات"], ["keylaws", "عدد المباريات"], ["keylaws", "الزاوية بين عقربَي الساعة"],
  ["keylaws", "عدد الأعداد المحصورة بين س و ص"], ["keylaws", "زمن العمل المشترك"], ["bigsum", "جمع الأعداد المتتالية من ١ إلى س"],
  ["probstats", "الاحتمال"], ["mean", "الوسط الحسابي"], ["percent", "الجزء من الكل"], ["profit", "النسبة المئوية للزيادة"],
  ["profit", "الربح المركب (زيادتان)"], ["speed", "مثلث «فَزَع»"], ["speed", "زمن الالحاق (١)"], ["simplify", "قابلية القسمة على ٣"],
  ["equations", "الفرق بين مربعين"], ["triangle", "فيثاغورث — إيجاد الوتر"], ["angles", "مجموع زوايا المضلّع الداخلية"],
  ["circle", "مساحة الدائرة"], ["circle", "طول القوس"], ["solids", "حجم المكعب"],
];

/* Examples this build adds, for rules students search for whose data has no example of its
   own (no teaching card, no bank question that applies it) or whose card's example says
   something else (the card of «المعلومات غير كافية» shows a case where the data *is* enough).
   Each is worked on small numbers and `verify` recomputes it, so a wrong example stops the
   build. `cond`: a condition the rule's data line leaves out (the sum of squares counts the
   squares of an n × n grid only). `replace`: the example takes the card's place; otherwise the
   card keeps its own and this one is added as «مثال كامل». Keyed «unit.lesson|rule name». */
const gridSquares = (a, b) => { let n = 0; for (let k = 1; k <= Math.min(a, b); k++) n += (a - k + 1) * (b - k + 1); return n; };
const gridRects = (a, b) => { let n = 0; for (let x1 = 0; x1 <= a; x1++) for (let x2 = x1 + 1; x2 <= a; x2++) for (let y1 = 0; y1 <= b; y1++) for (let y2 = y1 + 1; y2 <= b; y2++) n++; return n; };
const EX = {
  "skills.keylaws|عدد المربعات في شكل": {
    cond: "هذا المجموع لشبكة مربعة ن × ن: ١² + ٢² + … + ن²",
    ex: "شبكة ٣ × ٣ ← ١² + ٢² + ٣² = ١ + ٤ + ٩ = ١٤ مربعاً. وفي شبكة غير مربعة ٣ × ٤ عُدَّ كل مقاس وحده: ١٢ مربعاً صغيراً و٦ من مقاس ٢ × ٢ و٢ من مقاس ٣ × ٣ ، فالمجموع ٢٠",
    verify: () => 1 + 4 + 9 === 14 && gridSquares(3, 3) === 14 && 12 + 6 + 2 === 20 && gridSquares(3, 4) === 20 && 3 * 4 === 12 && 2 * 3 === 6 && 1 * 2 === 2 },
  "skills.keylaws|عدد المستطيلات في شكل": {
    ex: "شبكة ٢ × ٣ ← الترقيم الأفقي ١ + ٢ = ٣ ، والرأسي ١ + ٢ + ٣ = ٦ ← ٣ × ٦ = ١٨ مستطيلاً، والمربعات من ضمنها",
    verify: () => (1 + 2) * (1 + 2 + 3) === 18 && gridRects(2, 3) === 18 },
  "geometry.circle|طول القوس": {
    ex: "قوس زاويته ٩٠° في دائرة نصف قطرها ٧ ← (٩٠ ÷ ٣٦٠) × ٢ × ط × ٧ = ربع ١٤ ط = ٣٫٥ ط",
    verify: () => (90 / 360) * 2 * 7 === 3.5 && 14 / 4 === 3.5 },
  "numbers.speed|زمن الالحاق (٢)": {
    ex: "بينهما ٣٠ كم، والأمامي بسرعة ٥٠ واللاحق بسرعة ٧٠ ← ٣٠ ÷ (٧٠ − ٥٠) = ٣٠ ÷ ٢٠ = ١٫٥ ساعة",
    verify: () => 30 / (70 - 50) === 1.5 },
  "numbers.speed|السرعة المتوسطة (١)": {
    ex: "١٢٠ كم في ساعتين ثم ٨٠ كم في ساعتين ← (١٢٠ + ٨٠) ÷ (٢ + ٢) = ٢٠٠ ÷ ٤ = ٥٠ كم في الساعة",
    verify: () => (120 + 80) / (2 + 2) === 50 },
  "geometry.quads|محيط شبه المنحرف": {
    ex: "قاعدتاه ٨ و١٤ وساقاه ٥ و٥ ← المحيط = ٨ + ١٤ + ٥ + ٥ = ٣٢",
    /* a real trapezoid: half the bases' difference is 3, so its height is 4 (3, 4, 5) */
    verify: () => 8 + 14 + 5 + 5 === 32 && ((14 - 8) / 2) ** 2 + 4 ** 2 === 5 ** 2 },
  "skills.fastest|حكم «المعلومات غير كافية»": { replace: true,
    ex: "القيمة الأولى ٢س والثانية س ← إن كانت س = ٣ فهما ٦ و٣ والأولى أكبر، وإن كانت س = −٣ فهما −٦ و−٣ والثانية أكبر ← المعطيات غير كافية",
    verify: () => 2 * 3 > 3 && 2 * -3 < -3 },
  "ratios.proportion|أجزاء النسب — الخطوة الأولى": {
    ex: "وُزّع ٨١٠ بالنسبة ٢ : ٣ : ٤ ← الأجزاء ٢ + ٣ + ٤ = ٩ ، والجزء ٨١٠ ÷ ٩ = ٩٠ ← الأنصبة ١٨٠ و٢٧٠ و٣٦٠",
    verify: () => 2 + 3 + 4 === 9 && 810 / 9 === 90 && 2 * 90 === 180 && 3 * 90 === 270 && 4 * 90 === 360 && 180 + 270 + 360 === 810 },
};
/* The case that changes a rule's answer, said with the rule wherever it is said (its card, its FAQ
   answer and its row on the laws page), when the data says it elsewhere: in a companion rule
   («الزاوية الصغرى»: at ٩:٠٠ the formula gives ٢٧٠°, the angle between the hands is ٩٠°) or only
   in the card's memory line («باقي صفر يعني الآحاد الرابع»: ٣^٨ ends in ١, the fourth of ٣ ، ٩ ، ٧ ، ١,
   not in nothing). `see`: the companion rule's anchor. Each is recomputed by `verify`. */
const EXCEPT = {
  "skills.keylaws|الزاوية بين عقربَي الساعة": { see: "smaller-clock-angle",
    text: "وإن زاد الناتج على ١٨٠° فالزاوية بين العقربين = ٣٦٠° − الناتج: الساعة ٩:٠٠ تعطي ٩ × ٣٠ = ٢٧٠° ، والزاوية ٣٦٠ − ٢٧٠ = ٩٠°",
    verify: () => 9 * 30 - 0 * 5.5 === 270 && 360 - 270 === 90 },
  "skills.cycles|آحاد الأسس": {
    text: "وإن كان الباقي صفراً فالآحاد هو الرابع في الدورة: ٣^٨ ← ٨ ÷ ٤ باقيه صفر ، فآحاده ١ ، رابع الدورة ٣ ، ٩ ، ٧ ، ١",
    verify: () => 3 ** 8 % 10 === 1 && 8 % 4 === 0 && [3, 9, 27, 81].map(x => x % 10).join() === "3,9,7,1" },
};
/* What the pages print differently from the data, each a correction of the data's own line
   (every one is listed for the user to fix at the source, qudrat-lessons-duolingo.md /
   teach.js). The build stops when a `from` is no longer in the data, so a fix made at the
   source is noticed and the row removed. */
const DATA_FIX = [
  /* ١/٦ is ١٦ و٢/٣٪ (١٦٫٦٧), not ≈ ١٦٫٦٪, and the table's decimal column had nothing; a repeating
     decimal is written with its «…», never as an equality with its first three digits */
  { tk: "ratios.percent", rule: "النسب المئوية المشهورة", field: "formula", from: "١/٦≈١٦٫٦٪", to: "١/٦=٠٫١٦٦…=١٦ و٢/٣٪" },
  { tk: "ratios.percent", rule: "النسب المئوية المشهورة", field: "formula", from: "١/٣=٠٫٣٣٣=", to: "١/٣=٠٫٣٣٣…=" },
  { tk: "ratios.percent", rule: "النسب المئوية المشهورة", field: "formula", from: "٢/٣=٠٫٦٦٦=", to: "٢/٣=٠٫٦٦٦…=" },
  /* the lesson's first trick says the same table again, truncated: the table's own values */
  { tk: "ratios.percent", field: "tricks", from: "(١/٨=١٢٫٥٪ ، ١/٦≈١٦٫٦٪ ، ١/٣=٣٣٫٣٪ ، ٢/٣=٦٦٫٦٪)", to: "(١/٨ = ١٢٫٥٪ ، ١/٦ = ١٦ و٢/٣٪ ، ١/٣ = ٣٣ و١/٣٪ ، ٢/٣ = ٦٦ و٢/٣٪)" },
  /* ط is about ٣٫١٤ and about ٢٢/٧, and the two are not equal */
  { tk: "geometry.circle", rule: "قيمة ط", field: "formula", from: "ط = ٣٫١٤ = ٢٢/٧", to: "ط ≈ ٣٫١٤ ≈ ٢٢/٧" },
  /* the table's header already says «الجزء من الدائرة»; no other row carries the words */
  { tk: "geometry.circle", rule: "كسور القطاع الشهيرة", field: "formula", from: "¹⁄₁₂ من الدائرة", to: "¹⁄₁₂" },
  /* ٠٫٠٠٤٠ is ٠٫٠٠٤: say so */
  { tk: "numbers.decimals", rule: "ضرب الأعداد العشرية", field: "example", from: "← ٠٫٠٠٤٠", to: "← ٠٫٠٠٤٠ = ٠٫٠٠٤" },
  /* the card's example is lifted from a question about metres; out of it the unit means nothing */
  { tk: "skills.lcmgcd", rule: "تعيين ق.م.أ", field: "example", from: "= ١٢ متراً", to: "= ١٢" },
  /* the average speed is under the mean of the two speeds on a round trip at two different speeds,
     not «دائماً»: ١٢٠ كم in ساعتين then ٨٠ in ساعتين is ٥٠، the mean of ٦٠ and ٤٠ (EX below) */
  { tk: "numbers.speed", rule: "ملحوظة السرعة المتوسطة", field: "formula", from: "السرعة المتوسطة < الوسط الحسابي للسرعتين دائماً",
    to: "في الذهاب والعودة على المسافة نفسها بسرعتين مختلفتين: السرعة المتوسطة < الوسط الحسابي للسرعتين" },
  { tk: "numbers.speed", rule: "ملحوظة السرعة المتوسطة", field: "plain", from: "السرعة المتوسطة أقل من الوسط الحسابي",
    to: "في الذهاب والعودة على المسافة نفسها: السرعة المتوسطة أقل من الوسط الحسابي للسرعتين" },
  { tk: "numbers.speed", rule: "ملحوظة السرعة المتوسطة", field: "say", from: "السرعة المتوسطة أصغر من الوسط الحسابي دائماً.",
    to: "في الذهاب والعودة على المسافة نفسها بسرعتين مختلفتين، السرعة المتوسطة أصغر من الوسط الحسابي للسرعتين." },
  /* and not «بقليل»: ١٠ ذهاباً و٩٠ عودة is ١٨ against a mean of ٥٠ */
  { tk: "numbers.speed", field: "tricks", from: "وهي دائماً أقل منه بقليل", to: "وهي أقل منه ما دامت السرعتان مختلفتين" },
];
/* Bank questions a lesson page shows first: they apply a rule the page's FAQ is about
   (speed-07 is the round trip at ٦٠ and ٤٠ of «السرعة المتوسطة»). */
const PREFER = { "numbers.speed": ["speed-07"] };

/* Rules whose formula is a list to memorise: drawn as a real table (students search
   «جدول الجذور قدرات», «الاسس المشهورة»). The headers are ours; the cells are the formula's. */
const MEMO = {
  "فضاءات العينة الشهيرة": ["التجربة", "عدد النواتج"],
  "حقائق ضرب يجب حفظها": ["الضرب", "الناتج"],
  "الجذور التربيعية المشهورة": ["الجذر", "القيمة"],
  "الجذور التكعيبية المشهورة": ["الجذر", "القيمة"],
  "فيتامينات الأسس (حفظ)": ["القوة", "القيمة"],
  "النسب المئوية المشهورة": ["الكسر", "العدد العشري", "النسبة المئوية"],
  "مثلثات فيثاغورث المشهورة": ["الضلع", "الضلع", "الوتر"],
  "كسور القطاع الشهيرة": ["زاوية القطاع", "الجزء من الدائرة"],
};

/* The official sources this build cites, and the day each was read. Only what was read in
   them is said: the four quantitative domains (the guide, p. 5) and their concepts (p. 6),
   the comparison format and its four choices (p. 12), the ban on calculators (p. 19), and
   ETEC's own «اختبارات قدراتي» series for grades 3 to 10. */
const GUIDE = "https://media.etec.gov.sa/media/1izihxlo/%D8%A7%D9%84%D8%AF%D9%84%D9%8A%D9%84-%D8%A7%D9%84%D8%A7-%D8%B1%D8%B4%D8%A7%D8%AF%D9%8A-%D9%84%D8%A7%D8%AE%D8%AA%D8%A8%D8%A7%D8%B1-%D8%A7%D9%84%D9%82%D8%AF%D8%B1%D8%A7%D8%AA-%D8%A7%D9%84%D8%B9%D8%A7%D9%85%D8%A9.pdf";
const SRC = {
  checked: "2026-10-31",
  guide: { name: "الدليل الإرشادي لاختبار القدرات العامة — هيئة تقويم التعليم والتدريب", url: GUIDE },
  qudratiTests: { name: "اختبارات قدراتي — هيئة تقويم التعليم والتدريب",
    url: "https://etec.gov.sa/ar/centers/qiyas/p/p-739fe0f2-0bfc-43a1-839f-0873eb6302ac" },
};
const guideAt = p => `${GUIDE}#page=${p}`;
/* the four comparison choices as the guide prints them (p. 12, and again on p. 22); the app and
   its questions show the first two shorter, «القيمة الأولى أكبر» (CMP_CHOICES) */
const GUIDE_CMP = ["القيمة الأولى أكبر من الثانية", "القيمة الثانية أكبر من الأولى", "القيمتان متساويتان", "المعطيات غير كافية"];
const ETEC = { "@type": "GovernmentOrganization", name: "هيئة تقويم التعليم والتدريب", url: "https://etec.gov.sa/" };

/* ------------------------------------------------------------------ text helpers */
const AR = "٠١٢٣٤٥٦٧٨٩";
const toAr = n => String(n).replace(/[0-9]/g, d => AR[d]);
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/* What the data writes that a page should not: «·» between list items (in this font it reads as
   the Arabic zero), the stress marks of learn.js, circled Latin numerals, vulgar-fraction glyphs
   (drawn stacked instead), and «المعلومات غير كافية», which the exam calls «المعطيات غير كافية». */
const CIRCLED = "①②③④⑤⑥⑦⑧⑨";
const VULGAR = { "½": "١/٢", "⅓": "١/٣", "⅔": "٢/٣", "¼": "١/٤", "¾": "٣/٤", "⅕": "١/٥", "⅙": "١/٦", "⅛": "١/٨",
  "⅜": "٣/٨", "⅝": "٥/٨", "⅞": "٧/٨", "⅖": "٢/٥", "⅗": "٣/٥", "⅘": "٤/٥", "⅚": "٥/٦", "⅐": "١/٧", "⅑": "١/٩", "⅒": "١/١٠" };
/* superscript and subscript digits (the data writes powers as «٢¹⁰» and one fraction as «¹⁄₁₂») */
const SUP_CH = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUP_RE = /[⁰¹²³⁴-⁹⁺⁻ⁿ]+/g;
const SUB_RE = /[₀-₉]+/g;
const supAr = m => [...m].map(c => c === "⁺" ? "+" : c === "⁻" ? "−" : c === "ⁿ" ? "ن" : AR[SUP_CH.indexOf(c)]).join("");
const subAr = m => [...m].map(c => AR[c.charCodeAt(0) - 0x2080]).join("");
/* Words the pages spell differently from the data, everywhere they appear: the spelling students
   search («فيثاغورس»: 9 suggestions in the keyword study, «فيثاغورث» none) and the right one
   («اللحاق»). The build stops once a word is no longer in the data, so a fix at the source is
   noticed and the row removed. */
const TEXT_FIX = [["فيثاغورث", "فيثاغورس"], ["الالحاق", "اللحاق"],
  /* ٥ is the number absent, not «٥٪» (teach.js, the percent check) */
  ["و ٥٪ هي عدد الغائبين لا نسبتهم", "و ٥٪ خطأ لأن ٥ هو عدد الغائبين لا نسبتهم"],
  /* «٥√١٠/١٠» stacks as ٥√ beside ١٠ over ١٠, which reads ٥√(١٠/١٠) = ٥: the numerator is ٥√١٠ */
  ["٥√١٠/١٠", "(٥√١٠)/١٠"], ["٦(√٢+١)/(٢−١)", "(٦(√٢+١))/(٢−١)"],
  /* a Latin comma between two formulas of the mean (numbers.js, teach.js) */
  ["الوسط × العدد , العدد", "الوسط × العدد ، والعدد"],
  /* a polygon's «sum/angle» pair (geometry.js) is two values, not a division: written with a slash it stacks as a fraction */
  ...[["٥٤٠", "١٠٨"], ["٧٢٠", "١٢٠"], ["١٠٨٠", "١٣٥"], ["١٤٤٠", "١٤٤"]].flatMap(([s, a]) =>
    [[`${s}/${a}`, `${s} وزاويته ${a}`], [`${s} / ${a}`, `${s} وزاويته ${a}`]])];
/* A comparison's verdict named by its letter («← (د)», «الإجابة (ج)») says nothing to a reader who
   came from search, and the site writes the letter «جـ»: the choice itself, as CMP_CHOICES has it. */
const VERDICT = [[/(الإجابة(?:\s*غالباً)?)\s*\(د\)/g, "$1 «المعطيات غير كافية»"], [/(الإجابة(?:\s*غالباً)?)\s*\(جـ?\)/g, "$1 «القيمتان متساويتان»"],
  [/←\s*\(د\)/g, "← المعطيات غير كافية"], [/←\s*\(جـ?\)/g, "← القيمتان متساويتان"]];
const undot = s => VERDICT.reduce((t, [a, b]) => t.replace(a, b), TEXT_FIX.reduce((t, [a, b]) => t.split(a).join(b), String(s == null ? "" : s)))
  .replace(/\s*·\s*/g, " ، ").replace(/\*/g, "")
  .replace(/[①-⑨]/g, c => toAr(CIRCLED.indexOf(c) + 1) + ")")
  .replace(/([⁰¹²³⁴-⁹]+)⁄([₀-₉]+)/g, (m, n, d) => `${supAr(n)}/${subAr(d)}`)
  .replace(/([٠-٩]?)([½⅓⅔¼¾⅕⅙⅛⅜⅝⅞⅖⅗⅘⅚⅐⅑⅒])/g, (m, w, f) => (w ? w + " و" : "") + VULGAR[f])
  /* a letter's index («س٢ − س١», «ق١ ÷ ق٢», «ل١ // ل٢», «مج١»): lowered, as the speed rules write
     «س₁ × ز₁», so the index is never read as a number beside the letter (never «و١») */
  .replace(/(?<![ء-ي])(مج|[أسصكزنقل])([١-٩])(?![٠-٩٫/])/g, (m, l, d) => l + String.fromCharCode(0x2080 + AR.indexOf(d)))
  .replace(/المعلومات غير كافية/g, "المعطيات غير كافية")
  /* three stems write «&gt;» as an entity: text here, escaped once when it is printed */
  .replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
/* the bank's stems mark a word with <b> («أيّ الأعداد التالية <b>ليس</b> عدداً أوليّاً؟»): kept bold
   on the page, dropped from plain text */
const plain = s => undot(s).replace(/<\/?b>/g, "").replace(/\s+/g, " ").trim();
const bare = s => plain(s).replace(/[«»]/g, "");
/* A power as the exam prints it: «٢¹⁰» and «٢^(س+٢)» become a raised exponent in Eastern digits.
   Plain text (the JSON-LD) keeps the data's own form. */
const CARET_RE = /\s*\^\s*(?:\(((?:[^()]|\([^()]*\))*)\)|([−\-+]?[٠-٩ء-ي]+))/g;
/* Each raised or lowered part carries its sign as hidden text («^», «_», and brackets round an
   exponent of more than one term), as a stacked fraction carries « على »: copied, read aloud or
   taken by a crawler that drops tags, «٢<sup>٦</sup>» is «٢^٦», never «٢٦». */
const PW = t => `<span class="fr-sr pw">${t}</span>`;
const supTag = (inner, text) => /[+−\-×÷\s]/.test(text.replace(/^[−\-+]/, "")) ? `<sup>${PW("^(")}${inner}${PW(")")}</sup>` : `<sup>${PW("^")}${inner}</sup>`;
/* «^…» first: the hidden signs it writes carry «^» and brackets of their own */
function supify(h) { return h.replace(CARET_RE, (m, g, t) => g != null ? supTag(supify(g), g) : supTag(t, t))
  .replace(SUP_RE, m => supTag(supAr(m), supAr(m))).replace(SUB_RE, m => `<sub>${PW("_")}${subAr(m)}</sub>`); }
/* A fraction as the exam prints it, the top over a bar over the bottom (fracs() in js/app.js,
   which stacks numbers): here also a lone letter (أ/ب), «نق», and a bracketed group
   («(أ ± ب)/م», «(√٢+١)/(٢−١)»), its brackets dropped once it is stacked. Never a word
   («جمع/طرح»). data-t keeps the text as written, which the build's own checks read back. */
const GROUP = String.raw`\((?:[^()]|\([^()]*\))*\)`;
const SUPS = String.raw`[⁰¹²³⁴-⁹]*`;
const FRAC_RE = new RegExp(String.raw`((?<![٠-٩٫/])√?[٠-٩]+(?:٫[٠-٩]+)?(?![٠-٩٫])|(?<![ء-ي/])(?:نق|[ء-ي])(?![ء-ي])|${GROUP})(${SUPS})\/` +
  String.raw`((?:√?[٠-٩]+(?:٫[٠-٩]+)?(?![٠-٩٫])|(?:نق|[ء-ي])(?![ء-ي])|${GROUP})${SUPS})(?![/٠-٩ء-ي(])`, "g");
const unwrap = t => new RegExp(`^${GROUP}$`).test(t) ? t.slice(1, -1) : t;
/* A top or a bottom of more than one term («أ ± ب», «س+١», «٥√١٠») keeps its brackets as hidden
   text, so a reader or crawler that drops the drawing reads «(أ ± ب) على م», never «أ ± ب على م»,
   which is أ ± (ب ÷ م). */
const MANY = /[+−\-±×÷\s]|[٠-٩]√/;
const GB = t => `<span class="fr-sr gb">${t}</span>`;
const grouped = (shown, html) => MANY.test(shown) && !new RegExp(`^${GROUP}$`).test(shown) ? GB("(") + html + GB(")") : html;
function fracs(h) {
  const parts = [];
  const marked = h.replace(FRAC_RE, (m, n, ns, d) => {
    const dd = d.match(new RegExp(`^(${GROUP})(${SUPS})$`));
    const nt = ns ? n : unwrap(n), dt = dd && !dd[2] ? unwrap(d) : d;
    parts.push(`<span class="fr" data-t="${m}"><span class="fr-n">${grouped(nt, supify(nt + ns))}</span><span class="fr-sr"> على </span><span class="fr-d">${grouped(dt, supify(dt))}</span></span>`);
    return `\u0001${parts.length - 1}\u0002`;
  });
  return supify(marked).replace(/\u0001(\d+)\u0002/g, (m, i) => parts[+i]);
}
/* a repeating decimal keeps its «…» on the right of its digits, as it is written, not at the end
   of the right-to-left line */
const T = s => fracs(esc(undot(s))).replace(/&lt;(\/?)b&gt;/g, "<$1b>").replace(/\n/g, "<br>")
  .replace(/([٠-٩]+٫[٠-٩]+…)/g, '<bdi dir="ltr">$1</bdi>');
/* back to text, for the checks: a fraction as written, an exponent as ^{…}, entities decoded */
function canon(s) { return s.replace(SUP_RE, m => `^{${supAr(m)}}`).replace(SUB_RE, m => `_{${subAr(m)}}`)
  .replace(CARET_RE, (m, g, t) => `^{${g != null ? canon(g) : t}}`); }
/* an inline figure: hidden from screen readers (its box carries the same words as a label),
   and a space after each label so the page's text never runs two labels together */
const svgFig = s => String(s).replace(/<svg\b/g, '<svg aria-hidden="true" focusable="false"').replace(/<\/(text|tspan)>(?=<)/g, "</$1> ");
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const arDate = iso => { const [y, m, d] = iso.split("-").map(Number); return `${toAr(d)} ${MONTHS[m - 1]} ${toAr(y)}`; };
const LETTERS = ["أ", "ب", "جـ", "د"];
/* solved questions shown: on the comparisons page, and at most on a lesson page */
const CMP_SHOWN = 18, PRACTICE_MAX = 8;
/* Arabic counted nouns: ١ and ٢ are the noun itself, ٣–١٠ take the plural, ١١ and up the
   singular accusative */
function count(n, one, two, many, acc) {
  const r = n % 100;
  if (n === 1) return `${one} واحد`;
  if (n === 2) return two;
  if (r >= 3 && r <= 10) return `${toAr(n)} ${many}`;
  if (r >= 11) return `${toAr(n)} ${acc}`;
  return `${toAr(n)} ${one}`;
}
const nRules = n => count(n, "قانون", "قانونان", "قوانين", "قانوناً");
const nLessons = n => count(n, "درس", "درسان", "دروس", "درساً");
const nQs = n => count(n, "سؤال", "سؤالان", "أسئلة", "سؤالاً");
/* «… أخرى / آخر»: agrees with the counted noun */
/* the questions with their adjective, which agrees with the count as the noun does */
const ADJ = { asl: ["أصلي", "أصليان", "أصلية", "أصلياً"], hal: ["محلول", "محلولان", "محلولة", "محلولاً"] };
const nQsA = (n, kind) => { const [one, two, pl, acc] = ADJ[kind], r = n % 100;
  return n === 1 ? `سؤال ${one} واحد` : n === 2 ? `سؤالان ${two}` : `${nQs(n)} ${r >= 3 && r <= 10 ? pl : r >= 11 ? acc : one}`; };
/* «٨ أمثلة محلولة», «١٨ مثالاً محلولاً»; «١٤ سؤالاً محلولاً من أسئلة المقارنة» */
const nExSolved = n => { const r = n % 100; return n === 1 ? "مثال محلول واحد" : n === 2 ? "مثالان محلولان" : r >= 3 && r <= 10 ? `${toAr(n)} أمثلة محلولة` : `${toAr(n)} مثالاً محلولاً`; };
const nCmpSolved = n => { const r = n % 100; return n === 1 ? "سؤال مقارنة محلول" : n === 2 ? "سؤالا مقارنة محلولان" : r >= 3 && r <= 10 ? `${toAr(n)} أسئلة مقارنة محلولة` : `${toAr(n)} سؤالاً محلولاً من أسئلة المقارنة`; };
const nOther = n => n === 1 ? "قانون آخر" : n === 2 ? "قانونان آخران" : (n % 100 >= 3 && n % 100 <= 10) ? `${toAr(n)} قوانين أخرى` : `${toAr(n)} قانوناً آخر`;
/* comparison questions: «سؤال مقارنة» is a construct, so the count never takes an accusative */
const nCmp = n => n === 1 ? "سؤال مقارنة واحد" : n === 2 ? "سؤالا مقارنة" : (n % 100 >= 3 && n % 100 <= 10) ? `${toAr(n)} أسئلة مقارنة` : `${toAr(n)} سؤالاً من أسئلة المقارنة`;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const endStop = s => /[.؟!:]$/.test(s) ? s : s + ".";
/* join titles with «، » — but never put a comma straight after a question mark */
const joinTitles = list => list.reduce((s, t, i) => i === 0 ? t : s + (/[؟?!]$/.test(list[i - 1]) ? " " : "، ") + t, "");
const hash6 = s => crypto.createHash("sha1").update(s).digest("hex").slice(0, 6);

/* split a list formula at its top-level separators, never inside brackets */
function splitTop(s) {
  const out = []; let depth = 0, cur = "";
  const src = String(s).replace(/\s*·\s*/g, "\u0001").replace(/\s*؛\s*/g, "\u0001").replace(/\s+،\s+/g, "\u0001");
  for (const ch of src) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "\u0001" && depth === 0) { out.push(cur.trim()); cur = ""; continue; }
    cur += ch === "\u0001" ? " ، " : ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function memoRows(rule) {
  const heads = MEMO[rule.orig || rule.name];
  if (!heads) return null;
  const k = heads.length;
  const rows = splitTop(rule.formula).map(item => {
    const tri = item.match(/^\((.*)\)$/);
    if (tri) return tri[1].split(/\s*،\s*/);
    const approx = /≈/.test(item);
    const parts = item.split(/\s*[=≈→]\s*/);
    if (parts.length === k) return parts;
    if (parts.length === 2 && k === 3 && approx) return [parts[0], "—", "≈ " + parts[1]];
    return null;
  });
  if (rows.some(r => !r || r.length !== k || r.some(c => !c))) throw new Error(`memo table «${rule.name}» does not parse into ${k} columns: ${rule.formula}`);
  return { heads, rows };
}

/* A trap: what the data itself names as the wrong turn. A teaching check whose explanation
   names one of its wrong choices («… ، لا ٤٠», «ومن ضرب في ١٠ خرج بـ ٤٣»), or says «أخطأ»;
   and the fixed true / false items of learn.js whose statement is false. Nothing else. */
const tok = (s, x) => new RegExp(`(^|[\\s(،←:])${x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[\\s)،.←])`).test(s);
/* is every mention of `c` in `why` a number inside the right working («٣٦ − ١٦ = ٢٠»)? Then
   the explanation does not name it as the wrong turn */
const OPS = /[−\-+×÷=←]/;
function onlyOperand(why, c) {
  const re = new RegExp(`(^|[\\s(،←:])(${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?=$|[\\s)،.←])`, "g");
  let m, any = false;
  while ((m = re.exec(why))) {
    any = true;
    const at = m.index + m[1].length, before = why.slice(0, at).trim().slice(-1), after = why.slice(at + c.length).trim().charAt(0);
    if (!OPS.test(before) && !OPS.test(after)) return false;
  }
  return any;
}
function checkTrap(s) {
  const why = plain(s.why), right = plain(s.choices[s.answer]);
  const named = s.choices.map(plain).filter((c, i) => i !== s.answer).filter(c =>
    c.length > 1 || (tok(why, c) && !onlyOperand(why, c)) ? tok(why, c) : new RegExp(`(لا|ليس|بـ) ?${c}(?=$|[\\s،.])`).test(why));
  /* the one the explanation talks about in words, else the first it names */
  const wrong = named.find(c => !onlyOperand(why, c)) || named[0];
  if (wrong) return `${trapAsk(s)} الجواب ${right} وليس ${wrong}: ${why}`;
  if (/أخطأ|ولا تجمع/.test(why)) return `${trapAsk(s)} الجواب ${right}: ${why}`;
  return null;
}
/* A trap's question as it reads without its tiles: one that asks to pick among them («أيّ الأعداد
   التالية ليس أولياً؟») names them, or «التالية» would point at nothing. Choices that are verdicts
   («س أكبر», «المعطيات غير كافية») are answers, not the things asked about. */
const ASKS_PICK = /(^|[\s،.ف])أيّ?(\s|$)|التالية|الآتية/;
function trapAsk(s) {
  const q = plain(s.q), cs = s.choices.map(plain);
  if (!ASKS_PICK.test(q) || cs.every(c => q.includes(c)) || cs.some(c => /أكبر|أصغر|متساوي|غير كافية/.test(c))) return endStop(q);
  return `${q.replace(/\s*[؟?]\s*$/, "")}: ${cs.map(c => /،/.test(c) ? `(${c})` : c).join(" أو ")}؟`;
}

/* the words of a text, for matching a trap to its rule: no signs, no «ال»/«و»/«ب» in front, no
   plural or feminine ending («مصافحة» and «المصافحات» are one word), no word that every rule says */
const wordSet = t => new Set(plain(t).replace(/[«»().،:؟!—←=×÷+−\-/<>,؛٪°]/g, " ").split(/\s+/)
  .map(w => w.replace(/^(وال|بال|كال|فال|لل|ال|و|ب|ك|ف)(?=[ء-ي]{3})/, "")).map(w => w.replace(/(ات|ة|ين|ون|ان)$/, "").replace(/(?<=[ء-ي]{3})ي$/, "")).filter(w => w.length > 1 && !STOP.has(w) && !/^(إذا|كان|فإن|هو|هي|ثم|لا|كم|ما|عدد|العدد|أكبر|أصغر|أطول|أقصر|أكثر|أقل)$/.test(w)));
const MARGIN = 2;
const ruleWords = r => wordSet([r.name, r.formula, r.card ? [r.card.plain, r.card.example, r.card.say].join(" ") : ""].join(" "));

/* ------------------------------------------------------------------ the model */
function applyFixes(D) {
  for (const f of DATA_FIX) {
    const [uk, lk] = f.tk.split(".");
    const l = D.BANK[uk].lessons.find(x => x.key === lk);
    if (!l) throw new Error(`DATA_FIX: no lesson ${f.tk}`);
    let targets = [l];
    /* a rule's field: the bank's rule and its teaching card, which must say the same */
    if (f.rule) {
      const r = l.rules.find(x => x.name === f.rule);
      if (!r) throw new Error(`DATA_FIX: no rule «${f.rule}» in ${f.tk}`);
      targets = [r, ...D.TEACH[f.tk].chunks.flatMap(c => c.steps).filter(s => s.type === "rule" && s.n === r.n)];
    }
    let hit = 0;
    for (const o of targets) {
      const v = o[f.field];
      if (typeof v === "string" && v.includes(f.from)) { o[f.field] = v.replace(f.from, f.to); hit++; }
      else if (Array.isArray(v)) v.forEach((s, i) => { if (typeof s === "string" && s.includes(f.from)) { v[i] = s.replace(f.from, f.to); hit++; } });
    }
    if (!hit) throw new Error(`DATA_FIX: «${f.from}» is no longer in ${f.tk}${f.rule ? ` «${f.rule}»` : ""}.${f.field}; the data was fixed at the source, remove the row`);
  }
  const raw = JSON.stringify([D.BANK, D.TEACH, D.LEARN]);
  for (const [a] of TEXT_FIX) if (!raw.includes(a)) throw new Error(`TEXT_FIX: «${a}» is no longer in the data; it was fixed at the source, remove the row`);
  for (const k of Object.keys(NAME_FIX)) { const [tk, name] = k.split("|"), [uk, lk] = tk.split(".");
    const l = D.BANK[uk] && D.BANK[uk].lessons.find(x => x.key === lk);
    if (!l || !l.rules.some(r => r.name === name)) throw new Error(`NAME_FIX: no rule «${name}» in ${tk}; it was renamed at the source, remove the row`); }
}
/* Rule names the pages show differently: an English word in a heading, and a name nobody
   searches («فيتامينات الأسس (حفظ)»: 0 suggestions; «جدول الاسس» and «الاسس المشهورة»: 8).
   The anchor stays the hash of the data's name, so links never move. */
const NAME_FIX = {
  "geometry.square|تحذير (dangerous)": "مساحة المربع أكبر من مساحة مستطيل له القطر نفسه",
  "geometry.shaded|المبدأ العام": "قانون المساحة المظللة",
  /* a note's label is no name («ملحوظة النسبة»): what it states */
  "skills.cycles|قاعدة الأنماط": "كيف تعرف عملية النمط العددي",
  "skills.equations|ملاحظة المقارنة (المربع الكامل)": "مقارنة مربع المجموع ومربع الفرق بمجموع المربعين",
  "numbers.fractions|تحذير المقارنة بين س وص": "مقارنة س وص تحتاج معرفة الإشارة",
  "numbers.roots|قاعدة المقارنة بين الجذور": "المقارنة بين الجذور بالتربيع",
  "numbers.speed|تنبيه الاتجاه": "اتجاه الحركة إذا لم يذكره السؤال",
  "numbers.speed|ملحوظة الالحاق": "زمن اللحاق وزمن الحركة من البداية",
  "numbers.speed|ملحوظة السرعة المتوسطة": "السرعة المتوسطة والوسط الحسابي للسرعتين",
  "ratios.percent|ملحوظة تمارين الأشكال": "الأجزاء المتماثلة في الشكل متطابقة",
  "ratios.profit|ملحوظة النسبة": "نسبة الربح والخسارة من سعر الشراء",
  "ratios.proportion|حالة الفرق بدل المجموع": "قيمة الجزء من الفرق بين نصيبين",
  "numbers.powers|فيتامينات الأسس (حفظ)": "جدول الأسس المشهورة",
  /* numbered variants nobody searches for, named by what each one says */
  "numbers.speed|زمن الالحاق (١)": "زمن اللحاق بفارق زمني",
  "numbers.speed|زمن الالحاق (٢)": "زمن اللحاق من المسافة بين الجسمين",
  "numbers.speed|السرعة المتوسطة (١)": "السرعة المتوسطة من المسافات والأزمنة",
  "numbers.speed|السرعة المتوسطة (٢)": "السرعة المتوسطة للذهاب والعودة",
  "numbers.fractions|الأعداد المحصورة بين صفر و١ (أ)": "الأُسّ يصغّر العدد بين صفر و١",
  "numbers.fractions|الأعداد المحصورة بين صفر و١ (ب)": "مربع العدد بين صفر و١ أصغر من ١",
  "numbers.fractions|الأعداد المحصورة بين صفر و١ (ج)": "مقلوب العدد بين صفر و١ أكبر من ١",
  "geometry.angles|ملحوظة هامة": "الزاوية التي لا يُذكر نوعها داخلية",
};
/* notes and warnings are rules of the data, but not something a lesson teaches */
const isNote = name => /^(ملحوظة|تنبيه|تحذير)/.test(name);

function buildModel() {
  const D = loadData();
  applyFixes(D);
  for (const [k, x] of Object.entries(EX)) if (!x.verify()) throw new Error(`EX «${k}»: its example does not compute`);
  for (const [k, x] of Object.entries(EXCEPT)) if (!x.verify()) throw new Error(`EXCEPT «${k}»: its example does not compute`);
  const units = ORDER.map((uk, ui) => {
    const u = D.BANK[uk];
    return { key: uk, n: ui + 1, title: u.title, lessons: u.lessons.map((l, li) => ({ unit: uk, unitTitle: u.title, unitN: ui + 1, n: li + 1, ...l })) };
  });
  const all = units.flatMap(u => u.lessons);
  for (const u of units) for (const l of u.lessons) l.unitLessons = u.lessons;
  for (const l of all) {
    const m = META[l.key];
    if (!m) throw new Error(`lesson ${l.unit}.${l.key} has no row in META (slug, topic, faq) — add one`);
    Object.assign(l, m, { url: `${SITE}/qudrat/${m.slug}.html`, href: `/qudrat/${m.slug}.html` });
    const tk = l.tk = l.unit + "." + l.key;
    const teach = D.TEACH[tk];
    if (!teach) throw new Error("no teaching cards for " + tk);
    const byN = new Map(l.rules.map(r => [r.n, r]));
    /* every rule's anchor: a slug when it is searched, else a hash of its name */
    const slugOf = new Map(m.faq.map(([name, , slug]) => [name, slug]));
    for (const r of l.rules) {
      r.id = slugOf.get(r.name) || RULE_IDS[tk + "|" + r.name] || "r-" + hash6(r.name); r.ex = EX[tk + "|" + r.name] || null;
      r.except = EXCEPT[tk + "|" + r.name] || null; r.seePage = SEE_PAGE[tk + "|" + r.name] || null;
      /* `orig` is the data's name, which every table here is keyed by; `name` is what the page shows */
      r.orig = r.name; r.name = NAME_FIX[tk + "|" + r.name] || r.name;
    }
    const seen = new Set();
    l.chunks = teach.chunks.map(c => ({
      title: c.title,
      rules: c.steps.filter(s => s.type === "rule" && !seen.has(s.n) && seen.add(s.n)).map(s => {
        const r = byN.get(s.n);
        if (!r) throw new Error(`${tk}: card for rule ${s.n} has no rule in the bank`);
        if (s.formula !== r.formula) throw new Error(`${tk}: card ${s.n} formula differs from the bank`);
        r.card = s; r.fig = D.FIG[`${tk}:${s.n}`] || null;
        return r;
      }),
      checks: c.steps.filter(s => s.type === "check").map(s => ({ ...s, trap: checkTrap(s) })),
    }));
    /* the short lessons' fixed true / false items that are false: traps, after the chunk that
       teaches the first rule they belong to */
    for (const sl of (D.LEARN[tk] && D.LEARN[tk].lessons) || []) {
      for (const it of sl.items || []) {
        if (!it || typeof it !== "object" || it.t !== "tf" || it.a !== false || !it.big || !it.why) continue;
        const c = l.chunks.find(c => c.rules.some(r => (sl.rules || []).includes(r.n))) || l.chunks[l.chunks.length - 1];
        (c.learnTraps = c.learnTraps || []).push({ big: it.big, text: `«${plain(it.big)}» خطأ: ${plain(it.why)}` });
      }
    }
    /* each trap under the rule it is about: the rule of its chunk that shares the most words with
       it — the rule's name in the trap's question first, then its words in the question, then in the
       whole trap — when one scores more than any other; else the chunk's own «فخاخ هذا الجزء». (The
       explanation names the wrong rule too: «و ٥٦ عدد الهدايا» is a trap of the handshakes.) */
    for (const c of l.chunks) {
      c.free = [];
      const place = (text, ask, words) => {
        /* only the words that one rule of the chunk says and no other count */
        const own = r => { const others = c.rules.filter(x => x !== r).map(ruleWords); return w => !others.some(o => o.has(w)); };
        const hit = (set, ws, mine) => [...set].filter(w => ws.has(w) && mine(w)).length, any = () => true;
        const sc = c.rules.map(r => { const mine = own(r); return { r, n: 4 * hit(wordSet(r.name), ask, any) + 2 * hit(ruleWords(r), ask, any) + hit(ruleWords(r), words, mine) }; }).sort((a, b) => b.n - a.n);
        if (sc[0] && sc[0].n >= MARGIN && (!sc[1] || sc[0].n - sc[1].n >= MARGIN)) (sc[0].r.traps = sc[0].r.traps || []).push(text); else c.free.push(text);
      };
      for (const s of c.checks) if (s.trap) place(s.trap, wordSet(s.q), wordSet([s.q, ...s.choices, s.why].join(" ")));
      for (const t of c.learnTraps || []) place(t.text, wordSet(t.big), wordSet(t.text));
    }
    l.taught = l.chunks.flatMap(c => c.rules);
    l.memo = l.rules.filter(r => MEMO[r.orig] && !seen.has(r.n));
    l.rest = l.rules.filter(r => !seen.has(r.n) && !MEMO[r.orig]);
    l.short = (D.LEARN[tk] && D.LEARN[tk].lessons || []).map(s => plain(s.title));
    l.traps = l.chunks.flatMap(c => [...c.checks.map(s => s.trap).filter(Boolean), ...(c.learnTraps || []).map(t => t.text)]);
    l.top = m.faq.map(([name, q]) => {
      const r = l.rules.find(x => x.orig === name);
      if (!r) throw new Error(`${tk}: META faq names «${name}», which is no rule of the lesson`);
      return { r, q };
    });
    if (!l.taught.length) throw new Error(tk + ": no taught rule");
    const ids = l.rules.map(r => r.id);
    const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    if (dup.length) throw new Error(`${tk}: two rules share the anchor ${dup.join(", ")}`);
  }
  all.forEach((l, i) => { l.prev = all[i - 1] || null; l.next = all[i + 1] || null; l.idx = i + 1; });
  /* a rule that is another lesson's subject (its short topic, or its headline rule): the probability
     lesson's «الوسط الحسابي» is the mean lesson's, the page meant to answer for it */
  for (const l of all) for (const r of l.rules) {
    const o = all.find(o => o !== l && (bare(r.name) === o.t || r.orig === o.top[0].r.orig));
    if (o) r.see = { l: o, r: o.rules.find(x => x.orig === r.orig) || o.top[0].r };
  }
  for (const k of Object.keys(EXCEPT)) { const [tk, name] = k.split("|"), l = all.find(l => l.tk === tk), r = l && l.rules.find(r => r.orig === name);
    if (!r) throw new Error(`EXCEPT «${k}»: no such rule in the data`);
    const o = r.except.see && l.rules.find(o => o.id === r.except.see);
    if (r.except.see && !o) throw new Error(`EXCEPT «${k}»: no rule #${r.except.see} in its lesson`);
    if (o) r.except = { ...r.except, seeName: o.name }; }
  /* a FAQ rule whose card's memory line, or a companion rule of its lesson («… إذا زادت عن ١٨٠°»),
     states the case that changes its answer, says it in the answer (EXCEPT) */
  for (const l of all) for (const { r } of l.top) {
    const hookCase = r.card && /باقي صفر|إذا|إن |زاد/.test(r.card.hook || "");
    const rw = new Set([...wordSet(r.name)].filter(w => w.length > 2));
    const companion = l.rules.find(o => o !== r && /(إذا|إن)\s+زاد/.test(o.formula) && [...wordSet(o.name)].some(w => rw.has(w)));
    if ((hookCase || companion) && !r.except) throw new Error(`${l.tk} «${r.name}»: ${companion ? `«${companion.name}» changes its answer` : `its card says «${r.card.hook}»`}, which its FAQ answer must say (EXCEPT)`);
  }
  for (const k of Object.keys(EX)) { const [tk, name] = k.split("|"); if (!all.some(l => l.tk === tk && l.rules.some(r => r.orig === name))) throw new Error(`EX «${k}»: no such rule in the data`); }
  for (const l of all) for (const r of l.rules) if (r.ex && r.ex.replace && r.fig) throw new Error(`${l.tk} «${r.name}»: the card's figure draws the example EX replaces`);

  /* questions: each one on one page only, and never one the mock-test page shows — the
     comparisons page first (every free one whose answer is «المعطيات غير كافية», then one a
     lesson, unit by unit in turn, to CMP_SHOWN in all), then three per lesson page, two per
     lesson on the methods page, and the rest of each lesson's own on its page, up to PRACTICE_MAX
     (the first three and the methods page's two stay what they were as the count grew) */
  const used = new Set(D.mockIds);
  const take = q => { used.add(q.id); return q; };
  const freeCmp = (l, ans) => l.questions.filter(q => q.format === "comparison" && !used.has(q.id) && (ans === 3 ? q.answer === 3 : q.answer !== 3))
    .sort((a, b) => Math.abs(a.difficulty - 2) - Math.abs(b.difficulty - 2));
  const insuffQs = [];
  for (const l of all) for (const q of freeCmp(l, 3)) insuffQs.push({ q: take(q), l });
  if (!insuffQs.length) throw new Error("no free comparison question answered «المعطيات غير كافية»");
  const comparisons = [], gave = new Set();
  for (let pass = 0; comparisons.length + insuffQs.length < CMP_SHOWN && pass < 12; pass++) {
    for (const u of units) {
      if (comparisons.length + insuffQs.length >= CMP_SHOWN) break;
      const l = u.lessons.find(l => !gave.has(l) && freeCmp(l, 0).length);
      if (l) { gave.add(l); comparisons.push({ q: take(freeCmp(l, 0)[0]), l }); }
    }
  }
  if (comparisons.length + insuffQs.length < CMP_SHOWN) throw new Error(`only ${comparisons.length + insuffQs.length} free comparison questions for ${CMP_SHOWN}`);
  comparisons.sort((a, b) => a.l.idx - b.l.idx);
  const pick = (l, n, prefer) => {
    const free = l.questions.filter(q => !used.has(q.id));
    const out = [];
    let cmp = 0;
    for (const id of prefer ? PREFER[l.tk] || [] : []) {
      const q = free.find(x => x.id === id);
      if (!q) throw new Error(`PREFER: ${id} is not a free question of ${l.tk}`);
      if (out.length < n && !out.includes(q)) { out.push(q); if (q.format === "comparison") cmp++; }
    }
    for (let round = 0; out.length < n && round < 10; round++) {
      for (const d of [1, 2, 3]) {
        if (out.length >= n) break;
        const q = free.find(x => x.difficulty === d && !out.includes(x) && (x.format !== "comparison" || cmp < 1));
        if (q) { out.push(q); if (q.format === "comparison") cmp++; }
      }
      if (round > 0) for (const q of free) if (out.length < n && !out.includes(q)) out.push(q);
    }
    if (out.length < n) throw new Error(`${l.key}: only ${out.length} free questions`);
    out.forEach(take);
    return out.sort((a, b) => a.difficulty - b.difficulty);
  };
  for (const l of all) l.practice = pick(l, 3, true);
  for (const l of all) l.methodQs = pick(l, 2);
  for (const l of all) {
    const n = Math.min(PRACTICE_MAX - l.practice.length, l.questions.filter(q => !used.has(q.id)).length);
    if (n > 0) l.practice = [...l.practice, ...pick(l, n)].sort((a, b) => a.difficulty - b.difficulty);
  }

  const totals = {
    units: units.length, lessons: all.length,
    rules: all.reduce((n, l) => n + l.rules.length, 0),
    questions: all.reduce((n, l) => n + l.questions.length, 0),
    cmp: all.reduce((n, l) => n + l.questions.filter(q => q.format === "comparison").length, 0),
  };
  return { D, units, all, comparisons, insuffQs, totals };
}

/* Is a formula written in symbols? It has a sign or a lone letter for a variable, and its words
   (two letters or more, «نق» and «ط» aside) are fewer than its signs, numbers and letters. */
function symbolic(f) {
  const toks = plain(f).split(/\s+/).filter(Boolean);
  const isWord = t => /[ء-ي]{2,}/.test(t.replace(/^(نق|ط)$/, "")) && !/^[(]?(نق|ط)[)²]*$/.test(t);
  const words = toks.filter(isWord).length, syms = toks.length - words;
  /* and no three words in a row, which is a sentence («اختيار عشوائي والترتيب غير هام») */
  const sentence = toks.some((t, i) => i >= 2 && isWord(t) && isWord(toks[i - 1]) && isWord(toks[i - 2]));
  return /[=×÷+−<>≤≥√^²³]|(^|\s)[ء-ي](\s|$)/.test(f) && syms > words && !sentence;
}
/* a rule as an answer: its words (and the symbols when they differ), then the card's example */
/* the example that answers for a rule: the one EX adds (it completes or corrects the card's),
   else the card's own */
const exampleOf = r => r.ex ? r.ex.ex : r.card ? r.card.example : null;
/* What a rule's «when» line is. Most say when to use the rule; 23 of the data's are something
   else, and «متى تستخدمه: مثال: ٢٫٤٥ + ١٫٢٠ = ٣٫٦٥» answers «when» with a sum: an example (it opens
   on «مثال:» or is a worked line, a number then «=», «←» or «⇐»), the shape of a sum in a question
   («١ + ٢ + ٣ + … + س»), the first terms of a list («٢ ، ٣ ، ٥ ، ٧ …»), or the order of a table's
   pairs («(المجموع / زاوية المنتظم)»). Each is printed under its own label. */
function whenOf(r) {
  const w = plain(r.when);
  if (/^مثال\s*:?/.test(w)) return { lab: "مثال", text: w.replace(/^مثال\s*:?\s*/, ""), ex: true };
  if (/^[٠-٩√(]/.test(w) && /[=←⇐]/.test(w)) return { lab: "مثال", text: w, ex: true };
  if (/^[٠-٩]/.test(w) && /\.\.\.|…/.test(w)) return /\+/.test(w) ? { lab: "شكله في السؤال", text: w } : { lab: "أوّلها", text: w };
  if (/^\([^٠-٩]*\)$/.test(w)) return { lab: "ترتيب القيم", text: w.slice(1, -1) };
  return { lab: "متى تستخدمه", text: w };
}
/* the line under a rule: «متى تستخدمه:», or what the data's line really is; an example says
   «مثال آخر» when the card already gives one */
const whenHtml = (r, hasEx) => { const k = whenOf(r);
  return `  <p><span class="lab">${k.ex && hasEx ? "مثال آخر" : k.lab}:</span> ${T(k.text)}</p>
`; };
/* A formula's own inline example («أ^م × أ^ن = أ^(م+ن) مثال: ٤³ × ٤⁵ = ٤⁸») is cut off when the
   answer gives an example of its own, so «مثال:» is said once. An angle named by its number in a
   figure («ق(٣) = ق(٥)») is never an answer's symbols: an answer is read without the figure. */
const noInlineEx = f => f.replace(/\s*[،,]?\s*مثال:[\s\S]*$/, "").trim();
const FIG_NUM = /ق\([٠-٩]\)/;
/* Does the formula say more than its words? Not when it is the same line reworded: their letters
   match in order by 0.7 or more («الاحتمال = عدد ما تريده ÷ عدد كل النواتج» against «… عدد نواتج
   الحدث ÷ عدد النواتج كلها»), unless it brings a term the words do not have («م.م.أ»); nor when
   every word of it is in the words already, which drops a qualifier («القاعدة × الارتفاع» after
   «القاعدة × الارتفاع العمودي»). */
const toks = t => plain(t).replace(/[«»().،:؟!—]/g, " ").split(/\s+/).filter(Boolean);
function lcs(a, b) { const d = Array(b.length + 1).fill(0);
  for (const x of a) { let prev = 0; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = x === b[j - 1] ? prev + 1 : Math.max(d[j], d[j - 1]); prev = t; } }
  return d[b.length]; }
const likeness = (a, b) => { const x = [...plain(a)], y = [...plain(b)]; return 2 * lcs(x, y) / (x.length + y.length || 1); };
const bareWord = t => t.replace(/^(وال|ال|و)(?=.{2})/, "");
function saysMore(f, w) {
  const ws = new Set(toks(w).map(bareWord));
  const fresh = toks(f).filter(t => /[ء-ي]/.test(t)).filter(t => !ws.has(bareWord(t)));
  if (!fresh.length) return false;
  /* a new term: an abbreviation («م.م.أ») or a letter for a variable */
  const term = fresh.some(t => /^[ء-ي](\.[ء-ي])+\.?$|^[ء-ي][₀-₉]?$/.test(t));
  return likeness(f, w) < 0.7 || term;
}
function ruleAnswer(r) {
  const cond = (r.ex && r.ex.cond ? " " + endStop(plain(r.ex.cond)) : "") + (r.except ? " " + endStop(plain(r.except.text)) : ""), ex = exampleOf(r);
  const tailEx = ex ? ` مثال: ${endStop(plain(ex))}` : "";
  const fOf = () => { const f = plain(r.formula); return tailEx ? noInlineEx(f) || f : f; };
  if (r.card) {
    const w = plain(r.card.plain), f = fOf();
    if (w === f || FIG_NUM.test(f)) return `${endStop(w)}${cond}${tailEx}`;
    /* the formula another way only when it is one (an equation or an inequality), not a phrase
       of when to use it («اختيار عشوائي والترتيب غير هام») */
    if (symbolic(f)) return `${endStop(`${w} (بالرموز: ${f})`)}${cond}${tailEx}`;
    return `${endStop(w)}${/[=<>≤≥×÷]/.test(f) && saysMore(f, w) ? ` وبصيغة أخرى: ${endStop(f)}` : ""}${cond}${tailEx}`;
  }
  const k = whenOf(r);
  /* an example in place of «when»: said once, as the answer's example */
  if (k.ex) return `${endStop(fOf())}${cond}${tailEx || ` مثال: ${endStop(k.text)}`}`;
  return `${endStop(fOf())}${cond} ${k.lab}: ${endStop(k.text)}${tailEx}`;
}
/* the formula alone, for a description: the part after its last colon when that part is the
   equation («ربّع ربّع و اجمع ثم خذ الجذر: الوتر = √(أ² + ب²)» → «الوتر = √(أ² + ب²)») */
const cleanF = r => { const f = plain(r.formula), i = f.lastIndexOf(":"), after = f.slice(i + 1).trim();
  return i > 0 && /=/.test(after) && !/=/.test(f.slice(0, i)) && /^[ء-ي]/.test(after) ? after : f; };
/* the rule in one line, for a lead or a description */
const ruleLine = r => plain(r.card ? r.card.plain : r.formula);

/* ------------------------------------------------------------------ page parts */
/* The site's Organization and WebSite, copied node for node from about.html (the page about
   us, whose node says who we are and that we are not ETEC's «اختبارات قدراتي»), so every page
   states one entity: engines merge nodes by @id, and a cut-down copy here would say less. A
   change to about.html's nodes makes these pages out of date until this build runs again. */
function siteNodes() {
  const html = fs.readFileSync(path.join(ROOT, "about.html"), "utf8");
  const nodes = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap(m => { const j = JSON.parse(m[1]); return j["@graph"] || [j]; });
  const get = id => { const n = nodes.find(x => x["@id"] === SITE + id); if (!n) throw new Error(`about.html has no JSON-LD node ${SITE + id}`); const { "@context": _, ...rest } = n; return rest; };
  const org = get("/#org");
  for (const k of ["name", "alternateName", "url", "logo", "description", "disambiguatingDescription"]) if (!org[k]) throw new Error(`about.html's Organization has no ${k}`);
  return { ORG: org, WEBSITE: get("/#website") };
}
const { ORG, WEBSITE } = siteNodes();
const HUB_URL = SITE + "/qudrat/";
/* the hub as every page names it: the same name, url and description on the hub and on each
   lesson page that is part of it, so the node never says two things */
const hubDesc = M => fit([`دروس القسم الكمي في قدراتي: ${nLessons(M.totals.lessons)} في ${toAr(M.totals.units)} وحدات، لكل درس قوانينه بالصيغة والمثال وأسئلة أصلية محلولة. ${M.units.map(u => plain(u.title)).join("، ")}.`,
  `دروس القسم الكمي في قدراتي: ${nLessons(M.totals.lessons)} في ${toAr(M.totals.units)} وحدات، لكل درس قوانينه بالصيغة والمثال وأسئلة أصلية محلولة، مجاناً.`]);
const hubNode = M => ({ "@type": "CollectionPage", "@id": HUB_URL + "#collection", name: "دروس القسم الكمي في اختبار القدرات", url: HUB_URL, description: hubDesc(M) });
/* The font: Baloo Bhaijaan 2 (the release Google Fonts publishes, OFL, no reserved name; the
   licence sits beside it, qudrat/assets/OFL.txt), cut to Arabic, Latin, digits and the maths
   signs, its weight axis kept from 500 to 800 (60 KB). Every content page of the site loads
   this one file, so one download serves them all. Self-hosted and preloaded, it arrives before
   the first paint, so the text never reflows when it swaps in: with Google's CSS loaded without
   blocking, Lighthouse measured CLS 0.23 to 0.58 on these pages; with it blocking, FCP 2.9 s;
   and Google's two files leave √ ← ≈ ∛ to a fallback font, which this cut carries.
   Made from assets/fonts/baloo-bhaijaan-2.ttf with fontTools:
     fontTools.varLib.instancer: wght (500, 800), then pyftsubset --flavor=woff2 --no-hinting
     --desubroutinize --layout-features=* --unicodes=U+0020-007E,U+00A0,U+00AB,U+00B0,
     U+00B2-00B3,U+00B7,U+00B9,U+00BB-00BD,U+00D7,U+00F7,U+0600-06FF,U+200C-200F,U+2010-2027,
     U+2030-205E,U+2070-209F,U+2150-215F,U+2190-21FF,U+2212,U+221A-221B,U+2248,U+2260-2265,U+FD3E-FD3F */
const FONT = "/qudrat/assets/baloo-bhaijaan-2.woff2";
/* the file's own hash as ?v=, so the host may cache it for a year (vercel.json: /qudrat/assets/*
   with ?v= is immutable); css/content.css's @font-face must name the same URL, or the preload
   and the face are two downloads */
const FONT_URL = FONT + "?v=" + crypto.createHash("sha1").update(fs.readFileSync(path.join(ROOT, FONT))).digest("hex").slice(0, 8);
const crumbLd = (pageUrl, trail) => ({ "@type": "BreadcrumbList", "@id": pageUrl + "#breadcrumb",
  itemListElement: trail.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, ...(c.url ? { item: c.url } : {}) })) });
const faqLd = (pageUrl, faq) => ({ "@type": "FAQPage", "@id": pageUrl + "#faq",
  mainEntity: faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
/* No Quiz markup. The solved questions are on the page as text, which is what answer engines
   read; the markup would add no feature anywhere: Google removed practice problems from Search
   (announced November 2025, its documentation removed on 2026-01-06), and its Education Q&A
   takes only eduQuestionType "Flashcard", which multiple-choice questions are not, and not in
   Arabic. The brief allowed Quiz only where it matches Google's documentation, so the audit below
   refuses it. */
const imgUrls = name => ["16x9", "4x3", "1x1"].map(r => `${SITE}/qudrat/img/${name}-${r}.png`);

function crumbHtml(trail) {
  return `<nav class="crumb" aria-label="مسار الصفحة"><ol>
${trail.map((c, i) => i === 0
    ? `  <li><a href="/"><img src="/assets/app-icon/icon-192.webp" width="22" height="22" alt="">قدراتي</a></li>`
    : c.href ? `  <li><a href="${c.href}">${esc(c.name)}</a></li>` : `  <li><span aria-current="page">${esc(c.name)}</span></li>`).join("\n")}
</ol></nav>`;
}

function head({ title, desc, url, type, ld, cssV, img, imgAlt }) {
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": ld }, null, 1);
  if (json.includes("</")) throw new Error("json-ld would close its script tag");
  const og = `${SITE}/qudrat/img/${img}-16x9.png`;
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#58CC02">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="قدراتي Qudrati">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="675">
<meta property="og:image:alt" content="${esc(imgAlt)}">
<meta property="og:locale" content="ar_SA">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${og}">
<link rel="preload" href="${FONT_URL}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/content.css?v=${cssV}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/app-icon/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/app-icon/apple-touch-icon.png">
<script type="application/ld+json">
${json}
</script>
</head>`;
}

/* the site's public pages, in the footer of every generated page */
const SITE_LINKS = [
  ["/", "قدراتي — العب وتدرّب على القسم الكمي"],
  ["/qudrat/", "دروس القسم الكمي في القدرات"],
  ["/qudrat/laws.html", "قوانين القدرات كمي"],
  ["/qudrat/comparisons.html", "أسئلة المقارنة في القدرات"],
  ["/qudrat-methods.html", "أسئلة قدرات كمي مع طريقة الحل"],
  ["/qudrat-mock-test.html", "اختبار قدرات كمي تجريبي مجاني"],
  ["/qudrat-kami.html", "دليل القسم الكمي في اختبار القدرات"],
  ["/qudrat-score.html", "حساب درجة القدرات وتوزيع الدرجات"],
  ["/about.html", "عن قدراتي وطريقة كتابة الأسئلة"],
  ["/privacy.html", "الخصوصية"],
];
function foot(self, date) {
  return `
<footer class="foot">
  <h2>صفحات قدراتي</h2>
  <ul class="links">
${SITE_LINKS.filter(([h]) => h !== self).map(([h, t]) => `    <li><a href="${h}">${t}</a></li>`).join("\n")}
  </ul>
  <p class="note">قدراتي (qudrati.xyz) لعبة مستقلة للتدريب على القسم الكمي في اختبار القدرات العامة، غير تابعة لهيئة تقويم التعليم والتدريب وغير معتمدة منها، وليست <a href="${SRC.qudratiTests.url}" rel="noopener">«اختبارات قدراتي»</a> التي تقدّمها الهيئة لطلاب الصفوف من الثالث الابتدائي إلى الأول الثانوي. أسئلتها أصلية بأسلوب الاختبار ولا تمثّل أسئلة الاختبار الفعلية. <a href="/about.html#method">كيف تُكتب الأسئلة وتُراجع</a>.</p>
  <p class="updated">آخر تحديث: <time datetime="${date}">${arDate(date)}</time></p>
</footer>`;
}

function cta(h, p) {
  return `
<section class="cta" aria-labelledby="cta-h">
  <img src="/assets/app-icon/icon-192.webp" width="72" height="72" alt="">
  <h2 id="cta-h">${h}</h2>
  <p>${p}</p>
  <a class="btn" href="${SITE}/">ابدأ التدريب مجاناً</a>
</section>`;
}
/* the call to play, early on the page, in the flow (no bar, no overlay) */
const ctaIn = line => `<aside class="cta-in" aria-label="تدرّب في قدراتي">
  <p>${line}</p>
  <a class="btn" href="${SITE}/">ابدأ التدريب مجاناً</a>
</aside>`;
/* back up to the page's index, at the end of each unit on the long pages */
const upLink = t => `    <p class="up"><a href="#toc">↑ ${t}</a></p>`;
const REPORT = `<p class="note report">وجدت خطأ في سؤال أو حل؟ <a href="/about.html#corrections">هكذا تبلّغ عنه وهكذا نصحّحه</a>.</p>`;

/* A question's heading says what it asks, as a search for it would (a number alone, «السؤال ١»,
   labels nothing): its stem when short, else the stem's last question, else the stem cut at a
   word; a comparison names its two values. */
const HEAD_MAX = 90;
function qHeadText(q) {
  const cut = t => { if (t.length <= HEAD_MAX) return t; const w = t.slice(0, HEAD_MAX).replace(/\s+\S*$/, ""); return w + "…"; };
  if (q.format === "comparison") {
    /* the stem's own condition, if it has one, then the two values */
    const vs = `${plain(q.value1)} و${plain(q.value2)}`, st = plain(q.stem), both = `قارن بين ${vs}`;
    const full = /^قارن بين القيمتين:?$/.test(st) ? both : /قارن بين\s*:?$/.test(st) ? st.replace(/\s*قارن بين\s*:?$/, ` قارن بين ${vs}`) : null;
    if (full && full.length <= HEAD_MAX) return full;
    /* a stem that is no «… قارن بين:» lead-in names both values in the heading */
    if (!full && `${st.replace(/:$/, "")}: ${both}`.length <= HEAD_MAX) return `${st.replace(/:$/, "")}: ${both}`;
    if (both.length <= HEAD_MAX) return both;
    /* values too long for a heading: the stem's condition, and «قارن بين القيمتين» — never «قارن
       بين (الشرط)», which reads as if the condition were the values */
    const cond = st.match(/^قارن بين\s*\(([^()]+)\)\s*:?$/);
    const ask = cond ? `${cond[1]}، قارن بين القيمتين` : st.replace(/\s*قارن بين\s*:?$/, " قارن بين القيمتين");
    return ask.length <= HEAD_MAX && /قارن بين القيمتين$/.test(ask) ? ask : cut(st.replace(/:$/, ""));
  }
  const st = plain(q.stem);
  if (st.length <= HEAD_MAX) return st;
  const asks = st.split(/(?<=[.؟!])\s+/).filter(x => /؟\s*$/.test(x));
  const last = asks[asks.length - 1];
  return last && last.length <= HEAD_MAX && last.length >= 20 ? last : cut(st);
}
/* a choice the student can pick, without script: a radio in its label; once one is picked the
   CSS marks the right one (li.c) green and a wrong pick red, and «اعرض الحل» shows the steps */
const pickInput = (name, i) => `<label><input type="radio" name="${name}" value="${i}">`;
function questionHtml(q, label, from, CMP) {
  const answerText = q.format === "comparison" ? CMP[q.answer] : q.choices[q.answer];
  const choices = q.format === "comparison" ? CMP : q.choices;
  if (answerText == null) throw new Error("bad answer index in " + q.id);
  const isSvg = q.figure && /^\s*<svg/.test(q.figure);
  /* a short stem is the heading itself, said once */
  const whole = qHeadText(q) === plain(q.stem);
  return `<article class="qcard" id="q-${q.id}">
  <h3><span class="qn">${label}:</span> ${T(qHeadText(q))}</h3>
${from ? `  <p class="qfrom">من درس <a href="${from.href}">${esc(from.title)}</a></p>
` : ""}${q.figure ? `  <div class="qfig"${isSvg ? ' role="img" aria-label="الشكل المرافق للسؤال"' : ""}>${isSvg ? svgFig(q.figure) : q.figure}</div>\n` : ""}${whole ? "" : `  <p class="stem">${T(q.stem)}</p>`}
${q.format === "comparison" ? `  <div class="cmp"><div><span>القيمة الأولى:</span> <b>${T(q.value1)}</b></div><div><span>القيمة الثانية:</span> <b>${T(q.value2)}</b></div></div>\n` : ""}  <ol class="choices pick">
${choices.map((c, i) => `    <li${i === q.answer ? ' class="c"' : ""}>${pickInput("a-" + q.id, i)} <span class="l">${LETTERS[i]}</span> <span>${T(c)}</span></label></li>`).join("\n")}
  </ol>
  <details>
    <summary>اعرض الحل</summary>
    <div class="ans">
      <p class="ok">الإجابة الصحيحة: (${LETTERS[q.answer]}) ${T(answerText)}</p>
${q.solution.split("\n").filter(Boolean).map(s => `      <p>${T(s)}</p>`).join("\n")}
    </div>
  </details>
</article>`;
}

/* The eight angles of two parallels and a transversal, numbered as the parallel-lines rules number
   them (ق(١) … ق(٨)): at each crossing ١ and ٢ above the line, ٣ and ٤ under it, going round; ١ and
   ٤ on the right of the transversal. Read back from the rules themselves: ١ = ٥ (corresponding),
   ٣ = ٥ (alternate), ٤ + ٥ = ١٨٠ (co-interior), ١ = ٧ and ١ + ٨ = ١٨٠ (outside the parallels).
   Drawn in the cards' house style (tools/teach_figures.py). */
const ANGLE_FIG_ID = "angle-numbers";
function angleFig() {
  const top = 40, bot = 104, a = [206, 8], b = [118, 138];
  const atY = y => a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
  const len = Math.hypot(a[0] - atY(top), a[1] - top), u = [(a[0] - atY(top)) / len, (a[1] - top) / len];
  /* each angle between two rays: label on its bisector, further out in the narrow ones */
  const rays = { 1: [[1, 0], u], 2: [u, [-1, 0]], 3: [[-1, 0], [-u[0], -u[1]]], 4: [[-u[0], -u[1]], [1, 0]] };
  const f = n => n.toFixed(1);
  const labels = [];
  for (const [base, y] of [[0, top], [4, bot]]) for (const [k, [p, q]] of Object.entries(rays)) {
    const bx = p[0] + q[0], by = p[1] + q[1], m = Math.hypot(bx, by), wide = p[0] * q[0] + p[1] * q[1] < 0, d = wide ? 15 : 21;
    labels.push(`<text x="${f(atY(y) + bx / m * d)}" y="${f(y + by / m * d + 4.5)}">${toAr(base + +k)}</text>`);
  }
  return `<svg viewBox="0 0 280 146" width="280" stroke="#4B4B4B" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">` +
    `<line x1="40" y1="${top}" x2="262" y2="${top}"/><line x1="40" y1="${bot}" x2="262" y2="${bot}"/><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>` +
    `<path d="M48 ${top - 5} L54 ${top} L48 ${top + 5}"/><path d="M48 ${bot - 5} L54 ${bot} L48 ${bot + 5}"/>` +
    `<g font-size="13" font-weight="700" stroke="none" fill="#4B4B4B" text-anchor="middle">${labels.join(" ")} </g></svg>`;
}
const ANGLE_FIG = `<figure class="fig nums" id="${ANGLE_FIG_ID}">
  <div role="img" aria-label="مستقيمان متوازيان يقطعهما قاطع. عند المستقيم الأول الزاويتان ١ و٢ فوقه و٣ و٤ تحته، وعند الثاني ٥ و٦ فوقه و٧ و٨ تحته بالترتيب نفسه، و١ و٤ و٥ و٨ على يمين القاطع.">${angleFig()}</div>
  <figcaption>ترقيم الزوايا الثماني الذي تستخدمه قوانين التوازي: ق(١) إلى ق(٤) عند المستقيم الأول، وق(٥) إلى ق(٨) عند الثاني بالترتيب نفسه.</figcaption>
</figure>`;
const formulaHtml = r => `<p class="f"><span class="k">القانون:</span> ${T(r.formula)}</p>`;
function ruleCard(r) {
  const c = r.card, memo = memoRows(r);
  const showPlain = plain(c.plain) !== plain(r.formula);
  return `<section class="rule" id="${r.id}" aria-labelledby="${r.id}-h">
  <h3 id="${r.id}-h">${T(r.name)}</h3>
  ${memo ? memoTable(r, memo) : formulaHtml(r)}
${showPlain ? `  <p><span class="lab">بالكلمات:</span> ${T(c.plain)}</p>\n` : ""}  <p>${T(c.say)}</p>
${r.fig ? `  <div class="fig" role="img" aria-label="${esc(plain("رسم يوضّح: " + c.example))}">${svgFig(r.fig)}</div>\n` : ""}${condHtml(r)}  <p><span class="lab">مثال:</span> ${T(r.ex && r.ex.replace ? r.ex.ex : c.example)}</p>
${r.ex && !r.ex.replace ? `  <p><span class="lab">مثال كامل:</span> ${T(r.ex.ex)}</p>
` : ""}${whenHtml(r, true)}  <p class="hook"><span class="lab">تذكّر:</span> ${T(c.hook)}</p>
${seeHtml(r)}${trapsHtml(r.traps)}</section>`;
}
/* a rule with no teaching card: its own heading, its formula and when to use it */
function ruleMini(r) {
  return `<section class="rule sm" id="${r.id}" aria-labelledby="${r.id}-h">
  <h3 id="${r.id}-h">${T(r.name)}</h3>
  ${formulaHtml(r)}
${condHtml(r)}${r.ex ? `  <p><span class="lab">مثال:</span> ${T(r.ex.ex)}</p>
` : ""}${whenHtml(r, !!r.ex)}${seeHtml(r)}${trapsHtml(r.traps)}</section>`;
}
/* a condition the data's line leaves out */
const condHtml = r => (r.ex && r.ex.cond ? `  <p class="cond"><span class="lab">الشرط:</span> ${T(r.ex.cond)}</p>
` : "") + (r.except ? `  <p class="cond"><span class="lab">انتبه:</span> ${T(r.except.text)}${r.except.see ? ` (<a href="#${r.except.see}">${esc(r.except.seeName)}</a>)` : ""}</p>
` : "");
/* the formula in a table cell, with its condition */
const formulaCell = r => T(r.formula) + (r.ex && r.ex.cond ? ` <span class="cond">(${T(r.ex.cond)})</span>` : "")
  + (r.except ? ` <span class="cond">(${T(r.except.text.replace(/:[\s\S]*$/, ""))})</span>` : "");

function memoTable(r, memo) {
  return `<div class="tw"><table class="memo">
    <caption>${T(r.name)} في القدرات</caption>
    <thead><tr>${memo.heads.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead>
    <tbody>
${memo.rows.map(row => `      <tr>${row.map(c => `<td>${T(c)}</td>`).join("")}</tr>`).join("\n")}
    </tbody>
  </table></div>`;
}
function checkHtml(s) {
  return `<div class="check">
  <p class="q"><span class="lab">جرّب بنفسك:</span> ${T(s.q)}</p>
  <ul class="chips pick">${s.choices.map((c, i) => `<li${i === s.answer ? ' class="c"' : ""}>${pickInput("c-" + hash6(s.q + "|" + s.choices.join("|")), i)} <span>${T(c)}</span></label></li>`).join("")}</ul>
  <details><summary>الجواب</summary><div class="ans"><p class="ok">${T(s.choices[s.answer])}</p><p>${T(s.why)}</p></div></details>
</div>`;
}
const trapHtml = t => `<p class="trap"><span class="lab">الفخ:</span> ${T(t)}</p>`;
/* the traps of a rule sit in its card; the ones no single rule owns close the chunk under their
   own heading, so none reads as part of the card above it */
const trapsHtml = ts => ts && ts.length ? `  <div class="traps">\n${ts.map(t => "  " + trapHtml(t)).join("\n")}\n  </div>\n` : "";
function chunkHtml(c) {
  return [
    ...c.rules.map(ruleCard),
    ...c.checks.filter(s => !s.trap).map(checkHtml),
    ...(c.free.length ? [`<div class="traps free">\n  <h4>فخاخ هذا الجزء</h4>\n${c.free.map(trapHtml).join("\n")}\n</div>`] : []),
  ].join("\n");
}
/* a rule that is another lesson's whole subject points to that lesson */
const seeHtml = r => r.see ? `  <p class="see"><span class="lab">الشرح الكامل:</span> <a href="${r.see.l.href}#${r.see.r.id}">${esc(r.see.l.h)}</a></p>\n`
  : r.seePage ? `  <p class="see"><span class="lab">الشرح الكامل:</span> <a href="${r.seePage[0]}">${esc(r.seePage[1])}</a></p>\n` : "";

/* ------------------------------------------------------------------ lesson page */
function lessonFaq(l) {
  const faq = [{ q: `ما أهم قوانين ${l.t} في القدرات؟`,
    a: `أهمها ${joinTitles(l.top.map(x => bare(x.r.name)).slice(0, -1))} و${bare(l.top[l.top.length - 1].r.name)}. وفي هذه الصفحة ${nRules(l.rules.length)} للدرس، كل قانون تحت عنوانه بصيغته ومتى تستخدمه.` }];
  for (const { r, q } of l.top) {
    const a = ruleAnswer(r);
    /* an answer about «المعطيات غير كافية» must show a case that is not enough, never one that is */
    if (/غير كافية/.test(q) && !/المعطيات غير كافية\.$/.test(a)) throw new Error(`${l.tk}: the FAQ «${q}» ends on an example that is not «المعطيات غير كافية»: ${a}`);
    faq.push({ q, a });
  }
  if (l.traps[0]) faq.push({ q: `ما الفخ في أسئلة ${l.t} في القدرات؟`, a: endStop(plain(l.traps[0])) });
  if (l.tricks && l.tricks[0]) faq.push({ q: `كيف أحل أسئلة ${l.t} بسرعة في القدرات؟`, a: endStop(plain(l.tricks[0])) });
  return faq;
}
/* What reads badly in a title or a description, or null. A title is cut at «—» and «|»: no
   word may stand in two of its parts («قوانين الدائرة في القدرات — قوانين وأسئلة محلولة»).
   A description: no pair of words twice («مساحة الدائرة — مساحة الدائرة»), one colon at most,
   no «و» standing alone before a word. */
const STOP = new Set(["في", "و", "من", "مع", "قدراتي", "القدرات", "قدرات", "كمي", "الكمي", "على", "إلى", "أو"]);
const words = s => plain(s).replace(/[«»().،:؟!—|/]/g, " ").split(/\s+/).filter(Boolean)
  .map(w => w.replace(/^(وال|بال|ال|و)(?=.{3})/, "").replace(/^قوانين$/, "قانون"));
function badTitle(t) {
  const parts = t.split(/\s[—|]\s/).map(p => new Set(words(p).filter(w => !STOP.has(w) && w.length > 2)));
  for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) for (const w of parts[i]) if (parts[j].has(w)) return `«${w}» in two parts of the title`;
  return null;
}
function badDesc(d) {
  if ((d.match(/:/g) || []).length > 1) return "two colons";
  if (/(^|\s)و\s+[ء-ي]/.test(d)) return "«و» standing alone";
  /* a phrase said again within three words, with no sign between («مساحة الدائرة — مساحة
     الدائرة», «ضرب الأعداد العشرية وقسمة الأعداد العشرية»); a formula may repeat a term
     («ط × نصف القطر × نصف القطر») and a law may name its own term («… : عدد المصافحات =») */
  const ws = plain(d).replace(/[«»(),،:؟!—–|/]|\.(?=\s|$)/g, " ").split(/\s+/).filter(Boolean);
  for (let i = 1; i < ws.length; i++) {
    if (ws[i] === ws[i - 1] && !/^[٠-٩]+$/.test(ws[i])) return `«${ws[i]}» twice in a row`;
    for (let j = i + 2; j <= i + 4 && j < ws.length; j++) {
      if (ws[j] !== ws[i] || ws[j - 1] !== ws[i - 1] || STOP.has(ws[i]) || /^[٠-٩=×÷+−←]+$/.test(ws[i]) || /^[=×÷+−←]$/.test(ws[i - 1])) continue;
      if (!ws.slice(i + 1, j - 1).some(w => /^[=×÷+−←]$/.test(w))) return `«${ws[i - 1]} ${ws[i]}» twice`;
    }
  }
  return null;
}
/* the first of these that fits in 158 characters and reads well */
const fit = (list, max = 158) => {
  const why = [];
  for (const x of list.map(plain)) { const bad = x.length > max ? `${x.length} characters` : badDesc(x); if (!bad) return x; why.push(`${bad}: ${x}`); }
  throw new Error("no description fits:\n  " + why.join("\n  "));
};

/* the rule sections of a page, and how many of them show a labelled example */
function exampleCount(html) {
  const secs = html.split('<section class="rule').slice(1).map(x => x.slice(0, x.indexOf("</section>")));
  return { secs: secs.length, ex: secs.filter(x => /<span class="lab">مثال[^<:]*:<\/span>/.test(x)).length };
}
function lessonPageCounted(l, M, dates, cssV) {
  let html = lessonPage(l, M, dates, cssV), c = exampleCount(html);
  if (c.secs !== l.rules.length) throw new Error(`${l.slug}: ${c.secs} rule sections for ${l.rules.length} rules`);
  if (c.ex !== l.nEx) { l.nEx = c.ex; html = lessonPage(l, M, dates, cssV); c = exampleCount(html); }
  if (c.ex !== l.nEx) throw new Error(`${l.slug}: says ${l.nEx} rules with an example, shows ${c.ex}`);
  return html;
}
function lessonPage(l, M, dates, cssV) {
  const url = l.url, head1 = l.top[0].r;
  /* «قوانين الدائرة …» already says «قوانين»: its suffix says what else the page has */
  const titles = l.h.length <= 38 ? ["قوانين وأسئلة محلولة", "شرح وأسئلة محلولة", "قوانين وأمثلة محلولة", "شرح وأمثلة محلولة"].map(x => `${l.h} — ${x} | قدراتي`) : [`${l.h} | قدراتي`];
  const title = titles.find(t => !badTitle(t));
  if (!title) throw new Error(`${l.slug}: ${badTitle(titles[0])}: ${titles[0]}`);
  /* the rules shown with a «مثال» line, counted on the page itself (lessonPageCounted): a short
     card's «متى تستخدمه» that is really an example shows one too */
  const nCards = l.nEx != null ? l.nEx : l.rules.filter(r => exampleOf(r)).length;
  const tail = `${nRules(l.rules.length)} بصيغها ومتى تُستخدم، ${nCards === l.rules.length ? "كلها" : toAr(nCards) + " منها"} بمثال، و${nQsA(l.practice.length, "hal")}.`;
  const tailShort = `${nRules(l.rules.length)} و${nQsA(l.practice.length, "hal")}.`;
  const sep = /:/.test(l.h) ? " — " : ": ";
  /* `open1` (META) words the opening for a page searched for something else than its first rule's name */
  const O1 = l.open1 || {};
  const name1 = O1.name || bare(head1.name), line1 = O1.line ? O1.line(head1) : ruleLine(head1);
  /* the rule's line already names it («مساحة الدائرة = …»): say it once */
  const body1 = line1.includes(name1) || l.h.includes(name1) || /^حكم\s/.test(name1) ? line1 : `${name1} — ${line1}`;
  /* a table or a list to memorise is no «قانون» («جدول الأسس المشهورة», «الجذور التربيعية المشهورة») */
  const lawOf = O1.law || (/^(قانون|قوانين|قاعدة|حكم|جدول)\s|المشهورة$/.test(name1) ? name1 : `قانون ${name1}`);
  const desc = fit([
    ...(sep === ": " ? [`${l.h}: ${body1}. ${tail}`, `${l.h}: ${body1}. ${tailShort}`, `${l.h}: ${name1} — ${cleanF(head1)}. ${tailShort}`] : []),
    ...(l.descNames ? [] : [`${lawOf} في القدرات: ${cleanF(head1)}. ${tail}`, `${lawOf} في القدرات: ${cleanF(head1)}. ${tailShort}`]),
    `${l.h}${sep}${joinTitles(l.top.slice(0, 3).map(x => bare(x.r.name)))}. ${tail}`,
    `${l.h}${sep}${name1} و${bare((l.top[1] || l.top[0]).r.name)}. ${tail}`,
    `${l.h}. ${tail}`,
  ]);
  const faq = lessonFaq(l);
  const trail = [{ name: "قدراتي", url: SITE + "/", href: "/" }, { name: "دروس القسم الكمي", url: HUB_URL, href: "/qudrat/" }, { name: plain(l.title) }];
  const ld = [
    { "@type": ["Article", "LearningResource"], "@id": url + "#lesson", headline: l.h, name: plain(l.title), description: desc, inLanguage: "ar",
      url, mainEntityOfPage: url, datePublished: dates.published, dateModified: dates.modified, image: imgUrls(l.slug),
      author: { "@id": SITE + "/#org" }, publisher: { "@id": SITE + "/#org" }, isPartOf: hubNode(M),
      learningResourceType: "درس", isAccessibleForFree: true, teaches: l.rules.filter(r => !isNote(r.orig) && !isNote(r.name)).map(r => bare(r.name)),
      about: { "@type": "Thing", name: `${l.t} — القسم الكمي في اختبار القدرات العامة` } },
    ORG, WEBSITE, crumbLd(url, trail), faqLd(url, faq),
  ];
  const toc = [["rules", "القوانين مع أمثلة"], ...(l.memo.length ? [["memo", "جداول للحفظ"]] : []), ...(l.rest.length ? [["more", "بقية القوانين"]] : []),
    ...(l.tricks.length ? [["tricks", "حيل الحل"]] : []), ["practice", "أسئلة محلولة"], ["faq", "أسئلة شائعة"]];
  const sameUnit = l.unitLessons.filter(x => x !== l && x !== l.prev && x !== l.next);
  return `${head({ title, desc, url, type: "article", ld, cssV, img: l.slug, imgAlt: `${l.h} — ${bare(head1.name)}` })}
<body>
<a class="skip" href="#main">انتقل إلى المحتوى</a>
<div class="page">
${crumbHtml(trail)}
<main id="main">
<article>
  <p class="kicker">الوحدة ${toAr(l.unitN)}: ${esc(l.unitTitle)} — الدرس ${toAr(l.n)}</p>
  <h1>${esc(l.h)}</h1>
  <p class="lead"><a href="#${head1.id}">${T(lawOf)}</a> في القدرات: ${T(line1)}.${O1.ex !== false && exampleOf(head1) ? ` مثال: ${T(exampleOf(head1))}` : ""}</p>
  <p>في هذه الصفحة ${nRules(l.rules.length)} من درس «${esc(l.title)}» في قدراتي، كل قانون تحت عنوانه بصيغته ومتى تستخدمه، ${toAr(nCards)} منها بالشرح والمثال، ثم ${nQsA(l.practice.length, "asl")} بأسلوب الاختبار مع الحل خطوة بخطوة.</p>
  <p class="note"><span class="lab">هدف الدرس:</span> ${T(l.goal)}</p>
  <nav class="toc" aria-label="في هذه الصفحة"><ul>
${toc.map(([id, t]) => `    <li><a href="#${id}">${t}</a></li>`).join("\n")}
  </ul></nav>
${ctaIn(`تدرّب على ${esc(l.t)} بأسئلة بأسلوب الاختبار في لعبة قدراتي — مجاناً وبدون تسجيل.`)}

  <h2 id="rules">قوانين ${esc(l.t)} مع أمثلة</h2>
${l.rules.some(r => FIG_NUM.test(r.formula)) ? `  <p>بعض قوانين هذا الدرس تسمّي الزوايا بأرقامها، وهذا ترقيمها:</p>
${ANGLE_FIG}
` : ""}${l.chunks.map(chunkHtml).join("\n")}
${l.memo.length ? `
  <h2 id="memo">جداول ${esc(l.t)} للحفظ</h2>
${l.memo.map(r => `<section class="rule" id="${r.id}" aria-labelledby="${r.id}-h">
  <h3 id="${r.id}-h">${T(r.name)}</h3>
  ${memoTable(r, memoRows(r))}
${whenHtml(r, false)}</section>`).join("\n")}` : ""}
${l.rest.length ? `
  <h2 id="more">بقية قوانين ${esc(l.t)}</h2>
  <p>${nOther(l.rest.length)} في درس «${esc(l.title)}»، كلٌّ بصيغته ومتى تستخدمه.</p>
${l.rest.map(ruleMini).join("\n")}` : ""}
${l.tricks.length ? `
  <h2 id="tricks">حيل تختصر حل أسئلة ${esc(l.t)}</h2>
  <ul class="tips">
${l.tricks.map(t => `    <li>${T(t)}</li>`).join("\n")}
  </ul>` : ""}

  <h2 id="practice">أسئلة ${esc(l.t)} محلولة</h2>
  <p>${nQsA(l.practice.length, "asl")} من بنك قدراتي، بأسلوب الاختبار. حلّها أولاً، ثم افتح الحل.</p>
  <div class="qs">
${l.practice.map((q, i) => questionHtml(q, `السؤال ${toAr(i + 1)}`, null, M.D.CMP)).join("\n")}
  </div>
  ${REPORT}
  <p>المزيد: <a href="/qudrat-methods.html#${l.key}">سؤالان آخران على ${esc(l.t)} مع طريقة الحل</a>، و<a href="/qudrat-mock-test.html">اختبار قدرات كمي تجريبي مجاني</a> بمؤقّت.</p>

  <h2 id="faq">أسئلة شائعة عن ${esc(l.t)} في القدرات</h2>
  <dl class="faq">
${faq.map(f => `    <dt>${T(f.q)}</dt>\n    <dd>${T(f.a)}</dd>`).join("\n")}
  </dl>

  <h2 id="related">دروس ذات صلة</h2>
  <div class="pn">
    ${l.prev ? `<a href="${l.prev.href}" rel="prev">${esc(l.prev.h)} <span>الدرس السابق</span></a>` : `<a href="/qudrat/">دروس القسم الكمي <span>كل الدروس</span></a>`}
    ${l.next ? `<a class="next" href="${l.next.href}" rel="next">${esc(l.next.h)} <span>الدرس التالي</span></a>` : `<a class="next" href="/qudrat/laws.html">قوانين القدرات كمي <span>للمراجعة</span></a>`}
  </div>
  <ul class="links" style="margin-top:12px">
${sameUnit.map(x => `    <li><a href="${x.href}">${esc(x.h)}</a></li>`).join("\n")}
    <li><a href="/qudrat/laws.html#${l.key}">قوانين ${esc(l.t)} في ورقة القوانين</a></li>
${l.questions.some(q => q.format === "comparison") ? `    <li><a href="/qudrat/comparisons.html">أسئلة المقارنة في القدرات</a></li>\n` : ""}  </ul>
${cta(`تدرّب على ${esc(l.t)} في قدراتي`,
  `«${esc(l.title)}» هو الدرس ${toAr(l.n)} من وحدة «${esc(l.unitTitle)}» في لعبة قدراتي، ومعه ${nQsA(l.questions.length, "asl")} بالحل.${l.short.length ? ` يُقسَم في اللعبة إلى ${nLessons(l.short.length)} قصيرة: ${esc(joinTitles(l.short))}.` : ""} الدروس تُفتح بالترتيب، واختبار تحديد المستوى يتخطّى بك ما تعرفه. مجاناً وبدون تسجيل.`)}
</article>
</main>
${foot(l.href, dates.modified)}
</div>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ hub */
function hubPage(M, dates, cssV) {
  const { units, all, totals } = M;
  const url = HUB_URL;
  const h1 = `دروس القسم الكمي في اختبار القدرات — ${nLessons(totals.lessons)} بالقوانين والأمثلة المحلولة`;
  const title = `دروس القسم الكمي في القدرات: ${nLessons(totals.lessons)} و${nRules(totals.rules)} | قدراتي`;
  const desc = hubDesc(M);
  const trail = [{ name: "قدراتي", url: SITE + "/", href: "/" }, { name: "دروس القسم الكمي" }];
  const ld = [
    { ...hubNode(M), headline: h1, inLanguage: "ar", isPartOf: { "@id": SITE + "/#website" },
      datePublished: dates.published, dateModified: dates.modified, publisher: { "@id": SITE + "/#org" }, image: imgUrls("lessons"),
      mainEntity: { "@type": "ItemList", "@id": url + "#lessons", numberOfItems: all.length,
        itemListElement: all.map((l, i) => ({ "@type": "ListItem", position: i + 1, name: l.h, url: l.url })) } },
    ORG, WEBSITE, crumbLd(url, trail),
  ];
  return `${head({ title, desc, url, type: "website", ld, cssV, img: "lessons", imgAlt: h1 })}
<body>
<a class="skip" href="#main">انتقل إلى المحتوى</a>
<div class="page">
${crumbHtml(trail)}
<main id="main">
  <h1>${esc(h1)}</h1>
  <p class="lead">في قدراتي ${nLessons(totals.lessons)} للقسم الكمي في ${toAr(totals.units)} وحدات، فيها ${nRules(totals.rules)} و${nQsA(totals.questions, "asl")} بالحل. لكل درس صفحة هنا: قوانينه بالصيغة والكلمات والمثال، وجداول ما يُحفظ، وحيل الحل، وأسئلة محلولة.</p>
  <p>تغطي الدروس الحساب والجبر والهندسة والإحصاء كما رتّبها قدراتي، ولا يوجد بعد درس مستقل لتفسير البيانات والرسوم البيانية (<a href="/qudrat-kami.html#content">ما يغطيه قدراتي من مفاهيم الدليل الرسمي</a>). وللتدرّب بمؤقّت: <a href="/qudrat-mock-test.html">اختبار قدرات كمي تجريبي مجاني</a>.</p>
  <nav class="toc" aria-label="الوحدات"><ul>
${units.map(u => `    <li><a href="#${u.key}">${esc(u.title)}</a></li>`).join("\n")}
    <li><a href="/qudrat/laws.html">ورقة القوانين</a></li>
    <li><a href="/qudrat/comparisons.html">أسئلة المقارنة</a></li>
  </ul></nav>
${ctaIn("تدرّب على هذه الدروس بالترتيب في لعبة قدراتي، واختبار تحديد المستوى يتخطّى بك ما تعرفه — مجاناً وبدون تسجيل.")}
${units.map(u => `
  <section class="unit" id="${u.key}" aria-labelledby="${u.key}-h">
    <h2 id="${u.key}-h">الوحدة ${toAr(u.n)}: ${esc(u.title)}</h2>
    <p>${nLessons(u.lessons.length)}، ${nRules(u.lessons.reduce((n, l) => n + l.rules.length, 0))}، ${nQs(u.lessons.reduce((n, l) => n + l.questions.length, 0))}.</p>
    <ul class="cards two">
${u.lessons.map(l => `      <li><a href="${l.href}"><span class="t">${esc(l.h)}</span> <span class="m">الدرس ${toAr(l.n)} — ${nRules(l.rules.length)}، ${nQs(l.questions.length)}</span> <span class="s">${T(bare(l.top[0].r.name))}: ${T(ruleLine(l.top[0].r))}</span></a></li>`).join("\n")}
    </ul>
  </section>`).join("\n")}
${cta("تدرّب على هذه الدروس وأنت تلعب", `قدراتي لعبة مجانية على طريقة دولينجو: دروس قصيرة، وأسئلة بأسلوب الاختبار ومؤقّت بإيقاعه، ومراجعة لأخطائك، و<a href="/qudrat-mock-test.html">اختبار تجريبي</a> من قسمين بمؤقّت ${toAr(25)} دقيقة لكل قسم. بدون تسجيل.`)}
</main>
${foot("/qudrat/", dates.modified)}
</div>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ laws */
function lawsPage(M, dates, cssV) {
  const { units, all, totals } = M;
  const url = SITE + "/qudrat/laws.html";
  const byKey = new Map(all.map(l => [l.key, l]));
  const top = LAWS_TOP.map(([k, name]) => {
    const l = byKey.get(k), r = l && l.rules.find(x => x.orig === name);
    if (!r) throw new Error(`LAWS_TOP: no rule «${name}» in ${k}`);
    return { l, r };
  });
  const h1 = `قوانين القدرات كمي — ${nRules(totals.rules)} في ${nLessons(totals.lessons)}`;
  const title = `قوانين القدرات كمي: ${nRules(totals.rules)} في ${nLessons(totals.lessons)} | قدراتي`;
  const desc = fit([`قوانين القدرات كمي في ورقة: ${nRules(totals.rules)} في ${nLessons(totals.lessons)}، من المصافحات وزاوية الساعة إلى النسبة المئوية والدائرة، كل قانون بصيغته ورابط لدرسه.`]);
  const domains = ["حساب", "جبر", "هندسة"].map(d => ({ d, lessons: all.filter(l => l.d.includes(d)) }));
  const lessonsLink = ls => ls.map(l => `<a href="${l.href}">${esc(l.t)}</a>`).join("، ");
  const faq = [
    { q: "كم عدد قوانين القدرات الكمي في قدراتي؟", a: `${nRules(totals.rules)} في ${nLessons(totals.lessons)}، مرتّبة في ${toAr(totals.units)} وحدات: ${units.map(u => `${plain(u.title)} (${nRules(u.lessons.reduce((n, l) => n + l.rules.length, 0))})`).join("، ")}.` },
    { q: "ما أهم قوانين القدرات الكمي؟", a: `من أهمها: ${joinTitles(top.slice(0, 10).map(x => bare(x.r.name)))}. وصيغة كل واحد في جدول «أهم قوانين القدرات الكمي» أعلى هذه الصفحة.` },
    { q: "هل أستطيع طباعة قوانين القدرات؟", a: "نعم. اطبع هذه الصفحة من المتصفح أو احفظها ملف PDF، فتخرج القوانين جداول بلا قوائم ولا أزرار." },
    { q: "هل تغطي هذه القوانين القسم الكمي كله؟", a: "لا. تغطي الحساب والجبر والهندسة والإحصاء كما في دروس قدراتي، ولا يوجد بعد درس لتفسير البيانات (الأعمدة والقطاعات والجداول وأشكال فِن)، ولا لمقياس الرسم والتحويل بين العملات، وهي من مفاهيم الدليل الإرشادي الرسمي." },
  ];
  const trail = [{ name: "قدراتي", url: SITE + "/", href: "/" }, { name: "دروس القسم الكمي", url: HUB_URL, href: "/qudrat/" }, { name: "قوانين القدرات كمي" }];
  const ld = [
    { "@type": "Article", "@id": url + "#article", headline: h1, description: desc, inLanguage: "ar", url, mainEntityOfPage: url,
      datePublished: dates.published, dateModified: dates.modified, image: imgUrls("laws"),
      author: { "@id": SITE + "/#org" }, publisher: { "@id": SITE + "/#org" }, isPartOf: { "@id": SITE + "/#website" },
      about: { "@type": "Thing", name: "قوانين القسم الكمي في اختبار القدرات العامة" },
      mentions: { "@id": url + "#lessons" },
      citation: { "@type": "CreativeWork", name: SRC.guide.name, url: guideAt(5), publisher: ETEC } },
    { "@type": "ItemList", "@id": url + "#lessons", name: "دروس القسم الكمي التي تجمع هذه القوانين", numberOfItems: all.length,
      itemListElement: all.map((l, i) => ({ "@type": "ListItem", position: i + 1, name: l.h, url: l.url })) },
    ORG, WEBSITE, crumbLd(url, trail), faqLd(url, faq),
  ];
  const rel = l => l.href.replace("/qudrat/", "");
  return `${head({ title, desc, url, type: "article", ld, cssV, img: "laws", imgAlt: h1 })}
<body>
<a class="skip" href="#main">انتقل إلى المحتوى</a>
<div class="page">
${crumbHtml(trail)}
<main id="main">
<article>
  <h1>${esc(h1)}</h1>
  <p class="lead">قوانين القسم الكمي في قدراتي في ورقة واحدة، مرتّبة بالوحدة والدرس: اسم القانون وصيغته. اضغط اسم أي قانون لتفتح درسه بالشرح والمثال ومتى تستخدمه، أو اطبع الصفحة واحفظها PDF من المتصفح لتراجعها قبل الاختبار.</p>
  <p class="note">لا تغطي القسم الكمي كله بعد: <a href="#domains">لا درس لتفسير البيانات</a>.</p>
  <nav class="toc" id="toc" aria-label="في هذه الصفحة"><ul>
    <li><a href="#top">أهم القوانين</a></li>
    <li><a href="#domains">المجالات الرسمية</a></li>
${units.map(u => `    <li><a href="#${u.key}">${esc(u.title)}</a></li>`).join("\n")}
    <li><a href="#faq">أسئلة شائعة</a></li>
  </ul></nav>
${ctaIn("احفظ هذه القوانين بالتطبيق: في لعبة قدراتي يأتي كل قانون في درسه، ثم أسئلة بأسلوب الاختبار — مجاناً وبدون تسجيل.")}

  <h2 id="top">أهم قوانين القدرات الكمي</h2>
  <p>${nRules(top.length)} من الوحدات الأربع: من المصافحات وزاوية الساعة إلى النسبة المئوية وفيثاغورس والدائرة، كلٌّ برابط إلى شرحه ومثاله في درسه.</p>
  <div class="tw"><table class="laws">
    <caption>أهم قوانين القسم الكمي في اختبار القدرات</caption>
    <thead><tr><th scope="col">القانون</th><th scope="col">الصيغة</th></tr></thead>
    <tbody>
${top.map(({ l, r }) => `      <tr><th scope="row"><a href="${rel(l)}#${r.id}">${T(r.name)}</a></th><td>${formulaCell(r)}</td></tr>`).join("\n")}
    </tbody>
  </table></div>

  <h2 id="domains">مجالات القسم الكمي الرسمية ودروس قدراتي</h2>
  <p>يقسم <a href="${guideAt(5)}" rel="noopener">الدليل الإرشادي لاختبار القدرات العامة</a> الجزء الكمي إلى أربعة مجالات: الحساب والهندسة والجبر وتفسير البيانات، ويذكر مفاهيم كل مجال <a href="${guideAt(6)}" rel="noopener">في الصفحة السادسة</a>. هذا الجدول يضع دروس قدراتي تحت المجالات بحسب موضوعها، وهو تصنيف منّا لا من الدليل. ونسبة كل مجال في الاختبار في <a href="/qudrat-kami.html#share">دليل القسم الكمي</a>.</p>
  <div class="tw"><table>
    <caption>المجالات الأربعة ودروس قدراتي</caption>
    <thead><tr><th scope="col">المجال</th><th scope="col">دروس قدراتي</th></tr></thead>
    <tbody>
${domains.map(({ d, lessons }) => `      <tr><th scope="row">${d === "حساب" ? "الحساب" : d === "جبر" ? "الجبر" : "الهندسة"}</th><td>${lessonsLink(lessons)}</td></tr>`).join("\n")}
      <tr><th scope="row">تفسير البيانات</th><td>لا يوجد درس بعد. المتوسط والوسيط والمنوال في درس <a href="/qudrat/probability-statistics.html">الإحصاء والاحتمالات</a>، لكن قراءة الأعمدة والقطاعات والجداول وأشكال فِن لا درس لها، ولا مقياس الرسم والتحويل بين العملات من مفاهيم الحساب.</td></tr>
    </tbody>
  </table></div>
${units.map(u => `
  <section class="unit" id="${u.key}" aria-labelledby="${u.key}-h">
    <h2 id="${u.key}-h">الوحدة ${toAr(u.n)}: ${esc(u.title)}</h2>
${u.lessons.map(l => `    <h3 id="${l.key}" class="lh"><a href="${rel(l)}">${esc(l.h)}</a></h3>
${l.rules.some(r => FIG_NUM.test(r.formula)) ? `    ${ANGLE_FIG}
` : ""}    <div class="tw"><table class="laws">
      <caption>${nRules(l.rules.length)} في درس «${esc(l.title)}»</caption>
      <thead><tr><th scope="col">القانون</th><th scope="col">الصيغة</th></tr></thead>
      <tbody>
${l.rules.map(r => `<tr><th scope="row"><a href="${rel(l)}#${r.id}">${T(r.name)}</a></th><td>${formulaCell(r)}</td></tr>`).join("\n")}
      </tbody>
    </table></div>`).join("\n")}
${upLink("فهرس القوانين")}
  </section>`).join("\n")}

  <h2 id="faq">أسئلة شائعة عن قوانين القدرات</h2>
  <dl class="faq">
${faq.map(f => `    <dt>${T(f.q)}</dt>\n    <dd>${T(f.a)}</dd>`).join("\n")}
  </dl>

  <h2 id="sources">المصادر</h2>
  <ul class="src">
    <li><a href="${guideAt(5)}" rel="noopener">${esc(SRC.guide.name)}</a> (ملف PDF): مجالات الجزء الكمي (ص ٥) ومفاهيم كل مجال (ص ٦). اطّلعنا عليه في <time datetime="${SRC.checked}">${arDate(SRC.checked)}</time>.</li>
  </ul>
${cta("احفظ القوانين بالتطبيق لا بالقراءة", "في قدراتي كل قانون يأتي في وقته: بطاقة قصيرة، ثم سؤال سريع، ثم أسئلة بأسلوب الاختبار، ومراجعة لما أخطأت فيه. مجاناً وبدون تسجيل.")}
</article>
</main>
${foot("/qudrat/laws.html", dates.modified)}
</div>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ comparisons */
function comparisonsPage(M, dates, cssV) {
  const { all, comparisons, insuffQs, totals, D } = M;
  const url = SITE + "/qudrat/comparisons.html";
  const fast = all.find(l => l.key === "fastest");
  const rule = name => { const r = fast.rules.find(x => x.orig.includes(name)); if (!r) throw new Error("fastest: no rule " + name); return r; };
  const insuff = rule("غير كافية"), subst = rule("استبدال المتغيرات"), smart = rule("اختيار الأرقام الذكية"), even = rule("الأسس الزوجية");
  const withCmp = all.map(l => ({ l, n: l.questions.filter(q => q.format === "comparison").length })).filter(x => x.n);
  const nShown = comparisons.length + insuffQs.length;
  /* the title asks when: the rule answers it, said as a clause («إذا أعطى …» ← «يعطي …») */
  const insuffWhen = plain(insuff.formula).replace(/\s*←.*$/, "").replace(/^إذا أعطى /, "يعطي ");
  if (insuffWhen === plain(insuff.formula) || /^إذا/.test(insuffWhen)) throw new Error(`fastest «${insuff.name}»: its formula no longer reads «إذا أعطى … ←»: ${insuff.formula}`);
  const h1 = `أسئلة المقارنة في اختبار القدرات — الخيارات الأربعة و${nExSolved(nShown)}`;
  const title = `أسئلة المقارنة في القدرات الكمي: متى تكون المعطيات غير كافية؟ | قدراتي`;
  const desc = fit([`كيف تحل أسئلة المقارنة في القسم الكمي من اختبار القدرات: الخيارات الأربعة الثابتة كما في الدليل الرسمي، ومتى تختار «المعطيات غير كافية»، و${nExSolved(nShown)}.`]);
  const trail = [{ name: "قدراتي", url: SITE + "/", href: "/" }, { name: "دروس القسم الكمي", url: HUB_URL, href: "/qudrat/" }, { name: "أسئلة المقارنة" }];
  GUIDE_CMP.forEach((g, i) => { if (!g.startsWith(D.CMP[i])) throw new Error(`CMP_CHOICES[${i}] «${D.CMP[i]}» is not the guide's «${g}»`); });
  const choiceList = GUIDE_CMP.map((c, i) => `${LETTERS[i]}) ${c}`).join("، ");
  const faq = [
    { q: "ما خيارات أسئلة المقارنة في اختبار القدرات؟", a: `أربعة خيارات ثابتة في كل سؤال مقارنة، كما يطبعها الدليل الإرشادي: ${choiceList}.` },
    { q: "متى أختار «المعطيات غير كافية» في القدرات؟", a: `${endStop(plain(insuff.formula))} لذلك عوّض مرتين بأعداد مختلفة، مثل موجب ثم سالب أو كسر، فإن اختلفت النتيجة فاختر «${D.CMP[3]}».` },
    { q: "هل يُسمح بالآلة الحاسبة في اختبار القدرات؟", a: "لا. ينص الدليل الإرشادي لاختبار القدرات العامة على أن استخدام الآلة الحاسبة غير مسموح به في الاختبار." },
    { q: "كم سؤال مقارنة في قدراتي؟", a: `${nCmp(totals.cmp)} أصلية موزّعة على ${nLessons(withCmp.length)}، كلها بالخيارات الأربعة نفسها ومع الحل خطوة بخطوة.` },
  ];
  const ld = [
    { "@type": "Article", "@id": url + "#article", headline: h1, description: desc, inLanguage: "ar", url, mainEntityOfPage: url,
      datePublished: dates.published, dateModified: dates.modified, image: imgUrls("comparisons"),
      author: { "@id": SITE + "/#org" }, publisher: { "@id": SITE + "/#org" }, isPartOf: { "@id": SITE + "/#website" },
      about: { "@type": "Thing", name: "أسئلة المقارنة — القسم الكمي في اختبار القدرات العامة" },
      citation: [
        { "@type": "CreativeWork", name: SRC.guide.name + " — أسئلة المقارنة", url: guideAt(12), publisher: ETEC },
        { "@type": "CreativeWork", name: SRC.guide.name + " — الآلة الحاسبة", url: guideAt(19), publisher: ETEC }] },
    ORG, WEBSITE, crumbLd(url, trail), faqLd(url, faq),
  ];
  return `${head({ title, desc, url, type: "article", ld, cssV, img: "comparisons", imgAlt: h1 })}
<body>
<a class="skip" href="#main">انتقل إلى المحتوى</a>
<div class="page">
${crumbHtml(trail)}
<main id="main">
<article>
  <h1>${esc(h1)}</h1>
  <p class="lead">تكون «<a href="#insufficient">المعطيات غير كافية</a>» في سؤال المقارنة في القدرات حين ${T(insuffWhen)}${exampleOf(insuff) ? `. مثال: ${T(exampleOf(insuff))}` : ""}.</p>
  <p>سؤال المقارنة في القسم الكمي يعطيك قيمتين، الأولى في الجهة اليمنى والثانية في الجهة اليسرى، وتختار علاقتهما من أربعة خيارات ثابتة لا تتغيّر من سؤال إلى آخر. هذا ما يصفه <a href="${guideAt(12)}" rel="noopener">الدليل الإرشادي لاختبار القدرات العامة (ص ١٢)</a>.</p>
  <nav class="toc" aria-label="في هذه الصفحة"><ul>
    <li><a href="#choices">الخيارات الأربعة</a></li>
    <li><a href="#insufficient">المعطيات غير كافية</a></li>
    <li><a href="#examples">أمثلة محلولة</a></li>
    <li><a href="#lessons">أين تتدرّب</a></li>
    <li><a href="#faq">أسئلة شائعة</a></li>
  </ul></nav>
${ctaIn(`تدرّب على ${nCmp(totals.cmp)} بالخيارات الأربعة نفسها في لعبة قدراتي — مجاناً وبدون تسجيل.`)}

  <h2 id="choices">الخيارات الأربعة في أسئلة المقارنة</h2>
  <ol class="choices">
${GUIDE_CMP.map((c, i) => `    <li><span class="l">${LETTERS[i]}</span> <span>${esc(c)}</span></li>`).join("\n")}
  </ol>
  <p style="margin-top:10px">هكذا يكتبها <a href="${guideAt(12)}" rel="noopener">الدليل الإرشادي (ص ١٢)</a>. وفي أسئلة قدراتي وفي الأمثلة أدناه يظهر الخياران الأولان مختصرين: «${esc(D.CMP[0])}» و«${esc(D.CMP[1])}».</p>
  <p style="margin-top:10px">لأن الخيارات ثابتة، احفظها مرة واحدة ولا تقرأها في كل سؤال. ولأن الآلة الحاسبة غير مسموح بها في الاختبار (<a href="${guideAt(19)}" rel="noopener">الدليل الإرشادي، ص ١٩</a>)، فأسرع طريق هو أن تقارن دون أن تحسب كل قيمة إلى آخرها: أرجع القيمتين إلى أصل مشترك وقارن الفرق.</p>

  <h2 id="insufficient">متى تكون «المعطيات غير كافية»؟</h2>
  <section class="rule" id="${insuff.id}" aria-labelledby="ri-h">
    <h3 id="ri-h">${T(insuff.name)}</h3>
    <p class="f"><span class="k">القاعدة:</span> ${T(insuff.formula)}</p>
    <p><span class="lab">متى تستخدمه:</span> ${T(insuff.when)}</p>
  </section>
  <ul class="tips">
    <li><b>${T(subst.name)}:</b> ${T(subst.formula)} — ${T(subst.when)}.</li>
    <li><b>${T(smart.name)}:</b> ${T(smart.formula)} — ${T(smart.when)}.</li>
    <li><b>${T(even.name)}:</b> ${T(even.formula)} — ${T(even.when)}.</li>
${fast.tricks.filter(t => /المقارن/.test(t)).map(t => `    <li>${T(t)}</li>`).join("\n")}
  </ul>
  <p style="margin-top:10px">هذه القواعد من درس <a href="${fast.href}">${esc(fast.h)}</a>. ${insuffQs.length > 1 ? "وهذه أسئلة جوابها" : "وهذا سؤال جوابه"} «${esc(D.CMP[3])}»:</p>
  <div class="qs">
${insuffQs.map((c, i) => questionHtml(c.q, `مثال على «${esc(D.CMP[3])}»${insuffQs.length > 1 ? " " + toAr(i + 1) : ""}`, c.l, D.CMP)).join("\n")}
  </div>

  <h2 id="examples">${nCmpSolved(comparisons.length)}</h2>
  <p>أسئلة أصلية من بنك قدراتي، من وحدات مختلفة. حلّها أولاً ثم افتح الحل.</p>
  <div class="qs">
${comparisons.map((c, i) => questionHtml(c.q, `المقارنة ${toAr(i + 1)}`, c.l, D.CMP)).join("\n")}
  </div>
  ${REPORT}

  <h2 id="lessons">أين تجد أسئلة المقارنة في قدراتي؟</h2>
  <p>سؤالا مقارنة آخران محلولان في <a href="/qudrat-mock-test.html#sample">عيّنة الاختبار التجريبي</a>، وفي اللعبة نفسها كل هذه الأسئلة داخل دروسها:</p>
  <div class="tw"><table>
    <caption>${nCmp(totals.cmp)} في ${nLessons(withCmp.length)}</caption>
    <thead><tr><th scope="col">الدرس</th><th scope="col">أسئلة المقارنة</th></tr></thead>
    <tbody>
${withCmp.map(({ l, n }) => `      <tr><th scope="row"><a href="${l.href}">${esc(l.h)}</a></th><td>${toAr(n)}</td></tr>`).join("\n")}
    </tbody>
  </table></div>

  <h2 id="faq">أسئلة شائعة عن أسئلة المقارنة</h2>
  <dl class="faq">
${faq.map(f => `    <dt>${T(f.q)}</dt>\n    <dd>${T(f.a)}</dd>`).join("\n")}
  </dl>

  <h2 id="sources">المصادر</h2>
  <ul class="src">
    <li><a href="${guideAt(12)}" rel="noopener">${esc(SRC.guide.name)}</a> (ملف PDF): وصف أسئلة المقارنة وخياراتها الأربعة (ص ١٢)، ومنع الآلة الحاسبة في الاختبار (<a href="${guideAt(19)}" rel="noopener">ص ١٩</a>). اطّلعنا عليه في <time datetime="${SRC.checked}">${arDate(SRC.checked)}</time>.</li>
  </ul>
${cta("تدرّب على أسئلة المقارنة في قدراتي", `في قدراتي ${nCmp(totals.cmp)} أصلية بالخيارات الأربعة نفسها، داخل دروسها، ومع الحل خطوة بخطوة. مجاناً وبدون تسجيل.`)}
</article>
</main>
${foot("/qudrat/comparisons.html", dates.modified)}
</div>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ methods */
function methodsPage(M, dates, cssV) {
  const { units, all, totals, D } = M;
  const url = SITE + "/qudrat-methods.html";
  const h1 = `أسئلة قدرات كمي مع طريقة الحل — ${nLessons(totals.lessons)}`;
  const solved = n => (n % 100 >= 3 && n % 100 <= 10) ? "محلولة" : "محلولاً";
  const title = `أسئلة قدرات كمي مع طريقة الحل: ${nQs(all.length * 2)} ${solved(all.length * 2)} | قدراتي`;
  const desc = fit([`أسئلة قدرات كمي محلولة مع طريقة الحل خطوة بخطوة: سؤالان من كل درس من دروس القسم الكمي الـ${toAr(totals.lessons)} في قدراتي، مع حيل الحل وروابط إلى قوانين الدرس.`]);
  const trail = [{ name: "قدراتي", url: SITE + "/", href: "/" }, { name: "دروس القسم الكمي", url: HUB_URL, href: "/qudrat/" }, { name: "أسئلة مع طريقة الحل" }];
  const ld = [
    { "@type": "Article", "@id": url + "#article", headline: h1, description: desc, inLanguage: "ar", url, mainEntityOfPage: url,
      datePublished: dates.published, dateModified: dates.modified, image: imgUrls("methods"),
      author: { "@id": SITE + "/#org" }, publisher: { "@id": SITE + "/#org" }, isPartOf: { "@id": SITE + "/#website" },
      about: { "@type": "Thing", name: "اختبار القدرات العامة — القسم الكمي", alternateName: "GAT quantitative section" },
      mentions: { "@id": url + "#lessons" } },
    ORG, WEBSITE, crumbLd(url, trail),
    { "@type": "ItemList", "@id": url + "#lessons", name: "دروس القسم الكمي في قدراتي", numberOfItems: all.length,
      itemListElement: all.map((l, i) => ({ "@type": "ListItem", position: i + 1, name: l.h, url: l.url })) },
  ];
  return `${head({ title, desc, url, type: "article", ld, cssV, img: "methods", imgAlt: h1 })}
<body>
<a class="skip" href="#main">انتقل إلى المحتوى</a>
<div class="page">
${crumbHtml(trail)}
<main id="main">
<article>
  <h1>${esc(h1)}</h1>
  <p class="lead">لكل درس من دروس القسم الكمي في قدراتي: حيل تختصر الحل، وسؤالان أصليان بأسلوب الاختبار مع الحل خطوة بخطوة، ورابط إلى صفحة الدرس بكل قوانينه وأمثلته. حلّ السؤال أولاً، ثم افتح الحل.</p>
  <nav class="toc" id="toc" aria-label="الوحدات"><ul>
${units.map(u => `    <li><a href="#${u.key}">${esc(u.title)}</a></li>`).join("\n")}
  </ul></nav>
${ctaIn("حلّ أسئلة كل درس بمؤقّت بإيقاع الاختبار في لعبة قدراتي، وراجع أخطاءك — مجاناً وبدون تسجيل.")}
${units.map(u => `
  <section class="unit" id="${u.key}" aria-labelledby="${u.key}-h">
    <h2 id="${u.key}-h">الوحدة ${toAr(u.n)}: ${esc(u.title)}</h2>
${u.lessons.map(l => `    <section class="ms" id="${l.key}" aria-labelledby="${l.key}-h">
      <h3 id="${l.key}-h">طريقة حل أسئلة ${esc(l.t)}</h3>
      <p>أهم القوانين: ${l.top.slice(0, 3).map(({ r }) => `<a href="${l.href}#${r.id}">${T(r.name)}</a>`).join("، ")} — و<a href="${l.href}">كل قوانين ${esc(l.t)} (${nRules(l.rules.length)})</a>.</p>
${l.tricks.length ? `      <ul class="tips">\n${l.tricks.map(t => `        <li>${T(t)}</li>`).join("\n")}\n      </ul>\n` : ""}${l.methodQs.map((q, i) => questionHtml(q, `السؤال ${toAr(i + 1)}`, null, D.CMP)).join("\n")}
    </section>`).join("\n")}
${upLink("فهرس الوحدات")}
  </section>`).join("\n")}
  ${REPORT}
${cta("طبّق كل طريقة على أسئلة حقيقية", `كل درس هنا له في قدراتي أسئلة أصلية بأسلوب الاختبار، ومؤقّت بإيقاعه، ومراجعة لأخطائك، و<a href="/qudrat-mock-test.html">اختبار تجريبي</a> بقسمين. مجاناً وبدون تسجيل.`)}
</article>
</main>
${foot("/qudrat-methods.html", dates.modified)}
</div>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ share images */
/* Each page's picture for search and for sharing (Google's Article docs: images that
   represent the page, not a logo, at 16:9, 4:3 and 1:1). Drawn in headless Chrome from a
   card of the page's own words and first rule, in the app's colours and font. */
const IMG_SIZES = { "16x9": [1200, 675], "4x3": [1200, 900], "1x1": [1200, 1200] };
function imageCards(M) {
  const cards = M.all.map(l => ({ name: l.slug, kicker: `الوحدة ${toAr(l.unitN)}: ${plain(l.unitTitle)}`, title: l.h,
    rule: bare(l.top[0].r.name), formula: plain(l.top[0].r.formula) }));
  cards.push({ name: "lessons", kicker: "دروس القسم الكمي", title: `${nLessons(M.totals.lessons)} للقسم الكمي في اختبار القدرات`, rule: "بالقوانين والأمثلة المحلولة", formula: `${nRules(M.totals.rules)} و${nQsA(M.totals.questions, "asl")}` });
  const hs = M.all.find(l => l.key === "keylaws").top[0].r;
  cards.push({ name: "laws", kicker: "ورقة القوانين", title: `قوانين القدرات كمي — ${nRules(M.totals.rules)}`, rule: bare(hs.name), formula: plain(hs.formula) });
  cards.push({ name: "comparisons", kicker: "أسئلة المقارنة", title: "أسئلة المقارنة في اختبار القدرات", rule: "الخيارات الأربعة", formula: M.D.CMP.join(" ، ") });
  cards.push({ name: "methods", kicker: "أسئلة محلولة", title: "أسئلة قدرات كمي مع طريقة الحل", rule: `${nLessons(M.totals.lessons)}`, formula: "سؤالان من كل درس مع الحل خطوة بخطوة" });
  /* for qudrat-kami.html, which the guides build by hand: its Article points here (the shares are
     the guide's own table, p. 5) */
  cards.push({ name: "kami", kicker: "دليل القسم الكمي", title: "القسم الكمي في اختبار القدرات العامة", rule: "نسبة الكمي من الاختبار — الدليل الإرشادي", formula: "٤٥٪ في التخصصات العلمية — ٢٥٪ في التخصصات النظرية" });
  /* for qudrat-score.html, by hand too: the score table is ETEC's own (its GAT page and the guide, p. 8) */
  cards.push({ name: "score", kicker: "درجة القدرات", title: "حساب درجة القدرات: كيف تُحسب وماذا تعني", rule: "الدرجة وموقعها بين المختبرين — الهيئة", formula: "٦٥ المتوسط — ٨١ فأكثر أعلى ٥٪" });
  return cards;
}
function cardHtml(c, w, h) {
  const font = "file:///" + path.join(ROOT, "assets", "fonts", "baloo-bhaijaan-2.ttf").replace(/\\/g, "/");
  const icon = "file:///" + path.join(ROOT, "assets", "app-icon", "icon-192.webp").replace(/\\/g, "/");
  const big = h >= 1100 ? 1.12 : h >= 850 ? 1.05 : 1;
  /* the formula drawn as the pages draw it: a fraction stacked, a power raised */
  const f = fracs(esc(c.formula)), drawn = f !== esc(c.formula);
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:B;src:url("${font}");font-weight:400 800}
*{box-sizing:border-box;margin:0}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{font-family:B,"Segoe UI",Tahoma,sans-serif;background:#fff;color:#4B4B4B;display:flex;flex-direction:column;padding:${Math.round(56 * big)}px ${Math.round(64 * big)}px;gap:${Math.round(26 * big)}px}
.top{display:flex;align-items:center;gap:18px;font-weight:800;font-size:${Math.round(30 * big)}px;color:#2E6B00}
.top img{width:${Math.round(64 * big)}px;height:${Math.round(64 * big)}px;border-radius:16px}
.k{font-size:${Math.round(28 * big)}px;font-weight:800;color:#2E6B00;background:#D6FFB8;border-radius:999px;padding:4px 22px 0;align-self:flex-start}
h1{font-size:${Math.round(58 * big)}px;line-height:1.35;font-weight:800;color:#4B4B4B;text-wrap:balance}
.rule{margin-top:auto;background:#FFF4BF;border:4px solid #FFC800;border-bottom-width:10px;border-radius:28px;padding:${Math.round(22 * big)}px 30px}
.rule b{display:block;font-size:${Math.round(28 * big)}px;color:#7A3B12;font-weight:800}
.rule p{font-size:${Math.round(40 * big)}px;font-weight:800;line-height:1.5;color:#4B4B4B;overflow:hidden;display:-webkit-box;-webkit-line-clamp:${h >= 1100 ? 4 : h >= 850 ? 3 : 2};-webkit-box-orient:vertical}
${drawn ? `.fr{display:inline-flex;flex-direction:column;vertical-align:middle;font-size:.82em;line-height:1.08;text-align:center;margin:0 .12em;unicode-bidi:isolate;white-space:nowrap}
.fr-n{padding:0 .22em .08em;border-bottom:.11em solid currentColor}.fr-d{padding:.1em .22em 0}
.fr-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}sup{font-size:.6em;line-height:0}
` : ""}</style></head><body>
<div class="top"><img src="${icon}" alt="">قدراتي — qudrati.xyz</div>
<span class="k">${esc(c.kicker)}</span>
<h1>${esc(c.title)}</h1>
<div class="rule"><b>${esc(c.rule)}</b><p>${f}</p></div>
</body></html>`;
}
const cardKey = c => hash6(JSON.stringify(c) + "|" + cardHtml(c, 1200, 675).replace(/file:\/\/\/[^"]+/g, ""));
const MANIFEST = path.join(ROOT, "qudrat", "img", "manifest.json");
function readManifest() { try { return JSON.parse(fs.readFileSync(MANIFEST, "utf8")); } catch { return {}; } }
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
function drawImages(M) {
  const dir = path.join(ROOT, "qudrat", "img");
  fs.mkdirSync(dir, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "qudrat-img-"));
  /* only the cards whose words changed, or whose files are missing */
  const manifest = readManifest();
  for (const c of imageCards(M)) {
    if (manifest[c.name] === cardKey(c) && Object.keys(IMG_SIZES).every(r => fs.existsSync(path.join(dir, `${c.name}-${r}.png`)))) continue;
    console.log("drawing qudrat/img/" + c.name + "-*.png");
    for (const [ratio, [w, h]] of Object.entries(IMG_SIZES)) {
      const src = path.join(tmp, `${c.name}-${ratio}.html`);
      fs.writeFileSync(src, cardHtml(c, w, h));
      const out = path.join(dir, `${c.name}-${ratio}.png`);
      fs.rmSync(out, { force: true });
      execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--allow-file-access-from-files",
        `--user-data-dir=${path.join(tmp, "profile")}`, `--window-size=${w},${h}`, "--force-device-scale-factor=1", `--screenshot=${out}`, "file:///" + src.replace(/\\/g, "/")], { stdio: "ignore" });
      /* with another Chrome running, the launcher can return before the screenshot is written */
      for (const until = Date.now() + 15000; !fs.existsSync(out) && Date.now() < until;) execFileSync(process.execPath, ["-e", "setTimeout(()=>{},250)"]);
      if (!fs.existsSync(out)) throw new Error("Chrome drew nothing for " + out);
    }
    manifest[c.name] = cardKey(c);
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");
  fs.rmSync(tmp, { recursive: true, force: true });
  return manifest;
}

/* ------------------------------------------------------------------ checks on the output */
function audit(file, html) {
  const noScript = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
  const visible = noScript.replace(/<svg[\s\S]*?<\/svg>/g, m => m.replace(/<[^>]+>/g, " ")).replace(/<head>[\s\S]*?<\/head>/, "").replace(/<[^>]+>/g, " ");
  const latin = visible.replace(/&[a-z#0-9]+;/gi, " ").match(/[^\s]*[0-9\u2460-\u2473\u00BC-\u00BE\u2150-\u215E][^\s]*/g);
  if (latin) throw new Error(`${file}: Latin digits in visible text: ${latin.slice(0, 5).join(" | ")}`);
  if (html.includes("·")) throw new Error(`${file}: «·» in the page`);
  if (/&amp;(?:gt|lt|amp|quot);/.test(html)) throw new Error(`${file}: an entity escaped twice`);
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/u.test(visible.replace(/[★☆]/g, ""))) throw new Error(`${file}: emoji in visible text`);
  if (/المعلومات غير كافية/.test(visible)) throw new Error(`${file}: «المعلومات غير كافية»; the exam's choice is «المعطيات غير كافية»`);
  if (/؟،/.test(visible)) throw new Error(`${file}: a comma straight after a question mark`);
  if (/قانون واحد أخرى|قانونان أخرى|قانوناً أخرى|سؤالاً مقارنة/.test(visible)) throw new Error(`${file}: a count that does not agree with its noun`);
  /* a label is always followed by a space, so the page's raw text never glues two words */
  const glued = html.match(/<span class="(?:k|lab)">[^<]*<\/span>(?=[^\s<])|<div class="cmp"><div><span>[^<]*<\/span>(?=<)/);
  if (glued) throw new Error(`${file}: a label runs into the text after it: ${glued[0]}`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) throw new Error(`${file}: duplicate ids ${[...new Set(dup)].join(", ")}`);
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(m[1])) throw new Error(`${file}: link to missing #${m[1]}`);
  for (const m of html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/g)) {
    const words = m[2].replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean);
    for (let i = 1; i < words.length; i++) if (words[i] === words[i - 1] || words[i] === "ال" + words[i - 1]) throw new Error(`${file}: a heading repeats a word: ${words.join(" ")}`);
  }
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!ld) throw new Error(`${file}: no JSON-LD`);
  const graph = JSON.parse(ld[1])["@graph"];
  /* every @id a node points to is a node of this page, or carries its own type */
  const defined = new Set(graph.map(n => n["@id"]).filter(Boolean));
  const walk = (v, top) => {
    if (Array.isArray(v)) return v.forEach(x => walk(x, false));
    if (!v || typeof v !== "object") return;
    if (!top && v["@id"] && !v["@type"] && Object.keys(v).length === 1 && !defined.has(v["@id"])) throw new Error(`${file}: JSON-LD points to ${v["@id"]}, which this page does not define`);
    for (const k of Object.keys(v)) if (k !== "@id") walk(v[k], false);
  };
  graph.forEach(n => walk(n, true));
  /* a raised (or lowered) part as ^{…} (_{…}), the innermost first */
  const unsup = x => { let y = x, z; do { z = y; y = y.replace(/<sup>([^<]*)<\/sup>/g, "^{$1}").replace(/<sub>([^<]*)<\/sub>/g, "_{$1}"); } while (y !== z); return y; };
  /* the FAQ markup must say what the page shows, word for word: a stacked fraction read back as
     written, an exponent as ^{…} on both sides */
  const shown = s => canon(s.replace(/<span class="fr" data-t="([^"]*)"><span class="fr-n">[\s\S]*?<\/span><span class="fr-sr"> على <\/span><span class="fr-d">[\s\S]*?<\/span><\/span>/g, "$1")
    .replace(/<span class="fr-sr pw">[^<]*<\/span>/g, "")
    .replace(/(<su[pb]>)[\s\S]*$/, unsup)
    .replace(/<br>/g, " ").replace(/<[^>]+>/g, "").replace(/&quot;/g, "\"").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim());
  /* the text as a reader sees it, fractions as written: what the value checks below read */
  const read = shown(noScript.replace(/<head>[\s\S]*?<\/head>/, "").replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<(?!\/?su[pb]>|span class="fr|\/span>)[^>]+>/g, " "));
  const outside = noScript.replace(/<head>[\s\S]*?<\/head>/, "").replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<span class="fr-sr pw">[^<]*<\/span>/g, "").replace(/<[^>]+>/g, " ");
  /* every raised or lowered part says its sign in text, so a tag-strip never reads «٢٦» for ٢^٦ */
  const bareSup = html.match(/<su([pb])>(?!<span class="fr-sr pw">)[\s\S]{0,40}/);
  if (bareSup) throw new Error(`${file}: a <sup>/<sub> without its hidden sign: ${bareSup[0]}`);
  /* powers and fractions are drawn, never written in a programmer's notation or as Unicode signs */
  const raw = outside.match(/[^\s]*[\^⁄²³¹⁰-₟][^\s]*/g);
  if (raw) throw new Error(`${file}: a power or fraction written as text, not drawn: ${raw.slice(0, 5).join(" | ")}`);
  if (/⁄/.test(html)) throw new Error(`${file}: «⁄» (U+2044) in the page or its markup`);
  /* one value for each well-known fraction: ١/٦ = ١٦ و٢/٣٪, ١/٣ = ٣٣ و١/٣٪, ٢/٣ = ٦٦ و٢/٣٪; a
     repeating decimal ends in «…», and ٣٫١٤ and ٢٢/٧ are two values of ط, never equal */
  const ldText = (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || ["", ""])[1];
  for (const [re, what] of [[/١٦٫[٦٧]/, "١/٦ as a rounded percent"], [/٦٦٫[٦٧]/, "٢/٣ as a rounded percent"], [/[=]\s*٣٣٫٣/, "١/٣ «=» a rounded percent"],
    [/٠٫(?:١٦٦|٣٣٣|٦٦٦)(?!…)/, "a repeating decimal without «…»"], [/٠٫١٦٧|٠٫٦٦٧/, "a repeating decimal rounded"],
    [/ط\s*=\s*٣٫١٤\s*=|٣٫١٤\s*=\s*٢٢|٢٢\/٧\s*=\s*٣٫١٤/, "٣٫١٤ «=» ٢٢/٧"]])
    for (const [where, t] of [["page", read], ["JSON-LD", ldText]]) { const m = t.match(re); if (m) throw new Error(`${file}: ${what} in the ${where}: …${t.slice(Math.max(0, m.index - 40), m.index + 30)}…`); }
  /* a trap that asks to pick «التالية» names what it picks from */
  for (const m of html.matchAll(/<p class="trap">([\s\S]*?)<\/p>/g)) {
    const ask = shown(m[1]).replace(/^الفخ: /, "").split("؟")[0];
    if (/التالية|الآتية|أيّ الأعداد/.test(ask) && !/:/.test(ask)) throw new Error(`${file}: a trap asks to pick but lists nothing: ${ask}`);
  }
  /* an angle named by its number in a figure is only said where that figure is, and the figure
     labels every number said */
  const figNums = [...read.matchAll(/ق\(([٠-٩])\)/g)].map(m => m[1]);
  if (figNums.length) {
    const fig = html.match(new RegExp('<figure class="fig nums" id="' + ANGLE_FIG_ID + '">[^]*?</figure>'));
    if (!fig) throw new Error(`${file}: «ق(${figNums[0]})» with no figure that numbers the angles`);
    for (const d of new Set(figNums)) if (!fig[0].includes(`>${d}</text>`)) throw new Error(`${file}: «ق(${d})», which the figure does not label`);
  }
  if (FIG_NUM.test(ldText)) throw new Error(`${file}: an angle named by its figure number in the JSON-LD, which is read without the figure`);
  /* the average speed is under the mean of the speeds on a round trip, never «دائماً» */
  for (const t of [read, ldText]) for (const sen of t.split(/[.؟!\n]/))
    if (/السرعة المتوسطة/.test(sen) && /الوسط الحسابي/.test(sen) && (/دائماً/.test(sen) && !/ذهاب|إياب|العودة/.test(sen) || /أقل منه بقليل/.test(sen)))
      throw new Error(`${file}: the average speed said to be under the mean without its condition: ${sen.trim()}`);
  /* a comparison's verdict is its words, never a bare letter (the answer line «الإجابة الصحيحة: (د) …» aside) */
  const letter = read.replace(/الإجابة الصحيحة: \((?:أ|ب|جـ|د)\)/g, "").match(/(?<![ء-ي])\((?:جـ?|د)\)/);
  if (letter) throw new Error(`${file}: a verdict by its letter: …${read.slice(Math.max(0, letter.index - 50), letter.index + 10)}…`);
  /* a heading never ends on a variant number («زمن اللحاق (١)») */
  for (const m of html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/g)) if (/(?<!ق)\((?:[٠-٩]+|[ء-ي])\)\s*$/.test(shown(m[2]))) throw new Error(`${file}: a heading ends on a variant number: ${shown(m[2])}`);
  /* the words of a link never run together in the page's raw text */
  for (const m of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)) {
    const t = m[1].replace(/<span class="fr-sr[^"]*">[^<]*<\/span>/g, "").replace(/<span class="fr" data-t="[^"]*"><span class="fr-n">[\s\S]*?<\/span><span class="fr-d">[\s\S]*?<\/span><\/span>/g, "F");
    if (/<\/span><span|<\/span>[^\s<]|[^\s>]<span/.test(t)) throw new Error(`${file}: a link's words run together: ${m[0].slice(0, 160)}`);
  }
  const dts = [...html.matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)].map(m => [shown(m[1]), shown(m[2])]);
  for (const node of graph.filter(n => n["@type"] === "FAQPage")) {
    if (node.mainEntity.length !== dts.length) throw new Error(`${file}: FAQ markup has ${node.mainEntity.length} questions, the page shows ${dts.length}`);
    node.mainEntity.forEach((q, i) => {
      if (canon(q.name) !== dts[i][0] || canon(q.acceptedAnswer.text) !== dts[i][1]) throw new Error(`${file}: FAQ ${i + 1} markup differs from the page:\n  ${q.name} | ${q.acceptedAnswer.text}\n  ${dts[i][0]} | ${dts[i][1]}`);
      if (/أين أتدرّب/.test(q.name)) throw new Error(`${file}: an FAQ that only advertises`);
      if ((q.acceptedAnswer.text.match(/مثال:/g) || []).length > 1) throw new Error(`${file}: FAQ «${q.name}» says «مثال:» twice: ${q.acceptedAnswer.text}`);
    });
  }
  /* a stacked top or bottom of more than one term keeps its brackets in the text layer («(أ ± ب)
     على م»), and nothing stands glued before a fraction («٥√» beside ١٠ over ١٠ reads ٥√(١٠/١٠)) */
  const strip = x => x.replace(/<[^>]+>/g, "").trim();
  for (const m of html.matchAll(/<span class="fr" data-t="([^"]*)"><span class="fr-n">([\s\S]*?)<\/span><span class="fr-sr"> على <\/span><span class="fr-d">([\s\S]*?)<\/span><\/span>/g))
    for (const part of [strip(m[2]), strip(m[3])]) {
      /* the part without its exponent's hidden «^(…)» or «^» and what follows it */
      const t = part.replace(/\^[\s\S]*$/, "");
      if (MANY.test(t) && !new RegExp(`^${GROUP}$`).test(t)) throw new Error(`${file}: the fraction «${m[1]}» reads «${strip(m[2])} على ${strip(m[3])}» without its brackets`);
    }
  if (/[√٠-٩]<span class="fr"/.test(html)) throw new Error(`${file}: a root sign or a number glued before a stacked fraction: ${html.match(/.{30}[√٠-٩]<span class="fr"/)[0]}`);
  /* the site's comma is «،» */
  for (const [where, t] of [["page", outside], ["JSON-LD", ldText]]) if (/\s,\s/.test(t)) throw new Error(`${file}: a Latin comma in the ${where}: …${t.match(/.{30}\s,\s.{10}/)[0]}…`);
  /* «متى تستخدمه:» says when, never an example */
  for (const m of read.matchAll(/متى تستخدمه: (\S+ \S+)/g)) if (/^مثال|^[٠-٩√(][^ ]* [=←⇐]/.test(m[1]) || /^[٠-٩]/.test(m[1]) && /[=←⇐]/.test(m[1])) throw new Error(`${file}: «متى تستخدمه:» followed by an example: ${m[0]}`);
  /* a question's heading is the question, never a link; a rule's heading names what it states,
     never a label («ملحوظة النسبة») */
  for (const m of html.matchAll(/<article class="qcard"[^>]*>\s*<h3>([\s\S]*?)<\/h3>/g)) if (/<a\b/.test(m[1])) throw new Error(`${file}: a link inside a question heading: ${m[1].slice(0, 120)}`);
  for (const m of html.matchAll(/<section class="rule[^"]*" id="[^"]+"[^>]*>\s*<h3[^>]*>([\s\S]*?)<\/h3>/g)) if (/^(ملحوظة|ملاحظة|تنبيه|تحذير|قاعدة|حالة)(\s|:|$)/.test(shown(m[1]))) throw new Error(`${file}: a rule heading that is a label, not a name: ${shown(m[1])}`);
  /* no Quiz (see where the markup is built): it matches no feature of Google's documentation */
  if (graph.some(n => [].concat(n["@type"]).includes("Quiz"))) throw new Error(`${file}: Quiz markup, which matches no current Google feature`);
  for (const node of graph.filter(n => [].concat(n["@type"]).includes("Article"))) {
    for (const k of ["headline", "datePublished", "dateModified", "author", "image", "publisher"]) if (!node[k]) throw new Error(`${file}: Article without ${k}`);
    if (node.headline.length > 110) throw new Error(`${file}: headline over 110 characters`);
    if (!html.includes(`<time datetime="${node.dateModified}">`)) throw new Error(`${file}: the visible date is not dateModified`);
    if ([].concat(node.image).some(u => /\/assets\/og\.png$/.test(u))) throw new Error(`${file}: the Article's image is the brand card`);
  }
  const title = html.match(/<title>([^<]*)<\/title>/)[1], desc = html.match(/<meta name="description" content="([^"]*)"/)[1];
  if (!/قدرات/.test(title) || !/قدرات/.test(desc)) throw new Error(`${file}: title and description must name «القدرات»`);
  if (/(^|[\s:—])(كامل|كاملة|كاملاً|جميع|كل)(?=$|[\s:—])/.test(title)) throw new Error(`${file}: the title claims full coverage, which the lessons do not have`);
  if (title.length > 72) throw new Error(`${file}: title of ${title.length} characters`);
  if (desc.length > 160) throw new Error(`${file}: description of ${desc.length} characters`);
  for (const [h] of SITE_LINKS) if (!html.includes(`href="${h}"`) && !new RegExp(`<link rel="canonical" href="${SITE}${h.replace(/[.]/g, "\\.")}">`).test(html)) throw new Error(`${file}: no link to ${h}`);
}
function auditLinks(pages) {
  const byPath = new Map(pages.map(p => ["/" + p.file.replace(/\\/g, "/").replace(/index\.html$/, ""), p.html]));
  for (const p of pages) {
    const base = "/" + path.posix.dirname(p.file.replace(/\\/g, "/")) + "/";
    for (const m of p.html.matchAll(/(?:href|src|content)="((?:https:\/\/qudrati\.xyz)?\/[^"#?]*|[a-z][a-z0-9-]*\.html)(?:\?[^"#]*)?(?:#([^"]+))?"/g)) {
      let [, target, frag] = m;
      if (!/^(https:|\/)/.test(target)) target = base + target;
      target = target.replace(SITE, "");
      const html = byPath.get(target);
      if (html == null) {
        if (!fs.existsSync(path.join(ROOT, target === "/" ? "index.html" : target.endsWith("/") ? target + "index.html" : target))) throw new Error(`${p.file}: link to ${target}, which is not on disk`);
        if (frag && /\.html$/.test(target) && !fs.readFileSync(path.join(ROOT, target), "utf8").includes(`id="${frag}"`)) throw new Error(`${p.file}: link to ${target}#${frag}, which has no such id`);
        continue;
      }
      if (frag && !html.includes(`id="${frag}"`)) throw new Error(`${p.file}: link to ${target}#${frag}, which has no such id`);
    }
  }
}

/* ------------------------------------------------------------------ write */
function prevPage(file) {
  try {
    const old = fs.readFileSync(path.join(ROOT, file), "utf8");
    const p = old.match(/"datePublished":\s*"(\d{4}-\d{2}-\d{2})"/), m = old.match(/"dateModified":\s*"(\d{4}-\d{2}-\d{2})"/);
    return { old, published: p && p[1], modified: m && m[1] };
  } catch { return { old: null }; }
}
/* a page without what is not its content: the ?v= of its stylesheet and font, the visible
   «آخر تحديث» and the JSON-LD's dates */
const masked = h => h.replace(/\?v=[0-9a-f]{8}\b/g, "?v=")
  .replace(/<p class="updated">آخر تحديث: <time datetime="[^"]*">[^<]*<\/time><\/p>/g, "")
  .replace(/"(datePublished|dateModified)":\s*"[^"]*"/g, '"$1": ""');
/* the anchors of a page's rules: every <section class="rule…" id> */
const ruleIds = html => new Set([...String(html || "").matchAll(/<section class="rule[^"]*" id="([^"]+)"/g)].map(m => m[1]));

function build() {
  const M = buildModel();
  const css = fs.readFileSync(path.join(ROOT, "css", "content.css"), "utf8");
  if (!css.includes(`url(${FONT_URL})`)) throw new Error(`css/content.css's @font-face must load url(${FONT_URL}), the font's current hash`);
  const cssV = crypto.createHash("sha1").update(css).digest("hex").slice(0, 8);
  const TODAY = today();
  const jobs = [
    ...M.all.map(l => ({ file: `qudrat/${l.slug}.html`, render: d => lessonPageCounted(l, M, d, cssV) })),
    { file: "qudrat/index.html", render: d => hubPage(M, d, cssV) },
    { file: "qudrat/laws.html", render: d => lawsPage(M, d, cssV) },
    { file: "qudrat/comparisons.html", render: d => comparisonsPage(M, d, cssV) },
    { file: "qudrat-methods.html", render: d => methodsPage(M, d, cssV) },
  ];
  const lost = [];
  const pages = jobs.map(j => {
    const prev = prevPage(j.file);
    let dates = { published: prev.published || TODAY, modified: prev.modified || TODAY };
    let html = j.render(dates);
    /* a new date only for new content: a stylesheet's or the font's ?v= and the dates themselves
       are not the page's content, so a change to them rewrites the page with the dates it has */
    if (prev.old == null || masked(html) !== masked(prev.old)) { dates = { published: prev.published || TODAY, modified: TODAY }; html = j.render(dates); }
    audit(j.file, html);
    const now = ruleIds(html);
    for (const id of ruleIds(prev.old)) if (!now.has(id)) lost.push(`${j.file}#${id}`);
    return { ...j, html, dates, changed: html !== prev.old };
  });
  if (lost.length && !ARGS.includes("--allow-id-change"))
    throw new Error(`these anchors would disappear, and links to them would land elsewhere:\n  ${lost.join("\n  ")}\nIf that is meant, run again with --allow-id-change.`);
  auditLinks(pages);
  return { M, pages };
}

function main() {
  if (ARGS.includes("--help") || ARGS.includes("-h")) {
    console.log(fs.readFileSync(__filename, "utf8").split("*/")[0].replace(/^#!.*\n\/\* ?/, ""));
    return;
  }
  const unknown = ARGS.filter(a => !FLAGS.includes(a));
  if (unknown.length) { console.error("unknown argument: " + unknown.join(" ") + " (try --help)"); process.exit(2); }
  const check = ARGS.includes("--check");
  if (ARGS.includes("--images") && check) { console.error("--images and --check do not go together"); process.exit(2); }
  /* the share images: drawn on --images (before the pages, which link them), otherwise only checked */
  if (ARGS.includes("--images")) drawImages(buildModel());
  const { M, pages } = build();
  const manifest = readManifest();
  const staleImg = imageCards(M).filter(c => manifest[c.name] !== cardKey(c) || Object.keys(IMG_SIZES).some(r => !fs.existsSync(path.join(ROOT, "qudrat", "img", `${c.name}-${r}.png`)))).map(c => c.name);
  const stale = pages.filter(p => p.changed);
  if (check) {
    for (const p of stale) console.log("out of date: " + p.file);
    for (const n of staleImg) console.log("image out of date: qudrat/img/" + n + "-*.png (run with --images)");
    console.log(`${pages.length} pages checked, ${stale.length} out of date; ${staleImg.length} images out of date`);
    process.exit(stale.length || staleImg.length ? 1 : 0);
  }
  if (staleImg.length) { console.error(`share images out of date or missing: ${staleImg.join(", ")}\nrun: node tools/build_lesson_pages.js --images`); process.exit(1); }
  fs.mkdirSync(path.join(ROOT, "qudrat"), { recursive: true });
  for (const p of stale) fs.writeFileSync(path.join(ROOT, p.file), p.html);
  const t = M.totals;
  console.log(`${t.units} units, ${t.lessons} lessons, ${t.rules} rules, ${t.questions} questions (${t.cmp} comparisons)`);
  console.log(`questions shown: ${M.comparisons.length + M.insuffQs.length} on comparisons, ${M.all.reduce((n, l) => n + l.practice.length, 0)} on lesson pages, ${M.all.length * 2} on the methods page; ${M.D.mockIds.length} left to the mock-test page`);
  console.log(`traps shown: ${M.all.reduce((n, l) => n + l.traps.length, 0)} on ${M.all.filter(l => l.traps.length).length} of ${t.lessons} lesson pages`);
  for (const p of pages) console.log(`${p.changed ? "wrote    " : "unchanged"} ${p.file}  ${Buffer.byteLength(p.html)} B  modified ${p.dates.modified}`);
  console.log("now run: node tools/build_sitemap.js");
}

/* the tables of what the pages print differently from the data, for tools/seo/audit.js to read */
module.exports = { build, buildModel, badDesc, badTitle, DATA_FIX, TEXT_FIX, NAME_FIX, undot, plain };
if (require.main === module) {
  try { main(); } catch (e) { console.error(e.message); process.exit(1); }
}
