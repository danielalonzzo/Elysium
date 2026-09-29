/**
 * Ajustes: perfil, apariencia, dinero, alertas y correo, categorías,
 * seguridad y datos (importar, exportar, borrar).
 */
import { app } from '../context.js';
import { html, downloadText, readFileText } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money, formatMoney, currencySymbol, currencyOptions, METHODS } from '../ui/format.js';
import { catChip } from '../ui/parts.js';
import { toast, confirmDialog, openSheet } from '../ui/overlay.js';
import { getTheme, setTheme, isPrivate, setPrivate } from '../ui/theme.js';
import { lockConfig, setPin, removePin, setLockMinutes } from '../ui/lock.js';
import { ALERT_GROUPS, defaultLargeExpense } from '../core/alerts.js';
import { NATURES } from '../core/budgets.js';
import { parseAmount, CURRENCY_CODES, currencyInfo, quote, ratesFromQuotes, isCurrency, convertMinor, roundNice } from '../core/money.js';
import { formatDate, isTimeZone, APP_TIME_ZONE } from '../core/dates.js';
import { parseBackup, MAX_BACKUP_BYTES } from '../core/backup.js';
import { describeError } from '../ui/errors.js';
import { parseCSV, guessMapping, rowsToTransactions, transactionsToCSV, splitDuplicates } from '../core/csv.js';
import { matchCategory } from '../core/categories.js';
import { COLLECTIONS } from '../store.js';

const SECTIONS = [
    ['perfil', 'Perfil', 'user'],
    ['apariencia', 'Apariencia', 'sun'],
    ['dinero', 'Dinero', 'coins'],
    ['alertas', 'Alertas y correo', 'bell'],
    ['categorias', 'Categorías', 'tag'],
    ['seguridad', 'Seguridad', 'lock'],
    ['datos', 'Sus datos', 'archive']
];

/** Cambia solo las claves indicadas: lo que se ajustó desde otro dispositivo no se pisa. */
async function saveSettings(patch, message = 'Guardado') {
    await app.store.saveSettings(patch);
    if (message) toast(message, { tone: 'success' });
}

/** Zonas ofrecidas: Costa Rica, la de este dispositivo y la que ya tenga elegida. */
function timeZoneOptions(selected) {
    const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const zones = [...new Set([APP_TIME_ZONE, device, selected].filter(isTimeZone))];
    const label = zone => (zone === APP_TIME_ZONE ? 'Costa Rica' : zone.replace(/_/g, ' ').replace('/', ' · ')) + (zone === device && zone !== APP_TIME_ZONE ? ' (este dispositivo)' : '');
    return zones.map(zone => html`<option value="${zone}" ${zone === (selected || APP_TIME_ZONE) ? 'selected' : ''}>${label(zone)}</option>`);
}

const BACKUP_LABELS = {
    accounts: 'Cuentas', categories: 'Categorías', transactions: 'Movimientos', budgets: 'Presupuestos', goals: 'Metas',
    contributions: 'Aportes a metas', recurring: 'Recurrentes', debts: 'Deudas', simulations: 'Simulaciones', receipts: 'Comprobantes'
};

/** Importe para un campo: sin «,00» cuando es redondo. */
function wholeAmount(minor, currency) {
    return formatMoney(minor, currency, { symbol: false, decimals: minor % 100 ? 2 : 0 });
}

/** Cotización como se escribe: «505», «1,1569». */
function quoteValue(value) {
    const text = value.toFixed(value >= 100 ? 2 : 4).replace(/0+$/, '').replace(/\.$/, '');
    return text.replace('.', ',');
}

/**
 * Lee una cotización escrita a mano. La coma es decimal; el punto, según
 * encaje: «1.17» es uno coma diecisiete y «1.505» mil quinientos cinco si el
 * tipo actual ronda eso. Fuera de un tercio a tres veces el actual, se rechaza.
 */
function parseQuote(text, current) {
    const clean = String(text).trim().replace(/[^\d.,]/g, '');
    const candidates = clean.includes(',')
        ? [clean.replace(/\./g, '').replace(',', '.')]
        : [clean, clean.replace(/\./g, '')];
    return candidates.map(Number).find(value => value > current / 3 && value < current * 3) || null;
}

function dayOptions(max, selected) {
    return Array.from({ length: max }, (_, i) => html`<option value="${i + 1}" ${Number(selected) === i + 1 ? 'selected' : ''}>Día ${i + 1}</option>`);
}

