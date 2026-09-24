/**
 * Primer uso: cinco pasos cortos y la app queda lista con sentido desde el
 * primer día (cuentas con saldo, un sueño y presupuestos razonables).
 */
import { app } from '../context.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money, formatMoney, currencySymbol } from '../ui/format.js';
import { rosette } from '../ui/guilloche.js';
import { GOAL_KINDS } from '../core/goals.js';
import { defaultCategories } from '../core/categories.js';
import { defaultLargeExpense } from '../core/alerts.js';
import { parseAmount, roundNice, CURRENCIES, CURRENCY_CODES, DEFAULT_FX_RATES, currencyInfo } from '../core/money.js';
import { todayISO } from '../core/dates.js';
import { toast } from '../ui/overlay.js';

/**
 * Cuentas de partida. La moneda de cada una sale de la principal (`base`) o de
 * la «otra» habitual (`second`), hasta que la persona la cambia en su fila.
 */
const ACCOUNT_PRESETS = [
    { key: 'efectivo', type: 'cash', role: 'base', icon: 'cash', tone: 'amber', on: true },
    { key: 'principal', type: 'bank', role: 'base', icon: 'landmark', tone: 'blue', on: true },
    { key: 'secundaria', type: 'bank', role: 'second', icon: 'banknote', tone: 'green', on: false },
    { key: 'tarjeta', type: 'credit', role: 'base', icon: 'credit-card', tone: 'violet', on: false },
    { key: 'ahorro', type: 'savings', role: 'base', icon: 'piggy-bank', tone: 'gold', on: false }
];

/** Ejemplos que se leen como cifras reales en cada moneda. */
const EXAMPLES = {
    CRC: { income: '850.000', target: '15.000.000', monthly: '100.000' },
    USD: { income: '2.500', target: '30.000', monthly: '300' },
    EUR: { income: '2.200', target: '25.000', monthly: '250' }
};

/** Porcentaje del ingreso que se sugiere para cada categoría variable. */
const BUDGET_SHARES = [['supermercado', 12], ['restaurantes', 6], ['combustible', 6], ['transporte', 3], ['ocio', 4], ['ropa', 3], ['suscripciones', 2]];

/** La «otra» moneda más común según la principal: en Costa Rica, dólares y colones van juntos. */
const secondCurrency = base => (base === 'USD' ? 'CRC' : 'USD');

