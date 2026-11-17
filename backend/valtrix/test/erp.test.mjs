/**
 * Control financiero, en memoria.
 *
 * Cubre lo que el negocio paga por saber —qué deja ganancia, qué hay en
 * bodega, quién debe— y las garantías que lo hacen creíble: la última unidad
 * no se vende dos veces, una venta entra entera o no entra, y un mes cerrado
 * no se reescribe.
 *
 *   node --test test/erp.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import * as erp from '../../../VALTRIX Engineering/js/core/erp.js';
import { codeOf, world } from './world.mjs';

/** Un taller con tres productos y un servicio. */
async function taller(options) {
    const w = world(options);
    const make = async input => (await erp.createProduct(w.scope, input)).product;
    w.filtro = await make({ code: 'FIL-001', name: 'Filtro de aceite', costMinor: 340000, priceMinor: 500000, minStockMilli: 5000, openingStockMilli: 24000 });
    w.pastillas = await make({ code: 'PAS-014', name: 'Pastillas de freno', costMinor: 1640000, priceMinor: 2000000, minStockMilli: 4000, openingStockMilli: 7000 });
    w.correa = await make({ code: 'COR-220', name: 'Correa auxiliar', costMinor: 1300000, priceMinor: 1250000, minStockMilli: 2000, openingStockMilli: 12000 });
    w.mano = await make({ name: 'Cambio de aceite', kind: 'service', costMinor: 0, priceMinor: 800000 });
    w.cliente = (await erp.createCustomer(w.scope, { name: 'Transportes Solís', phone: '8888-0000', creditDays: 15 })).customer;
    return w;
}

const stockOf = async (w, product) => (await w.store.get('stock', product.id)).onHandMilli;

/* ------------------------------------------------------------------ *
 * Productos
 * ------------------------------------------------------------------ */

test('un producto nace con su existencia inicial y su movimiento', async () => {
    const w = await taller();
    assert.equal(await stockOf(w, w.filtro), 24000);
    const { movements } = await erp.listMovements(w.scope, { productId: w.filtro.id });
    assert.equal(movements.length, 1);
    assert.equal(movements[0].type, 'opening');
    assert.equal(movements[0].balanceMilli, 24000);
    assert.equal(w.filtro.marginBp, 3200, 'margen de lista: (5000 − 3400) / 5000');
    assert.equal(w.filtro.stockValueMinor, 8160000, '24 unidades a ₡3 400');
});

test('un servicio no lleva existencias', async () => {
    const w = await taller();
    assert.equal(await w.store.get('stock', w.mano.id), null);
    assert.equal(w.mano.onHandMilli, null);
    assert.equal(await codeOf(erp.recordMovement(w.scope, { productId: w.mano.id, type: 'purchase', quantityMilli: 1000 })), 'NOT_STOCKED');
});

test('el código es único en el negocio, se escriba como se escriba', async () => {
    const w = await taller();
    assert.equal(await codeOf(erp.createProduct(w.scope, { code: 'fil 001', name: 'Otro filtro', priceMinor: 100 })), 'PRODUCT_CODE_TAKEN');
    // Sin código, el sistema pone el suyo y se salta los que ya están usados.
    assert.equal(w.mano.code, 'P-0001');
    await erp.createProduct(w.scope, { code: 'P-0002', name: 'Puesto a mano', priceMinor: 100 });
    const siguiente = (await erp.createProduct(w.scope, { name: 'Automático', priceMinor: 100 })).product;
    assert.equal(siguiente.code, 'P-0003');
});

test('cambiar el código libera el anterior', async () => {
    const w = await taller();
    await erp.updateProduct(w.scope, w.filtro.id, { code: 'FIL-002' });
    const nuevo = (await erp.createProduct(w.scope, { code: 'FIL-001', name: 'Filtro nuevo', priceMinor: 100 })).product;
    assert.equal(nuevo.code, 'FIL-001');
    assert.equal(await codeOf(erp.updateProduct(w.scope, nuevo.id, { code: 'fil-002' })), 'PRODUCT_CODE_TAKEN');
});

test('quien no ve costos no los recibe ni los puede pisar', async () => {
    const w = await taller();
    w.deny('cost.read');
    const { products, totals } = await erp.listProducts(w.scope);
    const filtro = products.find(row => row.id === w.filtro.id);
    assert.equal('costMinor' in filtro, false);
    assert.equal('marginBp' in filtro, false);
    assert.equal(totals.stockValueMinor, null);
    // Un cambio de precio hecho por quien no ve costos no borra el costo.
    await erp.updateProduct(w.scope, w.filtro.id, { priceMinor: 550000, costMinor: 0 });
    w.allow('cost.read');
    const despues = (await erp.listProducts(w.scope)).products.find(row => row.id === w.filtro.id);
    assert.equal(despues.costMinor, 340000);
    assert.equal(despues.priceMinor, 550000);
});