/**
 * Cambiar la moneda principal no toca cuentas ni movimientos (cada uno tiene
 * la suya); sí convierte los importes de los ajustes, que están en la
 * principal: el ingreso esperado y el umbral de «gasto grande».
 */
async function changeBaseCurrency(model, code) {
    if (!isCurrency(code) || code === model.fx.base) return;
    const s = app.store.profile?.settings || {};
    const next = { base: code, rates: model.fx.rates };
    const convert = value => (Number(value) > 0 ? roundNice(convertMinor(value, model.fx.base, code, model.fx), code) : value);
    // El umbral por defecto vuelve a ser el redondo de la nueva moneda, no una conversión con picos.
    const large = !s.largeExpenseMinor || Number(s.largeExpenseMinor) === defaultLargeExpense(model.fx)
        ? defaultLargeExpense(next)
        : convert(s.largeExpenseMinor);
    await saveSettings({
        baseCurrency: code,
        expectedIncomeMinor: convert(s.expectedIncomeMinor),
        largeExpenseMinor: large
    }, `Moneda principal: ${currencyInfo(code).name.toLowerCase()}`);
}

export default {
    title: 'Ajustes',
    eyebrow: () => (app.mode === 'demo' ? 'Modo demostración' : app.user?.email || ''),

    render(model) {
        const s = model.settings;
        const theme = getTheme();
        const lock = lockConfig();
        const email = s.email || {};
        const alerts = s.alerts || {};
        return html`<div class="settings">
            <nav class="settings-nav" aria-label="Secciones de ajustes">${SECTIONS.map(([id, label, iconName]) => html`<a href="#ajuste-${id}" data-jump="${id}">${icon(iconName, { size: 17 })}${label}</a>`)}</nav>
            <div>
                <section class="card settings-section" id="ajuste-perfil">
                    <div class="card-head"><div><h2>Perfil</h2><p>Cómo lo saluda la app</p></div></div>
                    <div class="form-grid">
                        <label class="field"><span>Nombre</span><input id="set-name" value="${model.profile.displayName || ''}" maxlength="60" data-profile="displayName"></label>
                        <label class="field"><span>Cédula <small>para reconocer sus propias facturas</small></span><input id="set-taxid" value="${s.taxId || ''}" inputmode="numeric" maxlength="20" data-setting="taxId" placeholder="1-2345-0678"></label>
                    </div>
                </section>

                <section class="card settings-section" id="ajuste-apariencia">
                    <div class="card-head"><div><h2>Apariencia</h2><p>Se guarda en este dispositivo</p></div></div>
                    <div class="theme-options">${[['dark', 'Medianoche', 'is-dark'], ['light', 'Marfil', 'is-light'], ['auto', 'Sistema', 'is-auto']].map(([value, label, swatch]) => html`
                        <button type="button" class="theme-option" data-theme-choice="${value}" aria-pressed="${theme === value}"><span class="theme-swatch ${swatch}"></span>${label}</button>`)}</div>
                    <div class="stack section-gap">
                        ${switchRow('private', 'Modo discreto', 'Oculta los montos. Atajo: tecla D o el ojo de arriba.', isPrivate(), 'eye-off')}
                        ${switchRow('sounds', 'Sonidos', 'Un sonido suave al guardar y al cumplir metas.', s.sounds === true, 'bolt')}
                        ${switchRow('gamification', 'Logros y niveles', 'Puntos, insignias y retos. Desactívelos si no lo motivan.', s.gamification !== false, 'trophy')}
                    </div>
                </section>

                <section class="card settings-section" id="ajuste-dinero">
                    <div class="card-head"><div><h2>Dinero</h2><p>Moneda, tipo de cambio y ciclo de pago</p></div></div>
                    <div class="form-grid">
                        <label class="field is-wide"><span>Moneda principal</span><select id="set-base" data-base-currency>${currencyOptions(model.fx.base)}</select><small class="field-hint">Los totales, presupuestos y reportes se muestran en ella. Cada cuenta y cada movimiento conservan su propia moneda.</small></label>
                        <div class="field is-wide"><span>Tipo de cambio <small>${s.fxUpdatedAt ? `${s.fxSource === 'manual' ? 'fijado a mano' : 'automático'} · ${formatDate(s.fxUpdatedAt, 'short')}` : s.fxSource === 'manual' ? 'fijado a mano' : 'automático'}</small></span>
                            <div class="fx-grid">${CURRENCY_CODES.filter(code => code !== model.fx.base).map(code => {
                                const q = quote(code, model.fx);
                                return html`<label class="fx-quote"><span class="fx-pair">${currencySymbol(q.strong)}1 en ${currencyInfo(q.weak).name.toLowerCase()}</span>
                                    <span class="input-group"><span class="prefix">${currencySymbol(q.weak)}</span><input class="input" inputmode="decimal" data-fx-quote="${code}" value="${quoteValue(q.value)}" aria-label="${currencyInfo(q.strong).singular} en ${currencyInfo(q.weak).name.toLowerCase()}"></span></label>`;
                            })}</div>
                            <div class="row-between fx-foot"><small class="field-hint">Escribir un tipo lo fija a mano; «Automático» lo actualiza a diario con la referencia del mercado.</small>
                            <button type="button" class="btn btn-ghost btn-sm" data-fx-auto ${app.mode === 'demo' || s.fxSource !== 'manual' ? 'disabled' : ''}>${icon('refresh', { size: 15 })}Automático</button></div></div>
                        <label class="field"><span>Zona horaria <small>para saber qué día es «hoy»</small></span><select id="set-timezone" data-timezone>${timeZoneOptions(s.timeZone)}</select></label>
                        <label class="field"><span>Le pagan</span><select id="set-payday-mode" data-payday-mode>
                            <option value="monthly" ${s.payday?.mode !== 'semimonthly' ? 'selected' : ''}>Una vez al mes</option>
                            <option value="semimonthly" ${s.payday?.mode === 'semimonthly' ? 'selected' : ''}>Quincenal (15 y fin de mes)</option></select></label>
                        <label class="field" ${s.payday?.mode === 'semimonthly' ? 'hidden' : ''}><span>Día de pago</span><select id="set-payday-day" data-payday-day>${dayOptions(31, s.payday?.day || 30)}</select></label>
                        <label class="field"><span>El mes empieza el día <small>para presupuestos y reportes</small></span><select id="set-start-day" data-setting-number="periodStartDay">${dayOptions(28, s.periodStartDay || 1)}</select></label>
                        <label class="field"><span>Fondo de emergencia ideal</span><select data-setting-select="emergencyMonths">${[3, 4, 6, 9, 12].map(n => html`<option value="${n}" ${Number(s.emergencyMonths || 6) === n ? 'selected' : ''}>${n} meses de gastos</option>`)}</select></label>
                        <label class="field"><span>Avisar de gastos desde</span><div class="input-group"><span class="prefix">${currencySymbol(model.fx.base)}</span><input id="set-large" inputmode="decimal" value="${wholeAmount(s.largeExpenseMinor || defaultLargeExpense(model.fx), model.fx.base)}" data-setting-money="largeExpenseMinor"></div></label>
                    </div>
                </section>

                <section class="card settings-section" id="ajuste-alertas">
                    <div class="card-head"><div><h2>Alertas</h2><p>Qué le avisamos dentro de la app</p></div></div>
                    <div class="stack">${Object.entries(ALERT_GROUPS).map(([group, label]) => switchRow(`alert:${group}`, label, '', alerts[group] !== false, 'bell'))}</div>
                    <hr>
                    <div class="card-head"><div><h2>Por correo</h2><p>${app.mode === 'demo' ? 'En la demostración no se envían correos' : html`A <b>${app.user?.email || ''}</b>${app.user && !app.user.emailVerified ? ' · verifique su correo para recibirlos' : ''}`}</p></div></div>
                    <div class="stack">
                        ${switchRow('email:immediate', 'Al momento', 'Presupuesto al 80% o 100% y tarjeta cerca del límite.', email.immediate !== false, 'zap')}
                        ${switchRow('email:daily', 'Resumen de la mañana', 'Pagos que vencen, metas en riesgo, gasto inusual. Solo si hay algo.', email.daily !== false, 'sun')}
                        ${switchRow('email:weekly', 'Resumen semanal', 'Los lunes: cómo fue su semana.', email.weekly !== false, 'calendar')}
                        ${switchRow('email:monthly', 'Informe del mes', 'El día 1: ingresos, gastos, ahorro y metas.', email.monthly !== false, 'file-text')}
                    </div>
                </section>

                <section class="card settings-section" id="ajuste-categorias">
                    <div class="card-head"><div><h2>Categorías</h2><p>Toque una para cambiar su nombre, ícono o naturaleza</p></div><button type="button" class="btn btn-sm btn-ghost" data-new-category>${icon('plus', { size: 15 })}Nueva</button></div>
                    <div class="grid grid-2">
                        <div><p class="eyebrow" style="margin-bottom:8px">Gastos</p><div class="category-admin">${model.categories.filter(c => c.kind === 'expense').map(c => html`<button type="button" data-category="${c.id}" class="${c.archived ? 'is-archived' : ''}">${catChip(c, { size: 'sm' })}<span>${c.name}</span><small class="faint">${NATURES[c.nature]?.label || ''}</small></button>`)}</div></div>
                        <div><p class="eyebrow" style="margin-bottom:8px">Ingresos</p><div class="category-admin">${model.categories.filter(c => c.kind === 'income').map(c => html`<button type="button" data-category="${c.id}" class="${c.archived ? 'is-archived' : ''}">${catChip(c, { size: 'sm' })}<span>${c.name}</span><small></small></button>`)}</div></div>
                    </div>
                </section>

                <section class="card settings-section" id="ajuste-seguridad">
                    <div class="card-head"><div><h2>Seguridad</h2><p>Bloqueo con PIN en este dispositivo</p></div></div>
                    ${lock ? html`<div class="stack">
                        <div class="callout is-ok">${icon('lock')}<span>PIN activo. La app se bloquea al abrirla y tras <b>${lock.minutes} min</b> en segundo plano.</span></div>
                        <div class="row wrap">
                            <label class="field" style="min-width:200px"><span>Bloquear tras</span><select data-lock-minutes>${[1, 5, 15, 30].map(n => html`<option value="${n}" ${lock.minutes === n ? 'selected' : ''}>${n} min</option>`)}</select></label>
                            <button type="button" class="btn btn-ghost" data-pin-set>Cambiar PIN</button>
                            <button type="button" class="btn btn-quiet" data-pin-remove>Quitar PIN</button>
                        </div></div>`
                    : html`<p class="muted" style="margin-bottom:12px">Útil si presta el teléfono: nadie verá sus cuentas sin el PIN. Es una protección de pantalla; su información sigue resguardada por su cuenta.</p><button type="button" class="btn btn-primary" data-pin-set>${icon('lock', { size: 16 })}Activar PIN</button>`}
                </section>

                <section class="card settings-section" id="ajuste-datos">
                    <div class="card-head"><div><h2>Sus datos</h2><p>Son suyos: tráigalos, lléveselos o bórrelos</p></div></div>
                    <div class="stack">
                        <button type="button" class="action-item" data-import>${html`<span class="action-icon">${icon('upload')}</span>`}<span class="action-label">Importar desde Excel o CSV<small>Traiga su hoja de antes: fechas, montos, descripción y categoría</small></span>${icon('chevron-right', { size: 16, className: 'action-chevron' })}</button>
                        <button type="button" class="action-item" data-export-json><span class="action-icon">${icon('download')}</span><span class="action-label">Copia de seguridad (JSON)<small>Todo: cuentas, movimientos, metas, presupuestos…</small></span>${icon('chevron-right', { size: 16, className: 'action-chevron' })}</button>
                        <button type="button" class="action-item" data-restore><span class="action-icon">${icon('rotate-ccw')}</span><span class="action-label">Restaurar una copia de seguridad<small>Pone otra vez en la app lo de un archivo JSON, sin borrar lo que ya tiene</small></span>${icon('chevron-right', { size: 16, className: 'action-chevron' })}</button>
                        <button type="button" class="action-item" data-export-csv><span class="action-icon">${icon('file-text')}</span><span class="action-label">Movimientos en CSV<small>Para abrir en Excel</small></span>${icon('chevron-right', { size: 16, className: 'action-chevron' })}</button>
                        <button type="button" class="action-item is-danger" data-wipe><span class="action-icon">${icon('trash')}</span><span class="action-label">Borrar todos mis datos<small>Deja la cuenta vacía. No se puede deshacer.</small></span>${icon('chevron-right', { size: 16, className: 'action-chevron' })}</button>
                    </div>
                </section>

                <p class="faint" style="text-align:center;margin-top:24px;font-size:.78rem">Elysium Patrimonio 1.0 · λ Elysium</p>
            </div>
        </div>`;
    },

    mount(root, model) {
        const onChange = async event => {
            const el = event.target;
            if (el.matches('[data-profile="displayName"]')) return app.store.saveProfile({ displayName: el.value.trim().slice(0, 60) }).then(() => toast('Nombre guardado', { tone: 'success' }));
            if (el.matches('[data-setting="taxId"]')) return saveSettings({ taxId: el.value.replace(/[^\d-]/g, '').slice(0, 20) });
            if (el.matches('[data-fx-quote]')) {
                const code = el.dataset.fxQuote;
                const current = quote(code, model.fx).value;
                const value = parseQuote(el.value, current);
                if (!value) {
                    el.value = quoteValue(current);
                    return toast('Ese tipo de cambio no parece válido.', { tone: 'error' });
                }
                const fxRates = ratesFromQuotes(model.fx.base, { [code]: value }, model.fx.rates);
                return saveSettings({ fxRates, fxSource: 'manual', fxUpdatedAt: model.today }, 'Tipo de cambio fijado');
            }
            if (el.matches('[data-base-currency]')) return changeBaseCurrency(model, el.value);
            if (el.matches('[data-timezone]')) return saveSettings({ timeZone: isTimeZone(el.value) ? el.value : APP_TIME_ZONE }, 'Zona horaria guardada');
            const livePayday = () => app.store.profile?.settings?.payday || {};
            if (el.matches('[data-payday-mode]')) return saveSettings({ payday: { ...livePayday(), mode: el.value } });
            if (el.matches('[data-payday-day]')) return saveSettings({ payday: { ...livePayday(), mode: 'monthly', day: Math.min(31, Math.max(1, Number(el.value) || 30)) } });
            if (el.matches('[data-setting-number]')) return saveSettings({ [el.dataset.settingNumber]: Math.min(28, Math.max(1, Number(el.value) || 1)) });
            if (el.matches('[data-setting-select]')) return saveSettings({ [el.dataset.settingSelect]: Number(el.value) });
            if (el.matches('[data-setting-money]')) return saveSettings({ [el.dataset.settingMoney]: Math.abs(parseAmount(el.value) || 0) });
            if (el.matches('[data-lock-minutes]')) { setLockMinutes(Number(el.value)); return toast('Guardado', { tone: 'success' }); }
            if (el.matches('[data-switch]')) {
                const key = el.dataset.switch;
                const on = el.checked;
                if (key === 'private') return setPrivate(on);
                if (key === 'sounds') return saveSettings({ sounds: on }, null);
                if (key === 'gamification') return saveSettings({ gamification: on }, null);
                if (key.startsWith('alert:')) return saveSettings({ alerts: { ...(app.store.profile?.settings?.alerts || {}), [key.slice(6)]: on } }, null);
                if (key.startsWith('email:')) return saveSettings({ email: { ...(app.store.profile?.settings?.email || {}), [key.slice(6)]: on } }, null);
            }
        };
        const onClick = async event => {
            const jump = event.target.closest('[data-jump]');
            if (jump) { event.preventDefault(); return root.querySelector(`#ajuste-${jump.dataset.jump}`)?.scrollIntoView({ behavior: 'smooth' }); }
            const theme = event.target.closest('[data-theme-choice]');
            if (theme) { setTheme(theme.dataset.themeChoice); return app.rerender(); }
            if (event.target.closest('[data-fx-auto]')) return saveSettings({ fxSource: 'auto', fxUpdatedAt: null }, 'Se actualizará en la próxima apertura');
            const forms = await import('../sheets/forms.js');
            if (event.target.closest('[data-new-category]')) return forms.openCategorySheet();
            const category = event.target.closest('[data-category]');
            if (category) return forms.openCategorySheet({ category: app.store.get('categories', category.dataset.category) });
            if (event.target.closest('[data-pin-set]')) return pinSheet();
            if (event.target.closest('[data-pin-remove]')) { removePin(); toast('PIN quitado'); return app.rerender(); }
            if (event.target.closest('[data-import]')) return importSheet(model);
            if (event.target.closest('[data-restore]')) return restoreSheet();
            if (event.target.closest('[data-export-json]')) return downloadText(`patrimonio-copia-${model.today}.json`, JSON.stringify(app.store.snapshot(), null, 2), 'application/json');
            if (event.target.closest('[data-export-csv]')) return exportCsv(model);
            if (event.target.closest('[data-wipe]')) return wipe();
        };
        root.addEventListener('change', onChange);
        root.addEventListener('click', onClick);
        return () => {
            root.removeEventListener('change', onChange);
            root.removeEventListener('click', onClick);
        };
    }
};

