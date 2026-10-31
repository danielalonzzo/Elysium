# Elysium λ Institute — Modelo Académico
### v1.0.0 · Agosto 2026 · Documento D1 del paquete fundacional

> **Cómo leer este documento.** Aquí se explica **por qué** el Instituto enseña
> como enseña. La Parte I fija la fundamentación científica: cada decisión de
> diseño se declara junto a la evidencia que la sostiene, para que pueda ser
> discutida y, si procede, refutada. La Parte II describe la maquinaria concreta
> del Ciclo λ, minuto a minuto. La Parte III regula el uso de la inteligencia
> artificial en el aprendizaje, que es la parte más delicada del modelo. La Parte
> IV trata la comunidad y la motivación. La Parte V es el aseguramiento de la
> calidad docente. Los anexos son plantillas de uso diario.
>
> Este documento se subordina a la Carta Constitutiva (`ELYSIUM-INSTITUTE-CHARTER.md`)
> y gobierna el plan de estudios (D2), el reglamento de evaluación (D3) y el
> syllabus del programa (D4).
>
> **Nota epistemológica.** Las referencias que se citan son el estado del
> conocimiento tal como el Instituto lo entiende en agosto de 2026. Ninguna de
> ellas es dogma. El art. 15 de la Carta obliga al Instituto a medir su propio
> desempeño; si los datos de la Generación I contradicen alguna de las decisiones
> de esta Parte I, se reforma la decisión, no se ocultan los datos.

---

# PARTE I · FUNDAMENTACIÓN CIENTÍFICA

## 1 · El problema que este modelo intenta resolver

El programa dispone de **cuatro horas síncronas por semana** y de estudiantes que
trabajan o estudian de lunes a viernes, distribuidos en catorce husos horarios,
con conectividad desigual y sin experiencia previa de programación. En esas
condiciones, tres modos de enseñanza fracasan de forma predecible:

1. **La clase magistral en directo.** Consume la única hora en que el docente está
   disponible en aquello que el estudiante puede hacer solo: escuchar. Desperdicia
   el recurso escaso.
2. **El curso grabado autoadministrado.** La literatura de educación en línea es
   consistente en que la ausencia de presencia docente y de compromiso social
   produce abandonos masivos. La motivación no es un rasgo del estudiante: es un
   producto del diseño.
3. **El bootcamp de inmersión total.** Excluye por definición a quien no puede
   dejar de trabajar, es decir, a la mayoría del público al que el art. 16 de la
   Carta obliga a servir.

El modelo Elysium λ responde con una tesis: **la hora síncrona se reserva para lo
que sólo puede ocurrir en compañía**, esto es, la producción con corrección
inmediata, la discusión de decisiones de diseño y la articulación en voz alta del
propio razonamiento. Todo lo demás se desplaza fuera de ella, antes y después.

## 2 · Los once mecanismos y sus decisiones de diseño

Cada fila declara el mecanismo, la evidencia principal que lo respalda, la
decisión de diseño que el Instituto adopta en consecuencia y el lugar del
programa donde esa decisión se observa. Las decisiones son verificables: si una
no se cumple en el syllabus, el syllabus está mal.

### 2.1 · Aula invertida sin recorte de tiempo síncrono

| | |
|---|---|
| **Mecanismo** | Trasladar la exposición inicial fuera del aula libera el tiempo compartido para práctica y discusión. |
| **Evidencia** | El metaanálisis de van Alten, Phielix, Janssen y Kester (2019, *Educational Research Review* 28, k = 114) encuentra un efecto positivo pequeño sobre los resultados de aprendizaje y ninguno sobre la satisfacción. Sus análisis de moderadores son lo verdaderamente informativo: el efecto es **mayor cuando el tiempo presencial no se reduce** y **mayor cuando se añaden cuestionarios** al ciclo. |
| **Decisión λ** | Se invierte el aula **sin recortar ni un minuto** de las cuatro horas síncronas, y se añade **un cuestionario obligatorio** al cierre de cada sesión teórica. El pre-work no sustituye a la clase: la habilita. |
| **Dónde se ve** | D1 §4 (Ciclo λ), D4 (bloques *Antes* y quices `Q01`–`Q15`). |

> **Consecuencia contraintuitiva que el Instituto acepta.** El mismo metaanálisis
> indica que invertir el aula **no mejora la satisfacción**. El Instituto asume
> que su modelo puede resultar más exigente y menos cómodo que un curso grabado, y
> lo comunica en la admisión (D7, §9). No se vende comodidad.

### 2.2 · Práctica de recuperación y espaciamiento

| | |
|---|---|
| **Mecanismo** | Recuperar información de la memoria consolida más que releerla; distribuir la práctica en el tiempo consolida más que concentrarla. |
| **Evidencia** | Roediger y Karpicke (2006) sobre el efecto de examen; Dunlosky, Rawson, Marsh, Nathan y Willingham (2013, *Psychological Science in the Public Interest* 14-1) clasifican **práctica de recuperación** y **práctica distribuida** como las dos únicas técnicas de **utilidad alta** entre diez evaluadas. Subrayar y releer quedan en utilidad baja. |
| **Decisión λ** | (a) Quiz de recuperación al cierre de cada sábado, no de opción única sino de **producción** (escribir la línea, predecir la salida, corregir el error). (b) Cada quiz incluye **tres ítems de semanas anteriores** con espaciamiento creciente (1, 3 y 6 semanas atrás). (c) Ninguna sesión repasa: recupera. |
| **Dónde se ve** | D3 §5 (diseño de quices), D4 (campo *espaciado* de cada quiz). |

