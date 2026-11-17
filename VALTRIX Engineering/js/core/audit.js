/**
 * Auditoría mensual: el cierre del mes y qué hacer con él.
 *
 * Es el tercer mes de la suscripción. Al terminar cada mes el sistema revisa
 * los números y le deja al dueño un resumen con hallazgos y acciones para
 * ganar más el mes siguiente.
 *
 * Cómo está hecho, y por qué así:
 *
 *   · **Aquí no opina nadie.** Cada hallazgo sale de una regla escrita, con su
 *     umbral declarado en `THRESHOLDS`, sobre cifras que ya están en la base.
 *     El mismo mes da siempre el mismo informe. Un texto que cambiara de una
 *     vez a otra no serviría de evidencia de nada.
 *
 *   · **Recoger y redactar van separados.** `collect` lee; `compose` es una
 *     función pura que recibe esos datos y devuelve el informe. Lo que se
 *     prueba —y lo que habría que revisar si un hallazgo parece raro— es
 *     `compose`, sin base de datos de por medio.
 *
 *   · **El informe guarda sus frases.** Queda escrito tal como se leyó: si
 *     mañana se afina la redacción de una regla, el informe de octubre sigue
 *     diciendo lo que dijo en octubre.
 *
 *   · **Emitir el informe cierra el mes.** Desde ese momento, registrar o
 *     anular algo con fecha de ese mes responde PERIOD_CLOSED: un cierre que
 *     se pudiera reescribir por debajo no sería un cierre.
 *
 *   · **El cierre automático espera unos días** (`CLOSING_GRACE_DAYS`): un
 *     negocio pequeño apunta las ventas del 30 el día 1 o el 2. Quien ya
 *     terminó puede cerrar antes a mano.
 *
 *   · **La cartera y la bodega se miran al día del cierre**, no al último del
 *     mes: son existencias y saldos, y el sistema guarda los de hoy. El
 *     informe lo dice (`asOf`).
 */

import { raise, isConflict } from './errors.js';
import { ageReceivables, dailySeries, openReceivables, periodStats, today } from './erp.js';
import { formatMoney, formatPercent, formatQuantity, marginBp, multiply, ratioBp } from './money.js';
import { compliance, listEquipment } from './qms.js';
import { daysInMonth, diffDays, firstDay, lastDay, periodLabel, periodOf, shiftPeriod } from './time.js';
import * as v from './validate.js';

/** Días del mes siguiente que se esperan antes de cerrar solo el mes anterior. */
export const CLOSING_GRACE_DAYS = 2;

/** Los umbrales de cada regla. Cambiar uno cambia qué se considera un hallazgo. */
export const THRESHOLDS = Object.freeze({
    lowMarginBp: 1000,        // menos de 10 % de margen: el producto apenas paga su lugar
    targetMarginBp: 2000,     // margen que se toma como razonable al estimar una corrección de precio
    marginSwingBp: 200,       // variación del margen que merece decirse (2 puntos)
    salesSwingBp: 1000,       // variación de las ventas que merece decirse (10 %)
    coverDaysLow: 7,          // menos de una semana de existencias de algo que sí se vende
    coverDaysHigh: 90,        // más de tres meses de existencias
    deadStockShareBp: 1500,   // mercadería quieta por encima del 15 % de la bodega
    overdueShareBp: 3000,     // más del 30 % de la cartera vencida
    concentrationBp: 4000,    // un solo cliente con más del 40 % de la cartera
    creditShareBp: 5000,      // más de la mitad de las ventas a crédito
    wasteShareBp: 200,        // merma por encima del 2 % del costo de lo vendido
    complianceLowBp: 8000,    // menos del 80 % de las listas completadas
    complianceHighBp: 9500    // 95 % o más: se dice, porque también hay que decir lo que va bien
});

const TONE_ORDER = { bad: 0, warn: 1, info: 2, good: 3 };

const plural = (count, one, many) => (count === 1 ? one : many);

/** «A», «A y B», «A, B y C». */
function list(names) {
    if (names.length <= 1) return names.join('');
    return `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`;
}

/* ================================================================== *
 * Recoger
 * ================================================================== */

/**
 * Lee lo que el informe necesita. `until` corta el mes en un día: es lo que
 * distingue el avance del mes en curso del cierre de un mes terminado.
 */
