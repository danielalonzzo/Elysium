/**
 * Deudas y créditos: saldo, cuota, fecha en que queda libre, racha de pagos
 * a tiempo y la estrategia para salir antes (avalancha o bola de nieve).
 */
import { app } from '../context.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money, pct, fieldAmount, currencySymbol } from '../ui/format.js';
import { progressBar, emptyState } from '../ui/parts.js';
import { monthsToPayoff, payoffPlan, amortization, debtToIncome } from '../core/loans.js';
import { inBase, parseAmount, colonesToBase } from '../core/money.js';
import { addMonths, formatDate, formatMonths, monthLabel, nextMonthlyDay } from '../core/dates.js';

/** Pago extra mensual que se simula; sin elegir, ₡25.000 o su equivalente. */
const state = { extra: null };

export default {
    title: 'Deudas',
    eyebrow: 'Préstamos y créditos',
    actions: () => html`<button type="button" class="btn btn-ghost hide-mobile" data-new-debt>${icon('plus', { size: 17 })}Préstamo</button>`,

    render(model) {
        const debts = model.debts.filter(d => d.active !== false && Number(d.balanceMinor) > 0);
        const paid = model.debts.filter(d => d.active === false || Number(d.balanceMinor) <= 0);
        const cards = model.accounts.filter(a => a.type === 'credit' && !a.archived && a.balance < 0);
        if (!debts.length && !paid.length) {
            return html`<article class="card">${emptyState({ title: 'Sin préstamos registrados', body: 'Si tiene un préstamo de carro, vivienda o personal, regístrelo para ver cuándo queda libre y cuánto ahorra pagando un poco más.', iconName: 'landmark', action: html`<button type="button" class="btn btn-primary" data-new-debt>${icon('plus', { size: 17 })}Registrar préstamo</button>` })}</article>
                ${cards.length ? cardsNote(cards) : ''}`;
        }
        // Las estrategias comparan deudas en distintas monedas: todo en la principal.
        const inMain = debts.map(d => ({ ...d, balanceMinor: inBase(d.balanceMinor, d.currency, model.fx), paymentMinor: inBase(d.paymentMinor || 0, d.currency, model.fx) }));
        const totalBalance = inMain.reduce((sum, d) => sum + d.balanceMinor, 0);
        const totalPayment = inMain.reduce((sum, d) => sum + d.paymentMinor, 0);
        const dti = debtToIncome(totalPayment, model.avgIncome);
        const extra = state.extra ?? colonesToBase(2500000, model.fx);
        const baseline = payoffPlan(inMain, { extraMonthly: 0, today: model.today });
        const avalanche = payoffPlan(inMain, { extraMonthly: extra, strategy: 'avalanche', today: model.today });
        const snowball = payoffPlan(inMain, { extraMonthly: extra, strategy: 'snowball', today: model.today });

        return html`
            <div class="grid grid-4">
                <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Deuda total</span><span class="kpi-icon is-danger">${icon('landmark', { size: 17 })}</span></div><div class="kpi-value">${money(totalBalance)}</div><div class="kpi-sub">${debts.length} ${debts.length === 1 ? 'préstamo activo' : 'préstamos activos'}</div></article>
                <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Cuotas al mes</span><span class="kpi-icon">${icon('calendar', { size: 17 })}</span></div><div class="kpi-value">${money(totalPayment)}</div><div class="kpi-sub"><span class="pill is-${{ ok: 'ok', caution: 'warn', risk: 'danger', unknown: '' }[dti.state]}">${pct(dti.pct)} de su ingreso</span></div></article>
                <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Libre de deudas</span><span class="kpi-icon is-gold">${icon('unlock', { size: 17 })}</span></div><div class="kpi-value">${baseline.freedomDate ? monthLabel(baseline.freedomDate.slice(0, 7), { long: true }) : '—'}</div><div class="kpi-sub">${baseline.stuck ? 'alguna cuota no cubre sus intereses' : 'pagando solo la cuota'}</div></article>
                <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Intereses por pagar</span><span class="kpi-icon is-warn">${icon('percent', { size: 17 })}</span></div><div class="kpi-value">${money(baseline.totalInterest)}</div><div class="kpi-sub">si no adelanta nada</div></article>
            </div>

            <div class="grid grid-main section-gap">
                <div class="stack">${debts.map(debt => debtCard(debt, model))}</div>
                <article class="card">
                    <div class="card-head"><div><h2>Salir antes</h2><p>¿Y si paga un poco más cada mes?</p></div></div>
                    <label class="field"><span>Pago extra mensual</span><div class="input-group"><span class="prefix">${currencySymbol(model.fx.base)}</span><input id="debt-extra" inputmode="decimal" value="${fieldAmount(extra, model.fx.base)}"></div></label>
                    <div class="compare section-gap">
                        ${strategyCard('Avalancha', 'Primero la tasa más alta. Paga menos intereses.', avalanche, baseline)}
                        ${strategyCard('Bola de nieve', 'Primero el saldo más pequeño. Ve resultados antes.', snowball, baseline)}
                    </div>
                    ${avalanche.totalInterest < snowball.totalInterest ? html`<div class="callout is-gold section-gap">${icon('sparkle')}<span>Con avalancha ahorra <b>${money(snowball.totalInterest - avalanche.totalInterest)}</b> más en intereses que con bola de nieve.</span></div>` : ''}
                </article>
            </div>
            ${cards.length ? cardsNote(cards) : ''}
            ${paid.length ? html`<div class="section-title"><h2>Saldadas</h2></div><div class="grid grid-3">${paid.map(d => html`<article class="card is-tight"><div class="row">${icon('check-circle', { className: 'ok-icon' })}<b>${d.name}</b></div><p class="muted" style="margin-top:6px">Saldada ${d.paidOffDate ? formatDate(d.paidOffDate, 'medium') : ''}</p></article>`)}</div>` : ''}`;
    },

    mount(root, model) {
        const input = root.querySelector('#debt-extra');
        let timer;
        input?.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => { state.extra = Math.abs(parseAmount(input.value) || 0); app.rerender(); }, 300);
        });
        const onClick = async event => {
            const forms = await import('../sheets/forms.js');
            if (event.target.closest('[data-new-debt]')) return forms.openDebtSheet();
            const pay = event.target.closest('[data-pay-debt]');
            if (pay) return forms.openDebtPaymentSheet(model.debts.find(d => d.id === pay.dataset.payDebt));
            const edit = event.target.closest('[data-edit-debt]');
            if (edit) return forms.openDebtSheet({ debt: model.debts.find(d => d.id === edit.dataset.editDebt) });
        };
        root.addEventListener('click', onClick);
        return () => root.removeEventListener('click', onClick);
    }
};

