/**
 * Orden operativo: listas de tareas paso a paso y mantenimiento de equipos.
 *
 * Es el segundo mes de la suscripción: que cada persona sepa qué le toca hoy,
 * y que el negocio se entere de que a una máquina le toca mantenimiento antes
 * de que se pare.
 *
 * Cómo está hecho:
 *
 *   · **Una lista es una plantilla; lo que se hace un día es una ejecución.**
 *     `processes/{id}` dice los pasos y cuándo tocan. `taskRuns/{lista}_{día}`
 *     guarda lo que se marcó ese día, con una **copia de los pasos**: si la
 *     plantilla cambia mañana, lo que se hizo ayer sigue diciendo lo que se
 *     hizo.
 *
 *   · **La ejecución nace al marcar el primer paso**, no a medianoche. No hay
 *     un proceso que fabrique tareas vacías cada día: el plan de un día se
 *     calcula de las plantillas, y solo queda escrito lo que alguien tocó.
 *
 *   · **Su identificador es la lista y el día**, así que dos personas que
 *     marcan a la vez escriben el mismo documento, con precondición, y ningún
 *     paso marcado se pierde.
 *
 *   · **Se marca hoy o ayer.** Ayer, porque el turno de noche cierra pasada la
 *     medianoche. Más atrás no: una lista rellenada una semana después no es
 *     evidencia de nada.
 *
 *   · **El mantenimiento preventivo mueve la próxima fecha; el correctivo, no.**
 *     Reparar una avería no significa que ya se hizo la revisión que tocaba.
 */

import { DEFAULT_NOTICE_DAYS, FREQUENCIES, MAINTENANCE_TYPES } from './catalog.js';
import { invalid, isConflict, raise } from './errors.js';
import { assertOpenDate, retrying, today } from './erp.js';
import { addDays, businessDay, daysInMonth, daysOf, diffDays, firstDay, lastDay, periodOf, weekdayOf } from './time.js';
import * as v from './validate.js';

const MAX_STEPS = 30;
const stamp = scope => scope.now().toISOString();

/* ================================================================== *
 * Listas de tareas
 * ================================================================== */

/** ¿Toca esta lista ese día? Una lista «cuando haga falta» no toca nunca sola. */
export function occursOn(process, day) {
    if (process.frequency === 'daily' || process.frequency === 'weekly') return (process.weekdays || []).includes(weekdayOf(day));
    if (process.frequency === 'monthly') {
        // «El día 31» en un mes de 30 es el último día, no nunca.
        const wanted = Math.min(process.monthDay || 1, daysInMonth(periodOf(day)));
        return Number(day.slice(8, 10)) === wanted;
    }
    return false;
}

function processView(row, members = new Map()) {
    return {
        id: row.id,
        name: row.name,
        area: row.area || '',
        purpose: row.purpose || '',
        frequency: row.frequency,
        weekdays: row.weekdays || [],
        monthDay: row.monthDay || null,
        assignees: (row.assignees || []).map(uid => ({ uid, name: members.get(uid)?.name || members.get(uid)?.email || 'Persona sin acceso' })),
        steps: (row.steps || []).map(step => ({ id: step.id, text: step.text, detail: step.detail || '' })),
        status: row.status,
        version: row.version || 1,
        publishedAt: row.publishedAt || null,
        updatedAt: row.updatedAt
    };
}

const membersOf = scope => scope.store.query('members', { limit: 200 }).then(rows => new Map(rows.map(row => [row.id, row])));

export async function listProcesses(scope, { includeArchived = false } = {}) {
    const [rows, members] = await Promise.all([scope.store.query('processes', { limit: 500 }), membersOf(scope)]);
    return {
        processes: rows
            .filter(row => includeArchived || row.status !== 'archived')
            .map(row => processView(row, members))
            .sort((a, b) => a.area.localeCompare(b.area, 'es') || a.name.localeCompare(b.name, 'es'))
    };
}

export async function getProcess(scope, processId) {
    const [row, members] = await Promise.all([scope.store.get('processes', v.id(processId)), membersOf(scope)]);
    if (!row) raise('NOT_FOUND');
    return { process: processView(row, members) };
}

