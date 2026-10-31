# Elysium λ Institute — Syllabus del Cuatrimestre 2
### v1.0.0 · Agosto 2026 · Documento D5 del paquete fundacional
### Programación Asistida por Agentes, Datos y Fase 2 del Proyecto · Semanas globales 17 a 32

> **Cómo leer este documento.** Mismo formato que el D4. Cada semana declara sus
> resultados de aprendizaje, su nivel de IA, el desglose minuto a minuto de las dos
> sesiones síncronas, el trabajo asíncrono y el criterio de aceptación.
>
> **El cambio de régimen de este cuatrimestre.** Aquí se abre el nivel **N3**: la
> IA pasa a ser par programador y se permite **dirigir un agente dentro del editor**
> en tareas de varios pasos sobre el propio repositorio. Ese permiso sólo es
> defendible porque durante dieciséis semanas se construyó el criterio para juzgarla
> (D1 §6.1). Su precio son tres contrapesos: declaración obligatoria con apartado de
> rechazos, **tres** Defensas Aleatorias de Autoría en lugar de dos, y las dos
> decisiones estructurales del cuatrimestre (G4 y G5) reservadas a nivel **N0**.
>
> Lo que **no** se abre todavía es el agente que actúa fuera del editor: el que se
> ejecuta en el servidor, escribe en producción o se comunica con terceros. Eso es
> N4 y llega en el Cuatrimestre 3. La frontera y su porqué están en el D1 §6.2.
>
> **Regla de congelación** (Carta, Anexo B). No se modifica durante el
> cuatrimestre en curso salvo errata, anotada en §12.

---

# PARTE I · IDENTIFICACIÓN Y REGLAS

## 1 · Ficha del cuatrimestre

| Campo | Valor |
|---|---|
| **Cuatrimestre** | 2 de 3 · Semanas globales 17–32 |
| **Título** | Programación Asistida por Agentes, Datos y Fase 2 del Proyecto |
| **Fechas · Generación I (Λ01)** | 8 de mayo de 2027 → 22 de agosto de 2027 |
| **Receso** | **Ninguno.** Dieciséis fines de semana consecutivos (Carta, disp. trans. 2.ª) |
| **Horario** | Sábado y domingo, **15:00–17:00 UTC** |
| **Aula** | Máximo 15 estudiantes · 10 ideal · una sola por generación |
| **Coste** | **Ninguno** (Carta, art. 2 bis) |
| **Carga** | **4 h de clase + 4 h de estudio autónomo** por semana |
| **Prerrequisito** | H1 aprobado (Carta, art. 42) |
| **Nivel de IA** | **N3 · agente en el editor** · **N0** en quices, DAA y en el diseño de G4 y G5 |
| **Entregable de cierre (H2)** | Aplicación web dinámica con base de datos en la nube, panel de administración y despliegue continuo con compuerta bloqueante |
| **Compuertas** | G4 (S23) · G5 (S27) · P3 (S24) · P4 (S32) · H2 (S32) |

## 2 · Objetivo del cuatrimestre

Al terminar la semana 32, la persona estudiante **conecta su plataforma a datos
reales en la nube**, los protege con reglas que deniegan por defecto y demuestra
esa protección con casos negativos, despliega de forma continua con una compuerta
de calidad que bloquea publicaciones defectuosas, y trabaja con asistentes de IA
declarando y justificando cada aceptación y cada rechazo.

## 3 · La regla que gobierna el nivel N3

> **La IA puede escribir código. No puede decidir la arquitectura, el modelo de
> datos ni la regla de negocio.**

Operativamente, en este cuatrimestre **se permite**: generar componentes,
refactorizar, escribir pruebas, documentar, y encargar a un agente del editor una
tarea de varios pasos sobre el repositorio propio.

**Se prohíbe**: pegar el enunciado del laboratorio en un modelo; aceptar una sola
línea sin haberla leído íntegramente; y delegar el diseño del esquema de datos o de
las reglas de seguridad, que se toman en papel y se defienden oralmente a nivel
**N0** en las compuertas G4 y G5.

### 3.1 · Qué es agente y qué no, en este cuatrimestre

| Sí, es N3 y se permite | No, es N4 y espera al C3 |
|---|---|
| «Extrae esta lógica a un módulo y actualiza los `import`.» | «Cada vez que llegue una reserva, contesta al cliente.» |
| «Escribe las pruebas que faltan para este archivo.» | «Publica esto en producción cuando pasen las pruebas.» |
| «Recorre el proyecto y encuentra dónde se repite este patrón.» | «Borra los documentos que lleven más de un año.» |
| «Propóneme tres formas de resolver esto con sus costes.» | «Elige tú y aplícalo sin preguntarme.» |

La diferencia no es la potencia de la herramienta: es **si su peor error se revierte
con `git` o no**. Todo lo de la columna izquierda produce texto en un editor que
usted lee antes de que exista. Todo lo de la derecha produce un hecho en el mundo.

