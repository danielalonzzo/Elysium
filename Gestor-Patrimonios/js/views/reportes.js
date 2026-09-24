/**
 * Reportes y tendencias: en qué se va el dinero, cómo evolucionan ingresos,
 * gastos y ahorro, qué comercios pesan más, qué días se gasta más, y la
 * comparación con el período anterior. Cada gráfica tiene su tabla.
 */
import { app } from '../context.js';
import { html, downloadText } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money, pct } from '../ui/format.js';
import { catChip, emptyState } from '../ui/parts.js';
import { cashflowChart, hbars, heatmap } from '../ui/charts.js';
import { totals, byCategory, byMerchant, weekdayProfile, dailyTotals } from '../core/stats.js';
import { shiftPeriod, monthLabel, formatDate, addDays, diffDays, WEEKDAYS_LONG } from '../core/dates.js';
import { toCSV } from '../core/csv.js';

const state = { range: '1', table: false };
const RANGES = [['1', 'Este mes'], ['prev', 'Mes pasado'], ['3', '3 meses'], ['6', '6 meses'], ['12', '12 meses'], ['year', 'Este año']];

/**
 * Rango elegido y el anterior comparable: los mismos meses justo antes (o el
 * mismo tramo del año pasado). Si el rango actual aún no termina, el anterior
 * se corta en el mismo punto: comparar medio mes con un mes entero haría
 * parecer que todo bajó a la mitad.
 */
function ranges(model) {
    const startDay = Number(model.settings.periodStartDay) || 1;
    const shift = offset => shiftPeriod(model.period, offset, startDay);
    let current;
    let previous;
    let months;
    if (state.range === 'prev') {
        months = 1;
        current = shift(-1);
        previous = shift(-2);
    } else if (state.range === 'year') {
        months = Number(model.today.slice(5, 7));
        current = { start: `${model.today.slice(0, 4)}-01-01`, end: model.period.end };
        const lastYear = String(Number(model.today.slice(0, 4)) - 1);
        previous = { start: `${lastYear}-01-01`, end: `${lastYear}${model.period.end.slice(4)}` };
    } else {
        months = Number(state.range);
        current = { start: shift(-(months - 1)).start, end: model.period.end };
        previous = { start: shift(-(2 * months - 1)).start, end: shift(-months).end };
    }
    if (current.end >= model.today && current.start <= model.today) {
        const elapsed = diffDays(current.start, model.today);
        const cut = addDays(previous.start, elapsed);
        if (cut < previous.end) previous = { ...previous, end: cut };
    }
    return { current, previous, months };
}

