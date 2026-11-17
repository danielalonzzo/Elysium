/**
 * Auditoría mensual e incorporación, en memoria.
 *
 *   node --test test/audit.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import * as audit from '../../../VALTRIX Engineering/js/core/audit.js';
import * as erp from '../../../VALTRIX Engineering/js/core/erp.js';
import * as intake from '../../../VALTRIX Engineering/js/core/intake.js';
import * as qms from '../../../VALTRIX Engineering/js/core/qms.js';
import { TUTEO, codeOf, world } from './world.mjs';

/**
 * Un octubre completo de un taller: lo que se vendió, lo que se quedó quieto,
 * quién debe y qué se dejó de hacer. Luego el reloj pasa a noviembre.
 */
async function octubre() {
    const w = world({ now: '2026-09-28T16:00:00Z' });
    const make = async input => (await erp.createProduct(w.scope, input)).product;
    w.filtro = await make({ code: 'FIL-001', name: 'Filtro de aceite', costMinor: 340000, priceMinor: 500000, minStockMilli: 5000, openingStockMilli: 60000 });
    w.pastillas = await make({ code: 'PAS-014', name: 'Pastillas de freno', costMinor: 1640000, priceMinor: 2000000, minStockMilli: 4000, openingStockMilli: 12000 });
    w.correa = await make({ code: 'COR-220', name: 'Correa auxiliar', costMinor: 1300000, priceMinor: 1250000, minStockMilli: 2000, openingStockMilli: 20000 });
    w.bujia = await make({ code: 'BUJ-004', name: 'Bujía de iridio', costMinor: 450000, priceMinor: 700000, minStockMilli: 4000, openingStockMilli: 40000 });
    w.liquido = await make({ code: 'LIQ-001', name: 'Líquido de frenos', costMinor: 380000, priceMinor: 400000, minStockMilli: 2000, openingStockMilli: 30000 });
    w.mano = await make({ code: 'SER-001', name: 'Cambio de aceite', kind: 'service', costMinor: 0, priceMinor: 800000 });
    w.solis = (await erp.createCustomer(w.scope, { name: 'Transportes Solís', creditDays: 15 })).customer;
    w.roble = (await erp.createCustomer(w.scope, { name: 'Ferretería El Roble', creditDays: 30 })).customer;

    // Septiembre: un mes más flojo, para que haya con qué comparar.
    await erp.createSale(w.scope, { lines: [{ productId: w.filtro.id, quantityMilli: 10000 }, { productId: w.mano.id, quantityMilli: 4000 }] });

    const sell = async (day, lines, extra = {}) => {
        w.at(`2026-10-${day}T16:00:00Z`);
        return (await erp.createSale(w.scope, { lines, ...extra })).sale;
    };
    await sell('03', [{ productId: w.filtro.id, quantityMilli: 20000 }, { productId: w.mano.id, quantityMilli: 12000 }]);
    await sell('08', [{ productId: w.pastillas.id, quantityMilli: 10000 }, { productId: w.correa.id, quantityMilli: 4000 }]);
    await sell('10', [{ productId: w.liquido.id, quantityMilli: 10000 }]);
    await sell('12', [{ productId: w.filtro.id, quantityMilli: 15000 }], { term: 'credit', customerId: w.solis.id });
    await sell('20', [{ productId: w.filtro.id, quantityMilli: 10000 }, { productId: w.mano.id, quantityMilli: 6000 }], { term: 'credit', customerId: w.roble.id });
    w.at('2026-10-22T16:00:00Z');
    await erp.recordMovement(w.scope, { productId: w.correa.id, type: 'waste', quantityMilli: 2000, note: 'Dañadas en bodega' });
    await erp.recordPayment(w.scope, { customerId: w.roble.id, amountMinor: 2000000 });
    return w;
}

/* ------------------------------------------------------------------ *
 * El cierre
 * ------------------------------------------------------------------ */

test('el mes en curso no se cierra', async () => {
    const w = await octubre();
    assert.equal(await codeOf(audit.generateReport(w.scope, '2026-10')), 'PERIOD_NOT_FINISHED');
    assert.equal(await codeOf(audit.generateReport(w.scope, '2026-13')), 'INVALID_INPUT');
});

