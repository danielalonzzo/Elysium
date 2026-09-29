/**
 * Formulario declarativo en una hoja. Las entidades sencillas (cuentas,
 * presupuestos, recurrentes, deudas, categorías, metas) comparten la misma
 * mecánica: campos, validación, guardar y, al editar, eliminar.
 */
import { html, raw, haptic } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { openSheet, confirmDialog } from '../ui/overlay.js';
import { formatMoney, currencySymbol, displayCurrencyCode } from '../ui/format.js';
import { parseAmount, CURRENCIES, CURRENCY_CODES } from '../core/money.js';
import { isISODate } from '../core/dates.js';
import { describeError } from '../ui/errors.js';

/**
 * Tipos de campo: text, money, number, select, date, textarea, switch,
 * chips (una opción entre varias), icons (selector de icono), info (texto).
 * Un campo `money` es siempre positivo salvo que lleve `signed: true` (un saldo
 * puede estar en números rojos).
 * Un campo oculto (`toggleFields`) no se valida aunque sea obligatorio.
 *
 * @param {object} options
 * @param {string} options.title
 * @param {string} [options.subtitle]
 * @param {'sm'|'md'|'lg'} [options.size]
 * @param {boolean} [options.gold]           botón de guardar dorado (metas)
 * @param {Array<object>} options.fields     {name, label, type, required, hint, wide, disabled, …}
 * @param {object} [options.values]
 * @param {(values: object, api: object) => Promise<void|string>} options.onSubmit  devuelve texto de error o nada
 * @param {() => Promise<void>} [options.onDelete]
 * @param {{title: string, body?: string}} [options.deleteConfirm]
 * @param {string} [options.submitLabel]
 * @param {string} [options.deleteLabel]
 * @param {(values: object, root: HTMLElement) => void} [options.onChange]
 * @param {(form: HTMLFormElement, api: object, values: object) => void} [options.onMount]
 * @param {any} [options.intro]
 */
export function formSheet(options) {
    const values = { ...(options.values || {}) };
    return openSheet({
        title: options.title,
        subtitle: options.subtitle,
        size: options.size || 'md',
        content: html`<form class="form" novalidate autocomplete="off">
            ${options.intro || ''}
            <div class="form-grid">${options.fields.map(field => renderField(field, values))}</div>
            <p class="field-error" data-error hidden></p>
            <div class="sheet-actions">
                ${options.onDelete ? html`<button type="button" class="btn btn-ghost" data-delete>${icon('trash', { size: 17 })}${options.deleteLabel || 'Eliminar'}</button>` : ''}
                <button type="submit" class="btn ${options.gold ? 'btn-gold' : 'btn-primary'}">${icon('check', { size: 18 })}${options.submitLabel || 'Guardar'}</button>
            </div>
        </form>`,
        onMount(body, api) {
            const form = body.querySelector('form');
            const read = () => readValues(form, options.fields, values);
            form.addEventListener('click', event => {
                const chip = event.target.closest('[data-chip-field]');
                if (!chip) return;
                const name = chip.dataset.chipField;
                values[name] = chip.dataset.value;
                form.querySelectorAll(`[data-chip-field="${name}"]`).forEach(other => other.setAttribute('aria-pressed', String(other === chip)));
                haptic(6);
                options.onChange?.(read(), form);
            });
            form.addEventListener('input', () => options.onChange?.(read(), form));
            form.addEventListener('change', () => options.onChange?.(read(), form));
            form.querySelectorAll('[data-money]').forEach(input => input.addEventListener('blur', () => {
                const value = parseAmount(input.value);
                const currency = form.querySelector(`[name="${input.dataset.currencyField}"]`)?.value || values[input.dataset.currencyField] || displayCurrencyCode();
                if (value !== null) input.value = formatMoney(input.dataset.signed ? value : Math.abs(value), currency, { symbol: false, decimals: value % 100 ? 2 : 0 });
            }));
            form.querySelector('[data-delete]')?.addEventListener('click', async () => {
                const ok = await confirmDialog({
                    title: options.deleteConfirm?.title || '¿Eliminar?',
                    body: options.deleteConfirm?.body || 'Esta acción no se puede deshacer.',
                    confirmLabel: options.deleteLabel || 'Eliminar',
                    danger: true
                });
                if (!ok) return;
                try {
                    await options.onDelete();
                    api.close();
                } catch (err) {
                    console.error(err);
                    const error = form.querySelector('[data-error]');
                    error.textContent = describeError(err, 'No se pudo eliminar. Revise su conexión y vuelva a intentarlo.');
                    error.hidden = false;
                }
            });
            form.addEventListener('submit', async event => {
                event.preventDefault();
                const error = form.querySelector('[data-error]');
                error.hidden = true;
                const data = read();
                for (const field of options.fields) {
                    if (!field.required || form.querySelector(`[data-field="${field.name}"]`)?.hidden) continue;
                    const value = data[field.name];
                    if (value === null || value === undefined || value === '' || (field.type === 'money' && !field.signed && !(value > 0))) {
                        error.textContent = `Falta: ${field.label.toLowerCase()}.`;
                        error.hidden = false;
                        form.querySelector(`[name="${field.name}"]`)?.focus();
                        haptic([10, 40, 10]);
                        return;
                    }
                }
                const submit = form.querySelector('[type="submit"]');
                submit.disabled = true;
                try {
                    const problem = await options.onSubmit(data, api);
                    if (problem) {
                        error.textContent = problem;
                        error.hidden = false;
                        return;
                    }
                    api.close();
                } catch (err) {
                    console.error(err);
                    error.textContent = describeError(err, 'No se pudo guardar. Revise su conexión y vuelva a intentarlo.');
                    error.hidden = false;
                } finally {
                    submit.disabled = false;
                }
            });
            options.onChange?.(read(), form);
            options.onMount?.(form, api, values);
        }
    });
}

