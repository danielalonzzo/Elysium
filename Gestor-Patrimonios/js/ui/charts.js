/**
 * Gráficas en SVG propio.
 *
 * Sin Chart.js a propósito: la app funciona sin conexión y el service worker
 * no puede depender de un CDN para dibujar el dinero de alguien. Las reglas
 * son las del skill de visualización: un solo eje, marcas finas (barras de
 * ≤ 24 px con el extremo redondeado de 4 px y cuadradas en la base, líneas de
 * 2 px), rejilla discreta, leyenda siempre que haya dos series, el texto con
 * tokens de texto y nunca con el color de la serie, y una capa de hover con
 * cruz que busca la X más cercana.
 *
 * Los colores salen de variables CSS (`--c-income`, `--c-expense`,
 * `--c-net`), validadas en los dos temas contra su superficie.
 */
import { formatMoney } from '../core/money.js';
import { esc, raw } from './dom.js';

const observers = new Set();

/** Desconecta los observadores de tamaño de la vista anterior. */
export function disposeCharts() {
    for (const observer of observers) observer.disconnect();
    observers.clear();
}

function observe(element, draw) {
    let lastWidth = 0;
    const run = () => {
        const width = Math.round(element.clientWidth);
        if (!width || width === lastWidth) return;
        lastWidth = width;
        draw(width);
    };
    const observer = new ResizeObserver(() => requestAnimationFrame(run));
    observer.observe(element);
    observers.add(observer);
    run();
}

function niceStep(range, ticks) {
    const raw = range / Math.max(1, ticks);
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    const residual = raw / magnitude;
    const nice = residual > 5 ? 10 : residual > 2.5 ? 5 : residual > 2 ? 2.5 : residual > 1 ? 2 : 1;
    return nice * magnitude;
}

function scaleDomain(min, max, ticks = 4) {
    if (min === max) { max = min + 1; }
    const step = niceStep(max - min, ticks);
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const values = [];
    for (let v = lo; v <= hi + step / 2; v += step) values.push(Math.round(v));
    return { lo, hi, values };
}

/** Columna con extremo redondeado de 4 px y base cuadrada. */
function columnPath(x, y, width, height, radius = 4) {
    if (height <= 0) return '';
    const r = Math.min(radius, width / 2, height);
    return `M${x} ${y + height}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + width - r}Q${x + width} ${y} ${x + width} ${y + r}V${y + height}Z`;
}

function tooltipHost(element) {
    let tip = element.querySelector(':scope > .chart-tip');
    if (!tip) {
        tip = document.createElement('div');
        tip.className = 'chart-tip';
        tip.setAttribute('role', 'status');
        tip.setAttribute('aria-live', 'polite');
        element.append(tip);
    }
    return tip;
}

function placeTip(element, tip, x, y) {
    const hostWidth = element.clientWidth;
    tip.classList.add('is-visible');
    const tipWidth = tip.offsetWidth;
    let left = x + 14;
    if (left + tipWidth > hostWidth - 4) left = x - tipWidth - 14;
    tip.style.transform = `translate(${Math.max(4, left)}px, ${Math.max(0, y)}px)`;
}

function tipRows(title, rows) {
    return `<div class="chart-tip-title">${esc(title)}</div>` + rows.map(row =>
        `<div class="chart-tip-row"><span class="chart-key ${row.key}"></span><b>${esc(row.value)}</b><span>${esc(row.label)}</span></div>`
    ).join('');
}

const moneyShort = (minor, currency = 'CRC') => formatMoney(minor, currency, { compact: true });

/* ── Flujo de caja: columnas de ingresos y gastos + línea de ahorro neto ─── */

/**
 * @param {HTMLElement} element
 * @param {{labels: string[], titles?: string[], income: number[], expense: number[], net?: number[], currency?: string, height?: number}} data
 */
