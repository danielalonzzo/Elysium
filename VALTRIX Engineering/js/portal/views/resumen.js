/**
 * El resumen del negocio: lo que el dueño mira al abrir la cuenta.
 *
 * Responde, en este orden, las preguntas por las que paga: cuánto vendí y
 * cuánto me quedó, quién me debe, qué se me está acabando, qué toca hoy. Cada
 * bloque sale de un módulo distinto y solo aparece si ese módulo está abierto
 * y la persona puede verlo: un colaborador ve sus tareas, no las ventas.
 */

import { MODULES, MODULE_LABEL, SUBSCRIPTION_LABEL, TENANT_ROLE_LABEL } from '../../core/catalog.js';
import { dayLabel, relativeDays } from '../../core/time.js';
import { get } from '../api.js';
import { moduleHint } from '../nav.js';
import { badge, barList, columnChart, compactMoney, day, h, kpis, meter, money, month, notice, pageHead, panel, percent, qty, segmentBar } from '../ui.js';

export const views = { resumen };

async function resumen(ctx) {
    const { tenant, base, currency } = ctx;
    const seesMoney = ctx.has('erp') && ctx.can('report.read');
    const seesTasks = ctx.has('qms') && ctx.can('process.read');
    const seesReports = ctx.has('audit') && ctx.can('report.read');
    const wide = ctx.can('process.manage') || ctx.can('report.read');

    const [summary, operations, reports] = await Promise.all([
        seesMoney ? get(`${base}/erp/summary`) : null,
        seesTasks ? get(`${base}/qms/summary${wide ? '?all=1' : ''}`) : null,
        seesReports ? get(`${base}/reports`) : null
    ]);
    const cash = minor => money(minor, currency);
    const subscription = tenant.subscription;

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: 'El negocio',
            title: tenant.name,
            lead: summary
                ? `${month(summary.period)}, hasta hoy ${dayLabel(summary.today, { short: true })}. Su papel aquí: ${TENANT_ROLE_LABEL[tenant.role]}.`
                : `Su papel aquí: ${TENANT_ROLE_LABEL[tenant.role]}.`
        }),

        subscription.state === 'suspended'
            ? notice('La suscripción está suspendida: puede consultar todo lo registrado, pero no registrar nada nuevo. Sus datos siguen aquí.', 'warn') : null,
        subscription.state === 'past_due'
            ? notice('Hay un pago de la suscripción vencido. El servicio sigue completo por ahora.', 'warn') : null,
        subscription.state === 'pending_activation'
            ? notice('La cuenta todavía no está activada: se abre con el primer pago de la suscripción.', 'info') : null,

        summary ? moneyBlocks(ctx, summary, cash) : null,
        operations ? todayBlock(ctx, operations) : null,
        reports ? reportsBlock(ctx, reports, cash) : null,
        !summary && !operations && subscription.state !== 'pending_activation'
            ? notice('Su papel en este negocio no incluye el resumen. Use el menú para ir a lo que le corresponde.', 'info') : null,

        // La suscripción es asunto de quien paga, no de todo el equipo.
        tenant.role !== 'owner' && !ctx.can('report.read') ? null : panel({ title: 'Su suscripción', hint: 'Los módulos se abren conforme avanza la suscripción, uno por mes.' },
            h('ul', { class: 'modules' }, MODULES.map(module => h('li', { class: !tenant.entitlements[module] && 'is-locked' },
                h('strong', { text: MODULE_LABEL[module] }),
                tenant.entitlements[module] ? badge('Disponible', 'good') : h('span', { class: 'small', text: moduleHint(module, subscription.paidPeriods) })))),
            h('p', { class: 'muted small' },
                `${SUBSCRIPTION_LABEL[subscription.state] || subscription.state}. `,
                subscription.currentPeriodEnd ? `El período pagado llega hasta el ${day(subscription.currentPeriodEnd)}.` : ''))
    );
}

/* ------------------------------------------------------------------ *
 * Dinero: ventas, margen, cartera y bodega
 * ------------------------------------------------------------------ */

