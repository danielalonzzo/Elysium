/**
 * Modelo derivado: todo lo que las vistas necesitan, calculado una vez por
 * versión del almacén. Las vistas no suman ni filtran por su cuenta; así el
 * «gastado este mes» del inicio, el de presupuestos y el de las alertas son
 * siempre la misma cifra.
 */
import { inBase, DEFAULT_FX_RATE } from './core/money.js';
import {
    todayISO, periodFor, shiftPeriod, lastPeriods, addDays, addMonths, diffDays, monthLabel, startOfMonth, parseISO, toISO, daysInMonth
} from './core/dates.js';
import * as stats from './core/stats.js';
import { budgetStatus, dailySpendable, carryOver } from './core/budgets.js';
import {
    goalSaved, goalProgress, actualMonthlyRate, goalHealth, requiredMonthly, capacityShares, emergencyTarget, etaFromMonthly
} from './core/goals.js';
import { upcoming as upcomingRecurring, nextPayday, occurrences } from './core/recurring.js';
import { evaluateAlerts, visibleAlerts } from './core/alerts.js';
import { computeGamification } from './core/gamification.js';

let cache = { version: -1, day: '', model: null };

export function getModel(store) {
    const today = todayISO();
    if (cache.version === store.version && cache.day === today && cache.model) return cache.model;
    const model = buildModel(store, today);
    cache = { version: store.version, day: today, model };
    return model;
}

export function invalidateModel() {
    cache = { version: -1, day: '', model: null };
}

function byDateDesc(a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
}

/**
 * Puro: solo usa `store.list(nombre)`, `store.profile` y `store.mode`. Por eso
 * el backend de correo lo reutiliza tal cual (copiado por
 * `scripts/sync-patrimonio-core.mjs`) con un almacén hecho de lecturas de
 * Firestore, y las alertas del correo son las mismas que ve la app.
 */
