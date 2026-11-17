/**
 * Orden operativo, en memoria: listas de tareas, el plan del día y el
 * mantenimiento de los equipos.
 *
 *   node --test test/qms.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import * as qms from '../../../VALTRIX Engineering/js/core/qms.js';
import { codeOf, world } from './world.mjs';

/** Un taller con dos personas y una lista de apertura publicada. */
async function taller(options) {
    const w = world(options);
    await w.store.commit([
        w.store.write.create('members', 'ana', { uid: 'ana', name: 'Ana Mora', role: 'owner', status: 'active' }),
        w.store.write.create('members', 'luis', { uid: 'luis', name: 'Luis Vega', role: 'staff', status: 'active' }),
        w.store.write.create('members', 'eva', { uid: 'eva', name: 'Eva Solís', role: 'staff', status: 'suspended' })
    ]);
    const { process } = await qms.saveProcess(w.scope, null, {
        name: 'Apertura del taller', area: 'Recepción', frequency: 'daily',
        steps: ['Encender el compresor', 'Revisar pedidos del día', { text: 'Confirmar existencias', detail: 'Filtros y aceites' }]
    });
    w.apertura = (await qms.setProcessStatus(w.scope, process.id, 'published')).process;
    return w;
}

const luis = w => w.scopeFor({ uid: 'luis', name: 'Luis Vega' });

/* ------------------------------------------------------------------ *
 * Listas
 * ------------------------------------------------------------------ */

test('una lista nace en borrador y no toca hasta publicarse', async () => {
    const w = await taller();
    const { process } = await qms.saveProcess(w.scope, null, { name: 'Cierre de caja', frequency: 'daily', steps: ['Contar efectivo'] });
    assert.equal(process.status, 'draft');
    assert.deepEqual(process.weekdays, [1, 2, 3, 4, 5, 6], 'sin decir días, una lista diaria es de lunes a sábado');
    assert.equal((await qms.dayPlan(w.scope, { all: true })).items.length, 1, 'el borrador no aparece en el día');
    await qms.setProcessStatus(w.scope, process.id, 'published');
    assert.equal((await qms.dayPlan(w.scope, { all: true })).items.length, 2);
});

test('una lista necesita pasos y a quien se asigna tiene que tener acceso', async () => {
    const w = await taller();
    assert.equal(await codeOf(qms.saveProcess(w.scope, null, { name: 'Vacía', steps: [] })), 'INVALID_INPUT');
    assert.equal(await codeOf(qms.saveProcess(w.scope, null, { name: 'Fantasma', steps: ['Uno'], assignees: ['nadie'] })), 'INVALID_INPUT');
    assert.equal(await codeOf(qms.saveProcess(w.scope, null, { name: 'Suspendida', steps: ['Uno'], assignees: ['eva'] })), 'INVALID_INPUT');
    const { process } = await qms.saveProcess(w.scope, null, { name: 'Limpieza', steps: ['Barrer'], assignees: ['luis'] });
    assert.deepEqual(process.assignees, [{ uid: 'luis', name: 'Luis Vega' }]);
});

test('cada frecuencia toca los días que dice', () => {
    const daily = { frequency: 'daily', weekdays: [1, 2, 3, 4, 5, 6] };
    assert.equal(qms.occursOn(daily, '2026-11-14'), true, 'sábado');
    assert.equal(qms.occursOn(daily, '2026-11-15'), false, 'domingo');
    assert.equal(qms.occursOn({ frequency: 'weekly', weekdays: [1] }, '2026-11-16'), true, 'lunes');
    assert.equal(qms.occursOn({ frequency: 'weekly', weekdays: [1] }, '2026-11-17'), false);
    assert.equal(qms.occursOn({ frequency: 'monthly', monthDay: 15 }, '2026-11-15'), true);
    // «El día 31» en un mes de 30 es el último día, no nunca.
    assert.equal(qms.occursOn({ frequency: 'monthly', monthDay: 31 }, '2026-11-30'), true);
    assert.equal(qms.occursOn({ frequency: 'monthly', monthDay: 31 }, '2026-02-28'), true);
    assert.equal(qms.occursOn({ frequency: 'on_demand' }, '2026-11-14'), false);
});

/* ------------------------------------------------------------------ *
 * El día
 * ------------------------------------------------------------------ */

