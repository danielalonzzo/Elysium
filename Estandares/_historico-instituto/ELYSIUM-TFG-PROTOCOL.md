# Elysium λ Institute — Protocolo del Trabajo Final de Graduación
### v1.0.0 · Agosto 2026 · Documento D9 del paquete fundacional
### De la idea a la plataforma en producción · Semanas 1 a 16

> **Cómo leer este documento.** Describe el recorrido completo del Trabajo Final de
> Graduación, que empieza en la **semana 1** y termina en la **semana 16**. La
> Parte I fija su naturaleza y las reglas de elección del proyecto. La Parte II
> detalla las cuatro fases y sus compuertas, con el cronograma semana a semana. La
> Parte III contiene las rúbricas de cada compuerta. La Parte IV especifica la
> memoria técnica y la defensa. La Parte V trata propiedad intelectual, datos de
> terceros y casos especiales. Los anexos son las plantillas que el estudiante
> rellena.
>
> **La regla que gobierna todo el protocolo.** El proyecto no es una práctica de
> curso: es **infraestructura real de un negocio real**, y se construye desde el
> primer domingo con la misma calidad que tendría un proyecto de producción de
> Elysium λ. Es el mismo principio que rige los prototipos comerciales de la
> empresa: *el código no sabe que es un ejercicio; para él, ya es el sitio del
> cliente.*

---

# PARTE I · NATURALEZA Y ELECCIÓN

## 1 · Qué es el TFG Elysium λ

Una **plataforma web transaccional en producción**, propiedad del estudiante,
construida durante 16 semanas mediante la Transferencia dominical, auditada bajo
los umbrales de la Auditoría Técnica Elysium, acompañada de una memoria técnica y
defendida ante un panel con auditor externo.

No es una tesis. No es un prototipo. No es una demostración. Es un sistema que
funciona, que cumple la normativa aplicable y que alguien puede usar el lunes
siguiente a la graduación.

## 2 · Los cinco principios

1. **Un solo proyecto durante las 16 semanas.** Cambiar de proyecto reinicia el reloj
   y sólo se autoriza en las condiciones del §17.
2. **Cliente identificado.** Real o plausible, pero con nombre, contexto y problema
   concreto. Un proyecto «para pymes en general» no es admisible: no se puede
   diseñar para todo el mundo.
3. **Construcción incremental y continua.** Cada domingo el proyecto avanza. No hay
   semanas de acumulación seguidas de sprints heroicos.
4. **Calidad de producción desde el primer archivo.** Sin carpetas llamadas
   «prueba», sin código muerto, sin datos de ejemplo incrustados, sin
   `console.log` de depuración. Si el proyecto se abandonara en cualquier semana,
   lo entregado debería ser publicable.
5. **Autoría demostrable.** El estudiante puede explicar y modificar en vivo
   cualquier línea, en cualquier momento (Carta, art. 10).

## 3 · Los cinco arquetipos admisibles

Para que el currículo se aplique íntegro, el proyecto debe encajar en uno de estos
arquetipos. La restricción no limita la creatividad: canaliza el dominio de negocio
hacia una arquitectura que el programa enseña de verdad.

| # | Arquetipo | Ejemplos | Funciones que ejercita |
|:---:|---|---|---|
| **1** | **Servicio con cita previa** | Fisioterapia, osteopatía, peluquería, taller mecánico, clases particulares | Agenda, área privada, recordatorios, informes de ocupación |
| **2** | **Catálogo con pedido** | Comercio local, artesanía, alimentación, floristería | Catálogo, carrito, pago, seguimiento de pedido |
| **3** | **Formación o contenido con acceso restringido** | Academia, taller, escuela de música, membresía | Matrícula, área privada, progreso, bonos |
| **4** | **Directorio o intermediación local** | Guía de comercios, asociación sectorial, bolsa de servicios | Fichas, búsqueda, contacto, moderación |
| **5** | **Gestión interna de una micro-organización** | Asociación, cooperativa, clínica pequeña, club deportivo | Panel con roles, registros, informes, exportación |

## 4 · Criterios de admisibilidad

