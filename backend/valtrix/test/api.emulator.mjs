/**
 * El sistema unificado, de punta a punta, contra los emuladores de Firebase.
 *
 * Recorre el servicio tal como lo vive un negocio: lo dan de alta, paga el
 * primer mes y se abre el control financiero; paga el segundo y se abre el
 * orden operativo; paga el tercero y llega el cierre mensual. Y por el
 * camino comprueba lo que de verdad protege el API —que cada quien alcanza
 * solo lo suyo, en su negocio y con su papel—, que es lo que las pruebas en
 * memoria no pueden ver.
 *
 *   firebase emulators:exec --only auth,firestore --project demo-valtrix \
 *     "node --test --test-concurrency=1 test/api.emulator.mjs"
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { runScheduled } from '../src/scheduled.js';
import { time } from '../src/core.js';
import { TUTEO } from './world.mjs';
import { activate, call, db, env, fakeMailer, makeUser, ok, staffUser, tenantWithOwner, unique } from './emulator.mjs';

const suffix = unique();
const TALLER = `taller-${suffix}`;
const PANADERIA = `panaderia-${suffix}`;
const today = time.businessDay();

let staff;
let taller;       // negocio con los tres módulos
let panaderia;    // negocio recién dado de alta, sin pagar
let filtro;
let pastillas;
let cliente;

test('montaje: la administración da de alta dos negocios', async () => {
    staff = await staffUser(suffix);
    taller = await tenantWithOwner(staff, { id: TALLER, name: 'Taller Horizonte', ownerEmail: `ana-${suffix}@ejemplo.test` });
    panaderia = await tenantWithOwner(staff, { id: PANADERIA, name: 'Panadería Trigal', ownerEmail: `beto-${suffix}@ejemplo.test`, sector: 'panaderia' });
    const me = await ok('/me', { token: taller.owner.token });
    assert.deepEqual(me.tenants.map(row => row.id), [TALLER]);
    assert.deepEqual(me.tenants[0].capabilities, ['*']);
    assert.deepEqual(me.tenants[0].entitlements, { erp: false, qms: false, audit: false });
});

/* ------------------------------------------------------------------ *
 * Mes 1: control financiero
 * ------------------------------------------------------------------ */

test('sin el primer pago, el control financiero está cerrado', async () => {
    const response = await call(`/tenants/${TALLER}/products`, { token: taller.owner.token });
    assert.equal(response.status, 402);
    assert.equal(response.code, 'MODULE_LOCKED');
    assert.equal(response.data.module, 'erp');
});

test('liquidar el primer período abre el control financiero, y solo eso', async () => {
    const settled = await ok(`/admin/tenants/${TALLER}/periods`, { method: 'POST', token: staff.token, body: { period: 1, method: 'sinpe', reference: 'SINPE 8841' } });
    assert.deepEqual(settled.unlocked, ['erp']);
    assert.equal(settled.subscription.state, 'active');
    assert.equal(settled.subscription.currentPeriodEnd, time.addMonths(today, 1));

    // Un doble clic no liquida el mes siguiente sin que nadie lo haya cobrado.
    const again = await call(`/admin/tenants/${TALLER}/periods`, { method: 'POST', token: staff.token, body: { period: 1 } });
    assert.equal(again.status, 409);
    assert.equal(again.code, 'PERIOD_ALREADY_SETTLED');

    assert.equal((await call(`/tenants/${TALLER}/products`, { token: taller.owner.token })).status, 200);
    const locked = await call(`/tenants/${TALLER}/tasks`, { token: taller.owner.token });
    assert.equal(locked.code, 'MODULE_LOCKED', 'el orden operativo espera al segundo pago');
});

test('productos, existencias y una venta', async () => {
    const base = `/tenants/${TALLER}`;
    const token = taller.owner.token;
    filtro = (await ok(`${base}/products`, { method: 'POST', token, body: { code: 'FIL-001', name: 'Filtro de aceite', costMinor: 340000, priceMinor: 500000, minStockMilli: 5000, openingStockMilli: 24000 } })).product;
    pastillas = (await ok(`${base}/products`, { method: 'POST', token, body: { code: 'PAS-014', name: 'Pastillas de freno', costMinor: 1640000, priceMinor: 2000000, minStockMilli: 4000, openingStockMilli: 1000 } })).product;
    assert.equal(filtro.marginBp, 3200);

    const repetido = await call(`${base}/products`, { method: 'POST', token, body: { code: 'fil 001', name: 'Otro', priceMinor: 100 } });
    assert.equal(repetido.status, 409);
    assert.equal(repetido.code, 'PRODUCT_CODE_TAKEN');

    const invalido = await call(`${base}/products`, { method: 'POST', token, body: { name: 'Mal', priceMinor: 12.5 } });
    assert.equal(invalido.status, 400);
    assert.equal(invalido.code, 'INVALID_INPUT');
    assert.equal(invalido.data.field, 'priceMinor', 'un importe decimal no es un importe: dice qué campo');

    const { sale } = await ok(`${base}/sales`, { method: 'POST', token, body: { term: 'cash', method: 'sinpe', lines: [{ productId: filtro.id, quantityMilli: 2000 }] } });
    assert.equal(sale.number, 'V-000001');
    assert.equal(sale.date, today);
    assert.equal(sale.totalMinor, 1000000);
    assert.equal(sale.costMinor, 680000);

    const { products } = await ok(`${base}/products`, { token });
    assert.equal(products.find(row => row.id === filtro.id).onHandMilli, 22000);

    const summary = await ok(`${base}/erp/summary`, { token });
    assert.equal(summary.sales.totalMinor, 1000000);
    assert.equal(summary.sales.profitMinor, 320000);
    assert.equal(summary.stock.lowCount, 1, 'las pastillas están por debajo del mínimo');
    assert.equal(summary.daily.at(-1).salesMinor, 1000000);
});

