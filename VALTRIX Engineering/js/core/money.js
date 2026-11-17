/**
 * Dinero y cantidades: enteros, siempre.
 *
 * Un importe es un entero en la **unidad menor** (céntimos) y viaja con su
 * moneda en el mismo documento. Una cantidad es un entero en **milésimas**:
 * 12,5 kg de harina son 12 500. Ni lo uno ni lo otro se guarda nunca como
 * decimal: una existencia que se suma y se resta mil veces en coma flotante
 * acaba en 23,999999, y un margen calculado sobre eso es una opinión.
 *
 * El colón no usa céntimos en la práctica, pero se guarda con dos decimales
 * igual que el dólar para que las tres monedas tengan la misma forma.
 *
 * Las multiplicaciones pasan por BigInt: cantidad en milésimas por precio en
 * céntimos se sale de los 53 bits de un `Number` antes de lo que parece.
 */

import { raise } from './errors.js';

export const CURRENCIES = Object.freeze(['CRC', 'USD', 'EUR']);

const SYMBOL = Object.freeze({ CRC: '₡', USD: 'US$', EUR: '€' });
const MINUS = '−';
/** Espacio duro: «₡4 280 000» no se parte en dos líneas dentro de una tabla. */
const NBSP = ' ';

export const currencySymbol = currency => SYMBOL[currency] || currency || '';

export const isMinor = value => Number.isSafeInteger(value);

/**
 * Importe escrito por una persona («1500», «1 500,50», «₡1.500») → entero en
 * la unidad menor, o null si no se entiende. Con punto y coma mezclados manda
 * el último separador: es el decimal si le siguen una o dos cifras.
 */
export function parseMoney(value, { allowNegative = false } = {}) {
    if (value === null || value === undefined) return null;
    let text = String(value).trim().replace(/[\s ₡$€]|US\$|CRC|USD|EUR/gi, '');
    if (!text) return null;
    const negative = text.startsWith('-') || text.startsWith(MINUS);
    if (negative) text = text.slice(1);
    const decimalAt = Math.max(text.lastIndexOf(','), text.lastIndexOf('.'));
    if (decimalAt !== -1 && text.length - decimalAt - 1 <= 2) {
        text = `${text.slice(0, decimalAt).replace(/[.,]/g, '')}.${text.slice(decimalAt + 1)}`;
    } else {
        text = text.replace(/[.,]/g, '');
    }
    if (!/^\d{1,13}(\.\d{0,2})?$/.test(text)) return null;
    const [whole, fraction = ''] = text.split('.');
    const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0') || 0);
    if (!Number.isSafeInteger(minor)) return null;
    if (negative && !allowNegative) return null;
    return negative ? -minor : minor;
}

function group(value, digits) {
    const [whole, fraction] = value.toFixed(digits).split('.');
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
    return fraction ? `${grouped},${fraction}` : grouped;
}

/**
 * «₡4 280 000», «US$120,00». El colón se enseña sin céntimos salvo que los
 * tenga: esconder ₡0,50 de un saldo sería enseñar un número que no cuadra.
 */
export function formatMoney(minor, currency = 'CRC') {
    if (!isMinor(minor)) return '—';
    const absolute = Math.abs(minor);
    const digits = currency === 'CRC' && absolute % 100 === 0 ? 0 : 2;
    return `${minor < 0 ? MINUS : ''}${currencySymbol(currency)}${group(absolute / 100, digits)}`;
}

/** Importe para escribir en un campo de formulario: «1500» o «1500,50». */
export function moneyInput(minor) {
    if (!isMinor(minor)) return '';
    const sign = minor < 0 ? '-' : '';
    const absolute = Math.abs(minor);
    const cents = absolute % 100;
    return `${sign}${Math.floor(absolute / 100)}${cents ? `,${String(cents).padStart(2, '0')}` : ''}`;
}