Un proyecto es admisible si cumple **todos** estos requisitos:

| # | Requisito | Por qué |
|:---:|---|---|
| 1 | Requiere **autenticación** de al menos dos roles distintos | Sin ello no se ejercita el dominio D |
| 2 | Requiere **datos persistentes** en la nube con operaciones completas | Sin ello no se ejercita el dominio C |
| 3 | Incluye al menos una **transacción**: reserva, pedido, matrícula o alta | Es el núcleo del Nivel III |
| 4 | Tiene un **cliente identificable** con nombre y contexto | Principio 2 |
| 5 | Es **legal** en la jurisdicción del estudiante | Evidente, y se verifica |
| 6 | **No trata datos de categoría especial** salvo con salvaguardas expresas | Ver §5 |
| 7 | Puede construirse dentro de las **capas gratuitas** de los servicios | Equidad de acceso (Carta, art. 16) |

## 5 · La regla de los datos sensibles

Varios de los arquetipos rozan datos de salud: una agenda de fisioterapia, una
clínica pequeña, un club deportivo con partes médicos. El Reglamento (UE) 2016/679
trata los datos de salud como **categoría especial** y su tratamiento exige
salvaguardas que exceden el alcance formativo del programa.

**Regla dura del Instituto.** Un TFG puede gestionar **metadatos de la cita**
(quién, cuándo, qué servicio, duración, precio, estado). **No puede almacenar
contenido clínico**: diagnósticos, historiales, notas de evolución, imágenes
médicas ni datos de salud de ningún tipo. Si el negocio real los necesita, se
documenta en la memoria como funcionalidad **fuera de alcance** con la
justificación normativa, lo cual es en sí mismo un ejercicio profesional valioso.

La misma regla se aplica a datos de menores, datos biométricos, datos financieros
completos y datos de afiliación sindical, religiosa o política.

---

# PARTE II · LAS CUATRO FASES

## 6 · Vista general

| Fase | Semanas | Qué produce | Compuerta de salida |
|:---:|:---:|---|---|
| **F0 · Preparación** | Módulo 0 | Idea preliminar y entorno listo | — |
| **F1 · Anteproyecto** | 1–2 | Nicho, cliente, problema, propuesta de valor | **G1** (S02) |
| **F2 · Construcción** | 3–10 | Interfaz accesible, lógica, datos en la nube, panel, reglas, despliegue | **G2** (S08) |
| **F3 · Transaccional y negocio** | 11–15 | Identidad, agenda, agente supervisado, cobro en prueba, cumplimiento, endurecimiento | **G3** (S15) |
| **F4 · Defensa** | 16 | Demo Day, memoria y sustentación | **H** (S16) |

Cuatro fases y cuatro compuertas, frente a las nueve del diseño de 48 semanas. La
razón es aritmética: una compuerta bloqueante cada dos semanas no deja margen de
recuperación a nadie.

## 7 · Fase por fase

### F0 · Preparación · Módulo 0

Trabajo asíncrono sin evaluación, en las seis semanas previas. Se entrega la nota de
una página *«el negocio que quiero construir»*. No es vinculante: su función es que
la semana 1 empiece con material sobre el que conversar.

### F1 · Anteproyecto · Semanas 1 y 2

| Semana | Actividad | Producto |
|:---:|---|---|
| 1 | Repositorio personal con la idea declarada en cinco líneas | `README.md` inicial |
| 2 | Investigación de nicho, cliente concreto identificado, y redacción de la Carta | **Carta de Anteproyecto** |

> **⚑ G1 · Carta de Anteproyecto.** Vence el domingo de la semana 2 a las 23:59 UTC.
> **Bloquea todas las Transferencias posteriores.** Plantilla en el Anexo I; rúbrica
> en §11.1.

**Por qué en la semana 2 y no en la 3.** En un programa de dieciséis semanas, cada
domingo sin destino es un 6 % de la Transferencia perdida. La Carta se pide antes y
se admite más imperfecta: se corrige en la tutoría de la semana 4.

### F2 · Construcción · Semanas 3 a 10

