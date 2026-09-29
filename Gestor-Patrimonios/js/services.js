/**
 * Operaciones de negocio que usan varias pantallas: guardar un movimiento con
 * su comprobante, borrarlo con «deshacer», aportar a una meta, pagar una
 * cuota, registrar un recurrente, avisar al backend de correo.
 */
import { app } from './context.js';
import { todayISO, addDays } from './core/dates.js';
import { inBase, convertMinor } from './core/money.js';
import { monthlyInterest } from './core/loans.js';
import { spendImpactDays } from './core/goals.js';
import { occurrences } from './core/recurring.js';
import { pruneAlertState } from './core/alerts.js';
import { stripAccents } from './core/text.js';
import { formatMoney, displayCurrencyCode } from './ui/format.js';
import { compressImage } from './ui/dom.js';
import { toast } from './ui/overlay.js';
import { play } from './ui/sounds.js';
import { idToken } from './firebase.js';

const ALLOWED_UPLOAD = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf|application\/xml|text\/xml)$/;
const MAX_UPLOAD = 10 * 1024 * 1024;
/** Días hacia atrás que el registro automático rellena al abrir la app. */
const AUTO_POST_LOOKBACK_DAYS = 45;
/** Días que se recuerda una alerta descartada o aplazada antes de olvidarla (salvo los hitos de metas). */
const ALERT_STATE_TTL_DAYS = 120;

function safeFileName(name) {
    return stripAccents(name || 'archivo').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-120) || 'archivo';
}