function switchRow(key, label, hint, checked, iconName) {
    return html`<label class="check"><span class="cat-chip is-sm tone-blue">${icon(iconName, { size: 16 })}</span><span class="check-text"><b>${label}</b>${hint ? html`<small>${hint}</small>` : ''}</span><input type="checkbox" data-switch="${key}" ${checked ? 'checked' : ''}><span class="switch"></span></label>`;
}

function pinSheet() {
    openSheet({
        title: 'Elija un PIN',
        subtitle: '4 a 6 dígitos',
        size: 'sm',
        content: html`<form class="form" novalidate>
            <label class="field"><span>PIN</span><input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password" name="pin" autofocus></label>
            <label class="field"><span>Repítalo</span><input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password" name="repeat"></label>
            <p class="field-error" data-error hidden></p>
            <div class="sheet-actions"><button type="submit" class="btn btn-primary">Guardar PIN</button></div>
        </form>`,
        onMount(body, api) {
            body.querySelector('form').addEventListener('submit', async event => {
                event.preventDefault();
                const pin = body.querySelector('[name="pin"]').value;
                const repeat = body.querySelector('[name="repeat"]').value;
                const error = body.querySelector('[data-error]');
                if (!/^\d{4,6}$/.test(pin)) { error.textContent = 'Use entre 4 y 6 dígitos.'; error.hidden = false; return; }
                if (pin !== repeat) { error.textContent = 'Los PIN no coinciden.'; error.hidden = false; return; }
                await setPin(pin, lockConfig()?.minutes || 5);
                await api.close();
                toast('PIN activado', { tone: 'success', iconName: 'lock' });
                app.rerender();
            });
        }
    });
}