export function renderOnboarding(root, done) {
    const user = app.user || {};
    const state = {
        step: 0,
        name: (app.store.profile?.displayName || user.displayName || '').split(' ')[0],
        base: 'CRC',
        payMode: 'monthly',
        payDay: 30,
        income: null,
        accounts: ACCOUNT_PRESETS.map(preset => ({ ...preset, currency: null, balance: null })),
        goal: { kind: 'carro', name: '', target: null, monthly: null, skip: false },
        budgets: BUDGET_SHARES.map(([categoryId, share]) => ({ categoryId, share, on: true, amount: null }))
    };
    const categories = defaultCategories();
    const STEPS = 5;

    const currencyOf = account => account.currency || (account.role === 'second' ? secondCurrency(state.base) : state.base);
    const accountName = account => {
        const currency = currencyOf(account);
        if (account.type === 'cash') return 'Efectivo';
        if (account.type === 'credit') return 'Tarjeta de crédito';
        if (account.type === 'savings') return 'Ahorros';
        const twin = state.accounts.find(other => other.type === 'bank' && other.key !== account.key);
        const repeated = account.key === 'secundaria' && twin && currencyOf(twin) === currency;
        return `${repeated ? 'Otra cuenta' : 'Cuenta'} en ${currencyInfo(currency).name.toLowerCase()}`;
    };
    const amountText = (minor, currency) => (minor ? formatMoney(minor, currency, { symbol: false, decimals: minor % 100 ? 2 : 0 }) : '');
    const moneyField = (currency, inner) => html`<span class="money-field"><span class="money-symbol" aria-hidden="true">${currencySymbol(currency)}</span>${inner}</span>`;

    const draw = () => {
        root.innerHTML = String(html`<div class="onboarding">
            <div class="onboarding-card card">
                <div class="steps" aria-hidden="true">${Array.from({ length: STEPS }, (_, i) => html`<span class="${i <= state.step ? 'is-done' : ''}"></span>`)}</div>
                ${[welcome, money_, accounts, dream, budgets][state.step]()}
                <p class="field-error" data-error hidden></p>
                <div class="onboarding-actions">
                    ${state.step ? html`<button type="button" class="btn btn-quiet" data-back>${icon('chevron-left', { size: 16 })}Atrás</button>` : html`<span></span>`}
                    <div class="row">
                        ${state.step === 3 ? html`<button type="button" class="btn btn-quiet" data-skip>Ahora no</button>` : ''}
                        <button type="button" class="btn ${state.step === STEPS - 1 ? 'btn-gold' : 'btn-primary'}" data-next>${state.step === STEPS - 1 ? html`${icon('sparkle', { size: 17 })}Empezar` : html`Continuar${icon('arrow-right', { size: 16 })}`}</button>
                    </div>
                </div>
            </div>
        </div>`);
        bind();
        root.querySelector('input:not([type="checkbox"])')?.focus();
    };

    function welcome() {
        return html`<div class="empty" style="padding:0 0 12px">${rosette({ seed: 'bienvenida', size: 150, layers: 4 })}</div>
            <p class="eyebrow is-gold">Elysium Patrimonio</p>
            <h1>Bienvenido${state.name ? `, ${state.name}` : ''}.</h1>
            <p class="onboarding-lead">En dos minutos dejamos su Patrimonio listo: cómo le pagan, dónde está su dinero, su primer sueño y unos presupuestos de partida. Todo se puede cambiar después.</p>
            <label class="field"><span>¿Cómo le llamamos?</span><input name="name" value="${state.name}" maxlength="60" autocomplete="given-name"></label>`;
    }

    function money_() {
        return html`<p class="eyebrow">Paso 2 de ${STEPS}</p><h1>Sus ingresos</h1>
            <p class="onboarding-lead">Con esto calculamos cuánto puede gastar al día y cuánto puede ahorrar.</p>
            <div class="form">
                <div class="field"><span>Moneda principal <small>en ella verá sus totales</small></span>
                    <div class="seg is-block currency-seg" role="group" aria-label="Moneda principal">
                        ${CURRENCY_CODES.map(code => html`<button type="button" data-base="${code}" aria-pressed="${state.base === code}"><b aria-hidden="true">${CURRENCIES[code].symbol}</b>${CURRENCIES[code].name}</button>`)}
                    </div>
                </div>
                <div class="field"><span>¿Cada cuánto le pagan?</span>
                    <div class="seg is-block" role="group" aria-label="Frecuencia de pago">
                        <button type="button" data-pay="monthly" aria-pressed="${state.payMode === 'monthly'}">Una vez al mes</button>
                        <button type="button" data-pay="semimonthly" aria-pressed="${state.payMode === 'semimonthly'}">Quincenal</button>
                    </div>
                </div>
                <div class="form-grid">
                    ${state.payMode === 'monthly'
                        ? html`<label class="field"><span>Día de pago</span><select name="payDay">${Array.from({ length: 31 }, (_, i) => html`<option value="${i + 1}" ${state.payDay === i + 1 ? 'selected' : ''}>Día ${i + 1}</option>`)}</select></label>`
                        : html`<div class="field"><span>Días de pago</span><div class="callout">${icon('calendar')}<span>El 15 y el último día del mes.</span></div></div>`}
                    <label class="field"><span>Ingreso mensual aproximado</span>${moneyField(state.base, html`<input name="income" inputmode="decimal" value="${amountText(state.income, state.base)}" placeholder="${EXAMPLES[state.base].income}">`)}</label>
                </div>
                <p class="field-hint">Incluya salario y otros ingresos habituales. No hace falta que sea exacto.</p>
            </div>`;
    }

    function accounts() {
        return html`<p class="eyebrow">Paso 3 de ${STEPS}</p><h1>¿Dónde está su dinero?</h1>
            <p class="onboarding-lead">Marque las cuentas que usa y escriba su saldo de hoy.</p>
            <div class="quick-list">${state.accounts.map((account, i) => {
                const currency = currencyOf(account);
                const name = accountName(account);
                return html`<div class="quick-row ${account.on ? '' : 'is-off'}">
                    <label class="quick-check">
                        <input type="checkbox" class="check-box" data-acc-on="${i}" ${account.on ? 'checked' : ''}>
                        <span class="cat-chip is-sm tone-${account.tone}">${icon(account.icon, { size: 16 })}</span>
                        <span class="quick-text"><b>${name}</b><small>${account.type === 'credit' ? 'Lo que debe hoy' : 'Saldo de hoy'}</small></span>
                    </label>
                    <span class="money-field">
                        <select class="money-currency" data-acc-currency="${i}" aria-label="Moneda de ${name}" ${account.on ? '' : 'disabled'}>${CURRENCY_CODES.map(code => html`<option value="${code}" ${code === currency ? 'selected' : ''}>${CURRENCIES[code].symbol}</option>`)}</select>
                        <input data-acc-balance="${i}" inputmode="decimal" value="${amountText(account.balance, currency)}" placeholder="0" aria-label="${account.type === 'credit' ? 'Deuda' : 'Saldo'} de ${name}" ${account.on ? '' : 'disabled'}>
                    </span>
                </div>`;
            })}</div>
            <p class="field-hint section-gap">Luego puede renombrarlas («BAC», «Visa»…) y añadir más en Cuentas.</p>`;
    }

    function dream() {
        const example = EXAMPLES[state.base];
        return html`<p class="eyebrow is-gold">Paso 4 de ${STEPS}</p><h1>¿Para qué está ahorrando?</h1>
            <p class="onboarding-lead">Su primer sueño. Le diremos cuánto falta y cuándo llega.</p>
            <div class="chips" style="margin-bottom:16px">${Object.entries(GOAL_KINDS).map(([kind, info]) => html`<button type="button" class="chip is-gold ${state.goal.kind === kind ? 'is-active' : ''}" data-kind="${kind}" aria-pressed="${state.goal.kind === kind}">${icon(info.icon, { size: 15 })}${info.label}</button>`)}</div>
            <div class="form-grid">
                <label class="field is-wide"><span>Nombre</span><input name="goalName" value="${state.goal.name}" placeholder="${{ carro: 'Land Cruiser 80', casa: 'Casa propia', viaje: 'Viaje a Japón', negocio: 'Mi soda', finca: 'Finca en la zona sur', emergencia: 'Fondo de emergencia', educacion: 'Maestría', otro: 'Mi sueño' }[state.goal.kind]}" maxlength="60"></label>
                <label class="field"><span>Cuánto necesita</span>${moneyField(state.base, html`<input name="goalTarget" inputmode="decimal" value="${amountText(state.goal.target, state.base)}" placeholder="${example.target}">`)}</label>
                <label class="field"><span>Aporte mensual <small>opcional</small></span>${moneyField(state.base, html`<input name="goalMonthly" inputmode="decimal" value="${amountText(state.goal.monthly, state.base)}" placeholder="${state.income ? amountText(roundNice(state.income * 0.1, state.base), state.base) : example.monthly}">`)}</label>
            </div>`;
    }

    function budgets() {
        const income = state.income || 0;
        return html`<p class="eyebrow">Paso 5 de ${STEPS}</p><h1>Presupuestos de partida</h1>
            <p class="onboarding-lead">${income ? html`Sugeridos para un ingreso de ${money(income, state.base, { decimals: income % 100 ? 2 : 0 })}. Ajuste o desmarque los que no quiera.` : 'Sin ingreso de referencia: escriba los montos que le parezcan.'}</p>
            <div class="quick-list">${state.budgets.map((budget, i) => {
                const category = categories.find(c => c.id === budget.categoryId);
                const suggested = budget.amount ?? (income ? roundNice(income * budget.share / 100, state.base) : null);
                return html`<div class="quick-row ${budget.on ? '' : 'is-off'}">
                    <label class="quick-check">
                        <input type="checkbox" class="check-box" data-bud-on="${i}" ${budget.on ? 'checked' : ''}>
                        <span class="cat-chip is-sm tone-${category.tone}">${icon(category.icon, { size: 16 })}</span>
                        <span class="quick-text"><b>${category.name}</b><small>${budget.share}% del ingreso</small></span>
                    </label>
                    ${moneyField(state.base, html`<input data-bud-amount="${i}" inputmode="decimal" value="${amountText(suggested, state.base)}" placeholder="0" aria-label="Presupuesto de ${category.name}" ${budget.on ? '' : 'disabled'}>`)}
                </div>`;
            })}</div>`;
    }

    function collect() {
        const value = name => root.querySelector(`[name="${name}"]`)?.value;
        if (state.step === 0) state.name = (value('name') || '').trim();
        if (state.step === 1) {
            state.payDay = Math.min(31, Math.max(1, Number(value('payDay')) || state.payDay));
            state.income = Math.abs(parseAmount(value('income')) || 0) || null;
        }
        if (state.step === 2) {
            root.querySelectorAll('[data-acc-balance]').forEach(input => {
                state.accounts[Number(input.dataset.accBalance)].balance = Math.abs(parseAmount(input.value) || 0);
            });
        }
        if (state.step === 3) {
            state.goal.name = (value('goalName') || '').trim();
            state.goal.target = Math.abs(parseAmount(value('goalTarget')) || 0) || null;
            state.goal.monthly = Math.abs(parseAmount(value('goalMonthly')) || 0) || null;
        }
        if (state.step === 4) {
            root.querySelectorAll('[data-bud-amount]').forEach(input => {
                state.budgets[Number(input.dataset.budAmount)].amount = Math.abs(parseAmount(input.value) || 0) || null;
            });
        }
    }

    function fail(message) {
        const error = root.querySelector('[data-error]');
        error.textContent = message;
        error.hidden = false;
    }

    function bind() {
        root.querySelector('[data-back]')?.addEventListener('click', () => { collect(); state.step -= 1; draw(); });
        root.querySelector('[data-skip]')?.addEventListener('click', () => { state.goal.skip = true; state.step += 1; draw(); });
        root.querySelectorAll('[data-pay]').forEach(button => button.addEventListener('click', () => { collect(); state.payMode = button.dataset.pay; draw(); }));
        root.querySelectorAll('[data-kind]').forEach(button => button.addEventListener('click', () => { collect(); state.goal.kind = button.dataset.kind; if (button.dataset.kind === 'emergencia' && !state.goal.name) state.goal.name = 'Fondo de emergencia'; draw(); }));
        root.querySelectorAll('[data-base]').forEach(button => button.addEventListener('click', () => { collect(); state.base = button.dataset.base; draw(); }));
        root.querySelectorAll('[data-acc-on]').forEach(box => box.addEventListener('change', () => { collect(); state.accounts[Number(box.dataset.accOn)].on = box.checked; draw(); }));
        root.querySelectorAll('[data-acc-currency]').forEach(select => select.addEventListener('change', () => {
            collect();
            state.accounts[Number(select.dataset.accCurrency)].currency = select.value;
            draw();
            root.querySelector(`[data-acc-balance="${select.dataset.accCurrency}"]`)?.focus();
        }));
        root.querySelectorAll('[data-bud-on]').forEach(box => box.addEventListener('change', () => { collect(); state.budgets[Number(box.dataset.budOn)].on = box.checked; draw(); }));
        root.querySelector('[data-next]').addEventListener('click', async () => {
            collect();
            if (state.step === 0 && !state.name) return fail('Escriba su nombre.');
            if (state.step === 2 && !state.accounts.some(a => a.on)) return fail('Marque al menos una cuenta.');
            if (state.step === 3 && !state.goal.skip && (!state.goal.name || !state.goal.target)) return fail('Póngale nombre y monto a su sueño, o elija «Ahora no».');
            if (state.step < STEPS - 1) { state.step += 1; draw(); return; }
            await finish();
        });
        root.querySelector('.onboarding-card').addEventListener('keydown', event => {
            if (event.key === 'Enter' && event.target.tagName === 'INPUT') root.querySelector('[data-next]').click();
        });
    }

    async function finish() {
        const button = root.querySelector('[data-next]');
        button.disabled = true;
        const today = todayISO();
        const ops = [];
        const existing = new Set(app.store.list('categories').map(c => c.id));
        for (const category of categories) if (!existing.has(category.id)) ops.push({ op: 'set', name: 'categories', id: category.id, data: category });
        state.accounts.filter(a => a.on).forEach((account, order) => {
            ops.push({ op: 'set', name: 'accounts', data: {
                name: accountName(account), type: account.type, currency: currencyOf(account), icon: account.icon, tone: account.tone,
                openingBalanceMinor: account.type === 'credit' ? -(account.balance || 0) : (account.balance || 0),
                openingDate: today, order, includeInNetWorth: true, archived: false
            } });
        });
        let goalId = null;
        if (!state.goal.skip && state.goal.name && state.goal.target) {
            goalId = app.store.newId('meta-');
            ops.push({ op: 'set', name: 'goals', id: goalId, data: {
                name: state.goal.name, kind: state.goal.kind, targetMinor: state.goal.target, currency: state.base,
                monthlyPlanMinor: state.goal.monthly, priority: 1, status: 'active', startDate: today, deadline: null, note: ''
            } });
        }
        for (const budget of state.budgets) {
            const amount = budget.amount ?? (state.income ? roundNice(state.income * budget.share / 100, state.base) : null);
            if (!budget.on || !amount) continue;
            ops.push({ op: 'set', name: 'budgets', id: budget.categoryId, data: { categoryId: budget.categoryId, amountMinor: amount, currency: state.base, rollover: false } });
        }
        try {
            await app.store.batch(ops);
            await app.store.saveProfile({
                displayName: state.name,
                onboarded: true,
                createdAt: today,
                settings: {
                    baseCurrency: state.base, fxRates: { USD: DEFAULT_FX_RATES.USD, EUR: DEFAULT_FX_RATES.EUR }, fxSource: 'auto', fxUpdatedAt: null,
                    payday: state.payMode === 'semimonthly' ? { mode: 'semimonthly' } : { mode: 'monthly', day: state.payDay },
                    periodStartDay: 1, expectedIncomeMinor: state.income, gamification: true, sounds: false,
                    largeExpenseMinor: defaultLargeExpense({ base: state.base, rates: DEFAULT_FX_RATES }), emergencyMonths: 6, taxId: '', alerts: {},
                    email: { immediate: true, daily: true, weekly: true, monthly: true }
                },
                alertState: {}, celebrated: {}, challenges: []
            });
            done();
            toast(goalId ? `Todo listo, ${state.name}. «${state.goal.name}» ya tiene su plan.` : `Todo listo, ${state.name}.`, { tone: 'gold', iconName: 'sparkle', duration: 5000 });
        } catch (error) {
            console.error(error);
            button.disabled = false;
            fail('No se pudo guardar. Revise su conexión y vuelva a intentarlo.');
        }
    }

    draw();
}
