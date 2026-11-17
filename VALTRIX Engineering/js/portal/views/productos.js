/**
 * Productos e inventario.
 *
 * «Productos» es el catálogo y lo que cada cosa dejó en el mes: es donde se
 * ve qué deja ganancia y qué pérdida. «Inventario» es la bodega: cuánto hay,
 * qué está por agotarse y cada entrada, merma o conteo que la movió.
 *
 * Quien no tiene permiso de ver costos recibe estas listas sin costo ni
 * margen —el servidor no los manda—, y aquí simplemente no hay columna que
 * pintar. No es que la pantalla los esconda.
 */

import { MOVEMENT_TYPES, PRODUCT_KIND_LABEL, UNITS } from '../../core/catalog.js';
import { get, patch, post } from '../api.js';
import { badge, btn, day, formDialog, h, kpis, money, month, notice, pageHead, panel, percent, qty, table, tabs, toast } from '../ui.js';

export const views = { productos, inventario };

const unitOptions = UNITS.map(unit => ({ value: unit, label: unit[0].toUpperCase() + unit.slice(1) }));

/* ================================================================== *
 * Productos
 * ================================================================== */

async function productos(ctx) {
    const { base, currency } = ctx;
    const costs = ctx.can('cost.read');
    const manages = ctx.can('product.manage');
    const [{ products }, margins] = await Promise.all([
        get(`${base}/products?all=1`),
        costs ? get(`${base}/margins`) : null
    ]);
    const sold = new Map((margins?.products || []).map(row => [row.productId, row]));
    const cash = minor => money(minor, currency);
    const showInactive = ctx.query.get('ver') === 'todos';
    const visible = products.filter(row => showInactive || row.active);
    const inactive = products.length - products.filter(row => row.active).length;

    const marginBadge = bp => {
        if (bp === null || bp === undefined) return '—';
        if (bp < 0) return badge(`${percent(bp)} · pierde`, 'bad');
        if (bp < 1000) return badge(`${percent(bp)} · bajo`, 'warn');
        return percent(bp);
    };

    const edit = async row => {
        const saved = await productForm(ctx, row);
        if (saved) { toast(row ? 'Producto actualizado.' : 'Producto creado.'); ctx.reload(); }
    };

    const columns = [
        { label: 'Producto', render: row => [row.name, h('span', { class: 'sub' }, row.code, row.kind === 'service' ? ' · servicio' : '', row.active ? '' : ' · desactivado')] },
        costs ? { label: 'Costo', num: true, render: row => (row.kind === 'service' && !row.costMinor ? '—' : cash(row.costMinor)) } : null,
        { label: 'Precio', num: true, render: row => cash(row.priceMinor) },
        costs ? { label: 'Margen de lista', num: true, render: row => (row.kind === 'service' && !row.costMinor ? '—' : marginBadge(row.marginBp)) } : null,
        costs ? { label: 'Vendido en el mes', num: true, render: row => (sold.has(row.id) ? qty(sold.get(row.id).quantityMilli, row.unit) : '—') } : null,
        costs ? { label: 'Dejó en el mes', num: true, render: row => (sold.has(row.id) ? (sold.get(row.id).profitMinor < 0 ? badge(cash(sold.get(row.id).profitMinor), 'bad') : cash(sold.get(row.id).profitMinor)) : '—') } : null,
        { label: 'Existencia', num: true, render: row => (row.kind === 'good' ? (row.out ? badge('Agotado', 'bad') : row.low ? badge(qty(row.onHandMilli, row.unit), 'warn') : qty(row.onHandMilli, row.unit)) : '—') },
        manages ? { label: '', tight: true, render: row => btn('Editar', { small: true, onClick: () => edit(row) }) } : null
    ].filter(Boolean);

    return h('div', { class: 'stack' },
        pageHead({
            eyebrow: 'Control financiero',
            title: 'Productos',
            lead: costs
                ? `Lo que vende, con su costo, su precio y lo que dejó en ${month(margins.period).toLowerCase()}.`
                : 'Lo que vende, con su precio y su existencia.',
            actions: manages ? btn('Nuevo producto', { kind: 'primary', onClick: () => edit(null) }) : null
        }),
        panel({
            actions: inactive ? btn(showInactive ? 'Ocultar los desactivados' : `Ver también los desactivados (${inactive})`, {
                small: true, kind: 'quiet', onClick: () => ctx.go('productos', null, showInactive ? null : { ver: 'todos' })
            }) : null
        },
            table({ columns, rows: visible, label: 'Productos', emptyText: 'Todavía no hay productos. Empiece por el que más vende.' })));
}

