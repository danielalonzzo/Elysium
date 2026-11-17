/**
 * Dinero, calendario y almacén: las tres cosas de las que depende todo lo
 * demás. Corren en memoria, sin emuladores:
 *
 *   node --test test/core.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
    formatMoney, formatPercent, formatQuantity, marginBp, moneyInput, multiply, parseMoney, parseQuantity,
    quantityInput, weightedCost
} from '../../../VALTRIX Engineering/js/core/money.js';
import {
    addDays, businessDay, dayKey, dayLabel, daysInMonth, daysOf, diffDays, isDay, isPeriod, lastDay, periodLabel,
    periodOf, relativeDays, shiftPeriod, weekdayOf
} from '../../../VALTRIX Engineering/js/core/time.js';
import { memoryStore, scopedStore } from '../../../VALTRIX Engineering/js/core/store.js';
import { codeKey } from '../../../VALTRIX Engineering/js/core/validate.js';
import { MESSAGES } from '../../../VALTRIX Engineering/js/core/errors.js';
import { TUTEO } from './world.mjs';

/* ------------------------------------------------------------------ *
 * Dinero
 * ------------------------------------------------------------------ */

test('un importe escrito por una persona se vuelve un entero', () => {
    assert.equal(parseMoney('1500'), 150000);
    assert.equal(parseMoney('1 500,50'), 150050);
    assert.equal(parseMoney('₡1.500'), 150000, 'tres cifras tras el punto son miles, no decimales');
    assert.equal(parseMoney('1,500.75'), 150075);
    assert.equal(parseMoney('1.500,75'), 150075);
    assert.equal(parseMoney('US$120'), 12000);
    assert.equal(parseMoney('0,5'), 50);
    assert.equal(parseMoney('12.5'), 1250);
    assert.equal(parseMoney(''), null);
    assert.equal(parseMoney('abc'), null);
    assert.equal(parseMoney('-10'), null, 'un importe no es negativo salvo que se pida');
    assert.equal(parseMoney('-10', { allowNegative: true }), -1000);
    // 0,1 + 0,2 en coma flotante no da 0,3; en enteros, sí.
    assert.equal(parseMoney('0,10') + parseMoney('0,20'), parseMoney('0,30'));
});

test('el dinero se enseña con su moneda', () => {
    assert.equal(formatMoney(428000000, 'CRC'), '₡4 280 000');
    assert.equal(formatMoney(150050, 'CRC'), '₡1 500,50', 'un colón con céntimos no los esconde');
    assert.equal(formatMoney(12000, 'USD'), 'US$120,00');
    assert.equal(formatMoney(-24000000, 'CRC'), '−₡240 000');
    assert.equal(formatMoney(1.5, 'CRC'), '—', 'un decimal no es un importe');
    assert.equal(moneyInput(150050), '1500,50');
    assert.equal(parseMoney(moneyInput(150050)), 150050, 'lo que se enseña en un campo se vuelve a leer igual');
});

test('una cantidad admite decimales sin dejar de ser entera', () => {
    assert.equal(parseQuantity('24'), 24000);
    assert.equal(parseQuantity('12,5'), 12500);
    assert.equal(parseQuantity('0.250'), 250);
    assert.equal(parseQuantity('1 200'), 1200000);
    assert.equal(parseQuantity('1,2345'), null, 'cuatro decimales no caben en milésimas');
    assert.equal(formatQuantity(24000), '24');
    assert.equal(formatQuantity(12500), '12,5');
    assert.equal(formatQuantity(250), '0,25');
    assert.equal(parseQuantity(quantityInput(12500)), 12500);
});

test('cantidad por precio redondea al céntimo más cercano', () => {
    assert.equal(multiply(12500, 85000), 1062500);          // 12,5 × ₡850
    assert.equal(multiply(333, 100), 33);                   // 0,333 × ₡1 = ₡0,33
    assert.equal(multiply(335, 100), 34, 'la mitad se aleja de cero');
    assert.equal(multiply(-2000, 150000), -300000);
    // El producto intermedio se sale de 53 bits y el resultado sigue siendo
    // exacto: en coma flotante, este mismo cálculo se desvía.
    const exact = Number((123456789n * 9876543219n + 500n) / 1000n);
    assert.equal(multiply(123456789, 9876543219), exact);
    assert.equal(exact, 1219326312237464);
    // Y lo que no cabe exacto se rechaza en vez de guardarse aproximado.
    assert.throws(() => multiply(999999999, 9999999999999), { code: 'INVALID_INPUT' });
});

test('el costo promedio pondera lo que había con lo que entra', () => {
    assert.equal(weightedCost(10000, 100000, 10000, 120000), 110000);
    assert.equal(weightedCost(0, 0, 5000, 80000), 80000, 'sin existencia, el costo es el de la compra');
    assert.equal(weightedCost(3000, 100000, 1000, 100050), 100013);
});

