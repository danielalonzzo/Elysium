/**
 * Las pantallas del portal.
 *
 * Cada vista recibe el estado (quién es, qué negocio está activo) y devuelve
 * un nodo. Ninguna guarda nada: lo que se ve sale siempre del API, y lo que se
 * cambia se vuelve a pedir. Es más lento y es correcto: una pantalla que
 * recuerda un dato que el servidor rechazó enseña una mentira.
 */

import { get, patch, post } from './api.js';
import {
    MODULE_LABEL, SUBSCRIPTION_LABEL, TENANT_ROLE_LABEL, clear, date, empty,
    h, initials, loading, moduleHint, notice
} from './ui.js';

const card = (...children) => h('article', { class: 'card portal-card' }, ...children);

/** «America/Costa_Rica» es un identificador de zona horaria, no algo que se le
    diga a nadie: lo que importa es el lugar. */
const placeName = zone => String(zone || '').split('/').pop().replace(/_/g, ' ');

/** Pinta en el nodo lo que devuelva `build`, con su estado de carga y de error. */
async function render(node, build) {
    clear(node).append(loading());
    try {
        const content = await build();
        clear(node).append(content);
    } catch (error) {
        clear(node).append(notice(error.message, 'error'));
    }
}

/* ================================================================== *
 * Resumen del negocio
 * ================================================================== */

export function resumen(state) {
    const node = h('div');
    render(node, async () => {
        const tenant = await get(`/tenants/${encodeURIComponent(state.tenantId)}`);
        const { subscription, entitlements } = tenant;
        const periods = subscription.paidPeriods || 0;

        return h('div', {},
            h('p', { class: 'eyebrow', text: 'El negocio' }),
            h('h1', { text: tenant.name }),
            h('p', { class: 'lead' },
                `Usted entra como ${TENANT_ROLE_LABEL[tenant.role] || tenant.role}. `,
                `La información se muestra en ${tenant.baseCurrency}, y el cierre de cada mes sigue la hora de ${placeName(tenant.timezone)}.`),

            h('div', { class: 'crm-kpis' },
                card(h('p', { text: 'Suscripción' }), h('strong', { class: 'portal-kpi-text', text: SUBSCRIPTION_LABEL[subscription.state] || subscription.state })),
                card(h('p', { text: 'Períodos pagados' }), h('strong', { text: String(periods) })),
                card(h('p', { text: 'Período en curso hasta' }), h('strong', { class: 'portal-kpi-text', text: date(subscription.currentPeriodEnd) }))),

            subscription.state === 'suspended'
                ? notice('La suscripción está suspendida: puede consultar todo lo registrado, pero no registrar nada nuevo. Sus datos siguen aquí.', 'warn')
                : null,
            subscription.state === 'past_due'
                ? notice('Hay un pago vencido. El servicio sigue completo por ahora.', 'warn')
                : null,

            h('section', { class: 'card crm-section' },
                h('h2', { text: 'Módulos' }),
                h('p', { class: 'portal-help', text: 'Los módulos se habilitan conforme avanza la suscripción, un período a la vez.' }),
                h('ul', { class: 'portal-modules' }, Object.keys(MODULE_LABEL).map(key => h('li', {
                    class: entitlements[key] ? 'is-open' : 'is-locked'
                },
                    h('span', { class: 'portal-module-name', text: MODULE_LABEL[key] }),
                    h('span', { class: 'portal-module-state', text: entitlements[key] ? 'Disponible' : moduleHint(key, periods) })))))
        );
    });
    return node;
}

/* ================================================================== *
 * Un módulo todavía no construido o todavía no habilitado
 * ================================================================== */

export function modulePlaceholder(state, section) {
    const node = h('div');
    render(node, async () => {
        const tenant = await get(`/tenants/${encodeURIComponent(state.tenantId)}`);
        const open = tenant.entitlements[section.module];
        return h('div', {},
            h('p', { class: 'eyebrow', text: MODULE_LABEL[section.module] }),
            h('h1', { text: section.label }),
            open
                ? notice('Este módulo está habilitado para su suscripción, pero todavía no está construido. Es la siguiente etapa del desarrollo.', 'info')
                : notice(`${moduleHint(section.module, tenant.subscription.paidPeriods)}. Hasta entonces la sección aparece aquí para que sepa que existe.`, 'warn')
        );
    });
    return node;
}

