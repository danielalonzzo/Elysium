/**
 * Agregados sobre los movimientos: totales, categorías, series mensuales,
 * saldos y patrimonio neto. Todo se expresa en la moneda principal con los
 * tipos de cambio que se pasen (`fx` de `money.fxFromSettings`).
 *
 * Qué cuenta como ingreso o gasto: solo los movimientos `income`/`expense`
 * que no son ajustes de saldo. Las transferencias mueven dinero entre cuentas
 * propias y no son ni una cosa ni otra; los ajustes corrigen un saldo y no
 * deben inflar la estadística del mes.
 */
import { inBase, convertMinor, percent } from './money.js';
import { weekday } from './dates.js';
import { stripAccents } from './text.js';

export function isCounted(tx) {
    return tx && !tx.adjustment && (tx.type === 'income' || tx.type === 'expense');
}

export function txBase(tx, fx) {
    return inBase(tx.amountMinor, tx.currency, fx);
}

export function totals(txs, start, end, fx) {
    let income = 0;
    let expense = 0;
    let count = 0;
    for (const tx of txs || []) {
        if (tx.date < start || tx.date > end || !isCounted(tx)) continue;
        const amount = txBase(tx, fx);
        if (tx.type === 'income') income += amount; else expense += amount;
        count += 1;
    }
    const net = income - expense;
    return { income, expense, net, count, savingsRate: income > 0 ? net / income * 100 : 0 };
}

/** Gasto (o ingreso) agrupado por categoría, de mayor a menor. */
export function byCategory(txs, start, end, fx, type = 'expense') {
    const map = new Map();
    let total = 0;
    for (const tx of txs || []) {
        if (tx.type !== type || tx.date < start || tx.date > end || !isCounted(tx)) continue;
        const amount = txBase(tx, fx);
        const key = tx.categoryId || 'sin-categoria';
        const entry = map.get(key) || { categoryId: key, total: 0, count: 0 };
        entry.total += amount;
        entry.count += 1;
        map.set(key, entry);
        total += amount;
    }
    return [...map.values()]
        .map(entry => ({ ...entry, share: percent(entry.total, total) }))
        .sort((a, b) => b.total - a.total);
}

