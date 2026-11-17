/**
 * Administración de VALTRIX: el CRM del proveedor.
 *
 * Lo que Valeria necesita para llevar el servicio de punta a punta:
 *
 *   · **Prospectos** — a quién contactó, en qué quedaron y qué toca después.
 *   · **Negocios** — darlos de alta, liquidar cada período (el clic que abre
 *     el módulo siguiente) y seguir su incorporación.
 *   · **Tablero** — cuántos pagan, cuánto entra al mes y qué espera.
 *
 * Desde aquí NO se leen los datos de ningún negocio: ni ventas, ni clientes,
 * ni existencias. Lo único de un negocio que se ve es lo que su dueño le
 * envió a VALTRIX en el formulario de incorporación, y solo hasta que se
 * carga. No es una omisión de la pantalla: el API no lo entrega.
 */

import {
    INTAKE_STATUS_LABEL, LEAD_SOURCES, LEAD_STAGES, LEAD_STAGE_LABEL, MODULES, MODULE_LABEL, PAYMENT_METHODS, PAYMENT_METHOD_LABEL,
    PRODUCT_KIND_LABEL, SECTORS, SUBSCRIPTION_LABEL
} from '../../core/catalog.js';
import { businessDay, relativeDays } from '../../core/time.js';
import { get, patch, post } from '../api.js';
import { moduleHint } from '../nav.js';
import { badge, btn, clear, confirmDialog, day, dialog, facts, formDialog, h, kpis, moment, money, notice, pageHead, panel, qty, table, tabs, toast } from '../ui.js';

export const views = { tablero, prospectos, negocios };

const sectorOptions = Object.entries(SECTORS).map(([value, label]) => ({ value, label }));
const sourceOptions = Object.entries(LEAD_SOURCES).map(([value, label]) => ({ value, label }));
const SUBSCRIPTION_TONE = { active: 'good', past_due: 'warn', suspended: 'bad', pending_activation: 'info', cancel_at_period_end: 'warn', canceled: '' };
const INTAKE_TONE = { none: '', draft: 'info', submitted: 'warn', applied: 'good' };
const STAGE_TONE = { new: '', contacted: 'info', demo: 'info', interested: 'warn', won: 'good', lost: '' };

/* ================================================================== *
 * Tablero
 * ================================================================== */

async function tablero(ctx) {
    const overview = await get('/admin/overview');
    const { tenants, renewals, onboarding, leads, plan } = overview;
    const waiting = onboarding.filter(row => row.status === 'submitted');
    const overdue = renewals.filter(row => row.overdue).length;
    const open = LEAD_STAGES.filter(stage => stage !== 'won' && stage !== 'lost').reduce((sum, stage) => sum + leads[stage], 0);

    return h('div', { class: 'stack' },
        pageHead({ eyebrow: 'Administración de VALTRIX', title: 'Tablero', lead: 'Cuántos negocios pagan, cuánto entra cada mes y qué está esperando.' }),
        kpis([
            { label: 'Negocios que pagan', value: String(tenants.billable), hint: `${tenants.total} dados de alta` },
            { label: 'Ingreso mensual', value: money(tenants.mrrMinor, tenants.currency), hint: `${plan.label} por negocio` },
            { label: 'Períodos por liquidar', value: String(renewals.length), tone: overdue ? 'bad' : (renewals.length ? 'warn' : ''), hint: overdue ? `${overdue} ya ${overdue === 1 ? 'vencido' : 'vencidos'}` : 'En los próximos 7 días' },
            { label: 'Formularios por cargar', value: String(waiting.length), tone: waiting.length ? 'warn' : '', hint: 'Incorporaciones recibidas' },
            { label: 'Prospectos abiertos', value: String(open), hint: `${leads.won} ya son clientes` }
        ]),
        h('div', { class: 'columns' },
            panel({ title: 'Por liquidar', hint: 'Negocios cuyo período pagado termina pronto o ya terminó.' },
                renewals.length ? h('ul', { class: 'rows' }, renewals.map(row => h('li', {},
                    h('span', {}, h('a', { href: ctx.href('negocios', row.id), text: row.name }), h('span', { class: 'sub', text: `Pagado hasta el ${day(row.currentPeriodEnd, { short: true })}` })),
                    h('span', { class: 'figure' }, row.overdue ? badge(`Venció ${relativeDays(overview.today, row.currentPeriodEnd)}`, 'bad') : badge(`Vence ${relativeDays(overview.today, row.currentPeriodEnd)}`, 'warn')))))
                    : h('p', { class: 'empty', text: 'Nadie vence esta semana.' })),
            panel({ title: 'Incorporaciones', hint: 'Negocios con el formulario en camino o recibido.' },
                onboarding.length ? h('ul', { class: 'rows' }, onboarding.map(row => h('li', {},
                    // Uno devuelto para corregir conserva la fecha del envío anterior: no se enseña.
                    h('span', {}, h('a', { href: ctx.href('negocios', row.id), text: row.name }), row.status === 'submitted' && row.submittedAt ? h('span', { class: 'sub', text: `Recibido el ${moment(row.submittedAt)}` }) : null),
                    h('span', { class: 'figure' }, badge(INTAKE_STATUS_LABEL[row.status], INTAKE_TONE[row.status])))))
                    : h('p', { class: 'empty', text: 'Ninguna incorporación en curso.' }))),
        panel({ title: 'Prospectos', actions: btn('Ver prospectos', { small: true, kind: 'quiet', href: ctx.href('prospectos') }) },
            h('ul', { class: 'pipeline' }, LEAD_STAGES.map(stage => h('li', {}, h('span', { text: LEAD_STAGE_LABEL[stage] }), h('strong', { text: String(leads[stage]) }))))),
        panel({ title: 'Negocios por estado', actions: btn('Ver negocios', { small: true, kind: 'quiet', href: ctx.href('negocios') }) },
            h('ul', { class: 'pipeline' }, Object.entries(tenants.byState).map(([state, count]) => h('li', {}, h('span', { text: SUBSCRIPTION_LABEL[state] }), h('strong', { text: String(count) }))))));
}

