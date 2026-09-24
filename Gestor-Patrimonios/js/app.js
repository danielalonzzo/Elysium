/**
 * Elysium Patrimonio — arranque.
 *
 * Dos caminos:
 * - Demostración (`#/demo`): datos de ejemplo en memoria, sin cuenta ni red.
 * - Real: Firebase Auth → licencia en `patrimonio_access/{uid}` (la activa el
 *   administrador desde el CRM) → datos en `patrimonio/{uid}/…`.
 *
 * Con los datos listos se pinta el armazón (barra lateral, barra superior,
 * pestañas del móvil) y el enrutador decide la vista. Cada cambio del almacén
 * vuelve a pintar la vista actual conservando el desplazamiento y el foco.
 */
import { app } from './context.js';
import { Store, DemoBackend, FirestoreBackend } from './store.js';
import { demoSeed } from './demo-data.js';
import { parseHash, onRouteChange, go } from './router.js';
import { html, raw, $, debounce } from './ui/dom.js';
import { icon } from './ui/icons.js';
import { rosette } from './ui/guilloche.js';
import { disposeCharts } from './ui/charts.js';
import { toast, openSheet, hasOpenSheet } from './ui/overlay.js';
import { setPrivate, isPrivate } from './ui/theme.js';
import { animateBars } from './ui/parts.js';
import { num } from './ui/format.js';
import { NAV, NAV_ITEMS } from './nav.js';
import { newlyUnlocked } from './core/gamification.js';
import { todayISO } from './core/dates.js';
import { autoPostRecurring } from './services.js';
import { invalidateModel } from './model.js';
import { initLock } from './ui/lock.js';

const VIEWS = {
    inicio: () => import('./views/inicio.js'),
    movimientos: () => import('./views/movimientos.js'),
    cuentas: () => import('./views/cuentas.js'),
    presupuestos: () => import('./views/presupuestos.js'),
    calendario: () => import('./views/calendario.js'),
    comprobantes: () => import('./views/comprobantes.js'),
    metas: () => import('./views/metas.js'),
    simulador: () => import('./views/simulador.js'),
    deudas: () => import('./views/deudas.js'),
    reportes: () => import('./views/reportes.js'),
    logros: () => import('./views/logros.js'),
    ajustes: () => import('./views/ajustes.js')
};

const root = document.getElementById('root');
let current = { route: null, view: null, cleanup: null };
let shellMounted = false;
let unsubscribeRoute = null;

/* ── Arranque ─────────────────────────────────────────────────────────────── */

function hideSplash() {
    const splash = document.getElementById('splash');
    if (!splash) return;
    splash.classList.add('is-gone');
    setTimeout(() => splash.remove(), 450);
}

function wantsDemo() {
    const route = parseHash();
    if (route.name === 'demo') {
        try { sessionStorage.setItem('patrimonio-demo', '1'); } catch { /* sin sesión */ }
        history.replaceState(null, '', `${location.pathname}#/inicio`);
        return true;
    }
    if (new URLSearchParams(location.search).has('demo')) return true;
    try { return sessionStorage.getItem('patrimonio-demo') === '1'; } catch { return false; }
}

export function exitDemo() {
    try {
        sessionStorage.removeItem('patrimonio-demo');
        DemoBackend.reset();
    } catch { /* nada */ }
    location.href = `${location.pathname}#/inicio`;
    location.reload();
}

