/**
 * Datos de demostración para el entorno local. SOLO emuladores.
 *
 * Deja montado lo necesario para probar la cuenta de verdad, con inicio de
 * sesión, papeles y varios negocios:
 *
 *   · Taller Horizonte — los tres módulos abiertos y semanas de historia,
 *     generadas por el mismo motor que usa la demo (`demo-data.js`). Su gente
 *     tiene papeles distintos, para ver qué ve cada quien.
 *   · Panadería Trigal — recién activada: un período pagado y nada cargado.
 *   · Clínica Vet Prado — el formulario de incorporación a medio llenar.
 *   · Soda La Esquina — el formulario enviado, esperando que VALTRIX lo cargue.
 *   · Prospectos en varias etapas.
 *
 * Se niega a correr sin las variables de los emuladores: nunca toca el
 * proyecto real. Y empieza borrándolos, porque son de usar y tirar.
 *
 * Lo llama `scripts/dev.mjs` al arrancar con `npm run dev`.
 */

import { handleApi } from '../src/api.js';
import { firestore } from '../src/lib/firebase.js';
import { tenantStore } from '../src/lib/store.js';
import { DEMO_TENANT, seedDemo } from '../../../VALTRIX Engineering/js/core/demo-data.js';

export const PASSWORD = 'valtrix-demo-1234';

