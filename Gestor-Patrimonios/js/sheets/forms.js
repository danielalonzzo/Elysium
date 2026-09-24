/**
 * Formularios de cuentas, presupuestos, metas, aportes, recurrentes, deudas y
 * categorías. Todos usan `formSheet`.
 */
import { app } from '../context.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money } from '../ui/format.js';
import { toast } from '../ui/overlay.js';
import { formSheet, toggleFields, CURRENCY_OPTIONS } from './form-sheet.js';
import { ACCOUNT_TYPES } from '../core/stats.js';
import { GOAL_KINDS } from '../core/goals.js';
import { FREQUENCIES } from '../core/recurring.js';
import { NATURES, suggestBudget } from '../core/budgets.js';
import { monthlyPayment } from '../core/loans.js';
import { formatMoney } from '../core/money.js';
import { parseISO } from '../core/dates.js';
import { addContribution, payDebt } from '../services.js';
import { play } from '../ui/sounds.js';

const ACCOUNT_ICONS = { cash: 'cash', bank: 'landmark', savings: 'piggy-bank', cdp: 'building', investment: 'trending-up', credit: 'credit-card', asset: 'car' };
const ACCOUNT_TONES = { cash: 'amber', bank: 'blue', savings: 'gold', cdp: 'teal', investment: 'violet', credit: 'violet', asset: 'slate' };

/* ── Cuentas ──────────────────────────────────────────────────────────────── */

export function openAccountSheet({ account = null } = {}) {
    const editing = Boolean(account);
    const initialBalance = account ? Math.abs(account.openingBalanceMinor || 0) : null;
    return formSheet({
        title: editing ? 'Editar cuenta' : 'Nueva cuenta',
        subtitle: editing ? account.name : 'Dónde vive su dinero',
        values: {
            type: 'bank', currency: 'CRC', includeInNetWorth: true,
            ...account,
            openingBalanceMinor: initialBalance
        },
        fields: [
            { name: 'type', label: 'Tipo', type: 'chips', options: Object.entries(ACCOUNT_TYPES).map(([value, info]) => ({ value, label: info.label, icon: ACCOUNT_ICONS[value] })) },
            { name: 'name', label: 'Nombre', required: true, placeholder: 'Cuenta corriente, Visa, Efectivo…', maxLength: 60 },
            { name: 'currency', label: 'Moneda', type: 'select', options: CURRENCY_OPTIONS },
            { name: 'openingBalanceMinor', label: editing ? 'Saldo inicial' : 'Saldo actual', type: 'money', currencyField: 'currency', hint: editing ? 'Para corregir el saldo use «Ajustar saldo»' : 'Lo que hay hoy' },
            { name: 'creditLimitMinor', label: 'Límite de crédito', type: 'money', currencyField: 'currency' },
            { name: 'closingDay', label: 'Día de corte', type: 'number', min: 1, max: 31, step: 1 },
            { name: 'dueDay', label: 'Día de pago', type: 'number', min: 1, max: 31, step: 1 },
            { name: 'lowBalanceAlertMinor', label: 'Avisar si baja de', type: 'money', currencyField: 'currency', hint: 'opcional' },
            { name: 'includeInNetWorth', label: 'Cuenta para el patrimonio', type: 'switch', iconName: 'sigma', hint: 'Desactívelo para cuentas compartidas o de terceros.' },
            ...(editing ? [{ name: 'archived', label: 'Archivar', type: 'switch', iconName: 'archive', tone: 'gray', hint: 'Se oculta, pero su historial sigue contando.' }] : [])
        ],
        onChange(values, form) {
            const credit = values.type === 'credit';
            const asset = values.type === 'asset';
            toggleFields(form, {
                creditLimitMinor: credit, closingDay: credit, dueDay: credit,
                lowBalanceAlertMinor: !credit && !asset
            });
            const label = form.querySelector('[data-field="openingBalanceMinor"] > span');
            if (label && !editing) label.firstChild.textContent = credit ? 'Deuda actual en la tarjeta' : asset ? 'Valor estimado' : 'Saldo actual';
        },
        async onSubmit(values) {
            const type = values.type || 'bank';
            const doc = {
                ...(account || {}),
                name: values.name.slice(0, 60),
                type,
                currency: values.currency || 'CRC',
                icon: ACCOUNT_ICONS[type],
                tone: ACCOUNT_TONES[type],
                includeInNetWorth: values.includeInNetWorth !== false,
                archived: Boolean(values.archived),
                creditLimitMinor: type === 'credit' ? values.creditLimitMinor || null : null,
                closingDay: type === 'credit' ? values.closingDay || null : null,
                dueDay: type === 'credit' ? values.dueDay || null : null,
                lowBalanceAlertMinor: type !== 'credit' && type !== 'asset' ? values.lowBalanceAlertMinor || null : null
            };
            if (!editing) {
                const amount = values.openingBalanceMinor || 0;
                doc.openingBalanceMinor = type === 'credit' ? -amount : amount;
                doc.openingDate = app.model().today;
                doc.order = app.store.list('accounts').length;
            } else {
                doc.openingBalanceMinor = type === 'credit' ? -(values.openingBalanceMinor || 0) : (values.openingBalanceMinor || 0);
            }
            await app.store.save('accounts', doc);
            toast(editing ? 'Cuenta actualizada' : 'Cuenta creada', { tone: 'success' });
        },
        onDelete: editing ? async () => {
            const used = app.store.list('transactions').some(tx => tx.accountId === account.id || tx.toAccountId === account.id);
            if (used) {
                await app.store.patch('accounts', account.id, { archived: true });
                toast('La cuenta tiene movimientos: se archivó en lugar de borrarla.', { tone: 'info' });
            } else {
                await app.store.remove('accounts', account.id);
                toast('Cuenta eliminada');
            }
        } : null,
        deleteConfirm: { title: '¿Eliminar la cuenta?', body: 'Si tiene movimientos se archivará para no perder su historial.' }
    });
}

