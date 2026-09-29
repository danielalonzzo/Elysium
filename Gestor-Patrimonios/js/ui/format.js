/**
 * Presentación de cifras en la interfaz.
 *
 * Todo importe pasa por `money()`, que lo envuelve en `.amt`: así el «modo
 * discreto» los oculta todos con una sola regla CSS, sin que cada vista tenga
 * que acordarse.
 *
 * Los totales del modelo están en la moneda principal de la persona, así que
 * `money()` y `formatMoney()` la usan cuando no se indica otra. La fija
 * `app.model()` cada vez que se calcula el modelo; el núcleo, que comparte el
 * backend con muchas personas a la vez, no tiene ese estado y la recibe
 * siempre explícita.
 */
import { formatMoney as formatCore, CURRENCIES, CURRENCY_CODES, currencySymbol, BASE_CURRENCY } from '../core/money.js';
import { raw, esc } from './dom.js';

let displayCurrency = BASE_CURRENCY;

export function setDisplayCurrency(code) {
    if (CURRENCIES[code]) displayCurrency = code;
}

export function displayCurrencyCode() {
    return displayCurrency;
}

export function formatMoney(minor, currency = displayCurrency, options = {}) {
    return formatCore(minor, currency || displayCurrency, options);
}

export { currencySymbol };

/**
 * Importe para un campo de texto editable, sin símbolo: los colones sin
 * decimales salvo que traigan céntimos («12.500,50»). Con `formatMoney` a secas
 * un ₡12.500,50 se mostraba «12.501» y, al guardar, el monto cambiaba solo.
 */
export function fieldAmount(minor, currency = displayCurrency) {
    const value = Number(minor) || 0;
    return formatCore(value, currency || displayCurrency, { symbol: false, decimals: value % 100 ? 2 : undefined });
}

/** Opciones de moneda para un `<select>` («₡ Colones», «$ Dólares», «€ Euros»). */
export function currencyOptions(selected) {
    return raw(CURRENCY_CODES.map(code => `<option value="${code}"${code === selected ? ' selected' : ''}>${esc(CURRENCIES[code].label)}</option>`).join(''));
}

/** Siguiente moneda del ciclo ₡ → $ → € de los botones de moneda. */
export function nextCurrency(code) {
    const index = CURRENCY_CODES.indexOf(code);
    return CURRENCY_CODES[(index + 1) % CURRENCY_CODES.length];
}

/**
 * @param {number} minor
 * @param {string} [currency]
 * @param {{sign?: boolean, compact?: boolean, tone?: 'auto'|'income'|'expense'|'none', decimals?: number, className?: string}} [options]
 */
export function money(minor, currency = displayCurrency, options = {}) {
    const text = formatMoney(minor, currency, options);
    let tone = '';
    if (options.tone === 'auto') tone = minor > 0 ? ' is-pos' : minor < 0 ? ' is-neg' : '';
    else if (options.tone === 'income') tone = ' is-pos';
    else if (options.tone === 'expense') tone = ' is-neg';
    return raw(`<span class="amt${tone}${options.className ? ' ' + esc(options.className) : ''}">${esc(text)}</span>`);
}

/** Importe de un movimiento con su signo: gasto en negativo, ingreso en positivo. */
export function txAmount(tx) {
    if (tx.type === 'income') return money(tx.amountMinor, tx.currency, { sign: true, tone: 'income' });
    if (tx.type === 'expense') return money(-tx.amountMinor, tx.currency, { tone: 'none' });
    return money(tx.amountMinor, tx.currency, { tone: 'none', className: 'is-transfer' });
}

export function pct(value, digits = 0) {
    if (!Number.isFinite(value)) return '—';
    return `${value.toFixed(digits).replace('.', ',')}%`;
}

export function num(value) {
    return String(Math.round(Number(value) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export const METHODS = Object.freeze({
    card: { label: 'Tarjeta', icon: 'credit-card' },
    cash: { label: 'Efectivo', icon: 'cash' },
    sinpe: { label: 'SINPE Móvil', icon: 'sinpe' },
    transfer: { label: 'Transferencia', icon: 'transfer' },
    other: { label: 'Otro', icon: 'dots' }
});
