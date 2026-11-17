/**
 * Las rutas de un negocio: qué se puede pedir, con qué módulo y qué capacidad.
 *
 * Es UNA tabla y la leen dos anfitriones:
 *
 *   · el Worker, que monta cada entrada bajo `/api/tenants/:tenantId…` y antes
 *     de ejecutarla comprueba la membresía, el módulo, la capacidad y la
 *     suscripción (`backend/valtrix/src/lib/tenant-route.js`);
 *
 *   · la demo, que despacha las mismas entradas dentro del navegador contra
 *     un almacén en memoria.
 *
 * Por eso la demo no es una maqueta del sistema: es el sistema, con otra base
 * debajo. Una ruta que se añade aquí existe en los dos sitios; no hay una
 * segunda lista que se pueda quedar atrás.
 *
 * Aquí no hay seguridad —esto es público, lo descarga cualquiera—: hay la
 * DECLARACIÓN de lo que cada ruta exige. Quien la hace cumplir es el Worker.
 *
 * Cada entrada:
 *   method, path     la ruta, relativa al negocio
 *   module           el módulo que la suscripción tiene que haber abierto
 *   capability       la capacidad que exige (una escritura declara una sola)
 *   anyOf            para LEER, varias capacidades: basta una
 *   run(engine, { params, query, body, modules })
 *                    `engine` llega ya encerrado en el negocio; `modules` dice
 *                    qué módulos tiene abiertos (el cierre habla de listas y
 *                    equipos solo si el negocio ya tiene ese módulo)
 *
 * Los importes entran en la unidad menor (`…Minor`) y las cantidades en
 * milésimas (`…Milli`), como enteros. Quien llama convierte lo que escribió
 * la persona antes de enviar; el API no adivina si «1500» son colones o
 * céntimos.
 */

import * as audit from './audit.js';
import * as erp from './erp.js';
import * as qms from './qms.js';

const ERP = 'erp';
const QMS = 'qms';
const AUDIT = 'audit';

/** «?all=1» y parecidos. */
const flag = value => value === '1' || value === 'true';

/**
 * Ver el día y administrar las listas son permisos distintos: un colaborador
 * ve y marca lo que le toca, no lo de los demás. `?all=1` solo se respeta a
 * quien administra las listas o puede ver el resumen del negocio.
 */
const seesAll = (engine, query) => flag(query.get('all')) && (engine.can('process.manage') || engine.can('report.read'));

