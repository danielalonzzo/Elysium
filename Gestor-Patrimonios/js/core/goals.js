/**
 * Metas: «¿Para qué está ahorrando?».
 *
 * Una meta guarda su objetivo; lo ahorrado sale de sus aportes (positivos) y
 * retiros (negativos). La fecha estimada se calcula con dos ritmos: el
 * planeado (lo que la persona dice que aportará) y el real (lo que ha aportado
 * de verdad en los últimos meses). Enseñar los dos es lo que hace honesta la
 * promesa.
 */
import { addDays, diffDays, monthsBetween, AVG_DAYS_PER_MONTH } from './dates.js';
import { formatMoney, percent } from './money.js';

export const GOAL_KINDS = Object.freeze({
    casa: { label: 'Casa', icon: 'home' },
    carro: { label: 'Carro', icon: 'car' },
    viaje: { label: 'Viaje', icon: 'plane' },
    negocio: { label: 'Negocio', icon: 'briefcase' },
    finca: { label: 'Finca', icon: 'sprout' },
    emergencia: { label: 'Fondo de emergencia', icon: 'shield' },
    educacion: { label: 'Educación', icon: 'book' },
    otro: { label: 'Otro sueño', icon: 'star' }
});

export const MILESTONES = [25, 50, 75, 100];

export function goalSaved(goalId, contributions) {
    return (contributions || [])
        .filter(c => c.goalId === goalId)
        .reduce((sum, c) => sum + (Number(c.amountMinor) || 0), 0);
}

export function goalProgress(goal, saved) {
    const target = Math.max(0, Number(goal?.targetMinor) || 0);
    const current = Math.max(0, Number(saved) || 0);
    const pct = target ? Math.min(100, percent(current, target)) : 0;
    const milestone = [...MILESTONES].reverse().find(m => pct >= m) || 0;
    return { target, saved: current, remaining: Math.max(0, target - current), pct, milestone, done: target > 0 && current >= target };
}

/**
 * Aporte mensual real: lo aportado en los últimos `months` meses dividido
 * entre los meses que la meta lleva viva dentro de esa ventana.
 */
export function actualMonthlyRate(goal, contributions, today, months = 3) {
    const from = addDays(today, -Math.round(months * AVG_DAYS_PER_MONTH));
    const createdAt = goal?.startDate && goal.startDate > from ? goal.startDate : from;
    const windowMonths = Math.max(1, monthsBetween(createdAt, today));
    const sum = (contributions || [])
        .filter(c => c.goalId === goal?.id && c.date >= from && c.date <= today)
        .reduce((total, c) => total + (Number(c.amountMinor) || 0), 0);
    return Math.max(0, Math.round(sum / windowMonths));
}

/** Fecha estimada para juntar `remaining` aportando `monthly` al mes. */
export function etaFromMonthly(remaining, monthly, today) {
    if (remaining <= 0) return { months: 0, days: 0, date: today };
    if (!monthly || monthly <= 0) return { months: Infinity, days: Infinity, date: null };
    const perDay = monthly / AVG_DAYS_PER_MONTH;
    const days = Math.ceil(remaining / perDay);
    return { months: remaining / monthly, days, date: addDays(today, days) };
}

/** Aporte mensual necesario para llegar a `deadline`. */
export function requiredMonthly(remaining, today, deadline) {
    if (remaining <= 0) return 0;
    if (!deadline) return null;
    const months = monthsBetween(today, deadline);
    if (months <= 0) return remaining;
    return Math.ceil(remaining / Math.max(months, 1 / AVG_DAYS_PER_MONTH));
}

/**
 * Días que un gasto retrasa (o adelanta, si se evita) una meta, dado el
 * aporte mensual. «Si no gasta ₡20.000 este fin de semana, alcanza su meta
 * 5 días antes.»
 */
export function spendImpactDays(amountMinor, monthlyContribution) {
    if (!monthlyContribution || monthlyContribution <= 0) return null;
    const perDay = monthlyContribution / AVG_DAYS_PER_MONTH;
    return Math.round((Number(amountMinor) || 0) / perDay);
}

/** Objetivo del fondo de emergencia: N meses de gasto medio. */
export function emergencyTarget(averageMonthlyExpense, months = 6) {
    return Math.max(0, Math.round((Number(averageMonthlyExpense) || 0) * months));
}