test('marcar el primer paso crea la ejecución del día', async () => {
    const w = await taller();
    assert.equal(await w.store.get('taskRuns', `${w.apertura.id}_2026-11-14`), null, 'nada escrito hasta que alguien marca');
    const [primero, segundo, tercero] = w.apertura.steps;
    const { item } = await qms.toggleStep(luis(w), { processId: w.apertura.id, stepId: primero.id });
    assert.equal(item.status, 'in_progress');
    assert.equal(item.done, 1);
    assert.equal(item.steps[0].doneByName, 'Luis Vega');

    await qms.toggleStep(luis(w), { processId: w.apertura.id, stepId: segundo.id, note: 'Dos pedidos urgentes' });
    const fin = (await qms.toggleStep(w.scope, { processId: w.apertura.id, stepId: tercero.id })).item;
    assert.equal(fin.status, 'done');
    assert.ok(fin.completedAt);
    assert.equal(fin.steps[1].note, 'Dos pedidos urgentes');

    const plan = await qms.dayPlan(w.scope, { all: true });
    assert.deepEqual(plan.progress, { lists: 1, completed: 1, steps: 3, stepsDone: 3 });
    // Desmarcar un paso reabre la lista.
    assert.equal((await qms.toggleStep(w.scope, { processId: w.apertura.id, stepId: primero.id, done: false })).item.status, 'in_progress');
});

test('dos personas que marcan a la vez no se pisan', async () => {
    const w = await taller();
    const [a, b, c] = w.apertura.steps;
    await Promise.all([
        qms.toggleStep(luis(w), { processId: w.apertura.id, stepId: a.id }),
        qms.toggleStep(w.scope, { processId: w.apertura.id, stepId: b.id }),
        qms.toggleStep(luis(w), { processId: w.apertura.id, stepId: c.id })
    ]);
    const plan = await qms.dayPlan(w.scope, { all: true });
    assert.equal(plan.items[0].done, 3, 'ningún paso marcado se perdió');
    assert.equal(plan.items[0].status, 'done');
});

test('se marca hoy o ayer, no la semana pasada ni mañana', async () => {
    const w = await taller();
    const step = w.apertura.steps[0];
    await qms.toggleStep(w.scope, { processId: w.apertura.id, stepId: step.id, date: '2026-11-13' });
    assert.equal(await codeOf(qms.toggleStep(w.scope, { processId: w.apertura.id, stepId: step.id, date: '2026-11-07' })), 'RUN_DATE_CLOSED');
    assert.equal(await codeOf(qms.toggleStep(w.scope, { processId: w.apertura.id, stepId: step.id, date: '2026-11-16' })), 'RUN_DATE_CLOSED');
    // El domingo la lista diaria no toca.
    w.at('2026-11-15T16:00:00Z');
    assert.equal(await codeOf(qms.toggleStep(w.scope, { processId: w.apertura.id, stepId: step.id })), 'NOT_SCHEDULED');
    assert.equal((await qms.dayPlan(w.scope, { all: true })).items.length, 0);
    assert.equal((await qms.dayPlan(w.scope, { date: '2026-11-07', all: true })).editable, false);
});

test('cada quien ve sus listas y no marca las ajenas', async () => {
    const w = await taller();
    const { process } = await qms.saveProcess(w.scope, null, { name: 'Arqueo de caja', steps: ['Contar', 'Anotar'], assignees: ['ana'] });
    await qms.setProcessStatus(w.scope, process.id, 'published');
    const propio = await qms.dayPlan(luis(w));
    assert.deepEqual(propio.items.map(item => item.name), ['Apertura del taller'], 'la lista sin asignar es de todos; la de Ana, no');
    assert.equal((await qms.dayPlan(luis(w), { all: true })).items.length, 2);
    w.deny('process.manage');
    assert.equal(await codeOf(qms.toggleStep(luis(w), { processId: process.id, stepId: process.steps[0].id })), 'NOT_ASSIGNED');
});

