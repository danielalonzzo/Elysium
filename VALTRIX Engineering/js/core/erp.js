/**
 * Control financiero: productos, existencias, ventas, clientes y cobros.
 *
 * Responde las tres preguntas por las que un negocio paga el primer mes:
 * qué producto deja ganancia y cuál pérdida, cuánta mercadería queda en
 * bodega y quién debe plata.
 *
 * Cómo está hecho, que no se ve leyendo una función suelta:
 *
 *   · **`movements` es la verdad; `stock` es su proyección.** Cada entrada,
 *     salida o ajuste deja su movimiento, y la existencia se puede rehacer
 *     sumándolos (`checkStock`). Un descuadre es un error detectable.
 *
 *   · **La última unidad no se vende dos veces.** Confirmar una venta lee la
 *     existencia, calcula la que queda y escribe con la precondición de que
 *     nadie la tocó entre medias. Si alguien la tocó, se vuelve a leer y a
 *     validar; tras varios intentos responde STOCK_CHANGED. La existencia
 *     nunca queda negativa por una carrera.
 *
 *   · **Una venta es una sola escritura atómica**: el documento, los
 *     movimientos, las existencias, el consecutivo, el saldo del cliente y los
 *     acumulados del mes entran juntos o no entra ninguno.
 *
 *   · **Los acumulados del mes se suman, no se recalculan.** `stats/{período}`
 *     y `productStats/{período}_{producto}` reciben incrementos en la misma
 *     escritura que la venta. El panel lee un puñado de documentos en vez de
 *     recorrer todas las ventas del mes, que es lo que no escala.
 *
 *   · **El costo de una línea se fija al vender.** Si el proveedor sube el
 *     precio mañana, el margen de la venta de hoy no cambia.
 *
 *   · **Un mes cerrado no se reescribe.** Con el informe mensual emitido,
 *     registrar o anular algo con fecha de ese mes responde PERIOD_CLOSED.
 *
 * Nada de esto decide QUIÉN puede hacer cada cosa: eso lo resuelve el
 * anfitrión antes de llamar. Aquí `scope.can('cost.read')` solo decide si la
 * respuesta lleva costos y márgenes.
 */

import {
    AGING_BUCKETS, DEFAULT_CREDIT_DAYS, MOVEMENT_TYPES, PAYMENT_METHODS, PRODUCT_KINDS, SALE_TERMS, UNITS
} from './catalog.js';
import { invalid, isConflict, raise } from './errors.js';
import { marginBp, multiply, weightedCost } from './money.js';
import { addDays, businessDay, dayKey, daysOf, diffDays, firstDay, lastDay, periodOf, shiftPeriod } from './time.js';
import * as v from './validate.js';

const RETRIES = 6;
const MAX_LINES = 80;

export const today = scope => businessDay(scope.now(), scope.tenant.timezone);
const stamp = scope => scope.now().toISOString();
const costs = scope => scope.can('cost.read');

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Repite la operación mientras otra escritura se le adelante: vuelve a leer,
 * vuelve a validar y vuelve a intentar. La espera crece y lleva algo de azar
 * para que dos cajas que chocaron no vuelvan a chocar en el mismo instante.
 */
export async function retrying(task, exhausted = 'CONFLICT') {
    for (let attempt = 0; attempt < RETRIES; attempt += 1) {
        try {
            return await task();
        } catch (error) {
            if (!isConflict(error)) throw error;
            await pause(attempt * 15 + Math.random() * 25);
        }
    }
    return raise(exhausted);
}

/**
 * Una fecha en la que todavía se puede escribir: ni futura, ni dentro de un
 * mes con el cierre emitido. Solo las fechas de meses anteriores cuestan una
 * lectura; el mes en curso no puede estar cerrado.
 */
export async function assertOpenDate(scope, date, field = 'date') {
    const now = today(scope);
    if (date > now) raise('FUTURE_DATE', { field });
    if (periodOf(date) < periodOf(now)) {
        const report = await scope.store.get('reports', periodOf(date));
        if (report?.status === 'final') raise('PERIOD_CLOSED', { period: periodOf(date) });
    }
}

const dateOrToday = (scope, value, field = 'date') => (value ? v.day(value, field) : today(scope));

/** El siguiente consecutivo de una serie y la escritura que lo reserva. */
async function nextNumber(scope, series, prefix) {
    const counter = await scope.store.get('counters', series);
    const value = (counter?.value || 0) + 1;
    const write = counter
        ? scope.store.write.update('counters', series, { value, updatedAt: stamp(scope) }, { updateTime: counter._updateTime })
        : scope.store.write.create('counters', series, { value, updatedAt: stamp(scope) });
    return { value, number: `${prefix}-${String(value).padStart(6, '0')}`, write };
}

/* ================================================================== *
 * Productos
 * ================================================================== */

function productView(row, stock, withCosts) {
    const good = row.kind === 'good';
    const onHandMilli = good ? (stock?.onHandMilli || 0) : null;
    const view = {
        id: row.id,
        code: row.code,
        name: row.name,
        kind: row.kind,
        unit: row.unit,
        category: row.category || '',
        priceMinor: row.priceMinor,
        currency: row.currency,
        minStockMilli: good ? (row.minStockMilli || 0) : null,
        onHandMilli,
        low: good ? onHandMilli <= (row.minStockMilli || 0) : false,
        out: good ? onHandMilli <= 0 : false,
        active: row.active !== false
    };
    if (withCosts) {
        view.costMinor = row.costMinor;
        view.marginBp = marginBp(row.priceMinor, row.costMinor);
        view.stockValueMinor = good ? multiply(onHandMilli, row.costMinor) : null;
    }
    return view;
}

export async function listProducts(scope, { includeInactive = false } = {}) {
    const [products, stock] = await Promise.all([
        scope.store.query('products', { limit: 2000 }),
        scope.store.query('stock', { limit: 2000 })
    ]);
    const levels = new Map(stock.map(row => [row.id, row]));
    const withCosts = costs(scope);
    const rows = products
        .filter(row => includeInactive || row.active !== false)
        .map(row => productView(row, levels.get(row.id), withCosts))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    const goods = rows.filter(row => row.kind === 'good' && row.active);
    return {
        products: rows,
        totals: {
            products: rows.length,
            goods: goods.length,
            lowCount: goods.filter(row => row.low && !row.out).length,
            outCount: goods.filter(row => row.out).length,
            stockValueMinor: withCosts ? goods.reduce((total, row) => total + (row.stockValueMinor || 0), 0) : null
        },
        currency: scope.tenant.currency
    };
}

