/**
 * Mapa de secciones. Es la única fuente: la barra lateral, el título de la
 * pantalla y el enrutado leen de aquí.
 *
 * Esconder una entrada no es seguridad. Cada ruta del API vuelve a comprobar
 * el papel, la membresía y la suscripción; este mapa solo decide qué se
 * enseña, para no ofrecerle a alguien un botón que le va a responder que no.
 *
 * `module` nombra el derecho de uso que hace falta. Una sección cuyo módulo
 * todavía no está habilitado **no se esconde**: se enseña apagada, diciendo
 * cuándo se abre. Esconderla haría creer que el sistema no lo hace.
 */

export const SECTIONS = [
    { id: 'resumen', group: 'negocio', label: 'Resumen', icon: '▦', scope: 'tenant' },
    { id: 'finanzas', group: 'negocio', label: 'Control financiero', icon: '◫', scope: 'tenant', module: 'erp' },
    { id: 'operacion', group: 'negocio', label: 'Orden operativo', icon: '◷', scope: 'tenant', module: 'qms' },
    { id: 'auditoria', group: 'negocio', label: 'Auditoría mensual', icon: '◆', scope: 'tenant', module: 'audit' },
    { id: 'gente', group: 'negocio', label: 'Gente', icon: '◎', scope: 'tenant' },

    { id: 'negocios', group: 'valtrix', label: 'Negocios', icon: '▤', scope: 'staff' },

    { id: 'cuenta', group: 'personal', label: 'Mi cuenta', icon: '◇', scope: 'always' }
];

export const GROUP_LABEL = {
    negocio: 'El negocio',
    valtrix: 'Administración de VALTRIX',
    personal: 'Personal'
};

export const HOME = { developer: 'negocios', admin: 'negocios', business: 'resumen' };

export function sectionsFor({ role, hasTenant }) {
    return SECTIONS.filter(section => {
        if (section.scope === 'always') return true;
        if (section.scope === 'staff') return role === 'admin' || role === 'developer';
        return hasTenant;
    });
}

export function groupsFor(context) {
    const groups = [];
    for (const section of sectionsFor(context)) {
        let group = groups.find(item => item.id === section.group);
        if (!group) { group = { id: section.group, items: [] }; groups.push(group); }
        group.items.push(section);
    }
    return groups;
}

export function findSection(context, id) {
    return sectionsFor(context).find(section => section.id === id) || null;
}

/** '#/gente?x=1' → { section: 'gente', query }. */
export function parseHash(hash = location.hash) {
    const clean = hash.replace(/^#\/?/, '');
    const [path, search = ''] = clean.split('?');
    const [section = '', param = ''] = path.split('/').filter(Boolean);
    return { section, param, query: new URLSearchParams(search) };
}

export function go(section, { replace = false } = {}) {
    const target = `#/${section}`;
    if (location.hash === target) return;
    if (replace) location.replace(target);
    else location.hash = target;
}
