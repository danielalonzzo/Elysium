/**
 * Validación de lo que entra al motor.
 *
 * El motor recibe JSON ya decodificado y no se fía de nada: ni del tipo, ni
 * del tamaño, ni de que un importe sea entero. Lo que escribe una persona
 * («1 500,50») se convierte a enteros ANTES de llegar aquí —en el portal o al
 * normalizar la incorporación—; al motor los importes le llegan en la unidad
 * menor (`…Minor`) y las cantidades en milésimas (`…Milli`).
 *
 * Cada función devuelve el valor limpio o lanza INVALID_INPUT con el nombre
 * del campo, para que la pantalla sepa cuál marcar.
 */

import { invalid } from './errors.js';
import { isDay, isPeriod } from './time.js';

const MAX_MINOR = 99_999_999_999_99;      // ₡99 999 999 999,99: ningún negocio pequeño llega ahí
const MAX_MILLI = 999_999_999;            // 999 999,999 unidades

/** Texto de una línea, recortado. Vacío si no es texto. */
export const text = (value, max = 200) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** Texto de varias líneas (notas, descripciones). */
export const longText = (value, max = 2000) => (typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim().slice(0, max) : '');

export function requiredText(value, field, max = 200) {
    const clean = text(value, max);
    if (!clean) invalid(field);
    return clean;
}

export const oneOf = (value, list, fallback = null) => (list.includes(value) ? value : fallback);

export function requiredOneOf(value, list, field) {
    if (!list.includes(value)) invalid(field);
    return value;
}

/** Importe en la unidad menor: entero, sin signo salvo que se pida. */
export function minor(value, field, { min = 0, max = MAX_MINOR, optional = false } = {}) {
    if ((value === null || value === undefined || value === '') && optional) return null;
    if (!Number.isSafeInteger(value) || value < min || value > max) invalid(field);
    return value;
}

/** Cantidad en milésimas. */
export function milli(value, field, { min = 0, max = MAX_MILLI, optional = false } = {}) {
    if ((value === null || value === undefined || value === '') && optional) return null;
    if (!Number.isSafeInteger(value) || value < min || value > max) invalid(field);
    return value;
}

export function integer(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER, optional = false } = {}) {
    if ((value === null || value === undefined || value === '') && optional) return null;
    if (!Number.isInteger(value) || value < min || value > max) invalid(field);
    return value;
}

export function day(value, field, { optional = false } = {}) {
    if ((value === null || value === undefined || value === '') && optional) return null;
    if (!isDay(value)) invalid(field);
    return value;
}

export function period(value, field) {
    if (!isPeriod(value)) invalid(field);
    return value;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Correo en minúsculas, o cadena vacía si no tiene forma de correo. */
export function email(value) {
    const clean = text(value, 254).toLowerCase();
    return EMAIL_PATTERN.test(clean) ? clean : '';
}

export const phone = value => text(value, 40).replace(/[^\d+\s()-]/g, '');

/** Identificador que llega en una ruta o en un cuerpo: corto y sin barras. */
export function id(value, field = 'id') {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_.:-]{1,140}$/.test(value)) invalid(field);
    return value;
}

/** Lista de identificadores, sin repetir. */
export function idList(value, field, { max = 50 } = {}) {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value) || value.length > max) invalid(field);
    return [...new Set(value.map(item => id(item, field)))];
}

/**
 * Clave de un código de producto: lo que hace únicos a «fil-001», «FIL 001» y
 * «Fil-001». Se guarda aparte del código tal como lo escribió la persona.
 */
export function codeKey(value) {
    return text(value, 40).toUpperCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Identificador aleatorio. `randomUUID` pide contexto seguro; `getRandomValues`, no. */
export function newId() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
