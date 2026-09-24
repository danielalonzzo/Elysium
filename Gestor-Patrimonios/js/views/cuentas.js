/**
 * Cuentas y patrimonio: dónde está el dinero, cuánto se debe y cómo evoluciona
 * el patrimonio neto (activos menos pasivos).
 */
import { app } from '../context.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money, pct } from '../ui/format.js';
import { catChip, progressBar, emptyState } from '../ui/parts.js';
import { areaChart } from '../ui/charts.js';
import { ACCOUNT_TYPES } from '../core/stats.js';
import { formatDate, monthLabel, relativeDays } from '../core/dates.js';
import { nextMonthlyDay } from '../core/alerts.js';
import { actionSheet } from '../ui/overlay.js';

const GROUPS = [
    { title: 'Dinero disponible', types: ['cash', 'bank'] },
    { title: 'Ahorro e inversión', types: ['savings', 'cdp', 'investment'] },
    { title: 'Tarjetas de crédito', types: ['credit'] },
    { title: 'Bienes', types: ['asset'] }
];

export default {
    title: 'Cuentas',
    eyebrow: model => `Tipo de cambio ₡${String(model.fx.rate).replace('.', ',')} por $1${model.settings.fxUpdatedAt ? ` · ${model.settings.fxSource === 'manual' ? 'fijado a mano' : 'actualizado ' + relativeDays(model.today, model.settings.fxUpdatedAt)}` : ''}`,
    actions: () => html`<button type="button" class="btn btn-ghost hide-mobile" data-new-account>${icon('plus', { size: 17 })}Cuenta</button>`,

    render(model) {
        const { worth } = model;
        const visible = model.accounts.filter(a => !a.archived);
        const archived = model.accounts.filter(a => a.archived);
        const total = worth.assets + worth.liabilities || 1;

        if (!visible.length) {
            return html`<article class="card">${emptyState({ title: 'Cree su primera cuenta', body: 'Efectivo, cuenta del banco, tarjeta o ahorro. Con el saldo de hoy basta.', iconName: 'wallet', action: html`<button type="button" class="btn btn-primary" data-new-account>${icon('plus', { size: 17 })}Nueva cuenta</button>` })}</article>`;
        }

        return html`
            <div class="grid grid-main">
                <article class="card">
                    <div class="card-head"><div><p class="eyebrow is-gold">Patrimonio neto</p><p class="spend-value" style="margin-top:6px">${money(worth.net)}</p></div></div>
                    <div class="worth-bar" aria-hidden="true"><span class="is-assets" style="width:${(worth.assets / total * 100).toFixed(1)}%"></span><span class="is-liabilities" style="width:${(worth.liabilities / total * 100).toFixed(1)}%"></span></div>
                    <div class="legend section-gap"><span><i class="s-income"></i>Activos ${money(worth.assets)}</span><span><i class="s-expense"></i>Pasivos ${money(worth.liabilities)}</span></div>
                    <div class="chart section-gap" data-chart="worth"></div>
                </article>
                <article class="card">
                    <div class="card-head"><div><h2>Composición</h2><p>Qué suma y qué resta</p></div></div>
                    <div class="list">${worth.breakdown.filter(item => item.value !== 0).sort((a, b) => b.value - a.value).map(item => html`<div class="row-between" style="padding:8px 2px;font-size:.9rem">
                        <span>${item.name}</span>${money(item.value, 'CRC', { tone: item.value < 0 ? 'expense' : 'none' })}</div>`)}</div>
                </article>
            </div>

            ${GROUPS.map(group => {
                const accounts = visible.filter(a => group.types.includes(a.type));
                if (!accounts.length) return '';
                const sum = accounts.reduce((s, a) => s + a.balanceBase, 0);
                return html`<div class="section-title"><h2>${group.title}</h2><span class="muted">${money(sum, 'CRC', { tone: sum < 0 ? 'expense' : 'none' })}</span></div>
                    <div class="grid grid-3">${accounts.map(account => accountCard(account, model))}</div>`;
            })}
            ${archived.length ? html`<div class="section-title"><h2>Archivadas</h2></div><div class="grid grid-3">${archived.map(account => accountCard(account, model))}</div>` : ''}`;
    },

    mount(root, model, route) {
        const chart = root.querySelector('[data-chart="worth"]');
        if (chart) areaChart(chart, { labels: model.worthSeries.map(p => monthLabel(p.key, { year: false })), titles: model.worthSeries.map(p => monthLabel(p.key, { long: true })), values: model.worthSeries.map(p => p.value), name: 'Patrimonio neto', tone: 's-gold', height: 170 });
        if (route.query.nueva) {
            history.replaceState(history.state, '', '#/cuentas');
            import('../sheets/forms.js').then(m => m.openAccountSheet());
        }
        const onClick = async event => {
            const forms = await import('../sheets/forms.js');
            if (event.target.closest('[data-new-account]')) return forms.openAccountSheet();
            const card = event.target.closest('[data-account]');
            if (!card) return;
            const account = model.accounts.find(a => a.id === card.dataset.account);
            if (!account) return;
            actionSheet({
                title: account.name,
                subtitle: ACCOUNT_TYPES[account.type]?.label,
                actions: [
                    { label: 'Ver movimientos', icon: 'list', onClick: () => app.go(`#/movimientos?cuenta=${account.id}`) },
                    ...(account.type !== 'asset' ? [{ label: 'Transferir desde esta cuenta', icon: 'transfer', onClick: async () => (await import('../sheets/transaction.js')).openTransactionSheet({ type: 'transfer', preset: { accountId: account.id, currency: account.currency } }) }] : []),
                    ...(account.type === 'credit' ? [{ label: 'Pagar la tarjeta', icon: 'credit-card', hint: 'Transferencia desde su cuenta', onClick: async () => (await import('../sheets/transaction.js')).openTransactionSheet({ type: 'transfer', preset: { toAccountId: account.id, accountId: model.accounts.find(a => a.type === 'bank' && a.currency === account.currency)?.id, amountMinor: Math.max(0, -account.balance), currency: account.currency } }) }] : []),
                    { label: account.type === 'asset' ? 'Actualizar valor' : 'Ajustar saldo', icon: 'sliders', hint: 'Si no coincide con el banco', onClick: () => forms.openAdjustBalanceSheet(account) },
                    { label: 'Editar', icon: 'edit', onClick: () => forms.openAccountSheet({ account }) }
                ]
            });
        };
        root.addEventListener('click', onClick);
        return () => root.removeEventListener('click', onClick);
    }
};

