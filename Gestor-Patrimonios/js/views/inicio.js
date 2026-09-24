/**
 * Inicio: el panorama en una pantalla.
 *
 * Orden pensado para el móvil (lo que más se mira, arriba): patrimonio neto,
 * cuánto se puede gastar hoy, los sueños, las alertas, los números del mes,
 * el flujo de caja, en qué se va el dinero, lo que viene y lo último.
 */
import { app } from '../context.js';
import { html, countUp } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money, pct, num, formatMoney } from '../ui/format.js';
import { rosette, waveBand } from '../ui/guilloche.js';
import { cashflowChart, sparkline, ring, hbars } from '../ui/charts.js';
import { txRow, catChip, progressBar, deltaPill, emptyState, goalIcon } from '../ui/parts.js';
import { inBase, roundNice } from '../core/money.js';
import { formatDate, monthLabel, relativeDays, addDays, weekday, APP_TIME_ZONE } from '../core/dates.js';
import { spendImpactDays } from '../core/goals.js';
import { postRecurring } from '../services.js';
import { toast } from '../ui/overlay.js';

function greeting() {
    const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: APP_TIME_ZONE }).format(new Date()));
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

/** Gasto variable típico de un fin de semana (últimas 8 semanas), para el «impacto real». */
function typicalWeekend(model) {
    const since = addDays(model.today, -56);
    const variable = new Set(model.expenseCats.filter(c => c.nature === 'want').map(c => c.id));
    let total = 0;
    for (const tx of model.txs) {
        if (tx.date < since) break;
        if (tx.type !== 'expense' || tx.adjustment || !variable.has(tx.categoryId)) continue;
        const day = weekday(tx.date);
        if (day === 0 || day === 6) total += inBase(tx.amountMinor, tx.currency, model.fx);
    }
    const perWeekend = total / 8;
    return perWeekend > 500000 ? roundNice(perWeekend * 0.8) : 2000000;
}