async function start() {
    registerServiceWorker();
    window.addEventListener('online', () => document.documentElement.classList.remove('is-offline'));
    window.addEventListener('offline', () => document.documentElement.classList.add('is-offline'));

    if (wantsDemo()) {
        app.mode = 'demo';
        app.user = { displayName: 'Alex', email: 'demo@elysium.local', uid: 'demo' };
        await openStore(new DemoBackend(demoSeed));
        return;
    }
    app.mode = 'firebase';
    let firebase;
    try {
        firebase = await import('./firebase.js');
        await firebase.loadFirebase();
    } catch (error) {
        console.error(error);
        hideSplash();
        renderFatal('No se pudo conectar', 'La primera vez hace falta internet para entrar. Revise su conexión y vuelva a intentarlo.');
        return;
    }
    const { renderAuth, renderPending } = await import('./views/acceso.js');
    let unwatchAccess = null;
    let unwatchRequest = null;
    firebase.onAuth(async user => {
        unwatchAccess?.();
        unwatchRequest?.();
        app.store?.stop();
        app.user = user;
        if (!user) {
            teardownShell();
            hideSplash();
            renderAuth(root);
            return;
        }
        unwatchAccess = await firebase.watchAccess(user.uid, async access => {
            if (access?.active === true) {
                unwatchRequest?.();
                if (app.store?.backend?.uid === user.uid) return;
                await openStore(new FirestoreBackend(await firebase.loadFirebase(), user.uid));
                return;
            }
            teardownShell();
            app.store?.stop();
            app.store = null;
            hideSplash();
            unwatchRequest?.();
            unwatchRequest = await firebase.watchRequest(user.uid, request => {
                renderPending(root, { user, access, request });
            });
        });
    });
}

async function openStore(backend) {
    const store = new Store(backend);
    app.store = store;
    invalidateModel();
    await store.start();
    hideSplash();
    const needsOnboarding = !store.profile?.onboarded;
    if (needsOnboarding) {
        const { renderOnboarding } = await import('./views/onboarding.js');
        teardownShell();
        renderOnboarding(root, () => { mountShell(); afterReady(); });
        return;
    }
    mountShell();
    afterReady();
}

let lockReady = false;
function startLock() {
    if (lockReady) return;
    lockReady = true;
    initLock();
}

function afterReady() {
    if (app.mode === 'firebase') {
        autoPostRecurring().catch(console.error);
        refreshExchangeRate().catch(() => null);
    }
}

function renderFatal(title, body) {
    root.innerHTML = String(html`<div class="auth-panel" style="min-height:100dvh"><div class="auth-card empty">
        ${rosette({ seed: 'error', size: 140, layers: 3 })}
        <h1>${title}</h1><p>${body}</p>
        <button type="button" class="btn btn-primary" data-retry>${icon('refresh', { size: 17 })}Reintentar</button>
        <button type="button" class="link-btn" data-demo>Ver la demostración</button>
    </div></div>`);
    root.querySelector('[data-retry]')?.addEventListener('click', () => location.reload());
    root.querySelector('[data-demo]')?.addEventListener('click', () => {
        try { sessionStorage.setItem('patrimonio-demo', '1'); } catch { /* sin sesión */ }
        location.reload();
    });
}

/* ── Armazón ──────────────────────────────────────────────────────────────── */

