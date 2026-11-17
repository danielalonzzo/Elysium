/**
 * El portal: sesión, marco y enrutado.
 *
 * Sirve dos páginas con el mismo código:
 *
 *   · `cuenta.html` — la cuenta de verdad. Cuatro estados, y los cuatro se
 *     explican en pantalla en vez de dejar a nadie mirando una página vacía:
 *     sin configurar, sin sesión, con el correo sin verificar, y dentro.
 *
 *   · `demo.html` — la demo. No hay sesión ni servidor: el motor corre aquí
 *     mismo, sobre un taller ficticio (`demo.js`). Las vistas son las mismas.
 *
 * El negocio activo se recuerda en `localStorage` **solo como comodidad**: al
 * arrancar se comprueba contra la lista que devuelve el API, y si ya no está
 * —le quitaron el acceso, cambió de empresa— se cae al primero que tenga. Un
 * identificador guardado en el navegador no autoriza nada; el servidor lo
 * vuelve a comprobar en cada petición.
 *
 * Cada vista es una función que recibe el contexto y devuelve un nodo. Ninguna
 * guarda nada: lo que se ve sale siempre del API, y lo que se cambia se vuelve
 * a pedir. Es más lento y es correcto: una pantalla que recuerda un dato que
 * el servidor rechazó enseña una mentira.
 */

import { MODULE_LABEL } from '../core/catalog.js';
import { ApiError, get, useTransport } from './api.js';
import { can, findSection, go, groupsFor, has, homeFor, href, moduleHint, parseHash } from './nav.js';
import * as session from './session.js';
import { append, btn, clear, h, initials, loading, notice, pageHead, panel, tabs } from './ui.js';

const DEMO = document.body.dataset.portalMode === 'demo';
const TENANT_KEY = 'vtx-portal-tenant';
const root = document.getElementById('portal');

/** Los módulos de vistas se cargan al entrar a la sección, no antes. */
const VIEWS = {
    resumen: () => import('./views/resumen.js'),
    ventas: () => import('./views/ventas.js'),
    clientes: () => import('./views/clientes.js'),
    productos: () => import('./views/productos.js'),
    qms: () => import('./views/qms.js'),
    informes: () => import('./views/informes.js'),
    negocio: () => import('./views/negocio.js'),
    valtrix: () => import('./views/valtrix.js')
};

const MODULE_PITCH = {
    erp: 'Productos con su costo y su margen, existencias en bodega, ventas y lo que cada cliente le debe.',
    qms: 'Listas de tareas paso a paso para cada persona y avisos de cuándo le toca mantenimiento a cada equipo.',
    audit: 'Al cerrar cada mes, un resumen de los números con lo que conviene hacer en el siguiente.'
};

const state = { me: null, tenantId: null, renderId: 0, shown: null, demo: null };

const tenant = () => state.me?.tenants.find(row => row.id === state.tenantId) || null;
const navContext = () => ({ role: state.me.role, tenant: tenant() });

/* ------------------------------------------------------------------ *
 * Arranque
 * ------------------------------------------------------------------ */

async function boot() {
    clear(root).append(gate(loading(DEMO ? 'Preparando el taller de la demo…' : 'Abriendo su cuenta…')));
    if (DEMO) {
        try {
            state.demo = await import('./demo.js');
            await state.demo.start();
            useTransport(state.demo.request);
            state.me = await get('/me');
            state.tenantId = state.me.tenants[0].id;
            mountShell();
        } catch (error) {
            console.error(error);
            clear(root).append(gate(notice('No se pudo preparar la demo en este navegador. Pruebe con uno más reciente.', 'error')));
        }
        return;
    }
    try {
        await session.start();
    } catch (error) {
        clear(root).append(gate(error.code === 'NOT_CONFIGURED'
            ? notice('El acceso todavía no está configurado en este servidor. Si esperaba entrar, escriba a VALTRIX.', 'warn')
            : notice(error.message, 'error')));
        return;
    }
    session.onUser(user => { user ? enter(user) : clear(root).append(signInScreen()); });
}