/* ------------------------------------------------------------------ *
 * Ventas
 * ------------------------------------------------------------------ */

test('una venta descuenta existencias, numera y acumula el mes', async () => {
    const w = await taller();
    const { sale } = await erp.createSale(w.scope, {
        term: 'cash', method: 'sinpe',
        lines: [
            { productId: w.filtro.id, quantityMilli: 2000 },
            { productId: w.mano.id, quantityMilli: 1000 }
        ]
    });
    assert.equal(sale.number, 'V-000001');
    assert.equal(sale.date, '2026-11-14', 'la fecha es la del negocio');
    assert.equal(sale.totalMinor, 1800000, '2 × ₡5 000 + ₡8 000');
    assert.equal(sale.costMinor, 680000);
    assert.equal(sale.marginBp, 6222);
    assert.equal(sale.balanceMinor, 0, 'de contado no queda saldo');
    assert.equal(await stockOf(w, w.filtro), 22000);

    const stats = await erp.periodStats(w.scope, '2026-11');
    assert.equal(stats.salesMinor, 1800000);
    assert.equal(stats.costMinor, 680000);
    assert.equal(stats.salesCount, 1);
    assert.equal(stats.cashSalesMinor, 1800000);
    assert.deepEqual(stats.byDay.d14, { salesMinor: 1800000, costMinor: 680000, count: 1 });

    const { products } = await erp.productMargins(w.scope, { period: '2026-11' });
    assert.deepEqual(products.map(row => [row.code, row.profitMinor]), [['P-0001', 800000], ['FIL-001', 320000]]);
});

test('el precio se puede cambiar en la línea; el costo se fija al vender', async () => {
    const w = await taller();
    const { sale } = await erp.createSale(w.scope, { lines: [{ productId: w.filtro.id, quantityMilli: 1000, unitPriceMinor: 450000 }] });
    assert.equal(sale.totalMinor, 450000);
    // El proveedor sube el precio después: el margen de la venta ya hecha no cambia.
    await erp.updateProduct(w.scope, w.filtro.id, { costMinor: 400000 });
    const again = (await erp.getSale(w.scope, sale.id)).sale;
    assert.equal(again.lines[0].unitCostMinor, 340000);
    assert.equal(again.costMinor, 340000);
});

test('no se vende lo que no hay', async () => {
    const w = await taller();
    const intento = erp.createSale(w.scope, { lines: [{ productId: w.pastillas.id, quantityMilli: 8000 }] });
    await assert.rejects(intento, error => error.code === 'STOCK_INSUFFICIENT' && error.extra.availableMilli === 7000);
    assert.equal(await stockOf(w, w.pastillas), 7000);
    assert.equal((await erp.listSales(w.scope)).sales.length, 0, 'la venta no quedó a medias');
    assert.equal((await erp.periodStats(w.scope, '2026-11')).salesMinor, 0);
});

test('la misma mercadería en dos líneas se descuenta una sola vez, sumada', async () => {
    const w = await taller();
    await erp.createSale(w.scope, { lines: [{ productId: w.pastillas.id, quantityMilli: 3000 }, { productId: w.pastillas.id, quantityMilli: 4000 }] });
    assert.equal(await stockOf(w, w.pastillas), 0);
    assert.equal(await codeOf(erp.createSale(w.scope, { lines: [{ productId: w.pastillas.id, quantityMilli: 1000 }] })), 'STOCK_INSUFFICIENT');
});

test('la última unidad no se vende dos veces', async () => {
    const w = await taller();
    await erp.recordMovement(w.scope, { productId: w.pastillas.id, type: 'adjustment', countedMilli: 3000 });
    // Cuatro cajas cobran a la vez una unidad cada una y solo hay tres.
    const results = await Promise.allSettled(Array.from({ length: 4 }, () =>
        erp.createSale(w.scope, { lines: [{ productId: w.pastillas.id, quantityMilli: 1000 }] })));
    const sold = results.filter(result => result.status === 'fulfilled').map(result => result.value.sale);
    const rejected = results.filter(result => result.status === 'rejected').map(result => result.reason.code);
    assert.equal(sold.length, 3);
    assert.deepEqual(rejected, ['STOCK_INSUFFICIENT']);
    assert.equal(await stockOf(w, w.pastillas), 0, 'la existencia no quedó negativa');
    assert.deepEqual(sold.map(sale => sale.number).sort(), ['V-000001', 'V-000002', 'V-000003'], 'ningún consecutivo se repite ni se salta');
    assert.deepEqual((await erp.checkStock(w.scope)).mismatches, [], 'la existencia cuadra con la suma de sus movimientos');
    assert.equal((await erp.periodStats(w.scope, '2026-11')).salesCount, 3);
});