/** Ajuste de saldo: se anota la diferencia como movimiento de ajuste (no cuenta como gasto ni ingreso). */
export function openAdjustBalanceSheet(account) {
    const model = app.model();
    const current = model.balances.get(account.id) || 0;
    const credit = account.type === 'credit';
    return formSheet({
        title: 'Ajustar saldo',
        subtitle: account.name,
        size: 'sm',
        intro: html`<div class="callout">${icon('info')}<span>Hoy la app calcula ${money(credit ? -current : current, account.currency)}${credit ? ' de deuda' : ''}. Escriba el ${credit ? 'saldo adeudado' : 'saldo'} real y la diferencia quedará registrada como ajuste.</span></div>`,
        values: { real: Math.abs(current) },
        fields: [{ name: 'real', label: credit ? 'Deuda real' : 'Saldo real', type: 'money', currency: account.currency, required: false, wide: true }],
        async onSubmit(values) {
            const target = credit ? -(values.real || 0) : (values.real || 0);
            const diff = target - current;
            if (diff === 0) return;
            await app.store.save('transactions', {
                type: diff > 0 ? 'income' : 'expense',
                amountMinor: Math.abs(diff),
                currency: account.currency,
                date: model.today,
                accountId: account.id,
                categoryId: diff > 0 ? 'otros-ingresos' : 'otros-gastos',
                merchant: 'Ajuste de saldo',
                adjustment: true,
                createdDate: model.today
            });
            toast('Saldo ajustado', { tone: 'success' });
        }
    });
}

/* ── Presupuestos ─────────────────────────────────────────────────────────── */

