/**
 * Hojas rápidas: «¿Me alcanza?», el centro de alertas, la paleta de comandos
 * (⌘K) y el menú «Más» del móvil.
 */
import { app } from '../context.js';
import { html, haptic } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money, formatMoney, fieldAmount, currencySymbol, nextCurrency } from '../ui/format.js';
import { openSheet, toast } from '../ui/overlay.js';
import { txTitle } from '../ui/parts.js';
import { quickAffordability } from '../core/loans.js';
import { parseAmount, inBase, currencyInfo } from '../core/money.js';
import { formatDate, addDays } from '../core/dates.js';
import { searchKey } from '../core/text.js';
import { updateAlertState } from '../services.js';
import { NAV_ITEMS } from '../nav.js';
import { isPrivate } from '../ui/theme.js';

/* ── ¿Me alcanza? ─────────────────────────────────────────────────────────── */

export function openAffordSheet({ price = null } = {}) {
    const model = app.model();
    return openSheet({
        title: '¿Me alcanza?',
        subtitle: 'Respuesta en un segundo, sin hacer cuentas',
        size: 'sm',
        className: 'afford-sheet',
        content: html`
            <div class="amount-input">
                <button type="button" class="currency-toggle" aria-label="Moneda: ${currencyInfo(model.fx.base).name}. Cambiar" title="Cambiar moneda">${currencySymbol(model.fx.base)}</button>
                <input name="price" inputmode="decimal" placeholder="Precio" aria-label="Precio" autofocus value="${price ? fieldAmount(price, model.fx.base) : ''}">
            </div>
            <div class="field">
                <span>¿De qué categoría? <small>opcional, para mirar su presupuesto</small></span>
                <div class="chips is-scroll">${model.budgets.slice(0, 10).map(b => html`<button type="button" class="chip" data-afford-cat="${b.budget.categoryId}" aria-pressed="false">${b.category.name}</button>`)}</div>
            </div>
            <div class="afford-result" data-result aria-live="polite"></div>
            <p class="field-hint afford-basis">Se compara con lo que le queda este período, con su ahorro libre (sin tocar el fondo de emergencia) y con lo que ahorra al mes.</p>`,
        onMount(body) {
            let currency = model.fx.base;
            let categoryId = null;
            const input = body.querySelector('[name="price"]');
            const result = body.querySelector('[data-result]');
            const toggle = body.querySelector('.currency-toggle');
            const evaluate = () => {
                const value = parseAmount(input.value);
                if (!value || value <= 0) { result.innerHTML = ''; return; }
                const amount = inBase(Math.abs(value), currency, model.fx);
                const budget = categoryId ? model.budgets.find(b => b.budget.categoryId === categoryId) : null;
                const emergencySaved = model.emergency.entry ? model.emergency.entry.savedBase : 0;
                const freeSavings = Math.max(0, model.savingsBalance - emergencySaved);
                const goal = model.goals.find(g => !g.progress.done && g.pace > 0);
                const answer = quickAffordability({
                    price: amount,
                    periodAvailable: model.spendable.remaining,
                    categoryRemaining: budget ? budget.status.remaining : null,
                    freeSavings,
                    monthlyCapacity: model.capacity,
                    goalMonthly: goal ? inBase(goal.pace, goal.goal.currency, model.fx) : 0,
                    today: model.today
                });
                const tone = { yes: 'ok', caution: 'warn', wait: 'accent', no: 'danger' }[answer.level];
                const iconName = { yes: 'check-circle', caution: 'alert', wait: 'hourglass', no: 'alert-circle' }[answer.level];
                result.innerHTML = String(html`<div class="afford-card is-${tone}">
                    <span class="afford-icon">${icon(iconName, { size: 26 })}</span>
                    <div>
                        <h3>${answer.title}</h3>
                        <p>${answer.detail}</p>
                        ${answer.leftover !== undefined ? html`<p class="afford-extra">Le quedarían <b>${money(answer.leftover)}</b>${answer.level === 'yes' ? ' para el resto del período' : ' de ahorro libre'}.</p>` : ''}
                        ${answer.date ? html`<p class="afford-extra">Fecha estimada: <b>${formatDate(answer.date, 'medium')}</b>.</p>` : ''}
                        ${budget && answer.level === 'yes' ? html`<p class="afford-extra">Presupuesto de ${budget.category.name.toLowerCase()}: quedarían ${money(budget.status.remaining - amount)}.</p>` : ''}
                    </div>
                </div>
                ${answer.level !== 'yes' ? html`<div class="row wrap" style="margin-top:12px">
                    <button type="button" class="btn btn-sm btn-ghost" data-simulate>${icon('calculator', { size: 15 })}Simular a crédito o con prima</button>
                    <button type="button" class="btn btn-sm btn-ghost" data-make-goal>${icon('target', { size: 15 })}Convertir en meta</button>
                </div>` : ''}`);
                result.querySelector('[data-simulate]')?.addEventListener('click', () => app.go(`#/simulador?precio=${amount}&t=${Date.now()}`));
                result.querySelector('[data-make-goal]')?.addEventListener('click', async () => {
                    const { openGoalSheet } = await import('./forms.js');
                    await app.go('#/metas');
                    openGoalSheet({ kind: 'otro', preset: { targetMinor: Math.abs(value), currency } });
                });
                haptic(6);
            };
            input.addEventListener('input', evaluate);
            toggle.addEventListener('click', () => {
                currency = nextCurrency(currency);
                toggle.textContent = currencySymbol(currency);
                toggle.setAttribute('aria-label', `Moneda: ${currencyInfo(currency).name}. Cambiar`);
                evaluate();
            });
            body.querySelectorAll('[data-afford-cat]').forEach(chip => chip.addEventListener('click', () => {
                categoryId = categoryId === chip.dataset.affordCat ? null : chip.dataset.affordCat;
                body.querySelectorAll('[data-afford-cat]').forEach(other => other.setAttribute('aria-pressed', String(other.dataset.affordCat === categoryId)));
                evaluate();
            }));
            evaluate();
        }
    });
}

