# Elysium λ — Protocolo de Prototipado y Captación
### v1.2.0 · Julio 2026

> **Documento complementario.** Este protocolo describe **cómo se produce un
> prototipo** para un prospecto, desde la primera llamada hasta que el proyecto
> firmado aparece en el portafolio. El catálogo de funciones, su código y las
> reglas de implementación viven en
> [`ELYSIUM-STANDARDS.md`](ELYSIUM-STANDARDS.md); aquí se dictan el proceso, las
> compuertas de aprobación y los prompts.
>
> La Parte I es la vista general para cualquier persona del equipo. La Parte II
> detalla cada fase. La Parte III es vinculante para los agentes de IA. La
> Parte IV reúne las plantillas copiables.

---

# PARTE I · EL PROCESO EN UNA MIRADA

## 1 · Qué es un prototipo Elysium

Un prototipo es una **pieza comercial funcional**: un sitio navegable, alojado
temporalmente en un enlace de Elysium, que el prospecto abre desde su teléfono y
recorre como si fuera suyo. No es un boceto ni una presentación de diapositivas.

Su propósito es demostrar, antes de que exista contrato, que entendimos el
negocio del prospecto y que sabemos resolver su problema concreto. Por eso el
proceso empieza con investigación y con un diagnóstico escrito, nunca con
código.

**La regla que gobierna todo el protocolo:** ningún prototipo se genera sin un
informe preliminar aprobado por el equipo. Un prototipo bonito sobre un
diagnóstico equivocado es trabajo perdido y una mala primera impresión.

## 2 · Las seis fases

| Fase | Qué ocurre | Quién la ejecuta | Compuerta de salida |
|---|---|---|---|
| **1 · Recolección** | Se reúne toda la información posible del prospecto en su carpeta | Colaborador (manual) | Criterio de suficiencia cumplido |
| **2 · Informe preliminar** | El LLM redacta el diagnóstico; el equipo lo revisa y corrige | LLM + equipo | Informe final **aprobado** |
| **3 · Prototipo** | El LLM genera el prototipo móvil primero | LLM + equipo | Prototipo **aprobado** |
| **4 · Publicación privada** | Se sube a Elysium y se obtiene el enlace para el prospecto | Equipo | Enlace enviado |
| **5 · Contrato** | Se firma y el prototipo se retira de la plataforma | Comercial | Contrato firmado |
| **6 · Producción** | Se desarrolla, se publica y se enlaza en el portafolio | Equipo | Proyecto activo en portafolio |

Cada compuerta es un alto real: nadie avanza a la fase siguiente sin la
aprobación explícita de la anterior. En la fase 3, si se trata de un rediseño,
hay **dos** compuertas internas, según se detalla en §3.4.

## 3 · Estructura de carpetas

Cada prospecto tiene su carpeta. Dentro conviven dos mundos que **no se
mezclan**: el material comercial, que nunca se publica, y el código del sitio,
que se construye desde el primer día con la arquitectura de producción.

```text
<NombreDelProyecto>/
├── _comercial/                 ← material y diagnóstico (NO se despliega)
│   ├── 00-recoleccion/         Fase 1 · material en bruto (manual)
│   │   ├── identidad/          logotipos, paleta, tipografías, fotografías
│   │   ├── contenido/          textos, servicios, precios, biografías
│   │   ├── sitio-actual/       capturas, textos extraídos, mapa de la web
│   │   ├── referencias/        sitios que le gustan al prospecto y por qué
│   │   └── notas-comerciales.md
│   ├── 01-informe-preliminar.md   Fase 2 · lo genera el LLM
│   ├── 02-informe-aprobado.md     Fase 2 · versión corregida por el equipo
│   └── 03-informe-mejoras.md      Fase 3 · solo en rediseños
│
├── index.html                  ← el sitio, con la arquitectura de PRODUCCIÓN
├── src/
│   ├── core/  ·  ui/  ·  features/  ·  styles/
├── elysium-core/               (submódulo; ver §4.2 del estándar)
├── functions/                  (solo si el plan incluye F18)
└── …resto de la arquitectura estándar (§5 de ELYSIUM-STANDARDS.md)
```