### 2.3 · Carga cognitiva y ejemplos resueltos con desvanecimiento

| | |
|---|---|
| **Mecanismo** | La memoria de trabajo del novato se satura si se le pide resolver antes de haber visto resolver. El ejemplo resuelto reduce la carga extraña; el andamiaje debe retirarse a medida que crece la pericia, porque mantenerlo perjudica al experto (efecto de reversión por pericia). |
| **Evidencia** | Teoría de la carga cognitiva de Sweller; efecto del ejemplo resuelto; efecto de reversión por pericia (Kalyuga y cols., 2003); modelo de los cuatro componentes 4C/ID de van Merriënboer y Kirschner. |
| **Decisión λ** | Cada laboratorio se construye sobre una **secuencia de desvanecimiento en cuatro pasos**: ejemplo completo → ejemplo con huecos → problema de completar → problema abierto. En el cuatrimestre 1 el 60 % de la práctica es de los dos primeros tipos; en el 3 lo es el 10 %. |
| **Dónde se ve** | D1 §5.2 (escalera de andamiaje), campo *Andamiaje* de cada semana en D4. |

### 2.4 · Leer código antes de escribirlo: PRIMM

| | |
|---|---|
| **Mecanismo** | El novato que escribe antes de saber leer programa por imitación superficial. Predecir, ejecutar e investigar código ajeno antes de modificarlo y crear el propio construye el modelo mental de la máquina. |
| **Evidencia** | El marco **PRIMM** (Predict–Run–Investigate–Modify–Make) de Sentance y Waite, con base sociocultural vygotskiana, y su evaluación con profesorado (SIGCSE 2019). Aborda el problema documentado de novatos que escriben programas antes de poder leerlos. |
| **Decisión λ** | Todo laboratorio empieza con **predicción escrita** sobre código que el estudiante todavía no ha ejecutado, y sólo después se ejecuta. La predicción se registra: es dato para la investigación generacional y espejo metacognitivo para el estudiante. |
| **Dónde se ve** | D4, bloque `00:00–00:15` de cada domingo. |

### 2.5 · Problemas de Parsons como evaluación de bajo coste

| | |
|---|---|
| **Mecanismo** | Ordenar bloques de código desordenados evalúa la comprensión de la estructura y la lógica sin el coste cognitivo de la sintaxis. |
| **Evidencia** | El informe del grupo de trabajo ITiCSE 2022 *Parsons Problems and Beyond* documenta que estos problemas se resuelven en menos tiempo que escribir código desde cero o reparar código defectuoso **sin sacrificar el aprendizaje**, y que permiten calificación más fiable. Las variantes con desvanecimiento (*faded Parsons*) mejoran la instrucción de patrones. |
| **Decisión λ** | Los quices de programación de los cuatrimestres 1 y 2 usan **problemas de Parsons con desvanecimiento** como formato principal. Reservan el tiempo escaso del estudiante para pensar, no para pelear con puntos y comas. |
| **Dónde se ve** | D3 §5. |

### 2.6 · Aprendizaje cognitivo: hacer visible el pensamiento del experto

| | |
|---|---|
| **Mecanismo** | La programación es un oficio cuyo trabajo real es invisible: ocurre dentro de la cabeza del experto. El aprendizaje cognitivo lo externaliza mediante modelado, entrenamiento, andamiaje, articulación, reflexión y exploración. |
| **Evidencia** | Collins, Brown y Newman (1989), *Cognitive Apprenticeship: Teaching the Crafts of Reading, Writing, and Mathematics*. |
| **Decisión λ** | El docente programa en vivo **incluyendo sus errores** y verbalizando sus dudas, prohibido el código pre-escrito que se pega. Y a la inversa: el estudiante narra su razonamiento en voz alta durante los laboratorios en parejas. El error del docente en directo es material didáctico, no un accidente. |
| **Dónde se ve** | D1 §4.2 (bloque de 60 minutos), Anexo A (guion del docente). |

### 2.7 · Instrucción entre pares

| | |
|---|---|
| **Mecanismo** | Ante una pregunta conceptual difícil, discutir con un par que sostiene otra respuesta produce más aprendizaje que escuchar la explicación correcta. |
| **Evidencia** | Peer Instruction de Mazur; su replicación en informática por Porter, Bailey Lee y Simon, con reducción documentada de tasas de fracaso en cursos introductorios. |
| **Decisión λ** | Los 40 minutos finales del sábado son **instrucción entre pares** con protocolo fijo: voto individual → discusión en parejas → segundo voto → cierre del docente. Se registran ambos votos: el desplazamiento entre uno y otro es un indicador de calidad de la pregunta. |
| **Dónde se ve** | D1 §4.2, D4 (bloque de instrucción entre pares). |

### 2.8 · Fracaso productivo antes de la instrucción