function debtCard(debt, model) {
    const months = monthsToPayoff(debt.balanceMinor, debt.annualRate, debt.paymentMinor);
    const principal = Number(debt.principalMinor) || debt.balanceMinor;
    const paidPct = principal ? (1 - debt.balanceMinor / principal) * 100 : 0;
    const remainingInterest = Number.isFinite(months) ? amortization(debt.balanceMinor, debt.annualRate, months).totalInterest : null;
    const due = debt.dueDay ? nextMonthlyDay(Number(debt.dueDay), model.today) : null;
    const onTime = Number(debt.onTimeMonths) || 0;
    return html`<article class="card debt-card">
        <div class="row-between">
            <div><h2>${debt.name}</h2><p class="muted" style="font-size:.84rem">${debt.lender || 'Préstamo'} · ${String(debt.annualRate).replace('.', ',')}% anual</p></div>
            <button type="button" class="icon-btn is-sm is-plain" data-edit-debt="${debt.id}" aria-label="Editar">${icon('edit', { size: 16 })}</button>
        </div>
        <div class="row-between" style="align-items:flex-end">
            <div><small class="faint">Saldo</small><div class="account-balance">${money(debt.balanceMinor, debt.currency)}</div></div>
            <div style="text-align:right"><small class="faint">Pagado</small><div><b>${pct(paidPct)}</b></div></div>
        </div>
        ${progressBar(paidPct, { tone: 'gold', label: 'Pagado del préstamo' })}
        <div class="debt-meta">
            <div class="kv"><small>Cuota</small><b>${money(debt.paymentMinor, debt.currency)}</b></div>
            <div class="kv"><small>Próximo pago</small><b>${due ? formatDate(due, 'short') : '—'}</b></div>
            <div class="kv"><small>Faltan</small><b>${Number.isFinite(months) ? formatMonths(months) : 'La cuota no cubre intereses'}</b></div>
            <div class="kv"><small>Intereses restantes</small><b>${remainingInterest !== null ? money(remainingInterest, debt.currency) : '—'}</b></div>
        </div>
        ${Number.isFinite(months) ? html`<div class="freedom">${icon('unlock')}<span>Queda libre en <b>${monthLabel(addMonths(model.today, months).slice(0, 7), { long: true })}</b>${onTime ? html` · ${onTime} ${onTime === 1 ? 'mes' : 'meses'} sin atrasos` : ''}</span></div>` : ''}
        <div class="row"><button type="button" class="btn btn-primary btn-sm" data-pay-debt="${debt.id}">${icon('check', { size: 16 })}Registrar pago</button></div>
    </article>`;
}

function strategyCard(title, description, plan, baseline) {
    const monthsSaved = baseline.months - plan.months;
    const interestSaved = baseline.totalInterest - plan.totalInterest;
    return html`<article class="card is-tight">
        <p class="eyebrow">${title}</p>
        <p class="big">${plan.freedomDate ? monthLabel(plan.freedomDate.slice(0, 7), { long: true }) : '—'}</p>
        <p class="muted" style="font-size:.8rem">${description}</p>
        <dl>
            <div><dt>Antes</dt><dd>${monthsSaved > 0 ? formatMonths(monthsSaved) : '—'}</dd></div>
            <div><dt>Intereses ahorrados</dt><dd>${money(Math.max(0, interestSaved))}</dd></div>
            <div><dt>Orden</dt><dd style="font-weight:500">${plan.order.map(o => o.name).join(' → ')}</dd></div>
        </dl>
    </article>`;
}

function cardsNote(cards) {
    return html`<div class="callout section-gap">${icon('credit-card')}<span>Sus tarjetas (${cards.map(c => c.name).join(', ')}) se gestionan en <a href="#/cuentas">Cuentas</a>: su saldo ya cuenta como deuda en su patrimonio.</span></div>`;
}