test('el cierre dice los números del mes', async () => {
    const w = await octubre();
    w.at('2026-11-03T16:00:00Z');
    const { report } = await audit.generateReport(w.scope, '2026-10');
    assert.equal(report.status, 'final');
    assert.equal(report.label, 'octubre de 2026');
    assert.equal(report.asOf, '2026-11-03');
    // 45 filtros, 10 pastillas, 4 correas, 10 líquidos y 18 cambios de aceite.
    assert.equal(report.sales.totalMinor, 22500000 + 20000000 + 5000000 + 4000000 + 14400000);
    assert.equal(report.sales.costMinor, 15300000 + 16400000 + 5200000 + 3800000);
    assert.equal(report.sales.count, 5);
    assert.equal(report.sales.previous.totalMinor, 8200000);
    assert.equal(report.sales.creditMinor, 7500000 + 5000000 + 4800000);
    assert.equal(report.cash.collectedMinor, 2000000);
    assert.equal(report.inventory.wasteMinor, 2600000);
    assert.equal(report.days.total, 31);
    assert.equal(report.sales.daily.length, 31);
});

test('cada hallazgo sale de una regla y lleva su acción', async () => {
    const w = await octubre();
    w.at('2026-11-03T16:00:00Z');
    const { report } = await audit.generateReport(w.scope, '2026-10');
    const by = Object.fromEntries(report.findings.map(finding => [finding.code, finding]));

    assert.equal(by.SALES_UP.tone, 'good', 'vendió bastante más que en septiembre');
    assert.match(by.LOSING_PRODUCTS.title, /Correa auxiliar se vendió por debajo de su costo/);
    assert.equal(by.LOSING_PRODUCTS.impactMinor, 200000);
    assert.match(by.LOW_MARGIN.detail, /Líquido de frenos/);
    assert.match(by.BEST_PRODUCTS.title, /Cambio de aceite/);
    assert.match(by.DEAD_STOCK.title, /no se movió en todo el mes/);
    assert.match(by.DEAD_STOCK.detail, /Bujía de iridio/);
    assert.equal(by.DEAD_STOCK.impactMinor, 18000000, '40 bujías a ₡4 500');
    assert.match(by.STOCKOUT_RISK.detail, /Pastillas de freno/);
    assert.match(by.RECEIVABLES_OVERDUE.title, /ya está vencido/);
    assert.match(by.RECEIVABLES_OVERDUE.action, /Transportes Solís/);
    assert.equal(by.WASTE.impactMinor, 2600000);
    assert.equal('TASKS_LOW' in by, false, 'sin el módulo de orden operativo no se habla de listas');
    assert.equal(report.operations, null);

    // Lo urgente va primero, y las acciones son las de los hallazgos, en ese orden.
    const tones = report.findings.map(finding => finding.tone);
    assert.deepEqual(tones, [...tones].sort((a, b) => ['bad', 'warn', 'info', 'good'].indexOf(a) - ['bad', 'warn', 'info', 'good'].indexOf(b)));
    assert.ok(report.actions.length >= 3 && report.actions.length <= 5);
    assert.equal(report.actions[0], report.findings.find(finding => finding.action).action);
});

test('el informe va de usted, sin excepción', async () => {
    const w = await octubre();
    await qms.saveEquipment(w.scope, null, { name: 'Elevador', everyDays: 30, lastOn: '2026-08-01' });
    const { process } = await qms.saveProcess(w.scope, null, { name: 'Apertura', steps: ['Encender'] });
    await qms.setProcessStatus(w.scope, process.id, 'published');
    w.at('2026-11-03T16:00:00Z');
    const { report } = await audit.generateReport(w.scope, '2026-10', { modules: { qms: true } });
    const texts = report.findings.flatMap(finding => [finding.title, finding.detail, finding.action]).filter(Boolean);
    assert.ok(texts.length > 15);
    for (const text of texts) assert.equal(TUTEO.test(text), false, text);
});

test('el mismo mes da siempre el mismo informe', async () => {
    const w = await octubre();
    w.at('2026-11-03T16:00:00Z');
    const data = await audit.collect(w.scope, '2026-10');
    const once = audit.compose(data, { generatedAt: 'x' });
    const twice = audit.compose(structuredClone(data), { generatedAt: 'x' });
    assert.deepEqual(once, twice);
});

test('emitir el informe cierra el mes', async () => {
    const w = await octubre();
    w.at('2026-11-03T16:00:00Z');
    // Antes del cierre todavía se puede apuntar una venta de fin de mes…
    await erp.createSale(w.scope, { date: '2026-10-31', lines: [{ productId: w.filtro.id, quantityMilli: 1000 }] });
    await audit.generateReport(w.scope, '2026-10');
    // …y después, no.
    assert.equal(await codeOf(erp.createSale(w.scope, { date: '2026-10-31', lines: [{ productId: w.filtro.id, quantityMilli: 1000 }] })), 'PERIOD_CLOSED');
    assert.equal(await codeOf(audit.generateReport(w.scope, '2026-10')), 'PERIOD_CLOSED', 'un cierre se emite una sola vez');
    const guardado = (await audit.getReport(w.scope, '2026-10')).report;
    assert.equal(guardado.sales.count, 6);
    assert.equal('generatedBy' in guardado, false);
    assert.equal(await codeOf(audit.getReport(w.scope, '2026-09')), 'NOT_FOUND');
});

