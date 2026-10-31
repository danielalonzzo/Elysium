# Elysium λ Institute — Syllabus del Cuatrimestre 1
### v1.0.0 · Agosto 2026 · Documento D4 del paquete fundacional
### Fundamentos Híbridos y Fase 1 del Proyecto · Semanas globales 1 a 16

> **Cómo leer este documento.** Es el contrato semanal del primer cuatrimestre.
> Cada semana declara sus resultados de aprendizaje, su nivel de IA permitido, el
> desglose minuto a minuto de las dos sesiones síncronas, el trabajo asíncrono de
> antes y después, el criterio de aceptación de la entrega y su traza al Trabajo
> Final de Graduación y a la investigación generacional.
>
> **Regla de congelación** (Carta, Anexo B). Este documento no se modifica durante
> el cuatrimestre en curso salvo corrección de errata, que se anota en §12.
>
> Se subordina a la Carta (D0), al Modelo Académico (D1), al Plan de Estudios (D2)
> y al Reglamento de Evaluación (D3).

---

# PARTE I · IDENTIFICACIÓN Y REGLAS

## 1 · Ficha del cuatrimestre

| Campo | Valor |
|---|---|
| **Cuatrimestre** | 1 de 3 · Semanas globales 1–16 |
| **Título** | Fundamentos Híbridos y Fase 1 del Proyecto |
| **Regla de arranque** | Segundo sábado de enero de cada año (Carta, disp. trans. 2.ª) |
| **Fechas · Generación I (Λ01)** | 9 de enero de 2027 → 2 de mayo de 2027 |
| **Fechas · Generación Piloto (Λ00)** | 12 de septiembre → 1 de noviembre de 2026 · sólo semanas 1 a 8 |
| **Receso** | 27 y 28 de marzo de 2027 (Semana Santa; Pascua el 28) |
| **Horario** | Sábado y domingo, **15:00–17:00 UTC** |
| **Aula** | Máximo 15 estudiantes · 10 ideal · piloto de 5 o 6 |
| **Coste** | **Ninguno.** Gratuito en su totalidad (Carta, art. 2 bis) |
| **Carga** | **4 h de clase + 4 h de estudio autónomo** por semana · 140 h en el cuatrimestre |
| **Nivel de IA** | **N1** en S01–S08 · **N2** en S09–S16 · **N0** en todo quiz y toda DAA |
| **Entregable de cierre (H1)** | Landing estática, accesible, responsiva y desplegada, del negocio propio |
| **Compuertas** | G1 (S03) · G2 (S08) · P1 (S10) · P2 (S16) · H1 (S16) |

## 2 · Objetivo del cuatrimestre

Al terminar la semana 16, la persona estudiante **escribe HTML, CSS y JavaScript
sin asistencia**, entiende por qué una interfaz es o no accesible y sabe
comprobarlo, explica cómo funciona internamente un modelo de lenguaje y en qué
casos no debe usarse, y tiene publicada en internet la primera versión real de la
plataforma de su propio negocio.

La razón de que el nivel de IA sea N1 durante las ocho primeras semanas está
argumentada en el D1 §6.1: es el tramo en que se construye el criterio con el que
más adelante se juzgará la salida de un modelo. Delegar aquí hipoteca el resto del
programa.

## 3 · Semana 0 · Incorporación (asíncrona, sin evaluación)

Se abre **diez días antes** del inicio. No tiene nota y no cuenta para la
asistencia. Existe porque la semana 1 no puede consumirse en instalar cosas (D2
§13, corrección 8).

```text
□ Cuenta de GitHub creada y verificada
□ Acceso al aula virtual y prueba de audio, vídeo y compartición de pantalla
□ Primer Codespace abierto sobre el repositorio `elysium-lab-c1` (5 min)
□ Lectura de la Carta Constitutiva, Partes I y II
□ Firma del Compromiso λ (Carta, Anexo A)
□ Firma del consentimiento informado de investigación (D8, Anexo I) — revocable
□ Cuestionario de línea base: experiencia previa, expectativas, uso actual de IA,
  autoevaluación metacognitiva (dato de partida de la investigación generacional)
□ Ficha de zona horaria y declaración de disponibilidad
□ Nota de una página: «el negocio que me gustaría construir» (borrador libre,
  no vinculante, sirve de punto de partida para G1)
```

## 4 · Cómo se lee cada semana

```text
### Semana NN · Título
> RA · Nivel de IA · Andamiaje · Entregable

Sábado · Antes (30 min)      trabajo previo obligatorio
Sábado · Durante (120 min)   20' apertura · 60' modelado · 40' pares
Sábado · Después (30 min)    quiz Q-NN con 3 ítems espaciados
Domingo · Antes (30 min)     entorno listo + predicción escrita
Domingo · Durante (120 min)  15' predicción · 90' código · 15' validación
Domingo · Después (60-90 min) Transferencia al proyecto propio
Criterio de aceptación       qué debe cumplirse para aprobar
Trazas                       TFG · Investigación
```

---

# PARTE II · LAS DIECISÉIS SEMANAS

## Módulo I · Estructura y presentación de la información (S01–S04)

### Semana 01 · La web como sistema y el árbol del documento

> **RA** RA-A1 · RA-F1 **·** **IA** N1 **·** **Andamiaje** A1 **·** **Entrega** `L01`

