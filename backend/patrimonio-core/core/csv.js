// GENERADO por scripts/sync-patrimonio-core.mjs desde Gestor-Patrimonios/js/core/csv.js.
// No se edita aquí: se edita el original y se vuelve a ejecutar el script.
/**
 * CSV de entrada y salida.
 *
 * Salida: separador `;` y BOM UTF-8, que es lo que Excel en español abre sin
 * preguntar (con `,` mete todo en una columna, porque en es-CR la coma es el
 * decimal). Cada celda que empiece por igual, más, menos o arroba se neutraliza con un apóstrofo:
 * es la inyección de fórmulas que ya evita `safeCsvCell` en el CRM.
 *
 * Entrada: detecta el separador, respeta comillas y convierte filas en
 * movimientos con un mapeo de columnas elegido por la persona (para traer su
 * Excel de antes).
 */
import { parseAmount } from './money.js';
import { parseDateLoose } from './dates.js';
import { plain, stripAccents, cleanText } from './text.js';

const BOM = '\uFEFF';

export function safeCsvCell(value) {
    if (value == null) return '';
    let text = String(value);
    if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+([.,]\d+)?$/.test(text)) text = `'${text}`;
    // El separador es «;»: la coma decimal («-12500,50») no obliga a entrecomillar.
    if (/[";\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
    return text;
}

/**
 * @param {Array<object>} rows
 * @param {Array<{key: string, label: string, format?: (value: any, row: object) => any}>} columns
 */
export function toCSV(rows, columns) {
    const header = columns.map(column => safeCsvCell(column.label)).join(';');
    const body = rows.map(row => columns.map(column => {
        const value = column.format ? column.format(row[column.key], row) : row[column.key];
        return safeCsvCell(value);
    }).join(';'));
    return BOM + [header, ...body].join('\r\n');
}

export function detectDelimiter(text) {
    const sample = String(text).split(/\r?\n/).slice(0, 5).join('\n');
    const counts = [';', ',', '\t'].map(sep => ({ sep, count: sample.split(sep).length - 1 }));
    counts.sort((a, b) => b.count - a.count);
    return counts[0].count > 0 ? counts[0].sep : ',';
}

/** Parser CSV con comillas dobles (RFC 4180, tolerante). */
export function parseCSV(input, delimiter = null) {
    const text = String(input || '').replace(/^\uFEFF/, '');
    const sep = delimiter || detectDelimiter(text);
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
            else if (char === '"') quoted = false;
            else cell += char;
            continue;
        }
        if (char === '"' && cell === '') quoted = true;
        else if (char === sep) { row.push(cell); cell = ''; }
        else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n') i += 1;
            row.push(cell);
            if (row.some(value => value.trim() !== '')) rows.push(row);
            row = [];
            cell = '';
        } else cell += char;
    }
    row.push(cell);
    if (row.some(value => value.trim() !== '')) rows.push(row);
    return rows.map(r => r.map(value => value.trim()));
}

const HEADER_HINTS = {
    date: ['fecha', 'date', 'dia', 'día'],
    description: ['descripcion', 'descripción', 'detalle', 'concepto', 'comercio', 'description', 'merchant', 'nota'],
    amount: ['monto', 'importe', 'valor', 'amount', 'total', 'cantidad'],
    income: ['ingreso', 'ingresos', 'credito', 'crédito', 'abono', 'entrada'],
    expense: ['gasto', 'gastos', 'debito', 'débito', 'cargo', 'salida'],
    category: ['categoria', 'categoría', 'category', 'tipo de gasto', 'rubro'],
    type: ['tipo', 'type', 'movimiento']
};

/** Propone qué columna es qué a partir de los encabezados. */
export function guessMapping(headers) {
    const normalized = headers.map(plain);
    const mapping = {};
    for (const [field, hints] of Object.entries(HEADER_HINTS)) {
        const plainHints = hints.map(stripAccents);
        const index = normalized.findIndex((header, i) =>
            !Object.values(mapping).includes(i) && plainHints.some(hint => header === hint || header.includes(hint)));
        if (index !== -1) mapping[field] = index;
    }
    return mapping;
}

/**
 * Convierte filas en borradores de movimiento. Admite un monto con signo
 * (negativo = gasto), o columnas separadas de ingreso y gasto, o una columna
 * «tipo» con «ingreso»/«gasto».
 *
 * @returns {{items: Array, errors: Array<{row: number, reason: string}>}}
 */
