/**
 * Pruebas de la lógica pura del CRM (`JS/admin.js`).
 *
 * `admin.js` es un módulo de navegador: importa Firebase desde la CDN y toca el
 * DOM, así que no se puede importar en Node. En vez de copiar las funciones
 * aquí —una copia se queda obsoleta en cuanto alguien edita el original— se
 * extraen del fichero real por nombre y se evalúan. Si el fuente cambia, la
 * prueba usa la versión nueva.
 *
 * Cubre lo que no se ve al mirar la pantalla: aritmética de fechas del
 * calendario, detección de solapes, y el saneado que exige `firestore.rules`.
 *
 * Uso:  node --test scripts/crm-logic.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(ROOT, 'JS', 'admin.js'), 'utf8');

/**
 * Recorta una declaración de función de nivel superior.
 *
 * Delimita por el `}` en la columna 0, no contando llaves: las plantillas de
 * las vistas del calendario llevan llaves dentro de cadenas y un contador
 * ingenuo cierra la función antes de tiempo. Todas estas funciones están en
 * el nivel superior del módulo, así que el `}` sin sangrar es su final.
 */
function extract(names) {
    const lines = source.split('\n');
    return names.map(name => {
        const start = lines.findIndex(line => line.startsWith(`function ${name}(`));
        if (start < 0) throw new Error(`Función de nivel superior no encontrada en JS/admin.js: ${name}`);
        const end = lines.findIndex((line, index) => index > start && line === '}');
        if (end < 0) throw new Error(`Sin cierre en columna 0 para: ${name}`);
        return lines.slice(start, end + 1).join('\n');
    }).join('\n\n');
}

const PURE = [
    'startOfDay', 'startOfWeek', 'addDays', 'todayBounds', 'markOverlaps',
    'meetingEndMillis', 'opportunityUrgency', 'contactCurrency', 'crmText', 'crmPayload'
];

// Lo poco del módulo de lo que dependen estas funciones.
const preamble = `
const crmDate = value => {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    if (Number.isFinite(value?.seconds)) return new Date(value.seconds * 1000);
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const meetingStartMillis = meeting => new Date(meeting.startsAt).getTime() || 0;
const stripUndefined = value => JSON.parse(JSON.stringify(value ?? {}));
`;

const crm = await import('data:text/javascript,' + encodeURIComponent(
    `${preamble}${extract(PURE)}\nexport { ${PURE.join(', ')} };`
));

test('startOfWeek arranca en lunes desde cualquier día de esa semana', () => {
    // 2026-08-17 es lunes; se prueba desde el propio lunes, martes, viernes y domingo.
    for (const day of ['2026-08-17', '2026-08-18', '2026-08-21', '2026-08-23']) {
        const monday = crm.startOfWeek(new Date(`${day}T12:00:00`));
        assert.equal(monday.getDay(), 1, `${day} devolvió ${monday}`);
        assert.equal(monday.getDate(), 17);
    }
});

test('addDays cruza el cambio de mes y de año', () => {
    assert.equal(crm.addDays(new Date('2026-01-31T12:00:00'), 1).getMonth(), 1);
    const newYear = crm.addDays(new Date('2026-12-31T12:00:00'), 1);
    assert.equal(newYear.getFullYear(), 2027);
    assert.equal(newYear.getMonth(), 0);
});

test('todayBounds cubre exactamente 24 h desde medianoche local', () => {
    const { start, end } = crm.todayBounds();
    assert.equal(new Date(start).getHours(), 0);
    assert.equal(end - start, 86400000);
});

