/**
 * Simulador de compra: contado, crédito, prima + crédito o las dos cosas
 * comparadas. Es la «calculadora multifuncional» que pidió Jared: cuánto
 * tarda en juntarlo, cuánto paga de cuota y de intereses, con cuánto ahorro se
 * queda tras la prima y si el endeudamiento es sano.
 *
 * La vista no se repinta con cada cambio del almacén (`live: false`): conserva
 * lo que la persona está escribiendo y solo recalcula el panel de resultados.
 */
import { app } from '../context.js';
import { html, downloadText, haptic } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { money, pct } from '../ui/format.js';
import { rosette } from '../ui/guilloche.js';
import { progressBar } from '../ui/parts.js';
import { simulatePurchase } from '../core/loans.js';
import { formatMoney, parseAmount, inBase, convertMinor } from '../core/money.js';
import { formatDate, formatMonths } from '../core/dates.js';
import { toCSV } from '../core/csv.js';
import { toast, confirmDialog } from '../ui/overlay.js';
import { play } from '../ui/sounds.js';

const MODES = [
    ['cash', 'Contado'],
    ['credit', 'Crédito'],
    ['down', 'Prima + crédito'],
    ['compare', 'Comparar']
];

let form = null;

function defaults(model, route) {
    const emergencySaved = model.emergency.entry ? model.emergency.entry.savedBase : 0;
    const price = Number(route.query.precio) || null;
    return {
        name: route.query.nombre || '',
        price,
        currency: 'CRC',
        mode: price ? 'compare' : 'compare',
        downPct: 20,
        annualRate: 11,
        months: 60,
        feesPct: 2,
        insurance: 0,
        savings: Math.max(0, model.savingsBalance - emergencySaved),
        capacity: model.capacity,
        income: model.avgIncome,
        existing: model.debts.filter(d => d.active !== false).reduce((sum, d) => sum + inBase(d.paymentMinor || 0, d.currency, model.fx), 0),
        showTable: false,
        loadedId: null
    };
}

