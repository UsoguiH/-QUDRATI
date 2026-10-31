#!/usr/bin/env node
/* IndexNow submitter for qudrati.xyz. Zero dependencies (Node 18+).

   Bing, Yandex, Seznam, Naver and the engines that read Bing's index (DuckDuckGo, Copilot,
   ChatGPT search) recrawl a URL within hours of an IndexNow ping. Google does not use IndexNow.

   It reads the sitemap, picks the URLs whose <lastmod> is newer than what was last submitted
   (tools/seo/indexnow-state.json), or whose live bytes changed since then, and builds one
   IndexNow request with the key that lives at the site root (<32 hex>.txt, its content the
   same 32 characters).

   What is sent is what is deployed: with --submit (or --live) the sitemap is read from
   https://qudrati.xyz/sitemap.xml, every candidate URL is fetched live, and a URL that does
   not answer 200 (not deployed yet, or redirected) is left out, printed, and not recorded.
   The state keeps each URL's lastmod, the sha-256 of its live bytes and when it was sent, so
   a page that changes twice on one day is still sent the second time, and a submit made
   before a deploy never marks the undeployed pages as sent.

   DRY RUN BY DEFAULT: it prints the request and sends nothing. Submitting is a write to an
   outside service, so it happens only with --submit, after a deploy, and only by the person
   who owns the site.

   usage:
     node tools/seo/indexnow.js                         # dry run on the repo's sitemap
     node tools/seo/indexnow.js --live                  # dry run on the live sitemap and pages
     node tools/seo/indexnow.js --all                   # dry run with every sitemap URL
     node tools/seo/indexnow.js --since=2026-10-01      # URLs with lastmod on or after a date
     node tools/seo/indexnow.js --url=https://qudrati.xyz/qudrat-kami.html   # one URL (repeatable)
     node tools/seo/indexnow.js --submit                # send it (live sitemap, live pages, key file checked)
     node tools/seo/indexnow.js --help

   flags:
     --sitemap=PATH|URL   default: the repo's sitemap.xml; https://qudrati.xyz/sitemap.xml with
                          --submit or --live
     --endpoint=URL       default https://api.indexnow.org/indexnow (a test server can be given)
     --state=FILE         default tools/seo/indexnow-state.json
     --no-key-check       skip fetching https://qudrati.xyz/<key>.txt before submitting
     --base=URL           where the live pages are fetched from (default https://qudrati.xyz;
                          a test server can be given — the URLs sent stay on qudrati.xyz)

   The state file is only written after the endpoint answers 200 or 202, so a failed or
   dry run never marks anything as sent. Unknown flags exit 2 before anything is fetched.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..", "..");
const HOST = "qudrati.xyz";
const SITE = "https://" + HOST;
const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  const src = fs.readFileSync(__filename, "utf8");
  console.log(src.slice(src.indexOf("/*") + 2, src.indexOf("*/")).replace(/^ {3}/gm, "").trim());
  process.exit(0);
}
{
  const known = ["submit", "live", "all", "since", "url", "sitemap", "endpoint", "state", "no-key-check", "base"];
  const bad = argv.filter(a => !a.startsWith("--") || !known.includes(a.slice(2).split("=")[0]));
  if (bad.length) { console.error("unknown argument(s): " + bad.join(" ") + " (--help lists them)"); process.exit(2); }
}
const opt = name => { const a = argv.find(x => x === "--" + name || x.startsWith("--" + name + "=")); return a ? (a.includes("=") ? a.slice(a.indexOf("=") + 1) : true) : null; };
const opts = name => argv.filter(x => x.startsWith("--" + name + "=")).map(x => x.slice(name.length + 3));
const SUBMIT = !!opt("submit");
const LIVE = SUBMIT || !!opt("live");
const ENDPOINT = opt("endpoint") || "https://api.indexnow.org/indexnow";
const STATE = path.resolve(opt("state") || path.join(__dirname, "indexnow-state.json"));
const FETCH_BASE = String(opt("base") || SITE).replace(/\/+$/, "");
const SITEMAP = opt("sitemap") || (LIVE ? FETCH_BASE + "/sitemap.xml" : path.join(ROOT, "sitemap.xml"));
const live = u => FETCH_BASE === SITE ? u : u.replace(SITE, FETCH_BASE);
/* the first state format kept the lastmod string alone */
const sentOf = v => v == null ? null : typeof v === "string" ? { lastmod: v } : v;