/* ================================================================== *
 * Prospectos
 * ================================================================== */

function leadForm(row = null) {
    const today = businessDay();
    return formDialog({
        title: row ? `Editar ${row.business}` : 'Nuevo prospecto',
        lead: row ? '' : 'Un negocio que ya vende y tiene desorden administrativo. Todavía no es cliente.',
        fields: [
            { name: 'business', label: 'Negocio', required: true, maxlength: 100, value: row?.business, wide: true },
            { name: 'contactName', label: 'Con quién se habla', maxlength: 80, value: row?.contactName },
            { name: 'phone', label: 'Teléfono', type: 'tel', maxlength: 40, value: row?.phone },
            { name: 'email', label: 'Correo', type: 'email', maxlength: 254, value: row?.email },
            { name: 'sector', label: 'Giro', type: 'select', value: row?.sector || 'taller', options: sectorOptions },
            { name: 'source', label: 'Cómo llegó', type: 'select', value: row?.source || 'conocido', options: sourceOptions },
            { name: 'stage', label: 'Etapa', type: 'select', value: row?.stage || 'new', options: LEAD_STAGES.map(value => ({ value, label: LEAD_STAGE_LABEL[value] })) },
            { name: 'nextAction', label: 'Qué toca hacer', maxlength: 160, value: row?.nextAction, placeholder: 'Llamar para enseñarle la demo' },
            { name: 'nextActionOn', label: 'Cuándo', type: 'date', min: today, value: row?.nextActionOn || '' },
            { name: 'note', label: row ? 'Agregar una nota' : 'Nota', type: 'textarea', maxlength: 600, wide: true, hint: 'En qué quedaron. Las notas se acumulan: son el historial de la conversación.' }
        ],
        onSubmit: values => (row ? patch(`/admin/leads/${encodeURIComponent(row.id)}`, values) : post('/admin/leads', values))
    });
}

