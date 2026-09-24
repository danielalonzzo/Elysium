/**
 * Piezas de interfaz reutilizadas por varias vistas: chip de categoría, fila
 * de movimiento, barra de progreso, estados vacíos.
 */
import { html, raw } from './dom.js';
import { icon } from './icons.js';
import { money, txAmount, METHODS } from './format.js';
import { rosette } from './guilloche.js';
import { formatDate } from '../core/dates.js';
import { inBase } from '../core/money.js';
import { GOAL_KINDS } from '../core/goals.js';

export function catChip(category, { size = '' } = {}) {
    const tone = category?.tone || 'gray';
    const name = category?.icon || 'dots';
    return html`<span class="cat-chip ${size ? 'is-' + size : ''} tone-${tone}" aria-hidden="true">${icon(name, { size: size === 'sm' ? 16 : size === 'lg' ? 24 : 20 })}</span>`;
}

export function txIconFor(tx, model) {
    if (tx.type === 'transfer') return catChip({ icon: 'transfer', tone: 'blue' });
    return catChip(model.catById.get(tx.categoryId) || { icon: tx.type === 'income' ? 'arrow-down-left' : 'dots', tone: 'gray' });
}

export function txTitle(tx, model) {
    if (tx.merchant) return tx.merchant;
    if (tx.type === 'transfer') {
        const from = model.accounts.find(a => a.id === tx.accountId)?.name || 'Cuenta';
        const to = model.accounts.find(a => a.id === tx.toAccountId)?.name || 'Cuenta';
        return `${from} → ${to}`;
    }
    return model.catById.get(tx.categoryId)?.name || (tx.type === 'income' ? 'Ingreso' : 'Gasto');
}

export function txRow(tx, model, { showDate = false } = {}) {
    const category = model.catById.get(tx.categoryId);
    const account = model.accounts.find(a => a.id === tx.accountId);
    const metaParts = [];
    if (tx.type === 'transfer') metaParts.push('Transferencia');
    else if (category && tx.merchant) metaParts.push(category.name);
    if (account && tx.type !== 'transfer') metaParts.push(account.name);
    if (showDate) metaParts.push(formatDate(tx.date, 'relative', model.today));
    const method = METHODS[tx.method];
    return html`<button type="button" class="tx" data-tx="${tx.id}">
        ${txIconFor(tx, model)}
        <span class="tx-main">
            <span class="tx-title">${txTitle(tx, model)}</span>
            <span class="tx-meta">
                ${method ? icon(method.icon, { size: 13 }) : ''}
                ${metaParts.join(' · ')}
                ${tx.impulsive ? html`<span class="flag is-impulse">impulsivo</span>` : ''}
                ${tx.receipt ? html`<span class="flag is-receipt">${icon('receipt', { size: 11 })}</span>` : ''}
            </span>
        </span>
        <span class="tx-amount">${txAmount(tx)}${tx.currency && tx.currency !== model.fx.base ? html`<small>${money(inBase(tx.amountMinor, tx.currency, model.fx), model.fx.base)}</small>` : ''}</span>
    </button>`;
}

export function progressBar(pct, { tone = 'accent', pace = null, label = '', size = '' } = {}) {
    const width = Math.max(0, Math.min(100, pct));
    return html`<div class="progress is-${tone} ${size ? 'is-' + size : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" ${label ? raw(`aria-label="${label.replace(/"/g, '')}"`) : ''}>
        <span class="progress-fill" data-width="${width.toFixed(1)}"></span>
        ${pace !== null ? html`<span class="progress-pace" style="left:${Math.max(0, Math.min(100, pace)).toFixed(1)}%" title="Dónde debería ir hoy"></span>` : ''}
    </div>`;
}

/** Tras pintar, anima las barras desde 0 (el ancho real va en data-width). */
export function animateBars(root) {
    const fill = () => root.querySelectorAll('.progress-fill[data-width]').forEach(bar => {
        bar.style.width = `${bar.dataset.width}%`;
    });
    // Con la pestaña oculta rAF no corre: se pinta ya, sin animación.
    if (document.hidden) { fill(); return; }
    requestAnimationFrame(() => requestAnimationFrame(fill));
}

export function emptyState({ title, body, action = null, seed = 'vacío', iconName = null }) {
    return html`<div class="empty">
        ${iconName ? html`<span class="cat-chip is-lg tone-gold">${icon(iconName, { size: 26 })}</span>` : rosette({ seed, size: 160, layers: 3 })}
        <h3>${title}</h3>
        ${body ? html`<p>${body}</p>` : ''}
        ${action || ''}
    </div>`;
}

export function goalIcon(goal) {
    return GOAL_KINDS[goal?.kind]?.icon || 'star';
}

export function deltaPill(current, previous, { invert = false, suffix = 'vs. mes anterior' } = {}) {
    if (!previous) return html`<span class="faint">Sin mes anterior para comparar</span>`;
    const change = (current - previous) / Math.abs(previous) * 100;
    if (!Number.isFinite(change)) return '';
    const up = change >= 0;
    const good = invert ? !up : up;
    return html`<span class="delta ${good ? 'is-up' : 'is-down'}">${icon(up ? 'trending-up' : 'trending-down', { size: 13 })}${Math.abs(change).toFixed(0)}%<span class="sr-only"> ${suffix}</span></span>`;
}

export function stateIcon(state) {
    return { ok: 'check-circle', pace: 'gauge', warning: 'alert', over: 'alert-circle', done: 'check-circle', 'on-track': 'check-circle', 'at-risk': 'alert', late: 'alert-circle', 'no-plan': 'info' }[state] || 'info';
}
