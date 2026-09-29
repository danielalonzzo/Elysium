/**
 * Movimientos: la lista completa, agrupada por día, con búsqueda y filtros.
 */
import { app } from '../context.js';
import { html, downloadText } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money, num, formatMoney, METHODS } from '../ui/format.js';
import { txRow, emptyState, txTitle } from '../ui/parts.js';
import { totals } from '../core/stats.js';
import { searchKey } from '../core/text.js';
import { formatDate, shiftPeriod } from '../core/dates.js';
import { inBase } from '../core/money.js';
import { transactionsToCSV } from '../core/csv.js';

const PAGE_SIZE = 120;

const state = {
    query: '',
    type: 'all',
    categoryId: '',
    accountId: '',
    range: 'month',
    flag: '',
    limit: PAGE_SIZE,
    lastQueryKey: ''
};

function rangeFor(model) {
    const startDay = Number(model.settings.periodStartDay) || 1;
    switch (state.range) {
        case 'prev': return shiftPeriod(model.period, -1, startDay);
        case '3m': return { start: shiftPeriod(model.period, -2, startDay).start, end: model.period.end };
        case 'year': return { start: `${model.today.slice(0, 4)}-01-01`, end: model.period.end };
        case 'all': return { start: '0000-01-01', end: '9999-12-31' };
        default: return model.period;
    }
}

function filtered(model) {
    const range = rangeFor(model);
    const query = searchKey(state.query);
    return model.txs.filter(tx => {
        if (tx.date < range.start || tx.date > range.end) return false;
        if (state.type !== 'all' && tx.type !== state.type) return false;
        if (state.categoryId && tx.categoryId !== state.categoryId) return false;
        if (state.accountId && tx.accountId !== state.accountId && tx.toAccountId !== state.accountId) return false;
        if (state.flag === 'receipt' && !tx.receipt) return false;
        if (state.flag === 'impulsive' && !tx.impulsive) return false;
        if (state.flag === 'foreign' && (tx.currency || model.fx.base) === model.fx.base) return false;
        if (query) {
            const haystack = searchKey(`${tx.merchant || ''} ${model.catById.get(tx.categoryId)?.name || ''} ${tx.note || ''} ${(tx.tags || []).join(' ')} ${formatMoney(tx.amountMinor, tx.currency, { symbol: false })}`);
            if (!haystack.includes(query)) return false;
        }
        return true;
    });
}