export async function collect(scope, period, { modules = {}, until = null } = {}) {
    const [stats, previous, productRows, products, stock, open] = await Promise.all([
        periodStats(scope, period),
        periodStats(scope, shiftPeriod(period, -1)),
        scope.store.query('productStats', { where: [['period', '==', period]], limit: 3000 }),
        scope.store.query('products', { limit: 2000 }),
        scope.store.query('stock', { limit: 2000 }),
        openReceivables(scope)
    ]);
    let operations = null;
    if (modules.qms) {
        const [lists, equipment] = await Promise.all([compliance(scope, period, until), listEquipment(scope)]);
        operations = { compliance: lists, equipment: equipment.equipment };
    }
    return {
        period,
        until: until || lastDay(period),
        asOf: today(scope),
        business: scope.tenant.name,
        currency: scope.tenant.currency,
        stats,
        previous,
        productRows,
        products,
        stock,
        open,
        operations
    };
}

/* ================================================================== *
 * Redactar
 * ================================================================== */

/**
 * Convierte los datos del mes en el informe. Pura: sin base, sin reloj.
 * `final` distingue el cierre de un mes terminado del avance del mes en curso.
 */
export function compose(data, { final = true, generatedAt = null } = {}) {
    const { period, currency, stats, previous } = data;
    const money = minor => formatMoney(minor, currency);
    const total = daysInMonth(period);
    const elapsed = Math.max(1, diffDays(firstDay(period), data.until) + 1);
    const findings = [];
    const add = finding => findings.push({ impactMinor: 0, detail: '', action: '', ...finding });

    /* ---------- Ventas y margen ---------- */

    const sales = stats.salesMinor;
    const profit = sales - stats.costMinor;
    const margin = marginBp(sales, stats.costMinor);
    const previousMargin = marginBp(previous.salesMinor, previous.costMinor);
    const previousLabel = periodLabel(previous.period);

    if (sales <= 0) {
        add({
            code: 'NO_SALES', tone: 'warn',
            title: 'No hay ventas registradas en el mes',
            detail: 'Sin ventas registradas el sistema no puede decirle qué producto le deja ganancia.',
            action: 'Registre las ventas conforme ocurren, aunque sea una vez al día al cerrar caja.'
        });
    } else if (!final) {
        const projected = Math.round((sales / elapsed) * total);
        add({
            code: 'SALES_PACE', tone: 'info',
            title: `A este ritmo, el mes cerraría cerca de ${money(projected)}`,
            detail: previous.salesMinor > 0
                ? `Lleva ${money(sales)} en ${elapsed} ${plural(elapsed, 'día', 'días')}; ${previousLabel} cerró en ${money(previous.salesMinor)}.`
                : `Lleva ${money(sales)} en ${elapsed} ${plural(elapsed, 'día', 'días')}.`
        });
    } else if (previous.salesMinor > 0) {
        const change = ratioBp(sales - previous.salesMinor, previous.salesMinor);
        if (change >= THRESHOLDS.salesSwingBp) {
            add({
                code: 'SALES_UP', tone: 'good',
                title: `Las ventas subieron ${formatPercent(change)} frente a ${previousLabel}`,
                detail: `Vendió ${money(sales)}; el mes anterior fueron ${money(previous.salesMinor)}.`
            });
        } else if (change <= -THRESHOLDS.salesSwingBp) {
            add({
                code: 'SALES_DOWN', tone: 'warn', impactMinor: previous.salesMinor - sales,
                title: `Las ventas bajaron ${formatPercent(-change)} frente a ${previousLabel}`,
                detail: `Vendió ${money(sales)}; el mes anterior fueron ${money(previous.salesMinor)}.`,
                action: 'Revise abajo qué mercadería no se movió este mes: suele ser donde se fue la diferencia.'
            });
        } else {
            add({
                code: 'SALES_FLAT', tone: 'info',
                title: `Las ventas se mantuvieron frente a ${previousLabel}`,
                detail: `Vendió ${money(sales)}; el mes anterior fueron ${money(previous.salesMinor)}.`
            });
        }
    } else {
        add({ code: 'FIRST_MONTH', tone: 'info', title: 'Primer mes con ventas registradas', detail: `Vendió ${money(sales)} en ${stats.salesCount} ${plural(stats.salesCount, 'venta', 'ventas')}. Desde el mes entrante habrá con qué comparar.` });
    }

    if (final && margin !== null && previousMargin !== null && Math.abs(margin - previousMargin) >= THRESHOLDS.marginSwingBp) {
        const up = margin > previousMargin;
        add({
            code: up ? 'MARGIN_UP' : 'MARGIN_DOWN', tone: up ? 'good' : 'warn',
            title: `El margen ${up ? 'subió' : 'bajó'} de ${formatPercent(previousMargin)} a ${formatPercent(margin)}`,
            detail: `De cada ${money(100000)} vendidos le quedaron ${money(Math.round(margin * 10))} antes de gastos.`,
            action: up ? '' : 'Compare los costos de lo que más vendió con los del mes anterior: un proveedor que subió precios se nota aquí primero.'
        });
    }

    /* ---------- Productos ---------- */

    const byId = new Map(data.products.map(row => [row.id, row]));
    const levels = new Map(data.stock.map(row => [row.id, row]));
    const sold = data.productRows
        .filter(row => row.salesMinor > 0 || row.quantityMilli > 0)
        .map(row => ({
            productId: row.productId, code: row.code, name: row.name, kind: row.kind, unit: row.unit || '',
            quantityMilli: row.quantityMilli, salesMinor: row.salesMinor, costMinor: row.costMinor,
            profitMinor: row.salesMinor - row.costMinor, marginBp: marginBp(row.salesMinor, row.costMinor),
            noCost: row.kind === 'good' && row.costMinor === 0 && row.salesMinor > 0
        }))
        .sort((a, b) => b.profitMinor - a.profitMinor);

    const withoutCost = sold.filter(row => row.noCost);
    const reliable = sold.filter(row => !row.noCost);
    const losing = reliable.filter(row => row.profitMinor < 0).sort((a, b) => a.profitMinor - b.profitMinor);
    const lowMargin = reliable.filter(row => row.profitMinor >= 0 && row.marginBp !== null && row.marginBp < THRESHOLDS.lowMarginBp && row.kind === 'good');
    const best = reliable.filter(row => row.profitMinor > 0).slice(0, 5);

    if (losing.length) {
        const lost = losing.reduce((sum, row) => sum - row.profitMinor, 0);
        add({
            code: 'LOSING_PRODUCTS', tone: 'bad', impactMinor: lost,
            title: losing.length === 1
                ? `${losing[0].name} se vendió por debajo de su costo`
                : `${losing.length} productos se vendieron por debajo de su costo`,
            detail: losing.slice(0, 3).map(row => `${row.name}: vendió ${money(row.salesMinor)} y le costó ${money(row.costMinor)}.`).join(' '),
            action: `Suba el precio de ${list(losing.slice(0, 3).map(row => row.name))} o revise su costo con el proveedor antes de reponer: este mes le ${plural(losing.length, 'costó', 'costaron')} ${money(lost)}.`
        });
    }
    if (lowMargin.length) {
        const gain = lowMargin.reduce((sum, row) => sum + Math.max(0, Math.round((row.salesMinor * (THRESHOLDS.targetMarginBp - row.marginBp)) / 10000)), 0);
        add({
            code: 'LOW_MARGIN', tone: 'warn', impactMinor: gain,
            title: lowMargin.length === 1
                ? `${lowMargin[0].name} deja menos de ${formatPercent(THRESHOLDS.lowMarginBp)}`
                : `${lowMargin.length} productos dejan menos de ${formatPercent(THRESHOLDS.lowMarginBp)}`,
            detail: lowMargin.slice(0, 3).map(row => `${row.name}: ${formatPercent(row.marginBp)}.`).join(' '),
            action: `Revise el precio de ${list(lowMargin.slice(0, 3).map(row => row.name))}: con un margen de ${formatPercent(THRESHOLDS.targetMarginBp)} le ${plural(lowMargin.length, 'habría', 'habrían')} dejado ${money(gain)} más este mes.`
        });
    }
    if (best.length && profit > 0) {
        const top = best.slice(0, 3);
        const share = ratioBp(top.reduce((sum, row) => sum + row.profitMinor, 0), reliable.filter(row => row.profitMinor > 0).reduce((sum, row) => sum + row.profitMinor, 0));
        add({
            code: 'BEST_PRODUCTS', tone: 'good',
            title: top.length === 1
                ? `${top[0].name} es lo que más ganancia le dejó`
                : `${list(top.map(row => row.name))} dejaron el ${formatPercent(share)} de la ganancia`,
            detail: top.map(row => `${row.name}: ${money(row.profitMinor)} (${formatPercent(row.marginBp)}).`).join(' ')
        });
    }
    if (withoutCost.length) {
        add({
            code: 'WITHOUT_COST', tone: 'warn',
            title: withoutCost.length === 1
                ? `${withoutCost[0].name} se vendió y no tiene costo registrado`
                : `${withoutCost.length} productos vendidos no tienen costo registrado`,
            detail: `${list(withoutCost.slice(0, 4).map(row => row.name))}. Sin costo, el margen no se puede calcular y ${plural(withoutCost.length, 'queda', 'quedan')} fuera de la comparación.`,
            action: `Complete el costo en la ficha de ${plural(withoutCost.length, 'ese producto', 'cada uno')}: es un dato que se pone una vez.`
        });
    }

    /* ---------- Bodega ---------- */

    const soldQuantity = new Map(sold.map(row => [row.productId, row]));
    const goods = data.products.filter(row => row.kind === 'good' && row.active !== false);
    const inventoryValue = goods.reduce((sum, row) => sum + multiply(Math.max(0, levels.get(row.id)?.onHandMilli || 0), row.costMinor || 0), 0);

    const atRisk = [];
    const overstock = [];
    const dead = [];
    for (const product of goods) {
        const onHand = levels.get(product.id)?.onHandMilli || 0;
        const movement = soldQuantity.get(product.id);
        const value = multiply(Math.max(0, onHand), product.costMinor || 0);
        if (movement && movement.quantityMilli > 0) {
            // Días que duran las existencias al ritmo a que se vendió este mes.
            const cover = onHand <= 0 ? 0 : Math.floor((onHand * elapsed) / movement.quantityMilli);
            const daily = movement.quantityMilli / elapsed;
            if (cover < THRESHOLDS.coverDaysLow) {
                atRisk.push({
                    productId: product.id, name: product.name, unit: product.unit, onHandMilli: onHand, coverDays: cover, out: onHand <= 0,
                    weeklyProfitMinor: Math.max(0, Math.round((movement.profitMinor / elapsed) * 7))
                });
            } else if (cover > THRESHOLDS.coverDaysHigh) {
                const needed = Math.round(daily * THRESHOLDS.coverDaysHigh);
                overstock.push({ productId: product.id, name: product.name, coverDays: cover, excessMinor: multiply(Math.max(0, onHand - needed), product.costMinor || 0) });
            }
        } else if (onHand > 0 && value > 0 && (!product.createdAt || product.createdAt.slice(0, 10) < firstDay(period))) {
            // Solo cuenta lo que estuvo en bodega todo el mes: algo dado de
            // alta la semana pasada no «lleva un mes sin moverse».
            dead.push({ productId: product.id, name: product.name, unit: product.unit, onHandMilli: onHand, valueMinor: value });
        }
    }
    atRisk.sort((a, b) => b.weeklyProfitMinor - a.weeklyProfitMinor);
    dead.sort((a, b) => b.valueMinor - a.valueMinor);
    overstock.sort((a, b) => b.excessMinor - a.excessMinor);
    const deadValue = dead.reduce((sum, row) => sum + row.valueMinor, 0);

    if (atRisk.length) {
        const out = atRisk.filter(row => row.out);
        const weekly = atRisk.reduce((sum, row) => sum + row.weeklyProfitMinor, 0);
        add({
            code: 'STOCKOUT_RISK', tone: out.length ? 'bad' : 'warn', impactMinor: weekly,
            title: out.length
                ? `${out.length} ${plural(out.length, 'producto que sí se vende está agotado', 'productos que sí se venden están agotados')}`
                : `${atRisk.length} ${plural(atRisk.length, 'producto que sí se vende está por agotarse', 'productos que sí se venden están por agotarse')}`,
            detail: atRisk.slice(0, 4).map(row => (row.out
                ? `${row.name}: agotado.`
                : `${row.name}: ${plural(row.onHandMilli / 1000, 'queda', 'quedan')} ${formatQuantity(row.onHandMilli)}, para ${row.coverDays} ${plural(row.coverDays, 'día', 'días')}.`)).join(' '),
            action: `Reponga primero ${list(atRisk.slice(0, 3).map(row => row.name))}: una semana sin ${plural(atRisk.length, 'él', 'ellos')} son cerca de ${money(weekly)} de ganancia que no entra.`
        });
    }
    if (dead.length) {
        const share = ratioBp(deadValue, inventoryValue);
        add({
            code: 'DEAD_STOCK', tone: share !== null && share >= THRESHOLDS.deadStockShareBp ? 'warn' : 'info', impactMinor: deadValue,
            title: `${money(deadValue)} en mercadería que no se movió en todo el mes`,
            detail: dead.slice(0, 4).map(row => `${row.name}: ${formatQuantity(row.onHandMilli)} en bodega, ${money(row.valueMinor)}.`).join(' '),
            action: `Antes de comprar más de ${list(dead.slice(0, 3).map(row => row.name))}, ${plural(dead.length, 'ofrézcalo', 'ofrézcalos')} con descuento o en combo: es plata quieta en la bodega.`
        });
    }
    if (overstock.length) {
        const excess = overstock.reduce((sum, row) => sum + row.excessMinor, 0);
        add({
            code: 'OVERSTOCK', tone: 'info', impactMinor: excess,
            title: overstock.length === 1
                ? `${overstock[0].name} tiene existencias para más de tres meses`
                : `${overstock.length} productos tienen existencias para más de tres meses`,
            detail: overstock.slice(0, 3).map(row => `${row.name}: para ${row.coverDays} días.`).join(' '),
            action: `Compre menos de ${list(overstock.slice(0, 3).map(row => row.name))} el mes entrante: hay ${money(excess)} de más inmovilizados.`
        });
    }
    if (stats.wasteMinor > 0) {
        const share = ratioBp(stats.wasteMinor, stats.costMinor);
        if (share === null || share >= THRESHOLDS.wasteShareBp) {
            add({
                code: 'WASTE', tone: 'warn', impactMinor: stats.wasteMinor,
                title: `Se perdieron ${money(stats.wasteMinor)} en merma o daño`,
                detail: share === null ? '' : `Equivale al ${formatPercent(share)} del costo de lo que vendió.`,
                action: 'Revise dónde ocurre —almacenamiento, vencimiento o manipulación—: es ganancia que se pierde antes de vender.'
            });
        }
    }

    /* ---------- Cartera ---------- */

    const aged = ageReceivables(data.open, data.asOf);
    if (aged.totalMinor > 0) {
        const overdue = aged.customers.filter(row => row.overdueMinor > 0);
        if (aged.overdueMinor > 0) {
            const share = ratioBp(aged.overdueMinor, aged.totalMinor);
            const callFirst = overdue.slice(0, 3);
            add({
                code: 'RECEIVABLES_OVERDUE', tone: share >= THRESHOLDS.overdueShareBp ? 'bad' : 'warn', impactMinor: aged.overdueMinor,
                title: `Le deben ${money(aged.totalMinor)}, y ${money(aged.overdueMinor)} ya está vencido`,
                detail: callFirst.map(row => `${row.name}: ${money(row.overdueMinor)}, ${row.daysOverdue} ${plural(row.daysOverdue, 'día', 'días')} de atraso.`).join(' '),
                action: `Llame esta semana a ${list(callFirst.map(row => row.name))}: ${plural(callFirst.length, 'debe', 'suman')} ${money(callFirst.reduce((sum, row) => sum + row.overdueMinor, 0))} vencidos.`
            });
        } else {
            add({ code: 'RECEIVABLES_CURRENT', tone: 'good', title: `Le deben ${money(aged.totalMinor)} y nada está vencido`, detail: `${aged.customers.length} ${plural(aged.customers.length, 'cliente con saldo', 'clientes con saldo')}, todos dentro del plazo.` });
        }
        const biggest = [...aged.customers].sort((a, b) => b.balanceMinor - a.balanceMinor)[0];
        const concentration = ratioBp(biggest.balanceMinor, aged.totalMinor);
        if (aged.customers.length > 1 && concentration >= THRESHOLDS.concentrationBp) {
            add({
                code: 'RECEIVABLES_CONCENTRATED', tone: 'warn', impactMinor: biggest.balanceMinor,
                title: `${biggest.name} concentra el ${formatPercent(concentration)} de lo que le deben`,
                detail: `Le debe ${money(biggest.balanceMinor)}. Si se atrasa, se atrasa casi toda su cartera.`,
                action: `Acuerde con ${biggest.name} abonos parciales antes de darle más crédito.`
            });
        }
    }
    if (sales > 0 && stats.creditSalesMinor > 0) {
        const creditShare = ratioBp(stats.creditSalesMinor, sales);
        if (creditShare >= THRESHOLDS.creditShareBp && stats.collectedMinor < stats.creditSalesMinor) {
            add({
                code: 'CREDIT_GAP', tone: 'warn', impactMinor: stats.creditSalesMinor - stats.collectedMinor,
                title: `Fió ${money(stats.creditSalesMinor)} y cobró ${money(stats.collectedMinor)}`,
                detail: `El ${formatPercent(creditShare)} de lo vendido fue a crédito. La diferencia es plata que salió del negocio y todavía no vuelve.`,
                action: 'Ponga un tope de crédito por cliente y cobre lo vencido antes de fiar de nuevo.'
            });
        }
    }

    /* ---------- Operación ---------- */

    let operations = null;
    if (data.operations) {
        const lists = data.operations.compliance;
        const overdue = data.operations.equipment.filter(row => row.status === 'overdue');
        const dueSoon = data.operations.equipment.filter(row => row.status === 'due_soon');
        operations = {
            compliance: { rateBp: lists.rateBp, expected: lists.expected, completed: lists.completed, worst: lists.processes.slice(0, 5) },
            maintenance: {
                done: stats.maintenanceCount || 0,
                costMinor: stats.maintenanceMinor || 0,
                overdue: overdue.map(row => ({ id: row.id, name: row.name, nextDueOn: row.nextDueOn, days: row.days })),
                dueSoon: dueSoon.map(row => ({ id: row.id, name: row.name, nextDueOn: row.nextDueOn, days: row.days }))
            }
        };
        if (lists.rateBp !== null && lists.rateBp < THRESHOLDS.complianceLowBp) {
            const worst = lists.processes.slice(0, 3);
            add({
                code: 'TASKS_LOW', tone: 'warn',
                title: `Las listas de tareas se completaron el ${formatPercent(lists.rateBp)} de las veces`,
                detail: worst.map(row => `${row.name}: ${row.completed} de ${row.expected}.`).join(' '),
                action: `Converse con el equipo sobre ${list(worst.slice(0, 2).map(row => row.name))}: una lista que no se completa suele sobrar, estar mal asignada o tener pasos de más.`
            });
        } else if (lists.rateBp !== null && lists.rateBp >= THRESHOLDS.complianceHighBp) {
            add({ code: 'TASKS_HIGH', tone: 'good', title: `Las listas de tareas se completaron el ${formatPercent(lists.rateBp)} de las veces`, detail: `${lists.completed} de ${lists.expected} en el mes.` });
        }
        if (overdue.length) {
            add({
                code: 'MAINTENANCE_OVERDUE', tone: 'bad',
                title: `${overdue.length} ${plural(overdue.length, 'equipo tiene', 'equipos tienen')} el mantenimiento vencido`,
                detail: overdue.slice(0, 4).map(row => `${row.name}: ${-row.days} ${plural(-row.days, 'día', 'días')} de atraso.`).join(' '),
                action: `Agende esta semana el mantenimiento de ${list(overdue.slice(0, 3).map(row => row.name))}: una máquina parada cuesta más que su revisión.`
            });
        }
    }

    /* ---------- El informe ---------- */

    findings.sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone] || b.impactMinor - a.impactMinor);
    const lowRows = goods
        .map(row => ({ row, level: levels.get(row.id) }))
        .filter(({ level, row }) => (level?.onHandMilli || 0) <= (row.minStockMilli || 0));

    return {
        period,
        label: periodLabel(period),
        status: final ? 'final' : 'preview',
        asOf: data.asOf,
        until: data.until,
        generatedAt,
        business: data.business,
        currency,
        days: { elapsed, total },
        sales: {
            totalMinor: sales, costMinor: stats.costMinor, profitMinor: profit, marginBp: margin,
            count: stats.salesCount, averageMinor: stats.salesCount ? Math.round(sales / stats.salesCount) : 0,
            cashMinor: stats.cashSalesMinor, creditMinor: stats.creditSalesMinor,
            previous: { period: previous.period, totalMinor: previous.salesMinor, profitMinor: previous.salesMinor - previous.costMinor, marginBp: previousMargin },
            daily: dailySeries(stats, data.until).map(row => ({ day: row.day, salesMinor: row.salesMinor, profitMinor: row.salesMinor - row.costMinor }))
        },
        cash: {
            inMinor: stats.cashSalesMinor + stats.collectedMinor,
            collectedMinor: stats.collectedMinor,
            purchasesMinor: stats.purchasesMinor,
            maintenanceMinor: stats.maintenanceMinor || 0
        },
        products: {
            sold: sold.length,
            best,
            losing: losing.slice(0, 5),
            lowMargin: lowMargin.slice(0, 5),
            withoutCost: withoutCost.length
        },
        inventory: {
            valueMinor: inventoryValue,
            goods: goods.length,
            lowCount: lowRows.filter(({ level }) => (level?.onHandMilli || 0) > 0).length,
            outCount: lowRows.filter(({ level }) => (level?.onHandMilli || 0) <= 0).length,
            atRisk: atRisk.slice(0, 6),
            dead: dead.slice(0, 6),
            deadValueMinor: deadValue,
            wasteMinor: stats.wasteMinor
        },
        receivables: { totalMinor: aged.totalMinor, overdueMinor: aged.overdueMinor, buckets: aged.buckets, top: aged.customers.slice(0, 5) },
        operations,
        findings,
        // Lo que hay que hacer, de lo más urgente a lo menos: es lo que el
        // dueño lee si solo lee una cosa.
        actions: findings.filter(finding => finding.action).slice(0, 5).map(finding => finding.action)
    };
}