export function openBudgetSheet({ categoryId = null } = {}) {
    const model = app.model();
    const existing = categoryId ? app.store.get('budgets', categoryId) : null;
    const used = new Set(app.store.list('budgets').map(b => b.categoryId));
    const options = model.expenseCats
        .filter(category => category.id === categoryId || !used.has(category.id))
        .map(category => ({ value: category.id, label: category.name }));
    if (!options.length) {
        toast('Todas sus categorías ya tienen presupuesto.', { tone: 'info' });
        return null;
    }
    const first = categoryId || options[0].value;
    return formSheet({
        title: existing ? 'Editar presupuesto' : 'Nuevo presupuesto',
        subtitle: 'Límite mensual por categoría',
        values: { categoryId: first, amountMinor: existing?.amountMinor || null, rollover: existing?.rollover || false },
        fields: [
            { name: 'categoryId', label: 'Categoría', type: 'select', options, wide: true },
            { name: 'amountMinor', label: 'Límite por período', type: 'money', required: true, wide: true },
            { name: 'suggestion', type: 'info', content: html`<div class="callout" data-suggestion>${icon('sparkle')}<span></span></div>` },
            { name: 'rollover', label: 'Acumular lo que sobre', type: 'switch', iconName: 'rotate-ccw', hint: 'Lo que no gaste pasa al período siguiente.' }
        ],
        onChange(values, form) {
            const average = model.avgByCategory.get(values.categoryId) || 0;
            const box = form.querySelector('[data-suggestion]');
            if (!box) return;
            if (!average) {
                box.querySelector('span').textContent = 'Aún no hay historial de esta categoría para sugerir un monto.';
                return;
            }
            const suggestion = suggestBudget(average);
            box.querySelector('span').innerHTML = String(html`En los últimos 3 meses gastó en promedio <b>${money(average)}</b>. Sugerencia: <button type="button" class="link-btn" data-use-suggestion="${suggestion}">${formatMoney(suggestion)}</button>`);
            box.querySelector('[data-use-suggestion]')?.addEventListener('click', event => {
                form.querySelector('[name="amountMinor"]').value = formatMoney(Number(event.target.dataset.useSuggestion), 'CRC', { symbol: false });
            });
        },
        async onSubmit(values) {
            if (existing && existing.categoryId !== values.categoryId) await app.store.remove('budgets', existing.id);
            await app.store.save('budgets', {
                id: values.categoryId,
                categoryId: values.categoryId,
                amountMinor: values.amountMinor,
                currency: model.fx.base,
                rollover: Boolean(values.rollover)
            });
            play('success');
            toast('Presupuesto guardado', { tone: 'success' });
        },
        onDelete: existing ? () => app.store.remove('budgets', existing.id) : null,
        deleteConfirm: { title: '¿Quitar este presupuesto?', body: 'Sus movimientos no cambian.' }
    });
}

/* ── Metas ────────────────────────────────────────────────────────────────── */

export function openGoalSheet({ goal = null, kind = null } = {}) {
    const model = app.model();
    const editing = Boolean(goal);
    const initialKind = goal?.kind || kind || 'carro';
    return formSheet({
        title: editing ? 'Editar meta' : '¿Para qué está ahorrando?',
        subtitle: editing ? goal.name : 'Nuevo sueño',
        gold: true,
        values: {
            kind: initialKind,
            currency: 'CRC',
            priority: '2',
            ...goal,
            targetMinor: goal?.targetMinor ?? (initialKind === 'emergencia' ? model.emergency.suggested || null : null),
            name: goal?.name || (initialKind === 'emergencia' ? 'Fondo de emergencia' : ''),
            priority: String(goal?.priority || 2)
        },
        fields: [
            { name: 'kind', label: 'Tipo de sueño', type: 'chips', gold: true, options: Object.entries(GOAL_KINDS).map(([value, info]) => ({ value, label: info.label, icon: info.icon })) },
            { name: 'name', label: 'Nombre', required: true, placeholder: 'Land Cruiser 80, Casa en Grecia…', maxLength: 60, wide: true },
            { name: 'targetMinor', label: 'Cuánto necesita', type: 'money', currencyField: 'currency', required: true },
            { name: 'currency', label: 'Moneda', type: 'select', options: CURRENCY_OPTIONS },
            { name: 'deadline', label: 'Para cuándo', type: 'date', hint: 'opcional' },
            { name: 'monthlyPlanMinor', label: 'Aporte mensual', type: 'money', currencyField: 'currency', hint: 'vacío = se reparte su capacidad' },
            { name: 'emergencyHint', type: 'info', content: html`<div class="callout is-gold">${icon('shield')}<span>Un fondo de emergencia sano cubre ${model.settings.emergencyMonths || 6} meses de gastos. Con su gasto promedio serían <b>${money(model.emergency.suggested)}</b>.</span></div>`, hiddenInitially: initialKind !== 'emergencia' },
            { name: 'priority', label: 'Prioridad', type: 'chips', options: [{ value: '1', label: 'Alta' }, { value: '2', label: 'Media' }, { value: '3', label: 'Baja' }] },
            { name: 'note', label: 'Por qué importa', type: 'textarea', placeholder: 'Escriba lo que lo motiva. Lo verá cada vez que abra la meta.', maxLength: 280 },
            ...(!editing ? [{ name: 'initialMinor', label: 'Ya tiene ahorrado', type: 'money', currencyField: 'currency', hint: 'opcional' }] : [])
        ],
        onChange(values, form) {
            toggleFields(form, { emergencyHint: values.kind === 'emergencia' });
            const name = form.querySelector('[name="name"]');
            if (!editing && values.kind === 'emergencia' && name && !name.value) name.value = 'Fondo de emergencia';
        },
        async onSubmit(values) {
            const doc = {
                ...(goal || {}),
                name: values.name.slice(0, 60),
                kind: values.kind || 'otro',
                targetMinor: values.targetMinor,
                currency: values.currency || 'CRC',
                deadline: values.deadline || null,
                monthlyPlanMinor: values.monthlyPlanMinor || null,
                priority: Number(values.priority) || 2,
                note: values.note?.slice(0, 280) || '',
                status: goal?.status || 'active',
                startDate: goal?.startDate || model.today
            };
            const id = await app.store.save('goals', doc);
            if (!editing && values.initialMinor > 0) await addContribution({ goalId: id, amountMinor: values.initialMinor, date: model.today, note: 'Saldo inicial' });
            toast(editing ? 'Meta actualizada' : `«${doc.name}» ya es una meta. ¡A por ella!`, { tone: 'gold', iconName: 'target' });
            if (!editing) app.go(`#/metas/${id}`);
        },
        onDelete: editing ? async () => {
            const ops = app.store.list('contributions').filter(c => c.goalId === goal.id).map(c => ({ op: 'delete', name: 'contributions', id: c.id }));
            ops.push({ op: 'delete', name: 'goals', id: goal.id });
            await app.store.batch(ops);
            if (goal.cover?.path) app.store.removeFile(goal.cover.path);
            toast('Meta eliminada');
            app.go('#/metas');
        } : null,
        deleteConfirm: { title: '¿Eliminar esta meta?', body: 'Se borran también sus aportes. Si ya la cumplió, mejor márquela como cumplida.' }
    });
}