### 3.1 · El código nace como desarrollo, no como prototipo

Esta es una regla dura del protocolo: **el prototipo se construye con la misma
arquitectura, los mismos nombres y la misma calidad que tendría el proyecto
final.** No es un boceto que luego se «pasa a limpio».

- **Nada se llama «prototipo».** Ni carpetas (`prototipo/`, `demo/`, `prueba/`),
  ni clases, ni identificadores, ni comentarios. El código no sabe que es un
  prototipo; para él, ya es el sitio del cliente.
- **Arquitectura de producción desde el primer archivo.** Se sigue el §5 del
  estándar tal cual: `src/core/`, `src/ui/`, `src/features/`, `elysium-core/`
  como submódulo. Un colaborador que abra la carpeta debe encontrar cada
  elemento por su nombre, sin preguntar.
- **Optimizado para go-live en todo momento.** Sin `console.log` de depuración,
  sin código muerto, sin datos de ejemplo incrustados, sin dependencias sin
  usar. Si el prototipo se aprueba y se firma, debe poder entrar en desarrollo
  **sin una fase de limpieza previa**: se continúa sobre el mismo código.
- **La única diferencia con producción es de alcance, no de calidad.** El
  prototipo lleva menos funciones (§3.2) y la etiqueta `V1.0.0 Beta`, pero lo
  que construye está terminado a nivel de producción.

**El material comercial nunca se borra.** `_comercial/` se conserva como memoria
del proyecto: es la única prueba de qué sabíamos y qué prometimos antes de
firmar. Se excluye del despliegue (en `.gitignore` de publicación o en el
`ignore` del hosting), porque no es parte del sitio.

---

# PARTE II · LAS FASES EN DETALLE

## Fase 1 · Recolección

Trabajo **manual** de un colaborador. Consiste en llenar `_comercial/00-recoleccion/` con
todo lo que se pueda obtener del prospecto y de su presencia digital actual.

### 1.1 · Ficha mínima del prospecto

Sin estos datos no se puede avanzar. Se guardan en
`_comercial/00-recoleccion/notas-comerciales.md`.

| Dato | Por qué se necesita |
|---|---|
| Nombre legal y comercial | Encabezados, metadatos y datos estructurados |
| Sector y actividad concreta | Determina el tipo `schema.org` y el tono |
| Ubicación y zona de servicio | Idioma, divisa, marco legal aplicable |
| Servicios o productos, con precios si los publica | Es el contenido central del prototipo |
| Público al que se dirige | Define la jerarquía de la página |
| Canales de contacto reales | WhatsApp, correo y redes para el Magic Bottom |
| Identidad visual disponible | Logotipo, colores, tipografías, fotografías |
| Qué le molesta hoy de su presencia digital | Es la pista directa del dolor |
| Idiomas necesarios | Aunque el prototipo salga en uno solo |

### 1.2 · Auditoría del sitio actual (solo rediseños)

Si el prospecto ya tiene sitio, se documenta **antes de opinar**. Se guarda en
`_comercial/00-recoleccion/sitio-actual/`.

- **Arquitectura**: listado de todas las páginas y cómo se enlazan entre sí.
- **Contenido**: textos extraídos literalmente, página por página. Es material
  reutilizable y evita reescribir lo que ya funciona.
- **Diseño**: capturas completas de cada página, en móvil y en escritorio.
- **Comportamiento**: qué hace el sitio (formularios, reservas, tienda,
  descargas) y qué de eso funciona de verdad.
- **Infraestructura observable**: proveedor de alojamiento, si tiene HTTPS,
  velocidad aparente, si es adaptable a móvil, si tiene aviso de cookies.
- **Presencia**: si aparece en Google al buscar su nombre, si tiene Perfil de
  Empresa, si sus enlaces se previsualizan bien al compartirlos.

### 1.3 · Criterio de suficiencia

La fase 1 se cierra cuando se cumplen las cuatro condiciones. Si falta alguna,
se vuelve al prospecto a pedirla; no se rellena con suposiciones.

