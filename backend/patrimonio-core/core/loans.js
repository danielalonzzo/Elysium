// GENERADO por scripts/sync-patrimonio-core.mjs desde Gestor-Patrimonios/js/core/loans.js.
// No se edita aquí: se edita el original y se vuelve a ejecutar el script.
/**
 * Créditos, simulador de compra y «¿Me alcanza?».
 *
 * La cuota es la del sistema francés (cuota fija), el que usan los bancos
 * costarricenses para préstamos de vehículo, vivienda y personales. Los
 * cálculos van en céntimos; la cuota se redondea al céntimo y la última fila
 * de la tabla absorbe la diferencia para que el saldo cierre en cero exacto.
 */
import { addMonths, AVG_DAYS_PER_MONTH, addDays } from './dates.js';
import { formatMoney, percent } from './money.js';

/** Cuota mensual de un préstamo de `principal` a `annualRatePct` y `months`. */
export function monthlyPayment(principal, annualRatePct, months) {
    const p = Math.max(0, Number(principal) || 0);
    const n = Math.max(1, Math.round(Number(months) || 1));
    const r = (Number(annualRatePct) || 0) / 12 / 100;
    if (p === 0) return 0;
    if (r === 0) return Math.round(p / n);
    return Math.round(p * r / (1 - Math.pow(1 + r, -n)));
}

/**
 * Tabla de amortización. `extraMonthly` adelanta capital cada mes (acorta el
 * plazo, no la cuota).
 */
export function amortization(principal, annualRatePct, months, { extraMonthly = 0, startDate = null } = {}) {
    const r = (Number(annualRatePct) || 0) / 12 / 100;
    const payment = monthlyPayment(principal, annualRatePct, months);
    const rows = [];
    let balance = Math.max(0, Number(principal) || 0);
    let totalInterest = 0;
    let totalPaid = 0;
    let n = 0;
    while (balance > 0 && n < 1200) {
        n += 1;
        const interest = Math.round(balance * r);
        let principalPart = payment - interest + Math.max(0, Number(extraMonthly) || 0);
        if (principalPart <= 0 && r > 0) break; // cuota que no cubre intereses
        // La última cuota absorbe el redondeo para cerrar el saldo en cero.
        if (principalPart > balance || (n === Math.max(1, Math.round(months)) && !extraMonthly)) principalPart = balance;
        const paid = principalPart + interest;
        balance -= principalPart;
        totalInterest += interest;
        totalPaid += paid;
        rows.push({
            n,
            date: startDate ? addMonths(startDate, n) : null,
            payment: paid,
            interest,
            principal: principalPart,
            balance
        });
    }
    return { payment, rows, months: rows.length, totalInterest, totalPaid };
}

/** Meses que faltan para saldar `balance` pagando `payment` al mes. */
export function monthsToPayoff(balance, annualRatePct, payment) {
    const b = Number(balance) || 0;
    const p = Number(payment) || 0;
    if (b <= 0) return 0;
    if (p <= 0) return Infinity;
    const r = (Number(annualRatePct) || 0) / 12 / 100;
    if (r === 0) return Math.ceil(b / p);
    if (p <= b * r) return Infinity;
    return Math.ceil(-Math.log(1 - r * b / p) / Math.log(1 + r));
}

/** Intereses de un mes sobre un saldo (para repartir un pago en capital e intereses). */
export function monthlyInterest(balance, annualRatePct) {
    return Math.round((Number(balance) || 0) * (Number(annualRatePct) || 0) / 12 / 100);
}

/** Semáforo de endeudamiento: cuota como porcentaje del ingreso mensual. */
export function debtToIncome(paymentMinor, incomeMinor) {
    const pct = percent(paymentMinor, incomeMinor);
    const state = !incomeMinor ? 'unknown' : pct < 30 ? 'ok' : pct <= 40 ? 'caution' : 'risk';
    return { pct, state };
}

/**
 * Simulación completa de una compra.
 *
 * @param {object} input
 * @param {number} input.price               precio en céntimos (ya en moneda base)
 * @param {number} [input.downPayment]       prima en céntimos
 * @param {number} [input.annualRate]        tasa anual en %
 * @param {number} [input.months]            plazo en meses
 * @param {number} [input.feesPct]           gastos de formalización (% del préstamo)
 * @param {number} [input.insuranceMonthly]  seguros u otros cargos mensuales
 * @param {number} input.savingsAvailable    ahorro disponible hoy (sin el fondo de emergencia)
 * @param {number} input.monthlyCapacity     capacidad de ahorro mensual
 * @param {number} input.monthlyIncome       ingreso mensual
 * @param {number} [input.existingDebtPayments] cuotas que ya paga
 * @param {string} input.today
 * @param {string} [input.currency]         moneda base, para los textos
 */