export function openContributionSheet({ goalId, withdraw = false }) {
    const model = app.model();
    const entry = model.goals.find(g => g.goal.id === goalId);
    if (!entry) return null;
    const { goal, progress } = entry;
    const { m } = parseISO(model.today);
    const aguinaldoSeason = m === 12 || m === 1;
    return formSheet({
        title: withdraw ? 'Retirar de la meta' : 'Aportar a la meta',
        subtitle: goal.name,
        size: 'sm',
        gold: !withdraw,
        intro: html`<div class="kpi-row"><div class="kv"><small>Ahorrado</small><b>${money(progress.saved, goal.currency)}</b></div><div class="kv"><small>Falta</small><b>${money(progress.remaining, goal.currency)}</b></div></div>`,
        values: { amountMinor: withdraw ? null : (entry.planned || null), date: model.today, aguinaldo: false },
        fields: [
            { name: 'amountMinor', label: withdraw ? 'Cuánto retira' : 'Cuánto aporta', type: 'money', currency: goal.currency, required: true },
            { name: 'date', label: 'Fecha', type: 'date' },
            { name: 'note', label: 'Nota', placeholder: withdraw ? '¿Para qué lo usó?' : 'Opcional', maxLength: 120, wide: true },
            ...(!withdraw && aguinaldoSeason ? [{ name: 'aguinaldo', label: 'Viene del aguinaldo', type: 'switch', iconName: 'gift', tone: 'gold', hint: 'Cuenta para la insignia «Aguinaldo sabio».' }] : [])
        ],
        submitLabel: withdraw ? 'Retirar' : 'Aportar',
        async onSubmit(values) {
            if (withdraw && values.amountMinor > progress.saved) return 'No puede retirar más de lo ahorrado.';
            const note = [values.aguinaldo ? 'Aguinaldo' : '', values.note || ''].filter(Boolean).join(' · ');
            await addContribution({ goalId, amountMinor: withdraw ? -values.amountMinor : values.amountMinor, date: values.date || model.today, note });
            const newSaved = progress.saved + (withdraw ? -values.amountMinor : values.amountMinor);
            if (!withdraw && newSaved >= progress.target && !progress.done) {
                await app.store.patch('goals', goal.id, { status: 'done', completedAt: model.today });
                toast(`¡«${goal.name}» cumplida! Juntó ${formatMoney(progress.target, goal.currency)}.`, { tone: 'gold', iconName: 'trophy', duration: 6000 });
                document.dispatchEvent(new CustomEvent('patrimonio:celebrate'));
            } else {
                toast(withdraw ? 'Retiro registrado' : `Aporte registrado. Faltan ${formatMoney(Math.max(0, progress.target - newSaved), goal.currency)}.`, { tone: withdraw ? 'info' : 'gold', iconName: withdraw ? 'arrow-up-right' : 'coins' });
            }
        }
    });
}

