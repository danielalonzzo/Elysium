/**
 * Recurrentes y calendario: salario, alquiler, servicios, suscripciones,
 * marchamo… Lo que se repite, cuándo llega y si ya se registró.
 */
import { app } from '../context.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money } from '../ui/format.js';
import { catChip, emptyState } from '../ui/parts.js';
import { occurrences, nextOccurrence, monthlyEquivalent, FREQUENCIES } from '../core/recurring.js';
import { addMonths, startOfMonth, endOfMonth, parseISO, toISO, daysInMonth, weekday, addDays, formatDate, monthLabel, relativeDays, WEEKDAYS_SHORT } from '../core/dates.js';
import { inBase, formatMoney } from '../core/money.js';
import { nextMonthlyDay } from '../core/alerts.js';
import { postRecurring } from '../services.js';
import { actionSheet, toast } from '../ui/overlay.js';

const state = { offset: 0 };

export default {
    title: 'Recurrentes',
    eyebrow: 'Pagos e ingresos fijos',
    actions: () => html`<button type="button" class="btn btn-ghost hide-mobile" data-new-rule>${icon('plus', { size: 17 })}Recurrente</button>`,

    render(model) {
        const month = addMonths(startOfMonth(model.today), state.offset);
        const monthEnd = endOfMonth(month);
        const events = eventsFor(model, month, monthEnd);
        const incomeRules = model.recurring.filter(r => r.type === 'income');
        const expenseRules = model.recurring.filter(r => r.type === 'expense');
        const fixedExpense = expenseRules.filter(r => r.active !== false).reduce((sum, r) => sum + inBase(monthlyEquivalent(r), r.currency, model.fx), 0);
        const fixedIncome = incomeRules.filter(r => r.active !== false).reduce((sum, r) => sum + inBase(monthlyEquivalent(r), r.currency, model.fx), 0);

        const { y, m } = parseISO(month);
        const first = toISO(y, m, 1);
        const lead = (weekday(first) + 6) % 7;
        const cells = [];
        for (let i = 0; i < lead; i += 1) cells.push({ date: addDays(first, i - lead), out: true });
        for (let d = 1; d <= daysInMonth(y, m); d += 1) cells.push({ date: toISO(y, m, d), out: false });
        while (cells.length % 7) cells.push({ date: addDays(cells[cells.length - 1].date, 1), out: true });

        return html`
            ${model.overdueRecurring.length ? html`<article class="card" style="border-color:color-mix(in srgb,var(--warn) 40%,transparent)">
                <div class="card-head"><div><h2>Pendientes de confirmar</h2><p>Llegó su fecha y no están registrados</p></div></div>
                <ul class="upcoming">${model.overdueRecurring.map(item => html`<li class="is-overdue">
                    ${catChip(model.catById.get(item.rule.categoryId) || { icon: 'repeat', tone: 'gray' }, { size: 'sm' })}
                    <span class="upcoming-main"><b>${item.rule.name}</b><small>Desde el ${formatDate(item.date, 'medium')}</small></span>
                    <span class="upcoming-amount">${money(item.rule.amountMinor, item.rule.currency)}<button type="button" class="link-btn" data-post="${item.rule.id}" data-date="${item.date}">Registrar</button></span>
                </li>`)}</ul>
            </article>` : ''}

            <div class="grid grid-3 ${model.overdueRecurring.length ? 'section-gap' : ''}">
                <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Ingresos fijos al mes</span><span class="kpi-icon is-ok">${icon('arrow-down-left', { size: 17 })}</span></div><div class="kpi-value">${money(fixedIncome)}</div><div class="kpi-sub">${incomeRules.length} reglas</div></article>
                <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Gastos fijos al mes</span><span class="kpi-icon is-danger">${icon('arrow-up-right', { size: 17 })}</span></div><div class="kpi-value">${money(fixedExpense)}</div><div class="kpi-sub">${expenseRules.length} reglas</div></article>
                <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Queda después de lo fijo</span><span class="kpi-icon is-gold">${icon('piggy-bank', { size: 17 })}</span></div><div class="kpi-value">${money(fixedIncome - fixedExpense, 'CRC', { tone: fixedIncome - fixedExpense < 0 ? 'expense' : 'none' })}</div><div class="kpi-sub">para variables, metas y ahorro</div></article>
            </div>

            <article class="card section-gap">
                <div class="card-head">
                    <div><h2 style="text-transform:capitalize">${monthLabel(month.slice(0, 7), { long: true })}</h2><p>${events.length} vencimientos</p></div>
                    <div class="row">
                        <button type="button" class="icon-btn is-sm" data-month="-1" aria-label="Mes anterior">${icon('chevron-left', { size: 16 })}</button>
                        ${state.offset ? html`<button type="button" class="btn btn-sm btn-quiet" data-month="0">Hoy</button>` : ''}
                        <button type="button" class="icon-btn is-sm" data-month="1" aria-label="Mes siguiente">${icon('chevron-right', { size: 16 })}</button>
                    </div>
                </div>
                <div class="calendar" role="grid">
                    ${[1, 2, 3, 4, 5, 6, 0].map(d => html`<div class="calendar-head">${WEEKDAYS_SHORT[d]}</div>`)}
                    ${cells.map(cell => html`<div class="calendar-day ${cell.out ? 'is-out' : ''} ${cell.date === model.today ? 'is-today' : ''}">
                        <b>${Number(cell.date.slice(8))}</b>
                        ${events.filter(e => e.date === cell.date).map(e => html`<button type="button" class="cal-event ${e.kind === 'income' ? 'is-income' : ''} ${e.paid ? 'is-paid' : ''}" data-event="${e.key}" title="${e.name} · ${e.label}">${e.name}</button>`)}
                    </div>`)}
                </div>
            </article>

            <div class="grid grid-2 section-gap">
                ${ruleList('Ingresos', incomeRules, model)}
                ${ruleList('Gastos', expenseRules, model)}
            </div>`;
    },

    mount(root, model) {
        const month = addMonths(startOfMonth(model.today), state.offset);
        const events = eventsFor(model, month, endOfMonth(month));
        const onClick = async event => {
            const forms = await import('../sheets/forms.js');
            const nav = event.target.closest('[data-month]');
            if (nav) { state.offset = nav.dataset.month === '0' ? 0 : state.offset + Number(nav.dataset.month); return app.rerender(); }
            if (event.target.closest('[data-new-rule]')) return forms.openRecurringSheet();
            const post = event.target.closest('[data-post]');
            if (post) {
                const rule = model.recurring.find(r => r.id === post.dataset.post);
                if (!rule) return;
                post.disabled = true;
                await postRecurring(rule, post.dataset.date);
                return toast(`${rule.name} registrado`, { tone: 'success' });
            }
            const ruleButton = event.target.closest('[data-rule]');
            if (ruleButton) return forms.openRecurringSheet({ rule: model.recurring.find(r => r.id === ruleButton.dataset.rule) });
            const ev = event.target.closest('[data-event]');
            if (ev) {
                const item = events.find(e => e.key === ev.dataset.event);
                if (!item) return;
                const actions = [];
                if (item.rule && !item.paid) actions.push({ label: 'Registrar ahora', icon: 'check', onClick: async () => { await postRecurring(item.rule, item.date); toast(`${item.rule.name} registrado`, { tone: 'success' }); } });
                if (item.rule) actions.push({ label: 'Editar regla', icon: 'edit', onClick: () => forms.openRecurringSheet({ rule: item.rule }) });
                if (item.accountId) actions.push({ label: 'Ver la cuenta', icon: 'wallet', onClick: () => app.go('#/cuentas') });
                if (item.debtId) actions.push({ label: 'Registrar pago del préstamo', icon: 'landmark', onClick: () => forms.openDebtPaymentSheet(model.debts.find(d => d.id === item.debtId)) });
                actionSheet({ title: item.name, subtitle: `${formatDate(item.date, 'long')} · ${item.label}${item.paid ? ' · registrado' : ''}`, actions });
            }
        };
        root.addEventListener('click', onClick);
        return () => root.removeEventListener('click', onClick);
    }
};

