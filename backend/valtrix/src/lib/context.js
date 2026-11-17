/**
 * Identidad, negocio activo, capacidades y suscripción.
 *
 * Aquí vive el aislamiento entre negocios. Todo lo demás del API depende de
 * que estas cuatro preguntas se respondan bien en CADA petición:
 *
 *   1. ¿Quién llama?            → el ID token verificado contra Firebase
 *   2. ¿Qué es en VALTRIX?      → el custom claim `role`
 *   3. ¿Pertenece a ESTE negocio y con qué capacidades? → `members/{uid}`
 *   4. ¿La suscripción permite esta operación?          → `subscription`
 *
 * El `tenantId` que manda el navegador es una PETICIÓN de contexto, nunca una
 * autorización. Se comprueba contra la membresía antes de tocar un dato, y si
 * no cuadra, la petición muere aquí. Esconder una sección en el portal no
 * protege nada: este módulo vuelve a decidir, aunque el botón no se viera.
 */

import { catalog } from '../core.js';
import { sha256 } from './firebase.js';
import { fail } from './http.js';

/** Papel global de la cuenta, en el custom claim de Firebase Auth. */
export const ROLES = Object.freeze(['developer', 'admin', 'business']);
/** Quien administra VALTRIX: suscripciones, incorporaciones, prospectos. */
export const STAFF = Object.freeze(['developer', 'admin']);
export const isStaff = role => STAFF.includes(role);

/**
 * Roles y capacidades dentro de un negocio. La lista vive en el catálogo del
 * núcleo porque la leen también el portal (para no ofrecer un botón que va a
 * responder que no) y la demo; aquí solo se reexporta. `owner` tiene toda
 * capacidad sin enumerarla.
 */
export const TENANT_ROLES = catalog.TENANT_ROLES;
export const DEFAULT_CAPABILITIES = catalog.DEFAULT_CAPABILITIES;

/** Capacidades que solo tienen sentido leyendo: las conserva un negocio suspendido. */
export const READ_CAPABILITIES = catalog.READ_CAPABILITIES;

const nowIso = () => new Date().toISOString();

/* ------------------------------------------------------------------ *
 * Verificación del ID token, con caché corta
 * ------------------------------------------------------------------ */

const tokenCache = new Map();
const TOKEN_TTL = 45000;

async function verifyCached(auth, token) {
    const key = await sha256(token);
    const hit = tokenCache.get(key);
    if (hit && hit.expires > Date.now()) return hit.account;
    const account = await auth.verifyIdToken(token);
    if (account) {
        if (tokenCache.size > 500) tokenCache.clear();
        tokenCache.set(key, { account, expires: Date.now() + TOKEN_TTL });
    }
    return account;
}

/** Olvida la caché de una cuenta tras cambiarle el papel o desactivarla. */
export function forgetAccount(uid) {
    for (const [key, entry] of tokenCache) if (entry.account?.uid === uid) tokenCache.delete(key);
}

/**
 * Resuelve quién llama. Devuelve null sin token; lanza 401/403 cuando el token
 * no vale, la cuenta está desactivada, sin verificar o sin papel.
 *
 * El papel es siempre el claim. `users/{uid}` lo replica para poder consultarlo
 * y presentarlo, y solo lo escribe el Worker; si discrepan, manda el claim y el
 * documento se corrige en esta misma petición.
 */
export async function resolveUser(ctx) {
    const header = ctx.request.headers.get('authorization') || '';
    const token = /^Bearer (.+)$/.exec(header)?.[1];
    if (!token) return null;
    const account = await verifyCached(ctx.auth, token);
    if (!account) fail(401, 'UNAUTHENTICATED');
    if (account.disabled) fail(403, 'ACCOUNT_DISABLED');
    if (!account.emailVerified) fail(403, 'EMAIL_NOT_VERIFIED');

    let profile = await ctx.db.get('users', account.uid);
    let role = account.claims.role;

    if (!ROLES.includes(role)) {
        // Sin claim, la cuenta solo puede ser `business`, y únicamente si ya
        // tiene una membresía activa en algún negocio: alguien la invitó. Una
        // cuenta recién creada sin invitación no es nadie, y así se queda.
        const memberships = await activeMemberships(ctx, account.uid);
        if (!memberships.length) fail(403, 'NO_ROLE');
        role = 'business';
        await ctx.auth.setClaims(account.uid, { role });
    }

    if (!profile) {
        profile = {
            email: account.email,
            name: account.displayName || account.email.split('@')[0],
            phone: '',
            role,
            status: 'active',
            createdAt: nowIso(),
            updatedAt: nowIso()
        };
        try { await ctx.db.create('users', account.uid, profile); } catch { profile = await ctx.db.get('users', account.uid); }
    } else if (profile.role !== role) {
        await ctx.db.update('users', account.uid, { role, updatedAt: nowIso() });
        profile = { ...profile, role };
    }
    if (profile.status === 'disabled') fail(403, 'ACCOUNT_DISABLED');

    return { uid: account.uid, email: account.email, role, name: profile.name || account.email, profile };
}

export function requireUser(ctx) {
    if (!ctx.user) fail(401, 'UNAUTHENTICATED');
    return ctx.user;
}

export function requireRole(ctx, roles) {
    requireUser(ctx);
    if (!roles.includes(ctx.user.role)) fail(403, 'FORBIDDEN');
}

export const requireStaff = ctx => requireRole(ctx, STAFF);

/* ------------------------------------------------------------------ *
 * Negocios y membresías
 * ------------------------------------------------------------------ */