function productInput(scope, input, current = null) {
    const kind = current ? current.kind : v.requiredOneOf(input.kind || 'good', [...PRODUCT_KINDS], 'kind');
    const pick = (key, read) => (key in input ? read(input[key]) : current?.[key]);
    const data = {
        name: 'name' in input || !current ? v.requiredText(input.name, 'name', 120) : current.name,
        kind,
        unit: v.oneOf(pick('unit', value => value), [...UNITS], kind === 'service' ? 'servicio' : 'unidad'),
        category: pick('category', value => v.text(value, 60)) || '',
        priceMinor: pick('priceMinor', value => v.minor(value, 'priceMinor')) ?? 0,
        minStockMilli: kind === 'good' ? (pick('minStockMilli', value => v.milli(value, 'minStockMilli')) ?? 0) : 0,
        active: 'active' in input ? input.active !== false : (current ? current.active !== false : true)
    };
    // El costo solo lo escribe quien puede verlo: de otro modo, quien no ve
    // costos podría pisar con un cero el de un producto que ya lo tenía.
    data.costMinor = costs(scope) && 'costMinor' in input ? v.minor(input.costMinor, 'costMinor') : (current?.costMinor ?? 0);
    return data;
}

export async function createProduct(scope, input = {}) {
    const data = productInput(scope, input);
    const opening = data.kind === 'good' ? (v.milli(input.openingStockMilli, 'openingStockMilli', { optional: true }) || 0) : 0;
    const wantedCode = v.text(input.code, 40);
    const id = v.newId();

    return retrying(async () => {
        const writes = [];
        let code = wantedCode;
        let key = v.codeKey(code);
        if (!code) {
            // Sin código, el sistema pone el suyo. El consecutivo se reserva en
            // la misma escritura: dos altas simultáneas no comparten número. Y
            // si alguien ya usó «P-0007» a mano, se salta al siguiente libre.
            const counter = await scope.store.get('counters', 'products');
            let value = counter?.value || 0;
            do {
                value += 1;
                code = `P-${String(value).padStart(4, '0')}`;
                key = v.codeKey(code);
            } while (await scope.store.get('productCodes', key));
            writes.push(counter
                ? scope.store.write.update('counters', 'products', { value, updatedAt: stamp(scope) }, { updateTime: counter._updateTime })
                : scope.store.write.create('counters', 'products', { value, updatedAt: stamp(scope) }));
        } else {
            if (!key) invalid('code');
            if (await scope.store.get('productCodes', key)) raise('PRODUCT_CODE_TAKEN', { productCode: code });
        }

        const now = stamp(scope);
        const product = { ...data, code, codeKey: key, currency: scope.tenant.currency, createdAt: now, updatedAt: now, createdBy: scope.actor.uid };
        writes.push(scope.store.write.create('products', id, product));
        writes.push(scope.store.write.create('productCodes', key, { productId: id }));

        let stock = null;
        if (data.kind === 'good') {
            stock = { onHandMilli: opening, costMinor: data.costMinor, minMilli: data.minStockMilli, low: opening <= data.minStockMilli, updatedAt: now };
            writes.push(scope.store.write.create('stock', id, stock));
            if (opening > 0) {
                const date = today(scope);
                writes.push(scope.store.write.create('movements', v.newId(), {
                    productId: id, type: 'opening', quantityMilli: opening, unitCostMinor: data.costMinor, balanceMilli: opening,
                    date, period: periodOf(date), ref: null, note: 'Existencia inicial', at: now, by: scope.actor.uid, byName: scope.actor.name
                }));
            }
        }
        await scope.store.commit(writes);
        return { product: productView({ id, ...product }, stock, costs(scope)) };
    });
}

export async function updateProduct(scope, productId, input = {}) {
    v.id(productId);
    return retrying(async () => {
        const [current, stock] = await Promise.all([scope.store.get('products', productId), scope.store.get('stock', productId)]);
        if (!current) raise('NOT_FOUND');
        const data = productInput(scope, input, current);
        const now = stamp(scope);
        const changes = { ...data, updatedAt: now };
        const writes = [];

        if ('code' in input) {
            const code = v.requiredText(input.code, 'code', 40);
            const key = v.codeKey(code);
            if (!key) invalid('code');
            if (key !== current.codeKey) {
                if (await scope.store.get('productCodes', key)) raise('PRODUCT_CODE_TAKEN', { productCode: code });
                writes.push(scope.store.write.create('productCodes', key, { productId }));
                writes.push(scope.store.write.remove('productCodes', current.codeKey));
            }
            changes.code = code;
            changes.codeKey = key;
        }
        writes.push(scope.store.write.update('products', productId, changes, { updateTime: current._updateTime }));

        let level = stock;
        if (current.kind === 'good') {
            // La existencia lleva copia del costo y del mínimo: así el panel
            // valora la bodega y detecta faltantes leyendo una sola colección.
            const onHandMilli = stock?.onHandMilli || 0;
            level = { onHandMilli, costMinor: data.costMinor, minMilli: data.minStockMilli, low: onHandMilli <= data.minStockMilli, updatedAt: now };
            writes.push(stock
                ? scope.store.write.update('stock', productId, level, { updateTime: stock._updateTime })
                : scope.store.write.create('stock', productId, level));
        }
        await scope.store.commit(writes);
        return { product: productView({ ...current, ...changes }, level, costs(scope)) };
    });
}

/* ================================================================== *
 * Existencias y movimientos
 * ================================================================== */

/**
 * El costo promedio de un producto, redondeado como se usa la moneda. El colón
 * no tiene céntimos en la calle: un costo de ₡17 107,33 es exacto y no le
 * sirve a nadie que lo lea en una ficha. Se redondea al colón —medio colón de
 * diferencia por unidad, como mucho—; el dólar y el euro conservan sus
 * céntimos.
 */
function wholeUnitCost(costMinor, currency) {
    return currency === 'CRC' ? Math.round(costMinor / 100) * 100 : costMinor;
}

