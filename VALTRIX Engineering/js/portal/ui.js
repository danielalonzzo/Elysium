/**
 * Las piezas de la interfaz. Sin dependencias y sin compilación: el portal son
 * módulos ES que el navegador carga tal cual.
 *
 * Tres reglas que explican por qué está hecho así:
 *
 *   · **`h()` crea nodos, nunca cadenas de HTML.** Aquí se pintan nombres de
 *     negocios, de clientes y notas que escribe gente; con `innerHTML`
 *     cualquiera de esos textos podría traer etiquetas. Un nodo de texto no
 *     ejecuta nada.
 *
 *   · **Ningún estilo en línea.** La política de contenido de la cuenta es
 *     `style-src 'self'`: un atributo `style` se bloquea. Lo que varía con el
 *     dato (el ancho de una barra) se pone con `style.setProperty`, que la
 *     política sí admite, y casi siempre como variable CSS (`--w`).
 *
 *   · **El dinero entra y sale entero.** Los formularios convierten lo que la
 *     persona escribe («1 500,50») a la unidad menor antes de enviarlo, y
 *     aquí se formatea siempre desde enteros.
 */

import { formatMoney, formatPercent, formatQuantity, moneyInput, parseMoney, parseQuantity, quantityInput } from '../core/money.js';
import { dayLabel, isDay, periodLabel } from '../core/time.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/* ================================================================== *
 * Nodos
 * ================================================================== */

export function h(tag, attributes = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes || {})) {
        if (value === null || value === undefined || value === false) continue;
        if (key === 'class') {
            const list = (Array.isArray(value) ? value : [value]).filter(Boolean);
            if (list.length) node.className = list.join(' ');
        } else if (key === 'text') {
            node.textContent = String(value);
        } else if (key === 'on') {
            for (const [event, handler] of Object.entries(value)) node.addEventListener(event, handler);
        } else if (key === 'dataset') {
            Object.assign(node.dataset, value);
        } else if (key === 'style') {
            // Nunca un atributo `style`: la política de contenido lo bloquea.
            for (const [property, amount] of Object.entries(value)) node.style.setProperty(property, String(amount));
        } else if (key === 'value' && 'value' in node) {
            node.value = value;
        } else if (key === 'checked' || key === 'selected' || key === 'disabled' || key === 'required' || key === 'hidden' || key === 'open') {
            node[key] = Boolean(value);
        } else if (value === true) {
            node.setAttribute(key, '');
        } else {
            node.setAttribute(key, String(value));
        }
    }
    append(node, children);
    return node;
}

export function append(node, children) {
    for (const child of children) {
        if (child === null || child === undefined || child === false || child === '') continue;
        if (Array.isArray(child)) append(node, child);
        else node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
}

export function clear(node) {
    node.replaceChildren();
    return node;
}

function svg(tag, attributes = {}, ...children) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attributes)) {
        if (value === null || value === undefined || value === false) continue;
        if (key === 'text') node.textContent = String(value);
        else node.setAttribute(key, String(value));
    }
    for (const child of children) if (child) node.append(child);
    return node;
}

/* ================================================================== *
 * Formato
 * ================================================================== */

export const money = formatMoney;
export const percent = formatPercent;
export const qty = (milli, unit = '') => (unit && unit !== 'unidad' && unit !== 'servicio' ? `${formatQuantity(milli)} ${unit}` : formatQuantity(milli));
export const day = (value, options) => dayLabel(value, options);
export const capitalize = text => (text ? text[0].toUpperCase() + text.slice(1) : '');
export const month = period => capitalize(periodLabel(period));

