// Dumps each lesson's questions to tools/methods/in/<domain>.<lesson>.json
// so the audit/hint agents have a clean, focused input per lesson.
const fs = require("fs"), vm = require("vm"), path = require("path");
const dataDir = path.join(__dirname, "..", "..", "js", "data");
const inDir = path.join(__dirname, "in");
fs.mkdirSync(inDir, { recursive: true });
for (const f of ["numbers", "geometry", "ratios", "skills"]) {
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(dataDir, f + ".js"), "utf8"), ctx);
  const d = ctx.window.QBANK[f];
  for (const l of d.lessons) {
    const out = {
      domain: f, lessonKey: l.key, lessonTitle: l.title,
      lessonMethod: l.method || "",
      questions: l.questions.map(q => ({
        id: q.id, format: q.format, difficulty: q.difficulty,
        stem: q.stem,
        ...(q.format === "comparison" ? { value1: q.value1, value2: q.value2 } : { choices: q.choices }),
        answer: q.answer,
        solution: q.solution,
        ...(q.figure ? { figure: q.figure } : {})
      }))
    };
    fs.writeFileSync(path.join(inDir, f + "." + l.key + ".json"), JSON.stringify(out, null, 2), "utf8");
  }
}
console.log("dumped", fs.readdirSync(inDir).length, "lesson input files to", inDir);