### 3.2 · La declaración

Cada entrega incorpora `AI-USE.md` con el apartado 5 (*qué rechacé y por qué*)
cumplimentado. Un apartado 5 vacío se devuelve sin calificar: significa que se
aceptó todo, y aceptar todo es no revisar. Con agente en el editor este apartado
importa más que nunca, porque el agente produce mucho más texto del que produciría
un autocompletado, y por tanto hay mucho más que rechazar.

---

# PARTE II · LAS DIECISÉIS SEMANAS

## Módulo V · La IA en el flujo de trabajo (S01–S03)

### Semana 17 · C2·S01 · Instrucción técnica a modelos

> **RA** RA-E4 **·** **IA** N3 **·** **Andamiaje** A2 **·** **Entrega** `L17`

**Sábado · Antes (30 min).** Pedir a un modelo la misma función de tres maneras
distintas (vaga, detallada, con ejemplo y restricciones) y guardar las tres
salidas. No juzgarlas todavía.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Comparación de las tres salidas del grupo. Se observa que la
  variabilidad depende más de la instrucción que del modelo.
- `00:20–01:20` · Modelado en vivo: anatomía de una instrucción técnica útil
  (contexto, rol, entrada, salida esperada, restricciones, criterio de éxito,
  formato); ejemplos dentro de la instrucción; por qué pedir el razonamiento antes
  que la respuesta cambia el resultado; y el error dominante del novato, que es
  pedir una solución en lugar de pedir opciones con sus compromisos.
- `01:20–02:00` · Instrucción entre pares: reescribir en parejas una instrucción
  mala hasta que produzca código revisable, y medir cuántas iteraciones costó.

**Sábado · Después (30 min).** `Q17` · espaciado: C1·S15, C1·S12, C1·S08.

**Domingo · Antes (30 min).** Configurar el asistente en el editor. Escribir el
**guion metacognitivo** de la primera consulta prevista (D1 §6.4).

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción: ¿qué parte del componente cree que el modelo hará
  bien y cuál mal?
- `00:15–01:45` · Generación asistida de un componente de interfaz completo con
  criterios de accesibilidad dados de antemano. Regla del laboratorio: **cada línea
  aceptada se lee en voz alta al par antes de aceptarla**.
- `01:45–02:00` · Validación: pruebas en verde, `axe` limpio y `AI-USE.md` con el
  apartado 5 relleno.

**Domingo · Después (60–90 min).** `T17` · Un componente del proyecto propio
generado con asistencia, con la lista de lo aceptado y lo rechazado.

**Criterio de aceptación.** El apartado *qué rechacé y por qué* contiene al menos
tres rechazos justificados. Si el modelo acertó todo, el reto era demasiado fácil y
se sustituye.

---

### Semana 18 · C2·S02 · Leer el error antes de arreglarlo

> **RA** RA-B6 **·** **IA** N2 (nivel reducido a propósito) **·** **Andamiaje** A3 **·** **Entrega** `L18`

**Sábado · Antes (30 min).** Recibir cinco trazas de error reales y escribir, para
cada una, **qué cree que ocurrió** sin ejecutar nada.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Contraste de hipótesis.
- `00:20–01:20` · Modelado en vivo: anatomía de una traza de pila; leerla de abajo
  arriba; distinguir el síntoma del origen; los cinco errores canónicos de
  JavaScript y su firma; el depurador (puntos de interrupción, paso a paso,
  inspección de ámbito, expresiones de vigilancia); y el método: **hipótesis →
  experimento → confirmación → sólo entonces, cambio**.
- `01:20–02:00` · Depuración en directo de un fallo aportado por un estudiante,
  con el docente formulando en voz alta cada hipótesis y su prueba.

**Sábado · Después (30 min).** `Q18` · espaciado: C2·S01, C1·S13, C1·S09.

**Domingo · Antes (30 min).** Predicción sobre el fallo del código de partida.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · Reparación de cinco defectos en una base de código ajena,
  llevando una **bitácora de depuración** obligatoria: hipótesis previa, prueba
  realizada, resultado, conclusión. Se permite pedir al modelo que **interprete** el
  error (N2), nunca que lo arregle.
- `01:45–02:00` · Validación: pruebas en verde y bitácora con cinco entradas
  completas.

**Domingo · Después (60–90 min).** `T18` · Depurar un fallo real del proyecto propio
con la misma bitácora.

**Criterio de aceptación.** La bitácora contiene la hipótesis **antes** del arreglo.
Una bitácora escrita a posteriori se detecta por el historial de Git y se devuelve.

> **Por qué esta semana baja a N2.** Delegar el diagnóstico es delegar exactamente
> la destreza que separa a un desarrollador de un pegador de fragmentos. Se
> restituye N3 la semana siguiente.

---

### Semana 19 · C2·S03 · Agentes en el editor y refactorización

> **RA** RA-E4 · RA-B5 **·** **IA** N3 **·** **Andamiaje** A3 **·** **Entrega** `L19`

