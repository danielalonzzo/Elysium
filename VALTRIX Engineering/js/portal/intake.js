/**
 * El formulario de incorporación: lo que el dueño llena antes de tener cuenta.
 *
 * Se entra con el enlace que manda VALTRIX (`/incorporacion#<token>`). El
 * token va en el fragmento, que el navegador no envía en ninguna dirección, y
 * esta página se lo pasa al API en una cabecera. Nadie inicia sesión: el
 * dueño todavía no tiene acceso, se le entrega después, en la videollamada.
 *
 * Tres cosas pensadas para quien lo llena:
 *
 *   · **Se guarda solo.** Un segundo después de dejar de escribir, y al
 *     cambiar de sección o de pestaña. Se puede cerrar y volver con el mismo
 *     enlace: lo escrito está ahí, tal como se escribió.
 *
 *   · **Se puede pegar desde Excel.** Cada tabla acepta filas copiadas de una
 *     hoja de cálculo, en el orden de sus columnas.
 *
 *   · **Antes de enviar, el sistema dice qué no entendió.** La revisión usa la
 *     misma lectura que usará VALTRIX al cargarlo (`core/intake.js`), así que
 *     lo que aquí sale bien, allá sale igual.
 */

import { INTAKE_LIMITS, SECTORS, TENANT_ROLE_LABEL, UNITS } from '../core/catalog.js';
import { messageFor } from '../core/errors.js';
import { accessOf, frequencyOf, normalize, parseTable } from '../core/intake.js';
import { append, btn, clear, confirmDialog, h, notice, panel } from './ui.js';

const root = document.getElementById('contenido');
const token = decodeURIComponent(location.hash.slice(1));

/* ------------------------------------------------------------------ *
 * Las tablas del formulario
 * ------------------------------------------------------------------ */

const isService = value => /^(s|servicio|service|mano)/i.test(String(value).trim());

