/* Shared stage for the round-5 loading-screen ideas: a 390×844 phone that
   loads, then hands over to the real welcome screen (captured from the app:
   welcome-base.png without its title and coins, welcome-hero.png the coins).
   The mark is the user's «قدراتي» (tools/splash/markmono.html), in its own units.
   ?load=ms   how long the "app" takes to load (default 2600)
   ?slow=N    everything N times slower
   A parent may postMessage {replay:true, load, slow}. */
const Q = new URLSearchParams(location.search);
const ST = { load: +(Q.get("load") || 2600), K: +(Q.get("slow") || 1) };
const SVGNS = "http://www.w3.org/2000/svg";

const MARK = {
  vb: [954, 1283, 4094, 1596],
  pieces: {
    qd: "M3563 2361L4007 2361L4096 2287L4166 2361L4847 2361L4988 2213L4988 1835L4847 1687L4573 1687L4396 1865L4396 2146L4458 2213L4166 2213L4166 1865L3978 1687L3682 1687L3682 1835L3918 1835L4007 1917L4007 2213L3563 2213Z M4625 1835L4847 1835L4847 2213L4662 2213L4544 2102L4544 1917Z",
    r:  "M3415 1687L3271 1687L3271 2361L3167 2531L3045 2531L3045 2664L3234 2664L3363 2531L3415 2475Z",
    a:  "M2879 1343L2879 2361L3023 2361L3023 1343Z",
    ty: "M2664 1687L2520 1687L2520 2213L2209 2213L2209 1687L1854 1687L1706 1835L1706 2361L1166 2361L1166 2046L1228 1980L1314 1980L1314 1835L1166 1835L1014 1980L1014 2361L1166 2531L1706 2531L1854 2361L1854 1835L2065 1835L2065 2361L2520 2361L2664 2213Z"
  },
  /* outlines one by one, in writing order (right to left) */
  outlines: [
    "M4847 1687L4573 1687L4396 1865L4396 2146L4458 2213L4166 2213L4166 1865L3978 1687L3682 1687L3682 1835L3918 1835L4007 1917L4007 2213L3563 2213L3563 2361L4007 2361L4096 2287L4166 2361L4847 2361L4988 2213L4988 1835Z",
    "M4625 1835L4847 1835L4847 2213L4662 2213L4544 2102L4544 1917Z",
    "M3415 1687L3271 1687L3271 2361L3167 2531L3045 2531L3045 2664L3234 2664L3363 2531L3415 2475Z",
    "M2879 1343L2879 2361L3023 2361L3023 1343Z",
    "M2664 1687L2520 1687L2520 2213L2209 2213L2209 1687L1854 1687L1706 1835L1706 2361L1166 2361L1166 2046L1228 1980L1314 1980L1314 1835L1166 1835L1014 1980L1014 2361L1166 2531L1706 2531L1854 2361L1854 1835L2065 1835L2065 2361L2520 2361L2664 2213Z"
  ],
  /* the six dots, right to left: ق ق ت ت ي ي */
  dots: [[4742, 1413, "qd"], [4503, 1413, "qd"], [2597, 1413, "ty"], [2366, 1413, "ty"], [1545, 2673, "ty"], [1310, 2673, "ty"]],
  dot: 152,
  bbox: { qd: [3563, 4988], r: [3045, 3415], a: [2879, 3023], ty: [1014, 2749] },
  top: 1343, bottom: 2825
};
const TITLE = { x: 120, y: 401.125, w: 150 };        // the welcome title, measured off the app at 390 wide
const HERO = { x: 71, y: 227.8125, w: 248, h: 155.3125 };
const mScale = w => w / MARK.vb[2];