test('la última unidad no se vende dos veces, tampoco por el API', async () => {
    const sell = () => call(`/tenants/${TALLER}/sales`, { method: 'POST', token: taller.owner.token, body: { lines: [{ productId: pastillas.id, quantityMilli: 1000 }] } });
    const results = await Promise.all([sell(), sell(), sell()]);
    assert.deepEqual(results.map(result => result.status).sort(), [200, 409, 409]);
    assert.deepEqual([...new Set(results.filter(result => result.status === 409).map(result => result.code))], ['STOCK_INSUFFICIENT']);
    const { products } = await ok(`/tenants/${TALLER}/products`, { token: taller.owner.token });
    assert.equal(products.find(row => row.id === pastillas.id).onHandMilli, 0);
    const { sales } = await ok(`/tenants/${TALLER}/sales`, { token: taller.owner.token });
    assert.deepEqual(sales.map(row => row.number).sort(), ['V-000001', 'V-000002'], 'los consecutivos no se repiten ni se saltan');
});

test('crédito, cobro y cartera', async () => {
    const base = `/tenants/${TALLER}`;
    const token = taller.owner.token;
    cliente = (await ok(`${base}/customers`, { method: 'POST', token, body: { name: 'Transportes Solís', phone: '8888-0000', creditDays: 15 } })).customer;
    await ok(`${base}/customers/${cliente.id}/opening-balance`, { method: 'POST', token, body: { amountMinor: 24000000, date: time.addDays(today, -60), dueDate: time.addDays(today, -40) } });
    const { sale } = await ok(`${base}/sales`, { method: 'POST', token, body: { term: 'credit', customerId: cliente.id, lines: [{ productId: filtro.id, quantityMilli: 4000 }] } });
    assert.equal(sale.dueDate, time.addDays(today, 15));

    let cartera = await ok(`${base}/receivables`, { token });
    assert.equal(cartera.totalMinor, 26000000);
    assert.equal(cartera.overdueMinor, 24000000);
    assert.equal(cartera.customers[0].phone, '8888-0000');

    const { payment } = await ok(`${base}/payments`, { method: 'POST', token, body: { customerId: cliente.id, amountMinor: 24000000, method: 'transferencia', reference: 'TRF 0099' } });
    assert.equal(payment.allocations.length, 1, 'cubre primero lo que vence antes');
    cartera = await ok(`${base}/receivables`, { token });
    assert.equal(cartera.totalMinor, 2000000);
    assert.equal(cartera.overdueMinor, 0);

    const demasiado = await call(`${base}/payments`, { method: 'POST', token, body: { customerId: cliente.id, amountMinor: 9900000 } });
    assert.equal(demasiado.code, 'PAYMENT_EXCEEDS_BALANCE');
    assert.equal((await call(`${base}/sales/${sale.id}/void`, { method: 'POST', token, body: { reason: 'prueba' } })).status, 200, 'sin cobros aplicados, se puede anular');
    assert.equal((await ok(`${base}/customers/${cliente.id}`, { token })).customer.balanceMinor, 0);
});

/* ------------------------------------------------------------------ *
 * Quién puede qué
 * ------------------------------------------------------------------ */

let luis;    // colaborador
let marta;   // operaciones
let caja;    // cobros