| | |
|---|---|
| **Mecanismo** | Intentar y fallar en un problema antes de recibir la explicación prepara el terreno conceptual y mejora la transferencia, aunque el intento no llegue a la solución. |
| **Evidencia** | Programa de investigación de Kapur sobre *productive failure*. |
| **Decisión λ** | Se usa **de forma selectiva y no como norma general**: sólo en los seis puntos del programa donde el concepto tiene una intuición previa errónea documentada (asincronía, alcance de variables, especificidad CSS, reglas de seguridad, colisión de reservas, tokenización). El fracaso productivo con carga cognitiva alta y novatos absolutos es contraproducente; el Instituto lo acota. |
| **Dónde se ve** | Campo *Fracaso productivo* en las semanas **4, 7, 10 y 12** del D4. |

### 2.9 · Dominio con reintento, no promedio con arrastre

| | |
|---|---|
| **Mecanismo** | Si la unidad *n+1* depende de la *n*, aprobar la *n* con 71 arrastra una deuda que se acumula hasta el colapso. El aprendizaje para el dominio exige corregir antes de avanzar. |
| **Evidencia** | Bloom (1984) sobre el problema de las dos sigmas y la tradición de *mastery learning* de Guskey. El Instituto adopta el mecanismo **sin suscribir la magnitud del efecto**: la cifra de dos desviaciones típicas no ha sido replicada de forma robusta y no se usa como argumento comercial (Carta, art. 18). |
| **Decisión λ** | Todo laboratorio admite **reintento hasta alcanzar el criterio**, con techo de calificación decreciente (100 / 85 / 70) y fecha límite dura al cierre del módulo. Las **compuertas** de proyecto (D9) no admiten arrastre: no se pasa de fase con la anterior no aprobada. |
| **Dónde se ve** | D3 §14 (política de reintento), D9 §4 (compuertas). |

### 2.10 · Alineamiento constructivo

| | |
|---|---|
| **Mecanismo** | Resultados de aprendizaje, actividades y evaluación deben apuntar al mismo verbo y al mismo nivel cognitivo. Si el resultado dice «diseñar» y el examen pide «recordar», el estudiante estudia para recordar. |
| **Evidencia** | Biggs, alineamiento constructivo; taxonomía SOLO. |
| **Decisión λ** | Cada semana del syllabus declara sus **códigos de resultado de aprendizaje** (`RA`), y la matriz de alineamiento del D2 §6 cruza cada `RA` con la actividad que lo desarrolla y el instrumento que lo mide. Ningún `RA` puede quedar sin instrumento; ningún instrumento puede medir lo que ningún `RA` declara. |
| **Dónde se ve** | D2 §5 y §6. |

### 2.11 · Retroalimentación que alimenta hacia adelante

| | |
|---|---|
| **Mecanismo** | La retroalimentación sólo produce aprendizaje si el estudiante puede actuar sobre ella en la tarea siguiente. Una nota al final del curso no es retroalimentación: es un veredicto. |
| **Evidencia** | Hattie y Timperley (2007), modelo de las tres preguntas (¿hacia dónde voy?, ¿cómo voy?, ¿qué sigue?); Nicol y Macfarlane-Dick (2006), principios de la evaluación formativa que sostiene la autorregulación. |
| **Decisión λ** | Toda retroalimentación se emite en **siete días naturales** (Carta, art. 30) y en formato de tres campos obligatorios: *qué cumple el criterio*, *qué no lo cumple y por qué*, *qué acción concreta lo corregiría en la entrega siguiente*. Prohibidas las valoraciones sin acción («mejorable», «regular»). |
| **Dónde se ve** | D3, Anexo I. |

## 3 · Lo que este modelo deliberadamente no hace

Declarar los límites es parte del rigor.

- **No promete personalización algorítmica.** No hay motor adaptativo. La
  adaptación la hace un docente humano que conoce a diez personas y su código.
- **No usa gamificación por puntos, insignias ni rachas.** Compiten con la
  motivación autónoma que el §8 busca construir y su efecto sobre el aprendizaje
  profundo es, en el mejor de los casos, discutido.
- **No aplica vigilancia algorítmica de exámenes** (Carta, art. 61.3). La
  integridad se resuelve con defensa oral, que además es formativa.
- **No enseña un marco de trabajo de moda como eje.** El eje es la plataforma web
  (HTML, CSS, JavaScript, HTTP, datos, seguridad). Los marcos se introducen como
  herramienta subordinada y sustituible.
- **No asegura empleo.** Asegura artefacto, auditoría y preprint publicado.
- **No escala, y no pretende hacerlo.** Diez personas por generación y una sola aula
  (Carta, art. 41). Todo lo anterior deja de funcionar con treinta. Un modelo que
  depende de que el docente conozca el código de cada estudiante no se convierte en
  masivo sin dejar de ser lo que es.

---

# PARTE II · LA MAQUINARIA: EL CICLO λ

## 4 · Estructura de la semana

### 4.1 · Vista general

```text
        ANTES (asíncrono)        DURANTE (síncrono)         DESPUÉS (asíncrono)
        ─────────────────        ──────────────────         ───────────────────
SÁBADO  30 min · micro-guía  →   120 min · concepto     →   30 min · quiz de
        o sondeo con LLM         20' dudas                  recuperación con
        + 3 predicciones         60' modelado en vivo       ítems espaciados
                                 40' instrucción entre pares

DOMINGO 30 min · entorno     →   120 min · laboratorio  →   60–90 min ·
        listo + predicción       15' reto y predicción      TRANSFERENCIA al
        escrita del código       90' codificación asistida  proyecto propio
        del reto                 15' validación y entrega   + empuje al repositorio
```

