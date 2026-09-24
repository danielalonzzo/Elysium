// GENERADO por scripts/sync-patrimonio-core.mjs desde Gestor-Patrimonios/js/core/gamification.js.
// No se edita aquí: se edita el original y se vuelve a ejecutar el script.
/**
 * Logros, puntos, niveles, rachas y retos.
 *
 * Todo se deriva de los datos: los puntos no se guardan sumando eventos,
 * se recalculan. Así no hay forma de que se desincronicen, y borrar un
 * movimiento duplicado descuenta sus puntos sin lógica extra. Lo único que se
 * guarda es la fecha en que se desbloqueó cada insignia (para celebrarlo una
 * vez) y los retos aceptados.
 *
 * Los niveles llevan nombres de monedas griegas —el Elíseo es griego—, del
 * óbolo al talento.
 */
import { addDays, diffDays } from './dates.js';
import { formatMoney } from './money.js';

export const POINTS = Object.freeze({
    loggingDay: 5,
    impulseFreeWeek: 50,
    goalCompleted: 300,
    monthWithinBudget: 100
});

export const LEVELS = Object.freeze([
    { id: 'obolo', name: 'Óbolo', min: 0, motto: 'Cada colón cuenta.' },
    { id: 'dracma', name: 'Dracma', min: 500, motto: 'El hábito ya es suyo.' },
    { id: 'estatero', name: 'Estátero', min: 1500, motto: 'Su dinero tiene un plan.' },
    { id: 'mina', name: 'Mina', min: 4000, motto: 'Construye patrimonio.' },
    { id: 'talento', name: 'Talento', min: 10000, motto: 'Dominio absoluto.' }
]);

export function levelFor(points) {
    let index = 0;
    LEVELS.forEach((level, i) => { if (points >= level.min) index = i; });
    const level = LEVELS[index];
    const next = LEVELS[index + 1] || null;
    const progress = next ? (points - level.min) / (next.min - level.min) * 100 : 100;
    return { ...level, index, next, progress, toNext: next ? next.min - points : 0 };
}

/* ── Rachas ───────────────────────────────────────────────────────────────── */

/** Días (fecha de registro) en que se anotó al menos un movimiento. */
export function loggingDays(txs) {
    const days = new Set();
    for (const tx of txs || []) days.add(tx.createdDate || tx.date);
    return days;
}

/** Racha actual: días seguidos hasta hoy (o hasta ayer, si hoy aún no se anotó nada). */
export function currentStreak(days, today) {
    let cursor = days.has(today) ? today : addDays(today, -1);
    let streak = 0;
    while (days.has(cursor)) {
        streak += 1;
        cursor = addDays(cursor, -1);
    }
    return streak;
}

export function longestStreak(days) {
    const sorted = [...days].sort();
    let best = 0;
    let run = 0;
    let prev = null;
    for (const day of sorted) {
        run = prev && diffDays(prev, day) === 1 ? run + 1 : 1;
        best = Math.max(best, run);
        prev = day;
    }
    return best;
}

/**
 * Tramos sin gastos impulsivos desde el primer registro: cuántas semanas
 * completas (7 días seguidos) se lograron, la racha actual y la mejor.
 */
export function impulseFreeRuns(txs, today) {
    const list = txs || [];
    if (!list.length) return { weeks: 0, current: 0, best: 0 };
    const first = list.reduce((min, tx) => (tx.date < min ? tx.date : min), today);
    const impulsive = new Set(list.filter(tx => tx.type === 'expense' && tx.impulsive).map(tx => tx.date));
    let weeks = 0;
    let run = 0;
    let best = 0;
    let block = 0;
    for (let day = first; day <= today; day = addDays(day, 1)) {
        if (impulsive.has(day)) {
            run = 0;
            block = 0;
            continue;
        }
        run += 1;
        block += 1;
        best = Math.max(best, run);
        if (block === 7) {
            weeks += 1;
            block = 0;
        }
    }
    return { weeks, current: run, best };
}