function eventsFor(model, from, to) {
    const events = [];
    for (const rule of model.recurring) {
        if (rule.active === false) continue;
        for (const date of occurrences(rule, from, to, 40)) {
            const key = `${rule.id}:${date}`;
            events.push({ key, date, rule, name: rule.name, kind: rule.type, paid: model.paidKeys.has(key), label: formatMoney(rule.amountMinor, rule.currency) });
        }
    }
    for (const account of model.accounts) {
        if (account.type !== 'credit' || !account.dueDay || account.archived) continue;
        let cursor = from;
        while (cursor <= to) {
            const due = nextMonthlyDay(Number(account.dueDay), cursor);
            if (due > to) break;
            events.push({ key: `card:${account.id}:${due}`, date: due, name: `Pago ${account.name}`, kind: 'expense', accountId: account.id, label: 'Fecha de pago de la tarjeta', paid: false });
            cursor = addDays(due, 1);
        }
    }
    for (const debt of model.debts) {
        if (debt.active === false || !debt.dueDay || model.recurring.some(r => r.debtId === debt.id)) continue;
        const due = nextMonthlyDay(Number(debt.dueDay), from);
        if (due <= to) events.push({ key: `debt:${debt.id}:${due}`, date: due, name: debt.name, kind: 'expense', debtId: debt.id, label: 'Cuota del préstamo', paid: false });
    }
    return events.sort((a, b) => (a.date < b.date ? -1 : 1));
}

function ruleList(title, rules, model) {
    return html`<article class="card">
        <div class="card-head"><div><h2>${title}</h2></div><button type="button" class="link-btn" data-new-rule>${icon('plus', { size: 14 })} Añadir</button></div>
        ${rules.length ? html`<div class="list">${rules.map(rule => {
            const next = rule.active === false ? null : nextOccurrence(rule, model.today);
            return html`<button type="button" class="tx" data-rule="${rule.id}" style="${rule.active === false ? 'opacity:.5' : ''}">
                ${catChip(model.catById.get(rule.categoryId) || { icon: 'repeat', tone: 'gray' })}
                <span class="tx-main"><span class="tx-title">${rule.name}</span><span class="tx-meta">${FREQUENCIES[rule.frequency] || ''}${next ? ` · ${relativeDays(model.today, next)}` : ' · pausado'}${rule.autoPost ? ' · automático' : ''}</span></span>
                <span class="tx-amount">${money(rule.type === 'expense' ? -rule.amountMinor : rule.amountMinor, rule.currency, { sign: rule.type === 'income', tone: rule.type === 'income' ? 'income' : 'none' })}</span>
            </button>`;
        })}</div>` : emptyState({ title: `Sin ${title.toLowerCase()} fijos`, body: title === 'Ingresos' ? 'Su salario, pensiones o alquileres que cobra.' : 'Alquiler, luz, agua, internet, suscripciones, marchamo…', iconName: 'repeat' })}
    </article>`;
}