**Sábado · Antes (30 min).** Micro-guía *«Refactorizar es cambiar la forma sin
cambiar el comportamiento»*. Predicción: ¿cómo se demuestra que no cambió?

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado: qué es un agente en el editor y en qué se diferencia de
  la sugerencia línea a línea; ventana de contexto del repositorio; catálogo de
  refactorizaciones (extraer función, renombrar, invertir condición, sustituir
  número mágico); la red de seguridad: **no se refactoriza sin pruebas**; y la
  evidencia sobre tasas de aceptación acrítica en programadores noveles, que en la
  literatura oscilan aproximadamente entre el 10 % y el 53 %, como advertencia
  sobre la propia conducta.
- `01:20–02:00` · Instrucción entre pares: *¿cuál de estas cuatro sugerencias del
  asistente introduce un fallo sutil?*

**Sábado · Después (30 min).** `Q19` · espaciado: C2·S02, C1·S14, C1·S10.

**Domingo · Antes (30 min).** Elegir el módulo propio más difícil de leer.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción de qué se romperá al refactorizar.
- `00:15–01:45` · Refactorización asistida de código propio del cuatrimestre 1, con
  las pruebas existentes como red. Regla: **las pruebas no se tocan**. Si hay que
  tocarlas, no era una refactorización.
- `01:45–02:00` · Validación: mismas pruebas, mismo resultado, mejor código.

**Domingo · Después (60–90 min).** `T19` · Refactorización de un módulo del proyecto,
con medición antes y después (líneas, funciones, complejidad).

**Criterio de aceptación.** Las pruebas originales pasan sin modificación.

---

## Módulo VI · Asincronía y consumo de servicios (S04–S06)

### Semana 20 · C2·S04 · El bucle de eventos, promesas y `async`/`await`

> **RA** RA-B4 **·** **IA** N3 **·** **Andamiaje** A2 **·** **Entrega** `L20` **·** **Fracaso productivo**

**Sábado · Antes (30 min).** **Fracaso productivo**: ordenar la salida esperada de
un fragmento con `console.log`, `setTimeout(…, 0)` y una promesa resuelta. Casi
nadie acierta, y ese es el objetivo.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Contraste de ordenaciones. Se cuentan los aciertos: suelen ser
  pocos, y se dice en voz alta que eso es normal y esperado.
- `00:20–01:20` · Modelado: JavaScript como lenguaje de un solo hilo; la pila; la
  cola de macrotareas y la de microtareas; el bucle de eventos paso a paso, dibujado
  en pantalla; la promesa como valor futuro y sus tres estados; `async`/`await`
  como azúcar sintáctico sobre lo mismo; manejo de errores con `try`/`catch`;
  `Promise.all` frente a la espera secuencial.
- `01:20–02:00` · Instrucción entre pares con cuatro fragmentos de orden de
  ejecución no obvio.

**Sábado · Después (30 min).** `Q20` · espaciado: C2·S03, C1·S15, C1·S11.

**Domingo · Antes (30 min).** Predicción de la secuencia de salida del código de
partida.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · Simulación de retrasos de red: función que devuelve una promesa
  con retardo variable y probabilidad de fallo; interfaz que muestra de forma
  correcta los estados de **cargando**, **éxito**, **vacío** y **error**; reintento
  con retroceso exponencial.
- `01:45–02:00` · Validación: los cuatro estados existen, son accesibles y se
  anuncian a lector de pantalla.

**Domingo · Después (60–90 min).** `T20` · Los cuatro estados de interfaz aplicados
al proyecto propio.

**Criterio de aceptación.** Los cuatro estados están implementados y anunciados. Una
interfaz que sólo contempla el éxito no aprueba.

---

### Semana 21 · C2·S05 · HTTP y la Fetch API

> **RA** RA-C1 · RA-B5 **·** **IA** N3 **·** **Andamiaje** A4 **·** **Entrega** `L21`

**Sábado · Antes (30 min).** Inspeccionar en el navegador las peticiones de un sitio
conocido y anotar tres cabeceras que no entienda.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura con las cabeceras desconocidas.
- `00:20–01:20` · Modelado: HTTP como protocolo de texto; métodos y su semántica;
  familias de códigos de estado y qué significan de verdad; cabeceras de contenido,
  autorización y caché; intercambio de recursos entre orígenes y por qué el
  navegador lo bloquea; `fetch`, `Request`, `Response`; y por qué `fetch` **no
  rechaza** ante un código 404, que es la trampa que atrapa a todo el mundo la
  primera vez.
- `01:20–02:00` · Instrucción entre pares sobre códigos de estado en escenarios reales.

**Sábado · Después (30 min).** `Q21` · espaciado: C2·S04, C2·S01, C1·S12.

**Domingo · Antes (30 min).** Predicción de qué devolverá la petición de partida.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · Consumo de una API pública con manejo completo de estados y
  errores, encapsulado en un módulo cliente. **A partir de esta semana el estudiante
  escribe sus propias pruebas** (`RA-B5`): la especificación se entrega vacía.
