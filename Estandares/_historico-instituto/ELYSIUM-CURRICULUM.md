# Elysium λ Institute — Plan de Estudios
### v1.0.0 · Agosto 2026 · Documento D2 del paquete fundacional
### Programa: Arquitectura de Infraestructura Digital Asistida por IA y Emprendimiento

> **Cómo leer este documento.** Aquí está el **qué** se enseña, ordenado y
> trazable. La Parte I identifica el programa y sus perfiles. La Parte II declara
> los 32 resultados de aprendizaje, que son el contrato: nada se evalúa si no está
> aquí, y nada está aquí sin instrumento que lo mida, **con su nivel de logro
> declarado** (§5.9). La Parte III es el mapa de las 16 semanas y sus dependencias. La Parte IV justifica el conjunto tecnológico
> elegido y lo enlaza con el estándar técnico de la empresa. La Parte V documenta
> las decisiones de diseño curricular, incluidas las correcciones que se hicieron
> al borrador inicial y por qué.
>
> Se subordina a la Carta (D0) y al Modelo Académico (D1). Detalla en el syllabus
> único (D4).

---

# PARTE I · IDENTIFICACIÓN

## 1 · Ficha del programa

| Campo | Valor |
|---|---|
| **Denominación** | Arquitectura de Infraestructura Digital Asistida por IA y Emprendimiento |
| **Institución** | Elysium λ Institute of Development & Research |
| **Modalidad** | Telemática síncrona con trabajo asíncrono estructurado |
| **Lengua de docencia** | Español |
| **Lengua del código** | Inglés (identificadores, comentarios, mensajes de *commit*) |
| **Duración** | **16 semanas** · 15 lectivas + 1 de defensa · tres niveles de cinco semanas |
| **Preparación previa** | Módulo 0 asíncrono de unas 25 h (Carta, art. 38 bis) |
| **Régimen** | Sábado y domingo, 2 h síncronas cada día · 15:00–17:00 UTC |
| **Carga total** | **173 h** de trabajo del estudiante (ver §7) |
| **Equivalencia estimada** | 6 a 7 ECTS · descriptores de nivel 4 del MEC/EQF |
| **Tamaño de aula** | **Máximo 15 estudiantes · 10 como número ideal · una sola aula por generación** |
| **Coste para el estudiante** | **Ninguno.** Formación gratuita en su totalidad (Carta, art. 2 bis) |
| **Credencial** | Certificado privado de formación profesional (Carta, art. 8) |
| **Requisito previo de programación** | Ninguno |

## 2 · Perfil de ingreso

Persona de 16 años o más, hispanohablante de nivel B2 o superior, con ordenador
propio y conexión estable, **sin experiencia previa exigida en programación**, que
dispone de ocho horas semanales sostenidas durante cuatro meses, más unas 25 horas
de preparación previa en el Módulo 0, y que tiene o busca una idea de negocio propia, por pequeña que sea, sobre la que construir.

El programa está diseñado específicamente para tres situaciones:

- Quien trabaja de lunes a viernes y no puede abandonar su empleo para formarse.
- Quien vive fuera de los centros urbanos donde existe oferta presencial.
- Quien ya tiene un micronegocio y necesita construir su propia infraestructura
  en lugar de alquilarla.

## 3 · Perfil de egreso

> **Lo que este programa forma, dicho sin rodeos.** No forma programadores expertos.
> Forma **arquitectos de infraestructura digital asistida por IA**: personas capaces
> de **especificar, dirigir, auditar y responder** por un sistema construido en gran
> medida con agentes de inteligencia artificial, y de llevarlo al mercado.

Es un perfil profesional distinto del de desarrollador, y conviene no confundirlos.
El desarrollador escribe el código. El arquitecto **decide qué debe existir, con qué
estructura de datos, bajo qué restricciones, y comprueba que lo entregado las
cumple**. En 2026 ese segundo perfil es escaso y el primero abunda.

### 3.1 · Las cuatro capacidades del egresado

| Capacidad | Qué significa en concreto |
|---|---|
| **Leer y juzgar** | Entiende el código que un agente le entrega lo suficiente para detectar cuándo está mal, cuándo es innecesariamente complejo y cuándo hace algo que nadie pidió. No lo escribe desde cero, pero **no lo acepta a ciegas**. |
| **Decidir la estructura** | Diseña el modelo de datos y las reglas de acceso **sin asistencia** (nivel N0), porque son las decisiones que un agente no puede tomar por él sin comprometer todo lo demás. |
| **Dirigir y auditar** | Especifica tareas a agentes avanzados, revisa lo devuelto línea a línea, declara qué aceptó y qué rechazó, y somete el resultado a umbrales objetivos de accesibilidad, rendimiento y seguridad. |
| **Lanzar** | Tiene la plataforma en producción, la marca, la presencia en redes, el cumplimiento legal básico y un modelo de negocio formulado. |

### 3.2 · Qué sabe hacer, en términos verificables

1. Construye interfaces conformes a **WCAG 2.2 nivel AA** y lo comprueba con
   herramienta automática y con prueba manual de teclado y lector de pantalla.
2. **Lee, modifica y corrige** JavaScript ES6+ y explica en vivo qué hace cada bloque
   de su proyecto, sin asistencia de ningún tipo.
3. **Diseña** un modelo de datos documental y sus reglas de seguridad, y demuestra que
   funcionan con una batería de casos negativos.
4. **Dirige agentes de IA avanzados** en el editor para construir, refactorizar y
   documentar, declarando por escrito cada aceptación y cada rechazo.
