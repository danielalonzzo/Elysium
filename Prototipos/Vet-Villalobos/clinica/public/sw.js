// v2 desde el rediseño: las páginas cacheadas con la versión anterior pedían
// componentes que ya no existen. Las páginas van a la red primero y la caché
// solo responde sin conexión; el resto de recursos, caché y revalidación.
const CACHE="villalobos-v2";const CORE=["/","/servicios","/sedes","/diagnostico","/orientador","/contacto","/images/logo.jpg","/favicon.svg"];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));});
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET"||new URL(event.request.url).pathname.startsWith("/api/"))return;const save=response=>{if(response.ok&&response.type==="basic"){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;};if(event.request.mode==="navigate"){event.respondWith(fetch(event.request).then(save).catch(()=>caches.match(event.request)));return;}event.respondWith(caches.match(event.request).then(cached=>{const fresh=fetch(event.request).then(save).catch(()=>cached);return cached||fresh;}));});