async function enter(user) {
    if (!user.emailVerified) {
        clear(root).append(verifyScreen(user));
        return;
    }
    clear(root).append(gate(loading('Abriendo su cuenta…')));
    try {
        state.me = await get('/me');
    } catch (error) {
        clear(root).append(gate(
            error instanceof ApiError && error.code === 'NO_ROLE'
                ? notice('Su cuenta existe, pero todavía no tiene acceso a ningún negocio. VALTRIX la habilita al dar de alta su empresa.', 'warn')
                : notice(error.message, 'error'),
            h('p', {}, btn('Cerrar sesión', { onClick: leave }))));
        return;
    }
    state.tenantId = pickTenant();
    mountShell();
}

/**
 * El negocio guardado, si sigue siendo suyo. Si no, uno del que sea
 * propietario —es el que viene a mirar— y, si no es propietario de ninguno,
 * el primero que tenga.
 */
function pickTenant() {
    const available = state.me.tenants.map(row => row.id);
    let stored = null;
    try { stored = localStorage.getItem(TENANT_KEY); } catch { stored = null; }
    if (stored && available.includes(stored)) return stored;
    return (state.me.tenants.find(row => row.role === 'owner') || state.me.tenants[0])?.id || null;
}

function setTenant(id) {
    state.tenantId = id;
    try { localStorage.setItem(TENANT_KEY, id); } catch { /* el portal funciona igual sin recordarlo */ }
    mountShell();
}

async function leave() {
    try { localStorage.removeItem(TENANT_KEY); } catch { /* nada que limpiar */ }
    // Una pantalla que estaba cargando ya no es de nadie: se descarta su respuesta.
    state.renderId += 1;
    await session.signOut();
}

/** Vuelve a pedir quién soy y qué tengo abierto, y repinta el marco. */
async function refreshMe() {
    state.me = await get('/me');
    if (!state.me.tenants.some(row => row.id === state.tenantId)) state.tenantId = state.me.tenants[0]?.id || null;
    mountShell();
}

/* ------------------------------------------------------------------ *
 * Pantallas sin sesión
 * ------------------------------------------------------------------ */

function gate(...children) {
    return h('div', { class: 'wrap portal-gate' }, h('div', { class: 'card portal-card' }, ...children));
}

function signInScreen() {
    const message = h('div');
    const form = h('form', {
        class: 'portal-form',
        on: {
            submit: async event => {
                event.preventDefault();
                const data = new FormData(form);
                const submit = form.querySelector('button[type="submit"]');
                submit.disabled = true;
                clear(message);
                try {
                    await session.signIn(String(data.get('email') || '').trim(), String(data.get('password') || ''));
                } catch (error) {
                    message.append(notice(error.message, 'error'));
                } finally {
                    submit.disabled = false;
                }
            }
        }
    },
        h('div', { class: 'portal-fields' },
            h('p', { class: 'portal-field' },
                h('label', { for: 'entrar-correo', text: 'Correo' }),
                h('input', { id: 'entrar-correo', name: 'email', type: 'email', autocomplete: 'username', required: true })),
            h('p', { class: 'portal-field' },
                h('label', { for: 'entrar-clave', text: 'Contraseña' }),
                h('input', { id: 'entrar-clave', name: 'password', type: 'password', autocomplete: 'current-password', required: true }))),
        btn('Entrar', { kind: 'primary', type: 'submit' }),
        h('button', {
            type: 'button', class: 'portal-link', text: '¿Olvidó su contraseña o es la primera vez que entra?',
            on: {
                click: async () => {
                    const email = String(new FormData(form).get('email') || '').trim();
                    clear(message);
                    if (!email) { message.append(notice('Escriba su correo arriba y vuelva a pulsar aquí.', 'info')); return; }
                    try {
                        await session.resetPassword(email);
                        // No se dice «enviado»: Firebase responde igual exista
                        // o no la cuenta, así que afirmarlo sería inventarlo.
                        message.append(notice('Si existe una cuenta con ese correo, le llegará un enlace para definir la contraseña.', 'info'));
                    } catch (error) {
                        message.append(notice(error.message, 'error'));
                    }
                }
            }
        }),
        message);

    return gate(
        h('p', { class: 'eyebrow', text: 'Cuenta VALTRIX' }),
        h('h1', { class: 'portal-gate-title', text: 'Entre a su negocio' }),
        h('p', { class: 'portal-help', text: 'Cada persona entra con su propia cuenta. Si su empresa todavía no está dada de alta, escriba a VALTRIX.' }),
        form,
        h('p', { class: 'portal-help' }, '¿Quiere ver cómo es por dentro? ', h('a', { href: 'demo.html', text: 'Abra la demo' }), ', con un taller ficticio.'));
}