function exportCsv(model) {
    const csv = transactionsToCSV(model.txs, {
        category: id => model.catById.get(id)?.name || '',
        account: id => model.accounts.find(a => a.id === id)?.name || '',
        method: key => METHODS[key]?.label || ''
    });
    downloadText(`patrimonio-movimientos-${model.today}.csv`, csv, 'text/csv');
}

async function wipe() {
    const ok = await confirmDialog({
        title: '¿Borrar todos sus datos?',
        body: 'Se eliminan cuentas, movimientos, metas, presupuestos, recurrentes, deudas y comprobantes. Su cuenta y su licencia siguen activas. Descargue antes una copia si la quiere.',
        confirmLabel: 'Borrar todo',
        danger: true,
        requireText: 'BORRAR'
    });
    if (!ok) return;
    const ops = [];
    for (const name of COLLECTIONS) {
        for (const doc of app.store.list(name)) {
            ops.push({ op: 'delete', name, id: doc.id });
            if (doc.receipt?.path) app.store.removeFile(doc.receipt.path);
            if (name === 'receipts' && doc.path) app.store.removeFile(doc.path);
            if (doc.cover?.path) app.store.removeFile(doc.cover.path);
        }
    }
    await app.store.batch(ops);
    await app.store.saveProfile({ onboarded: false, celebrated: {}, alertState: {}, challenges: [] });
    toast('Datos borrados');
    location.reload();
}