test('el cierre automático espera los días de gracia', async () => {
    const w = await octubre();
    w.at('2026-11-01T16:00:00Z');
    assert.equal(await audit.closeIfDue(w.scope), null, 'el día 1 todavía se están apuntando ventas del 31');
    w.at('2026-11-02T16:00:00Z');
    assert.equal(await audit.closeIfDue(w.scope), null);
    assert.deepEqual((await audit.listReports(w.scope)).pending, { period: '2026-10', label: 'octubre de 2026' });
    w.at('2026-11-03T16:00:00Z');
    const report = await audit.closeIfDue(w.scope);
    assert.equal(report.period, '2026-10');
    assert.equal(await audit.closeIfDue(w.scope), null, 'la segunda pasada del día no hace nada');
    const lista = await audit.listReports(w.scope);
    assert.equal(lista.pending, null);
    assert.deepEqual(lista.reports.map(row => row.period), ['2026-10']);
    assert.ok(lista.reports[0].urgent >= 1);
});

test('el avance del mes en curso no se guarda ni cierra nada', async () => {
    const w = await octubre();
    w.at('2026-10-25T16:00:00Z');
    const { report } = await audit.previewReport(w.scope);
    assert.equal(report.status, 'preview');
    assert.equal(report.until, '2026-10-25');
    assert.equal(report.days.elapsed, 25);
    assert.equal(report.sales.daily.length, 25);
    assert.ok(report.findings.some(finding => finding.code === 'SALES_PACE'));
    assert.equal((await audit.listReports(w.scope)).reports.length, 0);
    await erp.createSale(w.scope, { lines: [{ productId: w.filtro.id, quantityMilli: 1000 }] });
});

test('con el orden operativo abierto, el cierre habla de listas y equipos', async () => {
    const w = await octubre();
    w.at('2026-10-01T16:00:00Z');
    const { process } = await qms.saveProcess(w.scope, null, { name: 'Apertura del taller', steps: ['Encender el compresor', 'Revisar pedidos'] });
    await qms.setProcessStatus(w.scope, process.id, 'published');
    for (const day of ['01', '02', '03']) {
        w.at(`2026-10-${day}T16:00:00Z`);
        for (const step of process.steps) await qms.toggleStep(w.scope, { processId: process.id, stepId: step.id });
    }
    await qms.saveEquipment(w.scope, null, { name: 'Elevador', everyDays: 30, lastOn: '2026-09-01' });
    w.at('2026-11-03T16:00:00Z');
    const { report } = await audit.generateReport(w.scope, '2026-10', { modules: { qms: true } });
    assert.equal(report.operations.compliance.expected, 27, 'lunes a sábado de octubre');
    assert.equal(report.operations.compliance.completed, 3);
    assert.equal(report.operations.maintenance.overdue.length, 1);
    const codes = report.findings.map(finding => finding.code);
    assert.ok(codes.includes('TASKS_LOW'));
    assert.ok(codes.includes('MAINTENANCE_OVERDUE'));
});

test('un mes sin ventas lo dice en vez de inventar', async () => {
    const w = world({ now: '2026-11-05T16:00:00Z' });
    const { report } = await audit.generateReport(w.scope, '2026-10');
    assert.deepEqual(report.findings.map(finding => finding.code), ['NO_SALES']);
    assert.equal(report.sales.marginBp, null);
});

/* ------------------------------------------------------------------ *
 * Incorporación
 * ------------------------------------------------------------------ */

