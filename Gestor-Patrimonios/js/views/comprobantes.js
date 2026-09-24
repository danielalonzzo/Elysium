/**
 * Comprobantes: fotos, PDF y XML de factura electrónica.
 *
 * Los XML de Hacienda se leen en el navegador y dejan el movimiento listo para
 * confirmar (comercio, fecha, total, moneda, IVA). Las fotos y PDF quedan en
 * una bandeja hasta que se convierten en movimiento o se vinculan a uno.
 */
import { app } from '../context.js';
import { html, readFileText } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money, num } from '../ui/format.js';
import { emptyState, txTitle } from '../ui/parts.js';
import { parseFactura, directionFor } from '../core/factura-cr.js';
import { formatDate, monthLabel } from '../core/dates.js';
import { inBase, isCurrency } from '../core/money.js';
import { normalizeMerchant } from '../core/stats.js';
import { matchCategory } from '../core/categories.js';
import { uploadReceipt } from '../services.js';
import { toast, openSheet } from '../ui/overlay.js';

const thumbs = new Map();
const state = { month: 'all' };

export default {
    title: 'Comprobantes',
    eyebrow: 'Facturas, tiquetes y recibos',

    render(model) {
        const inbox = model.receipts.filter(r => r.status !== 'done');
        const withReceipt = model.txs.filter(tx => tx.receipt && (state.month === 'all' || tx.date.startsWith(state.month)));
        const periodExpenses = model.periodTxs.filter(tx => tx.type === 'expense' && !tx.adjustment);
        const coverage = periodExpenses.length ? periodExpenses.filter(tx => tx.receipt).length / periodExpenses.length * 100 : 0;
        const iva = model.txs.filter(tx => tx.factura?.taxMinor && tx.date.slice(0, 4) === model.today.slice(0, 4))
            .reduce((sum, tx) => sum + inBase(tx.factura.taxMinor, tx.currency, model.fx), 0);
        const months = [...new Set(model.txs.filter(tx => tx.receipt).map(tx => tx.date.slice(0, 7)))].slice(0, 12);

        return html`
            <div class="grid grid-main">
                <article class="card">
                    <label class="upload-zone" data-drop>
                        ${icon('upload', { size: 28 })}
                        <b>Suba sus comprobantes</b>
                        <span>Fotos, PDF o el <b>XML de la factura electrónica</b> que le llega al correo. Puede elegir varios a la vez.</span>
                        <input type="file" multiple accept="image/*,application/pdf,.xml,application/xml,text/xml" data-upload>
                    </label>
                    <div class="upload-progress section-gap" data-progress hidden><span></span></div>
                    <div class="callout section-gap">${icon('info')}<span>Consejo: al pagar, pida la factura electrónica a su nombre. El XML trae comercio, fecha, total e IVA exactos, sin tener que escribir nada.</span></div>
                </article>
                <div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
                    <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Comprobantes</span><span class="kpi-icon">${icon('receipt', { size: 17 })}</span></div><div class="kpi-value">${num(model.txs.filter(tx => tx.receipt).length)}</div><div class="kpi-sub">adjuntos a movimientos</div></article>
                    <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Cobertura del mes</span><span class="kpi-icon is-ok">${icon('check-circle', { size: 17 })}</span></div><div class="kpi-value">${Math.round(coverage)}%</div><div class="kpi-sub">de sus gastos con comprobante</div></article>
                    <article class="card kpi" style="grid-column:1/-1"><div class="kpi-top"><span class="kpi-label">IVA pagado este año</span><span class="kpi-icon is-gold">${icon('percent', { size: 17 })}</span></div><div class="kpi-value">${money(iva)}</div><div class="kpi-sub">según sus facturas electrónicas</div></article>
                </div>
            </div>

            ${inbox.length ? html`<div class="section-title"><h2>Bandeja</h2><span class="muted">${inbox.length} por confirmar</span></div>
                <article class="card">${inbox.map(item => inboxItem(item, model))}</article>` : ''}

            <div class="section-title"><h2>Archivados</h2>
                <label class="field"><span class="sr-only">Mes</span><select data-month><option value="all">Todos</option>${months.map(key => html`<option value="${key}" ${state.month === key ? 'selected' : ''}>${monthLabel(key, { long: true })}</option>`)}</select></label>
            </div>
            ${withReceipt.length ? html`<div class="receipt-grid">${withReceipt.slice(0, 60).map(tx => html`<button type="button" class="receipt-card" data-tx="${tx.id}">
                <span class="receipt-thumb" data-thumb="${tx.receipt.demo ? '' : tx.receipt.path}" data-type="${tx.receipt.type || ''}">
                    ${icon(/xml/.test(tx.receipt.type) ? 'file-code' : /pdf/.test(tx.receipt.type) ? 'file-text' : 'image', { size: 30 })}
                </span>
                <b>${txTitle(tx, model)}</b>
                <span class="row-between"><small>${formatDate(tx.date, 'medium')}</small>${money(tx.type === 'expense' ? -tx.amountMinor : tx.amountMinor, tx.currency)}</span>
            </button>`)}</div>`
            : html`<article class="card">${emptyState({ title: 'Aún no hay comprobantes', body: 'Adjunte una foto o el XML al registrar un gasto, o súbalos aquí y le ayudamos a registrarlos.', iconName: 'receipt' })}</article>`}`;
    },

    mount(root, model) {
        loadThumbs(root);
        const input = root.querySelector('[data-upload]');
        const zone = root.querySelector('[data-drop]');
        const progress = root.querySelector('[data-progress]');
        const handleFiles = async files => {
            if (!files?.length) return;
            progress.hidden = false;
            const bar = progress.querySelector('span');
            let done = 0;
            let parsedCount = 0;
            for (const file of files) {
                try {
                    const isXml = /xml/.test(file.type) || /\.xml$/i.test(file.name);
                    let parsed = null;
                    if (isXml) {
                        try {
                            parsed = parseFactura(await readFileText(file));
                        } catch (error) {
                            toast(`${file.name}: ${error.message}`, { tone: 'error', duration: 6000 });
                            done += 1;
                            continue;
                        }
                        if (parsed.clave && model.txs.some(tx => tx.factura?.clave === parsed.clave)) {
                            toast(`${parsed.merchant}: esa factura ya está registrada.`, { tone: 'info' });
                            done += 1;
                            continue;
                        }
                        parsedCount += 1;
                    }
                    const id = app.store.newId('rc');
                    const meta = await uploadReceipt(file, `inbox-${id}`, p => { bar.style.width = `${Math.round(((done + p) / files.length) * 100)}%`; });
                    await app.store.save('receipts', {
                        id, status: 'inbox', ...meta,
                        parsed: parsed ? {
                            date: parsed.date, merchant: parsed.merchant, totalMinor: parsed.totalMinor, currency: parsed.currency,
                            taxMinor: parsed.taxMinor, clave: parsed.clave, consecutivo: parsed.consecutivo, method: parsed.method,
                            documentType: parsed.documentType, label: parsed.label, issuerId: parsed.issuer?.id || null,
                            direction: directionFor(parsed, model.settings.taxId),
                            lines: parsed.lines.slice(0, 6).map(l => l.detail).filter(Boolean)
                        } : null
                    });
                } catch (error) {
                    toast(`${file.name}: ${error.message || 'no se pudo subir'}`, { tone: 'error' });
                }
                done += 1;
                bar.style.width = `${Math.round((done / files.length) * 100)}%`;
            }
            progress.hidden = true;
            bar.style.width = '0';
            if (input) input.value = '';
            toast(parsedCount ? `${parsedCount} ${parsedCount === 1 ? 'factura leída' : 'facturas leídas'}: revíselas en la bandeja.` : 'Comprobantes en la bandeja.', { tone: 'success' });
        };
        input?.addEventListener('change', () => handleFiles([...input.files]));
        zone?.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('is-drag'); });
        zone?.addEventListener('dragleave', () => zone.classList.remove('is-drag'));
        zone?.addEventListener('drop', event => { event.preventDefault(); zone.classList.remove('is-drag'); handleFiles([...(event.dataTransfer?.files || [])]); });

        const onClick = async event => {
            const tx = event.target.closest('[data-tx]');
            if (tx) return (await import('../sheets/transaction.js')).openTransactionDetail(tx.dataset.tx);
            const create = event.target.closest('[data-inbox-create]');
            if (create) return createFromInbox(model, create.dataset.inboxCreate);
            const link = event.target.closest('[data-inbox-link]');
            if (link) return linkInbox(model, link.dataset.inboxLink);
            const discard = event.target.closest('[data-inbox-discard]');
            if (discard) {
                const item = app.store.get('receipts', discard.dataset.inboxDiscard);
                if (!item) return;
                await app.store.remove('receipts', item.id);
                if (item.path) app.store.removeFile(item.path);
                toast('Comprobante descartado');
            }
        };
        const onChange = event => {
            if (event.target.matches('[data-month]')) { state.month = event.target.value; app.rerender(); }
        };
        root.addEventListener('click', onClick);
        root.addEventListener('change', onChange);
        return () => {
            root.removeEventListener('click', onClick);
            root.removeEventListener('change', onChange);
        };
    }
};

