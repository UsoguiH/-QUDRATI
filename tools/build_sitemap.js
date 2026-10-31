#!/usr/bin/env node
/* The crawler files — sitemap.xml, llms.txt, llms-full.txt — and the lists of
   pages on the home's pre-render and on 404.html, all built from the site's own
   public pages and the question bank.

       node tools/build_sitemap.js            # writes every output below
       node tools/build_sitemap.js --check    # writes nothing; exits 1 if an output is stale or a fact is wrong
       node tools/build_sitemap.js --help
       node tools/build_sitemap.js --seo-only-index OUT [--base REV]
                                   # writes OUT: REV's index.html (HEAD by default) with only the
                                   # head meta, JSON-LD and .landing of the working one, for an
                                   # SEO deploy that ships without the working tree's app work

   A page is public when it is an .html file outside the dev folders, carries no
   robots noindex, and its <link rel="canonical"> is its own URL. Any page the
   lesson or guide generators add is picked up on the next run, so run this
   after every one of them (and after a hand edit of a content page).

   What it writes:
   - sitemap.xml: one <url> per public page. <lastmod> is the page's own
     JSON-LD dateModified; a page without one gets its last git commit date, or
     the file's modified date when the working copy differs from git.
   - llms.txt: only the blocks between <!-- facts:start/end --> and
     <!-- pages:start/end -->; the rest of the file is written by hand.
   - llms-full.txt: the plain text of every public page, whole.
   - index.html: only the blocks between <!-- seo-facts:start/end --> and
     <!-- seo-pages:start/end --> inside the pre-rendered .landing — never the
     loading screen, never anything the app renders — and the home WebPage's
     "dateModified", set to today when this run changes those blocks, or when
     the .landing or the head's meta differ from the last commit and the date
     is not later than that commit. So the home's lastmod follows its content,
     not the app's own edits to the same file.
   - 404.html: the block between <!-- pages:start/end -->, and its font: the
     preload between <!-- font-preload:start/end --> and the @font-face rules
     between the CSS comments fonts:start / fonts:end, both copied from css/content.css (the same
     ?v= file URL and the same fallback faces), so the two never drift apart.

   The checks (they fail --check, and a normal run refuses to write past them):
   every «N سؤال / درس / قاعدة» on the home's pre-render, its head and llms.txt
   must be a count the data or the app really has (llms.txt's block between
   <!-- exam-facts:start/end --> quotes ETEC's guide and is left out), and no
   page in the sitemap may say «·» (in our font it reads as the Arabic zero).
   --check also fails when another sitemap in the tree (qudrat/sitemap.xml,
   which the lesson generator writes) gives a page another lastmod, or lists
   a URL that is not a public page. */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SITE = "https://qudrati.xyz/";
const ORDER = ["skills", "numbers", "ratios", "geometry"];
const ARGS = process.argv.slice(2);

