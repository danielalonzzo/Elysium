/**
 * Metas: «¿Para qué estás ahorrando?». La pantalla favorita de Jared.
 *
 * La mayoría de apps enseñan números; esta enseña sueños con cifras: una
 * portada (foto propia o guilloché), cuánto falta, cuándo se llega, qué
 * acelera la meta y cuánto la retrasa cada gasto.
 */
import { app } from '../context.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money, pct, formatMoney } from '../ui/format.js';
import { rosette } from '../ui/guilloche.js';
import { ring, areaChart } from '../ui/charts.js';
import { progressBar, emptyState, goalIcon, stateIcon } from '../ui/parts.js';
import { GOAL_KINDS, MILESTONES, accelerationScenarios, spendImpactDays } from '../core/goals.js';
import { inBase, convertMinor } from '../core/money.js';
import { formatDate, monthLabel, formatMonths, lastPeriods } from '../core/dates.js';
import { toast, confirmDialog, actionSheet } from '../ui/overlay.js';
import { uploadReceipt } from '../services.js';

const coverUrls = new Map();

function coverImage(goal) {
    if (!goal.cover?.path) return '';
    const url = coverUrls.get(goal.cover.path);
    return url ? html`<img src="${url}" alt="" loading="lazy">` : '';
}

async function loadCovers(root, goals) {
    for (const goal of goals) {
        if (!goal.cover?.path || coverUrls.has(goal.cover.path)) continue;
        try {
            const url = await app.store.fileUrl(goal.cover.path);
            if (!url) continue;
            coverUrls.set(goal.cover.path, url);
            root.querySelectorAll(`[data-cover="${goal.id}"]`).forEach(el => {
                if (!el.querySelector('img')) el.insertAdjacentHTML('afterbegin', `<img src="${url}" alt="" loading="lazy">`);
            });
        } catch { /* sin portada: queda el guilloché */ }
    }
}