- `01:45–02:00` · Validación: pruebas propias que cubren éxito, vacío, error de red
  y error de servidor.

**Domingo · Después (60–90 min).** `T21` · Un dato externo real integrado en el
proyecto propio, con sus cuatro estados.

**Criterio de aceptación.** Cuatro pruebas propias como mínimo, una por estado; el
módulo cliente no toca el DOM.

---

### Semana 22 · C2·S06 · JSON, transformación y renderizado

> **RA** RA-C1 · RA-B3 **·** **IA** N3 **·** **Andamiaje** A4 **·** **Entrega** `L22`

**Sábado · Antes (30 min).** Micro-guía *«Los datos que llegan nunca tienen la
forma que su interfaz necesita»*.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado: JSON, sus tipos y sus límites (sin fechas, sin
  comentarios, sin referencias); serialización y análisis; acceso seguro a
  propiedades anidadas; validación de forma en la frontera del sistema; la capa de
  transformación entre el formato del servicio y el modelo de la interfaz, y por qué
  mezclarlas produce un sistema imposible de cambiar.
- `01:20–02:00` · Instrucción entre pares: *¿dónde debe vivir esta transformación?*

**Sábado · Después (30 min).** `Q22` · espaciado: C2·S05, C2·S02, C1·S13.

**Domingo · Antes (30 min).** Predicción de qué falla al recibir datos incompletos.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste con una respuesta deliberadamente sucia.
- `00:15–01:45` · Capa de transformación y validación, con renderizado dinámico
  resistente a datos ausentes, nulos o con tipo inesperado.
- `01:45–02:00` · Validación: la interfaz no se rompe con ninguno de los seis
  cuerpos de respuesta defectuosos provistos.

**Domingo · Después (60–90 min).** `T22` · Capa de datos del proyecto propio.

---

## Módulo VII · Persistencia en la nube (S07–S11)

### Semana 23 · C2·S07 · Modelado de datos: relacional frente a documental

> **RA** RA-C2 **·** **IA** **N0 en el diseño**, N3 en el código **·** **Andamiaje** A4 **·** **Entrega** `L23` **·** **COMPUERTA G4**

**Sábado · Antes (30 min).** Dibujar **en papel** cómo guardaría los datos de su
negocio. Fotografiar y entregar. Sin ayuda de ningún tipo.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Se proyectan varios papeles anónimos y se comparan enfoques.
- `00:20–01:20` · Modelado: entidad y relación; normalización y sus formas
  normales, brevemente; el modelo documental y por qué invierte la regla; la
  pregunta que gobierna todo el diseño documental, que no es *«cómo son mis datos»*
  sino **«cómo los voy a consultar»**; desnormalización deliberada y su coste de
  escritura; colección, documento, subcolección; los límites del servicio elegido.
- `01:20–02:00` · Taller: cada pareja rediseña el esquema del otro para una consulta
  nueva que no estaba prevista.

**Sábado · Después (30 min).** `Q23` · espaciado: C2·S06, C2·S03, C1·S14.

**Domingo · Antes (30 min).** Listar las diez consultas que su aplicación necesitará.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de las listas de consultas.
- `00:15–01:45` · Diseño del esquema documental definitivo: colecciones, campos,
  tipos, índices previstos, y **justificación escrita de cada desnormalización**.
  Todavía sin escribir una línea de código de base de datos.
- `01:45–02:00` · Defensa de dos minutos por estudiante ante su pareja.

**Domingo · Después (60–90 min).** `T23` · Esquema del proyecto propio documentado.

> ### ⚑ Compuerta G4 · Modelo de datos aprobado
> **Vence:** domingo de la semana 23. **Bloquea:** H2.
> Esquema documental con: cada colección y sus campos tipados, las diez consultas
> previstas, la justificación de cada desnormalización, y el volumen estimado a
> doce meses. **Se defiende oralmente a nivel N0.** Rúbrica en D9 §6.3.

**Criterio de aceptación.** Cada decisión de desnormalización tiene una consulta
que la justifica. Un esquema «bonito» sin consultas que lo motiven no aprueba.

---

### Semana 24 · C2·S08 · Base de datos en la nube

> **RA** RA-C3 **·** **IA** N3 **·** **Andamiaje** A3 **·** **Entrega** `L24` **·** **COMPUERTA P3**

**Sábado · Antes (30 min).** Crear el proyecto en la consola del servicio y anotar
tres cosas que no entienda de la configuración.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura con las dudas de configuración.
- `00:20–01:20` · Modelado: qué es un servicio de datos como plataforma y qué se
  gana y se pierde frente a un servidor propio; el modelo de datos del servicio;
  lectura única frente a suscripción en tiempo real; consultas, índices compuestos y
  el error clásico de la consulta que exige un índice que no existe; el modelo de
  facturación por operación y cómo un bucle mal escrito genera una factura.
