/**
 * El calendario del negocio.
 *
 * Una venta ocurre en un **día civil del negocio** («2026-11-14»), no en un
 * instante: el taller que cierra caja a las 9 de la noche en Costa Rica está
 * todavía en su día 14 aunque el servidor ya vaya por el 15 en UTC. Por eso
 * las fechas de los documentos son cadenas `AAAA-MM-DD` calculadas en la zona
 * horaria del negocio, y los períodos, cadenas `AAAA-MM`. Compararlas es
 * comparar texto, y eso también lo sabe hacer una consulta de Firestore.
 *
 * Todo aquí es aritmética sobre esas cadenas. No hay un solo `new Date()` que
 * dependa de la zona de quien ejecuta, salvo `businessDay`, que la recibe.
 */

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PERIOD_PATTERN = /^\d{4}-\d{2}$/;
const DAY_MS = 86400000;

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

export const DEFAULT_TIMEZONE = 'America/Costa_Rica';

const utc = day => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
const fromUtc = ms => new Date(ms).toISOString().slice(0, 10);

export function isDay(value) {
    return typeof value === 'string' && DAY_PATTERN.test(value) && fromUtc(utc(value)) === value;
}

export function isPeriod(value) {
    return typeof value === 'string' && PERIOD_PATTERN.test(value) && Number(value.slice(5, 7)) >= 1 && Number(value.slice(5, 7)) <= 12;
}

const formatters = new Map();

/** El día civil en que está el negocio en ese instante. */
export function businessDay(instant = new Date(), timeZone = DEFAULT_TIMEZONE) {
    let formatter = formatters.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
        formatters.set(timeZone, formatter);
    }
    const parts = Object.fromEntries(formatter.formatToParts(instant).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
}

export const periodOf = day => day.slice(0, 7);

export const addDays = (day, amount) => fromUtc(utc(day) + amount * DAY_MS);

/** Días de `from` a `to`: positivo si `to` es posterior. */
export const diffDays = (from, to) => Math.round((utc(to) - utc(from)) / DAY_MS);

/** 1 = lunes … 7 = domingo. */
export function weekdayOf(day) {
    const index = new Date(utc(day)).getUTCDay();
    return index === 0 ? 7 : index;
}

export function shiftPeriod(period, amount) {
    const index = Number(period.slice(0, 4)) * 12 + Number(period.slice(5, 7)) - 1 + amount;
    return `${String(Math.floor(index / 12)).padStart(4, '0')}-${String((index % 12) + 1).padStart(2, '0')}`;
}

export const firstDay = period => `${period}-01`;

/**
 * El mismo día, tantos meses después. El 31 de enero más un mes es el último
 * de febrero, no el 3 de marzo: es como se cuenta un período de suscripción.
 */
export function addMonths(day, amount) {
    const period = shiftPeriod(periodOf(day), amount);
    const wanted = Number(day.slice(8, 10));
    const last = diffDays(`${period}-01`, `${shiftPeriod(period, 1)}-01`);
    return `${period}-${String(Math.min(wanted, last)).padStart(2, '0')}`;
}

export function daysInMonth(period) {
    return diffDays(firstDay(period), firstDay(shiftPeriod(period, 1)));
}

export const lastDay = period => `${period}-${String(daysInMonth(period)).padStart(2, '0')}`;

/** Los días de un período, del primero al último (o hasta `until`, inclusive). */
export function daysOf(period, until = null) {
    const days = [];
    const end = until && until < lastDay(period) ? until : lastDay(period);
    for (let day = firstDay(period); day <= end; day = addDays(day, 1)) days.push(day);
    return days;
}

/** Clave del día dentro de los acumulados del mes: «d05». Empieza por letra
    porque un nombre de campo de Firestore que empieza por cifra hay que
    escribirlo entre comillas invertidas, y eso se olvida. */
export const dayKey = day => `d${day.slice(8, 10)}`;

/** «noviembre de 2026». */
export function periodLabel(period) {
    if (!isPeriod(period)) return '—';
    return `${MONTHS[Number(period.slice(5, 7)) - 1]} de ${period.slice(0, 4)}`;
}

/** «14 de noviembre de 2026»; con `short`, «14 nov». */
export function dayLabel(day, { short = false, weekday = false } = {}) {
    if (!isDay(day)) return '—';
    const number = Number(day.slice(8, 10));
    const month = MONTHS[Number(day.slice(5, 7)) - 1];
    if (short) return `${number} ${month.slice(0, 3)}`;
    const text = `${number} de ${month} de ${day.slice(0, 4)}`;
    return weekday ? `${WEEKDAYS[weekdayOf(day) - 1]} ${text}` : text;
}

export const weekdayLabel = number => WEEKDAYS[number - 1] || '—';

/** «hace 3 días», «en 7 días», «hoy». Para vencimientos y mantenimientos. */
export function relativeDays(from, to) {
    const days = diffDays(from, to);
    if (days === 0) return 'hoy';
    if (days === 1) return 'mañana';
    if (days === -1) return 'ayer';
    return days > 0 ? `en ${days} días` : `hace ${-days} días`;
}