Las Transferencias `T03` a `T10` levantan la plataforma: sistema de tokens y
responsividad, modelo de dominio, validación accesible, capa de datos, colecciones en
la nube, operaciones completas, panel de administración, reglas de seguridad y
despliegue continuo con compuerta.

> **⚑ G2 · Modelo de datos aprobado.** Vence el domingo de la semana 8. **Bloquea el
> hito final.** Se **defiende oralmente a nivel N0**: la arquitectura de datos no se
> delega. Rúbrica en §11.4.

### F3 · Transaccional y negocio · Semanas 11 a 15

Autenticación y roles, motor de disponibilidad y agenda accesible, función de
servidor con agente supervisado y carta de límites, cobro en modo de prueba,
expediente de cumplimiento, marca y descubrimiento, y endurecimiento con ataque
cruzado autorizado.

> **⚑ G3 · Auditoría Técnica final.** Vence el domingo de la semana 15. **Sin
> hallazgos críticos. Bloquea la defensa.**

**Congelación de funcionalidad:** al cierre de la semana 14 no se añaden funciones
nuevas. La semana 15 es sólo endurecimiento, remediación y memoria.

### F4 · Defensa · Semana 16

Demo Day público el sábado y sustentación técnica el domingo, ante panel con auditor
externo (Carta, art. 23).

> **⚑ H · Graduación.** Rúbrica en §11.8.

## 8 · Cronograma de Transferencias

Cada Transferencia dominical tiene destino declarado. Ésta es la ruta completa de
cómo quince domingos producen una plataforma.

| Sem. | Transferencia | Sem. | Transferencia |
|:---:|---|:---:|---|
| 01 | Repositorio e idea declarada | 09 | Formulario conectado y panel de administración |
| 02 | Esqueleto semántico y formulario · **G1** | 10 | Reglas, casos negativos y despliegue con compuerta |
| 03 | Sistema de tokens y responsividad | 11 | Autenticación, roles y rutas privadas |
| 04 | Modelo de datos del negocio en JavaScript | 12 | Agenda operativa y accesible |
| 05 | Validación accesible y catálogo dinámico | 13 | Agente supervisado y cobro en prueba |
| 06 | Componente asistido y fallo depurado con bitácora | 14 | Expediente legal, marca y descubrimiento |
| 07 | Los cuatro estados y la capa de datos | 15 | Sin hallazgos críticos y memoria · **G3** |
| 08 | Colecciones creadas y pobladas · **G2** | 16 | **Demo Day y sustentación · H** |

## 9 · Tutoría

| Momento | Formato | Duración |
|---|---|:---:|
| Semanal | Retroalimentación escrita de la Transferencia | — |
| Semanas 2, 8 y 15 | Tutoría individual **obligatoria**, antes de cada compuerta | 20 min |
| Semanas 5 y 10 | Tutoría de cierre de nivel, con informe formativo | 20 min |
| Semana 15 | Revisión de la auditoría con informe | 30 min |
| A demanda | Consulta por canal asíncrono, respuesta en 48 h laborables | — |
| Riesgo detectado | Protocolo del D1 §8.1 | Según fase |

**Cinco tutorías individuales obligatorias** en las dieciséis semanas. La tutoría no
es un servicio opcional: la ausencia injustificada a dos de ellas es señal de riesgo y
activa el protocolo de abandono. Con un aula de diez, las cincuenta tutorías del
programa suman unas 17 horas.

## 10 · Qué hace y qué no hace el tutor

| Sí | No |
|---|---|
| Pregunta hasta que el estudiante encuentra el error | Escribe código en el proyecto del estudiante |
| Señala qué criterio de la rúbrica no se cumple | Rediseña la solución por él |
| Propone dos caminos y sus consecuencias | Elige el camino |
| Revisa el `AI-USE.md` y pregunta por los rechazos | Acepta una entrega sin declaración |
| Detiene un proyecto inviable a tiempo | Deja avanzar 30 semanas algo que no llegará |

---

# PARTE III · RÚBRICAS DE LAS COMPUERTAS

> Todas las rúbricas usan la escala del D3 §3. Aprobación en **70**. El estudiante
> las conoce antes de empezar la fase (D3, regla de publicidad anticipada).