const SHEETS = {
    products: {
        label: 'Productos y servicios',
        lead: 'Lo que vende, con lo que le cuesta y a cuánto lo vende. Un servicio, como la mano de obra, puede ir sin costo y sin existencias.',
        add: 'Agregar producto',
        columns: [
            { key: 'code', label: 'Código', placeholder: 'FIL-001', width: '7rem' },
            { key: 'name', label: 'Nombre', placeholder: 'Filtro de aceite', width: '14rem' },
            { key: 'kind', label: 'Tipo', width: '7.5rem', options: [['Producto', 'Producto'], ['Servicio', 'Servicio']], fallback: 'Producto', paste: value => (isService(value) ? 'Servicio' : 'Producto') },
            { key: 'unit', label: 'Se vende por', list: 'intake-units', placeholder: 'unidad', width: '7rem' },
            { key: 'cost', label: 'Le cuesta', placeholder: '₡3 400', numeric: true },
            { key: 'price', label: 'Lo vende a', placeholder: '₡5 000', numeric: true },
            { key: 'stock', label: 'Hay hoy', placeholder: '24', numeric: true },
            { key: 'min', label: 'Mínimo', placeholder: '5', numeric: true }
        ]
    },
    debtors: {
        label: 'Quién le debe',
        lead: 'Los clientes que hoy le deben algo. Si alguien debe varias facturas, ponga una fila por cada una: el sistema lo junta en un solo cliente.',
        add: 'Agregar deuda',
        columns: [
            { key: 'name', label: 'Cliente', placeholder: 'Transportes Solís', width: '13rem' },
            { key: 'phone', label: 'Teléfono', placeholder: '8888-0000', width: '8rem' },
            { key: 'amount', label: 'Cuánto debe', placeholder: '₡240 000', numeric: true },
            { key: 'since', label: 'Desde', placeholder: '20/09/2026', width: '7.5rem' },
            { key: 'due', label: 'Vencía', placeholder: '05/10/2026', width: '7.5rem' },
            { key: 'note', label: 'Nota', placeholder: 'Factura 1234', width: '10rem' }
        ]
    },
    team: {
        label: 'Su equipo',
        lead: 'Las personas que trabajan con usted. Para entrar al sistema cada una necesita su correo; quien no lo tenga puede quedar «Sin acceso».',
        add: 'Agregar persona',
        columns: [
            { key: 'name', label: 'Nombre', placeholder: 'Luis Vega', width: '12rem' },
            { key: 'position', label: 'Puesto', placeholder: 'Mecánico', width: '9rem' },
            { key: 'email', label: 'Correo', placeholder: 'luis@correo.com', width: '13rem', type: 'email' },
            {
                key: 'access', label: 'Qué hace en el sistema', width: '14rem', fallback: 'staff', paste: accessOf,
                options: [
                    ['staff', `${TENANT_ROLE_LABEL.staff}: sus tareas`],
                    ['operations', `${TENANT_ROLE_LABEL.operations}: bodega y ventas`],
                    ['collections', `${TENANT_ROLE_LABEL.collections}: clientes y cobros`],
                    ['viewer', `${TENANT_ROLE_LABEL.viewer}: solo mira`],
                    ['none', 'Sin acceso']
                ]
            }
        ]
    },
    processes: {
        label: 'Procesos',
        lead: 'Lo que se hace todos los días y que hoy depende de que alguien se acuerde: abrir, cerrar caja, recibir mercadería. Escriba un paso por línea.',
        add: 'Agregar proceso',
        columns: [
            { key: 'name', label: 'Proceso', placeholder: 'Apertura del local', width: '11rem' },
            { key: 'area', label: 'Área', placeholder: 'Caja', width: '7rem' },
            {
                key: 'frequency', label: 'Cada cuánto', width: '10rem', fallback: 'daily', paste: frequencyOf,
                options: [['daily', 'Todos los días'], ['weekly', 'Cada semana'], ['monthly', 'Cada mes'], ['on_demand', 'Cuando haga falta']]
            },
            { key: 'responsible', label: 'Quién lo hace', placeholder: 'Marta', width: '8rem' },
            { key: 'steps', label: 'Pasos, uno por línea', multiline: true, placeholder: 'Encender las luces\nContar la caja\nAbrir la puerta', width: '16rem' }
        ]
    },
    equipment: {
        label: 'Equipos y máquinas',
        lead: 'Lo que se le daña y le para el negocio: hornos, compresores, elevadores, refrigeradoras. Con cada cuánto se le da mantenimiento, el sistema le avisa.',
        add: 'Agregar equipo',
        columns: [
            { key: 'name', label: 'Equipo', placeholder: 'Compresor de aire', width: '13rem' },
            { key: 'location', label: 'Dónde está', placeholder: 'Bodega', width: '9rem' },
            { key: 'everyDays', label: 'Mantenimiento cada (días)', placeholder: '90', numeric: true },
            { key: 'lastOn', label: 'Último mantenimiento', placeholder: '23/08/2026', width: '8rem' }
        ]
    }
};

const STEPS = [
    { id: 'negocio', label: 'Su negocio' },
    ...Object.entries(SHEETS).map(([id, sheet]) => ({ id, label: sheet.label })),
    { id: 'revisar', label: 'Revisar y enviar' }
];

const emptyRow = sheet => Object.fromEntries(sheet.columns.map(column => [column.key, column.fallback || '']));
const filled = (sheet, row) => sheet.columns.some(column => !column.fallback && String(row[column.key] ?? '').trim());

/** Cuenta las filas con datos de una sección y pone la cifra en su paso. */
function refreshCount(section) {
    const sheet = SHEETS[section];
    const count = state.data[section].filter(row => filled(sheet, row)).length;
    const button = root.querySelector(`.intake-steps [data-step="${section}"]`);
    if (button) {
        let badge = button.querySelector('.count');
        if (!count) badge?.remove();
        else {
            if (!badge) { badge = h('span', { class: 'count' }); button.append(badge); }
            badge.textContent = String(count);
        }
    }
    return count;
}

/* ------------------------------------------------------------------ *
 * El API
 * ------------------------------------------------------------------ */

class IntakeError extends Error {
    constructor(message, code) { super(message); this.code = code; }
}

async function call(path, { method = 'GET', body } = {}) {
    let response;
    try {
        response = await fetch(`/api${path}`, {
            method,
            credentials: 'omit',
            headers: { 'x-intake-token': token, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
            body: body === undefined ? undefined : JSON.stringify(body)
        });
    } catch {
        throw new IntakeError('No hay conexión. Lo escrito sigue en esta pestaña: se guardará cuando vuelva la red.', 'NETWORK');
    }
    let data = {};
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) throw new IntakeError(data.error || messageFor(data.code), data.code || 'UNKNOWN');
    return data;
}