const FORMULARIO = {
    business: { name: 'Taller Horizonte', sector: 'taller', contactName: 'Ana Mora', phone: '8888-1111' },
    products: [
        { code: 'FIL-001', name: 'Filtro de aceite', kind: 'Producto', unit: 'unidades', cost: '₡3.400', price: '5 000', stock: '24', min: '5' },
        { code: '', name: 'Aceite 20W50', kind: '', unit: 'litros', cost: '2800,50', price: '4200', stock: '12,5', min: '4' },
        { code: 'SER-01', name: 'Cambio de aceite', kind: 'Servicio', unit: '', cost: '', price: '8000', stock: '', min: '' },
        { code: 'fil 001', name: 'Filtro repetido', kind: 'Producto', cost: '100', price: '200', stock: '1' },
        { name: '', price: '' },
        { name: 'Sin precio', kind: 'Producto', cost: 'abc', price: '' }
    ],
    debtors: [
        { name: 'Transportes Solís', phone: '8888-0000', amount: '₡240.000', since: '20/09/2026', due: '05/10/2026' },
        { name: 'transportes solís', amount: '60000', since: '2026-10-15' },
        { name: 'Sin monto', amount: 'mucho' }
    ],
    team: [
        { name: 'Luis Vega', position: 'Mecánico', email: 'luis@ejemplo.test', access: 'Colaborador' },
        { name: 'Marta Rojas', position: 'Caja', email: 'no-es-correo', access: 'Cobros' },
        { name: 'Don Beto', position: 'Mensajero', access: 'No' }
    ],
    processes: [
        { name: 'Apertura del taller', area: 'Recepción', frequency: 'Todos los días', responsible: 'Luis', steps: '1. Encender el compresor\n2) Revisar pedidos del día\n- Confirmar existencias\n\n' },
        { name: 'Sin pasos', steps: '' }
    ],
    equipment: [
        { name: 'Elevador de dos columnas', location: 'Bahía 1', everyDays: 'cada 90 días', lastOn: '23/08/2026' },
        { name: 'Compresor', everyDays: '', lastOn: '' }
    ]
};

test('las fechas y las tablas pegadas se entienden como las escribe la gente', () => {
    assert.equal(intake.parseDay('15/10/2026'), '2026-10-15');
    assert.equal(intake.parseDay('5-3-26'), '2026-03-05');
    assert.equal(intake.parseDay('2026-10-15'), '2026-10-15');
    assert.equal(intake.parseDay('31/02/2026'), null);
    assert.equal(intake.parseDay('ayer'), null);
    // Copiado de Excel: tabuladores y fila de encabezado.
    assert.deepEqual(intake.parseTable('Código\tNombre\tCosto\tPrecio\nFIL-001\tFiltro de aceite\t3400\t5000\n\nPAS-014\tPastillas\t16400\t20000\n'),
        [['FIL-001', 'Filtro de aceite', '3400', '5000'], ['PAS-014', 'Pastillas', '16400', '20000']]);
    // Un CSV exportado en Costa Rica: punto y coma, sin encabezado.
    assert.deepEqual(intake.parseTable('FIL-001;Filtro;3400;5000'), [['FIL-001', 'Filtro', '3400', '5000']]);
});

test('el formulario se limpia y dice qué no entendió, fila por fila', () => {
    const { data, issues, counts } = intake.normalize(FORMULARIO);
    assert.deepEqual(counts, { products: 5, debtors: 2, team: 3, processes: 1, equipment: 2 });
    assert.deepEqual(data.products[0], { code: 'FIL-001', name: 'Filtro de aceite', kind: 'good', unit: 'unidad', category: '', costMinor: 340000, priceMinor: 500000, stockMilli: 24000, minMilli: 5000 });
    assert.equal(data.products[1].costMinor, 280050);
    assert.equal(data.products[1].stockMilli, 12500);
    assert.equal(data.products[1].unit, 'litro');
    assert.equal(data.products[2].kind, 'service');
    assert.equal(data.products[3].code, '', 'un código repetido se descarta; el sistema pondrá otro');
    assert.deepEqual(data.debtors[0], { name: 'Transportes Solís', phone: '8888-0000', amountMinor: 24000000, since: '2026-09-20', due: '2026-10-05', note: '' });
    assert.deepEqual(data.team.map(row => row.access), ['staff', 'collections', 'none']);
    assert.deepEqual(data.processes[0].steps, ['Encender el compresor', 'Revisar pedidos del día', 'Confirmar existencias'], 'se quita la numeración que la persona puso');
    assert.equal(data.processes[0].frequency, 'daily');
    assert.equal(data.equipment[0].everyDays, 90);
    assert.equal(data.equipment[0].lastOn, '2026-08-23');

    const said = issues.map(row => `${row.section}:${row.row}:${row.message}`);
    assert.ok(said.some(text => text.startsWith('products:4:') && /repetido/.test(text)));
    assert.ok(said.some(text => text.startsWith('products:6:') && /costo/.test(text)));
    assert.ok(said.some(text => text.startsWith('debtors:3:')));
    assert.ok(said.some(text => text.startsWith('team:2:') && /correo/.test(text)));
    assert.ok(said.some(text => text.startsWith('processes:2:') && /pasos/.test(text)));
    assert.equal(said.some(text => text.startsWith('products:5:')), false, 'una fila vacía no es un error');
    for (const row of issues) assert.equal(TUTEO.test(row.message), false, row.message);
});