**Sábado · Antes (30 min).** Micro-guía *«Qué ocurre exactamente cuando escribo
una dirección y pulso Intro»*. Tres predicciones escritas: ¿quién guarda el
archivo que veo?, ¿el navegador recibe la página ya dibujada?, ¿qué diferencia hay
entre lo que escribí y lo que el navegador tiene en memoria?

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura con las tres predicciones erróneas más frecuentes.
- `00:20–01:20` · Modelado en vivo: recorrido completo de una petición (resolución
  de nombre, conexión, TLS, HTTP, respuesta, análisis sintáctico, construcción del
  árbol del documento). Se abren las herramientas del navegador y se **modifica un
  nodo en vivo** para mostrar que el DOM y el archivo HTML no son la misma cosa.
- `01:20–02:00` · Instrucción entre pares. Pregunta: *si edito el DOM desde las
  herramientas del navegador y recargo, ¿por qué desaparece mi cambio?*

**Sábado · Después (30 min).** `Q01`. Sin ítems espaciados (es la primera semana).

**Domingo · Antes (30 min).** Abrir el Codespace de `elysium-lab-c1`. Leer
`labs/L01/start/index.html` **sin ejecutarlo**. Escribir la predicción de qué se
verá en pantalla.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Contraste predicción / realidad. Se nombra la discrepancia.
- `00:15–01:45` · Construcción del primer documento HTML válido y publicación:
  estructura mínima, metadatos, `lang`, título; `git add`, `git commit`, `git push`;
  activación de la publicación estática y comprobación de la URL viva.
- `01:45–02:00` · Validación: el documento pasa el validador del W3C y la URL
  responde desde el teléfono de cada estudiante.

**Domingo · Después (60–90 min).** `T01` · **Transferencia**: crear el repositorio
personal del proyecto (`<usuario>-tfg`) con un `README.md` que declare en cinco
líneas qué negocio va a construir, para quién y qué problema resuelve. Este texto
es el germen de la Carta de Anteproyecto de la semana 3.

**Criterio de aceptación.** Documento HTML válido, desplegado y accesible por URL
pública; repositorio personal creado con `README` declarando la idea; al menos tres
`commit` con mensajes comprensibles.

**Trazas.** TFG → Fase 1, inicio. Investigación → cuestionario de línea base.

---

### Semana 02 · Semántica, árbol de accesibilidad y formularios

> **RA** RA-A1 · RA-A4 **·** **IA** N1 **·** **Andamiaje** A1 **·** **Entrega** `L02`

**Sábado · Antes (30 min).** Micro-guía *«Un `div` no significa nada»*. Predicción:
¿cómo sabe un lector de pantalla que un bloque es la navegación principal?

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura y dudas.
- `00:20–01:20` · Modelado en vivo con **demostración comparativa**: la misma
  página maquetada con contenedores genéricos y con elementos semánticos,
  recorridas ambas con un lector de pantalla real, en directo y con sonido. Árbol
  de accesibilidad en las herramientas del navegador. Los cuatro principios de
  WCAG (perceptible, operable, comprensible, robusto), el nivel AA de **WCAG 2.2**,
  y por qué desde el 28 de junio de 2025 esto dejó de ser una recomendación en la
  Unión Europea: Directiva (UE) 2019/882 y norma EN 301 549.
- `01:20–02:00` · Instrucción entre pares. Pregunta: *¿cuál de estas cuatro
  maquetaciones de formulario es accesible y por qué las otras tres no lo son?*

**Sábado · Después (30 min).** `Q02` · espaciado: S01.

**Domingo · Antes (30 min).** Instalar la extensión `axe DevTools`. Predicción
escrita sobre `labs/L02/start/`: ¿cuántas violaciones cree que encontrará y de qué
tipo?

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y primera ejecución de `axe`. Contraste.
- `00:15–01:45` · Construcción del esqueleto semántico completo (regiones,
  jerarquía de encabezados sin saltos, listas reales) y de un **formulario de
  contacto accesible**: etiqueta programática por control, agrupaciones con leyenda,
  texto de ayuda asociado, mensajes de error anunciados con región activa.
- `01:45–02:00` · Validación: `axe` sin violaciones serias ni críticas; recorrido
  completo con teclado, sin trampa de foco; jerarquía de encabezados correcta.

**Domingo · Después (60–90 min).** `T02` · Esqueleto semántico del proyecto propio,
con su formulario de contacto, auditado con `axe`.

**Criterio de aceptación.** Cero violaciones serias o críticas; navegación íntegra
por teclado; todo control de formulario con etiqueta programática.

**Trazas.** TFG → Fase 1. Reconstruye **F05 · Information System** del estándar.

---

### Semana 03 · Cascada, especificidad, modelo de caja y sistema de tokens

> **RA** RA-A2 **·** **IA** N1 **·** **Andamiaje** A2 **·** **Entrega** `L03` **·** **COMPUERTA G1**

**Sábado · Antes (30 min).** Micro-guía *«Por qué su regla CSS no se aplica»*.
Predicción sobre tres pares de selectores en conflicto.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado en vivo: origen y orden de la cascada, herencia, cálculo
  de especificidad con ejemplos deliberadamente conflictivos, modelo de caja y
  `box-sizing`, unidades absolutas frente a relativas, y **propiedades personalizadas
  como sistema de diseño**. Se muestra el antipatrón `!important` y se explica por
  qué resolverlo así se paga siempre más adelante.
- `01:20–02:00` · Instrucción entre pares. Pregunta: *dadas estas cuatro reglas en
  conflicto, ¿qué color tendrá el elemento?* (Distractores calibrados por
  especificidad, orden y herencia.)

**Sábado · Después (30 min).** `Q03` · espaciado: S02.

