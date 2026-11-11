/**
 * Declaración de una ruta.
 *
 * Vive aparte del enrutador a propósito: si `route` se exportara desde
 * `api.js`, que a su vez importa los módulos de rutas, el ciclo haría que
 * `route` todavía no existiera cuando esos módulos se evalúan, y el Worker
 * caería al arrancar con «route is not a function». Pasó.
 */
export const route = (method, path, run) => ({ method, path, run });
