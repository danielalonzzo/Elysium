// GENERADO por scripts/sync-patrimonio-core.mjs desde Gestor-Patrimonios/js/model.js.
// No se edita aquí: se edita el original y se vuelve a ejecutar el script.
/**
 * Modelo derivado: todo lo que las vistas necesitan, calculado una vez por
 * versión del almacén. Las vistas no suman ni filtran por su cuenta; así el
 * «gastado este mes» del inicio, el de presupuestos y el de las alertas son
 * siempre la misma cifra.
 */
import { inBase, convertMinor, fxFromSettings } from './core/money.js';
import {
    todayISO, setTimeZone, periodFor, shiftPeriod, lastPeriods, addDays, addMonths, diffDays, monthLabel, startOfMonth, parseISO, toISO, daysInMonth
} from './core/dates.js';
import * as stats from './core/stats.js';
import { budgetStatus, dailySpendable, carryOver } from './core/budgets.js';
import {
    goalSaved, goalProgress, actualMonthlyRate, goalHealth, requiredMonthly, capacityShares, emergencyTarget, etaFromMonthly
} from './core/goals.js';
import { upcoming as upcomingRecurring, overdue as overdueRecurringItems, nextPayday } from './core/recurring.js';
import { evaluateAlerts, visibleAlerts } from './core/alerts.js';
import { computeGamification } from './core/gamification.js';

let cache = { version: -1, day: '', model: null };