export default {
    title: () => `${greeting()}, ${(app.model().profile?.displayName || app.user?.displayName || '').split(' ')[0] || 'bienvenido'}`,
    eyebrow: model => formatDate(model.today, 'long'),

    render(model) {
        const { worth, worthSeries, totals, prevToDate, spendable, payday, budgetTotals } = model;
        const prevWorth = worthSeries.length > 1 ? worthSeries[worthSeries.length - 2].value : null;
        const worthDelta = prevWorth ? worth.net - prevWorth : 0;
        const activeGoals = model.goals.filter(g => !g.progress.done).slice(0, 3);
        const topGoal = activeGoals.find(g => g.pace > 0);
        const weekend = typicalWeekend(model);
        const weekendDays = topGoal ? spendImpactDays(weekend, inBase(topGoal.pace, topGoal.goal.currency, model.fx)) : null;
        const alerts = model.alerts.filter(a => a.severity !== 'success').slice(0, 3);
        const upcoming = [
            ...model.overdueRecurring.map(item => ({ ...item, overdue: true })),
            ...model.upcoming.filter(item => item.daysUntil <= 14)
        ].slice(0, 5);
        const budgetPct = budgetTotals.limit ? budgetTotals.spent / budgetTotals.limit * 100 : null;
        const pacePct = (1 - (model.daysLeft - 1) / model.period.days) * 100;
        const categories = model.byCategory.slice(0, 6).map(entry => {
            const category = model.catById.get(entry.categoryId);
            return { label: category?.name || 'Sin categoría', value: entry.total, sub: `${Math.round(entry.share)}%`, iconHtml: catChip(category, { size: 'sm' }), href: `#/movimientos?categoria=${entry.categoryId}` };
        });
        const gamified = model.settings.gamification !== false;

        return html`
            <section class="dash">
                <div class="dash-hero">
                    <article class="hero">
                        ${rosette({ seed: 'patrimonio-hero', size: 440, layers: 5, strokeWidth: 0.55 })}
                        ${waveBand({ seed: 'hero', width: 800, height: 220, lines: 18 })}
                        <p class="eyebrow">Patrimonio neto</p>
                        <p class="hero-value"><span class="amt" data-count="${worth.net}">${formatMoney(worth.net)}</span></p>
                        <div class="hero-meta">
                            ${prevWorth !== null ? html`<span class="delta ${worthDelta >= 0 ? 'is-up' : 'is-down'}">${icon(worthDelta >= 0 ? 'trending-up' : 'trending-down', { size: 13 })}${money(worthDelta, model.fx.base, { sign: true })} este mes</span>` : ''}
                            <span>Activos ${money(worth.assets)} · Pasivos ${money(worth.liabilities)}</span>
                        </div>
                        <div class="hero-split">
                            <div><small>Disponible</small><b>${money(model.liquid)}</b></div>
                            <div><small>Ahorro e inversión</small><b>${money(model.savingsBalance)}</b></div>
                            <div><small>Deudas</small><b>${money(worth.liabilities)}</b></div>
                        </div>
                        <div class="hero-spark">${sparkline(worthSeries.map(p => p.value), { width: 150, height: 44 })}</div>
                    </article>

                    <article class="card spend-card">
                        <div class="card-head">
                            <div><p class="eyebrow is-accent">Puede gastar hoy</p></div>
                            <button type="button" class="btn btn-sm btn-ghost" data-afford>${icon('scale', { size: 15 })}¿Me alcanza?</button>
                        </div>
                        <p class="spend-value">${money(Math.max(0, spendable.perDay))}</p>
                        <p class="muted spend-sub">${spendable.basis === 'budgets'
                            ? html`por día hasta fin de ${model.periodLabel}. Quedan ${money(spendable.remaining)} en sus presupuestos.`
                            : html`por día hasta fin de ${model.periodLabel}, según sus ingresos y pagos fijos.`}</p>
                        ${budgetPct !== null ? html`<div class="spend-bar">
                            <div class="row-between"><small class="faint">Presupuesto usado</small><small><b>${pct(budgetPct)}</b> <span class="faint">· día ${model.period.days - model.daysLeft + 1} de ${model.period.days}</span></small></div>
                            ${progressBar(budgetPct, { tone: budgetPct > 100 ? 'over' : budgetPct > pacePct + 8 ? 'warning' : 'ok', pace: pacePct, label: 'Presupuesto usado' })}
                        </div>` : html`<a class="link-btn" href="#/presupuestos">Cree presupuestos para afinar este número ${icon('arrow-right', { size: 14 })}</a>`}
                        ${payday.date ? html`<div class="spend-foot">${icon('calendar', { size: 16 })}<span>Próximo pago ${relativeDays(model.today, payday.date)} · ${formatDate(payday.date, 'short')}</span></div>` : ''}
                    </article>
                </div>

                <div class="grid grid-4 dash-kpis">
                    ${kpi('Ingresos', totals.income, 'arrow-down-left', 'is-ok', deltaPill(totals.income, prevToDate.income, { suffix: 'vs. mismo punto del mes pasado' }), model.series12.map(p => p.income))}
                    ${kpi('Gastos', totals.expense, 'arrow-up-right', 'is-danger', deltaPill(totals.expense, prevToDate.expense, { invert: true, suffix: 'vs. mismo punto del mes pasado' }), model.series12.map(p => p.expense))}
                    ${kpi('Ahorro del mes', totals.net, 'piggy-bank', 'is-gold', html`<span class="pill ${totals.savingsRate >= 20 ? 'is-ok' : totals.savingsRate > 0 ? 'is-accent' : 'is-danger'}">${pct(totals.savingsRate)} de sus ingresos</span>`, model.series12.map(p => p.net))}
                    ${kpi('Capacidad de ahorro', model.capacity, 'trending-up', '', html`<span>promedio de 3 meses</span>`, null)}
                </div>

                <div class="grid grid-main">
                    <article class="card">
                        <div class="card-head">
                            <div><h2>Flujo de caja</h2><p>Últimos 12 meses</p></div>
                            <div class="legend"><span><i class="s-income"></i>Ingresos</span><span><i class="s-expense"></i>Gastos</span><span><i class="is-line s-net"></i>Ahorro neto</span></div>
                        </div>
                        ${model.series12.some(p => p.count > 0)
                            ? html`<div class="chart" data-chart="cashflow"></div>`
                            : emptyState({ title: 'Su historia empieza hoy', body: 'Con los movimientos de este mes aparecerá aquí cómo entran y salen sus colones, mes a mes.', iconName: 'trending-up' })}
                    </article>
                    <article class="card">
                        <div class="card-head">
                            <div><h2>En qué se va</h2><p>${monthLabel(model.period.key, { long: true })}</p></div>
                            <a class="card-link" href="#/reportes">Reportes ${icon('chevron-right', { size: 14 })}</a>
                        </div>
                        ${categories.length ? hbars(categories, { tone: 'expense' }) : emptyState({ title: 'Sin gastos este mes', body: 'Cuando registre gastos verá aquí en qué categorías se va su dinero.', iconName: 'pie' })}
                    </article>
                </div>

                <div class="grid grid-main">
                    <article class="card dreams-card">
                        <div class="card-head">
                            <div><p class="eyebrow is-gold">Sus sueños</p><h2>¿Para qué está ahorrando?</h2></div>
                            <a class="card-link" href="#/metas">Todas ${icon('chevron-right', { size: 14 })}</a>
                        </div>
                        ${activeGoals.length ? html`<div class="dream-list">${activeGoals.map(entry => dreamRow(entry, model))}</div>
                            ${topGoal && weekendDays > 0 ? html`<div class="callout is-gold section-gap">${icon('sparkle')}<span>Si este fin de semana no gasta <b>${money(weekend)}</b>, alcanza <b>«${topGoal.goal.name}»</b> ${weekendDays} ${weekendDays === 1 ? 'día' : 'días'} antes.</span></div>` : ''}`
                            : emptyState({ title: 'Póngale nombre a su sueño', body: 'Casa, carro, viaje, negocio o finca. Le decimos cuánto falta y cuándo llega.', seed: 'dream', action: html`<button type="button" class="btn btn-gold" data-new-goal>${icon('plus', { size: 17 })}Crear mi primera meta</button>` })}
                    </article>
                    <div class="stack">
                        <article class="card">
                            <div class="card-head">
                                <div><h2>Alertas</h2></div>
                                ${model.alerts.length ? html`<button type="button" class="link-btn" data-open-alerts>Ver todas (${model.alerts.length})</button>` : ''}
                            </div>
                            ${alerts.length ? html`<div class="alert-list is-compact">${alerts.map(alert => html`
                                <a class="alert-item is-${alert.severity}" href="${alert.route || '#/inicio'}">
                                    <span class="alert-icon">${icon({ danger: 'alert-circle', warning: 'alert', info: 'info', success: 'sparkle' }[alert.severity], { size: 16 })}</span>
                                    <div class="alert-body"><h3>${alert.title}</h3><p>${alert.body}</p></div>
                                </a>`)}</div>`
                            : html`<div class="calm">${icon('shield-check', { size: 22 })}<span>Todo en orden. Nada se sale de lo previsto.</span></div>`}
                        </article>
                        <article class="card">
                            <div class="card-head"><div><h2>Lo que viene</h2><p>Pagos e ingresos fijos</p></div><a class="card-link" href="#/calendario">Calendario ${icon('chevron-right', { size: 14 })}</a></div>
                            ${upcoming.length ? html`<ul class="upcoming">${upcoming.map(item => html`
                                <li class="${item.overdue ? 'is-overdue' : ''}">
                                    ${catChip(model.catById.get(item.rule.categoryId) || { icon: 'repeat', tone: 'gray' }, { size: 'sm' })}
                                    <span class="upcoming-main"><b>${item.rule.name}</b><small>${item.overdue ? `Pendiente desde ${formatDate(item.date, 'short')}` : `${relativeDays(model.today, item.date)} · ${formatDate(item.date, 'short')}`}</small></span>
                                    <span class="upcoming-amount">${money(item.rule.type === 'expense' ? -item.rule.amountMinor : item.rule.amountMinor, item.rule.currency, { sign: item.rule.type === 'income', tone: item.rule.type === 'income' ? 'income' : 'none' })}
                                        ${item.overdue || item.daysUntil === 0 ? html`<button type="button" class="link-btn" data-post="${item.rule.id}" data-date="${item.date}">Registrar</button>` : ''}</span>
                                </li>`)}</ul>`
                            : html`<p class="muted">No hay pagos fijos en los próximos 14 días. <a href="#/calendario">Añada sus recurrentes</a> y le avisaremos antes de cada uno.</p>`}
                        </article>
                    </div>
                </div>

                <div class="grid grid-main">
                    <article class="card">
                        <div class="card-head"><div><h2>Últimos movimientos</h2></div><a class="card-link" href="#/movimientos">Ver todos ${icon('chevron-right', { size: 14 })}</a></div>
                        ${model.txs.length ? html`<div class="list">${model.txs.slice(0, 6).map(tx => txRow(tx, model, { showDate: true }))}</div>`
                            : emptyState({ title: 'Empiece por su primer gasto', body: 'Registrar lleva segundos: el monto, la categoría y listo.', action: html`<button type="button" class="btn btn-primary" data-new-tx>${icon('plus', { size: 17 })}Registrar movimiento</button>`, iconName: 'feather' })}
                    </article>
                    ${gamified ? levelCard(model) : html`<article class="card"><div class="card-head"><div><h2>Su mes en una frase</h2></div></div><p class="muted">${summarySentence(model)}</p></article>`}
                </div>
            </section>`;
    },

    mount(root, model) {
        const chart = root.querySelector('[data-chart="cashflow"]');
        if (chart) {
            cashflowChart(chart, {
                labels: model.series12.map(p => monthLabel(p.key, { year: false })),
                titles: model.series12.map(p => monthLabel(p.key, { long: true })),
                income: model.series12.map(p => p.income),
                expense: model.series12.map(p => p.expense),
                net: model.series12.map(p => p.net)
            });
        }
        const heroValue = root.querySelector('[data-count]');
        if (heroValue && !document.documentElement.classList.contains('is-private') && !root.dataset.counted) {
            root.dataset.counted = '1';
            countUp(heroValue, Number(heroValue.dataset.count), value => formatMoney(value));
        }
        const onClick = async event => {
            const tx = event.target.closest('[data-tx]');
            if (tx) return (await import('../sheets/transaction.js')).openTransactionDetail(tx.dataset.tx);
            if (event.target.closest('[data-afford]')) return (await import('../sheets/quick.js')).openAffordSheet();
            if (event.target.closest('[data-open-alerts]')) return (await import('../sheets/quick.js')).openAlertsSheet();
            if (event.target.closest('[data-new-goal]')) return (await import('../sheets/forms.js')).openGoalSheet();
            if (event.target.closest('[data-new-tx]')) return (await import('../sheets/transaction.js')).openTransactionSheet();
            const post = event.target.closest('[data-post]');
            if (post) {
                const rule = model.recurring.find(r => r.id === post.dataset.post);
                if (rule) {
                    post.disabled = true;
                    await postRecurring(rule, post.dataset.date);
                    toast(`${rule.name} registrado`, { tone: 'success' });
                }
            }
        };
        root.addEventListener('click', onClick);
        return () => root.removeEventListener('click', onClick);
    }
};

