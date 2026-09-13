// Validator for js/data/teach.js — the hand-written teaching cards.
// Every card must point at a real rule with its formula copied verbatim, every
// question of a taught lesson must belong to exactly one chunk, and nothing a
// student sees may carry a Latin digit. Word caps keep a card a card.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dataDir = path.join(__dirname, "..", "js", "data");
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of fs.readdirSync(dataDir).filter(f => f.endsWith(".js"))) {
  vm.runInContext(fs.readFileSync(path.join(dataDir, f), "utf8"), ctx, { filename: f });
}
/* Any file paths given as arguments are loaded on top of js/data, so a lesson's cards
   can be validated while they are still a draft outside the shipped file:
   node tools/validate_teach.js drafts/skills.fastest.js */
for (const f of process.argv.slice(2)) vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: path.basename(f) });
const ONLY = process.env.TEACH_ONLY ? new Set(process.env.TEACH_ONLY.split(",")) : null;
const QBANK = ctx.window.QBANK || {}, QTEACH = ctx.window.QTEACH || {}, fig = ctx.window.QTEACH_FIG || {};
const figUsed = new Set();

let failed = false;
const bad = msg => { console.log("FAIL " + msg); failed = true; };
const words = s => String(s).trim().split(/\s+/).filter(Boolean).length;
const CAPS = { title: 6, say: 24, example: 28, q: 20, why: 20, chunk: 4, plain: 16, hook: 9 };
const OPTIONAL = ["plain", "hook"];   // plain = the rule in words for the card chip; hook = one-line memory hook
const MAX_STEPS = 4, MAX_RULES = 3;

