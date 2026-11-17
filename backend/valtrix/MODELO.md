# VALTRIX — arquitectura de la fase 2

Proyecto Firebase propio, **`VALTRIX`**, separado de `elysiumdr-eu`. Separado a
propósito: los datos financieros de los negocios suscriptores no comparten
proyecto, reglas ni consola con el portafolio de Elysium, y una cuenta del CRM
de Elysium no es nadie aquí.

La fase 1 es el sitio de `/VALTRIX`. La fase 2 es el sistema: está
construido y probado (motor, API, portal, demo, incorporación y cron), y falta
su puesta en producción, que se describe en `README.md`.

El motor que hace los cálculos no vive aquí: vive en
`VALTRIX Engineering/js/core/`, porque lo ejecutan también la demo y las
pruebas. Este documento describe los datos que escribe y las reglas que los
protegen.

## La regla que lo explica todo

**El navegador no habla con Firestore. Habla con el API.** Las reglas de
Firestore niegan todo (`allow read, write: if false`) y la única credencial que
las atraviesa es la cuenta de servicio del Worker. Cada ruta de `/api/valtrix/`
vuelve a verificar el ID token, el papel, la pertenencia al negocio y la
suscripción, aunque el portal ya haya escondido el botón.

Es la arquitectura de ONCORE (`λ/ONCORE/ONCORE`), y aquí hace más falta
todavía. Las reglas de Firestore son un lenguaje de condiciones por documento:
sirven para «cada cual ve lo suyo», como en Elysium Patrimonio, pero no para
confirmar una venta, que tiene que descontar existencias, crear la obligación
de cobro y dejar el evento pendiente **en la misma transacción o en ninguna**.
Una regla no sabe hacer eso; una ruta del Worker sí.

De ahí salen tres consecuencias que desconciertan al entrar:

1. **Esconder una sección no protege nada.** El mapa de navegación decide qué
   se enseña; el permiso lo decide el servidor, otra vez, en cada petición.
2. **El papel vive en el custom claim de Firebase Auth**, no en Firestore.
   `users/{uid}` lo replica para poder consultarlo y presentarlo, y solo lo
   escribe el Worker. Si discrepan, manda el claim y el documento se corrige en
   la misma petición.
3. **Nada de un negocio vive fuera de `tenants/{tenantId}/`.** El identificador
   del negocio es parte de la ruta del documento, así que el aislamiento no
   depende de que una consulta recuerde filtrar.

## Los tres espacios

| Espacio | Quién entra | Qué administra |
|---|---|---|
| Administración de VALTRIX | `role` = `admin` / `developer` | Prospectos, negocios, incorporaciones, suscripciones, soporte |
| Gestión del negocio | `role` = `business`, con membresías | Productos, ventas, inventario, cobros, procesos, equipos |
| Procesos automáticos | Cron del Worker, sin cuenta | Cierres mensuales, avisos de mantenimiento, importaciones |

Un administrador de VALTRIX **no lee las finanzas de un negocio** por el hecho
de ser administrador, igual que en Patrimonio no lee las de nadie. Administra la
suscripción y la incorporación. Para entrar a operar dentro de un negocio
necesita una membresía explícita, y el acceso de soporte queda registrado con
motivo, identidad y duración, revisable después.

## Papeles y capacidades

El papel es el claim; lo que autoriza una operación concreta es la
**capacidad**, guardada en la membresía. Las rutas preguntan por la capacidad,
no por el nombre del papel:

| Papel (claim) | Alcance |
|---|---|
| `developer` | Todo, más el estado del sistema, los trabajos y la auditoría |
| `admin` | CRM de VALTRIX: prospectos, negocios, incorporaciones, suscripciones |
| `business` | Solo los negocios donde tiene membresía activa |