/** «14 de noviembre, 3:42 p. m.» a partir de un instante ISO. */
export function moment(iso) {
    if (!iso) return '—';
    const parsed = new Date(iso);
    if (!Number.isFinite(parsed.getTime())) return '—';
    return parsed.toLocaleString('es-CR', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
}

/** Importe abreviado para el eje de una gráfica: «450 mil», «1,2 M». */
export function compactMoney(minor, currency) {
    const value = minor / 100;
    const symbol = money(0, currency).replace(/[\d\s ,.]/g, '');
    if (Math.abs(value) >= 1e6) return `${symbol}${(value / 1e6).toFixed(value % 1e6 === 0 ? 0 : 1).replace('.', ',')} M`;
    if (Math.abs(value) >= 1e3) return `${symbol}${Math.round(value / 1e3)} mil`;
    return `${symbol}${Math.round(value)}`;
}

/** Iniciales para el avatar: «Taller Horizonte» → «TH». */
export function initials(name) {
    return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join('') || '?';
}

/* ================================================================== *
 * Estructura
 * ================================================================== */

export function pageHead({ eyebrow = '', title, lead = '', actions = null, back = null }) {
    return h('header', { class: 'page-head' },
        h('div', {},
            back ? h('a', { class: 'back-link', href: back.href, text: `← ${back.label}` }) : null,
            eyebrow ? h('p', { class: 'eyebrow', text: eyebrow }) : null,
            h('h1', { text: title }),
            lead ? h('p', { class: 'lead' }, lead) : null),
        actions ? h('div', { class: 'page-actions' }, actions) : null);
}

export function panel({ title = '', hint = '', actions = null, className = '' }, ...body) {
    return h('section', { class: ['panel', className] },
        title || actions ? h('div', { class: 'panel-head' },
            h('div', {}, title ? h('h2', { text: title }) : null, hint ? h('p', { text: hint }) : null),
            actions ? h('div', { class: 'panel-actions' }, actions) : null) : null,
        ...body);
}

/** Fila de cifras. `tone` colorea la nota, que siempre dice con palabras lo que el color sugiere. */
export function kpis(items) {
    return h('div', { class: 'kpis' }, items.filter(Boolean).map(item => h('article', { class: ['kpi', item.tone && `is-${item.tone}`] },
        h('p', { class: 'kpi-label', text: item.label }),
        h('p', { class: 'kpi-value', text: item.value }),
        item.hint ? h('p', { class: 'kpi-hint', text: item.hint }) : null)));
}

export const badge = (text, tone = '') => h('span', { class: ['badge', tone && `is-${tone}`], text });

export function btn(label, { kind = '', small = false, onClick = null, type = 'button', disabled = false, title = null, href = null } = {}) {
    const classes = ['btn', kind && `is-${kind}`, small && 'is-small'];
    if (href) return h('a', { class: classes, href, title }, label);
    return h('button', { type, class: classes, disabled, title, on: onClick ? { click: onClick } : undefined }, label);
}

export const loading = (label = 'Cargando…') => h('p', { class: 'portal-loading', role: 'status', text: label });
export const empty = (label, action = null) => h('div', {}, h('p', { class: 'empty', text: label }), action ? h('p', { class: 'empty' }, action) : null);

export function notice(text, kind = 'info') {
    return h('p', { class: ['portal-notice', `is-${kind}`], role: kind === 'error' ? 'alert' : 'status', text });
}

export function facts(items) {
    return h('dl', { class: 'facts' }, items.filter(Boolean).map(([label, value]) => h('div', {}, h('dt', { text: label }), h('dd', {}, value ?? '—'))));
}

/**
 * Tabla con desplazamiento propio. `columns`: [{ label, render(row), num, tight, head }].
 * La primera columna es la cabecera de la fila, que es lo que lee un lector de pantalla.
 */
export function table({ columns, rows, emptyText = 'No hay nada que mostrar.', caption = '', onRow = null, foot = null, rowClass = null, label = '' }) {
    if (!rows.length) return h('p', { class: 'empty', text: emptyText });
    const cell = (column, row, index) => {
        const content = column.render(row);
        const classes = [column.num && 'num', column.tight && 'tight'];
        return index === 0
            ? h('th', { scope: 'row', class: classes }, content)
            : h('td', { class: classes }, content);
    };
    return h('div', { class: 'table-wrap', role: 'region', 'aria-label': label || caption || 'Tabla', tabindex: '0' },
        h('table', { class: 'data' },
            caption ? h('caption', { text: caption }) : null,
            h('thead', {}, h('tr', {}, columns.map(column => h('th', { scope: 'col', class: [column.num && 'num', column.tight && 'tight'], text: column.label })))),
            h('tbody', {}, rows.map(row => h('tr', {
                class: [onRow && 'is-link', rowClass?.(row)],
                on: onRow ? { click: event => { if (!event.target.closest('button, a, input, select, label')) onRow(row); } } : undefined
            }, columns.map((column, index) => cell(column, row, index))))),
            foot ? h('tfoot', {}, h('tr', {}, foot.map((content, index) => h(index === 0 ? 'th' : 'td', { scope: index === 0 ? 'row' : null, class: columns[index]?.num && 'num' }, content)))) : null));
}

export function tabs(items, active, onChange, label = 'Vista') {
    return h('div', { class: 'tabs', role: 'tablist', 'aria-label': label }, items.map(item => h('button', {
        type: 'button', role: 'tab', 'aria-selected': String(item.id === active), text: item.label,
        on: { click: () => { if (item.id !== active) onChange(item.id); } }
    })));
}

/** «‹ Octubre de 2026 ›»: para moverse por meses o por días. */
export function stepper({ label, onPrev, onNext, nextDisabled = false, prevLabel = 'Anterior', nextLabel = 'Siguiente' }) {
    return h('div', { class: 'stepper' },
        h('button', { type: 'button', class: 'btn is-small', 'aria-label': prevLabel, text: '‹', on: { click: onPrev } }),
        h('strong', { text: label }),
        h('button', { type: 'button', class: 'btn is-small', 'aria-label': nextLabel, text: '›', disabled: nextDisabled, on: { click: onNext } }));
}

/* ================================================================== *
 * Avisos flotantes y diálogos
 * ================================================================== */

let toastZone = null;

export function toast(message, tone = 'ok') {
    if (!toastZone) {
        toastZone = h('div', { class: 'toast-zone', role: 'status', 'aria-live': 'polite' });
        document.body.append(toastZone);
    }
    const node = h('div', { class: ['toast', tone === 'bad' && 'is-bad'], text: message });
    toastZone.append(node);
    setTimeout(() => node.remove(), tone === 'bad' ? 7000 : 4000);
}

/**
 * Un diálogo sobre `<dialog>`: el navegador pone el foco dentro, lo devuelve
 * al cerrar, cierra con Escape y oscurece el fondo. No hay que reinventarlo.
 */
export function dialog({ title, lead = '', wide = false, onClose = null }, ...body) {
    let finished = false;
    /**
     * Cerrar es UNA función, la llame quien la llame: la equis, el fondo,
     * Escape o el formulario al guardar. No se espera al evento `close`:
     * Chrome lo entrega con el siguiente cuadro de animación, y en una pestaña
     * que no se está pintando (en segundo plano, o el panel de vista previa)
     * no llega. Pasó: el cobro se registraba, el diálogo desaparecía y la
     * pantalla se quedaba esperando una respuesta que nunca venía.
     */
    const finish = () => {
        if (finished) return;
        finished = true;
        if (node.open) node.close();
        node.remove();
        onClose?.();
    };
    const content = h('div', { class: 'modal-body' }, ...body);
    const node = h('dialog', { class: ['modal', wide && 'is-wide'], 'aria-label': title },
        h('div', { class: 'modal-head' },
            h('div', {}, h('h2', { text: title }), lead ? h('p', { text: lead }) : null),
            h('button', { type: 'button', class: 'modal-close', 'aria-label': 'Cerrar', text: '×', on: { click: finish } })),
        content);
    // Escape: el navegador avisa con `cancel` antes de cerrar por su cuenta.
    node.addEventListener('cancel', event => { event.preventDefault(); finish(); });
    // Por si aun así lo cierra él (Chrome ignora el `preventDefault` si se
    // pulsa Escape varias veces seguidas): `finish` no hace nada dos veces.
    node.addEventListener('close', finish);
    // Un clic en el fondo cierra; uno dentro, no.
    node.addEventListener('mousedown', event => { if (event.target === node) finish(); });
    document.body.append(node);
    node.showModal();
    return { node, body: content, close: finish };
}

/** Pregunta antes de algo que no se deshace. Con `askReason`, exige el motivo. */
export function confirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false, askReason = false, reasonLabel = 'Motivo' }) {
    return new Promise(resolve => {
        let answer = null;
        const reason = askReason ? h('input', { type: 'text', maxlength: '200', required: true, id: 'confirm-reason' }) : null;
        const form = h('form', {
            on: {
                submit: event => {
                    event.preventDefault();
                    if (askReason && !reason.value.trim()) { reason.focus(); return; }
                    answer = { reason: reason ? reason.value.trim() : '' };
                    box.close();
                }
            }
        },
            h('p', { text: message }),
            askReason ? h('p', { class: 'field' }, h('label', { for: 'confirm-reason', text: reasonLabel }), reason) : null,
            h('div', { class: 'form-actions' },
                btn('Cancelar', { onClick: () => box.close() }),
                btn(confirmLabel, { kind: danger ? 'danger' : 'primary', type: 'submit' })));
        const box = dialog({ title, onClose: () => resolve(answer) }, form);
    });
}