function movementView(row, withCosts) {
    const view = {
        id: row.id,
        productId: row.productId,
        type: row.type,
        quantityMilli: row.quantityMilli,
        balanceMilli: row.balanceMilli,
        date: row.date,
        ref: row.ref || null,
        note: row.note || '',
        at: row.at,
        byName: row.byName || ''
    };
    if (withCosts) view.unitCostMinor = row.unitCostMinor;
    return view;
}

export async function listMovements(scope, { productId = null, limit = 100 } = {}) {
    const max = Math.min(Math.max(Number(limit) || 100, 1), 300);
    const rows = productId
        ? await scope.store.query('movements', { where: [['productId', '==', v.id(productId, 'productId')]], limit: 1000 })
        : await scope.store.query('movements', { orderBy: [['at', 'desc']], limit: max });
    const sorted = rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, max);
    const products = await scope.store.getMany('products', sorted.map(row => row.productId));
    return {
        movements: sorted.map(row => ({
            ...movementView(row, costs(scope)),
            productCode: products.get(row.productId)?.code || '',
            productName: products.get(row.productId)?.name || '—',
            unit: products.get(row.productId)?.unit || ''
        }))
    };
}

const MANUAL_MOVEMENTS = Object.keys(MOVEMENT_TYPES).filter(type => MOVEMENT_TYPES[type].manual);

/**
 * Entrada, devolución, merma o conteo. La compra con costo recalcula el costo
 * promedio del producto; el conteo dice cuánto HAY y el sistema anota la
 * diferencia, que es como se cuenta una bodega de verdad.
 */
export async function recordMovement(scope, input = {}) {
    const productId = v.id(input.productId, 'productId');
    const type = v.requiredOneOf(input.type, MANUAL_MOVEMENTS, 'type');
    const date = dateOrToday(scope, input.date);
    const note = v.text(input.note, 200);
    const quantity = type === 'adjustment' ? null : v.milli(input.quantityMilli, 'quantityMilli', { min: 1 });
    const counted = type === 'adjustment' ? v.milli(input.countedMilli, 'countedMilli') : null;
    const givenCost = type === 'purchase' && costs(scope) ? v.minor(input.unitCostMinor, 'unitCostMinor', { optional: true }) : null;
    await assertOpenDate(scope, date);

    return retrying(async () => {
        const [product, stock] = await Promise.all([scope.store.get('products', productId), scope.store.get('stock', productId)]);
        if (!product) raise('NOT_FOUND');
        if (product.kind !== 'good') raise('NOT_STOCKED');

        const onHand = stock?.onHandMilli || 0;
        const delta = type === 'adjustment' ? counted - onHand : MOVEMENT_TYPES[type].sign * quantity;
        if (delta === 0) return { unchanged: true, product: productView(product, stock, costs(scope)) };
        const after = onHand + delta;
        if (after < 0) raise('STOCK_INSUFFICIENT', { productId, name: product.name, availableMilli: onHand });

        const unitCost = givenCost ?? product.costMinor;
        const newCost = givenCost === null ? product.costMinor : wholeUnitCost(weightedCost(onHand, product.costMinor, quantity, givenCost), scope.tenant.currency);
        const now = stamp(scope);
        const period = periodOf(date);
        const movement = {
            productId, type, quantityMilli: delta, unitCostMinor: unitCost, balanceMilli: after,
            date, period, ref: null, note, at: now, by: scope.actor.uid, byName: scope.actor.name
        };
        const level = { onHandMilli: after, costMinor: newCost, minMilli: product.minStockMilli || 0, low: after <= (product.minStockMilli || 0), updatedAt: now };
        const movementId = v.newId();
        const writes = [
            scope.store.write.create('movements', movementId, movement),
            stock
                ? scope.store.write.update('stock', productId, level, { updateTime: stock._updateTime })
                : scope.store.write.create('stock', productId, level)
        ];
        if (newCost !== product.costMinor) {
            writes.push(scope.store.write.update('products', productId, { costMinor: newCost, updatedAt: now }, { updateTime: product._updateTime }));
        }
        // Lo que se compró, lo que se perdió y lo que el conteo corrigió,
        // valorado al costo: son tres líneas del informe del mes.
        const value = multiply(Math.abs(delta), unitCost);
        const field = { purchase: 'purchasesMinor', waste: 'wasteMinor', adjustment: 'adjustmentMinor', return: 'returnsMinor' }[type];
        writes.push(scope.store.write.merge('stats', period, { period }, { increments: { [field]: type === 'adjustment' ? Math.sign(delta) * value : value } }));

        await scope.store.commit(writes);
        return {
            movement: movementView({ id: movementId, ...movement }, costs(scope)),
            product: productView({ ...product, costMinor: newCost }, level, costs(scope))
        };
    }, 'STOCK_CHANGED');
}

/**
 * Rehace la existencia de cada producto sumando sus movimientos y la compara
 * con la proyección guardada. Devuelve los descuadres; una lista vacía es que
 * todo cuadra.
 */
export async function checkStock(scope) {
    const [movements, stock] = await Promise.all([
        scope.store.query('movements', { limit: 20000 }),
        scope.store.query('stock', { limit: 2000 })
    ]);
    const sums = new Map();
    for (const row of movements) sums.set(row.productId, (sums.get(row.productId) || 0) + row.quantityMilli);
    const mismatches = [];
    for (const row of stock) {
        const expected = sums.get(row.id) || 0;
        if (expected !== row.onHandMilli) mismatches.push({ productId: row.id, onHandMilli: row.onHandMilli, movementsMilli: expected });
    }
    return { checked: stock.length, mismatches };
}

/* ================================================================== *
 * Clientes
 * ================================================================== */

function customerView(row) {
    return {
        id: row.id,
        name: row.name,
        phone: row.phone || '',
        email: row.email || '',
        idNumber: row.idNumber || '',
        creditDays: row.creditDays ?? DEFAULT_CREDIT_DAYS,
        notes: row.notes || '',
        balanceMinor: row.balanceMinor || 0,
        lastPaymentOn: row.lastPaymentOn || null,
        active: row.active !== false
    };
}

