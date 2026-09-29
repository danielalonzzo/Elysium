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
    CRC: Object.freeze({ code: 'CRC', symbol: '₡', decimals: 0, name: 'Colones', singular: 'colón', label: '₡ Colones' }),
    USD: Object.freeze({ code: 'USD', symbol: '$', decimals: 2, name: 'Dólares', singular: 'dólar', label: '$ Dólares' }),
    EUR: Object.freeze({ code: 'EUR', symbol: '€', decimals: 2, name: 'Euros', singular: 'euro', label: '€ Euros' })
});
export const CURRENCY_CODES = Object.freeze(Object.keys(CURRENCIES));

export const BASE_CURRENCY = 'CRC';
/** Tipo de cambio de reserva (₡ por $) del formato antiguo, de una sola cifra. */
export const DEFAULT_FX_RATE = 505;
/**
 * Colones por unidad de cada moneda. El colón es el pivote de todas las
 * conversiones: con él basta una cifra por moneda, sea cual sea la principal.
 */
export const DEFAULT_FX_RATES = Object.freeze({ CRC: 1, USD: DEFAULT_FX_RATE, EUR: 590 });

export function isCurrency(code) {
    return Object.prototype.hasOwnProperty.call(CURRENCIES, code);
}

export function currencyInfo(code) {
    return CURRENCIES[code] || CURRENCIES.CRC;
}

export function currencySymbol(code) {
    return currencyInfo(code).symbol;
}

/**
 * Tabla de tipos completa ({ CRC: 1, USD, EUR }). Acepta el formato antiguo
 * —un número o un `fx` con `rate`: colones por dólar—, una tabla parcial o un
 * objeto `fx` con su `rates`, y rellena lo que falte con los valores de reserva.
 */
export function normalizeRates(source) {
    let table = source;
    if (typeof source === 'number') table = { USD: source };
    else if (source && typeof source === 'object' && source.rates) table = source.rates;
    else if (source && typeof source === 'object' && Number(source.rate) > 0) table = { USD: Number(source.rate) };
    const rates = { CRC: 1 };
    for (const code of CURRENCY_CODES) {
        if (code === 'CRC') continue;
        const value = Number(table?.[code]);
        rates[code] = value > 0 ? value : DEFAULT_FX_RATES[code];
    }
    return rates;
}

/**
 * Moneda principal y tipos de un perfil. `fxRates` es el formato vigente;
 * `fxRate` (₡ por $) el de antes de los euros, que se sigue leyendo.
 */
export function fxFromSettings(settings = {}) {
    const base = isCurrency(settings.baseCurrency) ? settings.baseCurrency : BASE_CURRENCY;
    const legacy = Number(settings.fxRate) > 0 ? { USD: Number(settings.fxRate) } : {};
    const rates = normalizeRates({ ...legacy, ...(settings.fxRates || {}) });
    return { base, rates };
}

/** Número en unidades (₡15000.5) → céntimos (1500050). */
export function toMinor(units) {
    const value = Number(units);
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * 100);
}

/**
 * Convierte un importe entre dos monedas pasando por el colón. `rates` es la
 * tabla, un objeto `fx` o, por compatibilidad, los colones por dólar.
 * Se redondea al céntimo: la conversión es informativa, nunca contable. Una
 * moneda desconocida (una factura en libras) se deja como está.
 */
export function convertMinor(minor, from, to, rates) {
    const amount = Number(minor) || 0;
    if (!from || !to || from === to || !isCurrency(from) || !isCurrency(to)) return Math.round(amount);
    const table = normalizeRates(rates);
    return Math.round(amount * table[from] / table[to]);
}

/** Importe de un movimiento o saldo expresado en la moneda base. */
export function inBase(minor, currency, fx) {
    const base = fx?.base || BASE_CURRENCY;
    return convertMinor(minor, currency || base, base, fx);
}

/**
 * Cotización para mostrar entre una moneda y la principal, con la fuerte a la
 * izquierda: «$1 = ₡505», «€1 = $1,17». `value` son unidades de la débil por
 * una de la fuerte.
 */