function renderField(field, values) {
    const value = values[field.name] ?? field.default ?? '';
    const wide = field.wide || ['textarea', 'switch', 'chips', 'icons', 'info'].includes(field.type) ? ' is-wide' : '';
    const hint = field.hint ? html`<small>${field.hint}</small>` : '';
    const attrs = raw(`name="${field.name}"${field.required ? ' required' : ''}${field.placeholder ? ` placeholder="${String(field.placeholder).replace(/"/g, '&quot;')}"` : ''}${field.maxLength ? ` maxlength="${field.maxLength}"` : ''}`);
    const hiddenAttr = field.hiddenInitially ? raw(' hidden') : '';
    switch (field.type) {
        case 'info':
            return html`<div class="field${wide}" data-field="${field.name}"${hiddenAttr}>${field.content}</div>`;
        case 'money': {
            const currency = values[field.currencyField] || field.currency || displayCurrencyCode();
            return html`<label class="field${wide}" data-field="${field.name}"${hiddenAttr}><span>${field.label}${hint}</span>
                <div class="input-group"><span class="prefix" data-prefix-for="${field.currencyField || ''}">${currencySymbol(currency)}</span>
                <input ${attrs} inputmode="decimal" data-money ${field.signed ? raw('data-signed="1"') : ''} data-currency-field="${field.currencyField || ''}" value="${value ? formatMoney(value, currency, { symbol: false, decimals: value % 100 ? 2 : 0 }) : ''}"></div>
            </label>`;
        }
        case 'number': {
            const input = html`<input ${attrs} type="number" inputmode="decimal" step="${field.step || 'any'}" ${field.min !== undefined ? raw(`min="${field.min}"`) : ''} ${field.max !== undefined ? raw(`max="${field.max}"`) : ''} value="${value}" class="${field.suffix ? 'has-suffix' : ''}">`;
            return html`<label class="field${wide}" data-field="${field.name}"${hiddenAttr}><span>${field.label}${hint}</span>
                ${field.suffix ? html`<div class="input-group">${input}<span class="suffix">${field.suffix}</span></div>` : input}
            </label>`;
        }
        case 'select':
            return html`<label class="field${wide}" data-field="${field.name}"${hiddenAttr}><span>${field.label}${hint}</span>
                <select ${attrs} ${field.disabled ? 'disabled' : ''}>${field.options.map(option => html`<option value="${option.value}" ${String(option.value) === String(value) ? 'selected' : ''}>${option.label}</option>`)}</select>
            </label>`;
        case 'date':
            return html`<label class="field${wide}" data-field="${field.name}"${hiddenAttr}><span>${field.label}${hint}</span><input ${attrs} type="date" value="${value}"></label>`;
        case 'textarea':
            return html`<label class="field${wide}" data-field="${field.name}"${hiddenAttr}><span>${field.label}${hint}</span><textarea ${attrs} rows="3">${value}</textarea></label>`;
        case 'switch':
            return html`<label class="check${wide}" data-field="${field.name}"${hiddenAttr}>
                ${field.iconName ? html`<span class="cat-chip is-sm tone-${field.tone || 'blue'}">${icon(field.iconName, { size: 16 })}</span>` : ''}
                <span class="check-text"><b>${field.label}</b>${field.hint ? html`<small>${field.hint}</small>` : ''}</span>
                <input type="checkbox" name="${field.name}" ${value ? 'checked' : ''}><span class="switch"></span>
            </label>`;
        case 'chips':
            return html`<div class="field${wide}" data-field="${field.name}"${hiddenAttr}><span>${field.label}${hint}</span>
                <div class="chips">${field.options.map(option => html`<button type="button" class="chip ${field.gold ? 'is-gold' : ''}" data-chip-field="${field.name}" data-value="${option.value}" aria-pressed="${String(option.value) === String(value)}">${option.icon ? icon(option.icon, { size: 15 }) : ''}${option.label}</button>`)}</div>
            </div>`;
        case 'icons':
            return html`<div class="field${wide}" data-field="${field.name}"${hiddenAttr}><span>${field.label}</span>
                <div class="chips">${field.options.map(option => html`<button type="button" class="chip" data-chip-field="${field.name}" data-value="${option.value}" aria-pressed="${option.value === value}" aria-label="${option.label || option.value}">${icon(option.icon || option.value, { size: 17 })}</button>`)}</div>
            </div>`;
        default:
            return html`<label class="field${wide}" data-field="${field.name}"${hiddenAttr}><span>${field.label}${hint}</span><input ${attrs} type="${field.inputType || 'text'}" value="${value}"></label>`;
    }
}

