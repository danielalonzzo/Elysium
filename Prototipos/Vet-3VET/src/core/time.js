/**
 * Tiempo en hora de Costa Rica.
 *
 * Costa Rica es UTC−6 fijo: no tiene horario de verano desde 1992. Eso permite
 * hacer toda la aritmética con enteros y `Date.UTC`, sin librerías de zona horaria
 * y sin depender de la zona del navegador ni del runner de CI (que corre en UTC).
 *
 * Dos reglas que este módulo existe para hacer cumplir:
 *  1. NUNCA construir un día con `new Date(y, m, d)`: eso usa la zona del usuario,
 *     que puede estar en Madrid.
 *  2. NUNCA usar `.toISOString()` sobre una fecha construida en local: desplaza el día.
 *
 * El protocolo entre cliente y servidor viaja como `{weekId, slotKey}`, nunca como Date.
 *
 * Este archivo se sincroniza a `functions/core/time.js` con `scripts/sync-core.js`,
 * así que debe ser JavaScript puro: sin imports, sin `import.meta.env`.
 */

export const CR_TIME_ZONE = 'America/Costa_Rica';
/** Costa Rica va 6 horas por detrás de UTC, todo el año. */
export const CR_UTC_OFFSET_HOURS = -6;

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

/**
 * F15 · Idioma con el que se pintan las fechas para humanos.
 *
 * Este módulo se copia tal cual a `functions/core/` —lo comprueba
 * `coreSync.test.js`—, así que no puede importar nada del frontend para saber
 * en qué idioma está la página. En vez de eso expone un interruptor: la
 * aplicación lo mueve una vez al arrancar (`main.jsx`) y el backend no lo toca
 * nunca, de modo que los correos y los informes siguen saliendo en español
 * aunque el visitante navegue el sitio en inglés. Es la separación correcta:
 * el idioma de la interfaz es del visitante, el de un correo transaccional lo
 * decide el negocio.
 *
 * `en-CR` no es un locale «oficial», pero Intl lo resuelve como inglés con las
 * convenciones de Costa Rica: nombres de día en inglés y el símbolo ₡ intacto,
 * que es exactamente lo que hace falta. Con `en-US` el precio salía como
 * «CRC 12,000», que nadie en Costa Rica reconoce.
 */
const DISPLAY_LOCALES = Object.freeze({ es: 'es-CR', en: 'en-CR' });
let displayLocale = DISPLAY_LOCALES.es;

/** Fija el idioma de las fechas y los precios. Solo lo llama el frontend. */
export function setDisplayLocale(language) {
  displayLocale = DISPLAY_LOCALES[language] || DISPLAY_LOCALES.es;
}

/** El locale en curso, para quien tenga que dar formato por su cuenta. */
export function currentDisplayLocale() {
  return displayLocale;
}

/**
 * Nombres de los días, en el idioma en curso.
 *
 * Se derivan de `Intl` en vez de vivir en una tabla escrita a mano: una tabla
 * por idioma es una tabla que se queda corta el día que se añada un tercero, y
 * el navegador ya sabe cómo se llaman los días en cualquier lengua.
 *
 * El índice es el día ISO (1 = lunes), que es como los guarda `parseSlotKey`;
 * por eso la posición 0 va vacía. El 5 de enero de 1970 fue lunes, y de ahí
 * salen los siete días consecutivos.
 */
function weekdayNames(style) {
  const formatter = new Intl.DateTimeFormat(displayLocale, { weekday: style, timeZone: 'UTC' });
  const names = [null];
  for (let day = 0; day < 7; day += 1) {
    const label = formatter.format(new Date(Date.UTC(1970, 0, 5 + day)));
    names.push(label.charAt(0).toUpperCase() + label.slice(1));
  }
  return names;
}

/**
 * Compatibilidad: se sigue exportando como array indexable por día ISO, pero
 * ahora es un Proxy que consulta el idioma en curso en cada lectura. Cambiar la
 * forma habría obligado a tocar los quince sitios que hacen
 * `WEEKDAY_LABELS[weekday]`, y todos ellos seguirían leyendo bien.
 */
function localizedWeekdays(style) {
  return new Proxy({}, {
    get(_target, prop) {
      const names = weekdayNames(style);
      if (prop === 'length') return names.length;
      if (prop === Symbol.iterator) return names[Symbol.iterator].bind(names);
      const index = Number(prop);
      return Number.isInteger(index) ? names[index] : names[prop];
    },
  });
}

