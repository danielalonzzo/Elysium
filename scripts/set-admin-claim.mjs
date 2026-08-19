#!/usr/bin/env node
/**
 * Pone (o quita) el custom claim `admin` en una cuenta de Firebase Auth.
 *
 * El rol de administrador estaba anclado a una dirección de correo repetida en
 * `firestore.rules`, `storage.rules`, `JS/admin.js` y `JS/profiles.js`: añadir
 * un socio o cambiar de dirección obligaba a redesplegar las reglas de
 * seguridad. El claim lo convierte en un dato de la cuenta, revocable y sin
 * tocar código.
 *
 *   node scripts/set-admin-claim.mjs alguien@ejemplo.com
 *   node scripts/set-admin-claim.mjs alguien@ejemplo.com --revoke
 *
 * Credenciales: necesita las de servicio del proyecto, por
 * GOOGLE_APPLICATION_CREDENTIALS apuntando al JSON de una cuenta de servicio.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=~/elysium-sa.json \
 *     node scripts/set-admin-claim.mjs daniel.morales@elysiumdr.eu
 *
 * El claim viaja dentro del ID token, así que NO surte efecto hasta que el
 * token se renueva: cierra sesión y vuelve a entrar, o espera hasta una hora.
 *
 * Este script se ejecuta a mano y vive en `scripts/`, que está excluido de las
 * tres listas de despliegue. Nunca se sirve en la web.
 */

import process from 'node:process';

const [emailArg, ...flags] = process.argv.slice(2);
const revoke = flags.includes('--revoke');

if (!emailArg || emailArg.startsWith('-')) {
    console.error('Uso: node scripts/set-admin-claim.mjs <email> [--revoke]');
    process.exit(1);
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Falta GOOGLE_APPLICATION_CREDENTIALS con el JSON de la cuenta de servicio.');
    process.exit(1);
}

let admin;
try {
    admin = await import('firebase-admin');
} catch {
    console.error('Falta firebase-admin. Instálalo donde vayas a ejecutarlo:\n  npm i firebase-admin');
    process.exit(1);
}

const app = admin.default.initializeApp({
    credential: admin.default.credential.applicationDefault()
});
const auth = admin.default.auth(app);

const email = String(emailArg).trim().toLowerCase();
const user = await auth.getUserByEmail(email).catch(error => {
    console.error(`No hay ninguna cuenta con ${email}: ${error.code || error.message}`);
    process.exit(1);
});

// Se conservan los demás claims: sobrescribir el mapa entero borraría
// cualquier otro rol que la cuenta tuviera.
const claims = { ...(user.customClaims || {}) };
if (revoke) delete claims.admin;
else claims.admin = true;

await auth.setCustomUserClaims(user.uid, claims);

// Invalida los tokens ya emitidos para que el cambio no espere a la renovación.
await auth.revokeRefreshTokens(user.uid);

console.log(`${revoke ? 'Retirado' : 'Concedido'} el claim admin a ${email} (uid ${user.uid}).`);
console.log('Claims ahora:', JSON.stringify(claims));
console.log('Los tokens en curso quedan revocados: hay que volver a iniciar sesión.');
await app.delete();