export function cashflowChart(element, data) {
    const currency = data.currency || 'CRC';
    observe(element, width => {
        const height = data.height || (width < 520 ? 210 : 250);
        const m = { top: 14, right: 10, bottom: 26, left: width < 520 ? 44 : 56 };
        const innerW = width - m.left - m.right;
        const innerH = height - m.top - m.bottom;
        const all = [...data.income, ...data.expense, ...(data.net || [])];
        const domain = scaleDomain(Math.min(0, ...all), Math.max(0, ...all), 4);
        const y = v => m.top + innerH - ((v - domain.lo) / (domain.hi - domain.lo)) * innerH;
        const n = data.labels.length;
        const band = innerW / n;
        const barW = Math.max(3, Math.min(14, band * 0.3));
        const x0 = i => m.left + band * i + band / 2;

        let svg = `<svg class="chart-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Ingresos y gastos por mes">`;
        for (const tick of domain.values) {
            svg += `<line class="grid${tick === 0 ? ' is-zero' : ''}" x1="${m.left}" x2="${width - m.right}" y1="${y(tick).toFixed(1)}" y2="${y(tick).toFixed(1)}"/>`;
            svg += `<text class="axis" x="${m.left - 8}" y="${(y(tick) + 4).toFixed(1)}" text-anchor="end">${esc(moneyShort(tick, currency))}</text>`;
        }
        svg += `<rect class="hover-band" x="0" y="${m.top}" width="${band.toFixed(1)}" height="${innerH}" rx="8" opacity="0"/>`;
        const every = Math.ceil(n / Math.max(1, Math.floor(innerW / 44)));
        data.labels.forEach((label, i) => {
            const cx = x0(i);
            const base = y(0);
            const inc = data.income[i] || 0;
            const exp = data.expense[i] || 0;
            svg += `<path class="bar s-income" d="${columnPath(cx - barW - 1, y(inc), barW, base - y(inc))}"/>`;
            svg += `<path class="bar s-expense" d="${columnPath(cx + 1, y(exp), barW, base - y(exp))}"/>`;
            if (i % every === 0 || i === n - 1) {
                svg += `<text class="axis" x="${cx.toFixed(1)}" y="${height - 8}" text-anchor="middle">${esc(label)}</text>`;
            }
        });
        if (data.net) {
            const points = data.net.map((v, i) => `${x0(i).toFixed(1)},${y(v).toFixed(1)}`);
            svg += `<polyline class="line s-net" points="${points.join(' ')}"/>`;
            const last = data.net.length - 1;
            svg += `<circle class="dot s-net" cx="${x0(last).toFixed(1)}" cy="${y(data.net[last]).toFixed(1)}" r="4"/>`;
        }
        svg += `<line class="crosshair" x1="0" x2="0" y1="${m.top}" y2="${m.top + innerH}" opacity="0"/>`;
        svg += '</svg>';
        element.innerHTML = svg;
        const tip = tooltipHost(element);
        const svgEl = element.querySelector('svg');
        const bandEl = svgEl.querySelector('.hover-band');

        const show = i => {
            bandEl.setAttribute('x', (m.left + band * i).toFixed(1));
            bandEl.setAttribute('opacity', '1');
            const rows = [
                { key: 's-income', label: 'Ingresos', value: formatMoney(data.income[i] || 0, currency) },
                { key: 's-expense', label: 'Gastos', value: formatMoney(data.expense[i] || 0, currency) }
            ];
            if (data.net) rows.push({ key: 's-net is-line', label: 'Ahorro neto', value: formatMoney(data.net[i] || 0, currency) });
            tip.innerHTML = tipRows((data.titles || data.labels)[i], rows);
            placeTip(element, tip, x0(i), m.top);
        };
        const hide = () => { bandEl.setAttribute('opacity', '0'); tip.classList.remove('is-visible'); };
        attachIndexHover(svgEl, n, localX => Math.floor((localX - m.left) / band), show, hide);
    });
}

/**
 * Hover y teclado comunes: el puntero elige el índice más cercano; con el foco
 * en la gráfica, las flechas recorren los puntos.
 */
function attachIndexHover(svgEl, count, indexFromEvent, show, hide) {
    let current = count - 1;
    svgEl.setAttribute('tabindex', '0');
    svgEl.addEventListener('pointermove', event => {
        const box = svgEl.getBoundingClientRect();
        const index = indexFromEvent(event.clientX - box.left);
        if (index < 0 || index >= count) { hide(); return; }
        current = index;
        show(index);
    });
    svgEl.addEventListener('pointerleave', hide);
    svgEl.addEventListener('focus', () => show(current));
    svgEl.addEventListener('blur', hide);
    svgEl.addEventListener('keydown', event => {
        if (event.key === 'ArrowRight') current = Math.min(count - 1, current + 1);
        else if (event.key === 'ArrowLeft') current = Math.max(0, current - 1);
        else return;
        event.preventDefault();
        show(current);
    });
}

/* ── Área: evolución de una sola serie (patrimonio, ahorro acumulado) ─────── */

/**
 * @param {HTMLElement} element
 * @param {{labels: string[], titles?: string[], values: number[], currency?: string, height?: number, tone?: string, name?: string}} data
 */