export default {
    title: 'Simulador de compra',
    eyebrow: '¿Contado, crédito o esperar?',
    live: false,

    render(model, route) {
        if (!form || route.query.precio || route.query.nuevo) form = defaults(model, route);
        return html`
            <div class="sim">
                <article class="card sim-form">
                    <div class="card-head"><div><h2>¿Qué quiere comprar?</h2><p>Escriba el precio y ajuste las condiciones</p></div></div>
                    <form class="form" data-sim-form novalidate autocomplete="off">
                        <label class="field"><span>Qué es</span><input id="sim-name" name="name" value="${form.name}" placeholder="Montero Sport 2019, celular, lote…" maxlength="60"></label>
                        <div class="form-grid">
                            <label class="field"><span>Precio</span><div class="input-group"><span class="prefix" data-prefix>${form.currency === 'USD' ? '$' : '₡'}</span><input id="sim-price" name="price" inputmode="decimal" value="${form.price ? formatMoney(form.price, form.currency, { symbol: false }) : ''}" placeholder="8.000.000"></div></label>
                            <label class="field"><span>Moneda</span><select id="sim-currency" name="currency"><option value="CRC" ${form.currency === 'CRC' ? 'selected' : ''}>₡ Colones</option><option value="USD" ${form.currency === 'USD' ? 'selected' : ''}>$ Dólares</option></select></label>
                        </div>
                        <div class="seg is-block" role="group" aria-label="Modalidad">${MODES.map(([value, label]) => html`<button type="button" data-mode="${value}" aria-pressed="${form.mode === value}">${label}</button>`)}</div>
                        <div class="form-grid" data-credit-fields>
                            <label class="field" data-down-field><span>Prima <small data-down-amount></small></span><div class="input-group"><input id="sim-down" name="downPct" type="number" min="0" max="95" step="1" value="${form.downPct}" class="has-suffix" style="padding-left:13px!important"><span class="suffix">%</span></div></label>
                            <label class="field"><span>Tasa anual</span><div class="input-group"><input id="sim-rate" name="annualRate" type="number" min="0" max="80" step="0.05" value="${form.annualRate}" class="has-suffix" style="padding-left:13px!important"><span class="suffix">%</span></div></label>
                            <div class="field is-wide"><span>Plazo <small data-months-label>${form.months} meses</small></span>
                                <div class="chips">${[12, 24, 36, 48, 60, 72, 84, 96].map(m => html`<button type="button" class="chip" data-months="${m}" aria-pressed="${form.months === m}">${m}</button>`)}</div></div>
                            <label class="field"><span>Formalización <small>comisión</small></span><div class="input-group"><input id="sim-fees" name="feesPct" type="number" min="0" max="15" step="0.1" value="${form.feesPct}" class="has-suffix" style="padding-left:13px!important"><span class="suffix">%</span></div></label>
                            <label class="field"><span>Seguros al mes <small>opcional</small></span><div class="input-group"><span class="prefix">₡</span><input id="sim-insurance" name="insurance" inputmode="decimal" value="${form.insurance ? formatMoney(form.insurance, 'CRC', { symbol: false }) : ''}" placeholder="0"></div></label>
                        </div>
                        <details class="more">
                            <summary>${icon('sliders', { size: 16 })} Sus números <small class="faint">(tomados de su historial)</small></summary>
                            <div class="form">
                                <div class="form-grid">
                                    <label class="field"><span>Ahorro disponible <small>sin fondo de emergencia</small></span><div class="input-group"><span class="prefix">₡</span><input id="sim-savings" name="savings" inputmode="decimal" value="${formatMoney(form.savings, 'CRC', { symbol: false })}"></div></label>
                                    <label class="field"><span>Ahorra al mes</span><div class="input-group"><span class="prefix">₡</span><input id="sim-capacity" name="capacity" inputmode="decimal" value="${formatMoney(form.capacity, 'CRC', { symbol: false })}"></div></label>
                                    <label class="field"><span>Ingreso mensual</span><div class="input-group"><span class="prefix">₡</span><input id="sim-income" name="income" inputmode="decimal" value="${formatMoney(form.income, 'CRC', { symbol: false })}"></div></label>
                                    <label class="field"><span>Cuotas que ya paga</span><div class="input-group"><span class="prefix">₡</span><input id="sim-existing" name="existing" inputmode="decimal" value="${formatMoney(form.existing, 'CRC', { symbol: false })}"></div></label>
                                </div>
                            </div>
                        </details>
                    </form>
                </article>
                <div class="stack" data-results></div>
            </div>
            <div data-saved></div>`;
    },

    mount(root, model) {
        const formEl = root.querySelector('[data-sim-form]');
        const results = root.querySelector('[data-results]');
        const savedHost = root.querySelector('[data-saved]');

        const read = () => {
            const value = name => formEl.querySelector(`[name="${name}"]`)?.value;
            form.name = value('name') || '';
            form.price = parseAmount(value('price'));
            form.currency = value('currency') || 'CRC';
            form.downPct = Math.max(0, Math.min(95, Number(value('downPct')) || 0));
            form.annualRate = Math.max(0, Number(value('annualRate')) || 0);
            form.feesPct = Math.max(0, Number(value('feesPct')) || 0);
            form.insurance = Math.abs(parseAmount(value('insurance')) || 0);
            form.savings = Math.abs(parseAmount(value('savings')) || 0);
            form.capacity = Math.abs(parseAmount(value('capacity')) || 0);
            form.income = Math.abs(parseAmount(value('income')) || 0);
            form.existing = Math.abs(parseAmount(value('existing')) || 0);
        };

        const draw = () => {
            read();
            formEl.querySelector('[data-credit-fields]').hidden = form.mode === 'cash';
            formEl.querySelector('[data-down-field]').hidden = form.mode === 'credit';
            formEl.querySelector('[data-prefix]').textContent = form.currency === 'USD' ? '$' : '₡';
            formEl.querySelector('[data-months-label]').textContent = `${form.months} meses (${formatMonths(form.months)})`;
            const priceBase = form.price ? convertMinor(Math.abs(form.price), form.currency, model.fx.base, model.fx.rate) : 0;
            const downPct = form.mode === 'credit' ? 0 : form.downPct;
            const down = Math.round(priceBase * downPct / 100);
            const downLabel = formEl.querySelector('[data-down-amount]');
            if (downLabel) downLabel.textContent = priceBase ? formatMoney(down) : '';
            if (!priceBase) {
                results.innerHTML = String(html`<article class="card empty">${rosette({ seed: 'simulador', size: 150, layers: 3 })}<h3>Escriba un precio</h3><p>Le diremos en cuánto tiempo lo tiene de contado, cuánto pagaría a crédito y si le conviene esperar.</p></article>`);
                return;
            }
            const sim = simulatePurchase({
                price: priceBase,
                downPayment: form.mode === 'cash' ? 0 : down,
                annualRate: form.annualRate,
                months: form.mode === 'cash' ? 0 : form.months,
                feesPct: form.feesPct,
                insuranceMonthly: form.insurance,
                savingsAvailable: form.savings,
                monthlyCapacity: form.capacity,
                monthlyIncome: form.income,
                existingDebtPayments: form.existing,
                today: model.today
            });
            results.innerHTML = String(resultsView(sim, model));
        };

        const drawSaved = () => {
            const saved = app.model().simulations;
            savedHost.innerHTML = saved.length ? String(html`<div class="section-title"><h2>Simulaciones guardadas</h2></div>
                <div class="grid grid-3">${saved.map(s => html`<article class="card is-tight">
                    <div class="row-between"><b>${s.name || 'Sin nombre'}</b><span class="pill">${MODES.find(m => m[0] === s.mode)?.[1] || ''}</span></div>
                    <p class="muted" style="margin:6px 0 10px">${money(s.priceMinor, s.currency)} · ${formatDate(s.date || model.today, 'medium')}</p>
                    <div class="row"><button type="button" class="btn btn-sm btn-ghost" data-load-sim="${s.id}">Abrir</button><button type="button" class="icon-btn is-sm is-plain" data-delete-sim="${s.id}" aria-label="Eliminar">${icon('trash', { size: 15 })}</button></div>
                </article>`)}</div>`) : '';
        };

        const onInput = () => draw();
        const onClick = async event => {
            const mode = event.target.closest('[data-mode]');
            if (mode) {
                form.mode = mode.dataset.mode;
                formEl.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === mode)));
                haptic(6);
                return draw();
            }
            const months = event.target.closest('[data-months]');
            if (months) {
                form.months = Number(months.dataset.months);
                formEl.querySelectorAll('[data-months]').forEach(b => b.setAttribute('aria-pressed', String(b === months)));
                return draw();
            }
            if (event.target.closest('[data-toggle-table]')) { form.showTable = !form.showTable; return draw(); }
            if (event.target.closest('[data-export-table]')) return exportTable();
            if (event.target.closest('[data-save-sim]')) return saveSimulation();
            if (event.target.closest('[data-make-goal]')) return makeGoal();
            if (event.target.closest('[data-make-debt]')) return makeDebt();
            const load = event.target.closest('[data-load-sim]');
            if (load) {
                const s = app.store.get('simulations', load.dataset.loadSim);
                if (!s) return;
                Object.assign(form, { name: s.name, price: s.priceMinor, currency: s.currency, mode: s.mode, downPct: s.downPct, annualRate: s.annualRate, months: s.months, feesPct: s.feesPct, insurance: s.insuranceMinor || 0, loadedId: s.id });
                app.rerender();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const del = event.target.closest('[data-delete-sim]');
            if (del && await confirmDialog({ title: '¿Eliminar la simulación?', confirmLabel: 'Eliminar', danger: true })) {
                await app.store.remove('simulations', del.dataset.deleteSim);
                drawSaved();
            }
        };

        const currentSim = () => {
            const priceBase = convertMinor(Math.abs(form.price || 0), form.currency, model.fx.base, model.fx.rate);
            const down = form.mode === 'cash' || form.mode === 'credit' ? 0 : Math.round(priceBase * form.downPct / 100);
            return { priceBase, down, sim: simulatePurchase({ price: priceBase, downPayment: down, annualRate: form.annualRate, months: form.mode === 'cash' ? 0 : form.months, feesPct: form.feesPct, insuranceMonthly: form.insurance, savingsAvailable: form.savings, monthlyCapacity: form.capacity, monthlyIncome: form.income, existingDebtPayments: form.existing, today: model.today }) };
        };

        const exportTable = () => {
            const { sim } = currentSim();
            if (!sim.credit) return;
            downloadText(`amortizacion-${(form.name || 'compra').toLowerCase().replace(/\W+/g, '-')}.csv`, toCSV(sim.credit.rows, [
                { key: 'n', label: 'Cuota' },
                { key: 'payment', label: 'Pago', format: v => (v / 100).toFixed(2).replace('.', ',') },
                { key: 'interest', label: 'Intereses', format: v => (v / 100).toFixed(2).replace('.', ',') },
                { key: 'principal', label: 'Capital', format: v => (v / 100).toFixed(2).replace('.', ',') },
                { key: 'balance', label: 'Saldo', format: v => (v / 100).toFixed(2).replace('.', ',') }
            ]), 'text/csv');
        };

        const saveSimulation = async () => {
            if (!form.price) return;
            const doc = { name: form.name || 'Compra', priceMinor: form.price, currency: form.currency, mode: form.mode, downPct: form.downPct, annualRate: form.annualRate, months: form.months, feesPct: form.feesPct, insuranceMinor: form.insurance, date: model.today };
            if (form.loadedId) doc.id = form.loadedId;
            form.loadedId = await app.store.save('simulations', doc);
            play('success');
            toast('Simulación guardada', { tone: 'success' });
            drawSaved();
        };

        const makeGoal = async () => {
            const { openGoalSheet } = await import('../sheets/forms.js');
            const { priceBase, down } = currentSim();
            const target = form.mode === 'cash' ? priceBase : down + Math.round(priceBase * form.feesPct / 100);
            openGoalSheet({ goal: null, kind: /carro|auto|montero|toyota|hilux|moto|vehiculo|vehículo/i.test(form.name) ? 'carro' : 'otro' });
            setTimeout(() => {
                const sheet = document.querySelector('.overlay:last-child');
                const name = sheet?.querySelector('[name="name"]');
                const amount = sheet?.querySelector('[name="targetMinor"]');
                if (name && !name.value) name.value = form.mode === 'cash' ? form.name : `Prima: ${form.name}`;
                if (amount) amount.value = formatMoney(target, 'CRC', { symbol: false });
            }, 80);
        };

        const makeDebt = async () => {
            const { openDebtSheet } = await import('../sheets/forms.js');
            const { sim } = currentSim();
            if (!sim.credit) return;
            openDebtSheet({ preset: { name: form.name || 'Préstamo', currency: 'CRC', principalMinor: sim.credit.loan, balanceMinor: sim.credit.loan, annualRate: form.annualRate, termMonths: form.months, paymentMinor: sim.credit.payment, kind: 'vehicle', startDate: model.today } });
        };

        formEl.addEventListener('input', onInput);
        formEl.addEventListener('change', onInput);
        root.addEventListener('click', onClick);
        draw();
        drawSaved();
        return () => {
            formEl.removeEventListener('input', onInput);
            formEl.removeEventListener('change', onInput);
            root.removeEventListener('click', onClick);
        };
    }
};

