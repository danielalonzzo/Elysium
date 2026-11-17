/**
 * Clientes y cobros: quién debe, cuánto y desde cuándo.
 *
 * La lista ordena por lo que más urge —lo vencido primero—, porque esta
 * pantalla se abre para decidir a quién llamar. El saldo de un cliente no se
 * edita: lo mueven las ventas a crédito y los cobros, y por eso aquí hay
 * «Registrar cobro» y «Saldo anterior», no un campo de saldo.
 */

import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from '../../core/catalog.js';
import { businessDay } from '../../core/time.js';
import { get, patch, post } from '../api.js';
import { badge, btn, confirmDialog, day, facts, formDialog, h, kpis, money, pageHead, panel, segmentBar, table, toast } from '../ui.js';

export const views = { clientes };

function clientes(ctx) {
    return ctx.param ? customerDetail(ctx) : customerList(ctx);
}

const methodOptions = PAYMENT_METHODS.map(value => ({ value, label: PAYMENT_METHOD_LABEL[value] }));

/* ================================================================== *
 * Formularios
 * ================================================================== */

function customerForm(ctx, row = null) {
    return formDialog({
        title: row ? `Editar ${row.name}` : 'Nuevo cliente',
        fields: [
            { name: 'name', label: 'Nombre', required: true, maxlength: 120, value: row?.name, wide: true },
            { name: 'phone', label: 'Teléfono', type: 'tel', maxlength: 40, value: row?.phone },
            { name: 'email', label: 'Correo', type: 'email', maxlength: 254, value: row?.email },
            { name: 'idNumber', label: 'Cédula', maxlength: 30, value: row?.idNumber },
            { name: 'creditDays', label: 'Días de crédito', type: 'integer', min: 0, max: 365, value: row?.creditDays ?? 30, hint: 'El plazo que se le da al fiarle.' },
            { name: 'notes', label: 'Notas', type: 'textarea', maxlength: 600, value: row?.notes, wide: true },
            row ? { name: 'active', type: 'checkbox', label: 'Estado', checkLabel: 'Sigue siendo cliente', value: row.active, wide: true } : null
        ],
        onSubmit: values => {
            const body = { ...values, creditDays: values.creditDays ?? 30 };
            return row ? patch(`${ctx.base}/customers/${encodeURIComponent(row.id)}`, body) : post(`${ctx.base}/customers`, body);
        }
    });
}

function paymentForm(ctx, customer, balanceMinor) {
    const today = businessDay(new Date(), ctx.tenant.timezone);
    return formDialog({
        title: `Cobro de ${customer.name}`,
        lead: `Debe ${money(balanceMinor, ctx.currency)}. El cobro cubre primero lo que vence antes.`,
        submitLabel: 'Registrar cobro',
        fields: [
            { name: 'amountMinor', label: 'Cuánto pagó', type: 'money', required: true, value: balanceMinor },
            { name: 'method', label: 'Cómo pagó', type: 'select', value: 'sinpe', options: methodOptions },
            { name: 'date', label: 'Fecha', type: 'date', required: true, value: today, max: today },
            { name: 'reference', label: 'Referencia', maxlength: 80, hint: 'Número del SINPE, de la transferencia o del recibo.' },
            { name: 'note', label: 'Nota', maxlength: 300, wide: true }
        ],
        onSubmit: values => post(`${ctx.base}/payments`, { customerId: customer.id, ...values })
    });
}

function openingForm(ctx, customer) {
    const today = businessDay(new Date(), ctx.tenant.timezone);
    return formDialog({
        title: `Saldo anterior de ${customer.name}`,
        lead: 'Lo que ya debía antes de empezar a usar el sistema. Se cobra como cualquier saldo, pero no cuenta como venta de ningún mes.',
        fields: [
            { name: 'amountMinor', label: 'Cuánto debe', type: 'money', required: true },
            { name: 'date', label: 'Desde cuándo', type: 'date', required: true, value: today, max: today },
            { name: 'dueDate', label: 'Vencía', type: 'date', hint: 'Si lo deja vacío, se toma la misma fecha.' },
            { name: 'note', label: 'Nota', maxlength: 300, wide: true }
        ],
        onSubmit: values => {
            const body = { ...values };
            if (!body.dueDate) delete body.dueDate;
            return post(`${ctx.base}/customers/${encodeURIComponent(customer.id)}/opening-balance`, body);
        }
    });
}

/* ================================================================== *
 * La cartera
 * ================================================================== */