function mountShell() {
    const store = app.store;
    const model = app.model();
    const initials = String(model.profile?.displayName || app.user?.displayName || app.user?.email || 'λ')
        .split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
    document.body.classList.toggle('has-demo', app.mode === 'demo');
    root.innerHTML = String(html`
        ${app.mode === 'demo' ? html`<div class="demo-banner">${icon('sparkle', { size: 15 })}<span class="hide-mobile">Modo demostración: datos de ejemplo de una persona ficticia. Nada se guarda en la nube.</span><span class="only-mobile">Demostración con datos ficticios</span><button type="button" data-exit-demo>Salir</button></div>` : ''}
        <div class="app">
            <aside class="sidebar" aria-label="Navegación principal">
                <a class="brand" href="#/inicio" aria-label="Elysium Patrimonio, inicio">
                    <span class="brand-mark">${rosette({ seed: 'patrimonio-brand', size: 120, layers: 2, strokeWidth: 1 })}<b>λ</b></span>
                    <span class="brand-text"><b>Patrimonio</b><small>Elysium</small></span>
                </a>
                <nav class="nav">
                    ${NAV.map(group => html`<div class="nav-label">${group.group}</div>${group.items.map(item => html`
                        <a class="nav-item" href="#/${item.id}" data-nav="${item.id}" ${item.gamified ? raw('data-gamified') : ''}>${icon(item.icon)}<span>${item.label}</span>${item.badge ? html`<em class="nav-badge" data-badge="${item.badge}"></em>` : ''}</a>`)}`)}
                </nav>
                <div class="sidebar-foot">
                    <a class="level-card" href="#/logros" data-level-card data-gamified></a>
                    <a class="nav-item" href="#/ajustes" data-nav="ajustes">${icon('settings')}<span>Ajustes</span></a>
                    <button type="button" class="user-chip" data-user-menu><span class="avatar">${initials}</span><span>${model.profile?.displayName || app.user?.email || ''}</span></button>
                </div>
            </aside>
            <div class="main">
                <header class="topbar" data-topbar>
                    <button type="button" class="icon-btn is-plain topbar-back" data-back aria-label="Volver" hidden>${icon('chevron-left')}</button>
                    <div class="topbar-titles"><p class="eyebrow" data-eyebrow></p><h1 data-title></h1></div>
                    <div class="topbar-actions">
                        <span class="offline-pill">${icon('cloud-off', { size: 14 })}Sin conexión</span>
                        <span data-view-actions class="row"></span>
                        <button type="button" class="search-trigger" data-open-palette>${icon('search', { size: 17 })}<span>Buscar o ejecutar…</span><kbd>⌘K</kbd></button>
                        <button type="button" class="icon-btn" data-toggle-private aria-label="Modo discreto" title="Modo discreto (D)">${icon(isPrivate() ? 'eye-off' : 'eye')}</button>
                        <button type="button" class="icon-btn" data-open-alerts aria-label="Alertas">${icon('bell')}<span class="dot" data-alert-count></span></button>
                        <button type="button" class="btn btn-primary hide-mobile" data-new-tx>${icon('plus', { size: 18 })}Nuevo</button>
                    </div>
                </header>
                <main class="view" id="view" tabindex="-1"></main>
            </div>
            <nav class="tabbar" aria-label="Navegación">
                <a class="tab" href="#/inicio" data-tab="inicio">${icon('home', { size: 22 })}Inicio</a>
                <a class="tab" href="#/movimientos" data-tab="movimientos">${icon('list', { size: 22 })}Movimientos</a>
                <button type="button" class="tab-add" data-new-tx aria-label="Nuevo movimiento">${icon('plus', { size: 26, stroke: 2.2 })}</button>
                <a class="tab" href="#/metas" data-tab="metas">${icon('target', { size: 22 })}Metas</a>
                <button type="button" class="tab" data-open-more>${icon('grid', { size: 22 })}Más</button>
            </nav>
        </div>`);
    shellMounted = true;
    startLock();
    bindShell();
    store.addEventListener('change', onStoreChange);
    unsubscribeRoute?.();
    unsubscribeRoute = onRouteChange(route => renderRoute(route));
    renderRoute(parseHash());
    updateChrome();
}

function teardownShell() {
    if (!shellMounted) return;
    app.store?.removeEventListener('change', onStoreChange);
    unsubscribeRoute?.();
    unsubscribeRoute = null;
    current.cleanup?.();
    disposeCharts();
    current = { route: null, view: null, cleanup: null };
    shellMounted = false;
    root.innerHTML = '';
}

