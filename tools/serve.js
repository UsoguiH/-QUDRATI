/* Local dev server for قدراتي — zero dependencies, Node only.
   A server (rather than opening index.html directly) is needed because
   file:// blocks the fetches the app makes, and because mobile.html polls
   Last-Modified to auto-reload when you save a file.

   usage:  node tools/serve.js [port]        (default 8080)
*/
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.join(__dirname, "..");
const PORT = Number(process.argv[2]) || 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  // text/plain so the browser SHOWS notes and prompt files instead of downloading
  // them -- without this they fall through to octet-stream and land in Downloads
  ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".woff2": "font/woff2",
  ".riv": "application/octet-stream",
  ".wasm": "application/wasm",
  ".apk": "application/vnd.android.package-archive",
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(ROOT, path.normalize(rel));

  // never serve outside the project
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end("forbidden"); return; }

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); res.end("404 " + rel); return; }
    const head = {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": st.size,
      // no caching, so a save shows up on the next reload
      "Cache-Control": "no-store, must-revalidate",
      // mobile.html polls this to know when to auto-reload
      "Last-Modified": st.mtime.toUTCString(),
    };
    if (req.method === "HEAD") { res.writeHead(200, head); res.end(); return; }
    res.writeHead(200, head);
    fs.createReadStream(file).pipe(res);
  });
}).listen(PORT, () => {
  const nets = os.networkInterfaces();
  const lan = Object.values(nets).flat().filter(Boolean)
    .find(n => n.family === "IPv4" && !n.internal);
  console.log("");
  console.log("  قدراتي — dev server running");
  console.log("");
  console.log("  app             http://localhost:" + PORT + "/");
  console.log("  mobile preview  http://localhost:" + PORT + "/mobile.html");
  console.log("  screen harness  http://localhost:" + PORT + "/preview.html#path");
  if (lan) console.log("  on your phone   http://" + lan.address + ":" + PORT + "/   (same Wi-Fi)");
  console.log("");
  console.log("  Ctrl+C to stop.");
  console.log("");
});