function kpi(label, value, iconName, tone, footer, series) {
    return html`<article class="card kpi">
        <div class="kpi-top"><span class="kpi-label">${label}</span><span class="kpi-icon ${tone}">${icon(iconName, { size: 17 })}</span></div>
        <div class="row-between" style="align-items:flex-end;margin-top:auto">
            <div class="kpi-value">${money(value)}</div>
            ${series ? sparkline(series, { width: 76, height: 28 }) : ''}
        </div>
        <div class="kpi-sub">${footer}</div>
    </article>`;
}

function dreamRow(entry, model) {
    const { goal, progress, health, eta } = entry;
    const tone = health.state === 'at-risk' || health.state === 'late' ? 'danger' : health.state === 'no-plan' ? 'gray' : 'gold';
    return html`<a class="dream" href="#/metas/${goal.id}">
        <span class="ring-wrap">${ring(progress.pct, { size: 64, stroke: 5, label: `${Math.round(progress.pct)}% de ${goal.name}` })}<span class="ring-center">${icon(goalIcon(goal), { size: 20 })}</span></span>
        <span class="dream-main">
            <b class="serif">${goal.name}</b>
            <small>${money(progress.saved, goal.currency)} de ${money(progress.target, goal.currency)}</small>
            <small class="${tone === 'danger' ? 'is-danger' : ''}">${eta.date ? html`Faltan ${money(progress.remaining, goal.currency)} · llega en ${monthLabel(eta.date.slice(0, 7), { long: true })}` : html`Faltan ${money(progress.remaining, goal.currency)} · defina un aporte`}</small>
        </span>
        <span class="dream-pct">${Math.round(progress.pct)}%</span>
    </a>`;
}

