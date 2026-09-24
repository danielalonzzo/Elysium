/**
 * Presupuestos: un límite por categoría y período, con la línea de ritmo
 * (dónde deberías ir hoy), sugerencias a partir del gasto real y la regla
 * 50/30/20.
 */
import { app } from '../context.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money, pct } from '../ui/format.js';
import { catChip, progressBar, emptyState, stateIcon } from '../ui/parts.js';
import { STATE_LABELS, natureBreakdown, suggestBudget } from '../core/budgets.js';
import { formatDate } from '../core/dates.js';
import { toast } from '../ui/overlay.js';

export default {
    title: 'Presupuestos',
    eyebrow: model => `Período del ${formatDate(model.period.start, 'short')} al ${formatDate(model.period.end, 'short')}`,
    actions: () => html`<button type="button" class="btn btn-ghost hide-mobile" data-new-budget>${icon('plus', { size: 17 })}Presupuesto</button>`,

    render(model) {
        const { budgets, budgetTotals, spendable } = model;
        const pace = (1 - (model.daysLeft - 1) / model.period.days) * 100;
        const usedPct = budgetTotals.limit ? budgetTotals.spent / budgetTotals.limit * 100 : 0;
        const budgeted = new Set(budgets.map(b => b.budget.categoryId));
        const unbudgeted = model.expenseCats
            .map(category => ({ category, average: model.avgByCategory.get(category.id) || 0, spent: model.spentByCategory.get(category.id) || 0 }))
            .filter(item => !budgeted.has(item.category.id) && (item.average > 0 || item.spent > 0))
            .sort((a, b) => b.average - a.average);
        const income = Math.max(model.avgIncome, model.totals.income);
        const natures = natureBreakdown(model.categories, model.byCategory, income);

        return html`
            <article class="card">
                <div class="row-between wrap" style="align-items:flex-end">
                    <div>
                        <p class="eyebrow">Gastado de lo presupuestado</p>
                        <p class="spend-value" style="margin-top:6px">${money(budgetTotals.spent)} <small class="faint" style="font-size:1rem;letter-spacing:0">de ${money(budgetTotals.limit)}</small></p>
                    </div>
                    <div class="kpi-row">
                        <div class="kv"><small>Queda</small><b>${money(budgetTotals.limit - budgetTotals.spent, model.fx.base, { tone: budgetTotals.limit - budgetTotals.spent < 0 ? 'expense' : 'none' })}</b></div>
                        <div class="kv"><small>Por día</small><b>${money(Math.max(0, spendable.perDay))}</b></div>
                        <div class="kv"><small>Días restantes</small><b>${model.daysLeft}</b></div>
                    </div>
                </div>
                <div class="section-gap">${progressBar(usedPct, { tone: usedPct > 100 ? 'over' : usedPct > pace + 8 ? 'warning' : 'ok', pace, size: 'thick', label: 'Presupuesto total usado' })}</div>
                <p class="field-hint" style="margin-top:8px">La marca vertical es donde debería ir hoy (${pct(pace)} del período).</p>
            </article>

            <div class="grid grid-main section-gap">
                <article class="card">
                    <div class="card-head"><div><h2>Por categoría</h2><p>${budgets.length} presupuestos</p></div><button type="button" class="link-btn only-mobile" data-new-budget>${icon('plus', { size: 15 })} Nuevo</button></div>
                    ${budgets.length ? html`<div class="list">${budgets.map(entry => budgetRow(entry, pace))}</div>`
                    : emptyState({ title: 'Aún no tiene presupuestos', body: 'Póngale un límite a cada categoría y le avisaremos al llegar al 80 % y al 100 %.', iconName: 'gauge', action: html`<button type="button" class="btn btn-primary" data-new-budget>${icon('plus', { size: 17 })}Crear presupuesto</button>` })}
                </article>
                <div class="stack">
                    <article class="card">
                        <div class="card-head"><div><h2>Regla 50/30/20</h2><p>Sobre un ingreso de ${money(income)}</p></div></div>
                        ${natures.map(n => html`<div class="nature-row">
                            <b>${n.label}</b>
                            <div class="nature-bars">
                                ${progressBar(n.actualPct / Math.max(1, n.targetPct) * 100, { tone: n.key === 'saving' ? (n.actualPct >= n.targetPct ? 'ok' : 'warning') : (n.actualPct > n.targetPct ? 'over' : 'ok'), size: 'thin', label: n.label })}
                            </div>
                            <span class="row-between" style="justify-content:flex-end;gap:8px"><b>${pct(n.actualPct)}</b><small>meta ${n.targetPct}%</small></span>
                        </div>`)}
                        <p class="field-hint section-gap">Necesidades ≤ 50 %, deseos ≤ 30 % y al menos 20 % para ahorro y deudas. Cambie la naturaleza de cada categoría en Ajustes.</p>
                    </article>
                    ${unbudgeted.length ? html`<article class="card">
                        <div class="card-head"><div><h2>Sin presupuesto</h2><p>Con gasto en los últimos meses</p></div>${unbudgeted.some(i => i.average) ? html`<button type="button" class="link-btn" data-suggest-all>Crear sugeridos</button>` : ''}</div>
                        <div class="list">${unbudgeted.slice(0, 8).map(item => html`<button type="button" class="tx" data-new-budget="${item.category.id}">
                            ${catChip(item.category)}
                            <span class="tx-main"><span class="tx-title">${item.category.name}</span><span class="tx-meta">promedio ${money(item.average)} · este mes ${money(item.spent)}</span></span>
                            <span class="tx-amount"><span class="link-btn">${item.average ? html`Sugerir ${money(suggestBudget(item.average))}` : 'Crear'}</span></span>
                        </button>`)}</div>
                    </article>` : ''}
                </div>
            </div>`;
    },

    mount(root, model) {
        const onClick = async event => {
            const forms = await import('../sheets/forms.js');
            const edit = event.target.closest('[data-edit-budget]');
            if (edit) return forms.openBudgetSheet({ categoryId: edit.dataset.editBudget });
            const create = event.target.closest('[data-new-budget]');
            if (create) return forms.openBudgetSheet({ categoryId: create.dataset.newBudget || null });
            if (event.target.closest('[data-suggest-all]')) {
                const budgeted = new Set(model.budgets.map(b => b.budget.categoryId));
                const ops = model.expenseCats
                    .filter(c => !budgeted.has(c.id) && (model.avgByCategory.get(c.id) || 0) > 0)
                    .map(c => ({ op: 'set', name: 'budgets', id: c.id, data: { categoryId: c.id, amountMinor: suggestBudget(model.avgByCategory.get(c.id)), currency: model.fx.base, rollover: false } }));
                if (!ops.length) return;
                await app.store.batch(ops);
                toast(`${ops.length} presupuestos creados a partir de su gasto promedio`, { tone: 'success' });
            }
        };
        root.addEventListener('click', onClick);
        return () => root.removeEventListener('click', onClick);
    }
};

