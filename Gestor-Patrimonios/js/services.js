/**
 * Operaciones de negocio que usan varias pantallas: guardar un movimiento con
 * su comprobante, borrarlo con «deshacer», aportar a una meta, pagar una
 * cuota, registrar un recurrente, avisar al backend de correo.
 */
import { app } from './context.js';
import { todayISO, addDays } from './core/dates.js';
import { inBase } from './core/money.js';
import { monthlyInterest } from './core/loans.js';
import { spendImpactDays } from './core/goals.js';
import { formatMoney } from './core/money.js';
import { compressImage } from './ui/dom.js';
import { toast } from './ui/overlay.js';
import { play } from './ui/sounds.js';
import { idToken } from './firebase.js';

const ALLOWED_UPLOAD = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf|application\/xml|text\/xml)$/;
export const MAX_UPLOAD = 10 * 1024 * 1024;

export function safeFileName(name) {
    const base = String(name || 'archivo').normalize('NFD').replace(/[̀-ͯ]/g, '');
    return base.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-120) || 'archivo';
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
 * Guarda un movimiento. Devuelve su id y, si es un gasto, el impacto en la
 * meta prioritaria y en el presupuesto de su categoría, para contarlo al usuario.
 */
export async function saveTransaction(tx, { receiptFile = null, onProgress } = {}) {
    const store = app.store;
    const id = tx.id || store.newId('tx');
    const doc = { ...tx, id };
    if (!doc.createdDate) doc.createdDate = todayISO();
    if (receiptFile) {
        doc.receipt = await uploadReceipt(receiptFile, id, onProgress);
    }
    await store.save('transactions', doc);
    play('success');
    notifyAlertCheck();
    return { id, impact: doc.type === 'expense' ? expenseImpact(doc) : null };
}

/** Cuánto retrasa este gasto la meta prioritaria y cómo queda su presupuesto. */
export function expenseImpact(tx) {
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

export async function deleteTransaction(tx) {
    await app.store.remove('transactions', tx.id);
    toast('Movimiento eliminado', {
        action: {
            label: 'Deshacer',
            onClick: () => app.store.save('transactions', tx)
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
 * pago en intereses y capital, y baja el saldo de la deuda.
 */
export async function payDebt(debt, { amountMinor, date = todayISO(), accountId }) {
    const interest = Math.min(amountMinor, monthlyInterest(debt.balanceMinor, debt.annualRate));
    const principal = Math.max(0, amountMinor - interest);
    const balance = Math.max(0, (Number(debt.balanceMinor) || 0) - principal);
    await app.store.batch([
        {
            op: 'set', name: 'transactions',
            data: {
                type: 'expense', amountMinor, currency: debt.currency, date, accountId,
                categoryId: 'deudas', merchant: `Cuota · ${debt.name}`, method: 'transfer',
                debtId: debt.id, interestMinor: interest, principalMinor: principal, createdDate: todayISO()
            }
        },
        {
            op: 'update', name: 'debts', id: debt.id,
            data: { balanceMinor: balance, lastPaymentDate: date, ...(balance === 0 ? { status: 'paid', active: false, paidOffDate: date } : {}) }
        }
    ]);
    play('success');
    notifyAlertCheck();
    return { interest, principal, balance };
}

/** Registra una ocurrencia de un recurrente como movimiento real. */
export async function postRecurring(rule, date, overrides = {}) {
    const tx = {
        type: rule.type, amountMinor: rule.amountMinor, currency: rule.currency || 'CRC', date,
        accountId: rule.accountId, categoryId: rule.categoryId, merchant: rule.name,
        method: rule.method || (rule.type === 'income' ? 'transfer' : undefined),
        recurringId: rule.id, recurringDate: date, debtId: rule.debtId || undefined,
        createdDate: todayISO(), ...overrides
    };
    if (rule.debtId) {
        const debt = app.store.get('debts', rule.debtId);
        if (debt && debt.active !== false) {
            await payDebt(debt, { amountMinor: tx.amountMinor, date, accountId: tx.accountId });
            return;
        }
    }
    await app.store.batch([
        { op: 'set', name: 'transactions', data: tx },
        { op: 'update', name: 'recurring', id: rule.id, data: { lastPostedDate: date } }
    ]);
    notifyAlertCheck();
}

/**
 * Al abrir la app: registra solas las ocurrencias vencidas de las reglas con
 * «registrar automáticamente» (hasta 45 días atrás, para no inventar historia).
 */
export async function autoPostRecurring() {
    const model = app.model();
    const since = addDays(model.today, -45);
    const ops = [];
    const { occurrences } = await import('./core/recurring.js');
    for (const rule of model.recurring) {
        if (!rule.autoPost || rule.active === false || rule.debtId) continue;
        const from = rule.lastPostedDate && rule.lastPostedDate >= since ? addDays(rule.lastPostedDate, 1) : since;
        let posted = 0;
        for (const date of occurrences(rule, from, model.today, 6)) {
            if (date < (rule.anchorDate || date)) continue;
            if (model.paidKeys.has(`${rule.id}:${date}`)) continue;
            posted += 1;
            ops.push({ op: 'set', name: 'transactions', data: {
                type: rule.type, amountMinor: rule.amountMinor, currency: rule.currency || 'CRC', date,
                accountId: rule.accountId, categoryId: rule.categoryId, merchant: rule.name,
                recurringId: rule.id, recurringDate: date, createdDate: model.today, autoPosted: true
            } });
        }
        if (posted) ops.push({ op: 'update', name: 'recurring', id: rule.id, data: { lastPostedDate: model.today } });
    }
    if (ops.length) {
        await app.store.batch(ops);
        const count = ops.filter(op => op.name === 'transactions').length;
        toast(`${count} ${count === 1 ? 'movimiento recurrente registrado' : 'movimientos recurrentes registrados'} solos`, { tone: 'info', iconName: 'repeat' });
    }
}

/**
 * Pide al backend que evalúe las alertas inmediatas de esta persona y envíe
 * por correo las nuevas. El servidor lee los datos por su cuenta: aquí no se
 * manda contenido, solo el aviso. Si no hay red o backend, no pasa nada.
 */
let alertTimer = null;
export function notifyAlertCheck() {
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

export async function updateAlertState(alertId, entry) {
    const current = app.store.profile?.alertState || {};
    await app.store.saveProfile({ alertState: { ...current, [alertId]: entry } });
}