test('el propietario da acceso a su gente, cada quien con su papel', async () => {
    const base = `/tenants/${TALLER}/members`;
    const invite = (email, name, role, position) => ok(base, { method: 'POST', token: taller.owner.token, body: { email, name, role, position } });
    const invited = await invite(`luis-${suffix}@ejemplo.test`, 'Luis Vega', 'staff', 'Mecánico');
    assert.equal(invited.member.existed, false);
    await invite(`marta-${suffix}@ejemplo.test`, 'Marta Rojas', 'operations', 'Bodega');
    await invite(`caja-${suffix}@ejemplo.test`, 'Rosa Mena', 'collections', 'Caja');
    const repetida = await call(base, { method: 'POST', token: taller.owner.token, body: { email: `luis-${suffix}@ejemplo.test`, role: 'staff' } });
    assert.equal(repetida.status, 409);
    assert.equal(repetida.code, 'ALREADY_MEMBER');

    luis = await activate(`luis-${suffix}@ejemplo.test`);
    marta = await activate(`marta-${suffix}@ejemplo.test`);
    caja = await activate(`caja-${suffix}@ejemplo.test`);
    const me = await ok('/me', { token: luis.token });
    assert.equal(me.role, 'business');
    assert.deepEqual(me.tenants[0].capabilities, ['process.read', 'process.run']);
    const { members } = await ok(base, { token: taller.owner.token });
    assert.deepEqual(members.map(row => [row.name, row.role, row.position]).filter(row => row[1] !== 'owner'),
        [['Luis Vega', 'staff', 'Mecánico'], ['Marta Rojas', 'operations', 'Bodega'], ['Rosa Mena', 'collections', 'Caja']]);
});

test('un colaborador no ve el dinero del negocio', async () => {
    for (const path of ['/products', '/sales', '/customers', '/receivables', '/erp/summary', '/margins', '/movements']) {
        const response = await call(`/tenants/${TALLER}${path}`, { token: luis.token });
        assert.equal(response.status, 403, path);
        assert.equal(response.code, 'FORBIDDEN', path);
    }
    const venta = await call(`/tenants/${TALLER}/sales`, { method: 'POST', token: luis.token, body: { lines: [{ productId: filtro.id, quantityMilli: 1000 }] } });
    assert.equal(venta.status, 403);
});

test('quien despacha vende y cuenta la bodega, pero no ve costos ni márgenes', async () => {
    const base = `/tenants/${TALLER}`;
    const { products, totals } = await ok(`${base}/products`, { token: marta.token });
    assert.equal('costMinor' in products[0], false, 'el servidor quita el costo; no lo esconde la pantalla');
    assert.equal('marginBp' in products[0], false);
    assert.equal(totals.stockValueMinor, null);

    const { sale } = await ok(`${base}/sales`, { method: 'POST', token: marta.token, body: { lines: [{ productId: filtro.id, quantityMilli: 1000 }] } });
    assert.equal('costMinor' in sale, false);
    assert.equal('unitCostMinor' in sale.lines[0], false);
    assert.equal((await call(`${base}/margins`, { token: marta.token })).status, 403);
    assert.equal((await call(`${base}/erp/summary`, { token: marta.token })).status, 403);
    assert.equal((await call(`${base}/sales/${sale.id}/void`, { method: 'POST', token: marta.token, body: { reason: 'x' } })).status, 403, 'anular es del propietario');

    // Un cambio de precio hecho por quien no ve costos no borra el costo.
    await ok(`${base}/products/${filtro.id}`, { method: 'PATCH', token: marta.token, body: { priceMinor: 520000, costMinor: 1 } });
    const visto = (await ok(`${base}/products`, { token: taller.owner.token })).products.find(row => row.id === filtro.id);
    assert.equal(visto.costMinor, 340000);
    assert.equal(visto.priceMinor, 520000);
});

test('quien cobra registra cobros, no ventas ni inventario', async () => {
    const base = `/tenants/${TALLER}`;
    assert.equal((await call(`${base}/customers`, { token: caja.token })).status, 200);
    assert.equal((await call(`${base}/sales`, { token: caja.token })).status, 200);
    assert.equal((await call(`${base}/sales`, { method: 'POST', token: caja.token, body: { lines: [{ productId: filtro.id, quantityMilli: 1000 }] } })).status, 403);
    assert.equal((await call(`${base}/movements`, { method: 'POST', token: caja.token, body: { productId: filtro.id, type: 'waste', quantityMilli: 1000 } })).status, 403);
    assert.equal((await call(`${base}/members`, { method: 'POST', token: caja.token, body: { email: `intruso-${suffix}@ejemplo.test`, role: 'owner' } })).status, 403, 'nadie se nombra propietario a un amigo');
});

test('el negocio de al lado no existe, ni conociendo sus identificadores', async () => {
    await ok(`/admin/tenants/${PANADERIA}/periods`, { method: 'POST', token: staff.token, body: { period: 1 } });
    const beto = panaderia.owner.token;
    for (const path of ['/products', '/sales', `/sales/x`, `/customers/${cliente.id}`, '/erp/summary', '/reports', '/tasks', '/equipment']) {
        const response = await call(`/tenants/${TALLER}${path}`, { token: beto });
        assert.equal(response.status, 404, path);
        assert.equal(response.code, 'TENANT_NOT_FOUND', path);
    }
    // Un producto del taller no sirve en la panadería aunque se sepa su id.
    const ajeno = await call(`/tenants/${PANADERIA}/sales`, { method: 'POST', token: beto, body: { lines: [{ productId: filtro.id, quantityMilli: 1000 }] } });
    assert.equal(ajeno.status, 400);
    assert.equal(ajeno.code, 'INVALID_INPUT');
    assert.equal((await ok(`/tenants/${PANADERIA}/products`, { token: beto })).products.length, 0);
    assert.equal((await ok(`/tenants/${PANADERIA}/sales`, { token: beto })).sales.length, 0);
});

