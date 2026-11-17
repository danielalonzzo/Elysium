/**
 * Un negocio ficticio para enseñar el sistema: «Taller Horizonte».
 *
 * No es una tabla de números pegada a una pantalla. Es un taller que **vive
 * diez semanas dentro del motor real**: cada día el reloj avanza, se compra,
 * se vende, se fía, se cobra, se marca la lista de apertura y se le da
 * mantenimiento al compresor, con las mismas funciones que usa un negocio de
 * verdad. Al terminar, los cierres de los meses pasados están emitidos y el
 * mes en curso va por donde va hoy.
 *
 * Por eso la demo no puede enseñar algo que el sistema no haga: lo que se ve
 * —el margen negativo de la correa, la cartera vencida, la mercadería
 * quieta— lo calculó el motor, no quien escribió este fichero.
 *
 * Tres cosas deliberadas:
 *
 *   · **Todo es inventado**, y los nombres lo son a propósito: ni un cliente
 *     real, ni un proveedor real, ni un colaborador real.
 *
 *   · **El azar tiene semilla.** El mismo día, la demo es idéntica para todo
 *     el que la abra; si no, dos personas mirando «la misma» pantalla verían
 *     cifras distintas.
 *
 *   · **Los datos cuentan una historia que el informe sabe leer:** un producto
 *     que se vende por debajo de su costo, otro con margen mínimo, uno que no
 *     se mueve, un cliente que concentra la cartera y un equipo con el
 *     mantenimiento vencido. Son los hallazgos que un dueño reconoce.
 *
 * Lo usan la demo del navegador (almacén en memoria) y el entorno local de
 * desarrollo (emuladores), con el mismo código.
 */

import * as audit from './audit.js';
import * as erp from './erp.js';
import * as qms from './qms.js';
import { engineScope } from './store.js';
import { addDays, businessDay, firstDay, periodOf, shiftPeriod, weekdayOf } from './time.js';

export const DEMO_TENANT = Object.freeze({ id: 'taller-horizonte', name: 'Taller Horizonte', timezone: 'America/Costa_Rica', baseCurrency: 'CRC', sector: 'taller' });

/** La gente del taller. La persona que visita la demo entra como la propietaria. */
export const DEMO_PEOPLE = Object.freeze({
    owner: { uid: 'demo-ana', name: 'Ana Mora', email: 'ana@taller-horizonte.example', role: 'owner', position: 'Propietaria' },
    mechanic: { uid: 'demo-luis', name: 'Luis Vega', email: 'luis@taller-horizonte.example', role: 'staff', position: 'Mecánico' },
    warehouse: { uid: 'demo-marta', name: 'Marta Rojas', email: 'marta@taller-horizonte.example', role: 'operations', position: 'Bodega y mostrador' },
    cashier: { uid: 'demo-rosa', name: 'Rosa Mena', email: 'rosa@taller-horizonte.example', role: 'collections', position: 'Caja y cobros' }
});

const colones = amount => amount * 100;
const units = amount => Math.round(amount * 1000);

/** Días de historia que se simulan antes de hoy. */
const HISTORY_DAYS = 74;

const PRODUCTS = [
    // [clave, código, nombre, unidad, costo, precio, mínimo, existencia inicial, peso de venta]
    ['filtroAceite', 'FIL-001', 'Filtro de aceite', 'unidad', 3400, 5000, 8, 30, 10],
    ['filtroAire', 'FIL-002', 'Filtro de aire', 'unidad', 4200, 6500, 6, 18, 5],
    ['aceite', 'ACE-020', 'Aceite 20W-50', 'litro', 2800, 4200, 20, 90, 9],
    ['sintetico', 'ACE-530', 'Aceite sintético 5W-30', 'litro', 5600, 8200, 12, 48, 5],
    ['pastillas', 'PAS-014', 'Pastillas de freno delanteras', 'par', 16400, 20000, 4, 12, 4],
    // Se vende por debajo de lo que cuesta: es el hallazgo que abre los ojos.
    ['correa', 'COR-220', 'Correa auxiliar', 'unidad', 13000, 12500, 2, 14, 3],
    ['bujia', 'BUJ-004', 'Bujía de iridio', 'unidad', 4500, 7000, 8, 32, 4],
    ['bateria', 'BAT-045', 'Batería 45 Ah', 'unidad', 38000, 52000, 2, 6, 2],
    // Margen mínimo: 5 %.
    ['liquido', 'LIQ-001', 'Líquido de frenos', 'unidad', 3800, 4000, 6, 20, 3],
    ['llanta', 'LLA-175', 'Llanta 175/70 R13', 'unidad', 26000, 34000, 4, 12, 2],
    // No se mueve: plata quieta en la bodega.
    ['amortiguador', 'AMO-110', 'Amortiguador trasero', 'unidad', 21000, 29500, 2, 6, 0]
];

