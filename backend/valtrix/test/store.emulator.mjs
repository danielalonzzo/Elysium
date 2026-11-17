/**
 * El contrato del almacén, contra los dos almacenes.
 *
 * El motor corre sobre memoria en la demo y en las pruebas rápidas, y sobre
 * Firestore en producción. Todo lo que se prueba en memoria vale para
 * producción solo si los dos almacenes se comportan igual, y eso es lo que
 * comprueba este fichero: **el mismo examen, dos veces.** Si una diferencia
 * entre ambos se colara, una prueba verde en memoria no diría nada.
 *
 * Lo más delicado está aquí y no se ve en ningún otro sitio: que fusionar con
 * incrementos cree el documento si falta, conserve los demás campos si existe
 * y sume sin leer antes.
 *
 *   firebase emulators:exec --only auth,firestore --project demo-valtrix \
 *     "node --test test/store.emulator.mjs"
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { memoryStore, scopedStore } from '../../../VALTRIX Engineering/js/core/store.js';
import { tenantStore } from '../src/lib/store.js';
import { db, unique } from './emulator.mjs';

const stores = [
    ['memoria', () => scopedStore(memoryStore(), `tenants/contrato-${unique()}`)],
    ['Firestore', () => tenantStore(db, `contrato-${unique()}`)]
];

for (const [name, make] of stores) {
    test(`${name}: crear dos veces es un conflicto`, async () => {
        const store = make();
        await store.commit([store.write.create('products', 'a', { name: 'Filtro', priceMinor: 500000 })]);
        await assert.rejects(store.commit([store.write.create('products', 'a', { name: 'Otro' })]), { code: 'CONFLICT' });
        const row = await store.get('products', 'a');
        assert.equal(row.name, 'Filtro');
        assert.equal(row.priceMinor, 500000, 'un importe vuelve como entero');
        assert.equal(row.id, 'a');
        assert.deepEqual(Object.keys(row).filter(key => key.startsWith('_')), ['_updateTime'], 'el único campo propio del almacén es _updateTime');
        assert.equal(await store.get('products', 'no-existe'), null);
    });

    test(`${name}: la precondición impide escribir sobre lo que otro cambió`, async () => {
        const store = make();
        await store.commit([store.write.create('stock', 'a', { onHandMilli: 2000, minMilli: 1000 })]);
        const first = await store.get('stock', 'a');
        const second = await store.get('stock', 'a');
        await store.commit([store.write.update('stock', 'a', { onHandMilli: 1000 }, { updateTime: first._updateTime })]);
        await assert.rejects(store.commit([store.write.update('stock', 'a', { onHandMilli: 0 }, { updateTime: second._updateTime })]), { code: 'CONFLICT' });
        const row = await store.get('stock', 'a');
        assert.equal(row.onHandMilli, 1000);
        assert.equal(row.minMilli, 1000, 'actualizar un campo no borra los demás');
        await assert.rejects(store.commit([store.write.update('stock', 'no-existe', { onHandMilli: 1 })]), { code: 'CONFLICT' });
    });

    test(`${name}: un commit entra entero o no entra`, async () => {
        const store = make();
        await store.commit([store.write.create('counters', 'sales', { value: 1 })]);
        await assert.rejects(store.commit([
            store.write.create('sales', 's1', { totalMinor: 100 }),
            store.write.create('counters', 'sales', { value: 2 })
        ]), { code: 'CONFLICT' });
        assert.equal(await store.get('sales', 's1'), null);
    });

    test(`${name}: fusionar crea, conserva y suma sin leer`, async () => {
        const store = make();
        const add = amount => store.commit([store.write.merge('stats', '2026-11', { period: '2026-11' }, {
            increments: { salesMinor: amount, 'byDay.d14.salesMinor': amount, 'byDay.d14.count': 1 }
        })]);
        // El documento no existía: se crea.
        await add(500);
        // Dos a la vez: ninguna pisa a la otra, porque ninguna leyó.
        await Promise.all([add(300), add(200)]);
        let stats = await store.get('stats', '2026-11');
        assert.equal(stats.salesMinor, 1000);
        assert.deepEqual(stats.byDay, { d14: { salesMinor: 1000, count: 3 } });

        // Fusionar otro campo no toca lo acumulado, y restar es sumar en negativo.
        await store.commit([store.write.merge('stats', '2026-11', { note: 'anulación' }, { increments: { salesMinor: -200, voidCount: 1 } })]);
        stats = await store.get('stats', '2026-11');
        assert.equal(stats.salesMinor, 800);
        assert.equal(stats.voidCount, 1);
        assert.equal(stats.period, '2026-11', 'el campo que no se nombró sigue ahí');
        assert.equal(stats.byDay.d14.count, 3);

        // El caso que más importa: sumar al saldo de un cliente que ya existe
        // no le borra el nombre.
        await store.commit([store.write.create('customers', 'c1', { name: 'Transportes Solís', phone: '8888-0000', balanceMinor: 100 })]);
        await store.commit([store.write.merge('customers', 'c1', { updatedAt: 'ahora' }, { increments: { balanceMinor: 400 } })]);
        const customer = await store.get('customers', 'c1');
        assert.equal(customer.balanceMinor, 500);
        assert.equal(customer.name, 'Transportes Solís');
        assert.equal(customer.phone, '8888-0000');
    });

    test(`${name}: las consultas filtran por igualdad y por un rango`, async () => {
        const store = make();
        await store.commit([
            store.write.create('sales', 'a', { date: '2026-11-01', open: true, customerId: 'c1', totalMinor: 300 }),
            store.write.create('sales', 'b', { date: '2026-11-14', open: false, customerId: 'c1', totalMinor: 100 }),
            store.write.create('sales', 'c', { date: '2026-10-30', open: true, customerId: 'c2', totalMinor: 200 })
        ]);
        const november = await store.query('sales', { where: [['date', '>=', '2026-11-01'], ['date', '<=', '2026-11-30']] });
        assert.deepEqual(november.map(row => row.id).sort(), ['a', 'b']);
        const open = await store.query('sales', { where: [['customerId', '==', 'c1'], ['open', '==', true]] });
        assert.deepEqual(open.map(row => row.id), ['a']);
        const ordered = await store.query('sales', { orderBy: [['totalMinor', 'desc']], limit: 2 });
        assert.deepEqual(ordered.map(row => row.id), ['a', 'c']);
        assert.equal(await store.count('sales', [['open', '==', true]]), 2);
        assert.deepEqual([...(await store.getMany('sales', ['a', 'zz', 'c'])).keys()].sort(), ['a', 'c']);
        assert.equal((await store.query('nada')).length, 0);
    });

    test(`${name}: guarda mapas, listas y nulos tal cual`, async () => {
        const store = make();
        const sale = {
            number: 'V-000001', lines: [{ productId: 'p1', quantityMilli: 12500, totalMinor: 1062500 }], customerId: null,
            ref: { kind: 'sale', id: 's1' }, weekdays: [1, 2, 3], open: true, note: ''
        };
        await store.commit([store.write.set('sales', 's1', sale)]);
        const { id, _updateTime, ...read } = await store.get('sales', 's1');
        assert.deepEqual(read, sale);
        await store.commit([store.write.remove('sales', 's1')]);
        assert.equal(await store.get('sales', 's1'), null);
    });

    test(`${name}: lo que no se debe escribir, no se escribe`, async () => {
        const store = make();
        await store.commit([store.write.create('customers', 'c1', { name: 'Ana' })]);
        const row = await store.get('customers', 'c1');
        assert.throws(() => store.write.set('customers', 'c1', row), /STORE_RESERVED_FIELD/, 'un documento leído no se vuelca tal cual');
        assert.throws(() => store.write.merge('customers', 'c1', {}, { increments: { balanceMinor: 1 } }), /STORE_EMPTY_MERGE/);
        assert.throws(() => store.write.merge('customers', 'c1', { updatedAt: 'x' }, { increments: { balanceMinor: 0.5 } }), /STORE_BAD_INCREMENT/);
    });
}

test('dos negocios en la misma base de Firestore no se ven', async () => {
    const suffix = unique();
    const taller = tenantStore(db, `taller-${suffix}`);
    const panaderia = tenantStore(db, `panaderia-${suffix}`);
    await taller.commit([taller.write.create('products', 'p1', { name: 'Filtro de aceite' })]);
    await panaderia.commit([panaderia.write.create('products', 'p1', { name: 'Baguette' })]);
    assert.equal((await taller.get('products', 'p1')).name, 'Filtro de aceite');
    assert.equal((await panaderia.get('products', 'p1')).name, 'Baguette');
    assert.equal((await taller.query('products')).length, 1);
    // El almacén no acepta un identificador que intente salirse de su carpeta.
    assert.throws(() => tenantStore(db, 'a/../b'), /INVALID_TENANT_ID/);
});