**Domingo · Antes (30 min).** Predicción sobre la hoja de estilos de partida:
señale las tres reglas que **no** surtirán efecto.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · Construcción de un **sistema de tokens** (color, escala
  tipográfica, escala de espaciado, radios, sombras) en propiedades personalizadas,
  y aplicación al esqueleto de la semana 2 sin escribir un solo valor literal
  fuera del sistema.
- `01:45–02:00` · Validación: contraste ≥ 4.5:1 verificado con herramienta; ningún
  color literal fuera de los tokens; cero `!important`.

**Domingo · Después (60–90 min).** `T03` · Sistema de tokens del proyecto propio
aplicado a su esqueleto.

> ### ⚑ Compuerta G1 · Carta de Anteproyecto
> **Vence:** domingo de la semana 3, 23:59 UTC. **Bloquea:** todas las
> Transferencias posteriores.
> Documento de dos páginas según la plantilla del **D9, Anexo I**: nicho, cliente
> concreto (con nombre y contexto, real o plausible y verificable), problema,
> propuesta de valor en una frase, tres competidores, y qué hará la plataforma que
> hoy no ocurre. Se evalúa con la rúbrica G1 del D9 §6.1.

**Criterio de aceptación.** Sistema de tokens completo y usado; contraste
conforme; G1 aprobada.

**Trazas.** TFG → **G1**, cierre de la Fase 1.

---

### Semana 04 · Mobile-first, Flexbox, Grid y tipografía fluida

> **RA** RA-A3 **·** **IA** N1 **·** **Andamiaje** A2 **·** **Entrega** `L04`

**Sábado · Antes (30 min).** Micro-guía *«Diseñar primero para 320 píxeles»*.
Predicción: ¿por qué es más fácil ampliar que reducir?

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado en vivo: enfoque *mobile-first* y consultas de medio
  ascendentes; ejes principal y transversal de Flexbox; áreas y plantillas de Grid;
  cuándo cada uno; tipografía fluida con `clamp()`; unidades de viewport y sus
  trampas en móvil.
- `01:20–02:00` · Instrucción entre pares. Pregunta: *¿este diseño es Flexbox o
  Grid, y qué se rompe si elige el otro?*

**Sábado · Después (30 min).** `Q04` · espaciado: S03, S01.

**Domingo · Antes (30 min).** Predicción sobre el comportamiento de la maquetación
de partida a 320 px.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste en el emulador de dispositivo.
- `00:15–01:45` · Adaptación responsiva completa entre 320 px y 2560 px, y
  reconstrucción de la cabecera móvil primero (equivalente a **F02 · Header
  Mobile-First**): menú accesible por teclado, foco atrapado correctamente cuando
  está abierto, y cierre con `Escape`.
- `01:45–02:00` · Validación en cuatro anchos: 320, 768, 1440 y 2560 px, sin
  desbordamiento horizontal ni pérdida de contenido.

**Domingo · Después (60–90 min).** `T04` · Proyecto propio responsivo con su
cabecera móvil primero.

**Criterio de aceptación.** Sin desplazamiento horizontal en ningún ancho; menú
operable íntegramente con teclado; texto legible al 200 % de zoom.

**Trazas.** TFG → Fase 2, inicio. Reconstruye **F02**.

---

## Módulo II · Lógica y lenguaje (S05–S08)

### Semana 05 · Datos, tipos y estado en JavaScript

> **RA** RA-B1 **·** **IA** N1 **·** **Andamiaje** A1 **·** **Entrega** `L05` **·** **Fracaso productivo**

**Sábado · Antes (30 min).** **Fracaso productivo dirigido** (D1 §2.8): antes de
toda explicación, resolver ocho comparaciones (`0 == ''`, `[] == false`,
`NaN === NaN`…) y anotar la predicción. Se entrega tanto el acierto como el error.
Nadie corrige nada todavía.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura sobre las respuestas del pre-work. Se muestran los
  patrones de error del grupo, sin nombres.
- `00:20–01:20` · Modelado en vivo: tipos primitivos y de referencia; `const` y
  `let` frente a `var`; coerción y por qué existe; igualdad estricta; valores
  verdaderos y falsos; mutabilidad y copia; arreglos y objetos como estructuras.
- `01:20–02:00` · Instrucción entre pares sobre alcance y mutación compartida.

**Sábado · Después (30 min).** `Q05` · espaciado: S04, S02.

**Domingo · Antes (30 min).** Preparar el entorno de pruebas (`npm install`) y
predecir la salida de `labs/L05/start/index.js`.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · Modelado de un objeto de dominio (un servicio con nombre, precio,
  duración y disponibilidad) y de las funciones que operan sobre él. **Primer
  contacto con el arnés de pruebas**: se ejecuta `npm test` y se hace pasar cada
  prueba una a una.
- `01:45–02:00` · Validación: `npm test` en verde.

**Domingo · Después (60–90 min).** `T05` · Modelar en JavaScript los datos reales
del negocio propio (servicios, precios, horarios) en un módulo de datos.

**Criterio de aceptación.** Todas las pruebas en verde; sin `var`; sin comparación
laxa salvo justificación escrita.

**Trazas.** TFG → Fase 2, modelo de dominio.

---

### Semana 06 · Control de flujo y primeros eventos del DOM

> **RA** RA-B2 · RA-B3 **·** **IA** N1 **·** **Andamiaje** A2 **·** **Entrega** `L06`

**Sábado · Antes (30 min).** Micro-guía *«Decidir: condicionales y cláusulas de
guarda»*. Predicción sobre tres condicionales anidados.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado en vivo: `if`/`else`, `switch`, operadores lógicos y
  cortocircuito, cláusulas de guarda frente al anidamiento profundo, y la
  **API del DOM**: `querySelector`, lectura y escritura de propiedades,
  `addEventListener`, el objeto del evento, `preventDefault`.