function budgetRow(entry, pace) {
    const { category, status, carry, average } = entry;
    const tone = status.state === 'over' ? 'over' : status.state === 'warning' ? 'warning' : status.state === 'pace' ? 'pace' : 'ok';
    return html`<button type="button" class="budget-row" data-edit-budget="${category.id}">
        ${catChip(category)}
        <span class="budget-main">
            <span class="budget-top"><b>${category.name}</b><span>${money(status.spent)} de ${money(status.limit)}</span></span>
            ${progressBar(status.pct, { tone, pace: status.closed ? null : pace, label: category.name })}
            <span class="budget-sub">
                <span>${status.remaining >= 0 ? html`Quedan ${money(status.remaining)}${status.dailyAllowance ? html` · ${money(status.dailyAllowance)}/día` : ''}` : html`Excedido por ${money(-status.remaining)}`}</span>
                <span>${carry ? html`+${money(carry)} acumulado · ` : ''}${status.projected > status.limit && !status.closed ? html`Proyección ${money(status.projected)}` : average ? html`Promedio ${money(average)}` : ''}</span>
            </span>
        </span>
        <span class="budget-side"><span class="pill is-${status.state}">${icon(stateIcon(status.state), { size: 12 })}${STATE_LABELS[status.state]}</span><small class="faint">${pct(status.pct)}</small></span>
    </button>`;
}
