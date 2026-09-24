/**
 * Presentación de cifras en la interfaz.
 *
 * Todo importe pasa por `money()`, que lo envuelve en `.amt`: así el «modo
 * discreto» los oculta todos con una sola regla CSS, sin que cada vista tenga
 * que acordarse.
 */
import { formatMoney } from '../core/money.js';
import { raw, esc } from './dom.js';

/**
 * @param {number} minor
 * @param {string} [currency]
 * @param {{sign?: boolean, compact?: boolean, tone?: 'auto'|'income'|'expense'|'none', decimals?: number, className?: string}} [options]
 */
export function money(minor, currency = 'CRC', options = {}) {
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

export function plural(n, one, many) {
    return `${num(n)} ${n === 1 ? one : many}`;
}

export const METHODS = Object.freeze({
    card: { label: 'Tarjeta', icon: 'credit-card' },
    cash: { label: 'Efectivo', icon: 'cash' },
    sinpe: { label: 'SINPE Móvil', icon: 'sinpe' },
    transfer: { label: 'Transferencia', icon: 'transfer' },
    other: { label: 'Otro', icon: 'dots' }
});