export function buildModel(store, today) {
    const profile = store.profile || {};
    const settings = {
        baseCurrency: 'CRC', fxRate: DEFAULT_FX_RATE, periodStartDay: 1, payday: { mode: 'monthly', day: 30 },
        gamification: true, emergencyMonths: 6, alerts: {}, email: {}, ...profile.settings
    };
    const fx = { base: settings.baseCurrency || 'CRC', rate: Number(settings.fxRate) || DEFAULT_FX_RATE };
    const startDay = Number(settings.periodStartDay) || 1;

    const period = periodFor(today, startDay);
    const prevPeriod = shiftPeriod(period, -1, startDay);
    const periods12 = lastPeriods(today, 12, startDay);
    const closed3 = lastPeriods(prevPeriod.end, 3, startDay);
    const closed12 = lastPeriods(prevPeriod.end, 12, startDay);

    /* Catálogos */
    const categories = store.list('categories').sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));
    const catById = new Map(categories.map(c => [c.id, c]));
    const expenseCats = categories.filter(c => c.kind === 'expense' && !c.archived);
    const incomeCats = categories.filter(c => c.kind === 'income' && !c.archived);

    /* Movimientos */
    const txs = store.list('transactions').sort(byDateDesc);
    const txById = new Map(txs.map(tx => [tx.id, tx]));
    const periodTxs = txs.filter(tx => tx.date >= period.start && tx.date <= period.end);
    const totals = stats.totals(txs, period.start, period.end, fx);
    const prevTotals = stats.totals(txs, prevPeriod.start, prevPeriod.end, fx);
    // Comparación justa con el período anterior: hasta el mismo día.
    const elapsedDays = diffDays(period.start, today);
    const prevToDate = stats.totals(txs, prevPeriod.start, addDays(prevPeriod.start, elapsedDays), fx);
    const byCategory = stats.byCategory(txs, period.start, period.end, fx);
    const spentByCategory = new Map(byCategory.map(entry => [entry.categoryId, entry.total]));
    const avgByCategory = stats.categoryAverages(txs, closed3, fx);
    // El «gasto inusual» mira solo lo variable: el alquiler o la cuota del carro
    // se pagan enteros el día 1 y, contra el ritmo del mes, parecerían un exceso.
    const variableTxs = txs.filter(tx => !tx.recurringId && !tx.debtId);
    const variableSpent = new Map(stats.byCategory(variableTxs, period.start, period.end, fx).map(entry => [entry.categoryId, entry.total]));
    const variableAverages = stats.categoryAverages(variableTxs, closed3, fx);
    const series12 = stats.periodSeries(txs, periods12, fx);
    const avgIncome = stats.averagePerPeriod(txs, closed3, fx, { type: 'income' });
    const avgExpense = stats.averagePerPeriod(txs, closed3, fx, { type: 'expense' });
    const capacity = stats.savingsCapacity(txs, closed3, fx);

    /* Cuentas y patrimonio */
    const accounts = store.list('accounts').sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));
    const balances = stats.accountBalances(accounts, txs);
    const accountViews = accounts.map(account => ({
        ...account,
        balance: balances.get(account.id) || 0,
        balanceBase: inBase(balances.get(account.id) || 0, account.currency, fx)
    }));
    const debts = store.list('debts')
        .sort((a, b) => (b.balanceMinor || 0) - (a.balanceMinor || 0))
        .map(debt => ({ ...debt, onTimeMonths: debtOnTimeMonths(debt, txs, today) }));
    const worth = stats.netWorth(accounts, balances, debts, fx);
    const worthSeries = stats.netWorthSeries(worth.net, txs, periods12, fx);
    const liquidTypes = new Set(['cash', 'bank', 'savings']);
    const liquid = accountViews.filter(a => !a.archived && liquidTypes.has(a.type)).reduce((sum, a) => sum + Math.max(0, a.balanceBase), 0);
    const savingsBalance = accountViews.filter(a => !a.archived && ['savings', 'cdp', 'investment'].includes(a.type)).reduce((sum, a) => sum + Math.max(0, a.balanceBase), 0);

    /* Recurrentes */
    const recurring = store.list('recurring').sort((a, b) => a.name.localeCompare(b.name));
    const paidKeys = new Set(txs.filter(tx => tx.recurringId && tx.recurringDate).map(tx => `${tx.recurringId}:${tx.recurringDate}`));
    const upcoming = upcomingRecurring(recurring, today, 35, paidKeys);
    const overdueRecurring = [];
    for (const rule of recurring) {
        if (rule.active === false) continue;
        for (const date of occurrences(rule, addDays(today, -20), addDays(today, -1), 3)) {
            const key = `${rule.id}:${date}`;
            if (!paidKeys.has(key) && date >= (rule.anchorDate || date)) overdueRecurring.push({ rule, date, key, daysLate: diffDays(date, today) });
        }
    }
    const payday = nextPayday(settings.payday, today);
    const committedRecurring = upcoming
        .filter(item => item.rule.type === 'expense' && item.date <= period.end)
        .reduce((sum, item) => sum + inBase(item.rule.amountMinor, item.rule.currency, fx), 0);

    /* Metas */
    const contributions = store.list('contributions');
    const goalsRaw = store.list('goals');
    const activeGoals = goalsRaw.filter(goal => goal.status !== 'archived');
    const shares = capacityShares(activeGoals.filter(goal => goal.status !== 'done'), capacity);
    const goals = activeGoals.map(goal => {
        const saved = goalSaved(goal.id, contributions);
        const progress = goalProgress(goal, saved);
        const planned = shares.get(goal.id) || Number(goal.monthlyPlanMinor) || 0;
        const actual = actualMonthlyRate(goal, contributions, today);
        const health = goalHealth({ progress, plannedMonthly: planned, actualMonthly: actual, deadline: goal.deadline, today });
        const required = goal.deadline ? requiredMonthly(progress.remaining, today, goal.deadline) : null;
        const pace = actual > 0 ? actual : planned;
        return {
            goal, saved, progress, planned, actual, health, required, pace,
            eta: etaFromMonthly(progress.remaining, pace, today),
            savedBase: inBase(saved, goal.currency, fx),
            contributions: contributions.filter(c => c.goalId === goal.id).sort((a, b) => (a.date < b.date ? 1 : -1))
        };
    }).sort((a, b) => (a.goal.status === 'done') - (b.goal.status === 'done') || (a.goal.priority || 2) - (b.goal.priority || 2) || b.progress.pct - a.progress.pct);
    const goalsMonthly = goals.filter(g => !g.progress.done).reduce((sum, g) => sum + inBase(g.pace, g.goal.currency, fx), 0);
    const goalsSavedBase = goals.reduce((sum, g) => sum + g.savedBase, 0);
    const emergencyGoal = goals.find(g => g.goal.kind === 'emergencia') || null;
    const emergency = {
        entry: emergencyGoal,
        suggested: emergencyTarget(avgExpense, Number(settings.emergencyMonths) || 6),
        pct: emergencyGoal ? emergencyGoal.progress.pct : 0
    };
    const contributedThisPeriod = contributions.filter(c => c.date >= period.start && c.date <= period.end)
        .reduce((sum, c) => sum + Math.max(0, inBase(c.amountMinor, goals.find(g => g.goal.id === c.goalId)?.goal.currency || 'CRC', fx)), 0);

    /* Presupuestos */
    const budgetDocs = store.list('budgets');
    const budgets = budgetDocs.map(budget => {
        const category = catById.get(budget.categoryId);
        const limit = inBase(budget.amountMinor, budget.currency, fx);
        let carry = 0;
        if (budget.rollover) {
            const prevSpent = stats.byCategory(txs, prevPeriod.start, prevPeriod.end, fx).find(e => e.categoryId === budget.categoryId)?.total || 0;
            carry = carryOver(limit, prevSpent);
        }
        const status = budgetStatus({ limitMinor: limit, spentMinor: spentByCategory.get(budget.categoryId) || 0, period, today, carryMinor: carry });
        return { budget, category, status, carry, average: avgByCategory.get(budget.categoryId) || 0 };
    }).filter(entry => entry.category && !entry.category.archived)
        .sort((a, b) => b.status.pct - a.status.pct);
    const budgetTotals = budgets.reduce((acc, entry) => {
        acc.limit += entry.status.limit;
        acc.spent += entry.status.spent;
        return acc;
    }, { limit: 0, spent: 0 });

    const daysLeft = Math.max(1, diffDays(today, period.end) + 1);
    // Sin historial (primer mes) vale el ingreso que la persona declaró al empezar.
    const expectedIncome = Math.max(avgIncome || Number(settings.expectedIncomeMinor) || 0, totals.income);
    const spendable = dailySpendable({
        statuses: budgets.map(b => b.status),
        daysLeft,
        expectedIncome,
        spent: totals.expense,
        committed: committedRecurring + Math.max(0, goalsMonthly - contributedThisPeriod)
    });

    /* Alertas */
    const recentExpenses = txs.filter(tx => tx.type === 'expense' && tx.date >= addDays(today, -3))
        .map(tx => ({ ...tx, baseAmountMinor: inBase(tx.amountMinor, tx.currency, fx) }));
    const alertsAll = evaluateAlerts({
        today, period, fx, settings,
        categories,
        budgets: budgets.map(b => ({ categoryId: b.budget.categoryId, status: b.status })),
        averages: variableAverages,
        spentByCategory: variableSpent,
        upcoming: upcoming.filter(item => item.daysUntil <= 7),
        accounts, balances,
        goals: goals.map(g => ({ goal: g.goal, progress: g.progress, health: g.health, required: g.required })),
        debts,
        recentExpenses
    });
    const alerts = visibleAlerts(alertsAll, profile.alertState || {}, today);

    /* Logros */
    const activeDebts = debts.filter(d => d.active !== false);
    const onTimeMonths = activeDebts.length ? Math.min(...activeDebts.map(d => d.onTimeMonths)) : 0;
    const closedSeries = stats.periodSeries(txs, closed12, fx);
    const monthsWithinBudget = budgetDocs.length
        ? closed12.filter(p => {
            const spent = new Map(stats.byCategory(txs, p.start, p.end, fx).map(e => [e.categoryId, e.total]));
            const hasData = txs.some(tx => tx.date >= p.start && tx.date <= p.end);
            return hasData && budgetDocs.every(b => (spent.get(b.categoryId) || 0) <= inBase(b.amountMinor, b.currency, fx));
        }).length
        : 0;
    const game = computeGamification({
        txs,
        contributions,
        today,
        budgetsCount: budgetDocs.length,
        monthsWithinBudget,
        totalSaved: Math.max(goalsSavedBase, savingsBalance),
        emergencyPct: emergency.pct,
        goalsDone: goals.filter(g => g.progress.done || g.goal.status === 'done').length,
        onTimeMonths: Number.isFinite(onTimeMonths) ? onTimeMonths : 0,
        debtsPaidOff: debts.filter(d => d.status === 'paid' || (Number(d.principalMinor) > 0 && Number(d.balanceMinor) <= 0)).length,
        bestSavingsRate: Math.max(0, ...closedSeries.filter(p => p.income > 0).map(p => p.savingsRate)),
        receiptsCount: txs.filter(tx => tx.receipt).length + store.list('receipts').filter(r => !r.transactionId).length,
        simulationsCount: store.list('simulations').length,
        aguinaldoSavedPct: aguinaldoSaved(txs, contributions, fx, goals),
        netWorth: worth.net,
        challenges: profile.challenges || []
    });

    const merchantMemory = stats.merchantMemory(txs);
    const merchants = stats.merchantSuggestions(txs);

    return {
        today, fx, settings, profile, mode: store.mode,
        period, prevPeriod, periods12, closed3,
        categories, catById, expenseCats, incomeCats,
        txs, txById, periodTxs, totals, prevTotals, prevToDate, byCategory, spentByCategory, avgByCategory,
        series12, avgIncome, avgExpense, capacity,
        accounts: accountViews, balances, debts, worth, worthSeries, liquid, savingsBalance,
        recurring, upcoming, overdueRecurring, paidKeys, payday, committedRecurring,
        goals, goalsMonthly, goalsSavedBase, emergency, contributions,
        budgets, budgetTotals, spendable, daysLeft,
        alerts, alertsAll,
        game,
        merchantMemory, merchants,
        simulations: store.list('simulations').sort((a, b) => (a.date < b.date ? 1 : -1)),
        receipts: store.list('receipts').sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))),
        periodLabel: monthLabel(period.key, { long: true, year: false })
    };
}

