#!/usr/bin/env node
/* SEO / AEO monitor for qudrati.xyz. Zero dependencies (Node 18+, built-in fetch).

   It crawls the site the way a search or answer engine would, compares it against
   the app's own data and ETEC's published facts, and appends one line of numbers
   per run to tools/seo/history.json so a regression shows up as a diff.

   usage:
     node tools/seo/audit.js                         # http://localhost:8080 (node tools/serve.js first)
     node tools/seo/audit.js http://localhost:8204   # any local port
     node tools/seo/audit.js https://qudrati.xyz     # the live site (adds host / redirect / header checks)

   flags:
     --render=sitemap|all|home|none   pages to render in headless Chrome (default sitemap)
     --offline          no requests outside the audited site (skips ETEC watch and external links)
     --no-local         do not compare against files on disk (when auditing a staging copy)
     --no-history       do not append to tools/seo/history.json
     --json=FILE        also write the full report as JSON
     --strict           exit 1 on warnings as well as errors
     --quiet            print only errors, the summary and the regressions
     --lighthouse=auto|all|off   Lighthouse mobile on the pages in perf.json (auto, the default,
                        runs when a Lighthouse CLI is already cached; all = every sitemap page)
     --no-generators    skip the tools/build_*.js --check runs and the data validators
     --font-cls=auto|all|off   CLS with the web font held back, on a phone's fonts (no Arial, Noto
                        Naskh Arabic) at perf.json's widths (320–412 px) and on this machine's, on
                        perf.json's pages (auto, the default) or every sitemap page but the home (all)
     --update-vocab     refresh schema-vocab.json from schema.org and exit
     --baseline=TIME    compare with the history entry whose «at» starts with TIME (default: the
                        last run in the same environment whose content hash differs from this one)
     --help, -h         print this usage and exit (nothing is fetched or written)
     QSEO_ROOT=DIR      (environment) compare against the files of another tree, e.g. a copy of
                        the site with faults planted in it; default: the tree this file sits in.
                        Its history goes to DIR/tools/seo/history.json, never to this folder's
                        (no such folder there: no history), so a fixture is never a real baseline

   exit code: 0 clean, 1 errors (or warnings with --strict), 2 the audit itself failed or an
   unknown flag was given (checked before anything is fetched or written).

   files beside it:
     facts.json        exam facts read off ETEC's own pages (with the date), the ground truth for
                       every percentage or count about the exam on our pages
     ai-queries.json   what students type, what our page must carry to answer it, and a log for
                       checking ChatGPT / Perplexity / Gemini / Google AI Overviews by hand
     accepted.json     findings the user has ruled on: reported as notes, never fail a run
     perf.json         the pages Lighthouse runs on, and their budgets (CLS, LCP, scores)
     keywords.json     seeds for suggest.js; suggest/<date>.json are its autocomplete snapshots
     history.json      one entry per run; the next run prints what got better or worse
     indexnow.js       submits changed sitemap URLs to IndexNow (dry run unless --submit)

   What it checks, and why each one is here:
     robots.txt   rules for Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
                  Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended,
                  Applebot, Applebot-Extended, CCBot against every sitemap URL (Google's matching:
                  longest pattern wins, * and $ supported); the same page fetched with each
                  bot's user agent must come back identical; the policy: every sitemap URL and the
                  llms files open to every agent (each one robots.txt names, «*», a bot it does not
                  name), the dev tooling / notes / harnesses closed to every non-search agent
     sitemap      parse, absolute canonical-host URLs, valid and non-future lastmod, every URL
                  200 + indexable + self-canonical + not robots-blocked; lastmod against the
                  page's JSON-LD dateModified, its visible <time>, and (local runs) the file's
                  git / working-tree date
     crawl        from /, the sitemap and llms.txt; status, redirect chains, broken internal
                  links and #fragments, trailing-slash links, links to redirects, orphans
                  (no inbound link from another page), indexable pages missing from the sitemap,
                  local .html files that are neither in the sitemap nor noindex
     per page     one <title> and meta description (length, duplicates, brand, «القدرات» in the
                  title), one canonical equal to og:url, lang="ar" dir="rtl", viewport, one H1,
                  hreflang reciprocity, images (alt, width/height, bytes), HTML and subresource
                  weight (a GET counted raw and as sent, br / gzip: a HEAD's Content-Length is
                  missing on Vercel), render-blocking CSS / JS, empty or generic anchor text;
                  every robots / googlebot / bingbot meta (the most restrictive wins), nofollow
                  on a sitemap page; internal URLs written http://, www. or on an old host (links,
                  og:url, JSON-LD, hreflang), which redirect on the live site
     text         Latin digits, emoji and «·» in visible Arabic text, title and description;
                  counts of lessons / questions / rules / comparison questions against
                  js/data (digits and number words; a smaller number stated as the app's whole
                  bank, «في قدراتي ٢٠٠ سؤال», is an error, a subset a note), the false «literary
                  track excludes questions» claim in any wording (يُخفي، أسئلة أقل، حمل أخفّ،
                  hides, filters) and worded as a choice (أسئلة المسار الأدبي فقط، حسب مسارك،
                  تتغيّر الأسئلة، only … for their track, tailored; ETEC's own test and the mock,
                  which the track does change, left out), English counts with up to two
                  adjectives («300 original questions»), exam percentages against tools/seo/facts.json, each held to its own cell
                  where its domain and track can be read («حساب ٢٣٪» inside «العلمية ٤٥٪ (…)»,
                  «٤٥٪ من اختبار التخصصات العلمية», a table's row and column), the context being
                  the sentence and the two before it (a FAQ answer's question, a heading), and
                  whether such a page cites a deep ETEC link; rule headings whose formula differs
                  from the data (an error when its signs or numbers differ, a warning when only
                  its words do); JSON-LD strings get the same checks, inside @graph and @list too;
                  og:description, og:image:alt, twitter:*, img alt and aria-label get the title's
                  (no «·», emoji or Latin digits) and the equation check; counts a page states
                  about itself in its title, descriptions, H1 and JSON-LD («١١ قانوناً»، «٣ أسئلة
                  محلولة»، «١٠ منها بمثال») against its own rule sections and question cards
     rules        a rule card found by its anchor (<section id="handshakes">, the generator's
                  slugs) shows teach.js's worked example under «مثال:»; a table row that links a
                  rule's anchor (the laws hub's 423 rows) shows the data's formula (error);
                  every equation of plain numbers on a page or in llms(-full).txt holds
                  («(٤ × ٣) ÷ ٢ = ١٢ ÷ ٢ = ٦»; a stacked fraction is read as one number, a
                  quoted trap and a side with a letter in it are skipped); a <sup> / <sub>
                  without its hidden sign (<span class="fr-sr pw">^</span>)
     JSON-LD      parse, required / recommended properties for Article, BreadcrumbList, FAQPage,
                  Organization, WebSite, WebPage types, SoftwareApplication types, Quiz /
                  Question, ItemList, DefinedTermSet, Course; FAQ and Quiz text visible on the
                  page (an answer that is not the visible one is an error, drift a note); site
                  URLs inside it resolve; dates real (2026-13-45 is no date, not a future one;
                  the same for sitemap lastmod and <time datetime>); any aggregateRating / review
                  (the project has no ratings) is an error
     rendering    raw HTML (what a non-JS crawler or most AI fetchers see) against the DOM after
                  JavaScript in headless Chrome with Googlebot's smartphone agent, over the
                  DevTools Protocol: words, links, H1, title, canonical, robots (a noindex or
                  nofollow JavaScript adds, any directive it drops or adds), JSON-LD blocks;
                  content that exists only after JavaScript (render-only-content); and what a
                  reader can see — computed styles mark display:none, visibility:hidden,
                  opacity:0, off-screen and clipped blocks, text the colour of its background
                  (contrast under 1.5:1) and text drawn outside the page or the box that clips it
                  (text-indent, measured with Range.getClientRects), so a hidden block of more than eight
                  words is «hidden-text» and FAQ / Quiz / query checks read only visible text
                  (collapsed <details> count as visible, as Google counts them)
     questions    every bank question a page shows (id="q-<bank id>"): stem, each comparison value
                  in its own cell (and the heading that repeats them, apart),
                  choices, the answer's letter and text, the solution's lines, against js/data;
                  every Quiz Question in JSON-LD matched to the bank by its text, its accepted /
                  suggested answers and positions against the bank's choices; a count one page
                  states about another page's solved questions against that page's cards
     images       og:image, twitter:image and JSON-LD image / logo / thumbnailUrl (arrays and
                  ImageObject too): 200, an image content-type, the real pixel size against
                  og:image:width/height, Article images of 50,000 px and 1200 px wide
     entities     a JSON-LD @id defined on several pages must carry the same name,
                  alternateName, url, logo, sameAs and description on all of them
     llms.txt     every link resolves, every sitemap page is listed, the same text checks
     llms-full    the whole-site text: counts and claims, a section for every sitemap page and
                  none other, each section's date equal to the page's sitemap lastmod; every
                  Markdown table well formed; every qudrati.xyz link and #fragment resolving to a
                  page and an id on it; ETEC's guide PDF cited; no broken exponent marks
                  («^(^٢)», «_(_», «^^»); every rule table row the data's formula; under each
                  page section's «### heading» the page's own «القانون:» (error) and «مثال:»
                  lines, and every rule the page states present
     facts        tables that report the bank (by unit and in total) cell by cell against
                  js/data; the difficulty split («١٥ سهلاً …»); the mock exam's questions a
                  section, minutes and sections against js/app.js (MOCK_SECTION_PLAN, MOCK_SECS,
                  MOCK_SECTIONS, read, never run); FAQPage text equal to its visible <details>,
                  and no number in a FAQ answer's markup that the visible answer lacks; the
                  official practice tests' counts («٤٤ سؤالاً كمياً من ٩٦», «١١ من ٢٤ في العلمي»,
                  «أول ٦ أسئلة في كل قسم») and the exam's length («ساعتان وخمس دقائق», «١٢٥ دقيقة
                  لـ١٢٠ سؤالاً») against facts.json, which holds what was read off ETEC's PDFs;
                  any sentence about the exam itself (not قدراتي, its mock or level test, ETEC's
                  practice tests or another exam) is a fact too: «N أقسام» in digits or words,
                  «N سؤال» as its total, a section's (its own clause says «كل قسم») or a part's,
                  «N دقيقة» after مدة / زمن / يستغرق, and the English «6 sections», «130 questions»
                  (fact-exam-sections / -questions / -minutes); a JSON-LD FAQ question must be a
                  visible <summary>, <dt> or question heading word for word, or it is
                  faq-question-unmatched, named with the visible question it likely became
     fonts        every @font-face, preloaded and fonts.gstatic.com file answers with a real font;
                  a site font is named by one URL only, its ?v= the first 8 hex of its sha1
     font CLS     CLS with the site's web font held back 1 s and 2.5 s, on a phone's fonts (no
                  Arial; Noto Naskh Arabic, Google Fonts' file pinned by sha1, ready at first
                  paint) at every width in perf.json (320, 340, 375, 390, 412) and on this
                  machine's, with the elements that moved; the fonts that really painted text
                  (CSS.getPlatformFontsForNode) flag a run an installed copy of the site font
                  painted, which a phone would not have
     orphans      inbound links counted on the rendered DOM where a page was rendered, so a page
                  linked only from the home's pre-render (which the app replaces) shows up
     live only    http → https, www and qudrati-lime.vercel.app → apex (root, a deep path and
                  /x.html/), qudrati.xyz/x.html/ → 308 /x.html, /dir/ sitemap URLs stay 200, a real
                  404, Cache-Control on versioned assets and sw.js, the IndexNow key file,
                  X-Robots-Tag on internal files (.md, /tools/, harnesses)
     local only   vercel.json run as Vercel would run it (path-to-regexp sources, `has`, header
                  overrides) on sample requests: old hosts and www redirect at the root and
                  deep, every sitemap /x.html/ redirects to /x.html, no sitemap URL is redirected,
                  noindexed or cached as immutable, sw.js is not cached; internal files' noindex;
                  the committed generators (tools/build_*.js) in --check mode, so a stale output
                  is an error; tools/validate*.js
     Lighthouse   mobile scores, FCP, LCP (and its element), CLS, TBT, bytes per page in perf.json
     ETEC watch   re-reads ETEC's GAT page (its tables and the updateDate of each item in
                  facts.json), the guide PDF (size, Last-Modified, its own last /ModDate) and every
                  ETEC / Qiyas link our pages cite (status, redirect, the item still there)
     opportunities  rules in js/data with no page heading, the latest autocomplete snapshot
                  (tools/seo/suggest.js) matched against rule names with no heading, and every
                  query in tools/seo/ai-queries.json: does a crawled page answer it, in the DOM
                  Google renders or only in raw HTML (AI fetchers)?
     history      one compact JSON line per run, the last 200 (every localhost port is «local»,
                  qudrati.xyz is «live»; font CLS kept as the worst run a page; a Lighthouse run
                  that crashed, retried once, kept as an error and never compared), with
                  a hash of the sitemap pages' bytes, the local commit (local runs) or the
                  deployed sw.js VERSION and shell ?v= (live runs), a hash of js/data, the check
                  families that ran (Lighthouse, render, network, generators, local, font CLS)
                  and a hash of the monitor itself (audit.js and its JSON files). Compared with
                  the last run in the same environment whose content differs and whose checks
                  match (or the one --baseline names): a family that did not run in both is not
                  compared; a diff with the site unchanged and the monitor changed is put down
                  to the monitor; only a changed site counts as fixed / new
*/
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const vm = require("vm");
const zlib = require("zlib");
const { spawn, execFileSync } = require("child_process");

/* the site's files on disk; QSEO_ROOT points a copy of the monitor at another tree (a fixture) */
const ROOT = process.env.QSEO_ROOT ? path.resolve(process.env.QSEO_ROOT) : path.join(__dirname, "..", "..");
const SEO = __dirname;
const CANON = "https://qudrati.xyz";
const CANON_HOSTS = ["qudrati.xyz", "www.qudrati.xyz"];
const argv = process.argv.slice(2);
const flag = (name, def) => {
  const a = argv.find(x => x === "--" + name || x.startsWith("--" + name + "="));
  if (!a) return def;
  return a.includes("=") ? a.slice(a.indexOf("=") + 1) : true;
};
/* --help and unknown flags are settled before anything is fetched or written */
const KNOWN_FLAGS = new Set(["render", "offline", "no-local", "no-history", "json", "strict", "quiet", "lighthouse", "no-lighthouse", "no-generators", "update-vocab", "baseline", "help", "font-cls"]);
if (argv.includes("--help") || argv.includes("-h")) {
  const src = fs.readFileSync(__filename, "utf8");
  console.log(src.slice(src.indexOf("/*") + 2, src.indexOf("What it checks")).replace(/^ {3}/gm, "").trim());
  process.exit(0);
}
{
  const bad = argv.filter(a => a.startsWith("-") && !(a.startsWith("--") && KNOWN_FLAGS.has(a.slice(2).split("=")[0])));
  const pos = argv.filter(a => !a.startsWith("-"));
  if (bad.length || pos.length > 1 || (pos[0] && !/^https?:\/\/[^\s/]+/.test(pos[0]))) {
    console.error(`unknown argument(s): ${[...bad, ...(pos.length > 1 ? pos.slice(1) : pos[0] && !/^https?:\/\//.test(pos[0]) ? [pos[0]] : [])].join(" ")}\nusage: node tools/seo/audit.js [baseUrl] [--flags]   (--help lists them)`);
    process.exit(2);
  }
}
const BASE = (argv.find(a => !a.startsWith("-")) || "http://localhost:8080").replace(/\/+$/, "");
const BASE_ORIGIN = new URL(BASE).origin;
const LIVE = CANON_HOSTS.includes(new URL(BASE).hostname);
const RENDER = String(flag("render", "sitemap"));
const OFFLINE = !!flag("offline", false);
const QUIET = !!flag("quiet", false);
const STRICT = !!flag("strict", false);
const HISTORY = !flag("no-history", false);
const JSON_OUT = flag("json", "");
const HISTORY_FILE = !process.env.QSEO_ROOT ? path.join(SEO, "history.json")
  : path.resolve(ROOT, "tools", "seo") === path.resolve(SEO) ? path.join(SEO, "history.json")
  : fs.existsSync(path.join(ROOT, "tools", "seo")) ? path.join(ROOT, "tools", "seo", "history.json") : null;
/* a page's font-CLS runs as one row: the worst CLS, the run that gave it, how many ran and failed.
   An entry from before round 7 kept every run ({ "phone1000@340": { cls, fcp }, … }); this folds it. */
/* the last 200 runs: a full run is about 11 KB a line (its 35 pages are most of it), so the file
   stays near 2 MB at most */
const HISTORY_MAX = 200;
function fclsWorst(row) {
  if (!row || typeof row !== "object") return null;
  if ("worst" in row && (row.worst == null || typeof row.worst === "number")) return row;
  const runs = Object.entries(row), ok = runs.filter(([, v]) => v && !v.error && typeof v.cls === "number").sort((a, b) => b[1].cls - a[1].cls);
  const local = runs.some(([, v]) => v && v.local);
  return { worst: ok.length ? ok[0][1].cls : null, at: ok.length ? ok[0][0] : null, runs: runs.length, failed: runs.filter(([, v]) => v && v.error).length, ...(local ? { local: true } : {}) };
}
const MAX_PAGES = 400;
const UA = "QudratiSEOAudit/1.0 (+https://qudrati.xyz/)";
const GOOGLEBOT_MOBILE = "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const BOTS = [
  { name: "Googlebot", kind: "search", ua: GOOGLEBOT_MOBILE },
  { name: "Bingbot", kind: "search", ua: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" },
  { name: "OAI-SearchBot", kind: "search", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)" },
  { name: "ChatGPT-User", kind: "user", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot" },
  { name: "GPTBot", kind: "training", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot" },
  { name: "Claude-SearchBot", kind: "search", ua: "Mozilla/5.0 (compatible; Claude-SearchBot/1.0; +https://www.anthropic.com)" },
  { name: "Claude-User", kind: "user", ua: "Mozilla/5.0 (compatible; Claude-User/1.0; +https://www.anthropic.com)" },
  { name: "ClaudeBot", kind: "training", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)" },
  { name: "PerplexityBot", kind: "search", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)" },
  { name: "Perplexity-User", kind: "user", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)" },
  { name: "Google-Extended", kind: "training", ua: null },
  { name: "Applebot", kind: "search", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)" },
  { name: "Applebot-Extended", kind: "training", ua: null },
  { name: "CCBot", kind: "training", ua: "CCBot/2.0 (https://commoncrawl.org/faq/)" },
];
const CHROME = process.env.CHROME || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].find(p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } });

/* ---------- issues ---------- */
const issues = [];
const ONCE = new Set(); // site-wide notes reported once, not per page
function add(level, code, where, msg, evidence) {
  issues.push({ level, code, where: where ? shortUrl(where) : "", msg, evidence: evidence == null ? "" : String(evidence).slice(0, 400) });
}
const shortUrl = u => String(u).replace(BASE_ORIGIN, "").replace(CANON, "") || "/";

/* ---------- small utils ---------- */
const AR = "٠١٢٣٤٥٦٧٨٩";
const toAr = n => String(n).replace(/[0-9]/g, d => AR[d]);
const fromAr = s => String(s).replace(/[٠-٩]/g, d => String(AR.indexOf(d))).replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
const today = new Date().toISOString().slice(0, 10);
const kb = n => (n / 1024).toFixed(1) + " KB";
async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}
const toBase = u => {
  try {
    const x = new URL(u);
    if (CANON_HOSTS.includes(x.hostname) && !LIVE) return BASE_ORIGIN + x.pathname + x.search + x.hash;
    return x.href;
  } catch (e) { return u; }
};
const toCanon = u => { try { const x = new URL(u); if (x.origin === BASE_ORIGIN) return CANON + x.pathname + x.search + x.hash; return x.href; } catch (e) { return u; } };
const isSite = u => { try { const x = new URL(u); return x.origin === BASE_ORIGIN || CANON_HOSTS.includes(x.hostname); } catch (e) { return false; } };
const stripHash = u => u.split("#")[0];
/* a URL meant for this site that is not written https://qudrati.xyz/…: http://, www. or an old
   host. Local runs map those onto the local server (toBase), so without this a link that
   redirects on the live site passes every check until after it ships. */
const OLD_HOSTS = ["qudrati-lime.vercel.app"];
const offCanon = u => { try { const x = new URL(u); if (!CANON_HOSTS.includes(x.hostname) && !OLD_HOSTS.includes(x.hostname)) return null; if (x.protocol === "https:" && x.hostname === "qudrati.xyz" && !x.port) return null; return x.protocol !== "https:" ? x.protocol.replace(":", "") + "://" : x.hostname !== "qudrati.xyz" ? x.hostname : "port " + x.port; } catch (e) { return null; } };

/* ---------- HTTP ---------- */
const cache = new Map();
async function http(url, opt = {}) {
  const key = (opt.method || "GET") + " " + url + " " + (opt.ua || "");
  if (!opt.noCache && cache.has(key)) return cache.get(key);
  const p = (async () => {
    const t0 = Date.now();
    try {
      const res = await fetch(url, {
        method: opt.method || "GET", redirect: "manual",
        headers: { "user-agent": opt.ua || UA, "accept-language": "ar,en;q=0.5", ...(opt.headers || {}) },
        signal: AbortSignal.timeout(opt.timeout || 25000),
      });
      const headers = Object.fromEntries(res.headers.entries());
      let buf = Buffer.alloc(0);
      if ((opt.method || "GET") !== "HEAD") buf = Buffer.from(await res.arrayBuffer());
      return { url, status: res.status, headers, buf, body: opt.binary ? "" : buf.toString("utf8"), bytes: buf.length, ms: Date.now() - t0, location: headers.location ? new URL(headers.location, url).href : null };
    } catch (e) {
      return { url, status: 0, headers: {}, buf: Buffer.alloc(0), body: "", bytes: 0, ms: Date.now() - t0, error: String(e.cause && e.cause.code || e.name || e) };
    }
  })();
  if (!opt.noCache) cache.set(key, p);
  return p;
}
async function chain(url, opt = {}) {
  const hops = []; let u = url, r;
  for (let i = 0; i < 6; i++) {
    r = await http(u, opt);
    hops.push({ url: u, status: r.status });
    if (r.status >= 300 && r.status < 400 && r.location) { u = r.location; continue; }
    break;
  }
  return { final: r, hops };
}
/* a resource's status without downloading big files */
async function probe(url) {
  let r = await http(url, { method: "HEAD" });
  if (r.status === 405 || r.status === 501 || r.status === 0) r = await http(url, { headers: { range: "bytes=0-0" } });
  return r;
}
/* a resource's real weight. A HEAD's Content-Length cannot be trusted for this: Vercel answers
   a client that accepts br (Node's fetch always does) with a compressed body and no
   Content-Length, so every subresource read 0 on the live site. This GETs the file with
   node:http(s), which does not decode, asking for br / gzip as a browser does: the bytes
   counted are the bytes on the wire; decoding them gives the raw size. No redirect is
   followed (the status is what the page's own URL gets). raw / wire are null when unknown —
   never 0 for a 200 that could not be measured. */
const sizeCache = new Map();
function sizeOf(url) {
  if (sizeCache.has(url)) return sizeCache.get(url);
  const p = new Promise(resolve => {
    let u; try { u = new URL(url); } catch (e) { return resolve({ url, status: 0, raw: null, wire: null, enc: "", headers: {}, error: "bad url" }); }
    const mod = u.protocol === "https:" ? require("https") : require("http");
    const done = v => { clearTimeout(timer); resolve(v); };
    const req = mod.get(u, { headers: { "user-agent": UA, "accept-encoding": "br, gzip, deflate", accept: "*/*" } }, res => {
      const chunks = []; let n = 0;
      res.on("data", c => { chunks.push(c); n += c.length; });
      res.on("end", () => {
        const enc = String(res.headers["content-encoding"] || "").toLowerCase().trim();
        const buf = Buffer.concat(chunks);
        let raw = null;
        try {
          raw = !enc || enc === "identity" ? n
            : enc === "br" ? zlib.brotliDecompressSync(buf).length
            : enc === "gzip" || enc === "x-gzip" ? zlib.gunzipSync(buf).length
            : enc === "deflate" ? zlib.inflateSync(buf).length : null;
        } catch (e) { raw = null; }
        const cl = Number(res.headers["content-length"]);
        if (raw == null && !enc && Number.isFinite(cl)) raw = cl;
        const known = res.statusCode !== 200 || n > 0 || cl === 0;
        done({ url, status: res.statusCode, raw: known ? raw : null, wire: known ? n : null, enc, headers: res.headers, location: res.headers.location ? new URL(res.headers.location, url).href : null });
      });
      res.on("error", e => done({ url, status: res.statusCode || 0, raw: null, wire: null, enc: "", headers: res.headers || {}, error: String(e.code || e) }));
    });
    const timer = setTimeout(() => { try { req.destroy(new Error("timeout")); } catch (e) { } }, 30000);
    req.on("error", e => done({ url, status: 0, raw: null, wire: null, enc: "", headers: {}, error: String(e.code || e.message || e) }));
  });
  sizeCache.set(url, p);
  return p;
}
const kbBoth = s => s.raw == null ? "size unknown" : s.wire != null && s.enc && s.enc !== "identity" ? `${kb(s.raw)} raw, ${kb(s.wire)} ${s.enc}` : `${kb(s.raw)}`;

/* ---------- a forgiving HTML parser ---------- */
const VOID = new Set("area base br col embed hr img input link meta source track wbr param keygen".split(" "));
const RAWTEXT = new Set(["script", "style", "textarea", "title", "xmp"]);
const BLOCK = new Set("address article aside blockquote body br dd details dialog div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr li main nav ol p pre section summary table tbody td tfoot th thead tr ul caption html head option button label".split(" "));
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", laquo: "«", raquo: "»", mdash: "—", ndash: "–", hellip: "…", copy: "©", reg: "®", times: "×", divide: "÷", rlm: "\u200f", lrm: "\u200e", zwj: "\u200d", zwnj: "\u200c", middot: "·", minus: "−", rarr: "→", larr: "←", bull: "•", shy: "\u00ad" };
const decode = s => s.indexOf("&") < 0 ? s : s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === "#") { const c = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); try { return String.fromCodePoint(c); } catch (x) { return m; } }
  const v = ENT[e.toLowerCase()]; return v == null ? m : v;
});
const IMPLIED = { li: ["li"], p: ["p"], option: ["option"], tr: ["tr", "td", "th"], td: ["td", "th"], th: ["td", "th"], dt: ["dt", "dd"], dd: ["dt", "dd"] };
const CLOSES_P = new Set("address article aside blockquote details div dl fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr main nav ol p pre section table ul".split(" "));
function parseHTML(src) {
  const root = { tag: "#root", attrs: {}, children: [], parent: null };
  let cur = root, i = 0; const n = src.length;
  const text = t => { if (t) cur.children.push({ text: decode(t), parent: cur }); };
  const close = tag => { for (let e = cur; e && e !== root; e = e.parent) if (e.tag === tag) { cur = e.parent; return; } };
  while (i < n) {
    const lt = src.indexOf("<", i);
    if (lt < 0) { text(src.slice(i)); break; }
    if (lt > i) text(src.slice(i, lt));
    if (src.startsWith("<!--", lt)) { const e = src.indexOf("-->", lt + 4); i = e < 0 ? n : e + 3; continue; }
    const c1 = src[lt + 1];
    if (c1 === "!" || c1 === "?") { const e = src.indexOf(">", lt); i = e < 0 ? n : e + 1; continue; }
    if (c1 === "/") {
      const m = /^<\/([a-zA-Z][\w:.-]*)\s*>/.exec(src.slice(lt, lt + 80));
      if (!m) { text("<"); i = lt + 1; continue; }
      close(m[1].toLowerCase()); i = lt + m[0].length; continue;
    }
    const m = /^<([a-zA-Z][\w:.-]*)/.exec(src.slice(lt, lt + 80));
    if (!m) { text("<"); i = lt + 1; continue; }
    const tag = m[1].toLowerCase();
    let k = lt + m[0].length, q = null;
    for (; k < n; k++) { const c = src[k]; if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === ">") break; }
    const inner = src.slice(lt + m[0].length, k);
    const selfClose = /\/\s*$/.test(inner);
    const attrs = {}; const are = /([^\s=\/"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g; let a;
    while ((a = are.exec(inner))) { const nm = a[1].toLowerCase(); if (!(nm in attrs)) attrs[nm] = decode(a[2] != null ? a[2] : a[3] != null ? a[3] : a[4] != null ? a[4] : ""); }
    i = k + 1;
    if (IMPLIED[tag] && IMPLIED[tag].includes(cur.tag)) cur = cur.parent;
    else if (tag === "li") { for (let e = cur; e && e !== root && !["ul", "ol", "menu"].includes(e.tag); e = e.parent) if (e.tag === "li") { cur = e.parent; break; } }
    if (CLOSES_P.has(tag) && cur.tag === "p") cur = cur.parent;
    const el = { tag, attrs, children: [], parent: cur };
    cur.children.push(el);
    if (RAWTEXT.has(tag)) {
      const re = new RegExp("</" + tag + "\\s*>", "ig"); re.lastIndex = i; const e = re.exec(src);
      const raw = src.slice(i, e ? e.index : n);
      el.children.push({ text: tag === "script" || tag === "style" ? raw : decode(raw), parent: el });
      i = e ? e.index + e[0].length : n; continue;
    }
    if (!VOID.has(tag) && !selfClose) cur = el;
  }
  return root;
}
function walk(node, fn) { fn(node); if (node.children) for (const c of node.children) walk(c, fn); }
function all(root, pred) { const out = []; walk(root, n => { if (n.tag && pred(n)) out.push(n); }); return out; }
const byTag = (root, t) => all(root, n => n.tag === t);
const SKIP_TEXT = new Set(["script", "style", "template", "head"]);
/* hidden without CSS files: the hidden attribute or an inline display:none / visibility:hidden
   (what a parser can know; the rendered pass reads computed styles) */
const INLINE_HIDDEN = /(^|;)\s*(display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0(?![.\d])|text-indent\s*:\s*-\d{3,})/i;
const isHiddenEl = n => !!n.attrs && ("hidden" in n.attrs && n.attrs.hidden !== "until-found" || INLINE_HIDDEN.test(n.attrs.style || ""));
function textOf(node, opt = {}) {
  const parts = [];
  (function rec(n) {
    if (n.text != null) { parts.push(n.text); return; }
    if (SKIP_TEXT.has(n.tag) || isHiddenEl(n)) return;
    if (opt.skip && opt.skip(n)) return;
    const blk = BLOCK.has(n.tag);
    const sep = blk ? (opt.sep || " ") : "";
    if (blk) parts.push(sep);
    for (const c of n.children) rec(c);
    if (blk) parts.push(sep);
  })(node);
  if (opt.sep === "\n") return parts.join("").replace(/[ \t\r\u00a0]+/g, " ").replace(/ *\n[\n ]*/g, "\n").trim();
  return parts.join("").replace(/[\s\u00a0]+/g, " ").trim();
}
/* visible text nodes with their nearest lang */
function textNodes(root) {
  const out = [];
  (function rec(n, lang, code) {
    if (n.text != null) { if (n.text.trim()) out.push({ text: n.text, lang, code, parent: n.parent }); return; }
    if (SKIP_TEXT.has(n.tag) || isHiddenEl(n)) return;
    const l = n.attrs && n.attrs.lang ? n.attrs.lang.toLowerCase() : lang;
    const c = code || ["code", "kbd", "pre", "samp"].includes(n.tag);
    for (const ch of n.children) rec(ch, l, c);
  })(root, "", false);
  return out;
}
const wordCount = s => (s.match(/[\p{L}\p{N}]+/gu) || []).length;
/* The lesson pages' intended corrections of the data, read from the generator that makes them
   (tools/build_lesson_pages.js exports DATA_FIX, TEXT_FIX and NAME_FIX). A page that differs from
   js/data only by one of these rows is not stale: the comparisons below read the data through
   them, and «source-fix-pending» lists each row for the user to make at the source. Requiring
   the file runs nothing (its main() sits behind require.main). */
let GEN_FIX = null, GEN_FIX_ERR = null;
try {
  const g = require(path.join(ROOT, "tools", "build_lesson_pages.js"));
  if (!Array.isArray(g.DATA_FIX) || !Array.isArray(g.TEXT_FIX) || !g.NAME_FIX) throw new Error("does not export DATA_FIX, TEXT_FIX and NAME_FIX");
  GEN_FIX = { DATA_FIX: g.DATA_FIX, TEXT_FIX: g.TEXT_FIX, NAME_FIX: g.NAME_FIX, undot: typeof g.undot === "function" ? g.undot : null };
} catch (e) { GEN_FIX_ERR = String(e.message || e).split(/\r?\n/)[0]; }
/* where each rule lives: «/qudrat/<slug>.html#<id>» → the lesson and the rule's number, from the
   generator's own slugs and anchors (buildModel() reads the data and writes nothing). Only the
   address comes from the generator; the formula and the example a page or a table row shows are
   compared with js/data as this file reads it. `ex` is the generator's own worked example (EX) for
   a rule the data gives none, which the page prints instead. */
let RULE_AT = null, RULE_AT_ERR = null;
try {
  const g = require(path.join(ROOT, "tools", "build_lesson_pages.js"));
  if (typeof g.buildModel !== "function") throw new Error("does not export buildModel()");
  const md = g.buildModel(); RULE_AT = new Map();
  for (const l of md.all || []) for (const r of l.rules || []) if (r.id) RULE_AT.set(l.href + "#" + r.id, { lesson: l.tk, n: r.n, name: r.orig || r.name, shown: r.name, ex: r.ex && r.ex.ex || null, href: l.href, id: r.id });
} catch (e) { RULE_AT_ERR = String(e.message || e).split(/\r?\n/)[0]; }
/* word-for-word spellings the pages use for the data's (TEXT_FIX): the same word either way, on
   both sides of every comparison; the two known ones stay if the generator cannot be read */
const TEXT_EQ = (GEN_FIX ? GEN_FIX.TEXT_FIX : [["فيثاغورث", "فيثاغورس"], ["الالحاق", "اللحاق"]]).filter(x => Array.isArray(x) && x[0] && x[1]);
/* the data's text as the lesson pages print it (the generator's undot(): TEXT_FIX, a comparison's
   verdict letter «← (د)» written as its words, «·» as «،»…); the raw text when it cannot be read */
const pageView = s => { if (!GEN_FIX || !GEN_FIX.undot || s == null) return s; try { return GEN_FIX.undot(s); } catch (e) { return s; } };
const reEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/* the letters normalised as norm() leaves them (hamza seats, alef maqsura, taa marbuta) */
const letterNorm = s => String(s).replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
const TEXT_EQ_MAP = new Map(TEXT_EQ.map(([a, b]) => [letterNorm(a), letterNorm(b)]));
const TEXT_EQ_RE = TEXT_EQ_MAP.size ? new RegExp([...TEXT_EQ_MAP.keys()].map(reEsc).join("|"), "g") : /(?!)/g;
/* compare text the way a reader would: no tashkeel, no tatweel, one kind of space */
const VULGAR = { "½": "١/٢", "⅓": "١/٣", "⅔": "٢/٣", "¼": "١/٤", "¾": "٣/٤", "⅕": "١/٥", "⅙": "١/٦", "⅛": "١/٨" };
/* tags only («<b>»), never a comparison sign: «طرح الضلعين < أي ضلع < مجموعهما» is text */
const SUPS = { "⁰": "٠", "¹": "١", "²": "٢", "³": "٣", "⁴": "٤", "⁵": "٥", "⁶": "٦", "⁷": "٧", "⁸": "٨", "⁹": "٩", "⁺": "+", "⁻": "−", "ⁿ": "ن" };
/* an exponent, however it is written, reads as its text: «سم²» (JSON-LD), «أ^(م+ن)» and «٤⁵»
   (js/data) and «سم<sup>٢</sup>», «أ<sup>م+ن</sup>» (a page, whose text is «سم٢», «أم+ن»)
   compare equal. The page's own innerText has no exponent marks, so neither side keeps them. */
const SUBS = { "₀": "٠", "₁": "١", "₂": "٢", "₃": "٣", "₄": "٤", "₅": "٥", "₆": "٦", "₇": "٧", "₈": "٨", "₉": "٩" };
const unExp = s => String(s).replace(/[₀-₉]/g, c => SUBS[c]).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿ]/g, c => SUPS[c]).replace(/\^\s*\(([^()]*)\)/g, "$1").replace(/\^/g, "");
const norm = s => unExp(s).replace(/[½⅓⅔¼¾⅕⅙⅛]/g, c => " " + VULGAR[c] + " ").replace(/<\/?[a-zA-Z][^<>]*>/g, " ").replace(/[\u064B-\u0652\u0670\u0640\u200c-\u200f\u00ad]/g, "").replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[\s\u00a0]+/g, " ").trim()
  /* a stacked fraction reads \u00ab\u0661 \u0639\u0644\u0649 \u0662\u00bb to a screen reader (its .fr-sr text) and \u00ab\u0661/\u0662\u00bb in the data */
  .replace(/([0-9\u0660-\u0669)])\s*\u0639\u0644\u064a\s*([0-9\u0660-\u0669(\u221a])/g, "$1/$2")
  /* a letter denominator or a letter over a letter, each a one-letter word (\u00ab\u0661 \u0639\u0644\u0649 \u0633\u00bb, \u00ab\u0623 \u0639\u0644\u0649 \u0628\u00bb,
     fractions-07): never two words (\u00ab\u0627\u0639\u062a\u0645\u062f \u0639\u0644\u0649 \u0627\u0644\u0639\u062f\u062f\u00bb) */
  .replace(/((?:^|[^\u0621-\u064a])(?:[0-9\u0660-\u0669)]|[\u0621-\u064a]))\s+\u0639\u0644\u064a\s+([\u0621-\u064a])(?![\u0621-\u064a])/g, (m, a, b) => /[0-9\u0660-\u0669)]$/.test(a) || /(?:^|[^\u0621-\u064a])[\u0621-\u064a]$/.test(a) ? a + "/" + b : m)
  /* the pages spell «فيثاغورس» and «اللحاق» where the curriculum has «فيثاغورث» and «الالحاق»
     (TEXT_FIX in tools/build_lesson_pages.js, normalised the way this text is): one word either way */
  .replace(TEXT_EQ_RE, m => TEXT_EQ_MAP.get(m))
  /* … and «١ على س»: a number over a single letter */
  .replace(/([0-9٠-٩)])\s*علي\s+(?=\p{L}(?:$|[\s)×÷=+−\-<>]))/gu, "$1/")
  /* … and «أ على ب», «أ×ج على ب×د» for letters (a single letter on either side, as a formula has it) */
  .replace(/(^|[\s(×÷=+−\-])(\p{L})\s+\u0639\u0644\u064a\s+(?=\p{L}(?:$|[\s)×÷=+−\-])|[0-9\u0660-\u0669(\u221a])/gu, "$1$2/")
  /* the bar of a stacked fraction is its brackets: «(أ×ج)/(ب×د)» reads «أ×ج/ب×د» */
  .replace(/\(([^()]*)\)\s*\//g, "$1/").replace(/\/\s*\(([^()]*)\)/g, "/$1")
  /* the curriculum says \u00ab\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u063a\u064a\u0631 \u0643\u0627\u0641\u064a\u0629\u00bb, the exam's choice (CMP_CHOICES) \u00ab\u0627\u0644\u0645\u0639\u0637\u064a\u0627\u062a \u063a\u064a\u0631 \u0643\u0627\u0641\u064a\u0629\u00bb */
  .replace(/\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u063a\u064a\u0631 \u0643\u0627\u0641\u064a\u0647/g, "\u0627\u0644\u0645\u0639\u0637\u064a\u0627\u062a \u063a\u064a\u0631 \u0643\u0627\u0641\u064a\u0647");
/* letters and digits only: survives stacked fractions, spacing and sign glyph changes */
const skel = s => fromAr(norm(s)).replace(/[^\p{L}\p{N}]+/gu, "");

/* ---------- app data ---------- */
function loadData() {
  const dir = path.join(ROOT, "js", "data");
  if (!fs.existsSync(dir)) return null;
  const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx);
  for (const f of ["skills", "numbers", "ratios", "geometry", "teach", "learn"]) {
    const p = path.join(dir, f + ".js");
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: p });
  }
  const W = ctx.window, B = W.QBANK || {};
  const units = Object.keys(B).map(k => ({ key: k, title: B[k].title, lessons: B[k].lessons }));
  const rules = [], lessons = [];
  let questions = 0, comparison = 0, sciOnly = 0, litOnly = 0;
  const unitQ = [], unitRules = [], unitCmp = [], diff = {}; let lessonsWithComparison = 0; const qById = {};
  for (const u of units) {
    let uq = 0, ur = 0; unitCmp.push(0);
    for (const l of u.lessons) {
      lessons.push({ key: u.key + "." + l.key, title: l.title, unit: u.title, rules: (l.rules || []).length, questions: (l.questions || []).length, comparison: (l.questions || []).filter(q => q.format === "comparison").length });
      for (const r of l.rules || []) { ur++; rules.push({ lesson: u.key + "." + l.key, n: r.n, name: r.name, formula: r.formula || "", when: r.when || "" }); }
      let lc = 0;
      for (const q of l.questions || []) { qById[q.id] = { ...q, lesson: u.key + "." + l.key }; questions++; uq++; diff[q.difficulty] = (diff[q.difficulty] || 0) + 1; if (q.format === "comparison") { comparison++; lc++; unitCmp[unitCmp.length - 1]++; } if (q.track === "sci") sciOnly++; if (q.track === "lit") litOnly++; }
      if (lc) lessonsWithComparison++;
    }
    unitQ.push(uq); unitRules.push(ur);
  }
  const plain = {}, example = {}; let teachRules = 0;
  for (const [k, t] of Object.entries(W.QTEACH || {})) for (const ch of t.chunks || []) for (const st of ch.steps || []) if (st.type === "rule") { teachRules++; plain[k + ":" + st.n] = st.plain || ""; if (st.example && !example[k + ":" + st.n]) example[k + ":" + st.n] = st.example; }
  let shortLessons = 0; const perNode = [];
  for (const v of Object.values(W.QLEARN || {})) { const c = (v.lessons || []).length; shortLessons += c; perNode.push(c); }
  /* the mock exam's shape, read (never run) out of js/app.js: what qudrat-mock-test.html describes */
  let mock = null, cmpChoices = null;
  try {
    const app = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");
    const cc = /const\s+CMP_CHOICES\s*=\s*(\[[^\]]*\])/.exec(app);
    if (cc) try { cmpChoices = JSON.parse(cc[1]); } catch (e) { }
    const plan = /const\s+MOCK_SECTION_PLAN\s*=\s*\{\s*sci:\s*\[([\d,\s]+)\]\s*,\s*lit:\s*\[([\d,\s]+)\]/.exec(app);
    const secs = /const\s+MOCK_SECS\s*=\s*([\d\s*]+);/.exec(app);
    const n = /const\s+MOCK_SECTIONS\s*=\s*(\d+)\s*;/.exec(app);
    if (plan && secs && n) {
      const sum = t => t.split(",").map(Number).reduce((a, b) => a + b, 0);
      mock = { sci: sum(plan[1]), lit: sum(plan[2]), minutes: secs[1].split("*").map(Number).reduce((a, b) => a * b, 1) / 60, sections: Number(n[1]) };
    }
  } catch (e) { }
  /* the pages' view of the data (GEN_FIX): each rule's shown name (pName) and its corrected
     formula (pFormula) and plain wording (pPlain); the raw values stay for every count */
  const pPlain = { ...plain }, pExample = { ...example }, fixes = [];
  for (const r of rules) { r.pName = r.name; r.pFormula = r.formula; }
  const finish = () => { for (const r of rules) r.pFormula = pageView(r.pFormula); for (const k of Object.keys(pPlain)) pPlain[k] = pageView(pPlain[k]); for (const k of Object.keys(pExample)) pExample[k] = pageView(pExample[k]); };
  if (GEN_FIX) {
    const rawOf = tk => { const [uk, lk] = tk.split("."); const l = ((B[uk] || {}).lessons || []).find(x => x.key === lk); return JSON.stringify([l || null, (W.QTEACH || {})[tk] || null]); };
    for (const f of GEN_FIX.DATA_FIX) {
      const row = { kind: "DATA_FIX", tk: f.tk, rule: f.rule || null, field: f.field, from: f.from, to: f.to, compared: ["formula", "plain", "example"].includes(f.field), inData: rawOf(f.tk).includes(JSON.stringify(String(f.from)).slice(1, -1)) };
      if (f.rule) for (const r of rules.filter(x => x.lesson === f.tk && x.name === f.rule)) {
        const k = r.lesson + ":" + r.n;
        if (f.field === "formula" && r.pFormula.includes(f.from)) r.pFormula = r.pFormula.replace(f.from, f.to);
        if (f.field === "plain" && (pPlain[k] || "").includes(f.from)) pPlain[k] = pPlain[k].replace(f.from, f.to);
        if (f.field === "example" && (pExample[k] || "").includes(f.from)) pExample[k] = pExample[k].replace(f.from, f.to);
      }
      fixes.push(row);
    }
    const raw = JSON.stringify([B, W.QTEACH || {}, W.QLEARN || {}]);
    for (const [a, b] of GEN_FIX.TEXT_FIX) fixes.push({ kind: "TEXT_FIX", from: a, to: b, compared: true, inData: raw.split(a).length - 1 });
    for (const [k, v] of Object.entries(GEN_FIX.NAME_FIX)) {
      const i = k.indexOf("|"), tk = k.slice(0, i), name = k.slice(i + 1);
      const r = rules.find(x => x.lesson === tk && x.name === name); if (r) r.pName = v;
      fixes.push({ kind: "NAME_FIX", tk, rule: name, to: v, compared: true, inData: !!r });
    }
  }
  finish();
  return {
    pPlain, fixes, example, pExample,
    units, lessons, rules, plain, qById, cmpChoices, questions, comparison, sciOnly, litOnly, unitQ, unitRules, unitCmp, diff, lessonsWithComparison, teachRules, shortLessons, perNode, mock,
    unitLessons: units.map(u => u.lessons.length),
  };
}

/* ---------- robots.txt ---------- */
function parseRobots(txt) {
  const groups = []; let g = null, lastWasAgent = false; const sitemaps = [];
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim(); if (!line) continue;
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "user-agent") { if (!g || !lastWasAgent) { g = { agents: [], rules: [] }; groups.push(g); } g.agents.push(v.toLowerCase()); lastWasAgent = true; continue; }
    lastWasAgent = false;
    if (k === "sitemap") { sitemaps.push(v); continue; }
    if (!g) continue;
    if (k === "allow" || k === "disallow") g.rules.push({ allow: k === "allow", path: v });
  }
  return { groups, sitemaps };
}
function robotsAllowed(rb, agent, urlPath) {
  const a = agent.toLowerCase();
  let gs = rb.groups.filter(g => g.agents.includes(a));
  if (!gs.length) gs = rb.groups.filter(g => g.agents.includes("*"));
  const rules = gs.flatMap(g => g.rules);
  let best = null;
  for (const r of rules) {
    if (r.path === "") { if (!r.allow) continue; }
    const re = new RegExp("^" + r.path.replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$").replace(/\$$/, "$"));
    if (r.path === "" || re.test(urlPath)) {
      const len = r.path.length;
      if (!best || len > best.len || (len === best.len && r.allow)) best = { len, allow: r.allow, rule: (r.allow ? "Allow: " : "Disallow: ") + r.path };
    }
  }
  return best ? best : { allow: true, rule: "(no rule)" };
}

/* ---------- JSON-LD ---------- */
const typesOf = n => [].concat(n["@type"] || []);
function ldNodes(data) {
  const out = [];
  (function rec(v) {
    if (Array.isArray(v)) return v.forEach(rec);
    if (v && typeof v === "object") { if (v["@type"]) out.push(v); for (const k of Object.keys(v)) if (k !== "@context") rec(v[k]); }
  })(data);
  return out;
}
/* every string a JSON-LD block says, for the text checks (counts, claims, «·»). Only the keywords
   that name things are skipped (@context, @type, @id, @language…): @graph, @list, @set and a
   typed literal's @value hold the content, and every page here keeps its nodes in one @graph. */
const LD_SKIP = new Set(["@context", "@type", "@id", "@language", "@vocab", "@base", "@direction", "@reverse", "@index"]);
function ldStrs(v, out) {
  if (typeof v === "string") { if (!/^https?:\/\//.test(v)) out.push(v); }
  else if (Array.isArray(v)) v.forEach(x => ldStrs(x, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (!LD_SKIP.has(k)) ldStrs(x, out);
  return out;
}
const ldText = v => ldStrs(v, []).join("\n");
const has = (n, k) => n[k] != null && n[k] !== "" && !(Array.isArray(n[k]) && !n[k].length);
const asText = v => typeof v === "string" ? v : v && typeof v === "object" ? (v.text || v.name || "") : "";
const ISO = /^\d{4}-\d{2}-\d{2}([T ][0-9:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;
/* null for a real ISO 8601 / W3C date, else why not. The shape alone lets «2026-13-45» through,
   and that is not a future date but no date at all: Google's parser drops it. */
function badDate(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-](\d{2}):?(\d{2}))?)?$/.exec(String(v == null ? "" : v).trim());
  if (!m) return "not an ISO 8601 date (YYYY-MM-DD, optionally Thh:mm[:ss][Z|±hh:mm])";
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (mo < 1 || mo > 12 || t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return `not a valid ISO 8601 date: there is no ${m[1]}-${m[2]}-${m[3]}`;
  if (m[4] != null && (+m[4] > 23 || +m[5] > 59 || (m[6] != null && +m[6] > 60))) return "not a valid ISO 8601 date: the time is out of range";
  if (m[8] != null && (+m[8] > 14 || +m[9] > 59)) return "not a valid ISO 8601 date: the time-zone offset is out of range";
  if (y < 1990) return "not a plausible date for this site (before 1990)";
  return null;
}
function siteUrlsIn(v, out = []) {
  if (Array.isArray(v)) v.forEach(x => siteUrlsIn(x, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) {
    if (k === "sameAs") continue;
    if (typeof x === "string" && /^https?:\/\//.test(x) && ["url", "@id", "item", "logo", "image", "contentUrl", "downloadUrl", "mainEntityOfPage", "installUrl", "thumbnailUrl", "isPartOf", "target"].includes(k)) out.push(x);
    else siteUrlsIn(x, out);
  }
  return out;
}

/* ---------- the checks ---------- */
const DATA = loadData();
let VOCAB = null; try { VOCAB = JSON.parse(fs.readFileSync(path.join(SEO, "schema-vocab.json"), "utf8")); } catch (e) { }
let FACTS = null; try { FACTS = JSON.parse(fs.readFileSync(path.join(SEO, "facts.json"), "utf8")).etec; } catch (e) { }
const FACT_PCTS = new Set([100]);
/* the exam's own question counts (guide p.7, read by eye off the rendered page) and the quant share of them */
const EXAM_Q = new Set();
if (FACTS && FACTS.guidePdf && FACTS.guidePdf.exam) { const e = FACTS.guidePdf.exam; EXAM_Q.add(e.questions); EXAM_Q.add(e.perSection); for (const tr of ["sci", "lit"]) { const s = Object.values(FACTS.quant[tr]).reduce((a, v) => a + (v || 0), 0); EXAM_Q.add(Math.round(e.questions * s / 100)); EXAM_Q.add(e.questions - Math.round(e.questions * s / 100)); } }
if (FACTS) for (const part of ["quant", "verbal"]) for (const tr of ["sci", "lit"]) {
  let sum = 0; for (const v of Object.values(FACTS[part][tr])) if (v != null) { FACT_PCTS.add(v); sum += v; }
  FACT_PCTS.add(sum);
}

const AR_UNITS = { "واحد": 1, "الحادي": 1, "إحدى": 1, "اثنين": 2, "اثنان": 2, "اثنتين": 2, "ثلاثة": 3, "ثلاث": 3, "أربعة": 4, "أربع": 4, "خمسة": 5, "خمس": 5, "ستة": 6, "ست": 6, "سبعة": 7, "سبع": 7, "ثمانية": 8, "ثماني": 8, "تسعة": 9, "تسع": 9 };
const AR_TENS = { "عشرين": 20, "عشرون": 20, "ثلاثين": 30, "ثلاثون": 30, "أربعين": 40, "أربعون": 40, "خمسين": 50, "خمسون": 50, "ستين": 60, "ستون": 60, "سبعين": 70, "سبعون": 70, "ثمانين": 80, "ثمانون": 80, "تسعين": 90, "تسعون": 90 };
const WORDNUM = new RegExp("(?<![\\p{L}])(?:(?:ال)?(" + Object.keys(AR_UNITS).join("|") + ")\\s+و(?:ال)?)?(?:ال)?(" + Object.keys(AR_TENS).join("|") + ")(?![\\p{L}])", "gu");
const NOUN = { lesson: /دروس|درس|الدروس/, question: /أسئلة|سؤال|الأسئلة/, rule: /قوانين|قانون|قاعدة|قواعد/ };

function allowedCounts() {
  if (!DATA) return null;
  return {
    lesson: new Set([DATA.lessons.length, ...DATA.unitLessons, DATA.lessonsWithComparison]),
    short: new Set([DATA.shortLessons, ...DATA.perNode]),
    question: new Set([DATA.questions, DATA.comparison, DATA.questions - DATA.comparison, ...DATA.unitQ]),
    rule: new Set([DATA.rules.length, DATA.teachRules, ...DATA.unitRules]),
  };
}
const ALLOWED = allowedCounts();
const MAXC = DATA ? { lesson: DATA.lessons.length, short: DATA.shortLessons, question: DATA.questions, rule: DATA.rules.length } : {};
const HAVE = () => `js/data has ${DATA.lessons.length} lessons (${DATA.unitLessons.join("/")}), ${DATA.shortLessons} short lessons, ${DATA.questions} questions (${DATA.comparison} comparison), ${DATA.rules.length} rules (${DATA.unitRules.join("/")})`;
/* a count on a page: what the data says it can be. More than the data has is an error (the
   stale «٣٠ درساً» kind); a smaller number not in the data is usually a subset («٥٢ سؤالاً
   محلولة» on this page), so it is a note to verify, not a failure — unless the sentence states it as
   the app's whole bank: «في قدراتي ٢٠٠ سؤال أصلي و٢٤ درساً», «يضم البنك …», «جميع …», «كل الـ…»,
   with no limiting word after the noun («محلولاً»، «منها»، «في هذه الصفحة»، «مقارنة»). Then a
   number the data does not have is an error. `near` = { before, after }: the clause before the
   number (from the last «.», «؟», «!», «؛», «:» or line break) and the words after its noun. */
const TOTAL_CUE = /(?:^|[^\p{L}])(?:في\s+)?(?:قدراتي|التطبيق|اللعبة|يضم|تضم|يضمّ|تضمّ|يحوي|تحوي|يحتوي|تحتوي|جميع|كل\s+ال|بنك|مجموع|إجمالي|بالكامل|كاملاً|Qudrati|the\s+app|in\s+all|in\s+total|bank|has|holds|contains)(?![\p{L}])/iu;
const LIMIT_AFTER = /^[ \t]*(?:أخرى|آخر|أخر|إضافي[ةه]?|محلول[ةه]?|محلولاً|منها|فقط|مقارنة|للمقارنة|قصير[ةه]?|في\s+(?:هذه|هذا|الصفحة|كل|درس|الدرس|وحد[ةه]|الوحد[ةه]|القسم)|من\s+(?:أصل|بنك|هذه|ال)|على\s+(?:هذه|الصفحة)|of\s+which|more|other|on\s+this|in\s+this|here|each|per|a\s+(?:section|lesson|day)|with\s+(?:a\s+)?worked|shown)(?![\p{L}])/iu;
function judgeCount(where, kind, n, ctx, label, wide, near) {
  if (n >= 1400 && n <= 2100) return; // a year (Gregorian or Hijri), not a count
  if (kind === "question" && /(الاختبار|اختبار|الدليل|الهيئة|قياس|أقسام|قسم|العلمي|النظري|الكمي|\bGAT\b|\bexam\b|\bETEC\b|\bsections?\b|General\s+Aptitude)/i.test(wide || ctx) && EXAM_Q.has(n)) return;
  if (ALLOWED[kind].has(n)) return;
  const name = { lesson: "lessons", short: "short lessons", question: "questions", rule: "rules" }[kind];
  const clause = near ? near.before.split(/[.؟?!؛:\n]/).pop() : "";
  /* «The GAT has … 130 questions», «في اختبار القدرات ١٠٠ سؤال»: the exam's count, held to
     facts.json by checkExamShape, not the app's bank */
  const aboutExam = kind === "question" && EXAM_CUE.test(clause) && !/(?:قدراتي|التطبيق|اللعبة|\bQudrati\b|\bthe\s+app\b)/iu.test(clause);
  const total = near && !aboutExam && TOTAL_CUE.test(clause) && !LIMIT_AFTER.test(near.after || "");
  if (n > MAXC[kind]) add("error", "count-" + kind, where, `says ${label || n + " " + name}, more than the data has; ${HAVE()}`, ctx);
  else if (total) add("error", "count-" + kind + "-total", where, `says ${label || n + " " + name} as the app's whole bank («${clause.trim().slice(-40)}» before it, no limiting word after), but js/data has ${MAXC[kind]}; ${HAVE()}`, ctx);
  else add("info", "count-" + kind + "-subset", where, `says ${label || n + " " + name} — not a total in js/data; check it is the subset it claims`, ctx);
}

/* Counts tied to one unit or one lesson: «الهندسة (٩ دروس، ١٥٧ قانوناً)», «الوحدة الرابعة: تسعة
   دروس», «٦ في «مهارات وقوانين هامة في القدرات»» (the noun carried over from «٣٥ سؤال مقارنة:»),
   «٢٥ قانوناً في درس «الدائرة»», «الدرس ١ — ١٣ قانوناً، ١٠ أسئلة جمع وطرح …». Each is held to
   that unit's or lesson's own count in js/data, not to the set of totals: «الهندسة (١٠ دروس)» on
   the old methods page was only a note, and it was the stale fact. A name inside a longer name
   («قوانين هامة في القدرات» in «مهارات وقوانين هامة في القدرات») is the longer one; a count and its
   noun sit on one line; «الدرس ٤» is a label, not a count; «٣ قوانين أخرى» / «بقية …» is a part,
   left to the generic check. Returns the text offsets it judged, so the generic count check does
   not report them again as unexplained subsets. */
const SCOPE_OLD_NAMES = { skills: ["مهارات وقوانين القدرات", "المهارات والقوانين"], numbers: ["أساسيات الأعداد"] };
const ORDINALS = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة"];
const fuzzyAr = s => reEsc(s).replace(/[اأإآ]/g, "[اأإآ]").replace(/[ةه]/g, "[ةه]").replace(/[يى]/g, "[يى]").replace(/\s+/g, "\\s+");
const SMALL_WORDS = { ...AR_UNITS, "عشرة": 10, "عشر": 10 };
let SCOPES = null;
function scopes() {
  if (SCOPES || !DATA) return SCOPES || [];
  const out = [];
  DATA.units.forEach((u, i) => {
    const names = new Set([u.title, u.title.replace(/\s+في\s+القدرات$/, ""), ...(SCOPE_OLD_NAMES[u.key] || [])]);
    const counts = { lesson: u.lessons.length, rule: DATA.unitRules[i], question: DATA.unitQ[i], comparison: DATA.unitCmp[i] };
    for (const nm of names) if (nm.length >= 5) out.push({ kind: "unit", label: `the unit «${u.title}»`, re: fuzzyAr(nm), counts });
    out.push({ kind: "unit", label: `the unit «${u.title}»`, re: `(?:ال)?وحدة[ \\t]+(?:${ORDINALS[i]}|[${i + 1}${AR[i + 1]}])(?![0-9٠-٩])(?:\\s*[:—–-]\\s*${fuzzyAr(u.title)})?`, counts });
  });
  for (const l of DATA.lessons) out.push({ kind: "lesson", label: `the lesson «${l.title}» (${l.key})`, re: fuzzyAr(l.title), counts: { rule: l.rules, question: l.questions, comparison: l.comparison } });
  return (SCOPES = out.map(s => ({ ...s, rx: new RegExp("(?<![\\p{L}])(?:و|ب|ل)?" + s.re + "(?![\\p{L}])", "gu") })));
}
const COUNT_NOUN = "(دروس|درساً|درسا|درس|أسئلة|سؤالاً|سؤالا|سؤال|قوانين|قانوناً|قانونا|قانون|قاعدة|قواعد)";
const COUNT_MOD = "([ \\t]*(?:قصير[ةه]?|قصار|مقارنة|للمقارنة))?";
const NUM_TOKEN = "([0-9٠-٩]+|" + Object.keys(SMALL_WORDS).sort((a, b) => b.length - a.length).join("|") + ")";
const numOf = s => /^[0-9٠-٩]+$/.test(s) ? Number(fromAr(s)) : SMALL_WORDS[s];
const kindOf = (noun, mod) => NOUN.lesson.test(noun) ? (/قصير|قصار/.test(mod || "") ? "short" : "lesson") : NOUN.question.test(noun) ? (/مقارنة/.test(mod || "") ? "comparison" : "question") : "rule";
/* a part, not the whole: «٣ قوانين أخرى», «بقية قوانين …», «١٣ قانوناً آخر», «٥ أسئلة محلولة» */
const PART_AFTER = /^[ \t]*(?:أخرى|آخر|أخر|إضافي[ةه]?|محلول[ةه]?|محلولاً|منها|فقط)(?![\p{L}])/u;
const PART_BEFORE = /(?:بقي[ةه]|باقي|من\s+أصل|منها|أول|آخر)[\s\S]{0,40}$/u;
/* «الدرس ٤», «الوحدة ٢», «القسم ١» are labels; a count is not preceded by one */
const LABEL_BEFORE = /(?:^|[^\p{L}])(?:ال)?(?:درس|وحد[ةه]|قسم|صفح[ةه]|رقم|سؤال)[ \t]*$/u;
/* «٩ دروس، ١٥٧ قانوناً و٨٩ سؤالاً» from `at`: the counts in a row, each with its offset */
function countChain(t, at, max = 3) {
  const out = []; let pos = at;
  /* the first count may open the next line when the name ends its own (a heading «الوحدة ٤:
     الهندسة», then «٩ دروس، ١٥٧ قانوناً»); the rest follow on that line */
  const re = new RegExp("^[ \\t:()\\[\\]\\-—–،,»«]*(?:و)?[ \\t]*" + NUM_TOKEN + "[ \\t]*" + COUNT_NOUN + COUNT_MOD + "(?![\\p{L}])", "u");
  const re0 = new RegExp("^[ \\t:()\\[\\]\\-—–،,»«]*\\n[ \\t]*" + NUM_TOKEN + "[ \\t]*" + COUNT_NOUN + COUNT_MOD + "(?![\\p{L}])", "u");
  while (out.length < max) {
    const m = re.exec(t.slice(pos)) || (out.length ? null : re0.exec(t.slice(pos))); if (!m) break;
    const off = pos + m[0].length - m[0].replace(/^[ \t:()[\]\-—–،,»«]*\n?[ \t]*(?:و)?[ \t]*/, "").length;
    const end = pos + m[0].length;
    out.push({ n: numOf(m[1]), kind: kindOf(m[2], m[3]), at: off, text: m[0].trim(), part: PART_AFTER.test(t.slice(end, end + 20)) });
    pos = end;
  }
  return out;
}
function checkScopedCounts(where, t) {
  const handled = new Set(); if (!DATA) return handled;
  const seen = new Set();
  const judge = (sc, c, ctx) => {
    if (c.part || c.n == null) return;
    handled.add(c.at);
    if (seen.has(c.at)) return; seen.add(c.at);
    const want = sc.counts[c.kind]; if (want == null || c.kind === "short") return;
    if (c.n === want) return;
    const what = { lesson: "lessons", rule: "rules", question: "questions", comparison: "comparison questions" }[c.kind];
    /* a lesson or rule count beside a unit or a lesson is its total; fewer questions may be the
       solved sample a page shows, so only more than the data has is certain */
    const lvl = c.kind === "lesson" || c.kind === "rule" || c.n > want ? "error" : "warn";
    add(lvl, "count-" + sc.kind, where, `says «${c.text}» for ${sc.label}; js/data has ${want} ${what} there`, ctx.replace(/\s+/g, " ").trim());
  };
  /* every name found, the longest winning where two overlap */
  const hits = [];
  for (const sc of scopes()) { sc.rx.lastIndex = 0; let m; while ((m = sc.rx.exec(t))) hits.push({ sc, start: m.index, end: m.index + m[0].length }); }
  hits.sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start);
  const kept = [];
  for (const h of hits) if (!kept.some(k => h.start < k.end && k.start < h.end)) kept.push(h);
  for (const { sc, start, end } of kept) {
    const ctx = t.slice(Math.max(0, start - 30), end + 60);
    /* the name, then its counts: «الهندسة (٩ دروس، ١٥٧ قانوناً)» */
    /* …unless the name closes a list of names («…، النسب والنسبة المئوية، الهندسة — ٣٠ درساً»):
       the count after a list is the list's total, judged by the generic check */
    const listed = kept.some(k => k.sc.kind === sc.kind && k.end <= start && start - k.end <= 4 && /^[\s،,]*و?$/.test(t.slice(k.end, start)));
    if (!listed && !PART_BEFORE.test(t.slice(Math.max(0, start - 50), start))) for (const c of countChain(t, end)) judge(sc, c, ctx);
    /* the counts, then the name: «٢٥ قانوناً في درس «الدائرة»», «١٣ قانوناً، ١٠ أسئلة جمع …»;
       looked for back from the name, on its own line */
    const lineStart = t.lastIndexOf("\n", start - 1) + 1;
    const before = t.slice(Math.max(lineStart, start - 160), start), base = start - before.length;
    const tail = /(?:(?:في|من)[ \t]*(?:(?:ال)?درس|(?:ال)?وحد[ةه])?[ \t]*)?«?[ \t]*$/u.exec(before);
    const viaFi = /(في|من)/.test(tail[0]);
    let lead = before.slice(0, before.length - tail[0].length);
    const backRe = new RegExp(NUM_TOKEN + "(?:[ \\t]*" + COUNT_NOUN + COUNT_MOD + ")?[ \\t]*[،,]?[ \\t]*(?:و[ \\t]*)?$", "u");
    const found = [];
    for (let k = 0; k < 3; k++) {
      const back = backRe.exec(lead); if (!back) break;
      /* a bare number only right before «في …», as an item of a list («: ٦ في …، و١١ في …»), never
         inside arithmetic («١٢٦ × ٧٥ من درس …») */
      if (!back[2] && (k > 0 || !viaFi || !/(?:^|[:،,][ \t]*(?:و[ \t]*)?)$/u.test(lead.slice(0, back.index)))) break;
      if (LABEL_BEFORE.test(lead.slice(0, back.index))) break;
      found.push({ back, at: base + back.index, part: PART_BEFORE.test(t.slice(Math.max(0, base + back.index - 50), base + back.index)) });
      lead = lead.slice(0, back.index);
    }
    for (const { back, at, part } of found) {
      let kind = back[2] ? kindOf(back[2], back[3]) : null;
      /* «٦ في «…»» has no noun: it is the noun of the count that opened the list («٣٥ سؤال مقارنة: ٦ في …، و١١ في …») */
      if (!kind) { const prior = [...t.slice(Math.max(0, at - 400), at).matchAll(new RegExp(NUM_TOKEN + "[ \\t]*" + COUNT_NOUN + COUNT_MOD, "gu"))].pop(); if (prior) kind = kindOf(prior[2], prior[3]); }
      if (!kind) continue;
      judge(sc, { n: numOf(back[1]), kind, at, part, text: t.slice(at, end).replace(/\s+/g, " ").trim() }, ctx);
    }
  }
  return handled;
}
/* the false «literary track filters questions» claim, in any wording (checkClaims) */
const TRACK_LIT = /(?:^|[^\p{L}])(?:و|ب|ل|ف)?(?:ال)?(?:نظري|أدبي|ادبي)(?:[ةه])?(?![\p{L}])|\bliterary\b|\btheoretical\b/iu;
const TRACK_FILTER_ALL = /(?:تُ?ستبعد|يُ?ستبعد|استبعاد|تُ?حذف|يُ?حذف|يُ?خفي|تُ?خفي|إخفاء|تختفي|يختفي|لا\s+(?:تظهر|يظهر|تجد|ترى|تأتي|يأتي)|يُ?سقط|تُ?سقط|تُ?ستثنى|يُ?ستثنى|استثناء|يُ?قلّ?ل|تُ?قلّ?ل|أخفّ?(?![\p{L}])|أقلّ?(?![\p{L}])|يُ?فلتر|تُ?فلتر|فلترة|تصفية|يُ?صفّ?ي|تُ?صفّ?ي|\bhid(?:e|es|den|ing)\b|\bfilter|\bexclud|\bfewer\b|\blighter\b|\bskip)/iu;
const TRACK_FILTER = /(?:تُ?ستبعد|يُ?ستبعد|استبعاد|تُ?حذف|يُ?حذف|يُ?خفي|تُ?خفي|إخفاء|تختفي|يختفي|لا\s+(?:تظهر|يظهر|تجد|ترى|تأتي|يأتي)|يُ?سقط|تُ?سقط|تُ?ستثنى|يُ?ستثنى|استثناء|يُ?فلتر|تُ?فلتر|فلترة|تصفية|يُ?صفّ?ي|تُ?صفّ?ي|\bhid(?:e|es|den|ing)\b|\bfilter|\bexclud|\bskip)/iu;
const TRACK_LIGHTER = /(?:يُ?قلّ?ل|تُ?قلّ?ل|يخفّ?(?![\p{L}])|أخفّ?(?![\p{L}])|أقلّ?(?![\p{L}])|\bfewer\b|\blighter\b|\bless\b)/iu;
/* the same claim worded as a choice of questions rather than a removal: «… أسئلة المسار الأدبي
   فقط»، «تتغيّر الأسئلة حسب مسارك»، «only the questions for their track», «tailored». Gated like
   the weak cues (a word about the app or its lessons in the sentence), except the possessive
   «حسب مسارك» / «for their track», which is about the student's own choice in the app */
const TRACK_SELECT = /(?:فقط|(?:حسب|بحسب|وفق|وفقاً\s+ل|تبعاً\s+ل)\s*(?:ال)?مسار|(?:تتغيّ?ر|تتغير|يتغيّ?ر|تختلف|يختلف|تتبدّ?ل|تتبدل)\s+(?:ال)?(?:أسئلة|اسئلة|الأسئلة|الدروس|المحتوى)|(?:ال)?(?:أسئلة|الأسئلة|دروس|الدروس|المحتوى)\s+(?:تتغيّ?ر|تتغير|يتغيّ?ر|تختلف|يختلف|تتبدّ?ل)|مخصّ?ص[ةه]?\s+(?:ل)?(?:ل)?مسار|(?:تناسب|يناسب)\s+(?:ال)?مسار|\bonly\b|\bfor\s+(?:your|their|his|her|each)\s+track\b|\btailored\b|\bdepend(?:s|ing)?\s+on\b|\bmatch(?:es|ing)?\s+(?:your|their)\s+track\b)/iu;
const TRACK_SELECT_OWN = /(?:(?:حسب|بحسب|وفق|وفقاً\s+ل|تبعاً\s+ل)\s*مسار(?:ك|كم|ه|هم|ها)(?![\p{L}])|مخصّ?ص[ةه]?\s+لمسار(?:ك|كم|ه|هم)|\bfor\s+(?:your|their|his|her)\s+track\b|\bmatch(?:es|ing)?\s+(?:your|their)\s+track\b)/iu;
const ABOUT_QS = /(?:أسئلة|الأسئلة|اسئلة|سؤال|حمل|المحتوى|الدروس|\bquestions?\b|\bload\b|\bcontent\b)/iu;
const MOCK_CUE = /(?:المحاكي|التجريبي|تحديد\s+المستوى|اختبار\s+المستوى|\bmock\b|\bplacement\b)/iu;
const ETEC_TEST = /(?:اختبار\s+(?:ال)?تخصص|الاختبار\s+(?:العلمي|النظري)|اختبار\s+القدرات|الجزء\s+الكمي|الهيئة|هيئة|الدليل|\bETEC\b|\bGAT\b|General\s+Aptitude|\bthe\s+(?:real\s+|official\s+)?(?:exam|test)\b|[٪%]|جبر)/iu;
const APP_CUE = /(?:قدراتي|التطبيق|اللعبة|الإعدادات|إعدادات|تختار|اختر|اخترت|اختيار|يعطيك|نعطيك|\bsettings\b|\bthe app\b|\bQudrati\b)/iu;
const APP_LESSON_CUE = /(?:الدروس|دروس|درس|التمارين|تمارين|تدرّ?ب|نتدرّ?ب|\blessons?\b|\bpractice\b)/iu;
/* exam percentages, by domain and track (checkClaims → checkFactSentence / checkFactTable) */
const FACT_TRACK = /(?:^|[^\p{L}])(?:و|ب|ل|ف)?(?:ال)?(?:علمي|نظري|أدبي)(?:[ةه])?(?![\p{L}])|\bscientific\b|\btheoretical\b/iu;
const FACT_PART = /(?:الكمي|اللفظي|كمي|لفظي|اختبار\s+(?:ال)?تخصص|الاختبار\s+(?:العلمي|النظري)|(?:ال)?تخصصات\s+(?:ال)?(?:علمية|نظرية)|المسار\s+(?:العلمي|النظري))/u;
const FACT_DOMAINS = [
  ["verbal", "التناظر اللفظي", "(?:ال)?تناظر\\s+(?:ال)?لفظي"], ["verbal", "إكمال الجمل", "(?:ال)?[إا]كمال\\s+(?:ال)?جمل"], ["verbal", "الخطأ السياقي", "(?:ال)?خط[أا]\\s+(?:ال)?سياقي"], ["verbal", "استيعاب المقروء", "(?:ال)?استيعاب\\s+(?:ال)?مقروء"],
  ["quant", "حساب", "(?:ال)?حساب"], ["quant", "هندسة", "(?:ال)?هندس[ةه]"], ["quant", "جبر", "(?:ال)?جبر"], ["quant", "تفسير البيانات", "تفسير\\s+(?:ال)?بيانات"],
  ["verbal", "total", "(?:ال)?لفظي"], ["quant", "total", "(?:ال)?كمي"],
].map(([part, key, re]) => ({ part, key, re: new RegExp("(?<![\\p{L}])(?:و|ب|ل|لل)?" + re + "(?![\\p{L}])", "u"), reEnd: new RegExp("(?<![\\p{L}])(?:و|ب|ل|لل)?" + re + "(?![\\p{L}])[^0-9٠-٩٪%،,()]{0,12}$", "u") }));
const FACT_DOMAIN = new RegExp(FACT_DOMAINS.filter(d => d.key !== "total").map(d => d.re.source).join("|"), "u");
const trackOf = w => /علم|scientific/i.test(w) ? "sci" : "lit";
const TRACK_AFTER = /^\s*(?:(?:من|في|لل|ل)\s*)?(?:(?:ال)?اختبار\s+)?(?:(?:ال)?تخصص(?:ات)?\s+)?(?:(?:ال)?مسار\s+)?((?:ال)?(?:علمي|نظري|أدبي)[ةه]?)(?![\p{L}])/u;
const PART_AFTER_PCT = /^\s*(?:من\s+(?:ال)?أسئل[ةه]\s+)?(?:(?:ال)?(?:جزء|قسم)\s+)?(?:ال)?(كمي|لفظي)(?:[ةه]|اً|ا)?(?![\p{L}])/u;
const TRACK_BEFORE = /((?:ال)?(?:علمي|نظري|أدبي)[ةه]?)[\s:]{0,3}$/u;
const factVal = (part, track, key) => { const t = FACTS && FACTS[part] && FACTS[part][track]; if (!t) return undefined; if (key === "total") return Object.values(t).reduce((a, v) => a + (v || 0), 0); return key in t ? t[key] : undefined; };
const FACT_NAME = { quant: "الجزء الكمي", verbal: "الجزء اللفظي" }, TRACK_NAME = { sci: "العلمي", lit: "النظري" };
const factWhat = (part, key, track) => (key === "total" ? FACT_NAME[part] : key) + (track ? " في " + TRACK_NAME[track] : "");
const pctNum = s => Number(fromAr(s).replace(/[,٫]/, "."));
function judgeFact(where, v, part, key, track, evidence, how) {
  const src = `facts.json, read ${FACTS.checked} off ${FACTS.gatPage}`;
  if (part && key && track) {
    const want = factVal(part, track, key);
    if (want === undefined) { if (!FACT_PCTS.has(v)) add("error", "fact-percent", where, `exam percentage ${v}% is not in ETEC's table (${src})`, evidence); return; }
    if (want === null) add("error", "fact-percent", where, `says ${factWhat(part, key, track)} ${v}% (${how}); ETEC's table has none in that track (${src})`, evidence);
    else if (v !== want) add("error", "fact-percent", where, `says ${factWhat(part, key, track)} ${v}% (${how}); ETEC's table says ${want}% (${src})`, evidence);
    return;
  }
  if (part && key) {
    const ok = ["sci", "lit"].map(t => factVal(part, t, key)).filter(x => x != null);
    if (ok.length && !ok.includes(v)) add("error", "fact-percent", where, `says ${factWhat(part, key)} ${v}% (${how}); ETEC's table says ${ok.join("% / ")}% (scientific / theoretical; ${src})`, evidence);
    return;
  }
  if (!FACT_PCTS.has(v)) add("error", "fact-percent", where, `exam percentage ${v}% is not in ETEC's table (${src})`, evidence);
}
function checkFactSentence(where, s, ctx) {
  const clean = s.replace(/https?:\/\/[^\s)\]»"']+/g, " ").replace(/%[0-9A-F]{2}/gi, " "); // a percent-encoded URL is not a percentage
  let carry = null;
  for (const p of clean.matchAll(/([0-9٠-٩]+(?:[.,٫][0-9٠-٩]+)?)\s*[٪%]/g)) {
    const i = p.index, end = i + p[0].length, v = pctNum(p[1]);
    const after = clean.slice(end, end + 50), before = clean.slice(Math.max(0, i - 40), i);
    if (/^\s*من\s*[0-9٠-٩(]/.test(after)) continue;                 // «٢٥٪ من ٨٠»: a worked problem
    if (/(?:أعلى|أدنى|أقل|أكثر|أفضل)\s*$/.test(before)) continue;     // «أعلى ٥٪»: a percentile
    const pa = PART_AFTER_PCT.exec(after);
    const dm = pa ? FACT_DOMAINS.find(d => d.key === "total" && d.part === (/لفظ/.test(pa[1]) ? "verbal" : "quant")) : FACT_DOMAINS.find(d => d.reEnd.test(before));
    let track = null, how = "";
    const ta = TRACK_AFTER.exec(after), tb = TRACK_BEFORE.exec(before);
    if (ta) { track = trackOf(ta[1]); how = `«${ta[0].trim()}» after it`; }
    else if (tb) { track = trackOf(tb[1]); how = `«${tb[1]}» before it`; }
    else if (carry && dm && dm.key !== "total" && /\([^)]*$/.test(clean.slice(carry.at, i))) { track = carry.track; how = `inside the brackets after «${carry.what}»`; }
    if (track && (!dm || dm.key === "total")) carry = { track, at: end, what: p[0] + (tb ? " " + tb[1] : "") };
    let part = dm ? dm.part : null, key = dm ? dm.key : null;
    if (!dm) {
      /* no domain right before it: the part named last before it, in the sentence or the two before */
      const hay = ctx + " \n " + clean.slice(0, i);
      const last = [...hay.matchAll(/(?<![\p{L}])(?:و|ب|ل|لل)?(?:ال)?(كمي|لفظي)(?:[ةه])?(?![\p{L}])/gu)].pop();
      if (last) { part = /لفظ/.test(last[1]) ? "verbal" : "quant"; key = "total"; }
    }
    judgeFact(where, v, part, key, track, s.slice(0, 220), (dm ? `«${dm.key === "total" ? FACT_NAME[dm.part] : dm.key}» ${pa ? "after" : "before"} it` : part ? `${FACT_NAME[part]} named before it` : "no domain read") + (how ? ", " + how : ""));
  }
}
/* a table of shares: a header row that names the tracks («التخصصات العلمية» | «التخصص النظري»),
   then a row per domain or part; each percent cell held to that domain's value in that column's track */
function checkFactTable(where, rows) {
  let cols = null;
  for (const r of rows) {
    if (!cols) { const c = r.map(x => FACT_TRACK.test(x) && !/[0-9٠-٩]/.test(x) ? trackOf(x) : null); if (c.some(Boolean)) cols = c; continue; }
    const first = String(r[0] || "").trim(); if (/[0-9٠-٩]/.test(first)) continue;
    const dm = FACT_DOMAINS.find(d => d.re.test(first)); if (!dm) continue;
    r.forEach((cell, j) => {
      if (!j || !cols[j]) return;
      const m = /([0-9٠-٩]+(?:[.,٫][0-9٠-٩]+)?)\s*[٪%]/.exec(cell); if (!m) return;
      judgeFact(where, pctNum(m[1]), dm.part, dm.key, cols[j], `| ${r.join(" | ")} |`.slice(0, 220), `the table's row «${first}», column «${TRACK_NAME[cols[j]]}»`);
    });
  }
  return !!cols;
}
/* Markdown tables in a text (llms.txt, llms-full.txt): consecutive «| … |» lines, cells split on
   unescaped «|», the «|---|» row dropped */
function markdownTables(t) {
  const out = []; let cur = null;
  for (const line of String(t).split(/\r?\n/)) {
    const l = line.trim();
    if (!/^\|.*\|$/.test(l)) { cur = null; continue; }
    if (!cur) { cur = []; out.push(cur); }
    if (/^\|[\s|:\-]+\|$/.test(l)) continue;
    cur.push(l.slice(1, -1).split(/(?<!\\)\|/).map(c => c.replace(/\\\|/g, "|").trim()));
  }
  return out;
}
/* HTML tables as rows of cell text, a colspan repeated across the columns it spans */
const htmlTableRows = root => byTag(root, "table").map(tb => byTag(tb, "tr").map(tr => tr.children.filter(c => c.tag === "th" || c.tag === "td").flatMap(c => Array(Math.max(1, Math.min(20, Number(c.attrs.colspan) || 1))).fill(textOf(c)))));
/* text-level checks shared by pages and llms.txt */
function checkClaims(where, text, opt = {}) {
  if (!DATA) return;
  const t = text;
  const sentences = t.split(/(?<=[.!؟?])\s+|\n/).filter(s => s.trim());
  const snip = (s, i) => s.slice(Math.max(0, i - 40), i + 50).replace(/\s+/g, " ");
  const handled = checkScopedCounts(where, t);
  // digit counts: lessons, questions, rules
  /* a count and its noun sit on one line («٤٢٠\nقوانين المثلث» is a number, then a heading) */
  const re = /([0-9٠-٩]+)[ \t ]*(دروس|درساً|درسا|درس|أسئلة|سؤالاً|سؤالا|سؤال|قوانين|قانوناً|قانونا|قانون|قاعدة|قواعد)([ \t ]*(?:قصير|مقارنة|للمقارنة))?/g; let m;
  while ((m = re.exec(t))) {
    if (handled.has(m.index)) continue; // a unit's or a lesson's count, judged against that unit or lesson
    const n = Number(fromAr(m[1])); const noun = m[2];
    let kind = NOUN.lesson.test(noun) ? "lesson" : NOUN.question.test(noun) ? "question" : "rule";
    const mod = (m[3] || "").trim();
    const ctx = t.slice(Math.max(0, m.index - 160), m.index + 80);
    if (kind === "question" && /مقارنة/.test(mod)) {
      if (n > DATA.comparison) add("error", "count-comparison", where, `says ${n} comparison questions; js/data has ${DATA.comparison}`, snip(t, m.index));
      else if (n !== DATA.comparison && n >= 20) add("warn", "count-comparison", where, `says ${n} comparison questions; js/data has ${DATA.comparison}`, snip(t, m.index));
      continue;
    }
    if (kind === "lesson" && /قصير/.test(mod)) kind = "short";
    if (n < (kind === "lesson" || kind === "short" ? 10 : 50)) continue;
    judgeCount(where, kind, n, snip(t, m.index), m[0].trim(), ctx, { before: t.slice(Math.max(0, m.index - 80), m.index), after: t.slice(m.index + m[0].length, m.index + m[0].length + 40) });
    void ctx;
  }
  // English counts (llms.txt has an English summary)
  /* up to two adjectives between the number and its noun: «300 original questions», «35 solved
     comparison questions» (a comparison count is held to the comparison total) */
  const ren = /\b(\d+)\s+((?:(?:original|solved|practice|exam-style|exam|worked|multiple-choice|comparison|interactive|free|new|quantitative|math|maths)\s+){0,2})(short lessons?|lessons?|questions?|rules?)\b/gi;
  while ((m = ren.exec(t))) {
    const n = Number(m[1]); const kind = /short/i.test(m[3]) ? "short" : /lesson/i.test(m[3]) ? "lesson" : /question/i.test(m[3]) ? "question" : "rule";
    if (kind === "question" && /comparison/i.test(m[2])) {
      if (n > DATA.comparison) add("error", "count-comparison", where, `says ${n} comparison questions; js/data has ${DATA.comparison}`, snip(t, m.index));
      else if (n !== DATA.comparison && n >= 20) add("warn", "count-comparison", where, `says ${n} comparison questions; js/data has ${DATA.comparison}`, snip(t, m.index));
      continue;
    }
    if (n >= (kind === "lesson" || kind === "short" ? 10 : 50)) judgeCount(where, kind, n, snip(t, m.index), `"${m[0]}"`, null, { before: t.slice(Math.max(0, m.index - 80), m.index), after: t.slice(m.index + m[0].length, m.index + m[0].length + 40) });
  }
  // number words: «الدروس الثلاثين», «ستة وعشرين درساً»
  WORDNUM.lastIndex = 0;
  while ((m = WORDNUM.exec(t))) {
    if (handled.has(m.index)) continue;
    const n = (m[1] ? AR_UNITS[m[1]] : 0) + AR_TENS[m[2]];
    const around = t.slice(Math.max(0, m.index - 22), m.index + m[0].length + 22);
    const kind = NOUN.lesson.test(around) ? (/قصير/.test(around) ? "short" : "lesson") : NOUN.question.test(around) ? "question" : NOUN.rule.test(around) ? "rule" : null;
    if (!kind || (kind !== "lesson" && kind !== "short" && n < 50)) continue;
    judgeCount(where, kind, n, snip(t, m.index), `«${m[0]}» (${n})`, null, { before: t.slice(Math.max(0, m.index - 80), m.index), after: (/^[ 	]*\S+(.*)$/u.exec(t.slice(m.index + m[0].length, m.index + m[0].length + 50)) || [, ""])[1] });
  }
  // the literary track excludes nothing while no question is track "sci"
  /* any wording of it: a literary / theoretical track word with a filtering or lightening verb or
     noun about the questions («يُخفي الأسئلة العلمية»، «حمل كمي أخفّ»، «أسئلة أقل»، «hides»،
     «filters»), unless the sentence is about ETEC's own test («الجزء الكمي في اختبار التخصص
     النظري أصغر … ٢٥٪», «لا جبر في النظري») with nothing in it about the app, or about the mock
     and the level test, which the track does change (MOCK_SECTION_PLAN: 15 a section, not 24) */
  if (DATA.sciOnly === 0) for (const s of sentences) {
    const strong = TRACK_FILTER.test(s) || TRACK_SELECT_OWN.test(s), weak = !strong && (TRACK_LIGHTER.test(s) || TRACK_SELECT.test(s));
    if (!TRACK_LIT.test(s) || !(strong || weak) || !ABOUT_QS.test(s) || MOCK_CUE.test(s)) continue;
    if (weak && !APP_CUE.test(s) && !APP_LESSON_CUE.test(s)) continue; // «الأسئلة الكمية في المسار النظري أخفّ»: the exam's theoretical test, which is lighter
    if (ETEC_TEST.test(s) && !APP_CUE.test(s)) continue;
    const cue = (s.match(TRACK_FILTER) || s.match(TRACK_SELECT_OWN) || s.match(TRACK_LIGHTER) || s.match(TRACK_SELECT) || [""])[0];
    add("error", "false-track-claim", where, `claims the literary track drops, hides, lightens or picks the questions («${cue}»); js/data has ${DATA.sciOnly} track:"sci" questions of ${DATA.questions}, so the track changes no lesson question (only the mock's and the level test's counts)`, s.slice(0, 200));
  }
  /* exam percentages against ETEC's table (facts.json). A sentence is checked when it names a
     domain, a part or a test («حساب»، «الجبر»، «تفسير البيانات»، «الكمي»، «اختبار التخصصات
     العلمية») and a track word is in it or in the two sentences before it (the FAQ question, the
     heading, the lead-in); a table is checked cell by cell (checkFactTable). Each percent is held
     to its own cell when its domain and track can be read off the words around it («حساب ٢٣٪» in
     «العلمية ٤٥٪ (حساب ٢٣٪…»; «٤٥٪ من اختبار التخصصات العلمية»), else to the values that
     domain or part has in either track, else to the set of all of ETEC's values. «٢٥٪ من ٨٠» is a
     worked problem, not a share. */
  if (FACTS && !opt.noFacts) {
    for (let k = 0; k < sentences.length; k++) {
      const s = sentences[k];
      if (!/[0-9٠-٩]\s*[٪%]/.test(s) || /^\s*\|/.test(s)) continue; // a Markdown table row: checkFactTable
      const ctx = sentences.slice(Math.max(0, k - 2), k).join(" \n ");
      if (!FACT_DOMAIN.test(s) && !FACT_PART.test(s) && !FACT_PART.test(ctx)) continue;
      if (!FACT_TRACK.test(s) && !FACT_TRACK.test(ctx)) continue;
      if (!FACT_DOMAIN.test(s) && !FACT_PART.test(s) && !FACT_TRACK.test(s)) continue;
      checkFactSentence(where, s, ctx);
    }
    const loose = [];
    for (const rows of (opt.tableRows || []).concat(markdownTables(t))) if (!checkFactTable(where, rows)) loose.push(rows.map(r => r.join(" | ")).join(" ; "));
    for (const s of loose) {
      if (!/(الكمي|اللفظي|حساب|هندسة|جبر|تفسير البيانات)/.test(s) || !FACT_TRACK.test(s)) continue;
      const sNoUrl = s.replace(/https?:\/\/[^\s)\]»"']+/g, " ").replace(/%[0-9A-F]{2}/gi, " ");
      for (const p of sNoUrl.matchAll(/([0-9٠-٩]+(?:[.,٫][0-9٠-٩]+)?)\s*[٪%]/g)) {
        const v = Number(fromAr(p[1]).replace(/[,٫]/, "."));
        if (!FACT_PCTS.has(v)) add("error", "fact-percent", where, `exam percentage ${v}% in a table is not in ETEC's table (facts.json, read ${FACTS.checked} off ${FACTS.gatPage})`, s.slice(0, 220));
      }
    }
  }
  // «·» reads as the Arabic zero in this font
  if (!opt.noDot && /\u00b7/.test(t)) { const i = t.indexOf("\u00b7"); add(opt.dotLevel || "error", "middle-dot", where, "uses «·» as a separator (reads as the Arabic zero); use «—» or «،»", snip(t, i)); }
}

/* counts a page states about itself, in its title, its descriptions (meta, og, twitter), its H1 and
   its own JSON-LD (name, headline, description, abstract; not FAQ text): «١١ قانوناً بصيغها»,
   «و٣ أسئلة محلولة», «١٠ منها بمثال». Each is held to what the page carries — its rule sections
   (the generator's anchors, or the page's lesson's rules in js/data), its question cards (.qcard or
   id="q-<bank id>"), its rule sections with a «مثال:» line. A number that is one of the data's
   totals («٤٠٣ قانوناً», «٢٥٥ سؤالاً») is the app's, judged by checkClaims; a page with nothing to
   count it against is a note. Returns how many it judged. */
const SELF_RE = new RegExp(NUM_TOKEN + /\s*(قوانين|قانوناً|قانونا|قانون|قاعدة|قواعد|أسئلة|سؤالاً|سؤالا|سؤال)(\s*(?:محلول[ةه]?|محلولاً|مقارنة|للمقارنة))?(?![\p{L}])/.source, "gu");
const SELF_EX_RE = new RegExp(NUM_TOKEN + /\s*منها\s*(?:بمثال|بأمثلة|مع\s+مثال|فيها\s+مثال)(?![\p{L}])/.source, "gu");
function checkSelfCounts(pg, w, m, title, d) {
  if (!DATA) return 0;
  const here = new URL(w).pathname;
  const ruleEls = RULE_AT ? all(pg.root, x => x.attrs && x.attrs.id && RULE_AT.has(here + "#" + x.attrs.id)) : [];
  const withEx = ruleEls.filter(el => all(el, y => /^(p|li|div|dd)$/.test(y.tag) && /^\s*مثال\s*:/.test(textOf(y))).length).length;
  const cards = all(pg.root, x => x.attrs && (/(^|\s)qcard(\s|$)/.test(x.attrs.class || "") || (/^q-/.test(x.attrs.id || "") && DATA.qById && DATA.qById[x.attrs.id.slice(2)])));
  const nQ = cards.length, nCmp = cards.filter(x => { const q = DATA.qById && DATA.qById[String(x.attrs.id || "").slice(2)]; return q && q.format === "comparison"; }).length;
  const lessons = new Set(ruleEls.map(el => RULE_AT.get(here + "#" + el.attrs.id).lesson));
  const lesson = lessons.size === 1 ? DATA.lessons.find(l => l.key === [...lessons][0]) : null;
  const metaV = (attr, name) => byTag(pg.root, "meta").filter(x => String(x.attrs[attr] || "").toLowerCase() === name).map(x => x.attrs.content || "");
  const srcs = [["title", title], ["description", d], ...m.h1.map(h => ["H1", h])];
  for (const n of ["og:title", "og:description", "twitter:title", "twitter:description"]) for (const a of ["property", "name"]) for (const v of metaV(a, n)) srcs.push([n, v]);
  for (const node of m.ld.flatMap(ldNodes)) {
    const ty = typesOf(node); if (ty.some(t => /Question|Answer|HowToStep|ListItem|Organization|Brand|Person/.test(t))) continue;
    for (const k of ["name", "headline", "alternativeHeadline", "description", "abstract"]) if (typeof node[k] === "string") srcs.push([`JSON-LD ${ty[0] || "?"}.${k}`, node[k]]);
  }
  const found = new Map(); // "kind n" -> { n, kind, want, what, where: [labels], ctx }
  const note = (kind, n, want, what, lbl, v, at, text) => { const k = kind + " " + n; if (!found.has(k)) found.set(k, { kind, n, want, what, text, where: [], ctx: v.slice(Math.max(0, at - 50), at + 60) }); const f = found.get(k); if (!f.where.includes(lbl)) f.where.push(lbl); };
  for (const [lbl, v] of srcs) {
    if (!v) continue;
    for (const mm of v.matchAll(SELF_RE)) {
      const k = numOf(mm[1]); if (k == null || (k >= 1400 && k <= 2100)) continue;
      if (LABEL_BEFORE.test(v.slice(0, mm.index))) continue; // «السؤال ٣»
      const isRule = /قانون|قوانين|قاعد/.test(mm[2]), isCmp = /مقارنة/.test(mm[3] || "");
      if (isRule ? ALLOWED.rule.has(k) : isCmp ? k === DATA.comparison : ALLOWED.question.has(k)) continue; // the app's total
      if (!isRule && EXAM_Q.has(k) && /(اختبار|الاختبار|دقيق[ةه]|دقائق|ساع|أقسام|قسم|الهيئ[ةه]|الدليل)/.test(v.slice(Math.max(0, mm.index - 60), mm.index + mm[0].length + 40))) continue; // the exam's own count («١٢٠ سؤالاً في ١٢٥ دقيقة»), checked by checkExamFacts
      if (isRule) note("rule", k, [ruleEls.length, lesson ? lesson.rules : 0].filter(Boolean), ruleEls.length ? `${ruleEls.length} rule section(s)${lesson ? ` (its lesson «${lesson.title}» has ${lesson.rules} rules in js/data)` : ""}` : "", lbl, v, mm.index, mm[0].trim());
      else note(isCmp ? "comparison" : "question", k, [isCmp ? nCmp : nQ].filter(Boolean), (isCmp ? nCmp : nQ) ? `${isCmp ? nCmp + " comparison question card(s)" : nQ + " question card(s)"}` : "", lbl, v, mm.index, mm[0].trim());
    }
    for (const mm of v.matchAll(SELF_EX_RE)) { const k = numOf(mm[1]); if (k != null) note("example", k, ruleEls.length ? [withEx] : [], ruleEls.length ? `${withEx} rule section(s) with a «مثال:» line` : "", lbl, v, mm.index, mm[0].trim()); }
  }
  let n = 0;
  for (const f of found.values()) {
    if (!f.want.length) { add("info", "count-self-unmeasured", w, `says «${f.text}» about itself (${f.where.join(", ")}) but carries nothing the audit can count it against`, f.ctx); continue; }
    n++;
    /* fewer examples claimed than the page shows understates it (a warning); every other mismatch, and any count above what the page has, is false */
    if (!f.want.includes(f.n)) add(f.kind === "example" && f.n < Math.max(...f.want) ? "warn" : "error", "count-self", w, `says «${f.text}» about itself in ${f.where.join(", ")}, but the page has ${f.what}`, f.ctx);
  }
  return n;
}
function checkVisibleChars(where, root) {
  let latin = 0, latinEx = "", emoji = 0, emojiEx = "", dots = 0, dotEx = "", named = 0, namedEx = "";
  for (const tn of textNodes(root)) {
    if (tn.lang.startsWith("en") || tn.code) continue;
    let t = tn.text.replace(/https?:\/\/\S+/g, "").replace(/\b[\w.-]+\.(xyz|com|sa|org|net|txt|apk|html|json|md)\b/gi, "").replace(/[\w.+-]+@[\w.-]+/g, "");
    /* a digit inside a Latin proper name («Baloo Bhaijaan 2») is the name, not a number we wrote;
       still worth wrapping in lang="en" so readers and this check know it */
    const nm = t.match(/[A-Za-z][A-Za-z.-]*(?:\s+[A-Za-z][A-Za-z.-]*)*\s+\d+\b|\b[A-Za-z]+\d+[A-Za-z\d]*\b/g);
    if (nm) { named += nm.length; if (!namedEx) namedEx = nm[0] + " in «" + t.trim().slice(0, 90) + "»"; t = t.replace(/[A-Za-z][A-Za-z.-]*(?:\s+[A-Za-z][A-Za-z.-]*)*\s+\d+\b|\b[A-Za-z]+\d+[A-Za-z\d]*\b/g, ""); }
    const d = t.match(/[0-9]+/g); if (d) { latin += d.length; if (!latinEx) latinEx = t.trim().slice(0, 120); }
    const e = t.match(/\p{Extended_Pictographic}/gu); if (e) { const bad = e.filter(c => !"✔✘✓★↔©®™".includes(c)); if (bad.length) { emoji += bad.length; if (!emojiEx) emojiEx = bad.join("") + " in «" + t.trim().slice(0, 80) + "»"; } }
    if (/\uFE0F/.test(t)) { emoji++; if (!emojiEx) emojiEx = "U+FE0F in «" + t.trim().slice(0, 80) + "»"; }
    const md = t.match(/\u00b7/g); if (md) { dots += md.length; if (!dotEx) dotEx = t.trim().slice(0, 120); }
  }
  if (latin) add("error", "latin-digits", where, `${latin} Latin-digit run(s) in visible Arabic text (the project writes ٠–٩)`, latinEx);
  if (named) add("warn", "latin-digits-name", where, `${named} Latin name(s) with a digit in Arabic text; wrap the name in <span lang="en"> (or drop the digit) so it reads as a name`, namedEx);
  if (emoji) add("error", "emoji", where, `${emoji} emoji in visible text (the project forbids them)`, emojiEx);
  if (dots) add("error", "middle-dot", where, `${dots} «·» in visible text`, dotEx);
}

const NO_SAMEAS = new Set(); // pages whose Organization carries no sameAs
const ENTITIES = new Map();  // JSON-LD @id -> [{ page, fields }] for the cross-page entity check
const pages = new Map();     // base url (no hash) -> page record
const linkGraph = new Map(); // target -> Set(source)
const linkChecks = new Map(); // target -> {status, final}
let ROBOTS = { groups: [], sitemaps: [] };
let SITEMAP = [];            // [{loc, base, lastmod}]
let VCFG = null;             // what vercel.json does to sample requests (local runs)

const ROBOT_METAS = ["robots", "googlebot", "googlebot-news", "bingbot"];
/* a robots directive list as a set of names: "index, follow, max-snippet:-1" → index follow max-snippet:-1 */
const robotsSet = s => new Set(String(s || "").toLowerCase().split(/\s*,\s*/).map(x => x.trim().replace(/\s*:\s*/, ":")).filter(Boolean));
const hasNoindex = s => /(^|[\s,:])(noindex|none)(?=$|[\s,])/i.test(String(s || ""));
const hasNofollow = s => /(^|[\s,:])(nofollow|none)(?=$|[\s,])/i.test(String(s || ""));
function pageMeta(root, url) {
  const metas = byTag(root, "meta");
  const m = name => { const el = metas.find(x => (x.attrs.name || "").toLowerCase() === name); return el ? el.attrs.content || "" : null; };
  const p = name => { const el = metas.find(x => (x.attrs.property || "").toLowerCase() === name); return el ? el.attrs.content || "" : null; };
  const links = byTag(root, "link");
  const rel = r => links.filter(l => (l.attrs.rel || "").toLowerCase().split(/\s+/).includes(r));
  const html = byTag(root, "html")[0];
  const ld = []; const ldErr = [];
  for (const s of byTag(root, "script")) if ((s.attrs.type || "").toLowerCase() === "application/ld+json") {
    const raw = s.children.map(c => c.text || "").join("");
    try { ld.push(JSON.parse(raw)); } catch (e) { ldErr.push(String(e.message).slice(0, 120)); }
  }
  return {
    title: byTag(root, "title").map(t => textOf(t)),
    desc: metas.filter(x => (x.attrs.name || "").toLowerCase() === "description").map(x => x.attrs.content || ""),
    /* every robots meta, not the first: Google applies the most restrictive of all of them
       (robots, googlebot, googlebot-news; bingbot for Bing), wherever they sit */
    robotsMetas: metas.filter(x => ROBOT_METAS.includes((x.attrs.name || "").toLowerCase().trim())).map(x => ((x.attrs.name || "").toLowerCase().trim()) + ": " + String(x.attrs.content || "").toLowerCase().trim()),
    robots: metas.filter(x => ROBOT_METAS.includes((x.attrs.name || "").toLowerCase().trim())).map(x => String(x.attrs.content || "")).filter(Boolean).join(", ").toLowerCase(),
    viewport: m("viewport"),
    canon: rel("canonical").map(l => new URL(l.attrs.href || "", url).href),
    ogUrl: p("og:url"), ogImage: p("og:image"), ogImageW: p("og:image:width"), ogImageH: p("og:image:height"), twImage: m("twitter:image") || p("twitter:image"), ogSite: p("og:site_name"), ogTitle: p("og:title"),
    lang: html ? html.attrs.lang || "" : "", dir: html ? html.attrs.dir || "" : "",
    hreflang: links.filter(l => (l.attrs.rel || "").toLowerCase() === "alternate" && l.attrs.hreflang).map(l => ({ lang: l.attrs.hreflang, href: new URL(l.attrs.href || "", url).href })),
    h1: byTag(root, "h1").map(h => textOf(h)),
    ld, ldErr,
  };
}

async function fetchPage(url) {
  const { final, hops } = await chain(url);
  const rec = { url, status: final.status, hops, ctype: final.headers["content-type"] || "", bytes: final.bytes, ms: final.ms, xrobots: (final.headers["x-robots-tag"] || "").toLowerCase(), finalUrl: final.url };
  if (final.status === 200 && /text\/html/.test(rec.ctype)) {
    rec.html = final.body;
    rec.root = parseHTML(final.body);
    rec.meta = pageMeta(rec.root, final.url);
    const body = byTag(rec.root, "body")[0] || rec.root;
    rec.text = textOf(body);
    rec.words = wordCount(rec.text);
    rec.links = byTag(rec.root, "a").filter(a => a.attrs.href != null).map(a => ({ href: a.attrs.href, abs: (() => { try { return new URL(a.attrs.href, final.url).href; } catch (e) { return null; } })(), text: textOf(a), aria: a.attrs["aria-label"] || a.attrs.title || "", img: byTag(a, "img").map(i => i.attrs.alt || "").join(" ") }));
    rec.ids = new Set(all(rec.root, n => n.attrs && (n.attrs.id || (n.tag === "a" && n.attrs.name))).map(n => n.attrs.id || n.attrs.name));
    rec.noindex = hasNoindex(rec.meta.robots) || hasNoindex(rec.xrobots);
    rec.nofollow = hasNofollow(rec.meta.robots) || hasNofollow(rec.xrobots);
  }
  return rec;
}

/* ---------- headless Chrome: the DOM after JavaScript ---------- */
function renderDom(url) {
  return new Promise(resolve => {
    if (!CHROME) return resolve(null);
    const prof = fs.mkdtempSync(path.join(os.tmpdir(), "qseo-"));
    const args = ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--mute-audio", "--hide-scrollbars",
      "--user-data-dir=" + prof, "--window-size=412,915", "--user-agent=" + GOOGLEBOT_MOBILE, "--virtual-time-budget=8000", "--run-all-compositor-stages-before-draw", "--dump-dom", url];
    const ch = spawn(CHROME, args, { stdio: ["ignore", "pipe", "ignore"] });
    const out = [];
    const timer = setTimeout(() => { try { ch.kill(); } catch (e) { } }, 45000);
    ch.stdout.on("data", d => out.push(d));
    ch.on("close", () => {
      clearTimeout(timer);
      setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) { } }, 500);
      const html = Buffer.concat(out).toString("utf8");
      resolve(html.length > 50 ? html : null);
    });
    ch.on("error", () => { clearTimeout(timer); resolve(null); });
  });
}

/* ---------- headless Chrome over the DevTools Protocol: the DOM after JavaScript, and what a
   reader actually sees in it ----------
   One Chrome, one tab a page, Googlebot's smartphone agent at 412×915. After the load event
   and a settle, a probe in the page records the DOM, marks every element hidden by computed
   style (display:none, visibility:hidden, opacity:0, content-visibility:hidden, off-screen,
   clipped to a pixel, font-size:0) and reads body.innerText with those masked. Collapsed
   <details> and hidden="until-found" are opened first: Google counts that text. A stacked
   fraction's screen-reader reading (.fr-sr) is kept. Needs Node's built-in WebSocket (22+);
   without it renderDom's --dump-dom is used and the visible text falls back to the parse. */
const VIS_PROBE = `(() => {
  for (const a of document.getAnimations ? document.getAnimations() : []) { try { const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null; if (t && t.endTime !== Infinity) a.finish(); } catch (e) { } }
  const html = "<!DOCTYPE html>" + document.documentElement.outerHTML;
  for (const d of document.querySelectorAll("details:not([open])")) d.open = true;
  for (const e of document.querySelectorAll("[hidden=until-found]")) e.removeAttribute("hidden");
  const W = Math.max(document.documentElement.scrollWidth, innerWidth);
  const words = s => (s.match(/[\\p{L}\\p{N}]+/gu) || []).length;
  const why = el => {
    const cs = getComputedStyle(el);
    if (cs.display === "none") return "display:none";
    if (cs.visibility === "hidden" || cs.visibility === "collapse") return "visibility:" + cs.visibility;
    if (Number(cs.opacity) === 0) return "opacity:0";
    if (cs.contentVisibility === "hidden") return "content-visibility:hidden";
    if (parseFloat(cs.fontSize) === 0 && (el.textContent || "").trim()) return "font-size:0";
    const r = el.getBoundingClientRect();
    if (r.width || r.height) {
      const L = r.left + scrollX, T = r.top + scrollY;
      if (L + r.width <= 0 || T + r.height <= 0 || L >= W) return "off-screen at " + Math.round(L) + "," + Math.round(T);
      if ((r.width <= 2 || r.height <= 2) && /hidden|clip/.test(cs.overflow + " " + cs.overflowX + " " + cs.overflowY)) return "clipped to " + Math.round(r.width) + "x" + Math.round(r.height);
    }
    if (/rect\\(\\s*0(px)?[ ,]+0(px)?[ ,]+0(px)?[ ,]+0(px)?\\s*\\)/.test(cs.clip) || /inset\\(\\s*(50|100)%/.test(cs.clipPath)) return "clip";
    return null;
  };
  const hidden = [], masked = [], blanked = [];
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "HEAD", "LINK", "META", "svg", "SVG"]);
  /* text a box shows but a reader cannot see: the text's colour on its own background (white on
     white, contrast under 1.5:1 against the first opaque background up the tree; a background
     image, a text stroke or shadow leave it unjudged), and text drawn outside the page or outside
     the box that clips it (text-indent:-9999px under overflow:hidden), measured on the text
     itself with Range.getClientRects() */
  const rgba = s => { if (!/^rgba?\\(/.test(s || "")) return null; const m = s.match(/[\\d.]+/g); return m && m.length >= 3 ? [Number(m[0]), Number(m[1]), Number(m[2]), m.length > 3 ? Number(m[3]) : 1] : null; };
  const over = (a, b) => [0, 1, 2].map(i => a[i] * a[3] + b[i] * (1 - a[3])).concat(1);
  const BG = new Map();
  const bgOf = e => {
    if (!e || e.nodeType !== 1) return [255, 255, 255, 1];
    if (BG.has(e)) return BG.get(e);
    const cs = getComputedStyle(e); let v;
    if (cs.backgroundImage && cs.backgroundImage !== "none") v = null;
    else { const c = rgba(cs.backgroundColor); if (c && c[3] >= 0.99) v = c; else { const up = bgOf(e.parentElement); v = up && c && c[3] > 0 ? over(c, up) : up; } }
    BG.set(e, v); return v;
  };
  const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3 && /[\\p{L}\\p{N}]/u.test(n.nodeValue));
  const textWhy = el => {
    if (el.closest(".fr-sr")) return null;
    const tns = ownText(el); if (!tns.length) return null;
    const cs = getComputedStyle(el);
    if (!(parseFloat(cs.webkitTextStrokeWidth) > 0) && (!cs.textShadow || cs.textShadow === "none")) {
      const bg = bgOf(el), fg0 = rgba(cs.webkitTextFillColor || cs.color) || rgba(cs.color);
      if (bg && fg0) { const fg = over(fg0, bg), a = lum(fg), b = lum(bg), r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); if (r < 1.5) return ["same colour as its background (contrast " + r.toFixed(2) + ":1)", tns]; }
    }
    const clips = []; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const s = getComputedStyle(e); const x = /hidden|clip/.test(s.overflowX), y = /hidden|clip/.test(s.overflowY); if (x || y) clips.push([e.getBoundingClientRect(), x, y]); }
    const rects = []; for (const tn of tns) { const rg = document.createRange(); rg.selectNodeContents(tn); for (const r of rg.getClientRects()) if (r.width > 0 && r.height > 0) rects.push(r); }
    if (!rects.length) return null;
    const out = r => { const L = r.left + scrollX, T = r.top + scrollY; if (L + r.width <= 0 || L >= W || T + r.height <= 0) return "outside the page"; for (const [c, x, y] of clips) if ((x && (r.right <= c.left + 1 || r.left >= c.right - 1)) || (y && (r.bottom <= c.top + 1 || r.top >= c.bottom - 1))) return "outside the box that clips it"; return null; };
    const o = rects.map(out); if (o.every(Boolean)) return ["text drawn " + o[0] + " (text-indent / position)", tns];
    return null;
  };
  const rec = el => {
    if (SKIP.has(el.tagName)) return;
    const w = why(el);
    if (!w) {
      const tw = textWhy(el);
      if (tw) {
        const t = tw[1].map(n => n.nodeValue).join(" ").replace(/\\s+/g, " ").trim();
        for (const n of tw[1]) { blanked.push([n, n.nodeValue]); n.nodeValue = ""; }
        if (words(t) > 8) hidden.push({ tag: el.tagName.toLowerCase(), id: el.id || "", cls: String(typeof el.className === "string" ? el.className : "").slice(0, 60), why: tw[0], ariaHidden: el.closest("[aria-hidden=true]") ? 1 : 0, words: words(t), text: t.slice(0, 160) });
      }
    }
    if (w) {
      if (el.closest(".fr-sr")) return;
      masked.push([el, el.style.getPropertyValue("display"), el.style.getPropertyPriority("display")]);
      const parts = [], tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); while (tw.nextNode()) if (!/^(SCRIPT|STYLE)$/.test(tw.currentNode.parentNode.nodeName)) parts.push(tw.currentNode.nodeValue);
      const t = parts.join(" ").replace(/\\s+/g, " ").trim();
      if (words(t) > 8) hidden.push({ tag: el.tagName.toLowerCase(), id: el.id || "", cls: String(typeof el.className === "string" ? el.className : "").slice(0, 60), why: w, ariaHidden: el.closest("[aria-hidden=true]") ? 1 : 0, words: words(t), text: t.slice(0, 160) });
      return;
    }
    for (const c of el.children) rec(c);
  };
  if (document.body) rec(document.body);
  for (const [el] of masked) el.style.setProperty("display", "none", "important");
  const text = document.body ? document.body.innerText : "";
  for (const [el, v, p] of masked) { if (v) el.style.setProperty("display", v, p); else el.style.removeProperty("display"); }
  const quiet = blanked.map(([n, v]) => (n.parentNode ? n.parentNode.nodeName.toLowerCase() + ": " : "") + v.trim().slice(0, 60));
  for (const [n, v] of blanked) n.nodeValue = v;
  return { html, text, hidden, quiet, url: location.href };
})()`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function cdpBrowser() {
  return new Promise(resolve => {
    if (!CHROME || typeof WebSocket !== "function") return resolve(null);
    const port = 9300 + (process.pid % 600);
    const prof = fs.mkdtempSync(path.join(os.tmpdir(), "qseo-cdp-"));
    const ch = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--mute-audio", "--hide-scrollbars",
      /* tabs opened side by side must each paint as a visible tab would: a backgrounded tab runs no
         frames, so it records no first paint and no layout shift (CLS 0 that means nothing) */
      "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding",
      "--user-data-dir=" + prof, "--remote-debugging-port=" + port, "about:blank"], { stdio: "ignore" });
    const close = () => { try { ch.kill(); } catch (e) { } setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) { } }, 800); };
    (async () => {
      for (let i = 0; i < 60; i++) {
        try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) return resolve({ port, close }); } catch (e) { }
        await sleep(200);
      }
      close(); resolve(null);
    })();
  });
}
async function cdpRender(br, url, settle) {
  let tab = null, ws = null;
  try {
    tab = await (await fetch(`http://127.0.0.1:${br.port}/json/new?about:blank`, { method: "PUT" })).json();
    ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("ws")); });
    let id = 0; const wait = new Map(), events = [];
    ws.onmessage = m => { const d = JSON.parse(typeof m.data === "string" ? m.data : Buffer.from(m.data).toString()); if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); } else if (d.method) events.push(d.method); };
    const send = (method, params = {}) => new Promise(res => { const k = ++id; wait.set(k, res); ws.send(JSON.stringify({ id: k, method, params })); });
    await send("Emulation.setUserAgentOverride", { userAgent: GOOGLEBOT_MOBILE });
    await send("Emulation.setDeviceMetricsOverride", { width: 412, height: 915, deviceScaleFactor: 1, mobile: true });
    await send("Page.enable");
    await send("Page.navigate", { url });
    for (let i = 0; i < 150 && !events.includes("Page.loadEventFired"); i++) await sleep(200);
    await sleep(settle);
    const r = await send("Runtime.evaluate", { expression: VIS_PROBE, returnByValue: true });
    const v = r.result && r.result.result && r.result.result.value;
    return v && v.html ? v : null;
  } catch (e) { return null; }
  finally {
    try { if (ws) ws.close(); } catch (e) { }
    if (tab) try { await fetch(`http://127.0.0.1:${br.port}/json/close/${tab.id}`); } catch (e) { }
  }
}

/* ---------- JSON-LD type rules (Google Search Central's documented properties) ---------- */
function checkJsonLd(pg) {
  const where = pg.url; const meta = pg.meta;
  for (const e of meta.ldErr) add("error", "jsonld-parse", where, "JSON-LD block does not parse", e);
  const nodes = meta.ld.flatMap(ldNodes);
  const ids = new Map(nodes.filter(n => n["@id"]).map(n => [n["@id"], n]));
  const resolve = v => v && typeof v === "object" && v["@id"] && !v["@type"] ? ids.get(v["@id"]) || v : v;
  /* visible: the text itself, or (when the page lays it out in boxes) every number in order
     and at least 80% of its words somewhere on the page */
  /* the text a reader sees: computed-style visibility when the page was rendered over the
     DevTools Protocol, else the parse (hidden attribute and inline display:none skipped) */
  const shown = pg.visible ? pg.rText : pg.text;
  const vis = norm(shown), visSkel = skel(shown), visSig = sig(shown), visWords = new Set(vis.split(/[^\p{L}\p{N}]+/u));
  const visible = s => {
    const x = norm(s); if (!x) return false;
    if (vis.includes(x.slice(0, 90))) return true;
    /* the same text with its signs, whatever the spacing (innerText breaks a stacked fraction
       onto lines: «٣ على ٤ =» where JSON-LD has «٣/٤=») */
    const xs = sig(s); if (xs.length >= 4 && visSig.includes(xs)) return true;
    const nums = fromAr(x).match(/\d+/g) || []; let at = 0;
    for (const d of nums) { const j = fromAr(visSkel).indexOf(d, at); if (j < 0) return false; at = j + d.length; }
    const ws = x.split(/[^\p{L}\p{N}]+/u).filter(w => w && !/^\p{N}+$/u.test(w));
    /* an answer that is only a number and its signs («٥⁸», drawn ٥<sup>^٨</sup> and read «٥ ^ ٨»):
       its signs and digits, in order, somewhere the reader sees them */
    if (!ws.length) return xs.length > 0 && visSig.includes(xs);
    return ws.filter(w => visWords.has(w)).length / ws.length >= 0.8;
  };
  /* a question is visible only as itself: its text in order (signs and spacing aside), never as
     a bag of words found around the page («كيف أبلّغ عن خطأ في سؤال؟» edited to «أين أرسل
     ملاحظاتي؟» on the page still had all its words elsewhere on about.html) */
  const visibleQ = s => { const x = norm(s); if (!x) return false; if (vis.includes(x.slice(0, 90))) return true; const xs = sig(s); return xs.length >= 4 && visSig.includes(xs); };
  pg.ldTypes = [...new Set(nodes.flatMap(typesOf))];
  /* entities defined on this page (a node with @id and @type; a bare {"@id"} is a reference) */
  const FIELDS = ["name", "alternateName", "url", "logo", "sameAs", "description"];
  const val = v => v == null ? null : JSON.stringify(Array.isArray(v) ? v.map(x => typeof x === "object" && x ? x.url || x["@id"] || x : x) : typeof v === "object" ? v.url || v["@id"] || v.contentUrl || v : v);
  if (pg.indexable !== false) for (const n of nodes) if (n["@id"] && n["@type"] && Object.keys(n).some(k => !k.startsWith("@"))) {
    const f = {}; for (const k of FIELDS) f[k] = val(n[k]);
    if (!ENTITIES.has(n["@id"])) ENTITIES.set(n["@id"], []);
    ENTITIES.get(n["@id"]).push({ page: shortUrl(where), type: typesOf(n).join("/"), fields: f });
  }
  /* the schema.org vocabulary itself (tools/seo/schema-vocab.json, refreshed with --update-vocab) */
  if (VOCAB) for (const n of nodes) {
    const T = typesOf(n);
    for (const t of T) {
      if (!VOCAB.types[t]) add("error", "schema-type", where, `"${t}" is not a schema.org type (vocabulary ${VOCAB.version})`);
      else if (VOCAB.types[t].pending && !ONCE.has("pending:" + t)) { ONCE.add("pending:" + t); add("info", "schema-pending", where, `"${t}" is in schema.org's pending area (Google documents it anyway for some features)`); }
    }
    const anc = new Set(); const up = t => { if (!t || anc.has(t)) return; anc.add(t); for (const p of (VOCAB.types[t] || {}).sup || []) up(p); };
    T.forEach(up);
    for (const k of Object.keys(n)) {
      if (k.startsWith("@")) continue;
      const p = VOCAB.props[k];
      if (!p) { add("warn", "schema-property", where, `${T.join("/")}.${k} is not a schema.org property`); continue; }
      if (p.dom.length && !p.dom.some(d => anc.has(d))) add("info", "schema-domain", where, `${k} is not defined for ${T.join("/")} (schema.org lists it on ${p.dom.slice(0, 4).join(", ")})`);
    }
  }
  for (const n of nodes) {
    const T = typesOf(n);
    const miss = (props, level, why) => { const m = props.filter(p => !has(n, p)); if (m.length) add(level, "jsonld-missing", where, `${T.join("/")}: missing ${m.join(", ")}${why ? " (" + why + ")" : ""}`); };
    if (has(n, "aggregateRating") || has(n, "review")) add("error", "jsonld-rating", where, `${T.join("/")} carries aggregateRating/review; the project has no real ratings`);
    const okD = {};
    for (const k of ["datePublished", "dateModified", "uploadDate", "dateCreated"]) if (has(n, k)) { const b = badDate(n[k]); if (b) add("error", "jsonld-date", where, `${T.join("/")}.${k} is ${b}`, n[k]); else okD[k] = true; }
    for (const k of ["datePublished", "dateModified"]) if (okD[k] && String(n[k]).slice(0, 10) > today) add("error", "jsonld-date", where, `${T.join("/")}.${k} is in the future`, n[k]);
    if (okD.datePublished && okD.dateModified && String(n.dateModified).slice(0, 10) < String(n.datePublished).slice(0, 10)) add("error", "jsonld-date", where, `${T.join("/")}: dateModified before datePublished`, n.datePublished + " > " + n.dateModified);
    if (T.some(t => ["Article", "BlogPosting", "NewsArticle", "TechArticle", "ScholarlyArticle"].includes(t))) {
      miss(["headline"], "warn", "Google: recommended");
      miss(["image", "datePublished", "dateModified", "author"], "warn", "Google Article: recommended");
      if (has(n, "headline") && String(n.headline).length > 110) add("info", "jsonld-headline", where, `Article headline is ${String(n.headline).length} chars (Google shows about 110)`);
      const au = [].concat(n.author || []).map(resolve);
      for (const a of au) if (a && !a.name) add("warn", "jsonld-author", where, "author has no name");
      if (has(n, "headline") && meta.h1.length && norm(n.headline) !== norm(meta.h1[0]) && !norm(meta.h1[0]).includes(norm(n.headline).slice(0, 30))) add("info", "jsonld-headline-h1", where, "Article headline differs from the H1", n.headline + " | " + meta.h1[0]);
    }
    if (T.includes("BreadcrumbList")) {
      const items = [].concat(n.itemListElement || []);
      if (!items.length) add("error", "jsonld-breadcrumb", where, "BreadcrumbList has no itemListElement");
      items.forEach((it, i) => {
        if (!has(it, "position") || !has(it, "name")) add("error", "jsonld-breadcrumb", where, `BreadcrumbList item ${i + 1}: needs position and name`);
        if (i < items.length - 1 && !has(it, "item")) add("error", "jsonld-breadcrumb", where, `BreadcrumbList item ${i + 1}: needs item (only the last may omit it)`);
        if (has(it, "position") && Number(it.position) !== i + 1) add("warn", "jsonld-breadcrumb", where, `BreadcrumbList item ${i + 1} has position ${it.position}`);
      });
    }
    if (T.includes("FAQPage")) {
      const qs = [].concat(n.mainEntity || []).map(resolve);
      if (!qs.length) add("error", "jsonld-faq", where, "FAQPage has no mainEntity");
      for (const q of qs) {
        if (!q || !has(q, "name") || !q.acceptedAnswer || !asText(resolve(q.acceptedAnswer))) { add("error", "jsonld-faq", where, "FAQ Question needs name and acceptedAnswer.text", q && q.name); continue; }
        const inRaw = s => norm(pg.text).includes(norm(s).slice(0, 90));
        if (!visibleQ(q.name)) add("error", "faq-not-visible", where, `FAQ question in JSON-LD is not visible on the page${pg.visible && inRaw(q.name) ? " (it is in the HTML, but hidden by CSS)" : ""}`, q.name);
        if (!visible(asText(resolve(q.acceptedAnswer)))) add("error", "faq-not-visible", where, `FAQ answer in JSON-LD is not visible on the page (Google: must match visible content)${pg.visible && inRaw(asText(resolve(q.acceptedAnswer))) ? "; it is in the HTML, but hidden by CSS" : ""}`, asText(resolve(q.acceptedAnswer)).slice(0, 120));
      }
      if (!ONCE.has("faq")) { ONCE.add("faq"); add("info", "faq-rich-result", where, "FAQPage: Google retired the FAQ rich result for every site on 2026-05-07 (developers.google.com/search/updates, 2026-05-08: «This feature will no longer appear in Google Search starting May 7, 2026»; its documentation was removed); the markup gets nothing in Google Search and is kept only as valid schema.org that Bing and answer engines can read, so it must still match the visible Q&A word for word"); }
    }
    if (T.includes("Organization") || T.includes("EducationalOrganization")) {
      miss(["name", "url"], "warn"); miss(["logo"], "info", "Google: recommended for the logo in results");
      if (!has(n, "sameAs")) NO_SAMEAS.add(shortUrl(where));
    }
    if (T.includes("WebSite")) miss(["name", "url"], "error");
    if (T.some(t => ["WebPage", "AboutPage", "CollectionPage", "ItemPage", "ContactPage", "ProfilePage"].includes(t)) && meta.canon[0] && String(n["@id"] || n.url || "").split("#")[0] === toCanon(meta.canon[0])) {
      miss(["name"], "info"); if (has(n, "url") && meta.canon[0] && toCanon(meta.canon[0]) !== n.url && !n.url.includes("#")) add("warn", "jsonld-url", where, `${T.join("/")}.url differs from the canonical`, n.url + " vs " + toCanon(meta.canon[0]));
    }
    if (T.some(t => ["SoftwareApplication", "WebApplication", "MobileApplication", "VideoGame"].includes(t))) {
      miss(["name", "offers"], "error", "Google software app: required");
      const of = resolve([].concat(n.offers || [])[0]);
      if (of && (of.price == null || !of.priceCurrency)) add("error", "jsonld-offer", where, "offers needs price and priceCurrency (Google software app)");
      miss(["applicationCategory", "operatingSystem"], "warn", "Google: recommended");
      if (!has(n, "aggregateRating") && !has(n, "review")) add("info", "jsonld-app-rating", where, `${T.join("/")}: Google's software-app rich result also needs aggregateRating or review — leave it ineligible rather than invent ratings`);
    }
    if (T.includes("Quiz")) {
      const parts = [].concat(n.hasPart || []).map(resolve);
      if (!parts.length) add("error", "jsonld-quiz", where, "Quiz has no hasPart Question");
      /* the lesson pages (tools/build_lesson_pages.js refuses Quiz since round 7) and the mock page
         (guides dropped it in round 8) carry none: one coming back is a regression of the generator
         or a hand edit */
      { const pth = (() => { try { return new URL(where).pathname; } catch (e) { return String(where); } })(); if (/^\/(?:qudrat\/|qudrat-mock-test\.html$)/.test(pth)) add("warn", "jsonld-quiz-unexpected", where, "Quiz markup on a page whose owner dropped it (lesson pages since round 7, the mock page since round 8): Google shows nothing for Quiz on an Arabic page, and the owners chose plain visible questions"); }
      if (!ONCE.has("quiz-rr")) { ONCE.add("quiz-rr"); add("info", "jsonld-quiz-rich-result", where, "Quiz / practice problems: Google no longer shows this rich result (deprecation notice June 2025; Search Console and Rich Results Test support removed January 2026). Google's education Q&A result takes only eduQuestionType «Flashcard», and only in English, Portuguese, Spanish (Mexico) and Vietnamese, so an Arabic page gets nothing from it; tools/build_lesson_pages.js refuses Quiz markup since round 7. It stays as schema.org data for answer engines; only what keeps it honest is enforced (hasPart, answers with text, every text visible, answers equal to the bank)"); }
      for (const q of parts) {
        if (!q) continue;
        const need = ["eduQuestionType", "text", "acceptedAnswer"].filter(p => !has(q, p));
        if (need.length) add("error", "jsonld-question", where, "Quiz Question missing " + need.join(", "), asText(q.text || q.name).slice(0, 80));
        if (q.eduQuestionType && !["Multiple choice", "Checkbox", "Short answer", "Flashcard", "Open ended"].includes(q.eduQuestionType)) add("info", "jsonld-question", where, "eduQuestionType is not one of the values Google documented", q.eduQuestionType);
        const sug = [].concat(q.suggestedAnswer || []).map(resolve).map(asText);
        const acc = [].concat(q.acceptedAnswer || []).map(resolve);
        if (q.eduQuestionType === "Multiple choice" && !sug.length) add("info", "jsonld-question", where, "multiple-choice Question has no suggestedAnswer");
        for (const a of acc) if (!asText(a)) add("error", "jsonld-question", where, "acceptedAnswer has no text");
        if (q.text && !visible(asText(q.text))) add("error", "quiz-not-visible", where, "Quiz question in JSON-LD is not visible on the page", asText(q.text).slice(0, 120));
        for (const a of acc) {
          if (asText(a) && !visible(asText(a))) add("error", "quiz-not-visible", where, "Quiz acceptedAnswer text is not visible on the page", asText(a).slice(0, 120));
          const ex = a && resolve(a.answerExplanation); if (ex && asText(ex) && !visible(asText(ex))) add("error", "quiz-not-visible", where, "Quiz answerExplanation is not visible on the page", asText(ex).slice(0, 120));
        }
        checkQuizQuestion(where, q, resolve);
      }
    }
    if (T.includes("ItemList")) {
      const items = [].concat(n.itemListElement || []);
      if (!items.length) add("error", "jsonld-itemlist", where, "ItemList has no itemListElement");
      if (has(n, "numberOfItems") && Number(n.numberOfItems) !== items.length) add("error", "jsonld-itemlist", where, `ItemList numberOfItems ${n.numberOfItems} but ${items.length} items`);
      for (const it of items.map(resolve)) { const u = it && (it.url || (it.item && (typeof it.item === "string" ? it.item : it.item.url || it.item["@id"]))); if (u && isSite(u)) pg.ldLinks.push(u); }
    }
    if (T.includes("DefinedTermSet")) { miss(["name"], "warn"); if (!has(n, "hasDefinedTerm")) add("warn", "jsonld-terms", where, "DefinedTermSet has no hasDefinedTerm"); }
    if (T.includes("DefinedTerm")) miss(["name"], "error");
    if (T.includes("Course")) { miss(["name", "description"], "warn", "schema.org Course"); if (!ONCE.has("course-rr")) { ONCE.add("course-rr"); add("info", "jsonld-course-rich-result", where, "Course: Google no longer shows course-info rich results (documentation removed 9 Sept 2025); it stays only as schema.org data"); } }
    if (T.includes("HowTo")) add("info", "jsonld-howto", where, "HowTo: Google stopped showing HowTo rich results (2023)");
  }
  for (const u of siteUrlsIn(meta.ld)) if (isSite(u)) pg.ldLinks.push(u);
  { const bad = [...new Set(siteUrlsIn(meta.ld).concat(meta.hreflang.map(h => h.href), [meta.ogImage, meta.twImage].filter(Boolean)).filter(u => offCanon(u)))]; if (bad.length) add("warn", "link-noncanonical-host", pg.url, `${bad.length} JSON-LD / hreflang / image URL(s) for this site use ${[...new Set(bad.map(offCanon))].join(", ")} instead of https://qudrati.xyz`, bad.slice(0, 6).join(", ")); }
}

/* ---------- vercel.json, simulated: which redirect and which headers a request gets ----------
   Vercel matches `source` with path-to-regexp (strict, case-sensitive): `:name`, `:name*`,
   `:name+`, `:name?`, `:name(re)`, bare `(re)` groups and `\\.` escapes. Destinations take
   `$1` (numbered groups) and `:name`. Every matching header rule applies, a later one
   overriding an earlier one for the same key; the first matching redirect wins. */
function vercelRe(src) {
  const esc = c => c.replace(/[.+*?^${}()|[\]\\/]/g, "\\$&");
  const close = (s, i) => { let d = 0; for (let k = i; k < s.length; k++) { if (s[k] === "\\") { k++; continue; } if (s[k] === "(") d++; else if (s[k] === ")" && !--d) return k; } return s.length - 1; };
  let out = "", i = 0; const names = [];
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") { out += esc(src[i + 1] || ""); i += 2; continue; }
    if (c === ":" && /[A-Za-z_]/.test(src[i + 1] || "")) {
      let j = i + 1; while (j < src.length && /\w/.test(src[j])) j++;
      const name = src.slice(i + 1, j); let pat = "[^\\/#\\?]+?";
      if (src[j] === "(") { const k = close(src, j); pat = src.slice(j + 1, k); j = k + 1; }
      const mod = "*+?".includes(src[j] || "\0") ? src[j++] : "";
      let pre = ""; if (out.endsWith("\\/")) { out = out.slice(0, -2); pre = "\\/"; }
      names.push(name);
      if (mod === "*" || mod === "+") out += `(?:${pre}((?:${pat})(?:${pre}(?:${pat}))*))${mod === "*" ? "?" : ""}`;
      else if (mod === "?") out += `(?:${pre}(${pat}))?`;
      else out += pre + "(" + pat + ")";
      i = j; continue;
    }
    if (c === "(") { const k = close(src, i); names.push(String(names.length)); out += "(" + src.slice(i + 1, k) + ")"; i = k + 1; continue; }
    out += esc(c); i++;
  }
  return { re: new RegExp("^" + out + "$"), names };
}
function vercelHas(rule, req) {
  const test = c => {
    const v = c.type === "host" ? req.host : c.type === "query" ? (req.query || {})[c.key] : c.type === "header" ? (req.headers || {})[String(c.key).toLowerCase()] : undefined;
    if (v == null) return false;
    if (c.value == null) return true;
    try { return new RegExp("^(?:" + c.value + ")$").test(v); } catch (e) { return v === c.value; }
  };
  return (rule.has || []).every(test) && !(rule.missing || []).some(test);
}
function vercelSim(vj, reqPath, req = {}) {
  req = { host: "qudrati.xyz", ...req };
  const sub = (dest, m, names) => dest.replace(/\$(\d+)/g, (x, n) => m[Number(n)] == null ? "" : m[Number(n)]).replace(/:(\w+)\*?/g, (x, n) => { const k = names.indexOf(n); return k < 0 ? x : m[k + 1] == null ? "" : m[k + 1]; });
  let redirect = null;
  for (const r of vj.redirects || []) {
    let rx; try { rx = vercelRe(r.source); } catch (e) { continue; }
    const m = rx.re.exec(reqPath); if (!m || !vercelHas(r, req)) continue;
    redirect = { to: sub(r.destination, m, rx.names), status: r.statusCode || (r.permanent === false ? 307 : 308), rule: r.source }; break;
  }
  if (!redirect && vj.trailingSlash === false && reqPath.length > 1 && reqPath.endsWith("/")) redirect = { to: reqPath.replace(/\/+$/, ""), status: 308, rule: "trailingSlash: false" };
  if (!redirect && vj.trailingSlash === true && !reqPath.endsWith("/") && !/\.[a-z0-9]+$/i.test(reqPath)) redirect = { to: reqPath + "/", status: 308, rule: "trailingSlash: true" };
  const headers = {}, hits = {};
  for (const h of vj.headers || []) {
    let rx; try { rx = vercelRe(h.source); } catch (e) { continue; }
    if (!rx.re.test(reqPath) || !vercelHas(h, req)) continue;
    for (const x of h.headers || []) { const k = x.key.toLowerCase(); headers[k] = x.value; (hits[k] = hits[k] || []).push(h.source + " → " + x.value); }
  }
  return { redirect, headers, hits };
}

/* ---------- content facts on the pages, against js/data and js/app.js ---------- */
const cellNum = s => { const d = fromAr(String(s)).replace(/[^\d]/g, ""); return d ? Number(d) : null; };
/* a table that reports the bank («الدروس / القواعد / الأسئلة / منها مقارنة» by unit): every cell
   must equal what js/data computes today */
function checkCountTables(where, root) {
  if (!DATA) return 0;
  let checked = 0;
  for (const tb of byTag(root, "table")) {
    const rows = byTag(tb, "tr"); if (rows.length < 2) continue;
    const head = all(rows[0], n => n.tag === "th" || n.tag === "td").map(c => norm(textOf(c)));
    const col = { lessons: head.findIndex(h => /دروس/.test(h) && !/قصير/.test(h)), rules: head.findIndex(h => /(قواعد|قوانين)/.test(h)), questions: head.findIndex(h => /^(ال)?اسئله$|^عدد الاسئله$/.test(h)), cmp: head.findIndex(h => /مقارنه/.test(h)) };
    if (Object.values(col).filter(i => i >= 0).length < 2) continue;
    for (const r of rows.slice(1)) {
      const cells = all(r, n => n.tag === "th" || n.tag === "td").map(c => textOf(c));
      const label = norm(cells[0] || "");
      let want = null;
      const ui = DATA.units.findIndex(u => norm(u.title) === label);
      if (ui >= 0) want = { lessons: DATA.unitLessons[ui], rules: DATA.unitRules[ui], questions: DATA.unitQ[ui], cmp: DATA.unitCmp[ui] };
      else if (/(المجموع|الكل|الاجمالي|المجمل)/.test(label)) want = { lessons: DATA.lessons.length, rules: DATA.rules.length, questions: DATA.questions, cmp: DATA.comparison };
      if (!want) continue;
      for (const [k, i] of Object.entries(col)) {
        if (i < 0 || i >= cells.length) continue;
        const got = cellNum(cells[i]); checked++;
        if (got !== want[k]) add("error", "count-table", where, `table row «${cells[0].trim()}», column «${head[i]}» says ${got}, js/data has ${want[k]}`, HAVE());
      }
    }
  }
  return checked;
}
/* «١٥ سهلاً، و١٣٠ متوسطاً، و١١٠ صعباً»: the bank's difficulty split */
function checkDifficulty(where, text) {
  if (!DATA) return 0;
  const key = { "سهل": 1, "متوسط": 2, "صعب": 3 }; let n = 0;
  for (const s of text.split(/\n|(?<=[.!؟])\s+/)) {
    if (!/سهل/.test(s) || !/صعب/.test(s)) continue;
    const re = /([0-9٠-٩]+)\s*(?:سؤالاً\s*|سؤالا\s*)?(سهل|متوسط|صعب)/g; let m;
    while ((m = re.exec(s))) {
      n++;
      const v = Number(fromAr(m[1])), d = key[m[2]], have = DATA.diff[d] || 0;
      if (v !== have) add("error", "count-difficulty", where, `says ${v} ${m[2]} questions; js/data has ${have} at difficulty ${d} (${[1, 2, 3].map(x => DATA.diff[x] || 0).join("/")})`, s.trim().slice(0, 160));
    }
  }
  return n;
}
/* the mock exam page against js/app.js (MOCK_SECTION_PLAN, MOCK_SECS, MOCK_SECTIONS) and the
   exam's own shape from facts.json */
/* the official practice tests' quantitative counts (facts.json etec.pdfs[].exam, counted by eye)
   and the exam's length (guidePdf.exam.minutes): «٤٤ سؤالاً كمياً من ٩٦», «١١ من ٢٤ في العلمي»,
   «أول ٦ أسئلة في كل قسم», «ساعتان وخمس دقائق», «١٢٥ دقيقة لـ١٢٠ سؤالاً». A count is held to the
   track named nearest it in its clause (العلمي / النظري); with no track named, to either. */
const MIN_WORDS = { "خمس": 5, "خمسة": 5, "عشر": 10, "عشرة": 10, "ربع": 15, "ثلث": 20, "نصف": 30 };
function checkExamFacts(where, text) {
  const P = (FACTS && FACTS.pdfs || []).filter(p => p.exam && p.track);
  const E = FACTS && FACTS.guidePdf && FACTS.guidePdf.exam || null;
  if (!P.length && !E) return 0;
  const byTrack = Object.fromEntries(P.map(p => [p.track, p.exam]));
  const sn = s => s.replace(/\s+/g, " ").trim().slice(0, 170);
  let n = 0;
  const trackNear = (s, at, len) => {
    /* the track the count belongs to: a track word right after it in its clause («٦ من ٢٤ في
       النظري», «… من ٩٦ في اختبار التخصصات العلمية») first, else the one right before it
       («في العلمي ١١ …»); a «،», «؛», «:», «.» or another number in between ends the clause */
    const T = w => /علمي/.test(w) ? "sci" : "lit";
    const after = s.slice(at + len, at + len + 45), ma = /(العلمي|العلمية|النظري|النظرية)/.exec(after);
    if (ma && !/[،؛:.]/.test(after.slice(0, ma.index)) && !/[0-9٠-٩]/.test(after.slice(0, ma.index))) return T(ma[1]);
    const before = s.slice(Math.max(0, at - 60), at); let mb = null; const re = /(العلمي|العلمية|النظري|النظرية)/g; let x;
    while ((x = re.exec(before))) mb = x;
    if (mb) { const gap = before.slice(mb.index + mb[0].length); if (!/[،؛:.]/.test(gap) && !/[0-9٠-٩]/.test(gap)) return T(mb[1]); }
    return null;
  };
  for (const s of String(text).split(/\n|(?<=[.!؟])\s+/)) {
    if (!/[0-9٠-٩]/.test(s)) continue;
    let m;
    /* «N سؤالاً كمياً من ٩٦» / «N من ٢٤» / «أول N أسئلة …» about the official practice test */
    if (P.length && /(كمي|كميا|كمياً|الكمية)/.test(s) && /(تجريبي|التجريبي|قسم|أقسام|الهيئة|العلمي|النظري|العلمية|النظرية)/.test(s)) {
      const re = /(?:^|[^0-9٠-٩])([0-9٠-٩]+)\s*(?:(?:سؤالاً|سؤالا|أسئلة|اسئلة)\s*)?(?:كمياً|كميا|كمية)?\s*من\s*([0-9٠-٩]+)(?![0-9٠-٩])/g;
      while ((m = re.exec(s))) {
        const k = Number(fromAr(m[1])), of = Number(fromAr(m[2]));
        const field = P.some(p => p.exam.questions === of) ? "quant" : P.some(p => p.exam.perSection === of) ? "quantPerSection" : null;
        if (!field) continue;
        n++;
        const at = m.index + m[0].indexOf(m[1]); const tr = trackNear(s, at, m[0].length - (at - m.index));
        const ok = tr && byTrack[tr] ? byTrack[tr][field] === k : P.some(p => p.exam[field] === k);
        if (!ok) add("error", "fact-practice-count", where, `says ${k} of ${of}${tr ? " for the " + (tr === "sci" ? "scientific" : "theoretical") + " test" : ""}; ETEC's practice test${tr ? "" : "s"} ha${tr ? "s" : "ve"} ${tr && byTrack[tr] ? byTrack[tr][field] : P.map(p => p.exam[field] + " (" + p.track + ")").join(" / ")} quantitative of ${of} (facts.json etec.pdfs, counted by eye)`, sn(s));
      }
      const re2 = /أول\s+([0-9٠-٩]+)\s*(?:سؤالاً|سؤالا|أسئلة|اسئلة)/g;
      while ((m = re2.exec(s))) {
        if (!/كل\s+قسم/.test(s)) continue;
        const k = Number(fromAr(m[1])); n++;
        const tr = trackNear(s, m.index, m[0].length);
        const ok = tr && byTrack[tr] ? byTrack[tr].quantPerSection === k : P.some(p => p.exam.quantPerSection === k);
        if (!ok) add("error", "fact-practice-count", where, `says the first ${k} questions of each section are quantitative; ETEC's practice tests open each section with ${P.map(p => p.exam.quantPerSection + " (" + p.track + ")").join(" / ")}`, sn(s));
      }
    }
    /* the exam's length: «ساعتان وخمس دقائق», «N دقيقة لـ١٢٠ سؤالاً», «١٢٠ سؤالاً في N دقيقة» */
  }
  /* the exam's length, line by line with the two lines before it as context: a table cell
     («زمن الاختبار | ساعتان وخمس دقائق») and a FAQ answer under its question («كم مدة اختبار
     القدرات؟») carry the subject a line up. A line that computes («= ٢٫٥ ساعة أي ساعتان ونصف»,
     «١٢٠ كم في ساعتين») is a worked problem, not the exam. */
  if (E && E.minutes) {
    const L = String(text).split(/\n/);
    L.forEach((line, i) => {
      if (!/ساع(?:تان|تين)|دقيقة/.test(line)) return;
      if (/(=|÷|×|كم\s*\/|كم\s+في|كلم|سرعة|السرعة|ساعة\s*\/|كم\/س)/.test(line)) return;
      const ctx = [L[i - 2] || "", L[i - 1] || "", line].join(" ");
      if (!/(اختبار|الاختبار|القدرات)/.test(ctx)) return;
      let m;
      const re3 = /ساع(?:تان|تين)\s*(?:و\s*([0-9٠-٩]+|خمسة|خمس|عشرة|عشر|ربع|ثلث|نصف)(?:\s*(?:دقائق|دقيقة))?)?/g;
      while ((m = re3.exec(line))) {
        /* «ساعتين» alone in a sentence about something else («قبل الاختبار بساعتين») is not the length */
        if (m[1] == null && !/(مدة|مدته|زمن|زمنه|يستغرق|طول)/.test(ctx)) continue;
        const extra = m[1] == null ? 0 : MIN_WORDS[m[1]] != null ? MIN_WORDS[m[1]] : Number(fromAr(m[1]));
        const min = 120 + extra; n++;
        if (min !== E.minutes) add("error", "fact-exam-minutes", where, `gives the exam ${min} minutes («${m[0].trim()}»); ETEC's guide (p.${E.page || 7}) says ${E.minutes}`, sn(line));
      }
      const re4 = /([0-9٠-٩]+)\s*دقيقة\s*(?:لـ\s*|ل\s*|في\s*)?([0-9٠-٩]+)\s*سؤال|([0-9٠-٩]+)\s*سؤال(?:اً|ا)?\s*في\s*([0-9٠-٩]+)\s*دقيقة/g;
      while ((m = re4.exec(line))) {
        const mins = Number(fromAr(m[1] || m[4])), qs = Number(fromAr(m[2] || m[3]));
        /* the mock, the app or ETEC's practice test, not the exam: «٢٥ دقيقة لـ١٥ سؤالاً» */
        if (EXAM_NOT.test(line) || (!EXAM_CUE.test(line) && EXAM_NOT.test(ctx))) continue;
        if (qs === E.perSection) continue; // a section: the guide gives no minutes a section
        n++;
        if (qs !== E.questions) { if (!EXAM_SEEN.has(where + "|q|" + i + "|" + qs)) { EXAM_SEEN.add(where + "|q|" + i + "|" + qs); add("error", "fact-exam-questions", where, `gives the exam ${qs} questions («${m[0].trim()}»); ETEC's guide (p.${E.page || 7}) says ${E.questions} (${E.sections} sections of ${E.perSection})`, sn(line)); } continue; }
        EXAM_SEEN.add(where + "|m|" + i + "|" + mins);
        if (mins !== E.minutes) add("error", "fact-exam-minutes", where, `gives ${qs} questions ${mins} minutes; ETEC's guide (p.${E.page || 7}) says ${E.questions} in ${E.minutes}`, sn(line));
      }
    });
    n += checkExamShape(where, L, E);
  }
  return n;
}
/* any sentence about the exam itself (اختبار القدرات، الاختبار، GAT), not about قدراتي, its mock,
   its level test, ETEC's practice tests or another exam, is a fact held to facts.json's guide
   (p.7): «N أقسام» in digits or words (قسمان … ثمانية), «N سؤال» as the exam's total, or a
   section's when «كل قسم» is in it (a «كمي / لفظي» count to the shares of 120 the ETEC table
   gives), and «N دقيقة» after مدة / زمن / يستغرق as its length. A FAQ answer line takes its
   subject from the question a line up. Worked problems (= ÷ ×, speeds), study advice («حلّ ٥٠
   سؤالاً قبل الاختبار») and a time per question (unpublished) are not facts about the exam. */
const EXAM_CUE = /(?:اختبار\s+القدرات|الاختبار|اختبارات\s+القدرات|القدرات\s+العامة|\bGAT\b|General\s+Aptitude|\bthe\s+(?:real\s+|official\s+)?(?:exam|test)\b)/iu;
const EXAM_NOT = /(?:قدراتي|المحاكي|محاكي|التجريبي|تجريبي|تجريبية|النموذج|نموذج|تحديد\s+المستوى|اختبار\s+المستوى|في\s+التطبيق|في\s+اللعبة|التحصيلي|تحصيلي|الجامعيين|ستيب|\bSTEP\b|\bmock\b|\bQudrati\b|\bpractice\b|\bplacement\b|\blevel\s+test\b|\bsample\b)/iu;
const EXAM_SKIP = /(?:=|÷|×|سرعة|السرعة|كم\s*\/|كلم|حلّ?\s|حل\s|تدرّ?ب|راجع|ذاكر|يومي|يومياً|كل\s+يوم|أسبوع|قبل\s+الاختبار|بعد\s+الاختبار|حتى\s+الاختبار|باقي|بقي|لكل\s+سؤال|للسؤال|السؤال\s+الواحد|محلول|بأسلوب|بصيغة|بصيغت|بنمط|على\s+نمط|نمط\s+الاختبار|مثل\s+الاختبار|كما\s+(?:هو\s+|هي\s+)?في\s+(?:ال)?اختبار|كالاختبار|على\s+غرار|يحاكي|تحاكي|تشبه|تدريبي|\bper\s+question\b|\ba\s+day\b|\bdaily\b|\bsolved\b|\bexam-style\b)/iu;
const EXAM_SEEN = new Set();
const SECT_WORDS = { "قسمان": 2, "قسمين": 2, "ثلاثة": 3, "أربعة": 4, "اربعة": 4, "خمسة": 5, "ستة": 6, "سبعة": 7, "ثمانية": 8, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8 };
const EXAM_PARTS = /(?:حساب|هندسة|جبر|تفسير|مجال|مجالات|فروع|اللفظي|الكمي|لفظي|كمي|الجزء|جزءان|جزأين|\bverbal\b|\bquantitative\b|\bparts?\b|\bdomains?\b)/iu;
function checkExamShape(where, L, E) {
  let n = 0;
  const sn = s => s.replace(/\s+/g, " ").trim().slice(0, 170);
  const partQ = new Set([...EXAM_Q].filter(x => x !== E.questions && x !== E.perSection));
  L.forEach((line, i) => {
    if (!/[0-9٠-٩]|قسم|أقسام|اقسام|sections?/i.test(line)) return;
    const prev = (L[i - 1] || "") + " " + (L[i - 2] || "");
    for (const s of line.split(/(?<=[.!؟?])\s+/)) {
      const own = EXAM_CUE.test(s);
      if (!own && !EXAM_CUE.test(prev)) continue;
      if (EXAM_NOT.test(s) || (!own && EXAM_NOT.test(prev))) continue;
      if (EXAM_SKIP.test(s)) continue;
      let m;
      /* sections */
      const rs = /(?:(?<![\p{L}0-9٠-٩])([0-9٠-٩]+)|(ثلاثة|أربعة|اربعة|خمسة|ستة|سبعة|ثمانية))\s*(?:أقسام|اقسام)(?![\p{L}])|(?<![\p{L}])(قسمان|قسمين)(?![\p{L}])|\b(\d+|two|three|four|five|six|seven|eight)\s+sections\b/giu;
      while ((m = rs.exec(s))) {
        const k = m[1] ? Number(fromAr(m[1])) : SECT_WORDS[(m[2] || m[3] || m[4] || "").toLowerCase()] != null ? SECT_WORDS[(m[2] || m[3] || m[4]).toLowerCase()] : Number(m[4]);
        if (!k) continue;
        /* «قسمين: لفظي وكمي», «الجزء الكمي أربعة مجالات»: the parts or the domains, not the sections */
        if (k !== E.sections && EXAM_PARTS.test(s)) continue;
        n++;
        if (k !== E.sections) add("error", "fact-exam-sections", where, `gives the exam ${k} sections («${m[0].trim()}»); ETEC's guide (p.${E.page || 7}) says ${E.sections} sections of ${E.perSection} questions`, sn(s));
      }
      /* questions: the total, a section's, or a part's */
      const rq = /(?<![\p{L}0-9٠-٩.٫,])([0-9٠-٩]+)\s*(?:سؤالاً|سؤالا|سؤال|أسئلة|اسئلة)(?![\p{L}])|\b(\d+)\s+(?:[a-z-]+\s+){0,2}questions\b/giu;
      while ((m = rq.exec(s))) {
        const k = Number(fromAr(m[1] || m[2]));
        if (EXAM_SEEN.has(where + "|q|" + i + "|" + k)) continue;
        /* the app's own count in the exam's format («٢٥٥ سؤالاً بصيغتي الاختبار») is the count
           checks' business, not a fact about the exam */
        if (k !== E.questions && k !== E.perSection && ALLOWED && ALLOWED.question.has(k)) continue;
        /* «في كل قسم ٢٤ سؤالاً، أي ١٢٠ سؤالاً»: the section cue belongs to the number in its own
           clause (since the last «،» or number before it), or right after its noun */
        const clause = s.slice(0, m.index).split(/[،,؛;:.]|[0-9٠-٩]+/).pop(), tail = s.slice(m.index + m[0].length, m.index + m[0].length + 24);
        const perSec = /(?:كل\s+قسم|القسم\s+الواحد|لكل\s+قسم|في\s+القسم|\b(?:per|each|a)\s+section\b|\bsections?\s+of\s*$|أقسام\s*(?:من|ب)\s*$)/iu.test(clause) || /^\s*(?:في\s+|لـ?\s*)?(?:كل\s+قسم|القسم\s+الواحد)|^\s*(?:per|each|a|in\s+each)\s+section\b/iu.test(tail);
        const part = /(?:كمي|كمية|كمياً|لفظي|لفظية|لفظياً|\bquantitative\b|\bverbal\b)/iu.test(s);
        if (!perSec && k < 10) continue; // «سؤالان في المقارنة»: a count of a kind, not of the exam
        n++; EXAM_SEEN.add(where + "|q|" + i + "|" + k);
        const ok = perSec ? k === E.perSection || (part && k <= E.perSection) : k === E.questions || (part && partQ.has(k));
        if (!ok) add("error", "fact-exam-questions", where, `gives ${perSec ? "a section of the exam" : part ? "a part of the exam" : "the exam"} ${k} questions («${m[0].trim()}»); ETEC's guide (p.${E.page || 7}) says ${E.questions} in all, ${E.perSection} a section${part ? ", and the ETEC table's shares make " + [...partQ].sort((a, b) => a - b).join(" / ") : ""}`, sn(s));
      }
      /* length in minutes after مدة / زمن / يستغرق («مدة اختبار القدرات ١٥٠ دقيقة») */
      const rm = /(?<![\p{L}0-9٠-٩.٫,])([0-9٠-٩]+)\s*(?:دقيقة|دقائق)(?![\p{L}])|\b(\d+)\s+minutes\b/giu;
      while ((m = rm.exec(s))) {
        const before = s.slice(0, m.index);
        if (!/(?:مدة|مدته|زمن|زمنه|يستغرق|تستغرق|طول|\blasts?\b|\blong\b|\blength\b|\bduration\b|\btakes?\b|\btime\b)/iu.test(before + " " + (own ? "" : prev))) continue;
        if (/(?:ساع[ةه]|ساعتان|ساعتين|ساعات|hours?)\s*(?:و|and)?\s*$/iu.test(before)) continue; // «ساعتان و٥ دقائق»: re3 reads the whole length
        if (/(?:كل\s+قسم|لكل\s+قسم|القسم|\b(?:per|each|a)\s+section\b)/iu.test(s)) continue; // a section: the guide gives none
        const k = Number(fromAr(m[1] || m[2]));
        if (EXAM_SEEN.has(where + "|m|" + i + "|" + k)) continue;
        n++; EXAM_SEEN.add(where + "|m|" + i + "|" + k);
        if (k !== E.minutes) add("error", "fact-exam-minutes", where, `gives the exam ${k} minutes («${m[0].trim()}»); ETEC's guide (p.${E.page || 7}) says ${E.minutes} (ساعتان وخمس دقائق)`, sn(s));
      }
    }
  });
  return n;
}
function checkMock(where, text, isMockPage) {
  if (!DATA || !DATA.mock) return;
  const M = DATA.mock, E = FACTS && FACTS.guidePdf && FACTS.guidePdf.exam || {};
  const per = new Set([M.sci, M.lit, E.perSection].filter(Boolean));
  const tot = new Set([M.sci * M.sections, M.lit * M.sections, E.questions, DATA.questions].filter(Boolean));
  const mins = new Set([M.minutes, E.minutes].filter(Boolean));
  const sn = s => s.replace(/\s+/g, " ").trim().slice(0, 160);
  for (const s of text.split(/\n|(?<=[.!؟])\s+/)) {
    if (!/قسم/.test(s)) continue;
    let m; const r1 = /كل\s+قسم\s+(?:عنده\s+|فيه\s+|من\s+)?([0-9٠-٩]+)\s*سؤال/g;
    while ((m = r1.exec(s))) { const n = Number(fromAr(m[1])); if (!per.has(n)) add("error", "mock-count", where, `says ${n} questions a section; js/app.js MOCK_SECTION_PLAN gives ${M.sci} (scientific) / ${M.lit} (theoretical), the exam ${E.perSection || "?"}`, sn(s)); }
    const r2 = /أي\s+([0-9٠-٩]+)\s*سؤال/g;
    while ((m = r2.exec(s))) { const n = Number(fromAr(m[1])); if (!tot.has(n)) add("error", "mock-count", where, `says ${n} questions in all; the mock has ${M.sci * M.sections} / ${M.lit * M.sections}, the exam ${E.questions || "?"}`, sn(s)); }
    /* a sentence about the real exam (the guide's «١٢٥ دقيقة … ويخبرك مشرف القاعة بعدد الأقسام وزمن
       كل قسم») is not about our mock, unless it names the mock too */
    const aboutExam = /(الحقيقي|الرسمي|الورقي|الرقمي|الفعلي|الدليل|المشرف|مشرف|القاعة|الهيئة)/.test(s) && !/(تجريبي|قدراتي|المحاكي|التجريبي)/.test(s);
    if (/(مؤق|لكل قسم|كل قسم)/.test(s) && !aboutExam) { const r3 = /([0-9٠-٩]+)\s*دقيق/g; while ((m = r3.exec(s))) { const n = Number(fromAr(m[1])); if (!mins.has(n)) add("error", "mock-minutes", where, `says ${n} minutes; js/app.js MOCK_SECS is ${M.minutes} minutes a section`, sn(s)); } }
    const r4 = /(قسمان|قسمين|ثلاثة أقسام|أربعة أقسام)/.exec(s);
    if (r4 && /(تجريبي|قدراتي|المحاكي)/.test(s) && !/(الحقيقي|الرسمي|الفعلي)/.test(s) && !(/(الهيئة|هيئة تقويم|ETEC|قياس)/.test(s) && !/(قدراتي|المحاكي|في التطبيق|في اللعبة)/.test(s))) { const n = /ثلاثة/.test(r4[1]) ? 3 : /أربعة/.test(r4[1]) ? 4 : 2; if (n !== M.sections) add("error", "mock-sections", where, `says the mock has ${n} sections; js/app.js MOCK_SECTIONS is ${M.sections}`, sn(s)); }
  }
  if (isMockPage) {
    const t = fromAr(text);
    for (const [need, why] of [[M.sci + " سؤال", "questions a section (scientific)"], [M.lit + " سؤال", "questions a section (theoretical)"], [M.minutes + " دقيق", "minutes a section"]]) if (!t.includes(need)) add("warn", "mock-missing", where, `the mock page never states «${toAr(need)}» (${why}, from js/app.js)`);
  }
}
/* FAQPage text must equal the visible text it marks up, not just resemble it. The visible pair
   is found in any of the three layouts the site uses: <details><summary>Q</summary>A</details>,
   <dt>Q</dt><dd>A</dd>, or a heading Q followed by its section. A JSON-LD question with no such
   visible pair is left to the looser visible() check above. */
/* share of a's words (with repeats) that appear in b, order ignored */
function tokenOverlap(a, b) {
  const toks = s => String(s).match(/[\p{L}\p{N}]+/gu) || [];
  const ta = toks(a); if (!ta.length) return 1;
  const bag = new Map(); for (const t of toks(b)) bag.set(t, (bag.get(t) || 0) + 1);
  let hit = 0; for (const t of ta) { const c = bag.get(t) || 0; if (c) { hit++; bag.set(t, c - 1); } }
  return hit / ta.length;
}
function checkFaqStrict(pg) {
  const pairs = new Map();
  for (const d of byTag(pg.root, "details")) { const sm = byTag(d, "summary")[0]; if (!sm) continue; const q = norm(textOf(sm)), full = norm(textOf(d)); pairs.set(q, (full.startsWith(q) ? full.slice(q.length) : full.replace(q, "")).trim()); }
  for (const dt of byTag(pg.root, "dt")) { const sib = dt.parent.children.filter(c => c.tag); const i = sib.indexOf(dt); const dd = sib[i + 1]; if (dd && dd.tag === "dd") pairs.set(norm(textOf(dt)), norm(textOf(dd))); }
  for (const h of all(pg.root, n => /^h[2-6]$/.test(n.tag))) {
    const lvl = Number(h.tag[1]); const sib = h.parent.children.filter(c => c.tag); const out = [];
    for (let i = sib.indexOf(h) + 1; i < sib.length; i++) { const s = sib[i]; if (/^h[1-6]$/.test(s.tag) && Number(s.tag[1]) <= lvl) break; out.push(textOf(s)); }
    const q = norm(textOf(h)); if (!pairs.has(q)) pairs.set(q, norm(out.join(" ")));
  }
  let n = 0;
  /* the visible questions: <summary> and <dt> always; a heading only when it is worded as a
     question (ends in «؟» / «?»), so a JSON-LD question that matches none of them is named with
     the nearest one */
  const asked = [...byTag(pg.root, "summary"), ...byTag(pg.root, "dt"), ...all(pg.root, n => /^h[2-6]$/.test(n.tag) && /[؟?]\s*$/.test(textOf(n)))].map(e => norm(textOf(e))).filter(Boolean);
  const sigKeys = new Map([...pairs.keys()].map(k => [sig(k), k]));
  const faqAsked = (byTag(pg.root, "summary").length ? byTag(pg.root, "summary") : byTag(pg.root, "dt")).map(e => norm(textOf(e)));
  const ldQs = pg.meta.ld.flatMap(ldNodes).filter(x => typesOf(x).includes("FAQPage")).flatMap(x => [].concat(x.mainEntity || [])).map(q => q && q.name).filter(Boolean);
  for (const node of pg.meta.ld.flatMap(ldNodes).filter(x => typesOf(x).includes("FAQPage"))) {
    for (const q of [].concat(node.mainEntity || [])) {
      if (!q || !q.name) continue;
      let qn = norm(q.name);
      if (!pairs.has(qn) && sigKeys.has(sig(q.name))) qn = sigKeys.get(sig(q.name));
      if (!pairs.has(qn)) {
        if (asked.length) {
          /* the visible question no JSON-LD question names is the likeliest one it was edited into */
          const named = new Set(ldQs.flatMap(x => [norm(x), sig(x)]));
          const free = asked.filter(v => !named.has(v) && !named.has(sig(v)));
          let best = (free.length ? free : asked).map(v => [v, (tokenOverlap(qn, v) + tokenOverlap(v, qn)) / 2]).sort((a, b) => b[1] - a[1])[0], how = "the nearest visible one";
          /* reworded past recognition: the <summary> / <dt> standing where it stood in the list */
          const inPlace = faqAsked[ldQs.indexOf(q.name)];
          if (best[1] < 0.5 && inPlace && !named.has(inPlace) && !named.has(sig(inPlace))) { best = [inPlace, (tokenOverlap(qn, inPlace) + tokenOverlap(inPlace, qn)) / 2]; how = "the visible question in its place"; }
          add("error", "faq-question-unmatched", pg.url, `FAQ question in JSON-LD matches no visible question on the page (no <summary>, <dt> or question heading with its text); ${how} is «${best[0].slice(0, 70)}» (${Math.round(best[1] * 100)}% of words shared) — the markup and the page drifted apart, and answer engines quote the markup`, "JSON-LD «" + q.name.slice(0, 120) + "»");
        }
        continue;
      }
      const a = norm(asText([].concat(q.acceptedAnswer || [])[0])), vis = pairs.get(qn); n++;
      if (vis !== a && !vis.startsWith(a)) {
        let i = 0; while (i < a.length && a[i] === vis[i]) i++;
        /* graded: markup that says something the page does not is spam to Google and is quoted
           word for word by answer engines; a comma or a space of drift is not */
        const ov = tokenOverlap(a, vis), drift = sig(vis) === sig(a) || sig(vis).startsWith(sig(a));
        /* a number the markup states that the visible answer does not («= ٦٠» against «= ٥٠») is a
           wrong answer in the markup, however many words agree: an error */
        const nums = s => (fromAr(norm(s)).replace(/٫/g, ".").match(/\d+(?:\.\d+)?/g) || []);
        const visNums = new Map(); for (const x of nums(vis)) visNums.set(x, (visNums.get(x) || 0) + 1);
        const extraNums = []; for (const x of nums(a)) { const c = visNums.get(x) || 0; if (c) visNums.set(x, c - 1); else extraNums.push(toAr(x).replace(".", "٫")); }
        const lvl = drift ? "info" : extraNums.length || ov < 0.9 || i < 20 ? "error" : "warn";
        if (extraNums.length) add("error", "faq-number", pg.url, `FAQ answer in JSON-LD under «${q.name.slice(0, 50)}» states ${extraNums.length} number(s) the visible answer does not: ${extraNums.slice(0, 6).join("، ")}`, "JSON-LD «" + a.slice(0, 150) + "»");
        add(lvl, "faq-mismatch", pg.url, `FAQ answer in JSON-LD differs from the visible answer under «${q.name.slice(0, 50)}» at character ${i}; ${Math.round(ov * 100)}% of its words are in the visible answer${drift ? " (punctuation or spacing only)" : lvl === "error" ? " — Google treats markup that does not match the page as spam" : ""}`, "JSON-LD «…" + a.slice(Math.max(0, i - 30), i + 40) + "…» | page «…" + vis.slice(Math.max(0, i - 30), i + 40) + "…»");
      }
    }
  }
  return n;
}
/* text compared with its signs kept: «(س − ١)» and «(س + ١)» are different rules, «٣٠٠» and
   «٣٥٠» different questions. Spacing, tashkeel, punctuation and quote marks do not count;
   a stacked fraction's «٣ على ٨» reads «٣/٨» (norm). */
const CIRCLED = s => String(s).replace(/[①-⑳]/g, c => toAr(c.charCodeAt(0) - 0x245f) + ")").replace(/[❶-❿]/g, c => toAr(c.charCodeAt(0) - 0x2775) + ")");
const sig = s => fromAr(norm(CIRCLED(s))).replace(/[−–—‐‑]/g, "-").replace(/٫/g, ".").replace(/٪/g, "%").replace(/،/g, ",").replace(/[xX*✕]/g, "×").replace(/[^\p{L}\p{N}+\-×÷/=≈()%.√^<>≤≥²³]/gu, "");
/* the signs and numbers of a line, its words dropped: a formula whose words drift is a warning,
   one whose signs or numbers differ is a wrong formula (an error) */
const numSig = s => sig(s).replace(/\p{L}+/gu, "");
const numsDiffer = (got, wants) => !wants.some(f => { const a = numSig(got), b = numSig(f); return a === b || (b.length >= 3 && a.includes(b)); });
const LETTERS = { "أ": 0, "ا": 0, "ب": 1, "ج": 2, "جـ": 2, "د": 3 };
/* ---------- worked examples and rule rows ----------
   evalArith: the value of a plain expression of numbers (Eastern or Latin digits, «٫» decimal,
   + − × ÷ / ^ and brackets), or null when it is anything else. */
function evalArith(src) {
  const s0 = fromAr(String(src)).replace(/٫/g, ".").replace(/٬/g, "").replace(/[−–]/g, "-").replace(/×/g, "*").replace(/÷/g, "/");
  if (/\d\s+[\d(]|\)\s+\d/.test(s0)) return null; // two numbers with only a space between: «٢ ١/٢», a list
  const s = s0.replace(/\s+/g, "");
  if (!/^[0-9.+\-*/^()]+$/.test(s)) return null;
  let i = 0;
  const peek = () => s[i];
  const num = () => { const m = /^\d+(\.\d+)?/.exec(s.slice(i)); if (!m) return null; i += m[0].length; return Number(m[0]); };
  const atom = () => {
    if (peek() === "(") { i++; const v = expr(); if (v == null || peek() !== ")") return null; i++; return v; }
    return num();
  };
  const unary = () => { if (peek() === "-") { i++; const v = unary(); return v == null ? null : -v; } return atom(); };
  const power = () => { const b = unary(); if (b == null) return null; if (peek() === "^") { i++; const e = power(); return e == null ? null : Math.pow(b, e); } return b; };
  const term = () => {
    let v = power(); if (v == null) return null;
    for (;;) {
      const c = peek();
      if (c === "*" || c === "/") { i++; const r = power(); if (r == null) return null; v = c === "*" ? v * r : v / r; }
      else if (c === "(") { const r = power(); if (r == null) return null; v *= r; } // «٣(٢ + ١)», «(٤)(٣)»
      else return v;
    }
  };
  const expr = () => {
    let v = term(); if (v == null) return null;
    while (peek() === "+" || peek() === "-") { const c = s[i++]; const r = term(); if (r == null) return null; v = c === "+" ? v + r : v - r; }
    return v;
  };
  const v = expr();
  return v != null && i === s.length && Number.isFinite(v) ? v : null;
}
const ARITH_TAIL = /[0-9٠-٩٫٬.+\-−×÷/^()\s]+$/, ARITH_HEAD = /^[0-9٠-٩٫٬.+\-−×÷/^()\s]+/;
const balanced = s => { let d = 0; for (const c of s) { if (c === "(") d++; else if (c === ")" && --d < 0) return false; } return d === 0; };
const decimals = s => { const m = /[٫.](\d+|[٠-٩]+)/.exec(s); return m ? m[1].length : 0; };
/* every «a = b» in a line whose two sides are plain numbers, checked. A side counts only when it
   is the whole expression: the left one opens the line or follows «:», «←», «⇐», «،», «؛» or «(»
   (after «من», «√», a letter or «٪» it is part of something else), the right one ends the line,
   or a word of two letters or more (a unit: «مصافحات»), or «،» «.» «؛»; a single letter after
   it («ط», «س») multiplies it, so it is skipped. Returns the equations that do not hold. */
/* words that hand over to a calculation («ثم ٥٦ ÷ ٢ = ٢٨», «أي ٣ × ٤ = ١٢»); «من», «√», «نصف» do not */
const ARITH_LEAD = /(^|\s)(ثم|أي|إذن|اذن|يعني|يكون|فيكون|هو|هي|وهو|وهي|الناتج|والناتج|و|ف|حيث|بالتالي|وبالتالي)$/;
function arithFails(line) {
  /* a fraction binds tighter than «÷» and «×»: «١ ÷ ٤ على ٣» (a stacked fraction read aloud) and
     «١ ÷ ٤/٣» are one over four thirds. Only a number over a number is read; anything else over
     «على» stays words, and the equation around it is skipped. */
  /* a quoted statement («عدد الأعداد بين ١٠ و ٢٠ = ١٠» خطأ) is often the trap itself: skipped */
  const t = String(line).replace(/«[^«»]*»/g, " … ").replace(/°/g, "")
    .replace(/([0-9٠-٩][0-9٠-٩٫]*|\([^()]*\))\s*(?:على|\/)\s*([0-9٠-٩][0-9٠-٩٫]*|\([^()]*\))(?![0-9٠-٩٫^])/g, "($1/$2)");
  const parts = t.split("="); const bad = []; let n = 0;
  for (let k = 0; k + 1 < parts.length; k++) {
    const left = parts[k], right = parts[k + 1];
    const lm = ARITH_TAIL.exec(left); const rm = ARITH_HEAD.exec(right);
    if (!lm || !rm) continue;
    /* a full stop that ends a sentence is not a decimal point */
    const lTrim = lm[0].replace(/^[\s.]+/, ""), rTrim = rm[0].replace(/[\s.]+$/, "");
    const L = lTrim.trim(), R = rTrim.trim();
    if (!/[0-9٠-٩]/.test(L) || !/[0-9٠-٩]/.test(R)) continue;
    if (!/^[0-9٠-٩(]/.test(L) || !/[0-9٠-٩)]$/.test(R) || !/[0-9٠-٩)]$/.test(L) || !/^[0-9٠-٩(]/.test(R)) continue;
    if (!balanced(L) || !balanced(R)) continue;
    const before = left.slice(0, left.length - lTrim.length).replace(/\s+$/, "");
    if (before && !/(^|[^0-9٠-٩]):$|[←⇐،؛(.]$/.test(before) && !ARITH_LEAD.test(before)) continue;
    const after = right.slice(rTrim.length).replace(/^\s+/, "");
    if (/^(و)?(ال)?باقي/.test(after)) continue; // «٧٥ ÷ ٢٤ = ٣ والباقي ٣»: a quotient, not a value
    if (/^على/.test(after) || /على$/.test(before)) continue; // a fraction the reading above could not take apart
    if (!/[+\-−×÷/^]/.test(L + R)) continue; // «… ثم ١ = ٠٫٠٠١»: two bare numbers say nothing to compute
    if (after && !(/^\p{L}{2,}/u.test(after) || /^[،.؛!؟»]/.test(after) || /^:(?!\s*[0-9٠-٩])/.test(after))) continue;
    const a = evalArith(L), b = evalArith(R);
    if (a == null || b == null) continue;
    n++;
    const d = Math.max(decimals(L), decimals(R));
    const tol = d ? 0.5 * Math.pow(10, -d) * 1.0001 : 1e-9 * Math.max(1, Math.abs(a));
    if (Math.abs(a - b) > tol) bad.push({ L, R, a, b });
  }
  return { n, bad };
}
/* an element's text for arithmetic: a stacked fraction (.fr) reads «((top)/(bottom))» whatever its
   top holds («٣×٥+٤» over «٥»), the screen-reader words and brackets (.fr-sr) are dropped, an
   exponent's sign (.fr-sr.pw «^») is kept */
function mathText(node) {
  const cl = n => " " + ((n.attrs && n.attrs.class) || "") + " ";
  const rec = n => {
    if (n.text != null) return n.text;
    if (SKIP_TEXT.has(n.tag) || isHiddenEl(n)) return "";
    const c = cl(n);
    if (/ fr-sr /.test(c) && !/ pw /.test(c)) return "";
    if (/ fr /.test(c)) {
      const top = n.children.find(x => / fr-n /.test(cl(x))), bot = n.children.find(x => / fr-d /.test(cl(x)));
      if (top && bot) return "((" + rec(top) + ")/(" + rec(bot) + "))";
    }
    const inner = n.children.map(rec).join("");
    return BLOCK.has(n.tag) ? " " + inner + " " : inner;
  };
  return rec(node).replace(/[\s ]+/g, " ").trim();
}
const fmtNum = x =>toAr(Math.round(x * 1e6) / 1e6).replace(/\./g, "٫");
/* the rule a link names by its anchor («key-laws.html#handshakes»), from the generator's slugs */
function ruleAt(href, base) {
  if (!RULE_AT || !DATA) return null;
  let u; try { u = new URL(href, base); } catch (e) { return null; }
  if (!u.hash || !isSite(u.href)) return null;
  let h = u.hash; try { h = decodeURIComponent(h); } catch (e) { }
  const at = RULE_AT.get(u.pathname + h); if (!at) return null;
  const r = DATA.rules.find(x => x.lesson === at.lesson && x.n === at.n);
  return r ? { ...at, rule: r } : null;
}
/* a formula as a page or a table cell may show it: the data's, or the page's corrected one
   (DATA_FIX), with or without the inline example the generator cuts off («… مثال: …») */
const noInlineEx = f => String(f).replace(/\s*[،,]?\s*مثال:[\s\S]*$/, "").trim();
const formulaForms = r => [...new Set([r.pFormula, r.formula].filter(Boolean).flatMap(f => [f, noInlineEx(f)]))];
const formulaOk = (got, r) => { const g = sig(got); return formulaForms(r).some(f => { const x = sig(f); return x && (g === x || (x.length >= 6 && g.includes(x))); }); };
/* a rule's worked example as a page prints it: teach.js's card example (through the generator's
   corrections), or the generator's own (EX) for a rule the data gives none */
const inlineEx = f => { const m = /مثال\s*:\s*([\s\S]+)$/.exec(String(f || "")); return m ? m[1].trim() : null; };
const exampleForms = (r, at) => { const k = r.lesson + ":" + r.n; return [...new Set([DATA.pExample && DATA.pExample[k], DATA.example && DATA.example[k], at && at.ex, at && at.ex && pageView(at.ex), inlineEx(r.pFormula), inlineEx(r.formula), r.when && pageView(String(r.when).replace(/^\s*مثال\s*:\s*/, ""))].filter(Boolean))]; };
const exampleOk = (got, r, at) => { const g = sig(got); return exampleForms(r, at).some(e => sig(e) === g); };
/* bank questions shown on a page (any element with id="q-<bank id>"): stem, comparison
   values, choices, the answer's letter and text, and the solution's lines against js/data */
function checkBankCards(pg) {
  if (!DATA || !DATA.qById) return 0;
  let n = 0;
  for (const card of all(pg.root, x => x.attrs && /^q-/.test(x.attrs.id || "") && DATA.qById[x.attrs.id.slice(2)])) {
    const q = DATA.qById[card.attrs.id.slice(2)]; n++;
    const id = "#" + card.attrs.id, cls = x => (x.attrs.class || "").split(/\s+/);
    const bad = (what, got, want) => add("error", "question-stale", pg.url + id, `bank question ${q.id} (${q.lesson}): the page's ${what} differs from js/data`, `page «${String(got).slice(0, 110)}» | data «${String(want).slice(0, 110)}»`);
    const stemEl = all(card, x => cls(x).some(c => /^(sq-)?stem$/.test(c)))[0];
    /* the page may print the data through the generator's undot() (pageView): either is current */
    const eqData = (got, want) => sig(got) === sig(want) || sig(got) === sig(pageView(want));
    if (stemEl && !eqData(textOf(stemEl), q.stem)) bad("stem", textOf(stemEl), q.stem);
    const cardSig = sig(textOf(card));
    if (q.format === "comparison") {
      /* each value in its own cell (.cmp / .sq-vals: a label «القيمة الأولى» and the value), compared
         exactly and in order; the heading that repeats both («قارن بين … و…») is checked on its own,
         so a right heading never hides a wrong cell, and a short value («٥») never passes by
         appearing somewhere else on the card */
      const box = all(card, x => cls(x).some(c => /^(cmp|sq-vals|vals)$/.test(c)))[0];
      const want2 = [q.value1, q.value2];
      if (box) {
        const cellsV = box.children.filter(c => c.tag).map(c => textOf(c).replace(/^\s*القيمة\s+(الأولى|الاولى|الثانية)\s*:?\s*/, ""));
        if (cellsV.length !== 2) bad("comparison values", cellsV.join(" | ") || "(no value cells)", want2.join(" | "));
        else want2.forEach((v, i) => { if (v && !eqData(cellsV[i], v)) bad(`comparison value ${i + 1} (${i ? "القيمة الثانية" : "القيمة الأولى"})`, cellsV[i], v); });
      } else {
        const noHead = sig(textOf(card, { skip: x => /^h[1-6]$/.test(x.tag) }));
        for (const v of want2) if (v && !noHead.includes(sig(v)) && !noHead.includes(sig(pageView(v)))) bad("comparison values", "(not on the card, outside its heading)", v);
      }
      for (const h of all(card, x => /^h[2-6]$/.test(x.tag))) {
        const ht = textOf(h, { skip: x => cls(x).includes("qfrom") });
        /* only a heading that repeats the values («قارن بين ١٢٥ × ٧٦ و١٢٦ × ٧٥»), not «قارن بين القيمتين» */
        if (!/قارن/.test(ht) || /قارن\s+بين\s+القيمتين\s*[:.؟]?\s*$/.test(ht)) continue;
        /* the data's own stem as the heading («قارن بين (السلعتان لهما نفس السعر):», profit-09):
           a condition, the values are in their cells */
        { const bare = sig(ht.replace(/^\s*السؤال\s*[0-9٠-٩]+\s*[:：]\s*/, "")); if (q.stem && (bare === sig(q.stem) || bare === sig(pageView(q.stem)))) continue; }
        const hs = sig(ht);
        for (const v of want2) if (v && sig(v).length >= 1 && !hs.includes(sig(v)) && !hs.includes(sig(pageView(v)))) bad("heading's comparison value", ht, v);
      }
    }
    const want = q.format === "comparison" ? (DATA.cmpChoices || []) : (q.choices || []);
    const ol = all(card, x => x.tag === "ol" && cls(x).some(c => /^(sq-ch|choices)$/.test(c)))[0];
    if (ol && want.length) {
      const got = byTag(ol, "li").map(li => textOf(li, { skip: x => cls(x).includes("l") }));
      if (got.length !== want.length || got.some((g, i) => !eqData(g, want[i]))) bad("choices", got.join(" | "), want.join(" | "));
    }
    /* the innermost element that opens with «الإجابة:» (its wrapper opens with it too) */
    const ansEl = all(card, x => /^(p|div|span|li)$/.test(x.tag) && /^\s*الإجابة(\s*الصحيحة)?\s*:/.test(textOf(x))).sort((a, b) => textOf(a).length - textOf(b).length)[0];
    if (ansEl) {
      const m = /^\s*الإجابة(?:\s*الصحيحة)?\s*:\s*\(?\s*(جـ|أ|ا|ب|ج|د)\s*\)?\s*(.*)$/.exec(textOf(ansEl));
      if (!m) bad("answer line", textOf(ansEl), "(letter) " + want[q.answer]);
      else {
        if (LETTERS[m[1]] !== q.answer) bad("answer letter", m[1] + ") " + m[2], "أبجد"[q.answer] + ") " + want[q.answer]);
        else if (want[q.answer] && !eqData(m[2], want[q.answer])) bad("answer text", m[2], want[q.answer]);
      }
    } else add("warn", "question-no-answer", pg.url + id, `bank question ${q.id} is shown without a «الإجابة:» line the audit can read`);
    const lines = String(q.solution || "").split(/\n/).filter(l => sig(l).length >= 6);
    const missing = lines.filter(l => !cardSig.includes(sig(l)) && !cardSig.includes(sig(pageView(l))));
    if (missing.length) {
      /* a missing line whose words are on one of the card's lines with other signs or numbers is a
         wrong solution (an error: «أول عدد زوجي هو ١٢» for the data's «… هو ١٠»); a line that is
         not there at all, or differs only in wording, is drift (a warning) */
      const cardLines = all(card, x => /^(p|li|dd|div)$/.test(x.tag) && !all(x, y => y !== x && /^(p|li|dd|div)$/.test(y.tag)).length).map(x => textOf(x)).filter(t => sig(t).length >= 4);
      const words = s => (norm(s).match(/\p{L}{2,}/gu) || []).join(" ");
      const wrong = [];
      for (const l of missing) {
        const lw = words(pageView(l)) || words(l); if (!lw) continue;
        const best = cardLines.map(c => ({ c, o: Math.min(tokenOverlap(lw, words(c)), tokenOverlap(words(c), lw)) })).sort((a, b) => b.o - a.o)[0];
        if (best && best.o >= 0.75 && numsDiffer(best.c, [l, pageView(l)])) wrong.push(`page «${best.c.slice(0, 90)}» | data «${l.slice(0, 90)}»`);
      }
      if (wrong.length) add("error", "question-solution-stale", pg.url + id, `bank question ${q.id}: ${wrong.length} solution line(s) on the card have the data's words with other signs or numbers (a wrong working)`, wrong.slice(0, 2).join(" ; "));
      else add("warn", "question-solution-stale", pg.url + id, `bank question ${q.id}: ${missing.length} of ${lines.length} solution line(s) in js/data are not on the card (wording; no line with other numbers found)`, missing[0]);
    }
  }
  return n;
}
/* a Quiz Question in JSON-LD, matched to the bank by its text (the stem, and for a comparison
   both values): acceptedAnswer and suggestedAnswer must be the bank's choices at their
   positions, the accepted one the bank's answer */
function checkQuizQuestion(where, q, resolve) {
  if (!DATA || !DATA.qById) return;
  const t = sig(asText(q.text) || q.name || ""); if (!t) return;
  const cands = Object.values(DATA.qById).filter(b => sig(b.stem).length >= 6 && t.includes(sig(b.stem)) && (b.format !== "comparison" || [b.value1, b.value2].every(v => !v || t.includes(sig(v)))));
  const b = cands.sort((x, y) => sig(y.stem).length + (y.value1 ? 50 : 0) - sig(x.stem).length - (x.value1 ? 50 : 0))[0];
  if (!b) { add("info", "quiz-unmatched", where, "Quiz Question matches no bank question in js/data (its answers cannot be checked)", asText(q.text).slice(0, 100)); return; }
  const want = b.format === "comparison" ? (DATA.cmpChoices || []) : (b.choices || []);
  const bad = (what, got, w) => add("error", "question-stale", where, `Quiz Question for bank question ${b.id} (${b.lesson}): ${what} differs from js/data`, `JSON-LD «${String(got).slice(0, 100)}» | data «${String(w).slice(0, 100)}»`);
  for (const a of [].concat(q.acceptedAnswer || []).map(resolve)) {
    if (!a) continue;
    if (sig(asText(a)) !== sig(want[b.answer] || "")) bad("acceptedAnswer text", asText(a), want[b.answer]);
    if (a.position != null && Number(a.position) !== b.answer) bad("acceptedAnswer position", a.position, b.answer);
  }
  for (const a of [].concat(q.suggestedAnswer || []).map(resolve)) {
    if (!a) continue;
    if (sig(asText(a)) === sig(want[b.answer] || "")) bad("a suggestedAnswer (it is the correct answer)", asText(a), "a wrong choice");
    else if (a.position != null && sig(asText(a)) !== sig(want[Number(a.position)] || "")) bad(`suggestedAnswer at position ${a.position}`, asText(a), want[Number(a.position)]);
    else if (a.position == null && !want.some(w => sig(w) === sig(asText(a)))) bad("a suggestedAnswer", asText(a), want.join(" | "));
  }
}
/* «تجد ثمانية منها محلولة في <a>…</a>»: a count of solved examples one page states about
   another must equal the bank question cards on that page (in the linked #section when there
   is one; only the comparison cards when the paragraph is about comparisons) */
const CNT_WORDS = { ...AR_UNITS, "عشرة": 10, "عشر": 10, "سؤالان": 2, "سؤالين": 2, "مثالان": 2, "مثالين": 2, "سؤال واحد": 1, "مثال واحد": 1 };
const CNT_RE = new RegExp("(?<![\\p{L}])(?:و|ل|ب|ول|وب|ف)?(" + Object.keys(CNT_WORDS).sort((a, b) => b.length - a.length).join("|") + ")(?![\\p{L}])|([0-9٠-٩]+)", "gu");
const SOLVED_CUE = /(محلول|أمثلة|امثلة|مع (طريقة )?الحل|بحلول|بحلها)/;
function checkCrossCounts(pg) {
  if (!DATA || !DATA.qById) return 0;
  let n = 0;
  for (const blk of all(pg.root, x => /^(p|li|dd|td)$/.test(x.tag) && byTag(x, "a").length)) {
    const full = textOf(blk); if (!SOLVED_CUE.test(full)) continue;
    const cmp = /مقارن/.test(full);
    /* the text from the end of the previous link to the end of this one */
    const segs = []; let buf = "";
    (function rec(x) { if (x.text != null) { buf += x.text; return; } if (SKIP_TEXT.has(x.tag)) return; if (x.tag === "a") { buf += " " + textOf(x); segs.push({ a: x, text: buf }); buf = ""; return; } for (const c of x.children) rec(c); })(blk);
    for (const { a, text } of segs) {
      let abs; try { abs = new URL(a.attrs.href || "", pg.finalUrl).href; } catch (e) { continue; }
      if (!isSite(abs)) continue;
      const tgt = pages.get(stripHash(toBase(abs))); if (!tgt || !tgt.root) continue;
      const tail = text.split(/[.؟!]\s/).pop();
      CNT_RE.lastIndex = 0; let m, num = null;
      while ((m = CNT_RE.exec(tail))) { const v = m[1] ? CNT_WORDS[m[1]] : Number(fromAr(m[2])); if (v > 0 && v < 200 && !(m[2] && /^[0-9٠-٩]+\s*(٪|%)/.test(tail.slice(m.index)))) { num = { v, s: m[0] }; break; } }
      if (!num) continue;
      /* the number must count questions: «ثمانية منها», «ولثمانية أسئلة», «اثنين آخرين», «سؤالان» —
         not «أربع خطوات» */
      const after = tail.slice(tail.indexOf(num.s) + num.s.length).trim().split(/\s+/).slice(0, 3).join(" ");
      if (!/^(سؤال|مثال)/.test(num.s.replace(/^[وفلب]+/, "")) && !/(سؤال|أسئلة|اسئلة|مثال|أمثلة|امثلة|مسائل|منها|آخر|اخر)/.test(after)) continue;
      if (!SOLVED_CUE.test(tail) && !SOLVED_CUE.test(full.split(tail.slice(0, 20))[0] + tail)) continue;
      const frag = abs.includes("#") ? decodeURIComponent(abs.split("#")[1]) : "";
      const isCard = x => x.attrs && /^q-/.test(x.attrs.id || "") && DATA.qById[x.attrs.id.slice(2)];
      const el = frag && all(tgt.root, x => x.attrs && x.attrs.id === frag)[0];
      let scope = [el || tgt.root];
      /* a heading's anchor: its section is what follows it up to the next heading of its level */
      if (el && /^h[1-6]$/.test(el.tag) && !all(el, isCard).length) { scope = []; const lv = Number(el.tag[1]), sib = el.parent.children.filter(c => c.tag); for (let i = sib.indexOf(el) + 1; i < sib.length && !(/^h[1-6]$/.test(sib[i].tag) && Number(sib[i].tag[1]) <= lv); i++) scope.push(sib[i]); }
      const cards = scope.flatMap(x => all(x, isCard)).map(x => DATA.qById[x.attrs.id.slice(2)]);
      if (!cards.length) continue;
      const have = cmp ? cards.filter(q => q.format === "comparison").length || cards.length : cards.length; n++;
      if (have !== num.v) add("warn", "count-cross-page", pg.url, `says «${num.s.trim()}» (${num.v}) solved question(s) on ${shortUrl(abs)}, which shows ${have}${cmp ? " comparison" : ""} bank question card(s)`, tail.replace(/\s+/g, " ").trim().slice(-160));
    }
  }
  return n;
}
/* images named by og:image, twitter:image and JSON-LD (image / logo / thumbnailUrl, arrays and
   ImageObject included): status, content-type and real pixel size (PNG / JPEG / WebP / GIF) */
function ldImages(ld) {
  const out = [];
  const take = (v, from) => { if (typeof v === "string") out.push({ url: v, from }); else if (Array.isArray(v)) v.forEach(x => take(x, from)); else if (v && typeof v === "object" && (v.url || v.contentUrl)) out.push({ url: v.url || v.contentUrl, from, w: v.width, h: v.height }); };
  for (const n of ld.flatMap(ldNodes)) for (const k of ["image", "logo", "thumbnailUrl", "primaryImageOfPage"]) if (n[k] != null) take(n[k], typesOf(n).join("/") + "." + k);
  return out;
}
function imageSize(b) {
  if (b.length >= 24 && b.readUInt32BE(0) === 0x89504e47) return { type: "png", w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.length >= 10 && b.slice(0, 6).toString("latin1").startsWith("GIF8")) return { type: "gif", w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  if (b.length >= 30 && b.slice(0, 4).toString("latin1") === "RIFF" && b.slice(8, 12).toString("latin1") === "WEBP") {
    const k = b.slice(12, 16).toString("latin1");
    if (k === "VP8X") return { type: "webp", w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (k === "VP8L") { const v = b.readUInt32LE(21); return { type: "webp", w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
    if (k === "VP8 ") return { type: "webp", w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length;) {
      if (b[i] !== 0xff) { i++; continue; }
      const mk = b[i + 1]; if (mk === 0xd8 || mk === 0x01 || (mk >= 0xd0 && mk <= 0xd7)) { i += 2; continue; }
      const len = b.readUInt16BE(i + 2);
      if (mk >= 0xc0 && mk <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(mk)) return { type: "jpeg", w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
    return { type: "jpeg" };
  }
  return null;
}
const imgCache = new Map();
function imageInfo(u) {
  if (!imgCache.has(u)) imgCache.set(u, (async () => {
    const r = await http(isSite(u) ? toBase(u) : u, { binary: true, headers: { range: "bytes=0-131071" }, ua: "Mozilla/5.0", timeout: 25000 });
    return { status: r.status, ctype: r.headers["content-type"] || "", size: r.status === 200 || r.status === 206 ? imageSize(r.buf) : null, error: r.error };
  })());
  return imgCache.get(u);
}
async function checkImages(pg) {
  const m = pg.meta, list = [];
  if (m.ogImage) list.push({ url: m.ogImage, from: "og:image", w: m.ogImageW, h: m.ogImageH });
  if (m.twImage) list.push({ url: m.twImage, from: "twitter:image" });
  for (const x of ldImages(m.ld)) list.push(x);
  const seen = new Set();
  for (const x of list) {
    let u; try { u = new URL(x.url, pg.finalUrl).href; } catch (e) { add("error", "image-url", pg.url, `${x.from} is not a URL`, x.url); continue; }
    const k = x.from + " " + u; if (seen.has(k)) continue; seen.add(k);
    const r = await imageInfo(u);
    if (!(r.status === 200 || r.status === 206)) { add("error", "image-broken", pg.url, `${x.from} returns ${r.status || r.error}`, x.url); continue; }
    if (!/^image\//.test(r.ctype)) { add("error", "image-type", pg.url, `${x.from} is served as «${r.ctype}», not an image`, x.url); continue; }
    if (!r.size || !r.size.w) { add("info", "image-size-unread", pg.url, `${x.from}: could not read the pixel size of a ${r.ctype}`, x.url); continue; }
    const { w, h } = r.size;
    if (x.w != null && x.h != null && (Number(x.w) !== w || Number(x.h) !== h)) add("warn", "image-dims", pg.url, `${x.from} declares ${x.w}×${x.h} but the file is ${w}×${h}`, x.url);
    if (x.from === "og:image" && w < 1200) add("info", "og-image-small", pg.url, `og:image is ${w}×${h}; large link previews want 1200 px wide`, x.url);
    if (/Article|BlogPosting/.test(x.from) && /\.image$/.test(x.from)) {
      if (w * h < 50000) add("warn", "article-image-small", pg.url, `Article image is ${w}×${h} (${w * h} px); Google's Article guidance asks for at least 50,000 pixels`, x.url);
      else if (w < 1200) add("warn", "article-image-narrow", pg.url, `Article image is ${w} px wide; Google asks for high-resolution images, 1200 px wide for the large previews in Discover (max-image-preview:large)`, x.url);
    }
  }
  return list.length;
}

/* Latin digits in an Arabic line of a text file (llms.txt, llms-full.txt): URLs, ISO dates,
   file names and Latin names («Baloo Bhaijaan 2») are not prose */
function checkTextLines(where, body) {
  let latin = 0, ex = "", emoji = 0, eex = "";
  for (const line of body.split(/\r?\n/)) {
    if (!/[؀-ۿ]/.test(line)) continue;
    const t = line.replace(/https?:\/\/\S+/g, "").replace(/\b\d{4}-\d{2}-\d{2}\b/g, "").replace(/\b[\w.-]+\.(xyz|com|sa|org|net|txt|apk|html|json|md|js|css)\b/gi, "").replace(/[A-Za-z][A-Za-z.-]*(\s+[A-Za-z][A-Za-z.-]*)*\s+\d+\b/g, "").replace(/\b[A-Za-z]+\d+[A-Za-z\d]*\b/g, "");
    const d = t.match(/[0-9]+/g); if (d) { latin += d.length; if (!ex) ex = line.trim().slice(0, 140); }
    const e = (t.match(/\p{Extended_Pictographic}/gu) || []).filter(c => !"✔✘✓★↔©®™".includes(c)); if (e.length) { emoji += e.length; if (!eex) eex = line.trim().slice(0, 100); }
  }
  if (latin) add("warn", "latin-digits", where, `${latin} Latin-digit run(s) in Arabic lines (outside URLs, dates and Latin names)`, ex);
  if (emoji) add("error", "emoji", where, `${emoji} emoji in Arabic lines`, eex);
  /* exponent and index marks written twice or left dangling («س^(^٢)», «^(^٥)ق_(_٣», «س^ »): what a
     <sup><span>^</span>٢</sup> becomes when the sign is added on top of a converter that adds its own */
  let marks = 0, mex = ""; const seenEq = new Set(); let eqs = 0;
  for (const line of body.split(/\r?\n/)) {
    const t = line.replace(/https?:\/\/\S+/g, "").replace(/`[^`]*`/g, "");
    const m = /\^\(\^|_\(_|\^\^|__|\^\s*(?:$|[\s)،,.])|_(?:$|[\s)،,.])/.exec(t);
    if (m && /[؀-ۿ٠-٩]/.test(t)) { marks++; if (!mex) mex = t.trim().slice(Math.max(0, m.index - 40), m.index + 40); }
    if (!line.includes("=")) continue;
    const r = arithFails(line); eqs += r.n;
    for (const b of r.bad) { const k = b.L + "=" + b.R; if (seenEq.has(k)) continue; seenEq.add(k); add("error", "math-wrong", where, `«${b.L} = ${b.R}» does not hold: the left side is ${fmtNum(b.a)}`, line.trim().slice(0, 160)); }
  }
  if (marks) add("error", "text-markup", where, `${marks} line(s) with a broken exponent or index mark («^(^», «_(_», «^^», «__» or a «^» with nothing after it): a model reading the file gets a wrong formula`, mex);
  return { marks, eqs };
}
/* llms-full.txt: one section a page («- الرابط: …», «- آخر تحديث: …»), built by tools/build_sitemap.js */
function checkLlmsFull(body) {
  checkClaims("/llms-full.txt", body, { dotLevel: "error" });
  checkTextLines("/llms-full.txt", body);
  checkMarkdownTables("/llms-full.txt", body);
  checkExamFacts("/llms-full.txt", body);
  { const g = FACTS && FACTS.guidePdf && FACTS.guidePdf.url; if (g) { let dec = g; try { dec = decodeURI(g); } catch (e) { } if (!body.includes(g) && !body.includes(dec)) add("warn", "llms-full-guide", "/llms-full.txt", "does not cite ETEC's guide PDF (facts.json guidePdf.url): the exam facts it states have no official source in the file", g); } }
  const secs = [...body.matchAll(/^-\s*الرابط:\s*(\S+)\s*\r?\n-\s*آخر تحديث:\s*(\S+)/gm)].map(m => ({ loc: m[1], date: m[2] }));
  const said = /وعدد صفحاته\s*([0-9٠-٩]+)/.exec(body);
  if (said && Number(fromAr(said[1])) !== secs.length) add("error", "llms-full-count", "/llms-full.txt", `says it holds ${fromAr(said[1])} pages but has ${secs.length} sections`);
  const listed = new Set(secs.map(s => s.loc));
  for (const s of SITEMAP) if (!listed.has(s.loc)) add("error", "llms-full-missing", "/llms-full.txt", "sitemap page has no section in llms-full.txt (stale: rerun node tools/build_sitemap.js)", s.loc);
  for (const s of secs) {
    const sm = SITEMAP.find(x => x.loc === s.loc);
    if (!sm) { add("error", "llms-full-extra", "/llms-full.txt", "section for a URL that is not in the sitemap", s.loc); continue; }
    if (sm.lastmod && s.date.slice(0, 10) !== sm.lastmod.slice(0, 10)) add("error", "llms-full-stale", "/llms-full.txt", `section dated ${s.date} but the sitemap says ${sm.lastmod} (stale: rerun node tools/build_sitemap.js)`, s.loc);
  }
  return secs.length;
}

/* the labelled lines under each heading of a page («القانون:», «مثال:»), keyed by the heading */
function labelledSections(root) {
  const out = new Map();
  for (const h of all(root, n => /^h[2-4]$/.test(n.tag))) {
    const lvl = Number(h.tag[1]); const sib = h.parent.children.filter(c => c.tag); const els = [];
    /* only a heading's own lines: the section ends at the next heading, or at a block that holds
       headings of its own (an h2's rule cards each have their h3) */
    for (let i = sib.indexOf(h) + 1; i < sib.length; i++) { const s = sib[i]; if (/^h[1-6]$/.test(s.tag) || all(s, y => /^h[1-6]$/.test(y.tag)).length) break; els.push(s); }
    const LBL = { "القانون": /^\s*القانون\s*:\s*/, "مثال": /^\s*مثال\s*:\s*/ };
    const line = label => { for (const el of els) for (const x of [el, ...all(el, y => /^(p|li|div|dd)$/.test(y.tag))]) { const t = textOf(x); const m = LBL[label].exec(t); if (m) return t.slice(m[0].length); } return null; };
    const law = line("القانون"), ex = line("مثال");
    if (law != null || ex != null) { const k = norm(textOf(h)); if (!out.has(k)) out.set(k, { head: textOf(h), law, ex, id: (h.parent && h.parent.attrs && h.parent.attrs.id) || String(h.attrs.id || "").replace(/-h$/, "") || null }); }
  }
  return out;
}
/* llms-full.txt against the pages it copies: no broken exponent marks; each rule table row
   (| [name](…#anchor) | formula |) is the data's formula; under each «### heading» of a page's
   section, the «القانون:» and «مثال:» lines are the page's own, and every rule the page states
   is there; every equation of plain numbers holds */
function checkLlmsFullRules(body) {
  const res = { rows: 0, laws: 0, sections: 0 };
  /* sections, by the «- الرابط:» line that opens each */
  const lines = body.split(/\r?\n/); const secs = []; let cur = null;
  for (const l of lines) { const m = /^-\s*الرابط:\s*(\S+)/.exec(l); if (m) { cur = { loc: m[1], lines: [] }; secs.push(cur); continue; } if (cur) cur.lines.push(l); }
  if (DATA && RULE_AT) for (const l of lines) {
    const m = /^\|\s*\[([^\]]+)\]\((https?:\/\/[^)\s]+#[^)\s]+)\)\s*\|\s*(.*?)\s*\|\s*$/.exec(l.trim()); if (!m) continue;
    const at = ruleAt(m[2], CANON + "/"); if (!at || !at.rule.formula) continue;
    res.rows++;
    const got = m[3].replace(/\\\|/g, "|");
    if (!formulaOk(got, at.rule)) add("error", "llms-full-rule-row", "/llms-full.txt", `the table row for «${at.shown}» (${at.lesson} #${at.n}) shows a formula that is not the data's (signs and numbers compared)`, `llms-full «${got.slice(0, 110)}» | data «${formulaForms(at.rule)[0].slice(0, 110)}»`);
  }
  for (const s of secs) {
    const pg = pages.get(stripHash(toBase(s.loc)));
    if (!pg || !pg.root) continue;
    const onPage = labelledSections(pg.root); if (!onPage.size) continue;
    res.sections++;
    const inFile = new Map(); let head = null;
    for (const l of s.lines) {
      const h = /^#{2,4}\s+(.*)$/.exec(l); if (h) { head = norm(h[1].replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")); if (!inFile.has(head)) inFile.set(head, { law: null, ex: null }); continue; }
      if (!head) continue;
      const m = /^\s*(القانون|مثال)\s*:\s*(.*)$/.exec(l); if (!m) continue;
      const e = inFile.get(head); const k = m[1] === "القانون" ? "law" : "ex"; if (e[k] == null) e[k] = m[2];
    }
    const missing = [], stale = [], exStale = [], wrong = [];
    for (const [k, p] of onPage) {
      if (p.law == null) continue; res.laws++;
      const f = inFile.get(k);
      if (!f || f.law == null) { missing.push(p.head); continue; }
      /* against js/data too, not only the page: a page and llms-full wrong the same way must not pass */
      const at = p.id && ruleAt("#" + p.id, pg.finalUrl || pg.url);
      if (at && at.rule.formula) { res.dataLaws = (res.dataLaws || 0) + 1; if (!formulaOk(f.law, at.rule)) wrong.push(`«${at.shown}» (${at.lesson} #${at.n}): llms-full «${f.law.slice(0, 70)}» | data «${formulaForms(at.rule)[0].slice(0, 70)}»`); }
      if (sig(f.law) !== sig(p.law)) stale.push(`«${p.head}»: page «${p.law.slice(0, 70)}» | llms-full «${f.law.slice(0, 70)}»`);
      else if (p.ex != null && f.ex != null && sig(f.ex) !== sig(p.ex)) exStale.push(`«${p.head}»: page «${p.ex.slice(0, 60)}» | llms-full «${f.ex.slice(0, 60)}»`);
    }
    const where = "/llms-full.txt", what = shortUrl(s.loc);
    if (stale.length) add("error", "llms-full-formula-stale", where, `${stale.length} rule(s) of ${what} have a «القانون:» line that is not the page's (signs and numbers compared; stale: rerun node tools/build_sitemap.js)`, stale.slice(0, 3).join(" ; "));
    if (wrong.length) add("error", "llms-full-formula-data", where, `${wrong.length} rule(s) under ${what} in llms-full.txt have a «القانون:» line that is not the data's formula (signs and numbers compared, through DATA_FIX)`, wrong.slice(0, 3).join(" ; "));
    if (missing.length) add("error", "llms-full-formula-missing", where, `${missing.length} rule(s) ${what} states are not under a heading of its section in llms-full.txt`, missing.slice(0, 6).join("، "));
    if (exStale.length) add("warn", "llms-full-example-stale", where, `${exStale.length} rule(s) of ${what} have a «مثال:» line that is not the page's`, exStale.slice(0, 3).join(" ; "));
  }
  return res;
}

/* ---------- the committed generators, in --check mode only (they write nothing then) ---------- */
function runGenerators(dir = path.join(ROOT, "tools")) {
  const out = [];
  for (const f of fs.readdirSync(dir).filter(f => /^build_.*\.js$/.test(f)).sort()) {
    const src = fs.readFileSync(path.join(dir, f), "utf8");
    if (!/--check/.test(src.slice(0, 4000))) { out.push({ gen: f, skipped: "no --check mode in its header" }); continue; }
    // a wrapper that only re-runs another generator (build_methods_page.js → build_lesson_pages.js) is covered by that one
    const wraps = /execFileSync\([^\n]*build_(\w+)\.js/.exec(src);
    if (wraps && src.length < 3000) { out.push({ gen: f, skipped: "wraps build_" + wraps[1] + ".js" }); continue; }
    const t0 = Date.now(); let code = 0, text = "";
    try { text = execFileSync(process.execPath, [path.join(dir, f), "--check"], { cwd: path.dirname(dir), encoding: "utf8", timeout: 180000, stdio: ["ignore", "pipe", "pipe"] }); }
    catch (e) { code = e.status == null ? -1 : e.status; text = String(e.stdout || "") + String(e.stderr || "") || String(e.message); }
    const stale = [...text.matchAll(/^\s*(?:stale|out of date|changed)\s*:\s*(.+)$/gim)].map(m => m[1].trim());
    out.push({ gen: f, code, ms: Date.now() - t0, stale, tail: text.trim().split(/\r?\n/).slice(-3).join(" | ").slice(0, 400) });
  }
  return out;
}
function runValidators() {
  const out = [];
  for (const f of ["validate.js", "validate_teach.js", "validate_learn.js"]) {
    const p = path.join(ROOT, "tools", f); if (!fs.existsSync(p)) continue;
    let code = 0, text = "";
    try { text = execFileSync(process.execPath, [p], { cwd: ROOT, encoding: "utf8", timeout: 180000, stdio: ["ignore", "pipe", "pipe"] }); }
    catch (e) { code = e.status == null ? -1 : e.status; text = String(e.stdout || "") + String(e.stderr || ""); }
    out.push({ v: f, code, tail: text.trim().split(/\r?\n/).slice(-2).join(" | ").slice(0, 300) });
  }
  return out;
}

/* ---------- Lighthouse (mobile), when its CLI is already on this machine ----------
   Nothing is installed: LIGHTHOUSE=<path to lighthouse/cli/index.js>, or a copy npx already
   cached (npm-cache/_npx/<hash>/node_modules/lighthouse). Pages and budgets: tools/seo/perf.json. */
function findLighthouse() {
  if (process.env.LIGHTHOUSE && fs.existsSync(process.env.LIGHTHOUSE)) return process.env.LIGHTHOUSE;
  const roots = [process.env.npm_config_cache, path.join(os.homedir(), "AppData", "Local", "npm-cache"), path.join(os.homedir(), ".npm")].filter(Boolean);
  for (const r of roots) {
    const npx = path.join(r, "_npx"); if (!fs.existsSync(npx)) continue;
    for (const h of fs.readdirSync(npx)) { const cli = path.join(npx, h, "node_modules", "lighthouse", "cli", "index.js"); if (fs.existsSync(cli)) return cli; }
  }
  return null;
}
function lighthouse(cli, url) {
  return new Promise(resolve => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "qseo-lh-")); const outFile = path.join(tmp, "r.json");
    const args = [cli, url, "--output=json", "--output-path=" + outFile, "--quiet", "--form-factor=mobile", "--only-categories=performance,accessibility,best-practices,seo", "--chrome-flags=--headless=new --no-first-run --disable-extensions"];
    const ch = spawn(process.execPath, args, { cwd: tmp, env: { ...process.env, CHROME_PATH: CHROME || "" }, stdio: ["ignore", "ignore", "pipe"] });
    let err = ""; ch.stderr.on("data", d => { err += d; });
    const timer = setTimeout(() => { try { ch.kill(); } catch (e) { } }, 150000);
    ch.on("close", () => {
      clearTimeout(timer);
      let r = null;
      try {
        const j = JSON.parse(fs.readFileSync(outFile, "utf8")); const a = j.audits, c = j.categories || {};
        /* a run that crashed (runtimeError: NO_FCP, PROTOCOL_TIMEOUT, a page that never loaded) still
           writes a report, with null scores: that is a failed run, never «SEO null, budget 100» */
        const nulls = ["performance", "accessibility", "best-practices", "seo"].filter(k => !c[k] || c[k].score == null);
        if (j.runtimeError || nulls.length) throw new Error(`Lighthouse ${j.runtimeError ? "runtimeError " + j.runtimeError.code + (j.runtimeError.message ? ": " + String(j.runtimeError.message).slice(0, 120) : "") : "returned no score"}${nulls.length ? " (no score for " + nulls.join(", ") + ")" : ""}`);
        const sc = k => c[k] && c[k].score != null ? Math.round(c[k].score * 100) : null;
        const num = k => a[k] && a[k].numericValue != null ? a[k].numericValue : null;
        const catOf = id => Object.keys(c).filter(cat => (c[cat].auditRefs || []).some(x => x.id === id && x.weight > 0));
        const lcpItems = ((a["largest-contentful-paint-element"] || {}).details || {}).items;
        const sel = lcpItems ? ((JSON.stringify(lcpItems).match(/"selector":"([^"]+)"/) || [])[1] || "") : "";
        r = {
          lh: j.lighthouseVersion, perf: sc("performance"), a11y: sc("accessibility"), bp: sc("best-practices"), seo: sc("seo"),
          fcp: Math.round(num("first-contentful-paint")), lcp: Math.round(num("largest-contentful-paint")), cls: Math.round(num("cumulative-layout-shift") * 1000) / 1000,
          tbt: Math.round(num("total-blocking-time")), si: Math.round(num("speed-index")), bytes: Math.round(num("total-byte-weight")), lcpEl: sel,
          fails: Object.entries(a).filter(([k, v]) => v.score === 0 && catOf(k).some(x => x === "seo" || x === "accessibility")).map(([k]) => k),
        };
      } catch (e) { r = { error: (/^Lighthouse /.test(String(e.message)) ? String(e.message) : err.trim().split(/\r?\n/).pop() || String(e.message)).slice(0, 200) }; }
      setTimeout(() => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { } }, 1500);
      resolve(r);
    });
  });
}

/* runs are compared within one environment: every local port is "local", the live host "live" */
const envOf = base => { try { const h = new URL(base).hostname; if (CANON_HOSTS.includes(h)) return "live"; if (/^(localhost|127\.|0\.0\.0\.0|\[?::1\]?$|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return "local"; return new URL(base).origin; } catch (e) { return base; } };

/* ---------- main ---------- */
async function updateVocab() {
  const url = "https://schema.org/version/latest/schemaorg-current-https.jsonld";
  const r = await fetch(url); if (!r.ok) throw new Error(url + " " + r.status);
  const g = (await r.json())["@graph"]; const id = x => String(x["@id"] || x).replace(/^schema:/, "");
  const arr = v => v == null ? [] : [].concat(v);
  const types = {}, props = {};
  for (const x of g) {
    const ty = arr(x["@type"]);
    const pending = arr(x["schema:isPartOf"]).some(p => /pending/.test(id(p)));
    if (ty.includes("rdfs:Class") || ty.some(t => /^schema:/.test(t) && t !== "rdf:Property")) types[id(x)] = { sup: arr(x["rdfs:subClassOf"]).map(id).filter(s => !/:/.test(s)), ...(pending ? { pending: 1 } : {}) };
    if (ty.includes("rdf:Property")) props[id(x)] = { dom: arr(x["schema:domainIncludes"]).map(id) };
  }
  const ver = (r.headers.get("last-modified") || "") ;
  const out = { version: new Date().toISOString().slice(0, 10), source: url, sourceLastModified: ver, types, props };
  fs.writeFileSync(path.join(SEO, "schema-vocab.json"), JSON.stringify(out) + "\n");
  console.log(`schema-vocab.json: ${Object.keys(types).length} types, ${Object.keys(props).length} properties`);
}
/* ---------- robots.txt policy (the home owner's two groups) ----------
   1. every sitemap URL, /llms.txt, /llms-full.txt, /sitemap.xml and /robots.txt are open to every
      agent robots.txt names, to every bot the audit knows, to «*» and to a bot nobody named;
   2. the dev tooling, the labs, the notes and the harnesses are closed to every agent that is
      not a classic search engine (those must reach them, to see their noindex). */
const SEARCH_ENGINES = new Set(["googlebot", "bingbot", "duckduckbot", "applebot", "yandexbot"]);
const DEV_PATHS = ["/tools/card.html", "/tools/serve.js", "/tools/seo/audit.js", "/research/rule-memory.md", "/CLAUDE.md", "/design.md", "/REMAINING.md", "/qudrat-lessons-duolingo.md",
  "/preview.html", "/mobile.html", "/chest-animation.html", "/chest-animation-tiers.html", "/chest-animation-clashroyale.html", "/mascot-lab.html", "/mascot-edits.html",
  "/exam-date-picker.html", "/quiz-two-bolts.html", "/_tmp_spark.html", "/assets/league/index.html"];
function checkRobotsPolicy() {
  if (!ROBOTS.groups.length) return null;
  const agents = new Set(["*", "qudratiunnamedbot"]);
  for (const g of ROBOTS.groups) for (const a of g.agents) agents.add(a);
  for (const b of BOTS) agents.add(b.name.toLowerCase());
  const pub = [...new Set(SITEMAP.map(s => { const x = new URL(s.loc); return x.pathname + x.search; }).concat(["/llms.txt", "/llms-full.txt", "/sitemap.xml", "/robots.txt"]))];
  const dev = new Set(DEV_PATHS);
  /* local runs: any root .html carrying a noindex meta (a harness) and any root .md note */
  if (!LIVE && fs.existsSync(path.join(ROOT, "index.html"))) {
    for (const f of fs.readdirSync(ROOT)) {
      if (/\.md$/i.test(f)) dev.add("/" + f);
      else if (/\.html$/i.test(f) && f !== "404.html" && f !== "index.html") { try { if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(fs.readFileSync(path.join(ROOT, f), "utf8"))) dev.add("/" + f); } catch (e) { } }
    }
  }
  const smPaths = new Set(SITEMAP.map(s => new URL(s.loc).pathname));
  const devList = [...dev].filter(p => !smPaths.has(p));
  const enc = p => p.split("/").map(x => encodeURIComponent(decodeURIComponent(x))).join("/");
  /* one finding per set of URLs, naming every agent it applies to */
  const shutBy = new Map(), openBy = new Map(); const offAgents = new Set();
  const label = a => a === "qudratiunnamedbot" ? "(a bot robots.txt does not name)" : a;
  const group = (m, list, a) => { const k = list.join(" "); if (!m.has(k)) m.set(k, { list, agents: [] }); m.get(k).agents.push(label(a)); offAgents.add(a); };
  for (const a of [...agents].sort()) {
    const shut = pub.filter(p => !robotsAllowed(ROBOTS, a, p).allow && !robotsAllowed(ROBOTS, a, enc(p)).allow);
    if (shut.length) group(shutBy, shut.map(p => p + " (" + robotsAllowed(ROBOTS, a, p).rule + ")"), a);
    if (SEARCH_ENGINES.has(a)) continue;
    const open = devList.filter(p => robotsAllowed(ROBOTS, a, p).allow);
    if (open.length) group(openBy, open, a);
  }
  for (const { list, agents: ag } of shutBy.values()) add("error", "robots-policy-public", "/robots.txt", `${ag.length} agent(s) blocked from ${list.length} public URL(s); sitemap pages and the llms files must be open to every agent: ${ag.join(", ")}`, list.slice(0, 8).join(", "));
  for (const { list, agents: ag } of openBy.values()) add("warn", "robots-policy-dev", "/robots.txt", `${ag.length} non-search agent(s) may fetch ${list.length} dev / note / harness URL(s) (a noindex keeps them out of search, not out of a training or answer crawler): ${ag.join(", ")}`, list.slice(0, 10).join(", "));
  return { agents: agents.size, publicUrls: pub.length, devUrls: devList.length, bad: offAgents.size };
}

/* ---------- llms-full.txt as Markdown: tables, links and the ETEC guide ----------
   every table has a header row, a |---| separator with the same column count and rows of that
   count (an escaped \| is not a column); the guide PDF is cited; the links are returned so the
   crawl can check each URL and #fragment. */
function checkMarkdownTables(where, body) {
  const s = body.split(/\r?\n/);
  const cols = l => l.trim().split(/(?<!\\)\|/).length - 2;
  let i = 0, tables = 0; const bad = [];
  while (i < s.length) {
    if (s[i].trim().startsWith("|")) {
      const st = i, blk = [];
      while (i < s.length && s[i].trim().startsWith("|")) blk.push(s[i++].trim());
      tables++;
      const n = cols(blk[0]);
      if (blk.length < 2 || !/^\|(\s*:?-{3,}:?\s*\|)+$/.test(blk[1]) || cols(blk[1]) !== n) bad.push(`line ${st + 1}: no |---| separator with ${n} columns under the header`);
      blk.forEach((l, k) => { if (cols(l) !== n || !l.endsWith("|")) bad.push(`line ${st + k + 1}: ${cols(l)} columns, the header has ${n}`); });
    } else i++;
  }
  if (bad.length) add("error", "md-table", where, `${bad.length} broken Markdown table row(s) in ${tables} table(s); a model reading the file sees the cells shifted`, bad.slice(0, 6).join("; "));
  return { tables, bad: bad.length };
}
function llmsFullLinks(body) {
  const out = [];
  for (const m of body.matchAll(/https?:\/\/[^\s)>\]«»"'`]+/g)) out.push(m[0].replace(/[.,،;:]+$/, ""));
  return [...new Set(out)];
}

/* ---------- fonts: one URL per file, versioned by its content ----------
   The pages and stylesheets name each site font with ?v=<first 8 hex of its sha1>. A different
   URL for the same bytes (bare, another v) is a second download; a v that is not the file's hash
   means the file changed under a URL browsers keep for a year. */
async function checkFontVersions(fontUses) {
  const byPath = new Map();
  for (const [u, from] of fontUses) {
    if (!isSite(u)) continue;
    const x = new URL(toBase(u)); if (!/\.(woff2?|ttf|otf)$/i.test(x.pathname)) continue;
    if (!byPath.has(x.pathname)) byPath.set(x.pathname, new Map());
    byPath.get(x.pathname).set(x.search, new Set([...(byPath.get(x.pathname).get(x.search) || []), ...from]));
  }
  const res = [];
  for (const [p, variants] of byPath) {
    const r = await http(BASE_ORIGIN + p, { binary: true, ua: "Mozilla/5.0" });
    if (r.status !== 200 || !r.buf.length) continue;
    const h = require("crypto").createHash("sha1").update(r.buf).digest("hex").slice(0, 8);
    const users = q => [...variants.get(q)].slice(0, 5).join(", ");
    for (const q of variants.keys()) {
      const v = new URLSearchParams(q).get("v");
      if (v == null) add("warn", "font-version", p, `named without ?v= (the file's sha1 starts ${h}); browsers cache it under a bare URL and the other pages' versioned copy is downloaded again`, "used by " + users(q));
      else if (v !== h) add("warn", "font-version", p, `?v=${v} but the file's sha1 starts ${h}: stale version, or the file changed under a cached URL`, "used by " + users(q));
    }
    if (variants.size > 1) add("warn", "font-url-variants", p, `${variants.size} different URLs for one font file (${[...variants.keys()].map(q => q || "(bare)").join(", ")}): each is downloaded on its own`);
    res.push({ path: p, sha1: h, urls: variants.size });
  }
  return res;
}

/* ---------- CLS while the web font is late, on a phone ----------
   A phone has no Arial and its Arabic system face is Noto Naskh Arabic. Each page and site
   stylesheet is rewritten on the way in: an @font-face that lists only local() fonts becomes
   Noto Naskh (as a data URL, ready at first paint as a system font is) when it names Noto
   Naskh, and a font that fails to load otherwise (Arial and every other system font: not on the
   phone). The site's .woff2 files are held back `delay` ms. «desktop» is the page as it is, on
   this machine's fonts, at the longest delay. Layout shifts are summed without input, as CLS
   counts them, with the elements that moved. The Naskh file is Google Fonts' own
   (ofl/notonaskharabic, pinned by its sha1), downloaded once to the temp folder; --offline and
   no copy there skips the phone runs. */
const NASKH = { url: "https://github.com/google/fonts/raw/main/ofl/notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf", sha1: "11056fff634e12cd83d546f663ed91b0508df1b9" };
async function naskhFont() {
  const f = path.join(os.tmpdir(), "qseo-naskh-" + NASKH.sha1.slice(0, 8) + ".ttf");
  const ok = b => require("crypto").createHash("sha1").update(b).digest("hex") === NASKH.sha1;
  try { const b = fs.readFileSync(f); if (ok(b)) return b; } catch (e) { }
  if (process.env.QSEO_NASKH) { try { const b = fs.readFileSync(process.env.QSEO_NASKH); if (ok(b)) return b; } catch (e) { } }
  if (OFFLINE) return null;
  try {
    const r = await fetch(NASKH.url, { signal: AbortSignal.timeout(60000) }); if (!r.ok) return null;
    const b = Buffer.from(await r.arrayBuffer()); if (!ok(b)) return null;
    fs.writeFileSync(f, b); return b;
  } catch (e) { return null; }
}
const PHONE_FACES = (css, naskhData) => css.replace(/@font-face\s*\{[^}]*\}/g, ff => {
  const m = /src\s*:\s*([^;}]*)/i.exec(ff); if (!m) return ff;
  const src = m[1];
  if (/url\(/i.test(src) || !/local\(/i.test(src)) return ff; // a web font: untouched
  const naskh = /local\(\s*["']?Noto Naskh Arabic/i.test(src) || /local\(\s*["']?NotoNaskhArabic/i.test(src);
  return ff.replace(m[0], "src: " + (naskh ? naskhData : 'url(/__qseo-missing-font.ttf) format("truetype")'));
});
async function fontCls(br, url, opt) {
  let tab = null, ws = null;
  try {
    tab = await (await fetch(`http://127.0.0.1:${br.port}/json/new?about:blank`, { method: "PUT" })).json();
    ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("ws")); });
    let id = 0; const wait = new Map();
    const send = (method, params = {}) => new Promise(res => { const k = ++id; wait.set(k, res); ws.send(JSON.stringify({ id: k, method, params })); });
    const held = [];
    ws.onmessage = async m => {
      const d = JSON.parse(typeof m.data === "string" ? m.data : Buffer.from(m.data).toString());
      if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); return; }
      if (d.method !== "Fetch.requestPaused") return;
      const { requestId, request, resourceType } = d.params; const u = request.url;
      try {
        if (/\/__qseo-missing-font\.ttf$/.test(u)) return send("Fetch.fulfillRequest", { requestId, responseCode: 404, body: "" });
        const site = isSite(u) || u.startsWith(BASE_ORIGIN);
        /* every web font is held back: the site's own files, and fonts.gstatic.com's where a page
           still loads Google Fonts */
        if ((site || /(^|\.)fonts\.gstatic\.com$/.test(new URL(u).hostname) || resourceType === "Font") && (resourceType === "Font" || /\.(woff2?|ttf|otf)$/i.test(new URL(u).pathname))) { held.push(u); await sleep(opt.delay); return send("Fetch.continueRequest", { requestId }); }
        if (opt.phone && site && (resourceType === "Document" || resourceType === "Stylesheet")) {
          const r = await fetch(u, { headers: { "user-agent": UA } }); const body = PHONE_FACES(await r.text(), opt.naskhData);
          return send("Fetch.fulfillRequest", { requestId, responseCode: r.status, responseHeaders: [{ name: "Content-Type", value: r.headers.get("content-type") || (resourceType === "Document" ? "text/html; charset=utf-8" : "text/css") }], body: Buffer.from(body).toString("base64") });
        }
        return send("Fetch.continueRequest", { requestId });
      } catch (e) { return send("Fetch.continueRequest", { requestId }); }
    };
    await send("Page.enable"); await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });
    await send("DOM.enable"); await send("CSS.enable");
    await send("Emulation.setFocusEmulationEnabled", { enabled: true }); await send("Page.setWebLifecycleState", { state: "active" });
    await send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
    await send("Emulation.setDeviceMetricsOverride", { width: opt.width || 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36" });
    await send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__qcls=0;window.__qsh=[];try{new PerformanceObserver(l=>{for(const e of l.getEntries()){if(e.hadRecentInput)continue;__qcls+=e.value;__qsh.push([Math.round(e.startTime),+e.value.toFixed(4),(e.sources||[]).slice(0,3).map(x=>{const n=x.node;return (n?(n.nodeName.toLowerCase()+(n.id?'#'+n.id:'')+(typeof n.className==='string'&&n.className?'.'+n.className.trim().split(/\\s+/).slice(0,2).join('.'):'')):'?')+' '+Math.round(x.previousRect.y)+'→'+Math.round(x.currentRect.y)})])}}).observe({type:'layout-shift',buffered:true})}catch(e){}` });
    /* which fonts really painted a few text elements (CSS.getPlatformFontsForNode): a face that is
       installed on this machine and named like the site's own font (Baloo Bhaijaan 2 is, here)
       paints what a student's phone never would, so a pass with it is no pass */
    const probe = async () => {
      try {
        await send("Runtime.evaluate", { returnByValue: true, expression: `(()=>{let i=0;for(const s of ['h1','main p','p','li','td','h2','h3']){const e=[...document.querySelectorAll(s)].find(x=>!x.hasAttribute('data-qseo-p')&&x.textContent.trim().length>3);if(e){e.setAttribute('data-qseo-p',String(i++));}}return i})()` });
        const doc = await send("DOM.getDocument", { depth: 0 });
        const q = await send("DOM.querySelectorAll", { nodeId: doc.result.root.nodeId, selector: "[data-qseo-p]" });
        const fonts = {};
        for (const nodeId of (q.result && q.result.nodeIds) || []) {
          const f = await send("CSS.getPlatformFontsForNode", { nodeId });
          for (const x of (f.result && f.result.fonts) || []) { const k = x.familyName + (x.isCustomFont ? "" : " [installed]"); fonts[k] = (fonts[k] || 0) + x.glyphCount; }
        }
        return fonts;
      } catch (e) { return null; }
    };
    const t0 = Date.now();
    await send("Page.navigate", { url });
    /* while the font is held: what painted the text then is the fallback the shift starts from */
    await sleep(Math.max(300, Math.min(opt.delay * 0.6, opt.delay - 250)));
    const during = await probe();
    await sleep(Math.max(0, opt.delay - (Date.now() - t0)));
    /* then until the fonts have loaded and the page has settled (at most 4 s after the release) */
    for (let k = 0; k < 40; k++) {
      const s = await send("Runtime.evaluate", { returnByValue: true, expression: "document.readyState==='complete'&&document.fonts.status==='loaded'" });
      if (s.result && s.result.result && s.result.result.value) break;
      await sleep(100);
    }
    await sleep(900);
    const r = await send("Runtime.evaluate", { returnByValue: true, expression: `({cls:+__qcls.toFixed(4), shifts:__qsh.slice(0,6), faces:[...document.fonts].map(f=>f.family.replace(/["']/g,'')+':'+f.weight+':'+f.status), fcp:Math.round((performance.getEntriesByName('first-contentful-paint')[0]||{}).startTime||0)})` });
    const after = await probe();
    const v = r.result && r.result.result && r.result.result.value;
    return v ? { ...v, held: held.length, during, after } : { error: "no result" };
  } catch (e) { return { error: String(e.message || e) }; }
  finally {
    try { if (ws) ws.close(); } catch (e) { }
    if (tab) try { await fetch(`http://127.0.0.1:${br.port}/json/close/${tab.id}`); } catch (e) { }
  }
}
/* which check family a code belongs to: a family that did not run in both runs is not compared */
const FAMILY_RULES = [
  [/^(cls|lcp|lcp-watch|lighthouse-.*)$/, "lighthouse"],
  [/^font-cls.*$/, "fontcls"],
  [/^(render-.*|hidden-text|orphan-rendered|ai-query.*|ai-queries.*|faq-not-visible|quiz-not-visible|faq-mismatch)$/, "render"],
  [/^(etec-.*|external-.*)$/, "network"],
  [/^(generator-stale|data-validator)$/, "generators"],
  [/^(vercel-.*|vercelignore-.*|public-unlisted|public-disallowed-only|lastmod-stale|sitemap-file)$/, "local"],
];
const familyOf = code => { for (const [re, f] of FAMILY_RULES) if (re.test(code)) return f; return "core"; };
/* an older entry has no caps: read them off what it recorded */
const capsOf = h => h.caps || {
  lighthouse: !!(h.lighthouse && Object.values(h.lighthouse).some(r => r && !r.error)),
  render: h.pages && Object.values(h.pages).some(p => p.rw != null) ? "unknown" : "none", renderSet: "sitemap",
  network: !!h.etec, generators: !!h.generators, local: !!h.vercel, fontcls: !!(h.fontCls && Object.keys(h.fontCls).length),
};
const famWhy = (f, a, b) => f === "render" ? `render ${a.render}/${a.renderSet || "sitemap"} → ${b.render}/${b.renderSet}` : `${a[f] ? "on" : "off"} → ${b[f] ? "on" : "off"}`;
/* the monitor's own version: a change here changes what a run can find */
const MONITOR_FILES = ["audit.js", "facts.json", "ai-queries.json", "accepted.json", "perf.json", "schema-vocab.json"];
function monitorHash() {
  const crypto = require("crypto"); const files = {}; const all = crypto.createHash("sha256");
  for (const f of MONITOR_FILES) { let b = Buffer.alloc(0); try { b = fs.readFileSync(path.join(SEO, f)); } catch (e) { } files[f] = crypto.createHash("sha256").update(b).digest("hex").slice(0, 8); all.update(f + "\0" + files[f] + "\0"); }
  return { hash: all.digest("hex").slice(0, 12), files };
}
/* the app data every count check reads (js/data, the curriculum, app.js's mock constants) */
function dataHash() {
  const crypto = require("crypto"); const h = crypto.createHash("sha256");
  const files = []; try { for (const f of fs.readdirSync(path.join(ROOT, "js", "data")).sort()) files.push(path.join("js", "data", f)); } catch (e) { }
  files.push("qudrat-lessons-duolingo.md", path.join("js", "app.js"));
  for (const f of files) { try { h.update(f + "\0"); h.update(fs.readFileSync(path.join(ROOT, f))); } catch (e) { } }
  return h.digest("hex").slice(0, 12);
}

(async function main() {
  if (flag("update-vocab", false)) { await updateVocab(); process.exit(0); }
  const t0 = Date.now();
  const log = (...a) => { if (!QUIET) console.log(...a); };
  log(`SEO/AEO audit — ${BASE}${LIVE ? " (live)" : ""} — ${new Date().toISOString()}`);
  if (DATA) log(`app data: ${DATA.lessons.length} lessons (${DATA.unitLessons.join("/")}), ${DATA.questions} questions (${DATA.comparison} comparison, ${DATA.sciOnly} sci-only), ${DATA.rules.length} rules, ${DATA.shortLessons} short lessons`);

  const home = await http(BASE + "/");
  if (home.status === 0) { console.error(`cannot reach ${BASE} (${home.error}). Start it with: node tools/serve.js <port>`); process.exit(2); }

  /* robots.txt */
  const rob = await http(BASE + "/robots.txt");
  if (rob.status !== 200) add("error", "robots-missing", "/robots.txt", `robots.txt returned ${rob.status}`);
  else {
    ROBOTS = parseRobots(rob.body);
    if (!ROBOTS.sitemaps.length) add("warn", "robots-sitemap", "/robots.txt", "no Sitemap: line");
    for (const s of ROBOTS.sitemaps) if (!s.startsWith(CANON + "/")) add("warn", "robots-sitemap", "/robots.txt", "Sitemap is not on the canonical host", s);
    const ct = rob.headers["content-type"] || ""; if (!/text\/plain/.test(ct)) add("warn", "robots-type", "/robots.txt", "robots.txt content-type is not text/plain", ct);
  }

  /* sitemap */
  const smUrls = ROBOTS.sitemaps.length ? ROBOTS.sitemaps.map(toBase) : [BASE + "/sitemap.xml"];
  for (const smu of smUrls) {
    const sm = await http(smu);
    if (sm.status !== 200) { add("error", "sitemap-missing", smu, `sitemap returned ${sm.status}`); continue; }
    const kids = [...sm.body.matchAll(/<sitemap>[\s\S]*?<loc>\s*([^<]+?)\s*<\/loc>/g)].map(x => x[1]);
    const bodies = [sm.body];
    for (const k of kids) { const r = await http(toBase(decode(k))); if (r.status === 200) bodies.push(r.body); else add("error", "sitemap-missing", k, `child sitemap ${r.status}`); }
    for (const b of bodies) for (const u of b.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
      const loc = decode(((/<loc>\s*([^<]+?)\s*<\/loc>/.exec(u[1]) || [])[1] || ""));
      const lastmod = ((/<lastmod>\s*([^<]+?)\s*<\/lastmod>/.exec(u[1]) || [])[1] || "");
      const images = [...u[1].matchAll(/<image:loc>\s*([^<]+?)\s*<\/image:loc>/g)].map(x => decode(x[1]));
      SITEMAP.push({ loc, base: toBase(loc), lastmod, images });
    }
  }
  const seenLoc = new Set();
  for (const s of SITEMAP) {
    if (seenLoc.has(s.loc)) add("error", "sitemap-dup", s.loc, "listed twice in the sitemap"); seenLoc.add(s.loc);
    if (!s.loc.startsWith(CANON + "/")) add("error", "sitemap-host", s.loc, "sitemap URL is not on https://qudrati.xyz");
    if (s.loc !== s.loc.trim() || /\s/.test(s.loc)) add("error", "sitemap-loc", s.loc, "whitespace in <loc>");
    if (/[A-Z]/.test(new URL(s.loc).pathname)) add("warn", "sitemap-case", s.loc, "uppercase in URL path (slugs should be lowercase)");
    if (!s.lastmod) add("warn", "sitemap-lastmod", s.loc, "no <lastmod>");
    else if (badDate(s.lastmod)) add("error", "sitemap-lastmod", s.loc, "lastmod is " + badDate(s.lastmod).replace("ISO 8601", "W3C / ISO 8601"), s.lastmod);
    else if (s.lastmod.slice(0, 10) > today) add("error", "sitemap-lastmod", s.loc, "lastmod is in the future", s.lastmod);
  }
  log(`sitemap: ${SITEMAP.length} URLs`);
  const robotsPolicy = checkRobotsPolicy();
  if (robotsPolicy) log(`robots.txt policy: ${robotsPolicy.agents} agents × ${robotsPolicy.publicUrls} public and ${robotsPolicy.devUrls} dev URLs, ${robotsPolicy.bad} agent(s) off policy`);

  /* llms.txt */
  const llms = await http(BASE + "/llms.txt");
  let llmsLinks = [];
  if (llms.status !== 200) add("warn", "llms-missing", "/llms.txt", `llms.txt returned ${llms.status}`);
  else {
    llmsLinks = [...new Set((llms.body.match(/https?:\/\/[^\s)>\]«»"']+/g) || []).map(u => u.replace(/[.,،;:]+$/, "")))];
    if (!/^#\s/.test(llms.body)) add("warn", "llms-format", "/llms.txt", "llms.txt should open with a «# Name» heading (llmstxt.org)");
    if (!/^>\s/m.test(llms.body)) add("warn", "llms-format", "/llms.txt", "llms.txt has no «> summary» line");
    checkClaims("/llms.txt", llms.body, { dotLevel: "error" });
    checkTextLines("/llms.txt", llms.body);
    checkDifficulty("/llms.txt", llms.body); checkMock("/llms.txt", llms.body, false); checkExamFacts("/llms.txt", llms.body);
    for (const s of SITEMAP) if (!llms.body.includes(s.loc) && !(s.loc === CANON + "/" && llms.body.includes(CANON + "/"))) add("warn", "llms-unlisted", "/llms.txt", "sitemap page not listed in llms.txt", s.loc);
  }
  /* llms-full.txt: the whole site as text, written by tools/build_sitemap.js */
  const llmsFull = await http(BASE + "/llms-full.txt");
  let llmsFullSecs = null, llmsFullUrls = [];
  if (llmsFull.status === 200) {
    llmsFullSecs = checkLlmsFull(llmsFull.body);
    llmsFullUrls = llmsFullLinks(llmsFull.body);
    if (llms.status === 200 && !llms.body.includes("llms-full.txt")) add("info", "llms-full-unlinked", "/llms.txt", "llms.txt does not point to llms-full.txt");
    log(`llms-full.txt: ${kb(llmsFull.bytes)}, ${llmsFullSecs} page sections`);
  } else if (llms.status === 200 && llms.body.includes("llms-full.txt")) add("error", "llms-link-broken", "/llms.txt", `llms.txt names llms-full.txt, which returns ${llmsFull.status}`);

  /* crawl */
  const queue = [BASE + "/", ...SITEMAP.map(s => s.base), ...llmsLinks.filter(isSite).map(toBase), ...llmsFullUrls.filter(isSite).map(toBase)].map(stripHash);
  const queued = new Set();
  const enqueue = u => { const k = stripHash(u); if (queued.has(k) || queued.size >= MAX_PAGES) return; queued.add(k); queue.push(k); };
  const work = [...new Set(queue)]; queue.length = 0; work.forEach(u => queued.add(u)); queue.push(...work);
  while (queue.length) {
    const batch = queue.splice(0, queue.length);
    const recs = await pool(batch, 8, async u => {
      const p = new URL(u).pathname;
      const okBot = robotsAllowed(ROBOTS, "*", p).allow;
      const isHtmlish = /(\.html?|\/)$/.test(p) || !/\.[a-z0-9]+$/i.test(p);
      if (!isHtmlish) { const r = await probe(u); const cl = r.headers["content-length"]; return { url: u, status: r.status, ctype: r.headers["content-type"] || "", bytes: cl != null && cl !== "" ? Number(cl) : null, asset: true, disallowed: !okBot }; }
      const rec = await fetchPage(u); rec.disallowed = !okBot; return rec;
    });
    for (const rec of recs) {
      pages.set(rec.url, rec);
      if (!rec.root) continue;
      if (rec.disallowed && !SITEMAP.some(s => s.base === rec.url)) continue; // do not crawl through robots-blocked pages
      for (const l of rec.links) {
        if (!l.abs || !/^https?:/.test(l.abs) || !isSite(l.abs)) continue;
        const tgt = stripHash(toBase(l.abs));
        if (tgt !== rec.url) { if (!linkGraph.has(tgt)) linkGraph.set(tgt, new Set()); linkGraph.get(tgt).add(rec.url); }
        if (!pages.has(tgt) && !queued.has(tgt)) enqueue(tgt);
      }
    }
  }
  const htmlPages = [...pages.values()].filter(p => p.root);
  /* every qudrati.xyz link in llms.txt and llms-full.txt: 200, and its #fragment an id on that page */
  for (const [file, list] of [["/llms.txt", llmsLinks], ["/llms-full.txt", llmsFullUrls]]) {
    let frags = 0, fragBad = [], off = [];
    for (const u of list.filter(isSite)) {
      if (offCanon(u)) off.push(u);
      const p = pages.get(stripHash(toBase(u)));
      if (!p) { add("warn", "llms-link-unchecked", file, "link not fetched (crawl limit)", u); continue; }
      if (p.status !== 200) { add("error", "llms-link-broken", file, `${file.slice(1)} links to a URL that returns ${p.status || "no response"}`, u); continue; }
      const h = u.includes("#") ? u.slice(u.indexOf("#") + 1) : "";
      if (h && p.ids) { frags++; let id = h; try { id = decodeURIComponent(h); } catch (e) { } if (!p.ids.has(id) && !p.ids.has(h)) fragBad.push(u); }
    }
    for (const u of fragBad) add("error", "llms-link-fragment", file, "#fragment names no id on that page (an answer engine following it lands at the top)", u);
    if (off.length) add("warn", "link-noncanonical-host", file, `${off.length} link(s) use ${[...new Set(off.map(offCanon))].join(", ")} instead of https://qudrati.xyz`, off.slice(0, 5).join(", "));
    if (list.length) log(`${file.slice(1)}: ${list.filter(isSite).length} site link(s), ${frags} with a #fragment, ${fragBad.length} broken fragment(s)`);
  }
  log(`crawl: ${pages.size} URLs fetched, ${htmlPages.length} HTML pages`);

  /* rendered DOM vs raw HTML, and what is visible in it. Done before the per-page checks so
     the FAQ / Quiz / question visibility checks and the student queries read the text a reader
     sees (computed styles), not every text node the HTML holds. */
  const toRender = RENDER === "none" ? [] : RENDER === "home" ? [BASE + "/"] : RENDER === "all" ? htmlPages.filter(p => !p.noindex).map(p => p.url) : SITEMAP.map(s => s.base).filter(u => pages.get(u) && pages.get(u).root);
  if (toRender.length && !CHROME) add("warn", "render-skipped", "", "Chrome not found; rendered-DOM checks skipped (set CHROME=)");
  let renderVia = null;
  if (toRender.length && CHROME) {
    const br = await cdpBrowser();
    renderVia = br ? "cdp" : "dump-dom";
    log(`rendering ${toRender.length} page(s) in headless Chrome (${br ? "DevTools Protocol, computed visibility" : "--dump-dom, no visibility: Node has no WebSocket"})…`);
    await pool(toRender, br ? 4 : 3, async u => {
      const pg = pages.get(u);
      let html = null, vis = null;
      if (br) { vis = await cdpRender(br, u, u === BASE + "/" ? 3500 : 1500); if (vis) html = vis.html; }
      if (!html) html = await renderDom(u);
      if (!html) { add("warn", "render-failed", u, "headless Chrome returned no DOM"); return; }
      const root = parseHTML(html); const mt = pageMeta(root, u); const body = byTag(root, "body")[0] || root;
      const txt = vis ? String(vis.text).replace(/[\s ]+/g, " ").trim() : textOf(body);
      pg.rWords = wordCount(txt); pg.rLinks = byTag(root, "a").filter(a => a.attrs.href).length; pg.rH1 = mt.h1.length; pg.rLd = mt.ld.length + mt.ldErr.length;
      pg.rText = txt; pg.rRoot = root; pg.visible = !!vis; pg.hiddenBlocks = vis ? vis.hidden : null;
      if (vis && vis.quiet && vis.quiet.length && process.env.QSEO_DEBUG) log(`  [debug] ${shortUrl(u)}: ${vis.quiet.length} text node(s) unseen by colour or position: ${vis.quiet.slice(0, 8).join(" | ")}`);
      pg.rTargets = new Set(byTag(root, "a").map(a => { try { return new URL(a.attrs.href || "", pg.finalUrl).href; } catch (e) { return null; } }).filter(u => u && /^https?:/.test(u) && isSite(u)).map(u => stripHash(toBase(u))));
      const rawLinks = pg.links.length;
      if ((mt.title[0] || "") !== (pg.meta.title[0] || "")) {
        /* the file may have been rewritten between the fetch and the render (a generator running):
           fetch it again before blaming JavaScript */
        const again = await http(u, { noCache: true }); const t2 = again.status === 200 ? (pageMeta(parseHTML(again.body), u).title[0] || "") : null;
        if (t2 === (mt.title[0] || "")) add("info", "changed-during-audit", u, "the page changed while the audit ran (its title on the first fetch differs from now); rerun for a clean read", (pg.meta.title[0] || "") + " → " + t2);
        else add("error", "render-title", u, "title changes after JavaScript", (pg.meta.title[0] || "") + " → " + (mt.title[0] || ""));
      }
      if ((mt.canon[0] || "") !== (pg.meta.canon[0] || "")) add("error", "render-canonical", u, "canonical changes after JavaScript", (pg.meta.canon[0] || "") + " → " + (mt.canon[0] || ""));
      pg.rRobots = mt.robots;
      if (hasNoindex(mt.robots) && !pg.noindex) { add("error", "render-noindex", u, "JavaScript adds noindex (Google renders the page and obeys it)", mt.robotsMetas.join(" | ")); pg.noindex = true; pg.noindexJs = true; }
      if (hasNofollow(mt.robots) && !pg.nofollow) { add("error", "render-nofollow", u, "JavaScript adds nofollow: Google follows none of the page's links", mt.robotsMetas.join(" | ")); pg.nofollow = true; pg.nofollowJs = true; }
      {
        const a = robotsSet(pg.meta.robots), b = robotsSet(mt.robots);
        const gone = [...a].filter(x => !b.has(x)), added = [...b].filter(x => !a.has(x) && !/^(noindex|nofollow|none)$/.test(x));
        if (gone.length || added.length) add("error", "render-robots", u, `robots directives change after JavaScript${gone.length ? "; dropped: " + gone.join(", ") : ""}${added.length ? "; added: " + added.join(", ") : ""}`, "raw: " + (pg.meta.robotsMetas.join(" | ") || "(none)") + " → rendered: " + (mt.robotsMetas.join(" | ") || "(none)"));
      }
      if (pg.rLd < pg.meta.ld.length) add("error", "render-jsonld", u, `JSON-LD blocks drop from ${pg.meta.ld.length} to ${pg.rLd} after JavaScript`);
      if (pg.words > 40 && pg.rWords < pg.words * 0.5) add("warn", "render-thin", u, `after JavaScript the page shows ${pg.rWords} words and has ${pg.rLinks} links (raw HTML: ${pg.words} words, ${rawLinks} links) — Google indexes the rendered DOM`);
      if (rawLinks && pg.rLinks < rawLinks) add("info", "render-links", u, `links drop from ${rawLinks} to ${pg.rLinks} after JavaScript`);
      if (pg.rH1 !== 1) add("info", "render-h1", u, `${pg.rH1} H1 in the rendered DOM`);
      if (norm(textOf(body)) !== norm(pg.text)) checkVisibleChars(u + " (rendered)", body); // only what JavaScript added
      /* content that exists only after JavaScript: GPTBot, ClaudeBot and most AI fetchers never see it */
      const bag = s => { const m = new Map(); for (const w of norm(s).match(/[\p{L}\p{N}]+/gu) || []) m.set(w, (m.get(w) || 0) + 1); return m; };
      const rawBag = bag(pg.text), domBag = bag(textOf(body)); let extra = 0; const ex = [];
      for (const [w, c] of domBag) { const d = c - (rawBag.get(w) || 0); if (d > 0) { extra += d; if (ex.length < 12) ex.push(w); } }
      const rawHeads = new Set(all(pg.root, n => /^h[1-4]$/.test(n.tag)).map(h => norm(textOf(h))));
      const rawNorm = norm(pg.text);
      const newHeads = all(root, n => /^h[1-4]$/.test(n.tag)).map(h => norm(textOf(h))).filter(h => h && !rawHeads.has(h) && !rawNorm.includes(h));
      pg.jsOnlyWords = extra;
      if (extra > 20 || newHeads.length) add("warn", "render-only-content", u, `${extra} word(s)${newHeads.length ? " and " + newHeads.length + " heading(s)" : ""} exist only after JavaScript; GPTBot, ClaudeBot, PerplexityBot and most answer-engine fetchers read the raw HTML and never see them`, (newHeads.length ? "headings: " + newHeads.slice(0, 4).map(h => "«" + h.slice(0, 60) + "»").join(", ") + " — " : "") + "words: " + ex.join(" "));
      /* hidden text: a block of more than eight words a reader cannot see (cloaking, if it is
         keywords or a FAQ answer kept off screen). Screen-reader fraction readings are skipped. */
      for (const h of (pg.hiddenBlocks || [])) add(h.ariaHidden ? "info" : "error", "hidden-text", u, `${h.words} words hidden by ${h.why} in <${h.tag}${h.id ? "#" + h.id : ""}${h.cls ? "." + h.cls.trim().split(/\s+/).join(".") : ""}>${h.ariaHidden ? " (aria-hidden too)" : ""}; search engines discount or penalise text a reader cannot see`, h.text);
    });
    if (br) br.close();
  }

  /* per-page checks */
  const smSet = new Set(SITEMAP.map(s => s.base));
  const titles = new Map(), descs = new Map();
  for (const pg of htmlPages) {
    const w = pg.url, m = pg.meta; pg.ldLinks = [];
    const inSm = smSet.has(w);
    if (pg.hops.length > 1) add(inSm ? "error" : "warn", "redirect", w, `redirects: ${pg.hops.map(h => h.status + " " + shortUrl(h.url)).join(" → ")}`);
    const canon = m.canon.map(toBase);
    pg.indexable = pg.status === 200 && !pg.noindex && (!canon.length || canon[0] === w) && !pg.disallowed;
    if (inSm) {
      if (pg.noindex) add("error", "sitemap-noindex", w, `in the sitemap but noindex${pg.noindexJs ? " (added by JavaScript)" : ""}`, [m.robotsMetas.join(" | "), pg.rRobots && pg.noindexJs ? "rendered: " + pg.rRobots : "", pg.xrobots ? "X-Robots-Tag: " + pg.xrobots : ""].filter(Boolean).join("; "));
      if (pg.noindex && pg.noindexJs) issues[issues.length - 1].fam = "render"; // only a render can see it
      if (pg.nofollow) add("error", "sitemap-nofollow", w, "in the sitemap but nofollow (meta robots or X-Robots-Tag): Google follows none of its links, so the pages it links to lose that path", [m.robotsMetas.join(" | "), pg.xrobots ? "X-Robots-Tag: " + pg.xrobots : ""].filter(Boolean).join("; "));
      if (pg.nofollow && pg.nofollowJs) issues[issues.length - 1].fam = "render";
      if (m.robotsMetas.length > 1 && !pg.noindex) add("info", "robots-meta-multi", w, `${m.robotsMetas.length} robots metas; Google applies the most restrictive of them`, m.robotsMetas.join(" | "));
      if (canon.length && canon[0] !== w) add("error", "sitemap-canonical", w, "in the sitemap but canonical points elsewhere", m.canon[0]);
      const blocked = { search: [], training: [] };
      for (const b of BOTS) { const r = robotsAllowed(ROBOTS, b.name, new URL(w).pathname); if (!r.allow) blocked[b.kind === "training" ? "training" : "search"].push(b.name + " (" + r.rule + ")"); }
      if (blocked.search.length) add("error", "robots-blocks", w, `robots.txt blocks ${blocked.search.length} search / answer agent(s) from a sitemap page`, blocked.search.join(", "));
      if (blocked.training.length) add("warn", "robots-blocks-training", w, `robots.txt blocks ${blocked.training.length} training crawler(s) from a sitemap page (a choice, but research 2026-10-31 recommends keeping them in)`, blocked.training.join(", "));
    }
    if (pg.noindex || pg.disallowed) continue; // the rest only matters for pages meant to rank
    if (m.title.length !== 1) add("error", "title", w, `${m.title.length} <title> elements`);
    const title = m.title[0] || "";
    if (title) {
      if (title.length < 20) add("warn", "title-short", w, `title is ${title.length} chars`, title);
      if (title.length > 70) add("warn", "title-long", w, `title is ${title.length} chars; Google shows about 600 px (roughly 60–70 characters) and rewrites or cuts the rest`, title);
      else if (title.length > 60) add("info", "title-long", w, `title is ${title.length} chars; Google may cut it near 600 px`, title);
      if (!/قدراتي|Qudrati/.test(title)) add("warn", "title-brand", w, "title does not carry the brand «قدراتي»", title);
      if (!/القدرات|قدرات/.test(title.replace(/قدراتي/g, "")) && !/(about|privacy|terms|contact)/i.test(w) && !m.ld.flatMap(ldNodes).some(n => typesOf(n).some(t => /AboutPage|ContactPage/.test(t)))) add("warn", "title-topic", w, "title has no «القدرات» beside the topic (without it Google reads «الكمي» / «قانون» as other subjects — keyword research 2026-10-31)", title);
      if (!titles.has(title)) titles.set(title, []); titles.get(title).push(w);
    }
    if (m.desc.length !== 1) add(m.desc.length ? "warn" : "error", "description", w, `${m.desc.length} meta descriptions`);
    const d = m.desc[0] || "";
    if (d) { if (d.length < 50) add("warn", "description-short", w, `description is ${d.length} chars`, d); if (d.length > 170) add("info", "description-long", w, `description is ${d.length} chars; Google shows about 155–160`, d.slice(0, 80)); if (!descs.has(d)) descs.set(d, []); descs.get(d).push(w); }
    /* the text a share preview (og:description, og:image:alt, twitter:*), a screen reader and image
       search (img alt, aria-label, a role="img" figure's label) show: the same rules as the title —
       no «·», no emoji, no Latin digits — and every equation of plain numbers in it holds */
    {
      const metaV = (attr, name) => byTag(pg.root, "meta").filter(x => String(x.attrs[attr] || "").toLowerCase() === name).map(x => x.attrs.content || "");
      const fields = [["title", title], ["description", d], ["og:title", m.ogTitle || ""]];
      for (const n of ["og:description", "og:image:alt", "twitter:title", "twitter:description", "twitter:image:alt"]) for (const a of ["property", "name"]) for (const v of metaV(a, n)) fields.push([n, v]);
      const enAnc = x => { for (let y = x; y; y = y.parent) if (y.attrs && y.attrs.lang) return /^en/i.test(y.attrs.lang); return false; };
      for (const el of all(byTag(pg.root, "body")[0] || pg.root, x => x.attrs && (x.attrs.alt != null || x.attrs["aria-label"] != null))) {
        if (enAnc(el)) continue;
        if (el.attrs.alt) fields.push([`<${el.tag} alt>`, el.attrs.alt]);
        if (el.attrs["aria-label"]) fields.push([`<${el.tag}${el.attrs.role ? ` role="${el.attrs.role}"` : ""} aria-label>`, el.attrs["aria-label"]]);
      }
      const seenF = new Set(), seenEq = new Set();
      for (const [lbl, v] of fields) {
        if (!v || seenF.has(lbl + "\u0000" + v)) continue; seenF.add(lbl + "\u0000" + v);
        const bare = v.replace(/https?:\/\/\S+/g, "").replace(/\b[\w.-]+\.(xyz|com|sa|org|net|txt|apk|html|json|md|png|jpe?g|webp|svg)\b/gi, "").replace(/[\w.+-]+@[\w.-]+/g, "").replace(/Qudrati|qudrati\.xyz/g, "").replace(/[A-Za-z][A-Za-z.-]*(?:\s+[A-Za-z][A-Za-z.-]*)*\s+\d+\b|\b[A-Za-z]+\d+[A-Za-z\d]*\b/g, "");
        if (/·/.test(v)) add("error", "middle-dot", w, `«·» in ${lbl}`, v.slice(0, 200));
        if (/\p{Extended_Pictographic}|️/u.test(v.replace(/[✔✘✓★↔©®™]/g, ""))) add("error", "emoji", w, `emoji in ${lbl}`, v.slice(0, 200));
        if (/[0-9]/.test(bare)) add("error", "latin-digits", w, `Latin digits in ${lbl} (the project writes ٠–٩)`, v.slice(0, 200));
        if (v.includes("=")) for (const b of arithFails(v).bad) { const k = b.L + "=" + b.R; if (seenEq.has(k)) continue; seenEq.add(k); add("error", "math-wrong", w, `«${b.L} = ${b.R}» in ${lbl} does not hold: the left side is ${fmtNum(b.a)}`, v.slice(0, 160)); }
      }
      pg.attrTexts = fields.length;
    }
    if (canon.length !== 1) add("error", "canonical", w, `${canon.length} canonical links`);
    else {
      if (!m.canon[0].startsWith(CANON + "/")) add("error", "canonical-host", w, "canonical is not absolute on https://qudrati.xyz", m.canon[0]);
      if (m.ogUrl && m.ogUrl !== m.canon[0]) add("warn", "og-url", w, "og:url differs from the canonical", m.ogUrl + " vs " + m.canon[0]);
      if (m.ogUrl && offCanon(m.ogUrl)) add("warn", "link-noncanonical-host", w, `og:url uses ${offCanon(m.ogUrl)}`, m.ogUrl);
      if (!inSm && canon[0] === w) add("warn", "sitemap-unlisted", w, "indexable page not in the sitemap");
    }
    if (!m.ogUrl) add("info", "og", w, "no og:url");
    if (!m.ogImage) add("warn", "og", w, "no og:image");
    if (!m.ogSite) add("info", "og", w, "no og:site_name");
    if (m.lang !== "ar") add(/^en/.test(m.lang) && m.hreflang.length ? "info" : "error", "lang", w, `<html lang="${m.lang}">`);
    if (m.lang === "ar" && m.dir !== "rtl") add("error", "dir", w, `<html dir="${m.dir}">`);
    if (!m.viewport) add("error", "viewport", w, "no meta viewport");
    if (m.h1.length !== 1) add(m.h1.length ? "warn" : "error", "h1", w, `${m.h1.length} H1 elements in the HTML`, m.h1.join(" | "));
    const hs = all(pg.root, n => /^h[1-6]$/.test(n.tag)).map(n => Number(n.tag[1]));
    for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) { add("info", "heading-skip", w, `heading level jumps from h${hs[i - 1]} to h${hs[i]}`); break; }
    // a word doubled by a template («قوانين القوانين الهامة»)
    for (const h of all(pg.root, n => /^(h[1-6]|title)$/.test(n.tag))) {
      const raw = norm(textOf(h)).split(/\s+/), ws = raw.map(x => x.replace(/^(ال|وال|بال|لل)/, ""));
      const i = ws.findIndex((x, k) => k > 0 && x.length > 2 && x === ws[k - 1]);
      const inData = i > 0 && DATA && DATA.lessons.map(l => l.title).concat(DATA.rules.map(r => r.name)).some(s => norm(s).includes(raw[i - 1] + " " + raw[i]) || norm(s).replace(/\s*ـ\s*/g, " ").includes(raw[i - 1] + " " + raw[i]));
      if (i > 0 && !inData && !/ـ/.test(raw[i - 1] + raw[i])) add("warn", "heading-repeat", w, `«${h.tag}» repeats a word`, textOf(h));
    }
    // hreflang
    if (m.hreflang.length) {
      if (!m.hreflang.some(h => h.lang === "x-default")) add("warn", "hreflang", w, "hreflang set has no x-default");
      for (const h of m.hreflang) {
        if (!/^([a-z]{2,3}(-[A-Za-z]{2,4})?|x-default)$/.test(h.lang)) add("error", "hreflang", w, "invalid hreflang code", h.lang);
        const t = pages.get(stripHash(toBase(h.href))) || await fetchPage(stripHash(toBase(h.href)));
        if (t.status !== 200) { add("error", "hreflang", w, `hreflang target returns ${t.status}`, h.href); continue; }
        if (t.meta && !t.meta.hreflang.some(x => stripHash(toBase(x.href)) === w)) add("error", "hreflang", w, "hreflang target does not link back (no return tag)", h.href);
      }
    }
    // images
    for (const img of byTag(pg.root, "img")) {
      const src = img.attrs.src || ""; if (!("alt" in img.attrs)) add("error", "img-alt", w, "img without alt", src);
      if (!img.attrs.width || !img.attrs.height) add("warn", "img-size", w, "img without width/height (layout shift)", src);
      if (src && !src.startsWith("data:")) { const u = new URL(src, pg.finalUrl).href; if (isSite(u)) { const r = await sizeOf(toBase(u)); const b = r.wire == null ? r.raw : r.wire; if (r.status >= 400 || r.status === 0) add("error", "img-broken", w, `img returns ${r.status || r.error}`, src); else if (b == null) add("info", "weight-unknown", w, "img size could not be measured", src); else if (b > 150000) add("warn", "img-heavy", w, `img is ${kbBoth(r)}`, src); } }
    }
    // weight and render blocking
    const head = byTag(pg.root, "head")[0] || pg.root;
    const blocking = [];
    for (const l of byTag(head, "link")) if ((l.attrs.rel || "").toLowerCase() === "stylesheet" && !/print/.test(l.attrs.media || "") && !l.attrs.disabled && !(l.parent && l.parent.tag === "noscript")) blocking.push(l.attrs.href);
    for (const s of byTag(head, "script")) if (s.attrs.src && !("async" in s.attrs) && !("defer" in s.attrs) && (s.attrs.type || "") !== "module") blocking.push(s.attrs.src);
    let subBytes = 0, subWire = 0; const subs = [], unknownW = [];
    for (const l of byTag(pg.root, "link")) if (/stylesheet|preload|modulepreload/.test((l.attrs.rel || "").toLowerCase()) && l.attrs.href) subs.push(l.attrs.href);
    for (const s of byTag(pg.root, "script")) if (s.attrs.src) subs.push(s.attrs.src);
    for (const s of [...new Set(subs)]) {
      const u = new URL(s, pg.finalUrl).href; if (!isSite(u)) continue;
      const r = await sizeOf(toBase(u));
      if (r.status >= 400 || r.status === 0) { add("error", "asset-broken", w, `subresource returns ${r.status || r.error}`, s); continue; }
      if (r.raw == null) { unknownW.push(s); continue; }
      subBytes += r.raw; subWire += r.wire == null ? r.raw : r.wire;
    }
    if (unknownW.length) add("warn", "weight-unknown", w, `${unknownW.length} subresource(s) answered 200 but their size could not be measured; the page weight is a lower bound`, unknownW.join(", "));
    pg.subBytes = subBytes; pg.subWire = subWire; pg.blocking = blocking;
    /* weight as it travels: brotli (what Vercel sends a browser) decides the download; the raw
       size decides parse time and the 15 MB Googlebot cut-off, which no page here is near */
    pg.brBytes = pg.html ? zlib.brotliCompressSync(Buffer.from(pg.html), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length : pg.bytes;
    if (pg.brBytes > 60 * 1024 || pg.bytes > 400 * 1024) add("warn", "html-heavy", w, `HTML is ${kb(pg.bytes)}, ${kb(pg.brBytes)} brotli (budget: 60 KB on the wire, 400 KB raw)`);
    else if (pg.bytes > 100 * 1024) add("info", "html-heavy", w, `HTML is ${kb(pg.bytes)} raw but ${kb(pg.brBytes)} brotli on the wire (budget 60 KB); fine unless parse time shows in Lighthouse`);
    const heavyBlock = [];
    for (const b of blocking) { if (!b) continue; const u = new URL(b, pg.finalUrl).href; if (!isSite(u)) { heavyBlock.push(b + " (other origin)"); continue; } const r = await sizeOf(toBase(u)); if (r.raw == null) { heavyBlock.push(shortUrl(u) + " (size unknown)"); continue; } const n = r.raw; if (n > 20 * 1024) heavyBlock.push(shortUrl(u) + " " + kbBoth(r)); if (n > 100 * 1024) add(w === BASE + "/" ? "info" : "warn", "css-heavy", w, `render-blocking ${shortUrl(u.split("?")[0])} is ${kbBoth(r)} and blocks the first paint (Lighthouse 2026-10-31 on the live content pages with the app stylesheet: mobile 87, FCP 3.0 s)`); }
    if (heavyBlock.length) add(w === BASE + "/" ? "info" : "warn", "render-blocking", w, `${heavyBlock.length} render-blocking resource(s) in <head> that are cross-origin or over 20 KB`, heavyBlock.join(", "));
    // anchors
    for (const l of pg.links) {
      if (!l.text.trim() && !l.aria.trim() && !l.img.trim()) add("warn", "anchor-empty", w, "link with no text", l.href);
      else if (/^(اضغط هنا|هنا|المزيد|اقرأ المزيد|click here|here|more)$/i.test(l.text.trim())) add("info", "anchor-generic", w, "generic link text", l.text + " → " + l.href);
      if (l.abs && isSite(l.abs) && /\.html\/$/.test(new URL(l.abs).pathname)) add("error", "link-trailing-slash", w, "link to an .html/ URL (relative URLs break there)", l.href);
      if (/^(https?:)?\/\//i.test(l.href.trim())) { const why = offCanon(new URL(l.href.trim(), "https://qudrati.xyz/").href); if (why) add("warn", "link-noncanonical-host", w, `internal link uses ${why}, which redirects on the live site (one hop for every crawler and reader)`, l.href); }
    }
    // visible text
    checkVisibleChars(w, byTag(pg.root, "body")[0] || pg.root);
    const bodyText = textOf(byTag(pg.root, "body")[0] || pg.root, { sep: "\n" });
    checkClaims(w, bodyText + "\n" + title + "\n" + d, { noDot: true, tableRows: htmlTableRows(pg.root) });
    pg.countCells = checkCountTables(w, pg.root);
    pg.diffClaims = checkDifficulty(w, bodyText);
    checkMock(w, bodyText + "\n" + d, /mock/.test(new URL(w).pathname) || /تجريبي/.test(title));
    pg.examFacts = checkExamFacts(w, bodyText + "\n" + d);
    pg.faqStrict = checkFaqStrict(pg);
    pg.bankCards = checkBankCards(pg);
    pg.crossCounts = checkCrossCounts(pg);
    pg.images = await checkImages(pg);
    const ldStrings = ldText(m.ld);
    const dotAt = ldStrings.indexOf("·");
    if (dotAt >= 0) add("warn", "middle-dot", w, "«·» inside JSON-LD text (answer engines quote it)", ldStrings.slice(Math.max(0, dotAt - 50), dotAt + 50));
    checkClaims(w + " (JSON-LD)", ldStrings, { noDot: true });
    pg.examFacts += checkExamFacts(w + " (JSON-LD)", ldStrings);
    // exam facts need a deep official link
    const factish = /(العلمي|النظري)/.test(pg.text) && /الكمي/.test(pg.text) && /[0-9٠-٩]\s*[٪%]/.test(pg.text);
    if (factish) {
      const deep = pg.links.some(l => l.abs && /(^|\.)etec\.gov\.sa$|(^|\.)qiyas\.sa$/.test(new URL(l.abs).hostname) && new URL(l.abs).pathname.length > 4);
      if (!deep) add("warn", "fact-citation", w, "states exam percentages but links no specific ETEC page (only a home page or nothing)", FACTS ? "verified source: " + FACTS.gatPage : "");
    }
    // rule headings whose formula differs from js/data (read through the generator's fixes, GEN_FIX)
    if (DATA) {
      /* the lesson this page is about, by its LearningResource / Article name or its breadcrumb's last
         item: a heading on it names that lesson's rule first */
      const pageLesson = (() => {
        const t = new Set();
        for (const n of m.ld.flatMap(ldNodes)) {
          if (typesOf(n).some(x => /LearningResource|Article|Course/.test(x)) && n.name) t.add(norm(n.name));
          if (typesOf(n).includes("BreadcrumbList")) { const it = [].concat(n.itemListElement || []); const last = it[it.length - 1]; if (last) t.add(norm(last.name || (last.item && last.item.name) || "")); }
        }
        const l = DATA.lessons.find(l => t.has(norm(l.title))); return l ? l.key : null;
      })();
      const heads = all(pg.root, n => /^h[2-4]$/.test(n.tag));
      for (const h of heads) {
        const ht = skel(textOf(h));
        /* a rule heading is the rule's name, give or take «قانون» before it, «في القدرات» after it
           and a bracketed aside; section headings that merely contain the topic are not rule headings */
        const bare = s => skel(norm(s).replace(/\([^)]*\)/g, " ").replace(/^(قانون|قوانين|قاعده|حكم)\s+/, "").replace(/\s+في\s+(اختبار\s+)?القدرات.*$/, ""));
        /* the bracket a name ends in: «(أ)», «(١)», «(زيادة)» tell variants of one rule apart */
        const tagOf = s => { const mm = /\(([^()]*)\)\s*$/.exec(norm(s).replace(/\s+في\s+(اختبار\s+)?القدرات.*$/, "").trim()); return mm ? skel(mm[1]) : ""; };
        const hb = bare(textOf(h)), hTag = tagOf(textOf(h));
        const names = r => r.pName && r.pName !== r.name ? [r.name, r.pName] : [r.name];
        let cand = DATA.rules.filter(r => r.formula && skel(r.formula).length >= 6 && names(r).some(nm => skel(nm).length >= 5 && bare(nm) === hb));
        if (!cand.length) continue;
        /* a variant heading is compared with that variant only, and a lesson page's heading with its
           own lesson's rule: a sibling's or another lesson's formula under it is stale, not a pass */
        if (hTag) { const t = cand.filter(r => names(r).some(nm => tagOf(nm) === hTag)); if (t.length) cand = t; }
        if (pageLesson) { const t = cand.filter(r => r.lesson === pageLesson); if (t.length) cand = t; }
        const r = cand[0];
        const nameOf = x => `«${x.pName || x.name}» (${x.lesson} #${x.n}${x.pName && x.pName !== x.name ? ", the data's «" + x.name + "»" : ""})${cand.length > 1 ? " or " + (cand.length - 1) + " other rule(s) of that name" : ""}`;
        // the section: siblings after the heading until the next heading of the same or higher level
        const lvl = Number(h.tag[1]); const sib = h.parent.children; let i = sib.indexOf(h) + 1; const sec = [];
        for (; i < sib.length; i++) { const s = sib[i]; if (s.tag && /^h[1-6]$/.test(s.tag) && Number(s.tag[1]) <= lvl) break; sec.push(textOf(s.text != null ? { tag: "span", children: [s], attrs: {} } : s)); }
        let st = skel(sec.join(" ")) + ht;
        if (st === ht && h.parent && h.parent.parent) st = skel(textOf(h.parent.parent)); // a heading alone in its wrapper
        /* a section that labels its lines («القانون:», «بالكلمات:») is checked line by line, signs
           kept: one right line must not hide a wrong one */
        const secEls = []; for (let k = sib.indexOf(h) + 1; k < i; k++) if (sib[k].tag) secEls.push(sib[k]);
        const lineOf = label => { for (const el of secEls) for (const x of [el, ...all(el, y => /^(p|li|div|dd)$/.test(y.tag))]) { const t = textOf(x); const mm = new RegExp("^\\s*" + label + "\\s*:\\s*").exec(t); if (mm) return t.slice(mm[0].length); } return null; };
        const fLine = lineOf("القانون"), pLine = lineOf("بالكلمات");
        const same = (a, b) => { const x = sig(a), y = sig(b); return x === y || (y.length >= 6 && x.includes(y)); };
        /* the data's own wording, or the page's corrected one (DATA_FIX): either is current */
        const forms = x => x.pFormula && x.pFormula !== x.formula ? [x.pFormula, x.formula] : [x.formula];
        const plains = x => { const k = x.lesson + ":" + x.n; return [DATA.pPlain[k], DATA.plain[k]].filter((v, j, a) => v && a.indexOf(v) === j); };
        const carries = x => forms(x).some(f => st.includes(skel(f))) || plains(x).some(pl => skel(pl).length >= 6 && st.includes(skel(pl)));
        if (fLine != null || pLine != null) {
          const okF = x => fLine == null || forms(x).some(f => same(fLine, f));
          const okP = x => { const pl = plains(x); return pLine == null || !pl.length || pl.some(v => same(pLine, v)); };
          if (!cand.some(okF)) { const hard = numsDiffer(fLine, cand.flatMap(forms)); add(hard ? "error" : "warn", "rule-stale", w, `${nameOf(r)}: the «القانون:» line differs from the data's formula (${hard ? "its signs or numbers differ: a wrong formula" : "wording only; signs and numbers agree"})`, `page «${fLine.slice(0, 90)}» | data «${forms(r)[0].slice(0, 90)}»`); }
          else if (!cand.some(x => okF(x) && okP(x))) { const x = cand.find(okF); const hard = numsDiffer(pLine, cand.filter(okF).flatMap(plains)); add(hard ? "error" : "warn", "rule-stale", w, `${nameOf(x)}: the «بالكلمات:» line differs from teach.js's plain wording (${hard ? "its signs or numbers differ" : "wording only; signs and numbers agree"})`, `page «${pLine.slice(0, 90)}» | teach.js «${(plains(x)[0] || "").slice(0, 90)}»`); }
        } else if (!cand.some(carries)) add("warn", "rule-stale", w, `heading names the rule ${nameOf(r)} but its section does not carry the data's formula`, forms(r)[0].slice(0, 100));
      }
    }
    /* rule cards found by their anchor (<section id="handshakes">, the generator's ids): the worked
       example under «مثال:» is teach.js's (or the generator's own EX for a rule the data gives none) */
    if (DATA && RULE_AT) {
      const here = new URL(w).pathname; let cards = 0;
      for (const el of all(pg.root, x => x.attrs && x.attrs.id && RULE_AT.has(here + "#" + x.attrs.id))) {
        const at = ruleAt("#" + el.attrs.id, w); if (!at) continue;
        const exEl = all(el, y => /^(p|li|div|dd)$/.test(y.tag) && /^\s*مثال\s*:/.test(textOf(y))).sort((a, b) => textOf(a).length - textOf(b).length)[0];
        if (!exEl) continue;
        cards++;
        const got = textOf(exEl).replace(/^\s*مثال\s*:\s*/, "");
        const forms = exampleForms(at.rule, at);
        if (!forms.length) add("info", "rule-example-unsourced", w + "#" + el.attrs.id, `«${at.shown}» (${at.lesson} #${at.n}) shows a «مثال:» line, but neither teach.js nor the generator's EX has an example for it`, got.slice(0, 120));
        else if (!exampleOk(got, at.rule, at)) add("warn", "rule-example-stale", w + "#" + el.attrs.id, `«${at.shown}» (${at.lesson} #${at.n}): the «مثال:» line differs from ${DATA.example[at.rule.lesson + ":" + at.rule.n] ? "teach.js's example" : at.ex ? "the generator's EX example" : "the example inside the rule's formula"} (signs and numbers compared)`, `page «${got.slice(0, 110)}» | data «${forms[0].slice(0, 110)}»`);
      }
      pg.ruleCards = cards;
      /* tables that name a rule by its anchor in the first cell (the laws hub): the next cell is the
         rule's formula, the data's (or the page's corrected one) */
      let rows = 0;
      for (const tr of byTag(pg.root, "tr")) {
        const cells = tr.children.filter(c => c.tag === "th" || c.tag === "td"); if (cells.length < 2) continue;
        const a = byTag(cells[0], "a").find(x => /#/.test(x.attrs.href || "")); if (!a) continue;
        const at = ruleAt(a.attrs.href, pg.finalUrl || w); if (!at || !at.rule.formula) continue;
        rows++;
        const got = textOf(cells[1]);
        if (!formulaOk(got, at.rule)) add("error", "rule-row-stale", w, `the row for «${at.shown}» (${at.lesson} #${at.n}, ${a.attrs.href}) shows a formula that is not the data's (signs and numbers compared)`, `page «${got.slice(0, 110)}» | data «${formulaForms(at.rule)[0].slice(0, 110)}»`);
      }
      pg.ruleRows = rows;
    }
    /* every equation of plain numbers in the text holds («(٤ × ٣) ÷ ٢ = ١٢ ÷ ٢ = ٦»): read in the
       innermost text blocks, a quoted trap («… = ١٠» خطأ) left out (arithFails) */
    {
      const seen = new Set(); let eqs = 0;
      for (const el of all(pg.root, x => /^(p|li|td|th|dd|dt|h[2-6]|figcaption|summary|caption)$/.test(x.tag) && !all(x, y => y !== x && /^(p|li|td|dd)$/.test(y.tag)).length)) {
        const t = mathText(el); if (!t.includes("=")) continue;
        const r = arithFails(t); eqs += r.n;
        for (const b of r.bad) { const k = b.L + "=" + b.R; if (seen.has(k)) continue; seen.add(k); add("error", "math-wrong", w, `«${b.L} = ${b.R}» does not hold: the left side is ${fmtNum(b.a)}`, t.slice(0, 160)); }
      }
      pg.equations = eqs;
    }
    /* an exponent or an index drawn with <sup> / <sub> carries its sign for text readers (<span
       class="fr-sr pw">^</span>): without it the text reads «س٢» and a copy loses the power */
    {
      const bare = all(byTag(pg.root, "body")[0] || pg.root, x => (x.tag === "sup" || x.tag === "sub") && !all(x, y => y.tag === "span" && /\bfr-sr\b/.test(y.attrs.class || "")).length && !x.parent.attrs?.["aria-hidden"]);
      if (bare.length) add("warn", "sup-no-sign", w, `${bare.length} <sup>/<sub> without the hidden sign (<span class="fr-sr pw">^</span> or _): its text, and every copy or answer engine quoting it, loses the exponent`, bare.slice(0, 3).map(x => "«" + textOf(x.parent).slice(0, 50) + "»").join(", "));
    }
    pg.selfCounts = checkSelfCounts(pg, w, m, title, d);
    checkJsonLd(pg);
    pg.visibleDate = (byTag(pg.root, "time").map(t => t.attrs.datetime || textOf(t)).find(Boolean) || "");
    for (const t of byTag(pg.root, "time")) if (t.attrs.datetime != null && /^\d{4}-/.test(t.attrs.datetime.trim())) { const b = badDate(t.attrs.datetime); if (b) add("warn", "time-datetime", w, `<time datetime> is ${b}`, t.attrs.datetime + " «" + textOf(t).slice(0, 40) + "»"); else if (t.attrs.datetime.slice(0, 10) > today) add("warn", "time-datetime", w, "<time datetime> is in the future", t.attrs.datetime); }
  }
  {
    const sum = k => htmlPages.reduce((a, p) => a + (p[k] || 0), 0);
    log(`rule text: ${sum("ruleCards")} rule card example(s) and ${sum("ruleRows")} rule table row(s) against js/data, ${sum("equations")} equation(s) of plain numbers checked, ${sum("selfCounts")} count(s) a page states about itself against its own sections and cards, ${sum("attrTexts")} meta / alt / aria-label text(s), ${sum("examFacts")} exam fact(s) against facts.json`);
  }
  let llmsRules = null;
  if (llmsFull.status === 200) { llmsRules = checkLlmsFullRules(llmsFull.body); log(`llms-full.txt rules: ${llmsRules.rows} table row(s) against js/data, ${llmsRules.laws} rule line(s) of ${llmsRules.sections} page(s) against the page`); }
  for (const [t, us] of titles) if (us.length > 1) add("warn", "title-dup", us[0], `title shared by ${us.length} pages`, t + " — " + us.map(shortUrl).join(", "));
  for (const [t, us] of descs) if (us.length > 1) add("warn", "description-dup", us[0], `description shared by ${us.length} pages`, us.map(shortUrl).join(", "));
  /* one @id, one entity: every page that defines it must say the same name, alternateName, url,
     logo, sameAs and description (a field left out counts as a different answer) */
  const entityConflicts = [];
  for (const [id, defs] of ENTITIES) {
    if (defs.length < 2) continue;
    const diff = [];
    for (const k of ["name", "alternateName", "url", "logo", "sameAs", "description"]) {
      const groups = new Map(); for (const d of defs) { const v = d.fields[k] == null ? "(absent)" : d.fields[k]; if (!groups.has(v)) groups.set(v, []); groups.get(v).push(d.page); }
      if (groups.size > 1) diff.push(k + ": " + [...groups].map(([v, ps]) => `${v === "(absent)" ? v : v.slice(0, 70)} on ${ps.length} page(s) (${ps.slice(0, 3).join(", ")}${ps.length > 3 ? "…" : ""})`).join(" vs "));
    }
    /* the site's own two entities were made identical on every page (home owner, 2026-10-31): any
       difference in them now is a regression, an error; other entities stay a warning */
    if (diff.length) { entityConflicts.push(id); add(/#(org|website)$/.test(id) ? "error" : "warn", "entity-conflict", shortUrl(id), `${defs.length} pages define ${id} (${[...new Set(defs.map(d => d.type))].join(", ")}) and disagree on ${diff.length} field(s); define it once in full, the same everywhere, or reference it by {"@id"} alone`, diff.join(" | ")); }
  }
  if (NO_SAMEAS.size) add("info", "jsonld-sameas", "", `Organization has no sameAs on ${NO_SAMEAS.size} page(s) (only the user can create real profiles to point it at)`, [...NO_SAMEAS].slice(0, 8).join(", "));

  /* links: broken, redirected, missing fragments; orphans */
  const targets = new Map();
  for (const pg of htmlPages) for (const l of pg.links) if (l.abs && isSite(l.abs) && /^https?:/.test(l.abs)) { const k = toBase(l.abs); if (!targets.has(k)) targets.set(k, new Set()); targets.get(k).add(pg.url); }
  for (const pg of htmlPages) for (const u of pg.ldLinks || []) { const k = stripHash(toBase(u)); if (!targets.has(k)) targets.set(k, new Set()); targets.get(k).add(pg.url + " (JSON-LD)"); }
  await pool([...targets.keys()], 8, async t => {
    const base = stripHash(t), frag = t.includes("#") ? decodeURIComponent(t.split("#")[1]) : "";
    let rec = pages.get(base);
    if (!rec) { const r = await probe(base); rec = { status: r.status, hops: [{ url: base, status: r.status }] }; if (r.status >= 300 && r.status < 400) rec.hops.push({ url: r.location, status: "" }); }
    const from = [...targets.get(t)].map(shortUrl).slice(0, 4).join(", ");
    if (rec.status >= 400 || rec.status === 0) add("error", "link-broken", base, `internal link returns ${rec.status || "no response"}`, "from " + from);
    else if (rec.hops && rec.hops.length > 1) add("warn", "link-redirect", base, "internal link goes through a redirect", "from " + from + " → " + shortUrl(rec.hops[rec.hops.length - 1].url));
    if (frag && rec.ids && !rec.ids.has(frag) && frag !== "top") add("error", "link-fragment", t, `#${frag} does not exist on the target page`, "from " + from);
  });
  for (const pg of htmlPages) if (pg.indexable && pg.url !== BASE + "/") {
    const outs = new Set(pg.links.filter(l => l.abs && isSite(l.abs)).map(l => stripHash(toBase(l.abs))).filter(u => u !== pg.url && smSet.has(u)));
    pg.outContent = outs.size;
    if (smSet.size > 3 && outs.size < 3) add("info", "few-internal-links", pg.url, `links to ${outs.size} other sitemap page(s)`);
  }

  /* fonts: every @font-face src in the site's stylesheets, every preloaded font and every
     fonts.gstatic.com file a page names must answer 200 with a real font (wOF2 / wOFF / sfnt) */
  const fontUses = new Map(); const cssSeen = new Set();
  const addFont = (u, from) => { if (!fontUses.has(u)) fontUses.set(u, new Set()); fontUses.get(u).add(from); };
  for (const pg of htmlPages.filter(p => p.indexable)) {
    for (const l of byTag(pg.root, "link")) {
      const rel = (l.attrs.rel || "").toLowerCase(); if (!l.attrs.href) continue;
      const u = new URL(l.attrs.href, pg.finalUrl).href;
      if (rel.includes("preload") && (l.attrs.as || "") === "font") addFont(u, shortUrl(pg.url));
      if (rel.includes("stylesheet") && isSite(u)) cssSeen.add(stripHash(toBase(u)));
    }
    for (const m of (pg.html || "").matchAll(/https:\/\/fonts\.gstatic\.com\/[^"')\s]+/g)) addFont(m[0], shortUrl(pg.url));
    for (const s of byTag(pg.root, "style")) for (const m of textOf(s).matchAll(/url\(\s*["']?([^"')]+\.(?:woff2?|ttf|otf))["']?\s*\)/g)) addFont(new URL(m[1], pg.finalUrl).href, shortUrl(pg.url));
  }
  for (const c of cssSeen) {
    const r = await http(c); if (r.status !== 200) continue;
    for (const ff of r.body.match(/@font-face\s*\{[^}]*\}/g) || []) for (const m of ff.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) addFont(new URL(m[1], c).href, shortUrl(c.split("?")[0]));
  }
  const fontRes = {};
  await pool([...fontUses.keys()], 4, async u => {
    const r = await http(isSite(u) ? toBase(u) : u, { binary: true, headers: { range: "bytes=0-3" }, ua: "Mozilla/5.0" });
    const magic = r.buf.slice(0, 4).toString("latin1");
    const ok = (r.status === 200 || r.status === 206) && /^(wOF2|wOFF|OTTO|true|\x00\x01\x00\x00)/.test(magic);
    fontRes[shortUrl(u)] = r.status;
    if (!ok) add("error", "font-broken", u, `font returns ${r.status || r.error}${r.status === 200 || r.status === 206 ? ` but is not a font (starts «${JSON.stringify(magic)}»)` : ""}`, "used by " + [...fontUses.get(u)].slice(0, 4).join(", "));
  });
  if (fontUses.size) log(`fonts: ${fontUses.size} file(s), ${Object.values(fontRes).filter(s => s === 200 || s === 206).length} answer`);
  const fontVers = await checkFontVersions(fontUses);
  if (fontVers.length) log(`font versions: ${fontVers.map(f => `${f.path} sha1 ${f.sha1}, ${f.urls} URL(s)`).join("; ")}`);

  /* inbound links and orphans. A page Google rendered counts with the links in its rendered DOM
     (the home's pre-render links vanish when the app boots); a page nobody rendered counts with
     its raw HTML. `inRaw` keeps what a non-JS fetcher sees. */
  const rawTargets = pg => new Set(pg.links.filter(l => l.abs && /^https?:/.test(l.abs) && isSite(l.abs)).map(l => stripHash(toBase(l.abs))));
  const inboundOf = (t, rendered) => htmlPages.filter(p => p.url !== t && !p.noindex && !(p.disallowed && !smSet.has(p.url)) && (rendered && p.rTargets ? p.rTargets : rawTargets(p)).has(t)).map(p => p.url);
  for (const s of SITEMAP) {
    const pg = pages.get(s.base); if (!pg) continue;
    const inR = inboundOf(s.base, true), inRaw = inboundOf(s.base, false);
    pg.inbound = inR.length; pg.inRaw = inRaw.length;
    if (s.base === BASE + "/") continue;
    if (!inRaw.length) add("warn", "orphan", s.base, "no other crawled page links here in its HTML (reachable only through the sitemap)");
    else if (!inR.length) add("warn", "orphan-rendered", s.base, `linked only from HTML that JavaScript replaces (${inRaw.map(shortUrl).join(", ")}); Google's rendered link graph has no link to it`);
  }

  /* sitemap pages: status and date agreement */
  const gitDate = f => { try { return execFileSync("git", ["log", "-1", "--format=%cs", "--", f], { cwd: ROOT, encoding: "utf8" }).trim(); } catch (e) { return ""; } };
  const gitDirty = f => { try { return !!execFileSync("git", ["status", "--porcelain", "--", f], { cwd: ROOT, encoding: "utf8" }).trim(); } catch (e) { return false; } };
  const localRun = !LIVE && !flag("no-local", false) && fs.existsSync(path.join(ROOT, "index.html"));
  for (const s of SITEMAP) {
    const pg = pages.get(s.base);
    if (!pg) { add("error", "sitemap-unfetched", s.loc, "sitemap URL was not fetched"); continue; }
    if (pg.status !== 200) add("error", "sitemap-status", s.loc, `sitemap URL returns ${pg.status}`);
    if (pg.root && !/text\/html/.test(pg.ctype)) add("warn", "sitemap-type", s.loc, "content-type " + pg.ctype);
    if (pg.disallowed) add("error", "sitemap-disallowed", s.loc, "sitemap URL is disallowed by robots.txt");
    for (const im of s.images) { const r = await probe(toBase(im)); if (r.status !== 200) add("error", "sitemap-image", s.loc, `image:loc returns ${r.status}`, im); }
    if (pg.meta) {
      const nodes = pg.meta.ld.flatMap(ldNodes);
      const own = nodes.filter(n => n.dateModified && (n.url === s.loc || n["@id"] === s.loc || String(n["@id"] || "").startsWith(s.loc + "#") || n.mainEntityOfPage === s.loc));
      const dm = (own[0] || nodes.find(n => n.dateModified) || {}).dateModified;
      pg.dateModified = dm ? String(dm).slice(0, 10) : "";
      if (dm && s.lastmod && String(dm).slice(0, 10) !== s.lastmod.slice(0, 10)) add("warn", "date-mismatch", s.loc, `sitemap lastmod ${s.lastmod} but JSON-LD dateModified ${String(dm).slice(0, 10)}`);
      if (pg.visibleDate && dm && pg.visibleDate.slice(0, 10) !== String(dm).slice(0, 10)) add("warn", "date-mismatch", s.loc, `visible date ${pg.visibleDate} but dateModified ${String(dm).slice(0, 10)}`);
      if (!pg.visibleDate && nodes.some(n => typesOf(n).some(t => /Article|BlogPosting/.test(t)))) add("info", "date-visible", s.loc, "Article with no visible <time> «آخر تحديث» (answer engines prefer a dated page)");
    }
    if (localRun) {
      const rel = decodeURIComponent(new URL(s.loc).pathname).replace(/^\//, "") || "index.html";
      const file = path.join(ROOT, rel.endsWith("/") ? rel + "index.html" : rel);
      if (!fs.existsSync(file)) { add("error", "sitemap-file", s.loc, "no file on disk for this sitemap URL", rel); continue; }
      const dirty = gitDirty(file); const cd = dirty ? fs.statSync(file).mtime.toISOString().slice(0, 10) : gitDate(file);
      if (cd && s.lastmod && cd > s.lastmod.slice(0, 10)) add("warn", "lastmod-stale", s.loc, `the file changed on ${cd}${dirty ? " (uncommitted)" : ""} after its sitemap lastmod ${s.lastmod}; bump lastmod and dateModified when the change is content`);
    }
  }

  /* local files that would be public but are neither listed nor noindexed */
  if (localRun) {
    const skipDirs = new Set([".git", "node_modules", "tools", "assets", "js", "css", "research", "deck", ".vercel", ".claude"]);
    const files = [];
    (function rec(dir, rel) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { if (e.isDirectory()) { if (!skipDirs.has(e.name)) rec(path.join(dir, e.name), rel + e.name + "/"); } else if (/\.html$/.test(e.name)) files.push(rel + e.name); } })(ROOT, "");
    for (const f of files) {
      const u = BASE + "/" + f.split("/").map(encodeURIComponent).join("/");
      if (smSet.has(u) || f === "index.html" || (/\/index\.html$/.test(f) && smSet.has(BASE + "/" + f.replace(/index\.html$/, "")))) continue;
      const src = fs.readFileSync(path.join(ROOT, f), "utf8");
      const noidx = /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(src) || /<meta[^>]+content=["'][^"']*noindex[^>]+name=["']robots/i.test(src);
      const dis = !robotsAllowed(ROBOTS, "Googlebot", "/" + f).allow;
      let hdrNoidx = false; try { const vj0 = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")); hdrNoidx = /noindex/i.test(vercelSim(vj0, "/" + f).headers["x-robots-tag"] || ""); } catch (e) { }
      if (!noidx && !dis && !hdrNoidx) add("warn", "public-unlisted", "/" + f, "public HTML page: not in the sitemap, no noindex, not disallowed");
      else if (!noidx && dis) add("info", "public-disallowed-only", "/" + f, hdrNoidx
        ? "vercel.json sends X-Robots-Tag: noindex for it, but robots.txt disallows it, so Google never fetches it and never sees that header; it can still list the bare URL if something links to it (a meta noindex has the same blind spot — lifting the Disallow is what lets either work)"
        : "disallowed in robots.txt and no noindex (neither meta nor vercel.json header); Google can still list the bare URL if something links to it");
    }
    // vercel.json, as deployed config
    try {
      const vj = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
      /* every rule is run against sample requests (vercelSim), so the check judges what a request
         would get, not how a rule is spelled */
      const sim = (p, req) => vercelSim(vj, p, req);
      const want = (p, req, to, label) => { const r = sim(p, req).redirect; if (!r || r.to !== to || !/^30[178]$/.test(String(r.status))) add("warn", "vercel-redirect", "vercel.json", `${label}: ${req && req.host || "qudrati.xyz"}${p} should redirect (308) to ${to}; the rules give ${r ? r.status + " " + r.to + " (" + r.rule + ")" : "no redirect"}`); return r; };
      const vcfg = {};
      for (const host of ["qudrati-lime.vercel.app", "www.qudrati.xyz"]) {
        want("/", { host }, CANON + "/", host + " root");
        want("/qudrat-kami.html", { host }, CANON + "/qudrat-kami.html", host + " deep path");
      }
      const htmlLocs = SITEMAP.map(s => new URL(s.loc).pathname).filter(p => /\.html$/.test(p));
      const badSlash = htmlLocs.filter(p => { const r = sim(p + "/").redirect; return !r || r.to !== p; });
      vcfg.slashFixed = htmlLocs.length - badSlash.length;
      if (badSlash.length) add("warn", "vercel-trailing-slash", "vercel.json", `${badSlash.length} of ${htmlLocs.length} sitemap pages are not redirected from their /x.html/ variant (live served /qudrat-kami.html/ with 200 and its relative links 404, curl 2026-10-31); add {"source": "/(.*)\\\\.html/", "destination": "/$1.html", "statusCode": 308}`, badSlash.slice(0, 5).join(", "));
      for (const s of SITEMAP) {
        const p = new URL(s.loc).pathname, r = sim(p);
        if (r.redirect) add("error", "vercel-redirects-sitemap", s.loc, `vercel.json redirects a sitemap URL (${r.redirect.rule} → ${r.redirect.to})${r.redirect.rule === "trailingSlash: false" ? "; trailingSlash:false sends every canonical that ends in / away — use an explicit /(.*)\\.html/ rule instead" : ""}`);
        if (/noindex/i.test(r.headers["x-robots-tag"] || "")) add("error", "vercel-noindex-sitemap", s.loc, "vercel.json sends X-Robots-Tag noindex for a sitemap URL", (r.hits["x-robots-tag"] || []).join("; "));
        if (/immutable/.test(r.headers["cache-control"] || "")) add("error", "vercel-cache-html", s.loc, "an HTML page is cached as immutable; a content change would never reach returning readers", r.headers["cache-control"]);
      }
      const internal = ["/CLAUDE.md", "/qudrat-lessons-duolingo.md", "/design.md", "/tools/serve.js", "/preview.html", "/mobile.html"];
      /* .vercelignore (gitignore syntax: «/x» anchored at the root, else any depth, * and ** globs)
         keeps a file out of the deploy altogether */
      let ign = [];
      try { ign = fs.readFileSync(path.join(ROOT, ".vercelignore"), "utf8").split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith("#")); } catch (e) { }
      const ignRe = ign.filter(l => !l.startsWith("!")).map(l => { const anchored = l.startsWith("/"); const g = l.replace(/^\//, "").replace(/\/$/, ""); const body = g.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*"); return new RegExp((anchored ? "^/" : "(^|/)") + body + "(/|$)"); });
      const ignored = p => ignRe.some(re => re.test(decodeURIComponent(p)));
      vcfg.vercelignore = ign.length;
      for (const s of SITEMAP) if (ignored(new URL(s.loc).pathname)) add("error", "vercelignore-sitemap", s.loc, ".vercelignore keeps a sitemap page out of the deploy");
      for (const f of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/llms-full.txt", "/sw.js", "/index.html", "/js/app.js", "/css/style.css"]) if (ignored(f)) add("error", "vercelignore-shell", f, ".vercelignore keeps a file the site needs out of the deploy");
      const openInt = internal.filter(p => !ignored(p) && !/noindex/i.test(sim(p).headers["x-robots-tag"] || ""));
      vcfg.internalNoindex = internal.length - openInt.length;
      vcfg.internalIgnored = internal.filter(ignored).length;
      if (openInt.length) add("info", "vercel-xrobots", "vercel.json", `${openInt.length} internal file(s) get no X-Robots-Tag noindex; whether they stay public is the user's call`, openInt.join(", "));
      const ver = (/href="css\/style\.css\?v=(\d+)"/.exec(fs.readFileSync(path.join(ROOT, "index.html"), "utf8")) || [])[1] || "1";
      for (const p of ["/js/app.js", "/css/style.css"]) {
        const r = sim(p, { query: { v: ver } }); const cc = r.headers["cache-control"] || "";
        const age = Number((/max-age=(\d+)/.exec(cc) || [])[1] || 0);
        vcfg[p] = cc;
        if (age < 86400) add("info", "vercel-cache", "vercel.json", `${p}?v=${ver} would be served with «${cc || "Vercel's default max-age=0"}»; a versioned file can be cached for a year`);
        if ((r.hits["cache-control"] || []).length > 1) add("info", "vercel-cache-overlap", "vercel.json", `${(r.hits["cache-control"] || []).length} header rules set Cache-Control for ${p}?v=; the last one wins`, r.hits["cache-control"].join(" | "));
      }
      const swc = sim("/sw.js").headers["cache-control"] || "";
      if (/max-age=([1-9]\d*)/.test(swc)) add("error", "vercel-cache-sw", "/sw.js", "the service worker is cached; a new VERSION would not reach students", swc);
      if (vj.trailingSlash === false && SITEMAP.some(s => /.\/$/.test(new URL(s.loc).pathname))) add("error", "vercel-trailing-slash", "vercel.json", "\"trailingSlash\": false would redirect the sitemap's /dir/ URLs to /dir");
      VCFG = vcfg;
    } catch (e) { add("warn", "vercel-json", "vercel.json", "vercel.json does not parse", e.message); }
  }

  /* the IndexNow key file */
  const keyFile = (fs.readdirSync(ROOT).find(f => /^[0-9a-f]{32}\.txt$/.test(f)) || "");
  if (keyFile) { const r = await http(BASE + "/" + keyFile); if (r.status !== 200 || r.body.trim() !== keyFile.slice(0, 32)) add("error", "indexnow-key", "/" + keyFile, `IndexNow key file returns ${r.status} / content mismatch`); }

  /* bots: the same bytes for every user agent */
  const ref = await http(BASE + "/", { ua: GOOGLEBOT_MOBILE });
  await pool(BOTS.filter(b => b.ua), 4, async b => {
    for (const p of ["/", "/robots.txt", "/llms.txt"]) {
      const r = await http(BASE + p, { ua: b.ua, noCache: true });
      const r0 = p === "/" ? ref : await http(BASE + p, { ua: GOOGLEBOT_MOBILE });
      if (r.status !== 200) add(b.kind === "training" ? "warn" : "error", "bot-status", p, `${b.name} gets ${r.status || r.error}`);
      else if (p === "/" && Math.abs(r.bytes - r0.bytes) > 64) add("warn", "bot-different", p, `${b.name} gets ${r.bytes} bytes, Googlebot ${r0.bytes}`);
    }
  });

  /* live-only: hosts, redirects, headers */
  if (LIVE) {
    const expect = async (u, want, label, why) => { const r = await http(u, { noCache: true }); const ok = r.status >= 300 && r.status < 400 && r.location === want; if (!ok) add("error", "host-redirect", u, `${label}: expected a redirect to ${want}, got ${r.status} ${r.location || ""}${r.status === 200 && why ? " — " + why : ""}`); else if (r.status !== 308 && r.status !== 301) add("warn", "host-redirect-temp", u, `${label} redirects with ${r.status}; a permanent 308 passes the signals`); return r; };
    await expect("http://qudrati.xyz/", CANON + "/", "http → https");
    await expect("https://www.qudrati.xyz/", CANON + "/", "www → apex");
    await expect("https://www.qudrati.xyz/qudrat-kami.html", CANON + "/qudrat-kami.html", "www deep path");
    /* the old host's root once served the site with 200 while its deep paths redirected */
    await expect("https://qudrati-lime.vercel.app/", CANON + "/", "old vercel.app root", "the old host's root still serves the site. vercel.json's explicit «/» host rule covers it once deployed; if this persists after a deploy, the cause is outside vercel.json: set the domain to redirect in the Vercel dashboard (Domains → qudrati-lime.vercel.app → Redirect to qudrati.xyz, 308)");
    await expect("https://qudrati-lime.vercel.app/qudrat-kami.html", CANON + "/qudrat-kami.html", "old vercel.app deep path");
    if (SITEMAP.some(s => s.loc === CANON + "/qudrat/")) {
      await expect(CANON + "/qudrat", CANON + "/qudrat/", "/qudrat → the hub's canonical /qudrat/");
      await expect(CANON + "/qudrat/index.html", CANON + "/qudrat/", "/qudrat/index.html → /qudrat/");
    }
    /* .vercelignore keeps these out of the deploy; MASCOT-EDITS.md stays (mascot-edits.html reads it) behind a noindex header */
    for (const p of ["/CLAUDE.md", "/design.md", "/qudrat-lessons-duolingo.md"]) {
      const r = await http(CANON + p, { noCache: true, method: "HEAD" });
      if (r.status !== 404) add(r.status === 200 && /noindex/i.test(r.headers["x-robots-tag"] || "") ? "info" : "warn", "internal-deployed", p, `returns ${r.status}${r.headers["x-robots-tag"] ? " (X-Robots-Tag: " + r.headers["x-robots-tag"] + ")" : ""}; .vercelignore lists it, so after a deploy it should be 404`);
    }
    { const r = await http(CANON + "/MASCOT-EDITS.md", { noCache: true, method: "HEAD" }); if (r.status === 200 && !/noindex/i.test(r.headers["x-robots-tag"] || "")) add("warn", "internal-public", "/MASCOT-EDITS.md", "served with no X-Robots-Tag: noindex (vercel.json's /(.*)\\.(md|…) header rule)"); else if (r.status !== 200) add("info", "internal-gone", "/MASCOT-EDITS.md", `returns ${r.status}; mascot-edits.html fetches it`); }
    { const ver = (/css\/content\.css\?v=([\w.-]+)/.exec(pages.get(BASE + "/qudrat-kami.html") && pages.get(BASE + "/qudrat-kami.html").html || "") || [])[1];
      if (ver) { const r = await http(CANON + "/css/content.css?v=" + ver, { noCache: true, method: "HEAD" }); if (!/immutable/.test(r.headers["cache-control"] || "")) add("info", "cache-versioned", "/css/content.css?v=" + ver, `served with «${r.headers["cache-control"] || ""}»; vercel.json asks for max-age=31536000, immutable (deployed yet?)`); } }
    { const { final, hops } = await chain("https://qudrati-lime.vercel.app/qudrat-kami.html/", { noCache: true }); if (final.url !== CANON + "/qudrat-kami.html" || final.status !== 200 || hops.length > 3) add("error", "host-redirect", "https://qudrati-lime.vercel.app/qudrat-kami.html/", `old host + .html/ should land on ${CANON}/qudrat-kami.html in at most two redirects`, hops.map(h => h.status + " " + h.url).join(" → ")); }
    for (const s of SITEMAP.filter(s => /\.html$/.test(s.loc)).slice(0, 4)) {
      const r = await http(s.loc + "/", { noCache: true });
      if (r.status === 200) add("warn", "trailing-slash-200", s.loc + "/", "the .html/ variant returns 200 (its relative CSS and links 404); deploy the /(.*)\\.html/ → /$1.html 308 rule in vercel.json");
      else if (!(r.status >= 300 && r.status < 400 && r.location === s.loc)) add("warn", "trailing-slash-redirect", s.loc + "/", `the .html/ variant returns ${r.status} ${r.location || ""}; expected a 308 to ${s.loc}`);
    }
    for (const s of SITEMAP.filter(s => /.\/$/.test(new URL(s.loc).pathname))) { const r = await http(s.loc, { noCache: true, method: "HEAD" }); if (r.status !== 200) add("error", "sitemap-dir-redirect", s.loc, `a sitemap URL ending in / returns ${r.status} ${r.location || ""} (trailingSlash rule?)`); }
    const nf = await http(CANON + "/seo-audit-missing-" + Date.now(), { noCache: true });
    if (nf.status !== 404) add("error", "soft-404", "/seo-audit-missing", `a missing page returns ${nf.status}`);
    else if (!/text\/html/.test(nf.headers["content-type"] || "")) add("info", "404-page", "/seo-audit-missing", `the 404 is ${nf.headers["content-type"]} (${nf.bytes} B) with no way back to the site`);
    if (!home.headers["strict-transport-security"]) add("info", "hsts", "/", "no Strict-Transport-Security header");
    const vers = [...new Set([...home.body.matchAll(/(?:href|src)="((?:css|js)\/[\w/.-]+\?v=\d+)"/g)].map(m => m[1]))].slice(0, 4);
    for (const v of vers) { const r = await http(CANON + "/" + v, { method: "HEAD", noCache: true }); const cc = r.headers["cache-control"] || ""; const age = Number((/max-age=(\d+)/.exec(cc) || [])[1] || 0); if (age < 86400) add("info", "cache-versioned", "/" + v, `versioned asset served with «${cc}»; it can be cached for a year (max-age=31536000, immutable)`); }
    { const r = await http(CANON + "/sw.js", { method: "HEAD", noCache: true }); if (/max-age=([1-9]\d*)/.test(r.headers["cache-control"] || "")) add("error", "cache-sw", "/sw.js", "the service worker is cached; a new VERSION would not reach students", r.headers["cache-control"]); }
    for (const p of ["/CLAUDE.md", "/qudrat-lessons-duolingo.md", "/design.md", "/preview.html", "/mobile.html", "/tools/serve.js"]) {
      const r = await http(CANON + p, { noCache: true, binary: true });
      if (r.status === 200 && !/noindex/i.test(r.headers["x-robots-tag"] || "")) add("warn", "internal-public", p, `served (200, ${r.bytes} B) with no X-Robots-Tag: noindex — the user decides whether it stays public`);
    }
  }

  /* ETEC watch */
  let etec = null;
  if (FACTS && !OFFLINE) {
    etec = { checked: today };
    const r = await http(FACTS.gatPage, { ua: "Mozilla/5.0", timeout: 40000 });
    etec.status = r.status;
    if (r.status !== 200) add("warn", "etec-unreachable", FACTS.gatPage, `ETEC GAT page returned ${r.status || r.error}; facts could not be re-checked`);
    else {
      const tables = []; const re = /"markup":"((?:[^"\\]|\\.)*)"/g; let mm;
      while ((mm = re.exec(r.body))) { let h; try { h = JSON.parse('"' + mm[1] + '"'); } catch (e) { continue; } if (!/الجزء الكمي|الجزء اللفظي/.test(h)) continue; for (const tb of h.match(/<table[\s\S]*?<\/table>/g) || []) tables.push((tb.match(/<tr[\s\S]*?<\/tr>/g) || []).map(row => (row.match(/<td[\s\S]*?<\/td>/g) || []).map(c => c.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()))); }
      const read = {};
      for (const t of tables) for (const row of t.slice(1)) { const [lit, sci, dom] = row; read[dom] = { lit: /\d/.test(lit) ? Number(lit.replace("%", "")) : null, sci: /\d/.test(sci) ? Number(sci.replace("%", "")) : null }; }
      etec.table = read;
      const want = {}; for (const part of ["quant", "verbal"]) for (const dom of Object.keys(FACTS[part].sci)) want[dom] = { lit: FACTS[part].lit[dom], sci: FACTS[part].sci[dom] };
      const diffs = Object.keys(want).filter(d => !read[d] || read[d].lit !== want[d].lit || read[d].sci !== want[d].sci);
      if (!tables.length) add("warn", "etec-parse", FACTS.gatPage, "could not find ETEC's GAT tables in the page (layout changed?)");
      else if (diffs.length) add("error", "etec-changed", FACTS.gatPage, `ETEC's GAT table changed for ${diffs.join("، ")}; update tools/seo/facts.json and every page that quotes it`, JSON.stringify(diffs.map(d => [d, read[d], want[d]])));
      for (const [k, s] of Object.entries(FACTS.statements || {})) if (!norm(r.body).includes(norm(s).slice(0, 40))) add("warn", "etec-statement", FACTS.gatPage, `ETEC page no longer carries the «${k}» wording facts.json quotes`, s);
    }
    /* the official PDFs: the guide, and the others our pages cite (facts.json pdfs: ETEC's two
       practice tests). Each is watched for a new file (size, Last-Modified) and for its own last
       /ModDate (incremental saves append one, so the last is the newest) */
    const watchPdf = async (doc, isGuide) => {
      const code = isGuide ? "etec-guide" : "etec-pdf";
      const name = isGuide ? "the official guide PDF" : `ETEC's PDF «${doc.title || doc.url}»`;
      const h = await http(doc.url, { method: "HEAD", ua: "Mozilla/5.0", timeout: 40000 });
      const out = { status: h.status, length: h.headers["content-length"], lastModified: h.headers["last-modified"] };
      if (h.status !== 200) { add("warn", code, doc.url, `${name} returned ${h.status || h.error}`); return out; }
      if (String(h.headers["content-length"]) !== String(doc.contentLength) || (h.headers["last-modified"] && doc.lastModified && h.headers["last-modified"] !== doc.lastModified)) add("warn", code + "-changed", doc.url, `ETEC replaced ${name} (${h.headers["content-length"]} B, ${h.headers["last-modified"]}; facts.json has ${doc.contentLength} B, ${doc.lastModified}) — re-read it${doc.quotedOn ? " and " + doc.quotedOn.join(", ") : ""}`);
      const tail = await http(doc.url, { ua: "Mozilla/5.0", timeout: 60000, binary: true, headers: { range: "bytes=-262144" } });
      const md = tail.buf ? [...tail.buf.toString("latin1").matchAll(/\/ModDate\s*\(D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/g)].map(m => `${m[1]}-${m[2]}-${m[3]}`).sort().pop() : null;
      out.modDate = md || null;
      if (doc.modDate && md && md !== doc.modDate.slice(0, 10)) add("warn", code + "-changed", doc.url, `${name}'s ModDate is ${md}; facts.json read it at ${doc.modDate} — re-read its pages and every page that cites it`);
      else if (!md) add("info", code + "-moddate", doc.url, `no /ModDate in the last 256 KB of ${name} (got ${tail.status}, ${tail.bytes} B)`);
      return out;
    };
    const g = await watchPdf(FACTS.guidePdf, true);
    etec.guide = g;
    etec.pdfs = {};
    for (const d of FACTS.pdfs || []) etec.pdfs[d.url] = await watchPdf(d, false);
    const qs = await http(FACTS.qudratiSeries.url, { ua: "Mozilla/5.0", timeout: 40000 });
    if (qs.status === 200 && !qs.body.includes(FACTS.qudratiSeries.name)) add("info", "etec-series", FACTS.qudratiSeries.url, "ETEC's «اختبارات قدراتي» page no longer names the series");
    /* ETEC's items carry their own updateDate in the page's embedded JSON («"updateDate":…,"id":"<guid>"») */
    const itemDate = (body, id) => { let i = -1; const got = []; while ((i = body.indexOf('"id":"' + id + '"', i + 1)) >= 0) { const m = [...body.slice(Math.max(0, i - 1500), i).matchAll(/"updateDate":"([^"]+)"/g)].pop(); if (m) got.push(m[1]); } return got[0] || null; };
    etec.items = {};
    for (const it of FACTS.items || []) {
      const src = it.url === FACTS.gatPage ? r : it.url === FACTS.qudratiSeries.url ? qs : await http(it.url, { ua: "Mozilla/5.0", timeout: 40000 });
      const d = src.status === 200 ? itemDate(src.body, it.id) : null;
      etec.items[it.id] = d;
      if (src.status !== 200) continue;
      if (!d) add("warn", "etec-item-missing", it.url, `ETEC's page no longer carries the item ${it.id} («${it.name}»)`);
      else if (d !== it.updateDate) add("warn", "etec-item-updated", it.url, `ETEC updated «${it.name}» on ${d} (facts.json read it at ${it.updateDate}); re-read it and the pages quoting it (${(it.quotedOn || []).join(", ") || "see facts.json"}), then update facts.json`);
    }
    /* every ETEC / Qiyas link our indexable pages cite: it must resolve, and an item page must still carry its item */
    const cited = new Map();
    for (const pg of htmlPages.filter(p => p.indexable)) for (const l of pg.links) { try { const x = new URL(l.abs); if (/(^|\.)etec\.gov\.sa$|(^|\.)qiyas\.sa$/.test(x.hostname)) { const k = stripHash(x.href); if (!cited.has(k)) cited.set(k, new Set()); cited.get(k).add(shortUrl(pg.url)); } } catch (e) { } }
    etec.links = {};
    await pool([...cited.keys()], 3, async u => {
      const isPdf = /\.pdf$/i.test(new URL(u).pathname);
      const res = isPdf ? await http(u, { method: "HEAD", ua: "Mozilla/5.0", timeout: 40000 }) : (u === FACTS.gatPage ? r : u === FACTS.qudratiSeries.url ? qs : await http(u, { ua: "Mozilla/5.0", timeout: 40000 }));
      const id = (/\/p\/p-([0-9a-f-]{36})/.exec(u) || [])[1];
      const d = id && res.status === 200 ? itemDate(res.body, id) : null;
      etec.links[u] = { status: res.status, updateDate: d, from: [...cited.get(u)] };
      const from = [...cited.get(u)].slice(0, 4).join(", ");
      if (res.status >= 400 || res.status === 0) add("error", "etec-link-broken", u, `cited ETEC link returns ${res.status || res.error}`, "from " + from);
      else if (res.status >= 300 && res.status < 400) add(/not-found|404/.test(res.location || "") ? "error" : "warn", "etec-link-redirect", u, `cited ETEC link redirects to ${res.location}`, "from " + from);
      else if (id && !d) add("error", "etec-link-empty", u, "cited ETEC item page returns 200 but no longer carries its item (the SPA's not-found)", "from " + from);
      else if (id && !(FACTS.items || []).some(x => x.id === id)) add("info", "etec-link-unwatched", u, `cited ETEC item (updateDate ${d}) is not in facts.json items, so a change to it would go unnoticed`, "from " + from);
      else if (isPdf && res.status === 200 && u !== stripHash(FACTS.guidePdf.url) && !(FACTS.pdfs || []).some(x => stripHash(x.url) === u)) add("info", "etec-pdf-unwatched", u, "cited ETEC PDF is not in facts.json (guidePdf or pdfs), so a new version of it would go unnoticed", "from " + from);
    });
    log(`ETEC watch: GAT page ${r.status}, guide ${g.status} (${etec.guide.length} B, ModDate ${etec.guide.modDate || "?"}), ${Object.keys(etec.pdfs).length} other PDF(s) (${Object.values(etec.pdfs).map(p => p.status + " " + (p.modDate || "?")).join(", ") || "none"}), ${cited.size} cited ETEC link(s)`);
  }

  /* external links (status only; 403 from bot-shy sites is informational) */
  if (!OFFLINE) {
    const ext = new Map();
    for (const pg of htmlPages.filter(p => p.indexable)) for (const l of pg.links) if (l.abs && /^https?:/.test(l.abs) && !isSite(l.abs)) { const k = stripHash(l.abs); if (!ext.has(k)) ext.set(k, pg.url); }
    await pool([...ext.keys()].slice(0, 80), 6, async u => {
      let r = await http(u, { method: "HEAD", ua: "Mozilla/5.0", timeout: 20000 });
      if (r.status === 405 || r.status === 0 || r.status === 403) r = await http(u, { ua: "Mozilla/5.0", timeout: 25000, headers: { range: "bytes=0-2047" } });
      if (r.status === 404 || r.status === 410) add("error", "external-broken", ext.get(u), `external link returns ${r.status}`, u);
      else if (r.status >= 500 || r.status === 0) add("info", "external-unreachable", ext.get(u), `external link: ${r.status || r.error}`, u);
      else if (r.status >= 300 && r.status < 400 && r.location && /page-not-found|404/.test(r.location)) add("error", "external-broken", ext.get(u), "external link redirects to a not-found page", u + " → " + r.location);
    });
  }

  /* opportunities */
  const opp = {};
  const LESSON_PAGE = new Map(); // lesson key -> its own indexable page (by its structured data or H1)
  /* a rule's name with its running number dropped: «السرعة المتوسطة (١)» and a heading
     «السرعة المتوسطة (٢)» name the same rule */
  const unNum = s => skel(norm(s).replace(/\(\s*[0-9٠-٩]+\s*\)/g, " "));
  const indexable = htmlPages.filter(p => p.indexable);
  const headsOf = p => all(p.rRoot || p.root, n => /^h[1-4]$/.test(n.tag)).map(h => unNum(textOf(h)));
  if (DATA) {
    const headTexts = indexable.flatMap(headsOf);
    const named = DATA.rules.filter(r => unNum(r.name).length >= 6);
    /* a rule is covered by a heading in the data's name or the name the page shows (NAME_FIX) */
    const rNames = r => [r.name, r.pName].filter((v, i, a) => v && a.indexOf(v) === i).map(unNum).filter(x => x.length >= 6);
    const covered = named.filter(r => rNames(r).some(n => headTexts.some(h => h.includes(n))));
    opp.ruleHeadings = { covered: covered.length, of: named.length, missingSample: named.filter(r => !covered.includes(r)).slice(0, 12).map(r => r.lesson + ": " + r.name) };
    /* what the lesson pages print differently from js/data on purpose (tools/build_lesson_pages.js):
       not stale, but each one is a fix still to make at the source */
    if (GEN_FIX_ERR) add("warn", "source-fix-unread", "tools/build_lesson_pages.js", `could not read its DATA_FIX / TEXT_FIX / NAME_FIX, so the pages are compared with the raw data and its corrections show as stale`, GEN_FIX_ERR);
    else if (DATA.fixes.length) {
      const where = f => f.kind === "TEXT_FIX" ? "qudrat-lessons-duolingo.md, js/data/teach.js, js/data/learn.js" : f.kind === "NAME_FIX" ? "qudrat-lessons-duolingo.md (rule name)" : `qudrat-lessons-duolingo.md${f.rule ? " and the rule's card in js/data/teach.js" : ""} (${f.field})`;
      const row = f => (f.kind === "TEXT_FIX" ? `«${f.from}» → «${f.to}» everywhere (${f.inData}× in js/data)` : f.kind === "NAME_FIX" ? `${f.tk} «${f.rule}» shown as «${f.to}»` : `${f.tk}${f.rule ? " «" + f.rule + "»" : ""}.${f.field}: «${f.from}» → «${f.to}»${f.compared ? "" : " (a field this audit does not compare)"}`) + ` — in ${where(f)}` + (f.inData ? "" : " — NO LONGER IN THE DATA: fixed at the source, remove the row");
      opp.sourceFixes = DATA.fixes.length;
      add("info", "source-fix-pending", "tools/build_lesson_pages.js", `${DATA.fixes.length} correction(s) the lesson pages make to js/data on purpose (${DATA.fixes.filter(f => f.kind === "DATA_FIX").length} DATA_FIX, ${DATA.fixes.filter(f => f.kind === "TEXT_FIX").length} TEXT_FIX, ${DATA.fixes.filter(f => f.kind === "NAME_FIX").length} NAME_FIX); the pages are compared through them, and each is a fix for the user to make at the source, then rerun python tools/import_curriculum.py`, DATA.fixes.map(row).join(" | "));
    }
    add("info", "gap-rule-headings", "", `${covered.length} of ${named.length} named rules in js/data have a heading on an indexable page`, opp.ruleHeadings.missingSample.slice(0, 6).join(" | "));
    /* a lesson's page: its structured data names the lesson (LearningResource / Article / Course
       name or the breadcrumb's last item), or its H1 does */
    const lessonPage = l => indexable.find(p => {
      const nodes = p.meta.ld.flatMap(ldNodes); const t = norm(l.title);
      if (nodes.some(n => typesOf(n).some(x => /LearningResource|Article|Course/.test(x)) && norm(n.name || "") === t)) return true;
      if (nodes.some(n => typesOf(n).includes("BreadcrumbList") && (() => { const it = [].concat(n.itemListElement || []); const last = it[it.length - 1]; return last && norm(last.name || (last.item && last.item.name) || "") === t; })())) return true;
      return p.meta.h1.some(h => skel(h).includes(skel(l.title)));
    });
    const lp = DATA.lessons.map(l => ({ l, p: lessonPage(l) }));
    for (const x of lp) if (x.p) LESSON_PAGE.set(x.l.key, x.p);
    opp.lessonPages = { withPage: lp.filter(x => x.p).length, of: DATA.lessons.length, missing: lp.filter(x => !x.p).map(x => x.l.key) };
    add(opp.lessonPages.missing.length ? "warn" : "info", "gap-lesson-pages", "", `${opp.lessonPages.withPage} of ${DATA.lessons.length} lessons have their own indexable page (matched by its LearningResource / Article name, breadcrumb or H1)`, opp.lessonPages.missing.join(", "));
    // latest autocomplete snapshot
    const sdir = path.join(SEO, "suggest");
    const snaps = fs.existsSync(sdir) ? fs.readdirSync(sdir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort() : [];
    if (snaps.length) {
      const snap = JSON.parse(fs.readFileSync(path.join(sdir, snaps[snaps.length - 1]), "utf8"));
      const sugg = new Set(); for (const v of Object.values(snap.results || {})) for (const s of [].concat(v.g || [], v.b || [])) if (/قدرات|كمي/.test(s)) sugg.add(s);
      const gaps = [];
      for (const s of sugg) { const ks = skel(s); const r = named.find(r => rNames(r).some(n => ks.includes(n) || ks.includes(n.replace(/^ال/, "")))); if (r && !rNames(r).some(n => headTexts.some(h => h.includes(n)))) gaps.push(s + " → " + r.lesson + " «" + r.name + "»"); }
      opp.suggestGaps = gaps;
      const age = Math.round((Date.parse(today) - Date.parse(snaps[snaps.length - 1].slice(0, 10))) / 864e5);
      add("info", "gap-autocomplete", "", `${gaps.length} autocomplete suggestion(s) in ${snaps[snaps.length - 1]} name a rule we have but no page heading`, gaps.slice(0, 6).join(" | "));
      if (age > 35) add("info", "suggest-old", "tools/seo/suggest", `the last autocomplete snapshot is ${age} days old; run node tools/seo/suggest.js (monthly)`);
    } else add("info", "gap-autocomplete", "", "no autocomplete snapshot yet (node tools/seo/suggest.js)");
  }
  /* the student questions: does a page answer each? Judged twice: on the DOM Google renders (a
     page that was rendered) and on the raw HTML most AI fetchers read. An answer that exists
     only before JavaScript runs is «raw-only». */
  try {
    const aq = JSON.parse(fs.readFileSync(path.join(SEO, "ai-queries.json"), "utf8"));
    const res = [], notCrawled = [];
    for (const q of aq.queries || []) {
      const e = q.expect || {}; const want = [];
      /* each wanted text is a list of alternatives: a rule's formula as the data writes it or as the
         page corrects it (DATA_FIX), and its plain wording either way */
      const rq = e.rule && DATA ? DATA.rules.find(r => r.lesson === e.rule.lesson && r.n === e.rule.n) : null;
      if (e.rule && DATA && !rq) add("warn", "ai-query-rule", "tools/seo/ai-queries.json", `${q.id}: rule ${e.rule.lesson} #${e.rule.n} not in js/data`);
      if (rq) want.push([rq.formula, rq.pFormula]);
      for (const t of e.text || []) want.push([t]);
      const pls = rq ? [DATA.plain[rq.lesson + ":" + rq.n], DATA.pPlain[rq.lesson + ":" + rq.n]].map(x => skel(x || "")).filter(x => x.length >= 6) : [];
      const carries = txt => { const pt = skel(txt); return want.every(alts => alts.some(t => t && pt.includes(skel(t))) || pls.some(pl => pt.includes(pl))) && (!e.textAny || e.textAny.some(t => pt.includes(skel(t)))); };
      const cands = indexable.filter(p => !e.titleHas || e.titleHas.some(x => (p.meta.title[0] || "").includes(x)));
      const okRaw = cands.filter(p => carries(p.text));
      const okG = cands.filter(p => carries(p.rText != null ? p.rText : p.text));
      const ruleNames = rq ? [rq.name, rq.pName].filter((v, i, a) => v && a.indexOf(v) === i).map(unNum) : [];
      /* a heading that names the rule; on a hub query (titleHas: «قوانين القدرات») a table row whose
         first cell names it counts the same, since a hub lists its rules as rows */
      const rowHeads = p => all(p.rRoot || p.root, n => n.tag === "tr").map(tr => { const c = all(tr, x => x.tag === "th" || x.tag === "td")[0]; return c ? unNum(textOf(c)) : ""; });
      const headed = p => ruleNames.some(rn => headsOf(p).some(h => h.includes(rn)) || (!!e.titleHas && rowHeads(p).some(h => h.includes(rn))));
      /* the page an engine should pick: a heading naming the rule first, then the most query
         words in its title and H1, then a dedicated page over the all-rules hub */
      const qWords = norm(q.query).split(/\s+/).filter(x => x.length > 2 && !/^(قدرات|القدرات|اختبار|في|من|مع)$/.test(x));
      const score = p => (headed(p) ? 100 : 0) + qWords.filter(x => norm((p.meta.title[0] || "") + " " + p.meta.h1.join(" ")).includes(x)).length * 10 - (/laws/.test(p.url) && !e.titleHas ? 5 : 0);
      const best = list => list.slice().sort((a, b) => score(b) - score(a))[0];
      let hit = best(okG), rawOnly = false;
      if (!hit && okRaw.length) { hit = best(okRaw); rawOnly = true; }
      const bestG = hit && !rawOnly ? hit : null;
      /* a query about one rule is meant for that rule's lesson page; ai-queries.json names it
         (`page`), and a `page` that is not the lesson's own page is a stale row */
      const lessonPg = rq && !e.titleHas ? LESSON_PAGE.get(rq.lesson) : null;
      if (lessonPg && q.page && q.page !== shortUrl(lessonPg.url) && !q.pageWhy) add("warn", "ai-query-page-lesson", "tools/seo/ai-queries.json", `${q.id}: \`page\` is ${q.page}, but the rule ${rq.lesson} #${rq.n} «${rq.pName}» is taught on ${shortUrl(lessonPg.url)}; point the query at its lesson page (or say why not)`);
      const intended = q.page || (lessonPg ? shortUrl(lessonPg.url) : null);
      if (rq && !e.titleHas && !intended) add("warn", "ai-query-page-lesson", "tools/seo/ai-queries.json", `${q.id}: the rule's lesson ${rq.lesson} has no page of its own, so no page is meant to answer «${q.query}»`);
      if (intended) { // the page we mean to answer it
        const mG = okG.find(p => shortUrl(p.url) === intended), mR = okRaw.find(p => shortUrl(p.url) === intended);
        if (mG) { hit = mG; rawOnly = false; }
        else if (mR) { hit = mR; rawOnly = true; }
        else if (!pages.get(BASE + intended)) notCrawled.push(q.id + " → " + intended);
        else add("warn", "ai-query-page", intended, `${q.id}: the page meant to answer «${q.query}» does not carry the answer${hit ? " (" + shortUrl(hit.url) + " does)" : ""}`);
        /* another of our pages would be the better answer (a heading that names the rule, more of the
           query's words in its title and H1): an engine may pick it over the lesson page */
        if (mG && bestG && bestG !== mG && score(bestG) > score(mG) && !q.pageWhy) add("warn", "ai-query-best-page", intended, `${q.id}: «${q.query}» is meant for ${intended}, but ${shortUrl(bestG.url)} answers it better (score ${score(bestG)} against ${score(mG)}: ${headed(bestG) ? "a heading names the rule" : "no rule heading"} there, ${headed(mG) ? "a heading names it" : "no heading names it"} here)`);
      }
      res.push({ id: q.id, query: q.query, page: hit ? shortUrl(hit.url) : null, intended, onIntended: !!(hit && intended && shortUrl(hit.url) === intended), rawOnly, headed: !!(hit && headed(hit)), pages: okG.length });
    }
    opp.queries = res;
    if (notCrawled.length) add("warn", "ai-query-page-missing", "tools/seo/ai-queries.json", `${notCrawled.length} quer${notCrawled.length === 1 ? "y's" : "ies'"} intended page${notCrawled.length === 1 ? " was" : "s were"} not found on this site (not deployed yet, or not linked from the sitemap / crawl)`, notCrawled.join(", "));
    const ansG = res.filter(r => r.page && !r.rawOnly), raw = res.filter(r => r.page && r.rawOnly), none = res.filter(r => !r.page);
    /* rule queries aimed at one rule (a hub query, with titleHas, answers from a table instead) */
    const oneRule = (aq.queries || []).filter(q => q.expect && q.expect.rule && !q.expect.titleHas).map(q => q.id);
    const hubRule = (aq.queries || []).filter(q => q.expect && q.expect.rule && q.expect.titleHas).map(q => q.id);
    const hd = res.filter(r => r.headed && oneRule.includes(r.id)).length, ruleQs = oneRule.length;
    const hubHd = res.filter(r => r.headed && hubRule.includes(r.id)).length;
    if (hubRule.length) add(hubHd < hubRule.length ? "warn" : "info", "ai-queries-hub", "tools/seo/ai-queries.json", `${hubHd} of ${hubRule.length} hub rule queries land on a page that names the rule in a heading or a table row's first cell`, res.filter(r => hubRule.includes(r.id)).map(r => r.id + " → " + (r.page || "none") + (r.headed ? "" : " (not named)")).join(", "));
    add(none.length ? "warn" : "info", "ai-queries", "tools/seo/ai-queries.json", `${ansG.length} of ${res.length} student queries are answered in the DOM Google renders, ${raw.length} only in raw HTML (AI fetchers that do not run JavaScript), ${none.length} nowhere; ${hd} of ${ruleQs} rule queries land on a heading that names the rule; ${res.filter(r => r.intended).length} of ${res.length} have a page meant to answer them, ${res.filter(r => r.onIntended && !r.rawOnly).length} answered there in the rendered DOM`, [none.length ? "unanswered: " + none.map(r => r.id).join(", ") : "", raw.length ? "raw-only: " + raw.map(r => r.id + " → " + r.page).join(", ") : ""].filter(Boolean).join(" | ") || ansG.slice(0, 8).map(r => r.id + " → " + r.page).join(" | "));
    const unlogged = (aq.queries || []).filter(q => !(aq.log || []).some(l => l.id === q.id));
    if (unlogged.length) add("info", "ai-queries-unchecked", "tools/seo/ai-queries.json", `${unlogged.length} of ${(aq.queries || []).length} queries have never been checked by hand in an answer engine (log is empty for them); see logFormat in the file`);
  } catch (e) { add("warn", "ai-queries", "tools/seo/ai-queries.json", "could not read ai-queries.json", e.message); }

  /* local: the committed generators in --check mode (a stale output is an error named after
     it) and the data validators. --no-generators skips both. */
  let gens = null, vals = null;
  if (localRun && !flag("no-generators", false)) {
    gens = runGenerators();
    for (const g of gens) {
      if (g.skipped) continue;
      if (g.code !== 0) add("error", "generator-stale", "tools/" + g.gen, g.stale.length ? `${g.stale.length} output(s) out of date: rerun node tools/${g.gen}` : `node tools/${g.gen} --check exits ${g.code}`, (g.stale.length ? g.stale.join(", ") + " — " : "") + g.tail);
    }
    vals = runValidators();
    for (const v of vals) if (v.code !== 0) add("error", "data-validator", "tools/" + v.v, `node tools/${v.v} exits ${v.code}`, v.tail);
    log(`generators: ${gens.map(g => g.gen + " " + (g.skipped ? "(" + g.skipped + ")" : g.code === 0 ? "up to date" : "STALE " + (g.stale.join(", ") || "exit " + g.code))).join("; ")}`);
    log(`validators: ${vals.map(v => v.v + " " + (v.code === 0 ? "ok" : "exit " + v.code)).join("; ")}`);
  }

  /* Lighthouse, mobile, on the pages and budgets in tools/seo/perf.json (--lighthouse=off to
     skip, =all for every sitemap page). Pages run one at a time: parallel runs share the CPU
     and inflate each other's timings. */
  let lhRes = null, perfCfg = {};
  try { perfCfg = JSON.parse(fs.readFileSync(path.join(SEO, "perf.json"), "utf8")); } catch (e) { }
  const lhMode = String(flag("lighthouse", "auto"));
  if (!/^(off|false|no|0)$/.test(lhMode) && !flag("no-lighthouse", false)) {
    const cli = findLighthouse();
    const list = lhMode === "all" ? SITEMAP.map(s => ({ path: new URL(s.loc).pathname })) : (perfCfg.pages || []);
    if (!cli) add("info", "lighthouse-skipped", "", "no Lighthouse CLI on this machine (set LIGHTHOUSE=/path/to/lighthouse/cli/index.js, or run npx lighthouse@12 once from a scratch folder so npx caches it)");
    else if (!CHROME) add("info", "lighthouse-skipped", "", "Chrome not found (set CHROME=)");
    else if (list.length) {
      lhRes = {};
      log(`Lighthouse (mobile) on ${list.length} page(s)${LIVE ? "" : " — local lab: tools/serve.js has no compression and no CDN, so compare local runs with local runs"}…`);
      const B = perfCfg.budgets || {};
      for (const pgc of list) {
        const known = pages.get(BASE + pgc.path), st = known ? known.status : (await probe(BASE + pgc.path)).status;
        if (st !== 200) { add("info", "lighthouse-skipped", pgc.path, `not measured: the page returns ${st}`); continue; }
        const b = { ...B, ...(pgc.budgets || {}) };
        /* several audits share this machine: a crashed run, or an SEO / accessibility score under
           budget, is run once more before anything is put down to the site */
        let r = await lighthouse(cli, BASE + pgc.path), retried = "";
        const under = x => x && !x.error && ((b.seo != null && x.seo < b.seo) || (b.a11y != null && x.a11y < b.a11y));
        if (!r || r.error || under(r)) {
          const r2 = await lighthouse(cli, BASE + pgc.path);
          retried = !r || r.error ? `first run failed (${r && r.error || "no result"}), retried` : `first run SEO ${r.seo} / accessibility ${r.a11y}, retried`;
          if (r2 && !r2.error && (!r || r.error || (r2.seo + r2.a11y) >= (r.seo + r.a11y))) r = r2;
          if (retried) log(`  ${pgc.path}: ${retried}`);
        }
        lhRes[pgc.path] = r;
        if (!r || r.error) { add("warn", "lighthouse-failed", pgc.path, "Lighthouse did not finish twice (its scores are kept out of the history comparison)", r && r.error); continue; }
        const at = pgc.path, why = pgc.note ? " (" + pgc.note + ")" : "";
        if (b.cls != null && r.cls > Math.max(0.25, b.cls)) add("error", "cls", at, `CLS ${r.cls} — over 0.25, Google's «poor»${why}`);
        else if (b.cls != null && r.cls > b.cls) add("warn", "cls", at, `CLS ${r.cls}, budget ${b.cls}${why}`);
        if (b.lcp != null && r.lcp > Math.max(4000, b.lcp)) add("warn", "lcp", at, `LCP ${r.lcp} ms — over 4 s, Google's «poor» (element: ${r.lcpEl || "?"})${why}`);
        else if (b.lcp != null && r.lcp > b.lcp) add("info", "lcp", at, `LCP ${r.lcp} ms, budget ${b.lcp} ms (element: ${r.lcpEl || "?"})${why}`);
        /* a number an owner asked to track though its budget is off (perf.json `watch`): the home's
           LCP while the splash hand-off is uncommitted */
        if (pgc.watch && pgc.watch.lcp != null && r.lcp > pgc.watch.lcp) add("warn", "lcp-watch", at, `LCP ${r.lcp} ms (element: ${r.lcpEl || "?"}), over the ${pgc.watch.lcp} ms perf.json tracks since ${pgc.watch.since || "?"}: ${pgc.watch.why || ""}`);
        if (b.perf != null && r.perf < b.perf) add("info", "lighthouse-perf", at, `performance ${r.perf}, budget ${b.perf} (FCP ${r.fcp} ms, LCP ${r.lcp} ms, TBT ${r.tbt} ms, ${kb(r.bytes)})${why}`);
        if (b.seo != null && r.seo < b.seo) add("warn", "lighthouse-seo", at, `Lighthouse SEO ${r.seo}, budget ${b.seo}`, r.fails.join(", "));
        if (b.a11y != null && r.a11y < b.a11y) add("warn", "lighthouse-a11y", at, `accessibility ${r.a11y}, budget ${b.a11y}`, r.fails.join(", "));
        log(`  ${at}: perf ${r.perf}, a11y ${r.a11y}, bp ${r.bp}, seo ${r.seo} — FCP ${r.fcp} ms, LCP ${r.lcp} ms, CLS ${r.cls}, TBT ${r.tbt} ms, ${kb(r.bytes)}`);
      }
    }
  }

  /* CLS while the web font is late, on a phone's fonts (fontCls). perf.json `fontCls`: pages (one
     of every template and each page that went over budget; default perf.json's pages but the
     app), `widths` (phones are 320 to 412 wide, and a font swap that re-wraps one line moves
     everything under it only at some widths: lcm-gcd 0.255 at 340, fractions 0.344 at 412, none
     at 390), delays in ms, budget, `concurrency`. --font-cls=all runs every sitemap page but the
     home; --font-cls=off skips it. Each result is keyed by model, delay and width
     («phone1000@340»), so history compares a width with the same width. */
  let fclsRes = null;
  const fclsMode = String(flag("font-cls", "auto"));
  if (!/^(off|false|no|0)$/.test(fclsMode)) {
    const fc = perfCfg.fontCls || {};
    const base = fclsMode === "all" ? SITEMAP.map(s => shortUrl(s.base)).filter(p => p !== "/") : (fc.pages || (perfCfg.pages || []).filter(x => x.path !== "/").map(x => x.path));
    const list = [...new Set(base.map(x => typeof x === "string" ? x : x.path))].filter(pth => { const k = pages.get(BASE + pth); return k && k.status === 200; });
    const delays = fc.delays || [1000, 2500], budget = fc.budget == null ? 0.1 : fc.budget;
    const widths = (fc.widths && fc.widths.length ? fc.widths : [320, 340, 375, 390, 412]).map(Number);
    const deskW = (fc.desktopWidths && fc.desktopWidths.length ? fc.desktopWidths : [390]).map(Number);
    const siteFam = new RegExp((fc.siteFamilies || ["Baloo", "Qudrati"]).map(reEsc).join("|"), "i");
    const naskh = list.length && CHROME && typeof WebSocket === "function" ? await naskhFont() : null;
    if (!list.length) { }
    else if (!CHROME || typeof WebSocket !== "function") add("info", "font-cls-skipped", "", "needs Chrome and Node 22's WebSocket");
    else {
      if (!naskh) add("info", "font-cls-skipped", "", `phone runs skipped: Noto Naskh Arabic is not cached in ${os.tmpdir()} and could not be downloaded${OFFLINE ? " (--offline)" : ""}; the desktop run still measures`);
      const br = await cdpBrowser();
      if (!br) add("warn", "font-cls-skipped", "", "headless Chrome did not start");
      else {
        fclsRes = {};
        const naskhData = naskh ? 'url(data:font/ttf;base64,' + naskh.toString("base64") + ') format("truetype")' : null;
        const runs = [...(naskh ? delays.flatMap(d => widths.map(w => ({ phone: true, delay: d, width: w }))) : []), ...deskW.map(w => ({ phone: false, delay: Math.max(...delays), width: w }))];
        const jobs = list.flatMap(pth => runs.map(r => ({ pth, r })));
        const t0 = Date.now();
        log(`font CLS: ${list.length} page(s) × ${runs.length} run(s) = ${jobs.length} (phone at ${widths.join("/")} px with the font ${delays.join(" / ")} ms late, desktop at ${deskW.join("/")} px ${Math.max(...delays)} ms; ${fc.concurrency || 4} at a time)…`);
        const res = await pool(jobs, Math.max(1, Number(fc.concurrency) || 4), async ({ pth, r }) => ({ pth, r, v: await fontCls(br, BASE + pth, { ...r, naskhData }) }));
        /* a run that never painted (no first-contentful-paint) measured nothing: its CLS 0 is no
           pass. Run it again alone; still unpainted, it is a failed run, not a result */
        const unpainted = res.filter(x => !x.v.error && !x.v.fcp);
        for (const x of unpainted) { const v = await fontCls(br, BASE + x.pth, { ...x.r, naskhData }); x.v = v.error || v.fcp ? v : { error: "the page never painted (no first-contentful-paint entry), so no layout shift could be recorded" }; }
        if (unpainted.length) log(`font CLS: ${unpainted.length} run(s) had not painted and ran again alone (${unpainted.filter(x => !x.v.error).length} painted then)`);
        const localSeen = new Map(); // page -> installed site faces that painted text
        const noNaskh = new Map();   // page -> phone runs whose Noto Naskh face never loaded
        const byPage = new Map();
        for (const { pth, r, v } of res) {
          const key = (r.phone ? "phone" : "desktop") + r.delay + "@" + r.width;
          const row = fclsRes[pth] = fclsRes[pth] || {};
          row[key] = v.error ? { error: v.error } : { cls: v.cls, fcp: v.fcp };
          if (v.error) { add("warn", "font-cls-failed", pth, `font CLS run ${key} failed`, v.error); continue; }
          const fb = (v.faces || []).filter(f => /^QFallback/.test(f));
          if (r.phone && fb.some(f => /^QFallbackN:/.test(f)) && !fb.some(f => /^QFallbackN:.*:loaded$/.test(f))) { if (!noNaskh.has(pth)) noNaskh.set(pth, { keys: [], faces: fb.join(" ") }); noNaskh.get(pth).keys.push(key); }
          /* a face installed on this machine with the site font's name, painting text: the run
             shows this PC, not a phone (the guides owner found Baloo Bhaijaan 2 installed here) */
          const inst = [...Object.keys(v.during || {}), ...Object.keys(v.after || {})].filter(k => /\[installed\]$/.test(k) && siteFam.test(k));
          if (inst.length) { if (!localSeen.has(pth)) localSeen.set(pth, new Set()); for (const k of inst) localSeen.get(pth).add(k.replace(/ \[installed\]$/, "") + " in " + key); row[key].local = [...new Set(inst)]; }
          if (r.phone && v.during) row[key].during = Object.keys(v.during).slice(0, 4);
          if (!v.held) add("info", "font-cls-model", pth, `no site font was requested in the ${key} run, so nothing was held back`);
          const where = (v.shifts || []).map(x => `${x[0]} ms ${x[1]}${x[2] && x[2].length ? " " + x[2].join(", ") : ""}`).join("; ");
          if (v.cls > budget) { if (!byPage.has(pth)) byPage.set(pth, []); byPage.get(pth).push({ key, r, cls: v.cls, where, local: inst.length > 0 }); }
        }
        /* one finding per page and level, every width that went over listed with what moved */
        for (const [pth, over] of byPage) for (const lvl of ["error", "warn"]) {
          const rows = over.filter(o => (o.cls > 0.25) === (lvl === "error")); if (!rows.length) continue;
          rows.sort((a, b) => b.cls - a.cls);
          add(lvl, "font-cls", pth, `web font late: CLS over ${lvl === "error" ? "0.25 (Google's «poor»)" : "the " + budget + " budget"} in ${rows.length} run(s), worst ${rows[0].cls} (${rows[0].r.phone ? "phone: no Arial, Noto Naskh" : "desktop: this machine's fonts"}, ${rows[0].r.width} px, ${rows[0].r.delay} ms)`, rows.map(o => `${o.key} CLS ${o.cls}${o.local ? " [an installed copy of the site font painted text]" : ""}: ${o.where}`).join(" || ").slice(0, 1600));
        }
        for (const [pth, x] of noNaskh) add("info", "font-cls-model", pth, `the phone model's Noto Naskh face did not load in ${x.keys.length} of ${runs.filter(r => r.phone).length} phone run(s), so they measured another fallback (an earlier family in the stack painted first, or the face failed)`, x.keys.slice(0, 6).join(", ") + " — " + x.faces);
        for (const [pth, set] of localSeen) add("warn", "font-cls-local-font", pth, `an installed copy of the site's font painted text on this machine (CSS.getPlatformFontsForNode: isCustomFont false), so a pass here may not hold on a phone, which does not have it; give the web font a private family name (as the guide pages' «Qudrati Baloo») or uninstall the font before measuring`, [...set].slice(0, 6).join(", "));
        for (const pth of list) { const row = fclsRes[pth] || {}; const worst = Object.entries(row).filter(([, v]) => !v.error).sort((a, b) => b[1].cls - a[1].cls)[0]; log(`  ${pth}: ${Object.keys(row).length} runs, worst ${worst ? worst[0] + " CLS " + worst[1].cls : "-"}${Object.values(row).some(v => v.error) ? ", " + Object.values(row).filter(v => v.error).length + " failed" : ""}`); }
        log(`font CLS: ${jobs.length} runs in ${Math.round((Date.now() - t0) / 1000)} s`);
        br.close();
      }
    }
  }

  /* accepted: known findings the user has ruled on (tools/seo/accepted.json) stay visible as notes
     but do not fail the run or count as problems in the history */
  try {
    const acc = JSON.parse(fs.readFileSync(path.join(SEO, "accepted.json"), "utf8")).accepted || [];
    for (const i of issues) {
      const a = acc.find(a => a.code === i.code && (a.where == null || a.where === i.where) && (!a.until || a.until >= today));
      if (a && i.level !== "info") { i.msg += " — accepted: " + a.reason; i.level = "info"; i.accepted = true; }
    }
  } catch (e) { if (fs.existsSync(path.join(SEO, "accepted.json"))) add("warn", "accepted-json", "tools/seo/accepted.json", "does not parse", e.message); }

  /* ---------- report ---------- */
  const order = { error: 0, warn: 1, info: 2 };
  issues.sort((a, b) => order[a.level] - order[b.level] || a.code.localeCompare(b.code) || a.where.localeCompare(b.where));
  const count = l => issues.filter(i => i.level === l).length;
  if (!QUIET) {
    console.log("\npages (raw HTML = what a non-JS crawler or AI fetcher reads; rendered = after JavaScript):");
    console.log("  " + ["status", "raw words", "rendered", "links", "inbound", "HTML", "+subres raw/wire", "JSON-LD", "url"].join("\t"));
    for (const pg of htmlPages.filter(p => p.indexable || smSet.has(p.url))) console.log("  " + [pg.status, pg.words, pg.rWords == null ? "-" : pg.rWords, pg.links.length + (pg.rLinks == null ? "" : "→" + pg.rLinks), pg.inbound == null ? "-" : pg.inbound + (pg.inRaw != null && pg.inRaw !== pg.inbound ? "/" + pg.inRaw + "raw" : ""), kb(pg.bytes), kb(pg.subBytes || 0) + "/" + kb(pg.subWire || 0), (pg.ldTypes || []).join(",") || "-", shortUrl(pg.url)].join("\t"));
  }
  for (const lvl of ["error", "warn", "info"]) {
    const list = issues.filter(i => i.level === lvl);
    if (!list.length || (QUIET && lvl !== "error")) continue;
    console.log(`\n${lvl.toUpperCase()} (${list.length})`);
    for (const i of list) console.log(`  [${i.code}] ${i.where ? i.where + " — " : ""}${i.msg}${i.evidence ? "\n      " + i.evidence : ""}`);
  }

  /* history + regressions */
  /* a run on another tree (QSEO_ROOT, a fixture with faults planted in it) keeps its history in that
     tree's own tools/seo/, never in this one: its planted faults must not become the next real
     run's baseline. No such folder there: no history at all. */
  const histFile = HISTORY_FILE;
  let hist = []; try { if (histFile) hist = JSON.parse(fs.readFileSync(histFile, "utf8")); } catch (e) { }
  /* what was audited: the local commit only means something for a local run; a live run records
     the deployed shell version (sw.js VERSION, index.html ?v=) instead. contentHash covers the
     bytes of every sitemap page, so two runs of the same content can be told apart from two runs
     of different content whatever port they came from. */
  let commit = null, dirty = null;
  if (!LIVE) try { commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(); dirty = !!execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" }).trim(); } catch (e) { }
  const swr = await http(BASE + "/sw.js");
  const deployed = { sw: swr.status === 200 ? ((/\bVERSION\s*=\s*["'`]?([\w.-]+)/.exec(swr.body) || [])[1] || null) : null, shell: (/(?:css\/style\.css|js\/app\.js)\?v=([\w.-]+)/.exec(home.body) || [])[1] || null };
  const contentHash = require("crypto").createHash("sha256").update(SITEMAP.map(s => { const p = pages.get(s.base); return s.loc + "\n" + (p && p.html || ""); }).join("\n\u0000")).digest("hex").slice(0, 16);
  const keyOf = i => i.code + " " + i.where;
  const entry = {
    at: new Date().toISOString(), env: envOf(BASE), base: BASE, commit, dirty, deployed, contentHash, seconds: Math.round((Date.now() - t0) / 1000),
    counts: { error: count("error"), warn: count("warn"), info: count("info") },
    sitemap: SITEMAP.length, crawled: pages.size, html: htmlPages.length, indexable: htmlPages.filter(p => p.indexable).length,
    data: DATA ? { lessons: DATA.lessons.length, questions: DATA.questions, comparison: DATA.comparison, rules: DATA.rules.length } : null,
    opp: { ruleHeadings: opp.ruleHeadings && opp.ruleHeadings.covered, lessonPages: opp.lessonPages && opp.lessonPages.withPage, queriesAnswered: opp.queries ? opp.queries.filter(q => q.page && !q.rawOnly).length : null, queriesRawOnly: opp.queries ? opp.queries.filter(q => q.rawOnly).length : null, queriesHeaded: opp.queries ? opp.queries.filter(q => q.headed).length : null, queries: opp.queries ? opp.queries.length : null, suggestGaps: opp.suggestGaps ? opp.suggestGaps.length : null },
    answers: opp.queries ? Object.fromEntries(opp.queries.map(q => [q.id, q.page ? q.page + (q.rawOnly ? " (raw)" : "") : null])) : null,
    etec: etec ? { status: etec.status, guide: etec.guide && etec.guide.length, modDate: etec.guide && etec.guide.modDate, pdfs: etec.pdfs ? Object.fromEntries(Object.entries(etec.pdfs).map(([u, v]) => [u.split("/")[4] || u, (v.length || "?") + " " + (v.modDate || "?")])) : null, items: etec.items, links: etec.links ? Object.fromEntries(Object.entries(etec.links).map(([u, v]) => [u, v.status + (v.updateDate ? " " + v.updateDate : "")])) : null } : null,
    generators: gens ? Object.fromEntries(gens.map(g => [g.gen, g.skipped ? "skip" : g.code])) : null,
    validators: vals ? Object.fromEntries(vals.map(v => [v.v, v.code])) : null,
    vercel: VCFG, llmsFull: llmsFullSecs,
    fontCls: fclsRes ? Object.fromEntries(Object.entries(fclsRes).map(([u, row]) => [u, fclsWorst(row)])) : fclsRes,
    lighthouse: lhRes ? Object.fromEntries(Object.entries(lhRes).map(([u, r]) => [u, r && !r.error ? { perf: r.perf, a11y: r.a11y, seo: r.seo, fcp: r.fcp, lcp: r.lcp, cls: r.cls, tbt: r.tbt, kb: Math.round(r.bytes / 1024) } : { error: r && r.error }])) : null,
    pages: Object.fromEntries(htmlPages.filter(p => p.indexable || smSet.has(p.url)).map(p => [shortUrl(p.url), { s: p.status, w: p.words, rw: p.rWords == null ? null : p.rWords, b: p.bytes, l: p.links.length, in: p.inbound == null ? null : p.inbound, inRaw: p.inRaw == null ? null : p.inRaw, ld: (p.ldTypes || []).length, dm: p.dateModified || "", sub: p.subBytes == null ? null : p.subBytes, subW: p.subWire == null ? null : p.subWire }])),
    problems: [...new Set(issues.filter(i => i.level !== "info").map(keyOf))].sort(),
    caps: {
      lighthouse: !!(lhRes && Object.values(lhRes).some(r => r && !r.error)), render: renderVia || "none", renderSet: RENDER,
      network: !OFFLINE, generators: !!gens, local: !!localRun, fontcls: !!(fclsRes && Object.keys(fclsRes).length),
    },
    monitor: monitorHash(), dataHash: dataHash(),
    /* a problem whose family is not its code's (a sitemap-noindex only a render could see) */
    fams: Object.fromEntries(issues.filter(i => i.fam && i.level !== "info").map(i => [keyOf(i), i.fam])),
  };
  /* the baseline. A diff is only worth reporting when it says something about the site, so:
     - each code belongs to a check family (FAMILY_RULES); a family that did not run in both runs
       (Lighthouse off, no render, --offline, --no-generators, --no-local) is not compared, and
       its codes are counted on their own line, never as fixed or new;
     - a run records a hash of the monitor itself (audit.js and its JSON files); when it changed
       and the site did not, every diff is put down to the monitor;
     - fixed / new are reported as such only when the site changed: the sitemap pages' bytes,
       the deployed sw / shell version, or the app data the count checks read.
     Which run: --baseline=TIME; else the last run in this environment whose content differs
     and whose check families match; else one whose content differs; else the last with the
     same families; else the last run. */
  const sameEnv = [...hist].reverse().filter(h => (h.env || envOf(h.base)) === entry.env);
  const wantAt = flag("baseline", "");
  const siteKey = h => [h.contentHash || "", h.deployed ? (h.deployed.sw || "") + "/" + (h.deployed.shell || "") : "", h.dataHash || entry.dataHash].join("|");
  const sameCaps = h => { const c = capsOf(h); return Object.keys(entry.caps).every(k => k === "renderSet" ? (c.renderSet || "sitemap") === entry.caps.renderSet : c[k] === entry.caps[k]); };
  const differs = h => h.contentHash && h.contentHash !== entry.contentHash;
  /* --baseline=TIME: the latest run in this environment whose «at» starts with TIME (a local and a
     live run often share a minute); a run of another environment only when this one has none */
  const atMatch = h => String(h.at).startsWith(String(wantAt));
  const prevOther = wantAt && !sameEnv.find(atMatch) ? [...hist].reverse().find(atMatch) : null;
  const prev = wantAt ? (sameEnv.find(atMatch) || prevOther)
    : (sameEnv.find(h => differs(h) && sameCaps(h)) || sameEnv.find(differs) || sameEnv.find(sameCaps) || sameEnv[0]);
  if (wantAt && !prev) console.log(`\n--baseline=${wantAt}: no history entry starts with that time`);
  if (prevOther) console.log(`\n--baseline=${wantAt}: no ${entry.env} run starts with that time; comparing with a ${prevOther.env || envOf(prevOther.base)} run (${prevOther.at}), whose findings differ by environment`);
  const reg = [];
  if (prev) {
    const pc = capsOf(prev), cc = entry.caps;
    const famOk = fam => fam === "core" || (fam === "render" ? pc.render !== "none" && cc.render !== "none" && (pc.render === cc.render || pc.render === "unknown") && (pc.renderSet || "sitemap") === cc.renderSet : !!pc[fam] && !!cc[fam]);
    const was = new Set(prev.problems || []), now = new Set(entry.problems);
    const freshAll = entry.problems.filter(k => !was.has(k)), fixedAll = (prev.problems || []).filter(k => !now.has(k));
    const skipped = new Map();
    const keep = k => { const f = (entry.fams || {})[k] || (prev.fams || {})[k] || familyOf(k.split(" ")[0]); if (famOk(f)) return true; skipped.set(f, (skipped.get(f) || 0) + 1); return false; };
    const fresh = freshAll.filter(keep), fixed = fixedAll.filter(keep);
    const siteChanged = siteKey(prev) !== siteKey(entry);
    const mPrev = prev.monitor || null, monChanged = !mPrev || mPrev.hash !== entry.monitor.hash;
    const monFiles = mPrev ? Object.keys(entry.monitor.files).filter(f => !mPrev.files || mPrev.files[f] !== entry.monitor.files[f]).map(f => `${f} ${(mPrev.files && mPrev.files[f]) || "?"}→${entry.monitor.files[f]}`) : ["not recorded in the baseline"];
    const real = siteChanged && !monChanged, mixed = siteChanged && monChanged;
    if (real || mixed) for (const k of fresh) reg.push("new: " + k + (mixed ? " (the monitor changed too)" : ""));
    for (const [u, p] of Object.entries(prev.pages || {})) {
      const c = entry.pages[u];
      if (!c) { reg.push(`page gone from the audit: ${u}`); continue; }
      if (p.w > 50 && c.w < p.w * 0.8) reg.push(`${u}: raw words ${p.w} → ${c.w}`);
      if (famOk("render") && p.rw > 50 && c.rw != null && c.rw < p.rw * 0.8) reg.push(`${u}: rendered words ${p.rw} → ${c.rw}`);
      if (p.b > 0 && c.b > p.b * 1.3 && c.b > 20000) reg.push(`${u}: HTML ${kb(p.b)} → ${kb(c.b)}`);
      if (p.subW > 0 && c.subW > p.subW * 1.3 && c.subW - p.subW > 20000) reg.push(`${u}: subresources on the wire ${kb(p.subW)} → ${kb(c.subW)}`);
      if (p.in > 0 && c.in === 0) reg.push(`${u}: lost all inbound links`);
    }
    if (entry.sitemap < prev.sitemap) reg.push(`sitemap URLs ${prev.sitemap} → ${entry.sitemap}`);
    /* a lab number that moves while the site did not is the lab (network, CPU), not the site */
    const lab = siteChanged ? "" : " (the site did not change: lab variance)";
    if (famOk("lighthouse")) for (const [u, c] of Object.entries(entry.lighthouse || {})) {
      /* a run that crashed (an entry from before round 7 kept null scores, not an error) is no baseline */
      const p = (prev.lighthouse || {})[u]; if (!p || p.error || c.error || p.perf == null || p.seo == null || c.perf == null || c.seo == null) continue;
      if (c.cls - p.cls > 0.05) reg.push(`${u}: CLS ${p.cls} → ${c.cls}${lab}`);
      if (p.perf - c.perf >= 10) reg.push(`${u}: Lighthouse performance ${p.perf} → ${c.perf}${lab}`);
      if (c.lcp - p.lcp > 800) reg.push(`${u}: LCP ${p.lcp} → ${c.lcp} ms${lab}`);
      if (c.seo < p.seo) reg.push(`${u}: Lighthouse SEO ${p.seo} → ${c.seo}${lab}`);
    }
    /* one number a page: its worst run (fclsWorst reads the per-run rows older entries kept) */
    if (famOk("fontcls")) for (const [u, c0] of Object.entries(entry.fontCls || {})) {
      const c = fclsWorst(c0), p = fclsWorst((prev.fontCls || {})[u]);
      if (!c || !p || c.worst == null || p.worst == null) continue;
      if (c.worst - p.worst > 0.05) reg.push(`${u}: worst font CLS ${p.worst} (${p.at}) → ${c.worst} (${c.at})${lab}`);
    }
    if (famOk("render") && !monChanged) {
      if (prev.opp && entry.opp.queriesAnswered != null && prev.opp.queriesAnswered != null && entry.opp.queriesAnswered < prev.opp.queriesAnswered) reg.push(`queries answered in the rendered DOM ${prev.opp.queriesAnswered} → ${entry.opp.queriesAnswered}`);
      for (const [id, pgv] of Object.entries(prev.answers || {})) if (pgv && entry.answers && !entry.answers[id]) reg.push(`query ${id} lost its page (${pgv})`);
    }
    const label = h => h.env === "live" || envOf(h.base) === "live" ? "deployed " + (h.deployed ? "sw " + (h.deployed.sw || "?") + ", shell v" + (h.deployed.shell || "?") : "(version not recorded)") : (h.commit || "?") + (h.dirty ? "+dirty" : "");
    console.log(`\nbaseline: ${wantAt ? "--baseline" : differs(prev) ? "the last " + entry.env + " run with different content" + (sameCaps(prev) ? " and the same checks" : " (its checks differ)") : "the last " + entry.env + " run (same content" + (prev.contentHash ? "" : ", or no hash recorded") + ")"}; this run's content ${contentHash}, deployed sw ${deployed.sw || "?"}, monitor ${entry.monitor.hash}`);
    console.log(`since ${prev.at.slice(0, 16)} on ${new URL(prev.base).host} (${label(prev)}${prev.contentHash ? ", content " + prev.contentHash : ""}): errors ${prev.counts.error} → ${entry.counts.error}, warnings ${prev.counts.warn} → ${entry.counts.warn}, sitemap ${prev.sitemap} → ${entry.sitemap}, indexable ${prev.indexable} → ${entry.indexable}`);
    if (skipped.size) console.log(`  not compared, the check did not run in both: ${[...skipped].map(([f, n]) => `${f} ${n} code(s) (${famWhy(f, pc, cc)})`).join("; ")}`);
    if (real) console.log(`  the site changed: ${fixed.length} problem(s) fixed, ${fresh.length} new`);
    else if (mixed) console.log(`  the site and the monitor both changed (${monFiles.join(", ")}): ${fixed.length} problem(s) gone, ${fresh.length} new; some may be the monitor's`);
    else if (monChanged) console.log(`  monitor changed since baseline (${monFiles.join(", ")}), the site did not: ${fixed.length + fresh.length} code(s) differ for that reason (${fixed.length} gone, ${fresh.length} added)${fresh.length ? ": " + fresh.slice(0, 8).join("; ") : ""}`);
    else if (fixed.length || fresh.length) console.log(`  same site, same monitor, same checks, yet ${fixed.length} gone and ${fresh.length} added: something outside the site moved (ETEC, an external link, a timeout)${fresh.length ? ": " + fresh.slice(0, 8).join("; ") : ""}`);
    else console.log("  no difference in the problems both runs could find");
    if (reg.length) { console.log("REGRESSIONS / NEW:"); for (const r of reg.slice(0, 60)) console.log("  " + r); }
  }
  entry.regressions = reg.length;
  /* one compact JSON line a run (older entries' per-run font CLS rows folded to the worst a page),
     written beside the file and renamed over it, so a reader never sees half a file */
  if (HISTORY && histFile) {
    hist.push(entry); if (hist.length > HISTORY_MAX) hist = hist.slice(-HISTORY_MAX);
    for (const h of hist) if (h.fontCls) h.fontCls = Object.fromEntries(Object.entries(h.fontCls).map(([u, row]) => [u, fclsWorst(row)]));
    const tmp = histFile + ".tmp-" + process.pid;
    fs.writeFileSync(tmp, "[\n" + hist.map(h => JSON.stringify(h)).join(",\n") + "\n]\n"); fs.renameSync(tmp, histFile);
  }
  if (JSON_OUT) fs.writeFileSync(path.resolve(JSON_OUT), JSON.stringify({ entry, issues, opportunities: opp, etec }, null, 1));

  console.log(`\nsummary: ${entry.counts.error} errors, ${entry.counts.warn} warnings, ${entry.counts.info} notes — ${SITEMAP.length} sitemap URLs, ${entry.indexable} indexable pages, ${entry.seconds}s${HISTORY && histFile ? " — appended to " + path.relative(process.cwd(), histFile) : HISTORY ? " — no history written (QSEO_ROOT has no tools/seo/ of its own)" : ""}`);
  process.exit(entry.counts.error || (STRICT && entry.counts.warn) ? 1 : 0);
})().catch(e => { console.error("audit failed:", e && e.stack || e); process.exit(2); });
