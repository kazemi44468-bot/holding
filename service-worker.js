const CACHE='holding-legal-offline-v1';
const CORE=[
 './pages/holding-legal-center.html','./pages/holding-legal-introduction.html','./pages/holding-legal-services.html','./pages/holding-legal-workspace.html','./pages/holding-legal-network.html','./pages/holding-legal-prevention.html','./pages/holding-legal-simulator.html','./pages/holding-legal-performance.html','./pages/holding-legal-platform.html','./pages/holding-legal-case-register.html',
 './assets/css/product-system.css','./assets/css/legal-center.css','./assets/css/persian-date.css',
 './assets/js/legal-center.js','./assets/js/local-data-vault.js','./assets/js/organization-registry.js','./assets/js/persian-date.js','./assets/js/offline-register.js','./favicon.svg'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('holding-legal-offline-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 event.respondWith(fetch(req).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}return response;}).catch(()=>caches.match(req).then(hit=>hit|| (req.mode==='navigate'?caches.match('./pages/holding-legal-center.html'):Response.error()))));
});