function productForm(ctx, row) {
    const costs = ctx.can('cost.read');
    const creating = !row;
    return formDialog({
        title: creating ? 'Nuevo producto' : `Editar ${row.name}`,
        lead: creating ? 'Un producto lleva existencias; un servicio, no.' : '',
        fields: [
            { name: 'name', label: 'Nombre', required: true, maxlength: 120, value: row?.name, wide: true },
            creating ? { name: 'kind', label: 'Tipo', type: 'select', value: 'good', options: Object.entries(PRODUCT_KIND_LABEL).map(([value, label]) => ({ value, label })) } : null,
            { name: 'code', label: 'Código', maxlength: 40, value: row?.code, hint: creating ? 'Si lo deja vacío, el sistema le pone uno.' : '' },
            { name: 'unit', label: 'Se vende por', type: 'select', value: row?.unit || 'unidad', options: unitOptions },
            { name: 'category', label: 'Categoría', maxlength: 60, value: row?.category },
            costs ? { name: 'costMinor', label: 'Costo', type: 'money', value: row?.costMinor ?? null, hint: 'Con el mismo criterio que el precio: los dos con impuesto o los dos sin él.' } : null,
            { name: 'priceMinor', label: 'Precio de venta', type: 'money', required: true, value: row?.priceMinor ?? null },
            { name: 'minStockMilli', label: 'Mínimo en bodega', type: 'quantity', value: row?.minStockMilli ?? null, hint: 'Por debajo de esto, el sistema avisa.' },
            creating ? { name: 'openingStockMilli', label: 'Cuánto hay hoy', type: 'quantity', value: null } : null,
            creating ? null : { name: 'active', type: 'checkbox', label: 'Estado', checkLabel: 'Se sigue vendiendo', value: row.active, wide: true }
        ],
        setup: form => {
            // Un servicio no lleva bodega: sus campos de existencias sobran.
            const kind = form.field('kind');
            const sync = () => {
                const good = (kind ? kind.control.value : row.kind) === 'good';
                form.show('minStockMilli', good);
                form.show('openingStockMilli', good);
            };
            kind?.control.addEventListener('change', sync);
            sync();
        },
        onSubmit: values => {
            const body = { ...values };
            for (const key of ['costMinor', 'minStockMilli', 'openingStockMilli']) if (body[key] === null || body[key] === undefined) delete body[key];
            return creating ? post(`${ctx.base}/products`, body) : patch(`${ctx.base}/products/${encodeURIComponent(row.id)}`, body);
        }
    });
}

/* ================================================================== *
 * Inventario
 * ================================================================== */

const MOVEMENT_OPTIONS = [
    { value: 'purchase', label: 'Entrada por compra' },
    { value: 'adjustment', label: 'Conteo: escribo cuánto hay' },
    { value: 'waste', label: 'Merma o daño' },
    { value: 'return', label: 'Devolución de un cliente' }
];