function customerInput(input, current = null) {
    const pick = (key, read, fallback) => (key in input ? read(input[key]) : (current ? current[key] : fallback));
    return {
        name: 'name' in input || !current ? v.requiredText(input.name, 'name', 120) : current.name,
        phone: pick('phone', v.phone, ''),
        email: pick('email', v.email, ''),
        idNumber: pick('idNumber', value => v.text(value, 30), ''),
        creditDays: pick('creditDays', value => v.integer(value, 'creditDays', { min: 0, max: 365 }), DEFAULT_CREDIT_DAYS),
        notes: pick('notes', value => v.longText(value, 600), ''),
        active: 'active' in input ? input.active !== false : (current ? current.active !== false : true)
    };
}

export async function listCustomers(scope, { includeInactive = false } = {}) {
    const rows = await scope.store.query('customers', { limit: 3000 });
    return {
        customers: rows
            .filter(row => includeInactive || row.active !== false)
            .map(customerView)
            .sort((a, b) => a.name.localeCompare(b.name, 'es')),
        currency: scope.tenant.currency
    };
}

export async function createCustomer(scope, input = {}) {
    const now = stamp(scope);
    const id = v.newId();
    const customer = { ...customerInput(input), balanceMinor: 0, createdAt: now, updatedAt: now, createdBy: scope.actor.uid };
    await scope.store.commit([scope.store.write.create('customers', id, customer)]);
    return { customer: customerView({ id, ...customer }) };
}

export async function updateCustomer(scope, customerId, input = {}) {
    v.id(customerId);
    const current = await scope.store.get('customers', customerId);
    if (!current) raise('NOT_FOUND');
    // El saldo no se edita: lo mueven las ventas y los cobros. Por eso se
    // actualizan campos sueltos y nunca el documento entero.
    const changes = { ...customerInput(input, current), updatedAt: stamp(scope) };
    await scope.store.commit([scope.store.write.update('customers', customerId, changes)]);
    return { customer: customerView({ ...current, ...changes }) };
}