1. La ficha mínima está completa, sin campos inventados.
2. Hay identidad visual utilizable, o consta por escrito que no existe y que
   habrá que proponerla.
3. En rediseños, la auditoría cubre **todas** las páginas del sitio actual.
4. Hay al menos una frase textual del prospecto describiendo su problema.

---

## Fase 2 · Informe preliminar

### 2.1 · Conexión al IDE

Se abre la carpeta `<NombreDelProyecto>/` en el IDE, de modo que el asistente
tenga acceso de lectura a todo `_comercial/`, y se le entrega el prompt de §IV.2
junto con este documento.

### 2.2 · Qué debe contener el informe

El informe es un **diagnóstico de infraestructura digital**, no una pieza de
marketing. Su estructura es fija:

1. **Retrato de la empresa.** Qué hace, para quién, dónde y con qué tono. Media
   página, redactada de forma que un colaborador nuevo entienda el negocio.
2. **Estado digital actual.** Qué tiene hoy y qué hace realmente. En proyectos
   nuevos, se describe su ausencia y lo que esa ausencia le cuesta.
3. **Análisis FODA de infraestructura.** Las cuatro casillas, siempre referidas
   a la infraestructura digital, nunca al negocio en abstracto:

   | | Origen interno | Origen externo |
   |---|---|---|
   | **Favorable** | **Fortalezas**: activos digitales que ya funcionan y hay que conservar | **Oportunidades**: espacio que la competencia no ocupa, canales sin explotar |
   | **Desfavorable** | **Debilidades**: fricción, deuda técnica, incumplimientos, procesos manuales | **Amenazas**: exigencias legales, competidores mejor posicionados, dependencia de terceros |

4. **El dolor.** Una sola frase que nombre el problema central, seguida de la
   evidencia que la sostiene. Es la sección más importante del informe: el
   prototipo entero existe para responderla.
5. **Hipótesis de solución.** Qué debe demostrar el prototipo para probar que
   ese dolor tiene remedio. Se expresa como una lista corta de afirmaciones
   verificables.
6. **Alcance propuesto del prototipo.** Qué páginas y qué secciones tendrá, y
   qué queda deliberadamente fuera.
7. **Plan recomendado.** Cuál de los cinco planes del estándar encaja con lo
   diagnosticado, con su justificación.

### 2.3 · Reglas de redacción del informe

- Cada afirmación se apoya en material de `_comercial/00-recoleccion/`. Si algo no consta,
  se escribe **«no consta»**, jamás se supone.
- Se nombra el dolor con franqueza y sin adornos comerciales; este documento es
  interno y su valor está en ser exacto.
- No se prometen posiciones en buscadores, plazos ni resultados de negocio.

### 2.4 · Revisión del equipo

El equipo lee, corrige y **aprueba** el informe. El resultado se guarda como
`_comercial/02-informe-aprobado.md`, que a partir de ese momento es **la única fuente**
para generar el prototipo. El borrador del LLM se conserva sin modificar, como
registro de lo que el asistente propuso frente a lo que el equipo decidió.

> **Compuerta 1.** Sin `_comercial/02-informe-aprobado.md` no se escribe una sola línea de
> código del prototipo.

---

## Fase 3 · Generación del prototipo

### 3.1 · Regla de plataforma: móvil primero

Todo prototipo se diseña y se construye **primero para móvil**, y solo después
se adapta a pantallas mayores. La excepción debe constar por escrito en el
informe aprobado, con su motivo (por ejemplo, una herramienta interna de
escritorio).

En la práctica esto significa que la primera composición se resuelve a 375 px de
ancho, que los puntos de quiebre crecen desde ahí, y que la revisión del equipo
se hace en un teléfono real, no solo en el navegador reducido.

### 3.2 · Alcance funcional obligatorio

Todo prototipo incluye estas nueve funciones del catálogo, ni más ni menos. Los
identificadores remiten a [`ELYSIUM-STANDARDS.md`](ELYSIUM-STANDARDS.md).