test('markOverlaps marca las citas que se pisan y no las consecutivas', () => {
    const at = (iso, minutes) => ({ id: iso, startsAt: iso, durationMinutes: minutes });

    const overlapping = [at('2026-08-18T10:00:00Z', 60), at('2026-08-18T10:30:00Z', 60)];
    assert.deepEqual([...crm.markOverlaps(overlapping)].sort(),
        ['2026-08-18T10:00:00Z', '2026-08-18T10:30:00Z']);

    // Una cita que empieza justo cuando acaba la anterior no es sobreasignación.
    const backToBack = [at('2026-08-18T10:00:00Z', 60), at('2026-08-18T11:00:00Z', 60)];
    assert.equal(crm.markOverlaps(backToBack).size, 0);

    // De tres citas solo chocan dos: la suelta no debe quedar marcada.
    const mixed = [
        at('2026-08-18T09:00:00Z', 30),
        at('2026-08-18T10:00:00Z', 60),
        at('2026-08-18T10:15:00Z', 15)
    ];
    assert.deepEqual([...crm.markOverlaps(mixed)].sort(),
        ['2026-08-18T10:00:00Z', '2026-08-18T10:15:00Z']);
});

test('opportunityUrgency clasifica por expectedCloseAt', () => {
    const inDays = days => ({ expectedCloseAt: new Date(Date.now() + days * 86400000).toISOString() });
    assert.equal(crm.opportunityUrgency(inDays(-3)), 'overdue');
    assert.equal(crm.opportunityUrgency(inDays(3)), 'week');
    assert.equal(crm.opportunityUrgency(inDays(20)), 'month');
    assert.equal(crm.opportunityUrgency(inDays(90)), 'later');
    assert.equal(crm.opportunityUrgency({}), 'undated');
});

test('contactCurrency lee preferredCurrency, no el campo `currency` que no existe', () => {
    assert.equal(crm.contactCurrency({ preferredCurrency: 'CRC' }), 'CRC');
    assert.equal(crm.contactCurrency({ financials: { currency: 'USD' } }), 'USD');
    // Ningún contacto ni miembro guarda `currency` suelto: no es fuente válida.
    assert.equal(crm.contactCurrency({ currency: 'USD' }), 'EUR');
    // `firestore.rules` exige ^[A-Z]{3}$; un valor sucio no debe llegar a Firestore.
    assert.equal(crm.contactCurrency({ preferredCurrency: 'eur' }), 'EUR');
    assert.equal(crm.contactCurrency({ preferredCurrency: '€' }), 'EUR');
    assert.equal(crm.contactCurrency(null), 'EUR');
});

test('crmText quita los controles que rechaza crmIsShortText y conserva tab, LF y CR', () => {
    assert.equal(crm.crmText(`a${String.fromCharCode(1)}b${String.fromCharCode(27)}c`, 100), 'abc');
    assert.equal(crm.crmText('linea1\nlinea2\ttab\r', 100), 'linea1\nlinea2\ttab\r');
    assert.equal(crm.crmText('x'.repeat(300), 240).length, 240);
    assert.equal(crm.crmText(null, 10), '');
});

test('crmPayload acota a las 30 claves que admiten las reglas', () => {
    const oversized = Object.fromEntries(Array.from({ length: 45 }, (_, index) => [`k${index}`, index]));
    assert.equal(Object.keys(crm.crmPayload(oversized)).length, 30);
    assert.deepEqual(crm.crmPayload(undefined), {});
});

// ── Generación de markup del calendario ─────────────────────────────────
// Las vistas construyen HTML con plantillas; un literal mal cerrado o un
// `esc()` olvidado no lo detecta `node --check`, sólo el navegador.

const VIEWS = [
    'calendarLocale', 'calendarChip', 'renderMonthView', 'renderWeekView',
    'renderDayView', 'calendarMeetings', 'calendarPeriodLabel'
];

const viewPreamble = `
const currentLang = 'es';
const esc = str => String(str ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
));
const meetingStartMillis = meeting => new Date(meeting.startsAt).getTime() || 0;
const CALENDAR_DAY_START_HOUR = 7;
const CALENDAR_DAY_END_HOUR = 21;
let _agendaCursor = new Date('2026-08-18T12:00:00');
let _agendaView = 'month';
let _agendaMeetings = [];
`;