- `01:20–02:00` · **Sesión de investigación P3**: cierre del instrumento de recogida
  y ensayo piloto (D8 §3).

**Sábado · Después (30 min).** `Q24` · espaciado: C2·S07, C2·S04, C1·S15.

**Domingo · Antes (30 min).** Predicción de qué ocurre al leer una colección vacía.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · Creación de las colecciones del esquema aprobado en G4; carga de
  datos de prueba; primera lectura desde la aplicación; primera suscripción en
  tiempo real con dos pestañas abiertas para ver la sincronización.
- `01:45–02:00` · Validación: la lectura funciona, se cancela la suscripción al
  desmontar, y no hay claves de configuración sensibles en el repositorio.

**Domingo · Después (60–90 min).** `T24` · Colecciones del proyecto propio creadas y
pobladas. **Piloto de recogida de datos de la investigación.**

---

### Semana 25 · C2·S09 · Crear y leer

> **RA** RA-C3 · RA-A1 **·** **IA** N3 **·** **Andamiaje** A4 **·** **Entrega** `L25`

**Sábado · Antes (30 min).** Micro-guía *«De un formulario accesible a un documento
en la nube»*.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado: el recorrido completo del dato desde el control del
  formulario hasta el documento persistido; validación en cliente frente a
  validación en servidor y por qué la primera **nunca** es suficiente; marcas de
  tiempo del servidor; identificadores; escritura optimista y su reversión;
  idempotencia y el problema del doble envío.
- `01:20–02:00` · Instrucción entre pares: *¿qué pasa si el usuario pulsa enviar dos
  veces?*

**Sábado · Después (30 min).** `Q25` · espaciado: C2·S08, C2·S05, C2·S01.

**Domingo · Antes (30 min).** Predicción de qué ocurre al enviar el formulario sin
conexión.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste en modo sin red.
- `00:15–01:45` · Inserción desde el formulario accesible construido en C1·S06, con
  estados de envío, bloqueo del doble envío, confirmación anunciada a lector de
  pantalla, y lectura de la lista resultante en tiempo real.
- `01:45–02:00` · Validación: pruebas propias; el doble envío no crea dos documentos.

**Domingo · Después (60–90 min).** `T25` · Formulario de contacto del proyecto propio
conectado a la nube.

**Criterio de aceptación.** El doble envío no duplica; la confirmación se percibe
sin ver la pantalla.

---

### Semana 26 · C2·S10 · Actualizar y borrar

> **RA** RA-C3 **·** **IA** N3 **·** **Andamiaje** A4 **·** **Entrega** `L26`

**Sábado · Antes (30 min).** Buscar tres interfaces reales con confirmación de
borrado y evaluar cuál protege mejor de un error.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura con los ejemplos.
- `00:20–01:20` · Modelado: actualización parcial frente a sustitución completa;
  operaciones atómicas y transacciones; borrado físico frente a borrado lógico y
  cuándo cada uno; conflictos de escritura concurrente; y el diseño accesible de la
  confirmación destructiva (diálogo modal con foco atrapado, retorno del foco, y
  acción reversible cuando sea posible).
- `01:20–02:00` · Instrucción entre pares sobre escritura concurrente.

**Sábado · Después (30 min).** `Q26` · espaciado: C2·S09, C2·S06, C2·S02.

**Domingo · Antes (30 min).** Predicción sobre dos escrituras simultáneas.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste con dos pestañas.
- `00:15–01:45` · Tabla de gestión con edición en línea, borrado con confirmación
  accesible, y deshacer temporal. Manejo de conflictos.
- `01:45–02:00` · Validación: el diálogo atrapa y devuelve el foco; se puede
  gestionar toda la tabla sólo con teclado.

**Domingo · Después (60–90 min).** `T26` · Gestión de datos del proyecto propio.

---

### Semana 27 · C2·S11 · Reglas de seguridad y casos negativos

> **RA** RA-D1 **·** **IA** **N0 en el diseño de reglas** **·** **Andamiaje** A4 **·** **Entrega** `L27` **·** **COMPUERTA G5** **·** **Fracaso productivo**

**Sábado · Antes (30 min).** **Fracaso productivo**: se entrega la URL de una
aplicación de práctica con reglas abiertas. Intentar leer y modificar datos que no
deberían ser accesibles. Documentar lo conseguido. Es un ejercicio autorizado sobre
un entorno del Instituto y nada más.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común de lo que cada quien logró leer y borrar. El
  efecto pedagógico de ver la propia base de datos vaciada por un compañero no lo
  produce ninguna diapositiva.
- `00:20–01:20` · Modelado: el cliente **nunca** es de confianza; el lenguaje de
  reglas; denegación por defecto; reglas por colección y por operación; validación
  de forma del documento en la propia regla; el error de creer que ocultar la
  interfaz protege el dato; y la **batería de casos negativos** como única prueba
  aceptable de que una regla funciona.
