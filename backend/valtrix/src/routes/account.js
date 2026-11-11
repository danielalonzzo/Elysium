/**
 * La cuenta de quien llama: quién es, a qué negocios pertenece y su perfil.
 *
 * `GET /me` es lo primero que pide el portal al arrancar, y de su respuesta
 * salen el menú, el negocio activo y los módulos visibles. Aun así el portal
 * no decide nada con ella: cada ruta vuelve a comprobarlo.
 */

import { route } from '../lib/route.js';
import { activeMemberships, entitlementsFor, requireUser, stamp } from '../lib/context.js';
import { fail, phone, readJson, text } from '../lib/http.js';

/** Lo que el portal necesita saber de un negocio para enseñarlo en el selector. */
function tenantSummary(tenant, membership) {
    const subscription = tenant.subscription || { state: 'pending_activation', paidPeriods: 0 };
    return {
        id: tenant.id,
        name: tenant.name,
        timezone: tenant.timezone || 'America/Costa_Rica',
        baseCurrency: tenant.baseCurrency || 'CRC',
        role: membership.role,
        subscription: {
            state: subscription.state,
            paidPeriods: subscription.paidPeriods || 0,
            currentPeriodEnd: subscription.currentPeriodEnd || null
        },
        // Se recalcula en vez de servir el campo guardado: si alguna vez
        // divergen, manda la regla, no la copia.
        entitlements: { ...entitlementsFor(subscription), ...(subscription.entitlements || {}) }
    };
}

export const accountRoutes = [
    route('GET', '/me', async ctx => {
        const user = requireUser(ctx);
        const memberships = await activeMemberships(ctx, user.uid);
        const tenants = await ctx.db.getMany('tenants', memberships.map(row => row.tenantId));
        return {
            uid: user.uid,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.profile.phone || '',
            tenants: memberships
                .map(membership => {
                    const tenant = tenants.get(membership.tenantId);
                    return tenant ? tenantSummary(tenant, membership) : null;
                })
                .filter(Boolean)
                .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        };
    }),

    route('PATCH', '/me', async ctx => {
        const user = requireUser(ctx);
        const body = await readJson(ctx.request);
        const changes = { updatedAt: stamp() };
        if ('name' in body) {
            const name = text(body.name, 80);
            if (!name) fail(400, 'INVALID_INPUT');
            changes.name = name;
        }
        if ('phone' in body) changes.phone = phone(body.phone);
        // El correo y el papel no se cambian por aquí: el correo arrastra la
        // verificación y la identidad, y el papel es del claim.
        await ctx.db.update('users', user.uid, changes);
        return { ok: true, ...changes };
    })
];