if (ARGS.includes("--help") || ARGS.includes("-h")) {
  console.log(fs.readFileSync(__filename, "utf8").split("*/")[0].replace(/^#!.*\n\/\* ?/, ""));
  process.exit(0);
}
const CHECK = ARGS.includes("--check");
if (ARGS.includes("--seo-only-index")) {
  try { seoOnlyIndex(); } catch (e) { console.log("PROBLEM: " + e.message); console.log("nothing written"); process.exit(1); }
  process.exit(0);
}

/* --seo-only-index OUT [--base REV]: the committed index.html (REV, HEAD by
   default) with only this script's parts of the working one carried over — the
   head's title / description / og / twitter / sitemap lines, the JSON-LD and the
   pre-rendered .landing — and nothing else: no loading screen, and the base's
   own ?v= numbers, so it boots on the committed app.js, style.css and sw.js.
   It is for deploying the SEO work before the app work in the working tree is
   ready. It never writes the working index.html. */
function seoOnlyIndex() {
  const at = ARGS.indexOf("--seo-only-index"), outArg = ARGS[at + 1];
  const rev = ARGS.includes("--base") ? ARGS[ARGS.indexOf("--base") + 1] : "HEAD";
  if (!outArg || outArg.startsWith("--")) throw new Error("--seo-only-index needs an output path");
  const out = path.resolve(outArg);
  if (out === path.join(ROOT, "index.html")) throw new Error("--seo-only-index never overwrites the working index.html; give a path outside it");
  const nl = s => s.replace(/\r\n/g, "\n");
  const work = nl(fs.readFileSync(path.join(ROOT, "index.html"), "utf8"));
  let base;
  try { base = nl(execFileSync("git", ["show", rev + ":index.html"], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26, stdio: ["ignore", "pipe", "ignore"] })); }
  catch (e) { throw new Error(`git has no index.html at «${rev}»`); }
  const one = (text, re, what, label) => {
    const all = [...text.matchAll(new RegExp(re.source, "g"))];
    if (all.length !== 1) throw new Error(`${label}: ${all.length} ${what} (expected one)`);
    return all[0][0];
  };
  const META = /<title>[\s\S]*?<meta name="twitter:image:alt"[^>]*>(?:\n<link rel="sitemap"[^>]*>)?/;
  const LD = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;
  const LAND = /<div class="landing(?: [^"]*)?">[\s\S]*?(?=\n  <\/div>\n    <aside id="aside")/;
  let res = base;
  for (const [re, what] of [[META, "head meta blocks"], [LD, "JSON-LD blocks"], [LAND, "pre-rendered .landing blocks"]]) {
    const mine = one(work, re, what, "working index.html"), theirs = one(base, re, what, rev + ":index.html");
    res = res.replace(theirs, () => mine);
  }
  const land = one(res, LAND, "pre-rendered .landing blocks", "result");
  if ((land.match(/<div\b/g) || []).length !== (land.match(/<\/div>/g) || []).length) throw new Error("result: the .landing's <div>s do not balance");
  if (/id="splash"|id="qs-css"|splash-word:start/.test(res)) throw new Error("result: the working tree's loading screen came along");
  const vers = s => [...s.matchAll(/\?v=(\d+)/g)].map(m => m[1]).join(",");
  if (vers(res) !== vers(base)) throw new Error(`result: ?v= numbers ${vers(res)} differ from ${rev}'s ${vers(base)}`);
  const types = JSON.parse(one(res, LD, "JSON-LD blocks", "result").replace(/^<script[^>]*>|<\/script>$/g, ""))["@graph"].map(n => n["@type"]);
  fs.writeFileSync(out, res);
  console.log(`wrote ${out}: ${rev}:index.html with the working head meta, JSON-LD (${types.join(", ")}) and .landing; ?v= kept at ${[...new Set(vers(base).split(","))].join("/")}; ${res.length} chars`);
}

/* folders that never hold a public page */
const SKIP_DIRS = new Set([".git", ".claude", ".vercel", "node_modules", "tools", "assets", "research", "deck", "js", "css", "android", "ios"]);
/* the dev harnesses: noindex already, listed again so a lost meta tag never lists one */
const DEV_PAGES = /^(preview|mobile|chest-animation|chest-animation-tiers|chest-animation-clashroyale|mascot-lab|mascot-edits|mascot-prompts|exam-date-picker|quiz-two-bolts|_tmp_spark|404)\.html$/;
/* the order the guide pages are listed in; any other guide follows, by its URL */
const ROOT_ORDER = ["index.html", "qudrat-kami.html", "qudrat/index.html", "qudrat/laws.html", "qudrat-methods.html", "qudrat/comparisons.html", "qudrat-mock-test.html", "about.html", "privacy.html"];

const AR = "٠١٢٣٤٥٦٧٨٩";
const toAr = n => String(n).replace(/[0-9]/g, d => AR[d]);
const fromAr = s => Number(String(s).replace(/[٠-٩]/g, d => AR.indexOf(d)));
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»", mdash: "—", ndash: "–", hellip: "…", rlm: "", lrm: "", zwnj: "‌" };
const unesc = s => String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
  e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1)) : (e.toLowerCase() in ENT ? ENT[e.toLowerCase()] : m));

/* Arabic counted nouns: ٣–١٠ take the plural, ١١–٩٩ the accusative singular,
   a round hundred the singular */
function count(n, one, acc, plural) {
  const r = n % 100;
  if (r >= 3 && r <= 10) return `${toAr(n)} ${plural}`;
  if (r >= 11) return `${toAr(n)} ${acc}`;
  return `${toAr(n)} ${one}`;
}
const UNIT_WORDS = ["", "وحدة واحدة", "وحدتين", "ثلاث وحدات", "أربع وحدات", "خمس وحدات", "ست وحدات", "سبع وحدات", "ثماني وحدات", "تسع وحدات", "عشر وحدات"];

/* ---------------- the question bank ---------------- */
global.window = global;
for (const k of ORDER) require(path.join(ROOT, "js", "data", k + ".js"));
const BANK = global.window.QBANK;
const UNITS = ORDER.map(k => {
  const d = BANK[k];
  const lessons = Object.values(d.lessons);
  const qs = lessons.flatMap(l => l.questions || []);
  return {
    key: k, title: d.title, lessons, keys: lessons.map(l => l.key),
    nLessons: lessons.length, nQ: qs.length,
    nCmp: qs.filter(q => q.format === "comparison").length,
    nRules: lessons.reduce((n, l) => n + (l.rules || []).length, 0)
  };
});
const T = {
  units: UNITS.length,
  lessons: UNITS.reduce((n, u) => n + u.nLessons, 0),
  q: UNITS.reduce((n, u) => n + u.nQ, 0),
  cmp: UNITS.reduce((n, u) => n + u.nCmp, 0),
  rules: UNITS.reduce((n, u) => n + u.nRules, 0)
};
const LESSON_ORDER = UNITS.flatMap(u => u.lessons.map(l => ({ unit: u, key: l.key, title: l.title })));