5. Despliega de forma continua con una **compuerta de calidad bloqueante**.
6. Formula un modelo de negocio, una identidad de marca y una presencia digital, y
   los sostiene ante un panel.
7. Cumple los requisitos básicos de **RGPD** y **Ley n.º 8968** para los datos que su
   plataforma trata.
8. Distingue con precisión qué domina y qué sólo conoce, porque su certificado lo
   declara (§5.9) y su defensa lo comprobó.

### 3.3 · Lo que el egresado **no** es

No es desarrollador profesional contratable como tal. No escribe pruebas
automatizadas desde cero. No domina ningún marco de trabajo. No optimiza rendimiento
a nivel experto. No es asesor jurídico ni fiscal. **Ninguna pieza de difusión puede
insinuar lo contrario** (Carta, art. 18).

## 4 · Referencia a marcos de competencias

El programa se describe, sin reclamar reconocimiento formal (Carta, art. 8), en
términos de los marcos siguientes, para facilitar el reconocimiento futuro:

| Marco | Uso en este plan |
|---|---|
| **MEC/EQF** | Los resultados de aprendizaje se redactan con los descriptores de conocimientos, destrezas y responsabilidad/autonomía de los niveles 4 y 5. |
| **e-CF (EN 16234-1)** | Correspondencia con A.6 Diseño de aplicaciones, B.1 Desarrollo, B.3 Pruebas, B.5 Producción de documentación, D.11 Identificación de necesidades, E.8 Gestión de la seguridad de la información. |
| **DigComp 2.2** | Áreas 3 (creación de contenidos digitales) y 4 (seguridad), con el añadido explícito de alfabetización en IA. |
| **Microcredenciales UE** | Formato del certificado conforme a la Recomendación del Consejo de 16-VI-2022. |
| **EN 301 549 / Directiva (UE) 2019/882** | Norma técnica de referencia para todo el hilo de accesibilidad. |

---

# PARTE II · RESULTADOS DE APRENDIZAJE

## 5 · Catálogo de los 32 resultados

Notación: `RA-<Dominio><n>`. La columna **Nivel** indica el verbo cognitivo más
alto exigido según la taxonomía SOLO (U = uniestructural, M = multiestructural,
R = relacional, A = abstracto ampliado).

### Dominio A · Interfaz accesible y rendimiento

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-A1** | Construir documentos HTML5 semánticos cuyo árbol de accesibilidad refleje fielmente la estructura de la información, y justificar la elección de cada elemento frente a alternativas. | R | 1–5 |
| **RA-A2** | Aplicar CSS3 mediante un sistema de propiedades personalizadas, con cascada controlada y especificidad justificada, evitando la anulación por fuerza bruta. | R | 1–5 |
| **RA-A3** | Producir interfaces responsivas con enfoque *mobile-first* operables sin pérdida de contenido ni funcionalidad entre 320 px y 2560 px. | R | 1–5 |
| **RA-A4** | Verificar y corregir la conformidad WCAG 2.2 nivel AA combinando análisis automático, recorrido por teclado y prueba con lector de pantalla, y distinguir qué criterios la herramienta automática **no** puede detectar. | A | 2–15 |
| **RA-A5** | Diagnosticar y optimizar las métricas de Core Web Vitals hasta los umbrales de la Auditoría Técnica Elysium, identificando la causa raíz de cada regresión. | A | 15 |

### Dominio B · Lógica, lenguaje y estructura de programas

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-B1** | Modelar información con los tipos primitivos y compuestos de JavaScript ES6+, y razonar correctamente sobre coerción, igualdad, alcance y mutabilidad. | R | 1–5 |
| **RA-B2** | Expresar algoritmos mediante control de flujo, iteración y funciones, y argumentar su corrección con casos límite antes de ejecutarlos. | R | 1–5 |
| **RA-B3** | Manipular el DOM y gestionar eventos con la API estándar de la plataforma, sin bibliotecas intermedias. | M | 5 |
| **RA-B4** | Programar operaciones asíncronas con promesas y `async`/`await`, y explicar el orden de ejecución resultante del bucle de eventos. | R | 6–10 |
| **RA-B5** | Organizar el código en módulos con contratos explícitos y cubrirlo con pruebas automatizadas que fallen ante la regresión. | R | 6–10 |
| **RA-B6** | Leer una traza de error, formular una hipótesis causal, y confirmarla o refutarla con el depurador antes de modificar una sola línea. | A | 6 |

### Dominio C · Datos, servicios y despliegue

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-C1** | Consumir servicios HTTP con la Fetch API, gestionando de forma explícita los estados de carga, éxito, vacío y error. | R | 6–10 |
| **RA-C2** | Diseñar un modelo de datos documental justificando cada decisión de desnormalización en función de los patrones de consulta previstos. | A | 6 |
| **RA-C3** | Implementar operaciones de creación, lectura, actualización y borrado contra un servicio de base de datos en la nube, incluida la sincronización en tiempo real. | R | 6–10 |
| **RA-C4** | Establecer despliegue continuo desde el repositorio con una compuerta de calidad que bloquee la publicación cuando los umbrales no se cumplen. | R | 6–10 |
| **RA-C5** | Implementar lógica de servidor en funciones sin servidor para aquello que, por seguridad o por coste, no puede residir en el cliente, y explicar el criterio de frontera. | A | 13 |

