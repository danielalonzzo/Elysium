/**
 * Respuestas, errores y validación de entrada del API.
 *
 * Cada error lleva un **código estable** (`STOCK_CHANGED`) y su mensaje en
 * español de Costa Rica, de usted. El portal enseña el texto tal cual; las
 * pruebas comparan el código, nunca la frase. Así se puede reescribir un
 * mensaje sin romper una prueba, y traducirlo el día que haga falta sin tocar
 * ninguna ruta.
 *
 * Las frases viven en el núcleo (`VALTRIX Engineering/js/core/errors.js`), no
 * aquí: la demo corre el mismo motor en el navegador, sin servidor que le
 * redacte nada, y tiene que decir lo mismo con las mismas palabras.
 */

import { MESSAGES } from '../core.js';

export class ApiError extends Error {
    constructor(status, code, extra = {}) {
        super(code);
        this.status = status;
        this.code = code;
        this.extra = extra;
    }
}

export const fail = (status, code, extra) => { throw new ApiError(status, code, extra); };

export function message(code) {
    return MESSAGES[code] || MESSAGES.INVALID_INPUT;
}

const SECURITY_HEADERS = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer'
};

export function json(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), { status, headers: { ...SECURITY_HEADERS, ...headers } });
}

export function errorResponse(error) {
    // Los datos adicionales van primero: ninguno puede pisar el código ni la
    // frase. (Pasó: un error que traía `code: 'fil 001'` respondía con ese
    // código en vez de PRODUCT_CODE_TAKEN.)
    return json({ ...error.extra, error: message(error.code), code: error.code }, error.status);
}

/** Respuesta binaria privada (informes, exportaciones, evidencias). */
export function fileResponse(body, { type, filename }) {
    const safe = String(filename || 'valtrix').replace(/["\r\n\\/]/g, '');
    return new Response(body, {
        headers: {
            'content-type': type,
            'content-disposition': `attachment; filename="${safe}"`,
            'cache-control': 'no-store',
            'x-content-type-options': 'nosniff'
        }
    });
}

/* ------------------------------------------------------------------ *
 * Validación
 * ------------------------------------------------------------------ */

export const text = (value, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export const longText = (value, max = 5000) => (typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim().slice(0, max) : '');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const email = value => {
    const normalized = text(value, 254).toLowerCase();
    return EMAIL_PATTERN.test(normalized) ? normalized : '';
};

export const phone = value => text(value, 40).replace(/[^\d+\s()-]/g, '');

export function oneOf(value, list, fallback = null) {
    return list.includes(value) ? value : fallback;
}

export function integer(value, { min = -Infinity, max = Infinity } = {}) {
    const number = Number(value);
    return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

/** Identificador legible generado por nosotros: minúsculas, dígitos y guiones. */
export function slug(value, max = 60) {
    const clean = text(value, max).toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return clean.length >= 2 ? clean.slice(0, max) : '';
}

export const CURRENCIES = Object.freeze(['CRC', 'USD', 'EUR']);

/**
 * Importe escrito por una persona («1500», «1 500,50», «₡1.500») → entero en
 * la unidad menor. Nunca se guarda un decimal: el dinero es entero y su moneda
 * viaja en el mismo documento.
 *
 * El colón no tiene céntimos en la práctica, pero se guarda con dos decimales
 * igual que el dólar, para que convertir entre monedas no pierda precisión en
 * la unidad guardada.
 */
export function minorAmount(value, { allowNegative = false } = {}) {
    if (typeof value === 'number' && Number.isInteger(value)) return allowNegative || value >= 0 ? value : null;
    let normalized = String(value ?? '').trim().replace(/[\s₡$€]/g, '');
    const negative = normalized.startsWith('-');
    if (negative) normalized = normalized.slice(1);
    // Separador de miles con punto y decimal con coma, o al revés: manda el último separador.
    const lastComma = normalized.lastIndexOf(',');
    const lastDot = normalized.lastIndexOf('.');
    const decimalAt = Math.max(lastComma, lastDot);
    if (decimalAt !== -1 && normalized.length - decimalAt - 1 <= 2) {
        normalized = normalized.slice(0, decimalAt).replace(/[.,]/g, '') + '.' + normalized.slice(decimalAt + 1);
    } else {
        normalized = normalized.replace(/[.,]/g, '');
    }
    if (!/^\d{1,13}(\.\d{1,2})?$/.test(normalized)) return null;
    const minor = Math.round(Number(normalized) * 100);
    if (!Number.isSafeInteger(minor)) return null;
    if (negative && !allowNegative) return null;
    return negative ? -minor : minor;
}

export function currency(value) {
    return oneOf(String(value || '').toUpperCase(), CURRENCIES);
}

/** Fecha de calendario del negocio, sin hora: «2026-11-11». */
export function isoDate(value) {
    const candidate = text(value, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return null;
    const parsed = new Date(`${candidate}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === candidate ? candidate : null;
}

export function isoInstant(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null;
    const time = Date.parse(value);
    return Number.isFinite(time) ? new Date(time) : null;
}

export async function readJson(request, maxBytes = 40000) {
    if (!(request.headers.get('content-type') || '').startsWith('application/json')) fail(415, 'BAD_FORMAT');
    if (Number(request.headers.get('content-length') || 0) > maxBytes) fail(413, 'TOO_LARGE');
    const raw = await request.text();
    if (raw.length > maxBytes) fail(413, 'TOO_LARGE');
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return fail(400, 'BAD_JSON');
    }
}

/** Celda CSV segura: comillas y neutralización de fórmulas (=, +, -, @). */
export function csvCell(value) {
    let cell = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
    return /[",;\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

export function toCsv(header, rows) {
    return '﻿' + [header, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n') + '\r\n';
}

export const stamp = () => new Date().toISOString();