/** Cantidad escrita por una persona («12,5», «1 200», «0.250») → milésimas, o null. */
export function parseQuantity(value) {
    if (value === null || value === undefined) return null;
    let text = String(value).trim().replace(/[\s ]/g, '');
    if (!text) return null;
    const decimalAt = Math.max(text.lastIndexOf(','), text.lastIndexOf('.'));
    // Una cantidad admite tres decimales, así que «1.500» es ambiguo: mil
    // quinientos o uno y medio. Con UN solo separador se lee como decimal,
    // que es como se escribe un peso; con varios, el último es el decimal.
    if (decimalAt !== -1) {
        text = `${text.slice(0, decimalAt).replace(/[.,]/g, '')}.${text.slice(decimalAt + 1)}`;
    }
    if (!/^\d{1,9}(\.\d{0,3})?$/.test(text)) return null;
    const [whole, fraction = ''] = text.split('.');
    return Number(whole) * 1000 + Number(fraction.padEnd(3, '0') || 0);
}

/** «24», «12,5», «0,25». Sin ceros de relleno: 24 unidades no son «24,000». */
export function formatQuantity(milli) {
    if (!Number.isSafeInteger(milli)) return '—';
    const absolute = Math.abs(milli);
    const whole = String(Math.floor(absolute / 1000)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
    const fraction = String(absolute % 1000).padStart(3, '0').replace(/0+$/, '');
    return `${milli < 0 ? MINUS : ''}${whole}${fraction ? `,${fraction}` : ''}`;
}

export const quantityInput = milli => (Number.isSafeInteger(milli) ? formatQuantity(milli).replace(/ /g, '').replace(MINUS, '-') : '');

const LIMIT = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * División entera redondeando al más cercano (la mitad se aleja de cero).
 *
 * Si el resultado no cabe exacto en un `Number` se rechaza la entrada: un
 * importe que se guardara «aproximado» sería peor que no guardarlo.
 */
function divideRounded(numerator, denominator) {
    const negative = (numerator < 0n) !== (denominator < 0n);
    const n = numerator < 0n ? -numerator : numerator;
    const d = denominator < 0n ? -denominator : denominator;
    const quotient = (n + d / 2n) / d;
    if (quotient > LIMIT) raise('INVALID_INPUT', { field: 'amount' });
    return Number(negative ? -quotient : quotient);
}

/** Cantidad (milésimas) × precio unitario (unidad menor) → importe en la unidad menor. */
export function multiply(quantityMilli, unitMinor) {
    return divideRounded(BigInt(quantityMilli) * BigInt(unitMinor), 1000n);
}

/**
 * Costo promedio ponderado al recibir mercadería: lo que había, a su costo,
 * más lo que entra, al suyo, repartido entre todo lo que queda.
 */
export function weightedCost(onHandMilli, costMinor, addedMilli, addedUnitCostMinor) {
    const before = BigInt(Math.max(0, onHandMilli));
    const added = BigInt(addedMilli);
    const total = before + added;
    if (total <= 0n) return addedUnitCostMinor;
    return divideRounded(before * BigInt(costMinor) + added * BigInt(addedUnitCostMinor), total);
}

/** Parte de un total en puntos básicos (1 % = 100), o null si el total es cero. */
export function ratioBp(part, whole) {
    if (!whole) return null;
    return divideRounded(BigInt(part) * 10000n, BigInt(whole));
}

/** Margen bruto sobre la venta, en puntos básicos. Sin ventas no hay margen que decir. */
export const marginBp = (salesMinor, costMinor) => ratioBp(salesMinor - costMinor, salesMinor);

/** «32 %», «−4 %», «12,5 %». */
export function formatPercent(bp, { signed = false } = {}) {
    if (!Number.isFinite(bp)) return '—';
    const absolute = Math.abs(bp) / 100;
    const text = Number.isInteger(absolute) || absolute >= 100 ? String(Math.round(absolute)) : absolute.toFixed(1).replace('.', ',');
    const sign = bp < 0 ? MINUS : (signed && bp > 0 ? '+' : '');
    return `${sign}${text}${NBSP}%`;
}

export const sum = (rows, pick) => rows.reduce((total, row) => total + (pick(row) || 0), 0);
