/**
 * Respuestas, errores y validación de entrada del API.
 *
 * Cada error lleva un **código estable** (`STOCK_CHANGED`) y su mensaje en
 * español de Costa Rica, de usted. El portal enseña el texto tal cual; las
 * pruebas comparan el código, nunca la frase. Así se puede reescribir un
 * mensaje sin romper una prueba, y traducirlo el día que haga falta sin tocar
 * ninguna ruta.
 */

const MESSAGES = {
    BAD_ORIGIN: 'Origen inválido.',
    BAD_FORMAT: 'El formato de la solicitud no es válido.',
    TOO_LARGE: 'La solicitud es demasiado grande.',
    BAD_JSON: 'El contenido enviado no es JSON válido.',
    NOT_FOUND: 'No encontramos lo que busca.',
    ROUTE_NOT_FOUND: 'Esa ruta no existe.',
    METHOD_NOT_ALLOWED: 'Ese método no se admite en esta ruta.',
    UNAUTHENTICATED: 'Inicie sesión para continuar.',
    EMAIL_NOT_VERIFIED: 'Confirme su correo electrónico antes de entrar.',
    ACCOUNT_DISABLED: 'Esta cuenta está desactivada. Comuníquese con VALTRIX.',
    NO_ROLE: 'Su cuenta todavía no tiene acceso asignado. Comuníquese con VALTRIX.',
    FORBIDDEN: 'No tiene permiso para esta operación.',
    RATE_LIMITED: 'Demasiados intentos. Espere un minuto y vuelva a probar.',
    UNAVAILABLE: 'Servicio temporalmente no disponible.',
    INVALID_INPUT: 'Revise los datos indicados.',
    CONFLICT: 'Los datos cambiaron mientras tanto. Actualice y vuelva a intentarlo.',
    NOT_CONFIGURED: 'El servicio todavía no está configurado.',

    // Negocio y membresía
    TENANT_REQUIRED: 'Indique con cuál negocio está trabajando.',
    TENANT_NOT_FOUND: 'Ese negocio no existe.',
    NOT_A_MEMBER: 'No pertenece a ese negocio.',
    MEMBERSHIP_SUSPENDED: 'Su acceso a este negocio está suspendido.',
    LAST_OWNER: 'Un negocio no puede quedarse sin propietario.',

    // Suscripción y módulos
    SUBSCRIPTION_INACTIVE: 'La suscripción de este negocio no está activa.',
    SUBSCRIPTION_SUSPENDED: 'La suscripción está suspendida: puede consultar sus datos, pero no registrar movimientos.',
    MODULE_LOCKED: 'Este módulo se habilita más adelante en la suscripción.',
    INVALID_TRANSITION: 'Ese cambio de estado no es posible desde el estado actual.',

    // ERP
    PRODUCT_CODE_TAKEN: 'Ya existe un producto con ese código en este negocio.',
    STOCK_CHANGED: 'Las existencias cambiaron mientras registraba. Revise y confirme de nuevo.',
    STOCK_INSUFFICIENT: 'No hay existencias suficientes para esa salida.',
    DOCUMENT_CLOSED: 'Este documento ya no se puede modificar.',
    PAYMENT_OVER_ALLOCATED: 'No puede asignar más de lo que suma el pago.',
    CURRENCY_MISMATCH: 'La moneda del cobro no coincide con la de la obligación.',
    PERIOD_CLOSED: 'Ese período ya está cerrado.'
};

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
    return json({ error: message(error.code), code: error.code, ...error.extra }, error.status);
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
