/**
 * Logros: nivel (monedas griegas), puntos, rachas, insignias y retos.
 * Para quien le motiva competir consigo mismo; se puede ocultar en Ajustes.
 */
import { app } from '../context.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { num } from '../ui/format.js';
import { rosette, medallion } from '../ui/guilloche.js';
import { progressBar } from '../ui/parts.js';
import { LEVELS, CHALLENGES, TIER_LABELS, POINTS } from '../core/gamification.js';
import { formatDate } from '../core/dates.js';
import { toast, confirmDialog } from '../ui/overlay.js';

export default {
    title: 'Logros',
    eyebrow: model => `${num(model.game.points)} puntos`,

    render(model) {
        if (model.settings.gamification === false) {
            return html`<article class="card empty">${rosette({ seed: 'logros-off', size: 150, layers: 3 })}<h3>Los logros están ocultos</h3><p>Puntos, niveles e insignias para hacer del ahorro un juego con usted mismo.</p><button type="button" class="btn btn-gold" data-enable>Activarlos</button></article>`;
        }
        const { game } = model;
        const { level, stats } = game;
        const unlocked = game.badges.filter(b => b.unlocked);
        const locked = game.badges.filter(b => !b.unlocked).sort((a, b) => b.progress - a.progress);
        const accepted = new Set((model.profile.challenges || []).map(c => c.id));
        const available = CHALLENGES.filter(c => !accepted.has(c.id));
        const celebrated = model.profile.celebrated || {};

        return html`
            <section class="level-hero">
                ${rosette({ seed: 'nivel-' + level.id, size: 520, layers: 5 })}
                ${medallion({ seed: level.id, iconSvg: icon('crown'), tier: 'gold', size: 118 })}
                <div>
                    <p class="eyebrow is-gold">Nivel ${level.index + 1} de ${LEVELS.length}</p>
                    <h2>${level.name}</h2>
                    <p>${level.motto}</p>
                    <div class="level-track section-gap">${progressBar(level.progress, { tone: 'gold', size: 'thick', label: 'Progreso de nivel' })}
                        <small>${level.next ? `${num(game.points)} de ${num(level.next.min)} pts · faltan ${num(level.toNext)} para ${level.next.name}` : `${num(game.points)} pts · nivel máximo`}</small></div>
                    <div class="levels-road">${LEVELS.map(l => html`<span class="${game.points >= l.min ? 'is-reached' : ''}">${l.name}</span>`)}</div>
                </div>
            </section>

            <div class="grid grid-4 section-gap">
                ${stat('flame', 'Racha actual', stats.streak, 'días registrando')}
                ${stat('history', 'Mejor racha', stats.longestStreak, 'días seguidos')}
                ${stat('anchor', 'Sin impulsos', stats.impulseFreeCurrent, 'días seguidos')}
                ${stat('medal', 'Insignias', unlocked.length, `de ${game.badges.length}`)}
            </div>

            <div class="section-title"><h2>Retos</h2><span class="muted">Opcionales, cuando guste</span></div>
            <div class="grid grid-2">
                <article class="card">
                    <div class="card-head"><div><h2>En curso</h2></div></div>
                    ${game.challenges.length ? game.challenges.map(challenge => html`<div class="challenge">
                        <span class="cat-chip tone-${challenge.done ? 'gold' : challenge.failed ? 'red' : 'blue'}">${icon(challenge.icon, { size: 20 })}</span>
                        <div><h3>${challenge.name}</h3><p>${challenge.done ? '¡Superado!' : challenge.failed ? 'Se rompió esta vez. Puede volver a intentarlo.' : challenge.detail}</p>
                            ${!challenge.done && !challenge.failed ? progressBar(challenge.progress * 100, { tone: 'gold', size: 'thin' }) : ''}</div>
                        <div class="row" style="gap:6px">${challenge.done
                            ? html`<span class="pill is-gold">+${challenge.points}</span>`
                            : html`<button type="button" class="icon-btn is-sm is-plain" data-drop-challenge="${challenge.id}" aria-label="${challenge.failed ? 'Quitar para reintentar' : 'Abandonar reto'}">${icon(challenge.failed ? 'refresh' : 'x', { size: 15 })}</button>`}</div>
                    </div>`) : html`<p class="muted">Ningún reto activo. Elija uno de los disponibles.</p>`}
                </article>
                <article class="card">
                    <div class="card-head"><div><h2>Disponibles</h2></div></div>
                    ${available.length ? available.map(challenge => html`<div class="challenge">
                        <span class="cat-chip tone-gold">${icon(challenge.icon, { size: 20 })}</span>
                        <div><h3>${challenge.name}</h3><p>${challenge.description}</p></div>
                        <button type="button" class="btn btn-sm btn-gold" data-accept="${challenge.id}">+${challenge.points}</button>
                    </div>`) : html`<p class="muted">Ya aceptó todos los retos.</p>`}
                </article>
            </div>

            <div class="section-title"><h2>Insignias</h2><span class="muted">${unlocked.length} de ${game.badges.length}</span></div>
            <div class="badge-grid">
                ${[...unlocked, ...locked].map(badge => html`<article class="badge-card ${badge.unlocked ? 'is-unlocked' : ''}">
                    ${medallion({ seed: badge.id, iconSvg: icon(badge.icon), tier: badge.tier, locked: !badge.unlocked, size: 84 })}
                    <b>${badge.name}</b>
                    <p>${badge.description}</p>
                    ${badge.unlocked
                        ? html`<small>${TIER_LABELS[badge.tier]} · +${badge.points} pts${celebrated[badge.id] ? ` · ${formatDate(celebrated[badge.id], 'short')}` : ''}</small>`
                        : html`${progressBar(badge.progress * 100, { tone: 'gold', size: 'thin', label: `Progreso de ${badge.name}` })}<small>${Math.round(badge.progress * 100)}% · ${TIER_LABELS[badge.tier]}</small>`}
                </article>`)}
            </div>

            <div class="section-title"><h2>Cómo se ganan los puntos</h2></div>
            <article class="card">
                <div class="table-wrap"><table class="table points-table">
                    <thead><tr><th>Concepto</th><th class="is-num">Veces</th><th class="is-num">Puntos</th></tr></thead>
                    <tbody>${game.breakdown.map(item => html`<tr><td>${item.label}</td><td class="is-num">${num(item.count)}</td><td class="is-num">${num(item.points)}</td></tr>`)}</tbody>
                </table></div>
                <p class="field-hint section-gap">+${POINTS.loggingDay} por cada día que registra (una vez al día), +${POINTS.impulseFreeWeek} por cada semana sin gastos impulsivos, +${POINTS.monthWithinBudget} por cada mes dentro del presupuesto y +${POINTS.goalCompleted} por cada meta cumplida. Las insignias y los retos suman lo que indican.</p>
            </article>`;
    },

    mount(root, model) {
        const onClick = async event => {
            if (event.target.closest('[data-enable]')) {
                await app.store.saveProfile({ settings: { ...model.settings, gamification: true } });
                return;
            }
            const accept = event.target.closest('[data-accept]');
            if (accept) {
                const challenges = [...(model.profile.challenges || []), { id: accept.dataset.accept, startDate: model.today }];
                await app.store.saveProfile({ challenges });
                toast('Reto aceptado. ¡Suerte!', { tone: 'gold', iconName: 'flag' });
                return;
            }
            const drop = event.target.closest('[data-drop-challenge]');
            if (drop) {
                const challenge = model.game.challenges.find(c => c.id === drop.dataset.dropChallenge);
                if (challenge && !challenge.failed && !challenge.done) {
                    const ok = await confirmDialog({ title: '¿Abandonar el reto?', body: 'Podrá volver a aceptarlo cuando quiera.', confirmLabel: 'Abandonar' });
                    if (!ok) return;
                }
                const challenges = (model.profile.challenges || []).filter(c => c.id !== drop.dataset.dropChallenge);
                await app.store.saveProfile({ challenges });
            }
        };
        root.addEventListener('click', onClick);
        return () => root.removeEventListener('click', onClick);
    }
};

function stat(iconName, label, value, sub) {
    return html`<article class="card kpi"><div class="kpi-top"><span class="kpi-label">${label}</span><span class="kpi-icon is-gold">${icon(iconName, { size: 17 })}</span></div><div class="kpi-value">${num(value)}</div><div class="kpi-sub">${sub}</div></article>`;
}