function die(msg) { console.error(msg); process.exit(1); }

(async () => {
  /* the key: <32 hex>.txt in the root, whose content is its own name */
  const keyFiles = fs.readdirSync(ROOT).filter(f => /^[0-9a-f]{32}\.txt$/.test(f));
  if (keyFiles.length !== 1) die(`expected exactly one <32 hex>.txt key file in the repo root, found ${keyFiles.length}`);
  const key = keyFiles[0].slice(0, 32);
  if (fs.readFileSync(path.join(ROOT, keyFiles[0]), "utf8").trim() !== key) die(`${keyFiles[0]} does not contain its own key`);
  const keyLocation = `${SITE}/${key}.txt`;

  /* the sitemap */
  let xml;
  const remote = /^https?:\/\//.test(SITEMAP);
  if (remote) { const r = await fetch(SITEMAP); if (!r.ok) die(`sitemap ${SITEMAP}: ${r.status}`); xml = await r.text(); }
  else xml = fs.readFileSync(SITEMAP, "utf8");
  /* a sitemap index: read each child (from disk when the sitemap came from disk) */
  for (const m of [...xml.matchAll(/<sitemap>[\s\S]*?<loc>\s*([^<]+?)\s*<\/loc>/g)]) {
    const u = m[1].replace(/&amp;/g, "&");
    if (remote) { const r = await fetch(live(u)); if (!r.ok) die(`child sitemap ${u}: ${r.status}`); xml += await r.text(); }
    else { const f = path.join(ROOT, decodeURIComponent(new URL(u).pathname)); if (!fs.existsSync(f)) die(`child sitemap ${u}: no file ${f}`); xml += fs.readFileSync(f, "utf8"); }
  }
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => ({
    loc: ((/<loc>\s*([^<]+?)\s*<\/loc>/.exec(m[1]) || [])[1] || "").replace(/&amp;/g, "&"),
    lastmod: ((/<lastmod>\s*([^<]+?)\s*<\/lastmod>/.exec(m[1]) || [])[1] || ""),
  })).filter(e => e.loc);
  for (const e of entries) if (new URL(e.loc).host !== HOST) die(`sitemap URL on another host: ${e.loc} (IndexNow takes one host per request)`);

  let state = { submitted: {}, log: [] };
  try { state = JSON.parse(fs.readFileSync(STATE, "utf8")); } catch (e) { }

  /* what changed */
  const since = opt("since"), only = opts("url");
  const newer = e => { const s = sentOf(state.submitted[e.loc]); return !s || (e.lastmod && e.lastmod > (s.lastmod || "")); };
  let pick, forced = false;
  if (only.length) { for (const u of only) if (new URL(u).host !== HOST) die("not on " + HOST + ": " + u); pick = only.map(u => ({ loc: u, lastmod: (entries.find(e => e.loc === u) || {}).lastmod || "" })); forced = true; }
  else if (opt("all")) { pick = entries.slice(); forced = true; }
  else if (since) { pick = entries.filter(e => e.lastmod && e.lastmod.slice(0, 10) >= since); forced = true; }
  else pick = LIVE ? entries.slice() : entries.filter(newer); // live: every URL is a candidate, its hash decides

  /* live: each URL must answer 200 now; the hash of its bytes says whether it changed */
  const skipped = [];
  if (LIVE) {
    const out = [];
    for (const e of pick) {
      let r; try { r = await fetch(live(e.loc), { redirect: "manual", headers: { "user-agent": "QudratiIndexNow/1.0 (+https://qudrati.xyz/)" } }); } catch (x) { r = null; }
      if (!r || r.status !== 200) { skipped.push(`${e.loc} → ${r ? r.status + (r.headers.get("location") ? " " + r.headers.get("location") : "") : "no response"}`); continue; }
      e.hash = crypto.createHash("sha256").update(Buffer.from(await r.arrayBuffer())).digest("hex").slice(0, 16);
      const s = sentOf(state.submitted[e.loc]);
      if (forced || newer(e) || !s.hash || s.hash !== e.hash) out.push(e);
    }
    pick = out;
  }
  if (pick.length > 10000) die("IndexNow takes at most 10,000 URLs per request");

  const body = { host: HOST, key, keyLocation, urlList: pick.map(e => e.loc) };
  console.log(`${entries.length} sitemap URL(s) from ${remote ? SITEMAP : path.relative(ROOT, SITEMAP) || SITEMAP}; ${pick.length} to send${only.length ? " (--url)" : opt("all") ? " (--all)" : since ? " (lastmod ≥ " + since + ")" : LIVE ? " (lastmod newer, or live bytes changed, since the last submission)" : " (lastmod newer than the last submission)"}`);
  if (skipped.length) { console.log(`left out (not 200 live: not deployed yet, or redirected), and not recorded: ${skipped.length}`); for (const x of skipped) console.log("  " + x); }
  for (const e of pick) { const s = sentOf(state.submitted[e.loc]); console.log(`  ${e.lastmod || "(no lastmod)"}  ${e.loc}${e.hash ? "  live " + e.hash : ""}${s ? "   last sent with lastmod " + s.lastmod + (s.hash ? ", " + s.hash : "") + (s.at ? " at " + s.at.slice(0, 16) : "") : ""}`); }
  if (!pick.length) { console.log("nothing to send"); return; }

  if (!SUBMIT) {
    console.log(`\nDRY RUN — would POST to ${ENDPOINT}:\n${JSON.stringify(body, null, 2)}\n\nsend it with --submit, after the change is deployed`);
    return;
  }

  /* the engines fetch the key file from the live host; check it first */
  if (!opt("no-key-check")) {
    const r = await fetch(live(keyLocation), { redirect: "manual" }).catch(e => ({ status: 0, text: async () => String(e) }));
    const t = r.status === 200 ? (await r.text()).trim() : "";
    if (t !== key) die(`key check failed: ${keyLocation} returned ${r.status}${t ? " with other content" : ""}. Deploy the key file first.`);
  }
  const res = await fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json; charset=utf-8" }, body: JSON.stringify(body) })
    .catch(e => die(`request failed: ${e.cause && e.cause.code || e.message}`));
  const text = await res.text().catch(() => "");
  const meaning = { 200: "OK, submitted", 202: "Accepted; the key will be validated", 400: "Bad request", 403: "Forbidden: key not valid (file missing or content differs)", 422: "Unprocessable: URLs not on the host, or key mismatch", 429: "Too many requests (slow down)" }[res.status] || "";
  console.log(`${ENDPOINT} → ${res.status} ${meaning}${text ? "\n" + text.slice(0, 500) : ""}`);
  if (res.status === 200 || res.status === 202) {
    const at = new Date().toISOString();
    for (const e of pick) state.submitted[e.loc] = { lastmod: e.lastmod || at.slice(0, 10), hash: e.hash || null, at };
    state.log = (state.log || []).concat({ at, endpoint: ENDPOINT, status: res.status, urls: pick.length, skipped: skipped.length }).slice(-200);
    fs.writeFileSync(STATE, JSON.stringify(state, null, 1) + "\n");
    console.log(`recorded in ${path.relative(ROOT, STATE) || STATE}`);
  } else process.exit(1);
})();