const SERVICES = [
    ['cambioAceite', 'SER-ACE', 'Cambio de aceite', 8000, 9],
    ['frenos', 'SER-FRE', 'Revisión de frenos', 12000, 4],
    ['alineado', 'SER-ALI', 'Alineado y balanceo', 15000, 4],
    ['escaner', 'SER-DIA', 'Diagnóstico por escáner', 10000, 3]
];

/** Lo que se suele llevar junto: un cambio de aceite arrastra aceite y filtro. */
const BUNDLES = {
    cambioAceite: [['aceite', 4], ['filtroAceite', 1]],
    frenos: [['pastillas', 1], ['liquido', 1]]
};

const CUSTOMERS = [
    ['solis', 'Transportes Solís', '8801-2030', 15],
    ['roble', 'Ferretería El Roble', '8802-4050', 30],
    ['taxis', 'Taxis Unidos de Heredia', '8803-6070', 15],
    ['vega', 'Constructora Vega', '8804-8090', 30],
    ['marta', 'Marta Jiménez', '8805-1011', 8]
];

/** Generador con semilla (mulberry32): mismo día, misma demo. */
function seeded(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6D2B79F5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function weightedPick(random, entries) {
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let target = random() * total;
    for (const entry of entries) {
        target -= entry.weight;
        if (target <= 0) return entry;
    }
    return entries.at(-1);
}

/**
 * Llena el almacén de un negocio con diez semanas de vida.
 *
 * `people` permite dar los uid reales cuando las cuentas existen (el entorno
 * local, con el emulador de autenticación); sin él se usan los de la demo y
 * se escriben también sus membresías.
 */
export async function seedDemo({ store, tenant = DEMO_TENANT, people = DEMO_PEOPLE, writeMembers = true, now = new Date(), days = HISTORY_DAYS }) {
    const today = businessDay(now, tenant.timezone);
    const start = addDays(today, -days);
    const random = seeded(20261107);
    let instant = new Date(now);

    const scopeFor = person => engineScope({ store, tenant, actor: { uid: person.uid, name: person.name }, now: () => new Date(instant) });
    const owner = scopeFor(people.owner);
    const warehouse = scopeFor(people.warehouse);
    const cashier = scopeFor(people.cashier);
    const mechanic = scopeFor(people.mechanic);
    /** Las 10 de la mañana en Costa Rica de ese día, más unos minutos. */
    const at = (day, minutes = 0) => { instant = new Date(Date.parse(`${day}T16:00:00Z`) + minutes * 60000); };

    if (writeMembers) {
        await store.commit(Object.values(people).map(person => store.write.set('members', person.uid, {
            uid: person.uid, name: person.name, email: person.email, position: person.position, role: person.role,
            capabilities: [], status: 'active', createdAt: `${start}T16:00:00.000Z`, createdBy: 'demo'
        })));
    }

    /* ---------- El primer día: catálogo, clientes, listas y equipos ---------- */

    at(start);
    const product = {};
    for (const [key, code, name, unit, cost, price, min, opening, weight] of PRODUCTS) {
        product[key] = { ...(await erp.createProduct(owner, { code, name, unit, kind: 'good', costMinor: colones(cost), priceMinor: colones(price), minStockMilli: units(min), openingStockMilli: units(opening) })).product, weight, cost };
    }
    for (const [key, code, name, price, weight] of SERVICES) {
        product[key] = { ...(await erp.createProduct(owner, { code, name, kind: 'service', costMinor: 0, priceMinor: colones(price) })).product, weight };
    }
    const customer = {};
    for (const [key, name, phone, creditDays] of CUSTOMERS) {
        customer[key] = (await erp.createCustomer(owner, { name, phone, creditDays })).customer;
    }
    // Lo que ya debían antes de entrar al sistema. El de la constructora lleva meses.
    await erp.createOpeningBalance(owner, { customerId: customer.vega.id, amountMinor: colones(486000), date: addDays(start, -70), dueDate: addDays(start, -40), note: 'Flotilla: mantenimiento de julio' });
    await erp.createOpeningBalance(owner, { customerId: customer.taxis.id, amountMinor: colones(124000), date: addDays(start, -12), dueDate: addDays(start, 3) });

    const makeList = async input => (await qms.setProcessStatus(owner, (await qms.saveProcess(owner, null, input)).process.id, 'published')).process;
    const apertura = await makeList({
        name: 'Apertura del taller', area: 'Recepción', frequency: 'daily', purpose: 'Que el taller esté listo para recibir el primer vehículo.',
        steps: ['Encender el compresor y revisar la presión', 'Revisar las citas y los pedidos del día', 'Confirmar existencias de aceites y filtros', 'Barrer las bahías y despejar los accesos']
    });
    const cierre = await makeList({
        name: 'Cierre de caja', area: 'Caja', frequency: 'daily', assignees: [people.cashier.uid], purpose: 'Que el efectivo y los comprobantes cuadren con lo vendido.',
        steps: ['Contar el efectivo', 'Cuadrar SINPE y tarjetas con los comprobantes', 'Anotar las ventas a crédito del día', 'Guardar el efectivo y apagar el datáfono']
    });
    const limpieza = await makeList({
        name: 'Limpieza profunda de bahías', area: 'Taller', frequency: 'weekly', weekdays: [6], assignees: [people.mechanic.uid],
        steps: ['Recoger aceite usado y llevarlo al depósito', 'Lavar el piso de las bahías', 'Ordenar la herramienta en su tablero']
    });
    await makeList({
        name: 'Recepción de un vehículo', area: 'Recepción', frequency: 'on_demand', purpose: 'Que el cliente y el taller vean lo mismo antes de empezar.',
        steps: ['Anotar el kilometraje y el nivel de combustible', 'Revisar golpes y rayones con el cliente', 'Confirmar el trabajo pedido y el teléfono de contacto', 'Entregar la orden firmada']
    });

    // Los equipos entran con su último mantenimiento conocido, anterior al
    // primer día. Lo que les pase después ocurre dentro de la historia: al
    // compresor se le da su revisión dos veces y la tercera se le pasa; al
    // elevador le toca la semana que viene.
    const equipment = {};
    for (const [key, name, location, everyDays, lastOffset] of [
        ['compresor', 'Compresor de aire', 'Cuarto de máquinas', 30, -(days + 19)],
        ['elevador', 'Elevador de dos columnas', 'Bahía 1', 90, -83],
        ['alineadora', 'Alineadora', 'Bahía 3', 180, -100],
        ['gato', 'Gato hidráulico de patín', 'Bahía 2', 60, -100],
        ['escaner', 'Escáner OBD', 'Oficina', null, null]
    ]) {
        equipment[key] = (await qms.saveEquipment(owner, null, {
            name, location, everyDays, lastOn: lastOffset === null ? null : addDays(today, Math.min(lastOffset, -days))
        })).equipment;
    }
    /** Mantenimientos que ocurren por el camino: [días antes de hoy, equipo, tipo, qué se hizo, costo, quién]. */
    const maintenance = [
        [63, 'compresor', 'preventive', 'Purga del tanque, cambio de filtro y revisión de correas', 14000, 'Luis Vega'],
        [40, 'gato', 'preventive', 'Cambio de aceite hidráulico y revisión de sellos', 18000, 'Luis Vega'],
        [33, 'compresor', 'preventive', 'Purga del tanque y cambio de filtro', 12000, 'Luis Vega'],
        [19, 'elevador', 'corrective', 'Cambio de una manguera hidráulica con fuga', 42000, 'Servicio técnico externo']
    ].filter(([offset]) => offset < days);

    /* ---------- Los días ---------- */

    const goods = Object.values(product).filter(row => row.kind === 'good');
    const menu = Object.entries(product).filter(([, row]) => row.weight > 0).map(([key, row]) => ({ key, weight: row.weight }));
    const onHand = Object.fromEntries(goods.map(row => [row.id, row.onHandMilli]));
    const creditCustomers = ['solis', 'roble', 'taxis', 'marta'];
    let closed = periodOf(start);

    for (let day = start; day <= today; day = addDays(day, 1)) {
        const weekday = weekdayOf(day);

        // El día 3 se emite el cierre del mes anterior, como lo haría el cron.
        if (Number(day.slice(8, 10)) === 3 && periodOf(day) > closed && shiftPeriod(periodOf(day), -1) >= periodOf(start)) {
            at(day, -120);
            await audit.generateReport(owner, shiftPeriod(periodOf(day), -1), { modules: { qms: true } });
            closed = periodOf(day);
        }
        for (const [offset, key, type, description, cost, performedBy] of maintenance) {
            if (day !== addDays(today, -offset)) continue;
            at(day, 120);
            await qms.registerMaintenance(warehouse, equipment[key].id, { type, description, costMinor: colones(cost), performedBy });
        }
        if (weekday === 7) continue;
        const isToday = day === today;

        // Reposición de los lunes: lo que está por debajo del doble del mínimo.
        if (weekday === 1 && !isToday) {
            at(day, -30);
            for (const row of goods) {
                if (row.weight === 0 || onHand[row.id] > row.minStockMilli * 2) continue;
                const quantity = row.minStockMilli * 3;
                // El proveedor de pastillas sube el precio a media historia.
                const bump = row.code === 'PAS-014' && day > addDays(start, 30) ? 1.06 : 1;
                await erp.recordMovement(warehouse, { productId: row.id, type: 'purchase', quantityMilli: quantity, unitCostMinor: Math.round(colones(row.cost) * bump), note: 'Pedido semanal' });
                onHand[row.id] += quantity;
            }
        }

        // Ventas del día. El sábado se vende menos; hoy, solo lo de la mañana.
        const count = isToday ? 2 : (weekday === 6 ? 2 : 3) + Math.floor(random() * 3);
        for (let index = 0; index < count; index += 1) {
            at(day, index * 47 + Math.floor(random() * 20));
            const lines = new Map();
            const want = (key, quantity) => {
                const row = product[key];
                if (row.kind === 'good' && onHand[row.id] - (lines.get(row.id) || 0) < units(quantity)) return;
                lines.set(row.id, (lines.get(row.id) || 0) + units(quantity));
            };
            const picks = 1 + Math.floor(random() * 2);
            for (let pick = 0; pick < picks; pick += 1) {
                const { key } = weightedPick(random, menu);
                want(key, product[key].unit === 'litro' ? 1 + Math.floor(random() * 4) : 1);
                for (const [extra, quantity] of BUNDLES[key] || []) want(extra, quantity);
            }
            if (!lines.size) continue;
            const credit = random() < 0.24;
            const who = credit ? creditCustomers[Math.floor(random() * creditCustomers.length)] : null;
            await erp.createSale(credit ? cashier : warehouse, {
                lines: [...lines].map(([productId, quantityMilli]) => ({ productId, quantityMilli })),
                ...(credit
                    ? { term: 'credit', customerId: customer[who].id }
                    : { term: 'cash', method: ['efectivo', 'sinpe', 'sinpe', 'tarjeta'][Math.floor(random() * 4)] })
            });
            for (const [productId, quantityMilli] of lines) if (productId in onHand) onHand[productId] -= quantityMilli;
        }

        // Cobros de los viernes: los que pagan, pagan; la constructora, no.
        if (weekday === 5 && !isToday) {
            at(day, 300);
            for (const key of ['solis', 'roble', 'marta', 'taxis']) {
                const { open } = await erp.getCustomer(cashier, customer[key].id);
                const due = open.filter(row => row.dueDate <= addDays(day, key === 'taxis' ? -10 : 4));
                const amount = due.reduce((sum, row) => sum + row.balanceMinor, 0);
                if (amount > 0) await erp.recordPayment(cashier, { customerId: customer[key].id, amountMinor: amount, method: 'transferencia', reference: `TRF ${day.replace(/-/g, '').slice(2)}` });
            }
        }

        // Una merma de vez en cuando.
        if (!isToday && random() < 0.05 && onHand[product.aceite.id] > units(6)) {
            at(day, 200);
            await erp.recordMovement(warehouse, { productId: product.aceite.id, type: 'waste', quantityMilli: units(2), note: 'Envase roto en bodega' });
            onHand[product.aceite.id] -= units(2);
        }

        // Las listas. La apertura se cumple casi siempre; el cierre de caja, menos.
        const mark = async (scope, list, howMany) => {
            for (const step of list.steps.slice(0, howMany)) await qms.toggleStep(scope, { processId: list.id, stepId: step.id });
        };
        at(day, -60);
        if (isToday) {
            await mark(mechanic, apertura, 3);
        } else {
            await mark(mechanic, apertura, random() < 0.9 ? apertura.steps.length : 2);
            at(day, 480);
            if (random() < 0.68) await mark(cashier, cierre, cierre.steps.length);
            else if (random() < 0.5) await mark(cashier, cierre, 2);
            if (weekday === 6 && random() < 0.75) await mark(mechanic, limpieza, limpieza.steps.length);
        }
    }

    instant = new Date(now);
    return { tenant, people, today, start, firstPeriod: periodOf(start), products: Object.keys(product).length, customers: Object.keys(customer).length };
}

/** El primer día del mes en que empieza la historia, para quien necesite saberlo. */
export const demoStart = (now = new Date(), timezone = DEMO_TENANT.timezone) => firstDay(periodOf(addDays(businessDay(now, timezone), -HISTORY_DAYS)));