export default {
    title(model, route) {
        if (route.id) return model.goals.find(g => g.goal.id === route.id)?.goal.name || 'Meta';
        return 'Metas';
    },
    eyebrow(model, route) {
        if (route.id) {
            const entry = model.goals.find(g => g.goal.id === route.id);
            return entry ? GOAL_KINDS[entry.goal.kind]?.label || 'Meta' : '';
        }
        return '¿Para qué está ahorrando?';
    },
    back: (model, route) => Boolean(route.id),
    actions: (model, route) => route.id ? '' : html`<button type="button" class="btn btn-gold hide-mobile" data-new-goal>${icon('plus', { size: 17 })}Nueva meta</button>`,

    render(model, route) {
        if (route.id) return detail(model, route.id);
        const active = model.goals.filter(g => !g.progress.done && g.goal.status !== 'done');
        const done = model.goals.filter(g => g.progress.done || g.goal.status === 'done');
        const overCommitted = model.goalsMonthly > model.capacity && model.capacity > 0;

        if (!model.goals.length) {
            return html`<article class="card">
                <div class="empty">${rosette({ seed: 'suenos', size: 180, layers: 4 })}
                    <h3 class="serif" style="font-size:1.6rem">La mayoría de apps solo muestran números.</h3>
                    <p>Aquí empieza por lo que importa: ¿para qué está ahorrando?</p>
                </div>
                <div class="kind-picker">${Object.entries(GOAL_KINDS).map(([kind, info]) => html`
                    <button type="button" class="kind-option" data-kind="${kind}"><span class="cat-chip tone-gold">${icon(info.icon, { size: 24 })}</span>${info.label}</button>`)}
                </div>
            </article>`;
        }

        return html`
            <div class="grid grid-3">
                <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Ahorrado en metas</span><span class="kpi-icon is-gold">${icon('coins', { size: 17 })}</span></div><div class="kpi-value">${money(model.goalsSavedBase)}</div><div class="kpi-sub">${active.length} ${active.length === 1 ? 'meta activa' : 'metas activas'}${done.length ? ` · ${done.length} cumplida${done.length === 1 ? '' : 's'}` : ''}</div></article>
                <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Aporte mensual</span><span class="kpi-icon">${icon('repeat', { size: 17 })}</span></div><div class="kpi-value">${money(model.goalsMonthly)}</div><div class="kpi-sub">lo que sus metas necesitan al mes</div></article>
                <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Su capacidad de ahorro</span><span class="kpi-icon ${overCommitted ? 'is-warn' : 'is-ok'}">${icon('trending-up', { size: 17 })}</span></div><div class="kpi-value">${money(model.capacity)}</div><div class="kpi-sub">${overCommitted ? html`<span class="pill is-warn">Sus metas piden ${money(model.goalsMonthly - model.capacity)} más de lo que ahorra</span>` : 'promedio de los últimos 3 meses'}</div></article>
            </div>

            <div class="section-title"><h2>Sus sueños</h2><button type="button" class="link-btn only-mobile" data-new-goal>${icon('plus', { size: 15 })} Nueva</button></div>
            <div class="goals-grid">
                ${active.map(entry => goalCard(entry, model))}
                <button type="button" class="card goal-add" data-new-goal><span>${icon('plus', { size: 28 })}Nuevo sueño<br><small class="faint">Casa, carro, viaje, negocio, finca…</small></span></button>
            </div>
            ${done.length ? html`<div class="section-title"><h2>Cumplidas</h2></div><div class="goals-grid">${done.map(entry => goalCard(entry, model))}</div>` : ''}`;
    },

    mount(root, model, route) {
        loadCovers(root, model.goals.map(g => g.goal));
        const entry = route.id ? model.goals.find(g => g.goal.id === route.id) : null;
        if (entry) {
            const chart = root.querySelector('[data-chart="goal"]');
            if (chart) {
                const series = savedSeries(entry, model);
                areaChart(chart, { labels: series.map(p => monthLabel(p.key, { year: false })), titles: series.map(p => monthLabel(p.key, { long: true })), values: series.map(p => p.value), currency: entry.goal.currency, name: 'Ahorrado', tone: 's-gold' });
            }
        }
        const onClick = async event => {
            const forms = await import('../sheets/forms.js');
            if (event.target.closest('[data-new-goal]')) return forms.openGoalSheet();
            const kind = event.target.closest('[data-kind]');
            if (kind) return forms.openGoalSheet({ kind: kind.dataset.kind });
            if (!entry) return;
            if (event.target.closest('[data-contribute]')) return forms.openContributionSheet({ goalId: entry.goal.id });
            if (event.target.closest('[data-withdraw]')) return forms.openContributionSheet({ goalId: entry.goal.id, withdraw: true });
            if (event.target.closest('[data-edit-goal]')) return forms.openGoalSheet({ goal: entry.goal });
            if (event.target.closest('[data-goal-menu]')) return goalMenu(entry);
            if (event.target.closest('[data-cover-pick]')) return root.querySelector('[data-cover-input]')?.click();
            const scenario = event.target.closest('[data-apply-monthly]');
            if (scenario) {
                await app.store.patch('goals', entry.goal.id, { monthlyPlanMinor: Number(scenario.dataset.applyMonthly) });
                toast(`Nuevo aporte mensual: ${formatMoney(Number(scenario.dataset.applyMonthly), entry.goal.currency)}`, { tone: 'gold', iconName: 'target' });
                return;
            }
            const removeContribution = event.target.closest('[data-remove-contribution]');
            if (removeContribution) {
                const ok = await confirmDialog({ title: '¿Eliminar este aporte?', confirmLabel: 'Eliminar', danger: true });
                if (ok) await app.store.remove('contributions', removeContribution.dataset.removeContribution);
            }
        };
        const onChange = async event => {
            const input = event.target.closest('[data-cover-input]');
            if (!input || !input.files?.[0] || !entry) return;
            const file = input.files[0];
            if (!/^image\//.test(file.type)) return toast('Elija una imagen.', { tone: 'error' });
            try {
                toast('Subiendo portada…');
                const meta = await uploadReceipt(file, `goal-${entry.goal.id}`);
                if (entry.goal.cover?.path) app.store.removeFile(entry.goal.cover.path);
                await app.store.patch('goals', entry.goal.id, { cover: { path: meta.path, type: meta.type } });
                coverUrls.delete(meta.path);
                toast('Portada actualizada', { tone: 'success' });
            } catch (error) {
                toast(error.message || 'No se pudo subir la imagen.', { tone: 'error' });
            }
        };
        root.addEventListener('click', onClick);
        root.addEventListener('change', onChange);
        return () => {
            root.removeEventListener('click', onClick);
            root.removeEventListener('change', onChange);
        };
    }
};

function goalCard(entry, model) {
    const { goal, progress, health, eta } = entry;
    const done = progress.done || goal.status === 'done';
    return html`<a class="card goal-card ${done ? 'is-done' : ''}" href="#/metas/${goal.id}">
        <div class="goal-cover" data-cover="${goal.id}">
            ${coverImage(goal)}
            ${rosette({ seed: goal.id, size: 300, layers: 3 })}
            <span class="goal-kind">${icon(goalIcon(goal), { size: 13 })}${GOAL_KINDS[goal.kind]?.label || 'Meta'}</span>
            <span class="goal-pct">${Math.round(progress.pct)}%</span>
        </div>
        <div class="goal-body">
            <h3>${goal.name}</h3>
            <div class="goal-numbers"><span><b>${money(progress.saved, goal.currency)}</b> de ${money(progress.target, goal.currency)}</span></div>
            ${progressBar(progress.pct, { tone: 'gold', label: `Progreso de ${goal.name}` })}
            <div class="goal-foot">
                <span>${done ? html`Cumplida ${goal.completedAt ? formatDate(goal.completedAt, 'medium') : ''}` : eta.date ? html`Llega en ${monthLabel(eta.date.slice(0, 7), { long: true })}` : 'Defina un aporte mensual'}</span>
                <span class="pill is-${health.state}">${icon(stateIcon(health.state), { size: 12 })}${health.label}</span>
            </div>
        </div>
    </a>`;
}

function detail(model, id) {
    const entry = model.goals.find(g => g.goal.id === id);
    if (!entry) return emptyState({ title: 'Esa meta ya no existe', body: 'Puede que la haya eliminado.', action: html`<a class="btn btn-ghost" href="#/metas">Volver a metas</a>`, iconName: 'target' });
    const { goal, progress, health, eta, planned, actual, required } = entry;
    const currency = goal.currency || model.fx.base;
    const pace = entry.pace;
    const done = progress.done || goal.status === 'done';

    // Escenarios para acelerar.
    const wantCats = new Set(model.expenseCats.filter(c => c.nature === 'want').map(c => c.id));
    const topWant = [...model.avgByCategory.entries()].filter(([idCat]) => wantCats.has(idCat)).sort((a, b) => b[1] - a[1])[0];
    const aguinaldoTx = model.txs.find(tx => tx.categoryId === 'aguinaldo');
    const aguinaldo = aguinaldoTx ? inBase(aguinaldoTx.amountMinor, aguinaldoTx.currency, model.fx) : model.avgIncome;
    const toGoal = value => convertMinor(value, model.fx.base, currency, model.fx);
    const scenarios = done ? [] : accelerationScenarios({
        remaining: progress.remaining,
        monthly: pace,
        today: model.today,
        currency,
        topCategory: topWant ? { name: model.catById.get(topWant[0])?.name?.toLowerCase() || 'deseos', averageMinor: toGoal(topWant[1]) } : null,
        aguinaldoMinor: toGoal(aguinaldo)
    }).slice(0, 4);

    // Impacto real de gastar.
    const impacts = [1000000, 2000000, 5000000, 10000000].map(amount => ({ amount, days: spendImpactDays(toGoal(amount), pace) }));

    return html`
        <section class="goal-hero" data-cover="${goal.id}">
            ${coverImage(goal)}
            ${rosette({ seed: goal.id, size: 520, layers: 5 })}
            <div class="goal-hero-actions">
                <button type="button" class="icon-btn" data-cover-pick aria-label="Cambiar portada" title="Cambiar portada">${icon('camera', { size: 18 })}</button>
                <button type="button" class="icon-btn" data-goal-menu aria-label="Más opciones">${icon('dots', { size: 18 })}</button>
                <input type="file" accept="image/*" data-cover-input hidden>
            </div>
            <span class="ring-wrap">${ring(progress.pct, { size: 96, stroke: 7, label: `${Math.round(progress.pct)}%` })}<span class="ring-center">${Math.round(progress.pct)}%</span></span>
            <span class="goal-kind" style="align-self:flex-start">${icon(goalIcon(goal), { size: 13 })}${GOAL_KINDS[goal.kind]?.label || 'Meta'}</span>
            <h2>${goal.name}</h2>
            ${goal.note ? html`<p>${goal.note}</p>` : ''}
            <div class="hero-numbers">
                <div><small>Ahorrado</small><b>${money(progress.saved, currency)}</b></div>
                <div><small>Falta</small><b>${money(progress.remaining, currency)}</b></div>
                <div><small>${done ? 'Cumplida' : 'Llega en'}</small><b>${done ? formatDate(goal.completedAt || model.today, 'medium') : eta.date ? `${monthLabel(eta.date.slice(0, 7), { long: true })}` : '—'}</b></div>
                ${goal.deadline ? html`<div><small>Fecha deseada</small><b>${formatDate(goal.deadline, 'medium')}</b></div>` : ''}
            </div>
        </section>

        <div class="row wrap section-gap">
            ${done ? '' : html`<button type="button" class="btn btn-gold" data-contribute>${icon('plus', { size: 17 })}Aportar</button>`}
            <button type="button" class="btn btn-ghost" data-withdraw>${icon('arrow-up-right', { size: 17 })}Retirar</button>
            <button type="button" class="btn btn-ghost" data-edit-goal>${icon('edit', { size: 16 })}Editar</button>
            <span class="pill is-${health.state}" style="margin-left:auto">${icon(stateIcon(health.state), { size: 13 })}${health.label}${health.state === 'at-risk' && health.lateDays ? ` · ${health.lateDays} días tarde` : ''}</span>
        </div>

        <article class="card section-gap">
            ${progressBar(progress.pct, { tone: 'gold', size: 'thick', label: 'Progreso' })}
            <div class="milestones">${[0, ...MILESTONES].map(m => html`<span class="${progress.pct >= m && m > 0 ? 'is-reached' : ''}">${m}%</span>`)}</div>
        </article>

        <div class="grid grid-main section-gap">
            <article class="card">
                <div class="card-head"><div><h2>Cómo acelerar la meta</h2><p>Escenarios calculados con sus números reales</p></div></div>
                ${done ? html`<div class="callout is-gold">${icon('trophy')}<span>Esta meta ya está cumplida. Disfrútela.</span></div>`
                : scenarios.length ? scenarios.map(s => html`<div class="scenario">
                        <span class="cat-chip is-sm tone-gold">${icon({ extra: 'plus', recorte: 'scale', aguinaldo: 'gift', veinte: 'trending-up' }[s.id] || 'sparkle', { size: 16 })}</span>
                        <div><b>${s.label}</b><small>${s.detail} · llegaría en ${monthLabel(s.eta.date.slice(0, 7), { long: true })}</small></div>
                        <div class="gain">${s.daysSaved === null ? 'Hace posible la meta' : `${formatMonths(s.daysSaved / 30.4375)} antes`}${s.newMonthly !== pace && s.id !== 'aguinaldo' ? html`<br><button type="button" class="link-btn" data-apply-monthly="${s.newMonthly}" style="font-size:.74rem">Usar este aporte</button>` : ''}</div>
                    </div>`)
                : html`<p class="muted">Defina un aporte mensual para ver cómo acelerarla.</p>`}
            </article>
            <article class="card">
                <div class="card-head"><div><h2>Su ritmo</h2><p>Plan frente a realidad</p></div></div>
                <dl class="detail-list">
                    <div><dt>Aporte planeado</dt><dd>${money(planned, currency)}/mes</dd></div>
                    <div><dt>Aporte real (3 meses)</dt><dd>${money(actual, currency)}/mes</dd></div>
                    ${goal.deadline ? html`<div><dt>Necesario para ${formatDate(goal.deadline, 'short')}</dt><dd>${required !== null ? html`${money(required, currency)}/mes` : '—'}</dd></div>` : ''}
                    <div><dt>Tiempo restante</dt><dd>${done ? '—' : eta.date ? `${formatMonths(eta.months)} · ${formatDate(eta.date, 'medium')}` : 'Sin aporte'}</dd></div>
                </dl>
                ${!done && pace > 0 ? html`<div class="section-gap">
                    <p class="eyebrow is-gold" style="margin-bottom:8px">Impacto real de gastar</p>
                    <table class="table"><tbody>${impacts.map(item => html`<tr><td>Si no gasta ${money(item.amount)}</td><td class="is-num">llega <b>${item.days} ${item.days === 1 ? 'día' : 'días'}</b> antes</td></tr>`)}</tbody></table>
                </div>` : ''}
            </article>
        </div>

        <div class="grid grid-main section-gap">
            <article class="card">
                <div class="card-head"><div><h2>Evolución</h2><p>Ahorrado al cierre de cada mes</p></div></div>
                <div class="chart" data-chart="goal"></div>
            </article>
            <article class="card">
                <div class="card-head"><div><h2>Aportes</h2><p>${entry.contributions.length} movimientos</p></div>${done ? '' : html`<button type="button" class="link-btn" data-contribute>Aportar</button>`}</div>
                ${entry.contributions.length ? html`<div class="contrib-list">${entry.contributions.slice(0, 24).map(c => html`<div>
                    <span>${c.note || (c.amountMinor < 0 ? 'Retiro' : 'Aporte')}<small>${formatDate(c.date, 'medium')}</small></span>
                    <span class="row" style="gap:6px">${money(c.amountMinor, currency, { sign: true, tone: c.amountMinor < 0 ? 'expense' : 'none' })}<button type="button" class="icon-btn is-sm is-plain" data-remove-contribution="${c.id}" aria-label="Eliminar aporte">${icon('x', { size: 14 })}</button></span>
                </div>`)}</div>` : html`<p class="muted">Aún no hay aportes. El primero es el más importante.</p>`}
            </article>
        </div>`;
}

function savedSeries(entry, model) {
    const periods = lastPeriods(model.today, 12, 1);
    const sorted = [...entry.contributions].sort((a, b) => (a.date < b.date ? -1 : 1));
    return periods.map(period => ({
        key: period.key,
        value: Math.max(0, sorted.filter(c => c.date <= period.end).reduce((sum, c) => sum + c.amountMinor, 0))
    }));
}

async function goalMenu(entry) {
    const { goal, progress } = entry;
    const done = progress.done || goal.status === 'done';
    const forms = await import('../sheets/forms.js');
    actionSheet({
        title: goal.name,
        actions: [
            { label: 'Cambiar portada', icon: 'camera', onClick: () => document.querySelector('[data-cover-input]')?.click() },
            ...(goal.cover?.path ? [{ label: 'Quitar portada', icon: 'image', onClick: async () => { app.store.removeFile(goal.cover.path); await app.store.patch('goals', goal.id, { cover: null }); } }] : []),
            done
                ? { label: 'Reabrir meta', icon: 'rotate-ccw', onClick: () => app.store.patch('goals', goal.id, { status: 'active', completedAt: null }) }
                : { label: 'Marcar como cumplida', icon: 'trophy', onClick: async () => { await app.store.patch('goals', goal.id, { status: 'done', completedAt: app.model().today }); document.dispatchEvent(new CustomEvent('patrimonio:celebrate')); toast(`¡«${goal.name}» cumplida!`, { tone: 'gold', iconName: 'trophy' }); } },
            { label: 'Archivar', icon: 'archive', hint: 'Se oculta sin borrar sus aportes', onClick: async () => { await app.store.patch('goals', goal.id, { status: 'archived' }); app.go('#/metas'); } },
            { label: 'Editar', icon: 'edit', onClick: () => forms.openGoalSheet({ goal }) }
        ]
    });
}