### Dominio D · Seguridad, privacidad y cumplimiento

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-D1** | Escribir reglas de seguridad de datos que denieguen por defecto, y demostrar su corrección con una batería de **casos negativos** que deben fallar. | A | 6 |
| **RA-D2** | Implementar autenticación y control de acceso basado en roles, distinguiendo autenticación de autorización y sesión de identidad. | R | 11–14 |
| **RA-D3** | Aplicar las políticas de seguridad de la plataforma web (CSP, HSTS, control de orígenes) y explicar qué ataque previene cada una. | R | 11–14 |
| **RA-D4** | Diseñar el tratamiento de datos personales declarando base legal, minimización, plazo de retención y vía de ejercicio de derechos, conforme al RGPD y a la Ley n.º 8968. | A | 13 |

### Dominio E · Inteligencia artificial

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-E1** | Explicar la anatomía funcional de un modelo de lenguaje grande: tokenización, mecanismo de atención, ventana de contexto y coste de inferencia. | R | 1–5 |
| **RA-E2** | Estimar de forma empírica el coste, la latencia y los límites de una integración concreta de modelo de lenguaje sobre datos reales. | A | 5 |
| **RA-E3** | Detectar, documentar y mitigar alucinaciones y sesgos en salidas de modelos, y decidir de forma argumentada **cuándo no debe usarse** un modelo. | A | 5 |
| **RA-E4** | Emplear asistentes y **agentes generativos en el editor** dentro de un nivel declarado, dirigiendo tareas de varios pasos y revisando y justificando por escrito cada aceptación y cada rechazo. | A | 6 |
| **RA-E5** | Diseñar, desplegar y auditar un agente que **actúe sobre sistemas reales** desde el servidor, con supervisión humana registrada, carta de límites publicada y análisis previo de su peor fallo posible. | A | 13 |

### Dominio F · Ingeniería, proceso y calidad

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-F1** | Operar Git y GitHub con historial legible, versionado semántico Elysium y participación efectiva en revisión de código ajeno. | R | 1–10 |
| **RA-F2** | Someter un artefacto propio a la Auditoría Técnica Elysium, interpretar sus hallazgos y remediarlos en orden de severidad. | A | 2–15 |
| **RA-F3** | Escribir documentación técnica que permita a una persona ajena instalar, ejecutar, entender y mantener el proyecto sin preguntar nada al autor. | R | 14–15 |

### Dominio G · Negocio, comunicación y ética profesional

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-G1** | Formular una propuesta de valor y un modelo de negocio verificables para una micro o pequeña empresa, y revisarlos ante evidencia contraria. | A | 2–15 |
| **RA-G2** | Producir identidad de marca, presencia en redes sociales y contenido persuasivo coherentes con la interfaz y con la promesa del negocio, y medir su efecto. | R | 13–14 |
| **RA-G3** | Identificar y cumplir los requisitos legales, fiscales y de protección al consumidor de la puesta en marcha en su propia jurisdicción. | R | 11–14 |
| **RA-G4** | Sostener una defensa técnica y una presentación comercial ante un panel, respondiendo a preguntas adversas sin perder rigor. | A | 13 |

### Dominio H · Investigación · **SUPRIMIDO**

Los cuatro resultados de aprendizaje del dominio de investigación (`RA-H1` a
`RA-H4`) **quedan suprimidos** del plan de estudios al pasar el programa de 48 a 16
semanas. Pedir producción científica evaluable a personas que llevan diez semanas
programando, dentro de un presupuesto de 128 horas, habría sido injusto y habría
producido mala ciencia.

La investigación no desaparece del Instituto: **cambia de sujeto**. La conduce y la
firma el profesorado, y los estudiantes participan como sujetos voluntarios y
anónimos con una carga máxima de veinte minutos en todo el programa (Carta,
art. 49 bis; D8 §1). No es un resultado de aprendizaje y no se evalúa.

**El catálogo vigente tiene, por tanto, 32 resultados de aprendizaje**, no 36.

## 5.9 · Clasificación por nivel de logro

> **Por qué existe esta tabla.** Los 32 resultados no se alcanzan todos a la misma
> profundidad en 128 horas. El artículo 9 de la Carta prohíbe certificar lo que no se
> demostró, de modo que el certificado debe distinguir entre lo que la persona
> **dominó** y lo que sólo se le **introdujo**. Esta tabla es la fuente de esa
> distinción y se transcribe literalmente en el certificado.

**Dominado** significa: practicado varias semanas, evaluado con artefacto propio,
sometido a la Auditoría Técnica y defendible en la Defensa Aleatoria de Autoría.
**Introducido** significa: visto, practicado una vez con andamiaje, y **no
certificado como competencia**.

| Nivel de logro | Resultados de aprendizaje |
|---|---|
| **DOMINADO** (22) | RA-A1, RA-A2, RA-A3, RA-A4 · RA-B1, RA-B2, RA-B3, RA-B6 · RA-C1, RA-C2, RA-C3, RA-C4 · RA-D1, RA-D2 · RA-E1, RA-E3, RA-E4 · RA-F1, RA-F2 · **RA-G1, RA-G2, RA-G4** |
| **INTRODUCIDO** (10) | RA-A5 (optimización profunda de rendimiento) · RA-B4 (modelo del bucle de eventos) · RA-B5 (escribir pruebas propias) · RA-C5 (funciones de servidor) · RA-D3 (cabeceras de seguridad) · RA-D4 (tratamiento de datos personales) · RA-E2 (estimación de coste de inferencia) · RA-E5 (agentes que actúan sobre sistemas reales) · RA-F3 (documentación para terceros) · RA-G3 (ruta de formalización comercial) |

**Regla de honestidad comercial.** Ninguna pieza de difusión puede enumerar un
resultado *introducido* sin esa etiqueta. Decir «aprenderás a escribir tus propias
pruebas automatizadas» sería falso: en dieciséis semanas se aprende a **ejecutarlas y
leerlas**, y eso es lo que se puede prometer.