test('la administración de VALTRIX cobra y atiende, pero no lee la operación', async () => {
    for (const path of ['/products', '/sales', '/receivables', '/erp/summary']) {
        assert.equal((await call(`/tenants/${TALLER}${path}`, { token: staff.token })).status, 404, path);
    }
    const ficha = await ok(`/admin/tenants/${TALLER}`, { token: staff.token });
    assert.equal(ficha.subscription.paidPeriods, 1);
    assert.equal(ficha.periods.length, 1);
    assert.equal(ficha.periods[0].reference, 'SINPE 8841');
    assert.equal(ficha.owners[0].email, taller.owner.email);
    const texto = JSON.stringify(ficha);
    assert.equal(/salesMinor|costMinor|balanceMinor|Filtro|Solís/.test(texto), false, 'la ficha no trae ni una cifra del negocio');
});

/* ------------------------------------------------------------------ *
 * Mes 2: orden operativo
 * ------------------------------------------------------------------ */

let apertura;

test('el segundo pago abre las listas de tareas y los equipos', async () => {
    const settled = await ok(`/admin/tenants/${TALLER}/periods`, { method: 'POST', token: staff.token, body: { period: 2 } });
    assert.deepEqual(settled.unlocked, ['qms']);
    assert.equal(settled.subscription.currentPeriodEnd, time.addMonths(today, 2), 'el período nuevo empieza donde acaba el vigente');

    const base = `/tenants/${TALLER}`;
    const token = taller.owner.token;
    const created = await ok(`${base}/processes`, { method: 'POST', token, body: { name: 'Apertura del taller', area: 'Recepción', frequency: 'daily', weekdays: [1, 2, 3, 4, 5, 6, 7], steps: ['Encender el compresor', 'Revisar pedidos del día'] } });
    apertura = (await ok(`${base}/processes/${created.process.id}/status`, { method: 'POST', token, body: { status: 'published' } })).process;
    const privada = await ok(`${base}/processes`, { method: 'POST', token, body: { name: 'Arqueo de caja', frequency: 'daily', weekdays: [1, 2, 3, 4, 5, 6, 7], steps: ['Contar'], assignees: [taller.owner.uid] } });
    await ok(`${base}/processes/${privada.process.id}/status`, { method: 'POST', token, body: { status: 'published' } });

    // El colaborador ve su día y marca; no ve la pantalla donde se crean las listas.
    const plan = await ok(`${base}/tasks`, { token: luis.token });
    assert.deepEqual(plan.items.map(item => item.name), ['Apertura del taller'], 'la lista asignada a otra persona no le aparece');
    assert.equal((await ok(`${base}/tasks?all=1`, { token: luis.token })).items.length, 1, '«all» solo se respeta a quien administra');
    assert.equal((await ok(`${base}/tasks?all=1`, { token })).items.length, 2);
    assert.equal((await call(`${base}/processes`, { token: luis.token })).status, 403);

    const marcado = await ok(`${base}/tasks/toggle`, { method: 'POST', token: luis.token, body: { processId: apertura.id, stepId: apertura.steps[0].id } });
    assert.equal(marcado.item.done, 1);
    assert.equal(marcado.item.steps[0].doneByName, 'Luis Vega');
    const ajena = await call(`${base}/tasks/toggle`, { method: 'POST', token: luis.token, body: { processId: privada.process.id, stepId: privada.process.steps[0].id } });
    assert.equal(ajena.code, 'NOT_ASSIGNED');
});

test('dos personas marcando a la vez no pierden ningún paso', async () => {
    const base = `/tenants/${TALLER}/tasks`;
    await Promise.all([
        ok(`${base}/toggle`, { method: 'POST', token: luis.token, body: { processId: apertura.id, stepId: apertura.steps[0].id } }),
        ok(`${base}/toggle`, { method: 'POST', token: marta.token, body: { processId: apertura.id, stepId: apertura.steps[1].id } })
    ]);
    const item = (await ok(`${base}?all=1`, { token: taller.owner.token })).items.find(row => row.processId === apertura.id);
    assert.equal(item.status, 'done');
});

let elevador;

test('equipos y mantenimiento', async () => {
    const base = `/tenants/${TALLER}`;
    elevador = (await ok(`${base}/equipment`, { method: 'POST', token: marta.token, body: { name: 'Elevador de dos columnas', everyDays: 90, lastOn: time.addDays(today, -85) } })).equipment;
    assert.equal(elevador.status, 'due_soon');
    assert.equal(elevador.days, 5);
    assert.equal((await call(`${base}/equipment`, { method: 'POST', token: luis.token, body: { name: 'x' } })).status, 403);
    const resumen = await ok(`${base}/qms/summary?all=1`, { token: taller.owner.token });
    assert.equal(resumen.maintenance.dueSoon, 1);
    assert.equal(resumen.tasks.completed, 1);
});