function moneyBlocks(ctx, summary, cash) {
    const { sales, receivables, stock } = summary;
    const costs = 'profitMinor' in sales;
    const previous = sales.previousTotalMinor;

    const stockAlerts = [stock.outCount ? `${stock.outCount} ${stock.outCount === 1 ? 'agotado' : 'agotados'}` : '', stock.lowCount ? `${stock.lowCount} por agotarse` : ''].filter(Boolean).join(' · ');

    return [
        kpis([
            {
                label: 'Ventas del mes', value: cash(sales.totalMinor),
                hint: `${sales.count} ${sales.count === 1 ? 'venta' : 'ventas'}${previous ? ` · el mes anterior cerró en ${cash(previous)}` : ''}`
            },
            costs ? {
                label: 'Ganancia bruta', value: cash(sales.profitMinor),
                hint: sales.marginBp === null ? 'Sin ventas todavía' : `Margen de ${percent(sales.marginBp)}${sales.previousMarginBp === null ? '' : ` · el mes anterior, ${percent(sales.previousMarginBp)}`}`
            } : null,
            { label: 'Entró en caja', value: cash(summary.cashInMinor), hint: 'Ventas de contado y cobros del mes' },
            {
                label: 'Le deben', value: cash(receivables.totalMinor),
                tone: receivables.overdueMinor ? 'bad' : (receivables.totalMinor ? 'good' : ''),
                hint: receivables.overdueMinor ? `${cash(receivables.overdueMinor)} ya vencido` : (receivables.totalMinor ? 'Nada vencido' : 'Nadie le debe')
            },
            {
                label: costs ? 'En bodega' : 'Existencias', value: costs ? cash(stock.valueMinor) : `${stock.lowCount + stock.outCount} por atender`,
                tone: stock.outCount ? 'bad' : (stock.lowCount ? 'warn' : ''),
                hint: stockAlerts || 'Nada por agotarse'
            }
        ]),

        panel({ title: 'Ventas por día', hint: `${month(summary.period)}, hasta hoy.` },
            columnChart({
                title: `Ventas por día de ${month(summary.period).toLowerCase()}`,
                data: summary.daily.map(row => ({
                    label: dayLabel(row.day, { weekday: true }).replace(/ de \d{4}$/, ''),
                    tick: [1, 5, 10, 15, 20, 25, 30].includes(Number(row.day.slice(8))) ? String(Number(row.day.slice(8))) : '',
                    value: row.salesMinor
                })),
                format: cash,
                formatTick: value => compactMoney(value, summary.currency),
                valueLabel: 'Ventas'
            })),

        h('div', { class: 'columns' },
            costs ? panel({ title: 'Lo que más le deja', hint: 'Ganancia de cada producto en el mes.', actions: h('a', { class: 'btn is-small is-quiet', href: ctx.href('productos'), text: 'Ver todos' }) },
                barList(summary.products.best.map(row => ({ name: row.name, value: row.profitMinor, figure: cash(row.profitMinor), small: `margen ${percent(row.marginBp)}` })), { emptyText: 'Todavía no hay ventas este mes.' }),
                summary.products.losing.length ? h('div', {},
                    h('h3', { text: 'Se vende por debajo de su costo' }),
                    barList(summary.products.losing.map(row => ({ name: row.name, value: row.profitMinor, figure: cash(row.profitMinor), small: `margen ${percent(row.marginBp)}`, tone: 'bad' })))) : null) : null,

            panel({ title: 'Quién le debe', hint: 'Saldos pendientes, por antigüedad.', actions: h('a', { class: 'btn is-small is-quiet', href: ctx.href('clientes'), text: 'Ver cobros' }) },
                segmentBar(receivables.buckets.map(bucket => ({ id: bucket.id, label: bucket.label, amount: bucket.amountMinor })), cash),
                receivables.top.length ? h('ul', { class: 'rows' }, receivables.top.map(row => h('li', {},
                    h('span', {},
                        row.customerId ? h('a', { href: ctx.href('clientes', row.customerId), text: row.name }) : row.name,
                        h('span', { class: 'sub', text: row.overdueMinor ? `${row.daysOverdue} ${row.daysOverdue === 1 ? 'día' : 'días'} de atraso` : 'Al día' })),
                    h('span', { class: 'figure' }, cash(row.balanceMinor))))) : null)),

        stock.low.length ? panel({ title: 'Por agotarse', hint: 'Productos en su mínimo o por debajo.', actions: h('a', { class: 'btn is-small is-quiet', href: ctx.href('inventario'), text: 'Ver inventario' }) },
            h('ul', { class: 'rows' }, stock.low.map(row => h('li', {},
                h('span', {}, row.name, h('span', { class: 'sub', text: `${row.code} · mínimo ${qty(row.minStockMilli, row.unit)}` })),
                h('span', { class: 'figure' }, row.out ? badge('Agotado', 'bad') : badge(`Quedan ${qty(row.onHandMilli, row.unit)}`, 'warn')))))) : null
    ];
}