export function getModel(store) {
    // «Hoy» se cuenta en la zona de la persona (Costa Rica si no eligió otra).
    setTimeZone(store.profile?.settings?.timeZone);
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
        baseCurrency: 'CRC', periodStartDay: 1, payday: { mode: 'monthly', day: 30 },
        gamification: true, emergencyMonths: 6, alerts: {}, email: {}, ...profile.settings
    };
    const fx = fxFromSettings(settings);
    const startDay = Number(settings.periodStartDay) || 1;

    const period = periodFor(today, startDay);
    const prevPeriod = shiftPeriod(period, -1, startDay);
    const periods12 = lastPeriods(today, 12, startDay);
    const closed3 = lastPeriods(prevPeriod.end, 3, startDay);
    const closed12 = lastPeriods(prevPeriod.end, 12, startDay);

    /* Catálogos */
    const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''));
    const categories = store.list('categories').sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || byName(a, b));
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
    // Sin pasarse del final del período anterior: si era más corto (febrero), «hasta el mismo día» es todo él.
    const prevCut = addDays(prevPeriod.start, elapsedDays);
    const prevToDate = stats.totals(txs, prevPeriod.start, prevCut < prevPeriod.end ? prevCut : prevPeriod.end, fx);
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
    const accounts = store.list('accounts').sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || byName(a, b));
    const balances = stats.accountBalances(accounts, txs, fx);
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
    const recurring = store.list('recurring').sort(byName);
    const paidKeys = new Set(txs.filter(tx => tx.recurringId && tx.recurringDate).map(tx => `${tx.recurringId}:${tx.recurringDate}`));
    const upcoming = upcomingRecurring(recurring, today, 35, paidKeys);
    const overdueRecurring = overdueRecurringItems(recurring, today, { paidKeys });
    const linkedDebtIds = new Set(recurring.filter(rule => rule.debtId && rule.active !== false).map(rule => rule.debtId));
    const payday = nextPayday(settings.payday, today);
    const committedRecurring = upcoming
        .filter(item => item.rule.type === 'expense' && item.date <= period.end)
        .reduce((sum, item) => sum + inBase(item.rule.amountMinor, item.rule.currency, fx), 0);

    /* Metas */
    const contributions = store.list('contributions');
    const goalsRaw = store.list('goals');
    const activeGoals = goalsRaw.filter(goal => goal.status !== 'archived');
    const archivedGoals = goalsRaw.filter(goal => goal.status === 'archived');
    const currencyOfGoal = new Map(goalsRaw.map(goal => [goal.id, goal.currency || fx.base]));
    // La capacidad está en la moneda principal: los aportes planeados se
    // convierten para repartirla, y la parte de cada meta vuelve a su moneda.
    const shares = capacityShares(activeGoals
        .filter(goal => goal.status !== 'done')
        .map(goal => ({ ...goal, monthlyPlanMinor: inBase(Number(goal.monthlyPlanMinor) || 0, goal.currency, fx) })), capacity);
    const goals = activeGoals.map(goal => {
        const saved = goalSaved(goal.id, contributions);
        const progress = goalProgress(goal, saved);
        // Una meta marcada como cumplida lo está para todo: inicio, «comprometido» y alertas.
        if (goal.status === 'done') progress.done = true;
        const planned = Number(goal.monthlyPlanMinor) > 0
            ? Number(goal.monthlyPlanMinor)
            : convertMinor(shares.get(goal.id) || 0, fx.base, currencyOfGoal.get(goal.id), fx);
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
    }).sort((a, b) => Number(a.goal.status === 'done') - Number(b.goal.status === 'done') || (a.goal.priority || 2) - (b.goal.priority || 2) || b.progress.pct - a.progress.pct);
    const goalsMonthly = goals.filter(g => !g.progress.done).reduce((sum, g) => sum + inBase(g.pace, g.goal.currency, fx), 0);
    const goalsSavedBase = goals.reduce((sum, g) => sum + g.savedBase, 0);
    const emergencyGoal = goals.find(g => g.goal.kind === 'emergencia') || null;
    const emergency = {
        entry: emergencyGoal,
        suggested: emergencyTarget(avgExpense, Number(settings.emergencyMonths) || 6),
        pct: emergencyGoal ? emergencyGoal.progress.pct : 0
    };
    const contributedThisPeriod = contributions.filter(c => c.date >= period.start && c.date <= period.end)
        .reduce((sum, c) => sum + Math.max(0, inBase(c.amountMinor, currencyOfGoal.get(c.goalId) || fx.base, fx)), 0);

    /* Presupuestos */
    const budgetDocs = store.list('budgets');
    const prevSpentByCategory = budgetDocs.some(budget => budget.rollover)
        ? new Map(stats.byCategory(txs, prevPeriod.start, prevPeriod.end, fx).map(entry => [entry.categoryId, entry.total]))
        : new Map();
    const budgets = budgetDocs.map(budget => {
        const category = catById.get(budget.categoryId);
        const limit = inBase(budget.amountMinor, budget.currency, fx);
        const carry = budget.rollover ? carryOver(limit, prevSpentByCategory.get(budget.categoryId) || 0) : 0;
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
    // Dónde debería ir el gasto hoy, en % del período (la marca de ritmo).
    const pacePct = (1 - (daysLeft - 1) / period.days) * 100;
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
        linkedDebtIds,
        recentExpenses
    });
    const alerts = visibleAlerts(alertsAll, profile.alertState || {}, today);

    /* Logros */
    const activeDebts = debts.filter(d => d.active !== false);
    const onTimeMonths = activeDebts.length ? Math.min(...activeDebts.map(d => d.onTimeMonths)) : 0;
    const closedSeries = stats.periodSeries(txs, closed12, fx);
    // Un mes solo se mide con los presupuestos que ya existían en él: crear límites
    // hoy no regala los meses de atrás.
    const monthsWithinBudget = budgetDocs.length
        ? closed12.filter(p => {
            const existing = budgetDocs.filter(b => !b.createdAt || String(b.createdAt).slice(0, 10) <= p.start);
            if (!existing.length) return false;
            const spent = new Map(stats.byCategory(txs, p.start, p.end, fx).map(e => [e.categoryId, e.total]));
            const hasData = txs.some(tx => tx.date >= p.start && tx.date <= p.end);
            return hasData && existing.every(b => (spent.get(b.categoryId) || 0) <= inBase(b.amountMinor, b.currency, fx));
        }).length
        : 0;
    // Las metas cumplidas cuentan aunque después se archiven.
    const goalsDone = goalsRaw.filter(goal => goal.status === 'done' || goal.completedAt
        || goalProgress(goal, goalSaved(goal.id, contributions)).done).length;
    const game = computeGamification({
        txs,
        contributions: contributions.map(c => ({ ...c, amountMinor: inBase(c.amountMinor, currencyOfGoal.get(c.goalId) || fx.base, fx) })),
        today,
        currency: fx.base,
        budgetsCount: budgetDocs.length,
        monthsWithinBudget,
        totalSaved: Math.max(goalsSavedBase, savingsBalance),
        emergencyPct: emergency.pct,
        goalsDone,
        onTimeMonths: Number.isFinite(onTimeMonths) ? onTimeMonths : 0,
        debtsPaidOff: debts.filter(d => d.status === 'paid' || (Number(d.principalMinor) > 0 && Number(d.balanceMinor) <= 0)).length,
        bestSavingsRate: Math.max(0, ...closedSeries.filter(p => p.income > 0).map(p => p.savingsRate)),
        receiptsCount: txs.filter(tx => tx.receipt).length + store.list('receipts').filter(r => !r.transactionId).length,
        simulationsCount: store.list('simulations').length,
        aguinaldoSavedPct: aguinaldoSaved(txs, contributions, fx, currencyOfGoal),
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
        goals, archivedGoals, goalsMonthly, goalsSavedBase, emergency, contributions,
        budgets, budgetTotals, spendable, daysLeft, pacePct,
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
function aguinaldoSaved(txs, contributions, fx, currencyOfGoal) {
    const aguinaldo = txs.find(tx => tx.type === 'income' && tx.categoryId === 'aguinaldo');
    if (!aguinaldo) return 0;
    const amount = inBase(aguinaldo.amountMinor, aguinaldo.currency, fx);
    const until = addDays(aguinaldo.date, 45);
    const saved = contributions
        .filter(c => c.date >= aguinaldo.date && c.date <= until && c.amountMinor > 0 && /aguinaldo/i.test(c.note || ''))
        .reduce((sum, c) => sum + inBase(c.amountMinor, currencyOfGoal.get(c.goalId) || fx.base, fx), 0);
    return amount ? saved / amount * 100 : 0;
}
