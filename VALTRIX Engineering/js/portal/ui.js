/**
 * Construcción del DOM y formato. Sin dependencias y sin compilación: el
 * portal son módulos ES que el navegador carga tal cual, como Elysium
 * Patrimonio.
 *
 * `h()` crea nodos, nunca cadenas de HTML. Es deliberado: aquí se pintan
 * nombres de negocios, de personas y notas que escribe gente, y con
 * `innerHTML` cualquiera de esos textos podría traer etiquetas. Un nodo de
 * texto no ejecuta nada.
 */

export function h(tag, attributes = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
        if (value === null || value === undefined || value === false) continue;
        if (key === 'class') {
            const list = Array.isArray(value) ? value.filter(Boolean) : [value];
            if (list.length) node.className = list.join(' ');
        } else if (key === 'text') {
            node.textContent = String(value);
        } else if (key === 'on') {
            for (const [event, handler] of Object.entries(value)) node.addEventListener(event, handler);
        } else if (key === 'dataset') {
            Object.assign(node.dataset, value);
        } else if (value === true) {
            node.setAttribute(key, '');
        } else {
            node.setAttribute(key, String(value));
        }
    }
    append(node, children);
    return node;
}

function append(node, children) {
    for (const child of children) {
        if (child === null || child === undefined || child === false) continue;
        if (Array.isArray(child)) append(node, child);
        else node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
}

export function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
}

/** Iniciales para el avatar: «Taller Horizonte» → «TH». */
export function initials(name) {
    return String(name || '?')
        .split(/\s+/).filter(Boolean).slice(0, 2)
        .map(word => word[0].toUpperCase()).join('') || '?';
}

const CURRENCY_LABEL = { CRC: '₡', USD: 'US$', EUR: '€' };

/**
 * Dinero. Recibe SIEMPRE enteros de la unidad menor y su moneda, como los
 * guarda el API: formatear a partir de un decimal sería aceptar que en algún
 * punto el importe dejó de ser exacto.
 */
export function money(minor, currency = 'CRC') {
    if (!Number.isInteger(minor)) return '—';
    const symbol = CURRENCY_LABEL[currency] || currency;
    const value = Math.abs(minor) / 100;
    // El colón no se escribe con céntimos; el dólar y el euro, sí.
    const digits = currency === 'CRC' ? 0 : 2;
    const text = value.toLocaleString('es-CR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    return `${minor < 0 ? '−' : ''}${symbol}${text}`;
}

export function date(value) {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime())
        ? parsed.toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })
        : '—';
}

export const loading = (label = 'Cargando…') => h('p', { class: 'portal-loading', role: 'status', text: label });

export const empty = (label) => h('p', { class: 'portal-empty', text: label });

export function notice(text, kind = 'info') {
    return h('p', { class: ['portal-notice', `is-${kind}`], role: kind === 'error' ? 'alert' : 'status', text });
}

/** El estado de una suscripción, dicho como lo diría una persona. */
export const SUBSCRIPTION_LABEL = {
    pending_activation: 'Pendiente de activación',
    active: 'Activa',
    past_due: 'Pago vencido',
    suspended: 'Suspendida',
    cancel_at_period_end: 'Termina al cerrar el período',
    canceled: 'Cancelada'
};

export const TENANT_ROLE_LABEL = {
    owner: 'Propietario',
    operations: 'Operaciones',
    collections: 'Cobros',
    staff: 'Colaborador',
    viewer: 'Consulta'
};

export const MODULE_LABEL = {
    erp: 'Control financiero',
    qms: 'Orden operativo',
    audit: 'Auditoría mensual'
};

/** Qué falta para que un módulo se abra, dicho sin tecnicismos. */
export function moduleHint(module, paidPeriods) {
    const needed = { erp: 1, qms: 2, audit: 3 }[module];
    const missing = needed - (paidPeriods || 0);
    if (missing <= 0) return 'Disponible';
    return missing === 1 ? 'Se activa con el siguiente pago' : `Se activa tras ${missing} pagos más`;
}
