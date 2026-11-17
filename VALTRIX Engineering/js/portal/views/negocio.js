/**
 * La gente del negocio y la cuenta de cada quien.
 *
 * «Gente» es la gestión de accesos: quién entra y qué puede hacer. El papel
 * decide. Lo que no es evidente es lo que NO se puede hacer aquí, y es a
 * propósito: nadie se cambia su propio papel —un propietario podría
 * degradarse por error y dejar el negocio sin quien lo administre— y el
 * último propietario no se puede quitar.
 */

import { TENANT_ROLES, TENANT_ROLE_HINT, TENANT_ROLE_LABEL } from '../../core/catalog.js';
import { get, patch, post } from '../api.js';
import { badge, btn, buildForm, clear, day, dialog, formDialog, h, initials, notice, pageHead, panel, table, toast } from '../ui.js';

export const views = { gente, cuenta };

/* ================================================================== *
 * Gente
 * ================================================================== */

async function gente(ctx) {
    const { base } = ctx;
    const [{ members }, permisos] = await Promise.all([get(`${base}/members`), get(`${base}/capabilities`)]);
    const manages = permisos.canManageMembers;
    const roleOptions = TENANT_ROLES.map(value => ({ value, label: TENANT_ROLE_LABEL[value] }));

    const change = async (member, body, done) => {
        try {
            await patch(`${base}/members/${encodeURIComponent(member.uid)}`, body);
            toast(done);
        } catch (error) {
            toast(error.message, 'bad');
        }
        ctx.reload();
    };

    const invite = async () => {
        const result = await formDialog({
            title: 'Dar acceso a una persona',
            lead: 'Cada quien entra con su propia cuenta. El papel decide lo que ve y lo que puede hacer.',
            submitLabel: 'Dar acceso',
            fields: [
                { name: 'name', label: 'Nombre', required: true, maxlength: 80 },
                { name: 'position', label: 'Puesto', maxlength: 80, placeholder: 'Caja, bodega, mecánico…' },
                { name: 'email', label: 'Correo', type: 'email', required: true, maxlength: 254, wide: true },
                { name: 'role', label: 'Papel', type: 'select', value: 'staff', options: roleOptions.filter(option => option.value !== 'owner'), wide: true, hint: TENANT_ROLE_HINT.staff }
            ],
            setup: form => {
                const role = form.field('role');
                role.control.addEventListener('change', () => { role.node.querySelector('.field-hint').textContent = TENANT_ROLE_HINT[role.control.value]; });
            },
            onSubmit: values => post(`${base}/members`, values)
        });
        if (!result) return;
        toast(`${result.member.name} ya tiene acceso.`);
        ctx.reload();
        if (!result.member.existed && !ctx.demo) {
            // La cuenta nace sin contraseña: nadie más que esa persona la conoce.
            const box = dialog({ title: 'Falta un paso: que defina su contraseña' },
                h('p', {}, `Pídale a ${result.member.name} que abra la página de la cuenta, escriba `, h('strong', { text: result.member.email }), ' y pulse «¿Olvidó su contraseña o es la primera vez que entra?». Le llegará un enlace para definirla.'),
                h('div', { class: 'form-actions' }, btn('Entendido', { kind: 'primary', onClick: () => box.close() })));
        }
    };

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: 'Equipo',
            title: 'Gente',
            lead: manages
                ? 'Quién entra al negocio y qué puede hacer. Cada persona, con su propia cuenta.'
                : 'Estas son las personas con acceso al negocio. Para cambiar un papel hace falta ser propietario.',
            actions: manages ? btn('Dar acceso a alguien', { kind: 'primary', onClick: invite }) : null
        }),
        panel({},
            table({
                label: 'Personas con acceso',
                emptyText: 'Todavía no hay nadie más en este negocio.',
                rows: members,
                columns: [
                    {
                        label: 'Persona', render: member => h('span', { class: 'app-tenant-name' },
                            h('span', { class: 'avatar', 'aria-hidden': 'true', text: initials(member.name || member.email) }),
                            h('span', {}, member.name || '—', h('span', { class: 'sub', text: [member.position, member.email].filter(Boolean).join(' · ') })))
                    },
                    {
                        label: 'Papel', render: member => {
                            const self = member.uid === ctx.me.uid;
                            if (!manages || self) return [TENANT_ROLE_LABEL[member.role] || member.role, self ? h('span', { class: 'sub', text: 'Usted' }) : null];
                            return h('select', {
                                'aria-label': `Papel de ${member.name || member.email}`,
                                on: { change: event => change(member, { role: event.target.value }, `${member.name || 'La persona'} ahora es ${TENANT_ROLE_LABEL[event.target.value].toLowerCase()}.`) }
                            }, roleOptions.map(option => h('option', { value: option.value, selected: option.value === member.role, text: option.label })));
                        }
                    },
                    { label: 'Estado', render: member => (member.status === 'active' ? badge('Con acceso', 'good') : badge('Suspendido', 'warn')) },
                    { label: 'Desde', render: member => (member.createdAt ? day(member.createdAt.slice(0, 10), { short: true }) : '—') },
                    manages ? {
                        label: '', tight: true, render: member => (member.uid === ctx.me.uid ? '' : (member.status === 'active'
                            ? btn('Suspender', { small: true, onClick: () => change(member, { status: 'suspended' }, `${member.name || 'La persona'} ya no puede entrar.`) })
                            : btn('Reactivar', { small: true, onClick: () => change(member, { status: 'active' }, `${member.name || 'La persona'} puede entrar de nuevo.`) })))
                    } : null
                ].filter(Boolean)
            })),
        panel({ title: 'Qué puede hacer cada papel' },
            h('ul', { class: 'rows' }, TENANT_ROLES.map(role => h('li', {},
                h('span', {}, h('strong', { text: TENANT_ROLE_LABEL[role] }), h('span', { class: 'sub', text: TENANT_ROLE_HINT[role] })))))));
}

/* ================================================================== *
 * Mi cuenta
 * ================================================================== */

async function cuenta(ctx) {
    const message = h('div');
    const form = buildForm({
        submitLabel: 'Guardar',
        fields: [
            { name: 'name', label: 'Nombre', required: true, maxlength: 80, value: ctx.me.name },
            { name: 'phone', label: 'Teléfono', type: 'tel', maxlength: 40, value: ctx.me.phone }
        ],
        onSubmit: async values => {
            clear(message);
            await patch('/me', values);
            message.append(notice('Guardado.', 'ok'));
        }
    });

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: 'Personal',
            title: 'Mi cuenta',
            lead: ctx.demo
                ? 'En la demo usted entra como la propietaria del taller. En una cuenta de verdad, aquí están sus datos.'
                : ['Entró como ', h('strong', { text: ctx.me.email }), '. El correo identifica la cuenta y no se cambia desde aquí; escriba a VALTRIX si necesita otro.']
        }),
        panel({ title: 'Sus datos' }, message, form.node),
        ctx.demo ? null : h('p', {}, btn('Cerrar sesión', { onClick: ctx.signOut })));
}