/**
 * Escenarios de «Cómo acelerar la meta». Cada uno dice cuántos días se gana.
 * @param {{remaining: number, monthly: number, today: string, currency?: string,
 *          topCategory?: {name: string, averageMinor: number}, aguinaldoMinor?: number}} input
 */
export function accelerationScenarios({ remaining, monthly, today, currency = 'CRC', topCategory = null, aguinaldoMinor = 0 }) {
    const base = etaFromMonthly(remaining, monthly, today);
    const scenarios = [];
    const add = (id, label, detail, newMonthly, lump = 0) => {
        const eta = etaFromMonthly(Math.max(0, remaining - lump), newMonthly, today);
        const daysSaved = Number.isFinite(base.days) && Number.isFinite(eta.days)
            ? base.days - eta.days
            : (Number.isFinite(eta.days) ? null : 0);
        if (eta.date && (daysSaved === null || daysSaved > 0)) {
            scenarios.push({ id, label, detail, newMonthly, lump, eta, daysSaved });
        }
    };

    const step = currency === 'CRC' ? 2500000 : 5000; // ₡25.000 / $50 o €50
    add('extra', 'Aportar un poco más', `+${formatMoney(step, currency)} al mes`, monthly + step);

    if (topCategory?.averageMinor > 0) {
        const cut = Math.round(topCategory.averageMinor * 0.1);
        add('recorte', `Recortar ${topCategory.name} un 10%`, `≈ ${formatMoney(cut, currency)} al mes`, monthly + cut);
    }
    if (aguinaldoMinor > 0) {
        const lump = Math.round(aguinaldoMinor * 0.5);
        add('aguinaldo', 'Destinar medio aguinaldo', 'Un aporte único en diciembre', monthly, lump);
    }
    if (monthly > 0) add('veinte', 'Subir el aporte un 20%', 'Mismo hábito, un escalón más', Math.round(monthly * 1.2));

    return scenarios.sort((a, b) => (b.daysSaved ?? 1e9) - (a.daysSaved ?? 1e9));
}

/** Estado de la meta frente a su fecha deseada. */
export function goalHealth({ progress, plannedMonthly, actualMonthly, deadline, today }) {
    if (progress.done) return { state: 'done', label: 'Cumplida' };
    const monthly = actualMonthly > 0 ? actualMonthly : plannedMonthly;
    if (!monthly) return { state: 'no-plan', label: 'Sin aporte definido' };
    const eta = etaFromMonthly(progress.remaining, monthly, today);
    if (!deadline) return { state: 'on-track', label: 'En camino', eta };
    if (deadline < today) return { state: 'late', label: 'Fecha superada', eta };
    if (eta.date && eta.date <= deadline) return { state: 'on-track', label: 'A tiempo', eta };
    return { state: 'at-risk', label: 'En riesgo', eta, lateDays: eta.date ? diffDays(deadline, eta.date) : null };
}

/**
 * Reparte la capacidad de ahorro entre las metas activas que no tienen un
 * aporte planeado, según su prioridad (1 alta, 2 media, 3 baja). Todo en una
 * sola moneda: quien la llama pasa los aportes planeados ya convertidos.
 */
export function capacityShares(goals, capacityMinor) {
    const active = (goals || []).filter(goal => goal.status !== 'done' && goal.status !== 'archived');
    const planned = active.reduce((sum, goal) => sum + (Number(goal.monthlyPlanMinor) || 0), 0);
    const free = Math.max(0, (Number(capacityMinor) || 0) - planned);
    const unplanned = active.filter(goal => !(Number(goal.monthlyPlanMinor) > 0));
    const weight = goal => ({ 1: 3, 2: 2, 3: 1 }[goal.priority] || 2);
    const totalWeight = unplanned.reduce((sum, goal) => sum + weight(goal), 0);
    const shares = new Map();
    for (const goal of active) {
        if (Number(goal.monthlyPlanMinor) > 0) shares.set(goal.id, Number(goal.monthlyPlanMinor));
        else shares.set(goal.id, totalWeight ? Math.round(free * weight(goal) / totalWeight) : 0);
    }
    return shares;
}