/* ------------------------------------------------------------------ *
 * Estado y guardado
 * ------------------------------------------------------------------ */

const state = { business: '', status: null, data: null, savedAt: null, reopened: false, step: 'negocio' };
const statusLine = h('p', { class: 'save-status', role: 'status', 'aria-live': 'polite' });

let timer = null;
let saving = null;
let dirty = false;

const time = iso => new Date(iso).toLocaleTimeString('es-CR', { hour: 'numeric', minute: '2-digit' });

function setStatus(text, error = false) {
    statusLine.textContent = text;
    statusLine.classList.toggle('is-error', error);
}

function schedule() {
    dirty = true;
    setStatus('Cambios sin guardar…');
    clearTimeout(timer);
    timer = setTimeout(save, 1200);
}

async function save() {
    clearTimeout(timer);
    if (saving) await saving;
    if (!dirty || state.status !== 'draft') return;
    dirty = false;
    setStatus('Guardando…');
    saving = call('/intake', { method: 'PUT', body: { data: state.data } })
        // Sin punto final: la hora ya termina en «a. m.» o «p. m.».
        .then(result => { state.savedAt = result.savedAt; setStatus(`Guardado a las ${time(result.savedAt)}`); })
        .catch(error => {
            dirty = true;
            setStatus(`No se pudo guardar: ${error.message}`, true);
            // Si el formulario ya no admite cambios (lo enviaron desde otra
            // pestaña, o venció el enlace), se vuelve a pedir su estado.
            if (error.code === 'INTAKE_LOCKED' || error.code === 'INTAKE_NOT_FOUND') load();
            else timer = setTimeout(save, 8000);
        })
        .finally(() => { saving = null; });
    return saving;
}

window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
window.addEventListener('beforeunload', event => {
    if (!dirty && !saving) return;
    save();
    event.preventDefault();
});

/* ------------------------------------------------------------------ *
 * Pantallas
 * ------------------------------------------------------------------ */

function gate(eyebrow, title, ...body) {
    return h('div', { class: 'portal-gate' }, h('div', { class: 'card portal-card' },
        h('p', { class: 'eyebrow', text: eyebrow }),
        h('h1', { class: 'portal-gate-title', text: title }),
        ...body));
}

async function load() {
    clear(root).append(h('p', { class: 'portal-loading', role: 'status', text: 'Abriendo el formulario…' }));
    if (!/^[A-Za-z0-9_-]{24,80}$/.test(token)) {
        clear(root).append(gate('Incorporación', 'Este enlace no está completo',
            h('p', { text: 'Ábralo tal como le llegó, sin cortarlo. Si sigue sin funcionar, pida uno nuevo a VALTRIX.' })));
        return;
    }
    try {
        const result = await call('/intake');
        Object.assign(state, { business: result.business, status: result.status, data: result.data, savedAt: result.savedAt, reopened: Boolean(result.reopened) });
    } catch (error) {
        clear(root).append(gate('Incorporación', error.code === 'INTAKE_NOT_FOUND' ? 'Este enlace ya no sirve' : 'No se pudo abrir el formulario',
            h('p', { text: error.message })));
        return;
    }
    document.title = `Incorporación de ${state.business} | VALTRIX`;
    // «applying» es el instante en que VALTRIX lo está cargando: para el dueño, ya está recibido.
    if (state.status === 'submitted' || state.status === 'applying') { clear(root).append(receivedScreen()); return; }
    if (state.status === 'applied') { clear(root).append(appliedScreen()); return; }
    for (const [section, sheet] of Object.entries(SHEETS)) {
        state.data[section] = (state.data[section] || []).map(row => ({ ...emptyRow(sheet), ...row, ...Object.fromEntries(sheet.columns.filter(column => column.fallback && !row[column.key]).map(column => [column.key, column.fallback])) }));
    }
    setStatus(state.savedAt ? `Guardado a las ${time(state.savedAt)}` : 'Se guarda solo mientras escribe.');
    render();
}

