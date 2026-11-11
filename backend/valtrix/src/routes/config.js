/**
 * La configuración pública de Firebase que el portal necesita para iniciar
 * sesión. No lleva nada secreto: la clave web identifica el proyecto y viaja
 * en cualquier aplicación Firebase del mundo; lo que protege los datos son las
 * reglas (que lo niegan todo) y este API.
 *
 * Se sirve en vez de escribirla en el HTML por dos razones prácticas: el
 * portal funciona igual contra los emuladores que contra producción sin tocar
 * un fichero, y si falta la configuración el portal lo dice con un mensaje en
 * vez de romperse con un error del SDK que nadie entiende.
 */

import { route } from '../lib/route.js';
import { json } from '../lib/http.js';

export const configRoutes = [
    route('GET', '/config', async ctx => {
        const { env } = ctx;
        const projectId = env.FIREBASE_PROJECT_ID || '';
        const apiKey = env.FIREBASE_API_KEY || '';
        const emulator = env.FIREBASE_AUTH_EMULATOR_HOST || '';

        return json({
            ready: Boolean(projectId && (apiKey || emulator)),
            projectId,
            apiKey,
            authDomain: `${projectId}.firebaseapp.com`,
            // Con esto el portal se conecta al emulador en local sin que el
            // código tenga que saber si está en desarrollo.
            authEmulatorHost: emulator || null
        }, 200, { 'cache-control': 'no-store' });
    })
];