/* ================================================================== *
 * Formularios
 * ================================================================== */

let fieldCounter = 0;

const PARSE_ERROR = {
    money: 'Escriba un importe, por ejemplo 1500 o 1500,50.',
    quantity: 'Escriba una cantidad, por ejemplo 24 o 12,5.',
    integer: 'Escriba un número entero.',
    date: 'Elija una fecha válida.',
    email: 'Ese correo no tiene un formato válido.'
};

/**
 * Un campo y cómo se lee. Devuelve `{ node, read(), setError(), focus(), name, api }`.
 * `read()` da `{ value }` o `{ error }`: el formulario no envía mientras haya errores.
 */
export function makeField(def) {
    const id = `f${fieldCounter += 1}`;
    const type = def.type || 'text';
    let control;
    let read;

    const required = value => (def.required && (value === '' || value === null || value === undefined) ? { error: 'Este dato hace falta.' } : null);

    if (type === 'select') {
        control = h('select', { id, name: def.name, disabled: def.disabled },
            def.options.map(option => h('option', { value: option.value, text: option.label, selected: String(option.value) === String(def.value ?? '') })));
        read = () => required(control.value) || { value: control.value };
    } else if (type === 'textarea') {
        control = h('textarea', { id, name: def.name, maxlength: def.maxlength || 2000, rows: def.rows || 3, placeholder: def.placeholder, value: def.value || '' });
        read = () => required(control.value.trim()) || { value: control.value.trim() };
    } else if (type === 'checkbox') {
        const box = h('input', { id, type: 'checkbox', name: def.name, checked: Boolean(def.value) });
        control = h('label', { class: 'check', for: id }, box, h('span', { text: def.checkLabel || def.label }));
        read = () => ({ value: box.checked });
    } else if (type === 'checks') {
        const boxes = def.options.map(option => {
            const box = h('input', { type: 'checkbox', value: option.value, checked: (def.value || []).map(String).includes(String(option.value)) });
            return { box, option, node: h('label', { class: 'check' }, box, h('span', { text: option.label })) };
        });
        control = h('div', { class: 'check-row', role: 'group', 'aria-labelledby': `${id}-label` }, boxes.map(entry => entry.node));
        read = () => {
            const value = boxes.filter(entry => entry.box.checked).map(entry => entry.option.value);
            return def.required && !value.length ? { error: 'Elija al menos una opción.' } : { value };
        };
    } else if (type === 'custom') {
        control = def.node;
        read = def.read;
    } else {
        const numeric = type === 'money' || type === 'quantity' || type === 'integer';
        const initial = type === 'money' ? moneyInput(def.value) : type === 'quantity' ? quantityInput(def.value) : (def.value ?? '');
        control = h('input', {
            id, name: def.name,
            type: type === 'date' ? 'date' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'text',
            inputmode: type === 'integer' ? 'numeric' : numeric ? 'decimal' : null,
            class: numeric && 'is-num',
            maxlength: type === 'date' ? null : (def.maxlength || 200),
            max: def.max, min: def.min,
            placeholder: def.placeholder,
            autocomplete: def.autocomplete || 'off',
            disabled: def.disabled,
            value: initial === null || initial === undefined ? '' : String(initial)
        });
        read = () => {
            const raw = control.value.trim();
            const missing = required(raw);
            if (missing) return missing;
            if (raw === '') return { value: type === 'text' || type === 'email' || type === 'tel' ? '' : null };
            if (type === 'money') {
                const value = parseMoney(raw);
                return value === null ? { error: PARSE_ERROR.money } : { value };
            }
            if (type === 'quantity') {
                const value = parseQuantity(raw);
                return value === null ? { error: PARSE_ERROR.quantity } : { value };
            }
            if (type === 'integer') {
                const value = Number(raw);
                if (!Number.isInteger(value) || (def.min !== undefined && value < def.min) || (def.max !== undefined && value > def.max)) return { error: PARSE_ERROR.integer };
                return { value };
            }
            if (type === 'date') return isDay(raw) ? { value: raw } : { error: PARSE_ERROR.date };
            if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) return { error: PARSE_ERROR.email };
            return { value: raw };
        };
    }

    const errorNode = h('p', { class: 'field-error', hidden: true, role: 'alert' });
    const labelled = type !== 'checkbox';
    const node = h('div', { class: ['field', def.wide && 'is-wide'] },
        labelled ? h(type === 'checks' || type === 'custom' ? 'span' : 'label', { for: type === 'checks' || type === 'custom' ? null : id, id: `${id}-label`, class: 'field-label', text: def.label }) : null,
        control,
        def.hint ? h('p', { class: 'field-hint', text: def.hint }) : null,
        errorNode);

    return {
        name: def.name,
        api: def.api || def.name,
        node,
        control,
        read,
        setError(message) {
            errorNode.hidden = !message;
            errorNode.textContent = message || '';
            node.classList.toggle('is-invalid', Boolean(message));
        },
        focus() { (control.matches?.('input, select, textarea') ? control : control.querySelector?.('input, select, textarea'))?.focus(); }
    };
}

