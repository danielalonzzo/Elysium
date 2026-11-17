/**
 * Ventas: las del mes, registrar una y ver el detalle.
 *
 * Una venta puede ser la factura de un cliente o el resumen del día de un
 * mostrador: es el mismo documento. De contado, queda pagada; a crédito, le
 * deja saldo al cliente y aparece en «Clientes y cobros».
 *
 * Lo que la persona escribe —cantidades con coma, importes con puntos— se
 * convierte a enteros aquí, antes de enviarlo. El total que se ve mientras
 * escribe es una ayuda: el que vale es el que calcula el servidor al
 * confirmar, con los costos y las existencias de ese instante.
 */

import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL, SALE_TERM_LABEL } from '../../core/catalog.js';
import { marginBp, moneyInput, multiply, parseMoney, parseQuantity } from '../../core/money.js';
import { businessDay, periodOf, shiftPeriod } from '../../core/time.js';
import { get, post } from '../api.js';
import { badge, btn, clear, confirmDialog, day, facts, h, kpis, money, month, notice, pageHead, panel, percent, qty, stepper, table, toast } from '../ui.js';

export const views = { ventas };

function ventas(ctx) {
    if (ctx.param === 'nueva') return newSale(ctx);
    if (ctx.param) return saleDetail(ctx);
    return salesList(ctx);
}

const statusBadge = (row, cash) => {
    if (row.status !== 'confirmed') return badge('Anulada');
    if (row.balanceMinor > 0) return badge(`Debe ${cash(row.balanceMinor)}`, 'warn');
    return badge('Pagada', 'good');
};

const howPaid = row => (row.term === 'credit'
    ? `Crédito · vence ${day(row.dueDate, { short: true })}`
    : `Contado · ${PAYMENT_METHOD_LABEL[row.method] || 'Efectivo'}`);

/* ================================================================== *
 * Las ventas de un mes
 * ================================================================== */

async function salesList(ctx) {
    const { base, currency } = ctx;
    const current = periodOf(businessDay(new Date(), ctx.tenant.timezone));
    const wanted = ctx.query.get('mes');
    const period = wanted && /^\d{4}-\d{2}$/.test(wanted) && wanted <= current ? wanted : current;
    const { sales } = await get(`${base}/sales?period=${period}`);
    const cash = minor => money(minor, currency);
    const costs = ctx.can('cost.read');

    // Las cifras del mes son las de las ventas en firme; una anulada no cuenta.
    const firm = sales.filter(row => row.status === 'confirmed' && row.kind === 'sale');
    const total = firm.reduce((sum, row) => sum + row.totalMinor, 0);
    const cost = firm.reduce((sum, row) => sum + (row.costMinor || 0), 0);
    const credit = firm.filter(row => row.term === 'credit').reduce((sum, row) => sum + row.totalMinor, 0);
    const move = amount => ctx.go('ventas', null, shiftPeriod(period, amount) === current ? null : { mes: shiftPeriod(period, amount) });

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: 'Control financiero',
            title: 'Ventas',
            lead: 'Lo que se vendió, a quién y cómo se pagó.',
            actions: [
                stepper({ label: month(period), onPrev: () => move(-1), onNext: () => move(1), nextDisabled: period >= current, prevLabel: 'Mes anterior', nextLabel: 'Mes siguiente' }),
                ctx.can('sale.record') ? btn('Registrar venta', { kind: 'primary', href: ctx.href('ventas', 'nueva') }) : null
            ]
        }),
        kpis([
            { label: 'Vendido', value: cash(total), hint: `${firm.length} ${firm.length === 1 ? 'venta' : 'ventas'}` },
            costs ? { label: 'Ganancia bruta', value: cash(total - cost), hint: total ? `Margen de ${percent(marginBp(total, cost))}` : 'Sin ventas' } : null,
            { label: 'De contado', value: cash(total - credit) },
            { label: 'A crédito', value: cash(credit), hint: total ? `${percent(Math.round((credit * 10000) / total))} de lo vendido` : '' }
        ]),
        panel({},
            table({
                label: `Ventas de ${month(period).toLowerCase()}`,
                emptyText: period === current ? 'Todavía no hay ventas este mes.' : 'No hubo ventas ese mes.',
                rows: sales,
                rowClass: row => (row.status !== 'confirmed' ? 'is-void' : ''),
                onRow: row => ctx.go('ventas', row.id),
                columns: [
                    { label: 'Venta', render: row => [h('a', { href: ctx.href('ventas', row.id), text: row.number }), h('span', { class: 'sub', text: day(row.date, { short: true }) })] },
                    { label: 'Cliente', render: row => [row.customerName || 'Mostrador', h('span', { class: 'sub', text: row.kind === 'opening' ? 'Saldo anterior al sistema' : howPaid(row) })] },
                    { label: 'Total', num: true, render: row => cash(row.totalMinor) },
                    costs ? { label: 'Margen', num: true, render: row => (row.kind === 'sale' && row.marginBp !== null && row.marginBp !== undefined ? percent(row.marginBp) : '—') } : null,
                    { label: 'Estado', render: row => statusBadge(row, cash) }
                ].filter(Boolean)
            })));
}

