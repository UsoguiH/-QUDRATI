/* Production audit for قدراتي — transfer weight, load timing, accessibility
   basics and tap-target sizes, measured on a throttled mobile profile.
   These are the numbers ROADMAP.md is scored against, so re-run this rather
   than arguing about whether the app "feels" fast.

   Drives headless Chrome over the DevTools Protocol using Node's built-in
   WebSocket — no npm, in keeping with the rest of the project.

   usage:
     node tools/audit.js                      # audits https://qudrati.xyz/
     node tools/audit.js http://localhost:8080/index.html
     node tools/audit.js <url> --fast         # no throttling

   Needs Chrome installed. Override the path with CHROME=/path/to/chrome.
*/
const { spawn } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");

const CHROME = process.env.CHROME || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find(p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } });

const URL = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "https://qudrati.xyz/";
const FAST = process.argv.includes("--fast");
const PORT = 9222 + (process.pid % 700);
const PROFILE = path.join(os.tmpdir(), "qudrati-audit-" + process.pid);
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!CHROME) {
  console.error("Chrome not found. Set CHROME=/path/to/chrome and try again.");
  process.exit(1);
}

const SELECTORS_NOTE = "throttled profile: ~1.6 Mbps down, 150 ms RTT, 4x CPU slowdown";

(async () => {
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
    "--force-device-scale-factor=1", "--hide-scrollbars",
    "--user-data-dir=" + PROFILE, "--remote-debugging-port=" + PORT, "about:blank",
  ], { stdio: "ignore" });

  let target = null;
  for (let i = 0; i < 80 && !target; i++) {
    try {
      const list = await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json();
      target = list.find(t => t.type === "page");
    } catch (e) { /* not up yet */ }
    if (!target) await sleep(220);
  }
  if (!target) { console.error("DevTools never came up"); chrome.kill(); process.exit(1); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  const transfers = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === "Network.loadingFinished") transfers.push(m.params.encodedDataLength || 0);
  };
  const send = (method, params) => new Promise(res => {
    const i = ++id; pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params: params || {} }));
  });
  const evaluate = async expr => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
    return r.result && r.result.result ? r.result.result.value : null;
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride",
    { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenWidth: 390, screenHeight: 844 });
  if (!FAST) {
    await send("Network.emulateNetworkConditions",
      { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    await send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }

  await send("Page.navigate", { url: URL });
  await sleep(FAST ? 4000 : 9000);

  const kb = Math.round(transfers.reduce((a, b) => a + b, 0) / 1024);
  console.log("");
  console.log("  " + URL);
  console.log("  " + (FAST ? "unthrottled" : SELECTORS_NOTE));
  console.log("");
  console.log("  transfer        " + kb + " KB over the wire, " + transfers.length + " requests");
  console.log(await evaluate(`(function () {
    var nav = performance.getEntriesByType('navigation')[0] || {};
    var fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    var pad = function (s) { return ('  ' + s + '                    ').slice(0, 20); };
    var out = [];
    out.push(pad('FCP') + Math.round(fcpEntry ? fcpEntry.startTime : 0) + ' ms');
    out.push(pad('DOMContentLoaded') + Math.round(nav.domContentLoadedEventEnd) + ' ms');
    out.push(pad('load') + Math.round(nav.loadEventEnd) + ' ms');
    out.push('');
    var imgs = [].slice.call(document.images);
    out.push(pad('images') + imgs.length + ', missing alt: ' + imgs.filter(function (i) { return !i.hasAttribute('alt'); }).length);
    var controls = [].slice.call(document.querySelectorAll('button, a[href], input, select'));
    var unnamed = controls.filter(function (b) {
      return !(b.textContent || '').trim() && !b.getAttribute('aria-label') &&
             !b.getAttribute('title') && !b.getAttribute('placeholder');
    });
    out.push(pad('controls') + controls.length + ', with no accessible name: ' + unnamed.length);
    var small = controls.filter(function (b) {
      var r = b.getBoundingClientRect();
      return r.width > 0 && (r.width < 44 || r.height < 44);
    });
    out.push(pad('tap targets') + small.length + ' under 44x44' + (small.length
      ? '  (' + small.slice(0, 6).map(function (b) {
          var r = b.getBoundingClientRect();
          return (b.className || b.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
        }).join(', ') + ')' : ''));
    out.push(pad('document') + 'lang=' + document.documentElement.lang + '  dir=' + document.documentElement.dir +
             '  h1=' + document.querySelectorAll('h1').length +
             '  landmarks=' + document.querySelectorAll('nav,main,aside,header,footer').length);
    return out.join(String.fromCharCode(10));
  })()`));
  console.log("");

  await send("Browser.close").catch(() => {});
  ws.close();
  try { chrome.kill("SIGKILL"); } catch (e) {}
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {}
  process.exit(0);
})();