## 6 · Matriz de alineamiento constructivo

Extracto normativo. Cada `RA` debe tener al menos una actividad y al menos un
instrumento. Los números de semana remiten al syllabus único (D4). La columna
**Logro** repite la clasificación del §5.9, porque es la que gobierna qué se puede
escribir en el certificado.

| RA | Semanas donde se desarrolla | Instrumento que lo mide | Logro |
|---|---|---|:---:|
| RA-A1 | 1, 2 | Batería `axe` + revisión del árbol de accesibilidad | Dominado |
| RA-A2 | 3 | Revisión de código + prueba del sistema de tokens | Dominado |
| RA-A3 | 3 | Prueba de viewport a 320, 768, 1440 y 2560 px | Dominado |
| RA-A4 | 2, 5, 9, 12, 15 | ATE-A: cero violaciones + recorrido manual con lector de pantalla | Dominado |
| RA-A5 | 14, 15 | ATE-P (Lighthouse ≥ 95, LCP, CLS, INP) | Introducido |
| RA-B1, RA-B2 | 4 | Quices de Parsons + arnés de pruebas provisto | Dominado |
| RA-B3 | 5 | Validación accesible y renderizado dinámico | Dominado |
| RA-B4 | 7 | Prueba de orden de ejecución | Introducido |
| RA-B5 | 4–15 | Ejecución e interpretación de las pruebas provistas | Introducido |
| RA-B6 | 6 | **Bitácora de depuración con hipótesis previa** | Dominado |
| RA-C1 | 7 | Los cuatro estados de interfaz, anunciados | Dominado |
| RA-C2 | 8 | **Compuerta G2 con defensa oral a N0** | Dominado |
| RA-C3 | 8, 9 | Operaciones completas + panel en tiempo real | Dominado |
| RA-C4 | 10 | Evidencia de publicación bloqueada y corregida | Dominado |
| RA-C5 | 12 | Función de servidor desplegada | Introducido |
| RA-D1 | 10 | **Batería de casos negativos: cero que pasen** | Dominado |
| RA-D2 | 11 | Prueba de acceso no autorizado desde consola | Dominado |
| RA-D3 | 11 | Cabeceras verificadas | Introducido |
| RA-D4 | 15 | Registro de actividades de tratamiento (ATE-C) | Introducido |
| RA-E1, RA-E3 | 5 | Quiz + informe de alucinaciones provocadas | Dominado |
| RA-E2 | 5 | Estimación de contexto y coste | Introducido |
| RA-E4 | 6–15 | Auditoría de `AI-USE.md` (rechazos justificados) + **DAA** | Dominado |
| RA-E5 | 12 | Carta de límites + cero envíos sin aprobación | Introducido |
| RA-F1 | 1, 10 | Historial de Git legible + revisión de pares | Dominado |
| RA-F2 | 15 | Informe ATE con hallazgos remediados (**G3**) | Dominado |
| RA-F3 | 15 | `README` ejecutable por un tercero + memoria | Introducido |
| RA-G1 | 2, 13 | **G1** + lienzo con experimento de criterio numérico | Dominado |
| RA-G2 | 14 | Manual de marca + perfiles + plan de contenido sostenible | Dominado |
| RA-G3 | 15 | Ficha de ruta de formalización con fuentes oficiales | Introducido |
| RA-G4 | 16 | Pitch en Demo Day + sustentación ante panel externo | Dominado |

**Regla de lectura.** Ningún `RA` aparece sin instrumento y ningún instrumento mide
lo que ningún `RA` declara. Si una futura reforma del syllabus rompe esta
correspondencia, el syllabus está mal, no la matriz.

---

# PARTE III · MAPA CURRICULAR

## 7 · Carga de trabajo

| Concepto | Por semana | Total |
|---|---:|---:|
| Sesión síncrona sábado | 2,0 h | 32 h |
| Sesión síncrona domingo | 2,0 h | 32 h |
| *Antes* del sábado (micro-guía y predicciones) | 0,5 h | 8 h |
| *Después* del sábado (quiz de recuperación) | 0,5 h | 8 h |
| *Antes* del domingo (entorno y predicción) | 0,5 h | 8 h |
| *Después* del domingo (Transferencia al proyecto) | 1,25 h | 20 h |
| Revisión de código entre pares | 0,25 h | 4 h |
| **Subtotal lectivo (16 semanas)** | **8,0 h** | **112 h** |
| Compuertas y auditorías | — | 16 h |
| Memoria y preparación de la defensa | — | 20 h |
| **Subtotal del programa** | | **148 h** |
| **Módulo 0** (seis semanas previas, asíncrono) | ~4 h | **25 h** |
| **TOTAL** | | **≈ 173 h** |

Equivalencia: a razón de 25 a 30 horas de trabajo del estudiante por crédito, 173 h
corresponden a **6 o 7 ECTS estimados**. La cifra se declara siempre como estimación
de carga y nunca como crédito emitido (Carta, art. 8.2).

> **Lectura correcta de esta tabla.** Las **cuatro horas de clase** son las dos filas
> superiores: es todo el tiempo que el Instituto imparte. Las otras cuatro las pone el
> estudiante y **no son opcionales**: sin ellas no hay predicción que discutir el
> sábado, no hay recuperación espaciada y no hay Transferencia dominical, que es lo
> que convierte quince laboratorios en una plataforma. El desglose y su justificación
> están en el D1 §4.1 bis.

## 8 · Los tres hilos y los tres niveles