- `01:20–02:00` · Escritura colectiva de reglas, atacadas en directo por el docente.

**Sábado · Después (30 min).** `Q27` · espaciado: C2·S10, C2·S07, C2·S03.

**Domingo · Antes (30 min).** Escribir diez casos negativos: diez cosas que **nadie**
debería poder hacer.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de los casos negativos entre parejas.
- `00:15–01:45` · Implementación de las reglas del proyecto y de la batería
  automatizada con el emulador local: los diez casos negativos deben **fallar**, y
  los cinco positivos deben **pasar**.
- `01:45–02:00` · Validación: batería completa en verde, ejecutada en la compuerta
  de integración continua.

**Domingo · Después (60–90 min).** `T27` · Reglas del proyecto propio con su batería.

> ### ⚑ Compuerta G5 · Reglas de seguridad probadas
> **Vence:** domingo de la semana 27. **Bloquea:** H2.
> Reglas con denegación por defecto, batería automatizada de **10 casos negativos y
> 5 positivos**, y defensa oral a nivel N0 de por qué cada regla es necesaria y
> suficiente. Corresponde a `ATE-S`, comprobaciones S2 y S3.

**Criterio de aceptación.** Cero casos negativos que pasen. Un solo caso negativo
que pase es hallazgo **crítico** y bloquea la compuerta.

---

## Módulo VIII · Ingeniería, despliegue y cierre (S12–S16)

### Semana 28 · C2·S12 · Git profesional, versionado y compuerta de calidad

> **RA** RA-F1 · RA-C4 **·** **IA** N3 **·** **Andamiaje** A3 **·** **Entrega** `L28`

**Sábado · Antes (30 min).** Leer el §7 y el §8 de `ELYSIUM-STANDARDS.md`
(versionado y protocolo de publicación).

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura sobre el sistema de versionado de la empresa.
- `00:20–01:20` · Modelado: ramas, fusión y reorganización del historial; conflictos
  y su resolución; solicitudes de incorporación y revisión de código; el formato de
  mensaje de la casa; **integración continua** con una acción que ejecuta pruebas,
  `axe` y Lighthouse y **bloquea la publicación** si no se alcanzan los umbrales
  (flujo `qa-lighthouse.yml` del estándar, §6); URLs limpias (**F23**); variables de
  entorno y secretos, y por qué una clave en el historial ya está comprometida
  aunque se borre después.
- `01:20–02:00` · Revisión de código entre pares sobre solicitudes reales.

**Sábado · Después (30 min).** `Q28` · espaciado: C2·S11, C2·S08, C2·S04.

**Domingo · Antes (30 min).** Predicción: ¿qué hará la compuerta con su código actual?

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y primera ejecución de la compuerta.
- `00:15–01:45` · Configuración del despliegue continuo con compuerta bloqueante;
  se provoca deliberadamente un fallo de accesibilidad para **ver el bloqueo
  funcionar**; se corrige y se publica.
- `01:45–02:00` · Validación: la publicación sólo ocurre con la compuerta en verde.

**Domingo · Después (60–90 min).** `T28` · Despliegue continuo del proyecto propio con
compuerta activa.

**Criterio de aceptación.** Existe evidencia de al menos una publicación bloqueada
por la compuerta y su posterior corrección.

---

### Semana 29 · C2·S13 · Auditoría y refactorización del proyecto

> **RA** RA-F2 · RA-A5 **·** **IA** N3 **·** **Andamiaje** A5 **·** **Entrega** `L29`

**Sábado · Antes (30 min).** Ejecutar la ATE completa y **predecir la puntuación**.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Contraste esperado/obtenido. Se cuantifica el sesgo de
  sobreestimación del grupo, que suele repetirse desde C1·S16.
- `00:20–01:20` · Modelado: lectura de un informe de rendimiento; causa raíz de
  cada métrica; imágenes, tipografías y bloqueo del renderizado; carga diferida;
  presupuesto de rendimiento; y la disciplina de **medir antes y después de cada
  cambio**, porque optimizar a ciegas suele empeorar.
- `01:20–02:00` · Auditoría cruzada: cada estudiante audita el proyecto de otro y
  entrega un informe con hallazgos ordenados por severidad.

**Sábado · Después (30 min).** `Q29` · espaciado: C2·S12, C2·S09, C2·S05.

**Domingo · Antes (30 min).** Plan de remediación priorizado.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión del plan con el docente.
- `00:15–01:45` · Remediación con medición antes y después de cada intervención.
- `01:45–02:00` · Validación: ATE-P con P1 ≥ 95 y P2, P3, P4 dentro de umbral.

**Domingo · Después (60–90 min).** `T29` · Informe de auditoría del proyecto propio
con métricas antes y después.

---

### Semana 30 · C2·S14 · Los datos del negocio

> **RA** RA-C2 · RA-C3 **·** **IA** N3 **·** **Andamiaje** A5 **·** **Entrega** `L30`

