/* قدراتي — the service worker.

   Why one exists at all: a student revising on the bus loses the network in a
   tunnel, and this app has no server to lose. Everything it needs is a static
   file and their progress is already in localStorage, so the only thing between
   them and a lesson is the browser having the files. This keeps them.

   Three rules, each following from what the file is:

   - The shell — the page, the stylesheet, the app, the four question banks, the
     teaching cards, the interface's glyphs — is precached on install and served
     from that cache. It is pinned to this deploy: the cache is named after
     VERSION, so a new deploy builds a new cache and deletes the old one.
   - A navigation goes to the network first and falls back to the cache, so a
     student who is online always lands on the deploy that is live, and a
     student who is offline still lands on the app.
   - Everything else — the mascot, the streak animations, the sound, the fonts —
     goes to the network first too, and falls back to whatever was kept the last
     time it worked. None of it is needed to answer a question, so precaching
     megabytes of it would make a first visit slower for nothing.

   BUMP VERSION WHENEVER A SHELL FILE CHANGES — including the data files, which
   carry no ?v= of their own. A student with an active worker reads the shell
   from the cache, so a new question bank reaches them when the cache name
   changes and not before. Keep the two ?v= numbers identical to index.html's.

   The dev harnesses are never served from a cache, neither the page nor
   anything it loads: they exist to show the file on disk right now. */

const VERSION = "82";
const SHELL = "qudrati-shell-" + VERSION;
const RUNTIME = "qudrati-runtime-" + VERSION;

const CORE = [
  "./",
  "index.html",
  "css/style.css?v=" + VERSION,
  "js/app.js?v=" + VERSION,
  "assets/vendor/gsap.min.js?v=40",
  "js/data/skills.js",
  "js/data/numbers.js",
  "js/data/ratios.js",
  "js/data/geometry.js",
  "js/data/teach.js",
  "js/data/teach-figures.js",
  "js/data/learn.js",
  "manifest.webmanifest",
  "favicon.ico",
  /* the interface's own glyphs: without these a lesson still works but reads as
     a page of missing images */
  "assets/icons/book.svg",
  "assets/icons/book-locked.svg",
  "assets/icons/check.svg",
  "assets/icons/dumbbell.svg",
  "assets/icons/dumbbell-locked.svg",
  "assets/icons/gem.svg",
  "assets/icons/guide.svg",
  "assets/icons/headphones.svg",
  "assets/icons/headphones-locked.svg",
  "assets/icons/heart.svg",
  "assets/icons/lightning.svg",
  "assets/icons/mic.svg",
  "assets/icons/mic-locked.svg",
  "assets/icons/nav-chest.svg",
  "assets/icons/nav-exam-64.png",
  "assets/icons/nav-home.svg",
  "assets/icons/nav-league.svg",
  "assets/icons/nav-more.svg",
  "assets/icons/nav-stats.svg",
  "assets/icons/nav-trophy.svg",
  "assets/icons/nav-weights.svg",
  "assets/icons/star.svg",
  "assets/icons/star-done.svg",
  "assets/icons/star-gold.svg",
  "assets/icons/star-locked.svg",
  "assets/icons/streak.svg",
  "assets/icons/target.svg",
  "assets/icons/timer.svg",
  "assets/icons/video.svg",
  "assets/icons/video-locked.svg"
];

/* the font stylesheet and the faces it pulls: opaque cross-origin responses,
   kept once used so the Arabic stays in Baloo offline instead of falling back
   to a system face mid-session */
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

const DEV_PAGE = /\/(preview|mobile|chest-animation|chest-animation-tiers|chest-animation-clashroyale|mascot-lab|mascot-edits|mascot-prompts|exam-date-picker|quiz-two-bolts)\.html$/;

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    /* one miss must not fail the whole install, or a single renamed icon leaves
       the student with no offline app at all */
    await Promise.all(CORE.map(u => c.add(new Request(u, { cache: "reload" })).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keep = [SHELL, RUNTIME];
    await Promise.all((await caches.keys()).map(k => keep.includes(k) ? null : caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = FONT_HOSTS.includes(url.hostname);
  if (!sameOrigin && !isFont) return;
  if (sameOrigin && DEV_PAGE.test(url.pathname)) return;
  if (url.search.includes("dev=1")) return;

  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(SHELL);
        c.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        return (await caches.match(req)) || (await caches.match("index.html")) ||
               (await caches.match("./")) || Response.error();
      }
    })());
    return;
  }

  /* a harness loads the working copy of the very files the shell has pinned, so
     nothing it asks for may come from a cache — and neither may anything loaded
     by a page opened with ?dev=1, which is the same request with the app's own
     URL on it */
  if (DEV_PAGE.test(req.referrer || "") || /[?&]dev=1(&|$)/.test(req.referrer || "")) return;

  e.respondWith((async () => {
    const shell = await caches.open(SHELL);
    const pinned = await shell.match(req);
    if (pinned) return pinned;

    const runtime = await caches.open(RUNTIME);
    if (isFont) {
      const kept = await runtime.match(req);
      if (kept) return kept;
    }
    try {
      const fresh = await fetch(req);
      if (fresh && (fresh.ok || fresh.type === "opaque")) runtime.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      return (await runtime.match(req)) || Response.error();
    }
  })());
});
