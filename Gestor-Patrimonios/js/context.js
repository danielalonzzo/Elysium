/**
 * Contexto compartido de la app: el almacén, el modelo derivado y la
 * navegación. Las vistas y las hojas lo importan de aquí en vez de recibirlo
 * encadenado, para no crear dependencias circulares con `app.js`.
 */
import { getModel } from './model.js';
import { go as navigate } from './router.js';
import { closeAllSheets, hasOpenSheet } from './ui/overlay.js';

export const app = {
    store: null,
    user: null,
    mode: 'demo',
    model() {
        return getModel(app.store);
    },
    async go(hash, options) {
        if (hasOpenSheet()) await closeAllSheets();
        navigate(hash, options);
    },
    rerender: () => {},
    /** Preferencias locales del dispositivo (no viajan a Firestore). */
    prefs: {
        get sounds() { return app.model()?.settings?.sounds === true; }
    }
};