test('anular devuelve la mercadería y descuenta el mes', async () => {
    const w = await taller();
    const { sale } = await erp.createSale(w.scope, { lines: [{ productId: w.filtro.id, quantityMilli: 4000 }] });
    assert.equal(await codeOf(erp.voidSale(w.scope, sale.id, {})), 'INVALID_INPUT', 'anular pide el motivo');
    const anulada = (await erp.voidSale(w.scope, sale.id, { reason: 'Se digitó dos veces' })).sale;
    assert.equal(anulada.status, 'void');
    assert.equal(await stockOf(w, w.filtro), 24000);
    const stats = await erp.periodStats(w.scope, '2026-11');
    assert.equal(stats.salesMinor, 0);
    assert.equal(stats.costMinor, 0);
    assert.equal(stats.salesCount, 0);
    assert.equal(stats.voidCount, 1);
    assert.equal((await erp.productMargins(w.scope, { period: '2026-11' })).products.length, 0);
    assert.equal(await codeOf(erp.voidSale(w.scope, sale.id, { reason: 'otra vez' })), 'DOCUMENT_CLOSED');
    assert.deepEqual((await erp.checkStock(w.scope)).mismatches, []);
    // El documento sigue ahí: anular no es borrar.
    assert.equal((await erp.listSales(w.scope)).sales[0].status, 'void');
});

/* ------------------------------------------------------------------ *
 * Crédito y cobros
 * ------------------------------------------------------------------ */

test('una venta a crédito necesita cliente y le deja saldo', async () => {
    const w = await taller();
    assert.equal(await codeOf(erp.createSale(w.scope, { term: 'credit', lines: [{ productId: w.filtro.id, quantityMilli: 1000 }] })), 'CUSTOMER_REQUIRED');
    const { sale } = await erp.createSale(w.scope, { term: 'credit', customerId: w.cliente.id, lines: [{ productId: w.filtro.id, quantityMilli: 10000 }] });
    assert.equal(sale.balanceMinor, 5000000);
    assert.equal(sale.dueDate, '2026-11-29', 'vence según los días de crédito del cliente');
    assert.equal(sale.open, true);
    assert.equal((await erp.getCustomer(w.scope, w.cliente.id)).customer.balanceMinor, 5000000);
    const stats = await erp.periodStats(w.scope, '2026-11');
    assert.equal(stats.creditSalesMinor, 5000000);
    assert.equal(stats.cashSalesMinor, 0);
});

test('un cobro cubre primero lo que vence antes', async () => {
    const w = await taller();
    const credit = quantityMilli => erp.createSale(w.scope, { term: 'credit', customerId: w.cliente.id, lines: [{ productId: w.filtro.id, quantityMilli }] });
    w.at('2026-11-02T16:00:00Z');
    const primera = (await credit(2000)).sale;          // ₡10 000, vence el 17
    w.at('2026-11-10T16:00:00Z');
    const segunda = (await credit(4000)).sale;          // ₡20 000, vence el 25
    w.at('2026-11-14T16:00:00Z');

    const { payment } = await erp.recordPayment(w.scope, { customerId: w.cliente.id, amountMinor: 1500000, method: 'transferencia', reference: 'TRF 0099' });
    assert.equal(payment.number, 'C-000001');
    assert.deepEqual(payment.allocations.map(row => [row.number, row.amountMinor]), [[primera.number, 1000000], [segunda.number, 500000]]);
    assert.equal((await erp.getSale(w.scope, primera.id)).sale.open, false);
    assert.equal((await erp.getSale(w.scope, segunda.id)).sale.balanceMinor, 1500000);
    assert.equal((await erp.getCustomer(w.scope, w.cliente.id)).customer.balanceMinor, 1500000);
    assert.equal((await erp.periodStats(w.scope, '2026-11')).collectedMinor, 1500000);
});