```text
                 NIVEL I              NIVEL II              NIVEL III        DEFENSA
Semana:   01 02 03 04 05 | 06 07 08 09 10 | 11 12 13 14 15 |    16
──────────────────────────────────────────────────────────────────────────────────
α Interfaz    ████████████░░░░░░░░░░░░░░░░░░░░████░░░░████░░    ██
  accesible   A1 A2 A3 A4                     A4              A4 A5

β Lógica      ░░░░░░██████████████████████████████░░░░░░░░░░    ██
  y datos     B1 B2 B3      B4 B6 C1 C2 C3 C4 D1  D2 C5

γ IA          ░░░░░░░░░░██░░██████████████░░░░████░░░░░░░░░░    ░░
              E1 E3          E4                  E5

δ TFG         ██████████████████████████████████████████████    ██
  (proyecto)  G1 en S02        G2 en S08          G3 en S15     Hito H

ε Negocio     ░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░    ██
              G1 anteproyecto                        G1 G2 D4 G3
```

**Regla de entrelazado.** Ningún hilo desaparece más de tres semanas seguidas. La
compresión de 48 a 16 semanas hace que varios hilos convivan dentro de una misma
sesión: la semana 5 mezcla DOM con anatomía de modelos de lenguaje, y la semana 14
concentra negocio, cumplimiento y descubrimiento. Está declarado en el D4 y es
deliberado, no un descuido de secuenciación.

## 9 · Grafo de dependencias duras

Una dependencia dura significa que la semana destino es **inviable** sin la origen.
Estas son las que gobiernan cualquier reordenación futura del plan.

| Origen | → | Destino | Por qué |
|---|:---:|---|---|
| **Módulo 0** (lógica) | → | S04 (JavaScript) | Sin nociones previas de variable, condicional y bucle, la semana 4 es imposible al ritmo requerido. **Es la dependencia que sostiene todo el programa.** |
| S02 (semántica y formularios) | → | S09 (crear datos desde formulario) | Sin formulario accesible no hay entrada de datos. |
| S04 (lógica y funciones) | → | S05 (DOM y eventos) | Los eventos manipulan estructuras que hay que saber recorrer. |
| S05 (DOM) | → | S07 (renderizar respuestas) | Nada que pintar sin API del DOM. |
| S07 (asincronía) | → | S08 (base de datos en la nube) | `await` sin bucle de eventos entendido produce culto a la carga. |
| S08 (modelado, N0) | → | S09 (operaciones sobre datos) | Se modela en papel antes de crear colecciones. |
| S09 (operaciones completas) | → | S10 (reglas de seguridad) | No se escriben reglas sobre operaciones que no existen. |
| S10 (reglas) | → | S11 (autenticación) | La regla precede al usuario: primero se cierra, luego se abre. |
| S12 (lógica de fechas) | → | S12 (interfaz de agenda) | La colisión se resuelve antes de dibujarla. Ambas caen en la misma semana, y ése es el punto más tenso del calendario. |
| S02 (**G1 aprobada**) | → | Toda Transferencia posterior | Sin proyecto definido no hay destino para la transferencia. |

## 10 · Distribución de hitos y compuertas

| Código | Hito | Semana | Qué se entrega | Compuerta |
|---|---|:---:|---|---|
| **G1** | Carta de Anteproyecto | **02** | Nicho, cliente, problema, propuesta de valor | Bloquea toda Transferencia posterior |
| — | Cierre del Nivel I | 05 | Página propia accesible y desplegada | Formativo, no bloqueante |
| **G2** | Modelo de datos aprobado | **08** | Esquema documental con sus consultas · **defensa a N0** | Bloquea el hito final |
| — | Cierre del Nivel II | 10 | Plataforma dinámica con datos, panel, reglas y despliegue | Formativo, no bloqueante |
| **G3** | Auditoría Técnica final | **15** | Informe ATE sin hallazgos críticos | Bloquea la defensa |
| **H** | **Demo Day y sustentación** | **16** | Plataforma transaccional + memoria + pitch | Graduación |

Los cierres de nivel de las semanas 5 y 10 **no son compuertas**: son puntos de
control formativos que producen retroalimentación y activan el protocolo de riesgo de
abandono si procede (D1 §8.1). Convertirlos en bloqueantes en un programa de dieciséis
semanas dejaría sin margen de recuperación a quien tropiece una vez.

---

# PARTE IV · TECNOLOGÍA Y CANON TÉCNICO

## 11 · Conjunto tecnológico y su justificación

| Capa | Elección | Por qué esta y no otra |
|---|---|---|
| **Estructura** | HTML5 semántico | Es la capa de accesibilidad. No hay atajo. |
| **Presentación** | CSS3 con propiedades personalizadas, Flexbox y Grid | Sin preprocesador ni marco de utilidades: se enseña la cascada, no a esquivarla. |
| **Lógica** | JavaScript ES6+ estándar | Un marco resuelve problemas que el novato aún no tiene. Se aprende la plataforma; el marco se aprende después en dos semanas. |
| **Entorno** | GitHub Codespaces | Elimina la desigualdad de máquinas y de conectividad. Todos programan en el mismo contenedor. Es la decisión que hace viable la equidad del art. 16. |
| **Control de versiones** | Git y GitHub | Estándar del oficio y sustrato de la evaluación por artefacto. |
| **Pruebas** | Vitest (unidad) y Playwright (extremo a extremo) | Ejecutables en Codespaces y en la compuerta de integración continua. |
| **Datos** | Firebase Cloud Firestore | Capa gratuita suficiente, sincronización en tiempo real, y reglas de seguridad declarativas que **enseñan** el modelo de amenaza mejor que un ORM. |
| **Identidad** | Firebase Authentication | Permite estudiar sesiones y testigos sin construir criptografía. |
| **Servidor** | Cloud Functions (Node.js) | Frontera cliente/servidor explícita, que es el concepto a enseñar. |
| **Despliegue** | Cloudflare Pages o Netlify con acción de integración continua | Compuerta de calidad bloqueante desde la semana 28. |
| **Auditoría** | `axe-core`, Lighthouse CI, WebPageTest | Umbrales objetivos, reproducibles y públicos. |
| **IA** | Modelos de capa gratuita y asistentes en el editor | Se evita atar el currículo a un proveedor. Lo que se enseña es el criterio, no el producto. |

