// Deterministic answer-key audit: an independent (non-LLM) channel.
// Converts Arabic-Indic math to a JS-evaluable expression and re-solves every
// question whose content is cleanly computable, then compares to the stored key.
// Anything not safely parseable is reported as "skipped" (left for human/LLM check).
const fs = require("fs"), vm = require("vm");

// --- Arabic-Indic + Saudi notation -> plain arithmetic ---
function normalize(s) {
  if (s == null) return "";
  let t = String(s);
  const ar = "٠١٢٣٤٥٦٧٨٩";
  t = t.replace(/[٠-٩]/g, d => ar.indexOf(d));
  t = t.replace(/٫/g, ".").replace(/[،٬]/g, "");      // decimal / thousands
  t = t.replace(/×|✕|⋅|∙/g, "*").replace(/÷/g, "/");
  t = t.replace(/−|–|—/g, "-");
  t = t.replace(/[\[\{﴾]/g, "(").replace(/[\]\}﴿]/g, ")");  // brackets -> parens
  t = t.replace(/\s+/g, "");
  return t;
}

// Evaluate a pure arithmetic string. Supports + - * / ( ) , decimals, %,
// ^ powers, and √ (sqrt of the following number/parenthesis). Returns number or null.
function evalExpr(raw) {
  let t = normalize(raw);
  if (!t) return null;
  // percentage: N% -> (N/100)
  t = t.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
  // caret powers a^b -> Math.pow
  // handle √n and √(...)
  t = t.replace(/√\s*\(/g, "Math.sqrt(");
  t = t.replace(/√\s*(\d+(?:\.\d+)?)/g, "Math.sqrt($1)");
  t = t.replace(/(\d+(?:\.\d+)?|\))\s*\^\s*(\d+(?:\.\d+)?|\()/g, "Math.pow($1,$2)");
  // reject anything that isn't a safe arithmetic expression now
  if (!/^[-+*/().\d\sMathpow,sqrt]*$/.test(t)) return null;
  if (!/\d/.test(t)) return null;
  try {
    const v = vm.runInNewContext(t, { Math });
    return (typeof v === "number" && isFinite(v)) ? v : null;
  } catch { return null; }
}

const eq = (a, b) => Math.abs(a - b) < 1e-9;

// Try to read a single numeric value out of an mcq choice ("٥٫٧٥ ريال" -> 5.75)
function choiceVal(c) {
  const m = normalize(c).match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

const real = {};
for (const f of ["numbers", "geometry", "ratios", "skills"]) {
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync("js/data/" + f + ".js", "utf8"), ctx);
  for (const l of ctx.window.QBANK[f].lessons)
    for (const q of l.questions) real[q.id] = q;
}

let checked = 0, ok = 0, fail = [], skipped = 0;
for (const id in real) {
  const q = real[id];
  if (q.format === "comparison") {
    const v1 = evalExpr(q.value1), v2 = evalExpr(q.value2);
    if (v1 == null || v2 == null) { skipped++; continue; }
    const det = eq(v1, v2) ? 2 : (v1 > v2 ? 0 : 1);
    checked++;
    if (det === q.answer) ok++;
    else fail.push(`${id} [cmp]: v1=${v1} v2=${v2} -> det=${det} but key=${q.answer}`);
  } else {
    // mcq: only when the WHOLE stem is "compute this expression" — strip a
    // leading prompt (ما قيمة/احسب/ناتج/حاصل...) and trailing (؟/يساوي:/=) and
    // require what remains to be a pure arithmetic expression. Avoids matching
    // an incidental sub-step number inside a word problem.
    const sval = (() => {
      let s = String(q.stem)
        .replace(/^[^0-9٠-٩\-(\[√]*/, "")   // drop Arabic prompt words before the math (keep leading √/(/-)
        .replace(/[؟?=:]\s*$/, "")
        .replace(/يساوي\s*$/, "");
      const norm = normalize(s);
      if (!/^[-+*/().\d√^%]+$/.test(norm)) return null;  // must be PURE math
      if (!/[+\-*/^√]/.test(norm)) return null;          // must contain an operator
      return evalExpr(s);
    })();
    const cvals = q.choices ? q.choices.map(choiceVal) : [];
    if (sval == null || cvals.some(v => v == null) || new Set(cvals).size !== 4) { skipped++; continue; }
    const idx = cvals.findIndex(v => eq(v, sval));
    if (idx === -1) { skipped++; continue; } // computed value not among choices -> not a clean case
    checked++;
    if (idx === q.answer) ok++;
    else fail.push(`${id} [mcq]: stem=${sval} -> choice#${idx} but key=${q.answer} (choices=${cvals})`);
  }
}

console.log("=== DETERMINISTIC AUDIT ===");
console.log("deterministically checked:", checked, "| agreed:", ok, "| DISAGREED:", fail.length, "| skipped (not cleanly parseable):", skipped);
fail.forEach(f => console.log("  ✗", f));
if (!fail.length) console.log("  ✓ every deterministically-solvable question agrees with the stored key");
