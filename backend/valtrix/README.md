# VALTRIX — Worker y API (fase 2)

Worker propio, aparte del de Elysium. Sirve el sitio de VALTRIX desde
`VALTRIX Engineering/` y el API bajo `/api/`. La arquitectura y el modelo de
datos están en `MODELO.md`; esto es cómo se monta y se prueba.

## Por qué es un Worker aparte

Dos razones, y la segunda es la que decidió:

1. Una caída de VALTRIX no se lleva por delante `elysiumdr.eu`, que sirve cinco
   regiones, la biblioteca, Tools y el CRM.
2. **La mudanza.** El día que VALTRIX tenga dominio propio, transferirlo es
   apuntar el dominio a este Worker. Sacarlo del Worker de Elysium sería
   separar rutas de un `index.js` compartido, repartir secretos y dejar
   redirecciones, con clientes de pago ya operando. Eso ya se hizo dos veces
   (Pura Vida Pets, ONCORE) y no hace falta una tercera.

Mientras tanto, `elysiumdr.eu/VALTRIX` sigue sirviendo las mismas páginas desde
el Worker de Elysium. Son los mismos ficheros, no una copia: lo que solo existe
aquí es el API.

**El portal no.** `elysiumdr.eu/VALTRIX/cuenta` redirige (302) a
`valtrix.danielalonzzo.workers.dev/cuenta`, porque la cuenta necesita el API:
servida desde `elysiumdr.eu` pediría `/api/` a Elysium, que es otra cosa, y
fallaría sin decir por qué. La redirección está en `worker/index.js` de
Elysium (`VALTRIX_PORTAL_ORIGIN`) y es 302, no 301, para que el día que el
portal se mude a su dominio no se haya quedado guardada en los navegadores de
quienes ya entraron. La vigila `scripts/routing.test.mjs`.

## Lo que hay que saber antes de tocarlo

- **`.assetsignore` vive en `VALTRIX Engineering/`, no aquí.** Cloudflare lo lee
  en la raíz de la carpeta de assets; junto al `wrangler.jsonc` no hace nada y
  se publicarían `_comercial/` (el modelo de precios) y `_avatar/`. Son dos
  despliegues distintos de la misma carpeta —este y el de Elysium— y **cada uno
  excluye por su cuenta**.
- **El mensaje «Read N files» de wrangler es anterior al filtro.** No sirve para
  comprobar que algo quedó fuera; hay que pedirlo (`wrangler dev` y un `curl`).
- **`route` vive en `src/lib/route.js`, no en `src/api.js`.** Exportarla desde
  el enrutador, que importa los módulos de rutas, crea un ciclo: `route` no
  existe aún cuando esos módulos se evalúan y el Worker cae al arrancar con
  «route is not a function». Pasó.
- **Los clientes de Firebase se montan al primer uso.** Si se construyeran con
  el contexto, una variable ausente respondería con la traza del servidor en
  vez de un 503 con su código.

## Configuración

1. **App web en la consola de Firebase** (proyecto `VALTRIX` → Agregar app →
   Web). De ahí sale la clave web, que no es secreta pero tampoco va en el
   repositorio.
2. **Cuenta de servicio.** Necesita `roles/datastore.user` (datos) y
   `roles/firebaseauth.admin` (crear cuentas y fijar el claim `role`):

   ```
   gcloud projects add-iam-policy-binding valtrix \
     --member=serviceAccount:valtrix-worker@valtrix.iam.gserviceaccount.com \
     --role=roles/datastore.user
   gcloud projects add-iam-policy-binding valtrix \
     --member=serviceAccount:valtrix-worker@valtrix.iam.gserviceaccount.com \
     --role=roles/firebaseauth.admin
   ```

3. **Secretos del Worker** (nunca en el repositorio):

   ```
   npx wrangler@4.158.0 secret put GOOGLE_SERVICE_ACCOUNT   # el JSON entero
   npx wrangler@4.158.0 secret put FIREBASE_API_KEY         # la clave web
   ```

4. **Reglas**, que niegan todo acceso del navegador:

   ```
   firebase deploy --only firestore:rules,storage:rules --project valtrix
   ```

5. **Publicar:** `npx wrangler@4.158.0 deploy`.

El proyecto está en **plan Spark**, que no da Cloud Functions ni salida de red.
No hace falta: el backend es este Worker. Lo que sí hará falta antes de los
trabajos programados (cierres mensuales, avisos) son los Cron Triggers, que sí
existen en el plan gratuito, con un tope de cinco por cuenta.

## El portal

`cuenta.html` es el portal, y es lo único del sitio que el Worker sirve
pasando por su código (`run_worker_first`). Son módulos ES sin compilación,
como Elysium Patrimonio: `js/portal/` y `css/portal.css`.

- **El SDK de Firebase se usa solo para identificar a la persona.** No toca
  Firestore ni Storage, que las reglas niegan enteros; los datos vienen del
  API. Por eso se carga únicamente `firebase-auth`.
- **La configuración la sirve `/api/config`**, no va escrita en el HTML: el
  portal funciona igual contra los emuladores que contra producción, y si
  falta un secreto lo dice con un mensaje en vez de romperse.
- **Una sección cuyo módulo todavía no está habilitado se enseña apagada**,
  diciendo cuándo se abre. Esconderla haría creer que el sistema no lo hace.
- **El negocio activo se recuerda en `localStorage` solo como comodidad.** Al
  arrancar se comprueba contra la lista del API; un identificador guardado en
  el navegador no autoriza nada.

Para verlo con datos:

```
firebase emulators:start --only auth,firestore --project demo-valtrix
node test/seed.mjs          # un administrador, tres negocios y sus dueños
npx wrangler@4.158.0 dev --port 8799
```

Las credenciales de demostración las imprime el propio `seed.mjs`. Hace falta
`.dev.vars` apuntando a los emuladores; no está en el repositorio.

## Pruebas

```
firebase emulators:exec --only auth,firestore --project demo-valtrix \
  "node --test test/isolation.emulator.mjs"
```

No levanta el Worker: importa `handleApi` y le pasa `Request` de verdad contra
los emuladores. Cubre lo que de verdad protege la fase 2 —que una identidad
autorizada para un negocio no alcance otro— y, de paso, que un negocio ajeno
responda **igual que uno inventado**: un 403 distinto del 404 confirmaría que
existe un cliente con ese nombre.

## Lo que falta

- El portal (`cuenta.html`) sigue siendo la demostración de la fase 1, con
  datos escritos en el HTML. Todavía no llama al API.
- ERP, QMS y auditoría: ninguno existe. Lo construido son los fundamentos —
  identidad, negocios, membresías, capacidades y suscripción— que es lo único
  que no se puede añadir después sin rehacer los datos.