| Función | ID | Papel en el prototipo |
|---|---|---|
| Loading Page | F01 | Primera impresión de marca; oculta la carga inicial |
| Header Mobile-First | F02 | Demuestra la navegación en el teléfono del prospecto |
| Scroll Reveal | F03 | Da ritmo al recorrido de la propuesta |
| Anchor Glide | F04 | Permite saltar entre secciones durante la demostración |
| Information System | F05 | Muestra versión, marco legal y seriedad técnica |
| System Settings | F22 | Demuestra que la interfaz se adapta al visitante |
| System Update | F06 | Permite refrescar la demostración sin explicar cachés |
| Magic Bottom | F09 | Pone el contacto real del prospecto a un toque |
| Elysium Signature | F10 | Firma la autoría del trabajo |

### 3.2.1 · Versión del prototipo

La etiqueta del pie de todo prototipo es siempre **`V1.0.0 Beta`**, sin
excepción y sin importar cuántas revisiones internas acumule. Se declara así:

```html
<meta name="app-version" content="V1.0.0">
<script>
  window.ELYSIUM_SYSTEM = {
    stage: 'Beta',        // se retira el día del lanzamiento
    // …resto de la configuración de marca
  };
</script>
```

**La etiqueta `Beta` se retira el día de la publicación oficial**, y el sitio
queda en `V1.0.0`: ese es el nacimiento del proyecto y el punto de partida del
sistema de versionado Elysium (§7 del estándar), donde la primera cifra pasa a
contar los años de vida del sitio.

Las correcciones que el prototipo reciba durante la fase comercial **no** hacen
avanzar el número. Un prototipo que se revisó nueve veces sigue mostrando
`V1.0.0 Beta`, porque ante el prospecto es una sola propuesta, no una novena
entrega. El control de esas iteraciones vive en el historial del repositorio, no
en el pie de página.

**Qué queda deliberadamente fuera.** Un prototipo no lleva CRM (F18), ni PWA
(F17), ni multi-idioma (F15), ni conversión de divisas (F16), ni Discovery Core
(F19), ni SEO (F20). Son funciones de proyecto contratado; incluirlas alarga la
producción y regala trabajo que aún no se ha vendido. El sonido (F21) y el
cursor (F12) se incluyen solo si el informe aprobado lo justifica.

### 3.3 · Ruta A · Prospecto sin sitio previo

Se genera el prototipo directamente a partir de `_comercial/02-informe-aprobado.md`, con el
prompt de §IV.3. El equipo revisa en un teléfono real y aprueba o devuelve con
correcciones.

### 3.4 · Ruta B · Rediseño

Un rediseño tiene **dos compuertas** y nunca se salta la primera.

**Paso 1 · Réplica fiel.** Se reproduce el sitio actual del prospecto con la
mayor exactitud posible: misma estructura, mismos textos, misma jerarquía. No se
corrige nada, ni siquiera lo que está mal.

> **Por qué se replica primero.** Por tres razones. Demuestra al prospecto que
> entendimos su sitio antes de opinar sobre él. Da una base de comparación
> honesta: el «antes» y el «después» se ven en la misma pantalla. Y obliga al
> equipo a descubrir la lógica de negocio escondida en decisiones que desde
> fuera parecen errores.

El equipo aprueba la réplica antes de continuar.

**Paso 2 · Informe de mejoras.** Con la réplica aprobada, el LLM redacta
`_comercial/03-informe-mejoras.md`, separando las propuestas en tres bloques y ordenándolas
por impacto:

- **Estructurales**: arquitectura, jerarquía de páginas, recorrido del visitante,
  ubicación de las llamadas a la acción.
- **De diseño**: composición, espaciado, tipografía, color, comportamiento móvil.
- **De estilo y contenido**: tono, extensión de los textos, claridad de los
  títulos, calidad de las imágenes.

Cada propuesta indica **qué se cambia, por qué y qué se espera que mejore**. Las
que afecten a contenido del prospecto se marcan como sujetas a su aprobación.

> **Compuerta 2.** El equipo aprueba el informe de mejoras antes de tocar la
> réplica. Solo entonces se implementa el rediseño.

**Paso 3 · Implementación.** Se aplica el rediseño aprobado sobre la réplica,
conservando la réplica original en el historial para poder mostrar la
comparación.

---