function receivedScreen() {
    return gate('Incorporación', '¡Recibido!',
        h('p', {}, 'Gracias. VALTRIX revisará lo que envió de ', h('strong', { text: state.business }), ' y preparará su sistema con esos datos.'),
        h('p', { text: 'Le escribiremos para la videollamada de 30 minutos en la que se le entrega el acceso y se le explica cómo usarlo.' }),
        h('p', { class: 'portal-help', text: 'Si necesita corregir algo de lo que envió, escríbale a VALTRIX: se lo devolvemos para que lo cambie con este mismo enlace.' }));
}

function appliedScreen() {
    return gate('Incorporación', 'Su sistema ya está listo',
        h('p', {}, 'Los datos de ', h('strong', { text: state.business }), ' ya están cargados.'),
        h('p', { text: 'Entre a su cuenta con su correo. Si es la primera vez, pulse «¿Olvidó su contraseña o es la primera vez que entra?» y le llegará un enlace para definirla.' }),
        h('p', {}, btn('Ir a mi cuenta', { kind: 'primary', href: 'cuenta' })));
}

function render() {
    const counts = Object.fromEntries(Object.entries(SHEETS).map(([id, sheet]) => [id, state.data[id].filter(row => filled(sheet, row)).length]));
    const current = STEPS.find(step => step.id === state.step);
    const heading = h('h2', { tabindex: '-1', text: current.label });

    // `append` de ui.js, no el nativo: el nativo escribe «null» como texto.
    append(clear(root), [
        h('header', { class: 'page-head' },
            h('div', {},
                h('p', { class: 'eyebrow', text: 'Incorporación' }),
                h('h1', { text: state.business }),
                h('p', { class: 'lead', text: 'Con esto VALTRIX prepara su sistema. Lo que escribe se guarda solo: puede cerrar esta página y volver con el mismo enlace. No hace falta llenarlo todo de una vez.' })),
            statusLine),
        state.reopened ? notice('VALTRIX le devolvió el formulario para que corrija algo. Revise lo que le pidieron y vuelva a enviarlo.', 'warn') : null,
        h('nav', { 'aria-label': 'Secciones del formulario' },
            h('ol', { class: 'intake-steps' }, STEPS.map(step => h('li', {}, h('button', {
                type: 'button', 'aria-current': step.id === state.step ? 'step' : null, dataset: { step: step.id },
                on: { click: () => go(step.id) }
            }, step.label, counts[step.id] ? h('span', { class: 'count', text: String(counts[step.id]) }) : null))))),
        panel({}, heading, sectionBody(state.step, counts)),
        footerNav()]);
    return heading;
}

function go(step) {
    save();
    state.step = step;
    const heading = render();
    heading.focus({ preventScroll: true });
    root.scrollIntoView({ block: 'start' });
}

function footerNav() {
    const index = STEPS.findIndex(step => step.id === state.step);
    const previous = STEPS[index - 1];
    const next = STEPS[index + 1];
    return h('div', { class: 'form-actions' },
        previous ? btn(`← ${previous.label}`, { onClick: () => go(previous.id) }) : null,
        next ? btn(`${next.label} →`, { kind: 'primary', onClick: () => go(next.id) }) : null);
}

function sectionBody(step, counts) {
    if (step === 'negocio') return businessSection();
    if (step === 'revisar') return reviewSection();
    return sheetSection(step, counts[step]);
}

/* ---------- Su negocio ---------- */

function businessSection() {
    const business = state.data.business;
    const bind = key => ({ input: event => { business[key] = event.target.value; schedule(); }, change: event => { business[key] = event.target.value; schedule(); } });
    const field = (id, label, control, wide = false) => h('div', { class: ['field', wide && 'is-wide'] }, h('label', { for: id, text: label }), control);
    return h('div', { class: 'form-grid' },
        field('n-nombre', 'Nombre del negocio', h('input', { id: 'n-nombre', type: 'text', maxlength: '80', value: business.name, on: bind('name') })),
        field('n-giro', 'A qué se dedica', h('select', { id: 'n-giro', on: bind('sector') },
            Object.entries(SECTORS).map(([value, label]) => h('option', { value, text: label, selected: value === business.sector })))),
        field('n-contacto', 'Su nombre', h('input', { id: 'n-contacto', type: 'text', maxlength: '80', autocomplete: 'name', value: business.contactName, on: bind('contactName') })),
        field('n-telefono', 'Su teléfono', h('input', { id: 'n-telefono', type: 'tel', maxlength: '40', autocomplete: 'tel', value: business.phone, on: bind('phone') })),
        field('n-notas', 'Algo que VALTRIX deba saber', h('textarea', { id: 'n-notas', maxlength: '1000', rows: '4', placeholder: 'Por ejemplo: qué le preocupa más, o cómo lleva hoy las cuentas.', value: business.notes, on: bind('notes') }), true));
}