/* ── Importar CSV ──────────────────────────────────────────────────────────── */

function importSheet(model) {
    const accounts = model.accounts.filter(a => !a.archived && a.type !== 'asset');
    let rows = [];
    let mapping = {};
    // Lo elegido en los selectores sobrevive a los repintados del mapeo.
    const choice = { accountId: accounts[0]?.id || '', defaultType: 'expense' };
    openSheet({
        title: 'Importar movimientos',
        subtitle: 'Desde Excel (guárdelo como CSV) o cualquier CSV',
        size: 'lg',
        content: html`<div class="form" data-import-root>
            <label class="upload-zone">${icon('upload', { size: 24 })}<span>Elija el archivo CSV</span><input type="file" accept=".csv,text/csv,text/plain" data-csv></label>
            <div data-mapping></div>
        </div>`,
        onMount(body, api) {
            const host = body.querySelector('[data-mapping]');
            const draw = () => {
                if (!rows.length) { host.innerHTML = ''; return; }
                const headers = rows[0];
                const option = (field, label, optional = true) => html`<label class="field"><span>${label}</span><select data-map="${field}">
                    ${optional ? html`<option value="">—</option>` : ''}${headers.map((h, i) => html`<option value="${i}" ${mapping[field] === i ? 'selected' : ''}>${h || `Columna ${i + 1}`}</option>`)}</select></label>`;
                const preview = rowsToTransactions(rows.slice(0, 7), mapping, { defaultType: choice.defaultType });
                const previewCurrency = accounts.find(a => a.id === choice.accountId)?.currency || model.fx.base;
                host.innerHTML = String(html`
                    <div class="form-grid">
                        ${option('date', 'Fecha', false)}
                        ${option('description', 'Descripción')}
                        ${option('amount', 'Monto (con signo)')}
                        ${option('category', 'Categoría')}
                        ${option('income', 'Columna de ingresos')}
                        ${option('expense', 'Columna de gastos')}
                        <label class="field"><span>Cuenta</span><select data-account>${accounts.map(a => html`<option value="${a.id}" ${a.id === choice.accountId ? 'selected' : ''}>${a.name} · ${a.currency}</option>`)}</select></label>
                        <label class="field"><span>Si el monto no tiene signo, es…</span><select data-default-type><option value="expense" ${choice.defaultType === 'expense' ? 'selected' : ''}>Gasto</option><option value="income" ${choice.defaultType === 'income' ? 'selected' : ''}>Ingreso</option></select></label>
                    </div>
                    <p class="eyebrow" style="margin:6px 0">Vista previa</p>
                    <div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th class="is-num">Monto</th></tr></thead>
                    <tbody>${preview.items.map(item => html`<tr><td>${item.date}</td><td>${item.merchant}</td><td>${item.categoryLabel}</td><td class="is-num">${money(item.type === 'expense' ? -item.amountMinor : item.amountMinor, previewCurrency)}</td></tr>`)}</tbody></table></div>
                    <p class="field-hint">${rows.length - 1} filas en el archivo${preview.errors.length ? ` · algunas se saltarán (${preview.errors[0].reason.toLowerCase()})` : ''}.</p>
                    <div class="sheet-actions"><button type="button" class="btn btn-primary" data-run-import>${icon('upload', { size: 16 })}Importar ${rows.length - 1} filas</button></div>`);
            };
            body.addEventListener('change', async event => {
                if (event.target.matches('[data-csv]')) {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.size > 20 * 1024 * 1024) { toast('Ese archivo es demasiado grande (más de 20 MB). Divídalo en varios.', { tone: 'error' }); return; }
                    rows = parseCSV(await readFileText(file));
                    if (rows.length < 2) { toast('El archivo no tiene filas.', { tone: 'error' }); return; }
                    if (rows.length > 20001) { rows = []; toast('El archivo tiene más de 20.000 filas. Divídalo en varios e impórtelos uno por uno.', { tone: 'error', duration: 7000 }); draw(); return; }
                    mapping = guessMapping(rows[0]);
                    if (mapping.amount !== undefined && (mapping.income !== undefined || mapping.expense !== undefined)) delete mapping.amount;
                    draw();
                }
                if (event.target.matches('[data-account]')) choice.accountId = event.target.value;
                if (event.target.matches('[data-default-type]')) { choice.defaultType = event.target.value; draw(); }
                if (event.target.matches('[data-map]')) {
                    const value = event.target.value;
                    if (value === '') delete mapping[event.target.dataset.map]; else mapping[event.target.dataset.map] = Number(value);
                    draw();
                }
            });
            body.addEventListener('click', async event => {
                if (!event.target.closest('[data-run-import]')) return;
                if (mapping.date === undefined) return toast('Elija la columna de fecha.', { tone: 'error' });
                const { accountId, defaultType } = choice;
                const account = accounts.find(a => a.id === accountId);
                const { items, errors } = rowsToTransactions(rows, mapping, { defaultType });
                const { fresh, duplicates } = splitDuplicates(items, app.store.list('transactions'), accountId);
                const ops = fresh.map(item => ({
                    op: 'set', name: 'transactions',
                    data: {
                        type: item.type, amountMinor: item.amountMinor, currency: account?.currency || model.fx.base, date: item.date, accountId,
                        merchant: item.merchant,
                        categoryId: matchCategory(item.categoryLabel || item.merchant, model.categories, item.type) || (item.type === 'income' ? 'otros-ingresos' : 'otros-gastos'),
                        tags: ['importado'], createdDate: model.today, imported: true
                    }
                }));
                if (!ops.length) {
                    return toast(duplicates.length ? 'Esas filas ya estaban importadas en esa cuenta.' : 'No se encontró ninguna fila válida.', { tone: duplicates.length ? 'info' : 'error' });
                }
                try {
                    await app.store.batch(ops);
                } catch (error) {
                    console.error(error);
                    return toast(describeError(error, 'No se pudo importar. Inténtelo de nuevo.'), { tone: 'error', duration: 7000 });
                }
                await api.close();
                const skipped = [
                    duplicates.length ? `${duplicates.length} ya estaban` : '',
                    errors.length ? `${errors.length} filas omitidas` : ''
                ].filter(Boolean).join(', ');
                toast(`${ops.length} movimientos importados${skipped ? ` (${skipped})` : ''}.`, { tone: 'success', duration: 6000 });
            });
        }
    });
}

