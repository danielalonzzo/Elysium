// GENERADO por scripts/sync-patrimonio-core.mjs desde Gestor-Patrimonios/js/core/text.js.
// No se edita aquí: se edita el original y se vuelve a ejecutar el script.
/**
 * Texto comparable: sin tildes ni diéresis, para que «Almacén» y «almacen»
 * sean el mismo comercio, la misma categoría o el mismo encabezado de CSV.
 */

const COMBINING_MARKS = /[̀-ͯ]/g;

export function stripAccents(value) {
    return String(value ?? '').normalize('NFD').replace(COMBINING_MARKS, '');
}

/** Minúsculas y sin tildes: la forma de comparar texto escrito a mano. */
export function plain(value) {
    return stripAccents(value).toLowerCase().trim();
}

/**
 * Clave para buscar: sin tildes, sin puntuación y con los separadores de miles
 * y de decimales pegados a sus cifras, así «15.000», «15000» y «15,000» son lo
 * mismo. A diferencia de `normalizeMerchant`, no quita «S.A.» ni «Inc».
 */
export function searchKey(value) {
    return plain(value)
        .replace(/(\d)[.,](?=\d)/g, '$1')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

/**
 * Las reglas de Firestore no admiten «<» ni «>» en el comercio ni en la nota
 * de un movimiento. Se cambian por sus comillas angulares, que se leen igual
 * («A > B» queda «A › B») y nunca hacen fallar un guardado.
 */
export function cleanText(value) {
    return String(value ?? '').replace(/</g, '‹').replace(/>/g, '›');
}
