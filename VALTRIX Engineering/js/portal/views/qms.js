/**
 * Orden operativo: el día, las listas de tareas y los equipos.
 *
 * «Mi día» es lo que ve un colaborador: las listas que le tocan hoy, paso a
 * paso, para marcar. «Listas de tareas» es donde quien administra las escribe
 * y las publica. «Equipos» es el calendario de mantenimiento.
 *
 * Al marcar un paso no se repinta la pantalla entera: se cambia esa tarjeta y
 * el foco vuelve a la casilla que se tocó. Quien marca cuatro pasos seguidos
 * con el teclado no tiene por qué volver a buscarlos cada vez.
 */

import { FREQUENCIES, FREQUENCY_LABEL, MAINTENANCE_TYPES, MAINTENANCE_TYPE_LABEL, PROCESS_STATUS_LABEL } from '../../core/catalog.js';
import { addDays, businessDay, dayLabel, relativeDays, weekdayLabel } from '../../core/time.js';
import { get, patch, post } from '../api.js';
import { badge, btn, capitalize, clear, day, dialog, formDialog, h, kpis, meter, moment, money, notice, pageHead, panel, stepper, table, tabs, toast } from '../ui.js';

export const views = { dia, listas, equipos };

const WEEKDAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7].map(number => ({ value: number, label: capitalize(weekdayLabel(number)).slice(0, 3) }));

