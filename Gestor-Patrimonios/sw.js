/**
 * Service worker de Elysium Patrimonio (scope /Gestor-Patrimonios/).
 *
 * - El armazón (HTML, CSS, módulos, iconos) se precarga: la app abre sin red.
 * - Las páginas van primero a la red y, si no hay, caen al armazón guardado.
 * - Los módulos de Firebase (gstatic, URL con versión) se guardan al primer uso.
 * - Lo demás propio va con stale-while-revalidate: rápido y al día.
 * - Nunca se cachean los datos: Firestore, Storage, /api ni el tipo de cambio.
 *   Los datos sin conexión los resuelve la caché persistente de Firestore.
 *
 * Se precarga `/Gestor-Patrimonios/` y no `index.html`: en producción
 * `index.html` responde 307 (html_handling de Cloudflare), el error latente
 * del service worker de ONCORE.
 *
 * Al cambiar cualquier archivo del armazón, sube VERSION: la app ofrecerá
 * «Actualizar» y el SKIP_WAITING activa la nueva versión.
 */

const VERSION = 'patrimonio-v3';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const BASE = '/Gestor-Patrimonios/';

const PRECACHE = [
    '/Gestor-Patrimonios/',
    '/Gestor-Patrimonios/manifest.json',
    '/Gestor-Patrimonios/css/tokens.css',
    '/Gestor-Patrimonios/css/base.css',
    '/Gestor-Patrimonios/css/components.css',
    '/Gestor-Patrimonios/css/views.css',
    '/Gestor-Patrimonios/icons/apple-touch-icon.png',
    '/Gestor-Patrimonios/icons/favicon-32.png',
    '/Gestor-Patrimonios/icons/favicon.svg',
    '/Gestor-Patrimonios/icons/icon-192.png',
    '/Gestor-Patrimonios/icons/icon-512.png',
    '/Gestor-Patrimonios/icons/icon-maskable-192.png',
    '/Gestor-Patrimonios/icons/icon-maskable-512.png',
    '/Gestor-Patrimonios/js/app.js',
    '/Gestor-Patrimonios/js/boot.js',
    '/Gestor-Patrimonios/js/context.js',
    '/Gestor-Patrimonios/js/demo-data.js',
    '/Gestor-Patrimonios/js/firebase.js',
    '/Gestor-Patrimonios/js/model.js',
    '/Gestor-Patrimonios/js/nav.js',
    '/Gestor-Patrimonios/js/router.js',
    '/Gestor-Patrimonios/js/services.js',
    '/Gestor-Patrimonios/js/store.js',
    '/Gestor-Patrimonios/js/core/alerts.js',
    '/Gestor-Patrimonios/js/core/budgets.js',
    '/Gestor-Patrimonios/js/core/categories.js',
    '/Gestor-Patrimonios/js/core/csv.js',
    '/Gestor-Patrimonios/js/core/dates.js',
    '/Gestor-Patrimonios/js/core/factura-cr.js',
    '/Gestor-Patrimonios/js/core/gamification.js',
    '/Gestor-Patrimonios/js/core/goals.js',
    '/Gestor-Patrimonios/js/core/loans.js',
    '/Gestor-Patrimonios/js/core/money.js',
    '/Gestor-Patrimonios/js/core/recurring.js',
    '/Gestor-Patrimonios/js/core/stats.js',
    '/Gestor-Patrimonios/js/sheets/form-sheet.js',
    '/Gestor-Patrimonios/js/sheets/forms.js',
    '/Gestor-Patrimonios/js/sheets/quick.js',
    '/Gestor-Patrimonios/js/sheets/transaction.js',
    '/Gestor-Patrimonios/js/ui/charts.js',
    '/Gestor-Patrimonios/js/ui/dom.js',
    '/Gestor-Patrimonios/js/ui/format.js',
    '/Gestor-Patrimonios/js/ui/guilloche.js',
    '/Gestor-Patrimonios/js/ui/icons.js',
    '/Gestor-Patrimonios/js/ui/lock.js',
    '/Gestor-Patrimonios/js/ui/overlay.js',
    '/Gestor-Patrimonios/js/ui/parts.js',
    '/Gestor-Patrimonios/js/ui/sounds.js',
    '/Gestor-Patrimonios/js/ui/theme.js',
    '/Gestor-Patrimonios/js/views/acceso.js',
    '/Gestor-Patrimonios/js/views/ajustes.js',
    '/Gestor-Patrimonios/js/views/calendario.js',
    '/Gestor-Patrimonios/js/views/comprobantes.js',
    '/Gestor-Patrimonios/js/views/cuentas.js',
    '/Gestor-Patrimonios/js/views/deudas.js',
    '/Gestor-Patrimonios/js/views/inicio.js',
    '/Gestor-Patrimonios/js/views/logros.js',
    '/Gestor-Patrimonios/js/views/metas.js',
    '/Gestor-Patrimonios/js/views/movimientos.js',
    '/Gestor-Patrimonios/js/views/onboarding.js',
    '/Gestor-Patrimonios/js/views/presupuestos.js',
    '/Gestor-Patrimonios/js/views/reportes.js',
    '/Gestor-Patrimonios/js/views/simulador.js'
];

/** Módulos de Firebase: la URL lleva la versión, así que nunca cambian. */
const FIREBASE_SDK = /^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\//;

self.addEventListener('install', event => {
    // Un archivo caído no debe impedir instalar el resto.
    event.waitUntil(
        caches.open(SHELL).then(cache => Promise.allSettled(PRECACHE.map(url => cache.add(new Request(url, { cache: 'reload' })))))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(key => key.startsWith('patrimonio-') && !key.startsWith(VERSION))
                .map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);

    if (FIREBASE_SDK.test(request.url)) {
        event.respondWith(cacheFirst(request));
        return;
    }
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/')) return;
    if (request.headers.has('range')) return;

    if (request.mode === 'navigate' && url.pathname.startsWith(BASE)) {
        event.respondWith(networkFirstPage(request));
        return;
    }
    if (url.pathname.startsWith(BASE) || url.pathname.startsWith('/sounds/')) {
        event.respondWith(staleWhileRevalidate(request, event));
    }
});

async function networkFirstPage(request) {
    const cache = await caches.open(SHELL);
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(timer);
        if (response.ok && response.type === 'basic') cache.put(BASE, response.clone());
        return response;
    } catch {
        return (await cache.match(BASE)) || (await cache.match(request)) || Response.error();
    }
}

async function staleWhileRevalidate(request, event) {
    const cache = await caches.open(SHELL);
    const cached = await cache.match(request, { ignoreSearch: true });
    const network = fetch(request)
        .then(response => {
            if (response.ok && response.type === 'basic') cache.put(request, response.clone());
            return response;
        })
        .catch(() => null);
    if (cached) {
        event.waitUntil(network);
        return cached;
    }
    return (await network) || Response.error();
}

async function cacheFirst(request) {
    const cache = await caches.open(RUNTIME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
}
