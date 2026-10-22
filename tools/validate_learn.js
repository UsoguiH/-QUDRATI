// Validator for js/data/learn.js — the short lessons.
//   node tools/validate_learn.js            — every node
//   node tools/validate_learn.js skills.bigsum
// Every generator item is run RUNS times, because a generator that is right on most
// draws is the bug that reaches a student. Checks: the shape of each type, the right
// answer is among the choices and the choices are distinct, fill tiles can fill every
// blank, pairs are distinct on both sides, every bank question of a node is served
// exactly once across its lessons, no Latin digit in anything a student reads, and
// the short lesson stays short.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RUNS = 300;
const MAX_ITEMS = 12;          // a short lesson that grows past this is not short
const MAX_WORDS = 22;          // per prompt / row / rule / why line

const dataDir = path.join(__dirname, "..", "js", "data");
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of fs.readdirSync(dataDir).filter(f => f.endsWith(".js")))
  vm.runInContext(fs.readFileSync(path.join(dataDir, f), "utf8"), ctx, { filename: f });
const QBANK = ctx.window.QBANK || {}, QLEARN = ctx.window.QLEARN || {};

const AR = "٠١٢٣٤٥٦٧٨٩";
const toAr = n => String(n).replace(/[0-9]/g, d => AR[d]);
const arN = n => (n < 0 ? "−" : "") + toAr(String(Math.abs(n)).replace(".", "٫"));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const R = {
  int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  pick: a => a[Math.floor(Math.random() * a.length)],
  shuffle, ar: arN,
  opts(ans, wrong, n) {
    const fmt = v => typeof v === "number" ? arN(v) : String(v);
    const out = [fmt(ans)];
    wrong.map(fmt).forEach(w => { if (out.indexOf(w) < 0 && out.length < (n || 3)) out.push(w); });
    return out;
  }
};

const only = process.argv[2];
let errors = 0, warns = 0;
const err = (where, msg) => { errors++; console.log(`ERROR ${where}: ${msg}`); };
const warn = (where, msg) => { warns++; console.log(`warn  ${where}: ${msg}`); };
const words = s => String(s || "").replace(/\*/g, "").trim().split(/\s+/).filter(Boolean).length;
const latin = s => /[0-9]/.test(String(s || ""));

const bankIds = {};
for (const [dk, d] of Object.entries(QBANK)) for (const l of d.lessons) for (const q of l.questions) bankIds[q.id] = `${dk}.${l.key}`;

function texts(it) {
  const out = [it.q, it.big, it.h, it.kick, it.rule, it.ok, it.unit, it.eq, it.go].concat(it.cmp || []);
  [].concat(it.rows || [], it.ch || [], it.tiles || [], it.a == null || typeof it.a === "boolean" ? [] : [].concat(it.a)).forEach(x => out.push(x));
  (it.p || []).forEach(pr => out.push(pr[0], pr[1]));
  if (it.why && typeof it.why === "object") Object.keys(it.why).forEach(k => { out.push(it.why[k]); if (k !== "_") out.push(k); });
  else out.push(it.why);
  return out.filter(x => x != null);
}

