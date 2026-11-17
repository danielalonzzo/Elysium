/**
 * Administración de VALTRIX: negocios, suscripciones y el estado de la cartera
 * de clientes.
 *
 * Esto es el CRM del proveedor, no la gestión de ningún negocio. Un
 * administrador da de alta el negocio, liquida sus períodos y sigue su
 * incorporación; **no lee las finanzas de nadie** por el hecho de ser
 * administrador. Para operar dentro de un negocio necesita una membresía, como
 * todos, y queda registrada.
 *
 * Lo que sí ve de cada negocio es lo que VALTRIX necesita para cobrarle y
 * atenderlo: su nombre, a quién escribirle, en qué estado está su suscripción
 * y cómo va su incorporación.
 */

import { catalog, time } from '../core.js';
import {
    SUBSCRIPTION_STATES, canTransition, entitlementsFor, entitlementsOf,
    membersPath, requireRole, requireStaff, stamp
} from '../lib/context.js';
import { FirestoreConflict } from '../lib/firebase.js';
import { email as parseEmail, fail, integer, isoDate, minorAmount, oneOf, readJson, slug, text } from '../lib/http.js';
import { addMember, ownersOf } from '../lib/members.js';
import { route } from '../lib/route.js';
import { runScheduled } from '../scheduled.js';

const TIMEZONES = ['America/Costa_Rica', 'Europe/Lisbon', 'Europe/Madrid'];
const SECTORS = Object.keys(catalog.SECTORS);

/** Estados en los que el negocio sigue pagando (o debe hacerlo): cuentan para el ingreso mensual. */
const BILLABLE = ['active', 'past_due', 'cancel_at_period_end'];

const subscriptionOf = tenant => tenant.subscription || { state: 'pending_activation', paidPeriods: 0, currentPeriodEnd: null };

function tenantRow(row) {
    const subscription = subscriptionOf(row);
    return {
        id: row.id,
        name: row.name,
        sector: row.sector || 'otro',
        status: row.status || 'active',
        createdAt: row.createdAt || null,
        subscription: {
            state: subscription.state,
            paidPeriods: subscription.paidPeriods || 0,
            currentPeriodEnd: subscription.currentPeriodEnd || null
        },
        entitlements: entitlementsOf(subscription),
        onboarding: { status: row.onboarding?.status || 'none', submittedAt: row.onboarding?.submittedAt || null, appliedAt: row.onboarding?.appliedAt || null }
    };
}

