// GENERADO por scripts/sync-patrimonio-core.mjs desde Gestor-Patrimonios/js/core/backup.js.
// No se edita aquí: se edita el original y se vuelve a ejecutar el script.
/**
 * Copia de seguridad: lectura y validación del JSON que exporta Ajustes.
 *
 * Restaurar escribe en las colecciones de la persona, así que nada del archivo
 * se da por bueno: cada documento debe traer su `id`, ser un objeto llano y,
 * si es un movimiento, cumplir lo mismo que exigen las reglas de Firestore
 * (tipo, importe entero, moneda, fecha y cuenta). Lo que no cumple se cuenta
 * aparte con su motivo en vez de hacer fallar todo el lote.
 */
import { isISODate } from './dates.js';
import { isCurrency } from './money.js';
import { cleanText } from './text.js';

/** Tamaño máximo de un archivo de copia: más que eso no es una copia de Patrimonio. */
export const MAX_BACKUP_BYTES = 60 * 1024 * 1024;

const TYPES = new Set(['expense', 'income', 'transfer']);

function invalidTransaction(doc) {
    if (!TYPES.has(doc.type)) return 'tipo de movimiento desconocido';
    if (!Number.isInteger(doc.amountMinor) || doc.amountMinor <= 0 || doc.amountMinor >= 1e14) return 'importe no válido';
    if (!isCurrency(doc.currency)) return 'moneda no admitida';
    if (!isISODate(doc.date)) return 'fecha no válida';
    if (typeof doc.accountId !== 'string' || !doc.accountId || doc.accountId.length > 80) return 'sin cuenta';
    return null;
}

/**
 * @param {string} text          contenido del archivo
 * @param {string[]} collections colecciones que se pueden restaurar
 * @returns {{collections: Record<string, object[]>, counts: Record<string, number>, total: number,
 *   skipped: Array<{collection: string, id: string, reason: string}>, exportedAt: string|null}}
 */
export function parseBackup(text, collections) {
    let data;
    try {
        data = JSON.parse(String(text || ''));
    } catch {
        throw new Error('El archivo no es una copia de seguridad de Patrimonio (no es JSON válido).');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('El archivo no es una copia de seguridad de Patrimonio.');
    }
    const found = collections.filter(name => Array.isArray(data[name]));
    if (!found.length) throw new Error('El archivo no trae ninguna colección de Patrimonio (cuentas, movimientos, metas…).');

    const result = { collections: {}, counts: {}, total: 0, skipped: [], exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : null };
    for (const name of found) {
        const docs = [];
        for (const raw of data[name]) {
            const id = raw && typeof raw === 'object' ? raw.id : null;
            if (typeof id !== 'string' || !id || id.length > 200 || id.includes('/') || id === '.' || id === '..') {
                result.skipped.push({ collection: name, id: String(id ?? '?'), reason: 'sin identificador válido' });
                continue;
            }
            if (Array.isArray(raw)) {
                result.skipped.push({ collection: name, id, reason: 'no es un documento' });
                continue;
            }
            const doc = { ...raw };
            if (name === 'transactions') {
                const problem = invalidTransaction(doc);
                if (problem) {
                    result.skipped.push({ collection: name, id, reason: problem });
                    continue;
                }
                if (typeof doc.merchant === 'string') doc.merchant = cleanText(doc.merchant).slice(0, 120);
                if (typeof doc.note === 'string') doc.note = cleanText(doc.note).slice(0, 500);
            }
            docs.push(doc);
        }
        result.collections[name] = docs;
        result.counts[name] = docs.length;
        result.total += docs.length;
    }
    return result;
}
