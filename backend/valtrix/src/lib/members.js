/**
 * Dar acceso a una persona en un negocio.
 *
 * Lo usan tres sitios —el alta del negocio, la invitación que hace su
 * propietario y la carga de la incorporación— y los tres tienen que hacer lo
 * mismo: que exista la cuenta, que exista la membresía y que el papel global
 * de la cuenta no se rompa por el camino.
 *
 * Dos cosas que no son evidentes:
 *
 *   · **La cuenta se crea sin contraseña.** La persona la define ella misma
 *     desde la pantalla de acceso («¿Olvidó su contraseña?»), que además le
 *     confirma el correo. Nadie más llega a conocerla.
 *
 *   · **El papel global solo se pone si faltaba.** Una administradora de
 *     VALTRIX puede ser además propietaria de un negocio —el de demostración,
 *     por ejemplo—, y darle esa membresía no debe quitarle la administración.
 */

import { catalog, validate } from '../core.js';
import { ROLES, forgetAccount, membersPath, stamp } from './context.js';
import { FirestoreConflict } from './firebase.js';
import { fail } from './http.js';

export async function addMember(ctx, tenantId, { email, name = '', role, position = '' }, { extraWrites = [] } = {}) {
    const address = validate.email(email);
    if (!address) fail(400, 'INVALID_INPUT', { field: 'email' });
    if (!catalog.TENANT_ROLES.includes(role)) fail(400, 'INVALID_INPUT', { field: 'role' });

    let account = await ctx.auth.getUserByEmail(address).catch(() => null);
    const existed = Boolean(account);
    if (!account) {
        const uid = await ctx.auth.createUser({
            email: address,
            displayName: validate.text(name, 80) || address.split('@')[0],
            emailVerified: false
        });
        account = await ctx.auth.getUser(uid);
    }

    const member = {
        // El uid se repite dentro del documento además de ser su nombre: la
        // consulta de grupo de colecciones filtra por campo, no por identificador.
        uid: account.uid,
        email: address,
        name: validate.text(name, 80) || account.displayName || address.split('@')[0],
        position: validate.text(position, 80),
        role,
        capabilities: [],
        status: 'active',
        createdAt: stamp(),
        createdBy: ctx.user?.uid || 'system'
    };
    try {
        await ctx.db.commit([ctx.db.write.create(membersPath(tenantId), account.uid, member), ...extraWrites]);
    } catch (error) {
        if (error instanceof FirestoreConflict) fail(409, extraWrites.length ? 'CONFLICT' : 'ALREADY_MEMBER');
        throw error;
    }

    if (!ROLES.includes(account.claims.role)) await ctx.auth.setClaims(account.uid, { role: 'business' });
    forgetAccount(account.uid);
    return { uid: account.uid, email: address, name: member.name, position: member.position, role, existed };
}

/** Los propietarios activos de un negocio: a quienes se les escribe. */
export async function ownersOf(db, tenantId) {
    const rows = await db.query(membersPath(tenantId), { where: [['role', '==', 'owner']], limit: 20 });
    return rows.filter(row => row.status === 'active' && row.email);
}