- `01:20–02:00` · Instrucción entre pares: *¿por qué este `addEventListener` dentro
  de un bucle se comporta así?*

**Sábado · Después (30 min).** `Q06` · espaciado: S05, S03.

**Domingo · Antes (30 min).** Predicción sobre el comportamiento del formulario de
partida al enviarlo vacío.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · Validación de formulario en el cliente: reglas por campo,
  mensajes de error **asociados programáticamente** al control, anuncio en región
  activa, foco desplazado al primer campo con error, y bloqueo del envío.
- `01:45–02:00` · Validación: prueba con teclado y con lector de pantalla; `npm test`.

**Domingo · Después (60–90 min).** `T06` · Validación accesible del formulario de
contacto del proyecto propio.

**Criterio de aceptación.** Un error de validación es percibido por una persona que
navega sólo con teclado y lector de pantalla, sin ver la pantalla.

**Trazas.** TFG → Fase 2. Dependencia dura hacia C2·S09.

---

### Semana 07 · Iteración, arreglos y renderizado de listas

> **RA** RA-B2 · RA-B3 **·** **IA** N1 **·** **Andamiaje** A3 **·** **Entrega** `L07`

**Sábado · Antes (30 min).** Micro-guía *«Repetir sin repetirse»*. Predicción de la
salida de tres bucles con condiciones de parada distintas.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado en vivo: `for`, `while`, `for…of`; errores clásicos de
  índice; `map`, `filter`, `reduce` y cuándo cada uno; transformación frente a
  mutación; construcción de fragmentos del DOM a partir de datos.
- `01:20–02:00` · Instrucción entre pares con **problemas de Parsons**: ordenar los
  bloques de una función de filtrado y otra de agregación.

**Sábado · Después (30 min).** `Q07` · espaciado: S06, S04, S01.

**Domingo · Antes (30 min).** Predicción sobre el renderizado de una lista de datos.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · Renderizado dinámico de un catálogo: pintar la lista, filtrar por
  categoría, ordenar, y resolver el **estado vacío** con un mensaje útil.
- `01:45–02:00` · Validación: pruebas en verde; el estado vacío existe y se anuncia.

**Domingo · Después (60–90 min).** `T07` · Catálogo de servicios del proyecto propio
renderizado desde datos, no escrito a mano en el HTML.

**Criterio de aceptación.** Ningún dato del catálogo escrito literalmente en el
HTML; estado vacío contemplado; pruebas en verde.

---

### Semana 08 · Funciones, módulos y contratos

> **RA** RA-B2 · RA-F1 **·** **IA** N1 **·** **Andamiaje** A3 **·** **Entrega** `L08` **·** **COMPUERTA G2**

**Sábado · Antes (30 min).** Micro-guía *«Una función, una responsabilidad»*.
Predicción: ¿qué devuelve esta función y qué efecto colateral produce?

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado en vivo: parámetros y valores por defecto; retorno
  explícito; alcance y cierre léxico (nivel introductorio); funciones puras frente
  a efectos colaterales; **módulos ES** con `import` y `export`; el contrato de una
  función como promesa que no se rompe.
- `01:20–02:00` · Instrucción entre pares: *¿cuál de estas cuatro funciones es pura
  y por qué importa?*

**Sábado · Después (30 min).** `Q08` · espaciado: S07, S05, S02.

**Domingo · Antes (30 min).** Leer el laboratorio 7 propio y **marcar en papel** las
tres responsabilidades que conviven en el mismo archivo.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Puesta en común de las divisiones propuestas.
- `00:15–01:45` · Refactorización del laboratorio 7 a módulos: `data`, `render`,
  `filters`, `main`. Las pruebas existentes deben seguir en verde **sin tocarlas**:
  esa es la prueba de que la refactorización no cambió el comportamiento.
- `01:45–02:00` · Validación: `npm test` en verde; ninguna función supera 25 líneas.

**Domingo · Después (60–90 min).** `T08` · Refactorización modular del proyecto
propio.

> ### ⚑ Compuerta G2 · Especificación y arquitectura de la información
> **Vence:** domingo de la semana 8, 23:59 UTC. **Bloquea:** el hito H1.
> Mapa del sitio, wireframes de cada vista (móvil y escritorio), modelo de dominio
> en JavaScript, y lista de requisitos funcionales priorizados. Plantilla y rúbrica
> en el **D9 §6.2**.

**Criterio de aceptación.** Pruebas en verde tras refactorizar sin modificarlas;
módulos con responsabilidad única; G2 aprobada.

---

## Módulo III · Teoría fundacional de la inteligencia artificial (S09–S12)

> **Nota de diseño.** Los sábados de este módulo son teóricos; **los domingos
> siguen siendo laboratorios de JavaScript y DOM**. El estudiante construye los
> instrumentos con los que estudia la IA, en lugar de pasar cuatro semanas sin
> programar. La justificación está en el D2 §13, corrección 2.

### Semana 09 · Anatomía de un modelo de lenguaje

> **RA** RA-E1 · RA-B3 **·** **IA** N2 **·** **Andamiaje** A3 **·** **Entrega** `L09` **·** **Fracaso productivo**

