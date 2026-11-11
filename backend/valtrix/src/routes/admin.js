/**
 * Administración de VALTRIX: dar de alta negocios y llevar sus suscripciones.
 *
 * Esto es el CRM del proveedor, no la gestión de ningún negocio. Un
 * administrador crea el negocio, invita a su propietario y mueve la
 * suscripción; **no lee las finanzas de nadie** por el hecho de ser
 * administrador. Para operar dentro de un negocio necesita una membresía, como
 * todos, y queda registrada.
 */

import { route } from '../lib/route.js';
import {
    SUBSCRIPTION_STATES, canTransition, entitlementsFor, forgetAccount,
    membersPath, requireStaff, stamp
} from '../lib/context.js';
import { FirestoreConflict } from '../lib/firebase.js';
import { email as parseEmail, fail, integer, oneOf, readJson, slug, text } from '../lib/http.js';

const TIMEZONES = ['America/Costa_Rica', 'Europe/Lisbon', 'Europe/Madrid'];

export const adminRoutes = [
    route('GET', '/admin/tenants', async ctx => {
        requireStaff(ctx);
        const rows = await ctx.db.query('tenants', { limit: 500 });
        return {
            tenants: rows.map(row => ({
                id: row.id,
                name: row.name,
                status: row.status || 'active',
                createdAt: row.createdAt || null,
                subscription: {
                    state: row.subscription?.state || 'pending_activation',
                    paidPeriods: row.subscription?.paidPeriods || 0,
                    currentPeriodEnd: row.subscription?.currentPeriodEnd || null
                }
            })).sort((a, b) => a.name.localeCompare(b.name, 'es'))
        };
    }),

    /**
     * Da de alta un negocio con su propietario.
     *
     * El negocio nace en `pending_activation` y con cero períodos: ningún
     * módulo abierto hasta que haya un pago confirmado. La cuenta del
     * propietario se crea aquí si no existía, para que no queden negocios sin
     * dueño ni cuentas sin negocio.
     */
    route('POST', '/admin/tenants', async ctx => {
        requireStaff(ctx);
        const body = await readJson(ctx.request);

        const name = text(body.name, 80);
        const id = slug(body.id || body.name);
        const ownerEmail = parseEmail(body.ownerEmail);
        if (!name || !id || !ownerEmail) fail(400, 'INVALID_INPUT');

        const timezone = oneOf(body.timezone, TIMEZONES, 'America/Costa_Rica');
        const baseCurrency = oneOf(body.baseCurrency, ['CRC', 'USD', 'EUR'], 'CRC');

        let owner = await ctx.auth.getUserByEmail(ownerEmail).catch(() => null);
        const ownerExisted = Boolean(owner);
        if (!owner) {
            const uid = await ctx.auth.createUser({
                email: ownerEmail,
                displayName: text(body.ownerName, 80) || ownerEmail.split('@')[0],
                emailVerified: false
            });
            owner = await ctx.auth.getUser(uid);
        }

        const subscription = { state: 'pending_activation', paidPeriods: 0, currentPeriodEnd: null, entitlements: entitlementsFor({ state: 'pending_activation', paidPeriods: 0 }) };
        const createdAt = stamp();

        try {
            await ctx.db.commit([
                ctx.db.write.create('tenants', id, {
                    name,
                    legalName: text(body.legalName, 120),
                    timezone,
                    baseCurrency,
                    status: 'active',
                    subscription,
                    createdAt,
                    createdBy: ctx.user.uid
                }),
                ctx.db.write.create(membersPath(id), owner.uid, {
                    // El uid se repite dentro del documento además de ser su
                    // nombre: la consulta de grupo de colecciones filtra por
                    // campo, no por identificador.
                    uid: owner.uid,
                    email: ownerEmail,
                    name: owner.displayName || ownerEmail.split('@')[0],
                    role: 'owner',
                    capabilities: [],
                    status: 'active',
                    createdAt,
                    createdBy: ctx.user.uid
                })
            ]);
        } catch (error) {
            if (error instanceof FirestoreConflict) fail(409, 'CONFLICT', { id });
            throw error;
        }

        await ctx.auth.setClaims(owner.uid, { role: 'business' });
        forgetAccount(owner.uid);

        return { id, name, owner: { uid: owner.uid, email: ownerEmail, existed: ownerExisted }, subscription };
    }),

    /**
     * Mueve la suscripción.
     *
     * Dos cosas que no se tocan desde el navegador del cliente y por eso viven
     * aquí: el estado y los períodos liquidados. `paidPeriods` cuenta períodos
     * de servicio cubiertos, no transacciones bancarias: un pago dividido o
     * duplicado no adelanta la activación de un módulo.
     */
    route('POST', '/admin/tenants/:tenantId/subscription', async ctx => {
        requireStaff(ctx);
        const tenantId = ctx.params.tenantId;
        const tenant = await ctx.db.get('tenants', tenantId);
        if (!tenant) fail(404, 'TENANT_NOT_FOUND');

        const body = await readJson(ctx.request);
        const current = tenant.subscription || { state: 'pending_activation', paidPeriods: 0 };

        const state = 'state' in body ? oneOf(body.state, [...SUBSCRIPTION_STATES]) : current.state;
        if (!state) fail(400, 'INVALID_INPUT');
        if (state !== current.state && !canTransition(current.state, state)) {
            fail(409, 'INVALID_TRANSITION', { from: current.state, to: state });
        }

        let paidPeriods = current.paidPeriods || 0;
        if ('paidPeriods' in body) {
            const value = integer(body.paidPeriods, { min: 0, max: 600 });
            if (value === null) fail(400, 'INVALID_INPUT');
            paidPeriods = value;
        }

        const reason = text(body.reason, 200);
        if (state !== current.state && !reason) fail(400, 'INVALID_INPUT');

        const subscription = {
            state,
            paidPeriods,
            currentPeriodEnd: text(body.currentPeriodEnd, 32) || current.currentPeriodEnd || null,
            entitlements: entitlementsFor({ state, paidPeriods }),
            updatedAt: stamp(),
            updatedBy: ctx.user.uid
        };

        await ctx.db.commit([
            ctx.db.write.update('tenants', tenantId, { subscription }, { updateTime: tenant._updateTime }),
            // La suscripción es la razón por la que un módulo se abre o se
            // cierra: cada cambio deja su rastro, con quién y por qué.
            ctx.db.write.create(`tenants/${tenantId}/subscriptionLog`, `${Date.now()}`, {
                from: current.state, to: state, paidPeriods, reason, at: stamp(), by: ctx.user.uid
            })
        ]);

        return { ok: true, subscription };
    })
];