## Fase 4 · Publicación privada en Elysium

El prototipo se publica como una página del portafolio de Elysium, lo que genera
un enlace propio del dominio (`elysiumdr.eu/prototype-<cliente>`) que se comparte
con el prospecto. Que viva bajo el dominio de Elysium es deliberado: transmite
respaldo y permite retirarlo en cualquier momento.

### 4.1 · Requisitos de publicación

| Requisito | Motivo |
|---|---|
| `<meta name="robots" content="noindex, nofollow">` en todas sus páginas | Impide que el prototipo se indexe |
| `Disallow: /prototype-*` en el `robots.txt` de Elysium | Refuerza la exclusión ante los rastreadores |
| Ausente del `sitemap.xml`, de `llms.txt` y de `llms-full.txt` | No se anuncia lo que no debe indexarse |
| Sin canónica hacia el sitio real del prospecto | Evita transferirle señales indebidas |
| Enlace no listado en la navegación pública | Solo accesible por su dirección directa |

> ⚠️ **Por qué esto no es opcional.** En un rediseño, el prototipo es una réplica
> del sitio del prospecto. Si Google lo indexa bajo `elysiumdr.eu`, se crea
> contenido duplicado que puede perjudicar al sitio real del prospecto, que
> además todavía no es cliente. A ello se suma la confidencialidad: una
> propuesta comercial no firmada no debe ser pública ni encontrable.
>
> **Estado actual:** las páginas `prototype-*.html` de `elysiumdr.eu` **no**
> llevan `noindex` ni están excluidas en `robots.txt`. Corregirlo es requisito
> previo a publicar el siguiente prototipo.

### 4.2 · Contenido de la página del prototipo

Además del prototipo navegable, la página incluye una presentación breve del
diagnóstico: el dolor detectado en una frase y las tres o cuatro decisiones
principales que lo resuelven. El prospecto debe entender **qué problema suyo
estamos resolviendo**, no solo ver un sitio bonito.

---

## Fase 5 · Contrato y retirada

Firmado el contrato, el prototipo **se retira de la plataforma de Elysium**:

1. Se elimina la página `prototype-<cliente>` del sitio y del portafolio.
2. Se retira la regla correspondiente del `robots.txt`.
3. Se archiva el prototipo dentro de la carpeta del proyecto, que pasa a
   producción con el estándar completo.

Si el prospecto **no** firma, el prototipo se retira igualmente pasado el plazo
acordado, y la carpeta se conserva como material de aprendizaje comercial.

---

## Fase 6 · Producción y alta en el portafolio

El proyecto se desarrolla conforme a [`ELYSIUM-STANDARDS.md`](ELYSIUM-STANDARDS.md),
con el alcance del plan contratado. Como el prototipo ya se construyó con
arquitectura de producción (§3.1), **el desarrollo continúa sobre el mismo
código, sin reescribirlo**: se amplían las funciones del plan contratado sobre
la base ya existente.

Todas las subidas (Git, Firebase, Cloudflare) y la publicación son **manuales**
y siguen el protocolo del §8 del estándar: antes de cada subida a Git se
pregunta la versión nueva, se actualiza el pie y se redacta el commit con título
y descripción. Ningún despliegue es automático salvo petición explícita.

El día de la publicación se **retira la etiqueta `Beta`** y el sitio queda en
`V1.0.0`. Esa fecha es el origen del sistema de versionado Elysium: a partir de
ella, la primera cifra cuenta los años de vida del sitio, la segunda las grandes
actualizaciones de cada año y la tercera las correcciones (§7 del estándar).

Una vez en línea, se da de alta en el portafolio de Elysium como **proyecto
activo**, con dos piezas:

- **Caso de estudio** (`case-<cliente>`): contexto, dolor diagnosticado, enfoque,
  solución y resultado. Se redacta a partir del informe aprobado de la fase 2,
  que ya contiene el diagnóstico y la hipótesis.
- **Enlace público oficial** al sitio del cliente, ahora sí indexable y
  enlazado desde el portafolio.

El circuito se cierra así: el informe que justificó el prototipo se convierte en
el relato del caso de estudio que atrae al siguiente prospecto.

