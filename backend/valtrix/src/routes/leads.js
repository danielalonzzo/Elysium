/**
 * Prospectos: la captación de VALTRIX.
 *
 * El primer paso del servicio no ocurre dentro de ningún negocio: es Valeria
 * contactando al dueño de un negocio conocido, enseñándole la demo y
 * esperando su primer pago. Esto es su libreta: a quién contactó, en qué
 * quedaron y qué toca hacer después.
 *
 * Un prospecto NO es un negocio ni tiene datos de ninguno. Cuando paga, se da
 * de alta el negocio (`POST /admin/tenants` con su `leadId`) y el prospecto
 * queda marcado como cliente y enlazado a él.
 *
 * Vive en la raíz (`leads/{id}`), fuera de `tenants/`, porque es de VALTRIX.
 */

import { catalog } from '../core.js';
import { requireStaff, stamp } from '../lib/context.js';
import { email as parseEmail, fail, isoDate, longText, oneOf, phone, readJson, text } from '../lib/http.js';
import { route } from '../lib/route.js';

const STAGES = [...catalog.LEAD_STAGES];
const SECTORS = Object.keys(catalog.SECTORS);
const SOURCES = Object.keys(catalog.LEAD_SOURCES);
const MAX_NOTES = 60;

function leadView(row) {
    return {
        id: row.id,
        business: row.business,
        contactName: row.contactName || '',
        phone: row.phone || '',
        email: row.email || '',
        sector: row.sector || 'otro',
        source: row.source || 'otro',
        stage: row.stage,
        nextActionOn: row.nextActionOn || null,
        nextAction: row.nextAction || '',
        notes: row.notes || [],
        tenantId: row.tenantId || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
    };
}

function leadInput(body, current = null) {
    const pick = (key, read, fallback) => (key in body ? read(body[key]) : (current ? current[key] ?? fallback : fallback));
    const business = 'business' in body || !current ? text(body.business, 100) : current.business;
    if (!business) fail(400, 'INVALID_INPUT', { field: 'business' });
    let nextActionOn = current?.nextActionOn || null;
    if ('nextActionOn' in body) {
        nextActionOn = body.nextActionOn ? isoDate(body.nextActionOn) : null;
        if (body.nextActionOn && !nextActionOn) fail(400, 'INVALID_INPUT', { field: 'nextActionOn' });
    }
    return {
        business,
        contactName: pick('contactName', value => text(value, 80), ''),
        phone: pick('phone', phone, ''),
        email: pick('email', parseEmail, ''),
        sector: pick('sector', value => oneOf(value, SECTORS, 'otro'), 'otro'),
        source: pick('source', value => oneOf(value, SOURCES, 'otro'), 'otro'),
        stage: pick('stage', value => oneOf(value, STAGES) || fail(400, 'INVALID_INPUT', { field: 'stage' }), 'new'),
        nextAction: pick('nextAction', value => text(value, 160), ''),
        nextActionOn
    };
}

export const leadRoutes = [
    route('GET', '/admin/leads', async ctx => {
        requireStaff(ctx);
        const rows = await ctx.db.query('leads', { limit: 2000 });
        return {
            // Arriba, lo que tiene una acción más próxima; lo cerrado, al final.
            leads: rows.map(leadView).sort((a, b) => {
                const closed = row => (row.stage === 'won' || row.stage === 'lost' ? 1 : 0);
                return closed(a) - closed(b)
                    || (a.nextActionOn || '9999').localeCompare(b.nextActionOn || '9999')
                    || b.updatedAt.localeCompare(a.updatedAt);
            })
        };
    }),

    route('POST', '/admin/leads', async ctx => {
        requireStaff(ctx);
        const body = await readJson(ctx.request);
        const now = stamp();
        const id = crypto.randomUUID();
        const note = longText(body.note, 600);
        const lead = {
            ...leadInput(body),
            notes: note ? [{ at: now, byName: ctx.user.name, text: note }] : [],
            tenantId: null,
            createdAt: now,
            updatedAt: now,
            createdBy: ctx.user.uid
        };
        await ctx.db.create('leads', id, lead);
        return { lead: leadView({ id, ...lead }) };
    }),

    /**
     * Cambia la ficha, la etapa o la próxima acción, y opcionalmente añade una
     * nota. Las notas no se editan ni se borran: son el historial de la
     * conversación con ese negocio.
     */
    route('PATCH', '/admin/leads/:id', async ctx => {
        requireStaff(ctx);
        const current = await ctx.db.get('leads', ctx.params.id);
        if (!current) fail(404, 'NOT_FOUND');
        const body = await readJson(ctx.request);
        const now = stamp();
        const changes = { ...leadInput(body, current), updatedAt: now };
        const note = longText(body.note, 600);
        if (note) changes.notes = [...(current.notes || []), { at: now, byName: ctx.user.name, text: note }].slice(-MAX_NOTES);
        await ctx.db.update('leads', current.id, changes, current._updateTime);
        return { lead: leadView({ ...current, ...changes }) };
    })
];