export default {
    title: 'Movimientos',
    eyebrow: model => `${num(model.txs.length)} ${model.txs.length === 1 ? 'movimiento' : 'movimientos'} en total`,
    actions: () => html`<button type="button" class="icon-btn hide-mobile" data-export aria-label="Exportar CSV" title="Exportar CSV">${icon('download')}</button>`,

    render(model, route) {
        const queryKey = JSON.stringify(route.query);
        if (queryKey !== state.lastQueryKey) {
            state.lastQueryKey = queryKey;
            if (route.query.categoria) { state.categoryId = route.query.categoria; state.range = 'month'; state.type = 'all'; }
            if (route.query.cuenta) { state.accountId = route.query.cuenta; state.range = '3m'; }
            if (route.query.buscar) state.query = route.query.buscar;
        }
        const list = filtered(model);
        const range = rangeFor(model);
        const sums = totals(list, '0000-01-01', '9999-12-31', model.fx);
        const shown = list.slice(0, state.limit);
        const groups = [];
        for (const tx of shown) {
            const last = groups[groups.length - 1];
            if (last && last.date === tx.date) last.items.push(tx);
            else groups.push({ date: tx.date, items: [tx] });
        }
        const accounts = model.accounts.filter(a => a.type !== 'asset');
        const hasFilters = state.query || state.type !== 'all' || state.categoryId || state.accountId || state.flag;

        return html`
            <div class="toolbar">
                <label class="search-field field"><span class="sr-only">Buscar</span>${icon('search', { size: 18 })}
                    <input id="tx-search" type="search" placeholder="Buscar comercio, nota, etiqueta o monto" value="${state.query}" autocomplete="off"></label>
                <div class="seg" role="group" aria-label="Período">
                    ${[['month', 'Este mes'], ['prev', 'Mes pasado'], ['3m', '3 meses'], ['year', 'Este año'], ['all', 'Todo']].map(([value, label]) => html`<button type="button" data-range="${value}" aria-pressed="${state.range === value}">${label}</button>`)}
                </div>
            </div>
            <div class="toolbar">
                <div class="seg" role="group" aria-label="Tipo">
                    ${[['all', 'Todos'], ['expense', 'Gastos'], ['income', 'Ingresos'], ['transfer', 'Transferencias']].map(([value, label]) => html`<button type="button" data-type="${value}" aria-pressed="${state.type === value}">${label}</button>`)}
                </div>
                <label class="field" style="min-width:180px"><span class="sr-only">Categoría</span>
                    <select data-filter="categoryId"><option value="">Todas las categorías</option>
                        <optgroup label="Gastos">${model.expenseCats.map(c => html`<option value="${c.id}" ${state.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`)}</optgroup>
                        <optgroup label="Ingresos">${model.incomeCats.map(c => html`<option value="${c.id}" ${state.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`)}</optgroup>
                    </select></label>
                <label class="field" style="min-width:160px"><span class="sr-only">Cuenta</span>
                    <select data-filter="accountId"><option value="">Todas las cuentas</option>${accounts.map(a => html`<option value="${a.id}" ${state.accountId === a.id ? 'selected' : ''}>${a.name}</option>`)}</select></label>
                <div class="chips">
                    <button type="button" class="chip" data-flag="receipt" aria-pressed="${state.flag === 'receipt'}">${icon('receipt', { size: 15 })}Con comprobante</button>
                    <button type="button" class="chip" data-flag="impulsive" aria-pressed="${state.flag === 'impulsive'}">${icon('zap', { size: 15 })}Impulsivos</button>
                    <button type="button" class="chip" data-flag="foreign" aria-pressed="${state.flag === 'foreign'}">En otra moneda</button>
                </div>
                ${hasFilters ? html`<button type="button" class="link-btn" data-clear>Limpiar filtros</button>` : ''}
            </div>

            <div class="period-summary">
                <div class="kv"><small>Ingresos</small><b>${money(sums.income, model.fx.base, { tone: 'income' })}</b></div>
                <div class="kv"><small>Gastos</small><b>${money(sums.expense)}</b></div>
                <div class="kv"><small>Neto</small><b>${money(sums.net, model.fx.base, { sign: true, tone: 'auto' })}</b></div>
                <div class="kv"><small>Movimientos</small><b>${num(list.length)}</b></div>
                ${range.start !== '0000-01-01' ? html`<div class="kv"><small>Período</small><b>${formatDate(range.start, 'short')} – ${formatDate(range.end, 'short')}</b></div>` : ''}
            </div>

            <article class="card">
                ${groups.length ? html`<div class="list">${groups.map(group => {
                    const dayNet = group.items.reduce((sum, tx) => sum + (tx.type === 'income' ? 1 : tx.type === 'expense' ? -1 : 0) * inBase(tx.amountMinor, tx.currency, model.fx), 0);
                    return html`<div class="list-day"><span>${formatDate(group.date, 'relative', model.today)}</span><span>${dayNet ? money(dayNet, model.fx.base, { sign: true }) : ''}</span></div>${group.items.map(tx => txRow(tx, model))}`;
                })}</div>
                ${list.length > shown.length ? html`<div class="load-more"><button type="button" class="btn btn-ghost" data-more>Mostrar ${Math.min(PAGE_SIZE, list.length - shown.length)} más</button></div>` : ''}`
                : emptyState({
                    title: hasFilters ? 'Nada coincide con esos filtros' : 'Sin movimientos en este período',
                    body: hasFilters ? 'Pruebe con otro período o limpie los filtros.' : 'Registre un gasto o un ingreso y aparecerá aquí.',
                    iconName: hasFilters ? 'search' : 'list',
                    action: hasFilters ? html`<button type="button" class="btn btn-ghost" data-clear>Limpiar filtros</button>` : html`<button type="button" class="btn btn-primary" data-new>${icon('plus', { size: 17 })}Registrar</button>`
                })}
            </article>`;
    },

    mount(root, model, route) {
        if (route.id) {
            import('../sheets/transaction.js').then(m => m.openTransactionDetail(route.id));
            history.replaceState(history.state, '', '#/movimientos');
        }
        const rerender = () => app.rerender();
        const search = root.querySelector('#tx-search');
        let timer;
        search?.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => { state.query = search.value; state.limit = PAGE_SIZE; rerender(); }, 140);
        });
        const onClick = async event => {
            const tx = event.target.closest('[data-tx]');
            if (tx) return (await import('../sheets/transaction.js')).openTransactionDetail(tx.dataset.tx);
            const range = event.target.closest('[data-range]');
            if (range) { state.range = range.dataset.range; state.limit = PAGE_SIZE; return rerender(); }
            const type = event.target.closest('[data-type]');
            if (type) { state.type = type.dataset.type; return rerender(); }
            const flag = event.target.closest('[data-flag]');
            if (flag) { state.flag = state.flag === flag.dataset.flag ? '' : flag.dataset.flag; return rerender(); }
            if (event.target.closest('[data-clear]')) {
                Object.assign(state, { query: '', type: 'all', categoryId: '', accountId: '', flag: '' });
                return rerender();
            }
            if (event.target.closest('[data-more]')) { state.limit += PAGE_SIZE; return rerender(); }
            if (event.target.closest('[data-new]')) return (await import('../sheets/transaction.js')).openTransactionSheet();
        };
        const onChange = event => {
            const select = event.target.closest('[data-filter]');
            if (!select) return;
            state[select.dataset.filter] = select.value;
            rerender();
        };
        root.addEventListener('click', onClick);
        root.addEventListener('change', onChange);
        const exportButton = document.querySelector('[data-export]');
        const onExport = () => exportCsv(model);
        exportButton?.addEventListener('click', onExport);
        return () => {
            root.removeEventListener('click', onClick);
            root.removeEventListener('change', onChange);
            exportButton?.removeEventListener('click', onExport);
        };
    }
};

function exportCsv(model) {
    const csv = transactionsToCSV(filtered(model), {
        category: id => model.catById.get(id)?.name || '',
        account: id => model.accounts.find(a => a.id === id)?.name || '',
        method: key => METHODS[key]?.label || '',
        title: tx => txTitle(tx, model)
    });
    downloadText(`patrimonio-movimientos-${model.today}.csv`, csv, 'text/csv');
}