/* ================================================================== *
 * Registrar una venta
 * ================================================================== */

async function newSale(ctx) {
    const { base, currency } = ctx;
    const [{ products }, { customers }] = await Promise.all([get(`${base}/products`), get(`${base}/customers`)]);
    const cash = minor => money(minor, currency);
    const costs = ctx.can('cost.read');
    const today = businessDay(new Date(), ctx.tenant.timezone);
    const byId = new Map(products.map(row => [row.id, row]));
    const message = h('div');

    if (!products.length) {
        return h('div', { class: 'stack' },
            pageHead({ eyebrow: 'Control financiero', title: 'Registrar venta', back: { href: ctx.href('ventas'), label: 'Ventas' } }),
            notice('Para registrar una venta hace falta al menos un producto o servicio.', 'info'),
            h('p', {}, btn('Ir a Productos', { href: ctx.href('productos') })));
    }

    /* ---------- Cabecera ---------- */

    const dateInput = h('input', { type: 'date', id: 'venta-fecha', value: today, max: today, required: true });
    const customerSelect = h('select', { id: 'venta-cliente' },
        h('option', { value: '', text: 'Cliente de mostrador' }),
        customers.map(row => h('option', { value: row.id, text: row.name })));
    const termSelect = h('select', { id: 'venta-forma' }, Object.entries(SALE_TERM_LABEL).map(([value, label]) => h('option', { value, text: label })));
    const methodSelect = h('select', { id: 'venta-metodo' }, PAYMENT_METHODS.map(value => h('option', { value, text: PAYMENT_METHOD_LABEL[value] })));
    const dueInput = h('input', { type: 'date', id: 'venta-vence', min: today });
    const noteInput = h('input', { type: 'text', id: 'venta-nota', maxlength: '300' });
    const methodField = h('div', { class: 'field' }, h('label', { for: 'venta-metodo', text: 'Cómo pagó' }), methodSelect);
    const dueField = h('div', { class: 'field' }, h('label', { for: 'venta-vence', text: 'Vence' }), dueInput, h('p', { class: 'field-hint' }));

    const syncTerm = () => {
        const credit = termSelect.value === 'credit';
        methodField.hidden = credit;
        dueField.hidden = !credit;
        const customer = customers.find(row => row.id === customerSelect.value);
        dueField.querySelector('.field-hint').textContent = customer
            ? `Si lo deja vacío: a ${customer.creditDays} días, que es el plazo de ${customer.name}.`
            : 'Una venta a crédito necesita un cliente.';
    };
    termSelect.addEventListener('change', syncTerm);
    customerSelect.addEventListener('change', syncTerm);

    /* ---------- Líneas ---------- */

    const lines = [];
    const rowsNode = h('div', { class: 'line-editor' });
    const totalNode = h('strong', { text: cash(0) });
    const profitNode = h('span', { class: 'muted small' });

    const productLabel = row => `${row.name}${row.kind === 'good' ? ` · hay ${qty(row.onHandMilli, row.unit)}` : ''}`;

    const recalculate = () => {
        let total = 0;
        let cost = 0;
        for (const line of lines) {
            const product = byId.get(line.product.value);
            const quantity = parseQuantity(line.quantity.value);
            const price = parseMoney(line.price.value);
            const amount = product && quantity && price !== null ? multiply(quantity, price) : 0;
            line.total.textContent = amount ? cash(amount) : '—';
            total += amount;
            if (costs && product && quantity) cost += multiply(quantity, product.costMinor || 0);
        }
        totalNode.textContent = cash(total);
        profitNode.textContent = costs && total ? `Ganancia estimada ${cash(total - cost)} · margen ${percent(marginBp(total, cost))}` : '';
    };

    const addLine = () => {
        const index = lines.length + 1;
        const product = h('select', { 'aria-label': `Producto de la línea ${index}` },
            h('option', { value: '', text: 'Elija un producto o servicio' }),
            products.map(row => h('option', { value: row.id, text: productLabel(row), disabled: row.kind === 'good' && row.out })));
        const quantity = h('input', { type: 'text', inputmode: 'decimal', class: 'is-num', value: '1', 'aria-label': `Cantidad de la línea ${index}` });
        const price = h('input', { type: 'text', inputmode: 'decimal', class: 'is-num line-price', 'aria-label': `Precio de la línea ${index}` });
        const total = h('span', { class: 'line-total', text: '—' });
        const line = { product, quantity, price, total };
        const remove = h('button', {
            type: 'button', class: 'icon-btn', 'aria-label': `Quitar la línea ${index}`, text: '×',
            on: { click: () => { if (lines.length === 1) return; lines.splice(lines.indexOf(line), 1); line.node.remove(); recalculate(); } }
        });
        line.node = h('div', { class: 'line-row' }, product, quantity, price, total, remove);
        // Al elegir el producto se propone su precio de lista; se puede cambiar.
        product.addEventListener('change', () => { const chosen = byId.get(product.value); if (chosen) price.value = moneyInput(chosen.priceMinor); recalculate(); });
        quantity.addEventListener('input', recalculate);
        price.addEventListener('input', recalculate);
        lines.push(line);
        rowsNode.append(line.node);
        return line;
    };
    addLine();

    /* ---------- Envío ---------- */

    const submit = btn('Confirmar venta', { kind: 'primary', type: 'submit' });
    const form = h('form', {
        novalidate: true,
        on: {
            submit: async event => {
                event.preventDefault();
                clear(message);
                const body = { date: dateInput.value, term: termSelect.value, note: noteInput.value.trim(), lines: [] };
                if (customerSelect.value) body.customerId = customerSelect.value;
                if (body.term === 'cash') body.method = methodSelect.value;
                else if (dueInput.value) body.dueDate = dueInput.value;

                for (const [index, line] of lines.entries()) {
                    if (!line.product.value && lines.length > 1 && !line.price.value) continue;
                    const quantityMilli = parseQuantity(line.quantity.value);
                    const unitPriceMinor = parseMoney(line.price.value);
                    if (!line.product.value) { message.append(notice(`Elija el producto de la línea ${index + 1}.`, 'error')); line.product.focus(); return; }
                    if (!quantityMilli) { message.append(notice(`Revise la cantidad de la línea ${index + 1}.`, 'error')); line.quantity.focus(); return; }
                    if (unitPriceMinor === null) { message.append(notice(`Revise el precio de la línea ${index + 1}.`, 'error')); line.price.focus(); return; }
                    body.lines.push({ productId: line.product.value, quantityMilli, unitPriceMinor });
                }
                if (!body.lines.length) { message.append(notice('Agregue al menos un producto o servicio.', 'error')); lines[0].product.focus(); return; }
                if (body.term === 'credit' && !body.customerId) { message.append(notice('Una venta a crédito necesita un cliente.', 'error')); customerSelect.focus(); return; }

                submit.disabled = true;
                try {
                    const { sale } = await post(`${base}/sales`, body);
                    toast(`Venta ${sale.number} registrada por ${cash(sale.totalMinor)}.`);
                    ctx.go('ventas', sale.id);
                } catch (error) {
                    // «No hay existencias suficientes» dice mucho más con el producto y lo que queda.
                    const detail = error.code === 'STOCK_INSUFFICIENT' && error.extra.name
                        ? ` De ${error.extra.name} quedan ${qty(error.extra.availableMilli)}.` : '';
                    message.append(notice(`${error.message}${detail}`, 'error'));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } finally {
                    submit.disabled = false;
                }
            }
        }
    },
        panel({ title: 'La venta' },
            h('div', { class: 'form-grid' },
                h('div', { class: 'field' }, h('label', { for: 'venta-fecha', text: 'Fecha' }), dateInput),
                h('div', { class: 'field' }, h('label', { for: 'venta-cliente', text: 'Cliente' }), customerSelect),
                h('div', { class: 'field' }, h('label', { for: 'venta-forma', text: 'Forma de pago' }), termSelect),
                methodField, dueField,
                h('div', { class: 'field is-wide' }, h('label', { for: 'venta-nota', text: 'Nota' }), noteInput))),
        panel({ title: 'Qué se vendió', actions: btn('Agregar línea', { small: true, onClick: () => addLine().product.focus() }) },
            h('div', { class: 'line-row line-head', 'aria-hidden': 'true' },
                h('span', { text: 'Producto o servicio' }), h('span', { class: 'num', text: 'Cantidad' }), h('span', { class: 'num line-price', text: 'Precio' }), h('span', { class: 'num line-total', text: 'Total' }), h('span')),
            rowsNode,
            h('div', { class: 'totals' }, h('span', { class: 'muted small', text: 'Total' }), totalNode, profitNode)),
        h('div', { class: 'form-actions' }, btn('Cancelar', { href: ctx.href('ventas') }), submit));

    syncTerm();
    return h('div', { class: 'stack' },
        pageHead({ eyebrow: 'Control financiero', title: 'Registrar venta', back: { href: ctx.href('ventas'), label: 'Ventas' } }),
        message, form);
}

