// Print one lesson exactly as the app sees it, so teaching cards can be written
// against the real data instead of against the markdown.
//   node tools/lesson.js                 — list every lesson key with its counts
//   node tools/lesson.js skills.fastest  — that lesson's rules, tricks and questions
//   node tools/lesson.js skills.fastest --rules   — rules only
//   node tools/lesson.js skills.fastest --q       — questions only
// A rule's `formula` is printed between markers so it can be copied byte-for-byte:
// the card validator compares it verbatim.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dataDir = path.join(__dirname, "..", "js", "data");
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of fs.readdirSync(dataDir).filter(f => f.endsWith(".js")))
  vm.runInContext(fs.readFileSync(path.join(dataDir, f), "utf8"), ctx, { filename: f });
const QBANK = ctx.window.QBANK || {}, QTEACH = ctx.window.QTEACH || {}, FIG = ctx.window.QTEACH_FIG || {};

const args = process.argv.slice(2);
const key = args.find(a => !a.startsWith("--"));
const only = { rules: args.includes("--rules"), q: args.includes("--q") };

if (!key) {
  console.log("key".padEnd(22) + "q   rules  cards  title");
  for (const [dk, d] of Object.entries(QBANK))
    for (const l of d.lessons) {
      const t = QTEACH[`${dk}.${l.key}`];
      console.log(`${dk}.${l.key}`.padEnd(22)
        + String(l.questions.length).padEnd(4)
        + String((l.rules || []).length).padEnd(7)
        + (t ? `${t.chunks.length}ch` : "—").padEnd(7) + (l.title || l.name || ""));
    }
  process.exit(0);
}

const [dk, lk] = key.split(".");
const les = QBANK[dk] && QBANK[dk].lessons.find(l => l.key === lk);
if (!les) { console.error(`no such lesson: ${key}`); process.exit(1); }

console.log(`== ${key} — ${les.title || les.name || ""}`);
console.log(`stars/difficulty ${les.stars} · xp ${les.xp} · pages ${les.pages || "—"} · category ${les.category || "—"}`);
if (les.goal) console.log(`goal: ${les.goal}`);
if (les.tricks) console.log(`\ntricks (خدعة الاختبار):\n${les.tricks}`);
if (les.notes) console.log(`\nnotes:\n${[].concat(les.notes).join("\n")}`);

if (!only.q) {
  console.log(`\n-- rules (${(les.rules || []).length}) --`);
  for (const r of les.rules || []) {
    console.log(`\n[${r.n}] ${r.name}${r.inferred ? "   (inferred)" : ""}`);
    console.log(`formula>>>${r.formula}<<<`);
    if (r.when) console.log(`when: ${r.when}`);
    const f = FIG[`${key}:${r.n}`];
    if (f) console.log(`figure: yes (${f.length} chars)`);
  }
}

if (!only.rules) {
  console.log(`\n-- questions (${les.questions.length}) --`);
  for (const q of les.questions) {
    console.log(`\n[${q.id}] ${q.format} · difficulty ${q.difficulty} · track ${q.track}${q.figure ? " · FIGURE" : ""}`);
    console.log(`stem: ${q.stem}`);
    if (q.choices) console.log(`choices: ${q.choices.map((c, i) => (i === q.answer ? "*" : "") + c).join("  |  ")}`);
    if (q.value1 !== undefined) console.log(`value1: ${q.value1}\nvalue2: ${q.value2}\nanswer: ${q.answer}`);
    console.log(`solution: ${String(q.solution).replace(/\n/g, "\n          ")}`);
  }
}