function stepsInput(value, current = []) {
    if (!Array.isArray(value) || !value.length || value.length > MAX_STEPS) invalid('steps');
    const known = new Set(current.map(step => step.id));
    const used = new Set();
    return value.map((step, index) => {
        const text = v.requiredText(typeof step === 'string' ? step : step?.text, `steps.${index}.text`, 200);
        // Un paso que ya existía conserva su identificador: es lo que permite
        // comparar la ejecución de ayer con la plantilla de hoy.
        let id = typeof step?.id === 'string' && known.has(step.id) && !used.has(step.id) ? step.id : null;
        if (!id) id = `p${v.newId().replace(/-/g, '').slice(0, 10)}`;
        used.add(id);
        return { id, text, detail: v.text(step?.detail, 400) };
    });
}

function scheduleInput(input, current = null) {
    const frequency = 'frequency' in input || !current ? v.requiredOneOf(input.frequency || 'daily', [...FREQUENCIES], 'frequency') : current.frequency;
    let weekdays = [];
    let monthDay = null;
    if (frequency === 'daily' || frequency === 'weekly') {
        const given = 'weekdays' in input ? input.weekdays : current?.weekdays;
        weekdays = Array.isArray(given) ? [...new Set(given.filter(day => Number.isInteger(day) && day >= 1 && day <= 7))].sort() : [];
        // Sin decir qué días, una lista diaria es de lunes a sábado —la
        // semana de la mayoría de estos negocios— y una semanal, del lunes.
        if (!weekdays.length) weekdays = frequency === 'daily' ? [1, 2, 3, 4, 5, 6] : [1];
    }
    if (frequency === 'monthly') monthDay = v.integer('monthDay' in input ? input.monthDay : (current?.monthDay ?? 1), 'monthDay', { min: 1, max: 31 });
    return { frequency, weekdays, monthDay };
}

/** Crea una lista (como borrador) o cambia una existente. */
export async function saveProcess(scope, processId, input = {}) {
    const current = processId ? await scope.store.get('processes', v.id(processId)) : null;
    if (processId && !current) raise('NOT_FOUND');

    const assignees = 'assignees' in input ? v.idList(input.assignees, 'assignees') : (current?.assignees || []);
    if (assignees.length) {
        const members = await scope.store.getMany('members', assignees);
        if (assignees.some(uid => members.get(uid)?.status !== 'active')) invalid('assignees');
    }
    const now = stamp(scope);
    const data = {
        name: 'name' in input || !current ? v.requiredText(input.name, 'name', 120) : current.name,
        area: 'area' in input ? v.text(input.area, 60) : (current?.area || ''),
        purpose: 'purpose' in input ? v.text(input.purpose, 300) : (current?.purpose || ''),
        ...scheduleInput(input, current),
        assignees,
        steps: 'steps' in input || !current ? stepsInput(input.steps, current?.steps) : current.steps,
        updatedAt: now
    };

    const members = await membersOf(scope);
    if (!current) {
        const id = v.newId();
        const row = { ...data, status: 'draft', version: 1, publishedAt: null, createdAt: now, createdBy: scope.actor.uid };
        await scope.store.commit([scope.store.write.create('processes', id, row)]);
        return { process: processView({ id, ...row }, members) };
    }
    // Cambiar una lista publicada es sacar una versión nueva: las ejecuciones
    // ya hechas guardan los pasos con que se hicieron.
    const changes = { ...data, version: current.status === 'published' ? (current.version || 1) + 1 : (current.version || 1) };
    await scope.store.commit([scope.store.write.update('processes', processId, changes, { updateTime: current._updateTime })]);
    return { process: processView({ ...current, ...changes }, members) };
}

export async function setProcessStatus(scope, processId, status) {
    v.requiredOneOf(status, ['draft', 'published', 'archived'], 'status');
    const current = await scope.store.get('processes', v.id(processId));
    if (!current) raise('NOT_FOUND');
    if (status === 'published' && !(current.steps || []).length) invalid('steps');
    const now = stamp(scope);
    const changes = { status, updatedAt: now };
    if (status === 'published' && !current.publishedAt) changes.publishedAt = now;
    await scope.store.commit([scope.store.write.update('processes', processId, changes, { updateTime: current._updateTime })]);
    return { process: processView({ ...current, ...changes }, await membersOf(scope)) };
}

/* ================================================================== *
 * El día
 * ================================================================== */