async function prospectos(ctx) {
    const { leads } = await get('/admin/leads');
    const today = businessDay();
    const showAll = ctx.query.get('ver') === 'todos';
    const closed = row => row.stage === 'won' || row.stage === 'lost';
    const rows = leads.filter(row => showAll || !closed(row));

    const edit = async row => {
        const saved = await leadForm(row);
        if (saved) { toast(row ? 'Prospecto actualizado.' : 'Prospecto agregado.'); ctx.reload(); }
    };
    const notes = row => dialog({ title: row.business, lead: [row.contactName, row.phone, row.email].filter(Boolean).join(' · ') },
        row.notes.length
            ? h('ul', { class: 'notes' }, [...row.notes].reverse().map(note => h('li', {}, h('time', { text: `${moment(note.at)} · ${note.byName}` }), note.text)))
            : h('p', { class: 'empty', text: 'Todavía no hay notas.' }));

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: 'Administración de VALTRIX',
            title: 'Prospectos',
            lead: 'A quién contactó, en qué quedaron y qué toca después. Arriba, lo que tiene la acción más próxima.',
            actions: [
                tabs([{ id: 'abiertos', label: 'Abiertos' }, { id: 'todos', label: 'Todos' }], showAll ? 'todos' : 'abiertos',
                    next => ctx.go('prospectos', null, next === 'todos' ? { ver: 'todos' } : null), 'Qué prospectos ver'),
                btn('Nuevo prospecto', { kind: 'primary', onClick: () => edit(null) })
            ]
        }),
        panel({},
            table({
                label: 'Prospectos',
                emptyText: showAll ? 'Todavía no hay prospectos.' : 'No hay prospectos abiertos. Agregue el próximo negocio que va a contactar.',
                rows,
                columns: [
                    { label: 'Negocio', render: row => [row.business, h('span', { class: 'sub', text: [row.contactName, row.phone].filter(Boolean).join(' · ') || SECTORS[row.sector] })] },
                    { label: 'Giro', render: row => SECTORS[row.sector] || '—' },
                    { label: 'Etapa', render: row => badge(LEAD_STAGE_LABEL[row.stage], STAGE_TONE[row.stage]) },
                    {
                        label: 'Qué toca', render: row => (row.nextAction || row.nextActionOn ? [
                            row.nextAction || 'Seguimiento',
                            row.nextActionOn ? h('span', { class: 'sub' }, `${day(row.nextActionOn, { short: true })} `, !closed(row) && row.nextActionOn < today ? badge('Atrasado', 'bad') : null) : null
                        ] : '—')
                    },
                    {
                        label: '', tight: true, render: row => h('div', { class: 'row-actions' },
                            btn(`Notas (${row.notes.length})`, { small: true, onClick: () => notes(row) }),
                            btn('Editar', { small: true, onClick: () => edit(row) }),
                            row.tenantId
                                ? btn('Ver negocio', { small: true, href: ctx.href('negocios', row.tenantId) })
                                : (closed(row) ? null : btn('Dar de alta', { small: true, kind: 'primary', href: ctx.href('negocios', null, { prospecto: row.id }) })))
                    }
                ]
            })));
}

/* ================================================================== *
 * Negocios
 * ================================================================== */

function negocios(ctx) {
    return ctx.param ? tenantFile(ctx) : tenantList(ctx);
}

async function tenantList(ctx) {
    const leadId = ctx.query.get('prospecto');
    const [{ tenants }, leads] = await Promise.all([get('/admin/tenants'), leadId ? get('/admin/leads') : null]);
    const lead = leads?.leads.find(row => row.id === leadId) || null;

    const create = async (from = null) => {
        const created = await formDialog({
            title: 'Dar de alta un negocio',
            lead: 'Nace sin módulos abiertos: se abren al liquidar el primer período. La cuenta del propietario se crea aquí si no existía.',
            submitLabel: 'Dar de alta',
            fields: [
                { name: 'name', label: 'Nombre del negocio', required: true, maxlength: 80, value: from?.business, wide: true, placeholder: 'Taller Horizonte' },
                { name: 'ownerName', label: 'Nombre del propietario', maxlength: 80, value: from?.contactName },
                { name: 'ownerEmail', label: 'Correo del propietario', type: 'email', required: true, maxlength: 254, value: from?.email },
                { name: 'sector', label: 'Giro', type: 'select', value: from?.sector || 'taller', options: sectorOptions }
            ],
            onSubmit: async values => {
                try {
                    return await post('/admin/tenants', { ...values, ...(from ? { leadId: from.id } : {}) });
                } catch (error) {
                    if (error.code === 'CONFLICT') error.message = 'Ya existe un negocio con ese nombre.';
                    throw error;
                }
            }
        });
        if (!created) return;
        toast(`«${created.name}» dado de alta.`);
        ctx.go('negocios', created.id);
    };
    // Llegando desde un prospecto, el alta se abre ya rellenada con sus datos.
    if (lead && !lead.tenantId) queueMicrotask(() => create(lead));

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: 'Administración de VALTRIX',
            title: 'Negocios',
            lead: 'Altas, suscripciones e incorporación. Desde aquí no se leen los datos de ningún negocio: para eso hace falta una membresía en él.',
            actions: btn('Dar de alta un negocio', { kind: 'primary', onClick: () => create(null) })
        }),
        panel({},
            table({
                label: 'Negocios suscriptores',
                emptyText: 'Todavía no hay negocios dados de alta.',
                rows: tenants,
                onRow: row => ctx.go('negocios', row.id),
                columns: [
                    { label: 'Negocio', render: row => [h('a', { href: ctx.href('negocios', row.id), text: row.name }), h('span', { class: 'sub', text: SECTORS[row.sector] || row.id })] },
                    { label: 'Suscripción', render: row => badge(SUBSCRIPTION_LABEL[row.subscription.state], SUBSCRIPTION_TONE[row.subscription.state]) },
                    { label: 'Períodos', num: true, render: row => String(row.subscription.paidPeriods) },
                    { label: 'Pagado hasta', render: row => (row.subscription.currentPeriodEnd ? day(row.subscription.currentPeriodEnd, { short: true }) : '—') },
                    { label: 'Incorporación', render: row => badge(INTAKE_STATUS_LABEL[row.onboarding.status], INTAKE_TONE[row.onboarding.status]) }
                ]
            })));
}