/* ---------- Una tabla ---------- */

function sheetSection(section, count) {
    const sheet = SHEETS[section];
    const rows = state.data[section];
    const limit = INTAKE_LIMITS[section];
    const body = h('tbody');
    const counter = h('span', { class: 'muted small' });
    const addButton = btn(sheet.add, { onClick: () => addRow() });
    // El contador de la sección, aquí y en la barra de pasos, al momento.
    const recount = () => {
        counter.textContent = `${refreshCount(section)} de ${limit} como máximo.`;
        addButton.disabled = rows.length >= limit;
    };

    const cell = (row, column, number) => {
        const label = `${column.label}, fila ${number}`;
        const update = event => { row[column.key] = event.target.value; schedule(); recount(); };
        // El ejemplo («₡3 400», «24») solo en una fila vacía: en una fila con
        // datos, un ejemplo en gris se lee como si fuera el valor de ese producto.
        const example = filled(sheet, row) ? null : column.placeholder;
        if (column.options) {
            return h('select', { 'aria-label': label, on: { change: update } },
                column.options.map(([value, text]) => h('option', { value, text, selected: value === (row[column.key] || column.fallback) })));
        }
        if (column.multiline) return h('textarea', { 'aria-label': label, rows: '3', maxlength: '3000', placeholder: example, value: row[column.key] || '', on: { input: update } });
        return h('input', {
            type: column.type || 'text', 'aria-label': label, list: column.list, maxlength: '160',
            inputmode: column.numeric ? 'decimal' : null, class: column.numeric && 'is-num',
            placeholder: example, value: row[column.key] || '', on: { input: update }
        });
    };

    const paint = () => {
        // `append` de ui.js: el nativo convierte un arreglo en texto.
        append(clear(body), rows.map((row, index) => h('tr', {},
            h('td', { class: 'tight muted small', text: String(index + 1) }),
            sheet.columns.map(column => h('td', { style: column.width ? { 'min-width': column.width } : null }, cell(row, column, index + 1))),
            h('td', { class: 'tight' }, h('button', {
                type: 'button', class: 'icon-btn', text: '×', 'aria-label': `Quitar la fila ${index + 1}`,
                on: { click: () => { rows.splice(index, 1); schedule(); paint(); } }
            })))));
        recount();
    };

    const addRow = () => {
        if (rows.length >= limit) return;
        rows.push(emptyRow(sheet));
        schedule();
        paint();
        body.lastElementChild?.querySelector('input, select, textarea')?.focus();
    };

    // Una tabla vacía invita a escribir: se abre con una fila lista.
    if (!rows.length) rows.push(emptyRow(sheet));
    paint();

    const pasteBox = h('textarea', { rows: '5', 'aria-label': 'Filas copiadas de una hoja de cálculo', placeholder: sheet.columns.map(column => column.label).join('\t') });
    const pasteMessage = h('div');
    const paste = () => {
        clear(pasteMessage);
        const parsed = parseTable(pasteBox.value, { columns: sheet.columns.length });
        if (!parsed.length) { pasteMessage.append(notice('No encontramos filas en lo que pegó.', 'warn')); return; }
        // Las filas vacías que hubiera se reemplazan; las que tienen datos, se conservan.
        for (let index = rows.length - 1; index >= 0; index -= 1) if (!filled(sheet, rows[index])) rows.splice(index, 1);
        let added = 0;
        for (const cells of parsed) {
            if (rows.length >= limit) break;
            const row = emptyRow(sheet);
            sheet.columns.forEach((column, index) => {
                const value = String(cells[index] ?? '').trim();
                row[column.key] = column.paste ? column.paste(value) : value;
            });
            if (!filled(sheet, row)) continue;
            rows.push(row);
            added += 1;
        }
        pasteBox.value = '';
        schedule();
        paint();
        pasteMessage.append(notice(`${added} ${added === 1 ? 'fila agregada' : 'filas agregadas'}.${parsed.length > added ? ` ${parsed.length - added} no entraron: la tabla admite ${limit}.` : ''} Revíselas abajo.`, 'ok'));
    };

    return h('div', { class: 'stack' },
        h('p', { class: 'muted', text: sheet.lead }),
        h('div', { class: 'table-wrap', role: 'region', 'aria-label': sheet.label, tabindex: '0' },
            h('table', { class: 'sheet' },
                h('thead', {}, h('tr', {}, h('th', { scope: 'col', class: 'tight', text: '#' }), sheet.columns.map(column => h('th', { scope: 'col', text: column.label })), h('th', { scope: 'col', class: 'tight' }, h('span', { class: 'skip', text: 'Quitar' })))),
                body)),
        h('div', { class: 'panel-actions' }, addButton, counter),
        h('details', { class: 'paste-box' },
            h('summary', { text: '¿Lo tiene en Excel? Péguelo aquí' }),
            h('p', { class: 'muted small', text: `Copie las filas de su hoja de cálculo, en este orden de columnas: ${sheet.columns.map(column => column.label).join(', ')}. Si copia también la fila de los títulos, el sistema la reconoce y la salta.` }),
            pasteBox,
            h('p', {}, btn('Agregar estas filas', { kind: 'primary', onClick: paste })),
            pasteMessage));
}