### 4.1 bis · Las cuatro horas de clase y las cuatro de estudio

Conviene dejarlo escrito sin ambigüedad, porque es la fuente de malentendido más
frecuente al describir el programa:

> **El Instituto imparte cuatro horas de clase a la semana.** Dos el sábado y dos el
> domingo, en directo, con el docente presente. Ésa es la totalidad del tiempo
> lectivo síncrono y no hay más.
>
> **El estudiante dedica otras cuatro horas por su cuenta.** Media hora antes de
> cada sesión, media hora de quiz el sábado, y entre una y dos horas el domingo para
> llevar lo aprendido a su propio proyecto. Ese tiempo **no es opcional ni es
> «tarea»**: es la mitad del método.

Carga semanal total: **4 h síncronas + 3,5 a 4 h asíncronas = 8 h**. La cifra es un
compromiso, no un ideal: es la carga máxima sostenible durante 16 semanas por una
persona que trabaja. El diseño se somete a ella y no al revés.

Si el trabajo asíncrono se suprimiera y quedaran sólo las cuatro horas de clase, el
Ciclo λ dejaría de funcionar por completo: no habría predicciones que abrir el
sábado, no habría recuperación espaciada, y sobre todo **no habría Transferencia**,
que es el mecanismo por el que 45 domingos producen una plataforma real en lugar de
45 ejercicios sueltos. El programa se convertiría en una clase magistral de fin de
semana. Por eso el compromiso de las ocho horas se declara en la admisión y se firma
en el Compromiso λ.

### 4.2 · Sábado · sesión conceptual (120 minutos)

| Tramo | Duración | Qué ocurre | Regla dura |
|---|---|---|---|
| **S-1 · Apertura y dudas** | 20 min | Se resuelven las dudas del *Antes*. El docente abre con las tres predicciones erróneas más frecuentes recogidas en el pre-work. | Nunca se empieza explicando: se empieza escuchando. |
| **S-2 · Modelado en vivo** | 60 min | Programación o diagramación en directo, con errores reales, verbalizando el razonamiento y las alternativas descartadas. | Prohibido pegar código pre-escrito. Prohibido el IDE con autocompletado de IA activo. |
| **S-3 · Instrucción entre pares** | 40 min | Pregunta conceptual difícil → voto individual → 5 min en parejas → segundo voto → cierre. Dos o tres ciclos. | Se registran ambos votos. Si el primer voto acierta por encima del 80 %, la pregunta era mala y se sustituye. |

**Cierre.** El docente enuncia en una frase el criterio de éxito del laboratorio del
día siguiente. Los estudiantes salen sabiendo qué van a construir.

### 4.3 · Domingo · laboratorio (120 minutos)

| Tramo | Duración | Qué ocurre | Regla dura |
|---|---|---|---|
| **L-1 · Reto y predicción** | 15 min | Se presenta el reto y el código de partida. Cada estudiante escribe su **predicción** de qué hará ese código antes de ejecutarlo (PRIMM). | Nadie ejecuta antes de predecir. La predicción se envía y queda registrada. |
| **L-2 · Codificación** | 90 min | Producción activa. El docente circula por salas, entrena, no resuelve. Trabajo en parejas con rotación de rol conductor/navegante cada 20 min. | El docente **no toca el teclado del estudiante**. Pregunta, no dicta. |
| **L-3 · Validación y entrega** | 15 min | Ejecución de la batería de comprobación: pruebas automatizadas, `axe`, Lighthouse, navegación por teclado. Entrega inicial al repositorio. | No se entrega nada que no pase la batería. Un laboratorio rojo se reintenta (§2.9). |

**Cierre.** Enunciado explícito de la **Transferencia**: qué parte exacta del
proyecto propio se toca esta semana y con qué criterio de aceptación.

### 4.4 · La Transferencia como columna vertebral

La Transferencia dominical es el mecanismo que convierte 48 laboratorios sueltos
en una plataforma real. Su regla es simple y no admite excepción:

> **Lo que se aprende el domingo se aplica el domingo al proyecto propio, no a un
> ejercicio de juguete.**

El laboratorio se hace sobre un dominio neutro (una biblioteca, un catálogo de
plantas, un registro de sesiones) para que el reto sea comparable entre
estudiantes y evaluable con la misma batería. La Transferencia lo traslada al
dominio real del estudiante, que es distinto para cada uno. La diferencia entre
ambos es el espacio donde ocurre la transferencia de aprendizaje, y por eso se
evalúa por separado (D3 §7).

## 5 · Secuenciación didáctica

### 5.1 · La secuencia PRIMM-λ

Adaptación de PRIMM a las dos horas de laboratorio:

| Fase | Minutos | Actividad |
|---|---|---|
| **P · Predecir** | 15 | Predicción escrita sobre código no ejecutado. |
| **R · Ejecutar** | 10 | Ejecución y contraste con la predicción. Se nombra la discrepancia. |
| **I · Investigar** | 20 | Trazado, anotación, identificación de la línea responsable, uso del depurador. |
| **M · Modificar** | 30 | Cambios dirigidos con objetivo declarado, de menor a mayor alcance. |
| **M · Crear** | 45 | Construcción propia del artefacto de la semana. |