export async function getCustomer(scope, customerId) {
    v.id(customerId);
    const [customer, sales, payments] = await Promise.all([
        scope.store.get('customers', customerId),
        scope.store.query('sales', { where: [['customerId', '==', customerId]], limit: 1000 }),
        scope.store.query('payments', { where: [['customerId', '==', customerId]], limit: 1000 })
    ]);
    if (!customer) raise('NOT_FOUND');
    const now = today(scope);
    const withCosts = costs(scope);
    const byRecent = (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
    return {
        customer: customerView(customer),
        open: sales.filter(row => row.open && row.status === 'confirmed')
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .map(row => ({ ...saleRow(row, withCosts), daysOverdue: Math.max(0, diffDays(row.dueDate, now)) })),
        sales: sales.sort(byRecent).slice(0, 60).map(row => saleRow(row, withCosts)),
        payments: payments.sort(byRecent).slice(0, 60).map(paymentView),
        currency: scope.tenant.currency,
        today: now
    };
}

/* ================================================================== *
 * Ventas
 * ================================================================== */

function saleRow(row, withCosts) {
    const view = {
        id: row.id,
        kind: row.kind,
        number: row.number,
        date: row.date,
        customerId: row.customerId || null,
        customerName: row.customerName || '',
        term: row.term,
        method: row.method || null,
        dueDate: row.dueDate || null,
        totalMinor: row.totalMinor,
        paidMinor: row.paidMinor,
        balanceMinor: row.balanceMinor,
        open: Boolean(row.open),
        status: row.status,
        items: (row.lines || []).length,
        note: row.note || '',
        currency: row.currency,
        createdByName: row.createdByName || ''
    };
    if (withCosts && row.kind === 'sale') {
        view.costMinor = row.costMinor;
        view.marginBp = marginBp(row.totalMinor, row.costMinor);
    }
    return view;
}

function saleView(row, withCosts) {
    return {
        ...saleRow(row, withCosts),
        lines: (row.lines || []).map(line => {
            const view = {
                productId: line.productId, code: line.code, name: line.name, kind: line.kind, unit: line.unit,
                quantityMilli: line.quantityMilli, unitPriceMinor: line.unitPriceMinor, totalMinor: line.totalMinor
            };
            if (withCosts) { view.unitCostMinor = line.unitCostMinor; view.costMinor = line.costMinor; }
            return view;
        }),
        voidReason: row.voidReason || '',
        voidedAt: row.voidedAt || null,
        createdAt: row.createdAt
    };
}

export async function listSales(scope, { period = null, customerId = null, open = false } = {}) {
    let rows;
    let shown = null;
    if (open) {
        rows = await scope.store.query('sales', { where: [['open', '==', true]], limit: 3000 });
    } else if (customerId) {
        rows = await scope.store.query('sales', { where: [['customerId', '==', v.id(customerId, 'customerId')]], limit: 1000 });
    } else {
        shown = period ? v.period(period, 'period') : periodOf(today(scope));
        rows = await scope.store.query('sales', { where: [['date', '>=', firstDay(shown)], ['date', '<=', lastDay(shown)]], limit: 5000 });
    }
    const withCosts = costs(scope);
    return {
        period: shown,
        sales: rows
            .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
            .map(row => saleRow(row, withCosts)),
        currency: scope.tenant.currency
    };
}

export async function getSale(scope, saleId) {
    const row = await scope.store.get('sales', v.id(saleId));
    if (!row) raise('NOT_FOUND');
    return { sale: saleView(row, costs(scope)) };
}

function saleLines(input) {
    if (!Array.isArray(input) || !input.length || input.length > MAX_LINES) invalid('lines');
    return input.map((line, index) => ({
        productId: v.id(line?.productId, `lines.${index}.productId`),
        quantityMilli: v.milli(line?.quantityMilli, `lines.${index}.quantityMilli`, { min: 1 }),
        unitPriceMinor: v.minor(line?.unitPriceMinor, `lines.${index}.unitPriceMinor`, { optional: true })
    }));
}

/** Incrementos de una venta sobre los acumulados del mes. `sign` es −1 al anular. */
function saleStatsWrites(scope, sale, sign) {
    const key = dayKey(sale.date);
    const writes = [scope.store.write.merge('stats', sale.period, { period: sale.period }, {
        increments: {
            salesMinor: sign * sale.totalMinor,
            costMinor: sign * sale.costMinor,
            salesCount: sign,
            [sale.term === 'credit' ? 'creditSalesMinor' : 'cashSalesMinor']: sign * sale.totalMinor,
            [`byDay.${key}.salesMinor`]: sign * sale.totalMinor,
            [`byDay.${key}.costMinor`]: sign * sale.costMinor,
            [`byDay.${key}.count`]: sign,
            ...(sign < 0 ? { voidCount: 1, voidedMinor: sale.totalMinor } : {})
        }
    })];
    const byProduct = new Map();
    for (const line of sale.lines) {
        const entry = byProduct.get(line.productId) || { line, quantityMilli: 0, salesMinor: 0, costMinor: 0, lines: 0 };
        entry.quantityMilli += line.quantityMilli;
        entry.salesMinor += line.totalMinor;
        entry.costMinor += line.costMinor;
        entry.lines += 1;
        byProduct.set(line.productId, entry);
    }
    for (const [productId, entry] of byProduct) {
        writes.push(scope.store.write.merge('productStats', `${sale.period}_${productId}`, {
            period: sale.period, productId, code: entry.line.code, name: entry.line.name, kind: entry.line.kind, unit: entry.line.unit
        }, {
            increments: {
                quantityMilli: sign * entry.quantityMilli,
                salesMinor: sign * entry.salesMinor,
                costMinor: sign * entry.costMinor,
                lines: sign * entry.lines
            }
        }));
    }
    return writes;
}

/** Cuánto pide una venta de cada producto con existencias. */
function stockNeeds(lines) {
    const needs = new Map();
    for (const line of lines) if (line.kind === 'good') needs.set(line.productId, (needs.get(line.productId) || 0) + line.quantityMilli);
    return needs;
}

export async function createSale(scope, input = {}) {
    const wanted = saleLines(input.lines);
    const term = v.requiredOneOf(input.term || 'cash', [...SALE_TERMS], 'term');
    const date = dateOrToday(scope, input.date);
    const customerId = input.customerId ? v.id(input.customerId, 'customerId') : null;
    if (term === 'credit' && !customerId) raise('CUSTOMER_REQUIRED');
    const method = term === 'cash' ? v.requiredOneOf(input.method || 'efectivo', [...PAYMENT_METHODS], 'method') : null;
    const givenDue = term === 'credit' ? v.day(input.dueDate, 'dueDate', { optional: true }) : null;
    if (givenDue && givenDue < date) invalid('dueDate');
    const note = v.text(input.note, 300);
    await assertOpenDate(scope, date);
    const id = v.newId();

    return retrying(async () => {
        const productIds = [...new Set(wanted.map(line => line.productId))];
        const [products, levels, customer, next] = await Promise.all([
            scope.store.getMany('products', productIds),
            scope.store.getMany('stock', productIds),
            customerId ? scope.store.get('customers', customerId) : null,
            nextNumber(scope, 'sales', 'V')
        ]);
        if (customerId && !customer) invalid('customerId');

        const lines = wanted.map((line, index) => {
            const product = products.get(line.productId);
            if (!product) invalid(`lines.${index}.productId`);
            if (product.active === false) raise('PRODUCT_INACTIVE', { productId: product.id, name: product.name });
            const unitPriceMinor = line.unitPriceMinor ?? product.priceMinor;
            return {
                productId: product.id, code: product.code, name: product.name, kind: product.kind, unit: product.unit,
                quantityMilli: line.quantityMilli, unitPriceMinor, unitCostMinor: product.costMinor,
                totalMinor: multiply(line.quantityMilli, unitPriceMinor), costMinor: multiply(line.quantityMilli, product.costMinor)
            };
        });
        const totalMinor = lines.reduce((total, line) => total + line.totalMinor, 0);
        const costMinor = lines.reduce((total, line) => total + line.costMinor, 0);
        if (totalMinor <= 0) invalid('lines');

        const now = stamp(scope);
        const period = periodOf(date);
        const credit = term === 'credit';
        const sale = {
            kind: 'sale', number: next.number, date, period,
            customerId: customer?.id || null,
            customerName: customer?.name || v.text(input.customerName, 120),
            term, method,
            dueDate: credit ? (givenDue || addDays(date, customer.creditDays ?? DEFAULT_CREDIT_DAYS)) : null,
            lines, totalMinor, costMinor, currency: scope.tenant.currency,
            paidMinor: credit ? 0 : totalMinor, balanceMinor: credit ? totalMinor : 0, open: credit,
            status: 'confirmed', note, createdAt: now, createdBy: scope.actor.uid, createdByName: scope.actor.name
        };

        const writes = [scope.store.write.create('sales', id, sale), next.write];
        for (const [productId, needed] of stockNeeds(lines)) {
            const product = products.get(productId);
            const level = levels.get(productId);
            const onHand = level?.onHandMilli || 0;
            const after = onHand - needed;
            if (after < 0) raise('STOCK_INSUFFICIENT', { productId, name: product.name, availableMilli: onHand });
            const data = { onHandMilli: after, costMinor: product.costMinor, minMilli: product.minStockMilli || 0, low: after <= (product.minStockMilli || 0), updatedAt: now };
            // La precondición es lo que impide vender dos veces la última
            // unidad: si otra venta escribió antes, esta escritura entera falla.
            writes.push(level
                ? scope.store.write.update('stock', productId, data, { updateTime: level._updateTime })
                : scope.store.write.create('stock', productId, data));
            writes.push(scope.store.write.create('movements', v.newId(), {
                productId, type: 'sale', quantityMilli: -needed, unitCostMinor: product.costMinor, balanceMilli: after,
                date, period, ref: { kind: 'sale', id, number: sale.number }, note: '', at: now, by: scope.actor.uid, byName: scope.actor.name
            }));
        }
        writes.push(...saleStatsWrites(scope, sale, 1));
        if (credit) writes.push(scope.store.write.merge('customers', customer.id, { lastSaleOn: date }, { increments: { balanceMinor: totalMinor } }));

        await scope.store.commit(writes);
        return { sale: saleView({ id, ...sale }, costs(scope)) };
    }, 'STOCK_CHANGED');
}

/**
 * Saldo que un cliente ya debía antes de entrar al sistema. Es una obligación
 * de cobro, no una venta del mes: no mueve existencias ni cuenta como ingreso.
 */
export async function createOpeningBalance(scope, input = {}) {
    const customerId = v.id(input.customerId, 'customerId');
    const amountMinor = v.minor(input.amountMinor, 'amountMinor', { min: 1 });
    const date = dateOrToday(scope, input.date);
    if (date > today(scope)) raise('FUTURE_DATE', { field: 'date' });
    const givenDue = v.day(input.dueDate, 'dueDate', { optional: true });
    const note = v.text(input.note, 300);
    const id = v.newId();

    return retrying(async () => {
        const [customer, next] = await Promise.all([scope.store.get('customers', customerId), nextNumber(scope, 'openings', 'SI')]);
        if (!customer) invalid('customerId');
        const now = stamp(scope);
        const sale = {
            kind: 'opening', number: next.number, date, period: periodOf(date),
            customerId, customerName: customer.name, term: 'credit', method: null,
            dueDate: givenDue || date, lines: [], totalMinor: amountMinor, costMinor: 0, currency: scope.tenant.currency,
            paidMinor: 0, balanceMinor: amountMinor, open: true, status: 'confirmed',
            note: note || 'Saldo anterior al sistema', createdAt: now, createdBy: scope.actor.uid, createdByName: scope.actor.name
        };
        await scope.store.commit([
            scope.store.write.create('sales', id, sale),
            next.write,
            scope.store.write.merge('customers', customerId, { updatedAt: now }, { increments: { balanceMinor: amountMinor } })
        ]);
        return { sale: saleView({ id, ...sale }, costs(scope)) };
    });
}

/**
 * Anular no es borrar: el documento queda, marcado, con quién y por qué. La
 * mercadería vuelve a la bodega y los acumulados del mes se descuentan en la
 * misma escritura.
 */
export async function voidSale(scope, saleId, input = {}) {
    v.id(saleId);
    const reason = v.requiredText(input.reason, 'reason', 200);

    return retrying(async () => {
        const sale = await scope.store.get('sales', saleId);
        if (!sale) raise('NOT_FOUND');
        if (sale.status !== 'confirmed') raise('DOCUMENT_CLOSED');
        if (sale.term === 'credit' && sale.paidMinor > 0) raise('HAS_PAYMENTS');
        if (sale.kind === 'sale') await assertOpenDate(scope, sale.date);

        const now = stamp(scope);
        const changes = { status: 'void', open: false, balanceMinor: 0, voidReason: reason, voidedAt: now, voidedBy: scope.actor.uid, updatedAt: now };
        const writes = [scope.store.write.update('sales', saleId, changes, { updateTime: sale._updateTime })];

        const needs = stockNeeds(sale.lines || []);
        if (needs.size) {
            const [levels, products] = await Promise.all([
                scope.store.getMany('stock', [...needs.keys()]),
                scope.store.getMany('products', [...needs.keys()])
            ]);
            const date = today(scope);
            for (const [productId, quantity] of needs) {
                const level = levels.get(productId);
                const product = products.get(productId);
                const after = (level?.onHandMilli || 0) + quantity;
                const min = product?.minStockMilli ?? level?.minMilli ?? 0;
                const cost = product?.costMinor ?? level?.costMinor ?? 0;
                const data = { onHandMilli: after, costMinor: cost, minMilli: min, low: after <= min, updatedAt: now };
                writes.push(level
                    ? scope.store.write.update('stock', productId, data, { updateTime: level._updateTime })
                    : scope.store.write.create('stock', productId, data));
                writes.push(scope.store.write.create('movements', v.newId(), {
                    productId, type: 'void', quantityMilli: quantity, unitCostMinor: cost, balanceMilli: after,
                    date, period: periodOf(date), ref: { kind: 'sale', id: saleId, number: sale.number },
                    note: reason, at: now, by: scope.actor.uid, byName: scope.actor.name
                }));
            }
        }
        if (sale.kind === 'sale') writes.push(...saleStatsWrites(scope, sale, -1));
        if (sale.customerId && sale.balanceMinor > 0) {
            writes.push(scope.store.write.merge('customers', sale.customerId, { updatedAt: now }, { increments: { balanceMinor: -sale.balanceMinor } }));
        }
        await scope.store.commit(writes);
        return { sale: saleView({ ...sale, ...changes }, costs(scope)) };
    }, 'STOCK_CHANGED');
}

/* ================================================================== *
 * Cobros
 * ================================================================== */

function paymentView(row) {
    return {
        id: row.id,
        number: row.number,
        date: row.date,
        customerId: row.customerId,
        customerName: row.customerName,
        amountMinor: row.amountMinor,
        currency: row.currency,
        method: row.method,
        reference: row.reference || '',
        note: row.note || '',
        allocations: row.allocations || [],
        status: row.status,
        voidReason: row.voidReason || '',
        createdByName: row.createdByName || ''
    };
}

export async function listPayments(scope, { period = null, customerId = null } = {}) {
    let rows;
    let shown = null;
    if (customerId) {
        rows = await scope.store.query('payments', { where: [['customerId', '==', v.id(customerId, 'customerId')]], limit: 1000 });
    } else {
        shown = period ? v.period(period, 'period') : periodOf(today(scope));
        rows = await scope.store.query('payments', { where: [['date', '>=', firstDay(shown)], ['date', '<=', lastDay(shown)]], limit: 5000 });
    }
    return {
        period: shown,
        payments: rows.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).map(paymentView),
        currency: scope.tenant.currency
    };
}

