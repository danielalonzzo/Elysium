/**
 * Incorporación: el formulario que llena el dueño y su carga al sistema.
 *
 * Al activar la cuenta, VALTRIX le manda al dueño un enlace. El dueño lo abre
 * **sin iniciar sesión** —todavía no tiene acceso: se le entrega después, en
 * la videollamada— y llena sus productos, costos, deudores, equipo, procesos
 * y máquinas. VALTRIX revisa lo recibido y lo carga con una acción.
 *
 * Son dos grupos de rutas, y la frontera entre ellos es lo que importa:
 *
 *   · `/intake` — públicas. Lo único que las protege es el token, así que el
 *     token es largo y aleatorio, y **nunca va en una dirección**: el enlace
 *     lo lleva en el fragmento (`/incorporacion#…`), que el navegador no
 *     envía, y la página lo manda al API en la cabecera `x-intake-token`.
 *     Las direcciones quedan en los registros del Worker; las cabeceras, no.
 *     En la base **solo se guarda su huella**: quien la leyera no podría
 *     reconstruir el enlace. Un token inválido responde igual que uno
 *     vencido.
 *
 *   · `/admin/tenants/:id/intake…` — de VALTRIX. Crear el enlace, ver lo
 *     recibido, devolverlo para corregir y cargarlo.
 *
 * Sobre la regla de que VALTRIX no lee las finanzas de nadie: lo que el dueño
 * escribe aquí se lo está enviando a VALTRIX precisamente para que lo cargue,
 * y por eso la administración puede verlo **mientras está pendiente**. Al
 * cargarlo, el lote se sella: se borra lo que el dueño escribió y queda solo
 * el resumen de cuánto se creó. Desde ese momento los datos viven en el
 * negocio, y para verlos hace falta una membresía, como siempre.
 */

import { catalog, intake } from '../core.js';
import { requireStaff, stamp } from '../lib/context.js';
import { randomToken, sha256 } from '../lib/firebase.js';
import { fail, readJson } from '../lib/http.js';
import { addMember } from '../lib/members.js';
import { route } from '../lib/route.js';
import { systemEngine } from '../lib/store.js';

/** Días que vale un enlace. Suficiente para llenarlo con calma; no para olvidarlo abierto. */
const LINK_DAYS = 30;
const MAX_BYTES = 600000;

const importsPath = tenantId => `tenants/${tenantId}/imports`;

/** Las rutas públicas pasan por el limitador de Cloudflare cuando existe. */
async function throttle(ctx) {
    const limiter = ctx.env.INTAKE_LIMITER;
    if (!limiter || typeof limiter.limit !== 'function') return;
    const ip = ctx.request.headers.get('cf-connecting-ip') || 'anon';
    const { success } = await limiter.limit({ key: `intake:${ip}` });
    if (!success) fail(429, 'RATE_LIMITED');
}

/**
 * Del token del enlace al lote. Cualquier cosa que no cuadre —token
 * inventado, vencido, negocio borrado— responde lo mismo: no se le dice a
 * quien prueba tokens cuál de las tres le pasó.
 */
async function resolveToken(ctx) {
    await throttle(ctx);
    const token = String(ctx.request.headers.get('x-intake-token') || '');
    if (!/^[A-Za-z0-9_-]{24,80}$/.test(token)) fail(404, 'INTAKE_NOT_FOUND');
    const link = await ctx.db.get('intakeTokens', await sha256(token));
    if (!link || link.expiresAt < stamp()) fail(404, 'INTAKE_NOT_FOUND');
    const [tenant, batch] = await Promise.all([
        ctx.db.get('tenants', link.tenantId),
        ctx.db.get(importsPath(link.tenantId), link.batchId)
    ]);
    if (!tenant || !batch) fail(404, 'INTAKE_NOT_FOUND');
    return { link, tenant, batch };
}

const publicView = (tenant, batch) => ({
    business: tenant.name,
    status: batch.status,
    data: batch.status === 'applied' ? null : (batch.data || intake.emptyIntake()),
    savedAt: batch.savedAt || null,
    submittedAt: batch.submittedAt || null,
    // VALTRIX lo devolvió para corregir: la página se lo dice al dueño.
    reopened: batch.status === 'draft' && Boolean(batch.reopenedAt),
    limits: catalog.INTAKE_LIMITS
});