export const TENANT_ROUTES = Object.freeze([
    /* ================================================================ *
     * Control financiero
     * ================================================================ */

    { method: 'GET', path: '/erp/summary', module: ERP, capability: 'report.read', run: engine => erp.erpSummary(engine) },

    // La lista de productos la necesita quien lleva el inventario y también quien vende.
    { method: 'GET', path: '/products', module: ERP, anyOf: ['inventory.read', 'sale.record', 'product.manage'],
        run: (engine, { query }) => erp.listProducts(engine, { includeInactive: flag(query.get('all')) }) },
    { method: 'POST', path: '/products', module: ERP, capability: 'product.manage', run: (engine, { body }) => erp.createProduct(engine, body) },
    { method: 'PATCH', path: '/products/:id', module: ERP, capability: 'product.manage', run: (engine, { params, body }) => erp.updateProduct(engine, params.id, body) },

    { method: 'GET', path: '/movements', module: ERP, capability: 'inventory.read',
        run: (engine, { query }) => erp.listMovements(engine, { productId: query.get('productId'), limit: Number(query.get('limit')) || 100 }) },
    { method: 'POST', path: '/movements', module: ERP, capability: 'inventory.adjust', run: (engine, { body }) => erp.recordMovement(engine, body) },

    // Qué dejó cada producto. Sin `cost.read` esta tabla no tendría nada que decir.
    { method: 'GET', path: '/margins', module: ERP, capability: 'cost.read', run: (engine, { query }) => erp.productMargins(engine, { period: query.get('period') }) },

    { method: 'GET', path: '/customers', module: ERP, anyOf: ['customer.read', 'sale.record'],
        run: (engine, { query }) => erp.listCustomers(engine, { includeInactive: flag(query.get('all')) }) },
    { method: 'POST', path: '/customers', module: ERP, capability: 'customer.manage', run: (engine, { body }) => erp.createCustomer(engine, body) },
    { method: 'GET', path: '/customers/:id', module: ERP, capability: 'customer.read', run: (engine, { params }) => erp.getCustomer(engine, params.id) },
    { method: 'PATCH', path: '/customers/:id', module: ERP, capability: 'customer.manage', run: (engine, { params, body }) => erp.updateCustomer(engine, params.id, body) },
    { method: 'POST', path: '/customers/:id/opening-balance', module: ERP, capability: 'customer.manage',
        run: (engine, { params, body }) => erp.createOpeningBalance(engine, { ...body, customerId: params.id }) },
    { method: 'GET', path: '/receivables', module: ERP, capability: 'customer.read', run: engine => erp.receivables(engine) },

    { method: 'GET', path: '/sales', module: ERP, capability: 'sale.read',
        run: (engine, { query }) => erp.listSales(engine, { period: query.get('period'), customerId: query.get('customerId'), open: flag(query.get('open')) }) },
    { method: 'POST', path: '/sales', module: ERP, capability: 'sale.record', run: (engine, { body }) => erp.createSale(engine, body) },
    { method: 'GET', path: '/sales/:id', module: ERP, capability: 'sale.read', run: (engine, { params }) => erp.getSale(engine, params.id) },
    { method: 'POST', path: '/sales/:id/void', module: ERP, capability: 'sale.void', run: (engine, { params, body }) => erp.voidSale(engine, params.id, body) },

    { method: 'GET', path: '/payments', module: ERP, capability: 'customer.read',
        run: (engine, { query }) => erp.listPayments(engine, { period: query.get('period'), customerId: query.get('customerId') }) },
    { method: 'POST', path: '/payments', module: ERP, capability: 'payment.record', run: (engine, { body }) => erp.recordPayment(engine, body) },
    { method: 'POST', path: '/payments/:id/void', module: ERP, capability: 'payment.void', run: (engine, { params, body }) => erp.voidPayment(engine, params.id, body) },

    /* ================================================================ *
     * Orden operativo
     * ================================================================ */

    { method: 'GET', path: '/qms/summary', module: QMS, capability: 'process.read', run: (engine, { query }) => qms.qmsSummary(engine, { all: seesAll(engine, query) }) },

    { method: 'GET', path: '/tasks', module: QMS, capability: 'process.read',
        run: (engine, { query }) => qms.dayPlan(engine, { date: query.get('date'), all: seesAll(engine, query) }) },
    { method: 'POST', path: '/tasks/toggle', module: QMS, capability: 'process.run', run: (engine, { body }) => qms.toggleStep(engine, body) },

    { method: 'GET', path: '/processes', module: QMS, anyOf: ['process.manage', 'report.read'],
        run: (engine, { query }) => qms.listProcesses(engine, { includeArchived: flag(query.get('all')) }) },
    { method: 'POST', path: '/processes', module: QMS, capability: 'process.manage', run: (engine, { body }) => qms.saveProcess(engine, null, body) },
    { method: 'GET', path: '/processes/:id', module: QMS, anyOf: ['process.manage', 'report.read'], run: (engine, { params }) => qms.getProcess(engine, params.id) },
    { method: 'PATCH', path: '/processes/:id', module: QMS, capability: 'process.manage', run: (engine, { params, body }) => qms.saveProcess(engine, params.id, body) },
    { method: 'POST', path: '/processes/:id/status', module: QMS, capability: 'process.manage', run: (engine, { params, body }) => qms.setProcessStatus(engine, params.id, body.status) },

    { method: 'GET', path: '/equipment', module: QMS, capability: 'equipment.read',
        run: (engine, { query }) => qms.listEquipment(engine, { includeInactive: flag(query.get('all')) }) },
    { method: 'POST', path: '/equipment', module: QMS, capability: 'equipment.manage', run: (engine, { body }) => qms.saveEquipment(engine, null, body) },
    { method: 'PATCH', path: '/equipment/:id', module: QMS, capability: 'equipment.manage', run: (engine, { params, body }) => qms.saveEquipment(engine, params.id, body) },
    { method: 'GET', path: '/equipment/:id/maintenance', module: QMS, capability: 'equipment.read', run: (engine, { params }) => qms.listMaintenance(engine, { equipmentId: params.id }) },
    { method: 'POST', path: '/equipment/:id/maintenance', module: QMS, capability: 'equipment.manage', run: (engine, { params, body }) => qms.registerMaintenance(engine, params.id, body) },

    /* ================================================================ *
     * Auditoría mensual
     *
     * El informe lo escribe SIEMPRE el motor. No hay ninguna ruta que reciba
     * un informe: `POST /reports/:period` dice «emita el cierre de ese mes».
     * ================================================================ */

    { method: 'GET', path: '/reports', module: AUDIT, capability: 'report.read', run: engine => audit.listReports(engine) },
    // Antes que `:period`: «preview» no es un período.
    { method: 'GET', path: '/reports/preview', module: AUDIT, capability: 'report.read', run: (engine, { modules }) => audit.previewReport(engine, { modules: { qms: Boolean(modules.qms) } }) },
    { method: 'GET', path: '/reports/:period', module: AUDIT, capability: 'report.read', run: (engine, { params }) => audit.getReport(engine, params.period) },
    { method: 'POST', path: '/reports/:period', module: AUDIT, capability: 'report.generate',
        run: (engine, { params, modules }) => audit.generateReport(engine, params.period, { modules: { qms: Boolean(modules.qms) } }) }
]);

/** «/products/:id» contra «/products/abc» → { id: 'abc' }, o null si no cuadra. */
export function matchPath(pattern, path) {
    const expected = pattern.split('/').filter(Boolean);
    const actual = path.split('/').filter(Boolean);
    if (expected.length !== actual.length) return null;
    const params = {};
    for (let index = 0; index < expected.length; index += 1) {
        const part = expected[index];
        if (part.startsWith(':')) {
            const value = decodeURIComponent(actual[index]);
            if (!value) return null;
            params[part.slice(1)] = value;
        } else if (part !== actual[index]) {
            return null;
        }
    }
    return params;
}
