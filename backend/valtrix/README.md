# VALTRIX — Worker y API (fase 2)

El sistema unificado de VALTRIX: control financiero (ERP), orden operativo
(QMS), auditoría mensual y, para VALTRIX, la captación, la incorporación y las
suscripciones. Worker propio, aparte del de Elysium, contra un proyecto
Firebase propio. La arquitectura y el modelo de datos están en `MODELO.md`;
esto es cómo está repartido, cómo se prueba y qué falta para producción.

## La regla que lo explica todo

**El motor vive en el sitio, no aquí.** Todo lo que calcula —una venta, un
cobro, la lista del día, el cierre del mes, la carga de la incorporación— está
en `VALTRIX Engineering/js/core/`, y lo ejecutan tres anfitriones:

| Anfitrión | Almacén | Para qué |
|---|---|---|
| Este Worker | Firestore, con la cuenta de servicio | Los negocios de verdad |
| `demo.html`, en el navegador | Memoria | La demo, con un taller ficticio |
| Las pruebas, en Node | Memoria, o los emuladores | Comprobar lo anterior |

El motor no sabe de Firestore: recibe un almacén **ya encerrado en un negocio**
(`tenants/{id}/…`) con seis operaciones (`js/core/store.js`). Por eso la demo
no es una maqueta: es el sistema con otra base debajo. Y por eso el aislamiento
entre negocios no depende de que una función recuerde filtrar.

Lo que el motor no decide es **quién puede**. Eso lo hace este Worker antes de
llamarlo, en cada petición: identidad, membresía, módulo abierto, capacidad y
suscripción (`src/lib/tenant-route.js`). La tabla de rutas de los módulos es
una sola (`js/core/routes.js`): el Worker la monta con esas comprobaciones y la
demo la despacha en el navegador. Una ruta nueva existe en los dos a la vez.

## Dónde está cada cosa

```
VALTRIX Engineering/
├── js/core/            el motor, sin DOM ni red (lo importa también el Worker)
│   ├── erp.js          productos, existencias, ventas, clientes, cobros
│   ├── qms.js          listas de tareas, el día, equipos y mantenimiento
│   ├── audit.js        el cierre del mes: recoger (`collect`) y redactar (`compose`)
│   ├── intake.js       leer el formulario de incorporación y cargarlo
│   ├── routes.js       la tabla de rutas de los módulos
│   ├── demo-data.js    el taller ficticio, generado con el propio motor
│   └── …               dinero, calendario, catálogos, errores, almacén
├── js/portal/          el portal (cuenta y demo) y el formulario
├── cuenta.html         la cuenta: necesita este Worker
├── demo.html           la demo: no necesita servidor
└── incorporacion.html  el formulario del dueño: necesita este Worker

backend/valtrix/
├── src/index.js        sitio, API, cabeceras de las páginas y cron
├── src/api.js          enrutador
├── src/routes/         cuenta, negocios, módulos, administración, prospectos, incorporación
├── src/scheduled.js    la pasada diaria
├── src/lib/            Firestore e Identity Toolkit sin SDK, contexto, correo
├── scripts/dev.mjs     el Worker servido por Node, para probar en local
├── scripts/seed.mjs    datos de demostración para los emuladores
└── test/               en memoria (`*.test.mjs`) y contra emuladores (`*.emulator.mjs`)
```

`src/core.js` es el único sitio donde está escrita la ruta larga hasta
`VALTRIX Engineering/js/core/`. El día que VALTRIX tenga su repositorio, la
carpeta del sitio pasa a ser la raíz y esa ruta se acorta; nada más cambia.

## Probar

```
npm test            # motor en memoria y API contra los emuladores
npm run test:core   # solo el motor, sin Java ni emuladores (un segundo)
npm run dev         # emuladores + datos de demostración + el Worker en :8799
node scripts/dev.mjs   # solo sitio y demo, sin emuladores
```

- **`test/*.test.mjs`** prueban el motor en memoria con el reloj en la mano:
  la última unidad no se vende dos veces, una venta entra entera o no entra,
  un mes cerrado no se reescribe, el cierre dice lo mismo cada vez.
- **`test/store.emulator.mjs`** corre el mismo examen contra el almacén de
  memoria y contra Firestore. Todo lo que se prueba en memoria vale para
  producción solo si los dos se comportan igual.
