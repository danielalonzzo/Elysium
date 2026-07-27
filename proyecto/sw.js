/** Web App Downloader — sw.js canónico (stale-while-revalidate) */
const CACHE = 'app-cache-v1';
const PRECACHE = [
    '/', 
    '/index.html', 
    '/styles/tokens.css', 
    '/styles/components.css', 
    '/styles/layout.css', 
    '/src/core/main.js'
];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE))));
self.addEventListener('activate', e => e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
));

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
        caches.match(e.request).then(cached => {
            const fresh = fetch(e.request).then(res => {
                if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
                return res;
            }).catch(() => cached);
            return cached || fresh; // caché al instante, red en segundo plano
        })
    );
});