/** Sube un comprobante (comprimiendo las fotos) y devuelve sus metadatos. */
export async function uploadReceipt(file, folderId, onProgress) {
    let upload = file;
    let type = file.type;
    if (!type && /\.xml$/i.test(file.name)) type = 'application/xml';
    if (!type && /\.pdf$/i.test(file.name)) type = 'application/pdf';
    if (/^image\//.test(type)) upload = await compressImage(file);
    if (upload !== file) type = upload.type;
    if (!ALLOWED_UPLOAD.test(type)) throw new Error('Formato no admitido. Use foto, PDF o XML.');
    if (upload.size > MAX_UPLOAD) throw new Error('El archivo supera los 10 MB.');
    const blob = upload.type === type ? upload : new File([upload], upload.name, { type });
    const path = `receipts/${folderId}/${Date.now()}-${safeFileName(blob.name)}`;
    const meta = await app.store.upload(path, blob, onProgress);
    return { ...meta, type, uploadedAt: new Date().toISOString() };
}

/**
 * Deja constancia de cuánto movió un movimiento en la moneda de su cuenta,
 * cuando no coinciden (un gasto en dólares con una tarjeta en colones). Así el
 * saldo no cambia después con el tipo de cambio.
 */
function withAccountAmount(tx) {
    const model = app.model();
    const account = model.accounts.find(a => a.id === tx.accountId);
    const doc = { ...tx };
    if (tx.type !== 'transfer' && account && tx.currency && tx.currency !== account.currency) {
        doc.accountAmountMinor = tx.accountAmountMinor ?? convertMinor(tx.amountMinor, tx.currency, account.currency, model.fx);
    } else {
        delete doc.accountAmountMinor;
    }
    return doc;
}

/**
 * Guarda un movimiento. Devuelve su id y, si es un gasto, el impacto en la
 * meta prioritaria y en el presupuesto de su categoría, para contarlo al usuario.
 *
 * @param {object} tx
 * @param {{receiptFile?: File|null, onProgress?: (fraction: number) => void}} [options]
 */
export async function saveTransaction(tx, { receiptFile = null, onProgress } = {}) {
    const id = tx.id || app.store.newId('tx');
    const doc = withAccountAmount({ ...tx, id, createdDate: tx.createdDate || todayISO() });
    let uploaded = null;
    if (receiptFile) {
        uploaded = await uploadReceipt(receiptFile, id, onProgress);
        doc.receipt = uploaded;
    }
    try {
        await app.store.save('transactions', doc);
    } catch (error) {
        // El documento no se guardó: el archivo recién subido no debe quedar huérfano.
        if (uploaded?.path) app.store.removeFile(uploaded.path);
        throw error;
    }
    play('success');
    notifyAlertCheck();
    return { id, impact: doc.type === 'expense' ? expenseImpact(doc) : null };
}

/** Cuánto retrasa este gasto la meta prioritaria y cómo queda su presupuesto. */
function expenseImpact(tx) {
    const model = app.model();
    const amount = inBase(tx.amountMinor, tx.currency, model.fx);
    const goal = model.goals.find(g => !g.progress.done && g.pace > 0);
    const days = goal ? spendImpactDays(amount, inBase(goal.pace, goal.goal.currency, model.fx)) : null;
    const budget = model.budgets.find(b => b.budget.categoryId === tx.categoryId);
    return {
        goal: goal ? { name: goal.goal.name, days } : null,
        budget: budget ? { name: budget.category.name, remaining: budget.status.remaining, pct: budget.status.pct, state: budget.status.state } : null
    };
}

export function impactMessage(impact) {
    if (!impact) return '';
    const parts = [];
    if (impact.goal?.days > 0) parts.push(`retrasa «${impact.goal.name}» ${impact.goal.days} ${impact.goal.days === 1 ? 'día' : 'días'}`);
    if (impact.budget) {
        if (impact.budget.remaining < 0) parts.push(`superó el presupuesto de ${impact.budget.name.toLowerCase()}`);
        else parts.push(`le quedan ${formatMoney(impact.budget.remaining)} en ${impact.budget.name.toLowerCase()}`);
    }
    if (!parts.length) return '';
    const text = parts.join(' y ');
    return text.charAt(0).toUpperCase() + text.slice(1) + '.';
}

/**
 * Operación sobre la deuda que acompaña a una cuota: al borrarla, el capital
 * vuelve al saldo (y el préstamo se reabre si había quedado saldado).
 */
function debtRestoreOp(tx) {
    const debt = tx.debtId ? app.store.get('debts', tx.debtId) : null;
    const principal = Number(tx.principalMinor) || 0;
    if (!debt || principal <= 0) return null;
    return {
        op: 'update', name: 'debts', id: debt.id,
        data: { balanceMinor: (Number(debt.balanceMinor) || 0) + principal, status: 'active', active: true, paidOffDate: null }
    };
}

export async function deleteTransaction(tx) {
    const restoreDebt = debtRestoreOp(tx);
    const debtBefore = restoreDebt ? app.store.get('debts', tx.debtId) : null;
    await app.store.batch([{ op: 'delete', name: 'transactions', id: tx.id }, ...(restoreDebt ? [restoreDebt] : [])]);
    toast(restoreDebt ? 'Cuota eliminada: el capital volvió al saldo del préstamo' : 'Movimiento eliminado', {
        action: {
            label: 'Deshacer',
            onClick: () => app.store.batch([
                { op: 'set', name: 'transactions', id: tx.id, data: tx },
                ...(debtBefore ? [{ op: 'set', name: 'debts', id: debtBefore.id, data: debtBefore }] : [])
            ])
        }
    });
    // El comprobante se borra solo si no se deshace en unos segundos.
    if (tx.receipt?.path) {
        setTimeout(() => {
            if (!app.store.get('transactions', tx.id)) app.store.removeFile(tx.receipt.path);
        }, 7000);
    }
}

export async function addContribution({ goalId, amountMinor, date = todayISO(), note = '', accountId = null }) {
    const id = await app.store.save('contributions', { goalId, amountMinor, date, note, accountId });
    play('success');
    return id;
}

/**
 * Pago de una cuota: crea el gasto (categoría «Cuotas y deudas»), reparte el
 * pago en intereses y capital, y baja el saldo de la deuda. Si viene de un
 * recurrente, el gasto lleva su marca para que no quede como pendiente.
 */
export async function payDebt(debt, { amountMinor, date = todayISO(), accountId, recurring = null, id = null }) {
    const interest = Math.min(amountMinor, monthlyInterest(debt.balanceMinor, debt.annualRate));
    const principal = Math.max(0, amountMinor - interest);
    const balance = Math.max(0, (Number(debt.balanceMinor) || 0) - principal);
    const tx = withAccountAmount({
        id: id || app.store.newId('tx'),
        type: 'expense', amountMinor, currency: debt.currency, date, accountId,
        categoryId: 'deudas', merchant: `Cuota · ${debt.name}`, method: 'transfer',
        debtId: debt.id, interestMinor: interest, principalMinor: principal, createdDate: todayISO(),
        ...(recurring ? { recurringId: recurring.id, recurringDate: date } : {})
    });
    await app.store.batch([
        { op: 'set', name: 'transactions', id: tx.id, data: tx },
        {
            op: 'update', name: 'debts', id: debt.id,
            data: { balanceMinor: balance, lastPaymentDate: date, ...(balance === 0 ? { status: 'paid', active: false, paidOffDate: date } : {}) }
        },
        ...(recurring ? [{ op: 'update', name: 'recurring', id: recurring.id, data: { lastPostedDate: date } }] : [])
    ]);
    play('success');
    notifyAlertCheck();
    return { interest, principal, balance };
}

/**
 * Identificador de la ocurrencia de un recurrente. Es el mismo en cualquier
 * dispositivo: registrar dos veces la misma fecha (dos dispositivos abiertos,
 * un doble clic, una caché vieja) reescribe el mismo movimiento en vez de
 * duplicarlo.
 */
export function recurringTxId(rule, date) {
    return `rec-${rule.id}-${date}`;
}

function recurringTransaction(rule, date, extra = {}) {
    return withAccountAmount({
        id: recurringTxId(rule, date),
        type: rule.type, amountMinor: rule.amountMinor, currency: rule.currency || displayCurrencyCode(), date,
        accountId: rule.accountId, categoryId: rule.categoryId, merchant: rule.name,
        method: rule.method || (rule.type === 'income' ? 'transfer' : undefined),
        recurringId: rule.id, recurringDate: date, createdDate: todayISO(), ...extra
    });
}

/** ¿Ya está registrada esta ocurrencia, en este dispositivo o en otro que ya sincronizó? */
function alreadyPosted(rule, date) {
    return Boolean(app.store.get('transactions', recurringTxId(rule, date)))
        || app.model().paidKeys.has(`${rule.id}:${date}`);
}

/** Registra una ocurrencia de un recurrente como movimiento real. Devuelve `false` si ya estaba. */
export async function postRecurring(rule, date) {
    if (alreadyPosted(rule, date)) return false;
    const debt = rule.debtId ? app.store.get('debts', rule.debtId) : null;
    if (debt && debt.active !== false) {
        await payDebt(debt, { amountMinor: rule.amountMinor, date, accountId: rule.accountId, recurring: rule, id: recurringTxId(rule, date) });
        return true;
    }
    await app.store.batch([
        { op: 'set', name: 'transactions', id: recurringTxId(rule, date), data: recurringTransaction(rule, date) },
        { op: 'update', name: 'recurring', id: rule.id, data: { lastPostedDate: date } }
    ]);
    notifyAlertCheck();
    return true;
}

/**
 * Al abrir la app: registra solas las ocurrencias vencidas de las reglas con
 * «registrar automáticamente» (hasta 45 días atrás, para no inventar historia).
 * Cada regla va en su propio lote: una que falle (por ejemplo, sin cuenta) no
 * impide registrar las demás. Las ya registradas se reconocen por su
 * identificador, así que revisar dos veces el mismo tramo, o hacerlo desde dos
 * dispositivos a la vez, no duplica nada.
 */
export async function autoPostRecurring() {
    const model = app.model();
    const since = addDays(model.today, -AUTO_POST_LOOKBACK_DAYS);
    let posted = 0;
    const problems = [];
    for (const rule of model.recurring) {
        if (!rule.autoPost || rule.active === false || rule.debtId) continue;
        if (!rule.accountId || !app.store.get('accounts', rule.accountId)) {
            problems.push(rule.name);
            continue;
        }
        const from = rule.lastPostedDate && rule.lastPostedDate >= since ? addDays(rule.lastPostedDate, 1) : since;
        const dates = occurrences(rule, from, model.today).filter(date => !alreadyPosted(rule, date));
        if (!dates.length) continue;
        const ops = dates.map(date => ({ op: 'set', name: 'transactions', id: recurringTxId(rule, date), data: recurringTransaction(rule, date, { autoPosted: true }) }));
        ops.push({ op: 'update', name: 'recurring', id: rule.id, data: { lastPostedDate: dates[dates.length - 1] } });
        try {
            await app.store.batch(ops);
            posted += dates.length;
        } catch (error) {
            console.error('Registro automático', rule.id, error);
            problems.push(rule.name);
        }
    }
    if (posted) toast(`${posted} ${posted === 1 ? 'movimiento recurrente registrado' : 'movimientos recurrentes registrados'} solos`, { tone: 'info', iconName: 'repeat' });
    if (problems.length) {
        toast(`No se pudo registrar solo: ${problems.slice(0, 2).join(', ')}${problems.length > 2 ? '…' : ''}. Revise su cuenta en Recurrentes.`, { tone: 'error', duration: 7000 });
    }
    if (posted) notifyAlertCheck();
}

/**
 * Pide al backend que evalúe las alertas inmediatas de esta persona y envíe
 * por correo las nuevas. El servidor lee los datos por su cuenta: aquí no se
 * manda contenido, solo el aviso. Si no hay red o backend, no pasa nada.
 */
let alertTimer = null;
function notifyAlertCheck() {
    if (app.mode !== 'firebase') return;
    clearTimeout(alertTimer);
    alertTimer = setTimeout(async () => {
        try {
            const token = await idToken();
            if (!token) return;
            await fetch('/api/patrimonio/alerts/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: '{}',
                keepalive: true
            });
        } catch { /* sin conexión: el resumen diario lo recogerá */ }
    }, 2500);
}

/**
 * Descarta o aplaza una alerta. De paso olvida las entradas viejas: casi todos
 * los ids llevan su fecha o su período y no vuelven a aparecer, así que
 * guardarlos para siempre solo engordaría el perfil. La excepción son los
 * hitos de una meta (`goal-milestone:<meta>:<hito>`), que no llevan fecha y se
 * conservan mientras la meta exista.
 */
export async function updateAlertState(alertId, entry) {
    const today = app.model().today;
    const kept = pruneAlertState(app.store.profile?.alertState, {
        today, ttlDays: ALERT_STATE_TTL_DAYS, goalExists: id => Boolean(app.store.get('goals', id))
    });
    await app.store.saveProfile({ alertState: { ...kept, [alertId]: { at: today, ...entry } } });
}
