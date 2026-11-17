/**
 * El núcleo compartido, visto desde el Worker.
 *
 * El motor (control financiero, orden operativo, auditoría, incorporación)
 * vive en `VALTRIX Engineering/js/core/`, dentro del sitio, porque lo ejecutan
 * tres anfitriones: este Worker, la demo en el navegador y las pruebas. Es una
 * sola fuente, no una copia: aquí solo se reexporta, para que la ruta larga
 * hasta la carpeta del sitio esté escrita en un único lugar.
 *
 * El día que VALTRIX tenga su repositorio, la carpeta del sitio pasa a ser la
 * raíz y esta ruta se acorta; nada más cambia.
 */

export * as audit from '../../../VALTRIX Engineering/js/core/audit.js';
export * as catalog from '../../../VALTRIX Engineering/js/core/catalog.js';
export * as erp from '../../../VALTRIX Engineering/js/core/erp.js';
export * as intake from '../../../VALTRIX Engineering/js/core/intake.js';
export * as money from '../../../VALTRIX Engineering/js/core/money.js';
export * as qms from '../../../VALTRIX Engineering/js/core/qms.js';
export * as routes from '../../../VALTRIX Engineering/js/core/routes.js';
export * as time from '../../../VALTRIX Engineering/js/core/time.js';
export * as validate from '../../../VALTRIX Engineering/js/core/validate.js';
export { DomainError, MESSAGES, isConflict, messageFor } from '../../../VALTRIX Engineering/js/core/errors.js';
export { StoreConflict, commitInChunks, engineScope, memoryStore, scopedStore } from '../../../VALTRIX Engineering/js/core/store.js';