/* ================================================================== *
 * Emitir y consultar
 * ================================================================== */

function reportRow(report) {
    return {
        period: report.period,
        label: report.label,
        generatedAt: report.generatedAt,
        salesMinor: report.sales.totalMinor,
        profitMinor: report.sales.profitMinor,
        marginBp: report.sales.marginBp,
        findings: report.findings.length,
        urgent: report.findings.filter(finding => finding.tone === 'bad').length,
        currency: report.currency
    };
}

/** El avance del mes en curso. No se guarda: mañana será otro. */
export async function previewReport(scope, { modules = {} } = {}) {
    const now = today(scope);
    const data = await collect(scope, periodOf(now), { modules, until: now });
    return { report: compose(data, { final: false, generatedAt: scope.now().toISOString() }) };
}

/** Emite el cierre de un mes terminado. Solo se emite una vez. */
export async function generateReport(scope, period, { modules = {} } = {}) {
    v.period(period, 'period');
    if (period >= periodOf(today(scope))) raise('PERIOD_NOT_FINISHED');
    if (await scope.store.get('reports', period)) raise('PERIOD_CLOSED', { period });
    const data = await collect(scope, period, { modules });
    const report = compose(data, { final: true, generatedAt: scope.now().toISOString() });
    try {
        await scope.store.commit([scope.store.write.create('reports', period, { ...report, generatedBy: scope.actor.uid })]);
    } catch (error) {
        // Dos cierres del mismo mes a la vez: gana uno y el otro se entera.
        if (isConflict(error)) raise('PERIOD_CLOSED', { period });
        throw error;
    }
    return { report };
}

