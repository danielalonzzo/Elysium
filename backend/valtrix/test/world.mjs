/**
 * Un negocio de prueba en memoria, con el reloj en la mano.
 *
 * Las pruebas del motor no levantan nada: el mismo código que en producción
 * escribe en Firestore aquí escribe en un Map. El reloj es inyectado porque
 * medio motor depende de «hoy» —vencimientos, cierres de mes, la lista de
 * tareas del día— y una prueba que dependa del día en que se ejecuta falla
 * sola el día menos pensado.
 */

import { engineScope, memoryStore, scopedStore } from '../../../VALTRIX Engineering/js/core/store.js';

export function world({ tenantId = 'taller-horizonte', now = '2026-11-14T16:00:00Z', timezone = 'America/Costa_Rica', root = memoryStore() } = {}) {
    const clock = { instant: new Date(now) };
    const denied = new Set();
    const tenant = { id: tenantId, name: 'Taller Horizonte', timezone, baseCurrency: 'CRC' };
    const store = scopedStore(root, `tenants/${tenantId}`);
    const scopeFor = (actor = { uid: 'ana', name: 'Ana Mora' }) => engineScope({
        store, tenant, actor,
        now: () => new Date(clock.instant),
        can: capability => !denied.has(capability)
    });
    return {
        root,
        store,
        scope: scopeFor(),
        scopeFor,
        /** Mueve el reloj: `at('2026-12-01T15:00:00Z')`. */
        at(iso) { clock.instant = new Date(iso); },
        /** Quita una capacidad de lectura, como le pasa a quien no ve costos. */
        deny(capability) { denied.add(capability); },
        allow(capability) { denied.delete(capability); }
    };
}

/** El código de un error del motor, o el error mismo si no era del motor. */
export async function codeOf(promise) {
    try {
        await promise;
        return null;
    } catch (error) {
        if (error?.code) return error.code;
        throw error;
    }
}

/**
 * Marcas inequívocas de tuteo. Todo texto de VALTRIX va de usted, en español de
 * Costa Rica. La lista es corta a propósito: «revisa» o «completa» son también
 * tercera persona («una lista que no se completa»), así que solo se buscan las
 * formas que no pueden ser otra cosa.
 */
export const TUTEO = /\b(tú|tu|tus|ti|contigo|tienes|puedes|quieres|debes|necesitas|estás|eres|sabes|haz|pon)\b/i;