test('un cobro no puede superar lo que el cliente debe', async () => {
    const w = await taller();
    await erp.createSale(w.scope, { term: 'credit', customerId: w.cliente.id, lines: [{ productId: w.filtro.id, quantityMilli: 2000 }] });
    await assert.rejects(erp.recordPayment(w.scope, { customerId: w.cliente.id, amountMinor: 1000001 }),
        error => error.code === 'PAYMENT_EXCEEDS_BALANCE' && error.extra.balanceMinor === 1000000);
    const otro = (await erp.createCustomer(w.scope, { name: 'Sin deudas' })).customer;
    assert.equal(await codeOf(erp.recordPayment(w.scope, { customerId: otro.id, amountMinor: 100 })), 'NOTHING_TO_COLLECT');
});

test('el reparto explícito se respeta y no puede pasarse', async () => {
    const w = await taller();
    const credit = () => erp.createSale(w.scope, { term: 'credit', customerId: w.cliente.id, lines: [{ productId: w.filtro.id, quantityMilli: 2000 }] });
    const a = (await credit()).sale;
    const b = (await credit()).sale;
    assert.equal(await codeOf(erp.recordPayment(w.scope, {
        customerId: w.cliente.id, amountMinor: 500000, allocations: [{ saleId: b.id, amountMinor: 600000 }]
    })), 'PAYMENT_OVER_ALLOCATED', 'el reparto no suma más que el cobro');
    assert.equal(await codeOf(erp.recordPayment(w.scope, {
        customerId: w.cliente.id, amountMinor: 1200000, allocations: [{ saleId: b.id, amountMinor: 1100000 }]
    })), 'PAYMENT_OVER_ALLOCATED', 'ni más que el saldo del documento');
    await erp.recordPayment(w.scope, { customerId: w.cliente.id, amountMinor: 700000, allocations: [{ saleId: b.id, amountMinor: 700000 }] });
    assert.equal((await erp.getSale(w.scope, b.id)).sale.balanceMinor, 300000);
    assert.equal((await erp.getSale(w.scope, a.id)).sale.balanceMinor, 1000000, 'el otro documento no se tocó');
});

test('una venta con cobros no se anula hasta anular el cobro', async () => {
    const w = await taller();
    const { sale } = await erp.createSale(w.scope, { term: 'credit', customerId: w.cliente.id, lines: [{ productId: w.filtro.id, quantityMilli: 2000 }] });
    const { payment } = await erp.recordPayment(w.scope, { customerId: w.cliente.id, amountMinor: 400000 });
    assert.equal(await codeOf(erp.voidSale(w.scope, sale.id, { reason: 'error' })), 'HAS_PAYMENTS');
    await erp.voidPayment(w.scope, payment.id, { reason: 'El depósito no entró' });
    assert.equal((await erp.getSale(w.scope, sale.id)).sale.balanceMinor, 1000000);
    assert.equal((await erp.getCustomer(w.scope, w.cliente.id)).customer.balanceMinor, 1000000);
    assert.equal((await erp.periodStats(w.scope, '2026-11')).collectedMinor, 0);
    await erp.voidSale(w.scope, sale.id, { reason: 'error' });
    assert.equal((await erp.getCustomer(w.scope, w.cliente.id)).customer.balanceMinor, 0);
});

test('un saldo anterior al sistema se cobra, pero no es venta del mes', async () => {
    const w = await taller();
    const { sale } = await erp.createOpeningBalance(w.scope, { customerId: w.cliente.id, amountMinor: 24000000, date: '2026-09-20', dueDate: '2026-10-05' });
    assert.equal(sale.kind, 'opening');
    assert.equal(sale.number, 'SI-000001');
    assert.equal((await erp.periodStats(w.scope, '2026-09')).salesMinor, 0);
    assert.equal((await erp.getCustomer(w.scope, w.cliente.id)).customer.balanceMinor, 24000000);
    const cartera = await erp.receivables(w.scope);
    assert.equal(cartera.overdueMinor, 24000000);
    assert.equal(cartera.customers[0].daysOverdue, 40);
    await erp.recordPayment(w.scope, { customerId: w.cliente.id, amountMinor: 24000000 });
    assert.equal((await erp.receivables(w.scope)).totalMinor, 0);
});

