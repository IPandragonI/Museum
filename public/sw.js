/* MUSEUM service worker — offline-first for a fully static, client-side game.
 *
 *  - install:   pre-cache every route's HTML plus the JS/CSS/font files it references,
 *               so the whole app (not just visited pages) works offline.
 *  - /art/*:    cache-first in a dedicated cache (images are immutable; Settings can
 *               pre-download the offline package). Offline, a missing size is replaced by the nearest
 *               cached size of the same artwork (e.g. 960 for a 1280 request).
 *  - other:     network-first with cache fallback; navigations fall back to /offline.html.
 *  Game progress lives in IndexedDB, so it is untouched by any of this.
 */
const VERSION = "v2";
const SHELL = "museum-shell-" + VERSION;
const ART = "museum-art-v2";
const ROUTES = ["/", "/daily/", "/collection/", "/stats/", "/settings/", "/play/guess/", "/play/detail/", "/play/artist/", "/play/timeline/"];
const EXTRA = ["/offline.html", "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      await cache.addAll(EXTRA).catch(() => undefined);
      const assets = new Set();
      await Promise.all(
        ROUTES.map(async (route) => {
          try {
            const res = await fetch(route, { cache: "reload" });
            if (!res.ok) return;
            await cache.put(route, res.clone());
            const html = await res.text();
            for (const m of html.matchAll(/\/_next\/static\/[^"'\\\s)]+/g)) assets.add(m[0]);
          } catch {
            /* offline during install: runtime caching will fill in */
          }
        }),
      );
      await Promise.all([...assets].map((a) => cache.add(a).catch(() => undefined)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      // drop old shell caches and the superseded v1 artwork cache (different file layout)
      await Promise.all(keys.filter((k) => (k.startsWith("museum-shell-") && k !== SHELL) || k === "museum-art-v1").map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/art/")) {
    event.respondWith(artImage(req, url));
    return;
  }
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(req, SHELL));
    return;
  }
  event.respondWith(networkFirst(req));
});

// /art/<id>/<size>.webp  →  try the exact file, then the network, then any cached size of that artwork.
async function artImage(req, url) {
  const cache = await caches.open(ART);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const dir = url.pathname.slice(0, url.pathname.lastIndexOf("/") + 1);
    const sameDetail = url.pathname.endsWith("/detail.webp");
    const keys = await cache.keys();
    const near = keys
      .map((k) => new URL(k.url).pathname)
      .filter((p) => p.startsWith(dir) && (sameDetail ? p.endsWith("/detail.webp") : !p.endsWith("/detail.webp")))
      .sort((a, b) => Math.abs(size(a) - size(url.pathname)) - Math.abs(size(b) - size(url.pathname)));
    if (near.length) return cache.match(near[0]);
    return new Response("", { status: 504, statusText: "Offline" });
  }
}
function size(path) {
  const m = /\/(\d+)\.webp$/.exec(path);
  return m ? Number(m[1]) : 0;
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

async function networkFirst(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
    if (hit) return hit;
    if (req.mode === "navigate") {
      const path = new URL(req.url).pathname;
      return (await cache.match(path)) || (await cache.match("/")) || (await cache.match("/offline.html")) || Response.error();
    }
    return new Response("", { status: 504, statusText: "Offline" });
  }
}
