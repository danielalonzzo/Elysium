// GENERADO por scripts/sync-patrimonio-core.mjs desde Gestor-Patrimonios/js/core/alerts.js.
// No se edita aquí: se edita el original y se vuelve a ejecutar el script.
/**
 * Motor de alertas. Reglas deterministas, sin IA: cada alerta dice por qué
 * salta y con qué números.
 *
 * Cada alerta tiene un `id` estable que describe el hecho y su período
 * (`budget:comida:2026-09:80`). Con ese id la app recuerda qué se descartó y
 * el backend sabe qué correo ya envió: la misma situación no avisa dos veces.
 *
 * `email` marca cómo viaja por correo: `immediate` (en cuanto se registra el
 * movimiento que la provoca) o `daily` (en el resumen de la mañana).
 */
import { formatMoney, convertMinor, colonesToBase } from './money.js';
import { addDays, diffDays, formatDate, nextMonthlyDay } from './dates.js';

export const ALERT_KINDS = Object.freeze({
    budget: { group: 'budget' },
    pace: { group: 'budget' },
    unusual: { group: 'unusual' },
    due: { group: 'due' },
    'card-limit': { group: 'cards' },
    'card-due': { group: 'cards' },
    'debt-due': { group: 'due' },
    'goal-risk': { group: 'goals' },
    'goal-milestone': { group: 'goals' },
    'low-balance': { group: 'lowBalance' },
    large: { group: 'large' }
});

export const ALERT_GROUPS = Object.freeze({
    budget: 'Presupuestos',
    unusual: 'Gasto inusual',
    due: 'Pagos y cuotas próximos',
    cards: 'Tarjetas de crédito',
    goals: 'Metas',
    lowBalance: 'Saldo bajo',
    large: 'Gastos grandes'
});

const SEVERITY_ORDER = { danger: 0, warning: 1, info: 2, success: 3 };

/** Umbral por defecto para «gasto grande»: ₡100.000. */
export const DEFAULT_LARGE_EXPENSE = 10000000;
/** Una categoría necesita un gasto medio de al menos ₡10.000 para vigilar desvíos. */
const UNUSUAL_MIN_AVERAGE = 1000000;
const UNUSUAL_MIN_DELTA = 500000;
const UNUSUAL_THRESHOLD = 30;

/**
 * Los umbrales se piensan en colones y se aplican en la moneda principal: en
 * euros, «₡100.000» es «€170», no «€100.000».
 */
export function defaultLargeExpense(fx) {
    return colonesToBase(DEFAULT_LARGE_EXPENSE, fx);
}

function whenText(daysUntil) {
    if (daysUntil <= 0) return 'vence hoy';
    if (daysUntil === 1) return 'vence mañana';
    return `vence en ${daysUntil} días`;
}

/**
 * @param {object} ctx
 * @param {string} ctx.today
 * @param {{start: string, end: string, key: string, days: number}} ctx.period
 * @param {{base: string, rates: object}} ctx.fx  de money.fxFromSettings
 * @param {object} [ctx.settings]  { largeExpenseMinor, alerts: {budget: true, …} }
 * @param {Array} [ctx.categories]
 * @param {Array} [ctx.budgets]    [{ categoryId, status }]  (status de budgets.budgetStatus)
 * @param {Map}   [ctx.averages]   categoryId → gasto medio por período
 * @param {Map}   [ctx.spentByCategory] categoryId → gastado en el período
 * @param {Array} [ctx.upcoming]   de recurring.upcoming
 * @param {Array} [ctx.accounts]
 * @param {Map}   [ctx.balances]
 * @param {Array} [ctx.goals]      [{ goal, progress, health, required }]
 * @param {Array} [ctx.debts]
 * @param {Set}   [ctx.linkedDebtIds] préstamos con un recurrente propio (ese ya avisa del pago)
 * @param {Array} [ctx.recentExpenses] movimientos de gasto recientes
 */