const views = await import('data:text/javascript,' + encodeURIComponent(
    `${viewPreamble}${extract(['startOfDay', 'startOfWeek', 'addDays', 'meetingEndMillis', 'markOverlaps', ...VIEWS])}
     export { ${['startOfDay', 'startOfWeek', 'addDays', 'markOverlaps', ...VIEWS].join(', ')} };
     export const setCursor = date => { _agendaCursor = date; };
     export const setView = view => { _agendaView = view; };
     export const setMeetings = list => { _agendaMeetings = list; };`
));

/** Contenedor mínimo: sólo necesita `innerHTML` y `querySelectorAll`. */
function fakeContainer() {
    return { innerHTML: '', querySelectorAll: () => [] };
}

const FIXTURES = [
    { id: 'a', startsAt: '2026-08-18T10:00:00', durationMinutes: 60, title: 'Kickoff', clientName: 'Ana', type: 'meeting', status: 'scheduled' },
    { id: 'b', startsAt: '2026-08-18T10:30:00', durationMinutes: 60, title: 'Revisión', clientName: 'Beto', type: 'call', status: 'scheduled' },
    { id: 'c', startsAt: '2026-08-20T15:00:00', durationMinutes: 30, title: 'Cierre', clientName: 'Caro', type: 'meeting', status: 'scheduled' },
    { id: 'x', startsAt: '2026-08-19T09:00:00', durationMinutes: 30, title: 'Cancelada', clientName: 'Dani', type: 'meeting', status: 'cancelled' }
];

function balanced(html) {
    const open = (html.match(/<(?!\/)[a-z]/g) || []).length;
    const close = (html.match(/<\/[a-z]/g) || []).length;
    const selfClosing = (html.match(/<(br|img|input|hr)\b/g) || []).length;
    return open - selfClosing === close;
}

test('la vista de mes pinta 6 semanas y marca el solape', () => {
    views.setCursor(new Date('2026-08-18T12:00:00'));
    const meetings = FIXTURES.filter(m => m.status !== 'cancelled');
    const clashing = views.markOverlaps(meetings);
    const container = fakeContainer();
    views.renderMonthView(container, meetings, clashing);

    const html = container.innerHTML;
    assert.equal((html.match(/agenda-cal-cell/g) || []).length, 42, '6 semanas x 7 dias');
    assert.equal((html.match(/agenda-cal-weekday/g) || []).length, 7);
    assert.ok(html.includes('is-clash'), 'las dos citas de las 10:00 se pisan');
    assert.ok(html.includes('Kickoff') && html.includes('Cierre'));
    assert.ok(!html.includes('Cancelada'), 'el calendario no pinta canceladas');
    assert.ok(balanced(html), 'markup desbalanceado');
});

test('las vistas de semana y dia se generan y escapan el contenido', () => {
    views.setCursor(new Date('2026-08-18T12:00:00'));
    const hostile = [{
        id: 'h', startsAt: '2026-08-18T11:00:00', durationMinutes: 30,
        title: '<img src=x onerror=alert(1)>', clientName: '"; drop', type: 'meeting', status: 'scheduled'
    }];
    const clashing = views.markOverlaps(hostile);

    for (const render of [views.renderWeekView, views.renderDayView]) {
        const container = fakeContainer();
        render(container, hostile, clashing);
        assert.ok(container.innerHTML.length > 0);
        assert.ok(!container.innerHTML.includes('<img src=x'), 'titulo sin escapar');
        assert.ok(container.innerHTML.includes('&lt;img'), 'debe aparecer escapado');
        assert.ok(balanced(container.innerHTML), 'markup desbalanceado');
    }
});

test('la vista de dia conserva las citas fuera de la franja laboral', () => {
    views.setCursor(new Date('2026-08-18T12:00:00'));
    const nightly = [{
        id: 'n', startsAt: '2026-08-18T23:30:00', durationMinutes: 30,
        title: 'Soporte nocturno', clientName: 'Eva', type: 'call', status: 'scheduled'
    }];
    const container = fakeContainer();
    views.renderDayView(container, nightly, new Set());
    // 23:30 cae fuera de 07:00-21:00: tiene que listarse aparte, no perderse.
    assert.ok(container.innerHTML.includes('agenda-cal-outside'));
    assert.ok(container.innerHTML.includes('Soporte nocturno'));
});