## 11.1 · G1 · Carta de Anteproyecto

| Criterio | Peso | Insuficiente | Suficiente | Notable | Excelente |
|---|:---:|---|---|---|---|
| **Concreción del cliente** | 30 % | «Pymes» o «todo el mundo». | Segmento definido. | Cliente con nombre y contexto. | Cliente con nombre, contexto y una conversación real documentada. |
| **Problema** | 25 % | Enunciado como falta de web. | Problema de negocio identificado. | Problema con su coste actual estimado. | Coste estimado con evidencia o testimonio. |
| **Propuesta de valor** | 20 % | Genérica. | Clara en una frase. | Clara y diferenciada de los competidores. | Además, declara qué **no** hará. |
| **Análisis competitivo** | 15 % | Ausente. | Tres competidores listados. | Tres analizados con fortalezas y huecos. | Además, identifica el hueco que ocupará. |
| **Encaje con un arquetipo** | 10 % | No encaja o no lo declara. | Encaja. | Encaja y justifica la elección. | Encaja y anticipa las funciones que necesitará. |

## 11.2 · G2 · Modelo de datos

| Criterio | Peso | Umbral |
|---|:---:|---|
| Cobertura de consultas | 30 % | Las diez consultas previstas se resuelven con el esquema |
| Justificación de la desnormalización | 30 % | **Cada** decisión tiene una consulta que la motiva |
| Tipado y restricciones | 15 % | Todos los campos con tipo y obligatoriedad declarados |
| Estimación de volumen a 12 meses | 10 % | Presente y razonada |
| **Defensa oral a nivel N0** | 15 % | Explica por qué su esquema y no otro |

## 11.3 · Reglas de seguridad

| Criterio | Peso | Umbral |
|---|:---:|---|
| Denegación por defecto | **Bloqueante** | Verificada |
| Diez casos negativos automatizados | 40 % | **Todos rechazados.** Uno que pase bloquea |
| Cinco casos positivos | 20 % | Todos pasan |
| Validación de forma en la regla | 20 % | El documento malformado se rechaza en la regla, no sólo en la interfaz |
| Defensa oral a nivel N0 | 20 % | Explica necesidad y suficiencia de cada regla |

> **Dónde se evalúa ahora.** Estas reglas ya no tienen compuerta propia: se evalúan
> en el laboratorio `L10` de la semana 10 y vuelven a comprobarse en el bloque
> `ATE-S` de la Auditoría Técnica final (G3). La rúbrica se conserva porque sigue
> siendo el criterio, aunque el instrumento haya cambiado.

## 11.4 · Expediente de cumplimiento

Se evalúa dentro del bloque `ATE-C` de la Auditoría Técnica final (G3), no como
compuerta separada.

| Criterio | Peso | Umbral |
|---|:---:|---|
| Registro de actividades de tratamiento | 25 % | Cada tratamiento con base legal, finalidad, plazo y destinatarios |
| Política de privacidad | 25 % | Describe la aplicación **real**, no una genérica |
| Términos, aviso legal y consentimiento de cookies | 25 % | Presentes, coherentes y con consentimiento previo efectivo |
| Ficha de ruta de formalización | 25 % | Pasos, órganos, costes y plazos, con **fuentes oficiales** |

## 11.5 · H · Graduación

| Componente | Peso |
|---|:---:|
| `ATE` completa sin hallazgos críticos (G3) | Requisito previo |
| **Producto**: plataforma transaccional completa y en producción | 35 % |
| **Memoria técnica** conforme a §14 | 25 % |
| **Sustentación técnica** ante panel (rúbrica del D3, Anexo III) | 25 % |
| **Pitch de Demo Day** | 15 % |

---

# PARTE IV · MEMORIA Y DEFENSA

## 12 · Naturaleza de la memoria

La memoria del TFG **no** es un informe académico convencional: es el **documento de
entrega que Elysium λ produce para un cliente real**, ampliado con la
justificación de las decisiones. Por eso su estructura reproduce los diez pasos del
**λ Development Framework Model** de la empresa. Quien escribe esta memoria está
practicando exactamente el entregable de su vida profesional.

