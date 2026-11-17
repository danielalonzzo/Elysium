/**
 * La demo: el sistema entero dentro del navegador, sin servidor y sin cuenta.
 *
 * No es una maqueta. Es el mismo motor que corre en el Worker
 * (`js/core/erp.js`, `qms.js`, `audit.js`) y la misma tabla de rutas
 * (`js/core/routes.js`), con un almacén en memoria en lugar de Firestore y un
 * taller ficticio que ha «vivido» diez semanas (`js/core/demo-data.js`).
 *
 * Lo que la persona registre aquí —una venta, un cobro, una tarea marcada—
 * funciona de verdad: descuenta existencias, mueve el saldo, cambia el panel.
 * Y vive solo en esta pestaña: al recargar, el taller vuelve a su mañana.
 *
 * Lo que la demo NO tiene es lo que solo existe con un servidor: cuentas,
 * permisos por persona y varios negocios. Aquí siempre se entra como la
 * propietaria, que lo ve todo. La seguridad no se enseña en una demo: se
 * prueba (`backend/valtrix/test/`).
 *
 * El interruptor de «mes» simula la suscripción: en el primer mes solo está
 * abierto el control financiero; en el segundo, también el orden operativo;
 * desde el tercero, la auditoría. Los datos son los mismos; cambia qué módulo
 * se puede abrir, igual que le pasa a un negocio real.
 */

import { DEFAULT_CAPABILITIES, MODULES, MODULE_PERIODS, TENANT_ROLES } from '../core/catalog.js';
import { DEMO_PEOPLE, DEMO_TENANT, seedDemo } from '../core/demo-data.js';
import { DomainError, messageFor } from '../core/errors.js';
import { TENANT_ROUTES, matchPath } from '../core/routes.js';
import { engineScope, memoryStore, scopedStore } from '../core/store.js';
import { addMonths, businessDay } from '../core/time.js';
import { email as cleanEmail, newId, text } from '../core/validate.js';
import { ApiError } from './api.js';

const STAGE_KEY = 'vtx-demo-stage';

const state = { store: null, engine: null, periods: 3 };

const entitlements = () => Object.fromEntries(MODULES.map(module => [module, state.periods >= MODULE_PERIODS[module]]));

function tenantSummary() {
    return {
        id: DEMO_TENANT.id,
        name: DEMO_TENANT.name,
        timezone: DEMO_TENANT.timezone,
        baseCurrency: DEMO_TENANT.baseCurrency,
        role: 'owner',
        subscription: { state: 'active', paidPeriods: state.periods, currentPeriodEnd: addMonths(businessDay(new Date(), DEMO_TENANT.timezone), 1) },
        entitlements: entitlements(),
        capabilities: ['*']
    };
}

const memberView = row => ({
    uid: row.id, name: row.name || '', email: row.email || '', position: row.position || '', role: row.role, status: row.status,
    capabilities: row.role === 'owner' ? ['*'] : (DEFAULT_CAPABILITIES[row.role] || []), createdAt: row.createdAt || null
});