test('calendarPeriodLabel cambia con la vista activa', () => {
    views.setCursor(new Date('2026-08-18T12:00:00'));
    views.setView('month');
    const month = views.calendarPeriodLabel();
    views.setView('day');
    const day = views.calendarPeriodLabel();
    assert.notEqual(month, day);
    assert.ok(month.includes('2026') && day.includes('2026'));
});

// ── Carga diferida de las CDN y memoria del directorio ──────────────────────
// `loadScript` y `noteCrmWrite` tocan el DOM y el estado del módulo. Se extraen
// igual que las demás y se evalúan contra un `document` de mentira, para poder
// comprobar lo que no se ve en pantalla: que tres gráficas pidiendo Chart.js a
// la vez inyectan una sola etiqueta, y que una escritura invalida la memoria
// del directorio.
const infra = await import('data:text/javascript,' + encodeURIComponent(`
const _pendingScripts = new Map();
const injected = [];
const document = {
    createElement: () => ({}),
    head: { appendChild: tag => injected.push(tag) }
};
const CACHED_CONTACT_COLLECTIONS = new Set(['members', 'prospects', 'contacts']);
const counters = { contacts: 0, opportunities: 0 };
const invalidateContactCache = () => { counters.contacts += 1; };
const invalidateOpportunityCache = () => { counters.opportunities += 1; };

${extract(['loadScript', 'noteCrmWrite'])}

export { loadScript, noteCrmWrite, injected, counters, _pendingScripts };
`));

test('loadScript inyecta una sola etiqueta aunque se le pida tres veces a la vez', async () => {
    const url = 'https://cdn.example/chart.js';
    const promises = [infra.loadScript(url), infra.loadScript(url), infra.loadScript(url)];
    assert.equal(infra.injected.length, 1, 'tres peticiones simultáneas inyectaron más de una etiqueta');
    assert.equal(promises[0], promises[1], 'no se está memoizando la promesa, sino el resultado');

    infra.injected[0].onload();
    await Promise.all(promises);

    // Una cuarta petición, ya cargado, tampoco vuelve a inyectar.
    await infra.loadScript(url);
    assert.equal(infra.injected.length, 1);
});

test('loadScript olvida el intento fallido para poder reintentarlo', async () => {
    const url = 'https://cdn.example/roto.js';
    const first = infra.loadScript(url);
    infra.injected.at(-1).onerror();
    await assert.rejects(first, /roto\.js could not be loaded/);

    // Si la entrada se quedara en el mapa, el CDN quedaría marcado como
    // intentado para siempre y el botón de exportar no volvería a funcionar.
    assert.equal(infra._pendingScripts.has(url), false);
    const retry = infra.loadScript(url);
    assert.equal(infra.injected.filter(tag => tag.src === url).length, 2);
    infra.injected.at(-1).onload();
    await retry;
});

test('noteCrmWrite invalida la memoria que corresponde a cada colección', () => {
    const before = { ...infra.counters };

    // Un documento conoce su colección en `parent`.
    infra.noteCrmWrite({ parent: { id: 'members' } });
    infra.noteCrmWrite({ parent: { id: 'prospects' } });
    assert.equal(infra.counters.contacts - before.contacts, 2);

    // Una colección de primer nivel no tiene `parent`: es ella misma.
    infra.noteCrmWrite({ id: 'contacts', parent: null });
    assert.equal(infra.counters.contacts - before.contacts, 3);

    infra.noteCrmWrite({ parent: { id: 'opportunities' } });
    assert.equal(infra.counters.opportunities - before.opportunities, 1);

    // Una colección que no se guarda en memoria no invalida nada.
    infra.noteCrmWrite({ parent: { id: 'onboarding_drafts' } });
    assert.equal(infra.counters.contacts - before.contacts, 3);
    assert.equal(infra.counters.opportunities - before.opportunities, 1);
});
