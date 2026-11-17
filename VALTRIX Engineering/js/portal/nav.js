/**
 * Mapa de secciones. Es la única fuente: la barra lateral, el título de la
 * pantalla y el enrutado leen de aquí.
 *
 * Esconder una entrada no es seguridad. Cada ruta del API vuelve a comprobar
 * el papel, la membresía, la capacidad y la suscripción; este mapa solo decide
 * qué se enseña, y lo decide con dos criterios distintos a propósito:
 *
 *   · **Lo que la persona no puede hacer, no se le ofrece.** Un colaborador no
 *     ve «Ventas»: darle un botón que le va a responder que no es peor que no
 *     dárselo. `needs` lista las capacidades que abren la sección (basta una).
 *
 *   · **Lo que el negocio todavía no tiene, se enseña apagado.** Un módulo que
 *     se abre con el siguiente pago aparece en el menú, sin color, diciendo
 *     cuándo se activa. Esconderlo haría creer que el sistema no lo hace.
 */

import { MODULE_LABEL, MODULE_PERIODS } from '../core/catalog.js';

export const SECTIONS = [
    { id: 'resumen', group: 'negocio', label: 'Resumen', icon: '▦', scope: 'tenant', view: 'resumen' },

    { id: 'ventas', group: 'erp', label: 'Ventas', icon: '◫', scope: 'tenant', module: 'erp', needs: ['sale.read'], view: 'ventas' },
    { id: 'clientes', group: 'erp', label: 'Clientes y cobros', icon: '◎', scope: 'tenant', module: 'erp', needs: ['customer.read'], view: 'clientes' },
    { id: 'productos', group: 'erp', label: 'Productos', icon: '▤', scope: 'tenant', module: 'erp', needs: ['inventory.read', 'product.manage'], view: 'productos' },
    { id: 'inventario', group: 'erp', label: 'Inventario', icon: '▥', scope: 'tenant', module: 'erp', needs: ['inventory.read'], view: 'productos' },

    { id: 'dia', group: 'qms', label: 'Mi día', icon: '◷', scope: 'tenant', module: 'qms', needs: ['process.read'], view: 'qms' },
    { id: 'listas', group: 'qms', label: 'Listas de tareas', icon: '☰', scope: 'tenant', module: 'qms', needs: ['process.manage', 'report.read'], view: 'qms' },
    { id: 'equipos', group: 'qms', label: 'Equipos', icon: '⚙', scope: 'tenant', module: 'qms', needs: ['equipment.read'], view: 'qms' },

    { id: 'informes', group: 'audit', label: 'Informes del mes', icon: '◆', scope: 'tenant', module: 'audit', needs: ['report.read'], view: 'informes' },

    { id: 'gente', group: 'equipo', label: 'Gente', icon: '◉', scope: 'tenant', view: 'negocio' },

    { id: 'tablero', group: 'valtrix', label: 'Tablero', icon: '▣', scope: 'staff', view: 'valtrix' },
    { id: 'prospectos', group: 'valtrix', label: 'Prospectos', icon: '◈', scope: 'staff', view: 'valtrix' },
    { id: 'negocios', group: 'valtrix', label: 'Negocios', icon: '▧', scope: 'staff', view: 'valtrix' },

    { id: 'cuenta', group: 'personal', label: 'Mi cuenta', icon: '◇', scope: 'always', view: 'negocio' }
];

export const GROUP_LABEL = {
    negocio: 'El negocio',
    erp: MODULE_LABEL.erp,
    qms: MODULE_LABEL.qms,
    audit: MODULE_LABEL.audit,
    equipo: 'Equipo',
    valtrix: 'Administración de VALTRIX',
    personal: 'Personal'
};

const STAFF = ['admin', 'developer'];

export const can = (tenant, capability) => Boolean(tenant) && (tenant.capabilities.includes('*') || tenant.capabilities.includes(capability));
export const has = (tenant, module) => Boolean(tenant?.entitlements?.[module]);

/** Qué falta para que un módulo se abra, dicho sin tecnicismos. */
export function moduleHint(module, paidPeriods = 0) {
    const missing = MODULE_PERIODS[module] - paidPeriods;
    if (missing <= 0) return 'Disponible';
    return missing === 1 ? 'Se activa con el siguiente pago' : `Se activa tras ${missing} pagos más`;
}

/** Las secciones que se le enseñan a esta persona, con las apagadas marcadas. */
export function sectionsFor({ role, tenant }) {
    return SECTIONS
        .filter(section => {
            if (section.scope === 'always') return true;
            if (section.scope === 'staff') return STAFF.includes(role);
            if (!tenant) return false;
            return !section.needs || section.needs.some(capability => can(tenant, capability));
        })
        .map(section => ({ ...section, locked: Boolean(section.module) && !has(tenant, section.module) }));
}

export function groupsFor(context) {
    const groups = [];
    for (const section of sectionsFor(context)) {
        let group = groups.find(item => item.id === section.group);
        if (!group) {
            group = { id: section.group, label: GROUP_LABEL[section.group], module: section.module || null, locked: false, items: [] };
            groups.push(group);
        }
        group.items.push(section);
        group.locked = group.items.every(item => item.locked);
    }
    return groups;
}

export const findSection = (context, id) => sectionsFor(context).find(section => section.id === id) || null;

/**
 * A dónde va cada quien al entrar. Quien no ve los números del negocio pero
 * sí tiene tareas —un colaborador— va directo a su día: el resumen no tendría
 * otra cosa que enseñarle.
 */
export function homeFor(context) {
    const { tenant } = context;
    if (tenant) return !can(tenant, 'report.read') && can(tenant, 'process.read') && has(tenant, 'qms') ? 'dia' : 'resumen';
    return STAFF.includes(context.role) ? 'tablero' : 'cuenta';
}

/** «#/clientes/abc?x=1» → { section: 'clientes', param: 'abc', query }. */
export function parseHash(hash = location.hash) {
    const clean = hash.replace(/^#\/?/, '');
    const [path, search = ''] = clean.split('?');
    const [section = '', ...rest] = path.split('/').filter(Boolean);
    return { section, param: rest.length ? decodeURIComponent(rest.join('/')) : null, query: new URLSearchParams(search) };
}

export function href(section, param = null, query = null) {
    const search = query ? `?${new URLSearchParams(query)}` : '';
    return `#/${section}${param ? `/${encodeURIComponent(param)}` : ''}${search}`;
}

export function go(section, param = null, query = null, { replace = false } = {}) {
    const target = href(section, param, query);
    if (location.hash === target) { window.dispatchEvent(new HashChangeEvent('hashchange')); return; }
    if (replace) location.replace(target);
    else location.hash = target;
}