function accountCard(account, model) {
    const credit = account.type === 'credit';
    const used = credit ? Math.max(0, -account.balance) : 0;
    const limit = Number(account.creditLimitMinor) || 0;
    const usedPct = limit ? used / limit * 100 : 0;
    const due = credit && account.dueDay ? nextMonthlyDay(Number(account.dueDay), model.today) : null;
    return html`<button type="button" class="card account-card ${account.archived ? 'is-archived' : ''}" data-account="${account.id}" style="text-align:left;font:inherit">
        <div class="row-between">
            <span class="row">${catChip({ icon: account.icon || 'wallet', tone: account.tone || 'blue' })}<span><b>${account.name}</b><br><span class="account-type">${ACCOUNT_TYPES[account.type]?.label || ''} · ${account.currency}</span></span></span>
            ${icon('dots', { size: 18, className: 'faint' })}
        </div>
        <div>
            <div class="account-balance">${credit ? money(-used, account.currency) : money(account.balance, account.currency, { tone: account.balance < 0 ? 'expense' : 'none' })}</div>
            ${account.currency !== model.fx.base ? html`<small class="faint">≈ ${money(account.balanceBase)}</small>` : ''}
        </div>
        ${credit && limit ? html`<div class="stack" style="gap:6px">${progressBar(usedPct, { tone: usedPct >= 100 ? 'over' : usedPct >= 80 ? 'warning' : 'accent', label: 'Uso del límite' })}
            <div class="row-between"><small class="faint">${pct(usedPct)} de ${money(limit, account.currency)}</small>${due ? html`<small class="faint">Pago ${formatDate(due, 'short')}</small>` : ''}</div></div>` : ''}
        ${!credit && account.lowBalanceAlertMinor && account.balance < account.lowBalanceAlertMinor ? html`<span class="pill is-warn">${icon('alert', { size: 12 })}Saldo bajo</span>` : ''}
    </button>`;
}