/* ------------------------------------------------------------------ *
 * Mes 3: auditoría mensual
 * ------------------------------------------------------------------ */

test('el tercer pago abre la auditoría; el avance se ve, el mes en curso no se cierra', async () => {
    assert.equal((await call(`/tenants/${TALLER}/reports`, { token: taller.owner.token })).code, 'MODULE_LOCKED');
    const settled = await ok(`/admin/tenants/${TALLER}/periods`, { method: 'POST', token: staff.token, body: { period: 3 } });
    assert.deepEqual(settled.unlocked, ['audit']);

    const base = `/tenants/${TALLER}/reports`;
    const { report } = await ok(`${base}/preview`, { token: taller.owner.token });
    assert.equal(report.status, 'preview');
    assert.equal(report.sales.count, 3);
    assert.ok(report.operations, 'con el orden operativo abierto, el informe habla de listas y equipos');

    const prematuro = await call(`${base}/${time.periodOf(today)}`, { method: 'POST', token: taller.owner.token, body: {} });
    assert.equal(prematuro.status, 409);
    assert.equal(prematuro.code, 'PERIOD_NOT_FINISHED');
    assert.equal((await call(`${base}/preview`, { token: marta.token })).status, 403, 'el informe es del propietario');
    assert.equal((await call(`${base}/${time.periodOf(today)}`, { method: 'POST', token: marta.token, body: {} })).status, 403);
});

test('el cron cierra el mes, avisa del mantenimiento y lo envía a los propietarios', async () => {
    const mailer = fakeMailer();
    const cronEnv = { ...env, EMAIL: mailer, MAIL_FROM: 'avisos@valtrix.test' };
    // El día 4 del mes siguiente: ya pasaron los días de gracia.
    const next = time.shiftPeriod(time.periodOf(today), 1);
    const now = () => new Date(`${next}-04T16:00:00Z`);

    const first = await runScheduled(cronEnv, { now, db });
    assert.equal(first.errors, 0);
    assert.ok(first.reports >= 1);
    assert.ok(first.alerts >= 1);

    const period = time.periodOf(today);
    const { report } = await ok(`/tenants/${TALLER}/reports/${period}`, { token: taller.owner.token });
    assert.equal(report.status, 'final');
    assert.equal(report.sales.count, 3);
    assert.equal(report.sales.totalMinor, 1000000 + 2000000 + 500000, 'dos filtros, unas pastillas y el filtro que vendió Marta antes de subir el precio');

    const propios = mailer.sent.filter(message => message.to === taller.owner.email);
    const cierre = propios.find(message => message.subject.startsWith('Cierre de'));
    assert.ok(cierre, 'el propietario recibe el cierre');
    assert.match(cierre.subject, /Taller Horizonte/);
    assert.match(cierre.html, /Para el mes siguiente/);
    assert.match(cierre.html, new RegExp(`/cuenta#/informes/${period}`));
    assert.equal(TUTEO.test(cierre.text), false);
    assert.ok(propios.some(message => /Mantenimiento/.test(message.subject) && /Elevador de dos columnas/.test(message.html)));
    assert.equal(mailer.sent.some(message => message.to === staff.email), false, 'un correo con cifras del negocio no va a VALTRIX');

    // Emitido el cierre, el mes ya no se reescribe.
    const tarde = await call(`/tenants/${TALLER}/reports/${period}`, { method: 'POST', token: taller.owner.token, body: {} });
    assert.equal(tarde.code, 'PERIOD_NOT_FINISHED', 'para el reloj real el mes sigue en curso: el cierre lo emitió el reloj del cron');

    // Una segunda pasada el mismo día no repite ni el cierre ni el aviso.
    const sentBefore = mailer.sent.length;
    const second = await runScheduled(cronEnv, { now, db });
    assert.equal(second.reports, 0);
    assert.equal(second.alerts, 0);
    assert.equal(mailer.sent.length, sentBefore);

    const log = await db.query('mailLog', { where: [['tenantId', '==', TALLER]], limit: 50 });
    assert.ok(log.length >= 2);
    assert.ok(log.every(row => row.status === 'sent' && row.transport === 'cloudflare'));
});