/* ------------------------------------------------------------------ *
 * Hoy: tareas y mantenimientos
 * ------------------------------------------------------------------ */

function todayBlock(ctx, operations) {
    const { tasks, pending, maintenance } = operations;
    const rate = tasks.steps ? tasks.stepsDone / tasks.steps : 0;
    return h('div', { class: 'columns' },
        panel({ title: 'Las tareas de hoy', hint: dayLabel(operations.today, { weekday: true }), actions: h('a', { class: 'btn is-small is-quiet', href: ctx.href('dia'), text: 'Ir a Mi día' }) },
            tasks.lists
                ? meter({ value: tasks.stepsDone, max: tasks.steps, label: `${tasks.completed} de ${tasks.lists} ${tasks.lists === 1 ? 'lista completa' : 'listas completas'}`, figure: `${tasks.stepsDone} de ${tasks.steps} pasos`, tone: rate === 1 ? 'good' : '' })
                : h('p', { class: 'empty', text: 'Hoy no toca ninguna lista.' }),
            pending.length ? h('ul', { class: 'rows' }, pending.map(row => h('li', {},
                h('span', {}, row.name, row.area ? h('span', { class: 'sub', text: row.area }) : null),
                h('span', { class: 'figure' }, `${row.done} de ${row.total}`)))) : null),

        ctx.can('equipment.read') ? panel({ title: 'Mantenimiento', hint: 'Equipos vencidos o por vencer.', actions: h('a', { class: 'btn is-small is-quiet', href: ctx.href('equipos'), text: 'Ver equipos' }) },
            maintenance.alerts.length
                ? h('ul', { class: 'rows' }, maintenance.alerts.map(row => h('li', {},
                    h('span', {}, row.name, h('span', { class: 'sub', text: row.location || 'Sin ubicación' })),
                    h('span', { class: 'figure' }, row.status === 'overdue'
                        ? badge(`Vencido ${relativeDays(operations.today, row.nextDueOn)}`, 'bad')
                        : badge(`Toca ${relativeDays(operations.today, row.nextDueOn)}`, 'warn')))))
                : h('p', { class: 'empty', text: 'Ningún equipo pide mantenimiento esta semana.' })) : null);
}

/* ------------------------------------------------------------------ *
 * El último cierre
 * ------------------------------------------------------------------ */

function reportsBlock(ctx, reports, cash) {
    const last = reports.reports[0];
    return panel({ title: 'Informe del mes', actions: h('a', { class: 'btn is-small is-quiet', href: ctx.href('informes'), text: 'Ver informes' }) },
        reports.pending ? notice(`El cierre de ${reports.pending.label} todavía no se ha emitido. El sistema lo emite solo a los pocos días de terminar el mes.`, 'info') : null,
        last
            ? h('ul', { class: 'rows' }, h('li', {},
                h('span', {}, h('a', { href: ctx.href('informes', last.period), text: `Cierre de ${last.label}` }),
                    h('span', { class: 'sub', text: `${last.findings} hallazgos${last.urgent ? `, ${last.urgent} ${last.urgent === 1 ? 'urgente' : 'urgentes'}` : ''}` })),
                h('span', { class: 'figure' }, cash(last.salesMinor), last.marginBp === null ? null : h('span', { class: 'sub', text: `margen ${percent(last.marginBp)}` }))))
            : h('p', { class: 'empty', text: 'El primer informe llega al cerrar el primer mes completo.' }));
}