async function customerList(ctx) {
    const { base, currency } = ctx;
    const [{ customers }, cartera] = await Promise.all([get(`${base}/customers`), get(`${base}/receivables`)]);
    const cash = minor => money(minor, currency);
    const owing = new Map(cartera.customers.filter(row => row.customerId).map(row => [row.customerId, row]));
    const rows = customers
        .map(row => ({ ...row, overdueMinor: owing.get(row.id)?.overdueMinor || 0, daysOverdue: owing.get(row.id)?.daysOverdue || 0 }))
        .sort((a, b) => b.overdueMinor - a.overdueMinor || b.balanceMinor - a.balanceMinor || a.name.localeCompare(b.name, 'es'));

    const collect = async row => {
        const done = await paymentForm(ctx, row, row.balanceMinor);
        if (done) { toast(`Cobro ${done.payment.number} registrado.`); ctx.reload(); }
    };
    const create = async () => {
        const done = await customerForm(ctx);
        if (done) { toast('Cliente creado.'); ctx.go('clientes', done.customer.id); }
    };

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: 'Control financiero',
            title: 'Clientes y cobros',
            lead: 'Quién le debe, cuánto y desde cuándo. Arriba, lo que más urge cobrar.',
            actions: ctx.can('customer.manage') ? btn('Nuevo cliente', { kind: 'primary', onClick: create }) : null
        }),
        kpis([
            { label: 'Le deben', value: cash(cartera.totalMinor), hint: `${cartera.customers.length} ${cartera.customers.length === 1 ? 'cliente con saldo' : 'clientes con saldo'}` },
            { label: 'Ya vencido', value: cash(cartera.overdueMinor), tone: cartera.overdueMinor ? 'bad' : 'good', hint: cartera.overdueMinor ? 'Es lo primero que hay que cobrar' : 'Nada vencido' },
            { label: 'Todavía en plazo', value: cash(cartera.totalMinor - cartera.overdueMinor) }
        ]),
        cartera.totalMinor ? panel({ title: 'Por antigüedad', hint: 'Cuanto más oscuro, más viejo el atraso.' },
            segmentBar(cartera.buckets.map(bucket => ({ id: bucket.id, label: bucket.label, amount: bucket.amountMinor })), cash)) : null,
        panel({ title: 'Clientes' },
            table({
                label: 'Clientes',
                emptyText: 'Todavía no hay clientes. Se crean al fiarles por primera vez o desde «Nuevo cliente».',
                rows,
                onRow: row => ctx.go('clientes', row.id),
                columns: [
                    { label: 'Cliente', render: row => [h('a', { href: ctx.href('clientes', row.id), text: row.name }), row.phone ? h('span', { class: 'sub', text: row.phone }) : null] },
                    { label: 'Debe', num: true, render: row => (row.balanceMinor ? cash(row.balanceMinor) : '—') },
                    { label: 'Vencido', num: true, render: row => (row.overdueMinor ? cash(row.overdueMinor) : '—') },
                    { label: 'Atraso', render: row => (row.overdueMinor ? badge(`${row.daysOverdue} ${row.daysOverdue === 1 ? 'día' : 'días'}`, row.daysOverdue > 30 ? 'bad' : 'warn') : (row.balanceMinor ? badge('Al día', 'good') : '')) },
                    ctx.can('payment.record') ? { label: '', tight: true, render: row => (row.balanceMinor > 0 ? btn('Cobrar', { small: true, onClick: () => collect(row) }) : '') } : null
                ].filter(Boolean)
            })));
}

/* ================================================================== *
 * Un cliente
 * ================================================================== */