function bindShell() {
    root.addEventListener('click', async event => {
        const target = event.target.closest('[data-new-tx],[data-open-alerts],[data-open-palette],[data-toggle-private],[data-open-more],[data-exit-demo],[data-back],[data-user-menu]');
        if (!target) return;
        if (target.matches('[data-new-tx]')) (await import('./sheets/transaction.js')).openTransactionSheet();
        else if (target.matches('[data-open-alerts]')) (await import('./sheets/quick.js')).openAlertsSheet();
        else if (target.matches('[data-open-palette]')) (await import('./sheets/quick.js')).openPalette();
        else if (target.matches('[data-open-more]')) (await import('./sheets/quick.js')).openMoreSheet();
        else if (target.matches('[data-toggle-private]')) togglePrivate();
        else if (target.matches('[data-exit-demo]')) exitDemo();
        else if (target.matches('[data-back]')) history.length > 1 ? history.back() : go('#/inicio');
        else if (target.matches('[data-user-menu]')) openUserMenu();
    });
    const topbar = root.querySelector('[data-topbar]');
    const onScroll = () => topbar?.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

async function openUserMenu() {
    const { actionSheet } = await import('./ui/overlay.js');
    const items = [
        { label: 'Ajustes', icon: 'settings', onClick: () => go('#/ajustes') },
        { label: 'Atajos de teclado', icon: 'keyboard', onClick: showShortcuts }
    ];
    if (app.mode === 'demo') items.push({ label: 'Salir de la demostración', icon: 'log-out', onClick: exitDemo });
    else items.push({ label: 'Cerrar sesión', icon: 'log-out', danger: true, onClick: async () => (await import('./firebase.js')).signOutUser() });
    actionSheet({ title: app.store.profile?.displayName || app.user?.email || 'Su cuenta', subtitle: app.user?.email, actions: items });
}

function togglePrivate() {
    setPrivate(!isPrivate());
    const button = root.querySelector('[data-toggle-private]');
    if (button) button.innerHTML = String(icon(isPrivate() ? 'eye-off' : 'eye'));
    toast(isPrivate() ? 'Modo discreto: montos ocultos' : 'Montos visibles', { iconName: isPrivate() ? 'eye-off' : 'eye' });
}
document.addEventListener('patrimonio:toggle-private', togglePrivate);

/* ── Vistas ───────────────────────────────────────────────────────────────── */

async function renderRoute(route) {
    if (!shellMounted) return;
    // Rutas de acción: abren una hoja sobre la vista anterior.
    if (route.name === 'nuevo') {
        go(current.route ? `#/${current.route.raw}` : '#/inicio', { replace: true });
        const { openTransactionSheet } = await import('./sheets/transaction.js');
        const type = { gasto: 'expense', ingreso: 'income', transferencia: 'transfer' }[route.query.tipo] || 'expense';
        setTimeout(() => openTransactionSheet({ type }), 60);
        return;
    }
    if (route.name === 'alcanza') {
        go(current.route ? `#/${current.route.raw}` : '#/inicio', { replace: true });
        const { openAffordSheet } = await import('./sheets/quick.js');
        setTimeout(() => openAffordSheet(), 60);
        return;
    }
    if (route.name === 'demo') { location.reload(); return; }

    const loader = VIEWS[route.name] || VIEWS.inicio;
    let module;
    try {
        module = (await loader()).default;
    } catch (error) {
        console.error(error);
        toast('No se pudo abrir esa sección. Revise su conexión.', { tone: 'error' });
        return;
    }
    const sameScreen = current.view === module && current.route?.name === route.name && current.route?.id === route.id;
    current.cleanup?.();
    current = { route, view: module, cleanup: null };
    paint({ resetScroll: !sameScreen });
    highlightNav(route.name);
}

function paint({ resetScroll = false } = {}) {
    const container = document.getElementById('view');
    if (!container || !current.view) return;
    const model = app.model();
    const { view, route } = current;
    const scroll = window.scrollY;
    const focusedId = document.activeElement?.id || document.activeElement?.dataset?.focusKey;
    const selection = document.activeElement?.selectionStart;

    current.cleanup?.();
    disposeCharts();
    try {
        container.innerHTML = String(view.render(model, route));
    } catch (error) {
        console.error(error);
        container.innerHTML = String(html`<div class="card empty"><h3>Algo salió mal al pintar esta vista</h3><p>${error.message}</p></div>`);
        return;
    }
    const title = typeof view.title === 'function' ? view.title(model, route) : view.title;
    const eyebrow = typeof view.eyebrow === 'function' ? view.eyebrow(model, route) : view.eyebrow || '';
    root.querySelector('[data-title]').textContent = title || '';
    root.querySelector('[data-eyebrow]').textContent = eyebrow || '';
    document.title = `${title ? title + ' · ' : ''}Elysium Patrimonio`;
    const back = root.querySelector('[data-back]');
    if (back) back.hidden = !(view.back && view.back(model, route));
    const actions = root.querySelector('[data-view-actions]');
    if (actions) actions.innerHTML = view.actions ? String(view.actions(model, route)) : '';

    try {
        current.cleanup = view.mount?.(container, model, route) || null;
    } catch (error) {
        console.error(error);
    }
    animateBars(container);
    if (resetScroll) {
        window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
        window.scrollTo({ top: scroll, behavior: 'instant' });
        if (focusedId) {
            const element = document.getElementById(focusedId) || container.querySelector(`[data-focus-key="${focusedId}"]`);
            if (element) {
                element.focus({ preventScroll: true });
                if (selection != null && element.setSelectionRange) try { element.setSelectionRange(selection, selection); } catch { /* no aplica */ }
            }
        }
    }
}

function highlightNav(name) {
    root.querySelectorAll('[data-nav]').forEach(link => {
        const active = link.dataset.nav === name;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    root.querySelectorAll('[data-tab]').forEach(tab => tab.classList.toggle('is-active', tab.dataset.tab === name));
}

const onStoreChange = debounce(() => {
    if (!shellMounted) return;
    if (current.view && current.view.live !== false) paint();
    updateChrome();
}, 40);

/** Contadores, nivel, insignia en el icono y celebraciones. */
function updateChrome() {
    const model = app.model();
    const alertCount = model.alerts.filter(alert => alert.severity !== 'success').length;
    const counter = root.querySelector('[data-alert-count]');
    if (counter) counter.textContent = alertCount ? String(alertCount) : '';
    const budgetBadge = root.querySelector('[data-badge="budgets"]');
    if (budgetBadge) {
        const over = model.budgets.filter(b => b.status.state === 'over' || b.status.state === 'warning').length;
        budgetBadge.textContent = over ? String(over) : '';
    }
    const dueBadge = root.querySelector('[data-badge="due"]');
    if (dueBadge) {
        const due = model.upcoming.filter(item => item.daysUntil <= 3 && item.rule.type === 'expense').length + model.overdueRecurring.length;
        dueBadge.textContent = due ? String(due) : '';
    }
    const gamified = model.settings.gamification !== false;
    root.querySelectorAll('[data-gamified]').forEach(element => { element.hidden = !gamified; });
    const levelCard = root.querySelector('[data-level-card]');
    if (levelCard && gamified) {
        const level = model.game.level;
        levelCard.innerHTML = String(html`<span class="level-coin">${level.name.charAt(0)}</span>
            <span class="level-info"><b>${level.name}</b><small>${num(model.game.points)} pts${level.next ? ` · faltan ${num(level.toNext)}` : ''}</small>
            <span class="level-bar"><span style="width:${Math.min(100, level.progress).toFixed(1)}%"></span></span></span>`);
    }
    try { alertCount ? navigator.setAppBadge?.(alertCount) : navigator.clearAppBadge?.(); } catch { /* sin soporte */ }
    celebrateBadges(model);
}

let celebrating = false;
async function celebrateBadges(model) {
    if (celebrating || !app.store?.profile || model.settings.gamification === false) return;
    const celebrated = app.store.profile.celebrated || {};
    const fresh = newlyUnlocked(model.game.badges, celebrated);
    if (!fresh.length) return;
    celebrating = true;
    const next = { ...celebrated };
    for (const badge of fresh) next[badge.id] = model.today;
    // La primera vez (o tras importar historial) se desbloquean muchas de golpe:
    // se registran en silencio en vez de lanzar una lluvia de avisos.
    const firstRun = Object.keys(celebrated).length === 0 && fresh.length > 2;
    try {
        await app.store.saveProfile({ celebrated: next });
        if (!firstRun) {
            for (const badge of fresh.slice(0, 2)) {
                toast(`Insignia desbloqueada: ${badge.name}`, { tone: 'gold', iconName: 'medal', action: { label: 'Ver', onClick: () => go('#/logros') } });
            }
            celebrate();
        }
    } finally {
        celebrating = false;
    }
}

/** Brillo dorado breve para momentos importantes (meta cumplida, deuda saldada). */
export function celebrate() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const layer = document.createElement('div');
    layer.className = 'celebrate';
    layer.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 28; i += 1) {
        const piece = document.createElement('i');
        piece.style.setProperty('--x', `${Math.round(Math.random() * 100)}vw`);
        piece.style.setProperty('--d', `${(Math.random() * 0.6).toFixed(2)}s`);
        piece.style.setProperty('--r', `${Math.round(Math.random() * 360)}deg`);
        piece.style.setProperty('--s', `${(0.6 + Math.random() * 0.8).toFixed(2)}`);
        layer.append(piece);
    }
    document.body.append(layer);
    setTimeout(() => layer.remove(), 2600);
}
document.addEventListener('patrimonio:celebrate', celebrate);

/* ── Teclado ──────────────────────────────────────────────────────────────── */

function isTyping(target) {
    return target && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName));
}