---

# PARTE III · ESPECIFICACIÓN PARA AGENTES DE IA

Vinculante para cualquier asistente que intervenga en el prototipado.

## 5 · Reglas de fase

**MUST**

- Leer `_comercial/00-recoleccion/` completo antes de redactar el informe preliminar, y
  citar de qué archivo procede cada afirmación relevante.
- Escribir **«no consta»** ante cualquier dato ausente. La invención de datos de
  un prospecto es la falta más grave de este protocolo.
- Generar el prototipo **únicamente** a partir de `_comercial/02-informe-aprobado.md`,
  nunca del borrador ni del material en bruto.
- Construir móvil primero, salvo excepción escrita en el informe aprobado.
- Incluir exactamente las nueve funciones de §3.2, con la configuración de marca
  del prospecto.
- Construir con la **arquitectura de producción** del §5 del estándar y del §3.1
  de este documento: nada llamado «prototipo», código optimizado para go-live,
  listo para entrar en desarrollo sin fase de limpieza.
- Mantener el material comercial en `_comercial/`, siempre separado del código
  del sitio y fuera del despliegue.
- Emitir `noindex, nofollow` en todas las páginas del prototipo.
- En rediseños, entregar la réplica fiel **sin mejoras** y esperar la
  aprobación antes de proponer cambio alguno.

**NEVER**

- Saltarse una compuerta de aprobación, ni empezar el rediseño mientras la
  réplica no esté aprobada.
- Añadir funciones fuera del alcance de §3.2 por iniciativa propia.
- Copiar imágenes, tipografías de pago o textos de terceros sin constancia de
  licencia. En la réplica de un rediseño se usa material del propio prospecto.
- Publicar el prototipo con datos de contacto inventados: si no constan, se deja
  el marcador visible `[PENDIENTE]`.
- Prometer en el prototipo funciones que el plan recomendado no incluye.
- Nombrar carpetas, clases o archivos «prototipo», «demo», «prueba» o similar:
  el código nace como el sitio del cliente (§3.1).
- **Publicar o subir por su cuenta.** La subida del prototipo a la plataforma de
  Elysium, y cualquier `push` o `deploy`, es manual y la ejecuta una persona;
  el asistente no publica sin petición explícita (§8.1 del estándar).
- Modificar `elysium-core/`, según §4.2 del estándar.

## 6 · Formato de entrega

- Informes en Markdown, con la estructura fija de §2.2.
- Prototipo con la arquitectura de carpetas de §5 del estándar.
- Un resumen final que liste: funciones incluidas, decisiones de diseño
  tomadas, y todo lo que quedó como `[PENDIENTE]` esperando dato del prospecto.

---

# PARTE IV · PLANTILLAS COPIABLES

## IV.1 · Ficha de recolección

```text
PROSPECTO: [nombre comercial]
Razón social:            [ · o «no consta»]
Sector y actividad:      [ ]
Ubicación / zona:        [ ]
Idiomas necesarios:      [ ]
Servicios o productos:   [lista; precios si los publica]
Público objetivo:        [ ]
Contacto real:           WhatsApp [ ] · correo [ ] · redes [ ]
Identidad visual:        logotipo [sí/no] · colores [ ] · tipografías [ ] · fotografías [ ]
Sitio actual:            [URL o «no tiene»]
Frase del prospecto sobre su problema: "[cita textual]"
Referencias que le gustan: [URLs y motivo]
```

## IV.2 · Prompt del informe preliminar

```text
Actúe como analista de infraestructura digital de Elysium λ Development &
Research. Adjunto ELYSIUM-PROTOTYPING.md y ELYSIUM-STANDARDS.md; ambos son
vinculantes.

Tiene acceso a la carpeta _comercial/ de este proyecto. Léala por completo
antes de escribir.

Redacte 01-informe-preliminar.md siguiendo exactamente la estructura del §2.2:
retrato de la empresa, estado digital actual, FODA de infraestructura, el dolor
en una frase con su evidencia, hipótesis de solución, alcance propuesto del
prototipo y plan recomendado de los cinco del estándar.

Reglas: cada afirmación se apoya en un archivo de la carpeta y lo cita; ante
cualquier dato ausente escriba «no consta» en lugar de suponerlo; no prometa
posiciones en buscadores, plazos ni resultados de negocio.

Tipo de proyecto: [NUEVO / REDISEÑO]
```