export async function seed({ days = 45, origin = 'http://localhost:8799' } = {}) {
    const FIRESTORE = process.env.FIRESTORE_EMULATOR_HOST;
    const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    if (!FIRESTORE || !AUTH) throw new Error('El sembrado solo corre contra los emuladores de Firebase.');
    const PROJECT = process.env.GCLOUD_PROJECT || 'demo-valtrix';
    const env = { FIREBASE_PROJECT_ID: PROJECT, FIRESTORE_EMULATOR_HOST: FIRESTORE, FIREBASE_AUTH_EMULATOR_HOST: AUTH, ALLOWED_ORIGINS: '', PUBLIC_ORIGIN: origin };
    const db = firestore(env);
    const started = Date.now();
    const log = (...parts) => console.log('  ·', ...parts);

    console.log('\nVALTRIX · datos de demostración en los emuladores');
    await fetch(`http://${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
    await fetch(`http://${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });

    /* ---------- Auth ---------- */

    const AUTH_BASE = `http://${AUTH}/identitytoolkit.googleapis.com/v1`;
    const authAdmin = (path, body) => fetch(`${AUTH_BASE}/projects/${PROJECT}/${path}`, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer owner' }, body: JSON.stringify(body)
    }).then(response => response.json());
    const signIn = async email => (await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=emulator`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true })
    }).then(response => response.json())).idToken;

    /** Una cuenta de VALTRIX, con su papel en el claim. */
    async function staff(email, name, role) {
        const created = await authAdmin('accounts', { email, password: PASSWORD, displayName: name, emailVerified: true });
        await authAdmin('accounts:update', { localId: created.localId, customAttributes: JSON.stringify({ role }) });
        return { uid: created.localId, email, name, token: await signIn(email) };
    }

    /** Una cuenta que creó el API (sin contraseña): se le pone una, como haría la persona. */
    async function activate(email, name) {
        const found = await authAdmin('accounts:lookup', { email: [email] });
        const uid = found.users[0].localId;
        await authAdmin('accounts:update', { localId: uid, password: PASSWORD, emailVerified: true });
        return { uid, email, name, token: await signIn(email) };
    }

    /* ---------- El API, en el mismo proceso ---------- */

    async function api(path, { method = 'GET', token = null, body, headers = {} } = {}) {
        const url = new URL(`${origin}/api${path}`);
        const request = new Request(url, {
            method,
            headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
            body: body === undefined ? undefined : JSON.stringify(body)
        });
        const response = await handleApi(request, env, url, '/api');
        const data = await response.json().catch(() => ({}));
        if (response.status >= 300) throw new Error(`${method} ${path} → ${response.status} ${JSON.stringify(data)}`);
        return data;
    }

    const valeria = await staff('valeria@valtrix.test', 'Valeria Vargas', 'admin');
    await staff('dev@valtrix.test', 'Desarrollo VALTRIX', 'developer');
    const newTenant = (body, periods) => api('/admin/tenants', { method: 'POST', token: valeria.token, body }).then(async created => {
        for (let period = 1; period <= periods; period += 1) {
            await api(`/admin/tenants/${created.id}/periods`, { method: 'POST', token: valeria.token, body: { period, method: 'sinpe', reference: `SINPE ${1000 + period}` } });
        }
        return created;
    });

    /* ---------- Taller Horizonte ---------- */

    await newTenant({ id: DEMO_TENANT.id, name: DEMO_TENANT.name, ownerEmail: 'ana@taller-horizonte.test', ownerName: 'Ana Mora', sector: 'taller' }, 3);
    const ana = await activate('ana@taller-horizonte.test', 'Ana Mora');
    const team = {};
    for (const [key, email, name, role, position] of [
        ['mechanic', 'luis@taller-horizonte.test', 'Luis Vega', 'staff', 'Mecánico'],
        ['warehouse', 'marta@taller-horizonte.test', 'Marta Rojas', 'operations', 'Bodega y mostrador'],
        ['cashier', 'rosa@taller-horizonte.test', 'Rosa Mena', 'collections', 'Caja y cobros']
    ]) {
        await api(`/tenants/${DEMO_TENANT.id}/members`, { method: 'POST', token: ana.token, body: { email, name, role, position } });
        team[key] = { ...(await activate(email, name)), role, position };
    }
    const info = await seedDemo({
        store: tenantStore(db, DEMO_TENANT.id),
        tenant: DEMO_TENANT,
        people: { owner: { uid: ana.uid, name: 'Ana Mora' }, ...team },
        writeMembers: false,
        days
    });
    log(`Taller Horizonte: ${info.products} productos, ${info.customers} clientes y ${days} días de historia`);

    /* ---------- Panadería Trigal: recién activada ---------- */

    await newTenant({ id: 'panaderia-trigal', name: 'Panadería Trigal', ownerEmail: 'beto@panaderia-trigal.test', ownerName: 'Beto Salas', sector: 'panaderia' }, 1);
    const beto = await activate('beto@panaderia-trigal.test', 'Beto Salas');
    // Ana también entra aquí, solo a mirar: así se ve el selector de negocios.
    await api('/tenants/panaderia-trigal/members', { method: 'POST', token: beto.token, body: { email: ana.email, name: 'Ana Mora', role: 'viewer', position: 'Asesora' } });
    log('Panadería Trigal: recién activada, sin datos');

    /* ---------- Clínica Vet Prado: el formulario a medio llenar ---------- */

    await newTenant({ id: 'clinica-vet-prado', name: 'Clínica Vet Prado', ownerEmail: 'carla@vet-prado.test', ownerName: 'Carla Prado', sector: 'veterinaria' }, 1);
    const prado = await api('/admin/tenants/clinica-vet-prado/intake', { method: 'POST', token: valeria.token, body: {} });
    await api('/intake', {
        method: 'PUT', headers: { 'x-intake-token': prado.token }, body: {
            data: {
                business: { name: 'Clínica Vet Prado', sector: 'veterinaria', contactName: 'Carla Prado', phone: '8806-1212', notes: '' },
                products: [
                    { code: 'CON-01', name: 'Consulta general', kind: 'Servicio', price: '15 000' },
                    { code: 'VAC-03', name: 'Vacuna triple felina', kind: 'Producto', unit: 'unidad', cost: '₡6.200', price: '12 500', stock: '18', min: '6' },
                    { name: 'Desparasitante 10 kg', kind: 'Producto', cost: '3100', price: '5 900', stock: '40' }
                ],
                debtors: [{ name: 'Albergue Patitas', phone: '8807-3434', amount: '₡85.000', since: '01/10/2026' }]
            }
        }
    });
    log('Clínica Vet Prado: formulario a medio llenar');

    /* ---------- Soda La Esquina: formulario enviado, sin activar ---------- */

    await newTenant({ id: 'soda-la-esquina', name: 'Soda La Esquina', ownerEmail: 'dona.mari@soda-esquina.test', ownerName: 'María Quesada', sector: 'otro' }, 0);
    const soda = await api('/admin/tenants/soda-la-esquina/intake', { method: 'POST', token: valeria.token, body: {} });
    await api('/intake/submit', {
        method: 'POST', headers: { 'x-intake-token': soda.token }, body: {
            data: {
                business: { name: 'Soda La Esquina', sector: 'otro', contactName: 'María Quesada', phone: '8808-5656', notes: 'Llevamos todo en un cuaderno. Lo que más nos preocupa es la merma de la cocina.' },
                products: [
                    { name: 'Casado con pollo', kind: 'Producto', unit: 'unidad', cost: '1 900', price: '3 500', stock: '0' },
                    { name: 'Gallo pinto', kind: 'Producto', cost: '700', price: '1 800' },
                    { name: 'Café chorreado', kind: 'Producto', cost: '180', price: '800', stock: '0' },
                    { name: 'Refresco natural', kind: 'Producto', price: '1 200' }
                ],
                debtors: [{ name: 'Taller Mora', amount: '42 000', since: '15/10/2026' }],
                team: [
                    { name: 'Rosa Jiménez', position: 'Cocinera', email: 'rosa.cocina@soda-esquina.test', access: 'staff' },
                    { name: 'Don Pepe', position: 'Salonero', email: '', access: 'none' }
                ],
                processes: [{ name: 'Apertura de cocina', area: 'Cocina', frequency: 'Todos los días', steps: '1. Encender la plantilla\n2. Revisar la refrigeradora\n3. Anotar la temperatura' }],
                equipment: [{ name: 'Refrigeradora vertical', location: 'Cocina', everyDays: '90', lastOn: '10/07/2026' }]
            }
        }
    });
    log('Soda La Esquina: formulario enviado, por cargar');

    /* ---------- Prospectos ---------- */

    for (const lead of [
        { business: 'Repuestos El Volante', contactName: 'Jorge Arce', phone: '8809-7878', sector: 'repuestos', source: 'conocido', stage: 'demo', nextAction: 'Llamar para saber qué le pareció la demo', note: 'Tiene tres empleados y el inventario en Excel.' },
        { business: 'Clínica Dental Sonrisa', contactName: 'Dra. Lucía Brenes', phone: '8810-9090', sector: 'dental', source: 'referido', stage: 'contacted', nextAction: 'Enseñarle la demo' },
        { business: 'Distribuidora Central', contactName: 'Mario Rojas', sector: 'distribuidora', source: 'contador', stage: 'interested', nextAction: 'Confirmar el primer pago' },
        { business: 'Panadería La Espiga', sector: 'panaderia', source: 'redes', stage: 'new' },
        { business: 'Taller Los Hermanos', sector: 'taller', source: 'web', stage: 'lost', note: 'Prefiere seguir con su contador por ahora.' }
    ]) await api('/admin/leads', { method: 'POST', token: valeria.token, body: lead });
    log('5 prospectos en varias etapas');

    console.log(`\nListo en ${Math.round((Date.now() - started) / 1000)} s. Contraseña de todas las cuentas: ${PASSWORD}`);
    console.log('  valeria@valtrix.test          administración de VALTRIX');
    console.log('  ana@taller-horizonte.test     propietaria del taller (y consulta en la panadería)');
    console.log('  marta@taller-horizonte.test   operaciones: bodega y ventas, sin costos');
    console.log('  rosa@taller-horizonte.test    cobros');
    console.log('  luis@taller-horizonte.test    colaborador: solo sus tareas');
    console.log('  beto@panaderia-trigal.test    propietario de un negocio recién activado');
    console.log('\nFormulario de incorporación a medio llenar (Clínica Vet Prado):');
    console.log(`  ${origin}${prado.path}`);
    return { prado: `${origin}${prado.path}`, soda: `${origin}${soda.path}` };
}