## 13 · Extensión y formato

| Elemento | Especificación |
|---|---|
| Extensión | **12 a 20 páginas**, sin anexos. Se redujo con el programa: una memoria de cuarenta páginas sobre dieciséis semanas de trabajo sería relleno. |
| Lengua | Español; los términos técnicos en inglés cuando sea la forma canónica |
| Formato | Markdown en el repositorio, exportado a PDF accesible con estructura de encabezados y texto alternativo |
| Figuras | Diagramas propios; toda figura ajena, atribuida |
| Citas | Sistema uniforme, declarado al inicio |
| Anexos | Sin límite: código relevante, informes de auditoría, capturas |

## 14 · Estructura obligatoria

| § | Sección | Paso λ | Entrega en |
|:---:|---|:---:|:---:|
| **1** | Resumen y palabras clave | — | S15 |
| **2** | Entorno operativo actual: el negocio, sus flujos y su contexto | 01 | S05 |
| **3** | Estado del arte y limitaciones: qué usa hoy, qué usan los competidores | 02 | S05 |
| **4** | Variables críticas: procesos manuales, gestión de datos, vulnerabilidades | 03 | S05 |
| **5** | Definición del problema | 04 | S05 |
| **6** | Impacto esperado: riesgo mitigado, tiempo ahorrado, presencia ganada | 05 | S10 |
| **7** | Arquitectura de la infraestructura propuesta | 06 | S10 |
| **8** | Selección tecnológica: opciones, criterios, elección y coste de la elección | 07 | S10 |
| **9** | Diseño, desarrollo y base de datos | 08 | S15 |
| **10** | Aseguramiento de calidad y auditoría: informes ATE, hallazgos, remediación | 09 | S15 |
| **11** | Entrega y formación: cómo se opera, quién la mantiene, cómo se traspasa | 10 | S15 |
| **12** | Modelo de negocio y economía unitaria | — | S15 |
| **13** | Cumplimiento normativo y tratamiento de datos | — | S15 |
| **14** | Declaración de uso de IA a lo largo del proyecto | — | S15 |
| **15** | Limitaciones, deuda técnica conocida y trabajo futuro | — | S15 |
| **16** | Conclusiones y aprendizaje personal | — | S15 |

> **La sección 15 es obligatoria y se evalúa.** Una memoria que no declara su deuda
> técnica ni sus limitaciones no es una memoria de ingeniería: es publicidad.
> Reconocer con precisión lo que no se hizo bien puntúa alto.

## 15 · Cómo se escribe una decisión de ingeniería

Formato obligatorio en las secciones 7, 8 y 9. Cada decisión relevante se escribe
así:

```markdown
### D-NN · [Decisión en una frase]
**Contexto.** [Qué situación la obligó.]
**Opciones consideradas.** [Al menos dos, descritas con justicia.]
**Criterio de decisión.** [Qué se optimizó: coste, tiempo, accesibilidad, seguridad…]
**Elección y por qué.**
**Coste de la elección.** [Qué se pierde. Toda decisión pierde algo.]
**Cuándo la revisaría.** [Condición concreta que obligaría a cambiarla.]
```

Un documento con diez decisiones así escritas demuestra más criterio de ingeniería
que cincuenta páginas de descripción de funcionalidades.

## 16 · La defensa

| Fase | Duración | Contenido | Nivel de IA |
|---|:---:|---|:---:|
| Exposición técnica | 10 min | Arquitectura, decisiones y alternativas descartadas | — |
| **Defensa de autoría final** | 10 min | Modificación de código en vivo, pantalla compartida | **N0** |
| Preguntas del panel | 15 min | Técnicas, de negocio y de cumplimiento | — |
| Deliberación | 5 min | A puerta cerrada | — |

**Panel:** presidencia, vocalía técnica y **vocalía externa al Instituto**
(Carta, art. 23). Cámara obligatoria. La ausencia del vocal externo obliga a
aplazar, no a celebrar la defensa sin él.

