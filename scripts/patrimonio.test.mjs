/**
 * Pruebas de Elysium Patrimonio (`Gestor-Patrimonios/`).
 *
 * El núcleo (`js/core/`) es puro a propósito —sin DOM ni Firebase—, así que
 * se importa tal cual. Cubre lo que no se ve abriendo la app: la cuota de un
 * préstamo, cuándo se llega a una meta, cuándo salta una alerta, qué insignia
 * se desbloquea, la lectura de una factura de Hacienda. Un error ahí no rompe
 * la pantalla: muestra un número equivocado con total aplomo.
 *
 * La segunda mitad vigila la publicación: que la app sea una PWA válida con
 * su scope, que no lleve analítica, que no la indexen y que el Worker y las
 * cabeceras la traten como privada.
 *
 * Uso:  node --test scripts/patrimonio.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import * as money from '../Gestor-Patrimonios/js/core/money.js';
import * as dates from '../Gestor-Patrimonios/js/core/dates.js';
import * as recurring from '../Gestor-Patrimonios/js/core/recurring.js';
import * as stats from '../Gestor-Patrimonios/js/core/stats.js';
import * as budgets from '../Gestor-Patrimonios/js/core/budgets.js';
import * as goals from '../Gestor-Patrimonios/js/core/goals.js';
import * as loans from '../Gestor-Patrimonios/js/core/loans.js';
import * as alerts from '../Gestor-Patrimonios/js/core/alerts.js';
import * as game from '../Gestor-Patrimonios/js/core/gamification.js';
import * as factura from '../Gestor-Patrimonios/js/core/factura-cr.js';
import * as csv from '../Gestor-Patrimonios/js/core/csv.js';
import * as categories from '../Gestor-Patrimonios/js/core/categories.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const APP = join(ROOT, 'Gestor-Patrimonios');
const fixture = name => readFileSync(join(ROOT, 'scripts', 'fixtures', 'patrimonio', name), 'utf8');
const FX = { base: 'CRC', rate: 500 };

/* ── Dinero ───────────────────────────────────────────────────────────────── */

test('parseAmount entiende cómo escribe la gente los colones', () => {
    assert.equal(money.parseAmount('15000'), 1500000);
    assert.equal(money.parseAmount('₡15.000.000'), 1500000000);
    assert.equal(money.parseAmount('15,000'), 1500000);
    assert.equal(money.parseAmount('15.000,50'), 1500050);
    assert.equal(money.parseAmount('$1,250.75'), 125075);
    assert.equal(money.parseAmount('1.5'), 150);
    assert.equal(money.parseAmount('2.5 M'), 250000000);
    assert.equal(money.parseAmount('20 mil'), 2000000);
    assert.equal(money.parseAmount('-3.500'), -350000);
    assert.equal(money.parseAmount('abc'), null);
    assert.equal(money.parseAmount(''), null);
});

test('formatMoney usa punto de miles, sin decimales en colones', () => {
    assert.equal(money.formatMoney(1500000000, 'CRC'), '₡15.000.000');
    assert.equal(money.formatMoney(125075, 'USD'), '$1.250,75');
    assert.equal(money.formatMoney(-350000, 'CRC'), '−₡3.500');
    assert.equal(money.formatMoney(350000, 'CRC', { sign: true }), '+₡3.500');
    assert.equal(money.formatMoney(1520000000, 'CRC', { compact: true }), '₡15,2 M');
    assert.equal(money.formatMoney(85000000, 'CRC', { compact: true }), '₡850 k');
});

test('convertMinor cambia entre colones y dólares con el tipo dado', () => {
    assert.equal(money.convertMinor(10000, 'USD', 'CRC', 505), 5050000);
    assert.equal(money.convertMinor(5050000, 'CRC', 'USD', 505), 10000);
    assert.equal(money.convertMinor(777, 'CRC', 'CRC', 505), 777);
});

/* ── Fechas ───────────────────────────────────────────────────────────────── */

test('todayISO usa la hora de Costa Rica, no la UTC', () => {
    // 2026-09-24 03:30 UTC = 23 sep 21:30 en San José.
    assert.equal(dates.todayISO(new Date('2026-09-24T03:30:00Z')), '2026-09-23');
});

test('addMonths conserva el día y recorta en meses cortos', () => {
    assert.equal(dates.addMonths('2026-01-31', 1), '2026-02-28');
    assert.equal(dates.addMonths('2028-01-31', 1), '2028-02-29');
    assert.equal(dates.addMonths('2026-12-15', 1), '2027-01-15');
    assert.equal(dates.addMonths('2026-03-10', -3), '2025-12-10');
});

