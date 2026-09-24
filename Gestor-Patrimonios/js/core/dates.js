/**
 * Fechas de calendario como texto `YYYY-MM-DD`.
 *
 * Un gasto ocurre «el martes», no a una hora UTC: si se guardara como
 * instante, un café a las 11 p. m. en San José caería al día siguiente en
 * cualquier servidor europeo. Por eso las fechas viajan como texto y la
 * aritmética se hace sobre días civiles en UTC puro, donde no hay horario de
 * verano que desplace nada.
 */

export const APP_TIME_ZONE = 'America/Costa_Rica';
const DAY_MS = 86400000;
export const AVG_DAYS_PER_MONTH = 30.4375;

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WEEKDAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const WEEKDAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export { MONTHS_SHORT, MONTHS_LONG, WEEKDAYS_LONG, WEEKDAYS_SHORT };

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(value) {
    if (typeof value !== 'string') return false;
    const match = value.match(ISO_RE);
    if (!match) return false;
    const [, y, m, d] = match.map(Number);
    return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

/** Hoy en Costa Rica (o en la zona indicada), como `YYYY-MM-DD`. */
export function todayISO(now = new Date(), timeZone = APP_TIME_ZONE) {
    // en-CA formatea como YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', {
        timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(now);
}

export function parseISO(iso) {
    const match = String(iso || '').match(ISO_RE);
    if (!match) return null;
    return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function pad(n) {
    return String(n).padStart(2, '0');
}

export function toISO(y, m, d) {
    return `${y}-${pad(m)}-${pad(d)}`;
}

function toEpochDay(iso) {
    const p = parseISO(iso);
    if (!p) return NaN;
    return Date.UTC(p.y, p.m - 1, p.d) / DAY_MS;
}

function fromEpochDay(day) {
    const date = new Date(day * DAY_MS);
    return toISO(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function daysInMonth(y, m) {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addDays(iso, days) {
    return fromEpochDay(toEpochDay(iso) + Math.round(days));
}

/** Suma meses conservando el día cuando existe (31 ene + 1 mes = 28/29 feb). */
export function addMonths(iso, months) {
    const p = parseISO(iso);
    if (!p) return iso;
    const total = p.y * 12 + (p.m - 1) + Math.trunc(months);
    const y = Math.floor(total / 12);
    const m = total - y * 12 + 1;
    return toISO(y, m, Math.min(p.d, daysInMonth(y, m)));
}

/** Días de `a` a `b` (positivo si `b` es posterior). */
export function diffDays(a, b) {
    return Math.round(toEpochDay(b) - toEpochDay(a));
}

export function compareISO(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

export function minISO(a, b) {
    return a <= b ? a : b;
}

export function maxISO(a, b) {
    return a >= b ? a : b;
}

/** 0 = domingo … 6 = sábado. */
export function weekday(iso) {
    const day = toEpochDay(iso);
    return ((day % 7) + 7 + 4) % 7; // 1970-01-01 fue jueves
}

export function monthKey(iso) {
    return String(iso).slice(0, 7);
}

export function startOfMonth(iso) {
    return `${monthKey(iso)}-01`;
}

export function endOfMonth(iso) {
    const p = parseISO(iso);
    return toISO(p.y, p.m, daysInMonth(p.y, p.m));
}

/** Clave ISO de semana (`2026-W39`), con semanas de lunes a domingo. */
export function isoWeekKey(iso) {
    const p = parseISO(iso);
    const date = new Date(Date.UTC(p.y, p.m - 1, p.d));
    const dayNum = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    const week = 1 + Math.round(((date - firstThursday) / DAY_MS - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
    return `${date.getUTCFullYear()}-W${pad(week)}`;
}

/** Lunes de la semana que contiene `iso`. */
export function startOfWeek(iso) {
    return addDays(iso, -((weekday(iso) + 6) % 7));
}

/**
 * Período financiero que contiene `iso`. Con `startDay` 1 es el mes natural;
 * con otro día (el de pago) va de ese día al anterior del mes siguiente. Los
 * días 29–31 se recortan al final de los meses cortos.
 */
export function periodFor(iso, startDay = 1) {
    const day = Math.min(Math.max(Math.trunc(startDay) || 1, 1), 31);
    const p = parseISO(iso);
    const startThisMonth = toISO(p.y, p.m, Math.min(day, daysInMonth(p.y, p.m)));
    let start;
    if (iso >= startThisMonth) {
        start = startThisMonth;
    } else {
        const prev = addMonths(toISO(p.y, p.m, 1), -1);
        const pp = parseISO(prev);
        start = toISO(pp.y, pp.m, Math.min(day, daysInMonth(pp.y, pp.m)));
    }
    const sp = parseISO(start);
    const nextMonth = addMonths(toISO(sp.y, sp.m, 1), 1);
    const np = parseISO(nextMonth);
    const nextStart = toISO(np.y, np.m, Math.min(day, daysInMonth(np.y, np.m)));
    const end = addDays(nextStart, -1);
    return { start, end, key: monthKey(start), days: diffDays(start, end) + 1 };
}

/** Período desplazado `offset` veces (−1 = el anterior). */
export function shiftPeriod(period, offset, startDay = 1) {
    let current = period;
    const step = offset < 0 ? -1 : 1;
    for (let i = 0; i < Math.abs(offset); i += 1) {
        current = periodFor(step < 0 ? addDays(current.start, -1) : addDays(current.end, 1), startDay);
    }
    return current;
}

/** Los últimos `n` períodos completos o no, terminando en el que contiene `iso`. */
export function lastPeriods(iso, n, startDay = 1) {
    const periods = [];
    let current = periodFor(iso, startDay);
    for (let i = 0; i < n; i += 1) {
        periods.unshift(current);
        current = shiftPeriod(current, -1, startDay);
    }
    return periods;
}

/** Meses (fraccionarios) entre dos fechas. */
export function monthsBetween(a, b) {
    return diffDays(a, b) / AVG_DAYS_PER_MONTH;
}

export function isBetween(iso, start, end) {
    return iso >= start && iso <= end;
}

/* ── Presentación ─────────────────────────────────────────────────────────── */

export function monthLabel(key, { long = false, year = true } = {}) {
    const [y, m] = String(key).split('-').map(Number);
    const name = (long ? MONTHS_LONG : MONTHS_SHORT)[m - 1] || '';
    return year ? `${name} ${y}` : name;
}

/**
 * `short`: 23 sep · `medium`: 23 sep 2026 · `long`: martes, 23 de septiembre
 * · `relative`: Hoy / Ayer / Mañana / martes 23 sep.
 */
export function formatDate(iso, style = 'medium', today = null) {
    const p = parseISO(iso);
    if (!p) return '';
    if (style === 'relative' && today) {
        const delta = diffDays(today, iso);
        if (delta === 0) return 'Hoy';
        if (delta === -1) return 'Ayer';
        if (delta === 1) return 'Mañana';
        const sameYear = p.y === parseISO(today).y;
        return `${WEEKDAYS_LONG[weekday(iso)]} ${p.d} ${MONTHS_SHORT[p.m - 1]}${sameYear ? '' : ' ' + p.y}`;
    }
    if (style === 'short') return `${p.d} ${MONTHS_SHORT[p.m - 1]}`;
    if (style === 'long') return `${WEEKDAYS_LONG[weekday(iso)]}, ${p.d} de ${MONTHS_LONG[p.m - 1]}`;
    if (style === 'full') return `${p.d} de ${MONTHS_LONG[p.m - 1]} de ${p.y}`;
    return `${p.d} ${MONTHS_SHORT[p.m - 1]} ${p.y}`;
}

/** «en 3 días», «hace 2 meses», «hoy». */
export function relativeDays(fromISO, toISOValue) {
    const delta = diffDays(fromISO, toISOValue);
    if (delta === 0) return 'hoy';
    const future = delta > 0;
    const abs = Math.abs(delta);
    let text;
    if (abs < 31) text = `${abs} ${abs === 1 ? 'día' : 'días'}`;
    else if (abs < 365) {
        const months = Math.round(abs / AVG_DAYS_PER_MONTH);
        text = `${months} ${months === 1 ? 'mes' : 'meses'}`;
    } else {
        const years = Math.floor(abs / 365.25);
        const months = Math.round((abs - years * 365.25) / AVG_DAYS_PER_MONTH);
        text = `${years} ${years === 1 ? 'año' : 'años'}` + (months ? ` y ${months} ${months === 1 ? 'mes' : 'meses'}` : '');
    }
    return future ? `en ${text}` : `hace ${text}`;
}

/** Duración en meses legible: 1,5 → «1 mes y 2 semanas»; 26 → «2 años y 2 meses». */
export function formatMonths(months) {
    if (!Number.isFinite(months)) return 'sin fecha';
    if (months <= 0) return 'ya';
    if (months < 1) {
        const days = Math.max(1, Math.round(months * AVG_DAYS_PER_MONTH));
        return `${days} ${days === 1 ? 'día' : 'días'}`;
    }
    const whole = Math.ceil(months - 0.05);
    if (whole < 12) return `${whole} ${whole === 1 ? 'mes' : 'meses'}`;
    const years = Math.floor(whole / 12);
    const rest = whole % 12;
    return `${years} ${years === 1 ? 'año' : 'años'}` + (rest ? ` y ${rest} ${rest === 1 ? 'mes' : 'meses'}` : '');
}

/**
 * Convierte fechas escritas a mano o exportadas de Excel a ISO:
 * `2026-09-23`, `23/09/2026`, `23-09-26`, `23.9.2026` o un número de serie de
 * Excel (días desde 1899-12-30).
 */
export function parseDateLoose(input) {
    if (input == null || input === '') return null;
    if (typeof input === 'number' || /^\d{5}(\.\d+)?$/.test(String(input).trim())) {
        const serial = Math.floor(Number(input));
        if (serial > 20000 && serial < 80000) return addDays('1899-12-30', serial);
        return null;
    }
    const text = String(input).trim();
    const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) {
        const candidate = toISO(Number(iso[1]), Number(iso[2]), Number(iso[3]));
        return isISODate(candidate) ? candidate : null;
    }
    const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
    if (dmy) {
        let y = Number(dmy[3]);
        if (y < 100) y += y >= 70 ? 1900 : 2000;
        const candidate = toISO(y, Number(dmy[2]), Number(dmy[1]));
        return isISODate(candidate) ? candidate : null;
    }
    return null;
}