### 5.2 · Escalera de andamiaje y su desvanecimiento

| Nivel | Formato de la práctica | C1 | C2 | C3 |
|---|:---:|:---:|:---:|:---:|
| **A1** | Ejemplo resuelto completo, anotado | 30 % | 10 % | 0 % |
| **A2** | Ejemplo con huecos (código a completar) | 30 % | 20 % | 10 % |
| **A3** | Problema de Parsons con desvanecimiento | 20 % | 20 % | 10 % |
| **A4** | Problema con especificación y pruebas dadas | 15 % | 35 % | 40 % |
| **A5** | Problema abierto con especificación propia | 5 % | 15 % | 40 % |

La retirada del andamiaje es **una decisión de diseño con calendario**, no una
consecuencia de que el docente se canse de dar ejemplos. La columna C3 con 40 % en
A5 es lo que hace que el trabajo final sea genuinamente del estudiante.

### 5.3 · Interleaving y currículo en espiral

Los tres grandes hilos del programa (interfaz accesible, lógica y datos,
inteligencia artificial) **no se enseñan en bloques estancos**. Cada cuatrimestre
los retoma a mayor profundidad. El caso más deliberado está en la **semana 5**: el
sábado se estudia la anatomía de un modelo de lenguaje y el domingo se construye la
manipulación del DOM con validación accesible. La teoría de la IA nunca ocupa un
domingo entero, porque una semana sin programar en un curso de quince produce
decaimiento medible de una destreza recién adquirida.

Con la compresión a dieciséis semanas, este entrelazado dejó de ser una preferencia y
pasó a ser una obligación aritmética: no hay semanas sobrantes para dedicar ninguna a
un solo hilo.

---

# PARTE III · LA INTELIGENCIA ARTIFICIAL EN EL APRENDIZAJE

## 6 · La Escalera de Uso de IA

### 6.1 · Por qué existe

La evidencia disponible en 2026 sobre modelos generativos y programadores novatos
converge en un hallazgo incómodo: **el efecto no es uniforme, es divergente**. El
trabajo de Prather y colaboradores (*The Widening Gap: The Benefits and Harms of
Generative AI for Novice Programmers*, ICER 2024) documenta que los estudiantes con
buena regulación metacognitiva mejoran su desempeño con asistencia generativa,
mientras que los que tienen dificultades metacognitivas resultan perjudicados:
sobreestiman su desempeño y terminan la tarea con **ilusión de competencia**. La
literatura posterior ha nombrado el fenómeno como *deuda epistémica* y ha
documentado descarga cognitiva, pereza metacognitiva y dependencia emocional. Los
estudios sobre asistentes en el editor sitúan la aceptación de sugerencias por
parte de novatos en un rango amplio, aproximadamente del 10 % al 53 %, lo que
indica una relación con la herramienta muy poco regulada.

De ahí se sigue la posición del Instituto, que no es ni prohibicionista ni
entusiasta:

> La IA es la herramienta central del oficio que enseñamos y por eso hay que
> enseñarla en serio. Enseñarla en serio significa que **el estudiante primero
> construye el criterio que le permitirá dirigir y juzgar la salida del modelo**, y
> sólo entonces se le entrega el modelo.

### 6.1 bis · La escalera no restringe: habilita

Conviene decirlo con precisión, porque de la formulación depende cómo se entiende el
programa entero. Los niveles N1 y N2 de las cinco primeras semanas **no existen para
proteger al estudiante de la IA**: existen para **cualificarlo** para usarla a fondo.

El perfil que este programa forma no es el de quien escribe código, sino el de quien
**especifica, dirige, audita y responde** por un sistema construido en gran parte por
agentes (D2 §3). Ese perfil exige exactamente tres cosas, y las tres se construyen en
el Nivel I:

| Lo que hace falta | Por qué no se puede delegar | Dónde se construye |
|---|---|---|
| **Leer código y detectar que está mal** | Quien no puede leerlo acepta cualquier cosa, y entonces no dirige: obedece. | Semanas 1 a 5, a nivel N1 |
| **Saber cómo piensa el modelo** | Sin entender tokenización, contexto y alucinación, no se sabe cuándo desconfiar. | Semana 5 |
| **Decidir la estructura de datos** | Es la decisión de la que dependen todas las demás, y un agente la toma sin conocer el negocio. | Semana 8, a nivel **N0** |

**El muro de carga de todo el modelo.** Cuando la mayor parte del código la escribe
un agente, el único mecanismo que separa a un arquitecto de alguien que no entiende su
propio proyecto es la **Defensa Aleatoria de Autoría**: diez minutos, sin aviso, sin
asistencia, explicando y modificando en vivo. Si ese instrumento se relaja, el título
de arquitecto queda hueco y el programa deja de ser defendible. Es, por diseño, lo
último que puede negociarse.

### 6.2 · Los cinco niveles

