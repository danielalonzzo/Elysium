/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  F17 · WEB APP DOWNLOADER — Service Worker de ONCORE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Estrategia stale-while-revalidate: sirve la caché de inmediato y actualiza
 *  en segundo plano, de modo que el sitio arranca al instante y tolera cortes
 *  de red sin quedarse congelado en una versión antigua.
 *
 *  Este archivo se sirve con `Cache-Control: no-store` (regla del Security
 *  Core, F07) para que cada despliegue llegue siempre al dispositivo.
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Nombre de la caché. Cambiarlo invalida por completo la anterior. */
const CACHE = 'oncore-cache-v19';

/**
 * Recursos del arranque en ambos idiomas. Solo lo imprescindible para pintar:
 * las fuentes y las fotografías entran en caché al usarse, no en la instalación.
 */
const PRECACHE = [
    '/ONCORE/',
    '/ONCORE/index.html',
    '/ONCORE/en/',
    '/ONCORE/en/index.html',
    '/ONCORE/manifest.json',
    '/ONCORE/favicon.svg',
    '/ONCORE/favicon-32.png',
    '/ONCORE/src/styles/tokens.css',
    '/ONCORE/src/styles/typography.css',
    '/ONCORE/src/styles/oncore.css',
    '/ONCORE/src/core/theme.js',
    '/ONCORE/src/core/elysium-config.js',
    '/ONCORE/src/core/app.js',
    '/ONCORE/src/core/i18n.js',
    '/ONCORE/src/core/register-sw.js',
    '/ONCORE/src/vendor/lucide-icons.js',
    '/ONCORE/src/ui/header.js',
    '/ONCORE/src/ui/scroll-reveal.js',
    '/ONCORE/src/ui/anchor-glide.js',
    '/ONCORE/src/ui/magic-bottom.js',
    '/ONCORE/src/ui/loop-video.js',
    '/ONCORE/src/features/testimonials.js',
    '/ONCORE/src/features/faq.js',
    '/ONCORE/src/features/glossary.js',
    '/ONCORE/src/features/contact-form.js',
    '/ONCORE/src/features/multi-currency.js',
    '/ONCORE/elysium-core/elysium-preloader.js',
    '/ONCORE/elysium-core/elysium-system-info.js',
    '/ONCORE/elysium-core/elysium-compliance.js'
];

self.addEventListener('install', event => {
    // Un recurso caído no debe impedir la instalación del resto.
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => Promise.allSettled(PRECACHE.map(url => cache.add(url))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;

    if (request.method !== 'GET') return;

    // Solo se cachea lo propio: nada de terceros ni de otros orígenes.
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // El vídeo del hero se sirve por rangos: el navegador pide trozos con la
    // cabecera `Range` y recibe un 206 Partial Content. Guardar ese trozo en
    // caché y devolverlo después como si fuera el archivo completo deja el
    // vídeo cortado o sin reproducir, así que el medio se deja pasar directo a
    // la red — el hosting ya lo sirve con caché de un año (F07).
    if (request.headers.has('range') || request.destination === 'video' || request.destination === 'audio') {
        return;
    }

    event.respondWith(
        caches.match(request).then(cached => {
            const fresh = fetch(request).then(response => {
                // Solo el 200 completo entra en caché; un 206 nunca.
                if (response && response.status === 200 && response.type === 'basic') {
                    const copy = response.clone();
                    caches.open(CACHE).then(cache => cache.put(request, copy));
                }
                return response;
            }).catch(() => cached);

            return cached || fresh;      // caché al instante, red en segundo plano
        })
    );
});

self.addEventListener('message', event => {
    // F06 System Update pide al Service Worker que ceda el paso de inmediato.
    if (event.data === 'skipWaiting') self.skipWaiting();
});