/** «Lunes a sábado», «Lunes, miércoles y viernes», «El día 15». */
function whenLabel(process) {
    if (process.frequency === 'on_demand') return FREQUENCY_LABEL.on_demand;
    if (process.frequency === 'monthly') return `Cada mes, el día ${process.monthDay || 1}`;
    const days = process.weekdays || [];
    if (days.length === 7) return 'Todos los días';
    if (days.join() === '1,2,3,4,5,6') return 'De lunes a sábado';
    if (days.join() === '1,2,3,4,5') return 'De lunes a viernes';
    const names = days.map(number => weekdayLabel(number));
    return capitalize(names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names.at(-1)}` : `Los ${names[0] || '—'}`);
}

/* ================================================================== *
 * Mi día
 * ================================================================== */

async function dia(ctx) {
    const { base } = ctx;
    const today = businessDay(new Date(), ctx.tenant.timezone);
    const wanted = ctx.query.get('fecha');
    const date = wanted && /^\d{4}-\d{2}-\d{2}$/.test(wanted) && wanted <= today ? wanted : today;
    const canSeeAll = ctx.can('process.manage') || ctx.can('report.read');
    const all = canSeeAll && ctx.query.get('ver') === 'todo';
    const plan = await get(`${base}/tasks?date=${date}${all ? '&all=1' : ''}`);
    const marks = plan.editable && ctx.can('process.run');

    const params = (nextDate, nextAll) => {
        const query = {};
        if (nextDate !== today) query.fecha = nextDate;
        if (nextAll) query.ver = 'todo';
        return Object.keys(query).length ? query : null;
    };

    const progressHost = h('div');
    const items = new Map([...plan.items, ...plan.onDemand].map(item => [item.processId, item]));

    const paintProgress = () => {
        const counted = [...items.values()].filter(item => !item.onDemand || item.status !== 'pending');
        const steps = counted.reduce((sum, item) => sum + item.total, 0);
        const done = counted.reduce((sum, item) => sum + item.done, 0);
        const complete = counted.filter(item => item.status === 'done').length;
        clear(progressHost);
        if (!counted.length) return;
        progressHost.append(panel({},
            meter({
                value: done, max: steps, tone: steps && done === steps ? 'good' : '',
                label: `${complete} de ${counted.length} ${counted.length === 1 ? 'lista completa' : 'listas completas'}`,
                figure: `${done} de ${steps} pasos`
            })));
    };

    function taskCard(item) {
        const card = panel({
            className: ['task-card', item.status === 'done' && 'is-done'].filter(Boolean).join(' '),
            title: item.name,
            hint: [item.area, item.assignees.length ? `A cargo de ${item.assignees.map(person => person.name).join(', ')}` : 'De todo el equipo'].filter(Boolean).join(' · '),
            actions: item.status === 'done' ? badge('Completa', 'good') : badge(`${item.done} de ${item.total}`, item.done ? 'info' : '')
        },
            item.purpose ? h('p', { class: 'muted small', text: item.purpose }) : null,
            h('ul', { class: 'checklist' }, item.steps.map(step => {
                const box = h('input', {
                    type: 'checkbox', checked: step.done, disabled: !marks || (!item.mine && !ctx.can('process.manage')), dataset: { step: step.id },
                    on: {
                        change: async () => {
                            box.disabled = true;
                            try {
                                const { item: updated } = await post(`${base}/tasks/toggle`, { processId: item.processId, stepId: step.id, date, done: box.checked });
                                items.set(updated.processId, updated);
                                const fresh = taskCard(updated);
                                card.replaceWith(fresh);
                                fresh.querySelector(`input[data-step="${step.id}"]`)?.focus();
                                paintProgress();
                            } catch (error) {
                                box.checked = !box.checked;
                                box.disabled = false;
                                toast(error.message, 'bad');
                            }
                        }
                    }
                });
                return h('li', { class: step.done && 'is-done' }, h('label', {}, box, h('span', {},
                    step.text,
                    step.detail ? h('span', { class: 'sub', text: step.detail }) : null,
                    step.done && step.doneByName ? h('span', { class: 'sub', text: `${step.doneByName} · ${moment(step.doneAt)}` }) : null)));
            })));
        return card;
    }

    paintProgress();
    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: 'Orden operativo',
            title: all ? 'El día del negocio' : 'Mi día',
            lead: capitalize(dayLabel(date, { weekday: true })),
            actions: [
                stepper({
                    label: date === today ? 'Hoy' : (date === addDays(today, -1) ? 'Ayer' : day(date, { short: true })),
                    onPrev: () => ctx.go('dia', null, params(addDays(date, -1), all)),
                    onNext: () => ctx.go('dia', null, params(addDays(date, 1), all)),
                    nextDisabled: date >= today, prevLabel: 'Día anterior', nextLabel: 'Día siguiente'
                }),
                canSeeAll ? tabs([{ id: 'mio', label: 'Lo mío' }, { id: 'todo', label: 'Todo el negocio' }], all ? 'todo' : 'mio',
                    next => ctx.go('dia', null, params(date, next === 'todo')), 'Qué listas ver') : null
            ]
        }),
        plan.editable ? null : notice('Este día ya está cerrado: se puede consultar, pero las tareas solo se marcan el mismo día o al siguiente.', 'info'),
        progressHost,
        plan.items.length
            ? plan.items.map(taskCard)
            : panel({}, h('p', { class: 'empty', text: date === today ? 'Hoy no le toca ninguna lista.' : 'Ese día no tocaba ninguna lista.' })),
        plan.onDemand.length ? [
            h('h2', { text: 'Cuando haga falta' }),
            h('p', { class: 'muted small', text: 'Listas que no tienen día fijo: se abren cuando ocurre lo que describen.' }),
            ...plan.onDemand.map(taskCard)
        ] : null);
}

/* ================================================================== *
 * Listas de tareas
 * ================================================================== */

async function listas(ctx) {
    const { base } = ctx;
    const manages = ctx.can('process.manage');
    const [{ processes }, { members }] = await Promise.all([get(`${base}/processes?all=1`), get(`${base}/members`)]);
    const showArchived = ctx.query.get('ver') === 'todas';
    const archived = processes.filter(row => row.status === 'archived').length;
    const rows = processes.filter(row => showArchived || row.status !== 'archived');

    const edit = async row => {
        const saved = await processForm(ctx, row, members.filter(member => member.status === 'active'));
        if (saved) { toast(row ? 'Lista actualizada.' : 'Lista creada como borrador. Publíquela para que aparezca en el día.'); ctx.reload(); }
    };
    const setStatus = async (row, status, done) => {
        try {
            await post(`${base}/processes/${encodeURIComponent(row.id)}/status`, { status });
            toast(done);
            ctx.reload();
        } catch (error) {
            toast(error.message, 'bad');
        }
    };
    const tone = { published: 'good', draft: 'warn', archived: '' };

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: 'Orden operativo',
            title: 'Listas de tareas',
            lead: 'Lo que hay que hacer, paso a paso, y a quién le toca. Una lista publicada aparece sola en el día de quien la tiene a cargo.',
            actions: manages ? btn('Nueva lista', { kind: 'primary', onClick: () => edit(null) }) : null
        }),
        panel({
            actions: archived ? btn(showArchived ? 'Ocultar las archivadas' : `Ver también las archivadas (${archived})`, {
                small: true, kind: 'quiet', onClick: () => ctx.go('listas', null, showArchived ? null : { ver: 'todas' })
            }) : null
        },
            table({
                label: 'Listas de tareas',
                emptyText: 'Todavía no hay listas. Empiece por la de abrir el negocio: es la que más se nota.',
                rows,
                columns: [
                    { label: 'Lista', render: row => [row.name, h('span', { class: 'sub', text: [row.area, `${row.steps.length} ${row.steps.length === 1 ? 'paso' : 'pasos'}`].filter(Boolean).join(' · ') })] },
                    { label: 'Cuándo', render: row => whenLabel(row) },
                    { label: 'A cargo de', render: row => (row.assignees.length ? row.assignees.map(person => person.name).join(', ') : 'Todo el equipo') },
                    { label: 'Estado', render: row => badge(PROCESS_STATUS_LABEL[row.status], tone[row.status]) },
                    manages ? {
                        label: '', tight: true, render: row => h('div', { class: 'row-actions' },
                            row.status !== 'archived' ? btn('Editar', { small: true, onClick: () => edit(row) }) : null,
                            row.status === 'draft' ? btn('Publicar', { small: true, kind: 'primary', onClick: () => setStatus(row, 'published', 'Lista publicada: ya aparece en el día.') }) : null,
                            row.status === 'published' ? btn('Archivar', { small: true, onClick: () => setStatus(row, 'archived', 'Lista archivada: deja de aparecer en el día.') }) : null,
                            row.status === 'archived' ? btn('Recuperar', { small: true, onClick: () => setStatus(row, 'draft', 'Lista recuperada como borrador.') }) : null)
                    } : null
                ].filter(Boolean)
            })));
}

/** Editor de los pasos de una lista: se escriben, se ordenan y se quitan. */
function stepsEditor(initial) {
    const rows = [];
    const host = h('div', { class: 'line-editor' });

    const renumber = () => rows.forEach((row, index) => {
        row.number.textContent = `${index + 1}.`;
        row.input.setAttribute('aria-label', `Paso ${index + 1}`);
        row.up.disabled = index === 0;
        row.down.disabled = index === rows.length - 1;
        row.remove.disabled = rows.length === 1;
    });
    const repaint = () => { host.replaceChildren(...rows.map(row => row.node)); renumber(); };
    const move = (row, amount) => {
        const index = rows.indexOf(row);
        rows.splice(index, 1);
        rows.splice(index + amount, 0, row);
        repaint();
        (amount < 0 ? row.up : row.down).focus();
    };

    const add = (step = {}) => {
        const row = { id: step.id || null };
        row.number = h('span', { class: 'muted small' });
        row.input = h('input', { type: 'text', maxlength: '200', value: step.text || '', placeholder: 'Qué hay que hacer' });
        row.up = h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Subir este paso', text: '↑', on: { click: () => move(row, -1) } });
        row.down = h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Bajar este paso', text: '↓', on: { click: () => move(row, 1) } });
        row.remove = h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Quitar este paso', text: '×', on: { click: () => { rows.splice(rows.indexOf(row), 1); repaint(); } } });
        row.node = h('div', { class: 'line-row is-step' }, row.number, row.input, h('span', { class: 'step-moves' }, row.up, row.down), row.remove);
        rows.push(row);
        return row;
    };
    (initial.length ? initial : [{}, {}, {}]).forEach(add);
    repaint();

    return {
        node: h('div', {}, host, h('p', {}, btn('Agregar paso', { small: true, onClick: () => { const row = add(); repaint(); row.input.focus(); } }))),
        read: () => {
            const value = rows.filter(row => row.input.value.trim()).map(row => (row.id ? { id: row.id, text: row.input.value.trim() } : { text: row.input.value.trim() }));
            return value.length ? { value } : { error: 'Escriba al menos un paso.' };
        }
    };
}

function processForm(ctx, row, members) {
    const steps = stepsEditor(row?.steps || []);
    return formDialog({
        title: row ? `Editar «${row.name}»` : 'Nueva lista de tareas',
        lead: row?.status === 'published' ? 'Los cambios valen desde la próxima vez que toque. Lo que ya se marcó queda como se hizo.' : '',
        wide: true,
        fields: [
            { name: 'name', label: 'Nombre', required: true, maxlength: 120, value: row?.name, placeholder: 'Apertura del local' },
            { name: 'area', label: 'Área', maxlength: 60, value: row?.area, placeholder: 'Caja, bodega, cocina…' },
            { name: 'purpose', label: 'Para qué sirve', maxlength: 300, value: row?.purpose, wide: true },
            { name: 'frequency', label: 'Cada cuánto', type: 'select', value: row?.frequency || 'daily', options: FREQUENCIES.map(value => ({ value, label: FREQUENCY_LABEL[value] })) },
            { name: 'monthDay', label: 'Qué día del mes', type: 'integer', min: 1, max: 31, value: row?.monthDay || 1 },
            { name: 'weekdays', label: 'Qué días', type: 'checks', options: WEEKDAY_OPTIONS, value: row?.weekdays?.length ? row.weekdays : [1, 2, 3, 4, 5, 6], required: true, wide: true },
            { name: 'assignees', label: 'A cargo de', type: 'checks', wide: true, value: row?.assignees.map(person => person.uid) || [], options: members.map(member => ({ value: member.uid, label: member.name || member.email })), hint: 'Sin marcar a nadie, la lista es de todo el equipo.' },
            { name: 'steps', label: 'Pasos, en orden', type: 'custom', wide: true, node: steps.node, read: steps.read }
        ],
        setup: form => {
            const frequency = form.field('frequency').control;
            const sync = () => {
                form.show('weekdays', frequency.value === 'daily' || frequency.value === 'weekly');
                form.show('monthDay', frequency.value === 'monthly');
            };
            frequency.addEventListener('change', sync);
            sync();
        },
        onSubmit: values => {
            const body = { ...values };
            if (body.weekdays) body.weekdays = body.weekdays.map(Number);
            return row ? patch(`${ctx.base}/processes/${encodeURIComponent(row.id)}`, body) : post(`${ctx.base}/processes`, body);
        }
    });
}

/* ================================================================== *
 * Equipos
 * ================================================================== */

const equipmentBadge = (row, today) => {
    if (row.status === 'overdue') return badge(`Vencido ${relativeDays(today, row.nextDueOn)}`, 'bad');
    if (row.status === 'due_soon') return badge(`Toca ${relativeDays(today, row.nextDueOn)}`, 'warn');
    if (row.status === 'ok') return badge('Al día', 'good');
    return badge('Sin plan');
};

async function equipos(ctx) {
    const { base } = ctx;
    const manages = ctx.can('equipment.manage');
    const { equipment, today } = await get(`${base}/equipment`);
    const count = status => equipment.filter(row => row.status === status).length;

    const edit = async row => {
        const saved = await equipmentForm(ctx, row, today);
        if (saved) { toast(row ? 'Equipo actualizado.' : 'Equipo agregado.'); ctx.reload(); }
    };
    const maintain = async row => {
        const saved = await maintenanceForm(ctx, row, today);
        if (saved) { toast(saved.equipment.nextDueOn ? `Mantenimiento registrado. El próximo toca el ${day(saved.equipment.nextDueOn)}.` : 'Mantenimiento registrado.'); ctx.reload(); }
    };

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: 'Orden operativo',
            title: 'Equipos',
            lead: 'Cada máquina con su calendario. El sistema avisa antes de que le toque, y otra vez si se pasa la fecha.',
            actions: manages ? btn('Agregar equipo', { kind: 'primary', onClick: () => edit(null) }) : null
        }),
        kpis([
            { label: 'Vencidos', value: String(count('overdue')), tone: count('overdue') ? 'bad' : '', hint: count('overdue') ? 'Hay que agendarlos ya' : 'Ninguno' },
            { label: 'Por vencer', value: String(count('due_soon')), tone: count('due_soon') ? 'warn' : '', hint: 'Dentro de su ventana de aviso' },
            { label: 'Al día', value: String(count('ok')) }
        ]),
        panel({},
            table({
                label: 'Equipos',
                emptyText: 'Todavía no hay equipos. Agregue el que más le dolería que se pare.',
                rows: equipment,
                columns: [
                    { label: 'Equipo', render: row => [row.name, h('span', { class: 'sub', text: row.location || 'Sin ubicación' })] },
                    { label: 'Mantenimiento', render: row => (row.everyDays ? `Cada ${row.everyDays} días` : 'Sin plan') },
                    { label: 'Último', render: row => (row.lastOn ? day(row.lastOn, { short: true }) : '—') },
                    { label: 'Próximo', render: row => [row.nextDueOn ? `${day(row.nextDueOn, { short: true })} ` : '', equipmentBadge(row, today)] },
                    {
                        label: '', tight: true, render: row => h('div', { class: 'row-actions' },
                            btn('Historial', { small: true, onClick: () => history(ctx, row) }),
                            manages ? btn('Registrar mantenimiento', { small: true, kind: row.status === 'overdue' || row.status === 'due_soon' ? 'primary' : '', onClick: () => maintain(row) }) : null,
                            manages ? btn('Editar', { small: true, onClick: () => edit(row) }) : null)
                    }
                ]
            })));
}

function equipmentForm(ctx, row, today) {
    return formDialog({
        title: row ? `Editar ${row.name}` : 'Agregar equipo',
        fields: [
            { name: 'name', label: 'Nombre', required: true, maxlength: 120, value: row?.name, wide: true, placeholder: 'Compresor de aire' },
            { name: 'location', label: 'Dónde está', maxlength: 80, value: row?.location },
            { name: 'code', label: 'Código o placa', maxlength: 40, value: row?.code },
            { name: 'everyDays', label: 'Mantenimiento cada (días)', type: 'integer', min: 1, max: 3650, value: row?.everyDays ?? '', hint: 'Vacío si no tiene plan fijo.' },
            { name: 'noticeDays', label: 'Avisar con (días)', type: 'integer', min: 0, max: 120, value: row?.noticeDays ?? 7 },
            { name: 'lastOn', label: 'Último mantenimiento', type: 'date', max: today, value: row?.lastOn || '' },
            { name: 'nextDueOn', label: 'Próximo mantenimiento', type: 'date', value: row?.nextDueOn || '', hint: 'Vacío, el sistema lo calcula del último y del intervalo.' },
            { name: 'notes', label: 'Notas', type: 'textarea', maxlength: 600, value: row?.notes, wide: true },
            row ? { name: 'active', type: 'checkbox', label: 'Estado', checkLabel: 'Sigue en uso', value: row.active, wide: true } : null
        ],
        onSubmit: values => {
            const body = { ...values, noticeDays: values.noticeDays ?? 7 };
            // Si la persona no tocó la fecha del próximo, que la recalcule el sistema.
            if (row && body.nextDueOn === row.nextDueOn && (body.everyDays !== row.everyDays || body.lastOn !== row.lastOn)) delete body.nextDueOn;
            return row ? patch(`${ctx.base}/equipment/${encodeURIComponent(row.id)}`, body) : post(`${ctx.base}/equipment`, body);
        }
    });
}

function maintenanceForm(ctx, row, today) {
    return formDialog({
        title: `Mantenimiento de ${row.name}`,
        lead: 'El preventivo mueve la próxima fecha. El correctivo —reparar una avería— no: la revisión que tocaba sigue tocando.',
        submitLabel: 'Registrar',
        fields: [
            { name: 'type', label: 'Tipo', type: 'select', value: 'preventive', options: MAINTENANCE_TYPES.map(value => ({ value, label: MAINTENANCE_TYPE_LABEL[value] })) },
            { name: 'date', label: 'Fecha', type: 'date', required: true, value: today, max: today },
            { name: 'description', label: 'Qué se le hizo', type: 'textarea', required: true, maxlength: 400, wide: true },
            { name: 'costMinor', label: 'Cuánto costó', type: 'money' },
            { name: 'performedBy', label: 'Quién lo hizo', maxlength: 120 }
        ],
        onSubmit: values => {
            const body = { ...values };
            if (body.costMinor === null || body.costMinor === undefined) delete body.costMinor;
            return post(`${ctx.base}/equipment/${encodeURIComponent(row.id)}/maintenance`, body);
        }
    });
}

async function history(ctx, row) {
    const box = dialog({ title: `Historial de ${row.name}`, wide: true }, h('p', { class: 'portal-loading', text: 'Cargando…' }));
    try {
        const { maintenance } = await get(`${ctx.base}/equipment/${encodeURIComponent(row.id)}/maintenance`);
        clear(box.body).append(table({
            label: `Mantenimientos de ${row.name}`,
            emptyText: 'Todavía no se le ha registrado ningún mantenimiento.',
            rows: maintenance,
            columns: [
                { label: 'Fecha', render: item => day(item.date, { short: true }) },
                { label: 'Tipo', render: item => MAINTENANCE_TYPE_LABEL[item.type] },
                { label: 'Qué se le hizo', render: item => [item.description, item.performedBy ? h('span', { class: 'sub', text: item.performedBy }) : null] },
                { label: 'Costo', num: true, render: item => (item.costMinor ? money(item.costMinor, ctx.currency) : '—') }
            ]
        }));
    } catch (error) {
        clear(box.body).append(notice(error.message, 'error'));
    }
}