- **`test/api.emulator.mjs`** recorre el servicio como lo vive un negocio, mes
  a mes, y comprueba quién alcanza qué: el negocio de al lado no existe, un
  colaborador no ve el dinero, quien despacha no recibe costos, la
  administración de VALTRIX no lee la operación de nadie.
- **`npm run dev`** deja montados un taller con semanas de historia y su gente
  con papeles distintos, una panadería recién activada, una incorporación a
  medio llenar y otra enviada, y prospectos. Imprime las cuentas (todas con la
  contraseña `valtrix-demo-1234`) y el enlace del formulario.

`scripts/dev.mjs` importa `src/index.js` —el módulo que se despliega— y le
da un `ASSETS` que lee la carpeta del sitio aplicando lo que hace Cloudflare:
`html_handling`, `.assetsignore` y `_headers`. `wrangler dev` sirve para
comprobar el empaquetado (`npm run check:worker`); esto arranca en un segundo
y no necesita red.

## Lo que hay que saber antes de tocarlo

- **Los importes son enteros.** Dinero en la unidad menor (`…Minor`),
  cantidades en milésimas (`…Milli`). El portal convierte lo que escribe la
  persona antes de enviar; el API rechaza un decimal en vez de redondearlo.
- **Los acumulados del mes se suman, no se recalculan.** Cada venta suma en
  `stats/{período}` y `productStats/…` en la misma escritura. Un cambio que
  toque cómo se registra una venta tiene que tocar también lo que descuenta su
  anulación (`saleStatsWrites` con signo −1).
- **Una fusión con incrementos tiene que nombrar al menos un campo.** En
  Firestore, una máscara vacía se parece demasiado a reemplazar el documento
  entero. Los dos almacenes lo rechazan igual.
- **El token del formulario no va en ninguna dirección.** El enlace lo lleva
  en el fragmento y la página lo manda en `x-intake-token`: las direcciones
  quedan en los registros del Worker, las cabeceras no. En la base, su huella.
- **`.assetsignore` vive en `VALTRIX Engineering/`, no aquí.** Cloudflare lo
  lee en la raíz de la carpeta de assets. Son dos despliegues de la misma
  carpeta —este y el de Elysium— y **cada uno excluye por su cuenta**.
- **`route` vive en `src/lib/route.js`**, no en `src/api.js`: el ciclo de
  importaciones hacía caer el Worker al arrancar. Pasó.
- **En Elysium**, `/VALTRIX/cuenta` y `/VALTRIX/incorporacion` redirigen
  (302) a este Worker, porque necesitan su API. La demo se sirve allí tal
  cual. Lo vigila `scripts/routing.test.mjs` de Elysium.

## Configuración en producción

Pendiente. Nada de esto está hecho todavía:

1. **App web en la consola de Firebase** (proyecto `VALTRIX` → Agregar app →
   Web). De ahí sale la clave web, que no es secreta pero tampoco va en el
   repositorio.
2. **Cuenta de servicio** con `roles/datastore.user` y `roles/firebaseauth.admin`:

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

4. **Reglas e índices**, que niegan todo acceso del navegador:

   ```
   firebase deploy --only firestore:rules,firestore:indexes,storage:rules --project valtrix
   ```

5. **Correo.** Hoy VALTRIX no tiene buzón: `valtrix.com` es de otra empresa.
   Sin transporte, cada envío (el cierre del mes, los avisos de
   mantenimiento) queda en `mailLog` como omitido y el informe se sigue viendo
   en la cuenta. Cuando haya buzón: `SMTP_USER`, `SMTP_PASSWORD` y `MAIL_FROM`.
   El cliente SMTP es el de ONCORE y **aquí no ha enviado nada todavía**: el
   primer envío hay que comprobarlo de verdad.
6. **Publicar:** `npx wrangler@4.158.0 deploy`. El cron (`15 9 * * *`) y el
   limitador del formulario van en `wrangler.jsonc`.
7. **La primera cuenta de administración** se crea a mano (claim `role:
   admin`), como en ONCORE.

El proyecto está en plan Spark, que no da Cloud Functions. No hace falta: el
backend es este Worker, y los Cron Triggers existen en el plan gratuito.