/* ── Insignias ────────────────────────────────────────────────────────────── */

/**
 * Los hitos de ahorro dependen de la moneda principal: «el primer millón» de
 * colones son unos 2.000 dólares, y un millón de euros no es un hito, es otra
 * vida. Los ids no cambian, así que lo ya celebrado se respeta.
 */
export const SAVINGS_SCALE = Object.freeze({
    CRC: {
        first: { amount: 10000000, name: 'Primeros ₡100.000', description: 'Ahorre sus primeros cien mil colones.' },
        big: { amount: 100000000, name: 'Primer millón', description: 'Un millón de colones ahorrado.' },
        week: 100000
    },
    USD: {
        first: { amount: 100000, name: 'Primeros $1.000', description: 'Ahorre sus primeros mil dólares.' },
        big: { amount: 1000000, name: 'Primeros $10.000', description: 'Diez mil dólares ahorrados.' },
        week: 100
    },
    EUR: {
        first: { amount: 100000, name: 'Primeros €1.000', description: 'Ahorre sus primeros mil euros.' },
        big: { amount: 1000000, name: 'Primeros €10.000', description: 'Diez mil euros ahorrados.' },
        week: 100
    }
});

export function savingsScale(currency) {
    return SAVINGS_SCALE[currency] || SAVINGS_SCALE.CRC;
}

const ratio = (value, target) => Math.max(0, Math.min(1, (Number(value) || 0) / target));

export const BADGES = Object.freeze([
    { id: 'primer-paso', name: 'Primer paso', description: 'Registre su primer movimiento.', tier: 'bronze', points: 25, icon: 'feather',
        evaluate: s => ratio(s.txCount, 1) },
    { id: 'constancia', name: 'Constancia', description: 'Registre movimientos 7 días seguidos.', tier: 'bronze', points: 50, icon: 'flame',
        evaluate: s => ratio(s.longestStreak, 7) },
    { id: 'disciplina', name: 'Disciplina', description: '30 días seguidos registrando.', tier: 'gold', points: 200, icon: 'flame',
        evaluate: s => ratio(s.longestStreak, 30) },
    { id: 'arquitecto', name: 'Arquitecto', description: 'Cree su primer presupuesto.', tier: 'bronze', points: 25, icon: 'compass',
        evaluate: s => ratio(s.budgetsCount, 1) },
    { id: 'mes-impecable', name: 'Mes impecable', description: 'Cierre un mes dentro de todos sus presupuestos.', tier: 'silver', points: 100, icon: 'check-circle',
        evaluate: s => ratio(s.monthsWithinBudget, 1) },
    { id: 'cien-mil', milestone: 'first', tier: 'bronze', points: 50, icon: 'coins',
        evaluate: s => ratio(s.totalSaved, s.scale.first.amount) },
    { id: 'primer-millon', milestone: 'big', tier: 'gold', points: 200, icon: 'crown',
        evaluate: s => ratio(s.totalSaved, s.scale.big.amount) },
    { id: 'red-de-seguridad', name: 'Red de seguridad', description: 'Complete su fondo de emergencia.', tier: 'gold', points: 250, icon: 'shield',
        evaluate: s => ratio(s.emergencyPct, 100) },
    { id: 'sueno-cumplido', name: 'Sueño cumplido', description: 'Cumpla su primera meta.', tier: 'silver', points: 150, icon: 'star',
        evaluate: s => ratio(s.goalsDone, 1) },
    { id: 'coleccionista', name: 'Coleccionista de sueños', description: 'Cumpla tres metas.', tier: 'gold', points: 300, icon: 'stars',
        evaluate: s => ratio(s.goalsDone, 3) },
    { id: 'puntualidad', name: 'Puntualidad', description: '6 meses sin atrasos en sus cuotas.', tier: 'gold', points: 200, icon: 'calendar-check',
        evaluate: s => ratio(s.onTimeMonths, 6) },
    { id: 'libre', name: 'Libre', description: 'Salde una deuda por completo.', tier: 'silver', points: 150, icon: 'unlock',
        evaluate: s => ratio(s.debtsPaidOff, 1) },
    { id: 'temple', name: 'Temple', description: '7 días seguidos sin gastos impulsivos.', tier: 'bronze', points: 50, icon: 'anchor',
        evaluate: s => ratio(s.bestImpulseFree, 7) },
    { id: 'elite', name: 'Ahorro de élite', description: 'Cierre un mes ahorrando el 20 % o más de su ingreso.', tier: 'silver', points: 100, icon: 'trending-up',
        evaluate: s => ratio(s.bestSavingsRate, 20) },
    { id: 'archivista', name: 'Archivista', description: 'Adjunte 25 comprobantes.', tier: 'silver', points: 75, icon: 'archive',
        evaluate: s => ratio(s.receiptsCount, 25) },
    { id: 'prudente', name: 'Comprador prudente', description: 'Simule una compra antes de hacerla.', tier: 'bronze', points: 25, icon: 'scale',
        evaluate: s => ratio(s.simulationsCount, 1) },
    { id: 'aguinaldo-sabio', name: 'Aguinaldo sabio', description: 'Ahorre al menos la mitad de su aguinaldo.', tier: 'silver', points: 150, icon: 'gift',
        evaluate: s => ratio(s.aguinaldoSavedPct, 50) },
    { id: 'numero-verde', name: 'Número verde', description: 'Alcance un patrimonio neto positivo.', tier: 'bronze', points: 50, icon: 'sprout',
        evaluate: s => (s.netWorth > 0 ? 1 : 0) }
]);