export function normalizeMerchant(name) {
    return stripAccents(name)
        .toLowerCase()
        .replace(/\b(s\.?a\.?|sociedad anonima|srl|ltda|limitada|inc)\b/g, '')
        .replace(/[^a-z0-9 ]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function byMerchant(txs, start, end, fx, limit = 8) {
    const map = new Map();
    for (const tx of txs || []) {
        if (tx.type !== 'expense' || tx.date < start || tx.date > end || !isCounted(tx) || !tx.merchant) continue;
        const key = normalizeMerchant(tx.merchant);
        if (!key) continue;
        const entry = map.get(key) || { key, name: tx.merchant.trim(), total: 0, count: 0 };
        entry.total += txBase(tx, fx);
        entry.count += 1;
        map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

/** Serie por períodos: ingresos, gastos, neto y tasa de ahorro. */
export function periodSeries(txs, periods, fx) {
    return periods.map(period => ({ ...period, ...totals(txs, period.start, period.end, fx) }));
}

/** Total de gasto por día, para el mapa de calor y los sparklines. */
export function dailyTotals(txs, start, end, fx, type = 'expense') {
    const map = new Map();
    for (const tx of txs || []) {
        if (tx.type !== type || tx.date < start || tx.date > end || !isCounted(tx)) continue;
        map.set(tx.date, (map.get(tx.date) || 0) + txBase(tx, fx));
    }
    return map;
}

/** Gasto total de cada día de la semana en el rango (0 = domingo); quien lo pinta lo promedia. */
export function weekdayProfile(txs, start, end, fx) {
    const totalsByDay = [0, 0, 0, 0, 0, 0, 0];
    for (const [date, amount] of dailyTotals(txs, start, end, fx)) totalsByDay[weekday(date)] += amount;
    return totalsByDay;
}

/**
 * Períodos con al menos un ingreso o un gasto: los únicos que cuentan para un
 * promedio. Quien lleva un mes usando la app no gasta «un tercio» de lo que
 * gasta: gasta lo de ese mes.
 */
export function periodsWithData(txs, periods) {
    return (periods || []).filter(period => (txs || []).some(tx => isCounted(tx) && tx.date >= period.start && tx.date <= period.end));
}

/** Promedio por período de un tipo de movimiento (opcionalmente de una categoría), sobre los períodos con datos. */
export function averagePerPeriod(txs, periods, fx, { type = 'expense', categoryId = null } = {}) {
    const active = periodsWithData(txs, periods);
    if (!active.length) return 0;
    let sum = 0;
    for (const period of active) {
        for (const tx of txs || []) {
            if (tx.type !== type || !isCounted(tx) || tx.date < period.start || tx.date > period.end) continue;
            if (categoryId && tx.categoryId !== categoryId) continue;
            sum += txBase(tx, fx);
        }
    }
    return Math.round(sum / active.length);
}

/** Promedio de gasto por categoría en los períodos con datos (una categoría sin gasto un mes cuenta ese mes como cero). */
export function categoryAverages(txs, periods, fx) {
    const sums = new Map();
    const active = periodsWithData(txs, periods);
    if (!active.length) return sums;
    const start = periods[0].start;
    const end = periods[periods.length - 1].end;
    for (const entry of byCategory(txs, start, end, fx)) {
        sums.set(entry.categoryId, Math.round(entry.total / active.length));
    }
    return sums;
}

/**
 * Cuánto se ahorra de verdad al mes: promedio de ingresos menos gastos en los
 * períodos cerrados que tienen movimientos. Nunca negativo.
 */
export function savingsCapacity(txs, periods, fx) {
    const withData = periods
        .map(period => totals(txs, period.start, period.end, fx))
        .filter(total => total.count > 0);
    if (!withData.length) return 0;
    const avg = withData.reduce((sum, t) => sum + t.net, 0) / withData.length;
    return Math.max(0, Math.round(avg));
}

/* ── Cuentas y patrimonio ─────────────────────────────────────────────────── */

export const ACCOUNT_TYPES = Object.freeze({
    cash: { label: 'Efectivo', liability: false },
    bank: { label: 'Cuenta bancaria', liability: false },
    savings: { label: 'Ahorro', liability: false },
    cdp: { label: 'CDP / plazo', liability: false },
    investment: { label: 'Inversión', liability: false },
    credit: { label: 'Tarjeta de crédito', liability: true },
    asset: { label: 'Activo (carro, propiedad…)', liability: false }
});

/**
 * Importe de un movimiento en la moneda de su cuenta. Un gasto en dólares con
 * una tarjeta en colones mueve colones: el importe que cobró el banco se guarda
 * al registrarlo (`accountAmountMinor`); si falta, se convierte al tipo actual.
 */
export function amountInAccount(tx, account, fx) {
    const amount = Number(tx.amountMinor) || 0;
    const currency = tx.currency || account?.currency;
    if (!account || !currency || currency === account.currency) return amount;
    if (Number.isFinite(Number(tx.accountAmountMinor)) && tx.accountAmountMinor !== null) return Number(tx.accountAmountMinor);
    return convertMinor(amount, currency, account.currency, fx);
}

/**
 * ¿Sigue valiendo el importe que cobró el banco (`accountAmountMinor`) tras
 * editar un movimiento? Solo si no cambió el monto, la moneda ni la cuenta: si
 * cambió alguno, hay que volver a calcularlo, o el saldo de la cuenta seguiría
 * moviéndose por el importe de antes.
 */
export function keepsAccountAmount(before, after) {
    return Boolean(before)
        && before.amountMinor === after.amountMinor
        && before.currency === after.currency
        && before.accountId === after.accountId;
}

/**
 * Saldo de cada cuenta en su propia moneda: saldo inicial más lo que entra y
 * menos lo que sale desde su fecha de apertura. En una tarjeta de crédito el
 * saldo es negativo mientras se deba.
 */
export function accountBalances(accounts, txs, fx) {
    const byId = new Map((accounts || []).map(account => [account.id, account]));
    const balances = new Map((accounts || []).map(account => [account.id, Number(account.openingBalanceMinor) || 0]));
    const applies = (accountId, date) => byId.has(accountId) && date >= (byId.get(accountId).openingDate || '0000-00-00');
    const add = (accountId, delta) => balances.set(accountId, balances.get(accountId) + delta);
    for (const tx of txs || []) {
        const from = byId.get(tx.accountId);
        if (tx.type === 'income' && applies(tx.accountId, tx.date)) add(tx.accountId, amountInAccount(tx, from, fx));
        else if (tx.type === 'expense' && applies(tx.accountId, tx.date)) add(tx.accountId, -amountInAccount(tx, from, fx));
        else if (tx.type === 'transfer') {
            if (applies(tx.accountId, tx.date)) add(tx.accountId, -amountInAccount(tx, from, fx));
            if (applies(tx.toAccountId, tx.date)) {
                const to = byId.get(tx.toAccountId);
                const received = Number.isFinite(Number(tx.toAmountMinor)) && tx.toAmountMinor !== null
                    ? Number(tx.toAmountMinor)
                    : convertMinor(Number(tx.amountMinor) || 0, tx.currency || from?.currency || to.currency, to.currency, fx);
                add(tx.toAccountId, received);
            }
        }
    }
    return balances;
}

/**
 * Patrimonio neto = activos − pasivos, en moneda base. Los pasivos son los
 * saldos negativos de las tarjetas y el saldo pendiente de las deudas.
 */
export function netWorth(accounts, balances, debts, fx) {
    let assets = 0;
    let liabilities = 0;
    const breakdown = [];
    for (const account of accounts || []) {
        if (account.archived || account.includeInNetWorth === false) continue;
        const value = inBase(balances.get(account.id) || 0, account.currency, fx);
        if (value >= 0) assets += value; else liabilities += -value;
        breakdown.push({ id: account.id, name: account.name, type: account.type, value });
    }
    for (const debt of debts || []) {
        if (debt.active === false) continue;
        const value = inBase(Number(debt.balanceMinor) || 0, debt.currency, fx);
        liabilities += Math.max(0, value);
        breakdown.push({ id: debt.id, name: debt.name, type: 'debt', value: -Math.max(0, value) });
    }
    return { assets, liabilities, net: assets - liabilities, breakdown };
}

/**
 * Serie aproximada del patrimonio al cierre de cada período, reconstruida
 * hacia atrás desde el valor actual restando el neto de los períodos
 * posteriores. No refleja revalorizaciones de activos: es la tendencia.
 */
export function netWorthSeries(currentNet, txs, periods, fx) {
    const nets = periods.map(period => totals(txs, period.start, period.end, fx).net);
    const values = new Array(periods.length);
    let running = currentNet;
    for (let i = periods.length - 1; i >= 0; i -= 1) {
        values[i] = running;
        running -= nets[i];
    }
    return periods.map((period, i) => ({ key: period.key, value: values[i] }));
}

/**
 * Memoria de comercios: para cada comercio, la categoría que más se le ha
 * puesto (y, a igualdad, la más reciente). Es la «categorización automática»
 * sin IA: si siempre fue Supermercado, lo seguirá siendo.
 */
export function merchantMemory(txs) {
    const tallies = new Map();
    const sorted = [...(txs || [])].filter(tx => tx.merchant && tx.categoryId).sort((a, b) => a.date.localeCompare(b.date));
    for (const tx of sorted) {
        const key = normalizeMerchant(tx.merchant);
        if (!key) continue;
        const counts = tallies.get(key) || new Map();
        const entry = counts.get(tx.categoryId) || { count: 0, last: '' };
        entry.count += 1;
        entry.last = tx.date;
        counts.set(tx.categoryId, entry);
        tallies.set(key, counts);
    }
    const memory = new Map();
    for (const [merchant, counts] of tallies) {
        let best = null;
        for (const [categoryId, entry] of counts) {
            if (!best || entry.count > best.count || (entry.count === best.count && entry.last > best.last)) {
                best = { categoryId, ...entry };
            }
        }
        memory.set(merchant, best.categoryId);
    }
    return memory;
}

/** Comercios usados, con su nombre más reciente, para autocompletar. */
export function merchantSuggestions(txs, limit = 200) {
    const seen = new Map();
    const sorted = [...(txs || [])].filter(tx => tx.merchant).sort((a, b) => b.date.localeCompare(a.date));
    for (const tx of sorted) {
        const key = normalizeMerchant(tx.merchant);
        if (key && !seen.has(key)) seen.set(key, tx.merchant.trim());
        if (seen.size >= limit) break;
    }
    return [...seen.values()];
}