test('cambiar una lista publicada no reescribe lo que ya se hizo', async () => {
    const w = await taller();
    const [primero] = w.apertura.steps;
    await qms.toggleStep(w.scope, { processId: w.apertura.id, stepId: primero.id });
    const { process } = await qms.saveProcess(w.scope, w.apertura.id, {
        steps: [{ id: primero.id, text: 'Encender el compresor y purgarlo' }, 'Paso nuevo']
    });
    assert.equal(process.version, 2);
    assert.equal(process.steps[0].id, primero.id, 'un paso que ya existía conserva su identificador');
    const hoy = (await qms.dayPlan(w.scope, { all: true })).items[0];
    assert.equal(hoy.total, 3, 'la ejecución de hoy guarda los pasos con que empezó');
    assert.equal(hoy.steps[0].text, 'Encender el compresor');
    w.at('2026-11-16T16:00:00Z');
    const lunes = (await qms.dayPlan(w.scope, { all: true })).items[0];
    assert.deepEqual(lunes.steps.map(step => step.text), ['Encender el compresor y purgarlo', 'Paso nuevo']);
});

test('una lista «cuando haga falta» se ofrece siempre y cuenta solo si se empieza', async () => {
    const w = await taller();
    const { process } = await qms.saveProcess(w.scope, null, { name: 'Recibir mercadería', frequency: 'on_demand', steps: ['Contar cajas', 'Firmar la guía'] });
    await qms.setProcessStatus(w.scope, process.id, 'published');
    let plan = await qms.dayPlan(w.scope, { all: true });
    assert.equal(plan.onDemand.length, 1);
    assert.equal(plan.progress.lists, 1, 'sin empezar, no es un pendiente del día');
    await qms.toggleStep(w.scope, { processId: process.id, stepId: process.steps[0].id });
    plan = await qms.dayPlan(w.scope, { all: true });
    assert.equal(plan.progress.lists, 2);
});

test('el cumplimiento cuenta las veces que tocaba y las que se completó', async () => {
    const w = await taller({ now: '2026-11-02T16:00:00Z' });
    // Publicada el lunes 2. Se completa el 2, el 3 y el 4; el 5 se deja a medias.
    for (const day of ['02', '03', '04', '05']) {
        w.at(`2026-11-${day}T16:00:00Z`);
        const steps = day === '05' ? w.apertura.steps.slice(0, 1) : w.apertura.steps;
        for (const step of steps) await qms.toggleStep(w.scope, { processId: w.apertura.id, stepId: step.id });
    }
    w.at('2026-11-07T16:00:00Z');
    const hasta = await qms.compliance(w.scope, '2026-11', '2026-11-07');
    assert.equal(hasta.expected, 6, 'del lunes 2 al sábado 7');
    assert.equal(hasta.completed, 3);
    assert.equal(hasta.rateBp, 5000);
    assert.equal(hasta.processes[0].partial, 1);
    assert.equal((await qms.compliance(w.scope, '2026-11')).expected, 25, 'lunes a sábado desde el día 2');
});

/* ------------------------------------------------------------------ *
 * Equipos
 * ------------------------------------------------------------------ */

test('la próxima fecha sale del último mantenimiento y del intervalo', async () => {
    const w = await taller();
    const { equipment } = await qms.saveEquipment(w.scope, null, { name: 'Elevador de dos columnas', everyDays: 90, lastOn: '2026-08-23' });
    assert.equal(equipment.nextDueOn, '2026-11-21');
    assert.equal(equipment.status, 'due_soon');
    assert.equal(equipment.days, 7);
    const sinHistoria = (await qms.saveEquipment(w.scope, null, { name: 'Compresor', everyDays: 30 })).equipment;
    assert.equal(sinHistoria.nextDueOn, '2026-12-14', 'sin último mantenimiento conocido, toca desde hoy');
    assert.equal(sinHistoria.status, 'ok');
    const sinPlan = (await qms.saveEquipment(w.scope, null, { name: 'Gato hidráulico' })).equipment;
    assert.equal(sinPlan.status, 'none');
});

test('un equipo vencido sale primero', async () => {
    const w = await taller();
    await qms.saveEquipment(w.scope, null, { name: 'Compresor', everyDays: 30, lastOn: '2026-11-01' });
    await qms.saveEquipment(w.scope, null, { name: 'Alineadora', everyDays: 60, lastOn: '2026-08-01' });
    await qms.saveEquipment(w.scope, null, { name: 'Elevador', everyDays: 90, lastOn: '2026-08-23' });
    const { equipment } = await qms.listEquipment(w.scope);
    assert.deepEqual(equipment.map(row => [row.name, row.status]), [['Alineadora', 'overdue'], ['Elevador', 'due_soon'], ['Compresor', 'ok']]);
    const { alerts } = await qms.maintenanceAlerts(w.scope);
    assert.deepEqual(alerts.map(row => row.name), ['Alineadora', 'Elevador']);
    assert.equal(alerts[0].days, -45);
});