/* the app's own numbers a page may quote, read out of app.js (never edited here) */
const APP = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");
const appNums = re => { const m = APP.match(re); return m ? m[1].split(",").map(Number) : []; };
const GOALS = appNums(/const GOALS\s*=\s*\[([\d,\s]+)\]/);
const MIX_N = appNums(/const MIX_N\s*=\s*(\d+)/);
const MOCK_PLAN = (APP.match(/const MOCK_SECTION_PLAN\s*=\s*\{([^}]+)\}/) || ["", ""])[1];
const MOCK_SIZES = [...MOCK_PLAN.matchAll(/\[([\d,\s]+)\]/g)].map(m => m[1].split(",").reduce((a, b) => a + +b, 0));
const MOCK_SECTIONS = appNums(/const MOCK_SECTIONS\s*=\s*(\d+)/)[0] || 2;
const ALLOWED = {
  q: new Set([T.q, T.cmp, ...UNITS.map(u => u.nQ), ...UNITS.map(u => u.nCmp), ...GOALS, ...MIX_N, ...MOCK_SIZES, ...MOCK_SIZES.map(n => n * MOCK_SECTIONS)]),
  lessons: new Set([T.lessons, ...UNITS.map(u => u.nLessons)]),
  rules: new Set([T.rules, ...UNITS.map(u => u.nRules)])
};

/* ---------------- the public pages ---------------- */
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !e.name.startsWith(".")) walk(path.join(dir, e.name), out); }
    else if (e.name.endsWith(".html")) out.push(path.join(dir, e.name));
  }
  return out;
}
function findSitemaps(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !e.name.startsWith(".")) findSitemaps(path.join(dir, e.name), out); }
    else if (e.name === "sitemap.xml" && dir !== ROOT) out.push(path.join(dir, e.name));
  }
  return out;
}
const tag = (html, re) => { const m = html.match(re); return m ? unesc(m[1].replace(/<[^>]+>/g, "").trim()) : ""; };
function git(args) { try { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch (e) { return ""; } }
function jsonldNodes(html) {
  const nodes = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j; try { j = JSON.parse(m[1]); } catch (e) { throw new Error("JSON-LD does not parse: " + e.message); }
    const add = x => { if (Array.isArray(x)) x.forEach(add); else if (x && typeof x === "object") { nodes.push(x); if (x["@graph"]) add(x["@graph"]); } };
    add(j);
  }
  return nodes;
}
const day = s => (s && /^\d{4}-\d{2}-\d{2}/.test(s)) ? s.slice(0, 10) : "";
/* which lesson a page teaches: its LearningResource's name is the lesson's
   title in the data (tools/build_lesson_pages.js writes it so); failing that,
   a file named after the lesson's key. -1 for any other page. */
function lessonOf(rel, nodes) {
  const lr = nodes.find(n => [].concat(n["@type"] || []).includes("LearningResource"));
  if (lr && lr.name) { const i = LESSON_ORDER.findIndex(l => l.title === lr.name); if (i >= 0) return i; }
  const base = path.basename(rel, ".html");
  return rel.includes("/") ? LESSON_ORDER.findIndex(l => base === l.key) : -1;
}

function readPage(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  const html = fs.readFileSync(file, "utf8");
  if (DEV_PAGES.test(rel)) return null;
  const robots = (html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i) || [])[1] || "";
  if (/noindex/i.test(robots)) return null;
  const canon = (html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i) || [])[1];
  if (!canon) return null;
  const own = rel === "index.html" ? [SITE] : [SITE + rel, ...(rel.endsWith("/index.html") ? [SITE + rel.slice(0, -10)] : [])];
  if (!own.includes(canon)) return null;
  const nodes = jsonldNodes(html);
  const mine = nodes.filter(n => [n.url, n["@id"], typeof n.mainEntityOfPage === "string" ? n.mainEntityOfPage : (n.mainEntityOfPage || {})["@id"]].some(u => u && String(u).split("#")[0] === canon));
  const modified = day((mine.find(n => n.dateModified) || nodes.find(n => n.dateModified) || {}).dateModified);
  const dirty = git(["status", "--porcelain", "--", rel]) !== "";
  const committed = day(git(["log", "-1", "--format=%cs", "--", rel]));
  const touched = dirty || !committed ? new Date(fs.statSync(file).mtime).toISOString().slice(0, 10) : committed;
  const title = tag(html, /<title>([\s\S]*?)<\/title>/i);
  return {
    file, rel, html, url: canon,
    title, name: title.split(/\s+\|\s+/)[0].trim(),
    desc: unesc((html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1] || ""),
    h1: tag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
    lastmod: modified || touched, modified, touched,
    lesson: lessonOf(rel, nodes)
  };
}