function verifyScreen(user) {
    const message = h('div');
    return gate(
        h('p', { class: 'eyebrow', text: 'Cuenta VALTRIX' }),
        h('h1', { class: 'portal-gate-title', text: 'Confirme su correo' }),
        h('p', {}, 'Le enviamos un enlace a ', h('strong', { text: user.email }), '. Ábralo y vuelva aquí.'),
        h('p', { class: 'portal-actions' },
            btn('Ya lo confirmé', { kind: 'primary', onClick: async () => { await session.reload(); enter(session.currentUser()); } }),
            btn('Enviar de nuevo', {
                onClick: async () => {
                    clear(message);
                    try { await session.resendVerification(); message.append(notice('Enviado.', 'ok')); } catch { message.append(notice('No se pudo enviar ahora. Intente en unos minutos.', 'error')); }
                }
            }),
            h('button', { class: 'portal-link', text: 'Salir', on: { click: leave } })),
        message);
}

/* ------------------------------------------------------------------ *
 * El marco, con sesión
 * ------------------------------------------------------------------ */

let canvas = null;
let side = null;
let navLinks = new Map();

function mountShell() {
    navLinks = new Map();
    canvas = h('main', { id: 'contenido', class: 'app-main', tabindex: '-1' });
    state.shown = null;
    const current = tenant();
    const periods = current?.subscription.paidPeriods || 0;

    const menuToggle = h('button', {
        type: 'button', class: 'btn is-small app-menu-toggle', 'aria-expanded': 'false', 'aria-controls': 'app-side', text: 'Menú',
        on: { click: () => toggleMenu(!side.classList.contains('is-open')) }
    });

    side = h('aside', { class: 'app-side', id: 'app-side' },
        tenantSwitcher(menuToggle),
        ...groupsFor(navContext()).map(group => h('div', { class: ['nav-group', group.locked && 'is-locked'] },
            h('p', { class: 'nav-label' }, group.label, group.locked ? h('small', { text: moduleHint(group.module, periods) }) : null),
            h('nav', { 'aria-label': group.label }, group.items.map(section => {
                const link = h('a', { href: href(section.id), class: 'nav-item', on: { click: () => toggleMenu(false) } },
                    h('span', { class: 'nav-icon', 'aria-hidden': 'true', text: section.icon }), section.label);
                navLinks.set(section.id, link);
                return link;
            })))),
        h('div', { class: 'app-foot' },
            h('p', { class: 'portal-sub' }, state.me.name, h('br'), DEMO ? 'Propietaria (demo)' : state.me.email),
            DEMO
                ? h('a', { class: 'portal-link', href: 'index.html', text: 'Salir de la demo' })
                : h('button', { class: 'portal-link', text: 'Cerrar sesión', on: { click: leave } })));

    // `append` de ui.js, no el nativo: el nativo escribe «null» como texto.
    append(clear(root), [DEMO ? demoBar() : null, h('div', { class: 'wrap app' }, side, canvas)]);
    window.removeEventListener('hashchange', renderRoute);
    window.addEventListener('hashchange', renderRoute);
    renderRoute();
}

function toggleMenu(open) {
    side.classList.toggle('is-open', open);
    side.querySelector('.app-menu-toggle')?.setAttribute('aria-expanded', String(open));
}

function tenantSwitcher(menuToggle) {
    const tenants = state.me.tenants;
    const active = tenant();
    if (!active) {
        return h('div', { class: 'app-tenant' },
            h('p', { class: 'app-tenant-name' }, h('span', { class: 'avatar', 'aria-hidden': 'true', text: 'V' }), h('strong', { text: 'VALTRIX' })),
            menuToggle);
    }
    return h('div', { class: 'app-tenant' },
        h('p', { class: 'app-tenant-name' },
            h('span', { class: 'avatar', 'aria-hidden': 'true', text: initials(active.name) }),
            h('strong', { text: active.name })),
        menuToggle,
        // Con un solo negocio no hay nada que elegir, y un selector de una
        // opción es ruido que hace dudar de si falta algo.
        tenants.length > 1 ? h('select', {
            'aria-label': 'Negocio con el que trabaja',
            on: { change: event => setTenant(event.target.value) }
        }, tenants.map(row => h('option', { value: row.id, selected: row.id === active.id, text: row.name }))) : null);
}