/* ---------- La ficha de un negocio ---------- */

async function tenantFile(ctx) {
    const id = ctx.param;
    const path = `/admin/tenants/${encodeURIComponent(id)}`;
    const [tenant, intake] = await Promise.all([get(path), get(`${path}/intake`)]);
    const { subscription, plan } = tenant;
    const next = subscription.paidPeriods + 1;
    const today = businessDay();
    const canSettle = !['canceled'].includes(subscription.state);

    const settle = async () => {
        const opens = MODULES.filter(module => !tenant.entitlements[module]).find(module => moduleHint(module, next) === 'Disponible');
        const result = await formDialog({
            title: `Liquidar el período ${next}`,
            lead: `Confirma que ${tenant.name} pagó su mes ${next}.${opens ? ` Al liquidarlo se abre «${MODULE_LABEL[opens]}».` : ''}`,
            submitLabel: 'Liquidar',
            fields: [
                { name: 'amountMinor', label: `Importe (${plan.currency})`, type: 'money', required: true, value: plan.amountMinor },
                { name: 'paidOn', label: 'Pagó el', type: 'date', required: true, value: today, max: today },
                { name: 'method', label: 'Cómo pagó', type: 'select', value: 'sinpe', options: PAYMENT_METHODS.map(value => ({ value, label: PAYMENT_METHOD_LABEL[value] })) },
                { name: 'reference', label: 'Referencia', maxlength: 80 }
            ],
            // El número del período viaja con la orden: un doble clic no liquida dos meses.
            onSubmit: values => post(`${path}/periods`, { period: next, ...values })
        });
        if (!result) return;
        toast(result.unlocked.length ? `Período ${next} liquidado. Se abrió: ${result.unlocked.map(module => MODULE_LABEL[module]).join(', ')}.` : `Período ${next} liquidado.`);
        ctx.reload();
    };

    const move = async (state, { title, message, confirmLabel, danger = false }) => {
        const answer = await confirmDialog({ title, message, confirmLabel, danger, askReason: true });
        if (!answer) return;
        try {
            await post(`${path}/subscription`, { state, reason: answer.reason });
            toast(`Suscripción: ${SUBSCRIPTION_LABEL[state].toLowerCase()}.`);
            ctx.reload();
        } catch (error) {
            toast(error.message, 'bad');
        }
    };

    const stateActions = [];
    if (['active', 'past_due'].includes(subscription.state)) {
        stateActions.push(btn('Suspender', { small: true, kind: 'danger', onClick: () => move('suspended', { title: `Suspender a ${tenant.name}`, message: 'El negocio podrá consultar todo lo registrado, pero no registrar nada nuevo. Sus datos no se borran, y vuelve a la normalidad al liquidar un período.', confirmLabel: 'Suspender', danger: true }) }));
    }
    if (subscription.state === 'active') {
        stateActions.push(btn('Termina al cerrar el período', { small: true, onClick: () => move('cancel_at_period_end', { title: 'Terminar al cerrar el período', message: 'El negocio sigue con el servicio completo hasta que termine el período pagado.', confirmLabel: 'Confirmar' }) }));
    }
    if (subscription.state !== 'canceled') {
        stateActions.push(btn('Cancelar', { small: true, kind: 'danger', onClick: () => move('canceled', { title: `Cancelar la suscripción de ${tenant.name}`, message: 'La suscripción queda cancelada y no se puede reactivar desde aquí. Los datos del negocio no se borran.', confirmLabel: 'Cancelar la suscripción', danger: true }) }));
    }

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: SECTORS[tenant.sector] || 'Negocio',
            title: tenant.name,
            back: { href: ctx.href('negocios'), label: 'Negocios' },
            actions: canSettle ? btn(`Liquidar el período ${next}`, { kind: 'primary', onClick: settle }) : null
        }),
        kpis([
            { label: 'Suscripción', value: SUBSCRIPTION_LABEL[subscription.state], tone: { active: 'good', past_due: 'warn', suspended: 'bad' }[subscription.state] || '', hint: subscription.state === 'past_due' ? 'El período pagado ya terminó' : '' },
            { label: 'Períodos liquidados', value: String(subscription.paidPeriods), hint: `${money(subscription.paidPeriods * plan.amountMinor, plan.currency)} en total, a ${plan.label}` },
            { label: 'Pagado hasta', value: subscription.currentPeriodEnd ? day(subscription.currentPeriodEnd, { short: true }) : '—', hint: subscription.currentPeriodEnd ? capitalizeRelative(today, subscription.currentPeriodEnd) : 'Todavía no ha pagado' }
        ]),
        h('div', { class: 'columns' },
            panel({ title: 'Módulos', hint: 'Se abren por períodos liquidados, uno por mes.', actions: stateActions },
                h('ul', { class: 'modules' }, MODULES.map(module => h('li', { class: !tenant.entitlements[module] && 'is-locked' },
                    h('strong', { text: MODULE_LABEL[module] }),
                    tenant.entitlements[module] ? badge('Abierto', 'good') : h('span', { class: 'small', text: moduleHint(module, subscription.paidPeriods) }))))),
            panel({ title: 'A quién escribirle' },
                tenant.owners.length
                    ? h('ul', { class: 'rows' }, tenant.owners.map(owner => h('li', {}, h('span', {}, owner.name || '—', h('span', { class: 'sub', text: owner.email })), h('span', { class: 'figure' }, badge('Propietario')))))
                    : h('p', { class: 'empty', text: 'Este negocio no tiene propietario activo.' }),
                facts([['Identificador', tenant.id], ['Moneda', tenant.baseCurrency], ['Alta', tenant.createdAt ? day(tenant.createdAt.slice(0, 10)) : '—']]))),

        intakePanel(ctx, tenant, intake, path),

        panel({ title: 'Períodos liquidados' },
            table({
                label: 'Períodos liquidados',
                emptyText: 'Todavía no ha pagado ningún período.',
                rows: tenant.periods,
                columns: [
                    { label: 'Período', render: row => `Mes ${row.number}` },
                    { label: 'Pagó el', render: row => day(row.paidOn, { short: true }) },
                    { label: 'Cómo', render: row => [PAYMENT_METHOD_LABEL[row.method] || row.method, row.reference ? h('span', { class: 'sub', text: row.reference }) : null] },
                    { label: 'Cubre hasta', render: row => day(row.coversUntil, { short: true }) },
                    { label: 'Importe', num: true, render: row => money(row.amountMinor, row.currency) }
                ]
            })),
        tenant.log.length ? panel({ title: 'Historial de la suscripción' },
            h('ul', { class: 'rows' }, tenant.log.map(entry => h('li', {},
                h('span', {}, `${SUBSCRIPTION_LABEL[entry.from] || entry.from} → ${SUBSCRIPTION_LABEL[entry.to] || entry.to}`, h('span', { class: 'sub', text: entry.reason || 'Sin motivo' })),
                h('span', { class: 'figure small muted', text: moment(entry.at) }))))) : null);
}