| Nivel | Nombre | Qué se permite | Qué se prohíbe | Declaración |
|:---:|---|---|---|:---:|
| **N0** | **Cerrado** | Nada. Sin asistentes, sin autocompletado, sin chat. | Toda herramienta generativa. | No aplica |
| **N1** | **Consulta conceptual** | Preguntar por conceptos, analogías, glosario, «explícame qué es X». | Pedir código, pedir la solución, pegar el enunciado. | Obligatoria |
| **N2** | **Diagnóstico asistido** | Pegar un mensaje de error o una traza y pedir su **interpretación**. | Pedir el arreglo. La corrección la escribe la persona. | Obligatoria + traza |
| **N3** | **Dirección de agentes en el editor** | Encargar a un agente avanzado (del tipo de los que operan en el editor o la terminal) tareas de varios pasos sobre el propio repositorio: construir, refactorizar, documentar. **Es el nivel donde vive la mayor parte del trabajo del programa.** | Delegar la arquitectura, el modelo de datos o la regla de negocio. Aceptar una sola línea sin haberla leído. | Obligatoria + revisión |
| **N4** | **Delegación supervisada sobre sistemas reales** | Agentes que **actúan por sí mismos**: se ejecutan en el servidor, escriben en la base de datos, se comunican con terceros, disparan procesos. | Desplegar sin auditar. Cualquier acción con efecto externo sin aprobación humana registrada. | Obligatoria + auditoría + carta de límites |

> ### Dónde está de verdad la frontera entre N3 y N4
>
> No está en si la herramienta se llama «agente». En 2026 casi todo asistente de
> programación es agéntico, y fingir lo contrario sería enseñar una realidad que no
> existe. La frontera está en **qué puede tocar el agente sin que un humano lo
> apruebe**:
>
> - En **N3** el agente escribe **texto en un editor** que la persona lee, acepta o
>   rechaza antes de que exista. Su radio de acción es un archivo del repositorio y
>   su peor consecuencia es un mal *commit*, que se revierte.
> - En **N4** el agente **ejecuta acciones con efecto fuera del editor**: manda un
>   correo, cobra, modifica un documento en producción, contesta a un cliente. Su
>   peor consecuencia no se revierte con `git`.
>
> Esa distinción es la que decide el nivel, y es la que justifica que el agente en
> el editor entre en el Cuatrimestre 2 mientras el agente en el servidor espera al 3.

### 6.3 · Progresión a lo largo del programa

| Bloque | Nivel máximo | Razón |
|---|:---:|---|
| C1 · S01–S08 (fundamentos de lenguaje y lógica) | **N1** | Es donde se construye el criterio. Delegar aquí es hipotecar los tres cuatrimestres. |
| C1 · S09–S16 (teoría de IA y proyecto estático) | **N2** | Se estudia la IA como objeto, no como muleta. |
| C2 · S01–S16 | **N3** | Programación asistida por agentes **en el editor**, con lectura obligatoria de todo lo generado y declaración de lo rechazado. |
| C3 · S01–S16 | **N4** | Agentes que actúan sobre sistemas reales, con carta de límites publicada y auditoría de todo lo que se despliega. |
| **Diseño del modelo de datos (G4) y de las reglas de seguridad (G5)** | **N0** | Aunque ocurren en C2, donde rige N3. Ver más abajo. |
| **Evaluaciones de lógica pura y Defensa de Autoría** | **N0** | Siempre, en cualquier cuatrimestre. |
| **Defensa final de graduación** | **N0** | Sin excepción. |

**La excepción que sostiene todo el cuatrimestre 2.** Abrir el agente en el editor
sería peligroso si con él se pudiera delegar el diseño. Por eso las dos decisiones
estructurales de C2, el **modelo de datos** y las **reglas de seguridad**, se toman
en papel, a nivel **N0**, y se defienden oralmente en las compuertas G4 y G5. La
regla operativa, escrita en el D5 §3, es breve: *la IA puede escribir código; no
puede decidir la arquitectura, el modelo de datos ni la regla de negocio.*

### 6.4 · Los tres contrapesos

Permitir el uso sin contrapesos es delegar. El Instituto aplica tres, y son
inseparables de la Escalera:

1. **Declaración obligatoria** (`AI-USE.md`). Cada entrega incluye qué modelo se
   usó, para qué, qué prompts fueron decisivos, qué se aceptó, qué se rechazó y
   por qué. La plantilla está en el D3, Anexo II. Declarar no penaliza; ocultar sí
   (Carta, art. 53).
2. **Defensa Aleatoria de Autoría** (D3 §10). Diez minutos, sin aviso, con cámara:
   explique este bloque, cambie este comportamiento en vivo, justifique esta
   decisión. Es el único mecanismo que discrimina de verdad entre comprender y
   copiar, y funciona igual si la fuente fue un compañero, un foro o un modelo.
3. **Guion metacognitivo obligatorio antes de invocar al modelo.** Antes de cada
   consulta de nivel N2 o superior, el estudiante escribe tres líneas en su
   bitácora: *qué creo que pasa*, *qué he probado*, *qué espero obtener*. Las
   intervenciones basadas en guiones metacognitivos son, según la literatura
   reciente, la vía más prometedora para mitigar la deuda epistémica. Es también
   el registro que alimenta la investigación generacional.

### 6.5 · Enseñar la IA como objeto de estudio

Además de usarla, el programa la estudia: anatomía de un modelo de lenguaje,
mecanismos de atención, tokenización y ventana de contexto, latencia de
inferencia, coste por millón de tokens, sesgos, alucinación, límites de
verificabilidad, diferencia entre familias propietarias y abiertas. Un
desarrollador que integra modelos en infraestructura de clientes debe saber
**cuándo el modelo no debe usarse**, y esa competencia no se adquiere usándolo:
se adquiere estudiándolo.

