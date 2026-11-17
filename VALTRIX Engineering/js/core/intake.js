/**
 * Incorporación: del formulario del dueño al negocio funcionando.
 *
 * Al activar la cuenta, el dueño recibe un enlace y llena un formulario con
 * sus productos, costos, deudores, equipo de trabajo, procesos y máquinas.
 * Este módulo hace las dos mitades de ese camino:
 *
 *   · `normalize` convierte lo que la persona escribió —o pegó desde su Excel,
 *     con «₡1.500», «12,5» y «15/10/2026»— en datos limpios, y dice fila por
 *     fila qué no entendió. No rechaza el formulario entero por una celda.
 *
 *   · `apply` carga esos datos al sistema: productos con su existencia
 *     inicial, clientes con lo que ya debían, listas de tareas y equipos.
 *
 * Lo que no se ve leyendo una función suelta:
 *
 *   · **Aplicar dos veces da lo mismo que aplicar una.** Cada documento sale
 *     con un identificador derivado del lote y de la fila, y se escribe
 *     entero. Si la carga se corta a la mitad, se repite sin duplicar nada.
 *
 *   · **Un saldo anterior no es una venta.** Lo que un cliente ya debía entra
 *     como obligación de cobro (`kind: 'opening'`): se cobra, envejece y
 *     aparece en la cartera, pero no cuenta como ingreso de ningún mes.
 *
 *   · **Las listas de tareas entran publicadas.** El orden operativo se abre
 *     con el segundo pago, «con un clic»: ese clic no debe ser además una
 *     tarde de publicar listas una por una.
 *
 *   · **La gente no se crea aquí.** Dar acceso a una persona es crearle una
 *     cuenta, y eso lo hace el anfitrión. `apply` devuelve a quién hay que
 *     invitar.
 */

import { DEFAULT_CREDIT_DAYS, DEFAULT_NOTICE_DAYS, FREQUENCIES, INTAKE_LIMITS, SECTORS, TENANT_ROLES, UNITS } from './catalog.js';
import { raise } from './errors.js';
import { today } from './erp.js';
import { multiply, parseMoney, parseQuantity } from './money.js';
import { commitInChunks } from './store.js';
import { addDays, isDay, periodOf } from './time.js';
import * as v from './validate.js';

/** El formulario vacío: la forma que tiene un borrador recién abierto. */
export function emptyIntake() {
    return {
        business: { name: '', sector: 'otro', contactName: '', phone: '', notes: '' },
        products: [],
        debtors: [],
        team: [],
        processes: [],
        equipment: []
    };
}

/** Las celdas de cada sección del formulario. Lo que no esté aquí no se guarda. */
const CELLS = Object.freeze({
    products: ['code', 'name', 'kind', 'unit', 'category', 'cost', 'price', 'stock', 'min'],
    debtors: ['name', 'phone', 'amount', 'since', 'due', 'note'],
    team: ['name', 'position', 'email', 'access'],
    processes: ['name', 'area', 'frequency', 'responsible', 'steps'],
    equipment: ['name', 'location', 'everyDays', 'lastOn']
});

/**
 * El borrador tal como lo escribió la persona, acotado: solo las celdas
 * conocidas, como texto, con tope de filas y de largo. Es lo que se guarda
 * mientras llena el formulario —para que al volver encuentre lo que puso, con
 * sus «₡1.500» y todo— y lo que impide que un borrador sea un saco donde
 * cabe cualquier cosa.
 */
export function sanitize(raw = {}) {
    const cell = (value, max) => (value === null || value === undefined ? '' : String(value).replace(/\r\n/g, '\n').slice(0, max));
    const business = raw.business || {};
    const clean = {
        business: {
            name: cell(business.name, 80).trim(),
            sector: Object.keys(SECTORS).includes(business.sector) ? business.sector : 'otro',
            contactName: cell(business.contactName, 80),
            phone: cell(business.phone, 40),
            notes: cell(business.notes, 1000)
        }
    };
    for (const [section, keys] of Object.entries(CELLS)) {
        const rows = Array.isArray(raw[section]) ? raw[section].slice(0, INTAKE_LIMITS[section]) : [];
        clean[section] = rows
            .filter(row => row && typeof row === 'object')
            .map(row => Object.fromEntries(keys.map(key => [key, cell(Array.isArray(row[key]) ? row[key].join('\n') : row[key], key === 'steps' ? 3000 : 160)])));
    }
    return clean;
}