**Sábado · Antes (30 min).** Revisar el esquema de G4 y anotar qué cambiaría ahora
que ha construido sobre él.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común: qué enseñó la construcción sobre el diseño. Casi
  todo el mundo cambia algo, y eso es una lección sobre el diseño, no un fracaso.
- `00:20–01:20` · Modelado: migración de esquema sin perder datos; datos derivados y
  agregados; paginación; consultas costosas y cómo detectarlas; copias de seguridad
  y exportación, que es también un derecho de la persona usuaria bajo el RGPD.
- `01:20–02:00` · Taller de rediseño por pares.

**Sábado · Después (30 min).** `Q30` · espaciado: C2·S13, C2·S10, C2·S06.

**Domingo · Antes (30 min).** Plan de migración escrito.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión del plan.
- `00:15–01:45` · Conexión completa del proyecto propio a sus datos reales: todas
  las entidades del negocio, con paginación y exportación.
- `01:45–02:00` · Validación: la aplicación funciona con 500 documentos de prueba
  sin degradarse.

**Domingo · Después (60–90 min).** `T30` · Datos del negocio completos y poblados.

---

### Semana 31 · C2·S15 · Panel de administración en tiempo real

> **RA** RA-C3 · RA-A4 **·** **IA** N3 **·** **Andamiaje** A5 **·** **Entrega** `L31`

**Sábado · Antes (30 min).** Recorrer un panel de administración real y anotar qué
información aparece primero y por qué.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado: qué necesita ver quien administra un negocio en los
  primeros cinco segundos; jerarquía de la información en un panel; tablas de datos
  accesibles (encabezados asociados, ordenación anunciada, resumen); actualización
  en tiempo real sin robar el foco ni desplazar el contenido bajo el cursor;
  equivalente reducido de **F18 · Personalized CRM** y **F25 · Client Records**.
- `01:20–02:00` · Crítica de diseño de paneles entre pares.

**Sábado · Después (30 min).** `Q31` · espaciado: C2·S14, C2·S11, C2·S07.

**Domingo · Antes (30 min).** Boceto del panel propio.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión de bocetos.
- `00:15–01:45` · Construcción del panel: lectura de mensajes de clientes en tiempo
  real, marcado como atendido, filtros y búsqueda, y contador de pendientes.
- `01:45–02:00` · Validación: tabla accesible; la actualización en vivo no rompe la
  posición ni el foco del usuario.

**Domingo · Después (60–90 min).** `T31` · Panel del proyecto propio.

**Criterio de aceptación.** La llegada de un mensaje nuevo mientras se lee la tabla
no desplaza el contenido ni roba el foco.

---

### Semana 32 · C2·S16 · Pruebas de extremo a extremo, documentación y H2

> **RA** RA-B5 · RA-F3 **·** **IA** N3 **·** **Entrega** `H2` **·** **COMPUERTAS P4 y H2** **·** **Presencia obligatoria**

**Sábado · Antes (30 min).** Escribir los cinco recorridos críticos de su
plataforma en lenguaje natural.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común de recorridos.
- `00:20–01:00` · Modelado: pirámide de pruebas; pruebas de extremo a extremo con
  navegador automatizado; selección de elementos por rol accesible, que es la
  práctica que hace la prueba y la accesibilidad converger; documentación técnica
  que permite a un tercero ejecutar el proyecto.
- `01:00–02:00` · **Sesión de investigación P4**: cierre y validación del lote de
  datos de la generación (D8 §3).

**Sábado · Después (30 min).** `Q32` · recuperación acumulativa del cuatrimestre.

**Domingo · Antes (30 min).** Lista de comprobación previa a la entrega.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión de la lista.
- `00:15–01:30` · Pruebas de extremo a extremo de los cinco recorridos, `README`
  definitivo y despliegue final.
- `01:30–02:00` · **Defensa del hito H2**: 7 minutos de exposición y 8 de preguntas,
  cámara obligatoria, sin asistencia de IA.

> ### ⚑ Hito H2 · Entrega del Cuatrimestre 2
> **Aplicación web dinámica desplegada**, con: datos en la nube, formulario
> conectado, panel de administración en tiempo real, reglas de seguridad con
> batería de casos negativos en verde, despliegue continuo con compuerta bloqueante,
> pruebas propias de unidad y de extremo a extremo, `README` ejecutable por un
> tercero, `AI-USE.md` completo, y memoria del TFG secciones 1 a 7 (D9 §7).
>
> **Umbrales ATE aplicables:** ATE-A, ATE-P, ATE-S completos, ATE-C (C1, C2, C3),
> ATE-Q, ATE-D.
>
> **Bloquea la matrícula en el Cuatrimestre 3.**

---

# PARTE III · ADMINISTRACIÓN DEL CUATRIMESTRE

## 5 · Mapa de evaluación