function el(tag, attrs, parent) {
  const n = tag.startsWith("svg:") ? document.createElementNS(SVGNS, tag.slice(4)) : document.createElement(tag);
  for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
function wait(ms) { return new Promise(r => setTimeout(r, ms * ST.K)); }
function anim(n, kf, o) {
  const a = n.animate(kf, Object.assign({ fill: "forwards" }, o, { duration: (o.duration || 0) * ST.K, delay: (o.delay || 0) * ST.K }));
  return a.finished.catch(() => {});
}
function tween(ms, f, ease) {
  return new Promise(res => {
    const t0 = performance.now(), d = ms * ST.K;
    const step = now => { const t = Math.min(1, (now - t0) / d); f(ease ? ease(t) : t); t < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  });
}
const ease = {
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  back: t => { const c = 1.7, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
};

/* a <g> holding the whole mark (or parts), placed in stage pixels */
function markGroup(parent, o) {
  const g = el("svg:g", { class: "mk" }, parent);
  const inner = el("svg:g", { transform: `translate(${-MARK.vb[0]} ${-MARK.vb[1]})` }, g);
  const parts = {};
  (o.pieces || Object.keys(MARK.pieces)).forEach(k => {
    parts[k] = el("svg:path", { d: MARK.pieces[k], "fill-rule": "evenodd", fill: o.fill }, inner);
  });
  const dots = (o.dots === false ? [] : MARK.dots).map(([x, y], i) => {
    const d = el("svg:rect", { x, y, width: MARK.dot, height: MARK.dot, fill: o.dotFill || o.fill, class: "mk-dot" }, inner);
    d.style.transformBox = "fill-box"; d.style.transformOrigin = "center";
    return d;
  });
  g.inner = inner; g.parts = parts; g.dots = dots;
  return g;
}
function place(g, x, y, w) {
  g.style.transformOrigin = "0 0"; g.style.transformBox = "view-box";
  g.style.transform = `translate(${x}px, ${y}px) scale(${mScale(w)})`;
}
function placeTf(x, y, w) { return `translate(${x}px, ${y}px) scale(${mScale(w)})`; }
const CENTER = (w => ({ x: (390 - w) / 2, y: 422 - MARK.vb[3] * mScale(w) / 2 - 40, w }));

/* the stage */
const stage = el("div", { id: "stage" }, document.body);
function fit() {
  const s = Math.min(innerWidth / 390, innerHeight / 844);
  stage.style.transform = `translate(${(innerWidth - 390 * s) / 2}px, ${(innerHeight - 844 * s) / 2}px) scale(${s})`;
}
addEventListener("resize", fit); fit();

/* the welcome screen under everything: its text and button, its coins, the title drawn by us */
function welcomeLayer(parent) {
  const w = el("div", { class: "wl" }, parent);
  el("img", { class: "wl-base", src: "welcome-base.png", alt: "" }, w);
  const svg = el("svg:svg", { class: "full", viewBox: "0 0 390 844" }, w);
  const hero = el("img", { class: "wl-hero", src: "welcome-hero.png", alt: "" }, w);
  hero.style.cssText = `left:${HERO.x - 20}px;top:${HERO.y - 20}px;width:${HERO.w + 40}px;opacity:0`;
  w.svg = svg; w.hero = hero;
  return w;
}
function heroPop(hero, delay) {
  hero.style.transformOrigin = "50% 60%";
  return anim(hero, [
    { opacity: 0, transform: "translateY(18px) scale(.6)" },
    { opacity: 1, transform: "translateY(-6px) scale(1.06)", offset: .6 },
    { opacity: 1, transform: "none" }
  ], { duration: 520, delay: delay || 0, easing: "cubic-bezier(.3,1.2,.5,1)" });
}

let RUN = 0;
function start(run) {
  const id = ++RUN;
  stage.innerHTML = "";
  stage.getAnimations({ subtree: true }).forEach(a => a.cancel());
  const ready = new Promise(r => setTimeout(r, ST.load));
  run({ stage, ready, alive: () => id === RUN });
}
addEventListener("message", e => {
  const d = e.data || {};
  if (!d.replay) return;
  if (d.load != null) ST.load = +d.load;
  if (d.slow != null) ST.K = +d.slow;
  start(window.IDEA);
});
document.addEventListener("click", () => { if (window.top === window) start(window.IDEA); });
addEventListener("load", () => start(window.IDEA));