/**
 * Un formulario completo. `onSubmit(values)` recibe los valores ya leídos —los
 * importes como enteros— y puede lanzar: el mensaje del servidor se enseña
 * arriba y, si nombra un campo, ese campo se marca.
 */
export function buildForm({ fields, submitLabel = 'Guardar', onSubmit, onCancel = null, danger = false, before = null, after = null, setup = null }) {
    const controls = fields.filter(Boolean).map(makeField);
    const message = h('div');
    const submit = btn(submitLabel, { kind: danger ? 'danger' : 'primary', type: 'submit' });

    const node = h('form', {
        novalidate: true,
        on: {
            submit: async event => {
                event.preventDefault();
                clear(message);
                const values = {};
                let firstInvalid = null;
                for (const field of controls) {
                    if (field.skip) { field.setError(''); continue; }
                    const result = field.read();
                    field.setError(result.error || '');
                    if (result.error) firstInvalid ??= field;
                    else values[field.name] = result.value;
                }
                if (firstInvalid) { firstInvalid.focus(); return; }
                submit.disabled = true;
                const label = submit.textContent;
                submit.textContent = 'Guardando…';
                try {
                    await onSubmit(values);
                } catch (error) {
                    message.append(notice(error.message || 'No se pudo completar la operación.', 'error'));
                    const apiField = String(error.extra?.field || '');
                    const culprit = apiField && controls.find(field => apiField === field.api || apiField.startsWith(`${field.api}.`));
                    if (culprit) { culprit.setError('Revise este dato.'); culprit.focus(); }
                } finally {
                    submit.disabled = false;
                    submit.textContent = label;
                }
            }
        }
    },
        message,
        before,
        h('div', { class: 'form-grid' }, controls.map(field => field.node)),
        after,
        h('div', { class: 'form-actions' }, onCancel ? btn('Cancelar', { onClick: onCancel }) : null, submit));

    const form = {
        node,
        controls,
        field: name => controls.find(field => field.name === name),
        /** Enseña u oculta un campo. Un campo oculto no se lee ni se valida. */
        show(name, visible) {
            const field = controls.find(candidate => candidate.name === name);
            if (!field) return;
            field.node.hidden = !visible;
            field.skip = !visible;
        }
    };
    // Para los formularios cuyos campos dependen de otro: «unidad de costo»
    // solo tiene sentido en una compra, «existencia» solo en un producto.
    setup?.(form);
    return form;
}

