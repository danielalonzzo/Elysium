/**
 * El negocio con el que se trabaja: su ficha y su gente.
 *
 * Toda ruta de aquí pasa por `resolveTenant`, que comprueba la membresía antes
 * de leer un solo dato. El `tenantId` de la ruta es una petición de contexto,
 * no una autorización: quien pida un negocio ajeno recibe NOT_A_MEMBER, no sus
 * datos.
 */

import { route } from '../lib/route.js';
import {
    DEFAULT_CAPABILITIES, TENANT_ROLES, can, entitlementsFor, membersPath,
    requireCapability, resolveTenant, stamp
} from '../lib/context.js';
import { fail, oneOf, readJson, text } from '../lib/http.js';

function publicMember(row) {
    return {
        uid: row.id,
        name: row.name || '',
        email: row.email || '',
        role: row.role,
        status: row.status,
        capabilities: row.role === 'owner' ? ['*'] : (row.capabilities || DEFAULT_CAPABILITIES[row.role] || []),
        createdAt: row.createdAt || null
    };
}

export const tenantRoutes = [
    route('GET', '/tenants/:tenantId', async ctx => {
        const scope = await resolveTenant(ctx, ctx.params.tenantId);
        const { tenant } = scope;
        return {
            id: scope.id,
            name: tenant.name,
            legalName: tenant.legalName || '',
            timezone: tenant.timezone || 'America/Costa_Rica',
            baseCurrency: tenant.baseCurrency || 'CRC',
            status: tenant.status || 'active',
            role: scope.role,
            capabilities: scope.capabilities,
            subscription: {
                state: scope.subscription.state,
                paidPeriods: scope.subscription.paidPeriods || 0,
                currentPeriodEnd: scope.subscription.currentPeriodEnd || null
            },
            entitlements: { ...entitlementsFor(scope.subscription), ...(scope.subscription.entitlements || {}) }
        };
    }),

    route('GET', '/tenants/:tenantId/members', async ctx => {
        const scope = await resolveTenant(ctx, ctx.params.tenantId);
        // Ver con quién se comparte el negocio no necesita administrarlo.
        const rows = await ctx.db.query(membersPath(scope.id), { limit: 200 });
        return { members: rows.map(publicMember).sort((a, b) => a.name.localeCompare(b.name, 'es')) };
    }),

    /**
     * Cambia el rol o las capacidades de alguien del negocio.
     *
     * Dos límites que no dependen del permiso de quien llama: nadie se cambia
     * su propio rol —si no, un propietario podría degradarse por error y dejar
     * el negocio sin quien lo administre— y el último propietario activo no se
     * puede degradar ni suspender.
     */
    route('PATCH', '/tenants/:tenantId/members/:uid', async ctx => {
        const scope = await resolveTenant(ctx, ctx.params.tenantId);
        requireCapability(scope, 'members.manage');

        const targetUid = ctx.params.uid;
        if (targetUid === ctx.user.uid) fail(403, 'FORBIDDEN');

        const member = await ctx.db.get(membersPath(scope.id), targetUid);
        if (!member) fail(404, 'NOT_FOUND');

        const body = await readJson(ctx.request);
        const changes = { updatedAt: stamp(), updatedBy: ctx.user.uid };

        if ('role' in body) {
            const role = oneOf(body.role, [...TENANT_ROLES]);
            if (!role) fail(400, 'INVALID_INPUT');
            changes.role = role;
        }
        if ('status' in body) {
            const status = oneOf(body.status, ['active', 'suspended']);
            if (!status) fail(400, 'INVALID_INPUT');
            changes.status = status;
        }
        if ('capabilities' in body) {
            if (!Array.isArray(body.capabilities)) fail(400, 'INVALID_INPUT');
            changes.capabilities = [...new Set(body.capabilities.map(value => text(value, 40)).filter(Boolean))].slice(0, 40);
        }

        const losesOwnership = (changes.role && changes.role !== 'owner') || changes.status === 'suspended';
        if (member.role === 'owner' && losesOwnership) {
            const owners = await ctx.db.query(membersPath(scope.id), {
                where: [['role', '==', 'owner'], ['status', '==', 'active']], limit: 10
            });
            if (owners.filter(row => row.id !== targetUid).length === 0) fail(409, 'LAST_OWNER');
        }

        await ctx.db.update(membersPath(scope.id), targetUid, changes);
        return { ok: true, uid: targetUid, ...changes };
    }),

    /** Si puede administrar la gente, puede ver qué puede hacer cada quien. */
    route('GET', '/tenants/:tenantId/capabilities', async ctx => {
        const scope = await resolveTenant(ctx, ctx.params.tenantId);
        return {
            mine: scope.capabilities,
            canManageMembers: can(scope, 'members.manage'),
            roles: Object.fromEntries(TENANT_ROLES.map(role => [role, DEFAULT_CAPABILITIES[role] || []]))
        };
    })
];