/** Lo que en el sistema real resuelve el Worker con cuentas y membresías. */
const OWN_ROUTES = [
    ['GET', '/me', async () => ({
        uid: DEMO_PEOPLE.owner.uid, email: DEMO_PEOPLE.owner.email, name: DEMO_PEOPLE.owner.name, role: 'business', phone: '', tenants: [tenantSummary()]
    })],
    ['PATCH', '/me', async () => ({ ok: true })],
    ['GET', '/tenants/:tenantId', async () => ({ ...tenantSummary(), legalName: '', status: 'active' })],
    ['GET', '/tenants/:tenantId/members', async () => ({
        members: (await state.store.query('members', { limit: 200 })).map(memberView).sort((a, b) => a.name.localeCompare(b.name, 'es'))
    })],
    ['GET', '/tenants/:tenantId/capabilities', async () => ({
        mine: ['*'], canManageMembers: true, roles: Object.fromEntries(TENANT_ROLES.map(role => [role, DEFAULT_CAPABILITIES[role] || []]))
    })],
    ['POST', '/tenants/:tenantId/members', async ({ body }) => {
        const address = cleanEmail(body.email);
        if (!address) throw new DomainError('INVALID_INPUT', { field: 'email' });
        const members = await state.store.query('members', { limit: 200 });
        if (members.some(row => row.email === address)) throw new DomainError('ALREADY_MEMBER');
        const role = TENANT_ROLES.includes(body.role) ? body.role : 'staff';
        const uid = `demo-${newId().slice(0, 8)}`;
        const member = { uid, email: address, name: text(body.name, 80) || address.split('@')[0], position: text(body.position, 80), role, capabilities: [], status: 'active', createdAt: new Date().toISOString(), createdBy: DEMO_PEOPLE.owner.uid };
        await state.store.commit([state.store.write.create('members', uid, member)]);
        return { ok: true, member: { uid, email: address, name: member.name, position: member.position, role, existed: false } };
    }],
    ['PATCH', '/tenants/:tenantId/members/:uid', async ({ params, body }) => {
        if (params.uid === DEMO_PEOPLE.owner.uid) throw new DomainError('FORBIDDEN');
        const changes = { updatedAt: new Date().toISOString() };
        if (TENANT_ROLES.includes(body.role)) changes.role = body.role;
        if (['active', 'suspended'].includes(body.status)) changes.status = body.status;
        await state.store.commit([state.store.write.update('members', params.uid, changes)]);
        return { ok: true, uid: params.uid, ...changes };
    }]
];

/** Arma el taller. Se llama una vez, al abrir la demo. */
export async function start() {
    try {
        const saved = Number(sessionStorage.getItem(STAGE_KEY));
        if ([1, 2, 3].includes(saved)) state.periods = saved;
    } catch { /* sin almacenamiento, la demo empieza en el mes 3 */ }
    state.store = scopedStore(memoryStore(), `tenants/${DEMO_TENANT.id}`);
    await seedDemo({ store: state.store });
    state.engine = engineScope({ store: state.store, tenant: DEMO_TENANT, actor: DEMO_PEOPLE.owner });
}

export const stage = () => state.periods;

export function setStage(periods) {
    state.periods = Math.min(3, Math.max(1, Number(periods) || 3));
    try { sessionStorage.setItem(STAGE_KEY, String(state.periods)); } catch { /* da igual */ }
}

/** Responde a una ruta del API como lo haría el servidor. */
export async function request(path, { method = 'GET', body = undefined } = {}) {
    const [pathname, search = ''] = path.split('?');
    const query = new URLSearchParams(search);
    try {
        for (const [routeMethod, pattern, run] of OWN_ROUTES) {
            const params = routeMethod === method ? matchPath(pattern, pathname) : null;
            if (params) return structuredClone(await run({ params, query, body: body || {} }));
        }
        const prefix = `/tenants/${DEMO_TENANT.id}`;
        if (pathname.startsWith(prefix)) {
            const rest = pathname.slice(prefix.length) || '/';
            for (const entry of TENANT_ROUTES) {
                const params = entry.method === method ? matchPath(entry.path, rest) : null;
                if (!params) continue;
                // Lo único que la demo hace cumplir es la suscripción simulada:
                // es lo que se quiere enseñar. Permisos no hay: se entra como la propietaria.
                if (!entitlements()[entry.module]) throw new DomainError('MODULE_LOCKED', { module: entry.module });
                const result = await entry.run(state.engine, { params, query, body: body || {}, modules: entitlements() });
                // Lo que sale es una copia, como si hubiera viajado por la red:
                // una vista que la cambie no cambia el almacén.
                return structuredClone(result);
            }
        }
        throw new DomainError('NOT_FOUND');
    } catch (error) {
        if (error instanceof DomainError) throw new ApiError(messageFor(error.code), { status: error.status, code: error.code, extra: error.extra });
        if (error?.code === 'CONFLICT') throw new ApiError(messageFor('CONFLICT'), { status: 409, code: 'CONFLICT' });
        throw error;
    }
}
