"use strict";
const CACHE_NAME="deputy-07-missions-v67";
const CORE_FILES=[
 "./pages/mission-bank.html",
 "./pages/mission-create.html",
 "./pages/mission-reports.html",
 "./pages/mission-sync.html",
 "./assets/css/style.css",
 "./assets/js/main.js",
 "./assets/js/access-control.js",
 "./assets/js/organization-modules.js",
 "./assets/js/mobile-nav.js",
 "./assets/js/mission-store.js",
 "./assets/js/mission-samples.js",
 "./assets/js/mission-create.js",
 "./assets/js/mission-bank.js",
 "./assets/js/mission-reports.js",
 "./local-data/assets/engine.js",
 "./assets/css/mission-visual.css",
 "./assets/js/jalali-picker.js",
 "./assets/js/mission-calendar.js",
 "./assets/images/iran-flag.svg"
];
const STATIC_RE=/\.(?:css|js|mjs|woff2?|ttf|svg|png|jpe?g|webp|ico)$/i;
self.addEventListener("install",event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  await Promise.allSettled(CORE_FILES.map(path=>cache.add(path)));
  await self.skipWaiting();
 })());
});
self.addEventListener("activate",event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith("deputy-07-missions-")&&key!==CACHE_NAME).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET")return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 if(STATIC_RE.test(url.pathname)){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE_NAME);
   const cached=await cache.match(request,{ignoreSearch:true});
   if(cached)return cached;
   try{
    const response=await fetch(request);
    if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});
    return response;
   }catch(error){return Response.error();}
  })());
  return;
 }
 if(request.mode==="navigate"){
  event.respondWith((async()=>{
   try{
    const response=await fetch(request);
    if(response&&response.ok){const cache=await caches.open(CACHE_NAME);cache.put(request,response.clone()).catch(()=>{});}
    return response;
   }catch(error){
    return (await caches.match(request,{ignoreSearch:true}))||
      (await caches.match("./pages/mission-bank.html"))||Response.error();
   }
  })());
 }
});