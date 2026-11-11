/**
 * El portal: sesión, marco y enrutado.
 *
 * Cuatro estados, y los cuatro se explican en pantalla en vez de dejar a nadie
 * mirando una página vacía: sin configurar, sin sesión, con el correo sin
 * verificar, y dentro. El cuarto es el único con menú.
 *
 * El negocio activo se recuerda en `localStorage` **solo como comodidad**: al
 * arrancar se comprueba contra la lista que devuelve el API, y si ya no está
 * —le quitaron el acceso, cambió de empresa— se cae al primero que tenga. Un
 * identificador guardado en el navegador no autoriza nada; el servidor lo
 * vuelve a comprobar en cada petición.
 */

import { ApiError, get } from './api.js';
import { GROUP_LABEL, HOME, findSection, go, groupsFor, parseHash } from './nav.js';
import * as session from './session.js';
import { clear, h, initials, loading, notice } from './ui.js';
import { cuenta, gente, modulePlaceholder, negocios, resumen } from './views.js';

const TENANT_KEY = 'vtx-portal-tenant';
const root = document.getElementById('portal');

const state = { me: null, tenantId: null };

/* ------------------------------------------------------------------ *
 * Arranque
 * ------------------------------------------------------------------ */

async function boot() {
    clear(root).append(loading('Abriendo su cuenta…'));
    try {
        await session.start();
    } catch (error) {
        clear(root).append(shellFrame(error.code === 'NOT_CONFIGURED'
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
    clear(root).append(loading('Abriendo su cuenta…'));
    try {
        state.me = await get('/me');
    } catch (error) {
        clear(root).append(shellFrame(
            error instanceof ApiError && error.code === 'NO_ROLE'
                ? notice('Su cuenta existe, pero todavía no tiene acceso a ningún negocio. VALTRIX la habilita al dar de alta su empresa.', 'warn')
                : notice(error.message, 'error'),
            h('p', {}, h('button', { class: 'button outline', text: 'Cerrar sesión', on: { click: leave } }))));
        return;
    }
    state.tenantId = pickTenant();
    mountShell();
}

/** El negocio guardado, si sigue siendo suyo; si no, el primero que tenga. */
function pickTenant() {
    const available = state.me.tenants.map(tenant => tenant.id);
    let stored = null;
    try { stored = localStorage.getItem(TENANT_KEY); } catch { stored = null; }
    if (stored && available.includes(stored)) return stored;
    return available[0] || null;
}

function setTenant(id) {
    state.tenantId = id;
    try { localStorage.setItem(TENANT_KEY, id); } catch { /* el portal funciona igual sin recordarlo */ }
    mountShell();
}

async function leave() {
    try { localStorage.removeItem(TENANT_KEY); } catch { /* nada que limpiar */ }
    await session.signOut();
}

/* ------------------------------------------------------------------ *
 * Pantallas sin sesión
 * ------------------------------------------------------------------ */

function shellFrame(...children) {
    return h('div', { class: 'portal-gate' }, h('div', { class: 'card portal-card' }, ...children));
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
        h('button', { type: 'submit', class: 'button', text: 'Entrar' }),
        h('button', {
            type: 'button', class: 'portal-link', text: '¿Olvidó su contraseña?',
            on: {
                click: async () => {
                    const email = String(new FormData(form).get('email') || '').trim();
                    clear(message);
                    try {
                        await session.resetPassword(email);
                        // No se dice «enviado»: Firebase responde igual exista
                        // o no la cuenta, así que afirmarlo sería inventarlo.
                        message.append(notice('Si existe una cuenta con ese correo, le llegará un enlace para cambiar la contraseña.', 'info'));
                    } catch (error) {
                        message.append(notice(error.message, 'error'));
                    }
                }
            }
        }),
        message);

    return h('div', { class: 'portal-gate' },
        h('div', { class: 'card portal-card' },
            h('p', { class: 'eyebrow', text: 'Cuenta VALTRIX' }),
            h('h1', { class: 'portal-gate-title', text: 'Entre a su negocio' }),
            h('p', { class: 'portal-help', text: 'Cada persona entra con su propia cuenta. Si su empresa todavía no está dada de alta, escriba a VALTRIX.' }),
            form));
}

function verifyScreen(user) {
    const message = h('div');
    return shellFrame(
        h('p', { class: 'eyebrow', text: 'Cuenta VALTRIX' }),
        h('h1', { class: 'portal-gate-title', text: 'Confirme su correo' }),
        h('p', {}, 'Le enviamos un enlace a ', h('strong', { text: user.email }), '. Ábralo y vuelva aquí.'),
        h('p', { class: 'portal-actions' },
            h('button', {
                class: 'button', text: 'Ya lo confirmé',
                on: { click: async () => { await session.reload(); enter(session.currentUser()); } }
            }),
            h('button', {
                class: 'button outline', text: 'Enviar de nuevo',
                on: {
                    click: async () => {
                        clear(message);
                        try { await session.resendVerification(); message.append(notice('Enviado.', 'ok')); } catch { message.append(notice('No se pudo enviar ahora. Intente en unos minutos.', 'error')); }
                    }
                }
            }),
            h('button', { class: 'portal-link', text: 'Salir', on: { click: leave } })),
        message);
}

/* ------------------------------------------------------------------ *
 * El marco, con sesión
 * ------------------------------------------------------------------ */

let canvas = null;
let navLinks = new Map();

function context() {
    return { role: state.me.role, hasTenant: Boolean(state.tenantId) };
}

function mountShell() {
    navLinks = new Map();
    canvas = h('main', { id: 'contenido', class: 'crm-main', tabindex: '-1' });

    const side = h('aside', { class: 'crm-side' },
        tenantSwitcher(),
        ...groupsFor(context()).map(group => h('div', { class: 'portal-nav-group' },
            h('p', { class: 'eyebrow', text: GROUP_LABEL[group.id] }),
            h('nav', { 'aria-label': GROUP_LABEL[group.id] }, group.items.map(section => {
                const link = h('a', { href: `#/${section.id}`, class: 'portal-nav-item' },
                    h('span', { 'aria-hidden': 'true', text: section.icon }), ' ', section.label);
                navLinks.set(section.id, link);
                return link;
            })))),
        h('div', { class: 'portal-side-foot' },
            h('p', { class: 'portal-sub' }, state.me.name, h('br'), state.me.email),
            h('button', { class: 'portal-link', text: 'Cerrar sesión', on: { click: leave } })));

    clear(root).append(h('div', { class: 'wrap crm-layout' }, side, canvas));
    window.addEventListener('hashchange', renderRoute);
    renderRoute();
}

function tenantSwitcher() {
    const tenants = state.me.tenants;
    if (!tenants.length) {
        return h('div', { class: 'portal-tenant' },
            h('p', { class: 'eyebrow', text: 'Espacio de trabajo' }),
            h('p', { class: 'portal-sub', text: 'Sin negocios asignados' }));
    }
    const active = tenants.find(tenant => tenant.id === state.tenantId) || tenants[0];
    const head = h('p', { class: 'crm-account' },
        h('span', { 'aria-hidden': 'true', text: initials(active.name) }),
        h('strong', { text: active.name }));

    // Con un solo negocio no hay nada que elegir, y un selector de una opción
    // es ruido que hace dudar de si falta algo.
    if (tenants.length === 1) {
        return h('div', { class: 'portal-tenant' }, h('p', { class: 'eyebrow', text: 'Espacio de trabajo' }), head);
    }

    return h('div', { class: 'portal-tenant' },
        h('p', { class: 'eyebrow', text: 'Espacio de trabajo' }),
        head,
        h('select', {
            class: 'portal-select', 'aria-label': 'Negocio con el que trabaja',
            on: { change: event => setTenant(event.target.value) }
        }, tenants.map(tenant => h('option', { value: tenant.id, selected: tenant.id === active.id, text: tenant.name }))));
}

function renderRoute() {
    const { section: requested } = parseHash();
    const fallback = HOME[state.me.role] || 'cuenta';
    const section = findSection(context(), requested) || findSection(context(), fallback) || findSection(context(), 'cuenta');
    if (!section) return;
    if (requested !== section.id) { go(section.id, { replace: true }); return; }

    for (const [id, link] of navLinks) {
        if (id === section.id) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    }
    document.title = `${section.label} | Cuenta VALTRIX`;

    clear(canvas).append(viewFor(section));
    canvas.focus({ preventScroll: true });
}

function viewFor(section) {
    if (section.id === 'cuenta') return cuenta(state, { onSignOut: leave });
    if (section.id === 'negocios') return negocios(state);
    if (!state.tenantId) return notice('Todavía no tiene ningún negocio asignado.', 'warn');
    if (section.id === 'resumen') return resumen(state);
    if (section.id === 'gente') return gente(state);
    if (section.module) return modulePlaceholder(state, section);
    return notice('Esa sección todavía no existe.', 'info');
}

boot();