test('sin buzón configurado, el correo se omite y queda dicho', async () => {
    // Cinco meses después, sin que nadie haya liquidado más períodos.
    const later = time.shiftPeriod(time.periodOf(today), 5);
    const summary = await runScheduled(env, { now: () => new Date(`${later}-20T16:00:00Z`), db });
    assert.equal(summary.errors, 0);
    assert.equal(summary.mailed, 0);
    assert.ok(summary.pastDue >= 1, 'un período vencido sin renovar pasa a pago vencido');
    const log = await db.query('mailLog', { where: [['tenantId', '==', TALLER]], limit: 100 });
    assert.ok(log.some(row => row.status === 'skipped' && row.error === 'NO_TRANSPORT'));
    // Pago vencido no es suspensión: el negocio sigue registrando.
    const ficha = await ok(`/tenants/${TALLER}`, { token: taller.owner.token });
    assert.equal(ficha.subscription.state, 'past_due');
    assert.equal((await call(`/tenants/${TALLER}/sales`, { method: 'POST', token: taller.owner.token, body: { lines: [{ productId: filtro.id, quantityMilli: 1000 }] } })).status, 200);
});

test('un negocio suspendido consulta todo y no registra nada', async () => {
    await ok(`/admin/tenants/${TALLER}/subscription`, { method: 'POST', token: staff.token, body: { state: 'suspended', reason: 'falta de pago' } });
    const base = `/tenants/${TALLER}`;
    const token = taller.owner.token;
    for (const path of ['/products', '/sales', '/receivables', '/erp/summary', '/tasks', '/equipment', '/reports']) {
        assert.equal((await call(`${base}${path}`, { token })).status, 200, path);
    }
    const venta = await call(`${base}/sales`, { method: 'POST', token, body: { lines: [{ productId: filtro.id, quantityMilli: 1000 }] } });
    assert.equal(venta.status, 402);
    assert.equal(venta.code, 'SUBSCRIPTION_SUSPENDED');
    assert.equal((await call(`${base}/tasks/toggle`, { method: 'POST', token: luis.token, body: { processId: apertura.id, stepId: apertura.steps[0].id } })).status, 402);
    // Volver a pagar es volver a `active`, no reincorporar al cliente.
    const settled = await ok(`/admin/tenants/${TALLER}/periods`, { method: 'POST', token: staff.token, body: { period: 4 } });
    assert.equal(settled.subscription.state, 'active');
    assert.equal((await call(`${base}/sales`, { method: 'POST', token, body: { lines: [{ productId: filtro.id, quantityMilli: 1000 }] } })).status, 200);
});

/* ------------------------------------------------------------------ *
 * Captación e incorporación
 * ------------------------------------------------------------------ */

test('un prospecto avanza por sus etapas y se convierte en negocio', async () => {
    const { lead } = await ok('/admin/leads', { method: 'POST', token: staff.token, body: { business: 'Clínica Vet Prado', contactName: 'Carla Prado', phone: '8888-2222', sector: 'veterinaria', source: 'conocido', note: 'La atiende a mi perra.' } });
    assert.equal(lead.stage, 'new');
    const avanzado = await ok(`/admin/leads/${lead.id}`, { method: 'PATCH', token: staff.token, body: { stage: 'demo', nextActionOn: time.addDays(today, 3), nextAction: 'Llamar para saber si le interesó', note: 'Vio la demo. Le gustó la cartera.' } });
    assert.equal(avanzado.lead.notes.length, 2, 'las notas se acumulan: son el historial');
    assert.equal((await call(`/admin/leads/${lead.id}`, { method: 'PATCH', token: staff.token, body: { stage: 'inventada' } })).status, 400);
    assert.equal((await call('/admin/leads', { token: taller.owner.token })).status, 403, 'la libreta de VALTRIX no es de ningún negocio');

    const id = `vet-prado-${suffix}`;
    await ok('/admin/tenants', { method: 'POST', token: staff.token, body: { id, name: 'Clínica Vet Prado', ownerEmail: `carla-${suffix}@ejemplo.test`, sector: 'veterinaria', leadId: lead.id } });
    const { leads } = await ok('/admin/leads', { token: staff.token });
    const ganado = leads.find(row => row.id === lead.id);
    assert.equal(ganado.stage, 'won');
    assert.equal(ganado.tenantId, id);

    const overview = await ok('/admin/overview', { token: staff.token });
    assert.ok(overview.tenants.mrrMinor >= 12000 * 2 && overview.tenants.mrrMinor % 12000 === 0, 'el ingreso mensual es US$120 por negocio que paga');
    assert.equal(overview.tenants.currency, 'USD');
    assert.ok(overview.leads.won >= 1);
});

test('una administradora que además es propietaria no deja de administrar', async () => {
    const id = `demo-${suffix}`;
    await ok('/admin/tenants', { method: 'POST', token: staff.token, body: { id, name: 'Negocio de demostración', ownerEmail: staff.email } });
    // Definir la contraseña invalida las sesiones anteriores de esa cuenta,
    // como en producción: desde aquí la administradora usa la nueva.
    staff = { ...staff, token: (await activate(staff.email)).token };
    const me = await ok('/me', { token: staff.token });
    assert.equal(me.role, 'admin');
    assert.ok(me.tenants.some(row => row.id === id && row.role === 'owner'));
});

