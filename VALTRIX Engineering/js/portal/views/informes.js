/**
 * Informes del mes: los cierres emitidos y el avance del mes en curso.
 *
 * El informe se lee de arriba abajo en el orden en que un dueño lo necesita:
 * primero qué hacer («Para el mes siguiente»), después por qué (los
 * hallazgos), y al final las cifras de las que sale todo. Quien solo lee el
 * primer bloque ya se lleva lo importante.
 *
 * Un cierre emitido no se recalcula: se enseña tal como se escribió ese día.
 * El avance sí se calcula cada vez, y por eso dice que no es un cierre.
 */

import { dayLabel, periodLabel } from '../../core/time.js';
import { get, post } from '../api.js';
import { badge, barList, btn, columnChart, compactMoney, confirmDialog, day, facts, h, kpis, meter, moment, money, month, notice, pageHead, panel, percent, qty, segmentBar, table, toast } from '../ui.js';

export const views = { informes };

const TONE_LABEL = { bad: 'Urgente', warn: 'Atención', info: 'Para saber', good: 'Va bien' };

function informes(ctx) {
    if (ctx.param === 'avance') return reportView(ctx, 'preview');
    if (ctx.param) return reportView(ctx, ctx.param);
    return reportList(ctx);
}

/* ================================================================== *
 * Los cierres
 * ================================================================== */

async function reportList(ctx) {
    const { base, currency } = ctx;
    const { reports, pending, today } = await get(`${base}/reports`);
    const cash = minor => money(minor, currency);

    const close = async () => {
        const answer = await confirmDialog({
            title: `Emitir el cierre de ${pending.label}`,
            message: `Al emitirlo, ${pending.label} queda cerrado: ya no se podrán registrar ni anular ventas, cobros o movimientos con fecha de ese mes. Hágalo cuando haya terminado de apuntar el mes.`,
            confirmLabel: 'Emitir el cierre'
        });
        if (!answer) return;
        try {
            await post(`${base}/reports/${pending.period}`, {});
            toast(`Cierre de ${pending.label} emitido.`);
            ctx.go('informes', pending.period);
        } catch (error) {
            toast(error.message, 'bad');
        }
    };

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: 'Auditoría mensual',
            title: 'Informes del mes',
            lead: 'Al terminar cada mes el sistema revisa los números y le deja qué hacer en el siguiente.'
        }),
        pending ? panel({ title: `Falta el cierre de ${pending.label}`, actions: ctx.can('report.generate') ? btn('Emitir el cierre ahora', { kind: 'primary', onClick: close }) : null },
            h('p', { class: 'muted', text: 'El sistema lo emite solo a los pocos días de terminar el mes, para dar tiempo a apuntar las últimas ventas. Si ya terminó, puede emitirlo ahora.' })) : null,
        panel({ title: `Avance de ${periodLabel(today.slice(0, 7))}`, hint: 'Cómo va el mes hasta hoy. No es un cierre: mañana será otro.', actions: btn('Ver el avance', { href: ctx.href('informes', 'avance') }) }),
        panel({ title: 'Cierres emitidos' },
            table({
                label: 'Cierres emitidos',
                emptyText: 'El primer cierre llega al terminar el primer mes completo.',
                rows: reports,
                onRow: row => ctx.go('informes', row.period),
                columns: [
                    { label: 'Mes', render: row => [h('a', { href: ctx.href('informes', row.period), text: month(row.period) }), h('span', { class: 'sub', text: `Emitido el ${moment(row.generatedAt)}` })] },
                    { label: 'Ventas', num: true, render: row => cash(row.salesMinor) },
                    { label: 'Ganancia', num: true, render: row => cash(row.profitMinor) },
                    { label: 'Margen', num: true, render: row => (row.marginBp === null ? '—' : percent(row.marginBp)) },
                    { label: 'Hallazgos', render: row => [String(row.findings), ' ', row.urgent ? badge(`${row.urgent} ${row.urgent === 1 ? 'urgente' : 'urgentes'}`, 'bad') : null] }
                ]
            })));
}

/* ================================================================== *
 * Un informe
 * ================================================================== */

