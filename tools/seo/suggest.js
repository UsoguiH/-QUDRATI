#!/usr/bin/env node
/* Autocomplete snapshot: what Saudi students type, month by month. Zero dependencies.

   Asks Google's suggest endpoint (hl=ar, gl=sa) and Bing's (mkt=ar-SA) for every seed in
   tools/seo/keywords.json and writes tools/seo/suggest/<date>.json. It then prints what is
   new since the last snapshot and which suggestions name a rule from js/data that no page
   of ours has a heading for (tools/seo/audit.js repeats that check against the crawl).

   These are autocomplete lists, not search volumes and not rankings: a suggestion means
   people type it, nothing more. Never turn them into traffic figures.

   usage:
     node tools/seo/suggest.js              # all seeds, about 2 requests a second
     node tools/seo/suggest.js --dry        # list the seeds, send nothing
     node tools/seo/suggest.js --out=FILE   # write somewhere else

   Run it about once a month; commit the snapshot so the diff is history.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const outArg = (argv.find(a => a.startsWith("--out=")) || "").slice(6);
const DIR = path.join(__dirname, "suggest");
const today = new Date().toISOString().slice(0, 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => String(s).replace(/[ً-ْـ]/g, "").replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim();
const skel = s => norm(s).replace(/[^\p{L}\p{N}]+/gu, "");

const kw = JSON.parse(fs.readFileSync(path.join(__dirname, "keywords.json"), "utf8"));
const seeds = [...new Set([...kw.core, ...Object.values(kw.lessons).flat()])];
if (DRY) { console.log(seeds.length + " seeds:\n" + seeds.join("\n")); process.exit(0); }

async function get(url) {
  try {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0", "accept-language": "ar-SA,ar;q=0.9" }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return { err: "HTTP " + r.status };
    const j = JSON.parse(await r.text());
    return { list: Array.isArray(j[1]) ? j[1].map(String) : [] };
  } catch (e) { return { err: String(e.cause && e.cause.code || e.name || e) }; }
}

(async () => {
  const results = {}; let errs = 0;
  for (const s of seeds) {
    const q = encodeURIComponent(s);
    const g = await get(`https://suggestqueries.google.com/complete/search?client=firefox&hl=ar&gl=sa&q=${q}`);
    const b = await get(`https://api.bing.com/osjson.aspx?mkt=ar-SA&query=${q}`);
    results[s] = { g: g.list || [], b: b.list || [] };
    if (g.err || b.err) { errs++; results[s].err = [g.err, b.err].filter(Boolean).join("; "); }
    await sleep(400);
  }
  const all = new Set(); for (const v of Object.values(results)) for (const x of [...v.g, ...v.b]) all.add(x);
  const snap = { date: today, source: "Google suggest (client=firefox, hl=ar, gl=sa) and Bing osjson (mkt=ar-SA)", seeds: seeds.length, unique: all.size, errors: errs, results };
  fs.mkdirSync(DIR, { recursive: true });
  const out = outArg ? path.resolve(outArg) : path.join(DIR, today + ".json");
  const prevFile = fs.readdirSync(DIR).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && path.join(DIR, f) !== out).sort().pop();
  fs.writeFileSync(out, JSON.stringify(snap, null, 1) + "\n");
  console.log(`${seeds.length} seeds, ${all.size} unique suggestions, ${errs} seed(s) with an error → ${path.relative(ROOT, out)}`);

  if (prevFile) {
    const prev = JSON.parse(fs.readFileSync(path.join(DIR, prevFile), "utf8"));
    const was = new Set(); for (const v of Object.values(prev.results || {})) for (const x of [...v.g, ...v.b]) was.add(x);
    const fresh = [...all].filter(x => !was.has(x) && /قدرات|كمي/.test(x));
    const gone = [...was].filter(x => !all.has(x) && /قدرات|كمي/.test(x));
    console.log(`\nsince ${prevFile.slice(0, 10)}: ${fresh.length} new, ${gone.length} gone (with «قدرات» or «كمي»)`);
    for (const x of fresh.slice(0, 40)) console.log("  + " + x);
    for (const x of gone.slice(0, 20)) console.log("  - " + x);
  }

  /* gaps: a suggestion that names one of our rules, where no page of ours has that rule as a heading */
  const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx);
  for (const f of ["skills", "numbers", "ratios", "geometry"]) { const p = path.join(ROOT, "js", "data", f + ".js"); if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), ctx); }
  const rules = []; for (const [k, u] of Object.entries(ctx.window.QBANK || {})) for (const l of u.lessons) for (const r of l.rules || []) if (skel(r.name).length >= 6) rules.push({ lesson: k + "." + l.key, name: r.name, s: skel(r.name), s2: skel(r.name).replace(/^ال/, "") });
  const heads = [];
  const sm = fs.existsSync(path.join(ROOT, "sitemap.xml")) ? fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8") : "";
  for (const m of sm.matchAll(/<loc>\s*https:\/\/qudrati\.xyz\/([^<]*?)\s*<\/loc>/g)) {
    const f = path.join(ROOT, decodeURIComponent(m[1]) || "index.html"); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) continue;
    for (const h of fs.readFileSync(f, "utf8").matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/g)) heads.push(skel(h[1].replace(/<[^>]+>/g, " ")));
  }
  const gaps = [];
  for (const x of all) { if (!/قدرات|كمي/.test(x)) continue; const sx = skel(x); const r = rules.find(r => sx.includes(r.s) || (r.s2.length >= 6 && sx.includes(r.s2))); if (r && !heads.some(h => h.includes(r.s))) gaps.push(`${x}  →  ${r.lesson} «${r.name}»`); }
  console.log(`\n${gaps.length} suggestion(s) name a rule in js/data that no sitemap page has as a heading:`);
  for (const g of gaps.slice(0, 50)) console.log("  " + g);
})();