export const membersPath = tenantId => `tenants/${tenantId}/members`;

/**
 * Los negocios de una persona. Es la ÚNICA consulta del API que cruza
 * negocios, y existe solo para responder «¿a cuáles pertenezco?». El `uid` se
 * guarda repetido dentro del documento, además de ser su identificador, porque
 * una consulta de grupo de colecciones filtra por campo, no por nombre.
 */
export async function activeMemberships(ctx, uid) {
    const rows = await ctx.db.queryGroup('members', { where: [['uid', '==', uid], ['status', '==', 'active']], limit: 50 });
    return rows.map(row => ({ ...row, tenantId: row._parent.split('/').at(-1) }));
}

/**
 * Resuelve el negocio con el que se trabaja y qué puede hacer quien llama.
 *
 * `tenantId` llega en la cabecera `x-valtrix-tenant` o en la ruta. Que llegue
 * no autoriza nada: aquí se comprueba la membresía, su estado y el del negocio.
 * Un administrador de VALTRIX NO entra por ser administrador —no lee las
 * finanzas de nadie—; necesita su propia membresía, igual que todos.
 */
export async function resolveTenant(ctx, tenantId) {
    requireUser(ctx);
    if (!tenantId) fail(400, 'TENANT_REQUIRED');

    const tenant = await ctx.db.get('tenants', tenantId);
    if (!tenant) fail(404, 'TENANT_NOT_FOUND');

    const membership = await ctx.db.get(membersPath(tenantId), ctx.user.uid);
    // Para quien no es miembro, el negocio NO EXISTE, y da igual que exista:
    // un 403 distinto del 404 confirmaría que hay un negocio con ese
    // identificador, y los identificadores son el nombre del negocio en
    // minúsculas, así que se adivinan. Quien sí es miembro, pero suspendido,
    // merece saber por qué no entra.
    if (!membership) fail(404, 'TENANT_NOT_FOUND');
    if (membership.status !== 'active') fail(403, 'MEMBERSHIP_SUSPENDED');

    const capabilities = membership.role === 'owner'
        ? ['*']
        : [...new Set([...(DEFAULT_CAPABILITIES[membership.role] || []), ...(membership.capabilities || [])])];

    return {
        id: tenantId,
        tenant,
        membership,
        role: membership.role,
        capabilities,
        subscription: tenant.subscription || { state: 'pending_activation', paidPeriods: 0, entitlements: {} }
    };
}

/* ------------------------------------------------------------------ *
 * Capacidades, suscripción y módulos
 * ------------------------------------------------------------------ */

export function can(scope, capability) {
    return scope.capabilities.includes('*') || scope.capabilities.includes(capability);
}

/**
 * Exige una capacidad. Una capacidad de escritura necesita además que la
 * suscripción lo permita: un negocio suspendido conserva sus datos y los puede
 * leer, pero no registrar nada. Suspender no es borrar.
 */
export function requireCapability(scope, capability) {
    if (!can(scope, capability)) fail(403, 'FORBIDDEN');
    if (READ_CAPABILITIES.includes(capability)) return;
    const state = scope.subscription.state;
    if (state === 'suspended') fail(402, 'SUBSCRIPTION_SUSPENDED');
    if (!['active', 'past_due', 'cancel_at_period_end'].includes(state)) fail(402, 'SUBSCRIPTION_INACTIVE');
}

/**
 * Para LEER basta con una de varias capacidades: la lista de productos la
 * necesita quien lleva el inventario y también quien registra ventas. No mira
 * la suscripción —un negocio suspendido sigue consultando—, y por eso solo la
 * usan las rutas GET; una escritura pasa siempre por `requireCapability`.
 */
export function requireAny(scope, capabilities) {
    if (!capabilities.some(capability => can(scope, capability))) fail(403, 'FORBIDDEN');
}

/**
 * Módulos habilitados por períodos liquidados, no por transacciones bancarias
 * contadas: un pago dividido, duplicado o anticipado no debe adelantar una
 * activación. El resultado se guarda en `subscription.entitlements` y esta
 * función es la que lo calcula, en un solo sitio.
 */
export function entitlementsFor({ state, paidPeriods = 0 }) {
    const enabled = ['active', 'past_due', 'cancel_at_period_end', 'suspended'].includes(state);
    return Object.fromEntries(catalog.MODULES.map(module => [module, enabled && paidPeriods >= catalog.MODULE_PERIODS[module]]));
}

/** Los módulos abiertos de un negocio: manda la regla, y el campo guardado solo la afina. */
export function entitlementsOf(subscription) {
    const current = subscription || { state: 'pending_activation', paidPeriods: 0 };
    return { ...entitlementsFor(current), ...(current.entitlements || {}) };
}

export function requireModule(scope, module) {
    if (!entitlementsOf(scope.subscription)[module]) fail(402, 'MODULE_LOCKED', { module });
}

/** Transiciones admitidas de la suscripción. Cualquier otra es un error, no un salto. */
export const SUBSCRIPTION_STATES = Object.freeze(['pending_activation', 'active', 'past_due', 'suspended', 'cancel_at_period_end', 'canceled']);

const TRANSITIONS = Object.freeze({
    pending_activation: ['active', 'canceled'],
    active: ['past_due', 'cancel_at_period_end', 'suspended', 'canceled'],
    past_due: ['active', 'suspended', 'canceled'],
    suspended: ['active', 'canceled'],
    cancel_at_period_end: ['active', 'canceled'],
    canceled: []
});

export function canTransition(from, to) {
    return (TRANSITIONS[from] || []).includes(to);
}

export const stamp = nowIso;