/* ── Recurrentes ──────────────────────────────────────────────────────────── */

export function openRecurringSheet({ rule = null, preset = {} } = {}) {
    const model = app.model();
    const editing = Boolean(rule);
    const accounts = model.accounts.filter(a => !a.archived && a.type !== 'asset');
    const categoryOptions = type => (type === 'income' ? model.incomeCats : model.expenseCats).map(c => ({ value: c.id, label: c.name }));
    const initial = { type: 'expense', currency: 'CRC', frequency: 'monthly', anchorDate: model.today, accountId: accounts[0]?.id, autoPost: false, active: true, ...preset, ...rule };
    return formSheet({
        title: editing ? 'Editar recurrente' : 'Nuevo pago o ingreso fijo',
        subtitle: 'Salario, alquiler, servicios, suscripciones…',
        values: initial,
        fields: [
            { name: 'type', label: 'Tipo', type: 'chips', options: [{ value: 'expense', label: 'Gasto', icon: 'arrow-up-right' }, { value: 'income', label: 'Ingreso', icon: 'arrow-down-left' }] },
            { name: 'name', label: 'Nombre', required: true, placeholder: 'Alquiler, Luz, Salario…', maxLength: 60 },
            { name: 'amountMinor', label: 'Monto', type: 'money', currencyField: 'currency', required: true },
            { name: 'currency', label: 'Moneda', type: 'select', options: CURRENCY_OPTIONS },
            { name: 'frequency', label: 'Frecuencia', type: 'select', options: Object.entries(FREQUENCIES).map(([value, label]) => ({ value, label })) },
            { name: 'anchorDate', label: 'Próxima fecha', type: 'date', required: true, hint: 'las demás se calculan desde aquí' },
            { name: 'categoryId', label: 'Categoría', type: 'select', options: categoryOptions(initial.type) },
            { name: 'accountId', label: 'Cuenta', type: 'select', options: accounts.map(a => ({ value: a.id, label: `${a.name} · ${a.currency}` })) },
            { name: 'autoPost', label: 'Registrar automáticamente', type: 'switch', iconName: 'zap', hint: 'Se anota solo al llegar la fecha. Si no, se lo recordamos para que lo confirme.' },
            ...(editing ? [{ name: 'active', label: 'Activo', type: 'switch', iconName: 'repeat', tone: 'green' }] : [])
        ],
        onChange(values, form) {
            const select = form.querySelector('[name="categoryId"]');
            const wanted = values.type === 'income' ? 'income' : 'expense';
            if (select && select.dataset.kind !== wanted) {
                select.dataset.kind = wanted;
                const current = select.value;
                select.innerHTML = categoryOptions(wanted).map(option => `<option value="${option.value}">${option.label}</option>`).join('');
                if ([...select.options].some(option => option.value === current)) select.value = current;
            }
        },
        async onSubmit(values) {
            await app.store.save('recurring', {
                ...(rule || {}),
                type: values.type,
                name: values.name.slice(0, 60),
                amountMinor: values.amountMinor,
                currency: values.currency || 'CRC',
                frequency: values.frequency,
                anchorDate: values.anchorDate,
                categoryId: values.categoryId,
                accountId: values.accountId,
                autoPost: Boolean(values.autoPost),
                active: values.active !== false,
                lastPostedDate: rule?.lastPostedDate || null
            });
            toast(editing ? 'Recurrente actualizado' : 'Recurrente creado', { tone: 'success', iconName: 'repeat' });
        },
        onDelete: editing ? () => app.store.remove('recurring', rule.id) : null,
        deleteConfirm: { title: '¿Eliminar este recurrente?', body: 'Los movimientos ya registrados se quedan.' }
    });
}