export const WEEKDAY_LABELS = localizedWeekdays('long');

export const WEEKDAY_SHORT = localizedWeekdays('short');

/* ------------------------------------------------------------------ *
 * Conversión civil ⇄ instante
 * ------------------------------------------------------------------ */

/** Instante UTC que corresponde a una fecha y hora civil de Costa Rica. */
export function crCivilToInstant(year, month, day, hours = 0, minutes = 0) {
  return new Date(Date.UTC(year, month - 1, day, hours - CR_UTC_OFFSET_HOURS, minutes, 0, 0));
}

/** Partes civiles de Costa Rica para un instante dado. */
export function instantToCrCivil(instant) {
  const shifted = new Date(instant.getTime() + CR_UTC_OFFSET_HOURS * HOUR_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    // 1 = lunes … 7 = domingo
    weekday: ((shifted.getUTCDay() + 6) % 7) + 1,
  };
}

/* ------------------------------------------------------------------ *
 * Semanas ISO-8601
 * ------------------------------------------------------------------ */

/**
 * Semana ISO de una fecha civil. Se usa `getISOWeekYear`, no el año natural:
 * el 1 de enero de 2027 pertenece a la semana `2026-W53`.
 */
export function isoWeekOfCivil(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayNumber = (date.getUTCDay() + 6) % 7;
  // El jueves de la semana determina a qué año ISO pertenece.
  date.setUTCDate(date.getUTCDate() - dayNumber + 3);
  const isoYear = date.getUTCFullYear();

  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3);

  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
  return { isoYear, week };
}

export function formatWeekId(isoYear, week) {
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/** `weekId` de la semana en la que cae un instante, en hora de Costa Rica. */
export function weekIdOf(instant = new Date()) {
  const civil = instantToCrCivil(instant instanceof Date ? instant : new Date(instant));
  const { isoYear, week } = isoWeekOfCivil(civil.year, civil.month, civil.day);
  return formatWeekId(isoYear, week);
}

export function parseWeekId(weekId) {
  const match = /^(\d{4})-W(\d{2})$/.exec(String(weekId || ''));
  if (!match) throw new Error(`INVALID_WEEK_ID:${weekId}`);
  const isoYear = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) throw new Error(`INVALID_WEEK_ID:${weekId}`);
  return { isoYear, week };
}

/** Fecha civil del lunes de una semana ISO. */
export function mondayCivilOfWeek(weekId) {
  const { isoYear, week } = parseWeekId(weekId);
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const dayNumber = (jan4.getUTCDay() + 6) % 7;
  const monday = new Date(Date.UTC(isoYear, 0, 4 - dayNumber + (week - 1) * 7));
  return {
    year: monday.getUTCFullYear(),
    month: monday.getUTCMonth() + 1,
    day: monday.getUTCDate(),
  };
}

/** Instante del lunes 00:00 (hora CR) de la semana. */
export function weekStartInstant(weekId) {
  const { year, month, day } = mondayCivilOfWeek(weekId);
  return crCivilToInstant(year, month, day, 0, 0);
}

/** Instante del domingo 23:59:59.999 (hora CR) de la semana. */
export function weekEndInstant(weekId) {
  return new Date(weekStartInstant(weekId).getTime() + 7 * DAY_MS - 1);
}

/** Desplaza un `weekId` en N semanas (positivo o negativo). */
export function shiftWeekId(weekId, weeks) {
  const start = weekStartInstant(weekId);
  return weekIdOf(new Date(start.getTime() + weeks * 7 * DAY_MS + 12 * HOUR_MS));
}