/* ── Restaurar una copia de seguridad ──────────────────────────────────────── */

function restoreSheet() {
    let backup = null;
    openSheet({
        title: 'Restaurar una copia de seguridad',
        subtitle: 'El archivo JSON que descargó en «Copia de seguridad»',
        size: 'md',
        content: html`<div class="form">
            <label class="upload-zone">${icon('upload', { size: 24 })}<span>Elija el archivo de la copia (.json)</span><input type="file" accept=".json,application/json" data-backup></label>
            <div data-summary></div>
        </div>`,
        onMount(body, api) {
            const summary = body.querySelector('[data-summary]');
            body.addEventListener('change', async event => {
                if (!event.target.matches('[data-backup]')) return;
                const file = event.target.files?.[0];
                if (!file) return;
                backup = null;
                if (file.size > MAX_BACKUP_BYTES) { summary.innerHTML = String(html`<p class="field-error">Ese archivo pesa demasiado para ser una copia de Patrimonio.</p>`); return; }
                try {
                    backup = parseBackup(await readFileText(file), COLLECTIONS);
                } catch (error) {
                    summary.innerHTML = String(html`<p class="field-error">${error.message}</p>`);
                    return;
                }
                const rows = Object.entries(backup.counts).filter(([, count]) => count > 0);
                summary.innerHTML = String(html`
                    ${backup.exportedAt ? html`<p class="field-hint">Copia del ${formatDate(backup.exportedAt.slice(0, 10), 'medium')}.</p>` : ''}
                    <div class="table-wrap"><table class="table"><tbody>${rows.map(([name, count]) => html`<tr><td>${BACKUP_LABELS[name] || name}</td><td class="is-num">${count}</td></tr>`)}</tbody></table></div>
                    <p class="field-hint">Se suma a lo que ya tiene: nada se borra, y lo que tenga el mismo identificador se reemplaza por lo de la copia. Los archivos de comprobantes y portadas no viajan en la copia.${backup.skipped.length ? ` Se saltarán ${backup.skipped.length} elementos que no son válidos.` : ''}</p>
                    <div class="sheet-actions"><button type="button" class="btn btn-primary" data-run-restore ${backup.total ? '' : 'disabled'}>${icon('rotate-ccw', { size: 16 })}Restaurar ${backup.total} elementos</button></div>`);
            });
            body.addEventListener('click', async event => {
                const button = event.target.closest('[data-run-restore]');
                if (!button || !backup?.total) return;
                button.disabled = true;
                const ops = Object.entries(backup.collections).flatMap(([name, docs]) => docs.map(doc => ({ op: 'set', name, id: doc.id, data: doc })));
                try {
                    await app.store.batch(ops);
                } catch (error) {
                    console.error(error);
                    button.disabled = false;
                    return toast(describeError(error, 'No se pudo restaurar. Inténtelo de nuevo.'), { tone: 'error', duration: 7000 });
                }
                await api.close();
                toast(`${ops.length} elementos restaurados.`, { tone: 'success', duration: 6000 });
            });
        }
    });
}
