/**
 * Contexto compartido de la app: el almacén, el modelo derivado y la
 * navegación. Las vistas y las hojas lo importan de aquí en vez de recibirlo
 * encadenado, para no crear dependencias circulares con `app.js`.
 */
import { getModel } from './model.js';
import { go as navigate } from './router.js';
import { closeAllSheets, hasOpenSheet } from './ui/overlay.js';
import { setDisplayCurrency } from './ui/format.js';

export const app = {
    store: null,
    user: null,
    mode: 'demo',
    model() {
        const model = getModel(app.store);
        setDisplayCurrency(model.fx.base);
        return model;
    },
    async go(hash, options) {
        if (hasOpenSheet()) await closeAllSheets();
        navigate(hash, options);
    },
    rerender: () => {},
    /** Preferencias de la persona que consultan módulos sin modelo a mano. */
    prefs: {
        get sounds() { return app.store?.profile?.settings?.sounds === true; }
    }
};