/**
 * El cierre automático: emite el del mes anterior si ya pasaron los días de
 * gracia y todavía no existe. Devuelve null cuando no hay nada que hacer, que
 * es lo normal 29 días al mes.
 */
export async function closeIfDue(scope, { modules = {} } = {}) {
    const now = today(scope);
    if (Number(now.slice(8, 10)) <= CLOSING_GRACE_DAYS) return null;
    const period = shiftPeriod(periodOf(now), -1);
    if (await scope.store.get('reports', period)) return null;
    try {
        return (await generateReport(scope, period, { modules })).report;
    } catch (error) {
        if (error?.code === 'PERIOD_CLOSED') return null;
        throw error;
    }
}

export async function listReports(scope) {
    const rows = await scope.store.query('reports', { limit: 120 });
    const now = today(scope);
    const lastFinished = shiftPeriod(periodOf(now), -1);
    return {
        reports: rows.sort((a, b) => b.period.localeCompare(a.period)).map(reportRow),
        // El mes anterior, si todavía no se ha cerrado: es el que se puede emitir a mano.
        pending: rows.some(row => row.period === lastFinished) ? null : { period: lastFinished, label: periodLabel(lastFinished) },
        today: now
    };
}

export async function getReport(scope, period) {
    const row = await scope.store.get('reports', v.period(period, 'period'));
    if (!row) raise('NOT_FOUND');
    const { id, _updateTime, generatedBy, ...report } = row;
    return { report };
}