**Sábado · Antes (30 min).** **Fracaso productivo**: segmentar a mano en «unidades
mínimas» tres frases en español, incluida una con tildes y una con emoji, y
predecir cuántas unidades contará el modelo. Se entrega la predicción antes de
conocer la respuesta.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Contraste de las segmentaciones del grupo con el conteo real.
- `00:20–01:20` · Modelado conceptual: qué es un modelo de lenguaje grande; qué
  significa «predecir el siguiente token»; representación vectorial del significado;
  el mecanismo de atención explicado sin álgebra, con la metáfora del lector que
  decide a qué palabras anteriores mirar; entrenamiento previo, ajuste por
  instrucciones y alineación. Qué **no** es: ni una base de datos, ni un buscador,
  ni un razonador simbólico.
- `01:20–02:00` · Instrucción entre pares: *¿por qué el mismo prompt da respuestas
  distintas en dos ejecuciones?*

**Sábado · Después (30 min).** `Q09` · espaciado: S08, S06, S03.

**Domingo · Antes (30 min).** Predicción sobre la función de segmentación de
partida.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · **Instrumento 1 · Visualizador de tokenización.** Interfaz que
  recibe texto, lo segmenta con reglas propias, lo pinta con un color por unidad y
  compara el conteo propio con el de un tokenizador real cargado desde un fichero
  de referencia. Se observa el coste desigual del español frente al inglés.
- `01:45–02:00` · Validación: pruebas en verde; interfaz accesible por teclado.

**Domingo · Después (60–90 min).** `T09` · Analizar con el instrumento propio los
textos reales del proyecto y anotar en la bitácora cuánto contexto ocuparían.

**Criterio de aceptación.** El visualizador funciona con texto en español con
tildes, con emoji y con código, y el estudiante explica la diferencia de coste.

**Trazas.** Investigación → primer dato propio sobre coste del español.

---

### Semana 10 · Tokens, ventana de contexto, latencia y coste

> **RA** RA-E2 · RA-H1 **·** **IA** N2 **·** **Andamiaje** A3 **·** **Entrega** `L10` **·** **COMPUERTA P1**

**Sábado · Antes (30 min).** Micro-guía *«El contexto es finito y se paga»*.
Predicción: ¿cuánto costaría procesar el catálogo completo de su negocio?

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado: ventana de contexto y qué ocurre al desbordarla;
  distinción entre tokens de entrada y de salida y por qué se tarifan distinto;
  latencia de inferencia y por qué crece con la longitud; almacenamiento en caché
  del contexto; el compromiso entre coste, latencia y calidad al elegir modelo.
- `01:20–02:00` · **Sesión de investigación P1.** Formulación colectiva de la
  pregunta de investigación de la generación, sus variables y su criterio de
  refutación (D8 §3, hito P1).

**Sábado · Después (30 min).** `Q10` · espaciado: S09, S07, S04.

**Domingo · Antes (30 min).** Recopilar la tabla de precios pública de tres
familias de modelos.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción del coste mensual de un asistente para su negocio.
- `00:15–01:45` · **Instrumento 2 · Calculadora de contexto y coste.** Entrada:
  texto o fichero. Salida: tokens estimados, porcentaje de la ventana consumido por
  modelo, coste por consulta y proyección mensual según volumen. Comparación entre
  modelos leída desde un fichero de datos.
- `01:45–02:00` · Validación: pruebas en verde; los cálculos coinciden con la
  comprobación manual del docente.

**Domingo · Después (60–90 min).** `T10` · Estimación documentada del coste de una
funcionalidad de IA en el proyecto propio, con la decisión razonada de incluirla o
no.

> ### ⚑ Compuerta P1 · Pregunta de investigación de la generación
> Pregunta única, variables operacionalizadas, hipótesis y criterio de refutación,
> aprobados por el CEIC. Ver **D8 §3**.

---

### Semana 11 · Alucinación, sesgo y límites de verificabilidad

> **RA** RA-E3 **·** **IA** N2 **·** **Andamiaje** A4 **·** **Entrega** `L11`

**Sábado · Antes (30 min).** Provocar deliberadamente **tres respuestas falsas** en
un modelo de uso libre sobre un tema que el estudiante domine, y guardar las
transcripciones.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común de las falsedades recogidas, clasificadas por
  tipo.
- `00:20–01:20` · Modelado: por qué un modelo produce contenido falso con
  seguridad aparente; sesgo en los datos de entrenamiento y sesgo en la alineación;
  el problema de la verificabilidad; el sesgo de automatización en la persona
  usuaria; y la lista de casos en los que **un modelo no debe usarse**: decisiones
  jurídicas, médicas, financieras, y todo aquello cuyo error no se puede detectar
  sin ser ya experto.
- `01:20–02:00` · Instrucción entre pares con casos de decisión profesional real.

**Sábado · Después (30 min).** `Q11` · espaciado: S10, S08, S05.

**Domingo · Antes (30 min).** Diseñar un protocolo propio de diez pruebas.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de protocolos entre parejas.
- `00:15–01:45` · **Instrumento 3 · Registro de alucinaciones.** Aplicación que
  almacena cada prueba (prompt, respuesta, veredicto, evidencia contraria,
  categoría), la muestra en tabla filtrable y exporta a JSON. Trabajo con
  estructuras de datos y persistencia en el navegador.
- `01:45–02:00` · Validación: pruebas en verde; exportación válida.

**Domingo · Después (60–90 min).** `T11` · Diez pruebas documentadas sobre el
dominio del negocio propio. **Este conjunto de datos alimenta la investigación
generacional.**

**Criterio de aceptación.** Diez registros con evidencia contraria citada, no con
mera opinión.

---

### Semana 12 · Modelos propietarios y abiertos: elección con criterio

> **RA** RA-E1 · RA-E3 **·** **IA** N2 **·** **Andamiaje** A4 **·** **Entrega** `L12`