function inboxItem(item, model) {
    const p = item.parsed;
    const isXml = /xml/.test(item.type);
    return html`<div class="inbox-item">
        <span class="cat-chip ${p ? 'tone-gold' : 'tone-blue'}">${icon(isXml ? 'file-code' : /pdf/.test(item.type) ? 'file-text' : 'image', { size: 20 })}</span>
        <span class="tx-main">
            <span class="tx-title">${p ? p.merchant || 'Comercio' : item.name}</span>
            <span class="tx-meta">${p ? html`${p.label} · ${formatDate(p.date || model.today, 'medium')} · ${money(p.totalMinor, p.currency)}${p.taxMinor ? html` · IVA ${money(p.taxMinor, p.currency)}` : ''}` : 'Foto o PDF sin datos: complételo al registrar'}</span>
        </span>
        <span class="row" style="gap:6px">
            <button type="button" class="btn btn-sm btn-primary" data-inbox-create="${item.id}">${p ? 'Registrar' : 'Crear movimiento'}</button>
            <button type="button" class="icon-btn is-sm" data-inbox-link="${item.id}" aria-label="Vincular a un movimiento existente" title="Vincular a un movimiento existente">${icon('pin', { size: 15 })}</button>
            <button type="button" class="icon-btn is-sm is-plain" data-inbox-discard="${item.id}" aria-label="Descartar">${icon('trash', { size: 15 })}</button>
        </span>
    </div>`;
}