function demoBar() {
    return h('div', { class: 'demo-bar', role: 'note' }, h('div', { class: 'wrap' },
        h('p', {}, h('strong', { text: 'Demostración. ' }), 'Taller Horizonte no existe: los datos son ficticios. Lo que registre funciona de verdad y vive solo en esta pestaña.'),
        h('div', { class: 'demo-stage' },
            h('span', { text: 'Ver como en el' }),
            tabs([{ id: 1, label: 'Mes 1' }, { id: 2, label: 'Mes 2' }, { id: 3, label: 'Mes 3 en adelante' }], state.demo.stage(), async periods => {
                state.demo.setStage(periods);
                await refreshMe();
            }, 'Mes de la suscripción'))));
}

/* ------------------------------------------------------------------ *
 * Enrutado
 * ------------------------------------------------------------------ */

function viewContext(section, param, query) {
    const current = tenant();
    return {
        me: state.me,
        tenant: current,
        base: current ? `/tenants/${encodeURIComponent(current.id)}` : null,
        currency: current?.baseCurrency || 'CRC',
        demo: DEMO,
        section,
        param,
        query,
        can: capability => can(current, capability),
        has: module => has(current, module),
        go,
        href,
        reload: () => renderRoute(),
        refreshMe,
        signOut: leave
    };
}

function lockedView(section) {
    const current = tenant();
    const periods = current.subscription.paidPeriods || 0;
    return h('div', {},
        pageHead({ eyebrow: MODULE_LABEL[section.module], title: section.label }),
        panel({ title: moduleHint(section.module, periods) },
            h('p', { text: MODULE_PITCH[section.module] }),
            h('p', { class: 'muted small', text: 'Los módulos se abren conforme avanza la suscripción, uno por mes. Aparece aquí para que sepa que existe y qué va a encontrar.' }),
            DEMO ? h('p', {}, btn('Ver la demo con este módulo abierto', {
                kind: 'primary',
                onClick: async () => { state.demo.setStage({ erp: 1, qms: 2, audit: 3 }[section.module]); await refreshMe(); }
            })) : null));
}

async function renderRoute() {
    const renderId = state.renderId += 1;
    const { section: requested, param, query } = parseHash();
    const context = navContext();
    const section = findSection(context, requested) || findSection(context, homeFor(context)) || findSection(context, 'cuenta');
    if (!section) return;
    if (requested !== section.id) { go(section.id, null, null, { replace: true }); return; }

    for (const [id, link] of navLinks) {
        if (id === section.id) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    }
    document.title = `${section.label} | ${DEMO ? 'Demo VALTRIX' : 'Cuenta VALTRIX'}`;

    const sameScreen = state.shown === `${section.id}/${param || ''}`;
    if (section.locked) {
        clear(canvas).append(lockedView(section));
        state.shown = null;
        return;
    }
    // Al volver a pedir la misma pantalla se conserva lo que había, atenuado:
    // sin parpadeo y sin que la página salte.
    if (sameScreen) canvas.setAttribute('aria-busy', 'true');
    else clear(canvas).append(loading());

    try {
        const module = await VIEWS[section.view]();
        const node = await module.views[section.id](viewContext(section, param, query));
        if (renderId !== state.renderId) return;
        canvas.replaceChildren(node);
        if (!sameScreen) {
            window.scrollTo({ top: 0 });
            canvas.focus({ preventScroll: true });
        }
        state.shown = `${section.id}/${param || ''}`;
    } catch (error) {
        if (renderId !== state.renderId) return;
        // La sesión se cerró mientras cargaba: la pantalla de acceso ya está puesta.
        if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') return;
        console.error(error);
        // Si el módulo se cerró entre medias (la suscripción cambió), el marco
        // tiene que enterarse: se vuelve a pedir quién soy.
        if (error instanceof ApiError && error.code === 'MODULE_LOCKED') { await refreshMe(); return; }
        clear(canvas).append(
            pageHead({ title: section.label }),
            notice(error.message || 'No se pudo cargar esta pantalla.', 'error'),
            h('p', {}, btn('Reintentar', { onClick: () => renderRoute() })));
        state.shown = null;
    } finally {
        canvas.removeAttribute('aria-busy');
    }
}

boot();
