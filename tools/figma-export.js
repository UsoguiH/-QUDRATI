/* Export Figma nodes as SVG/PNG asset files (one-off design extraction tool) */
const https = require("https");
const fs = require("fs");
const path = require("path");
const TOKEN = process.env.FIGMA_TOKEN;
if (!TOKEN) { console.error("Set FIGMA_TOKEN env var first"); process.exit(1); }
const FILE = "sCGqaL307LkNrY35xnV66O";

const SVG_ASSETS = {
  "8:551": "streak", "8:548": "gem", "8:550": "heart",
  "8:1283": "nav-home", "8:1284": "nav-chest", "8:1285": "nav-weights",
  "8:1286": "nav-trophy", "8:1288": "nav-more",
  "9:664": "guide",
  "9:799": "star", "9:796": "dumbbell", "9:797": "book",
  "9:801": "headphones", "9:798": "video", "9:800": "mic",
  "9:897": "star-locked", "9:913": "dumbbell-locked", "9:881": "book-locked",
  "9:888": "headphones-locked", "9:900": "video-locked", "9:909": "mic-locked",
  "9:920": "star-done",
  "11:1854": "target", "11:1884": "timer", "11:1817": "lightning",
  "8:2079": "check"
};

const outDir = path.join(__dirname, "..", "assets", "icons");
fs.mkdirSync(outDir, { recursive: true });

function get(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, res => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location, {}).then(resolve, reject);
        }
        if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode + " " + Buffer.concat(chunks).toString().slice(0, 200)));
        resolve(Buffer.concat(chunks));
      });
    }).on("error", reject);
  });
}

(async () => {
  const ids = Object.keys(SVG_ASSETS).join(",");
  const meta = JSON.parse(await get(
    `https://api.figma.com/v1/images/${FILE}?ids=${encodeURIComponent(ids)}&format=svg`,
    { "X-Figma-Token": TOKEN }
  ));
  if (meta.err) throw new Error(meta.err);
  for (const [id, name] of Object.entries(SVG_ASSETS)) {
    const url = meta.images[id];
    if (!url) { console.log("MISSING " + name); continue; }
    const buf = await get(url, {});
    fs.writeFileSync(path.join(outDir, name + ".svg"), buf);
    console.log("ok " + name + ".svg (" + buf.length + "b)");
  }
})().catch(e => { console.error(e.message); process.exit(1); });