export function rowsToTransactions(rows, mapping, { hasHeader = true, defaultType = 'expense' } = {}) {
    const items = [];
    const errors = [];
    const data = hasHeader ? rows.slice(1) : rows;
    data.forEach((row, index) => {
        const line = index + (hasHeader ? 2 : 1);
        const date = parseDateLoose(row[mapping.date]);
        if (!date) { errors.push({ row: line, reason: 'Fecha no reconocida' }); return; }

        let type = defaultType;
        let amountMinor = null;
        if (mapping.income !== undefined || mapping.expense !== undefined) {
            const income = parseAmount(row[mapping.income]);
            const expense = parseAmount(row[mapping.expense]);
            if (income) { type = 'income'; amountMinor = Math.abs(income); }
            else if (expense) { type = 'expense'; amountMinor = Math.abs(expense); }
        } else if (mapping.amount !== undefined) {
            const value = parseAmount(row[mapping.amount]);
            if (value !== null) {
                amountMinor = Math.abs(value);
                if (value < 0) type = 'expense';
                else if (mapping.type === undefined) type = defaultType;
            }
        }
        if (mapping.type !== undefined) {
            const label = String(row[mapping.type] || '').toLowerCase();
            if (/ingres|entrad|abono|cr[eé]dito|income/.test(label)) type = 'income';
            else if (/gast|salid|cargo|d[eé]bito|expense/.test(label)) type = 'expense';
        }
        if (!amountMinor) { errors.push({ row: line, reason: 'Monto vacío o no numérico' }); return; }

        items.push({
            date,
            type,
            amountMinor,
            merchant: mapping.description !== undefined ? cleanText(String(row[mapping.description] || '')).trim().slice(0, 120) : '',
            categoryLabel: mapping.category !== undefined ? String(row[mapping.category] || '').trim() : ''
        });
    });
    return { items, errors };
}

const TYPE_NAMES = Object.freeze({ expense: 'Gasto', income: 'Ingreso', transfer: 'Transferencia' });
const decimal = minor => (minor / 100).toFixed(2).replace('.', ',');

/**
 * Movimientos en CSV, con los gastos en negativo. Los nombres de categoría,
 * cuenta y medio de pago los resuelve quien llama (`names`), para que este
 * módulo siga siendo puro.
 *
 * @param {Array<object>} txs
 * @param {{category: (id: string) => string, account: (id: string) => string, method?: (id: string) => string, title?: (tx: object) => string}} names
 */
export function transactionsToCSV(txs, names) {
    return toCSV(txs, [
        { key: 'date', label: 'Fecha' },
        { key: 'type', label: 'Tipo', format: v => TYPE_NAMES[v] || v },
        { key: 'merchant', label: 'Descripción', format: (v, tx) => v || names.title?.(tx) || '' },
        { key: 'categoryId', label: 'Categoría', format: v => (v ? names.category(v) : '') },
        { key: 'accountId', label: 'Cuenta', format: v => (v ? names.account(v) : '') },
        { key: 'toAccountId', label: 'Cuenta destino', format: v => (v ? names.account(v) : '') },
        { key: 'currency', label: 'Moneda' },
        { key: 'amountMinor', label: 'Monto', format: (v, tx) => decimal(tx.type === 'expense' ? -v : v) },
        { key: 'method', label: 'Medio', format: v => (v && names.method ? names.method(v) : '') },
        { key: 'impulsive', label: 'Impulsivo', format: v => (v ? 'Sí' : '') },
        { key: 'tags', label: 'Etiquetas', format: v => (v || []).join(', ') },
        { key: 'note', label: 'Nota' }
    ]);
}

/**
 * Separa, de lo que se va a importar, lo que ya está registrado en esa cuenta
 * (misma fecha, tipo, monto y descripción). Cuenta repeticiones: dos cafés
 * iguales el mismo día son dos cafés, pero importar dos veces el mismo
 * archivo no duplica nada.
 */
export function splitDuplicates(items, existing, accountId) {
    const key = tx => [tx.date, tx.type, tx.amountMinor, plain(tx.merchant)].join('|');
    const available = new Map();
    for (const tx of existing || []) {
        if (tx.accountId !== accountId) continue;
        available.set(key(tx), (available.get(key(tx)) || 0) + 1);
    }
    const fresh = [];
    const duplicates = [];
    for (const item of items || []) {
        const itemKey = key(item);
        const left = available.get(itemKey) || 0;
        if (left > 0) {
            available.set(itemKey, left - 1);
            duplicates.push(item);
        } else {
            fresh.push(item);
        }
    }
    return { fresh, duplicates };
}
