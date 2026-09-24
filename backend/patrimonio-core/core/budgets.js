// GENERADO por scripts/sync-patrimonio-core.mjs desde Gestor-Patrimonios/js/core/budgets.js.
// No se edita aquí: se edita el original y se vuelve a ejecutar el script.
/**
 * Presupuestos por categoría y período.
 *
 * El dato que más ayuda no es el porcentaje gastado sino el ritmo: gastar el
 * 60% de la comida el día 10 es un problema; el día 25, no. Por eso cada
 * estado compara lo gastado con lo que «tocaba» haber gastado hasta hoy.
 */
import { diffDays } from './dates.js';
import { roundNice, percent, clamp } from './money.js';

export const WARNING_PCT = 80;

export const NATURES = Object.freeze({
    need: { label: 'Necesidades', target: 50 },
    want: { label: 'Deseos', target: 30 },
    saving: { label: 'Ahorro y deuda', target: 20 }
});

/**
 * @param {{limitMinor: number, spentMinor: number, period: {start: string, end: string, days: number},
 *          today: string, carryMinor?: number}} input
 */
export function budgetStatus({ limitMinor, spentMinor, period, today, carryMinor = 0 }) {
    const limit = Math.max(0, (Number(limitMinor) || 0) + Math.max(0, Number(carryMinor) || 0));
    const spent = Math.max(0, Number(spentMinor) || 0);
    const days = period.days || (diffDays(period.start, period.end) + 1);
    const elapsed = today > period.end ? days : clamp(diffDays(period.start, today) + 1, 0, days);
    const pace = days ? elapsed / days : 1;
    const expected = Math.round(limit * pace);
    const projected = pace > 0 ? Math.round(spent / pace) : spent;
    const pct = percent(spent, limit);
    const remaining = limit - spent;
    const daysLeft = Math.max(0, days - elapsed);

    let state = 'ok';
    if (limit > 0 && spent > limit) state = 'over';
    else if (limit > 0 && pct >= WARNING_PCT) state = 'warning';
    else if (limit > 0 && pace < 0.9 && spent > expected * 1.15 && projected > limit) state = 'pace';

    return {
        limit, spent, pct, pace: pace * 100, expected, projected, remaining,
        daysLeft, closed: today > period.end,
        // Lo que queda repartido entre hoy y los días que faltan.
        dailyAllowance: remaining > 0 && today <= period.end ? Math.floor(remaining / (daysLeft + 1)) : 0,
        state
    };
}

/** Sobrante del período anterior que pasa al actual (solo si sobró). */
export function carryOver(previousLimitMinor, previousSpentMinor) {
    return Math.max(0, (Number(previousLimitMinor) || 0) - (Number(previousSpentMinor) || 0));
}

/** Presupuesto sugerido a partir del gasto medio: un 5% de holgura, redondeado. */
export function suggestBudget(averageMinor, currency = 'CRC') {
    if (!averageMinor || averageMinor <= 0) return 0;
    return roundNice(averageMinor * 1.05, currency);
}

/** Reparto 50/30/20 de un ingreso mensual. */
export function rule503020(incomeMinor) {
    const income = Math.max(0, Number(incomeMinor) || 0);
    return {
        need: Math.round(income * 0.5),
        want: Math.round(income * 0.3),
        saving: Math.round(income * 0.2)
    };
}

/**
 * Gasto real por naturaleza (necesidad, deseo, ahorro) frente a la regla.
 * El «ahorro» real es lo que no se gastó más lo gastado en categorías de
 * ahorro o deuda.
 */
export function natureBreakdown(categories, categoryTotals, incomeMinor) {
    const natureOf = new Map((categories || []).map(category => [category.id, category.nature || 'want']));
    const actual = { need: 0, want: 0, saving: 0 };
    let spent = 0;
    for (const entry of categoryTotals || []) {
        const nature = natureOf.get(entry.categoryId) || 'want';
        actual[nature] += entry.total;
        spent += entry.total;
    }
    const income = Math.max(0, Number(incomeMinor) || 0);
    actual.saving += Math.max(0, income - spent);
    const target = rule503020(income);
    return Object.keys(NATURES).map(key => ({
        key,
        label: NATURES[key].label,
        targetPct: NATURES[key].target,
        actual: actual[key],
        target: target[key],
        actualPct: percent(actual[key], income)
    }));
}

/**
 * «Puedes gastar ₡X por día hasta el próximo pago».
 *
 * Con presupuestos, es lo que les queda repartido entre los días que faltan.
 * Sin ellos, se estima: ingreso esperado del período menos lo gastado y lo
 * comprometido (pagos fijos pendientes y aportes planeados a metas).
 */
export function dailySpendable({ statuses = [], daysLeft, expectedIncome = 0, spent = 0, committed = 0 }) {
    const days = Math.max(1, Number(daysLeft) || 1);
    if (statuses.length) {
        const remaining = statuses.reduce((sum, status) => sum + Math.max(0, status.remaining), 0);
        return { basis: 'budgets', remaining, perDay: Math.floor(remaining / days), days };
    }
    const remaining = Math.max(0, (Number(expectedIncome) || 0) - (Number(spent) || 0) - (Number(committed) || 0));
    return { basis: 'income', remaining, perDay: Math.floor(remaining / days), days };
}

export const STATE_LABELS = Object.freeze({
    ok: 'En orden',
    pace: 'Ritmo alto',
    warning: 'Cuidado',
    over: 'Excedido'
});