const runId = (processId, date) => `${processId}_${date}`;

const isMine = (process, uid) => !(process.assignees || []).length || process.assignees.includes(uid);

function planItem(process, run, members, uid, date) {
    const steps = (run?.steps || process.steps || []).map(step => ({
        id: step.id, text: step.text, detail: step.detail || '',
        done: Boolean(step.done), doneAt: step.doneAt || null, doneByName: step.doneByName || '', note: step.note || ''
    }));
    const done = steps.filter(step => step.done).length;
    return {
        processId: process.id,
        date,
        name: process.name,
        area: process.area || '',
        purpose: process.purpose || '',
        frequency: process.frequency,
        onDemand: process.frequency === 'on_demand',
        assignees: (process.assignees || []).map(id => ({ uid: id, name: members.get(id)?.name || members.get(id)?.email || 'Persona sin acceso' })),
        mine: isMine(process, uid),
        steps,
        done,
        total: steps.length,
        status: done === 0 ? 'pending' : (done === steps.length ? 'done' : 'in_progress'),
        completedAt: run?.completedAt || null
    };
}

/**
 * Lo que toca un día. `all` enseña todas las listas del negocio; sin él, solo
 * las de quien llama y las que no tienen a nadie asignado.
 */
export async function dayPlan(scope, { date = null, all = false } = {}) {
    const now = today(scope);
    const day = date ? v.day(date, 'date') : now;
    const [processes, runs, members] = await Promise.all([
        scope.store.query('processes', { where: [['status', '==', 'published']], limit: 500 }),
        scope.store.query('taskRuns', { where: [['date', '==', day]], limit: 500 }),
        membersOf(scope)
    ]);
    const byProcess = new Map(runs.map(run => [run.processId, run]));
    const visible = processes.filter(process => all || isMine(process, scope.actor.uid));
    const order = (a, b) => a.area.localeCompare(b.area, 'es') || a.name.localeCompare(b.name, 'es');
    const scheduled = visible.filter(process => occursOn(process, day))
        .map(process => planItem(process, byProcess.get(process.id), members, scope.actor.uid, day)).sort(order);
    // Las listas «cuando haga falta» se ofrecen siempre, aparte: no cuentan
    // como pendientes del día salvo que alguien las haya empezado.
    const onDemand = visible.filter(process => process.frequency === 'on_demand')
        .map(process => planItem(process, byProcess.get(process.id), members, scope.actor.uid, day)).sort(order);
    const counted = [...scheduled, ...onDemand.filter(item => item.status !== 'pending')];
    return {
        date: day,
        today: now,
        editable: day === now || day === addDays(now, -1),
        items: scheduled,
        onDemand,
        progress: {
            lists: counted.length,
            completed: counted.filter(item => item.status === 'done').length,
            steps: counted.reduce((total, item) => total + item.total, 0),
            stepsDone: counted.reduce((total, item) => total + item.done, 0)
        }
    };
}

/** Marca o desmarca un paso. Crea la ejecución del día si todavía no existía. */
export async function toggleStep(scope, input = {}) {
    const processId = v.id(input.processId, 'processId');
    const stepId = v.id(input.stepId, 'stepId');
    const now = today(scope);
    const date = input.date ? v.day(input.date, 'date') : now;
    if (date !== now && date !== addDays(now, -1)) raise('RUN_DATE_CLOSED');
    const done = input.done !== false;
    const note = 'note' in input ? v.text(input.note, 300) : null;

    return retrying(async () => {
        const [process, run, members] = await Promise.all([
            scope.store.get('processes', processId),
            scope.store.get('taskRuns', runId(processId, date)),
            membersOf(scope)
        ]);
        if (!process) raise('NOT_FOUND');
        if (process.status !== 'published') raise('PROCESS_NOT_PUBLISHED');
        if (process.frequency !== 'on_demand' && !occursOn(process, date)) raise('NOT_SCHEDULED');
        if (!isMine(process, scope.actor.uid) && !scope.can('process.manage')) raise('NOT_ASSIGNED');

        const at = stamp(scope);
        const steps = (run?.steps || process.steps.map(step => ({ id: step.id, text: step.text, detail: step.detail || '', done: false })))
            .map(step => ({ ...step }));
        const step = steps.find(candidate => candidate.id === stepId);
        if (!step) invalid('stepId');
        step.done = done;
        step.doneAt = done ? at : null;
        step.doneBy = done ? scope.actor.uid : null;
        step.doneByName = done ? scope.actor.name : '';
        if (note !== null) step.note = note;

        const finished = steps.every(candidate => candidate.done);
        const data = {
            processId, processName: process.name, area: process.area || '', version: run?.version || process.version || 1,
            date, period: periodOf(date), steps, done: steps.filter(candidate => candidate.done).length, total: steps.length,
            status: finished ? 'done' : 'in_progress', completedAt: finished ? (run?.completedAt || at) : null, updatedAt: at
        };
        await scope.store.commit([run
            ? scope.store.write.update('taskRuns', runId(processId, date), data, { updateTime: run._updateTime })
            : scope.store.write.create('taskRuns', runId(processId, date), { ...data, startedAt: at, startedBy: scope.actor.uid })]);
        return { item: planItem(process, data, members, scope.actor.uid, date) };
    });
}