export const intakeRoutes = [
    /* ------------------------------------------------------------------ *
     * Públicas: quien tiene el enlace
     * ------------------------------------------------------------------ */

    route('GET', '/intake', async ctx => {
        const { tenant, batch } = await resolveToken(ctx);
        return publicView(tenant, batch);
    }),

    /** Guarda el borrador. Se llama sola mientras la persona escribe. */
    route('PUT', '/intake', async ctx => {
        const { link, tenant, batch } = await resolveToken(ctx);
        if (batch.status !== 'draft') fail(409, 'INTAKE_LOCKED');
        const body = await readJson(ctx.request, MAX_BYTES);
        const data = intake.sanitize(body.data);
        const savedAt = stamp();
        await ctx.db.commit([
            ctx.db.write.update(importsPath(link.tenantId), link.batchId, { data, savedAt }, { updateTime: batch._updateTime }),
            ctx.db.write.update('tenants', link.tenantId, { onboarding: { ...(tenant.onboarding || {}), savedAt } }, { updateTime: tenant._updateTime })
        ]);
        return { ok: true, savedAt };
    }),

    /**
     * Envía el formulario. Desde aquí la persona ya no lo cambia: si hay que
     * corregir algo, VALTRIX se lo devuelve.
     */
    route('POST', '/intake/submit', async ctx => {
        const { link, tenant, batch } = await resolveToken(ctx);
        if (batch.status !== 'draft') fail(409, 'INTAKE_LOCKED');
        const body = await readJson(ctx.request, MAX_BYTES);
        const data = body.data ? intake.sanitize(body.data) : batch.data;
        const { counts } = intake.normalize(data);
        if (!counts.products) fail(400, 'INTAKE_EMPTY');
        const submittedAt = stamp();
        await ctx.db.commit([
            ctx.db.write.update(importsPath(link.tenantId), link.batchId, { data, status: 'submitted', savedAt: submittedAt, submittedAt, counts }, { updateTime: batch._updateTime }),
            ctx.db.write.update('tenants', link.tenantId, { onboarding: { ...(tenant.onboarding || {}), status: 'submitted', savedAt: submittedAt, submittedAt, counts } }, { updateTime: tenant._updateTime })
        ]);
        return { ok: true, status: 'submitted', counts };
    }),

    /* ------------------------------------------------------------------ *
     * Administración de VALTRIX
     * ------------------------------------------------------------------ */

    /**
     * Crea el enlace del formulario (o lo renueva).
     *
     * El token se devuelve UNA vez, en esta respuesta, y no se vuelve a poder
     * leer: en la base queda su huella. Renovarlo invalida el anterior y
     * conserva lo que el dueño llevara escrito.
     */
    route('POST', '/admin/tenants/:tenantId/intake', async ctx => {
        requireStaff(ctx);
        const tenantId = ctx.params.tenantId;
        const tenant = await ctx.db.get('tenants', tenantId);
        if (!tenant) fail(404, 'TENANT_NOT_FOUND');
        const onboarding = tenant.onboarding || { status: 'none' };
        if (onboarding.status === 'applied') fail(409, 'INTAKE_ALREADY_APPLIED');

        const token = randomToken(30);
        const hash = await sha256(token);
        const now = stamp();
        const expiresAt = new Date(Date.now() + LINK_DAYS * 86400000).toISOString();
        const batchId = onboarding.batchId || `b${Date.now().toString(36)}`;

        const writes = [
            ctx.db.write.create('intakeTokens', hash, { tenantId, batchId, createdAt: now, expiresAt, createdBy: ctx.user.uid }),
            ctx.db.write.update('tenants', tenantId, {
                onboarding: { ...onboarding, status: onboarding.batchId ? onboarding.status : 'draft', batchId, tokenHash: hash, sentAt: now, expiresAt }
            }, { updateTime: tenant._updateTime })
        ];
        if (!onboarding.batchId) {
            writes.push(ctx.db.write.create(importsPath(tenantId), batchId, { status: 'draft', data: intake.emptyIntake(), createdAt: now, createdBy: ctx.user.uid }));
        }
        if (onboarding.tokenHash) writes.push(ctx.db.write.remove('intakeTokens', onboarding.tokenHash));
        await ctx.db.commit(writes);

        return { ok: true, token, path: `/incorporacion#${token}`, expiresAt, status: onboarding.batchId ? onboarding.status : 'draft' };
    }),

    /** Lo que el dueño ha escrito, ya leído por el sistema: qué se cargaría y qué no se entendió. */
    route('GET', '/admin/tenants/:tenantId/intake', async ctx => {
        requireStaff(ctx);
        const tenantId = ctx.params.tenantId;
        const tenant = await ctx.db.get('tenants', tenantId);
        if (!tenant) fail(404, 'TENANT_NOT_FOUND');
        const onboarding = tenant.onboarding || { status: 'none' };
        if (!onboarding.batchId) return { status: 'none' };
        const batch = await ctx.db.get(importsPath(tenantId), onboarding.batchId);
        if (!batch) return { status: 'none' };
        // Un lote ya cargado está sellado: solo queda su resumen.
        if (batch.status === 'applied') {
            return { status: 'applied', appliedAt: batch.appliedAt, result: batch.result || null };
        }
        const { data, issues, counts } = intake.normalize(batch.data);
        return { status: batch.status, savedAt: batch.savedAt || null, submittedAt: batch.submittedAt || null, expiresAt: onboarding.expiresAt || null, data, issues, counts };
    }),

    /** Devuelve el formulario al dueño para que corrija. El mismo enlace vuelve a dejarle escribir. */
    route('POST', '/admin/tenants/:tenantId/intake/reopen', async ctx => {
        requireStaff(ctx);
        const tenantId = ctx.params.tenantId;
        const tenant = await ctx.db.get('tenants', tenantId);
        if (!tenant) fail(404, 'TENANT_NOT_FOUND');
        const onboarding = tenant.onboarding || {};
        const batch = onboarding.batchId ? await ctx.db.get(importsPath(tenantId), onboarding.batchId) : null;
        if (!batch || batch.status !== 'submitted') fail(409, 'INTAKE_NOT_SUBMITTED');
        await ctx.db.commit([
            ctx.db.write.update(importsPath(tenantId), batch.id, { status: 'draft', reopenedAt: stamp() }, { updateTime: batch._updateTime }),
            ctx.db.write.update('tenants', tenantId, { onboarding: { ...onboarding, status: 'draft' } }, { updateTime: tenant._updateTime })
        ]);
        return { ok: true, status: 'draft' };
    }),

    /**
     * Carga el formulario al sistema: productos con su existencia, clientes
     * con lo que debían, listas de tareas, equipos, y el acceso de las
     * personas que traían correo.
     *
     * Repetirla no duplica nada: el motor escribe cada documento con un
     * identificador que sale del lote. Por eso un lote que se quedó a medias
     * (`applying`) se puede volver a cargar sin miedo.
     */
    route('POST', '/admin/tenants/:tenantId/intake/apply', async ctx => {
        requireStaff(ctx);
        const tenantId = ctx.params.tenantId;
        const tenant = await ctx.db.get('tenants', tenantId);
        if (!tenant) fail(404, 'TENANT_NOT_FOUND');
        const onboarding = tenant.onboarding || {};
        const batch = onboarding.batchId ? await ctx.db.get(importsPath(tenantId), onboarding.batchId) : null;
        if (!batch) fail(409, 'INTAKE_NOT_SUBMITTED');
        if (batch.status === 'applied') fail(409, 'INTAKE_ALREADY_APPLIED');
        if (batch.status !== 'submitted' && batch.status !== 'applying') fail(409, 'INTAKE_NOT_SUBMITTED');

        // Se marca antes de empezar, con precondición: dos administradoras
        // que pulsan a la vez no cargan las dos.
        if (batch.status === 'submitted') {
            await ctx.db.update(importsPath(tenantId), batch.id, { status: 'applying', applyingAt: stamp() }, batch._updateTime);
        }

        const { data } = intake.normalize(batch.data);
        const engine = systemEngine(ctx.db, { id: tenantId, ...tenant }, { uid: ctx.user.uid, name: 'VALTRIX' });
        const result = await intake.apply(engine, data, { batchId: batch.id });

        // El acceso de la gente: quien traía correo y un papel. A quien ya
        // pertenecía al negocio (el propietario, o una segunda pasada) se le
        // deja como estaba.
        const invited = [];
        for (const person of result.team) {
            if (!person.email || person.access === 'none') continue;
            try {
                const member = await addMember(ctx, tenantId, { email: person.email, name: person.name, role: person.access, position: person.position });
                invited.push({ name: member.name, email: member.email, role: member.role, existed: member.existed });
            } catch (error) {
                if (error?.code !== 'ALREADY_MEMBER') throw error;
            }
        }

        const appliedAt = stamp();
        const summary = { created: result.created, totals: result.totals, skipped: result.skipped, invited, pendingAccess: result.team.filter(person => !person.email || person.access === 'none').length };
        const writes = [
            // Sellado: lo que el dueño escribió se borra; queda cuánto se creó.
            ctx.db.write.update(importsPath(tenantId), batch.id, { status: 'applied', data: null, result: summary, appliedAt, appliedBy: ctx.user.uid }),
            ctx.db.write.update('tenants', tenantId, {
                sector: data.business.sector !== 'otro' ? data.business.sector : (tenant.sector || 'otro'),
                onboarding: { status: 'applied', batchId: batch.id, sentAt: onboarding.sentAt || null, submittedAt: batch.submittedAt || null, appliedAt, counts: result.created }
            })
        ];
        if (onboarding.tokenHash) writes.push(ctx.db.write.remove('intakeTokens', onboarding.tokenHash));
        await ctx.db.commit(writes);

        return { ok: true, status: 'applied', ...summary };
    })
];
