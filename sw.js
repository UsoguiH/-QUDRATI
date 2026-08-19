/* قدراتي — offline service worker.
   Students revise on buses and in exam halls with no signal, so the whole
   app (shell + 720-question bank + reference) is precached on install.
   Bump CACHE whenever a shipped asset changes; the old cache is dropped
   on activate and the new worker takes over immediately. */
const CACHE = "qudrati-v7";

/* Everything needed to play a lesson end to end with no network. */
const CORE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css?v=7",
  "js/app.js?v=7",
  "js/data/skills.js",
  "js/data/numbers.js",
  "js/data/ratios.js",
  "js/data/geometry.js",
  "js/data/guide.js",
  "assets/sounds/correct.mp3",
  "assets/icons/app/icon-192.png",
  "assets/icons/app/icon-512.png",
  "assets/icons/app/apple-touch-icon.png",
  "assets/icons/book.svg",
  "assets/icons/dumbbell.svg",
  "assets/icons/gem.svg",
  "assets/icons/guide.svg",
  "assets/icons/heart.svg",
  "assets/icons/lightning.svg",
  "assets/icons/nav-chest.svg",
  "assets/icons/nav-exam-64.png",
  "assets/icons/nav-home.svg",
  "assets/icons/nav-league.svg",
  "assets/icons/nav-more.svg",
  "assets/icons/nav-stats.svg",
  "assets/icons/nav-trophy.svg",
  "assets/icons/star.svg",
  "assets/icons/star-done.svg",
  "assets/icons/star-gold.svg",
  "assets/icons/streak.svg",
  "assets/icons/target.svg",
  "assets/icons/timer.svg",
  "assets/icons/ranks/rank-bronze.png",
  "assets/icons/ranks/rank-silver.png",
  "assets/icons/ranks/rank-gold.png",
  "assets/icons/ranks/rank-diamond.png",
  "assets/icons/ranks/rank-champion.png",
  "assets/icons/ranks/medal-1.svg",
  "assets/icons/ranks/medal-2.svg",
  "assets/icons/ranks/medal-3.svg",
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // one bad URL must not fail the whole install, so each is added on its own
    await Promise.all(CORE.map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

const isFont = u => u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  /* Navigations: try the network so a deploy is picked up, fall back to the
     cached shell when there is no signal. */
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(CACHE);
        c.put("index.html", fresh.clone());
        return fresh;
      } catch {
        return (await caches.match("index.html")) || (await caches.match("./")) || Response.error();
      }
    })());
    return;
  }

  /* Google Fonts: serve what we have, refresh in the background. */
  if (isFont(url)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => null);
      return hit || (await net) || Response.error();
    })());
    return;
  }

  if (url.origin !== location.origin) return;

  /* App assets: cache first — they only change when CACHE is bumped. */
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: false }) || await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const fresh = await fetch(req);
      if (fresh.ok) c.put(req, fresh.clone());
      return fresh;
    } catch {
      return Response.error();
    }
  })());
});