/* ── Alertas ──────────────────────────────────────────────────────────────── */

export function openAlertsSheet() {
    const render = () => {
        const model = app.model();
        if (!model.alerts.length) {
            return html`<div class="empty">${icon('check-circle', { size: 40, className: 'ok-icon' })}<h3>Todo en orden</h3><p>No hay alertas activas. Le avisaremos si un presupuesto se acerca al límite, si viene un pago o si una meta se retrasa.</p></div>`;
        }
        return html`<div class="alert-list">${model.alerts.map(alert => html`
            <article class="alert-item is-${alert.severity}">
                <span class="alert-icon">${icon({ danger: 'alert-circle', warning: 'alert', info: 'info', success: 'sparkle' }[alert.severity], { size: 18 })}</span>
                <div class="alert-body">
                    <h3>${alert.title}</h3>
                    <p>${alert.body}</p>
                    <div class="alert-actions">
                        ${alert.route ? html`<button type="button" class="link-btn" data-alert-go="${alert.route}">Ver</button>` : ''}
                        <button type="button" class="link-btn is-muted" data-alert-snooze="${alert.id}">Recordar en 3 días</button>
                        <button type="button" class="link-btn is-muted" data-alert-dismiss="${alert.id}">Descartar</button>
                    </div>
                </div>
            </article>`)}</div>`;
    };
    return openSheet({
        title: 'Alertas',
        subtitle: 'Lo que merece su atención',
        size: 'md',
        content: render(),
        onMount(body) {
            const refresh = () => { body.innerHTML = String(render()); };
            const onChange = () => refresh();
            app.store.addEventListener('change', onChange);
            body.addEventListener('click', async event => {
                const go = event.target.closest('[data-alert-go]');
                const snooze = event.target.closest('[data-alert-snooze]');
                const dismiss = event.target.closest('[data-alert-dismiss]');
                if (go) app.go(go.dataset.alertGo);
                if (snooze) {
                    await updateAlertState(snooze.dataset.alertSnooze, { snoozeUntil: addDays(app.model().today, 3) });
                    toast('Se lo recordaremos en 3 días');
                }
                if (dismiss) await updateAlertState(dismiss.dataset.alertDismiss, { dismissed: true, at: app.model().today });
            });
            return () => app.store.removeEventListener('change', onChange);
        }
    });
}

/* ── Paleta de comandos ───────────────────────────────────────────────────── */