**Preguntas que siempre se hacen**, y que por tanto se entrenan en la semana 47:
*¿por qué esta base de datos y no otra?*, *¿qué parte de esto no escribió usted?*,
*¿qué pasa si mañana tiene mil usuarios?*, *¿cómo sabe que es accesible?*,
*¿qué dato personal guarda y con qué base legal?*, *¿qué es lo peor que puede
hacer su agente si el modelo se equivoca?*

---

# PARTE V · PROPIEDAD, DATOS Y CASOS ESPECIALES

## 17 · Cambio de proyecto

Sólo se autoriza por el Consejo Académico y únicamente si concurre una de estas
causas: el cliente identificado desaparece; el proyecto resulta ilegal en su
jurisdicción; o el análisis de la fase F1 demuestra que el problema no existe. La
autorización es **imposible después de la semana 16**: a partir de ahí, el proyecto
se reorienta dentro del mismo dominio, no se sustituye.

## 18 · Proyecto para un cliente real de terceros

Está permitido y es la mejor opción cuando existe. Requisitos adicionales:

- **Acuerdo escrito** entre estudiante y cliente sobre propiedad, alcance y datos.
- El cliente entiende que se trata de un proyecto formativo y que el Instituto no
  garantiza el resultado ni asume responsabilidad.
- El estudiante actúa como **responsable o encargado del tratamiento** de los datos
  de ese cliente y asume las obligaciones correspondientes (Carta, art. 61.4).
- Si el cliente exige confidencialidad, la memoria se anonimiza y la defensa se
  celebra a puerta cerrada, con acta reservada. La galería pública puede omitirlo.

## 19 · Proyecto sin ánimo de lucro

Admisible en el arquetipo 4 o 5. La sección 12 de la memoria sustituye el modelo de
ingresos por el **modelo de sostenibilidad**: quién paga la infraestructura, quién
la mantiene y qué ocurre si la persona fundadora se retira. Es una pregunta más
difícil que la del lucro, no más fácil.

## 20 · Propiedad intelectual

El código, el diseño, la marca y el modelo de negocio **pertenecen íntegramente al
estudiante** (Carta, art. 57). El Instituto:

- **No adquiere** derecho patrimonial alguno.
- Recibe una licencia **no exclusiva, gratuita y revocable** de exhibición con
  atribución (art. 58), revocable con efecto en 30 días.
- **No incorpora** código del estudiante a sus productos comerciales.
- **No entrega** al estudiante el kit `elysium-core/` ni ningún código propietario:
  el estudiante reconstruye la especificación funcional con su propio código
  (D2 §12).

## 21 · Continuidad tras la graduación

| Beneficio | Alcance |
|---|---|
| Alojamiento del proyecto | 12 meses cubiertos por el Instituto |
| Dominio propio | Coste del estudiante; el Instituto acompaña la configuración |
| Galería de la generación | Permanente, revocable |
| Migración a un plan comercial de Elysium λ | **Opcional, sin obligación y sin oferta anticipada** (Carta, art. 63 bis) |

> ### La salvaguarda más importante de todo el protocolo
>
> Un instituto que evalúa a quien al mismo tiempo intenta convertir en cliente tiene
> un conflicto de interés estructural. En un programa **gratuito** ese conflicto no
> desaparece: **se agrava**, porque si nadie paga la formación, la única vía de
> retorno imaginable es precisamente convertir a los estudiantes en clientes. Quien
> quiera sospechar de la buena fe del programa mirará exactamente aquí.
>
> Por eso el art. 63 bis de la Carta establece tres reglas duras, y este protocolo
> las repite:
>
> 1. **Ninguna oferta comercial** llega a un estudiante mientras conserve esa
>    condición. Ninguna, por ningún canal, ni siquiera informal.
> 2. La oferta al graduado sólo puede comunicarse **después** de emitido su
>    certificado.
> 3. **Nunca la presenta quien lo evaluó.**
>
> El Comité de Ética audita el cumplimiento cada generación y publica el resultado.
> El proyecto es del estudiante (art. 57) y su futuro comercial también: puede
> llevárselo a cualquier proveedor, a ninguno, o sostenerlo él mismo, que es
> precisamente lo que el programa le enseñó a hacer.