async function createFromInbox(model, id) {
    const item = app.store.get('receipts', id);
    if (!item) return;
    const { openTransactionSheet } = await import('../sheets/transaction.js');
    const p = item.parsed;
    const receipt = { path: item.path, name: item.name, type: item.type, size: item.size };
    if (!p) return openTransactionSheet({ preset: { receipt, inboxId: id } });
    const kind = p.direction === 'income' ? 'income' : 'expense';
    const categoryId = model.merchantMemory.get(normalizeMerchant(p.merchant))
        || matchCategory(`${p.merchant} ${(p.lines || []).join(' ')}`, model.categories, kind);
    const account = model.accounts.find(a => !a.archived && a.type !== 'asset' && a.currency === p.currency);
    openTransactionSheet({
        type: kind,
        preset: {
            type: kind, amountMinor: p.totalMinor, currency: isCurrency(p.currency) ? p.currency : 'CRC', date: p.date || model.today,
            merchant: p.merchant, method: p.method, categoryId, accountId: account?.id, receipt, inboxId: id,
            factura: { label: p.label, consecutivo: p.consecutivo, clave: p.clave, taxMinor: p.taxMinor, documentType: p.documentType, issuer: { id: p.issuerId }, lines: [] }
        }
    });
}

function linkInbox(model, id) {
    const item = app.store.get('receipts', id);
    if (!item) return;
    const candidates = model.txs.filter(tx => !tx.receipt && tx.type !== 'transfer').slice(0, 40);
    const p = item.parsed;
    const sorted = p ? [...candidates].sort((a, b) => Math.abs(a.amountMinor - p.totalMinor) - Math.abs(b.amountMinor - p.totalMinor)) : candidates;
    openSheet({
        title: 'Vincular a un movimiento',
        subtitle: item.name,
        size: 'md',
        content: html`<div class="list">${sorted.slice(0, 20).map(tx => html`<button type="button" class="tx" data-pick="${tx.id}">
            <span class="cat-chip is-sm tone-blue">${icon('pin', { size: 15 })}</span>
            <span class="tx-main"><span class="tx-title">${txTitle(tx, model)}</span><span class="tx-meta">${formatDate(tx.date, 'medium')}</span></span>
            <span class="tx-amount">${money(tx.type === 'expense' ? -tx.amountMinor : tx.amountMinor, tx.currency)}</span>
        </button>`)}</div>`,
        onMount(body, api) {
            body.addEventListener('click', async event => {
                const pick = event.target.closest('[data-pick]');
                if (!pick) return;
                const receipt = { path: item.path, name: item.name, type: item.type, size: item.size };
                const patch = { receipt };
                if (p?.clave) patch.factura = { clave: p.clave, consecutivo: p.consecutivo, taxMinor: p.taxMinor, documentType: p.documentType, issuerId: p.issuerId };
                await app.store.patch('transactions', pick.dataset.pick, patch);
                await app.store.remove('receipts', item.id);
                await api.close();
                toast('Comprobante vinculado', { tone: 'success' });
            });
        }
    });
}

async function loadThumbs(root) {
    for (const holder of root.querySelectorAll('[data-thumb]')) {
        const path = holder.dataset.thumb;
        if (!path || !/^image\//.test(holder.dataset.type)) continue;
        try {
            let url = thumbs.get(path);
            if (!url) {
                url = await app.store.fileUrl(path);
                if (url) thumbs.set(path, url);
            }
            if (url && holder.isConnected) holder.innerHTML = `<img src="${url}" alt="" loading="lazy">`;
        } catch { /* sin miniatura */ }
    }
}