export function areaChart(element, data) {
    const currency = data.currency || 'CRC';
    const tone = data.tone || 's-gold';
    observe(element, width => {
        const height = data.height || (width < 520 ? 180 : 220);
        const m = { top: 16, right: 14, bottom: 26, left: width < 520 ? 44 : 56 };
        const innerW = width - m.left - m.right;
        const innerH = height - m.top - m.bottom;
        const values = data.values;
        const n = values.length;
        const domain = scaleDomain(Math.min(0, ...values), Math.max(...values, 1), 4);
        const y = v => m.top + innerH - ((v - domain.lo) / (domain.hi - domain.lo)) * innerH;
        const x = i => m.left + (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1));

        let svg = `<svg class="chart-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(data.name || 'Evolución')}">`;
        for (const tick of domain.values) {
            svg += `<line class="grid${tick === 0 ? ' is-zero' : ''}" x1="${m.left}" x2="${width - m.right}" y1="${y(tick).toFixed(1)}" y2="${y(tick).toFixed(1)}"/>`;
            svg += `<text class="axis" x="${m.left - 8}" y="${(y(tick) + 4).toFixed(1)}" text-anchor="end">${esc(moneyShort(tick, currency))}</text>`;
        }
        const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
        const baseY = y(Math.max(domain.lo, 0)).toFixed(1);
        svg += `<polygon class="area ${tone}" points="${x(0).toFixed(1)},${baseY} ${line} ${x(n - 1).toFixed(1)},${baseY}"/>`;
        svg += `<polyline class="line ${tone}" points="${line}"/>`;
        const every = Math.ceil(n / Math.max(1, Math.floor(innerW / 48)));
        data.labels.forEach((label, i) => {
            if (i % every === 0 || i === n - 1) svg += `<text class="axis" x="${x(i).toFixed(1)}" y="${height - 8}" text-anchor="middle">${esc(label)}</text>`;
        });
        svg += `<line class="crosshair" x1="0" x2="0" y1="${m.top}" y2="${m.top + innerH}" opacity="0"/>`;
        svg += `<circle class="dot ${tone} is-hover" r="4.5" cx="-10" cy="-10"/>`;
        svg += `<circle class="dot ${tone}" cx="${x(n - 1).toFixed(1)}" cy="${y(values[n - 1]).toFixed(1)}" r="4"/>`;
        svg += '</svg>';
        element.innerHTML = svg;
        const svgEl = element.querySelector('svg');
        const tip = tooltipHost(element);
        const cross = svgEl.querySelector('.crosshair');
        const hoverDot = svgEl.querySelector('.dot.is-hover');
        const show = i => {
            cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity', '1');
            hoverDot.setAttribute('cx', x(i)); hoverDot.setAttribute('cy', y(values[i]));
            tip.innerHTML = tipRows((data.titles || data.labels)[i], [{ key: `${tone} is-line`, label: data.name || 'Valor', value: formatMoney(values[i], currency) }]);
            placeTip(element, tip, x(i), Math.max(0, y(values[i]) - 30));
        };
        const hide = () => {
            cross.setAttribute('opacity', '0');
            hoverDot.setAttribute('cx', -10);
            tip.classList.remove('is-visible');
        };
        attachIndexHover(svgEl, n, localX => Math.round(((localX - m.left) / innerW) * (n - 1)), show, hide);
    });
}

/* ── Piezas estáticas ─────────────────────────────────────────────────────── */

/** Sparkline de 12 puntos: la tendencia en tono secundario y el último punto en acento. */
export function sparkline(values, { width = 120, height = 34, className = '' } = {}) {
    const list = (values || []).filter(Number.isFinite);
    if (list.length < 2) return raw('');
    const min = Math.min(...list);
    const max = Math.max(...list);
    const span = max - min || 1;
    const x = i => 2 + (i * (width - 6)) / (list.length - 1);
    const y = v => height - 4 - ((v - min) / span) * (height - 8);
    const points = list.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const last = list.length - 1;
    return raw(`<svg class="spark ${className}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false"><polyline points="${points}"/><circle cx="${x(last).toFixed(1)}" cy="${y(list[last]).toFixed(1)}" r="3"/></svg>`);
}