export function simulatePurchase(input) {
    const price = Math.max(0, Number(input.price) || 0);
    const down = Math.min(price, Math.max(0, Number(input.downPayment) || 0));
    const savings = Math.max(0, Number(input.savingsAvailable) || 0);
    const capacity = Math.max(0, Number(input.monthlyCapacity) || 0);
    const income = Math.max(0, Number(input.monthlyIncome) || 0);
    const existing = Math.max(0, Number(input.existingDebtPayments) || 0);
    const today = input.today;

    // Contado: lo que falta después del ahorro, al ritmo de la capacidad.
    const cashGap = Math.max(0, price - savings);
    const cashMonths = cashGap === 0 ? 0 : capacity > 0 ? cashGap / capacity : Infinity;
    const cash = {
        gap: cashGap,
        months: cashMonths,
        date: cashGap === 0 ? today : Number.isFinite(cashMonths) ? addDays(today, Math.ceil(cashMonths * AVG_DAYS_PER_MONTH)) : null,
        savingsAfter: Math.max(0, savings - price)
    };

    // Crédito: préstamo por lo que no cubre la prima.
    let credit = null;
    if (input.months > 0) {
        const loan = price - down;
        const fees = Math.round(loan * (Number(input.feesPct) || 0) / 100);
        const plan = amortization(loan, input.annualRate, input.months);
        const insurance = Math.max(0, Number(input.insuranceMonthly) || 0);
        const monthly = plan.payment + insurance;
        const dti = debtToIncome(monthly + existing, income);
        credit = {
            loan,
            downPayment: down,
            downPct: percent(down, price),
            fees,
            payment: plan.payment,
            monthly,
            months: plan.months,
            totalInterest: plan.totalInterest,
            totalCost: down + plan.totalPaid + fees + insurance * plan.months,
            overPrice: down + plan.totalPaid + fees + insurance * plan.months - price,
            dti,
            capacityAfter: capacity - monthly,
            savingsAfterDown: savings - down - fees,
            rows: plan.rows
        };
    }

    return { price, cash, credit, verdict: purchaseVerdict({ price, cash, credit, capacity, savings, currency: input.currency }) };
}

function purchaseVerdict({ price, cash, credit, capacity, savings, currency = 'CRC' }) {
    const reasons = [];
    if (cash.gap === 0) {
        reasons.push('Su ahorro disponible cubre el precio completo.');
        return { level: 'yes', title: 'Puede comprarlo', reasons };
    }
    if (credit) {
        if (credit.savingsAfterDown < 0) reasons.push('La prima y los gastos superan su ahorro disponible.');
        if (credit.dti.state === 'risk') reasons.push(`Las cuotas se llevarían el ${Math.round(credit.dti.pct)}% de su ingreso.`);
        if (credit.capacityAfter < 0) reasons.push('La cuota es mayor que lo que ahorra al mes.');
        if (!reasons.length) {
            // Sin ingreso conocido no hay endeudamiento que medir: no se puede decir que es sano.
            if (credit.dti.state === 'unknown') {
                reasons.push('No conocemos su ingreso mensual, así que no podemos decir si el endeudamiento es sano. Anótelo en el simulador.');
                return { level: 'caution', title: 'Falta su ingreso para decidir', reasons };
            }
            if (credit.dti.state === 'caution') {
                reasons.push(`La cuota compromete el ${Math.round(credit.dti.pct)}% de su ingreso: entra, pero justo.`);
                return { level: 'caution', title: 'Puede, pero con cuidado', reasons };
            }
            reasons.push('La cuota cabe en su capacidad de ahorro y el endeudamiento es sano.');
            return { level: 'yes', title: 'Puede financiarlo', reasons };
        }
    }
    if (Number.isFinite(cash.months)) {
        reasons.push(`Ahorrando ${formatMoney(capacity, currency)} al mes lo tendría de contado.`);
        return { level: 'wait', title: `Espere ${Math.ceil(cash.months)} ${Math.ceil(cash.months) === 1 ? 'mes' : 'meses'}`, months: Math.ceil(cash.months), reasons };
    }
    reasons.push('Hoy no hay capacidad de ahorro para llegar a este precio.');
    return { level: 'no', title: 'Todavía no', reasons, price, savings };
}

/**
 * «¿Me alcanza?»: la respuesta rápida para cuando se está en la tienda.
 *
 * 1. Si cabe en lo que queda del período (presupuesto de su categoría o, sin
 *    presupuesto, lo disponible para gastar), sí.
 * 2. Si no, pero cabe en el ahorro libre (sin tocar el fondo de emergencia),
 *    se puede, a costa de retrasar las metas.
 * 3. Si no, cuánto hay que esperar.
 */