async function reportView(ctx, which) {
    const { base } = ctx;
    const preview = which === 'preview';
    const { report } = await get(`${base}/reports/${preview ? 'preview' : encodeURIComponent(which)}`);
    const cash = minor => money(minor, report.currency);
    const { sales, receivables, inventory, products, operations } = report;
    const previous = sales.previous;

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: preview ? 'Avance del mes' : 'Cierre mensual',
            title: month(report.period),
            back: { href: ctx.href('informes'), label: 'Informes del mes' },
            lead: preview
                ? `Hasta hoy, ${dayLabel(report.until, { short: true })}: ${report.days.elapsed} de ${report.days.total} días. No es un cierre: mañana será otro.`
                : `Emitido el ${day(report.asOf)}. La cartera y la bodega se miran a esa fecha, que es cuando se cerró.`,
            actions: btn('Imprimir', { onClick: () => window.print() })
        }),

        kpis([
            {
                label: 'Ventas', value: cash(sales.totalMinor),
                hint: `${sales.count} ${sales.count === 1 ? 'venta' : 'ventas'}${previous.totalMinor ? ` · ${periodLabel(previous.period)}: ${cash(previous.totalMinor)}` : ''}`
            },
            { label: 'Ganancia bruta', value: cash(sales.profitMinor), hint: sales.marginBp === null ? 'Sin ventas' : `Margen de ${percent(sales.marginBp)}${previous.marginBp === null ? '' : ` · antes, ${percent(previous.marginBp)}`}` },
            { label: 'Entró en caja', value: cash(report.cash.inMinor), hint: `Cobró ${cash(report.cash.collectedMinor)} de lo fiado` },
            { label: 'Le deben', value: cash(receivables.totalMinor), tone: receivables.overdueMinor ? 'bad' : (receivables.totalMinor ? 'good' : ''), hint: receivables.overdueMinor ? `${cash(receivables.overdueMinor)} ya vencido` : 'Nada vencido' },
            { label: 'En bodega', value: cash(inventory.valueMinor), hint: `${inventory.goods} productos con existencias` }
        ]),

        report.actions.length ? panel({ title: 'Para el mes siguiente', hint: 'De lo más urgente a lo menos.' },
            h('ol', { class: 'actions-list' }, report.actions.map(action => h('li', { text: action })))) : null,

        panel({ title: 'Lo que el mes dejó ver', hint: 'Cada hallazgo sale de una regla sobre sus propios números. El mismo mes da siempre el mismo informe.' },
            h('ul', { class: 'findings' }, report.findings.map(finding => h('li', { class: ['finding', `is-${finding.tone}`] },
                h('p', { class: 'finding-tone', text: TONE_LABEL[finding.tone] }),
                h('h3', { text: finding.title }),
                finding.detail ? h('p', { text: finding.detail }) : null,
                finding.action ? h('p', { class: 'finding-action', text: finding.action }) : null)))),

        sales.totalMinor ? panel({ title: 'Ventas por día' },
            columnChart({
                title: `Ventas por día de ${periodLabel(report.period)}`,
                data: sales.daily.map(row => ({
                    label: dayLabel(row.day, { weekday: true }).replace(/ de \d{4}$/, ''),
                    tick: [1, 5, 10, 15, 20, 25, 30].includes(Number(row.day.slice(8))) ? String(Number(row.day.slice(8))) : '',
                    value: row.salesMinor
                })),
                format: cash,
                formatTick: value => compactMoney(value, report.currency),
                valueLabel: 'Ventas'
            })) : null,

        h('div', { class: 'columns' },
            panel({ title: 'Lo que más dejó', hint: `${products.sold} productos y servicios vendidos.` },
                barList(products.best.map(row => ({ name: row.name, value: row.profitMinor, figure: cash(row.profitMinor), small: `margen ${percent(row.marginBp)}` })), { emptyText: 'No hubo ventas con ganancia.' })),
            panel({ title: 'Lo que perdió o dejó poco' },
                products.losing.length || products.lowMargin.length
                    ? barList([
                        ...products.losing.map(row => ({ name: row.name, value: row.profitMinor, figure: cash(row.profitMinor), small: `margen ${percent(row.marginBp)}`, tone: 'bad' })),
                        ...products.lowMargin.map(row => ({ name: row.name, value: row.profitMinor, figure: cash(row.profitMinor), small: `margen ${percent(row.marginBp)}`, tone: 'warn' }))
                    ])
                    : h('p', { class: 'empty', text: 'Nada se vendió por debajo de su costo ni con margen mínimo.' }),
                products.withoutCost ? h('p', { class: 'muted small', text: `${products.withoutCost} ${products.withoutCost === 1 ? 'producto vendido no tiene' : 'productos vendidos no tienen'} costo registrado y ${products.withoutCost === 1 ? 'queda' : 'quedan'} fuera de la comparación.` }) : null)),

        h('div', { class: 'columns' },
            panel({ title: 'Quién le debe', hint: `Al ${day(report.asOf, { short: true })}.` },
                segmentBar(receivables.buckets.map(bucket => ({ id: bucket.id, label: bucket.label, amount: bucket.amountMinor })), cash),
                receivables.top.length ? h('ul', { class: 'rows' }, receivables.top.map(row => h('li', {},
                    h('span', {}, row.name, h('span', { class: 'sub', text: row.overdueMinor ? `${row.daysOverdue} ${row.daysOverdue === 1 ? 'día' : 'días'} de atraso` : 'Al día' })),
                    h('span', { class: 'figure' }, cash(row.balanceMinor))))) : null),
            panel({ title: 'La bodega', hint: `Al ${day(report.asOf, { short: true })}.` },
                facts([
                    ['Valor al costo', cash(inventory.valueMinor)],
                    ['Por agotarse', String(inventory.lowCount)],
                    ['Agotados', String(inventory.outCount)],
                    ['Sin moverse en el mes', cash(inventory.deadValueMinor)],
                    ['Merma del mes', cash(inventory.wasteMinor)],
                    ['Compras del mes', cash(report.cash.purchasesMinor)]
                ]),
                inventory.atRisk.length ? h('div', {},
                    h('h3', { text: 'Se venden y se están acabando' }),
                    h('ul', { class: 'rows' }, inventory.atRisk.map(row => h('li', {},
                        h('span', { text: row.name }),
                        h('span', { class: 'figure' }, row.out ? badge('Agotado', 'bad') : badge(`${qty(row.onHandMilli, row.unit)} · ${row.coverDays} ${row.coverDays === 1 ? 'día' : 'días'}`, 'warn')))))) : null,
                inventory.dead.length ? h('div', {},
                    h('h3', { text: 'No se movieron en todo el mes' }),
                    h('ul', { class: 'rows' }, inventory.dead.map(row => h('li', {},
                        h('span', {}, row.name, h('span', { class: 'sub', text: `${qty(row.onHandMilli, row.unit)} en bodega` })),
                        h('span', { class: 'figure' }, cash(row.valueMinor)))))) : null)),

        operations ? h('div', { class: 'columns' },
            panel({ title: 'Listas de tareas' },
                operations.compliance.rateBp === null
                    ? h('p', { class: 'empty', text: 'No tocó ninguna lista en el período.' })
                    : meter({
                        value: operations.compliance.completed, max: operations.compliance.expected,
                        label: 'Veces que se completó lo que tocaba', figure: `${operations.compliance.completed} de ${operations.compliance.expected} · ${percent(operations.compliance.rateBp)}`,
                        tone: operations.compliance.rateBp >= 9500 ? 'good' : operations.compliance.rateBp < 8000 ? 'warn' : ''
                    }),
                operations.compliance.worst.length ? h('ul', { class: 'rows' }, operations.compliance.worst.map(row => h('li', {},
                    h('span', {}, row.name, row.area ? h('span', { class: 'sub', text: row.area }) : null),
                    h('span', { class: 'figure' }, `${row.completed} de ${row.expected}`)))) : null),
            panel({ title: 'Mantenimiento' },
                facts([
                    ['Hechos en el mes', String(operations.maintenance.done)],
                    ['Gastado', cash(operations.maintenance.costMinor)],
                    ['Vencidos', String(operations.maintenance.overdue.length)],
                    ['Por vencer', String(operations.maintenance.dueSoon.length)]
                ]),
                operations.maintenance.overdue.length ? h('ul', { class: 'rows' }, operations.maintenance.overdue.map(row => h('li', {},
                    h('span', { text: row.name }),
                    h('span', { class: 'figure' }, badge(`${-row.days} ${row.days === -1 ? 'día' : 'días'} de atraso`, 'bad'))))) : null)) : null,

        preview ? notice('Esto es un avance. El cierre del mes se emite al terminar, y a partir de ahí no cambia.', 'info') : null);
}
