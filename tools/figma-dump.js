/* Dump compact style info from Figma nodes (one-off design extraction tool) */
const https = require("https");
const TOKEN = process.env.FIGMA_TOKEN;
if (!TOKEN) { console.error("Set FIGMA_TOKEN env var first"); process.exit(1); }
const FILE = "sCGqaL307LkNrY35xnV66O";
const ids = process.argv[2];
const maxDepth = parseInt(process.argv[3] || "99", 10);

function hex(c) {
  const h = v => Math.round(v * 255).toString(16).padStart(2, "0").toUpperCase();
  let s = "#" + h(c.r) + h(c.g) + h(c.b);
  if (c.a !== undefined && c.a < 1) s += " a:" + c.a.toFixed(2);
  return s;
}
function paint(fills) {
  if (!fills || !fills.length) return "";
  return fills.filter(f => f.visible !== false).map(f => {
    if (f.type === "SOLID") return hex({ ...f.color, a: f.opacity !== undefined ? f.opacity : f.color.a });
    if (f.type && f.type.startsWith("GRADIENT")) return "grad(" + (f.gradientStops || []).map(s => hex(s.color)).join(">") + ")";
    return f.type;
  }).join(",");
}
function line(n, d) {
  if (d > maxDepth) return "";
  const pad = "  ".repeat(d);
  let parts = ["[" + n.id + "] " + n.type + ":" + JSON.stringify(n.name)];
  if (n.absoluteBoundingBox) parts.push(Math.round(n.absoluteBoundingBox.width) + "x" + Math.round(n.absoluteBoundingBox.height));
  const f = paint(n.fills); if (f) parts.push("fill:" + f);
  const st = paint(n.strokes); if (st) parts.push("stroke:" + st + " w:" + n.strokeWeight);
  if (n.cornerRadius) parts.push("r:" + n.cornerRadius);
  if (n.rectangleCornerRadii) parts.push("r:[" + n.rectangleCornerRadii + "]");
  if (n.effects && n.effects.length) parts.push("fx:" + n.effects.filter(e => e.visible !== false).map(e => e.type + " " + (e.color ? hex(e.color) : "") + " off:" + (e.offset ? e.offset.x + "," + e.offset.y : "") + " blur:" + e.radius).join(" | "));
  if (n.style) parts.push(`font:${n.style.fontFamily} ${n.style.fontWeight} ${n.style.fontSize}px ls:${(n.style.letterSpacing || 0).toFixed(1)} lh:${n.style.lineHeightPx ? Math.round(n.style.lineHeightPx) : "-"}`);
  if (n.type === "TEXT" && n.characters) parts.push("txt:" + JSON.stringify(n.characters.slice(0, 40)));
  if (n.opacity !== undefined && n.opacity < 1) parts.push("op:" + n.opacity.toFixed(2));
  let out = pad + parts.join("  ") + "\n";
  (n.children || []).forEach(c => { out += line(c, d + 1); });
  return out;
}
const useFileEp = process.argv[4] === "file";
const url = useFileEp
  ? `https://api.figma.com/v1/files/${FILE}?ids=${encodeURIComponent(ids)}&depth=${maxDepth}`
  : `https://api.figma.com/v1/files/${FILE}/nodes?ids=${encodeURIComponent(ids)}`;
https.get(url, { headers: { "X-Figma-Token": TOKEN } }, res => {
  let body = "";
  res.on("data", c => body += c);
  res.on("end", () => {
    if (res.statusCode !== 200) { console.error("HTTP " + res.statusCode + ": " + body.slice(0, 300)); process.exit(1); }
    let j;
    try { j = JSON.parse(body); } catch (e) { console.error("Parse error, body length " + body.length); process.exit(1); }
    if (useFileEp) {
      (j.document.children || []).forEach(p => {
        console.log("==== PAGE " + p.name + " ====");
        console.log(line(p, 0));
      });
    } else {
      for (const k in j.nodes) {
        console.log("==== " + k + " ====");
        console.log(line(j.nodes[k].document, 0));
      }
    }
  });
}).on("error", e => { console.error("Request error: " + e.message); process.exit(1); });