function readValues(form, fields, values) {
    const data = { ...values };
    for (const field of fields) {
        const input = form.querySelector(`[name="${field.name}"]`);
        if (field.type === 'chips' || field.type === 'icons' || field.type === 'info') continue;
        if (!input) continue;
        if (field.type === 'money') {
            const parsed = parseAmount(input.value);
            data[field.name] = parsed === null ? null : (field.signed ? parsed : Math.abs(parsed));
        } else if (field.type === 'number') {
            data[field.name] = input.value === '' ? null : Number(input.value);
        } else if (field.type === 'switch') {
            data[field.name] = input.checked;
        } else if (field.type === 'date') {
            data[field.name] = isISODate(input.value) ? input.value : null;
        } else {
            data[field.name] = input.value.trim();
        }
    }
    // Los prefijos de moneda siguen al selector de moneda.
    form.querySelectorAll('[data-prefix-for]').forEach(prefix => {
        const currency = data[prefix.dataset.prefixFor];
        if (currency) prefix.textContent = currencySymbol(currency);
    });
    return data;
}

/** Muestra u oculta campos según los valores actuales. */
export function toggleFields(form, visibility) {
    for (const [name, visible] of Object.entries(visibility)) {
        const element = form.querySelector(`[data-field="${name}"]`);
        if (element) element.hidden = !visible;
    }
}

export const CURRENCY_OPTIONS = CURRENCY_CODES.map(code => ({ value: code, label: CURRENCIES[code].label }));