/**
 * Un formulario dentro de un diálogo. Resuelve con lo que devuelva `onSubmit`
 * cuando se guarda, o con null si la persona lo cierra.
 */
export function formDialog({ title, lead = '', fields, submitLabel = 'Guardar', onSubmit, wide = false, danger = false, before = null, after = null, setup = null }) {
    return new Promise(resolve => {
        let result = null;
        const form = buildForm({
            fields, submitLabel, danger, before, after, setup,
            onCancel: () => box.close(),
            onSubmit: async values => { result = (await onSubmit(values)) ?? true; box.close(); }
        });
        const box = dialog({ title, lead, wide, onClose: () => resolve(result) }, form.node);
    });
}

/* ================================================================== *
 * Gráficas
 *
 * Una serie, un color. Las marcas son finas, la rejilla es una línea de pelo
 * y los textos van en tinta de texto, nunca en el color del dato. Cada gráfica
 * tiene su tabla gemela («Ver como tabla»): ningún valor depende de pasar el
 * ratón por encima.
 * ================================================================== */

function niceCeiling(value) {
    if (value <= 0) return 1;
    const power = 10 ** Math.floor(Math.log10(value));
    const scaled = value / power;
    const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
    return step * power;
}

/**
 * Columnas en el tiempo (las ventas de cada día del mes).
 * `data`: [{ label, tick, value }]. `tick` es lo que se escribe en el eje, y
 * solo en algunas columnas; `label`, lo que dice la burbuja y la tabla.
 */