/* ── Deudas ───────────────────────────────────────────────────────────────── */

export function openDebtSheet({ debt = null, preset = {} } = {}) {
    const model = app.model();
    const editing = Boolean(debt);
    return formSheet({
        title: editing ? 'Editar préstamo' : 'Nuevo préstamo o deuda',
        subtitle: editing ? debt.name : 'Vehículo, vivienda, personal…',
        values: { kind: 'personal', currency: 'CRC', startDate: model.today, dueDay: 15, ...preset, ...debt },
        fields: [
            { name: 'name', label: 'Nombre', required: true, placeholder: 'Préstamo del carro', maxLength: 60 },
            { name: 'lender', label: 'Entidad', placeholder: 'Banco, cooperativa…', maxLength: 60 },
            { name: 'kind', label: 'Tipo', type: 'select', options: [{ value: 'vehicle', label: 'Vehículo' }, { value: 'mortgage', label: 'Vivienda' }, { value: 'personal', label: 'Personal' }, { value: 'student', label: 'Estudios' }, { value: 'other', label: 'Otro' }] },
            { name: 'currency', label: 'Moneda', type: 'select', options: CURRENCY_OPTIONS },
            { name: 'principalMinor', label: 'Monto original', type: 'money', currencyField: 'currency' },
            { name: 'balanceMinor', label: 'Saldo pendiente hoy', type: 'money', currencyField: 'currency', required: true },
            { name: 'annualRate', label: 'Tasa anual', type: 'number', suffix: '%', min: 0, max: 99, step: 0.01, required: true },
            { name: 'termMonths', label: 'Plazo total', type: 'number', suffix: 'meses', min: 1, max: 480, step: 1 },
            { name: 'paymentMinor', label: 'Cuota mensual', type: 'money', currencyField: 'currency', required: true, hint: 'la del banco' },
            { name: 'dueDay', label: 'Día de pago', type: 'number', min: 1, max: 31, step: 1 },
            { name: 'startDate', label: 'Fecha de inicio', type: 'date' },
            { name: 'calc', type: 'info', content: html`<p class="field-hint" data-calc></p>` }
        ],
        onChange(values, form) {
            const box = form.querySelector('[data-calc]');
            if (!box) return;
            if (values.principalMinor && values.annualRate && values.termMonths) {
                const estimate = monthlyPayment(values.principalMinor, values.annualRate, values.termMonths);
                box.innerHTML = String(html`${icon('calculator', { size: 14 })} Con esos datos la cuota sería de unos <b>${formatMoney(estimate, values.currency)}</b> (sin seguros).`);
            } else box.textContent = '';
        },
        async onSubmit(values) {
            await app.store.save('debts', {
                ...(debt || {}),
                name: values.name.slice(0, 60),
                lender: values.lender?.slice(0, 60) || '',
                kind: values.kind,
                currency: values.currency || 'CRC',
                principalMinor: values.principalMinor || values.balanceMinor,
                balanceMinor: values.balanceMinor,
                annualRate: Number(values.annualRate) || 0,
                termMonths: values.termMonths || null,
                paymentMinor: values.paymentMinor,
                dueDay: values.dueDay || null,
                startDate: values.startDate || model.today,
                active: values.balanceMinor > 0
            });
            toast(editing ? 'Préstamo actualizado' : 'Préstamo registrado', { tone: 'success' });
        },
        onDelete: editing ? () => app.store.remove('debts', debt.id) : null,
        deleteConfirm: { title: '¿Eliminar este préstamo?', body: 'Los pagos ya registrados se quedan como gastos.' }
    });
}