const capitalizeRelative = (today, date) => {
    const text = relativeDays(today, date);
    return date < today ? `Venció ${text}` : `Termina ${text}`;
};

/* ---------- Incorporación ---------- */

function intakePanel(ctx, tenant, intake, path) {
    const status = intake.status || 'none';
    const host = h('div');

    const createLink = async () => {
        try {
            const created = await post(`${path}/intake`, {});
            const url = `${location.origin}${created.path}`;
            const field = h('input', { type: 'text', readonly: true, value: url, 'aria-label': 'Enlace del formulario' });
            clear(host).append(notice('Copie el enlace ahora y envíeselo al propietario. Por seguridad no se vuelve a mostrar: si se pierde, se crea otro y el anterior deja de servir.', 'warn'),
                h('div', { class: 'link-box' }, field,
                    btn('Copiar', {
                        kind: 'primary', onClick: async () => {
                            try { await navigator.clipboard.writeText(url); toast('Enlace copiado.'); } catch { field.select(); toast('Selecciónelo y cópielo a mano.', 'bad'); }
                        }
                    })),
                h('p', { class: 'muted small', text: `Vale hasta el ${day(created.expiresAt.slice(0, 10))}. Lo que el propietario lleve escrito se conserva.` }));
            field.focus();
            field.select();
        } catch (error) {
            toast(error.message, 'bad');
        }
    };

    const apply = async () => {
        const answer = await confirmDialog({
            title: `Cargar la incorporación de ${tenant.name}`,
            message: `Se crearán ${intake.counts.products} productos, ${intake.counts.debtors} saldos por cobrar, ${intake.counts.processes} listas de tareas y ${intake.counts.equipment} equipos, y se dará acceso a quienes traen correo. Después, lo que el propietario escribió se borra de aquí: los datos pasan a ser del negocio.`,
            confirmLabel: 'Cargar al sistema'
        });
        if (!answer) return;
        try {
            const result = await post(`${path}/intake/apply`, {});
            const many = (count, one, more) => `${count} ${count === 1 ? one : more}`;
            toast(`Incorporación cargada: ${many(result.created.products, 'producto', 'productos')} y ${many(result.created.customers, 'cliente', 'clientes')}.`);
            ctx.reload();
        } catch (error) {
            toast(error.message, 'bad');
        }
    };

    const reopen = async () => {
        try {
            await post(`${path}/intake/reopen`, {});
            toast('Devuelto: el propietario puede volver a escribir con el mismo enlace.');
            ctx.reload();
        } catch (error) {
            toast(error.message, 'bad');
        }
    };

    const actions = [];
    if (status === 'none') actions.push(btn('Crear el enlace del formulario', { small: true, kind: 'primary', onClick: createLink }));
    if (status === 'draft') actions.push(btn('Crear un enlace nuevo', { small: true, onClick: createLink }));
    if (status === 'submitted') actions.push(btn('Devolver para corregir', { small: true, onClick: reopen }), btn('Cargar al sistema', { small: true, kind: 'primary', onClick: apply }));

    let body;
    if (status === 'none') {
        body = h('p', { class: 'muted', text: 'El propietario llena un formulario con sus productos, costos, deudores, equipo de trabajo, procesos y máquinas. No necesita cuenta: entra con el enlace.' });
    } else if (status === 'draft') {
        // La hora termina en «p. m.»: la frase acaba ahí, sin otro punto detrás.
        body = h('p', { class: 'muted', text: intake.savedAt ? `El propietario lo está llenando. Último guardado: ${moment(intake.savedAt)}` : 'Enlace creado. El propietario todavía no ha escrito nada.' });
    } else if (status === 'applied') {
        const result = intake.result || { created: {}, invited: [], skipped: [] };
        body = h('div', { class: 'stack' },
            facts([
                ['Productos', String(result.created.products ?? '—')],
                ['Clientes', String(result.created.customers ?? '—')],
                ['Saldos por cobrar', String(result.created.openingBalances ?? '—')],
                ['Listas de tareas', String(result.created.processes ?? '—')],
                ['Equipos', String(result.created.equipment ?? '—')],
                ['Cargado el', intake.appliedAt ? moment(intake.appliedAt) : '—']
            ]),
            result.invited?.length ? h('p', { class: 'small' }, 'Se dio acceso a: ', result.invited.map(person => person.name).join(', '), '. Cada quien define su contraseña desde la pantalla de acceso.') : null,
            result.pendingAccess ? h('p', {
                class: 'muted small',
                text: result.pendingAccess === 1
                    ? '1 persona del equipo quedó sin acceso: no traía correo o no lo necesitaba. El propietario puede dárselo desde «Gente».'
                    : `${result.pendingAccess} personas del equipo quedaron sin acceso: no traían correo o no lo necesitaban. El propietario puede dárselo desde «Gente».`
            }) : null,
            result.skipped?.length ? notice(`${result.skipped.length} ${result.skipped.length === 1 ? 'fila no se cargó' : 'filas no se cargaron'}: ${result.skipped.map(row => row.reason).join(' ')}`, 'warn') : null,
            h('p', { class: 'muted small', text: 'Lo que el propietario escribió ya no está aquí: se borró al cargarlo.' }));
    } else {
        body = intakeReview(intake, tenant.baseCurrency);
    }

    return panel({ title: 'Incorporación', hint: INTAKE_STATUS_LABEL[status], actions }, host, body);
}