export function columnChart({ data, format, formatTick = format, title, valueLabel = 'Valor', keyLabel = 'Día' }) {
    const width = 720;
    const height = 220;
    const pad = { top: 14, right: 8, bottom: 26, left: 62 };
    const plotWidth = width - pad.left - pad.right;
    const plotHeight = height - pad.top - pad.bottom;
    const ceiling = niceCeiling(Math.max(0, ...data.map(point => point.value)));
    const band = plotWidth / Math.max(1, data.length);
    const barWidth = Math.max(3, Math.min(24, band - 3));
    const y = value => pad.top + plotHeight - (value / ceiling) * plotHeight;

    const chart = svg('svg', { viewBox: `0 0 ${width} ${height}`, class: 'chart', role: 'img', 'aria-label': title });
    for (let step = 0; step <= 4; step += 1) {
        const value = (ceiling * step) / 4;
        chart.append(
            svg('line', { class: 'grid-line', x1: pad.left, x2: width - pad.right, y1: y(value), y2: y(value) }),
            svg('text', { class: 'axis-text', x: pad.left - 8, y: y(value) + 4, 'text-anchor': 'end', text: formatTick(value) }));
    }

    const tip = h('div', { class: 'chart-tip', hidden: true, 'aria-hidden': 'true' });
    const live = h('p', { class: 'skip', 'aria-live': 'polite' });
    const slots = [];
    let active = -1;

    const show = index => {
        const point = data[index];
        if (!point) return;
        active = index;
        clear(tip).append(h('strong', { text: format(point.value) }), point.label);
        tip.hidden = false;
        tip.style.setProperty('left', `${((pad.left + band * index + band / 2) / width) * 100}%`);
        tip.style.setProperty('top', `${((y(point.value) - 6) / height) * 100}%`);
        slots.forEach((slot, position) => slot.classList.toggle('is-active', position === index));
    };
    const hide = () => { tip.hidden = true; active = -1; slots.forEach(slot => slot.classList.remove('is-active')); };

    data.forEach((point, index) => {
        const x = pad.left + band * index + (band - barWidth) / 2;
        const top = y(point.value);
        const tall = pad.top + plotHeight - top;
        const radius = Math.min(4, barWidth / 2, tall);
        // Extremo del dato redondeado; la base, recta sobre la línea de cero.
        const path = tall <= 0 ? '' : `M${x},${pad.top + plotHeight} V${top + radius} Q${x},${top} ${x + radius},${top} H${x + barWidth - radius} Q${x + barWidth},${top} ${x + barWidth},${top + radius} V${pad.top + plotHeight} Z`;
        const slot = svg('g', { class: 'bar-slot' },
            // La zona sensible es la columna entera, no los píxeles pintados.
            svg('rect', { class: 'bar-hit', x: pad.left + band * index, y: pad.top, width: band, height: plotHeight }),
            path ? svg('path', { class: 'bar', d: path }) : null);
        slot.addEventListener('pointerenter', () => show(index));
        slots.push(slot);
        chart.append(slot);
        if (point.tick) chart.append(svg('text', { class: 'axis-text', x: pad.left + band * index + band / 2, y: height - 8, 'text-anchor': 'middle', text: point.tick }));
    });

    // Con el teclado: se entra a la gráfica una vez y se recorre con las flechas.
    const plot = h('div', {
        class: 'chart-figure', tabindex: '0', role: 'group',
        'aria-label': `${title}. Use las flechas para recorrer los valores.`,
        on: {
            pointerleave: hide,
            blur: hide,
            keydown: event => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(event.key)) return;
                event.preventDefault();
                if (event.key === 'Escape') { hide(); return; }
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? data.length - 1
                    : Math.min(data.length - 1, Math.max(0, (active < 0 ? data.length - 1 : active) + (event.key === 'ArrowRight' ? 1 : -1)));
                show(next);
                live.textContent = `${data[next].label}: ${format(data[next].value)}`;
            }
        }
    }, chart, tip);

    return h('div', {}, plot, live,
        h('details', { class: 'chart-table' },
            h('summary', { text: 'Ver como tabla' }),
            table({
                label: title,
                columns: [{ label: keyLabel, render: point => point.label }, { label: valueLabel, num: true, render: point => format(point.value) }],
                rows: data
            })));
}