/* ================================================================== *
 * Leer lo que escribió una persona
 * ================================================================== */

/** «2026-10-15», «15/10/2026», «15-10-26» → «2026-10-15», o null. */
export function parseDay(value) {
    const text = v.text(value, 20);
    if (!text) return null;
    if (isDay(text)) return text;
    const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(text);
    if (!match) return null;
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    const day = `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    return isDay(day) ? day : null;
}

/**
 * Filas pegadas desde una hoja de cálculo. Excel y Google Sheets copian con
 * tabuladores; un CSV exportado en Costa Rica suele venir con punto y coma.
 * La primera fila se descarta si parece encabezado.
 */
export function parseTable(text, { columns = 0 } = {}) {
    const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n').filter(line => line.trim());
    if (!lines.length) return [];
    const separator = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
    const rows = lines.map(line => line.split(separator).map(cell => cell.trim().replace(/^"(.*)"$/, '$1')));
    const header = rows[0].join(' ').toLowerCase();
    const looksLikeHeader = /nombre|producto|código|codigo|precio|costo|cliente|monto|descripci/.test(header)
        && !rows[0].some(cell => parseMoney(cell) !== null && /\d/.test(cell));
    const body = looksLikeHeader ? rows.slice(1) : rows;
    return columns ? body.map(row => row.slice(0, columns)) : body;
}

const KIND_WORDS = { good: /^(p|producto|good|bien|art[ií]culo|mercader[ií]a)/i, service: /^(s|servicio|service|mano de obra)/i };

function productKind(value, unit) {
    const text = v.text(value, 30);
    if (KIND_WORDS.service.test(text)) return 'service';
    if (KIND_WORDS.good.test(text)) return 'good';
    return unit === 'servicio' || unit === 'hora' ? 'service' : 'good';
}

function unitOf(value) {
    const text = v.text(value, 20).toLowerCase();
    if (UNITS.includes(text)) return text;
    const alias = { un: 'unidad', und: 'unidad', unidades: 'unidad', u: 'unidad', kilo: 'kg', kilos: 'kg', kilogramo: 'kg', gramo: 'g', gramos: 'g', l: 'litro', lt: 'litro', litros: 'litro', m: 'metro', metros: 'metro', cajas: 'caja', paquetes: 'paquete', pares: 'par', horas: 'hora', h: 'hora' };
    return alias[text] || '';
}

const FREQUENCY_WORDS = [
    ['daily', /diari|todos los d[ií]as|cada d[ií]a|daily/i],
    ['weekly', /seman|weekly/i],
    ['monthly', /mes|mensual|monthly/i],
    ['on_demand', /haga falta|demanda|ocasional|cuando|on_demand/i]
];

export function frequencyOf(value) {
    const text = v.text(value, 40);
    if (FREQUENCIES.includes(text)) return text;
    return FREQUENCY_WORDS.find(([, pattern]) => pattern.test(text))?.[0] || 'daily';
}

const ACCESS_WORDS = [
    ['none', /^(no|ninguno|sin acceso|none)$/i],
    ['operations', /operaci|bodega|inventario|encargad|operations/i],
    ['collections', /cobr|caja|collections/i],
    ['viewer', /consulta|ver|viewer/i],
    ['staff', /colabora|tareas|staff|^s[ií]$/i]
];

export function accessOf(value) {
    const text = v.text(value, 40);
    if (TENANT_ROLES.includes(text) && text !== 'owner') return text;
    return ACCESS_WORDS.find(([, pattern]) => pattern.test(text))?.[0] || 'none';
}

const blank = row => !row || Object.values(row).every(value => (Array.isArray(value) ? !value.length : !String(value ?? '').trim()));

/**
 * Limpia el formulario y dice qué no entendió. `issues` lleva la sección, la
 * fila (desde 1, como la ve la persona) y la frase; `data` es lo que se
 * cargaría tal como está.
 */
export function normalize(raw = {}) {
    const issues = [];
    const issue = (section, row, message) => issues.push({ section, row, message });
    const rows = (value, limit) => (Array.isArray(value) ? value.slice(0, limit) : []);
    const business = raw.business || {};

    const data = {
        business: {
            name: v.text(business.name, 80),
            sector: Object.keys(SECTORS).includes(business.sector) ? business.sector : 'otro',
            contactName: v.text(business.contactName, 80),
            phone: v.phone(business.phone),
            notes: v.longText(business.notes, 1000)
        },
        products: [],
        debtors: [],
        team: [],
        processes: [],
        equipment: []
    };

    const codes = new Set();
    rows(raw.products, INTAKE_LIMITS.products).forEach((row, index) => {
        if (blank(row)) return;
        const line = index + 1;
        const name = v.text(row.name, 120);
        if (!name) { issue('products', line, 'Falta el nombre.'); return; }
        const unit = unitOf(row.unit);
        const kind = productKind(row.kind, unit);
        const priceMinor = parseMoney(row.price);
        const costMinor = parseMoney(row.cost);
        if (String(row.price ?? '').trim() && priceMinor === null) issue('products', line, `No se entiende el precio de «${name}».`);
        if (String(row.cost ?? '').trim() && costMinor === null) issue('products', line, `No se entiende el costo de «${name}».`);
        if (priceMinor === null || priceMinor === 0) issue('products', line, `«${name}» no tiene precio de venta.`);
        if (kind === 'good' && !costMinor) issue('products', line, `«${name}» no tiene costo: sin él no se puede calcular su margen.`);
        const stockMilli = kind === 'good' ? parseQuantity(row.stock) : null;
        if (kind === 'good' && String(row.stock ?? '').trim() && stockMilli === null) issue('products', line, `No se entiende la existencia de «${name}».`);
        let code = v.text(row.code, 40);
        const key = v.codeKey(code);
        if (key && codes.has(key)) { issue('products', line, `El código «${code}» está repetido; el sistema le pondrá otro.`); code = ''; }
        if (key) codes.add(key);
        data.products.push({
            code, name, kind, unit: unit || (kind === 'service' ? 'servicio' : 'unidad'), category: v.text(row.category, 60),
            costMinor: costMinor || 0, priceMinor: priceMinor || 0,
            stockMilli: stockMilli || 0, minMilli: kind === 'good' ? (parseQuantity(row.min) || 0) : 0
        });
    });

    rows(raw.debtors, INTAKE_LIMITS.debtors).forEach((row, index) => {
        if (blank(row)) return;
        const line = index + 1;
        const name = v.text(row.name, 120);
        const amountMinor = parseMoney(row.amount);
        if (!name) { issue('debtors', line, 'Falta el nombre de quien debe.'); return; }
        if (!amountMinor) { issue('debtors', line, `No se entiende cuánto debe «${name}».`); return; }
        const since = parseDay(row.since);
        const due = parseDay(row.due);
        if (String(row.since ?? '').trim() && !since) issue('debtors', line, `No se entiende la fecha de «${name}»; se usará la de hoy.`);
        data.debtors.push({ name, phone: v.phone(row.phone), amountMinor, since, due: due && since && due < since ? since : due, note: v.text(row.note, 200) });
    });

    rows(raw.team, INTAKE_LIMITS.team).forEach((row, index) => {
        if (blank(row)) return;
        const line = index + 1;
        const name = v.text(row.name, 80);
        if (!name) { issue('team', line, 'Falta el nombre.'); return; }
        const email = v.email(row.email);
        const access = accessOf(row.access);
        if (String(row.email ?? '').trim() && !email) issue('team', line, `El correo de «${name}» no tiene forma de correo.`);
        if (access !== 'none' && !email) issue('team', line, `«${name}» necesita un correo para poder entrar al sistema.`);
        data.team.push({ name, position: v.text(row.position, 80), email, access });
    });

    rows(raw.processes, INTAKE_LIMITS.processes).forEach((row, index) => {
        if (blank(row)) return;
        const line = index + 1;
        const name = v.text(row.name, 120);
        const steps = (Array.isArray(row.steps) ? row.steps : String(row.steps || '').split('\n'))
            .map(step => v.text(String(step).replace(/^\s*(?:\d+[.)-]|[-•*])\s*/, ''), 200))
            .filter(Boolean)
            .slice(0, INTAKE_LIMITS.steps);
        if (!name) { issue('processes', line, 'Falta el nombre del proceso.'); return; }
        if (!steps.length) { issue('processes', line, `«${name}» no tiene pasos: escriba uno por línea.`); return; }
        data.processes.push({ name, area: v.text(row.area, 60), frequency: frequencyOf(row.frequency), responsible: v.text(row.responsible, 80), steps });
    });

    rows(raw.equipment, INTAKE_LIMITS.equipment).forEach((row, index) => {
        if (blank(row)) return;
        const line = index + 1;
        const name = v.text(row.name, 120);
        if (!name) { issue('equipment', line, 'Falta el nombre del equipo.'); return; }
        const everyDays = Number.parseInt(String(row.everyDays ?? '').replace(/[^\d]/g, ''), 10);
        const lastOn = parseDay(row.lastOn);
        if (String(row.lastOn ?? '').trim() && !lastOn) issue('equipment', line, `No se entiende la fecha del último mantenimiento de «${name}».`);
        data.equipment.push({
            name, location: v.text(row.location, 80),
            everyDays: Number.isInteger(everyDays) && everyDays > 0 && everyDays <= 3650 ? everyDays : null,
            lastOn
        });
    });

    return {
        data,
        issues,
        counts: {
            products: data.products.length,
            debtors: data.debtors.length,
            team: data.team.length,
            processes: data.processes.length,
            equipment: data.equipment.length
        }
    };
}

/* ================================================================== *
 * Cargar al sistema
 * ================================================================== */

/**
 * Carga un formulario ya normalizado. `batchId` identifica el lote: de él
 * salen los identificadores, y por eso repetir la carga no duplica nada.
 */
export async function apply(scope, data, { batchId }) {
    v.id(batchId, 'batchId');
    if (!data?.products?.length && !data?.debtors?.length && !data?.processes?.length && !data?.equipment?.length) raise('INTAKE_EMPTY');
    const now = scope.now().toISOString();
    const day = today(scope);
    const writes = [];
    const skipped = [];
    const { store } = scope;

    /* ---------- Productos ---------- */

    const [existingCodes, productCounter, openingCounter, alreadyLoaded] = await Promise.all([
        store.query('productCodes', { limit: 5000 }),
        store.get('counters', 'products'),
        store.get('counters', 'openings'),
        // Lo que este mismo lote ya dejó escrito en una pasada anterior: un
        // producto al que el sistema le puso código lo conserva al repetir.
        store.getMany('products', (data.products || []).map((row, index) => `in-${batchId}-p${index}`))
    ]);
    // Los códigos que ya usa el negocio, sin contar los de este mismo lote
    // (que en una segunda pasada ya estarían escritos).
    const own = id => String(id).startsWith(`in-${batchId}-`);
    const taken = new Set(existingCodes.filter(row => !own(row.productId)).map(row => row.id));
    let sequence = productCounter?.value || 0;
    let products = 0;
    let stockValueMinor = 0;

    (data.products || []).forEach((row, index) => {
        const id = `in-${batchId}-p${index}`;
        let code = row.code || alreadyLoaded.get(id)?.code || '';
        let key = v.codeKey(code);
        if (key && taken.has(key)) { skipped.push({ section: 'products', row: index + 1, reason: `El código «${code}» ya existe en el negocio.` }); return; }
        if (!key) {
            do { sequence += 1; code = `P-${String(sequence).padStart(4, '0')}`; key = v.codeKey(code); } while (taken.has(key));
        }
        taken.add(key);
        const good = row.kind === 'good';
        writes.push(store.write.set('products', id, {
            code, codeKey: key, name: row.name, kind: row.kind, unit: row.unit, category: row.category || '',
            costMinor: row.costMinor, priceMinor: row.priceMinor, currency: scope.tenant.currency,
            minStockMilli: good ? row.minMilli : 0, active: true, createdAt: now, updatedAt: now, createdBy: scope.actor.uid, source: 'intake'
        }));
        writes.push(store.write.set('productCodes', key, { productId: id }));
        if (good) {
            writes.push(store.write.set('stock', id, { onHandMilli: row.stockMilli, costMinor: row.costMinor, minMilli: row.minMilli, low: row.stockMilli <= row.minMilli, updatedAt: now }));
            if (row.stockMilli > 0) {
                writes.push(store.write.set('movements', `in-${batchId}-m${index}`, {
                    productId: id, type: 'opening', quantityMilli: row.stockMilli, unitCostMinor: row.costMinor, balanceMilli: row.stockMilli,
                    date: day, period: periodOf(day), ref: null, note: 'Existencia inicial de la incorporación', at: now, by: scope.actor.uid, byName: scope.actor.name
                }));
                stockValueMinor += multiply(row.stockMilli, row.costMinor);
            }
        }
        products += 1;
    });
    if (sequence !== (productCounter?.value || 0)) writes.push(store.write.set('counters', 'products', { value: sequence, updatedAt: now }));

    /* ---------- Clientes y lo que ya debían ---------- */

    // Quien debe dos facturas aparece dos veces en el formulario y es un solo cliente.
    const customers = new Map();
    let openingSequence = openingCounter?.value || 0;
    let receivablesMinor = 0;
    (data.debtors || []).forEach((row, index) => {
        const key = row.name.toLowerCase();
        let customer = customers.get(key);
        if (!customer) {
            customer = { id: `in-${batchId}-c${customers.size}`, name: row.name, phone: row.phone || '', balanceMinor: 0 };
            customers.set(key, customer);
        }
        if (!customer.phone && row.phone) customer.phone = row.phone;
        customer.balanceMinor += row.amountMinor;
        receivablesMinor += row.amountMinor;
        openingSequence += 1;
        const date = row.since && row.since <= day ? row.since : day;
        writes.push(store.write.set('sales', `in-${batchId}-s${index}`, {
            kind: 'opening', number: `SI-${String(openingSequence).padStart(6, '0')}`, date, period: periodOf(date),
            customerId: customer.id, customerName: customer.name, term: 'credit', method: null,
            dueDate: row.due || date, lines: [], totalMinor: row.amountMinor, costMinor: 0, currency: scope.tenant.currency,
            paidMinor: 0, balanceMinor: row.amountMinor, open: true, status: 'confirmed',
            note: row.note || 'Saldo anterior al sistema', createdAt: now, createdBy: scope.actor.uid, createdByName: scope.actor.name
        }));
    });
    for (const customer of customers.values()) {
        writes.push(store.write.set('customers', customer.id, {
            name: customer.name, phone: customer.phone, email: '', idNumber: '', creditDays: DEFAULT_CREDIT_DAYS, notes: '',
            balanceMinor: customer.balanceMinor, active: true, createdAt: now, updatedAt: now, createdBy: scope.actor.uid, source: 'intake'
        }));
    }
    if (openingSequence !== (openingCounter?.value || 0)) writes.push(store.write.set('counters', 'openings', { value: openingSequence, updatedAt: now }));

    /* ---------- Listas de tareas ---------- */

    (data.processes || []).forEach((row, index) => {
        writes.push(store.write.set('processes', `in-${batchId}-r${index}`, {
            name: row.name, area: row.area || '',
            // Quién lo hace viene como texto libre («Marta, la de caja»): se
            // conserva a la vista. Asignarlo a una cuenta se hace después,
            // cuando esa persona ya tiene acceso.
            purpose: row.responsible ? `Responsable según el formulario: ${row.responsible}.` : '',
            frequency: row.frequency,
            weekdays: row.frequency === 'daily' ? [1, 2, 3, 4, 5, 6] : (row.frequency === 'weekly' ? [1] : []),
            monthDay: row.frequency === 'monthly' ? 1 : null,
            assignees: [],
            steps: row.steps.map((text, step) => ({ id: `s${step + 1}`, text, detail: '' })),
            status: 'published', version: 1, publishedAt: now, createdAt: now, updatedAt: now, createdBy: scope.actor.uid, source: 'intake'
        }));
    });

    /* ---------- Equipos ---------- */

    (data.equipment || []).forEach((row, index) => {
        const lastOn = row.lastOn && row.lastOn <= day ? row.lastOn : null;
        writes.push(store.write.set('equipment', `in-${batchId}-e${index}`, {
            name: row.name, code: '', location: row.location || '', category: '',
            everyDays: row.everyDays, noticeDays: DEFAULT_NOTICE_DAYS, lastOn,
            nextDueOn: row.everyDays ? addDays(lastOn || day, row.everyDays) : null,
            notes: '', active: true, createdAt: now, updatedAt: now, createdBy: scope.actor.uid, source: 'intake'
        }));
    });

    await commitInChunks(store, writes);
    return {
        created: {
            products,
            customers: customers.size,
            openingBalances: (data.debtors || []).length,
            processes: (data.processes || []).length,
            equipment: (data.equipment || []).length
        },
        totals: { stockValueMinor, receivablesMinor, currency: scope.tenant.currency },
        skipped,
        // A quién hay que darle acceso: lo hace quien llama, que es quien puede crear cuentas.
        team: (data.team || []).map(row => ({ name: row.name, position: row.position || '', email: row.email || '', access: row.access }))
    };
}