export function quote(code, fx) {
    const rates = normalizeRates(fx);
    const base = fx?.base || BASE_CURRENCY;
    const strong = rates[code] >= rates[base] ? code : base;
    const weak = strong === code ? base : code;
    return { code, strong, weak, value: rates[strong] / rates[weak] };
}

export function formatQuote({ strong, weak, value }) {
    const decimals = value >= 100 ? 2 : 4;
    const text = value.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '');
    const [intPart, decPart] = text.split('.');
    return `${currencySymbol(strong)}1 = ${currencySymbol(weak)}${groupDigits(intPart)}${decPart ? ',' + decPart : ''}`;
}

/**
 * Tabla de tipos a partir de las cotizaciones escritas a mano, cada una en la
 * orientación que mostró `quote()` con la tabla actual. Si la principal no es
 * el colón, primero se fija su cotización frente a él y el resto se calcula
 * sobre esa.
 */
export function ratesFromQuotes(base, values, current) {
    const rates = normalizeRates(current);
    const fx = { base, rates: { ...rates } };
    const oriented = code => quote(code, fx);
    const baseRate = () => rates[base];
    const apply = code => {
        const value = Number(values[code]);
        if (!(value > 0)) return;
        const { strong } = oriented(code);
        if (code === 'CRC') {
            rates[base] = strong === base ? value : 1 / value;
        } else {
            rates[code] = strong === code ? value * baseRate() : baseRate() / value;
        }
    };
    if (base !== 'CRC') apply('CRC');
    for (const code of CURRENCY_CODES) if (code !== base && code !== 'CRC') apply(code);
    const rounded = normalizeRates(rates);
    for (const code of CURRENCY_CODES) rounded[code] = Math.round(rounded[code] * 10000) / 10000;
    return rounded;
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
        const scale = index => {
            const scaled = absolute / units[index].value;
            const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
            return scaled.toFixed(digits).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
        };
        let index = units.findIndex(candidate => absolute >= candidate.value);
        let fixed = scale(index);
        // 999,9 k se redondea a «1000 k»: es «1 M».
        if (Number(fixed) >= 1000 && index > 0) {
            index -= 1;
            fixed = scale(index);
        }
        const [intPart, decPart] = fixed.split('.');
        body = groupDigits(intPart) + (decPart ? ',' + decPart : '') + units[index].suffix;
    } else {
        const decimals = Number.isInteger(options.decimals) ? options.decimals : info.decimals;
        const fixed = absolute.toFixed(decimals);
        const [intPart, decPart] = fixed.split('.');
        body = groupDigits(intPart) + (decPart ? ',' + decPart : '');
    }

    // Un importe que se redondea a cero no lleva signo: «−₡0» no existe.
    const isZero = !/[1-9]/.test(body);
    const prefix = negative && !isZero ? '−' : (options.sign && amount > 0 && !isZero ? '+' : '');
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

    // El signo puede ir antes o después del símbolo: «-₡500» y «₡-500».
    const unsigned = text.replace(/^[₡$€\s]+/, '');
    const negative = /^[-−(]/.test(unsigned) || /\)$/.test(unsigned);
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
        // «0,500» es medio, no quinientos: los miles nunca empiezan por cero.
        const looksLikeThousands = parts.length > 2
            || (parts.length === 2 && parts[1].length === 3 && Number(parts[0]) > 0);
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
export function roundNice(minor, currency) {
    const amount = Math.max(0, Number(minor) || 0);
    const step = currency === 'CRC'
        ? (amount >= 10000000 ? 500000 : 100000)     // ₡5.000 / ₡1.000
        : (amount >= 100000 ? 5000 : 1000);          // $50 / $10 (o €)
    return Math.ceil(amount / step) * step;
}

/**
 * Un importe de referencia pensado en colones («un gasto grande son
 * ₡100.000») expresado en la moneda principal con cifra redonda: en euros es
 * «€170», no «€100.000».
 */
export function colonesToBase(minor, fx) {
    const base = fx?.base || BASE_CURRENCY;
    if (base === 'CRC') return minor;
    return roundNice(convertMinor(minor, 'CRC', base, fx), base);
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
