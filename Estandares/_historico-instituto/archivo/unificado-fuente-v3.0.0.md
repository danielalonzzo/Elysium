# Nota de esta edición

<p class="doc-sub">Cómo leer este volumen y qué garantiza</p>

Este volumen reúne **íntegramente y sin resumir** el paquete fundacional del
Elysium λ Institute of Development & Research en su versión v3.0.0. No es una
síntesis: es la concatenación literal de los nueve documentos vigentes, del programa
que resuelve el horario, y del material archivado, con la única modificación de haber
bajado un nivel los encabezados internos de cada documento para que el índice general
de este volumen sea navegable.

**Qué contiene, en orden.**

| Bloque | Documento | Naturaleza |
|---|---|---|
| — | Presentación del paquete | Vista general |
| **D0** | Carta Constitutiva | **Norma superior.** Prevalece sobre todo lo demás |
| **D1** | Modelo Académico | Vinculante |
| **D2** | Plan de Estudios | Vinculante |
| **D3** | Reglamento de Evaluación | Vinculante |
| **D4** | Syllabus del Programa | Vinculante, congelado durante el cuatrimestre |
| **D7** | Estudio de Contexto, Horario y Operación | Operativo |
| **D8** | Protocolo de Investigación del Profesorado | Aprobado por el Comité de Ética |
| **D9** | Protocolo del Trabajo Final de Graduación | Vinculante |
| **Anexo A** | Modelo horario (`horario.py`) | Código reproducible |
| **Anexo B** | Material archivado | **Sin valor normativo** |

**Por qué no existen D5 ni D6.** El diseño original preveía tres syllabi, uno por
cuatrimestre, para un programa de 48 semanas. Al adoptarse el formato
uni-cuatrimestral de 16 semanas, los tres se fundieron en un único **D4** y los
originales pasaron al Anexo B. La numeración D5 y D6 queda vacante y no se reutiliza,
para que ninguna cita antigua apunte por error a un documento distinto del que
nombraba.

**Jerarquía.** En caso de contradicción entre documentos prevalece el de menor
número (Carta, art. 68). El Anexo B no forma parte de esa jerarquía y **no puede
citarse como norma**.

**Advertencia de naturaleza jurídica.** El Instituto no es, al momento de esta
edición, una institución de educación superior reconocida ni por Portugal ni por
Costa Rica, y **no expide títulos académicos oficiales**. Expide certificaciones
privadas de formación profesional. El art. 8 de la Carta detalla esta condición.



<div class="salto"></div>

# Presentación del paquete

<p class="doc-sub">Vista general, decisiones estructurales y calendario</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/README.md</code></p>

> *Abstrahere, aedificare, probare.* Abstraer, construir, demostrar.

**Qué es, en una frase.** Un programa de **extensión social gratuito** de cuatro
meses que enseña **programación, herramientas modernas de inteligencia artificial y
emprendimiento** a diez personas, para que salgan con la estructura base de su propio
emprendimiento digital funcionando.

**Qué forma.** No programadores. **Arquitectos de infraestructura digital asistida por
IA**: personas que saben lo suficiente de programación para leer, juzgar y corregir lo
que un agente les entrega; lo suficiente de datos para decidir la estructura; y lo
suficiente de negocio para lanzarlo. El código lo escribe en gran parte la máquina; la
arquitectura, el criterio y la responsabilidad son de la persona.

> **Cómo NO se nombra.** Nunca «curso de IA» (Carta, art. 18 bis). La IA es la
> herramienta, no el objeto. Y nunca «saldrás siendo desarrollador»: el D2 §3.3
> declara con precisión lo que el egresado no es.

---

### Los documentos

| Cód. | Documento | Qué responde | Fichero |
|:---:|---|---|---|
| **D0** | **Carta Constitutiva** | Qué es el Instituto, qué principios lo rigen, quién manda, qué derechos hay | [`ELYSIUM-INSTITUTE-CHARTER.md`](ELYSIUM-INSTITUTE-CHARTER.md) |
| **D1** | **Modelo Académico** | Por qué se enseña así, con su evidencia, y cómo se regula la IA | [`ELYSIUM-ACADEMIC-MODEL.md`](ELYSIUM-ACADEMIC-MODEL.md) |
| **D2** | **Plan de Estudios** | Qué se enseña: 32 resultados con su **nivel de logro declarado** | [`ELYSIUM-CURRICULUM.md`](ELYSIUM-CURRICULUM.md) |
| **D3** | **Reglamento de Evaluación** | Cómo se mide, con qué rúbricas y qué umbrales objetivos | [`ELYSIUM-ASSESSMENT.md`](ELYSIUM-ASSESSMENT.md) |
| **D4** | **Syllabus del Programa** | Las 16 semanas, minuto a minuto | [`ELYSIUM-SYLLABUS.md`](ELYSIUM-SYLLABUS.md) |
| **D7** | **Contexto, Horario y Operación** | A quién sirve, a qué hora, qué cuesta y quién lo paga | [`ELYSIUM-MARKET-STUDY.md`](ELYSIUM-MARKET-STUDY.md) |
| **D8** | **Investigación del Profesorado** | El estudio que conduce y firma la Dirección, con carga cero para el aula | [`ELYSIUM-RESEARCH-PROTOCOL.md`](ELYSIUM-RESEARCH-PROTOCOL.md) |
| **D9** | **Trabajo Final de Graduación** | De la idea de la semana 1 al emprendimiento de la semana 16 | [`ELYSIUM-TFG-PROTOCOL.md`](ELYSIUM-TFG-PROTOCOL.md) |
| — | Modelo horario | El programa que resuelve la franja óptima para el mundo hispano | [`horario.py`](horario.py) |
| — | **Archivo** | Material de la versión de 48 semanas, **sin valor normativo** | [`archivo/`](archivo/README.md) |

**Jerarquía.** En caso de contradicción prevalece el documento de menor número
(Carta, art. 68). [`ELYSIUM-STANDARDS.md`](../ELYSIUM-STANDARDS.md) y
[`ELYSIUM-PROTOTYPING.md`](../ELYSIUM-PROTOTYPING.md) son fuente técnica vinculante
para el contenido de la enseñanza y ceden ante la Carta en materia académica.

---

### El programa en una página

**16 semanas** · sábados y domingos, **15:00–17:00 UTC** · **una sola aula de 10 a 15
personas** · **gratuito en su totalidad** · sin experiencia previa exigida.

```text
        MÓDULO 0 · seis semanas antes · asíncrono, sin docente, sin nota (25 h)
        Lógica de programación · herramientas · primer HTML · idea de negocio
┌─────────────────────────────────────────────────────────────────────────────┐
│  NIVEL I · Semanas 1–5 · Fundamentos                           IA: N1 → N2  │
│  Web, semántica y accesibilidad · CSS y responsividad · JavaScript · DOM     │
│  Fundamentos teóricos de los modelos de lenguaje: tokens, contexto, sesgo    │
│  → Página propia accesible y desplegada                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  NIVEL II · Semanas 6–10 · Agentes y datos                          IA: N3  │
│  Dirección de agentes en el editor · depuración · asincronía y datos         │
│  Modelado documental (a N0) · operaciones · panel · reglas · despliegue      │
│  → Plataforma dinámica con datos, panel y compuerta de calidad              │
├─────────────────────────────────────────────────────────────────────────────┤
│  NIVEL III · Semanas 11–15 · Cierre y emprendimiento           IA: N3 → N4  │
│  S11 acceso y roles · S12 la transacción y el agente supervisado             │
│  S13 modelo de negocio · S14 marca, redes y captación · S15 legal y auditoría│
│  → Emprendimiento digital listo para lanzar                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  SEMANA 16 · Demo Day el sábado · sustentación técnica el domingo            │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Las cuatro horas y las otras cuatro.** El Instituto **imparte cuatro horas de
clase**. El estudiante **dedica otras cuatro por su cuenta**, y no son opcionales: sin
ellas no existe la Transferencia dominical, que es lo que convierte quince
laboratorios en un emprendimiento.

**Evaluación** · 40 % continua · 30 % proyecto · 30 % hito final y sustentación. Más
cuatro requisitos de tipo apto o no apto que no promedian: asistencia del 80 %,
Defensa Aleatoria de Autoría superada, Auditoría Técnica sin hallazgos críticos y
declaración de uso de IA completa.

---

### Las nueve decisiones que definen este Instituto

1. **Forma arquitectos, no programadores.** El perfil de egreso es especificar,
   dirigir, auditar y responder por un sistema construido con agentes (D2 §3). Es un
   perfil escaso en 2026 y distinto del de desarrollador.
2. **La Defensa Aleatoria de Autoría es el muro de carga.** Cuando la mayor parte del
   código lo escribe un agente, es el único mecanismo que separa a un arquitecto de
   alguien que no entiende su propio proyecto. Diez minutos, sin aviso, sin
   asistencia. **Si se relaja, el modelo entero se cae** (D1 §6.1 bis).
3. **La Escalera de IA no restringe: cualifica.** N1 y N2 en las cinco primeras
   semanas existen para habilitar el uso a fondo, no para impedirlo. El diseño del
   modelo de datos permanece siempre en **N0**.
4. **Es gratuito, y eso es su naturaleza, no un descuento.** Nadie paga nada (Carta,
   art. 2 bis). Se admiten donaciones bajo el régimen del art. 63 ter, que prohíbe
   expresamente las de estudiantes y candidatos.
5. **Diez personas, una sola aula, por decisión permanente** (Carta, art. 41). Todo lo
   anterior deja de funcionar a mayor escala.
6. **El horario es 15:00–17:00 UTC, anclado a UTC todo el año.** Resultado de un
   modelo de utilidad ponderada sobre catorce husos (D7, Parte IV).
7. **El año académico es el año natural.** Segundo sábado de enero a tercer sábado de
   diciembre. El Módulo 0 ocupa las seis semanas previas.
8. **El certificado distingue dominado de introducido** (D2 §5.9). 22 resultados se
   dominan y 10 sólo se introducen, y decirlo es una obligación del art. 9.
9. **La investigación la hace el profesorado, no los estudiantes.** Carga cero para el
   aula: veinte minutos en todo el programa (D8). Se promete **publicar el preprint** y
   **enviar** a revista, nunca que la acepten.

---

### Calendario

#### Generación Piloto · Λ00 · semanas 1 a 8

| Hito | Fecha |
|---|---|
| Arranque | sábado **12 de septiembre de 2026** |
| Cierre | domingo **1 de noviembre de 2026** |
| Corrección de materiales y convocatoria | noviembre y diciembre de 2026 |

Cinco o seis personas por invitación, sin certificado y sin investigación. **Todo 2026
se dedica a preparar el programa** (Carta, disp. trans. 3.ª).

#### Generación I · Λ01

| Hito | Fecha |
|---|---|
| Convocatoria abierta | septiembre de 2026 |
| Resolución motivada a todas las personas candidatas | noviembre de 2026 |
| **Módulo 0** | 28-XI-2026 → 8-I-2027 |
| **Arranque · Nivel I** | sábado **9 de enero de 2027** |
| Nivel II | 13 de febrero de 2027 |
| Receso de Semana Santa | 27 y 28 de marzo de 2027 |
| Nivel III | 20 de marzo de 2027 |
| **Demo Day y sustentación** | **1 y 2 de mayo de 2027** |

---

### Antes de abrir la convocatoria

```text
JURÍDICO Y REPUTACIONAL
□ Revisión legal del término «instituto» y del texto del certificado ← lo más urgente
□ Asesoría fiscal ANTES de abrir cualquier vía de donación (Carta, art. 63 ter)
□ Declaración del art. 8 visible en web, convocatoria y certificado
□ Ninguna pieza de difusión dice «curso de IA» ni promete empleo (arts. 18 y 18 bis)
□ Certificado que distingue resultados dominados de introducidos (D2 §5.9)

GOBIERNO Y CONFLICTO DE INTERÉS
□ Miembro externo del Comité de Ética, sin relación económica con la empresa
□ Auditor externo de defensas identificado y presupuestado
□ Protocolo del art. 63 bis operativo: ninguna oferta comercial a estudiantes en curso

ACADÉMICO
□ Módulo 0 construido y probado de principio a fin
□ Repositorio `elysium-lab` con los 15 laboratorios y su arnés de pruebas
□ Micro-guías MG01–MG15 escritas antes del arranque
□ Prueba de Disposición λ redactada y pilotada
□ Rúbrica de selección publicada ANTES de abrir la convocatoria
□ Preinscripción del protocolo de investigación (D8 §8), antes del primer dato

OPERATIVO
□ Coste de las 16 semanas provisionado íntegro antes de convocar
□ Umbral mínimo de apertura: 6 estudiantes, o se aplaza un año
□ Difusión dirigida a organizaciones de base, no sólo a comunidades de desarrollo
□ Devolución motivada al 100 % de las personas no admitidas
```

---

*Elysium λ Development & Research · Bragança, Portugal · San José, Costa Rica*
*[elysiumdr.eu](https://elysiumdr.eu)*




<div class="salto"></div>

# D0 · Carta Constitutiva

<p class="doc-sub">Norma superior del Instituto</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/ELYSIUM-INSTITUTE-CHARTER.md</code></p>

> **Cómo leer este documento.** Esta Carta es la norma superior del Instituto.
> Todo lo demás que el Instituto escriba (modelo académico, plan de estudios,
> reglamento de evaluación, syllabi, protocolos de investigación y de trabajo
> final) se subordina a ella y se interpreta conforme a ella. Está redactada en
> títulos y artículos para que pueda citarse con precisión: «Carta, art. 34».
>
> La Parte I declara qué es el Instituto y para qué existe. La Parte II fija sus
> principios rectores, que son la parte vinculante en caso de duda. La Parte III
> organiza su gobierno. La Parte IV regula a la comunidad académica. La Parte V
> establece el régimen académico. La Parte VI trata la integridad, la ciencia
> abierta y la protección de datos. Los anexos reúnen el juramento de ingreso,
> la jerarquía documental y el glosario.
>
> **Advertencia de naturaleza jurídica.** El Instituto **no es**, al momento de
> esta versión, una institución de educación superior reconocida ni por Portugal
> ni por Costa Rica, y **no expide títulos académicos oficiales**. Expide
> certificaciones privadas de formación profesional. El art. 8 detalla esta
> condición y la hoja de ruta hacia el reconocimiento formal. Ningún documento
> del Instituto puede afirmar lo contrario.

---

## PARTE I · NATURALEZA Y FINES

### Preámbulo

En 1785 Friedrich von Schiller escribió que todos los seres humanos se vuelven
hermanos allí donde se posa el ala suave de la alegría, y situó ese lugar en el
Elíseo. En 1824 Ludwig van Beethoven incorporó ese poema al cuarto movimiento de
su Novena Sinfonía. Esa música es hoy el himno oficial de la Unión Europea.

Elysium λ Development & Research nació para llevar infraestructura digital a las
pequeñas y medianas empresas que sostienen la economía europea y costarricense y
que, sin embargo, quedan fuera de la transformación tecnológica por barreras de
complejidad, coste y alfabetización digital.

Este Instituto nace de la constatación de que esa barrera no se derriba
únicamente construyendo software para las pymes: se derriba **formando a las
personas capaces de construirlo**, en su propia lengua, desde su propio país, sin
tener que emigrar ni endeudarse. Y se derriba con rigor científico, porque una
formación que no se mide, no se documenta y no se publica no es formación: es
promesa.

El símbolo λ es la undécima letra del alfabeto griego y la segunda de Ἠλύσιον.
Representa la abstracción de las ideas en sistemas ejecutables. Este Instituto
existe para enseñar esa abstracción, y para investigarla.

### Título I · Naturaleza, denominación y sede

**Art. 1 · Denominación.** Se constituye el **Elysium λ Institute of Development
& Research** (en adelante, «el Instituto»), unidad académica y de investigación
de Elysium λ Development & Research.

**Art. 2 · Naturaleza.** El Instituto es una **división académica y de
investigación** de la empresa fundadora, constituida como **programa de extensión
social sin ánimo de lucro**. No tiene personalidad jurídica separada mientras esta
Carta no sea reformada conforme al art. 66. Sus actos obligan a Elysium λ
Development & Research.

**Art. 2 bis · Gratuidad.** La formación que imparte el Instituto es **enteramente
gratuita para el estudiante**. No existe matrícula, mensualidad, cuota de examen,
coste de materiales ni pago de ninguna clase, en ningún momento y por ningún
concepto. El Instituto no vende formación: la dona. Esta disposición es de las
protegidas por el art. 66 y no puede reformarse durante una generación en curso.

**Art. 3 · Sede y ámbito.** Sede administrativa en Bragança, Portugal. Operación
en Costa Rica. Ámbito de enseñanza: **la totalidad del mundo hispanohablante**,
por vía telemática síncrona y asíncrona. La lengua vehicular de la docencia es el
**español**; la lengua de la producción científica es el **español y el inglés**;
la lengua del código, de sus identificadores y de sus comentarios es el **inglés**.

**Art. 4 · Misión.** Formar desarrolladores e investigadores capaces de concebir,
construir, auditar y sostener infraestructura digital accesible, transparente y
verificable, y hacerlo mediante un método reproducible, medido y publicado.

**Art. 5 · Visión.** Ser el instituto de referencia del mundo hispanohablante en
el estudio, desarrollo y aplicación de infraestructuras digitales, y contribuir
activamente a la construcción de una Unión Europea digital y de una Costa Rica
que avanza hacia la modernidad.

**Art. 6 · Objeto.** Son objeto del Instituto:

1. La **docencia** de la ingeniería de infraestructura digital, en programas
   estructurados por generaciones.
2. La **investigación** aplicada sobre accesibilidad, rendimiento, seguridad y
   adopción tecnológica en la pequeña y mediana empresa hispanohablante.
3. La **transferencia**: que cada persona formada termine el programa con una
   plataforma real, propia, publicada y operativa.
4. La **publicación abierta** de los resultados de su investigación y de sus
   propios indicadores de desempeño educativo.

**Art. 7 · Lema.** *Abstrahere, aedificare, probare.* Abstraer, construir,
demostrar. Ninguna afirmación del Instituto sobre lo que sus estudiantes saben
hacer se sostiene sin artefacto verificable que la demuestre.

**Art. 8 · Condición jurídica de las certificaciones.**

1. El Instituto expide **certificados privados de formación profesional**, no
   títulos académicos oficiales. Todo certificado, toda página web y todo
   material promocional deben decirlo de forma expresa y legible.
2. El Instituto **no está autorizado** a usar las denominaciones «universidad»,
   «licenciatura», «grado», «máster», «bachillerato» ni equivalentes, ni a
   otorgar ECTS. Cuando el paquete documental menciona ECTS, lo hace siempre como
   **equivalencia estimada de carga de trabajo** y nunca como crédito emitido.
3. Los certificados se emiten conforme al formato de microcredencial descrito en
   la Recomendación del Consejo de la Unión Europea de 16 de junio de 2022 sobre
   un enfoque europeo de las microcredenciales, con el fin de facilitar su
   reconocimiento futuro. Adoptar el formato no equivale a estar reconocido.
4. **Hoja de ruta de reconocimiento.** El Instituto se obliga a tramitar, en este
   orden: (a) certificación como entidade formadora ante la **DGERT** de Portugal;
   (b) inscripción de la oferta formativa en el Sistema Nacional de Qualificações
   cuando proceda; (c) convenios de reconocimiento con las instituciones
   asociadas. Mientras (a) no se obtenga, el art. 8.1 y 8.2 rigen sin excepción.
5. Las instituciones y entidades mencionadas como *certification authorities and
   institutional partners* en los materiales de la empresa **no avalan
   académicamente** este programa salvo convenio escrito y publicado. La
   Secretaría Académica mantiene el registro público de convenios vigentes.

---

## PARTE II · PRINCIPIOS RECTORES

> Estos diez principios son la parte vinculante de la Carta. Cuando una norma
> inferior, una decisión docente o una práctica operativa entren en conflicto con
> uno de ellos, prevalece el principio.

**Art. 9 · Principio de artefacto verificable.** El Instituto no evalúa
declaraciones, evalúa artefactos. Toda competencia se acredita mediante un objeto
inspeccionable por un tercero: código en un repositorio público, una auditoría
reproducible, un dato con procedencia, un despliegue accesible por URL. Lo que no
se puede inspeccionar, no se puede aprobar.

**Art. 10 · Principio de autoría demostrable.** La persona que entrega un
artefacto debe poder explicarlo, modificarlo en vivo y justificar cada decisión de
diseño. La incapacidad de hacerlo invalida la entrega con independencia de su
calidad técnica. Este principio es la única defensa real contra la delegación
opaca del pensamiento, sea a otra persona o a un modelo de lenguaje.

**Art. 11 · Principio de la inteligencia artificial como instrumento
subordinado.** La inteligencia artificial se enseña, se usa y se audita, pero
nunca sustituye la formación del criterio. El Instituto rechaza tanto la
prohibición ingenua como la delegación acrítica. Rige la **Escalera de Uso de IA**
(D1, §6): cada actividad declara su nivel permitido, y toda entrega declara el uso
realizado. Ocultar el uso de IA es falta grave; declararlo con precisión nunca lo es.

**Art. 12 · Principio de accesibilidad como requisito, no como mejora.** Ningún
artefacto se aprueba si excluye a una persona por su discapacidad. La
accesibilidad no es un tema de una semana ni un apartado de la rúbrica: es una
condición de admisibilidad de toda entrega, desde la primera. El Instituto aplica
este principio también a su propia docencia (art. 62).

**Art. 13 · Principio de realidad económica.** El proyecto de graduación no es un
ejercicio: es un negocio real, con un cliente real o plausible, un modelo de
ingresos declarado y cumplimiento legal efectivo. El Instituto forma personas que
producen infraestructura que alguien usa, no personas que entregan prácticas.

**Art. 14 · Principio de ciencia abierta.** Los datos, el código, los
instrumentos y los preprints producidos por el Instituto se publican con licencia
abierta y con identificador persistente, salvo que la protección de datos
personales o un compromiso contractual con un tercero lo impidan. La excepción se
motiva por escrito y se publica el motivo.

**Art. 15 · Principio de medición del propio desempeño.** El Instituto publica
semestralmente sus propios indicadores (matrícula, retención, graduación,
resultados de auditoría, empleabilidad) con la misma exigencia metodológica que
aplica a su investigación, siguiendo el espíritu de los estándares de reporte
transparente del sector. Un instituto que no publica sus tasas de abandono no
está en condiciones de exigir rigor a nadie.

**Art. 16 · Principio de gratuidad y de acción social.** El dinero no puede ser la
barrera que decida quién aprende. El Instituto imparte su formación **de forma
gratuita para todas las personas admitidas** (art. 2 bis), sin excepción y sin
tramos. La contrapartida no es económica: es el compromiso de asistencia, de
entrega y de honestidad que se firma en el Compromiso λ.

Este principio tiene dos consecuencias que el Instituto asume de forma expresa. La
primera es que **la plaza es escasa y su asignación debe ser justa**, y por eso el
proceso de admisión es público, reglado y motivado (art. 64). La segunda es que
**la gratuidad para el estudiante no significa que el programa no cueste**: cuesta
dinero y cuesta tiempo, ambos donados por Elysium λ Development & Research, y esa
donación se declara y se cuantifica públicamente cada año (D7, Parte V).

**Art. 17 · Principio de comunidad generacional.** Los estudiantes ingresan,
avanzan y se gradúan como **generación**, no como individuos aislados. La
generación es la unidad de identidad, de aprendizaje entre pares y de autoría
científica. Nadie se gradúa solo.

**Art. 18 · Principio de honestidad en la promesa.** El Instituto no promete
empleo, no promete salarios y no publica cifras de inserción que no pueda auditar.
Promete formación, artefactos y el acompañamiento para lanzar un emprendimiento
propio. Toda comunicación se somete a esta regla y la Dirección Académica tiene
derecho de veto sobre ella.

**Art. 18 bis · Regla de denominación.** El programa se describe siempre como lo que
es: **programación, herramientas modernas de inteligencia artificial y
emprendimiento**. Queda expresamente prohibido:

1. Anunciarlo como «curso de IA», «máster en IA», «formación en inteligencia
   artificial» o cualquier fórmula que sitúe la IA como objeto del curso en lugar de
   como herramienta de trabajo.
2. Insinuar que forma programadores profesionales contratables como tales, o que
   sustituye a un grado o a un ciclo formativo.
3. Prometer que el egresado «sabrá programar» sin la matización del D2 §3.3, o
   enumerar como aprendizaje lo que el D2 §5.9 clasifica como **introducido**.

El motivo no es de estilo. Un programa que se anuncia como curso de IA atrae a quien
busca una moda y decepciona a quien busca construir algo; y describir como dominio lo
que fue una introducción vulnera el art. 9. La denominación honesta es también un
filtro de selección.

---

## PARTE III · GOBIERNO

### Título II · Órganos

**Art. 19 · Enumeración.** Son órganos del Instituto:

| Órgano | Naturaleza | Composición mínima | Cadencia |
|---|---|---|---|
| **Consejo Académico** | Deliberante y normativo | 3 miembros | Trimestral |
| **Dirección Académica** | Ejecutiva | 1 persona | Permanente |
| **Comité de Ética e Integridad Científica (CEIC)** | Independiente | 3 miembros, 1 externo | A demanda + anual |
| **Comité de Auditoría Técnica (CAT)** | Técnico evaluador | 2 miembros + 1 externo por defensa | Por hito |
| **Secretaría Académica** | Registral | 1 persona | Permanente |
| **Consejo Consultivo Externo** | Asesor no vinculante | 3 a 7 miembros | Semestral |
| **Asamblea de Generación** | Representativo estudiantil | Toda la generación | Mensual |

**Art. 20 · Consejo Académico.** Aprueba y reforma el plan de estudios, los
syllabi y el reglamento de evaluación; resuelve en última instancia los recursos
académicos; aprueba la apertura de cada generación. Preside la Dirección
Académica con voto de calidad. Sesiona válidamente con dos tercios.

**Art. 21 · Dirección Académica.** Dirige la docencia, designa al profesorado,
responde por la calidad del programa y ejerce el veto del art. 18. Es incompatible
con la presidencia del CEIC.

**Art. 22 · Comité de Ética e Integridad Científica.** Dictamina sobre todo
protocolo de investigación que involucre personas o sus datos; resuelve
expedientes de integridad académica en segunda instancia; custodia el registro de
conflictos de interés. **Al menos un miembro debe ser externo a Elysium λ y sin
relación económica con la empresa.** Sus dictámenes son vinculantes y solo el
Consejo Académico puede devolverlos, motivadamente y una sola vez.

**Art. 23 · Comité de Auditoría Técnica.** Ejecuta la Auditoría Técnica Elysium
(D3, §11) sobre cada hito y sobre cada trabajo final. Al menos un auditor de cada
defensa de graduación debe ser **externo al Instituto**. Sus umbrales son
objetivos y públicos: no admiten valoración subjetiva.

**Art. 24 · Secretaría Académica.** Custodia expedientes, actas, calificaciones y
certificados; mantiene el registro público de convenios (art. 8.5) y el registro
de generaciones; garantiza los derechos de acceso, rectificación y supresión de
datos (art. 60).

**Art. 25 · Asamblea de Generación.** Elige dos delegados por generación con voz
en el Consejo Académico. Puede solicitar por mayoría simple la revisión de una
decisión docente colectiva. Su convocatoria es obligatoria una vez al mes.

**Art. 26 · Regla de degradación honesta.** Mientras el Instituto no cuente con
personas suficientes para integrar todos los órganos, las funciones se acumulan
en la Dirección Académica **con dos excepciones inderogables**: el miembro externo
del CEIC (art. 22) y el auditor externo de la defensa final (art. 23). Estas dos
figuras deben existir desde la primera generación. La acumulación de funciones se
declara públicamente en la ficha de cada generación.

**Art. 27 · Conflictos de interés.** Quien tenga interés económico, familiar o
contractual en un proyecto de estudiante se abstiene de evaluarlo. La abstención
se registra en acta. El Instituto publica anualmente el registro de abstenciones.

---

## PARTE IV · COMUNIDAD ACADÉMICA

### Título III · Estudiantes

**Art. 28 · Condición de estudiante.** Se adquiere con la matrícula formalizada y
la firma del **Compromiso λ** (Anexo A). Se conserva mientras se mantenga la
matrícula al día y no se incurra en causal de pérdida (art. 33).

**Art. 29 · Requisitos de admisión.**

1. Edad mínima **16 años cumplidos** al inicio de la generación. Entre 16 y 18
   se exige autorización escrita de quien ejerza la responsabilidad parental,
   conforme al art. 8 del Reglamento (UE) 2016/679.
2. Dominio del español a nivel **B2** o superior, autodeclarado y verificado en
   la entrevista de admisión.
3. Acceso propio y estable a un ordenador (no tableta ni teléfono como único
   dispositivo) y a conexión a internet capaz de sostener videoconferencia.
4. Superación de la **Prueba de Disposición λ**: no evalúa conocimientos previos
   de programación, sino razonamiento lógico, comprensión lectora técnica y
   compromiso horario declarado.
5. **No se exige experiencia previa en programación.** Exigirla contradiría el
   art. 16.

**Art. 30 · Derechos del estudiante.** Son derechos irrenunciables:

- Recibir la docencia síncrona comprometida y su grabación accesible.
- Ser evaluado con criterios públicos, anteriores a la entrega y no retroactivos.
- Recibir retroalimentación escrita sobre toda entrega calificada, en un plazo
  máximo de **siete días naturales**.
- Recurrir toda calificación (art. 46) y todo expediente disciplinario.
- Conservar la **propiedad intelectual íntegra** de su trabajo final (art. 57).
- Acceder, rectificar y suprimir sus datos personales (art. 60).
- Recibir ajustes razonables por discapacidad, sin coste y sin que consten en el
  certificado (art. 62).
- Ser tratado con respeto y estudiar en un entorno libre de acoso (art. 32).
- Participar, **si lo desea y sólo si lo desea**, en la investigación del Instituto,
  y retirar ese consentimiento en cualquier momento sin consecuencia académica
  alguna (D8 §6).

**Art. 31 · Deberes del estudiante.** Son deberes exigibles:

- Asistir al **80 % mínimo** de las sesiones síncronas de cada cuatrimestre,
  computado conforme al art. 44.
- Entregar dentro de plazo y declarar con veracidad el uso de IA (art. 11).
- Someterse a la Defensa Aleatoria de Autoría cuando sea convocado (D3, §10).
- Mantener público y actualizado su repositorio de proyecto.
- Respetar la confidencialidad de los datos de terceros que su proyecto trate.
- Participar en la Asamblea de Generación. **La investigación del Instituto no es
  un deber**: es voluntaria y revocable (art. 49 bis).

**Art. 32 · Convivencia.** Queda prohibido en todo canal del Instituto el acoso,
la discriminación por cualquier causa, la difusión de trabajo ajeno como propio y
la publicación de datos personales de terceros sin base legal. La Dirección
Académica puede suspender cautelarmente el acceso a los canales mientras instruye.

**Art. 33 · Pérdida de la condición de estudiante.** Por renuncia escrita; por
incumplimiento del mínimo de asistencia sin causa justificada tras haberse agotado
el protocolo de riesgo de abandono (D1 §8.1); o por sanción firme de expulsión
(art. 55). **No existe causal económica de pérdida de la condición de estudiante**,
porque no existe obligación de pago.

### Título IV · Profesorado e investigadores

**Art. 34 · Perfil del profesorado.** Ejerce la docencia quien acredite
simultáneamente: (a) práctica profesional vigente en producción, no únicamente
académica; (b) capacidad demostrada de explicar en público; (c) adhesión escrita
a esta Carta. La práctica vigente es requisito: el Instituto no admite docencia
desconectada del ejercicio real.

**Art. 35 · Deberes del profesorado.** Publicar el syllabus antes del inicio;
respetar la estructura Antes/Durante/Después (D1, §4); devolver retroalimentación
en siete días; grabar y publicar toda sesión síncrona; declarar su propio uso de
IA en los materiales que produce; y abstenerse conforme al art. 27.

**Art. 36 · Evaluación del profesorado.** Cada cuatrimestre se aplica el
instrumento de percepción estudiantil (D1, §9) y una observación de aula por par.
Los resultados agregados se publican. Los individuales son confidenciales salvo
consentimiento.

**Art. 37 · Investigadores asociados.** El Consejo Académico puede nombrar
investigadores asociados, con o sin docencia, para líneas concretas. Su
vinculación, su remuneración y sus conflictos de interés se publican.

---

## PARTE V · RÉGIMEN ACADÉMICO

### Título V · Estructura de la formación

**Art. 38 · Programa fundacional.** El Instituto ofrece el programa
**Ingeniería de Infraestructura Digital Asistida por IA**, de **16 semanas
lectivas** organizadas en **tres niveles de cinco semanas** más una semana final de
Demo Day y sustentación, precedidas de un **Módulo 0** preparatorio asíncrono.

**Art. 38 bis · El Módulo 0.** Las seis semanas anteriores al arranque se dedican a
un módulo preparatorio **gratuito, asíncrono, autodirigido, sin docente y sin
calificación**, de unas 25 horas, que cubre lógica de programación, herramientas y
primer documento web. No es requisito de admisión ni filtro encubierto: es la
condición que hace posible impartir el programa en dieciséis semanas sin exigir
experiencia previa (art. 29.5). Quien no lo complete conserva su plaza y elige entre
aplazarse a la generación siguiente o entrar asumiendo por escrito la desventaja.

**Art. 39 · Régimen horario.** Docencia síncrona **sábado y domingo, dos horas cada
día**, en el horario fijado por el D7, §§ 12 a 14: **15:00–17:00 UTC**, anclado a
UTC todo el año. Cada sesión síncrona va precedida y seguida de trabajo asíncrono
según el D1, §4.

**Art. 40 · Carga de trabajo.** La carga nominal es de **8 horas semanales** por
estudiante, de las cuales **4 son de clase impartida** y **4 de estudio autónomo
obligatorio**. Total del programa: **128 horas lectivas**, más unas 25 horas del
Módulo 0 y unas 20 horas de memoria y preparación de la defensa. **Carga total
aproximada: 173 horas.** Equivalencia estimada de carga: **6 a 7 ECTS**, en el
sentido del art. 8.2.

**Art. 41 · Generación.** Cada cohorte recibe un ordinal romano y un código
(Generación I · Λ01). El Instituto opera **una sola aula λ por generación**, de
**quince estudiantes como máximo y diez como número ideal**.

El límite no es una restricción de capacidad transitoria: es una **decisión de
diseño permanente**. Los tres mecanismos que definen al Instituto (la Defensa
Aleatoria de Autoría, la tutoría individual ligada a cada compuerta y la
retroalimentación escrita en siete días con acción concreta) sólo son sostenibles
con una decena de personas por docente. Un aula de treinta obligaría a diluirlos, y
diluirlos equivale a suprimirlos. Por la misma razón, **el Instituto no abre aulas
paralelas para atender más demanda**: crecer en número no es un objetivo declarado
del programa.

**Art. 42 · Progresión.** El programa es una **unidad indivisible de dieciséis
semanas**. No existen matrículas parciales, ni asignaturas sueltas, ni certificación
por niveles: los tres niveles son la estructura interna de un único cuatrimestre.
Quien abandone antes de la semana 16 puede solicitar una **constancia de
participación** que declara las semanas cursadas y **ningún resultado de aprendizaje
acreditado** (art. 48).

**Art. 43 · Repetición.** Quien no aprueba el programa puede cursarlo una sola vez
más, incorporándose a la generación siguiente y conservando sus artefactos
aprobados. La segunda no aprobación cierra el itinerario.

**Art. 44 · Asistencia y asistencia diferida.**

1. La asistencia síncrona mínima es del **80 %** por cuatrimestre.
2. Se admite **asistencia diferida** hasta un **25 %** de las sesiones: visionado
   íntegro de la grabación más entrega del *parte de sesión diferida* en un plazo
   de 72 horas. La asistencia diferida computa como asistencia.
3. La asistencia diferida no está disponible para las sesiones de defensa, de
   Demo Day ni para aquellas que el syllabus marque como **presencia obligatoria**.
4. El art. 44.2 existe para no penalizar estructuralmente a las zonas horarias
   donde la sesión coincide con la comida principal (D7, §15).

**Art. 45 · Calificación.** Escala **0 a 100**. Nota mínima de aprobación: **70**.
La conversión a otras escalas figura en el D3, §3.

**Art. 46 · Revisión y recurso.** El estudiante puede pedir revisión razonada en
los 5 días siguientes a la publicación de la nota; el docente responde por escrito
en 5 días; si persiste el desacuerdo, resuelve el Consejo Académico en 15 días.
La resolución del Consejo agota la vía interna.

**Art. 47 · Certificación.** Quien completa las 16 semanas, aprueba el programa,
supera la Auditoría Técnica final y sostiene su defensa recibe el **Certificado de
Desarrollador de Infraestructura Digital Elysium λ**, que consigna: identidad,
carga horaria, método de evaluación, URL del proyecto final, la mención expresa del
art. 8.1, y **los resultados de aprendizaje distinguidos entre los alcanzados a
nivel de dominio y los meramente introducidos**, conforme a la clasificación del
D2 §5.9. Certificar como dominado lo que sólo se introdujo vulneraría el art. 9.

**Art. 48 · Constancia de participación.** Quien no completa el programa puede
solicitar una **constancia de participación** que declara las semanas cursadas y hace
constar de forma expresa que **no acredita resultado de aprendizaje alguno**. No es
una microcredencial y no puede presentarse como tal. No se emite certificado alguno
sin evaluación superada.

### Título VI · Investigación y trabajo final

**Art. 49 · Investigación del Instituto.** El Instituto mantiene una línea de
investigación propia sobre la enseñanza de la programación asistida por inteligencia
artificial, **conducida y firmada por el profesorado**. Se rige por el **D8 ·
Protocolo de Investigación del Profesorado**.

**Art. 49 bis · Los estudiantes no cargan con la investigación.** El plan de
estudios **no contiene ninguna actividad de investigación evaluable**. La
participación en el estudio es voluntaria, revocable, anónima, no afecta a ninguna
calificación y no puede exigir al estudiante más de **veinte minutos** en todo el
programa (D8 §1). Los estudiantes **no figuran como autores**, por ser sujetos del
estudio, y se les reconoce de forma colectiva en los agradecimientos.

Esta disposición deroga el régimen de coautoría generacional de la versión anterior
de esta Carta, que era viable en un programa de 48 semanas y dejó de serlo al pasar
a 16.

**Art. 50 · Trabajo Final de Graduación.** Cada estudiante desarrolla, desde la
semana 1 y hasta la 16, **una plataforma digital propia y real** con su memoria
técnica y su defensa. Se rige por el **D9 · Protocolo del Trabajo Final de
Graduación**.

**Art. 51 · Naturaleza del trabajo final.** El TFG es individual y evalúa competencia
de ingeniería. Es el único trabajo de titulación del programa.

---

## PARTE VI · INTEGRIDAD, CIENCIA ABIERTA Y DATOS

### Título VII · Integridad académica

**Art. 52 · Definición de falta.** Constituyen falta de integridad académica:

| Código | Falta | Gravedad |
|---|---|---|
| **I-01** | Presentar como propio código, texto o datos ajenos sin atribución | Grave |
| **I-02** | Ocultar o falsear la declaración de uso de IA | Grave |
| **I-03** | Usar IA en una actividad declarada de nivel N0 | Grave |
| **I-04** | Suplantación de identidad en sesión, entrega o defensa | Muy grave |
| **I-05** | Fabricación o manipulación de datos de investigación | Muy grave |
| **I-06** | Falsear la asistencia o el parte de sesión diferida | Leve |
| **I-07** | Publicar datos personales de terceros sin base legal | Grave |
| **I-08** | Reutilizar trabajo propio de otra evaluación sin declararlo | Leve |
| **I-09** | Impedir o entorpecer la Defensa Aleatoria de Autoría | Grave |

**Art. 53 · La declaración de uso de IA.** Toda entrega incorpora el fichero
`AI-USE.md` según la plantilla del D3, Anexo II. La declaración veraz de un uso
intensivo **nunca** es sancionable si el nivel estaba permitido. La omisión sí lo
es. El Instituto prefiere el uso declarado al uso oculto, y lo dice sin ambigüedad.

**Art. 54 · Procedimiento.** Instruye la Dirección Académica; resuelve en primera
instancia; el CEIC resuelve el recurso. Se garantiza audiencia previa, acceso al
expediente y motivación escrita. La carga de la prueba corresponde al Instituto,
salvo en I-02 e I-09, donde la Defensa de Autoría es prueba suficiente.

**Art. 55 · Sanciones.**

| Gravedad | Sanción |
|---|---|
| **Leve** | Amonestación escrita; repetición de la entrega con techo de 70 |
| **Grave** | Calificación 0 en la actividad; anotación en expediente; convocatoria inmediata a Defensa Aleatoria de Autoría sobre el resto de las entregas |
| **Muy grave** | Expulsión del programa, pérdida de la plaza, que se declara vacante, y revocación de los certificados ya emitidos |

**Art. 56 · Revocación de certificados.** El Consejo Académico puede revocar un
certificado emitido si se acredita falta muy grave anterior a su emisión. La
revocación se comunica al titular y se anota en el registro público de
certificados revocados, sin exponer datos personales innecesarios.

### Título VIII · Ciencia abierta y propiedad intelectual

**Art. 57 · Propiedad del trabajo del estudiante.** El código, el diseño, la marca
y el modelo de negocio del Trabajo Final de Graduación **pertenecen íntegramente
al estudiante**. El Instituto no adquiere derecho patrimonial alguno sobre ellos.

**Art. 58 · Licencia de exhibición.** El estudiante concede al Instituto una
licencia **no exclusiva, gratuita y revocable** para mostrar su proyecto con fines
académicos y de difusión, con atribución. La revocación surte efecto en 30 días.

**Art. 59 · Producción científica.** Los datos anonimizados, los instrumentos y el
código de la investigación del Instituto se publican bajo licencia abierta con
identificador persistente. La autoría se rige por el D8, §9. El Instituto no reclama autoría corporativa: los
autores son las personas.

### Título IX · Protección de datos personales

**Art. 60 · Régimen aplicable.** El tratamiento de datos personales se rige por el
Reglamento (UE) 2016/679 (RGPD), por la Lei n.º 58/2019 de Portugal y, para
titulares en Costa Rica, por la Ley n.º 8968 de Protección de la Persona frente al
Tratamiento de sus Datos Personales. El responsable del tratamiento es Elysium λ
Development & Research.

**Art. 61 · Reglas específicas del entorno educativo.**

1. Las grabaciones de sesión se conservan **24 meses** y luego se suprimen.
2. La cámara **nunca es obligatoria**, salvo en defensas y evaluaciones de
   autoría, donde sí lo es y así se advierte con antelación.
3. El Instituto **no realiza proctoring biométrico ni vigilancia algorítmica**.
   La integridad se asegura por defensa oral, no por vigilancia.
4. Los datos que el proyecto de un estudiante trate sobre terceros son
   responsabilidad del estudiante, que actúa como responsable independiente. El
   D9, §8 fija sus obligaciones mínimas.
5. Ningún dato personal de estudiantes se incorpora a la investigación del Instituto
   sin consentimiento explícito, separado y revocable, y el análisis no se ejecuta
   hasta que los certificados están emitidos (D8 §5).

### Título X · Accesibilidad, inclusión y sostenibilidad

**Art. 62 · Accesibilidad de la propia docencia.** El Instituto aplica a sus
materiales y plataformas el mismo estándar que exige: **WCAG 2.2 nivel AA** como
mínimo, en coherencia con la norma EN 301 549 y con la Directiva (UE) 2019/882,
aplicable desde el 28 de junio de 2025. Toda sesión se publica con subtítulos en
español. Todo material escrito se entrega en formato legible por lector de
pantalla. Los ajustes razonables se conceden en 10 días hábiles y no constan en el
certificado.

**Art. 63 · Financiación del programa.** El programa se financia **íntegramente con
recursos de Elysium λ Development & Research**, procedentes de su actividad
comercial de consultoría e infraestructura digital. El Instituto:

1. **No cobra** al estudiante por ningún concepto (art. 2 bis).
2. **No condiciona** ninguna plaza, calificación ni certificado a la contratación
   de servicios de la empresa, ni por el estudiante ni por terceros vinculados a él.
3. **Puede aceptar donaciones y patrocinio**, con las condiciones del art. 63 ter.
4. **Publica cada año el coste real del programa**, en dinero y en horas donadas,
   junto con los indicadores del art. 15, y **el origen y el importe de toda
   donación recibida**.

**Art. 63 ter · Régimen de donaciones.** El Instituto puede recibir donaciones para
sostener el programa, bajo seis condiciones que no admiten excepción:

1. **Ninguna donación otorga plaza, influencia ni trato alguno.** No existe cupo de
   donante, ni recomendación de donante, ni prioridad de ningún tipo.
2. **No se aceptan donaciones de estudiantes en curso, ni de sus familias, ni de
   personas candidatas durante la convocatoria.** Aceptarlas convertiría la
   gratuidad en una ficción y abriría la puerta a que alguien creyera que pagar
   ayuda. La prohibición se mantiene hasta la emisión del certificado.
3. **No se aceptan donaciones condicionadas** al contenido del currículo, a la
   selección de estudiantes, a la línea de investigación ni a la mención de marca
   dentro de la docencia.
4. **Todo donante y todo importe se publican** en el informe anual, salvo que la
   persona donante pida anonimato, en cuyo caso se publica el importe y la categoría
   pero no el nombre.
5. **El Comité de Ética audita** el cumplimiento de este artículo cada generación.
6. **Las donaciones no alteran la gratuidad ni la crean.** El art. 2 bis rige aunque
   no se reciba ni un euro: si las donaciones desaparecen, el programa sigue siendo
   gratuito o no se imparte.

> **Advertencia práctica.** Una sociedad mercantil que recibe donaciones para una
> actividad gratuita tiene un tratamiento fiscal y contable propio en Portugal, y
> puede aconsejar constituir una figura separada sin ánimo de lucro. Es una decisión
> que exige asesoría antes de abrir cualquier vía de donación, y este artículo no la
> sustituye.

**Art. 63 bis · Separación entre docencia y actividad comercial.** Ninguna oferta
comercial de Elysium λ Development & Research puede dirigirse a un estudiante
mientras conserve esa condición. La oferta al graduado sólo puede comunicarse
**después** de emitido su certificado, y nunca puede presentarla quien lo evaluó.
El Comité de Ética audita el cumplimiento de este artículo cada generación.

> El motivo de este artículo es que la gratuidad, lejos de eliminar el conflicto de
> interés, lo concentra: si nadie paga por la formación, la única vía de retorno
> imaginable es convertir a los estudiantes en clientes. Reconocerlo y prohibirlo de
> forma expresa es la única manera de que la acción social lo sea de verdad.

**Art. 64 · Selección de las plazas.** Al ser gratuitas y escasas, las plazas se
adjudican mediante un proceso **público, reglado y motivado**, que se publica antes
de abrir la convocatoria y no se altera durante ella. Rigen estas reglas:

1. Se evalúa con una **rúbrica publicada** cuyos criterios son: disposición
   demostrada en la Prueba de Disposición λ, viabilidad horaria real, claridad del
   proyecto que se quiere construir, y **situación de acceso**, entendida como la
   distancia que separa a la persona de una oportunidad equivalente por otra vía.
2. **No se puntúa el conocimiento previo de programación.** Puntuarlo convertiría el
   programa en un premio a quien ya tuvo oportunidades.
3. Toda persona no admitida recibe **la razón concreta** de su no admisión y una
   indicación de qué la haría admisible en la convocatoria siguiente.
4. Las decisiones de admisión y sus motivaciones se archivan y quedan a disposición
   del Comité de Ética.
5. Quien tenga relación personal, familiar o comercial con una persona candidata se
   abstiene de valorarla y la abstención consta en acta (art. 27).

**Art. 65 · Retirada del programa.** La persona estudiante puede retirarse en
cualquier momento, sin causa, sin plazo y **sin consecuencia económica alguna**,
porque no existe pago que reembolsar. Se le pide únicamente que lo comunique por
escrito, para que su plaza pueda reasignarse y para que el Instituto pueda medir con
honestidad su propia tasa de abandono (art. 15). La retirada comunicada nunca
consta como demérito en ningún documento; el abandono silencioso, en cambio, impide
al Instituto aprender de él y por eso se desaconseja de forma expresa.

---

## PARTE VII · REFORMA Y DISPOSICIONES

**Art. 66 · Reforma.** Esta Carta se reforma por acuerdo de dos tercios del
Consejo Académico, previo informe del CEIC y audiencia de la Asamblea de
Generación. Los artículos 9 a 18 (principios rectores) y el art. 57 (propiedad del
estudiante) requieren **unanimidad** del Consejo y no pueden reformarse durante
una generación en curso.

**Art. 67 · Versionado.** La Carta sigue el sistema de versionado Elysium
(`ELYSIUM-STANDARDS.md`, §7). Toda reforma incrementa la versión menor; toda
reforma de los artículos protegidos incrementa la mayor.

**Art. 68 · Jerarquía documental.** En caso de contradicción prevalece el
documento de menor número: D0 sobre D1, D1 sobre D2, y así sucesivamente. Los
documentos técnicos de la empresa (`ELYSIUM-STANDARDS.md`,
`ELYSIUM-PROTOTYPING.md`) son **fuente técnica vinculante** para el contenido de
la enseñanza, y ceden ante esta Carta solo en materia académica.

**Disposición transitoria primera.** Hasta la constitución efectiva del Consejo
Académico con tres miembros, sus competencias las ejerce la Dirección Académica,
con excepción de la reforma de esta Carta, que queda suspendida.

**Disposición transitoria segunda · Regla del calendario.** El programa **inicia
siempre el segundo sábado de enero** y cierra dieciséis semanas después, con un único
receso en Semana Santa. El Módulo 0 ocupa las seis semanas anteriores al arranque y
la convocatoria se abre en septiembre del año previo (D4 §8).

El Consejo Académico podrá abrir una **segunda generación anual** de septiembre a
diciembre cuando la carga docente lo permita y sin que ello altere el límite de una
sola aula simultánea del art. 41.

**Disposición transitoria tercera · Generación Piloto (Λ00).** Antes de la
Generación I se celebra una **generación piloto** que inicia el **sábado 12 de
septiembre de 2026** y termina el **domingo 1 de noviembre de 2026**, con estas
condiciones, de aplicación exclusiva a ella:

1. Comprende **las ocho primeras semanas** del programa, es decir el Nivel I completo
   y las tres primeras semanas del Nivel II, que concentran el mayor riesgo de
   material.
2. Admite **cinco o seis personas** por invitación directa.
3. **No expide certificado ni constancia acreditativa**, y así se comunica por escrito
   antes de la aceptación de la plaza.
4. **No participa en la investigación** del D8.
5. Su finalidad declarada es **someter a prueba el modelo académico y sus
   materiales**, no formar. Sus participantes son colaboradores del diseño y así se
   les reconoce en los agradecimientos del paquete documental.
6. Quien la complete tiene **derecho preferente** a plaza en la Generación I y se le
   ofrece actuar como **tutor par**.
7. Los dos meses que median entre su cierre y el arranque de la Generación I están
   reservados a corregir el material con sus hallazgos.

**Disposición transitoria cuarta.** La Generación I (Λ01) cursa el Módulo 0 del **28
de noviembre de 2026 al 8 de enero de 2027**, inicia el **sábado 9 de enero de 2027**
y celebra su Demo Day el **sábado 1 de mayo de 2027**. El año 2026 se dedica
íntegramente a la preparación del programa y a la generación piloto.

**Disposición final.** Esta Carta entra en vigor el día de su publicación en el
repositorio documental del Instituto y su firma por la Dirección Académica.

---

## ANEXOS

### Anexo A · Compromiso λ

> Yo, ____________________, al incorporarme a la Generación ____ del Elysium λ
> Institute of Development & Research, me comprometo:
>
> A **construir lo que digo que construí**, y a poder explicarlo línea por línea.
> A **declarar con exactitud** toda ayuda que reciba, de una persona o de una máquina.
> A **no excluir a nadie** con lo que programe, y a comprobarlo, no a suponerlo.
> A **sostener a mi generación**, porque nadie se gradúa solo.
> A **decir la verdad sobre mis datos**, aunque contradigan lo que esperaba.
> A **entregar a tiempo o avisar a tiempo**.
>
> Entiendo que el Instituto puede pedirme, en cualquier momento y sin aviso, que
> explique mi propio trabajo, y que no poder hacerlo anula ese trabajo.
>
> Firma: ____________________  Fecha: ____________

### Anexo B · Jerarquía del paquete fundacional

| Código | Documento | Fichero | Aprueba | Reforma |
|---|---|---|---|---|
| **D0** | Carta Constitutiva | `ELYSIUM-INSTITUTE-CHARTER.md` | Consejo Académico | 2/3 (unanimidad arts. 9–18, 57) |
| **D1** | Modelo Académico | `ELYSIUM-ACADEMIC-MODEL.md` | Consejo Académico | Mayoría simple |
| **D2** | Plan de Estudios | `ELYSIUM-CURRICULUM.md` | Consejo Académico | Mayoría simple |
| **D3** | Reglamento de Evaluación | `ELYSIUM-ASSESSMENT.md` | Consejo Académico | Mayoría simple |
| **D4** | Syllabus del Programa | `ELYSIUM-SYLLABUS.md` | Dirección Académica | Dirección, con aviso |
| **D7** | Estudio de Mercado y Operación | `ELYSIUM-MARKET-STUDY.md` | Dirección Académica | Dirección |
| **D8** | Protocolo de Investigación del Profesorado | `ELYSIUM-RESEARCH-PROTOCOL.md` | CEIC | CEIC |
| **D9** | Protocolo del Trabajo Final de Graduación | `ELYSIUM-TFG-PROTOCOL.md` | Consejo Académico | Mayoría simple |

**Regla de congelación.** El D4 **no se modifica durante el cuatrimestre en curso**
salvo corrección de errores materiales, que se anota en el registro de erratas al pie
del syllabus.

**Material archivado.** La carpeta `archivo/` conserva los tres syllabi de la versión
de 48 semanas y el protocolo de investigación generacional derogado. **No tienen
valor normativo** y no forman parte de esta jerarquía.

### Anexo C · Glosario

**Aula λ** · Grupo síncrono único de la generación, de hasta 15 estudiantes y
10 como número ideal (art. 41).
**Artefacto** · Objeto inspeccionable que acredita una competencia.
**Auditoría Técnica Elysium (ATE)** · Batería de comprobaciones objetivas y
umbrales públicos aplicada a cada hito (D3, §11).
**Ciclo λ** · La estructura Antes / Durante / Después de cada sesión (D1, §4).
**Compuerta (gate)** · Punto del programa que no se atraviesa sin aprobación
explícita del hito anterior.
**Defensa Aleatoria de Autoría (DAA)** · Comparecencia oral de 10 minutos, sin
aviso previo, para explicar y modificar el propio código (D3, §10).
**Escalera de IA** · Los cinco niveles N0 a N4 de uso permitido (D1, §6).
**Generación** · Cohorte completa que ingresa y se gradúa junta (art. 17).
**Módulo 0** · Preparación asíncrona, gratuita y sin nota de las seis semanas
anteriores al arranque (art. 38 bis).
**Nivel** · Cada uno de los tres bloques de cinco semanas del programa. **No es
certificable por separado** (art. 42).
**Microcredencial** · Certificado de resultados de aprendizaje en el formato de la
Recomendación del Consejo de la UE de 16-VI-2022.
**Dominado / Introducido** · Distinción obligatoria en el certificado entre lo que
el estudiante demostró con artefacto y defendió, y lo que sólo practicó una vez
(D2 §5.9).
**Transferencia** · Trabajo asíncrono dominical en que lo aprendido en el
laboratorio se aplica al proyecto propio.

---

*Elysium λ Institute of Development & Research · Bragança, Portugal · San José,
Costa Rica · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# D1 · Modelo Académico

<p class="doc-sub">Por qué se enseña así, y con qué evidencia</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/ELYSIUM-ACADEMIC-MODEL.md</code></p>

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

## PARTE I · FUNDAMENTACIÓN CIENTÍFICA

### 1 · El problema que este modelo intenta resolver

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

### 2 · Los once mecanismos y sus decisiones de diseño

Cada fila declara el mecanismo, la evidencia principal que lo respalda, la
decisión de diseño que el Instituto adopta en consecuencia y el lugar del
programa donde esa decisión se observa. Las decisiones son verificables: si una
no se cumple en el syllabus, el syllabus está mal.

#### 2.1 · Aula invertida sin recorte de tiempo síncrono

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

#### 2.2 · Práctica de recuperación y espaciamiento

| | |
|---|---|
| **Mecanismo** | Recuperar información de la memoria consolida más que releerla; distribuir la práctica en el tiempo consolida más que concentrarla. |
| **Evidencia** | Roediger y Karpicke (2006) sobre el efecto de examen; Dunlosky, Rawson, Marsh, Nathan y Willingham (2013, *Psychological Science in the Public Interest* 14-1) clasifican **práctica de recuperación** y **práctica distribuida** como las dos únicas técnicas de **utilidad alta** entre diez evaluadas. Subrayar y releer quedan en utilidad baja. |
| **Decisión λ** | (a) Quiz de recuperación al cierre de cada sábado, no de opción única sino de **producción** (escribir la línea, predecir la salida, corregir el error). (b) Cada quiz incluye **tres ítems de semanas anteriores** con espaciamiento creciente (1, 3 y 6 semanas atrás). (c) Ninguna sesión repasa: recupera. |
| **Dónde se ve** | D3 §5 (diseño de quices), D4 (campo *espaciado* de cada quiz). |

#### 2.3 · Carga cognitiva y ejemplos resueltos con desvanecimiento

| | |
|---|---|
| **Mecanismo** | La memoria de trabajo del novato se satura si se le pide resolver antes de haber visto resolver. El ejemplo resuelto reduce la carga extraña; el andamiaje debe retirarse a medida que crece la pericia, porque mantenerlo perjudica al experto (efecto de reversión por pericia). |
| **Evidencia** | Teoría de la carga cognitiva de Sweller; efecto del ejemplo resuelto; efecto de reversión por pericia (Kalyuga y cols., 2003); modelo de los cuatro componentes 4C/ID de van Merriënboer y Kirschner. |
| **Decisión λ** | Cada laboratorio se construye sobre una **secuencia de desvanecimiento en cuatro pasos**: ejemplo completo → ejemplo con huecos → problema de completar → problema abierto. En el cuatrimestre 1 el 60 % de la práctica es de los dos primeros tipos; en el 3 lo es el 10 %. |
| **Dónde se ve** | D1 §5.2 (escalera de andamiaje), campo *Andamiaje* de cada semana en D4. |

#### 2.4 · Leer código antes de escribirlo: PRIMM

| | |
|---|---|
| **Mecanismo** | El novato que escribe antes de saber leer programa por imitación superficial. Predecir, ejecutar e investigar código ajeno antes de modificarlo y crear el propio construye el modelo mental de la máquina. |
| **Evidencia** | El marco **PRIMM** (Predict–Run–Investigate–Modify–Make) de Sentance y Waite, con base sociocultural vygotskiana, y su evaluación con profesorado (SIGCSE 2019). Aborda el problema documentado de novatos que escriben programas antes de poder leerlos. |
| **Decisión λ** | Todo laboratorio empieza con **predicción escrita** sobre código que el estudiante todavía no ha ejecutado, y sólo después se ejecuta. La predicción se registra: es dato para la investigación generacional y espejo metacognitivo para el estudiante. |
| **Dónde se ve** | D4, bloque `00:00–00:15` de cada domingo. |

#### 2.5 · Problemas de Parsons como evaluación de bajo coste

| | |
|---|---|
| **Mecanismo** | Ordenar bloques de código desordenados evalúa la comprensión de la estructura y la lógica sin el coste cognitivo de la sintaxis. |
| **Evidencia** | El informe del grupo de trabajo ITiCSE 2022 *Parsons Problems and Beyond* documenta que estos problemas se resuelven en menos tiempo que escribir código desde cero o reparar código defectuoso **sin sacrificar el aprendizaje**, y que permiten calificación más fiable. Las variantes con desvanecimiento (*faded Parsons*) mejoran la instrucción de patrones. |
| **Decisión λ** | Los quices de programación de los cuatrimestres 1 y 2 usan **problemas de Parsons con desvanecimiento** como formato principal. Reservan el tiempo escaso del estudiante para pensar, no para pelear con puntos y comas. |
| **Dónde se ve** | D3 §5. |

#### 2.6 · Aprendizaje cognitivo: hacer visible el pensamiento del experto

| | |
|---|---|
| **Mecanismo** | La programación es un oficio cuyo trabajo real es invisible: ocurre dentro de la cabeza del experto. El aprendizaje cognitivo lo externaliza mediante modelado, entrenamiento, andamiaje, articulación, reflexión y exploración. |
| **Evidencia** | Collins, Brown y Newman (1989), *Cognitive Apprenticeship: Teaching the Crafts of Reading, Writing, and Mathematics*. |
| **Decisión λ** | El docente programa en vivo **incluyendo sus errores** y verbalizando sus dudas, prohibido el código pre-escrito que se pega. Y a la inversa: el estudiante narra su razonamiento en voz alta durante los laboratorios en parejas. El error del docente en directo es material didáctico, no un accidente. |
| **Dónde se ve** | D1 §4.2 (bloque de 60 minutos), Anexo A (guion del docente). |

#### 2.7 · Instrucción entre pares

| | |
|---|---|
| **Mecanismo** | Ante una pregunta conceptual difícil, discutir con un par que sostiene otra respuesta produce más aprendizaje que escuchar la explicación correcta. |
| **Evidencia** | Peer Instruction de Mazur; su replicación en informática por Porter, Bailey Lee y Simon, con reducción documentada de tasas de fracaso en cursos introductorios. |
| **Decisión λ** | Los 40 minutos finales del sábado son **instrucción entre pares** con protocolo fijo: voto individual → discusión en parejas → segundo voto → cierre del docente. Se registran ambos votos: el desplazamiento entre uno y otro es un indicador de calidad de la pregunta. |
| **Dónde se ve** | D1 §4.2, D4 (bloque de instrucción entre pares). |

#### 2.8 · Fracaso productivo antes de la instrucción

| | |
|---|---|
| **Mecanismo** | Intentar y fallar en un problema antes de recibir la explicación prepara el terreno conceptual y mejora la transferencia, aunque el intento no llegue a la solución. |
| **Evidencia** | Programa de investigación de Kapur sobre *productive failure*. |
| **Decisión λ** | Se usa **de forma selectiva y no como norma general**: sólo en los seis puntos del programa donde el concepto tiene una intuición previa errónea documentada (asincronía, alcance de variables, especificidad CSS, reglas de seguridad, colisión de reservas, tokenización). El fracaso productivo con carga cognitiva alta y novatos absolutos es contraproducente; el Instituto lo acota. |
| **Dónde se ve** | Campo *Fracaso productivo* en las semanas **4, 7, 10 y 12** del D4. |

#### 2.9 · Dominio con reintento, no promedio con arrastre

| | |
|---|---|
| **Mecanismo** | Si la unidad *n+1* depende de la *n*, aprobar la *n* con 71 arrastra una deuda que se acumula hasta el colapso. El aprendizaje para el dominio exige corregir antes de avanzar. |
| **Evidencia** | Bloom (1984) sobre el problema de las dos sigmas y la tradición de *mastery learning* de Guskey. El Instituto adopta el mecanismo **sin suscribir la magnitud del efecto**: la cifra de dos desviaciones típicas no ha sido replicada de forma robusta y no se usa como argumento comercial (Carta, art. 18). |
| **Decisión λ** | Todo laboratorio admite **reintento hasta alcanzar el criterio**, con techo de calificación decreciente (100 / 85 / 70) y fecha límite dura al cierre del módulo. Las **compuertas** de proyecto (D9) no admiten arrastre: no se pasa de fase con la anterior no aprobada. |
| **Dónde se ve** | D3 §14 (política de reintento), D9 §4 (compuertas). |

#### 2.10 · Alineamiento constructivo

| | |
|---|---|
| **Mecanismo** | Resultados de aprendizaje, actividades y evaluación deben apuntar al mismo verbo y al mismo nivel cognitivo. Si el resultado dice «diseñar» y el examen pide «recordar», el estudiante estudia para recordar. |
| **Evidencia** | Biggs, alineamiento constructivo; taxonomía SOLO. |
| **Decisión λ** | Cada semana del syllabus declara sus **códigos de resultado de aprendizaje** (`RA`), y la matriz de alineamiento del D2 §6 cruza cada `RA` con la actividad que lo desarrolla y el instrumento que lo mide. Ningún `RA` puede quedar sin instrumento; ningún instrumento puede medir lo que ningún `RA` declara. |
| **Dónde se ve** | D2 §5 y §6. |

#### 2.11 · Retroalimentación que alimenta hacia adelante

| | |
|---|---|
| **Mecanismo** | La retroalimentación sólo produce aprendizaje si el estudiante puede actuar sobre ella en la tarea siguiente. Una nota al final del curso no es retroalimentación: es un veredicto. |
| **Evidencia** | Hattie y Timperley (2007), modelo de las tres preguntas (¿hacia dónde voy?, ¿cómo voy?, ¿qué sigue?); Nicol y Macfarlane-Dick (2006), principios de la evaluación formativa que sostiene la autorregulación. |
| **Decisión λ** | Toda retroalimentación se emite en **siete días naturales** (Carta, art. 30) y en formato de tres campos obligatorios: *qué cumple el criterio*, *qué no lo cumple y por qué*, *qué acción concreta lo corregiría en la entrega siguiente*. Prohibidas las valoraciones sin acción («mejorable», «regular»). |
| **Dónde se ve** | D3, Anexo I. |

### 3 · Lo que este modelo deliberadamente no hace

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

## PARTE II · LA MAQUINARIA: EL CICLO λ

### 4 · Estructura de la semana

#### 4.1 · Vista general

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

#### 4.1 bis · Las cuatro horas de clase y las cuatro de estudio

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

#### 4.2 · Sábado · sesión conceptual (120 minutos)

| Tramo | Duración | Qué ocurre | Regla dura |
|---|---|---|---|
| **S-1 · Apertura y dudas** | 20 min | Se resuelven las dudas del *Antes*. El docente abre con las tres predicciones erróneas más frecuentes recogidas en el pre-work. | Nunca se empieza explicando: se empieza escuchando. |
| **S-2 · Modelado en vivo** | 60 min | Programación o diagramación en directo, con errores reales, verbalizando el razonamiento y las alternativas descartadas. | Prohibido pegar código pre-escrito. Prohibido el IDE con autocompletado de IA activo. |
| **S-3 · Instrucción entre pares** | 40 min | Pregunta conceptual difícil → voto individual → 5 min en parejas → segundo voto → cierre. Dos o tres ciclos. | Se registran ambos votos. Si el primer voto acierta por encima del 80 %, la pregunta era mala y se sustituye. |

**Cierre.** El docente enuncia en una frase el criterio de éxito del laboratorio del
día siguiente. Los estudiantes salen sabiendo qué van a construir.

#### 4.3 · Domingo · laboratorio (120 minutos)

| Tramo | Duración | Qué ocurre | Regla dura |
|---|---|---|---|
| **L-1 · Reto y predicción** | 15 min | Se presenta el reto y el código de partida. Cada estudiante escribe su **predicción** de qué hará ese código antes de ejecutarlo (PRIMM). | Nadie ejecuta antes de predecir. La predicción se envía y queda registrada. |
| **L-2 · Codificación** | 90 min | Producción activa. El docente circula por salas, entrena, no resuelve. Trabajo en parejas con rotación de rol conductor/navegante cada 20 min. | El docente **no toca el teclado del estudiante**. Pregunta, no dicta. |
| **L-3 · Validación y entrega** | 15 min | Ejecución de la batería de comprobación: pruebas automatizadas, `axe`, Lighthouse, navegación por teclado. Entrega inicial al repositorio. | No se entrega nada que no pase la batería. Un laboratorio rojo se reintenta (§2.9). |

**Cierre.** Enunciado explícito de la **Transferencia**: qué parte exacta del
proyecto propio se toca esta semana y con qué criterio de aceptación.

#### 4.4 · La Transferencia como columna vertebral

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

### 5 · Secuenciación didáctica

#### 5.1 · La secuencia PRIMM-λ

Adaptación de PRIMM a las dos horas de laboratorio:

| Fase | Minutos | Actividad |
|---|---|---|
| **P · Predecir** | 15 | Predicción escrita sobre código no ejecutado. |
| **R · Ejecutar** | 10 | Ejecución y contraste con la predicción. Se nombra la discrepancia. |
| **I · Investigar** | 20 | Trazado, anotación, identificación de la línea responsable, uso del depurador. |
| **M · Modificar** | 30 | Cambios dirigidos con objetivo declarado, de menor a mayor alcance. |
| **M · Crear** | 45 | Construcción propia del artefacto de la semana. |

#### 5.2 · Escalera de andamiaje y su desvanecimiento

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

#### 5.3 · Interleaving y currículo en espiral

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

## PARTE III · LA INTELIGENCIA ARTIFICIAL EN EL APRENDIZAJE

### 6 · La Escalera de Uso de IA

#### 6.1 · Por qué existe

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

#### 6.1 bis · La escalera no restringe: habilita

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

#### 6.2 · Los cinco niveles

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

#### 6.3 · Progresión a lo largo del programa

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

#### 6.4 · Los tres contrapesos

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

#### 6.5 · Enseñar la IA como objeto de estudio

Además de usarla, el programa la estudia: anatomía de un modelo de lenguaje,
mecanismos de atención, tokenización y ventana de contexto, latencia de
inferencia, coste por millón de tokens, sesgos, alucinación, límites de
verificabilidad, diferencia entre familias propietarias y abiertas. Un
desarrollador que integra modelos en infraestructura de clientes debe saber
**cuándo el modelo no debe usarse**, y esa competencia no se adquiere usándolo:
se adquiere estudiándolo.

---

## PARTE IV · COMUNIDAD, MOTIVACIÓN Y PERMANENCIA

### 7 · Las tres presencias

El Instituto adopta el marco de **Comunidad de Indagación** de Garrison, Anderson
y Archer (2000), que descompone la experiencia educativa en línea en tres
presencias que deben diseñarse de forma explícita:

| Presencia | Definición | Cómo se produce en Elysium λ |
|---|---|---|
| **Cognitiva** | Capacidad de construir significado mediante indagación sostenida. | El ciclo PRIMM-λ, la instrucción entre pares y la investigación generacional. |
| **Social** | Proyectarse como persona real ante los demás. | Aula de **10 a 15 personas**, parejas rotativas semanales, Asamblea de Generación, cámara opcional pero micrófono esperado. Con ese tamaño el docente conoce el código de cada estudiante, que es la condición de todo lo demás. |
| **Docente** | Diseño, facilitación y dirección del proceso. | Syllabus público y congelado, retroalimentación en 7 días, presencia del docente circulando en los laboratorios. |

### 8 · Motivación y permanencia

El abandono en formación en línea no se combate con recordatorios. Se combate
satisfaciendo las tres necesidades psicológicas básicas de la teoría de la
autodeterminación de Deci y Ryan:

| Necesidad | Riesgo en un curso en línea | Mecanismo λ |
|---|---|---|
| **Autonomía** | Currículo impuesto sin relación con la vida del estudiante. | El proyecto es **su** negocio, elegido por la persona en la semana 3 y sostenido 45 semanas. |
| **Competencia** | Dificultad mal calibrada, fracaso sin salida. | Andamiaje desvaneciente (§5.2) y reintento hasta el dominio (§2.9): siempre hay un camino de vuelta. |
| **Relación** | Aislamiento, anonimato, sensación de estar solo. | Generación como unidad de identidad (Carta, art. 17), parejas rotativas semanales, revisión cruzada de proyectos, y un Demo Day público donde la generación se presenta junta. |

#### 8.0 · El problema propio de un programa gratuito

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

#### 8.1 · Protocolo de riesgo de abandono

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

## PARTE V · ASEGURAMIENTO DE LA CALIDAD DOCENTE

### 9 · Instrumentos

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

### 10 · Indicadores públicos del Instituto

En cumplimiento del art. 15 de la Carta, se publican cada seis meses: matriculados,
retención por cuatrimestre, graduación, distribución de calificaciones, tasa de
superación de la Auditoría Técnica en primer intento, número de becas concedidas y
resultado de la investigación generacional. La metodología de cálculo se publica
junto con las cifras y no cambia entre periodos sin nota explicativa.

---

## ANEXOS

### Anexo A · Guion de sesión del docente

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

### Anexo B · Plantilla de micro-guía del *Antes* (máx. 900 palabras)

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

### Anexo C · Encuesta de percepción λ (12 ítems, escala 1–5)

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




<div class="salto"></div>

# D2 · Plan de Estudios

<p class="doc-sub">Los 32 resultados de aprendizaje y su nivel de logro</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/ELYSIUM-CURRICULUM.md</code></p>

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

## PARTE I · IDENTIFICACIÓN

### 1 · Ficha del programa

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

### 2 · Perfil de ingreso

Persona de 16 años o más, hispanohablante de nivel B2 o superior, con ordenador
propio y conexión estable, **sin experiencia previa exigida en programación**, que
dispone de ocho horas semanales sostenidas durante cuatro meses, más unas 25 horas
de preparación previa en el Módulo 0, y que tiene o busca una idea de negocio propia, por pequeña que sea, sobre la que construir.

El programa está diseñado específicamente para tres situaciones:

- Quien trabaja de lunes a viernes y no puede abandonar su empleo para formarse.
- Quien vive fuera de los centros urbanos donde existe oferta presencial.
- Quien ya tiene un micronegocio y necesita construir su propia infraestructura
  en lugar de alquilarla.

### 3 · Perfil de egreso

> **Lo que este programa forma, dicho sin rodeos.** No forma programadores expertos.
> Forma **arquitectos de infraestructura digital asistida por IA**: personas capaces
> de **especificar, dirigir, auditar y responder** por un sistema construido en gran
> medida con agentes de inteligencia artificial, y de llevarlo al mercado.

Es un perfil profesional distinto del de desarrollador, y conviene no confundirlos.
El desarrollador escribe el código. El arquitecto **decide qué debe existir, con qué
estructura de datos, bajo qué restricciones, y comprueba que lo entregado las
cumple**. En 2026 ese segundo perfil es escaso y el primero abunda.

#### 3.1 · Las cuatro capacidades del egresado

| Capacidad | Qué significa en concreto |
|---|---|
| **Leer y juzgar** | Entiende el código que un agente le entrega lo suficiente para detectar cuándo está mal, cuándo es innecesariamente complejo y cuándo hace algo que nadie pidió. No lo escribe desde cero, pero **no lo acepta a ciegas**. |
| **Decidir la estructura** | Diseña el modelo de datos y las reglas de acceso **sin asistencia** (nivel N0), porque son las decisiones que un agente no puede tomar por él sin comprometer todo lo demás. |
| **Dirigir y auditar** | Especifica tareas a agentes avanzados, revisa lo devuelto línea a línea, declara qué aceptó y qué rechazó, y somete el resultado a umbrales objetivos de accesibilidad, rendimiento y seguridad. |
| **Lanzar** | Tiene la plataforma en producción, la marca, la presencia en redes, el cumplimiento legal básico y un modelo de negocio formulado. |

#### 3.2 · Qué sabe hacer, en términos verificables

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

#### 3.3 · Lo que el egresado **no** es

No es desarrollador profesional contratable como tal. No escribe pruebas
automatizadas desde cero. No domina ningún marco de trabajo. No optimiza rendimiento
a nivel experto. No es asesor jurídico ni fiscal. **Ninguna pieza de difusión puede
insinuar lo contrario** (Carta, art. 18).

### 4 · Referencia a marcos de competencias

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

## PARTE II · RESULTADOS DE APRENDIZAJE

### 5 · Catálogo de los 32 resultados

Notación: `RA-<Dominio><n>`. La columna **Nivel** indica el verbo cognitivo más
alto exigido según la taxonomía SOLO (U = uniestructural, M = multiestructural,
R = relacional, A = abstracto ampliado).

#### Dominio A · Interfaz accesible y rendimiento

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-A1** | Construir documentos HTML5 semánticos cuyo árbol de accesibilidad refleje fielmente la estructura de la información, y justificar la elección de cada elemento frente a alternativas. | R | 1–5 |
| **RA-A2** | Aplicar CSS3 mediante un sistema de propiedades personalizadas, con cascada controlada y especificidad justificada, evitando la anulación por fuerza bruta. | R | 1–5 |
| **RA-A3** | Producir interfaces responsivas con enfoque *mobile-first* operables sin pérdida de contenido ni funcionalidad entre 320 px y 2560 px. | R | 1–5 |
| **RA-A4** | Verificar y corregir la conformidad WCAG 2.2 nivel AA combinando análisis automático, recorrido por teclado y prueba con lector de pantalla, y distinguir qué criterios la herramienta automática **no** puede detectar. | A | 2–15 |
| **RA-A5** | Diagnosticar y optimizar las métricas de Core Web Vitals hasta los umbrales de la Auditoría Técnica Elysium, identificando la causa raíz de cada regresión. | A | 15 |

#### Dominio B · Lógica, lenguaje y estructura de programas

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-B1** | Modelar información con los tipos primitivos y compuestos de JavaScript ES6+, y razonar correctamente sobre coerción, igualdad, alcance y mutabilidad. | R | 1–5 |
| **RA-B2** | Expresar algoritmos mediante control de flujo, iteración y funciones, y argumentar su corrección con casos límite antes de ejecutarlos. | R | 1–5 |
| **RA-B3** | Manipular el DOM y gestionar eventos con la API estándar de la plataforma, sin bibliotecas intermedias. | M | 5 |
| **RA-B4** | Programar operaciones asíncronas con promesas y `async`/`await`, y explicar el orden de ejecución resultante del bucle de eventos. | R | 6–10 |
| **RA-B5** | Organizar el código en módulos con contratos explícitos y cubrirlo con pruebas automatizadas que fallen ante la regresión. | R | 6–10 |
| **RA-B6** | Leer una traza de error, formular una hipótesis causal, y confirmarla o refutarla con el depurador antes de modificar una sola línea. | A | 6 |

#### Dominio C · Datos, servicios y despliegue

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-C1** | Consumir servicios HTTP con la Fetch API, gestionando de forma explícita los estados de carga, éxito, vacío y error. | R | 6–10 |
| **RA-C2** | Diseñar un modelo de datos documental justificando cada decisión de desnormalización en función de los patrones de consulta previstos. | A | 6 |
| **RA-C3** | Implementar operaciones de creación, lectura, actualización y borrado contra un servicio de base de datos en la nube, incluida la sincronización en tiempo real. | R | 6–10 |
| **RA-C4** | Establecer despliegue continuo desde el repositorio con una compuerta de calidad que bloquee la publicación cuando los umbrales no se cumplen. | R | 6–10 |
| **RA-C5** | Implementar lógica de servidor en funciones sin servidor para aquello que, por seguridad o por coste, no puede residir en el cliente, y explicar el criterio de frontera. | A | 13 |

#### Dominio D · Seguridad, privacidad y cumplimiento

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-D1** | Escribir reglas de seguridad de datos que denieguen por defecto, y demostrar su corrección con una batería de **casos negativos** que deben fallar. | A | 6 |
| **RA-D2** | Implementar autenticación y control de acceso basado en roles, distinguiendo autenticación de autorización y sesión de identidad. | R | 11–14 |
| **RA-D3** | Aplicar las políticas de seguridad de la plataforma web (CSP, HSTS, control de orígenes) y explicar qué ataque previene cada una. | R | 11–14 |
| **RA-D4** | Diseñar el tratamiento de datos personales declarando base legal, minimización, plazo de retención y vía de ejercicio de derechos, conforme al RGPD y a la Ley n.º 8968. | A | 13 |

#### Dominio E · Inteligencia artificial

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-E1** | Explicar la anatomía funcional de un modelo de lenguaje grande: tokenización, mecanismo de atención, ventana de contexto y coste de inferencia. | R | 1–5 |
| **RA-E2** | Estimar de forma empírica el coste, la latencia y los límites de una integración concreta de modelo de lenguaje sobre datos reales. | A | 5 |
| **RA-E3** | Detectar, documentar y mitigar alucinaciones y sesgos en salidas de modelos, y decidir de forma argumentada **cuándo no debe usarse** un modelo. | A | 5 |
| **RA-E4** | Emplear asistentes y **agentes generativos en el editor** dentro de un nivel declarado, dirigiendo tareas de varios pasos y revisando y justificando por escrito cada aceptación y cada rechazo. | A | 6 |
| **RA-E5** | Diseñar, desplegar y auditar un agente que **actúe sobre sistemas reales** desde el servidor, con supervisión humana registrada, carta de límites publicada y análisis previo de su peor fallo posible. | A | 13 |

#### Dominio F · Ingeniería, proceso y calidad

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-F1** | Operar Git y GitHub con historial legible, versionado semántico Elysium y participación efectiva en revisión de código ajeno. | R | 1–10 |
| **RA-F2** | Someter un artefacto propio a la Auditoría Técnica Elysium, interpretar sus hallazgos y remediarlos en orden de severidad. | A | 2–15 |
| **RA-F3** | Escribir documentación técnica que permita a una persona ajena instalar, ejecutar, entender y mantener el proyecto sin preguntar nada al autor. | R | 14–15 |

#### Dominio G · Negocio, comunicación y ética profesional

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-G1** | Formular una propuesta de valor y un modelo de negocio verificables para una micro o pequeña empresa, y revisarlos ante evidencia contraria. | A | 2–15 |
| **RA-G2** | Producir identidad de marca, presencia en redes sociales y contenido persuasivo coherentes con la interfaz y con la promesa del negocio, y medir su efecto. | R | 13–14 |
| **RA-G3** | Identificar y cumplir los requisitos legales, fiscales y de protección al consumidor de la puesta en marcha en su propia jurisdicción. | R | 11–14 |
| **RA-G4** | Sostener una defensa técnica y una presentación comercial ante un panel, respondiendo a preguntas adversas sin perder rigor. | A | 13 |

#### Dominio H · Investigación · **SUPRIMIDO**

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

### 5.9 · Clasificación por nivel de logro

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

### 6 · Matriz de alineamiento constructivo

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

## PARTE III · MAPA CURRICULAR

### 7 · Carga de trabajo

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

### 8 · Los tres hilos y los tres niveles

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

### 9 · Grafo de dependencias duras

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

### 10 · Distribución de hitos y compuertas

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

## PARTE IV · TECNOLOGÍA Y CANON TÉCNICO

### 11 · Conjunto tecnológico y su justificación

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

### 12 · Correspondencia con el estándar técnico de la empresa

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

## PARTE V · DECISIONES DE DISEÑO CURRICULAR

### 13 · Correcciones aplicadas al borrador inicial

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

### 13 bis · Segunda revisión: el giro a acción social (agosto de 2026)

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

### 13 ter · Tercera revisión: el paso a programa uni-cuatrimestral (agosto de 2026)

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

### 14 · Riesgos curriculares reconocidos

| Riesgo | Probabilidad | Mitigación prevista |
|---|:---:|---|
| Ocho horas semanales resultan insuficientes para novatos absolutos en C2. | Media | Reintento hasta el dominio; semanas 13 de cada cuatrimestre reservadas a consolidación; congelación de matrícula sin penalización. |
| Dispersión de proyectos: hasta 15 dominios distintos que asesorar. | Media | El laboratorio usa dominio neutro común; sólo la Transferencia es individual. Catálogo de cinco arquetipos de negocio para encauzar la elección en G1. El aula pequeña reduce mucho este riesgo respecto al diseño original. |
| Dependencia de un único proveedor de datos (Firebase). | Media | Regla de sustituibilidad (§11); los `RA` no nombran productos. |
| El agente en el editor (N3) erosiona la autoría real ya en C2. | **Alta** | Defensa Aleatoria de Autoría desde la semana 20; `AI-USE.md` con apartado de rechazos obligatorio; G4 y G5 a nivel N0 con defensa oral. Es el riesgo más serio de todo el programa y por eso lleva tres contrapesos y no uno. |
| El nivel N4 de IA en C3 erosiona la autoría real del trabajo final. | Media | Defensa Aleatoria de Autoría con frecuencia **duplicada** en C3; la defensa final es N0. |
| **Todo el programa depende de una sola persona docente.** | **Alta** | Grabación íntegra y materiales escritos completos; generación piloto Λ00 que prueba y documenta el material un año antes; tutores pares reclutados entre los pilotos; docente suplente identificado antes de la Generación I. **No se mitiga con crecimiento**: el aula pequeña es decisión de diseño (Carta, art. 41), no una limitación a superar. |

### 15 · Bibliografía de fundamentación

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




<div class="salto"></div>

# D3 · Reglamento de Evaluación

<p class="doc-sub">Instrumentos, rúbricas y umbrales objetivos</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/ELYSIUM-ASSESSMENT.md</code></p>

> **Cómo leer este documento.** Aquí está el **cómo se mide** lo que el D2
> promete. La Parte I fija los principios y la aritmética de la nota. La Parte II
> describe cada instrumento con su diseño y su rúbrica. La Parte III contiene los
> dos mecanismos que distinguen a este Instituto: la Defensa Aleatoria de Autoría
> y la Auditoría Técnica Elysium, ambos con umbrales objetivos y públicos. La
> Parte IV regula plazos, reintentos, incidencias y recursos. Los anexos son
> plantillas de uso obligatorio.
>
> **Regla de publicidad anticipada.** Ninguna rúbrica, umbral o criterio de este
> documento puede aplicarse a una actividad si no estaba publicado **antes** de que
> la actividad comenzara. Un criterio retroactivo es nulo (Carta, art. 30).

---

## PARTE I · ARQUITECTURA DE LA EVALUACIÓN

### 1 · Los siete principios

1. **Se evalúan artefactos, no declaraciones** (Carta, art. 9). Todo instrumento
   produce un objeto inspeccionable por un tercero.
2. **Se evalúa la autoría, no sólo el resultado** (Carta, art. 10). Un artefacto
   excelente que su autor no puede explicar vale cero.
3. **La evaluación es formativa por defecto y sumativa por excepción.** Trece de
   los quince instrumentos admiten reintento.
4. **Los umbrales técnicos son objetivos.** Accesibilidad, rendimiento y seguridad
   se miden con herramienta, no con opinión. La opinión se reserva para lo que la
   herramienta no puede ver.
5. **No hay curva ni cupo.** Si las diez personas del aula cumplen el criterio, las
   diez aprueban. La evaluación mide contra el criterio, no contra el grupo.
6. **Todo lo que pesa, se practica antes sin que pese.** Ningún formato aparece
   por primera vez en una evaluación sumativa.
7. **La retroalimentación llega a tiempo de ser usada**, o no es retroalimentación
   (D1 §2.11).

### 2 · Composición de la nota de cuatrimestre

| Componente | Peso | Qué agrupa | Reintento |
|---|:---:|---|:---:|
| **A · Evaluación continua** | **40 %** | Quices de recuperación (15 %) + laboratorios dominicales (25 %) | Sí |
| **B · Avance del proyecto** | **30 %** | Transferencias semanales (12 %) + compuertas del TFG del cuatrimestre (18 %) | Sí |
| **C · Hito final y su sustentación** | **30 %** | Entrega **H** de la semana 16, con Auditoría Técnica superada + Demo Day + sustentación ante panel | Una vez |

**No existe componente de investigación.** El plan de estudios no contiene actividad
investigadora evaluable (Carta, art. 49 bis). La línea de investigación del Instituto
la conduce el profesorado y su participación es voluntaria, anónima y sin efecto
alguno sobre esta nota (D8).

#### 2.1 · Nota final del programa

El programa es un único cuatrimestre de dieciséis semanas, de modo que **la nota del
cuatrimestre es la nota final**: 40 % continua, 30 % proyecto, 30 % hito de cierre.
No hay ponderación entre bloques porque no hay bloques que ponderar.

**Los cierres de nivel de las semanas 5 y 10 no llevan nota propia.** Son puntos de
control formativos (D2 §10): producen retroalimentación escrita y, si procede,
activan el protocolo de riesgo de abandono. Ponerles nota en un programa de dieciséis
semanas convertiría tres de esas semanas en evaluación en lugar de en aprendizaje.

#### 2.2 · Requisitos de aprobación (todos, no algunos)

Para aprobar un cuatrimestre deben cumplirse **simultáneamente**:

| # | Requisito | Umbral |
|---|---|---|
| 1 | Nota final del programa | ≥ **70** |
| 2 | Nota del componente **C** (hito de cierre) | ≥ **70** |
| 3 | Asistencia síncrona, incluida la diferida | ≥ **80 %** |
| 4 | Defensa Aleatoria de Autoría | **Superada** en todas las convocatorias |
| 5 | Auditoría Técnica Elysium del hito | **Sin hallazgos críticos** |
| 6 | Declaración `AI-USE.md` en todas las entregas | **Completa y veraz** |
| 7 | Expediente de integridad académica | **Sin falta grave firme** |

Los requisitos 4, 5, 6 y 7 son de tipo **apto / no apto**: no promedian, no
compensan y no se negocian. Un componente A brillante no rescata una defensa de
autoría fallida.

### 3 · Escala y conversión

Escala oficial: **0 a 100**, entera. Aprobación en **70**.

| Elysium λ | Descriptor | Portugal (0–20) | ECTS orientativo | Costa Rica (0–100) |
|:---:|---|:---:|:---:|:---:|
| 95–100 | Excelente con distinción | 19–20 | A | 95–100 |
| 90–94 | Excelente | 17–18 | A | 90–94 |
| 80–89 | Notable | 15–16 | B | 80–89 |
| 75–79 | Bien | 13–14 | C | 75–79 |
| 70–74 | Suficiente | 10–12 | D/E | 70–74 |
| 1–69 | Insuficiente | 1–9 | F | 1–69 |
| 0 | No presentado o anulado | 0 | F | 0 |

La conversión es **orientativa** y no constituye equivalencia oficial (Carta,
art. 8).

#### 3.1 · Menciones de graduación

| Mención | Requisito |
|---|---|
| **Cum laude λ** | Nota final ≥ 90 y ninguna compuerta reintentada. |
| **Mención de Accesibilidad** | Todas las auditorías ATE-A superadas en primer intento durante las 16 semanas. |
| **Mención de Ingeniería** | Cero hallazgos mayores en la Auditoría Técnica final y defensa de autoría superada sin reservas en las tres convocatorias. |

---

## PARTE II · LOS INSTRUMENTOS

### 4 · Catálogo

| Cód. | Instrumento | Frecuencia | Peso | Naturaleza | Nivel IA |
|---|---|---|:---:|---|:---:|
| **Q** | Quiz de recuperación | Semanal (sábado) | 15 % | Formativo con nota | N0 |
| **L** | Laboratorio dominical | Semanal (domingo) | 25 % | Formativo con nota | Según semana |
| **T** | Transferencia al proyecto | Semanal (domingo) | 12 % | Formativo con nota | Según semana |
| **G** | Compuerta de proyecto | 3: semanas 2, 8 y 15 | 18 % | Sumativo, bloqueante | Según fase |
| **H** | Hito final y sustentación | 1: semana 16 | 30 % | Sumativo | **N0** |
| **DAA** | Defensa Aleatoria de Autoría | **3 en el programa**, una por nivel | Apto/no apto | Sumativo, bloqueante | **N0** |
| **ATE** | Auditoría Técnica Elysium | Por hito | Apto/no apto | Sumativo, bloqueante | N/A |

### 5 · Quiz de recuperación (Q) · 15 %

**Cuándo.** Ventana asíncrona desde el cierre del sábado hasta las 23:59 UTC del
mismo día. Duración máxima **20 minutos** desde la apertura.

**Diseño.** Ocho ítems, con esta composición obligatoria:

| Ítems | Tipo | Origen |
|:---:|---|---|
| 3 | Predicción de salida o identificación del error | Concepto de la semana |
| 2 | Problema de Parsons con desvanecimiento | Concepto de la semana |
| **3** | **Recuperación espaciada** | Semanas **n−1**, **n−3** y **n−6** |

**Por qué así.** Los ítems de predicción y de Parsons miden comprensión estructural
sin coste sintáctico (D1 §2.5). Los tres ítems espaciados implementan la práctica
distribuida (D1 §2.2) y son la razón por la que el concepto de la semana 4 sigue
vivo en la semana 15. En las seis primeras semanas se usan los ítems espaciados que
haya disponibles y el resto se completa con ítems de la semana en curso.

**Reglas.** Nivel de IA **N0**, sin excepción. Se computan las **doce mejores de
las quince** notas del programa: tres semanas malas por enfermedad, trabajo o vida no
arruinan el componente. No hay reintento de un quiz concreto, porque el descarte de
las tres peores ya cumple esa función.

### 6 · Laboratorio dominical (L) · 25 %

**Entrega.** Al repositorio del laboratorio, antes de las 23:59 UTC del martes
siguiente.

**Estructura de la calificación.** Un laboratorio se compone de dos partes que se
califican por separado y se suman:

| Parte | Peso del laboratorio | Cómo se mide |
|---|:---:|---|
| **Corrección funcional** | 60 % | Batería de pruebas automatizadas provista. Es binaria por prueba. |
| **Calidad de ingeniería** | 40 % | Rúbrica L (§6.2), evaluada por el docente o por par formado. |

#### 6.1 · Arnés de pruebas

Cada laboratorio se entrega al estudiante con su especificación de pruebas ya
escrita (`spec/`). El estudiante ejecuta `npm test` y ve exactamente qué falta.

**En dieciséis semanas no se llega a escribir pruebas propias.** `RA-B5` queda
clasificado como **introducido** (D2 §5.9): el estudiante aprende a ejecutarlas,
leerlas e interpretar sus fallos, que es mucho, pero no a diseñarlas desde cero. El
certificado lo dice así y la difusión también debe decirlo así.

> **Consecuencia deliberada.** Un laboratorio con todas las pruebas en verde
> garantiza 60 de 100. Nunca 100. La diferencia entre funcionar y estar bien hecho
> es exactamente el 40 % restante, y esa diferencia es el oficio.

#### 6.2 · Rúbrica L · calidad de ingeniería

| Criterio | Insuficiente (0–69) | Suficiente (70–79) | Notable (80–89) | Excelente (90–100) |
|---|---|---|---|---|
| **Accesibilidad** | Hay violaciones automáticas serias, o el recorrido por teclado se rompe. | Sin violaciones automáticas; teclado funcional. | Además: foco visible y orden lógico; textos alternativos con significado. | Además: verificado con lector de pantalla y documentada una decisión de accesibilidad no trivial. |
| **Legibilidad** | Nombres opacos, funciones de más de 50 líneas, código muerto. | Nombres en inglés y descriptivos; funciones acotadas. | Además: responsabilidad única por función; sin comentarios que repitan el código. | Además: el código se lee sin comentarios y los que hay explican **por qué**, no qué. |
| **Robustez** | No contempla el caso vacío ni el de error. | Contempla el caso vacío. | Contempla vacío, error y límite. | Además: los estados de error son visibles y accionables para la persona usuaria. |
| **Historial de Git** | Un solo *commit* «final» o mensajes sin sentido. | Varios *commits* con mensajes comprensibles. | Además: formato Elysium de mensaje y versión declarada. | Además: el historial narra la construcción y permite revertir cualquier paso. |
| **Declaración de IA** | Ausente o falsa → falta I-02. | Presente y veraz. | Además: consigna qué se rechazó y por qué. | Además: incluye el guion metacognitivo previo a cada consulta. |

### 7 · Transferencia (T) · 12 %

**Qué es.** La aplicación de lo aprendido en el laboratorio al proyecto propio del
estudiante, entregada al repositorio personal antes de las 23:59 UTC del miércoles.

**Cómo se califica.** Con una rúbrica de tres niveles, deliberadamente ligera,
porque su función es sostener el hábito semanal y no sancionar:

| Nivel | Nota | Criterio |
|---|:---:|---|
| **Transferida** | 100 | El concepto está aplicado al dominio propio, adaptado, y funciona. |
| **Trasplantada** | 75 | El código del laboratorio está copiado con cambios cosméticos. |
| **No entregada** | 0 | Sin avance en el repositorio personal esa semana. |

La distinción entre *transferida* y *trasplantada* es el indicador más temprano de
que un estudiante está imitando en lugar de comprender, y por eso dispara
prioridad en la selección para la Defensa Aleatoria de Autoría (§10.3).

### 8 · Compuertas de proyecto (G) · 18 %

Se evalúan con las rúbricas del **D9 §6**, específicas de cada fase. Son
**bloqueantes**: no se avanza de fase con la anterior no aprobada, ni se compensa
con otras notas (D1 §2.9).

### 9 · Hito de cierre (H) · 30 %

| Elemento | Peso del hito |
|---|:---:|
| Auditoría Técnica Elysium superada sin hallazgos críticos | Requisito previo, apto/no apto |
| Rúbrica de producto (D9 §6, según cuatrimestre) | 60 % |
| Defensa ante panel (15 min: 7 de exposición, 8 de preguntas) | 40 % |

La defensa del hito se realiza con **cámara obligatoria** (Carta, art. 61.2) y sin
asistencia de IA de ningún tipo.

---

## PARTE III · LOS DOS MECANISMOS DISTINTIVOS

### 10 · Defensa Aleatoria de Autoría (DAA)

#### 10.1 · Qué es y por qué existe

Diez minutos, sin aviso previo, en los que el estudiante explica y modifica en
vivo su propio código. Es el único mecanismo del Instituto que discrimina de forma
fiable entre haber comprendido y haber obtenido. Funciona igual si la fuente fue
un compañero, un foro, un tutorial o un modelo de lenguaje, y por eso **sustituye
por completo a la vigilancia algorítmica de exámenes**, que el Instituto prohíbe
(Carta, art. 61.3).

#### 10.2 · Protocolo

| Fase | Duración | Contenido |
|---|:---:|---|
| **1 · Localización** | 1 min | El evaluador señala un bloque de 10–30 líneas de una entrega reciente del estudiante. |
| **2 · Explicación** | 3 min | «Explíqueme qué hace esto y por qué está así.» |
| **3 · Modificación en vivo** | 4 min | «Cambie el comportamiento para que ahora haga ___.» Pantalla compartida, sin asistentes. |
| **4 · Justificación** | 2 min | «¿Qué alternativa descartó y por qué?» |

#### 10.3 · Selección de convocados

No es puramente aleatoria: es **aleatoria estratificada**, y el estrato se declara
en público para que nadie lo interprete como sospecha personal.

| Estrato | Probabilidad relativa |
|---|:---:|
| Todos los estudiantes (base) | 1× |
| Entrega marcada como *trasplantada* en la Transferencia (§7) | 3× |
| Salto anómalo de calidad entre entregas consecutivas | 3× |
| Discrepancia entre nota de quiz (N0) y nota de laboratorio | 3× |
| Ausencia o pobreza de la declaración `AI-USE.md` | 2× |

**Una Defensa Aleatoria de Autoría por nivel, tres en total**, más la defensa de
autoría final que forma parte de la sustentación (D4, semana 16).

| Nivel | Ventana | Nivel de IA vigente |
|:---:|:---:|---|
| **I** | Semana 4 | N1 → N2 |
| **II** | Semana 9 | N3 · agente en el editor |
| **III** | Semana 13 | N4 · agente sobre sistemas reales |
| **Final** | Semana 16 | Dentro de la sustentación, a N0 estricto |

La ventana del Nivel II es la más importante de las tres: cae tres semanas después de
abrirse el agente en el editor, que es el momento de mayor riesgo de erosión de la
autoría en todo el programa (D2 §14). Con un aula de diez, las cuatro convocatorias
por estudiante suman unas siete horas de evaluación oral en total. Con treinta no
sería asumible, y ésa es una de las razones por las que el aula es pequeña.

#### 10.4 · Resultado

| Resultado | Efecto |
|---|---|
| **Superada** | Se registra y no afecta a la nota. |
| **Superada con reservas** | Se registra, se acuerda un plan de refuerzo y se reconvoca en 3 semanas. |
| **No superada** | La entrega examinada pasa a 0. Segunda convocatoria en 7 días sobre otra entrega. |
| **No superada dos veces** | Expediente por falta I-02 o I-01 según proceda (Carta, art. 52). |

**Garantía.** No superar una DAA por nervios, por fallo de conexión o por una
circunstancia acreditada no produce efecto alguno: se repone. El instrumento
existe para detectar ausencia de comprensión, no para castigar la ansiedad.

### 11 · Auditoría Técnica Elysium (ATE)

#### 11.1 · Naturaleza

Batería de comprobaciones **objetivas, reproducibles y públicas** que se ejecutan
sobre el artefacto desplegado. Cualquier persona con la URL debe poder reproducir
el resultado. La ATE no opina: mide.

Se ejecuta de forma automatizada mediante la acción de integración continua del
estándar de la empresa (`ELYSIUM-STANDARDS.md`, §6, flujo `qa-lighthouse.yml`),
más las comprobaciones manuales que ninguna herramienta puede sustituir.

#### 11.2 · Los seis bloques y sus umbrales

**ATE-A · Accesibilidad** *(referencia: WCAG 2.2 AA, EN 301 549)*

| # | Comprobación | Umbral | Severidad si falla |
|---|---|---|:---:|
| A1 | `axe-core`, violaciones serias o críticas | **0** | Crítica |
| A2 | Contraste de texto normal / grande | ≥ 4.5:1 / ≥ 3:1 | Crítica |
| A3 | Recorrido completo por teclado, sin trampa de foco | Íntegro | Crítica |
| A4 | Indicador de foco visible en todo elemento interactivo | Presente | Mayor |
| A5 | Todo control de formulario con etiqueta programática | 100 % | Crítica |
| A6 | Estructura de encabezados sin saltos de nivel | Correcta | Mayor |
| A7 | Textos alternativos con significado (revisión humana) | Correctos | Mayor |
| A8 | Una tarea principal completada con lector de pantalla | Completada | Crítica |
| A9 | Objetivo táctil mínimo 24×24 px (WCAG 2.2, 2.5.8) | Cumplido | Mayor |
| A10 | Sin dependencia exclusiva del color para transmitir información | Cumplido | Mayor |

**ATE-P · Rendimiento** *(móvil, con limitación de red y CPU)*

| # | Comprobación | Umbral | Severidad |
|---|---|---|:---:|
| P1 | Lighthouse, categoría rendimiento | ≥ **95** | Crítica |
| P2 | Largest Contentful Paint | ≤ 2,5 s | Crítica |
| P3 | Cumulative Layout Shift | ≤ 0,10 | Crítica |
| P4 | Interaction to Next Paint | ≤ 200 ms | Mayor |
| P5 | Peso de la carga inicial, comprimido | ≤ 300 KB | Mayor |
| P6 | Lighthouse, categoría buenas prácticas | ≥ 95 | Menor |

**ATE-S · Seguridad**

| # | Comprobación | Umbral | Severidad |
|---|---|---|:---:|
| S1 | Ningún secreto, clave ni credencial en el historial del repositorio | 0 | **Crítica** |
| S2 | Reglas de datos con denegación por defecto | Verificado | Crítica |
| S3 | Batería de **casos negativos** de acceso: todos deben ser rechazados | 100 % rechazados | Crítica |
| S4 | Content Security Policy sin `unsafe-inline` en scripts | Cumplido | Mayor |
| S5 | HSTS activo y HTTPS forzado | Cumplido | Mayor |
| S6 | Dependencias sin vulnerabilidades de severidad alta o crítica | 0 | Mayor |

**ATE-C · Cumplimiento** *(se comprueba en la compuerta G3, semana 15)*

| # | Comprobación | Severidad |
|---|---|:---:|
| C1 | Aviso legal identificando al responsable | Crítica |
| C2 | Política de privacidad con base legal, finalidad, plazo de retención y vía de ejercicio de derechos | Crítica |
| C3 | Gestión de consentimiento previa a toda cookie no esencial | Crítica |
| C4 | Términos y condiciones coherentes con lo que la plataforma hace | Mayor |
| C5 | Registro de actividades de tratamiento del proyecto | Mayor |
| C6 | Enlace al Livro de Reclamações si opera desde Portugal | Menor |

**ATE-Q · Calidad de código**

| # | Comprobación | Severidad |
|---|---|:---:|
| Q1 | Sin `console.log` de depuración ni código muerto | Mayor |
| Q2 | Sin dependencias declaradas y no usadas | Menor |
| Q3 | Identificadores y comentarios en inglés | Menor |
| Q4 | Versión declarada conforme al versionado Elysium | Menor |
| Q5 | `README` que permite a un tercero ejecutar el proyecto sin preguntar | Mayor |

**ATE-D · Autoría y trazabilidad**

| # | Comprobación | Severidad |
|---|---|:---:|
| D1 | `AI-USE.md` presente, completo y coherente con el historial | Crítica |
| D2 | Historial de Git legible, con evolución real y no un volcado único | Mayor |
| D3 | Atribución de todo recurso de terceros (imágenes, tipografías, fragmentos) | Crítica |

#### 11.3 · Efecto de los hallazgos

| Severidad | Efecto |
|---|---|
| **Crítica** | Bloquea el hito. Se remedia y se vuelve a auditar. Sin excepciones. |
| **Mayor** | Resta 5 puntos de la nota del hito por hallazgo, hasta un máximo de 20. |
| **Menor** | Se anota en el informe. No resta. Debe estar remediada en el hito siguiente. |

#### 11.4 · Informe

La ATE produce un informe con: fecha, `commit` auditado, URL, versión de cada
herramienta, resultado por comprobación, capturas, y hallazgos ordenados por
severidad con acción concreta de remedio. El informe se entrega al estudiante y se
archiva. Es el modelo del informe que ejecutará en la vida profesional para
clientes reales, según el paso 9 del λ Development Framework Model de la empresa.

---

## PARTE IV · PLAZOS, REINTENTOS Y RECURSOS

### 12 · Calendario semanal de entregas (horas UTC)

| Día | Hora | Qué vence |
|---|---|---|
| Sábado | 23:59 | Quiz de recuperación de la semana |
| Domingo | 17:00 | Entrega inicial del laboratorio en sesión |
| Martes | 23:59 | Entrega definitiva del laboratorio |
| Miércoles | 23:59 | Transferencia al proyecto propio |
| Jueves | 23:59 | Revisión de código de un par asignado |
| Viernes | 12:00 | *Antes* del sábado completado |

### 13 · Entregas fuera de plazo

| Retraso | Efecto |
|---|---|
| Hasta 24 h | Techo de calificación **85** |
| De 24 a 72 h | Techo de calificación **70** |
| Más de 72 h | **0**, con derecho a reintento por dominio (§14) |

**Fondo de gracia.** Cada estudiante dispone de **tres prórrogas de 72 h** en todo
el programa, que se activan avisando **antes** del vencimiento y sin necesidad de
justificar el motivo. Avisar antes es una competencia profesional y el Instituto la
premia; desaparecer no lo es.

**Circunstancias graves.** Enfermedad, duelo, catástrofe natural, corte prolongado
de servicios o violencia doméstica suspenden todos los plazos previa comunicación
a la Secretaría, que no exige detalle alguno sobre la naturaleza del hecho.

### 14 · Reintento por dominio

| Intento | Techo de calificación | Plazo |
|:---:|:---:|---|
| 1.º | 100 | Plazo ordinario |
| 2.º | 85 | 7 días desde la retroalimentación |
| 3.º | 70 | 14 días desde la retroalimentación |
| 4.º | — | No existe |

El reintento aplica a **Q** (por descarte de las tres peores), **L**, **T** y
**G**. No aplica al hito **H**, que admite una única repetición
extraordinaria autorizada por el Consejo Académico.

**Fecha límite dura.** Ningún reintento se acepta después del **domingo de la
semana 15**. La semana 16 es de Demo Day y sustentación, y no admite entregas.

### 15 · Revisión y recurso

Conforme al art. 46 de la Carta: solicitud razonada en 5 días, respuesta escrita
del docente en 5 días, recurso ante el Consejo Académico en 15 días. El recurso
puede confirmar, subir o **bajar** la nota, y así se advierte al recurrente antes
de admitirlo a trámite.

### 16 · Evaluación entre pares

Cada jueves, cada estudiante revisa el laboratorio de un par asignado por rotación
determinista. La revisión usa la rúbrica L (§6.2) y **no genera nota para el
revisado**: genera nota para el **revisor**, dentro del componente A, medida por la
utilidad y la precisión de sus observaciones. Se evalúa la capacidad de revisar, que
es `RA-F1`.

**Regla de rotación en aula pequeña.** Con un aula de 10 a 15 personas (Carta,
art. 41) y quince semanas de laboratorio, la repetición de pareja es inevitable y no
es un defecto. La rotación sigue este orden:

1. Se agota **primero** la lista completa de compañeros distintos, en orden de
   desplazamiento circular, antes de repetir a nadie.
2. Agotada la vuelta, se inicia una segunda con **desplazamiento distinto**, de modo
   que la segunda pareja de cada persona no coincida con la primera.
3. **Nadie revisa a la misma persona dos semanas consecutivas**, ni revisa a quien lo
   revisó a él la semana anterior.
4. En un aula de diez, cada estudiante revisa a cada compañero una o dos veces en el
   programa. Esa reincidencia es **deseable**: la segunda revisión del mismo
   proyecto permite comprobar si la observación anterior se atendió, y eso se valora
   de forma expresa en la nota del revisor.

---

## ANEXOS

### Anexo I · Plantilla de retroalimentación (obligatoria, tres campos)

```markdown
## Retroalimentación · [Estudiante] · [Entrega] · [Fecha]

**Nota:** __/100 · **Componente:** __ · **Intento:** __ de 3

### 1. Qué cumple el criterio
- [Concreto, con referencia a línea o archivo. No genérico.]

### 2. Qué no lo cumple y por qué
- [Criterio incumplido] → [evidencia: archivo:línea o captura] → [consecuencia real
  para la persona usuaria o para el mantenimiento]

### 3. Qué acción concreta lo corregiría
- [ ] [Acción ejecutable en la próxima entrega. Un verbo, un objeto, un criterio
      de éxito comprobable.]

**Próxima entrega donde espero ver esto:** ____
```

> Prohibidas las valoraciones sin acción: «mejorable», «regular», «falta pulir»,
> «casi». Una retroalimentación sin campo 3 se devuelve al docente en la auditoría
> mensual (D1 §9).

### Anexo II · Plantilla `AI-USE.md` (obligatoria en toda entrega)

```markdown
# Declaración de uso de inteligencia artificial

**Entrega:** [código] · **Nivel permitido en esta actividad:** N_
**Fecha:** ____ · **Autor:** ____

## 1. Herramientas utilizadas
| Herramienta y modelo | Para qué | Nº aproximado de consultas |
|---|---|---|
| | | |

*Si no se usó ninguna, escriba «Ninguna» y firme igual. La declaración negativa
también es obligatoria.*

## 2. Guion metacognitivo previo (obligatorio desde nivel N2)
Para cada consulta relevante:
| # | Qué creía que pasaba | Qué había probado ya | Qué esperaba obtener |
|---|---|---|---|

## 3. Prompts decisivos
> [Transcriba literalmente los 1–3 prompts que más influyeron en el resultado.]

## 4. Qué acepté y por qué
- [Fragmento o decisión] → [por qué lo consideré correcto] → [cómo lo verifiqué]

## 5. Qué rechacé y por qué
- [Sugerencia rechazada] → [qué estaba mal en ella]

*Este apartado es el que más se valora. Si está vacío, o aceptó todo sin criterio,
o no leyó lo que aceptó.*

## 6. Qué parte de esta entrega NO habría podido hacer sin ayuda
> [Respuesta honesta. No penaliza. Orienta la tutoría.]

**Declaro que esta información es completa y veraz, y entiendo que ocultarla
constituye falta grave I-02 conforme al art. 52 de la Carta.**

Firma: ____
```

### Anexo III · Rúbrica de la defensa de hito (componente C, 40 %)

| Criterio | Peso | Insuficiente (0–69) | Suficiente (70–79) | Notable (80–89) | Excelente (90–100) |
|---|:---:|---|---|---|---|
| **Dominio técnico** | 35 % | No explica su propio código. | Explica lo que hace. | Explica por qué está así. | Explica qué alternativas descartó y bajo qué condiciones cambiaría de decisión. |
| **Justificación de decisiones** | 25 % | Decisiones por imitación. | Justifica con criterio general. | Justifica con criterio y datos. | Justifica con datos propios y reconoce el coste de su elección. |
| **Respuesta a preguntas adversas** | 20 % | Se bloquea o improvisa. | Responde lo esencial. | Responde y matiza. | Reconoce límites con precisión y propone cómo los resolvería. |
| **Claridad expositiva** | 10 % | Se pierde o excede el tiempo. | Se entiende. | Estructurada y en tiempo. | El panel entiende el sistema sin haberlo visto antes. |
| **Honestidad** | 10 % | Atribuye como propio lo que no lo es. | Declara la ayuda recibida. | Declara y distingue con precisión su aporte. | Señala espontáneamente lo que aún no domina. |

### Anexo IV · Ficha de laboratorio (plantilla del docente)

```markdown
# L[NN] · [Título]
**Semana global:** __ · **RA:** ____ · **Nivel de IA:** N_ · **Andamiaje:** A_

## Predicción de apertura (PRIMM · 15 min)
Código de partida: `labs/L[NN]/start/`
Preguntas de predicción: 1) __ 2) __ 3) __

## Reto
[Enunciado en dos frases. Qué debe existir cuando termine.]

## Criterio de éxito (visible para el estudiante desde el minuto 0)
- [ ] `npm test` en verde (N pruebas)
- [ ] `axe` sin violaciones serias ni críticas
- [ ] Recorrido por teclado íntegro
- [ ] Entrega en el repositorio con mensaje conforme al estándar

## Atascos previstos y pregunta de entrenamiento
| Atasco | NO decir | Preguntar en su lugar |
|---|---|---|

## Transferencia asignada
Aplique __ a su proyecto. Estará bien cuando __.
```

---

*Elysium λ Institute of Development & Research · D3 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# D4 · Syllabus del Programa

<p class="doc-sub">Las dieciséis semanas, minuto a minuto</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/ELYSIUM-SYLLABUS.md</code></p>

> **Cómo leer este documento.** Es el contrato semanal completo del programa. La
> Parte I identifica el cuatrimestre y explica el Módulo 0. La Parte II detalla las
> dieciséis semanas, minuto a minuto, agrupadas en tres niveles de cinco semanas más
> la semana de defensa. La Parte III administra el cuatrimestre.
>
> **Sustituye** a los antiguos D4, D5 y D6, que quedan en [`archivo/`](archivo/)
> como material de referencia sin valor normativo.
>
> **Regla de congelación** (Carta, Anexo B). No se modifica durante el cuatrimestre
> en curso salvo corrección de errata, que se anota en §11.
>
> Se subordina a la Carta (D0), al Modelo Académico (D1), al Plan de Estudios (D2) y
> al Reglamento de Evaluación (D3).

---

## PARTE I · IDENTIFICACIÓN Y REGLAS

### 1 · Ficha del programa

| Campo | Valor |
|---|---|
| **Denominación** | Arquitectura de Infraestructura Digital Asistida por IA y Emprendimiento |
| **Estructura** | **16 semanas** · 15 lectivas + 1 de defensa · tres niveles de cinco semanas |
| **Regla de arranque** | Segundo sábado de enero (Carta, disp. trans. 2.ª) |
| **Fechas · Generación I (Λ01)** | 9 de enero de 2027 → 2 de mayo de 2027 |
| **Receso** | 27 y 28 de marzo de 2027 (Semana Santa) |
| **Horario** | Sábado y domingo, **15:00–17:00 UTC** |
| **Aula** | Máximo 15 estudiantes · 10 ideal · una sola por generación |
| **Coste** | **Ninguno** (Carta, art. 2 bis) |
| **Carga** | **4 h de clase + 4 h de estudio autónomo** por semana · 128 h |
| **Preparación previa** | **Módulo 0**, asíncrono y autodirigido, unas 25 h (§3) |
| **Nivel de IA** | N1 (S1–S4) → N2 (S5) → **N3 (S6–S11)** → N4 (S12–S15) · **N0** siempre en quices, DAA, defensa y diseño de datos |
| **Entregable final** | Plataforma web propia con datos en la nube, acceso autenticado y agenda, desplegada y auditada |
| **Investigación del estudiante** | **Ninguna.** Carga cero (D8 §1) |

### 2 · Objetivo del programa

Al terminar la semana 16, la persona graduada tiene **publicada y en producción la
estructura base de su propio emprendimiento digital**: la plataforma funcionando, la
marca, la presencia en redes y el modelo de negocio formulado.

**No la construyó sola: la dirigió.** Buena parte del código lo escribieron agentes
de inteligencia artificial bajo su especificación. Lo que sí es enteramente suyo es la
arquitectura, el modelo de datos, las decisiones y la responsabilidad, y puede
demostrarlo explicando y modificando cualquier bloque en vivo, sin asistencia. Ése es
el perfil que el programa forma y que el certificado acredita (D2 §3).

### 3 · Módulo 0 · Preparación asíncrona

> **Por qué existe.** El programa recorre en quince semanas lo que antes ocupaba
> cuarenta y ocho. Eso sólo es posible si la semana 1 no empieza desde cero absoluto.
> El Módulo 0 no es un filtro ni un requisito de admisión encubierto: es **gratuito,
> autodirigido, sin docente y sin nota**, y su única función es que todo el aula
> llegue con la misma base mínima. Quien lo complete, entra; nadie queda fuera por no
> haber programado antes, que es lo que el art. 16 de la Carta protege.

**Cuándo.** Las seis semanas anteriores al arranque. Para la Generación I, del
**28 de noviembre de 2026 al 8 de enero de 2027**.

**Carga.** Unas 25 horas totales, al ritmo de cada persona. No hay sesiones en vivo.

**Contenido y punto de control.**

```text
□ Bloque 1 · Lógica (10 h)
  Variables, tipos, condicionales, bucles y funciones, en un entorno guiado
  con verificación automática. Punto de control: 20 ejercicios resueltos.

□ Bloque 2 · Herramientas (6 h)
  Terminal básica, sistema de archivos, cuenta de GitHub, primer repositorio,
  primer commit, apertura de un Codespace.

□ Bloque 3 · Primer HTML (5 h)
  Un documento válido, con estructura mínima, publicado en una URL propia.

□ Bloque 4 · Preparación del proyecto (4 h)
  Nota de una página: «el negocio que quiero construir». No vinculante.

□ ADMINISTRATIVO
  Lectura de la Carta, Partes I y II · Firma del Compromiso λ
  Consentimiento de investigación (D8, Anexo I), voluntario y revocable
  Ficha de zona horaria y prueba de audio, vídeo y compartición de pantalla
```

**Acompañamiento.** Un canal asíncrono de dudas con respuesta en 48 horas
laborables, y **una sesión opcional de una hora** a mitad del módulo para quien se
atasque. No cuenta como docencia del programa.

**Si alguien no lo completa.** No pierde la plaza. Se le ofrece incorporarse a la
generación siguiente, o entrar asumiendo por escrito que arrancará en desventaja.
La decisión es suya, no del Instituto.

### 4 · Los tres niveles

| Nivel | Semanas | Título | Cierra con |
|:---:|:---:|---|---|
| **I** | 1–5 | Fundamentos de construcción web accesible | Página propia accesible y desplegada |
| **II** | 6–10 | Programación asistida por agentes y datos en la nube | Plataforma dinámica con datos y panel |
| **III** | 11–15 | Cierre del proyecto y emprendimiento | Emprendimiento digital listo para lanzar |
| **—** | 16 | **Demo Day y sustentación** | Graduación |

**Los niveles no son certificables por separado.** Son la estructura interna de un
único programa. Quien abandone en la semana 7 no recibe un «certificado de Nivel I»:
recibe, si lo solicita, una constancia de participación que declara las semanas
cursadas y ningún resultado de aprendizaje acreditado.

### 5 · Cómo se lee cada semana

```text
### Semana NN · Título
> RA · Nivel de IA · Andamiaje · Entregable

Sábado · Antes (30 min)       trabajo previo obligatorio
Sábado · Durante (120 min)    20' apertura · 60' modelado en vivo · 40' pares
Sábado · Después (30 min)     quiz con 3 ítems de recuperación espaciada
Domingo · Antes (30 min)      entorno listo + predicción escrita
Domingo · Durante (120 min)   15' predicción · 90' código · 15' validación
Domingo · Después (60-90 min) Transferencia al proyecto propio
Criterio de aceptación        qué debe cumplirse para aprobar
```

---

## PARTE II · LAS DIECISÉIS SEMANAS

### NIVEL I · Fundamentos de construcción web accesible · Semanas 1 a 5

#### Semana 01 · La web como sistema, el DOM y el entorno

> **RA** RA-A1 · RA-F1 **·** **IA** N1 **·** **Andamiaje** A1 **·** **Entrega** `L01`

**Sábado · Antes (30 min).** Micro-guía *«Qué ocurre cuando escribo una dirección y
pulso Intro»*. Tres predicciones escritas: ¿quién guarda el archivo que veo?, ¿el
navegador recibe la página ya dibujada?, ¿qué diferencia hay entre lo que escribí y
lo que el navegador tiene en memoria?

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura con las tres predicciones erróneas más frecuentes, y
  puesta en común de cómo fue el Módulo 0.
- `00:20–01:20` · Modelado en vivo: recorrido completo de una petición y construcción
  del árbol del documento. Se modifica un nodo en directo desde las herramientas del
  navegador para mostrar que el DOM y el archivo HTML no son la misma cosa.
- `01:20–02:00` · Instrucción entre pares: *si edito el DOM desde el navegador y
  recargo, ¿por qué desaparece mi cambio?*

**Sábado · Después (30 min).** `Q01`, sin ítems espaciados.

**Domingo · Antes (30 min).** Abrir el Codespace de `elysium-lab`. Leer el HTML de
partida **sin ejecutarlo** y escribir la predicción de qué se verá.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Contraste predicción / realidad.
- `00:15–01:45` · Documento HTML válido y publicado: estructura, metadatos, `lang`,
  título; `git add`, `commit`, `push`; publicación estática y comprobación de la URL.
- `01:45–02:00` · Validación con el validador del W3C y prueba desde el teléfono.

**Domingo · Después.** `T01` · Repositorio personal del proyecto con un `README` que
declara en cinco líneas qué negocio va a construir, para quién y qué problema resuelve.

**Criterio de aceptación.** Documento válido y desplegado en URL pública; repositorio
creado; al menos tres *commits* con mensajes comprensibles.

---

#### Semana 02 · Semántica, accesibilidad y formularios

> **RA** RA-A1 · RA-A4 **·** **IA** N1 **·** **Andamiaje** A1 **·** **Entrega** `L02` **·** **COMPUERTA G1**

**Sábado · Antes (30 min).** Micro-guía *«Un `div` no significa nada»*. Predicción:
¿cómo sabe un lector de pantalla que un bloque es la navegación principal?

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura y dudas.
- `00:20–01:20` · Modelado con **demostración comparativa**: la misma página con
  contenedores genéricos y con elementos semánticos, recorridas ambas con lector de
  pantalla en directo. Árbol de accesibilidad. Los cuatro principios de WCAG, el
  nivel **AA de WCAG 2.2**, y por qué desde el 28 de junio de 2025 esto es exigible
  en la Unión Europea: Directiva (UE) 2019/882 y norma EN 301 549. Formularios
  accesibles: etiqueta programática, agrupaciones, ayuda asociada, error anunciado.
- `01:20–02:00` · Instrucción entre pares: *¿cuál de estas cuatro maquetaciones de
  formulario es accesible y por qué las otras tres no?*

**Sábado · Después (30 min).** `Q02` · espaciado: S01.

**Domingo · Antes (30 min).** Instalar `axe DevTools`. Predecir cuántas violaciones
encontrará en el código de partida y de qué tipo.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y primera ejecución de `axe`.
- `00:15–01:45` · Esqueleto semántico completo (regiones, jerarquía de encabezados
  sin saltos, listas reales) y formulario de contacto accesible.
- `01:45–02:00` · Validación: cero violaciones serias o críticas; recorrido íntegro
  por teclado sin trampa de foco.

**Domingo · Después.** `T02` · Esqueleto semántico del proyecto propio con su
formulario, auditado.

> ### ⚑ Compuerta G1 · Carta de Anteproyecto
> **Vence:** domingo de la semana 2, 23:59 UTC. **Bloquea todas las Transferencias
> posteriores**, porque sin proyecto definido no hay destino para lo que se aprende.
> Dos páginas según la plantilla del D9, Anexo I: nicho, cliente concreto con nombre
> y contexto, problema, propuesta de valor en una frase, tres competidores, y qué
> hará la plataforma que hoy no ocurre.

**Criterio de aceptación.** Cero violaciones serias o críticas; todo control con
etiqueta programática; G1 aprobada.

---

#### Semana 03 · CSS: cascada, tokens y diseño responsivo

> **RA** RA-A2 · RA-A3 **·** **IA** N1 **·** **Andamiaje** A2 **·** **Entrega** `L03`

**Sábado · Antes (30 min).** Micro-guía *«Por qué su regla CSS no se aplica»*.
Predicción sobre tres pares de selectores en conflicto.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado: origen y orden de la cascada, herencia, cálculo de
  especificidad, modelo de caja, unidades relativas, y **propiedades personalizadas
  como sistema de diseño**. Después, en el mismo bloque: enfoque *mobile-first*,
  consultas de medio ascendentes, ejes de Flexbox, áreas de Grid, y tipografía fluida
  con `clamp()`. Se muestra `!important` como antipatrón y por qué siempre se paga.
- `01:20–02:00` · Instrucción entre pares: *dadas estas cuatro reglas en conflicto,
  ¿qué color tendrá el elemento?* y *¿esto es Flexbox o Grid?*

**Sábado · Después (30 min).** `Q03` · espaciado: S02, S01.

**Domingo · Antes (30 min).** Señalar las tres reglas de la hoja de partida que
**no** surtirán efecto.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · Sistema de tokens (color, escala tipográfica, espaciado, radios) y
  maquetación responsiva completa, con cabecera móvil primero operable por teclado y
  cierre con `Escape`. Reconstruye **F02 · Header Mobile-First** del estándar.
- `01:45–02:00` · Validación en 320, 768, 1440 y 2560 px, sin desbordamiento
  horizontal; contraste ≥ 4.5:1; cero valores de color fuera del sistema de tokens.

**Domingo · Después.** `T03` · Tokens y responsividad aplicados al proyecto propio.

**Criterio de aceptación.** Sin desplazamiento horizontal en ningún ancho; texto
legible al 200 % de zoom; cero `!important`.

---

#### Semana 04 · JavaScript: datos, decisiones, repetición y funciones

> **RA** RA-B1 · RA-B2 **·** **IA** N1 **·** **Andamiaje** A2 **·** **Entrega** `L04` **·** **Fracaso productivo**

**Sábado · Antes (30 min).** **Fracaso productivo dirigido**: resolver ocho
comparaciones (`0 == ''`, `[] == false`, `NaN === NaN`…) y anotar la predicción. Se
entrega el acierto y el error. Nadie corrige nada todavía.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura sobre los patrones de error del grupo, sin nombres.
- `00:20–01:20` · Modelado: tipos primitivos y de referencia; `const` y `let`;
  coerción e igualdad estricta; mutabilidad y copia; arreglos y objetos.
  Condicionales y cláusulas de guarda frente al anidamiento profundo. Iteración con
  `for…of` y transformación con `map`, `filter` y `reduce`. Funciones con retorno
  explícito, funciones puras y módulos ES.
- `01:20–02:00` · Instrucción entre pares con **problemas de Parsons**: ordenar los
  bloques de una función de filtrado y otra de agregación.

**Sábado · Después (30 min).** `Q04` · espaciado: S03, S02.

**Domingo · Antes (30 min).** Preparar el arnés de pruebas (`npm install`) y predecir
la salida del código de partida.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · Modelado del dominio del negocio en JavaScript (servicios con
  nombre, precio, duración, disponibilidad) y las funciones que operan sobre él,
  organizadas en módulos. Se hace pasar cada prueba una a una.
- `01:45–02:00` · Validación: `npm test` en verde; ninguna función supera 25 líneas.

**Domingo · Después.** `T04` · Datos reales del negocio propio modelados en un módulo.

**Criterio de aceptación.** Pruebas en verde; sin `var`; sin comparación laxa salvo
justificación escrita.

---

#### Semana 05 · DOM, eventos y anatomía de un modelo de lenguaje

> **RA** RA-B3 · RA-E1 · RA-E3 **·** **IA** N2 **·** **Andamiaje** A3 **·** **Entrega** `L05` **·** **Hito de nivel I**

**Sábado · Antes (30 min).** Dos tareas. Primera: segmentar a mano en «unidades
mínimas» tres frases en español, una con tildes y otra con emoji, y predecir cuántas
contará el modelo. Segunda: provocar deliberadamente **dos respuestas falsas** en un
modelo de uso libre sobre un tema que domine, y guardar las transcripciones.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Contraste de las segmentaciones con el conteo real y puesta en
  común de las falsedades recogidas.
- `00:20–01:20` · Modelado conceptual: qué es un modelo de lenguaje grande y qué
  significa predecir el siguiente token; el mecanismo de atención explicado sin
  álgebra; ventana de contexto y su coste; por qué el modelo produce contenido falso
  con seguridad aparente; sesgo en los datos y en la alineación; y la lista de casos
  en los que **no debe usarse**: decisiones jurídicas, médicas, financieras, y todo
  aquello cuyo error no se detecta sin ser ya experto.
- `01:20–02:00` · Instrucción entre pares con casos de decisión profesional real.

**Sábado · Después (30 min).** `Q05` · espaciado: S04, S02.

**Domingo · Antes (30 min).** Predicción sobre el comportamiento del formulario de
partida al enviarlo vacío.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · API del DOM y eventos: `querySelector`, `addEventListener`, el
  objeto del evento, `preventDefault`. Validación de formulario en cliente con
  mensajes asociados al control, anuncio en región activa y foco al primer error.
  Renderizado de una lista de datos al DOM con su estado vacío resuelto.
- `01:45–02:00` · Validación: prueba con teclado y con lector de pantalla.

**Domingo · Después.** `T05` · Validación accesible y catálogo renderizado desde
datos en el proyecto propio. **Cierre del Nivel I.**

**Criterio de aceptación.** Un error de validación es percibido por alguien que
navega sólo con teclado y lector de pantalla, sin ver la pantalla. Ningún dato del
catálogo escrito literalmente en el HTML.

---

### NIVEL II · Programación asistida por agentes y datos · Semanas 6 a 10

> **Se abre el nivel N3.** A partir de aquí se permite dirigir un **agente dentro del
> editor** en tareas de varios pasos. Lo que no se abre es el agente que actúa fuera
> del editor. La frontera y su porqué están en el D1 §6.2. El diseño del modelo de
> datos (semana 8) permanece en **N0**.

#### Semana 06 · Instrucción técnica, agentes en el editor y depuración

> **RA** RA-E4 · RA-B6 **·** **IA** N3, salvo el diagnóstico que baja a N2 **·** **Andamiaje** A3 **·** **Entrega** `L06`

**Sábado · Antes (30 min).** Dos tareas. Pedir a un modelo la misma función de tres
maneras (vaga, detallada, con ejemplo y restricciones) y guardar las salidas.
Recibir cinco trazas de error y escribir qué cree que ocurrió, sin ejecutar nada.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Comparación de las tres salidas: la variabilidad depende más de la
  instrucción que del modelo. Contraste de hipótesis sobre las trazas.
- `00:20–01:20` · Modelado: anatomía de una instrucción técnica útil; por qué pedir
  opciones con sus compromisos en vez de una solución. Después, depuración: leer una
  traza de abajo arriba, distinguir síntoma de origen, el depurador, y el método
  **hipótesis → experimento → confirmación → sólo entonces, cambio**. Se advierte
  sobre las tasas de aceptación acrítica documentadas en novatos, entre el 10 % y el
  53 %, como aviso sobre la propia conducta.
- `01:20–02:00` · Depuración en directo de un fallo aportado por un estudiante.

**Sábado · Después (30 min).** `Q06` · espaciado: S05, S03.

**Domingo · Antes (30 min).** Configurar el asistente en el editor y escribir el
**guion metacognitivo** de la primera consulta prevista (D1 §6.4).

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción: ¿qué parte hará bien el modelo y cuál mal?
- `00:15–01:45` · Dos mitades. Generación asistida de un componente accesible con
  criterios dados de antemano, con la regla de leer en voz alta al par cada línea
  antes de aceptarla. Y reparación de tres defectos en código ajeno con **bitácora de
  depuración** obligatoria: hipótesis previa, prueba, resultado, conclusión. Aquí se
  permite pedir al modelo que **interprete** el error, nunca que lo arregle.
- `01:45–02:00` · Validación: pruebas en verde, `axe` limpio, `AI-USE.md` con el
  apartado de rechazos relleno y bitácora con tres entradas.

**Domingo · Después.** `T06` · Un componente del proyecto generado con asistencia y
un fallo real depurado con bitácora.

**Criterio de aceptación.** El apartado *qué rechacé y por qué* contiene al menos
tres rechazos justificados. La bitácora contiene la hipótesis **antes** del arreglo;
si se escribió después, el historial de Git lo delata.

---

#### Semana 07 · Asincronía, HTTP y consumo de datos

> **RA** RA-B4 · RA-C1 **·** **IA** N3 **·** **Andamiaje** A3 **·** **Entrega** `L07` **·** **Fracaso productivo**

**Sábado · Antes (30 min).** **Fracaso productivo**: ordenar la salida esperada de un
fragmento con `console.log`, `setTimeout(…, 0)` y una promesa resuelta. Casi nadie
acierta, y ése es el objetivo.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Contraste. Se cuentan los aciertos en voz alta y se dice que ser
  pocos es lo normal.
- `00:20–01:20` · Modelado: un solo hilo, la pila, la cola de tareas y el bucle de
  eventos dibujado en pantalla; la promesa y sus tres estados; `async`/`await` como
  azúcar sobre lo mismo; `try`/`catch`. Después, HTTP: métodos, familias de códigos
  de estado, cabeceras, intercambio entre orígenes, `fetch`, y la trampa clásica de
  que `fetch` **no rechaza** ante un 404. JSON y su capa de transformación.
- `01:20–02:00` · Instrucción entre pares con fragmentos de orden de ejecución no
  obvio y con códigos de estado en escenarios reales.

**Sábado · Después (30 min).** `Q07` · espaciado: S06, S04.

**Domingo · Antes (30 min).** Predecir qué devolverá la petición de partida y qué
falla al recibir datos incompletos.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste con una respuesta deliberadamente sucia.
- `00:15–01:45` · Cliente HTTP encapsulado en módulo, con los **cuatro estados de
  interfaz** implementados y anunciados: cargando, éxito, vacío y error. Capa de
  transformación resistente a datos ausentes o con tipo inesperado.
- `01:45–02:00` · Validación: la interfaz no se rompe con ninguno de los seis cuerpos
  de respuesta defectuosos provistos; los cuatro estados se anuncian a lector de
  pantalla.

**Domingo · Después.** `T07` · Los cuatro estados y la capa de datos en el proyecto.

**Criterio de aceptación.** Los cuatro estados existen y son accesibles. Una interfaz
que sólo contempla el éxito no aprueba.

---

#### Semana 08 · Modelado de datos y base de datos en la nube

> **RA** RA-C2 · RA-C3 **·** **IA** **N0 en el diseño**, N3 en el código **·** **Andamiaje** A4 **·** **Entrega** `L08` **·** **COMPUERTA G2**

**Sábado · Antes (30 min).** Dibujar **en papel**, sin ayuda de ningún tipo, cómo
guardaría los datos de su negocio. Fotografiar y entregar.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Se proyectan varios papeles anónimos y se comparan enfoques.
- `00:20–01:20` · Modelado: entidad y relación; el modelo documental y por qué
  invierte la regla; la pregunta que gobierna todo el diseño, que no es *cómo son mis
  datos* sino **cómo los voy a consultar**; desnormalización deliberada y su coste de
  escritura; colección, documento, subcolección; índices; y el modelo de facturación
  por operación, con la advertencia de que un bucle mal escrito genera una factura.
- `01:20–02:00` · Taller: cada pareja rediseña el esquema del otro para una consulta
  nueva que no estaba prevista.

**Sábado · Después (30 min).** `Q08` · espaciado: S07, S05.

**Domingo · Antes (30 min).** Listar las ocho consultas que su aplicación necesitará.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de las listas de consultas.
- `00:15–01:45` · Creación de las colecciones del esquema aprobado, carga de datos de
  prueba, primera lectura desde la aplicación y primera suscripción en tiempo real
  con dos pestañas abiertas.
- `01:45–02:00` · Validación: la lectura funciona, la suscripción se cancela al
  desmontar, y no hay claves sensibles en el repositorio.

**Domingo · Después.** `T08` · Colecciones del proyecto propio creadas y pobladas.

> ### ⚑ Compuerta G2 · Modelo de datos aprobado
> **Vence:** domingo de la semana 8. **Bloquea el hito final.** Esquema con cada
> colección y sus campos tipados, las ocho consultas previstas y la **justificación
> escrita de cada desnormalización**. Se defiende oralmente a nivel **N0**: la
> arquitectura de datos no se delega. Rúbrica en D9 §11.4.

**Criterio de aceptación.** Cada decisión de desnormalización tiene una consulta que
la justifica. Un esquema bonito sin consultas que lo motiven no aprueba.

---

#### Semana 09 · Operaciones sobre datos y panel de administración

> **RA** RA-C3 · RA-A1 **·** **IA** N3 **·** **Andamiaje** A4 **·** **Entrega** `L09`

**Sábado · Antes (30 min).** Micro-guía *«De un formulario accesible a un documento
en la nube»*. Buscar tres interfaces reales con confirmación de borrado y evaluar
cuál protege mejor de un error.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura con los ejemplos.
- `00:20–01:20` · Modelado: el recorrido del dato desde el control del formulario
  hasta el documento persistido; validación en cliente frente a validación en
  servidor y por qué la primera nunca basta; marcas de tiempo del servidor;
  idempotencia y el problema del doble envío; actualización parcial frente a
  sustitución; borrado físico frente a lógico; y el diseño accesible de la
  confirmación destructiva, con foco atrapado y devuelto.
- `01:20–02:00` · Instrucción entre pares: *¿qué pasa si el usuario pulsa enviar dos
  veces?* y *¿qué ocurre con dos escrituras simultáneas?*

**Sábado · Después (30 min).** `Q09` · espaciado: S08, S06.

**Domingo · Antes (30 min).** Predecir qué ocurre al enviar el formulario sin
conexión y boceto del panel propio.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste en modo sin red.
- `00:15–01:45` · Inserción desde el formulario accesible con bloqueo del doble envío
  y confirmación anunciada; y **panel de administración en tiempo real**: tabla
  accesible con encabezados asociados, edición, borrado con confirmación y deshacer,
  filtros y contador de pendientes. Equivalente reducido de **F18** y **F25**.
- `01:45–02:00` · Validación: la llegada de un dato nuevo mientras se lee la tabla no
  desplaza el contenido ni roba el foco; todo operable sólo con teclado.

**Domingo · Después.** `T09` · Formulario conectado y panel del proyecto propio.

**Criterio de aceptación.** El doble envío no duplica. La confirmación se percibe sin
ver la pantalla.

---

#### Semana 10 · Reglas de seguridad y despliegue con compuerta

> **RA** RA-D1 · RA-C4 · RA-F1 **·** **IA** **N0 en el diseño de reglas** **·** **Andamiaje** A4 **·** **Entrega** `L10` **·** **Hito de nivel II** **·** **Fracaso productivo**

**Sábado · Antes (30 min).** **Fracaso productivo**: se entrega la URL de una
aplicación de práctica del Instituto con reglas abiertas. Intentar leer y modificar
datos que no deberían ser accesibles, y documentar lo conseguido. Es un entorno del
Instituto y nada más.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común de lo que cada quien logró leer y borrar. Ver la
  propia base de datos vaciada por un compañero no lo produce ninguna diapositiva.
- `00:20–01:20` · Modelado: el cliente **nunca** es de confianza; el lenguaje de
  reglas; denegación por defecto; validación de forma en la propia regla; por qué
  ocultar la interfaz no protege el dato; y la **batería de casos negativos** como
  única prueba aceptable. Después: ramas, revisión de código, formato de mensaje de
  la casa, versionado Elysium, e **integración continua que bloquea la publicación**
  cuando los umbrales no se cumplen, según el flujo `qa-lighthouse.yml` del estándar.
  Secretos y variables de entorno: una clave en el historial ya está comprometida.
- `01:20–02:00` · Escritura colectiva de reglas, atacadas en directo por el docente.

**Sábado · Después (30 min).** `Q10` · espaciado: S09, S07.

**Domingo · Antes (30 min).** Escribir ocho casos negativos: ocho cosas que **nadie**
debería poder hacer.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de los casos negativos entre parejas.
- `00:15–01:45` · Reglas del proyecto con batería automatizada en el emulador local,
  y despliegue continuo con compuerta activa. Se provoca a propósito un fallo de
  accesibilidad para **ver el bloqueo funcionar**, se corrige y se publica.
- `01:45–02:00` · Validación: los ocho casos negativos fallan, los cuatro positivos
  pasan, y existe evidencia de una publicación bloqueada y luego corregida.

**Domingo · Después.** `T10` · Reglas, batería y despliegue del proyecto propio.
**Cierre del Nivel II.**

**Criterio de aceptación.** **Cero casos negativos que pasen.** Uno solo que pase es
hallazgo crítico y no aprueba.

---

### NIVEL III · Cierre del proyecto y emprendimiento · Semanas 11 a 15

> **El cambio de peso de este nivel.** Las dos primeras semanas cierran la plataforma
> dirigiendo agentes; las tres últimas construyen el emprendimiento. No es un nivel
> técnico con un apéndice de negocio: son dos bloques del mismo tamaño. Quien termine
> con una plataforma impecable y sin saber a quién se la va a vender no ha terminado
> el programa.

#### Semana 11 · Identidad, roles y acceso, dirigiendo al agente

> **RA** RA-D2 · RA-D3 · RA-E4 **·** **IA** N3 **·** **Andamiaje** A5 **·** **Entrega** `L11`

**Sábado · Antes (30 min).** Micro-guía *«Autenticar no es autorizar»*. Intentar
acceder a la ruta privada de la aplicación de práctica sin haber iniciado sesión.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común: quién consiguió entrar y por qué.
- `00:20–01:20` · Modelado: identidad, autenticación y autorización como tres cosas
  distintas; por qué las contraseñas nunca se almacenan; el testigo firmado y su
  caducidad; control de acceso por roles y mínimo privilegio; y la regla central, que
  **ocultar el botón no protege la ruta**, porque la protección vive en la regla de
  datos. Cabeceras de seguridad de la plataforma (**F07 · Security Core**).
- `01:20–02:00` · Instrucción entre pares sobre matrices de permisos, y **taller de
  especificación**: cómo se le encarga a un agente que implemente esta matriz, y qué
  hay que comprobar en lo que devuelva.

**Sábado · Después (30 min).** `Q11` · espaciado: S10, S08.

**Domingo · Antes (30 min).** Escribir la matriz de permisos del proyecto propio.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de matrices.
- `00:15–01:45` · Implementación **dirigida al agente** del registro, inicio y cierre
  de sesión, área privada y área de administración, con reglas que reflejan la matriz.
  El estudiante especifica, el agente construye, el estudiante **revisa línea a línea
  y corrige**. Regla del laboratorio: todo lo aceptado se explica al par.
- `01:45–02:00` · Validación: casos negativos de acceso por rol incorrecto, todos
  rechazados; los mensajes de error no permiten enumerar cuentas; `AI-USE.md` con
  rechazos justificados.

**Domingo · Después.** `T11` · Acceso autenticado y roles en el proyecto propio.

**Criterio de aceptación.** Un cliente autenticado no puede leer ni un documento del
área de administración, comprobado **desde la consola** y no sólo desde la interfaz.

---

#### Semana 12 · La transacción del negocio y el agente supervisado

> **RA** RA-B2 · RA-A4 · RA-C5 · RA-E5 **·** **IA** **N4** **·** **Andamiaje** A5 **·** **Entrega** `L12` **·** **DAA ventana 3** **·** **Fracaso productivo**

**Sábado · Antes (30 min).** **Fracaso productivo**: escribir la función que decide si
dos reservas se solapan. Y completar una compra o una reserva en dos sitios reales
**usando sólo el teclado**, anotando dónde falla cada uno.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Se proyectan varias soluciones y se rompen con casos límite:
  reservas contiguas, de duración cero, que cruzan la medianoche.
- `00:20–01:20` · Modelado en dos mitades. **La transacción:** tiempo universal frente
  a hora local, el algoritmo correcto de solapamiento, condiciones de carrera, y el
  patrón de rejilla accesible con navegación por flechas (**F24**). **El agente en el
  servidor:** qué distingue al agente que escribe en su editor del que **actúa por sí
  mismo** sobre sistemas reales; carta de límites; qué exige confirmación humana; qué
  se registra; y el análisis previo del peor fallo posible.
- `01:20–02:00` · Instrucción entre pares: *¿qué es lo peor que puede hacer este
  agente si el modelo se equivoca?*

**Sábado · Después (30 min).** `Q12` · espaciado: S11, S09.

**Domingo · Antes (30 min).** Reglas de disponibilidad del propio negocio y **carta de
límites** del propio agente.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de las cartas de límites.
- `00:15–01:45` · La transacción del negocio construida con dirección del agente:
  reserva, pedido o alta, con impedimento del doble apunte. Y una función de servidor
  que, ante una transacción nueva, genera con un modelo un **borrador de respuesta que
  queda pendiente de aprobación humana**, con bitácora de entrada, salida y decisión.
- `01:45–02:00` · Validación: **una transacción completa realizada sólo con teclado y
  lector de pantalla**; cero envíos automáticos sin aprobación.

**Domingo · Después.** `T12` · Transacción operativa y agente supervisado en el
proyecto propio. **Congelación de funcionalidad: a partir de aquí no se añaden
funciones nuevas.**

**Criterio de aceptación.** Una persona ciega completa la transacción de principio a
fin. **Cero envíos automáticos sin revisión humana**: un agente que puede enviar solo
es hallazgo crítico.

---

#### Semana 13 · Emprendimiento I · el negocio detrás de la plataforma

> **RA** RA-G1 **·** **IA** N4 **·** **Andamiaje** A5 **·** **Entrega** `L13`

**Sábado · Antes (30 min).** Releer la Carta de Anteproyecto de la semana 2 y anotar
**qué ha resultado ser falso**. Hablar con una persona que podría ser cliente y
apuntar textualmente tres frases suyas.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común: qué supuesto se cayó. Casi todos se caen, y decirlo
  en público es la lección.
- `00:20–01:20` · Modelado: lienzo Lean para micronegocios; segmento, problema,
  propuesta única, canales, ingresos y costes; identificación del **supuesto más
  peligroso** y diseño del experimento más barato que puede refutarlo; economía
  unitaria mínima, con coste de adquisición, valor del cliente y punto de equilibrio;
  y cómo se fija un precio sin adivinar.
- `01:20–02:00` · Taller por pares: cada persona **ataca** el lienzo del otro.

**Sábado · Después (30 min).** `Q13` · espaciado: S12, S10.

**Domingo · Antes (30 min).** Formular por escrito el supuesto más peligroso del
propio negocio.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión de supuestos.
- `00:15–01:45` · Lienzo completo, economía unitaria con números propios, y **el
  experimento de validación lanzado de verdad**: encuesta, conversaciones con cinco
  clientes potenciales o página de captación publicada.
- `01:45–02:00` · Presentación de dos minutos por persona.

**Domingo · Después.** `T13` · Lienzo, precios y experimento en marcha.

**Criterio de aceptación.** El experimento tiene un **criterio numérico** que, de no
alcanzarse, obliga a cambiar el modelo. Sin ese criterio no es un experimento, es una
ilusión con formulario.

---

#### Semana 14 · Emprendimiento II · marca, redes y captación

> **RA** RA-G2 · RA-A5 **·** **IA** N4 **·** **Andamiaje** A5 **·** **Entrega** `L14`

**Sábado · Antes (30 min).** Elegir tres marcas del propio sector y describir en una
frase qué promete cada una. Buscar el propio negocio en un buscador y en un asistente
conversacional, y anotar qué aparece.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura con los hallazgos.
- `00:20–01:20` · Modelado en tres bloques. **Marca:** identidad mínima viable,
  nombre, paleta ya validada por contraste, voz y tono, y la promesa de marca
  entendida como restricción de producto y no como adorno. **Redes y contenido:** qué
  red sirve a qué negocio y cuál no sirve a ninguno; ritmo sostenible de publicación
  para una persona sola; contenido que capta frente a contenido que entretiene; y la
  advertencia de que una red social es infraestructura alquilada, mientras la
  plataforma propia es infraestructura poseída. **Descubrimiento técnico:** metadatos,
  datos estructurados, mapa del sitio, previsualización enriquecida y ficheros de
  contexto para asistentes (**F19 · Discovery Core**, **F20 · SEO**).
- `01:20–02:00` · Crítica de marca entre pares con prueba ciega de promesas.

**Sábado · Después (30 min).** `Q14` · espaciado: S13, S11.

**Domingo · Antes (30 min).** Escribir la promesa de marca en una sola frase y las
diez consultas por las que quiere que le encuentren.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Prueba ciega de promesas entre pares.
- `00:15–01:45` · Manual de marca de una página; reescritura de todos los textos de la
  plataforma conforme a la voz definida; perfiles sociales creados y coherentes; plan
  de contenido de ocho semanas realista para una persona sola; y metadatos, datos
  estructurados y previsualización configurados.
- `01:45–02:00` · Validación con herramienta de resultados enriquecidos y revisión de
  coherencia entre marca, interfaz y promesa.

**Domingo · Después.** `T14` · Marca, presencia y descubrimiento del proyecto propio.

**Criterio de aceptación.** La promesa de marca, la interfaz y los perfiles sociales
dicen lo mismo. El plan de contenido es sostenible por una sola persona: si exige
publicar a diario, se rechaza por irreal.

---

#### Semana 15 · Cumplimiento, auditoría final y memoria

> **RA** RA-D4 · RA-G3 · RA-F2 · RA-F3 **·** **IA** N4 **·** **Entrega** `L15` **·** **COMPUERTA G3**

**Sábado · Antes (30 min).** Inventariar **todos** los datos personales que su
plataforma recoge, campo por campo. Ejecutar la Auditoría Técnica Elysium completa y
**predecir la puntuación** antes de mirar el informe.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Contraste entre puntuación esperada y obtenida, y puesta en común de
  los datos personales que nadie había contado, que casi siempre son las direcciones
  IP y los registros de acceso.
- `00:20–01:20` · Modelado: qué es un dato personal y cuál es sensible; bases legales;
  minimización y plazo de conservación; derechos de la persona interesada;
  consentimiento previo de cookies (**F08**); el Reglamento (UE) 2016/679 junto a la
  Ley n.º 8968; y la ruta de formalización comercial, que se entrega como documento de
  referencia por jurisdicción. Después, lectura del informe de auditoría y orden de
  remediación por severidad.
- `01:20–02:00` · **Ataque cruzado autorizado**: cada estudiante intenta vulnerar la
  plataforma de otro, con consentimiento escrito previo y dentro del entorno del
  Instituto. Todo hallazgo se comunica en privado antes de comentarse.

**Sábado · Después (30 min).** `Q15` · recuperación acumulativa de todo el programa.

**Domingo · Antes (30 min).** Plan de remediación priorizado y borrador del registro
de actividades de tratamiento.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Validación del plan con el docente.
- `00:15–01:30` · Expediente legal publicado (política de privacidad, aviso legal,
  términos y consentimiento de cookies), remediación de todo hallazgo crítico y mayor
  con un caso negativo por vector, y reauditoría.
- `01:30–02:00` · Cierre de la memoria y primer ensayo cronometrado del pitch.

**Domingo · Después.** `T15` · Proyecto sin hallazgos críticos, expediente publicado y
memoria definitiva.

> ### ⚑ Compuerta G3 · Auditoría Técnica final y cumplimiento
> **Vence:** domingo de la semana 15. **Bloquea la defensa.** ATE-A, ATE-P, ATE-S,
> ATE-C, ATE-Q y ATE-D **sin hallazgos críticos**.

**Criterio de aceptación.** Cada hallazgo tiene un caso negativo que lo impide en el
futuro. Una política de privacidad que menciona funcionalidades que la plataforma no
tiene se devuelve: es una declaración falsa.

> **Límite declarado.** Este bloque enseña a navegar el procedimiento y a saber qué
> preguntar. **No es asesoramiento jurídico ni fiscal**, y así consta en el material y
> en el certificado.

---

### SEMANA 16 · Demo Day y sustentación

> **RA** RA-G4 **·** **IA** **N0 estricto** **·** **Entrega** `H` **·** **Presencia obligatoria**

**Sábado · Antes.** Comprobación técnica: plataforma en producción, URL accesible,
guion listo, entorno de presentación probado.

**Sábado · Durante (120 min) · DEMO DAY.** Sesión pública, retransmitida, grabada y
subtitulada, con invitados externos. Cada estudiante presenta **7 minutos** con
demostración en vivo de la plataforma funcionando. Sin diapositivas de relleno.

**Domingo · Durante (120 min) · SUSTENTACIÓN TÉCNICA.** En salas paralelas, ante
panel de tres personas con **al menos un auditor externo al Instituto** (Carta,
art. 23):

| Fase | Duración | Contenido |
|---|:---:|---|
| Exposición técnica | 10 min | Arquitectura, decisiones y alternativas descartadas |
| **Defensa de autoría final** | 10 min | Modificación de código en vivo, a nivel **N0** |
| Preguntas del panel | 15 min | Técnicas, de negocio y de cumplimiento |
| Deliberación | 5 min | A puerta cerrada |

**Domingo · Cierre.** Acto de graduación: certificados, menciones (D3 §3.1) y
publicación de los proyectos en la galería de la generación.

> ### ⚑ Hito H · Graduación
> Plataforma en producción con datos en la nube, autenticación y roles, agenda
> operativa, agente supervisado y cobro en modo de prueba; expediente de cumplimiento
> publicado; memoria técnica; y sustentación superada.

---

## PARTE III · ADMINISTRACIÓN

### 6 · Mapa de evaluación

| Componente | Peso | Instrumentos |
|---|:---:|---|
| **A · Continua** | 40 % | `Q01`–`Q15` (12 mejores) 15 % · `L01`–`L15` 25 % |
| **B · Proyecto** | 30 % | `T01`–`T15` 12 % · G1 (5 %) + G2 (7 %) + G3 (6 %) 18 % |
| **C · Hito final** | 30 % | ATE apta + producto y memoria 60 % + sustentación 40 % |
| **Apto / no apto** | — | **3 DAA mínimo**, una por nivel · asistencia ≥ 80 % · `AI-USE.md` completo |

### 7 · Calendario de la Generación I

| Semana | Sábado | Nivel | Marca |
|:---:|---|:---:|---|
| — | 28-XI-2026 → 8-I-2027 | — | **Módulo 0** asíncrono |
| 01 | 9-I-2027 | I | Arranque |
| 02 | 16-I-2027 | I | **G1 · Anteproyecto** |
| 03 | 23-I-2027 | I | |
| 04 | 30-I-2027 | I | **DAA ventana 1** |
| 05 | 6-II-2027 | I | Cierre del Nivel I |
| 06 | 13-II-2027 | II | Apertura de **N3** |
| 07 | 20-II-2027 | II | |
| 08 | 27-II-2027 | II | **G2 · Modelo de datos** (defensa a N0) |
| 09 | 6-III-2027 | II | **DAA ventana 2** |
| 10 | 13-III-2027 | II | Cierre del Nivel II · EE. UU. y Cuba cambian de hora el domingo |
| 11 | 20-III-2027 | III | Acceso y roles dirigiendo al agente |
| — | **27-III-2027** | — | **RECESO de Semana Santa** · Europa cambia de hora el domingo |
| 12 | 3-IV-2027 | III | Apertura de **N4** · **DAA ventana 3** · congelación de funcionalidad · Chile cambia de hora el domingo |
| 13 | 10-IV-2027 | III | Emprendimiento I |
| 14 | 17-IV-2027 | III | Emprendimiento II |
| 15 | 24-IV-2027 | III | **G3 · Auditoría final y cumplimiento** · cierre de reintentos |
| 16 | 1-V-2027 | — | **DEMO DAY y SUSTENTACIÓN** · presencia obligatoria |

**Aviso de cambio de hora.** El horario está anclado a **15:00 UTC**, de modo que
nada cambia nunca para América Latina continental. El cambio europeo de primavera
cae **dentro del receso**. Se anuncia por escrito la semana previa, siempre.

### 8 · Ciclo anual de la convocatoria

| Mes | Acción |
|---|---|
| Septiembre | Publicación de la convocatoria, la rúbrica de selección y el número de plazas |
| Octubre | Dos sesiones informativas en directo, en la franja de 15:00 UTC |
| Primera semana de noviembre | Cierre de solicitudes y Prueba de Disposición λ |
| Noviembre | Entrevistas de 20 minutos y resolución motivada a **todas** las personas candidatas |
| 28 de noviembre a 8 de enero | **Módulo 0** |
| Segundo sábado de enero | Arranque |

### 9 · Qué **no** cabe en dieciséis semanas

Se declara aquí para que nadie lo descubra en la semana 9, y para que ninguna pieza
de difusión lo insinúe:

- **No** se estudian marcos de trabajo de JavaScript ni preprocesadores de CSS.
- **No** se alcanza dominio en optimización profunda de Core Web Vitals: se audita y
  se remedia con guía, no se domina.
- **No** se escriben pruebas propias desde cero: se ejecutan y se leen las provistas.
- **No** hay estructura multiidioma ni multidivisa, ni aplicación instalable.
- **No** hay investigación científica a cargo del estudiante (D8 §1).
- **No** se imparte asesoría jurídica, fiscal ni contable.

La lista completa de qué queda **dominado** y qué queda **introducido**, resultado por
resultado, está en el D2 §5 y se transcribe en el certificado.

### 10 · Contrato de expectativas del docente

Publicar la micro-guía del sábado con 72 horas de antelación; devolver toda
calificación en 7 días con los tres campos obligatorios; grabar y subtitular las 32
sesiones; **no tocar nunca el teclado del estudiante**; convocar tres Defensas
Aleatorias de Autoría por estudiante; asegurar la presencia del auditor externo en la
sustentación, cuya ausencia obliga a aplazar y no a celebrar sin él; y anotar en §11
cualquier semana en la que menos del 60 % alcance el criterio en primer intento, que
se considerará defectuosa **por diseño** y no por el grupo (D1 §9).

### 11 · Registro de erratas y de semanas defectuosas

| Fecha | Semana | Naturaleza | Corrección aplicada | Efecto sobre notas |
|---|---|---|---|---|
| *(vacío al inicio de la generación)* | | | | |

---

*Elysium λ Institute of Development & Research · D4 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# D7 · Estudio de Contexto, Horario y Operación

<p class="doc-sub">A quién sirve, a qué hora, qué cuesta y quién lo paga</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/ELYSIUM-MARKET-STUDY.md</code></p>

> **Cómo leer este documento.** Es el documento operativo del Instituto. La Parte I
> delimita a quién sirve el programa. La Parte II analiza las alternativas que esa
> persona tiene y los modelos pedagógicos comparables. La Parte III fija el
> posicionamiento. La **Parte IV resuelve el problema del horario** con un modelo
> cuantitativo cuya especificación completa se incluye para que pueda replicarse o
> refutarse. La Parte V declara **qué cuesta el programa y quién lo paga**. La Parte
> VI trata la selección de estudiantes, los riesgos y los indicadores públicos.
>
> **Por qué ya no se llama estudio de mercado.** El programa es gratuito (Carta,
> art. 2 bis): no hay clientes, no hay precio y no hay ingresos. Lo que sigue
> teniendo sentido es analizar **qué alternativas tiene delante la persona a la que
> queremos llegar**, porque de ahí se deduce a quién sirve este programa y a quién
> no. El fichero conserva su nombre `ELYSIUM-MARKET-STUDY.md` para no romper los
> enlaces del paquete.
>
> **Advertencia metodológica.** Las cifras de tamaño de mercado proceden de
> informes comerciales de consultoras, que no publican su metodología completa y
> cuyas estimaciones varían entre sí en órdenes relevantes. Se usan como **indicio
> de tendencia y no como dato**. Las cifras de la competencia proceden de sus
> propias páginas públicas y, salvo cuando están auditadas por un tercero, se citan
> como **afirmaciones del vendedor**. Las únicas cifras que este documento presenta
> como propias son las del modelo horario (Parte IV) y las de coste (Parte V), y
> ambas incluyen sus supuestos.

---

## PARTE I · A QUIÉN SIRVE EL PROGRAMA

### 1 · Delimitación

**Población destinataria.** Personas hispanohablantes de 16 años o más, residentes
en cualquiera de los veintiún países de lengua española y en la diáspora, que quieren
**montar un emprendimiento digital propio** y necesitan las bases técnicas para
dirigirlo, que **no pueden o no quieren** abandonar su empleo o sus estudios para
formarse, y que **no tienen a su alcance una vía equivalente**. Este último requisito no es retórico: es el criterio
que más pesa en la selección (§23.3).

**Tamaño de la población de referencia.** Alrededor de 600 millones de personas
hablan español, de las cuales unos 500 millones lo tienen como lengua materna.
Los mercados con mayor masa son México, Colombia, España, Argentina y Perú, a los
que se añade la población hispanohablante de los Estados Unidos, de más de 40
millones. El Instituto no persigue cuota alguna de esa población: atiende a diez
personas por generación. La magnitud sirve únicamente para dimensionar el problema que la
convocatoria intenta abordar, y para recordar su desproporción.

**Contexto sectorial.** Los informes disponibles sitúan el mercado de tecnología
educativa en América Latina en torno a los **18.000 millones de dólares en 2025**,
con proyecciones de crecimiento anual compuesto de aproximadamente el **12 %** en la
década siguiente. La cifra concreta importa menos que su dirección: la demanda de
recualificación digital crece y la oferta en español de calidad no crece al mismo
ritmo.

### 2 · Segmentación por barrera de acceso

La versión 1.0.0 de este documento segmentaba por capacidad de pago, para fijar
precios por paridad de poder adquisitivo. Al ser el programa **gratuito**, esa
segmentación pierde su función económica pero conserva otra: describe **qué barrera
queda en pie cuando se elimina el precio**, y esa es exactamente la información que
necesita el proceso de selección.

| Grupo | Países | Barrera dominante una vez eliminado el precio |
|:---:|---|---|
| **A** | España, Portugal, Puerto Rico, Uruguay, Chile, Costa Rica, Panamá, diáspora en EE. UU. y UE | **Tiempo.** Existen alternativas de pago accesibles; lo escaso es el hueco semanal. Aquí el diferencial del Instituto es el horario de fin de semana. |
| **B** | México, Colombia, Argentina, Perú, Ecuador, República Dominicana, Paraguay | **Coste de oportunidad.** Hay oferta, pero cuesta varios meses de salario. El diferencial es la gratuidad combinada con no tener que dejar el empleo. |
| **C** | Bolivia, Guatemala, Honduras, El Salvador, Nicaragua, Venezuela, Cuba, Guinea Ecuatorial | **Ausencia de oferta y de infraestructura.** El diferencial es que el programa exista; la restricción real pasa a ser la conectividad y el equipo, que el art. 29.3 exige y el Instituto no puede suplir. |

> **Límite reconocido con honestidad.** El requisito de ordenador propio y conexión
> estable capaz de sostener videoconferencia excluye a una parte de la población del
> grupo C, que es precisamente la de mayor necesidad. El Instituto no puede
> resolverlo hoy y no finge lo contrario. Queda anotado como el primer objetivo de
> ampliación si alguna vez se obtiene financiación pública (§22).

### 3 · Los tres arquetipos de estudiante

Construidos a partir del perfil de ingreso del D2 §2. Cada uno tiene un motivo
distinto para presentarse y un motivo distinto para abandonar. Las proporciones son
previsiones de planificación sobre un aula de diez, no cupos: la rúbrica de
selección del §23.3 no reserva plazas por arquetipo.

#### Arquetipo 1 · «La persona que ya trabaja» *(estimado: 50 % de la matrícula)*

Entre 24 y 40 años, empleo de lunes a viernes fuera del sector tecnológico, ingreso
estable pero no alto. Ha intentado aprender por su cuenta con vídeo y lo ha
abandonado dos veces. **Se presenta** porque el fin de semana es el único hueco real
que tiene y porque quiere terminar con algo que enseñar. **Abandona** cuando el trabajo
se le complica y siente que ya no puede alcanzar al grupo.
*Mecanismo λ que lo retiene:* reintento hasta el dominio, descarte de las tres peores
notas, tres prórrogas sin justificación y congelación de matrícula sin coste. Y que
son cuatro meses, no doce: el horizonte es visible desde el primer día.

#### Arquetipo 2 · «Quien ya tiene un micronegocio» *(estimado: 30 %)*

Entre 28 y 50 años, autónomo o con una empresa de menos de cinco personas. Paga
hoy por una web que no controla, o no tiene ninguna. **Se presenta** porque el
proyecto de graduación **es** su plataforma: no viene a estudiar, viene a construir
la infraestructura de su negocio y aprende por el camino. **Abandona** cuando el ritmo técnico
supera su interés real por programar.
*Mecanismo λ que lo retiene:* la Transferencia semanal, que produce avance visible
en su propio negocio cada domingo.

#### Arquetipo 3 · «Quien estudia o acaba de terminar» *(estimado: 20 %)*

Entre 16 y 24 años, estudiante de secundaria avanzada o de universidad, con tiempo
pero sin dinero. **Se presenta** porque quiere salir con **algo suyo funcionando y
defendible** antes de terminar la carrera, y porque intuye que saber dirigir agentes
de IA vale más que saber escribir el código a mano. **Abandona** cuando aparece una
oportunidad laboral.
*Mecanismo λ que lo retiene:* que el proyecto sea **suyo y esté en producción** desde
la semana 3. Abandonar no cuesta una matrícula: cuesta un producto propio a medio
construir.

---

## PARTE II · COMPETENCIA Y MODELOS COMPARABLES

### 4 · Mapa competitivo

| Categoría | Ejemplos | Precio orientativo | Modalidad | Debilidad que Elysium λ explota |
|---|---|---|---|---|
| **Bootcamps intensivos** | 4Geeks Academy, Le Wagon, Ironhack | 4.000–6.500 USD | Inmersión, semanas completas | Exigen dejar de trabajar, y su precio equivale a varios meses de salario en buena parte del mundo hispanohablante. |
| **Bootcamps con pago diferido** | Henry y modelos de acuerdo de ingresos | Porcentaje del salario futuro | Intensivo remoto | El compromiso financiero futuro asusta y la promesa de empleo es frágil. |
| **Programas de impacto social** | Laboratoria | Subvencionado, pago tras empleo | 6 meses remoto | Cupo limitado y foco demográfico específico. Reportó cerca de un **79 %** de inserción en 2024. |
| **Plataformas de suscripción** | Platzi, EDteam, Udemy | 10–40 USD al mes | Vídeo bajo demanda | Sin sincronía, sin cohorte, sin defensa de autoría. Tasas de terminación notoriamente bajas. |
| **Gratuito de alta calidad** | freeCodeCamp, The Odin Project, contenido de YouTube | 0 | Autodidacta | Sin acompañamiento, sin credencial defendible, sin proyecto tutorizado. |
| **Universidad tradicional** | Grados y técnicos presenciales | Muy variable | 2–5 años | Lentitud, coste de oportunidad, currículos desfasados en IA aplicada. |
| **Formación con fondos públicos** | Programas del SEPE, IEFP, INA | 0 para el usuario | Variable | Acceso restringido por país y por situación laboral. |

**Conclusión del mapa.** El eje saturado es *intensivo caro* frente a *asíncrono
barato*. El cuadrante **vacío** es el de **alta intensidad docente en franja de fin
de semana, gratuito, con cohorte muy pequeña y con artefacto propio como
entregable**. Ahí se sitúa Elysium λ, y conviene ser explícito sobre por qué está
vacío: **no es un hueco de mercado, es un hueco que sólo puede ocupar quien no
busque rentabilidad**. Diez personas por año con catorce horas semanales de docente
no constituyen un negocio viable para nadie. Esa es a la vez la razón de que nadie
lo haga y la razón de que el Instituto pueda hacerlo.

### 5 · Benchmarking de modelos pedagógicos

No de competidores comerciales, sino de **modelos de aprendizaje** cuyas piezas se
han evaluado antes de adoptarlas o descartarlas.

| Modelo | Qué hace bien | Por qué no se copia entero | Qué se toma |
|---|---|---|---|
| **Aula invertida universitaria** | Libera tiempo síncrono para práctica. | Su efecto medio es pequeño y se anula si se recorta el tiempo presencial. | Se invierte **sin recortar** y **añadiendo cuestionarios**, que son los dos moderadores con efecto (D1 §2.1). |
| **Bootcamp de inmersión** | Intensidad y cohorte fuerte. | Excluye a quien trabaja. | La cohorte cerrada y el ritmo común. |
| **Aprendizaje basado en proyectos** | Motivación y transferencia. | Sin estructura produce lagunas conceptuales. | Proyecto real **más** currículo secuenciado con dependencias duras (D2 §9). |
| **Aprendizaje para el dominio** | Nadie avanza con deuda conceptual. | Descoordina a la cohorte si no hay fecha límite. | Reintento con techo decreciente **y** fecha límite dura en la semana 15. |
| **Instrucción entre pares** | Reducción documentada del fracaso en cursos introductorios de informática. | Requiere preguntas bien calibradas. | Protocolo de doble voto con descarte de preguntas demasiado fáciles. |
| **PRIMM** | Resuelve el problema del novato que escribe sin saber leer. | Pensado para aula escolar presencial. | Predicción escrita obligatoria antes de toda ejecución. |
| **Investigación de pregrado en el aula** | Produce publicación real con estudiantes. | Suele diluirse sin protocolo. | Investigación generacional con seis compuertas y preinscripción (D8). |
| **Cursos masivos abiertos** | Alcance y coste marginal cero. | Terminación muy baja y sin verificación de autoría. | Nada de su modelo de entrega; sí su disciplina de materiales reutilizables. |
| **Formación dual europea** | Vínculo con el ejercicio real. | Requiere empresa receptora. | El docente debe estar en ejercicio profesional vigente (Carta, art. 34). |

### 6 · La transparencia de resultados como diferencial

En el sector de los bootcamps existe desde 2016 un estándar voluntario de reporte
de resultados, con plantillas comunes, publicación semestral y **auditoría por un
tercero**. Su existencia demuestra dos cosas: que el sector tiene un problema
reconocido de credibilidad en las cifras, y que hay una vía establecida para
resolverlo.

El art. 15 de la Carta obliga al Instituto a publicar sus propios indicadores con
metodología declarada. Se recomienda ir más allá y **adoptar voluntariamente el
espíritu de ese estándar desde la Generación I**, publicando matrícula, retención,
graduación y resultado de auditoría con la misma plantilla en cada periodo. Es
barato, es verificable y sitúa al Instituto en una posición que casi nadie ocupa en
el mercado hispanohablante.

Lo que el Instituto **no** hará, por el art. 18 de la Carta, es publicar tasas de
inserción laboral que no pueda auditar ni prometer salarios.

---

## PARTE III · POSICIONAMIENTO

### 7 · La proposición en una frase

> **Cuatro meses, dos días a la semana, gratis, para salir con tu emprendimiento
> digital montado: la plataforma funcionando, la marca, y el negocio pensado.**
>
> Programación, herramientas modernas de inteligencia artificial y emprendimiento.
> Diez plazas. Sin coste de ningún tipo. Sábados y domingos de 15:00 a 17:00 UTC.

#### 7.1 · Cómo se nombra, y cómo no

El art. 18 bis de la Carta lo convierte en norma, y aquí está el motivo comercial.

| Se dice | No se dice | Por qué |
|---|---|---|
| «Programación, IA y emprendimiento» | «Curso de IA» | Atraería a quien busca una moda y decepcionaría a quien quiere construir algo. Además sería falso: la IA es la herramienta, no el objeto. |
| «Aprenderás a dirigir y auditar el código que escriben los agentes» | «Aprenderás a programar» | Es lo que de verdad ocurre, y es más difícil y más valioso que lo segundo. |
| «Saldrás con la estructura base de tu emprendimiento» | «Saldrás siendo desarrollador» | El D2 §3.3 lo prohíbe expresamente. |
| «Diez plazas, gratis, y hay que trabajar ocho horas por semana» | «Formación gratuita y flexible» | La exigencia declarada filtra mejor que cualquier prueba de admisión. |

**El posicionamiento en una frase para uso interno:** *no vendemos un curso de
inteligencia artificial; damos bases técnicas, uso serio de herramientas modernas y el
empujón para dar los primeros pasos de un negocio propio.*

### 8 · Los siete diferenciadores defendibles

Un diferenciador es defendible si un competidor no puede copiarlo en un trimestre.

| # | Diferenciador | Por qué es difícil de copiar |
|---|---|---|
| **1** | **El proyecto es un negocio real, no un ejercicio.** Se define en la semana 2 y se construye durante catorce semanas, marca y modelo de negocio incluidos. | Exige rediseñar el currículo entero alrededor de la Transferencia semanal. |
| **2** | **Forma arquitectos, no programadores.** Enseña a especificar, dirigir y auditar agentes de IA, que es el perfil escaso en 2026, en lugar de competir por formar a quien escribe código a mano. | Exige una posición pedagógica argumentada y un mecanismo de verificación de autoría que casi nadie tiene. |
| **3** | **Defensa Aleatoria de Autoría** en lugar de vigilancia algorítmica. | Exige docentes que conozcan el código de cada estudiante. No escala por software. |
| **4** | **Escalera de IA declarada y auditada**, ni prohibición ni barra libre. | Exige una posición pedagógica argumentada y sostenida contra la moda. |
| **5** | **Auditoría Técnica con umbrales públicos** alineada al Acta Europea de Accesibilidad. | Exige que el propio instituto opere a ese nivel. Elysium λ ya lo hace con clientes. |
| **6** | **Gratuidad total como acción social**, sin tramos, sin becas parciales y sin versión reducida. | No se copia: se decide. Exige renunciar por completo al ingreso y financiar el programa con otra actividad. |
| **7** | **Aula de diez personas por decisión, no por falta de demanda.** | Es lo contrario de lo que hace un negocio educativo. Sostiene los seis anteriores, que a escala mayor dejarían de existir. |

### 9 · Lo que el Instituto no ofrece, y lo dice

Para que la promesa sea creíble hay que decir dónde termina: no hay garantía de
empleo, no hay bolsa de trabajo, no hay título oficial, no hay marcos de trabajo de
moda como eje del currículo, y no hay ruta rápida.

Y hay que decir con precisión qué son las cuatro horas: **el Instituto imparte
cuatro horas de clase a la semana, y el estudiante dedica otras cuatro por su
cuenta**. Son ocho horas semanales durante doce meses. Quien sólo pueda asistir a
las clases y no estudiar entre ellas no debe presentarse, porque el método no
funcionará para él y ocupará una de las diez plazas.

Declarar todo esto en la convocatoria reduce el número de solicitudes y aumenta la
retención, que es el intercambio correcto. En un programa gratuito lo es todavía
más: la plaza que ocupa quien no va a terminar es la plaza que no ocupó otra
persona.

---

## PARTE IV · EL PROBLEMA DEL HORARIO

### 10 · Planteamiento

Hay que elegir una franja de dos horas, sábado y domingo, que sirva
simultáneamente a catorce husos horarios efectivos, desde Tijuana (UTC−8 o −7)
hasta Guinea Ecuatorial (UTC+1), con un docente en Portugal. El fundador declaró
que su propia conveniencia horaria no es una restricción y que la variable a
optimizar es la del estudiantado. El problema se resuelve, por tanto, como una
**maximización de utilidad agregada ponderada**.

### 11 · Modelo

**Variable de decisión.** Hora UTC de inicio del bloque de dos horas, idéntica
sábado y domingo, para no fragmentar el hábito.

**Función de utilidad.** A cada hora local se le asigna una utilidad pedagógica en
el intervalo [0, 1], construida sobre tres componentes:

1. **Curva base de disponibilidad y estado cognitivo en fin de semana.** Nula antes
   de las 06:00; ascendente hasta las 09:00; máxima de 09:00 a 12:00 y de 15:00 a
   20:00; decreciente a partir de las 20:00; residual después de las 22:00.
2. **Penalización por comida principal**, con ventana propia por región cultural,
   porque el almuerzo de fin de semana es un ritual familiar y no un hueco libre:
   Iberia 14:00–16:00, México 14:00–16:00, Cono Sur 13:00–14:30, Andes 12:30–14:00,
   Centroamérica y Caribe 12:00–13:30.
3. **Penalización por tope social nocturno**, distinto por región.

**Ponderación.** Se evalúan **dos** ponderaciones independientes para comprobar la
robustez del resultado: (a) población hispanohablante por huso, y (b) demanda
esperada de formación técnica en línea, que sobrepondera España, México, Colombia,
Argentina, Perú y Chile. El resultado es idéntico en ambas, lo que es un indicio
fuerte de que no depende de los supuestos de demanda.

**Regímenes estacionales.** Se evalúan por separado el invierno boreal
(noviembre–marzo, Lisboa en UTC+0) y el verano boreal (abril–octubre, Lisboa en
UTC+1), incorporando además los regímenes propios de Chile y de Cuba. Paraguay se
modela en **UTC−3 permanente** conforme a la ley que eliminó el cambio estacional
en 2024.

**Especificación completa.** El modelo es un programa de unas 120 líneas cuya
implementación se conserva en el repositorio del Instituto. Se publica para que
cualquiera pueda cambiar los supuestos y comprobar si el resultado cambia.

### 12 · Resultado

Barrido de todas las horas UTC candidatas, con paso de 30 minutos:

| Inicio UTC | Índice combinado | Peor caso |
|:---:|:---:|---|
| 13:00 | 0,751 | Tijuana 05:00 · inviable |
| 14:00 | 0,915 | Tijuana 06:00 · muy malo |
| 14:30 | 0,916 | Tijuana 06:30 · muy malo |
| **15:00** | **0,924** | **Tijuana 07:00 · aceptable** |
| 15:30 | 0,908 | Tijuana 07:30 |
| 16:00 | 0,835 | Cono Sur 13:00–15:00 · comida |
| 17:00 | 0,777 | Caribe y Andes en plena comida |
| 18:00 | 0,806 | Centroamérica 12:00 · comida |
| 22:00 | 0,837 | España 23:00–01:00 · inviable |

**Óptimo: 15:00–17:00 UTC**, con margen claro sobre las alternativas y con el
mismo ganador bajo las dos ponderaciones y los dos regímenes estacionales.

### 13 · Decisión de anclaje: UTC fijo todo el año

Se compararon dos políticas:

| Política | Índice invierno | Índice verano | Media |
|---|:---:|:---:|:---:|
| **A · 15:00 UTC fijo** (América Latina nunca cambia; Iberia se desplaza) | 0,928 | 0,931 | **0,929** |
| B · 16:00 Lisboa fijo (Iberia estable; América Latina se desplaza) | 0,845 | 0,931 | 0,888 |

**Se adopta la política A.** La razón es estructural: la mayor parte del mundo
hispanohablante **abolió el cambio de hora estacional**, mientras que Portugal y
España lo mantienen. Anclar a UTC hace que el desplazamiento lo absorban las dos
únicas zonas que sí cambian de hora, y que además son las del docente. Es también
la política más simple de comunicar: *la clase es siempre a las 15:00 UTC*.

### 14 · Tabla de conversión oficial

#### 14.1 · Invierno boreal · noviembre a marzo

| Huso | Territorios | Hora local | Valoración |
|:---:|---|---|:---:|
| UTC−8 | Tijuana y Baja California, Pacífico de EE. UU. | 07:00–09:00 | Temprano |
| UTC−7 | Pacífico de México, Baja California Sur | 08:00–10:00 | Bien |
| UTC−6 | **México (centro), Guatemala, El Salvador, Honduras, Nicaragua, Costa Rica** | **09:00–11:00** | **Óptimo** |
| UTC−5 | **Colombia, Perú, Ecuador, Panamá, Cuba, Quintana Roo** | **10:00–12:00** | **Óptimo** |
| UTC−4 | Venezuela, Bolivia, República Dominicana, Puerto Rico | 11:00–13:00 | Muy bien |
| UTC−3 | **Argentina, Uruguay, Paraguay, Chile** | **12:00–14:00** | Aceptable · roza la comida |
| UTC+0 | **Portugal (sede)** | **15:00–17:00** | Óptimo |
| UTC+1 | **España**, Guinea Ecuatorial | **16:00–18:00** | Óptimo |

#### 14.2 · Verano boreal · abril a octubre

| Huso | Territorios | Hora local | Valoración |
|:---:|---|---|:---:|
| UTC−7 | Tijuana, Pacífico de México y de EE. UU. | 08:00–10:00 | Bien |
| UTC−6 | **México (centro) y Centroamérica** | **09:00–11:00** | **Óptimo** |
| UTC−5 | **Colombia, Perú, Ecuador, Panamá** | **10:00–12:00** | **Óptimo** |
| UTC−4 | Venezuela, Bolivia, Chile, Caribe | 11:00–13:00 | Muy bien |
| UTC−3 | **Argentina, Uruguay, Paraguay** | **12:00–14:00** | Aceptable · roza la comida |
| UTC+1 | **Portugal (sede)** | **16:00–18:00** | Óptimo |
| UTC+2 | **España**, Guinea Ecuatorial | **17:00–19:00** | Óptimo |

### 15 · Los dos perjuicios reconocidos y su compensación

Ningún horario satisface a todos. El modelo identifica exactamente a quién
perjudica y el Instituto lo compensa por diseño en lugar de ocultarlo.

| Perjudicado | Perjuicio | Compensación |
|---|---|---|
| **Cono Sur** (Argentina, Uruguay, Paraguay, Chile en verano austral) | La franja 12:00–14:00 invade la comida familiar del fin de semana. | **Asistencia diferida** del art. 44.2 de la Carta, hasta el 25 % de las sesiones, con grabación y parte de sesión. Tutoría opcional los martes a las 22:00 UTC. |
| **Pacífico norte** (Tijuana, Baja California, diáspora en la costa oeste de EE. UU.) | 07:00–09:00 en invierno boreal es temprano. | Mismo mecanismo de asistencia diferida. Además es la zona con menor peso de matrícula esperada, lo que hace el compromiso defendible. |

### 16 · Transiciones de horario en el calendario de la Generación I

Se anuncian por escrito la semana previa. Con el anclaje a UTC, **ninguna afecta a
América Latina continental**: sólo se desplaza el reloj de pared de quienes viven en
un territorio que todavía cambia de hora.

| Fecha | Semana | Qué ocurre |
|---|:---:|---|
| 14-III-2027 | 10 | Estados Unidos y Cuba adelantan. |
| 28-III-2027 | **receso** | Europa adelanta. **Cae en el receso de Semana Santa**, sin efecto lectivo. |
| 4-IV-2027 | 12 | Chile retrasa. Pasa de 12:00 a 11:00 local. |
| 5-IX-2027 | 33 | Chile adelanta. |
| 31-X-2027 | 41 | Europa retrasa. Lisboa pasa a 15:00 y Madrid a 16:00. |
| 7-XI-2027 | 42 | Estados Unidos y Cuba retrasan. |

**Dos ventajas del año natural.** La primera: el cambio europeo de primavera cae
dentro del receso de Semana Santa, de modo que ninguna sesión se ve afectada por él.
La segunda: el Demo Day del 18 y 19 de diciembre queda a siete semanas de la última
transición, sin nota al pie. En el calendario de octubre que se estudió primero, la
sustentación caía exactamente el día del cambio europeo, que era el error operativo
más previsible de todo el programa.

### 17 · Calendario académico

#### 17.1 · La regla permanente

**El año académico coincide con el año natural** (Carta, disp. trans. 2.ª). El
Cuatrimestre 1 inicia el **segundo sábado de enero** y el Cuatrimestre 3 cierra el
**tercer sábado de diciembre**. De ahí la correspondencia que da nombre a los
cuatrimestres, y que el calendario anterior no tenía:

| Cuatrimestre | Meses | Semanas |
|:---:|---|:---:|
| **C1** | enero a mayo | 1–16 |
| **C2** | mayo a agosto | 17–32 |
| **C3** | septiembre a diciembre | 33–48 |

**El coste, dicho una vez y por escrito.** Cuarenta y ocho semanas lectivas dentro de
un año natural dejan sitio para **dos fines de semana de receso**, y no más. Se
asignan a la Semana Santa y a la transición del C2 al C3. En consecuencia, **el C2 y
el C3 se imparten en dieciséis fines de semana consecutivos cada uno**. La salida, si
resulta insostenible, está estudiada: adelantar el arranque al primer sábado de
enero libera un tercer receso, a cambio de empezar el día siguiente al de Año Nuevo.

#### 17.2 · Generación I (Λ01)

| Bloque | Desde | Hasta | Semanas |
|---|---|---|:---:|
| **Módulo 0** (asíncrono, sin docente) | 28-XI-2026 | 8-I-2027 | 6 |
| **Nivel I** · semanas 1–5 | 9-I-2027 | 7-II-2027 | 5 |
| **Nivel II** · semanas 6–10 | 13-II-2027 | 14-III-2027 | 5 |
| Receso de Semana Santa | 27-III-2027 | 28-III-2027 | 1 |
| **Nivel III** · semanas 11–15 | 20-III-2027 | 25-IV-2027 | 5 |
| **Demo Day y sustentación** | **1-V-2027** | **2-V-2027** | 1 |

Convocatoria en septiembre de 2026, resolución en noviembre, Módulo 0 en diciembre.

#### 17.3 · Ciclo anual de la convocatoria

| Mes | Acción |
|---|---|
| **Septiembre** | Publicación de la convocatoria, de la rúbrica de selección y del número de plazas |
| **Octubre** | Dos sesiones informativas en directo, en la franja de **15:00 UTC** |
| **Primera semana de noviembre** | Cierre de solicitudes y Prueba de Disposición λ |
| **Noviembre** | Entrevistas de 20 minutos y **resolución motivada a todas las personas candidatas** |
| **28 de noviembre a 8 de enero** | **Módulo 0** |
| **Segundo sábado de enero** | Arranque |

#### 17.4 · Generación Piloto (Λ00)

| Bloque | Desde | Hasta | Semanas |
|---|---|---|:---:|
| **Semanas 1 a 8 del programa** | 12-IX-2026 | 1-XI-2026 | 8 sin receso |
| Corrección de materiales y convocatoria | 2-XI-2026 | 8-I-2027 | — |

Cinco o seis personas por invitación directa, sin certificado y sin investigación
(Carta, disp. trans. 3.ª). Cubre el Nivel I completo y las tres primeras semanas del
Nivel II. **El año 2026 se dedica íntegramente a preparar el programa.**

#### 17.5 · La segunda generación anual, si se abre

El formato de dieciséis semanas permite una segunda cohorte de **septiembre a
diciembre**, que el art. 41 no impide porque nunca habría dos aulas simultáneas. El
Consejo Académico sólo debe abrirla si la carga de la primera lo permitió, y la
decisión se toma con los datos de la Generación I sobre la mesa, no antes.

---

---

## PARTE V · COSTE DEL PROGRAMA Y SU FINANCIACIÓN

> Esta parte sustituye íntegramente a la estructura de precios de la versión 1.0.0.
> El programa es **gratuito para el estudiante** (Carta, art. 2 bis) y por tanto no
> tiene ingresos, no tiene facturación, no tiene reembolsos y no tiene régimen de
> impuesto indirecto sobre matrícula. Lo que sí tiene es **coste**, y el art. 63 de
> la Carta obliga a declararlo y publicarlo cada año.

### 18 · Qué significa exactamente «gratuito»

| Concepto | Quién lo paga |
|---|---|
| Docencia, materiales, evaluación, tutoría, auditoría, certificado | **Elysium λ Development & Research** |
| Entorno de desarrollo en la nube durante el programa | **Elysium λ Development & Research** |
| Alojamiento del proyecto durante 12 meses tras graduar | **Elysium λ Development & Research** |
| Depósito de datos, código y preprint de la investigación | **Elysium λ Development & Research** |
| Ordenador y conexión a internet del estudiante | El estudiante (requisito de admisión, art. 29.3) |
| Dominio propio del proyecto, si lo quiere | El estudiante, opcionalmente y después de graduar |

No hay matrícula, mensualidad, cuota de examen, coste de materiales, ni «versión
premium» de nada. No existe tampoco la figura de la beca parcial, porque no existe
la figura del pago: **todas las plazas son gratuitas y por tanto ninguna es una
beca**. La palabra correcta es acción social, no beca, y el paquete la usa así de
forma deliberada.

### 19 · Coste monetario anual de una generación

Supuestos: un aula de doce personas, 16 semanas lectivas más el Módulo 0, una sola
cohorte simultánea.

| Concepto | Importe por generación |
|---|---:|
| Plataforma de videoconferencia y aula virtual con subtitulado | 150 € |
| Servicios en la nube para entornos de laboratorio y Módulo 0 | 250 € |
| Herramientas de auditoría y licencias de desarrollo | 400 € |
| **Auditor externo de defensas** (12 sustentaciones) | 600 € |
| **Miembro externo del Comité de Ética** | 600 € |
| Depósito de datos, código y preprint | 0 € |
| Alojamiento de los proyectos graduados durante 12 meses | 250 € |
| **Total en dinero** | **≈ 2 250 €** |

**Partida de riesgo declarada.** Si la revista de destino exige tasa de publicación
en acceso abierto, el importe puede oscilar entre **0 y 2 000 €** según el foro. El
Instituto prioriza destinos sin tasa o con exención, y en el peor caso el preprint
ya está publicado sin coste, de modo que el resultado científico está asegurado con
independencia de esa partida (D8 §15).

### 20 · Coste en tiempo donado

Es la partida grande y la que suele omitirse en los proyectos de acción social. El
art. 63.4 de la Carta obliga a declararla.

| Actividad | Horas por generación |
|---|---:|
| Docencia síncrona (32 sesiones de 2 h) | 64 h |
| Preparación de sesiones y materiales (primera generación) | 110 h |
| Retroalimentación escrita en 7 días, 12 estudiantes | 60 h |
| Tutorías individuales (5 por estudiante) | 17 h |
| Defensas Aleatorias de Autoría (4 por estudiante) | 8 h |
| Auditorías técnicas y sustentaciones | 20 h |
| Acompañamiento del Módulo 0 | 12 h |
| **Total del cuatrimestre** | **≈ 291 h ≈ 13 h por semana lectiva** |
| Investigación del profesorado, **fuera del periodo lectivo** (D8 §8) | 90 h |
| **Total anual con una generación** | **≈ 381 h** |

A partir de la segunda generación, la preparación de materiales cae en torno a un
70 %, de modo que el cuatrimestre baja a unas **215 h**. La generación piloto Λ00
existe precisamente para adelantar esa producción.

**Lectura honesta.** El paso de 48 a 16 semanas reduce la carga anual del fundador de
unas 740 horas a unas 381, y concentra las 291 horas lectivas en cuatro meses en
lugar de doce. Es la razón principal del cambio de formato, y las 90 horas de
investigación caen deliberadamente en verano, fuera del aula. Cualquier decisión
futura que amplíe el número de estudiantes o abra una segunda generación anual debe
partir de esta tabla.

### 21 · Sostenibilidad y salvaguardas

**Fuente de financiación.** La actividad comercial de Elysium λ Development &
Research. El programa se dimensiona para que su coste monetario sea marginal
respecto a esa actividad, de modo que un mal trimestre comercial no obligue a
interrumpir una generación en curso. **Compromiso operativo:** el coste de las 48
semanas se provisiona íntegro antes de abrir la convocatoria.

**Las tres salvaguardas del art. 63.** Se repiten aquí porque son la parte del
diseño que más fácilmente se erosiona con el tiempo:

1. **Ninguna plaza, calificación ni certificado** se condiciona a la contratación de
   servicios de la empresa.
2. **Ninguna oferta comercial** se dirige a un estudiante mientras lo sea, y al
   graduado sólo después de emitido su certificado y nunca por quien lo evaluó
   (art. 63 bis).
3. **El marco muestral de la investigación no se usa como lista de prospectos**
   (D8 §13.1). Mil doscientas auditorías de pymes son mil doscientos clientes
   potenciales, y confundir ambas cosas destruiría a la vez la credibilidad
   científica y la del programa.

**Patrocinio.** Admisible sólo sin contrapartida y sin influencia sobre currículo,
selección ni línea de investigación, y siempre declarado con su importe.

### 22 · Qué cambia respecto al reconocimiento oficial

La gratuidad modifica dos de los argumentos regulatorios de la versión anterior:

| Asunto | Antes (programa de pago) | Ahora (acción social) |
|---|---|---|
| **Exención de IVA por certificación DGERT** | Argumento económico principal | **Deja de aplicar.** Sin ingresos no hay impuesto que eximir. |
| **Certificación DGERT** | Motivada por el ahorro fiscal | **Sigue siendo prioritaria, por otro motivo**: es requisito para acceder a financiación pública de formación, y esa financiación es exactamente lo que un programa gratuito necesita para sostenerse sin depender de un solo pagador privado. |
| **Tributación indirecta transfronteriza** | Riesgo alto, requería asesoría | **Deja de aplicar** al no haber venta de servicio. |
| **Derecho de desistimiento del consumidor** | 14 días con reembolso | **Deja de aplicar** al no haber contrato oneroso. Se sustituye por la retirada libre del art. 65. |
| **Uso del término «instituto» y del certificado** | Riesgo alto | **Riesgo alto e inalterado.** La gratuidad no autoriza a describir como titulación lo que no lo es. Sigue siendo la revisión legal más urgente. |

---

## PARTE VI · SELECCIÓN, RIESGOS E INDICADORES

### 23 · De embudo comercial a proceso de selección

Un programa gratuito de diez plazas no tiene embudo de captación: tiene **un
problema de justicia distributiva**. La pregunta ya no es cómo conseguir treinta
matrículas, sino cómo elegir diez personas entre muchas más de forma que la decisión
resista el escrutinio de quien no fue elegido.

#### 23.1 · Calendario de la convocatoria

El ciclo anual completo está en el §17.3. En resumen: convocatoria en septiembre,
sesiones informativas en octubre, cierre y prueba en noviembre, resolución motivada
en diciembre, arranque el segundo sábado de enero.

#### 23.2 · Volumen previsto

Cifras de planificación, no promesas. Se revisarán con datos reales tras la primera
convocatoria.

| Etapa | Generación I (previsión) |
|---|---:|
| Personas que ven la convocatoria | 5 000 – 15 000 |
| Solicitudes iniciadas | 150 – 400 |
| Solicitudes completas con Prueba de Disposición | 60 – 150 |
| Entrevistas realizadas | 25 – 35 |
| **Plazas ofrecidas** | **12** |
| **Plazas ocupadas** | **10 – 12** |

Se ofrecen doce plazas para un aula ideal de diez, previendo dos renuncias antes del
arranque. Si se ocupan las quince del máximo, no se amplía: se cierra la
convocatoria (Carta, art. 41).

#### 23.3 · La rúbrica de selección

Pública desde la apertura de la convocatoria, y aplicada sin excepción.

| Criterio | Peso | Qué se valora | Qué **no** se valora |
|---|:---:|---|---|
| **Disposición demostrada** | 30 % | Resultado en la Prueba de Disposición λ: razonamiento lógico y comprensión lectora técnica | Conocer ya un lenguaje de programación |
| **Viabilidad horaria real** | 25 % | Que las 8 h semanales existan de verdad en su vida, no como buena intención | Disponibilidad total; se busca a quien trabaja |
| **Situación de acceso** | 25 % | Distancia real que le separa de una oportunidad equivalente por otra vía: renta, geografía, cargas familiares, ausencia de red profesional | La necesidad declarada sin contexto |
| **Claridad del proyecto** | 20 % | Que sepa qué quiere construir y para quién, aunque sea de forma imperfecta | Que la idea sea brillante o novedosa |

**Regla explícita:** el conocimiento previo de programación **no puntúa**. Puntuarlo
convertiría un programa de acción social en un premio a quien ya tuvo oportunidades
(Carta, art. 64.2).

**Devolución obligatoria.** Toda persona no admitida recibe la razón concreta de su
no admisión y qué la haría admisible el año siguiente. Es la parte más costosa del
proceso en tiempo y la que más define el carácter del Instituto.

### 24 · Difusión, por orden de retorno esperado

No es marketing: es alcanzar a quien la rúbrica del §23.3 quiere encontrar, que por
definición es quien menos expuesto está a este tipo de convocatorias.

1. **Organizaciones de base**: asociaciones de personas autónomas, cooperativas,
   entidades de inclusión digital, bibliotecas públicas y centros comunitarios de los
   países objetivo. Es el canal que mejor correlaciona con el criterio de acceso.
2. **Las instituciones asociadas**, para difusión y sólo para difusión, con el límite
   del art. 8.5 de la Carta: difundir no es avalar.
3. **El propio sitio y el portafolio de Elysium λ**, que demuestra en producción lo
   que el programa enseña.
4. **Contenido técnico en abierto**: auditorías reales de accesibilidad publicadas con
   su metodología, que además preparan la línea de investigación.
5. **Comunidades hispanohablantes de desarrollo**, útiles pero sesgadas hacia quien
   ya está dentro del sector; se usan con conciencia de ese sesgo.
6. **Referencia de graduados**, operativa desde la Generación II.

### 25 · Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
|---|:---:|:---:|---|
| **Todo el programa depende de una sola persona.** | Alta | **Muy alto** | Grabación íntegra; materiales escritos completos; generación piloto Λ00 que los prueba un año antes; tutores pares reclutados entre los pilotos; docente suplente identificado antes de enero de 2027. |
| Las 13 h semanales donadas resultan insostenibles junto a la actividad comercial | **Media** | Alto | Aula de diez y no de treinta; una sola generación simultánea; materiales reutilizables desde Λ00; revisión de carga al cierre de cada cuatrimestre con facultad de reducir alcance antes que calidad. |
| La gratuidad eleva el abandono por ausencia de compromiso económico | Media | Alto | Las cuatro anclas no económicas del D1 §8.0 y la selección estricta del §23.3. |
| Percepción de arbitrariedad en la selección | Media | Alto | Rúbrica pública anterior a la convocatoria, devolución motivada individual, archivo de decisiones a disposición del Comité de Ética. |
| Confusión con una titulación oficial | Media | **Muy alto** | Art. 8 de la Carta aplicado a web, convocatoria y certificado. Revisión legal previa. |
| Conflicto de interés al convertir estudiantes en clientes | **Media** | **Muy alto** | Art. 63 bis, auditado por el Comité de Ética cada generación. La gratuidad **aumenta** este riesgo en lugar de reducirlo, porque deja la conversión comercial como única vía de retorno imaginable. |
| El artículo no se acepta en revista | Media | Bajo | El compromiso es publicar **preprint** y **enviar**. El preprint con identificador persistente asegura el resultado. |
| No se cubren las 10 plazas | Baja | Medio | Umbral mínimo de apertura: **6 estudiantes**. Por debajo se aplaza un año y se comunica públicamente el motivo. |
| Cambio de condiciones de un proveedor en la nube | Media | Medio | Regla de sustituibilidad del D2 §11. |

### 26 · Indicadores y metas de la Generación I

Se publican conforme al art. 15 de la Carta, con metodología declarada y sin
cambiarla entre periodos. Las metas de retención son **más altas** que las de un
programa de pago, porque la selección es más estricta y el grupo mucho más pequeño;
si no se cumplen, la conclusión no será que los estudiantes fallaron.

| Indicador | Meta Generación I | Cómo se mide |
|---|:---:|---|
| Plazas ocupadas al arranque | ≥ 10 | Compromisos λ firmados |
| Retención al final de C1 | ≥ **85 %** | Matrícula activa en la semana 16 |
| Retención al final de C2 | ≥ **75 %** | Matrícula activa en la semana 32 |
| Graduación sobre plazas ocupadas | ≥ **70 %** | H3 superado |
| Superación de la ATE en primer intento (H3) | ≥ 70 % | Informe del Comité de Auditoría Técnica |
| Proyectos en producción a los 6 meses de graduar | ≥ 60 % | Comprobación de URL viva |
| Coautoría acreditada | ≥ 90 % de los graduados | Registro CRediT del preprint |
| Preprint publicado con identificador persistente | **Sí / No** | Binario, sin matices |
| Satisfacción con el horario (ítem 8 de la encuesta) | ≥ 4,0 / 5 | Encuesta de percepción λ |
| **Coste monetario por estudiante graduado** | Publicado, sin meta | Coste total ÷ graduados |
| **Horas donadas por estudiante graduado** | Publicado, sin meta | Horas totales ÷ graduados |
| Personas no admitidas que recibieron devolución motivada | **100 %** | Registro de la convocatoria |

Los dos indicadores de coste se publican **sin meta asociada** de forma
deliberada: su función no es optimizarse a la baja, sino hacer visible qué cuesta
realmente formar a una persona de este modo. Un programa de acción social que
persiguiera abaratar ese número acabaría recortando exactamente aquello que lo hace
valioso.

### 27 · Fuentes

- Informes de mercado de tecnología educativa en América Latina y a nivel global
  (IMARC, Fortune Business Insights, Business Research Insights, 2025–2026). Usados
  como indicio de tendencia, no como dato, por las razones de la advertencia inicial.
- Páginas públicas de precios y resultados de 4Geeks Academy, Le Wagon, Ironhack,
  Platzi, Henry y Laboratoria, consultadas en agosto de 2026.
- Council on Integrity in Results Reporting: estándares de reporte y datos
  publicados de escuelas miembro.
- DGERT (Portugal): requisitos y guía de certificación de entidades formadoras.
- Recomendación del Consejo de la UE de 16 de junio de 2022 sobre microcredenciales.
- Directiva (UE) 2019/882 y norma EN 301 549.
- Ley n.º 7354 de 2024 de Paraguay, que establece el huso UTC−3 permanente.
- Modelo horario propio: `horario.py`, conservado en el repositorio del Instituto
  con sus supuestos y su barrido completo.

---

*Elysium λ Institute of Development & Research · D7 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# D8 · Protocolo de Investigación del Profesorado

<p class="doc-sub">El estudio que dirige la Dirección Académica</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/ELYSIUM-RESEARCH-PROTOCOL.md</code></p>

> **Qué cambió y por qué.** La versión anterior de este documento diseñaba una
> investigación **que cargaban los estudiantes**: auditar seiscientos sitios,
> redactar secciones, revisar por pares. Eso era viable en un programa de 48 semanas
> y dejó de serlo al pasar a 16. Pedir trabajo científico a personas que llevan diez
> semanas programando, dentro de un presupuesto de 128 horas, habría sido injusto y
> habría producido mala ciencia. Aquel diseño queda derogado y archivado.
>
> **Qué es ahora.** La investigación **sale del plan de estudios y pasa al
> profesorado**. La conduce y la firma la Dirección Académica. Los estudiantes son
> sujetos anónimos y voluntarios, no coautores, y su carga de trabajo es
> prácticamente nula: veinte minutos en todo el programa (§4.4).
>
> **Compromiso declarado, en tres frases exactas.**
>
> 1. El Instituto **sí se compromete a publicar** un **preprint con identificador
>    persistente**, junto con los datos anonimizados y el código de análisis.
> 2. El Instituto **sí se compromete a enviar** el manuscrito a una revista o
>    congreso del área.
> 3. El Instituto **no se compromete a que lo acepten**. La revisión por pares tarda
>    entre seis y doce meses y su resultado no está en nuestras manos (Carta,
>    art. 18).
>
> Este documento lo aprueba y lo reforma el **Comité de Ética e Integridad
> Científica** (Carta, arts. 22 y 68).

---

## PARTE I · PRINCIPIOS

### 1 · La regla de carga cero

> **Ninguna actividad de esta investigación puede añadir trabajo al estudiante más
> allá de veinte minutos en las dieciséis semanas.**

Es la regla que hace legítimo el estudio, y se cumple por diseño y no por buena
voluntad: **casi todos los datos ya existen** porque el modelo académico los produce
por razones pedagógicas propias. Las predicciones de PRIMM se recogen desde la
semana 1 porque son un espejo metacognitivo para el estudiante; las declaraciones
`AI-USE.md` existen porque el artículo 53 de la Carta las exige; las Defensas
Aleatorias de Autoría se convocan porque son el mecanismo de integridad; y la
predicción de la puntuación de auditoría antes de mirar el informe está en el
syllabus porque enseña calibración.

La investigación **no crea instrumentos nuevos: lee los que ya funcionan**. Ese es
todo su mérito metodológico y toda su justificación ética.

### 2 · Los cinco principios

1. **Carga cero para el estudiante** (§1).
2. **Ningún dato influye en ninguna calificación.** El análisis se ejecuta
   **después** de emitidos los certificados (§6.2). Es la salvaguarda central del
   doble rol de docente e investigador.
3. **Participación voluntaria y revocable** en cualquier momento, sin consecuencia
   académica y sin dar explicaciones.
4. **Preinscripción antes de mirar los datos**, y publicación de los resultados
   adversos con la misma diligencia que los favorables.
5. **Datos anonimizados, código y preprint abiertos**, con identificador persistente.

### 3 · Por qué esta pregunta y no otra

El programa aplica una intervención poco común y perfectamente documentada: una
**escalera de uso de IA con cuatro niveles crecientes**, declarada por escrito, con
fecha de apertura conocida y con contrapesos explícitos. Casi nadie tiene eso. La
literatura de 2024 a 2026 sobre programadores novatos y modelos generativos
converge en un hallazgo incómodo: el efecto **no es uniforme, es divergente**. Quien
tiene buena regulación metacognitiva mejora; quien no la tiene resulta perjudicado y
termina con **ilusión de competencia**. Lo que no está resuelto es si una
intervención estructurada puede corregir esa divergencia.

Ésa es exactamente la pregunta que este programa puede responder, porque su diseño
es la intervención.

---

## PARTE II · DISEÑO DEL ESTUDIO

### 4 · Especificación

#### 4.1 · Título de trabajo

> *Una escalera de uso declarado de inteligencia artificial en la enseñanza
> introductoria de programación: efecto sobre la brecha entre desempeño asistido y
> autónomo, la calibración metacognitiva y la autoría demostrable. Estudio
> longitudinal de cohortes.*

#### 4.2 · Preguntas de investigación

| Cód. | Pregunta |
|---|---|
| **PI-1** | ¿Cómo evoluciona a lo largo de las 15 semanas la **brecha** entre el desempeño en tareas sin asistencia (nivel N0) y el desempeño en tareas asistidas (N3 y N4)? |
| **PI-2** | ¿Mejora la **calibración metacognitiva**, medida como el error entre la puntuación de auditoría que el estudiante predice y la que obtiene? |
| **PI-3** | ¿La **calidad de la declaración `AI-USE.md`**, y en particular el número y la sustancia de los rechazos justificados, predice el resultado en la Defensa Aleatoria de Autoría? |
| **PI-4** | ¿Se observa **divergencia** entre estudiantes, es decir, que la apertura del nivel N3 beneficie a unos y perjudique a otros según su regulación metacognitiva inicial? |
| **PI-5** | ¿La clasificación de la Transferencia como *transferida* o *trasplantada* funciona como **indicador temprano** de un resultado adverso en la Defensa de Autoría? |

**PI-3 y PI-5 son las de mayor valor práctico.** Si se confirman, entregan al
profesorado de cualquier institución dos señales baratas y tempranas para detectar
delegación acrítica sin recurrir a vigilancia algorítmica, que es un problema abierto
y urgente en la educación en informática.

#### 4.3 · Hipótesis preinscritas

| Cód. | Hipótesis | Criterio de refutación |
|---|---|---|
| **H1** | La brecha N0 frente a N3 **no crecerá** significativamente tras la apertura del nivel N3 en la semana 6. | Un crecimiento significativo refuta H1 y sería evidencia en contra del diseño del programa. |
| **H2** | El error de calibración disminuirá entre la semana 5 y la semana 15. | Ausencia de disminución, o aumento, refuta H2. |
| **H3** | El número de rechazos justificados en `AI-USE.md` correlacionará positivamente con el resultado en la DAA. | Correlación nula o negativa refuta H3. |
| **H4** | Habrá divergencia: la regulación metacognitiva inicial moderará el efecto de la apertura de N3. | Ausencia de interacción significativa refuta H4. |
| **H5** | Al menos el 60 % de los resultados adversos en DAA habrá tenido una Transferencia marcada como *trasplantada* en las tres semanas previas. | Una proporción menor refuta H5. |

> **Sobre H1 y la honestidad del diseño.** H1 apuesta a favor del propio programa, y
> eso es un riesgo que se asume de forma expresa. Si la brecha crece, el resultado
> dice que la Escalera de IA no protege lo que dice proteger, y **se publica igual**
> (Carta, art. 15). Un instituto que sólo publica cuando sale bien no está
> investigando.

#### 4.4 · Los únicos veinte minutos que se piden

| Instrumento | Cuándo | Duración |
|---|---|:---:|
| Cuestionario de regulación metacognitiva, versión breve | Módulo 0 | 10 min |
| El mismo cuestionario, repetido | Semana 16, tras la sustentación | 10 min |

Nada más. Todo lo demás se lee de artefactos que el programa ya genera.

#### 4.5 · Variables y su procedencia

| Variable | De dónde sale | ¿Añade carga? |
|---|---|:---:|
| Desempeño no asistido | Quices `Q01`–`Q15`, todos a nivel N0 | No |
| Desempeño asistido | Laboratorios `L06`–`L15`, a N3 y N4 | No |
| **Brecha** | Diferencia tipificada entre ambos | No |
| Error de calibración | Puntuación de auditoría predicha menos obtenida, semanas 15 y anteriores | No |
| Calidad de la declaración de IA | Recuento y codificación de los rechazos en `AI-USE.md` | No |
| Resultado de autoría | Actas de las tres DAA | No |
| Tipo de transferencia | Clasificación *transferida* / *trasplantada* del D3 §7 | No |
| Regulación metacognitiva | Cuestionario breve, dos veces | **Sí, 20 min** |
| Covariables | Experiencia previa declarada, país, edad por tramos, resultado del Módulo 0 | No |

#### 4.6 · Diseño y muestra

**Diseño.** Longitudinal de cohorte, con medidas repetidas dentro de sujeto y
**replicación entre generaciones**. No hay grupo de control aleatorizado: sería
inviable y, sobre todo, sería poco ético, porque exigiría asignar a la mitad del
aula a un régimen de IA que el Instituto considera peor.

**Muestra.** De 10 a 15 personas por generación. Con dos generaciones al año, entre
20 y 30 sujetos en el primer año y entre 40 y 60 en el segundo.

> ### La limitación grande, declarada desde el protocolo
>
> **Esta muestra es pequeña y no permite inferencia poblacional.** El estudio se
> declara desde el principio como **exploratorio y de generación de hipótesis**, con
> énfasis en el análisis intra-sujeto y en la descripción densa, no en el contraste
> entre grupos. Los tamaños de efecto se reportan con intervalos de confianza amplios
> y sin afirmaciones causales.
>
> La solución no es exagerar lo que se tiene: es **acumular generaciones**. El valor
> del estudio a tres años está en la serie replicada, y el preprint de la Generación I
> se presentará explícitamente como primera entrega de esa serie.

#### 4.7 · Análisis

Modelos mixtos con el estudiante como efecto aleatorio y la semana como término
temporal, para PI-1 y PI-2. Correlación y regresión ordinal para PI-3. Término de
interacción con la regulación metacognitiva inicial para PI-4. Descriptiva con
intervalo de confianza para PI-5. Corrección de Benjamini-Hochberg. Todo análisis no
previsto aquí se etiqueta como **exploratorio** en el manuscrito.

---

## PARTE III · ÉTICA

### 5 · El doble rol, que es el problema central

La Dirección Académica es a la vez **quien enseña, quien califica y quien investiga**.
Esa concentración es el mayor riesgo del estudio y se mitiga con cuatro reglas duras:

| # | Regla | Verificable por |
|:---:|---|---|
| 1 | **El análisis no se ejecuta hasta que los certificados están emitidos.** Los datos se recogen automáticamente y quedan sellados sin abrir. | Marca temporal del repositorio de datos |
| 2 | **La participación no se conoce durante el curso.** El consentimiento lo custodia la Secretaría y no se comunica al docente hasta el cierre. | Registro de la Secretaría |
| 3 | **Ningún dato del estudio entra en ninguna decisión académica**, ni de calificación, ni de admisión, ni de recomendación. | Auditoría del CEIC |
| 4 | **Un miembro externo del CEIC revisa el protocolo y el manuscrito** antes del envío (Carta, art. 22). | Dictamen escrito |

### 6 · Consentimiento

Voluntario, explícito, separado del Compromiso λ, y **revocable en cualquier momento
sin dar explicaciones y sin consecuencia académica alguna**. Se firma en el Módulo 0.
Quien no participe cursa el programa exactamente igual y nadie lo sabrá.

Si se revoca después del sellado de datos, se eliminan las observaciones de esa
persona. Si se revoca después de publicado el preprint, se anota en el registro de
correcciones y se recalcula si procede.

### 7 · Datos personales

Seudonimización en el origen: la tabla que enlaza identidad con código de sujeto la
custodia la Secretaría, no la Dirección Académica, y se destruye al publicar. El
conjunto abierto no contiene país cuando el aula tenga menos de tres personas de esa
nacionalidad, para evitar reidentificación. Régimen aplicable: Reglamento (UE)
2016/679 y Ley n.º 8968 (Carta, art. 60).

---

## PARTE IV · CALENDARIO Y PUBLICACIÓN

### 8 · Cronograma, que es del profesorado y no del aula

| Momento | Actividad | Quién |
|---|---|---|
| **Sep–Oct 2026** | Redacción del protocolo y dictamen del CEIC | Dirección + CEIC |
| **Nov 2026** | **Preinscripción pública** del protocolo, antes de existir el primer dato | Dirección |
| Módulo 0 (dic 2026) | Consentimientos y cuestionario de línea base | Secretaría |
| **Sem. 1–16 (ene–may 2027)** | Recogida automática. **Cero intervención del investigador.** | Sistema |
| Semana 16 | Cuestionario final | Secretaría |
| **Tras emitir certificados** | Sellado y apertura de los datos | Secretaría → Dirección |
| **Jun–Ago 2027** | Análisis y redacción | Dirección |
| **Sep 2027** | Revisión del CEIC, **publicación del preprint** y envío | Dirección |
| 2027–2029 | Replicación con cada generación siguiente | Dirección |

**Carga para el fundador:** unas 90 horas concentradas en junio, julio y agosto, es
decir **fuera del periodo lectivo**. Ésa es la razón de que el análisis vaya después
del cuatrimestre y no en paralelo: proteger contra el agotamiento es criterio de
diseño de este protocolo, igual que lo es del académico.

### 9 · Autoría

| Posición | Quién | Criterio |
|---|---|---|
| **Primer autor** | Daniel Alonso Morales Ávila | Conceptualización, metodología, análisis, redacción |
| Coautoría | Quien contribuya sustantivamente en dos roles CRediT o más | Docentes o investigadores asociados, si los hubiera |
| Agradecimientos | Las generaciones participantes, **de forma colectiva y sin nombres** | Protección de los sujetos |

**Los estudiantes no firman.** No es un demérito: es la consecuencia de que sean
sujetos del estudio. Firmar el trabajo que los estudia comprometería a la vez su
libertad de participar y la validez del resultado (véase la versión archivada de este
documento, §3, donde se argumentó la separación por primera vez).

### 10 · Destino

| Prioridad | Destino | Por qué |
|:---:|---|---|
| **0** | **Preprint en repositorio abierto** | Garantiza el resultado. No depende de nadie. |
| 1 | Congreso internacional de investigación en educación en informática | Foro natural del tema; admite trabajos exploratorios bien declarados |
| 2 | Revista del área de educación en informática o de informática y educación | Recorrido más largo, mayor peso |
| 3 | Informe técnico del Instituto con identificador persistente | Red de seguridad. Siempre se publica. |

### 11 · Contingencias

| Si ocurre | Entonces |
|---|---|
| Consienten menos de 6 personas | Se publica como **estudio de casos múltiples**, con análisis cualitativo y sin inferencia. Sigue siendo publicable y honesto. |
| Todas las hipótesis se refutan | Se publica igual. Un resultado nulo sobre una intervención bien descrita es útil. |
| H1 se refuta, es decir, la brecha crece | **Se publica, y además se reforma el D1 §6 antes de la generación siguiente.** El protocolo existe para poder descubrir esto. |
| La generación no llega a la semana 16 | Se reporta con la mortalidad experimental declarada. |
| El foco de revisión rechaza | El preprint ya está publicado. Se atiende la crítica y se reenvía. |

---

## ANEXO · Consentimiento informado

```markdown
# Consentimiento · Estudio sobre el uso de IA en el aprendizaje · Generación ____

**Qué se estudia.** Cómo afecta al aprendizaje la forma en que este programa regula
el uso de la inteligencia artificial (la Escalera de IA, niveles N0 a N4).

**Qué se le pide.** Dos cuestionarios de diez minutos: uno en el Módulo 0 y otro
después de su sustentación. **Nada más.** El resto de la información procede de
trabajos que usted ya entrega como parte del programa.

**Qué NO ocurre.**
- Su participación **no afecta a ninguna calificación**, ni positiva ni negativamente.
- El docente **no sabrá si usted participa** hasta que el programa haya terminado y
  los certificados estén emitidos.
- Sus datos **no se publican con su nombre** ni con ningún dato que permita
  identificarle.
- Usted **no firma** el artículo, porque es sujeto del estudio y no investigador.

**Revocación.** Puede retirar este consentimiento cuando quiera, escribiendo a la
Secretaría Académica, sin dar explicaciones y sin ninguna consecuencia. Sus datos se
eliminarán del estudio.

  ☐ Consiento participar        ☐ No consiento participar

*(Marcar «no consiento» no tiene absolutamente ningún efecto sobre su experiencia en
el programa. Nadie del profesorado lo sabrá.)*

Nombre: ____________  Firma: ____________  Fecha: ____________
```

---

*Elysium λ Institute of Development & Research · D8 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# D9 · Protocolo del Trabajo Final de Graduación

<p class="doc-sub">De la idea de la semana 1 al emprendimiento de la 16</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/ELYSIUM-TFG-PROTOCOL.md</code></p>

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

## PARTE I · NATURALEZA Y ELECCIÓN

### 1 · Qué es el TFG Elysium λ

Una **plataforma web transaccional en producción**, propiedad del estudiante,
construida durante 16 semanas mediante la Transferencia dominical, auditada bajo
los umbrales de la Auditoría Técnica Elysium, acompañada de una memoria técnica y
defendida ante un panel con auditor externo.

No es una tesis. No es un prototipo. No es una demostración. Es un sistema que
funciona, que cumple la normativa aplicable y que alguien puede usar el lunes
siguiente a la graduación.

### 2 · Los cinco principios

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

### 3 · Los cinco arquetipos admisibles

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

### 4 · Criterios de admisibilidad

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

### 5 · La regla de los datos sensibles

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

## PARTE II · LAS CUATRO FASES

### 6 · Vista general

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

### 7 · Fase por fase

#### F0 · Preparación · Módulo 0

Trabajo asíncrono sin evaluación, en las seis semanas previas. Se entrega la nota de
una página *«el negocio que quiero construir»*. No es vinculante: su función es que
la semana 1 empiece con material sobre el que conversar.

#### F1 · Anteproyecto · Semanas 1 y 2

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

#### F2 · Construcción · Semanas 3 a 10

Las Transferencias `T03` a `T10` levantan la plataforma: sistema de tokens y
responsividad, modelo de dominio, validación accesible, capa de datos, colecciones en
la nube, operaciones completas, panel de administración, reglas de seguridad y
despliegue continuo con compuerta.

> **⚑ G2 · Modelo de datos aprobado.** Vence el domingo de la semana 8. **Bloquea el
> hito final.** Se **defiende oralmente a nivel N0**: la arquitectura de datos no se
> delega. Rúbrica en §11.4.

#### F3 · Transaccional y negocio · Semanas 11 a 15

Autenticación y roles, motor de disponibilidad y agenda accesible, función de
servidor con agente supervisado y carta de límites, cobro en modo de prueba,
expediente de cumplimiento, marca y descubrimiento, y endurecimiento con ataque
cruzado autorizado.

> **⚑ G3 · Auditoría Técnica final.** Vence el domingo de la semana 15. **Sin
> hallazgos críticos. Bloquea la defensa.**

**Congelación de funcionalidad:** al cierre de la semana 14 no se añaden funciones
nuevas. La semana 15 es sólo endurecimiento, remediación y memoria.

#### F4 · Defensa · Semana 16

Demo Day público el sábado y sustentación técnica el domingo, ante panel con auditor
externo (Carta, art. 23).

> **⚑ H · Graduación.** Rúbrica en §11.8.

### 8 · Cronograma de Transferencias

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

### 9 · Tutoría

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

### 10 · Qué hace y qué no hace el tutor

| Sí | No |
|---|---|
| Pregunta hasta que el estudiante encuentra el error | Escribe código en el proyecto del estudiante |
| Señala qué criterio de la rúbrica no se cumple | Rediseña la solución por él |
| Propone dos caminos y sus consecuencias | Elige el camino |
| Revisa el `AI-USE.md` y pregunta por los rechazos | Acepta una entrega sin declaración |
| Detiene un proyecto inviable a tiempo | Deja avanzar 30 semanas algo que no llegará |

---

## PARTE III · RÚBRICAS DE LAS COMPUERTAS

> Todas las rúbricas usan la escala del D3 §3. Aprobación en **70**. El estudiante
> las conoce antes de empezar la fase (D3, regla de publicidad anticipada).

### 11.1 · G1 · Carta de Anteproyecto

| Criterio | Peso | Insuficiente | Suficiente | Notable | Excelente |
|---|:---:|---|---|---|---|
| **Concreción del cliente** | 30 % | «Pymes» o «todo el mundo». | Segmento definido. | Cliente con nombre y contexto. | Cliente con nombre, contexto y una conversación real documentada. |
| **Problema** | 25 % | Enunciado como falta de web. | Problema de negocio identificado. | Problema con su coste actual estimado. | Coste estimado con evidencia o testimonio. |
| **Propuesta de valor** | 20 % | Genérica. | Clara en una frase. | Clara y diferenciada de los competidores. | Además, declara qué **no** hará. |
| **Análisis competitivo** | 15 % | Ausente. | Tres competidores listados. | Tres analizados con fortalezas y huecos. | Además, identifica el hueco que ocupará. |
| **Encaje con un arquetipo** | 10 % | No encaja o no lo declara. | Encaja. | Encaja y justifica la elección. | Encaja y anticipa las funciones que necesitará. |

### 11.2 · G2 · Modelo de datos

| Criterio | Peso | Umbral |
|---|:---:|---|
| Cobertura de consultas | 30 % | Las diez consultas previstas se resuelven con el esquema |
| Justificación de la desnormalización | 30 % | **Cada** decisión tiene una consulta que la motiva |
| Tipado y restricciones | 15 % | Todos los campos con tipo y obligatoriedad declarados |
| Estimación de volumen a 12 meses | 10 % | Presente y razonada |
| **Defensa oral a nivel N0** | 15 % | Explica por qué su esquema y no otro |

### 11.3 · Reglas de seguridad

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

### 11.4 · Expediente de cumplimiento

Se evalúa dentro del bloque `ATE-C` de la Auditoría Técnica final (G3), no como
compuerta separada.

| Criterio | Peso | Umbral |
|---|:---:|---|
| Registro de actividades de tratamiento | 25 % | Cada tratamiento con base legal, finalidad, plazo y destinatarios |
| Política de privacidad | 25 % | Describe la aplicación **real**, no una genérica |
| Términos, aviso legal y consentimiento de cookies | 25 % | Presentes, coherentes y con consentimiento previo efectivo |
| Ficha de ruta de formalización | 25 % | Pasos, órganos, costes y plazos, con **fuentes oficiales** |

### 11.5 · H · Graduación

| Componente | Peso |
|---|:---:|
| `ATE` completa sin hallazgos críticos (G3) | Requisito previo |
| **Producto**: plataforma transaccional completa y en producción | 35 % |
| **Memoria técnica** conforme a §14 | 25 % |
| **Sustentación técnica** ante panel (rúbrica del D3, Anexo III) | 25 % |
| **Pitch de Demo Day** | 15 % |

---

## PARTE IV · MEMORIA Y DEFENSA

### 12 · Naturaleza de la memoria

La memoria del TFG **no** es un informe académico convencional: es el **documento de
entrega que Elysium λ produce para un cliente real**, ampliado con la
justificación de las decisiones. Por eso su estructura reproduce los diez pasos del
**λ Development Framework Model** de la empresa. Quien escribe esta memoria está
practicando exactamente el entregable de su vida profesional.

### 13 · Extensión y formato

| Elemento | Especificación |
|---|---|
| Extensión | **12 a 20 páginas**, sin anexos. Se redujo con el programa: una memoria de cuarenta páginas sobre dieciséis semanas de trabajo sería relleno. |
| Lengua | Español; los términos técnicos en inglés cuando sea la forma canónica |
| Formato | Markdown en el repositorio, exportado a PDF accesible con estructura de encabezados y texto alternativo |
| Figuras | Diagramas propios; toda figura ajena, atribuida |
| Citas | Sistema uniforme, declarado al inicio |
| Anexos | Sin límite: código relevante, informes de auditoría, capturas |

### 14 · Estructura obligatoria

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

### 15 · Cómo se escribe una decisión de ingeniería

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

### 16 · La defensa

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

## PARTE V · PROPIEDAD, DATOS Y CASOS ESPECIALES

### 17 · Cambio de proyecto

Sólo se autoriza por el Consejo Académico y únicamente si concurre una de estas
causas: el cliente identificado desaparece; el proyecto resulta ilegal en su
jurisdicción; o el análisis de la fase F1 demuestra que el problema no existe. La
autorización es **imposible después de la semana 16**: a partir de ahí, el proyecto
se reorienta dentro del mismo dominio, no se sustituye.

### 18 · Proyecto para un cliente real de terceros

Está permitido y es la mejor opción cuando existe. Requisitos adicionales:

- **Acuerdo escrito** entre estudiante y cliente sobre propiedad, alcance y datos.
- El cliente entiende que se trata de un proyecto formativo y que el Instituto no
  garantiza el resultado ni asume responsabilidad.
- El estudiante actúa como **responsable o encargado del tratamiento** de los datos
  de ese cliente y asume las obligaciones correspondientes (Carta, art. 61.4).
- Si el cliente exige confidencialidad, la memoria se anonimiza y la defensa se
  celebra a puerta cerrada, con acta reservada. La galería pública puede omitirlo.

### 19 · Proyecto sin ánimo de lucro

Admisible en el arquetipo 4 o 5. La sección 12 de la memoria sustituye el modelo de
ingresos por el **modelo de sostenibilidad**: quién paga la infraestructura, quién
la mantiene y qué ocurre si la persona fundadora se retira. Es una pregunta más
difícil que la del lucro, no más fácil.

### 20 · Propiedad intelectual

El código, el diseño, la marca y el modelo de negocio **pertenecen íntegramente al
estudiante** (Carta, art. 57). El Instituto:

- **No adquiere** derecho patrimonial alguno.
- Recibe una licencia **no exclusiva, gratuita y revocable** de exhibición con
  atribución (art. 58), revocable con efecto en 30 días.
- **No incorpora** código del estudiante a sus productos comerciales.
- **No entrega** al estudiante el kit `elysium-core/` ni ningún código propietario:
  el estudiante reconstruye la especificación funcional con su propio código
  (D2 §12).

### 21 · Continuidad tras la graduación

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

## ANEXOS

### Anexo I · Carta de Anteproyecto (plantilla · máx. 2 páginas)

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

### Anexo II · Lista de comprobación previa a cada compuerta

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

### Anexo III · Acta de defensa

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




<div class="salto"></div>

# Anexo A · Modelo horario

<p class="doc-sub">Programa que determina la franja síncrona óptima para el mundo hispano</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/horario.py</code></p>

Este es el programa citado en el D7, Parte IV. Se reproduce completo para que cualquiera pueda cambiar sus supuestos y comprobar si el resultado cambia. Su ejecución produce el barrido de horas UTC, el ranking, la prueba de anclaje y las tablas de conversión local.

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Elysium λ Institute — Optimización del horario síncrono para el mundo hispano.

Modelo: se busca la hora UTC de inicio de un bloque síncrono de 2 h que maximice
la utilidad pedagógica agregada (ponderada por demanda esperada) sobre el conjunto
de husos horarios del mundo hispanohablante, en dos regímenes estacionales
(invierno y verano del hemisferio norte / horario europeo).
"""

# ---------------------------------------------------------------------------
# 1. Base de datos de países: (nombre, offset_invierno, offset_verano_europeo,
#    población hispanohablante en millones, perfil cultural)
#    offset_verano_europeo = offset local durante abr–oct (verano boreal)
# ---------------------------------------------------------------------------

# perfiles: centro de la comida principal (hora local) y hora de cierre social
PERFILES = {
    "iberico_es": {"almuerzo": (14.0, 16.0), "cena": (21.0, 23.0), "tope": 22.0},
    "iberico_pt": {"almuerzo": (13.0, 14.5), "cena": (20.0, 22.0), "tope": 22.0},
    "mexicano":   {"almuerzo": (14.0, 16.0), "cena": (20.5, 22.0), "tope": 22.0},
    "centroam":   {"almuerzo": (12.0, 13.5), "cena": (19.0, 20.5), "tope": 21.5},
    "andino":     {"almuerzo": (12.5, 14.0), "cena": (19.5, 21.0), "tope": 21.5},
    "conosur":    {"almuerzo": (13.0, 14.5), "cena": (21.0, 22.5), "tope": 22.5},
    "caribe":     {"almuerzo": (12.0, 13.5), "cena": (19.0, 20.5), "tope": 21.5},
}

# (país, UTC invierno boreal (nov–mar), UTC verano boreal (abr–oct), M hablantes, perfil)
PAISES = [
    ("México (centro)",        -6, -6, 130.0, "mexicano"),
    ("México (Pacífico/BCS)",  -7, -7,   4.5, "mexicano"),
    ("México (Tijuana/BC)",    -8, -7,   3.8, "mexicano"),
    ("México (Quintana Roo)",  -5, -5,   1.9, "mexicano"),
    ("Colombia",               -5, -5,  52.0, "andino"),
    ("España",                 +1, +2,  48.0, "iberico_es"),
    ("Argentina",              -3, -3,  46.0, "conosur"),
    ("Perú",                   -5, -5,  34.0, "andino"),
    ("Venezuela",              -4, -4,  28.0, "andino"),
    ("Chile (continental)",    -3, -4,  20.0, "conosur"),
    ("Guatemala",              -6, -6,  18.0, "centroam"),
    ("Ecuador (continental)",  -5, -5,  18.0, "andino"),
    ("Bolivia",                -4, -4,  12.0, "andino"),
    ("Cuba",                   -5, -4,  11.0, "caribe"),
    ("República Dominicana",   -4, -4,  11.0, "caribe"),
    ("Honduras",               -6, -6,  10.0, "centroam"),
    ("Paraguay",               -3, -3,   7.0, "conosur"),
    ("Nicaragua",              -6, -6,   7.0, "centroam"),
    ("El Salvador",            -6, -6,   6.3, "centroam"),
    ("Costa Rica",             -6, -6,   5.2, "centroam"),
    ("Panamá",                 -5, -5,   4.4, "centroam"),
    ("Uruguay",                -3, -3,   3.4, "conosur"),
    ("Puerto Rico",            -4, -4,   3.2, "caribe"),
    ("Portugal (sede)",         0, +1,   0.5, "iberico_pt"),
    ("Guinea Ecuatorial",      +1, +1,   1.7, "iberico_es"),
    ("EE. UU. (Este, hisp.)",  -5, -4,  17.0, "caribe"),
    ("EE. UU. (Centro, hisp.)",-6, -5,  14.0, "mexicano"),
    ("EE. UU. (Pacífico,hisp)",-8, -7,  11.0, "mexicano"),
]

# ---------------------------------------------------------------------------
# 2. Función de utilidad horaria (por hora local, fin de semana)
# ---------------------------------------------------------------------------

def utilidad_hora(h, perfil):
    """Utilidad pedagógica [0,1] de una hora local h en sábado/domingo."""
    p = PERFILES[perfil]
    h = h % 24
    # curva base: disponibilidad y estado cognitivo en fin de semana
    if h < 6:      u = 0.00
    elif h < 7:    u = 0.10
    elif h < 8:    u = 0.40
    elif h < 9:    u = 0.72
    elif h < 12:   u = 1.00
    elif h < 15:   u = 0.92
    elif h < 20:   u = 1.00
    elif h < 21:   u = 0.85
    elif h < 22:   u = 0.55
    elif h < 23:   u = 0.25
    else:          u = 0.05
    # penalización por comida principal (ritual familiar de fin de semana)
    a0, a1 = p["almuerzo"]
    if a0 <= h < a1:
        u *= 0.45
    c0, c1 = p["cena"]
    if c0 <= h < c1:
        u *= 0.50
    # penalización dura por cruzar el tope social
    if h >= p["tope"]:
        u *= 0.35
    return u


def utilidad_bloque(inicio_local, perfil, duracion=2):
    """Utilidad media del bloque de `duracion` horas que empieza en inicio_local."""
    return sum(utilidad_hora(inicio_local + k, perfil) for k in range(duracion)) / duracion


# ---------------------------------------------------------------------------
# 3. Barrido de horas UTC candidatas
# ---------------------------------------------------------------------------

def evaluar(utc_inicio, temporada, ponderacion="poblacion"):
    idx = 1 if temporada == "invierno" else 2
    total_w, total_u = 0.0, 0.0
    minimo = (1.0, None)
    for fila in PAISES:
        nombre, off_inv, off_ver, pob, perfil = fila
        off = fila[idx]
        local = (utc_inicio + off) % 24
        u = utilidad_bloque(local, perfil)
        w = pob if ponderacion == "poblacion" else DEMANDA.get(nombre, pob * 0.2)
        total_u += u * w
        total_w += w
        if u < minimo[0]:
            minimo = (u, nombre)
    return total_u / total_w, minimo


# ponderación alternativa: demanda real esperada de formación técnica en línea
# (mercados con mayor penetración de bootcamps y capacidad de pago en EUR/USD)
DEMANDA = {
    "México (centro)": 100, "Colombia": 75, "España": 95, "Argentina": 70,
    "Perú": 45, "Chile (continental)": 40, "Ecuador (continental)": 22,
    "Venezuela": 18, "Guatemala": 12, "Bolivia": 10, "Costa Rica": 14,
    "República Dominicana": 12, "Uruguay": 10, "Panamá": 10, "Paraguay": 7,
    "El Salvador": 7, "Honduras": 6, "Nicaragua": 4, "Cuba": 4,
    "Puerto Rico": 5, "México (Pacífico/BCS)": 4, "México (Tijuana/BC)": 4,
    "México (Quintana Roo)": 2, "Portugal (sede)": 3, "Guinea Ecuatorial": 1,
    "EE. UU. (Este, hisp.)": 20, "EE. UU. (Centro, hisp.)": 16,
    "EE. UU. (Pacífico,hisp)": 14,
}

print("=" * 92)
print("BARRIDO DE HORAS UTC · bloque síncrono de 2 h · sábado y domingo")
print("=" * 92)
print(f"{'UTC':>6} | {'Invierno':>9} {'Verano':>8} {'MEDIA':>8} | {'Inv(dem)':>9} {'Ver(dem)':>9} {'MEDIA':>8} | peor caso")
print("-" * 92)

resultados = []
for utc in range(10, 24):
    ui, mini = evaluar(utc, "invierno", "poblacion")
    uv, minv = evaluar(utc, "verano", "poblacion")
    di, _ = evaluar(utc, "invierno", "demanda")
    dv, _ = evaluar(utc, "verano", "demanda")
    media_pob = (ui + uv) / 2
    media_dem = (di + dv) / 2
    peor = mini if mini[0] <= minv[0] else minv
    resultados.append((utc, media_pob, media_dem, peor))
    print(f"{utc:>4}:00 | {ui:>9.3f} {uv:>8.3f} {media_pob:>8.3f} | "
          f"{di:>9.3f} {dv:>9.3f} {media_dem:>8.3f} | {peor[1]} ({peor[0]:.2f})")

print()
ranking = sorted(resultados, key=lambda r: -(r[1] * 0.5 + r[2] * 0.5))
print("RANKING COMBINADO (50 % población / 50 % demanda esperada)")
for i, (utc, mp, md, peor) in enumerate(ranking[:6], 1):
    print(f"  {i}. {utc:02d}:00 UTC  →  índice {mp*0.5+md*0.5:.4f}   "
          f"(pob {mp:.3f} / dem {md:.3f})   peor caso: {peor[1]} {peor[0]:.2f}")

# ---------------------------------------------------------------------------
# 4. Tabla de conversión de la hora ganadora
# ---------------------------------------------------------------------------
GANADORA = ranking[0][0]
for etiqueta, temporada, idx in (("INVIERNO BOREAL (nov–mar)", "invierno", 1),
                                 ("VERANO BOREAL (abr–oct)", "verano", 2)):
    print()
    print("=" * 92)
    print(f"TABLA LOCAL · inicio {GANADORA:02d}:00 UTC · {etiqueta}")
    print("=" * 92)
    filas = []
    for fila in PAISES:
        nombre, oi, ov, pob, perfil = fila
        off = fila[idx]
        ini = (GANADORA + off) % 24
        fin = (ini + 2) % 24
        filas.append((off, nombre, f"{ini:02.0f}:00–{fin:02.0f}:00",
                      utilidad_bloque(ini, perfil)))
    for off, nombre, rango, u in sorted(filas):
        marca = "OK " if u >= 0.85 else ("~  " if u >= 0.6 else "!! ")
        print(f"  {marca}UTC{off:+d}  {nombre:<26} {rango}   u={u:.2f}")

# ---------------------------------------------------------------------------
# 5. Refinamiento a media hora y prueba de anclaje (UTC fijo vs. local europeo)
# ---------------------------------------------------------------------------
def evaluar_f(utc_inicio, idx, ponderacion="poblacion"):
    total_w, total_u, minimo = 0.0, 0.0, (1.0, None)
    for fila in PAISES:
        nombre, oi, ov, pob, perfil = fila
        local = (utc_inicio + fila[idx]) % 24
        u = (utilidad_hora(local, perfil) + utilidad_hora(local + 1, perfil)) / 2
        w = pob if ponderacion == "poblacion" else DEMANDA.get(nombre, 5)
        total_u += u * w; total_w += w
        if u < minimo[0]: minimo = (u, nombre)
    return total_u / total_w, minimo

print("\n" + "=" * 92)
print("REFINAMIENTO A MEDIA HORA")
print("=" * 92)
mejores = []
for paso in range(26, 38):
    utc = paso / 2.0
    ui, mi = evaluar_f(utc, 1); uv, mv = evaluar_f(utc, 2)
    di, _ = evaluar_f(utc, 1, "demanda"); dv, _ = evaluar_f(utc, 2, "demanda")
    idxc = 0.25*(ui+uv) + 0.25*(di+dv)
    peor = mi if mi[0] <= mv[0] else mv
    mejores.append((idxc, utc, peor))
    print(f"  {int(utc):02d}:{int((utc%1)*60):02d} UTC  índice {idxc:.4f}   peor: {peor[1]} ({peor[0]:.2f})")
print("\n  ÓPTIMO:", max(mejores)[1], "UTC · índice", f"{max(mejores)[0]:.4f}")

print("\n" + "=" * 92)
print("ANCLAJE: UTC FIJO (15:00 todo el año) vs. LOCAL EUROPEO FIJO (16:00 Lisboa)")
print("=" * 92)
a_i, _ = evaluar_f(15, 1); a_v, _ = evaluar_f(15, 2)
b_i, _ = evaluar_f(16, 1); b_v, _ = evaluar_f(15, 2)   # 16:00 Lisboa = 16 UTC inv / 15 UTC ver
print(f"  A · UTC fijo 15:00     → inv {a_i:.3f} | ver {a_v:.3f} | media {(a_i+a_v)/2:.3f}"
      "   (LatAm nunca cambia; Iberia se desplaza 1 h)")
print(f"  B · Lisboa fija 16:00  → inv {b_i:.3f} | ver {b_v:.3f} | media {(b_i+b_v)/2:.3f}"
      "   (Iberia estable; LatAm se desplaza 1 h)")

```



<div class="salto"></div>

# Anexo B · Material archivado

<p class="doc-sub">Documentos derogados, conservados como memoria del diseño</p>

> **Este anexo no tiene valor normativo.** Reúne los documentos que el Instituto abandonó al pasar de un programa de 48 semanas en tres cuatrimestres a un programa uni-cuatrimestral de 16 semanas, y al trasladar la investigación de los estudiantes al profesorado.
>
> Se conservan por dos razones. La primera es de **detalle didáctico**: contienen el desglose minuto a minuto de 48 semanas, y cuando haga falta recuperar la versión extensa de una sesión concreta, está aquí. La segunda es de **vía de crecimiento**: si alguna vez el Instituto puede sostener un programa más largo, este material es el punto de partida y no hay que reescribirlo.
>
> Ninguno de estos documentos puede citarse como norma. La jerarquía documental del art. 68 de la Carta no los incluye.



<div class="salto"></div>

# Anexo B.1 · Nota del archivo

<p class="doc-sub">Por qué se conserva este material</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/archivo/README.md</code></p>

Estos cuatro documentos pertenecen al diseño de **48 semanas en tres
cuatrimestres** que el Instituto abandonó en agosto de 2026 al adoptar el formato
uni-cuatrimestral de 16 semanas.

**No están vigentes.** Se conservan por dos razones:

1. **Detalle didáctico.** Contienen el desglose minuto a minuto de 48 semanas. El
   syllabus vigente comprime esos temas a 15 semanas lectivas, y cuando haga falta
   recuperar la versión extensa de una sesión concreta, está aquí.
2. **Vía de crecimiento.** Si alguna vez el Instituto puede sostener un programa
   más largo, este material es el punto de partida y no hay que reescribirlo.

| Fichero | Qué contiene | Dónde vive ahora |
|---|---|---|
| `ELYSIUM-SYLLABUS-C1.md` | Semanas 1–16 de la versión larga | Nivel I y parte del II del syllabus vigente |
| `ELYSIUM-SYLLABUS-C2.md` | Semanas 17–32 | Nivel II del syllabus vigente |
| `ELYSIUM-SYLLABUS-C3.md` | Semanas 33–48 | Nivel III del syllabus vigente |
| `ELYSIUM-RESEARCH-PROTOCOL.md` | Investigación generacional con los estudiantes como coautores | **Derogado.** Sustituido por el D8 vigente, que es investigación del profesorado con carga cero para el estudiante |

Ninguno de estos ficheros puede citarse como norma. La jerarquía documental del
art. 68 de la Carta no los incluye.




<div class="salto"></div>

# Anexo B.2 · Syllabus C1 (derogado)

<p class="doc-sub">Semanas 1–16 del diseño de 48 semanas</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/archivo/ELYSIUM-SYLLABUS-C1.md</code></p>

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

## PARTE I · IDENTIFICACIÓN Y REGLAS

### 1 · Ficha del cuatrimestre

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

### 2 · Objetivo del cuatrimestre

Al terminar la semana 16, la persona estudiante **escribe HTML, CSS y JavaScript
sin asistencia**, entiende por qué una interfaz es o no accesible y sabe
comprobarlo, explica cómo funciona internamente un modelo de lenguaje y en qué
casos no debe usarse, y tiene publicada en internet la primera versión real de la
plataforma de su propio negocio.

La razón de que el nivel de IA sea N1 durante las ocho primeras semanas está
argumentada en el D1 §6.1: es el tramo en que se construye el criterio con el que
más adelante se juzgará la salida de un modelo. Delegar aquí hipoteca el resto del
programa.

### 3 · Semana 0 · Incorporación (asíncrona, sin evaluación)

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

### 4 · Cómo se lee cada semana

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

## PARTE II · LAS DIECISÉIS SEMANAS

### Módulo I · Estructura y presentación de la información (S01–S04)

#### Semana 01 · La web como sistema y el árbol del documento

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

#### Semana 02 · Semántica, árbol de accesibilidad y formularios

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

#### Semana 03 · Cascada, especificidad, modelo de caja y sistema de tokens

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

#### Semana 04 · Mobile-first, Flexbox, Grid y tipografía fluida

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

### Módulo II · Lógica y lenguaje (S05–S08)

#### Semana 05 · Datos, tipos y estado en JavaScript

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

#### Semana 06 · Control de flujo y primeros eventos del DOM

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

#### Semana 07 · Iteración, arreglos y renderizado de listas

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

#### Semana 08 · Funciones, módulos y contratos

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

### Módulo III · Teoría fundacional de la inteligencia artificial (S09–S12)

> **Nota de diseño.** Los sábados de este módulo son teóricos; **los domingos
> siguen siendo laboratorios de JavaScript y DOM**. El estudiante construye los
> instrumentos con los que estudia la IA, en lugar de pasar cuatro semanas sin
> programar. La justificación está en el D2 §13, corrección 2.

#### Semana 09 · Anatomía de un modelo de lenguaje

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

#### Semana 10 · Tokens, ventana de contexto, latencia y coste

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

#### Semana 11 · Alucinación, sesgo y límites de verificabilidad

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

#### Semana 12 · Modelos propietarios y abiertos: elección con criterio

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

### Módulo IV · Construcción del proyecto y auditoría (S13–S16)

#### Semana 13 · Arquitectura de la información y contenido real

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

#### Semana 14 · Maquetación accesible del proyecto

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

#### Semana 15 · Identidad visual, tema y micro-interacción

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

#### Semana 16 · Auditoría, revisión de código y entrega H1

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

## PARTE III · ADMINISTRACIÓN DEL CUATRIMESTRE

### 5 · Mapa de evaluación

| Componente | Peso | Instrumentos de este cuatrimestre |
|---|:---:|---|
| **A · Continua** | 40 % | `Q01`–`Q16` (12 mejores) 15 % · `L01`–`L15` 25 % |
| **B · Proyecto** | 30 % | `T01`–`T15` 12 % · G1 (8 %) + G2 (10 %) 18 % |
| **C · Hito** | 30 % | H1: ATE apta + rúbrica de producto 60 % + defensa 40 % |
| **Apto / no apto** | — | 2 DAA mínimo · asistencia ≥ 80 % · `AI-USE.md` en toda entrega · P1 y P2 |

### 6 · Calendario

#### 6.1 · Generación I (Λ01) · enero a mayo de 2027

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

#### 6.2 · Generación Piloto (Λ00) · septiembre a noviembre de 2026

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

#### 6.3 · Aviso de cambio de hora

El horario está anclado a **15:00 UTC** (D7 §13), de modo que **nada cambia nunca
para América Latina continental**. Sólo se desplaza el reloj de pared de quienes
viven en un territorio que todavía cambia de hora. En el C1 de la Generación I:

- **Domingo 14-III-2027** (semana 10): Estados Unidos y Cuba adelantan.
- **Domingo 28-III-2027**: Europa adelanta, pero cae en receso.
- **Domingo 4-IV-2027** (semana 12): Chile retrasa, y pasa de 12:00 a 11:00 local.

Se recuerda por anuncio escrito la semana previa, siempre.

### 7 · Recursos permanentes

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

### 8 · Bibliografía del cuatrimestre

- W3C. *HTML Living Standard* y *WCAG 2.2*, con las *Understanding* de cada criterio.
- MDN Web Docs. *Learn web development* y referencia de la API del DOM.
- Directiva (UE) 2019/882 y EN 301 549, en la parte aplicable a sitios web.
- Documentación pública de las familias de modelos usadas en el módulo III.
- Material propio del Instituto: micro-guías `MG01`–`MG16` y fichas `L01`–`L15`.

### 9 · Adaptaciones y ajustes razonables

Toda persona con discapacidad, con conectividad limitada o con circunstancias
familiares acreditadas puede solicitar ajustes en cualquier momento
(Carta, art. 62). Ajustes previstos y ya diseñados: prórroga estándar del 50 % en
laboratorios, transcripción textual de toda sesión, entrega en audio como
alternativa a la escrita en las Transferencias, y sesión de tutoría en horario
alternativo cuando la franja de 15:00 UTC coincida con obligación laboral fija
acreditada.

### 10 · Qué **no** entra en este cuatrimestre

Para evitar expectativas equivocadas: no se estudian marcos de trabajo de
JavaScript, ni preprocesadores de CSS, ni bases de datos, ni peticiones de red, ni
autenticación, ni despliegue con integración continua. Todo eso llega en C2 y C3,
y llega **después** de que la plataforma base esté comprendida.

### 11 · Contrato de expectativas del docente

El docente de este cuatrimestre se compromete a: publicar la micro-guía del sábado
con 72 horas de antelación; devolver toda calificación en 7 días con los tres
campos obligatorios; grabar y subtitular las 32 sesiones; no tocar nunca el teclado
del estudiante; y anotar en §12 cualquier semana en la que menos del 60 % alcance
el criterio en primer intento, que se considerará defectuosa **por diseño** y no
por el grupo (D1 §9).

### 12 · Registro de erratas y de semanas defectuosas

| Fecha | Semana | Naturaleza | Corrección aplicada | Efecto sobre notas |
|---|---|---|---|---|
| *(vacío al inicio de la generación)* | | | | |

---

*Elysium λ Institute of Development & Research · D4 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# Anexo B.3 · Syllabus C2 (derogado)

<p class="doc-sub">Semanas 17–32 del diseño de 48 semanas</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/archivo/ELYSIUM-SYLLABUS-C2.md</code></p>

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

## PARTE I · IDENTIFICACIÓN Y REGLAS

### 1 · Ficha del cuatrimestre

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

### 2 · Objetivo del cuatrimestre

Al terminar la semana 32, la persona estudiante **conecta su plataforma a datos
reales en la nube**, los protege con reglas que deniegan por defecto y demuestra
esa protección con casos negativos, despliega de forma continua con una compuerta
de calidad que bloquea publicaciones defectuosas, y trabaja con asistentes de IA
declarando y justificando cada aceptación y cada rechazo.

### 3 · La regla que gobierna el nivel N3

> **La IA puede escribir código. No puede decidir la arquitectura, el modelo de
> datos ni la regla de negocio.**

Operativamente, en este cuatrimestre **se permite**: generar componentes,
refactorizar, escribir pruebas, documentar, y encargar a un agente del editor una
tarea de varios pasos sobre el repositorio propio.

**Se prohíbe**: pegar el enunciado del laboratorio en un modelo; aceptar una sola
línea sin haberla leído íntegramente; y delegar el diseño del esquema de datos o de
las reglas de seguridad, que se toman en papel y se defienden oralmente a nivel
**N0** en las compuertas G4 y G5.

#### 3.1 · Qué es agente y qué no, en este cuatrimestre

| Sí, es N3 y se permite | No, es N4 y espera al C3 |
|---|---|
| «Extrae esta lógica a un módulo y actualiza los `import`.» | «Cada vez que llegue una reserva, contesta al cliente.» |
| «Escribe las pruebas que faltan para este archivo.» | «Publica esto en producción cuando pasen las pruebas.» |
| «Recorre el proyecto y encuentra dónde se repite este patrón.» | «Borra los documentos que lleven más de un año.» |
| «Propóneme tres formas de resolver esto con sus costes.» | «Elige tú y aplícalo sin preguntarme.» |

La diferencia no es la potencia de la herramienta: es **si su peor error se revierte
con `git` o no**. Todo lo de la columna izquierda produce texto en un editor que
usted lee antes de que exista. Todo lo de la derecha produce un hecho en el mundo.

#### 3.2 · La declaración

Cada entrega incorpora `AI-USE.md` con el apartado 5 (*qué rechacé y por qué*)
cumplimentado. Un apartado 5 vacío se devuelve sin calificar: significa que se
aceptó todo, y aceptar todo es no revisar. Con agente en el editor este apartado
importa más que nunca, porque el agente produce mucho más texto del que produciría
un autocompletado, y por tanto hay mucho más que rechazar.

---

## PARTE II · LAS DIECISÉIS SEMANAS

### Módulo V · La IA en el flujo de trabajo (S01–S03)

#### Semana 17 · C2·S01 · Instrucción técnica a modelos

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

#### Semana 18 · C2·S02 · Leer el error antes de arreglarlo

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

#### Semana 19 · C2·S03 · Agentes en el editor y refactorización

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

### Módulo VI · Asincronía y consumo de servicios (S04–S06)

#### Semana 20 · C2·S04 · El bucle de eventos, promesas y `async`/`await`

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

#### Semana 21 · C2·S05 · HTTP y la Fetch API

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

#### Semana 22 · C2·S06 · JSON, transformación y renderizado

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

### Módulo VII · Persistencia en la nube (S07–S11)

#### Semana 23 · C2·S07 · Modelado de datos: relacional frente a documental

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

#### Semana 24 · C2·S08 · Base de datos en la nube

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

#### Semana 25 · C2·S09 · Crear y leer

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

#### Semana 26 · C2·S10 · Actualizar y borrar

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

#### Semana 27 · C2·S11 · Reglas de seguridad y casos negativos

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

### Módulo VIII · Ingeniería, despliegue y cierre (S12–S16)

#### Semana 28 · C2·S12 · Git profesional, versionado y compuerta de calidad

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

#### Semana 29 · C2·S13 · Auditoría y refactorización del proyecto

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

#### Semana 30 · C2·S14 · Los datos del negocio

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

#### Semana 31 · C2·S15 · Panel de administración en tiempo real

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

#### Semana 32 · C2·S16 · Pruebas de extremo a extremo, documentación y H2

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

## PARTE III · ADMINISTRACIÓN DEL CUATRIMESTRE

### 5 · Mapa de evaluación

| Componente | Peso | Instrumentos |
|---|:---:|---|
| **A · Continua** | 40 % | `Q17`–`Q32` (12 mejores) 15 % · `L17`–`L31` 25 % |
| **B · Proyecto** | 30 % | `T17`–`T31` 12 % · G4 (9 %) + G5 (9 %) 18 % |
| **C · Hito** | 30 % | H2: ATE apta + rúbrica de producto 60 % + defensa 40 % |
| **Apto / no apto** | — | **3 DAA mínimo** (D3 §10.3) · asistencia ≥ 80 % · `AI-USE.md` con apartado 5 · P3 y P4 |

### 6 · Calendario de la Generación I

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

### 7 · Presupuesto de servicios en la nube

Todo el cuatrimestre opera dentro de las **capas gratuitas** de los servicios
elegidos. El Instituto asume el coste de los entornos compartidos de laboratorio.
La regla operativa que se enseña desde la semana 24 es que **un bucle mal escrito
contra una base de datos facturada por operación genera una factura**, y por eso el
laboratorio de esa semana incluye el ejercicio de estimar el coste de la propia
aplicación antes de lanzarla. Si un estudiante supera la capa gratuita, la
Secretaría lo cubre y el caso se estudia en aula como incidente real de ingeniería.

### 8 · Bibliografía del cuatrimestre

- MDN Web Docs: Fetch API, Promises, bucle de eventos, módulos ES.
- Documentación oficial del servicio de base de datos y de sus reglas de seguridad.
- `ELYSIUM-STANDARDS.md`, §6 (estándares transversales y compuerta de calidad),
  §7 (versionado) y §8 (protocolo de publicación).
- Literatura sobre asistentes de IA y programadores noveles citada en el D1 §6.1.
- Material propio: micro-guías `MG17`–`MG32` y fichas `L17`–`L31`.

### 9 · Qué **no** entra en este cuatrimestre

No se estudian autenticación de personas usuarias, rutas privadas, pagos,
agendamiento ni agentes en el servidor. Todo eso es el cuatrimestre 3, y llega
después de que los datos estén correctamente modelados y protegidos.

### 10 · Registro de erratas y de semanas defectuosas

| Fecha | Semana | Naturaleza | Corrección aplicada | Efecto sobre notas |
|---|---|---|---|---|
| *(vacío al inicio de la generación)* | | | | |

---

*Elysium λ Institute of Development & Research · D5 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# Anexo B.4 · Syllabus C3 (derogado)

<p class="doc-sub">Semanas 33–48 del diseño de 48 semanas</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/archivo/ELYSIUM-SYLLABUS-C3.md</code></p>

> **Cómo leer este documento.** Mismo formato que el D4 y el D5. Este cuatrimestre
> cierra tres cosas a la vez: la plataforma transaccional, el expediente de negocio
> y cumplimiento, y la publicación científica de la generación. El calendario está
> apretado a propósito y por eso las tres líneas se declaran por separado en cada
> semana.
>
> **El cambio de régimen de este cuatrimestre.** Se abre el nivel **N4**: agentes
> que **actúan por sí mismos sobre sistemas reales**, es decir que se ejecutan en el
> servidor, escriben en producción o se comunican con terceros. Es un salto de
> naturaleza respecto al agente en el editor del Cuatrimestre 2: aquí el peor error
> ya no se revierte con `git`. El contrapeso son **cuatro** Defensas Aleatorias de
> Autoría por estudiante, la **carta de límites** obligatoria de todo agente, y una
> defensa final a N0 estricto.
>
> **Regla de congelación** (Carta, Anexo B). No se modifica durante el cuatrimestre
> en curso salvo errata, anotada en §13.

---

## PARTE I · IDENTIFICACIÓN Y REGLAS

### 1 · Ficha del cuatrimestre

| Campo | Valor |
|---|---|
| **Cuatrimestre** | 3 de 3 · Semanas globales 33–48 |
| **Título** | Full-Stack, Agentes en el Servidor, Emprendimiento y Publicación |
| **Fechas · Generación I (Λ01)** | 4 de septiembre de 2027 → 19 de diciembre de 2027 |
| **Recesos** | **Ninguno interno.** El receso cae antes, el 28 de agosto de 2027 |
| **Horario** | Sábado y domingo, **15:00–17:00 UTC** |
| **Aula** | Máximo 15 estudiantes · 10 ideal · una sola por generación |
| **Coste** | **Ninguno** (Carta, art. 2 bis) |
| **Carga** | **4 h de clase + 4 h de estudio autónomo** por semana |
| **Prerrequisito** | H2 aprobado |
| **Nivel de IA** | **N4 · agente sobre sistemas reales** · **N0** en quices, en DAA y en la defensa final |
| **Entregable de cierre (H3)** | Plataforma transaccional segura, expediente de negocio y cumplimiento, memoria del TFG, sustentación en el Demo Day y **preprint publicado con identificador persistente** |
| **Compuertas** | G7 (S41) · G8 (S45) · P5 (S39) · P6 (S46) · H3 (S48) |

### 2 · Objetivo del cuatrimestre

Al terminar la semana 48, la persona graduada tiene **una plataforma transaccional
en producción**: personas usuarias que se autentican, datos protegidos por rol,
agenda operativa, cobro en modo de prueba, automatización supervisada por agentes,
cumplimiento legal documentado y una defensa técnica sostenida ante un panel con
auditor externo. Y tiene su nombre en un **preprint publicado con identificador
persistente** y en el manuscrito enviado a revista.

### 3 · Las tres líneas simultáneas

| Línea | Semanas | Qué produce |
|---|---|---|
| **Técnica** | S33–S45 | Autenticación, roles, agenda, agentes, pagos, endurecimiento |
| **Negocio y cumplimiento** | S38–S42 | Lean Canvas validado, marca, expediente legal, SEO |
| **Científica** | S39–S46 | Análisis, redacción, revisión por pares, **publicación del preprint** y envío a revista |

Las tres convergen en las semanas 46 a 48. Quien se retrase en una arrastra las
otras, y por eso las compuertas G7 y G8 son bloqueantes y sin prórroga.

---

## PARTE II · LAS DIECISÉIS SEMANAS

### Módulo IX · Identidad, acceso y transacción (S01–S05)

#### Semana 33 · C3·S01 · Identidad, sesión y testigos

> **RA** RA-D2 **·** **IA** N4 **·** **Andamiaje** A4 **·** **Entrega** `L33`

**Sábado · Antes (30 min).** Micro-guía *«Autenticar no es autorizar»*. Predicción:
¿dónde vive la prueba de que usted ya inició sesión?

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado: identidad, autenticación y autorización como tres cosas
  distintas; contraseñas y por qué nunca se almacenan; el testigo firmado, su
  estructura y su caducidad; el testigo de refresco; dónde guardarlo y por qué el
  almacenamiento local es una decisión con consecuencias; delegación de identidad a
  terceros; y qué significa exactamente que el servidor «confíe» en un testigo.
- `01:20–02:00` · Instrucción entre pares: *¿cuál de estos cuatro diseños de sesión
  es vulnerable y a qué?*

**Sábado · Después (30 min).** `Q33` · espaciado: C2·S15, C2·S12, C2·S08.

**Domingo · Antes (30 min).** Predicción: ¿qué ve el servidor cuando usted inicia
sesión?

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción e inspección de la petición real.
- `00:15–01:45` · Registro, inicio y cierre de sesión, recuperación de contraseña y
  verificación de correo. Formularios accesibles con mensajes de error que **no
  revelan si el correo existe**, que es una fuga clásica de información.
- `01:45–02:00` · Validación: el flujo completo se recorre sólo con teclado.

**Domingo · Después (60–90 min).** `T33` · Autenticación en el proyecto propio.

**Criterio de aceptación.** Los mensajes de error no permiten enumerar cuentas.

---

#### Semana 34 · C3·S02 · Roles, rutas privadas y cabeceras de seguridad

> **RA** RA-D2 · RA-D3 **·** **IA** N4 **·** **Andamiaje** A4 **·** **Entrega** `L34`

**Sábado · Antes (30 min).** Intentar acceder a la ruta privada de la aplicación de
práctica sin haber iniciado sesión. Documentar el resultado.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común: quién consiguió entrar y por qué.
- `00:20–01:20` · Modelado: control de acceso basado en roles; el principio de
  mínimo privilegio; por qué **ocultar el botón no es proteger la ruta** y por qué
  la protección real vive en la regla de datos, no en la interfaz; reclamaciones
  personalizadas en el testigo; y las cabeceras de seguridad de la plataforma
  (política de seguridad de contenido, transporte estricto, política de referente,
  opciones de marco), con el ataque concreto que previene cada una.
  Corresponde a **F07 · Security Core** del estándar.
- `01:20–02:00` · Instrucción entre pares sobre matrices de permisos.

**Sábado · Después (30 min).** `Q34` · espaciado: C3·S01, C2·S13, C2·S09.

**Domingo · Antes (30 min).** Escribir la matriz de permisos del proyecto propio:
quién puede hacer qué sobre qué.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de matrices.
- `00:15–01:45` · Área privada de la persona usuaria y área de administración, con
  reglas de datos que reflejan la matriz, y cabeceras de seguridad configuradas y
  verificadas.
- `01:45–02:00` · Validación: batería de casos negativos ampliada con acceso por rol
  incorrecto; todos rechazados.

**Domingo · Después (60–90 min).** `T34` · Rutas privadas y roles en el proyecto.

**Criterio de aceptación.** Una persona autenticada con rol de cliente no puede leer
ni un solo documento del área de administración, comprobado desde la consola y no
sólo desde la interfaz.

---

#### Semana 35 · C3·S03 · Tiempo, husos horarios y colisión de reservas

> **RA** RA-B2 · RA-C2 **·** **IA** N4 **·** **Andamiaje** A4 **·** **Entrega** `L35` **·** **Fracaso productivo**

**Sábado · Antes (30 min).** **Fracaso productivo**: escribir la función que decide
si dos reservas se solapan. Casi todo el mundo la escribe mal la primera vez, y esa
es la lección.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Se proyectan varias soluciones del grupo y se rompen con casos
  límite: reservas contiguas, de duración cero, que cruzan la medianoche.
- `00:20–01:20` · Modelado: el tiempo como problema de ingeniería; marca de tiempo
  absoluta frente a hora local; almacenar siempre en tiempo universal y presentar en
  local; husos horarios y cambios de hora estacionales (con el ejemplo propio del
  Instituto: la sesión del **domingo 31 de octubre de 2027**, día en que Europa
  retrasa su reloj mientras América Latina no cambia); duración frente a instante;
  el algoritmo correcto de solapamiento de
  intervalos y por qué es más simple de lo que parece; y las condiciones de carrera
  en la reserva concurrente.
- `01:20–02:00` · Instrucción entre pares con casos límite de calendario.

**Sábado · Después (30 min).** `Q35` · espaciado: C3·S02, C2·S14, C2·S10.

**Domingo · Antes (30 min).** Definir las reglas de disponibilidad del propio
negocio: horarios, duraciones, descansos, excepciones.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción sobre el conjunto de casos de prueba provisto.
- `00:15–01:45` · Motor de disponibilidad: generación de huecos, detección de
  solapamiento, reserva atómica que impide el doble apunte, y manejo de zonas
  horarias distintas entre el negocio y el cliente.
- `01:45–02:00` · Validación: los 20 casos de prueba, incluidos los de cambio de
  hora y medianoche, en verde.

**Domingo · Después (60–90 min).** `T35` · Motor de disponibilidad del proyecto propio.

**Criterio de aceptación.** Dos reservas simultáneas del mismo hueco producen
exactamente una confirmación y un rechazo claro, comprobado con dos pestañas.

---

#### Semana 36 · C3·S04 · Interfaz de agenda accesible

> **RA** RA-A4 · RA-A3 **·** **IA** N4 **·** **Andamiaje** A5 **·** **Entrega** `L36`

**Sábado · Antes (30 min).** Reservar una cita en tres sitios reales **usando sólo
el teclado** y anotar dónde falla cada uno.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común de los fallos encontrados. Suelen ser muchos, y
  ese es el argumento comercial de todo el programa.
- `00:20–01:20` · Modelado: el calendario como el componente más difícil de hacer
  accesible; patrón de rejilla con navegación por flechas; anuncio del cambio de
  mes; selección de hueco; confirmación con resumen; y el diseño del recorrido
  completo en móvil. Corresponde a **F24 · Smart Booking**.
- `01:20–02:00` · Crítica de diseño de agendas entre pares.

**Sábado · Después (30 min).** `Q36` · espaciado: C3·S03, C2·S15, C2·S11.

**Domingo · Antes (30 min).** Boceto del recorrido de reserva en cinco pantallas.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión de bocetos.
- `00:15–01:45` · Construcción del calendario interactivo conectado al motor de la
  semana anterior, con correo de confirmación y cancelación.
- `01:45–02:00` · Validación: reserva completa realizada **sólo con teclado y con
  lector de pantalla**, sin mirar la pantalla. Es la prueba de aceptación.

**Domingo · Después (60–90 min).** `T36` · Agenda del proyecto propio operativa.

**Criterio de aceptación.** Una persona ciega completa una reserva de principio a
fin. Si no lo consigue, el laboratorio no está aprobado por muy bonito que se vea.

---

#### Semana 37 · C3·S05 · Servidor sin servidor y agentes supervisados

> **RA** RA-C5 · RA-E5 **·** **IA** N4 **·** **Andamiaje** A5 **·** **Entrega** `L37`

**Sábado · Antes (30 min).** Listar tres cosas de su aplicación que **no deberían**
ejecutarse en el navegador y decir por qué.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común. Se construye colectivamente el criterio de
  frontera cliente/servidor.
- `00:20–01:20` · Modelado: funciones sin servidor, disparadores, arranque en frío,
  variables de entorno y gestión de secretos; **la regla dura**: toda clave de un
  servicio de terceros vive en el servidor y nunca llega al navegador; y el diseño
  de un agente con límites explícitos: qué puede hacer, qué no puede hacer nunca,
  qué requiere confirmación humana, qué se registra y cómo se revierte.
- `01:20–02:00` · Instrucción entre pares: *¿qué es lo peor que puede hacer este
  agente si el modelo se equivoca?* Ejercicio de análisis de fallo previo.

**Sábado · Después (30 min).** `Q37` · espaciado: C3·S04, C3·S01, C2·S12.

**Domingo · Antes (30 min).** Escribir la carta de límites del propio agente.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de las cartas de límites.
- `00:15–01:45` · Función en el servidor que, ante una reserva o un mensaje nuevo,
  genera con un modelo un borrador de respuesta, **lo deja en estado de borrador
  para revisión humana**, y registra en bitácora la entrada, la salida y la decisión
  del humano. Envío sólo tras aprobación explícita.
- `01:45–02:00` · Validación: no existe ninguna ruta por la que el agente envíe algo
  sin aprobación; el registro es completo.

**Domingo · Después (60–90 min).** `T37` · Agente supervisado en el proyecto propio,
con su carta de límites publicada.

**Criterio de aceptación.** Cero envíos automáticos sin revisión humana. Un agente
que puede enviar solo es hallazgo **crítico** de la ATE.

---

### Módulo X · Negocio, cumplimiento y descubrimiento (S06–S10)

#### Semana 38 · C3·S06 · Modelo de negocio y validación

> **RA** RA-G1 **·** **IA** N4 **·** **Andamiaje** A4 **·** **Entrega** `L38`

**Sábado · Antes (30 min).** Releer la Carta de Anteproyecto de la semana 3 y
anotar qué ha resultado ser falso.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común: qué supuesto se cayó. Casi todos se caen, y
  decirlo en público es la lección.
- `00:20–01:20` · Modelado: lienzo Lean para micronegocios; problema, segmento,
  propuesta única, solución, canales, ingresos, costes, métricas y ventaja
  injusta; identificación del **supuesto más peligroso** y diseño del experimento
  más barato que puede refutarlo; economía unitaria mínima (coste de adquisición,
  valor del cliente, punto de equilibrio).
- `01:20–02:00` · Taller por pares: cada persona ataca el lienzo del otro.

**Sábado · Después (30 min).** `Q38` · espaciado: C3·S05, C3·S02, C2·S13.

**Domingo · Antes (30 min).** Formular el supuesto más peligroso del propio negocio.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión de supuestos.
- `00:15–01:45` · Lienzo completo, economía unitaria con números propios, y diseño
  del experimento de validación con criterio de refutación explícito.
- `01:45–02:00` · Presentación de dos minutos por persona.

**Domingo · Después (60–90 min).** `T38` · Lienzo y experimento de validación
lanzado de verdad (encuesta, conversación con cinco clientes potenciales o página
de captación).

**Criterio de aceptación.** El experimento tiene un criterio numérico que, de no
alcanzarse, obliga a cambiar el modelo. Sin ese criterio, no es un experimento.

---

#### Semana 39 · C3·S07 · Marca, redacción persuasiva y análisis de datos

> **RA** RA-G2 · RA-H3 **·** **IA** N4 **·** **Andamiaje** A4 **·** **Entrega** `L39` **·** **COMPUERTA P5**

**Sábado · Antes (30 min).** Recoger tres marcas del propio sector y describir en
una frase qué promete cada una.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:00` · Modelado: identidad de marca mínima viable; nombre, logotipo,
  paleta ya validada por contraste, voz y tono; la promesa de marca como restricción
  de producto, no como adorno; redacción persuasiva honesta y por qué la exageración
  se paga en devoluciones y en reputación.
- `01:00–02:00` · **Sesión de investigación P5**: análisis del lote de datos cerrado
  en P4, con resultados a la vista de toda la generación, incluidos los que
  contradicen la hipótesis (D8 §3 y §6).

**Sábado · Después (30 min).** `Q39` · espaciado: C3·S06, C3·S03, C2·S14.

**Domingo · Antes (30 min).** Escribir la promesa de marca en una sola frase.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Prueba ciega de promesas entre pares.
- `00:15–01:45` · Manual de marca de una página y reescritura de todos los textos de
  la plataforma conforme a la voz definida. Nivel N4 permitido para **iterar**
  variantes, con la condición de que la versión final la elija y justifique la
  persona, y así conste en `AI-USE.md`.
- `01:45–02:00` · Revisión de coherencia entre marca, interfaz y promesa.

**Domingo · Después (60–90 min).** `T39` · Marca aplicada al proyecto propio.

> ### ⚑ Compuerta P5 · Análisis cerrado
> Resultados del lote de datos, con estadística descriptiva e inferencial según el
> protocolo preinscrito, y declaración explícita de toda desviación respecto a él.

---

#### Semana 40 · C3·S08 · Protección de datos y documentos legales

> **RA** RA-D4 · RA-G3 **·** **IA** N4 **·** **Andamiaje** A4 **·** **Entrega** `L40`

**Sábado · Antes (30 min).** Inventariar **todos** los datos personales que su
plataforma recoge, campo por campo.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común. Siempre aparecen datos que nadie había contado,
  como direcciones IP y registros de acceso.
- `00:20–01:20` · Modelado: qué es un dato personal y qué es un dato sensible; las
  bases legales del tratamiento y cómo se elige la correcta; minimización, limitación
  de finalidad y plazo de conservación; los derechos de la persona interesada y la
  obligación de darles cauce real; responsable y encargado, y en qué posición queda
  el estudiante respecto de sus clientes; transferencias internacionales cuando el
  proveedor está fuera de la Unión; el Reglamento (UE) 2016/679 y la Ley n.º 8968 de
  Costa Rica en paralelo; cookies y consentimiento previo (**F08 · Cookies
  Management**); y el registro de actividades de tratamiento.
- `01:20–02:00` · Taller: elegir base legal para diez tratamientos concretos.

**Sábado · Después (30 min).** `Q40` · espaciado: C3·S07, C3·S04, C2·S15.

**Domingo · Antes (30 min).** Borrador del registro de actividades de tratamiento.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de registros.
- `00:15–01:45` · Redacción de la política de privacidad, el aviso legal, los
  términos y condiciones y la gestión de consentimiento de cookies. Se permite nivel
  N4 para generar el borrador, con **revisión obligatoria línea a línea** y
  verificación de que cada afirmación corresponde a lo que la plataforma realmente
  hace.
- `01:45–02:00` · Validación cruzada: un compañero comprueba que los documentos
  describen la aplicación real y no una genérica.

**Domingo · Después (60–90 min).** `T40` · Expediente legal completo publicado.

**Criterio de aceptación.** Cada tratamiento del registro tiene base legal, plazo y
cauce de ejercicio de derechos. Una política que menciona funcionalidades que la
plataforma no tiene se devuelve: es una declaración falsa.

> **Advertencia profesional que se enseña en esta semana.** Un documento legal
> generado por un modelo y no revisado es un riesgo, no un ahorro. El Instituto
> enseña a producir el borrador y a revisarlo con criterio, y enseña también cuándo
> hay que pagar a un abogado.

---

#### Semana 41 · C3·S09 · Formalización en la propia jurisdicción

> **RA** RA-G3 **·** **IA** N4 **·** **Andamiaje** A5 **·** **Entrega** `L41` **·** **COMPUERTA G7**

**Sábado · Antes (30 min).** Localizar la sede electrónica oficial del registro
mercantil y de la administración tributaria de **su propio país**.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Mapa en vivo: veinte países, veinte rutas distintas.
- `00:20–01:20` · Modelado con **dos casos trabajados en profundidad**: Costa Rica
  (Registro Nacional, Tributación Directa, régimen de trabajador independiente,
  facturación electrónica) y Portugal (início de atividade ante la Autoridade
  Tributária, actividad como trabalhador independente, régimen de IVA, Livro de
  Reclamações electrónico obligatorio). A partir de ellos se extrae la **plantilla
  común**: forma jurídica, registro, identificación fiscal, régimen de impuesto
  indirecto, obligaciones de facturación, seguridad social, protección al consumidor
  y protección de datos.
- `01:20–02:00` · Trabajo en grupos por país o región, con puesta en común.

**Sábado · Después (30 min).** `Q41` · espaciado: C3·S08, C3·S05, C3·S01.

**Domingo · Antes (30 min).** Reunir la documentación oficial de la propia
jurisdicción.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión de fuentes: sólo se admiten fuentes oficiales.
- `00:15–01:45` · **Ficha de ruta de formalización** propia: pasos numerados, órgano
  competente, coste, plazo y enlace oficial de cada uno. Es un trabajo de
  investigación normativa guiada, no una clase de derecho.
- `01:45–02:00` · Presentación de tres minutos por país, que queda como recurso
  compartido de la generación.

**Domingo · Después (60–90 min).** `T41` · Ficha de ruta propia y decisión razonada
sobre cuándo formalizar.

> ### ⚑ Compuerta G7 · Expediente de cumplimiento
> **Vence:** domingo de la semana 41. **Bloquea:** H3.
> Registro de actividades de tratamiento, política de privacidad, aviso legal,
> términos, gestión de consentimiento, y ficha de ruta de formalización con fuentes
> oficiales. Corresponde a `ATE-C` completo.

> **Límite declarado del Instituto.** Este bloque enseña a **navegar** el
> procedimiento administrativo y a saber qué preguntar. No es asesoramiento jurídico
> ni fiscal, y así se hace constar en el material y en el certificado. La ficha de
> ruta se contrasta siempre contra la fuente oficial vigente en el momento de usarla.

---

#### Semana 42 · C3·S10 · Descubrimiento: SEO técnico y agentes de búsqueda

> **RA** RA-A5 · RA-G2 **·** **IA** N4 **·** **Andamiaje** A5 **·** **Entrega** `L42`

**Sábado · Antes (30 min).** Buscar el propio negocio en un buscador y en un
asistente conversacional. Anotar qué aparece y qué no.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común de resultados.
- `00:20–01:20` · Modelado: rastreo, indexación y posicionamiento; metadatos y
  datos estructurados; URL limpias (**F23**); mapa del sitio y directivas de
  rastreo; el vínculo directo entre accesibilidad y posicionamiento, porque el
  rastreador lee la misma estructura semántica que el lector de pantalla;
  descubrimiento por asistentes de IA y arquitectura de ficheros de contexto
  (**F19 · Discovery Core** y **F20 · SEO** del estándar); previsualización en redes
  y en mensajería; y, conceptualmente, estructura multiidioma (**F15**) y
  multidivisa (**F16**) para quien venda fuera de su país.
- `01:20–02:00` · Auditoría cruzada de descubrimiento entre pares.

**Sábado · Después (30 min).** `Q42` · espaciado: C3·S09, C3·S06, C3·S02.

**Domingo · Antes (30 min).** Lista de las diez consultas por las que quiere que le
encuentren.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión de intención de búsqueda.
- `00:15–01:45` · Metadatos, datos estructurados, mapa del sitio, directivas de
  rastreo, previsualización enriquecida y ficheros de contexto para asistentes.
- `01:45–02:00` · Validación con herramienta de pruebas de resultados enriquecidos.

**Domingo · Después (60–90 min).** `T42` · Descubrimiento completo del proyecto propio.

---

### Módulo XI · Endurecimiento, memoria y graduación (S11–S16)

#### Semana 43 · C3·S11 · Endurecimiento de seguridad

> **RA** RA-D1 · RA-D3 **·** **IA** N4 **·** **Andamiaje** A5 **·** **Entrega** `L43`

**Sábado · Antes (30 min).** Buscar activamente **tres formas de romper la propia
plataforma**.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común de vectores encontrados.
- `00:20–01:20` · Modelado: modelo de amenaza aplicado a una plataforma de pyme;
  las categorías de riesgo más frecuentes en aplicaciones web; inyección en
  consultas de datos; escalada de privilegios por reglas mal escritas; exposición de
  secretos; dependencias vulnerables; limitación de tasa y abuso de formularios; y
  el plan de respuesta ante incidente, incluida la obligación de notificar una
  violación de datos personales en 72 horas.
- `01:20–02:00` · **Ejercicio de ataque cruzado autorizado**: cada estudiante intenta
  vulnerar la plataforma de otro, con consentimiento escrito previo y dentro del
  entorno del Instituto. Se documenta todo hallazgo y se comunica en privado a su
  autor antes de comentarlo en público.

**Sábado · Después (30 min).** `Q43` · espaciado: C3·S10, C3·S07, C3·S03.

**Domingo · Antes (30 min).** Recibir e interpretar el informe de quien le atacó.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Priorización de hallazgos por severidad.
- `00:15–01:45` · Remediación completa, ampliación de la batería de casos negativos
  con cada vector encontrado, limitación de tasa y revisión de dependencias.
- `01:45–02:00` · Nueva ronda de ataque sobre lo remediado.

**Domingo · Después (60–90 min).** `T43` · Informe de seguridad del proyecto propio
con hallazgos, remedios y pruebas que los verifican.

**Criterio de aceptación.** Cada hallazgo tiene un caso negativo automatizado que lo
impide en el futuro. Remediar sin prueba no cuenta: vuelve a ocurrir.

---

#### Semana 44 · C3·S12 · Cobro en línea y cierre funcional

> **RA** RA-C5 · RA-F3 **·** **IA** N4 **·** **Andamiaje** A5 **·** **Entrega** `L44`

**Sábado · Antes (30 min).** Micro-guía *«Su servidor nunca ve el número de la
tarjeta, y eso es lo importante»*.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado: por qué los datos de tarjeta jamás pasan por la
  infraestructura propia; la sesión de pago alojada por el proveedor; el aviso del
  proveedor como única fuente de verdad del pago; idempotencia y pagos duplicados;
  reembolsos; bonos de sesiones; y el impuesto indirecto en venta transfronteriza.
  Corresponde a **F26 · Online Payments**. **Todo el laboratorio se realiza en modo
  de prueba con tarjetas ficticias del proveedor**, nunca con datos reales.
- `01:20–02:00` · Instrucción entre pares sobre estados de un pago.

**Sábado · Después (30 min).** `Q44` · espaciado: C3·S11, C3·S08, C3·S04.

**Domingo · Antes (30 min).** Definir el catálogo de precios propio.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión de catálogos.
- `00:15–01:45` · Integración de cobro en modo de prueba: sesión de pago, aviso del
  proveedor recibido en función de servidor, actualización del estado de la reserva,
  y recibo. Cierre de toda funcionalidad pendiente.
- `01:45–02:00` · Validación: el flujo completo funciona y el estado nunca se
  actualiza desde el cliente.

**Domingo · Después (60–90 min).** `T44` · Cobro en modo de prueba operativo y
funcionalidad congelada. **A partir de aquí no se añaden funciones nuevas.**

---

#### Semana 45 · C3·S13 · Auditoría Técnica final y optimización

> **RA** RA-F2 · RA-A5 **·** **IA** N4 **·** **Entrega** `L45` **·** **COMPUERTA G8**

**Sábado · Antes (30 min).** ATE completa autoadministrada y predicción de la
puntuación por tercera y última vez en el programa.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Contraste. Se compara la precisión de la predicción con la de
  C1·S16 y C2·S13: la mejora de la calibración es un resultado de aprendizaje en sí
  mismo y se muestra al grupo.
- `00:20–01:20` · Auditoría en vivo por el **Comité de Auditoría Técnica**, con
  auditor externo presente (Carta, art. 23), sobre dos proyectos voluntarios.
- `01:20–02:00` · Informes individuales y plan de remediación.

**Sábado · Después (30 min).** `Q45` · espaciado: C3·S12, C3·S09, C3·S05.

**Domingo · Antes (30 min).** Plan de remediación priorizado y estimado en horas.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Validación del plan.
- `00:15–01:45` · Remediación de todo hallazgo crítico y mayor, con medición antes y
  después. Informes de ocupación y ausencias en versión reducida (**F27**) si el
  proyecto los requiere.
- `01:45–02:00` · Reauditoría.

**Domingo · Después (60–90 min).** `T45` · Proyecto sin hallazgos críticos.

> ### ⚑ Compuerta G8 · Auditoría Técnica final
> **Vence:** domingo de la semana 45. **Bloquea la defensa.**
> ATE-A, ATE-P, ATE-S, ATE-C, ATE-Q y ATE-D **sin hallazgos críticos**. Los
> hallazgos mayores restan de la nota del hito (D3 §11.3) pero no bloquean.

---

#### Semana 46 · C3·S14 · Memoria, artículo y preparación del pitch

> **RA** RA-F3 · RA-H4 · RA-G4 **·** **IA** N4 **·** **Entrega** `L46` **·** **COMPUERTA P6**

**Sábado · Antes (30 min).** Redactar el borrador del resumen de la memoria del TFG
en 200 palabras.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Lectura ciega de resúmenes entre pares.
- `00:20–01:00` · Modelado: estructura de la memoria del TFG siguiendo los diez
  pasos del **λ Development Framework Model** de la empresa (D9 §7); cómo se
  escribe una decisión de ingeniería (contexto, opciones, criterio, elección,
  consecuencia).
- `01:00–02:00` · **Sesión de investigación P6**: revisión final del manuscrito,
  asignación de roles de contribución conforme a la taxonomía CRediT, aprobación de
  la lista de autoría y **envío** (D8 §3 y §5).

**Sábado · Después (30 min).** `Q46` · espaciado: C3·S13, C3·S10, C3·S06.

**Domingo · Antes (30 min).** Guion del pitch en cinco puntos.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión de guiones.
- `00:15–01:45` · Redacción de la memoria y construcción del pitch de siete minutos:
  problema, cliente, demostración en vivo, decisiones técnicas defendibles, modelo de
  negocio, y qué sigue.
- `01:45–02:00` · Primer ensayo cronometrado.

**Domingo · Después (60–90 min).** `T46` · Memoria en borrador completo.

> ### ⚑ Compuerta P6 · Publicación del preprint y envío a revista
> Se cierran dos cosas el mismo día, y conviene no confundirlas:
>
> 1. **El preprint queda publicado**, con identificador persistente, junto con los
>    datos y el código depositados. Esto **sí** es publicación, es verificable, y no
>    depende de la decisión de nadie ajeno al Instituto.
> 2. **El manuscrito queda enviado** a la revista o congreso de destino. Su
>    aceptación llega meses después y no puede prometerse (Carta, art. 18).
>
> Ver **D8 §3** y **§15**.

---

#### Semana 47 · C3·S15 · Ensayo general y revisión por pares

> **RA** RA-G4 · RA-H4 **·** **IA** N3 (se cierra hacia N0) **·** **Entrega** `L47`

**Sábado · Antes (30 min).** Ensayo grabado del pitch propio, visto por uno mismo.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Qué descubrió cada quien al verse.
- `00:20–02:00` · **Ensayo general con panel simulado**: cada estudiante presenta 7
  minutos y recibe 8 de preguntas adversas del docente y de dos compañeros. Se
  entrenan las preguntas difíciles: *¿por qué eligió esta base de datos?*, *¿qué
  parte de esto no escribió usted?*, *¿qué haría si mañana tuviera mil usuarios?*,
  *¿cómo sabe que es accesible?*

**Sábado · Después (30 min).** `Q47` · último quiz, acumulativo de todo el programa.

**Domingo · Antes (30 min).** Incorporar el retorno recibido.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Ajustes de guion.
- `00:15–01:30` · Segunda ronda de ensayo con panel rotado.
- `01:30–02:00` · Revisión por pares de la memoria: cada estudiante revisa la de otro
  con un informe estructurado (`RA-H4`).

**Domingo · Después (60–90 min).** `T47` · Memoria definitiva y pitch cerrado.

---

#### Semana 48 · C3·S16 · Demo Day, sustentación y graduación

> **RA** RA-G4 **·** **IA** **N0 estricto** **·** **Entrega** `H3` **·** **Presencia obligatoria**

**Sábado · Antes.** Comprobación técnica: la plataforma en producción, la URL
accesible, el guion listo y el entorno de presentación probado.

**Sábado · Durante (120 min) · DEMO DAY.** Sesión pública abierta, retransmitida y
grabada, con público externo invitado: clientes, familias, socios institucionales y
la comunidad. Cada estudiante presenta **7 minutos** con demostración en vivo de la
plataforma. Sin diapositivas de relleno: se enseña el producto funcionando.

**Sábado · Después.** Publicación de los proyectos en la galería de la generación,
con la licencia de exhibición del art. 58 de la Carta.

**Domingo · Durante (120 min) · SUSTENTACIÓN TÉCNICA.** En salas paralelas, ante
panel de tres personas con **al menos un auditor externo al Instituto** (Carta,
art. 23):

| Fase | Duración | Contenido |
|---|:---:|---|
| Exposición técnica | 10 min | Arquitectura, decisiones y sus alternativas descartadas |
| Defensa de autoría final | 10 min | Modificación de código en vivo, a nivel **N0** |
| Preguntas del panel | 15 min | Técnicas, de negocio y de cumplimiento |
| Deliberación | 5 min | A puerta cerrada |

**Domingo · Cierre.** Acto de graduación de la Generación I: entrega de
certificados, menciones (D3 §3.1) y anuncio del estado del artículo científico.

> ### ⚑ Hito H3 · Graduación
> **Plataforma transaccional en producción** con autenticación, roles, agenda,
> cobro en modo de prueba, agente supervisado y expediente de cumplimiento;
> **memoria del TFG** completa según D9 §7; **pitch** en Demo Day; **sustentación
> técnica** superada; artículo enviado con coautoría acreditada.

**Sin cambio de hora en el Demo Day.** El cierre en diciembre tiene una ventaja
operativa que conviene no perder en futuras reformas del calendario: el Demo Day del
**18 y 19 de diciembre de 2027** cae lejos de toda transición horaria. Europa ya
retrasó sus relojes el 31 de octubre y no vuelve a moverlos hasta marzo. La
sustentación empieza a las **15:00 UTC** para todo el mundo, sin ninguna nota al
pie. Aun así, la Secretaría confirma la hora local de cada estudiante por escrito
**dos semanas antes** y el día anterior.

**Y cierra el año.** La generación se gradúa la semana anterior a Navidad y la
siguiente arranca el segundo sábado de enero. El relevo entre generaciones ocurre
en el receso de fin de año, sin solape y sin arrastre.

---

## PARTE III · ADMINISTRACIÓN DEL CUATRIMESTRE

### 5 · Mapa de evaluación

| Componente | Peso | Instrumentos |
|---|:---:|---|
| **A · Continua** | 40 % | `Q33`–`Q47` (12 mejores) 15 % · `L33`–`L47` 25 % |
| **B · Proyecto** | 30 % | `T33`–`T47` 12 % · G7 (9 %) + G8 (9 %) 18 % |
| **C · Hito** | 30 % | H3: ATE apta + memoria y producto 60 % + sustentación 40 % |
| **Apto / no apto** | — | **4 DAA mínimo** · asistencia ≥ 80 % · `AI-USE.md` · P5 y P6 |

### 6 · Calendario de la Generación I

| Sem. global | C3 | Sábado | Marca |
|:---:|:---:|---|---|
| — | — | 28-VIII-2027 | **Receso intercuatrimestral** |
| 33 | S01 | 4-IX-2027 | Arranque · **apertura de N4** · Chile cambia de hora el domingo 5 |
| 34 | S02 | 11-IX-2027 | **DAA ventana 1** |
| 35 | S03 | 18-IX-2027 | |
| 36 | S04 | 25-IX-2027 | |
| 37 | S05 | 2-X-2027 | **DAA ventana 2** |
| 38 | S06 | 9-X-2027 | |
| 39 | S07 | 16-X-2027 | **P5 · análisis cerrado** |
| 40 | S08 | 23-X-2027 | |
| 41 | S09 | 30-X-2027 | **G7 · Expediente de cumplimiento** · Europa cambia de hora el domingo 31 |
| 42 | S10 | 6-XI-2027 | **DAA ventana 3** · EE. UU. y Cuba cambian de hora el domingo 7 |
| 43 | S11 | 13-XI-2027 | Ataque cruzado autorizado |
| 44 | S12 | 20-XI-2027 | Congelación de funcionalidad |
| 45 | S13 | 27-XI-2027 | **G8 · Auditoría final** · **DAA ventana 4** |
| 46 | S14 | 4-XII-2027 | **P6 · preprint publicado y manuscrito enviado** |
| 47 | S15 | 11-XII-2027 | Ensayo general · cierre de reintentos |
| 48 | S16 | 18-XII-2027 | **DEMO DAY y SUSTENTACIÓN** |

**Dieciséis fines de semana consecutivos.** Igual que el Cuatrimestre 2, y por la
misma razón (Carta, disp. trans. 2.ª). El receso cae justo antes, el 28 de agosto,
de modo que la generación entra descansada al tramo más exigente del programa.

**Cambios de hora.** Tres transiciones tocan este cuatrimestre y las tres se anuncian
por escrito la semana previa: Chile adelanta el 5-IX-2027 (semana 33), Europa retrasa
el 31-X-2027 (semana 41) y Estados Unidos y Cuba retrasan el 7-XI-2027 (semana 42).
Con el anclaje a 15:00 UTC ninguna afecta a América Latina continental.

### 7 · Panel de sustentación

| Miembro | Procedencia | Vota |
|---|---|:---:|
| Presidencia | Dirección Académica o docente del cuatrimestre | Sí |
| Vocalía técnica | Comité de Auditoría Técnica | Sí |
| **Vocalía externa** | **Profesional ajeno al Instituto** (Carta, art. 23) | Sí |

Quien tenga interés económico, familiar o contractual en el proyecto se abstiene y
la abstención consta en acta (Carta, art. 27).

### 8 · Condiciones del Demo Day

Sesión pública y grabada. Cada estudiante autoriza previamente por escrito la
difusión de su presentación y puede revocarla en 30 días (Carta, art. 58). Se
retransmite con subtitulado en español. El acto se convoca con seis semanas de
antelación para permitir la asistencia de invitados de todos los husos horarios.

### 9 · Después de la graduación

| Beneficio | Alcance |
|---|---|
| Alojamiento del proyecto | 12 meses cubiertos por el Instituto |
| Galería de la generación | Permanente, con licencia revocable |
| Acceso a las grabaciones | 24 meses (Carta, art. 61.1) |
| Comunidad de egresados | Permanente |
| Vía de incorporación docente | Convocatoria abierta a graduados con mención |
| Actualización del artículo | Participación en la respuesta a revisores hasta la publicación en revista, que llegará meses después del Demo Day |
| Oferta comercial de la empresa | **Nunca antes de emitido el certificado**, y nunca presentada por quien evaluó (Carta, art. 63 bis) |

### 10 · Límites declarados de este cuatrimestre

El bloque de negocio y cumplimiento **no sustituye a un abogado, a un contable ni
a un asesor fiscal**, y así se declara en el material, en el certificado y ante el
estudiante. El bloque de pagos se realiza íntegramente en modo de prueba: el
Instituto no interviene en ningún cobro real de sus estudiantes ni asume
responsabilidad sobre la operación comercial que estos emprendan.

### 11 · Bibliografía del cuatrimestre

- Documentación oficial del proveedor de identidad, de funciones en el servidor y
  de la pasarela de pago.
- Reglamento (UE) 2016/679; Lei n.º 58/2019 (Portugal); Ley n.º 8968 (Costa Rica).
- Guías oficiales de la Autoridade Tributária de Portugal y del Registro Nacional y
  la Dirección General de Tributación de Costa Rica.
- Proyecto abierto de seguridad en aplicaciones web: riesgos más frecuentes.
- `ELYSIUM-STANDARDS.md`, funciones F07, F08, F19, F20, F23, F24, F25, F26, F27.
- Material propio: micro-guías `MG33`–`MG48` y fichas `L33`–`L47`.

### 12 · Contrato de expectativas del docente

Se mantiene el del D4 §11, con dos añadidos propios de este cuatrimestre: convocar
**cuatro** Defensas Aleatorias de Autoría por estudiante, y asegurar la presencia
efectiva del auditor externo en la sustentación, cuya ausencia obliga a aplazar la
defensa y no a celebrarla sin él.

### 13 · Registro de erratas y de semanas defectuosas

| Fecha | Semana | Naturaleza | Corrección aplicada | Efecto sobre notas |
|---|---|---|---|---|
| *(vacío al inicio de la generación)* | | | | |

---

*Elysium λ Institute of Development & Research · D6 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# Anexo B.5 · Investigación generacional (derogado)

<p class="doc-sub">Coautoría de los estudiantes, sustituida por el D8 vigente</p>
<p class="doc-file">Fichero de origen: <code>ELYSIUM-INSTITUTE/archivo/ELYSIUM-RESEARCH-PROTOCOL.md</code></p>

> **Cómo leer este documento.** Describe cómo una generación completa produce, en
> 48 semanas y en paralelo a su formación, **un único artículo científico** con
> autoría compartida, datos abiertos y método preinscrito. La Parte I fija los
> principios y elige la línea. La Parte II es el diseño del estudio. La Parte III
> es el cronograma con sus seis compuertas, semana a semana. La Parte IV regula la
> autoría, que es donde estos proyectos suelen fracasar. La Parte V trata ética y
> ciencia abierta. La Parte VI, la publicación y sus contingencias.
>
> Este documento lo aprueba y lo reforma el **Comité de Ética e Integridad
> Científica** (Carta, arts. 22 y 68, Anexo B).
>
> **Compromiso declarado, en tres frases exactas.**
>
> 1. El Instituto **sí se compromete a publicar**, en la semana 46, un **preprint
>    con identificador persistente**, junto con los datos y el código depositados.
>    Eso es publicación real, verificable y citable, y no depende de la decisión de
>    nadie ajeno al Instituto. Es una promesa que siempre se puede cumplir.
> 2. El Instituto **sí se compromete a enviar** el manuscrito a una revista o
>    congreso en esa misma fecha.
> 3. El Instituto **no se compromete a que una revista lo acepte**, porque la
>    revisión por pares tarda entre seis y doce meses y su resultado no está en
>    nuestras manos.
>
> Decir «publicamos un paper al final del curso» sin esta distinción sería falso, y
> el art. 18 de la Carta lo prohíbe. Decir «publicamos el preprint y enviamos a
> revista» es exacto, y es bastante más de lo que ofrece cualquier programa
> comparable.

---

## PARTE I · PRINCIPIOS Y ELECCIÓN DE LA LÍNEA

### 1 · Los seis principios de la investigación generacional

1. **La pregunta debe poder responderse con lo que el currículo ya enseña.** Si la
   investigación exige destrezas ajenas al programa, se convierte en una carga y se
   abandona. Aquí ocurre lo contrario: recoger los datos **es** practicar auditoría
   de accesibilidad y rendimiento, que es `RA-A4`, `RA-A5` y `RA-F2`.
2. **Un dato por estudiante, un resultado por generación.** Nadie investiga solo y
   nadie investiga un tema propio. La unidad es la cohorte (Carta, art. 17).
3. **Preinscripción antes de mirar los datos.** El protocolo se registra en la
   semana 16, mucho antes de que exista el primer resultado.
4. **Los resultados adversos se publican igual.** Si la hipótesis se refuta, el
   artículo dice que se refutó. El art. 15 de la Carta obliga a lo mismo con los
   datos del propio Instituto.
5. **Datos y código abiertos por defecto**, con las excepciones motivadas del art.
   14 de la Carta.
6. **Autoría por contribución declarada, no por presencia.** Se aplica la taxonomía
   de roles de contribución CRediT, con catorce roles, publicada junto al artículo.

### 2 · Por qué esta línea y no otra

Se evaluaron tres candidatas antes de elegir.

| Línea candidata | A favor | En contra | Decisión |
|---|---|---|:---:|
| **A · Auditoría transversal de la accesibilidad y el rendimiento de sitios de pymes hispanohablantes** | Usa exactamente las destrezas del currículo; no trata con personas; produce un conjunto de datos que hoy no existe; encaja con la misión declarada de la empresa; es publicable. | Requiere disciplina de muestreo y control de calidad. | **Elegida** |
| **B · Efecto de la Escalera de IA sobre el aprendizaje de programadores noveles** | Pregunta viva y muy relevante en 2026. | Los estudiantes serían a la vez sujetos e investigadores; conflicto de interés estructural; el docente evalúa a los sujetos; muestra pequeña. | **Separada.** Se conduce como investigación institucional del profesorado, no como artículo generacional (ver §3). |
| **C · Estudio de caso de las plataformas construidas por la generación** | Material abundante y propio. | Sin grupo de comparación, sin generalización posible, riesgo alto de autocomplacencia. | Descartada como artículo; se conserva como informe técnico interno. |

#### 2.1 · Justificación sustantiva de la línea A

Desde el **28 de junio de 2025** es aplicable la Directiva (UE) 2019/882, conocida
como Acta Europea de Accesibilidad, que impone requisitos de accesibilidad a
servicios digitales dirigidos a consumidores en la Unión, con exenciones limitadas
para microempresas y con la norma **EN 301 549** como referencia técnica de
presunción de conformidad. La versión de esa norma que incorpora **WCAG 2.2** se
espera publicada en 2026, lo que abre una ventana temporal singular: **existe una
obligación jurídica reciente y no se conoce el grado real de cumplimiento en el
tejido de pequeñas y medianas empresas de habla hispana**, ni dentro ni fuera de la
Unión.

Nadie ha publicado, hasta donde el Instituto conoce, una medición transversal
comparable que cubra simultáneamente países del Espacio Económico Europeo y de
América Latina con un mismo instrumento. Esa es la contribución.

### 3 · La línea B y su separación

La investigación sobre el efecto de la Escalera de IA se conduce como **estudio
institucional del profesorado**, con datos anonimizados, participación opcional y
revocable, y publicación separada firmada por el profesorado. Nunca condiciona la
calificación. El motivo de la separación es que un estudiante no puede ser a la vez
sujeto de estudio y coautor del estudio que lo estudia sin comprometer tanto su
libertad de participar como la validez del resultado. El CEIC dictamina sobre ella
por separado y con requisitos más estrictos.

---

## PARTE II · DISEÑO DEL ESTUDIO

### 4 · Especificación

#### 4.1 · Título de trabajo

> *Conformidad con WCAG 2.2 AA y rendimiento web de los sitios de pequeñas y
> medianas empresas iberoamericanas ante el Acta Europea de Accesibilidad:
> auditoría transversal en diez países.*

#### 4.2 · Preguntas de investigación

| Cód. | Pregunta |
|---|---|
| **PI-1** | ¿Qué proporción de los sitios de pymes hispanohablantes presenta violaciones detectables automáticamente de WCAG 2.2 nivel AA, y de qué tipo? |
| **PI-2** | ¿Difiere la conformidad entre países sujetos al Acta Europea de Accesibilidad y países de América Latina no sujetos a ella? |
| **PI-3** | ¿Qué predice mejor la conformidad: la jurisdicción, el sector económico, o la tecnología con la que el sitio está construido? |
| **PI-4** | ¿Qué relación existe entre conformidad de accesibilidad y métricas de rendimiento (Core Web Vitals) en el mismo sitio? |
| **PI-5** | ¿Qué proporción de los criterios incumplidos detectados manualmente **no** es detectable con herramienta automática? |

**PI-5 es metodológicamente la más valiosa.** Cuantifica la brecha entre la
auditoría automática, que es lo que casi todo el sector usa, y la verificación
manual, que es lo que la norma realmente exige. Y es la que produce el resultado
más útil para la práctica profesional.

#### 4.3 · Hipótesis preinscritas

| Cód. | Hipótesis | Criterio de refutación |
|---|---|---|
| **H1** | Menos del 10 % de los sitios estará libre de violaciones automáticas serias o críticas. | Si la proporción libre de violaciones supera el 10 %, H1 queda refutada. |
| **H2** | Los sitios de jurisdicciones sujetas al Acta presentarán mayor conformidad que los de América Latina. | Diferencia no significativa, o de signo contrario, refuta H2. |
| **H3** | La tecnología de construcción explicará más varianza que la jurisdicción. | Si el coeficiente de jurisdicción supera al de tecnología en el modelo, H3 queda refutada. |
| **H4** | Existirá correlación positiva moderada entre conformidad y rendimiento. | Correlación nula o negativa refuta H4. |
| **H5** | Al menos el 30 % de los incumplimientos detectados manualmente no será detectable de forma automática. | Una proporción menor refuta H5. |

#### 4.4 · Diseño

Estudio **observacional, transversal y multipaís**, sin intervención. La unidad de
análisis es el sitio web; la unidad de muestreo es la empresa.

#### 4.5 · Población y marco muestral

**Población.** Empresas de menos de 250 personas empleadas, con sitio web público y
activo, domiciliadas en alguno de los **diez países** del estudio.

**Marco muestral.** Combinación de directorios empresariales públicos, datos
abiertos de registros mercantiles donde existan y listados sectoriales públicos. El
marco se construye y se congela **antes** de la extracción de la muestra, y se
publica junto con los datos.

**Estratificación.** Doble: por **país** (10 estratos) y por **sector** (4 estratos:
comercio minorista, hostelería y turismo, salud y bienestar, servicios profesionales
y oficios). Cuarenta celdas en total.

**Tamaño y reparto.** Con un aula de diez a doce personas (Carta, art. 41), el
objetivo es **600 sitios a razón de 50 por estudiante**, con mínimo aceptable de
**400**. El reparto por país **no es proporcional**: sobremuestrea deliberadamente
las dos jurisdicciones sujetas al Acta, porque son la mitad de la comparación
principal y sólo hay dos.

| Bloque | Países | Sitios por país | Subtotal |
|---|---|---:|---:|
| **Sujetos al Acta (EEE)** | España, Portugal | 90 | **180** |
| **No sujetos (América Latina)** | México, Colombia, Argentina, Perú, Chile, Ecuador, Costa Rica, Uruguay | 52–53 | **420** |
| | | | **600** |

Submuestra de auditoría manual: **10 %**, es decir 60 sitios, evaluados **por dos
personas de forma independiente y ciega**, lo que suma 120 evaluaciones, unas 10 por
estudiante.

**Selección.** Aleatoria simple dentro de cada celda país-sector mediante semilla
declarada y publicada, para que la selección sea reproducible.

> ### Limitación estructural que se declara desde el protocolo
>
> Sólo **España** es un país hispanohablante sujeto al Acta Europea de
> Accesibilidad. Incluir **Portugal** como segunda jurisdicción sujeta reduce el
> problema, pero lo hace a costa de introducir una lengua distinta y no lo elimina:
> con dos países en un lado y ocho en el otro, **el efecto de la jurisdicción no
> puede separarse limpiamente de un efecto país**.
>
> Esto no invalida PI-2, pero obliga a tres cosas, y las tres se comprometen aquí:
> modelar el país como efecto aleatorio; reportar el efecto de jurisdicción **con su
> intervalo de confianza y sin lenguaje causal**; y dedicar un apartado propio de la
> sección de limitaciones a esta confusión. Una alternativa habría sido comparar
> España contra América Latina sin más, y habría sido peor: el mismo problema, sin
> declararlo.

#### 4.6 · Variables

| Tipo | Variable | Medición |
|---|---|---|
| **Dependiente** | Violaciones automáticas serias o críticas | Recuento, `axe-core` sobre tres páginas por sitio |
| **Dependiente** | Sitio conforme | Binaria: cero violaciones serias o críticas |
| **Dependiente** | Rendimiento | LCP, CLS, INP, puntuación Lighthouse móvil |
| **Dependiente** | Incumplimientos manuales | Recuento por criterio, en la submuestra |
| **Independiente** | Jurisdicción | Sujeta al Acta / no sujeta |
| **Independiente** | País | 20 niveles |
| **Independiente** | Sector | 6 niveles |
| **Independiente** | Tecnología | Gestor de contenidos, constructor visual, marco moderno, artesanal |
| **Control** | Indicio de tamaño de empresa | Proxy documentado |
| **Control** | Antigüedad aparente del sitio | Cabeceras y metadatos |
| **Control** | Idioma declarado y multilingüismo | Atributo `lang` |

#### 4.7 · Instrumentos

**Instrumento automático (`elysium-audit`).** Programa en Node.js que, para cada
sitio: verifica que responde, respeta el fichero de exclusión de rastreo, aplica
límite de una petición cada tres segundos por dominio, carga tres páginas (portada,
una interior y la de contacto si existe), ejecuta `axe-core` con el conjunto de
reglas de WCAG 2.2 AA, ejecuta Lighthouse en perfil móvil con limitación, detecta la
tecnología, y **almacena la evidencia** (captura y árbol de accesibilidad) junto al
resultado. El programa es el mismo para todos, se versiona y su versión se registra
en cada observación.

**Instrumento manual (`protocolo-manual-λ`).** Lista de 18 comprobaciones que la
herramienta automática no puede resolver: significado real de los textos
alternativos, orden lógico del foco, calidad de las etiquetas de enlace fuera de
contexto, comprensibilidad de los mensajes de error, funcionamiento efectivo del
recorrido con lector de pantalla, y compleción de una tarea principal. **Cada sitio
de la submuestra lo evalúan dos estudiantes de forma independiente y ciega**, y la
discrepancia la resuelve un tercero.

#### 4.8 · Análisis

| Pregunta | Técnica |
|---|---|
| PI-1 | Descriptiva: proporciones e intervalos de confianza al 95 %, con ponderación por diseño muestral. |
| PI-2 | Modelo lineal generalizado mixto, familia binomial, con país como efecto aleatorio y jurisdicción como efecto fijo. |
| PI-3 | Comparación de modelos anidados; varianza explicada por bloque de predictores. |
| PI-4 | Correlación de Spearman y modelo de regresión con controles. |
| PI-5 | Proporción de criterios detectados sólo manualmente; concordancia entre evaluadores mediante **kappa de Cohen** sobre la submuestra doble. |

**Umbral de significación** 0,05, con **corrección por comparaciones múltiples** de
Benjamini-Hochberg. Todo análisis no previsto en el protocolo se etiqueta de forma
explícita como **exploratorio** en el manuscrito.

#### 4.9 · Control de calidad de los datos

| Control | Cuándo | Quién |
|---|---|---|
| Validación de esquema de cada observación | Automática, en la ingesta | Programa |
| Doble captura del 5 % de los sitios | Continua | Pares cruzados |
| Revisión de valores atípicos y de sitios inaccesibles | Semanal | Comité de datos de la generación |
| Registro de desviaciones respecto al protocolo | Continua | Cualquiera, obligatorio |
| Bloqueo del lote | Semana 32 | Dirección Académica y CEIC |

**Regla de oro.** Un dato sin evidencia almacenada no entra en el lote. Y ningún
dato se corrige después del bloqueo de la semana 32 sin nota pública de corrección.

---

## PARTE III · CRONOGRAMA DE 48 SEMANAS

### 5 · Las seis compuertas

| Comp. | Semana | Qué se cierra | Quién aprueba | Efecto si no se supera |
|:---:|:---:|---|---|---|
| **P1** | 10 | Pregunta, variables, hipótesis y criterios de refutación | CEIC | Se aplaza dos semanas; si no, la generación investiga sobre protocolo del año anterior |
| **P2** | 16 | Protocolo completo **preinscrito** y registrado públicamente | CEIC | Bloquea el inicio de la recogida |
| **P3** | 24 | Instrumento cerrado y ensayo piloto con 60 sitios | Dirección Académica | Bloquea la recogida masiva |
| **P4** | 32 | Lote de datos completo, validado y **bloqueado** | CEIC + Dirección | Bloquea el análisis |
| **P5** | 39 | Análisis cerrado conforme al protocolo | CEIC | Bloquea la redacción |
| **P6** | 46 | Manuscrito enviado, datos y código depositados | CEIC | Impide acreditar coautoría |

**Las compuertas P1 a P6 son requisito de coautoría, no de graduación.** Se puede
graduar sin figurar en el artículo; no se puede figurar en el artículo sin haberlas
atravesado. La distinción protege tanto al estudiante que no puede sostener la carga
como a la integridad de la firma.

### 6 · Actividad semanal

| Semanas | Fase | Actividad | Tiempo/semana |
|:---:|---|---|:---:|
| 0 | Consentimiento | Firma del consentimiento informado, revocable en cualquier momento | 15 min |
| 1–9 | Latente | Ninguna. El currículo construye las destrezas necesarias. | 0 |
| **10** | **P1** | Sesión de formulación (C1·S10, tramo 01:20–02:00). Pregunta y variables. | 40 min |
| 11–15 | Revisión | Lectura repartida: cada estudiante resume **cuatro** trabajos previos en una ficha común. Con un aula de doce, el estado del arte se construye con unas 48 fichas, que es suficiente para una revisión acotada y honesta. | 30 min |
| **16** | **P2** | Sesión de preinscripción (C1·S16). Registro público del protocolo. | 40 min |
| 17–19 | Marco muestral | Construcción y congelación del marco por país y sector. | 20 min |
| 20–23 | Instrumento | Desarrollo colaborativo de `elysium-audit`. Coincide con el módulo de asincronía y peticiones de red: **el instrumento es el laboratorio**. | 30 min |
| **24** | **P3** | Sesión de cierre del instrumento y piloto de 60 sitios (C2·S08). | 40 min |
| 25–31 | **Recogida** | 50 sitios por estudiante, unos 7 por semana. Auditoría automática más evidencia. | 45 min |
| 29–31 | Submuestra manual | 10 evaluaciones por estudiante con el protocolo manual, doble ciego. | 30 min |
| **32** | **P4** | Sesión de validación y bloqueo del lote (C2·S16). | 60 min |
| 33–35 | Preparación | Limpieza documentada, cálculo de concordancia entre evaluadores, ponderaciones. | 30 min |
| 36–38 | Análisis | Ejecución del análisis preinscrito por **dos equipos independientes** que no se comunican entre sí; los resultados deben coincidir antes de darse por buenos. | 40 min |
| **39** | **P5** | Sesión de resultados (C3·S07). Se presentan también los que refutan. | 60 min |
| 40–43 | Redacción | Redacción por secciones asignadas. Cada sección, dos personas. | 45 min |
| 44–45 | Revisión interna | Revisión por pares cruzada dentro de la generación, con informe estructurado. | 45 min |
| **46** | **P6** | Sesión de envío (C3·S14). Roles CRediT, aprobación de autoría, depósito y envío. | 60 min |
| 47–48 | Difusión | Preprint anunciado; resultados presentados en el Demo Day. | 20 min |
| Post | Revisores | Respuesta a revisores, coordinada por el autor de correspondencia, abierta a toda la autoría. | — |

**Carga total estimada:** unas 36 horas por estudiante en 48 semanas, coherente con
el fondo previsto en el D2 §7.

### 7 · Asignación de secciones de redacción

Con un aula de diez a doce personas, **cada estudiante redacta una sección y revisa
otra**. Nadie queda sin escribir, que es la condición de la coautoría (§8.2).

| Sección | Redacta | Revisa | Semanas |
|---|:---:|:---:|:---:|
| Introducción y motivación | 1 | 1 | 40–42 |
| Marco normativo (Acta, EN 301 549, WCAG 2.2) | 1 | 1 | 40–42 |
| Trabajos previos, sobre las fichas de las semanas 11–15 | 2 | 2 | 40–43 |
| Método y muestreo | 2 | 2 | 40–42 |
| Resultados | 2 | 2 | 41–43 |
| Discusión | 1 | 1 | 42–44 |
| **Limitaciones y amenazas a la validez**, incluida la confusión jurisdicción-país | 1 | 1 | 43–44 |
| Conclusiones y trabajo futuro | 1 | 1 | 43–44 |
| Resumen, palabras clave y declaración de datos | 1 | todos | 44–45 |
| Coordinación editorial y estilo | Autor de correspondencia | — | 40–46 |

Nadie revisa la sección que escribió. La asignación de revisión se publica en la
semana 40 y no se altera.

---

## PARTE IV · AUTORÍA

### 8 · Criterios

Para figurar como autor deben cumplirse **los cuatro**:

1. **Contribución sustantiva** acreditada en al menos **dos** roles CRediT, uno de
   los cuales debe ser *Investigation* (recogida de datos), *Formal analysis* o
   *Software*.
2. **Participación en la redacción** o en la revisión crítica de al menos una
   sección.
3. **Aprobación explícita** de la versión enviada, registrada por escrito.
4. **Responsabilidad**: capacidad de explicar y defender la parte del trabajo que le
   corresponde. Es el art. 10 de la Carta aplicado a la ciencia.

Quien contribuya sin cumplir los cuatro figura en **agradecimientos** con su aporte
descrito. No existe la autoría honoraria ni la autoría por matrícula.

### 9 · Orden de firma

| Posición | Quién | Criterio |
|---|---|---|
| **Primeras posiciones** | Estudiantes | **Orden alfabético por primer apellido**, con nota al pie que lo declara y remite a la declaración CRediT para las contribuciones individuales |
| **Penúltima** | Coordinación estudiantil (2 personas elegidas por la Asamblea) | Coordinación efectiva del trabajo |
| **Última** | Dirección Académica / docente responsable | Supervisión y responsabilidad final |
| **Correspondencia** | Docente responsable | Interlocución con la revista y con los revisores |

El orden alfabético con declaración CRediT es la práctica de las colaboraciones
grandes y evita la disputa jerárquica en un grupo que no tiene forma objetiva de
ordenarse por mérito relativo. En un aula de diez, donde todo el mundo conoce el
trabajo de todo el mundo, esa disputa sería además especialmente corrosiva: el orden
alfabético la desactiva de raíz y la declaración CRediT conserva el detalle.

### 10 · Declaración CRediT

Se publica junto al artículo, con los catorce roles de la taxonomía:
conceptualización, curación de datos, análisis formal, obtención de financiación,
investigación, metodología, administración del proyecto, recursos, software,
supervisión, validación, visualización, redacción del borrador original, y revisión
y edición.

Cada persona declara sus roles; la declaración la valida el CEIC contra el registro
de actividad, que es público dentro de la generación. **Declarar un rol no ejercido
es falta muy grave I-05** (Carta, art. 52).

### 11 · Disputas de autoría

Las resuelve el CEIC con el registro de contribuciones a la vista y con audiencia
de las partes. Su decisión es vinculante. El registro de contribuciones se
actualiza semanalmente, precisamente para que la disputa se resuelva con datos y no
con memoria.

### 12 · Pérdida del derecho de autoría

Se pierde por: falta grave firme de integridad académica durante el periodo
(Carta, art. 55); no superar una compuerta P sin causa justificada; o negativa a
aprobar la versión final, en cuyo caso la persona es retirada de la firma y consta
en agradecimientos si así lo solicita.

---

## PARTE V · ÉTICA Y CIENCIA ABIERTA

### 13 · Dictamen ético

El protocolo se somete al **CEIC** en la semana 14 y su dictamen es requisito de la
compuerta P2. Al menos un miembro del CEIC es externo a Elysium λ y sin relación
económica con la empresa (Carta, art. 22).

**Naturaleza del estudio.** No hay sujetos humanos: se auditan sitios web públicos.
Aun así, hay tres cuestiones éticas reales y el protocolo las resuelve de forma
expresa.

#### 13.1 · No perjudicar a las empresas auditadas

| Riesgo | Regla |
|---|---|
| Exposición pública de una empresa concreta como incumplidora | **El conjunto de datos publicado no contiene URL ni razón social identificable.** Se publica un identificador seudonimizado, el país, el sector, la tecnología y las métricas. La correspondencia se conserva bajo custodia y no se publica. |
| El artículo señala empresas | Prohibido nombrar empresas concretas en el texto, en tablas o en capturas. Las capturas se recortan y se anonimizan. |
| El estudio se usa comercialmente contra los auditados | **Prohibido usar el marco muestral como lista de prospectos comerciales de Elysium λ.** Es una prohibición dura, se declara en el artículo, y su incumplimiento es falta muy grave. |

> Esta última regla merece énfasis. Elysium λ vende infraestructura digital a
> pequeñas y medianas empresas, y la tentación de convertir 1.200 auditorías en
> 1.200 clientes potenciales es evidente. Confundir investigación con captación
> destruiría la credibilidad de ambas. El marco muestral se custodia separado de
> todo sistema comercial y el CEIC audita esa separación.

#### 13.2 · No dañar la infraestructura auditada

Respeto del fichero de exclusión de rastreo; límite de una petición cada tres
segundos por dominio; identificación honesta del agente de usuario con enlace a la
página del estudio; sin pruebas de carga; sin intento alguno de acceso no público.
Un sitio que responde con error o que bloquea se registra como tal y **no se
reintenta más de dos veces**.

#### 13.3 · Consentimiento de los estudiantes

Participar en la investigación es **obligatorio como actividad formativa** y
**voluntario como coautoría**: quien no desee figurar en la firma lo declara y
mantiene su calificación intacta. El consentimiento para el uso de sus datos
personales (línea B) es separado, explícito y revocable en cualquier momento sin
consecuencia académica (Carta, art. 61.5).

### 14 · Preinscripción y ciencia abierta

| Elemento | Dónde | Cuándo | Licencia |
|---|---|:---:|---|
| **Protocolo preinscrito** | Repositorio público de preinscripciones | Semana 16 | CC BY 4.0 |
| **Marco muestral congelado** (seudonimizado) | Repositorio de datos con identificador persistente | Semana 19 | CC BY 4.0 |
| **Código del instrumento** | Repositorio público del Instituto | Semana 24 | MIT |
| **Conjunto de datos** (seudonimizado) | Repositorio de datos con identificador persistente | Semana 46 | CC BY 4.0 |
| **Código de análisis y cuadernos** | Repositorio público | Semana 46 | MIT |
| **Preprint** | Repositorio de preprints, área de interacción persona-computador | Semana 46 | CC BY 4.0 |
| **Artículo** | Foro de destino | Tras revisión | Acceso abierto |

**Toda desviación respecto al protocolo preinscrito se declara en el manuscrito**,
en una tabla titulada *Desviaciones respecto al protocolo*, con su motivo. Un
estudio preinscrito que oculta desviaciones es peor que uno no preinscrito, porque
añade una apariencia de rigor que no tiene.

---

## PARTE VI · PUBLICACIÓN Y CONTINGENCIAS

### 15 · Estrategia de destino

#### 15.0 · Vocabulario obligatorio

Tres palabras que el Instituto no puede usar como sinónimos, ni en el aula, ni en la
convocatoria, ni en el certificado:

| Palabra | Qué significa aquí | ¿Se promete? |
|---|---|:---:|
| **Publicar el preprint** | Depositar el manuscrito en un repositorio abierto, con identificador persistente, citable desde ese mismo día. | **Sí** |
| **Enviar** | Someter el manuscrito a una revista o congreso e iniciar su revisión por pares. | **Sí** |
| **Publicar en revista** | Que ese foro lo acepte tras revisión. Ocurre meses después del Demo Day, si ocurre. | **No** |

Cuando el syllabus del Cuatrimestre 3 dice «publicación del paper», se refiere de
forma estricta a las dos primeras filas, que suceden ambas en la semana 46.

| Prioridad | Destino | Tipo | Por qué |
|:---:|---|---|---|
| **0** | Preprint en repositorio abierto | Preprint | **Garantiza el resultado.** Se deposita el mismo día del envío, en la semana 46. No depende de nadie. |
| 1 | Congreso internacional de accesibilidad web (modalidad de comunicación) | Conferencia | Ajuste temático perfecto, ciclo de revisión corto, admite trabajos de alcance acotado. |
| 2 | Revista de acceso universal en la sociedad de la información | Revista indexada | Alcance temático directo, admite estudios transversales. |
| 3 | Revista iberoamericana de información y comunicación científica, en español | Revista indexada | Permite publicar en español y llegar al público que el estudio describe. |
| 4 | Informe técnico del Instituto con identificador persistente | Informe | Última red de seguridad. Siempre se publica. |

**Publicación en dos lenguas.** Se recomienda publicar el artículo en inglés y una
versión divulgativa en español dirigida a las asociaciones empresariales de los
países estudiados. La segunda no es producción científica, pero es la que produce el
efecto que la misión del Instituto persigue.

### 16 · Contingencias

| Si ocurre | Entonces |
|---|---|
| Se recogen menos de 600 sitios | Se reduce el alcance a los países con estrato completo y se declara la limitación. El estudio sigue siendo válido, sólo menos generalizable. |
| La concordancia entre evaluadores es baja (κ < 0,60) | Se reentrena, se reevalúa la submuestra completa y se declara el proceso. Si persiste, se reporta la concordancia como resultado y se acota la conclusión de PI-5. |
| Todas las hipótesis se refutan | Se publica igual. Un resultado nulo bien medido sobre una obligación jurídica reciente es publicable y útil. |
| El marco muestral resulta sesgado | Se documenta el sesgo, se pondera si es posible, y se declara como amenaza a la validez externa. |
| La revista rechaza | El preprint ya está publicado con identificador persistente. Se atienden las críticas y se reenvía al destino siguiente de la lista. |
| Una empresa auditada solicita la retirada de sus datos | Se retira la observación del conjunto publicado, se anota en el registro de correcciones y se recalcula si el análisis ya estaba publicado. |

### 17 · Continuidad entre generaciones

Cada generación **no empieza de cero**. La Generación I produce el instrumento, el
marco muestral y la línea base. La Generación II puede:

- **Replicar** la medición un año después y estudiar la evolución, que es
  exactamente lo que hace falta para saber si el Acta produjo efecto.
- **Profundizar** en la brecha entre auditoría automática y manual (PI-5).
- **Extender** a otra dimensión, como el cumplimiento en materia de protección de
  datos o el rendimiento en redes móviles de baja calidad.

Al cabo de tres generaciones, el Instituto dispone de una **serie temporal propia**
sobre accesibilidad de pymes hispanohablantes, que es un activo científico y
reputacional que ninguna consultora tiene.

---

## ANEXOS

### Anexo I · Consentimiento informado del estudiante

```markdown
# Consentimiento informado · Investigación Generacional · Generación ____

**Qué es.** Durante las 48 semanas del programa, la generación desarrolla en
conjunto una investigación científica que se enviará a publicación. Su
participación en las actividades de investigación forma parte de la formación y se
evalúa como tal.

**Qué se le pide.** Auditar aproximadamente 40 sitios web públicos siguiendo un
protocolo común, participar en el análisis y redactar o revisar una sección.

**Coautoría.** Si cumple los cuatro criterios del §8 de este protocolo, figurará
como coautor del artículo. **La coautoría es voluntaria**: puede pedir no figurar,
en cualquier momento antes del envío, sin ninguna consecuencia sobre su
calificación.
  ☐ Deseo figurar como coautor    ☐ No deseo figurar como coautor

**Sus datos.** La investigación principal **no** recoge datos personales suyos.
De forma separada, el Instituto realiza estudios sobre su propia docencia con datos
anonimizados. Esa participación es independiente, opcional y revocable.
  ☐ Autorizo el uso anonimizado de mis datos académicos con fines de investigación
     institucional
  ☐ No lo autorizo

**Revocación.** Puede revocar cualquiera de estas autorizaciones escribiendo a la
Secretaría Académica, sin dar explicaciones y sin efecto alguno sobre su
evaluación. Si revoca después del envío del artículo, se atenderá conforme a las
normas del foro de publicación.

**Prohibición comercial.** Los datos recogidos **no se usarán con fines comerciales
por Elysium λ Development & Research**, y en particular no se usarán como lista de
prospectos. Esta prohibición es auditada por el Comité de Ética.

Nombre: ____________  Firma: ____________  Fecha: ____________
```

### Anexo II · Plantilla de ficha de trabajo previo (semanas 11–15)

```markdown
# Ficha F-__ · [Cita completa]
**Revisor:** ____ · **Fecha:** ____

1. **Pregunta que se plantea el trabajo:**
2. **Método y muestra (n, país, año, instrumento):**
3. **Resultado principal, en una frase con su número:**
4. **Limitación más seria reconocida por los autores:**
5. **Limitación que los autores NO reconocen:**
6. **Qué aporta a nuestra pregunta (PI-1 a PI-5):**
7. **Se cita en la sección:** ☐ Introducción ☐ Trabajos previos ☐ Método ☐ Discusión
```

### Anexo III · Lista de comprobación previa al envío (compuerta P6)

```text
□ Todas las hipótesis preinscritas están reportadas, incluidas las refutadas
□ Tabla de desviaciones respecto al protocolo completa
□ Análisis exploratorios etiquetados como tales, sin excepción
□ Intervalos de confianza junto a toda estimación puntual
□ Corrección por comparaciones múltiples aplicada y declarada
□ Kappa de Cohen reportado para la submuestra manual
□ Conjunto de datos depositado y con identificador persistente
□ Código del instrumento y del análisis depositados con licencia
□ El análisis se reproduce de principio a fin desde el repositorio, verificado por
  una persona que no lo escribió
□ Ninguna empresa identificable en texto, tablas, figuras ni capturas
□ Declaración CRediT completa y validada por el CEIC
□ Aprobación escrita de la versión final por toda la autoría
□ Declaración de conflictos de interés, incluida la relación de los autores con
  Elysium λ Development & Research
□ Declaración del uso de IA en la redacción, conforme a la política del foro
□ Preprint depositado el mismo día del envío
□ Versión divulgativa en español planificada
```

---

*Elysium λ Institute of Development & Research · D8 · «Abstrahere, aedificare, probare.»*