export function openDebtPaymentSheet(debt) {
    const model = app.model();
    const accounts = model.accounts.filter(a => !a.archived && a.type !== 'asset' && a.type !== 'credit');
    return formSheet({
        title: 'Registrar pago',
        subtitle: debt.name,
        size: 'sm',
        intro: html`<div class="callout">${icon('info')}<span>Se reparte en intereses y capital según la tasa (${debt.annualRate}%). El saldo baja solo por la parte de capital.</span></div>`,
        values: { amountMinor: debt.paymentMinor, date: model.today, accountId: accounts[0]?.id },
        fields: [
            { name: 'amountMinor', label: 'Monto pagado', type: 'money', currency: debt.currency, required: true },
            { name: 'date', label: 'Fecha', type: 'date' },
            { name: 'accountId', label: 'Desde la cuenta', type: 'select', options: accounts.map(a => ({ value: a.id, label: a.name })), wide: true }
        ],
        submitLabel: 'Registrar pago',
        async onSubmit(values) {
            const result = await payDebt(debt, { amountMinor: values.amountMinor, date: values.date || model.today, accountId: values.accountId });
            if (result.balance === 0) {
                toast(`¡${debt.name} saldado! Ya está libre de esa deuda.`, { tone: 'gold', iconName: 'unlock', duration: 6000 });
                document.dispatchEvent(new CustomEvent('patrimonio:celebrate'));
            } else {
                toast(`Pago registrado: ${formatMoney(result.principal, debt.currency)} a capital, ${formatMoney(result.interest, debt.currency)} de intereses.`, { tone: 'success', duration: 5000 });
            }
        }
    });
}

/* ── Categorías ───────────────────────────────────────────────────────────── */

const CATEGORY_ICONS = ['cart', 'utensils', 'fuel', 'bus', 'car', 'home', 'bolt', 'heart', 'book', 'repeat', 'ticket', 'shirt', 'sofa', 'paw', 'gift', 'plane', 'landmark', 'receipt', 'briefcase', 'laptop', 'tag', 'trending-up', 'coins', 'phone', 'sprout', 'star', 'dots'];
const TONES = ['blue', 'sky', 'cyan', 'teal', 'green', 'amber', 'orange', 'red', 'rose', 'pink', 'magenta', 'violet', 'indigo', 'slate', 'gray', 'gold'];

export function openCategorySheet({ category = null, kind = 'expense' } = {}) {
    const editing = Boolean(category);
    return formSheet({
        title: editing ? 'Editar categoría' : 'Nueva categoría',
        values: { kind, icon: 'tag', tone: 'blue', nature: 'want', ...category },
        fields: [
            { name: 'name', label: 'Nombre', required: true, maxLength: 40, wide: true },
            ...(!editing ? [{ name: 'kind', label: 'Tipo', type: 'chips', options: [{ value: 'expense', label: 'Gasto' }, { value: 'income', label: 'Ingreso' }] }] : []),
            { name: 'nature', label: 'Naturaleza (regla 50/30/20)', type: 'chips', options: Object.entries(NATURES).map(([value, info]) => ({ value, label: info.label })) },
            { name: 'icon', label: 'Icono', type: 'icons', options: CATEGORY_ICONS.map(value => ({ value, icon: value })) },
            { name: 'tone', label: 'Color', type: 'icons', options: TONES.map(value => ({ value, icon: 'dots', label: value })) },
            ...(editing ? [{ name: 'archived', label: 'Archivar', type: 'switch', iconName: 'archive', tone: 'gray', hint: 'Deja de aparecer al registrar, pero su historial se conserva.' }] : [])
        ],
        onMount(form) {
            form.querySelectorAll('[data-chip-field="tone"]').forEach(button => {
                button.innerHTML = `<span class="cat-chip is-sm tone-${button.dataset.value}" style="width:20px;height:20px;border-radius:50%;background:var(--chip-ink)"></span>`;
            });
        },
        onChange(values, form) {
            toggleFields(form, { nature: (values.kind || category?.kind) !== 'income' });
        },
        async onSubmit(values) {
            const id = category?.id || app.store.newId('cat-');
            await app.store.save('categories', {
                ...(category || {}),
                id,
                name: values.name.slice(0, 40),
                kind: category?.kind || values.kind || 'expense',
                icon: values.icon || 'tag',
                tone: values.tone || 'blue',
                nature: (category?.kind || values.kind) === 'income' ? null : values.nature || 'want',
                archived: Boolean(values.archived),
                order: category?.order ?? 50
            });
            toast(editing ? 'Categoría actualizada' : 'Categoría creada', { tone: 'success' });
        }
    });
}
