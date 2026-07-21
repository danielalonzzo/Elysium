// sw.js
const CACHE_NAME = 'oncore-cache-v14';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/oncore.css',
  '/js/oncore.js',
  '/js/version-modal.js',
  '/css/style.css',
  '/js/script.js',
  '/js/theme.js'
];

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