| Rol en el negocio | Capacidades por omisión |
|---|---|
| `owner` | todas, incluida `members.manage` |
| `operations` | `inventory.adjust`, `process.run`, `equipment.manage` |
| `collections` | `payment.record`, `customer.read` |
| `staff` | `process.run` |
| `viewer` | solo lectura |

`owner` se evalúa aparte: tiene toda capacidad sin enumerarla. Las demás se
enumeran en el documento de la persona, para que ampliar un permiso sea un
cambio visible y no un efecto lateral del nombre de su rol.

## Colecciones

### Raíz

```text
users/{uid}                 perfil: email, nombre, role, status
leads/{leadId}              prospectos de VALTRIX, con su historial de notas
intakeTokens/{huella}       enlaces de incorporación: solo la huella del token
mailLog/{entryId}           correos enviados, omitidos o fallidos
```

No hay una cola de trabajos: la pasada diaria (`src/scheduled.js`) mira cada
negocio y hace lo que le falta. Repetirla no duplica nada, porque cada paso
comprueba antes si ya está hecho.

### Por negocio

```text
tenants/{tenantId}
  ├── name, legalName, sector, timezone, baseCurrency, status, createdAt
  ├── subscription: { state, paidPeriods, currentPeriodEnd, entitlements }
  ├── onboarding: { status, batchId, tokenHash, sentAt, submittedAt, appliedAt }
  ├── members/{uid}              role, capabilities[], status, position
  ├── periods/{n}                cada período liquidado: importe, método, hasta cuándo cubre
  ├── subscriptionLog/{id}       cada cambio de estado, con quién y por qué
  │
  ├── products/{id}              catálogo: código, costo, precio, mínimo
  ├── productCodes/{clave}       reserva del código («FIL 001» = «fil-001»)
  ├── stock/{productId}          existencia proyectada, con copia del costo y del mínimo
  ├── movements/{id}             entradas, salidas, mermas, conteos: la verdad
  ├── customers/{id}             clientes, con su saldo
  ├── sales/{id}                 ventas y saldos anteriores (`kind: opening`), con sus líneas
  ├── payments/{id}              cobros y a qué documentos se aplicaron
  ├── counters/{serie}           consecutivos: V-000001, C-000001, SI-000001, P-0001
  ├── stats/{período}            acumulados del mes, por día incluidos
  ├── productStats/{período}_{id}  lo que vendió y dejó cada producto en el mes
  │
  ├── processes/{id}             listas de tareas: pasos, frecuencia, a cargo de quién
  ├── taskRuns/{lista}_{día}     lo que se marcó ese día, con copia de los pasos
  ├── equipment/{id}             equipos: intervalo, último y próximo mantenimiento
  ├── maintenance/{id}           cada mantenimiento hecho
  │
  ├── reports/{período}          cierre mensual; lo escribe solo el backend
  └── imports/{lote}             el formulario de incorporación hasta que se carga
```

Lo que el formulario trae se guarda **tal como lo escribió la persona** hasta
que VALTRIX lo carga; al cargarlo se borra y queda solo el resumen de lo que se
creó. Desde ese momento los datos son del negocio, y para verlos hace falta una
membresía.

«Mis negocios» se responde con una consulta de grupo de colecciones sobre
`members` filtrando por `uid`, desde el Worker. No hay una lista de negocios
copiada en el perfil que pueda quedarse desfasada.

### Importes

Como en Elysium Patrimonio: **enteros en la unidad menor** (`amountMinor`) y la
moneda explícita en el mismo documento. Nunca un `double` para dinero, nunca un
importe sin su moneda.

Cada operación conserva la moneda en que ocurrió y, si se convirtió, la tasa,
su fuente y su fecha. La moneda de presentación es otra cosa: es el selector
CRC/USD de la fase 1, que no es contabilidad. La equivalencia comercial de
₡62 000 por US$120 del sitio es orientativa y nunca una tasa de registro.

## Suscripción y módulos

```text
pending_activation → (pago confirmado) → active
active → (vence sin renovar) → past_due → (fin de gracia) → suspended
suspended → (renovación) → active
active → cancel_at_period_end → canceled
```