---

# ANEXOS

## Anexo I · Carta de Anteproyecto (plantilla · máx. 2 páginas)

```markdown
# Carta de Anteproyecto · TFG · Generación ____
**Estudiante:** ____ · **Fecha:** ____ · **Arquetipo:** __ de 5

## 1. El negocio
**Nombre provisional:**
**Qué vende o qué hace, en una frase:**
**Dónde opera (país, ciudad, ámbito):**

## 2. El cliente
**Quién es, con nombre y contexto:**
**Cómo resuelve hoy el problema:**
**Conversación mantenida:** ☐ Sí, el ___  ☐ No todavía
**Qué dijo, si la hubo:**

## 3. El problema
**Enunciado:**
**Qué le cuesta hoy** (tiempo, dinero, clientes perdidos, riesgo):
**Cómo lo sé:**

## 4. La propuesta de valor
**En una frase:**
**Lo que esta plataforma NO hará:**

## 5. Competencia
| Competidor | Qué hace bien | Qué hueco deja |
|---|---|---|

## 6. Funcionalidades previstas
| Prioridad | Funcionalidad | Fase estimada |
|---|---|---|
| Obligatoria | | |
| Deseable | | |
| Futura | | |

## 7. Datos que tratará
| Dato | ¿De quién? | ¿Categoría especial? | Base legal prevista |
|---|---|---|---|

*Si alguna fila dice «sí» en categoría especial, lea el §5 de este protocolo antes
de continuar.*

## 8. Riesgos que veo
1.
2.

**Firma:** ____
```

## Anexo II · Lista de comprobación previa a cada compuerta

```text
COMÚN A TODAS
□ Todo el trabajo está en el repositorio, con historial que refleja su construcción
□ `AI-USE.md` actualizado, con el apartado de rechazos relleno
□ `README.md` permite a un tercero ejecutar el proyecto sin preguntarme nada
□ Puedo explicar y modificar en vivo cualquier línea de lo entregado
□ Nada se llama «prueba», «demo» ni «temporal»
□ Sin `console.log` de depuración, sin código muerto, sin datos de ejemplo incrustados

DESDE H1
□ `axe` sin violaciones serias ni críticas
□ Recorrido completo por teclado
□ Contraste conforme en ambos temas
□ Lighthouse móvil ≥ 95 en rendimiento

DESDE H2
□ Batería de casos negativos en verde
□ Ningún secreto en el historial del repositorio
□ Compuerta de despliegue activa y demostrada
□ Pruebas propias de unidad y de extremo a extremo

DESDE H3
□ Expediente legal completo y coherente con lo que la plataforma hace
□ Carta de límites del agente publicada
□ Cobro en modo de prueba operativo, sin datos reales de tarjeta
□ Memoria completa con las 16 secciones
□ Sección 15 (limitaciones y deuda técnica) escrita con honestidad
```

## Anexo III · Acta de defensa

```markdown
# Acta de sustentación · TFG · Generación ____
**Estudiante:** ____ · **Proyecto:** ____ · **URL:** ____
**Fecha:** ____ · **Hora:** 15:00 UTC

## Panel
| Rol | Nombre | Procedencia | Abstención (art. 27) |
|---|---|---|:---:|
| Presidencia | | | ☐ |
| Vocalía técnica | | | ☐ |
| **Vocalía externa** | | **Externa al Instituto** | ☐ |

## Resultado por componente
| Componente | Peso | Nota |
|---|:---:|:---:|
| Producto | 35 % | |
| Memoria | 25 % | |
| Sustentación | 25 % | |
| Pitch | 15 % | |
| **Nota del hito H** | | |

## Defensa de autoría final (N0)
☐ Superada  ☐ Superada con reservas  ☐ No superada
**Bloque examinado:** ____ · **Modificación solicitada:** ____
**Observación:**

## Mención propuesta
☐ Ninguna ☐ Cum laude λ ☐ Accesibilidad ☐ Investigación

## Observaciones del panel

## Firmas
```

---

*Elysium λ Institute of Development & Research · D9 · «Abstrahere, aedificare, probare.»*