**Regla de sustituibilidad.** Ninguna elección de esta tabla es doctrinal. Si un
proveedor cambia sus condiciones o desaparece, se sustituye sin tocar los
resultados de aprendizaje, porque los `RA` están redactados sobre conceptos y no
sobre productos. Esa es la razón de que digan «servicio de base de datos en la
nube» y no «Firestore».

## 12 · Correspondencia con el estándar técnico de la empresa

El Instituto enseña, en versión simplificada y construida desde cero, el mismo
catálogo de funciones que Elysium λ implementa en producción
(`ELYSIUM-STANDARDS.md`, Parte II). El estudiante no recibe el código del núcleo:
lo **reconstruye**, y al hacerlo entiende por qué el estándar es como es.

| Función del estándar | Semana | Alcance en el Instituto |
|---|:---:|---|
| **F05** Information System | 2 | Completo |
| **F02** Header Mobile-First | 3 | Completo |
| **F13** Dynamic Theme · **F14** Theme Switcher | 3 | Completo |
| **F03** Scroll Reveal · **F04** Anchor Glide | 3 | Versión reducida |
| **F01** Loading Page · **F10** Elysium Signature | 3 | Versión propia del estudiante |
| **F18** Personalized CRM · **F25** Client Records | 9 | Versión reducida |
| **F23** Clean URLs · **F06** System Update | 10 | Conceptual + versionado |
| **F07** Security Core | 11 | Completo |
| **F24** Smart Booking | 12 | Versión reducida |
| **F26** Online Payments | 12 | Sólo si el arquetipo lo requiere, en modo de prueba |
| **F19** Discovery Core · **F20** SEO | 14 | Completo |
| **F08** Cookies Management | 15 | Completo |
| **F15** Multi-language · **F16** Multi-Currency · **F17** Web App Downloader · **F22** System Settings · **F27** Occupancy Reports | — | **Fuera de alcance.** No caben en dieciséis semanas y se declaran como tales. |
| **F11** Efectos de Temporada · **F12** Magic Mouse | — | **Excluidas.** Reservadas a código de producción de la empresa. |

**Advertencia de propiedad.** El kit `elysium-core/` y su código no se distribuyen
a los estudiantes. Lo que comparte el Instituto es la **especificación funcional**
y los criterios de aceptación, no la implementación propietaria. El trabajo del
estudiante es suyo (Carta, art. 57) y no incorpora código de la empresa.

---

# PARTE V · DECISIONES DE DISEÑO CURRICULAR

## 13 · Correcciones aplicadas al borrador inicial

> **Nota de lectura.** Esta sección es un **registro histórico**. Sus códigos de
> semana (`C1·S04`, `C2·S09`…) pertenecen al diseño de 48 semanas y no corresponden a
> los del syllabus vigente. Se conserva sin reescribir porque su valor está en dejar
> constancia de qué se corrigió y por qué, no en localizar semanas. La correspondencia
> con el plan actual está en el §6 y en el §13 ter.

El plan original del fundador fue el punto de partida y su estructura de tres
cuatrimestres y de bloques semanales se conserva casi íntegra. Se aplicaron once
correcciones, todas documentadas aquí para que puedan revertirse con conocimiento
de causa.

| # | Problema detectado en el borrador | Corrección | Fundamento |
|---|---|---|---|
| **1** | La Transferencia dominical aplica lo aprendido «al proyecto de graduación» desde la semana 1, pero el proyecto se ideaba en la semana 13. Doce semanas de transferencia sin destino. | El anteproyecto se define en las semanas 1–3 y se aprueba como compuerta **G1 en la semana 3**. Las antiguas semanas 13–16 pasan de *ideación* a *consolidación y construcción*. | D1 §4.4 |
| **2** | Las semanas 9 a 12 de C1 eran teoría de IA sin programación: cuatro semanas de decaimiento de una destreza recién adquirida. | Los sábados mantienen la teoría de IA íntegra; los domingos construyen **instrumentos de IA en JavaScript y DOM** (tokenizador, calculadora de coste, registro de alucinaciones, comparador de modelos). | D1 §5.3 |
| **3** | El plan cita **WCAG 2.1**. | Se adopta **WCAG 2.2 nivel AA**, con mención expresa de EN 301 549 y de la Directiva (UE) 2019/882, aplicable desde el 28-VI-2025. Se enseña además que la versión de EN 301 549 que incorpora WCAG 2.2 se espera publicada en 2026, y qué implica el desfase normativo. | Carta, art. 62 |
| **4** | Los formularios HTML no aparecían antes de C2·S09, donde ya se pedía insertar datos desde un formulario. | Formularios accesibles (etiquetas, agrupaciones, mensajes de error, `aria-live`) se enseñan en **C1·S02 y C1·S03**. | §9 dependencias |
| **5** | La manipulación del DOM no tenía semana propia pese a ser requisito de casi todo. | Se introduce en **C1·S06** con eventos, se consolida en S07–S08 y se aplica en S09–S12. | §9 dependencias |
| **6** | La evaluación menciona «tests automatizados» sin que el plan enseñara a escribirlos ni definiera el arnés. | Cada laboratorio se entrega con una **especificación de pruebas dada** desde C1·S05; el estudiante escribe las suyas desde **C2·S05** (RA-B5). | D3 §6.1 |
| **7** | Git aparecía en C2·S12 (despliegue), pero se usaba desde la semana 1. | Git básico en **C1·S01**; flujo profesional con ramas, revisión y versionado Elysium en **C2·S12**. | RA-F1 |
| **8** | No existía preparación previa al inicio: la semana 1 se iba en instalar cosas. | Se añade la **Semana 0** de incorporación asíncrona (D4 §3), sin coste y sin evaluación. | D1 §8 |
| **9** | El artículo científico se anunciaba, pero ninguna semana producía datos para él. | Se define la línea de investigación como **auditoría de sitios de pymes hispanohablantes**, que usa exactamente las destrezas del currículo, y se reparten seis compuertas de investigación a lo largo de las 48 semanas. | D8 |
| **10** | El cobro en línea aparecía en la parrilla comercial de la empresa pero no en el plan de estudios, pese a ser el corazón de una plataforma transaccional. | Se añade **pagos en modo de prueba** en C3·S12, con tratamiento explícito de que no se manipulan datos de tarjeta. | RA-C5, F26 |
| **11** | El bloque de trámites era exclusivamente costarricense, en un programa dirigido a veinte países. | C3·S09 se reestructura como **taller de investigación normativa guiada**: cada estudiante documenta la ruta de su propia jurisdicción con una plantilla común, y se comparan en aula. Costa Rica y Portugal se usan como casos trabajados. | Carta, art. 3 |