const pages = walk(ROOT, []).map(readPage).filter(Boolean);
/* the guides: the root pages and any folder page that is not a lesson (a hub) */
const isGuide = p => p.lesson < 0;
const guideRank = p => { const i = ROOT_ORDER.indexOf(p.rel); return i < 0 ? ROOT_ORDER.length + (p.rel.includes("/") ? 0 : 1) : i; };
pages.sort((a, b) => {
  if (a.rel === "index.html" || b.rel === "index.html") return a.rel === "index.html" ? -1 : 1;
  if (isGuide(a) !== isGuide(b)) return isGuide(a) ? -1 : 1;
  if (isGuide(a)) return guideRank(a) - guideRank(b) || a.rel.localeCompare(b.rel);
  return a.lesson - b.lesson || a.rel.localeCompare(b.rel);
});
const home = pages.find(p => p.rel === "index.html");
if (!home) throw new Error("index.html is not public: its canonical must be " + SITE);

/* groups for the lists: the guides, then each unit's lesson pages in the app's order */
function groups() {
  const out = [{ name: "أدلّة القسم الكمي في اختبار القدرات", pages: pages.filter(p => p !== home && isGuide(p)) }];
  for (const u of UNITS) out.push({ name: `دروس وحدة «${u.title}»`, pages: pages.filter(p => !isGuide(p) && LESSON_ORDER[p.lesson].unit === u) });
  return out.filter(g => g.pages.length);
}
const GROUPS = groups();
const href = p => "/" + (p.rel === "index.html" ? "" : p.rel.replace(/(^|\/)index\.html$/, "$1"));

/* ---------------- plain text, for llms-full.txt ---------------- */
/* Markdown, so an answer engine keeps what the page says and where it says it
   from: every link as [text](absolute URL) — a sources link to ETEC's guide
   stays beside the fact it backs, an in-page #anchor becomes page#anchor —
   every table as a real Markdown table (a header row, its |---| line, one
   line per row), and each FAQ question in bold over its answer. */
