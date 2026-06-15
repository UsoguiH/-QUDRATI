// Merges agent outputs (tools/methods/out/<domain>.<lesson>.json) back into the
// data files: injects a per-question `method` (right after `solution`) and prints
// an answer-key audit report (every place an agent's independent solve disagreed
// with the stored key). Re-serializes each data file with stable key order so the
// git diff stays minimal.
const fs = require("fs"), vm = require("vm"), path = require("path");
const dataDir = path.join(__dirname, "..", "..", "js", "data");
const outDir = path.join(__dirname, "out");

const KEY_ORDER = ["id", "format", "difficulty", "track", "stem", "choices",
  "value1", "value2", "answer", "solution", "method", "figure"];

function ordered(q) {
  const o = {};
  for (const k of KEY_ORDER) if (k in q) o[k] = q[k];
  for (const k of Object.keys(q)) if (!(k in o)) o[k] = q[k]; // any extras last
  return o;
}

// Load all agent outputs, keyed by question id.
const methods = {};       // id -> method string
const audits = [];        // {id, myAnswer, keyAnswer, verdict, note}
let outFiles = 0;
for (const fn of fs.existsSync(outDir) ? fs.readdirSync(outDir) : []) {
  if (!fn.endsWith(".json")) continue;
  outFiles++;
  const arr = JSON.parse(fs.readFileSync(path.join(outDir, fn), "utf8"));
  for (const r of arr) {
    if (r.method) methods[r.id] = r.method;
    audits.push(r);
  }
}

// Inject methods into the data files.
let injected = 0, missing = [];
for (const f of ["numbers", "geometry", "ratios", "skills"]) {
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(dataDir, f + ".js"), "utf8"), ctx);
  const d = ctx.window.QBANK[f];
  for (const l of d.lessons) {
    l.questions = l.questions.map(q => {
      if (methods[q.id]) { q.method = methods[q.id]; injected++; }
      else missing.push(q.id);
      return ordered(q);
    });
  }
  const body = "window.QBANK = window.QBANK || {};\nwindow.QBANK." + f +
    " = " + JSON.stringify(d, null, 2) + ";\n";
  fs.writeFileSync(path.join(dataDir, f + ".js"), body, "utf8");
}

// Audit report.
const mismatches = audits.filter(a => a.verdict === "mismatch");
console.log("=== APPLY REPORT ===");
console.log("agent output files:", outFiles);
console.log("methods injected   :", injected);
console.log("questions w/o method:", missing.length, missing.length ? missing.join(",") : "");
console.log("\n=== ANSWER-KEY AUDIT: " + mismatches.length + " mismatch(es) ===");
for (const m of mismatches) {
  console.log(`  ${m.id}: key=${m.keyAnswer} agent=${m.myAnswer} :: ${m.note || ""}`);
}
fs.writeFileSync(path.join(__dirname, "audit-report.json"),
  JSON.stringify({ injected, missing, mismatches, allAudits: audits }, null, 2), "utf8");
console.log("\nfull report -> tools/methods/audit-report.json");