## 13 bis · Segunda revisión: el giro a acción social (agosto de 2026)

La versión 1.0.0 del paquete describía una escuela de pago con aulas de treinta
personas. La dirección del Instituto rectificó esa premisa: **el programa es
gratuito, de un solo grupo pequeño, y arranca siempre en septiembre**. Estas son las
seis consecuencias curriculares de aquel giro.

| # | Qué cambió | Consecuencia en el plan de estudios |
|---|---|---|
| **12** | **Gratuidad total.** Nadie paga nada, por ningún concepto. | Desaparece toda referencia a precio, tramos, becas parciales y reembolso. La equidad ya no se logra con precios ajustados sino con gratuidad más selección motivada (Carta, arts. 2 bis, 16 y 64). |
| **13** | **Aula de 10 a 15, una sola por generación.** | El límite pasa de restricción operativa a **decisión de diseño**: los tres mecanismos distintivos (defensa de autoría, tutoría por compuerta, retroalimentación en 7 días) sólo existen a esa escala. Se elimina la vía de crecimiento por aulas paralelas. |
| **14** | **Agentes de IA en el Cuatrimestre 2.** | Se redibuja la frontera N3/N4: el criterio ya no es si la herramienta se llama agente, sino **si puede actuar fuera del editor**. El agente que escribe en el repositorio es N3 y entra en C2; el que ejecuta en el servidor es N4 y espera a C3. El diseño del modelo de datos (G4) y de las reglas (G5) permanece en **N0** aunque ocurra en C2. Ver D1 §6.2. |
| **15** | **El año académico coincide con el año natural.** | El calendario deja de ser una fecha concreta y pasa a ser una **regla anual**: arranque el segundo sábado de enero, Demo Day el tercer sábado de diciembre. Los cuatrimestres pasan a serlo de verdad: C1 enero–mayo, C2 mayo–agosto, C3 septiembre–diciembre. **Coste asumido:** sólo caben dos fines de semana de receso, de modo que C2 y C3 se imparten en dieciséis fines de semana consecutivos cada uno. |
| **16** | **Generación piloto previa.** | Se añade una cohorte Λ00 de 5 o 6 personas que cursa **sólo las semanas 1 a 8** entre el 12 de septiembre y el 1 de noviembre de 2026, sin certificado y sin investigación. Su función es someter a prueba los materiales de mayor riesgo, y los dos meses siguientes quedan reservados a corregirlos antes del arranque oficial del 9 de enero de 2027. |
| **17** | **El paper se «publica» en C3.** | Se precisa el término: lo que se publica en la semana 46 es el **preprint con identificador persistente**, y simultáneamente se envía el manuscrito a revista. Prometer la aceptación editorial violaría el art. 18 de la Carta. Ver D8 §15. |

## 13 ter · Tercera revisión: el paso a programa uni-cuatrimestral (agosto de 2026)

| # | Qué cambió | Consecuencia en el plan de estudios |
|---|---|---|
| **18** | **De 48 semanas a 16**, en tres niveles de cinco más una de defensa. | La carga lectiva pasa de 384 h a 112 h. **Todos los temas se conservan**, pero no a la misma profundidad: 19 resultados quedan **dominados** y 13 **introducidos** (§5.9), y el certificado debe distinguirlos. |
| **19** | **Módulo 0 preparatorio** de 25 h, asíncrono y gratuito. | Es la única forma de mantener «sin experiencia previa exigida» y a la vez comprimir el temario. Se convierte en la dependencia dura que sostiene todo el programa (§9). |
| **20** | **La investigación sale del plan del estudiante.** | Se suprime el dominio H completo. La línea pasa al profesorado con carga cero para el aula (D8). El catálogo baja de 36 a 32 resultados. |
| **21** | **Los niveles no son certificables por separado.** | Evita que el programa se lea como tres productos y que alguien reclame acreditación por cinco semanas cursadas (Carta, arts. 42 y 48). |
| **22** | **Los cierres de nivel son formativos, no compuertas.** | En dieciséis semanas, una compuerta bloqueante cada cinco dejaría sin margen a quien tropiece una vez. Sólo G1, G2 y G3 bloquean. |