/** Lo recibido, ya leído por el sistema: qué se cargaría y qué no se entendió. */
function intakeReview(intake, currency) {
    const { data, issues, counts } = intake;
    const cash = minor => money(minor, currency);
    const sectionLabel = { products: 'Productos', debtors: 'Deudores', team: 'Equipo', processes: 'Procesos', equipment: 'Equipos' };
    return h('div', { class: 'stack' },
        h('p', { class: 'muted small', text: `Esto es lo que se cargaría tal como está. Recibido el ${moment(intake.submittedAt)}` }),
        facts([
            ['Negocio', data.business.name || '—'],
            ['Giro', SECTORS[data.business.sector]],
            ['Contacto', [data.business.contactName, data.business.phone].filter(Boolean).join(' · ') || '—'],
            ['Productos', String(counts.products)],
            ['Deudores', String(counts.debtors)],
            ['Equipo', String(counts.team)],
            ['Procesos', String(counts.processes)],
            ['Equipos', String(counts.equipment)]
        ]),
        data.business.notes ? h('p', { class: 'small' }, h('strong', { text: 'Nota del propietario: ' }), data.business.notes) : null,
        issues.length ? h('div', {},
            h('h3', { text: `${issues.length} ${issues.length === 1 ? 'cosa que revisar' : 'cosas que revisar'}` }),
            h('ul', { class: 'issues' }, issues.slice(0, 40).map(row => h('li', { text: `${sectionLabel[row.section]}, fila ${row.row}: ${row.message}` })))) : notice('El sistema entendió todo lo que el propietario escribió.', 'ok'),
        h('details', {},
            h('summary', { class: 'small', text: 'Ver los productos' }),
            table({
                label: 'Productos del formulario',
                emptyText: 'Sin productos.',
                rows: data.products,
                columns: [
                    { label: 'Producto', render: row => [row.name, h('span', { class: 'sub', text: `${row.code || 'sin código'} · ${PRODUCT_KIND_LABEL[row.kind]}` })] },
                    { label: 'Costo', num: true, render: row => (row.costMinor ? cash(row.costMinor) : '—') },
                    { label: 'Precio', num: true, render: row => (row.priceMinor ? cash(row.priceMinor) : '—') },
                    { label: 'Hay', num: true, render: row => (row.kind === 'good' ? qty(row.stockMilli, row.unit) : '—') }
                ]
            })),
        data.debtors.length ? h('details', {},
            h('summary', { class: 'small', text: 'Ver quién le debe' }),
            table({
                label: 'Deudores del formulario',
                rows: data.debtors,
                columns: [
                    { label: 'Cliente', render: row => [row.name, row.phone ? h('span', { class: 'sub', text: row.phone }) : null] },
                    { label: 'Desde', render: row => (row.since ? day(row.since, { short: true }) : '—') },
                    { label: 'Debe', num: true, render: row => cash(row.amountMinor) }
                ]
            })) : null,
        data.team.length ? h('details', {},
            h('summary', { class: 'small', text: 'Ver el equipo' }),
            table({
                label: 'Equipo del formulario',
                rows: data.team,
                columns: [
                    { label: 'Persona', render: row => [row.name, row.position ? h('span', { class: 'sub', text: row.position }) : null] },
                    { label: 'Correo', render: row => row.email || '—' },
                    { label: 'Acceso', render: row => (row.access === 'none' ? 'Sin acceso' : (row.email ? badge('Se le dará acceso', 'good') : badge('Falta el correo', 'warn'))) }
                ]
            })) : null);
}