/**
 * Cumplimiento de las listas en un período: cuántas veces tocaba cada una y
 * cuántas se completaron. `until` corta el período en un día (el mes en curso
 * solo se mide hasta hoy).
 */
export async function compliance(scope, period, until = null) {
    const [processes, runs] = await Promise.all([
        scope.store.query('processes', { where: [['status', '==', 'published']], limit: 500 }),
        scope.store.query('taskRuns', { where: [['date', '>=', firstDay(period)], ['date', '<=', lastDay(period)]], limit: 5000 })
    ]);
    const days = daysOf(period, until);
    const rows = [];
    for (const process of processes) {
        if (process.frequency === 'on_demand') continue;
        // Una lista publicada a mitad de mes no debe los días anteriores.
        const since = process.publishedAt ? businessDay(new Date(process.publishedAt), scope.tenant.timezone) : firstDay(period);
        const expected = days.filter(day => day >= since && occursOn(process, day)).length;
        if (!expected) continue;
        const own = runs.filter(run => run.processId === process.id && days.includes(run.date));
        const completed = own.filter(run => run.status === 'done').length;
        rows.push({
            processId: process.id, name: process.name, area: process.area || '',
            expected, completed: Math.min(completed, expected), partial: own.filter(run => run.status !== 'done').length,
            rateBp: Math.round((Math.min(completed, expected) * 10000) / expected)
        });
    }
    const expected = rows.reduce((total, row) => total + row.expected, 0);
    const completed = rows.reduce((total, row) => total + row.completed, 0);
    return {
        period,
        expected,
        completed,
        rateBp: expected ? Math.round((completed * 10000) / expected) : null,
        processes: rows.sort((a, b) => a.rateBp - b.rateBp || b.expected - a.expected)
    };
}

/* ================================================================== *
 * Equipos y mantenimiento
 * ================================================================== */

/** En qué situación está un equipo respecto de su próximo mantenimiento. */
export function equipmentStatus(row, now) {
    if (!row.nextDueOn) return { status: 'none', days: null };
    const days = diffDays(now, row.nextDueOn);
    if (days < 0) return { status: 'overdue', days };
    if (days <= (row.noticeDays ?? DEFAULT_NOTICE_DAYS)) return { status: 'due_soon', days };
    return { status: 'ok', days };
}

function equipmentView(row, now) {
    return {
        id: row.id,
        name: row.name,
        code: row.code || '',
        location: row.location || '',
        category: row.category || '',
        everyDays: row.everyDays || null,
        noticeDays: row.noticeDays ?? DEFAULT_NOTICE_DAYS,
        lastOn: row.lastOn || null,
        nextDueOn: row.nextDueOn || null,
        notes: row.notes || '',
        active: row.active !== false,
        ...equipmentStatus(row, now)
    };
}

const URGENCY = { overdue: 0, due_soon: 1, ok: 2, none: 3 };

export async function listEquipment(scope, { includeInactive = false } = {}) {
    const now = today(scope);
    const rows = await scope.store.query('equipment', { limit: 1000 });
    return {
        today: now,
        equipment: rows
            .filter(row => includeInactive || row.active !== false)
            .map(row => equipmentView(row, now))
            .sort((a, b) => URGENCY[a.status] - URGENCY[b.status] || (a.days ?? 0) - (b.days ?? 0) || a.name.localeCompare(b.name, 'es'))
    };
}