/* ================================================================== *
 * Una venta
 * ================================================================== */

async function saleDetail(ctx) {
    const { base, currency } = ctx;
    const { sale } = await get(`${base}/sales/${encodeURIComponent(ctx.param)}`);
    const cash = minor => money(minor, currency);
    const costs = 'costMinor' in sale;
    const firm = sale.status === 'confirmed';

    const cancel = async () => {
        const answer = await confirmDialog({
            title: `Anular ${sale.number}`,
            message: sale.lines.length
                ? 'La mercadería vuelve a la bodega y la venta deja de contar en el mes. El documento queda guardado, marcado como anulado.'
                : 'El saldo deja de contar en lo que el cliente debe. El documento queda guardado, marcado como anulado.',
            confirmLabel: 'Anular', danger: true, askReason: true, reasonLabel: 'Por qué se anula'
        });
        if (!answer) return;
        try {
            await post(`${base}/sales/${encodeURIComponent(sale.id)}/void`, { reason: answer.reason });
            toast(`${sale.number} anulada.`);
            ctx.reload();
        } catch (error) {
            toast(error.message, 'bad');
        }
    };

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: sale.kind === 'opening' ? 'Saldo anterior al sistema' : 'Venta',
            title: sale.number,
            back: { href: ctx.href('ventas'), label: 'Ventas' },
            actions: [
                firm && sale.balanceMinor > 0 && sale.customerId && ctx.can('payment.record') ? btn('Registrar cobro', { kind: 'primary', href: ctx.href('clientes', sale.customerId) }) : null,
                firm && ctx.can('sale.void') ? btn('Anular', { kind: 'danger', onClick: cancel }) : null
            ]
        }),
        firm ? null : notice(`Anulada${sale.voidReason ? `: ${sale.voidReason}` : '.'}`, 'warn'),
        panel({},
            facts([
                ['Fecha', day(sale.date)],
                ['Cliente', sale.customerId ? h('a', { href: ctx.href('clientes', sale.customerId), text: sale.customerName }) : (sale.customerName || 'Mostrador')],
                ['Forma de pago', sale.kind === 'opening' ? `Vence ${day(sale.dueDate, { short: true })}` : howPaid(sale)],
                ['Total', cash(sale.totalMinor)],
                sale.term === 'credit' ? ['Cobrado', cash(sale.paidMinor)] : null,
                sale.term === 'credit' ? ['Saldo', firm ? cash(sale.balanceMinor) : '—'] : null,
                costs && sale.kind === 'sale' ? ['Ganancia', `${cash(sale.totalMinor - sale.costMinor)} (${percent(sale.marginBp)})`] : null,
                ['Registró', sale.createdByName || '—'],
                sale.note ? ['Nota', sale.note] : null
            ])),
        sale.lines.length ? panel({ title: 'Qué se vendió' },
            table({
                label: `Líneas de ${sale.number}`,
                rows: sale.lines,
                columns: [
                    { label: 'Producto', render: line => [line.name, h('span', { class: 'sub', text: line.code })] },
                    { label: 'Cantidad', num: true, render: line => qty(line.quantityMilli, line.unit) },
                    { label: 'Precio', num: true, render: line => cash(line.unitPriceMinor) },
                    costs ? { label: 'Costo', num: true, render: line => cash(line.unitCostMinor) } : null,
                    { label: 'Total', num: true, render: line => cash(line.totalMinor) }
                ].filter(Boolean),
                foot: costs ? ['Total', '', '', '', cash(sale.totalMinor)] : ['Total', '', '', cash(sale.totalMinor)]
            })) : null);
}