export default {
    title: 'Reportes',
    eyebrow: 'Tendencias y comparaciones',
    actions: () => html`<button type="button" class="icon-btn hide-mobile" data-print aria-label="Informe PDF" title="Imprimir o guardar como PDF">${icon('printer')}</button>
        <button type="button" class="icon-btn hide-mobile" data-export aria-label="Exportar CSV" title="Exportar resumen CSV">${icon('download')}</button>`,

    render(model) {
        const { current, previous, months } = ranges(model);
        const now = totals(model.txs, current.start, current.end, model.fx);
        const before = totals(model.txs, previous.start, previous.end, model.fx);
        const cats = byCategory(model.txs, current.start, current.end, model.fx);
        const prevCats = new Map(byCategory(model.txs, previous.start, previous.end, model.fx).map(e => [e.categoryId, e.total]));
        const incomeCats = byCategory(model.txs, current.start, current.end, model.fx, 'income');
        const merchants = byMerchant(model.txs, current.start, current.end, model.fx, 8);
        const days = Math.max(1, Math.min(diffDays(current.start, model.today) + 1, diffDays(current.start, current.end) + 1));
        const weekdays = weekdayProfile(model.txs, addDays(model.today, -90), model.today, model.fx);
        const weekdayItems = [1, 2, 3, 4, 5, 6, 0].map(d => ({ label: WEEKDAYS_LONG[d].charAt(0).toUpperCase() + WEEKDAYS_LONG[d].slice(1), value: Math.round(weekdays[d] / 13) }));
        const series = model.series12;
        const delta = (a, b) => (b ? (a - b) / Math.abs(b) * 100 : null);

        if (!model.txs.length) return html`<article class="card">${emptyState({ title: 'Aún no hay datos', body: 'Los reportes aparecen en cuanto registre sus primeros movimientos.', iconName: 'pie' })}</article>`;

        return html`
            <div class="report-controls no-print">
                <div class="seg" role="group" aria-label="Período">${RANGES.map(([value, label]) => html`<button type="button" data-range="${value}" aria-pressed="${state.range === value}">${label}</button>`)}</div>
                <span class="muted">${formatDate(current.start, 'medium')} – ${formatDate(current.end, 'medium')}</span>
            </div>

            <div class="grid grid-4">
                ${kpi('Ingresos', now.income, delta(now.income, before.income), false)}
                ${kpi('Gastos', now.expense, delta(now.expense, before.expense), true)}
                ${kpi('Ahorro', now.net, delta(now.net, before.net), false)}
                <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Gasto diario promedio</span></div><div class="kpi-value">${money(Math.round(now.expense / days))}</div><div class="kpi-sub">Tasa de ahorro <b>${pct(now.savingsRate)}</b></div></article>
            </div>

            <article class="card section-gap">
                <div class="card-head">
                    <div><h2>Evolución de ingresos, gastos y ahorro</h2><p>Últimos 12 meses</p></div>
                    <div class="row"><div class="legend hide-mobile"><span><i class="s-income"></i>Ingresos</span><span><i class="s-expense"></i>Gastos</span><span><i class="is-line s-net"></i>Ahorro neto</span></div>
                    <button type="button" class="btn btn-sm btn-ghost no-print" data-toggle-table>${icon(state.table ? 'pie' : 'list', { size: 15 })}${state.table ? 'Gráfica' : 'Tabla'}</button></div>
                </div>
                ${state.table ? html`<div class="table-wrap"><table class="table">
                    <thead><tr><th>Mes</th><th class="is-num">Ingresos</th><th class="is-num">Gastos</th><th class="is-num">Ahorro</th><th class="is-num">Tasa</th></tr></thead>
                    <tbody>${[...series].reverse().map(p => html`<tr><td style="text-transform:capitalize">${monthLabel(p.key, { long: true })}</td><td class="is-num">${money(p.income)}</td><td class="is-num">${money(p.expense)}</td><td class="is-num">${money(p.net, 'CRC', { tone: 'auto' })}</td><td class="is-num">${pct(p.savingsRate)}</td></tr>`)}</tbody>
                </table></div>` : html`<div class="chart" data-chart="evolution"></div>`}
            </article>

            <div class="grid grid-main section-gap">
                <article class="card">
                    <div class="card-head"><div><h2>Gastos por categoría</h2><p>Frente al período anterior, hasta el mismo día</p></div></div>
                    ${cats.length ? html`<div class="table-wrap"><table class="table compare-table">
                        <thead><tr><th>Categoría</th><th class="is-num">Ahora</th><th class="is-num">Antes</th><th class="is-num">Cambio</th><th class="is-num">Peso</th></tr></thead>
                        <tbody>${cats.map(entry => {
                            const category = model.catById.get(entry.categoryId);
                            const prev = prevCats.get(entry.categoryId) || 0;
                            const change = prev ? (entry.total - prev) / prev * 100 : null;
                            return html`<tr>
                                <td><span class="row" style="gap:10px">${catChip(category, { size: 'sm' })}${category?.name || 'Sin categoría'}</span></td>
                                <td class="is-num">${money(entry.total)}</td>
                                <td class="is-num faint">${money(prev)}</td>
                                <td class="is-num ${change === null ? '' : change > 5 ? 'is-up' : change < -5 ? 'is-down' : ''}">${change === null ? 'nuevo' : `${change > 0 ? '+' : ''}${Math.round(change)}%`}</td>
                                <td class="is-num">${pct(entry.share)}</td>
                            </tr>`;
                        })}</tbody>
                    </table></div>` : html`<p class="muted">Sin gastos en este período.</p>`}
                </article>
                <div class="stack">
                    <article class="card">
                        <div class="card-head"><div><h2>Dónde más gasta</h2><p>Comercios del período</p></div></div>
                        ${merchants.length ? hbars(merchants.map(m => ({ label: m.name, value: m.total, sub: `${m.count} ${m.count === 1 ? 'vez' : 'veces'}`, href: `#/movimientos?buscar=${encodeURIComponent(m.name)}` })), { tone: 'expense' }) : html`<p class="muted">Añada el comercio al registrar sus gastos para ver este ranking.</p>`}
                    </article>
                    <article class="card">
                        <div class="card-head"><div><h2>De dónde viene</h2><p>Ingresos por fuente</p></div></div>
                        ${incomeCats.length ? hbars(incomeCats.map(e => ({ label: model.catById.get(e.categoryId)?.name || 'Otros', value: e.total, sub: pct(e.share), iconHtml: catChip(model.catById.get(e.categoryId), { size: 'sm' }) }))) : html`<p class="muted">Sin ingresos en este período.</p>`}
                    </article>
                </div>
            </div>

            <div class="grid grid-main section-gap">
                <article class="card">
                    <div class="card-head"><div><h2>Gasto por día</h2><p>Últimas 26 semanas</p></div></div>
                    <div class="chart" data-chart="heatmap" style="min-height:0"></div>
                </article>
                <article class="card">
                    <div class="card-head"><div><h2>Por día de la semana</h2><p>Promedio de los últimos 3 meses</p></div></div>
                    ${hbars(weekdayItems, { tone: 'accent' })}
                </article>
            </div>`;
    },

    mount(root, model) {
        const evolution = root.querySelector('[data-chart="evolution"]');
        if (evolution) {
            cashflowChart(evolution, {
                labels: model.series12.map(p => monthLabel(p.key, { year: false })),
                titles: model.series12.map(p => monthLabel(p.key, { long: true })),
                income: model.series12.map(p => p.income), expense: model.series12.map(p => p.expense), net: model.series12.map(p => p.net), height: 280
            });
        }
        const heat = root.querySelector('[data-chart="heatmap"]');
        if (heat) {
            const end = model.today;
            const startMonday = addDays(end, -(26 * 7) + 1);
            const offset = (new Date(startMonday + 'T12:00:00Z').getUTCDay() + 6) % 7;
            const start = addDays(startMonday, -offset);
            const list = [];
            for (let d = start; d <= end; d = addDays(d, 1)) list.push(d);
            heatmap(heat, { days: list, values: dailyTotals(model.txs, start, end, model.fx), labelFor: iso => formatDate(iso, 'long') });
        }
        const onClick = event => {
            const range = event.target.closest('[data-range]');
            if (range) { state.range = range.dataset.range; return app.rerender(); }
            if (event.target.closest('[data-toggle-table]')) { state.table = !state.table; return app.rerender(); }
        };
        root.addEventListener('click', onClick);
        const print = document.querySelector('[data-print]');
        const exportButton = document.querySelector('[data-export]');
        const onPrint = () => window.print();
        const onExport = () => {
            const { current } = ranges(model);
            const rows = byCategory(model.txs, current.start, current.end, model.fx).map(e => ({ name: model.catById.get(e.categoryId)?.name || 'Sin categoría', total: e.total, share: e.share, count: e.count }));
            downloadText(`patrimonio-reporte-${current.start}-${current.end}.csv`, toCSV(rows, [
                { key: 'name', label: 'Categoría' },
                { key: 'total', label: 'Total (CRC)', format: v => (v / 100).toFixed(2).replace('.', ',') },
                { key: 'share', label: 'Peso %', format: v => v.toFixed(1).replace('.', ',') },
                { key: 'count', label: 'Movimientos' }
            ]), 'text/csv');
        };
        print?.addEventListener('click', onPrint);
        exportButton?.addEventListener('click', onExport);
        return () => {
            root.removeEventListener('click', onClick);
            print?.removeEventListener('click', onPrint);
            exportButton?.removeEventListener('click', onExport);
        };
    }
};

function kpi(label, value, change, invert) {
    const good = change === null ? null : invert ? change <= 0 : change >= 0;
    return html`<article class="card kpi"><div class="kpi-top"><span class="kpi-label">${label}</span></div><div class="kpi-value">${money(value)}</div>
        <div class="kpi-sub">${change === null ? 'sin período anterior' : html`<span class="delta ${good ? 'is-up' : 'is-down'}">${icon(change >= 0 ? 'trending-up' : 'trending-down', { size: 13 })}${Math.abs(Math.round(change))}%</span> vs. período anterior`}</div></article>`;
}