function levelCard(model) {
    const { game } = model;
    const next = game.badges.filter(b => !b.unlocked).sort((a, b) => b.progress - a.progress)[0];
    return html`<a class="card level-panel" href="#/logros">
        <div class="card-head"><div><p class="eyebrow is-gold">Su progreso</p><h2>Nivel ${game.level.name}</h2></div><span class="pill is-gold">${num(game.points)} pts</span></div>
        <p class="muted">${game.level.motto}</p>
        <div class="level-track">${progressBar(game.level.progress, { tone: 'gold', label: 'Progreso al siguiente nivel' })}<small class="faint">${game.level.next ? `${num(game.level.toNext)} pts para ${game.level.next.name}` : 'Nivel máximo'}</small></div>
        <div class="level-stats">
            <div>${icon('flame', { size: 18 })}<b>${game.stats.streak}</b><small>días de racha</small></div>
            <div>${icon('anchor', { size: 18 })}<b>${game.stats.impulseFreeCurrent}</b><small>días sin impulsos</small></div>
            <div>${icon('medal', { size: 18 })}<b>${game.badges.filter(b => b.unlocked).length}</b><small>insignias</small></div>
        </div>
        ${next ? html`<div class="next-badge"><small class="faint">Próxima insignia</small><b>${next.name}</b>${progressBar(next.progress * 100, { tone: 'gold', size: 'thin' })}</div>` : ''}
    </a>`;
}

function summarySentence(model) {
    const { totals } = model;
    if (!totals.count) return 'Aún no hay movimientos este mes.';
    const top = model.byCategory[0];
    const name = top ? model.catById.get(top.categoryId)?.name?.toLowerCase() : null;
    return `Lleva ${formatMoney(totals.expense)} gastados y ${formatMoney(totals.income)} de ingresos${name ? `; lo que más pesa es ${name}` : ''}.`;
}