---

# PARTE IV · COMUNIDAD, MOTIVACIÓN Y PERMANENCIA

## 7 · Las tres presencias

El Instituto adopta el marco de **Comunidad de Indagación** de Garrison, Anderson
y Archer (2000), que descompone la experiencia educativa en línea en tres
presencias que deben diseñarse de forma explícita:

| Presencia | Definición | Cómo se produce en Elysium λ |
|---|---|---|
| **Cognitiva** | Capacidad de construir significado mediante indagación sostenida. | El ciclo PRIMM-λ, la instrucción entre pares y la investigación generacional. |
| **Social** | Proyectarse como persona real ante los demás. | Aula de **10 a 15 personas**, parejas rotativas semanales, Asamblea de Generación, cámara opcional pero micrófono esperado. Con ese tamaño el docente conoce el código de cada estudiante, que es la condición de todo lo demás. |
| **Docente** | Diseño, facilitación y dirección del proceso. | Syllabus público y congelado, retroalimentación en 7 días, presencia del docente circulando en los laboratorios. |

## 8 · Motivación y permanencia

El abandono en formación en línea no se combate con recordatorios. Se combate
satisfaciendo las tres necesidades psicológicas básicas de la teoría de la
autodeterminación de Deci y Ryan:

| Necesidad | Riesgo en un curso en línea | Mecanismo λ |
|---|---|---|
| **Autonomía** | Currículo impuesto sin relación con la vida del estudiante. | El proyecto es **su** negocio, elegido por la persona en la semana 3 y sostenido 45 semanas. |
| **Competencia** | Dificultad mal calibrada, fracaso sin salida. | Andamiaje desvaneciente (§5.2) y reintento hasta el dominio (§2.9): siempre hay un camino de vuelta. |
| **Relación** | Aislamiento, anonimato, sensación de estar solo. | Generación como unidad de identidad (Carta, art. 17), parejas rotativas semanales, revisión cruzada de proyectos, y un Demo Day público donde la generación se presenta junta. |

### 8.0 · El problema propio de un programa gratuito

La gratuidad elimina la barrera económica, que es su razón de ser (Carta, art. 16),
pero elimina también el compromiso financiero, que en los programas de pago actúa
como un ancla poco elegante y bastante eficaz: quien pagó tiende a aparecer. Un
programa gratuito no dispone de ese mecanismo y debe construir otro, de forma
deliberada.

El Instituto lo sustituye por **cuatro anclas no económicas**, y las declara para
poder medir si funcionan:

| Ancla | Cómo opera |
|---|---|
| **Escasez y selección** | Diez plazas adjudicadas con rúbrica pública entre muchas solicitudes. Quien entra sabe que otra persona no entró, y eso obliga de una manera que el dinero no obliga. |
| **Compromiso explícito y firmado** | El Compromiso λ se firma con nombre y se lee en voz alta en la primera sesión. Es un contrato moral, no comercial. |
| **Visibilidad del propio avance** | El proyecto es suyo y crece cada domingo. Abandonar cuesta un producto propio, no una matrícula. |
| **Deuda con el grupo** | Con diez personas, la ausencia de una se nota en la misma sesión. La cohorte pequeña es, por sí sola, un mecanismo de permanencia. |

**Consecuencia para la medición.** Las metas de retención se fijan más altas que en
un programa de pago (D7 §25) precisamente porque la selección es más estricta y el
grupo más pequeño. Si aun así la retención cae, la conclusión no será que los
estudiantes fallaron: será que estas cuatro anclas no bastan, y habrá que decirlo
por escrito (Carta, art. 15).

### 8.1 · Protocolo de riesgo de abandono

Se activa cuando concurren **dos** de estas señales en una misma semana: ausencia
sin aviso, entrega no realizada, quiz por debajo de 50, o ausencia de actividad en
el repositorio durante 10 días.

| Momento | Acción | Responsable |
|---|---|---|
| **T+0** | Mensaje privado, no automatizado, sin tono de reproche. | Docente |
| **T+3 días** | Videollamada de 15 min. Se pregunta por circunstancias, no por rendimiento. | Docente |
| **T+7 días** | Plan de recuperación escrito con nuevas fechas y alcance reducido si procede. | Dirección Académica |
| **T+14 días** | Oferta formal de **congelación de matrícula** con reincorporación a la generación siguiente sin coste adicional. | Secretaría |

La congelación es un resultado aceptable. El abandono silencioso no lo es.

---

# PARTE V · ASEGURAMIENTO DE LA CALIDAD DOCENTE

## 9 · Instrumentos

| Instrumento | Frecuencia | Quién | Qué mide | Publicidad |
|---|---|---|---|---|
| **Encuesta de percepción λ** (12 ítems) | Semanas 8 y 16 de cada cuatrimestre | Estudiantes | Claridad, carga, utilidad de la retroalimentación, sensación de pertenencia | Agregada, pública |
| **Observación de aula por par** | 1 por cuatrimestre | Docente par | Cumplimiento del guion de sesión (Anexo A) | Confidencial |
| **Auditoría de retroalimentación** | Mensual | Dirección Académica | Plazo de 7 días y presencia de los 3 campos obligatorios | Agregada |
| **Analítica de aprendizaje** | Continua | Secretaría | Asistencia, entrega, reintentos, desplazamiento de voto en pares | Agregada, anonimizada |
| **Tasa de éxito por semana** | Continua | Dirección Académica | % que alcanza el criterio del laboratorio en primer intento | Pública |