export function evaluateAlerts(ctx) {
    const { today, period, fx } = ctx;
    const settings = ctx.settings || {};
    const enabled = settings.alerts || {};
    const isOn = kind => enabled[ALERT_KINDS[kind]?.group] !== false;
    const categoryName = id => (ctx.categories || []).find(c => c.id === id)?.name || 'Sin categoría';
    const base = fx?.base || 'CRC';
    const unusualMinAverage = convertMinor(UNUSUAL_MIN_AVERAGE, 'CRC', base, fx);
    const unusualMinDelta = convertMinor(UNUSUAL_MIN_DELTA, 'CRC', base, fx);
    const alerts = [];
    const push = alert => { if (isOn(alert.kind)) alerts.push({ date: today, ...alert }); };
    const flagged = new Set();

    // Presupuestos.
    for (const { categoryId, status } of ctx.budgets || []) {
        if (!status || !status.limit) continue;
        const name = categoryName(categoryId);
        if (status.state === 'over') {
            flagged.add(categoryId);
            push({
                id: `budget:${categoryId}:${period.key}:100`, kind: 'budget', severity: 'danger', email: 'immediate',
                title: `Presupuesto de ${name} excedido`,
                body: `Ha gastado ${formatMoney(status.spent, base)} de ${formatMoney(status.limit, base)} (${Math.round(status.pct)}%).`,
                route: '#/presupuestos', categoryId
            });
        } else if (status.state === 'warning') {
            flagged.add(categoryId);
            push({
                id: `budget:${categoryId}:${period.key}:80`, kind: 'budget', severity: 'warning', email: 'immediate',
                title: 'Atención',
                body: `Ha gastado un ${Math.round(status.pct)}% de su presupuesto de ${name.toLowerCase()}. Le quedan ${formatMoney(status.remaining, base)}.`,
                route: '#/presupuestos', categoryId
            });
        } else if (status.state === 'pace') {
            flagged.add(categoryId);
            push({
                id: `pace:${categoryId}:${period.key}`, kind: 'pace', severity: 'info', email: null,
                title: `Va rápido en ${name}`,
                body: `A este ritmo cerraría el período en ${formatMoney(status.projected, base)}, por encima de los ${formatMoney(status.limit, base)} previstos.`,
                route: '#/presupuestos', categoryId
            });
        }
    }

    // Gasto inusual frente al promedio a estas alturas del período.
    const elapsed = Math.min(period.days, Math.max(0, diffDays(period.start, today) + 1));
    const pace = period.days ? elapsed / period.days : 1;
    if (pace >= 0.25 && ctx.averages && ctx.spentByCategory) {
        for (const [categoryId, average] of ctx.averages) {
            if (flagged.has(categoryId) || average < unusualMinAverage) continue;
            const spent = ctx.spentByCategory.get(categoryId) || 0;
            const expected = average * pace;
            const above = expected > 0 ? (spent / expected - 1) * 100 : 0;
            if (above >= UNUSUAL_THRESHOLD && spent - expected >= unusualMinDelta) {
                push({
                    id: `unusual:${categoryId}:${period.key}`, kind: 'unusual', severity: 'warning', email: 'daily',
                    title: 'Gasto inusual detectado',
                    body: `Este mes ha gastado ${Math.round(above)}% más en ${categoryName(categoryId).toLowerCase()} de lo habitual a estas alturas.`,
                    route: '#/reportes', categoryId
                });
            }
        }
    }

    // Pagos recurrentes próximos (gastos), a 3 días.
    for (const item of ctx.upcoming || []) {
        if (item.rule.type !== 'expense' || item.daysUntil > 3) continue;
        push({
            id: `due:${item.rule.id}:${item.date}`, kind: 'due', severity: item.daysUntil <= 1 ? 'warning' : 'info', email: 'daily',
            title: `Pago próximo: ${item.rule.name}`,
            body: `${formatMoney(item.rule.amountMinor, item.rule.currency || base)} · ${whenText(item.daysUntil)} (${formatDate(item.date, 'short')}).`,
            route: '#/calendario', recurringId: item.rule.id
        });
    }

    // Tarjetas: límite y fecha de pago.
    for (const account of ctx.accounts || []) {
        if (account.archived || account.type !== 'credit') continue;
        const balance = ctx.balances?.get(account.id) || 0;
        const used = Math.max(0, -balance);
        const limit = Number(account.creditLimitMinor) || 0;
        if (limit > 0) {
            const pct = used / limit * 100;
            if (pct >= 80) {
                const level = pct >= 100 ? 100 : 80;
                push({
                    id: `card-limit:${account.id}:${period.key}:${level}`, kind: 'card-limit',
                    severity: level === 100 ? 'danger' : 'warning', email: 'immediate',
                    title: level === 100 ? `${account.name}: límite alcanzado` : `${account.name} cerca del límite`,
                    body: `Usa ${formatMoney(used, account.currency)} de ${formatMoney(limit, account.currency)} (${Math.round(pct)}%).`,
                    route: '#/cuentas', accountId: account.id
                });
            }
        }
        if (account.dueDay && used > 0) {
            const due = nextMonthlyDay(Number(account.dueDay), today);
            const days = diffDays(today, due);
            if (days <= 3) {
                push({
                    id: `card-due:${account.id}:${due}`, kind: 'card-due', severity: days <= 1 ? 'warning' : 'info', email: 'daily',
                    title: `Pago de ${account.name}`,
                    body: `Saldo de ${formatMoney(used, account.currency)} · ${whenText(days)} (${formatDate(due, 'short')}).`,
                    route: '#/cuentas', accountId: account.id
                });
            }
        }
    }

    // Saldo bajo en cuentas de dinero.
    for (const account of ctx.accounts || []) {
        if (account.archived || account.type === 'credit' || !(Number(account.lowBalanceAlertMinor) > 0)) continue;
        const balance = ctx.balances?.get(account.id) || 0;
        if (balance < Number(account.lowBalanceAlertMinor)) {
            push({
                id: `low-balance:${account.id}:${period.key}`, kind: 'low-balance', severity: 'warning', email: 'daily',
                title: `Saldo bajo en ${account.name}`,
                body: `Quedan ${formatMoney(balance, account.currency)}, por debajo de su mínimo de ${formatMoney(account.lowBalanceAlertMinor, account.currency)}.`,
                route: '#/cuentas', accountId: account.id
            });
        }
    }

    // Cuotas de préstamos.
    for (const debt of ctx.debts || []) {
        if (debt.active === false || !debt.dueDay || !(Number(debt.balanceMinor) > 0) || ctx.linkedDebtIds?.has(debt.id)) continue;
        const due = nextMonthlyDay(Number(debt.dueDay), today);
        const days = diffDays(today, due);
        if (days > 3) continue;
        if (debt.lastPaymentDate && diffDays(debt.lastPaymentDate, due) < 20) continue; // ya pagada este ciclo
        push({
            id: `debt-due:${debt.id}:${due}`, kind: 'debt-due', severity: days <= 1 ? 'warning' : 'info', email: 'daily',
            title: `Cuota de ${debt.name}`,
            body: `${formatMoney(debt.paymentMinor, debt.currency)} · ${whenText(days)} (${formatDate(due, 'short')}).`,
            route: '#/deudas', debtId: debt.id
        });
    }

    // Metas: riesgo e hitos.
    for (const entry of ctx.goals || []) {
        const { goal, progress, health } = entry;
        if (!goal || goal.status === 'archived') continue;
        if (health?.state === 'at-risk') {
            const required = entry.required ? ` Necesita ${formatMoney(entry.required, goal.currency || base)} al mes para llegar a tiempo.` : '';
            push({
                id: `goal-risk:${goal.id}:${period.key}`, kind: 'goal-risk', severity: 'warning', email: 'daily',
                title: `«${goal.name}» va en riesgo`,
                body: `Al ritmo actual llegaría el ${formatDate(health.eta.date, 'medium')}, ${health.lateDays} días tarde.${required}`,
                route: `#/metas/${goal.id}`, goalId: goal.id
            });
        }
        if (progress?.milestone >= 25) {
            const done = progress.milestone === 100;
            push({
                id: `goal-milestone:${goal.id}:${progress.milestone}`, kind: 'goal-milestone', severity: 'success', email: null,
                title: done ? `¡«${goal.name}» cumplida!` : `«${goal.name}» al ${progress.milestone}%`,
                body: done
                    ? `Juntó ${formatMoney(progress.target, goal.currency || base)}. Es hora de disfrutarlo.`
                    : `Lleva ${formatMoney(progress.saved, goal.currency || base)}; faltan ${formatMoney(progress.remaining, goal.currency || base)}.`,
                route: `#/metas/${goal.id}`, goalId: goal.id
            });
        }
    }

    // Gastos grandes de los últimos tres días.
    const largeThreshold = Number(settings.largeExpenseMinor) > 0 ? Number(settings.largeExpenseMinor) : defaultLargeExpense(fx);
    const since = addDays(today, -3);
    for (const tx of ctx.recentExpenses || []) {
        if (tx.type !== 'expense' || tx.adjustment || tx.date < since || tx.date > today) continue;
        const amount = tx.baseAmountMinor ?? tx.amountMinor;
        if (amount < largeThreshold) continue;
        push({
            id: `large:${tx.id}`, kind: 'large', severity: 'info', email: null,
            title: 'Gasto grande registrado',
            body: `${formatMoney(tx.amountMinor, tx.currency || base)}${tx.merchant ? ' en ' + tx.merchant : ''} · ${formatDate(tx.date, 'relative', today).toLowerCase()}.`,
            route: `#/movimientos/${tx.id}`, txId: tx.id
        });
    }

    return alerts.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));
}