export function openPalette() {
    const model = app.model();
    const actions = [
        { label: 'Nuevo gasto', icon: 'arrow-up-right', hint: 'N', run: () => import('./transaction.js').then(m => m.openTransactionSheet({ type: 'expense' })) },
        { label: 'Nuevo ingreso', icon: 'arrow-down-left', run: () => import('./transaction.js').then(m => m.openTransactionSheet({ type: 'income' })) },
        { label: 'Nueva transferencia', icon: 'transfer', run: () => import('./transaction.js').then(m => m.openTransactionSheet({ type: 'transfer' })) },
        { label: '¿Me alcanza?', icon: 'scale', hint: 'A', run: () => openAffordSheet() },
        { label: 'Nueva meta', icon: 'target', run: () => import('./forms.js').then(m => m.openGoalSheet()) },
        { label: 'Ver alertas', icon: 'bell', run: () => openAlertsSheet() },
        { label: isPrivate() ? 'Mostrar montos' : 'Ocultar montos (modo discreto)', icon: 'eye-off', hint: 'D', run: () => document.dispatchEvent(new CustomEvent('patrimonio:toggle-private')) }
    ];
    // El texto buscable de cada movimiento se prepara una vez, no en cada tecla.
    const searchable = model.txs.map(tx => ({
        tx,
        text: searchKey(`${tx.merchant || ''} ${model.catById.get(tx.categoryId)?.name || ''} ${tx.note || ''} ${(tx.tags || []).join(' ')} ${formatMoney(tx.amountMinor, tx.currency, { symbol: false })}`)
    }));
    const pages = NAV_ITEMS.map(item => ({ label: item.label, icon: item.icon, run: () => app.go(`#/${item.id}`) }));

    return openSheet({
        title: 'Buscar',
        size: 'md',
        className: 'palette-sheet',
        content: html`<div class="palette-input">${icon('search')}<input type="search" placeholder="Movimientos, metas, páginas, acciones…" autofocus aria-label="Buscar"><kbd>esc</kbd></div><div class="palette-results" role="listbox"></div>`,
        onMount(body, api) {
            const input = body.querySelector('input');
            const results = body.querySelector('.palette-results');
            let items = [];
            let selected = 0;
            const draw = () => {
                const query = searchKey(input.value);
                const match = text => !query || searchKey(text).includes(query);
                const groups = [];
                const actionHits = actions.filter(a => match(a.label));
                const pageHits = pages.filter(p => match(p.label));
                const goalHits = model.goals.filter(g => match(g.goal.name)).slice(0, 4).map(g => ({ label: g.goal.name, icon: 'target', meta: `${Math.round(g.progress.pct)}%`, run: () => app.go(`#/metas/${g.goal.id}`) }));
                const txHits = query ? searchable.filter(entry => entry.text.includes(query)).slice(0, 8).map(({ tx }) => ({
                    label: txTitle(tx, model), icon: 'list', meta: `${formatDate(tx.date, 'short')} · ${formatMoney(tx.type === 'expense' ? -tx.amountMinor : tx.amountMinor, tx.currency)}`,
                    run: () => import('./transaction.js').then(m => m.openTransactionDetail(tx.id))
                })) : [];
                if (actionHits.length) groups.push(['Acciones', actionHits]);
                if (goalHits.length) groups.push(['Metas', goalHits]);
                if (txHits.length) groups.push(['Movimientos', txHits]);
                if (pageHits.length) groups.push(['Ir a', pageHits]);
                items = groups.flatMap(([, list]) => list);
                selected = Math.min(selected, Math.max(0, items.length - 1));
                let index = -1;
                results.innerHTML = groups.length ? String(html`${groups.map(([title, list]) => html`<div class="palette-group">${title}</div>${list.map(item => {
                    index += 1;
                    return html`<button type="button" class="palette-item" role="option" data-index="${index}" aria-selected="${index === selected}">${icon(item.icon, { size: 18 })}<span>${item.label}</span>${item.meta ? html`<span class="muted amt">${item.meta}</span>` : item.hint ? html`<kbd class="muted">${item.hint}</kbd>` : ''}</button>`;
                })}`)}`) : String(html`<p class="muted" style="padding:16px">Sin resultados.</p>`);
            };
            const run = async index => {
                const item = items[index];
                if (!item) return;
                await api.close();
                item.run();
            };
            input.addEventListener('input', () => { selected = 0; draw(); });
            input.addEventListener('keydown', event => {
                if (event.key === 'ArrowDown') { selected = Math.min(items.length - 1, selected + 1); draw(); event.preventDefault(); }
                if (event.key === 'ArrowUp') { selected = Math.max(0, selected - 1); draw(); event.preventDefault(); }
                if (event.key === 'Enter') { event.preventDefault(); run(selected); }
            });
            results.addEventListener('click', event => {
                const button = event.target.closest('[data-index]');
                if (button) run(Number(button.dataset.index));
            });
            draw();
        }
    });
}

/* ── «Más» en el móvil ────────────────────────────────────────────────────── */

export function openMoreSheet() {
    const model = app.model();
    const extra = NAV_ITEMS.filter(item => !['inicio', 'movimientos', 'metas'].includes(item.id));
    return openSheet({
        title: 'Más',
        size: 'md',
        content: html`
            <div class="more-grid">${extra.map(item => html`<a class="more-item" href="#/${item.id}">
                <span class="cat-chip tone-${item.tone || 'blue'}">${icon(item.icon)}</span><span>${item.label}</span>
                ${item.id === 'logros' && model.settings.gamification !== false ? html`<small>${model.game.level.name}</small>` : ''}
            </a>`)}</div>
            <div class="stack section-gap">
                <button type="button" class="action-item" data-afford><span class="action-icon">${icon('scale')}</span><span class="action-label">¿Me alcanza?<small>La respuesta rápida en la tienda</small></span>${icon('chevron-right', { size: 16, className: 'action-chevron' })}</button>
                <button type="button" class="action-item" data-search><span class="action-icon">${icon('search')}</span><span class="action-label">Buscar<small>Movimientos, metas y páginas</small></span>${icon('chevron-right', { size: 16, className: 'action-chevron' })}</button>
            </div>`,
        onMount(body, api) {
            body.addEventListener('click', async event => {
                if (event.target.closest('.more-item')) {
                    event.preventDefault();
                    const href = event.target.closest('.more-item').getAttribute('href');
                    await api.close();
                    app.go(href);
                }
                if (event.target.closest('[data-afford]')) { await api.close(); openAffordSheet(); }
                if (event.target.closest('[data-search]')) { await api.close(); openPalette(); }
            });
        }
    });
}