/** Las obligaciones abiertas de un cliente, de la que vence antes a la que vence después. */
async function openSalesOf(scope, customerId) {
    const rows = await scope.store.query('sales', { where: [['customerId', '==', customerId], ['open', '==', true]], limit: 1000 });
    return rows
        .filter(row => row.status === 'confirmed' && row.balanceMinor > 0)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.date.localeCompare(b.date) || a.number.localeCompare(b.number));
}

/**
 * Registra un cobro y lo reparte entre lo que el cliente debe. Sin reparto
 * explícito se cubre primero lo que vence antes, que es lo que haría
 * cualquiera con la lista en la mano.
 */
export async function recordPayment(scope, input = {}) {
    const customerId = v.id(input.customerId, 'customerId');
    const amountMinor = v.minor(input.amountMinor, 'amountMinor', { min: 1 });
    const date = dateOrToday(scope, input.date);
    const method = v.requiredOneOf(input.method || 'efectivo', [...PAYMENT_METHODS], 'method');
    const reference = v.text(input.reference, 80);
    const note = v.text(input.note, 300);
    const requested = Array.isArray(input.allocations)
        ? input.allocations.map((row, index) => ({
            saleId: v.id(row?.saleId, `allocations.${index}.saleId`),
            amountMinor: v.minor(row?.amountMinor, `allocations.${index}.amountMinor`, { min: 1 })
        }))
        : [];
    if (new Set(requested.map(row => row.saleId)).size !== requested.length) invalid('allocations');
    if (requested.reduce((total, row) => total + row.amountMinor, 0) > amountMinor) raise('PAYMENT_OVER_ALLOCATED');
    await assertOpenDate(scope, date);
    const id = v.newId();

    return retrying(async () => {
        const [customer, open, next] = await Promise.all([
            scope.store.get('customers', customerId),
            openSalesOf(scope, customerId),
            nextNumber(scope, 'payments', 'C')
        ]);
        if (!customer) invalid('customerId');
        if (!open.length) raise('NOTHING_TO_COLLECT');

        const applied = new Map();
        let remaining = amountMinor;
        for (const row of requested) {
            const sale = open.find(candidate => candidate.id === row.saleId);
            if (!sale) invalid('allocations');
            if (row.amountMinor > sale.balanceMinor) raise('PAYMENT_OVER_ALLOCATED', { saleId: sale.id, number: sale.number });
            applied.set(sale.id, row.amountMinor);
            remaining -= row.amountMinor;
        }
        for (const sale of open) {
            if (remaining <= 0) break;
            const room = sale.balanceMinor - (applied.get(sale.id) || 0);
            if (room <= 0) continue;
            const take = Math.min(room, remaining);
            applied.set(sale.id, (applied.get(sale.id) || 0) + take);
            remaining -= take;
        }
        if (remaining > 0) raise('PAYMENT_EXCEEDS_BALANCE', { balanceMinor: open.reduce((total, row) => total + row.balanceMinor, 0) });

        const now = stamp(scope);
        const period = periodOf(date);
        const allocations = [];
        const writes = [next.write];
        for (const sale of open) {
            const amount = applied.get(sale.id);
            if (!amount) continue;
            if (sale.currency !== scope.tenant.currency) raise('CURRENCY_MISMATCH', { saleId: sale.id });
            const balanceMinor = sale.balanceMinor - amount;
            allocations.push({ saleId: sale.id, number: sale.number, amountMinor: amount });
            writes.push(scope.store.write.update('sales', sale.id, {
                paidMinor: sale.paidMinor + amount, balanceMinor, open: balanceMinor > 0, lastPaymentOn: date, updatedAt: now
            }, { updateTime: sale._updateTime }));
        }
        const payment = {
            number: next.number, date, period, customerId, customerName: customer.name, amountMinor,
            currency: scope.tenant.currency, method, reference, note, allocations, status: 'confirmed',
            createdAt: now, createdBy: scope.actor.uid, createdByName: scope.actor.name
        };
        writes.push(scope.store.write.create('payments', id, payment));
        writes.push(scope.store.write.merge('customers', customerId, { lastPaymentOn: date }, { increments: { balanceMinor: -amountMinor } }));
        writes.push(scope.store.write.merge('stats', period, { period }, {
            increments: { collectedMinor: amountMinor, collectedCount: 1, [`byDay.${dayKey(date)}.collectedMinor`]: amountMinor }
        }));
        await scope.store.commit(writes);
        return { payment: paymentView({ id, ...payment }) };
    });
}