> **Lo que no cambió, ni siquiera ahora.** El Ciclo λ, la Escalera de IA, la Defensa
> Aleatoria de Autoría, la Auditoría Técnica con umbrales objetivos, el principio de
> artefacto y la Transferencia dominical siguen intactos. Tres cambios de premisa
> (de pago a gratuito, de treinta a diez, de cuarenta y ocho semanas a dieciséis) no
> han obligado a tocar el núcleo pedagógico. Eso es un indicio razonable de que el
> núcleo estaba bien separado de la operación.

## 14 · Riesgos curriculares reconocidos

| Riesgo | Probabilidad | Mitigación prevista |
|---|:---:|---|
| Ocho horas semanales resultan insuficientes para novatos absolutos en C2. | Media | Reintento hasta el dominio; semanas 13 de cada cuatrimestre reservadas a consolidación; congelación de matrícula sin penalización. |
| Dispersión de proyectos: hasta 15 dominios distintos que asesorar. | Media | El laboratorio usa dominio neutro común; sólo la Transferencia es individual. Catálogo de cinco arquetipos de negocio para encauzar la elección en G1. El aula pequeña reduce mucho este riesgo respecto al diseño original. |
| Dependencia de un único proveedor de datos (Firebase). | Media | Regla de sustituibilidad (§11); los `RA` no nombran productos. |
| El agente en el editor (N3) erosiona la autoría real ya en C2. | **Alta** | Defensa Aleatoria de Autoría desde la semana 20; `AI-USE.md` con apartado de rechazos obligatorio; G4 y G5 a nivel N0 con defensa oral. Es el riesgo más serio de todo el programa y por eso lleva tres contrapesos y no uno. |
| El nivel N4 de IA en C3 erosiona la autoría real del trabajo final. | Media | Defensa Aleatoria de Autoría con frecuencia **duplicada** en C3; la defensa final es N0. |
| **Todo el programa depende de una sola persona docente.** | **Alta** | Grabación íntegra y materiales escritos completos; generación piloto Λ00 que prueba y documenta el material un año antes; tutores pares reclutados entre los pilotos; docente suplente identificado antes de la Generación I. **No se mitiga con crecimiento**: el aula pequeña es decisión de diseño (Carta, art. 41), no una limitación a superar. |

## 15 · Bibliografía de fundamentación

**Diseño instruccional y evidencia educativa**

- van Alten, D., Phielix, C., Janssen, J., Kester, L. (2019). *Effects of flipping
  the classroom on learning outcomes and satisfaction: A meta-analysis*.
  Educational Research Review, 28.
- Dunlosky, J., Rawson, K., Marsh, E., Nathan, M., Willingham, D. (2013).
  *Improving Students' Learning With Effective Learning Techniques*.
  Psychological Science in the Public Interest, 14(1).
- Roediger, H., Karpicke, J. (2006). *Test-Enhanced Learning*.
- Collins, A., Brown, J. S., Newman, S. (1989). *Cognitive Apprenticeship*.
- Biggs, J. *Teaching for Quality Learning at University* (alineamiento constructivo).
- Hattie, J., Timperley, H. (2007). *The Power of Feedback*.
- Nicol, D., Macfarlane-Dick, D. (2006). *Formative assessment and self-regulated learning*.
- Garrison, D. R., Anderson, T., Archer, W. (2000). *Critical Inquiry in a
  Text-Based Environment: Computer Conferencing in Higher Education*.
- Deci, E., Ryan, R. *Self-Determination Theory*.
- van Merriënboer, J., Kirschner, P. *Ten Steps to Complex Learning* (4C/ID).
- Kalyuga, S. y cols. (2003). *The Expertise Reversal Effect*.
- Kapur, M. *Productive Failure*.
- Bloom, B. (1984). *The 2 Sigma Problem*. (Citado con la reserva del D1 §2.9.)

**Educación en programación**

- Sentance, S., Waite, J. *Teaching computer programming with PRIMM: a
  sociocultural perspective*.
- ITiCSE 2022 Working Group. *Parsons Problems and Beyond*.
- Weinman, N., Fox, A., Hearst, M. (2021). *Improving Instruction of Programming
  Patterns with Faded Parsons Problems*. CHI.
- Porter, L., Bailey Lee, B., Simon, B. *Peer Instruction in Computing*.

**Inteligencia artificial generativa y aprendizaje**

- Prather, J. y cols. (2024). *The Widening Gap: The Benefits and Harms of
  Generative AI for Novice Programmers*. ICER.
- Tankelevitch, L. y cols. *The Metacognitive Demands and Opportunities of
  Generative AI*.
- Literatura 2025–2026 sobre deuda epistémica y guiones metacognitivos en
  programación asistida (ver D8 §2 para la revisión completa y actualizada).

**Marco normativo**

- Directiva (UE) 2019/882 (Acta Europea de Accesibilidad), aplicable desde el
  28-VI-2025.
- EN 301 549 (norma armonizada de accesibilidad TIC).
- W3C, *Web Content Accessibility Guidelines 2.2*.
- Reglamento (UE) 2016/679 (RGPD); Lei n.º 58/2019 (Portugal); Ley n.º 8968
  (Costa Rica).
- Recomendación del Consejo de 16-VI-2022 relativa a un enfoque europeo de las
  microcredenciales.

---

*Elysium λ Institute of Development & Research · D2 · «Abstrahere, aedificare, probare.»*