const oneLine = s => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
function absUrl(h, base) {
  try { return new URL(unesc(h), base).href.replace(/\(/g, "%28").replace(/\)/g, "%29"); } catch (e) { return ""; }
}
function mdLinks(html, base) {
  return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (m, attrs, inner) => {
    const text = oneLine(inner).replace(/[[\]]/g, c => "\\" + c);
    const h = (attrs.match(/\bhref\s*=\s*"([^"]*)"/i) || attrs.match(/\bhref\s*=\s*'([^']*)'/i) || [])[1];
    if (!text) return "";
    const u = h ? absUrl(h, base) : "";
    return u && !/^javascript:/i.test(u) ? `[${text}](${u})` : text;
  });
}
function mdTable(table) {
  const cap = oneLine((table.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i) || [])[1] || "");
  const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(r => {
    const cells = [];
    for (const c of r[1].matchAll(/<(t[dh])\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
      cells.push({ th: c[1].toLowerCase() === "th", text: oneLine(c[3]).replace(/\|/g, "\\|") });
      const span = +((c[2].match(/colspan\s*=\s*"?(\d+)/i) || [])[1] || 1);
      for (let k = 1; k < span; k++) cells.push({ th: false, text: "" });
    }
    return cells;
  }).filter(r => r.length);
  if (!rows.length) return cap ? `\n\n${cap}\n\n` : "\n\n";
  const n = Math.max(...rows.map(r => r.length));
  const line = r => "| " + Array.from({ length: n }, (x, i) => (r[i] || { text: "" }).text).join(" | ") + " |";
  const out = [line(rows[0]), "|" + "---|".repeat(n), ...rows.slice(1).map(line)];
  return "\n\n" + (cap ? `**${cap}**\n\n` : "") + out.join("\n") + "\n\n";
}
/* A power or an index in plain text. ٢<sup>٦</sup> is «٢^٦»; a power of more than one
   number or letter is bracketed («٢^(٣^٢)», «أ^(م+ن)»), and an index takes «_» («س_١»;
   <sup>٥</sup>ق<sub>٣</sub> is «^٥ق_٣»). Stripped as plain tags they ran into the
   number before them («٦٤ = ٢٦»). Nested ones go innermost first. A page may carry
   its own hidden sign inside the tag for screen readers (<span class="fr-sr pw">^</span>,
   «^(» … «)» round a longer power, «_» before an index): those are dropped first, so
   the sign is written once, here. Every <sup>/<sub> must come out as one marker, and
   no marker may come out doubled, or the build stops (SCRIPT_PROBLEMS). */
const SCRIPT_ONE = /^(?:[0-9٠-٩]+|[ء-ي])$/u;
const SCRIPT_PROBLEMS = [];
function scripts(html) {
  let s = html, prev, n = 0;
  do {
    prev = s;
    s = s.replace(/<(sup|sub)\b[^>]*>((?:(?!<\/?su[pb]\b)[\s\S])*?)<\/\1>/gi, (m, tag, inner) => {
      const x = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, "");
      n++;
      return (tag.toLowerCase() === "sup" ? "^" : "_") + (SCRIPT_ONE.test(x) ? x : `(${x})`);
    });
  } while (s !== prev);
  return { s, n };
}
const markCount = h => (h.replace(/<[^>]+>/g, "").match(/[\^_]/g) || []).length;
const PAGE_SIGN = /<span class="fr-sr pw"[^>]*>[^<]*<\/span>/g;
const DOUBLED = /\^\(\^|_\(_|\^\^|__|\^\(_|_\(\^/;
/* a fraction as the page means it: its data-t («(أ ± ب)/م»), which keeps the brackets
   the stacked bar implies; the numerator and the denominator alone lose them («أ ± ب/م») */
function fractions(s) {
  const open = /<span class="fr"([^>]*)>/g;
  let out = "", at = 0, m;
  while ((m = open.exec(s))) {
    const tag = /<(\/?)span\b[^>]*>/gi;
    tag.lastIndex = open.lastIndex;
    let depth = 1, t;
    while (depth && (t = tag.exec(s))) depth += t[1] ? -1 : 1;
    if (depth) break;
    const inner = s.slice(open.lastIndex, t.index);
    const dt = (m[1].match(/\bdata-t="([^"]*)"/) || [])[1];
    const n = (inner.match(/<span class="fr-n"[^>]*>([\s\S]*?)<\/span>/) || [])[1];
    const d = (inner.match(/<span class="fr-d"[^>]*>([\s\S]*?)<\/span>/) || [])[1];
    out += s.slice(at, m.index) + (dt != null ? dt : n != null && d != null ? `${n}/${d}` : inner);
    at = open.lastIndex = tag.lastIndex;
  }
  return out + s.slice(at);
}
function plain(html, base) {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|svg|noscript|template|head)\b[\s\S]*?<\/\1>/gi, "");
  const tags = (s.match(/<su[pb]\b/gi) || []).length;
  s = s.replace(PAGE_SIGN, "");
  const had = markCount(s);
  const sc = scripts(s);
  s = sc.s;
  const marks = markCount(s) - had;
  if (sc.n !== tags || marks !== tags || /<\/?su[pb]\b/i.test(s))
    SCRIPT_PROBLEMS.push(`${base}: ${tags} <sup>/<sub> on the page, ${marks} ^/_ marker(s) in its text`);
  s = fractions(s);
  if (/<span class="fr"/.test(s)) SCRIPT_PROBLEMS.push(`${base}: a stacked fraction could not be read`);
  s = mdLinks(s, base)
    .replace(/<table\b[\s\S]*?<\/table>/gi, mdTable)
    .replace(/<summary\b[^>]*>([\s\S]*?)<\/summary>/gi, (m, q) => `\n\n**${oneLine(q)}**\n\n`)
    .replace(/<\/span>/gi, " ")
    .replace(/<h([1-6])[^>]*>/gi, (m, n) => "\n\n" + "#".repeat(+n) + " ")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|ul|ol|details|figure|figcaption|blockquote|dd|dt|main|header|footer|nav|aside)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  s = unesc(s).split("\n").map(l => l.replace(/[ \t ]+/g, " ").trim()).join("\n");
  return s.replace(/\n{3,}/g, "\n\n").trim();
}
function bodyText(p) {
  let h = p.html;
  if (p === home) { const m = h.match(/<div class="landing(?: [^"]*)?">([\s\S]*)<\/section>/); h = m ? m[1] : ""; }
  else { const m = h.match(/<main\b[\s\S]*<\/main>/i) || h.match(/<body\b[\s\S]*<\/body>/i); h = m ? m[0] : h; }
  return plain(h, p.url);
}

/* ---------------- the home's own date ---------------- */
/* What on index.html is content: the pre-render, and the head's meta and
   JSON-LD without the dateModified itself. The loading screen, the scripts
   and the stylesheet links change with the app, and are not content. */
function homeContent(html) {
  const landing = (html.match(/<div class="landing(?: [^"]*)?">[\s\S]*?<\/section>/) || [""])[0];
  const head = (html.match(/<head>[\s\S]*?<\/head>/) || [""])[0]
    .replace(/<style[\s\S]*?<\/style>|<script>[\s\S]*?<\/script>|<link[^>]*>/g, "")
    .replace(/"dateModified": "[^"]*"/g, "");
  return (landing + head).replace(/\r\n/g, "\n");
}
const HOME_DATE_RE = /("@id": "https:\/\/qudrati\.xyz\/#webpage"[\s\S]*?"dateModified": ")(\d{4}-\d{2}-\d{2})(")/;
function homeDated(before, after) {
  const today = new Date().toISOString().slice(0, 10);
  const m = after.match(HOME_DATE_RE);
  if (!m) throw new Error('index.html: the #webpage node has no "dateModified"');
  let due = homeContent(before) !== homeContent(after);              // this run rewrites a block
  if (!due) {                                                        // edited by hand since the commit, date not moved on
    const committed = git(["show", "HEAD:index.html"]);
    const committedDay = day(git(["log", "-1", "--format=%cs", "--", "index.html"]));
    due = !!committed && homeContent(committed) !== homeContent(after) && m[2] <= committedDay;
  }
  return due && m[2] < today ? after.replace(HOME_DATE_RE, (all, a, d, b) => a + today + b) : after;
}
function between(text, a, b, inner, file) {
  const i = text.indexOf(a), j = text.indexOf(b);
  if (i < 0 || j < i) throw new Error(`${file}: markers ${a} … ${b} are missing`);
  return text.slice(0, i + a.length) + "\n" + inner + "\n" + text.slice(j);
}
const rd = f => fs.readFileSync(path.join(ROOT, f), "utf8");

/* ---------------- the outputs ---------------- */
const factsLine = `${count(T.q, "سؤال", "سؤالاً", "أسئلة")} أصلياً بحلولها في ${count(T.lessons, "درس", "درساً", "دروس")} ضمن ${UNIT_WORDS[T.units] || toAr(T.units) + " وحدات"}، منها ${count(T.cmp, "سؤال", "سؤالاً", "أسئلة")} من نوع المقارنة بين قيمتين، و${count(T.rules, "قاعدة", "قاعدة", "قواعد")} مختصرة تجمع قوانين الدروس.`
  .replace(/أسئلة أصلياً/, "أسئلة أصلية");

const factsHtml = [
  `<h2>قدراتي بالأرقام</h2>`,
  `<p>${factsLine}</p>`,
  `<div class="guide-table-wrap"><table class="guide-table"><caption>وحدات قدراتي ودروسها وأسئلتها</caption>`,
  `<thead><tr><th scope="col">الوحدة</th><th scope="col">الدروس</th><th scope="col">الأسئلة</th></tr></thead><tbody>`,
  ...UNITS.map(u => `<tr><td>${esc(u.title)}</td><td>${toAr(u.nLessons)}</td><td>${toAr(u.nQ)}</td></tr>`),
  `</tbody></table></div>`
].join("\n");

const pagesHtml = [
  `<h2>صفحات قدراتي</h2>`,
  ...GROUPS.map(g => [
    GROUPS.length > 1 ? `<h3>${esc(g.name)}</h3>` : "",
    `<ul class="about-list">`,
    ...g.pages.map(p => `<li><a href="${href(p)}">${esc(p.name)}</a></li>`),
    `</ul>`
  ].filter(Boolean).join("\n"))
].join("\n");

/* the 404 offers the way home and the guides; the lesson pages are one tap further, from the hubs */
const notFoundHtml = [home, ...pages.filter(p => p !== home && isGuide(p))].map(p =>
  `    <li><a href="${href(p)}">${esc(p === home ? "قدراتي — ابدأ التدريب" : p.name)}</a></li>`).join("\n");

/* index.html first: the home page's date and pre-render feed the sitemap and llms-full.txt below */
const idxNow = rd("index.html");
let idx = between(idxNow, "<!-- seo-facts:start -->", "<!-- seo-facts:end -->", factsHtml, "index.html");
idx = between(idx, "<!-- seo-pages:start -->", "<!-- seo-pages:end -->", pagesHtml, "index.html");
idx = homeDated(idxNow, idx);
home.html = idx;
home.modified = home.lastmod = (idx.match(HOME_DATE_RE) || [])[2] || home.lastmod;

const factsMd = [
  factsLine,
  "",
  "| الوحدة | الدروس | الأسئلة |",
  "|---|---|---|",
  ...UNITS.map(u => `| ${u.title} | ${toAr(u.nLessons)} | ${toAr(u.nQ)} |`)
].join("\n");

const pagesMd = GROUPS.map(g => [
  `### ${g.name}`,
  "",
  ...g.pages.map(p => `- [${p.name}](${p.url}): ${p.desc}${p.lastmod ? ` (آخر تحديث: ${p.lastmod})` : ""}`)
].join("\n")).join("\n\n");

const today = new Date().toISOString().slice(0, 10);
const full = [
  `# قدراتي (Qudrati) — النص الكامل لصفحات qudrati.xyz`,
  "",
  `> النص الكامل لكل صفحة عامة في قدراتي، صفحةً بعد صفحة، كما في الموقع. الفهرس المختصر: ${SITE}llms.txt`,
  `> كُتب هذا الملف آلياً من صفحات الموقع (tools/build_sitemap.js)، وعدد صفحاته ${toAr(pages.length)}.`,
  `> الأسس مكتوبة بعد «^» والأرقام السفلية بعد «_»: ٢^٦ = ٦٤، و٢^(٣^٢) = ٢^٩، وس_١ × ز_١ = س_٢ × ز_٢. والكسر «أ/ب»: أ فوق خط الكسر وب تحته.`,
  "",
  factsMd,
  "",
  ...pages.map(p => [
    "---",
    "",
    `# ${p.name}`,
    "",
    `- الرابط: ${p.url}`,
    p.lastmod ? `- آخر تحديث: ${p.lastmod}` : "",
    p.desc ? `- الوصف: ${p.desc}` : "",
    "",
    bodyText(p),
    ""
  ].filter(x => x !== null).join("\n"))
].join("\n").replace(/\n{3,}/g, "\n\n") + "\n";

const sitemap = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<!-- written by tools/build_sitemap.js — do not edit by hand -->`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
  ...pages.map(p => {
    const img = p === home ? [`    <image:image>`, `      <image:loc>${SITE}assets/og.png</image:loc>`, `    </image:image>`] : [];
    return [`  <url>`, `    <loc>${esc(p.url)}</loc>`, `    <lastmod>${p.lastmod}</lastmod>`, ...img, `  </url>`].join("\n");
  }),
  `</urlset>`, ""
].join("\n");

const out = new Map();
out.set("sitemap.xml", sitemap);
out.set("llms-full.txt", full);
let llms = rd("llms.txt");
llms = between(llms, "<!-- facts:start -->", "<!-- facts:end -->", factsMd, "llms.txt");
llms = between(llms, "<!-- pages:start -->", "<!-- pages:end -->", pagesMd, "llms.txt");
out.set("llms.txt", llms);
out.set("index.html", idx);
/* the 404 uses the content pages' font: the same URL (one cache entry) and the same fallback faces */
const contentCss = rd("css/content.css");
const fontFaces = contentCss.match(/@font-face\s*\{[^}]*\}/g) || [];
const fontUrl = ((fontFaces.find(f => /Baloo Bhaijaan 2/.test(f)) || "").match(/url\(([^)]+\.woff2[^)]*)\)/) || [])[1];
if (!fontUrl || !/\?v=/.test(fontUrl) || fontFaces.length < 2)
  throw new Error("css/content.css: no versioned Baloo Bhaijaan 2 @font-face and fallback faces to copy into 404.html");
let nf = rd("404.html");
nf = between(nf, "<!-- pages:start -->", "<!-- pages:end -->", notFoundHtml, "404.html");
nf = between(nf, "<!-- font-preload:start -->", "<!-- font-preload:end -->", `<link rel="preload" href="${fontUrl}" as="font" type="font/woff2" crossorigin>`, "404.html");
nf = between(nf, "/* fonts:start */", "/* fonts:end */", fontFaces.join("\n"), "404.html");
/* and the same font stack as the content pages' body, so every family it names is declared above */
const fontStack = ((contentCss.match(/\bbody\s*\{[^}]*?font-family:\s*([^;]+);/) || [])[1] || "").trim();
if (!fontStack) throw new Error("css/content.css: body has no font-family to copy into 404.html");
nf = between(nf, "/* font-stack:start */", "/* font-stack:end */", `  --font: ${fontStack};`, "404.html");
out.set("404.html", nf);

/* ---------------- the checks ---------------- */
const problems = [], warnings = [], issues = [];   // problems block a write; issues (on pages this script does not write) only fail --check
function checkCounts(label, text) {
  const t = text.replace(/<[^>]+>/g, " ");
  for (const m of t.matchAll(/([٠-٩]+)\s*(سؤالاً|سؤال|أسئلة|درساً|درس|دروس|قاعدة|قواعد)/g)) {
    const n = fromAr(m[1]), w = m[2];
    const set = /سؤال|أسئلة/.test(w) ? ALLOWED.q : /درس|دروس/.test(w) ? ALLOWED.lessons : ALLOWED.rules;
    if (!set.has(n)) problems.push(`${label}: «${m[0]}» is not a count the data or the app has (allowed: ${[...set].sort((a, b) => a - b).join(", ")})`);
  }
}
const landing = (idx.match(/<div class="landing(?: [^"]*)?">[\s\S]*?<\/section>/) || [""])[0]
  .replace(/<!-- seo-pages:start -->[\s\S]*?<!-- seo-pages:end -->/, "");   // that block quotes other pages' own titles
const head = (idx.match(/<head>[\s\S]*?<\/head>/) || [""])[0].replace(/<style[\s\S]*?<\/style>|<script>[\s\S]*?<\/script>/g, "");
checkCounts("index.html pre-render", landing);
checkCounts("index.html head", head);
checkCounts("llms.txt", llms
  .replace(/<!-- pages:start -->[\s\S]*?<!-- pages:end -->/, "")            // the pages block quotes other pages' own descriptions
  .replace(/<!-- exam-facts:start[\s\S]*?<!-- exam-facts:end -->/, ""));    // and this one quotes ETEC's guide

/* any other sitemap in the tree (a generator's own) must agree with this one */
const LASTMOD = new Map(pages.map(p => [p.url, p.lastmod]));
for (const sm of findSitemaps(ROOT, [])) {
  const rel = path.relative(ROOT, sm).split(path.sep).join("/");
  for (const m of fs.readFileSync(sm, "utf8").matchAll(/<loc>([^<]+)<\/loc>\s*(?:<lastmod>([^<]+)<\/lastmod>)?/g)) {
    const loc = unesc(m[1]);
    if (!LASTMOD.has(loc)) issues.push(`${rel}: lists ${loc}, which is not a public page`);
    else if (m[2] && day(m[2]) !== LASTMOD.get(loc)) issues.push(`${rel}: lastmod ${m[2]} for ${loc}, but sitemap.xml has ${LASTMOD.get(loc)}`);
  }
}
for (const p of pages) {
  const html = p === home ? landing + head : p.html;
  if (/·/.test(html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ""))) (p === home ? problems : issues).push(`${p.rel}: uses «·» as a separator — use «—» or «،»`);
  if (!p.modified) warnings.push(`${p.rel}: no JSON-LD dateModified; lastmod falls back to ${p.lastmod}`);
  else if (p.touched > p.modified && p !== home) warnings.push(`${p.rel}: file changed ${p.touched}, later than its dateModified ${p.modified}`);
  if (!p.desc) issues.push(`${p.rel}: no meta description`);
}
if (/·/.test(llms)) problems.push("llms.txt: uses «·»");
problems.push(...SCRIPT_PROBLEMS);
{
  const bad = full.split("\n").filter(l => DOUBLED.test(l));
  if (bad.length) problems.push(`llms-full.txt: ${bad.length} line(s) with a doubled power or index sign, e.g. «${bad[0].slice(0, 120)}»`);
}
/* every family the 404's font stack names is declared on the page, or is a font the system has */
{
  const SYSTEM = new Set(["system-ui", "sans-serif", "serif", "segoe ui", "tahoma", "geeza pro", "arial"]);
  const declared = new Set([...nf.matchAll(/@font-face\s*\{[^}]*?font-family:\s*["']?([^"';]+)["']?\s*;/g)].map(m => m[1].trim().toLowerCase()));
  const stack = ((nf.match(/--font:\s*([^;]+);/) || [])[1] || "").split(",").map(f => f.trim().replace(/^["']|["']$/g, "").toLowerCase());
  if (!stack[0] || !declared.has(stack[0])) problems.push(`404.html: its font stack opens on «${stack[0] || ""}», which no @font-face on the page declares`);
  for (const f of stack) if (!declared.has(f) && !SYSTEM.has(f)) problems.push(`404.html: its font stack names «${f}», which no @font-face on the page declares`);
}

/* ---------------- write ---------------- */
let stale = 0;
for (const [f, text] of out) {
  const abs = path.join(ROOT, f);
  const now = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
  if (now === text) continue;
  stale++;
  if (CHECK) console.log("stale: " + f);
  else if (!problems.length) fs.writeFileSync(abs, text);
}
console.log(`${pages.length} public pages: ${pages.map(p => p.rel).join(", ")}`);
console.log(`data: ${T.units} units, ${T.lessons} lessons, ${T.q} questions (${T.cmp} comparison), ${T.rules} rules`);
for (const w of warnings) console.log("warning: " + w);
for (const p of issues) console.log("ISSUE: " + p);
for (const p of problems) console.log("PROBLEM: " + p);
if (problems.length) { console.log(CHECK ? "check failed" : "nothing written"); process.exit(1); }
if (CHECK) {
  if (stale) console.log(`check failed: ${stale} output(s) stale — run node tools/build_sitemap.js`);
  else if (issues.length) console.log(`check failed: ${issues.length} issue(s) on pages this script does not write`);
  else console.log("check passed: every output is current");
  process.exit(stale || issues.length ? 1 : 0);
}
console.log(stale ? `wrote ${stale} file(s)` : "every output already current");