/**
 * Alertas visibles: quita las descartadas y las aplazadas hasta una fecha
 * futura. `state` es `{ [alertId]: { dismissed: true } | { snoozeUntil: 'YYYY-MM-DD' } }`.
 */
export function visibleAlerts(alerts, state = {}, today) {
    return alerts.filter(alert => {
        const entry = state[alert.id];
        if (!entry) return true;
        if (entry.dismissed) return false;
        if (entry.snoozeUntil && entry.snoozeUntil > today) return false;
        return true;
    });
}

/**
 * Olvida los descartes y aplazamientos viejos. Casi todos los ids llevan su
 * fecha o su período y no vuelven a aparecer, así que guardarlos para siempre
 * solo engordaría el perfil. La excepción son los hitos de una meta
 * (`goal-milestone:<meta>:<hito>`): no llevan fecha y el hito sigue siendo
 * cierto, así que un descarte se conserva mientras la meta exista.
 *
 * @param {Record<string, {dismissed?: boolean, snoozeUntil?: string, at?: string}>} state
 * @param {{today: string, ttlDays: number, goalExists: (goalId: string) => boolean}} options
 */
export function pruneAlertState(state, { today, ttlDays, goalExists }) {
    const cutoff = addDays(today, -ttlDays);
    return Object.fromEntries(Object.entries(state || {}).filter(([id, value]) => {
        if (id.startsWith('goal-milestone:')) return goalExists(id.split(':')[1]);
        return (value?.snoozeUntil || value?.at || today) >= cutoff;
    }));
}