const FORMULARIO = {
    business: { name: 'Panadería Trigal', sector: 'panaderia', contactName: 'Beto', phone: '8888-3333' },
    products: [
        { code: 'BAG', name: 'Baguette', kind: 'Producto', unit: 'unidad', cost: '450', price: '900', stock: '80', min: '20' },
        { name: 'Harina', kind: 'Producto', unit: 'kg', cost: '₡620,50', price: '0', stock: '37,5', min: '25' },
        { name: 'Pedido especial', kind: 'Servicio', price: '15 000' }
    ],
    debtors: [{ name: 'Soda La Esquina', phone: '8888-4444', amount: '₡86.000', since: '01/10/2026', due: '15/10/2026' }],
    team: [
        { name: 'Nora Díaz', position: 'Hornera', email: `nora-${suffix}@ejemplo.test`, access: 'Colaborador' },
        { name: 'Don Tito', position: 'Repartidor', email: '', access: 'No' }
    ],
    processes: [{ name: 'Encendido de hornos', area: 'Producción', frequency: 'Todos los días', responsible: 'Nora', steps: '1. Revisar el gas\n2. Encender\n3. Anotar la temperatura' }],
    equipment: [{ name: 'Horno rotativo', location: 'Producción', everyDays: '60', lastOn: time.addDays(today, -70) }]
};

let enlace;