export async function voidPayment(scope, paymentId, input = {}) {
    v.id(paymentId);
    const reason = v.requiredText(input.reason, 'reason', 200);

    return retrying(async () => {
        const payment = await scope.store.get('payments', paymentId);
        if (!payment) raise('NOT_FOUND');
        if (payment.status !== 'confirmed') raise('DOCUMENT_CLOSED');
        await assertOpenDate(scope, payment.date);

        const now = stamp(scope);
        const sales = await scope.store.getMany('sales', payment.allocations.map(row => row.saleId));
        const changes = { status: 'void', voidReason: reason, voidedAt: now, voidedBy: scope.actor.uid };
        const writes = [scope.store.write.update('payments', paymentId, changes, { updateTime: payment._updateTime })];
        for (const row of payment.allocations) {
            const sale = sales.get(row.saleId);
            if (!sale || sale.status !== 'confirmed') raise('DOCUMENT_CLOSED');
            const balanceMinor = sale.balanceMinor + row.amountMinor;
            writes.push(scope.store.write.update('sales', sale.id, {
                paidMinor: sale.paidMinor - row.amountMinor, balanceMinor, open: balanceMinor > 0, updatedAt: now
            }, { updateTime: sale._updateTime }));
        }
        writes.push(scope.store.write.merge('customers', payment.customerId, { updatedAt: now }, { increments: { balanceMinor: payment.amountMinor } }));
        writes.push(scope.store.write.merge('stats', payment.period, { period: payment.period }, {
            increments: {
                collectedMinor: -payment.amountMinor, collectedCount: -1,
                [`byDay.${dayKey(payment.date)}.collectedMinor`]: -payment.amountMinor
            }
        }));
        await scope.store.commit(writes);
        return { payment: paymentView({ ...payment, ...changes }) };
    });
}

/* ================================================================== *
 * Cuentas por cobrar
 * ================================================================== */

/** Reparte obligaciones abiertas por antigüedad y por cliente. Puro: lo usa también el cierre. */
export function ageReceivables(openSales, now) {
    const buckets = Object.fromEntries(AGING_BUCKETS.map(bucket => [bucket.id, 0]));
    const customers = new Map();
    let totalMinor = 0;
    let overdueMinor = 0;
    for (const sale of openSales) {
        const days = diffDays(sale.dueDate, now);
        const bucket = AGING_BUCKETS.find(candidate => days >= candidate.from && days <= candidate.to);
        buckets[bucket.id] += sale.balanceMinor;
        totalMinor += sale.balanceMinor;
        if (days > 0) overdueMinor += sale.balanceMinor;
        const key = sale.customerId || `sin-cliente:${sale.customerName}`;
        const entry = customers.get(key) || {
            customerId: sale.customerId || null, name: sale.customerName || 'Sin cliente',
            balanceMinor: 0, overdueMinor: 0, documents: 0, oldestDueDate: sale.dueDate, daysOverdue: 0
        };
        entry.balanceMinor += sale.balanceMinor;
        entry.documents += 1;
        if (days > 0) entry.overdueMinor += sale.balanceMinor;
        if (sale.dueDate < entry.oldestDueDate) entry.oldestDueDate = sale.dueDate;
        entry.daysOverdue = Math.max(entry.daysOverdue, days, 0);
        customers.set(key, entry);
    }
    return {
        totalMinor,
        overdueMinor,
        buckets: AGING_BUCKETS.map(bucket => ({ id: bucket.id, label: bucket.label, amountMinor: buckets[bucket.id] })),
        customers: [...customers.values()].sort((a, b) => b.overdueMinor - a.overdueMinor || b.balanceMinor - a.balanceMinor)
    };
}