export async function saveEquipment(scope, equipmentId, input = {}) {
    const current = equipmentId ? await scope.store.get('equipment', v.id(equipmentId)) : null;
    if (equipmentId && !current) raise('NOT_FOUND');
    const now = today(scope);
    const pick = (key, read, fallback) => (key in input ? read(input[key]) : (current ? current[key] ?? fallback : fallback));

    const everyDays = pick('everyDays', value => v.integer(value, 'everyDays', { min: 1, max: 3650, optional: true }), null);
    const lastOn = pick('lastOn', value => v.day(value, 'lastOn', { optional: true }), null);
    if (lastOn && lastOn > now) raise('FUTURE_DATE', { field: 'lastOn' });
    let nextDueOn = pick('nextDueOn', value => v.day(value, 'nextDueOn', { optional: true }), null);
    // Sin fecha escrita, la próxima sale del último mantenimiento y del
    // intervalo. Sin último mantenimiento conocido, toca desde hoy.
    const planChanged = 'everyDays' in input || 'lastOn' in input;
    if (everyDays && (!nextDueOn || (planChanged && !('nextDueOn' in input)))) nextDueOn = addDays(lastOn || now, everyDays);
    if (!everyDays && !('nextDueOn' in input)) nextDueOn = current?.nextDueOn && !planChanged ? current.nextDueOn : null;

    const stampNow = stamp(scope);
    const data = {
        name: 'name' in input || !current ? v.requiredText(input.name, 'name', 120) : current.name,
        code: pick('code', value => v.text(value, 40), ''),
        location: pick('location', value => v.text(value, 80), ''),
        category: pick('category', value => v.text(value, 60), ''),
        everyDays,
        noticeDays: pick('noticeDays', value => v.integer(value, 'noticeDays', { min: 0, max: 120 }), DEFAULT_NOTICE_DAYS),
        lastOn,
        nextDueOn,
        notes: pick('notes', value => v.longText(value, 600), ''),
        active: 'active' in input ? input.active !== false : (current ? current.active !== false : true),
        updatedAt: stampNow
    };
    if (!current) {
        const id = v.newId();
        const row = { ...data, createdAt: stampNow, createdBy: scope.actor.uid };
        await scope.store.commit([scope.store.write.create('equipment', id, row)]);
        return { equipment: equipmentView({ id, ...row }, now) };
    }
    await scope.store.commit([scope.store.write.update('equipment', equipmentId, data, { updateTime: current._updateTime })]);
    return { equipment: equipmentView({ ...current, ...data }, now) };
}

function maintenanceView(row) {
    return {
        id: row.id,
        equipmentId: row.equipmentId,
        equipmentName: row.equipmentName,
        date: row.date,
        type: row.type,
        description: row.description,
        costMinor: row.costMinor || 0,
        currency: row.currency,
        performedBy: row.performedBy || '',
        byName: row.byName || ''
    };
}

export async function listMaintenance(scope, { equipmentId = null, period = null } = {}) {
    let rows;
    if (equipmentId) rows = await scope.store.query('maintenance', { where: [['equipmentId', '==', v.id(equipmentId, 'equipmentId')]], limit: 1000 });
    else if (period) rows = await scope.store.query('maintenance', { where: [['date', '>=', firstDay(v.period(period, 'period'))], ['date', '<=', lastDay(period)]], limit: 2000 });
    else rows = await scope.store.query('maintenance', { orderBy: [['date', 'desc']], limit: 100 });
    return {
        maintenance: rows.sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at)).map(maintenanceView),
        currency: scope.tenant.currency
    };
}

