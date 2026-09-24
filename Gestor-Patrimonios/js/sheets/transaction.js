/**
 * Registrar y ver movimientos.
 *
 * El formulario está pensado para anotar un gasto en segundos desde el
 * teléfono: el monto arriba y grande con el teclado numérico, las categorías
 * recientes primero, «Hoy» ya elegido, y el comercio que recuerda su
 * categoría. Lo demás (nota, etiquetas, comprobante, impulsivo) va plegado.
 *
 * Mientras se escribe el monto de un gasto, la hoja enseña su impacto: cuántos
 * días retrasa la meta prioritaria y cómo deja el presupuesto de la categoría.
 */
import { app } from '../context.js';
import { html, $, readFileText, haptic } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money, METHODS } from '../ui/format.js';
import { openSheet, toast, actionSheet, confirmDialog } from '../ui/overlay.js';
import { catChip, txTitle } from '../ui/parts.js';
import { formatMoney, parseAmount, inBase, convertMinor } from '../core/money.js';
import { addDays, formatDate, todayISO, isISODate } from '../core/dates.js';
import { normalizeMerchant } from '../core/stats.js';
import { matchCategory } from '../core/categories.js';
import { parseFactura, directionFor } from '../core/factura-cr.js';
import { spendImpactDays } from '../core/goals.js';
import { saveTransaction, deleteTransaction, impactMessage, addContribution, uploadReceipt } from '../services.js';

const TYPE_LABELS = { expense: 'Gasto', income: 'Ingreso', transfer: 'Transferencia' };

function recentCategories(model, kind) {
    const seen = [];
    for (const tx of model.txs) {
        if (tx.type !== kind || !tx.categoryId || seen.includes(tx.categoryId)) continue;
        seen.push(tx.categoryId);
        if (seen.length >= 8) break;
    }
    const list = kind === 'income' ? model.incomeCats : model.expenseCats;
    const ordered = [...seen.map(id => list.find(c => c.id === id)).filter(Boolean), ...list.filter(c => !seen.includes(c.id))];
    return ordered;
}