test('el margen se mide sobre la venta', () => {
    assert.equal(marginBp(1000000, 680000), 3200);
    assert.equal(marginBp(1000000, 1040000), -400);
    assert.equal(marginBp(0, 0), null, 'sin ventas no hay margen que decir');
    assert.equal(formatPercent(3200), '32 %');
    assert.equal(formatPercent(-400), '−4 %');
    assert.equal(formatPercent(1250), '12,5 %');
    assert.equal(formatPercent(850, { signed: true }), '+8,5 %');
});

/* ------------------------------------------------------------------ *
 * Calendario
 * ------------------------------------------------------------------ */

test('el día es el del negocio, no el del servidor', () => {
    // Las 9 de la noche del 14 en Costa Rica ya son el 15 en UTC.
    const instant = new Date('2026-11-15T03:00:00Z');
    assert.equal(businessDay(instant, 'America/Costa_Rica'), '2026-11-14');
    assert.equal(businessDay(instant, 'Europe/Lisbon'), '2026-11-15');
});

test('la aritmética de fechas no depende de la zona de quien ejecuta', () => {
    assert.equal(addDays('2026-11-30', 1), '2026-12-01');
    assert.equal(addDays('2027-03-01', -1), '2027-02-28');
    assert.equal(addDays('2028-03-01', -1), '2028-02-29', 'año bisiesto');
    assert.equal(diffDays('2026-11-01', '2026-11-14'), 13);
    assert.equal(diffDays('2026-11-14', '2026-11-01'), -13);
    assert.equal(weekdayOf('2026-11-14'), 6, 'el 14 de noviembre de 2026 es sábado');
    assert.equal(weekdayOf('2026-11-15'), 7);
    assert.equal(periodOf('2026-11-14'), '2026-11');
    assert.equal(shiftPeriod('2026-11', 2), '2027-01');
    assert.equal(shiftPeriod('2026-01', -1), '2025-12');
    assert.equal(daysInMonth('2026-02'), 28);
    assert.equal(lastDay('2026-11'), '2026-11-30');
    assert.equal(daysOf('2026-11', '2026-11-03').length, 3);
    assert.equal(dayKey('2026-11-05'), 'd05');
});

test('una fecha imposible no pasa por fecha', () => {
    assert.equal(isDay('2026-02-30'), false);
    assert.equal(isDay('2026-11-14'), true);
    assert.equal(isDay('14/11/2026'), false);
    assert.equal(isPeriod('2026-13'), false);
    assert.equal(isPeriod('2026-11'), true);
});

test('las fechas se dicen como las diría una persona', () => {
    assert.equal(periodLabel('2026-11'), 'noviembre de 2026');
    assert.equal(dayLabel('2026-11-14'), '14 de noviembre de 2026');
    assert.equal(dayLabel('2026-11-14', { weekday: true }), 'sábado 14 de noviembre de 2026');
    assert.equal(dayLabel('2026-11-14', { short: true }), '14 nov');
    assert.equal(relativeDays('2026-11-14', '2026-11-21'), 'en 7 días');
    assert.equal(relativeDays('2026-11-14', '2026-11-11'), 'hace 3 días');
    assert.equal(relativeDays('2026-11-14', '2026-11-14'), 'hoy');
});

/* ------------------------------------------------------------------ *
 * Almacén
 * ------------------------------------------------------------------ */

test('crear dos veces el mismo documento es un conflicto', async () => {
    const store = memoryStore();
    await store.commit([store.write.create('products', 'a', { name: 'Filtro' })]);
    await assert.rejects(store.commit([store.write.create('products', 'a', { name: 'Otro' })]), { code: 'CONFLICT' });
    assert.equal((await store.get('products', 'a')).name, 'Filtro');
});

test('una escritura con precondición falla si alguien escribió antes', async () => {
    const store = memoryStore();
    await store.commit([store.write.create('stock', 'a', { onHandMilli: 2000 })]);
    const first = await store.get('stock', 'a');
    const second = await store.get('stock', 'a');
    await store.commit([store.write.update('stock', 'a', { onHandMilli: 1000 }, { updateTime: first._updateTime })]);
    await assert.rejects(
        store.commit([store.write.update('stock', 'a', { onHandMilli: 1000 }, { updateTime: second._updateTime })]),
        { code: 'CONFLICT' }
    );
    assert.equal((await store.get('stock', 'a')).onHandMilli, 1000, 'la segunda venta no descontó');
});

test('un commit entra entero o no entra', async () => {
    const store = memoryStore();
    await store.commit([store.write.create('counters', 'sales', { value: 1 })]);
    await assert.rejects(store.commit([
        store.write.create('sales', 's1', { totalMinor: 100 }),
        store.write.create('counters', 'sales', { value: 2 })     // ya existe: todo el commit cae
    ]), { code: 'CONFLICT' });
    assert.equal(await store.get('sales', 's1'), null, 'la venta no quedó a medias');
});