document.addEventListener('keydown', async event => {
    if (!shellMounted) return;
    const meta = event.metaKey || event.ctrlKey;
    if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (!hasOpenSheet()) (await import('./sheets/quick.js')).openPalette();
        return;
    }
    if (meta || event.altKey || isTyping(event.target) || hasOpenSheet()) return;
    const key = event.key.toLowerCase();
    if (key === 'n') { event.preventDefault(); (await import('./sheets/transaction.js')).openTransactionSheet(); }
    else if (key === 'i') { event.preventDefault(); (await import('./sheets/transaction.js')).openTransactionSheet({ type: 'income' }); }
    else if (key === 'a') { event.preventDefault(); (await import('./sheets/quick.js')).openAffordSheet(); }
    else if (key === 'd') { event.preventDefault(); togglePrivate(); }
    else if (key === '/') { event.preventDefault(); (await import('./sheets/quick.js')).openPalette(); }
    else if (key === '?') { event.preventDefault(); showShortcuts(); }
    else if (/^[1-9]$/.test(key)) {
        const item = NAV_ITEMS[Number(key) - 1];
        if (item) go(`#/${item.id}`);
    }
});

function showShortcuts() {
    const rows = [
        ['⌘ K', 'Buscar y ejecutar'], ['N', 'Nuevo gasto'], ['I', 'Nuevo ingreso'], ['A', '¿Me alcanza?'],
        ['D', 'Modo discreto'], ['/', 'Buscar'], ['1 – 9', 'Ir a cada sección'], ['?', 'Esta ayuda']
    ];
    openSheet({
        title: 'Atajos de teclado',
        size: 'sm',
        content: html`<div class="shortcut-list">${rows.map(([keys, label]) => html`<div class="row-between"><span>${label}</span><kbd>${keys}</kbd></div>`)}</div>`
    });
}