test('cargar el formulario deja el negocio funcionando', async () => {
    const w = world({ now: '2026-11-14T16:00:00Z' });
    const { data } = intake.normalize(FORMULARIO);
    const result = await intake.apply(w.scope, data, { batchId: 'lote1' });
    assert.deepEqual(result.created, { products: 5, customers: 1, openingBalances: 2, processes: 1, equipment: 2 });
    assert.equal(result.totals.receivablesMinor, 30000000);
    assert.equal(result.totals.stockValueMinor, 24 * 340000 + 3500625 + 10000, '24 filtros, 12,5 litros a ₡2 800,50 y el repetido');
    assert.deepEqual(result.team.filter(row => row.access !== 'none' && row.email), [{ name: 'Luis Vega', position: 'Mecánico', email: 'luis@ejemplo.test', access: 'staff' }]);

    // Productos con su existencia, y los códigos que faltaban ya puestos.
    const { products, totals } = await erp.listProducts(w.scope);
    assert.equal(products.length, 5);
    assert.deepEqual(products.map(row => row.code).sort(), ['FIL-001', 'P-0001', 'P-0002', 'P-0003', 'SER-01']);
    assert.equal(products.find(row => row.code === 'FIL-001').onHandMilli, 24000);
    assert.equal(totals.stockValueMinor, result.totals.stockValueMinor);
    assert.deepEqual((await erp.checkStock(w.scope)).mismatches, []);

    // Quien debía dos facturas es un solo cliente, con sus dos saldos.
    const cartera = await erp.receivables(w.scope);
    assert.equal(cartera.totalMinor, 30000000);
    assert.equal(cartera.customers.length, 1);
    assert.equal(cartera.customers[0].documents, 2);
    assert.equal(cartera.customers[0].phone, '8888-0000');
    assert.equal(cartera.overdueMinor, 30000000);
    assert.equal((await erp.periodStats(w.scope, '2026-09')).salesMinor, 0, 'un saldo anterior no es venta de ningún mes');

    // Y el sistema sigue desde ahí: se vende, se cobra y se numera.
    const filtro = products.find(row => row.code === 'FIL-001');
    assert.equal((await erp.createSale(w.scope, { lines: [{ productId: filtro.id, quantityMilli: 2000 }] })).sale.number, 'V-000001');
    await erp.recordPayment(w.scope, { customerId: cartera.customers[0].customerId, amountMinor: 24000000 });
    assert.equal((await erp.createProduct(w.scope, { name: 'Nuevo', priceMinor: 100 })).product.code, 'P-0004');

    // Las listas entran publicadas y los equipos, con su próxima fecha.
    const plan = await qms.dayPlan(w.scope, { all: true });
    assert.deepEqual(plan.items.map(item => [item.name, item.total]), [['Apertura del taller', 3]]);
    const { equipment } = await qms.listEquipment(w.scope);
    assert.deepEqual(equipment.map(row => [row.name, row.nextDueOn, row.status]), [['Elevador de dos columnas', '2026-11-21', 'due_soon'], ['Compresor', null, 'none']]);
});

test('cargar dos veces el mismo lote no duplica nada', async () => {
    const w = world({ now: '2026-11-14T16:00:00Z' });
    const { data } = intake.normalize(FORMULARIO);
    await intake.apply(w.scope, data, { batchId: 'lote1' });
    const antes = w.root.inspect();
    await intake.apply(w.scope, data, { batchId: 'lote1' });
    assert.deepEqual(w.root.inspect(), antes);
    assert.equal((await erp.receivables(w.scope)).totalMinor, 30000000);
    assert.deepEqual((await erp.checkStock(w.scope)).mismatches, []);
});

test('un código que el negocio ya usa no se pisa', async () => {
    const w = world({ now: '2026-11-14T16:00:00Z' });
    const propio = (await erp.createProduct(w.scope, { code: 'FIL-001', name: 'El que ya estaba', priceMinor: 999 })).product;
    const { data } = intake.normalize(FORMULARIO);
    const result = await intake.apply(w.scope, data, { batchId: 'lote2' });
    assert.equal(result.created.products, 4);
    assert.match(result.skipped[0].reason, /FIL-001/);
    assert.equal((await erp.listProducts(w.scope)).products.find(row => row.id === propio.id).name, 'El que ya estaba');
});

test('un formulario vacío no se carga', async () => {
    const w = world();
    assert.equal(await codeOf(intake.apply(w.scope, intake.normalize({}).data, { batchId: 'vacio' })), 'INTAKE_EMPTY');
});