/* ---------- Revisar y enviar ---------- */

const SECTION_NAME = { products: 'Productos', debtors: 'Quién le debe', team: 'Su equipo', processes: 'Procesos', equipment: 'Equipos' };

function reviewSection() {
    const { counts, issues } = normalize(state.data);
    const ready = counts.products > 0;

    const submit = async () => {
        const answer = await confirmDialog({
            title: 'Enviar a VALTRIX',
            message: 'Después de enviarlo ya no podrá cambiarlo desde aquí. Si luego necesita corregir algo, escríbale a VALTRIX y se lo devolvemos.',
            confirmLabel: 'Enviar'
        });
        if (!answer) return;
        clearTimeout(timer);
        if (saving) await saving;
        try {
            await call('/intake/submit', { method: 'POST', body: { data: state.data } });
            dirty = false;
            state.status = 'submitted';
            clear(root).append(receivedScreen());
            root.focus();
        } catch (error) {
            setStatus(error.message, true);
            if (error.code === 'INTAKE_LOCKED') load();
        }
    };

    return h('div', { class: 'stack' },
        h('p', { class: 'muted', text: 'Esto es lo que VALTRIX recibirá. Lo que el sistema no entendió aparece abajo: corríjalo si puede, o déjelo y lo revisamos juntos.' }),
        h('ul', { class: 'rows' }, Object.entries(SECTION_NAME).map(([section, label]) => h('li', {},
            h('span', {}, h('button', { type: 'button', class: 'portal-link', text: label, on: { click: () => go(section) } })),
            h('span', { class: 'figure', text: String(counts[section]) })))),
        issues.length
            ? h('div', {},
                h('h3', { text: `${issues.length} ${issues.length === 1 ? 'cosa que revisar' : 'cosas que revisar'}` }),
                h('ul', { class: 'issues' }, issues.slice(0, 60).map(issue => h('li', {},
                    h('button', { type: 'button', class: 'portal-link', text: `${SECTION_NAME[issue.section]}, fila ${issue.row}`, on: { click: () => go(issue.section) } }),
                    `: ${issue.message}`))))
            : notice('El sistema entendió todo lo que escribió.', 'ok'),
        ready ? null : notice('Agregue al menos un producto o servicio antes de enviar: es lo mínimo para preparar su sistema.', 'warn'),
        h('p', {}, btn('Enviar a VALTRIX', { kind: 'primary', onClick: submit, disabled: !ready })));
}

/* ------------------------------------------------------------------ *
 * Arranque
 * ------------------------------------------------------------------ */

document.body.append(h('datalist', { id: 'intake-units' }, UNITS.map(unit => h('option', { value: unit }))));
load();