/* ================================================================== *
 * La gente del negocio
 * ================================================================== */

export function gente(state) {
    const node = h('div');

    const load = () => render(node, async () => {
        const [{ members }, permisos] = await Promise.all([
            get(`/tenants/${encodeURIComponent(state.tenantId)}/members`),
            get(`/tenants/${encodeURIComponent(state.tenantId)}/capabilities`)
        ]);

        const rows = members.map(member => {
            const esYo = member.uid === state.me.uid;
            const select = h('select', {
                class: 'portal-select',
                'aria-label': `Papel de ${member.name || member.email}`,
                // Nadie se cambia su propio papel: un propietario podría
                // degradarse por error y dejar el negocio sin quien lo administre.
                disabled: !permisos.canManageMembers || esYo,
                on: {
                    change: async event => {
                        const role = event.target.value;
                        event.target.disabled = true;
                        try {
                            await patch(`/tenants/${encodeURIComponent(state.tenantId)}/members/${encodeURIComponent(member.uid)}`, { role });
                            load();
                        } catch (error) {
                            clear(node).append(notice(error.message, 'error'), h('p', {}, h('button', { class: 'button compact', text: 'Volver a la lista', on: { click: load } })));
                        }
                    }
                }
            }, Object.entries(TENANT_ROLE_LABEL).map(([value, label]) =>
                h('option', { value, selected: value === member.role, text: label })));

            return h('tr', {},
                h('th', { scope: 'row', class: 'portal-person' },
                    h('span', { class: 'portal-avatar', 'aria-hidden': 'true', text: initials(member.name || member.email) }),
                    h('span', {}, h('strong', { text: member.name || '—' }), h('small', { class: 'portal-sub', text: member.email }))),
                h('td', {}, select),
                h('td', {}, h('span', { class: ['crm-badge', member.status !== 'active' && 'pending'], text: member.status === 'active' ? 'Activo' : 'Suspendido' })),
                h('td', { text: date(member.createdAt) }));
        });

        return h('div', {},
            h('p', { class: 'eyebrow', text: 'El negocio' }),
            h('h1', { text: 'Gente' }),
            h('p', { class: 'lead', text: permisos.canManageMembers
                ? 'Cada persona entra con su propia cuenta. El papel decide lo que puede hacer.'
                : 'Estas son las personas con acceso al negocio. Para cambiar un papel hace falta ser propietario.' }),
            members.length
                ? h('div', { class: 'crm-table', role: 'region', 'aria-label': 'Personas con acceso', tabindex: '0' },
                    h('table', {},
                        h('thead', {}, h('tr', {},
                            h('th', { scope: 'col', text: 'Persona' }),
                            h('th', { scope: 'col', text: 'Papel' }),
                            h('th', { scope: 'col', text: 'Estado' }),
                            h('th', { scope: 'col', text: 'Desde' }))),
                        h('tbody', {}, rows)))
                : empty('Todavía no hay nadie más en este negocio.'));
    });

    load();
    return node;
}

/* ================================================================== *
 * Administración de VALTRIX
 * ================================================================== */

export function negocios(state) {
    const node = h('div');

    const load = () => render(node, async () => {
        const { tenants } = await get('/admin/tenants');
        return h('div', {},
            h('p', { class: 'eyebrow', text: 'Administración de VALTRIX' }),
            h('h1', { text: 'Negocios' }),
            h('p', { class: 'lead', text: 'Altas, suscripciones e incorporación. Desde aquí no se leen los datos de ningún negocio: para eso hace falta una membresía en él.' }),
            altaForm(load),
            tenants.length
                ? h('div', { class: 'crm-table', role: 'region', 'aria-label': 'Negocios suscriptores', tabindex: '0' },
                    h('table', {},
                        h('thead', {}, h('tr', {},
                            h('th', { scope: 'col', text: 'Negocio' }),
                            h('th', { scope: 'col', text: 'Suscripción' }),
                            h('th', { scope: 'col', text: 'Períodos' }),
                            h('th', { scope: 'col', text: 'Alta' }))),
                        h('tbody', {}, tenants.map(tenant => h('tr', {},
                            h('th', { scope: 'row' },
                                h('strong', { text: tenant.name }),
                                h('small', { class: 'portal-sub', text: tenant.id })),
                            h('td', {}, h('span', {
                                class: ['crm-badge', tenant.subscription.state !== 'active' && 'pending'],
                                text: SUBSCRIPTION_LABEL[tenant.subscription.state] || tenant.subscription.state
                            })),
                            h('td', { text: String(tenant.subscription.paidPeriods || 0) }),
                            h('td', { text: date(tenant.createdAt) }))))))
                : empty('Todavía no hay negocios dados de alta.'));
    });

    load();
    return node;
}