/**
 * Lista de barras: un nombre, una barra y una cifra por fila. La cifra va
 * escrita en cada fila, así que no hace falta burbuja ni tabla aparte.
 * `rows`: [{ name, sub, value, figure, small, tone }].
 */
export function barList(rows, { emptyText = 'Todavía no hay datos.' } = {}) {
    if (!rows.length) return h('p', { class: 'empty', text: emptyText });
    const max = Math.max(1, ...rows.map(row => Math.abs(row.value)));
    return h('ol', { class: 'bar-list' }, rows.map(row => h('li', { class: ['bar-row', row.tone && `is-${row.tone}`] },
        h('span', { class: 'bar-name', title: row.name }, row.name, row.sub ? h('span', { class: 'sub', text: row.sub }) : null),
        h('span', { class: 'bar-track', 'aria-hidden': 'true' }, h('span', { class: 'bar-fill', style: { '--w': `${Math.max(row.value ? 2 : 0, (Math.abs(row.value) / max) * 100).toFixed(1)}%` } })),
        h('span', { class: 'bar-figure' }, row.figure, row.small ? h('small', { text: row.small }) : null))));
}

/**
 * Un total partido en tramos ordenados (la antigüedad de la cartera). La barra
 * es fina y no lleva texto: los nombres y los importes van en la lista de
 * debajo, cada uno con su muestra de color.
 */
export function segmentBar(parts, format) {
    const total = parts.reduce((sum, part) => sum + part.amount, 0);
    if (!total) return h('p', { class: 'empty', text: 'No hay saldos pendientes.' });
    return h('div', {},
        h('div', { class: 'seg-bar', 'aria-hidden': 'true' }, parts.filter(part => part.amount > 0).map(part => h('span', { class: ['seg', `is-${part.id}`], style: { '--w': part.amount } }))),
        h('ul', { class: 'seg-legend' }, parts.map(part => h('li', {},
            h('span', { class: ['swatch', `is-${part.id}`], 'aria-hidden': 'true' }),
            part.label,
            h('span', { class: 'amount', text: format(part.amount) })))));
}

/** Un valor contra su límite. La pista es un paso claro del mismo tono que el relleno. */
export function meter({ value, max, label, figure, tone = '' }) {
    const share = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
    return h('div', { class: ['meter', tone && `is-${tone}`] },
        h('div', { class: 'meter-label' }, h('span', { text: label }), h('strong', { text: figure })),
        h('div', { class: 'meter-track', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(max), 'aria-valuenow': String(value), 'aria-label': label },
            h('span', { class: 'meter-fill', style: { '--w': `${share.toFixed(1)}%` } })));
}
