/**
 * Pagos e ingresos que se repiten: salario, alquiler, servicios, marchamo.
 *
 * Una regla guarda su frecuencia y un ancla (`anchorDate`, la primera
 * ocurrencia). Las fechas siguientes se derivan siempre del ancla, no de la
 * última, para que un día 31 no se vaya corriendo a 28, 28, 28…
 */
import { addDays, addMonths, daysInMonth, diffDays, parseISO, toISO } from './dates.js';

export const FREQUENCIES = Object.freeze({
    weekly: 'Semanal',
    biweekly: 'Cada dos semanas',
    semimonthly: 'Quincenal (15 y fin de mes)',
    monthly: 'Mensual',
    bimonthly: 'Bimestral',
    quarterly: 'Trimestral',
    yearly: 'Anual'
});

const MONTH_STEP = { monthly: 1, bimonthly: 2, quarterly: 3, yearly: 12 };

function monthlyOccurrence(anchor, index) {
    const a = parseISO(anchor);
    const shifted = parseISO(addMonths(toISO(a.y, a.m, 1), index));
    return toISO(shifted.y, shifted.m, Math.min(a.d, daysInMonth(shifted.y, shifted.m)));
}

/**
 * Ocurrencias de `rule` entre `from` y `until` (ambos incluidos).
 * @param {{frequency: string, anchorDate: string, endDate?: string}} rule
 */
export function occurrences(rule, from, until, limit = 400) {
    const anchor = rule?.anchorDate;
    if (!anchor || !parseISO(anchor) || !from || !until || from > until) return [];
    const end = rule.endDate && rule.endDate < until ? rule.endDate : until;
    const dates = [];

    if (rule.frequency === 'weekly' || rule.frequency === 'biweekly') {
        const step = rule.frequency === 'weekly' ? 7 : 14;
        const offset = diffDays(anchor, from);
        let k = Math.max(0, Math.ceil(offset / step));
        let date = addDays(anchor, k * step);
        while (date <= end && dates.length < limit) {
            if (date >= from) dates.push(date);
            k += 1;
            date = addDays(anchor, k * step);
        }
        return dates;
    }

    if (rule.frequency === 'semimonthly') {
        // Día 15 y último día de cada mes, desde el ancla.
        let cursor = toISO(parseISO(from).y, parseISO(from).m, 1);
        while (cursor <= end && dates.length < limit) {
            const p = parseISO(cursor);
            for (const d of [15, daysInMonth(p.y, p.m)]) {
                const date = toISO(p.y, p.m, d);
                if (date >= anchor && date >= from && date <= end) dates.push(date);
            }
            cursor = addMonths(cursor, 1);
        }
        return dates;
    }

    const step = MONTH_STEP[rule.frequency] || 1;
    const a = parseISO(anchor);
    const f = parseISO(from);
    let k = Math.max(0, Math.floor(((f.y - a.y) * 12 + (f.m - a.m)) / step) - 1);
    let date = monthlyOccurrence(anchor, k * step);
    while (date <= end && dates.length < limit) {
        if (date >= from) dates.push(date);
        k += 1;
        date = monthlyOccurrence(anchor, k * step);
    }
    return dates;
}

/** Próxima ocurrencia en o después de `from`. */
export function nextOccurrence(rule, from) {
    const horizon = addDays(from, rule?.frequency === 'yearly' ? 400 : 120);
    return occurrences(rule, from, horizon, 1)[0] || null;
}

/**
 * Lo que viene en los próximos `days` días, ordenado por fecha. Las reglas
 * inactivas no cuentan. `paidKeys` son las ocurrencias ya confirmadas
 * (`${ruleId}:${fecha}`), para no volver a avisar de algo pagado.
 */
export function upcoming(rules, today, days = 30, paidKeys = new Set()) {
    const until = addDays(today, days);
    const items = [];
    for (const rule of rules || []) {
        if (rule.active === false) continue;
        for (const date of occurrences(rule, today, until, 12)) {
            const key = `${rule.id}:${date}`;
            if (paidKeys.has(key)) continue;
            items.push({ rule, date, key, daysUntil: diffDays(today, date) });
        }
    }
    return items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Ocurrencias vencidas y sin registrar: desde `lookbackDays` atrás hasta ayer
 * (lo de hoy aún está «por venir»). Son las que esperan confirmación.
 */
export function overdue(rules, today, { lookbackDays = 20, perRule = 3, paidKeys = new Set() } = {}) {
    const from = addDays(today, -lookbackDays);
    const until = addDays(today, -1);
    const items = [];
    for (const rule of rules || []) {
        if (rule.active === false) continue;
        for (const date of occurrences(rule, from, until, perRule)) {
            const key = `${rule.id}:${date}`;
            if (!paidKeys.has(key)) items.push({ rule, date, key, daysLate: diffDays(date, today) });
        }
    }
    return items;
}

/**
 * Lo que las reglas activas cobran y pagan de verdad entre `from` y `to`,
 * contando cada ocurrencia: un mes con cinco viernes trae cinco pagos
 * semanales y uno con cuatro, cuatro. `toBase(importe, moneda)` lo lleva a la
 * moneda principal.
 *
 * @param {Array<object>} rules
 * @param {string} from
 * @param {string} to
 * @param {(amountMinor: number, currency?: string) => number} [toBase]
 */
export function occurrenceTotals(rules, from, to, toBase = amount => amount) {
    const totals = { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
    for (const rule of rules || []) {
        if (rule.active === false || (rule.type !== 'income' && rule.type !== 'expense')) continue;
        const count = occurrences(rule, from, to).length;
        if (!count) continue;
        totals[rule.type] += count * toBase(Number(rule.amountMinor) || 0, rule.currency);
        totals[`${rule.type}Count`] += count;
    }
    return totals;
}

/**
 * Monto mensual promedio de una regla a lo largo del año (un pago semanal son
 * 52/12 ≈ 4,33 al mes). Sirve para planificar; lo de un mes concreto lo da
 * `occurrenceTotals`, porque unos meses traen cuatro semanas y otros cinco.
 */
export function monthlyEquivalent(rule) {
    const amount = Number(rule?.amountMinor) || 0;
    switch (rule?.frequency) {
        case 'weekly': return Math.round(amount * 52 / 12);
        case 'biweekly': return Math.round(amount * 26 / 12);
        case 'semimonthly': return amount * 2;
        case 'bimonthly': return Math.round(amount / 2);
        case 'quarterly': return Math.round(amount / 3);
        case 'yearly': return Math.round(amount / 12);
        default: return amount;
    }
}

/**
 * Siguiente día de pago según los ajustes (`payday`): mensual en un día fijo o
 * quincenal (15 y último). Devuelve la fecha y los días que faltan.
 */
export function nextPayday(payday, today) {
    const mode = payday?.mode || 'monthly';
    let rule;
    if (mode === 'semimonthly') {
        rule = { frequency: 'semimonthly', anchorDate: '2000-01-15' };
    } else if (mode === 'biweekly' && payday?.anchorDate) {
        rule = { frequency: 'biweekly', anchorDate: payday.anchorDate };
    } else {
        const day = Math.min(Math.max(Number(payday?.day) || 30, 1), 31);
        rule = { frequency: 'monthly', anchorDate: toISO(2000, 1, Math.min(day, 31)) };
    }
    // El día de pago de hoy ya cobrado: se mira desde mañana.
    const date = nextOccurrence(rule, addDays(today, 1));
    return { date, daysUntil: date ? diffDays(today, date) : null };
}