/** Fecha civil de un día concreto de la semana (1 = lunes). */
export function civilOfWeekday(weekId, weekday) {
  const monday = mondayCivilOfWeek(weekId);
  const date = new Date(Date.UTC(monday.year, monday.month - 1, monday.day + (weekday - 1)));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/* ------------------------------------------------------------------ *
 * Claves de slot: `d{1-7}_{HHmm}`
 * ------------------------------------------------------------------ */

const SLOT_KEY_PATTERN = /^d([1-7])_([0-2]\d)([0-5]\d)$/;

/**
 * Sin `:` ni `.` ni `/`, para poder usarla dentro de una ruta de campo de Firestore
 * (`slots.d3_0930.status`) sin escapes.
 */
export function slotKey(weekday, hours, minutes) {
  return `d${weekday}_${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`;
}

export function parseSlotKey(key) {
  const match = SLOT_KEY_PATTERN.exec(String(key || ''));
  if (!match) throw new Error(`INVALID_SLOT_KEY:${key}`);
  const hours = Number(match[2]);
  if (hours > 23) throw new Error(`INVALID_SLOT_KEY:${key}`);
  return { weekday: Number(match[1]), hours, minutes: Number(match[3]) };
}

export function isValidSlotKey(key) {
  try {
    parseSlotKey(key);
    return true;
  } catch {
    return false;
  }
}

/** Minutos transcurridos desde el lunes 00:00. */
export function slotOffsetMinutes(key) {
  const { weekday, hours, minutes } = parseSlotKey(key);
  return (weekday - 1) * 1440 + hours * 60 + minutes;
}

export function slotKeyFromOffset(offsetMinutes) {
  if (offsetMinutes < 0 || offsetMinutes >= 7 * 1440) return null;
  const weekday = Math.floor(offsetMinutes / 1440) + 1;
  const withinDay = offsetMinutes % 1440;
  return slotKey(weekday, Math.floor(withinDay / 60), withinDay % 60);
}

/**
 * Claves consecutivas que cubren una duración.
 * Devuelve `null` si el servicio se saldría de la semana (no partimos citas
 * entre dos documentos de disponibilidad).
 */
export function slotKeysFor(startSlotKey, durationMinutes, slotMinutes = 30) {
  const count = Math.ceil(durationMinutes / slotMinutes);
  const start = slotOffsetMinutes(startSlotKey);
  const keys = [];
  for (let index = 0; index < count; index += 1) {
    const key = slotKeyFromOffset(start + index * slotMinutes);
    if (!key) return null;
    keys.push(key);
  }
  return keys;
}

/** Instante UTC del inicio de un slot. */
export function instantForSlot(weekId, key) {
  const { weekday, hours, minutes } = parseSlotKey(key);
  const { year, month, day } = civilOfWeekday(weekId, weekday);
  return crCivilToInstant(year, month, day, hours, minutes);
}

/** Genera la rejilla de un día: `['06:00', '06:30', …]`. */
export function timeGrid(dayStart = '06:00', dayEnd = '19:00', slotMinutes = 30) {
  const toMinutes = (value) => {
    const [hours, minutes] = String(value).split(':').map(Number);
    return hours * 60 + minutes;
  };
  const start = toMinutes(dayStart);
  const end = toMinutes(dayEnd);
  const grid = [];
  for (let minute = start; minute < end; minute += slotMinutes) {
    grid.push(`${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`);
  }
  return grid;
}

/** `'09:30'` → `'d3_0930'` para un día de la semana. */
export function slotKeyFromTime(weekday, time) {
  const [hours, minutes] = String(time).split(':').map(Number);
  return slotKey(weekday, hours, minutes);
}

/* ------------------------------------------------------------------ *
 * Formato para humanos (y para los correos)
 * ------------------------------------------------------------------ */

function crFormatter(options) {
  return new Intl.DateTimeFormat(displayLocale, { timeZone: CR_TIME_ZONE, ...options });
}

/** «martes 19 de agosto de 2026» */
export function formatDateCR(instant) {
  return crFormatter({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .format(instant instanceof Date ? instant : new Date(instant));
}

/** «19 ago» */
export function formatShortDateCR(instant) {
  return crFormatter({ day: 'numeric', month: 'short' })
    .format(instant instanceof Date ? instant : new Date(instant));
}

/** «9:30 a. m.» */
export function formatTimeCR(instant) {
  return crFormatter({ hour: 'numeric', minute: '2-digit', hour12: true })
    .format(instant instanceof Date ? instant : new Date(instant));
}

export function formatDateTimeCR(instant) {
  return `${formatDateCR(instant)}, ${formatTimeCR(instant)}`;
}

/** «Semana del 17 al 23 de agosto» */
export function formatWeekRange(weekId) {
  const start = weekStartInstant(weekId);
  const end = new Date(weekStartInstant(weekId).getTime() + 6 * DAY_MS);
  return `${formatShortDateCR(start)} – ${formatShortDateCR(end)}`;
}

/** Etiqueta legible del slot dentro de su semana: «Miércoles 09:30». */
export function formatSlotLabel(key) {
  const { weekday, hours, minutes } = parseSlotKey(key);
  return `${WEEKDAY_LABELS[weekday]} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function minutesBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / MINUTE_MS);
}