function altaForm(onDone) {
    const message = h('div');
    const form = h('form', {
        class: 'card portal-card portal-form',
        on: {
            submit: async event => {
                event.preventDefault();
                const data = new FormData(form);
                const submit = form.querySelector('button[type="submit"]');
                submit.disabled = true;
                clear(message);
                try {
                    const created = await post('/admin/tenants', {
                        name: data.get('name'),
                        ownerEmail: data.get('ownerEmail'),
                        ownerName: data.get('ownerName')
                    });
                    form.reset();
                    message.append(notice(
                        `Negocio «${created.name}» dado de alta. ${created.owner.existed
                            ? 'Su propietario ya tenía cuenta en VALTRIX.'
                            : 'Se creó la cuenta del propietario; tiene que establecer su contraseña y verificar el correo antes de entrar.'}`,
                        'ok'));
                    onDone();
                } catch (error) {
                    message.append(notice(error.code === 'CONFLICT'
                        ? 'Ya existe un negocio con ese nombre.'
                        : error.message, 'error'));
                } finally {
                    submit.disabled = false;
                }
            }
        }
    },
        h('h2', { text: 'Dar de alta un negocio' }),
        h('p', { class: 'portal-help', text: 'Nace sin módulos abiertos y en estado pendiente: se activan al confirmar el primer pago.' }),
        h('div', { class: 'portal-fields' },
            field('name', 'Nombre del negocio', { required: true, maxlength: 80, placeholder: 'Taller Horizonte' }),
            field('ownerEmail', 'Correo del propietario', { required: true, type: 'email', maxlength: 254 }),
            field('ownerName', 'Nombre del propietario', { maxlength: 80 })),
        h('button', { type: 'submit', class: 'button', text: 'Dar de alta' }),
        message);
    return form;
}

function field(name, label, attributes = {}) {
    const id = `campo-${name}`;
    return h('p', { class: 'portal-field' },
        h('label', { for: id, text: label }),
        h('input', { id, name, type: 'text', ...attributes }));
}

/* ================================================================== *
 * Mi cuenta
 * ================================================================== */

export function cuenta(state, { onSignOut }) {
    const message = h('div');
    const form = h('form', {
        class: 'card portal-card portal-form',
        on: {
            submit: async event => {
                event.preventDefault();
                const data = new FormData(form);
                clear(message);
                try {
                    await patch('/me', { name: data.get('name'), phone: data.get('phone') });
                    message.append(notice('Guardado.', 'ok'));
                } catch (error) {
                    message.append(notice(error.message, 'error'));
                }
            }
        }
    },
        h('h2', { text: 'Sus datos' }),
        h('div', { class: 'portal-fields' },
            h('p', { class: 'portal-field' },
                h('label', { for: 'campo-nombre', text: 'Nombre' }),
                h('input', { id: 'campo-nombre', name: 'name', type: 'text', maxlength: 80, value: state.me.name || '', required: true })),
            h('p', { class: 'portal-field' },
                h('label', { for: 'campo-telefono', text: 'Teléfono' }),
                h('input', { id: 'campo-telefono', name: 'phone', type: 'tel', maxlength: 40, value: state.me.phone || '' }))),
        h('button', { type: 'submit', class: 'button', text: 'Guardar' }),
        message);

    return h('div', {},
        h('p', { class: 'eyebrow', text: 'Personal' }),
        h('h1', { text: 'Mi cuenta' }),
        h('p', { class: 'lead' },
            'Entró como ', h('strong', { text: state.me.email }), '. ',
            // El correo identifica la cuenta y arrastra la verificación: no es
            // un campo más de un formulario de perfil.
            'El correo no se cambia desde aquí; escriba a VALTRIX si necesita otro.'),
        form,
        h('p', {}, h('button', { class: 'button outline portal-signout', text: 'Cerrar sesión', on: { click: onSignOut } })));
}