export const adminRoutes = [
    /**
     * El tablero de VALTRIX: cuántos negocios pagan, cuánto entra cada mes, a
     * quién le vence el período y qué incorporaciones esperan.
     */
    route('GET', '/admin/overview', async ctx => {
        requireStaff(ctx);
        const [tenants, leads] = await Promise.all([
            ctx.db.query('tenants', { limit: 1000 }),
            ctx.db.query('leads', { limit: 2000 })
        ]);
        const today = time.businessDay();
        const soon = time.addDays(today, 7);
        const rows = tenants.map(tenantRow);
        const billable = rows.filter(row => BILLABLE.includes(row.subscription.state));
        return {
            today,
            plan: catalog.PLAN,
            tenants: {
                total: rows.length,
                byState: Object.fromEntries(SUBSCRIPTION_STATES.map(state => [state, rows.filter(row => row.subscription.state === state).length])),
                billable: billable.length,
                // Ingreso mensual recurrente: lo que entra si todos los que deben pagar, pagan.
                mrrMinor: billable.length * catalog.PLAN.amountMinor,
                currency: catalog.PLAN.currency
            },
            renewals: billable
                .filter(row => row.subscription.currentPeriodEnd && row.subscription.currentPeriodEnd <= soon)
                .sort((a, b) => a.subscription.currentPeriodEnd.localeCompare(b.subscription.currentPeriodEnd))
                .map(row => ({ id: row.id, name: row.name, state: row.subscription.state, currentPeriodEnd: row.subscription.currentPeriodEnd, overdue: row.subscription.currentPeriodEnd < today })),
            onboarding: rows.filter(row => ['draft', 'submitted'].includes(row.onboarding.status))
                .map(row => ({ id: row.id, name: row.name, status: row.onboarding.status, submittedAt: row.onboarding.submittedAt })),
            leads: Object.fromEntries(catalog.LEAD_STAGES.map(stage => [stage, leads.filter(row => row.stage === stage).length]))
        };
    }),

    route('GET', '/admin/tenants', async ctx => {
        requireStaff(ctx);
        const rows = await ctx.db.query('tenants', { limit: 1000 });
        return { tenants: rows.map(tenantRow).sort((a, b) => a.name.localeCompare(b.name, 'es')) };
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
        const subscription = { state: 'pending_activation', paidPeriods: 0, currentPeriodEnd: null, entitlements: entitlementsFor({ state: 'pending_activation', paidPeriods: 0 }) };
        const createdAt = stamp();

        // Se mira antes de crear ninguna cuenta: un nombre repetido no debe
        // dejar atrás una cuenta de propietario sin negocio.
        if (await ctx.db.get('tenants', id)) fail(409, 'CONFLICT', { id });

        // El negocio y su propietario entran en la misma escritura: si el
        // identificador ya existe, no queda una membresía huérfana.
        const owner = await addMember(ctx, id, { email: ownerEmail, name: body.ownerName, role: 'owner' }, {
            extraWrites: [ctx.db.write.create('tenants', id, {
                name,
                legalName: text(body.legalName, 120),
                sector: oneOf(body.sector, SECTORS, 'otro'),
                timezone,
                baseCurrency,
                status: 'active',
                subscription,
                onboarding: { status: 'none' },
                leadId: text(body.leadId, 80) || null,
                createdAt,
                createdBy: ctx.user.uid
            })]
        }).catch(error => {
            if (error?.code === 'CONFLICT') fail(409, 'CONFLICT', { id });
            throw error;
        });

        // Un prospecto que se convierte en cliente queda enlazado a su negocio.
        const leadId = text(body.leadId, 80);
        if (leadId) {
            await ctx.db.update('leads', leadId, { stage: 'won', tenantId: id, updatedAt: createdAt }).catch(() => {});
        }

        return { id, name, owner: { uid: owner.uid, email: owner.email, existed: owner.existed }, subscription };
    }),

    /**
     * La ficha de un negocio para VALTRIX: suscripción, períodos liquidados,
     * incorporación y a quién escribirle. Ni una cifra de su operación.
     */
    route('GET', '/admin/tenants/:tenantId', async ctx => {
        requireStaff(ctx);
        const tenantId = ctx.params.tenantId;
        const tenant = await ctx.db.get('tenants', tenantId);
        if (!tenant) fail(404, 'TENANT_NOT_FOUND');
        const [periods, log, owners] = await Promise.all([
            ctx.db.query(`tenants/${tenantId}/periods`, { limit: 600 }),
            ctx.db.query(`tenants/${tenantId}/subscriptionLog`, { limit: 200 }),
            ownersOf(ctx.db, tenantId)
        ]);
        const onboarding = tenant.onboarding || { status: 'none' };
        return {
            ...tenantRow(tenant),
            legalName: tenant.legalName || '',
            timezone: tenant.timezone || 'America/Costa_Rica',
            baseCurrency: tenant.baseCurrency || 'CRC',
            plan: catalog.PLAN,
            owners: owners.map(row => ({ uid: row.id, name: row.name || '', email: row.email })),
            periods: periods
                .sort((a, b) => b.number - a.number)
                .map(row => ({ number: row.number, amountMinor: row.amountMinor, currency: row.currency, method: row.method, reference: row.reference || '', paidOn: row.paidOn, coversUntil: row.coversUntil, settledAt: row.settledAt })),
            log: log
                .sort((a, b) => b.at.localeCompare(a.at))
                .slice(0, 30)
                .map(row => ({ from: row.from, to: row.to, paidPeriods: row.paidPeriods, reason: row.reason || '', at: row.at })),
            onboarding: {
                status: onboarding.status || 'none',
                sentAt: onboarding.sentAt || null,
                expiresAt: onboarding.expiresAt || null,
                savedAt: onboarding.savedAt || null,
                submittedAt: onboarding.submittedAt || null,
                appliedAt: onboarding.appliedAt || null,
                counts: onboarding.counts || null
            }
        };
    }),

    /**
     * Liquida un período de la suscripción: el pago de un mes, confirmado.
     *
     * Es el «clic» que abre el módulo siguiente. `period` es el número que
     * quien llama cree estar liquidando; si ya está liquidado —un doble clic,
     * dos pestañas, otra administradora—, responde PERIOD_ALREADY_SETTLED en
     * vez de liquidar el siguiente sin que nadie lo haya cobrado.
     *
     * Los módulos se abren por PERÍODOS, no por transferencias: un pago
     * partido en dos no adelanta nada, porque liquidar es una decisión de
     * quien confirma el dinero, no un contador de movimientos bancarios.
     */
    route('POST', '/admin/tenants/:tenantId/periods', async ctx => {
        requireStaff(ctx);
        const tenantId = ctx.params.tenantId;
        const tenant = await ctx.db.get('tenants', tenantId);
        if (!tenant) fail(404, 'TENANT_NOT_FOUND');
        const body = await readJson(ctx.request);
        const current = subscriptionOf(tenant);

        const number = integer(body.period, { min: 1, max: 600 });
        if (number === null) fail(400, 'INVALID_INPUT', { field: 'period' });
        if (number !== (current.paidPeriods || 0) + 1) fail(409, 'PERIOD_ALREADY_SETTLED', { paidPeriods: current.paidPeriods || 0 });
        if (current.state !== 'active' && !canTransition(current.state, 'active')) fail(409, 'INVALID_TRANSITION', { from: current.state, to: 'active' });

        const today = time.businessDay(new Date(), tenant.timezone || 'America/Costa_Rica');
        const paidOn = body.paidOn ? isoDate(body.paidOn) : today;
        if (!paidOn) fail(400, 'INVALID_INPUT', { field: 'paidOn' });
        const amountMinor = body.amountMinor === undefined ? catalog.PLAN.amountMinor : minorAmount(body.amountMinor);
        if (!Number.isInteger(amountMinor) || amountMinor <= 0) fail(400, 'INVALID_INPUT', { field: 'amountMinor' });
        const method = oneOf(body.method, [...catalog.PAYMENT_METHODS], 'transferencia');

        // El período nuevo empieza donde acaba el vigente; si ya había vencido,
        // empieza hoy. Pagar tarde no regala los días que no se pagaron.
        const startsOn = current.currentPeriodEnd && current.currentPeriodEnd > today ? current.currentPeriodEnd : today;
        const coversUntil = time.addMonths(startsOn, 1);
        const at = stamp();
        const subscription = {
            state: 'active',
            paidPeriods: number,
            currentPeriodEnd: coversUntil,
            entitlements: entitlementsFor({ state: 'active', paidPeriods: number }),
            updatedAt: at,
            updatedBy: ctx.user.uid
        };

        try {
            await ctx.db.commit([
                // El número del período es el identificador: dos liquidaciones
                // del mismo período no pueden entrar las dos.
                ctx.db.write.create(`tenants/${tenantId}/periods`, String(number), {
                    number, amountMinor, currency: catalog.PLAN.currency, method, reference: text(body.reference, 80),
                    paidOn, startsOn, coversUntil, settledAt: at, settledBy: ctx.user.uid
                }),
                ctx.db.write.update('tenants', tenantId, { subscription }, { updateTime: tenant._updateTime }),
                ctx.db.write.create(`tenants/${tenantId}/subscriptionLog`, `${Date.now()}-p${number}`, {
                    from: current.state, to: 'active', paidPeriods: number, reason: `Período ${number} liquidado`, at, by: ctx.user.uid
                })
            ]);
        } catch (error) {
            if (error instanceof FirestoreConflict) fail(409, 'PERIOD_ALREADY_SETTLED', { paidPeriods: current.paidPeriods || 0 });
            throw error;
        }

        const before = entitlementsOf(current);
        return {
            ok: true,
            subscription,
            // Lo que este pago acaba de abrir, para decirlo en pantalla.
            unlocked: catalog.MODULES.filter(module => subscription.entitlements[module] && !before[module])
        };
    }),

    /**
     * Mueve la suscripción a mano: suspender, reactivar, cancelar, o corregir
     * los períodos. Cada cambio de estado lleva su motivo y deja rastro.
     */
    route('POST', '/admin/tenants/:tenantId/subscription', async ctx => {
        requireStaff(ctx);
        const tenantId = ctx.params.tenantId;
        const tenant = await ctx.db.get('tenants', tenantId);
        if (!tenant) fail(404, 'TENANT_NOT_FOUND');

        const body = await readJson(ctx.request);
        const current = subscriptionOf(tenant);

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
    }),

    /**
     * Ejecuta ahora la pasada diaria: cierres pendientes, avisos de
     * mantenimiento y pagos vencidos. Es exactamente lo que hace el cron, y
     * repetirla no duplica nada. Solo desarrollo: sirve para comprobar que la
     * pasada funciona sin esperar a la madrugada.
     */
    route('POST', '/admin/jobs/run', async ctx => {
        requireRole(ctx, ['developer']);
        return { ok: true, summary: await runScheduled(ctx.env, { db: ctx.db }) };
    }),

    /** A quién escribirle en un negocio. Sirve para armar el enlace de incorporación. */
    route('GET', '/admin/tenants/:tenantId/owners', async ctx => {
        requireStaff(ctx);
        const tenant = await ctx.db.get('tenants', ctx.params.tenantId);
        if (!tenant) fail(404, 'TENANT_NOT_FOUND');
        const owners = await ctx.db.query(membersPath(ctx.params.tenantId), { where: [['role', '==', 'owner']], limit: 20 });
        return { owners: owners.map(row => ({ uid: row.id, name: row.name || '', email: row.email || '', status: row.status })) };
    })
];