export function quickAffordability({
    price, periodAvailable = 0, categoryRemaining = null, freeSavings = 0,
    monthlyCapacity = 0, goalMonthly = 0, today
}) {
    const amount = Math.max(0, Number(price) || 0);
    const bucket = categoryRemaining !== null && categoryRemaining !== undefined
        ? Math.min(categoryRemaining, periodAvailable)
        : periodAvailable;
    const usable = Math.max(0, bucket);
    const savings = Math.max(0, freeSavings);
    const delayFor = fromSavings => (goalMonthly > 0 ? Math.round(fromSavings / (goalMonthly / AVG_DAYS_PER_MONTH)) : null);

    if (amount <= usable) {
        return {
            level: 'yes',
            title: 'Sí, le alcanza',
            leftover: usable - amount,
            detail: 'Cabe en lo que le queda este período.'
        };
    }
    if (amount <= savings) {
        const delayDays = delayFor(amount);
        return {
            level: 'caution',
            title: 'Le alcanza con sus ahorros',
            leftover: savings - amount,
            delayDays,
            detail: delayDays ? `Retrasaría sus metas unos ${delayDays} días.` : 'Tendría que tomarlo de sus ahorros.'
        };
    }
    // Ni lo que queda del período ni el ahorro alcanzan por separado, pero juntos sí.
    if (amount <= usable + savings) {
        const delayDays = delayFor(amount - usable);
        return {
            level: 'caution',
            title: 'Le alcanza con sus ahorros',
            leftover: usable + savings - amount,
            delayDays,
            detail: delayDays
                ? `Usaría lo que le queda del período y parte de sus ahorros: retrasaría sus metas unos ${delayDays} días.`
                : 'Usaría lo que le queda del período y parte de sus ahorros.'
        };
    }
    const gap = amount - usable - savings;
    if (monthlyCapacity > 0) {
        const months = gap / monthlyCapacity;
        const days = Math.ceil(months * AVG_DAYS_PER_MONTH);
        return {
            level: 'wait',
            title: 'Mejor espere',
            gap,
            months,
            date: addDays(today, days),
            detail: `${freeSavings > 0 ? 'Sumando sus ahorros libres a lo que ahorra cada mes' : 'Con su ritmo de ahorro'}, lo tendría en ${days < 45 ? days + ' días' : Math.ceil(months) + ' meses'}.`
        };
    }
    return { level: 'no', title: 'Hoy no le alcanza', gap, detail: 'Primero hace falta liberar capacidad de ahorro.' };
}

/**
 * Plan para salir de deudas: avalancha (primero la tasa más alta, paga menos
 * intereses) o bola de nieve (primero el saldo más pequeño, motiva antes).
 * Se paga el mínimo de todas y el extra va a la prioritaria; al saldar una, su
 * cuota se suma al extra.
 */
export function payoffPlan(debts, { extraMonthly = 0, strategy = 'avalanche', today = null } = {}) {
    const pool = (debts || [])
        .filter(d => d.active !== false && Number(d.balanceMinor) > 0)
        .map(d => ({
            id: d.id,
            name: d.name,
            balance: Number(d.balanceMinor),
            rate: Number(d.annualRate) || 0,
            payment: Math.max(1, Number(d.paymentMinor) || 0),
            paidOffMonth: null,
            interest: 0
        }));
    if (!pool.length) return { months: 0, totalInterest: 0, order: [], freedomDate: today };

    const order = strategy === 'snowball'
        ? (a, b) => a.balance - b.balance || b.rate - a.rate
        : (a, b) => b.rate - a.rate || a.balance - b.balance;

    let month = 0;
    let totalInterest = 0;
    const finished = [];
    while (pool.some(d => d.balance > 0) && month < 600) {
        month += 1;
        let extra = Math.max(0, Number(extraMonthly) || 0)
            + pool.filter(d => d.balance <= 0).reduce((sum, d) => sum + d.payment, 0);
        for (const debt of pool) {
            if (debt.balance <= 0) continue;
            const interest = Math.round(debt.balance * debt.rate / 12 / 100);
            debt.interest += interest;
            totalInterest += interest;
            debt.balance += interest;
            const pay = Math.min(debt.balance, debt.payment);
            debt.balance -= pay;
            if (debt.balance <= 0) extra += debt.payment - pay;
        }
        const targets = pool.filter(d => d.balance > 0).sort(order);
        for (const debt of targets) {
            if (extra <= 0) break;
            const pay = Math.min(debt.balance, extra);
            debt.balance -= pay;
            extra -= pay;
        }
        for (const debt of pool) {
            if (debt.balance <= 0 && debt.paidOffMonth === null) {
                debt.paidOffMonth = month;
                finished.push({ id: debt.id, name: debt.name, month, date: today ? addMonths(today, month) : null });
            }
        }
    }
    // Si tras 50 años aún queda saldo, alguna cuota no cubre sus intereses: no hay fecha que prometer.
    const stuck = pool.some(d => d.balance > 0);
    return {
        months: month,
        totalInterest,
        order: finished,
        freedomDate: today && !stuck ? addMonths(today, month) : null,
        stuck
    };
}