test('la cartera se reparte por antigüedad', async () => {
    const w = await taller();
    const otro = (await erp.createCustomer(w.scope, { name: 'Ferretería El Roble' })).customer;
    await erp.createOpeningBalance(w.scope, { customerId: w.cliente.id, amountMinor: 100000, date: '2026-11-10', dueDate: '2026-11-20' });   // al día
    await erp.createOpeningBalance(w.scope, { customerId: w.cliente.id, amountMinor: 200000, date: '2026-10-01', dueDate: '2026-10-25' });   // 20 días
    await erp.createOpeningBalance(w.scope, { customerId: otro.id, amountMinor: 400000, date: '2026-07-01', dueDate: '2026-07-15' });        // 122 días
    const cartera = await erp.receivables(w.scope);
    assert.equal(cartera.totalMinor, 700000);
    assert.equal(cartera.overdueMinor, 600000);
    assert.deepEqual(cartera.buckets.map(row => [row.id, row.amountMinor]), [['current', 100000], ['d30', 200000], ['d60', 0], ['d90', 0], ['older', 400000]]);
    assert.deepEqual(cartera.customers.map(row => row.name), ['Ferretería El Roble', 'Transportes Solís'], 'primero quien más debe vencido');
});

/* ------------------------------------------------------------------ *
 * Inventario
 * ------------------------------------------------------------------ */

test('una compra con costo recalcula el costo promedio', async () => {
    const w = await taller();
    // 24 a ₡3 400 más 12 a ₡4 000 → 36 a ₡3 600.
    const { product } = await erp.recordMovement(w.scope, { productId: w.filtro.id, type: 'purchase', quantityMilli: 12000, unitCostMinor: 400000 });
    assert.equal(product.onHandMilli, 36000);
    assert.equal(product.costMinor, 360000);
    assert.equal((await erp.periodStats(w.scope, '2026-11')).purchasesMinor, 4800000);
    // La venta siguiente ya sale al costo nuevo.
    const { sale } = await erp.createSale(w.scope, { lines: [{ productId: w.filtro.id, quantityMilli: 1000 }] });
    assert.equal(sale.costMinor, 360000);
});

test('la merma no deja la bodega en negativo y queda valorada', async () => {
    const w = await taller();
    assert.equal(await codeOf(erp.recordMovement(w.scope, { productId: w.pastillas.id, type: 'waste', quantityMilli: 9000 })), 'STOCK_INSUFFICIENT');
    await erp.recordMovement(w.scope, { productId: w.pastillas.id, type: 'waste', quantityMilli: 2000, note: 'Caja mojada' });
    assert.equal(await stockOf(w, w.pastillas), 5000);
    assert.equal((await erp.periodStats(w.scope, '2026-11')).wasteMinor, 3280000);
});

test('el conteo dice cuánto hay y el sistema anota la diferencia', async () => {
    const w = await taller();
    const { movement } = await erp.recordMovement(w.scope, { productId: w.correa.id, type: 'adjustment', countedMilli: 10000, note: 'Conteo de fin de mes' });
    assert.equal(movement.quantityMilli, -2000);
    assert.equal(await stockOf(w, w.correa), 10000);
    assert.equal((await erp.recordMovement(w.scope, { productId: w.correa.id, type: 'adjustment', countedMilli: 10000 })).unchanged, true);
    assert.equal((await erp.listMovements(w.scope, { productId: w.correa.id })).movements.length, 2, 'un conteo que cuadra no deja movimiento');
});

test('el panel avisa de lo que está por agotarse', async () => {
    const w = await taller();
    await erp.createSale(w.scope, { lines: [{ productId: w.pastillas.id, quantityMilli: 4000 }] });   // quedan 3, mínimo 4
    await erp.recordMovement(w.scope, { productId: w.correa.id, type: 'adjustment', countedMilli: 0 }); // agotada
    const summary = await erp.erpSummary(w.scope);
    assert.equal(summary.stock.lowCount, 1);
    assert.equal(summary.stock.outCount, 1);
    assert.deepEqual(summary.stock.low.map(row => [row.code, row.out]), [['COR-220', true], ['PAS-014', false]]);
    // Un producto desactivado deja de contar como faltante.
    await erp.updateProduct(w.scope, w.correa.id, { active: false });
    assert.equal((await erp.erpSummary(w.scope)).stock.outCount, 0);
});

/* ------------------------------------------------------------------ *
 * Fechas y cierres
 * ------------------------------------------------------------------ */

test('no se registra con fecha de mañana', async () => {
    const w = await taller();
    assert.equal(await codeOf(erp.createSale(w.scope, { date: '2026-11-15', lines: [{ productId: w.filtro.id, quantityMilli: 1000 }] })), 'FUTURE_DATE');
});

