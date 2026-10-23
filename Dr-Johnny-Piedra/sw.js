/**
 * Service worker del sitio del Dr. Johnny Piedra.
 *
 * Red primero: con conexión se sirve siempre lo último publicado y la copia
 * se guarda; sin conexión se responde desde la caché. Su ámbito es solo
 * /Dr-Johnny-Piedra/, así que no toca nada del resto de elysiumdr.eu.
 *
 * Al cambiar la lista de recursos, sube VERSION: la caché anterior se borra.
 */
const VERSION = '2026-10-23';
const CACHE = `dr-piedra-${VERSION}`;

// Sin `index.html`: en producción redirige a `./`, y una respuesta redirigida
// no puede servirse a una navegación.
const PRECACHE = [
  './',
  'style.css',
  'main.js',
  'favicon.svg',
  'fonts/playfair-display-latin.woff2',
  'fonts/playfair-display-italic-latin.woff2',
  'fonts/inter-latin.woff2',
  'Images/dr-piedra-consultorio.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('dr-piedra-') && key !== CACHE).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
    if (cached) return cached;
    if (request.mode === 'navigate') return cache.match('./');
    throw error;
  }
}