/** Meses seguidos (hacia atrás desde el anterior) con la cuota pagada a tiempo. */
function debtOnTimeMonths(debt, txs, today) {
    if (Number.isFinite(Number(debt.onTimeMonths)) && !txs.some(tx => tx.debtId === debt.id)) return Number(debt.onTimeMonths);
    const due = Number(debt.dueDay) || 1;
    let count = 0;
    let cursor = addMonths(startOfMonth(today), -1);
    for (let i = 0; i < 36; i += 1) {
        const { y, m } = parseISO(cursor);
        const dueDate = toISO(y, m, Math.min(due, daysInMonth(y, m)));
        if (debt.startDate && dueDate < debt.startDate) break;
        const paid = txs.some(tx => tx.debtId === debt.id && tx.date >= cursor && tx.date <= dueDate);
        if (!paid) break;
        count += 1;
        cursor = addMonths(cursor, -1);
    }
    return count;
}

/** Porcentaje del último aguinaldo que terminó en metas (aportes en los 45 días siguientes). */
function aguinaldoSaved(txs, contributions, fx, goals) {
    const aguinaldo = txs.find(tx => tx.type === 'income' && tx.categoryId === 'aguinaldo');
    if (!aguinaldo) return 0;
    const amount = inBase(aguinaldo.amountMinor, aguinaldo.currency, fx);
    const until = addDays(aguinaldo.date, 45);
    const currencyOf = goalId => goals.find(g => g.goal.id === goalId)?.goal.currency || 'CRC';
    const saved = contributions
        .filter(c => c.date >= aguinaldo.date && c.date <= until && c.amountMinor > 0 && /aguinaldo/i.test(c.note || ''))
        .reduce((sum, c) => sum + inBase(c.amountMinor, currencyOf(c.goalId), fx), 0);
    return amount ? saved / amount * 100 : 0;
}