function checkItem(it, where) {
  for (const s of texts(it)) if (latin(s)) err(where, `Latin digit in «${s}»`);
  for (const k of ["q", "h", "rule", "ok"]) if (it[k] && words(it[k]) > MAX_WORDS) warn(where, `${k} is ${words(it[k])} words`);
  if (typeof it.why === "string" && words(it.why) > MAX_WORDS + 6) warn(where, `why is ${words(it.why)} words`);
  if (typeof it.fig === "string" && it.fig[0] === "@" && !(ctx.window.QTEACH_FIG || {})[it.fig.slice(1)]) err(where, `no figure «${it.fig}»`);
  switch (it.t) {
    case "see":
      if (!(it.rows || []).length) err(where, "see without rows");
      if ((it.rows || []).length > 5) warn(where, "see with more than five rows");
      break;
    case "pick": {
      const ch = it.ch || [];
      if (ch.length < 2 || ch.length > 4) err(where, `pick with ${ch.length} choices`);
      if (new Set(ch).size !== ch.length) err(where, `duplicate choices ${JSON.stringify(ch)}`);
      if (ch.indexOf(it.a) < 0) err(where, `answer «${it.a}» not among ${JSON.stringify(ch)}`);
      if (it.why && typeof it.why === "object")
        Object.keys(it.why).forEach(k => { if (k !== "_" && ch.indexOf(k) < 0 && k !== it.a) { /* a why for a choice the draw left out is fine */ } });
      if (!it.free && !it.why) warn(where, "pick without why");
      break;
    }
    case "tf":
      if (typeof it.a !== "boolean") err(where, "tf answer is not true/false");
      if (!it.big && !it.q) err(where, "tf without a statement");
      if (it.a === false && !it.why) err(where, "a false statement needs its why");
      break;
    case "fill": {
      const blanks = (String(it.eq).match(/_/g) || []).length;
      if (!blanks) err(where, "fill without a blank");
      if (!Array.isArray(it.a) || it.a.length !== blanks) err(where, `fill has ${blanks} blanks and ${(it.a || []).length} answers`);
      const pool = (it.tiles || []).slice();
      (it.a || []).forEach(x => { const i = pool.indexOf(x); if (i < 0) err(where, `answer tile «${x}» missing from ${JSON.stringify(it.tiles)}`); else pool.splice(i, 1); });
      if (new Set(it.tiles).size !== (it.tiles || []).length) warn(where, `repeated tiles ${JSON.stringify(it.tiles)}`);
      if ((it.tiles || []).length <= blanks) warn(where, "fill with no spare tile — nothing to choose");
      break;
    }
    case "type": {
      const want = [].concat(it.a);
      if (!want.length) err(where, "type without an answer");
      want.forEach(x => { if (!/^−?[٠-٩٫/]+$/.test(x)) err(where, `type answer «${x}» cannot be typed on the keypad`); });
      want.forEach(x => { if (/[−٫/]/.test(x) && !(it.keys || []).some(k => x.indexOf(k) >= 0)) err(where, `type answer «${x}» needs a key the pad does not have`); });
      break;
    }
    case "pairs": {
      const L = (it.p || []).map(x => x[0]), Rr = (it.p || []).map(x => x[1]);
      if (L.length < 3 || L.length > 5) err(where, `pairs with ${L.length} pairs`);
      if (new Set(L).size !== L.length || new Set(Rr).size !== Rr.length) err(where, "pairs are not distinct on both sides");
      if (L.some(x => Rr.indexOf(x) >= 0)) err(where, "a pairs entry appears on both sides");
      break;
    }
    case "order":
      if ((it.tiles || []).length < 2) err(where, "order with fewer than two tiles");
      if (new Set(it.tiles).size !== it.tiles.length) err(where, "order tiles repeat");
      break;
    case "bank":
      if (!bankIds[it.id]) err(where, `no bank question «${it.id}»`);
      break;
    default:
      err(where, `unknown type «${it.t}»`);
  }
}

for (const [key, L] of Object.entries(QLEARN)) {
  if (only && key !== only) continue;
  const [dk, lk] = key.split(".");
  const les = QBANK[dk] && QBANK[dk].lessons.find(l => l.key === lk);
  if (!les) { err(key, "no such node in the bank"); continue; }
  const ruleNs = new Set((les.rules || []).map(r => r.n));
  const served = {}, ids = new Set();
  let total = 0;
  L.lessons.forEach((sl, li) => {
    const w = `${key}#${li + 1} ${sl.id}`;
    if (!sl.id || ids.has(sl.id)) err(w, "missing or repeated lesson id"); ids.add(sl.id);
    if (!sl.title) err(w, "lesson without a title");
    if (latin(sl.title)) err(w, "Latin digit in the title");
    (sl.rules || []).forEach(n => { if (!ruleNs.has(n)) err(w, `rule ${n} is not a rule of ${key}`); });
    const graded = sl.items.length;
    total += graded;
    if (graded > MAX_ITEMS) warn(w, `${graded} items — a short lesson stops at ${MAX_ITEMS}`);
    if (!sl.items.some(x => typeof x !== "function" && x.t === "bank")) warn(w, "no real question at the end");
    sl.items.forEach((src, ii) => {
      const iw = `${w} item ${ii + 1}`;
      const runs = typeof src === "function" ? RUNS : 1;
      for (let r = 0; r < runs; r++) {
        let it;
        try { it = typeof src === "function" ? src(R) : src; }
        catch (e) { err(iw, `generator threw: ${e.message}`); break; }
        const before = errors;
        checkItem(it, iw);
        if (errors > before) { if (runs > 1) console.log(`      (draw ${r + 1}: ${JSON.stringify(it).slice(0, 220)})`); break; }
        if (it.t === "bank" && r === 0) {
          served[it.id] = (served[it.id] || 0) + 1;
          if (bankIds[it.id] !== key) warn(iw, `bank question ${it.id} belongs to ${bankIds[it.id]}`);
        }
      }
    });
  });
  for (const q of les.questions) {
    const n = served[q.id] || 0;
    if (n !== 1) err(key, `bank question ${q.id} is served ${n} times`);
  }
  console.log(`${key}: ${L.lessons.length} short lessons, ${total} items, ${Object.keys(served).length}/${les.questions.length} bank questions`);
}
console.log(errors ? `\n${errors} error(s), ${warns} warning(s)` : `\nOK — ${warns} warning(s)`);
process.exit(errors ? 1 : 0);