test('el preventivo mueve la próxima fecha; el correctivo, no', async () => {
    const w = await taller();
    const { equipment } = await qms.saveEquipment(w.scope, null, { name: 'Elevador', everyDays: 90, lastOn: '2026-08-23' });
    const reparado = await qms.registerMaintenance(w.scope, equipment.id, { type: 'corrective', description: 'Cambio de manguera', costMinor: 2500000 });
    assert.equal(reparado.equipment.nextDueOn, '2026-11-21', 'reparar una avería no es hacer la revisión que tocaba');
    assert.equal(reparado.equipment.lastOn, '2026-11-14');
    const revisado = await qms.registerMaintenance(w.scope, equipment.id, { type: 'preventive', description: 'Revisión trimestral', costMinor: 4000000 });
    assert.equal(revisado.equipment.nextDueOn, '2027-02-12');
    assert.equal(revisado.equipment.status, 'ok');
    assert.equal((await qms.listMaintenance(w.scope, { equipmentId: equipment.id })).maintenance.length, 2);
    const stats = await w.store.get('stats', '2026-11');
    assert.equal(stats.maintenanceMinor, 6500000);
    assert.equal(stats.maintenanceCount, 2);
    assert.equal(await codeOf(qms.registerMaintenance(w.scope, equipment.id, { description: '' })), 'INVALID_INPUT');
});

test('de cada vencimiento se avisa al acercarse y al vencer, y no más', async () => {
    const w = await taller();
    const { equipment } = await qms.saveEquipment(w.scope, null, { name: 'Elevador', everyDays: 90, lastOn: '2026-08-23' });
    await qms.saveEquipment(w.scope, null, { name: 'Compresor', everyDays: 30, lastOn: '2026-11-10' });

    let pendientes = (await qms.pendingAlerts(w.scope)).alerts;
    assert.deepEqual(pendientes.map(row => [row.name, row.status]), [['Elevador', 'due_soon']], 'el compresor todavía no entra en la ventana de aviso');
    assert.equal(await qms.markNotified(w.scope, equipment.id, '2026-11-21', 'due_soon'), true);
    assert.equal((await qms.pendingAlerts(w.scope)).alerts.length, 0, 'la segunda pasada del día no repite el aviso');

    // Llega la fecha y nadie hizo el mantenimiento: se avisa otra vez, ya como vencido.
    w.at('2026-11-23T16:00:00Z');
    pendientes = (await qms.pendingAlerts(w.scope)).alerts;
    assert.deepEqual(pendientes.map(row => [row.name, row.status]), [['Elevador', 'overdue']]);
    await qms.markNotified(w.scope, equipment.id, '2026-11-21', 'overdue');
    assert.equal((await qms.pendingAlerts(w.scope)).alerts.length, 0);

    // Al hacer el mantenimiento la fecha se mueve, y la marca deja de valer.
    await qms.registerMaintenance(w.scope, equipment.id, { type: 'preventive', description: 'Revisión' });
    assert.equal((await w.store.get('equipment', equipment.id)).notifiedFor, null);
    assert.equal(await qms.markNotified(w.scope, equipment.id, '2026-11-21', 'overdue'), false, 'esa fecha ya no es la vigente');
});

test('el resumen del día junta tareas y mantenimientos', async () => {
    const w = await taller();
    await qms.saveEquipment(w.scope, null, { name: 'Alineadora', everyDays: 60, lastOn: '2026-08-01' });
    await qms.toggleStep(w.scope, { processId: w.apertura.id, stepId: w.apertura.steps[0].id });
    const resumen = await qms.qmsSummary(w.scope, { all: true });
    assert.deepEqual(resumen.tasks, { lists: 1, completed: 0, steps: 3, stepsDone: 1 });
    assert.equal(resumen.pending[0].name, 'Apertura del taller');
    assert.equal(resumen.maintenance.overdue, 1);
});