let ringCounter = 0;
/** Anillo de progreso con degradado dorado (metas) o de estado (presupuestos). */
export function ring(pct, { size = 64, stroke = 6, tone = 'gold', label = '' } = {}) {
    const id = `ring-${++ringCounter}`;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const value = Math.max(0, Math.min(100, Number(pct) || 0));
    const offset = c * (1 - value / 100);
    const gradient = tone === 'gold'
        ? `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--gold-hi)"/><stop offset=".55" stop-color="var(--gold)"/><stop offset="1" stop-color="var(--gold-lo)"/></linearGradient></defs>`
        : '';
    const strokeAttr = tone === 'gold' ? `url(#${id})` : `var(--tone-${tone})`;
    return raw(`<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label || Math.round(value) + '%')}">${gradient}
        <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" fill="none"/>
        <circle class="ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" fill="none" stroke="${strokeAttr}"
            stroke-linecap="round" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
            style="--ring-c:${c.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>`);
}

/**
 * Barras horizontales ordenadas, de un solo tono: la identidad la da la
 * etiqueta (y su icono), no el color. Es la forma correcta para comparar
 * magnitudes entre categorías.
 * @param {Array<{label: string, value: number, sub?: string, iconHtml?: any, href?: string}>} items
 */
export function hbars(items, { currency = 'CRC', max = null, tone = 'accent' } = {}) {
    const top = max ?? Math.max(1, ...items.map(item => item.value));
    return raw(`<ol class="hbars is-${tone}">${items.map(item => {
        const width = Math.max(1.5, (item.value / top) * 100);
        const tag = item.href ? 'a' : 'div';
        return `<li><${tag} class="hbar"${item.href ? ` href="${esc(item.href)}"` : ''}>
            <span class="hbar-label">${item.iconHtml ? String(item.iconHtml) : ''}<span class="hbar-name">${esc(item.label)}</span>${item.sub ? `<small>${esc(item.sub)}</small>` : ''}</span>
            <span class="hbar-value"><span class="amt">${esc(formatMoney(item.value, currency))}</span></span>
            <span class="hbar-track"><span class="hbar-fill" style="width:${width.toFixed(1)}%"></span></span>
        </${tag}></li>`;
    }).join('')}</ol>`);
}

/* ── Mapa de calor del gasto diario ───────────────────────────────────────── */

/**
 * @param {HTMLElement} element
 * @param {{days: string[], values: Map<string, number>, currency?: string, labelFor: (iso: string) => string}} data
 */
export function heatmap(element, data) {
    const currency = data.currency || 'CRC';
    const max = Math.max(1, ...data.values.values());
    const level = value => (value <= 0 ? 0 : Math.min(4, Math.ceil((value / max) * 4)));
    const cells = data.days.map(iso => {
        const value = data.values.get(iso) || 0;
        const date = new Date(iso + 'T12:00:00Z');
        const row = (date.getUTCDay() + 6) % 7;
        return { iso, value, row, lvl: level(value) };
    });
    let column = 0;
    let html = '<div class="heatmap-grid" role="grid" aria-label="Gasto por día">';
    cells.forEach((cell, index) => {
        if (index > 0 && cell.row === 0) column += 1;
        html += `<button type="button" class="heat-cell l${cell.lvl}" style="grid-row:${cell.row + 1};grid-column:${column + 1}" data-iso="${cell.iso}" data-value="${cell.value}" aria-label="${esc(data.labelFor(cell.iso))}: ${esc(formatMoney(cell.value, currency))}"></button>`;
    });
    html += '</div><div class="heatmap-legend" aria-hidden="true"><span>Menos</span><i class="heat-cell l0"></i><i class="heat-cell l1"></i><i class="heat-cell l2"></i><i class="heat-cell l3"></i><i class="heat-cell l4"></i><span>Más</span></div>';
    element.innerHTML = html;
    const tip = tooltipHost(element);
    const show = target => {
        tip.innerHTML = tipRows(data.labelFor(target.dataset.iso), [{ key: 's-expense', label: 'Gasto del día', value: formatMoney(Number(target.dataset.value), currency) }]);
        const box = target.getBoundingClientRect();
        const host = element.getBoundingClientRect();
        placeTip(element, tip, box.left - host.left, box.top - host.top - 52);
    };
    element.addEventListener('pointerover', event => { const cell = event.target.closest('.heat-cell[data-iso]'); if (cell) show(cell); });
    element.addEventListener('focusin', event => { const cell = event.target.closest('.heat-cell[data-iso]'); if (cell) show(cell); });
    element.addEventListener('pointerleave', () => tip.classList.remove('is-visible'));
    element.addEventListener('focusout', () => tip.classList.remove('is-visible'));
}