export const TIER_LABELS = Object.freeze({ bronze: 'Bronce', silver: 'Plata', gold: 'Oro' });

/* ── Retos ────────────────────────────────────────────────────────────────── */

export const CHALLENGES = Object.freeze([
    {
        id: 'semana-sin-restaurantes', name: 'Semana sin restaurantes', days: 7, points: 150, icon: 'utensils',
        description: 'Siete días cocinando en casa. Nada en restaurantes ni comida rápida.',
        evaluate: ({ txs, startDate, today }) => {
            const end = addDays(startDate, 6);
            const broke = (txs || []).some(tx => tx.type === 'expense' && tx.categoryId === 'restaurantes' && tx.date >= startDate && tx.date <= end);
            const elapsed = Math.min(7, Math.max(0, diffDays(startDate, today) + 1));
            return { failed: broke, done: !broke && today > end, progress: elapsed / 7, detail: `${elapsed} de 7 días` };
        }
    },
    {
        id: 'treinta-sin-impulsos', name: '30 días sin impulsos', days: 30, points: 200, icon: 'anchor',
        description: 'Un mes entero sin marcar ningún gasto como impulsivo.',
        evaluate: ({ txs, startDate, today }) => {
            const end = addDays(startDate, 29);
            const broke = (txs || []).some(tx => tx.type === 'expense' && tx.impulsive && tx.date >= startDate && tx.date <= end);
            const elapsed = Math.min(30, Math.max(0, diffDays(startDate, today) + 1));
            return { failed: broke, done: !broke && today > end, progress: elapsed / 30, detail: `${elapsed} de 30 días` };
        }
    },
    {
        id: 'reto-52-semanas', name: 'Reto de las 52 semanas', days: 364, points: 400, icon: 'calendar',
        description: (currency = 'CRC') => {
            const step = savingsScale(currency).week;
            const whole = minor => formatMoney(minor, currency, { decimals: 0 });
            return `La semana 1 aparta ${whole(step)}, la 2 ${whole(step * 2)}… y la 52 ${whole(step * 52)}. Al final: ${whole(step * 1378)}.`;
        },
        evaluate: ({ contributions, startDate, today, currency = 'CRC' }) => {
            const step = savingsScale(currency).week;
            const target = step * 1378;
            const end = addDays(startDate, 363);
            const saved = (contributions || [])
                .filter(c => c.date >= startDate && c.date <= end && c.amountMinor > 0)
                .reduce((sum, c) => sum + c.amountMinor, 0);
            const week = Math.min(52, Math.floor(Math.max(0, diffDays(startDate, today)) / 7) + 1);
            const expected = week * (week + 1) / 2 * step;
            return {
                failed: today > end && saved < target,
                done: saved >= target,
                progress: Math.min(1, saved / target),
                detail: `Semana ${week}: lleva ${formatMoney(saved, currency)} de ${formatMoney(expected, currency)} esperados`
            };
        }
    }
]);