/* ── Tipo de cambio ───────────────────────────────────────────────────────── */

/**
 * Una vez al día, si la persona no fijó el tipo a mano, se actualiza desde
 * `api.exchangerate-api.com` (ya permitido en la CSP del sitio). Es la
 * referencia del mercado; el tipo de venta del banco puede variar unos colones.
 * Se guardan colones por dólar y por euro: el colón es el pivote de la tabla.
 */
async function refreshExchangeRate() {
    const model = app.model();
    const settings = model.settings;
    if (settings.fxSource === 'manual' || settings.fxUpdatedAt === todayISO() || !navigator.onLine) return;
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    const perDollar = Number(data?.rates?.CRC);
    const eurosPerDollar = Number(data?.rates?.EUR);
    if (!(perDollar > 300 && perDollar < 1500)) return;
    const fxRates = { USD: Math.round(perDollar * 100) / 100 };
    const perEuro = perDollar / eurosPerDollar;
    if (perEuro > 300 && perEuro < 2000) fxRates.EUR = Math.round(perEuro * 100) / 100;
    await app.store.saveProfile({ settings: { ...app.store.profile.settings, fxRates: { ...(settings.fxRates || {}), ...fxRates }, fxUpdatedAt: todayISO(), fxSource: 'auto' } });
}

/* ── Service worker ───────────────────────────────────────────────────────── */

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/Gestor-Patrimonios/sw.js', { scope: '/Gestor-Patrimonios/' });
            const offerUpdate = worker => {
                toast('Hay una versión nueva de Patrimonio.', {
                    duration: 12000,
                    action: { label: 'Actualizar', onClick: () => worker.postMessage({ type: 'SKIP_WAITING' }) }
                });
            };
            if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting);
            registration.addEventListener('updatefound', () => {
                const worker = registration.installing;
                worker?.addEventListener('statechange', () => {
                    if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(worker);
                });
            });
            let reloading = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (reloading) return;
                reloading = true;
                location.reload();
            });
        } catch (error) {
            console.warn('Service worker', error);
        }
    });
}

app.rerender = () => paint();
start();