test('periodFor respeta el día de pago', () => {
    assert.deepEqual(dates.periodFor('2026-09-23', 1), { start: '2026-09-01', end: '2026-09-30', key: '2026-09', days: 30 });
    const payday = dates.periodFor('2026-09-10', 15);
    assert.equal(payday.start, '2026-08-15');
    assert.equal(payday.end, '2026-09-14');
    const lateStart = dates.periodFor('2026-02-28', 30);
    assert.equal(lateStart.start, '2026-02-28');
    assert.equal(lateStart.end, '2026-03-29');
});

test('weekday e isoWeekKey', () => {
    assert.equal(dates.weekday('2026-09-23'), 3); // miércoles
    assert.equal(dates.isoWeekKey('2026-01-01'), '2026-W01');
    assert.equal(dates.isoWeekKey('2027-01-01'), '2026-W53');
});

test('parseDateLoose lee fechas de Excel y a mano', () => {
    assert.equal(dates.parseDateLoose('23/09/2026'), '2026-09-23');
    assert.equal(dates.parseDateLoose('3-1-26'), '2026-01-03');
    assert.equal(dates.parseDateLoose('2026-09-23T10:00'), '2026-09-23');
    assert.equal(dates.parseDateLoose(46288), '2026-09-23');
    assert.equal(dates.parseDateLoose('31/02/2026'), null);
});

test('formatMonths habla como una persona', () => {
    assert.equal(dates.formatMonths(24), '2 años');
    assert.equal(dates.formatMonths(26), '2 años y 2 meses');
    assert.equal(dates.formatMonths(0.5), '15 días');
    assert.equal(dates.formatMonths(Infinity), 'sin fecha');
});

/* ── Recurrentes ──────────────────────────────────────────────────────────── */