test('el dueño llena el formulario con su enlace, sin iniciar sesión', async () => {
    const creado = await ok(`/admin/tenants/${PANADERIA}/intake`, { method: 'POST', token: staff.token, body: {} });
    enlace = creado.token;
    assert.match(creado.path, /^\/incorporacion#[A-Za-z0-9_-]{30,}$/, 'el token viaja en el fragmento, no en la dirección');
    assert.equal((await db.query('intakeTokens', { where: [['tenantId', '==', PANADERIA]] })).some(row => JSON.stringify(row).includes(enlace)), false, 'en la base queda la huella, no el token');

    const abierto = await ok('/intake', { headers: { 'x-intake-token': enlace } });
    assert.equal(abierto.business, 'Panadería Trigal');
    assert.equal(abierto.status, 'draft');
    assert.deepEqual(abierto.data.products, []);

    // Un enlace inventado responde igual que uno vencido: no se sabe cuál fue.
    const inventado = await call('/intake', { headers: { 'x-intake-token': 'x'.repeat(40) } });
    assert.equal(inventado.status, 404);
    assert.equal(inventado.code, 'INTAKE_NOT_FOUND');
    assert.equal((await call('/intake', { headers: { 'x-intake-token': 'corto' } })).code, 'INTAKE_NOT_FOUND');
    assert.equal((await call('/intake')).code, 'INTAKE_NOT_FOUND', 'sin token, tampoco');

    const vacio = await call('/intake/submit', { method: 'POST', body: {}, headers: { 'x-intake-token': enlace } });
    assert.equal(vacio.code, 'INTAKE_EMPTY');

    await ok('/intake', { method: 'PUT', body: { data: { ...FORMULARIO, products: FORMULARIO.products.slice(0, 1) } }, headers: { 'x-intake-token': enlace } });
    assert.equal((await ok('/intake', { headers: { 'x-intake-token': enlace } })).data.products[0].cost, '450', 'al volver encuentra lo que escribió, tal como lo escribió');
    await ok('/intake', { method: 'PUT', body: { data: FORMULARIO }, headers: { 'x-intake-token': enlace } });
    const enviado = await ok('/intake/submit', { method: 'POST', body: {}, headers: { 'x-intake-token': enlace } });
    assert.deepEqual(enviado.counts, { products: 3, debtors: 1, team: 2, processes: 1, equipment: 1 });
    assert.equal((await call('/intake', { method: 'PUT', body: { data: FORMULARIO }, headers: { 'x-intake-token': enlace } })).code, 'INTAKE_LOCKED');
});

test('VALTRIX revisa lo recibido, lo devuelve si hace falta y lo carga', async () => {
    const base = `/admin/tenants/${PANADERIA}/intake`;
    const recibido = await ok(base, { token: staff.token });
    assert.equal(recibido.status, 'submitted');
    assert.equal(recibido.data.products[1].costMinor, 62050);
    assert.ok(recibido.issues.some(row => row.section === 'products' && /Harina/.test(row.message)), 'la harina no tiene precio de venta, y lo dice');
    assert.equal((await call(base, { token: panaderia.owner.token })).status, 403);

    // Devolverlo deja escribir otra vez con el mismo enlace.
    await ok(`${base}/reopen`, { method: 'POST', token: staff.token, body: {} });
    assert.equal((await call(`${base}/apply`, { method: 'POST', token: staff.token, body: {} })).code, 'INTAKE_NOT_SUBMITTED');
    await ok('/intake/submit', { method: 'POST', body: { data: { ...FORMULARIO, products: FORMULARIO.products.map(row => (row.name === 'Harina' ? { ...row, price: '900' } : row)) } }, headers: { 'x-intake-token': enlace } });

    const cargado = await ok(`${base}/apply`, { method: 'POST', token: staff.token, body: {} });
    assert.deepEqual(cargado.created, { products: 3, customers: 1, openingBalances: 1, processes: 1, equipment: 1 });
    assert.deepEqual(cargado.invited.map(row => [row.name, row.role]), [['Nora Díaz', 'staff']]);
    assert.equal(cargado.pendingAccess, 1, 'a quien no trajo correo no se le crea cuenta');
    assert.equal((await call(`${base}/apply`, { method: 'POST', token: staff.token, body: {} })).code, 'INTAKE_ALREADY_APPLIED');

    // Sellado: la administración ya no ve lo que el dueño escribió, y el enlace muere.
    const sellado = await ok(base, { token: staff.token });
    assert.equal(sellado.status, 'applied');
    assert.equal('data' in sellado, false);
    assert.equal(/Baguette|Soda La Esquina/.test(JSON.stringify(sellado)), false);
    assert.equal((await call('/intake', { headers: { 'x-intake-token': enlace } })).code, 'INTAKE_NOT_FOUND');
});

test('lo cargado es el negocio del dueño, listo para usarse', async () => {
    const base = `/tenants/${PANADERIA}`;
    const token = panaderia.owner.token;
    const { products, totals } = await ok(`${base}/products`, { token });
    assert.deepEqual(products.map(row => row.name).sort(), ['Baguette', 'Harina', 'Pedido especial']);
    assert.equal(products.find(row => row.name === 'Harina').onHandMilli, 37500);
    assert.equal(totals.stockValueMinor, 80 * 45000 + 2326875, '80 baguettes a ₡450 y 37,5 kg a ₡620,50');
    const cartera = await ok(`${base}/receivables`, { token });
    assert.equal(cartera.totalMinor, 8600000);
    assert.equal(cartera.customers[0].name, 'Soda La Esquina');
    assert.equal((await ok(`${base}/sales`, { method: 'POST', token, body: { lines: [{ productId: products.find(row => row.name === 'Baguette').id, quantityMilli: 6000 }] } })).sale.number, 'V-000001');
    assert.equal((await ok(`/admin/tenants/${PANADERIA}`, { token: staff.token })).onboarding.status, 'applied');

    // Las listas y los equipos entraron, y esperan a que se abra su módulo.
    assert.equal((await call(`${base}/tasks`, { token })).code, 'MODULE_LOCKED');
    await ok(`/admin/tenants/${PANADERIA}/periods`, { method: 'POST', token: staff.token, body: { period: 2 } });
    const nora = await activate(`nora-${suffix}@ejemplo.test`);
    // Una lista diaria cargada del formulario va de lunes a sábado, así que se
    // mira el próximo lunes: la prueba no puede depender del día en que corre.
    const monday = time.addDays(today, ((8 - time.weekdayOf(today)) % 7) || 7);
    const plan = await ok(`${base}/tasks?date=${monday}`, { token: nora.token });
    assert.deepEqual(plan.items.map(item => [item.name, item.total]), [['Encendido de hornos', 3]], 'el segundo pago es un clic, no una tarde publicando listas');
    const { equipment } = await ok(`${base}/equipment`, { token });
    assert.deepEqual(equipment.map(row => [row.name, row.status]), [['Horno rotativo', 'overdue']]);
});

/* ------------------------------------------------------------------ *
 * Bordes del API
 * ------------------------------------------------------------------ */

test('una cuenta sin relación no llega a nada', async () => {
    const suelta = await makeUser(`suelta-${suffix}@ejemplo.test`);
    assert.equal((await call(`/tenants/${TALLER}/products`, { token: suelta.token })).code, 'NO_ROLE');
    assert.equal((await call(`/tenants/${TALLER}/products`)).status, 401);
    assert.equal((await call(`/admin/jobs/run`, { method: 'POST', token: staff.token, body: {} })).status, 403, 'disparar la pasada a mano es de desarrollo');
});

test('una escritura desde otro origen se rechaza', async () => {
    const guarded = { ...env, ALLOWED_ORIGINS: 'https://valtrix.danielalonzzo.workers.dev' };
    const body = { lines: [{ productId: filtro.id, quantityMilli: 1000 }] };
    const ajeno = await call(`/tenants/${TALLER}/sales`, { method: 'POST', token: taller.owner.token, body, origin: 'https://otro-sitio.example', using: guarded });
    assert.equal(ajeno.status, 403);
    assert.equal(ajeno.code, 'BAD_ORIGIN');
    const propio = await call(`/tenants/${TALLER}/sales`, { method: 'POST', token: taller.owner.token, body, origin: 'https://valtrix.danielalonzzo.workers.dev', using: guarded });
    assert.equal(propio.status, 200);
});
