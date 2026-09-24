// GENERADO por scripts/sync-patrimonio-core.mjs desde Gestor-Patrimonios/js/core/money.js.
// No se edita aquí: se edita el original y se vuelve a ejecutar el script.
/**
 * Dinero en Elysium Patrimonio.
 *
 * Todo importe viaja como entero en céntimos (`amountMinor`), igual que las
 * oportunidades del CRM: sumar colones con coma flotante acaba mostrando
 * ₡14.999,99 donde el usuario escribió ₡15.000. Este módulo es puro —sin DOM
 * ni Firebase— porque lo comparten la app, las pruebas y el backend de correo.
 */

export const CURRENCIES = Object.freeze({
    CRC: Object.freeze({ code: 'CRC', symbol: '₡', decimals: 0, name: 'Colones' }),
    USD: Object.freeze({ code: 'USD', symbol: '$', decimals: 2, name: 'Dólares' })
});

export const BASE_CURRENCY = 'CRC';
/** Tipo de cambio de reserva (₡ por $) mientras no haya uno guardado. */
export const DEFAULT_FX_RATE = 505;

export function currencyInfo(code) {
    return CURRENCIES[code] || CURRENCIES.CRC;
}

/** Número en unidades (₡15000.5) → céntimos (1500050). */
export function toMinor(units) {
    const value = Number(units);
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * 100);
}

/** Céntimos → unidades. */
export function fromMinor(minor) {
    return (Number(minor) || 0) / 100;
}

/**
 * Convierte un importe entre CRC y USD. `rate` son colones por dólar.
 * Se redondea al céntimo: la conversión es informativa, nunca contable.
 */
export function convertMinor(minor, from, to, rate = DEFAULT_FX_RATE) {
    const amount = Number(minor) || 0;
    if (!from || !to || from === to) return Math.round(amount);
    const fx = Number(rate) > 0 ? Number(rate) : DEFAULT_FX_RATE;
    if (from === 'USD' && to === 'CRC') return Math.round(amount * fx);
    if (from === 'CRC' && to === 'USD') return Math.round(amount / fx);
    return Math.round(amount);
}

/** Importe de un movimiento o saldo expresado en la moneda base. */
export function inBase(minor, currency, fx) {
    const base = fx?.base || BASE_CURRENCY;
    return convertMinor(minor, currency || base, base, fx?.rate);
}

function groupDigits(integerText) {
    return integerText.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Formato de la app: punto de miles y coma decimal, como escribe Jared
 * («₡15.000.000»). Los colones van sin decimales salvo que se pidan.
 *
 * @param {number} minor
 * @param {string} currency
 * @param {{decimals?: number, sign?: boolean, compact?: boolean, symbol?: boolean}} [options]
 */
export function formatMoney(minor, currency = BASE_CURRENCY, options = {}) {
    const info = currencyInfo(currency);
    const amount = Number(minor) || 0;
    const negative = amount < 0;
    const absolute = Math.abs(amount) / 100;
    const symbol = options.symbol === false ? '' : info.symbol;
    let body;

    if (options.compact && absolute >= 1000) {
        const units = [
            { value: 1e9, suffix: ' mil M' },
            { value: 1e6, suffix: ' M' },
            { value: 1e3, suffix: ' k' }
        ];
        const unit = units.find(candidate => absolute >= candidate.value);
        const scaled = absolute / unit.value;
        const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
        const fixed = scaled.toFixed(digits).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
        const [intPart, decPart] = fixed.split('.');
        body = groupDigits(intPart) + (decPart ? ',' + decPart : '') + unit.suffix;
    } else {
        const decimals = Number.isInteger(options.decimals) ? options.decimals : info.decimals;
        const fixed = absolute.toFixed(decimals);
        const [intPart, decPart] = fixed.split('.');
        body = groupDigits(intPart) + (decPart ? ',' + decPart : '');
    }

    const prefix = negative ? '−' : (options.sign && amount > 0 ? '+' : '');
    return `${prefix}${symbol}${body}`;
}

/**
 * Lee lo que escribe una persona: «15000», «15.000», «15,000», «₡15.000,50»,
 * «$1,250.75», «2.5 M». Devuelve céntimos o `null` si no es un número.
 *
 * Regla para el separador ambiguo: si aparecen los dos, el último es el
 * decimal; si solo aparece uno y va seguido de exactamente tres cifras (una o
 * varias veces), es de miles. «1.5» es 1,5; «1.500» es mil quinientos.
 */
export function parseAmount(input) {
    if (typeof input === 'number') return Number.isFinite(input) ? Math.round(input * 100) : null;
    if (input == null) return null;
    let text = String(input).trim().toLowerCase();
    if (!text) return null;

    let multiplier = 1;
    const suffix = text.match(/\s*(k|mil|m|millones|millón|millon)\s*$/);
    if (suffix) {
        multiplier = suffix[1] === 'k' || suffix[1] === 'mil' ? 1e3 : 1e6;
        text = text.slice(0, suffix.index);
    }

    const negative = /^[-−(]/.test(text) || /\)$/.test(text);
    text = text.replace(/[^\d.,]/g, '');
    if (!/\d/.test(text)) return null;

    const lastDot = text.lastIndexOf('.');
    const lastComma = text.lastIndexOf(',');
    let normalized;

    if (lastDot !== -1 && lastComma !== -1) {
        const decimalSep = lastDot > lastComma ? '.' : ',';
        const thousandsSep = decimalSep === '.' ? ',' : '.';
        normalized = text.split(thousandsSep).join('').replace(decimalSep, '.');
    } else if (lastDot !== -1 || lastComma !== -1) {
        const sep = lastDot !== -1 ? '.' : ',';
        const parts = text.split(sep);
        const looksLikeThousands = parts.length > 2
            || (parts.length === 2 && parts[1].length === 3 && parts[0].length > 0);
        normalized = looksLikeThousands ? parts.join('') : parts.join('.');
    } else {
        normalized = text;
    }

    const value = Number(normalized);
    if (!Number.isFinite(value)) return null;
    const minor = Math.round(value * multiplier * 100);
    return negative ? -minor : minor;
}

/** Redondea hacia arriba a un múltiplo «bonito» (útil para sugerir presupuestos). */
export function roundNice(minor, currency = BASE_CURRENCY) {
    const amount = Math.max(0, Number(minor) || 0);
    const step = currency === 'USD'
        ? (amount >= 100000 ? 5000 : 1000)            // $50 / $10
        : (amount >= 10000000 ? 500000 : 100000);    // ₡5.000 / ₡1.000
    return Math.ceil(amount / step) * step;
}

/** Porcentaje seguro (0 si el divisor es 0). */
export function percent(part, whole) {
    const denominator = Number(whole) || 0;
    if (denominator === 0) return 0;
    return (Number(part) || 0) / denominator * 100;
}

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