for (const [key, t] of Object.entries(QTEACH)) {
  if (ONLY && !ONLY.has(key)) continue;   // TEACH_ONLY=skills.fastest narrows the report
  const [dk, lk] = key.split(".");
  const les = QBANK[dk] && QBANK[dk].lessons.find(l => l.key === lk);
  if (!les) { bad(`${key}: no such lesson`); continue; }
  const rules = new Map(les.rules.map(r => [r.n, r]));
  const qids = new Set(les.questions.map(q => q.id));
  const taught = [], seenQ = new Map();
  if (!Array.isArray(t.chunks) || !t.chunks.length) { bad(`${key}: no chunks`); continue; }
  t.chunks.forEach((c, ci) => {
    const tag = `${key} chunk ${ci + 1} (${c.title})`;
    if (!c.title || words(c.title) > CAPS.chunk) bad(`${tag}: chunk title missing or > ${CAPS.chunk} words`);
    if (!Array.isArray(c.q) || !c.q.length) bad(`${tag}: no questions listed`);
    for (const id of c.q || []) {
      if (!qids.has(id)) bad(`${tag}: unknown question id ${id}`);
      if (seenQ.has(id)) bad(`${tag}: ${id} already belongs to chunk ${seenQ.get(id)}`);
      seenQ.set(id, ci + 1);
    }
    if (!Array.isArray(c.steps) || !c.steps.length) { bad(`${tag}: no steps`); return; }
    if (c.steps.length > MAX_STEPS) bad(`${tag}: ${c.steps.length} steps, max ${MAX_STEPS}`);
    const nRules = c.steps.filter(s => s.type === "rule").length;
    if (nRules > MAX_RULES) bad(`${tag}: ${nRules} rules, max ${MAX_RULES}`);
    if (c.steps[0].type !== "rule") bad(`${tag}: must open with a rule`);
    if (c.steps[c.steps.length - 1].type !== "check") bad(`${tag}: must end with a check`);
    c.steps.forEach((s, si) => {
      const st = `${tag} step ${si + 1}`;
      const fields = s.type === "rule" ? ["type", "n", "title", "say", "formula", "example"]
                   : s.type === "check" ? ["type", "q", "choices", "answer", "why"] : null;
      if (!fields) { bad(`${st}: unknown type ${s.type}`); return; }
      for (const k of Object.keys(s)) if (!fields.includes(k) && !(s.type === "rule" && OPTIONAL.includes(k))) bad(`${st}: unexpected field ${k}`);
      for (const k of fields) if (s[k] === undefined || s[k] === "") bad(`${st}: missing ${k}`);
      if (s.type === "rule") {
        const r = rules.get(s.n);
        if (!r) bad(`${st}: rule ${s.n} does not exist`);
        else if (r.formula !== s.formula) bad(`${st}: formula differs from the data\n   data: ${r.formula}\n   card: ${s.formula}`);
        taught.push(s.n);
        if (words(s.title) > CAPS.title) bad(`${st}: title > ${CAPS.title} words`);
        if (words(s.say) > CAPS.say) bad(`${st}: say > ${CAPS.say} words (${words(s.say)})`);
        if (words(s.example) > CAPS.example) bad(`${st}: example > ${CAPS.example} words (${words(s.example)})`);
        if (s.plain !== undefined && (typeof s.plain !== "string" || !s.plain || words(s.plain) > CAPS.plain)) bad(`${st}: plain missing or > ${CAPS.plain} words`);
        if (s.hook !== undefined && (typeof s.hook !== "string" || !s.hook || words(s.hook) > CAPS.hook || s.hook === s.title)) bad(`${st}: hook missing, > ${CAPS.hook} words, or same as the title`);
        if (fig[`${key}:${s.n}`]) figUsed.add(`${key}:${s.n}`);
      } else {
        if (!Array.isArray(s.choices) || s.choices.length < 2 || s.choices.length > 3) bad(`${st}: need 2–3 choices`);
        else if (new Set(s.choices).size !== s.choices.length) bad(`${st}: duplicate choices`);
        if (typeof s.answer !== "number" || !s.choices || s.answer < 0 || s.answer >= s.choices.length) bad(`${st}: bad answer index`);
        if (words(s.q) > CAPS.q) bad(`${st}: q > ${CAPS.q} words`);
        if (words(s.why) > CAPS.why) bad(`${st}: why > ${CAPS.why} words`);
      }
      const visible = s.type === "rule" ? [s.title, s.say, s.example, s.plain || "", s.hook || ""] : [s.q, s.why].concat(s.choices || []);
      for (const v of visible) if (/[0-9]/.test(String(v))) bad(`${st}: Latin digit in "${v}"`);
    });
  });
  for (const id of qids) if (!seenQ.has(id)) bad(`${key}: question ${id} belongs to no chunk`);
  const more = Array.isArray(t.more) ? t.more : [];
  const all = taught.concat(more);
  for (const n of rules.keys()) {
    const c = all.filter(x => x === n).length;
    if (c !== 1) bad(`${key}: rule ${n} appears ${c} times across chunks + more (must be exactly 1)`);
  }
  for (const n of all) if (!rules.has(n)) bad(`${key}: rule ${n} in cards/more does not exist`);
  const checks = t.chunks.reduce((a, c) => a + c.steps.filter(s => s.type === "check").length, 0);
  console.log(`${key}: ${t.chunks.length} chunks · ${taught.length} rules taught · ${more.length} in guidebook · ${checks} checks · ${seenQ.size}/${qids.size} questions mapped`);
}
for (const k of Object.keys(fig)) {
  if (ONLY && !ONLY.has(k.split(":")[0])) continue;
  if (!figUsed.has(k)) bad(`figure ${k} is not attached to any taught rule`);
  if (!/^<svg[\s>]/.test(String(fig[k]).trim())) bad(`figure ${k} is not an <svg>`);
  if (/[0-9]/.test(String(fig[k]).replace(/<[^>]+>/g, ""))) bad(`figure ${k}: Latin digit in a label`);
}
if (Object.keys(fig).length) console.log(`figures: ${Object.keys(fig).length}`);
console.log(failed ? "RESULT: FAILED" : "RESULT: OK");
process.exit(failed ? 1 : 0);