async function inventario(ctx) {
    const { base, currency } = ctx;
    const tab = ctx.query.get('ver') === 'movimientos' ? 'movimientos' : 'existencias';
    const costs = ctx.can('cost.read');
    const adjusts = ctx.can('inventory.adjust');
    const cash = minor => money(minor, currency);

    const head = pageHead({
        eyebrow: 'Control financiero',
        title: 'Inventario',
        lead: 'Cuánto hay en bodega, qué está por agotarse y qué lo movió.',
        actions: tabs([{ id: 'existencias', label: 'Existencias' }, { id: 'movimientos', label: 'Movimientos' }], tab,
            next => ctx.go('inventario', null, next === 'movimientos' ? { ver: 'movimientos' } : null), 'Vista del inventario')
    });

    if (tab === 'movimientos') {
        const { movements } = await get(`${base}/movements?limit=150`);
        return h('div', { class: 'stack' }, head,
            panel({ title: 'Últimos movimientos', hint: 'Cada entrada, salida o ajuste queda escrito. La existencia es la suma de todos.' },
                table({
                    label: 'Movimientos de inventario',
                    emptyText: 'Todavía no hay movimientos.',
                    rows: movements,
                    columns: [
                        { label: 'Fecha', render: row => day(row.date, { short: true }) },
                        { label: 'Producto', render: row => [row.productName, h('span', { class: 'sub', text: row.productCode })] },
                        { label: 'Qué pasó', render: row => [MOVEMENT_TYPES[row.type]?.label || row.type, row.ref?.number ? h('span', { class: 'sub', text: row.ref.number }) : (row.note ? h('span', { class: 'sub', text: row.note }) : null)] },
                        { label: 'Cantidad', num: true, render: row => `${row.quantityMilli > 0 ? '+' : ''}${qty(row.quantityMilli, row.unit)}` },
                        { label: 'Quedó', num: true, render: row => qty(row.balanceMilli, row.unit) },
                        { label: 'Quién', render: row => row.byName || '—' }
                    ]
                })));
    }

    const { products, totals } = await get(`${base}/products`);
    const goods = products.filter(row => row.kind === 'good');

    const move = async row => {
        const done = await movementForm(ctx, row);
        if (!done) return;
        toast(done.unchanged ? 'El conteo coincide: no hubo nada que ajustar.' : 'Movimiento registrado.');
        ctx.reload();
    };

    return h('div', { class: 'stack' }, head,
        kpis([
            costs ? { label: 'Valor en bodega', value: cash(totals.stockValueMinor), hint: 'Existencias al costo' } : null,
            { label: 'Por agotarse', value: String(totals.lowCount), tone: totals.lowCount ? 'warn' : '', hint: totals.lowCount ? 'En su mínimo o por debajo' : 'Nada en su mínimo' },
            { label: 'Agotados', value: String(totals.outCount), tone: totals.outCount ? 'bad' : '', hint: totals.outCount ? 'No se pueden vender' : 'Ninguno' },
            { label: 'Productos con bodega', value: String(totals.goods) }
        ]),
        panel({ title: 'Existencias' },
            table({
                label: 'Existencias',
                emptyText: 'Todavía no hay productos con existencias.',
                // Primero lo que pide atención: agotado, luego bajo, luego el resto.
                rows: [...goods].sort((a, b) => Number(b.out) - Number(a.out) || Number(b.low) - Number(a.low) || a.name.localeCompare(b.name, 'es')),
                columns: [
                    { label: 'Producto', render: row => [row.name, h('span', { class: 'sub', text: row.code })] },
                    { label: 'Hay', num: true, render: row => qty(row.onHandMilli, row.unit) },
                    { label: 'Mínimo', num: true, render: row => qty(row.minStockMilli, row.unit) },
                    { label: 'Estado', render: row => (row.out ? badge('Agotado', 'bad') : row.low ? badge('Por agotarse', 'warn') : badge('Bien', 'good')) },
                    costs ? { label: 'Valor', num: true, render: row => cash(row.stockValueMinor) } : null,
                    adjusts ? { label: '', tight: true, render: row => btn('Registrar movimiento', { small: true, onClick: () => move(row) }) } : null
                ].filter(Boolean),
                foot: costs ? ['Total', '', '', '', cash(totals.stockValueMinor), adjusts ? '' : null].filter(cell => cell !== null) : null
            })),
        adjusts ? null : notice('Su papel puede consultar el inventario, pero no registrar movimientos.', 'info'));
}

function movementForm(ctx, product) {
    const costs = ctx.can('cost.read');
    return formDialog({
        title: product.name,
        lead: `Hay ${qty(product.onHandMilli, product.unit)} en el sistema.`,
        submitLabel: 'Registrar',
        fields: [
            { name: 'type', label: 'Qué pasó', type: 'select', value: 'purchase', options: MOVEMENT_OPTIONS, wide: true },
            { name: 'quantityMilli', label: 'Cantidad', type: 'quantity', required: true },
            { name: 'countedMilli', label: 'Cuánto hay en bodega', type: 'quantity', required: true, hint: 'Escriba lo que contó. El sistema anota la diferencia.' },
            costs ? { name: 'unitCostMinor', label: 'Costo por unidad', type: 'money', hint: 'Si cambió, el sistema recalcula el costo promedio.' } : null,
            { name: 'note', label: 'Nota', maxlength: 200, wide: true }
        ],
        setup: form => {
            const type = form.field('type').control;
            const sync = () => {
                form.show('quantityMilli', type.value !== 'adjustment');
                form.show('countedMilli', type.value === 'adjustment');
                form.show('unitCostMinor', type.value === 'purchase');
            };
            type.addEventListener('change', sync);
            sync();
        },
        onSubmit: values => {
            const body = { productId: product.id, type: values.type, note: values.note };
            if (values.type === 'adjustment') body.countedMilli = values.countedMilli;
            else body.quantityMilli = values.quantityMilli;
            if (values.type === 'purchase' && values.unitCostMinor !== null && values.unitCostMinor !== undefined) body.unitCostMinor = values.unitCostMinor;
            return post(`${ctx.base}/movements`, body);
        }
    });
}