async function customerDetail(ctx) {
    const { base, currency } = ctx;
    const data = await get(`${base}/customers/${encodeURIComponent(ctx.param)}`);
    const { customer, open, payments, sales } = data;
    const cash = minor => money(minor, currency);
    const overdue = open.filter(row => row.daysOverdue > 0).reduce((sum, row) => sum + row.balanceMinor, 0);

    const after = (message, done) => { if (done) { toast(message(done)); ctx.reload(); } };
    const voidPayment = async row => {
        const answer = await confirmDialog({
            title: `Anular el cobro ${row.number}`,
            message: 'Lo cobrado vuelve a quedar como saldo del cliente. El cobro queda guardado, marcado como anulado.',
            confirmLabel: 'Anular', danger: true, askReason: true, reasonLabel: 'Por qué se anula'
        });
        if (!answer) return;
        try {
            await post(`${base}/payments/${encodeURIComponent(row.id)}/void`, { reason: answer.reason });
            toast(`Cobro ${row.number} anulado.`);
            ctx.reload();
        } catch (error) {
            toast(error.message, 'bad');
        }
    };

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: 'Cliente',
            title: customer.name,
            back: { href: ctx.href('clientes'), label: 'Clientes y cobros' },
            actions: [
                customer.balanceMinor > 0 && ctx.can('payment.record')
                    ? btn('Registrar cobro', { kind: 'primary', onClick: async () => after(done => `Cobro ${done.payment.number} registrado.`, await paymentForm(ctx, customer, customer.balanceMinor)) }) : null,
                ctx.can('customer.manage') ? btn('Saldo anterior', { onClick: async () => after(() => 'Saldo anterior registrado.', await openingForm(ctx, customer)) }) : null,
                ctx.can('customer.manage') ? btn('Editar', { onClick: async () => after(() => 'Cliente actualizado.', await customerForm(ctx, customer)) }) : null
            ]
        }),
        kpis([
            { label: 'Debe', value: cash(customer.balanceMinor), hint: `${open.length} ${open.length === 1 ? 'documento pendiente' : 'documentos pendientes'}` },
            { label: 'Vencido', value: cash(overdue), tone: overdue ? 'bad' : (customer.balanceMinor ? 'good' : ''), hint: overdue ? 'Fuera de plazo' : (customer.balanceMinor ? 'Todo en plazo' : 'No debe nada') },
            { label: 'Último cobro', value: customer.lastPaymentOn ? day(customer.lastPaymentOn, { short: true }) : '—' }
        ]),
        panel({},
            facts([
                ['Teléfono', customer.phone || '—'],
                ['Correo', customer.email || '—'],
                ['Cédula', customer.idNumber || '—'],
                ['Plazo de crédito', `${customer.creditDays} días`],
                customer.notes ? ['Notas', customer.notes] : null,
                customer.active ? null : ['Estado', 'Ya no es cliente']
            ])),
        panel({ title: 'Lo que debe', hint: 'De lo que vence antes a lo que vence después.' },
            table({
                label: 'Documentos pendientes',
                emptyText: 'No tiene nada pendiente.',
                rows: open,
                columns: [
                    { label: 'Documento', render: row => [h('a', { href: ctx.href('ventas', row.id), text: row.number }), h('span', { class: 'sub', text: row.kind === 'opening' ? 'Saldo anterior' : day(row.date, { short: true }) })] },
                    { label: 'Vence', render: row => [day(row.dueDate, { short: true }), ' ', row.daysOverdue > 0 ? badge(`${row.daysOverdue} ${row.daysOverdue === 1 ? 'día' : 'días'} de atraso`, row.daysOverdue > 30 ? 'bad' : 'warn') : badge('En plazo', 'good')] },
                    { label: 'Total', num: true, render: row => cash(row.totalMinor) },
                    { label: 'Saldo', num: true, render: row => cash(row.balanceMinor) }
                ]
            })),
        panel({ title: 'Cobros' },
            table({
                label: 'Cobros',
                emptyText: 'Todavía no ha pagado nada por aquí.',
                rows: payments,
                rowClass: row => (row.status !== 'confirmed' ? 'is-void' : ''),
                columns: [
                    { label: 'Cobro', render: row => [row.number, h('span', { class: 'sub', text: day(row.date, { short: true }) })] },
                    { label: 'Cómo', render: row => [PAYMENT_METHOD_LABEL[row.method] || row.method, row.reference ? h('span', { class: 'sub', text: row.reference }) : null] },
                    { label: 'Aplicado a', render: row => row.allocations.map(item => item.number).join(', ') || '—' },
                    { label: 'Importe', num: true, render: row => cash(row.amountMinor) },
                    { label: '', tight: true, render: row => (row.status !== 'confirmed' ? badge('Anulado') : ctx.can('payment.void') ? btn('Anular', { small: true, kind: 'danger', onClick: () => voidPayment(row) }) : '') }
                ]
            })),
        panel({ title: 'Ventas recientes' },
            table({
                label: 'Ventas recientes',
                emptyText: 'Todavía no hay ventas a su nombre.',
                rows: sales.filter(row => row.kind === 'sale').slice(0, 15),
                rowClass: row => (row.status !== 'confirmed' ? 'is-void' : ''),
                onRow: row => ctx.go('ventas', row.id),
                columns: [
                    { label: 'Venta', render: row => [h('a', { href: ctx.href('ventas', row.id), text: row.number }), h('span', { class: 'sub', text: day(row.date, { short: true }) })] },
                    { label: 'Forma', render: row => (row.term === 'credit' ? 'A crédito' : 'De contado') },
                    { label: 'Total', num: true, render: row => cash(row.totalMinor) },
                    { label: 'Estado', render: row => (row.status !== 'confirmed' ? badge('Anulada') : row.balanceMinor > 0 ? badge(`Debe ${cash(row.balanceMinor)}`, 'warn') : badge('Pagada', 'good')) }
                ]
            })));
}