**Sábado · Antes (30 min).** Explorar un repositorio público de modelos abiertos y
anotar tres diferencias respecto a un servicio propietario.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado: familias de modelos y sus licencias; qué significa
  «abierto» (pesos abiertos no es lo mismo que código abierto ni que datos
  abiertos); ejecución local frente a servicio remoto; **dónde acaban los datos del
  cliente** cuando se usa un servicio de terceros, y qué implica eso para el RGPD;
  soberanía tecnológica y por qué le importa a una pyme europea.
- `01:20–02:00` · Instrucción entre pares: *para esta pyme concreta, ¿modelo
  propietario o abierto? Defienda la opción contraria a su intuición.*

**Sábado · Después (30 min).** `Q12` · espaciado: S11, S09, S06.

**Domingo · Antes (30 min).** Recoger las especificaciones de seis modelos en un
fichero de datos común.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción de qué modelo ganará en cada criterio.
- `00:15–01:45` · **Instrumento 4 · Comparador de modelos.** Lectura de un fichero
  de datos, renderizado en tabla ordenable y filtrable por ventana de contexto,
  coste, licencia y capacidad, con ficha de detalle. Integra todo lo aprendido en
  el módulo II.
- `01:45–02:00` · Validación: pruebas en verde; tabla navegable con teclado y
  ordenación anunciada correctamente.

**Domingo · Después (60–90 min).** `T12` · Decisión escrita y razonada de qué
modelo usaría en su proyecto y por qué, con el coste calculado en la semana 10.

**Criterio de aceptación.** Tabla accesible con ordenación anunciada; decisión
argumentada con datos propios, no con opinión.

---

## Módulo IV · Construcción del proyecto y auditoría (S13–S16)

### Semana 13 · Arquitectura de la información y contenido real

> **RA** RA-G1 · RA-A1 **·** **IA** N2 **·** **Andamiaje** A4 **·** **Entrega** `L13`

**Sábado · Antes (30 min).** Recorrer tres sitios de competidores del propio nicho
y anotar qué información busca un cliente y en cuántos clics la encuentra.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura con los hallazgos.
- `00:20–01:20` · Modelado: arquitectura de la información; el contenido se escribe
  **antes** que el diseño; jerarquía de mensajes; redacción para la web (frase
  corta, voz activa, encabezados que informan); el texto de sustitución como
  antipatrón que oculta problemas de contenido hasta que es tarde.
- `01:20–02:00` · Taller entre pares: cada estudiante presenta su mapa del sitio y
  recibe crítica de dos compañeros.

**Sábado · Después (30 min).** `Q13` · espaciado: S12, S10, S07.

**Domingo · Antes (30 min).** Escribir el titular y el subtitular del proyecto
propio en menos de 25 palabras.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Prueba de los titulares con lectura ciega entre pares.
- `00:15–01:45` · Redacción del **contenido real completo** del proyecto: todos los
  textos, sin excepción, escritos por la persona. Se permite nivel N2 para revisar
  ortografía y concisión, **no para generar el texto**, y así debe constar en
  `AI-USE.md`.
- `01:45–02:00` · Revisión de legibilidad y de coherencia con la propuesta de valor
  de G1.

**Domingo · Después (60–90 min).** `T13` · Mapa del sitio definitivo y contenido
completo en el repositorio del proyecto.

**Criterio de aceptación.** Cero texto de sustitución; contenido coherente con la
Carta de Anteproyecto; `AI-USE.md` que distingue revisión de generación.

---

### Semana 14 · Maquetación accesible del proyecto

> **RA** RA-A1 · RA-A4 **·** **IA** N2 **·** **Andamiaje** A5 **·** **Entrega** `L14`

**Sábado · Antes (30 min).** Micro-guía *«Patrones de página de aterrizaje que
funcionan y por qué»*.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado: secciones canónicas de una página de negocio y su
  función persuasiva; llamadas a la acción accesibles; imágenes con texto
  alternativo con significado frente a texto alternativo decorativo; datos
  estructurados como preparación del trabajo de SEO del cuatrimestre 3.
- `01:20–02:00` · Instrucción entre pares sobre casos de texto alternativo:
  *¿cuál de estas cinco imágenes debe llevar texto alternativo vacío?*

**Sábado · Después (30 min).** `Q14` · espaciado: S13, S11, S08.

**Domingo · Antes (30 min).** Predicción de las violaciones que espera encontrar.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y auditoría inicial.
- `00:15–01:45` · **Construcción del HTML completo del proyecto propio**, con
  contenido real, estructura semántica y formulario. Problema abierto: cada
  estudiante trabaja sobre su dominio, con el docente circulando.
- `01:45–02:00` · Auditoría con `axe` y recorrido por teclado.

**Domingo · Después (60–90 min).** `T14` · Remediación de todos los hallazgos.

**Criterio de aceptación.** Cero violaciones serias o críticas en el proyecto
propio; jerarquía de encabezados correcta; formulario íntegramente accesible.

---

### Semana 15 · Identidad visual, tema y micro-interacción

> **RA** RA-A2 · RA-A3 **·** **IA** N2 **·** **Andamiaje** A5 **·** **Entrega** `L15`

**Sábado · Antes (30 min).** Elegir una paleta y **comprobar su contraste antes de
enamorarse de ella**.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura con las paletas que no pasaron el contraste.
- `00:20–01:20` · Modelado: identidad visual mínima viable; escala tipográfica;
  ritmo vertical; tema claro y oscuro mediante propiedades personalizadas
  (equivalente a **F13 · Dynamic Theme** y **F14 · Theme Switcher**); animación
  con propósito y respeto obligatorio de `prefers-reduced-motion`.
