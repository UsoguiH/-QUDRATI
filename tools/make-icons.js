/* Generates the PWA icons from scratch — no image library, no npm.
   Writes a green disc (regular) and a full-bleed green tile (maskable),
   each with the white star from the app's favicon.

   usage: node tools/make-icons.js
*/
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const OUT = path.join(__dirname, "..", "assets", "icons", "app");
const GREEN = [0x58, 0xCC, 0x02];
const LIP = [0x47, 0x87, 0x00];
const WHITE = [0xFF, 0xFF, 0xFF];

/* ---------- PNG encoding ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;   // 8-bit RGBA
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;                                            // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- geometry ---------- */
function starPoints(cx, cy, outer, inner, rot) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = rot + i * Math.PI / 5;
    pts.push([cx + r * Math.sin(a), cy - r * Math.cos(a)]);
  }
  return pts;
}
function inPoly(x, y, pts) {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/* ---------- drawing ---------- */
const SS = 4;                                    // supersampling factor per axis
function draw(size, maskable) {
  const buf = Buffer.alloc(size * size * 4);
  const c = size / 2;
  const discR = size * 0.47;
  const radius = size * 0.22;                    // maskable tile corner radius
  const starR = size * (maskable ? 0.26 : 0.31); // maskable keeps the star in the safe zone
  const star = starPoints(c, c * 1.02, starR, starR * 0.44, 0);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0, st = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS, py = y + (sy + 0.5) / SS;
          let inBg;
          if (maskable) {
            const dx = Math.max(Math.abs(px - c) - (c - radius), 0);
            const dy = Math.max(Math.abs(py - c) - (c - radius), 0);
            inBg = Math.hypot(dx, dy) <= radius;
          } else {
            inBg = Math.hypot(px - c, py - c) <= discR;
          }
          if (inBg) bg++;
          if (inPoly(px, py, star)) st++;
        }
      }
      const n = SS * SS;
      const aBg = bg / n, aSt = (st / n) * aBg;   // the star never spills outside the shape
      const i = (y * size + x) * 4;
      // a hair of the darker lip at the very bottom gives the disc some depth
      const lip = !maskable && y > size * 0.86 ? Math.min(1, (y - size * 0.86) / (size * 0.1)) : 0;
      const base = [
        GREEN[0] + (LIP[0] - GREEN[0]) * lip,
        GREEN[1] + (LIP[1] - GREEN[1]) * lip,
        GREEN[2] + (LIP[2] - GREEN[2]) * lip,
      ];
      for (let k = 0; k < 3; k++) buf[i + k] = Math.round(base[k] * (1 - aSt) + WHITE[k] * aSt);
      buf[i + 3] = Math.round(aBg * 255);
    }
  }
  return png(size, size, buf);
}

fs.mkdirSync(OUT, { recursive: true });
const jobs = [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-192.png", 192, true],
  ["icon-maskable-512.png", 512, true],
  ["apple-touch-icon.png", 180, true],
];
jobs.forEach(([name, size, maskable]) => {
  const data = draw(size, maskable);
  fs.writeFileSync(path.join(OUT, name), data);
  console.log(name + "  " + size + "x" + size + "  " + (data.length / 1024).toFixed(1) + " KB");
});