/* ── Cálculo global ───────────────────────────────────────────────────────── */

/**
 * @param {object} s  estadísticas ya agregadas por la app:
 *   txs, today, budgetsCount, monthsWithinBudget, totalSaved, emergencyPct,
 *   goalsDone, onTimeMonths, debtsPaidOff, bestSavingsRate, receiptsCount,
 *   simulationsCount, aguinaldoSavedPct, netWorth, challenges (aceptados)
 */
export function computeGamification(s) {
    const currency = s.currency || 'CRC';
    const scale = savingsScale(currency);
    const days = loggingDays(s.txs);
    const impulse = impulseFreeRuns(s.txs, s.today);
    const stats = {
        ...s,
        scale,
        txCount: (s.txs || []).length,
        loggingDays: days.size,
        streak: currentStreak(days, s.today),
        longestStreak: longestStreak(days),
        impulseFreeCurrent: impulse.current,
        bestImpulseFree: impulse.best,
        impulseFreeWeeks: impulse.weeks
    };

    const badges = BADGES.map(badge => {
        const progress = badge.evaluate(stats);
        const text = badge.milestone ? scale[badge.milestone] : badge;
        return { ...badge, name: text.name, description: text.description, progress, unlocked: progress >= 1, evaluate: undefined };
    });

    const challenges = (s.challenges || []).map(accepted => {
        const def = CHALLENGES.find(c => c.id === accepted.id);
        if (!def) return null;
        const result = def.evaluate({ txs: s.txs, contributions: s.contributions, startDate: accepted.startDate, today: s.today, currency });
        return { ...def, ...accepted, ...result, description: describeChallenge(def, currency), evaluate: undefined };
    }).filter(Boolean);

    const breakdown = [
        { id: 'logging', label: 'Días registrando', count: days.size, points: days.size * POINTS.loggingDay },
        { id: 'impulse', label: 'Semanas sin gastos impulsivos', count: impulse.weeks, points: impulse.weeks * POINTS.impulseFreeWeek },
        { id: 'goals', label: 'Metas cumplidas', count: s.goalsDone || 0, points: (s.goalsDone || 0) * POINTS.goalCompleted },
        { id: 'budget', label: 'Meses dentro del presupuesto', count: s.monthsWithinBudget || 0, points: (s.monthsWithinBudget || 0) * POINTS.monthWithinBudget },
        { id: 'badges', label: 'Insignias', count: badges.filter(b => b.unlocked).length, points: badges.filter(b => b.unlocked).reduce((sum, b) => sum + b.points, 0) },
        { id: 'challenges', label: 'Retos superados', count: challenges.filter(c => c.done).length, points: challenges.filter(c => c.done).reduce((sum, c) => sum + c.points, 0) }
    ];
    const points = breakdown.reduce((sum, item) => sum + item.points, 0);

    return { points, level: levelFor(points), badges, challenges, breakdown, stats };
}

/** Texto del reto en la moneda principal (el de 52 semanas se mide en ella). */
export function describeChallenge(challenge, currency = 'CRC') {
    return typeof challenge.description === 'function' ? challenge.description(currency) : challenge.description;
}

/** Insignias recién desbloqueadas respecto a las ya celebradas. */
export function newlyUnlocked(badges, celebrated = {}) {
    return badges.filter(badge => badge.unlocked && !celebrated[badge.id]);
}