- `01:20–02:00` · Crítica de diseño entre pares con protocolo estructurado.

**Sábado · Después (30 min).** `Q15` · espaciado: S14, S12, S09.

**Domingo · Antes (30 min).** Predicción sobre el comportamiento del cambio de tema.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · CSS completo del proyecto: tokens, responsividad, tema claro y
  oscuro con preferencia del sistema y conmutador persistente, aparición al
  desplazar (**F03**), desplazamiento suave a anclas (**F04**), pantalla de carga
  (**F01**) y firma (**F10**), todo respetando movimiento reducido.
- `01:45–02:00` · Validación de contraste en ambos temas.

**Domingo · Después (60–90 min).** `T15` · Cierre visual del proyecto y despliegue.

**Criterio de aceptación.** Contraste conforme **en los dos temas**; con
`prefers-reduced-motion` activo no se ejecuta ninguna animación no esencial.

---

### Semana 16 · Auditoría, revisión de código y entrega H1

> **RA** RA-F2 · RA-A4 · RA-A5 **·** **IA** N2 **·** **Entrega** `H1` **·** **COMPUERTAS P2 y H1** **·** **Presencia obligatoria**

**Sábado · Antes (30 min).** Ejecutar la Auditoría Técnica Elysium completa sobre
el proyecto propio y **predecir la puntuación** antes de mirar el informe.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Contraste entre puntuación esperada y obtenida. Se comenta el
  sesgo sistemático del grupo: casi siempre se sobreestima.
- `00:20–01:20` · **Revisión de código en vivo**: el docente revisa dos proyectos
  voluntarios delante de la clase con la rúbrica L, mostrando cómo se lee un
  informe de auditoría y en qué orden se remedian los hallazgos (crítico → mayor →
  menor).
- `01:20–02:00` · **Sesión de investigación P2**: cierre y preinscripción del
  protocolo de la investigación generacional (D8 §3).

**Sábado · Después (30 min).** `Q16` · examen de recuperación acumulativo del
cuatrimestre, con ítems de S01 a S15.

**Domingo · Antes (30 min).** Lista de remediación ordenada por severidad.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Plan de remediación individual, revisado por el docente.
- `00:15–01:30` · Remediación y despliegue definitivo.
- `01:30–02:00` · **Defensa del hito H1** en salas paralelas: 7 minutos de
  exposición y 8 de preguntas, con cámara obligatoria y sin asistencia de IA.

**Domingo · Después.** Entrega definitiva antes del martes 23:59 UTC.

> ### ⚑ Hito H1 · Entrega del Cuatrimestre 1
> **Landing estática del negocio propio**, desplegada en URL pública, con:
> contenido real, estructura semántica, sistema de tokens, responsividad de 320 a
> 2560 px, tema claro y oscuro, formulario accesible con validación, `README`
> ejecutable por un tercero, `AI-USE.md` completo y memoria parcial del TFG
> (secciones 1 a 4 según D9 §7).
>
> **Umbrales ATE aplicables:** ATE-A completo, ATE-P (P1 ≥ 95, P2, P3), ATE-Q,
> ATE-D. ATE-S se limita a S1 (sin secretos en el repositorio). ATE-C no aplica
> todavía.
>
> **Bloquea la matrícula en el Cuatrimestre 2.**

---

# PARTE III · ADMINISTRACIÓN DEL CUATRIMESTRE

## 5 · Mapa de evaluación

| Componente | Peso | Instrumentos de este cuatrimestre |
|---|:---:|---|
| **A · Continua** | 40 % | `Q01`–`Q16` (12 mejores) 15 % · `L01`–`L15` 25 % |
| **B · Proyecto** | 30 % | `T01`–`T15` 12 % · G1 (8 %) + G2 (10 %) 18 % |
| **C · Hito** | 30 % | H1: ATE apta + rúbrica de producto 60 % + defensa 40 % |
| **Apto / no apto** | — | 2 DAA mínimo · asistencia ≥ 80 % · `AI-USE.md` en toda entrega · P1 y P2 |

## 6 · Calendario

### 6.1 · Generación I (Λ01) · enero a mayo de 2027

| Semana | Sábado | Domingo | Marca |
|:---:|---|---|---|
| 01 | 9-I-2027 | 10-I-2027 | **Arranque del programa** |
| 02 | 16-I-2027 | 17-I-2027 | |
| 03 | 23-I-2027 | 24-I-2027 | **G1 · Carta de Anteproyecto** |
| 04 | 30-I-2027 | 31-I-2027 | |
| 05 | 6-II-2027 | 7-II-2027 | |
| 06 | 13-II-2027 | 14-II-2027 | DAA ventana 1 |
| 07 | 20-II-2027 | 21-II-2027 | |
| 08 | 27-II-2027 | 28-II-2027 | **G2 · Especificación** |
| 09 | 6-III-2027 | 7-III-2027 | |
| 10 | 13-III-2027 | 14-III-2027 | **P1** · EE. UU. y Cuba cambian de hora el domingo |
| 11 | 20-III-2027 | 21-III-2027 | |
| — | **27-III-2027** | 28-III-2027 | **RECESO de Semana Santa** · Europa cambia de hora el domingo |
| 12 | 3-IV-2027 | 4-IV-2027 | Chile cambia de hora el domingo |
| 13 | 10-IV-2027 | 11-IV-2027 | DAA ventana 2 |
| 14 | 17-IV-2027 | 18-IV-2027 | |
| 15 | 24-IV-2027 | 25-IV-2027 | Cierre de reintentos |
| 16 | 1-V-2027 | 2-V-2027 | **P2 · H1** · presencia obligatoria |