**Umbral de intervención curricular.** Si en una semana **menos del 60 %** alcanza
el criterio del laboratorio en primer intento, esa semana se marca como
**defectuosa por diseño**, no por los estudiantes, y su rediseño es obligatorio
antes de la generación siguiente. La anotación se registra al pie del syllabus.

## 10 · Indicadores públicos del Instituto

En cumplimiento del art. 15 de la Carta, se publican cada seis meses: matriculados,
retención por cuatrimestre, graduación, distribución de calificaciones, tasa de
superación de la Auditoría Técnica en primer intento, número de becas concedidas y
resultado de la investigación generacional. La metodología de cálculo se publica
junto con las cifras y no cambia entre periodos sin nota explicativa.

---

# ANEXOS

## Anexo A · Guion de sesión del docente

**Sábado**

```text
□ ANTES DE ENTRAR
  □ Leer las predicciones del pre-work y anotar los 3 errores más frecuentes
  □ Preparar 2–3 preguntas conceptuales con distractores plausibles
  □ Desactivar todo autocompletado de IA en el editor de proyección
  □ Comprobar subtitulado automático y grabación

□ 00:00–00:20  APERTURA
  □ Abrir con los errores frecuentes, no con la teoría
  □ Nombrar quién preguntó qué (reconocimiento nominal)

□ 00:20–01:20  MODELADO EN VIVO
  □ Escribir desde cero, en pantalla, a velocidad legible
  □ Verbalizar: «podría hacerlo de dos formas… elijo esta porque…»
  □ Dejar vivir al menos un error real y depurarlo delante de todos
  □ Pausa de 60 s cada 15 min para preguntas por chat

□ 01:20–02:00  INSTRUCCIÓN ENTRE PARES
  □ Pregunta → voto 1 → parejas 5 min → voto 2 → cierre
  □ Registrar ambos votos
  □ Si voto 1 acierta >80 %, descartar la pregunta y anotarlo

□ CIERRE
  □ Una frase: «mañana ustedes van a construir ___ y estará bien cuando ___»
```

**Domingo**

```text
□ 00:00–00:15  RETO Y PREDICCIÓN
  □ Mostrar el código de partida SIN ejecutarlo
  □ Recoger predicciones escritas antes de la primera ejecución

□ 00:15–01:45  CODIFICACIÓN
  □ Rotar salas cada 10 min; rotar rol conductor/navegante cada 20 min
  □ NO tocar el teclado del estudiante. Preguntar: «¿qué esperabas que pasara?»
  □ Anotar los 3 atascos más comunes para el informe semanal

□ 01:45–02:00  VALIDACIÓN
  □ Ejecutar pruebas, axe, Lighthouse y recorrido por teclado en pantalla
  □ Confirmar entrega en repositorio de cada estudiante

□ CIERRE
  □ Enunciar la Transferencia con su criterio de aceptación
```

## Anexo B · Plantilla de micro-guía del *Antes* (máx. 900 palabras)

```markdown
# [Semana NN] · [Concepto]
**Tiempo de lectura estimado:** 20 min · **Nivel de IA permitido:** N_

## 1. La pregunta que resuelve este concepto
[Una situación concreta y reconocible donde el concepto hace falta.]

## 2. La idea en tres párrafos
[Explicación con una analogía y un contraejemplo. Texto plano, sin jerga sin definir.]

## 3. Mírelo funcionando
[Fragmento de 10–20 líneas, comentado.]

## 4. Prediga (obligatorio · se entrega)
1. ¿Qué imprime la línea __ y por qué?
2. Si cambio __ por __, ¿qué ocurre?
3. ¿Qué cree que pasaría si __ no existiera?

## 5. Glosario mínimo
| Término | En una frase |

## 6. Si quiere ir más lejos (opcional, no evaluable)
```

## Anexo C · Encuesta de percepción λ (12 ítems, escala 1–5)

1. Supe con antelación qué se esperaba de mí esta semana.
2. El trabajo previo al sábado me sirvió para seguir la sesión.
3. El ritmo de la sesión teórica fue adecuado.
4. En el laboratorio produje código por mí mismo la mayor parte del tiempo.
5. Cuando me atasqué, obtuve ayuda en un tiempo razonable.
6. La retroalimentación me dijo qué hacer distinto la próxima vez.
7. La carga de trabajo fue sostenible con mi vida laboral y familiar.
8. El horario de las sesiones me resulta viable.
9. Siento que formo parte de esta generación.
10. Entiendo cómo lo de esta semana avanza mi proyecto.
11. Usé la IA dentro del nivel permitido y entendí por qué ese nivel.
12. Recomendaría esta semana tal como está, sin cambios.

*Dos preguntas abiertas:* ¿qué debería mantenerse exactamente igual? ¿qué una sola
cosa cambiaría?

---

*Elysium λ Institute of Development & Research · D1 · «Abstrahere, aedificare, probare.»*
