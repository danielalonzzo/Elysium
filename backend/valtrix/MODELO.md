# VALTRIX — arquitectura de la fase 2

Proyecto Firebase propio, **`VALTRIX`**, separado de `elysiumdr-eu`. Separado a
propósito: los datos financieros de los negocios suscriptores no comparten
proyecto, reglas ni consola con el portafolio de Elysium, y una cuenta del CRM
de Elysium no es nadie aquí.

La fase 1 es el sitio de `/VALTRIX`, con una cuenta demostrativa de datos
ficticios escritos en el HTML. La fase 2 la sustituye por datos reales de varios
negocios. Este documento describe el estado al que se llega; lo construido se
marca en cada sección.

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
users/{uid}                 perfil: email, nombre, role, status, locale
leads/{leadId}              prospectos del CRM de VALTRIX
jobs/{jobId}                trabajos pendientes y su número de intentos
mailLog/{entryId}           correos enviados, omitidos o fallidos
```

### Por negocio

```text
tenants/{tenantId}
  ├── name, legalName, timezone, baseCurrency, status, createdAt
  ├── subscription: { state, paidPeriods, currentPeriodEnd, entitlements }
  ├── fxRates: { usdPerCrc, eurPerCrc, source, takenAt }
  ├── members/{uid}          role, capabilities[], status
  ├── customers/{id}         clientes y deudores
  ├── products/{id}          catálogo: código único en el negocio, costo, precio
  ├── stock/{productId}      existencia proyectada, con su `updateTime`
  ├── movements/{id}         entradas, salidas, devoluciones y ajustes
  ├── sales/{id}             documentos de venta y sus líneas
  ├── payments/{id}          cobros y su asignación a documentos
  ├── processes/{id}         plantillas y sus versiones publicadas
  ├── taskRuns/{id}          ejecuciones diarias y sus evidencias
  ├── equipment/{id}         equipos, planes y vencimientos
  ├── imports/{batchId}      lotes de incorporación, antes de transformar
  └── reports/{period}       cierre mensual; lo escribe solo el backend
```

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
| Auditoría mensual | habilitada y `paidPeriods >= 3` y período elegible |

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
movimientos. Un descuadre entre ambos es un error detectable, no una opinión.

## Lo que no está aquí

- **Los informes mensuales los escribe el backend**, nunca el navegador. Un
  informe que el cliente pudiera escribir no sería evidencia de nada.
- **El cierre va en la zona horaria del negocio** (`timezone`), no la del
  servidor ni la del navegador que abre el panel. El cron del Worker despierta
  a una hora fija UTC y pregunta qué negocios tienen un período terminado.
- **La IA no calcula.** Los importes y las reglas son deterministas; un modelo
  solo redacta la explicación de un hallazgo ya calculado, sobre un esquema
  validado, y una salida inválida se sustituye por la plantilla aprobada.
- **El idioma es español de Costa Rica y de usted**, como Elysium Patrimonio.
  Los textos de error viven en el API con su código estable: el portal enseña
  la frase, las pruebas comparan el código.