## IV.3 · Prompt del prototipo

```text
Actúe como desarrollador sénior de Elysium λ. Adjunto ELYSIUM-PROTOTYPING.md,
ELYSIUM-STANDARDS.md y 02-informe-aprobado.md.

Genere el prototipo a partir del informe aprobado, y solo de él.

Requisitos no negociables:
  · Móvil primero: primera composición a 375 px; adaptación posterior.
  · Exactamente las nueve funciones del §3.2 (F01, F02, F03, F04, F05, F22,
    F06, F09, F10), con la marca del prospecto.
  · noindex, nofollow en todas las páginas.
  · Versión del pie exactamente V1.0.0 Beta (stage: 'Beta').
  · Nada de CRM, PWA, multi-idioma, divisas, Discovery Core ni SEO.
  · Datos de contacto reales del informe; si falta alguno, deje [PENDIENTE].

Configuración de marca:
  · Nombre:        [ ]
  · Color acento:  [#HEX]
  · Tipografías:   [ ]
  · Idioma:        [ ]
  · Contacto:      [WhatsApp / correo / redes]

Antes de escribir código, confirme el dolor diagnosticado que el prototipo debe
resolver y la lista de secciones que va a construir.
```

## IV.4 · Prompt del informe de mejoras (solo rediseños)

```text
La réplica fiel del sitio actual ya fue aprobada por el equipo.

Redacte 03-informe-mejoras.md con las mejoras propuestas, separadas en tres
bloques y ordenadas por impacto: estructurales, de diseño, y de estilo y
contenido.

Para cada propuesta indique qué se cambia, por qué, y qué se espera que mejore.
Marque como «sujeta a aprobación del prospecto» toda propuesta que altere sus
textos, sus precios o sus imágenes.

No implemente ninguna mejora todavía: este entregable es solo el informe.
```

## IV.5 · Lista de verificación por compuerta

**Compuerta 1 · Informe aprobado**
- [ ] Ficha mínima completa, sin datos inventados.
- [ ] En rediseños, auditoría de todas las páginas del sitio actual.
- [ ] FODA referido a infraestructura, no al negocio en abstracto.
- [ ] El dolor está enunciado en una frase y con evidencia.
- [ ] Plan recomendado justificado.
- [ ] Revisado y firmado por el equipo como `_comercial/02-informe-aprobado.md`.

**Compuerta 2 · Réplica aprobada (rediseños)**
- [ ] Estructura, textos y jerarquía equivalentes al sitio actual.
- [ ] No se corrigió nada por iniciativa propia.
- [ ] Revisada en un teléfono real.

**Compuerta 3 · Prototipo aprobado**
- [ ] Las nueve funciones presentes y operativas.
- [ ] Recorrido completo probado en un teléfono real.
- [ ] Contacto real del prospecto en el Magic Bottom.
- [ ] Ningún `[PENDIENTE]` visible en pantalla.
- [ ] `noindex, nofollow` en todas las páginas.
- [ ] El pie muestra exactamente `V1.0.0 Beta`.
- [ ] Arquitectura de producción (§3.1): nada llamado «prototipo», código listo
      para go-live, material comercial separado en `_comercial/`.

**Compuerta 4 · Publicación**
- [ ] `Disallow: /prototype-*` presente en el `robots.txt` de Elysium.
- [ ] Ausente de `sitemap.xml`, `llms.txt` y `llms-full.txt`.
- [ ] Enlace probado desde un dispositivo ajeno a la organización.
- [ ] Fecha de retirada acordada y anotada.
- [ ] La subida la ejecutó una persona del equipo, no un proceso automático (§8.1).

---

*Elysium λ Development & Research · Protocolo interno v1.2.0 · Complementa a
`ELYSIUM-STANDARDS.md`, que es la fuente única del catálogo de funciones y del
alcance por plan.*