Los módulos se habilitan por **períodos liquidados** (`paidPeriods`), no por
transacciones bancarias contadas: un pago dividido, duplicado o anticipado no
debe adelantar una activación.

| Módulo | Condición |
|---|---|
| ERP | habilitada y `paidPeriods >= 1` |
| QMS | habilitada y `paidPeriods >= 2` |
| Auditoría mensual | habilitada y `paidPeriods >= 3` |

Liquidar un período es `POST /admin/tenants/:id/periods` con el número que se
cree estar liquidando. Si ya está liquidado —un doble clic, dos pestañas—
responde `PERIOD_ALREADY_SETTLED` en vez de liquidar el siguiente sin que nadie
lo haya cobrado. El período nuevo empieza donde acaba el vigente; pagar tarde
no regala los días que no se pagaron.

La pasada diaria pasa a `past_due` un período que venció sin renovar. **No
suspende**: suspender lo decide una persona, con su motivo.

`entitlements` guarda el resultado ya calculado (`{ erp, qms, audit }`). Lo
escribe quien escribe la suscripción —administrador o conciliación—, y las
rutas solo lo consultan. El navegador no escribe la suscripción nunca: si
pudiera, habilitar los tres módulos sería editar un campo.

Un negocio `suspended` **conserva sus datos y puede leerlos**. Lo que pierde es
la escritura. Suspender no es borrar, y recuperar el servicio es volver a
`active`, no reincorporar al cliente.

## Concurrencia: la última unidad

Si quedan dos unidades, dos ventas simultáneas no pueden consumir las mismas.
ONCORE lo resuelve en la agenda creando `appointmentSlots/{id}` con
`exists: false` en el mismo commit que la consulta: dos reservas de la misma
hora nunca vencen las dos.

Aquí el equivalente es una **precondición sobre `updateTime`**: la confirmación
de una venta lee `stock/{productId}`, calcula la existencia resultante y
escribe en un único commit con `currentDocument.updateTime` igual al que leyó.
Si alguien escribió entre medias, el commit falla, y la ruta reintenta o
devuelve `STOCK_CHANGED`. La existencia nunca queda negativa por una carrera.

`movements` es la verdad; `stock` es su proyección, reconciliable sumando los
movimientos (`erp.checkStock`). Un descuadre entre ambos es un error
detectable, no una opinión.

Los consecutivos (`counters`) usan la misma precondición: dos ventas
simultáneas no comparten número ni se saltan uno. Y los acumulados del mes no
la necesitan, porque se suman con un incremento que no lee antes: dos ventas a
la vez suman las dos.

## Lo que no está aquí

- **Los informes mensuales los escribe el backend**, nunca el navegador. Un
  informe que el cliente pudiera escribir no sería evidencia de nada.
- **El cierre va en la zona horaria del negocio** (`timezone`), no la del
  servidor ni la del navegador que abre el panel. El cron del Worker despierta
  a una hora fija UTC y pregunta qué negocios tienen un período terminado.
- **El informe no lo redacta una IA.** Cada hallazgo sale de una regla con su
  umbral declarado (`THRESHOLDS` en `js/core/audit.js`) y su frase escrita. El
  mismo mes da siempre el mismo informe, y el informe guarda sus frases: si
  mañana se afina una redacción, el de octubre sigue diciendo lo que dijo.
- **Emitir el cierre cierra el mes.** Desde ese momento, registrar o anular
  algo con fecha de ese mes responde `PERIOD_CLOSED`. El cierre automático
  espera dos días (`CLOSING_GRACE_DAYS`): un negocio pequeño apunta las ventas
  del 30 el día 1.
- **El idioma es español de Costa Rica y de usted**, como Elysium Patrimonio.
  Los textos de error viven en el API con su código estable: el portal enseña
  la frase, las pruebas comparan el código.
