/**
 * Datos del modo demostración.
 *
 * Una persona ficticia («Alex») con catorce meses de vida financiera creíble
 * en Costa Rica: salario quincenal, alquiler, servicios, tarjeta, préstamo del
 * carro, aguinaldo en diciembre y las tres metas del ejemplo de Jared (Land
 * Cruiser 80, finca y fondo de emergencia). Todo se genera con una semilla
 * fija y relativo a hoy, así que la demo siempre parece al día y siempre es la
 * misma. Los comercios son genéricos: ninguno es un cliente ni una marca real.
 */
import { addDays, addMonths, daysInMonth, parseISO, toISO, todayISO, startOfMonth } from './core/dates.js';
import { defaultCategories } from './core/categories.js';

function seeded(seed = 20260923) {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

const colones = amount => Math.round(amount) * 100;

export function demoSeed() {
    const today = todayISO();
    const random = seeded();
    const between = (min, max) => min + random() * (max - min);
    const pick = list => list[Math.floor(random() * list.length)];
    const round = (value, step = 50) => Math.round(value / step) * step;

    let n = 0;
    const id = prefix => `${prefix}-${(++n).toString(36).padStart(4, '0')}`;

    const accounts = [
        { id: 'cta-colones', name: 'Cuenta corriente', type: 'bank', currency: 'CRC', openingBalanceMinor: colones(420000), icon: 'landmark', tone: 'blue' },
        { id: 'cta-dolares', name: 'Cuenta en dólares', type: 'bank', currency: 'USD', openingBalanceMinor: 120000, icon: 'banknote', tone: 'green' },
        { id: 'efectivo', name: 'Efectivo', type: 'cash', currency: 'CRC', openingBalanceMinor: colones(30000), icon: 'cash', tone: 'amber' },
        { id: 'tarjeta', name: 'Tarjeta de crédito', type: 'credit', currency: 'CRC', openingBalanceMinor: 0, creditLimitMinor: colones(1500000), closingDay: 18, dueDay: 3, icon: 'credit-card', tone: 'violet' },
        { id: 'ahorro', name: 'Ahorro programado', type: 'savings', currency: 'CRC', openingBalanceMinor: colones(2600000), icon: 'piggy-bank', tone: 'gold' },
        { id: 'cdp', name: 'CDP a 12 meses', type: 'cdp', currency: 'USD', openingBalanceMinor: 500000, icon: 'building', tone: 'teal' },
        { id: 'carro', name: 'Carro (valor estimado)', type: 'asset', currency: 'CRC', openingBalanceMinor: colones(9200000), icon: 'car', tone: 'slate' }
    ];
    const start = addMonths(startOfMonth(today), -13);
    for (const account of accounts) account.openingDate = start;

    const txs = [];
    const push = tx => {
        if (tx.date > today) return;
        const created = tx.date;
        txs.push({ id: id('tx'), currency: 'CRC', createdDate: created, ...tx });
    };

    const recurring = [
        { id: 'rec-salario', name: 'Salario', type: 'income', amountMinor: colones(860000), currency: 'CRC', frequency: 'semimonthly', anchorDate: start, categoryId: 'salario', accountId: 'cta-colones', autoPost: true },
        { id: 'rec-alquiler', name: 'Alquiler', type: 'expense', amountMinor: colones(325000), currency: 'CRC', frequency: 'monthly', anchorDate: addDays(start, 0), categoryId: 'vivienda', accountId: 'cta-colones', autoPost: false },
        { id: 'rec-luz', name: 'Electricidad', type: 'expense', amountMinor: colones(27500), currency: 'CRC', frequency: 'monthly', anchorDate: toISO(parseISO(start).y, parseISO(start).m, 20), categoryId: 'servicios', accountId: 'cta-colones' },
        { id: 'rec-agua', name: 'Agua', type: 'expense', amountMinor: colones(9800), currency: 'CRC', frequency: 'monthly', anchorDate: toISO(parseISO(start).y, parseISO(start).m, 22), categoryId: 'servicios', accountId: 'cta-colones' },
        { id: 'rec-internet', name: 'Internet y celular', type: 'expense', amountMinor: colones(31900), currency: 'CRC', frequency: 'monthly', anchorDate: toISO(parseISO(start).y, parseISO(start).m, 15), categoryId: 'servicios', accountId: 'tarjeta' },
        { id: 'rec-streaming', name: 'Streaming', type: 'expense', amountMinor: 1299, currency: 'USD', frequency: 'monthly', anchorDate: toISO(parseISO(start).y, parseISO(start).m, 8), categoryId: 'suscripciones', accountId: 'tarjeta' },
        { id: 'rec-gimnasio', name: 'Gimnasio', type: 'expense', amountMinor: colones(22000), currency: 'CRC', frequency: 'monthly', anchorDate: toISO(parseISO(start).y, parseISO(start).m, 5), categoryId: 'salud', accountId: 'tarjeta' },
        { id: 'rec-cuota-carro', name: 'Cuota del carro', type: 'expense', amountMinor: colones(185000), currency: 'CRC', frequency: 'monthly', anchorDate: toISO(parseISO(start).y, parseISO(start).m, 12), categoryId: 'deudas', accountId: 'cta-colones', debtId: 'deuda-carro' },
        { id: 'rec-marchamo', name: 'Marchamo', type: 'expense', amountMinor: colones(214000), currency: 'CRC', frequency: 'yearly', anchorDate: `${parseISO(start).y}-12-15`, categoryId: 'vehiculo', accountId: 'cta-colones' }
    ];
    const recurringActive = recurring.map(rule => ({ ...rule, active: true }));

    // Movimientos mes a mes.
    for (let monthIndex = 0; monthIndex <= 13; monthIndex += 1) {
        const monthStart = addMonths(start, monthIndex);
        const { y, m } = parseISO(monthStart);
        const last = daysInMonth(y, m);
        const isCurrent = monthStart === startOfMonth(today);
        const day = d => toISO(y, m, Math.min(d, last));

        // Salario quincenal y aguinaldo.
        push({ type: 'income', amountMinor: colones(860000), date: day(15), accountId: 'cta-colones', categoryId: 'salario', merchant: 'Salario', recurringId: 'rec-salario', recurringDate: day(15) });
        push({ type: 'income', amountMinor: colones(860000), date: day(last), accountId: 'cta-colones', categoryId: 'salario', merchant: 'Salario', recurringId: 'rec-salario', recurringDate: day(last) });
        if (m === 12) push({ type: 'income', amountMinor: colones(1280000), date: day(14), accountId: 'cta-colones', categoryId: 'aguinaldo', merchant: 'Aguinaldo' });
        if (random() < 0.35) push({ type: 'income', amountMinor: colones(round(between(90000, 260000), 5000)), date: day(Math.floor(between(3, 27))), accountId: 'cta-colones', categoryId: 'freelance', merchant: 'Diseño independiente', method: 'transfer' });

        // Fijos.
        for (const rule of recurring) {
            if (rule.type !== 'expense') continue;
            if (rule.frequency === 'yearly' && m !== 12) continue;
            const d = rule.frequency === 'yearly' ? 15 : parseISO(rule.anchorDate).d;
            const variance = rule.id === 'rec-luz' || rule.id === 'rec-agua' ? between(0.85, 1.2) : 1;
            push({
                type: 'expense', amountMinor: Math.round(rule.amountMinor * variance / 100) * 100, currency: rule.currency,
                date: day(d), accountId: rule.accountId, categoryId: rule.categoryId, merchant: rule.name,
                recurringId: rule.id, recurringDate: day(d), debtId: rule.debtId, method: rule.accountId === 'tarjeta' ? 'card' : 'transfer'
            });
        }

        // Variables.
        const groceryMerchants = ['Supermercado Central', 'Mercado La Sabana', 'Súper El Buen Precio', 'Feria del agricultor'];
        const restaurantMerchants = ['Soda Doña Ana', 'Pizzería Napoli', 'Café del Barrio', 'Sushi Kaze', 'Taquería El Charro', 'Asados La Finca'];
        for (let d = 1; d <= last; d += 1) {
            const date = day(d);
            if (date > today) break;
            const weekdayIndex = new Date(date + 'T12:00:00Z').getUTCDay();
            if (random() < 0.34) {
                push({ type: 'expense', amountMinor: colones(round(between(8500, 42000))), date, accountId: pick(['tarjeta', 'cta-colones']), categoryId: 'supermercado', merchant: pick(groceryMerchants), method: 'card', receipt: random() < 0.3 ? { name: 'factura.xml', type: 'application/xml', demo: true } : undefined });
            }
            const restaurantChance = (weekdayIndex === 5 || weekdayIndex === 6 ? 0.55 : 0.18) * (isCurrent ? 1.45 : 1);
            // Los últimos días sin restaurantes: la demo lleva en curso el reto
            // «Semana sin restaurantes».
            const inChallenge = date > addDays(today, -4);
            if (random() < restaurantChance && !inChallenge) {
                push({ type: 'expense', amountMinor: colones(round(between(5500, 19500))), date, accountId: pick(['tarjeta', 'tarjeta', 'efectivo']), categoryId: 'restaurantes', merchant: pick(restaurantMerchants), method: 'card', impulsive: random() < 0.12 });
            }
            if (weekdayIndex === 1 && random() < 0.85) {
                push({ type: 'expense', amountMinor: colones(round(between(18000, 29000), 500)), date, accountId: 'tarjeta', categoryId: 'combustible', merchant: pick(['Servicentro La Uruca', 'Servicentro Los Yoses']), method: 'card' });
            }
            if (random() < 0.07) push({ type: 'expense', amountMinor: colones(round(between(3000, 9000))), date, accountId: 'efectivo', categoryId: 'transporte', merchant: pick(['Taxi', 'Parqueo', 'Peaje']), method: 'cash' });
            if (random() < 0.05) push({ type: 'expense', amountMinor: colones(round(between(9000, 32000))), date, accountId: 'tarjeta', categoryId: 'ocio', merchant: pick(['Cine', 'Concierto', 'Boliche']), method: 'card', impulsive: random() < 0.3 });
            if (random() < 0.03) push({ type: 'expense', amountMinor: colones(round(between(15000, 48000))), date, accountId: 'tarjeta', categoryId: 'ropa', merchant: pick(['Tienda de ropa', 'Zapatería', 'Barbería']), method: 'card', impulsive: random() < 0.4 });
            if (random() < 0.025) push({ type: 'expense', amountMinor: colones(round(between(6000, 26000))), date, accountId: 'cta-colones', categoryId: 'salud', merchant: 'Farmacia San Rafael', method: 'sinpe', receipt: random() < 0.5 ? { name: 'tiquete.xml', type: 'application/xml', demo: true } : undefined });
            if (random() < 0.02) push({ type: 'expense', amountMinor: colones(round(between(8000, 45000))), date, accountId: 'tarjeta', categoryId: 'hogar', merchant: 'Ferretería El Clavo', method: 'card' });
            if (random() < 0.018) push({ type: 'expense', amountMinor: Math.round(between(1800, 6500)), currency: 'USD', date, accountId: 'tarjeta', categoryId: 'otros-gastos', merchant: 'Tienda en línea', method: 'card' });
            if (random() < 0.02) push({ type: 'expense', amountMinor: colones(round(between(7000, 18000))), date, accountId: 'efectivo', categoryId: 'mascotas', merchant: 'Veterinaria Patitas', method: 'sinpe' });
        }
        if (m === 12 && monthStart <= today) push({ type: 'expense', amountMinor: colones(185000), date: day(20), accountId: 'tarjeta', categoryId: 'regalos', merchant: 'Regalos de Navidad', method: 'card' });

        // Pago de la tarjeta el día 3 y retiro de efectivo.
        if (monthIndex > 0) {
            push({ type: 'transfer', amountMinor: colones(round(between(260000, 340000), 1000)), toAmountMinor: null, date: day(3), accountId: 'cta-colones', toAccountId: 'tarjeta', merchant: 'Pago de tarjeta', method: 'transfer' });
            push({ type: 'transfer', amountMinor: colones(40000), date: day(16), accountId: 'cta-colones', toAccountId: 'efectivo', merchant: 'Retiro de cajero', method: 'cash' });
            push({ type: 'transfer', amountMinor: colones(250000), date: day(16), accountId: 'cta-colones', toAccountId: 'ahorro', merchant: 'Ahorro del mes', method: 'transfer' });
        }
    }
    // El pago de la tarjeta cubre lo que se cargó el mes anterior, como hace
    // quien la paga completa: si no, el saldo crecería mes a mes.
    for (const payment of txs.filter(tx => tx.merchant === 'Pago de tarjeta')) {
        const previous = addMonths(startOfMonth(payment.date), -1);
        const charged = txs
            .filter(tx => tx.type === 'expense' && tx.accountId === 'tarjeta' && tx.date >= previous && tx.date < startOfMonth(payment.date))
            .reduce((sum, tx) => sum + (tx.currency === 'USD' ? tx.amountMinor * 505 : tx.amountMinor), 0);
        payment.amountMinor = Math.max(colones(20000), Math.round(charged / 100000) * 100000);
    }
    for (const tx of txs) if (tx.type === 'transfer' && tx.toAmountMinor == null) tx.toAmountMinor = tx.amountMinor;

    // Metas y aportes.
    const goals = [
        { id: 'meta-landcruiser', name: 'Land Cruiser 80', kind: 'carro', targetMinor: colones(15000000), currency: 'CRC', monthlyPlanMinor: colones(250000), deadline: addMonths(today, 60), priority: 1, status: 'active', startDate: start, note: 'La del 94, con motor 1HZ.' },
        { id: 'meta-finca', name: 'Finca en Pérez Zeledón', kind: 'finca', targetMinor: colones(30000000), currency: 'CRC', monthlyPlanMinor: colones(150000), deadline: null, priority: 2, status: 'active', startDate: start },
        { id: 'meta-emergencia', name: 'Fondo de emergencia', kind: 'emergencia', targetMinor: colones(2000000), currency: 'CRC', monthlyPlanMinor: colones(100000), priority: 1, status: 'active', startDate: start },
        { id: 'meta-japon', name: 'Viaje a Japón', kind: 'viaje', targetMinor: 450000, currency: 'USD', monthlyPlanMinor: 15000, deadline: addMonths(today, 20), priority: 3, status: 'active', startDate: addMonths(start, 5) }
    ];
    const contributions = [];
    const initial = { 'meta-landcruiser': colones(820000), 'meta-finca': colones(900000), 'meta-emergencia': colones(430000), 'meta-japon': 20000 };
    for (const goal of goals) {
        contributions.push({ id: id('ap'), goalId: goal.id, amountMinor: initial[goal.id], date: goal.startDate, note: 'Saldo inicial' });
        for (let k = 1; k <= 13; k += 1) {
            const date = toISO(parseISO(addMonths(start, k)).y, parseISO(addMonths(start, k)).m, 16);
            if (date > today || date < goal.startDate) continue;
            const factor = goal.id === 'meta-landcruiser' && k > 9 ? 0.6 : between(0.85, 1.1);
            contributions.push({ id: id('ap'), goalId: goal.id, amountMinor: Math.round(goal.monthlyPlanMinor * factor / 100) * 100, date });
        }
    }
    const aguinaldoMonth = `${parseISO(start).y}-12-16`;
    if (aguinaldoMonth <= today) contributions.push({ id: id('ap'), goalId: 'meta-landcruiser', amountMinor: colones(860000), date: aguinaldoMonth, note: 'Medio aguinaldo' });

    const debts = [
        { id: 'deuda-carro', name: 'Préstamo del carro', lender: 'Banco', kind: 'vehicle', principalMinor: colones(9000000), balanceMinor: colones(6180000), currency: 'CRC', annualRate: 10.5, termMonths: 72, paymentMinor: colones(185000), dueDay: 12, startDate: addMonths(today, -26), active: true, onTimeMonths: 13 }
    ];

    const budgets = [
        ['supermercado', 330000], ['restaurantes', 95000], ['combustible', 110000], ['ocio', 45000],
        ['ropa', 40000], ['transporte', 35000], ['suscripciones', 15000], ['servicios', 95000], ['mascotas', 20000]
    ].map(([categoryId, amount]) => ({ id: categoryId, categoryId, amountMinor: colones(amount), currency: 'CRC', rollover: false }));

    const simulations = [
        { id: 'sim-montero', name: 'Montero Sport 2019', priceMinor: colones(8000000), currency: 'CRC', mode: 'compare', downPct: 20, annualRate: 11.5, months: 60, feesPct: 2.5, date: addDays(today, -12) }
    ];

    return {
        profile: {
            displayName: 'Alex',
            onboarded: true,
            createdAt: start,
            settings: {
                baseCurrency: 'CRC',
                fxRate: 505,
                fxUpdatedAt: today,
                fxSource: 'manual',
                payday: { mode: 'semimonthly' },
                periodStartDay: 1,
                gamification: true,
                sounds: false,
                largeExpenseMinor: colones(100000),
                taxId: '',
                emergencyMonths: 6,
                alerts: {},
                email: { immediate: true, daily: true, weekly: true, monthly: true }
            },
            alertState: {},
            celebrated: {},
            challenges: [{ id: 'semana-sin-restaurantes', startDate: addDays(today, -3) }]
        },
        collections: {
            accounts,
            categories: defaultCategories().map(category => ({ ...category })),
            transactions: txs,
            budgets,
            goals,
            contributions,
            recurring: recurringActive,
            debts,
            simulations,
            receipts: []
        }
    };
}