> **Coincidencia afortunada.** El cambio de hora europeo de primavera cae el domingo
> 28 de marzo de 2027, es decir **dentro del receso de Semana Santa**. Ninguna sesión
> se ve afectada por él.

### 6.2 · Generación Piloto (Λ00) · septiembre a noviembre de 2026

Cohorte de **cinco o seis personas por invitación**, que cursa **sólo las semanas 1 a
8** (módulos I y II), sin certificado y sin investigación generacional (Carta, disp.
trans. 3.ª).

| Semana | Sábado | Marca |
|:---:|---|---|
| 01 | 12-IX-2026 | Arranque del piloto |
| 03 | 26-IX-2026 | **G1** |
| 05 | 10-X-2026 | |
| 08 | 31-X-2026 | **G2** · cierre del piloto (domingo 1-XI) · Europa cambió de hora el 25-X |

**Adaptaciones del piloto, y sólo del piloto:**

| Elemento | En el piloto |
|---|---|
| Alcance | Semanas 1 a 8 únicamente. Las semanas 9 a 16 no se imparten. |
| Compuertas P1 y P2 (investigación) | **No aplican.** |
| Certificado y microcredencial | **No se expiden**, y así se comunica por escrito antes de aceptar la plaza. |
| Recesos | Ninguno. Ocho fines de semana seguidos. |
| Rol de los participantes | **Colaboradores del diseño.** Al cierre de cada semana rellenan una ficha de defectos del material que alimenta el registro de erratas (§12). |
| Continuidad | Derecho preferente a plaza en la Generación I y oferta de actuar como **tutor par** en sus ocho primeras semanas. |

**Los dos meses siguientes.** Del 7 de noviembre de 2026 al 8 de enero de 2027 no hay
docencia. Ese periodo está reservado a **corregir los materiales con los hallazgos
del piloto** y a cerrar la convocatoria de la Generación I. Es la razón de que el
piloto dure ocho semanas y no dieciséis.

### 6.3 · Aviso de cambio de hora

El horario está anclado a **15:00 UTC** (D7 §13), de modo que **nada cambia nunca
para América Latina continental**. Sólo se desplaza el reloj de pared de quienes
viven en un territorio que todavía cambia de hora. En el C1 de la Generación I:

- **Domingo 14-III-2027** (semana 10): Estados Unidos y Cuba adelantan.
- **Domingo 28-III-2027**: Europa adelanta, pero cae en receso.
- **Domingo 4-IV-2027** (semana 12): Chile retrasa, y pasa de 12:00 a 11:00 local.

Se recuerda por anuncio escrito la semana previa, siempre.

## 7 · Recursos permanentes

| Recurso | Uso |
|---|---|
| `elysium-lab-c1` (Codespaces) | Repositorio de laboratorios con arnés de pruebas |
| `<usuario>-tfg` | Repositorio personal del proyecto |
| Documentación web de referencia (MDN) | Fuente canónica de la plataforma |
| `axe DevTools` | Auditoría de accesibilidad |
| Lighthouse | Rendimiento y buenas prácticas |
| Validador del W3C | Corrección del marcado |
| Lector de pantalla del sistema | NVDA, VoiceOver u Orca |
| Guía rápida WCAG 2.2 (W3C) | Referencia normativa |

## 8 · Bibliografía del cuatrimestre

- W3C. *HTML Living Standard* y *WCAG 2.2*, con las *Understanding* de cada criterio.
- MDN Web Docs. *Learn web development* y referencia de la API del DOM.
- Directiva (UE) 2019/882 y EN 301 549, en la parte aplicable a sitios web.
- Documentación pública de las familias de modelos usadas en el módulo III.
- Material propio del Instituto: micro-guías `MG01`–`MG16` y fichas `L01`–`L15`.

## 9 · Adaptaciones y ajustes razonables

Toda persona con discapacidad, con conectividad limitada o con circunstancias
familiares acreditadas puede solicitar ajustes en cualquier momento
(Carta, art. 62). Ajustes previstos y ya diseñados: prórroga estándar del 50 % en
laboratorios, transcripción textual de toda sesión, entrega en audio como
alternativa a la escrita en las Transferencias, y sesión de tutoría en horario
alternativo cuando la franja de 15:00 UTC coincida con obligación laboral fija
acreditada.

## 10 · Qué **no** entra en este cuatrimestre

Para evitar expectativas equivocadas: no se estudian marcos de trabajo de
JavaScript, ni preprocesadores de CSS, ni bases de datos, ni peticiones de red, ni
autenticación, ni despliegue con integración continua. Todo eso llega en C2 y C3,
y llega **después** de que la plataforma base esté comprendida.

## 11 · Contrato de expectativas del docente

El docente de este cuatrimestre se compromete a: publicar la micro-guía del sábado
con 72 horas de antelación; devolver toda calificación en 7 días con los tres
campos obligatorios; grabar y subtitular las 32 sesiones; no tocar nunca el teclado
del estudiante; y anotar en §12 cualquier semana en la que menos del 60 % alcance
el criterio en primer intento, que se considerará defectuosa **por diseño** y no
por el grupo (D1 §9).

## 12 · Registro de erratas y de semanas defectuosas

| Fecha | Semana | Naturaleza | Corrección aplicada | Efecto sobre notas |
|---|---|---|---|---|
| *(vacío al inicio de la generación)* | | | | |

---

*Elysium λ Institute of Development & Research · D4 · «Abstrahere, aedificare, probare.»*