export async function openReceivables(scope) {
    const rows = await scope.store.query('sales', { where: [['open', '==', true]], limit: 5000 });
    return rows.filter(row => row.status === 'confirmed' && row.balanceMinor > 0);
}

export async function receivables(scope) {
    const now = today(scope);
    const aged = ageReceivables(await openReceivables(scope), now);
    const ids = aged.customers.map(row => row.customerId).filter(Boolean);
    const contacts = await scope.store.getMany('customers', ids);
    return {
        ...aged,
        customers: aged.customers.map(row => ({ ...row, phone: contacts.get(row.customerId)?.phone || '' })),
        today: now,
        currency: scope.tenant.currency
    };
}

/* ================================================================== *
 * El mes en números
 * ================================================================== */

const EMPTY_STATS = Object.freeze({
    salesMinor: 0, costMinor: 0, salesCount: 0, cashSalesMinor: 0, creditSalesMinor: 0, collectedMinor: 0,
    purchasesMinor: 0, wasteMinor: 0, adjustmentMinor: 0, returnsMinor: 0, voidCount: 0, voidedMinor: 0
});

export async function periodStats(scope, period) {
    const row = await scope.store.get('stats', period);
    const stats = { period, ...EMPTY_STATS };
    for (const key of Object.keys(EMPTY_STATS)) if (Number.isFinite(row?.[key])) stats[key] = row[key];
    stats.byDay = row?.byDay || {};
    return stats;
}

/** Las ventas de cada día del mes, con los días sin ventas en cero. */
export function dailySeries(stats, until = null) {
    return daysOf(stats.period, until).map(day => {
        const entry = stats.byDay?.[dayKey(day)] || {};
        return { day, salesMinor: entry.salesMinor || 0, costMinor: entry.costMinor || 0, count: entry.count || 0, collectedMinor: entry.collectedMinor || 0 };
    });
}

/** Qué dejó cada producto en el mes, del que más ganancia dejó al que más perdió. */
export async function productMargins(scope, { period = null } = {}) {
    const shown = period ? v.period(period, 'period') : periodOf(today(scope));
    const rows = await scope.store.query('productStats', { where: [['period', '==', shown]], limit: 3000 });
    return {
        period: shown,
        currency: scope.tenant.currency,
        products: rows
            .filter(row => row.quantityMilli > 0 || row.salesMinor > 0)
            .map(row => ({
                productId: row.productId, code: row.code, name: row.name, kind: row.kind, unit: row.unit,
                quantityMilli: row.quantityMilli, salesMinor: row.salesMinor, costMinor: row.costMinor,
                profitMinor: row.salesMinor - row.costMinor, marginBp: marginBp(row.salesMinor, row.costMinor)
            }))
            .sort((a, b) => b.profitMinor - a.profitMinor)
    };
}

/** El panel: el mes hasta hoy, comparado con el anterior, y lo que pide atención. */
export async function erpSummary(scope) {
    const now = today(scope);
    const period = periodOf(now);
    const withCosts = costs(scope);
    const [stats, previous, open, stock, margins] = await Promise.all([
        periodStats(scope, period),
        periodStats(scope, shiftPeriod(period, -1)),
        openReceivables(scope),
        scope.store.query('stock', { limit: 2000 }),
        withCosts ? productMargins(scope, { period }) : null
    ]);

    // Un producto desactivado conserva su existencia, pero ya no es un faltante
    // que atender: se descarta aquí, con su ficha delante.
    const flagged = stock.filter(row => row.low);
    const names = await scope.store.getMany('products', flagged.map(row => row.id));
    const low = flagged
        .filter(row => names.has(row.id) && names.get(row.id).active !== false)
        .sort((a, b) => a.onHandMilli - b.onHandMilli)
        .map(row => ({
            productId: row.id, code: names.get(row.id).code, name: names.get(row.id).name, unit: names.get(row.id).unit,
            onHandMilli: row.onHandMilli, minStockMilli: row.minMilli || 0, out: row.onHandMilli <= 0
        }));
    const aged = ageReceivables(open, now);

    const summary = {
        period,
        today: now,
        currency: scope.tenant.currency,
        sales: {
            totalMinor: stats.salesMinor,
            count: stats.salesCount,
            cashMinor: stats.cashSalesMinor,
            creditMinor: stats.creditSalesMinor,
            previousTotalMinor: previous.salesMinor
        },
        cashInMinor: stats.cashSalesMinor + stats.collectedMinor,
        receivables: {
            totalMinor: aged.totalMinor,
            overdueMinor: aged.overdueMinor,
            buckets: aged.buckets,
            top: aged.customers.slice(0, 5)
        },
        stock: {
            lowCount: low.filter(row => !row.out).length,
            outCount: low.filter(row => row.out).length,
            low: low.slice(0, 12)
        },
        daily: dailySeries(stats, now).map(row => (withCosts ? row : { day: row.day, salesMinor: row.salesMinor, count: row.count, collectedMinor: row.collectedMinor }))
    };
    if (withCosts) {
        summary.sales.costMinor = stats.costMinor;
        summary.sales.profitMinor = stats.salesMinor - stats.costMinor;
        summary.sales.marginBp = marginBp(stats.salesMinor, stats.costMinor);
        summary.sales.previousMarginBp = marginBp(previous.salesMinor, previous.costMinor);
        summary.stock.valueMinor = stock.reduce((total, row) => total + multiply(Math.max(0, row.onHandMilli), row.costMinor || 0), 0);
        summary.products = {
            best: margins.products.slice(0, 5),
            losing: margins.products.filter(row => row.profitMinor < 0).sort((a, b) => a.profitMinor - b.profitMinor).slice(0, 5)
        };
    }
    return summary;
}