function resultsView(sim, model) {
    const { verdict, cash, credit } = sim;
    const level = verdict.level === 'no' ? 'wait' : verdict.level;
    const showCash = form.mode === 'cash' || form.mode === 'compare';
    const showCredit = credit && form.mode !== 'cash';
    const goalsMonthly = model.goalsMonthly;
    const goalDelay = credit && goalsMonthly > 0 && credit.capacityAfter < goalsMonthly
        ? Math.max(0, (goalsMonthly - Math.max(0, credit.capacityAfter)) / goalsMonthly * 100)
        : null;
    const rows = credit ? (form.showTable ? credit.rows : credit.rows.slice(0, 12)) : [];

    return html`
        <article class="verdict is-${level}">
            ${rosette({ seed: 'verdict-' + verdict.level, size: 260, layers: 3 })}
            <p class="eyebrow">Veredicto${form.name ? ` · ${form.name}` : ''}</p>
            <h2>${verdict.title}</h2>
            <ul>${verdict.reasons.map(reason => html`<li>${reason}</li>`)}</ul>
            <div class="row wrap" style="margin-top:16px">
                <button type="button" class="btn btn-sm btn-ghost" data-save-sim>${icon('archive', { size: 15 })}Guardar simulación</button>
                <button type="button" class="btn btn-sm btn-ghost" data-make-goal>${icon('target', { size: 15 })}${form.mode === 'cash' ? 'Convertir en meta' : 'Meta para la prima'}</button>
                ${showCredit ? html`<button type="button" class="btn btn-sm btn-ghost" data-make-debt>${icon('landmark', { size: 15 })}Ya lo compré: registrar préstamo</button>` : ''}
            </div>
        </article>

        <div class="compare">
            ${showCash ? html`<article class="card">
                <p class="eyebrow">De contado</p>
                <p class="big">${cash.gap === 0 ? 'Hoy mismo' : Number.isFinite(cash.months) ? formatMonths(cash.months) : 'Sin capacidad'}</p>
                <dl>
                    <div><dt>Precio</dt><dd>${money(sim.price)}</dd></div>
                    <div><dt>Le falta juntar</dt><dd>${money(cash.gap)}</dd></div>
                    <div><dt>Lo tendría</dt><dd>${cash.date ? formatDate(cash.date, 'medium') : '—'}</dd></div>
                    <div><dt>Intereses</dt><dd>${money(0)}</dd></div>
                    <div><dt>Ahorro que queda</dt><dd>${money(cash.savingsAfter)}</dd></div>
                </dl>
            </article>` : ''}
            ${showCredit ? html`<article class="card">
                <p class="eyebrow">${credit.downPayment ? 'Prima + crédito' : 'Crédito'}</p>
                <p class="big">${money(credit.monthly)}<small class="faint" style="font-size:.9rem"> /mes</small></p>
                <dl>
                    ${credit.downPayment ? html`<div><dt>Prima (${pct(credit.downPct)})</dt><dd>${money(credit.downPayment)}</dd></div>` : ''}
                    <div><dt>Préstamo</dt><dd>${money(credit.loan)}</dd></div>
                    <div><dt>Plazo</dt><dd>${credit.months} meses</dd></div>
                    <div><dt>Intereses totales</dt><dd>${money(credit.totalInterest)}</dd></div>
                    ${credit.fees ? html`<div><dt>Formalización</dt><dd>${money(credit.fees)}</dd></div>` : ''}
                    <div><dt>Costo total</dt><dd>${money(credit.totalCost)}</dd></div>
                    <div><dt>Paga de más</dt><dd class="amt is-neg">${money(credit.overPrice)}</dd></div>
                    ${credit.downPayment ? html`<div><dt>Ahorro tras la prima</dt><dd>${money(credit.savingsAfterDown, 'CRC', { tone: credit.savingsAfterDown < 0 ? 'expense' : 'none' })}</dd></div>` : ''}
                </dl>
            </article>` : ''}
        </div>

        ${showCredit ? html`<article class="card">
            <div class="card-head"><div><h2>Endeudamiento</h2><p>Cuotas totales frente a su ingreso</p></div><span class="pill is-${{ ok: 'ok', caution: 'warn', risk: 'danger', unknown: '' }[credit.dti.state]}">${pct(credit.dti.pct)}</span></div>
            <div class="dti-meter">
                ${progressBar(Math.min(100, credit.dti.pct / 60 * 100), { tone: { ok: 'ok', caution: 'warning', risk: 'over' }[credit.dti.state] || 'accent', size: 'thick', label: 'Endeudamiento' })}
                <div class="dti-scale"><span>0%</span><span>30% sano</span><span>40% límite</span><span>60%</span></div>
            </div>
            <div class="callout section-gap ${credit.capacityAfter < 0 ? 'is-warn' : ''}">${icon(credit.capacityAfter < 0 ? 'alert' : 'info')}<span>${credit.capacityAfter >= 0
                ? html`Después de la cuota le quedarían <b>${money(credit.capacityAfter)}</b> al mes para ahorrar.`
                : html`La cuota supera en <b>${money(-credit.capacityAfter)}</b> lo que ahorra al mes: tendría que recortar gastos.`}
                ${goalDelay ? html` Sus metas avanzarían un ${Math.round(goalDelay)}% más lento.` : ''}</span></div>
        </article>
        <article class="card">
            <div class="card-head"><div><h2>Tabla de amortización</h2><p>Sistema francés, cuota fija</p></div>
                <div class="row"><button type="button" class="icon-btn is-sm" data-export-table aria-label="Exportar CSV" title="Exportar CSV">${icon('download', { size: 16 })}</button></div></div>
            <div class="table-wrap"><table class="table">
                <thead><tr><th>#</th><th class="is-num">Cuota</th><th class="is-num">Intereses</th><th class="is-num">Capital</th><th class="is-num">Saldo</th></tr></thead>
                <tbody>${rows.map(row => html`<tr><td>${row.n}</td><td class="is-num">${money(row.payment)}</td><td class="is-num">${money(row.interest)}</td><td class="is-num">${money(row.principal)}</td><td class="is-num">${money(row.balance)}</td></tr>`)}</tbody>
            </table></div>
            ${credit.rows.length > 12 ? html`<div class="load-more"><button type="button" class="btn btn-quiet" data-toggle-table>${form.showTable ? 'Mostrar menos' : `Ver las ${credit.rows.length} cuotas`}</button></div>` : ''}
        </article>` : ''}`;
}