function defaultAccount(model, type) {
    const usable = model.accounts.filter(a => !a.archived && a.type !== 'asset');
    if (type === 'income') return usable.find(a => a.type === 'bank') || usable[0];
    const counts = new Map();
    for (const tx of model.txs.slice(0, 60)) if (tx.type === type) counts.set(tx.accountId, (counts.get(tx.accountId) || 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return usable.find(a => a.id === top) || usable[0];
}

/**
 * @param {{tx?: object, type?: 'expense'|'income'|'transfer', preset?: object, file?: File}} [options]
 */
export function openTransactionSheet({ tx = null, type = null, preset = {}, file = null } = {}) {
    const model = app.model();
    const editing = Boolean(tx);
    const accounts = model.accounts.filter(a => !a.archived && a.type !== 'asset');
    if (!accounts.length) {
        toast('Primero cree una cuenta (efectivo, banco o tarjeta).', { tone: 'info', action: { label: 'Crear', onClick: () => app.go('#/cuentas?nueva=1') } });
        return null;
    }

    const state = {
        type: tx?.type || type || preset.type || 'expense',
        currency: tx?.currency || preset.currency || null,
        amountMinor: tx?.amountMinor ?? preset.amountMinor ?? null,
        categoryId: tx?.categoryId || preset.categoryId || null,
        accountId: tx?.accountId || preset.accountId || null,
        toAccountId: tx?.toAccountId || preset.toAccountId || null,
        toAmountMinor: tx?.toAmountMinor ?? null,
        date: tx?.date || preset.date || model.today,
        merchant: tx?.merchant || preset.merchant || '',
        method: tx?.method || preset.method || null,
        note: tx?.note || preset.note || '',
        tags: (tx?.tags || preset.tags || []).join(', '),
        impulsive: Boolean(tx?.impulsive || preset.impulsive),
        goalId: preset.goalId || '',
        receipt: tx?.receipt || preset.receipt || null,
        file,
        factura: preset.factura || null,
        showAllCats: false,
        categoryTouched: Boolean(tx?.categoryId || preset.categoryId)
    };
    if (!state.accountId) state.accountId = defaultAccount(model, state.type)?.id;
    if (!state.currency) state.currency = accounts.find(a => a.id === state.accountId)?.currency || model.fx.base;

    const sheet = openSheet({
        title: editing ? 'Editar movimiento' : 'Nuevo movimiento',
        subtitle: editing ? formatDate(tx.date, 'long') : null,
        size: 'md',
        className: 'tx-sheet',
        content: html`<form class="form" novalidate autocomplete="off"></form>`,
        onMount(body, api) {
            const form = body.querySelector('form');
            render();

            function render() {
                const focused = document.activeElement?.name;
                form.innerHTML = String(template());
                bind();
                if (focused) form.querySelector(`[name="${focused}"]`)?.focus({ preventScroll: true });
                updateImpact();
            }

            function template() {
                const cats = recentCategories(model, state.type === 'income' ? 'income' : 'expense');
                const visible = state.showAllCats ? cats : cats.slice(0, 8);
                const selectedCat = model.catById.get(state.categoryId);
                if (selectedCat && !visible.includes(selectedCat)) visible.splice(7, 1, selectedCat);
                const fromAccount = accounts.find(a => a.id === state.accountId);
                const toAccount = accounts.find(a => a.id === state.toAccountId);
                const crossCurrency = state.type === 'transfer' && fromAccount && toAccount && fromAccount.currency !== toAccount.currency;
                const debts = model.debts.filter(d => d.active !== false);
                const goals = model.goals.filter(g => !g.progress.done);
                return html`
                    <div class="seg is-block" role="group" aria-label="Tipo de movimiento">
                        ${['expense', 'income', 'transfer'].map(kind => html`<button type="button" class="is-${kind}" data-type="${kind}" aria-pressed="${state.type === kind}">${TYPE_LABELS[kind]}</button>`)}
                    </div>

                    <div class="amount-input is-${state.type}">
                        <button type="button" class="currency-toggle" data-toggle-currency aria-label="Cambiar moneda">${state.currency === 'USD' ? '$' : '₡'}</button>
                        <input name="amount" inputmode="decimal" enterkeyhint="next" placeholder="0" aria-label="Monto"
                            value="${state.amountMinor ? formatMoney(state.amountMinor, state.currency, { symbol: false }) : ''}" ${editing ? '' : 'autofocus'}>
                    </div>
                    <p class="amount-words" data-amount-hint>${state.currency !== model.fx.base && state.amountMinor ? `≈ ${formatMoney(convertMinor(state.amountMinor, state.currency, model.fx.base, model.fx.rate), model.fx.base)}` : ''}</p>

                    ${state.type === 'transfer' ? html`
                        <div class="form-grid">
                            <label class="field"><span>Desde</span>
                                <select name="accountId">${accounts.map(a => html`<option value="${a.id}" ${a.id === state.accountId ? 'selected' : ''}>${a.name} · ${a.currency}</option>`)}</select>
                            </label>
                            <label class="field"><span>Hacia</span>
                                <select name="toAccountId"><option value="">Elija una cuenta…</option>${accounts.filter(a => a.id !== state.accountId).map(a => html`<option value="${a.id}" ${a.id === state.toAccountId ? 'selected' : ''}>${a.name} · ${a.currency}</option>`)}</select>
                            </label>
                            ${crossCurrency ? html`<label class="field is-wide"><span>Monto recibido en ${toAccount.currency} <small>tipo ${model.fx.rate}</small></span>
                                <div class="input-group"><span class="prefix">${toAccount.currency === 'USD' ? '$' : '₡'}</span>
                                <input name="toAmount" inputmode="decimal" value="${state.toAmountMinor ? formatMoney(state.toAmountMinor, toAccount.currency, { symbol: false }) : ''}" placeholder="${state.amountMinor ? formatMoney(convertMinor(state.amountMinor, fromAccount.currency, toAccount.currency, model.fx.rate), toAccount.currency, { symbol: false }) : ''}"></div>
                            </label>` : ''}
                        </div>
                        <label class="field"><span>Concepto <small>opcional</small></span><input name="merchant" value="${state.merchant}" placeholder="Pago de tarjeta, ahorro del mes…" maxlength="120"></label>
                    ` : html`
                        <label class="field"><span>${state.type === 'income' ? 'De quién o por qué' : 'Comercio o descripción'}</span>
                            <input name="merchant" value="${state.merchant}" list="merchant-list" placeholder="${state.type === 'income' ? 'Salario, cliente, venta…' : 'Supermercado, soda, gasolinera…'}" maxlength="120" enterkeyhint="done">
                            <datalist id="merchant-list">${model.merchants.slice(0, 80).map(name => html`<option value="${name}"></option>`)}</datalist>
                        </label>

                        <div class="field">
                            <span>Categoría ${selectedCat ? html`<small>${selectedCat.name}</small>` : ''}</span>
                            <div class="cat-grid" role="group" aria-label="Categoría">
                                ${visible.map(category => html`<button type="button" class="cat-option" data-cat="${category.id}" aria-pressed="${category.id === state.categoryId}">${catChip(category)}<span>${category.name}</span></button>`)}
                                ${cats.length > 8 ? html`<button type="button" class="cat-option" data-more-cats>${catChip({ icon: state.showAllCats ? 'chevron-up' : 'grid', tone: 'gray' })}<span>${state.showAllCats ? 'Menos' : 'Todas'}</span></button>` : ''}
                            </div>
                        </div>

                        <label class="field"><span>Cuenta</span>
                            <select name="accountId">${accounts.map(a => html`<option value="${a.id}" ${a.id === state.accountId ? 'selected' : ''}>${a.name} · ${a.currency}</option>`)}</select>
                        </label>
                    `}

                    <div class="field">
                        <span>Fecha</span>
                        <div class="chips">
                            <button type="button" class="chip" data-date="${model.today}" aria-pressed="${state.date === model.today}">Hoy</button>
                            <button type="button" class="chip" data-date="${addDays(model.today, -1)}" aria-pressed="${state.date === addDays(model.today, -1)}">Ayer</button>
                            <input type="date" name="date" class="input" value="${state.date}" max="${addDays(model.today, 366)}" style="width:auto;flex:1;min-width:150px;height:34px;border-radius:999px">
                        </div>
                    </div>

                    ${state.type !== 'transfer' ? html`<div class="field"><span>Medio de pago</span><div class="chips is-scroll">
                        ${Object.entries(METHODS).map(([key, method]) => html`<button type="button" class="chip" data-method="${key}" aria-pressed="${state.method === key}">${icon(method.icon, { size: 15 })}${method.label}</button>`)}
                    </div></div>` : ''}

                    <div class="callout is-gold" data-impact hidden></div>

                    <details class="more" ${state.note || state.tags || state.impulsive || state.receipt || state.file || state.goalId ? 'open' : ''}>
                        <summary>${icon('sliders', { size: 16 })} Más detalles</summary>
                        <div class="form">
                            ${state.type === 'expense' ? html`<label class="check">
                                <span class="cat-chip is-sm tone-amber">${icon('zap', { size: 16 })}</span>
                                <span class="check-text"><b>Gasto impulsivo</b><small>No lo tenía pensado. Cuenta para el reto de 7 días.</small></span>
                                <input type="checkbox" name="impulsive" ${state.impulsive ? 'checked' : ''}><span class="switch"></span>
                            </label>` : ''}
                            ${state.type === 'income' && goals.length && !editing ? html`<label class="field"><span>Apartar parte para una meta <small>opcional</small></span>
                                <select name="goalId"><option value="">No apartar</option>${goals.map(g => html`<option value="${g.goal.id}" ${state.goalId === g.goal.id ? 'selected' : ''}>${g.goal.name}</option>`)}</select>
                            </label>
                            <label class="field" data-goal-amount ${state.goalId ? '' : 'hidden'}><span>Monto a apartar</span><input name="goalAmount" inputmode="decimal" placeholder="Ej. 50.000"></label>` : ''}
                            <label class="field"><span>Nota <small>opcional</small></span><textarea name="note" maxlength="500" rows="2" placeholder="Algo que quiera recordar">${state.note}</textarea></label>
                            <label class="field"><span>Etiquetas <small>separadas por coma</small></span><input name="tags" value="${state.tags}" placeholder="viaje, cumpleaños…" maxlength="160"></label>
                            <div class="field">
                                <span>Comprobante <small>foto, PDF o XML de Hacienda</small></span>
                                ${state.receipt ? html`<div class="receipt-chip">${icon(receiptIcon(state.receipt.type))}<span>${state.receipt.name}</span><button type="button" class="icon-btn is-sm is-plain" data-remove-receipt aria-label="Quitar comprobante">${icon('x', { size: 16 })}</button></div>` : ''}
                                ${state.file ? html`<div class="receipt-chip is-new">${icon(receiptIcon(state.file.type || (/\.xml$/i.test(state.file.name) ? 'application/xml' : '')))}<span>${state.file.name}</span><button type="button" class="icon-btn is-sm is-plain" data-remove-file aria-label="Quitar archivo">${icon('x', { size: 16 })}</button></div>` : ''}
                                ${!state.receipt && !state.file ? html`<label class="upload-zone">
                                    ${icon('camera', { size: 22 })}<span>Tome una foto o elija un archivo</span>
                                    <input type="file" name="file" accept="image/*,application/pdf,.xml,application/xml,text/xml">
                                </label>` : ''}
                                ${state.factura ? html`<p class="field-hint">${icon('check-circle', { size: 14 })} Datos leídos de la ${state.factura.label.toLowerCase()} ${state.factura.consecutivo ? '#' + state.factura.consecutivo.slice(-8) : ''}.</p>` : ''}
                                <div class="upload-progress" data-progress hidden><span></span></div>
                            </div>
                            ${state.type === 'expense' && debts.length ? html`<p class="field-hint">¿Es la cuota de un préstamo? Regístrela desde <a href="#/deudas">Deudas</a> para que baje el saldo.</p>` : ''}
                        </div>
                    </details>

                    <p class="field-error" data-error hidden></p>

                    <div class="sheet-actions">
                        ${editing ? html`<button type="button" class="btn btn-ghost" data-delete>${icon('trash', { size: 18 })}Eliminar</button>` : html`<button type="button" class="btn btn-ghost hide-mobile" data-save-another>Guardar y otro</button>`}
                        <button type="submit" class="btn btn-primary">${icon('check', { size: 18 })}${editing ? 'Guardar cambios' : 'Guardar'}</button>
                    </div>`;
            }

            function receiptIcon(type = '') {
                if (/xml/.test(type)) return 'file-code';
                if (/pdf/.test(type)) return 'file-text';
                return 'image';
            }

            function readAmount() {
                const value = parseAmount(form.querySelector('[name="amount"]')?.value);
                return value === null ? null : Math.abs(value);
            }

            function syncFromInputs() {
                state.amountMinor = readAmount();
                const read = name => form.querySelector(`[name="${name}"]`);
                if (read('merchant')) state.merchant = read('merchant').value.trim();
                if (read('accountId')) state.accountId = read('accountId').value;
                if (read('toAccountId')) state.toAccountId = read('toAccountId').value || null;
                if (read('toAmount')) state.toAmountMinor = parseAmount(read('toAmount').value);
                if (read('date') && isISODate(read('date').value)) state.date = read('date').value;
                if (read('note')) state.note = read('note').value.trim();
                if (read('tags')) state.tags = read('tags').value;
                if (read('impulsive')) state.impulsive = read('impulsive').checked;
                if (read('goalId')) state.goalId = read('goalId').value;
            }

            function updateImpact() {
                const box = form.querySelector('[data-impact]');
                if (!box) return;
                const amount = readAmount();
                if (state.type !== 'expense' || !amount) { box.hidden = true; return; }
                const base = inBase(amount, state.currency, model.fx);
                const goal = model.goals.find(g => !g.progress.done && g.pace > 0);
                const days = goal ? spendImpactDays(base, inBase(goal.pace, goal.goal.currency, model.fx)) : null;
                const budget = model.budgets.find(b => b.budget.categoryId === state.categoryId);
                const parts = [];
                if (goal && days > 0) parts.push(html`Retrasa <b>«${goal.goal.name}»</b> ${days} ${days === 1 ? 'día' : 'días'}.`);
                if (budget) {
                    const left = budget.status.remaining - (editing && tx.categoryId === state.categoryId ? base - inBase(tx.amountMinor, tx.currency, model.fx) : base);
                    parts.push(left >= 0
                        ? html` Le quedarían <b>${money(left)}</b> en ${budget.category.name.toLowerCase()}.`
                        : html` Superaría el presupuesto de ${budget.category.name.toLowerCase()} por <b>${money(-left)}</b>.`);
                }
                if (!parts.length) { box.hidden = true; return; }
                box.innerHTML = String(html`${icon('sparkle', { size: 18 })}<span>${parts}</span>`);
                box.hidden = false;
                box.classList.toggle('is-warn', Boolean(budget && budget.status.remaining - base < 0));
                box.classList.toggle('is-gold', !(budget && budget.status.remaining - base < 0));
            }

            function suggestCategory() {
                if (state.categoryTouched || state.type === 'transfer' || !state.merchant) return;
                const remembered = model.merchantMemory.get(normalizeMerchant(state.merchant));
                const kind = state.type === 'income' ? 'income' : 'expense';
                const guess = remembered && model.catById.get(remembered)?.kind === kind
                    ? remembered
                    : matchCategory(state.merchant, model.categories, kind);
                if (guess && guess !== state.categoryId) {
                    state.categoryId = guess;
                    form.querySelectorAll('[data-cat]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.cat === guess)));
                    if (!form.querySelector(`[data-cat="${guess}"]`)) render();
                    updateImpact();
                }
            }

            async function applyFile(selected) {
                state.file = selected;
                const isXml = /xml/.test(selected.type) || /\.xml$/i.test(selected.name);
                if (isXml) {
                    try {
                        const parsed = parseFactura(await readFileText(selected));
                        applyFactura(parsed);
                        toast('Factura leída: revise los datos y guarde.', { tone: 'success', iconName: 'file-code' });
                    } catch (error) {
                        toast(error.message || 'No se pudo leer el XML.', { tone: 'error' });
                    }
                }
                render();
            }

            function applyFactura(parsed) {
                state.factura = parsed;
                const direction = directionFor(parsed, model.settings.taxId);
                state.type = direction === 'income' ? 'income' : 'expense';
                state.amountMinor = parsed.totalMinor;
                state.currency = parsed.currency === 'USD' ? 'USD' : 'CRC';
                if (parsed.date) state.date = parsed.date;
                state.merchant = parsed.merchant || state.merchant;
                if (parsed.method) state.method = parsed.method;
                if (!state.categoryTouched) {
                    const kind = state.type === 'income' ? 'income' : 'expense';
                    state.categoryId = model.merchantMemory.get(normalizeMerchant(state.merchant))
                        || matchCategory(`${parsed.merchant} ${parsed.lines.map(l => l.detail).join(' ')}`, model.categories, kind)
                        || state.categoryId;
                }
                const account = accounts.find(a => a.id === state.accountId);
                if (account && account.currency !== state.currency) {
                    const match = accounts.find(a => a.currency === state.currency);
                    if (match) state.accountId = match.id;
                }
            }

            function bind() {
                form.querySelectorAll('[data-type]').forEach(button => button.addEventListener('click', () => {
                    syncFromInputs();
                    const next = button.dataset.type;
                    if (next === state.type) return;
                    state.type = next;
                    if (!state.categoryTouched || model.catById.get(state.categoryId)?.kind !== (next === 'income' ? 'income' : 'expense')) {
                        state.categoryId = null;
                        state.categoryTouched = false;
                    }
                    if (next === 'transfer' && !state.toAccountId) state.toAccountId = accounts.find(a => a.id !== state.accountId)?.id || null;
                    haptic();
                    render();
                    suggestCategory();
                }));
                form.querySelector('[data-toggle-currency]')?.addEventListener('click', () => {
                    syncFromInputs();
                    state.currency = state.currency === 'USD' ? 'CRC' : 'USD';
                    const match = accounts.find(a => a.currency === state.currency);
                    if (match && accounts.find(a => a.id === state.accountId)?.currency !== state.currency) state.accountId = match.id;
                    render();
                });
                const amountInput = form.querySelector('[name="amount"]');
                amountInput?.addEventListener('input', () => {
                    const value = readAmount();
                    const hint = form.querySelector('[data-amount-hint]');
                    if (hint) hint.textContent = value && state.currency !== model.fx.base
                        ? `≈ ${formatMoney(convertMinor(value, state.currency, model.fx.base, model.fx.rate), model.fx.base)}`
                        : '';
                    updateImpact();
                });
                amountInput?.addEventListener('blur', () => {
                    const value = readAmount();
                    if (value) amountInput.value = formatMoney(value, state.currency, { symbol: false, decimals: state.currency === 'USD' ? 2 : (value % 100 ? 2 : 0) });
                });
                const merchantInput = form.querySelector('[name="merchant"]');
                merchantInput?.addEventListener('change', () => { state.merchant = merchantInput.value.trim(); suggestCategory(); });
                merchantInput?.addEventListener('input', () => {
                    state.merchant = merchantInput.value.trim();
                    const known = model.merchants.find(name => normalizeMerchant(name) === normalizeMerchant(state.merchant));
                    if (known) suggestCategory();
                });
                form.querySelectorAll('[data-cat]').forEach(button => button.addEventListener('click', () => {
                    state.categoryId = button.dataset.cat;
                    state.categoryTouched = true;
                    form.querySelectorAll('[data-cat]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
                    haptic(6);
                    updateImpact();
                }));
                form.querySelector('[data-more-cats]')?.addEventListener('click', () => { syncFromInputs(); state.showAllCats = !state.showAllCats; render(); });
                form.querySelector('[name="accountId"]')?.addEventListener('change', event => {
                    syncFromInputs();
                    const account = accounts.find(a => a.id === event.target.value);
                    if (account && state.type !== 'transfer') state.currency = account.currency;
                    if (state.type === 'transfer') {
                        state.currency = account?.currency || state.currency;
                        if (state.toAccountId === state.accountId) state.toAccountId = null;
                    }
                    render();
                });
                form.querySelector('[name="toAccountId"]')?.addEventListener('change', () => { syncFromInputs(); render(); });
                form.querySelectorAll('[data-date]').forEach(button => button.addEventListener('click', () => {
                    syncFromInputs();
                    state.date = button.dataset.date;
                    render();
                }));
                form.querySelector('[name="date"]')?.addEventListener('change', event => {
                    if (isISODate(event.target.value)) state.date = event.target.value;
                    form.querySelectorAll('[data-date]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.date === state.date)));
                });
                form.querySelectorAll('[data-method]').forEach(button => button.addEventListener('click', () => {
                    state.method = state.method === button.dataset.method ? null : button.dataset.method;
                    form.querySelectorAll('[data-method]').forEach(other => other.setAttribute('aria-pressed', String(other.dataset.method === state.method)));
                }));
                form.querySelector('[name="goalId"]')?.addEventListener('change', event => {
                    state.goalId = event.target.value;
                    const wrap = form.querySelector('[data-goal-amount]');
                    if (wrap) wrap.hidden = !state.goalId;
                });
                form.querySelector('[name="file"]')?.addEventListener('change', event => {
                    syncFromInputs();
                    const selected = event.target.files?.[0];
                    if (selected) applyFile(selected);
                });
                const zone = form.querySelector('.upload-zone');
                if (zone) {
                    zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('is-drag'); });
                    zone.addEventListener('dragleave', () => zone.classList.remove('is-drag'));
                    zone.addEventListener('drop', event => {
                        event.preventDefault();
                        zone.classList.remove('is-drag');
                        const dropped = event.dataTransfer?.files?.[0];
                        if (dropped) { syncFromInputs(); applyFile(dropped); }
                    });
                }
                form.querySelector('[data-remove-receipt]')?.addEventListener('click', () => { syncFromInputs(); state.receipt = null; render(); });
                form.querySelector('[data-remove-file]')?.addEventListener('click', () => { syncFromInputs(); state.file = null; state.factura = null; render(); });
                form.querySelector('[data-delete]')?.addEventListener('click', async () => {
                    const ok = await confirmDialog({ title: '¿Eliminar este movimiento?', body: 'Podrá deshacerlo durante unos segundos.', confirmLabel: 'Eliminar', danger: true });
                    if (!ok) return;
                    await api.close();
                    deleteTransaction(tx);
                });
                form.querySelector('[data-save-another]')?.addEventListener('click', () => submit(true));
                form.addEventListener('submit', event => { event.preventDefault(); submit(false); });
            }

            async function submit(another) {
                syncFromInputs();
                const error = form.querySelector('[data-error]');
                const fail = message => { error.textContent = message; error.hidden = false; haptic([10, 40, 10]); };
                if (!state.amountMinor || state.amountMinor <= 0) return fail('Escriba un monto mayor que cero.');
                if (state.amountMinor > 1e14) return fail('Ese monto parece demasiado grande.');
                if (state.type === 'transfer') {
                    if (!state.toAccountId || state.toAccountId === state.accountId) return fail('Elija una cuenta de destino distinta.');
                } else if (!state.categoryId) {
                    return fail('Elija una categoría.');
                }
                const fromAccount = accounts.find(a => a.id === state.accountId);
                const toAccount = accounts.find(a => a.id === state.toAccountId);
                const currency = state.type === 'transfer' ? fromAccount?.currency || state.currency : state.currency;
                const doc = {
                    ...(editing ? tx : {}),
                    type: state.type,
                    amountMinor: state.amountMinor,
                    currency,
                    date: state.date,
                    accountId: state.accountId,
                    merchant: state.merchant.slice(0, 120),
                    note: state.note.slice(0, 500) || undefined,
                    tags: state.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean).slice(0, 8),
                    method: state.type === 'transfer' ? 'transfer' : state.method || undefined,
                    receipt: state.receipt || undefined
                };
                if (state.type === 'transfer') {
                    doc.toAccountId = state.toAccountId;
                    doc.toAmountMinor = toAccount && fromAccount && toAccount.currency !== fromAccount.currency
                        ? (state.toAmountMinor || convertMinor(state.amountMinor, fromAccount.currency, toAccount.currency, model.fx.rate))
                        : state.amountMinor;
                    delete doc.categoryId;
                    delete doc.impulsive;
                } else {
                    doc.categoryId = state.categoryId;
                    doc.impulsive = state.type === 'expense' ? state.impulsive : false;
                    delete doc.toAccountId;
                    delete doc.toAmountMinor;
                }
                if (state.factura) {
                    doc.factura = {
                        clave: state.factura.clave, consecutivo: state.factura.consecutivo, issuerId: state.factura.issuer?.id,
                        taxMinor: state.factura.taxMinor, documentType: state.factura.documentType
                    };
                }
                if (!doc.tags.length) delete doc.tags;
                if (editing && !state.receipt && tx.receipt?.path && tx.receipt.path !== state.receipt?.path) {
                    app.store.removeFile(tx.receipt.path);
                }

                const submitButton = form.querySelector('[type="submit"]');
                submitButton.disabled = true;
                const progress = form.querySelector('[data-progress]');
                try {
                    if (state.file && progress) progress.hidden = false;
                    const { id, impact } = await saveTransaction(doc, {
                        receiptFile: state.file,
                        onProgress: p => { if (progress) progress.querySelector('span').style.width = `${Math.round(p * 100)}%`; }
                    });
                    if (preset.inboxId) await app.store.remove('receipts', preset.inboxId);
                    if (state.goalId && state.type === 'income') {
                        const goalAmount = Math.abs(parseAmount(form.querySelector('[name="goalAmount"]')?.value) || 0);
                        if (goalAmount > 0) await addContribution({ goalId: state.goalId, amountMinor: goalAmount, date: state.date, note: `Desde ${state.merchant || 'un ingreso'}` });
                    }
                    const message = impactMessage(impact);
                    toast(editing ? 'Cambios guardados' : `${TYPE_LABELS[state.type]} registrado${state.type === 'transfer' ? 'a' : ''}${message ? '. ' + message : ''}`, {
                        tone: impact?.budget?.remaining < 0 ? 'info' : 'success',
                        duration: message ? 5200 : 3000,
                        action: editing ? null : { label: 'Ver', onClick: () => openTransactionDetail(id) }
                    });
                    if (another) {
                        state.amountMinor = null;
                        state.merchant = '';
                        state.note = '';
                        state.tags = '';
                        state.file = null;
                        state.factura = null;
                        state.receipt = null;
                        state.impulsive = false;
                        state.categoryTouched = false;
                        render();
                        form.querySelector('[name="amount"]')?.focus();
                    } else {
                        await api.close();
                    }
                } catch (err) {
                    console.error(err);
                    fail(err.message && err.message.length < 120 ? err.message : 'No se pudo guardar. Revise su conexión y vuelva a intentarlo.');
                } finally {
                    submitButton.disabled = false;
                }
            }
        }
    });
    return sheet;
}

/* ── Detalle ───────────────────────────────────────────────────────────── */

export function openTransactionDetail(id) {
    const model = app.model();
    const tx = model.txById.get(id) || app.store.get('transactions', id);
    if (!tx) {
        toast('Ese movimiento ya no existe.', { tone: 'error' });
        return;
    }
    const category = model.catById.get(tx.categoryId);
    const account = model.accounts.find(a => a.id === tx.accountId);
    const toAccount = model.accounts.find(a => a.id === tx.toAccountId);
    const method = METHODS[tx.method];
    const debt = tx.debtId ? model.debts.find(d => d.id === tx.debtId) : null;
    const rule = tx.recurringId ? model.recurring.find(r => r.id === tx.recurringId) : null;

    openSheet({
        title: txTitle(tx, model),
        subtitle: `${TYPE_LABELS[tx.type]} · ${formatDate(tx.date, 'long')}`,
        size: 'sm',
        content: html`
            <div class="tx-detail">
                <div class="tx-detail-amount is-${tx.type}">
                    ${tx.type === 'expense' ? money(-tx.amountMinor, tx.currency) : money(tx.amountMinor, tx.currency, { sign: tx.type === 'income' })}
                    ${tx.currency !== model.fx.base ? html`<small>≈ ${money(convertMinor(tx.amountMinor, tx.currency, model.fx.base, model.fx.rate), model.fx.base)}</small>` : ''}
                </div>
                <dl class="detail-list">
                    ${category ? html`<div><dt>Categoría</dt><dd>${catChip(category, { size: 'sm' })}${category.name}</dd></div>` : ''}
                    ${account ? html`<div><dt>${tx.type === 'transfer' ? 'Desde' : 'Cuenta'}</dt><dd>${account.name}</dd></div>` : ''}
                    ${toAccount ? html`<div><dt>Hacia</dt><dd>${toAccount.name}${tx.toAmountMinor && toAccount.currency !== tx.currency ? html` · ${money(tx.toAmountMinor, toAccount.currency)}` : ''}</dd></div>` : ''}
                    ${method ? html`<div><dt>Medio</dt><dd>${icon(method.icon, { size: 16 })}${method.label}</dd></div>` : ''}
                    ${debt ? html`<div><dt>Préstamo</dt><dd>${debt.name}${tx.interestMinor ? html` · intereses ${money(tx.interestMinor, tx.currency)}` : ''}</dd></div>` : ''}
                    ${rule ? html`<div><dt>Recurrente</dt><dd>${icon('repeat', { size: 16 })}${rule.name}</dd></div>` : ''}
                    ${tx.impulsive ? html`<div><dt>Marca</dt><dd><span class="flag is-impulse">impulsivo</span></dd></div>` : ''}
                    ${tx.tags?.length ? html`<div><dt>Etiquetas</dt><dd class="chips">${tx.tags.map(tag => html`<span class="pill">#${tag}</span>`)}</dd></div>` : ''}
                    ${tx.note ? html`<div class="is-block"><dt>Nota</dt><dd>${tx.note}</dd></div>` : ''}
                    ${tx.factura?.clave ? html`<div class="is-block"><dt>Factura electrónica</dt><dd class="mono">${tx.factura.clave}</dd></div>` : ''}
                </dl>
                ${tx.receipt ? html`<div class="receipt-preview" data-receipt>${icon('receipt')}<span>${tx.receipt.name || 'Comprobante'}</span><button type="button" class="btn btn-sm btn-ghost" data-open-receipt>${icon('external', { size: 15 })}Abrir</button></div>` : ''}
                <div class="sheet-actions">
                    <button type="button" class="btn btn-ghost" data-more>${icon('dots', { size: 18 })}</button>
                    <button type="button" class="btn btn-primary" data-edit>${icon('edit', { size: 17 })}Editar</button>
                </div>
            </div>`,
        onMount(body, api) {
            body.querySelector('[data-edit]').addEventListener('click', async () => {
                await api.close();
                openTransactionSheet({ tx });
            });
            body.querySelector('[data-more]').addEventListener('click', async () => {
                await api.close();
                actionSheet({
                    title: 'Más acciones',
                    actions: [
                        { label: 'Duplicar para hoy', icon: 'copy', onClick: () => openTransactionSheet({ preset: { ...tx, id: undefined, date: todayISO(), receipt: null } , type: tx.type }) },
                        { label: 'Convertir en recurrente', icon: 'repeat', hint: 'Para que se repita solo', onClick: async () => { const { openRecurringSheet } = await import('./forms.js'); openRecurringSheet({ preset: { type: tx.type, amountMinor: tx.amountMinor, currency: tx.currency, categoryId: tx.categoryId, accountId: tx.accountId, name: tx.merchant || '', anchorDate: tx.date } }); } },
                        { label: 'Eliminar', icon: 'trash', danger: true, onClick: async () => { if (await confirmDialog({ title: '¿Eliminar este movimiento?', body: 'Podrá deshacerlo durante unos segundos.', confirmLabel: 'Eliminar', danger: true })) deleteTransaction(tx); } }
                    ]
                });
            });
            body.querySelector('[data-open-receipt]')?.addEventListener('click', async () => {
                if (tx.receipt?.demo) {
                    toast('En la demostración los comprobantes son de ejemplo.', { tone: 'info' });
                    return;
                }
                try {
                    const url = await app.store.fileUrl(tx.receipt.path);
                    if (url) window.open(url, '_blank', 'noopener');
                } catch {
                    toast('No se pudo abrir el comprobante.', { tone: 'error' });
                }
            });
        }
    });
}

/** Adjunta un archivo a un movimiento existente (desde Comprobantes). */
export async function attachReceipt(txId, file) {
    const tx = app.store.get('transactions', txId);
    if (!tx) return;
    const receipt = await uploadReceipt(file, txId);
    await app.store.patch('transactions', txId, { receipt });
    toast('Comprobante adjuntado', { tone: 'success' });
}