| Componente | Peso | Instrumentos |
|---|:---:|---|
| **A · Continua** | 40 % | `Q17`–`Q32` (12 mejores) 15 % · `L17`–`L31` 25 % |
| **B · Proyecto** | 30 % | `T17`–`T31` 12 % · G4 (9 %) + G5 (9 %) 18 % |
| **C · Hito** | 30 % | H2: ATE apta + rúbrica de producto 60 % + defensa 40 % |
| **Apto / no apto** | — | **3 DAA mínimo** (D3 §10.3) · asistencia ≥ 80 % · `AI-USE.md` con apartado 5 · P3 y P4 |

## 6 · Calendario de la Generación I

| Sem. global | C2 | Sábado | Marca |
|:---:|:---:|---|---|
| 17 | S01 | 8-V-2027 | Arranque · **apertura de N3** |
| 18 | S02 | 15-V-2027 | Nivel reducido a N2 a propósito |
| 19 | S03 | 22-V-2027 | |
| 20 | S04 | 29-V-2027 | **DAA ventana 1** |
| 21 | S05 | 5-VI-2027 | |
| 22 | S06 | 12-VI-2027 | |
| 23 | S07 | 19-VI-2027 | **G4 · Modelo de datos** (defensa a N0) |
| 24 | S08 | 26-VI-2027 | **P3 · piloto de recogida** |
| 25 | S09 | 3-VII-2027 | |
| 26 | S10 | 10-VII-2027 | **DAA ventana 2** |
| 27 | S11 | 17-VII-2027 | **G5 · Reglas de seguridad** (defensa a N0) |
| 28 | S12 | 24-VII-2027 | |
| 29 | S13 | 31-VII-2027 | |
| 30 | S14 | 7-VIII-2027 | **DAA ventana 3** |
| 31 | S15 | 14-VIII-2027 | Cierre de reintentos |
| 32 | S16 | 21-VIII-2027 | **P4 · H2** · presencia obligatoria |
| — | — | 28-VIII-2027 | **RECESO intercuatrimestral** antes del C3 |

**Ningún cambio de hora afecta a este cuatrimestre.** Entre mayo y agosto no hay
transición estacional en ninguno de los husos del programa. Es el único de los tres
cuatrimestres del que puede decirse.

> ### El coste del año natural, dicho sin rodeos
>
> Este cuatrimestre se imparte en **dieciséis fines de semana consecutivos**, de
> mayo a agosto, sin una sola pausa, y atraviesa el verano boreal. Es la
> consecuencia directa de encajar 48 semanas lectivas dentro de un año natural
> (Carta, disp. trans. 2.ª), y el Instituto la asume en lugar de disimularla.
>
> Los tres mecanismos que la compensan ya existen y conviene recordarlos aquí, en
> vez de esperar a que alguien se agote: **asistencia diferida** hasta el 25 % de las
> sesiones con grabación y parte de sesión (Carta, art. 44.2); **tres prórrogas de
> 72 horas** por cuatrimestre que se activan avisando antes y sin justificar
> (D3 §13); y **congelación de matrícula sin coste** con reincorporación a la
> generación siguiente (D1 §8.1).
>
> Si al cierre de la Generación I la encuesta de percepción muestra que la carga de
> este tramo fue insostenible, se reforma la regla del año natural antes de la
> Generación II. El dato se publicará diga lo que diga (Carta, art. 15).

## 7 · Presupuesto de servicios en la nube

Todo el cuatrimestre opera dentro de las **capas gratuitas** de los servicios
elegidos. El Instituto asume el coste de los entornos compartidos de laboratorio.
La regla operativa que se enseña desde la semana 24 es que **un bucle mal escrito
contra una base de datos facturada por operación genera una factura**, y por eso el
laboratorio de esa semana incluye el ejercicio de estimar el coste de la propia
aplicación antes de lanzarla. Si un estudiante supera la capa gratuita, la
Secretaría lo cubre y el caso se estudia en aula como incidente real de ingeniería.

## 8 · Bibliografía del cuatrimestre

- MDN Web Docs: Fetch API, Promises, bucle de eventos, módulos ES.
- Documentación oficial del servicio de base de datos y de sus reglas de seguridad.
- `ELYSIUM-STANDARDS.md`, §6 (estándares transversales y compuerta de calidad),
  §7 (versionado) y §8 (protocolo de publicación).
- Literatura sobre asistentes de IA y programadores noveles citada en el D1 §6.1.
- Material propio: micro-guías `MG17`–`MG32` y fichas `L17`–`L31`.

## 9 · Qué **no** entra en este cuatrimestre

No se estudian autenticación de personas usuarias, rutas privadas, pagos,
agendamiento ni agentes en el servidor. Todo eso es el cuatrimestre 3, y llega
después de que los datos estén correctamente modelados y protegidos.

## 10 · Registro de erratas y de semanas defectuosas

| Fecha | Semana | Naturaleza | Corrección aplicada | Efecto sobre notas |
|---|---|---|---|---|
| *(vacío al inicio de la generación)* | | | | |

---

*Elysium λ Institute of Development & Research · D5 · «Abstrahere, aedificare, probare.»*