test('los incrementos suman sin leer antes, también en mapas anidados', async () => {
    const store = memoryStore();
    const add = () => store.commit([store.write.merge('stats', '2026-11', { period: '2026-11' }, {
        increments: { salesMinor: 500, 'byDay.d14.salesMinor': 500, 'byDay.d14.count': 1 }
    })]);
    await add();
    await add();
    const stats = await store.get('stats', '2026-11');
    assert.equal(stats.salesMinor, 1000);
    assert.deepEqual(stats.byDay, { d14: { salesMinor: 1000, count: 2 } });
    assert.equal(stats.period, '2026-11');
});

test('un commit no escribe dos veces el mismo documento', async () => {
    const store = memoryStore();
    await assert.rejects(store.commit([
        store.write.merge('stats', '2026-11', { period: '2026-11' }, { increments: { a: 1 } }),
        store.write.merge('stats', '2026-11', { period: '2026-11' }, { increments: { a: 1 } })
    ]), /STORE_DUPLICATE_WRITE/);
});

test('una fusión nombra al menos un campo y solo suma enteros', () => {
    const store = memoryStore();
    // En Firestore, una máscara vacía se parece demasiado a reemplazar el
    // documento entero. Los dos almacenes lo rechazan igual.
    assert.throws(() => store.write.merge('customers', 'c1', {}, { increments: { balanceMinor: 100 } }), /STORE_EMPTY_MERGE/);
    assert.throws(() => store.write.merge('customers', 'c1', { updatedAt: 'x' }, { increments: { balanceMinor: 1.5 } }), /STORE_BAD_INCREMENT/);
});

test('un documento leído no se vuelca tal cual en una escritura', async () => {
    const store = memoryStore();
    await store.commit([store.write.create('customers', 'c1', { name: 'Ana' })]);
    const row = await store.get('customers', 'c1');
    assert.throws(() => store.write.set('customers', 'c1', row), /STORE_RESERVED_FIELD/);
});

test('lo leído es una copia: cambiarlo no cambia lo guardado', async () => {
    const store = memoryStore();
    await store.commit([store.write.create('sales', 's1', { lines: [{ name: 'Filtro' }] })]);
    const row = await store.get('sales', 's1');
    row.lines[0].name = 'Cambiado';
    assert.equal((await store.get('sales', 's1')).lines[0].name, 'Filtro');
});

test('las consultas filtran, ordenan y cortan', async () => {
    const store = memoryStore();
    await store.commit([
        store.write.create('sales', 'a', { date: '2026-11-01', open: true, customerId: 'c1', totalMinor: 300 }),
        store.write.create('sales', 'b', { date: '2026-11-14', open: false, customerId: 'c1', totalMinor: 100 }),
        store.write.create('sales', 'c', { date: '2026-10-30', open: true, customerId: 'c2', totalMinor: 200 }),
        store.write.create('sales', 'd', { open: true, customerId: 'c2' })
    ]);
    const november = await store.query('sales', { where: [['date', '>=', '2026-11-01'], ['date', '<=', '2026-11-30']] });
    assert.deepEqual(november.map(row => row.id), ['a', 'b'], 'un documento sin fecha no entra en un rango');
    const open = await store.query('sales', { where: [['customerId', '==', 'c1'], ['open', '==', true]] });
    assert.deepEqual(open.map(row => row.id), ['a']);
    const ordered = await store.query('sales', { orderBy: [['totalMinor', 'desc']], limit: 2 });
    assert.deepEqual(ordered.map(row => row.id), ['a', 'c'], 'sin el campo de orden, el documento no sale');
    assert.equal(await store.count('sales', [['open', '==', true]]), 3);
    assert.deepEqual([...(await store.getMany('sales', ['a', 'zz', 'c'])).keys()], ['a', 'c']);
});

test('un almacén encerrado en un negocio no ve el de al lado', async () => {
    const root = memoryStore();
    const taller = scopedStore(root, 'tenants/taller');
    const panaderia = scopedStore(root, 'tenants/panaderia');
    await taller.commit([taller.write.create('products', 'p1', { name: 'Filtro de aceite' })]);
    await panaderia.commit([panaderia.write.create('products', 'p1', { name: 'Baguette' })]);
    assert.equal((await taller.get('products', 'p1')).name, 'Filtro de aceite');
    assert.equal((await panaderia.get('products', 'p1')).name, 'Baguette');
    assert.equal((await taller.query('products')).length, 1);
    assert.deepEqual(root.inspect(), { 'tenants/taller/products': 1, 'tenants/panaderia/products': 1 });
});

/* ------------------------------------------------------------------ *
 * Varios
 * ------------------------------------------------------------------ */

test('el código de un producto no distingue mayúsculas ni espacios', () => {
    assert.equal(codeKey('fil-001'), 'FIL-001');
    assert.equal(codeKey(' Fil 001 '), 'FIL-001');
    assert.equal(codeKey('Señal/7'), 'SENAL-7');
});

test('todo mensaje va de usted', () => {
    // Español de Costa Rica, trato formal: ni «tu cuenta», ni «puedes».
    for (const [code, message] of Object.entries(MESSAGES)) assert.equal(TUTEO.test(message), false, `${code}: «${message}»`);
});