test('las reglas mensuales se anclan al día original (31 no se corre a 28)', () => {
    const rule = { id: 'r', frequency: 'monthly', anchorDate: '2026-01-31' };
    assert.deepEqual(recurring.occurrences(rule, '2026-01-01', '2026-04-30'), ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
});

test('quincenal = 15 y último día; semanal cada 7 días', () => {
    assert.deepEqual(
        recurring.occurrences({ frequency: 'semimonthly', anchorDate: '2026-01-01' }, '2026-02-01', '2026-03-20'),
        ['2026-02-15', '2026-02-28', '2026-03-15']
    );
    assert.deepEqual(
        recurring.occurrences({ frequency: 'weekly', anchorDate: '2026-09-01' }, '2026-09-10', '2026-09-30'),
        ['2026-09-15', '2026-09-22', '2026-09-29']
    );
});

test('upcoming ignora lo pagado y lo inactivo', () => {
    const rules = [
        { id: 'luz', name: 'Luz', type: 'expense', frequency: 'monthly', anchorDate: '2026-01-25', amountMinor: 2500000 },
        { id: 'gym', name: 'Gimnasio', type: 'expense', frequency: 'monthly', anchorDate: '2026-01-24', active: false }
    ];
    const items = recurring.upcoming(rules, '2026-09-23', 10, new Set());
    assert.equal(items.length, 1);
    assert.equal(items[0].date, '2026-09-25');
    assert.equal(items[0].daysUntil, 2);
    assert.equal(recurring.upcoming(rules, '2026-09-23', 10, new Set(['luz:2026-09-25'])).length, 0);
});

test('nextPayday mensual y quincenal', () => {
    assert.deepEqual(recurring.nextPayday({ mode: 'monthly', day: 30 }, '2026-09-23'), { date: '2026-09-30', daysUntil: 7 });
    assert.deepEqual(recurring.nextPayday({ mode: 'semimonthly' }, '2026-09-10'), { date: '2026-09-15', daysUntil: 5 });
    // El día de pago de hoy ya se cobró: el siguiente es el próximo.
    assert.equal(recurring.nextPayday({ mode: 'monthly', day: 30 }, '2026-09-30').date, '2026-10-30');
});

/* ── Estadística y patrimonio ─────────────────────────────────────────────── */

const TXS = [
    { id: 'a', type: 'income', amountMinor: 80000000, currency: 'CRC', date: '2026-09-01', accountId: 'banco', categoryId: 'salario' },
    { id: 'b', type: 'expense', amountMinor: 2000000, currency: 'CRC', date: '2026-09-02', accountId: 'banco', categoryId: 'supermercado', merchant: 'Super La Colina' },
    { id: 'c', type: 'expense', amountMinor: 10000, currency: 'USD', date: '2026-09-03', accountId: 'tarjeta', categoryId: 'restaurantes', merchant: 'Soda Doña Ana' },
    { id: 'd', type: 'transfer', amountMinor: 30000000, currency: 'CRC', date: '2026-09-05', accountId: 'banco', toAccountId: 'ahorro', toAmountMinor: 30000000 },
    { id: 'e', type: 'expense', amountMinor: 999900, currency: 'CRC', date: '2026-09-06', accountId: 'banco', categoryId: 'otros-gastos', adjustment: true }
];

test('totals ignora transferencias y ajustes y convierte a colones', () => {
    const t = stats.totals(TXS, '2026-09-01', '2026-09-30', FX);
    assert.equal(t.income, 80000000);
    assert.equal(t.expense, 2000000 + 5000000); // $100 × 500
    assert.equal(t.net, 73000000);
    assert.equal(Math.round(t.savingsRate), 91);
});

test('accountBalances y netWorth: la tarjeta es pasivo', () => {
    const accounts = [
        { id: 'banco', name: 'Banco', type: 'bank', currency: 'CRC', openingBalanceMinor: 10000000 },
        { id: 'tarjeta', name: 'Tarjeta', type: 'credit', currency: 'USD', openingBalanceMinor: 0 },
        { id: 'ahorro', name: 'Ahorro', type: 'savings', currency: 'CRC', openingBalanceMinor: 0 }
    ];
    const balances = stats.accountBalances(accounts, TXS);
    assert.equal(balances.get('banco'), 10000000 + 80000000 - 2000000 - 30000000 - 999900);
    assert.equal(balances.get('tarjeta'), -10000);
    assert.equal(balances.get('ahorro'), 30000000);
    const worth = stats.netWorth(accounts, balances, [{ id: 'carro', name: 'Préstamo', currency: 'CRC', balanceMinor: 20000000 }], FX);
    assert.equal(worth.liabilities, 5000000 + 20000000);
    assert.equal(worth.net, worth.assets - worth.liabilities);
});

test('merchantMemory recuerda la categoría más usada de cada comercio', () => {
    const memory = stats.merchantMemory([
        { merchant: 'Walmart Curridabat', categoryId: 'supermercado', date: '2026-08-01' },
        { merchant: 'WALMART  curridabat', categoryId: 'supermercado', date: '2026-08-10' },
        { merchant: 'Walmart Curridabat', categoryId: 'hogar', date: '2026-09-01' }
    ]);
    assert.equal(memory.get('walmart curridabat'), 'supermercado');
});

test('savingsCapacity promedia el neto de los períodos con datos', () => {
    const periods = [
        { start: '2026-07-01', end: '2026-07-31' },
        { start: '2026-08-01', end: '2026-08-31' },
        { start: '2026-09-01', end: '2026-09-30' }
    ];
    const txs = [
        { type: 'income', amountMinor: 1000, currency: 'CRC', date: '2026-08-01' },
        { type: 'expense', amountMinor: 400, currency: 'CRC', date: '2026-08-02' },
        { type: 'income', amountMinor: 1000, currency: 'CRC', date: '2026-09-01' },
        { type: 'expense', amountMinor: 800, currency: 'CRC', date: '2026-09-02' }
    ];
    assert.equal(stats.savingsCapacity(txs, periods, FX), 400);
});

/* ── Presupuestos ─────────────────────────────────────────────────────────── */

const SEPT = { start: '2026-09-01', end: '2026-09-30', key: '2026-09', days: 30 };

test('budgetStatus distingue ok, ritmo alto, cuidado y excedido', () => {
    assert.equal(budgets.budgetStatus({ limitMinor: 100, spentMinor: 30, period: SEPT, today: '2026-09-15' }).state, 'ok');
    assert.equal(budgets.budgetStatus({ limitMinor: 100, spentMinor: 70, period: SEPT, today: '2026-09-10' }).state, 'pace');
    assert.equal(budgets.budgetStatus({ limitMinor: 100, spentMinor: 85, period: SEPT, today: '2026-09-25' }).state, 'warning');
    assert.equal(budgets.budgetStatus({ limitMinor: 100, spentMinor: 120, period: SEPT, today: '2026-09-25' }).state, 'over');
});

test('dailyAllowance reparte lo que queda entre hoy y los días restantes', () => {
    const status = budgets.budgetStatus({ limitMinor: 3000000, spentMinor: 1000000, period: SEPT, today: '2026-09-21' });
    assert.equal(status.daysLeft, 9);
    assert.equal(status.dailyAllowance, 200000);
});

test('suggestBudget redondea el promedio con holgura', () => {
    assert.equal(budgets.suggestBudget(8700000, 'CRC'), 9200000);
    assert.equal(budgets.suggestBudget(0), 0);
});

test('rule503020 reparte el ingreso', () => {
    assert.deepEqual(budgets.rule503020(100000000), { need: 50000000, want: 30000000, saving: 20000000 });
});

/* ── Metas ────────────────────────────────────────────────────────────────── */

test('el ejemplo de Jared: si no gastas ₡20.000, llegas 5 días antes', () => {
    // Aportando ₡120.000 al mes, ₡20.000 son unos cinco días de ahorro.
    assert.equal(goals.spendImpactDays(2000000, 12000000), 5);
});

test('etaFromMonthly y requiredMonthly', () => {
    const eta = goals.etaFromMonthly(1500000000, 50000000, '2026-09-23');
    assert.equal(Math.round(eta.months), 30);
    assert.ok(eta.date > '2029-03-01' && eta.date < '2029-04-15');
    assert.equal(Math.round(goals.requiredMonthly(1200000, '2026-01-01', '2027-01-01') / 1000), 100);
    assert.equal(goals.etaFromMonthly(100, 0, '2026-09-23').date, null);
});

test('goalProgress marca hitos del 25 al 100', () => {
    assert.equal(goals.goalProgress({ targetMinor: 1000 }, 520).milestone, 50);
    assert.equal(goals.goalProgress({ targetMinor: 1000 }, 1200).done, true);
    assert.equal(goals.goalProgress({ targetMinor: 1000 }, 1200).pct, 100);
});

test('accelerationScenarios solo propone lo que adelanta la meta', () => {
    const list = goals.accelerationScenarios({
        remaining: 1000000000, monthly: 10000000, today: '2026-09-23',
        topCategory: { name: 'Restaurantes', averageMinor: 15000000 }, aguinaldoMinor: 60000000
    });
    assert.ok(list.length >= 3);
    assert.ok(list.every(item => item.daysSaved > 0));
    assert.ok(list.some(item => item.id === 'aguinaldo'));
});

test('goalHealth detecta una meta en riesgo', () => {
    const progress = goals.goalProgress({ targetMinor: 1200000 }, 0);
    const health = goals.goalHealth({ progress, plannedMonthly: 50000, actualMonthly: 0, deadline: '2027-01-01', today: '2026-01-01' });
    assert.equal(health.state, 'at-risk');
    assert.ok(health.lateDays > 300);
});

test('capacityShares reparte por prioridad la capacidad libre', () => {
    const shares = goals.capacityShares([
        { id: 'a', priority: 1 },
        { id: 'b', priority: 3 },
        { id: 'c', monthlyPlanMinor: 4000 }
    ], 12000);
    assert.equal(shares.get('c'), 4000);
    assert.equal(shares.get('a'), 6000);
    assert.equal(shares.get('b'), 2000);
});

/* ── Préstamos y simulador ────────────────────────────────────────────────── */

test('cuota francesa: 10.000 al 6% en 12 meses = 860,66', () => {
    assert.equal(loans.monthlyPayment(1000000, 6, 12), 86066);
    assert.equal(loans.monthlyPayment(1200, 0, 12), 100);
});

test('la tabla de amortización cierra en cero exacto', () => {
    const plan = loans.amortization(800000000, 12, 24);
    assert.equal(plan.rows.length, 24);
    assert.equal(plan.rows.at(-1).balance, 0);
    const principalSum = plan.rows.reduce((sum, row) => sum + row.principal, 0);
    assert.equal(principalSum, 800000000);
    assert.equal(plan.totalPaid, 800000000 + plan.totalInterest);
});

test('pagar un extra acorta el plazo', () => {
    const base = loans.amortization(800000000, 12, 60);
    const faster = loans.amortization(800000000, 12, 60, { extraMonthly: 5000000 });
    assert.ok(faster.months < base.months);
    assert.ok(faster.totalInterest < base.totalInterest);
});

test('monthsToPayoff coincide con la tabla', () => {
    const payment = loans.monthlyPayment(500000000, 10, 36);
    assert.equal(loans.monthsToPayoff(500000000, 10, payment), 36);
    assert.equal(loans.monthsToPayoff(100, 12, 1), Infinity);
});

test('el ejemplo de Jared: una Montero de ₡8.000.000 en 24 meses', () => {
    const result = loans.simulatePurchase({
        price: 800000000, savingsAvailable: 0, monthlyCapacity: 33333334, monthlyIncome: 90000000, today: '2026-09-23'
    });
    assert.equal(Math.ceil(result.cash.months), 24);
    assert.equal(result.verdict.level, 'wait');
    assert.match(result.verdict.title, /24 meses/);
});

test('simulatePurchase con prima y crédito calcula el endeudamiento', () => {
    const result = loans.simulatePurchase({
        price: 800000000, downPayment: 160000000, annualRate: 11, months: 60, feesPct: 2,
        savingsAvailable: 250000000, monthlyCapacity: 30000000, monthlyIncome: 120000000, today: '2026-09-23'
    });
    assert.equal(result.credit.loan, 640000000);
    assert.equal(result.credit.fees, 12800000);
    assert.ok(result.credit.totalInterest > 0);
    assert.equal(result.credit.dti.state, 'ok');
    assert.equal(result.verdict.level, 'yes');
});

test('quickAffordability: sí, con ahorros, o espera', () => {
    assert.equal(loans.quickAffordability({ price: 1000, periodAvailable: 5000, freeSavings: 0, monthlyCapacity: 0, today: '2026-09-23' }).level, 'yes');
    const withSavings = loans.quickAffordability({ price: 50000000, periodAvailable: 1000000, freeSavings: 80000000, monthlyCapacity: 10000000, goalMonthly: 12000000, today: '2026-09-23' });
    assert.equal(withSavings.level, 'caution');
    assert.equal(withSavings.delayDays, 127);
    const wait = loans.quickAffordability({ price: 50000000, periodAvailable: 0, freeSavings: 0, monthlyCapacity: 25000000, today: '2026-09-23' });
    assert.equal(wait.level, 'wait');
    assert.equal(Math.round(wait.months), 2);
});

test('payoffPlan: avalancha paga menos intereses que bola de nieve', () => {
    const debts = [
        { id: 'tarjeta', balanceMinor: 100000000, annualRate: 36, paymentMinor: 5000000 },
        { id: 'carro', balanceMinor: 50000000, annualRate: 9, paymentMinor: 3000000 }
    ];
    const avalanche = loans.payoffPlan(debts, { extraMonthly: 3000000, strategy: 'avalanche', today: '2026-09-23' });
    const snowball = loans.payoffPlan(debts, { extraMonthly: 3000000, strategy: 'snowball', today: '2026-09-23' });
    assert.ok(avalanche.totalInterest <= snowball.totalInterest);
    assert.equal(avalanche.order[0].id, 'tarjeta');
    assert.equal(snowball.order[0].id, 'carro');
    assert.equal(avalanche.stuck, false);
});

/* ── Alertas ──────────────────────────────────────────────────────────────── */

test('alertas de presupuesto con el texto que pidió Jared, de usted', () => {
    const status = budgets.budgetStatus({ limitMinor: 10000000, spentMinor: 8500000, period: SEPT, today: '2026-09-25' });
    const list = alerts.evaluateAlerts({
        today: '2026-09-25', period: SEPT, fx: FX,
        categories: [{ id: 'supermercado', name: 'Comida' }],
        budgets: [{ categoryId: 'supermercado', status }]
    });
    assert.equal(list.length, 1);
    assert.equal(list[0].id, 'budget:supermercado:2026-09:80');
    assert.equal(list[0].email, 'immediate');
    assert.match(list[0].body, /Ha gastado un 85% de su presupuesto de comida/);
});

test('gasto inusual: 40% más en restaurantes', () => {
    const list = alerts.evaluateAlerts({
        today: '2026-09-15', period: SEPT, fx: FX,
        categories: [{ id: 'restaurantes', name: 'Restaurantes' }],
        averages: new Map([['restaurantes', 6000000]]),
        spentByCategory: new Map([['restaurantes', 4200000]])
    });
    const unusual = list.find(a => a.kind === 'unusual');
    assert.ok(unusual);
    assert.match(unusual.body, /40% más en restaurantes/);
});

test('pagos próximos, tarjeta al límite y alertas apagadas', () => {
    const ctx = {
        today: '2026-09-23', period: SEPT, fx: FX,
        upcoming: [{ rule: { id: 'luz', name: 'Luz', type: 'expense', amountMinor: 2500000 }, date: '2026-09-24', daysUntil: 1 }],
        accounts: [{ id: 't', name: 'Visa', type: 'credit', currency: 'CRC', creditLimitMinor: 100000000, dueDay: 25 }],
        balances: new Map([['t', -90000000]])
    };
    const list = alerts.evaluateAlerts(ctx);
    assert.ok(list.some(a => a.id === 'due:luz:2026-09-24'));
    assert.ok(list.some(a => a.id === 'card-limit:t:2026-09:80'));
    assert.ok(list.some(a => a.id === 'card-due:t:2026-09-25'));
    const off = alerts.evaluateAlerts({ ...ctx, settings: { alerts: { due: false, cards: false } } });
    assert.equal(off.length, 0);
});

test('visibleAlerts respeta descartes y aplazamientos', () => {
    const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const visible = alerts.visibleAlerts(list, { a: { dismissed: true }, b: { snoozeUntil: '2026-09-30' }, c: { snoozeUntil: '2026-09-01' } }, '2026-09-23');
    assert.deepEqual(visible.map(a => a.id), ['c']);
});

/* ── Logros ───────────────────────────────────────────────────────────────── */

test('rachas de registro', () => {
    const days = new Set(['2026-09-20', '2026-09-21', '2026-09-22', '2026-09-10']);
    assert.equal(game.currentStreak(days, '2026-09-23'), 3);
    assert.equal(game.currentStreak(days, '2026-09-25'), 0);
    assert.equal(game.longestStreak(days), 3);
});

test('7 días sin gastos impulsivos = una semana de +50', () => {
    const txs = [
        { type: 'expense', date: '2026-09-01' },
        { type: 'expense', date: '2026-09-05', impulsive: true }
    ];
    const runs = game.impulseFreeRuns(txs, '2026-09-13');
    assert.equal(runs.current, 8);
    assert.equal(runs.weeks, 1);
});

test('computeGamification: niveles con nombres de monedas griegas', () => {
    assert.equal(game.levelFor(0).name, 'Óbolo');
    assert.equal(game.levelFor(600).name, 'Dracma');
    assert.equal(game.levelFor(12000).name, 'Talento');
    const result = game.computeGamification({
        txs: [{ type: 'expense', date: '2026-09-23', amountMinor: 1 }],
        today: '2026-09-23', goalsDone: 1, totalSaved: 100000000, emergencyPct: 100, netWorth: 1
    });
    const unlocked = new Set(result.badges.filter(b => b.unlocked).map(b => b.id));
    for (const id of ['primer-paso', 'sueno-cumplido', 'primer-millon', 'red-de-seguridad', 'numero-verde']) assert.ok(unlocked.has(id), id);
    assert.ok(result.points >= 300 + 5);
    assert.ok(game.BADGES.length >= 16);
});

test('reto de la semana sin restaurantes: se supera o se rompe', () => {
    const ok = game.computeGamification({ txs: [], today: '2026-09-20', challenges: [{ id: 'semana-sin-restaurantes', startDate: '2026-09-10' }] });
    assert.equal(ok.challenges[0].done, true);
    const broken = game.computeGamification({
        txs: [{ type: 'expense', categoryId: 'restaurantes', date: '2026-09-12' }],
        today: '2026-09-20', challenges: [{ id: 'semana-sin-restaurantes', startDate: '2026-09-10' }]
    });
    assert.equal(broken.challenges[0].failed, true);
});

/* ── Factura electrónica ──────────────────────────────────────────────────── */

test('lee una factura electrónica v4.3', () => {
    const parsed = factura.parseFactura(fixture('factura-v43.xml'));
    assert.equal(parsed.documentType, 'FacturaElectronica');
    assert.equal(parsed.version, '4.3');
    assert.equal(parsed.date, '2025-09-15');
    assert.equal(parsed.totalMinor, 813400);
    assert.equal(parsed.taxMinor, 73400);
    assert.equal(parsed.currency, 'CRC');
    assert.equal(parsed.method, 'card');
    assert.equal(parsed.issuer.id, '3101999888');
    assert.equal(parsed.merchant, 'Super La Colina & Hijos');
    assert.equal(parsed.lines.length, 2);
    assert.equal(parsed.lines[1].taxRate, 13);
    assert.equal(parsed.clave.length, 50);
});

test('lee un tiquete v4.4 en dólares pagado por SINPE Móvil', () => {
    const parsed = factura.parseFactura(fixture('tiquete-v44-usd.xml'));
    assert.equal(parsed.version, '4.4');
    assert.equal(parsed.currency, 'USD');
    assert.equal(parsed.totalMinor, 13560);
    assert.equal(parsed.fxRate, 503.25);
    assert.equal(parsed.method, 'sinpe');
    assert.equal(parsed.merchant, 'Hotel Mirador del Volcan');
});

test('rechaza con un mensaje útil la respuesta de Hacienda', () => {
    assert.throws(() => factura.parseFactura(fixture('mensaje-hacienda.xml')), err => err.code === 'hacienda-message');
    assert.throws(() => factura.parseFactura('hola'), err => err.code === 'not-xml');
});

test('directionFor: si la cédula del emisor es la tuya, es un ingreso', () => {
    const parsed = factura.parseFactura(fixture('factura-v43.xml'));
    assert.equal(factura.directionFor(parsed, ''), 'expense');
    assert.equal(factura.directionFor(parsed, '3-101-999888'), 'income');
});

/* ── CSV y categorías ─────────────────────────────────────────────────────── */

test('toCSV neutraliza fórmulas y usa ; con BOM', () => {
    const out = csv.toCSV([{ a: '=HYPERLINK("x")', b: 'Soda; Doña Ana' }], [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]);
    assert.ok(out.startsWith('﻿A;B'));
    assert.ok(out.includes(`"'=HYPERLINK(""x"")"`));
    assert.ok(out.includes('"Soda; Doña Ana"'));
});

test('importa el Excel de antes: separador, comillas y columnas de ingreso/gasto', () => {
    const text = 'Fecha;Descripción;Ingresos;Gastos;Categoría\n01/09/2026;Salario;"850.000";;Salario\n02/09/2026;"Super, La Colina";;12.500;Comida\nmal;x;;1;\n';
    const rows = csv.parseCSV(text);
    assert.equal(rows.length, 4);
    const mapping = csv.guessMapping(rows[0]);
    assert.equal(mapping.date, 0);
    assert.equal(mapping.income, 2);
    assert.equal(mapping.expense, 3);
    const { items, errors } = csv.rowsToTransactions(rows, mapping);
    assert.equal(items.length, 2);
    assert.deepEqual(items[0], { date: '2026-09-01', type: 'income', amountMinor: 85000000, merchant: 'Salario', categoryLabel: 'Salario' });
    assert.equal(items[1].merchant, 'Super, La Colina');
    assert.equal(items[1].amountMinor, 1250000);
    assert.equal(errors.length, 1);
});

test('matchCategory reconoce comercios habituales de Costa Rica', () => {
    const list = categories.defaultCategories();
    assert.equal(categories.matchCategory('Supermercado', list), 'supermercado');
    assert.equal(categories.matchCategory('MASXMENOS ESCAZU', list), 'supermercado');
    assert.equal(categories.matchCategory('Servicentro La Uruca', list), 'combustible');
    assert.equal(categories.matchCategory('desayuno en soda', list), 'restaurantes');
    assert.equal(categories.matchCategory('Kolbi prepago', list), 'servicios');
    assert.equal(categories.matchCategory('aguinaldo', list, 'income'), 'aguinaldo');
});

/* ── Publicación: PWA, privacidad y cabeceras ─────────────────────────────── */

const read = relative => readFileSync(join(ROOT, relative), 'utf8');

test('manifest: id, scope y start_url dentro de /Gestor-Patrimonios/ y sus iconos existen', () => {
    const manifest = JSON.parse(read('Gestor-Patrimonios/manifest.json'));
    assert.equal(manifest.id, '/Gestor-Patrimonios/');
    assert.equal(manifest.scope, '/Gestor-Patrimonios/');
    assert.ok(manifest.start_url.startsWith('/Gestor-Patrimonios/'));
    assert.equal(manifest.lang, 'es-CR');
    assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable' && icon.sizes === '512x512'));
    for (const icon of manifest.icons) assert.ok(existsSync(join(ROOT, icon.src)), icon.src);
    for (const shortcut of manifest.shortcuts) assert.ok(shortcut.url.startsWith('/Gestor-Patrimonios/'), shortcut.url);
});

test('service worker: precarga el directorio (no index.html) y todos los módulos existen y están', async () => {
    const sw = read('Gestor-Patrimonios/sw.js');
    const precache = [...sw.matchAll(/'(\/Gestor-Patrimonios\/[^']*)'/g)].map(m => m[1]).filter(p => p !== '/Gestor-Patrimonios/');
    assert.ok(sw.includes("'/Gestor-Patrimonios/',"), 'precarga la URL canónica');
    assert.doesNotMatch(sw, /index\.html'/, 'index.html responde 307 en producción');
    for (const path of precache) assert.ok(existsSync(join(ROOT, path)), `precarga algo que no existe: ${path}`);
    const { readdirSync, statSync } = await import('node:fs');
    const walk = dir => readdirSync(dir).flatMap(name => {
        const full = join(dir, name);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });
    const modules = walk(join(APP, 'js')).filter(file => file.endsWith('.js'))
        .map(file => '/' + file.slice(ROOT.length + 1).split('\\').join('/'));
    for (const module of modules) assert.ok(precache.includes(module), `el service worker no precarga ${module}`);
});

test('index.html: noindex, sin analítica y sin scripts en línea (la CSP no los permite)', () => {
    const html = read('Gestor-Patrimonios/index.html');
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
    assert.doesNotMatch(html, /googletagmanager|google-analytics|gtag\(|GTM-/);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/, 'hay un <script> en línea');
    assert.doesNotMatch(html, /\son[a-z]+="/, 'hay un manejador en línea');
    assert.match(html, /rel="manifest" href="\/Gestor-Patrimonios\/manifest\.json"/);
});

test('_headers: CSP propia sin GTM ni unsafe-inline en scripts, noindex y sin señal para IA', () => {
    const headers = read('_headers');
    const start = headers.indexOf('/Gestor-Patrimonios/*');
    assert.ok(start !== -1, 'falta el bloque /Gestor-Patrimonios/*');
    const block = headers.slice(start, headers.indexOf('\n\n', start));
    assert.match(block, /! Content-Security-Policy/);
    const csp = block.match(/Content-Security-Policy: (.+)/g).pop();
    const scriptSrc = csp.match(/script-src ([^;]+)/)[1];
    assert.doesNotMatch(scriptSrc, /unsafe-inline|googletagmanager/);
    assert.match(csp, /worker-src 'self'/);
    assert.match(csp, /img-src [^;]*blob:/);
    assert.match(csp, /connect-src [^;]*https:\/\/www\.gstatic\.com/, 'el service worker guarda los módulos de Firebase');
    assert.match(block, /X-Robots-Tag: noindex, nofollow/);
    assert.match(block, /Content-Signal: search=no, ai-input=no, ai-train=no/);
    assert.doesNotMatch(block, /Cache-Control/, 'Cache-Control en /* de la app se uniría con coma');
    assert.match(headers, /\/Gestor-Patrimonios\/sw\.js\n\s+Cache-Control: no-cache/);
});

test('el Worker no entrega Patrimonio a agentes y robots.txt no lo bloquea (se lee el noindex)', () => {
    assert.match(read('worker/index.js'), /\/\^\\\/Gestor-Patrimonios\\b\//);
    assert.doesNotMatch(read('robots.txt'), /Gestor-Patrimonios/);
    assert.doesNotMatch(read('sitemap.xml'), /Gestor-Patrimonios/);
});

test('backend/patrimonio-core es copia exacta del núcleo de la app', async () => {
    const { drift } = await import('./sync-patrimonio-core.mjs');
    assert.deepEqual(drift(), [], 'ejecute: node scripts/sync-patrimonio-core.mjs');
});

test('la app habla de usted: sin tuteo en los textos', async () => {
    const { readdirSync, statSync } = await import('node:fs');
    const walk = dir => readdirSync(dir).flatMap(name => {
        const full = join(dir, name);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });
    const offenders = [];
    const TU = /\b(tu|tus|te|ti|contigo|tienes|puedes|podrás|podrías|quieres|quieras|puedas|tengas|gastas|gastaste|ahorras|llegas|estás|eres|sabes|necesitas|debes|deberías|verás|tendrás|tendrías|harías|elige|escribe|registra|revisa|vuelve)\b/i;
    for (const file of walk(join(APP, 'js')).filter(f => f.endsWith('.js'))) {
        // Texto de las plantillas HTML, aunque ocupen varias líneas.
        const source = read(file.slice(ROOT.length + 1)).replace(/\/\*[\s\S]*?\*\//g, '');
        for (const node of source.match(/>[^<>{}]+</g) || []) {
            if (TU.test(node)) offenders.push(`${file.slice(ROOT.length + 1)} ${node.slice(0, 80)}`);
        }
        read(file.slice(ROOT.length + 1)).split('\n').forEach((line, index) => {
            if (/^\s*(\*|\/\/|\/\*)/.test(line)) return;
            const strings = line.match(/(['`"])(?:\\.|(?!\1).)*\1/g) || [];
            for (const text of strings) {
                if (TU.test(text.replace(/\$\{[^}]*\}/g, ''))) {
                    offenders.push(`${file.slice(ROOT.length + 1)}:${index + 1} ${text.slice(0, 80)}`);
                }
            }
        });
    }
    assert.deepEqual(offenders, []);
});

test('las plantillas escriben los booleanos (aria-pressed) y escapan el texto', async () => {
    const { html, raw } = await import('../Gestor-Patrimonios/js/ui/dom.js');
    assert.equal(String(html`<b aria-pressed="${true}">${'<x>'}</b>`), '<b aria-pressed="true">&lt;x&gt;</b>');
    assert.equal(String(html`<b aria-pressed="${1 > 2}">${null}${undefined}${raw('<i>')}</b>`), '<b aria-pressed="false"><i></b>');
    const { readdirSync, statSync } = await import('node:fs');
    const walk = dir => readdirSync(dir).flatMap(name => {
        const full = join(dir, name);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });
    for (const file of walk(join(APP, 'js')).filter(f => f.endsWith('.js'))) {
        assert.doesNotMatch(readFileSync(file, 'utf8'), /\$\{[^}]*&&\s*html`/, `${file}: use cond ? html\`…\` : ''`);
    }
});
