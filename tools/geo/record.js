#!/usr/bin/env node
/* Records tools/geo/short.html into mp4 files, one per rule: 1080 × 1920, 30 frames a second, H.264 with a
   silent audio track (some uploaders refuse a file with none). Zero dependencies: Node 22's own WebSocket
   speaks to headless Chrome, which draws each frame at its exact time (short.html's render(t)), and ffmpeg
   encodes them. Needs the dev server (node tools/serve.js), Chrome and ffmpeg on the PATH.

     node tools/geo/record.js                 # all six into tools/geo/shorts/, each with its cover <id>.jpg
     node tools/geo/record.js square circle   # only these
     node tools/geo/record.js --frame=9 speed # one png of second 9 instead (tools/geo/shorts/speed-9.png)

   CHROME and BASE (http://localhost:8080) may be set in the environment. */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), { spawn, execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..", ".."), OUT = path.join(__dirname, "shorts");
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE || "http://localhost:8080";
const IDS = ["square", "circle", "speed", "squares", "powers", "proportion"];
const FPS = 30, W = 1080, H = 1920;
const args = process.argv.slice(2);
const frameAt = (args.find(a => a.startsWith("--frame=")) || "").slice(8);
const want = args.filter(a => !a.startsWith("--"));
for (const id of want) if (!IDS.includes(id)) { console.error(`unknown video «${id}»; one of: ${IDS.join(", ")}`); process.exit(2); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function chrome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qudrati-short-"));
  const proc = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${dir}`, `--window-size=${W},${H}`,
    "--force-device-scale-factor=1", "--hide-scrollbars", "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
  const portFile = path.join(dir, "DevToolsActivePort");
  for (const until = Date.now() + 20000; !fs.existsSync(portFile);) { if (Date.now() > until) throw new Error("Chrome did not start"); await sleep(100); }
  const port = fs.readFileSync(portFile, "utf8").split("\n")[0].trim();
  let target;
  for (const until = Date.now() + 10000; !target;) {
    const list = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json()).catch(() => []);
    target = list.find(t => t.type === "page");
    if (!target) { if (Date.now() > until) throw new Error("Chrome has no page"); await sleep(100); }
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("no DevTools socket")); });
  let seq = 0; const waiting = new Map(), events = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id) { const w = waiting.get(m.id); waiting.delete(m.id); m.error ? w.no(new Error(m.error.message)) : w.ok(m.result); } else events.push(m.method); };
  const send = (method, params) => new Promise((ok, no) => { const id = ++seq; waiting.set(id, { ok, no }); ws.send(JSON.stringify({ id, method, params: params || {} })); });
  const evaluate = async expression => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("page error: " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const open = async url => {
    events.length = 0;
    await send("Page.navigate", { url });
    for (const until = Date.now() + 20000; !events.includes("Page.loadEventFired");) { if (Date.now() > until) throw new Error("the page did not load: " + url); await sleep(50); }
  };
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  const close = async () => { try { await send("Browser.close"); } catch {} await sleep(400); try { proc.kill(); } catch {} try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} };
  const shot = async () => Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64");
  return { open, evaluate, shot, close };
}

async function record(c, id) {
  await c.open(`${BASE}/tools/geo/short.html?id=${id}&rec=1`);
  const dur = await c.evaluate("window.READY");
  if (!(dur > 5 && dur < 60)) throw new Error(`${id}: the page gave no length (${dur})`);
  if (frameAt) {
    await c.evaluate(`window.render(${+frameAt})`);
    const out = path.join(OUT, `${id}-${frameAt}.png`);
    fs.writeFileSync(out, await c.shot());
    return console.log(`wrote ${path.relative(ROOT, out)}  second ${frameAt} of ${dur}`);
  }
  const out = path.join(OUT, id + ".mp4"), n = Math.round(dur * FPS);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-shortest",
    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(FPS), "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "96k", out], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((ok, no) => { ff.on("error", no); ff.on("close", code => code ? no(new Error("ffmpeg exited " + code)) : ok()); });
  for (let f = 0; f < n; f++) {
    await c.evaluate(`window.render(${(f / FPS).toFixed(5)})`);
    const png = await c.shot();
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once("drain", r));
  }
  ff.stdin.end(); await done;
  /* its cover: the frame with the rule, the example and the answer all in sight (the answer shows from 5.65s to 3.35s before the end) */
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", (dur - 4.2).toFixed(2), "-i", out, "-frames:v", "1", "-vf", "scale=540:-1", "-q:v", "3", path.join(OUT, id + ".jpg")]);
  console.log(`wrote ${path.relative(ROOT, out)}  ${dur}s, ${n} frames, ${(fs.statSync(out).size / 1e6).toFixed(2)} MB`);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const c = await chrome();
  try { for (const id of want.length ? want : IDS) await record(c, id); }
  finally { await c.close(); }
})().catch(e => { console.error(e.message); process.exit(1); });