test('un mes cerrado no se reescribe', async () => {
    const w = await taller();
    // Con fecha atrasada se puede registrar mientras el mes no esté cerrado…
    const atrasada = (await erp.createSale(w.scope, { date: '2026-10-28', lines: [{ productId: w.filtro.id, quantityMilli: 1000 }] })).sale;
    assert.equal((await erp.periodStats(w.scope, '2026-10')).salesMinor, 500000, 'la venta cuenta en el mes de su fecha');
    // …y deja de poderse cuando el informe de ese mes ya se emitió.
    await w.store.commit([w.store.write.create('reports', '2026-10', { status: 'final' })]);
    assert.equal(await codeOf(erp.createSale(w.scope, { date: '2026-10-30', lines: [{ productId: w.filtro.id, quantityMilli: 1000 }] })), 'PERIOD_CLOSED');
    assert.equal(await codeOf(erp.voidSale(w.scope, atrasada.id, { reason: 'tarde' })), 'PERIOD_CLOSED');
    assert.equal(await codeOf(erp.recordMovement(w.scope, { productId: w.filtro.id, type: 'waste', quantityMilli: 1000, date: '2026-10-31' })), 'PERIOD_CLOSED');
    // El mes en curso sigue abierto.
    await erp.createSale(w.scope, { lines: [{ productId: w.filtro.id, quantityMilli: 1000 }] });
});

/* ------------------------------------------------------------------ *
 * El panel
 * ------------------------------------------------------------------ */

test('el panel dice qué deja ganancia y qué pérdida', async () => {
    const w = await taller();
    await erp.createSale(w.scope, { lines: [{ productId: w.filtro.id, quantityMilli: 6000 }, { productId: w.correa.id, quantityMilli: 2000 }] });
    await erp.createSale(w.scope, { term: 'credit', customerId: w.cliente.id, lines: [{ productId: w.pastillas.id, quantityMilli: 2000 }] });
    const summary = await erp.erpSummary(w.scope);
    assert.equal(summary.sales.totalMinor, 9500000);
    assert.equal(summary.sales.profitMinor, 1580000);
    assert.equal(summary.sales.marginBp, 1663);
    assert.equal(summary.cashInMinor, 5500000, 'lo vendido de contado; el crédito todavía no entró');
    assert.equal(summary.receivables.totalMinor, 4000000);
    assert.deepEqual(summary.products.best.map(row => row.code), ['FIL-001', 'PAS-014', 'COR-220']);
    assert.deepEqual(summary.products.losing.map(row => [row.code, row.profitMinor]), [['COR-220', -100000]], 'la correa se vende por debajo de su costo');
    assert.equal(summary.stock.valueMinor, (18000 * 3400 + 5000 * 16400 + 10000 * 13000) * 100 / 1000);
    assert.equal(summary.daily.at(-1).salesMinor, 9500000);
    assert.equal(summary.daily.length, 14, 'la serie llega hasta hoy');
});

test('sin permiso de costos, el panel no trae márgenes', async () => {
    const w = await taller();
    await erp.createSale(w.scope, { lines: [{ productId: w.filtro.id, quantityMilli: 1000 }] });
    w.deny('cost.read');
    const summary = await erp.erpSummary(w.scope);
    assert.equal('profitMinor' in summary.sales, false);
    assert.equal('products' in summary, false);
    assert.equal('valueMinor' in summary.stock, false);
    assert.equal('costMinor' in summary.daily[0], false);
    const { sale } = await erp.getSale(w.scope, (await erp.listSales(w.scope)).sales[0].id);
    assert.equal('costMinor' in sale, false);
    assert.equal('unitCostMinor' in sale.lines[0], false);
});

test('dos negocios en la misma base no se mezclan', async () => {
    const uno = await taller();
    const dos = await taller({ tenantId: 'panaderia-trigal', root: uno.root });
    await erp.createSale(uno.scope, { lines: [{ productId: uno.filtro.id, quantityMilli: 1000 }] });
    assert.equal((await erp.listSales(dos.scope)).sales.length, 0);
    assert.equal((await erp.periodStats(dos.scope, '2026-11')).salesMinor, 0);
    // Un producto del otro negocio no existe aquí, aunque se sepa su identificador.
    assert.equal(await codeOf(erp.createSale(dos.scope, { lines: [{ productId: uno.filtro.id, quantityMilli: 1000 }] })), 'INVALID_INPUT');
    assert.equal((await erp.createSale(dos.scope, { lines: [{ productId: dos.filtro.id, quantityMilli: 1000 }] })).sale.number, 'V-000001', 'cada negocio lleva su consecutivo');
});
