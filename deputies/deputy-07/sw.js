const CACHE_NAME = "deputy-07-missions-v3";
const FILES = [
  "./pages/mission-bank.html",
  "./pages/mission-create.html",
  "./pages/mission-reports.html",
  "./pages/mission-sync.html",
  "./assets/css/style.css",
  "./assets/js/main.js",
  "./assets/js/page-registry-core.js",
  "./assets/js/organization-modules.js",
  "./assets/js/mobile-nav.js",
  "./assets/js/mission-store.js",
  "./assets/js/mission-store-bridge.js",
  "./assets/js/mission-sync.js",
  "./local-data/assets/engine.js",
  "./assets/fonts/Vazirmatn-Regular.woff2",
  "./assets/fonts/Vazirmatn-Bold.woff2",
  "./assets/images/iran-flag.svg"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("deputy-07-missions-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(async () => (await caches.match(event.request)) || (event.request.mode === "navigate" ? caches.match("./pages/mission-bank.html") : Response.error())));
});