export async function registerMaintenance(scope, equipmentId, input = {}) {
    v.id(equipmentId);
    const now = today(scope);
    const date = input.date ? v.day(input.date, 'date') : now;
    const type = v.requiredOneOf(input.type || 'preventive', [...MAINTENANCE_TYPES], 'type');
    const description = v.requiredText(input.description, 'description', 400);
    const costMinor = v.minor(input.costMinor, 'costMinor', { optional: true }) || 0;
    const givenNext = v.day(input.nextDueOn, 'nextDueOn', { optional: true });
    await assertOpenDate(scope, date);

    return retrying(async () => {
        const equipment = await scope.store.get('equipment', equipmentId);
        if (!equipment) raise('NOT_FOUND');
        const at = stamp(scope);
        const changes = { updatedAt: at };
        if (!equipment.lastOn || date >= equipment.lastOn) changes.lastOn = date;
        if (givenNext) changes.nextDueOn = givenNext;
        else if (type === 'preventive' && equipment.everyDays) changes.nextDueOn = addDays(date, equipment.everyDays);
        // Al moverse la fecha, el aviso ya enviado deja de valer para la nueva.
        if ('nextDueOn' in changes) changes.notifiedFor = null;

        const id = v.newId();
        const record = {
            equipmentId, equipmentName: equipment.name, date, period: periodOf(date), type, description, costMinor,
            currency: scope.tenant.currency, performedBy: v.text(input.performedBy, 120), at, by: scope.actor.uid, byName: scope.actor.name
        };
        const writes = [
            scope.store.write.create('maintenance', id, record),
            scope.store.write.update('equipment', equipmentId, changes, { updateTime: equipment._updateTime })
        ];
        writes.push(scope.store.write.merge('stats', record.period, { period: record.period }, {
            increments: { maintenanceMinor: costMinor, maintenanceCount: 1 }
        }));
        await scope.store.commit(writes);
        return { maintenance: maintenanceView({ id, ...record }), equipment: equipmentView({ ...equipment, ...changes }, now) };
    });
}

/** Los equipos que piden atención: vencidos primero, luego los que están por vencer. */
export async function maintenanceAlerts(scope) {
    const { equipment, today: now } = await listEquipment(scope);
    return { today: now, alerts: equipment.filter(row => row.status === 'overdue' || row.status === 'due_soon') };
}

/** La marca de «ya se avisó»: la fecha que vence y en qué situación estaba. */
const noticeKey = (nextDueOn, status) => `${nextDueOn}:${status}`;

/**
 * Los avisos que todavía no se han enviado. De cada vencimiento se avisa dos
 * veces y no más: cuando entra en la ventana de aviso y cuando vence. Lo que
 * decide si ya se avisó es la marca guardada en el equipo, no la memoria de
 * quien envía: el proceso que avisa puede correr dos veces el mismo día.
 */
export async function pendingAlerts(scope) {
    const now = today(scope);
    const rows = await scope.store.query('equipment', { limit: 1000 });
    return {
        today: now,
        alerts: rows
            .filter(row => row.active !== false)
            .map(row => ({ ...equipmentView(row, now), notifiedFor: row.notifiedFor || null }))
            .filter(row => (row.status === 'overdue' || row.status === 'due_soon') && row.notifiedFor !== noticeKey(row.nextDueOn, row.status))
            .sort((a, b) => URGENCY[a.status] - URGENCY[b.status] || a.days - b.days)
    };
}

/**
 * Anota que ya se avisó de un vencimiento. Si alguien cambió el equipo entre
 * medias, no pasa nada: se volverá a mirar en la siguiente pasada.
 */
export async function markNotified(scope, equipmentId, nextDueOn, status) {
    const equipment = await scope.store.get('equipment', equipmentId);
    if (!equipment || equipment.nextDueOn !== nextDueOn) return false;
    try {
        await scope.store.commit([scope.store.write.update('equipment', equipmentId, { notifiedFor: noticeKey(nextDueOn, status) }, { updateTime: equipment._updateTime })]);
        return true;
    } catch (error) {
        if (isConflict(error)) return false;
        throw error;
    }
}

/** Lo que el resumen del negocio necesita saber de la operación de hoy. */
export async function qmsSummary(scope, { all = false } = {}) {
    const [plan, alerts] = await Promise.all([dayPlan(scope, { all }), maintenanceAlerts(scope)]);
    return {
        today: plan.date,
        tasks: plan.progress,
        pending: plan.items.filter(item => item.status !== 'done').map(item => ({ processId: item.processId, name: item.name, area: item.area, done: item.done, total: item.total })),
        maintenance: {
            overdue: alerts.alerts.filter(row => row.status === 'overdue').length,
            dueSoon: alerts.alerts.filter(row => row.status === 'due_soon').length,
            alerts: alerts.alerts.slice(0, 8)
        }
    };
}
