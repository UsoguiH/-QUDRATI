// Structural validator for question bank files
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dataDir = path.join(__dirname, "..", "js", "data");
const ctx = { window: {} };
vm.createContext(ctx);

let failed = false;
const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".js"));
for (const f of files) {
  const src = fs.readFileSync(path.join(dataDir, f), "utf8");
  try { vm.runInContext(src, ctx, { filename: f }); }
  catch (e) { console.log(`SYNTAX FAIL ${f}: ${e.message}`); failed = true; }
}

const QBANK = ctx.window.QBANK || {};
const ids = new Set();
for (const [dk, d] of Object.entries(QBANK)) {
  if (!d.title || !d.lessons || !Array.isArray(d.lessons)) { console.log(`BAD DOMAIN ${dk}`); failed = true; continue; }
  let total = 0, figures = 0, cmpDist = [0, 0, 0, 0];
  for (const l of d.lessons) {
    if (!l.key || !l.title || !Array.isArray(l.questions)) { console.log(`BAD LESSON ${dk}.${l && l.key}`); failed = true; continue; }
    const diffs = [0, 0, 0, 0];
    let mcq = 0, cmp = 0, ordered = true, last = 0;
    for (const q of l.questions) {
      total++;
      const tag = `${dk}.${l.key}.${q.id}`;
      if (!q.id) { console.log(`NO ID in ${dk}.${l.key}`); failed = true; }
      if (ids.has(q.id)) { console.log(`DUP ID ${tag}`); failed = true; } ids.add(q.id);
      if (![1, 2, 3].includes(q.difficulty)) { console.log(`BAD DIFF ${tag}`); failed = true; } else diffs[q.difficulty]++;
      if (q.difficulty < last) ordered = false; last = Math.max(last, q.difficulty || 0);
      if (!["both", "sci", "lit"].includes(q.track)) { console.log(`BAD TRACK ${tag}: ${q.track}`); failed = true; }
      if (typeof q.answer !== "number" || q.answer < 0 || q.answer > 3) { console.log(`BAD ANSWER ${tag}: ${q.answer}`); failed = true; }
      if (!q.solution || q.solution.length < 10) { console.log(`WEAK SOLUTION ${tag}`); failed = true; }
      if (q.format === "mcq") {
        mcq++;
        if (!Array.isArray(q.choices) || q.choices.length !== 4) { console.log(`BAD CHOICES ${tag}`); failed = true; }
        else if (new Set(q.choices.map(String)).size !== 4) console.log(`WARN dup choices ${tag}`);
      } else if (q.format === "comparison") {
        cmp++; cmpDist[q.answer]++;
        if (!q.value1 || !q.value2) { console.log(`MISSING VALUES ${tag}`); failed = true; }
      } else { console.log(`BAD FORMAT ${tag}: ${q.format}`); failed = true; }
      if (q.figure) {
        figures++;
        if (!/^<(svg|table|div)/.test(q.figure.trim())) { console.log(`ODD FIGURE ${tag}`); failed = true; }
      }
      if (typeof q.stem !== "string") { console.log(`BAD STEM ${tag}`); failed = true; }
      const latin = ((q.stem || "") + (q.solution || "")).match(/[0-9]{2,}/g);
      if (latin) console.log(`WARN latin digits ${tag}: ${latin.join(",")}`);
    }
    console.log(`${dk}.${l.key}: ${l.questions.length} q (E${diffs[1]}/M${diffs[2]}/H${diffs[3]}) mcq=${mcq} cmp=${cmp} ordered=${ordered ? "yes" : "NO"}`);
  }
  console.log(`== ${dk}: ${total} questions, ${figures} figures, cmp answers dist=[${cmpDist}]\n`);
}
console.log(failed ? "RESULT: FAILED" : "RESULT: OK");
process.exit(failed ? 1 : 0);
